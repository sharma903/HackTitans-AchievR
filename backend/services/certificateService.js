const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

class CertificateService {
  
  async generateCertificateWithQR(certificateData) {
    try {
      console.log('📜 Generating professional certificate...');

      const {
        studentName,
        achievement,
        description,
        organizingBody,
        eventDate,
        achievementLevel,
        certificateId,
        headerText = 'CERTIFICATE OF ACHIEVEMENT'
      } = certificateData;

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([850, 1100]);
      const { width, height } = page.getSize();

      console.log('✅ PDF Document created');

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      console.log('✅ Fonts embedded successfully');

      // Background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(1, 0.98, 0.95)
      });

      // Outer border
      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0.2, 0.4, 0.8),
        borderWidth: 4
      });

      // Inner border
      page.drawRectangle({
        x: 40,
        y: 40,
        width: width - 80,
        height: height - 80,
        borderColor: rgb(0.2, 0.4, 0.8),
        borderWidth: 1
      });

      // Top accent
      page.drawRectangle({
        x: 40,
        y: height - 120,
        width: width - 80,
        height: 80,
        color: rgb(0.2, 0.4, 0.8, 0.1)
      });

      // Header
      const headerX = (width - (headerText.length * 8)) / 2;
      page.drawText(headerText, {
        x: headerX,
        y: height - 80,
        size: 36,
        color: rgb(0.2, 0.4, 0.8),
        font: helveticaBoldFont
      });

      // Line under header
      page.drawLine({
        start: { x: 100, y: height - 140 },
        end: { x: width - 100, y: height - 140 },
        thickness: 2,
        color: rgb(0.2, 0.4, 0.8)
      });

      // Student name section
      page.drawText('This Certificate is Proudly Presented to', {
        x: 50,
        y: height - 200,
        size: 14,
        color: rgb(0.1, 0.1, 0.1),
        font: helveticaFont
      });

      page.drawText(studentName.toUpperCase(), {
        x: 50,
        y: height - 250,
        size: 28,
        color: rgb(0.2, 0.4, 0.8),
        font: helveticaBoldFont
      });

      // Achievement section
      page.drawText('For Successfully Achieving', {
        x: 50,
        y: height - 310,
        size: 12,
        color: rgb(0.1, 0.1, 0.1),
        font: helveticaFont
      });

      page.drawText(achievement.toUpperCase(), {
        x: 50,
        y: height - 350,
        size: 20,
        color: rgb(0.2, 0.4, 0.8),
        font: helveticaBoldFont
      });

      // Description
      page.drawText('Achievement Description:', {
        x: 50,
        y: height - 410,
        size: 12,
        color: rgb(0.1, 0.1, 0.1),
        font: helveticaBoldFont
      });

      const descriptionLines = this.wrapText(description, 90);
      let descY = height - 440;

      for (const line of descriptionLines.slice(0, 5)) {
        page.drawText(line, {
          x: 70,
          y: descY,
          size: 11,
          color: rgb(0.3, 0.3, 0.3),
          font: helveticaFont
        });
        descY -= 20;
      }

      // Achievement details
      page.drawText('Achievement Details:', {
        x: 50,
        y: descY - 20,
        size: 11,
        color: rgb(0.1, 0.1, 0.1),
        font: helveticaBoldFont
      });

      descY -= 45;

      // Level (NO special characters)
      page.drawText(`Level: ${achievementLevel || 'College'}`, {
        x: 70,
        y: descY,
        size: 10,
        color: rgb(0.4, 0.4, 0.4),
        font: helveticaFont
      });

      descY -= 20;

      // Organization
      page.drawText(`Organized by: ${organizingBody || 'Unknown'}`, {
        x: 70,
        y: descY,
        size: 10,
        color: rgb(0.4, 0.4, 0.4),
        font: helveticaFont
      });

      descY -= 20;

      // Event date
      page.drawText(`Event Date: ${eventDate || new Date().toLocaleDateString()}`, {
        x: 70,
        y: descY,
        size: 10,
        color: rgb(0.4, 0.4, 0.4),
        font: helveticaFont
      });

      // Signature line
      page.drawLine({
        start: { x: 100, y: 280 },
        end: { x: 350, y: 280 },
        thickness: 1,
        color: rgb(0, 0, 0)
      });

      page.drawText('Authorized Signature', {
        x: 150,
        y: 260,
        size: 10,
        color: rgb(0, 0, 0),
        font: helveticaFont
      });

      // Verification info (NO SPECIAL CHARACTERS - REMOVED ARROW)
      page.drawText('Certificate Verification:', {
        x: 50,
        y: 200,
        size: 10,
        color: rgb(0.4, 0.4, 0.4),
        font: helveticaBoldFont
      });

      // Changed: Removed arrow character
      page.drawText('Scan QR Code for Instant Verification', {
        x: 50,
        y: 180,
        size: 9,
        color: rgb(0.5, 0.5, 0.5),
        font: helveticaFont
      });

      // Certificate ID
      page.drawText(`Certificate ID: ${certificateId}`, {
        x: 50,
        y: 150,
        size: 8,
        color: rgb(0.6, 0.6, 0.6),
        font: helveticaFont
      });

      // Issue date
      const issueDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      page.drawText(`Issued: ${issueDate}`, {
        x: 50,
        y: 130,
        size: 8,
        color: rgb(0.6, 0.6, 0.6),
        font: helveticaFont
      });

      // QR Code generation
      console.log('📱 Generating QR code...');
      const verificationUrl = `http://localhost:5000/api/certificates/verify/${certificateId}`;
      
      try {
        const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 200,
          margin: 1,
          color: { dark: '#000000', light: '#FFFFFF' }
        });

        const qrImage = await pdfDoc.embedPng(qrCodeBuffer);

        page.drawImage(qrImage, {
          x: width - 240,
          y: 80,
          width: 180,
          height: 180
        });

        page.drawText('Scan to Verify', {
          x: width - 240,
          y: 60,
          size: 9,
          color: rgb(0.2, 0.4, 0.8),
          font: helveticaBoldFont
        });

        console.log('✅ QR code embedded successfully');
      } catch (qrError) {
        console.warn('⚠️ QR warning:', qrError.message);
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      
      const certificateDir = './uploads/certificates';
      if (!fs.existsSync(certificateDir)) {
        fs.mkdirSync(certificateDir, { recursive: true });
      }

      const certificatePath = path.join(certificateDir, `${certificateId}.pdf`);
      fs.writeFileSync(certificatePath, pdfBytes);

      console.log('✅ Certificate PDF saved:', certificatePath);
      console.log('📊 PDF Size:', (pdfBytes.length / 1024).toFixed(2), 'KB');

      return {
        success: true,
        certificatePath,
        certificateId,
        fileSize: pdfBytes.length,
        qrEmbedded: true,
        message: 'Certificate generated successfully'
      };
    } catch (error) {
      console.error('❌ Error:', error.message);
      return { 
        success: false, 
        error: error.message
      };
    }
  }

  wrapText(text, maxLength) {
    if (!text) return [];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > maxLength) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  getCertificate(certificateId) {
    try {
      const certificatePath = path.join('./uploads/certificates', `${certificateId}.pdf`);

      if (fs.existsSync(certificatePath)) {
        return {
          exists: true,
          path: certificatePath,
          fileName: `${certificateId}.pdf`
        };
      }

      return { exists: false, error: 'Certificate not found' };
    } catch (error) {
      console.error('Error:', error);
      return { error: error.message };
    }
  }
}

module.exports = new CertificateService();
