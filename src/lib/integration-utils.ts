'use client';

import { auth } from '@/firebase';

async function authHeaders(): Promise<Record<string, string>> {
  const user = auth?.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function triggerWebhook(trigger: string, data: Record<string, any>): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const response = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ trigger, data }),
    });
    return response.ok;
  } catch (error) {
    console.error('[Webhook] Failed:', error);
    return false;
  }
}

export async function sendEmailNotification(
  template: string,
  to: string | string[],
  data: Record<string, any>
): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ template, to, data }),
    });
    return response.ok;
  } catch (error) {
    console.error('[Email] Failed:', error);
    return false;
  }
}

export async function syncToGoogleSheet(type: string, data: Record<string, any>): Promise<boolean> {
  try {
    const headers = await authHeaders();
    const response = await fetch(`/api/sheets?type=${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ type, data }),
    });
    return response.ok;
  } catch (error) {
    console.error('[Sheets] Sync failed:', error);
    return false;
  }
}

export async function fetchFromGoogleSheet(type: string): Promise<any[] | null> {
  try {
    const headers = await authHeaders();
    const response = await fetch(`/api/sheets?type=${type}`, { headers });
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('[Sheets] Fetch failed:', error);
    return null;
  }
}

export async function notifyExpenseApproved(
  userEmail: string,
  userName: string,
  title: string,
  amount: string
) {
  await Promise.all([
    triggerWebhook('expense.status.approved', { userEmail, userName, title, amount }),
    sendEmailNotification('expense_approved', userEmail, { userEmail, userName, title, amount }),
    syncToGoogleSheet('expenses', { title, totalAmount: amount, status: 'Approved', userName, date: new Date().toISOString() }),
  ]);
}

export async function notifyExpenseRejected(
  userEmail: string,
  userName: string,
  title: string,
  reason?: string
) {
  await Promise.all([
    triggerWebhook('expense.status.rejected', { userEmail, userName, title, reason }),
    sendEmailNotification('expense_rejected', userEmail, { userEmail, userName, title, reason }),
  ]);
}

export async function notifyNewExpense(
  adminEmails: string[],
  userName: string,
  title: string,
  amount: string,
  link: string
) {
  await Promise.all([
    triggerWebhook('expense.created', { userName, title, amount }),
    sendEmailNotification('new_expense', adminEmails, { adminEmail: adminEmails[0], userName, title, amount, link }),
    syncToGoogleSheet('expenses', { title, totalAmount: amount, status: 'Pending', userName, date: new Date().toISOString() }),
  ]);
}

export async function notifyNewIncome(
  adminEmails: string[],
  title: string,
  amount: string,
  donor: string
) {
  await Promise.all([
    triggerWebhook('income.created', { title, amount, donor }),
    sendEmailNotification('income_received', adminEmails, { adminEmail: adminEmails[0], title, amount, donor, dateReceived: new Date().toISOString() }),
    syncToGoogleSheet('income', { title, amount, status: 'Pending', donor, dateReceived: new Date().toISOString() }),
  ]);
}
