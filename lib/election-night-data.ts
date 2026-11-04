import statusPayload from '@/content/election-night/status.json';
import pollClosePayload from '@/content/election-night/poll-close-2026.json';
import officialResultsPayload from '@/content/election-night/official-results.json';
import { officialResultsProblems, pollCloseProblems, readStatus, type OfficialResultsRow, type PollCloseRow } from '@/lib/election-night';
import { states as jurisdictionList } from '@/lib/data';

// Invalid election-night data fails the build, so a bad status flip or table
// edit never replaces the deployed edition.
export const electionStatus = readStatus(statusPayload);
export const pollClose = pollClosePayload as { election_date: string; time_basis: { text: string; sources: { url: string; publisher: string; retrieved_at: string }[] }; rows: PollCloseRow[] };
export const officialResults = officialResultsPayload as { rows: OfficialResultsRow[] };

const problems = [...pollCloseProblems(pollClose.rows), ...officialResultsProblems(officialResults.rows)];
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
export const electionNightModified = new Date(Math.max(Date.parse(contentChanged), Date.parse(electionStatus.updated_at)));
