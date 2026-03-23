const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  requirements: [String],
  responsibilities: [String],
  category: String, // Engineering, Product
  type: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'] },
  location: String,
  salaryMin: Number,
  salaryMax: Number,
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // employer
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  applicantsCount: { type: Number, default: 0 } // cached
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);