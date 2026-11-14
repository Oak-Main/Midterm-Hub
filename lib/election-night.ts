// Election-night state for the home masthead and /results/.
// content/election-night/status.json is the only switch for the edition state;
// nothing here advances it. The visitor's local date only ends the countdown.

export type EditionState = 'awaiting_polls' | 'election_day' | 'counting' | 'post_election';
export const EDITION_STATES: readonly EditionState[] = ['awaiting_polls', 'election_day', 'counting', 'post_election'];
export const ELECTION_DATE = '2026-11-03';
export const DAY_AFTER = '2026-11-04';

export type Status = { edition_state: EditionState; updated_at: string };

export function readStatus(value: { edition_state: string; updated_at: string }): Status {
  if (!EDITION_STATES.includes(value.edition_state as EditionState)) throw new Error(`Unknown edition_state ${value.edition_state}`);
  if (Number.isNaN(Date.parse(value.updated_at))) throw new Error(`Invalid updated_at ${value.updated_at}`);
  return value as Status;
}

export const editionLabels: Record<EditionState, string> = {
  awaiting_polls: 'Awaiting polls',
  election_day: 'Election Day: polls open',
  counting: 'Counting',
  post_election: 'After the election',
};

/** date: no visitor date yet (static first paint); countdown: days > 0 only. */
export type MastheadPhase = 'date' | 'countdown' | 'election_day' | 'after';

const DAY_MS = 86_400_000;
export const civilDaysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS);

export function mastheadPhase(state: EditionState, today: string | null): { phase: MastheadPhase; days: number | null } {
  if (state === 'counting' || state === 'post_election') return { phase: 'after', days: null };
  // A stale awaiting_polls or election_day status never counts down past the day.
  if (today && today >= DAY_AFTER) return { phase: 'after', days: null };
  if (state === 'election_day' || today === ELECTION_DATE) return { phase: 'election_day', days: null };
  if (!today) return { phase: 'date', days: null };
  const days = civilDaysBetween(today, ELECTION_DATE);
  return days > 0 ? { phase: 'countdown', days } : { phase: 'date', days: null };
}

/* Poll-closing times. The JSON stores the local clock time and IANA zone from
 * the official source; the UTC and ET instants are derived and checked here. */

export type PollClose = { zone: string; local_time: string; area: string; utc: string; et: string };
export type PollSource = { url: string; publisher: string; kind: string; retrieved_at: string; quote: string };
export type PollCloseRow = {
  state: string; name: string; closes: PollClose[]; all_polls_closed_utc: string | null; split_zone_note: string;
  notes: string; source_url: string | null; retrieved_at: string | null; sources: PollSource[];
  tag: 'VERIFIED-2+' | 'SINGLE-SOURCE' | 'CONFLICT' | 'UNVERIFIED'; election_office_url: string;
  /** Parts of a state whose close could not be verified; they render the election-office fallback. */
  unverified_areas?: string[];
};

/** Search copy follows the table's uncertainty rules, including partial coverage. */
export function pollCloseSentence(row: PollCloseRow): string {
  if (row.tag === 'UNVERIFIED' || row.tag === 'CONFLICT' || !row.closes.length || row.unverified_areas?.length) {
    return `A statewide poll-closing time is not confirmed here; check the ${row.name} election office.`;
  }
  const times = row.closes.map(close => row.closes.length === 1 ? close.et : `${close.et} (${close.area.toLowerCase()})`).join('; ');
  return `${row.name} polls close ${times}.`;
}

export function resultsDescription(row: PollCloseRow, authority: string): string {
  return `For the November 3, 2026 election: ${pollCloseSentence(row)} Official results: ${authority.split('(')[0].trim()}. No live counts or calls here.`;
}

/** Citations can share a URL and kind while quoting different statutory clauses. */
export const pollSourceKey = (source: PollSource) => JSON.stringify([source.url, source.kind, source.quote]);

export function zoneOffsetMinutes(zone: string, date = ELECTION_DATE): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${date}T12:00:00Z`)).find(part => part.type === 'timeZoneName')?.value ?? '';
  const match = /GMT(?:([+-])(\d{2}):(\d{2}))?/.exec(name);
  if (!match) throw new Error(`No offset for ${zone}`);
  return match[1] ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
}

export function closeInstant(localTime: string, zone: string, date = ELECTION_DATE): Date {
  if (!/^\d{2}:\d{2}$/.test(localTime)) throw new Error(`Invalid local time ${localTime}`);
  return new Date(Date.parse(`${date}T${localTime}:00Z`) - zoneOffsetMinutes(zone, date) * 60_000);
}

const ZONE_NAMES: Record<number, string> = { [-300]: 'Eastern', [-360]: 'Central', [-420]: 'Mountain', [-480]: 'Pacific', [-540]: 'Alaska', [-600]: 'Hawaii-Aleutian' };
export const zoneLabel = (zone: string) => ZONE_NAMES[zoneOffsetMinutes(zone)] ?? zone;

const meridiem = (hour: number) => (hour < 12 ? 'a.m.' : 'p.m.');
export function clockLabel(localTime: string): string {
  const [hour, minute] = localTime.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${meridiem(hour)}`;
}

/** "8:00 p.m." on November 3 in ET, or with the ET date when it falls on November 4. */
export function etLabel(instant: Date): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(instant).map(part => [part.type, part.value]));
  const time = clockLabel(`${parts.hour}:${parts.minute}`);
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  return day === ELECTION_DATE ? `${time} ET` : `${time} ET, ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`))}`;
}

/** "Nov 2, 2026, 6:32 p.m. ET" for a status or check timestamp. */
export function timestampLabel(iso: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(iso)).map(part => [part.type, part.value]));
  return `${parts.month} ${parts.day}, ${parts.year}, ${clockLabel(`${parts.hour}:${parts.minute}`)} ET`;
}

/** "Nov 2, 2026" for a YYYY-MM-DD retrieval date. */
export const dayLabel = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`));

export const tagLabels: Record<PollCloseRow['tag'], string> = {
  'VERIFIED-2+': 'Two official sources agree',
  'SINGLE-SOURCE': 'One official source',
  CONFLICT: 'Official sources conflict',
  UNVERIFIED: 'Not verified',
};

/** Earliest close first; rows without a verified time follow, by state name. */
export function sortByClose<T extends Pick<PollCloseRow, 'all_polls_closed_utc' | 'name'>>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => (a.all_polls_closed_utc && b.all_polls_closed_utc ? a.all_polls_closed_utc.localeCompare(b.all_polls_closed_utc) : a.all_polls_closed_utc ? -1 : b.all_polls_closed_utc ? 1 : 0) || a.name.localeCompare(b.name));
}

const isHttps = (url: string | null | undefined) => typeof url === 'string' && /^https:\/\/[^\s]+$/.test(url);

/** Returns every problem with the poll-close table; an empty list means it is publishable. */
export function pollCloseProblems(rows: readonly PollCloseRow[]): string[] {
  const problems: string[] = [];
  if (rows.length !== 51) problems.push(`expected 51 rows, found ${rows.length}`);
  if (new Set(rows.map(row => row.state)).size !== rows.length) problems.push('duplicate state rows');
  for (const row of rows) {
    const at = (message: string) => problems.push(`${row.state}: ${message}`);
    if (!isHttps(row.election_office_url)) at('election_office_url must be https');
    if (row.tag === 'UNVERIFIED') {
      if (row.closes.length || row.all_polls_closed_utc) at('an unverified row must not carry a closing time');
      continue;
    }
    if (!row.closes.length) at('a sourced row needs at least one closing time');
    if (!isHttps(row.source_url) || !row.retrieved_at) at('a sourced row needs an https source_url and retrieved_at');
    if (!row.sources.length || row.sources.some(source => !isHttps(source.url) || !source.retrieved_at)) at('every source needs an https url and retrieved_at');
    if (row.tag === 'VERIFIED-2+' && new Set(row.sources.map(source => source.publisher)).size < 2) at('VERIFIED-2+ needs two publishers');
    let latest = '';
    for (const close of row.closes) {
      const instant = closeInstant(close.local_time, close.zone).toISOString().replace('.000Z', 'Z');
      if (close.utc !== instant) at(`${close.zone} ${close.local_time} is ${instant}, not ${close.utc}`);
      if (close.et !== etLabel(new Date(instant))) at(`${close.zone} ET label should be ${etLabel(new Date(instant))}`);
      if (instant > latest) latest = instant;
    }
    if (row.closes.length > 1 && !row.split_zone_note) at('a split-zone row needs split_zone_note');
    if (row.unverified_areas?.some(area => !area.trim())) at('unverified_areas entries must name the area');
    if (latest && row.all_polls_closed_utc !== latest) at(`all_polls_closed_utc should be the latest close, ${latest}`);
  }
  return problems;
}

export type OfficialResultsRow = {
  state: string; name: string; authority: string; url: string; requested_url: string; http_status: number;
  checked_at: string; page_kind: '2026_general' | 'landing'; pending: boolean; notes: string;
  /** The authority's own status wording seen at checked_at, verbatim (e.g. "Unofficial Results"); never a certification claim of ours. */
  label_seen?: string;
  /** One sentence telling a visitor how to reach the 2026 results at url, e.g. which election to select. */
  visitor_note?: string;
};

export function officialResultsProblems(rows: readonly OfficialResultsRow[]): string[] {
  const problems: string[] = [];
  if (rows.length !== 51) problems.push(`expected 51 rows, found ${rows.length}`);
  for (const row of rows) {
    if (!isHttps(row.url)) problems.push(`${row.state}: url must be https`);
    if (Number.isNaN(Date.parse(row.checked_at))) problems.push(`${row.state}: checked_at must be a timestamp`);
    if (row.page_kind === 'landing' && !row.pending) problems.push(`${row.state}: a landing page stands in for a pending 2026 page`);
    if (row.label_seen !== undefined && (row.pending || !row.label_seen.trim())) problems.push(`${row.state}: label_seen describes posted 2026 results only`);
    if (row.visitor_note !== undefined && (row.pending || !/\.$/.test(row.visitor_note.trim()))) problems.push(`${row.state}: visitor_note is one sentence for posted 2026 results`);
  }
  return problems;
}

/* Official post-election updates. Each event is one authority document version
 * (a corrected return, a completed recount determination or a certification),
 * never a vote-count feed. Scope stays explicit: a town or county return is not
 * a district or statewide total, and nothing here certifies a contest unless
 * the competent authority's certification of the full contest is cited. */

export type OfficialUpdateKind = 'official_canvass' | 'corrected_tally' | 'completed_recount' | 'local_certification' | 'certification' | 'amended_certification' | 'withdrawn_certification';
export const OFFICIAL_UPDATE_KINDS: readonly OfficialUpdateKind[] = ['official_canvass', 'corrected_tally', 'completed_recount', 'local_certification', 'certification', 'amended_certification', 'withdrawn_certification'];
export const officialUpdateLabels: Record<OfficialUpdateKind, string> = {
  official_canvass: 'Official canvass',
  corrected_tally: 'Corrected tally',
  completed_recount: 'Completed recount',
  local_certification: 'Local certification (partial scope)',
  certification: 'Certification',
  amended_certification: 'Amended certification',
  withdrawn_certification: 'Certification withdrawn',
};
/** Kinds that carry a certification act and its date. */
const CERTIFYING: readonly OfficialUpdateKind[] = ['local_certification', 'certification', 'amended_certification', 'withdrawn_certification'];
/** Kinds that speak for the whole contest; every contest must be full_contest scope. */
const FULL_CONTEST_ONLY: readonly OfficialUpdateKind[] = ['certification', 'amended_certification', 'withdrawn_certification'];
/** Label for the certification date row, so a withdrawal never reads as "Certified". */
export const certificationDateLabel = (kind: OfficialUpdateKind) => kind === 'withdrawn_certification' ? 'Certification withdrawn' : 'Certified';

export type OfficialUpdateContest = {
  /** "U.S. House, Connecticut District 1" */
  contest: string;
  /** Where Midterm Watch covers the contest, e.g. "U.S. House race page" or "Georgia House, chamber level". */
  coverage: string;
  /** House race route (/house/st-n/) when one exists; chamber-level coverage has none. */
  race_path: string | null;
  /** Published coverage page for this contest, including chamber-level coverage. */
  coverage_path?: string;
  candidates: string;
  /** full_contest: the figures describe the whole contest; local_unit: a town, county, ward or other part. */
  scope_kind: 'full_contest' | 'local_unit';
  /** Reporting unit the figures describe, stated in words; a local unit says it is "not a/the … total". */
  scope: string;
  before: string | null;
  after: string | null;
  change: string | null;
};
export type OfficialUpdateSource = { url: string; title: string; publisher: string; version: string | null; sha256: string | null; checked_at: string };
export type OfficialUpdateDates = {
  /** Authority publication date as stated by the authority (YYYY-MM-DD or UTC timestamp); null when the source states none. */
  published: string | null;
  /** Date the act took effect (for a recount, its completion); null when not stated. */
  effective: string | null;
  /** Date of the certification act (or its withdrawal) by the competent authority. */
  certified: string | null;
  /** Verbatim print/report timestamp from the document; time zone only if stated. */
  printed: string | null;
  /** First time Midterm Watch's research record observed the document; null when not retained. */
  first_observed: string | null;
  /** Latest successful recheck of every cited source for later versions (UTC timestamp). */
  last_checked: string;
};
export type OfficialUpdateEvent = {
  /** ST-YYYY-MM-DD-slug; the date is the documented act date, or explicitly labeled first observation when no authority date is given. */
  id: string; state: string; kind: OfficialUpdateKind;
  /** Short status line without a final period, e.g. "Unofficial corrected town return; not certified". */
  status: string;
  authority: string;
  summary: string;
  contests: OfficialUpdateContest[];
  sources: OfficialUpdateSource[];
  dates: OfficialUpdateDates;
  caveats: string[];
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z$/;
/** Only a calendar day or a full UTC timestamp; anything looser could render a date the source never gave. */
const isDayOrInstant = (value: string | null): value is string => value !== null && (DAY.test(value) || INSTANT.test(value)) && !Number.isNaN(Date.parse(value))
  // A real calendar day: "2026-02-31" would otherwise roll over to March 3.
  && new Date(Date.parse(`${value.slice(0, 10)}T00:00:00Z`)).toISOString().slice(0, 10) === value.slice(0, 10);
/** Words that describe part of a contest; a full-contest scope must not use them. */
const LOCAL_SCOPE_WORDS = /\b(?:town|township|city|county|counties'?|parish|borough|ward|precinct|municipal|portion|part|only)\b/i;
const LOCAL_SCOPE_DISCLAIMER = /\bnot (?:a|the) (?:statewide|district|full[- ]contest|contest)\b[^;.]*\btotal\b/i;
const dupes = (values: string[]) => values.filter((value, index) => values.indexOf(value) !== index);

/**
 * Returns every problem with the official-updates record; an empty list means it is publishable.
 * `housePaths` lists the House race routes that exist, so a race_path can never link to a missing or wrong-state page.
 */
export function officialUpdateProblems(events: readonly OfficialUpdateEvent[], stateCodes: readonly string[], housePaths?: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const event of events) {
    const at = (message: string) => problems.push(`${event.id}: ${message}`);
    if (!/^[A-Z]{2}-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(event.id) || !isDayOrInstant(event.id.slice(3, 13))) at('id must look like ST-YYYY-MM-DD-slug with a real date');
    if (ids.has(event.id)) at('duplicate id');
    ids.add(event.id);
    if (!stateCodes.includes(event.state) || !event.id.startsWith(`${event.state}-`)) at('state must be a covered jurisdiction matching the id');
    if (!OFFICIAL_UPDATE_KINDS.includes(event.kind)) at(`unknown kind ${event.kind}`);
    if (!event.status.trim() || !event.authority.trim() || !event.summary.trim()) at('status, authority and summary are required');
    if (/[.;,]\s*$/.test(event.status)) at('status must not end with punctuation; the page adds it');

    const certifying = CERTIFYING.includes(event.kind);
    if (certifying && !isDayOrInstant(event.dates.certified)) at('a certification event needs the date of the certification act');
    if (!certifying && event.dates.certified !== null) at('only a certification event carries a certification date; record a later certification as its own event');
    if (certifying && event.kind !== 'withdrawn_certification' && /unofficial/i.test(event.status)) at('a certification status must not call the result unofficial');
    if (event.kind === 'completed_recount' && !isDayOrInstant(event.dates.effective) && !isDayOrInstant(event.dates.published) && (!isDayOrInstant(event.dates.first_observed) || !event.caveats.some(note => /publication.*completion.*not stated/i.test(note)))) at('an undated completed recount needs first observation and an explicit missing publication/completion date caveat');
    if (event.kind !== 'official_canvass' && event.dates.certified === null && !/unofficial/i.test(event.status)) at('an event without a certification date must say it is unofficial');
    if (event.kind === 'withdrawn_certification' && !/withdr/i.test(event.status)) at('a withdrawn certification must say so in its status');

    if (!event.contests.length) at('at least one contest');
    for (const contest of event.contests) {
      const name = contest.contest || '(unnamed contest)';
      if (!contest.contest.trim() || !contest.coverage.trim() || !contest.candidates.trim() || !contest.scope.trim()) at(`${name}: contest, coverage, candidates and scope are required`);
      if (contest.scope_kind !== 'full_contest' && contest.scope_kind !== 'local_unit') at(`${name}: scope_kind must be full_contest or local_unit`);
      if (contest.scope_kind === 'local_unit' && !LOCAL_SCOPE_DISCLAIMER.test(contest.scope)) at(`${name}: a local-unit scope must say it is not a statewide, district or contest total`);
      if (contest.scope_kind === 'full_contest' && LOCAL_SCOPE_WORDS.test(contest.scope)) at(`${name}: a full-contest scope must not describe a town, county, parish, ward or other part`);
      if (event.kind === 'local_certification' && contest.scope_kind !== 'local_unit') at(`${name}: local_certification requires local_unit scope; use certification for the whole contest`);
      if (FULL_CONTEST_ONLY.includes(event.kind) && contest.scope_kind !== 'full_contest') at(`${name}: ${event.kind} speaks for the whole contest; use local_certification for a partial scope`);
      if (contest.race_path !== null) {
        const match = /^\/house\/([a-z]{2})-[a-z0-9]+\/$/.exec(contest.race_path);
        if (!match || match[1] !== event.state.toLowerCase()) at(`${name}: race_path ${contest.race_path} must be a /house/ route in ${event.state}`);
        else if (housePaths && !housePaths.has(contest.race_path)) at(`${name}: race_path ${contest.race_path} is not a published House page`);
      }
      if (contest.before !== null && contest.after === null) at(`${name}: a prior tally requires an updated tally`);
      if (contest.coverage_path !== undefined && !['/house/', '/senate/', '/governors/', '/down-ballot/executives/', '/down-ballot/legislatures/'].includes(contest.coverage_path)) at(`${name}: unknown coverage_path`);
    }
    for (const value of dupes(event.contests.map(contest => contest.contest))) at(`duplicate contest ${value}`);

    if (!event.sources.length) at('at least one official source');
    for (const source of event.sources) {
      if (!isHttps(source.url) || !source.title.trim() || !source.publisher.trim() || !isDayOrInstant(source.checked_at)) at('every source needs an https url, title, publisher and a YYYY-MM-DD or UTC checked_at');
      if (source.sha256 !== null && !/^[0-9a-f]{64}$/.test(source.sha256)) at('sha256 must be 64 hex characters');
    }
    for (const value of dupes(event.sources.map(source => source.url))) at(`duplicate source ${value}`);
    for (const value of dupes(event.caveats)) at(`duplicate caveat ${value}`);

    for (const key of ['published', 'effective', 'certified', 'first_observed'] as const) {
      if (event.dates[key] !== null && !isDayOrInstant(event.dates[key])) at(`dates.${key} must be YYYY-MM-DD, a UTC timestamp or null`);
    }
    if (!isDayOrInstant(event.dates.last_checked) || !INSTANT.test(event.dates.last_checked)) at('last_checked must be a UTC timestamp');
    else if (event.sources.some(source => isDayOrInstant(source.checked_at) && Date.parse(source.checked_at) > Date.parse(event.dates.last_checked))) at('last_checked precedes a source check');
    else if (isDayOrInstant(event.dates.first_observed) && Date.parse(event.dates.last_checked) < Date.parse(event.dates.first_observed)) at('last_checked precedes first_observed');
  }
  return problems;
}

/** A state page must not say its 2026 results page was unposted while citing a newer official update for that state. */
export function officialUpdateRowConflicts(events: readonly OfficialUpdateEvent[], rows: readonly OfficialResultsRow[]): string[] {
  return events.flatMap(event => {
    const row = rows.find(item => item.state === event.state);
    return row && row.pending && Date.parse(row.checked_at) < Date.parse(event.dates.last_checked)
      ? [`${event.id}: ${event.state} results link is still pending from ${row.checked_at}; recheck it before publishing a newer update`] : [];
  });
}

/** Newest record date first (act date or explicitly labeled first observation), then id. */
export const sortOfficialUpdates = (events: readonly OfficialUpdateEvent[]) =>
  [...events].sort((a, b) => b.id.slice(3, 13).localeCompare(a.id.slice(3, 13)) || a.id.localeCompare(b.id));

/** Events touching a site route, for race pages that cover one of the contests. */
export const officialUpdatesForPath = (events: readonly OfficialUpdateEvent[], path: string) =>
  events.filter(event => event.contests.some(contest => contest.race_path === path || contest.coverage_path === path));
