/**
 * AI SETTINGS DEBUG MIDDLEWARE - UNIVERSAL PROTOCOL STANDARD
 * NO HARDCODING: All logging configuration-driven
 * 
 * Logs complete request lifecycle for /api/ai/providers/* routes:
 * - Request start with Trace ID
 * - DB operations timing
 * - Request end with outcome
 * - Error handling with sanitization
 */

import { Request, Response, NextFunction } from 'express';
import { UniversalAIConfig } from '../universal-ai-config';

interface RequestTiming {
  start: number;
  traceId: string | null;
  route: string;
  method: string;
}

class AISettingsDebugMiddleware {
  private static instance: AISettingsDebugMiddleware;
  private timings: Map<string, RequestTiming> = new Map();
  private isDebugMode: boolean;
  
  constructor() {
    this.isDebugMode = process.env.DEBUG_AI_SETTINGS === '1';
  }
  
  static getInstance(): AISettingsDebugMiddleware {
    if (!AISettingsDebugMiddleware.instance) {
      AISettingsDebugMiddleware.instance = new AISettingsDebugMiddleware();
    }
    return AISettingsDebugMiddleware.instance;
  }
  
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Only apply to AI providers routes
      if (!req.path.startsWith('/api/ai/providers')) {
        return next();
      }
      
      if (!this.isDebugMode) {
        return next();
      }
      
      const requestId = this.generateRequestId();
      const traceId = req.headers['x-trace-id'] as string || null;
      const start = UniversalAIConfig.getPerformanceTime();
      
      // Log request start
      this.logRequestStart(req, traceId, requestId);
      
      // Store timing info
      this.timings.set(requestId, {
        start,
        traceId,
        route: req.path,
        method: req.method
      });
      
      // Override res.json to capture response
      const originalJson = res.json;
      res.json = function(body) {
        const timing = AISettingsDebugMiddleware.getInstance().timings.get(requestId);
        if (timing) {
          AISettingsDebugMiddleware.getInstance().logRequestEnd(
            req, res, body, timing, requestId
          );
          AISettingsDebugMiddleware.getInstance().timings.delete(requestId);
        }
        return originalJson.call(this, body);
      };
      
      // Handle errors
      const originalNext = next;
      next = (error?: any) => {
        if (error) {
          const timing = this.timings.get(requestId);
          if (timing) {
            this.logRequestError(req, error, timing, requestId);
            this.timings.delete(requestId);
          }
        }
        originalNext(error);
      };
      
      next();
    };
  }
  
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }
  
  private logRequestStart(req: Request, traceId: string | null, requestId: string) {
    const fieldsPresent = this.getFieldsPresent(req.body);
    const logLine = `[AI Debug] START ${req.method} ${req.path} | Trace: ${traceId || 'none'} | Fields: [${fieldsPresent.join(', ')}] | ReqID: ${requestId}`;
    console.log(logLine);
  }
  
  private logRequestEnd(req: Request, res: Response, body: any, timing: RequestTiming, requestId: string) {
    const duration = UniversalAIConfig.getPerformanceTime() - timing.start;
    const outcome = this.generateOutcome(req.method, res.statusCode, body);
    
    const logLine = `[AI Debug] END ${timing.method} ${timing.route} | Trace: ${timing.traceId || 'none'} | Status: ${res.statusCode} | Duration: ${Math.round(duration)}ms | Outcome: ${outcome} | ReqID: ${requestId}`;
    console.log(logLine);
  }
  
  private logRequestError(req: Request, error: any, timing: RequestTiming, requestId: string) {
    const duration = UniversalAIConfig.getPerformanceTime() - timing.start;
    const sanitizedError = this.sanitizeError(error);
    
    const logLine = `[AI Debug] ERROR ${timing.method} ${timing.route} | Trace: ${timing.traceId || 'none'} | Duration: ${Math.round(duration)}ms | Error: ${sanitizedError} | ReqID: ${requestId}`;
    console.error(logLine);
    
    // Log stack trace separately for debugging
    if (error.stack && timing.traceId) {
      console.error(`[AI Debug] Stack for ${timing.traceId}:`, error.stack);
    }
  }
  
  private getFieldsPresent(body: any): string[] {
    if (!body || typeof body !== 'object') return [];
    
    return Object.keys(body).filter(key => {
      const value = body[key];
      return value !== undefined && value !== null && value !== '';
    });
  }
  
  private generateOutcome(method: string, status: number, body: any): string {
    if (status >= 400) {
      return body?.message || body?.error || 'error';
    }
    
    switch (method.toUpperCase()) {
      case 'POST':
        return body?.id ? `created id=${body.id}` : 'created';
      case 'PUT':
        if (body?.isActive !== undefined) return 'activation set';
        return 'updated';
      case 'DELETE':
        return body?.id ? `deleted id=${body.id}` : 'deleted';
      case 'GET':
        if (Array.isArray(body)) return `found ${body.length} items`;
        return body?.id ? `found id=${body.id}` : 'success';
      default:
        return 'success';
    }
  }
  
  private sanitizeError(error: any): string {
    if (!error) return 'unknown error';
    
    // Extract safe error message
    let message = error.message || error.toString() || 'unknown error';
    
    // Remove sensitive patterns
    message = message.replace(/api[_-]?key[s]?[\s]*[:=][\s]*[^\s]+/gi, 'api_key:[REDACTED]');
    message = message.replace(/authorization[\s]*[:=][\s]*[^\s]+/gi, 'authorization:[REDACTED]');
    message = message.replace(/bearer\s+[^\s]+/gi, 'bearer [REDACTED]');
    
    // Truncate if too long
    if (message.length > 200) {
      message = message.substring(0, 197) + '...';
    }
    
    return message;
  }
  
  logDbOperation(tableName: string, operation: string, duration: number, traceId?: string) {
    if (!this.isDebugMode) return;
    
    const logLine = `[AI Debug] DB ${operation.toUpperCase()} ${tableName} | Duration: ${Math.round(duration)}ms | Trace: ${traceId || 'none'}`;
    console.log(logLine);
  }
}

export const aiDebugMiddleware = AISettingsDebugMiddleware.getInstance();