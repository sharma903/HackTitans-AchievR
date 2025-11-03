const express = require('express');
const multer = require('multer');
const Activity = require('../models/Activity');
const FraudDetection = require('../models/FraudDetection');
const StudentSkills = require('../models/StudentSkills');
const User = require('../models/User');
const { detectCertificateFraud } = require('../utils/aiService');
const { sendActivityApprovedEmail } = require('../utils/emailService');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===== SUBMIT ACTIVITY =====
router.post('/submit', upload.single('document'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      eventDate,
      organizingBody,
      achievementLevel,
      selectedTechnicalSkills,
      selectedSoftSkills,
      selectedTools
    } = req.body;

    const studentId = req.user.userId;

    console.log('Creating activity...');

    // Parse skill arrays from JSON strings
    const techSkills = JSON.parse(selectedTechnicalSkills || '[]');
    const softSkills = JSON.parse(selectedSoftSkills || '[]');
    const tools = JSON.parse(selectedTools || '[]');

    if (techSkills.length === 0 && softSkills.length === 0 && tools.length === 0) {
      return res.status(400).json({ error: ' Please select at least one skill' });
    }

    const activity = new Activity({
      student: studentId,
      title,
      description,
      category,
      eventDate,
      organizingBody,
      achievementLevel,
      selectedTechnicalSkills: techSkills,
      selectedSoftSkills: softSkills,
      selectedTools: tools,
      status: 'pending',
      submittedAt: new Date(),
      proofDocuments: req.file ? [{
        filename: req.file.originalname,
        url: `/uploads/${Date.now()}-${req.file.originalname}`,
        uploadedAt: new Date()
      }] : []
    });

    await activity.save();

    // ===== AI FRAUD DETECTION (if document uploaded) =====
    if (req.file) {
      console.log('🔍 Scanning document for fraud...');
      const fraud = await detectCertificateFraud(req.file.buffer);

      const fraudDetection = new FraudDetection({
        activity: activity._id,
        fraudScore: fraud.fraudScore,
        verdict: fraud.verdict,
        concerns: fraud.concerns,
        recommendation: fraud.recommendation,
        confidenceLevel: fraud.confidence
      });

      await fraudDetection.save();
      activity.fraudDetectionId = fraudDetection._id;
      activity.fraudStatus = fraud.recommendation;

      if (fraud.recommendation === 'auto_reject') {
        activity.status = 'rejected';
        activity.rejectionReason = `Fraud detected (Score: ${fraud.fraudScore}/100)`;
      }
    }

    await activity.save();

    // ===== UPDATE STUDENT SKILLS PROFILE =====
    console.log('📊 Updating skills...');
    let studentSkills = await StudentSkills.findOne({ student: studentId });
    if (!studentSkills) {
      studentSkills = new StudentSkills({ student: studentId });
    }

    // Add technical skills
    techSkills.forEach(skill => {
      const existing = studentSkills.technicalSkills.find(s => s.name === skill);
      if (existing) {
        existing.frequency += 1;
      } else {
        studentSkills.technicalSkills.push({ name: skill, frequency: 1 });
      }
    });

    // Add soft skills
    softSkills.forEach(skill => {
      const existing = studentSkills.softSkills.find(s => s.name === skill);
      if (existing) {
        existing.frequency += 1;
      } else {
        studentSkills.softSkills.push({ name: skill, frequency: 1 });
      }
    });

    // Add tools
    tools.forEach(tool => {
      const existing = studentSkills.tools.find(t => t.name === tool);
      if (existing) {
        existing.frequency += 1;
      } else {
        studentSkills.tools.push({ name: tool, frequency: 1 });
      }
    });

    // Calculate skill score
    studentSkills.overallSkillScore = Math.min(100, (
      studentSkills.technicalSkills.length * 10 +
      studentSkills.softSkills.length * 8 +
      studentSkills.tools.length * 6
    ));
    studentSkills.lastUpdated = new Date();

    await studentSkills.save();

    res.json({
      success: true,
      message: 'Activity submitted successfully!',
      activity: {
        id: activity._id,
        title,
        status: activity.status,
        fraudStatus: activity.fraudStatus,
        selectedTechnicalSkills: techSkills,
        selectedSoftSkills: softSkills,
        selectedTools: tools
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== GET MY ACTIVITIES =====
router.get('/my-activities', async (req, res) => {
  try {
    const activities = await Activity.find({ student: req.user.userId })
      .populate('reviewedBy', 'name')
      .populate('certifiedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/faculty/pending', async (req, res) => {
  try {
    const activities = await Activity.find({ status: 'pending' })
      .populate('student', 'name rollNumber department email')
      .sort({ submittedAt: -1 });

    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== FACULTY: APPROVE ACTIVITY =====
router.put('/:id/approve', async (req, res) => {
  try {
    const { comment } = req.body;

    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        reviewedBy: req.user.userId,
        facultyComment: comment,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('student');

   
    await sendActivityApprovedEmail(activity.student, activity);

    res.json({ success: true, message: '✅ Activity approved!', activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;

    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: new Date()
      },
      { new: true }
    );

    res.json({ success: true, message: '❌ Activity rejected', activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/admin/approved', async (req, res) => {
  try {
    const activities = await Activity.find({ status: 'approved' })
      .populate('student', 'name rollNumber email')
      .sort({ reviewedAt: -1 });

    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;