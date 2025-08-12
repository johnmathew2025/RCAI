/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: fallback-logic-engine.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 */
/**
 * FALLBACK LOGIC FOR LOW CONFIDENCE RCA
 * 
 * ABSOLUTE RULE: NO HARDCODING ALLOWED
 * - Do not preload equipment-specific failure modes or symptoms
 * - Do not fallback to static templates
 * - All logic must be AI-driven or schema-driven
 */

import { DynamicAIConfig } from './dynamic-ai-config';
import { DatabaseInvestigationStorage } from './storage';
import { UniversalAIConfig } from './universal-ai-config';
import { validateLLMSecurity } from './llm-security-validator';

export interface AIInferredFailureMode {
  id: string;
  failureMode: string;
  confidence: number;
  confidenceSource: 'AI-Inferred';
  reasoning: string;
  symptoms: string[];
  suggestedEvidence: string[];
  timestamp: string;
}

export interface FallbackAnalysisResult {
  incidentID: string;
  equipmentGroup?: string;
  equipmentType?: string;
  subtype?: string;
  inferredCauses: AIInferredFailureMode[];
  confidenceSource: 'AI-Inferred';
  userConfirmed?: boolean;
  evidenceSummary?: string[];
  timestamp: string;
  escalationRequired?: boolean;
}

export interface InvestigatorFeedback {
  confirmedCauses: string[];
  disagreedCauses: string[];
  alternativeCauses: string[];
  customFailureModes: string[];
  userReasoning?: string;
}

export class FallbackLogicEngine {
  private storage: DatabaseInvestigationStorage;

  constructor() {
    this.storage = new DatabaseInvestigationStorage();
  }

  /**
   * STEP 1: FALLBACK TO AI-ONLY INFERENCE
   * When no Evidence Library entry matches with high confidence (>80%)
   */
  async performAIOnlyInference(
    incidentID: string,
    incidentDescription: string,
    equipmentGroup?: string,
    equipmentType?: string,
    equipmentSubtype?: string,
    extractedSymptoms?: string[],
    evidenceSummary?: string[]
  ): Promise<AIInferredFailureMode[]> {
    
    console.log(`[FALLBACK LOGIC] Performing AI-only inference for incident ${incidentID}`);
    console.log(`[FALLBACK LOGIC] NO Evidence Library match found - using AI inference`);
    
    const contextInfo = [];
    if (equipmentGroup) contextInfo.push(`Equipment Group: ${equipmentGroup}`);
    if (equipmentType) contextInfo.push(`Equipment Type: ${equipmentType}`);
    if (equipmentSubtype) contextInfo.push(`Equipment Subtype: ${equipmentSubtype}`);
    if (extractedSymptoms?.length) contextInfo.push(`Extracted Symptoms: ${extractedSymptoms.join(', ')}`);
    if (evidenceSummary?.length) contextInfo.push(`Evidence Available: ${evidenceSummary.join(', ')}`);

    const prompt = `
You are a senior industrial failure analysis expert. Analyze this incident where no high-confidence matches were found in the evidence library.

Incident Description: "${incidentDescription}"

Context:
${contextInfo.join('\n')}

Based on this information, infer the most likely root causes using your engineering knowledge. Consider:
1. Physical failure mechanisms that could produce these symptoms
2. Common failure modes for this type of equipment (if specified)
3. Environmental and operational factors
4. Failure sequence and progression

Respond with JSON array of inferred failure modes:
[
  {
    "id": "ai_inferred_1",
    "failureMode": "Specific failure mode description",
    "confidence": number (0-100),
    "reasoning": "Engineering explanation for why this failure mode fits the symptoms",
    "symptoms": ["symptom1", "symptom2"],
    "suggestedEvidence": ["evidence type 1", "evidence type 2", "evidence type 3"]
  }
]

Generate 3-5 most likely failure modes. Focus on engineering logic and root causes, not just symptoms.
`;

    try {
      const response = await DynamicAIConfig.performAIAnalysis(
        'fallback-inference',
        prompt,
        'AI-Only Failure Mode Inference',
        'system'
      );

      const inferredModes = JSON.parse(response);
      
      if (!Array.isArray(inferredModes)) {
        throw new Error('AI response is not an array');
      }

      const timestamp = new Date().toISOString();
      
      const result: AIInferredFailureMode[] = inferredModes.map(mode => ({
        id: mode.id || `ai_inferred_${UniversalAIConfig.generateTimestamp()}_${UniversalAIConfig.generateUUID().slice(0, 9)}`,
        failureMode: mode.failureMode,
        confidence: mode.confidence || 50,
        confidenceSource: 'AI-Inferred' as const,
        reasoning: mode.reasoning,
        symptoms: mode.symptoms || extractedSymptoms || [],
        suggestedEvidence: mode.suggestedEvidence || [],
        timestamp
      }));

      console.log(`[FALLBACK LOGIC] AI generated ${result.length} inferred failure modes`);
      return result;
      
    } catch (error) {
      console.error('[FALLBACK LOGIC] AI inference failed:', error);
      
      // Ultimate fallback: Manual analysis prompts
      const timestamp = new Date().toISOString();
      return [
        {
          id: `manual_fallback_${UniversalAIConfig.generateTimestamp()}`,
          failureMode: "Manual Expert Analysis Required",
          confidence: 0,
          confidenceSource: 'AI-Inferred' as const,
          reasoning: "AI service unavailable and no Evidence Library matches found. Expert manual analysis required based on incident symptoms.",
          symptoms: extractedSymptoms || [],
          suggestedEvidence: [
            "Expert engineering assessment",
            "Similar historical incidents review", 
            "Technical literature research",
            "Industry best practices consultation"
          ],
          timestamp
        }
      ];
    }
  }

  /**
   * STEP 2: COLLECT INVESTIGATOR FEEDBACK
   * Ask investigator for action on AI-inferred causes
   */
  validateInvestigatorFeedback(feedback: InvestigatorFeedback): {
    isValid: boolean;
    message?: string;
  } {
    const totalFeedback = 
      feedback.confirmedCauses.length + 
      feedback.disagreedCauses.length + 
      feedback.alternativeCauses.length + 
      feedback.customFailureModes.length;

    if (totalFeedback === 0) {
      return {
        isValid: false,
        message: "Please provide feedback on at least one inferred failure mode or add a custom failure mode"
      };
    }

    return { isValid: true };
  }

  /**
   * STEP 3: LOG UNMATCHED INFERENCE FOR REVIEW
   * Log for potential Evidence Library enhancement
   */
  async logUnmatchedInference(
    incidentID: string,
    inferredModes: AIInferredFailureMode[],
    investigatorFeedback: InvestigatorFeedback,
    equipmentGroup?: string,
    equipmentType?: string,
    subtype?: string,
    evidenceSummary?: string[]
  ): Promise<void> {
    
    const logEntry: FallbackAnalysisResult = {
      incidentID,
      equipmentGroup,
      equipmentType,
      subtype,
      inferredCauses: inferredModes,
      confidenceSource: 'AI-Inferred',
      userConfirmed: investigatorFeedback.confirmedCauses.length > 0,
      evidenceSummary: evidenceSummary || [],
      timestamp: new Date().toISOString(),
      escalationRequired: this.shouldEscalateForReview(investigatorFeedback)
    };

    console.log(`[FALLBACK LOGIC] Logging unmatched inference for incident ${incidentID}`);
    console.log(`[FALLBACK LOGIC] User confirmed: ${logEntry.userConfirmed}, Escalation required: ${logEntry.escalationRequired}`);

    // Store in database for review queue
    try {
      // This would be stored in a dedicated fallback_analysis_log table
      // For now, we'll log to console and could extend storage layer
      console.log('[FALLBACK LOGIC] Review Queue Entry:', JSON.stringify(logEntry, null, 2));
      
      // TODO: Implement storage.createFallbackAnalysisLog(logEntry) when schema extended
      
    } catch (error) {
      console.error('[FALLBACK LOGIC] Failed to log unmatched inference:', error);
    }
  }

  /**
   * STEP 4: CHECK FOR ESCALATION PATTERNS
   * Determine if repeated patterns warrant Evidence Library review
   */
  private shouldEscalateForReview(feedback: InvestigatorFeedback): boolean {
    // Escalate if:
    // 1. User confirmed AI-inferred causes (suggests valid new patterns)
    // 2. User provided alternative causes (suggests gaps in AI knowledge)
    // 3. User added custom failure modes (suggests missing library entries)
    
    return (
      feedback.confirmedCauses.length > 0 ||
      feedback.alternativeCauses.length > 0 ||
      feedback.customFailureModes.length > 0
    );
  }

  /**
   * STEP 5: GENERATE EVIDENCE QUESTIONS FOR CONFIRMED CAUSES
   * Create evidence gathering based on investigator-confirmed causes only
   */
  async generateEvidenceQuestionsForConfirmedCauses(
    confirmedCauses: string[],
    alternativeCauses: string[],
    customFailureModes: string[]
  ): Promise<Array<{
    forCause: string;
    questions: string[];
    evidenceTypes: string[];
    priority: 'critical' | 'important' | 'useful';
  }>> {
    
    const allCauses = [...confirmedCauses, ...alternativeCauses, ...customFailureModes];
    const evidenceRequirements = [];

    for (const cause of allCauses) {
      const prompt = `
For the failure mode "${cause}", generate specific evidence collection questions and requirements.

Focus on:
1. What data or measurements would confirm this failure mode
2. What physical evidence would be available
3. What operational data would show this failure pattern
4. What testing or analysis would prove/disprove this cause

Respond with JSON:
{
  "questions": ["Question 1", "Question 2", "Question 3"],
  "evidenceTypes": ["Evidence type 1", "Evidence type 2"],
  "priority": "critical|important|useful"
}

Generate 3-5 targeted questions that would help confirm or rule out this specific failure mode.
`;

      try {
        const response = await DynamicAIConfig.performAIAnalysis(
          'evidence-generation',
          prompt,
          'Evidence Questions for Confirmed Causes',
          'system'
        );

        const evidence = JSON.parse(response);
        evidenceRequirements.push({
          forCause: cause,
          questions: evidence.questions || [`What evidence supports ${cause}?`],
          evidenceTypes: evidence.evidenceTypes || ['Supporting documentation'],
          priority: evidence.priority || 'important' as const
        });

      } catch (error) {
        console.error(`[FALLBACK LOGIC] Evidence generation failed for ${cause}:`, error);
        // Fallback: Basic questions
        evidenceRequirements.push({
          forCause: cause,
          questions: [
            `What physical evidence exists for ${cause}?`,
            `What measurements or data support ${cause}?`,
            `What operational conditions led to ${cause}?`
          ],
          evidenceTypes: ['Physical evidence', 'Measurement data', 'Operational logs'],
          priority: 'important' as const
        });
      }
    }

    return evidenceRequirements;
  }

  /**
   * COMPLETE FALLBACK ANALYSIS WORKFLOW
   * Orchestrates entire fallback logic when Evidence Library confidence is low
   */
  async performCompleteFallbackAnalysis(
    incidentID: string,
    incidentDescription: string,
    equipmentContext?: {
      group?: string;
      type?: string;
      subtype?: string;
    },
    extractedSymptoms?: string[],
    evidenceSummary?: string[]
  ): Promise<{
    inferredFailureModes: AIInferredFailureMode[];
    requiresInvestigatorFeedback: true;
    feedbackInstructions: string;
    loggedForReview: boolean;
  }> {
    
    console.log(`[FALLBACK LOGIC] Starting complete fallback analysis for incident ${incidentID}`);
    
    const inferredModes = await this.performAIOnlyInference(
      incidentID,
      incidentDescription,
      equipmentContext?.group,
      equipmentContext?.type,
      equipmentContext?.subtype,
      extractedSymptoms,
      evidenceSummary
    );

    const feedbackInstructions = `
INVESTIGATOR ACTION REQUIRED:

The Evidence Library did not contain high-confidence matches for this incident. 
AI has generated ${inferredModes.length} potential failure modes based on engineering analysis.

Please review each suggestion and:
[ ] Confirm one or more inferred causes that seem relevant
[ ] Disagree with causes that don't apply
[ ] Suggest alternative causes based on your experience
[ ] Add custom failure modes if you have other theories

Your feedback will be used ONLY for this incident analysis and may be flagged for Evidence Library review if patterns emerge.
`;

    return {
      inferredFailureModes: inferredModes,
      requiresInvestigatorFeedback: true,
      feedbackInstructions,
      loggedForReview: false // Will be set to true after feedback received
    };
  }
}