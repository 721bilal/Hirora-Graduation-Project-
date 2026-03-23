const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  searchJobs,
  getJobDetails,
  applyToJob,
  getMyApplications,
  saveJob,
  getSavedJobs
} = require('../controllers/jobSeekerController');

// all routes require auth + jobseeker role
router.use(protect, authorize('jobseeker'));

// job search (restricted to applicants)
router.get('/jobs', searchJobs);
router.get('/jobs/:id', getJobDetails);

// apply to job
router.post('/jobs/:id/apply', applyToJob);

// my applications
router.get('/applications', getMyApplications);

// save job (optional - may need SavedJob model)
// router.post('/jobs/:id/save', saveJob);
// router.get('/saved-jobs', getSavedJobs);

module.exports = router;