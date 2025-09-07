/**
 * AI SETTINGS DEBUG SYSTEM - UNIVERSAL PROTOCOL STANDARD
 * NO HARDCODING: All flags dynamic, environment-driven
 * 
 * Flag sources (in priority order):
 * 1. Query string: ?debug=1 
 * 2. Environment variable: DEBUG_AI_SETTINGS=1
 * 3. SessionStorage: debug_ai_settings=true
 */

interface TraceLog {
  id: string;
  timestamp: number;
  action: string;
  inputs: Record<string, any>;
  network?: {
    method: string;
    url: string;
    status?: number;
    duration?: number;
  };
  result?: {
    success: boolean;
    message: string;
    data?: any;
  };
  level: 'INFO' | 'WARN' | 'ERROR';
}

class AISettingsDebugger {
  private logs: TraceLog[] = [];
  private maxLogs = 100;
  private isDebugMode = false;
  
  constructor() {
    this.initializeDebugMode();
  }
  
  private initializeDebugMode() {
    // Check query string first
    const urlParams = new URLSearchParams(window.location.search);
    const queryDebug = urlParams.get('debug') === '1';
    
    // Check environment variable (passed via build process)
    const envDebug = process.env.DEBUG_AI_SETTINGS === '1';
    
    // Check session storage
    const sessionDebug = sessionStorage.getItem('debug_ai_settings') === 'true';
    
    this.isDebugMode = queryDebug || envDebug || sessionDebug;
    
    // If enabled via query, persist in session
    if (queryDebug) {
      sessionStorage.setItem('debug_ai_settings', 'true');
    }
    
    if (this.isDebugMode) {
      console.log('[AI Settings Debug] Debug mode ENABLED');
    }
  }
  
  generateTraceId(): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `AIP-${timestamp}-${random}`;
  }
  
  log(action: string, inputs: Record<string, any>, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): string {
    if (!this.isDebugMode) return '';
    
    const traceId = this.generateTraceId();
    const sanitizedInputs = this.redactSensitiveData(inputs);
    
    const logEntry: TraceLog = {
      id: traceId,
      timestamp: Date.now(),
      action,
      inputs: sanitizedInputs,
      level
    };
    
    this.addLog(logEntry);
    console.log(`[AI Settings Debug] ${action} - Trace: ${traceId}`, sanitizedInputs);
    
    return traceId;
  }
  
  updateLogWithNetwork(traceId: string, network: TraceLog['network']) {
    if (!this.isDebugMode) return;
    
    const log = this.logs.find(l => l.id === traceId);
    if (log) {
      log.network = network;
      console.log(`[AI Settings Debug] Network update for ${traceId}:`, network);
    }
  }
  
  updateLogWithResult(traceId: string, result: TraceLog['result']) {
    if (!this.isDebugMode) return;
    
    const log = this.logs.find(l => l.id === traceId);
    if (log) {
      log.result = result;
      console.log(`[AI Settings Debug] Result for ${traceId}:`, result);
    }
  }
  
  private redactSensitiveData(data: Record<string, any>): Record<string, any> {
    const redacted = { ...data };
    const sensitiveKeys = ['apiKey', 'api_key', 'authorization', 'password', 'secret', 'token'];
    
    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        redacted[key] = '[REDACTED]';
      }
    }
    
    return redacted;
  }
  
  private addLog(log: TraceLog) {
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }
  
  getLogs(): TraceLog[] {
    return [...this.logs];
  }
  
  clearLogs() {
    this.logs = [];
    console.log('[AI Settings Debug] Logs cleared');
  }
  
  exportLogs(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      debugMode: this.isDebugMode,
      logs: this.logs,
      version: process.env.REACT_APP_VERSION || 'unknown'
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  isEnabled(): boolean {
    return this.isDebugMode;
  }
}

export const aiDebugger = new AISettingsDebugger();
export type { TraceLog };