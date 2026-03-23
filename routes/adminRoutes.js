const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  getCompanies,
  updateCompanyStatus,
  getJobs,
  deleteJob,
  getApplications
} = require('../controllers/adminController');

// admin only routes
router.use(protect, authorize('admin'));

// dashboard
router.get('/dashboard', getDashboardStats);

// companies management
router.route('/companies')
  .get(getCompanies);
router.put('/companies/:id/status', updateCompanyStatus);

// jobs management
router.route('/jobs')
  .get(getJobs);
router.delete('/jobs/:id', deleteJob);

// applications management
router.get('/applications', getApplications);

module.exports = router;