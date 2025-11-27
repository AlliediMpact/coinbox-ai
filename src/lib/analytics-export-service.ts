/**
 * Analytics Export Service Implementation
 * 
 * This service provides functions to export analytics data in various formats.
 */

import { downloadFile, convertToCSV } from './export-utils';

// Initialize pdfMake (guard in case vfs is not available in the test environment)
try {
  // Only set `vfs` when it's undefined. Assigning to a non-configurable
  // property can throw in some test environments (causing the "Cannot redefine
  // property: vfs" error). Check for existence first to avoid redefinition.
  const existingVfs = (pdfMake as any).vfs;
  if (typeof existingVfs === 'undefined') {
    if ((pdfFonts as any)?.pdfMake?.vfs) {
      (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
    } else if ((pdfFonts as any)?.vfs) {
      (pdfMake as any).vfs = (pdfFonts as any).vfs;
    } else {
      // Provide an empty vfs to avoid runtime errors in tests
      (pdfMake as any).vfs = {};
    }
  }
} catch (e) {
  // Swallow and fallback — tests should not break due to pdf vfs issues
  try {
    if (typeof (pdfMake as any).vfs === 'undefined') {
      (pdfMake as any).vfs = {};
    }
  } catch (inner) {
    // If even this fails, there's nothing we can do safely here — continue.
  }
}

// Export formats supported
export type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel';

/**
 * Service for exporting analytics data
 */
class AnalyticsExportService {
  /**
   * Export transaction data
   */
  async exportTransactions(options: {
    format: ExportFormat;
    startDate?: Date;
    endDate?: Date;
  }): Promise<string> {
    try {
      // For demo purposes, we're creating sample data
      // In a real implementation, this would come from the actual analytics service
      const data = [
        {
          date: '2025-05-01',
          count: 243,
          volume: 425000,
          avgValue: 1749.38,
          currency: 'ZAR'
        },
        {
          date: '2025-05-02',
          count: 187,
          volume: 352000,
          avgValue: 1882.35,
          currency: 'ZAR'
        },
        {
          date: '2025-05-03',
          count: 212,
          volume: 398000,
          avgValue: 1877.36,
          currency: 'ZAR'
        }
      ];
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `coinbox-transactions-${timestamp}`;
      
      return this.exportData(data, fileName, options.format);
    } catch (error) {
      console.error('Failed to export transactions:', error);
      throw new Error('Failed to export transactions');
    }
  }
  
  /**
   * Export user growth data
   */
  async exportUserGrowth(options: {
    format: ExportFormat;
  }): Promise<string> {
    try {
      // For demo purposes, we're creating sample data
      const data = [
        {
          date: '2025-05-01',
          activeUsers: 1245,
          newUsers: 87,
          retentionRate: 0.78
        },
        {
          date: '2025-05-02',
          activeUsers: 1293,
          newUsers: 76,
          retentionRate: 0.81
        },
        {
          date: '2025-05-03',
          activeUsers: 1318,
          newUsers: 92,
          retentionRate: 0.79
        }
      ];
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `coinbox-user-growth-${timestamp}`;
      
      return this.exportData(data, fileName, options.format);
    } catch (error) {
      console.error('Failed to export user growth data:', error);
      throw new Error('Failed to export user growth data');
    }
  }
  
  /**
   * Export revenue analytics
   */
  async exportRevenue(options: {
    format: ExportFormat;
  }): Promise<string> {
    try {
      // For demo purposes, we're creating sample data
      const data = [
        {
          date: '2025-05-01',
          totalRevenue: 45000,
          transactionFees: 32000,
          subscriptions: 13000,
          growth: 0.05
        },
        {
          date: '2025-05-02',
          totalRevenue: 47500,
          transactionFees: 34000,
          subscriptions: 13500,
          growth: 0.06
        },
        {
          date: '2025-05-03',
          totalRevenue: 49000,
          transactionFees: 35000,
          subscriptions: 14000,
          growth: 0.03
        }
      ];
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `coinbox-revenue-${timestamp}`;
      
      return this.exportData(data, fileName, options.format);
    } catch (error) {
      console.error('Failed to export revenue data:', error);
      throw new Error('Failed to export revenue data');
    }
  }
  
  /**
   * Export system performance metrics
   */
  async exportSystemPerformance(options: {
    format: ExportFormat;
  }): Promise<string> {
    try {
      // For demo purposes, we're creating sample data
      const data = [
        {
          timestamp: '2025-05-24T00:00:00Z',
          uptime: 99.98,
          responseTime: 245,
          errorRate: 0.002
        },
        {
          timestamp: '2025-05-23T00:00:00Z',
          uptime: 99.95,
          responseTime: 256,
          errorRate: 0.004
        },
        {
          timestamp: '2025-05-22T00:00:00Z',
          uptime: 99.99,
          responseTime: 239,
          errorRate: 0.001
        }
      ];
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `coinbox-system-performance-${timestamp}`;
      
      return this.exportData(data, fileName, options.format);
    } catch (error) {
      console.error('Failed to export system performance data:', error);
      throw new Error('Failed to export system performance data');
    }
  }
  
  /**
   * Generic method to export data in the specified format
   */
    private exportData(
    data: any[],
    baseFileName: string,
    format: ExportFormat
  ): string {
    let content: string | Blob;
    let mimeType: string;
    let fileName: string;
    
    // Process data based on format
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        fileName = `${baseFileName}.json`;
        break;
        
      case 'csv':
        // Use the convertToCSV utility function for better formatting
        content = convertToCSV(data);
        mimeType = 'text/csv';
        fileName = `${baseFileName}.csv`;
        break;
        
      case 'pdf':
        // Require pdfMake at call-time so tests can mock it
        // eslint-disable-next-line
        const pdfMake = require('pdfmake/build/pdfmake');
        // eslint-disable-next-line
        const pdfFonts = require('pdfmake/build/vfs_fonts');

        // Ensure vfs is only assigned if not defined to avoid redefinition errors
        try {
          const existingVfs = (pdfMake as any).vfs;
          if (typeof existingVfs === 'undefined') {
            if ((pdfFonts as any)?.pdfMake?.vfs) {
              (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
            } else if ((pdfFonts as any)?.vfs) {
              (pdfMake as any).vfs = (pdfFonts as any).vfs;
            } else {
              (pdfMake as any).vfs = {};
            }
          }
        } catch (e) {
          try { if (typeof (pdfMake as any).vfs === 'undefined') (pdfMake as any).vfs = {}; } catch (_) {}
        }

        // Create PDF document definition
        const docDefinition = this.createPdfDocDefinition(data, baseFileName);

        // Create a PDF blob
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);

        // Use a promise to get the blob
        return new Promise<string>((resolve, reject) => {
          try {
            pdfDocGenerator.getBlob((blob: any) => {
              fileName = `${baseFileName}.pdf`;
              downloadFile(blob, fileName, 'application/pdf');
              resolve(fileName);
            });
          } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to JSON if PDF generation fails
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
            fileName = `${baseFileName}.json`;
            downloadFile(content, fileName, mimeType);
            resolve(fileName);
          }
        }) as any; // Type assertion to match the return type
        
      case 'excel':
        try {
          // Require XLSX at call-time to let tests mock it
          // eslint-disable-next-line
          const XLSX = require('xlsx');

          // Create a worksheet from the data
          const worksheet = XLSX.utils.json_to_sheet(data);

          // Create a workbook and add the worksheet
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

          // Generate Excel file buffer
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

          // Create blob from buffer
          const excelBlob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

          // Download the file
          fileName = `${baseFileName}.xlsx`;
          return downloadFile(excelBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } catch (error) {
          console.error('Error generating Excel file:', error);
          // Fallback to JSON if Excel generation fails
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          fileName = `${baseFileName}.json`;
          return downloadFile(content, fileName, mimeType);
        }
    }
    
    // Download the file for non-async formats (JSON, CSV)
    return downloadFile(content as string | Blob, fileName, mimeType);
  }
  
  /**
   * Create PDF document definition for pdfMake
   */
  private createPdfDocDefinition(data: any[], title: string): any {
    // Extract headers from the first data item
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    
    // Create table body starting with headers
    const tableBody = [
      headers.map(header => ({
        text: this.formatHeaderText(header),
        style: 'tableHeader',
        bold: true,
      }))
    ];
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => ({
        text: String(item[header] || ''),
        style: 'tableCell',
      }));
      tableBody.push(row);
    });
    
    // Return the document definition
    return {
      content: [
        { text: title, style: 'header' },
        { text: `Generated on: ${new Date().toLocaleDateString()}`, style: 'subheader' },
        {
          table: {
            headerRows: 1,
            widths: Array(headers.length).fill('*'), // Distribute width evenly
            body: tableBody,
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          margin: [0, 0, 0, 10],
          italics: true,
          color: '#666',
        },
        tableHeader: {
          fontSize: 12,
          bold: true,
          color: '#333',
          fillColor: '#f2f2f2',
          padding: 8,
        },
        tableCell: {
          fontSize: 10,
          padding: 5,
        },
      },
      defaultStyle: {
        font: 'Roboto',
      },
      footer: (currentPage: number, pageCount: number) => ({
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 10],
      }),
    };
  }
  
  /**
   * Format header text for better readability
   */
  private formatHeaderText(text: string): string {
    // Convert camelCase or snake_case to Title Case with spaces
    return text
      .replace(/([A-Z])/g, ' $1')  // Insert space before capital letters
      .replace(/_/g, ' ')          // Replace underscores with spaces
      .replace(/^\w/, c => c.toUpperCase())  // Capitalize first letter
      .trim();
  }
}

export const analyticsExportService = new AnalyticsExportService();
