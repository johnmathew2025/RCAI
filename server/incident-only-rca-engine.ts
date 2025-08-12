/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: incident-only-rca-engine.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 * 
 * INCIDENT-ONLY RCA ENGINE WITH HUMAN VERIFICATION
 * 
 * CRITICAL ENFORCEMENT: ENHANCED_RCA_AI_HUMAN_VERIFICATION
 * - NO equipment-type-based logic
 * - ONLY NLP-extracted incident symptoms
 * - HUMAN VERIFICATION for all AI suggestions
 * - SUGGESTIVE, never prescriptive
 * - COLLABORATIVE with investigator insight
 */

import { DynamicAIConfig } from './dynamic-ai-config';

export interface ExtractedSymptom {
  keyword: string;
  context: string;
  confidence: number;
}

export interface AIFailureHypothesis {
  id: string;
  hypothesis: string;
  reasoning: string;
  aiConfidence: number;
  symptomsBasis: string[];
  suggestedEvidence: string[];
}

export interface UserVerifiedHypothesis {
  id: string;
  hypothesis: string;
  userStatus: 'accepted' | 'rejected' | 'modified';
  userModification?: string;
  userReasoning?: string;
}

export interface EvidencePrompt {
  forHypothesis: string;
  question: string;
  expectedDataType: string;
  criticality: 'critical' | 'important' | 'useful';
}

export class IncidentOnlyRCAEngine {
  
  /**
   * STEP 1: EXTRACT KEYWORDS USING NLP ONLY
   * No equipment context - pure incident text analysis
   */
  async extractIncidentSymptoms(incidentDescription: string): Promise<ExtractedSymptom[]> {
    const prompt = `
You are an industrial failure analysis expert. Extract technical symptoms and failure indicators from this incident description using NLP only.

Incident Text: "${incidentDescription}"

Extract specific technical symptoms, failure indicators, and observable conditions. Focus on:
- Physical symptoms (vibration, leaking, overheating, noise, etc.)
- Measurable parameters (high amps, pressure drop, temperature rise, etc.)
- Temporal aspects (sudden, gradual, continuous, intermittent)
- Process impacts (plant stopped, production loss, shutdown, etc.)

Respond with JSON array of symptoms:
[
  {
    "keyword": "specific technical term",
    "context": "how it appeared in incident",
    "confidence": number (0-100)
  }
]

Extract ONLY what is explicitly described in the incident text. NO equipment assumptions.
`;

    try {
      const response = await DynamicAIConfig.performAIAnalysis(
        'symptom-extraction',
        prompt,
        'Incident Symptom Extraction',
        'system'
      );

      const symptoms = JSON.parse(response);
      console.log('[INCIDENT-ONLY RCA] Extracted symptoms:', symptoms);
      return Array.isArray(symptoms) ? symptoms : [];
      
    } catch (error) {
      console.error('Incident symptom extraction failed:', error);
      // Fallback: Basic NLP tokenization
      const words = incidentDescription.toLowerCase()
        .split(/[^a-zA-Z0-9]+/)
        .filter(word => word.length > 2);
      
      return words.map(word => ({
        keyword: word,
        context: incidentDescription,
        confidence: 50
      }));
    }
  }

  /**
   * STEP 2: GENERATE AI FAILURE HYPOTHESES BASED ON SYMPTOMS ONLY
   * No equipment assumptions - pure symptom-based inference
   */
  async generateFailureHypotheses(
    incidentDescription: string,
    extractedSymptoms: ExtractedSymptom[]
  ): Promise<AIFailureHypothesis[]> {
    
    const symptomsText = extractedSymptoms.map(s => `"${s.keyword}" (${s.context})`).join(', ');
    
    const prompt = `
You are a senior failure analysis engineer. Based ONLY on the incident symptoms, generate 5-6 possible failure hypotheses.

Incident: "${incidentDescription}"
Extracted Symptoms: ${symptomsText}

Generate failure hypotheses based ONLY on the symptoms described. DO NOT assume equipment type, make, model, or design specifics.

For each hypothesis, explain:
1. What failure mode could cause these specific symptoms
2. Why this combination of symptoms suggests this failure
3. What evidence would confirm or rule out this hypothesis

Respond with JSON array:
[
  {
    "id": "hyp_1",
    "hypothesis": "Specific failure mode description",
    "reasoning": "Why these symptoms suggest this failure",
    "aiConfidence": number (0-100),
    "symptomsBasis": ["symptom1", "symptom2"],
    "suggestedEvidence": ["data type 1", "data type 2"]
  }
]

Focus on engineering logic connecting symptoms to failure modes. Be suggestive, not prescriptive.
`;

    try {
      const response = await DynamicAIConfig.performAIAnalysis(
        'failure-hypotheses',
        prompt,
        'AI Failure Hypothesis Generation',
        'system'
      );

      const hypotheses = JSON.parse(response);
      console.log('[INCIDENT-ONLY RCA] Generated AI hypotheses:', hypotheses.length);
      return Array.isArray(hypotheses) ? hypotheses : [];
      
    } catch (error) {
      console.error('AI hypothesis generation failed:', error);
      
      // FALLBACK_LOGIC_LOW_CONFIDENCE_RCA: When AI fails, provide manual hypotheses
      console.log('[INCIDENT-ONLY RCA] AI unavailable, generating basic hypotheses for human verification');
      
      return [
        {
          id: "manual-1",
          hypothesis: "Human Analysis Required",
          reasoning: "AI service unavailable - please manually identify potential failure modes based on the described symptoms",
          aiConfidence: 0,
          symptomsBasis: extractedSymptoms.map(s => s.keyword),
          suggestedEvidence: ["Manual symptom analysis", "Expert engineering assessment", "Historical failure data"]
        },
        {
          id: "manual-2", 
          hypothesis: "Investigator-Defined Failure Mode",
          reasoning: "Add your own failure hypothesis based on experience and symptom analysis",
          aiConfidence: 0,
          symptomsBasis: extractedSymptoms.map(s => s.keyword),
          suggestedEvidence: ["Field observations", "Technical measurements", "Maintenance records"]
        }
      ];
    }
  }

  /**
   * STEP 3: PREPARE HUMAN VERIFICATION STRUCTURE
   * Present AI suggestions for investigator review and modification
   */
  prepareHumanVerification(aiHypotheses: AIFailureHypothesis[]): {
    verificationPrompt: string;
    hypothesesForReview: AIFailureHypothesis[];
    instructions: string;
  } {
    
    const verificationPrompt = `
Based on the incident description, here are possible failure causes generated by AI analysis.

Please review each suggestion and indicate:
✅ Accept - if the hypothesis seems relevant
❌ Reject - if not applicable to your incident
✏️ Modify - if you want to adjust the hypothesis

You can also add your own hypotheses based on your experience.
`;

    const instructions = `
INVESTIGATOR ACTIONS REQUIRED:
1. Review each AI-generated hypothesis
2. Accept, reject, or modify based on your knowledge
3. Add any additional failure modes you suspect
4. System will then prompt for evidence based on your selections

This is collaborative analysis - your expertise guides the investigation.
`;

    return {
      verificationPrompt,
      hypothesesForReview: aiHypotheses,
      instructions
    };
  }

  /**
   * STEP 4: GENERATE EVIDENCE PROMPTS FOR VERIFIED HYPOTHESES
   * Create targeted questions based on user-verified hypotheses only
   */
  async generateEvidencePrompts(
    verifiedHypotheses: UserVerifiedHypothesis[]
  ): Promise<EvidencePrompt[]> {
    
    const evidencePrompts: EvidencePrompt[] = [];
    
    for (const hypothesis of verifiedHypotheses) {
      if (hypothesis.userStatus === 'rejected') continue;
      
      const actualHypothesis = hypothesis.userModification || hypothesis.hypothesis;
      
      const prompt = `
For the failure hypothesis "${actualHypothesis}", generate specific evidence collection questions.

Create targeted questions that would help confirm or rule out this specific failure mode.
Consider what data, measurements, or observations would be most valuable.

Respond with JSON array:
[
  {
    "question": "Specific question for investigator",
    "expectedDataType": "Type of data/evidence needed",
    "criticality": "critical|important|useful"
  }
]

Generate 2-3 most important evidence questions for this hypothesis.
`;

      try {
        const response = await DynamicAIConfig.performAIAnalysis(
          'evidence-prompts',
          prompt,
          'Evidence Prompt Generation',
          'system'
        );

        const questions = JSON.parse(response);
        if (Array.isArray(questions)) {
          questions.forEach(q => {
            evidencePrompts.push({
              forHypothesis: actualHypothesis,
              question: q.question,
              expectedDataType: q.expectedDataType,
              criticality: q.criticality
            });
          });
        }
        
      } catch (error) {
        console.error(`Evidence prompt generation failed for ${actualHypothesis}:`, error);
        // Fallback: Generic prompt
        evidencePrompts.push({
          forHypothesis: actualHypothesis,
          question: `What evidence do you have regarding ${actualHypothesis}?`,
          expectedDataType: 'Supporting documentation or data',
          criticality: 'important'
        });
      }
    }

    return evidencePrompts;
  }

  /**
   * STEP 5: ANALYZE EVIDENCE AGAINST VERIFIED HYPOTHESES
   * Final analysis based on user-verified hypotheses and collected evidence
   */
  async performFinalAnalysis(
    incidentDescription: string,
    verifiedHypotheses: UserVerifiedHypothesis[],
    evidenceData: any[]
  ): Promise<{
    primaryCause: string;
    contributingFactors: string[];
    confidence: number;
    reasoning: string;
    evidenceSupport: any[];
    userVerificationLog: any[];
  }> {
    
    const acceptedHypotheses = verifiedHypotheses.filter(h => h.userStatus === 'accepted' || h.userStatus === 'modified');
    
    const prompt = `
Analyze the evidence against the investigator-verified failure hypotheses.

Incident: "${incidentDescription}"

Verified Hypotheses:
${acceptedHypotheses.map(h => `- ${h.userModification || h.hypothesis} (Status: ${h.userStatus})`).join('\n')}

Available Evidence:
${evidenceData.map(e => `- ${e.type || e.description}: ${e.content || 'Available'}`).join('\n')}

Based on the evidence, determine:
1. Most likely primary cause from the verified hypotheses
2. Contributing factors (if any)
3. Confidence level in the analysis
4. Engineering reasoning

Respond with JSON:
{
  "primaryCause": "Most likely cause from verified hypotheses",
  "contributingFactors": ["factor1", "factor2"],
  "confidence": number (0-100),
  "reasoning": "Engineering analysis of evidence vs hypotheses",
  "evidenceSupport": [{"hypothesis": "hypothesis", "evidence": "supporting evidence", "strength": "strong|moderate|weak"}]
}
`;

    try {
      const response = await DynamicAIConfig.performAIAnalysis(
        'final-analysis',
        prompt,
        'RCA Final Analysis',
        'system'
      );

      const analysis = JSON.parse(response);
      
      return {
        primaryCause: analysis.primaryCause || 'Inconclusive',
        contributingFactors: analysis.contributingFactors || [],
        confidence: analysis.confidence || 50,
        reasoning: analysis.reasoning || 'Analysis completed',
        evidenceSupport: analysis.evidenceSupport || [],
        userVerificationLog: verifiedHypotheses
      };
      
    } catch (error) {
      console.error('Final RCA analysis failed:', error);
      return {
        primaryCause: 'Analysis Error',
        contributingFactors: [],
        confidence: 0,
        reasoning: 'AI analysis failed - manual review required',
        evidenceSupport: [],
        userVerificationLog: verifiedHypotheses
      };
    }
  }

  /**
   * COMPLETE INCIDENT-ONLY RCA WORKFLOW
   * Orchestrates the entire human-verified, incident-only RCA process
   */
  async performIncidentOnlyRCA(
    incidentId: string,
    incidentDescription: string
  ): Promise<{
    extractedSymptoms: ExtractedSymptom[];
    aiHypotheses: AIFailureHypothesis[];
    verificationStructure: any;
    auditLog: any[];
  }> {
    
    const auditLog = [];
    const startTime = new Date().toISOString();
    
    console.log(`[INCIDENT-ONLY RCA] Starting analysis for incident ${incidentId}`);
    console.log('[INCIDENT-ONLY RCA] NO EQUIPMENT-TYPE LOGIC - Pure incident analysis');
    
    try {
      // Step 1: Extract symptoms from incident text only
      const extractedSymptoms = await this.extractIncidentSymptoms(incidentDescription);
      auditLog.push({
        timestamp: new Date().toISOString(),
        step: 'symptom_extraction',
        input: incidentDescription,
        output: extractedSymptoms,
        method: 'incident_text_nlp_only'
      });

      // Step 2: Generate AI failure hypotheses based on symptoms only
      const aiHypotheses = await this.generateFailureHypotheses(incidentDescription, extractedSymptoms);
      auditLog.push({
        timestamp: new Date().toISOString(),
        step: 'ai_hypothesis_generation',
        input: extractedSymptoms,
        output: aiHypotheses,
        method: 'symptom_based_ai_inference'
      });

      // Step 3: Prepare human verification structure
      const verificationStructure = this.prepareHumanVerification(aiHypotheses);
      auditLog.push({
        timestamp: new Date().toISOString(),
        step: 'human_verification_prep',
        method: 'collaborative_review_structure',
        requiresUserInput: true
      });

      return {
        extractedSymptoms,
        aiHypotheses,
        verificationStructure,
        auditLog
      };
      
    } catch (error) {
      console.error('Incident-only RCA failed:', error);
      throw error;
    }
  }
}