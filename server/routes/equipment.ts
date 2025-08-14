/**
 * Phase 2 - Backend API (normalized, ID-based)
 * Equipment taxonomy routes using proper FK relationships
 */

import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { equipmentGroups, equipmentTypes, equipmentSubtypes } from "../../shared/schema";

const router = Router();

// Phase 2.1: Groups endpoint
router.get("/groups", async (req, res) => {
  console.log("[EQUIPMENT-API] Fetching equipment groups");
  const active = req.query.active === "1";
  
  try {
    const data = await db.select({
      id: equipmentGroups.id,
      name: equipmentGroups.name,
    }).from(equipmentGroups)
      .where(active ? eq(equipmentGroups.isActive, true) : undefined)
      .orderBy(equipmentGroups.name);
    
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data });
    console.log(`[EQUIPMENT-API] Returned ${data.length} equipment groups`);
  } catch (error) {
    console.error("[EQUIPMENT-API] Error fetching groups:", error);
    res.status(500).json({ 
      ok: false, 
      error: { code: "internal_error", detail: "Failed to fetch equipment groups" }
    });
  }
});

// Phase 2.1: Types endpoint (filtered by groupId)
router.get("/types", async (req, res) => {
  const groupId = Number(req.query.groupId || 0);
  console.log(`[EQUIPMENT-API] Fetching equipment types for groupId=${groupId}`);
  
  if (!groupId) {
    return res.status(400).json({ 
      ok: false, 
      error: { code: "bad_request", detail: "groupId required" }
    });
  }
  
  const active = req.query.active === "1";
  
  try {
    const whereConditions = [eq(equipmentTypes.groupId, groupId)];
    if (active) whereConditions.push(eq(equipmentTypes.isActive, true));
    
    const data = await db.select({
      id: equipmentTypes.id,
      name: equipmentTypes.name,
    }).from(equipmentTypes)
      .where(and(...whereConditions))
      .orderBy(equipmentTypes.name);
    
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data });
    console.log(`[EQUIPMENT-API] Returned ${data.length} equipment types for group ${groupId}`);
  } catch (error) {
    console.error("[EQUIPMENT-API] Error fetching types:", error);
    res.status(500).json({ 
      ok: false, 
      error: { code: "internal_error", detail: "Failed to fetch equipment types" }
    });
  }
});

// Phase 2.1: Subtypes endpoint (filtered by typeId)
router.get("/subtypes", async (req, res) => {
  const typeId = Number(req.query.typeId || 0);
  console.log(`[EQUIPMENT-API] Fetching equipment subtypes for typeId=${typeId}`);
  
  if (!typeId) {
    return res.status(400).json({ 
      ok: false, 
      error: { code: "bad_request", detail: "typeId required" }
    });
  }
  
  const active = req.query.active === "1";
  
  try {
    const whereConditions = [eq(equipmentSubtypes.typeId, typeId)];
    if (active) whereConditions.push(eq(equipmentSubtypes.isActive, true));
    
    const data = await db.select({
      id: equipmentSubtypes.id,
      name: equipmentSubtypes.name,
    }).from(equipmentSubtypes)
      .where(and(...whereConditions))
      .orderBy(equipmentSubtypes.name);
    
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data });
    console.log(`[EQUIPMENT-API] Returned ${data.length} equipment subtypes for type ${typeId}`);
  } catch (error) {
    console.error("[EQUIPMENT-API] Error fetching subtypes:", error);
    res.status(500).json({ 
      ok: false, 
      error: { code: "internal_error", detail: "Failed to fetch equipment subtypes" }
    });
  }
});

// Phase 2.2: Validate equipment chain
export async function validateEquipmentChain(groupId: number, typeId: number, subtypeId: number) {
  console.log(`[EQUIPMENT-API] Validating chain: group=${groupId}, type=${typeId}, subtype=${subtypeId}`);
  
  // Verify type belongs to group
  const type = await db.query.equipmentTypes.findFirst({ 
    where: eq(equipmentTypes.id, typeId), 
    columns: { groupId: true }
  });
  
  if (!type || type.groupId !== groupId) {
    throw new Error("type_not_in_group");
  }
  
  // Verify subtype belongs to type
  const subtype = await db.query.equipmentSubtypes.findFirst({ 
    where: eq(equipmentSubtypes.id, subtypeId), 
    columns: { typeId: true }
  });
  
  if (!subtype || subtype.typeId !== typeId) {
    throw new Error("subtype_not_in_type");
  }
  
  console.log("[EQUIPMENT-API] Equipment chain validation passed");
  return true;
}

export default router;