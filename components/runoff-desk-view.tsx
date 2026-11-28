"use client";

import Link from "next/link";
import { ElectionMasthead } from "@/components/election-masthead";
import { calendarDayStatus } from "@/lib/calendar";
import { mastheadPhase, type EditionState } from "@/lib/election-night";
import { activeRunoffs, runoffPhase, runoffStatusLine, type RunoffRecord } from "@/lib/runoff-registration.mjs";
import { useLocalDate } from "@/lib/use-local-date";

export type DeskSource = { id: string; url: string; label: string; checked: string };
export type DeskCard = RunoffRecord & {
  name: string; guideHref: string; electionName: string; conditional: boolean;
  windowLabel: string; windowText: string; absenteeText: string;
  authority: { href: string; label: string }; icsHref: string | null; sources: DeskSource[]; checked: string;
};

const civil = (options: Intl.DateTimeFormatOptions) => (date: string) => new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
const shortDate = civil({ month: "short", day: "numeric" });
const dayDate = civil({ weekday: "long", month: "long", day: "numeric" });

function countdown(today: string | null, date: string): string | null {
  const { phase, days } = calendarDayStatus(today, date);
  if (phase === "today") return "Today";
  if (phase !== "before" || days === null) return null;
  return `${days} ${days === 1 ? "day" : "days"} until ${shortDate(date)}`;
}

function SourceChips({ sources }: { sources: DeskSource[] }) {
  return <span className="sources">{sources.map((item, index) => <span key={item.id}>{index > 0 && " · "}<a className="underline" href={item.url} target="_blank" rel="noopener" title={`${item.label} · checked ${item.checked}`}>{item.id}</a></span>)}</span>;
}

function RunoffCard({ card, today }: { card: DeskCard; today: string | null }) {
  const status = runoffStatusLine(card, today);
  const left = countdown(today, card.date);
  const louisiana = card.state === "LA";
  const georgia = card.state === "GA";
  const guideHref = card.guideHref + (louisiana ? "#louisiana-runoff" : georgia ? "#doraville-runoff" : "");
  return (
    <article className="border-t-2 border-secondary pt-4" data-state={card.state} data-runoff-phase={today ? runoffPhase(card, today) : "unknown"}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-serif text-xl font-bold sm:text-2xl"><Link className="editorial-link" href={guideHref}>{card.name}</Link> · {dayDate(card.date)}</h3>
        {left && <span className="font-mono text-sm font-bold tabular-nums">{left}</span>}
      </div>
      {louisiana && <p className="mt-3 text-sm">For December 12, first <a className="editorial-link" href="https://voterportal.sos.la.gov/sampleballot">check your sample ballot</a> for your parish, ward and precinct. If your ballot lists a contest, <a className="editorial-link" href="https://voterportal.sos.la.gov/earlyvoting">find early voting locations in your parish</a>.</p>}
      {georgia && <p className="mt-3 text-sm"><strong>DeKalb County · City of Doraville Special Election Runoff, District 2, Post 2 At Large</strong><br />Advance voting ended November 25. For the December 1 election, <a className="editorial-link" href="https://mvp.sos.ga.gov/s/">check your assigned polling place in Georgia’s My Voter Page</a>. <a className="editorial-link" href="https://dekalbcountyga.gov/departments/voter-registration-and-elections">DeKalb County election information</a>.</p>}
      <p className={georgia ? "mt-3 rule-label" : "mt-1 rule-label"}>{georgia ? "Georgia general runoff calendar" : card.electionName}{card.conditional ? " · if required" : ""}</p>
      {status && <p className="mt-3 font-bold leading-snug">{status}</p>}
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[9.5rem_1fr]">
        <dt className="font-bold">{card.windowLabel}</dt><dd>{card.windowText}{louisiana && " (Central time)"}</dd>
        {card.absenteeText && <><dt className="font-bold">Absentee ballots</dt><dd>{card.absenteeText}</dd></>}
        <dt className="font-bold">{louisiana ? "Election Day polls" : "Polls"}</dt><dd>{card.election_day_hours}{louisiana && " (Central time)"}</dd>
        <dt className="font-bold">On the ballot</dt>
        <dd>{card.contests?.length
          ? <><ul className="list-disc pl-5">{card.contests.map(contest => <li key={contest.label}>{contest.label}</li>)}</ul>{card.contests_note && <p className="mt-1 text-muted-foreground">{card.contests_note}</p>}</>
          : card.offices}</dd>
      </dl>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
        <Link className="editorial-link" href={guideHref}>{`${card.name} voting guide`}</Link>
        <a className="editorial-link" href={card.authority.href} title={card.authority.label} target="_blank" rel="noopener noreferrer">Official instructions</a>
        {card.icsHref && <a className="editorial-link" href={card.icsHref} download>Calendar (.ics)</a>}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Checked {shortDate(card.checked)} · <SourceChips sources={card.sources} /></p>
    </article>
  );
}

/**
 * Hero aside after Election Day. While any runoff is ahead it shows the runoff
 * desk; after the last one (or before Election Day) it is the masthead. The
 * static first paint has no date, so it lists every runoff with its
 * registration text and no countdown, like ElectionMasthead.
 */
export function RunoffDeskView({ cards, editionState, mastheadCaption }: { cards: DeskCard[]; editionState: EditionState; mastheadCaption: string }) {
  const today = useLocalDate();
  const { phase } = mastheadPhase(editionState, today);
  const active = activeRunoffs(cards, today);
  if (phase !== "after" || active.length === 0) {
    return <ElectionMasthead state={editionState} runoffs={[]} countdownCaption={mastheadCaption} className="min-h-[24rem] border-0" />;
  }
  return (
    <section className="flex h-full flex-col gap-6 border-0 bg-card px-5 py-10 md:px-10 md:py-12" aria-labelledby="runoff-desk-heading" data-phase={phase} data-runoff-desk="">
      <div>
        <p className="rule-label text-secondary">Runoff desk</p>
        <h2 id="runoff-desk-heading" className="mt-2 font-serif text-3xl font-bold md:text-4xl">Runoff dates and deadlines</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Runoffs are held only where a contest requires one, and office eligibility varies. Each card links the official instructions; confirm local hours with your election office.</p>
      </div>
      {active.map(card => <RunoffCard key={card.state} card={card} today={today} />)}
    </section>
  );
}

/** Hero text that belongs to the runoff edition: `during` until the visitor's
 * date passes the last runoff, then the post-election `after`. The static
 * first paint shows `during`, like the desk itself. */
export function UntilRunoffsEnd({ lastDate, during, after }: { lastDate: string; during: React.ReactNode; after: React.ReactNode }) {
  const today = useLocalDate();
  return <>{today !== null && today > lastDate ? after : during}</>;
}
