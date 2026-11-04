import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDashboardOverview } from '../api/dashboardApi';
import { useTheme } from '../lib/theme';
import { Avatar, Card, CardHead, Empty, MatchRing, Notice, PageHead, Skeleton, Stat } from '../components/ui';
import * as I from '../lib/icons';

function RecruiterAnalyticsPage() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDashboardOverview();
      setData(response.data);
    } catch (error) {
      console.error('Load dashboard error:', error);
      setMessage('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  if (!user) {
    return <p className="u-gate">Please login first.</p>;
  }

  if (user.roleName !== 'Recruiter') {
    return <p className="u-gate">This page is only for recruiters.</p>;
  }

  // Chart colours follow the theme, so they stay readable in light and dark mode.
  const palette = [colors.accent, colors.accent2, '#ff6bc1', '#3be0b5', '#ffb35c', '#7bd4ff'];
  const axis = { fill: colors.muted, fontSize: 12 };
  const tip = {
    contentStyle: { background: colors.surface, border: `1px solid ${colors.grid}`, borderRadius: 12, color: colors.ink, fontSize: 13 },
    labelStyle: { color: colors.ink },
    itemStyle: { color: colors.ink },
    cursor: { fill: colors.grid }
  };
  const pipeline = data?.interviewPipeline ?? [];
  const pipeMax = Math.max(1, ...pipeline.map(p => p.count));

  return (
    <div className="app-wrap">
      <PageHead title="Analytics" sub="Applicants, matches and hiring trends across all of your jobs." />

      <Notice message={message} />
      {loading && <Skeleton rows={4} />}

      {!loading && data && (
        <>
          <div className="u-grid c3">
            <Stat icon={I.Users} value={data.totalCandidates} label="Total candidates" />
            <Stat icon={I.Briefcase} value={data.activeJobs} label="Active jobs" />
            <Stat icon={I.Target} value={data.totalApplicants} label="Applicants" />
          </div>

          <div className="u-grid side u-gap">
            <Card>
              <CardHead title="AI top candidates" />
              {data.aiTopCandidates.length === 0 ? (
                <Empty icon={I.Target} title="No scored applicants yet">
                  Once candidates apply, the highest matches are ranked here.
                </Empty>
              ) : (
                <ul className="u-list">
                  {data.aiTopCandidates.map((c, i) => (
                    <li key={i}>
                      <Avatar name={c.candidateName} />
                      <div className="grow">
                        <b>{c.candidateName}</b>
                        <small>{c.jobTitle}</small>
                      </div>
                      <MatchRing value={c.matchScore} size={52} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHead title="Interview pipeline" />
              {pipeline.length === 0 ? (
                <p className="u-hint">No applications yet.</p>
              ) : (
                <div className="u-funnel">
                  {pipeline.map(stage => (
                    <div className="r" key={stage.statusName}>
                      <span>{stage.statusName}</span>
                      <div className="bar">
                        <i style={{ width: `${(stage.count / pipeMax) * 100}%` }} />
                      </div>
                      <b>{stage.count}</b>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="u-gap">
            <CardHead title="Skill distribution" />
            <div className="u-chart">
              {data.skillDistribution.length === 0 ? (
                <p className="u-hint">No skill data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.skillDistribution} layout="vertical" margin={{ left: 12, right: 12 }}>
                    <defs>
                      <linearGradient id="skillGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={colors.accent} />
                        <stop offset="100%" stopColor={colors.accent2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={axis} stroke={colors.grid} />
                    <YAxis type="category" dataKey="skillName" width={110} tick={axis} stroke={colors.grid} />
                    <Tooltip {...tip} />
                    <Bar dataKey="count" fill="url(#skillGrad)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div className="u-grid c2 u-gap">
            <Card>
              <CardHead title="Candidate status" />
              <div className="u-chart">
                {data.candidateStatusBreakdown.length === 0 ? (
                  <p className="u-hint">No status data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.candidateStatusBreakdown}
                        dataKey="count"
                        nameKey="statusName"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={92}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {data.candidateStatusBreakdown.map((entry, i) => (
                          <Cell key={i} fill={palette[i % palette.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...tip} />
                      <Legend wrapperStyle={{ color: colors.muted, fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card>
              <CardHead title="Applications over time" />
              <div className="u-chart">
                {data.hiringAnalytics.length === 0 ? (
                  <p className="u-hint">No application trend data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.hiringAnalytics} margin={{ left: -10, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colors.accent} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={axis} stroke={colors.grid} />
                      <YAxis allowDecimals={false} tick={axis} stroke={colors.grid} />
                      <Tooltip {...tip} />
                      <Area type="monotone" dataKey="applicationCount" stroke={colors.accent} strokeWidth={2.5} fill="url(#trendGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default RecruiterAnalyticsPage;