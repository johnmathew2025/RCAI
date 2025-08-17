/**
 * Workflow Service - Step 8 workflow management
 * Handles workflow initiation, stakeholder management, and SLA calculations
 */

import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { 
  workflows, 
  stakeholders,
  approvals,
  incidentsNew,
  InsertWorkflow,
  Workflow,
  InsertStakeholder,
  Stakeholder,
  InsertApproval,
  Approval,
  IncidentNew
} from '../../shared/schema.js';
import { Config } from '../core/config.js';
import { AuthenticatedUser } from '../core/rbac.js';
import { notificationService } from './notification_service.js';
import { incidentService } from './incident_service.js';

export interface WorkflowInitiationRequest {
  incidentId: string;
  type: string; // "Standard (24h)", "Expedited", etc.
  documentationLevel: string;
  analysisDepth: string;
  priority: string;
  approvalRequired: boolean;
  stakeholders: {
    name: string;
    role: string;
    email: string;
  }[];
  notifications: {
    email: boolean;
    stakeholder: boolean;
    dashboard: boolean;
    milestones: boolean;
  };
}

export interface WorkflowDetails extends Workflow {
  incident: IncidentNew;
  stakeholders: Stakeholder[];
  approvals: Approval[];
  notificationCount: number;
}

export class WorkflowService {
  /**
   * Initiate a new workflow (Step 8)
   */
  async initiateWorkflow(
    request: WorkflowInitiationRequest,
    user: AuthenticatedUser
  ): Promise<WorkflowDetails> {
    // Verify user has permission to initiate workflows
    if (!['Analyst', 'Admin'].includes(user.role)) {
      throw new Error('Only Analysts and Admins can initiate workflows');
    }
    
    // Validate incident exists and is accessible
    const incident = await incidentService.getIncidentById(request.incidentId, user);
    if (!incident) {
      throw new Error('Incident not found or access denied');
    }
    
    if (incident.status !== 'open') {
      throw new Error('Can only initiate workflows for open incidents');
    }
    
    // Validate workflow data
    this.validateWorkflowRequest(request);
    
    // Calculate due date based on SLA
    const dueAt = this.calculateDueDate(request.type);
    
    // Create workflow
    const workflowData: InsertWorkflow = {
      incidentId: request.incidentId,
      type: request.type,
      documentationLevel: request.documentationLevel,
      analysisDepth: request.analysisDepth,
      priority: request.priority,
      approvalRequired: request.approvalRequired,
      dueAt,
      status: 'active',
      createdBy: user.id,
    };
    
    const [workflow] = await db.insert(workflows)
      .values(workflowData)
      .returning();
    
    console.log(`[WORKFLOW_SERVICE] Created workflow ${workflow.id} for incident ${request.incidentId}`);
    
    // Add stakeholders
    const workflowStakeholders = await this.addStakeholders(workflow.id, request.stakeholders, user);
    
    // Create approval records if required
    const workflowApprovals = request.approvalRequired 
      ? await this.createApprovalRecords(workflow.id, workflowStakeholders)
      : [];
    
    // Schedule notifications
    let notificationCount = 0;
    if (request.notifications.email) {
      await notificationService.scheduleWorkflowNotification(workflow.id, 'email', {
        type: 'workflow_initiated',
        workflowId: workflow.id,
        incidentTitle: incident.title,
        dueAt: dueAt.toISOString(),
      });
      notificationCount++;
    }
    
    if (request.notifications.stakeholder) {
      await notificationService.scheduleStakeholderNotifications(workflow.id, workflowStakeholders);
      notificationCount += workflowStakeholders.length;
    }
    
    if (request.notifications.milestones) {
      await this.scheduleMilestoneReminders(workflow.id, dueAt);
      notificationCount += 2; // 24h and 4h reminders
    }
    
    // Update incident status
    await incidentService.updateIncident(request.incidentId, { status: 'investigating' }, user);
    
    return {
      ...workflow,
      incident,
      stakeholders: workflowStakeholders,
      approvals: workflowApprovals,
      notificationCount,
    };
  }
  
  /**
   * Get workflow by ID with full details
   */
  async getWorkflowById(id: string, user: AuthenticatedUser): Promise<WorkflowDetails | null> {
    // Check permissions
    if (!['Analyst', 'Approver', 'Admin'].includes(user.role)) {
      throw new Error('Insufficient permissions to view workflows');
    }
    
    const [workflow] = await db.select()
      .from(workflows)
      .where(eq(workflows.id, id));
    
    if (!workflow) {
      return null;
    }
    
    // Get associated data
    const [incident, workflowStakeholders, workflowApprovals] = await Promise.all([
      incidentService.getIncidentById(workflow.incidentId, user),
      this.getWorkflowStakeholders(id),
      this.getWorkflowApprovals(id),
    ]);
    
    if (!incident) {
      throw new Error('Associated incident not found');
    }
    
    return {
      ...workflow,
      incident,
      stakeholders: workflowStakeholders,
      approvals: workflowApprovals,
      notificationCount: 0, // Will be populated if needed
    };
  }
  
  /**
   * Add or update stakeholders for a workflow
   */
  async addStakeholders(
    workflowId: string,
    stakeholderData: { name: string; role: string; email: string }[],
    user: AuthenticatedUser
  ): Promise<Stakeholder[]> {
    if (!['Analyst', 'Admin'].includes(user.role)) {
      throw new Error('Only Analysts and Admins can manage stakeholders');
    }
    
    // Validate stakeholder data
    for (const stakeholder of stakeholderData) {
      if (!stakeholder.name?.trim() || !stakeholder.role?.trim() || !stakeholder.email?.trim()) {
        throw new Error('All stakeholder fields (name, role, email) are required');
      }
      
      if (!this.isValidEmail(stakeholder.email)) {
        throw new Error(`Invalid email format: ${stakeholder.email}`);
      }
    }
    
    // Remove existing stakeholders
    await db.delete(stakeholders).where(eq(stakeholders.workflowId, workflowId));
    
    // Add new stakeholders
    const stakeholderInserts = stakeholderData.map(s => ({
      workflowId,
      name: s.name,
      role: s.role,
      email: s.email,
    }));
    
    const createdStakeholders = await db.insert(stakeholders)
      .values(stakeholderInserts)
      .returning();
    
    console.log(`[WORKFLOW_SERVICE] Added ${createdStakeholders.length} stakeholders to workflow ${workflowId}`);
    
    return createdStakeholders;
  }
  
  /**
   * Get stakeholders for a workflow
   */
  async getWorkflowStakeholders(workflowId: string): Promise<Stakeholder[]> {
    return await db.select()
      .from(stakeholders)
      .where(eq(stakeholders.workflowId, workflowId))
      .orderBy(asc(stakeholders.createdAt));
  }
  
  /**
   * Get approvals for a workflow
   */
  async getWorkflowApprovals(workflowId: string): Promise<Approval[]> {
    return await db.select()
      .from(approvals)
      .where(eq(approvals.workflowId, workflowId))
      .orderBy(asc(approvals.createdAt));
  }
  
  /**
   * Calculate due date based on workflow type and SLA configuration
   */
  private calculateDueDate(workflowType: string): Date {
    const now = new Date();
    let hours = Config.SLA_PROFILE_STANDARD_HOURS;
    
    // Parse hours from workflow type if it contains time specification
    const match = workflowType.match(/\((\d+)h\)/);
    if (match) {
      hours = parseInt(match[1]);
    } else if (workflowType.toLowerCase().includes('expedited')) {
      hours = 4; // Expedited workflows default to 4 hours
    } else if (workflowType.toLowerCase().includes('extended')) {
      hours = 72; // Extended workflows default to 72 hours
    }
    
    return new Date(now.getTime() + (hours * 60 * 60 * 1000));
  }
  
  /**
   * Validate workflow initiation request
   */
  private validateWorkflowRequest(request: WorkflowInitiationRequest): void {
    const requiredFields = ['incidentId', 'type', 'documentationLevel', 'analysisDepth', 'priority'];
    
    for (const field of requiredFields) {
      if (!request[field as keyof WorkflowInitiationRequest]) {
        throw new Error(`${field} is required`);
      }
    }
    
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validPriorities.includes(request.priority)) {
      throw new Error(`Priority must be one of: ${validPriorities.join(', ')}`);
    }
    
    if (!Array.isArray(request.stakeholders) || request.stakeholders.length === 0) {
      throw new Error('At least one stakeholder is required');
    }
  }
  
  /**
   * Create approval records for workflows requiring approval
   */
  private async createApprovalRecords(
    workflowId: string,
    stakeholders: Stakeholder[]
  ): Promise<Approval[]> {
    const approvers = stakeholders.filter(s => 
      s.role.toLowerCase().includes('approver') || 
      s.role.toLowerCase().includes('manager')
    );
    
    if (approvers.length === 0) {
      throw new Error('Approval required but no approvers found in stakeholders');
    }
    
    const approvalInserts = approvers.map(approver => ({
      workflowId,
      approverIdOrEmail: approver.email,
      decision: 'pending' as const,
    }));
    
    return await db.insert(approvals)
      .values(approvalInserts)
      .returning();
  }
  
  /**
   * Schedule milestone reminders
   */
  private async scheduleMilestoneReminders(workflowId: string, dueAt: Date): Promise<void> {
    // 24-hour reminder
    const reminder24h = new Date(dueAt.getTime() - (24 * 60 * 60 * 1000));
    if (reminder24h > new Date()) {
      await notificationService.scheduleWorkflowNotification(workflowId, 'milestone', {
        type: 'milestone_reminder',
        timeRemaining: '24 hours',
      }, reminder24h);
    }
    
    // 4-hour reminder
    const reminder4h = new Date(dueAt.getTime() - (4 * 60 * 60 * 1000));
    if (reminder4h > new Date()) {
      await notificationService.scheduleWorkflowNotification(workflowId, 'milestone', {
        type: 'milestone_reminder',
        timeRemaining: '4 hours',
      }, reminder4h);
    }
  }
  
  /**
   * Get workflows with filters
   */
  async getWorkflows(
    filters: {
      status?: string;
      priority?: string;
      dueInHours?: number;
      limit?: number;
      offset?: number;
    },
    user: AuthenticatedUser
  ): Promise<{ workflows: Workflow[], total: number }> {
    if (!['Analyst', 'Approver', 'Admin'].includes(user.role)) {
      throw new Error('Insufficient permissions to view workflows');
    }
    
    let query = db.select().from(workflows);
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(workflows.status, filters.status));
    }
    
    if (filters.priority) {
      conditions.push(eq(workflows.priority, filters.priority));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    
    const workflowResults = await query
      .orderBy(desc(workflows.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      workflows: workflowResults,
      total: workflowResults.length,
    };
  }
  
  /**
   * Utility functions
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();