export type RunoffPhase = 'registration_open' | 'registration_closed' | 'voting_open' | 'no_voting_today' | 'runoff_day' | 'past';
export type RunoffVotingWindow = {
  kind: 'early_voting' | 'advance_voting' | 'in_person_absentee';
  first_day: string | null; first_day_note?: string; last_day: string; last_day_time?: string;
  last_day_conflict?: string[]; closed_days?: string[]; hours?: string; hours_note?: string; source_ids: string[];
};
export type RunoffContest = { label: string; source_ids: string[] };
export type RunoffRecord = {
  state: string; date: string; offices: string; source_ids: string[]; election_day_hours: string;
  registration_in_person_mail?: string; registration_online?: string; registration_online_system?: string; registration_note?: string;
  registration_date?: string; registration_state_local?: string; registration_federal?: string;
  early_voting_note?: string; absentee_request_date?: string; absentee_request_time?: string; ordinary_absentee_return?: string;
  election_name?: string; voting_window?: RunoffVotingWindow; contests?: RunoffContest[]; contests_note?: string;
  authority_source_ids?: string[]; desk_source_ids?: string[];
};
export const RUNOFF_PHASES: readonly RunoffPhase[];
export function runoffRegistrationText(record: { registration_in_person_mail?: string; registration_online?: string; registration_note?: string; registration_date?: string }): string;
export function registrationRoutes(record: RunoffRecord): { key: string; label: string; date: string; system: string | null }[];
export function votingWindowName(record: RunoffRecord): string;
export function runoffConfirmed(record: RunoffRecord): boolean;
export function runoffPhase(record: RunoffRecord, today: string): RunoffPhase;
export function nextRunoffDeadline(record: RunoffRecord, today: string): string | null;
export function sortRunoffs<T extends RunoffRecord>(records: readonly T[], today: string | null): T[];
export function activeRunoffs<T extends RunoffRecord>(records: readonly T[], today: string | null): T[];
export function runoffStatusLine(record: RunoffRecord, today: string | null): string | null;
