/**
 * RBAC MIDDLEWARE - Professional Conformance Implementation
 * 
 * Enforces role-based access control for AI Settings and admin endpoints
 * Returns 403 {reason:"forbidden"} for unauthorized access
 */

import type { Request, Response, NextFunction } from 'express';
import { investigationStorage } from './storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
  };
}

/**
 * Middleware to require admin role for endpoint access
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated
    const userId = req.user?.id || req.headers['x-user-id'] as string;
    
    if (!userId) {
      console.log('[RBAC] No user ID provided - denying access');
      return res.status(403).json({ reason: "forbidden", message: "Authentication required" });
    }

    // Get user from database to check role
    const user = await investigationStorage.getUser(userId);
    
    if (!user) {
      console.log(`[RBAC] User ${userId} not found - denying access`);
      return res.status(403).json({ reason: "forbidden", message: "User not found" });
    }

    // Check admin role
    if (user.role !== 'admin') {
      console.log(`[RBAC] User ${userId} has role '${user.role}', not 'admin' - denying access`);
      return res.status(403).json({ reason: "forbidden", message: "Admin role required" });
    }

    // Set user in request for downstream use
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email || undefined
    };

    console.log(`[RBAC] Admin access granted to user ${userId}`);
    next();
    
  } catch (error) {
    console.error('[RBAC] Error checking admin permissions:', error);
    res.status(500).json({ error: "Permission check failed" });
  }
}

/**
 * Middleware to require investigator or admin role
 */
export async function requireInvestigatorOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(403).json({ reason: "forbidden", message: "Authentication required" });
    }

    const user = await investigationStorage.getUser(userId);
    
    if (!user) {
      return res.status(403).json({ reason: "forbidden", message: "User not found" });
    }

    if (!['admin', 'investigator'].includes(user.role)) {
      return res.status(403).json({ 
        reason: "forbidden", 
        message: "Investigator or Admin role required" 
      });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email || undefined
    };

    next();
    
  } catch (error) {
    console.error('[RBAC] Error checking investigator permissions:', error);
    res.status(500).json({ error: "Permission check failed" });
  }
}

/**
 * Test helper to create admin user for testing
 */
export async function createTestAdminUser(userId: string = 'test-admin'): Promise<void> {
  try {
    await investigationStorage.upsertUser({
      id: userId,
      email: 'admin@test.local',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin'
    });
    console.log(`[RBAC] Test admin user created: ${userId}`);
  } catch (error) {
    console.log(`[RBAC] Admin user may already exist: ${userId}`);
  }
}