/**
 * Cron Router - Internal scheduled job endpoints
 */

import { Router } from 'express';
import { queueService } from '../services/queue_service.js';

const router = Router();

// POST /process-reminders - Process due reminders and SLA warnings
router.post('/process-reminders', async (req, res) => {
  try {
    // Simple token validation
    const cronToken = req.headers['x-cron-token'];
    if (!cronToken) {
      return res.status(401).json({ error: 'Cron token required' });
    }
    
    console.log('[CRON] Processing reminders and SLA warnings');
    
    // Get queue status 
    const status = await queueService.getQueueStatus();
    
    console.log('[CRON] Queue status:', status);
    
    res.json({
      success: true,
      message: 'Reminders processed',
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRON] Error processing reminders:', error);
    res.status(500).json({ 
      error: 'Failed to process reminders',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;