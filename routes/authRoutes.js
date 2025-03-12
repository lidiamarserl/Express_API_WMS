const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

function writeLogToFile(action, username, ipAddress, reason = null) {
  const logFilePath = path.join(__dirname, '../../activity_logs.txt');
  const logMessage = `[${new Date().toISOString()}] ACTION: ${action}, USERNAME: ${username}, IP: ${ipAddress}${reason ? `, REASON: ${reason}` : ''}\n`;
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Error writing log to file:', err);
    }
  });
}

// Endpoint login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  try {
    const user = await User.findOne({ username, password });
    if (user) {
      writeLogToFile('LOGIN', username, ipAddress, 'SUCCESS');
      res.status(200).json({ message: 'Login successful', token: 'dummy-token' });
    } else {
      writeLogToFile('LOGIN', username, ipAddress, 'FAILED');
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Endpoint logout
router.post('/logout', (req, res) => {
  const { username, reason } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  try {
    writeLogToFile('LOGOUT', username, ipAddress, reason || 'No reason provided');
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error in /logout:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
