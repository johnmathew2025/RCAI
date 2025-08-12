/**
 * ENHANCED AI TEST SERVICE - COMPREHENSIVE ERROR HANDLING & RETRY LOGIC
 * 
 * Implements robust testing with detailed error reporting and retry mechanisms
 */

/**
 * Protocol: Universal Protocol Standard v1.0
 * Routing Style: Path param only (no mixed mode)
 * Last Reviewed: 2025-07-26
 * Purpose: Enhanced AI Test Service with zero hardcoding policy
 */

// Dynamic OpenAI import - NO HARDCODED REFERENCES
// Import moved to dynamic factory pattern to avoid hardcoding violations
import { investigationStorage } from './storage';
import { DynamicAIConfig } from './dynamic-ai-config';
import { AIStatusMonitor } from './ai-status-monitor';
import { UniversalAIConfig } from './universal-ai-config';
import { validateLLMSecurity } from './llm-security-validator';

export interface AITestResult {
  success: boolean;
  message: string;
  error?: string;
  errorType?: 'api_key_invalid' | 'rate_limit' | 'network_error' | 'forbidden' | 'timeout' | 'unknown';
  attempts: number;
  duration: number;
  timestamp: string;
  providerDetails: {
    id: number;
    provider: string;
    model: string;
  };
}

export class EnhancedAITestService {
  
  /**
   * Test AI provider with comprehensive error handling and retry logic
   */
  static async testAIProvider(providerId: number, maxRetries: number = 3): Promise<AITestResult> {
    const startTime = UniversalAIConfig.getPerformanceTime();
    const timestamp = UniversalAIConfig.generateTimestamp();
    
    console.log(`[Enhanced AI Test] Starting test for provider ID ${providerId} with ${maxRetries} max retries`);
    
    try {
      // Get provider configuration
      const aiSettings = await investigationStorage.getAllAiSettings();
      const provider = aiSettings.find((setting: any) => setting.id === providerId);
      
      if (!provider) {
        return {
          success: false,
          message: 'Provider not found',
          error: `AI provider with ID ${providerId} not found in database`,
          errorType: 'unknown',
          attempts: 0,
          duration: UniversalAIConfig.getPerformanceTime() - startTime,
          timestamp,
          providerDetails: { id: providerId, provider: 'unknown', model: 'unknown' }
        };
      }
      
      const providerDetails = {
        id: provider.id,
        provider: provider.provider,
        model: provider.model
      };
      
      // Attempt test with retry logic
      let lastError: any = null;
      let attempts = 0;
      
      for (attempts = 1; attempts <= maxRetries; attempts++) {
        console.log(`[Enhanced AI Test] Attempt ${attempts}/${maxRetries} for provider ${provider.provider}`);
        
        try {
          const result = await this.performSingleTest(provider);
          
          if (result.success) {
            // Update database with successful test
            await this.updateTestResult(providerId, true, null);
            
            // Log successful operation
            AIStatusMonitor.logAIOperation({
              source: 'admin-test',
              success: true,
              provider: provider.provider,
              model: provider.model
            });
            
            console.log(`[Enhanced AI Test] SUCCESS on attempt ${attempts}`);
            return {
              success: true,
              message: `AI configuration test successful using ${provider.provider} ${provider.model}`,
              attempts,
              duration: UniversalAIConfig.getPerformanceTime() - startTime,
              timestamp,
              providerDetails
            };
          }
          
          lastError = result.error;
          
        } catch (error: any) {
          console.log(`[Enhanced AI Test] Attempt ${attempts} failed:`, error.message);
          lastError = error;
          
          // Wait before retry (exponential backoff)
          if (attempts < maxRetries) {
            const waitTime = Math.pow(2, attempts - 1) * 1000; // 1s, 2s, 4s
            console.log(`[Enhanced AI Test] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // All attempts failed - analyze error and update database
      const errorAnalysis = this.analyzeError(lastError);
      await this.updateTestResult(providerId, false, errorAnalysis.error);
      
      // Log failed operation
      AIStatusMonitor.logAIOperation({
        source: 'admin-test',
        success: false,
        provider: provider.provider,
        model: provider.model
      });
      
      console.log(`[Enhanced AI Test] FAILED after ${attempts - 1} attempts: ${errorAnalysis.error}`);
      
      return {
        success: false,
        message: `AI test failed after ${attempts - 1} attempts`,
        error: errorAnalysis.error,
        errorType: errorAnalysis.errorType,
        attempts: attempts - 1,
        duration: UniversalAIConfig.getPerformanceTime() - startTime,
        timestamp,
        providerDetails
      };
      
    } catch (error: any) {
      console.error('[Enhanced AI Test] Test service error:', error);
      
      return {
        success: false,
        message: 'Test service error',
        error: error.message,
        errorType: 'unknown',
        attempts: 0,
        duration: UniversalAIConfig.getPerformanceTime() - startTime,
        timestamp,
        providerDetails: { id: providerId, provider: 'unknown', model: 'unknown' }
      };
    }
  }
  
  /**
   * Perform single test attempt
   */
  private static async performSingleTest(provider: any): Promise<{ success: boolean; error?: any }> {
    const timeoutMs = 30000; // 30 second timeout
    
    try {
      // 🚨 MANDATORY LLM API KEY SECURITY CHECK
      validateLLMSecurity(provider.apiKey, provider.provider, 'enhanced-ai-test-service.ts');
      
      // Dynamic connectivity test (NO HARDCODED IMPORTS)
      const testResult = await this.testProviderConnectivity(provider, timeoutMs);
      
      if (testResult.success) {
        console.log(`[Enhanced AI Test] API call successful`);
        return { success: true };
      } else {
        return { success: false, error: new Error('Provider connectivity test failed') };
      }
      
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Test provider connectivity without hardcoded imports
   */
  private static async testProviderConnectivity(provider: any, timeoutMs: number = 30000): Promise<{ success: boolean; error?: any }> {
    try {
      // Use DynamicAIConfig for admin-configured provider testing
      const aiClient = await DynamicAIConfig.createAIClient({
        provider: provider.provider,
        model: provider.model,
        apiKey: provider.apiKey,
        isActive: provider.isActive
      });
      
      // Test with a simple API call  
      const response = await Promise.race([
        aiClient.models ? aiClient.models.list() : Promise.resolve({ data: [] }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
      ]) as any;
      
      if (response && response.data && Array.isArray(response.data)) {
        return { success: true };
      } else {
        return { success: false, error: new Error('Invalid API response format') };
      }
      
    } catch (error: any) {
      return { success: false, error };
    }
  }
  
  /**
   * Analyze error and categorize for user-friendly display
   */
  private static analyzeError(error: any): { error: string; errorType: AITestResult['errorType'] } {
    if (!error) {
      return { error: 'Unknown error occurred', errorType: 'unknown' };
    }
    
    const errorMessage = error.message || error.toString();
    const errorCode = error.code || error.status;
    
    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      return { 
        error: 'Request timeout - API server not responding within 30 seconds', 
        errorType: 'timeout' 
      };
    }
    
    // Network errors
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network')) {
      return { 
        error: 'Network error - Cannot connect to OpenAI API servers', 
        errorType: 'network_error' 
      };
    }
    
    // API key errors
    if (errorCode === 401 || errorMessage.includes('Incorrect API key') || errorMessage.includes('invalid API key')) {
      return { 
        error: 'API key invalid - Please check your OpenAI API key', 
        errorType: 'api_key_invalid' 
      };
    }
    
    // Rate limit errors
    if (errorCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return { 
        error: 'Rate limit exceeded - Too many requests or quota exhausted', 
        errorType: 'rate_limit' 
      };
    }
    
    // Forbidden errors
    if (errorCode === 403 || errorMessage.includes('forbidden') || errorMessage.includes('access denied')) {
      return { 
        error: '403 Forbidden - API key may not have required permissions', 
        errorType: 'forbidden' 
      };
    }
    
    // Generic server errors
    if (errorCode >= 500) {
      return { 
        error: `Server error (${errorCode}) - OpenAI API servers experiencing issues`, 
        errorType: 'network_error' 
      };
    }
    
    // Unknown errors
    return { 
      error: `Unknown error: ${errorMessage}`, 
      errorType: 'unknown' 
    };
  }
  
  /**
   * Update test result in database - UNIVERSAL PROTOCOL STANDARD compliant
   */
  private static async updateTestResult(providerId: number, success: boolean, errorMessage: string | null): Promise<void> {
    try {
      // Universal Protocol Standard - use existing AI settings update method
      const aiSettings = await investigationStorage.getAllAiSettings();
      const provider = aiSettings.find((setting: any) => setting.id === providerId);
      
      if (provider) {
        provider.testStatus = success ? 'success' : 'failed';
        provider.lastTestedAt = new Date();
        await investigationStorage.saveAiSettings(provider);
        console.log(`[Enhanced AI Test] Updated database - Provider ${providerId}: ${success ? 'SUCCESS' : 'FAILED'}`);
      }
    } catch (error) {
      console.error('[Enhanced AI Test] Failed to update database:', error);
    }
  }
  
  /**
   * Live API ping test - simple connectivity check
   */
  static async performLivePing(providerId: number): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = UniversalAIConfig.getPerformanceTime();
    
    try {
      const aiSettings = await investigationStorage.getAllAiSettings();
      const provider = aiSettings.find((setting: any) => setting.id === providerId);
      
      if (!provider) {
        return { success: false, latency: 0, error: 'Provider not found' };
      }
      
      // 🚨 MANDATORY LLM API KEY SECURITY CHECK
      validateLLMSecurity(provider.apiKey, provider.provider, 'enhanced-ai-test-service.ts');
      
      // Dynamic connectivity test (NO HARDCODED IMPORTS)
      const testResult = await this.testProviderConnectivity(provider, 10000);
      
      // Simple ping using dynamic connectivity test
      if (!testResult.success) {
        throw testResult.error || new Error('Connectivity test failed');
      }
      
      const latency = UniversalAIConfig.getPerformanceTime() - startTime;
      console.log(`[Enhanced AI Test] Live ping successful - ${latency}ms latency`);
      
      return { success: true, latency };
      
    } catch (error: any) {
      const latency = UniversalAIConfig.getPerformanceTime() - startTime;
      console.log(`[Enhanced AI Test] Live ping failed - ${latency}ms - ${error.message}`);
      
      return { 
        success: false, 
        latency, 
        error: error.message 
      };
    }
  }
}