import { Router } from 'express';
import { db } from '../db';
import { encrypt, decrypt, mask } from '../crypto';
import { requireAdmin } from '../rbac-middleware';

export const router = Router();

// GET /api/admin/ai-settings - Database-only approach
router.get('/api/admin/ai-settings', requireAdmin, async (_req, res) => {
  try {
    const rows = await db.execute(`
      SELECT id, provider, model_id, is_active, created_at 
      FROM ai_settings 
      ORDER BY created_at DESC
    `);
    
    // Never leak plaintext keys
    const result = rows.rows.map((row: any) => ({
      id: row.id,
      provider: row.provider,
      modelId: row.model_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      apiKeyPreview: '***'
    }));
    
    console.log(`[ADMIN] Retrieved ${result.length} AI settings (NO HARDCODING)`);
    res.json(result);
  } catch (error) {
    console.error('[ADMIN] Error fetching AI settings:', error);
    res.status(500).json({ error: 'Failed to fetch AI settings' });
  }
});

// POST /api/admin/ai-settings - Create with encryption
router.post('/api/admin/ai-settings', requireAdmin, async (req, res) => {
  try {
    const { provider, modelId, apiKey, isActive } = req.body || {};
    if (!provider || !modelId || !apiKey) {
      return res.status(400).json({ error: 'provider, modelId, apiKey required' });
    }
    
    const { iv, cipher } = encrypt(apiKey);
    
    if (isActive === true) {
      // Ensure single active provider
      await db.execute('UPDATE ai_settings SET is_active = false');
    }
    
    const result = await db.execute(`
      INSERT INTO ai_settings (provider, model_id, api_key_cipher, api_key_iv, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id
    `, [provider, modelId, cipher, iv, !!isActive]);
    
    const id = result.rows[0]?.id;
    console.log(`[ADMIN] Created AI setting ID ${id} for ${provider}`);
    res.status(201).json({ id });
  } catch (error) {
    console.error('[ADMIN] Error creating AI setting:', error);
    res.status(500).json({ error: 'Failed to create AI setting' });
  }
});

// DELETE /api/admin/ai-settings/:id
router.delete('/api/admin/ai-settings/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM ai_settings WHERE id = $1', [Number(req.params.id)]);
    console.log(`[ADMIN] Deleted AI setting ID ${req.params.id}`);
    res.sendStatus(204);
  } catch (error) {
    console.error('[ADMIN] Error deleting AI setting:', error);
    res.status(500).json({ error: 'Failed to delete AI setting' });
  }
});

// Server-side helper when you need the plain key
export async function getPlainApiKey(id: number): Promise<string> {
  const result = await db.execute(`
    SELECT api_key_cipher, api_key_iv 
    FROM ai_settings 
    WHERE id = $1 LIMIT 1
  `, [id]);
  
  const row = result.rows[0];
  if (!row) throw new Error('Missing provider');
  return decrypt(row.api_key_iv, row.api_key_cipher);
}