const catchAsync = require('./../utils/catchAsync');
const APPError = require('../utils/appError');
const factory = require('./handleFactory');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = async (req, res, next) => {
  const tour = await Tour.findById({ _id: req.params.tourId });

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    payment_method_types: ['card'],
    mode: 'payment',
    // success_url: `${req.protocol}://${req.get('host')}/?user=${req.user.id}&tour=${tour.id}&price=${tour.price}`,

    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
  });

  res.status(200).json({
    status: 'success',
    session,
  });
};

// exports.createBookingCheckout = async (req, res, next) => {
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// };

async function createBookingCheckout(session) {
  const tour = session.client_reference_id;
  const { _id } = await User.findOne({ email: session.customer_email });
  const price = session.amount_total / 100;
  // console.log(tour, user, price);
  await Booking.create({ tour, user: _id, price });
}

exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_KEY,
    );
  } catch (err) {
    return res.status(400).send({
      status: 'error',
      message: err.message,
    });
  }

  if (event.type === 'checkout.session.completed')
    await createBookingCheckout(event.data.object);

  res.status(200).send({
    recived: true,
  });
};

exports.getAllBookings = async (req, res, next) => {
  const bookings = await Booking.find();

  res.status(200).json({
    status: 'success',
    bookings,
  });
};

exports.getBooking = async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);

  res.status(403).json({
    status: 'success',
    booking,
  });
};

exports.updateBooking = async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.bookingId,
    req.body,
  );

  res.status(200).json({
    status: 'success',
    booking,
  });
};

exports.deleteBooking = async (req, res, next) => {
  const booking = await Booking.findByIdAndDelete(req.params.bookingId);

  res.status(403).json({
    status: 'success',
    message: 'booking deleted successfully',
  });
};
