import { NextRequest, NextResponse } from 'next/server';

interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

const TEMPLATES: Record<string, (data: any) => EmailTemplate> = {
  expense_approved: (data) => ({
    to: data.userEmail,
    subject: `✅ Expense Approved: ${data.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Expense Approved!</h2>
        <p>Your expense report <strong>${data.title}</strong> has been approved.</p>
        <p><strong>Amount:</strong> ${data.amount}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation - Expense System</p>
      </div>
    `,
  }),
  expense_rejected: (data) => ({
    to: data.userEmail,
    subject: `❌ Expense Rejected: ${data.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Expense Rejected</h2>
        <p>Your expense report <strong>${data.title}</strong> was not approved.</p>
        <p><strong>Reason:</strong> ${data.reason || 'Please contact finance team'}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation - Expense System</p>
      </div>
    `,
  }),
  new_expense: (data) => ({
    to: data.adminEmail,
    subject: `📝 New Expense: ${data.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Expense Submitted</h2>
        <p><strong>Submitted by:</strong> ${data.userName}</p>
        <p><strong>Amount:</strong> ${data.amount}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <a href="${data.link}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Expense</a>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation - Expense System</p>
      </div>
    `,
  }),
  income_received: (data) => ({
    to: data.adminEmail,
    subject: `💰 Income Received: ${data.amount}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">New Income Recorded</h2>
        <p><strong>Donor:</strong> ${data.donor}</p>
        <p><strong>Amount:</strong> ${data.amount}</p>
        <p><strong>Date:</strong> ${data.dateReceived}</p>
        <p><strong>Purpose:</strong> ${data.title}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation - Finance System</p>
      </div>
    `,
  }),
  daily_checkin_reminder: (data) => ({
    to: data.userEmail,
    subject: '☀️ Good Morning! Complete your daily check-in',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Daily Planning</h2>
        <p>Don't forget to log your check-in for today!</p>
        <a href="${data.link}" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Check-in</a>
        <hr />
        <p style="color: #666; font-size: 12px;">Omuto Foundation</p>
      </div>
    `,
  }),
};

export async function GET() {
  return NextResponse.json({ 
    templates: Object.keys(TEMPLATES),
    configured: Boolean(process.env.RESEND_API_KEY),
  });
}

export async function POST(request: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  
  if (!resendKey) {
    return NextResponse.json({ 
      error: 'Resend not configured. Set RESEND_API_KEY in environment.',
      setup: 'Get your API key from https://resend.com'
    }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { template, to, data } = body;

    if (!template || !to) {
      return NextResponse.json({ error: 'Missing template or to' }, { status: 400 });
    }

    const templateFn = TEMPLATES[template];
    if (!templateFn) {
      return NextResponse.json({ error: `Template "${template}" not found` }, { status: 400 });
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
      console.error('[Resend] Error:', error);
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('[Email API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}