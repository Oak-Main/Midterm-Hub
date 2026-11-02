"use client";

import type { ChangeEvent } from "react";

// Moves focus to a table row whose id is `${prefix}${code}`; without scripts the
// rows stay reachable by their #fragment links.
export function JumpToState({ options, prefix, label }: { options: [code: string, name: string][]; prefix: string; label: string }) {
  function jump(event: ChangeEvent<HTMLSelectElement>) {
    const row = document.getElementById(prefix + event.target.value);
    if (!row) return;
    // Bring the scrolling table into view first, then the row inside it.
    row.closest(".table-wrap")?.scrollIntoView({ block: "start" });
    row.scrollIntoView({ block: "nearest" });
    row.focus({ preventScroll: true });
    history.replaceState(null, "", `#${row.id}`);
  }
  return (
    <div className="controls">
      <label htmlFor={`${prefix}jump`}>{label}</label>
      <select id={`${prefix}jump`} defaultValue="" onChange={jump} className="min-h-11 w-[min(100%,32rem)] border bg-card px-3">
        <option value="" disabled>Choose a state</option>
        {[...options].sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => <option key={code} value={code.toLowerCase()}>{name}</option>)}
      </select>
    </div>
  );
}
