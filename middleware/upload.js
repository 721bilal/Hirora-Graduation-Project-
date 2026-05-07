const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تحديد المسار بشكل مطلق لضمان الوصول إليه في أي بيئة
// __dirname بتجيب مسار الفولدر الحالي (middleware)، فنطلع خطوة لبرة للمشروع الأساسي
const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // التأكد من وجود الفولدر بشكل ديناميكي ومطلق
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // تم توحيد الـ prefix لسهولة التعامل مع الملفات لاحقاً
    cb(null, `cv-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // دعم الـ PDF والـ Word كما في الـ Routes عندك
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .pdf, .doc and .docx files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

module.exports = upload;