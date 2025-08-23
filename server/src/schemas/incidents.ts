import { z } from "zod";

export const IncidentCreateReqSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"), 
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  regulatoryRequired: z.boolean().optional().default(false),
  equipmentId: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  location: z.string().optional(),
  incidentDateTime: z.string().optional(),
  immediateActions: z.string().optional(),
  safetyImplications: z.string().optional(),
  operatingParameters: z.string().optional(),
  equipment_group_id: z.number().int().optional(),
  equipment_type_id: z.number().int().optional(),
  equipment_subtype_id: z.number().int().optional(),
  reportableStatus: z.string().optional(),
  intendedRegulatoryAuthority: z.string().optional(),
}).strict();

export const IncidentCreateResSchema = z.object({
  id: z.string().min(1),
});