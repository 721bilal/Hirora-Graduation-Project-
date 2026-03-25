const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    تسجيل مستخدم جديد
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // التحقق من وجود المستخدم
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // تشفير كلمة المرور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // تحضير بيانات المستخدم
    const userData = {
      name,
      email,
      password: hashedPassword,
      role
    };

    // إذا كان المستخدم من نوع jobseeker وتم رفع ملف CV، نخزّن مساره
    if (role === 'jobseeker' && req.file) {
      // بناء رابط الملف (يمكن تعديله حسب إعدادات السيرفر)
      const cvPath = `/uploads/${req.file.filename}`;
      userData.profile = {
        resume: cvPath
        // يمكن إضافة حقول أخرى لاحقًا
      };
    }

    // إنشاء المستخدم
    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate email' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email, password, or role' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };