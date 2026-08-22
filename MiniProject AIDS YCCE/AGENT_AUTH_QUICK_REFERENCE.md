# 🚀 Quick Reference Card - Delivery Agent Auth

## ⚡ 30-Second Setup

```bash
# Terminal 1: Backend
cd backend && npm run dev
# Wait for: ✅  Agent accounts seeded (3 delivery agents ready)

# Terminal 2: Frontend (should already be running)
# Already on: http://localhost:5173

# Browser 3: Test Login
http://localhost:5173/route-optimization/agent/login
# Email: amit@warehouse.com
# Password: agent123
# Click: Sign In
```

---

## 🎯 Demo Accounts (All with password: `agent123`)

| Email | Name | Status |
|-------|------|--------|
| `amit@warehouse.com` | Amit Kumar | ✅ Ready |
| `rahul@warehouse.com` | Rahul Sharma | ✅ Ready |
| `neha@warehouse.com` | Neha Patel | ✅ Ready |

---

## 📍 Key URLs

| Purpose | URL |
|---------|-----|
| Agent Login | `http://localhost:5173/route-optimization/agent/login` |
| Agent Dashboard | `http://localhost:5173/route-optimization/agent/dashboard` |
| Backend API | `http://localhost:5000/api/agent` |

---

## 🔧 Backend Endpoints

```
POST   /api/agent/login              → Get JWT token
GET    /api/agent/me                 → Verify token & get profile
GET    /api/agent/list               → All agents
GET    /api/agent/verify-role/:email → Check if agent
POST   /api/agent/status             → Save status
GET    /api/agent/status/:id         → Get status
```

---

## 📦 Frontend Functions (supabaseAuth.js)

```javascript
import {
  agentLogin,          // Login & get token
  verifyAgentToken,    // Verify JWT
  getCurrentAgent,     // Get from localStorage
  agentLogout,         // Clear all data
  verifyAgentRole      // Check if agent
} from '../supabaseAuth'
```

---

## 💾 localStorage Keys

```javascript
agent_token       // JWT token
agent_id          // Unique agent ID
agent_email       // Agent email
agent_name        // Agent name
agent_role        // "delivery_agent"
delivery_agent    // Full agent object JSON
```

---

## ❌ Common Errors & Fixes

| Error | Fix |
|-------|-----|
| **401 Unauthorized** | Restart backend: `npm run dev` |
| **Cannot connect** | Backend not running on :5000 |
| **Wrong credentials** | Use: amit@warehouse.com / agent123 |
| **Token undefined** | Log in again |
| **Dashboard 404** | Check URL spelling |
| **No agents showing** | Wait for startup message in terminal |

---

## 🧪 Test Flow

```
1. Go to Agent Login page
2. Enter: amit@warehouse.com / agent123
3. Click: Sign In
4. Expected: Dashboard loads with delivery assignment
5. Check: F12 → Storage → localStorage → agent_token exists
6. Test: F5 (refresh) → dashboard stays logged in
7. Test: Click Logout → redirects to login, localStorage cleared
```

---

## 🔍 DevTools Verification (F12)

### Console (Check for errors)
```
No errors about 401, Cannot connect, or undefined
```

### Network Tab (Check requests)
```
POST /api/agent/login → Status: 200 ✅
GET  /api/agent/me   → Status: 200 ✅
```

### Storage → localStorage
```
agent_token:      (should have long JWT)
agent_email:      amit@warehouse.com
agent_role:       delivery_agent
```

---

## 💡 Quick Debugging

```bash
# Check if backend is running
curl http://localhost:5000/api/agent/list

# Check if agents are seeded
# (Look for console output when backend starts)

# Test login directly
curl -X POST http://localhost:5000/api/agent/login \
  -H "Content-Type: application/json" \
  -d '{"email":"amit@warehouse.com","password":"agent123"}'

# Expected response:
# {
#   "token": "eyJhbGc...",
#   "agent": { "id": "agent_001", "role": "delivery_agent", ... }
# }
```

---

## 📋 Pre-Testing Checklist

- [ ] Backend running (`npm run dev` in backend folder)
- [ ] Startup shows "✅ Agent accounts seeded"
- [ ] Frontend running on :5173
- [ ] No errors in browser console (F12)
- [ ] Can navigate to login page
- [ ] Demo credentials displayed on login page

---

## 🎯 Test Scenarios

### Scenario 1: Login Success
```
Input:    amit@warehouse.com / agent123
Expected: Dashboard with "Amit Kumar" 
Status:   ✅ PASS / ❌ FAIL
```

### Scenario 2: Wrong Password
```
Input:    amit@warehouse.com / wrong123
Expected: Error message, stay on login
Status:   ✅ PASS / ❌ FAIL
```

### Scenario 3: Page Refresh
```
Steps:    Login → Press F5
Expected: Dashboard still visible
Status:   ✅ PASS / ❌ FAIL
```

### Scenario 4: Logout
```
Steps:    Click Logout
Expected: Redirected to login, localStorage empty
Status:   ✅ PASS / ❌ FAIL
```

---

## 📞 Need Help?

1. **Check backend console** for error messages
2. **Check browser DevTools (F12)** for network errors
3. **Restart backend** if 401 persists
4. **Clear browser cache** (Ctrl+Shift+Delete)
5. **Verify port 5000** is not used by other app

---

## 📁 Important Files

- Frontend Auth: `/src/supabaseAuth.js`
- Login Page: `/src/pages/AgentLogin.jsx`
- Dashboard: `/src/pages/AgentDashboard.jsx`
- Backend Routes: `/backend/routes/agentAuth.js`
- Full Docs: `/DELIVERY_AGENT_AUTH_README.md`
- Setup Guide: `/DELIVERY_AGENT_AUTH_SETUP_GUIDE.md`

---

## ✅ Success Indicators

✅ Login page loads  
✅ Demo credentials work  
✅ Dashboard displays agent assignment  
✅ localStorage has agent_token  
✅ Page refresh maintains login  
✅ Logout clears everything  
✅ Invalid password shows error  
✅ F12 Network tab shows 200 responses  

---

**Status**: ✅ Implementation Complete  
**Next Step**: Restart backend & test login  
**Time to Success**: ~5 minutes
