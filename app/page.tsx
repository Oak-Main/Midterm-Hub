import Link from 'next/link';
import { DeadlineBoard } from '@/components/data-art';
import { ElectionMasthead } from '@/components/election-masthead';
import { StateSelector } from '@/components/state-selector';
import { EditionNote } from '@/components/edition-note';
import { ForecastUpdate } from '@/components/forecast-update';
import { RunoffNotice } from '@/components/runoff-notice';
import { RefreshContent } from '@/components/refresh-content';
import { StructuredData } from '@/components/structured-data';
import { canonicalOrigin, downBallotSections, guideFor, pageMetadata, refresh, refreshHtml } from '@/lib/refresh';
import { electionStatus } from '@/lib/election-night-data';
import { editionLabels, timestampLabel, type EditionState } from '@/lib/election-night';
import { ElectionDayFaq } from '@/components/election-day-faq';

// Lead of the Election Day block (the meta description is separate below); keyed off
// status.json like the /results/ banner. The home page is unchanged from
// counting to post_election (docs/RESULTS-NIGHT.md, flip 3).
const beforeCloseLead = 'Election Day is Tuesday, November 3, 2026. Polls close starting 6 PM ET tonight — live results begin ~8 PM ET.';
// Facts: last verified close 12:00 a.m. ET Nov 4 (content/election-night/poll-close-2026.json); official results links (official-results.json); this site reports no counts or calls. Worded to hold for both counting and post_election.
const afterCloseLead = 'Election Day was Tuesday, November 3. The last verified poll close was midnight ET on November 4; final closing times in New Hampshire, North Dakota and western Alaska were not independently verified. Find each state’s official results page here — this site reports no vote counts and calls no races.';
// Meta description for the same states, kept under the 160-character snippet budget (tests/test_site_regressions.py).
const afterCloseDescription = 'Election Day was Nov 3; last verified poll close midnight ET Nov 4 (NH, ND, western Alaska unverified). Official results links — no vote counts, no race calls.';
const leadSentence: Record<EditionState, string> = { awaiting_polls: beforeCloseLead, election_day: beforeCloseLead, counting: afterCloseLead, post_election: afterCloseLead };
const lead = leadSentence[electionStatus.edition_state];

const descriptionFor: Record<EditionState, string> = { awaiting_polls: beforeCloseLead, election_day: beforeCloseLead, counting: afterCloseDescription, post_election: afterCloseDescription };
const description = descriptionFor[electionStatus.edition_state];

export const metadata = pageMetadata('2026 Midterm Election Results, Dates & Live Status', description, '/');
const runoffs = refresh.conditional_runoffs.map(row => ({ state: row.state, name: guideFor(row.state)?.name ?? row.state, date: row.date, href: `/states/${row.state.toLowerCase()}/` }));
export default function Home() {
  return <>
    <StructuredData value={{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Midterm Watch', url: canonicalOrigin + '/', description: 'A source-linked reference for the 2026 US midterm elections.' }} />
    <section className="border-b"><div className="mx-auto grid max-w-[100rem] md:grid-cols-[1.08fr_.92fr]">
      <div className="paper-grid flex flex-col justify-center gap-7 px-5 py-16 md:px-10 md:py-24 xl:pl-[max(2rem,calc((100vw-80rem)/2))]">
        <p className="rule-label">The 2026 midterms · October 20 research edition</p><h1 className="text-balance font-serif text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">Every race.<br />Every deadline.<br />Follow the sources.</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">Track all 435 House races, compare election forecasts, and find the voting rules that apply to your state and method.</p><div className="max-w-lg"><StateSelector /></div>
        <nav aria-label="Election coverage" className="flex flex-wrap gap-5 font-bold"><Link className="editorial-link" href="/house/">House</Link><Link className="editorial-link" href="/senate/">Senate</Link><Link className="editorial-link" href="/governors/">Governors</Link><Link className="editorial-link" href="/down-ballot/">Down-ballot</Link><Link className="editorial-link" href="/results/">Results</Link></nav>
      </div>
      <ElectionMasthead state={electionStatus.edition_state} runoffs={runoffs} countdownCaption="The calendar date does not indicate whether polls are open. Louisiana House contests may require a December runoff. Check your state guide for voting windows, eligibility and local hours." className="min-h-[24rem] border-0" />
    </div></section>
    <section className="border-b"><div className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="border-l-4 border-secondary bg-card p-6" data-edition-state={electionStatus.edition_state}>
      <h2 className="rule-label text-secondary">Election Day · Tuesday, November 3, 2026</h2>
      <p className="mt-2 text-lg"><strong>{lead}</strong></p>
      <p className="mt-2 text-muted-foreground">First closes: Indiana and Kentucky at 6 PM ET; the last verified close is midnight ET (Alaska and Hawaii). This site links each state’s official results page — it does not publish vote counts or call races. <Link className="editorial-link font-bold" href="/results/">Live results status and poll-closing times →</Link></p>
      <p className="mt-3 font-mono text-xs text-muted-foreground">Status: {editionLabels[electionStatus.edition_state]} · updated {timestampLabel(electionStatus.updated_at)}</p>
    </div></div></section>
    <section className="border-b bg-primary text-primary-foreground"><div className="mx-auto grid max-w-7xl grid-cols-2 px-5 md:grid-cols-4">{[['435', 'House districts'], ['35', 'Senate contests'], ['36', 'Governor races'], ['51', 'State/DC voting guides']].map(([number, label]) => <div className="border-l border-primary-foreground/20 px-4 py-6" key={label}><strong className="font-serif text-4xl text-highlight">{number}</strong><span className="mt-2 block text-sm">{label}</span></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><p className="rule-label">The national outlook</p><h2 className="mt-3 font-serif text-4xl font-bold">Dated forecast snapshots</h2><ForecastUpdate /><h3 className="mt-8 font-serif text-3xl font-bold">October 20: Democrats favored for the House; a close Senate.</h3><EditionNote /><RefreshContent html={refreshHtml('home.html')} /><p className="mt-7 flex flex-wrap gap-5 font-bold"><Link className="editorial-link" href="/forecast/">Compare national model snapshots</Link><Link className="editorial-link" href="/polls/">Inspect the Senate polls</Link></p></section>
    <RunoffNotice />
    <DeadlineBoard initialDate={refresh.as_of_date} />
    <ElectionDayFaq />
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><p className="rule-label">The state desk</p><h2 className="mt-3 font-serif text-4xl font-bold">Power is also decided down the ballot.</h2><div className="mt-8 grid gap-5 md:grid-cols-2">{downBallotSections.map(item => <article key={item.slug} className="border-t-2 border-secondary py-6"><h3 className="font-serif text-2xl"><Link className="editorial-link" href={`/down-ballot/${item.slug}/`}>{item.title}</Link></h3><p className="mt-3 max-w-xl text-muted-foreground">{item.description}</p></article>)}</div><p className="mt-7 text-sm text-muted-foreground">This is a selected national watchlist. Candidate lists show featured identities; linked ballot resources contain the complete field. Forecasts never serve as election calls.</p></section>
  </>;
}
