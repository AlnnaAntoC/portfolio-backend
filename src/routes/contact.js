const express = require('express');
const router = express.Router();
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

  // 3. Send the email via Mailjet
  try {
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      throw new Error('Mailjet credentials are not configured');
    }

    const mailjetRes = await axios.post(
      'https://api.mailjet.com/v3.1/send',
      {
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_USER,
              Name: name,
            },
            To: [
              {
                Email: process.env.EMAIL_USER,
                Name: 'Portfolio Owner',
              },
            ],
            Subject: `${subject} — from ${name}`,
            HTMLPart: `
              <h3>New Contact Form Submission</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong> ${message}</p>
            `,
          },
        ],
      },
      {
        auth: {
          username: process.env.MAILJET_API_KEY,
          password: process.env.MAILJET_SECRET_KEY,
        },
      }
    );

    const status = mailjetRes.data?.Messages?.[0]?.Status;
    if (status !== 'success') {
      throw new Error(`Mailjet send failed: ${status}`);
    }

    console.log('Email sent successfully via Mailjet!');
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;