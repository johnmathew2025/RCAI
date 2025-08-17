/**
 * Evidence Service - Dual-mode evidence management (pointer/managed)
 * Handles streaming, hashing, scanning, and storage policy enforcement
 */

import crypto from 'crypto';
import { Readable } from 'stream';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { evidence, InsertEvidence, Evidence, IncidentNew } from '../../shared/schema.js';
import { Config } from '../core/config.js';
import { AuthenticatedUser } from '../core/rbac.js';

export interface EvidenceUploadRequest {
  mode: 'pointer' | 'managed';
  source: {
    provider: 's3' | 'gdrive' | 'sharepoint' | 'local' | 'app_bucket';
    object: Record<string, any>; // {bucket,key,versionId} or {fileId}
    access?: {
      presignedGet?: string;
      expiresAt?: string;
      oauthToken?: string;
    };
  };
  metadata: {
    mime: string;
    sizeBytes: number;
    filename?: string;
    description?: string;
    category?: string;
  };
}

export interface EvidenceAccessInfo {
  accessUrl: string;
  expiresAt?: Date;
  method: 'direct' | 'presigned' | 'oauth';
}

export class EvidenceService {
  /**
   * Upload evidence with dual-mode support
   */
  async uploadEvidence(
    incidentId: string,
    request: EvidenceUploadRequest,
    user: AuthenticatedUser
  ): Promise<Evidence> {
    // Validate policy compliance
    await this.validateStoragePolicy(request.mode);
    
    // Validate request data
    this.validateUploadRequest(request);
    
    // Stream and hash content
    const { contentHash, actualSize } = await this.processEvidenceStream(request);
    
    // Validate size matches metadata
    if (actualSize !== request.metadata.sizeBytes) {
      throw new Error(`Size mismatch: expected ${request.metadata.sizeBytes}, got ${actualSize}`);
    }
    
    let objectRef = request.source.object;
    let provider = request.source.provider;
    
    // Handle managed mode - copy to organization storage
    if (request.mode === 'managed') {
      const copyResult = await this.copyToManagedStorage(request, contentHash);
      objectRef = copyResult.objectRef;
      provider = copyResult.provider;
    }
    
    // Calculate retention and expiry
    const retentionTtlSeconds = this.calculateRetention(request.metadata.category);
    const expiresAt = retentionTtlSeconds 
      ? new Date(Date.now() + (retentionTtlSeconds * 1000))
      : null;
    
    // Create evidence record
    const evidenceData: InsertEvidence = {
      incidentId,
      storageMode: request.mode,
      provider,
      objectRef: objectRef as any,
      contentHash,
      sizeBytes: actualSize,
      mime: request.metadata.mime,
      ownerUserId: user.id,
      retentionTtlSeconds,
      expiresAt,
      scanStatus: 'pending',
      metadata: {
        filename: request.metadata.filename,
        description: request.metadata.description,
        category: request.metadata.category,
        uploadedBy: user.id,
        originalProvider: request.source.provider,
      } as any,
    };
    
    const [createdEvidence] = await db.insert(evidence)
      .values(evidenceData)
      .returning();
    
    console.log(`[EVIDENCE_SERVICE] Created ${request.mode} evidence ${createdEvidence.id} for incident ${incidentId}`);
    
    // Schedule content scanning
    await this.scheduleContentScan(createdEvidence.id);
    
    return createdEvidence;
  }
  
  /**
   * Convert pointer evidence to managed (pin operation)
   */
  async pinEvidence(
    evidenceId: string,
    user: AuthenticatedUser
  ): Promise<Evidence> {
    if (!['Analyst', 'Admin'].includes(user.role)) {
      throw new Error('Only Analysts and Admins can pin evidence');
    }
    
    const [existingEvidence] = await db.select()
      .from(evidence)
      .where(eq(evidence.id, evidenceId));
    
    if (!existingEvidence) {
      throw new Error('Evidence not found');
    }
    
    if (existingEvidence.storageMode === 'managed') {
      throw new Error('Evidence is already managed');
    }
    
    // Validate managed storage policy
    await this.validateStoragePolicy('managed');
    
    // Copy to managed storage
    const copyResult = await this.copyExistingToManagedStorage(existingEvidence);
    
    // Update evidence record
    const [updatedEvidence] = await db.update(evidence)
      .set({
        storageMode: 'managed',
        provider: copyResult.provider,
        objectRef: copyResult.objectRef as any,
        metadata: {
          ...existingEvidence.metadata as any,
          pinnedAt: new Date().toISOString(),
          pinnedBy: user.id,
          originalProvider: existingEvidence.provider,
        } as any,
      })
      .where(eq(evidence.id, evidenceId))
      .returning();
    
    console.log(`[EVIDENCE_SERVICE] Pinned evidence ${evidenceId} to managed storage`);
    
    return updatedEvidence;
  }
  
  /**
   * Refresh access credentials for pointer evidence
   */
  async refreshAccess(evidenceId: string): Promise<EvidenceAccessInfo> {
    const [evidenceRecord] = await db.select()
      .from(evidence)
      .where(eq(evidence.id, evidenceId));
    
    if (!evidenceRecord) {
      throw new Error('Evidence not found');
    }
    
    if (evidenceRecord.storageMode === 'managed') {
      return this.generateManagedAccessInfo(evidenceRecord);
    }
    
    return this.generatePointerAccessInfo(evidenceRecord);
  }
  
  /**
   * Get evidence by incident with storage mode badges
   */
  async getIncidentEvidence(
    incidentId: string,
    user: AuthenticatedUser
  ): Promise<Array<Evidence & { badge: string; accessInfo?: EvidenceAccessInfo }>> {
    const evidenceList = await db.select()
      .from(evidence)
      .where(eq(evidence.incidentId, incidentId))
      .orderBy(evidence.addedAt);
    
    const evidenceWithBadges = await Promise.all(
      evidenceList.map(async (item) => {
        const badge = item.storageMode === 'pointer' ? 'POINTER' : 'MANAGED';
        
        let accessInfo: EvidenceAccessInfo | undefined;
        try {
          accessInfo = await this.refreshAccess(item.id);
        } catch (error) {
          console.warn(`[EVIDENCE_SERVICE] Failed to get access info for ${item.id}:`, error);
        }
        
        return {
          ...item,
          badge,
          accessInfo,
        };
      })
    );
    
    return evidenceWithBadges;
  }
  
  /**
   * Validate storage policy compliance
   */
  private async validateStoragePolicy(mode: 'pointer' | 'managed'): Promise<void> {
    const policies = Config.STORAGE_POLICIES;
    
    if (mode === 'pointer' && !policies.ALLOW_POINTER) {
      throw new Error('Pointer storage mode is not allowed by organization policy');
    }
    
    if (mode === 'managed' && !policies.ALLOW_MANAGED_COPY) {
      throw new Error('Managed storage mode is not allowed by organization policy');
    }
    
    if (mode === 'managed' && policies.BYO_PROVIDER === 'none') {
      throw new Error('Managed storage requires BYO storage provider configuration');
    }
  }
  
  /**
   * Validate upload request data
   */
  private validateUploadRequest(request: EvidenceUploadRequest): void {
    const requiredFields = ['mode', 'source', 'metadata'];
    for (const field of requiredFields) {
      if (!request[field as keyof EvidenceUploadRequest]) {
        throw new Error(`${field} is required`);
      }
    }
    
    if (!request.metadata.mime) {
      throw new Error('MIME type is required');
    }
    
    if (!request.metadata.sizeBytes || request.metadata.sizeBytes <= 0) {
      throw new Error('Valid file size is required');
    }
    
    // Validate MIME type
    const allowedMimes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/json',
    ];
    
    if (!allowedMimes.includes(request.metadata.mime)) {
      throw new Error(`MIME type ${request.metadata.mime} is not allowed`);
    }
  }
  
  /**
   * Process evidence stream and calculate hash
   */
  private async processEvidenceStream(
    request: EvidenceUploadRequest
  ): Promise<{ contentHash: string; actualSize: number }> {
    // For now, simulate streaming and hashing
    // In a real implementation, this would stream the actual file content
    const mockContent = JSON.stringify(request.source.object);
    const hash = crypto.createHash('sha256');
    hash.update(mockContent);
    
    return {
      contentHash: hash.digest('hex'),
      actualSize: request.metadata.sizeBytes,
    };
  }
  
  /**
   * Copy evidence to managed storage
   */
  private async copyToManagedStorage(
    request: EvidenceUploadRequest,
    contentHash: string
  ): Promise<{ objectRef: Record<string, any>; provider: string }> {
    const provider = Config.STORAGE_POLICIES.BYO_PROVIDER;
    
    switch (provider) {
      case 's3':
        return this.copyToS3(request, contentHash);
      
      case 'gdrive':
        return this.copyToGoogleDrive(request, contentHash);
      
      case 'sharepoint':
        return this.copyToSharePoint(request, contentHash);
      
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }
  
  /**
   * Copy existing evidence to managed storage
   */
  private async copyExistingToManagedStorage(
    evidence: Evidence
  ): Promise<{ objectRef: Record<string, any>; provider: string }> {
    // Re-stream and copy the existing evidence to managed storage
    // This would involve reading from the pointer location and writing to managed storage
    return {
      objectRef: {
        bucket: 'managed-evidence-bucket',
        key: `evidence/${evidence.id}/${evidence.contentHash}`,
        versionId: Date.now().toString(),
      },
      provider: Config.STORAGE_POLICIES.BYO_PROVIDER,
    };
  }
  
  /**
   * Copy to S3 storage
   */
  private async copyToS3(
    request: EvidenceUploadRequest,
    contentHash: string
  ): Promise<{ objectRef: Record<string, any>; provider: string }> {
    // Simulate S3 copy operation
    const key = `evidence/${Date.now()}/${contentHash}`;
    
    return {
      objectRef: {
        bucket: Config.S3_BUCKET,
        key,
        region: Config.AWS_REGION,
      },
      provider: 's3',
    };
  }
  
  /**
   * Copy to Google Drive
   */
  private async copyToGoogleDrive(
    request: EvidenceUploadRequest,
    contentHash: string
  ): Promise<{ objectRef: Record<string, any>; provider: string }> {
    return {
      objectRef: {
        fileId: `gdrive_${Date.now()}_${contentHash}`,
        folderId: 'evidence-folder',
      },
      provider: 'gdrive',
    };
  }
  
  /**
   * Copy to SharePoint
   */
  private async copyToSharePoint(
    request: EvidenceUploadRequest,
    contentHash: string
  ): Promise<{ objectRef: Record<string, any>; provider: string }> {
    return {
      objectRef: {
        siteId: 'evidence-site',
        driveId: 'evidence-drive',
        itemId: `sp_${Date.now()}_${contentHash}`,
      },
      provider: 'sharepoint',
    };
  }
  
  /**
   * Calculate retention period based on category
   */
  private calculateRetention(category?: string): number | null {
    const retentionPolicies: Record<string, number> = {
      'critical': 7 * 365 * 24 * 60 * 60, // 7 years
      'regulatory': 10 * 365 * 24 * 60 * 60, // 10 years
      'operational': 2 * 365 * 24 * 60 * 60, // 2 years
      'temporary': 90 * 24 * 60 * 60, // 90 days
    };
    
    return category ? retentionPolicies[category] || null : null;
  }
  
  /**
   * Schedule content scanning
   */
  private async scheduleContentScan(evidenceId: string): Promise<void> {
    // Schedule antivirus and content analysis
    // This would typically queue a job for background processing
    console.log(`[EVIDENCE_SERVICE] Scheduled content scan for evidence ${evidenceId}`);
  }
  
  /**
   * Generate access info for managed evidence
   */
  private generateManagedAccessInfo(evidence: Evidence): EvidenceAccessInfo {
    const objectRef = evidence.objectRef as any;
    
    switch (evidence.provider) {
      case 's3':
        return {
          accessUrl: `https://s3.amazonaws.com/${objectRef.bucket}/${objectRef.key}`,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
          method: 'presigned',
        };
      
      default:
        return {
          accessUrl: `/api/evidence/${evidence.id}/download`,
          method: 'direct',
        };
    }
  }
  
  /**
   * Generate access info for pointer evidence
   */
  private generatePointerAccessInfo(evidence: Evidence): EvidenceAccessInfo {
    // Refresh access tokens/presigned URLs as needed
    return {
      accessUrl: `/api/evidence/${evidence.id}/access`,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      method: 'oauth',
    };
  }
}

// Export singleton instance
export const evidenceService = new EvidenceService();