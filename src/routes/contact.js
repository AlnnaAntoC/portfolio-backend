const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');

router.post('/', async (req, res) => {
  console.log('Request received:', req.body);

  const { name, email, subject, message, captchaToken } = req.body;

  // 1. Check all fields are present
  if (!name || !email || !subject || !message || !captchaToken) {
    console.log('Missing fields!');
    return res.status(400).json({ error: 'All fields are required' });
  }

  // 2. Verify reCAPTCHA token with Google
  try {
    const captchaRes = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    const { success, score } = captchaRes.data;
    console.log('CAPTCHA result:', { success, score });

    if (!success || score < 0.5) {
      return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }
  } catch (err) {
    console.error('CAPTCHA error:', err.message);
    return res.status(500).json({ error: 'CAPTCHA check failed' });
  }

  // 3. Send the email
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `${subject} — from ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    console.log('Email sent successfully!');
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;