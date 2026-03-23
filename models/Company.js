const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  industry: String,
  location: String,
  size: String, // 50-100
  logo: String, // imageURL
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // employer
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);