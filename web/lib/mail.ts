import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (options: {
  email: string;
  subject: string;
  message: string;
  html?: string;
}) => {
  const mailOptions = {
    from: `"${process.env.FROM_EMAIL_NAME || 'offers buddy'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetOTPEmail = async (email: string, otp: string) => {
  const message = `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9eb; border-radius: 8px;">
      <h2 style="color: #111827; margin-bottom: 16px;">Password Reset OTP</h2>
      <p style="color: #4b5563; line-height: 1.5; margin-bottom: 24px;">
        You are receiving this email because you (or someone else) have requested the reset of the password for your offers buddy account.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background-color: #f3f4f6; color: #111827; padding: 16px; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 6px; display: inline-block; border: 1px solid #e5e7eb;">
          ${otp}
        </div>
      </div>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
        This OTP will expire in 10 minutes. If you did not request this, please ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid #e9e9eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        This is an automated email, please do not reply.
      </p>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Password Reset OTP',
    message,
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9eb; rounded: 8px;">
      <h2 style="color: #111827; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="color: #4b5563; line-height: 1.5; margin-bottom: 24px;">
        You are receiving this email because you (or someone else) have requested the reset of the password for your offers buddy account.
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${resetUrl}" style="background-color: #00A651; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
        If you did not request this, please ignore this email and your password will remain unchanged.
      </p>
      <hr style="border: 0; border-top: 1px solid #e9e9eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        This is an automated email, please do not reply.
      </p>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Password Reset Request',
    message,
    html,
  });
};
