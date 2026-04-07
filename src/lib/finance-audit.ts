import { addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { AuditAction } from './audit';

export interface FinanceAuditEntry {
  firestore: any;
  user: User | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'DISBURSE' | 'ACKNOWLEDGE';
  resourceType: 'EXPENSE' | 'INCOME';
  resourceId: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  notes?: string;
}

export async function logFinanceAudit({
  firestore,
  user,
  action,
  resourceType,
  resourceId,
  previousValues,
  newValues,
  notes,
}: FinanceAuditEntry): Promise<void> {
  if (!firestore) return;

  try {
    await addDocumentNonBlocking(collection(firestore, 'auditLogs'), {
      userId: user?.uid || 'system',
      userEmail: user?.email || 'system',
      action,
      resourceType,
      resourceId,
      previousValues: previousValues ? sanitizeForAudit(previousValues) : undefined,
      newValues: newValues ? sanitizeForAudit(newValues) : undefined,
      details: notes ? { note: notes } : undefined,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log finance audit:', error);
  }
}

function sanitizeForAudit(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'photoURL'];
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = '[OBJECT]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
