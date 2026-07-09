const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const expectedEmail = process.env.ADMIN_EMAIL || 'admin@hiresight.com';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'password123';

  if (email === expectedEmail && password === expectedPassword) {
    return res.json({ success: true, token: 'hiresight-admin-session-token' });
  } else {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }
});

module.exports = router;
