const express = require('express');
const router = express.Router();
const axios = require('axios');
const mailjet = require('node-mailjet').connect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

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

    const mailjetRes = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_SENDER_EMAIL,
              Name: 'Portfolio Contact',
            },
            To: [
              {
                Email: process.env.CONTACT_EMAIL,
                Name: 'Portfolio Owner',
              },
            ],
            Subject: `${subject} — from ${name}`,
            TextPart: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
            HTMLPart: `
              <h3>New Contact Form Submission</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong> ${message}</p>
            `,
            ReplyTo: {
              Email: email,
              Name: name,
            },
          },
        ],
      });

    const status = mailjetRes.body?.Messages?.[0]?.Status;
    if (status !== 'success') {
      throw new Error(`Mailjet send failed: ${status}`);
    }

    console.log('Email sent successfully via Mailjet!', JSON.stringify(mailjetRes.body));
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (err) {
    console.error('Email error:', err.message || err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;