/**
 * Queue Service - BullMQ + Redis for background jobs
 * Handles milestone reminders and SLA breach warnings
 */

import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import { Config } from '../core/config.js';
import { NotificationService } from './notification_service.js';

export interface MilestoneReminderJob {
  workflowId: string;
  incidentId: string;
  milestone: string;
  dueAt: Date;
  stakeholders: string[];
}

export interface SLABreachWarningJob {
  workflowId: string;
  incidentId: string;
  breachTime: Date;
  stakeholders: string[];
}

export class QueueService {
  private milestoneQueue?: Queue<MilestoneReminderJob>;
  private slaQueue?: Queue<SLABreachWarningJob>;
  private worker?: Worker;
  private notificationService: NotificationService;
  
  constructor() {
    this.notificationService = new NotificationService();
    
    try {
      // Redis connection configuration - skip if REDIS_URL not available
      if (!Config.REDIS_URL && process.env.NODE_ENV === 'development') {
        console.log('[QUEUE] Redis not configured - running without queue services');
        return;
      }
      const redisConfig: ConnectionOptions = Config.REDIS_URL 
        ? { url: Config.REDIS_URL }
        : { host: 'localhost', port: 6379 };
      
      // Initialize queues
      this.milestoneQueue = new Queue<MilestoneReminderJob>('milestone-reminders', {
        connection: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          delay: 0,
        },
      });
      
      this.slaQueue = new Queue<SLABreachWarningJob>('sla-warnings', {
        connection: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          delay: 0,
        },
      });
      
      // Initialize worker
      this.worker = new Worker(
        'incident-processing',
        this.processJob.bind(this),
        {
          connection: redisConfig,
          concurrency: 5,
        }
      );
      
      // Error handling
      this.worker.on('failed', (job, err) => {
        console.error(`[QUEUE] Job ${job?.id} failed:`, err);
      });
      
      this.worker.on('completed', (job) => {
        console.log(`[QUEUE] Job ${job.id} completed successfully`);
      });
      
      console.log('[QUEUE] Queue service initialized successfully');
    } catch (error) {
      console.warn('[QUEUE] Failed to initialize Redis queues - running in degraded mode:', error);
      // Queue operations will fail gracefully in methods below
    }
  }
  
  /**
   * Schedule milestone reminder
   */
  async scheduleMilestoneReminder(data: MilestoneReminderJob, delay: number): Promise<void> {
    if (!this.milestoneQueue) {
      console.warn('[QUEUE] Milestone queue not available - Redis not connected');
      return;
    }
    
    try {
      await this.milestoneQueue.add('milestone-reminder', data, {
        delay,
        jobId: `milestone-${data.workflowId}-${data.milestone}`,
      });
      
      console.log(`[QUEUE] Scheduled milestone reminder for workflow ${data.workflowId} at ${data.dueAt}`);
    } catch (error) {
      console.error('[QUEUE] Failed to schedule milestone reminder:', error);
      throw error;
    }
  }
  
  /**
   * Schedule SLA breach warning
   */
  async scheduleSLAWarning(data: SLABreachWarningJob, delay: number): Promise<void> {
    if (!this.slaQueue) {
      console.warn('[QUEUE] SLA queue not available - Redis not connected');
      return;
    }
    
    try {
      await this.slaQueue.add('sla-warning', data, {
        delay,
        jobId: `sla-${data.workflowId}`,
      });
      
      console.log(`[QUEUE] Scheduled SLA warning for workflow ${data.workflowId} at ${data.breachTime}`);
    } catch (error) {
      console.error('[QUEUE] Failed to schedule SLA warning:', error);
      throw error;
    }
  }
  
  /**
   * Process background jobs
   */
  private async processJob(job: Job): Promise<void> {
    console.log(`[QUEUE] Processing job ${job.id} of type ${job.name}`);
    
    try {
      switch (job.name) {
        case 'milestone-reminder':
          await this.processMilestoneReminder(job.data as MilestoneReminderJob);
          break;
          
        case 'sla-warning':
          await this.processSLAWarning(job.data as SLABreachWarningJob);
          break;
          
        default:
          console.warn(`[QUEUE] Unknown job type: ${job.name}`);
      }
    } catch (error) {
      console.error(`[QUEUE] Error processing job ${job.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Process milestone reminder notification
   */
  private async processMilestoneReminder(data: MilestoneReminderJob): Promise<void> {
    const { workflowId, incidentId, milestone, stakeholders } = data;
    
    const subject = `Milestone Reminder: ${milestone}`;
    const content = `
      <h2>Workflow Milestone Reminder</h2>
      <p><strong>Workflow ID:</strong> ${workflowId}</p>
      <p><strong>Incident ID:</strong> ${incidentId}</p>
      <p><strong>Milestone:</strong> ${milestone}</p>
      <p><strong>Due:</strong> ${data.dueAt.toLocaleString()}</p>
      
      <p>Please ensure this milestone is completed on time to maintain SLA compliance.</p>
    `;
    
    // Send notifications to all stakeholders
    for (const email of stakeholders) {
      await this.notificationService.scheduleWorkflowNotification(
        workflowId,
        'email',
        {
          to: email,
          subject,
          content,
          type: 'milestone_reminder',
          metadata: {
            workflowId,
            incidentId,
            milestone,
          },
        },
        new Date()
      );
    }
    
    console.log(`[QUEUE] Sent milestone reminder for ${milestone} to ${stakeholders.length} stakeholders`);
  }
  
  /**
   * Process SLA breach warning
   */
  private async processSLAWarning(data: SLABreachWarningJob): Promise<void> {
    const { workflowId, incidentId, breachTime, stakeholders } = data;
    
    const subject = `⚠️ SLA Breach Warning - Immediate Action Required`;
    const content = `
      <h2>🚨 SLA Breach Warning</h2>
      <p><strong>Workflow ID:</strong> ${workflowId}</p>
      <p><strong>Incident ID:</strong> ${incidentId}</p>
      <p><strong>Breach Time:</strong> ${breachTime.toLocaleString()}</p>
      
      <p><strong>IMMEDIATE ACTION REQUIRED:</strong> This incident workflow is approaching or has exceeded its SLA timeframe.</p>
      <p>Please take immediate action to complete the workflow or escalate as necessary.</p>
    `;
    
    // Send urgent notifications to all stakeholders
    for (const email of stakeholders) {
      await this.notificationService.scheduleWorkflowNotification(
        workflowId,
        'email',
        {
          to: email,
          subject,
          content,
          type: 'sla_breach_warning',
          metadata: {
            workflowId,
            incidentId,
            breachTime: breachTime.toISOString(),
          },
        },
        new Date()
      );
    }
    
    console.log(`[QUEUE] Sent SLA breach warning for workflow ${workflowId} to ${stakeholders.length} stakeholders`);
  }
  
  /**
   * Cancel scheduled jobs for a workflow
   */
  async cancelWorkflowJobs(workflowId: string): Promise<void> {
    if (!this.milestoneQueue || !this.slaQueue) {
      console.warn('[QUEUE] Queues not available - Redis not connected');
      return;
    }
    
    try {
      // Cancel milestone reminders
      const milestoneJobs = await this.milestoneQueue.getJobs(['waiting', 'delayed']);
      for (const job of milestoneJobs) {
        if (job.data.workflowId === workflowId) {
          await job.remove();
        }
      }
      
      // Cancel SLA warnings
      const slaJobs = await this.slaQueue.getJobs(['waiting', 'delayed']);
      for (const job of slaJobs) {
        if (job.data.workflowId === workflowId) {
          await job.remove();
        }
      }
      
      console.log(`[QUEUE] Cancelled all jobs for workflow ${workflowId}`);
    } catch (error) {
      console.error(`[QUEUE] Failed to cancel jobs for workflow ${workflowId}:`, error);
    }
  }
  
  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    milestones: { waiting: number; active: number; completed: number; failed: number };
    sla: { waiting: number; active: number; completed: number; failed: number };
  }> {
    if (!this.milestoneQueue || !this.slaQueue) {
      return {
        milestones: { waiting: 0, active: 0, completed: 0, failed: 0 },
        sla: { waiting: 0, active: 0, completed: 0, failed: 0 },
      };
    }
    
    const [milestoneWaiting, milestoneActive, milestoneCompleted, milestoneFailed] = await Promise.all([
      this.milestoneQueue.getWaiting(),
      this.milestoneQueue.getActive(),
      this.milestoneQueue.getCompleted(),
      this.milestoneQueue.getFailed(),
    ]);
    
    const [slaWaiting, slaActive, slaCompleted, slaFailed] = await Promise.all([
      this.slaQueue.getWaiting(),
      this.slaQueue.getActive(),
      this.slaQueue.getCompleted(),
      this.slaQueue.getFailed(),
    ]);
    
    return {
      milestones: {
        waiting: milestoneWaiting.length,
        active: milestoneActive.length,
        completed: milestoneCompleted.length,
        failed: milestoneFailed.length,
      },
      sla: {
        waiting: slaWaiting.length,
        active: slaActive.length,
        completed: slaCompleted.length,
        failed: slaFailed.length,
      },
    };
  }
  
  /**
   * Close connections
   */
  async close(): Promise<void> {
    const promises = [];
    if (this.milestoneQueue) promises.push(this.milestoneQueue.close());
    if (this.slaQueue) promises.push(this.slaQueue.close());
    if (this.worker) promises.push(this.worker.close());
    
    await Promise.all(promises);
    console.log('[QUEUE] All connections closed');
  }
}

// Export singleton instance
export const queueService = new QueueService();