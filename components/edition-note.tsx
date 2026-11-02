import Link from 'next/link';
import { refresh } from '@/lib/refresh';

export function EditionNote() {
  return <aside className="my-7 border-l-4 border-secondary bg-card p-5 text-sm">
    <p><strong>Research edition: October 20, 2026.</strong> Checked through {refresh.research_cutoff_display}.</p>
    <p className="mt-2 text-muted-foreground">Polls, race ratings, forecasts and voting guides are from this dated research edition unless an update is separately labeled. They may no longer reflect current conditions. Forecasts are estimates, never election results or calls. Check the relevant election authority for current voting instructions.</p>
    <p className="mt-2"><Link className="editorial-link" href="/methodology/">Methods and uncertainty</Link> · <Link className="editorial-link" href="/sources/">Source register</Link> · <Link className="editorial-link" href="/corrections/">Corrections</Link></p>
  </aside>;
}
