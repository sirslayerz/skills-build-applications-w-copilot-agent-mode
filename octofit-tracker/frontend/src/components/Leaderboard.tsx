import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardItem = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const payload = await getJson<{ leaderboard: LeaderboardItem[] }>('/api/leaderboard');
        if (!active) return;
        setLeaderboard(payload.leaderboard ?? []);
      } catch (loadError) {
        if (!active) return;
        setError((loadError as Error).message || 'Unable to load leaderboard');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Leaderboard</h2><p role="status">Loading leaderboard...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Leaderboard</h2><p role="alert">Unable to load leaderboard: {error}</p></div></section>;
  }

  if (leaderboard.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Leaderboard</h2><p role="status">No leaderboard</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Leaderboard</h2><ol className="list-group list-group-numbered">{leaderboard.map((entry, index) => <li key={`${entry.teamName ?? 'team'}-${index}`} className="list-group-item"><strong>{entry.teamName ?? 'Team'}</strong> — {entry.totalPoints ?? 0} points · rank {entry.rank ?? index + 1}</li>)}</ol></div></section>;
}
