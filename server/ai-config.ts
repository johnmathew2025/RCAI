/**
 * AI Configuration - Single Source of Truth
 * NO HARDCODING - All provider configurations come from database
 */

import { investigationStorage } from './storage.js';

export interface AIProviderConfig {
  providerId: number;
  provider: string;
  modelId: string;
  apiKeyDecrypted: string;
}

/**
 * Get active AI provider configuration - Single source of truth
 */
export async function getActiveProviderConfig(): Promise<AIProviderConfig | null> {
  try {
    const aiSettings = await investigationStorage.getAllAiSettings();
    const activeProvider = aiSettings.find((setting: any) => setting.isActive);
    
    if (!activeProvider) {
      console.log('[AI-CONFIG] No active provider found');
      return null;
    }

    // Validate model is not provider name - Anti-hardcoding enforcement
    if (!activeProvider.model || activeProvider.model === activeProvider.provider) {
      throw new Error(`Model is required for provider test. Please set a valid model id (e.g., gpt-4o-mini).`);
    }

    return {
      providerId: activeProvider.id,
      provider: activeProvider.provider,
      modelId: activeProvider.model,
      apiKeyDecrypted: activeProvider.apiKey
    };
  } catch (error) {
    console.error('[AI-CONFIG] Error getting active provider config:', error);
    throw error;
  }
}

/**
 * Get specific provider configuration by ID - Single source of truth
 */
export async function getProviderConfigById(providerId: number): Promise<AIProviderConfig | null> {
  try {
    const setting = await investigationStorage.getAiSettingsById(providerId);
    
    if (!setting) {
      return null;
    }

    // Validate model is not provider name - Anti-hardcoding enforcement
    if (!setting.model || setting.model === setting.provider) {
      throw new Error(`Model is required for provider test. Please set a valid model id (e.g., gpt-4o-mini).`);
    }

    return {
      providerId: setting.id,
      provider: setting.provider,
      modelId: setting.model,
      apiKeyDecrypted: setting.apiKey
    };
  } catch (error) {
    console.error('[AI-CONFIG] Error getting provider config by ID:', error);
    throw error;
  }
}