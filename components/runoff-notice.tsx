import Link from 'next/link';

export function RunoffNotice() {
  return <section className="mx-auto max-w-7xl px-5 pb-14 lg:px-8" aria-labelledby="runoff-notice-heading">
    <h2 id="runoff-notice-heading" className="font-serif text-3xl font-bold">Separate registration dates for possible runoffs</h2>
    <p className="mt-3 max-w-4xl text-sm text-muted-foreground">Runoffs are conditional and office eligibility varies. Dates below are separate from registration for November 3; consult your election authority and state guide.</p>
    <ul className="mt-5 grid gap-4 text-sm md:grid-cols-3">
      <li className="border p-4"><Link className="editorial-link font-bold" href="/states/ga/">Georgia · December 1</Link><p className="mt-2">Registration cutoff: October 5 for state and local contests; November 2 for federal contests.</p></li>
      <li className="border p-4"><Link className="editorial-link font-bold" href="/states/ms/">Mississippi · December 1</Link><p className="mt-2">Registration cutoff: November 2 for eligible contests, if a runoff is needed.</p></li>
      <li className="border p-4"><Link className="editorial-link font-bold" href="/states/la/">Louisiana · December 12</Link><p className="mt-2">Registration: November 12 in person or by mail; November 21 online. A U.S. House runoff is held only if needed.</p></li>
    </ul>
  </section>;
}
