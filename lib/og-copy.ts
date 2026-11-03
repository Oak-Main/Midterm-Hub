import type { PollCloseRow } from './election-night.ts';

// KEVYN-WRITE: final scheduled poll close in ET, without a result or call | facts: pollClose.rows closes[].utc and closes[].et; incomplete or conflicting rows cannot establish a final statewide close
export function resultShareLine(row: PollCloseRow): string {
  if (row.tag === 'UNVERIFIED' || row.tag === 'CONFLICT' || row.unverified_areas?.length || !row.all_polls_closed_utc || !row.closes.length) {
    return 'Closing times vary by locality';
  }
  const final = row.closes.reduce((latest, close) => close.utc > latest.utc ? close : latest);
  return `Final poll close: ${final.et}`;
}

type RegistrationField = { value: string | null; verification_status: string };
type Registration = { in_person: RegistrationField; mail: RegistrationField; online: RegistrationField };

// KEVYN-WRITE: ordinary registration deadline when every offered method shares a verified date | facts: guideFor registration values and verification_status; method and eligibility rules remain in the voting guide
export function guideShareLine(registration: Registration): string | undefined {
  const fields = Object.values(registration).filter(field => field.verification_status !== 'not_offered');
  if (!fields.length || fields.some(field => !field.value || !['cross_checked_date', 'cross_checked'].includes(field.verification_status))) return;
  if (new Set(fields.map(field => field.value)).size !== 1) return;
  const date = fields[0].value!;
  if (!/^2026-\d{2}-\d{2}$/.test(date)) return;
  const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
  return `Ordinary registration deadline: ${label}`;
}
