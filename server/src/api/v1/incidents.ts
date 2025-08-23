import { Router } from "express";
import type { Request, Response } from "express";
import { IncidentCreateReqSchema, IncidentCreateResSchema } from "../../schemas/incidents";
import type { IncidentCreateReq, IncidentCreateRes } from "../../../../shared/contracts/incidents";
import { investigationStorage } from "../../../storage";

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

export default router;