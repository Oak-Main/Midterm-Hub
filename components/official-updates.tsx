import Link from 'next/link';
import { dayLabel, officialUpdateLabels, timestampLabel, type OfficialUpdateEvent } from '@/lib/election-night';

// Renders dated, source-linked official updates (corrected returns, completed
// recounts, certifications). Missing values are stated as missing; nothing is
// inferred, summed or carried to a wider scope than the cited document.

const when = (value: string | null, missing: string) => value === null ? missing : value.includes('T') ? timestampLabel(value) : dayLabel(value);
const anchor = (event: OfficialUpdateEvent) => `update-${event.id.toLowerCase()}`;
const contestNames = (event: OfficialUpdateEvent) => event.contests.map(contest => contest.contest).join('; ');

export function OfficialUpdates({ events, name }: { events: readonly OfficialUpdateEvent[]; name: string }) {
  if (!events.length) return null;
  return <section id="official-updates" className="refresh-content mt-6">
    <h2>Official updates since Election Day</h2>
    <p>Each entry records one {name} election-office document and the exact reporting unit it covers. It is not a statewide count, a race call or a certification unless the entry says the competent authority certified the contest.</p>
    {events.map(event => <article key={event.id} id={anchor(event)} data-update-kind={event.kind} className="mt-6 border-l-4 border-secondary bg-card p-5">
      <h3>{`${officialUpdateLabels[event.kind]}: ${contestNames(event)}`}</h3>
      <p><strong>Status:</strong> {event.status}. <strong>Authority:</strong> {event.authority}.</p>
      <p>{event.summary}</p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label={`${officialUpdateLabels[event.kind]} details`}><table><caption>{`What the ${event.authority} document changed`}</caption>
        <thead><tr><th scope="col">Contest</th><th scope="col">Candidates</th><th scope="col">Scope of the figures</th><th scope="col">Before</th><th scope="col">After</th><th scope="col">Change</th></tr></thead>
        <tbody>{event.contests.map(contest => <tr key={contest.contest}>
          <th scope="row">{contest.race_path ? <Link href={contest.race_path}>{contest.contest}</Link> : contest.contest}<span className="block text-xs font-normal">{contest.coverage}</span></th>
          <td>{contest.candidates}</td><td>{contest.scope}</td>
          <td>{contest.before ?? 'Not stated'}</td><td>{contest.after ?? 'Not stated'}</td><td>{contest.change ?? 'Not stated'}</td>
        </tr>)}</tbody></table></div>
      {event.caveats.length > 0 && <ul className="mt-3 list-disc pl-6">{event.caveats.map(caveat => <li key={caveat}>{caveat}</li>)}</ul>}
      <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
        <dt className="font-bold">Published by the authority</dt><dd>{when(event.dates.published, 'Not stated in the source')}</dd>
        <dt className="font-bold">Effective</dt><dd>{when(event.dates.effective, 'Not stated in the source')}</dd>
        <dt className="font-bold">Certified</dt><dd>{when(event.dates.certified, 'No certification of this contest is cited')}</dd>
        <dt className="font-bold">Document print time</dt><dd>{event.dates.printed ?? 'Not stated in the source'}</dd>
        <dt className="font-bold">First observed by Midterm Watch</dt><dd>{when(event.dates.first_observed, 'Not retained')}</dd>
        <dt className="font-bold">Sources last checked for later versions</dt><dd>{when(event.dates.last_checked, 'Not checked')}</dd>
      </dl>
      <p className="mt-3 text-sm"><strong>Official sources:</strong></p>
      <ul className="sources">{event.sources.map(source => <li key={source.url}><a href={source.url} rel="noopener noreferrer">{source.title}</a> · {source.publisher}{source.version ? ` · ${source.version}` : ''} · checked {dayLabel(source.checked_at)}</li>)}</ul>
    </article>)}
  </section>;
}

/** One-line pointers for a race page or the national hub; the detail lives on the state results page. */
export function OfficialUpdateLinks({ events, heading }: { events: readonly OfficialUpdateEvent[]; heading: string }) {
  if (!events.length) return null;
  return <section id="official-updates" className="refresh-content mt-6">
    <h2>{heading}</h2>
    <ul className="mt-3 list-disc pl-6">{events.map(event => <li key={event.id}>
      <Link className="editorial-link" href={`/results/${event.state.toLowerCase()}/#${anchor(event)}`}>{`${officialUpdateLabels[event.kind]}: ${contestNames(event)}`}</Link>
      {` (${event.status}; ${event.authority}${event.dates.published ? `, published ${when(event.dates.published, '')}` : ''})`}
    </li>)}</ul>
  </section>;
}
