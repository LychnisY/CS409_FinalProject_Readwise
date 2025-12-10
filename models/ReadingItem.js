const mongoose = require('mongoose');
const { Schema } = mongoose;

const readingItemSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String },      // e.g. "哲学"
    school: { type: String },     // e.g. "存在主义"
    title: { type: String, required: true },
    author: { type: String },
    totalPages: { type: Number, default: 0 },
    currentPage: { type: Number, default: 0 }
  },
  { timestamps: true }
);

readingItemSchema.index({ user: 1, title: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('ReadingItem', readingItemSchema);
