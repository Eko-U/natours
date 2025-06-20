class APPError extends Error {
  constructor(message, statusCode, name) {
    super(message);

    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    this.name = name || '';
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = APPError;
