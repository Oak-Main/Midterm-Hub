import snapshot from '@/content/refresh/evidence/pec-senate-2026-11-02.json';
import { refreshSources } from '@/lib/refresh';

export function ForecastUpdate() {
  const source = refreshSources.find(row => row.id === snapshot.source_id);
  if (!source || source.url !== snapshot.source_url || !('snapshot_path' in source) || typeof source.snapshot_path !== 'string') throw new Error('Missing forecast snapshot provenance');
  const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${snapshot.source_date}T12:00:00Z`));
  return <aside className="my-7 border-l-4 border-secondary bg-card p-5 text-sm">
    <p><strong>{date} forecast snapshot.</strong> The {source.publisher} estimated a {snapshot.democratic_seats} Democratic / {snapshot.republican_seats} Republican Senate. This is a pre-election estimate, not a vote count, election result or race call.</p>
    <p className="mt-2"><a className="editorial-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher} forecast</a> · <a className="editorial-link" href={source.snapshot_path}>Captured excerpt</a>. The linked forecast can change; the October 20 models below remain separate historical snapshots.</p>
  </aside>;
}
