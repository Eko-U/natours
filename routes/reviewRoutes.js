const express = require('express');

const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const APPError = require('../utils/appError');
const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.protect, reviewController.createReview);

router
  .route('/:id')
  .get(authController.protect, reviewController.getReview)
  .patch(authController.protect, reviewController.updateReview)
  .delete(authController.protect, reviewController.deleteReview);

module.exports = router;
