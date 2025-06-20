const { htmlToText } = require('html-to-text');
const nodemailer = require('nodemailer');
const pug = require('pug');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.name = user.name.split(' ')[0];
    this.url = url;
    this.from = `Natours Team <${process.env.EMAIL_FROM}>`;
  }

  newTransporter() {
    // Create a transporter for SMTP
    if (process.env.NODE_ENV === 'production')
      return nodemailer.createTransport({
        service: 'sendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });

    return nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      secure: false,
      authMethod: 'PLAIN',
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      name: this.name,
      email: this.email,
      subject,
      url: this.url,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    await this.newTransporter().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family');
  }

  async resetPassword() {
    await this.send('passwordReset', 'Reset your password below');
  }
};
