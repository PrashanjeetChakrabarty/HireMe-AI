FROM python:3.12-slim

WORKDIR /app

# --extra-index-url makes pip pick the small CPU-only PyTorch build
# instead of the huge default CUDA build.
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Download the embedding model while building, so a cold start does not have to.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY main.py .

# Hosts like Azure/Render pass the port in the PORT variable; default is 8000.
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
