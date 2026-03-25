const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  getCompanies,
  updateCompanyStatus,
  getJobs,
  deleteJob,
  getApplications,
  getEmployers,
  createCompany,
  updateCompany,    // ← جديد
  deleteCompany     // ← جديد
} = require('../controllers/adminController');

// admin only routes
router.use(protect, authorize('admin'));

router.get('/employers', getEmployers);




// dashboard
router.get('/dashboard', getDashboardStats);

// مسارات الشركات
router.route('/companies')
  .get(getCompanies)
  .post(createCompany);

// مسارات شركة مفردة
router.route('/companies/:id')
  .put(updateCompany)      // ← تعديل
  .delete(deleteCompany);  // ← حذف

// الحفاظ على المسار القديم لتغيير الحالة (اختياري، يمكن دمجه في updateCompany)
router.put('/companies/:id/status', updateCompanyStatus);

// companies management
// jobs management
router.route('/jobs')
  .get(getJobs);
router.delete('/jobs/:id', deleteJob);

// applications management
router.get('/applications', getApplications);

module.exports = router;