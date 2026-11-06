import { electionStatus } from '@/lib/election-night-data';

// Public machine-readable edition state, exported as out/status.json so
// Vercel serves /status.json as application/json. It mirrors the switch in
// content/election-night/status.json and carries no counts, projections or
// calls. Not listed in the sitemap (app/sitemap.ts enumerates pages only).
export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    status: electionStatus.edition_state,
    edition_state: electionStatus.edition_state,
    updated_at: electionStatus.updated_at,
  });
}
