import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BreadcrumbData } from '@/components/structured-data';
import { electionStatus, officialResults, pollClose } from '@/lib/election-night-data';
import { clockLabel, dayLabel, pollSourceKey, resultsDescription, editionLabels, tagLabels, timestampLabel, zoneLabel, type EditionState } from '@/lib/election-night';
import { electionHref, forState, states } from '@/lib/data';
import { pageMetadata, refresh, refreshHtml } from '@/lib/refresh';
import { RunoffRegistration } from '@/components/runoff-registration';
import { RefreshContent } from '@/components/refresh-content';

export const dynamicParams = false;
export function generateStaticParams() { return states.map(([state]) => ({ state: state.toLowerCase() })); }

const rowFor = (code: string) => pollClose.rows.find(row => row.state === code.toUpperCase());
const resultsRowFor = (code: string) => officialResults.rows.find(row => row.state === code.toUpperCase());
/** "Tuesday, December 1, 2026" for a YYYY-MM-DD runoff date. */
const runoffDateLabel = (date: string) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

// KEVYN-WRITE: per-state results route metadata — answer-first with the state's final poll close and its official results authority | facts: content/election-night/poll-close-2026.json rows[].closes[].et (final row) and official-results.json rows[].authority
export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const row = rowFor(state);
  const results = resultsRowFor(state);
  if (!row || !results) return { title: 'State not found' };
  const title = `${row.name} 2026 election results: poll closing and official results`;
  const description = resultsDescription(row, results.authority);
  return { ...pageMetadata(title, description, `/results/${state.toLowerCase()}/`), twitter: { card: 'summary_large_image' } };
}

// KEVYN-WRITE: status banner sentence per edition state, scoped to one state | facts: edition_state from content/election-night/status.json; poll-close-2026.json row for this state
const statusSentence: Record<EditionState, (name: string) => string> = {
  awaiting_polls: (name) => `${name} polls have not opened yet; the schedule below shows sourced closing times and election-office fallbacks for November 3.`,
  election_day: (name) => `${name} Election Day closing information is below; official results follow from the ${name} election authority.`,
  counting: (name) => `${name} polls have closed and election authorities are counting; the official results link below is the source of counts.`,
  post_election: (name) => `${name} counting and certification continue under the state's schedule; the official results link below stays current.`,
};

export default async function StateResultsPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const row = rowFor(state);
  const results = resultsRowFor(state);
  if (!row || !results) notFound();
  const code = row.state;
  const general = forState(code).find(election => election.election_type === 'general' && election.election_date === '2026-11-03');
  // Conditional runoffs come from content/refresh/content-package.json, the same
  // record the voting guide renders, so the /results/ post_election banner's
  // "its page lists the date and registration rules" holds on this page too.
  const runoff = refresh.conditional_runoffs.find(item => item.state === code);
  return <article className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
    <BreadcrumbData name={`${row.name} 2026 results`} path={`/results/${state}/`} parent={{ name: 'Result status', path: '/results/' }} />
    <nav className="rule-label" aria-label="Breadcrumb"><Link href="/results/">Result status</Link> / {row.name}</nav>
    <h1 className="mt-5 font-serif text-5xl font-bold">{row.name} 2026 election results</h1>
    {/* KEVYN-WRITE: status banner — this site publishes no live counts or calls for this state; the sentence follows the edition state | facts: status.json edition_state; poll-close-2026.json row; official-results.json row */}
    <div className="mt-7 border-l-4 border-secondary bg-card p-6" data-edition-state={electionStatus.edition_state}>
      <p className="rule-label text-secondary">{`Status: ${editionLabels[electionStatus.edition_state]}`}</p>
      <p className="mt-2"><strong>No live results or election calls are published here.</strong> {statusSentence[electionStatus.edition_state](row.name)} Official {row.name} results come from the {results.authority}.</p>
      <p className="mt-3 font-mono text-xs text-muted-foreground">Status updated {timestampLabel(electionStatus.updated_at)}</p>
    </div>

    <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-bold">
      <a className="editorial-link" href="#poll-closing">Poll closing</a>
      <a className="editorial-link" href="#official-results">Official results</a>
      {general && <a className="editorial-link" href="#ballot">On the {row.name} ballot</a>}
      {runoff && <a className="editorial-link" href="#runoff">Conditional runoff</a>}
      <Link className="editorial-link" href={`/states/${state}/`}>{row.name} voting guide</Link>
    </nav>

    <section id="poll-closing" className="refresh-content mt-6">
      <h2>Poll closing in {row.name}, November 3</h2>
      {/* KEVYN-WRITE: closing-time table for this state only — local time, zone and Eastern time per closing wave, with per-row sources | facts: content/election-night/poll-close-2026.json rows[state] closes[] and sources[] */}
      <div className="table-wrap" role="region" tabIndex={0} aria-label={`${row.name} poll closing times`}><table><caption>{`${row.name} poll-closing information for the November 3, 2026 election`}</caption>
        <thead><tr><th scope="col">Area</th><th scope="col">Polls close (local)</th><th scope="col">Eastern time</th><th scope="col">Source</th></tr></thead>
        <tbody><tr data-tag={row.tag}>
          {row.tag === 'UNVERIFIED' || row.tag === 'CONFLICT'
            ? <td colSpan={3}><a href={row.election_office_url} rel="noopener noreferrer">{`Check the ${row.name} election office`}</a></td>
            : <><th scope="row">{row.closes.map(close => <span key={close.zone + close.area} className="block">{`${close.area} (${zoneLabel(close.zone)})`}</span>)}
                {row.unverified_areas?.map(area => <span key={area} className="mt-1 block text-xs">{`${area}: `}<a href={row.election_office_url} rel="noopener noreferrer">{`Check the ${row.name} election office`}</a></span>)}</th>
              <td>{row.closes.map(close => <span key={close.zone + close.area} className="block">{clockLabel(close.local_time)}</span>)}</td>
              <td>{row.closes.map(close => <span key={close.zone + close.area} className="block">{close.et}</span>)}</td></>}
          <td><span className="block text-xs font-bold">{tagLabels[row.tag]}</span>{row.sources.map(source => <span key={pollSourceKey(source)} className="block"><a href={source.url} rel="noopener noreferrer">{source.publisher}</a> · retrieved {dayLabel(source.retrieved_at)}</span>)}</td>
        </tr></tbody></table></div>
      {row.split_zone_note && <p className="mt-3 text-sm text-muted-foreground">{row.split_zone_note}</p>}
    </section>

    <section id="official-results" className="refresh-content mt-6">
      <h2>Official {row.name} results</h2>
      {/* KEVYN-WRITE: the election authority's own results page for this state, with the date it was last checked | facts: content/election-night/official-results.json rows[state] authority, url, checked_at, pending */}
      <p>The authority publishing {row.name}&rsquo;s official results is the {results.authority}.{results.pending ? ' Its dedicated 2026 results page had not been posted when last checked; the link opens the authority’s results landing page.' : ''}</p>
      <p className="mt-3"><a className="editorial-link" href={results.url} rel="noopener noreferrer">{`Open official ${row.name} results`}</a> <span className="text-sm text-muted-foreground">· checked {dayLabel(results.checked_at)}</span></p>
    </section>

    {general && <section id="ballot" className="refresh-content mt-6">
      <h2>On the {row.name} ballot, November 3</h2>
      {/* KEVYN-WRITE: offices listed for this state's 2026 general election, linking the state's race page | facts: generated/elections.json general 2026-11-03 row offices[] for this state */}
      <ul className="mt-3 list-disc pl-6">{general.offices.map(office => <li key={office}>{office}</li>)}</ul>
      <p className="mt-3"><Link className="editorial-link" href={electionHref(general)}>{`All ${row.name} 2026 races`}</Link></p>
    </section>}

    {runoff && <section id="runoff" className="refresh-content mt-6">
      <h2>Conditional runoff</h2>
      {/* KEVYN-WRITE: runoff possibility for this state with the registration link | facts: content/refresh/content-package.json conditional_runoffs (GA Dec 1, MS Dec 1, LA Dec 12) */}
      <p>{row.name} contests can require a December runoff if no candidate clears the threshold. See the runoff section of the <Link className="editorial-link" href={`/states/${state}/`}>{row.name} voting guide</Link>.</p>
      {/* Date and registration rules come from the conditional_runoffs record and its sourced fragment, as on the voting guide. */}
      <p><strong>Runoff date, if required.</strong> {runoffDateLabel(runoff.date)}. Applies to: {runoff.offices}.</p>
      <RunoffRegistration state={code} />
      <RefreshContent html={refreshHtml(`runoffs/${state}.html`)} />
    </section>}

    <footer className="mt-10 border-t pt-6 text-sm text-muted-foreground">
      <p><Link className="editorial-link" href="/results/">National result status</Link> · <Link className="editorial-link" href={`/states/${state}/`}>{`${row.name} voting guide`}</Link> · <Link className="editorial-link" href="/methodology/">Methodology</Link> · <Link className="editorial-link" href="/sources/">Sources</Link></p>
    </footer>
  </article>;
}
