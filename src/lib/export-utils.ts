/**
 * Analytics Export Utility
 * 
 * This utility provides functions to export analytics data in various formats.
 */

/**
 * Download a file with the given content and filename
 */
export function downloadFile(content: string | Blob, fileName: string, mimeType: string) {
  // If content is a string, convert to Blob
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType }) 
    : content;
    
  // Create downloadable URL
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Set download attributes
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  // Add to DOM, click to download, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return fileName;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers?: string[]) {
  if (!data.length) return '';
  
  // Use provided headers or keys from first data item
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Format strings with commas or double quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

/**
 * Export data to CSV file
 */
export function exportCSV(data: any[], fileName: string, headers?: string[]) {
  const csvContent = convertToCSV(data, headers);
  return downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
}

/**
 * Export data to JSON file
 */
export function exportJSON(data: any, fileName: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  return downloadFile(jsonContent, fileName, 'application/json');
}

/**
 * Format date for filenames
 */
export function formatDateForFileName() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Process date fields in data for export
 * Converts Firebase timestamps to ISO string dates
 */
export function processDateFields(data: any, dateFields: string[]) {
  if (Array.isArray(data)) {
    return data.map(item => processDateFields(item, dateFields));
  }
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const processed = { ...data };
  
  for (const field of dateFields) {
    if (field in processed && processed[field]) {
      const value = processed[field];
      if (typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
        // Firebase Timestamp
        processed[field] = value.toDate().toISOString();
      } else if (value instanceof Date) {
        // JavaScript Date
        processed[field] = value.toISOString();
      }
    }
  }
  
  return processed;
}
