import { Link } from 'react-router-dom';

import { Arrow } from '../lib/icons';

// The public contact address. Change it here and both pages follow.
const CONTACT_EMAIL = 'workbuildwithus@gmail.com';

const ContactEmail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

function LegalPage({ title, updated, intro, sections }) {
  const jump = id => e => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <div className="legal">
      <div className="wrap">
        <Link className="back" to="/">
          <Arrow /> Back to home
        </Link>
        <h1>{title}</h1>
        <p className="meta">Last updated: {updated}</p>
        <div className="legal-grid">
          <nav className="toc" aria-label="On this page">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} onClick={jump(s.id)}>
                {s.title}
              </a>
            ))}
          </nav>
          <div className="prose">
            {intro && <p style={{ marginBottom: 34 }}>{intro}</p>}
            {sections.map(s => (
              <section key={s.id} id={s.id}>
                <h2>{s.title}</h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  const sections = [
    {
      id: 'who',
      title: 'Who we are',
      body: (
        <>
          <p>
            HireMe AI Resume Screener (&ldquo;the service&rdquo;, &ldquo;we&rdquo;) is operated by HireMe AI, India. This policy explains what personal data we collect, why we collect it, who helps us process it and what choices you have.
          </p>
        </>
      )
    },
    {
      id: 'collect',
      title: 'What we collect',
      body: (
        <>
          <ul>
            <li><strong>Account data:</strong> your name, email address, role (candidate or recruiter) and a hashed password. If you use Sign in with Google, we receive your name and email from Google. We never see your Google password.</li>
            <li><strong>One-time codes:</strong> short-lived codes we email you to verify your account, reset a password or confirm account deletion.</li>
            <li><strong>Resumes:</strong> the PDF or DOCX files you upload, the text read from them and the skills extracted from that text.</li>
            <li><strong>Jobs and applications:</strong> job posts created by recruiters, the applications candidates submit, match scores, shortlist or rejection status and interview details (date, time, mode and venue).</li>
            <li><strong>Consent records:</strong> when you accept the Terms of Service and the Privacy Policy we save, with your account, which version you accepted and when. When a visitor accepts the storage notice we save a random visitor id, the version and the time. That id is not linked to your name, email address or IP address.</li>
            <li><strong>Job rules:</strong> the application rules a recruiter chooses for a job, the moment a candidate accepts those rules when applying, and the moment a candidate is hired or rejected, because some rules depend on it.</li>
            <li><strong>Activity records:</strong> a log of important changes, such as a status change on an application, so both sides can see what happened and when.</li>
            <li><strong>Technical data:</strong> basic request information such as IP address and browser type, which our hosting providers process to deliver and protect the service.</li>
          </ul>
        </>
      )
    },
    {
      id: 'use',
      title: 'How we use your data',
      body: (
        <ul>
          <li>To create and secure your account and to verify your email address.</li>
          <li>To read your resume, extract your skills and calculate how well you match a job.</li>
          <li>To let recruiters review applicants for their jobs and to let candidates track their applications.</li>
          <li>To send service emails: verification codes, a welcome message, updates about your applications and job posts, interview invitations and security notices such as a password change.</li>
          <li>To apply the rules a recruiter chose for a job, for example a pause after a hire or a wait after a rejection.</li>
          <li>To prevent abuse, for example by limiting repeated requests.</li>
          <li>To keep the service running and fix problems.</li>
        </ul>
      )
    },
    {
      id: 'ai',
      title: 'How AI is used',
      body: (
        <>
          <p>
            When you upload a resume or a recruiter posts a job, the text is sent to an AI language model to extract skills. A smaller model running on our own service then compares those skills by meaning and produces a match score.
          </p>
          <p>
            The score is decision support only. It does not hire or reject anyone. Recruiters make every decision, and a score can be wrong.
          </p>
        </>
      )
    },
    {
      id: 'share',
      title: 'Who we share data with',
      body: (
        <>
          <p>We do not sell your personal data. We use these providers to run the service, and they process data on our behalf:</p>
          <table>
            <thead>
              <tr><th>Provider</th><th>Purpose</th><th>Data involved</th></tr>
            </thead>
            <tbody>
              <tr><td>Microsoft Azure</td><td>Hosts the application, the database and the AI service (database and API in East Asia, AI service in Korea Central)</td><td>All account and application data</td></tr>
              <tr><td>Vercel</td><td>Serves the website</td><td>Technical request data</td></tr>
              <tr><td>Groq</td><td>AI language model that extracts skills</td><td>Resume and job text</td></tr>
              <tr><td>Brevo</td><td>Sends our emails</td><td>Name, email address and the email content</td></tr>
              <tr><td>Cloudflare</td><td>Turnstile check that a visitor is a person, on the sign up, login and password pages</td><td>Technical request data such as IP address and browser details</td></tr>
              <tr><td>Google</td><td>Optional Sign in with Google</td><td>Name and email address</td></tr>
            </tbody>
          </table>
          <p>
            Recruiters can see the profile and resume of candidates who apply to their jobs. We may also disclose data if the law requires it.
          </p>
        </>
      )
    },
    {
      id: 'keep',
      title: 'How long we keep it, and deleting it',
      body: (
        <>
          <p>
            We keep your data while your account is active. You can delete your account at any time from your dashboard: choose Delete Account and confirm with the code we email you. Deleting your account removes your profile, skills, resume records and applications from our database.
          </p>
          <p>
            Copies may remain in secure backups for a limited period before they are overwritten. Backups are kept for up to 6 months. The uploaded resume files are stored separately from the database. When you delete your account, the uploaded resume files are deleted from storage too. Records of consent (which version was accepted, and when) may be kept after deletion, to show that the terms were accepted.
          </p>
        </>
      )
    },
    {
      id: 'security',
      title: 'Security',
      body: (
        <>
          <p>
            We use HTTPS, store passwords only as hashes, verify email addresses with one-time codes, limit repeated requests and restrict what each role can do. No system is perfectly secure, so please use a strong password and keep it private.
          </p>
        </>
      )
    },
    {
      id: 'cookies',
      title: 'Cookies and local storage',
      body: (
        <p>
          The site keeps a sign-in token in your browser&apos;s local storage so you stay signed in. It also remembers there that you accepted the storage notice, with a random visitor id used only to record that choice. We do not use advertising or tracking cookies. Sign in with Google and the Cloudflare Turnstile check may set their own cookies according to their providers&apos; policies.
        </p>
      )
    },
    {
      id: 'rights',
      title: 'Your choices and rights',
      body: (
        <>
          <p>
            You can view and update your profile, delete your account, and ask us to correct or delete data we hold about you. Depending on where you live, you may have further rights under local law, including the laws of India. To use any of them, contact us below.
          </p>
        </>
      )
    },
    {
      id: 'children',
      title: 'Children',
      body: (
        <p>
          The service is not intended for people under 18, and we do not knowingly collect data from them.
        </p>
      )
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      body: <p>If we change this policy in a meaningful way we will update the date at the top and, where appropriate, tell you by email.</p>
    },
    {
      id: 'contact',
      title: 'Contact',
      body: (
        <p>
          Questions or requests: <ContactEmail />
        </p>
      )
    }
  ];
  return (
    <LegalPage
      title="Privacy Policy"
      updated="3 November 2026"
      intro="Your resume is personal. This page explains in plain language how we handle it."
      sections={sections}
    />
  );
}

export function TermsPage() {
  const sections = [
    {
      id: 'accept',
      title: 'Accepting these terms',
      body: <p>By creating an account or using HireMe AI Resume Screener you agree to these terms and to our <Link to="/privacy">Privacy Policy</Link>. If you do not agree, please do not use the service.</p>
    },
    {
      id: 'service',
      title: 'The service',
      body: <p>HireMe AI operates the service. It lets candidates upload resumes and apply to jobs, and lets recruiters post jobs, review ranked applicants and schedule interviews. It is provided &ldquo;as is&rdquo; and may be unavailable at times, for example during maintenance.</p>
    },
    {
      id: 'accounts',
      title: 'Your account',
      body: (
        <ul>
          <li>Give accurate information and keep your sign-in details private.</li>
          <li>You are responsible for activity under your account.</li>
          <li>You must verify your email address with the one-time code we send.</li>
        </ul>
      )
    },
    {
      id: 'content',
      title: 'Your content',
      body: (
        <>
          <p>You own the resumes and job posts you submit. You confirm that you have the right to submit them. You allow us to store and process them to run the service, including analysing resume text with AI as described in the Privacy Policy.</p>
          <p>Recruiters must use candidate information only to evaluate people for the job they applied for.</p>
        </>
      )
    },
    {
      id: 'use',
      title: 'Acceptable use',
      body: (
        <ul>
          <li>Do not upload content that is unlawful, misleading or infringes someone else&apos;s rights.</li>
          <li>Do not try to break, overload or reverse engineer the service, or access other people&apos;s accounts.</li>
          <li>Do not use the service to discriminate against candidates.</li>
        </ul>
      )
    },
    {
      id: 'ai',
      title: 'AI results',
      body: <p>Match scores and extracted skills are generated by AI and can contain mistakes. They are decision support only. Recruiters are responsible for their hiring decisions, and candidates should check that their extracted skills are correct.</p>
    },
    {
      id: 'rules',
      title: 'Job application rules',
      body: (
        <>
          <p>Recruiters choose rules for each job they post, such as one open application at a time, a pause on new applications after a hire, a wait after a rejection and a promised reply time. A recruiter must follow the rules posted with the job. The rules cannot be changed after the job is posted.</p>
          <p>Candidates must read the rules of a job and accept them before applying, and the rules then apply to that application.</p>
        </>
      )
    },
    {
      id: 'end',
      title: 'Ending your use',
      body: <p>You can delete your account at any time from your dashboard. We may suspend or remove accounts that break these terms or put the service at risk.</p>
    },
    {
      id: 'liability',
      title: 'Disclaimers and liability',
      body: <p>To the fullest extent the law allows, we provide the service without warranties and are not liable for indirect or consequential losses, or for hiring outcomes. Nothing in these terms limits liability that cannot be limited by law.</p>
    },
    {
      id: 'law',
      title: 'Governing law',
      body: <p>These terms are governed by the laws of India, and disputes will be handled by the courts at Prayagraj (Allahabad), India, including the Allahabad High Court.</p>
    },
    {
      id: 'changes',
      title: 'Changes and contact',
      body: <p>We may update these terms and will change the date above when we do. Questions: <ContactEmail /></p>
    }
  ];
  return <LegalPage title="Terms of Service" updated="3 November 2026" intro="The short version: be honest, be kind, and remember a person makes the final hiring call." sections={sections} />;
}