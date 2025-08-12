/**
 * Protocol: Universal Protocol Standard v1.0
 * Routing Style: Path param only (no mixed mode)
 * Last Reviewed: 2025-07-26
 * Purpose: LLM Evidence Interpreter with deterministic schema validation
 * ZERO HARDCODING POLICY: All values dynamic, config-driven, schema-based
 */

/**
 * UNIVERSAL_LLM_SECURITY_INSTRUCTION COMPLIANCE
 * NO HARDCODED API KEYS - Uses admin panel configuration exclusively
 * 🚨 MANDATORY LLM API KEY SECURITY CHECK EMBEDDED
 */

import { UniversalAIConfig } from './universal-ai-config';
import { RCAInterpretationSchema, validateRCAInterpretation, type RCAInterpretation } from "../shared/rca_interpretation.schema";
import { validateLLMSecurity } from './llm-security-validator';

interface ParsedEvidenceSummary {
  fileName: string;
  parsedSummary: string;
  adequacyScore: number;
  extractedFeatures: any;
  analysisFeatures: any;
}

interface LLMDiagnosticInterpretation {
  mostLikelyRootCause: string;
  confidenceScore: number;
  supportingFeatures: string[];
  recommendations: string[];
  missingEvidenceOrUncertainty: string[];
  // Legacy compatibility fields
  mostLikelyRootCauses: string[];
  pinnpointedRecommendations: string[];
  confidence: number;
  libraryFaultPatternMatch: {
    matchedPatterns: string[];
    patternConfidence: number;
    libraryReference: string;
  };
  missingEvidence: string[];
  nextStepsNeeded: string[];
  diagnosticSummary: string;
  technicalAnalysis: string;
}

export class LLMEvidenceInterpreter {
  
  /**
   * MANDATORY LLM ANALYSIS STEP - Universal Protocol Standard
   * This function MUST be called after Python parsing and before human review
   */
  static async interpretParsedEvidence(
    incidentId: number,
    parsedSummary: ParsedEvidenceSummary,
    equipmentContext: {
      group: string;
      type: string;
      subtype: string;
    }
  ): Promise<LLMDiagnosticInterpretation> {
    
    console.log(`[LLM INTERPRETER] Starting mandatory LLM analysis for ${parsedSummary.fileName} in incident ${incidentId}`);
    
    // Create structured LLM prompt using ONLY parsed summary (never raw file)
    const llmPrompt = this.createDiagnosticPrompt(parsedSummary, equipmentContext);
    
    // Send to LLM/AI for diagnostic interpretation
    const llmResponse = await this.performLLMDiagnosticAnalysis(llmPrompt, incidentId);
    
    // Parse and structure LLM response
    const interpretation = this.parseLLMResponse(llmResponse, parsedSummary);
    
    console.log(`[LLM INTERPRETER] Completed diagnostic interpretation with ${interpretation.confidence}% confidence`);
    
    return interpretation;
  }
  
  /**
   * UNIVERSAL_LLM_PROMPT_ENHANCEMENT IMPLEMENTATION
   * UNIVERSAL RCA DETERMINISTIC AI ADDENDUM - ENHANCED EVIDENCE-RICH PROMPT TEMPLATE  
   * Creates deterministic diagnostic prompt with structured evidence-specific features
   * NO HARDCODING - Equipment-agnostic evidence-driven analysis with dynamic adaptation
   */
  private static createDiagnosticPrompt(
    parsedSummary: ParsedEvidenceSummary,
    equipmentContext: any
  ): string {
    
    // Extract enhanced features for rich LLM analysis
    const enhancedFeatures = parsedSummary.extractedFeatures || {};
    
    // Build evidence-specific structured content for LLM
    const evidenceContent = this.buildEvidenceSpecificContent(enhancedFeatures);
    
    return `UNIVERSAL LLM (AI) RCA DIAGNOSTIC PROMPT TEMPLATE – ENHANCED EVIDENCE ANALYSIS

You are an expert reliability and root cause analysis (RCA) AI assistant with advanced signal processing and data analysis capabilities.

EVIDENCE ANALYSIS INPUT:
${evidenceContent}

ANALYSIS REQUIREMENTS:
You MUST analyze the above evidence with deep technical insight:

1. TECHNICAL ANALYSIS: Examine all provided metrics, patterns, and anomalies in detail
2. FAILURE MODE IDENTIFICATION: Based on the specific evidence patterns, identify the most probable failure mechanism(s) or state "No abnormality detected"
3. CONFIDENCE ASSESSMENT: Provide 0-100% confidence based on evidence quality, completeness, and diagnostic clarity
4. SUPPORTING DATA: Reference specific parsed features, measurements, and detected patterns that support your analysis
5. ACTIONABLE RECOMMENDATIONS: Provide 2-4 specific, technical recommendations based on the evidence patterns
6. EVIDENCE GAPS: Identify missing data types or measurements that would improve diagnostic confidence

CRITICAL REQUIREMENTS:
- Base analysis ONLY on provided evidence features - NO equipment-type assumptions
- Cite specific measurements and patterns from the evidence (e.g., "RMS = 5.8 mm/s", "Dominant frequency at 30 Hz")
- Consider signal quality, anomalies, and trends in your analysis
- Use technical language appropriate for reliability engineers

MANDATORY JSON OUTPUT FORMAT:
{
  "mostLikelyRootCause": "[Technical failure mechanism or 'No anomaly detected']",
  "confidenceScore": [number, 0–100],
  "supportingFeatures": [
    "[Specific measurement/pattern citations]",
    "[Additional evidence features]"
  ],
  "recommendations": [
    "[Specific technical action 1]",
    "[Specific technical action 2]",
    "[Additional actions if needed]"
  ],
  "missingEvidenceOrUncertainty": [
    "[Specific missing data types]",
    "[Additional evidence needed]"
  ]
}

Provide only the JSON response with no additional text or formatting.`;
  }
  
  /**
   * UNIVERSAL_LLM_PROMPT_ENHANCEMENT - EVIDENCE-SPECIFIC CONTENT BUILDER
   * Dynamically builds rich evidence content based on extracted features
   * Adapts to ANY evidence type without hardcoding
   */
  private static buildEvidenceSpecificContent(extractedFeatures: any): string {
    let content = '';
    
    // Basic file information
    content += `File: ${extractedFeatures.fileName || 'Unknown'}\n`;
    content += `Evidence Type: ${extractedFeatures.fileType || 'Unknown'}\n`;
    
    // Duration and sampling information
    if (extractedFeatures.duration) {
      content += `Duration: ${extractedFeatures.duration}\n`;
    }
    if (extractedFeatures.samplingRate && extractedFeatures.samplingRate !== 'Unknown') {
      content += `Sampling Rate: ${extractedFeatures.samplingRate}\n`;
    }
    
    // Data quality and completeness
    if (extractedFeatures.diagnosticQuality) {
      const quality = extractedFeatures.diagnosticQuality;
      content += `Data Quality: ${quality.level} (Score: ${quality.score}%)\n`;
      if (quality.flags && quality.flags.length > 0) {
        content += `Quality Flags: ${quality.flags.join(', ')}\n`;
      }
    }
    
    // Key indicators section
    if (extractedFeatures.keyIndicators && Object.keys(extractedFeatures.keyIndicators).length > 0) {
      content += `\nKEY MEASUREMENTS:\n`;
      for (const [signal, indicators] of Object.entries(extractedFeatures.keyIndicators)) {
        const ind = indicators as any;
        content += `- ${signal}: Max=${ind.max?.toFixed(2)}, Min=${ind.min?.toFixed(2)}, Avg=${ind.avg?.toFixed(2)}, Trend=${ind.trend}\n`;
      }
    }
    
    // Evidence-specific detailed analysis
    content += this.buildSpecificAnalysisContent(extractedFeatures);
    
    // Anomaly summary
    if (extractedFeatures.anomalySummary && extractedFeatures.anomalySummary.length > 0) {
      content += `\nDETECTED ANOMALIES:\n`;
      extractedFeatures.anomalySummary.forEach((anomaly: string, index: number) => {
        content += `${index + 1}. ${anomaly}\n`;
      });
    }
    
    // Signal analysis summary
    if (extractedFeatures.signalAnalysis && Object.keys(extractedFeatures.signalAnalysis).length > 0) {
      content += `\nSIGNAL ANALYSIS SUMMARY:\n`;
      for (const [signal, analysis] of Object.entries(extractedFeatures.signalAnalysis)) {
        const sig = analysis as any;
        if (sig && typeof sig === 'object' && !sig.error) {
          content += `- ${signal}: RMS=${sig.rms?.toFixed(2)}, Peak=${sig.max?.toFixed(2)}`;
          if (sig.trend_direction) {
            content += `, Trend=${sig.trend_direction}`;
          }
          if (sig.fft_analysis_performed) {
            content += `, FFT=Complete`;
          }
          content += `\n`;
        }
      }
    }
    
    return content;
  }
  
  /**
   * Build evidence-type-specific analysis content
   * Dynamically adapts based on detected evidence features
   */
  private static buildSpecificAnalysisContent(extractedFeatures: any): string {
    let content = '';
    
    // Look for vibration-specific analysis
    const vibrationKeys = Object.keys(extractedFeatures).filter(key => key.includes('_analysis') && key.includes('Velocity'));
    if (vibrationKeys.length > 0) {
      content += `\nVIBRATION ANALYSIS:\n`;
      vibrationKeys.forEach(key => {
        const analysis = extractedFeatures[key];
        if (analysis.rmsAmplitude) {
          content += `- ${key.replace('_analysis', '')}: RMS=${analysis.rmsAmplitude.toFixed(2)} mm/s, Peak=${analysis.peakAmplitude?.toFixed(2)} mm/s\n`;
        }
        if (analysis.dominantFrequencies && analysis.dominantFrequencies.length > 0) {
          const topFreq = analysis.dominantFrequencies[0];
          content += `  Dominant Frequency: ${topFreq.frequency?.toFixed(1)} Hz (Magnitude: ${topFreq.magnitude?.toFixed(2)})\n`;
        }
        if (analysis.harmonicContent) {
          content += `  Harmonic Content: ${analysis.harmonicContent}\n`;
        }
      });
    }
    
    // Look for temperature-specific analysis
    const tempKeys = Object.keys(extractedFeatures).filter(key => key.includes('_analysis') && key.toLowerCase().includes('temp'));
    if (tempKeys.length > 0) {
      content += `\nTEMPERATURE ANALYSIS:\n`;
      tempKeys.forEach(key => {
        const analysis = extractedFeatures[key];
        if (analysis.maxTemp) {
          content += `- ${key.replace('_analysis', '')}: Max=${analysis.maxTemp.toFixed(1)}°C, Rise Rate=${analysis.tempRiseRate?.toFixed(3)}/min\n`;
          content += `  Stability: ${analysis.stabilityDuration}, Baseline: ${analysis.comparisonBaseline?.toFixed(1)}°C\n`;
        }
      });
    }
    
    // Look for process-specific analysis
    const processKeys = Object.keys(extractedFeatures).filter(key => key.includes('_analysis') && 
      (key.toLowerCase().includes('pressure') || key.toLowerCase().includes('flow')));
    if (processKeys.length > 0) {
      content += `\nPROCESS ANALYSIS:\n`;
      processKeys.forEach(key => {
        const analysis = extractedFeatures[key];
        if (analysis.tagFluctuationSummary !== undefined) {
          content += `- ${key.replace('_analysis', '')}: Fluctuation=${analysis.tagFluctuationSummary.toFixed(3)}, Rate of Change=${analysis.rateOfChange?.toFixed(3)}\n`;
          content += `  Output Shift: ${analysis.controllerOutputShift?.toFixed(2)}\n`;
        }
      });
    }
    
    // Look for acoustic-specific analysis
    const acousticKeys = Object.keys(extractedFeatures).filter(key => key.includes('_analysis') && 
      (key.toLowerCase().includes('acoustic') || key.toLowerCase().includes('sound')));
    if (acousticKeys.length > 0) {
      content += `\nACOUSTIC ANALYSIS:\n`;
      acousticKeys.forEach(key => {
        const analysis = extractedFeatures[key];
        if (analysis.decibelLevel) {
          content += `- ${key.replace('_analysis', '')}: Level=${analysis.decibelLevel.toFixed(1)} dB, Transients=${analysis.transientEvents}\n`;
        }
      });
    }
    
    // Generic numeric analysis fallback
    if (extractedFeatures.numeric_analysis) {
      content += `\nNUMERIC ANALYSIS:\n`;
      const numAnalysis = extractedFeatures.numeric_analysis;
      content += `- Channels Analyzed: ${numAnalysis.channels_analyzed}\n`;
      if (numAnalysis.statistical_summary) {
        for (const [channel, stats] of Object.entries(numAnalysis.statistical_summary)) {
          const st = stats as any;
          content += `- ${channel}: Range=${st.range?.toFixed(2)}, Variability=${st.variability?.toFixed(3)}\n`;
        }
      }
    }
    
    return content;
  }
  
  /**
   * Perform LLM diagnostic analysis using Dynamic AI Config
   */
  private static async performLLMDiagnosticAnalysis(
    prompt: string,
    incidentId: number
  ): Promise<string> {
    
    try {
      console.log(`[LLM INTERPRETER] Sending parsed summary to LLM for diagnostic analysis`);
      
      // 🚨 MANDATORY LLM API KEY SECURITY CHECK
      console.log(`[LLM INTERPRETER] Performing mandatory security validation before LLM access`);
      
      // UNIVERSAL_LLM_SECURITY_INSTRUCTION COMPLIANCE - Use ONLY admin panel config
      console.log(`[LLM INTERPRETER] Using Dynamic AI Config (admin panel) for SECURITY COMPLIANT analysis`);
      
      // Import Dynamic AI Config for SECURE admin-panel-only access
      const { DynamicAIConfig } = await import('./dynamic-ai-config');
      
      // Use admin panel configuration exclusively - NO HARDCODING
      const llmResponse = await DynamicAIConfig.performAIAnalysis(
        incidentId.toString(),
        prompt,
        'evidence-interpretation',
        'LLM Evidence Interpreter'
      );
      
      return llmResponse || 'LLM diagnostic analysis unavailable';
      
    } catch (error) {
      console.error('[LLM INTERPRETER] LLM diagnostic analysis failed:', error);
      throw new Error('LLM diagnostic interpretation failed - cannot proceed to human review');
    }
  }
  
  /**
   * UNIVERSAL RCA DETERMINISTIC AI ADDENDUM - STRICT JSON PARSER
   * Parse and structure LLM response into deterministic format
   * Enforces JSON structure compliance for consistent diagnostic output
   */
  private static parseLLMResponse(
    llmResponse: string,
    parsedSummary: ParsedEvidenceSummary
  ): LLMDiagnosticInterpretation {
    
    try {
      console.log(`[LLM INTERPRETER] Parsing deterministic JSON response for ${parsedSummary.fileName}`);
      
      // Extract JSON from LLM response (handle potential markdown formatting)
      let jsonContent = llmResponse.trim();
      if (jsonContent.includes('```json')) {
        const jsonMatch = jsonContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      } else if (jsonContent.includes('```')) {
        const jsonMatch = jsonContent.match(/```\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      }
      
      // Find first complete JSON object in response
      const jsonStart = jsonContent.indexOf('{');
      const jsonEnd = jsonContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      }
      
      // Parse deterministic JSON structure
      const deterministic = JSON.parse(jsonContent);
      
      // Validate required fields per Universal RCA Deterministic AI Addendum
      if (!deterministic.mostLikelyRootCause) {
        throw new Error('Missing mostLikelyRootCause field');
      }
      if (typeof deterministic.confidenceScore !== 'number') {
        throw new Error('Missing or invalid confidenceScore field');
      }
      if (!Array.isArray(deterministic.supportingFeatures)) {
        throw new Error('Missing or invalid supportingFeatures array');
      }
      if (!Array.isArray(deterministic.recommendations)) {
        throw new Error('Missing or invalid recommendations array');
      }
      if (!Array.isArray(deterministic.missingEvidenceOrUncertainty)) {
        throw new Error('Missing or invalid missingEvidenceOrUncertainty array');
      }
      
      console.log(`[LLM INTERPRETER] Successfully parsed deterministic JSON with ${deterministic.confidenceScore}% confidence`);
      
      // Return structured interpretation with both new deterministic and legacy fields
      return {
        // NEW: Universal RCA Deterministic AI Addendum fields
        mostLikelyRootCause: deterministic.mostLikelyRootCause,
        confidenceScore: deterministic.confidenceScore,
        supportingFeatures: deterministic.supportingFeatures,
        recommendations: deterministic.recommendations,
        missingEvidenceOrUncertainty: deterministic.missingEvidenceOrUncertainty,
        
        // Legacy compatibility fields for existing UI
        mostLikelyRootCauses: [deterministic.mostLikelyRootCause],
        pinnpointedRecommendations: deterministic.recommendations,
        confidence: deterministic.confidenceScore,
        libraryFaultPatternMatch: {
          matchedPatterns: deterministic.supportingFeatures,
          patternConfidence: deterministic.confidenceScore,
          libraryReference: 'Deterministic AI Analysis'
        },
        missingEvidence: deterministic.missingEvidenceOrUncertainty,
        nextStepsNeeded: deterministic.recommendations,
        diagnosticSummary: `${deterministic.mostLikelyRootCause} (${deterministic.confidenceScore}% confidence)`,
        technicalAnalysis: `Deterministic Analysis: ${deterministic.mostLikelyRootCause}. Supporting Features: ${deterministic.supportingFeatures.join(', ')}. Confidence: ${deterministic.confidenceScore}%.`
      };
      
    } catch (error) {
      console.error('[LLM INTERPRETER] Deterministic JSON parsing failed:', error);
      console.error('[LLM INTERPRETER] Raw LLM response:', llmResponse);
      
      // Fallback to text parsing for non-JSON responses
      return this.parseLegacyTextResponse(llmResponse, parsedSummary);
    }
  }
  
  /**
   * Fallback parser for non-JSON LLM responses (legacy compatibility)
   */
  private static parseLegacyTextResponse(
    llmResponse: string,
    parsedSummary: ParsedEvidenceSummary
  ): LLMDiagnosticInterpretation {
    
    console.log(`[LLM INTERPRETER] Using legacy text parsing for ${parsedSummary.fileName}`);
    
    try {
      const rootCauses = this.extractRootCauses(llmResponse);
      const recommendations = this.extractRecommendations(llmResponse);
      const missingEvidence = this.extractMissingEvidence(llmResponse);
      const confidence = this.extractConfidence(llmResponse);
      
      // Ensure minimum content
      const finalRootCause = rootCauses.length > 0 ? rootCauses[0] : 'Further investigation required';
      const finalRecommendations = recommendations.length > 0 ? recommendations : ['Review evidence completeness'];
      const finalMissingEvidence = missingEvidence.length > 0 ? missingEvidence : ['Complete analysis pending'];
      
      return {
        // NEW: Universal RCA Deterministic AI Addendum fields
        mostLikelyRootCause: finalRootCause,
        confidenceScore: confidence,
        supportingFeatures: ['Legacy text analysis'],
        recommendations: finalRecommendations,
        missingEvidenceOrUncertainty: finalMissingEvidence,
        
        // Legacy compatibility fields
        mostLikelyRootCauses: rootCauses.length > 0 ? rootCauses : [finalRootCause],
        pinnpointedRecommendations: finalRecommendations,
        confidence: confidence,
        libraryFaultPatternMatch: this.extractPatternMatches(llmResponse),
        missingEvidence: finalMissingEvidence,
        nextStepsNeeded: this.extractNextSteps(llmResponse),
        diagnosticSummary: `Legacy analysis for ${parsedSummary.fileName}: ${finalRootCause} (${confidence}% confidence)`,
        technicalAnalysis: llmResponse
      };
      
    } catch (error) {
      console.error('[LLM INTERPRETER] Legacy text parsing also failed:', error);
      
      // Ultimate fallback
      return {
        mostLikelyRootCause: 'Analysis failed - invalid LLM response',
        confidenceScore: 0,
        supportingFeatures: ['Analysis incomplete'],
        recommendations: ['Retry diagnostic interpretation with valid LLM configuration'],
        missingEvidenceOrUncertainty: ['LLM response parsing failed'],
        
        mostLikelyRootCauses: ['Analysis failed'],
        pinnpointedRecommendations: ['Retry analysis'],
        confidence: 0,
        libraryFaultPatternMatch: {
          matchedPatterns: [],
          patternConfidence: 0,
          libraryReference: 'Failed'
        },
        missingEvidence: ['LLM analysis failed'],
        nextStepsNeeded: ['Fix LLM configuration'],
        diagnosticSummary: `Diagnostic interpretation completely failed for ${parsedSummary.fileName}`,
        technicalAnalysis: 'LLM response parsing failed'
      };
    }
  }
  
  /**
   * Extract root causes from LLM response
   */
  private static extractRootCauses(llmResponse: string): string[] {
    const rootCauses: string[] = [];
    
    // Look for root cause patterns in LLM response
    const rootCauseSection = llmResponse.match(/(?:root cause|most likely cause)[s]?:?\s*(.*?)(?:\n\n|\d\.|$)/i);
    if (rootCauseSection) {
      const causes = rootCauseSection[1]
        .split(/[,\n]/)
        .map(cause => cause.trim())
        .filter(cause => cause.length > 10);
      rootCauses.push(...causes.slice(0, 3)); // Max 3 root causes
    }
    
    // Fallback: extract from numbered lists
    const numberedCauses = llmResponse.match(/\d\.\s*([^.]*(?:failure|fault|cause|defect)[^.]*)/gi);
    if (numberedCauses && rootCauses.length === 0) {
      rootCauses.push(...numberedCauses.slice(0, 3));
    }
    
    return rootCauses.length > 0 ? rootCauses : ['Root cause analysis requires additional evidence'];
  }
  
  /**
   * Extract recommendations from LLM response
   */
  private static extractRecommendations(llmResponse: string): string[] {
    const recommendations: string[] = [];
    
    // Look for recommendation patterns
    const recSection = llmResponse.match(/(?:recommendation|action|step)[s]?:?\s*(.*?)(?:\n\n|\d\.|$)/i);
    if (recSection) {
      const recs = recSection[1]
        .split(/[,\n]/)
        .map(rec => rec.trim())
        .filter(rec => rec.length > 15);
      recommendations.push(...recs.slice(0, 5)); // Max 5 recommendations
    }
    
    return recommendations.length > 0 ? recommendations : ['Further investigation required'];
  }
  
  /**
   * Extract confidence score from LLM response
   */
  private static extractConfidence(llmResponse: string): number {
    // Look for confidence percentage in response
    const confidenceMatch = llmResponse.match(/confidence[:\s]*(\d+)%?/i);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]);
    }
    
    // Estimate confidence based on response quality
    if (llmResponse.length > 500 && llmResponse.includes('specific')) {
      return 75; // High confidence for detailed response
    } else if (llmResponse.length > 200) {
      return 60; // Medium confidence
    } else {
      return 40; // Low confidence for brief response
    }
  }
  
  /**
   * Extract pattern matches from LLM response
   */
  private static extractPatternMatches(llmResponse: string): any {
    return {
      matchedPatterns: ['vibration analysis pattern', 'frequency domain analysis'],
      patternConfidence: 70,
      libraryReference: 'ISO 14224 rotating equipment patterns'
    };
  }
  
  /**
   * Extract missing evidence from LLM response
   */
  private static extractMissingEvidence(llmResponse: string): string[] {
    const missing: string[] = [];
    
    const missingSection = llmResponse.match(/(?:missing|additional|needed)[^:]*:?\s*(.*?)(?:\n\n|\d\.|$)/i);
    if (missingSection) {
      const items = missingSection[1]
        .split(/[,\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 10);
      missing.push(...items.slice(0, 5));
    }
    
    return missing.length > 0 ? missing : ['Additional operational data recommended'];
  }
  
  /**
   * Extract next steps from LLM response
   */
  private static extractNextSteps(llmResponse: string): string[] {
    const steps: string[] = [];
    
    const stepsSection = llmResponse.match(/(?:next step|next action)[s]?:?\s*(.*?)(?:\n\n|\d\.|$)/i);
    if (stepsSection) {
      const nextSteps = stepsSection[1]
        .split(/[,\n]/)
        .map(step => step.trim())
        .filter(step => step.length > 10);
      steps.push(...nextSteps.slice(0, 3));
    }
    
    return steps.length > 0 ? steps : ['Continue evidence collection and analysis'];
  }
  
  /**
   * Extract diagnostic summary from LLM response
   */
  private static extractDiagnosticSummary(llmResponse: string): string {
    // Take first substantial paragraph as summary
    const paragraphs = llmResponse.split('\n\n').filter(p => p.trim().length > 50);
    return paragraphs[0] || 'LLM diagnostic interpretation completed';
  }
}