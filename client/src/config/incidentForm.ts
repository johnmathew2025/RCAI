// Single source of truth for incident form configuration
// Non-negotiable rule: NO hardcoded values anywhere else

export const FORM_NAME_PREFIX = "incident-form";
export const LOCALSTORAGE_DRAFT_PREFIX = "incident:";
export const EDIT_PARAM = "id";

export const REACT_QUERY_KEYS = {
  incident: ["incident"],
  incidentDraft: ["incident-draft"]
} as const;

export const PERSIST_DRAFTS = false; // Default: no draft persistence in create mode

// Empty defaults only - no user text, no examples
export const DEFAULTS = {
  title: "",
  description: "",
  equipment_group_id: null,
  equipment_type_id: null,
  equipment_subtype_id: null,
  equipmentId: "",
  manufacturer: "",
  model: "",
  location: "",
  reportedBy: "",
  incidentDateTime: "",
  priority: "Medium" as const,
  immediateActions: "",
  safetyImplications: "",
  operatingParameters: "",
  issueFrequency: undefined,
  issueSeverity: undefined,
  initialContextualFactors: "",
  sequenceOfEvents: "",
  sequenceOfEventsFiles: [] as string[],
  reportableStatus: "not_reportable" as const,
  regulatoryAuthorityName: "",
  dateReported: "",
  reportReferenceId: "",
  complianceImpactSummary: "",
  plannedDateOfReporting: "",
  delayReason: "",
  intendedRegulatoryAuthority: "",
  timelineData: {} as Record<string, string>,
} as const;

export type IncidentFormDefaults = typeof DEFAULTS;