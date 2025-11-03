const express = require('express');
const Certificate = require('../models/Certificate');
const crypto = require('crypto');

const router = express.Router();

//  PUBLIC QR VERIFICATION (NO LOGIN REQUIRED) 
router.get('/:hash', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ hash: req.params.hash })
      .populate('student', 'name rollNumber department')
      .populate('activity', 'title category eventDate organizingBody achievementLevel selectedTechnicalSkills selectedSoftSkills selectedTools');

    if (!certificate) {
      return res.json({
        verified: false,
        message: ' Certificate not found',
        status: 'invalid'
      });
    }

    //  VERIFY HASH INTEGRITY 
    const originalData = JSON.stringify({
      studentId: certificate.student._id,
      activityId: certificate.activity._id,
      title: certificate.activity.title,
      date: certificate.activity.eventDate,
      timestamp: certificate.blockchainData.timestamp
    });

    const regeneratedHash = crypto.createHash('sha256').update(originalData).digest('hex');
    const isTampered = regeneratedHash !== certificate.hash;

    res.json({
      verified: !isTampered,
      status: isTampered ? 'tampered' : 'authentic',
      certificate: {
        id: certificate.certificateId,
        student: certificate.student.name,
        rollNumber: certificate.student.rollNumber,
        activity: certificate.activity.title,
        category: certificate.activity.category,
        level: certificate.activity.achievementLevel,
        eventDate: certificate.activity.eventDate,
        issuedAt: certificate.issuedAt,
        blockNumber: certificate.blockchainData.blockNumber,
        hash: certificate.hash.substring(0, 32) + '...',
        skills: {
          technical: certificate.activity.selectedTechnicalSkills,
          soft: certificate.activity.selectedSoftSkills,
          tools: certificate.activity.selectedTools
        }
      },
      message: isTampered ? 'Certificate may have been modified' : 'Certificate verified'
    });

    // Increment verification count
    certificate.verificationCount += 1;
    certificate.lastVerifiedAt = new Date();
    await certificate.save();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;