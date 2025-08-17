// Response types for incident creation (NO HARDCODING)
export type CreateIncidentResponse = {
  id?: number | string;
  incidentId?: number | string;
  incident_id?: number | string;
  data?: {
    id?: number | string;
    incidentId?: number | string;
    incident_id?: number | string;
  };
  success?: boolean;
};