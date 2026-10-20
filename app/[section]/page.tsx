import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditionNote } from '@/components/edition-note';
import { RefreshContent } from '@/components/refresh-content';
import { BreadcrumbData } from '@/components/structured-data';
import { pageMetadata, refresh, refreshHtml, refreshSections, refreshSources } from '@/lib/refresh';

export const dynamicParams = false;
export function generateStaticParams() { return refreshSections.map(row => ({ section: row.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const item = refreshSections.find(row => row.slug === section);
  return item ? pageMetadata(item.title, item.description, `/${section}/`) : { title: 'Page not found' };
}
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = refreshSections.find(row => row.slug === section);
  if (!item) notFound();
  return <article className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
    <BreadcrumbData name={item.title} path={`/${section}/`} />
    <p className="rule-label">The 2026 election desk</p><h1 className="mt-3 font-serif text-4xl font-bold md:text-6xl">{item.title}</h1>
    <p className="mt-5 max-w-3xl text-lg text-muted-foreground">{item.description}</p><EditionNote />
    {section === 'voting' && <p className="my-6"><Link className="editorial-link" href="/states/">Open your complete state voting guide</Link>. Tables cover ordinary domestic voters; military, overseas, emergency and local exceptions require the linked election authority.</p>}
    <RefreshContent html={refreshHtml(item.file)} />
    {section === 'voting' && <><h2 className="mt-10 font-serif text-3xl font-bold">Conditional runoff calendar</h2><RefreshContent html={refreshHtml('runoffs.html')} /><h2 className="mt-10 font-serif text-3xl font-bold">Common voting questions</h2><RefreshContent html={refreshHtml('faq.html')} /></>}
    {section === 'forecast' && <><h2 className="mt-12 font-serif text-3xl font-bold">Independent model snapshots</h2><div className="my-6 grid gap-5 md:grid-cols-2">{refresh.forecasts.map(row => <section key={row.publisher + row.office} className="border bg-card p-6"><h3 className="font-serif text-2xl">{row.office} · {row.publisher}</h3><p className="mt-3">Democratic control: <strong>{row.democratic_control_probability_pct}%</strong> · Republican control: <strong>{row.republican_control_probability_pct}%</strong>{'independent_decided_control_probability_pct' in row ? ` · Independent-decided control: ${row.independent_decided_control_probability_pct}%` : ''}</p><p className="mt-2">Seat center: {row.democratic_seat_center} D / {row.republican_seat_center} R</p><p className="mt-2 text-sm text-muted-foreground">Published {row.published_on}; checked {row.last_checked_utc}. Model definitions differ; these probabilities are not averaged.</p><p className="mt-2 text-sm">{row.source_ids.map(id => { const source = refreshSources.find(s => s.id === id); return source ? <a className="editorial-link mr-3" key={id} href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher}</a> : null; })}</p></section>)}</div><RefreshContent html={refreshHtml('context.html')} /></>}
  </article>;
}
