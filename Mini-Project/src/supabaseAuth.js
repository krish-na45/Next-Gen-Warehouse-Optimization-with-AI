import { supabase } from './supabase'

// Sign up with email and password
export const signup = async (email, password, displayName, companyName) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
          company_name: companyName
        }
      }
    })

    if (authError) throw authError

    // Store session token for backend API
    if (authData.user) {
      // Get valid session
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session) {
        localStorage.setItem('token', sessionData.session.access_token)
      }

      // Create user profile record in database
      try {
        await createUserProfile(authData.user.id, email, displayName, companyName)
      } catch (profileErr) {
        console.warn('Profile creation note:', profileErr.message)
      }
    }

    return authData
  } catch (err) {
    throw new Error(err.message || 'Signup failed')
  }
}

// Login with email and password
export const login = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Store session token for backend API
    if (data.session) {
      localStorage.setItem('token', data.session.access_token)
      localStorage.setItem('user_id', data.user.id)
      localStorage.setItem('user_email', data.user.email)
    }

    return data
  } catch (err) {
    throw new Error(err.message || 'Login failed')
  }
}

// Create user profile in users table
export const createUserProfile = async (userId, email, displayName, companyName) => {
  try {
    const { error } = await supabase.from('users').insert({
      id: userId,
      email,
      display_name: displayName,
      company_name: companyName,
      created_at: new Date().toISOString()
    })

    if (error) throw error
  } catch (err) {
    // Table might not exist yet, that's okay
    console.warn('Could not create profile:', err.message)
  }
}

// Logout
export const logout = async () => {
  try {
    // Clear storage
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (err) {
    console.error('Logout error:', err)
  }
}

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  } catch (err) {
    return null
  }
}

// Get current session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  } catch (err) {
    return null
  }
}

// Listen to auth state changes
export const onAuthChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      localStorage.setItem('token', session.access_token)
      localStorage.setItem('user_id', session.user.id)
      localStorage.setItem('user_email', session.user.email)
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('user_email')
    }
    callback(event, session)
  })
}

// Update user profile
export const updateUserProfile = async (displayName) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    })
    if (error) throw error
    return data
  } catch (err) {
    throw new Error(err.message || 'Profile update failed')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY AGENT AUTHENTICATION (Role-Based Access Control)
// ─────────────────────────────────────────────────────────────────────────────

const AGENT_API = 'http://localhost:5000/api/agent'

/**
 * Agent login with email and password
 * Verifies user role is delivery_agent
 * Returns agent token and profile with role information
 */
export const agentLogin = async (email, password) => {
  try {
    const response = await fetch(`${AGENT_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      // Provide specific error messages based on status code
      if (response.status === 401) {
        throw new Error('Invalid email or password')
      } else if (response.status === 403) {
        throw new Error(data.error || 'User is not authorized as a delivery agent')
      } else if (response.status === 404) {
        throw new Error('User not found')
      } else {
        throw new Error(data.error || 'Login failed')
      }
    }

    // Store agent token and profile in localStorage
    if (data.token && data.agent) {
      localStorage.setItem('agent_token', data.token)
      localStorage.setItem('agent_id', data.agent.id)
      localStorage.setItem('agent_email', data.agent.email)
      localStorage.setItem('agent_name', data.agent.name)
      localStorage.setItem('agent_role', data.agent.role)
      localStorage.setItem('delivery_agent', JSON.stringify(data.agent))
    }

    return data
  } catch (err) {
    throw new Error(err.message || 'Agent login failed')
  }
}

/**
 * Verify delivery agent token
 * Returns current agent profile if token is valid
 */
export const verifyAgentToken = async (token) => {
  try {
    const response = await fetch(`${AGENT_API}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.')
      } else if (response.status === 403) {
        throw new Error('User is not a delivery agent')
      } else {
        throw new Error(data.error || 'Token verification failed')
      }
    }

    return data.agent
  } catch (err) {
    throw new Error(err.message || 'Token verification failed')
  }
}

/**
 * Get current agent from localStorage
 * Returns agent profile if token exists and is valid
 */
export const getCurrentAgent = async () => {
  try {
    const token = localStorage.getItem('agent_token')
    if (!token) return null

    const agent = await verifyAgentToken(token)
    return agent
  } catch (err) {
    // Token is invalid or expired, clear storage
    localStorage.removeItem('agent_token')
    localStorage.removeItem('agent_id')
    localStorage.removeItem('agent_email')
    localStorage.removeItem('agent_name')
    localStorage.removeItem('agent_role')
    localStorage.removeItem('delivery_agent')
    return null
  }
}

/**
 * Agent logout
 * Clears all agent authentication data
 */
export const agentLogout = async () => {
  try {
    localStorage.removeItem('agent_token')
    localStorage.removeItem('agent_id')
    localStorage.removeItem('agent_email')
    localStorage.removeItem('agent_name')
    localStorage.removeItem('agent_role')
    localStorage.removeItem('delivery_agent')
  } catch (err) {
    console.error('Agent logout error:', err)
  }
}

/**
 * Verify if email belongs to a delivery agent
 * Used for role checking before login
 */
export const verifyAgentRole = async (email) => {
  try {
    const response = await fetch(`${AGENT_API}/verify-role/${encodeURIComponent(email)}`)
    const data = await response.json()

    if (!response.ok) {
      return { isDeliveryAgent: false, error: data.error }
    }

    return {
      isDeliveryAgent: data.isDeliveryAgent,
      role: data.role,
      email: data.email
    }
  } catch (err) {
    return { isDeliveryAgent: false, error: err.message }
  }
}

// Request password reset email
export const requestPasswordReset = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    return { success: true }
  } catch (err) {
    throw new Error(err.message || 'Password reset request failed')
  }
}

// Update password with reset token
export const resetPassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
    return { success: true }
  } catch (err) {
    throw new Error(err.message || 'Password reset failed')
  }
}

// Verify password reset token
export const verifyPasswordResetToken = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (data.session) {
      localStorage.setItem('token', data.session.access_token)
      return { valid: true, user: data.session.user }
    }
    return { valid: false }
  } catch (err) {
    return { valid: false, error: err.message }
  }
}
