# Minnesota absentee-ballot return check, November 3, 2026

Request: the owner judged the Minnesota absentee-return instruction published by
PR #44 to be wrong (Mobile Loop card `mn-absentee-check`, 2026-11-03 03:30Z) and
asked for a correction taken only from official sources.

Result: every time in the published instruction matches both the Minnesota
Statutes and the Minnesota Secretary of State. Changing it would publish a wrong
deadline, so this branch leaves the instruction, the national table, the
downloads, `tests/frontend/minnesota-return.test.mjs` and the corrections record
as #44 published them. If a specific word is wrong, name it and it will be checked
against the same sources.

Published text (`content/refresh/content-package.json` → MN `mail_return.instruction`;
also in `content/refresh/fragments/states/mn.html`,
`content/refresh/fragments/voting-deadlines.html` and the voting CSV and refresh JSON
downloads):

> Updated Nov 2, 2026: An absentee ballot dropped off by the voter or another person
> must reach the issuing election office by 5 p.m. on Nov 3. Absentee ballots returned
> by mail, ballots returned through the separate agent-delivery process, and ballots
> from mail-ballot precincts must be received by 8 p.m. on Nov 3; a postmark alone is
> not sufficient. Confirm the return method and local instructions with the election
> authority.

| Fact as published | Minnesota Statutes (revisor.mn.gov, 2026 edition) | Minnesota Secretary of State | Tag |
| --- | --- | --- | --- |
| Voter returns in person: by 5 p.m. Nov 3 | 203B.08 subd. 1(a): "If delivered in person, the signature envelope must be submitted to the county auditor or municipal clerk by 5:00 p.m. on election day." | Return your ballot: "You may drop off your own ballot no later than 5 p.m. on Election Day." Oct 30 release: "November 3 at 5 p.m. - Deadline for absentee ballots returned in-person" | VERIFIED-2+ |
| Another person returns it in person: by 5 p.m. | 203B.08 subd. 1(b) lets a designated agent "deliver in person" (subd. 1(a) sets 5:00 p.m. for in-person delivery) | Return your ballot: "Return the ballot to the office that sent the ballot, during office hours, or by 5 p.m. on Election Day." | VERIFIED-2+ |
| Returned by mail: received by 8 p.m.; postmark not enough | 203B.08 subd. 3: "Signature envelopes received on election day after 8:00 p.m. shall be marked as received late" | Oct 30 release: "November 3 at 8 p.m. - Deadline for absentee ballots returned by mail". Return your ballot: "being postmarked before Election Day does not count." | VERIFIED-2+ |
| Agent-delivery process: by 8 p.m. | 203B.11 subd. 4: "The voted ballots must be returned to the county auditor or municipal clerk no later than 8:00 p.m. on election day." | Return your ballot: "If you are using the Agent Delivery process, the ballot can be returned as late as 8 p.m. on Election Day." | VERIFIED-2+ |
| Mail-ballot precincts: by 8 p.m. | 204B.45: "Any ballot received by 8:00 p.m. on the day of the election must be counted." | Return your ballot: "Ballots sent to voters this way may be dropped off at the election office as late as 8 p.m. on Election Day." | VERIFIED-2+ |

## Sources (opened 2026-11-03, 03:34–03:37 UTC)

- Minn. Stat. 203B.08, https://www.revisor.mn.gov/statutes/cite/203B.08 (HTTP 200, 03:34Z)
- Minn. Stat. 203B.11, https://www.revisor.mn.gov/statutes/cite/203B.11 (HTTP 200, 03:34Z)
- Minn. Stat. 203B.082 (drop boxes; no separate deadline), https://www.revisor.mn.gov/statutes/cite/203B.082 (HTTP 200, 03:34Z)
- Minn. Stat. 204B.45, https://www.revisor.mn.gov/statutes/cite/204B.45 (HTTP 200, 03:35Z)
- Minnesota Secretary of State, Return your ballot,
  https://www.sos.mn.gov/elections-voting/other-ways-to-vote/return-your-ballot/
  (opened in a browser at about 03:35Z; automated clients get a captcha)
- Minnesota Secretary of State, "728,961 Ballots Accepted in First Six Weeks of Voting
  for November 3 Election" (October 30 release),
  https://sos.mn.gov/about-the-office/news-room/728-961-ballots-accepted-in-first-six-weeks-of-voting-for-november-3-election/
  (opened in a browser at about 03:36Z)

The statute and the Secretary of State are independent publishers, so each fact is
VERIFIED-2+.
