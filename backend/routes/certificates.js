const express = require('express');
const Certificate = require('../models/Certificate');
const Activity = require('../models/Activity');
const User = require('../models/User');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { sendCertificateIssuedEmail } = require('../utils/emailService');

const router = express.Router();

//GENERATE CERTIFICATE (ADMIN
router.post('/generate/:activityId', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId).populate('student');

    if (!activity) return res.status(404).json({ error: 'Activity not found' });

    //  BLOCKCHAIN HASH 
    const hashData = JSON.stringify({
      studentId: activity.student._id,
      activityId: activity._id,
      title: activity.title,
      date: activity.eventDate,
      timestamp: Date.now()
    });

    const hash = crypto.createHash('sha256').update(hashData).digest('hex');

    // GET PREVIOUS CERTIFICATE (BLOCKCHAIN LINKING) 
    const previousCert = await Certificate.findOne({ student: activity.student._id })
      .sort({ createdAt: -1 });

    const blockNumber = previousCert ? previousCert.blockchainData.blockNumber + 1 : 1;
    const previousHash = previousCert ? previousCert.hash : '0';

    // GENERATE QR CODE 
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${hash}`;
    const qrCode = await QRCode.toDataURL(verificationUrl);

    // CREATE CERTIFICATE
    const certificate = new Certificate({
      certificateId: `CERT-${Date.now()}`,
      activity: activity._id,
      student: activity.student._id,
      hash,
      previousHash,
      blockNumber,
      issuedBy: req.user.userId,
      qrCodeUrl: qrCode,
      pdfUrl: `/certificates/${`CERT-${Date.now()}`}.pdf`,
      blockchainData: {
        blockNumber,
        previousHash,
        timestamp: new Date()
      }
    });

    await certificate.save();

    // UPDATE ACTIVITY 
    activity.status = 'certified';
    activity.certificateHash = hash;
    activity.qrCodeUrl = qrCode;
    activity.certifiedBy = req.user.userId;
    activity.certifiedAt = new Date();

    await activity.save();

    // SEND EMAIL 
    await sendCertificateIssuedEmail(activity.student, certificate.certificateId);

    res.json({
      success: true,
      message: ' Certificate generated!',
      certificate: {
        id: certificate._id,
        certificateId: certificate.certificateId,
        qrCode: certificate.qrCodeUrl,
        hash: certificate.hash,
        blockNumber: certificate.blockNumber
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
//GET STUDENT CERTIFICATES 
router.get('/my-certificates', async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user.userId })
      .populate('activity', 'title category eventDate')
      .sort({ createdAt: -1 });

    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;