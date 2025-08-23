import { Router } from "express";
import type { Request, Response } from "express";
import { IncidentCreateReqSchema, IncidentCreateResSchema } from "../../schemas/incidents";
import type { IncidentCreateReq, IncidentCreateRes } from "../../../../shared/contracts/incidents";
import { investigationStorage } from "../../../storage";
import { getRcaRecommendation, mapFrequencyToRecurrence } from "../../../../client/src/lib/rca/decision";
import type { Severity, Recurrence } from "../../../../client/src/lib/rca/decision";
import { rcaTriage, insertRcaTriageSchema } from "../../../../shared/schema";
import { z } from "zod";

const router = Router();

/**
 * DELETE /api/v1/incidents/draft
 * Clear any server-side draft tied to the session
 * 204 No Content
 */
router.delete("/draft", async (req: Request, res: Response) => {
  try {
    // Clear any server-side session draft data
    // For now, just return success since we don't store server drafts by default
    console.log("[V1_INCIDENTS] Draft clear requested");
    
    // Add cache headers to prevent restoration
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.status(204).end();
  } catch (error) {
    console.error("[V1_INCIDENTS] Error clearing draft:", error);
    return res.status(500).json({ 
      error: { 
        code: "DRAFT_CLEAR_FAILED", 
        message: "Failed to clear draft" 
      }
    });
  }
});

/**
 * POST /api/v1/incidents
 * 201 Created
 * Location: /api/v1/incidents/:id
 * Body: { id: string }
 * Cache-Control: no-store (prevent implicit restoration)
 */
router.post("/", async (req: Request, res: Response) => {
  const parsed = IncidentCreateReqSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: { code: "INVALID_REQUEST", message: "Invalid incident payload", issues: parsed.error.issues },
    });
  }

  const payload: IncidentCreateReq = parsed.data as IncidentCreateReq;

  try {
    // Convert incidentDateTime to proper Date object if provided
    const incidentData = {
      ...payload,
      incidentDateTime: payload.incidentDateTime ? new Date(payload.incidentDateTime) : new Date(),
    };

    // Create incident in storage; must return an incident with ID
    const incident = await investigationStorage.createIncident(incidentData);
    const incidentId: string = String(incident.id);

    const body: IncidentCreateRes = { id: incidentId };
    
    // Runtime assert
    const ok = IncidentCreateResSchema.safeParse(body);
    if (!ok.success) {
      return res.status(500).json({ error: { code: "INVALID_RESPONSE", message: "Server response invalid" } });
    }

    return res
      .status(201)
      .setHeader("Location", `/api/v1/incidents/${incidentId}`)
      .setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
      .json(body);
  } catch (error) {
    console.error("[V1_INCIDENTS] Error creating incident:", error);
    return res.status(500).json({ 
      error: { 
        code: "CREATION_FAILED", 
        message: error instanceof Error ? error.message : "Failed to create incident" 
      }
    });
  }
});

/**
 * POST /api/incidents/:id/triage
 * Create or update RCA triage recommendation
 * Body: { severity: 'Low'|'Medium'|'High', recurrence: 'Low'|'Medium'|'High' }
 */
router.post("/:id/triage", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const triageSchema = z.object({
      severity: z.enum(['Low', 'Medium', 'High']),
      recurrence: z.enum(['Low', 'Medium', 'High'])
    });

    const parsed = triageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: { 
          code: "INVALID_REQUEST", 
          message: "Invalid triage payload", 
          issues: parsed.error.issues 
        }
      });
    }

    const { severity, recurrence } = parsed.data;
    
    // Get RCA recommendation from decision matrix
    const rec = getRcaRecommendation(severity as Severity, recurrence as Recurrence);
    
    // Upsert triage data
    const triageData = {
      incidentId: String(id),
      severity,
      recurrence,
      level: rec.level,
      label: rec.label,
      method: rec.method,
      timebox: rec.timebox
    };

    // Use investigationStorage to handle database operations
    // Note: Since this is a new table, we'll need to extend the storage interface
    const saved = await investigationStorage.upsertRcaTriage(triageData);
    
    return res.json({ ...rec, saved: true });
  } catch (error) {
    console.error("[V1_INCIDENTS] Error creating/updating triage:", error);
    return res.status(500).json({ 
      error: { 
        code: "TRIAGE_OPERATION_FAILED", 
        message: "Failed to create/update triage" 
      }
    });
  }
});

/**
 * GET /api/incidents/:id/triage
 * Retrieve RCA triage recommendation for incident
 */
router.get("/:id/triage", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const triage = await investigationStorage.getRcaTriage(String(id));
    
    if (!triage) {
      return res.status(404).json({ 
        error: { 
          code: "TRIAGE_NOT_FOUND", 
          message: "Triage not found for this incident" 
        }
      });
    }
    
    return res.json(triage);
  } catch (error) {
    console.error("[V1_INCIDENTS] Error fetching triage:", error);
    return res.status(500).json({ 
      error: { 
        code: "TRIAGE_FETCH_FAILED", 
        message: "Failed to fetch triage" 
      }
    });
  }
});

export default router;