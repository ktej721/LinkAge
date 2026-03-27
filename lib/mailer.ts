import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string, name: string): Promise<void> {
  const mailOptions = {
    from: `"LinkAge Platform" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your LinkAge Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">LinkAge 🔗</h1>
          <p style="color: #6B7280; margin: 5px 0;">Connecting generations, one task at a time</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1F2937; margin-top: 0;">Hello, ${name}! 👋</h2>
          <p style="color: #4B5563;">Your verification code is:</p>
          <div style="background: #EEF2FF; border: 2px dashed #4F46E5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
        <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 20px;">
          If you did not request this code, please ignore this email.
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
}

export async function sendWelcomeEmail(email: string, name: string, role: string): Promise<void> {
  const roleText = role === 'senior' ? 'as a Senior Member' : 'as a Student Helper';
  await transporter.sendMail({
    from: `"LinkAge Platform" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Welcome to LinkAge! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">Welcome to LinkAge! 🔗</h1>
        <p>Hi ${name}, you've successfully registered ${roleText}.</p>
        <p>You can now log in and start ${role === 'senior' ? 'posting your questions' : 'helping seniors with their questions'}.</p>
        <p style="color: #6B7280;">Thank you for being part of our community!</p>
      </div>
    `,
  });
}
