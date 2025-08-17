/**
 * Workflows Router - Step 8 workflow initiation and management
 */

import { Router } from 'express';
import { workflowService } from '../services/workflow_service.js';

const router = Router();

// POST /initiate - Initiate workflow (Analyst+)
router.post('/initiate', async (req, res) => {
  try {
    console.log('[WORKFLOWS] Initiating workflow:', req.body);
    
    const workflowData = req.body;
    const result = await workflowService.initiateWorkflow(workflowData);
    
    res.json(result);
  } catch (error) {
    console.error('[WORKFLOWS] Error initiating workflow:', error);
    res.status(500).json({ 
      error: 'Failed to initiate workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /:id/notifications/preview - Preview notifications (dry-run)
router.post('/:id/notifications/preview', async (req, res) => {
  try {
    const workflowId = req.params.id;
    console.log('[WORKFLOWS] Previewing notifications for workflow:', workflowId);
    
    const preview = await workflowService.previewNotifications(workflowId, req.body);
    
    res.json(preview);
  } catch (error) {
    console.error('[WORKFLOWS] Error previewing notifications:', error);
    res.status(500).json({ 
      error: 'Failed to preview notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /:id/approve - Approve workflow (Approver+)
router.post('/:id/approve', async (req, res) => {
  try {
    const workflowId = req.params.id;
    const { decision, comment } = req.body;
    
    console.log('[WORKFLOWS] Approving workflow:', workflowId, decision);
    
    const result = await workflowService.approveWorkflow(workflowId, decision, comment);
    
    res.json(result);
  } catch (error) {
    console.error('[WORKFLOWS] Error approving workflow:', error);
    res.status(500).json({ 
      error: 'Failed to approve workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;