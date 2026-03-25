const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

const getEmployers = async (req, res) => {
  try {
    const employers = await User.find({ role: 'employer' }).select('name email _id');
    res.json(employers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

// @desc    الحصول على قائمة الشركات مع عدد الوظائف
// @route   GET /api/admin/companies
// @access  Private (Admin only)

// @desc    الحصول على قائمة الشركات مع عدد الوظائف
// @route   GET /api/admin/companies
// @access  Private (Admin only)
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.aggregate([
      {
        $lookup: {
          from: 'jobs',           // اسم مجموعة jobs في MongoDB (عادة بصيغة الجمع)
          localField: '_id',
          foreignField: 'company',
          as: 'jobsList'
        }
      },
      {
        $addFields: {
          jobsPosted: { $size: '$jobsList' }
        }
      },
      {
        $project: { jobsList: 0 } // إزالة حقل jobsList من النتيجة
      }
    ]);

    // إضافة معلومات صاحب الشركة (owner) باستخدام populate بعد الـ aggregate
    // لاحظ أن aggregate لا يقوم populate تلقائيًا، لذا نستخدم حلقة أو populate منفصل
    // ولكن يمكن استخدام populate بعد الـ aggregate عن طريق إرجاع الـ _id ثم استعلام منفصل.
    // بديل: استخدام mongoose populate بعد find العادي ثم إضافة jobsPosted يدويًا.
    // إليك طريقة بديلة أبسط:
    // const companies = await Company.find().populate('owner', 'name email');
    // ثم نضيف jobsPosted لكل شركة باستخدام Promise.all.
    
    // الطريقة الأفضل (تجنب المشاكل مع populate):
    const companiesWithOwner = await Company.find().populate('owner', 'name email');
    const companiesWithJobsCount = await Promise.all(
      companiesWithOwner.map(async (company) => {
        const jobsCount = await Job.countDocuments({ company: company._id });
        return {
          ...company.toObject(),
          jobsPosted: jobsCount
        };
      })
    );
    
    res.json(companiesWithJobsCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    تحديث بيانات شركة
// @route   PUT /api/admin/companies/:id
// @access  Private (Admin only)
const updateCompany = async (req, res) => {
  try {
    const { name, industry, location, size, status, owner } = req.body;
    
    // البحث عن الشركة
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // إذا تم تغيير owner، تحقق من أن المستخدم الجديد من نوع employer
    if (owner && owner !== company.owner.toString()) {
      const newOwner = await User.findById(owner);
      if (!newOwner) {
        return res.status(404).json({ message: 'New owner not found' });
      }
      if (newOwner.role !== 'employer') {
        return res.status(400).json({ message: 'Owner must be an employer' });
      }
    }
    
    // تحديث الحقول
    if (name) company.name = name;
    if (industry) company.industry = industry;
    if (location) company.location = location;
    if (size) company.size = size;
    if (status) company.status = status;
    if (owner) company.owner = owner;
    
    await company.save();
    
    // إعادة الشركة مع بيانات صاحبها
    const updatedCompany = await Company.findById(company._id).populate('owner', 'name email');
    res.json(updatedCompany);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    حذف شركة (مع كل الوظائف والطلبات المرتبطة)
// @route   DELETE /api/admin/companies/:id
// @access  Private (Admin only)
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // الحصول على جميع وظائف الشركة
    const jobs = await Job.find({ company: company._id });
    const jobIds = jobs.map(job => job._id);
    
    // حذف جميع الطلبات المرتبطة بهذه الوظائف
    if (jobIds.length > 0) {
      await Application.deleteMany({ job: { $in: jobIds } });
    }
    
    // حذف الوظائف
    await Job.deleteMany({ company: company._id });
    
    // حذف الشركة
    await company.deleteOne();
    
    res.json({ message: 'Company and all associated jobs and applications deleted successfully' });
  } catch (error) {
    console.error(error);
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

// @desc    إنشاء شركة جديدة
// @route   POST /api/admin/companies
// @access  Private (Admin only)
const createCompany = async (req, res) => {
  try {
    const { name, industry, location, size, owner } = req.body;

    // التحقق من وجود صاحب الشركة وأنه من نوع employer
    const ownerUser = await User.findById(owner);
    if (!ownerUser) {
      return res.status(404).json({ message: 'Owner user not found' });
    }
    if (ownerUser.role !== 'employer') {
      return res.status(400).json({ message: 'Owner must be an employer' });
    }

    // إنشاء الشركة
    const company = await Company.create({
      name,
      industry,
      location,
      size,
      owner,
      status: 'active' // افتراضي
    });

    res.status(201).json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    حذف وظيفة (مع جميع الطلبات المرتبطة)
// @route   DELETE /api/employer/jobs/:id
// @access  Private (Employer only)

module.exports = {
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
};