import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  name?: string;
  mascot?: string;
  members?: Array<string | { toString(): string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const payload = await getJson<{ teams: Team[] }>('/api/teams');
        if (!active) return;
        setTeams(payload.teams ?? []);
      } catch (loadError) {
        if (!active) return;
        setError((loadError as Error).message || 'Unable to load teams');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><p role="status">Loading teams...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><p role="alert">Unable to load teams: {error}</p></div></section>;
  }

  if (teams.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><p role="status">No teams</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><ul className="list-group list-group-flush">{teams.map((team, index) => <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item"><strong>{team.name ?? 'Team'}</strong> · {team.mascot ?? 'Mascot'} · {Array.isArray(team.members) ? team.members.length : 0} members</li>)}</ul></div></section>;
}
