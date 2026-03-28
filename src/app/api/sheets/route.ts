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

async function verifyAuthToken(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  const internalKey = process.env.INTERNAL_API_KEY;
  
  if (internalKey && authHeader === `Bearer ${internalKey}`) {
    return true;
  }
  
  const apiKey = request.headers.get('X-API-Key');
  if (internalKey && apiKey === internalKey) {
    return true;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAuthToken(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'expenses';
  
  const config = SHEET_CONFIGS[type];
  const apiKey = getSheetsKey();

  if (!config?.spreadsheetId || !apiKey) {
    return NextResponse.json({ error: 'Google Sheets not configured.' }, { status: 500 });
  }

  try {
    const range = `${config.sheetName}!A:Z`;
    const url = `${GOOGLE_SHEETS_API}/${config.spreadsheetId}/values/${range}?key=${apiKey}&majorDimension=ROWS`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Sheets API error');
    
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
    
    return NextResponse.json({ data: records });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAuthorized = await verifyAuthToken(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = getSheetsKey();
  
  try {
    const { type, data } = await request.json();
    const config = SHEET_CONFIGS[type];

    if (!config?.spreadsheetId || !apiKey) {
      return NextResponse.json({ error: 'Google Sheets not configured.' }, { status: 500 });
    }

    const values = Object.keys(config.dataMapping).map((field) => data[field] || '');
    
    const nextRowResponse = await fetch(
      `${GOOGLE_SHEETS_API}/${config.spreadsheetId}/values/${config.sheetName}!A:A?key=${apiKey}`
    );
    const nextRowData = await nextRowResponse.json();
    const nextRow = (nextRowData.values?.length || 0) + 1;
    
    const range = `${config.sheetName}!A${nextRow}`;
    const url = `${GOOGLE_SHEETS_API}/${config.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] }),
    });

    if (!response.ok) throw new Error('Sheets API error');
    
    return NextResponse.json({ success: true, row: nextRow });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
  }
}
