const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const certificateService = require('../services/certificateService');
const emailService = require('../utils/emailService'); 
const Certificate = require('../models/Certificate');
const Activity = require('../models/Activity');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

console.log('✅ Email service loaded in routes');

// ========== GENERATE CERTIFICATE (Draft) ==========
router.post('/generate/:activityId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'faculty' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only faculty/admin can generate' });
    }

    const activity = await Activity.findById(req.params.activityId)
      .populate('student', 'name email');

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const certificateId = `CERT_${activity._id.toString().slice(0, 8)}_${Date.now()}`;

    console.log('📜 Generating certificate...');

    const certResult = await certificateService.generateCertificateWithQR({
      studentName: activity.student.name,
      achievement: activity.title,
      description: activity.description,
      organizingBody: activity.organizingBody,
      eventDate: activity.eventDate?.toLocaleDateString() || new Date().toLocaleDateString(),
      achievementLevel: activity.achievementLevel,
      certificateId: certificateId,
      headerText: 'CERTIFICATE OF ACHIEVEMENT'
    });

    if (!certResult.success) {
      return res.status(500).json(certResult);
    }

    console.log('✅ Certificate PDF generated');

    res.json({
      success: true,
      certificateId,
      certificatePath: certResult.certificatePath,
      studentName: activity.student.name,
      studentEmail: activity.student.email,
      studentId: activity.student._id,
      achievement: activity.title,
      description: activity.description,
      organizingBody: activity.organizingBody,
      achievementLevel: activity.achievementLevel,
      eventDate: activity.eventDate?.toLocaleDateString(),
      message: '✅ Certificate generated. Click "Send to Student" to email.',
      status: 'draft'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== SUBMIT CERTIFICATE & SEND EMAIL ==========
router.post('/submit/:activityId', authMiddleware, async (req, res) => {
  try {
    console.log('\n\n' + '='.repeat(70));
    console.log('📧 CERTIFICATE SUBMIT & EMAIL PROCESS');
    console.log('='.repeat(70));

    const user = await User.findById(req.user.userId);
    if (user.role !== 'faculty' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const {
      certificateId,
      certificatePath,
      studentName,
      studentEmail,
      studentId,
      achievement,
      organizingBody,
      achievementLevel,
      eventDate
    } = req.body;

    // ========== VALIDATION ==========
    console.log('\n✅ Step 1: VALIDATION');
    console.log(`   Certificate ID: ${certificateId}`);
    console.log(`   Student Email: ${studentEmail}`);
    console.log(`   Student Name: ${studentName}`);

    if (!certificateId || !certificatePath || !studentEmail || !studentName) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { certificateId, certificatePath, studentEmail, studentName }
      });
    }
    console.log('✅ All fields validated');

    // ========== FILE CHECK ==========
    console.log('\n✅ Step 2: FILE CHECK');
    console.log(`   File path: ${certificatePath}`);
    
    if (!fs.existsSync(certificatePath)) {
      console.log(`❌ File not found!`);
      return res.status(404).json({ error: `Certificate file not found: ${certificatePath}` });
    }
    
    const fileSize = fs.statSync(certificatePath).size;
    console.log(`✅ File found (${(fileSize / 1024).toFixed(2)} KB)`);

    // ========== SAVE TO DATABASE ==========
    console.log('\n✅ Step 3: DATABASE SAVE');
    
    const certificateHash = crypto
      .createHash('sha256')
      .update(certificateId + studentId + new Date().toISOString())
      .digest('hex');

    const verificationCode = crypto.randomBytes(16).toString('hex');

    const certificate = new Certificate({
      certificateId,
      activity: req.params.activityId,
      student: studentId,
      issuedBy: req.user.userId,
      title: achievement,
      description: req.body.description || '',
      organizingBody: organizingBody,
      achievementLevel: achievementLevel,
      eventDate: eventDate,
      pdfPath: certificatePath,
      certificateHash,
      verificationCode,
      status: 'active',
      issuedAt: new Date()
    });

    await certificate.save();
    console.log(`✅ Certificate saved to DB (ID: ${certificate._id})`);

    // ========== SEND EMAIL ==========
    console.log('\n✅ Step 4: SENDING EMAIL');
    console.log(`   Service: SendGrid`);
    console.log(`   From: ${process.env.SENDGRID_FROM_EMAIL}`);
    console.log(`   To: ${studentEmail}`);
    console.log(`   Attachment: ${certificateId}.pdf`);

    const emailResult = await emailService.sendCertificateEmail(
      studentEmail,
      studentName,
      {
        certificateId,
        certificatePath,
        achievement,
        organizingBody,
        eventDate,
        achievementLevel
      }
    );

    if (!emailResult.success) {
      console.log(`❌ Email failed: ${emailResult.error}`);
      
      // Still save but mark as failed
      await Activity.findByIdAndUpdate(
        req.params.activityId,
        { 
          emailStatus: 'failed', 
          emailFailureReason: emailResult.error,
          certificate: certificate._id,
          certificateId: certificateId,
          status: 'certified'
        }
      );

      return res.status(500).json({
        success: false,
        certificateSaved: true,
        emailSent: false,
        error: emailResult.error,
        message: 'Certificate saved but email failed. You can retry sending.'
      });
    }

    console.log(`✅ Email sent successfully`);
    console.log(`   Message ID: ${emailResult.messageId}`);

    // ========== UPDATE ACTIVITY ==========
    console.log('\n✅ Step 5: UPDATE ACTIVITY');
    
    const activity = await Activity.findByIdAndUpdate(
      req.params.activityId,
      {
        certificate: certificate._id,
        certificateId: certificateId,
        certificatePath: certificatePath,
        status: 'certified',
        emailStatus: 'sent',
        emailSentAt: new Date(),
        certificateGeneratedAt: new Date(),
        certificateGeneratedBy: req.user.userId
      },
      { new: true }
    );

    console.log('✅ Activity updated');

    console.log('='.repeat(70));
    console.log('🎉 SUCCESS! Certificate submitted and emailed!');
    console.log('='.repeat(70) + '\n');

    res.json({
      success: true,
      message: '✅ Certificate emailed successfully!',
      certificateId,
      emailSent: true,
      studentEmail,
      messageId: emailResult.messageId,
      verificationCode
    });

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error);
    console.log('='.repeat(70) + '\n');
    
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== RESEND EMAIL ==========
router.post('/resend/:certificateId', authMiddleware, async (req, res) => {
  try {
    console.log(`\n📧 Resending certificate email...`);

    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('student', 'name email');

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    console.log(`   To: ${certificate.student.email}`);
    console.log(`   File: ${certificate.pdfPath}`);

    const emailResult = await emailService.sendCertificateEmail(
      certificate.student.email,
      certificate.student.name,
      {
        certificateId: certificate.certificateId,
        certificatePath: certificate.pdfPath,
        achievement: certificate.title,
        organizingBody: certificate.organizingBody,
        eventDate: certificate.eventDate,
        achievementLevel: certificate.achievementLevel
      }
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error
      });
    }

    console.log('✅ Email resent successfully\n');

    res.json({
      success: true,
      message: '✅ Email resent',
      studentEmail: certificate.student.email
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== DOWNLOAD CERTIFICATE ==========
router.get('/download/:certificateId', async (req, res) => {
  try {
    const certificatePath = path.join('./uploads/certificates', `${req.params.certificateId}.pdf`);

    if (!fs.existsSync(certificatePath)) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    await Certificate.updateOne(
      { certificateId: req.params.certificateId },
      { 
        $inc: { downloadCount: 1 },
        lastDownloadedAt: new Date()
      }
    );

    res.download(certificatePath, `${req.params.certificateId}.pdf`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== VIEW CERTIFICATE ==========
router.get('/view/:certificateId', async (req, res) => {
  try {
    const certificatePath = path.join('./uploads/certificates', `${req.params.certificateId}.pdf`);

    if (!fs.existsSync(certificatePath)) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    await Certificate.updateOne(
      { certificateId: req.params.certificateId },
      { 
        $inc: { viewCount: 1 },
        lastViewedAt: new Date()
      }
    );

    res.sendFile(path.resolve(certificatePath));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== VERIFY CERTIFICATE (Public) ==========
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('student', 'name email rollNumber')
      .populate('activity', 'title description eventDate')
      .populate('issuedBy', 'name email');

    if (!certificate) {
      return res.status(404).json({
        verified: false,
        message: 'Certificate not found'
      });
    }

    if (!certificate.isValid) {
      return res.status(403).json({
        verified: false,
        message: 'Certificate is revoked or invalid'
      });
    }

    const clientIp = req.ip || req.connection.remoteAddress;
    await certificate.recordVerification(req.query.email || 'public', clientIp);

    res.json({
      verified: true,
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.student.name,
        studentEmail: certificate.student.email,
        achievement: certificate.activity.title,
        organizingBody: certificate.organizingBody,
        issuedDate: certificate.issuedAt,
        status: certificate.status,
        verificationCount: certificate.verificationCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
