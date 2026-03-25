const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  searchJobs,
  getJobDetails,
  applyToJob,
  getMyApplications,
  getMyData   // استيراد الدالة الجديدة
} = require('../controllers/jobSeekerController');

router.use(protect, authorize('jobseeker'));

router.get('/my-data', getMyData);   // المسار الجديد

router.get('/jobs', searchJobs);
router.get('/jobs/:id', getJobDetails);
router.post('/jobs/:id/apply', applyToJob);
router.get('/applications', getMyApplications);

module.exports = router;