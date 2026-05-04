const multer = require('multer');
const path = require('path');
const fs = require('fs');

// استخدام المجلد المؤقت على Heroku أو المجلد المحلي
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : 'uploads';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // أنشئ المجلد بشكل متزامن قبل تمرير المسار إلى multer
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // نضيف prefix اختياري لكن بدون تغيير المجلد
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = upload;