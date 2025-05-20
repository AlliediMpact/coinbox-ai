# Analytics Export Feature

This document describes the analytics export feature implemented for the CoinBox Connect platform.

## Overview

The Analytics Export feature allows users to view, analyze and export their referral performance data in various formats. The system supports exporting data as CSV and JSON, as well as providing a print-friendly view.

## Key Components

### 1. Export Utility Library

Located at `/src/lib/export-utils.ts`, this library provides reusable functions for:

- Converting data to CSV format
- Exporting to CSV files
- Exporting to JSON files
- Processing date fields (especially for Firebase Timestamps)
- Formatting dates for filenames

### 2. Analytics Export UI

The export functionality is integrated into the `ReferralAnalytics` component and provides:

- Data preview before export
- Multiple export formats (CSV, JSON)
- Print functionality
- Loading states during export operations

## How to Use

### As a User

1. Navigate to the Referral Dashboard
2. Select the "Analytics" tab
3. Click the "Export Report" button
4. Choose from the available options:
   - Preview Data: View the data before exporting
   - Export as CSV: Download as CSV format
   - Export as JSON: Download as JSON format
5. If you choose Preview, you can also:
   - Print the report
   - Export directly from the preview dialog

### As a Developer

#### Adding Export to Another Component

```tsx
import { exportCSV, exportJSON, processDateFields, formatDateForFileName } from "@/lib/export-utils";

// Process data for export
const dataToExport = processDateFields(yourData, ['dateField1', 'dateField2']);

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
