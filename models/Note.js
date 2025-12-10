// models/Note.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookTitle: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    note: { type: String, default: '' },      // 对应前端的 note 字段
    tags: { type: [String], default: [] },    // 数组型标签
    date: { type: Date, default: Date.now },  // 记录笔记日期
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
