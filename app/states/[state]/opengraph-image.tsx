import { notFound } from 'next/navigation';
import { states } from '@/lib/data';
import { guideFor } from '@/lib/refresh';
import { guideShareLine } from '@/lib/og-copy';
import { shareImage } from '@/lib/og-image';

// KEVYN-WRITE: state voting guide social card and alt text | facts: guideFor state name and registration fields; a deadline appears only when offered methods share a verified date
export const alt = 'State voting guide 2026 — registration and official voting sources · Midterm Watch';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';
export const dynamicParams = false;
export function generateStaticParams() { return states.map(([state]) => ({ state: state.toLowerCase() })); }

export default async function Image({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const guide = guideFor(state);
  if (!guide) notFound();
  return shareImage({ title: guide.name, subtitle: 'voting guide 2026', detail: guideShareLine(guide.registration) });
}
