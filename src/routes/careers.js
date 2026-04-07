const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const Resume = require('../models/Resume');   // ← ADDED

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
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Portfolio Careers" <${process.env.EMAIL_USER}>`,
      to: process.env.HR_EMAIL,
      subject: `New Resume Received — ${req.file.originalname}`,
      html: `
        <h3>New Resume Submission</h3>
        <p>A new resume has been uploaded via the careers page.</p>
        <p><strong>File:</strong> ${req.file.originalname}</p>
        <p><strong>Size:</strong> ${(req.file.size / 1024).toFixed(1)} KB</p>
        <p>Please find the resume attached.</p>
      `,
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
          contentType: req.file.mimetype,
        }
      ]
    });

    // Save metadata to MongoDB                       // ← ADDED
    await Resume.create({                             // ← ADDED
      filename: req.file.originalname,                // ← ADDED
      fileSize: req.file.size,                        // ← ADDED
      mimeType: req.file.mimetype,                    // ← ADDED
      emailedTo: process.env.HR_EMAIL,                // ← ADDED
    });                                               // ← ADDED

    console.log('Resume emailed and saved to MongoDB!');
    res.status(200).json({ success: true, message: 'Resume sent successfully!' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send resume' });
  }
});

module.exports = router;