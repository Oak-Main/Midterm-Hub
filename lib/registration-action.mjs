export function registrationAction(state, today) {
  if (state.state === 'ND') return { days: null, label: 'North Dakota does not require voter registration', noRegistration: true };
  if (today > '2026-11-03') return { days: null, label: 'This guide covers the November 3, 2026 election. Consult the election authority for a later election.' };
  const available = Object.entries(state.routes).filter(([, route]) => route.date && route.date >= today);
  const details = Object.entries(state.routes).map(([method, route]) => route.date ? `${method.replaceAll('_', ' ')}: ${route.date}${route.type ? ` (${route.type})` : ''}` : null).filter(Boolean).join('; ');
  const next = available.map(([, route]) => route.date).sort()[0];
  const days = next ? Math.round((Date.parse(next + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 86400000) : null;
  const action = next ? state.action : 'Ordinary dated registration routes have passed. Check the election authority for eligibility-specific exceptions.';
  return { days, label: `${action} ${details}. See the state guide for required ID, eligibility and locations.` };
}
