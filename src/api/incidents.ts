/**
 * Incident API Routes
 * Handles incident CRUD, symptoms, and evidence operations
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../core/rbac.js';
import { incidentService } from '../services/incident_service.js';
import { evidenceService } from '../services/evidence_service.js';

const router = Router();

// Request validation schemas
const createIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  regulatoryRequired: z.boolean().optional().default(false),
  equipmentId: z.string().optional(),
  location: z.string().optional(),
  incidentDateTime: z.string().datetime().optional(),
  immediateActions: z.string().optional(),
  safetyImplications: z.string().optional(),
  operatingParameters: z.string().optional(),
});

const addSymptomSchema = z.object({
  text: z.string().min(1, 'Symptom text is required'),
  observedAt: z.string().datetime().optional(),
  severity: z.string().optional(),
});

const evidenceUploadSchema = z.object({
  mode: z.enum(['pointer', 'managed']),
  source: z.object({
    provider: z.enum(['s3', 'gdrive', 'sharepoint', 'local', 'app_bucket']),
    object: z.record(z.any()),
    access: z.object({
      presignedGet: z.string().optional(),
      expiresAt: z.string().optional(),
      oauthToken: z.string().optional(),
    }).optional(),
  }),
  metadata: z.object({
    mime: z.string(),
    sizeBytes: z.number().positive(),
    filename: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
  }),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * POST /api/incidents - Create new incident
 */
router.post('/', authorize('CREATE_INCIDENT'), async (req, res) => {
  try {
    const validatedData = createIncidentSchema.parse(req.body);
    
    const incident = await incidentService.createIncident(validatedData, req.user!);
    
    // Generate incident reference
    const reference = incidentService.generateIncidentReference(incident);
    
    res.status(201).json({
      success: true,
      data: {
        ...incident,
        reference,
      },
    });
    
  } catch (error) {
    console.error('[INCIDENTS_API] Create incident error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      error: 'Failed to create incident',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/incidents/:id - Get incident by ID
 */
router.get('/:id', authorize('READ_INCIDENT_OWN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const incident = await incidentService.getIncidentById(id, req.user!);
    
    if (!incident) {
      return res.status(404).json({
        error: 'Incident not found',
        message: 'Incident does not exist or you do not have access',
      });
    }
    
    // Generate reference
    const reference = incidentService.generateIncidentReference(incident);
    
    res.json({
      success: true,
      data: {
        ...incident,
        reference,
      },
    });
    
  } catch (error) {
    console.error('[INCIDENTS_API] Get incident error:', error);
    res.status(500).json({
      error: 'Failed to retrieve incident',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/incidents - Get incidents with filters
 */
router.get('/', authorize('READ_INCIDENT_OWN'), async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      reporterId: req.query.reporterId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    
    const result = await incidentService.getIncidents(filters, req.user!);
    
    // Add references to incidents
    const incidentsWithReferences = result.incidents.map(incident => ({
      ...incident,
      reference: incidentService.generateIncidentReference(incident),
    }));
    
    res.json({
      success: true,
      data: incidentsWithReferences,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
    
  } catch (error) {
    console.error('[INCIDENTS_API] Get incidents error:', error);
    res.status(500).json({
      error: 'Failed to retrieve incidents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/incidents/:id - Update incident
 */
router.put('/:id', authorize('UPDATE_INCIDENT_OWN'), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = createIncidentSchema.partial().parse(req.body);
    
    const updatedIncident = await incidentService.updateIncident(id, validatedData, req.user!);
    
    res.json({
      success: true,
      data: {
        ...updatedIncident,
        reference: incidentService.generateIncidentReference(updatedIncident),
      },
    });
    
  } catch (error) {
    console.error('[INCIDENTS_API] Update incident error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      error: 'Failed to update incident',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/incidents/:id/symptoms - Add symptom to incident
 */
router.post('/:id/symptoms', authorize('UPDATE_INCIDENT_OWN'), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = addSymptomSchema.parse(req.body);
    
    const symptom = await incidentService.addSymptom(id, validatedData, req.user!);
    
    res.status(201).json({
      success: true,
      data: symptom,
    });
    
  } catch (error) {
    console.error('[INCIDENTS_API] Add symptom error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      error: 'Failed to add symptom',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/incidents/:id/evidence - Upload evidence
 */
router.post('/:id/evidence', authorize('ADD_EVIDENCE'), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = evidenceUploadSchema.parse(req.body);
    
    const evidence = await evidenceService.uploadEvidence(id, validatedData, req.user!);
    
    res.status(201).json({
      success: true,
      data: {
        ...evidence,
        badge: evidence.storageMode === 'pointer' ? 'POINTER' : 'MANAGED',
      },
    });
    
  } catch (error) {
    console.error('[INCIDENTS_API] Upload evidence error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      error: 'Failed to upload evidence',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/incidents/:id/evidence - Get incident evidence
 */
router.get('/:id/evidence', authorize('VIEW_EVIDENCE'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const evidence = await evidenceService.getIncidentEvidence(id, req.user!);
    
    res.json({
      success: true,
      data: evidence,
    });
    
  } catch (error) {
    console.error('[INCIDENTS_API] Get evidence error:', error);
    res.status(500).json({
      error: 'Failed to retrieve evidence',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/incidents/search/workflow - Search incidents for workflow selection
 */
router.get('/search/workflow', authorize('INITIATE_WORKFLOW'), async (req, res) => {
  try {
    const searchQuery = req.query.q as string;
    
    const incidents = await incidentService.getIncidentsForWorkflow(req.user!, searchQuery);
    
    const incidentsWithReferences = incidents.map(incident => ({
      ...incident,
      reference: incidentService.generateIncidentReference(incident),
    }));
    
    res.json({
      success: true,
      data: incidentsWithReferences,
    });
    
  } catch (error) {
    console.error('[INCIDENTS_API] Search workflow incidents error:', error);
    res.status(500).json({
      error: 'Failed to search incidents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/incidents/stats - Get incident statistics
 */
router.get('/stats', authorize('READ_INCIDENT_OWN'), async (req, res) => {
  try {
    const stats = await incidentService.getIncidentStats(req.user!);
    
    res.json({
      success: true,
      data: stats,
    });
    
  } catch (error) {
    console.error('[INCIDENTS_API] Get stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;