/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: dynamic-ai-client-factory.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 * 
 * DYNAMIC AI CLIENT FACTORY - ABSOLUTE NO HARDCODING
 * 
 * This factory creates AI clients using ONLY admin database configuration
 * NO environment variables, NO hardcoded keys, NO fallback logic
 */

import { DynamicAIConfig } from './dynamic-ai-config';
// Dynamic OpenAI import - NO HARDCODED REFERENCES
// Client factory pattern to avoid hardcoding violations

export class DynamicAIClientFactory {
  
  /**
   * Create OpenAI client using admin database configuration ONLY
   */
  static async createOpenAIClient(): Promise<any> {
    const activeProvider = await DynamicAIConfig.getActiveAIProvider();
    
    if (!activeProvider) {
      throw new Error('AI provider not configured. Contact admin to set up AI provider.');
    }
    
    console.log(`[Dynamic AI Client] Creating ${activeProvider.provider} client from admin database (ID: ${activeProvider.id})`);
    
    return await DynamicAIConfig.createAIClient(activeProvider);
  }
  
  /**
   * Perform AI analysis using admin database configuration ONLY
   */
  static async performAnalysis(incidentId: string, prompt: string, context: string = 'general'): Promise<string> {
    const result = await DynamicAIConfig.performAIAnalysis(incidentId, prompt, context, 'DynamicAIClientFactory');
    console.log(`[Dynamic AI Client] Analysis completed using admin-managed configuration`);
    return result;
  }
}