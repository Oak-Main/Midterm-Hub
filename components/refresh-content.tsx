'use client';

import type { FormEvent } from 'react';

// The HTML is authored, script-free content checked at import/build time. Search
// only changes visibility inside that static island, without fetching new data.
export function RefreshContent({ html }: { html: string }) {
  function filter(event: FormEvent<HTMLDivElement>) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.filter) return;
    const root = event.currentTarget;
    const table = root.querySelector<HTMLTableElement>('#' + input.dataset.filter);
    if (!table) return;
    const query = input.value.trim().toLowerCase();
    const exactState = /^[a-z]{2}$/.test(query);
    const exactDistrict = /^([a-z]{2})-?(\d+|al)$/.exec(query);
    const rows = Array.from(table.tBodies[0]?.rows ?? []);
    let shown = 0;
    for (const row of rows) {
      const first = row.cells[0]?.textContent?.trim().toLowerCase() ?? '';
      const match = !query || (exactDistrict ? first === `${exactDistrict[1]}-${exactDistrict[2]}`
        : exactState ? first.startsWith(query + '-') || first === query || first.includes(`(${query})`)
          : (row.textContent ?? '').toLowerCase().includes(query));
      row.hidden = !match;
      if (match) shown++;
    }
    const output = root.querySelector<HTMLOutputElement>('#' + input.dataset.filter + '-count');
    if (output) output.value = `${shown} of ${rows.length} shown`;
  }
  return <div className="refresh-content" onInput={filter} dangerouslySetInnerHTML={{ __html: html }} />;
}
