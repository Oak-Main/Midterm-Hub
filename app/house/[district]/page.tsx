import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditionNote } from '@/components/edition-note';
import { RefreshContent } from '@/components/refresh-content';
import { BreadcrumbData } from '@/components/structured-data';
import { houseDistricts, pageMetadata, refresh, refreshHtml } from '@/lib/refresh';

export const dynamicParams = false;
export function generateStaticParams() { return houseDistricts.map(district => ({ district })); }
export async function generateMetadata({ params }: { params: Promise<{ district: string }> }): Promise<Metadata> {
  const { district } = await params;
  const race = refresh.house_races.find(row => row.district.toLowerCase() === district);
  return race ? pageMetadata(`${race.district} House election 2026`, `Candidates, dated DDHQ and Cook ratings, the editorial outlook and voting guide for ${race.district}.`, `/house/${district}/`) : { title: 'Race not found' };
}
export default async function HouseRace({ params }: { params: Promise<{ district: string }> }) {
  const { district } = await params;
  const race = refresh.house_races.find(row => row.district.toLowerCase() === district);
  if (!race) notFound();
  return <article className="mx-auto max-w-6xl px-5 py-14 lg:px-8"><BreadcrumbData name={race.district} path={`/house/${district}/`} parent={{ name: 'House races', path: '/house/' }} />
    <nav aria-label="Breadcrumb" className="rule-label"><Link href="/house/">House races</Link> / {race.district}</nav>
    <h1 className="mt-5 font-serif text-5xl font-bold">{race.district} · 2026 House election</h1><EditionNote />
    <RefreshContent html={refreshHtml(`races/house/${district}.html`)} />
    <p className="mt-8"><Link className="editorial-link" href={`/states/${race.state.toLowerCase()}/`}>Open the {race.state} voting guide</Link> · <Link className="editorial-link" href="/results/">Election result status</Link></p>
  </article>;
}
