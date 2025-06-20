const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const User = require('./userModel');

const tourSchemea = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have 40 characters'],
      minlength: [10, 'A tour must have more than or equal to 10 character'],

      // validate: [validator.isAlpha, 'Name of tour must be alphabelt'],
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5'],
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    // reviews: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Review',
    //   },
    // ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchemea.index({ price: 1 });
tourSchemea.index({ price: 1, ratingAverage: -1 });
tourSchemea.index({ startLocation: 1 });

tourSchemea.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate
tourSchemea.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE

tourSchemea.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchemea.post('save', function (doc, next) {
//   next();
// });

// embeding the guides (user details) into the tour model
// tourSchemea.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async (id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

/////////
////// QUERY MIDDLEWARE

tourSchemea.pre('find', function (next) {
  this.find({
    secretTour: {
      $ne: true,
    },
  });
  next();
});

tourSchemea.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordCreatedAt',
  });

  next();
});

// tourSchemea.pre(/^find/, function (next) {
//   this.populate({
//     path: 'reviews',
//   });

//   next();
// });

//////////
// AGGREGATION MIDDLEWARE
tourSchemea.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });

  next();
});

const Tour = mongoose.model('Tour', tourSchemea);

module.exports = Tour;
