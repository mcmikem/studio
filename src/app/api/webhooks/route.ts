import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/server-only';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) return false;
  return authHeader === 'Bearer ' + internalKey;
}

interface WebhookConfig {
  id: string;
  name: string;
  trigger: string;
  url: string;
  headers?: Record<string, string>;
  active: boolean;
}

const webhookConfigs: Record<string, WebhookConfig> = {
  expense_approved: {
    id: 'expense_approved',
    name: 'Expense Approved Alert',
    trigger: 'expense.status.approved',
    url: process.env.WEBHOOK_EXPENSE_APPROVED || '',
    active: Boolean(process.env.WEBHOOK_EXPENSE_APPROVED),
  },
  new_expense: {
    id: 'new_expense',
    name: 'New Expense Submitted',
    trigger: 'expense.created',
    url: process.env.WEBHOOK_NEW_EXPENSE || '',
    active: Boolean(process.env.WEBHOOK_NEW_EXPENSE),
  },
  new_income: {
    id: 'new_income',
    name: 'Income Received',
    trigger: 'income.created',
    url: process.env.WEBHOOK_NEW_INCOME || '',
    active: Boolean(process.env.WEBHOOK_NEW_INCOME),
  },
  daily_checkin: {
    id: 'daily_checkin',
    name: 'Daily Check-in Alert',
    trigger: 'checkin.created',
    url: process.env.WEBHOOK_DAILY_CHECKIN || '',
    active: Boolean(process.env.WEBHOOK_DAILY_CHECKIN),
  },
};

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const webhooks = Object.values(webhookConfigs).map(w => ({
    id: w.id,
    name: w.name,
    trigger: w.trigger,
    active: w.active,
    url: w.url ? '***configured***' : '',
  }));
  
  return NextResponse.json({ webhooks });
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { trigger, data, webhookId } = body;

  if (!trigger || !data) {
    return NextResponse.json({ error: 'Missing trigger or data' }, { status: 400 });
  }

  const configs = webhookId 
    ? [webhookConfigs[webhookId]].filter(Boolean)
    : Object.values(webhookConfigs).filter(w => w.active && w.trigger === trigger);

  if (configs.length === 0) {
    return NextResponse.json({ message: 'No active webhooks for this trigger' });
  }

  const results = [];

  for (const config of configs) {
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Trigger': trigger,
          'X-Webhook-Id': config.id,
          ...config.headers,
        },
        body: JSON.stringify({
          event: trigger,
          timestamp: new Date().toISOString(),
          data,
        }),
      });

      results.push({ 
        webhookId: config.id, 
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
      });
    } catch (error: any) {
      results.push({ 
        webhookId: config.id, 
        status: 'error', 
        error: error.message 
      });
    }
  }

  return NextResponse.json({ results });
}

export async function PUT(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { webhookId, url, active, headers } = body;

  if (!webhookId || !webhookConfigs[webhookId]) {
    return NextResponse.json({ error: 'Invalid webhook ID' }, { status: 400 });
  }

  if (url) webhookConfigs[webhookId].url = url;
  if (typeof active === 'boolean') webhookConfigs[webhookId].active = active;
  if (headers) webhookConfigs[webhookId].headers = headers;

  return NextResponse.json({ 
    success: true, 
    webhook: { id: webhookId, active: webhookConfigs[webhookId].active } 
  });
}

export async function DELETE(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const searchParams = request.nextUrl.searchParams;
  const webhookId = searchParams.get('id');

  if (!webhookId || !webhookConfigs[webhookId]) {
    return NextResponse.json({ error: 'Invalid webhook ID' }, { status: 400 });
  }

  webhookConfigs[webhookId].active = false;
  webhookConfigs[webhookId].url = '';

  return NextResponse.json({ success: true, message: 'Webhook deleted' });
}