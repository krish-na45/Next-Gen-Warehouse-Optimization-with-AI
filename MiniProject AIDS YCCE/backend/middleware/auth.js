// auth.js — Authentication middleware
// Supports two token types:
//   1. Supabase tokens (main user login) — verified via supabase.auth.getUser()
//   2. Agent JWT tokens (delivery agents) — verified via jwt.verify()

const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Login required" });
  }

  // Check if this is an agent token (has role: "agent" in payload)
  let decoded;
  try { decoded = jwt.decode(token); } catch (_) {}

  if (decoded?.role === "agent") {
    // Verify agent JWT with our secret
    try {
      const verified = jwt.verify(token, process.env.AGENT_JWT_SECRET);
      req.user = { id: verified.id, name: verified.name, email: verified.email, role: "agent" };
      return next();
    } catch (err) {
      return res.status(401).json({ error: "Agent session expired. Please log in again." });
    }
  }

  // Otherwise verify as Supabase token
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    req.user = { id: data.user.id, email: data.user.email, role: "authenticated" };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Authentication failed. Please log in again." });
  }
};
