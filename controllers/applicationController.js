// controllers/applicationController.js
/*
const Application = require('../models/Application');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');

// Apply for job
exports.applyForJob = async (req, res) => {
    try {
        const { jobId, coverLetter } = req.body;
        
        // Validate job exists
        const job = await Job.findById(jobId);
        if (!job || job.status !== 'published') {
            return res.status(404).json({ error: 'Job not found or not available' });
        }

        // Check deadline
        if (new Date(job.applicationDeadline) < new Date()) {
            return res.status(400).json({ error: 'Application deadline has passed' });
        }

        // Prevent duplicate
        const existingApplication = await Application.findOne({
            jobId,
            applicantId: req.user._id
        });

        if (existingApplication) {
            return res.status(400).json({ error: 'You have already applied for this job' });
        }

        // Get resume
        const resume = req.file ? `/uploads/resumes/${req.file.filename}` : '';

        if (!resume) {
            return res.status(400).json({ error: 'Resume is required' });
        }

        const application = new Application({
            jobId,
            applicantId: req.user._id,
            companyId: job.companyId,
            coverLetter,
            resume,
            status: 'pending'
        });

        await application.save();

        // Increment applicants
        job.applicationsReceived += 1;
        await job.save();

        res.status(201).json({
            success: true,
            application
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get my applications
exports.getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ applicantId: req.user._id })
            .populate({
                path: 'jobId',
                select: 'title location jobType companyId',
                populate: {
                    path: 'companyId',
                    select: 'name logo'
                }
            })
            .sort({ appliedDate: -1 });

        res.json({
            success: true,
            applications
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get job applications
exports.getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status = '' } = req.query;

        // Verify ownership
        const job = await Job.findOne({ _id: jobId, userId: req.user._id });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const query = { jobId };
        if (status) {
            query.status = status;
        }

        const applications = await Application.find(query)
            .populate('applicantId', 'name email phone avatar')
            .sort({ appliedDate: -1 });

        res.json({
            success: true,
            applications
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all applications
exports.getAllApplications = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '' } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) {
            query.status = status;
        }

        const applications = await Application.find(query)
            .populate('jobId', 'title')
            .populate('applicantId', 'name email')
            .populate('companyId', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ appliedDate: -1 });

        const total = await Application.countDocuments(query);

        res.json({
            success: true,
            applications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update status
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, rating, interviewDate, interviewLocation } = req.body;

        // Find application
        const application = await Application.findById(id)
            .populate('jobId', 'userId');

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Check authorization
        if (req.user.role === 'employer') {
            const job = await Job.findById(application.jobId);
            if (!job || job.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Not authorized' });
            }
        }

        // Update status
        if (status) {
            application.status = status;
            if (status === 'reviewed' && !application.reviewedDate) {
                application.reviewedDate = Date.now();
            }
        }

        if (notes !== undefined) application.notes = notes;
        if (rating !== undefined) application.rating = rating;
        if (interviewDate !== undefined) application.interviewDate = interviewDate;
        if (interviewLocation !== undefined) application.interviewLocation = interviewLocation;

        await application.save();

        res.json({
            success: true,
            application
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get stats
exports.getApplicationStats = async (req, res) => {
    try {
        let stats;

        if (req.user.role === 'employer') {
            // Employer stats
            const company = await Company.findOne({ userId: req.user._id });
            if (!company) {
                return res.json({ success: true, stats: {} });
            }

            const totalJobs = await Job.countDocuments({ companyId: company._id });
            const totalApplications = await Application.countDocuments({ companyId: company._id });
            
            const applicationsByStatus = await Application.aggregate([
                { $match: { companyId: company._id } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            stats = {
                totalJobs,
                totalApplications,
                applicationsByStatus: applicationsByStatus.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            };
        } else if (req.user.role === 'job_seeker') {
            // Job seeker stats
            const totalApplications = await Application.countDocuments({ applicantId: req.user._id });
            
            const applicationsByStatus = await Application.aggregate([
                { $match: { applicantId: req.user._id } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            stats = {
                totalApplications,
                applicationsByStatus: applicationsByStatus.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            };
        } else if (req.user.role === 'admin') {
            // Admin stats
            const totalJobs = await Job.countDocuments();
            const totalApplications = await Application.countDocuments();
            const totalCompanies = await Company.countDocuments();
            const totalUsers = await User.countDocuments();

            stats = {
                totalJobs,
                totalApplications,
                totalCompanies,
                totalUsers
            };
        }

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
*/