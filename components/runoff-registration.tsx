import { refresh } from '@/lib/refresh';
import { runoffRegistrationText } from '@/lib/runoff-registration.mjs';
export function RunoffRegistration({ state }: { state: string }) {
  const runoff = refresh.conditional_runoffs.find(row => row.state === state);
  if (!runoff) return null;
  return <div className="refresh-content"><p><strong>Runoff registration.</strong> {runoffRegistrationText(runoff)}</p></div>;
}
