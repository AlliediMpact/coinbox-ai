import { analyticsExportService } from '../lib/analytics-export-service';
import { downloadFile, convertToCSV } from '../lib/export-utils';

// Mock the download file functionality
jest.mock('../lib/export-utils', () => ({
  downloadFile: jest.fn((content, fileName) => fileName),
  convertToCSV: jest.fn(data => {
    if (!data || !data.length) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    return `${headers}\n${rows}`;
  })
}));

// Mock pdfMake
jest.mock('pdfmake/build/pdfmake', () => ({
  createPdf: jest.fn().mockReturnValue({
    getBlob: jest.fn(callback => callback(new Blob(['pdf content'])))
  })
}));

// Mock XLSX
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn()
  },
  write: jest.fn(() => new ArrayBuffer(10))
}));

describe('Analytics Export Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should export transactions in JSON format', async () => {
    const result = await analyticsExportService.exportTransactions({
      format: 'json',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-24')
    });

    expect(downloadFile).toHaveBeenCalled();
    expect(result).toContain('coinbox-transactions');
    expect(result).toContain('.json');
  });

  test('should export transactions in CSV format', async () => {
    const result = await analyticsExportService.exportTransactions({
      format: 'csv',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-24')
    });

    expect(convertToCSV).toHaveBeenCalled();
    expect(downloadFile).toHaveBeenCalled();
    expect(result).toContain('coinbox-transactions');
    expect(result).toContain('.csv');
  });

  test('should export transactions in PDF format', async () => {
    const result = await analyticsExportService.exportTransactions({
      format: 'pdf',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-24')
    });

    expect(downloadFile).toHaveBeenCalled();
    expect(result).toContain('coinbox-transactions');
    expect(result).toContain('.pdf');
  });

  test('should export transactions in Excel format', async () => {
    const result = await analyticsExportService.exportTransactions({
      format: 'excel',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-24')
    });

    expect(downloadFile).toHaveBeenCalled();
    expect(result).toContain('coinbox-transactions');
    expect(result).toContain('.xlsx');
  });

  test('should export user growth data', async () => {
    const result = await analyticsExportService.exportUserGrowth({
      format: 'json'
    });

    expect(downloadFile).toHaveBeenCalled();
    expect(result).toContain('coinbox-user-growth');
  });

  test('should export revenue data', async () => {
    const result = await analyticsExportService.exportRevenue({
      format: 'json'
    });

    expect(downloadFile).toHaveBeenCalled();
    expect(result).toContain('coinbox-revenue');
  });

  test('should export system performance data', async () => {
    const result = await analyticsExportService.exportSystemPerformance({
      format: 'json'
    });

    expect(downloadFile).toHaveBeenCalled();
    expect(result).toContain('coinbox-system-performance');
  });

  test('should handle errors gracefully', async () => {
    // Mock downloadFile to throw an error
    (downloadFile as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Failed to download');
    });

    await expect(analyticsExportService.exportTransactions({
      format: 'json'
    })).rejects.toThrow('Failed to export transactions');
  });
});
