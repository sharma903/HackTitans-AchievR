const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  
  // ========== SEND CERTIFICATE EMAIL ==========
  async sendCertificateEmail(studentEmail, studentName, certificateData) {
    try {
      console.log(`📧 Sending certificate to ${studentEmail} via SendGrid...`);

      const {
        certificateId,
        certificatePath,
        achievement,
        organizingBody,
        eventDate,
        achievementLevel
      } = certificateData;

      // Read PDF file
      if (!fs.existsSync(certificatePath)) {
        throw new Error(`Certificate file not found: ${certificatePath}`);
      }

      const pdfBuffer = fs.readFileSync(certificatePath);
      const base64PDF = pdfBuffer.toString('base64');

      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #1f40af 0%, #152d7a 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 32px; margin-bottom: 10px; }
            .header p { font-size: 16px; opacity: 0.9; }
            .content { padding: 30px 20px; }
            .achievement-box { background: linear-gradient(135deg, #f0f4ff 0%, #e8ecff 100%); border-left: 5px solid #1f40af; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .achievement-box h3 { color: #1f40af; margin-bottom: 10px; font-size: 18px; }
            .achievement-box p { color: #333; margin: 8px 0; font-size: 15px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .detail-item { background: #f9f9f9; padding: 12px; border-radius: 5px; border-left: 3px solid #1f40af; }
            .detail-item strong { color: #1f40af; display: block; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .detail-item span { color: #333; font-size: 14px; }
            .cert-id { background: #f0f0f0; padding: 12px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all; border: 1px solid #ddd; margin: 10px 0; }
            .button-container { text-align: center; margin: 30px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #1f40af 0%, #152d7a 100%); color: white; padding: 12px 35px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px; }
            .button:hover { opacity: 0.9; }
            .features { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .features h4 { color: #1f40af; margin-bottom: 10px; }
            .features ul { list-style: none; }
            .features li { padding: 8px 0; padding-left: 25px; position: relative; color: #333; }
            .features li:before { content: '✓'; position: absolute; left: 0; color: #1f40af; font-weight: bold; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .social-links { margin: 15px 0; }
            .social-links a { display: inline-block; margin: 0 10px; color: #1f40af; text-decoration: none; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            
            <!-- HEADER -->
            <div class="header">
              <h1>🎓 Congratulations!</h1>
              <p>Your Certificate Has Been Generated</p>
            </div>

            <!-- CONTENT -->
            <div class="content">
              <p>Dear <strong>${studentName}</strong>,</p>
              
              <p style="margin: 15px 0; color: #333;">We are pleased to inform you that your achievement has been officially verified and certified. Your certificate is now ready for download and sharing!</p>

              <!-- ACHIEVEMENT BOX -->
              <div class="achievement-box">
                <h3>Your Achievement</h3>
                <p><strong>${achievement}</strong></p>
                <p>Organized by: <strong>${organizingBody}</strong></p>
                ${achievementLevel ? `<p>Level: <strong>${achievementLevel}</strong></p>` : ''}
                ${eventDate ? `<p>Event Date: <strong>${new Date(eventDate).toLocaleDateString()}</strong></p>` : ''}
              </div>

              <!-- CERTIFICATE DETAILS -->
              <h3 style="color: #1f40af; margin-top: 25px; margin-bottom: 10px;">Certificate Information</h3>
              <div class="cert-id">${certificateId}</div>
              <p style="font-size: 12px; color: #666; margin-top: 8px;">Certificate ID: Save this for future reference</p>

              <!-- DETAILS GRID -->
              <div class="details-grid">
                <div class="detail-item">
                  <strong>Status</strong>
                  <span>✅ Verified & Approved</span>
                </div>
                <div class="detail-item">
                  <strong>Issued Date</strong>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <!-- FEATURES -->
              <div class="features">
                <h4>What You Can Do Now</h4>
                <ul>
                  <li>Download the attached PDF certificate</li>
                  <li>Share on LinkedIn, Resume, and with Employers</li>
                  <li>Scan the QR code in the certificate for verification</li>
                  <li>Anyone can verify your certificate online</li>
                  <li>Keep it as permanent proof of achievement</li>
                </ul>
              </div>

              <!-- BUTTONS -->
              <div class="button-container">
                <a href="${process.env.APP_URL}/certificates/verify/${certificateId}" class="button">Verify Online</a>
              </div>

              <!-- FOOTER -->
              <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #1f40af;">
                <p style="font-size: 13px; color: #333; margin: 0;">
                  <strong>How to share:</strong> You can now share this certificate on LinkedIn, add it to your resume, or send it to recruiters. Anyone can verify it using the certificate ID or by scanning the QR code.
                </p>
              </div>

            </div>

            <!-- FOOTER -->
            <div class="footer">
              <p><strong>AchievR</strong> - Centralized Digital Platform for Student Activity Records</p>
              <p style="margin-top: 10px; color: #999;">This is an automated email. Please do not reply to this address.</p>
              <p style="margin-top: 15px; font-size: 11px; color: #bbb;">© 2025 AchievR. All rights reserved.</p>
            </div>

          </div>
        </body>
        </html>
      `;

      // Send email with attachment via SendGrid
      const msg = {
        to: studentEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `🎓 Official Certificate - ${achievement}`,
        html: emailContent,
        attachments: [
          {
            content: base64PDF,
            filename: `${certificateId}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      const result = await sgMail.send(msg);
      
      console.log(`✅ Email sent successfully to ${studentEmail}`);
      console.log(`📧 Message ID: ${result[0].headers['x-message-id']}`);

      return { 
        success: true, 
        messageId: result[0].headers['x-message-id'],
        message: 'Certificate emailed successfully'
      };

    } catch (error) {
      console.error('❌ SendGrid Error:', error.message);
      if (error.response) {
        console.error('Response:', error.response.body);
      }
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ========== SEND REJECTION EMAIL ==========
  async sendRejectionEmail(studentEmail, studentName, reason) {
    try {
      console.log(`📧 Sending rejection email to ${studentEmail}...`);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #d9534f 0%, #ac2925 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; background: #1f40af; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Certificate Application Status</h1>
            </div>
            <div class="content">
              <p>Dear ${studentName},</p>
              <p>Unfortunately, your certificate application has been rejected.</p>
              <div class="alert-box">
                <strong>Reason:</strong><br>
                ${reason}
              </div>
              <p>You can resubmit your application with the necessary corrections.</p>
              <a href="${process.env.APP_URL}/submit-activity" class="button">Resubmit Application</a>
            </div>
          </div>
        </body>
        </html>
      `;

      const msg = {
        to: studentEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: '❌ Certificate Application - Rejected',
        html: html
      };

      await sgMail.send(msg);
      console.log('✅ Rejection email sent');
      return { success: true };

    } catch (error) {
      console.error('❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ========== SEND APPROVAL NOTIFICATION ==========
  async sendApprovalEmail(studentEmail, studentName, achievement) {
    try {
      console.log(`📧 Sending approval notification to ${studentEmail}...`);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #5cb85c 0%, #449d44 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; border-radius: 5px; color: #155724; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Application Approved!</h1>
            </div>
            <div class="content">
              <p>Dear ${studentName},</p>
              <div class="success-box">
                <strong>${achievement}</strong> has been approved!
              </div>
              <p>Your certificate will be generated and sent to your email shortly.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const msg = {
        to: studentEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: '✅ Application Approved!',
        html: html
      };

      await sgMail.send(msg);
      console.log('✅ Approval email sent');
      return { success: true };

    } catch (error) {
      console.error('❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
