import { useState, useEffect, useRef, useCallback } from 'react';
import { renderAsync } from 'docx-preview';
import { useAuth } from '../context/AuthContext';
import {
  createJob,
  getMyJobs,
  getApplicantsForJob,
  deleteJob,
  updateJob,
  getCandidateProfile,
  updateApplicationStatus,
  getActivityLog,
} from '../api/jobApi';
import { downloadResumeBlob } from '../api/resumeApi';
import { scheduleInterview, updateInterview, getRecruiterInterviews } from '../api/interviewApi';
import { getErrorMessage } from '../utils/errors';
import { validateJob, MAX_VENUE_LENGTH } from '../utils/validation';
import { JobRulesForm, JobRulesSummary, DEFAULT_RULES } from '../components/JobRules';
import { Avatar, Badge, Card, Empty, MatchRing, Notice, PageHead, StatusBadge, Timeline } from '../components/ui';
import StatTile from '../components/StatTile';
import { fmtDate, fmtDateTime, timeAgo, toneForSummary } from '../utils/format';
import * as I from '../lib/icons';

function RecruiterJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [message, setMessage] = useState('');
  const [applicantsByJob, setApplicantsByJob] = useState({});
  const [minMatchByJob, setMinMatchByJob] = useState({});
  const [showRejectedByJob, setShowRejectedByJob] = useState({});
  const [profileByApplication, setProfileByApplication] = useState({});
  const [loadingProfileId, setLoadingProfileId] = useState(null);
  const [logByApplication, setLogByApplication] = useState({});
  const [loadingLogId, setLoadingLogId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [previewFileName, setPreviewFileName] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const previewRef = useRef(null);

  // UI-only state: the post form can be folded away, and deleting a job asks first.
  const [showPostForm, setShowPostForm] = useState(false);
  const [confirmDeleteJobId, setConfirmDeleteJobId] = useState(null);

  // Interview scheduling state — keyed by applicationId so each applicant's
  // form/interview data is independent of the others.
  const [interviewsByApplication, setInterviewsByApplication] = useState({});
  const [schedulingAppId, setSchedulingAppId] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleMode, setScheduleMode] = useState('Online');
  const [scheduleVenue, setScheduleVenue] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Editing an interview that already exists: status, comments for the candidate and venue (PUT /api/Interviews/{id}).
  const [editingInterviewId, setEditingInterviewId] = useState(null);
  const [editStatus, setEditStatus] = useState('Scheduled');
  const [editComments, setEditComments] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [isSavingInterview, setIsSavingInterview] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const response = await getMyJobs();
      setJobs(response.data);
    } catch (error) {
      console.error('Load jobs error:', error);
      setMessage(getErrorMessage(error, 'Could not load your jobs.'));
    }
  }, []);

  const loadInterviews = useCallback(async () => {
    try {
      const response = await getRecruiterInterviews();
      // Index by applicationId so each applicant card can look up its own
      // interview (if any) in O(1) instead of scanning the whole list.
      const map = {};
      response.data.forEach(interview => {
        map[interview.applicationId] = interview;
      });
      setInterviewsByApplication(map);
    } catch (error) {
      console.error('Load interviews error:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadJobs();
      loadInterviews();
    }
  }, [user, loadJobs, loadInterviews]);

  const handleCreateJob = async e => {
    e.preventDefault();
    const problem = validateJob({ title, description });
    if (problem) {
      setMessage(problem);
      return;
    }
    if (!rules.acceptedPolicies) {
      setMessage('Please tick the box to confirm the application rules before posting.');
      return;
    }
    try {
      await createJob({ title: title.trim(), description, location, ...rules });
      setMessage('Job posted successfully.');
      setTitle('');
      setDescription('');
      setLocation('');
      setRules(DEFAULT_RULES);
      setShowPostForm(false);
      loadJobs();
    } catch (error) {
      console.error('Create job error:', error);
      setMessage(getErrorMessage(error, 'Could not post job.'));
    }
  };

  const refreshApplicants = async jobId => {
    try {
      const response = await getApplicantsForJob(jobId);
      setApplicantsByJob(prev => ({ ...prev, [jobId]: response.data }));
    } catch (error) {
      console.error('View applicants error:', error);
      setMessage(getErrorMessage(error, 'Could not load applicants.'));
    }
  };

  const handleViewApplicants = async jobId => {
    if (applicantsByJob[jobId]) {
      setApplicantsByJob(prev => {
        const updated = { ...prev };
        delete updated[jobId];
        return updated;
      });
      return;
    }

    await refreshApplicants(jobId);
  };

  const handleUpdateStatus = async (jobId, applicationId, status) => {
    setUpdatingStatusId(applicationId);
    try {
      await updateApplicationStatus(applicationId, status);
      setMessage(`Application marked as ${status}.`);
      await refreshApplicants(jobId);
    } catch (error) {
      console.error('Update status error:', error);
      setMessage(getErrorMessage(error, 'Could not update status.'));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleViewProfile = async applicationId => {
    if (profileByApplication[applicationId]) {
      setProfileByApplication(prev => {
        const updated = { ...prev };
        delete updated[applicationId];
        return updated;
      });
      return;
    }

    setLoadingProfileId(applicationId);
    try {
      const response = await getCandidateProfile(applicationId);
      setProfileByApplication(prev => ({ ...prev, [applicationId]: response.data }));
    } catch (error) {
      console.error('View profile error:', error);
      setMessage(getErrorMessage(error, 'Could not load candidate profile.'));
    } finally {
      setLoadingProfileId(null);
    }
  };

  const handleViewLog = async applicationId => {
    if (logByApplication[applicationId]) {
      setLogByApplication(prev => {
        const updated = { ...prev };
        delete updated[applicationId];
        return updated;
      });
      return;
    }

    setLoadingLogId(applicationId);
    try {
      const response = await getActivityLog(applicationId);
      setLogByApplication(prev => ({ ...prev, [applicationId]: response.data }));
    } catch (error) {
      console.error('View activity log error:', error);
      setMessage(getErrorMessage(error, 'Could not load activity log.'));
    } finally {
      setLoadingLogId(null);
    }
  };

  const handleOpenScheduleForm = applicationId => {
    setSchedulingAppId(applicationId);
    setScheduleDate('');
    setScheduleMode('Online');
    setScheduleVenue('');
  };

  const handleCancelSchedule = () => {
    setSchedulingAppId(null);
    setScheduleDate('');
    setScheduleVenue('');
  };

  const handleOpenInterviewEdit = interview => {
    setEditingInterviewId(interview.interviewId);
    setEditStatus(interview.statusName || 'Scheduled');
    setEditComments(interview.recruiterComments || '');
    setEditVenue(interview.venue || '');
  };

  const handleSaveInterview = async (jobId, interview) => {
    setIsSavingInterview(true);
    try {
      // The server keeps the application's own status in step with the interview status.
      await updateInterview(interview.interviewId, {
        status: editStatus,
        recruiterComments: editComments,
        venue: editVenue,
      });
      setMessage('Interview updated successfully.');
      setEditingInterviewId(null);
      await Promise.all([loadInterviews(), refreshApplicants(jobId)]);
    } catch (error) {
      console.error('Update interview error:', error);
      setMessage(getErrorMessage(error, 'Could not update the interview.'));
    } finally {
      setIsSavingInterview(false);
    }
  };

  const handleConfirmSchedule = async (jobId, applicationId) => {
    if (!scheduleDate) {
      setMessage('Please pick a date and time for the interview.');
      return;
    }
    if (new Date(scheduleDate).getTime() < Date.now()) {
      setMessage('Please pick a future date and time for the interview.');
      return;
    }

    setIsScheduling(true);
    try {
      await scheduleInterview({
        applicationId,
        scheduledAt: new Date(scheduleDate).toISOString(),
        mode: scheduleMode,
        venue: scheduleVenue || null,
      });
      setMessage('Interview scheduled successfully.');
      setSchedulingAppId(null);
      setScheduleDate('');
      setScheduleVenue('');
      await Promise.all([loadInterviews(), refreshApplicants(jobId)]);
    } catch (error) {
      console.error('Schedule interview error:', error);
      setMessage(getErrorMessage(error, 'Could not schedule interview.'));
    } finally {
      setIsScheduling(false);
    }
  };

  const getMimeType = fileName => {
    const extension = fileName.toLowerCase().split('.').pop();
    return extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  };

  const handleViewResume = async (resumeId, fileName) => {
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

  const handleDeleteJob = async jobId => {
    try {
      await deleteJob(jobId);
      setMessage('Job deleted successfully.');
      loadJobs();
    } catch (error) {
      console.error('Delete job error:', error);
      setMessage(getErrorMessage(error, 'Could not delete job.'));
    } finally {
      setConfirmDeleteJobId(null);
    }
  };

  const handleCloseJob = async job => {
    try {
      await updateJob(job.jobId, {
        title: job.title,
        description: job.description,
        location: job.location,
        status: job.status === 'Open' ? 'Closed' : 'Open',
      });
      setMessage(job.status === 'Open' ? 'Job closed successfully.' : 'Job reopened successfully.');
      loadJobs();
    } catch (error) {
      console.error('Toggle job status error:', error);
      setMessage(getErrorMessage(error, 'Could not update job status.'));
    }
  };

  const getFilteredApplicants = jobId => {
    const allApplicants = applicantsByJob[jobId] || [];
    const threshold = parseFloat(minMatchByJob[jobId]);
    const hasThreshold = !isNaN(threshold);
    const showRejected = showRejectedByJob[jobId] || false;

    let filtered = allApplicants;

    if (hasThreshold) {
      filtered = filtered.filter(app => app.matchScore != null && app.matchScore >= threshold);
    }

    if (!showRejected) {
      filtered = filtered.filter(app => app.statusName !== 'Rejected');
    }

    return filtered;
  };

  if (!user) {
    return <p className="u-gate">Please login first.</p>;
  }

  if (user.roleName !== 'Recruiter') {
    return <p className="u-gate">This page is only for recruiters.</p>;
  }

  const openCount = jobs.filter(j => j.status === 'Open').length;
  const scrollToJobs = () => document.getElementById('my-jobs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return (
    <div className="app-wrap">
      <PageHead title="My jobs" sub="Post roles, review ranked applicants, shortlist the best and schedule interviews.">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowPostForm(v => !v)} aria-expanded={showPostForm}>
          {showPostForm ? <I.Close /> : <I.Plus />} {showPostForm ? 'Close form' : 'Post a job'}
        </button>
      </PageHead>

      <div className="u-grid c3">
        <StatTile index={0} icon={I.Briefcase} value={jobs.length} label="Jobs posted" onClick={() => setShowPostForm(true)} hint="All the jobs you posted. Click to post a new one." />
        <StatTile index={1} icon={I.Check} value={openCount} label="Open now" onClick={scrollToJobs} hint="Jobs candidates can see and apply to right now. Click to jump to your list." />
        <StatTile index={2} icon={I.Clock} value={jobs.length - openCount} label="Closed" onClick={scrollToJobs} hint="Jobs you stopped posting. You can reopen them from the list. Click to jump there." />
      </div>

      {showPostForm && (
        <Card className="strong u-gap">
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Post a job</h2>
          <form onSubmit={handleCreateJob} className="u-stack">
            <div className="u-field">
              <label className="u-label" htmlFor="job-title">Job title</label>
              <input id="job-title" className="u-input" type="text" placeholder="e.g. Backend Developer" maxLength={150} value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="u-field">
              <label className="u-label" htmlFor="job-desc">Description and required skills</label>
              <textarea id="job-desc" className="u-textarea" placeholder="Describe the role. Mention the skills you need, e.g. Python, SQL, Docker." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
            </div>
            <JobRulesForm rules={rules} onChange={setRules} />

            <div className="u-row2">
              <div className="u-field">
                <label className="u-label" htmlFor="job-loc">Location (optional)</label>
                <input id="job-loc" className="u-input" type="text" placeholder="e.g. Pune or Remote" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div className="u-actions" style={{ alignSelf: 'end', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  Post job
                </button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <div className="u-gap" />
      <Notice message={message} />

      <div className="u-stack" id="my-jobs-list" style={{ marginTop: 22 }}>
        {jobs.length === 0 && (
          <Empty icon={I.Briefcase} title="No jobs posted yet">
            Post your first role and candidates can start applying right away.
          </Empty>
        )}

        {jobs.map(job => {
          const filteredApplicants = getFilteredApplicants(job.jobId);
          const allApplicants = applicantsByJob[job.jobId];
          const counts = {};
          (allApplicants || []).forEach(a => {
            counts[a.statusName] = (counts[a.statusName] || 0) + 1;
          });

          return (
            <article key={job.jobId} className="u-card u-rjob">
              <div className="top">
                <div style={{ minWidth: 0 }}>
                  <h3>{job.title}</h3>
                  <div className="sub">
                    <Badge tone={job.status === 'Open' ? 'ok' : 'muted'} dot>
                      {job.status}
                    </Badge>
                    {job.location && <span>{job.location}</span>}
                    {job.companyName && <span>· {job.companyName}</span>}
                    {job.postedAt && <span>· posted {fmtDate(job.postedAt)}</span>}
                  </div>
                  <JobRulesSummary job={job} />
                </div>
                <div className="acts">
                  <button type="button" className="btn btn-primary btn-xs" onClick={() => handleViewApplicants(job.jobId)}>
                    <I.Users /> {allApplicants ? 'Hide applicants' : 'View applicants'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleCloseJob(job)}>
                    {job.status === 'Open' ? 'Stop posting' : 'Reopen posting'}
                  </button>
                  {confirmDeleteJobId === job.jobId ? (
                    <>
                      <button type="button" className="btn btn-danger btn-xs" onClick={() => handleDeleteJob(job.jobId)}>
                        Yes, delete
                      </button>
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => setConfirmDeleteJobId(null)}>
                        No
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-danger btn-xs" onClick={() => setConfirmDeleteJobId(job.jobId)}>
                      Delete job
                    </button>
                  )}
                </div>
                {confirmDeleteJobId === job.jobId && (
                  <p className="u-warn-line">
                    Deleting this job also deletes every application on it, with their scores and interviews. This cannot be undone.
                  </p>
                )}
              </div>

              {allApplicants && (
                <div className="u-apps">
                  <div className="u-filters" style={{ marginBottom: 14 }}>
                    <label className="u-check" htmlFor={`min-${job.jobId}`}>
                      Min match %
                    </label>
                    <input
                      id={`min-${job.jobId}`}
                      className="u-input sm"
                      style={{ width: 96 }}
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 50"
                      value={minMatchByJob[job.jobId] ?? ''}
                      onChange={e => setMinMatchByJob(prev => ({ ...prev, [job.jobId]: e.target.value }))}
                    />
                    <label className="u-check">
                      <input
                        type="checkbox"
                        checked={showRejectedByJob[job.jobId] || false}
                        onChange={e => setShowRejectedByJob(prev => ({ ...prev, [job.jobId]: e.target.checked }))}
                      />
                      Show rejected
                    </label>
                    <span className="u-hint" style={{ marginLeft: 'auto' }}>
                      {filteredApplicants.length} / {allApplicants.length} shown
                    </span>
                  </div>

                  {allApplicants.length > 0 && (
                    <div className="u-pipe-chips">
                      {Object.entries(counts).map(([status, n]) => (
                        <span key={status} className="u-chip">
                          {status}: <b>{n}</b>
                        </span>
                      ))}
                    </div>
                  )}

                  {filteredApplicants.length === 0 && (
                    <Empty icon={I.Users} title={allApplicants.length === 0 ? 'No applicants yet' : 'No candidates match this filter'}>
                      {allApplicants.length === 0 ? 'Applications for this job will appear here.' : 'Lower the minimum match or show rejected candidates.'}
                    </Empty>
                  )}

                  {filteredApplicants.map(app => {
                    const profile = profileByApplication[app.applicationId];
                    const isLoadingProfile = loadingProfileId === app.applicationId;
                    const isUpdatingStatus = updatingStatusId === app.applicationId;
                    const activityLog = logByApplication[app.applicationId];
                    const isLoadingLog = loadingLogId === app.applicationId;
                    const interview = interviewsByApplication[app.applicationId];
                    const isSchedulingThis = schedulingAppId === app.applicationId;

                    return (
                      <div key={app.applicationId} className="u-app">
                        <div className="who">
                          <Avatar name={app.candidateName} size={46} />
                          <div className="grow">
                            <h4>
                              {app.candidateName} <StatusBadge status={app.statusName} />
                            </h4>
                            <small>
                              Applied {fmtDate(app.appliedAt)}
                              {app.shortlistedAt && ` · shortlisted ${fmtDate(app.shortlistedAt)}`} · {app.resumeFileName}
                            </small>
                          </div>
                          <MatchRing value={app.matchScore} size={56} />
                        </div>

                        <div className="acts">
                          <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleViewProfile(app.applicationId)} disabled={isLoadingProfile}>
                            {isLoadingProfile ? 'Loading...' : profile ? 'Hide profile' : 'View profile'}
                          </button>
                          <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleViewResume(app.resumeId, app.resumeFileName)}>
                            View resume
                          </button>
                          <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleViewLog(app.applicationId)} disabled={isLoadingLog}>
                            {isLoadingLog ? 'Loading...' : activityLog ? 'Hide history' : 'View history'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ok btn-xs"
                            onClick={() => handleUpdateStatus(job.jobId, app.applicationId, 'Shortlisted')}
                            disabled={isUpdatingStatus || ['Shortlisted', 'Scheduled', 'Completed', 'Hired'].includes(app.statusName)}
                          >
                            <I.Check /> Shortlist
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => handleUpdateStatus(job.jobId, app.applicationId, 'Rejected')}
                            disabled={isUpdatingStatus || app.statusName === 'Rejected'}
                          >
                            Reject
                          </button>
                          {!interview && app.statusName === 'Shortlisted' && (
                            <button
                              type="button"
                              className="btn btn-ok btn-xs"
                              onClick={() => handleUpdateStatus(job.jobId, app.applicationId, 'Hired')}
                              disabled={isUpdatingStatus}
                            >
                              Mark hired
                            </button>
                          )}
                          {!interview && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => handleOpenScheduleForm(app.applicationId)}
                              disabled={['Rejected', 'Hired'].includes(app.statusName)}
                            >
                              <I.Calendar /> Schedule interview
                            </button>
                          )}
                        </div>

                        {interview && (
                          <div className="u-interview">
                            <div className="t">
                              <I.Calendar /> Interview · {fmtDateTime(interview.scheduledAt)}
                              <StatusBadge status={interview.statusName} />
                            </div>
                            <p>
                              {interview.mode}
                              {interview.venue && ` · ${interview.venue}`}
                            </p>
                            {interview.recruiterComments && <p>{interview.recruiterComments}</p>}
                            <div style={{ marginTop: 10 }}>
                              <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleOpenInterviewEdit(interview)}>
                                Update interview
                              </button>
                            </div>
                          </div>
                        )}

                        {interview && editingInterviewId === interview.interviewId && (
                          <div className="u-sec">
                            <h5>Update interview</h5>
                            <div className="u-stack">
                              <div className="u-row2">
                                <div className="u-field">
                                  <label className="u-label" htmlFor={`iv-status-${interview.interviewId}`}>Status</label>
                                  <select id={`iv-status-${interview.interviewId}`} className="u-select sm" value={editStatus} onChange={e => setEditStatus(e.target.value)} disabled={isSavingInterview}>
                                    {['Scheduled', 'Completed', 'Rejected', 'Hired'].map(st => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="u-field">
                                  <label className="u-label" htmlFor={`iv-venue-${interview.interviewId}`}>Venue or link</label>
                                  <input id={`iv-venue-${interview.interviewId}`} className="u-input sm" value={editVenue} maxLength={MAX_VENUE_LENGTH} onChange={e => setEditVenue(e.target.value)} disabled={isSavingInterview} />
                                </div>
                              </div>
                              <div className="u-field">
                                <label className="u-label" htmlFor={`iv-notes-${interview.interviewId}`}>Comments (the candidate can see these)</label>
                                <textarea id={`iv-notes-${interview.interviewId}`} className="u-textarea" rows={3} value={editComments} onChange={e => setEditComments(e.target.value)} disabled={isSavingInterview} />
                              </div>
                              <div className="u-actions">
                                <button type="button" className="btn btn-primary btn-xs" onClick={() => handleSaveInterview(job.jobId, interview)} disabled={isSavingInterview}>
                                  {isSavingInterview ? 'Saving...' : 'Save'}
                                </button>
                                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditingInterviewId(null)} disabled={isSavingInterview}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {isSchedulingThis && (
                          <div className="u-sec">
                            <h5>Schedule interview</h5>
                            <div className="u-sched">
                              <input
                                type="datetime-local"
                                className="u-input sm"
                                value={scheduleDate}
                                onChange={e => setScheduleDate(e.target.value)}
                                disabled={isScheduling}
                                aria-label="Interview date and time"
                              />
                              <select className="u-select sm" style={{ width: 130 }} value={scheduleMode} onChange={e => setScheduleMode(e.target.value)} disabled={isScheduling} aria-label="Interview mode">
                                <option value="Online">Online</option>
                                <option value="In-person">In-person</option>
                                <option value="Phone">Phone</option>
                              </select>
                              <input
                                type="text"
                                className="u-input sm"
                                value={scheduleVenue}
                                onChange={e => setScheduleVenue(e.target.value)}
                                maxLength={MAX_VENUE_LENGTH}
                                disabled={isScheduling}
                                placeholder={scheduleMode === 'Online' ? 'Meeting link' : scheduleMode === 'Phone' ? 'Phone number' : 'Address'}
                              />
                              <button type="button" className="btn btn-primary btn-xs" onClick={() => handleConfirmSchedule(job.jobId, app.applicationId)} disabled={isScheduling || !scheduleDate}>
                                {isScheduling ? 'Scheduling...' : 'Done'}
                              </button>
                              <button type="button" className="btn btn-ghost btn-xs" onClick={handleCancelSchedule} disabled={isScheduling}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {profile && (
                          <div className="u-sec">
                            <h5>Skills</h5>
                            {profile.skills.length === 0 ? (
                              <p className="u-hint">No skills recorded</p>
                            ) : (
                              <div className="u-chips">
                                {profile.skills.map(skill => (
                                  <span key={skill} className="u-chip">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            <h5 style={{ marginTop: 16 }}>Education</h5>
                            {profile.education.length === 0 ? (
                              <p className="u-hint">No education recorded</p>
                            ) : (
                              <ul>
                                {profile.education.map((edu, i) => (
                                  <li key={i}>
                                    {edu.degree} <small>· {edu.institution} ({edu.year})</small>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <h5 style={{ marginTop: 16 }}>Work experience</h5>
                            {profile.workExperience.length === 0 ? (
                              <p className="u-hint">No work experience recorded</p>
                            ) : (
                              <ul>
                                {profile.workExperience.map((exp, i) => (
                                  <li key={i}>
                                    {exp.role} <small>· {exp.company} ({exp.duration})</small>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {activityLog && (
                          <div className="u-sec">
                            <h5>Activity history</h5>
                            {activityLog.length === 0 ? (
                              <p className="u-hint">No history recorded</p>
                            ) : (
                              <Timeline
                                items={activityLog.map(entry => ({
                                  tone: toneForSummary(entry.summary),
                                  title: entry.summary || entry.action,
                                  time: timeAgo(entry.changedAt),
                                  fullTime: fmtDateTime(entry.changedAt)
                                }))}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
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

export default RecruiterJobsPage;