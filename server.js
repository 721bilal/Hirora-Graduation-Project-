require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. توحيد مسار الرفع (يجب أن يكون مطلقاً ومطابقاً لملف upload.js)
const uploadDir = path.join(__dirname, 'uploads');

// إنشاء المجلد إذا لم يكن موجوداً لضمان عدم حدوث ايرور ENOENT
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. جعل مجلد الرفع متاحاً للوصول إليه عبر المتصفح (Static Folder)
app.use('/uploads', express.static(uploadDir));

// 4. Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const employerRoutes = require('./routes/employerRoutes');
const jobSeekerRoutes = require('./routes/jobSeekerRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/jobseeker', jobSeekerRoutes);

// 5. الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Root route
app.get('/', (req, res) => {
    res.send('Hirora API is running...');
});

// 6. التعامل مع الأخطاء العامة (Optional but recommended)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});