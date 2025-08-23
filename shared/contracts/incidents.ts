// Shared FE/BE contract
export interface IncidentCreateReq {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  regulatoryRequired?: boolean;
  equipmentId?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  incidentDateTime?: string;
  immediateActions?: string;
  safetyImplications?: string;
  operatingParameters?: string;
  equipment_group_id?: number;
  equipment_type_id?: number;
  equipment_subtype_id?: number;
  reportableStatus?: string;
  intendedRegulatoryAuthority?: string;
}

export interface IncidentCreateRes {
  id: string; // stable, may be "INC-..." or UUID; FE treats as opaque string
}