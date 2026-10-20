import Link from 'next/link';
import { refresh } from '@/lib/refresh';

export function EditionNote() {
  return <aside className="my-7 border-l-4 border-secondary bg-card p-5 text-sm">
    <p><strong>Research edition: October 20, 2026.</strong> Checked through {refresh.research_cutoff_display}.</p>
    <p className="mt-2 text-muted-foreground">Producer rating dates and poll fieldwork are shown separately. Forecasts are estimates; voting requirements depend on the applicable method and jurisdiction.</p>
    <p className="mt-2"><Link className="editorial-link" href="/methodology/">Methods and uncertainty</Link> · <Link className="editorial-link" href="/sources/">Source register</Link> · <Link className="editorial-link" href="/corrections/">Corrections</Link></p>
  </aside>;
}
