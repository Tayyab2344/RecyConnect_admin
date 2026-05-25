import { readString } from "./utils";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://recyconnect-backend.onrender.com/api";

export async function fetchJson(path: string, token: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readString(json?.message, `Request failed: ${response.status}`));
  return json;
}

export async function postJson(path: string, token: string, body: unknown) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readString(json?.message, `Request failed: ${response.status}`));
  return json;
}

export async function putJson(path: string, token: string, body: unknown) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readString(json?.message, `Request failed: ${response.status}`));
  return json;
}


export async function deleteJson(path: string, token: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readString(json?.message, `Request failed: ${response.status}`));
  return json;
}
