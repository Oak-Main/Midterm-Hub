import { notFound } from 'next/navigation';
import { states } from '@/lib/data';
import { pollClose } from '@/lib/election-night-data';
import { resultShareLine } from '@/lib/og-copy';
import { shareImage } from '@/lib/og-image';

// KEVYN-WRITE: state results social card and alt text | facts: state name and final ET poll close from pollClose; incomplete or conflicting times use the locality fallback; no counts or calls
export const alt = '2026 election results — poll closing schedule and official results sources · Midterm Watch';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';
export const dynamicParams = false;
export function generateStaticParams() { return states.map(([state]) => ({ state: state.toLowerCase() })); }

export default async function Image({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const row = pollClose.rows.find(item => item.state === state.toUpperCase());
  if (!row) notFound();
  return shareImage({ title: row.name, subtitle: '2026 election results', detail: resultShareLine(row) });
}
