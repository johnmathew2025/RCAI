/**
 * UNIVERSAL API CLIENT - ZERO HARDCODING ENFORCEMENT
 * All network calls must go through this client
 */

import { loadConfig } from "./config";

export async function api(path: string, init?: RequestInit): Promise<Response> {
  const { apiBase } = await loadConfig();
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${apiBase}${normalizedPath}`;
  
  console.log(`🌐 API call: ${init?.method || 'GET'} ${url}`);
  
  const response = await fetch(url, { cache: "no-store", ...init });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  return response;
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