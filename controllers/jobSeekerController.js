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

    // التحقق من عدم التقديم سابقًا
    const existingApplication = await Application.findOne({
      job: job._id,
      applicant: req.user._id
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    // قراءة البيانات النصية من الـ Body (مع multer، تكون النصوص في req.body)
    const { phone, experience, coverLetter, skills } = req.body;

    // تحديد مسار الـ CV:
    // - إذا تم رفع ملف جديد، استخدمه.
    // - وإلا استخدم الـ CV المخزن في الملف الشخصي.
    let resumePath = null;
    if (req.file) {
      resumePath = `/uploads/${req.file.filename}`;
    } else if (req.user.profile && req.user.profile.resume) {
      resumePath = req.user.profile.resume;
    } else {
      return res.status(400).json({ message: 'CV is required. Please upload a file or update your profile.' });
    }

    const applicationData = {
      job: job._id,
      applicant: req.user._id,
      company: job.company._id,
      status: 'pending',
      applicantDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: phone || req.user.profile?.phone,
        experience: experience || req.user.profile?.experience,
        resume: resumePath,
        coverLetter: coverLetter,
        skills: skills ? skills.split(',').map(s => s.trim()) : (req.user.profile?.skills || [])
      }
    };

    const application = await Application.create(applicationData);

    // تحديث عدد المتقدمين في الوظيفة
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

// @desc    الحصول على بيانات المستخدم الحالي (الملف الشخصي)
// @route   GET /api/jobseeker/my-data
// @access  Private (jobseeker only)
const getMyData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    الحصول على إحصائيات الطلبات فقط
// @route   GET /api/jobseeker/applications/stats
// @access  Private (Job Seeker only)
const getApplicationStats = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id });
    
    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      reviewing: applications.filter(a => a.status === 'reviewing').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length
    };

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    تحديث الملف الشخصي للمتقدم (شامل رفع CV)
// @route   PUT /api/jobseeker/profile
// @access  Private (Job Seeker only)
const updateProfile = async (req, res) => {
  try {
    const { name, phone, skills, experience } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // تحديث الحقول النصية
    if (name) user.name = name;
    if (phone) user.profile.phone = phone;
    if (skills) user.profile.skills = skills.split(',').map(s => s.trim());
    if (experience) user.profile.experience = experience;

    // إذا تم رفع ملف CV جديد
    if (req.file) {
      // حذف الملف القديم اختياري (يمكن تركه)
      user.profile.resume = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  searchJobs,
  getJobDetails,
  applyToJob,
  getMyApplications,
  getMyData,
  getApplicationStats,
  updateProfile
};