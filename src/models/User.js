const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const modelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true }, // <- ObjectId
    password: { type: String, required: true },
    token: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ad' }],
    pixKey: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

const modelName = 'User';
module.exports = mongoose.connection.models[modelName]
  ? mongoose.connection.models[modelName]
  : mongoose.model(modelName, modelSchema);
