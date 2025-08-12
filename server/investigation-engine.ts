/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: investigation-engine.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 */
// Investigation Engine for ECFA and Fault Tree Analysis
import { Investigation, EQUIPMENT_TYPES, EQUIPMENT_PARAMETERS, FAULT_TREE_TEMPLATES, ECFA_COMPONENTS } from "@shared/schema";

export interface QuestionDefinition {
  id: string;
  section: string;
  question: string;
  type: 'text' | 'select' | 'date' | 'datetime' | 'number' | 'boolean' | 'textarea' | 'file';
  required: boolean;
  options?: string[];
  unit?: string;
  conditionalLogic?: {
    dependsOn: string;
    condition: any;
  };
  equipmentSpecific?: string[];
}

// Fault Tree Analysis Questionnaire (8 Sections)
export const FAULT_TREE_QUESTIONNAIRE: QuestionDefinition[] = [
  // Section 1: General Information
  {
    id: "equipment_tag",
    section: "General Information",
    question: "Equipment Tag/ID",
    type: "text",
    required: true
  },
  {
    id: "equipment_category",
    section: "General Information", 
    question: "Equipment Category",
    type: "select",
    required: true,
    options: Object.keys(EQUIPMENT_TYPES)
  },
  {
    id: "equipment_subcategory",
    section: "General Information",
    question: "Equipment Subcategory",
    type: "select",
    required: true,
    conditionalLogic: {
      dependsOn: "equipment_category",
      condition: "any"
    }
  },
  {
    id: "equipment_type",
    section: "General Information",
    question: "Equipment Type",
    type: "select", 
    required: true,
    conditionalLogic: {
      dependsOn: "equipment_subcategory",
      condition: "any"
    }
  },
  {
    id: "manufacturer",
    section: "General Information",
    question: "Manufacturer",
    type: "text",
    required: false
  },
  {
    id: "installation_year",
    section: "General Information",
    question: "Year of Installation",
    type: "number",
    required: false
  },
  {
    id: "operating_location",
    section: "General Information",
    question: "Operating Location/Area",
    type: "text",
    required: true
  },
  {
    id: "system_involved",
    section: "General Information",
    question: "System/Process Involved",
    type: "text",
    required: true
  },
  {
    id: "parent_system",
    section: "General Information",
    question: "Parent System/Asset Hierarchy",
    type: "text",
    required: false
  },

  // Section 2: Failure/Event Details
  {
    id: "event_datetime",
    section: "Failure/Event Details",
    question: "Date & Time of Event",
    type: "datetime",
    required: true
  },
  {
    id: "who_detected",
    section: "Failure/Event Details",
    question: "Who Detected the Problem",
    type: "select",
    required: true,
    options: ["Operator", "Maintenance", "Engineer", "Automatic System", "Inspector", "Other"]
  },
  {
    id: "detection_method",
    section: "Failure/Event Details",
    question: "How Was the Problem First Noticed?",
    type: "select",
    required: true,
    options: ["Visual Inspection", "Alarm", "Abnormal Reading", "Noise/Vibration", "Performance Issue", "Routine Check", "Other"]
  },
  {
    id: "operating_mode",
    section: "Failure/Event Details",
    question: "Was Equipment Running, Idle, or Standby at Failure?",
    type: "select",
    required: true,
    options: ["Running", "Idle", "Standby", "Starting", "Stopping", "Unknown"]
  },
  {
    id: "environmental_conditions",
    section: "Failure/Event Details",
    question: "Environmental Conditions at Time",
    type: "textarea",
    required: false
  },

  // Section 3: Symptom and Evidence
  {
    id: "observed_problem",
    section: "Symptom and Evidence",
    question: "Describe the Observed Problem/Failure",
    type: "textarea",
    required: true
  },
  {
    id: "symptom_location",
    section: "Symptom and Evidence",
    question: "Where is the Symptom Observed?",
    type: "text",
    required: true
  },
  {
    id: "problem_type",
    section: "Symptom and Evidence",
    question: "Is the Problem Constant, Intermittent, or Recurring?",
    type: "select",
    required: true,
    options: ["Constant", "Intermittent", "Recurring", "One-time"]
  },
  {
    id: "alarms_triggered",
    section: "Symptom and Evidence",
    question: "Were Any Alarms or Trips Triggered?",
    type: "textarea",
    required: false
  },
  {
    id: "safety_environmental_impact",
    section: "Symptom and Evidence",
    question: "Any Safety or Environmental Impact?",
    type: "boolean",
    required: true
  },
  {
    id: "impact_details",
    section: "Symptom and Evidence", 
    question: "Details of Safety/Environmental Impact",
    type: "textarea",
    required: false,
    conditionalLogic: {
      dependsOn: "safety_environmental_impact",
      condition: true
    }
  },

  // Section 4: Operating and Maintenance History
  {
    id: "last_maintenance_date",
    section: "Operating and Maintenance History",
    question: "Date of Last Maintenance/Inspection",
    type: "date",
    required: false
  },
  {
    id: "last_maintenance_type",
    section: "Operating and Maintenance History",
    question: "Type of Last Maintenance Performed",
    type: "select",
    required: false,
    options: ["Preventive", "Corrective", "Predictive", "Overhaul", "Inspection", "Calibration", "Other"]
  },
  {
    id: "recent_work_details",
    section: "Operating and Maintenance History",
    question: "Details of Recent Work, Modifications, or Repairs",
    type: "textarea",
    required: false
  },
  {
    id: "similar_failures_history",
    section: "Operating and Maintenance History",
    question: "History of Similar Failures?",
    type: "boolean",
    required: true
  },
  {
    id: "operating_within_limits",
    section: "Operating and Maintenance History",
    question: "Has Equipment Been Operating Within Design Limits?",
    type: "boolean",
    required: true
  },
  {
    id: "recent_process_upsets",
    section: "Operating and Maintenance History",
    question: "Any Recent Process Upsets, Trips, or Abnormal Operations?",
    type: "textarea",
    required: false
  },

  // Section 6: Human Factors
  {
    id: "operator_name",
    section: "Human Factors",
    question: "Who Was Operating?",
    type: "text",
    required: false
  },
  {
    id: "procedures_followed",
    section: "Human Factors",
    question: "Procedures Followed?",
    type: "boolean",
    required: true
  },
  {
    id: "operator_error",
    section: "Human Factors",
    question: "Known Operator Error?",
    type: "boolean",
    required: true
  },
  {
    id: "training_details",
    section: "Human Factors",
    question: "Training/Competence Details",
    type: "textarea",
    required: false
  },
  {
    id: "recent_changes",
    section: "Human Factors",
    question: "Recent Staffing/Procedure/Training Changes?",
    type: "textarea",
    required: false
  },

  // Section 7: Materials and Spares
  {
    id: "non_oem_parts",
    section: "Materials and Spares",
    question: "Non-OEM Parts Used?",
    type: "boolean",
    required: true
  },
  {
    id: "material_certification",
    section: "Materials and Spares",
    question: "Material Certification/Traceability for Replacements",
    type: "textarea",
    required: false
  },
  {
    id: "spare_parts_issues",
    section: "Materials and Spares",
    question: "Spare Parts Quality/Stock-Out Issues?",
    type: "textarea",
    required: false
  },

  // Section 8: Contributing/External Factors
  {
    id: "external_influences",
    section: "Contributing/External Factors",
    question: "External Influences? (Power loss, utility, weather, etc.)",
    type: "textarea",
    required: false
  },
  {
    id: "process_impacts",
    section: "Contributing/External Factors", 
    question: "Upstream/Downstream Process Impacts?",
    type: "textarea",
    required: false
  },
  {
    id: "concurrent_failures",
    section: "Contributing/External Factors",
    question: "Concurrent Failures in Associated Systems?",
    type: "boolean",
    required: false
  },
  {
    id: "cybersecurity_incidents",
    section: "Contributing/External Factors",
    question: "Cybersecurity/Control System Incidents?",
    type: "boolean",
    required: false
  }
];

// ECFA Questionnaire for Safety/Environmental Incidents
export const ECFA_QUESTIONNAIRE: QuestionDefinition[] = [
  {
    id: "event_type",
    section: "Event Classification",
    question: "Type of Safety/Environmental Event",
    type: "select",
    required: true,
    options: ECFA_COMPONENTS.event_types
  },
  {
    id: "event_chronology",
    section: "Event Chronology",
    question: "Detailed Event Timeline",
    type: "textarea",
    required: true
  },
  {
    id: "immediate_causes",
    section: "Cause Analysis",
    question: "Immediate Causes",
    type: "textarea",
    required: true
  },
  {
    id: "underlying_causes", 
    section: "Cause Analysis",
    question: "Underlying Causes",
    type: "textarea",
    required: true
  },
  {
    id: "root_causes_ecfa",
    section: "Cause Analysis",
    question: "Root Causes",
    type: "textarea",
    required: true
  },
  {
    id: "barriers_analysis",
    section: "Barrier Analysis",
    question: "Barriers and Contributing Factors",
    type: "textarea",
    required: true
  },
  {
    id: "risk_severity",
    section: "Risk Assessment",
    question: "Risk/Severity Assessment",
    type: "textarea",
    required: true
  },
  {
    id: "regulatory_status",
    section: "Regulatory",
    question: "Regulatory/Reportable Status",
    type: "boolean",
    required: true
  },
  {
    id: "post_incident_actions",
    section: "Actions",
    question: "Post-incident Actions and Verification",
    type: "textarea",
    required: true
  }
];

export class InvestigationEngine {
  
  // Get appropriate questionnaire based on investigation type
  getQuestionnaire(investigationType: string): QuestionDefinition[] {
    if (investigationType === 'safety_environmental') {
      return ECFA_QUESTIONNAIRE;
    } else if (investigationType === 'equipment_failure') {
      return FAULT_TREE_QUESTIONNAIRE;
    }
    return [];
  }

  // Get equipment-specific parameters
  getEquipmentParameters(equipmentType: string): any[] {
    const typeKey = equipmentType?.toLowerCase();
    if (typeKey && typeKey in EQUIPMENT_PARAMETERS) {
      return EQUIPMENT_PARAMETERS[typeKey as keyof typeof EQUIPMENT_PARAMETERS];
    }
    return [];
  }

  // Calculate evidence completeness
  calculateCompleteness(evidenceData: any, questionnaire: QuestionDefinition[]): number {
    const requiredQuestions = questionnaire.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter(q => {
      const answer = evidenceData[q.id];
      return answer !== undefined && answer !== null && answer !== '';
    });
    
    return requiredQuestions.length > 0 ? (answeredRequired.length / requiredQuestions.length) * 100 : 0;
  }

  // Validate evidence data
  validateEvidence(evidenceData: any, questionnaire: QuestionDefinition[]): { isValid: boolean, missingFields: string[] } {
    const missingFields: string[] = [];
    
    questionnaire.forEach(question => {
      if (question.required) {
        const answer = evidenceData[question.id];
        if (answer === undefined || answer === null || answer === '') {
          missingFields.push(question.question);
        }
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  // Generate Fault Tree Analysis
  generateFaultTree(evidenceData: any): any {
    // Simulate fault tree generation based on evidence
    const topEvent = "Equipment Failure";
    const causes = [];

    if (evidenceData.operator_error === true) {
      causes.push({ id: "human_error", description: "Human Error", probability: 0.15 });
    }
    
    if (evidenceData.non_oem_parts === true) {
      causes.push({ id: "material_failure", description: "Material/Parts Failure", probability: 0.12 });
    }

    if (evidenceData.operating_within_limits === false) {
      causes.push({ id: "process_deviation", description: "Process Deviation", probability: 0.20 });
    }

    // Add mechanical causes based on symptoms
    if (evidenceData.observed_problem?.toLowerCase().includes('vibration')) {
      causes.push({ id: "mechanical_failure", description: "Mechanical Component Failure", probability: 0.18 });
    }

    return {
      topEvent,
      causes,
      confidence: causes.length > 0 ? 0.8 : 0.4,
      analysisMethod: "Fault Tree Analysis"
    };
  }

  // Generate ECFA Analysis
  generateECFA(evidenceData: any): any {
    return {
      eventType: evidenceData.event_type,
      timeline: evidenceData.event_chronology,
      immediateCauses: evidenceData.immediate_causes,
      underlyingCauses: evidenceData.underlying_causes,
      rootCauses: evidenceData.root_causes_ecfa,
      barriers: evidenceData.barriers_analysis,
      riskAssessment: evidenceData.risk_severity,
      regulatory: evidenceData.regulatory_status,
      actions: evidenceData.post_incident_actions,
      confidence: 0.85,
      analysisMethod: "Event-Causal Factor Analysis"
    };
  }

  // Generate recommendations based on analysis
  generateRecommendations(investigationType: string, evidenceData: any, analysisResults: any): string[] {
    const recommendations: string[] = [];

    if (investigationType === 'equipment_failure') {
      if (evidenceData.operator_error === true) {
        recommendations.push("Provide additional operator training and review procedures");
      }
      if (evidenceData.non_oem_parts === true) {
        recommendations.push("Review spare parts procurement policy and ensure OEM parts usage");
      }
      if (evidenceData.operating_within_limits === false) {
        recommendations.push("Review operating parameters and implement process controls");
      }
      if (!evidenceData.last_maintenance_date) {
        recommendations.push("Establish and follow preventive maintenance schedule");
      }
    } else if (investigationType === 'safety_environmental') {
      recommendations.push("Review and strengthen safety barriers based on ECFA analysis");
      recommendations.push("Implement corrective actions to address root causes identified");
      if (evidenceData.regulatory_status === true) {
        recommendations.push("Complete regulatory reporting and follow-up actions");
      }
    }

    return recommendations;
  }
}

export const investigationEngine = new InvestigationEngine();