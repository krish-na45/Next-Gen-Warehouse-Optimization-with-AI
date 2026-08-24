import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { requestPasswordReset } from '../supabaseAuth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!email) {
        setError('Please enter your email address')
        return
      }

      await requestPasswordReset(email)
      
      setSuccess(`Password reset link sent to ${email}! 
      
Please check your email (including spam folder) for the reset link. 
The link will redirect you to reset your password.`)
      
      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login')
      }, 5000)
    } catch (err) {
      console.error('Reset error:', err)
      
      if (err.message.includes('invalid_email')) {
        setError('Invalid email address')
      } else if (err.message.includes('rate_limit')) {
        setError('Too many requests. Please try again in a few minutes.')
      } else {
        setError(err.message || 'Failed to send reset link')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-icon">🔐</span>
        <h1 className="login-title">Reset Password</h1>
        <p className="login-sub">Enter your email to receive a reset link</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            className="login-input"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}
          
          <button className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <p className="login-toggle">
          Remember your password?{' '}
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
