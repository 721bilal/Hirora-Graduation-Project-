const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard,
  getCompanyJobs,
  createJob,
  updateJob,
  getJobApplications,
  updateApplicationStatus,
  deleteJob,   // ← استيراد الدالة الجديدة
  getAllApplications 
} = require('../controllers/employerController');

router.use(protect, authorize('employer'));



// dashboard
router.get('/dashboard', getDashboard);

// jobs management
router.route('/jobs')
  .get(getCompanyJobs)
  .post(createJob);

router.route('/jobs/:id')
  .put(updateJob)
  .delete(deleteJob);   // ← إضافة مسار DELETE

router.get('/applications', getAllApplications);

// job applicants
router.get('/jobs/:jobId/applications', getJobApplications);

// update status
router.put('/applications/:id/status', updateApplicationStatus);

module.exports = router;