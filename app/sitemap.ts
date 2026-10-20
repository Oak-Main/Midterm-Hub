import type { MetadataRoute } from 'next';
import { electionHref, elections, stateHref, states } from '@/lib/data';
import { canonicalOrigin, downBallotSections, houseDistricts, refreshModified, refreshSections } from '@/lib/refresh';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', '/states/', '/methodology/', '/data/', '/about/', '/sources/', '/results/', '/corrections/', '/down-ballot/', ...refreshSections.map(row => `/${row.slug}/`), ...downBallotSections.map(row => `/down-ballot/${row.slug}/`), ...states.map(([code]) => stateHref(code)), ...elections.map(electionHref), ...houseDistricts.map(district => `/house/${district}/`)];
  return paths.map(path => ({ url: canonicalOrigin + path, lastModified: refreshModified }));
}
