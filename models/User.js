const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    settings: {
      timezone: { type: String, default: 'America/Chicago' },
      dailyPageGoal: { type: Number, default: 0 },
      dailyMinutesGoal: { type: Number, default: 0 },
      streakDays: { type: Number, default: 1 },      // 注册当天记为第 1 天
      lastActiveDate: { type: Date, default: null }
    }
    
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
