import type { ApiRecord } from "../types/admin";

export function readString(value: unknown, fallback = "N/A") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function unwrapArray(value: unknown): ApiRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is ApiRecord => typeof item === "object" && item !== null);
  if (typeof value === "object" && value !== null) {
    const data = (value as ApiRecord).data;
    if (Array.isArray(data)) return unwrapArray(data);
  }
  return [];
}

export function formatDate(val: unknown) {
  if (!val) return "N/A";
  try { return new Date(String(val)).toLocaleString(); } catch { return "N/A"; }
}
