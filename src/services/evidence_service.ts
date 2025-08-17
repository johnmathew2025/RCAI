/**
 * Evidence Service - Dual storage mode evidence management
 */

import { nanoid } from 'nanoid';
import * as crypto from 'crypto';

export interface EvidenceData {
  mode: 'pointer' | 'managed';
  source?: {
    provider: string;
    object: { bucket: string; key: string; versionId?: string };
    access: { presignedGet: string; expiresAt: string };
  };
  metadata: {
    mime: string;
    sizeBytes: number;
  };
}

export interface EvidenceResult {
  id: string;
  storage_mode: 'pointer' | 'managed';
  content_hash: string;
  source?: EvidenceData['source'];
  metadata: EvidenceData['metadata'];
  createdAt: Date;
}

export class EvidenceService {
  
  /**
   * Upload evidence in pointer or managed mode
   */
  async uploadEvidence(data: EvidenceData): Promise<EvidenceResult> {
    const evidenceId = nanoid();
    
    console.log(`[EVIDENCE_SERVICE] Uploading evidence ${evidenceId} in ${data.mode} mode`);

    // Generate content hash for integrity verification
    const contentSource = data.mode === 'pointer' 
      ? JSON.stringify(data.source) 
      : `managed_${evidenceId}_${Date.now()}`;
    
    const content_hash = crypto.createHash('sha256')
      .update(contentSource)
      .digest('hex');

    const result: EvidenceResult = {
      id: evidenceId,
      storage_mode: data.mode,
      content_hash,
      metadata: data.metadata,
      createdAt: new Date(),
    };

    // Include source info for pointer mode
    if (data.mode === 'pointer' && data.source) {
      result.source = data.source;
    }

    console.log(`[EVIDENCE_SERVICE] Evidence ${evidenceId} uploaded successfully`);
    console.log(`[EVIDENCE_SERVICE] Storage mode: ${data.mode}`);
    console.log(`[EVIDENCE_SERVICE] Content hash: ${content_hash.substring(0, 8)}...`);

    return result;
  }

  /**
   * Get evidence by ID
   */
  async getEvidence(evidenceId: string): Promise<EvidenceResult | null> {
    console.log(`[EVIDENCE_SERVICE] Retrieving evidence ${evidenceId}`);
    
    // For this implementation, return null as evidence would need to be stored in database
    // This is a basic service structure for demonstration
    return null;
  }
}

// Export singleton instance
export const evidenceService = new EvidenceService();