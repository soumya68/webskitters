const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  timezone: {
    type: String,
    default: 'UTC',  
  },
});


userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});


userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};


userSchema.methods.generateVerificationToken = function() {
  const token = jwt.sign(
    { email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  this.verificationToken = token;
  return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
