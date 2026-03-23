// controllers/jobController.js
/*
const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');

// create job
exports.createJob = async (req, res) => {
    try {
        const {
            title,
            description,
            requirements,
            responsibilities,
            location,
            jobType,
            experienceLevel,
            salary,
            category,
            applicationDeadline,
            numberOfVacancies,
            tags
        } = req.body;

        // get employer company
        const company = await Company.findOne({ userId: req.user._id });
        if (!company) {
            return res.status(400).json({ error: 'Company not found' });
        }

        const job = new Job({
            title,
            description,
            requirements: Array.isArray(requirements) ? requirements : [requirements],
            responsibilities: Array.isArray(responsibilities) ? responsibilities : [responsibilities],
            location,
            jobType,
            experienceLevel,
            salary,
            category,
            applicationDeadline,
            numberOfVacancies,
            tags: Array.isArray(tags) ? tags : [],
            companyId: company._id,
            userId: req.user._id,
            status: 'published'
        });

        await job.save();

        res.status(201).json({
            success: true,
            job
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// get all jobs
exports.getAllJobs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            location = '',
            jobType = '',
            category = '',
            experienceLevel = ''
        } = req.query;

        const skip = (page - 1) * limit;
        const query = { status: 'published' };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (jobType) {
            query.jobType = jobType;
        }

        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        if (experienceLevel) {
            query.experienceLevel = experienceLevel;
        }

        const jobs = await Job.find(query)
            .populate('companyId', 'name logo location')
            .populate('userId', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        // increase views
        await Job.updateMany(
            { _id: { $in: jobs.map(job => job._id) } },
            { $inc: { views: 1 } }
        );

        const total = await Job.countDocuments(query);

        res.json({
            success: true,
            jobs,
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

// get employer jobs
exports.getEmployerJobs = async (req, res) => {
    try {
        const { status = '' } = req.query;
        const query = { userId: req.user._id };

        if (status) {
            query.status = status;
        }

        const jobs = await Job.find(query)
            .populate('companyId', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            jobs
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// get job by id
exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('companyId', 'name logo description industry size website')
            .populate('userId', 'name email');

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // increase views
        job.views += 1;
        await job.save();

        res.json({
            success: true,
            job
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// update job
exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        
        const job = await Job.findOne({ _id: id, userId: req.user._id });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        Object.keys(req.body).forEach(key => {
            if (key !== 'status') { // status not allowed here
                job[key] = req.body[key];
            }
        });

        await job.save();

        res.json({
            success: true,
            job
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// update job status
exports.updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const job = await Job.findOne({ _id: id, userId: req.user._id });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        job.status = status;
        await job.save();

        res.json({
            success: true,
            job
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// delete job
exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findOne({ _id: id, userId: req.user._id });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        await job.deleteOne();

        res.json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
*/