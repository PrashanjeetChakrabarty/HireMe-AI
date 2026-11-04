import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActivityFeed } from '../api/jobApi';
import { Badge, Card, Empty, Notice, PageHead, Skeleton, Timeline } from '../components/ui';
import { getErrorMessage } from '../utils/errors';
import { fmtDateTime, timeAgo, toneForSummary } from '../utils/format';
import * as I from '../lib/icons';

const ACTION_LABEL = { INSERT: 'Created', UPDATE: 'Updated', DELETE: 'Removed' };
const actionTone = (action, summary) => (action === 'INSERT' ? 'ok' : action === 'DELETE' ? 'bad' : toneForSummary(summary));

function RecruiterActivityFeedPage() {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActivityFeed();
      setFeed(response.data);
    } catch (error) {
      console.error('Load activity feed error:', error);
      setMessage(getErrorMessage(error, 'Could not load activity feed.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user, loadFeed]);

  if (!user) {
    return <p className="u-gate">Please login first.</p>;
  }

  if (user.roleName !== 'Recruiter') {
    return <p className="u-gate">This page is only for recruiters.</p>;
  }

  return (
    <div className="app-wrap narrow">
      <PageHead title="Activity feed" sub="A live trail of every application change across your jobs.">
        <Badge tone="info">{feed.length} events</Badge>
      </PageHead>

      <Notice message={message} />
      {loading && <Skeleton rows={4} />}

      {!loading && feed.length === 0 && (
        <Empty icon={I.History} title="No activity recorded yet">
          New applications and status changes will appear here.
        </Empty>
      )}

      {feed.length > 0 && (
        <Card>
          <Timeline
            items={feed.map(entry => ({
              tone: actionTone(entry.action, entry.summary),
              badge: <Badge tone={actionTone(entry.action, entry.summary)}>{ACTION_LABEL[entry.action] || entry.action}</Badge>,
              title: entry.candidateName,
              sub: `→ ${entry.jobTitle}`,
              text: entry.summary,
              time: timeAgo(entry.changedAt),
              fullTime: fmtDateTime(entry.changedAt)
            }))}
          />
        </Card>
      )}
    </div>
  );
}

export default RecruiterActivityFeedPage;