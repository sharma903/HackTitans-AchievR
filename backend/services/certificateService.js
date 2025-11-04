const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

class CertificateService {
  async generateCertificateWithQR(certificateData) {
    try {
      console.log('\n📜 GENERATING CERTIFICATE');

      const { 
        studentName, 
        achievement, 
        organizingBody, 
        eventDate, 
        achievementLevel, 
        certificateId 
      } = certificateData;

      if (!studentName || !achievement || !certificateId) {
        throw new Error('Missing required fields');
      }

      // ✅ CREATE PDF DOCUMENT
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 40,
        bufferPages: true
      });

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Background
      doc.rect(0, 0, pageWidth, pageHeight).fill('#FFFFFF');

      // Borders
      doc.strokeColor('#000000').lineWidth(3);
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40).stroke();
      doc.lineWidth(1);
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60).stroke();

      // Title
      doc.fontSize(32).font('Helvetica-Bold').fillColor('#000000');
      doc.text('CERTIFICATE OF ACHIEVEMENT', { align: 'center' });

      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica').fillColor('#333333');
      doc.text('This is to certify that', { align: 'center' });

      // Student Name
      doc.moveDown(0.5);
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#000000');
      doc.text(studentName.toUpperCase(), { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').fillColor('#333333');
      doc.text('has successfully completed', { align: 'center' });

      // Achievement
      doc.moveDown(0.3);
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000');
      doc.text(achievement.toUpperCase(), { align: 'center' });

      // Details
      doc.moveDown(1);
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      doc.text(`Achievement Level: ${achievementLevel || 'College'}`);
      doc.text(`Organized by: ${organizingBody || 'Unknown'}`);
      
      const formattedDate = eventDate 
        ? new Date(eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      doc.text(`Event Date: ${formattedDate}`);
      doc.text(`Issued on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
      doc.text(`Certificate ID: ${certificateId}`);

      // ========== QR CODE ==========
      try {
        const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/certificates/verify/${certificateId}`;
        
        const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 100,
          margin: 1
        });

        // Add QR to PDF
        doc.image(qrCodeBuffer, pageWidth - 150, 50, { 
          width: 100, 
          height: 100 
        });

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
        doc.text('SCAN TO VERIFY', pageWidth - 150, 160, { 
          width: 100, 
          align: 'center' 
        });

        console.log('✅ QR embedded');
      } catch (qrErr) {
        console.warn('⚠️ QR warning:', qrErr.message);
      }

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#666666');
      doc.text('AchievR - Credential Verification System', { align: 'center' });

      // ========== CONVERT TO BUFFER ==========
      return new Promise((resolve, reject) => {
        try {
          // ✅ CORRECT WAY: Use toBuffer() method
          const chunks = [];

          doc.on('readable', () => {
            let chunk;
            while ((chunk = doc.read()) !== null) {
              chunks.push(chunk);
            }
          });

          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            console.log(`✅ PDF created: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

            resolve({
              success: true,
              pdfBuffer,
              certificateId,
              fileSize: pdfBuffer.length
            });
          });

          doc.on('error', (err) => {
            console.error('❌ PDF error:', err);
            reject(err);
          });

          // END DOCUMENT
          doc.end();

        } catch (error) {
          console.error('❌ Buffer error:', error);
          reject(error);
        }
      });

    } catch (error) {
      console.error('❌ Certificate error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CertificateService();
