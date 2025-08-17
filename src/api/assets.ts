/**
 * Assets Router - Asset management API with manufacturer/model support
 */

import { Router } from 'express';
import { db } from '../db/connection.js';
import { assets, manufacturers, models, type InsertAsset, type InsertManufacturer, type InsertModel } from '../../shared/schema.js';
import { eq, and, or, ilike, desc } from 'drizzle-orm';


const router = Router();

// Development RBAC middleware
const simpleAuth = (req: any, res: any, next: any) => {
  req.user = {
    id: 'test-user-' + Date.now(),
    role: req.headers['x-role'] || 'Analyst',
    email: req.headers['x-user'] || 'test@example.com'
  };
  next();
};

const simpleAuthorize = (permission: string) => (req: any, res: any, next: any) => {
  const role = req.user?.role || req.headers['x-role'];
  if (role === 'Reporter' && permission === 'CREATE_ASSET') {
    return res.status(403).json({ 
      error: 'Insufficient permissions',
      message: 'Reporters cannot create assets'
    });
  }
  next();
};

router.use(simpleAuth);

// GET /api/assets - Search and filter assets
router.get('/', async (req, res) => {
  try {
    const { query, manufacturerId, modelId, group, type, limit = '50' } = req.query;
    
    console.log('[ASSETS] Searching assets:', { query, manufacturerId, modelId, group, type, limit });
    
    let whereConditions: any[] = [];
    
    // Search by query (tag code, serial number, location)
    if (query && typeof query === 'string') {
      whereConditions.push(
        or(
          ilike(assets.tagCode, `%${query}%`),
          ilike(assets.serialNumber, `%${query}%`),
          ilike(assets.location, `%${query}%`)
        )
      );
    }
    
    // Filter by manufacturer
    if (manufacturerId && typeof manufacturerId === 'string') {
      whereConditions.push(eq(assets.manufacturerId, manufacturerId));
    }
    
    // Filter by model
    if (modelId && typeof modelId === 'string') {
      whereConditions.push(eq(assets.modelId, modelId));
    }
    
    // Filter by equipment group
    if (group && typeof group === 'string') {
      whereConditions.push(eq(assets.equipmentGroup, group));
    }
    
    // Filter by equipment type
    if (type && typeof type === 'string') {
      whereConditions.push(eq(assets.equipmentType, type));
    }
    
    const assetsData = await db.select({
      id: assets.id,
      tagCode: assets.tagCode,
      manufacturerId: assets.manufacturerId,
      modelId: assets.modelId,
      serialNumber: assets.serialNumber,
      equipmentGroup: assets.equipmentGroup,
      equipmentType: assets.equipmentType,
      criticality: assets.criticality,
      location: assets.location,
      commissioningDate: assets.commissioningDate,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(assets.createdAt))
    .limit(parseInt(limit as string));
    
    console.log('[ASSETS] Found', assetsData.length, 'assets');
    res.json(assetsData);
  } catch (error) {
    console.error('[ASSETS] Error searching assets:', error);
    res.status(500).json({ 
      error: 'Failed to search assets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/assets/:id - Get asset by ID
router.get('/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    console.log('[ASSETS] Getting asset:', assetId);
    
    const [asset] = await db.select()
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Get manufacturer and model details
    let manufacturer: any = null;
    let model: any = null;
    
    if (asset.manufacturerId) {
      [manufacturer] = await db.select()
        .from(manufacturers)
        .where(eq(manufacturers.id, asset.manufacturerId))
        .limit(1);
    }
    
    if (asset.modelId) {
      [model] = await db.select()
        .from(models)
        .where(eq(models.id, asset.modelId))
        .limit(1);
    }
    
    res.json({
      ...asset,
      manufacturer,
      model,
    });
  } catch (error) {
    console.error('[ASSETS] Error getting asset:', error);
    res.status(500).json({ 
      error: 'Failed to get asset',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/assets - Create new asset (with manufacturer/model creation if needed)
router.post('/', simpleAuthorize('CREATE_ASSET'), async (req, res) => {
  try {
    console.log('[ASSETS] Creating asset:', req.body);
    
    const {
      tagCode,
      manufacturerId,
      manufacturerName,
      modelId,
      model: modelData,
      serialNumber,
      equipmentGroup,
      equipmentType,
      location,
      criticality,
      commissioningDate,
    } = req.body;
    
    // Validate required fields
    if (!tagCode) {
      return res.status(400).json({ error: 'Tag code is required' });
    }
    
    let finalManufacturerId = manufacturerId;
    let finalModelId = modelId;
    
    // Create or find manufacturer
    if (!finalManufacturerId && manufacturerName) {
      console.log('[ASSETS] Creating/finding manufacturer:', manufacturerName);
      
      // Check if manufacturer exists
      const [existingManufacturer] = await db.select()
        .from(manufacturers)
        .where(eq(manufacturers.name, manufacturerName))
        .limit(1);
      
      if (existingManufacturer) {
        finalManufacturerId = existingManufacturer.id;
      } else {
        // Create new manufacturer
        const manufacturerInsert: InsertManufacturer = { name: manufacturerName };
        const [newManufacturer] = await db.insert(manufacturers)
          .values(manufacturerInsert)
          .returning();
        finalManufacturerId = newManufacturer.id;
        console.log('[ASSETS] Created manufacturer:', newManufacturer.id);
      }
    }
    
    // Create or find model
    if (!finalModelId && modelData && finalManufacturerId) {
      console.log('[ASSETS] Creating/finding model:', modelData);
      
      const modelName = modelData.name;
      const modelVariant = modelData.variant || null;
      
      // Check if model exists
      const [existingModel] = await db.select()
        .from(models)
        .where(and(
          eq(models.manufacturerId, finalManufacturerId),
          eq(models.name, modelName)
        ))
        .limit(1);
      
      if (existingModel) {
        finalModelId = existingModel.id;
      } else {
        // Create new model
        const modelInsert: InsertModel = {
          manufacturerId: finalManufacturerId,
          name: modelName,
          variant: modelVariant,
        };
        const [newModel] = await db.insert(models)
          .values(modelInsert)
          .returning();
        finalModelId = newModel.id;
        console.log('[ASSETS] Created model:', newModel.id);
      }
    }
    
    // Create asset
    const assetInsert: InsertAsset = {
      tagCode,
      manufacturerId: finalManufacturerId,
      modelId: finalModelId,
      serialNumber,
      equipmentGroup,
      equipmentType,
      location,
      criticality,
      commissioningDate: commissioningDate ? commissioningDate : null,
    };
    
    const [newAsset] = await db.insert(assets)
      .values(assetInsert)
      .returning();
    
    console.log('[ASSETS] Created asset:', newAsset.id);
    
    // Return asset with manufacturer/model details
    let manufacturer: any = null;
    let model: any = null;
    
    if (finalManufacturerId) {
      [manufacturer] = await db.select()
        .from(manufacturers)
        .where(eq(manufacturers.id, finalManufacturerId))
        .limit(1);
    }
    
    if (finalModelId) {
      [model] = await db.select()
        .from(models)
        .where(eq(models.id, finalModelId))
        .limit(1);
    }
    
    res.status(201).json({
      ...newAsset,
      manufacturer,
      model,
      manufacturerId: finalManufacturerId,
      modelId: finalModelId,
    });
  } catch (error) {
    console.error('[ASSETS] Error creating asset:', error);
    res.status(500).json({ 
      error: 'Failed to create asset',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;