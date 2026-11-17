const displayDate = date => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
const shortDate = date => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
const dayDate = date => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
const sentence = text => text.endsWith('.') ? text : `${text}.`;
const nextDay = date => new Date(Date.parse(date + 'T12:00:00Z') + 86_400_000).toISOString().slice(0, 10);

export function runoffRegistrationText(record) {
  if (record.registration_in_person_mail && record.registration_online) {
    return `Registration for this runoff: mail or in person by ${displayDate(record.registration_in_person_mail)}; online by ${displayDate(record.registration_online)}. Confirm method-specific postmark, receipt and eligibility rules in the linked authority’s instructions.`;
  }
  if (record.registration_note) return record.registration_note;
  return record.registration_date ? `Registration cutoff for this runoff: ${displayDate(record.registration_date)}. Confirm eligibility and method-specific rules with the election authority.` : 'Confirm runoff eligibility and registration with the election authority.';
}

/* Runoff desk status. Every function takes an ISO civil date (YYYY-MM-DD) from
 * localCalendarDate() in lib/calendar.ts, so the visitor's device date decides
 * the phase. A null date is the static first paint: no phase, no countdown and
 * no build-date fallback. */

export const RUNOFF_PHASES = ['registration_open', 'registration_closed', 'voting_open', 'no_voting_today', 'runoff_day', 'past'];

const routeFields = [
  ['registration_in_person_mail', 'Mail and in-person registration'],
  ['registration_online', 'Online registration'],
  ['registration_date', 'Registration'],
  ['registration_state_local', 'State and local runoff registration'],
  ['registration_federal', 'Federal runoff registration'],
];

/** Each dated registration route in a conditional_runoffs record. */
export function registrationRoutes(record) {
  return routeFields.filter(([key]) => record[key]).map(([key, label]) => ({
    key, label, date: record[key], system: key === 'registration_online' ? record.registration_online_system ?? null : null,
  }));
}

const windowNames = { early_voting: 'Early voting', advance_voting: 'Advance voting', in_person_absentee: 'In-person absentee voting' };
export const votingWindowName = record => windowNames[record.voting_window?.kind] ?? 'Early voting';

/** A record with officially listed contests is no longer phrased "if required". */
export const runoffConfirmed = record => Boolean(record.contests?.length);

/**
 * registration_open    a registration route closes on or after today
 * registration_closed  every route has closed and early/absentee voting has not
 *                      started (or the source gives no first day, as in Mississippi)
 * voting_open          a day inside the early-voting or in-person absentee window
 * no_voting_today      registration closed and no early voting today: a closed day
 *                      inside the window (Louisiana, Sunday Nov 29) or the days
 *                      between the window's last day and the runoff
 * runoff_day           today is the runoff date
 * past                 after the runoff date
 */
export function runoffPhase(record, today) {
  if (today > record.date) return 'past';
  if (today === record.date) return 'runoff_day';
  if (registrationRoutes(record).some(route => route.date >= today)) return 'registration_open';
  const window = record.voting_window;
  if (window) {
    if (today > window.last_day) return 'no_voting_today';
    if (window.first_day && today >= window.first_day) return window.closed_days?.includes(today) ? 'no_voting_today' : 'voting_open';
  }
  return 'registration_closed';
}

/** The earliest dated voter action on or after today: a registration route,
 * absentee request, the window's last day or the runoff itself. */
export function nextRunoffDeadline(record, today) {
  const dates = [...registrationRoutes(record).map(route => route.date), record.absentee_request_date, record.voting_window?.last_day, record.date];
  return dates.filter(date => date && date >= today).sort()[0] ?? null;
}

const latestRoute = record => registrationRoutes(record).map(route => route.date).sort().at(-1) ?? '';

/**
 * Order for the desk. A state with registration still open leads; then the
 * nearest deadline. Without a date (static first paint) the latest registration
 * route leads, which matches the dated order while any route is open, so the
 * cards do not reorder on hydration.
 */
export function sortRunoffs(records, today) {
  const keyed = records.map(record => today
    ? [runoffPhase(record, today) === 'registration_open' ? 0 : 1, nextRunoffDeadline(record, today) ?? '9999-12-31', record]
    : [0, '', record]);
  return keyed.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1])
    || (today ? 0 : latestRoute(b[2]).localeCompare(latestRoute(a[2])))
    || a[2].date.localeCompare(b[2].date) || a[2].state.localeCompare(b[2].state)).map(row => row[2]);
}

/** Runoffs the desk still shows. After the last runoff this is empty and the
 * home page falls back to its post-election masthead. */
export function activeRunoffs(records, today) {
  return sortRunoffs(today ? records.filter(record => runoffPhase(record, today) !== 'past') : records, today);
}

/** One status sentence for the card; null once the runoff has passed. */
export function runoffStatusLine(record, today) {
  if (!today) return runoffRegistrationText(record);
  const phase = runoffPhase(record, today);
  const window = record.voting_window;
  const name = votingWindowName(record);
  const runoffDay = runoffConfirmed(record) ? `Election day is ${dayDate(record.date)}.` : `Runoff day, where a contest requires one, is ${dayDate(record.date)}.`;
  switch (phase) {
    case 'registration_open': {
      const routes = registrationRoutes(record);
      const system = route => route.system ? ` (${route.system})` : '';
      return [
        ...routes.filter(route => route.date >= today).map(route => route.date === today
          ? `${route.label} closes today, ${shortDate(route.date)}${system(route)}.`
          : `${route.label} open through ${shortDate(route.date)}${system(route)}.`),
        ...routes.filter(route => route.date < today).map(route => `${route.label} closed ${shortDate(route.date)}.`),
      ].join(' ');
    }
    case 'registration_closed': {
      // A start the source qualifies (Georgia: "no later than") is left to the card's details.
      const next = !window ? '' : window.first_day === null
        ? ` ${name} ends ${window.last_day_time ? `at ${window.last_day_time} ` : ''}${dayDate(window.last_day)}.`
        : window.first_day_note ? '' : ` ${name} starts ${dayDate(window.first_day)}.`;
      return `Registration for this runoff has closed.${next}`;
    }
    case 'voting_open': {
      if (window.last_day_conflict) {
        const [a, b] = window.last_day_conflict;
        return `Registration has closed. ${name} is under way; official sources list ${shortDate(a)} or ${shortDate(b)} as the last day, so check your local election office.`;
      }
      const closed = (window.closed_days ?? []).filter(day => day > today);
      const time = window.last_day_time ? ` at ${window.last_day_time}` : '';
      const hours = window.hours ? `, ${window.hours}` : '';
      const pause = closed.length ? `; no ${name.toLowerCase()} ${closed.map(dayDate).join(' or ')}` : '';
      return sentence(`Registration has closed. ${name} runs through ${dayDate(window.last_day)}${time}${hours}${pause}`);
    }
    case 'no_voting_today': {
      if (today <= window.last_day) {
        let resume = nextDay(today);
        while (window.closed_days?.includes(resume)) resume = nextDay(resume);
        return `No ${name.toLowerCase()} today (${dayDate(today)}). It resumes ${dayDate(resume)} and runs through ${dayDate(window.last_day)}.`;
      }
      if (window.last_day_conflict) {
        const [a, b] = window.last_day_conflict;
        return `${name} has ended; official sources listed ${shortDate(a)} or ${shortDate(b)} as the last day. ${runoffDay}`;
      }
      return `${name} ended ${window.last_day_time ? `at ${window.last_day_time} ` : ''}${dayDate(window.last_day)}. ${runoffDay}`;
    }
    case 'runoff_day':
      return `${runoffConfirmed(record) ? 'Election day is today.' : 'Runoff day is today where a contest requires one.'} Polling hours: ${record.election_day_hours}.`;
    default:
      return null;
  }
}
