/**
 * Cron API Routes - Internal scheduler endpoints
 * Handles milestone reminders and SLA monitoring
 */

import { Router } from 'express';
import { schedulerService } from '../services/scheduler.js';
import { notificationService } from '../services/notification_service.js';

const router = Router();

// Internal endpoint protection - simple key-based auth
const authenticateInternal = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-internal-key'];
  const expectedKey = process.env.INTERNAL_API_KEY || 'cron-key-change-in-production';
  
  if (apiKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid internal API key required',
    });
  }
  
  next();
};

/**
 * POST /internal/cron/process-reminders - Main cron endpoint
 * Called by external cron service or scheduler to process SLA reminders
 */
router.post('/process-reminders', authenticateInternal, async (req, res) => {
  try {
    console.log('[CRON_API] Processing reminders triggered via API');
    
    const results = await schedulerService.processReminders();
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      message: `Processed ${results.milestoneReminders + results.slaWarnings} reminders, sent ${results.notificationsSent} notifications`,
    });
    
  } catch (error) {
    console.error('[CRON_API] Process reminders error:', error);
    res.status(500).json({
      error: 'Failed to process reminders',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /internal/cron/send-notifications - Process queued notifications
 */
router.post('/send-notifications', authenticateInternal, async (req, res) => {
  try {
    console.log('[CRON_API] Processing queued notifications via API');
    
    const results = await notificationService.processQueuedNotifications();
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      message: `Sent ${results.sent} notifications, ${results.failed} failed`,
    });
    
  } catch (error) {
    console.error('[CRON_API] Send notifications error:', error);
    res.status(500).json({
      error: 'Failed to send notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /internal/cron/stats - Get scheduler statistics
 */
router.get('/stats', authenticateInternal, async (req, res) => {
  try {
    const [schedulerStats, notificationStats] = await Promise.all([
      schedulerService.getStats(),
      notificationService.getNotificationStats(),
    ]);
    
    res.json({
      success: true,
      data: {
        scheduler: schedulerStats,
        notifications: notificationStats,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[CRON_API] Get stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /internal/cron/trigger - Manually trigger processing (for testing)
 */
router.post('/trigger', authenticateInternal, async (req, res) => {
  try {
    console.log('[CRON_API] Manual trigger requested');
    
    const results = await schedulerService.triggerProcessing();
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      message: 'Manual processing completed',
    });
    
  } catch (error) {
    console.error('[CRON_API] Manual trigger error:', error);
    res.status(500).json({
      error: 'Failed to trigger processing',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /internal/health - Health check for monitoring
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await schedulerService.getStats();
    
    const health = {
      status: 'healthy',
      scheduler: {
        running: stats.isRunning,
        activeWorkflows: stats.activeWorkflows,
        overdueWorkflows: stats.overdueWorkflows,
      },
      timestamp: new Date().toISOString(),
    };
    
    // Mark as unhealthy if scheduler is not running or too many overdue workflows
    if (!stats.isRunning || stats.overdueWorkflows > 10) {
      health.status = 'unhealthy';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(health);
    
  } catch (error) {
    console.error('[CRON_API] Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;