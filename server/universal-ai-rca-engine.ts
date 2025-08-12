/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: universal-ai-rca-engine.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 * 
 * UNIVERSAL AI-DRIVEN ROOT CAUSE ANALYSIS ENGINE
 * 
 * ABSOLUTE RULE: NO HARD CODING
 * - NO hardcoded equipment groups/types/subtypes
 * - NO hardcoded failure modes or component-specific logic
 * - NO hardcoded symptom keywords or equipment templates
 * 
 * All logic must be dynamically generated, schema-driven, and AI/NLP inferred.
 */

import { DynamicAIConfig } from './dynamic-ai-config';

interface AIRCAInference {
  incidentId: string;
  inferredCauses: InferredCause[];
  confidence: number;
  aiReasoningChain: string;
  evidenceRequests: EvidenceRequest[];
  auditLog: AuditEntry[];
}

interface InferredCause {
  causeName: string;
  description: string;
  aiConfidence: number;
  technicalReasoning: string;
  evidenceLibraryMatch?: any;
  libraryConfidence?: number;
}

interface EvidenceRequest {
  forCause: string;
  questionPrompt: string;
  evidenceType: string;
  criticality: 'critical' | 'important' | 'useful' | 'optional';
  aiGenerated: boolean;
}

interface AuditEntry {
  timestamp: string;
  incidentId: string;
  cause: string;
  keywordsMatched: string[];
  evidence?: string;
  result: string;
  confidence: number;
  aiReasoning: string;
}

export class UniversalAIRCAEngine {
  
  constructor() {
    // NO HARDCODED AI CONFIGURATION
    // All AI settings loaded dynamically from database
  }

  /**
   * STEP 2: NLP-BASED SYMPTOM EXTRACTION (NO HARDCODED WORDS)  
   * Uses DYNAMIC AI CONFIGURATION to extract key technical phrases
   */
  async extractSymptomKeywordsAI(incidentDescription: string): Promise<string[]> {
    const prompt = `
You are an industrial engineering expert. Extract the key technical keywords and phrases from this incident description that would be relevant for root cause analysis.

Focus on:
- Equipment components mentioned
- Failure symptoms described  
- Process conditions
- Observable phenomena
- Technical terminology

Incident: "${incidentDescription}"

Return ONLY a JSON array of extracted keywords/phrases, no explanation:
`;

    try {
      // Use DYNAMIC AI configuration (NO HARDCODING)
      const response = await DynamicAIConfig.performAIAnalysis(
        'symptom-extraction',
        prompt,
        'Symptom Keyword Extraction',
        'system'
      );

      const keywords = JSON.parse(response);
      console.log('[AI Symptom Extraction] Keywords extracted:', keywords);
      return Array.isArray(keywords) ? keywords : [];
      
    } catch (error) {
      console.error('AI symptom extraction failed:', error);
      // Fallback to basic tokenization if AI fails
      return incidentDescription.toLowerCase()
        .split(/[^a-zA-Z0-9]+/)
        .filter(word => word.length > 2);
    }
  }

  /**
   * STEP 3: AI-BACKEND RCA INFERENCE ENGINE
   * Uses AI to dynamically infer failure hypotheses - NO HARDCODED LISTS
   */
  async inferFailureCausesAI(
    incidentDescription: string,
    equipmentGroup?: string,
    equipmentType?: string,
    equipmentSubtype?: string
  ): Promise<InferredCause[]> {
    
    const equipmentContext = equipmentGroup && equipmentType && equipmentSubtype 
      ? `for ${equipmentGroup} → ${equipmentType} → ${equipmentSubtype} equipment`
      : 'for the described equipment';

    const prompt = `
You are a senior industrial engineer with expertise in root cause analysis. Based on the incident description, infer the most likely failure causes ${equipmentContext}.

Incident Description: "${incidentDescription}"

Analyze this incident and provide your engineering assessment of the most probable failure causes. Consider:
- Primary mechanical/electrical/process causes
- Contributing factors that could lead to this failure mode
- Engineering physics and failure mechanisms
- Industry best practices and common failure patterns

Respond with a JSON array of failure causes, each with:
{
  "causeName": "Brief technical name",
  "description": "Detailed technical explanation", 
  "aiConfidence": number (0-100),
  "technicalReasoning": "Engineering justification"
}

Provide 3-8 most likely causes ranked by probability. Be specific and technical.
`;

    try {
      // Use DYNAMIC AI configuration (NO HARDCODING)
      const response = await DynamicAIConfig.performAIAnalysis(
        'failure-inference',
        prompt,
        'Failure Cause Inference',
        'system'
      );

      const causes = JSON.parse(response);
      return Array.isArray(causes) ? causes : [];
    } catch (error) {
      console.error('AI failure cause inference failed:', error);
      return [];
    }
  }

  /**
   * STEP 4: MATCH AGAINST EVIDENCE LIBRARY (OPTIONAL FILTER LAYER)
   * Evidence Library supports but does not dictate root cause
   */
  async matchEvidenceLibrary(inferredCauses: InferredCause[], evidenceLibrary: any[]): Promise<InferredCause[]> {
    const enrichedCauses = [];

    for (const cause of inferredCauses) {
      // Find potential Evidence Library matches using fuzzy matching
      const matches = evidenceLibrary.filter(entry => {
        const libraryFailureMode = (entry.componentFailureMode || '').toLowerCase();
        const libraryFaultSignature = (entry.faultSignaturePattern || '').toLowerCase();
        const causeName = cause.causeName.toLowerCase();
        
        // Fuzzy matching - check if cause relates to library entry
        return libraryFailureMode.includes(causeName) || 
               causeName.includes(libraryFailureMode) ||
               this.calculateSimilarity(causeName, libraryFailureMode) > 0.6 ||
               this.calculateSimilarity(causeName, libraryFaultSignature) > 0.6;
      });

      const enrichedCause: InferredCause = {
        ...cause,
        evidenceLibraryMatch: matches.length > 0 ? matches[0] : null,
        libraryConfidence: matches.length > 0 ? this.calculateLibraryConfidence(cause, matches[0]) : 0
      };

      enrichedCauses.push(enrichedCause);
    }

    return enrichedCauses;
  }

  /**
   * STEP 5: GENERATE DYNAMIC EVIDENCE REQUEST PROMPTS
   * Creates targeted questions and evidence requests per inferred cause
   */
  async generateEvidenceRequestsAI(inferredCauses: InferredCause[]): Promise<EvidenceRequest[]> {
    const evidenceRequests: EvidenceRequest[] = [];

    for (const cause of inferredCauses) {
      const prompt = `
You are an industrial engineer designing an investigation plan. For the failure cause "${cause.causeName}" with description "${cause.description}", generate specific evidence collection requirements.

Create targeted questions and evidence requests to validate or rule out this cause. Consider:
- What data would prove/disprove this hypothesis?
- What files, measurements, or documentation would be most valuable?
- What questions should investigators ask?

Respond with JSON array of evidence requests:
{
  "questionPrompt": "Specific question to ask investigator",
  "evidenceType": "Type of evidence/file needed",
  "criticality": "critical|important|useful|optional"
}

Generate 2-4 most important evidence requests for this cause.
`;

      try {
        // Use DYNAMIC AI configuration (NO HARDCODING)
        const response = await DynamicAIConfig.performAIAnalysis(
          'evidence-requests',
          prompt,
          'Evidence Request Generation',
          'system'
        );

        const requests = JSON.parse(response);
        if (Array.isArray(requests)) {
          requests.forEach(req => {
              evidenceRequests.push({
                forCause: cause.causeName,
                questionPrompt: req.questionPrompt,
                evidenceType: req.evidenceType,
                criticality: req.criticality,
                aiGenerated: true
              });
            });
          }
      } catch (error) {
        console.error(`Evidence request generation failed for ${cause.causeName}:`, error);
        
        // Fallback: Use Evidence Library data if available
        if (cause.evidenceLibraryMatch) {
          const library = cause.evidenceLibraryMatch;
          evidenceRequests.push({
            forCause: cause.causeName,
            questionPrompt: library.aiOrInvestigatorQuestions || `Was ${cause.causeName} a factor in this incident?`,
            evidenceType: library.requiredTrendDataEvidence || 'Supporting documentation',
            criticality: library.diagnosticValue?.toLowerCase() || 'important',
            aiGenerated: false
          });
        }
      }
    }

    return evidenceRequests;
  }

  /**
   * STEP 7: ROOT CAUSE DETERMINATION LAYER (UNIVERSAL LOGIC)
   * Analyzes evidence and determines root causes with confidence scoring
   */
  async determineRootCauseAI(
    inferredCauses: InferredCause[], 
    evidence: any[], 
    incidentDescription: string
  ): Promise<{
    primaryCause: string;
    contributingFactors: string[];
    latentCause?: string;
    confidence: number;
    aiReasoning: string;
    evidenceSupport: any[];
  }> {
    
    const prompt = `
You are a senior root cause analysis engineer. Based on the incident description, inferred causes, and available evidence, determine the most likely root cause.

Incident: "${incidentDescription}"

Inferred Causes:
${inferredCauses.map(c => `- ${c.causeName}: ${c.description} (AI Confidence: ${c.aiConfidence}%)`).join('\n')}

Available Evidence:
${evidence.map(e => `- ${e.type || e.title}: ${e.description || e.content || 'Available'}`).join('\n')}

Analyze the evidence against each inferred cause and determine:
1. PRIMARY CAUSE - The most likely root cause
2. CONTRIBUTING FACTORS - Other causes that may have played a role
3. LATENT CAUSE - Underlying system/procedural issues (if applicable)
4. CONFIDENCE - Your overall confidence in the analysis (0-100%)

Respond with JSON:
{
  "primaryCause": "Most likely root cause",
  "contributingFactors": ["factor1", "factor2"],
  "latentCause": "Underlying system issue or null",
  "confidence": number,
  "aiReasoning": "Detailed engineering reasoning",
  "evidenceSupport": [{"cause": "cause name", "evidence": "supporting evidence", "strength": "strong|moderate|weak"}]
}
`;

    try {
      // Use DYNAMIC AI configuration (NO HARDCODING)
      const response = await DynamicAIConfig.performAIAnalysis(
        'root-cause-determination',
        prompt,
        'Root Cause Determination',
        'system'
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('Root cause determination failed:', error);
    }

    // Fallback logic
    const primaryCause = inferredCauses.reduce((prev, current) => 
      (prev.aiConfidence > current.aiConfidence) ? prev : current
    );

    return {
      primaryCause: primaryCause.causeName,
      contributingFactors: inferredCauses.slice(0, 3).map(c => c.causeName),
      confidence: 50,
      aiReasoning: "Fallback analysis due to AI processing error",
      evidenceSupport: []
    };
  }

  /**
   * COMPLETE RCA ANALYSIS PIPELINE
   * Orchestrates the entire AI-driven RCA process
   */
  async performCompleteRCA(
    incidentId: string,
    incidentDescription: string,
    equipmentGroup?: string,
    equipmentType?: string,
    equipmentSubtype?: string,
    evidenceLibrary: any[] = [],
    uploadedEvidence: any[] = []
  ): Promise<AIRCAInference> {
    
    const auditLog: AuditEntry[] = [];
    const startTime = new Date().toISOString();

    try {
      // Step 2: Extract symptoms using AI
      const extractedKeywords = await this.extractSymptomKeywordsAI(incidentDescription);
      auditLog.push({
        timestamp: new Date().toISOString(),
        incidentId,
        cause: 'Symptom Extraction',
        keywordsMatched: extractedKeywords,
        result: 'Success',
        confidence: 100,
        aiReasoning: 'AI-based NLP keyword extraction completed'
      });

      // Step 3: Infer failure causes using AI
      const inferredCauses = await this.inferFailureCausesAI(
        incidentDescription, equipmentGroup, equipmentType, equipmentSubtype
      );
      
      // Step 4: Match against Evidence Library (optional support)
      const enrichedCauses = await this.matchEvidenceLibrary(inferredCauses, evidenceLibrary);
      
      // Step 5: Generate evidence requests
      const evidenceRequests = await this.generateEvidenceRequestsAI(enrichedCauses);
      
      // Step 7: Determine root cause if evidence is available
      let rootCauseAnalysis = null;
      if (uploadedEvidence.length > 0) {
        rootCauseAnalysis = await this.determineRootCauseAI(
          enrichedCauses, uploadedEvidence, incidentDescription
        );
      }

      // Calculate overall confidence
      const averageAIConfidence = enrichedCauses.reduce((sum, c) => sum + c.aiConfidence, 0) / enrichedCauses.length;
      const evidenceBonus = uploadedEvidence.length > 0 ? 10 : 0;
      const libraryBonus = enrichedCauses.filter(c => c.evidenceLibraryMatch).length * 5;
      
      const overallConfidence = Math.min(100, averageAIConfidence + evidenceBonus + libraryBonus);

      const aiReasoningChain = `
AI-Driven RCA Analysis Chain:
1. Extracted ${extractedKeywords.length} technical keywords from incident description
2. Inferred ${enrichedCauses.length} potential failure causes using engineering AI analysis
3. Found ${enrichedCauses.filter(c => c.evidenceLibraryMatch).length} Evidence Library matches for validation
4. Generated ${evidenceRequests.length} targeted evidence collection requests
5. ${rootCauseAnalysis ? 'Completed root cause determination with evidence analysis' : 'Awaiting evidence for final determination'}

Overall Confidence: ${overallConfidence}% (AI: ${averageAIConfidence}%, Evidence: +${evidenceBonus}%, Library: +${libraryBonus}%)
`;

      return {
        incidentId,
        inferredCauses: enrichedCauses,
        confidence: overallConfidence,
        aiReasoningChain,
        evidenceRequests,
        auditLog
      };

    } catch (error) {
      console.error('Complete RCA analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      auditLog.push({
        timestamp: new Date().toISOString(),
        incidentId,
        cause: 'System Error',
        keywordsMatched: [],
        result: 'Failed',
        confidence: 0,
        aiReasoning: `Analysis failed: ${errorMessage}`
      });

      return {
        incidentId,
        inferredCauses: [],
        confidence: 0,
        aiReasoningChain: 'Analysis failed due to system error',
        evidenceRequests: [],
        auditLog
      };
    }
  }

  // Helper methods
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateLibraryConfidence(cause: InferredCause, libraryEntry: any): number {
    let confidence = 0;
    
    // Boost confidence if library entry has high diagnostic value
    if (libraryEntry.diagnosticValue === 'Critical') confidence += 20;
    else if (libraryEntry.diagnosticValue === 'Important') confidence += 15;
    else if (libraryEntry.diagnosticValue === 'Useful') confidence += 10;
    
    // Boost confidence if library has high confidence level
    if (libraryEntry.confidenceLevel === 'High') confidence += 15;
    else if (libraryEntry.confidenceLevel === 'Medium') confidence += 10;
    
    // Boost confidence for fuzzy name matching
    const nameSimilarity = this.calculateSimilarity(
      cause.causeName.toLowerCase(), 
      (libraryEntry.componentFailureMode || '').toLowerCase()
    );
    confidence += Math.round(nameSimilarity * 20);
    
    return Math.min(100, confidence);
  }
}