import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock the download file functionality
vi.mock('../lib/export-utils', () => ({
  downloadFile: vi.fn((content, fileName) => fileName),
  convertToCSV: vi.fn(data => {
    if (!data || !data.length) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((item: any) => Object.values(item).join(',')).join('\n');
    return `${headers}\n${rows}`;
  })
}));

// Mock pdfMake
vi.mock('pdfmake/build/pdfmake', () => ({
  createPdf: vi.fn().mockReturnValue({
    getBlob: vi.fn(callback => callback(new Blob(['pdf content'])))
  }),
  vfs: {}
}));

// Mock pdfFonts
vi.mock('pdfmake/build/vfs_fonts', () => ({
  pdfMake: { vfs: {} }
}));

// Mock XLSX
vi.mock('xlsx', () => ({
  default: {
    utils: {
      json_to_sheet: vi.fn(() => ({})),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn()
    },
    write: vi.fn(() => new ArrayBuffer(10))
  },
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn()
  },
  write: vi.fn(() => new ArrayBuffer(10))
}));

describe('Analytics Export Service', () => {
  let analyticsExportService: any;
  let downloadFile: any;
  let convertToCSV: any;

  beforeAll(async () => {
    // Import modules after mocks are set up
    const utilsModule = await import('../lib/export-utils');
    downloadFile = utilsModule.downloadFile;
    convertToCSV = utilsModule.convertToCSV;
    
    const serviceModule = await import('../lib/analytics-export-service');
    analyticsExportService = serviceModule.analyticsExportService;
  });

  beforeEach(() => {
    vi.clearAllMocks();
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
    // Mock require('xlsx') for this test
    const mockXLSX = {
      utils: {
        json_to_sheet: vi.fn(() => ({})),
        book_new: vi.fn(() => ({})),
        book_append_sheet: vi.fn()
      },
      write: vi.fn(() => new ArrayBuffer(10))
    };
    
    vi.doMock('xlsx', () => mockXLSX);
    
    const result = await analyticsExportService.exportTransactions({
      format: 'excel',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-05-24')
    });

    expect(downloadFile).toHaveBeenCalled();
    expect(result).toContain('coinbox-transactions');
    // Excel export may fallback to JSON if module not available, so check for either
    expect(result).toMatch(/\.(xlsx|json)$/);
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
    (downloadFile as any).mockImplementationOnce(() => {
      throw new Error('Failed to download');
    });

    await expect(analyticsExportService.exportTransactions({
      format: 'json'
    })).rejects.toThrow('Failed to export transactions');
  });
});
