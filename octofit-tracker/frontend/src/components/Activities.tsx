import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
  occurredAt?: string;
  user?: string;
  team?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const payload = await getJson<{ activities: Activity[] }>('/api/activities');
        if (!active) return;
        setActivities(payload.activities ?? []);
      } catch (loadError) {
        if (!active) return;
        setError((loadError as Error).message || 'Unable to load activities');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Activities</h2><p role="status">Loading activities...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Activities</h2><p role="alert">Unable to load activities: {error}</p></div></section>;
  }

  if (activities.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Activities</h2><p role="status">No activities</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Activities</h2><ul className="list-group list-group-flush">{activities.map((activity, index) => <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item"><strong>{activity.type ?? 'Activity'}</strong> · {activity.minutes ?? 0} minutes · {activity.points ?? 0} points</li>)}</ul></div></section>;
}
