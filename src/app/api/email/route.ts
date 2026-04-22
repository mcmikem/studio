import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/api-auth';

interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

function escapeHtml(value: string): string {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const TEMPLATES: Record<string, (data: any) => EmailTemplate> = {
  expense_approved: (data) => ({
    to: escapeHtml(data.userEmail),
    subject: `Expense Approved: ${escapeHtml(data.title)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Expense Approved!</h2>
        <p>Your expense report <strong>${escapeHtml(data.title)}</strong> has been approved.</p>
        <p><strong>Amount:</strong> ${escapeHtml(String(data.amount))}</p>
        <p><strong>Date:</strong> ${escapeHtml(String(data.date))}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation - Expense System</p>
      </div>
    `,
  }),
  expense_rejected: (data) => ({
    to: escapeHtml(data.userEmail),
    subject: `Expense Rejected: ${escapeHtml(data.title)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Expense Rejected</h2>
        <p>Your expense report <strong>${escapeHtml(data.title)}</strong> was not approved.</p>
        <p><strong>Reason:</strong> ${escapeHtml(data.reason || 'Please contact finance team')}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation - Expense System</p>
      </div>
    `,
  }),
  new_expense: (data) => ({
    to: escapeHtml(data.adminEmail),
    subject: `New Expense: ${escapeHtml(data.title)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Expense Submitted</h2>
        <p><strong>Submitted by:</strong> ${escapeHtml(data.userName)}</p>
        <p><strong>Amount:</strong> ${escapeHtml(String(data.amount))}</p>
        <p><strong>Date:</strong> ${escapeHtml(String(data.date))}</p>
        <a href="${escapeHtml(data.link)}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Expense</a>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation - Expense System</p>
      </div>
    `,
  }),
  income_received: (data) => ({
    to: escapeHtml(data.adminEmail),
    subject: `Income Received: ${escapeHtml(String(data.amount))}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">New Income Recorded</h2>
        <p><strong>Donor:</strong> ${escapeHtml(data.donor)}</p>
        <p><strong>Amount:</strong> ${escapeHtml(String(data.amount))}</p>
        <p><strong>Date:</strong> ${escapeHtml(String(data.dateReceived))}</p>
        <p><strong>Purpose:</strong> ${escapeHtml(data.title)}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation - Finance System</p>
      </div>
    `,
  }),
  daily_checkin_reminder: (data) => ({
    to: escapeHtml(data.userEmail),
    subject: 'Good Morning! Complete your daily check-in',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Daily Planning</h2>
        <p>Don't forget to log your check-in for today!</p>
        <a href="${escapeHtml(data.link)}" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Check-in</a>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation</p>
      </div>
    `,
  }),
};

export async function GET(request: NextRequest) {
  const isAuthorized = await verifyApiAuth(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({ 
    templates: Object.keys(TEMPLATES),
  });
}

export async function POST(request: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  
  if (!resendKey) {
    return NextResponse.json({ 
      error: 'Email service not configured.',
    }, { status: 500 });
  }

  const isAuthorized = await verifyApiAuth(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { template, to, data } = body;

    if (!template || !to) {
      return NextResponse.json({ error: 'Missing template or to' }, { status: 400 });
    }

    const templateFn = TEMPLATES[template];
    if (!templateFn) {
      return NextResponse.json({ error: 'Template not found' }, { status: 400 });
    }

    const email = templateFn(data);
    const recipients = Array.isArray(to) ? to : [to];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Omuto <noreply@omuto.org>',
        to: recipients,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: 'Failed to send email' }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
