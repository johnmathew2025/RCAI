/**
 * Models Router - Read-only model management with manufacturer filtering
 */

import { Router } from 'express';
import { db } from '../db/connection.js';
import { models } from '../../shared/schema.js';
import { eq, and, ilike } from 'drizzle-orm';

const router = Router();

// GET /api/models - Search models with manufacturer filtering
router.get('/', async (req, res) => {
  try {
    const { manufacturerId, query, limit = '20' } = req.query;
    
    console.log('[MODELS] Searching models:', { manufacturerId, query, limit });
    
    let whereConditions: any[] = [];
    
    // Filter by manufacturer (required for meaningful results)
    if (manufacturerId && typeof manufacturerId === 'string') {
      whereConditions.push(eq(models.manufacturerId, manufacturerId));
    }
    
    // Search by query (name or variant)
    if (query && typeof query === 'string') {
      whereConditions.push(ilike(models.name, `%${query}%`));
    }
    
    const modelsData = await db.select({
      id: models.id,
      manufacturerId: models.manufacturerId,
      name: models.name,
      variant: models.variant,
      createdAt: models.createdAt,
    })
    .from(models)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(models.name)
    .limit(parseInt(limit as string));
    
    console.log('[MODELS] Found', modelsData.length, 'models');
    res.json(modelsData);
  } catch (error) {
    console.error('[MODELS] Error searching models:', error);
    res.status(500).json({ 
      error: 'Failed to search models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;