const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message, err);
  console.log('uncaught exception 💣 shutting down');
  process.exit(1);
});

// Storing the variable in config.env in environment variable
dotenv.config({ path: './config.env' });

// Requiring the app from the app.js file which have the listen method
const app = require(`${__dirname}/app`);

// Getting the mongodb connection string from environment variable
const DB = process.env.DATABASE_CONNECTION.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// Connecting to my database using mongoose
mongoose.connect(DB).then((conn) => console.log('DB is connected'));

// Getting the port from environment variable
const port = process.env.PORT || 3000;

// using the listen method to listen to different requests and respond
//  based on their controller
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message, err);
  console.log('unhandle rejection 💣 shutting down');
  server.close(() => {
    process.exit(1);
  });
});
