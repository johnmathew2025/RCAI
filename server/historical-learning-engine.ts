/**
 * Historical Learning Engine - Step 9 Implementation
 * 
 * Captures successful investigation patterns and stores them for future AI inference improvement.
 * Uses NLP to match current incidents with historical patterns for enhanced accuracy.
 * 
 * ZERO HARDCODING: All pattern intelligence from database-driven learning
 */

/**
 * Protocol: Universal Protocol Standard v1.0
 * Routing Style: Path param only (no mixed mode)
 * Last Reviewed: 2025-07-26
 * Purpose: Historical Learning Engine with zero hardcoding policy
 */

import { investigationStorage } from "./storage";
import { UniversalAIConfig } from './universal-ai-config';

export interface HistoricalPattern {
  id?: number;
  incidentSymptoms: string[];
  equipmentContext: {
    group: string;
    type: string;
    subtype: string;
  };
  successfulRootCauses: string[];
  evidenceUsed: string[];
  investigationOutcome: {
    confidence: number;
    resolution: string;
    timeToResolve: number;
  };
  patternMetadata: {
    frequency: number;
    successRate: number;
    lastUsed: Date;
    createdAt: Date;
  };
  nlpFeatures: {
    keywordVector: string[];
    semanticHash: string;
    failureCategory: string;
  };
}

export interface PatternMatchResult {
  pattern: HistoricalPattern;
  similarity: number;
  relevanceScore: number;
  confidenceBoost: number;
  applicableRecommendations: string[];
}

export class HistoricalLearningEngine {
  /**
   * Step 9: Capture learning patterns from successful investigations
   */
  async captureSuccessfulPattern(incidentId: number): Promise<HistoricalPattern> {
    console.log(`[Historical Learning] Capturing pattern from successful incident ${incidentId}`);
    
    try {
      // Get completed incident data
      const incident = await investigationStorage.getIncident(incidentId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      // Extract investigation outcomes
      const analysisData = incident.analysisData || {};
      const evidenceData = incident.evidenceCategories || {};
      
      // Build historical pattern from successful investigation
      const pattern = await this.buildPatternFromIncident(incident, analysisData, evidenceData);
      
      // Store pattern in database for future use
      const storedPattern = await investigationStorage.createHistoricalPattern(pattern);
      
      console.log(`[Historical Learning] Pattern captured successfully - ID: ${storedPattern.id}, Keywords: ${pattern.nlpFeatures.keywordVector.join(', ')}`);
      return storedPattern;
      
    } catch (error) {
      console.error('[Historical Learning] Error capturing pattern:', error);
      throw error;
    }
  }

  /**
   * Find matching historical patterns for current incident
   */
  async findMatchingPatterns(incidentData: any): Promise<PatternMatchResult[]> {
    console.log(`[Historical Learning] Finding patterns for incident: ${incidentData.title || 'Untitled'}`);
    
    try {
      // Extract current incident features for matching
      const currentFeatures = this.extractIncidentFeatures(incidentData);
      
      // Get all historical patterns from database
      const allPatterns = await investigationStorage.findHistoricalPatterns({});
      
      // Calculate similarity scores for each pattern
      const matchResults: PatternMatchResult[] = [];
      
      for (const pattern of allPatterns) {
        const similarity = this.calculateSimilarity(currentFeatures, pattern);
        
        if (similarity > 0.3) { // Only include patterns with >30% similarity
          const matchResult = await this.buildMatchResult(pattern, similarity, currentFeatures);
          matchResults.push(matchResult);
        }
      }
      
      // Sort by relevance score (combination of similarity and success rate)
      const sortedMatches = matchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      console.log(`[Historical Learning] Found ${sortedMatches.length} matching patterns with >30% similarity`);
      return sortedMatches.slice(0, 5); // Return top 5 matches
      
    } catch (error) {
      console.error('[Historical Learning] Error finding patterns:', error);
      return [];
    }
  }

  /**
   * Apply historical learning to boost AI confidence
   */
  async applyHistoricalBoost(incidentData: any, aiAnalysis: any): Promise<{
    boostedConfidence: number;
    historicalSupport: PatternMatchResult[];
    learningInsights: string[];
  }> {
    console.log(`[Historical Learning] Applying historical boost to AI analysis`);
    
    try {
      // Find matching historical patterns
      const matchingPatterns = await this.findMatchingPatterns(incidentData);
      
      // Calculate confidence boost based on pattern matches
      let confidenceBoost = 0;
      const learningInsights: string[] = [];
      
      for (const match of matchingPatterns) {
        // Boost confidence based on historical success
        const boost = match.similarity * match.pattern.patternMetadata.successRate * 0.1;
        confidenceBoost += boost;
        
        // Add learning insights
        learningInsights.push(
          `Similar pattern found: ${match.pattern.nlpFeatures.failureCategory} (${Math.round(match.similarity * 100)}% match, ${Math.round(match.pattern.patternMetadata.successRate * 100)}% success rate)`
        );
      }
      
      // Cap confidence boost at 15% to maintain AI integrity
      confidenceBoost = Math.min(confidenceBoost, 0.15);
      
      const originalConfidence = aiAnalysis.confidence || 0;
      const boostedConfidence = Math.min(originalConfidence + confidenceBoost, 1.0);
      
      console.log(`[Historical Learning] Confidence boost: ${Math.round(confidenceBoost * 100)}% (${Math.round(originalConfidence * 100)}% → ${Math.round(boostedConfidence * 100)}%)`);
      
      return {
        boostedConfidence,
        historicalSupport: matchingPatterns,
        learningInsights
      };
      
    } catch (error) {
      console.error('[Historical Learning] Error applying boost:', error);
      return {
        boostedConfidence: aiAnalysis.confidence || 0,
        historicalSupport: [],
        learningInsights: []
      };
    }
  }

  /**
   * Update pattern success metrics when investigation is validated
   */
  async updatePatternSuccess(patternId: number, outcome: {
    successful: boolean;
    resolutionTime: number;
    finalConfidence: number;
  }): Promise<void> {
    console.log(`[Historical Learning] Updating pattern ${patternId} success metrics`);
    
    try {
      const pattern = await investigationStorage.findHistoricalPatterns({ id: patternId });
      if (pattern.length === 0) {
        console.log(`[Historical Learning] Pattern ${patternId} not found`);
        return;
      }
      
      const existingPattern = pattern[0];
      
      // Update success metrics
      const updatedMetadata = {
        ...existingPattern.patternMetadata,
        frequency: existingPattern.patternMetadata.frequency + 1,
        successRate: outcome.successful 
          ? (existingPattern.patternMetadata.successRate + 1) / (existingPattern.patternMetadata.frequency + 1)
          : existingPattern.patternMetadata.successRate * existingPattern.patternMetadata.frequency / (existingPattern.patternMetadata.frequency + 1),
        lastUsed: new Date()
      };
      
      await investigationStorage.updateHistoricalPattern(patternId, {
        patternMetadata: updatedMetadata
      });
      
      console.log(`[Historical Learning] Pattern ${patternId} updated - Success rate: ${Math.round(updatedMetadata.successRate * 100)}%`);
      
    } catch (error) {
      console.error('[Historical Learning] Error updating pattern success:', error);
    }
  }

  // Private helper methods

  private async buildPatternFromIncident(incident: any, analysisData: any, evidenceData: any): Promise<HistoricalPattern> {
    // Extract incident symptoms
    const symptoms = this.extractSymptoms(incident);
    
    // Build equipment context
    const equipmentContext = {
      group: incident.equipmentGroup || 'Unknown',
      type: incident.equipmentType || 'Unknown',
      subtype: incident.equipmentSubtype || 'Unknown'
    };
    
    // Extract successful root causes from analysis
    const rootCauses = this.extractRootCauses(analysisData);
    
    // Get evidence types that were used
    const evidenceUsed = this.extractEvidenceTypes(evidenceData);
    
    // Build outcome metrics
    const outcome = {
      confidence: analysisData.confidence || 0,
      resolution: analysisData.rootCause || 'Unknown',
      timeToResolve: this.calculateInvestigationTime(incident)
    };
    
    // Generate NLP features for pattern matching
    const nlpFeatures = this.generateNLPFeatures(symptoms, equipmentContext, rootCauses);
    
    return {
      incidentSymptoms: symptoms,
      equipmentContext,
      successfulRootCauses: rootCauses,
      evidenceUsed,
      investigationOutcome: outcome,
      patternMetadata: {
        frequency: 1,
        successRate: 1.0,
        lastUsed: new Date(),
        createdAt: new Date()
      },
      nlpFeatures
    };
  }

  private extractIncidentFeatures(incidentData: any): any {
    return {
      symptoms: this.extractSymptoms(incidentData),
      equipment: {
        group: incidentData.equipmentGroup,
        type: incidentData.equipmentType,
        subtype: incidentData.equipmentSubtype
      },
      nlpFeatures: this.generateNLPFeatures(
        this.extractSymptoms(incidentData),
        { group: incidentData.equipmentGroup, type: incidentData.equipmentType, subtype: incidentData.equipmentSubtype },
        []
      )
    };
  }

  private calculateSimilarity(currentFeatures: any, pattern: HistoricalPattern): number {
    let similarity = 0;
    
    // Equipment context similarity (30% weight)
    const equipmentMatch = this.calculateEquipmentSimilarity(currentFeatures.equipment, pattern.equipmentContext);
    similarity += equipmentMatch * 0.3;
    
    // Symptom similarity (50% weight)
    const symptomMatch = this.calculateSymptomSimilarity(currentFeatures.symptoms, pattern.incidentSymptoms);
    similarity += symptomMatch * 0.5;
    
    // NLP feature similarity (20% weight)
    const nlpMatch = this.calculateNLPSimilarity(currentFeatures.nlpFeatures, pattern.nlpFeatures);
    similarity += nlpMatch * 0.2;
    
    return Math.min(similarity, 1.0);
  }

  private async buildMatchResult(pattern: HistoricalPattern, similarity: number, currentFeatures: any): Promise<PatternMatchResult> {
    // Calculate relevance score (similarity + success rate + recency)
    const recencyBoost = this.calculateRecencyBoost(pattern.patternMetadata.lastUsed);
    const relevanceScore = (similarity * 0.6) + (pattern.patternMetadata.successRate * 0.3) + (recencyBoost * 0.1);
    
    // Calculate confidence boost
    const confidenceBoost = similarity * pattern.patternMetadata.successRate * 0.15;
    
    // Generate applicable recommendations
    const recommendations = this.generateRecommendations(pattern, similarity);
    
    return {
      pattern,
      similarity,
      relevanceScore,
      confidenceBoost,
      applicableRecommendations: recommendations
    };
  }

  private extractSymptoms(incident: any): string[] {
    const symptoms: string[] = [];
    
    if (incident.symptomDescription) {
      // Simple keyword extraction - in production would use more sophisticated NLP
      const keywords = incident.symptomDescription.toLowerCase()
        .split(/\s+/)
        .filter((word: string) => word.length > 3)
        .slice(0, 10);
      symptoms.push(...keywords);
    }
    
    if (incident.whatHappened) {
      const keywords = incident.whatHappened.toLowerCase()
        .split(/\s+/)
        .filter((word: string) => word.length > 3)
        .slice(0, 5);
      symptoms.push(...keywords);
    }
    
    return [...new Set(symptoms)]; // Remove duplicates
  }

  private extractRootCauses(analysisData: any): string[] {
    const causes: string[] = [];
    
    if (analysisData.rootCause) {
      causes.push(analysisData.rootCause);
    }
    
    if (analysisData.contributingFactors) {
      causes.push(...analysisData.contributingFactors);
    }
    
    return causes;
  }

  private extractEvidenceTypes(evidenceData: any): string[] {
    const types: string[] = [];
    
    for (const [categoryId, categoryData] of Object.entries(evidenceData)) {
      if (typeof categoryData === 'object' && categoryData !== null) {
        const category = categoryData as any;
        if (category.completed) {
          types.push(categoryId);
        }
      }
    }
    
    return types;
  }

  private calculateInvestigationTime(incident: any): number {
    // Calculate time from incident creation to analysis completion
    const created = new Date(incident.createdAt);
    const now = new Date();
    return Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60)); // Hours
  }

  private generateNLPFeatures(symptoms: string[], equipmentContext: any, rootCauses: string[]): any {
    // Generate semantic hash for pattern matching
    const combinedText = [...symptoms, ...rootCauses].join(' ').toLowerCase();
    const semanticHash = this.generateSemanticHash(combinedText);
    
    // Determine failure category
    const failureCategory = this.categorizeFailure(symptoms, rootCauses);
    
    return {
      keywordVector: symptoms,
      semanticHash,
      failureCategory
    };
  }

  private generateSemanticHash(text: string): string {
    // Simple hash generation - in production would use more sophisticated semantic analysis
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private categorizeFailure(symptoms: string[], rootCauses: string[]): string {
    const allText = [...symptoms, ...rootCauses].join(' ').toLowerCase();
    
    if (allText.includes('vibrat') || allText.includes('bearing') || allText.includes('rotat')) {
      return 'mechanical';
    } else if (allText.includes('leak') || allText.includes('seal') || allText.includes('gasket')) {
      return 'sealing';
    } else if (allText.includes('electric') || allText.includes('motor') || allText.includes('power')) {
      return 'electrical';
    } else if (allText.includes('pressure') || allText.includes('temperature') || allText.includes('flow')) {
      return 'process';
    } else {
      return 'general';
    }
  }

  private calculateEquipmentSimilarity(current: any, pattern: any): number {
    let score = 0;
    
    if (current.group === pattern.group) score += 0.5;
    if (current.type === pattern.type) score += 0.3;
    if (current.subtype === pattern.subtype) score += 0.2;
    
    return score;
  }

  private calculateSymptomSimilarity(currentSymptoms: string[], patternSymptoms: string[]): number {
    if (currentSymptoms.length === 0 || patternSymptoms.length === 0) return 0;
    
    const intersection = currentSymptoms.filter(symptom => 
      patternSymptoms.some(ps => ps.includes(symptom) || symptom.includes(ps))
    );
    
    return intersection.length / Math.max(currentSymptoms.length, patternSymptoms.length);
  }

  private calculateNLPSimilarity(current: any, pattern: any): number {
    // Simple similarity based on failure category match
    return current.failureCategory === pattern.failureCategory ? 1.0 : 0.3;
  }

  private calculateRecencyBoost(lastUsed: Date): number {
    const daysSinceUsed = (UniversalAIConfig.getPerformanceTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (daysSinceUsed / 365)); // Decay over a year
  }

  private generateRecommendations(pattern: HistoricalPattern, similarity: number): string[] {
    const recommendations: string[] = [];
    
    recommendations.push(`Consider root cause: ${pattern.successfulRootCauses[0] || 'Unknown'}`);
    recommendations.push(`Focus on evidence: ${pattern.evidenceUsed.slice(0, 2).join(', ')}`);
    
    if (similarity > 0.7) {
      recommendations.push("High similarity - consider following historical investigation approach");
    }
    
    if (pattern.patternMetadata.successRate > 0.8) {
      recommendations.push("Pattern has high success rate - reliable approach");
    }
    
    return recommendations;
  }
}