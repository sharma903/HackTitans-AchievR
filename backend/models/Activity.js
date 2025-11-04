const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  
  // ========== STUDENT & IDENTIFICATION ==========
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  activityId: { 
    type: String, 
    unique: true,
    sparse: true,
    index: true
  },
  
  // ========== ACTIVITY DETAILS ==========
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 5000
  },
  category: {
    type: String,
    enum: ['Technical', 'Sports', 'Cultural', 'Volunteering', 'Internship', 'Academic', 'Leadership', 'Research', 'Other'],
    required: true,
    index: true
  },
  
  // ========== ACHIEVEMENT INFO ==========
  organizingBody: {
    type: String,
    trim: true,
    maxlength: 500
  },
  achievementLevel: {
    type: String,
    enum: ['College', 'University', 'State', 'National', 'International'],
    default: 'College',
    index: true
  },
  eventDate: { 
    type: Date, 
    required: true,
    index: true
  },
  
  // ========== PROOF DOCUMENTS ==========
  proofDocuments: [{
    _id: false,
    filename: {
      type: String,
      required: true
    },
    url: String,
    path: {
      type: String,
      required: true
    },
    fileSize: Number,
    fileType: String,
    uploadedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // ========== SKILLS SELECTION ==========
  selectedTechnicalSkills: {
    type: [String],
    default: [],
    index: true
  },
  selectedSoftSkills: {
    type: [String],
    default: []
  },
  selectedTools: {
    type: [String],
    default: []
  },
  
  // ========== STATUS MANAGEMENT ==========
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged', 'certified'],
    default: 'pending',
    index: true
  },
  
  // ========== REVIEW PROCESS ==========
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  facultyComment: {
    type: String,
    maxlength: 2000
  },
  reviewedAt: Date,
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // ========== REJECTION INFO ==========
  rejectionReason: {
    type: String,
    maxlength: 2000
  },
  rejectedAt: Date,
  
  // ========== CERTIFICATE GENERATION ==========
  certificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    index: true
  },
  certificateId: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  certificatePath: String,
  certificateUrl: String,
  qrCodePath: String,
  qrCodeUrl: String,
  certificateHash: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  // ========== CERTIFICATE ISSUER INFO ==========
  certificateGeneratedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  certificateGeneratedAt: {
    type: Date,
    index: true
  },
  certificateExpiresAt: Date,
  
  // ========== VERIFICATION INFO ==========
  verificationCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  verificationHistory: [{
    _id: false,
    verifiedAt: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: String,
      default: 'unknown'
    },
    ipAddress: String
  }],
  lastVerifiedAt: Date,
  
  // ========== EMAIL TRACKING ==========
  emailStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'bounced'],
    default: 'pending'
  },
  emailSentAt: Date,
  emailFailureReason: String,
  emailResendCount: {
    type: Number,
    default: 0
  },
  
  // ========== METADATA & TIMESTAMPS ==========
  metadata: {
    ipAddress: String,
    userAgent: String,
    submissionDeviceInfo: String,
    location: String
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now
  }
  
}, { 
  timestamps: true,
  collection: 'activities'
});

// ========== AUTO-GENERATE ACTIVITY ID ==========
activitySchema.pre('save', async function(next) {
  if (!this.activityId) {
    try {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments();
      this.activityId = `ACT-${year}-${String(count + 1).padStart(6, '0')}`;
      console.log(`✅ Generated Activity ID: ${this.activityId}`);
    } catch (error) {
      console.error('❌ Error generating activityId:', error);
      next(error);
      return;
    }
  }
  this.updatedAt = new Date();
  next();
});

// ========== INDEXES FOR PERFORMANCE ==========
activitySchema.index({ student: 1, createdAt: -1 });
activitySchema.index({ status: 1, createdAt: -1 });
activitySchema.index({ category: 1, achievementLevel: 1 });
activitySchema.index({ certificateId: 1 });
activitySchema.index({ verificationCode: 1 });
activitySchema.index({ eventDate: -1 });
activitySchema.index({ emailStatus: 1 });

// ========== VIRTUAL FIELDS ==========

// Check if certified
activitySchema.virtual('isCertified').get(function() {
  return !!(this.certificateId && this.certificateId.length > 0);
});

// Check if approved
activitySchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

// Check if rejected
activitySchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

// Days since submission
activitySchema.virtual('daysSubmitted').get(function() {
  if (!this.submittedAt) return 0;
  const now = new Date();
  const submitted = new Date(this.submittedAt);
  return Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
});

// Days since review
activitySchema.virtual('daysReviewed').get(function() {
  if (!this.reviewedAt) return null;
  const now = new Date();
  const reviewed = new Date(this.reviewedAt);
  return Math.floor((now - reviewed) / (1000 * 60 * 60 * 24));
});

// Days since certificate generated
activitySchema.virtual('daysCertified').get(function() {
  if (!this.certificateGeneratedAt) return null;
  const now = new Date();
  const certified = new Date(this.certificateGeneratedAt);
  return Math.floor((now - certified) / (1000 * 60 * 60 * 24));
});

// Certificate expiry status
activitySchema.virtual('certificateExpiryStatus').get(function() {
  if (!this.certificateExpiresAt) return 'N/A';
  const now = new Date();
  if (this.certificateExpiresAt < now) return 'Expired';
  const daysLeft = Math.ceil((this.certificateExpiresAt - now) / (1000 * 60 * 60 * 24));
  return `${daysLeft} days left`;
});

// ========== INSTANCE METHODS ==========

// Approve activity
activitySchema.methods.approve = function(facultyId, comment) {
  this.status = 'approved';
  this.reviewedBy = facultyId;
  this.facultyComment = comment;
  this.reviewedAt = new Date();
  console.log(`✅ Activity approved: ${this._id}`);
  return this.save();
};

// Reject activity
activitySchema.methods.reject = function(facultyId, reason) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.rejectedAt = new Date();
  this.reviewedBy = facultyId;
  this.reviewedAt = new Date();
  console.log(`❌ Activity rejected: ${this._id}`);
  return this.save();
};

// Flag activity for review
activitySchema.methods.flag = function(reason) {
  this.status = 'flagged';
  this.facultyComment = reason;
  this.reviewedAt = new Date();
  console.log(`🚩 Activity flagged: ${this._id}`);
  return this.save();
};

// Update certificate info
activitySchema.methods.updateCertificate = function(certificateData) {
  this.certificate = certificateData.certificateId;
  this.certificateId = certificateData.certificateId;
  this.certificatePath = certificateData.certificatePath;
  this.certificateUrl = certificateData.certificateUrl;
  this.qrCodePath = certificateData.qrCodePath;
  this.qrCodeUrl = certificateData.qrCodeUrl;
  this.certificateHash = certificateData.certificateHash;
  this.certificateGeneratedAt = new Date();
  this.status = 'certified';
  console.log(`📜 Certificate added: ${this.certificateId}`);
  return this.save();
};

// Update email status
activitySchema.methods.updateEmailStatus = function(status, failureReason = null) {
  this.emailStatus = status;
  if (status === 'sent') {
    this.emailSentAt = new Date();
  }
  if (failureReason) {
    this.emailFailureReason = failureReason;
  }
  if (status === 'failed') {
    this.emailResendCount += 1;
  }
  console.log(`📧 Email status updated: ${status}`);
  return this.save();
};

// Record verification
activitySchema.methods.recordVerification = function(email, ipAddress) {
  this.verificationHistory.push({
    verifiedAt: new Date(),
    verifiedBy: email,
    ipAddress: ipAddress
  });
  this.verificationCount += 1;
  this.lastVerifiedAt = new Date();
  return this.save();
};

// Get activity summary
activitySchema.methods.getSummary = function() {
  return {
    activityId: this.activityId,
    title: this.title,
    student: this.student,
    status: this.status,
    category: this.category,
    achievementLevel: this.achievementLevel,
    isCertified: this.isCertified,
    certificateId: this.certificateId,
    submittedAt: this.submittedAt,
    daysSubmitted: this.daysSubmitted,
    reviewedAt: this.reviewedAt,
    certificateGeneratedAt: this.certificateGeneratedAt,
    emailStatus: this.emailStatus
  };
};

// Get detailed stats
activitySchema.methods.getDetailedStats = function() {
  return {
    basic: this.getSummary(),
    timestamps: {
      submitted: this.submittedAt,
      reviewed: this.reviewedAt,
      certified: this.certificateGeneratedAt,
      emailSent: this.emailSentAt,
      lastVerified: this.lastVerifiedAt,
      created: this.createdAt,
      updated: this.updatedAt
    },
    durations: {
      daysSubmitted: this.daysSubmitted,
      daysReviewed: this.daysReviewed,
      daysCertified: this.daysCertified
    },
    certificate: {
      certificateId: this.certificateId,
      certificateExpiresAt: this.certificateExpiresAt,
      expiryStatus: this.certificateExpiryStatus,
      verifications: this.verificationCount,
      lastVerifiedAt: this.lastVerifiedAt
    },
    email: {
      status: this.emailStatus,
      sentAt: this.emailSentAt,
      resendCount: this.emailResendCount,
      failureReason: this.emailFailureReason
    },
    skills: {
      technical: this.selectedTechnicalSkills,
      soft: this.selectedSoftSkills,
      tools: this.selectedTools
    }
  };
};

// ========== STATIC METHODS ==========

// Find by student
activitySchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId })
    .populate('student', 'name email rollNumber')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Find pending activities
activitySchema.statics.findPending = function() {
  return this.find({ status: 'pending' })
    .populate('student', 'name email')
    .sort({ createdAt: 1 });
};

// Find approved activities
activitySchema.statics.findApproved = function() {
  return this.find({ status: 'approved' })
    .populate('student', 'name email')
    .sort({ createdAt: -1 });
};

// Find certified activities
activitySchema.statics.findCertified = function() {
  return this.find({ 
    certificateId: { $exists: true, $ne: null },
    status: 'certified'
  })
    .populate('student', 'name email')
    .sort({ certificateGeneratedAt: -1 });
};

// Find rejected activities
activitySchema.statics.findRejected = function() {
  return this.find({ status: 'rejected' })
    .sort({ rejectedAt: -1 });
};

// Find flagged activities
activitySchema.statics.findFlagged = function() {
  return this.find({ status: 'flagged' })
    .sort({ createdAt: -1 });
};

// Find by category
activitySchema.statics.findByCategory = function(category) {
  return this.find({ category })
    .sort({ createdAt: -1 });
};

// Find by level
activitySchema.statics.findByLevel = function(level) {
  return this.find({ achievementLevel: level })
    .sort({ createdAt: -1 });
};

// Find pending emails
activitySchema.statics.findPendingEmails = function() {
  return this.find({ emailStatus: 'pending' })
    .populate('student', 'name email')
    .sort({ updatedAt: 1 });
};

// Find failed emails
activitySchema.statics.findFailedEmails = function() {
  return this.find({ emailStatus: 'failed' })
    .populate('student', 'name email')
    .sort({ updatedAt: -1 });
};

// Get statistics
activitySchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [
          { $group: { _id: '$status', count: { $count: 'count' } } }
        ],
        byCategory: [
          { $group: { _id: '$category', count: { $count: 'count' } } }
        ],
        byLevel: [
          { $group: { _id: '$achievementLevel', count: { $count: 'count' } } }
        ],
        certified: [
          { $match: { status: 'certified' } },
          { $count: 'count' }
        ],
        pendingReview: [
          { $match: { status: 'pending' } },
          { $count: 'count' }
        ],
        emailStats: [
          { $group: { _id: '$emailStatus', count: { $count: 'count' } } }
        ]
      }
    }
  ]);
};

// Get dashboard statistics
activitySchema.statics.getDashboardStats = function() {
  return this.aggregate([
    {
      $facet: {
        totalActivities: [
          { $count: 'count' }
        ],
        pendingReview: [
          { $match: { status: 'pending' } },
          { $count: 'count' }
        ],
        approved: [
          { $match: { status: 'approved' } },
          { $count: 'count' }
        ],
        certified: [
          { $match: { status: 'certified' } },
          { $count: 'count' }
        ],
        rejected: [
          { $match: { status: 'rejected' } },
          { $count: 'count' }
        ],
        emailFailed: [
          { $match: { emailStatus: 'failed' } },
          { $count: 'count' }
        ]
      }
    }
  ]);
};

// ========== EXPORT ==========
module.exports = mongoose.model('Activity', activitySchema);
