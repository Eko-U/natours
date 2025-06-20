const Review = require('../models/reviewModel');
const APPError = require('../utils/appError');
const factory = require('./handleFactory');

exports.getAllReviews = async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    length: reviews.length,
    data: {
      reviews,
    },
  });
};

exports.createReview = factory.createOne(Review);

// exports.createReview = async (req, res, next) => {
//   if (!req.body.id) req.body.id = req.user.id;
//   if (!req.body.tour) req.body.tour = req.params.tourId;

//   console.log(req.user.id, req.params.tourId);

//   const reviews = await Review.create({
//     review: req.body.review,
//     rating: req.body.rating,
//     user: req.user.id,
//     tour: req.params.tourId,
//   });

//   res.status(200).json({
//     status: 'success',
//     data: {
//       reviews,
//     },
//   });
// };

exports.getReview = async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.id });
  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
};

exports.updateReview = factory.updateOne(Review);

// exports.updateReview = async (req, res, next) => {
//   if (req.body.tour)
//     return next(
//       new APPError("You can't update tour in your review. Thanks", 403),
//     );

//   const review = await Review.findOneAndUpdate(
//     {
//       _id: req.params.id,
//     },
//     req.body,
//     {
//       new: true,
//       runValidators: true,
//     },
//   );

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review,
//     },
//   });
// };

exports.deleteReview = factory.deleteOne(Review);

// exports.deleteReview = async (req, res, next) => {
//   const reviews = await Review.findOneAndDelete({ _id: req.params.id });

//   res.status(200).json({
//     status: 'success',
//     review: null,
//   });
// };
