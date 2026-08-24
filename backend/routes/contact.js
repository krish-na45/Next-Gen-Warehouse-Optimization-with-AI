// contact.js — Contact form messages
// Receives submitted messages and stores them in memory.
// Messages are viewable at GET /api/contact/messages (for demo/viva).

const express = require("express");
const router  = express.Router();

// In-memory store — simple array, fine for a college demo
const messages = [];

// POST /api/contact — submit a contact message
router.post("/", (req, res) => {
  const { name, email, subject, message } = req.body;

  // Server-side validation
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters." });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (!subject || subject.trim().length < 3) {
    return res.status(400).json({ error: "Subject must be at least 3 characters." });
  }
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ error: "Message must be at least 10 characters." });
  }

  // Save message
  const entry = {
    id:        messages.length + 1,
    name:      name.trim(),
    email:     email.trim().toLowerCase(),
    subject:   subject.trim(),
    message:   message.trim(),
    timestamp: new Date().toISOString(),
  };
  messages.push(entry);

  console.log(`📩  New contact message from ${entry.name} <${entry.email}> — "${entry.subject}"`);

  res.status(201).json({
    success: true,
    message: "Thank you! Your message has been received. We will get back to you soon.",
  });
});

// GET /api/contact/messages — view all messages (useful for viva demo)
router.get("/messages", (_req, res) => {
  res.json({ total: messages.length, messages });
});

module.exports = router;
