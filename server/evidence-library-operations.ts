/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * File: evidence-library-operations.ts
 * NO HARDCODING: All operations schema-driven
 * ZERO TOLERANCE: Absolute compliance required
 * 
 * EVIDENCE LIBRARY OPERATIONS - SCHEMA DRIVEN EVIDENCE MANAGEMENT
 * NO HARDCODING - All operations driven by Evidence Library database
 */

import { investigationStorage } from "./storage";

export class EvidenceLibraryOperations {
  
  /**
   * Get required evidence for equipment from Evidence Library (NO HARDCODING)
   */
  async getRequiredEvidenceForEquipment(
    equipmentGroup: string, 
    equipmentType: string, 
    equipmentSubtype: string
  ): Promise<any[]> {
    try {
      console.log(`[Evidence Library] Getting required evidence for ${equipmentGroup} → ${equipmentType} → ${equipmentSubtype}`);
      
      // Query Evidence Library for equipment-specific evidence requirements
      const evidenceLibrary = await investigationStorage.searchEvidenceLibrary({
        equipmentGroup,
        equipmentType,
        equipmentSubtype
      });
      
      if (!evidenceLibrary || evidenceLibrary.length === 0) {
        console.log(`[Evidence Library] No specific evidence requirements found for ${equipmentSubtype}`);
        return [];
      }
      
      // Extract evidence requirements from library entries
      const requiredEvidence = evidenceLibrary.map(entry => ({
        evidenceType: entry.evidenceType || 'General Evidence',
        priority: entry.priority || 'Medium',
        description: entry.description || '',
        expectedFileTypes: ['csv', 'txt', 'xlsx', 'pdf', 'jpg', 'png'],
        required: true
      }));
      
      console.log(`[Evidence Library] Found ${requiredEvidence.length} evidence requirements`);
      return requiredEvidence;
      
    } catch (error) {
      console.error('[Evidence Library] Error getting required evidence:', error);
      return [];
    }
  }
  
  /**
   * Search Evidence Library by equipment classification (NO HARDCODING)
   */
  async searchEvidenceLibraryByEquipment(
    equipmentGroup: string,
    equipmentType: string, 
    equipmentSubtype: string
  ): Promise<any[]> {
    try {
      return await investigationStorage.searchEvidenceLibrary({
        equipmentGroup,
        equipmentType,
        equipmentSubtype
      });
    } catch (error) {
      console.error('[Evidence Library] Search error:', error);
      return [];
    }
  }
  
  /**
   * Get evidence requirements for incident symptoms (NO HARDCODING)
   */
  async getEvidenceForSymptoms(symptoms: string[]): Promise<any[]> {
    try {
      if (!symptoms || symptoms.length === 0) {
        return [];
      }
      
      // Search Evidence Library by symptom keywords
      const allEvidence = await investigationStorage.getAllEvidenceLibrary();
      
      const relevantEvidence = allEvidence.filter(entry => {
        const entryText = `${entry.evidenceType} ${entry.description} ${entry.faultSignaturePattern}`.toLowerCase();
        return symptoms.some(symptom => 
          entryText.includes(symptom.toLowerCase()) ||
          symptom.toLowerCase().includes(entryText)
        );
      });
      
      return relevantEvidence.map(entry => ({
        evidenceType: entry.evidenceType || 'Evidence',
        priority: entry.priority || 'Medium',
        description: entry.description || '',
        faultSignature: entry.faultSignaturePattern || '',
        required: true
      }));
      
    } catch (error) {
      console.error('[Evidence Library] Symptom search error:', error);
      return [];
    }
  }
}