const APPError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) return next(new APPError('No document found with this id', 404));

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (Model === Review && req.body.tour)
      return next(new APPError("You can't update to newer tour. Thanks", 403));

    const doc = await Model.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc)
      return next(APPError('No document find to update with that ID', 404));

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = await query.populate(popOptions);

    const doc = await query;

    if (!doc) return next(new APPError('No document found with this ID', 404));

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let doc;
    if (Model === Review) {
      if (!req.body.id) req.body.id = req.user.id;
      if (!req.body.tour) req.body.tour = req.params.tourId;

      doc = await Model.create({
        review: req.body.review,
        rating: req.body.rating,
        user: req.user.id,
        tour: req.body.tour,
      });
    }

    if (Model !== Review) doc = await Model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
