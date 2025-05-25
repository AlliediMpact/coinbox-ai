/**
 * PDF Generator service for CoinBox Connect
 * 
 * This service generates PDF documents for receipts, invoices, and reports.
 * It uses the client's PDF.js library when in the browser, and a server-side
 * PDF generation library when running on the server.
 */

// Using dynamic import to handle server vs client environments
let pdfLib: any = null;

// For server-side, asynchronously load the PDF generation library
const loadPdfLib = async () => {
  if (typeof window === 'undefined') {
    try {
      // Server-side PDF generation using PDFKit
      const PDFDocument = await import('pdfkit');
      const fs = await import('fs');
      const { Storage } = await import('@google-cloud/storage');
      
      pdfLib = {
        PDFDocument,
        fs,
        storage: new Storage()
      };
    } catch (error) {
      console.error('Failed to load server-side PDF generation libraries:', error);
    }
  } else {
    // Client-side PDF generation using PDF.js
    try {
      const { jsPDF } = await import('jspdf');
      pdfLib = { jsPDF };
    } catch (error) {
      console.error('Failed to load client-side PDF generation libraries:', error);
    }
  }
};

// Load the appropriate library
loadPdfLib();

interface PdfGenerationOptions {
  title: string;
  [key: string]: any;
}

/**
 * Generate a PDF document with the provided data
 * 
 * @param options PDF generation options
 * @returns URL to the generated PDF
 */
export async function generatePDF(options: PdfGenerationOptions): Promise<string> {
  // Ensure PDF library is loaded
  if (!pdfLib) {
    await loadPdfLib();
    if (!pdfLib) {
      throw new Error('PDF generation library failed to load');
    }
  }

  // Generate file name
  const fileName = `${options.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.pdf`;
  
  try {
    // Server-side generation
    if (typeof window === 'undefined') {
      return await generateServerSidePDF(options, fileName);
    }
    // Client-side generation
    else {
      return await generateClientSidePDF(options, fileName);
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generate PDF on the server using PDFKit
 */
async function generateServerSidePDF(options: PdfGenerationOptions, fileName: string): Promise<string> {
  const { PDFDocument, fs, storage } = pdfLib;
  const doc = new PDFDocument();
  
  // Write to a buffer
  const pdfBuffer: Buffer[] = [];
  doc.on('data', (chunk) => pdfBuffer.push(chunk));
  
  // Basic PDF content generation
  doc.fontSize(25).text(options.title, 100, 80);
  
  if (options.receiptId) {
    doc.fontSize(12).text(`Receipt ID: ${options.receiptId}`, 100, 120);
    doc.text(`Payment ID: ${options.paymentId}`, 100, 140);
    doc.text(`Date: ${options.date.toLocaleDateString()}`, 100, 160);
    doc.text(`Status: ${options.status.toUpperCase()}`, 100, 180);
    
    // Customer information
    doc.moveDown(2);
    doc.fontSize(16).text('Customer Details', 100, 220);
    doc.fontSize(12).text(`Name: ${options.customerName}`, 100, 240);
    if (options.customerEmail) {
      doc.text(`Email: ${options.customerEmail}`, 100, 260);
    }
    if (options.customerPhone) {
      doc.text(`Phone: ${options.customerPhone}`, 100, 280);
    }
    
    // Payment details
    doc.moveDown(2);
    doc.fontSize(16).text('Payment Details', 100, 320);
    doc.fontSize(12).text(`Amount: ${options.currency} ${options.amount.toFixed(2)}`, 100, 340);
    
    // Items table
    if (options.items && options.items.length > 0) {
      doc.moveDown(2);
      doc.fontSize(16).text('Items', 100, 380);
      
      let yPos = 400;
      const startX = 100;
      
      // Table headers
      doc.fontSize(12);
      doc.text('Description', startX, yPos);
      doc.text('Quantity', startX + 200, yPos);
      doc.text('Unit Price', startX + 280, yPos);
      doc.text('Total', startX + 360, yPos);
      
      yPos += 20;
      
      // Table rows
      options.items.forEach((item: any) => {
        doc.text(item.description, startX, yPos);
        doc.text(item.quantity.toString(), startX + 200, yPos);
        doc.text(`${options.currency} ${item.unitPrice.toFixed(2)}`, startX + 280, yPos);
        doc.text(`${options.currency} ${item.totalPrice.toFixed(2)}`, startX + 360, yPos);
        yPos += 20;
      });
    }
    
    // Company information
    if (options.companyInfo) {
      doc.moveDown(4);
      const company = options.companyInfo;
      doc.fontSize(10).text(company.name, 100, 600);
      doc.text(company.address, 100, 615);
      doc.text(`Email: ${company.email} | Phone: ${company.phone}`, 100, 630);
    }
  }
  
  // End the document
  doc.end();
  
  // Wait for the PDF to be fully generated
  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      try {
        // Upload to Google Cloud Storage
        const bucket = storage.bucket(process.env.PDF_STORAGE_BUCKET || 'coinbox-receipts');
        const file = bucket.file(`receipts/${fileName}`);
        
        await file.save(Buffer.concat(pdfBuffer));
        await file.makePublic();
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/receipts/${fileName}`;
        resolve(publicUrl);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Generate PDF on the client using jsPDF
 */
async function generateClientSidePDF(options: PdfGenerationOptions, fileName: string): Promise<string> {
  const { jsPDF } = pdfLib;
  const doc = new jsPDF();
  
  // Basic PDF content generation
  doc.setFontSize(25);
  doc.text(options.title, 20, 20);
  
  if (options.receiptId) {
    doc.setFontSize(12);
    doc.text(`Receipt ID: ${options.receiptId}`, 20, 40);
    doc.text(`Payment ID: ${options.paymentId}`, 20, 50);
    doc.text(`Date: ${options.date.toLocaleDateString()}`, 20, 60);
    doc.text(`Status: ${options.status.toUpperCase()}`, 20, 70);
    
    // Customer information
    doc.setFontSize(16);
    doc.text('Customer Details', 20, 90);
    doc.setFontSize(12);
    doc.text(`Name: ${options.customerName}`, 20, 100);
    if (options.customerEmail) {
      doc.text(`Email: ${options.customerEmail}`, 20, 110);
    }
    if (options.customerPhone) {
      doc.text(`Phone: ${options.customerPhone}`, 20, 120);
    }
    
    // Payment details
    doc.setFontSize(16);
    doc.text('Payment Details', 20, 140);
    doc.setFontSize(12);
    doc.text(`Amount: ${options.currency} ${options.amount.toFixed(2)}`, 20, 150);
    
    // Items table
    if (options.items && options.items.length > 0) {
      doc.setFontSize(16);
      doc.text('Items', 20, 170);
      
      let yPos = 180;
      const startX = 20;
      
      // Table headers
      doc.setFontSize(12);
      doc.text('Description', startX, yPos);
      doc.text('Quantity', startX + 80, yPos);
      doc.text('Unit Price', startX + 110, yPos);
      doc.text('Total', startX + 150, yPos);
      
      yPos += 10;
      
      // Table rows
      options.items.forEach((item: any) => {
        doc.text(item.description, startX, yPos);
        doc.text(item.quantity.toString(), startX + 80, yPos);
        doc.text(`${options.currency} ${item.unitPrice.toFixed(2)}`, startX + 110, yPos);
        doc.text(`${options.currency} ${item.totalPrice.toFixed(2)}`, startX + 150, yPos);
        yPos += 10;
      });
    }
    
    // Company information
    if (options.companyInfo) {
      const company = options.companyInfo;
      doc.setFontSize(10);
      doc.text(company.name, 20, 250);
      doc.text(company.address, 20, 260);
      doc.text(`Email: ${company.email} | Phone: ${company.phone}`, 20, 270);
    }
  }
  
  // Generate a data URL for the PDF
  const pdfDataUrl = doc.output('datauristring');
  
  // In a real app, we might upload this to a server or storage service
  // For demo purposes, we'll just return the data URL
  return pdfDataUrl;
}
