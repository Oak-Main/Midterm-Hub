import Link from 'next/link';
import { officialResults, pollClose } from '@/lib/election-night-data';

// Visible FAQ text for the Election Day answer-led wave (no FAQPage schema yet —
// text first; schema polish is a deliberate cut if the deadline tightens).
// Facts come from content/election-night/poll-close-2026.json and
// official-results.json; this site links official results pages and never
// publishes vote counts or calls races.

const closeRowFor = (code: string) => pollClose.rows.find(row => row.state === code.toUpperCase());
const resultsRowFor = (code: string) => officialResults.rows.find(row => row.state === code.toUpperCase());

const closeAnswer = (code: string): string => {
  const row = closeRowFor(code);
  if (!row) return 'Closing times vary by state and sometimes by county.';
  if (row.tag === 'UNVERIFIED' || row.closes.length === 0) return `${row.name} closing times vary by locality; check the ${row.name} election office.`;
  return row.closes.length === 1
    ? `${row.name} polls close ${row.closes[0].et}.`
    : `${row.name} polls close ${row.closes.map(close => `${close.et} (${close.area.toLowerCase()})`).join('; ')}.`;
};

export function ElectionDayFaq({ state }: { state?: string }) {
  const code = state?.toUpperCase();
  const row = code ? closeRowFor(code) : undefined;
  const results = code ? resultsRowFor(code) : undefined;
  const name = row?.name ?? results?.name ?? '';
  const authorityShort = results ? results.authority.split('(')[0].trim() : 'state election authority';
  const items = code
    ? [
      { q: 'When is Election Day 2026?', a: <>Election Day is <strong>Tuesday, November 3, 2026</strong> — the general election in {name} is held that day.</> },
      { q: `What time do polls close in ${name}?`, a: <>{closeAnswer(code)}</> },
      { q: `Where are ${name} 2026 results?`, a: <>The {authorityShort} publishes official results. <Link className="editorial-link font-bold" href={`/results/${code.toLowerCase()}/`}>{name} poll-closing times and the official results page →</Link> This site does not publish vote counts or call races.</> },
    ]
    : [
      { q: 'When is Election Day 2026?', a: <>Election Day is <strong>Tuesday, November 3, 2026</strong>. Every state holds its general election that day.</> },
      { q: 'What time do polls close?', a: <>Polls close in waves from <strong>6 PM ET</strong> (Indiana and Kentucky) to midnight ET (Alaska and Hawaii), with county-level variation inside several states. The full <Link className="editorial-link font-bold" href="/results/">poll-closing schedule →</Link></> },
      { q: 'Where are 2026 results?', a: <>Each state’s election authority posts official results. Midterm Watch links every state’s results page and closing time; it does not publish vote counts or call races. <Link className="editorial-link font-bold" href="/results/">Results status for all 50 states and DC →</Link></> },
    ];
  return <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><p className="rule-label">Election Day questions</p><h2 className="mt-3 font-serif text-4xl font-bold">Common questions, answered first</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{items.map(item => <section key={item.q} className="border bg-card p-6"><h3 className="font-serif text-2xl">{item.q}</h3><p className="mt-3 text-muted-foreground">{item.a}</p></section>)}</div></section>;
}
