from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from sentence_transformers import SentenceTransformer, util
import pdfplumber
import docx
import io
import re
import json
import requests
import os
import time
import secrets
from dotenv import load_dotenv

app = FastAPI()

semantic_model = SentenceTransformer('all-MiniLM-L6-v2')

SKILL_SIMILARITY_THRESHOLD = 0.6

# Locally this reads AiService/.env. On Render the same variables are
# set from the dashboard instead, so no code change is needed there.
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Shared secret between the .NET backend and this service. When AI_SERVICE_KEY is
# set, every POST endpoint needs a matching X-API-Key header. When it is not set
# (local development) the check is skipped.
AI_SERVICE_KEY = os.getenv("AI_SERVICE_KEY")


def require_api_key(x_api_key: str = Header(default="")):
    if not AI_SERVICE_KEY:
        return
    if not secrets.compare_digest(x_api_key.encode(), AI_SERVICE_KEY.encode()):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_text_from_docx(file_bytes: bytes) -> str:
    document = docx.Document(io.BytesIO(file_bytes))
    text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    return text


def extract_text(filename: str, file_bytes: bytes) -> str:
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower_name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type for '{filename}'. Only .pdf and .docx are supported."
        )


def call_llm(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="AI service misconfigured: GROQ_API_KEY is not set."
        )

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0,
        # JSON mode: the model must return a valid JSON object.
        "response_format": {"type": "json_object"},
        # gpt-oss models "think" before answering, and that hidden thinking is
        # counted against this budget. A small budget can leave an empty answer.
        "max_completion_tokens": 4096,
    }
    if GROQ_MODEL.startswith("openai/gpt-oss"):
        # Plain extraction does not need deep reasoning. Only sent for gpt-oss,
        # because other models reject this parameter with a 400.
        payload["reasoning_effort"] = "low"

    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=60,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]

            if content and content.strip():
                return content

            # The request succeeded but the answer is empty: try again.
            if attempt < max_attempts:
                time.sleep(1)
                continue
            raise HTTPException(
                status_code=502,
                detail="AI service error: Groq returned an empty answer."
            )

        except requests.exceptions.ConnectionError:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable: could not reach the Groq API."
            )
        except requests.exceptions.Timeout:
            raise HTTPException(
                status_code=504,
                detail="AI service timed out: Groq took too long to respond. Try again."
            )
        except requests.exceptions.HTTPError as e:
            status = e.response.status_code

            # Groq sometimes fails to produce valid JSON; a retry usually works.
            if status == 400 and "json_validate_failed" in e.response.text and attempt < max_attempts:
                time.sleep(1)
                continue

            if status == 401:
                detail = "AI service misconfigured: Groq rejected the API key."
            elif status == 429:
                detail = "AI service is busy (Groq rate limit reached). Try again in a minute."
            else:
                # Includes Groq's own message (e.g. "model has been decommissioned").
                detail = f"AI service error from Groq ({status}): {e.response.text[:200]}"
            raise HTTPException(status_code=502, detail=detail)
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=502,
                detail=f"AI service error: unexpected error while contacting Groq ({str(e)})."
            )

    raise HTTPException(
        status_code=502,
        detail="AI service error: no usable answer from Groq."
    )


def calculate_job_match(resume_text: str, job_text: str) -> float:
    resume_embedding = semantic_model.encode(resume_text)
    job_embedding = semantic_model.encode(job_text)
    similarity_score = util.cos_sim(resume_embedding, job_embedding).item()
    return round(similarity_score * 100, 2)


def extract_skills_via_llm(text: str) -> list:
    # Groq's JSON mode only accepts a JSON object at the top level
    # (a bare array is rejected), so the skills are requested inside
    # a {"skills": [...]} wrapper.
    prompt = f"""Read the following text (a resume or job description) and extract every individual skill, technology, tool, framework, or language mentioned — even if it is described inside a sentence rather than listed as a keyword.

Return ONLY a valid JSON object with a single key "skills" whose value is an array of short skill name strings, like:
{{"skills": ["Python", "React", "AWS", "Machine Learning"]}}

Rules:
- Each item must be a short skill name (a few words max), not a sentence.
- Do not group skills into categories — return one flat list.
- Do not repeat the same skill twice.
- Return only the JSON object, nothing else.

Text:
{text}

Return only the JSON object."""

    raw_output = call_llm(prompt)

    try:
        parsed = json.loads(raw_output)

        if isinstance(parsed, list):
            skills = parsed
        elif isinstance(parsed, dict):
            list_value = None
            for value in parsed.values():
                if isinstance(value, list):
                    list_value = value
                    break
            if list_value is not None:
                skills = list_value
            else:
                skills = list(parsed.keys())
        else:
            skills = []

        return [str(skill).strip() for skill in skills if str(skill).strip()]

    except json.JSONDecodeError:
        return []


def compare_skill_lists(resume_skills: list, job_skills: list) -> dict:
    if not job_skills or not resume_skills:
        return {
            "matchedPairs": [],
            "skillMatchPercentage": 0.0
        }

    resume_embeddings = semantic_model.encode(resume_skills)
    job_embeddings = semantic_model.encode(job_skills)

    similarity_matrix = util.cos_sim(job_embeddings, resume_embeddings)

    matched_pairs = []
    matched_job_skill_count = 0

    for job_index, job_skill in enumerate(job_skills):
        best_resume_index = similarity_matrix[job_index].argmax().item()
        best_score = similarity_matrix[job_index][best_resume_index].item()

        if best_score >= SKILL_SIMILARITY_THRESHOLD:
            matched_job_skill_count += 1
            matched_pairs.append({
                "jobSkill": job_skill,
                "matchedResumeSkill": resume_skills[best_resume_index],
                "similarity": round(best_score, 3)
            })

    skill_match_percentage = round((matched_job_skill_count / len(job_skills)) * 100, 2)

    return {
        "matchedPairs": matched_pairs,
        "skillMatchPercentage": skill_match_percentage
    }


def extract_structured_data_via_llm(resume_text: str) -> dict:
    prompt = f"""Extract the following information from this resume and return ONLY valid JSON, nothing else — no explanation, no markdown formatting.

Fields to extract:
- name (string)
- email (string)
- phone (string)
- location (string)
- skills (array of strings)
- workExperience (array of objects, each with: company, role, duration — duration MUST be a short date range like "Jan 2023 - Present" or "2 years", NEVER a job description or long text)
- education (array of objects, each with: degree, institution, year)
- certifications (array of strings)
- projects (array of objects, each with: name, description)
- summary (string, a brief professional summary)

If a field is not found in the resume, use null or an empty array.

Resume text:
{resume_text}

Return only the JSON object, no other text."""

    raw_output = call_llm(prompt)

    try:
        structured_data = json.loads(raw_output)
    except json.JSONDecodeError:
        structured_data = {"error": "Failed to parse model output as JSON", "raw": raw_output}

    return structured_data


@app.get("/")
def read_root():
    return {"message": "AI Service is running!"}


@app.post("/extract-skills", dependencies=[Depends(require_api_key)])
async def extract_skills(file: UploadFile = File(...)):
    file_bytes = await file.read()
    text = extract_text(file.filename, file_bytes)
    found_skills = extract_skills_via_llm(text)

    return {
        "fileName": file.filename,
        "skillsFound": found_skills,
        "totalSkillsFound": len(found_skills)
    }


@app.post("/resume-summary", dependencies=[Depends(require_api_key)])
async def resume_summary(file: UploadFile = File(...)):
    file_bytes = await file.read()
    text = extract_text(file.filename, file_bytes)

    structured_data = extract_structured_data_via_llm(text)

    return {
        "fileName": file.filename,
        **structured_data
    }


@app.post("/match-job", dependencies=[Depends(require_api_key)])
async def match_job(resume: UploadFile = File(...), job_description: UploadFile = File(...)):
    resume_bytes = await resume.read()
    job_bytes = await job_description.read()

    resume_text = extract_text(resume.filename, resume_bytes)
    job_text = extract_text(job_description.filename, job_bytes)

    match_percentage = calculate_job_match(resume_text, job_text)

    return {
        "resumeFileName": resume.filename,
        "jobFileName": job_description.filename,
        "matchPercentage": match_percentage
    }


@app.post("/candidate-score", dependencies=[Depends(require_api_key)])
async def candidate_score(resume: UploadFile = File(...), job_description: UploadFile = File(...)):
    resume_bytes = await resume.read()
    job_bytes = await job_description.read()

    resume_text = extract_text(resume.filename, resume_bytes)
    job_text = extract_text(job_description.filename, job_bytes)

    resume_skills = extract_skills_via_llm(resume_text)
    job_skills = extract_skills_via_llm(job_text)

    skill_comparison = compare_skill_lists(resume_skills, job_skills)

    job_match_percentage = calculate_job_match(resume_text, job_text)

    final_score = round(
        (skill_comparison["skillMatchPercentage"] * 0.5) + (job_match_percentage * 0.5),
        2
    )

    return {
        "resumeFileName": resume.filename,
        "jobFileName": job_description.filename,
        "skillsInResume": resume_skills,
        "skillsInJob": job_skills,
        "matchedSkillPairs": skill_comparison["matchedPairs"],
        "skillMatchPercentage": skill_comparison["skillMatchPercentage"],
        "jobMatchPercentage": job_match_percentage,
        "finalScore": final_score
    }


@app.post("/score-application", dependencies=[Depends(require_api_key)])
async def score_application(
    resume: UploadFile = File(...),
    job_description_text: str = Form(...)
):
    """
    Same as /candidate-score, but the job description comes as plain text
    (from the database) instead of an uploaded file. Used by the .NET
    backend when a candidate applies to a job.
    """
    resume_bytes = await resume.read()
    resume_text = extract_text(resume.filename, resume_bytes)

    job_text = job_description_text

    resume_skills = extract_skills_via_llm(resume_text)
    job_skills = extract_skills_via_llm(job_text)

    skill_comparison = compare_skill_lists(resume_skills, job_skills)

    job_match_percentage = calculate_job_match(resume_text, job_text)

    final_score = round(
        (skill_comparison["skillMatchPercentage"] * 0.5) + (job_match_percentage * 0.5),
        2
    )

    return {
        "resumeFileName": resume.filename,
        "skillsInResume": resume_skills,
        "skillsInJob": job_skills,
        "matchedSkillPairs": skill_comparison["matchedPairs"],
        "skillMatchPercentage": skill_comparison["skillMatchPercentage"],
        "jobMatchPercentage": job_match_percentage,
        "finalScore": final_score
    }