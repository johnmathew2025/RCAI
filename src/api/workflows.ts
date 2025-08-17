/**
 * Workflow API Routes - Step 8 workflow management
 * Handles workflow initiation, stakeholder management, and approval processes
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../core/rbac.js';
import { workflowService } from '../services/workflow_service.js';
import { approvalService } from '../services/approval_service.js';
import { notificationService } from '../services/notification_service.js';

const router = Router();

// Request validation schemas
const initiateWorkflowSchema = z.object({
  incidentId: z.string().uuid('Invalid incident ID'),
  type: z.string().min(1, 'Workflow type is required'),
  documentationLevel: z.string().min(1, 'Documentation level is required'),
  analysisDepth: z.string().min(1, 'Analysis depth is required'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  approvalRequired: z.boolean().default(false),
  stakeholders: z.array(z.object({
    name: z.string().min(1, 'Stakeholder name is required'),
    role: z.string().min(1, 'Stakeholder role is required'),
    email: z.string().email('Valid email is required'),
  })).min(1, 'At least one stakeholder is required'),
  notifications: z.object({
    email: z.boolean().default(false),
    stakeholder: z.boolean().default(false),
    dashboard: z.boolean().default(false),
    milestones: z.boolean().default(false),
  }),
});

const addStakeholdersSchema = z.object({
  stakeholders: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.string().min(1, 'Role is required'),
    email: z.string().email('Valid email is required'),
  })).min(1, 'At least one stakeholder is required'),
});

const approvalDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().optional(),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * POST /api/workflows/initiate - Initiate new workflow
 */
router.post('/initiate', authorize('INITIATE_WORKFLOW'), async (req, res) => {
  try {
    const validatedData = initiateWorkflowSchema.parse(req.body);
    
    const workflow = await workflowService.initiateWorkflow(validatedData, req.user!);
    
    res.status(201).json({
      success: true,
      data: workflow,
      message: `Workflow initiated successfully. ${workflow.notificationCount} notifications scheduled.`,
    });
    
  } catch (error) {
    console.error('[WORKFLOWS_API] Initiate workflow error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      error: 'Failed to initiate workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/workflows/:id - Get workflow details
 */
router.get('/:id', authorize('READ_WORKFLOW'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const workflow = await workflowService.getWorkflowById(id, req.user!);
    
    if (!workflow) {
      return res.status(404).json({
        error: 'Workflow not found',
        message: 'Workflow does not exist or you do not have access',
      });
    }
    
    res.json({
      success: true,
      data: workflow,
    });
    
  } catch (error) {
    console.error('[WORKFLOWS_API] Get workflow error:', error);
    res.status(500).json({
      error: 'Failed to retrieve workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/workflows - Get workflows with filters
 */
router.get('/', authorize('READ_WORKFLOW'), async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      dueInHours: req.query.dueInHours ? parseInt(req.query.dueInHours as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    
    const result = await workflowService.getWorkflows(filters, req.user!);
    
    res.json({
      success: true,
      data: result.workflows,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
    
  } catch (error) {
    console.error('[WORKFLOWS_API] Get workflows error:', error);
    res.status(500).json({
      error: 'Failed to retrieve workflows',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/workflows/:id/stakeholders - Add/update stakeholders
 */
router.post('/:id/stakeholders', authorize('ADD_STAKEHOLDERS'), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = addStakeholdersSchema.parse(req.body);
    
    const stakeholders = await workflowService.addStakeholders(
      id, 
      validatedData.stakeholders, 
      req.user!
    );
    
    res.json({
      success: true,
      data: stakeholders,
      message: `${stakeholders.length} stakeholders updated successfully`,
    });
    
  } catch (error) {
    console.error('[WORKFLOWS_API] Add stakeholders error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      error: 'Failed to update stakeholders',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/workflows/:id/notifications/preview - Preview notifications
 */
router.get('/:id/notifications/preview', authorize('PREVIEW_NOTIFICATIONS'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const previews = await notificationService.previewNotifications(id);
    
    res.json({
      success: true,
      data: previews,
      message: `${previews.length} notifications queued for preview`,
    });
    
  } catch (error) {
    console.error('[WORKFLOWS_API] Preview notifications error:', error);
    res.status(500).json({
      error: 'Failed to preview notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/workflows/:id/approvals - Get workflow approvals
 */
router.get('/:id/approvals', authorize('VIEW_APPROVALS'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const approvals = await approvalService.getWorkflowApprovals(id, req.user!);
    
    res.json({
      success: true,
      data: approvals,
    });
    
  } catch (error) {
    console.error('[WORKFLOWS_API] Get approvals error:', error);
    res.status(500).json({
      error: 'Failed to retrieve approvals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/workflows/:id/approvals/:approvalId - Submit approval decision
 */
router.post('/:id/approvals/:approvalId', authorize('APPROVE_WORKFLOW'), async (req, res) => {
  try {
    const { id: workflowId, approvalId } = req.params;
    const validatedData = approvalDecisionSchema.parse(req.body);
    
    const approval = await approvalService.submitApproval(
      workflowId,
      approvalId,
      validatedData,
      req.user!
    );
    
    res.json({
      success: true,
      data: approval,
      message: `Approval ${validatedData.decision} successfully`,
    });
    
  } catch (error) {
    console.error('[WORKFLOWS_API] Submit approval error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      error: 'Failed to submit approval',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/workflows/approvals/pending - Get pending approvals for user
 */
router.get('/approvals/pending', authorize('APPROVE_WORKFLOW'), async (req, res) => {
  try {
    const pendingApprovals = await approvalService.getPendingApprovals(req.user!);
    
    res.json({
      success: true,
      data: pendingApprovals,
      message: `${pendingApprovals.length} pending approvals found`,
    });
    
  } catch (error) {
    console.error('[WORKFLOWS_API] Get pending approvals error:', error);
    res.status(500).json({
      error: 'Failed to retrieve pending approvals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/workflows/stats - Get workflow statistics
 */
router.get('/stats', authorize('READ_WORKFLOW'), async (req, res) => {
  try {
    // Get workflow statistics
    const workflowResult = await workflowService.getWorkflows({}, req.user!);
    
    const stats = {
      total: workflowResult.total,
      active: workflowResult.workflows.filter(w => w.status === 'active').length,
      closed: workflowResult.workflows.filter(w => w.status === 'closed').length,
      draft: workflowResult.workflows.filter(w => w.status === 'draft').length,
      overdue: workflowResult.workflows.filter(w => 
        w.status === 'active' && new Date(w.dueAt) < new Date()
      ).length,
    };
    
    // Get approval statistics if user has permissions
    let approvalStats = null;
    if (['Approver', 'Admin'].includes(req.user!.role)) {
      approvalStats = await approvalService.getApprovalStats(undefined, req.user!);
    }
    
    res.json({
      success: true,
      data: {
        workflows: stats,
        approvals: approvalStats,
      },
    });
    
  } catch (error) {
    console.error('[WORKFLOWS_API] Get stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;