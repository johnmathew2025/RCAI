/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * 
 * DATABASE SCHEMA: Schema-driven operations only, NO hardcoded field names
 * NO HARDCODING: All table/field references must be dynamic from schema
 * STATE PERSISTENCE: evidenceResponses field stores evidence files (NOT evidenceFiles)
 * PROTOCOL: UNIVERSAL_PROTOCOL_STANDARD.md
 * DATE: January 26, 2025
 * LAST REVIEWED: January 26, 2025
 * EXCEPTIONS: None
 * 
 * CRITICAL SCHEMA COMPLIANCE:
 * - Table names: singular, lowercase, underscores
 * - Primary keys: id (UUID or serial integer)
 * - Foreign keys: <referenced_table>_id format
 * - NO nullable fields unless absolutely necessary
 * - Evidence files stored in evidenceResponses (jsonb field)
 */

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  decimal,
  date,
  serial,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Fault Reference Library table - Admin Only "Feature-to-Fault Library" / "RCA Knowledge Library"
export const faultReferenceLibrary = pgTable("fault_reference_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evidenceType: varchar("evidence_type", { length: 32 }).notNull(),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  matchingCriteria: text("matching_criteria").notNull(),
  probableFault: varchar("probable_fault", { length: 255 }).notNull(),
  confidence: integer("confidence").notNull(), // 0-100 range enforced in validation
  recommendations: text("recommendations"), // JSON array or comma-separated
  referenceStandard: varchar("reference_standard", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFaultReferenceLibrarySchema = createInsertSchema(faultReferenceLibrary)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    confidence: z.number().min(0).max(100),
    evidenceType: z.string().min(1).max(32),
    pattern: z.string().min(1).max(255),
    matchingCriteria: z.string().min(1),
    probableFault: z.string().min(1).max(255),
  });

export type InsertFaultReferenceLibrary = z.infer<typeof insertFaultReferenceLibrarySchema>;
export type FaultReferenceLibrary = typeof faultReferenceLibrary.$inferSelect;

// Evidence Items table - NEW SPECIFICATION-COMPLIANT TABLE (Text-only with proper FK relationships)
export const evidenceItems = pgTable("evidence_items", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`), // Using cuid() equivalent
  
  // UNIQUE KEY (required) - Equipment Code must be unique
  equipmentCode: text("equipment_code").notNull().unique(),
  
  // Foreign keys to lookup tables — store as TEXT ids (not ints/enums)
  groupId: text("group_id"), // FK -> equipment_groups.id (TEXT)
  typeId: text("type_id"), // FK -> equipment_types.id   (TEXT)
  subtypeId: text("subtype_id"), // FK -> equipment_subtypes.id (TEXT)
  riskId: text("risk_id"), // FK -> risk_rankings.id (TEXT, optional)
  
  // Denormalized display (text only; optional but handy for exports)
  equipmentGroup: text("equipment_group"),
  equipmentType: text("equipment_type"),
  equipmentSubtype: text("equipment_subtype"),
  
  // Library content (text-only)
  subtypeExample: text("subtype_example"),
  componentFailureMode: text("component_failure_mode"),
  failureCode: text("failure_code"),
  riskRankingLabel: text("risk_ranking_label"), // keep label text, even if riskId present
  requiredTrendData: text("required_trend_data"),
  investigatorQuestions: text("investigator_questions"),
  attachmentsRequired: text("attachments_required"),
  rootCauseLogic: text("root_cause_logic"),
  primaryRootCause: text("primary_root_cause"),
  contributingFactor: text("contributing_factor"),
  latentCause: text("latent_cause"),
  detectionGap: text("detection_gap"),
  confidenceLevel: text("confidence_level"),
  faultSignaturePattern: text("fault_signature_pattern"),
  applicableToOtherEquipment: text("applicable_to_other_equipment"),
  evidenceGapFlag: text("evidence_gap_flag"),
  eliminatedIfConfirmed: text("eliminated_if_confirmed"),
  whyItGetsEliminated: text("why_it_gets_eliminated"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LEGACY Evidence Library table - kept for backwards compatibility during migration
export const evidenceLibrary = pgTable("evidence_library", {
  id: serial("id").primaryKey(),
  // NORMALIZED FOREIGN KEY RELATIONSHIPS (NO HARDCODING) - nullable during transition
  equipmentGroupId: integer("equipment_group_id"), // FK to equipmentGroups (nullable during migration)
  equipmentTypeId: integer("equipment_type_id"), // FK to equipmentTypes (nullable during migration)
  equipmentSubtypeId: integer("equipment_subtype_id"), // FK to equipmentSubtypes (optional)
  
  // LEGACY FIELDS - maintained for import compatibility during transition
  equipmentGroup: varchar("equipment_group"), // Legacy field for CSV import mapping
  equipmentType: varchar("equipment_type"), // Legacy field for CSV import mapping
  subtype: varchar("subtype"), // Legacy field for CSV import mapping
  
  componentFailureMode: varchar("component_failure_mode").notNull(), // Component / Failure Mode
  equipmentCode: varchar("equipment_code").notNull(), // Equipment Code (not unique per specification)
  failureCode: varchar("failure_code").notNull().unique(), // Failure Code - UNIQUE IDENTIFIER for all user operations (Step 3)
  riskRankingId: integer("risk_ranking_id"), // FK to riskRankings (normalized)
  riskRanking: varchar("risk_ranking"), // Legacy field for import compatibility
  requiredTrendDataEvidence: text("required_trend_data_evidence"), // Required Trend Data / Evidence
  aiOrInvestigatorQuestions: text("ai_or_investigator_questions"), // AI or Investigator Questions
  attachmentsEvidenceRequired: text("attachments_evidence_required"), // Attachments / Evidence Required
  rootCauseLogic: text("root_cause_logic"), // Root Cause Logic
  
  // All Evidence Fields Must Be Text/String (Per Specification) - Admin Editable
  confidenceLevel: text("confidence_level"), // Text field - accepts any format - Admin configurable
  diagnosticValue: text("diagnostic_value"), // Text field - accepts any format - Admin configurable  
  industryRelevance: text("industry_relevance"), // Text field - accepts any format - Admin configurable
  evidencePriority: text("evidence_priority"), // TEXT FIELD - accepts ranges, comments, any format - Admin configurable
  timeToCollect: text("time_to_collect"), // Text field - accepts ranges like "1-2 days" - Admin configurable
  collectionCost: text("collection_cost"), // Text field - accepts any cost format - Admin configurable
  analysisComplexity: text("analysis_complexity"), // Text field - accepts any complexity description - Admin configurable
  seasonalFactor: text("seasonal_factor"), // Text field - accepts any seasonal description - Admin configurable
  relatedFailureModes: text("related_failure_modes"), // Comma-separated equipment codes - Admin editable
  prerequisiteEvidence: text("prerequisite_evidence"), // Evidence needed before this one - Admin editable
  followupActions: text("followup_actions"), // What to do after collecting this evidence - Admin editable
  industryBenchmark: text("industry_benchmark"), // Industry standards/benchmarks - Admin editable
  
  // Enriched Evidence Library Fields - from comprehensive CSV import (Universal Protocol Standard compliant)
  primaryRootCause: text("primary_root_cause"), // Primary Root Cause analysis
  contributingFactor: text("contributing_factor"), // Contributing factors
  latentCause: text("latent_cause"), // Latent cause analysis  
  detectionGap: text("detection_gap"), // Detection gap identification
  faultSignaturePattern: text("fault_signature_pattern"), // Fault signature patterns
  applicableToOtherEquipment: text("applicable_to_other_equipment"), // Applicability to other equipment
  evidenceGapFlag: text("evidence_gap_flag"), // Evidence gap flag
  eliminatedIfTheseFailuresConfirmed: text("eliminated_if_these_failures_confirmed"), // Elimination conditions
  whyItGetsEliminated: text("why_it_gets_eliminated"), // Elimination reasoning
  
  // BLANK COLUMNS REMOVED - STEP 1 COMPLIANCE CLEANUP
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// NEW Evidence Items schemas (specification-compliant)
export const insertEvidenceItemSchema = createInsertSchema(evidenceItems)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    equipmentCode: z.string().min(1, "Equipment Code is required"),
    // FK validation will be handled in the API layer
  });

export type InsertEvidenceItem = z.infer<typeof insertEvidenceItemSchema>;
export type EvidenceItem = typeof evidenceItems.$inferSelect;

// LEGACY schemas - kept for backwards compatibility
export const insertEvidenceLibrarySchema = createInsertSchema(evidenceLibrary).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export type InsertEvidenceLibrary = z.infer<typeof insertEvidenceLibrarySchema>;
export type EvidenceLibrary = typeof evidenceLibrary.$inferSelect;

// RCA Investigations table - supports both ECFA and Fault Tree Analysis
export const investigations = pgTable("investigations", {
  id: serial("id").primaryKey(),
  investigationId: varchar("investigation_id").unique().notNull(),
  
  // Mandatory Investigation Type Selection
  investigationType: varchar("investigation_type"), // 'safety_environmental' or 'equipment_failure'
  
  // Step 1: Problem Definition (Always Required)
  whatHappened: text("what_happened"),
  whereHappened: varchar("where_happened"),
  whenHappened: timestamp("when_happened"),
  consequence: text("consequence"),
  detectedBy: varchar("detected_by"),
  
  // Workflow Management
  currentStep: varchar("current_step").default("problem_definition"), // problem_definition, investigation_type, evidence_collection, analysis_ready, ai_processing, completed
  
  // Equipment Details (needed for analysis)
  equipmentGroup: varchar("equipment_group"),
  equipmentType: varchar("equipment_type"),
  equipmentSubtype: varchar("equipment_subtype"),
  symptoms: text("symptoms"),
  description: text("description"),
  
  // Evidence files and checklist
  evidenceFiles: jsonb("evidence_files"),
  evidenceChecklist: jsonb("evidence_checklist"),
  evidenceCategories: jsonb("evidence_categories"),
  operatingParameters: jsonb("operating_parameters"),
  
  // Evidence Collection Data (All 8 Sections for Fault Tree + ECFA sections)
  evidenceData: jsonb("evidence_data"), // Structured storage for all questionnaire responses
  evidenceCompleteness: decimal("evidence_completeness", { precision: 5, scale: 2 }).default("0.00"),
  evidenceValidated: boolean("evidence_validated").default(false),
  
  // Analysis Results - Contains complete RCA analysis output
  analysisResults: jsonb("analysis_results"), // Complete RCA analysis including root causes, recommendations, evidence gaps
  rootCauses: jsonb("root_causes"),
  contributingFactors: jsonb("contributing_factors"),
  recommendations: jsonb("recommendations"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  
  // File Attachments
  uploadedFiles: jsonb("uploaded_files"),
  supportingDocuments: jsonb("supporting_documents"),
  
  // Status and Workflow
  status: varchar("status").default("active"), // active, completed, archived
  
  // Audit Trail
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
  auditTrail: jsonb("audit_trail"),
});

// AI Settings for secure key management
export const aiSettings = pgTable("ai_settings", {
  id: serial("id").primaryKey(),
  provider: varchar("provider").notNull(), // Dynamic provider selection
  model: varchar("model").notNull(), // Dynamic model selection
  encryptedApiKey: text("encrypted_api_key").notNull(), // encrypted API key
  isActive: boolean("is_active").default(false),
  createdBy: integer("created_by"), // user who created this setting
  createdAt: timestamp("created_at").defaultNow(),
  lastTestedAt: timestamp("last_tested_at"), // when API key was last tested
  testStatus: varchar("test_status"), // 'success', 'failed', 'not_tested'
}, (table) => ({
  // Prevent duplicate providers - UNIQUE constraint
  uniqueProvider: unique("unique_provider_per_user").on(table.provider, table.createdBy),
}));

export const insertInvestigationSchema = createInsertSchema(investigations);
export type InsertInvestigation = z.infer<typeof insertInvestigationSchema>;
export type Investigation = typeof investigations.$inferSelect;

export const insertAiSettingsSchema = createInsertSchema(aiSettings);
export type InsertAiSettings = z.infer<typeof insertAiSettingsSchema>;
export type AiSettings = typeof aiSettings.$inferSelect;

// Admin Library Update System (NEW - Step 8 Requirements)
export const libraryUpdateProposals = pgTable("library_update_proposals", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id"), // Link to incident that triggered the proposal
  proposalType: varchar("proposal_type").notNull(), // "new_fault_signature", "new_prompt_style", "pattern_enhancement"
  proposedData: jsonb("proposed_data").notNull(), // Structured proposal data
  aiReasoning: text("ai_reasoning"), // AI explanation for the proposal
  evidencePatterns: jsonb("evidence_patterns"), // New patterns detected
  adminStatus: varchar("admin_status").default("pending"), // "pending", "accepted", "rejected", "modified"
  adminComments: text("admin_comments"), // Admin feedback
  reviewedBy: varchar("reviewed_by"), // Admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLibraryUpdateProposalSchema = createInsertSchema(libraryUpdateProposals);
export type InsertLibraryUpdateProposal = z.infer<typeof insertLibraryUpdateProposalSchema>;
export type LibraryUpdateProposal = typeof libraryUpdateProposals.$inferSelect;

// Historical Learning Patterns (NEW - Step 9 Requirements)
export const historicalPatterns = pgTable("historical_patterns", {
  id: serial("id").primaryKey(),
  equipmentGroup: varchar("equipment_group").notNull(),
  equipmentType: varchar("equipment_type").notNull(),
  equipmentSubtype: varchar("equipment_subtype"),
  symptomPattern: text("symptom_pattern").notNull(), // Normalized symptom description
  rootCausePattern: text("root_cause_pattern").notNull(), // Confirmed root cause
  evidencePattern: jsonb("evidence_pattern"), // Evidence that confirmed the cause
  incidentContext: jsonb("incident_context"), // Operating conditions, timeline, etc.
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // Pattern confidence
  occurrenceCount: integer("occurrence_count").default(1), // How many times this pattern occurred
  lastOccurrence: timestamp("last_occurrence").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHistoricalPatternSchema = createInsertSchema(historicalPatterns);
export type InsertHistoricalPattern = z.infer<typeof insertHistoricalPatternSchema>;
export type HistoricalPattern = typeof historicalPatterns.$inferSelect;

// Equipment Groups table - Admin editable dropdown values  
export const equipmentGroups = pgTable("equipment_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEquipmentGroupSchema = createInsertSchema(equipmentGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEquipmentGroup = z.infer<typeof insertEquipmentGroupSchema>;
export type EquipmentGroup = typeof equipmentGroups.$inferSelect;

// Equipment Types table - Normalized equipment types linked to equipment groups
export const equipmentTypes = pgTable("equipment_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  equipmentGroupId: integer("equipment_group_id").notNull(),
  groupName: text("group_name"), // Denormalized group name for efficient listing
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEquipmentTypeSchema = createInsertSchema(equipmentTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEquipmentType = z.infer<typeof insertEquipmentTypeSchema>;
export type EquipmentType = typeof equipmentTypes.$inferSelect;

// Equipment Subtypes table - Normalized equipment subtypes linked to equipment types
export const equipmentSubtypes = pgTable("equipment_subtypes", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  equipmentTypeId: integer("equipment_type_id").notNull(),
  typeName: text("type_name"), // Denormalized type name for efficient listing
  groupName: text("group_name"), // Denormalized group name for efficient listing
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEquipmentSubtypeSchema = createInsertSchema(equipmentSubtypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEquipmentSubtype = z.infer<typeof insertEquipmentSubtypeSchema>;
export type EquipmentSubtype = typeof equipmentSubtypes.$inferSelect;

// Risk Rankings table - Admin editable dropdown values
export const riskRankings = pgTable("risk_rankings", {
  id: serial("id").primaryKey(),
  label: varchar("label").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRiskRankingSchema = createInsertSchema(riskRankings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRiskRanking = z.infer<typeof insertRiskRankingSchema>;
export type RiskRanking = typeof riskRankings.$inferSelect;

// Audit Log table - Track all mutations as required by specification
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action").notNull(), // 'create', 'update', 'delete', 'import'
  targetId: text("target_id").notNull(), // equipmentCode for evidence items
  tableName: varchar("table_name").notNull(), // 'evidence_items', 'equipment_groups', etc.
  metadata: jsonb("metadata"), // Contains the diff/changes made
  userId: varchar("user_id"), // User who made the change
  userRole: varchar("user_role"), // 'Viewer', 'Editor', 'Admin'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect;

// Incidents table - New RCA workflow starting point
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  equipmentGroup: varchar("equipment_group").notNull(),
  equipmentType: varchar("equipment_type").notNull(),
  equipmentSubtype: varchar("equipment_subtype"), // NEW: Three-level cascading dropdown system
  equipmentId: varchar("equipment_id").notNull(),
  location: varchar("location").notNull(),
  reportedBy: varchar("reported_by").notNull(),
  incidentDateTime: timestamp("incident_date_time").notNull(),
  priority: varchar("priority").notNull(),
  immediateActions: text("immediate_actions"),
  safetyImplications: text("safety_implications"),
  
  // Enhanced AI Context Fields (Step 1 - Initial Incident Reporting)
  operatingParameters: text("operating_parameters"), // Operating conditions at incident time
  issueFrequency: varchar("issue_frequency"), // First, Recurring, Unknown
  issueSeverity: varchar("issue_severity"), // Low, Medium, High, Critical
  initialContextualFactors: text("initial_contextual_factors"), // Recent maintenance, operational changes
  
  // Sequence of Events fields (NO HARDCODING - Universal RCA Instruction compliance)
  sequenceOfEvents: text("sequence_of_events"), // Chronological narrative of incident
  sequenceOfEventsFiles: jsonb("sequence_of_events_files"), // Uploaded supporting files (logs, DCS exports, timelines)
  
  // Regulatory/Compliance Impact fields (NO HARDCODING - Universal compliance approach)
  reportableStatus: varchar("reportable_status"), // "not_reportable" | "reported" | "not_yet_reported"
  regulatoryAuthorityName: varchar("regulatory_authority_name"), // If reported
  dateReported: timestamp("date_reported"), // If reported
  reportReferenceId: varchar("report_reference_id"), // If reported (optional)
  complianceImpactSummary: text("compliance_impact_summary"), // If reported
  plannedDateOfReporting: timestamp("planned_date_of_reporting"), // If not yet reported
  delayReason: text("delay_reason"), // If not yet reported
  intendedRegulatoryAuthority: varchar("intended_regulatory_authority"), // If not yet reported
  
  // Equipment selection & symptoms (Step 2)
  specificPart: varchar("specific_part"),
  symptomDescription: text("symptom_description"),
  operatingConditions: text("operating_conditions"),
  whenObserved: varchar("when_observed"),
  frequency: varchar("frequency"),
  severity: varchar("severity"),
  contextualFactors: text("contextual_factors"),
  equipmentLibraryId: integer("equipment_library_id"),
  
  // Structured Timeline Data (NEW)
  timelineData: jsonb("timeline_data"), // Universal + equipment-specific timeline questions
  
  // Evidence checklist & collection (Steps 3-5)
  evidenceChecklist: jsonb("evidence_checklist"), // AI-generated questions
  evidenceResponses: jsonb("evidence_responses"), // User answers & uploads
  evidenceCompleteness: decimal("evidence_completeness", { precision: 5, scale: 2 }), // Percentage
  
  // AI Analysis (Steps 6-7)
  aiAnalysis: jsonb("ai_analysis"), // Root causes, contributing factors, recommendations
  analysisConfidence: decimal("analysis_confidence", { precision: 5, scale: 2 }),
  
  // Engineer Review (Step 8)
  engineerReview: jsonb("engineer_review"), // Engineer review and approval data
  finalizedAt: timestamp("finalized_at"),
  finalizedBy: varchar("finalized_by"),
  
  // PSM Integration Fields (NEW - Step 7 RCA Output Requirements)
  phaReference: varchar("pha_reference"), // Process Hazard Analysis reference
  sisComplianceCheck: varchar("sis_compliance_check"), // IEC 61511 SIS compliance status
  mocReferences: text("moc_references"), // Management of Change references
  safetyDeviceFunctionalHistory: jsonb("safety_device_functional_history"), // Safety device history data
  
  // Enhanced Evidence Status Fields (NEW - Step 4 Requirements)
  evidenceStatus: jsonb("evidence_status"), // "Available", "Not Available", "Will Upload", "Unknown"
  criticalEvidenceGaps: jsonb("critical_evidence_gaps"), // AI-identified missing critical evidence
  lowConfidenceFlag: boolean("low_confidence_flag").default(false), // Triggers fallback RCA flow
  
  // Historical Learning Integration (NEW - Step 9)
  similarIncidentPatterns: jsonb("similar_incident_patterns"), // Links to similar historical incidents
  historicalLearningApplied: jsonb("historical_learning_applied"), // Patterns applied from previous RCAs
  
  // Workflow tracking
  currentStep: integer("current_step").default(1), // 1-8 step tracking
  workflowStatus: varchar("workflow_status").default("incident_reported"), // incident_reported, equipment_selected, evidence_collected, ai_analyzed, finalized
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentStep: true,
  workflowStatus: true,
});

// Legacy Analyses table for backward compatibility
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  investigationId: varchar("investigation_id"),
  filename: varchar("filename"),
  analysisType: varchar("analysis_type"),
  equipmentType: varchar("equipment_type"),
  equipmentSubtype: varchar("equipment_subtype"),
  site: varchar("site"),
  location: varchar("location"),
  priority: varchar("priority"),
  status: varchar("status").default("completed"),
  rootCause: text("root_cause"),
  contributingFactors: jsonb("contributing_factors"),
  recommendations: jsonb("recommendations"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analyses);
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

// ISO 14224 Equipment Taxonomy  
export const ISO14224_EQUIPMENT_TYPES = {
  rotating: {
    label: "Rotating Equipment",
    subcategories: {
      pumps: {
        label: "Pumps",
        types: ["Centrifugal Pump", "Positive Displacement Pump", "Reciprocating Pump", "Screw Pump", "Gear Pump"]
      },
      compressors: {
        label: "Compressors", 
        types: ["Centrifugal Compressor", "Reciprocating Compressor", "Screw Compressor", "Rotary Compressor"]
      },
      turbines: {
        label: "Turbines",
        types: ["Steam Turbine", "Gas Turbine", "Wind Turbine", "Hydraulic Turbine"]
      },
      motors: {
        label: "Motors",
        types: ["Electric Motor", "Hydraulic Motor", "Pneumatic Motor"]
      }
    }
  },
  static: {
    label: "Static Equipment",
    subcategories: {
      vessels: {
        label: "Pressure Vessels",
        types: ["Storage Tank", "Reactor", "Separator", "Distillation Column", "Heat Exchanger"]
      },
      heat_exchangers: {
        label: "Heat Exchangers",
        types: ["Shell & Tube", "Plate Heat Exchanger", "Air Cooler", "Condenser", "Reboiler"]
      },
      piping: {
        label: "Piping Systems",
        types: ["Process Piping", "Utility Piping", "Pipeline", "Manifold"]
      }
    }
  },
  electrical: {
    label: "Electrical Equipment",
    subcategories: {
      power_distribution: {
        label: "Power Distribution",
        types: ["Transformer", "Switchgear", "Motor Control Center", "Panel Board"]
      },
      protection: {
        label: "Protection Systems", 
        types: ["Circuit Breaker", "Relay", "Fuse", "Surge Protector"]
      }
    }
  },
  instrumentation: {
    label: "Instrumentation & Control",
    subcategories: {
      measurement: {
        label: "Measurement Devices",
        types: ["Pressure Transmitter", "Temperature Sensor", "Flow Meter", "Level Indicator"]
      },
      control: {
        label: "Control Systems",
        types: ["Control Valve", "PLC", "DCS", "Safety System"]
      }
    }
  },
  support: {
    label: "Support Systems",
    subcategories: {
      safety: {
        label: "Safety Systems",
        types: ["Fire Protection", "Gas Detection", "Emergency Shutdown", "Relief System"]
      },
      utilities: {
        label: "Utilities",
        types: ["Cooling Water", "Steam System", "Compressed Air", "Electrical Supply"]
      }
    }
  }
} as const;

// Export for backward compatibility
export const EQUIPMENT_TYPES = ISO14224_EQUIPMENT_TYPES;

// Equipment-specific parameter definitions
export const EQUIPMENT_PARAMETERS = {
  pumps: [
    { key: "suction_pressure", label: "Suction Pressure", unit: "bar", type: "number" },
    { key: "discharge_pressure", label: "Discharge Pressure", unit: "bar", type: "number" },
    { key: "flow_rate", label: "Flow Rate", unit: "m³/h", type: "number" },
    { key: "vibration_level", label: "Vibration Level", unit: "mm/s", type: "number" },
    { key: "temperature", label: "Temperature", unit: "°C", type: "number" },
    { key: "seal_condition", label: "Seal Condition", type: "select", options: ["Good", "Slight Leak", "Major Leak", "Failed"] },
    { key: "noise_level", label: "Noise Level", type: "select", options: ["Normal", "Slight Increase", "Loud", "Very Loud"] }
  ],
  motors: [
    { key: "current", label: "Current", unit: "A", type: "number" },
    { key: "voltage", label: "Voltage", unit: "V", type: "number" },
    { key: "temperature", label: "Temperature", unit: "°C", type: "number" },
    { key: "vibration", label: "Vibration", unit: "mm/s", type: "number" },
    { key: "load", label: "Load", unit: "%", type: "number" },
    { key: "insulation_resistance", label: "Insulation Resistance", unit: "MΩ", type: "number" }
  ],
  valves: [
    { key: "position", label: "Valve Position", unit: "%", type: "number" },
    { key: "actuator_pressure", label: "Actuator Pressure", unit: "bar", type: "number" },
    { key: "seat_leakage", label: "Seat Leakage", type: "select", options: ["None", "Slight", "Moderate", "Severe"] },
    { key: "packing_leakage", label: "Packing Leakage", type: "select", options: ["None", "Slight", "Moderate", "Severe"] },
    { key: "response_time", label: "Response Time", unit: "s", type: "number" }
  ]
} as const;

// Fault Tree Analysis Templates
export const FAULT_TREE_TEMPLATES = {
  pump_failure: {
    name: "Pump Failure Analysis",
    top_event: "Pump Failed to Operate",
    logic_gates: [
      {
        id: "OR1",
        type: "OR",
        description: "Pump failure modes",
        inputs: ["mechanical_failure", "electrical_failure", "process_conditions"]
      }
    ],
    basic_events: [
      { id: "mechanical_failure", description: "Mechanical component failure", probability: 0.1 },
      { id: "electrical_failure", description: "Electrical system failure", probability: 0.05 },
      { id: "process_conditions", description: "Adverse process conditions", probability: 0.15 }
    ]
  }
} as const;

// ECFA Framework Components
export const ECFA_COMPONENTS = {
  event_types: [
    "Personal Injury", "Environmental Release", "Fire/Explosion", "Property Damage", 
    "Process Safety Event", "Security Incident", "Near Miss"
  ],
  barrier_types: [
    "Prevention Barrier", "Protection Barrier", "Mitigation Barrier", 
    "Emergency Response Barrier", "Recovery Barrier"
  ],
  cause_categories: [
    "Human Factors", "Equipment/Technical", "Organizational", 
    "External Factors", "Latent Conditions"
  ]
} as const;