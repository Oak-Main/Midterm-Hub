import { shareImage } from '@/lib/og-image';

// KEVYN-WRITE: site social card and alt text | facts: 2026 midterm coverage, race and deadline directories, official source links on this site; no live counts or calls
export const alt = 'Midterm Watch — 2026 midterms. Every race. Every deadline. Follow the sources.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function Image() {
  return shareImage({ title: 'Midterm Watch', subtitle: '2026 midterms.', detail: 'Every race. Every deadline. Follow the sources.' });
}
