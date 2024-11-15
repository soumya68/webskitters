const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendVerificationEmail = require('../utils/sendVerificationEmail'); 
const authenticate = require('../middlewares/authMiddleware'); 
const multer = require('multer');
const upload = require('../utils/multerConfig'); 
const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    
    const user = new User({ username, email, password });
    
    
    const verificationToken = user.generateVerificationToken();

    
    await user.save();

    
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'Signup successful! Please check your email to verify your account.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      
      if (!user.verified) {
        return res.status(400).json({ message: 'Please verify your email before logging in.' });
      }
  
      
      const isPasswordCorrect = await user.comparePassword(password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );
  
      
      res.status(200).json({
        message: 'Login successful',
        token,  
        user: {
          username: user.username,
          email: user.email,
          verified: user.verified,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

router.get('/profile', authenticate, async (req, res) => {
    try {
      
      const user = await User.findById(req.user.userId);  
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      
      res.status(200).json({
        username: user.username,
        email: user.email,
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });




router.put('/profile', authenticate, upload.single('profilePicture'), async (req, res) => {
    try {
      const { username, email } = req.body;
  
      
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email is already in use' });
        }
      }
  
      
      let profilePictureUrl = user.profilePicture; 
  
      if (req.file) {
        
        if (process.env.USE_CLOUDINARY === 'true') {
          
          const uploadResult = await cloudinary.uploader.upload(req.file.path);
          profilePictureUrl = uploadResult.secure_url;
        } else {
          
          profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
        }
      }
  
      
      user.username = username || user.username;
      user.email = email || user.email;
      user.profilePicture = profilePictureUrl;
  
      
      await user.save();
  
      
      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
module.exports = router;
