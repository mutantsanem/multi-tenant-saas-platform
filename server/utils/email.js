const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendInvitationEmail = async (email, organizationName, inviteToken) => {
  const inviteUrl = `${process.env.CLIENT_URL}/accept-invitation?token=${inviteToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Invitation to join ${organizationName}`,
    html: `
      <h2>You've been invited to join ${organizationName}</h2>
      <p>Click the link below to accept your invitation and set up your account:</p>
      <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
      <p>This invitation will expire in 7 days.</p>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>${inviteUrl}</p>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>${resetUrl}</p>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendInvitationEmail,
  sendPasswordResetEmail
};