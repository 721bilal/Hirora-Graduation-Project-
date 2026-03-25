const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');

// @desc    Employer dashboard
// @route   GET /api/employer/dashboard
const getDashboard = async (req, res) => {
  try {
    // user company
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) {
      return res.status(404).json({ message: 'No company found for this employer' });
    }

    // quick stats
    const totalJobs = await Job.countDocuments({ company: company._id });
    const activeJobs = await Job.countDocuments({ company: company._id, status: 'active' });
    const totalApplicants = await Application.countDocuments({ company: company._id });

    // recent applicants
    const recentApplications = await Application.find({ company: company._id })
      .populate('job', 'title')
      .populate('applicant', 'name email')
      .sort('-appliedDate')
      .limit(5);

    // job performance
    const jobPerformance = await Job.aggregate([
      { $match: { company: company._id } },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      {
        $project: {
          title: 1,
          applicantsCount: { $size: '$applications' }
        }
      }
    ]);

    res.json({
      company,
      totalJobs,
      activeJobs,
      totalApplicants,
      recentApplications,
      jobPerformance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get company jobs
// @route   GET /api/employer/jobs
const getCompanyJobs = async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const jobs = await Job.find({ company: company._id });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create job
// @route   POST /api/employer/jobs
const createJob = async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user._id });
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const jobData = {
      ...req.body,
      company: company._id,
      postedBy: req.user._id
    };

    const job = await Job.create(jobData);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update job
// @route   PUT /api/employer/jobs/:id
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // ownership check
    const company = await Company.findOne({ owner: req.user._id });
    if (job.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get job applications
// @route   GET /api/employer/jobs/:jobId/applications
const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const company = await Company.findOne({ owner: req.user._id });
    if (job.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name email profile');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update application status (shortlist, reject, etc)
// @route   PUT /api/employer/applications/:id/status
const updateApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const company = await Company.findOne({ owner: req.user._id });
    if (application.job.company.toString() !== company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = req.body.status;
    await application.save();
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getCompanyJobs,
  createJob,
  updateJob,
  getJobApplications,
  updateApplicationStatus
};
