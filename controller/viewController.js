const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const APPError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection

  const tours = await Tour.find();

  if (!tours) return next(new APPError('No tour find', 404));

  //  2) Build template

  // 3) Render that template using tour data form 1)
  res.status(200).render('overview', {
    tours,
    title: 'Choose any tour of your choice 😊',
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { name } = req.params;

  const tour = await Tour.findOne({ slug: name }).populate({
    path: 'reviews',
    select: 'review rating ',
  });

  if (!tour) next(new APPError('There is no tour for this name'));

  res.status(200).render('tourTemplate', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login Page',
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account details',
  });
});

exports.updateUserData = async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidator: true,
    },
  );

  res.status(200).render('account', {
    title: 'Your account details',
    user: user,
  });
};

exports.getMyTour = async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });
  const tourId = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourId } });

  res.status(200).render('overview', {
    tours,
    title: 'Natours | My Booked Tours',
  });
};
