import { jsPDF } from 'jspdf';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  title?: string;
  subtitle?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  columns?: ExportColumn[];
}

export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): void {
  const {
    title = 'Omuto Central Report',
    subtitle = '',
    filename = `omuto-report-${new Date().toISOString().split('T')[0]}.pdf`,
    orientation = 'portrait',
    columns = [],
  } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFillColor(15, 23, 42); // omuto-navy
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 16);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, margin, 22);

  yPos = 35;

  // Date
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-UG', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Africa/Kampala'
  })}`, pageWidth - margin, 16, { align: 'right' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  if (data.length === 0) {
    doc.setFontSize(12);
    doc.text('No data to display', pageWidth / 2, pageHeight / 2, { align: 'center' });
    doc.save(filename);
    return;
  }

    // Determine columns from first row if not provided
  const cols: ExportColumn[] = columns.length > 0 
    ? columns 
    : Object.keys(data[0])
        .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
        .slice(0, 6)
        .map(key => ({
          header: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          key,
          width: (pageWidth - margin * 2) / Math.min(Object.keys(data[0]).length - 1, 6)
        }));

  // Table header
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, yPos - 5, pageWidth - margin * 2, 10, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  let xPos = margin;
  cols.forEach((col) => {
    doc.text(col.header, xPos + 2, yPos);
    xPos += col.width || 30;
  });

  yPos += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  const maxRows = 30;
  const rowsToShow = data.slice(0, maxRows);

  rowsToShow.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = margin;
      
      // Repeat header on new page
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPos - 5, pageWidth - margin * 2, 10, 'F');
      doc.setFont('helvetica', 'bold');
      
      xPos = margin;
      cols.forEach((col) => {
        doc.text(col.header, xPos + 2, yPos);
        xPos += col.width || 30;
      });
      yPos += 8;
      doc.setFont('helvetica', 'normal');
    }

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 250, 251);
    }
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');

    xPos = margin;
    cols.forEach((col) => {
      let value = row[col.key];
      
      // Format dates
      if (value && (col.key.includes('Date') || col.key === 'createdAt' || col.key === 'updatedAt')) {
        if (value.toDate) {
          value = value.toDate().toLocaleDateString();
        } else if (typeof value === 'string') {
          value = new Date(value).toLocaleDateString();
        }
      }

      // Truncate long values
      if (value && typeof value === 'string' && value.length > 25) {
        value = value.substring(0, 22) + '...';
      }

      doc.text(String(value || '—'), xPos + 2, yPos);
      xPos += col.width || 30;
    });

    yPos += 8;
  });

  // Show count
  if (data.length > maxRows) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`... and ${data.length - maxRows} more rows`, margin, yPos + 10);
  }

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Omuto Central | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  doc.save(filename);
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string = `omuto-export-${new Date().toISOString().split('T')[0]}.csv`
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]).filter(key => key !== 'id');
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let value = row[header];
        
        // Handle dates
        if (value && typeof value === 'object' && value.toDate) {
          value = value.toDate().toISOString();
        }
        
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value ?? '';
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
