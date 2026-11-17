import type { RunoffRecord } from './runoff-registration.mjs';
export function icsEvents(text: string): { start: string; summary: string; description: string }[];
export function icsHasCurrentRunoffEvent(text: string, record: RunoffRecord): boolean;
export function decodeIcs(bytes: Buffer): string;
