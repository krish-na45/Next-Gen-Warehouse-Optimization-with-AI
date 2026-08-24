import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { resetPassword, verifyPasswordResetToken } from '../supabaseAuth'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [valid, setValid] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Verify that user has valid reset token
    const verifyToken = async () => {
      try {
        const result = await verifyPasswordResetToken()
        if (result.valid) {
          setValid(true)
        } else {
          setError('Invalid or expired reset link. Please request a new one.')
          // Redirect to forgot password after 3 seconds
          setTimeout(() => {
            navigate('/forgot-password')
          }, 3000)
        }
      } catch (err) {
        setError('Error verifying reset link')
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validate passwords
      if (!password || !confirmPassword) {
        setError('Please enter your new password')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      // Reset password
      await resetPassword(password)
      
      setSuccess(`Password updated successfully! 

Redirecting to login...`)
      
      // Clear storage
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('user_email')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      console.error('Reset error:', err)
      
      if (err.message.includes('weak password')) {
        setError('Password is too weak. Use at least 6 characters.')
      } else if (err.message.includes('session')) {
        setError('Session expired. Please request a new reset link.')
      } else {
        setError(err.message || 'Failed to reset password')
      }
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="login-sub">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="login-error">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-icon">🔑</span>
        <h1 className="login-title">Create New Password</h1>
        <p className="login-sub">Enter your new password below</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            className="login-input"
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          
          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}
          
          <button className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <p className="login-toggle">
          Remember the password?{' '}
          <button 
            type="button"
            className="toggle-btn" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  )
}
