import { useState } from 'react'
import './Contact.css'

const API = 'http://localhost:5000/api'

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [serverError, setServerError] = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    // Clear field error as user types
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    }
  }

  // Client-side validation — returns true if all fields are valid
  const validate = () => {
    const newErrors = {}
    if (!form.name.trim() || form.name.trim().length < 2)
      newErrors.name = 'Name must be at least 2 characters.'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Please enter a valid email address.'
    if (!form.subject.trim() || form.subject.trim().length < 3)
      newErrors.subject = 'Subject must be at least 3 characters.'
    if (!form.message.trim() || form.message.trim().length < 10)
      newErrors.message = 'Message must be at least 10 characters.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    setServerError('')

    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch(`${API}/contact`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSuccess(data.message)
      setForm({ name: '', email: '', subject: '', message: '' })
      setErrors({})
    } catch {
      setServerError('Cannot reach the server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm({ name: '', email: '', subject: '', message: '' })
    setErrors({})
    setSuccess('')
    setServerError('')
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <h1 className="page-title">Contact</h1>
          <p className="page-subtitle">
            Get in touch about the Next-Gen Warehouse Optimization project
          </p>
        </div>
      </section>

      <section className="contact-form-section">
        <div className="container">
          <form className="contact-form" onSubmit={handleSubmit} noValidate>

            {/* Success message */}
            {success && (
              <div className="contact-success">
                ✅ {success}
              </div>
            )}

            {/* Server error */}
            {serverError && (
              <div className="contact-error">
                ⚠️ {serverError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                name="subject"
                type="text"
                placeholder="What is this about?"
                value={form.subject}
                onChange={handleChange}
              />
              {errors.subject && <span className="field-error">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Your message..."
                rows={5}
                value={form.message}
                onChange={handleChange}
              />
              {errors.message && <span className="field-error">{errors.message}</span>}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending…' : 'Submit'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleReset}>
                Reset
              </button>
            </div>

          </form>
        </div>
      </section>
    </div>
  )
}
