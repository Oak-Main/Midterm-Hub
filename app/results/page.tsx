import type { ReactNode } from 'react';
import Link from 'next/link';
import { pageMetadata } from '@/lib/refresh';
import { BreadcrumbData } from '@/components/structured-data';
import { JumpToState } from '@/components/jump-to-state';
import { electionStatus, officialResults, pollClose } from '@/lib/election-night-data';
import { clockLabel, dayLabel, pollSourceKey, type PollSource, editionLabels, sortByClose, tagLabels, timestampLabel, zoneLabel, type EditionState } from '@/lib/election-night';

// KEVYN-WRITE: meta title and description naming poll-closing times, official results links and the per-state pages | facts: this page lists 51 poll-closing rows and 51 election-authority results links (content/election-night/*.json); per-state pages at /results/[state]/
export const metadata = { twitter: { card: 'summary_large_image' as const }, ...pageMetadata('2026 election results status: poll closing times and official results', 'State-by-state poll-closing information for the November 3, 2026 election: times where verified, election-office fallbacks elsewhere, and official results links for all 50 states and DC. No live counts or calls here.', '/results/') };

// One sentence per edition state, rendered inside the status banner.
const statusSentence: Record<EditionState, ReactNode> = {
  awaiting_polls: null, // KEVYN-WRITE: awaiting_polls banner sentence: polls have not yet closed; this page lists each state's official closing time and results page | facts: earliest close in content/election-night/poll-close-2026.json; status.json edition_state=awaiting_polls
  election_day: null, // KEVYN-WRITE: election_day banner sentence: polls are open today and close at different times by state; official results come from each state's election authority | facts: first and last closes in poll-close-2026.json (sources per row); official-results.json
  // Facts: last verified close 12:00 a.m. ET Nov 4 (content/election-night/poll-close-2026.json); official-results.json. Owner-approved wording.
  counting: "Polls have closed in every state; the last verified closing time was midnight ET on November 4. Election authorities are counting, and the official results links below are the source for every count.",
  // Facts: conditional_runoffs in content/refresh/content-package.json (GA Dec 1, MS Dec 1, LA Dec 12); runoff sections on /results/[state]/ and /states/[state]/. Owner-approved wording.
  post_election: "Counting and certification continue on each state's own schedule, and the official results links below stay current. Where a state requires a runoff, its page lists the date and registration rules.",
};

const sourceList = (row: { sources: PollSource[] }) => row.sources.map(source => (
  <span key={pollSourceKey(source)} className="block"><a href={source.url} rel="noopener noreferrer">{source.publisher}</a> · retrieved {dayLabel(source.retrieved_at)}</span>
));

export default function Results() {
  const rows = sortByClose(pollClose.rows);
  const results = [...officialResults.rows].sort((a, b) => a.name.localeCompare(b.name));
  const states = results.map(row => [row.state, row.name] as [string, string]);
  return <article className="mx-auto max-w-5xl px-5 py-14 lg:px-8"><BreadcrumbData name="Result status" path="/results/" />
    <h1 className="font-serif text-5xl font-bold">Forecasts and results stay separate.</h1>
    <div className="mt-7 border-l-4 border-secondary bg-card p-6" data-edition-state={electionStatus.edition_state}>
      <p className="rule-label text-secondary">{`Status: ${editionLabels[electionStatus.edition_state]}`}</p>
      <p className="mt-2"><strong>No live results or election calls are published here.</strong> This site has no live vote-count or election-call feed. Its dated pre-election estimates are not results, even after polls close. Consult election authorities for official results. {statusSentence[electionStatus.edition_state]}</p>
      {/* KEVYN-WRITE: two sentences stating what this site reports (official poll-closing times, links to each election authority's results page, the publication rules below) and what it does not (vote counts, projections, race calls, AP or other licensed results) | facts: content/election-night/*.json; Projected requires a named call provider (table below); out-of-scope list in the Nov 2 results-night task */}
      <p className="mt-3 font-mono text-xs text-muted-foreground">Status updated {timestampLabel(electionStatus.updated_at)}</p>
    </div>
    <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-bold"><a className="editorial-link" href="#poll-closing">Poll-closing times</a><a className="editorial-link" href="#official-results">Official results links</a><a className="editorial-link" href="#publication-states">Result publication states</a><a className="editorial-link" href="#sources">Sources and retrieval dates</a></nav>

    <section id="poll-closing" className="refresh-content mt-6">
      <h2>Poll-closing times, November 3</h2>
      {/* KEVYN-WRITE: one or two sentences introducing the table: final statewide closing time in local time and Eastern time, sorted by Eastern time, where a state spans two zones the later close is when all its polls have closed | facts: time basis in content/election-night/poll-close-2026.json time_basis (DST ends Nov 1, 2026; ET = UTC-5) with its sources; each row's sources */}
      <p>Times are shown where verified. Where a statewide time or an area’s closing time is unverified or conflicting, check the linked election office. Local closing dates are November 3; Eastern times after midnight are labeled November 4.</p>
      <JumpToState options={states} prefix="close-" label="Jump to a state" />
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Poll-closing times by state, sorted by Eastern time"><table><caption>Poll-closing information for the November 3, 2026 election, earliest verified Eastern time first</caption>
        <thead><tr><th scope="col">State</th><th scope="col">Polls close (local)</th><th scope="col">Eastern time</th><th scope="col">Source</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.state} id={`close-${row.state.toLowerCase()}`} tabIndex={-1} data-tag={row.tag}>
          <th scope="row"><Link href={`/results/${row.state.toLowerCase()}/`}>{row.name}</Link></th>
          {row.tag === 'UNVERIFIED' || row.tag === 'CONFLICT'
            ? <td colSpan={2}><a href={row.election_office_url} rel="noopener noreferrer">{`Check the ${row.name} election office`}</a></td>
            : <><td>{row.closes.map((close, index) => <span key={close.zone + close.area} className="block">{`${clockLabel(close.local_time)} ${zoneLabel(close.zone)}`}{index === row.closes.length - 1 && row.closes.length > 1 && !row.unverified_areas?.length && <strong className="block text-xs">All polls closed</strong>}</span>)}
                {row.unverified_areas?.map(area => <span key={area} className="mt-1 block text-xs">{`${area}: `}<a href={row.election_office_url} rel="noopener noreferrer">{`Check the ${row.name} election office`}</a></span>)}</td>
              <td>{row.closes.map(close => <span key={close.zone + close.area} className="block">{close.et}</span>)}</td></>}
          <td><span className="block text-xs font-bold">{tagLabels[row.tag]}</span>{sourceList(row)}</td>
        </tr>)}</tbody></table></div>
      {/* KEVYN-WRITE: one sentence explaining rows that say "Check the [state] election office": no single official statewide closing time could be confirmed for that state or area before publication | facts: New Hampshire, RSA 659:4 sets only an earliest close of 7 p.m. (https://gc.nh.gov/rsa/html/LXIII/659/659-4.htm); Alaska's Aleutian Islands west of 169°30′ W are in the Hawaii-Aleutian zone (49 CFR 71.12, https://www.ecfr.gov/current/title-49/subtitle-A/part-71/section-71.12) and no official page stated their close; rows tagged UNVERIFIED or with unverified_areas in content/election-night/poll-close-2026.json */}
    </section>

    <section id="official-results" className="refresh-content mt-6">
      <h2>Official results links</h2>
      {/* KEVYN-WRITE: each state name links its per-state results page (closing times and the authority link); each outbound link opens the election authority's own results page; a page marked pending was the authority's results landing page when checked because its 2026 general page was not yet posted | facts: content/election-night/official-results.json (final URL after redirects, HTTP status, checked_at per row); /results/[state]/ routes */}
      <p className="mt-2">Each state name opens its per-state results page; the third column opens the election authority directly.</p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label="Official election results pages by state"><table><caption>Election authority results pages, checked {dayLabel(results.map(row => row.checked_at).sort().at(-1) ?? '2026-11-02')}</caption>
        <thead><tr><th scope="col">State</th><th scope="col">Election authority</th><th scope="col">Results page</th></tr></thead>
        <tbody>{results.map(row => <tr key={row.state} id={`results-${row.state.toLowerCase()}`} data-pending={row.pending}>
          <th scope="row"><Link href={`/results/${row.state.toLowerCase()}/`}>{row.name}</Link></th><td>{row.authority}</td>
          <td><a href={row.url} rel="noopener noreferrer">{new URL(row.url).hostname}</a>{row.pending && <span className="block text-xs font-bold">2026 results page pending</span>}</td>
        </tr>)}</tbody></table></div>
    </section>

    <section id="publication-states" className="refresh-content mt-6"><table><caption>Result publication states</caption><thead><tr><th scope="col">State</th><th scope="col">Required evidence</th></tr></thead><tbody><tr><td>Pre-election snapshot</td><td>Historical reference; forecasts remain labeled estimates.</td></tr><tr><td>Counting</td><td>A dated, named vote-count provider and its coverage and reporting limitations.</td></tr><tr><td>Projected</td><td>A named call provider, source link and exact call time. A forecast alone cannot trigger this state.</td></tr><tr><td>Certified</td><td>The relevant election authority’s certification document and date.</td></tr><tr><td>Corrected</td><td>The earlier claim, corrected value, evidence and correction time.</td></tr></tbody></table><p>These states describe publication requirements. Later results must be added from their evidence; this page does not automatically advance when polls close.</p></section>

    <section id="sources" className="refresh-content mt-6">
      <h2>Sources and retrieval dates</h2>
      {/* KEVYN-WRITE: one sentence saying every closing time and results link below was opened at its official source on the date shown | facts: retrieved_at / checked_at fields in content/election-night/poll-close-2026.json and official-results.json */}
      <h3>Time basis</h3>
      <ul className="sources">{pollClose.time_basis.sources.map(source => <li key={source.url}><a href={source.url} rel="noopener noreferrer">{source.publisher}</a> · retrieved {dayLabel(source.retrieved_at)}</li>)}</ul>
      <h3>By state</h3>
      <ul className="sources">{results.map(result => {
        const row = pollClose.rows.find(item => item.state === result.state);
        return <li key={result.state} className="mt-2"><strong>{result.name}.</strong> Poll closing: {row?.sources.length ? sourceList(row) : <a href={row?.election_office_url} rel="noopener noreferrer">election office</a>} Official results: <a href={result.url} rel="noopener noreferrer">{result.authority}</a> · checked {dayLabel(result.checked_at)}</li>;
      })}</ul>
    </section>
  </article>;
}
