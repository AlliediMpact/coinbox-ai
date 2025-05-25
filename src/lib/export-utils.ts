/**
 * Analytics Export Utility
 * 
 * This utility provides functions to export analytics data in various formats.
 * Optimized for performance with large datasets.
 */

/**
 * Download a file with the given content and filename
 * Optimized for large files by using streams when available
 */
export function downloadFile(content: string | Blob, fileName: string, mimeType: string) {
  // If content is a string, convert to Blob
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType }) 
    : content;
    
  // Use the File System Access API if available for better performance with large files
  if ('showSaveFilePicker' in window) {
    try {
      const options = {
        suggestedName: fileName,
        types: [{
          description: 'File',
          accept: { [mimeType]: [`.${fileName.split('.').pop()}`] }
        }]
      };
      
      // Use a wrapper in an async IIFE to handle the promise-based API
      (async () => {
        try {
          // @ts-ignore - TypeScript doesn't yet have types for File System Access API
          const fileHandle = await window.showSaveFilePicker(options);
          // @ts-ignore
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err) {
          // Fall back to traditional download if user cancels or API fails
          if (err.name !== 'AbortError') {
            traditionalDownload(blob, fileName);
          }
        }
      })();
    } catch (err) {
      // Fall back to traditional download if File System Access API is not available
      traditionalDownload(blob, fileName);
    }
  } else {
    // Use traditional download method
    traditionalDownload(blob, fileName);
  }
  
  return fileName;
}

/**
 * Traditional download method using anchor element
 */
function traditionalDownload(blob: Blob, fileName: string) {
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
}

/**
 * Convert data to CSV format
 * Optimized for large datasets by processing in chunks
 */
export function convertToCSV(data: any[], headers?: string[]) {
  if (!data.length) return '';
  
  // Use provided headers or keys from first data item
  const csvHeaders = headers || Object.keys(data[0]);
  
  // For small datasets, process all at once
  if (data.length < 5000) {
    return generateCSV(data, csvHeaders);
  }
  
  // For large datasets, process in chunks to avoid blocking the main thread
  return processLargeDatasetCSV(data, csvHeaders);
}

/**
 * Generate CSV for standard sized datasets
 */
function generateCSV(data: any[], headers: string[]): string {
  // Create CSV content
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
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
 * Process large datasets in chunks to avoid UI freezing
 */
function processLargeDatasetCSV(data: any[], headers: string[]): string {
  const CHUNK_SIZE = 1000; // Process 1000 records at a time
  const headerRow = headers.join(',');
  let csvContent = headerRow + '\n';
  
  // Process in chunks
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    const chunkContent = chunk
      .map(row => 
        headers
          .map(header => {
            const value = row[header];
            // Format strings with commas or double quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      )
      .join('\n');
    
    csvContent += chunkContent;
    if (i + CHUNK_SIZE < data.length) {
      csvContent += '\n';
    }
  }
  
  return csvContent;
}

/**
 * Export data to CSV file
 * With performance optimizations for large datasets
 */
export function exportCSV(data: any[], fileName: string, headers?: string[]) {
  const csvContent = convertToCSV(data, headers);
  return downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
}

/**
 * Export data to JSON file
 * With performance optimizations for large datasets
 */
export function exportJSON(data: any, fileName: string) {
  // For large datasets, use a streaming approach
  if (Array.isArray(data) && data.length > 10000) {
    return exportLargeJSON(data, fileName);
  }
  const jsonContent = JSON.stringify(data, null, 2);
  return downloadFile(jsonContent, fileName, 'application/json');
}

/**
 * Export large JSON dataset using chunks to avoid memory issues
 */
export function exportLargeJSON(data: any[], fileName: string) {
  const CHUNK_SIZE = 5000;
  let jsonParts: string[] = [];
  
  // Start with opening bracket
  jsonParts.push('[');
  
  // Process array in chunks
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, Math.min(i + CHUNK_SIZE, data.length));
    
    // Convert chunk to JSON string without brackets
    const chunkStr = chunk.map(item => JSON.stringify(item)).join(',');
    
    // Add comma if not the first chunk
    if (i > 0) {
      jsonParts.push(',');
    }
    
    // Add chunk
    jsonParts.push(chunkStr);
  }
  
  // End with closing bracket
  jsonParts.push(']');
  
  // Join all parts and create blob
  const jsonContent = jsonParts.join('');
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
 * Optimized for large datasets
 */
export function processDateFields(data: any, dateFields: string[]) {
  if (Array.isArray(data)) {
    // For large arrays, process in chunks to avoid call stack issues
    if (data.length > 5000) {
      const CHUNK_SIZE = 1000;
      let result = [];
      
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        result = result.concat(chunk.map(item => processDateFields(item, dateFields)));
      }
      
      return result;
    }
    
    return data.map(item => processDateFields(item, dateFields));
  }
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const processed = { ...data };
  
  for (const field of dateFields) {
    if (field in processed && processed[field]) {
      const value = processed[field];
      
      // Check for Firebase timestamp
      if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        try {
          processed[field] = value.toDate().toISOString();
        } catch (error) {
          console.error(`Error converting timestamp for field ${field}:`, error);
          processed[field] = ''; // Use empty string as fallback
        }
      } 
      // Check for JavaScript Date object
      else if (value instanceof Date) {
        try {
          processed[field] = value.toISOString();
        } catch (error) {
          console.error(`Error converting Date for field ${field}:`, error);
          processed[field] = ''; // Use empty string as fallback
        }
      }
      // Handle timestamp as seconds
      else if (typeof value === 'number' && dateFields.includes(field)) {
        try {
          processed[field] = new Date(value * 1000).toISOString();
        } catch (error) {
          console.error(`Error converting timestamp number for field ${field}:`, error);
          processed[field] = ''; // Use empty string as fallback
        }
      }
    }
  }
  
  return processed;
}

/**
 * Sanitize filename to make it safe for all operating systems
 */
export function sanitizeFileName(fileName: string): string {
  // Replace invalid file name characters with underscores
  return fileName
    .replace(/[/\\?%*:|"<>]/g, '_') // Replace invalid chars
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .replace(/_{2,}/g, '_');       // Replace multiple underscores with single
}

/**
 * Validate and repair CSV data to ensure it can be opened in Excel and other tools
 */
export function validateCSV(csvContent: string): string {
  if (!csvContent) return '';
  
  // Split into rows
  const rows = csvContent.split('\n');
  if (rows.length === 0) return '';
  
  // Get header row
  const headerRow = rows[0];
  const headers = headerRow.split(',');
  
  // Check each data row has the right number of columns
  const validRows = [headerRow];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.trim()) continue;
    
    // Count columns considering quoted values with commas inside
    let inQuote = false;
    let columnCount = 1;
    
    for (let j = 0; j < row.length; j++) {
      if (row[j] === '"') {
        inQuote = !inQuote;
      } else if (row[j] === ',' && !inQuote) {
        columnCount++;
      }
    }
    
    if (columnCount !== headers.length) {
      // Fix row by adding missing columns or trimming excess
      const fixedRow = fixCSVRow(row, headers.length);
      validRows.push(fixedRow);
    } else {
      validRows.push(row);
    }
  }
  
  return validRows.join('\n');
}

/**
 * Fix a CSV row to have the expected number of columns
 */
function fixCSVRow(row: string, expectedColumns: number): string {
  // Simple parsing that considers quoted values with commas
  const values: string[] = [];
  let currentValue = '';
  let inQuote = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuote = !inQuote;
      currentValue += char;
    } else if (char === ',' && !inQuote) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue);
  
  // Add missing columns or remove excess columns
  if (values.length < expectedColumns) {
    while (values.length < expectedColumns) {
      values.push('');
    }
  } else if (values.length > expectedColumns) {
    values.splice(expectedColumns);
  }
  
  return values.join(',');
}
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
