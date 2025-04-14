const nodemailer = require('nodemailer');

const generateOTP = () => {
    return Math.floor(1000+ Math.random() * 9000).toString();
};

const sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: 
        {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: 'Your OTP for Verification',
        text: `Your OTP is ${otp}. It is valid for 5 minutes.`
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTPEmail };
