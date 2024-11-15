const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendVerificationEmail = require('../utils/sendVerificationEmail'); 
const authenticate = require('../middlewares/authMiddleware'); 
const multer = require('multer');
const Category = require('../models/catagoriesModel');  
const Question = require('../models/questionsModel'); 
const upload = require('../utils/multerConfig'); 
const moment = require('moment-timezone'); 
const Submission = require('../models/submissionModel');  
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

router.get('/', async (req, res) => {
    try {
      
      const categories = await Category.find();
  
      
      res.status(200).json({
        message: 'Categories fetched successfully',
        categories,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });




router.get('/questions', async (req, res) => {
    try {
      
      const categories = await Category.find();
  
      
      const categoriesWithQuestions = [];
  
      
      for (const category of categories) {
        
        const questions = await Question.find({ categories: category._id });
  
        categoriesWithQuestions.push({
          category: category.name,
          questions: questions.map((question) => ({
            _id: question._id,
            questionText: question.questionText,
            options: question.options,
          })),
        });
      }
  
      
      res.status(200).json({
        message: 'Categories and questions fetched successfully',
        categoriesWithQuestions,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });




router.get('/questions-count', async (req, res) => {
    try {
      
      const categories = await Category.find();
  
      
      
      const categoryWithQuestionCounts = await Promise.all(categories.map(async (category) => {
        const questionCount = await Question.countDocuments({ categories: category._id });
        return {
          category: category.name,
          questionCount,
        };
      }));
  
      
      res.status(200).json({
        message: 'Categories with question counts fetched successfully',
        categories: categoryWithQuestionCounts,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  


router.get('/search', verifyToken, async (req, res) => {
  const { questionId, timezone } = req.query;  

  try {
    const user = await User.findById(req.user.id);  
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    const userTimezone = timezone || user.timezone || 'UTC';

    
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    
    const submission = await Submission.findOne({
      user: user._id,
      'answers.question': questionId,
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found for this question' });
    }

    
    const answer = submission.answers.find(ans => ans.question.toString() === questionId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found for this question' });
    }

    
    const submissionTime = moment(answer.submittedAt).tz(userTimezone).format('YYYY-MM-DD HH:mm:ss');

    
    const response = {
      question: question.text,
      options: question.options,
      correctAnswer: answer.correctAnswer,
      selectedAnswer: answer.selectedAnswer,
      isCorrect: answer.isCorrect,
      submittedAt: submissionTime, 
    };

    res.status(200).json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

  module.exports = router;