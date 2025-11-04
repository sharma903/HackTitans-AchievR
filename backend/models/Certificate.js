const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
  
  // ========== IDENTIFIERS ==========
  certificateId: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  
  // ========== REFERENCES ==========
  activity: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Activity', 
    required: true,
    index: true
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  issuedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  
  // ========== CERTIFICATE DETAILS ==========
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  organizingBody: {
    type: String,
    trim: true
  },
  achievementLevel: {
    type: String,
    enum: ['College', 'University', 'State', 'National', 'International'],
    default: 'College'
  },
  eventDate: Date,
  
  // ========== FILE PATHS & URLS ==========
  pdfUrl: String,
  pdfPath: {
    type: String,
    required: true
  },
  qrCodeUrl: String,
  qrCodePath: String,
  
  // ========== SECURITY & VERIFICATION ==========
  certificateHash: { 
    type: String, 
    unique: true,
    required: true,
    index: true
  },
  verificationCode: {
    type: String,
    unique: true,
    sparse: true,
    required: true
  },
  
  // ========== STATUS ==========
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired', 'pending'],
    default: 'active',
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revocationReason: String,
  
  // ========== TIMESTAMPS ==========
  issuedAt: { 
    type: Date, 
    default: Date.now,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  },
  
  // ========== VERIFICATION TRACKING ==========
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
      default: 'public'
    },
    ipAddress: String,
    userAgent: String
  }],
  lastVerifiedAt: Date,
  
  // ========== DOWNLOAD & VIEW TRACKING ==========
  downloadCount: { 
    type: Number, 
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: Date,
  lastViewedAt: Date,
  
  // ========== METADATA ==========
  metadata: {
    browserInfo: String,
    deviceInfo: String,
    location: String,
    issuedFrom: String
  },
  
  // ========== TIMESTAMPS ==========
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
  collection: 'certificates'
});

// ========== INDEXES FOR PERFORMANCE ==========
certificateSchema.index({ student: 1, issuedAt: -1 });
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ activity: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ issuedAt: -1 });

// ========== VIRTUAL FIELDS ==========
certificateSchema.virtual('isValid').get(function() {
  return this.status === 'active' && !this.isRevoked && (!this.expiresAt || this.expiresAt > new Date());
});

certificateSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diff = this.expiresAt - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

certificateSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

certificateSchema.virtual('daysSinceIssued').get(function() {
  const now = new Date();
  const issued = new Date(this.issuedAt);
  return Math.floor((now - issued) / (1000 * 60 * 60 * 24));
});

// ========== METHODS ==========

// Revoke certificate
certificateSchema.methods.revoke = function(reason) {
  this.isRevoked = true;
  this.status = 'revoked';
  this.revocationReason = reason || 'No reason provided';
  this.updatedAt = new Date();
  return this.save();
};

// Record verification
certificateSchema.methods.recordVerification = function(email, ipAddress, userAgent) {
  this.verificationHistory.push({
    verifiedAt: new Date(),
    verifiedBy: email,
    ipAddress: ipAddress,
    userAgent: userAgent
  });
  this.verificationCount += 1;
  this.lastVerifiedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Get verification statistics
certificateSchema.methods.getVerificationStats = function() {
  return {
    totalVerifications: this.verificationCount,
    lastVerifiedAt: this.lastVerifiedAt,
    verificationHistory: this.verificationHistory,
    averageVerificationsPerDay: this.daysSinceIssued > 0 
      ? (this.verificationCount / this.daysSinceIssued).toFixed(2)
      : 0
  };
};

// Get download statistics
certificateSchema.methods.getDownloadStats = function() {
  return {
    totalDownloads: this.downloadCount,
    lastDownloadedAt: this.lastDownloadedAt,
    averageDownloadsPerDay: this.daysSinceIssued > 0 
      ? (this.downloadCount / this.daysSinceIssued).toFixed(2)
      : 0
  };
};

// Get all statistics
certificateSchema.methods.getAllStats = function() {
  return {
    certificateId: this.certificateId,
    status: this.status,
    isValid: this.isValid,
    isExpired: this.isExpired,
    daysUntilExpiry: this.daysUntilExpiry,
    daysSinceIssued: this.daysSinceIssued,
    downloads: this.getDownloadStats(),
    verifications: this.getVerificationStats(),
    views: {
      totalViews: this.viewCount,
      lastViewedAt: this.lastViewedAt
    }
  };
};

// ========== STATIC METHODS ==========

// Find by certificate ID
certificateSchema.statics.findByCertificateId = function(certificateId) {
  return this.findOne({ certificateId })
    .populate('student', 'name email rollNumber')
    .populate('activity', 'title description')
    .populate('issuedBy', 'name email');
};

// Find by student
certificateSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId })
    .sort({ issuedAt: -1 });
};

// Find active certificates
certificateSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active',
    isRevoked: false,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
};

// Find by status
certificateSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ issuedAt: -1 });
};

// Find recently issued
certificateSchema.statics.findRecentlyIssued = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({ issuedAt: { $gte: date } }).sort({ issuedAt: -1 });
};

// Find most verified
certificateSchema.statics.findMostVerified = function(limit = 10) {
  return this.find().sort({ verificationCount: -1 }).limit(limit);
};

// Get statistics
certificateSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        active: [
          { $match: { status: 'active', isRevoked: false } },
          { $count: 'count' }
        ],
        revoked: [
          { $match: { isRevoked: true } },
          { $count: 'count' }
        ],
        totalDownloads: [
          { $group: { _id: null, downloads: { $sum: '$downloadCount' } } }
        ],
        totalVerifications: [
          { $group: { _id: null, verifications: { $sum: '$verificationCount' } } }
        ]
      }
    }
  ]);
};

// ========== MIDDLEWARE ==========

// Update updatedAt before save
certificateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ========== EXPORT ==========
module.exports = mongoose.model('Certificate', certificateSchema);
