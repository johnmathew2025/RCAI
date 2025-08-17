/**
 * Workflow Service - Core workflow initiation and management
 */

import { db } from '../db/connection.js';
import { incidents, approvals, InsertApproval } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { Config } from '../core/config.js';
import { NotificationService } from './notification_service.js';
import { queueService } from './queue_service.js';
import { nanoid } from 'nanoid';

export interface WorkflowInitiationData {
  incidentId: number;
  workflowType: 'Standard';
  documentationLevel: 'Basic' | 'Standard' | 'Comprehensive';
  analysisDepth: 'Surface' | 'Standard' | 'Deep';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  requiresApproval: boolean;
  observedSymptoms: string;
  stakeholders: string[];
  enableNotifications: boolean;
  enableMilestoneReminders: boolean;
}

export interface WorkflowResult {
  workflowId: string;
  incidentId: number;
  dueAt: Date;
  approval?: {
    id: string;
    required: boolean;
    status: 'pending' | 'approved' | 'denied';
  };
  notifications: {
    scheduled: number;
    stakeholders: string[];
  };
}

export class WorkflowService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Initiate workflow for an incident
   */
  async initiateWorkflow(data: WorkflowInitiationData): Promise<WorkflowResult> {
    const workflowId = nanoid();
    console.log(`[WORKFLOW_SERVICE] Initiating workflow ${workflowId} for incident ${data.incidentId}`);

    // Verify incident exists
    const [incident] = await db.select()
      .from(incidents)
      .where(eq(incidents.id, data.incidentId))
      .limit(1);

    if (!incident) {
      throw new Error(`Incident ${data.incidentId} not found`);
    }

    // Calculate due date using SLA from environment
    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + Config.SLA_PROFILE_STANDARD_HOURS);

    // Update incident with observed symptoms
    if (data.observedSymptoms) {
      await db.update(incidents)
        .set({ 
          symptomDescription: data.observedSymptoms,
          currentStep: 8,
          workflowStatus: 'workflow_initiated',
          updatedAt: new Date()
        })
        .where(eq(incidents.id, data.incidentId));
    }

    let approval = null;

    // Create approval record if required
    if (data.requiresApproval) {
      const approvalData: InsertApproval = {
        workflowId,
        incidentId: data.incidentId,
        status: 'pending',
        requiredBy: dueAt,
        requestedAt: new Date(),
      };

      const [newApproval] = await db.insert(approvals)
        .values(approvalData)
        .returning();

      approval = {
        id: newApproval.id,
        required: true,
        status: 'pending' as const,
      };

      console.log(`[WORKFLOW_SERVICE] Created approval requirement ${newApproval.id} for workflow ${workflowId}`);
    }

    // Schedule notifications if enabled
    let notificationCount = 0;
    if (data.enableNotifications && data.stakeholders.length > 0) {
      for (const email of data.stakeholders) {
        await this.notificationService.scheduleWorkflowNotification(
          workflowId,
          'email',
          {
            type: 'workflow_initiated',
            workflowId,
            incidentId: data.incidentId,
            email,
            dueAt: dueAt.toISOString(),
            priority: data.priority,
            requiresApproval: data.requiresApproval,
          }
        );
        notificationCount++;
      }
    }

    // Schedule milestone reminders if enabled
    if (data.enableMilestoneReminders) {
      // Schedule reminder 4 hours before due
      const reminderTime = new Date(dueAt.getTime() - (4 * 60 * 60 * 1000));
      if (reminderTime > new Date()) {
        await queueService.scheduleMilestoneReminder({
          workflowId,
          incidentId: data.incidentId.toString(),
          milestone: 'analysis_due_soon',
          dueAt,
          stakeholders: data.stakeholders,
        }, reminderTime.getTime() - Date.now());
      }

      // Schedule SLA breach warning at due time
      await queueService.scheduleSLAWarning({
        workflowId,
        incidentId: data.incidentId.toString(),
        breachTime: dueAt,
        stakeholders: data.stakeholders,
      }, dueAt.getTime() - Date.now());
    }

    console.log(`[WORKFLOW_SERVICE] Workflow ${workflowId} initiated successfully`);
    console.log(`[WORKFLOW_SERVICE] Due at: ${dueAt.toISOString()}`);
    console.log(`[WORKFLOW_SERVICE] Approval required: ${data.requiresApproval}`);
    console.log(`[WORKFLOW_SERVICE] Notifications scheduled: ${notificationCount}`);

    return {
      workflowId,
      incidentId: data.incidentId,
      dueAt,
      approval,
      notifications: {
        scheduled: notificationCount,
        stakeholders: data.stakeholders,
      },
    };
  }

  /**
   * Preview notifications without sending
   */
  async previewNotifications(workflowId: string, formData: any): Promise<{
    recipients: string[];
    subject: string;
    content: string;
  }> {
    console.log(`[WORKFLOW_SERVICE] Previewing notifications for workflow ${workflowId}`);

    // Generate preview content
    const recipients = formData.stakeholders || [];
    const subject = `Workflow Notification - Incident Analysis Required`;
    const content = `
      <h2>Workflow Initiated</h2>
      <p><strong>Workflow ID:</strong> ${workflowId}</p>
      <p><strong>Priority:</strong> ${formData.priority || 'Medium'}</p>
      <p><strong>Documentation Level:</strong> ${formData.documentationLevel || 'Standard'}</p>
      <p><strong>Analysis Depth:</strong> ${formData.analysisDepth || 'Standard'}</p>
      
      <p>This is a preview of the notification that would be sent to stakeholders.</p>
    `;

    return {
      recipients,
      subject,
      content,
    };
  }

  /**
   * Approve workflow
   */
  async approveWorkflow(workflowId: string, decision: 'approved' | 'denied', comment?: string): Promise<{
    approval: {
      status: 'approved' | 'denied';
      comment?: string;
      approvedAt: Date;
    };
  }> {
    console.log(`[WORKFLOW_SERVICE] ${decision} workflow ${workflowId}`);

    // Update approval record
    const [approval] = await db.update(approvals)
      .set({
        status: decision,
        comment,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(approvals.workflowId, workflowId))
      .returning();

    if (!approval) {
      throw new Error(`Approval for workflow ${workflowId} not found`);
    }

    return {
      approval: {
        status: decision,
        comment,
        approvedAt: new Date(),
      },
    };
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();