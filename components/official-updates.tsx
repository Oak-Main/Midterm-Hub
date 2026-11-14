import Link from 'next/link';
import { certificationDateLabel, dayLabel, officialUpdateLabels, timestampLabel, type OfficialUpdateEvent } from '@/lib/election-night';

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
      {event.contests.map(contest => <div key={contest.contest} className="mt-4 border-t pt-3" data-contest={contest.contest}>
        <p className="font-bold">{contest.race_path ? <Link className="editorial-link" href={contest.race_path}>{contest.contest}</Link> : contest.contest} <span className="text-xs font-normal">({contest.coverage})</span></p>
        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="font-bold">Candidates</dt><dd>{contest.candidates}</dd>
          <dt className="font-bold">Scope</dt><dd>{contest.scope}</dd>
          <dt className="font-bold">Before</dt><dd>{contest.before ?? 'Prior tally not stated or not retained'}</dd>
          <dt className="font-bold">After</dt><dd>{contest.after ?? 'Not stated'}</dd>
          <dt className="font-bold">Change</dt><dd>{contest.change ?? 'Not stated'}</dd>
        </dl>
      </div>)}
      {event.caveats.length > 0 && <ul className="mt-3 list-disc pl-6">{event.caveats.map(caveat => <li key={caveat}>{caveat}</li>)}</ul>}
      <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
        <dt className="font-bold">Published by the authority</dt><dd>{when(event.dates.published, 'Not stated in the source')}</dd>
        <dt className="font-bold">Effective</dt><dd>{when(event.dates.effective, 'Not stated in the source')}</dd>
        <dt className="font-bold">{certificationDateLabel(event.kind)}</dt><dd>{when(event.dates.certified, 'No certification of this contest is cited')}</dd>
        <dt className="font-bold">Document print time</dt><dd>{event.dates.printed ?? 'Not stated in the source'}</dd>
        <dt className="font-bold">First observed by Midterm Watch</dt><dd>{when(event.dates.first_observed, 'Not retained')}</dd>
        <dt className="font-bold">Sources last checked for later versions</dt><dd>{when(event.dates.last_checked, 'Not checked')}</dd>
      </dl>
      <p className="mt-3 text-sm"><strong>Official sources:</strong></p>
      <ul className="sources">{event.sources.map(source => <li key={source.url}><a href={source.url} rel="noopener noreferrer">{source.title}</a> · {source.publisher}{source.version ? ` · ${source.version}` : ''} · checked {when(source.checked_at, '')}</li>)}</ul>
    </article>)}
  </section>;
}

/** One-line pointers for a race page or the national hub; the detail lives on the state results page.
 * With `path`, only the contest on that page is named, with its scope, so a race page never leads with another contest. */
export function OfficialUpdateLinks({ events, heading, path }: { events: readonly OfficialUpdateEvent[]; heading: string; path?: string }) {
  if (!events.length) return null;
  return <section id="official-updates" className="refresh-content mt-6">
    <h2>{heading}</h2>
    <ul className="mt-3 list-disc pl-6">{events.map(event => {
      const contests = path ? event.contests.filter(contest => contest.race_path === path || contest.coverage_path === path) : event.contests;
      const scope = contests.length === 1 ? contests[0].scope : null;
      return <li key={event.id}>
        <Link className="editorial-link" href={`/results/${event.state.toLowerCase()}/#${anchor(event)}`}>{`${officialUpdateLabels[event.kind]}: ${contests.map(contest => contest.contest).join('; ')}`}</Link>
        {` — ${event.status}${scope ? `; ${scope}` : ''}. ${event.authority}${event.dates.published ? `, published ${when(event.dates.published, '')}` : ''}.`}
      </li>;
    })}</ul>
  </section>;
}
