const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  searchJobs,
  getJobDetails,
  applyToJob,
  getMyApplications,
  getMyData,
  getApplicationStats,
  updateProfile   // استيراد الدالة الجديدة
} = require('../controllers/jobSeekerController');

router.use(protect, authorize('jobseeker'));

router.get('/my-data', getMyData);   // المسار الجديد

router.get('/jobs', searchJobs);
router.get('/jobs/:id', getJobDetails);
router.post('/jobs/:id/apply', applyToJob);
router.get('/applications', getMyApplications);
router.get('/applications/stats', getApplicationStats);

const upload = require('../middleware/upload');

// ... باقي المسارات

// تحديث الملف الشخصي (بما في ذلك رفع CV جديد)
router.put('/profile', protect, upload.single('cv'), updateProfile);

router.post('/jobs/:id/apply', protect, upload.single('cv'), applyToJob);
module.exports = router;