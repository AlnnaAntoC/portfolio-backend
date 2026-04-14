const express = require('express');
const router = express.Router();
const mailjet = require('node-mailjet').connect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);
const multer = require('multer');

// Store file in memory (not disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC/DOCX files are allowed'));
    }
  }
});

router.post('/', upload.single('resume'), async (req, res) => {
  console.log('Resume upload received');

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

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
              Name: 'Portfolio Careers',
            },
            To: [
              {
                Email: process.env.HR_EMAIL,
                Name: 'HR Team',
              },
            ],
            Subject: `New Resume Received — ${req.file.originalname}`,
            TextPart: `A resume has been uploaded via the careers page. File: ${req.file.originalname}, Size: ${(req.file.size / 1024).toFixed(1)} KB`,
            HTMLPart: `
              <h3>New Resume Submission</h3>
              <p>A new resume has been uploaded via the careers page.</p>
              <p><strong>File:</strong> ${req.file.originalname}</p>
              <p><strong>Size:</strong> ${(req.file.size / 1024).toFixed(1)} KB</p>
              <p>Please find the resume attached.</p>
            `,
            Attachments: [
              {
                ContentType: req.file.mimetype,
                Filename: req.file.originalname,
                Base64Content: req.file.buffer.toString('base64'),
              },
            ],
          },
        ],
      });

    const status = mailjetRes.body?.Messages?.[0]?.Status;
    if (status !== 'success') {
      throw new Error(`Mailjet send failed: ${status}`);
    }

    console.log('Resume emailed successfully via Mailjet!', JSON.stringify(mailjetRes.body));
    res.status(200).json({ success: true, message: 'Resume sent successfully!' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send resume' });
  }
});

module.exports = router;