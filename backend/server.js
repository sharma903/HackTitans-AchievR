const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const certificateRoutes = require('./routes/certificates');

// ===== 1. GLOBAL MIDDLEWARE (MUST BE FIRST) =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===== 2. IMPORT MIDDLEWARE =====
const authMiddleware = require('./middleware/auth');

// ===== 3. DATABASE CONNECTION =====
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ DB Connection Error:', err);
  process.exit(1); // Exit if DB fails
});

// ===== 4. ROUTES (PUBLIC FIRST, THEN PROTECTED) =====
// Public routes (no auth required)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/verify', require('./routes/verify')); // QR verification can be public

// Protected routes (auth required)
app.use('/api/activities', authMiddleware, require('./routes/activities'));
app.use('/api/certificates', authMiddleware, require('./routes/certificates'));
app.use('/api/recruiter', authMiddleware, require('./routes/recruiter'));

app.use('/api/certificates', certificateRoutes);
// Health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// ===== 5. 404 HANDLER (BEFORE ERROR HANDLER) =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== 6. ERROR HANDLING MIDDLEWARE (MUST BE LAST) =====
// CRITICAL: 4 parameters (err, req, res, next) for Express to recognize as error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Determine status code
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===== 7. START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
