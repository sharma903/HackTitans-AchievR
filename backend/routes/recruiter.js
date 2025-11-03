const express = require('express');
const Activity = require('../models/Activity');
const StudentSkills = require('../models/StudentSkills');

const router = express.Router();

//  SEARCH BY SKILLS
router.post('/search', async (req, res) => {
  try {
    const { skills, skillType } = req.body; 

    let query = {};

    if (skillType === 'technical') {
      query = { selectedTechnicalSkills: { $in: skills } };
    } else if (skillType === 'soft') {
      query = { selectedSoftSkills: { $in: skills } };
    } else if (skillType === 'tools') {
      query = { selectedTools: { $in: skills } };
    } else {
      query = {
        $or: [
          { selectedTechnicalSkills: { $in: skills } },
          { selectedSoftSkills: { $in: skills } },
          { selectedTools: { $in: skills } }
        ]
      };
    }

    // Find certified activities matching skills
    const matchedActivities = await Activity.find({
      ...query,
      status: 'certified'
    }).populate('student', 'name rollNumber department email');

    // Group by student
    const studentActivityMap = {};
    matchedActivities.forEach(activity => {
      const studentId = activity.student._id.toString();
      if (!studentActivityMap[studentId]) {
        studentActivityMap[studentId] = {
          student: activity.student,
          activities: [],
          allSkills: { technical: new Set(), soft: new Set(), tools: new Set() }
        };
      }
      studentActivityMap[studentId].activities.push(activity);
      activity.selectedTechnicalSkills.forEach(s => studentActivityMap[studentId].allSkills.technical.add(s));
      activity.selectedSoftSkills.forEach(s => studentActivityMap[studentId].allSkills.soft.add(s));
      activity.selectedTools.forEach(t => studentActivityMap[studentId].allSkills.tools.add(t));
    });

    const results = Object.values(studentActivityMap).map(item => ({
      student: {
        id: item.student._id,
        name: item.student.name,
        rollNumber: item.student.rollNumber,
        department: item.student.department,
        email: item.student.email
      },
      totalCertifiedActivities: item.activities.length,
      skills: {
        technical: Array.from(item.allSkills.technical),
        soft: Array.from(item.allSkills.soft),
        tools: Array.from(item.allSkills.tools)
      },
      activities: item.activities.map(a => ({
        title: a.title,
        description: a.description,
        category: a.category,
        level: a.achievementLevel,
        certifiedAt: a.certifiedAt
      }))
    }));

    res.json({
      success: true,
      resultCount: results.length,
      results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;