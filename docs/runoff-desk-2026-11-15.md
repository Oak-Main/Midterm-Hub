# Runoff-first home page, November 15, 2026

The home page now leads with a runoff desk for the December 1 Georgia and
Mississippi runoffs and the December 12 Louisiana election. This file records
which facts were re-verified, where each comes from, which contests were
confirmed or left out, and what the page does on each date.

House rules applied:

- No vote counts, projections or race calls. Runoff copy states dates,
  deadlines, eligibility routes and the contests an official source lists.
- Every fact cites a source register entry with its check date. New entries
  were added; no earlier entry's date or value changed.
- Existing `KEVYN-WRITE` slots are untouched. The new hero subhead is a
  `KEVYN-WRITE` slot with a placeholder.
- `content/election-night/status.json` (still `post_election`), the Cloudflare
  Worker, `vercel.json` and the workflows are unchanged.

Checks were made on November 15, 2026 (Pacific time).

## Step 1: date re-verification

No value differed from the published records, so no correction entry was
added to `app/corrections/page.tsx`.

### Louisiana, Saturday December 12

All three sources agree on every value.

| Fact | Value | Sources (checked 2026-11-15) |
| --- | --- | --- |
| Registration in person, by mail, at OMV | Closed November 12 | LA-DATES-20261115, LA-LINCOLN-20261115, LA-STTAMMANY-20261115 |
| Online registration (GeauxVote) | Through November 21 | same |
| Early voting | November 28–December 5, closed Sunday November 29, 8:30 a.m.–6 p.m. | same |
| Absentee request | By 4:30 p.m. December 8 (not military/overseas) | LA-DATES-20261115, LA-LINCOLN-20261115 |
| Absentee receipt | By 4:30 p.m. December 11 (not military/overseas) | LA-DATES-20261115, LA-LINCOLN-20261115 |
| Polls | 7 a.m.–8 p.m. | LA-DATES-20261115, LA-LINCOLN-20261115 |

The Louisiana Secretary of State page (`LA-DATES`) loaded this time, so it has
a new dated entry, `LA-DATES-20261115`. The October 20 `LA-DATES` entry is
unchanged.

### Mississippi, Tuesday December 1 (if required)

| Fact | Value | Source (checked 2026-11-15) |
| --- | --- | --- |
| Runoff registration deadline | November 2 | MS-CALENDAR-20261115 |
| Absentee voting, Saturday hours | 8 a.m.–noon, November 21 | MS-CALENDAR-20261115 |
| In-person runoff absentee deadline | Noon, Saturday November 28 | MS-CALENDAR-20261115 |
| Runoff day | December 1, if required, for Supreme Court, Court of Appeals, chancery, circuit and county court judges and school board members/trustees; polls 7 a.m.–7 p.m. | MS-CALENDAR-20261115 |
| Mail ballots | Postmarked by December 1; received by 5 p.m. December 8 | MS-CALENDAR-20261115 |
| Runoff date only | December 1 "General Runoff Election" | MS-CALENDAR-SUMMARY-20261115 |

**Source note.** The URL the brief proposed for `MS-CALENDAR-20261115`
(`/sites/default/files/publications/Election%20Calendar_2026.pdf`) is a
one-page summary. It confirms only the December 1 date. The deadlines above
come from the detailed 16-page calendar (last revised September 8, 2026) at
`/content/documents/elections/2026%20Elections%20Calendar.pdf`, the URL already
used by `MS-CALENDAR`. So `MS-CALENDAR-20261115` points to the detailed
calendar, and the summary is registered separately as
`MS-CALENDAR-SUMMARY-20261115`.

The detailed calendar gives no first day for runoff in-person absentee voting.
The desk therefore never says Mississippi voting is "open". It gives the noon
November 28 deadline instead.

### Georgia, Tuesday December 1 (if required): not re-verified

`https://sos.ga.gov/2026-elections-calendar` returned HTTP 403 to an automated
request. The site was not retried with a disguised browser. Georgia values
stay as published from the November 2 checks:

- Registration closed October 5 (state and local) and November 2 (federal).
- Advance voting starts by November 23. The end date conflicts: Georgia.gov
  says November 25, the SOS calendar says November 27. The corrected wording is
  kept.
- Absentee applications were due November 20. Ballots must be received by
  close of polls on December 1.
- Polls are open 7 a.m.–7 p.m.

The Georgia card shows "Checked Nov 2", so readers can see it is older. No
`GA-*-20261115` entry was added. **Open item: recheck the Georgia SOS calendar
by hand** (steps are in the PR description).

## Step 2: contests on the runoff ballots

| State | Contest | Status | Source |
| --- | --- | --- | --- |
| LA | U.S. House, District 5 | Confirmed | LA-CANDIDATES-20261115 |
| LA | U.S. House, District 6 | Confirmed | LA-CANDIDATES-20261115 |
| LA | State Senate, District 14 special primary (East Baton Rouge Parish) | Confirmed | LA-DATES-20261115, LA-CANDIDATES-20261115 |
| LA | District judge (12th, 18th, 22nd, 27th, 30th JDC), district attorney (2nd, 31st JDC), City of Shreveport mayor, city judge and District F council | Listed officially; summarized in one note, not listed one by one | LA-CANDIDATES-20261115 |
| GA | State House District 151 (news lead, WRDW, Nov 12) | **Left out** | No official listing found |
| MS | Any | **Left out** | No official listing found |

- **Louisiana.** The Secretary of State's Candidate Inquiry
  (`voterportal.sos.la.gov/candidateinquiry`) was opened in a plain headless
  browser, with election date 12/12/2026 selected. It lists the offices above
  under Statewide/Multi-Parish. Candidate names were not copied.
- **Georgia.** `results.sos.ga.gov/results/public/Georgia` lists no December 1,
  2026 runoff election yet. Its latest entry is the November 3 General & Special
  Elections. Working out a runoff from November 3 vote counts would break the
  no-counts rule, so the card keeps the generic `offices` text.
- **Mississippi.** The 2026 general-election results page is behind a
  Cloudflare block (HTTP 403) for automated requests and was not bypassed. The
  card keeps the generic `offices` text.

## What changed

- **`content/refresh/content-package.json`.** Each record in
  `conditional_runoffs` gets new fields; no existing field changed. The fields
  are `election_name`, `voting_window`, `authority_source_ids` and
  `desk_source_ids`. Louisiana also gets `registration_online_system`,
  `contests`, `contests_note` and `contests_note_source_ids`.
- **`content/refresh/source-register.json`.** Six new entries:
  `LA-DATES-20261115`, `LA-LINCOLN-20261115`, `LA-STTAMMANY-20261115`,
  `LA-CANDIDATES-20261115`, `MS-CALENDAR-20261115` and
  `MS-CALENDAR-SUMMARY-20261115`.
- **Downloads.** The `public/downloads/*-2026-10-20.json` copies and
  `generated/refresh-downloads-manifest.json` were updated so the build's hash
  check passes.
- **`lib/runoff-registration.mjs`.** Adds `runoffPhase`, `runoffStatusLine`,
  `sortRunoffs`, `activeRunoffs`, `nextRunoffDeadline` and
  `registrationRoutes`. All are pure functions of an ISO date from
  `localCalendarDate()`.
- **`lib/runoff-calendar.mjs`.** Checks whether the `.ics` download holds a
  runoff's event with its current early-voting text.
- **`lib/use-local-date.ts`.** The device-date hook, the same logic as
  `ElectionMasthead`'s. `components/election-masthead.tsx` is unchanged.
- **New components.** `components/runoff-desk.tsx` (server: resolves sources,
  authority link and `.ics`) and `components/runoff-desk-view.tsx` (client:
  phase, order, countdown and fallback).
- **`app/page.tsx`.** Changes:
  - New hero label.
  - New `KEVYN-WRITE` subhead slot with its placeholder.
  - The desk replaces the masthead.
  - The Election Day block is retitled "Election Day results · November 3,
    2026" and now sits below the desk.
  - The bottom `RunoffNotice` is removed (the component was only used here and
    is deleted).
  - The stale "Louisiana House contests may require a December runoff" caption
    is gone.
  - New title and description.
  - One `Event` JSON-LD item per runoff.
- **`tests/frontend/runoff-phase.test.mjs`.** New tests (details under Checks).

### Phases (`runoffPhase`)

The spec names five phases; there is a sixth, `no_voting_today`. It covers
Louisiana's Sunday, November 29 and the days between the end of early voting
and the runoff. Without it, those days would fit none of the five.

| Date | LA | GA | MS |
| --- | --- | --- | --- |
| Nov 15 | registration_open | registration_closed | registration_closed |
| Nov 21 | registration_open ("closes today") | registration_closed | registration_closed |
| Nov 22 | registration_closed | registration_closed | registration_closed |
| Nov 23–27 | registration_closed | voting_open (both end dates shown) | registration_closed |
| Nov 28 | voting_open | no_voting_today | registration_closed (noon deadline shown) |
| Nov 29 | no_voting_today (Sunday) | no_voting_today | no_voting_today |
| Dec 1 | voting_open | runoff_day | runoff_day |
| Dec 2 | voting_open | past (card hidden) | past (card hidden) |
| Dec 6–11 | no_voting_today | — | — |
| Dec 12 | runoff_day | — | — |
| Dec 13 | past | — | — |

**Card order.** A state whose registration is still open comes first, so
Louisiana leads through November 21. After that, cards are ordered by the
nearest deadline.

**First paint.** The static first paint has no date. It shows every card,
ordered by the latest registration route, which gives the same order as
November 15, so nothing reorders on hydration. It shows each record's
registration text and no countdown.

**After December 12.** When every runoff is past, the desk renders nothing. The
hero goes back to the post-election masthead, the October 20 label and the
original subhead. This needs no manual change. The fallback passes no runoffs to
the masthead, so its "Possible runoffs" list (which linked to the removed
section) does not render.

**`.ics` link.** Shown for Louisiana and Mississippi only. In the October 20
`midterm-watch-voting-2026-10-20.ics`, the Georgia event still says "through
November 25", the wording superseded on November 2. The desk does not link that
file from the Georgia card. The file itself was not edited.

## Checks

| Command | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass (includes `validate-refresh.mjs`) |
| `REQUIRE_STATIC_EXPORT=1 npm test` | 167 / 167 pass |
| `.venv/bin/python -m pytest -q` | 409 pass, 0 fail |

**Length budgets (Next.js home page).** The title is 70 characters and the
description is 147 characters; `runoff-phase.test.mjs` pins both.
`tests/test_site_regressions.py` enforces 160 characters on the Python-built
site, not on the Next.js export.

**Other things the new tests pin:**

- Every listed date for each state.
- The status-line wording.
- The order, including no reorder on hydration.
- The December 13 fallback.
- Register dates, including earlier dates left unchanged.
- That contests come only from official sources.
- The `.ics` rule.
- The built page: title, description, `Event` data, section order, no
  first-paint countdown and no `KEVYN-WRITE` text in the HTML.

## Screenshots

These are from the local `npm run build` export, served from `out/`, with the
browser clock set to November 16, 2026. The Vercel preview link is in the PR.

- 390 px: [`runoff-desk-2026-11-15/home-390.jpg`](runoff-desk-2026-11-15/home-390.jpg)
- 1280 px: [`runoff-desk-2026-11-15/home-1280.jpg`](runoff-desk-2026-11-15/home-1280.jpg)

## Follow-ups

1. Recheck the Georgia SOS calendar by hand. If it matches, add a
   `GA-SOS-2026-RUNOFF-20261115`-style dated entry and point the Georgia card's
   `desk_source_ids` at it.
2. Write the hero subhead (`KEVYN-WRITE` in `app/page.tsx`).
3. Regenerate the Georgia event in the `.ics` download with the corrected
   early-voting wording. Once the event carries the current text, the desk
   links it automatically.
4. After December 12, change the home `<title>` and description. They are
   static metadata and cannot follow the visitor's date.
5. Add Georgia or Mississippi contests to `contests` only when an official
   source lists them.
