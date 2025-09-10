/**
 * API Client - Stable Response Envelope System
 * NO HARDCODING - Works with any provider/model combination
 */

export async function api(path: string, init: RequestInit = {}) {
  const r = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  if (r.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("unauthorized");
  }
  return r;
}

export type AITestOk = {
  ok: true;
  status: number;
  providerId: string;
  modelId: string;
  message?: string;
  meta?: Record<string, unknown>;
};

export type AITestErr = {
  ok: false;
  status: number;
  providerId?: string;
  modelId?: string;
  error: { code: string; type?: string; detail?: string };
};

export type AITestResp = AITestOk | AITestErr;

export async function postJSON<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as T;
  // If server somehow returned 2xx but ok=false, still treat as error at the caller
  return data;
}

/**
 * Map error codes to user-friendly messages (NO PROVIDER HARDCODING)
 */
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  invalid_api_key: "The API key is invalid or revoked.",
  model_not_found: "Model not available. Change the model or request access.",
  insufficient_quota: "Quota or billing limit reached for this provider.",
  rate_limit_exceeded: "Rate limit exceeded. Try again shortly.",
  network_error: "Network connection error. Please try again.",
  timeout: "Request timed out. Please try again.",
  server_error: "Server error occurred. Please try again later.",
};

/**
 * Handle AI test errors with friendly messages
 */
export function getErrorMessage(data: AITestErr): string {
  return (
    data.error?.detail ||
    ERROR_CODE_MESSAGES[data.error?.code] ||
    "AI test failed. See server logs for details."
  );
}