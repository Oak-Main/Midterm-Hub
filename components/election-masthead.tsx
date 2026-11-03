"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/data";
import { localCalendarDate } from "@/lib/calendar";
import { ELECTION_DATE, mastheadPhase, type EditionState } from "@/lib/election-night";
import { cn } from "@/lib/utils";

export type RunoffLink = { state: string; name: string; date: string; href: string };
// The home page's RunoffNotice section lists each runoff's registration routes.
const runoffRegistrationHref = "#runoff-notice-heading";

// No date on the static first paint: the build date cannot stand in for the
// visitor's. After hydration the device date ends the countdown on November 4
// even if status.json was not flipped.
function useLocalDate() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setToday(localCalendarDate());
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return today;
}

export function ElectionMasthead({ state, runoffs, countdownCaption, className }: {
  state: EditionState; runoffs: RunoffLink[]; countdownCaption: string; className?: string;
}) {
  const { phase, days } = mastheadPhase(state, useLocalDate());
  return (
    <figure className={cn("paper-grid flex h-full flex-col justify-center border bg-card", className)} data-phase={phase}>
      <div className="flex flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
        <p className="rule-label text-secondary">{phase === "after" ? "After Election Day · November 3" : "Election Day · November 3"}</p>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-y py-6">
          {phase === "countdown" ? (
            <>
              <strong className="font-serif text-7xl font-bold leading-none tabular-nums md:text-8xl">{days}</strong>
              <span className="rule-label">{days === 1 ? "day" : "days"} until<br />{formatDate(ELECTION_DATE, true)}</span>
              <span className="font-mono text-sm text-muted-foreground md:ml-auto">{formatDate(ELECTION_DATE)}</span>
            </>
          ) : phase === "election_day" ? (
            <>
              <strong className="font-serif text-5xl font-bold leading-none md:text-7xl">Polls close today</strong>
              <span className="font-mono text-sm text-muted-foreground">{formatDate(ELECTION_DATE)}</span>
            </>
          ) : phase === "after" ? (
            <>
              <strong className="font-serif text-5xl font-bold leading-none md:text-6xl">Official results by state</strong>
              <span className="font-mono text-sm text-muted-foreground">{formatDate(ELECTION_DATE)}</span>
            </>
          ) : (
            <>
              <strong className="font-serif text-5xl font-bold leading-none md:text-7xl">{formatDate(ELECTION_DATE, true)}</strong>
              <span className="font-mono text-sm text-muted-foreground">{formatDate(ELECTION_DATE)}</span>
            </>
          )}
        </div>
        {(phase === "countdown" || phase === "date") && <figcaption className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{countdownCaption}</figcaption>}
        {phase === "election_day" && (
          <figcaption className="max-w-2xl text-sm leading-relaxed">
            {/* KEVYN-WRITE: one sentence for Election Day saying polls close at different times by state and the linked page lists each state's official closing time and results page | facts: first and last closes in content/election-night/poll-close-2026.json (each row cites its state election office); this site has no vote-count or call feed (app/results/page.tsx banner) */}
            <Link className="editorial-link font-bold" href="/results/">Poll-closing times and official results links</Link>
          </figcaption>
        )}
        {phase === "after" && (
          <figcaption className="flex max-w-2xl flex-col gap-4 text-sm leading-relaxed">
            {/* KEVYN-WRITE: one sentence after Election Day saying this site does not report vote counts or calls races and pointing readers to each state's official results page | facts: /results/ official-results table (content/election-night/official-results.json, election authority URLs checked 2026-11-02) */}
            <Link className="editorial-link font-bold" href="/results/">Official results links for every state</Link>
            {runoffs.length > 0 && (
              <div>
                <p className="rule-label">Possible runoffs · registration</p>
                {/* The registration routes themselves are in the page's RunoffNotice section. */}
                <ul className="mt-2 flex flex-col gap-2">
                  {runoffs.map((runoff) => (
                    <li key={runoff.state}><Link className="editorial-link font-bold" href={runoff.href}>{`${runoff.name} · ${formatDate(runoff.date)}`}</Link></li>
                  ))}
                  <li><a className="editorial-link" href={runoffRegistrationHref}>Runoff registration dates</a></li>
                </ul>
              </div>
            )}
          </figcaption>
        )}
      </div>
    </figure>
  );
}
