/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: config/equipment-decision-engine.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 */
import { investigationStorage } from '../storage';

interface EquipmentConfiguration {
  analysisComplexity: string;
  requiredEvidence: string[];
  criticalParameters: string[];
  failureModes: string[];
  diagnosticPriority: string;
  investigationTags: string[];
  contentAnalysisSchema: {
    requiredFields: string[];
    dataTypes: Record<string, string>;
    validationRules: Record<string, any>;
    contentPatterns: string[];
  };
}

/**
 * Central Equipment Decision Engine
 * Routes all equipment-specific logic through metadata and configuration
 * NO HARDCODED EQUIPMENT NAMES OR LOGIC
 */
export class EquipmentDecisionEngine {
  
  /**
   * Get equipment behavior configuration from Evidence Library metadata
   */
  static async getEquipmentConfiguration(equipmentGroup: string, equipmentType: string, equipmentSubtype: string): Promise<EquipmentConfiguration> {
    try {
      const libraryEntries = await investigationStorage.searchEvidenceLibraryByEquipment(
        equipmentGroup, 
        equipmentType, 
        equipmentSubtype
      );

      if (libraryEntries.length === 0) {
        return this.getDefaultConfiguration();
      }

      // Extract configuration from Evidence Library metadata
      const config = {
        analysisComplexity: this.extractMetadata(libraryEntries, 'analysisComplexity', 'Moderate'),
        requiredEvidence: this.extractArray(libraryEntries, 'requiredTrendDataEvidence'),
        criticalParameters: this.extractArray(libraryEntries, 'aiOrInvestigatorQuestions'),
        failureModes: this.extractArray(libraryEntries, 'componentFailureMode'),
        diagnosticPriority: this.extractMetadata(libraryEntries, 'diagnosticValue', 'Important'),
        investigationTags: this.generateInvestigationTags(libraryEntries),
        contentAnalysisSchema: this.buildContentSchema(libraryEntries)
      };

      return config;
    } catch (error) {
      console.error('[Equipment Decision Engine] Error loading configuration:', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Extract metadata from Evidence Library entries
   */
  private static extractMetadata(entries: any[], field: string, defaultValue: string): string {
    const values = entries
      .map(entry => entry[field])
      .filter(value => value && value.trim() !== '');
    
    return values.length > 0 ? values[0] : defaultValue;
  }

  /**
   * Extract array data from Evidence Library entries
   */
  private static extractArray(entries: any[], field: string): string[] {
    const arrays = entries
      .map(entry => entry[field])
      .filter(value => value && value.trim() !== '')
      .map(value => value.split(',').map((item: string) => item.trim()))
      .flat();
    
    return [...new Set(arrays)]; // Remove duplicates
  }

  /**
   * Generate investigation tags from Evidence Library metadata
   */
  private static generateInvestigationTags(entries: any[]): string[] {
    const tags = new Set<string>();
    
    entries.forEach(entry => {
      // Add equipment classification tags
      if (entry.equipmentGroup) tags.add(`group:${entry.equipmentGroup.toLowerCase()}`);
      if (entry.equipmentType) tags.add(`type:${entry.equipmentType.toLowerCase()}`);
      if (entry.equipmentSubtype) tags.add(`subtype:${entry.equipmentSubtype.toLowerCase()}`);
      
      // Add complexity tags
      if (entry.analysisComplexity) tags.add(`complexity:${entry.analysisComplexity.toLowerCase()}`);
      
      // Add diagnostic tags
      if (entry.diagnosticValue) tags.add(`diagnostic:${entry.diagnosticValue.toLowerCase()}`);
      
      // Add industry tags
      if (entry.industryRelevance) tags.add(`industry:${entry.industryRelevance.toLowerCase()}`);
    });
    
    return Array.from(tags);
  }

  /**
   * Build content analysis schema from Evidence Library metadata
   */
  private static buildContentSchema(entries: any[]): any {
    const schema = {
      requiredFields: [],
      dataTypes: {},
      validationRules: {},
      contentPatterns: []
    };

    entries.forEach(entry => {
      // Build required fields from evidence requirements
      if (entry.requiredTrendDataEvidence) {
        const fields = entry.requiredTrendDataEvidence.split(',').map((f: string) => f.trim());
        schema.requiredFields.push(...fields);
      }

      // Build content patterns from AI questions
      if (entry.aiOrInvestigatorQuestions) {
        const patterns = this.extractContentPatterns(entry.aiOrInvestigatorQuestions);
        schema.contentPatterns.push(...patterns);
      }

      // Build validation rules from fault signatures
      if (entry.faultSignaturePattern) {
        const rules = this.extractValidationRules(entry.faultSignaturePattern);
        Object.assign(schema.validationRules, rules);
      }
    });

    // Remove duplicates
    schema.requiredFields = [...new Set(schema.requiredFields)];
    schema.contentPatterns = [...new Set(schema.contentPatterns)];

    return schema;
  }

  /**
   * Extract content patterns from AI questions
   */
  private static extractContentPatterns(questions: string): string[] {
    return questions
      .toLowerCase()
      .split(/[?.!]/)
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .map(q => q.replace(/[^a-z0-9\s]/g, ''))
      .filter(q => q.length > 3);
  }

  /**
   * Extract validation rules from fault signatures
   */
  private static extractValidationRules(signatures: string): any {
    const rules: any = {};
    const patterns = signatures.split(',').map(s => s.trim());
    
    patterns.forEach(pattern => {
      const key = pattern.toLowerCase().replace(/[^a-z0-9]/g, '_');
      rules[key] = {
        pattern: pattern,
        required: true,
        type: 'string'
      };
    });
    
    return rules;
  }

  /**
   * Default configuration for unknown equipment
   */
  private static getDefaultConfiguration() {
    return {
      analysisComplexity: 'Moderate',
      requiredEvidence: ['Operating Conditions', 'Maintenance History'],
      criticalParameters: ['Equipment condition at time of failure'],
      failureModes: ['Equipment degradation'],
      diagnosticPriority: 'Important',
      investigationTags: ['generic:equipment'],
      contentAnalysisSchema: {
        requiredFields: ['description', 'timestamp'],
        dataTypes: { description: 'string', timestamp: 'date' },
        validationRules: {},
        contentPatterns: ['failure', 'condition', 'maintenance']
      }
    };
  }

  /**
   * Route decision based on equipment tags and metadata
   */
  static async routeDecision(tags: string[], metadata: any, decisionType: string): Promise<any> {
    // Use tags and metadata to make routing decisions
    // NO if-else or switch statements based on equipment names
    
    const config = {
      analysisRoute: this.determineAnalysisRoute(tags, metadata),
      evidenceRoute: this.determineEvidenceRoute(tags, metadata), 
      validationRoute: this.determineValidationRoute(tags, metadata)
    };

    return config[decisionType] || 'default';
  }

  private static determineAnalysisRoute(tags: string[], metadata: any): string {
    // Route based on complexity and diagnostic priority
    const hasComplexTag = tags.some(tag => tag.includes('complexity:complex') || tag.includes('complexity:expert'));
    const hasCriticalTag = tags.some(tag => tag.includes('diagnostic:critical'));
    
    if (hasComplexTag && hasCriticalTag) return 'advanced_analysis';
    if (hasComplexTag) return 'complex_analysis';
    if (hasCriticalTag) return 'critical_analysis';
    
    return 'standard_analysis';
  }

  private static determineEvidenceRoute(tags: string[], metadata: any): string {
    // Route based on evidence priority and collection complexity
    const hasHighPriorityTag = tags.some(tag => tag.includes('priority:1') || tag.includes('priority:high'));
    const hasRotatingTag = tags.some(tag => tag.includes('group:rotating'));
    
    if (hasHighPriorityTag) return 'priority_evidence';
    if (hasRotatingTag) return 'dynamic_evidence';
    
    return 'standard_evidence';
  }

  private static determineValidationRoute(tags: string[], metadata: any): string {
    // Route based on industry and complexity requirements  
    const hasProcessTag = tags.some(tag => tag.includes('industry:petrochemical') || tag.includes('industry:process'));
    const hasHighComplexity = tags.some(tag => tag.includes('complexity:expert'));
    
    if (hasProcessTag && hasHighComplexity) return 'process_validation';
    if (hasHighComplexity) return 'expert_validation';
    
    return 'standard_validation';
  }
}