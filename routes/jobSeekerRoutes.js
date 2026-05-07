const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload'); // استيراد الميدل وير في البداية
const {
  searchJobs,
  getJobDetails,
  applyToJob,
  getMyApplications,
  getMyData,
  getApplicationStats,
  updateProfile
} = require('../controllers/jobSeekerController');

// حماية جميع المسارات التالية لدور الـ jobseeker فقط
router.use(protect, authorize('jobseeker'));

// مسارات البيانات الشخصية
router.get('/my-data', getMyData);
router.get('/applications/stats', getApplicationStats);
router.get('/applications', getMyApplications);

// مسار تحديث البروفايل (مع رفع CV)
router.put('/profile', upload.single('cv'), updateProfile);

// مسارات الوظائف
router.get('/jobs', searchJobs);
router.get('/jobs/:id', getJobDetails);

// مسار التقديم على وظيفة (تم دمجه ليكون مساراً واحداً يقبل رفع ملف)
router.post('/jobs/:id/apply', upload.single('cv'), applyToJob);

module.exports = router;