# 🗄️ SUPABASE SETUP — Warehouse AI

This document covers the Supabase configuration used for authentication and optional database tables.

---

## Project Details

```
Project URL : https://lhgbcylukzflobaipegm.supabase.co
Region      : (auto-assigned)
Auth        : Email + Password (enabled)
```

---

## What Supabase Handles

| Feature | Status | Notes |
|---------|--------|-------|
| User registration | ✅ Active | Email + password |
| Email confirmation | ✅ Active | Confirmation email sent on signup |
| User login | ✅ Active | Returns JWT access token |
| Session management | ✅ Active | Token stored in localStorage |
| Password reset | ✅ Active | Email link to `/reset-password` |
| Users table (profiles) | ⚠️ Optional | See SQL below |
| Operations log | ⚠️ Optional | See SQL below |

---

## Auth Configuration (Supabase Dashboard)

Go to: **Supabase Console → Authentication → Providers → Email**

Settings used:
```
Enable Email Provider    : ON
Confirm Email            : ON
Secure Email Change      : ON
Minimum Password Length  : 6
```

---

## Email Templates

Go to: **Supabase Console → Authentication → Email Templates**

### Confirmation Email
Subject: `Confirm your Warehouse AI account`

The default template works fine. Optionally customize:
```html
<h2>Welcome to Warehouse AI</h2>
<p>Click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

### Password Reset Email
Subject: `Reset your Warehouse AI password`

```html
<h2>Password Reset</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

---

## Redirect URLs (Supabase Dashboard)

Go to: **Supabase Console → Authentication → URL Configuration**

Add these to **Redirect URLs**:
```
http://localhost:5173
http://localhost:5173/reset-password
http://localhost:5174
http://localhost:5174/reset-password
```

---

## Optional: Users Table

Run this SQL in **Supabase Console → SQL Editor** to store user profiles:

```sql
-- Create users profile table
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

## Optional: Operations Log Table

Track prediction history:

```sql
-- Create operations log table
CREATE TABLE IF NOT EXISTS public.operations_log (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operation     TEXT NOT NULL,       -- 'predict_demand', 'optimize_route', etc.
  input_data    JSONB,
  result_data   JSONB,
  engine_used   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.operations_log ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own logs
CREATE POLICY "Users can view own logs"
  ON public.operations_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.operations_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Supabase Client Configuration

`Mini-Project/src/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lhgbcylukzflobaipegm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Auth Functions Reference

All functions are in `Mini-Project/src/supabaseAuth.js`:

| Function | Description |
|----------|-------------|
| `login(email, password)` | Sign in, stores token in localStorage |
| `signup(email, password, displayName)` | Register new user |
| `logout()` | Sign out, clears localStorage |
| `getCurrentUser()` | Returns current Supabase user object |
| `getSession()` | Returns current session with token |
| `requestPasswordReset(email)` | Sends reset email |
| `resetPassword(newPassword)` | Updates password after reset |
| `updateUserProfile(displayName)` | Updates display name |
| `onAuthChange(callback)` | Listens to auth state changes |

---

## Token Flow

```
Supabase login
    ↓
Returns: session.access_token (JWT, ~1 hour expiry)
    ↓
Stored: localStorage.setItem('token', access_token)
    ↓
Sent with every API call:
    Authorization: Bearer <access_token>
    ↓
backend/middleware/auth.js:
    - Tries jwt.verify() with local JWT_SECRET
    - If fails, checks if it's a valid JWT format (Supabase token)
    - Decodes and allows through
    ↓
Request proceeds
```

---

## Troubleshooting Auth

| Issue | Cause | Fix |
|-------|-------|-----|
| "Email not confirmed" | Email confirmation required | Check inbox, click confirmation link |
| "Invalid login credentials" | Wrong email/password | Double-check credentials |
| "Too many requests" | Rate limit hit | Wait a few minutes |
| Token expired (401) | Supabase token ~1hr | Log out and log back in |
| Redirect not working | URL not in allowed list | Add URL to Supabase redirect URLs |
