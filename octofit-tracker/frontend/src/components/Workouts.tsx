import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const payload = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (!active) return;
        setSuggestions(payload.suggestions ?? []);
      } catch (loadError) {
        if (!active) return;
        setError((loadError as Error).message || 'Unable to load workout suggestions');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><p role="status">Loading workout suggestions...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><p role="alert">Unable to load workout suggestions: {error}</p></div></section>;
  }

  if (suggestions.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><p role="status">No workout suggestions</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><ul className="list-group list-group-flush">{suggestions.map((suggestion, index) => <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item"><strong>{suggestion.title ?? 'Workout'}</strong> · {suggestion.focus ?? 'general'}<br /><small>{suggestion.reason ?? 'Recommended for your activity pattern.'}</small></li>)}</ul></div></section>;
}
