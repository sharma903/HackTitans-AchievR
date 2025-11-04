// routes/activities.js
const express = require('express');
const multer = require('multer');
const Activity = require('../models/Activity');
const FraudDetection = require('../models/FraudDetection');
const StudentSkills = require('../models/StudentSkills');
const User = require('../models/User');
const { detectCertificateFraud } = require('../utils/aiService');
const { sendActivityApprovedEmail, sendActivityRejectedEmail } = require('../utils/emailService');

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

    console.log('📝 Creating activity for student:', studentId);

    // Parse skill arrays from JSON strings
    const techSkills = JSON.parse(selectedTechnicalSkills || '[]');
    const softSkills = JSON.parse(selectedSoftSkills || '[]');
    const tools = JSON.parse(selectedTools || '[]');

    if (techSkills.length === 0 && softSkills.length === 0 && tools.length === 0) {
      return res.status(400).json({ error: 'Please select at least one skill' });
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
    console.log('✅ Activity saved:', activity._id);

    // ===== AI FRAUD DETECTION (if document uploaded) =====
    if (req.file) {
      try {
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
          console.warn('⚠️ Activity auto-rejected due to fraud');
        } else {
          console.log('✅ Fraud check passed');
        }

        await activity.save();
      } catch (fraudError) {
        console.error('⚠️ Fraud detection error:', fraudError.message);
      }
    }

    // ===== UPDATE STUDENT SKILLS PROFILE =====
    try {
      console.log('📊 Updating student skills...');
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
      console.log('✅ Skills updated');
    } catch (skillsError) {
      console.error('⚠️ Skills update error:', skillsError.message);
    }

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
    console.error('❌ Submit activity error:', error);
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
    console.error('❌ Get my activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FACULTY: GET PENDING ACTIVITIES =====
router.get('/faculty/pending', async (req, res) => {
  try {
    const activities = await Activity.find({ status: 'pending' })
      .populate('student', 'name rollNumber department email')
      .sort({ submittedAt: -1 });

    res.json({ success: true, activities });
  } catch (error) {
    console.error('❌ Get pending activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FACULTY: APPROVE ACTIVITY =====
router.put('/:id/approve', async (req, res) => {
  try {
    const { comment } = req.body;
    const activityId = req.params.id;

    console.log('🔍 DEBUG: Approving activity:', activityId);
    console.log('🔍 DEBUG: Comment:', comment);
    console.log('🔍 DEBUG: User ID:', req.user?.userId);

    if (!activityId) {
      return res.status(400).json({ error: 'Activity ID is required' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    console.log('📝 Finding and updating activity...');

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      {
        status: 'approved',
        reviewedBy: req.user.userId,
        facultyComment: comment,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('student', 'name email rollNumber department');

    console.log('🔍 DEBUG: Activity found:', !!activity);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    console.log('🔍 DEBUG: Student data:', {
      name: activity.student?.name,
      email: activity.student?.email
    });

    if (!activity.student) {
      return res.status(400).json({ error: 'Student data not found' });
    }

    if (!activity.student.email) {
      return res.status(400).json({ error: 'Student email not found' });
    }

    // Send approval email
    try {
      console.log('📧 Sending approval email to:', activity.student.email);
      
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('⚠️ SENDGRID_API_KEY not configured');
      } else {
        await sendActivityApprovedEmail(activity.student, activity);
        console.log('✅ Email sent successfully');
      }
    } catch (emailError) {
      console.error('⚠️ Email error (activity still approved):', emailError.message);
      // Don't fail the entire request - activity is already approved
    }

    res.json({
      success: true,
      message: '✅ Activity approved!',
      activity: {
        id: activity._id,
        title: activity.title,
        status: activity.status,
        student: activity.student.name,
        approvedAt: activity.reviewedAt
      }
    });

  } catch (error) {
    console.error('❌ APPROVE ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      error: error.message,
      type: error.name
    });
  }
});

// ===== FACULTY: REJECT ACTIVITY =====
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const activityId = req.params.id;

    console.log('🔍 DEBUG: Rejecting activity:', activityId);
    console.log('🔍 DEBUG: Reason:', reason);

    if (!activityId) {
      return res.status(400).json({ error: 'Activity ID is required' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: req.user.userId,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('student', 'name email rollNumber');

    console.log('🔍 DEBUG: Activity found:', !!activity);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Send rejection email
    try {
      console.log('📧 Sending rejection email to:', activity.student?.email);
      
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('⚠️ SENDGRID_API_KEY not configured');
      } else {
        await sendActivityRejectedEmail(activity.student, activity, reason);
        console.log('✅ Rejection email sent');
      }
    } catch (emailError) {
      console.error('⚠️ Rejection email error:', emailError.message);
    }

    res.json({
      success: true,
      message: '❌ Activity rejected',
      activity: {
        id: activity._id,
        title: activity.title,
        status: activity.status,
        rejectionReason: activity.rejectionReason
      }
    });

  } catch (error) {
    console.error('❌ REJECT ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== ADMIN: GET APPROVED ACTIVITIES =====
router.get('/admin/approved', async (req, res) => {
  try {
    const activities = await Activity.find({ status: 'approved' })
      .populate('student', 'name rollNumber email department')
      .populate('reviewedBy', 'name')
      .sort({ reviewedAt: -1 });

    res.json({ success: true, activities });
  } catch (error) {
    console.error('❌ Get approved activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== GET ACTIVITY DETAILS =====
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('student', 'name email rollNumber')
      .populate('fraudDetectionId');

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ success: true, activity });
  } catch (error) {
    console.error('❌ Get activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
