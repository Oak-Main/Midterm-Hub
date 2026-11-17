import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { downloadHref } from '@/lib/downloads';
import type { EditionState } from '@/lib/election-night';
import { guideFor, refresh, refreshDownloads, refreshSources } from '@/lib/refresh';
import { decodeIcs, icsHasCurrentRunoffEvent } from '@/lib/runoff-calendar.mjs';
import { runoffConfirmed, votingWindowName, type RunoffRecord } from '@/lib/runoff-registration.mjs';
import { RunoffDeskView, type DeskCard, type DeskSource } from '@/components/runoff-desk-view';

// The runoff desk replaces the hero's post-election masthead while any runoff in
// content/refresh/content-package.json conditional_runoffs is still ahead. Every
// fact on a card comes from that record; its chips resolve in the source register.
const records = refresh.conditional_runoffs as RunoffRecord[];
const longDate = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

function source(id: string): DeskSource {
  const row = refreshSources.find(item => item.id === id);
  if (!row || !('url' in row) || !row.url) throw new Error(`Runoff desk source ${id} needs a register entry with a URL`);
  return { id, url: row.url, label: `${row.publisher}: ${row.title}`, checked: row.retrieved_on };
}

const icsFile = refreshDownloads.find(file => file.format === 'ICS');
const icsText = icsFile ? decodeIcs(readFileSync(join(process.cwd(), 'public/downloads', icsFile.name))) : '';

function card(record: RunoffRecord): DeskCard {
  const sources = (record.desk_source_ids ?? record.source_ids).map(source);
  const authority = source((record.authority_source_ids ?? record.source_ids)[0]);
  const request = record.absentee_request_date ? `Request by ${record.absentee_request_time ? `${record.absentee_request_time} ` : ''}${longDate(record.absentee_request_date)}.` : '';
  return {
    ...record,
    name: guideFor(record.state)?.name ?? record.state,
    guideHref: `/states/${record.state.toLowerCase()}/`,
    electionName: record.election_name ?? 'Runoff',
    conditional: !runoffConfirmed(record),
    windowLabel: votingWindowName(record),
    windowText: [record.early_voting_note, record.voting_window?.hours_note].filter(Boolean).join(' '),
    absenteeText: [request, record.ordinary_absentee_return].filter(Boolean).join(' '),
    authority: { href: authority.url, label: authority.label },
    icsHref: icsFile && icsHasCurrentRunoffEvent(icsText, record) ? downloadHref(icsFile.name) : null,
    sources,
    checked: sources.map(item => item.checked).sort().at(-1) ?? '',
  };
}

export const runoffDeskCards = records.map(card);
/** The most recent source check behind the desk, for the hero label. */
export const runoffDeskChecked = runoffDeskCards.map(item => item.checked).sort().at(-1) ?? refresh.as_of_date;

export function RunoffDesk({ editionState, mastheadCaption }: { editionState: EditionState; mastheadCaption: string }) {
  return <RunoffDeskView cards={runoffDeskCards} editionState={editionState} mastheadCaption={mastheadCaption} />;
}
