const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // تكرار لتسهيل الاستعلامات
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'accepted', 'rejected'],
    default: 'pending'
  },
  appliedDate: { type: Date, default: Date.now },
  // ApplicantInfo
  applicantDetails: {
    name: String,
    email: String,
    phone: String,
    experience: Number,
    resume: String,
    coverLetter: String,
    skills: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);