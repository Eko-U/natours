const { promisify } = require('util');
const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');

const APPError = require('./../utils/appError');
const { listeners } = require('../models/tourModel');
const sendEmail = require('../utils/email');
const Email = require('../utils/email');

const signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  return token;
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  const token = signToken(newUser._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return next(new APPError('User must put password or email', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  // if(user)
  const isCorrect = await user?.correctPassword(password, user.password);

  //  await bcrypt.compare(password, user.password);

  if (!user || !isCorrect) {
    return next(new APPError('incorrect email or password', 401));
  }

  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(201).json({
    status: 'success',
    token,
  });
});

exports.logout = (req, res) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };

  res.cookie('jwt', 'please try something', cookieOptions);

  res.status(201).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1 Getting token and check if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization?.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new APPError('You are not logged in! Please log in to get access', 401),
    );
  }

  // 2) verification
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY,
    () => {},
  );

  // 3) check if user still exits
  const freshUser = await User.findById(decoded.id);
  if (!freshUser)
    return next(
      new APPError('The user belonging to the token no longer exit', 401),
    );

  // 4) check if user changed password after the token was issued

  const isPasswordChange = await freshUser.changePassword(decoded.iat);

  if (isPasswordChange) {
    return next(
      new APPError('Password changed. Please try to login again', 401),
    );
  }

  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new APPError(
          "You can't perform this action. Please try another time",
          403,
        ),
      );
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  // 1) Get user based on email

  const user = await User.findOne({ email: req.body.email });

  const resetToken = await user.forgotPassword();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}}`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    await new Email(user, resetURL).resetPassword();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    console.log(err);
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new APPError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token

  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  console.log(hashToken);

  const user = await User.findOne({ passwordResetToken: hashToken });

  if (!user) {
    return next(
      new APPError(
        'Password reset Token has expired. Please request again',
        403,
      ),
    );
  }

  if (user.passwordResetExpires > Date.now() && user) {
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save();
  }

  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    token,
  });
});

exports.updatePassword = async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  const isCorrect = await bcrypt.compare(
    req.body.passwordCurrent,
    user.password,
  );

  // 2 check if the posted current password is corrrect
  if (!isCorrect)
    return next(
      new APPError(
        "You can't update your password. Please try again later",
        403,
      ),
    );

  //  3 if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // log user in, send jwt
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(201).json({
    status: 'success',
    token,
    user,
  });
};

exports.isLoggedIn = async (req, res, next) => {
  try {
    // 1 Getting token and check if it's there
    if (req.cookies.jwt) {
      // 2) verification
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET_KEY,
        () => {},
      );

      // 3) check if user still exits
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) return next();

      // 4) check if user changed password after the token was issued
      const isPasswordChange = await freshUser.changePassword(decoded.iat);

      if (isPasswordChange) {
        return next();
      }

      // logged in user
      res.locals.user = freshUser;
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};
