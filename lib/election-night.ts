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
};

export function officialResultsProblems(rows: readonly OfficialResultsRow[]): string[] {
  const problems: string[] = [];
  if (rows.length !== 51) problems.push(`expected 51 rows, found ${rows.length}`);
  for (const row of rows) {
    if (!isHttps(row.url)) problems.push(`${row.state}: url must be https`);
    if (Number.isNaN(Date.parse(row.checked_at))) problems.push(`${row.state}: checked_at must be a timestamp`);
    if (row.page_kind === 'landing' && !row.pending) problems.push(`${row.state}: a landing page stands in for a pending 2026 page`);
    if (row.label_seen !== undefined && (row.pending || !row.label_seen.trim())) problems.push(`${row.state}: label_seen describes posted 2026 results only`);
  }
  return problems;
}

/* Official post-election updates. Each event is one authority document version
 * (a corrected return, a completed recount determination or a certification),
 * never a vote-count feed. Scope stays explicit: a town or county return is not
 * a district or statewide total, and nothing here certifies a contest unless
 * the competent authority's certification is the cited document. */

export type OfficialUpdateKind = 'corrected_unofficial_tally' | 'completed_recount' | 'certification' | 'amended_certification' | 'withdrawn_certification';
export const OFFICIAL_UPDATE_KINDS: readonly OfficialUpdateKind[] = ['corrected_unofficial_tally', 'completed_recount', 'certification', 'amended_certification', 'withdrawn_certification'];
export const officialUpdateLabels: Record<OfficialUpdateKind, string> = {
  corrected_unofficial_tally: 'Corrected unofficial tally',
  completed_recount: 'Completed recount',
  certification: 'Certification',
  amended_certification: 'Amended certification',
  withdrawn_certification: 'Certification withdrawn',
};

export type OfficialUpdateContest = {
  /** "U.S. House, Connecticut District 1" */
  contest: string;
  /** Where Midterm Watch covers the contest, e.g. "U.S. House race page" or "Georgia House, chamber level". */
  coverage: string;
  /** Site route for the contest when one exists; chamber-level coverage has none. */
  race_path: string | null;
  candidates: string;
  /** Reporting unit the figures describe, stated in words. */
  scope: string;
  before: string | null;
  after: string | null;
  change: string | null;
};
export type OfficialUpdateSource = { url: string; title: string; publisher: string; version: string | null; sha256: string | null; checked_at: string };
export type OfficialUpdateDates = {
  /** Authority publication date as stated by the authority; null when the source states none. */
  published: string | null;
  effective: string | null;
  certified: string | null;
  /** Verbatim print/report timestamp from the document; time zone only if stated. */
  printed: string | null;
  /** First time Midterm Watch's research record observed the document (UTC); null when not retained. */
  first_observed: string | null;
  /** Latest successful recheck of every cited source for supersession (UTC). */
  last_checked: string;
};
export type OfficialUpdateEvent = {
  id: string; state: string; kind: OfficialUpdateKind;
  /** Short status line, e.g. "Unofficial; not certified". */
  status: string;
  authority: string;
  summary: string;
  contests: OfficialUpdateContest[];
  sources: OfficialUpdateSource[];
  dates: OfficialUpdateDates;
  caveats: string[];
};

const isDate = (value: string | null) => value !== null && !Number.isNaN(Date.parse(value));

/** Returns every problem with the official-updates record; an empty list means it is publishable. */
export function officialUpdateProblems(events: readonly OfficialUpdateEvent[], stateCodes: readonly string[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const event of events) {
    const at = (message: string) => problems.push(`${event.id}: ${message}`);
    if (!/^[A-Z]{2}-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(event.id)) at('id must look like ST-YYYY-MM-DD-slug');
    if (ids.has(event.id)) at('duplicate id');
    ids.add(event.id);
    if (!stateCodes.includes(event.state) || !event.id.startsWith(`${event.state}-`)) at('state must be a covered jurisdiction matching the id');
    if (!OFFICIAL_UPDATE_KINDS.includes(event.kind)) at(`unknown kind ${event.kind}`);
    if (!event.status.trim() || !event.authority.trim() || !event.summary.trim()) at('status, authority and summary are required');
    const certifying = event.kind === 'certification' || event.kind === 'amended_certification' || event.kind === 'withdrawn_certification';
    if (certifying && !isDate(event.dates.certified)) at('a certification event needs its certification date');
    if (!certifying && event.dates.certified !== null) at('only a certification event carries a certification date');
    if (!certifying && !/unofficial/i.test(event.status)) at('an uncertified event must say it is unofficial');
    if (!event.contests.length) at('at least one contest');
    for (const contest of event.contests) {
      if (!contest.contest.trim() || !contest.coverage.trim() || !contest.candidates.trim() || !contest.scope.trim()) at('every contest needs contest, coverage, candidates and scope');
      if (contest.race_path !== null && !/^\/[a-z0-9/-]+\/$/.test(contest.race_path)) at(`race_path ${contest.race_path} must be a site route`);
      if ((contest.before === null) !== (contest.after === null)) at(`${contest.contest}: before and after must both be stated or both be absent`);
    }
    if (!event.sources.length) at('at least one official source');
    for (const source of event.sources) {
      if (!isHttps(source.url) || !source.title.trim() || !source.publisher.trim() || !isDate(source.checked_at)) at('every source needs an https url, title, publisher and checked_at');
      if (source.sha256 !== null && !/^[0-9a-f]{64}$/.test(source.sha256)) at('sha256 must be 64 hex characters');
    }
    for (const key of ['published', 'effective', 'certified'] as const) if (event.dates[key] !== null && !isDate(event.dates[key])) at(`dates.${key} must be a date or null`);
    if (!isDate(event.dates.last_checked)) at('last_checked must be a timestamp');
    if (event.dates.first_observed !== null && !isDate(event.dates.first_observed)) at('first_observed must be a timestamp or null');
    if (isDate(event.dates.first_observed) && isDate(event.dates.last_checked) && Date.parse(event.dates.last_checked) < Date.parse(event.dates.first_observed!)) at('last_checked precedes first_observed');
  }
  return problems;
}

/** Events touching a site route, for race pages that cover one of the contests. */
export const officialUpdatesForPath = (events: readonly OfficialUpdateEvent[], path: string) =>
  events.filter(event => event.contests.some(contest => contest.race_path === path));
