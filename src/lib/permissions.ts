import type { User as AuthUser } from 'firebase/auth';
import type { User as UserProfile } from './types/user';

export const ROLES = {
  ED: 'Executive Director',
  ADMIN: 'Administrator',
  MANAGER: 'Programs & Partnerships Manager',
} as const;

/**
 * Checks if the current user can edit a specific item.
 * Rule: Only the owner (creator) can edit.
 */
export function canEdit(item: any, currentUser: AuthUser | null): boolean {
  if (!currentUser) return false;
  
  const ownerId = item.userId || item.createdBy || item.id; // Fallback to id if it's the user's own profile
  return ownerId === currentUser.uid;
}

/**
 * Checks if the current user can delete data from the system.
 * Rule: Only the Executive Director can delete.
 */
export function canDelete(profile: UserProfile | null): boolean {
  return profile?.role === ROLES.ED;
}

/**
 * Higher-level check for general management permissions.
 */
export function isManagement(profile: UserProfile | null): boolean {
  if (!profile?.role) return false;
  return [ROLES.ED, ROLES.ADMIN, ROLES.MANAGER].includes(profile.role as any);
}
