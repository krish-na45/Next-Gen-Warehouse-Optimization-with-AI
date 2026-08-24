// auth.js — User auth routes (proxies to Supabase)
// The frontend already calls Supabase directly for login/signup.
// These routes are here for completeness and server-side use.

const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router  = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password, display_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: display_name || "" } },
  });

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: "Registration successful. Check your email to confirm.", user_id: data.user?.id });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: "Invalid email or password" });

  res.json({
    token:   data.session.access_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

// GET /api/auth/me — return current user from token
router.get("/me", async (req, res) => {
  const header = req.headers["authorization"] || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: "No token" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "Invalid session" });

  res.json({ id: data.user.id, email: data.user.email });
});

module.exports = router;
