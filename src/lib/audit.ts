import { z } from 'zod';

export const AuditActionType = z.enum([
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'APPROVE',
  'REJECT',
  'UPLOAD',
  'DOWNLOAD'
]);

export const AuditResourceType = z.enum([
  'USER',
  'PROJECT',
  'EXPENSE',
  'ATTENDANCE',
  'TESTIMONY',
  'REPORT',
  'PARTNERSHIP',
  'PROGRAM',
  'FORM',
  'BUDGET',
  'ASSET',
  'FEEDBACK'
]);

export const AuditLogSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  userEmail: z.string().optional(),
  userRole: z.string().optional(),
  action: AuditActionType,
  resourceType: AuditResourceType,
  resourceId: z.string().optional(),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.any().optional(),
});

export type AuditAction = z.infer<typeof AuditActionType>;
export type AuditResourceType = z.infer<typeof AuditResourceType>;
export type AuditLog = z.infer<typeof AuditLogSchema>;

export interface AuditLogEntry {
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  details?: Record<string, unknown>;
}

let adminDb: any = null;

async function getAdminFirestore() {
  if (!adminDb) {
    const { getFirebaseAdmin } = await import('@/firebase/server-only');
    adminDb = getFirebaseAdmin();
  }
  return adminDb.firestore;
}

export async function logAuditEntry(
  userId: string,
  entry: AuditLogEntry,
  userEmail?: string,
  userRole?: string
): Promise<void> {
  try {
    const db = await getAdminFirestore();
    const { FieldValue } = await import('firebase-admin/firestore');
    
    const auditLog: Omit<AuditLog, 'id'> = {
      userId,
      userEmail,
      userRole,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details,
      timestamp: FieldValue.serverTimestamp(),
    };

    await db.collection('auditLogs').add(auditLog);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function logAction(
  action: AuditAction,
  resourceType: AuditResourceType,
  resourceId?: string,
  details?: Record<string, unknown>
) {
  try {
    const { getFirebaseAdmin } = await import('@/firebase/server-only');
    const { firestore } = getFirebaseAdmin();
    const { FieldValue } = await import('firebase-admin/firestore');

    await firestore.collection('auditLogs').add({
      action,
      resourceType,
      resourceId,
      details,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}
