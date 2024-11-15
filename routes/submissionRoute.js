const express = require('express');
const jwt = require('jsonwebtoken');
const Question = require('./models/Question');  
const Submission = require('./models/Submission');  
const User = require('./models/User');  
const router = express.Router();


const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;  
    next();
  });
};


router.post('/submit-answers', verifyToken, async (req, res) => {
  const { answers } = req.body;  
  
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'Answers must be an array and cannot be empty' });
  }

  try {
    const user = await User.findById(req.user.id);  

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    const questions = await Question.find({ '_id': { $in: answers.map(ans => ans.questionId) } });

    if (questions.length !== answers.length) {
      return res.status(400).json({ message: 'Some questions are invalid or not found' });
    }

    
    const answersWithResults = await Promise.all(answers.map(async (answer) => {
      const question = questions.find(q => q._id.toString() === answer.questionId);

      if (!question) {
        throw new Error(`Question with ID ${answer.questionId} not found`);
      }

      const isCorrect = question.correctAnswers.includes(answer.selectedAnswer);
      return {
        question: question._id,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswers,
        isCorrect,
      };
    }));

    
    const submission = new Submission({
      user: user._id,
      answers: answersWithResults,
    });

    await submission.save();

    res.status(200).json({
      message: 'Answers submitted successfully',
      submission: submission,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
