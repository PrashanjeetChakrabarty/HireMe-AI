import { useState, useEffect, useRef, useCallback } from 'react';
import { renderAsync } from 'docx-preview';
import { useAuth } from '../context/AuthContext';
import { uploadResume, getResumesByUser, downloadResumeBlob, deleteResume } from '../api/resumeApi';
import { getMyApplications } from '../api/jobApi';
import { getErrorMessage } from '../utils/errors';
import { validateResumeFile } from '../utils/validation';
import { Badge, Card, Empty, Notice, PageHead } from '../components/ui';
import { fmtDate } from '../utils/format';
import * as I from '../lib/icons';

const AI_STEPS = ['Uploading your file', 'Reading the document with AI', 'Extracting skills, education and experience'];

function ResumePage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadSummary, setLastUploadSummary] = useState(null);
  const [previewFileName, setPreviewFileName] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const previewRef = useRef(null);

  const loadResumes = useCallback(async () => {
    try {
      // Deleting a resume also deletes every application made with it (the backend does this),
      // so the page needs the applications to warn about it. If that call fails the list still works.
      const [resumesResult, applicationsResult] = await Promise.allSettled([getResumesByUser(user.userId), getMyApplications()]);
      if (resumesResult.status === 'rejected') throw resumesResult.reason;
      setResumes(resumesResult.value.data);
      setApplications(applicationsResult.status === 'fulfilled' ? applicationsResult.value.data : []);
    } catch (error) {
      console.error('Load resumes error:', error);
      setMessage(getErrorMessage(error, 'Could not load resumes.'));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadResumes();
    }
  }, [user, loadResumes]);

  // Only .pdf and .docx are accepted by the server, and very large files are refused, so check before uploading.
  const acceptFile = file => {
    const problem = validateResumeFile(file);
    if (problem) {
      setSelectedFile(null);
      setMessage(problem);
      return;
    }
    setMessage('');
    setSelectedFile(file);
    setLastUploadSummary(null);
  };

  const handleFileChange = e => {
    acceptFile(e.target.files[0]);
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && !isUploading) {
      acceptFile(file);
    }
  };

  const handleUpload = async e => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setLastUploadSummary(null);
    setMessage('Uploading and analyzing resume with AI... this can take a minute or two.');

    try {
      const response = await uploadResume(user.userId, selectedFile);
      setMessage('');
      setLastUploadSummary(response.data);
      setSelectedFile(null);
      await loadResumes();
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(getErrorMessage(error, 'Upload failed.'));
    } finally {
      setIsUploading(false);
    }
  };

  const getMimeType = fileName => {
    const extension = fileName.toLowerCase().split('.').pop();
    return extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  };

  const handleView = async (resumeId, fileName) => {
    try {
      const response = await downloadResumeBlob(resumeId);
      const extension = fileName.toLowerCase().split('.').pop();
      const blob = new Blob([response.data], { type: getMimeType(fileName) });

      if (extension === 'pdf') {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        setPreviewFileName(fileName);
        setPreviewBlob(blob);
      }
    } catch (error) {
      console.error('View resume error:', error);
      setMessage(getErrorMessage(error, 'Could not open resume.'));
    }
  };

  useEffect(() => {
    if (previewBlob && previewRef.current) {
      previewRef.current.innerHTML = '';
      renderAsync(previewBlob, previewRef.current).catch(error => {
        console.error('DOCX render error:', error);
        setMessage('Could not render document preview.');
      });
    }
  }, [previewBlob]);

  const handleDownload = async (resumeId, fileName) => {
    try {
      const response = await downloadResumeBlob(resumeId);
      const blob = new Blob([response.data], { type: getMimeType(fileName) });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download resume error:', error);
      setMessage(getErrorMessage(error, 'Download failed.'));
    }
  };

  const handleDelete = async resumeId => {
    try {
      await deleteResume(resumeId);
      setMessage('Resume deleted.');
      loadResumes();
    } catch (error) {
      console.error('Delete resume error:', error);
      setMessage(getErrorMessage(error, 'Delete failed.'));
    } finally {
      setConfirmId(null);
    }
  };

  if (!user) {
    return <p className="u-gate">Please login first.</p>;
  }

  const applicationsUsing = resumeId => applications.filter(a => a.resumeId === resumeId).length;
  // The backend saves the file even when its AI step fails, and then reports zero for everything.
  const aiFoundNothing =
    lastUploadSummary &&
    !lastUploadSummary.skillsExtractedCount &&
    !lastUploadSummary.educationExtractedCount &&
    !lastUploadSummary.workExperienceExtractedCount;

  return (
    <div className="app-wrap narrow">
      <PageHead title="My resumes" sub="Upload a PDF or Word resume. Our AI reads it and builds your skills profile, which powers your match scores.">
        <Badge tone="info">{resumes.length} on file</Badge>
      </PageHead>

      <Card className="strong">
        <form onSubmit={handleUpload} style={{ display: 'grid', gap: 16 }}>
          <label
            className={`u-drop ${dragOver ? 'over' : ''} ${selectedFile ? 'has' : ''}`}
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input type="file" accept=".pdf,.docx" onChange={handleFileChange} disabled={isUploading} hidden />
            {selectedFile ? <I.File /> : <I.Upload />}
            <b>{selectedFile ? selectedFile.name : 'Drop your resume here, or click to browse'}</b>
            <span>{selectedFile ? 'Ready to upload' : 'PDF or DOCX'}</span>
          </label>
          <div className="u-actions" style={{ justifyContent: 'flex-end' }}>
            {selectedFile && !isUploading && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedFile(null)}>
                Clear
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={isUploading}>
              {isUploading ? 'Analyzing...' : 'Upload and analyze'}
            </button>
          </div>
        </form>

        {isUploading && (
          <ul className="u-steps" aria-live="polite">
            {AI_STEPS.map((s, i) => (
              <li key={s} style={{ '--i': i }}>
                <span className="u-spin sm" /> {s}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="u-gap" />
      <Notice message={message} busy={isUploading} />

      {lastUploadSummary && (
        <Card className="u-gap" style={{ borderColor: 'color-mix(in srgb, var(--mint) 50%, transparent)' }}>
          <Badge tone={aiFoundNothing ? 'warn' : 'ok'} dot>
            {aiFoundNothing ? 'Resume uploaded · AI found nothing' : 'Resume uploaded · AI analysis complete'}
          </Badge>
          {aiFoundNothing && (
            <p className="u-hint" style={{ marginTop: 12 }}>
              The file is saved, but the AI could not read any skills from it. The AI service may be busy, or the file has no readable text (for example a scanned image). Delete it and try again in a few minutes.
            </p>
          )}
          <div className="u-grid c3 u-gap">
            {[
              [lastUploadSummary.skillsExtractedCount, 'skills found'],
              [lastUploadSummary.educationExtractedCount, 'education entries'],
              [lastUploadSummary.workExperienceExtractedCount, 'work experiences']
            ].map(([n, label]) => (
              <div className="u-stat" key={label}>
                <div>
                  <b>{n ?? 0}</b>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="u-stack u-gap" style={{ marginTop: 24 }}>
        {resumes.length === 0 && (
          <Empty icon={I.File} title="No resumes uploaded yet">
            Your first upload unlocks job applications and AI match scores.
          </Empty>
        )}

        {resumes.map(resume => {
          const ext = (resume.fileName.split('.').pop() || '').toLowerCase();
          const used = applicationsUsing(resume.resumeId);
          return (
            <div key={resume.resumeId} className="u-file">
              <div className="meta">
                <span className={`ext ${ext}`}>{ext.toUpperCase()}</span>
                <div style={{ minWidth: 0 }}>
                  <h3>{resume.fileName}</h3>
                  <small>
                    {resume.uploadedAt && `Uploaded ${fmtDate(resume.uploadedAt)}`}
                    {used > 0 && `${resume.uploadedAt ? ' · ' : ''}Used in ${used} application${used > 1 ? 's' : ''}`}
                  </small>
                </div>
              </div>
              <div className="acts">
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleView(resume.resumeId, resume.fileName)}>
                  View
                </button>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleDownload(resume.resumeId, resume.fileName)}>
                  Download
                </button>
                {confirmId === resume.resumeId ? (
                  <>
                    <button type="button" className="btn btn-danger btn-xs" onClick={() => handleDelete(resume.resumeId)}>
                      Yes, delete
                    </button>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setConfirmId(null)}>
                      No
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-danger btn-xs" onClick={() => setConfirmId(resume.resumeId)}>
                    Delete
                  </button>
                )}
              </div>
              {confirmId === resume.resumeId && (
                <p className="u-warn-line">
                  {used > 0
                    ? `Deleting this resume also removes the ${used} application${used > 1 ? 's' : ''} you made with it, with their scores and interviews.`
                    : 'This permanently deletes the file.'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {previewFileName && (
        <Card className="u-preview flush">
          <div className="bar">
            <span className="u-label" style={{ margin: 0 }}>
              Preview · {previewFileName}
            </span>
          </div>
          <div ref={previewRef} className="doc"></div>
        </Card>
      )}
    </div>
  );
}

export default ResumePage;