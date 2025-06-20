const APPError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./../controller/handleFactory');

const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'public/img/users');
//   },

//   filename: function (req, file, cb) {
//     const ext = file.mimetype.split('/')[1];

//     cb(null, `${file.fieldname}-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const upload = multer({ storage: multerStorage });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const ext = req.file.mimetype.split('/')[1];

    req.file.filename = `${req.file.fieldname}-${req.user.id}-${Date.now()}.${ext}`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  } catch (err) {
    next(err);
  }
};

exports.createUser = catchAsync(async (req, res, next) => {
  next();
});

exports.getAllUsers = async (req, res, next) => {
  const users = await User.find({ active: { $ne: false } });

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
};

exports.getUser = factory.getOne(User);

exports.updateUser = async (req, res) => {
  const user = await User.findOneAndDelete({ _id: req.params.id });

  res.status(404).json({
    status: 'success',
    data: null,
  });
};

exports.deleteUser = factory.deleteOne(User);

// exports.deleteUser = async (req, res) => {
//   const user = await User.findOneAndDelete({ _id: req.params.id });

//   res.status(404).json({
//     status: 'success',
//     data: null,
//   });
// };

function filterObj(obj, ...otherfields) {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (otherfields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
}

exports.getUserId = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
 
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new APPError(
        'This route is not for password updates. Please use /updatePassword',
        400,
      ),
    );
  }

  // 2) Update user document
  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',

    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });

  res.status(204).json({
    status: 'success',
    data: null,
    message: 'Your account is deleted succesfully',
  });
});
