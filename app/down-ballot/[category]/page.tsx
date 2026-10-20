import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditionNote } from '@/components/edition-note';
import { RefreshContent } from '@/components/refresh-content';
import { BreadcrumbData } from '@/components/structured-data';
import { downBallotSections, pageMetadata, refreshHtml } from '@/lib/refresh';
export const dynamicParams = false;
export function generateStaticParams() { return downBallotSections.map(item => ({ category: item.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> { const { category } = await params; const item = downBallotSections.find(row => row.slug === category); return item ? pageMetadata(item.title, item.description, `/down-ballot/${category}/`) : { title: 'Page not found' }; }
export default async function DownBallotCategory({ params }: { params: Promise<{ category: string }> }) { const { category } = await params; const item = downBallotSections.find(row => row.slug === category); if (!item) notFound(); return <article className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><BreadcrumbData name={item.title} path={`/down-ballot/${category}/`} parent={{ name: 'Down-ballot', path: '/down-ballot/' }} /><nav className="rule-label" aria-label="Breadcrumb"><Link href="/down-ballot/">Down-ballot</Link> / {item.title}</nav><h1 className="mt-4 font-serif text-5xl font-bold">{item.title}</h1><p className="mt-5 max-w-3xl text-lg text-muted-foreground">{item.description}</p><EditionNote /><RefreshContent html={refreshHtml(item.file)} /></article>; }
