/**
 * Evidence Router - Evidence upload and management in dual storage modes
 */

import { Router } from 'express';
import { evidenceService } from '../services/evidence_service.js';

const router = Router();

// POST / - Upload evidence (pointer or managed mode)
router.post('/', async (req, res) => {
  try {
    console.log('[EVIDENCE] Uploading evidence:', req.body);
    
    const evidenceData = req.body;
    const result = await evidenceService.uploadEvidence(evidenceData);
    
    res.json(result);
  } catch (error) {
    console.error('[EVIDENCE] Error uploading evidence:', error);
    res.status(500).json({ 
      error: 'Failed to upload evidence',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /:id - Get evidence by ID
router.get('/:id', async (req, res) => {
  try {
    const evidenceId = req.params.id;
    console.log('[EVIDENCE] Getting evidence:', evidenceId);
    
    const evidence = await evidenceService.getEvidence(evidenceId);
    
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }
    
    res.json(evidence);
  } catch (error) {
    console.error('[EVIDENCE] Error getting evidence:', error);
    res.status(500).json({ 
      error: 'Failed to get evidence',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;