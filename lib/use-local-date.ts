"use client";

import { useEffect, useState } from "react";
import { localCalendarDate } from "@/lib/calendar";

/** The visitor's device date (YYYY-MM-DD), or null on the static first paint:
 * the build date never stands in for it. Refreshes each minute and when the tab
 * becomes visible, as ElectionMasthead does. */
export function useLocalDate(): string | null {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setToday(localCalendarDate());
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return today;
}
