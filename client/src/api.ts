/**
 * UNIVERSAL API CLIENT - ZERO HARDCODING ENFORCEMENT
 * All network calls must go through this client
 */

export async function api(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api${path}`, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(await res.text());
  return res;
}

// Convenience methods
export async function apiGet(path: string): Promise<Response> {
  return api(path, { method: 'GET' });
}

export async function apiPost(path: string, data?: any): Promise<Response> {
  return api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  });
}

export async function apiPut(path: string, data?: any): Promise<Response> {
  return api(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  });
}

export async function apiDelete(path: string): Promise<Response> {
  return api(path, { method: 'DELETE' });
}