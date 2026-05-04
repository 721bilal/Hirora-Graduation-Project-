require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// تحديد مجلد الرفع (يجب أن يتطابق مع الـ uploadDir في upload.js)
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : 'uploads';

// إنشاء المجلد إذا لم يكن موجوداً
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const employerRoutes = require('./routes/employerRoutes');
const jobSeekerRoutes = require('./routes/jobSeekerRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/jobseeker', jobSeekerRoutes);

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Hirora API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});