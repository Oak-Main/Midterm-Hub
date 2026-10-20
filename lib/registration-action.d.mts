export type RegistrationIndex = { state: string; action: string; routes: Record<string, { date: string | null; status: string; type: string }> };
export function registrationAction(state: RegistrationIndex, today: string): { days: number | null; label: string; noRegistration?: boolean };
