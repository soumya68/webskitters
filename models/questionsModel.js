const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 500,
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', 
    required: true,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  options: [{
    label: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  }],
  correctAnswers: [{
    type: String,
    required: true, 
    enum: ['A', 'B', 'C', 'D'], 
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
