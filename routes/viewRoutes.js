const viewsController = require('./../controller/viewController');

const authController = require('./../controller/authController');
const bookingController = require('./../controller/bookingController');

const express = require('express');

const router = express.Router();

router.use(bookingController.alertBooking);

router.route('/').get(
  // bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview,
);

router
  .route('/tours/:name')
  .get(authController.isLoggedIn, viewsController.getTour);

router.route('/login').get(viewsController.login);

router.route('/me').get(authController.protect, viewsController.getAccount);

router
  .route('/my-tours')
  .get(authController.protect, viewsController.getMyTour);

router
  .route('/updateUserData')
  .post(authController.protect, viewsController.updateUserData);

module.exports = router;
