import type { User as AuthUser } from 'firebase/auth';
import type { User as UserProfile } from './types/user';

export const ROLES = {
  ED: 'Executive Director',
  ADMIN: 'Administrator',
  MANAGER: 'Programs & Partnerships Manager',
} as const;

/**
 * Checks if the current user can edit a specific item.
 * Rule: Executive Director and Administrator can edit anything.
 * Other users can only edit their own items.
 */
export function canEdit(item: any, currentUser: AuthUser | null, profile?: UserProfile | null): boolean {
  if (!currentUser) return false;
  
  // Executive Director and Administrator can edit anything
  if (profile?.role === ROLES.ED || profile?.role === ROLES.ADMIN) {
    return true;
  }
  
  const ownerId = item.userId || item.createdBy || item.id;
  return ownerId === currentUser.uid;
}

/**
 * Checks if the current user can delete data from the system.
 * Rule: Only the Executive Director and Administrator can delete.
 */
export function canDelete(profile: UserProfile | null): boolean {
  return profile?.role === ROLES.ED || profile?.role === ROLES.ADMIN;
}

/**
 * Higher-level check for full admin privileges.
 */
export function isAdmin(profile: UserProfile | null): boolean {
  if (!profile?.role) return false;
  return profile.role === ROLES.ED || profile.role === ROLES.ADMIN;
}
