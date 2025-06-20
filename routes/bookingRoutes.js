const express = require('express');

const tourController = require('./../controller/tourController');
const authController = require('./../controller/authController');
const bookingController = require('./../controller/bookingController');

const router = express.Router();

router
  .route('/checkout-session/:tourId')
  .get(authController.protect, bookingController.getCheckoutSession);

  

router.route('/').get(authController.protect, bookingController.getAllBookings);

router
  .route('/:bookingId')
  .get(authController.protect, bookingController.getBooking)
  .patch(
    authController.protect,
    // authController.restrictTo('admin'),
    bookingController.updateBooking,
  )
  .delete(authController.protect, bookingController.deleteBooking);

module.exports = router;
