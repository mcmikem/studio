import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/firebase/server-only';

const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

interface SheetConfig {
  spreadsheetId: string;
  sheetName: string;
  dataMapping: Record<string, string>;
}

const SHEET_CONFIGS: Record<string, SheetConfig> = {
  expenses: {
    spreadsheetId: process.env.GOOGLE_SHEET_ID || '',
    sheetName: 'Expenses',
    dataMapping: {
      title: 'A',
      totalAmount: 'B',
      date: 'C',
      status: 'D',
      userName: 'E',
    },
  },
  income: {
    spreadsheetId: process.env.GOOGLE_SHEET_ID || '',
    sheetName: 'Income',
    dataMapping: {
      title: 'A',
      amount: 'B',
      dateReceived: 'C',
      status: 'D',
      donor: 'E',
    },
  },
  beneficiaries: {
    spreadsheetId: process.env.GOOGLE_SHEET_ID || '',
    sheetName: 'Beneficiaries',
    dataMapping: {
      name: 'A',
      program: 'B',
      district: 'C',
      status: 'D',
    },
  },
};

function getSheetsKey(): string {
  return process.env.GOOGLE_SHEETS_API_KEY || process.env.GEMINI_API_KEY || '';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'expenses';
  
  const config = SHEET_CONFIGS[type];
  const apiKey = getSheetsKey();

  if (!config?.spreadsheetId || !apiKey) {
    return NextResponse.json({ error: 'Google Sheets not configured. Set GOOGLE_SHEET_ID and GOOGLE_SHEETS_API_KEY in environment.' }, { status: 500 });
  }

  try {
    const range = `${config.sheetName}!A:Z`;
    const url = `${GOOGLE_SHEETS_API}/${config.spreadsheetId}/values/${range}?key=${apiKey}&majorDimension=ROWS`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Sheets API error: ${response.status}`);
    
    const data = await response.json();
    const rows = data.values || [];
    
    if (rows.length < 2) return NextResponse.json({ data: [] });
    
    const headers = rows[0];
    const records = rows.slice(1).map((row: string[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((header: string, i: number) => {
        obj[header.toLowerCase().replace(/\s+/g, '_')] = row[i] || '';
      });
      return obj;
    });

    return NextResponse.json({ data: records, count: records.length });
  } catch (error: any) {
    console.error('[Sheets GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'expenses';
  
  const config = SHEET_CONFIGS[type];
  const apiKey = getSheetsKey();

  if (!config?.spreadsheetId || !apiKey) {
    return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'append') {
      const values = Object.values(config.dataMapping).map(col => data[col.toLowerCase().replace(/\s+/g, '_')] || '');
      const range = `${config.sheetName}!A${(await getNextRow(config.spreadsheetId, config.sheetName, apiKey))}`;
      
      const url = `${GOOGLE_SHEETS_API}/${config.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [values] }),
      });

      if (!response.ok) throw new Error(`Sheets API error: ${response.status}`);
      
      return NextResponse.json({ success: true, message: 'Data synced to Google Sheets' });
    }

    return NextResponse.json({ error: 'Invalid action. Use action=append' }, { status: 400 });
  } catch (error: any) {
    console.error('[Sheets POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getNextRow(spreadsheetId: string, sheetName: string, apiKey: string): Promise<number> {
  const url = `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${sheetName}!A:A?key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  return (data.values?.length || 0) + 1;
}