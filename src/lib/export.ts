import { Parser } from 'json2csv';
import { jsPDF } from 'jspdf';

export type ExportFormat = 'csv' | 'pdf';

export interface ExportOptions {
  filename?: string;
  title?: string;
  columns?: string[];
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): string {
  const { filename = 'export.csv', columns } = options;

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

export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  const { filename = 'export.pdf', title, columns } = options;

  const doc = new jsPDF();
  
  if (title) {
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  }

  if (data.length === 0) {
    doc.text('No data to display', 14, 40);
    doc.save(filename);
    return;
  }

  const headers = columns || Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => String(row[h] ?? '')));

  let yPos = title ? 40 : 20;
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

  doc.save(filename);
}

export function exportTableToPDF(
  headers: string[],
  rows: string[][],
  options: ExportOptions = {}
): void {
  const { filename = 'report.pdf', title } = options;

  const doc = new jsPDF();
  
  if (title) {
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  }

  let yPos = title ? 40 : 20;
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

  doc.save(filename);
}
