interface ProviderTester {
  test(modelId: string, apiKey: string): Promise<{ ok: boolean; message?: string; latencyMs?: number }>;
}

class OpenAITester implements ProviderTester {
  async test(modelId: string, apiKey: string): Promise<{ ok: boolean; message?: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(3000),
      });

      const latencyMs = Date.now() - start;

      if (response.ok) {
        return { ok: true, latencyMs };
      } else if (response.status === 401) {
        return { ok: false, message: 'Invalid API key' };
      } else if (response.status === 404) {
        return { ok: false, message: `Model '${modelId}' not found` };
      } else {
        return { ok: false, message: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      const latencyMs = Date.now() - start;
      if (error.name === 'AbortError') {
        return { ok: false, message: 'Timeout (>3s)', latencyMs };
      }
      return { ok: false, message: error.message, latencyMs };
    }
  }
}

class AnthropicTester implements ProviderTester {
  async test(modelId: string, apiKey: string): Promise<{ ok: boolean; message?: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Test' }],
        }),
        signal: AbortSignal.timeout(3000),
      });

      const latencyMs = Date.now() - start;

      if (response.ok) {
        return { ok: true, latencyMs };
      } else if (response.status === 401) {
        return { ok: false, message: 'Invalid API key' };
      } else if (response.status === 404) {
        return { ok: false, message: `Model '${modelId}' not found` };
      } else {
        return { ok: false, message: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      const latencyMs = Date.now() - start;
      if (error.name === 'AbortError') {
        return { ok: false, message: 'Timeout (>3s)', latencyMs };
      }
      return { ok: false, message: error.message, latencyMs };
    }
  }
}

class GoogleTester implements ProviderTester {
  async test(modelId: string, apiKey: string): Promise<{ ok: boolean; message?: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      // Simple ping to Google AI Studio/Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: AbortSignal.timeout(3000),
      });

      const latencyMs = Date.now() - start;

      if (response.ok) {
        return { ok: true, latencyMs };
      } else if (response.status === 401 || response.status === 403) {
        return { ok: false, message: 'Invalid API key' };
      } else if (response.status === 404) {
        return { ok: false, message: `Model '${modelId}' not found` };
      } else {
        return { ok: false, message: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      const latencyMs = Date.now() - start;
      if (error.name === 'AbortError') {
        return { ok: false, message: 'Timeout (>3s)', latencyMs };
      }
      return { ok: false, message: error.message, latencyMs };
    }
  }
}

const testers: Record<string, ProviderTester> = {
  openai: new OpenAITester(),
  anthropic: new AnthropicTester(),
  google: new GoogleTester(),
};

export function getProviderTester(provider: string): ProviderTester | null {
  return testers[provider.toLowerCase()] || null;
}

export function getSupportedProviders(): string[] {
  return Object.keys(testers);
}