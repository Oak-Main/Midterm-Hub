import statusPayload from '@/content/election-night/status.json';
import pollClosePayload from '@/content/election-night/poll-close-2026.json';
import officialResultsPayload from '@/content/election-night/official-results.json';
import officialUpdatesPayload from '@/content/election-night/official-updates.json';
import { officialResultsProblems, officialUpdateProblems, officialUpdateRowConflicts, pollCloseProblems, readStatus, sortOfficialUpdates, type OfficialResultsRow, type OfficialUpdateEvent, type PollCloseRow } from '@/lib/election-night';
import { houseDistricts } from '@/lib/refresh';
import { states as jurisdictionList } from '@/lib/data';

// Invalid election-night data fails the build, so a bad status flip or table
// edit never replaces the deployed edition.
export const electionStatus = readStatus(statusPayload);
export const pollClose = pollClosePayload as { election_date: string; time_basis: { text: string; sources: { url: string; publisher: string; retrieved_at: string }[] }; rows: PollCloseRow[] };
export const officialResults = officialResultsPayload as { rows: OfficialResultsRow[] };
// Dated, source-linked official updates (corrected returns, completed recounts,
// certifications) for covered contests; newest first. Not a results feed.
export const officialUpdates = sortOfficialUpdates((officialUpdatesPayload as { events: OfficialUpdateEvent[] }).events);
const housePaths = new Set(houseDistricts.map(district => `/house/${district}/`));

const problems = [...pollCloseProblems(pollClose.rows), ...officialResultsProblems(officialResults.rows), ...officialUpdateProblems(officialUpdates, jurisdictionList.map(([code]) => code), housePaths), ...officialUpdateRowConflicts(officialUpdates, officialResults.rows)];
if (problems.length) throw new Error(`Election-night data is not publishable:\n${problems.join('\n')}`);

/** Pages whose content follows status.json; their sitemap date moves with each flip. */
export const electionNightPaths = new Set(['/', '/results/']);
// Per-state results pages carry the hub's status banner, so their sitemap
// dates move with each status flip too; derived from the same states list the
// route's generateStaticParams uses.
for (const [code] of jurisdictionList) electionNightPaths.add(`/results/${code.toLowerCase()}/`);
// Editorial content changed when North Dakota's unsupported final close was
// removed. This is a page-modification date, not a review date for every source;
// each cited source retains its own retrieved_at value in the data.
const contentChanged = '2026-11-04T00:00:00Z';
// Official updates and results-link rechecks also change these pages, so their
// latest check moves the sitemap date; House pages that list an update join the set.
for (const event of officialUpdates) for (const contest of event.contests) if (contest.race_path) electionNightPaths.add(contest.race_path);
export const electionNightModified = new Date(Math.max(
  Date.parse(contentChanged), Date.parse(electionStatus.updated_at),
  ...officialUpdates.map(event => Date.parse(event.dates.last_checked)),
  ...officialResults.rows.map(row => Date.parse(row.checked_at)),
));
