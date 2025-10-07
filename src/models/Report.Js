const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReportSchema = new Schema({
  reportedAd: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad', // O anúncio denunciado
    required: false,
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Usuário denunciado
    required: false,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Usuário que fez a denúncia
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pendente', 'em análise', 'resolvido'],
    default: 'pendente',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Report', ReportSchema);