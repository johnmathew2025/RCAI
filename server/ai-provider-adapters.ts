/**
 * AI Provider Adapters - Future-Proof Architecture
 * NO HARDCODING - Dynamic provider support through adapters
 */

export interface AITestResult {
  ok: boolean;
  status: number;
  body: any;
  provider: string;
  model: string;
  timestamp: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Provider Adapter Interface - Future-proof for any AI provider
 */
export interface AIProviderAdapter {
  id: string;
  listModels(apiKey: string): Promise<string[]>;
  test(apiKey: string, modelId: string): Promise<AITestResult>;
  chat(apiKey: string, modelId: string, messages: ChatMessage[]): Promise<any>;
}

/**
 * OpenAI Provider Adapter - No hardcoding of models
 */
export class OpenAIAdapter implements AIProviderAdapter {
  id = 'openai';

  async listModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('[OpenAIAdapter] Failed to list models:', response.status);
        return ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']; // Fallback - common models
      }

      const data = await response.json();
      return data.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => model.id)
        .sort();
    } catch (error) {
      console.error('[OpenAIAdapter] Error listing models:', error);
      return ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']; // Fallback
    }
  }

  async test(apiKey: string, modelId: string): Promise<AITestResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[OpenAIAdapter] Testing with model: ${modelId} (API key: ***${apiKey.slice(-4)})`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Test message' }],
          max_tokens: 1,
          temperature: 0
        })
      });

      const responseData = await response.json();
      console.log(`[OpenAIAdapter] Test response - Status: ${response.status}, Model: ${modelId}`);

      return {
        ok: response.ok,
        status: response.status,
        body: responseData,
        provider: 'openai',
        model: modelId,
        timestamp
      };
    } catch (error) {
      console.error('[OpenAIAdapter] Test error:', error);
      return {
        ok: false,
        status: 500,
        body: { error: error.message },
        provider: 'openai',
        model: modelId,
        timestamp
      };
    }
  }

  async chat(apiKey: string, modelId: string, messages: ChatMessage[]): Promise<any> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      return await response.json();
    } catch (error) {
      console.error('[OpenAIAdapter] Chat error:', error);
      throw error;
    }
  }
}

/**
 * Provider Registry - Dynamic adapter management
 */
export class ProviderRegistry {
  private static adapters: Map<string, AIProviderAdapter> = new Map();

  static {
    // Register adapters - Future providers can be added here
    this.adapters.set('openai', new OpenAIAdapter());
    // Future: this.adapters.set('anthropic', new AnthropicAdapter());
    // Future: this.adapters.set('google', new GeminiAdapter());
  }

  static getAdapter(providerId: string): AIProviderAdapter | null {
    return this.adapters.get(providerId) || null;
  }

  static getSupportedProviders(): string[] {
    return Array.from(this.adapters.keys());
  }
}

/**
 * Error mapping - User-friendly messages
 */
export function mapErrorToUserMessage(errorBody: any): string {
  if (!errorBody || !errorBody.error) {
    return 'Unknown error occurred during API test';
  }

  const errorMessage = errorBody.error.message || errorBody.error.code || '';
  
  if (errorMessage.includes('Invalid API key') || errorMessage.includes('Incorrect API key')) {
    return 'Invalid API key. Please check your API key and try again.';
  }
  
  if (errorMessage.includes('model') && errorMessage.includes('does not exist')) {
    return 'Invalid model specified. Please select a valid model for your provider.';
  }
  
  if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
    return 'API quota exceeded or billing issue. Please check your provider account.';
  }
  
  if (errorMessage.includes('rate limit')) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }
  
  return `API Error: ${errorMessage}`;
}