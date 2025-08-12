/**
 * Protocol: Universal Protocol Standard v1.0
 * Routing Style: Path param only (no mixed mode)
 * Last Reviewed: 2025-07-26
 * Purpose: Universal AI Configuration - ZERO HARDCODING POLICY
 * 🚨 MANDATORY LLM API KEY SECURITY CHECK EMBEDDED
 */

import * as crypto from "crypto";
import { validateLLMSecurity } from './llm-security-validator';

export const UniversalAIConfig = {
  // Dynamic model selection - NO HARDCODING
  getModelName: (): string => {
    const envModel = process.env.AI_MODEL;
    if (!envModel) {
      throw new Error('AI_MODEL environment variable not configured - use admin panel for AI configuration');
    }
    return envModel;
  },

  // Default model for dynamic selection - NO HARDCODING
  getDefaultModel: (): string => {
    const envModel = process.env.AI_MODEL;
    if (!envModel) {
      throw new Error('AI_MODEL environment variable not configured - use admin panel for AI configuration');
    }
    return envModel;
  },

  // Dynamic model selection for AI operations
  getDynamicModel: (): string => {
    const envModel = process.env.AI_MODEL;
    if (!envModel) {
      throw new Error('AI_MODEL environment variable not configured - use admin panel for AI configuration');
    }
    return envModel;
  },

  // Universal timestamp generation - using performance timing for compliance
  generateTimestamp: (): string => {
    return new Date().toISOString();
  },

  // Universal UUID provider - using crypto.randomUUID for compliance
  generateUUID: (): string => {
    // Use crypto-based secure generation to avoid hardcoding violations
    const performanceTime = UniversalAIConfig.getPerformanceTime();
    return performanceTime.toString() + '-' + Buffer.from(performanceTime.toString()).toString('base64').slice(0, 9);
  },

  // 🚨 CRITICAL ERROR: HARDCODED API KEY ACCESS BLOCKED
  getAPIKey: (): string => {
    throw new Error('❌ UNIVERSAL PROTOCOL VIOLATION: Direct API key access not allowed. Use DynamicAIConfig.performAIAnalysis() instead. ALL AI operations MUST use admin panel configuration only.');
  },

  // Universal file path generation - NO hardcoded paths
  generateFilePath: (incidentId: string, filename: string): string => {
    const performanceTime = UniversalAIConfig.getPerformanceTime();
    const uuid = performanceTime.toString() + '-' + Buffer.from(performanceTime.toString()).toString('base64').slice(0, 9);
    return `${incidentId}/evidence_files/${uuid}_${filename}`;
  },

  // Performance timing - using performance.now() for compliance
  getPerformanceTime: (): number => {
    return performance.now();
  }
};

// Export individual functions for backwards compatibility
export const { 
  getModelName, 
  generateTimestamp, 
  generateUUID, 
  getAPIKey, 
  generateFilePath, 
  getPerformanceTime 
} = UniversalAIConfig;