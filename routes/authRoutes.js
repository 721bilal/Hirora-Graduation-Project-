const express = require('express');
const { register, login, getMyData } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload'); // نستخدم الميدل وير الجاهز اللي صلحناه
const router = express.Router();

// جلب بيانات المستخدم الحالي
router.get('/me', protect, getMyData);

// تسجيل مستخدم جديد مع رفع الـ CV
// لاحظ إننا بنستخدم upload.single('cv') من الميدل وير المستورد
router.post('/register', upload.single('cv'), register);

// تسجيل الدخول
router.post('/login', login);

module.exports = router;