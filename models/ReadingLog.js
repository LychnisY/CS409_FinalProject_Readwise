const mongoose = require('mongoose');
const { Schema } = mongoose;

const readingLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readingItem: { type: Schema.Types.ObjectId, ref: 'ReadingItem', required: true },
    date: { type: Date, required: true },
    pagesRead: { type: Number, required: true },
    currentPageAfter: { type: Number, required: true }
  },
  { timestamps: true }
);

readingLogSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('ReadingLog', readingLogSchema);
