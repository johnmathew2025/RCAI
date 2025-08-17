/**
 * Scheduler Service - Cron job management for SLA monitoring
 * Handles milestone reminders and SLA breach warnings
 */

import { eq, and, lt } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { workflows, notifications, InsertNotification } from '../../shared/schema.js';
import { Config } from '../core/config.js';
import { notificationService } from './notification_service.js';

export interface SchedulerJob {
  id: string;
  type: 'milestone_reminder' | 'sla_breach_warning';
  workflowId: string;
  scheduledFor: Date;
  data: Record<string, any>;
}

export class SchedulerService {
  private jobs: Map<string, SchedulerJob> = new Map();
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the scheduler (call on server startup)
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    console.log('[SCHEDULER] Starting scheduler service');
    
    this.isRunning = true;
    
    // Run every 5 minutes
    this.intervalId = setInterval(() => {
      this.processReminders().catch(error => {
        console.error('[SCHEDULER] Error processing reminders:', error);
      });
    }, 5 * 60 * 1000);

    // Process immediately on start
    this.processReminders().catch(error => {
      console.error('[SCHEDULER] Error in initial processing:', error);
    });
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('[SCHEDULER] Scheduler stopped');
  }

  /**
   * Process milestone reminders and SLA breach warnings
   * This is the main cron endpoint function
   */
  async processReminders(): Promise<{ 
    milestoneReminders: number;
    slaWarnings: number;
    notificationsSent: number;
    errors: string[];
  }> {
    const now = new Date();
    const results = {
      milestoneReminders: 0,
      slaWarnings: 0,
      notificationsSent: 0,
      errors: [] as string[],
    };

    try {
      console.log(`[SCHEDULER] Processing reminders at ${now.toISOString()}`);

      // Get active workflows that need attention
      const activeWorkflows = await db.select()
        .from(workflows)
        .where(eq(workflows.status, 'active'));

      for (const workflow of activeWorkflows) {
        try {
          // Check for milestone reminders (24h and 4h before due)
          const milestoneResults = await this.checkMilestoneReminders(workflow, now);
          results.milestoneReminders += milestoneResults.sent;

          // Check for SLA breach warnings (due date passed or approaching)
          const slaResults = await this.checkSLAWarnings(workflow, now);
          results.slaWarnings += slaResults.sent;

        } catch (error) {
          const errorMsg = `Error processing workflow ${workflow.id}: ${error}`;
          console.error(`[SCHEDULER] ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }

      // Process any queued notifications
      const notificationResults = await notificationService.processQueuedNotifications();
      results.notificationsSent = notificationResults.sent;

      console.log(`[SCHEDULER] Completed processing - Milestones: ${results.milestoneReminders}, SLA: ${results.slaWarnings}, Notifications: ${results.notificationsSent}`);

    } catch (error) {
      const errorMsg = `Critical scheduler error: ${error}`;
      console.error(`[SCHEDULER] ${errorMsg}`);
      results.errors.push(errorMsg);
    }

    return results;
  }

  /**
   * Check and send milestone reminders
   */
  private async checkMilestoneReminders(
    workflow: any,
    now: Date
  ): Promise<{ sent: number }> {
    const dueAt = new Date(workflow.dueAt);
    const workflowId = workflow.id;
    
    // 24-hour reminder
    const reminder24h = new Date(dueAt.getTime() - (24 * 60 * 60 * 1000));
    const reminder4h = new Date(dueAt.getTime() - (4 * 60 * 60 * 1000));
    
    let sent = 0;

    // Check if we should send 24h reminder
    if (now >= reminder24h && now < reminder4h) {
      const alreadySent = await this.hasReminderBeenSent(workflowId, 'milestone_24h');
      
      if (!alreadySent) {
        await notificationService.scheduleWorkflowNotification(
          workflowId,
          'milestone',
          {
            type: 'milestone_reminder',
            workflowId,
            timeRemaining: '24 hours',
            dueAt: dueAt.toISOString(),
          }
        );
        sent++;
        console.log(`[SCHEDULER] Sent 24h reminder for workflow ${workflowId}`);
      }
    }

    // Check if we should send 4h reminder
    if (now >= reminder4h && now < dueAt) {
      const alreadySent = await this.hasReminderBeenSent(workflowId, 'milestone_4h');
      
      if (!alreadySent) {
        await notificationService.scheduleWorkflowNotification(
          workflowId,
          'milestone',
          {
            type: 'milestone_reminder',
            workflowId,
            timeRemaining: '4 hours',
            dueAt: dueAt.toISOString(),
            urgent: true,
          }
        );
        sent++;
        console.log(`[SCHEDULER] Sent 4h reminder for workflow ${workflowId}`);
      }
    }

    return { sent };
  }

  /**
   * Check and send SLA breach warnings
   */
  private async checkSLAWarnings(
    workflow: any,
    now: Date
  ): Promise<{ sent: number }> {
    const dueAt = new Date(workflow.dueAt);
    const workflowId = workflow.id;
    
    let sent = 0;

    // Check if SLA has been breached
    if (now > dueAt) {
      const hoursOverdue = Math.floor((now.getTime() - dueAt.getTime()) / (60 * 60 * 1000));
      
      // Send breach notification every 24 hours after breach
      const shouldSendBreach = hoursOverdue % 24 === 0;
      
      if (shouldSendBreach) {
        const lastBreachSent = await this.getLastSLABreachNotification(workflowId);
        const hoursSinceLastBreach = lastBreachSent 
          ? Math.floor((now.getTime() - lastBreachSent.getTime()) / (60 * 60 * 1000))
          : 25; // Force send if no previous breach notification

        if (hoursSinceLastBreach >= 24) {
          await notificationService.scheduleWorkflowNotification(
            workflowId,
            'email',
            {
              type: 'sla_breach_warning',
              workflowId,
              breachSeverity: 'critical',
              hoursOverdue,
              originalDueDate: dueAt.toISOString(),
            }
          );
          sent++;
          console.log(`[SCHEDULER] Sent SLA breach warning for workflow ${workflowId} (${hoursOverdue}h overdue)`);
        }
      }
    }

    // Check for approaching SLA breach (within 2 hours)
    const warningThreshold = new Date(dueAt.getTime() - (2 * 60 * 60 * 1000));
    
    if (now >= warningThreshold && now < dueAt) {
      const alreadySent = await this.hasReminderBeenSent(workflowId, 'sla_warning');
      
      if (!alreadySent) {
        const minutesRemaining = Math.floor((dueAt.getTime() - now.getTime()) / (60 * 1000));
        
        await notificationService.scheduleWorkflowNotification(
          workflowId,
          'email',
          {
            type: 'sla_breach_warning',
            workflowId,
            breachSeverity: 'warning',
            minutesRemaining,
            dueAt: dueAt.toISOString(),
          }
        );
        sent++;
        console.log(`[SCHEDULER] Sent SLA warning for workflow ${workflowId} (${minutesRemaining}min remaining)`);
      }
    }

    return { sent };
  }

  /**
   * Check if a specific reminder type has been sent for a workflow
   */
  private async hasReminderBeenSent(
    workflowId: string,
    reminderType: string
  ): Promise<boolean> {
    const notifications = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.workflowId, workflowId),
        eq(notifications.channel, 'milestone')
      ));

    return notifications.some(n => {
      const payload = n.payload as any;
      return payload?.type === reminderType || 
             (payload?.type === 'milestone_reminder' && 
              payload?.timeRemaining?.includes(reminderType.includes('24h') ? '24' : '4'));
    });
  }

  /**
   * Get the timestamp of the last SLA breach notification
   */
  private async getLastSLABreachNotification(workflowId: string): Promise<Date | null> {
    const breachNotifications = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.workflowId, workflowId),
        eq(notifications.channel, 'email')
      ));

    const slaBreachNotifications = breachNotifications
      .filter(n => (n.payload as any)?.type === 'sla_breach_warning')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return slaBreachNotifications.length > 0 ? slaBreachNotifications[0].createdAt : null;
  }

  /**
   * Queue a specific reminder job
   */
  async queueJob(job: SchedulerJob): Promise<void> {
    this.jobs.set(job.id, job);
    console.log(`[SCHEDULER] Queued job ${job.id} of type ${job.type}`);
  }

  /**
   * Get scheduler statistics
   */
  async getStats(): Promise<{
    isRunning: boolean;
    queuedJobs: number;
    activeWorkflows: number;
    overdueWorkflows: number;
    upcomingDeadlines: number;
  }> {
    const now = new Date();
    
    const activeWorkflows = await db.select()
      .from(workflows)
      .where(eq(workflows.status, 'active'));

    const overdueWorkflows = activeWorkflows.filter(w => new Date(w.dueAt) < now);
    
    const upcomingDeadlines = activeWorkflows.filter(w => {
      const dueAt = new Date(w.dueAt);
      const hoursUntilDue = (dueAt.getTime() - now.getTime()) / (60 * 60 * 1000);
      return hoursUntilDue > 0 && hoursUntilDue <= 24;
    });

    return {
      isRunning: this.isRunning,
      queuedJobs: this.jobs.size,
      activeWorkflows: activeWorkflows.length,
      overdueWorkflows: overdueWorkflows.length,
      upcomingDeadlines: upcomingDeadlines.length,
    };
  }

  /**
   * Manually trigger processing (for testing/debugging)
   */
  async triggerProcessing(): Promise<any> {
    console.log('[SCHEDULER] Manual processing triggered');
    return await this.processReminders();
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();