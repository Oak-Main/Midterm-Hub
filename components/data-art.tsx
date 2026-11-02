"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate, stateHref, stateNames } from "@/lib/data";
import { calendarDayStatus, localCalendarDate } from "@/lib/calendar";
import { DEADLINE_BANDS, NULL_DEADLINE_HATCH, tileFill } from "@/lib/deadline-cartogram.mjs";
import registrationIndex from "@/generated/registration-index.json";
import { registrationAction } from "@/lib/registration-action.mjs";
import { cn } from "@/lib/utils";

/* Data art, not photojournalism: this site deliberately carries no photographic
 * or synthetic imagery of voters, crowds, newsrooms, or dashboards. Its visual
 * voice is the wire-service results board — typography, ruled rows, tabular
 * numerals — with every figure traceable to generated/elections.json. */

// A static research date cannot safely stand in for the current calendar date.
// Render a neutral first paint, then use the visitor's device date.
function useToday() {
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

export function CountdownMasthead({ date, eyebrow, caption, className }: {
  date: string; eyebrow: string; caption: string; className?: string;
}) {
  const today = useToday();
  const status = calendarDayStatus(today, date);
  return (
    <figure className={cn("paper-grid flex h-full flex-col justify-center border bg-card", className)}>
      <div className="flex flex-col gap-6 px-6 py-10 md:px-10 md:py-12">
        <p className="rule-label text-secondary">{eyebrow}</p>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-y py-6">
          {status.phase === "unknown" ? (
            <>
              <strong className="font-serif text-5xl font-bold leading-none md:text-7xl">{formatDate(date, true)}</strong>
              <span className="font-mono text-sm text-muted-foreground">Election date · {formatDate(date)}</span>
            </>
          ) : status.phase === "before" ? (
            <>
              <strong className="font-serif text-7xl font-bold leading-none tabular-nums md:text-8xl">{status.days}</strong>
              <span className="rule-label">{status.days === 1 ? "day" : "days"} until<br />{formatDate(date, true)}</span>
              <span className="font-mono text-sm text-muted-foreground md:ml-auto">{formatDate(date)}</span>
            </>
          ) : (
            <>
              <strong className="font-serif text-5xl font-bold leading-none md:text-7xl">{status.phase === "today" ? "Election day" : "Election date passed"}</strong>
              <span className="font-mono text-sm text-muted-foreground">{formatDate(date)}</span>
            </>
          )}
        </div>
        <figcaption className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{caption}</figcaption>
        <p className="font-mono text-xs text-muted-foreground">Calendar status uses your device date, not local poll-closing times. Check current instructions with the election authority.</p>
      </div>
    </figure>
  );
}

/* 51 tiles in approximate geographic position, filled on a single neutral hue
 * by days until the state's general-election registration deadline. Never a
 * red/blue scale — color must never read as a party cue. Null deadline states
 * are hatched and labeled with the state's reason where known. */
const CARTO_GRID = ["WA MT ND MN WI MI VT NH ME", "OR ID SD IA IL IN OH PA NY MA", "CA NV WY NE MO KY WV VA MD NJ CT RI", "AZ UT CO KS AR TN NC SC DE DC", "NM TX OK LA MS AL GA FL", "AK HI"].map((row) => row.split(" "));

type Tile = { days: number | null; label: string; noRegistration?: boolean };

function registrationTiles(today: string): Map<string, Tile> {
  const tiles = new Map<string, Tile>();
  for (const state of registrationIndex) tiles.set(state.state, registrationAction(state, today));
  return tiles;
}

export function RegistrationCartogram({ initialDate }: { initialDate: string }) {
  const today = useToday();
  if (!today) return <p className="text-sm leading-relaxed">Open the <Link href="/states/" className="editorial-link">state voting guides</Link> for registration information from the {formatDate(initialDate)} research edition and official sources. The map uses your device date when available.</p>;
  const tiles = registrationTiles(today);
  return (
    <div>
      <div className="overflow-x-auto pb-3" role="group" aria-label="Next dated registration route by state">
        <div className="min-w-[680px]">
          {CARTO_GRID.map((row, i) => (
            <div key={i} className="mb-1 flex gap-1" style={{ paddingLeft: `${(i % 2) * 22}px` }}>
              {row.map((code) => {
                const tile = tiles.get(code);
                const fill = tileFill(tile?.days ?? null);
                return (
                  <Link
                    key={code}
                    href={stateHref(code)}
                    title={`${code}: ${tile?.label ?? "No general-election record in this edition"}`}
                    aria-label={`${stateNames[code] ?? code}: ${tile?.label ?? "no record in this edition"}`}
                    className={cn(
                      "flex size-11 items-center justify-center border font-mono text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-ring",
                      tile?.noRegistration ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground",
                    )}
                    style={tile?.noRegistration ? undefined : fill.style}
                  >
                    {code}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="rule-label" style={{ color: "inherit" }}>Days to next dated route:</span>
        {DEADLINE_BANDS.map((band) => (
          <span key={band.id}>
            <i className="mr-2 inline-block size-3 border" style={{ backgroundColor: `var(${band.fillToken})` }} />
            {band.label}
          </span>
        ))}
        <span><i className="mr-2 inline-block size-3 border" style={{ backgroundImage: NULL_DEADLINE_HATCH }} />No later dated route or locally variable timing; check the state guide. NH pre-election registration timing varies by municipality.</span>
        <span><i className="mr-2 inline-block size-3 border bg-primary" />No registration required (ND)</span>
      </div>
      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        Each tile tracks the next dated registration route for November 3 in this edition. The accessible label lists methods and dates; open the state guide for eligibility, receipt or postmark rules, required ID and local locations. A passed mail date does not close a later valid route. Later elections and conditional runoffs may have separate registration deadlines; open the state guide.
      </p>
    </div>
  );
}

/* The deadline board section — replaces the former photo essay. Same dark
 * results-board band, but every panel is derived from the data. */
export function DeadlineBoard({ initialDate }: { initialDate: string }) {
  return (
    <section className="border-y bg-primary text-primary-foreground" aria-labelledby="deadline-board-heading">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[.72fr_1.28fr] md:items-end">
          <div>
            <p className="rule-label text-secondary">Registration, state by state</p>
            <h2 id="deadline-board-heading" className="mt-3 text-balance font-serif text-4xl font-bold md:text-5xl">Find the registration route that applies to you.</h2>
          </div>
          <p className="max-w-2xl text-pretty text-primary-foreground/75 md:justify-self-end">
            All 50 states and DC have method-specific guides for November 3. Online, mail and in-person registration can have different deadlines. North Dakota does not require voter registration. Runoffs, if needed, have separate rules.
          </p>
        </div>
        <div className="mt-10 border bg-card p-6 text-foreground md:p-8">
          <RegistrationCartogram initialDate={initialDate} />
        </div>
      </div>
    </section>
  );
}
