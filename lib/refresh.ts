import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import payload from '@/content/refresh/content-package.json';
import sourcePayload from '@/content/refresh/source-register.json';
import downloadPayload from '@/generated/refresh-downloads-manifest.json';

export const refresh = payload;
export const refreshSources = sourcePayload;
export const refreshDownloads = downloadPayload.files;
export const canonicalOrigin = 'https://www.midtermwatch.com';
export const refreshModified = new Date(refresh.research_cutoff_utc);
export const houseDistricts = refresh.house_races.map(row => row.district.toLowerCase());
export const guideFor = (state: string) => refresh.state_registration_records.find(row => row.state === state.toUpperCase());

// Names are selected from the fixed route list or validated district/state IDs.
export function refreshHtml(name: string) {
  if (!/^[a-z0-9/-]+\.html$/.test(name) || name.includes('..')) throw new Error('Invalid content key');
  return readFileSync(join(process.cwd(), 'content/refresh/fragments', name), 'utf8');
}

export const refreshSections = [
  { slug: 'house', title: '2026 House races', description: 'All 435 House districts with separate DDHQ and Cook ratings, featured candidates and source links.', file: 'house.html' },
  { slug: 'senate', title: '2026 Senate races', description: 'All 35 Senate contests with dated producer ratings and a transparent editorial comparison.', file: 'senate.html' },
  { slug: 'governors', title: '2026 governor races', description: 'All 36 governor contests with dated forecast comparisons and their sources.', file: 'governors.html' },
  { slug: 'polls', title: '2026 Senate polling', description: 'Seven original Senate surveys with fieldwork, samples, vote shares and methodological limits.', file: 'polls.html' },
  { slug: 'forecast', title: '2026 election forecast', description: 'Dated national House and Senate model estimates with attribution and uncertainty.', file: 'home.html' },
  { slug: 'voting', title: '2026 voting guides', description: 'Registration by method, early voting, mailed ballot applications, returns and poll hours for all 50 states and DC.', file: 'voting-deadlines.html' },
] as const;
export const downBallotSections = [
  { slug: 'executives', title: 'State executive races', description: '60 selected statewide executive contests, including all 30 attorney general and 26 elected secretary of state races.', file: 'down-ballot/executives.html' },
  { slug: 'legislatures', title: 'State legislative chambers', description: '32 chambers to watch, with attributed assessments and coalition and supermajority context.', file: 'down-ballot/legislatures.html' },
  { slug: 'courts', title: 'Judicial elections', description: '17 selected judicial entries covering 18 seats, with accurate ballot structures and evidence limits.', file: 'down-ballot/courts.html' },
  { slug: 'measures', title: '2026 ballot measures', description: '15 consequential state ballot measures, verified against official material and independent reference sources.', file: 'down-ballot/measures.html' },
] as const;

export function pageMetadata(title: string, description: string, path: string) {
  return { title, description, alternates: { canonical: canonicalOrigin + path },
    openGraph: { title: title + ' · Midterm Watch', description, url: canonicalOrigin + path } };
}
