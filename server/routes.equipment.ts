/**
 * Equipment Taxonomy API - Normalized Database Endpoints  
 * Protocol: Zero hardcoding, ID-based relationships only
 * Purpose: Single source of truth for equipment hierarchy
 */

import { Router } from "express";
import { z } from "zod";
import type { Storage } from "./storage";

export function createEquipmentRouter(storage: Storage) {
  const router = Router();

  // GET /api/equipment/groups?active=1
  router.get("/groups", async (req, res) => {
    try {
      const active = req.query.active === "1";
      console.log(`[EQUIPMENT-API] Fetching groups, active=${active}`);
      
      const groups = await storage.getEquipmentGroups({ activeOnly: active });
      
      res.set("Cache-Control", "no-store");
      res.json({ 
        ok: true, 
        data: groups.map(g => ({ 
          id: g.id, 
          code: g.code, 
          name: g.name 
        }))
      });
    } catch (error) {
      console.error('[EQUIPMENT-API] Groups error:', error);
      res.status(500).json({ 
        ok: false, 
        error: { 
          code: "server_error", 
          detail: "Failed to load equipment groups" 
        }
      });
    }
  });

  // GET /api/equipment/types?groupId=123&active=1
  router.get("/types", async (req, res) => {
    try {
      const groupId = Number(req.query.groupId ?? 0);
      const active = req.query.active === "1";
      
      if (!groupId || isNaN(groupId)) {
        return res.status(400).json({ 
          ok: false, 
          error: { 
            code: "bad_request", 
            detail: "groupId required and must be a number" 
          }
        });
      }

      console.log(`[EQUIPMENT-API] Fetching types for groupId=${groupId}, active=${active}`);
      
      const types = await storage.getEquipmentTypes({ groupId, activeOnly: active });
      
      res.set("Cache-Control", "no-store");
      res.json({ 
        ok: true, 
        data: types.map(t => ({ 
          id: t.id, 
          code: t.code, 
          name: t.name 
        }))
      });
    } catch (error) {
      console.error('[EQUIPMENT-API] Types error:', error);
      res.status(500).json({ 
        ok: false, 
        error: { 
          code: "server_error", 
          detail: "Failed to load equipment types" 
        }
      });
    }
  });

  // GET /api/equipment/subtypes?typeId=456&active=1
  router.get("/subtypes", async (req, res) => {
    try {
      const typeId = Number(req.query.typeId ?? 0);
      const active = req.query.active === "1";
      
      if (!typeId || isNaN(typeId)) {
        return res.status(400).json({ 
          ok: false, 
          error: { 
            code: "bad_request", 
            detail: "typeId required and must be a number" 
          }
        });
      }

      console.log(`[EQUIPMENT-API] Fetching subtypes for typeId=${typeId}, active=${active}`);
      
      const subtypes = await storage.getEquipmentSubtypes({ typeId, activeOnly: active });
      
      res.set("Cache-Control", "no-store");
      res.json({ 
        ok: true, 
        data: subtypes.map(s => ({ 
          id: s.id, 
          code: s.code, 
          name: s.name 
        }))
      });
    } catch (error) {
      console.error('[EQUIPMENT-API] Subtypes error:', error);
      res.status(500).json({ 
        ok: false, 
        error: { 
          code: "server_error", 
          detail: "Failed to load equipment subtypes" 
        }
      });
    }
  });

  // POST /api/equipment/validate-chain - Validate hierarchy integrity
  router.post("/validate-chain", async (req, res) => {
    try {
      const { groupId, typeId, subtypeId } = req.body;
      
      await validateEquipmentChain(storage, groupId, typeId, subtypeId);
      
      res.json({ ok: true, message: "Equipment chain is valid" });
    } catch (error) {
      console.error('[EQUIPMENT-API] Chain validation error:', error);
      
      if (String(error.message).includes("type_not_in_group")) {
        return res.status(400).json({ 
          ok: false, 
          error: { 
            code: "type_not_in_group", 
            detail: "Selected type does not belong to the selected group." 
          }
        });
      }
      
      if (String(error.message).includes("subtype_not_in_type")) {
        return res.status(400).json({ 
          ok: false, 
          error: { 
            code: "subtype_not_in_type", 
            detail: "Selected subtype does not belong to the selected type." 
          }
        });
      }
      
      res.status(500).json({ 
        ok: false, 
        error: { 
          code: "server_error", 
          detail: "Unexpected validation error" 
        }
      });
    }
  });

  return router;
}

// Equipment chain validation function
export async function validateEquipmentChain(
  storage: Storage, 
  groupId: number, 
  typeId: number, 
  subtypeId: number
): Promise<void> {
  console.log(`[EQUIPMENT-CHAIN] Validating chain: ${groupId} -> ${typeId} -> ${subtypeId}`);
  
  // Validate type belongs to group
  const types = await storage.getEquipmentTypes({ groupId, activeOnly: false });
  const validType = types.find(t => t.id === typeId);
  if (!validType) {
    throw new Error("type_not_in_group");
  }
  
  // Validate subtype belongs to type
  const subtypes = await storage.getEquipmentSubtypes({ typeId, activeOnly: false });
  const validSubtype = subtypes.find(s => s.id === subtypeId);
  if (!validSubtype) {
    throw new Error("subtype_not_in_type");
  }
  
  console.log(`[EQUIPMENT-CHAIN] Chain validation passed`);
}