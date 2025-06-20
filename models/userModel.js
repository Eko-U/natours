const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    unique: true,
  },

  email: {
    type: String,
    required: [true, 'Please provide your email'],
    validate: [validator.isEmail, 'Please provide a valid email'],
    unique: true,
    lowercase: true,
  },

  passwordChangeAt: {
    type: Date,
    default: Date.now,
  },

  photo: {
    type: String,
    default: 'default.jpg',
  },

  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'role is not available',
    },
    default: 'user',
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    min: [8, 'Password must be more than 8 letters'],
    max: [15, 'Password must be less than or equal to 15 letters'],
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },

      message: `passwordConfirm is not themsame with password`,
    },
  },

  passwordResetToken: String,
  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // isModified check if password is changed
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', async function (next) {
  // doc modified return true negate to false or the document is new
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangeAt = Date.now() - 1000;
  next();
});

// instances in the userModel

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePassword = async function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    const timeStampChange = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10,
    );
    console.log(timeStampChange, JWTTimestamp);
    return timeStampChange > JWTTimestamp;
  }

  return false;
};

userSchema.methods.forgotPassword = async function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log(token);
  return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
