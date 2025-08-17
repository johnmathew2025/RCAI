/**
 * Manufacturers Router - Read-only manufacturer management
 */

import { Router } from 'express';
import { db } from '../db/connection.js';
import { manufacturers } from '../../shared/schema.js';
import { ilike, desc } from 'drizzle-orm';

const router = Router();

// GET /api/manufacturers - Search manufacturers with typeahead support
router.get('/', async (req, res) => {
  try {
    const { query, limit = '20' } = req.query;
    
    console.log('[MANUFACTURERS] Searching manufacturers:', { query, limit });
    
    let whereCondition: any = undefined;
    
    // Search by query (name)
    if (query && typeof query === 'string') {
      whereCondition = ilike(manufacturers.name, `%${query}%`);
    }
    
    const manufacturersData = await db.select({
      id: manufacturers.id,
      name: manufacturers.name,
      createdAt: manufacturers.createdAt,
    })
    .from(manufacturers)
    .where(whereCondition)
    .orderBy(manufacturers.name)
    .limit(parseInt(limit as string));
    
    console.log('[MANUFACTURERS] Found', manufacturersData.length, 'manufacturers');
    res.json(manufacturersData);
  } catch (error) {
    console.error('[MANUFACTURERS] Error searching manufacturers:', error);
    res.status(500).json({ 
      error: 'Failed to search manufacturers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;