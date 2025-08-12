/**
 * USER ROLE MANAGEMENT HOOK
 * Role-based access control for navigation and features
 */

import { useState, useEffect } from 'react';

export type UserRole = 'admin' | 'investigator' | 'analyst' | 'manager' | 'viewer';

interface User {
  id: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

// Mock user for development - replace with actual auth
const mockUser: User = {
  id: 'dev-user-1',
  name: 'Development User',
  role: 'investigator', // Change this to test different roles
  permissions: ['rca.investigate', 'rca.analyze', 'evidence.view']
};

export function useUserRole() {
  const [user, setUser] = useState<User | null>(mockUser);
  const [isLoading, setIsLoading] = useState(false);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === 'admin';
  };

  const isRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const canAccessAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const canAccessWorkflow = (): boolean => {
    return user ? ['investigator', 'analyst', 'manager'].includes(user.role) : false;
  };

  return {
    user,
    isLoading,
    hasPermission,
    isRole,
    canAccessAdmin,
    canAccessWorkflow,
    setUser
  };
}