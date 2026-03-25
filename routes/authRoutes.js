const express = require('express');
const multer = require('multer');
const path = require('path');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// إعداد مكان تخزين الملفات واسم الملف
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// فلترة أنواع الملفات المسموحة
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only .pdf, .doc, .docx files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// نقطة التسجيل: تقبل حقلين (JSON + ملف)
// نستخدم upload.single('cv') حيث 'cv' هو اسم الحقل في الـ form-data
router.post('/register', upload.single('cv'), register);

router.post('/login', login);

module.exports = router;