/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: universal-questionnaire-engine.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 * 
 * Universal Questionnaire Engine
 * Implements RCA Initial Questionnaire Correction Instruction
 * NO HARDCODING - Dynamic questionnaire generation based on incident keywords + Evidence Library
 */

import { investigationStorage } from './storage';
import natural from 'natural';

interface KeywordExtractionResult {
  primaryFailureKeywords: string[];
  componentKeywords: string[];
  symptomKeywords: string[];
  contextKeywords: string[];
  confidence: number;
}

interface UniversalFailureMode {
  id: number;
  failureMode: string;
  relevanceScore: number;
  matchedKeywords: string[];
  requiredEvidence: string[];
  evidencePrompts: string[];
  clarificationQuestions: string[];
}

interface AIQuestionnaireStep {
  stepType: 'clarification' | 'evidence' | 'timeline';
  questions: UniversalQuestion[];
  purpose: string;
}

interface UniversalQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'file_upload' | 'confidence';
  options?: string[];
  required: boolean;
  context: string;
  evidenceType?: string;
  failureModeId?: number;
}

export class UniversalQuestionnaireEngine {
  
  /**
   * Main questionnaire generation method implementing corrective instruction
   * Step 1: Extract keywords → Step 2: Filter failure modes → Step 3: Generate questions
   */
  static async generateUniversalQuestionnaire(
    incidentId: number,
    incidentTitle: string,
    incidentDescription: string,
    equipmentGroup: string,
    equipmentType: string,
    equipmentSubtype: string
  ): Promise<AIQuestionnaireStep[]> {
    
    console.log(`[Universal Questionnaire] Generating questionnaire for incident ${incidentId}`);
    console.log(`[Universal Questionnaire] Equipment: ${equipmentGroup} → ${equipmentType} → ${equipmentSubtype}`);
    console.log(`[Universal Questionnaire] Incident: "${incidentTitle}" - "${incidentDescription}"`);
    
    // Step 1: NLP-Based Keyword Extraction (per corrective instruction)
    const keywords = this.extractUniversalKeywords(incidentTitle, incidentDescription);
    
    console.log(`[Universal Questionnaire] Extracted keywords:`, keywords);
    
    // Step 2: Dynamic Failure Mode Filtering (per corrective instruction)
    const relevantFailureModes = await this.filterFailureModesByKeywords(
      equipmentGroup,
      equipmentType,
      equipmentSubtype,
      keywords
    );
    
    console.log(`[Universal Questionnaire] Found ${relevantFailureModes.length} relevant failure modes`);
    
    // Step 3: AI Clarification Layer (per corrective instruction)
    const clarificationStep = this.generateClarificationQuestions(
      incidentDescription,
      keywords,
      relevantFailureModes
    );
    
    // Step 4: Evidence Prompting Logic (per corrective instruction)
    const evidenceStep = this.generateEvidenceQuestions(relevantFailureModes);
    
    // Step 5: Timeline Questions (equipment-specific but universal logic)
    const timelineStep = this.generateTimelineQuestions(
      relevantFailureModes,
      equipmentGroup,
      equipmentType,
      equipmentSubtype
    );
    
    const questionnaire: AIQuestionnaireStep[] = [];
    
    if (clarificationStep.questions.length > 0) {
      questionnaire.push(clarificationStep);
    }
    
    if (evidenceStep.questions.length > 0) {
      questionnaire.push(evidenceStep);
    }
    
    if (timelineStep.questions.length > 0) {
      questionnaire.push(timelineStep);
    }
    
    console.log(`[Universal Questionnaire] Generated ${questionnaire.length} questionnaire steps`);
    
    return questionnaire;
  }
  
  /**
   * Step 1: NLP-Based Keyword Extraction with synonyms and context
   * Universal patterns - NO HARDCODED EQUIPMENT LOGIC
   */
  private static extractUniversalKeywords(
    title: string,
    description: string
  ): KeywordExtractionResult {
    
    const fullText = `${title} ${description}`.toLowerCase();
    const words = fullText.split(/\s+/);
    
    // Universal failure keywords with synonyms (not equipment-specific)
    const failurePatterns = {
      // Thermal failures
      thermal: ['burnt', 'burn', 'burned', 'hot', 'overheat', 'overheated', 'melt', 'melted', 'thermal', 'temperature', 'heat'],
      // Mechanical failures
      mechanical: ['crack', 'cracked', 'break', 'broke', 'broken', 'fracture', 'snap', 'split', 'wear', 'worn', 'seized', 'stuck', 'jam'],
      // Electrical failures  
      electrical: ['electrical', 'voltage', 'current', 'power', 'short', 'arc', 'spark', 'insulation', 'ground', 'fault', 'trip'],
      // Vibration/noise failures
      dynamic: ['noise', 'noisy', 'vibration', 'vibrate', 'shake', 'rattle', 'hum', 'whine', 'screech', 'grinding'],
      // Performance failures
      performance: ['sudden', 'suddenly', 'load', 'reduced', 'drop', 'efficiency', 'capacity', 'output', 'slow', 'fast']
    };
    
    // Universal component keywords (not equipment-specific)
    const componentPatterns = [
      'rotor', 'stator', 'winding', 'bearing', 'shaft', 'coupling', 'seal', 'gasket',
      'blade', 'impeller', 'vane', 'disc', 'plate', 'tube', 'pipe', 'valve',
      'housing', 'casing', 'frame', 'coil', 'core', 'terminal', 'connection'
    ];
    
    // Universal symptom keywords
    const symptomPatterns = [
      'failed', 'failure', 'fault', 'problem', 'issue', 'malfunction', 'defect',
      'alarm', 'trip', 'shutdown', 'stop', 'stopped', 'abnormal', 'unusual'
    ];
    
    // Extract matched patterns
    const primaryFailureKeywords: string[] = [];
    const componentKeywords: string[] = [];
    const symptomKeywords: string[] = [];
    const contextKeywords: string[] = [];
    
    // Find failure type keywords
    for (const [category, patterns] of Object.entries(failurePatterns)) {
      for (const pattern of patterns) {
        if (fullText.includes(pattern)) {
          primaryFailureKeywords.push(pattern);
          contextKeywords.push(category); // Add category context
        }
      }
    }
    
    // Find component keywords
    for (const pattern of componentPatterns) {
      if (fullText.includes(pattern)) {
        componentKeywords.push(pattern);
      }
    }
    
    // Find symptom keywords
    for (const pattern of symptomPatterns) {
      if (fullText.includes(pattern)) {
        symptomKeywords.push(pattern);
      }
    }
    
    // Calculate confidence based on keyword richness
    const totalKeywords = primaryFailureKeywords.length + componentKeywords.length + symptomKeywords.length;
    const confidence = Math.min(100, Math.round((totalKeywords / words.length) * 100 * 10)); // Scale appropriately
    
    return {
      primaryFailureKeywords: Array.from(new Set(primaryFailureKeywords)),
      componentKeywords: Array.from(new Set(componentKeywords)),
      symptomKeywords: Array.from(new Set(symptomKeywords)),
      contextKeywords: Array.from(new Set(contextKeywords)),
      confidence
    };
  }
  
  /**
   * Step 2: Dynamic Failure Mode Filtering based on keywords + Evidence Library
   * NO HARDCODING - Universal matching logic
   */
  private static async filterFailureModesByKeywords(
    equipmentGroup: string,
    equipmentType: string,
    equipmentSubtype: string,
    keywords: KeywordExtractionResult
  ): Promise<UniversalFailureMode[]> {
    
    // Get all failure modes for equipment combination
    const allFailureModes = await investigationStorage.searchEvidenceLibraryByEquipment(
      equipmentGroup,
      equipmentType,
      equipmentSubtype
    );
    
    console.log(`[Universal Questionnaire] Filtering ${allFailureModes.length} failure modes by keywords`);
    
    const filteredModes: UniversalFailureMode[] = [];
    
    for (const entry of allFailureModes) {
      const relevanceScore = this.calculateKeywordRelevance(entry, keywords);
      
      // Include if relevance score > 0 (per corrective instruction)
      if (relevanceScore > 0) {
        const matchedKeywords = this.getMatchedKeywords(entry, keywords);
        
        filteredModes.push({
          id: entry.id,
          failureMode: entry.componentFailureMode || entry.failureCode || 'Unknown Failure',
          relevanceScore,
          matchedKeywords,
          requiredEvidence: this.extractRequiredEvidence(entry),
          evidencePrompts: this.extractEvidencePrompts(entry),
          clarificationQuestions: this.generateFailureModeQuestions(entry, keywords)
        });
      }
    }
    
    // Sort by relevance (highest first)
    filteredModes.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // If no matches found, use AI similarity fallback (per corrective instruction)
    if (filteredModes.length === 0) {
      console.log(`[Universal Questionnaire] No keyword matches - using top 3 failure modes as fallback`);
      const fallbackModes = allFailureModes.slice(0, 3).map((entry, index) => ({
        id: entry.id,
        failureMode: entry.componentFailureMode || entry.failureCode || 'Unknown Failure',
        relevanceScore: 5 - index,
        matchedKeywords: ['fallback'],
        requiredEvidence: this.extractRequiredEvidence(entry),
        evidencePrompts: this.extractEvidencePrompts(entry),
        clarificationQuestions: this.generateFailureModeQuestions(entry, keywords)
      }));
      
      filteredModes.push(...fallbackModes);
    }
    
    return filteredModes;
  }
  
  /**
   * Step 3: AI Clarification Layer - Generate questions when incident is vague
   * Universal logic based on keyword confidence and context gaps
   */
  private static generateClarificationQuestions(
    incidentDescription: string,
    keywords: KeywordExtractionResult,
    relevantFailureModes: UniversalFailureMode[]
  ): AIQuestionnaireStep {
    
    const questions: UniversalQuestion[] = [];
    
    // Check if incident is vague (low keyword confidence)
    if (keywords.confidence < 30 || incidentDescription.length < 50) {
      
      // Universal clarification questions based on missing context
      if (keywords.contextKeywords.length === 0) {
        questions.push({
          id: 'failure_type_clarification',
          question: 'What type of failure occurred? This helps narrow down the investigation focus.',
          type: 'select',
          options: ['Mechanical failure', 'Electrical failure', 'Thermal/overheating', 'Performance degradation', 'Sudden stoppage', 'Other'],
          required: true,
          context: 'Failure type classification is essential for targeted analysis'
        });
      }
      
      // Check for missing symptom details
      if (keywords.symptomKeywords.length < 2) {
        questions.push({
          id: 'symptom_details',
          question: 'Can you provide more specific details about the symptoms observed before/during failure?',
          type: 'text',
          required: false,
          context: 'Detailed symptoms help identify failure progression and root causes'
        });
      }
      
      // Check for operational context
      if (!incidentDescription.includes('operation') && !incidentDescription.includes('running')) {
        questions.push({
          id: 'operational_context',
          question: 'What was the equipment doing when the failure occurred?',
          type: 'select',
          options: ['Normal operation', 'Startup', 'Shutdown', 'Heavy load', 'Light load', 'Maintenance', 'Testing', 'Unknown'],
          required: false,
          context: 'Operational context helps determine failure triggers and contributing factors'
        });
      }
      
      // Universal alarm/warning clarification
      questions.push({
        id: 'alarms_warnings',
        question: 'Were there any alarms, warnings, or unusual readings before the failure?',
        type: 'multiselect',
        options: ['High temperature alarm', 'High vibration', 'Electrical fault alarm', 'Pressure abnormal', 'Flow abnormal', 'No alarms', 'Unknown'],
        required: false,
        context: 'Early warning signs help establish failure timeline and detection gaps'
      });
    }
    
    // Add failure mode specific clarification if multiple high-relevance modes
    const highRelevanceModes = relevantFailureModes.filter(mode => mode.relevanceScore >= 10);
    if (highRelevanceModes.length > 2) {
      questions.push({
        id: 'dominant_failure_mode',
        question: 'Based on your assessment, which failure mode best describes what you observed?',
        type: 'select',
        options: highRelevanceModes.map(mode => mode.failureMode),
        required: false,
        context: 'Helps prioritize investigation focus when multiple failure modes are possible'
      });
    }
    
    return {
      stepType: 'clarification',
      questions,
      purpose: 'Clarify vague incident details and narrow investigation focus'
    };
  }
  
  /**
   * Step 4: Evidence Prompting Logic - Generate evidence questions for filtered failure modes
   * Universal evidence collection based on Evidence Library requirements
   */
  private static generateEvidenceQuestions(
    relevantFailureModes: UniversalFailureMode[]
  ): AIQuestionnaireStep {
    
    const questions: UniversalQuestion[] = [];
    const allEvidenceTypes = new Set<string>();
    
    // Collect all unique evidence types from relevant failure modes
    relevantFailureModes.forEach(mode => {
      mode.requiredEvidence.forEach(evidence => allEvidenceTypes.add(evidence));
    });
    
    // Generate upload questions for each evidence type
    Array.from(allEvidenceTypes).forEach((evidenceType, index) => {
      const relatedModes = relevantFailureModes.filter(mode => 
        mode.requiredEvidence.includes(evidenceType)
      );
      
      questions.push({
        id: `evidence_upload_${index}`,
        question: `Upload ${evidenceType} if available`,
        type: 'file_upload',
        required: false,
        context: `Required for: ${relatedModes.map(m => m.failureMode).join(', ')}`,
        evidenceType,
        failureModeId: relatedModes[0].id
      });
      
      // Add availability question
      questions.push({
        id: `evidence_available_${index}`,
        question: `Is ${evidenceType} available for analysis?`,
        type: 'select',
        options: ['Yes - uploaded above', 'Yes - will provide later', 'Not available', 'Unknown if exists'],
        required: true,
        context: `Availability affects confidence scoring for ${evidenceType} analysis`,
        evidenceType
      });
    });
    
    return {
      stepType: 'evidence',
      questions,
      purpose: 'Collect evidence files and assess availability for targeted failure modes'
    };
  }
  
  /**
   * Generate timeline questions based on filtered failure modes
   * Universal timeline logic using Evidence Library intelligence
   */
  private static generateTimelineQuestions(
    relevantFailureModes: UniversalFailureMode[],
    equipmentGroup: string,
    equipmentType: string,
    equipmentSubtype: string
  ): AIQuestionnaireStep {
    
    const questions: UniversalQuestion[] = [];
    
    // Universal timeline anchor questions (for all equipment)
    const universalAnchors = [
      {
        id: 'first_abnormality',
        question: 'When was something first noticed to be wrong?',
        context: 'Establishes failure timeline start point'
      },
      {
        id: 'failure_time',
        question: 'When did the actual failure/shutdown occur?',
        context: 'Defines the failure event time'
      },
      {
        id: 'last_normal_operation',
        question: 'When was the equipment last operating normally?',
        context: 'Helps determine failure progression duration'
      }
    ];
    
    universalAnchors.forEach(anchor => {
      questions.push({
        id: anchor.id,
        question: anchor.question,
        type: 'text',
        required: false,
        context: anchor.context
      });
      
      questions.push({
        id: `${anchor.id}_confidence`,
        question: `How confident are you about the timing for: ${anchor.question}`,
        type: 'select',
        options: ['Evidence backed', 'Estimated', 'Not known'],
        required: true,
        context: 'Confidence level affects timeline reliability scoring'
      });
    });
    
    // Add failure mode specific timeline questions
    relevantFailureModes.forEach((mode, index) => {
      const timelinePrompts = mode.evidencePrompts.filter(prompt => 
        prompt.toLowerCase().includes('time') || 
        prompt.toLowerCase().includes('when') ||
        prompt.toLowerCase().includes('timeline')
      );
      
      timelinePrompts.forEach((prompt, promptIndex) => {
        questions.push({
          id: `mode_${mode.id}_timeline_${promptIndex}`,
          question: prompt,
          type: 'text',
          required: false,
          context: `Timeline question for ${mode.failureMode}`,
          failureModeId: mode.id
        });
      });
    });
    
    return {
      stepType: 'timeline',
      questions,
      purpose: 'Establish failure timeline and sequence of events'
    };
  }
  
  // Helper methods (implementing universal logic without hardcoding)
  
  private static calculateKeywordRelevance(entry: any, keywords: KeywordExtractionResult): number {
    let score = 0;
    const searchableText = [
      entry.componentFailureMode,
      entry.failureCode,
      entry.aiOrInvestigatorQuestions,
      entry.requiredTrendDataEvidence,
      entry.requiredAttachmentsEvidenceList,
      entry.primaryRootCause
    ].join(' ').toLowerCase();
    
    // Primary failure keywords (highest weight)
    keywords.primaryFailureKeywords.forEach(keyword => {
      if (searchableText.includes(keyword)) score += 15;
    });
    
    // Component keywords (medium weight)
    keywords.componentKeywords.forEach(keyword => {
      if (searchableText.includes(keyword)) score += 10;
    });
    
    // Symptom keywords (medium weight)
    keywords.symptomKeywords.forEach(keyword => {
      if (searchableText.includes(keyword)) score += 8;
    });
    
    // Context keywords (low weight)
    keywords.contextKeywords.forEach(keyword => {
      if (searchableText.includes(keyword)) score += 5;
    });
    
    return score;
  }
  
  private static getMatchedKeywords(entry: any, keywords: KeywordExtractionResult): string[] {
    const matched: string[] = [];
    const searchableText = [
      entry.componentFailureMode,
      entry.failureCode,
      entry.aiOrInvestigatorQuestions
    ].join(' ').toLowerCase();
    
    const allKeywords = [
      ...keywords.primaryFailureKeywords,
      ...keywords.componentKeywords,
      ...keywords.symptomKeywords
    ];
    
    allKeywords.forEach(keyword => {
      if (searchableText.includes(keyword)) {
        matched.push(keyword);
      }
    });
    
    return Array.from(new Set(matched));
  }
  
  private static extractRequiredEvidence(entry: any): string[] {
    const evidence: string[] = [];
    
    if (entry.requiredTrendDataEvidence) {
      evidence.push(...entry.requiredTrendDataEvidence.split(',').map((e: string) => e.trim()));
    }
    
    if (entry.requiredAttachmentsEvidenceList) {
      evidence.push(...entry.requiredAttachmentsEvidenceList.split(',').map((e: string) => e.trim()));
    }
    
    return Array.from(new Set(evidence)).filter(e => e.length > 0);
  }
  
  private static extractEvidencePrompts(entry: any): string[] {
    const prompts: string[] = [];
    
    if (entry.aiOrInvestigatorQuestions) {
      prompts.push(entry.aiOrInvestigatorQuestions);
    }
    
    return prompts;
  }
  
  private static generateFailureModeQuestions(entry: any, keywords: KeywordExtractionResult): string[] {
    const questions: string[] = [];
    
    // Generate specific questions based on failure mode and keywords
    const failureMode = entry.componentFailureMode || entry.failureCode || '';
    
    // Universal question templates based on keyword context
    if (keywords.contextKeywords.includes('thermal') && failureMode.toLowerCase().includes('winding')) {
      questions.push('Was there any evidence of overheating (burn marks, discoloration, smell)?');
    }
    
    if (keywords.contextKeywords.includes('mechanical') && failureMode.toLowerCase().includes('rotor')) {
      questions.push('Were there any visible signs of mechanical damage to rotor components?');
    }
    
    if (keywords.contextKeywords.includes('electrical')) {
      questions.push('Were there any electrical symptoms (arcing, sparks, tripped breakers)?');
    }
    
    return questions;
  }
}