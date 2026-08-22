# Delivery Agent Authentication System

## Overview
A complete role-based delivery agent authentication system integrated with the existing backend using JWT tokens and in-memory agent storage.

## Architecture

### Frontend Components
- **AgentLogin.jsx**: Delivery agent login page
- **AgentDashboard.jsx**: Protected dashboard for authenticated agents
- **supabaseAuth.js**: Authentication utility functions with agent-specific methods

### Backend Routes
- **agentAuth.js**: Agent authentication endpoints
- **server.js**: Main server configuration

## Features Implemented

### 1. Role-Based Access Control
- **Role**: `delivery_agent`
- Agents verified on login and token verification
- Unauthorized users rejected with specific error messages

### 2. Authentication System
- **Method**: JWT tokens (24-hour expiration)
- **Storage**: localStorage (persists across page refreshes)
- **Backend Verification**: Token validated on dashboard load

### 3. Demo Agent Accounts
```
Email: amit@warehouse.com | Password: agent123 | Role: delivery_agent
Email: rahul@warehouse.com | Password: agent123 | Role: delivery_agent
Email: neha@warehouse.com | Password: agent123 | Role: delivery_agent
```

### 4. Error Handling
| Error | Status | Message |
|-------|--------|---------|
| Invalid credentials | 401 | "Invalid email or password" |
| Wrong role | 403 | "User role is not authorized for delivery operations" |
| Token expired | 401 | "Session expired. Please log in again" |
| Missing token | 401 | "No token provided" |

### 5. Session Persistence
- Tokens stored in localStorage
- Session automatically restored on page refresh
- Automatic logout on token expiration
- Failed verification redirects to login page

## API Endpoints

### Authentication Endpoints

#### POST `/api/agent/login`
Login with email and password.
```bash
curl -X POST http://localhost:5000/api/agent/login \
  -H "Content-Type: application/json" \
  -d '{"email":"amit@warehouse.com","password":"agent123"}'
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "agent": {
    "id": "agent_001",
    "name": "Amit Kumar",
    "email": "amit@warehouse.com",
    "phone": "+91 98765 43210",
    "role": "delivery_agent"
  }
}
```

#### GET `/api/agent/me`
Verify token and get current agent profile.
```bash
curl -X GET http://localhost:5000/api/agent/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### GET `/api/agent/list`
List all delivery agents.
```bash
curl http://localhost:5000/api/agent/list
```

#### GET `/api/agent/verify-role/:email`
Check if user is a delivery agent.
```bash
curl http://localhost:5000/api/agent/verify-role/amit@warehouse.com
```

#### POST `/api/agent/status`
Save delivery status for agent.
```bash
curl -X POST http://localhost:5000/api/agent/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"agent_id":"agent_001","status":"In Progress"}'
```

## Frontend Usage

### Login Function
```javascript
import { agentLogin } from '../supabaseAuth'

try {
  const result = await agentLogin(email, password)
  // { token, agent: { id, name, email, phone, role } }
} catch (err) {
  console.error(err.message)
}
```

### Verify Token
```javascript
import { verifyAgentToken } from '../supabaseAuth'

try {
  const agent = await verifyAgentToken(token)
  // { id, name, email, phone, role }
} catch (err) {
  console.error(err.message)
}
```

### Get Current Agent
```javascript
import { getCurrentAgent } from '../supabaseAuth'

const agent = await getCurrentAgent()
// Returns agent if token is valid, null if expired
```

### Logout
```javascript
import { agentLogout } from '../supabaseAuth'

await agentLogout()
// Clears all agent auth data from localStorage
```

## Local Storage Keys

| Key | Purpose | Example |
|-----|---------|---------|
| `agent_token` | JWT token | "eyJhbGciOiJIUzI1NiIs..." |
| `agent_id` | Agent ID | "agent_001" |
| `agent_email` | Agent email | "amit@warehouse.com" |
| `agent_name` | Agent name | "Amit Kumar" |
| `agent_role` | Agent role | "delivery_agent" |
| `delivery_agent` | Full agent JSON | `{...}` |

## Authentication Flow

### Login Flow
```
1. User enters email & password
2. Frontend calls POST /api/agent/login
3. Backend validates credentials
4. Backend verifies agent role is "delivery_agent"
5. Backend generates JWT token
6. Frontend stores token in localStorage
7. Frontend redirects to dashboard
```

### Dashboard Access Flow
```
1. AgentDashboard component mounts
2. Reads token from localStorage
3. Calls GET /api/agent/me to verify token
4. Backend verifies JWT and role
5. Backend returns agent profile
6. Dashboard loads agent-specific assignment
7. Status is synced with backend
```

### Logout Flow
```
1. User clicks Logout button
2. Frontend calls agentLogout()
3. All localStorage auth data cleared
4. Redirect to login page
5. User must log in again
```

## Configuration

### Environment Variables (Optional)
In `backend/.env`:
```
AGENT_JWT_SECRET=your_secret_key_here
```

**Default**: `agent_secret_key` (if not set)

## Security Features

✅ **Password Hashing**: bcryptjs (10 rounds)  
✅ **Token Validation**: JWT signature verification  
✅ **Role Verification**: All endpoints check `role === "delivery_agent"`  
✅ **Token Expiration**: 24-hour expiration  
✅ **Secure Headers**: Authorization Bearer token pattern  
✅ **Input Validation**: Email and password required  

## Database Structure (In-Memory)

### Agents Table
```javascript
{
  id: "agent_001",
  name: "Amit Kumar",
  email: "amit@warehouse.com",
  phone: "+91 98765 43210",
  role: "delivery_agent",
  password: "$2a$10$..." // hashed
}
```

### Agent Status Store
```javascript
{
  "agent_001": "Not Started",
  "agent_002": "In Progress",
  "agent_003": "Delivered"
}
```

## Testing

### Test Login with Valid Credentials
```
Email: amit@warehouse.com
Password: agent123
Expected: Redirect to dashboard with agent profile loaded
```

### Test Login with Invalid Password
```
Email: amit@warehouse.com
Password: wrong_password
Expected: Error - "Invalid email or password"
```

### Test Login with Non-Agent Role
```
(Currently all demo users have delivery_agent role)
Expected: Error - "User role is not authorized"
```

### Test Token Persistence
```
1. Log in as amit@warehouse.com
2. Navigate to dashboard
3. Refresh page
4. Expected: Dashboard loads without re-login
```

### Test Token Expiration
```
(Wait 24 hours or manually modify token)
Expected: Redirect to login with error
```

## Backend Setup

### 1. Ensure Dependencies Installed
```bash
cd backend
npm install bcryptjs jsonwebtoken express
```

### 2. Start Backend Server
```bash
npm run dev
```

Expected output:
```
✅  Agent accounts seeded (3 delivery agents ready)
   - amit@warehouse.com (password: agent123)
   - rahul@warehouse.com (password: agent123)
   - neha@warehouse.com (password: agent123)
Server running on port 5000
```

### 3. Verify Routes Registered
```bash
curl http://localhost:5000/api/agent/list
```

Expected response: Array of agent objects

## Frontend Setup

### 1. Ensure Routes Configured
Check `App.jsx` includes:
```javascript
<Route path="/route-optimization/agent/login" element={<AgentLogin />} />
<Route path="/route-optimization/agent/dashboard" element={<AgentDashboard />} />
```

### 2. Start Frontend Dev Server
```bash
npm run dev
```

### 3. Navigate to Login Page
```
http://localhost:5173/route-optimization/agent/login
```

## Future Enhancements

- [ ] Persistent database storage (PostgreSQL/Supabase)
- [ ] Email verification during signup
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] Agent performance tracking
- [ ] Real-time delivery notifications
- [ ] Admin panel for agent management
- [ ] Integration with payment systems

## Files Modified

### Frontend
- `src/supabaseAuth.js` - Added agent auth functions
- `src/pages/AgentLogin.jsx` - Updated login logic with role verification
- `src/pages/AgentDashboard.jsx` - Added role verification on load

### Backend
- `routes/agentAuth.js` - Complete role-based implementation
- `server.js` - Already configured with agent routes

## Troubleshooting

### Issue: Login returns "Cannot connect to server"
**Solution**: Ensure backend is running on port 5000
```bash
cd backend && npm run dev
```

### Issue: Login returns "Invalid email or password"
**Solution**: 
1. Verify agent exists in backend seeding
2. Check password is exactly "agent123"
3. Restart backend to re-seed agents

### Issue: Dashboard shows "Session expired"
**Solution**: Token expired after 24 hours
- Log in again
- Or request new token before expiration

### Issue: localStorage shows but dashboard redirects to login
**Solution**: Token verification failed
- Clear localStorage
- Log in again
- Check backend `/api/agent/me` endpoint is accessible

## Support

For issues or questions:
1. Check browser console for error messages
2. Check backend server logs
3. Verify all endpoints are accessible
4. Ensure token format is correct in localStorage
