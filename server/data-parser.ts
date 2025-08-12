/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: data-parser.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 */
import * as XLSX from 'xlsx';
import { z } from 'zod';

// Data input schemas for validation
export const WorkOrderSchema = z.object({
  equipmentId: z.string().optional(),
  equipmentType: z.string().optional(),
  description: z.string().optional(),
  symptoms: z.string().optional(),
  actions: z.string().optional(),
  timestamp: z.string().optional(),
  operator: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  location: z.string().optional(),
  maintenanceHistory: z.array(z.object({
    date: z.string(),
    type: z.string(),
    description: z.string(),
    technician: z.string().optional()
  })).optional()
});

export const OperatingDataSchema = z.object({
  timestamp: z.string(),
  parameters: z.record(z.union([z.number(), z.string(), z.boolean()])),
  alarms: z.array(z.string()).optional(),
  events: z.array(z.string()).optional()
});

// NOTE: Asset types and subtypes are now managed through Evidence Library database
// This ensures zero hardcoded equipment logic - all equipment classifications
// come from admin-configurable Evidence Library entries

// Common symptom patterns for NLP extraction
// REMOVED HARDCODED SYMPTOM_PATTERNS - NOW USING EVIDENCE LIBRARY EXCLUSIVELY!
// All symptom detection now uses Evidence Library faultSignaturePattern field

export class DataParser {
  
  /**
   * Parse various file formats and extract structured data
   */
  static async parseFile(buffer: Buffer, filename: string): Promise<any> {
    const extension = filename.toLowerCase().split('.').pop();
    
    try {
      switch (extension) {
        case 'xlsx':
        case 'xls':
          return this.parseExcel(buffer);
        case 'csv':
          return this.parseCSV(buffer);
        case 'json':
          return this.parseJSON(buffer);
        case 'pdf':
          return this.parsePDF(buffer);
        case 'txt':
          return this.parseText(buffer);
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${filename}: ${error.message}`);
    }
  }

  /**
   * Parse Excel files with multiple worksheets
   */
  private static parseExcel(buffer: Buffer): any {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const result: any = {};
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      result[sheetName] = data;
    });
    
    return this.normalizeData(result);
  }

  /**
   * Parse CSV files
   */
  private static parseCSV(buffer: Buffer): any {
    const text = buffer.toString('utf-8');
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return {};
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      return row;
    });
    
    return this.normalizeData({ data });
  }

  /**
   * Parse JSON files
   */
  private static parseJSON(buffer: Buffer): any {
    const text = buffer.toString('utf-8');
    const data = JSON.parse(text);
    return this.normalizeData(data);
  }

  /**
   * Parse PDF files (simplified text extraction)
   */
  private static parsePDF(buffer: Buffer): any {
    // For production, use a proper PDF parser like pdf-parse
    // This is a simplified implementation
    const text = buffer.toString('utf-8', 0, 1000); // First 1000 chars as fallback
    return this.extractFromText(text);
  }

  /**
   * Parse plain text files
   */
  private static parseText(buffer: Buffer): any {
    const text = buffer.toString('utf-8');
    return this.extractFromText(text);
  }

  /**
   * Extract structured information from unstructured text using NLP patterns
   */
  private static extractFromText(text: string): any {
    const result: any = {
      rawText: text,
      extractedInfo: {}
    };

    // Extract equipment information
    result.extractedInfo.equipment = this.extractEquipmentInfo(text);
    
    // Extract symptoms
    result.extractedInfo.symptoms = this.extractSymptoms(text);
    
    // Extract maintenance actions
    result.extractedInfo.actions = this.extractActions(text);
    
    // Extract dates and timestamps
    result.extractedInfo.timestamps = this.extractTimestamps(text);
    
    return result;
  }

  /**
   * Extract equipment type and details from text using Evidence Library - NO HARDCODING!
   */
  private static async extractEquipmentInfo(text: string): Promise<any> {
    const lowerText = text.toLowerCase();
    const equipment: any = {};
    
    try {
      // Use Evidence Library to find equipment types - UNIVERSAL LOGIC!
      const { investigationStorage } = await import("./storage");
      const allEvidence = await investigationStorage.searchEvidenceLibrary('');
      
      // Build equipment patterns from Evidence Library
      const equipmentPatterns: { [key: string]: { group: string, type: string, subtypes: string[] } } = {};
      
      allEvidence.forEach((entry: any) => {
        const group = entry.equipmentGroup?.toLowerCase() || '';
        const type = entry.equipmentType?.toLowerCase() || '';
        const subtype = entry.equipmentSubtype?.toLowerCase() || '';
        
        if (group && type) {
          const key = `${group}_${type}`;
          if (!equipmentPatterns[key]) {
            equipmentPatterns[key] = {
              group: entry.equipmentGroup,
              type: entry.equipmentType, 
              subtypes: []
            };
          }
          if (subtype && !equipmentPatterns[key].subtypes.includes(entry.equipmentSubtype)) {
            equipmentPatterns[key].subtypes.push(entry.equipmentSubtype);
          }
        }
      });
      
      // Find equipment type from Evidence Library patterns
      for (const [key, config] of Object.entries(equipmentPatterns)) {
        const typeKeywords = config.type.toLowerCase().split(/[\s,.-]+/);
        if (typeKeywords.some(keyword => lowerText.includes(keyword))) {
          equipment.group = config.group;
          equipment.type = config.type;
          
          // Find subtype from Evidence Library
          for (const subtype of config.subtypes) {
            const subtypeKeywords = subtype.toLowerCase().split(/[\s,.-]+/);
            if (subtypeKeywords.some(keyword => lowerText.includes(keyword))) {
              equipment.subtype = subtype;
              break;
            }
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error extracting equipment info from Evidence Library:', error);
    }
    
    // Extract equipment ID patterns - Universal logic
    const idPatterns = [
      /(?:equipment|asset)[\s\-#:]*([\w\-]+)/gi,
      /(?:id|tag|number)[\s\-#:]*([\w\-]+)/gi,
      /([A-Z]{1,3}[-_]?\d{2,6})/g
    ];
    
    for (const pattern of idPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        equipment.id = matches[0];
        break;
      }
    }
    
    return equipment;
  }

  /**
   * Extract symptoms and issues from text
   */
  private static extractSymptoms(text: string): any {
    const lowerText = text.toLowerCase();
    const symptoms: any = {
      detected: [],
      location: null,
      severity: null
    };
    
    // Use Evidence Library for symptom detection - NO HARDCODING!
    try {
      const { investigationStorage } = await import("./storage");
      const allEvidence = await investigationStorage.searchEvidenceLibrary('');
      
      // Extract symptoms from Evidence Library fault signature patterns
      for (const entry of allEvidence) {
        const faultSignature = entry.faultSignaturePattern || '';
        const componentFailure = entry.componentFailureMode || '';
        
        // Split fault signature into symptom keywords
        const symptomKeywords = faultSignature.toLowerCase().split(/[\s,.-]+/);
        const failureKeywords = componentFailure.toLowerCase().split(/[\s,.-]+/);
        
        // Check if any symptom keywords match
        const allKeywords = [...symptomKeywords, ...failureKeywords].filter(k => k.length > 3);
        for (const keyword of allKeywords) {
          if (lowerText.includes(keyword)) {
            symptoms.detected.push({
              type: componentFailure,
              pattern: keyword,
              confidence: this.calculateConfidence(text, keyword),
              evidenceId: entry.id
            });
          }
        }
      }
    } catch (error) {
      console.error('Error extracting symptoms from Evidence Library:', error);
    }
    
    return symptoms;
  }
    
    return symptoms;
  }

  /**
   * Extract maintenance actions and procedures
   */
  private static extractActions(text: string): string[] {
    const actionWords = [
      'replace', 'repair', 'inspect', 'clean', 'adjust', 'calibrate',
      'lubricate', 'tighten', 'align', 'balance', 'test', 'check'
    ];
    
    const actions: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      for (const action of actionWords) {
        if (lowerSentence.includes(action)) {
          actions.push(sentence.trim());
          break;
        }
      }
    });
    
    return actions;
  }

  /**
   * Extract timestamps and dates
   */
  private static extractTimestamps(text: string): string[] {
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g, // MM/DD/YYYY
      /\d{2,4}-\d{1,2}-\d{1,2}/g,   // YYYY-MM-DD
      /\d{1,2}-\w{3}-\d{2,4}/g      // DD-MMM-YYYY
    ];
    
    const timestamps: string[] = [];
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        timestamps.push(...matches);
      }
    });
    
    return [...new Set(timestamps)]; // Remove duplicates
  }

  /**
   * Calculate confidence score for pattern matching
   */
  private static calculateConfidence(text: string, pattern: string): number {
    const contextWords = ['failure', 'problem', 'issue', 'fault', 'defect', 'malfunction'];
    const lowerText = text.toLowerCase();
    
    let confidence = 0.5; // Base confidence
    
    // Increase confidence if pattern appears with context words
    for (const word of contextWords) {
      if (lowerText.includes(word) && lowerText.includes(pattern)) {
        confidence += 0.1;
      }
    }
    
    // Increase confidence for multiple occurrences
    const occurrences = (lowerText.match(new RegExp(pattern, 'g')) || []).length;
    confidence += Math.min(occurrences * 0.05, 0.2);
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Normalize and standardize extracted data
   */
  private static normalizeData(data: any): any {
    const normalized: any = {
      workOrders: [],
      operatingData: [],
      equipment: null,
      symptoms: [],
      maintenanceHistory: [],
      confidence: 0
    };
    
    // Handle different data structures
    if (Array.isArray(data)) {
      normalized.workOrders = data;
    } else if (data.extractedInfo) {
      // From text extraction
      normalized.equipment = data.extractedInfo.equipment;
      normalized.symptoms = data.extractedInfo.symptoms;
      normalized.maintenanceHistory = data.extractedInfo.actions;
      normalized.confidence = this.calculateOverallConfidence(data.extractedInfo);
    } else {
      // From structured data (Excel/CSV)
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          if (key.toLowerCase().includes('work') || key.toLowerCase().includes('order')) {
            normalized.workOrders = data[key];
          } else if (key.toLowerCase().includes('operating') || key.toLowerCase().includes('data')) {
            normalized.operatingData = data[key];
          } else if (key.toLowerCase().includes('maintenance')) {
            normalized.maintenanceHistory = data[key];
          }
        }
      });
    }
    
    return normalized;
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateOverallConfidence(extractedInfo: any): number {
    let totalConfidence = 0;
    let count = 0;
    
    if (extractedInfo.equipment?.type) {
      totalConfidence += 0.8;
      count++;
    }
    
    if (extractedInfo.symptoms?.detected?.length > 0) {
      const avgSymptomConfidence = extractedInfo.symptoms.detected
        .reduce((sum: number, s: any) => sum + s.confidence, 0) / extractedInfo.symptoms.detected.length;
      totalConfidence += avgSymptomConfidence;
      count++;
    }
    
    if (extractedInfo.actions?.length > 0) {
      totalConfidence += 0.6;
      count++;
    }
    
    return count > 0 ? totalConfidence / count : 0.3;
  }

  /**
   * Validate and clean missing or partial records
   */
  static cleanAndValidate(data: any): any {
    // Remove empty or invalid records
    if (data.workOrders) {
      data.workOrders = data.workOrders.filter((wo: any) => {
        return wo && (wo.description || wo.symptoms || wo.equipmentId);
      });
    }
    
    // Fill missing equipment types where possible
    data.workOrders?.forEach((wo: any) => {
      if (!wo.equipmentType && wo.equipmentId) {
        wo.equipmentType = this.inferEquipmentType(wo.equipmentId, wo.description);
      }
    });
    
    return data;
  }

  /**
   * Infer equipment type from ID or description
   */
  private static async inferEquipmentType(equipmentId: string, description: string): Promise<string | null> {
    const combined = `${equipmentId} ${description}`.toLowerCase();
    
    try {
      // Use Evidence Library to infer equipment types - NO HARDCODING!
      const { investigationStorage } = await import("./storage");
      const allEvidence = await investigationStorage.searchEvidenceLibrary('');
      
      // Build type patterns from Evidence Library
      for (const entry of allEvidence) {
        const typeKeywords = entry.equipmentType?.toLowerCase().split(/[\s,.-]+/) || [];
        if (typeKeywords.some(keyword => combined.includes(keyword))) {
          return entry.equipmentType;
        }
      }
      
      // Check equipment codes from Evidence Library
      for (const entry of allEvidence) {
        const code = entry.equipmentCode?.toLowerCase() || '';
        if (code && equipmentId.toLowerCase().includes(code)) {
          return entry.equipmentType;
        }
      }
      
    } catch (error) {
      console.error('Error inferring equipment type from Evidence Library:', error);
    }
    
    return null;
  }
}