import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getDashboardOverview } from '../api/dashboardApi';
import { getApplicantsForJob, getMyApplications, getMyJobs, getOpenJobs } from '../api/jobApi';
import { getProfile } from '../api/userApi';
import { getResumesByUser } from '../api/resumeApi';
import { getMyInterviews, getRecruiterInterviews } from '../api/interviewApi';
import { parseApiDate } from '../utils/dateTime';
import { Avatar, Badge, Card, CardHead, Empty, MatchRing, Skeleton, StatusBadge } from '../components/ui';
import StatTile from '../components/StatTile';
import HeroOrb, { CANDIDATE_WORDS, RECRUITER_WORDS } from '../components/HeroOrb';
import QuickStartCard, { useQuickStart } from '../components/QuickStart';
import { fmtDateTime, timeAgo } from '../utils/format';
import {
  JourneyCard,
  NextStepsCard,
  WaitingCard,
  buildChecklist,
  greetingFor,
  journeyCounts,
  waitingForCandidate,
  waitingForRecruiter,
} from '../components/DashboardParts';
import * as I from '../lib/icons';

const IN_PROGRESS = ['Shortlisted', 'Scheduled', 'Completed', 'Hired'];

function UpcomingInterviews({ interviews, who }) {
  return (
    <Card>
      <CardHead title="Upcoming interviews" />
      {interviews.length === 0 ? (
        <p className="u-hint">Nothing scheduled yet.</p>
      ) : (
        <ul className="u-list">
          {interviews.slice(0, 4).map(iv => (
            <li key={iv.interviewId}>
              <span className="ico" style={{ width: 40, height: 40, borderRadius: 12 }}>
                <I.Calendar />
              </span>
              <div className="grow">
                <b>{who === 'Recruiter' ? iv.candidateName : iv.jobTitle}</b>
                <small>
                  {fmtDateTime(iv.scheduledAt)} · {iv.mode}
                </small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DashboardPage() {
  const { user } = useAuth();

  const [data, setData] = useState({ loading: true });
  const quickStart = useQuickStart(user?.userId);

  // Everything shown here comes from endpoints the app already uses; a failed call just shows an empty card.
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const run = async () => {
      if (user.roleName === 'Recruiter') {
        const [overview, jobs, interviews] = await Promise.allSettled([getDashboardOverview(), getMyJobs(), getRecruiterInterviews()]);
        const myJobs = jobs.value?.data ?? [];
        // The applicants of each open job, to find the ones still waiting for an answer.
        const openJobs = myJobs.filter(job => job.status === 'Open');
        const applicantResults = await Promise.allSettled(openJobs.map(job => getApplicantsForJob(job.jobId)));
        if (alive) {
          setData({
            loading: false,
            overview: overview.value?.data ?? null,
            jobs: myJobs,
            interviews: interviews.value?.data ?? [],
            applicantLists: openJobs.map((job, index) => ({ job, applicants: applicantResults[index].value?.data ?? [] }))
          });
        }
      } else {
        const [apps, interviews, resumes, openJobs, profile] = await Promise.allSettled([
          getMyApplications(),
          getMyInterviews(),
          getResumesByUser(user.userId),
          getOpenJobs(),
          getProfile(user.userId)
        ]);
        if (alive) {
          setData({
            loading: false,
            applications: apps.value?.data ?? [],
            interviews: interviews.value?.data ?? [],
            resumes: resumes.value?.data ?? [],
            jobs: openJobs.value?.data ?? [],
            profile: profile.value?.data ?? null
          });
        }
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [user]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return (data.interviews ?? [])
      .filter(iv => {
        const d = parseApiDate(iv.scheduledAt);
        return d && d.getTime() >= now - 3600 * 1000;
      })
      .sort((a, b) => parseApiDate(a.scheduledAt) - parseApiDate(b.scheduledAt));
  }, [data.interviews]);

  if (!user) {
    return <p className="u-gate">Please login first.</p>;
  }

  const isRecruiter = user.roleName === 'Recruiter';
  const firstName = user.fullName?.split(' ')[0] || 'there';
  const overview = data.overview;
  const recentApps = [...(data.applications ?? [])].sort((a, b) => parseApiDate(b.appliedAt) - parseApiDate(a.appliedAt)).slice(0, 5);
  const pipeline = overview?.interviewPipeline ?? [];
  const pipeMax = Math.max(1, ...pipeline.map(p => p.count));
  const checklist = buildChecklist({
    resumes: data.resumes ?? [],
    applications: data.applications ?? [],
    interviews: data.interviews ?? [],
    profile: data.profile
  });
  const journey = journeyCounts(data.applications ?? []);
  const waiting = isRecruiter ? waitingForRecruiter(data.applicantLists ?? []) : waitingForCandidate(data.applications ?? [], data.jobs ?? []);

  return (
    <div className="app-wrap dash">
      <Card className="u-hero">
        <Badge tone="info" dot>
          {user.roleName}
        </Badge>
        <HeroOrb words={isRecruiter ? RECRUITER_WORDS : CANDIDATE_WORDS} />
        <h2>
          {greetingFor(new Date().getHours())}, <span className="dash-name">{firstName}</span>.
        </h2>
        <p>
          {isRecruiter
            ? 'Here is how your hiring is going. Review the strongest applicants and move them forward.'
            : 'Keep your resume fresh, apply to roles and track every step of your applications.'}
        </p>
        <div className="u-actions">
          {isRecruiter ? (
            <>
              <Link className="btn btn-primary btn-sm" to="/my-jobs">
                <I.Plus /> Post a job
              </Link>
              <Link className="btn btn-ghost btn-sm" to="/analytics">
                <I.Chart /> View analytics
              </Link>
            </>
          ) : (
            <>
              <Link className="btn btn-primary btn-sm" to="/resumes">
                <I.Upload /> Upload a resume
              </Link>
              <Link className="btn btn-ghost btn-sm" to="/jobs">
                <I.Briefcase /> Browse jobs
              </Link>
            </>
          )}
        </div>
        {!quickStart.visible && (
          <button type="button" className="quick-link" onClick={quickStart.show}>
            Show quick start
          </button>
        )}
      </Card>

      {quickStart.visible && <QuickStartCard role={user.roleName} onClose={quickStart.hide} />}

      <div className="u-grid c4 u-gap">
        {isRecruiter ? (
          <>
            <StatTile index={0} icon={I.Briefcase} value={overview?.activeJobs ?? (data.jobs ?? []).filter(j => j.status === 'Open').length} label="Active jobs" to="/my-jobs" hint="Jobs that are open for candidates right now. Click to manage them or post a new one." />
            <StatTile index={1} icon={I.Users} value={overview?.totalApplicants ?? 0} label="Applicants" to="/my-jobs" hint="Everyone who applied to your jobs. Click to read profiles, shortlist, reject or schedule interviews." />
            <StatTile index={2} icon={I.Target} value={overview?.totalCandidates ?? 0} label="Candidates" to="/analytics" hint="Different people who applied to you. Click to see charts and your best AI matches." />
            <StatTile index={3} icon={I.Calendar} value={upcoming.length} label="Upcoming interviews" to="/activity-feed" hint="Interviews you scheduled that are still ahead. Click to see everything that happened lately." />
          </>
        ) : (
          <>
            <StatTile index={0} icon={I.Briefcase} value={(data.applications ?? []).length} label="Applications" to="/my-activity" hint="All the jobs you applied to. Click to see what happened with each one." />
            <StatTile index={1} icon={I.Check} value={(data.applications ?? []).filter(a => IN_PROGRESS.includes(a.statusName)).length} label="In progress" to="/my-activity" hint="Applications a recruiter has moved forward: shortlisted, interview or hired. Click to follow them." />
            <StatTile index={2} icon={I.Calendar} value={upcoming.length} label="Upcoming interviews" to="/my-activity" hint="Interviews that are still ahead. Click to see the date, time and place." />
            <StatTile index={3} icon={I.File} value={(data.resumes ?? []).length} label="Resumes" to="/resumes" hint="Resumes you uploaded. Click to add a new one, open it or delete it." />
          </>
        )}
      </div>

      <div className="u-grid side u-gap">
        <div className="u-stack">
          {data.loading ? (
            <Skeleton rows={3} />
          ) : isRecruiter ? (
            <>
              <Card>
                <CardHead title="Top AI matches">
                  <Link className="btn btn-ghost btn-xs" to="/analytics">
                    All analytics
                  </Link>
                </CardHead>
                {(overview?.aiTopCandidates ?? []).length === 0 ? (
                  <Empty icon={I.Target} title="No scored applicants yet">
                    As soon as candidates apply, the best matches show up here.
                  </Empty>
                ) : (
                  <ul className="u-list">
                    {overview.aiTopCandidates.slice(0, 5).map((c, i) => (
                      <li key={i}>
                        <Avatar name={c.candidateName} />
                        <div className="grow">
                          <b>{c.candidateName}</b>
                          <small>{c.jobTitle}</small>
                        </div>
                        <MatchRing value={c.matchScore} size={50} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card>
                <CardHead title="Hiring pipeline" />
                {pipeline.length === 0 ? (
                  <p className="u-hint">No applications yet.</p>
                ) : (
                  <div className="u-funnel">
                    {pipeline.map(p => (
                      <div className="r" key={p.statusName}>
                        <span>{p.statusName}</span>
                        <div className="bar">
                          <i style={{ width: `${(p.count / pipeMax) * 100}%` }} />
                        </div>
                        <b>{p.count}</b>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <CardHead title="Recent applications">
                <Link className="btn btn-ghost btn-xs" to="/jobs">
                  Browse jobs
                </Link>
              </CardHead>
              {recentApps.length === 0 ? (
                <Empty icon={I.Briefcase} title="No applications yet">
                  Upload a resume, then apply to a role. Your AI match score appears here.
                </Empty>
              ) : (
                <ul className="u-list">
                  {recentApps.map(app => (
                    <li key={app.applicationId}>
                      <span className="u-avatar" style={{ width: 40, height: 40, borderRadius: 12, fontSize: 15 }}>
                        {(app.jobTitle || '?')[0].toUpperCase()}
                      </span>
                      <div className="grow">
                        <b>{app.jobTitle}</b>
                        <small>
                          {app.companyName ? `${app.companyName} · ` : ''}
                          applied {timeAgo(app.appliedAt)}
                        </small>
                      </div>
                      <StatusBadge status={app.statusName} />
                      <MatchRing value={app.matchScore} size={46} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="u-stack">
          {!data.loading && !isRecruiter && <NextStepsCard items={checklist} />}
          {!data.loading && !isRecruiter && <JourneyCard counts={journey} />}
          {!data.loading && (
            <WaitingCard
              title={isRecruiter ? 'Waiting for your reply' : 'Waiting for a reply'}
              hint={isRecruiter ? 'All caught up. Every applicant has an answer.' : 'No application is waiting for an answer.'}
              items={waiting}
              to={isRecruiter ? '/my-jobs' : '/my-activity'}
              linkLabel={isRecruiter ? 'Open my jobs' : 'My activity'}
            />
          )}
          {!data.loading && <UpcomingInterviews interviews={upcoming} who={user.roleName} />}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;