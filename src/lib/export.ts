import { Parser } from 'json2csv';
import { jsPDF } from 'jspdf';

export type ExportFormat = 'csv' | 'pdf';

export interface ExportOptions {
  filename?: string;
  title?: string;
  columns?: string[];
}

export interface PaginatedExportOptions extends ExportOptions {
  pageSize?: number;
  maxPages?: number;
  fetchPage: (page: number, pageSize: number) => Promise<{ data: Record<string, any>[]; hasMore: boolean }>;
  onProgress?: (page: number, totalRows: number) => void;
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): string {
  const { columns } = options;

  try {
    const parser = new Parser({ fields: columns });
    const csv = parser.parse(data);
    return csv;
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('Failed to generate CSV');
  }
}

export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  const csv = exportToCSV(data, options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', options.filename || 'export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderPdfTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  options: { title?: string; filename: string }
): void {
  if (options.title) {
    doc.setFontSize(18);
    doc.text(options.title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  }

  let yPos = options.title ? 40 : 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;
  const cellPadding = 5;
  const lineHeight = 10;
  const colWidth = (doc.internal.pageSize.width - 2 * margin) / headers.length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  headers.forEach((header, i) => {
    doc.text(header, margin + i * colWidth + cellPadding, yPos);
  });

  yPos += lineHeight;
  doc.setFont('helvetica', 'normal');

  rows.forEach(row => {
    if (yPos > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }

    row.forEach((cell, i) => {
      const truncated = doc.splitTextToSize(cell, colWidth - 2 * cellPadding);
      doc.text(truncated, margin + i * colWidth + cellPadding, yPos);
    });

    yPos += lineHeight;
  });

  doc.save(options.filename);
}

export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  const { filename = 'export.pdf', title, columns } = options;

  const doc = new jsPDF();

  if (data.length === 0) {
    doc.text('No data to display', 14, 20);
    doc.save(filename);
    return;
  }

  const headers = columns || Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => String(row[h] ?? '')));

  renderPdfTable(doc, headers, rows, { title, filename });
}

export function exportTableToPDF(
  headers: string[],
  rows: string[][],
  options: ExportOptions = {}
): void {
  const { filename = 'report.pdf', title } = options;
  const doc = new jsPDF();
  renderPdfTable(doc, headers, rows, { title, filename });
}

export async function exportPaginatedToCSV(options: PaginatedExportOptions): Promise<void> {
  const { pageSize = 100, maxPages = 50, fetchPage, onProgress, columns, filename = 'export.csv' } = options;
  const allData: Record<string, any>[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < maxPages) {
    const result = await fetchPage(page, pageSize);
    allData.push(...result.data);
    hasMore = result.hasMore;
    page++;
    onProgress?.(page, allData.length);
  }

  downloadCSV(allData, { columns, filename });
}

export async function exportPaginatedToPDF(options: PaginatedExportOptions): Promise<void> {
  const { pageSize = 100, maxPages = 50, fetchPage, onProgress, columns, filename = 'export.pdf', title } = options;
  const allData: Record<string, any>[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < maxPages) {
    const result = await fetchPage(page, pageSize);
    allData.push(...result.data);
    hasMore = result.hasMore;
    page++;
    onProgress?.(page, allData.length);
  }

  exportToPDF(allData, { columns, filename, title });
}
