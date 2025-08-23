import { postJson } from "../lib/http";
import type { IncidentCreateReq, IncidentCreateRes } from "../../../shared/contracts/incidents";

const API_PREFIX = "/api/v1";

export async function createIncident(payload: IncidentCreateReq): Promise<string> {
  const data = await postJson<IncidentCreateReq, IncidentCreateRes>(`${API_PREFIX}/incidents`, payload);
  return data.id; // single, typed source of truth
}

export async function clearDraft(): Promise<void> {
  try {
    await fetch(`${API_PREFIX}/incidents/draft`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch (error) {
    // Fire-and-forget - don't throw on failure
    console.warn("[INCIDENTS] Failed to clear server draft:", error);
  }
}