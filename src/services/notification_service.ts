/**
 * Notification Service - Email and communication management
 * Handles SMTP, stakeholder updates, dashboard webhooks with preview mode
 */

import * as nodemailer from 'nodemailer';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { notifications, InsertNotification, Notification, Stakeholder } from '../../shared/schema.js';
import { Config } from '../core/config.js';

export interface NotificationPreview {
  channel: string;
  recipients: string[];
  subject: string;
  message: string;
  scheduledFor?: Date;
}

export interface NotificationPayload {
  type: string;
  workflowId?: string;
  incidentTitle?: string;
  dueAt?: string;
  timeRemaining?: string;
  [key: string]: any;
}

export class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: Config.SMTP_CONFIG.host,
        port: Config.SMTP_CONFIG.port,
        secure: Config.SMTP_CONFIG.port === 465,
        auth: Config.SMTP_CONFIG.auth,
      });

      console.log('[NOTIFICATION_SERVICE] SMTP transporter initialized');
    } catch (error) {
      console.error('[NOTIFICATION_SERVICE] Failed to initialize SMTP:', error);
    }
  }

  /**
   * Schedule a workflow notification
   */
  async scheduleWorkflowNotification(
    workflowId: string,
    channel: string,
    payload: NotificationPayload,
    scheduledFor?: Date
  ): Promise<Notification> {
    const notificationData: InsertNotification = {
      workflowId,
      channel,
      payload: payload as any,
      status: 'queued',
      scheduledFor: scheduledFor || new Date(),
    };

    const [notification] = await db.insert(notifications)
      .values(notificationData)
      .returning();

    console.log(`[NOTIFICATION_SERVICE] Scheduled ${channel} notification for workflow ${workflowId}`);

    return notification;
  }

  /**
   * Schedule notifications for all stakeholders
   */
  async scheduleStakeholderNotifications(
    workflowId: string,
    stakeholders: Stakeholder[]
  ): Promise<Notification[]> {
    const notifications = [];

    for (const stakeholder of stakeholders) {
      const notification = await this.scheduleWorkflowNotification(
        workflowId,
        'stakeholder',
        {
          type: 'stakeholder_added',
          workflowId,
          stakeholderName: stakeholder.name,
          stakeholderRole: stakeholder.role,
          email: stakeholder.email,
        }
      );
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Preview notifications without sending (dry-run)
   */
  async previewNotifications(
    workflowId: string
  ): Promise<NotificationPreview[]> {
    const workflowNotifications = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.workflowId, workflowId),
        eq(notifications.status, 'queued')
      ));

    const previews: NotificationPreview[] = [];

    for (const notification of workflowNotifications) {
      const preview = await this.generateNotificationPreview(notification);
      previews.push(preview);
    }

    return previews;
  }

  /**
   * Generate notification preview
   */
  private async generateNotificationPreview(notification: Notification): Promise<NotificationPreview> {
    const payload = notification.payload as NotificationPayload;
    
    switch (notification.channel) {
      case 'email':
        return this.generateEmailPreview(payload);
      
      case 'stakeholder':
        return this.generateStakeholderPreview(payload);
      
      case 'dashboard':
        return this.generateDashboardPreview(payload);
      
      case 'milestone':
        return this.generateMilestonePreview(payload);
      
      default:
        return {
          channel: notification.channel,
          recipients: ['Unknown'],
          subject: 'Unknown notification type',
          message: JSON.stringify(payload),
          scheduledFor: notification.scheduledFor || undefined,
        };
    }
  }

  /**
   * Generate email notification preview
   */
  private generateEmailPreview(payload: NotificationPayload): NotificationPreview {
    switch (payload.type) {
      case 'workflow_initiated':
        return {
          channel: 'email',
          recipients: ['workflow-team@company.com'],
          subject: `Workflow Initiated - ${payload.incidentTitle}`,
          message: `A new workflow has been initiated for incident: ${payload.incidentTitle}\n\nDue: ${payload.dueAt}\n\nPlease review and take action as needed.`,
        };

      case 'sla_breach_warning':
        return {
          channel: 'email',
          recipients: ['management@company.com'],
          subject: `SLA Breach Warning - ${payload.incidentTitle}`,
          message: `Warning: Workflow for "${payload.incidentTitle}" is approaching SLA breach.\n\nTime remaining: ${payload.timeRemaining}`,
        };

      default:
        return {
          channel: 'email',
          recipients: ['system@company.com'],
          subject: 'Workflow Notification',
          message: JSON.stringify(payload),
        };
    }
  }

  /**
   * Generate stakeholder notification preview
   */
  private generateStakeholderPreview(payload: NotificationPayload): NotificationPreview {
    const email = payload.email as string || 'unknown@company.com';
    
    return {
      channel: 'stakeholder',
      recipients: [email],
      subject: `You've been added as a stakeholder - ${payload.stakeholderRole}`,
      message: `Hello ${payload.stakeholderName},\n\nYou have been added as a ${payload.stakeholderRole} for workflow ${payload.workflowId}.\n\nPlease log in to the system to review your responsibilities.`,
    };
  }

  /**
   * Generate dashboard webhook preview
   */
  private generateDashboardPreview(payload: NotificationPayload): NotificationPreview {
    return {
      channel: 'dashboard',
      recipients: [Config.DASHBOARD_URL || 'dashboard-webhook'],
      subject: 'Dashboard Update',
      message: `POST ${Config.DASHBOARD_URL}/webhooks/workflow\n\nPayload: ${JSON.stringify(payload)}`,
    };
  }

  /**
   * Generate milestone reminder preview
   */
  private generateMilestonePreview(payload: NotificationPayload): NotificationPreview {
    return {
      channel: 'milestone',
      recipients: ['workflow-participants@company.com'],
      subject: `Milestone Reminder - ${payload.timeRemaining} remaining`,
      message: `Reminder: Workflow milestone approaching.\n\nTime remaining: ${payload.timeRemaining}\n\nPlease ensure all tasks are completed on time.`,
    };
  }

  /**
   * Send queued notifications (called by scheduler)
   */
  async processQueuedNotifications(): Promise<{ sent: number; failed: number }> {
    const queuedNotifications = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.status, 'queued')
      ));

    let sent = 0;
    let failed = 0;

    for (const notification of queuedNotifications) {
      try {
        await this.sendNotification(notification);
        
        // Mark as sent
        await db.update(notifications)
          .set({ 
            status: 'sent', 
            sentAt: new Date() 
          })
          .where(eq(notifications.id, notification.id));
          
        sent++;
      } catch (error) {
        console.error(`[NOTIFICATION_SERVICE] Failed to send notification ${notification.id}:`, error);
        
        // Mark as failed
        await db.update(notifications)
          .set({ 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          .where(eq(notifications.id, notification.id));
          
        failed++;
      }
    }

    console.log(`[NOTIFICATION_SERVICE] Processed notifications - Sent: ${sent}, Failed: ${failed}`);
    
    return { sent, failed };
  }

  /**
   * Send individual notification
   */
  private async sendNotification(notification: Notification): Promise<void> {
    const payload = notification.payload as NotificationPayload;
    
    switch (notification.channel) {
      case 'email':
      case 'stakeholder':
      case 'milestone':
        await this.sendEmail(notification);
        break;
        
      case 'dashboard':
        await this.sendDashboardWebhook(notification);
        break;
        
      default:
        throw new Error(`Unknown notification channel: ${notification.channel}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const preview = await this.generateNotificationPreview(notification);
    
    const mailOptions = {
      from: Config.SMTP_CONFIG.from,
      to: preview.recipients.join(', '),
      subject: preview.subject,
      text: preview.message,
      html: this.formatEmailAsHTML(preview.message),
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send dashboard webhook
   */
  private async sendDashboardWebhook(notification: Notification): Promise<void> {
    if (!Config.DASHBOARD_URL || !Config.DASHBOARD_API_KEY) {
      throw new Error('Dashboard webhook not configured');
    }

    const response = await fetch(`${Config.DASHBOARD_URL}/webhooks/workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Config.DASHBOARD_API_KEY}`,
      },
      body: JSON.stringify(notification.payload),
    });

    if (!response.ok) {
      throw new Error(`Dashboard webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Format email message as HTML
   */
  private formatEmailAsHTML(message: string): string {
    return message
      .split('\n')
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(workflowId?: string): Promise<{
    total: number;
    sent: number;
    queued: number;
    failed: number;
  }> {
    let query = db.select().from(notifications);
    
    if (workflowId) {
      query = query.where(eq(notifications.workflowId, workflowId));
    }
    
    const allNotifications = await query;
    
    return {
      total: allNotifications.length,
      sent: allNotifications.filter(n => n.status === 'sent').length,
      queued: allNotifications.filter(n => n.status === 'queued').length,
      failed: allNotifications.filter(n => n.status === 'failed').length,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();