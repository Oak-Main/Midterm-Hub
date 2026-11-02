import Link from 'next/link';
import { guideFor, refresh } from '@/lib/refresh';
import { runoffRegistrationText } from '@/lib/runoff-registration.mjs';

const displayDate = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

export function RunoffNotice() {
  return <section className="mx-auto max-w-7xl px-5 pb-14 lg:px-8" aria-labelledby="runoff-notice-heading">
    <h2 id="runoff-notice-heading" className="font-serif text-3xl font-bold">Separate registration dates for possible runoffs</h2>
    <p className="mt-3 max-w-4xl text-sm text-muted-foreground">Runoffs are conditional and office eligibility varies. Dates below are separate from registration for November 3; consult your election authority and state guide.</p>
    <ul className="mt-5 grid gap-4 text-sm md:grid-cols-3">
      {refresh.conditional_runoffs.map(runoff => <li className="border p-4" key={runoff.state}>
        <Link className="editorial-link font-bold" href={`/states/${runoff.state.toLowerCase()}/`}>{guideFor(runoff.state)?.name ?? runoff.state} · {displayDate(runoff.date)}</Link>
        <p className="mt-2">{runoffRegistrationText(runoff)}</p>
        <p className="mt-2 text-muted-foreground">{runoff.offices}</p>
      </li>)}
    </ul>
  </section>;
}
