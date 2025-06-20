const nodemailer = require('nodemailer');

async function sendEmail(options) {
  // Create a transporter for SMTP

  console.log(process.env.EMAIL_PASSWORD, process.env.EMAIL_USER);
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: false,
    authMethod: 'PLAIN',
  });

  const mailOptions = {
    from: 'Natours Team" <gift@natours.io',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;
