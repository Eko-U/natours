const APPError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new APPError(message, 400);
};

const handleDuplicateErrorDB = (err) => {
  const value = err.errorResponse.errmsg?.match(/([""])(\\?.)*?\1/);
  console.log(value);
  const message = `Duplicate field value: ${value[0]}. Please use another value!`;
  return new APPError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new APPError(message, 400);
};

const handleJsonWebTokenError = () =>
  new APPError('Invalid token. Please log in again', 401);

const handleTokenExpiredError = () =>
  new APPError('Your token has expired!. Please log in again', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api'))
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });

  // B) RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // API
  // A) Operational, trusted Error: send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational)
      return res.status(err.statusCode).json({
        status: err.status,
        message: `${err.message} `,
      });

    // B) Programming or unknown error: don't leak the details
    return res.status(500).json({
      status: 'error',
      message: `Something went wrong! `,
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: `${err.message} `,
    });
  }

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: `Please try again later `,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err?.errorResponse?.code === 11000)
      error = handleDuplicateErrorDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrorProd(error, req, res);
  }

  next();
};
