import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiUrl } from '../config/api'
import './Login.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setMessage(''); setError('')
    if (!token) { setError('This password reset link is invalid.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('The passwords do not match.'); return }
    setLoading(true)
    try {
      const r = await fetch(apiUrl('auth/reset-password.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ token, password }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d.success) throw new Error(d.message || 'Unable to reset password.')
      setMessage(d.message || 'Your password has been reset. You can now sign in.')
      setPassword(''); setConfirm('')
    } catch (e) { setError(e.message || 'Unable to reset password.') } finally { setLoading(false) }
  }

  return <main className="ara-login-page"><section className="ara-login-shell">
    <div className="ara-login-brand"><span className="ara-brand-small">THE HOUSE OF</span><span className="ara-brand-name">ARAmane Arts</span></div>
    <div className="ara-login-divider"><span/><b>✦</b><span/></div>
    <div className="ara-login-heading"><p className="ara-login-eyebrow">ACCOUNT SECURITY</p><h1>Choose a new password</h1><p>Enter a new password for your ARAmane Arts account.</p></div>
    {!message && <form className="ara-login-form" onSubmit={submit}><label><span>New password</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} autoComplete="new-password" required /></label><label><span>Confirm new password</span><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={8} autoComplete="new-password" required /></label><button className="ara-login-submit" disabled={loading}>{loading?'Resetting…':'Reset password'}</button></form>}
    {message && <div className="ara-login-message">{message}</div>}{error && <div className="ara-login-error">{error}</div>}
    <div className="ara-login-switch"><Link to="/login">← Back to sign in</Link></div>
  </section></main>
}
