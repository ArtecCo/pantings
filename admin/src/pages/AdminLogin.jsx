import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../config/api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const clearMessages = () => { setMessage(''); setError('') }

  const handleLogin = async (e) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    try {
      const response = await fetch(apiUrl('auth/login.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to sign in.')
      if (data.requires_otp) {
        setStep('otp')
        setMessage(data.message || 'A verification code has been sent to your registered email.')
      } else if (data.authenticated) {
        navigate('/', { replace: true })
      } else {
        throw new Error('Administrator authentication could not be completed.')
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    clearMessages()
    if (otp.length !== 6) { setError('Enter the 6-digit verification code.'); return }
    setLoading(true)
    try {
      const response = await fetch(apiUrl('auth/verify-otp.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otp })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) throw new Error(data.message || 'Invalid verification code.')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to verify the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="ara-login-page">
      <section className="ara-login-shell">
        <div className="ara-login-brand"><div className="ara-login-mark">A</div><div><div className="ara-login-brand-name">ARAmane Arts</div><div className="ara-login-brand-subtitle">Heritage Paintings</div></div></div>
        <div className="ara-login-divider"><span /><b>✦</b><span /></div>
        <div className="ara-login-heading"><p className="ara-login-eyebrow">ADMINISTRATION</p><h1>{step === 'credentials' ? 'Welcome back' : 'Verify your identity'}</h1><p>{step === 'credentials' ? 'Sign in to manage the ARAmane Arts collection.' : 'Enter the verification code sent to your registered email address.'}</p></div>
        {step === 'credentials' ? (
          <form className="ara-login-form" onSubmit={handleLogin}>
            <label><span>Email address</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="username" required /></label>
            <label><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></label>
            <button className="ara-login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}{!loading && <span>→</span>}</button>
          </form>
        ) : (
          <form className="ara-login-form" onSubmit={handleVerifyOtp}>
            <label><span>Verification code</span><input className="ara-otp-input" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" autoComplete="one-time-code" autoFocus required /></label>
            <button className="ara-login-submit" type="submit" disabled={loading}>{loading ? 'Verifying…' : 'Verify & continue'}{!loading && <span>→</span>}</button>
            <button className="ara-login-back" type="button" onClick={() => { clearMessages(); setOtp(''); setStep('credentials') }}>← Back to sign in</button>
          </form>
        )}
        {message && <div className="ara-login-message">{message}</div>}
        {error && <div className="ara-login-error">{error}</div>}
        <div className="ara-login-footer"><span>ARAmane Arts</span><i>•</i><span>Private administration</span></div>
      </section>
    </main>
  )
}
