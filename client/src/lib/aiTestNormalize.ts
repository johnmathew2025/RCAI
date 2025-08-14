/**
 * AI Test Response Normalizer
 * Handles both legacy and new API shapes (NO HARDCODING, FUTURE-PROOF)
 */

export type AITestOk = {
  ok: true;
  status: number;
  providerId?: string;
  modelId?: string;
  message?: string;
  meta?: Record<string, unknown>;
};

export type AITestErr = {
  ok: false;
  status: number;
  providerId?: string;
  modelId?: string;
  error: { code?: string; type?: string; detail?: string };
};

export type AITestResp = AITestOk | AITestErr;

function toNumber(n: unknown, fallback = 200) {
  return typeof n === "number" ? n : fallback;
}

/**
 * Normalizes API responses from different formats:
 * 1) New: { ok, status, providerId, modelId, message, error }
 * 2) Legacy success: { success: true, message, ... }
 * 3) Legacy error: { success: false, error: { code, message } } or { error: "..."}
 */
export function normalizeAITest(resp: any): AITestResp {
  if (resp && typeof resp === "object") {
    // New envelope already
    if ("ok" in resp) {
      return resp.ok
        ? {
            ok: true,
            status: toNumber(resp.status, 200),
            providerId: resp.providerId,
            modelId: resp.modelId,
            message: resp.message,
            meta: resp.meta,
          }
        : {
            ok: false,
            status: toNumber(resp.status, 400),
            providerId: resp.providerId,
            modelId: resp.modelId,
            error:
              resp.error && typeof resp.error === "object"
                ? {
                    code: resp.error.code,
                    type: resp.error.type,
                    detail: resp.error.detail ?? resp.error.message,
                  }
                : { detail: String(resp.error ?? "Unknown error") },
          };
    }

    // Legacy success
    if (resp.success === true) {
      return {
        ok: true,
        status: 200,
        providerId: resp.provider || resp.providerId,
        modelId: resp.model || resp.modelId,
        message: resp.message,
      };
    }

    // Legacy error variations
    if (resp.success === false || "error" in resp) {
      const errObj =
        typeof resp.error === "object"
          ? resp.error
          : { detail: String(resp.error ?? resp.message ?? "Unknown error") };
      return {
        ok: false,
        status: toNumber(resp.status, 400),
        providerId: resp.provider || resp.providerId,
        modelId: resp.model || resp.modelId,
        error: {
          code: errObj.code,
          type: errObj.type,
          detail: errObj.detail ?? errObj.message,
        },
      };
    }
  }

  // Totally unexpected shape
  return { ok: false, status: 500, error: { detail: "Malformed response" } };
}

/**
 * Error code to user-friendly message mapping (NO PROVIDER HARDCODING)
 */
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  invalid_api_key: "The API key is invalid or revoked.",
  model_not_found: "Model is not available; select another or request access.",
  insufficient_quota: "Quota/billing limit reached for this provider.",
  rate_limit_exceeded: "Rate limit exceeded. Try again shortly.",
  network_error: "Network connection error. Please try again.",
  timeout: "Request timed out. Please try again.",
  server_error: "Server error occurred. Please try again later.",
};