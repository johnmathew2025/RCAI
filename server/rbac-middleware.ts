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
  session: {
    user?: {
      id: string;
      email?: string;
      roles: string[];
      role?: string;
    };
  } & Express.Session;
}

/**
 * Middleware to require admin role for endpoint access
 * Uses session-based auth for browser compatibility
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const u = req.user || req.session?.user;
    if (!u) {
      return res.status(401).json({code:'UNAUTHENTICATED', message:'Sign in'});
    }
    const roles = u.roles || (u.role ? [u.role] : []);
    if (!roles.includes('admin')) {
      return res.status(403).json({code:'FORBIDDEN', message:'Admin only'});
    }
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