import Link from 'next/link';
import { CountdownMasthead, DeadlineBoard } from '@/components/data-art';
import { StateSelector } from '@/components/state-selector';
import { EditionNote } from '@/components/edition-note';
import { RefreshContent } from '@/components/refresh-content';
import { StructuredData } from '@/components/structured-data';
import { canonicalOrigin, downBallotSections, pageMetadata, refresh, refreshHtml } from '@/lib/refresh';

export const metadata = pageMetadata('2026 midterm elections: races, forecasts and voting guides', 'All 435 House races, 35 Senate contests, 36 governor races and method-specific voting guides. Research edition October 20, 2026.', '/');
export default function Home() {
  return <>
    <StructuredData value={{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Midterm Watch', url: canonicalOrigin + '/', description: 'A source-linked reference for the 2026 US midterm elections.' }} />
    <section className="border-b"><div className="mx-auto grid max-w-[100rem] md:grid-cols-[1.08fr_.92fr]">
      <div className="paper-grid flex flex-col justify-center gap-7 px-5 py-16 md:px-10 md:py-24 xl:pl-[max(2rem,calc((100vw-80rem)/2))]">
        <p className="rule-label">The 2026 midterms · October 20 research edition</p><h1 className="text-balance font-serif text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">Every race.<br />Every deadline.<br />Follow the sources.</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">Track all 435 House races, compare election forecasts, and find the voting rules that apply to your state and method.</p><div className="max-w-lg"><StateSelector /></div>
        <nav aria-label="Election coverage" className="flex flex-wrap gap-5 font-bold"><Link className="editorial-link" href="/house/">House</Link><Link className="editorial-link" href="/senate/">Senate</Link><Link className="editorial-link" href="/governors/">Governors</Link><Link className="editorial-link" href="/down-ballot/">Down-ballot</Link></nav>
      </div>
      <CountdownMasthead date="2026-11-03" initialDate={refresh.as_of_date} eyebrow="Election Day · November 3" caption="Civil calendar days to the November election. Louisiana House contests may require a December runoff. Check your state guide for voting windows, eligibility and local hours." className="min-h-[24rem] border-0" />
    </div></section>
    <section className="border-b bg-primary text-primary-foreground"><div className="mx-auto grid max-w-7xl grid-cols-2 px-5 md:grid-cols-4">{[['435', 'House districts'], ['35', 'Senate contests'], ['36', 'Governor races'], ['51', 'State/DC voting guides']].map(([number, label]) => <div className="border-l border-primary-foreground/20 px-4 py-6" key={label}><strong className="font-serif text-4xl text-highlight">{number}</strong><span className="mt-2 block text-sm">{label}</span></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><p className="rule-label">The national outlook</p><h2 className="mt-3 font-serif text-4xl font-bold">Democrats favored for the House.<br />A close Senate.</h2><EditionNote /><RefreshContent html={refreshHtml('home.html')} /><p className="mt-7 flex flex-wrap gap-5 font-bold"><Link className="editorial-link" href="/forecast/">Compare national model snapshots</Link><Link className="editorial-link" href="/polls/">Inspect the Senate polls</Link></p></section>
    <DeadlineBoard initialDate={refresh.as_of_date} />
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><p className="rule-label">The state desk</p><h2 className="mt-3 font-serif text-4xl font-bold">Power is also decided down the ballot.</h2><div className="mt-8 grid gap-5 md:grid-cols-2">{downBallotSections.map(item => <article key={item.slug} className="border-t-2 border-secondary py-6"><h3 className="font-serif text-2xl"><Link className="editorial-link" href={`/down-ballot/${item.slug}/`}>{item.title}</Link></h3><p className="mt-3 max-w-xl text-muted-foreground">{item.description}</p></article>)}</div><p className="mt-7 text-sm text-muted-foreground">This is a selected national watchlist. Candidate lists show featured identities; linked ballot resources contain the complete field. Forecasts never serve as election calls.</p></section>
  </>;
}
