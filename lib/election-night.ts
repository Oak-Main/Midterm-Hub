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
};

export function officialResultsProblems(rows: readonly OfficialResultsRow[]): string[] {
  const problems: string[] = [];
  if (rows.length !== 51) problems.push(`expected 51 rows, found ${rows.length}`);
  for (const row of rows) {
    if (!isHttps(row.url)) problems.push(`${row.state}: url must be https`);
    if (Number.isNaN(Date.parse(row.checked_at))) problems.push(`${row.state}: checked_at must be a timestamp`);
    if (row.page_kind === 'landing' && !row.pending) problems.push(`${row.state}: a landing page stands in for a pending 2026 page`);
  }
  return problems;
}
