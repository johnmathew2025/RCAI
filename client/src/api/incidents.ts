import { postJson } from "../lib/http";
import type { IncidentCreateReq, IncidentCreateRes } from "../../../shared/contracts/incidents";

const API_PREFIX = "/api/v1";

export async function createIncident(payload: IncidentCreateReq): Promise<string> {
  const data = await postJson<IncidentCreateReq, IncidentCreateRes>(`${API_PREFIX}/incidents`, payload);
  return data.id; // single, typed source of truth
}