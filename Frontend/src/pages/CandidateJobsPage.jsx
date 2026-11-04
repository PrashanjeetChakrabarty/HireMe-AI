import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOpenJobs, applyToJob, getMyApplications } from '../api/jobApi';
import { getResumesByUser } from '../api/resumeApi';
import { getMyInterviews } from '../api/interviewApi';
import { getErrorMessage } from '../utils/errors';
import { Badge, Empty, MatchRing, Notice, PageHead, Skeleton, StatusBadge } from '../components/ui';
import StatTile from '../components/StatTile';
import { fmtDateTime } from '../utils/format';
import { JobRulesBox } from '../components/JobRules';
import * as I from '../lib/icons';

function CandidateJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeByJob, setSelectedResumeByJob] = useState({});
  const [myApplications, setMyApplications] = useState([]);
  const [myInterviews, setMyInterviews] = useState([]);
  const [message, setMessage] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState('');
  const [show, setShow] = useState('all');
  const [openDesc, setOpenDesc] = useState({});
  const [acceptedByJob, setAcceptedByJob] = useState({});

  const loadData = async () => {
    try {
      const [jobsRes, resumesRes, applicationsRes, interviewsRes] = await Promise.all([
        getOpenJobs(),
        getResumesByUser(user.userId),
        getMyApplications(),
        getMyInterviews(),
      ]);
      setJobs(jobsRes.data);
      setResumes(resumesRes.data);
      setMyApplications(applicationsRes.data);
      setMyInterviews(interviewsRes.data);
    } catch (error) {
      console.error('Load jobs error:', error);
      setMessage(getErrorMessage(error, 'Could not load jobs.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const getMyApplicationForJob = jobId => myApplications.find(app => app.jobId === jobId);

  const getInterviewForApplication = applicationId =>
    myInterviews.find(interview => interview.applicationId === applicationId);

  const handleResumeSelect = (jobId, resumeId) => {
    setSelectedResumeByJob(prev => ({ ...prev, [jobId]: resumeId }));
  };

  const handleApply = async jobId => {
    const resumeId = selectedResumeByJob[jobId];
    if (!resumeId) {
      setMessage('Please select a resume first.');
      return;
    }
    if (!acceptedByJob[jobId]) {
      setMessage('Please read and accept the rules of this job first.');
      return;
    }

    setApplyingJobId(jobId);
    setMessage('Applying and calculating your AI match score... this can take a minute or two.');

    try {
      await applyToJob({ jobId, resumeId, acceptedPolicies: Boolean(acceptedByJob[jobId]) });
      setMessage('Applied successfully.');
      await loadData();
    } catch (error) {
      console.error('Apply error:', error);
      setMessage(getErrorMessage(error, 'Could not apply.'));
    } finally {
      setApplyingJobId(null);
    }
  };

  const locations = useMemo(() => [...new Set(jobs.map(j => j.location).filter(Boolean))].sort(), [jobs]);

  const visibleJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter(job => {
      const applied = Boolean(myApplications.find(app => app.jobId === job.jobId));
      if (show === 'applied' && !applied) return false;
      if (show === 'new' && applied) return false;
      if (place && job.location !== place) return false;
      if (q && !`${job.title} ${job.companyName ?? ''} ${job.description ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [jobs, myApplications, query, place, show]);

  if (!user) {
    return <p className="u-gate">Please login first.</p>;
  }

  if (user.roleName !== 'Candidate') {
    return <p className="u-gate">This page is only for candidates.</p>;
  }

  return (
    <div className="app-wrap">
      <PageHead title="Browse jobs" sub="Pick a resume, apply, and see your AI match score within seconds.">
        <Badge tone="info">{jobs.length} open</Badge>
      </PageHead>

      <div className="u-grid c3">
        <StatTile index={0} icon={I.Briefcase} value={jobs.length} label="Open roles" onClick={() => setShow('all')} hint="Jobs open for applications right now. Click to show all of them below." />
        <StatTile index={1} icon={I.Check} value={myApplications.length} label="Applied" onClick={() => setShow('applied')} hint="Jobs you already applied to. Click to show only those, with your AI match score." />
        <StatTile index={2} icon={I.Calendar} value={myInterviews.length} label="Interviews" to="/my-activity" hint="Interviews recruiters scheduled for you. Click to see the date, time and place." />
      </div>

      <div className="u-gap" />
      <Notice message={message} busy={applyingJobId !== null} />

      {!loading && resumes.length === 0 && (
        <div className="u-notice warn">
          <I.File />
          <span>
            Upload a resume in <Link to="/resumes" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>My Resumes</Link> before applying.
          </span>
        </div>
      )}

      <div className="u-filters">
        <input className="u-input" type="search" placeholder="Search title, company or keyword" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search jobs" />
        <select className="u-select" value={place} onChange={e => setPlace(e.target.value)} aria-label="Filter by location">
          <option value="">All locations</option>
          {locations.map(l => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <div className="tabs" role="tablist" aria-label="Show jobs" style={{ marginTop: 0 }}>
          {[['all', 'All'], ['new', 'Not applied'], ['applied', 'Applied']].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={show === id} onClick={() => setShow(id)} style={{ padding: '10px 16px' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && <Skeleton rows={3} />}

      {!loading && visibleJobs.length === 0 && (
        <Empty icon={I.Briefcase} title={jobs.length === 0 ? 'No open jobs right now' : 'No jobs match these filters'}>
          {jobs.length === 0 ? 'Check back soon, new roles are posted often.' : 'Try a different search or clear the filters.'}
        </Empty>
      )}

      <div className="u-grid c2">
        {visibleJobs.map(job => {
          const isApplyingToThisJob = applyingJobId === job.jobId;
          const myApplication = getMyApplicationForJob(job.jobId);
          const interview = myApplication ? getInterviewForApplication(myApplication.applicationId) : null;
          const expanded = openDesc[job.jobId];

          return (
            <article key={job.jobId} className="u-card u-job">
              <div className="top">
                <div className="head">
                  <span className="logo">{(job.companyName || job.title || '?')[0].toUpperCase()}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3>{job.title}</h3>
                    {job.companyName && <p className="co">{job.companyName}</p>}
                  </div>
                  <Badge tone="info">{job.location || 'Remote'}</Badge>
                </div>
                <p className={`desc ${expanded ? 'open' : ''}`}>{job.description}</p>
                {job.description && job.description.length > 160 && (
                  <button type="button" className="more" onClick={() => setOpenDesc(p => ({ ...p, [job.jobId]: !p[job.jobId] }))}>
                    {expanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              <div className="foot">
                {myApplication ? (
                  <>
                    <div className="applied">
                      <StatusBadge status={myApplication.statusName} />
                      <span className="grow u-hint">{myApplication.matchScore != null ? 'Your AI match score' : 'AI score unavailable'}</span>
                      <MatchRing value={myApplication.matchScore} size={52} />
                    </div>

                    {interview && (
                      <div className="u-interview">
                        <div className="t">
                          <I.Calendar /> Interview
                        </div>
                        <p style={{ color: 'var(--ink)', fontSize: 14.5 }}>
                          {fmtDateTime(interview.scheduledAt)} · {interview.mode}
                        </p>
                        {interview.venue && <p>Venue: {interview.venue}</p>}
                        {interview.recruiterComments && <p>{interview.recruiterComments}</p>}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <JobRulesBox
                      job={job}
                      accepted={acceptedByJob[job.jobId]}
                      onChange={value => setAcceptedByJob(prev => ({ ...prev, [job.jobId]: value }))}
                      disabled={isApplyingToThisJob}
                    />
                  <div className="apply">
                    <select
                      className="u-select"
                      value={selectedResumeByJob[job.jobId] || ''}
                      onChange={e => handleResumeSelect(job.jobId, e.target.value)}
                      disabled={isApplyingToThisJob}
                      aria-label={`Resume for ${job.title}`}
                    >
                      <option value="">Select a resume</option>
                      {resumes.map(resume => (
                        <option key={resume.resumeId} value={resume.resumeId}>
                          {resume.fileName}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleApply(job.jobId)} disabled={isApplyingToThisJob || !acceptedByJob[job.jobId]}>
                      {isApplyingToThisJob && <span className="u-spin sm" />}
                      {isApplyingToThisJob ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default CandidateJobsPage;