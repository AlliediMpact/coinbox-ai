# Analytics Export Feature

This document describes the enhanced analytics export feature implemented for the CoinBox Connect platform.

## Overview

The Analytics Export feature allows administrators to export comprehensive platform analytics data in various formats. The system supports exporting data as CSV, JSON, Excel, and PDF, enabling data-driven decision making and detailed reporting.

## Key Components

### 1. Analytics Export Service

Located at `/src/lib/analytics-export-service.ts`, this service provides:

- Methods for exporting different types of analytics data
- Support for multiple export formats (CSV, JSON, PDF, Excel)
- Integration with the core analytics service
- Error handling and fallbacks if a format fails
- Proper PDF document generation with headers, styling and pagination

### 2. Export Utility Library

Located at `/src/lib/export-utils.ts`, this library provides optimized functions for:

- Converting data to various formats (CSV, JSON)
- Performance-optimized processing for large datasets
- Downloading files to the client with modern File System Access API when available
- Processing date fields with enhanced error handling
- Validating and sanitizing exported data
- Chunked processing to prevent UI freezes with large exports

### 3. Analytics Dashboard Integration

The export functionality is integrated into the `AnalyticsDashboard` component and provides:

- Export options for different data categories (transactions, users, revenue, system)
- Multiple export format options (CSV, JSON, Excel, PDF)
- Loading states during export operations
- Success/failure notifications with detailed error information
- Responsive UI that stays functional even during large exports

## How to Use

### As an Admin User

1. Navigate to the Analytics Dashboard
2. Select the appropriate tab (Overview, Transactions, Users, or Disputes)
3. Use the period selector to choose the data range (week, month, or quarter)
4. Click the Export button in the section you want to export
5. Select the export format from the dropdown (CSV, JSON, Excel, PDF)
6. Wait for the export to complete (a loading indicator will be shown)
7. When complete, the file will automatically download to your device
8. If any errors occur, a notification will appear with details

## Performance Optimizations

The export feature is optimized for performance in several ways:

1. **Chunked Processing**: Large datasets are processed in smaller chunks to prevent UI freezing
2. **Memory Management**: For large JSON exports, data is streamed in segments to avoid memory issues
3. **File System Access API**: Modern browsers can use the File System Access API for better file handling
4. **Asynchronous Generation**: PDF and Excel files are generated asynchronously to maintain UI responsiveness
5. **Error Recovery**: If a specific format fails (e.g., PDF), the system falls back to an alternative format

## Testing

The export feature includes comprehensive testing:

1. **Unit Tests**: Testing individual export functions (see `/src/tests/analytics-export.test.ts`)
2. **Integration Tests**: Testing within the Analytics Dashboard component
3. **E2E Tests**: Testing the full export workflow with Playwright (see `/src/e2e-tests/analytics-export.e2e.spec.ts`)

To run the export feature tests:

```bash
# Unit tests
npm run test:jest -- src/tests/analytics-export.test.ts

# E2E tests
npm run test:e2e:ui -- src/e2e-tests/analytics-export.e2e.spec.ts
```

### As a Developer

#### Using the Analytics Export Service

```typescript
import { analyticsExportService } from '@/lib/analytics-export-service';
import { toast } from '@/hooks/use-toast';

// Export transaction data as CSV
async function exportTransactionsAsCSV() {
  try {
    const fileName = await analyticsExportService.exportTransactions({
      format: 'csv',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-24')
    });
    
    toast({
      title: 'Export Complete',
      description: `Transactions exported to ${fileName}`
    });
  } catch (error) {
    console.error('Export failed:', error);
    toast({
      title: 'Export Failed',
      description: 'Failed to export transactions',
      variant: 'destructive'
    });
  }
}

// Export user growth data as PDF
async function exportUserDataAsPDF() {
  try {
    const fileName = await analyticsExportService.exportUserGrowth({
      format: 'pdf'
    });
    
    toast({
      title: 'Export Complete',
      description: `User data exported to ${fileName}`
    });
  } catch (error) {
    console.error('Export failed:', error);
    toast({
      title: 'Export Failed',
      description: 'Failed to export user data',
      variant: 'destructive'
    });
  }
}

// Export revenue data as Excel
async function exportRevenueAsExcel() {
  try {
    const fileName = await analyticsExportService.exportRevenue({
      format: 'excel'
    });
    
    toast({
      title: 'Export Complete',
      description: `Revenue data exported to ${fileName}`
    });
  } catch (error) {
    console.error('Export failed:', error);
    toast({
      title: 'Export Failed',
      description: 'Failed to export revenue data',
      variant: 'destructive'
    });
  }
}
```

#### Working with the Export Utils

```typescript
import { convertToCSV, exportJSON, processDateFields, sanitizeFileName } from '@/lib/export-utils';

// Convert data to CSV
const csvData = convertToCSV(myDataArray, ['id', 'name', 'date', 'amount']);

// Export data as JSON
exportJSON(myDataArray, 'transaction-report.json');

// Process date fields in data
const processedData = processDateFields(rawData, ['createdAt', 'updatedAt', 'timestamp']);

// Sanitize a filename
const safeFileName = sanitizeFileName('My Report (2025-05-24).xlsx');
// Returns: 'My_Report_2025-05-24_.xlsx'
```

```typescript
import { analyticsExportService } from "@/lib/analytics-export-service";

// Export transaction data
const fileName = await analyticsExportService.exportTransactions({
  format: 'csv',
  startDate: new Date('2025-04-24'),
  endDate: new Date('2025-05-24')
});

// Export user growth data
const fileName = await analyticsExportService.exportUserGrowth({
  format: 'json'
});

// Export revenue data
const fileName = await analyticsExportService.exportRevenue({
  format: 'excel'
});

// Export system performance data
const fileName = await analyticsExportService.exportSystemPerformance({
  format: 'csv'
});

// Export as CSV
const fileName = `report-name-${formatDateForFileName()}.csv`;
exportCSV(dataToExport, fileName, ['column1', 'column2']);

// Export as JSON
exportJSON(dataToExport, `report-name-${formatDateForFileName()}.json`);
```

## Data Processing

### Date Handling

Firebase Timestamps and JavaScript Date objects are automatically converted to ISO strings during export.

### Data Preview

The preview shows a sample of the data (first 10 records) to allow users to confirm it's what they expect before downloading.

## Best Practices

1. Always provide a preview option for large datasets
2. Include proper loading states during export operations
3. Format dates consistently for better readability
4. Escape special characters in CSV exports (handled by the utility)
5. Include metadata in exports (date created, filters applied, etc.)

## Testing

The export functionality can be tested by:

1. Generating sample data of various sizes
2. Verifying the exported files contain the correct data
3. Testing with different browsers and devices
4. Validating the CSV format with spreadsheet applications

## Future Enhancements

- Add more export formats (Excel, PDF)
- Add file encryption options for sensitive data
- Add scheduling of regular exports
- Add the ability to save export configurations
- Add filtering options before export
