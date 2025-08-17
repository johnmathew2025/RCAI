/**
 * Evidence API Routes - Dual-mode evidence management
 * Handles pointer/managed evidence with streaming and hashing
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../core/rbac.js';
import { evidenceService } from '../services/evidence_service.js';

const router = Router();

// Request validation schemas
const refreshAccessSchema = z.object({
  evidenceId: z.string().uuid('Invalid evidence ID'),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * POST /api/evidence/:id/pin - Convert pointer evidence to managed
 */
router.post('/:id/pin', authorize('PIN_EVIDENCE'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const pinnedEvidence = await evidenceService.pinEvidence(id, req.user!);
    
    res.json({
      success: true,
      data: {
        ...pinnedEvidence,
        badge: 'MANAGED', // Updated badge after pinning
      },
      message: 'Evidence successfully pinned to managed storage',
    });
    
  } catch (error) {
    console.error('[EVIDENCE_API] Pin evidence error:', error);
    res.status(500).json({
      error: 'Failed to pin evidence',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/evidence/:id/refresh-access - Refresh access credentials
 */
router.post('/:id/refresh-access', authorize('VIEW_EVIDENCE'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const accessInfo = await evidenceService.refreshAccess(id);
    
    res.json({
      success: true,
      data: accessInfo,
      message: 'Access credentials refreshed successfully',
    });
    
  } catch (error) {
    console.error('[EVIDENCE_API] Refresh access error:', error);
    res.status(500).json({
      error: 'Failed to refresh access',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/evidence/:id/access - Get evidence access URL
 * This endpoint provides proxied access to pointer evidence
 */
router.get('/:id/access', authorize('VIEW_EVIDENCE'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const accessInfo = await evidenceService.refreshAccess(id);
    
    // For pointer evidence, this would proxy the request to the original source
    // For managed evidence, this would serve from organization storage
    
    if (accessInfo.method === 'direct') {
      // Redirect to internal download endpoint
      return res.redirect(accessInfo.accessUrl);
    }
    
    if (accessInfo.method === 'presigned') {
      // Redirect to presigned URL
      return res.redirect(accessInfo.accessUrl);
    }
    
    if (accessInfo.method === 'oauth') {
      // Return OAuth access information
      return res.json({
        success: true,
        data: {
          accessUrl: accessInfo.accessUrl,
          method: 'oauth',
          expiresAt: accessInfo.expiresAt,
        },
        message: 'OAuth access URL generated',
      });
    }
    
    res.status(400).json({
      error: 'Unsupported access method',
      message: `Access method ${accessInfo.method} is not supported`,
    });
    
  } catch (error) {
    console.error('[EVIDENCE_API] Get evidence access error:', error);
    res.status(500).json({
      error: 'Failed to get evidence access',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/evidence/:id/download - Direct download for managed evidence
 */
router.get('/:id/download', authorize('VIEW_EVIDENCE'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // This would implement the actual file streaming logic
    // For now, return a placeholder response
    
    res.json({
      success: false,
      error: 'Download not implemented',
      message: 'Direct download will be implemented with actual storage integration',
      evidenceId: id,
    });
    
  } catch (error) {
    console.error('[EVIDENCE_API] Download evidence error:', error);
    res.status(500).json({
      error: 'Failed to download evidence',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/evidence/stats - Get evidence statistics
 */
router.get('/stats', authorize('VIEW_EVIDENCE'), async (req, res) => {
  try {
    // This would implement comprehensive evidence statistics
    // For now, return a placeholder
    
    res.json({
      success: true,
      data: {
        total: 0,
        pointer: 0,
        managed: 0,
        totalSizeBytes: 0,
        scanPending: 0,
        scanClean: 0,
        scanInfected: 0,
      },
      message: 'Evidence statistics (placeholder)',
    });
    
  } catch (error) {
    console.error('[EVIDENCE_API] Get evidence stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve evidence statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;