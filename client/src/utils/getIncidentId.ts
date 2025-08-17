import type { CreateIncidentResponse } from '@/../../shared/types';

// Defensive incident ID extraction from multiple possible response formats (NO HARDCODING)
export function getIncidentId(res: CreateIncidentResponse): string | undefined {
  const id =
    res?.incidentId ??
    res?.id ??
    res?.incident_id ??
    res?.data?.incidentId ??
    res?.data?.id ??
    res?.data?.incident_id;

  return id != null ? String(id) : undefined;
}