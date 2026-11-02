export function registrationAction(state, today) {
  if (state.state === 'ND') return { days: null, label: 'North Dakota does not require voter registration', noRegistration: true };
  if (today > '2026-11-03') {
    const runoff = state.state === 'LA' ? ' Louisiana has separate registration dates for its December 12 election, including any required U.S. House contest.'
      : ['GA', 'MS'].includes(state.state) ? ' A December 1 runoff may be held for eligible contests; its registration and eligibility rules are separate.' : '';
    return { days: null, label: `This tile covers the November 3, 2026 election.${runoff} Consult the state guide and election authority for a later election.` };
  }
  const available = Object.entries(state.routes).filter(([, route]) => route.date && route.date >= today);
  const details = Object.entries(state.routes).map(([method, route]) => route.date ? `${method.replaceAll('_', ' ')}: ${route.date}${route.type ? ` (${route.type})` : ''}` : null).filter(Boolean).join('; ');
  const next = available.map(([, route]) => route.date).sort()[0];
  const days = next ? Math.round((Date.parse(next + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 86400000) : null;
  const action = next === today ? 'A registration route is dated today. This does not establish that a location is open; check its local hours and eligibility.'
    : next ? state.action : 'Ordinary dated registration routes have passed. Check the election authority for eligibility-specific exceptions.';
  const runoff = state.state === 'GA' ? ' A possible December 1 runoff has separate registration cutoffs: October 5 for state and local contests, November 2 for federal contests.'
    : state.state === 'MS' ? ' Registration for a possible December 1 runoff in eligible contests closes November 2.'
    : state.state === 'LA' ? ' A possible December 12 U.S. House election has separate registration dates.' : '';
  return { days, label: `${action} ${details}. See the state guide for required ID, eligibility and locations.${runoff}` };
}
