/**
 * Step 6: Evidence Analysis Engine
 * Universal Protocol Standard Compliant - Taxonomy-Driven Evidence Analysis
 * Integrates with Equipment Classification System for Dynamic RCA Processing
 */

import { investigationStorage } from "./storage";
import type { EvidenceLibrary } from "@shared/schema";
export interface AnalysisRequest {
  incidentId: string;
  equipmentGroupId?: number;
  equipmentTypeId?: number;
  equipmentSubtypeId?: number;
  riskRankingId?: number;
  symptoms: string[];
  evidenceFiles?: any[];
  incidentDescription: string;
}

export interface AnalysisResult {
  analysisId: string;
  confidence: number;
  primaryFailureModes: FailureMode[];
  eliminatedFailureModes: FailureMode[];
  recommendedActions: RecommendedAction[];
  evidenceGaps: EvidenceGap[];
  taxonomyContext: TaxonomyContext;
  timestamp: string;
}

export interface FailureMode {
  id: number;
  failureCode: string;
  componentFailureMode: string;
  confidence: number;
  reasoning: string;
  requiredEvidence: string[];
  supportingData: any[];
}

export interface RecommendedAction {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  action: string;
  timeframe: string;
  cost?: string;
  resources: string[];
}

export interface EvidenceGap {
  evidenceType: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  collectionTime: string;
  cost?: string;
}

export interface TaxonomyContext {
  equipmentGroup?: string;
  equipmentType?: string;
  equipmentSubtype?: string;
  riskRanking?: string;
  applicableFailureModes: number;
  eliminatedCount: number;
}

export class EvidenceAnalysisEngine {
  constructor() {
    // Initialize engine with minimal dependencies
    console.log('[Evidence Analysis Engine] Initialized with taxonomy-driven analysis capabilities');
  }

  /**
   * Step 6: Main Analysis Entry Point
   * Performs taxonomy-driven evidence analysis with dynamic equipment classification
   */
  async performEvidenceAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    console.log(`[Evidence Analysis Engine] Starting analysis for incident ${request.incidentId}`);
    console.log(`[Evidence Analysis Engine] Taxonomy filters: Group=${request.equipmentGroupId}, Type=${request.equipmentTypeId}, Subtype=${request.equipmentSubtypeId}`);

    try {
      // Step 1: Load taxonomy-filtered evidence library
      const relevantEvidenceItems = await this.loadTaxonomyFilteredEvidence(request);
      console.log(`[Evidence Analysis Engine] Loaded ${relevantEvidenceItems.length} taxonomy-filtered evidence items`);

      // Step 2: Apply symptom-based filtering
      const symptomFilteredItems = await this.applySymptomFiltering(relevantEvidenceItems, request.symptoms);
      console.log(`[Evidence Analysis Engine] Symptom filtering reduced to ${symptomFilteredItems.length} relevant items`);

      // Step 3: Perform elimination logic
      const { primaryFailureModes, eliminatedFailureModes } = await this.performEliminationAnalysis(
        symptomFilteredItems, 
        request
      );
      console.log(`[Evidence Analysis Engine] Elimination analysis: ${primaryFailureModes.length} primary, ${eliminatedFailureModes.length} eliminated`);

      // Step 4: Generate recommendations and evidence gaps
      const recommendedActions = await this.generateRecommendations(primaryFailureModes, request);
      const evidenceGaps = await this.identifyEvidenceGaps(primaryFailureModes, request);

      // Step 5: Build taxonomy context
      const taxonomyContext = await this.buildTaxonomyContext(request, relevantEvidenceItems.length, eliminatedFailureModes.length);

      // Step 6: Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(primaryFailureModes, evidenceGaps.length);

      const analysisResult: AnalysisResult = {
        analysisId: `ANALYSIS_${Date.now()}_${request.incidentId}`,
        confidence: overallConfidence,
        primaryFailureModes,
        eliminatedFailureModes,
        recommendedActions,
        evidenceGaps,
        taxonomyContext,
        timestamp: new Date().toISOString()
      };

      console.log(`[Evidence Analysis Engine] Analysis complete with ${overallConfidence}% confidence`);
      return analysisResult;

    } catch (error) {
      console.error(`[Evidence Analysis Engine] Analysis failed for incident ${request.incidentId}:`, error);
      throw new Error(`Evidence analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load evidence items filtered by equipment taxonomy
   */
  private async loadTaxonomyFilteredEvidence(request: AnalysisRequest): Promise<EvidenceLibrary[]> {
    console.log(`[Evidence Analysis Engine] Loading evidence with taxonomy filters`);
    
    try {
      // Get all evidence library items
      const allEvidenceItems = await investigationStorage.getAllEvidenceLibrary();

      // Apply taxonomy filtering
      let filteredItems = allEvidenceItems.filter(item => item.isActive !== false);

      // Filter by equipment group
      if (request.equipmentGroupId) {
        filteredItems = filteredItems.filter(item => 
          item.equipmentGroupId === request.equipmentGroupId
        );
      }

      // Filter by equipment type
      if (request.equipmentTypeId) {
        filteredItems = filteredItems.filter(item => 
          item.equipmentTypeId === request.equipmentTypeId
        );
      }

      // Filter by equipment subtype
      if (request.equipmentSubtypeId) {
        filteredItems = filteredItems.filter(item => 
          item.equipmentSubtypeId === request.equipmentSubtypeId
        );
      }

      // Filter by risk ranking if specified
      if (request.riskRankingId) {
        filteredItems = filteredItems.filter(item => 
          item.riskRankingId === request.riskRankingId
        );
      }

      return filteredItems;

    } catch (error) {
      console.error('[Evidence Analysis Engine] Error loading taxonomy-filtered evidence:', error);
      throw error;
    }
  }

  /**
   * Apply symptom-based filtering using NLP and pattern matching
   */
  private async applySymptomFiltering(evidenceItems: EvidenceLibrary[], symptoms: string[]): Promise<EvidenceLibrary[]> {
    if (symptoms.length === 0) {
      return evidenceItems;
    }

    console.log(`[Evidence Analysis Engine] Applying symptom filters: ${symptoms.join(', ')}`);

    const symptomKeywords = symptoms.map(s => s.toLowerCase().split(/\s+/)).flat();
    
    return evidenceItems.filter(item => {
      const searchableText = [
        item.componentFailureMode,
        item.requiredTrendDataEvidence,
        item.aiOrInvestigatorQuestions,
        item.rootCauseLogic,
        item.primaryRootCause,
        item.contributingFactor
      ].join(' ').toLowerCase();

      // Check if any symptom keywords match the evidence item
      return symptomKeywords.some(keyword => 
        keyword.length > 2 && searchableText.includes(keyword)
      );
    });
  }

  /**
   * Perform elimination analysis based on evidence and logic
   */
  private async performEliminationAnalysis(
    evidenceItems: EvidenceLibrary[], 
    request: AnalysisRequest
  ): Promise<{ primaryFailureModes: FailureMode[]; eliminatedFailureModes: FailureMode[] }> {
    console.log(`[Evidence Analysis Engine] Performing elimination analysis on ${evidenceItems.length} items`);

    const primaryFailureModes: FailureMode[] = [];
    const eliminatedFailureModes: FailureMode[] = [];

    for (const item of evidenceItems) {
      // Calculate confidence based on evidence match
      const baseConfidence = this.calculateEvidenceConfidence(item, request);
      
      // Check elimination conditions
      const shouldEliminate = await this.shouldEliminateFailureMode(item, request);

      const failureMode: FailureMode = {
        id: item.id,
        failureCode: item.failureCode || '',
        componentFailureMode: item.componentFailureMode || '',
        confidence: baseConfidence,
        reasoning: await this.generateFailureModeReasoning(item, request, shouldEliminate),
        requiredEvidence: this.extractRequiredEvidence(item),
        supportingData: []
      };

      if (shouldEliminate || baseConfidence < 30) {
        eliminatedFailureModes.push(failureMode);
      } else {
        primaryFailureModes.push(failureMode);
      }
    }

    // Sort by confidence
    primaryFailureModes.sort((a, b) => b.confidence - a.confidence);
    eliminatedFailureModes.sort((a, b) => b.confidence - a.confidence);

    return { primaryFailureModes, eliminatedFailureModes };
  }

  /**
   * Calculate confidence score for evidence item match
   */
  private calculateEvidenceConfidence(item: EvidenceLibrary, request: AnalysisRequest): number {
    let confidence = 50; // Base confidence

    // Boost confidence for exact taxonomy matches
    if (request.equipmentGroupId && item.equipmentGroupId === request.equipmentGroupId) {
      confidence += 20;
    }
    if (request.equipmentTypeId && item.equipmentTypeId === request.equipmentTypeId) {
      confidence += 15;
    }
    if (request.equipmentSubtypeId && item.equipmentSubtypeId === request.equipmentSubtypeId) {
      confidence += 10;
    }

    // Adjust based on risk ranking match
    if (request.riskRankingId && item.riskRankingId === request.riskRankingId) {
      confidence += 5;
    }

    // Apply confidence level from evidence library
    if (item.confidenceLevel) {
      const libraryConfidence = this.parseConfidenceLevel(item.confidenceLevel);
      confidence = Math.round((confidence + libraryConfidence) / 2);
    }

    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * Parse confidence level from text format to numeric
   */
  private parseConfidenceLevel(confidenceText: string): number {
    const text = confidenceText.toLowerCase();
    
    if (text.includes('high') || text.includes('9') || text.includes('8')) return 85;
    if (text.includes('medium') || text.includes('7') || text.includes('6')) return 70;
    if (text.includes('low') || text.includes('5') || text.includes('4')) return 55;
    if (text.includes('critical')) return 95;
    
    // Try to extract percentage
    const percentMatch = text.match(/(\d+)%/);
    if (percentMatch) {
      return parseInt(percentMatch[1]);
    }

    // Try to extract numeric rating
    const ratingMatch = text.match(/(\d+)\/(\d+)/);
    if (ratingMatch) {
      return Math.round((parseInt(ratingMatch[1]) / parseInt(ratingMatch[2])) * 100);
    }

    return 60; // Default moderate confidence
  }

  /**
   * Determine if a failure mode should be eliminated
   */
  private async shouldEliminateFailureMode(item: EvidenceLibrary, request: AnalysisRequest): Promise<boolean> {
    // Check elimination conditions from evidence library
    if (item.eliminatedIfTheseFailuresConfirmed && item.whyItGetsEliminated) {
      // Simple elimination logic - in production this would be more sophisticated
      const eliminationConditions = item.eliminatedIfTheseFailuresConfirmed.toLowerCase();
      const symptoms = request.symptoms.join(' ').toLowerCase();
      
      // Check if any elimination conditions are met
      const conditionKeywords = eliminationConditions.split(/[,;]/);
      return conditionKeywords.some(condition => 
        condition.trim().length > 3 && symptoms.includes(condition.trim())
      );
    }

    return false;
  }

  /**
   * Generate reasoning text for failure mode analysis
   */
  private async generateFailureModeReasoning(
    item: EvidenceLibrary, 
    request: AnalysisRequest, 
    eliminated: boolean
  ): Promise<string> {
    const taxonomyMatch = request.equipmentGroupId === item.equipmentGroupId ? 'exact equipment group match' : 'taxonomy mismatch';
    const confidenceReason = item.confidenceLevel ? `library confidence: ${item.confidenceLevel}` : 'no specific confidence data';
    
    if (eliminated) {
      const eliminationReason = item.whyItGetsEliminated || 'elimination conditions met';
      return `Eliminated due to: ${eliminationReason}. ${taxonomyMatch}, ${confidenceReason}`;
    } else {
      return `Active failure mode candidate. ${taxonomyMatch}, ${confidenceReason}. Symptom pattern analysis applied.`;
    }
  }

  /**
   * Extract required evidence from evidence library item
   */
  private extractRequiredEvidence(item: EvidenceLibrary): string[] {
    const evidenceList: string[] = [];
    
    if (item.requiredTrendDataEvidence) {
      evidenceList.push(item.requiredTrendDataEvidence);
    }
    if (item.attachmentsEvidenceRequired) {
      evidenceList.push(item.attachmentsEvidenceRequired);
    }
    if (item.aiOrInvestigatorQuestions) {
      evidenceList.push(item.aiOrInvestigatorQuestions);
    }

    return evidenceList;
  }

  /**
   * Generate recommended actions based on analysis
   */
  private async generateRecommendations(failureModes: FailureMode[], request: AnalysisRequest): Promise<RecommendedAction[]> {
    const recommendations: RecommendedAction[] = [];

    if (failureModes.length === 0) {
      recommendations.push({
        priority: 'High',
        action: 'Expand evidence collection - no clear failure modes identified',
        timeframe: 'Immediate',
        resources: ['Additional investigation', 'Expert consultation']
      });
      return recommendations;
    }

    // High-confidence failure modes get immediate attention
    const highConfidenceModes = failureModes.filter(fm => fm.confidence >= 75);
    if (highConfidenceModes.length > 0) {
      recommendations.push({
        priority: 'Critical',
        action: `Focus on high-confidence failure modes: ${highConfidenceModes.map(fm => fm.componentFailureMode).join(', ')}`,
        timeframe: 'Immediate',
        resources: ['Root cause validation', 'Corrective action planning']
      });
    }

    // Evidence collection for medium-confidence modes
    const mediumConfidenceModes = failureModes.filter(fm => fm.confidence >= 50 && fm.confidence < 75);
    if (mediumConfidenceModes.length > 0) {
      recommendations.push({
        priority: 'High',
        action: `Collect additional evidence for: ${mediumConfidenceModes.map(fm => fm.componentFailureMode).join(', ')}`,
        timeframe: '24-48 hours',
        resources: ['Data collection team', 'Trend analysis tools']
      });
    }

    return recommendations;
  }

  /**
   * Identify evidence gaps that need to be addressed
   */
  private async identifyEvidenceGaps(failureModes: FailureMode[], request: AnalysisRequest): Promise<EvidenceGap[]> {
    const evidenceGaps: EvidenceGap[] = [];

    for (const failureMode of failureModes) {
      if (failureMode.confidence < 70 && failureMode.requiredEvidence.length > 0) {
        for (const evidence of failureMode.requiredEvidence) {
          evidenceGaps.push({
            evidenceType: evidence,
            description: `Missing evidence for ${failureMode.componentFailureMode}: ${evidence}`,
            priority: failureMode.confidence > 50 ? 'High' : 'Medium',
            collectionTime: this.estimateCollectionTime(evidence),
            cost: this.estimateCollectionCost(evidence)
          });
        }
      }
    }

    return evidenceGaps;
  }

  /**
   * Build taxonomy context for analysis result
   */
  private async buildTaxonomyContext(
    request: AnalysisRequest, 
    totalFailureModes: number, 
    eliminatedCount: number
  ): Promise<TaxonomyContext> {
    const context: TaxonomyContext = {
      applicableFailureModes: totalFailureModes,
      eliminatedCount: eliminatedCount
    };

    try {
      // Get taxonomy display names
      if (request.equipmentGroupId) {
        const groups = await investigationStorage.getAllEquipmentGroups();
        const group = groups.find(g => g.id === request.equipmentGroupId);
        context.equipmentGroup = group?.name;
      }

      if (request.equipmentTypeId) {
        const types = await investigationStorage.getAllEquipmentTypes();
        const type = types.find(t => t.id === request.equipmentTypeId);
        context.equipmentType = type?.name;
      }

      if (request.equipmentSubtypeId) {
        const subtypes = await investigationStorage.getAllEquipmentSubtypes();
        const subtype = subtypes.find(s => s.id === request.equipmentSubtypeId);
        context.equipmentSubtype = subtype?.name;
      }

      if (request.riskRankingId) {
        const risks = await investigationStorage.getAllRiskRankings();
        const risk = risks.find(r => r.id === request.riskRankingId);
        context.riskRanking = risk?.label;
      }

    } catch (error) {
      console.error('[Evidence Analysis Engine] Error building taxonomy context:', error);
    }

    return context;
  }

  /**
   * Calculate overall analysis confidence
   */
  private calculateOverallConfidence(failureModes: FailureMode[], evidenceGapCount: number): number {
    if (failureModes.length === 0) {
      return 25; // Low confidence with no identified failure modes
    }

    const averageConfidence = failureModes.reduce((sum, fm) => sum + fm.confidence, 0) / failureModes.length;
    const evidenceGapPenalty = Math.min(evidenceGapCount * 5, 25); // Max 25% penalty for evidence gaps
    
    return Math.max(Math.round(averageConfidence - evidenceGapPenalty), 0);
  }

  /**
   * Estimate time needed to collect specific evidence
   */
  private estimateCollectionTime(evidenceType: string): string {
    const evidence = evidenceType.toLowerCase();
    
    if (evidence.includes('vibration') || evidence.includes('temperature') || evidence.includes('pressure')) {
      return '2-4 hours';
    }
    if (evidence.includes('oil') || evidence.includes('sample') || evidence.includes('analysis')) {
      return '1-2 days';
    }
    if (evidence.includes('inspection') || evidence.includes('visual')) {
      return '1-2 hours';
    }
    if (evidence.includes('historical') || evidence.includes('maintenance')) {
      return '4-8 hours';
    }
    
    return '2-6 hours'; // Default estimate
  }

  /**
   * Estimate cost for evidence collection
   */
  private estimateCollectionCost(evidenceType: string): string {
    const evidence = evidenceType.toLowerCase();
    
    if (evidence.includes('laboratory') || evidence.includes('metallurgical')) {
      return '$1000-2500';
    }
    if (evidence.includes('vibration') || evidence.includes('thermography')) {
      return '$300-800';
    }
    if (evidence.includes('oil') || evidence.includes('sample')) {
      return '$150-400';
    }
    if (evidence.includes('visual') || evidence.includes('inspection')) {
      return '$50-200';
    }
    
    return '$200-600'; // Default estimate
  }
}