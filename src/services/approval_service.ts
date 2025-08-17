/**
 * Approval Service - Workflow approval management
 * Handles approve/deny actions with audit trail
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { 
  approvals, 
  workflows,
  auditLogs,
  Approval, 
  InsertApproval,
  Workflow,
  InsertAuditLog 
} from '../../shared/schema.js';
import { AuthenticatedUser } from '../core/rbac.js';
import { notificationService } from './notification_service.js';

export interface ApprovalRequest {
  decision: 'approved' | 'rejected';
  comment?: string;
}

export interface ApprovalWithWorkflow extends Approval {
  workflow: Workflow;
}

export class ApprovalService {
  /**
   * Submit approval decision
   */
  async submitApproval(
    workflowId: string,
    approvalId: string,
    request: ApprovalRequest,
    user: AuthenticatedUser
  ): Promise<Approval> {
    // Check user has approval permissions
    if (!['Approver', 'Admin'].includes(user.role)) {
      throw new Error('Only Approvers and Admins can submit approval decisions');
    }
    
    // Validate decision
    if (!['approved', 'rejected'].includes(request.decision)) {
      throw new Error('Decision must be either "approved" or "rejected"');
    }
    
    // Get existing approval record
    const [existingApproval] = await db.select()
      .from(approvals)
      .where(and(
        eq(approvals.id, approvalId),
        eq(approvals.workflowId, workflowId)
      ));
    
    if (!existingApproval) {
      throw new Error('Approval record not found');
    }
    
    if (existingApproval.decision !== 'pending') {
      throw new Error(`Approval already ${existingApproval.decision}`);
    }
    
    // Verify approver authorization
    if (!this.isAuthorizedApprover(existingApproval, user)) {
      throw new Error('You are not authorized to approve this workflow');
    }
    
    // Update approval record
    const [updatedApproval] = await db.update(approvals)
      .set({
        decision: request.decision,
        decidedAt: new Date(),
        comment: request.comment,
      })
      .where(eq(approvals.id, approvalId))
      .returning();
    
    console.log(`[APPROVAL_SERVICE] Approval ${approvalId} ${request.decision} by user ${user.id}`);
    
    // Create audit log entry
    await this.createApprovalAuditLog(updatedApproval, user);
    
    // Check if workflow can be closed or needs further approvals
    await this.checkWorkflowCompletion(workflowId);
    
    // Send notification about approval decision
    await notificationService.scheduleWorkflowNotification(
      workflowId,
      'email',
      {
        type: 'approval_decision',
        decision: request.decision,
        approver: user.email || user.id,
        comment: request.comment,
      }
    );
    
    return updatedApproval;
  }
  
  /**
   * Get approvals for a workflow
   */
  async getWorkflowApprovals(
    workflowId: string,
    user: AuthenticatedUser
  ): Promise<Approval[]> {
    // Check permissions
    if (!['Analyst', 'Approver', 'Admin'].includes(user.role)) {
      throw new Error('Insufficient permissions to view approvals');
    }
    
    return await db.select()
      .from(approvals)
      .where(eq(approvals.workflowId, workflowId))
      .orderBy(approvals.createdAt);
  }
  
  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(
    user: AuthenticatedUser
  ): Promise<ApprovalWithWorkflow[]> {
    if (!['Approver', 'Admin'].includes(user.role)) {
      throw new Error('Only Approvers and Admins can view pending approvals');
    }
    
    // Get approvals where user is the designated approver
    const pendingApprovals = await db.select()
      .from(approvals)
      .where(and(
        eq(approvals.decision, 'pending'),
        eq(approvals.approverIdOrEmail, user.email || user.id)
      ))
      .orderBy(approvals.createdAt);
    
    // Fetch associated workflow details
    const approvalsWithWorkflows: ApprovalWithWorkflow[] = [];
    
    for (const approval of pendingApprovals) {
      const [workflow] = await db.select()
        .from(workflows)
        .where(eq(workflows.id, approval.workflowId));
      
      if (workflow) {
        approvalsWithWorkflows.push({
          ...approval,
          workflow,
        });
      }
    }
    
    return approvalsWithWorkflows;
  }
  
  /**
   * Get approval statistics
   */
  async getApprovalStats(
    workflowId?: string,
    user?: AuthenticatedUser
  ): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    avgDecisionTimeHours: number;
  }> {
    let query = db.select().from(approvals);
    
    if (workflowId) {
      query = query.where(eq(approvals.workflowId, workflowId));
    }
    
    if (user && ['Approver'].includes(user.role)) {
      query = query.where(eq(approvals.approverIdOrEmail, user.email || user.id));
    }
    
    const allApprovals = await query;
    
    // Calculate average decision time for completed approvals
    const completedApprovals = allApprovals.filter(a => a.decidedAt);
    const avgDecisionTimeMs = completedApprovals.length > 0
      ? completedApprovals.reduce((sum, approval) => {
          const decisionTime = approval.decidedAt!.getTime() - approval.createdAt.getTime();
          return sum + decisionTime;
        }, 0) / completedApprovals.length
      : 0;
    
    const avgDecisionTimeHours = avgDecisionTimeMs / (1000 * 60 * 60);
    
    return {
      total: allApprovals.length,
      pending: allApprovals.filter(a => a.decision === 'pending').length,
      approved: allApprovals.filter(a => a.decision === 'approved').length,
      rejected: allApprovals.filter(a => a.decision === 'rejected').length,
      avgDecisionTimeHours: Math.round(avgDecisionTimeHours * 100) / 100,
    };
  }
  
  /**
   * Check if user is authorized to approve
   */
  private isAuthorizedApprover(approval: Approval, user: AuthenticatedUser): boolean {
    // Admin can approve anything
    if (user.role === 'Admin') {
      return true;
    }
    
    // Check if user is the designated approver
    return approval.approverIdOrEmail === user.email || 
           approval.approverIdOrEmail === user.id;
  }
  
  /**
   * Create audit log entry for approval action
   */
  private async createApprovalAuditLog(
    approval: Approval,
    user: AuthenticatedUser
  ): Promise<void> {
    const auditData: InsertAuditLog = {
      action: 'approval_decision',
      actorId: user.id,
      targetTable: 'approvals',
      targetId: approval.id,
      payload: {
        workflowId: approval.workflowId,
        decision: approval.decision,
        comment: approval.comment,
        decidedAt: approval.decidedAt,
        approverEmail: approval.approverIdOrEmail,
      } as any,
    };
    
    await db.insert(auditLogs).values(auditData);
  }
  
  /**
   * Check if workflow can be completed based on approval status
   */
  private async checkWorkflowCompletion(workflowId: string): Promise<void> {
    const workflowApprovals = await db.select()
      .from(approvals)
      .where(eq(approvals.workflowId, workflowId));
    
    const pendingApprovals = workflowApprovals.filter(a => a.decision === 'pending');
    const rejectedApprovals = workflowApprovals.filter(a => a.decision === 'rejected');
    
    let newStatus: string | null = null;
    
    if (rejectedApprovals.length > 0) {
      // If any approval is rejected, workflow is rejected
      newStatus = 'rejected';
    } else if (pendingApprovals.length === 0) {
      // If no pending approvals, workflow is approved and can be closed
      newStatus = 'closed';
    }
    
    if (newStatus) {
      await db.update(workflows)
        .set({ 
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(workflows.id, workflowId));
      
      console.log(`[APPROVAL_SERVICE] Workflow ${workflowId} status changed to ${newStatus}`);
      
      // Notify about workflow completion
      await notificationService.scheduleWorkflowNotification(
        workflowId,
        'email',
        {
          type: 'workflow_completed',
          status: newStatus,
        }
      );
    }
  }
  
  /**
   * Bulk approve/reject multiple approvals (Admin only)
   */
  async bulkApprovalAction(
    approvalIds: string[],
    decision: 'approved' | 'rejected',
    comment: string,
    user: AuthenticatedUser
  ): Promise<Approval[]> {
    if (user.role !== 'Admin') {
      throw new Error('Only Admins can perform bulk approval actions');
    }
    
    const updatedApprovals: Approval[] = [];
    
    for (const approvalId of approvalIds) {
      try {
        const [approval] = await db.select()
          .from(approvals)
          .where(eq(approvals.id, approvalId));
        
        if (approval && approval.decision === 'pending') {
          const [updatedApproval] = await db.update(approvals)
            .set({
              decision,
              decidedAt: new Date(),
              comment: `${comment} (Bulk action by ${user.id})`,
            })
            .where(eq(approvals.id, approvalId))
            .returning();
          
          updatedApprovals.push(updatedApproval);
          
          // Create audit log
          await this.createApprovalAuditLog(updatedApproval, user);
          
          // Check workflow completion
          await this.checkWorkflowCompletion(approval.workflowId);
        }
      } catch (error) {
        console.error(`[APPROVAL_SERVICE] Failed to process approval ${approvalId}:`, error);
      }
    }
    
    console.log(`[APPROVAL_SERVICE] Bulk ${decision} ${updatedApprovals.length} approvals by admin ${user.id}`);
    
    return updatedApprovals;
  }
}

// Export singleton instance
export const approvalService = new ApprovalService();