import { shareImage } from '@/lib/og-image';

// KEVYN-WRITE: results hub social card and alt text | facts: /results/ lists poll closing times and official results links; no live counts or calls
export const alt = '2026 election results status — Poll closing times · Official results links · Midterm Watch';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function Image() {
  return shareImage({ title: '2026 election results status', subtitle: 'Poll closing times · Official results links' });
}
