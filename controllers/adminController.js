const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// @desc    dashboard stats
// @route   GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    // companies count
    const companiesCount = await Company.countDocuments();
    // active jobs count
    const activeJobsCount = await Job.countDocuments({ status: 'active' });
    // jobseekers count
    const jobseekersCount = await User.countDocuments({ role: 'jobseeker' });
    // applications count
    const applicationsCount = await Application.countDocuments();

    // monthly applications (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyApplications = await Application.aggregate([
      { $match: { appliedDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: '$appliedDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // applications status breakdown
    const statusBreakdown = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // jobs by category
    const jobsByCategory = await Job.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      companiesCount,
      activeJobsCount,
      jobseekersCount,
      applicationsCount,
      monthlyApplications,
      statusBreakdown,
      jobsByCategory
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    get companies list
// @route   GET /api/admin/companies
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate('owner', 'name email');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    toggle company status
// @route   PUT /api/admin/companies/:id/status
const updateCompanyStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    company.status = company.status === 'active' ? 'inactive' : 'active';
    await company.save();
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    get all jobs (admin)
// @route   GET /api/admin/jobs
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('company', 'name')
      .populate('postedBy', 'name');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    delete job
// @route   DELETE /api/admin/jobs/:id
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    await job.remove();
    // delete related applications
    await Application.deleteMany({ job: req.params.id });
    res.json({ message: 'Job removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    get all applications (admin)
// @route   GET /api/admin/applications
const getApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('job', 'title')
      .populate('applicant', 'name email')
      .populate('company', 'name');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getCompanies,
  updateCompanyStatus,
  getJobs,
  deleteJob,
  getApplications
};