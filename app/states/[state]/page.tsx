import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ElectionCard } from '@/components/election-card';
import { EditionNote } from '@/components/edition-note';
import { RefreshContent } from '@/components/refresh-content';
import { BreadcrumbData } from '@/components/structured-data';
import { forState, states } from '@/lib/data';
import { guideFor, pageMetadata, refreshHtml } from '@/lib/refresh';
export const dynamicParams = false;
export function generateStaticParams() { return states.map(([state]) => ({ state: state.toLowerCase() })); }
export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> { const { state } = await params; const guide = guideFor(state); return guide ? pageMetadata(`${guide.name} election dates and voting guide 2026`, `${guide.name}'s November 3 election: registration by method, ballot applications and returns, early voting and poll hours.`, `/states/${state.toLowerCase()}/`) : { title: 'State not found' }; }
export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params; const guide = guideFor(state); if (!guide) notFound();
  const archive = forState(guide.state).filter(row => row.election_date < '2026-11-03');
  return <article className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><BreadcrumbData name={guide.name} path={`/states/${state}/`} parent={{ name: 'States', path: '/states/' }} /><nav className="rule-label" aria-label="Breadcrumb"><Link href="/states/">States</Link> / {guide.state}</nav><h1 className="mt-5 font-serif text-5xl font-bold">{guide.name} voting guide</h1><EditionNote /><p className="my-5"><a className="editorial-link" href={guide.official_url} target="_blank" rel="noopener noreferrer">Open the election authority’s current instructions</a></p><RefreshContent html={refreshHtml(`states/${state}.html`)} />{['GA', 'MS', 'LA'].includes(guide.state) && <section className="mt-10"><h2 className="font-serif text-3xl font-bold">Conditional runoff</h2><RefreshContent html={refreshHtml(`runoffs/${state}.html`)} /></section>}{archive.length > 0 && <details className="mt-12 border-t pt-6"><summary className="cursor-pointer font-bold">Historical calendar records · original source-check dates retained</summary><p className="my-5 text-sm text-muted-foreground">These archived records concern earlier elections and are not current registration instructions.</p><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{archive.map(row => <ElectionCard key={row.id} election={row} />)}</div></details>}</article>;
}
