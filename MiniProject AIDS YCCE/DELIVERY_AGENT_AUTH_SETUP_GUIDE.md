# Delivery Agent Authentication - Quick Setup & Testing Guide

## ⚡ Quick Start

### Step 1: Restart Backend (CRITICAL)
The backend needs to be restarted to load the new authentication code and seed the demo agents.

```bash
# Terminal 1: Navigate to backend directory
cd backend

# Stop any running backend (Ctrl+C)
# Then restart with:
npm run dev

# Wait for this output (confirms agents are ready):
# ✅  Agent accounts seeded (3 delivery agents ready)
#    - amit@warehouse.com (password: agent123)
#    - rahul@warehouse.com (password: agent123)
#    - neha@warehouse.com (password: agent123)
# Server running on port 5000
```

### Step 2: Frontend Already Running
Frontend should already be running on `http://localhost:5173`

### Step 3: Navigate to Login Page
```
http://localhost:5173/route-optimization/agent/login
```

### Step 4: Test Login
Use any of these demo accounts:

| Email | Password | Status |
|-------|----------|--------|
| amit@warehouse.com | agent123 | ✅ Delivery Agent |
| rahul@warehouse.com | agent123 | ✅ Delivery Agent |
| neha@warehouse.com | agent123 | ✅ Delivery Agent |

---

## 🧪 Testing Scenarios

### Test 1: Successful Login
**Steps:**
1. Email: `amit@warehouse.com`
2. Password: `agent123`
3. Click "Sign In"

**Expected Result:**
- ✅ Redirects to dashboard
- ✅ Shows agent name "Amit Kumar"
- ✅ Displays delivery assignment (Order ORD-2024-001)
- ✅ localStorage has `agent_token`, `agent_id`, `agent_email`

**Verify in Browser DevTools (F12 → Storage → localStorage):**
```
agent_token:     (long JWT token starting with "eyJ...")
agent_id:        agent_001
agent_email:     amit@warehouse.com
agent_name:      Amit Kumar
agent_role:      delivery_agent
delivery_agent:  {"id":"agent_001",...}
```

---

### Test 2: Invalid Password
**Steps:**
1. Email: `amit@warehouse.com`
2. Password: `wrong_password`
3. Click "Sign In"

**Expected Result:**
- ❌ Shows error: "Invalid email or password. Please check your credentials."
- ❌ Stays on login page
- ❌ localStorage remains empty

---

### Test 3: Account Not Found
**Steps:**
1. Email: `unknown@warehouse.com`
2. Password: `agent123`
3. Click "Sign In"

**Expected Result:**
- ❌ Shows error: "Invalid email or password. Please check your credentials."
- ❌ Stays on login page

---

### Test 4: Session Persistence (Page Refresh)
**Steps:**
1. Log in successfully with amit@warehouse.com
2. Verify dashboard loads
3. Press F5 or Ctrl+R to refresh the page
4. Wait 2 seconds for page to stabilize

**Expected Result:**
- ✅ Dashboard loads immediately (no redirect to login)
- ✅ Agent name and assignment still visible
- ✅ token still in localStorage
- ❌ No "Verifying…" message after first time

---

### Test 5: Logout Functionality
**Steps:**
1. Log in successfully
2. Scroll down to find "Logout" button
3. Click "Logout"

**Expected Result:**
- ✅ Redirects to login page
- ✅ localStorage is completely cleared
- ✅ All agent_* keys removed from storage

**Verify localStorage is cleared (F12 → Storage → localStorage)**

---

### Test 6: Token Expiration (24-hour test)
**Manual Testing:** Can't wait 24 hours, but you can manually test by:
1. Log in successfully
2. Open DevTools (F12)
3. Go to Storage → localStorage
4. Edit `agent_token` value to something invalid like "invalid_token_123"
5. Refresh the page
6. Expected: Redirected to login with message about session expiring

---

## 🔍 Debugging

### Issue: "Cannot connect to server" or continuous 401 errors

**Checklist:**
1. ✅ Backend running on port 5000?
   ```bash
   # In another terminal:
   curl http://localhost:5000/api/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. ✅ Agents seeded in backend output?
   ```bash
   # Look for this when backend starts:
   # ✅  Agent accounts seeded (3 delivery agents ready)
   ```

3. ✅ Backend restarted after code changes?
   ```bash
   # Kill (Ctrl+C) and restart backend:
   npm run dev
   ```

4. ✅ Network tab shows POST to `/api/agent/login`?
   ```
   # F12 → Network tab → try login
   # Look for POST /agent/login
   # Check Response tab for error message
   ```

---

## 📊 Monitoring

### Check Backend Logs
```bash
# Terminal showing backend output should show:

# On startup (agent seeding):
✅  Agent accounts seeded (3 delivery agents ready)
   - amit@warehouse.com (password: agent123)
   - rahul@warehouse.com (password: agent123)
   - neha@warehouse.com (password: agent123)

# On login request:
POST /api/agent/login - user logs in

# On token verification:
GET /api/agent/me - dashboard verifies token
```

### Check Frontend Console
```javascript
// F12 → Console tab
// Should NOT show errors like:
// "Failed to load resource: 401"
// "Cannot reach server"
// "Invalid token"
```

### Check Network Requests
```javascript
// F12 → Network tab → Filter: "Fetch/XHR"
// Should show:
POST /agent/login         → Status 200 ✅
GET  /agent/me           → Status 200 ✅
GET  /data/stats         → Status 200 ✅
```

---

## 🎯 API Testing (cURL)

### Test Backend Directly

#### 1. List all agents
```bash
curl http://localhost:5000/api/agent/list
```

**Expected:**
```json
[
  {
    "id": "agent_001",
    "name": "Amit Kumar",
    "email": "amit@warehouse.com",
    "phone": "+91 98765 43210",
    "role": "delivery_agent"
  },
  ...
]
```

---

#### 2. Login and get token
```bash
curl -X POST http://localhost:5000/api/agent/login \
  -H "Content-Type: application/json" \
  -d '{"email":"amit@warehouse.com","password":"agent123"}'
```

**Expected:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "agent": {
    "id": "agent_001",
    "name": "Amit Kumar",
    "email": "amit@warehouse.com",
    "phone": "+91 98765 43210",
    "role": "delivery_agent"
  }
}
```

---

#### 3. Verify token
```bash
# Copy the token from previous response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/agent/me
```

**Expected:**
```json
{
  "agent": {
    "id": "agent_001",
    "name": "Amit Kumar",
    "email": "amit@warehouse.com",
    "phone": "+91 98765 43210",
    "role": "delivery_agent"
  }
}
```

---

## ✅ Verification Checklist

- [ ] Backend restarted with `npm run dev`
- [ ] Startup log shows "✅ Agent accounts seeded"
- [ ] Login page loads at `/route-optimization/agent/login`
- [ ] Demo credentials work (amit@warehouse.com / agent123)
- [ ] Dashboard displays delivery assignment
- [ ] localStorage shows agent_token
- [ ] Page refresh maintains login
- [ ] Logout clears localStorage
- [ ] Invalid password shows error
- [ ] F12 → Network shows POST /agent/login returns 200

---

## 📝 Expected Output

### Successful Login Flow
```
1. User enters amit@warehouse.com / agent123
2. Frontend POSTs to /api/agent/login
3. Backend verifies credentials
4. Backend verifies role = "delivery_agent"
5. Backend returns JWT token
6. Frontend stores token in localStorage
7. Frontend navigates to /route-optimization/agent/dashboard
8. Dashboard verifies token with /api/agent/me
9. Dashboard loads with agent assignment
```

### Dashboard Display
```
🚚 Delivery Agent Dashboard

Agent: Amit Kumar
Email: amit@warehouse.com
Phone: +91 98765 43210

Current Assignment:
├── Order ID: ORD-2024-001
├── Item: Industrial Conveyor Belt
├── Quantity: 2 units
├── Priority: High
├── Status: Not Started / In Progress / Delivered
├── From: Warehouse A – Nagpur Central
└── To: Vikram Industries (Plot 45, MIDC, Butibori, Nagpur)

Actions:
├── Update Status
├── View Map
├── Contact Customer
└── Logout
```

---

## 🚀 Next Steps After Verification

Once login is working:

1. **Test all three agents** - Try logging in as each agent
2. **Test status updates** - Change delivery status and verify it persists
3. **Test logout** - Confirm localStorage is cleared
4. **Test session management** - Refresh and verify persistence
5. **Review admin panel** - Check `/route-optimization/admin` to see live agents

---

## 📞 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Backend not restarted | `npm run dev` in backend folder |
| Cannot connect | Backend not running | Verify port 5000 in use: `lsof -i :5000` |
| Wrong credentials | Demo agents not seeded | Check backend startup output |
| Token undefined | localStorage cleared | Log in again |
| Dashboard redirects to login | Token expired | Log in again (24-hour expiration) |
| No map display | Google Maps API key missing | Map is optional, not required |

---

## 📚 Related Files

- **Frontend Auth**: `/src/supabaseAuth.js`
- **Login Page**: `/src/pages/AgentLogin.jsx`
- **Dashboard**: `/src/pages/AgentDashboard.jsx`
- **Backend Routes**: `/backend/routes/agentAuth.js`
- **Documentation**: `/DELIVERY_AGENT_AUTH_README.md`

---

## 💡 Tips

- Always check browser DevTools (F12) for errors
- Check backend terminal output for seeding confirmation
- localStorage can be inspected/edited in DevTools for testing
- Network tab shows all API calls and responses
- Clear browser cache if changes don't appear (Ctrl+Shift+Delete)
