// controllers/companyController.js
/*
const Company = require('../models/Company');
const Job = require('../models/Job');

// create/update company
exports.createOrUpdateCompany = async (req, res) => {
    try {
        const {
            name,
            description,
            industry,
            size,
            location,
            website,
            foundedYear,
            contactEmail,
            contactPhone
        } = req.body;

        let company = await Company.findOne({ userId: req.user._id });

        if (company) {
            // update company
            company.name = name || company.name;
            company.description = description || company.description;
            company.industry = industry || company.industry;
            company.size = size || company.size;
            company.location = location || company.location;
            company.website = website || company.website;
            company.foundedYear = foundedYear || company.foundedYear;
            company.contactEmail = contactEmail || company.contactEmail;
            company.contactPhone = contactPhone || company.contactPhone;
        } else {
            // new company
            company = new Company({
                name,
                description,
                industry,
                size,
                location,
                website,
                foundedYear,
                contactEmail,
                contactPhone,
                userId: req.user._id
            });
        }

        await company.save();

        res.json({
            success: true,
            company
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// get logged-in company
exports.getMyCompany = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user._id });
        
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({
            success: true,
            company
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// get all companies (admin)
exports.getAllCompanies = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const companies = await Company.find(query)
            .populate('userId', 'name email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Company.countDocuments(query);

        res.json({
            success: true,
            companies,
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

// update company status (admin)
exports.updateCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified, isActive } = req.body;

        const company = await Company.findByIdAndUpdate(
            id,
            { isVerified, isActive, updatedAt: Date.now() },
            { new: true }
        ).populate('userId', 'name email');

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({
            success: true,
            company
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
*/