const displayDate = date => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
export function runoffRegistrationText(record) {
  if (record.registration_in_person_mail && record.registration_online) {
    return `Registration for this runoff: mail or in person by ${displayDate(record.registration_in_person_mail)}; online by ${displayDate(record.registration_online)}. Confirm method-specific postmark, receipt and eligibility rules in the linked authority’s instructions.`;
  }
  if (record.registration_note) return record.registration_note;
  return record.registration_date ? `Registration cutoff for this runoff: ${displayDate(record.registration_date)}. Confirm eligibility and method-specific rules with the election authority.` : 'Confirm runoff eligibility and registration with the election authority.';
}
