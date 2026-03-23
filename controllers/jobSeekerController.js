const Job = require('../models/Job');
const Application = require('../models/Application');
const Company = require('../models/Company');

// @desc    Search jobs
// @route   GET /api/jobseeker/jobs
const searchJobs = async (req, res) => {
  try {
    const { keyword, location, category, type, salaryMin, salaryMax, sort } = req.query;
    
    // Build filter
    let filter = { status: 'active' };
    if (keyword) {
      filter.title = { $regex: keyword, $options: 'i' };
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (type) {
      filter.type = type;
    }
    if (salaryMin || salaryMax) {
      filter.salaryMin = { $gte: salaryMin || 0 };
      filter.salaryMax = { $lte: salaryMax || 1000000 };
    }

    // Sort results
    let sortOption = {};
    if (sort === 'salaryLow') {
      sortOption = { salaryMin: 1 };
    } else if (sort === 'salaryHigh') {
      sortOption = { salaryMin: -1 };
    } else if (sort === 'recent') {
      sortOption = { createdAt: -1 };
    }

    const jobs = await Job.find(filter)
      .populate('company', 'name logo')
      .sort(sortOption);

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Job details
// @route   GET /api/jobseeker/jobs/:id
const getJobDetails = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name industry location size logo');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment views (optional)
    // job.views += 1; await job.save();

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Apply job
// @route   POST /api/jobseeker/jobs/:id/apply
const applyToJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check duplicate
    const existingApplication = await Application.findOne({
      job: job._id,
      applicant: req.user._id
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    // Applicant data
    const applicationData = {
      job: job._id,
      applicant: req.user._id,
      company: job.company._id,
      applicantDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.body.phone || req.user.profile?.phone,
        experience: req.body.experience || req.user.profile?.experience,
        resume: req.body.resume || req.user.profile?.resume,
        coverLetter: req.body.coverLetter,
        skills: req.body.skills || req.user.profile?.skills
      }
    };

    const application = await Application.create(applicationData);

    // Update applicants count
    job.applicantsCount = (job.applicantsCount || 0) + 1;
    await job.save();

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    User applications
// @route   GET /api/jobseeker/applications
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title location salaryMin salaryMax type')
      .populate('company', 'name logo')
      .sort('-appliedDate');
    
    // Compute stats
    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      reviewing: applications.filter(a => a.status === 'reviewing').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length
    };

    res.json({ applications, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  searchJobs,
  getJobDetails,
  applyToJob,
  getMyApplications
};