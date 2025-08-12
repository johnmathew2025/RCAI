/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: questionnaire-engine.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 */
// ISO 14224 Questionnaire Engine for Dynamic Evidence Collection
import { ISO14224_TAXONOMY, type EquipmentTaxonomy, type EquipmentSubcategory } from "@shared/iso14224-taxonomy";

export interface QuestionnaireQuestion {
  id: string;
  phase: string;
  section: string;
  text: string;
  type: 'text' | 'textarea' | 'select' | 'multi_select' | 'number' | 'date' | 'datetime' | 'boolean' | 'file_upload';
  options?: string[];
  unit?: string;
  required: boolean;
  conditional?: {
    dependsOn: string;
    values: string[];
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string;
  };
  helpText?: string;
  evidenceType: 'required' | 'supporting' | 'optional';
}

export interface QuestionnairePhase {
  id: string;
  name: string;
  title: string;
  description: string;
  order: number;
  sections: QuestionnaireSection[];
  completionCriteria: string[];
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description: string;
  questions: QuestionnaireQuestion[];
}

// Core Evidence Collection Phases (based on your requirements)
export const EVIDENCE_COLLECTION_PHASES: QuestionnairePhase[] = [
  {
    id: "general_information",
    name: "General Information", 
    title: "Equipment & Event Details",
    description: "Basic information about the equipment and failure event",
    order: 1,
    sections: [
      {
        id: "asset_identification",
        title: "Asset Identification",
        description: "Equipment identification and classification",
        questions: [
          {
            id: "equipment_tag",
            phase: "general_information",
            section: "asset_identification",
            text: "Equipment Tag/ID",
            type: "text",
            required: true,
            evidenceType: "required",
            helpText: "Unique identifier for the equipment (e.g., P-101, V-205)"
          },
          {
            id: "equipment_category",
            phase: "general_information", 
            section: "asset_identification",
            text: "Equipment Category",
            type: "select",
            options: ["rotating", "static", "electrical", "instrumentation", "support"],
            required: true,
            evidenceType: "required",
            helpText: "Primary equipment classification per ISO 14224"
          },
          {
            id: "equipment_subcategory",
            phase: "general_information",
            section: "asset_identification", 
            text: "Equipment Subcategory",
            type: "select",
            options: [], // Will be populated dynamically based on category
            required: true,
            evidenceType: "required",
            conditional: {
              dependsOn: "equipment_category",
              values: ["rotating", "static", "electrical", "instrumentation", "support"],
              operator: "contains"
            }
          },
          {
            id: "equipment_type",
            phase: "general_information",
            section: "asset_identification",
            text: "Specific Equipment Type",
            type: "select", 
            options: [], // Will be populated dynamically based on subcategory
            required: true,
            evidenceType: "required",
            conditional: {
              dependsOn: "equipment_subcategory",
              values: [], // Dynamic based on taxonomy
              operator: "contains"
            }
          },
          {
            id: "manufacturer",
            phase: "general_information",
            section: "asset_identification",
            text: "Manufacturer",
            type: "text",
            required: false,
            evidenceType: "supporting"
          },
          {
            id: "model_serial",
            phase: "general_information", 
            section: "asset_identification",
            text: "Model/Serial Number",
            type: "text",
            required: false,
            evidenceType: "supporting"
          },
          {
            id: "installation_year",
            phase: "general_information",
            section: "asset_identification", 
            text: "Year of Installation",
            type: "number",
            required: false,
            evidenceType: "supporting",
            validation: { min: 1900, max: new Date().getFullYear() }
          }
        ]
      },
      {
        id: "location_hierarchy",
        title: "Location & Asset Hierarchy",
        description: "Physical location and system hierarchy",
        questions: [
          {
            id: "site",
            phase: "general_information",
            section: "location_hierarchy",
            text: "Site/Facility",
            type: "text",
            required: true,
            evidenceType: "required"
          },
          {
            id: "process_unit",
            phase: "general_information",
            section: "location_hierarchy", 
            text: "Process Unit/Area",
            type: "text",
            required: true,
            evidenceType: "required"
          },
          {
            id: "system",
            phase: "general_information",
            section: "location_hierarchy",
            text: "System/Line",
            type: "text", 
            required: false,
            evidenceType: "supporting"
          },
          {
            id: "parent_equipment",
            phase: "general_information",
            section: "location_hierarchy",
            text: "Parent/Associated Equipment",
            type: "text",
            required: false,
            evidenceType: "optional"
          }
        ]
      }
    ],
    completionCriteria: ["equipment_tag", "equipment_category", "equipment_subcategory", "equipment_type", "site", "process_unit"]
  },
  
  {
    id: "failure_event_details",
    name: "Failure/Event Details",
    title: "Failure Event Information", 
    description: "When, how, and under what conditions the failure occurred",
    order: 2,
    sections: [
      {
        id: "event_timeline",
        title: "Event Timeline",
        description: "When and how the failure was detected",
        questions: [
          {
            id: "event_datetime",
            phase: "failure_event_details",
            section: "event_timeline",
            text: "Date & Time of Event",
            type: "datetime",
            required: true,
            evidenceType: "required"
          },
          {
            id: "detected_by",
            phase: "failure_event_details", 
            section: "event_timeline",
            text: "Who Detected the Problem",
            type: "select",
            options: ["operator", "technician", "engineer", "system_alarm", "routine_inspection", "other"],
            required: true,
            evidenceType: "required"
          },
          {
            id: "detection_method",
            phase: "failure_event_details",
            section: "event_timeline", 
            text: "How was the Problem First Noticed",
            type: "select",
            options: ["alarm", "inspection", "operator_report", "abnormal_reading", "visual_observation", "audible_indication", "vibration", "other"],
            required: true,
            evidenceType: "required"
          },
          {
            id: "operating_mode",
            phase: "failure_event_details",
            section: "event_timeline",
            text: "Operating Mode at Time of Event", 
            type: "select",
            options: ["normal_operation", "startup", "shutdown", "standby", "maintenance", "testing", "emergency", "unknown"],
            required: true,
            evidenceType: "required"
          }
        ]
      },
      {
        id: "environmental_conditions",
        title: "Environmental Conditions",
        description: "Environmental factors at time of failure",
        questions: [
          {
            id: "ambient_temperature",
            phase: "failure_event_details",
            section: "environmental_conditions",
            text: "Ambient Temperature",
            type: "number",
            unit: "°C",
            required: false,
            evidenceType: "supporting"
          },
          {
            id: "humidity", 
            phase: "failure_event_details",
            section: "environmental_conditions",
            text: "Relative Humidity",
            type: "number",
            unit: "%",
            required: false,
            evidenceType: "supporting",
            validation: { min: 0, max: 100 }
          },
          {
            id: "weather_conditions",
            phase: "failure_event_details",
            section: "environmental_conditions",
            text: "Weather Conditions",
            type: "select",
            options: ["normal", "rain", "snow", "high_wind", "extreme_temperature", "storm", "other"],
            required: false,
            evidenceType: "optional"
          },
          {
            id: "corrosive_environment",
            phase: "failure_event_details",
            section: "environmental_conditions",
            text: "Corrosive/Dusty Environment",
            type: "boolean",
            required: false,
            evidenceType: "supporting"
          }
        ]
      }
    ],
    completionCriteria: ["event_datetime", "detected_by", "detection_method", "operating_mode"]
  },
  
  {
    id: "symptoms_evidence", 
    name: "Symptoms & Evidence",
    title: "Problem Symptoms & Physical Evidence",
    description: "Detailed description of observed symptoms and available evidence",
    order: 3,
    sections: [
      {
        id: "problem_description",
        title: "Problem Description", 
        description: "Detailed failure symptoms and characteristics",
        questions: [
          {
            id: "failure_description",
            phase: "symptoms_evidence",
            section: "problem_description",
            text: "Describe the Problem/Failure in Detail",
            type: "textarea",
            required: true,
            evidenceType: "required",
            helpText: "Provide comprehensive description of what was observed, heard, felt, or measured"
          },
          {
            id: "symptom_location",
            phase: "symptoms_evidence",
            section: "problem_description",
            text: "Where is the Symptom Located",
            type: "text", 
            required: false,
            evidenceType: "supporting",
            helpText: "Specific component or area where problem is observed (e.g., valve seat, pump seal, motor bearing)"
          },
          {
            id: "problem_pattern",
            phase: "symptoms_evidence",
            section: "problem_description",
            text: "Problem Pattern",
            type: "select",
            options: ["constant", "intermittent", "recurring", "progressive_worsening", "sudden", "cyclic"],
            required: true,
            evidenceType: "required"
          },
          {
            id: "alarms_trips",
            phase: "symptoms_evidence",
            section: "problem_description", 
            text: "Alarms or Trips Triggered",
            type: "textarea",
            required: false,
            evidenceType: "supporting",
            helpText: "List any alarms, trips, or interlocks that activated with timestamps if available"
          }
        ]
      },
      {
        id: "measurements_readings",
        title: "Abnormal Measurements & Readings",
        description: "Process parameters and instrument readings",
        questions: [
          {
            id: "abnormal_readings",
            phase: "symptoms_evidence", 
            section: "measurements_readings",
            text: "Any Abnormal Readings or Parameters",
            type: "textarea",
            required: false,
            evidenceType: "supporting",
            helpText: "Include pressure, temperature, flow, current, vibration, etc. with values and units"
          },
          {
            id: "safety_environmental_impact",
            phase: "symptoms_evidence",
            section: "measurements_readings",
            text: "Safety or Environmental Impact",
            type: "select",
            options: ["none", "minor", "moderate", "significant", "critical"],
            required: true,
            evidenceType: "required"
          }
        ]
      },
      {
        id: "supporting_evidence",
        title: "Supporting Evidence & Documentation",
        description: "Photos, documents, and additional evidence",
        questions: [
          {
            id: "photographs_available",
            phase: "symptoms_evidence",
            section: "supporting_evidence",
            text: "Are Photographs or Videos Available",
            type: "boolean", 
            required: false,
            evidenceType: "optional"
          },
          {
            id: "supporting_documents",
            phase: "symptoms_evidence",
            section: "supporting_evidence", 
            text: "Upload Supporting Documents/Photos",
            type: "file_upload",
            required: false,
            evidenceType: "optional",
            helpText: "Upload relevant photos, reports, test results, or other documentation"
          }
        ]
      }
    ],
    completionCriteria: ["failure_description", "problem_pattern", "safety_environmental_impact"]
  }
];

export class QuestionnaireEngine {
  private taxonomy: EquipmentTaxonomy[];
  
  constructor() {
    this.taxonomy = ISO14224_TAXONOMY;
  }

  // Get dynamic options for equipment subcategory based on selected category
  getSubcategoryOptions(category: string): string[] {
    const categoryData = this.taxonomy.find(t => t.category.toLowerCase().replace(' ', '_') === category);
    return categoryData?.subcategories.map(s => s.id) || [];
  }

  // Get dynamic options for equipment type based on selected subcategory  
  getEquipmentTypeOptions(subcategory: string): string[] {
    for (const category of this.taxonomy) {
      const subcat = category.subcategories.find(s => s.id === subcategory);
      if (subcat) {
        return subcat.types;
      }
    }
    return [];
  }

  // Get equipment-specific parameters for dynamic questions
  getEquipmentSpecificParameters(subcategory: string): any[] {
    for (const category of this.taxonomy) {
      const subcat = category.subcategories.find(s => s.id === subcategory);
      if (subcat) {
        return subcat.specificParameters;
      }
    }
    return [];
  }

  // Validate that all required evidence is collected
  validateEvidenceCompleteness(answers: Record<string, any>): { 
    isComplete: boolean; 
    missingRequired: string[];
    missingSupporting: string[];
  } {
    const missingRequired: string[] = [];
    const missingSupporting: string[] = [];

    // Check each phase for completion
    for (const phase of EVIDENCE_COLLECTION_PHASES) {
      for (const criterion of phase.completionCriteria) {
        if (!answers[criterion] || answers[criterion] === '') {
          missingRequired.push(criterion);
        }
      }
      
      // Check supporting evidence
      for (const section of phase.sections) {
        for (const question of section.questions) {
          if (question.evidenceType === 'supporting' && (!answers[question.id] || answers[question.id] === '')) {
            missingSupporting.push(question.id);
          }
        }
      }
    }

    return {
      isComplete: missingRequired.length === 0,
      missingRequired,
      missingSupporting
    };
  }

  // Generate equipment-specific questions dynamically
  generateEquipmentSpecificQuestions(equipmentSubcategory: string): QuestionnaireQuestion[] {
    const parameters = this.getEquipmentSpecificParameters(equipmentSubcategory);
    
    return parameters.map(param => ({
      id: `equipment_specific_${param.id}`,
      phase: "equipment_specific",
      section: "operating_parameters",
      text: param.name,
      type: param.type as any,
      unit: param.unit,
      options: param.options,
      required: param.required,
      evidenceType: param.required ? 'required' : 'supporting',
      helpText: `Equipment-specific parameter for ${equipmentSubcategory}`
    }));
  }

  // Get all questions for a specific phase with conditional logic applied
  getQuestionsForPhase(phaseId: string, currentAnswers: Record<string, any> = {}): QuestionnaireQuestion[] {
    const phase = EVIDENCE_COLLECTION_PHASES.find(p => p.id === phaseId);
    if (!phase) return [];

    let allQuestions: QuestionnaireQuestion[] = [];
    
    for (const section of phase.sections) {
      for (const question of section.questions) {
        // Apply conditional logic
        if (question.conditional) {
          const dependentValue = currentAnswers[question.conditional.dependsOn];
          
          // Update dynamic options
          if (question.id === 'equipment_subcategory' && dependentValue) {
            question.options = this.getSubcategoryOptions(dependentValue);
          } else if (question.id === 'equipment_type' && dependentValue) {
            question.options = this.getEquipmentTypeOptions(dependentValue);
          }
          
          // Check if condition is met
          if (!this.evaluateCondition(question.conditional, currentAnswers)) {
            continue; // Skip this question
          }
        }
        
        allQuestions.push(question);
      }
    }

    // Add equipment-specific questions if equipment type is selected
    if (phaseId === 'equipment_specific' && currentAnswers.equipment_subcategory) {
      const specificQuestions = this.generateEquipmentSpecificQuestions(currentAnswers.equipment_subcategory);
      allQuestions = allQuestions.concat(specificQuestions);
    }

    return allQuestions;
  }

  private evaluateCondition(condition: any, answers: Record<string, any>): boolean {
    const value = answers[condition.dependsOn];
    
    switch (condition.operator) {
      case 'equals':
        return condition.values.includes(value);
      case 'not_equals':
        return !condition.values.includes(value);
      case 'contains':
        return value && condition.values.some((v: string) => value.includes(v));
      case 'not_contains':
        return value && !condition.values.some((v: string) => value.includes(v));
      default:
        return false;
    }
  }
}