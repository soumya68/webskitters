const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true,
    },
    correctAnswer: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  }],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
