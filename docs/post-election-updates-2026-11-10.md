# Post-election official updates, November 10, 2026

Source handoff: `MidtermWatch_Post_Election_Handoff_2026-11-10.md` (owner
evidence register, version 1.0). That handoff is an evidence register, not
publishable copy; this file records what was re-verified, what shipped and what
was deliberately left unpublished. Research window: 2026-11-10 16:05Z (handoff
rechecks) and 17:07Z–(see release receipt) for this release.

Publication rules applied (owner instruction, November 10):

- Publish only (a) authority-documented corrections that materially affect a
  leader, margin, vote allocation, runoff qualification or recount threshold;
  (b) officially completed recounts; (c) actual certifications, amended
  certifications or withdrawals by the competent authority — and only for
  contests inside existing coverage, and only where the live site lacks the
  information.
- Town and county figures stay labeled as such; party lines are never
  presented as candidate totals; nothing is summed across document versions;
  missing dates and figures stay missing.
- Corrected tallies that are not certified are labeled unofficial.

Data: `content/election-night/official-updates.json` (validated at build time
by `officialUpdateProblems` in `lib/election-night.ts`) and
`content/election-night/official-results.json`.

## Production baseline

| Item | Value |
| --- | --- |
| Repository / branch | `Oak-Main/Midterm-Hub`, `main` |
| Serving revision before this release | `f1da98967ccc58c7a43d646a69ea40bcc4a886b2` (PR #58) |
| Serving deployment before this release | `dpl_9BZYGUpxcZnPxAE1oh7v2c7KHoNv` (Vercel project `midterm-hub`, team `kevynsgrin-a11ys-projects`) |
| Release path | Merge to `main` → Vercel Git production deployment → Cloudflare Worker `midtermwatch-vercel-proxy` → `https://midtermwatch.com` (see `DEPLOY.md`) |
| Open PRs at start | None |

## Evidence-to-change ledger

### E02 — Windsor, Connecticut amended head moderator's return (published)

| Field | Record |
| --- | --- |
| Race keys | CT · 2026-11-03 · Governor and Lieutenant Governor · Town of Windsor; CT · 2026-11-03 · U.S. House CT-1 · Town of Windsor |
| Coverage | Governor: `/governors/` ratings row; CT-1: `/house/ct-1/` |
| Authority and scope | Windsor Head Moderator Mariah Florkoski, on the Secretary of the State's return form, posted by the Windsor Town Clerk. Town scope only. |
| Event | Original return → "Amendment 1 - Recanvas - 3 typos" (corrected unofficial town return) |
| Before → after | Fazio/Corey **Republican line** 2,995 → 2,981 (−14); Independent line 241 unchanged. Bronin **Democratic line** (his only line) 9,972 → 9,992 (+20). Also changed: Treasurer (Wilms R 2,952 → 2,817; IND 183 → 173) — outside coverage, not published. Total votes for governor 13,046 → 13,032. |
| Sources | Amended: `windsorct.gov/DocumentCenter/View/6871` sha256 `6b73ce45…3687` (53 pp); original: `View/6867` sha256 `9350dc37…dfe5` (8 pp, scanned); index `/560/Complete-Election-Results`; CT SOTS Election Center (`ctemspublic.pcctg.net`, election 108, data version 53541) shows amended Windsor figures, all towns "Unofficial Results" |
| Dates | Published: not stated. Effective: not stated. Certified: none. Printed: original 11/3/2026 10:54:11 PM, amendment 11/6/2026 8:45:43 AM (time zone not stated). First observed: Nov 10. Last checked: 2026-11-10T17:21Z. |
| Supersession | No Amendment 2; index lists only the amended file; no SOTS certification; SOTS newest press release 11/3 (Wallingford). `electionresults.ct.gov` unreachable (proxy CONNECT 502 at 17:07Z, 17:20Z, 17:21Z). |
| Live defect | `/results/ct/` and `/house/ct-1/` (observed 17:10Z, deployment `dpl_9BZY…`) had no post-election note; `/results/ct/` still said the 2026 results page "had not been posted when last checked", checked Nov 2. |
| Remedy | Dated, source-linked "Official updates" entry on `/results/ct/`, listed on `/results/`, linked from `/house/ct-1/`. Town scope, party lines and unofficial status stated; the blank signature line and "Recanvas" label caveated. |

### E01 — Georgia House District 154, Seminole County (published, county scope)

| Field | Record |
| --- | --- |
| Race key | GA · 2026-11-03 · State House District 154 · Gerald E. Greene (R, incumbent) vs Harry James (D) |
| Coverage | Georgia House at chamber level (`/down-ballot/legislatures/`); no district page exists and none was created |
| Authority and scope | Seminole County Elections Department (statement of Elections Supervisor Ronald D. Foskey; county summary report); Georgia Secretary of State results site (county and district pages). Seminole County portion only. |
| Event | County election-night report "Unofficial & Incomplete" → completed county report (corrected unofficial tally for this site's purposes) |
| Before → after | Seminole ballots 2,523 → 2,911 (+388, per county statement). Seminole HD 154: Greene 1,665 → 2,019 (+354), James 824 → 858 (+34), all Election Day. "Before" from the county report printed 11/3/2026 9:33:34 PM; "after" from the SOS results site's Seminole page (labeled OFFICIAL RESULTS; asOf 2026-11-09T20:40:34Z). No county document with the corrected candidate figures is posted. |
| Not published | The SOS November 6 release's wording ("trailed by fewer than 100", "leads by 262") could not be retrieved: `sos.ga.gov` returned 403 Cloudflare challenges to curl, a browser and WebFetch (17:09Z, 17:18Z); archive and GovDelivery also failed. The SOS results site's current district margin (253, unofficial, asOf 2026-11-10T15:51:41Z) differs from the reported 262; no derived pre-correction district margin is published. The current district count is not published (no live counts). |
| Sources | `seminolecountyga.com/DocumentCenter/View/242` sha256 `02ef4cc9…b2db` (undated; PDF metadata 2026-11-07T18:35Z is not a publication date); `View/239` sha256 `9e994180…42ad`; `View/241` audit notice sha256 `599086dc…a0e5` (audit November 16, 9 a.m.); SOS results site Seminole page |
| Dates | Published: not stated. Effective: not stated. Certified: none for the contest. Printed: 11/3/2026 9:33:34 PM. First observed: Nov 9 (handoff record). Last checked: 2026-11-10T17:17Z. |
| Supersession | No SOS recount election listed for Nov 3; district page labeled UNOFFICIAL; Dougherty, Miller and Quitman not flagged official; no newer Seminole documents (DocumentCenter enumerated 17:15Z). |
| Live defect | `/results/ga/` (observed 17:10Z) had no post-election note. |
| Remedy | Dated, source-linked entry on `/results/ga/`, listed on `/results/`. Mechanism attributed to the county ("no memory card was missing or found"). |

### Pending queue — not published

| ID | Item | Determination (checked 2026-11-10 17:09Z–17:24Z) |
| --- | --- | --- |
| P01 | South Carolina recount portal `enr-scvotes.org/SC/127592/` | Lists U.S. House SC-2 and State House 27 and 89 at 0% of counties reporting; zeros are placeholders, not results. The Nov 10 State Board of Canvassers document is an agenda only; no signed canvass or certificate posted. **Unresolved.** |
| P02 | Idaho, Latah County recount | SoS: 2,342 ballots not fully transferred to reporting, "no outcomes were changed"; recount scheduled 17:30Z, not completed when checked. **Unresolved.** |
| P03 | Florida U.S. House 27 recount | Recount noticed (starting no sooner than Nov 9, 10 a.m.); no FL-27 recount certificate (only Doral council seat). **Unresolved.** |
| P04 | Oklahoma certification | State Election Board meeting 5:00 p.m. CT (23:00Z) with certification on the agenda; no certificate when checked. **Unresolved** (see release receipt for any later check). |
| P05 | Iowa, Johnson County | Previously unopened absentee ballots counted before canvass; auditor says no outcomes changed. Ordinary completion, not a correction. **Not eligible.** |
| P06 | New Hampshire, Nashua amended ward returns (`nashuanh.gov/DocumentCenter/View/37495`, sha256 `a0dce84c…d7bb`, 29 pp scanned) | Ward amendments dated 11/4 and 11/7: U.S. Senate Ward 4 Sununu 577 (struck figure partly obscured), Ward 6 Laplante 92 (struck partly obscured); NH-2 Ward 5 Goodlander 3,038 (struck 4,795). Governor unchanged. Materiality to NH-2 and whether the struck figures were ever published cannot be established: NH SoS results pages returned 403 (17:16Z). **Unresolved.** |
| P07 | Missouri, Washington County certified results | Document certifies the November 3, 2026 general election (the "2027" in the filename is a naming error); signed Nov 6; county scope, no correction. **Not eligible.** |
| P08 | Minnesota MN-1 | Unofficial 323-vote margin; State Canvassing Board meets Nov 19, 2 p.m. No determination yet. **Not eligible yet.** |
| — | Chatham County, GA certification (Nov 9) | County scope; no full-contest effect. **Not eligible.** |
| — | Newton County, GA | County page blocked (Cloudflare); SOS page shows county unofficial. **Unresolved on access.** |

Exclusions in handoff Appendix/section 3 (Doral recount, Florida House 33 and
Atlantic Beach notices, Wilson County NC, Fulton rescan, Mohave tabulation,
ordinary batches, primary-election items, Parmer County hours, untracked local
contests, candidate certifications, schedules) remain excluded.

## Official results links (availability refresh)

Every changed row was re-checked on November 10 in a plain headless Chromium
(stock user agent, no automation-hiding flags or other bot-check workarounds).
Oklahoma and South Carolina were refreshed from the authority's own linking page
fetched with plain curl; their result hosts refused automated checks and their
contents were not inspected. Labels are the authority's own wording at the
check time, rendered as a dated quotation, never as a certification claim.
Research agents' renders that used an automation-hiding browser flag were
discarded and re-done.

| State | Before (Nov 2) | After | Checked | Authority label seen |
| --- | --- | --- | --- | --- |
| AL | pending · https://www2.alabamavotes.gov/electionNight/statewideResultsByContest.aspx?ecode=1001290 | https://www2.alabamavotes.gov/electionNight/statewideResultsByContest.aspx?ecode=1001305 | 2026-11-10T17:40:02Z | Unofficial Election Night Results |
| AZ | pending · https://app.enhancedvoting.com/results/public/Arizona/110326GeneralElection | https://app.enhancedvoting.com/results/public/Arizona/110326GeneralElection | 2026-11-10T17:40:12Z | UNOFFICIAL RESULTS |
| AR | pending · https://arkansas.tally-enr.com/ | https://arkansas.tally-enr.com/#election=11b07106-031e-4d7c-911a-d01fb473d6dd | 2026-11-10T17:40:23Z | Unofficial Results |
| DE | pending · https://elections.delaware.gov/results/enr/GE2026.html | https://elections.delaware.gov/results/enr/GE2026.html | 2026-11-10T17:40:44Z | UNOFFICIAL RESULTS |
| DC | pending · https://electionresults.dcboe.org/ | https://electionresults.dcboe.org/election_results/2026-General-Election | 2026-11-10T17:40:52Z | Election Night Unofficial Results |
| GA | pending · https://results.sos.ga.gov/results/public/Georgia | https://results.sos.ga.gov/results/public/Georgia/elections/11032026GeneralAndSpecialElection | 2026-11-10T17:41:01Z | UNOFFICIAL RESULTS |
| HI | pending · https://elections.hawaii.gov/election-results/ | https://elections.hawaii.gov/election-results/ | 2026-11-10T17:41:11Z | — |
| ID | pending · https://voteidaho.gov/election-results/ | https://results.voteidaho.gov/results/public/id/elections/nov2026 | 2026-11-10T17:41:20Z | UNOFFICIAL RESULTS |
| IN | pending · https://enr.indianavoters.in.gov/site/index.html | https://enr.indianavoters.in.gov/site/index.html | 2026-11-10T17:41:30Z | — |
| MD | https://elections.maryland.gov/elections/2026/general_results/index.html | same URL | 2026-11-10T17:41:51Z | Unofficial |
| MT | pending · https://sosmt.gov/elections/results/ | https://electionresults.mt.gov/ | 2026-11-10T17:33:01Z | — |
| NE | https://electionresults.nebraska.gov/ | same URL | 2026-11-10T17:33:08Z | Unofficial Results |
| NM | https://electionresults.sos.nm.gov/ | same URL | 2026-11-10T17:33:30Z | Unofficial Results |
| NC | pending · https://er.ncsbe.gov/ | https://er.ncsbe.gov/?election_dt=11/03/2026&county_id=0&office=FED&contest=0 | 2026-11-10T17:34:38Z | UNOFFICIAL |
| ND | https://resultsnd.sos.nd.gov/#election=348 | same URL | 2026-11-10T17:34:48Z | Unofficial Results |
| OK | pending · https://oklahoma.gov/elections/elections-results/election-results/2026-election-results.html | https://oklahoma.gov/elections/elections-results/election-results/2026-election-results/november-general-election.html | 2026-11-10T17:37:30Z | UNOFFICIAL RESULTS |
| OR | https://results.oregonvotes.gov/ | same URL | 2026-11-10T17:35:04Z | UNOFFICIAL |
| RI | https://electionresults.ri.gov/results/public/rhodeisland/elections/2026StatewideGeneralElection | same URL | 2026-11-10T17:35:14Z | UNOFFICIAL RESULTS |
| SC | pending · https://scvotes.gov/elections-statistics/election-results/ | https://www.enr-scvotes.org/SC/127300/web.345435/#/summary | 2026-11-10T17:36:48Z | — |
| SD | https://electionresults.sd.gov/Default.aspx | same URL | 2026-11-10T17:35:27Z | Unofficial Results |
| UT | pending · https://electionresults.utah.gov/results/public/Utah | https://electionresults.utah.gov/results/public/Utah/elections/General11032026 | 2026-11-10T17:35:44Z | UNOFFICIAL RESULTS |
| VT | pending · https://electionresults.vermont.gov/ | https://electionresults.vermont.gov/ | 2026-11-10T17:35:52Z | UNOFFICIAL |
| VA | https://enr.elections.virginia.gov/results/public/virginia/elections/2026-November-General | same URL | 2026-11-10T17:36:02Z | UNOFFICIAL RESULTS |
| WA | pending · https://results.votewa.gov/results/public/washington | https://results.votewa.gov/results/public/washington/elections/20261103 | 2026-11-10T17:36:12Z | UNOFFICIAL RESULTS |
| WY | pending · https://sos.wyo.gov/Elections/ElectionResults.aspx | https://sos.wyo.gov/Elections/Docs/2026/2026GeneralResults.aspx | 2026-11-10T17:36:25Z | Unofficial |
| CT | pending · https://portal.ct.gov/sots/election-services/election-results/election-results | https://ctemspublic.pcctg.net/ (visitor note: choose “11/03/2026 -- November 2026 State Election”) | 2026-11-10T17:46:46Z | — (statewide view shows no label; town data marked “Unofficial Results”) |

Unchanged rows (honest November 2 check date retained):

| State | Kept as of Nov 2 because |
| --- | --- |
| AK | plain browser 502 (incomplete certificate chain) |
| CA | Incapsula challenge |
| CO | 403 to plain browser |
| FL | Cloudflare challenge |
| IA | 403 to plain browser |
| IL | no 2026 general results posted |
| KS | Cloudflare challenge |
| KY | 403 bot block; 2026 general section empty |
| LA | graphical page shows the default election, no stable 2026 link |
| MA | no 2026 general results posted |
| ME | no 2026 general results posted |
| MI | linked results host returns Cloudflare 403 |
| MN | captcha redirect |
| MO | results site shows no vote counts |
| MS | no 2026 general results posted |
| NH | 403 / Akamai challenge |
| NJ | Division posts no vote counts on that page |
| NV | 403 to plain browser |
| NY | 403 / timeout |
| OH | Cloudflare challenge |
| PA | 403 |
| TN | 403 to plain browser |
| TX | CAPTCHA |
| WI | no 2026 general results posted |
| WV | 403 to plain browser |

## Reviews

| Review | Scope | Outcome |
| --- | --- | --- |
| Independent factual review (separate agent, fresh downloads, page images inspected) | Every claim in `official-updates.json` against its official sources | No blocking issues; all figures, names, party lines, scope labels, statuses, dates and hashes confirmed; no superseding Windsor amendment, Seminole document or state certification found. Applied: both November 16 Seminole audits named. Kept: cautious "unofficial" district framing. |
| Independent code review (separate agent) | `git diff origin/main...HEAD` | No blocking issues. Six should-fix findings (S1 Connecticut pending row contradicting a newer update; loose date parsing; certification overclaim for partial scope or withdrawal; scope rule only in tests; undated completed recount; unchecked race_path) fixed in `e7910b8` with regression tests; optional items O1–O3, O5, O7–O11 applied; O4 documented; O6 (South Carolina link) kept as the authority's own link. Re-review result recorded in the release receipt. |
