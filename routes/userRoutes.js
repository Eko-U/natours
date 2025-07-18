const express = require('express');

const userController = require('../controller/userController');
const authController = require('../controller/authController');
const multer = require('multer');

// const upload = multer({ dest: 'public/img/users' });

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);

router.get('/me', userController.getUserId, userController.getUser);

// router.patch('/updateMe', upload.single('photo'), userController.updateMe);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

// /api/v1/users
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
