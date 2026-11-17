// Server-only check of the published voting .ics: the runoff desk links the
// calendar for a runoff only when the file holds that runoff's event and the
// event carries the record's current early-voting text. (The October 20 file's
// Georgia event still has the wording superseded on November 2.)

/** RFC 5545 unfolding and TEXT unescaping. Pass text decoded as UTF-8 after
 * unfolding at the byte level, or plain ASCII-safe text. */
export function icsEvents(text) {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  return unfolded.split(/BEGIN:VEVENT\r?\n/).slice(1).map(block => {
    const fields = {};
    for (const line of block.split(/\r?\n/)) {
      const at = line.indexOf(':');
      if (at > 0) fields[line.slice(0, at)] = line.slice(at + 1);
    }
    const description = (fields.DESCRIPTION ?? '').replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
    return { start: fields['DTSTART;VALUE=DATE'] ?? fields.DTSTART ?? '', summary: fields.SUMMARY ?? '', description };
  });
}

export function icsHasCurrentRunoffEvent(text, record) {
  const start = record.date.replaceAll('-', '');
  const event = icsEvents(text).find(item => item.start === start && item.summary.startsWith(`${record.state} `) && /runoff/i.test(item.summary));
  return Boolean(event && record.early_voting_note && event.description.includes(record.early_voting_note));
}

/** Decode an .ics file read as bytes: unfold first so a fold inside a multi-byte
 * character cannot corrupt it. */
export function decodeIcs(bytes) {
  const unfolded = Buffer.from(bytes.toString('latin1').replace(/\r?\n[ \t]/g, ''), 'latin1');
  return unfolded.toString('utf8');
}
