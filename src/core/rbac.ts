/**
 * Role-Based Access Control (RBAC) System
 * Four roles: Reporter, Analyst, Approver, Admin
 * HTTP middleware for JWT-based authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Config } from './config.js';

export interface AuthenticatedUser {
  id: string;
  role: string;
  email: string;
  roles: string[]; // For compatibility with session-based auth
  isActive: boolean; // For compatibility with session-based auth
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Role hierarchy and permissions
export const ROLES = {
  REPORTER: 'Reporter',
  ANALYST: 'Analyst', 
  APPROVER: 'Approver',
  ADMIN: 'Admin'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Permission matrix - what each role can do
export const PERMISSIONS = {
  // Incident Management
  CREATE_INCIDENT: ['Reporter', 'Analyst', 'Approver', 'Admin'],
  READ_INCIDENT_OWN: ['Reporter', 'Analyst', 'Approver', 'Admin'],
  READ_INCIDENT_ALL: ['Analyst', 'Approver', 'Admin'],
  UPDATE_INCIDENT_OWN: ['Reporter', 'Analyst', 'Approver', 'Admin'],
  UPDATE_INCIDENT_ALL: ['Analyst', 'Approver', 'Admin'],
  
  // Workflow Management  
  INITIATE_WORKFLOW: ['Analyst', 'Admin'],
  READ_WORKFLOW: ['Analyst', 'Approver', 'Admin'],
  ADD_STAKEHOLDERS: ['Analyst', 'Admin'],
  TOGGLE_NOTIFICATIONS: ['Analyst', 'Admin'],
  PREVIEW_NOTIFICATIONS: ['Analyst', 'Admin'],
  
  // Approval System
  APPROVE_WORKFLOW: ['Approver', 'Admin'],
  VIEW_APPROVALS: ['Approver', 'Admin'],
  
  // Evidence Management
  ADD_EVIDENCE: ['Reporter', 'Analyst', 'Approver', 'Admin'],
  VIEW_EVIDENCE: ['Reporter', 'Analyst', 'Approver', 'Admin'],
  PIN_EVIDENCE: ['Analyst', 'Admin'], // Convert pointer to managed
  
  // Admin Functions
  MANAGE_PRESETS: ['Admin'],
  MANAGE_INTEGRATIONS: ['Admin'],
  VIEW_AUDIT_LOGS: ['Admin'],
  
  // System Access
  ACCESS_WORKFLOW_INTEGRATION: ['Analyst', 'Approver', 'Admin'],
  ACCESS_ADMIN_PANEL: ['Admin'],
} as const;

/**
 * JWT Authentication Middleware
 * Extracts user info from JWT token or simple header (for development)
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide authorization header' 
      });
    }
    
    // Support both JWT and simple header formats
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, Config.JWT_SECRET) as any;
        req.user = {
          id: decoded.id || decoded.sub,
          role: decoded.role,
          email: decoded.email,
        };
      } catch (jwtError) {
        return res.status(401).json({ 
          error: 'Invalid token',
          message: 'JWT token is invalid or expired' 
        });
      }
    } else if (authHeader.startsWith('User ')) {
      // Simple header format for development: "User id:role:email"
      const userInfo = authHeader.substring(5);
      const [id, role, email] = userInfo.split(':');
      
      if (!id || !role || !Config.ROLES_ARRAY.includes(role)) {
        return res.status(401).json({ 
          error: 'Invalid user header',
          message: `User header must be "User id:role:email" with role in: ${Config.ROLES_ARRAY.join(', ')}` 
        });
      }
      
      req.user = { id, role, email };
    } else {
      return res.status(401).json({ 
        error: 'Invalid authorization format',
        message: 'Use "Bearer <token>" or "User id:role:email"' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Authorization Middleware Factory
 * Creates middleware that checks if user has required permission
 */
export const authorize = (permission: keyof typeof PERMISSIONS) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated' 
      });
    }
    
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `Role ${req.user.role} not authorized for ${permission}`,
        requiredRoles: allowedRoles 
      });
    }
    
    next();
  };
};

/**
 * Role-based middleware shortcuts
 */
export const requireReporter = authorize('CREATE_INCIDENT');
export const requireAnalyst = authorize('INITIATE_WORKFLOW');
export const requireApprover = authorize('APPROVE_WORKFLOW');
export const requireAdmin = authorize('MANAGE_PRESETS');

/**
 * Check if user can access specific incident
 * Reporters can only access incidents they created
 * Analysts, Approvers, Admins can access all incidents
 */
export const checkIncidentAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Analysts, Approvers, and Admins can access all incidents
  if (['Analyst', 'Approver', 'Admin'].includes(req.user.role)) {
    return next();
  }
  
  // Reporters can only access their own incidents
  // This will be enforced at the database query level
  next();
};

/**
 * Utility functions for role checking
 */
export const hasRole = (user: AuthenticatedUser, role: Role): boolean => {
  return user.role === role;
};

export const hasAnyRole = (user: AuthenticatedUser, roles: Role[]): boolean => {
  return roles.includes(user.role as Role);
};

export const hasPermission = (user: AuthenticatedUser, permission: keyof typeof PERMISSIONS): boolean => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(user.role as Role);
};

/**
 * Generate JWT token for user (utility for testing/auth endpoints)
 */
export const generateToken = (user: { id: string; role: string; email?: string }): string => {
  return jwt.sign(
    { 
      id: user.id,
      role: user.role,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    },
    Config.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export default {
  authenticate,
  authorize,
  requireReporter,
  requireAnalyst, 
  requireApprover,
  requireAdmin,
  checkIncidentAccess,
  hasRole,
  hasAnyRole,
  hasPermission,
  generateToken,
  ROLES,
  PERMISSIONS,
};