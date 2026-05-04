const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تحديد مجلد الرفع حسب البيئة
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : 'uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // التأكد من وجود المجلد
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // إضافة بادئة للملفات الخاصة بـ CV مثلاً
    const prefix = (file.fieldname === 'cv') ? 'cv-' : '';
    cb(null, prefix + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;