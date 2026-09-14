import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../config/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Login() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const googleButtonRef = useRef(null);

    const clearMessages = () => { setError(''); setMessage(''); };

    useEffect(() => {
        if (mode !== 'login' || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
        let cancelled = false;
        const renderGoogle = () => {
            if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
            googleButtonRef.current.innerHTML = '';
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async ({ credential }) => {
                    clearMessages(); setLoading(true);
                    try {
                        const res = await fetch(apiUrl('auth/user-login.php'), {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                            body: JSON.stringify({ type: 'google', token: credential }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok || !data.success) throw new Error(data.message || 'Google sign-in failed.');
                        window.location.replace('/account');
                    } catch (err) { setError(err.message || 'Google sign-in failed.'); }
                    finally { setLoading(false); }
                },
            });
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                type: 'standard', theme: 'outline', size: 'large', width: 372, text: 'continue_with', shape: 'rectangular',
            });
        };
        if (window.google?.accounts?.id) renderGoogle();
        else {
            const existing = document.querySelector('script[data-google-gsi]');
            if (existing) existing.addEventListener('load', renderGoogle, { once: true });
            else {
                const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client';
                script.async = true; script.defer = true; script.dataset.googleGsi = 'true';
                script.addEventListener('load', renderGoogle, { once: true }); document.head.appendChild(script);
            }
        }
        return () => { cancelled = true; };
    }, [mode]);

    const handleSubmit = async (e) => {
        e.preventDefault(); clearMessages(); setLoading(true);
        try {
            const endpoint = mode === 'login' ? 'auth/user-login.php' : 'auth/user-register.php';
            const body = mode === 'login'
                ? { type: 'email', email: email.trim().toLowerCase(), password }
                : { email: email.trim().toLowerCase(), password, first_name: firstName.trim(), last_name: lastName.trim() };
            const res = await fetch(apiUrl(endpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) throw new Error(data.message || 'Unable to continue.');
            window.location.replace('/account');
        } catch (err) { setError(err.message || 'Unable to continue.'); }
        finally { setLoading(false); }
    };

    const switchMode = nextMode => { clearMessages(); setMode(nextMode); setPassword(''); };

    return (
        <main className="ara-login-page">
            <style>{`.ara-login-page{min-height:calc(100vh - 82px);display:grid;place-items:center;padding:60px 20px;background:radial-gradient(circle at 50% 20%,rgba(212,175,55,.08),transparent 35%),var(--ivory)}.ara-login-shell{width:min(460px,100%);padding:40px;background:var(--paper);border:1px solid var(--gold);box-shadow:0 18px 55px rgba(44,24,16,.09)}.ara-login-brand{display:flex;flex-direction:column;align-items:center;line-height:1}.ara-login-brand .ara-brand-small{margin-bottom:6px}.ara-login-brand .ara-brand-name{font-size:30px}.ara-login-divider{display:flex;align-items:center;gap:12px;margin:24px 0}.ara-login-divider span{flex:1;height:1px;background:var(--border)}.ara-login-divider b{color:var(--gold);font-size:11px}.ara-login-heading{text-align:center;margin-bottom:26px}.ara-login-eyebrow{margin:0 0 7px;color:var(--muted);font-size:9px;letter-spacing:2px}.ara-login-heading h1{margin:0;color:var(--maroon);font:600 35px 'Cormorant Garamond',serif}.ara-login-heading p:last-child{color:var(--muted);font-size:12px;line-height:1.6}.ara-login-form{display:flex;flex-direction:column;gap:16px}.ara-login-form label{display:flex;flex-direction:column;gap:6px}.ara-login-form label span{color:#4c352d;font-size:10px;font-weight:600}.ara-login-form input{width:100%;padding:12px;border:1px solid #d9cbbb;outline:none;background:var(--paper);color:var(--brown);font:13px inherit}.ara-login-form input:focus{border-color:var(--gold);box-shadow:0 0 0 2px rgba(212,175,55,.08)}.ara-login-name-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ara-login-submit{min-height:47px;width:100%;border:1px solid var(--gold);cursor:pointer;font:11px inherit;background:var(--maroon);color:var(--ivory)}.ara-login-submit:disabled{opacity:.55;cursor:not-allowed}.ara-google-button{min-height:47px;display:flex;justify-content:center;align-items:center}.ara-login-message,.ara-login-error{margin-top:15px;padding:10px;text-align:center;font-size:11px}.ara-login-message{color:var(--maroon);background:rgba(212,175,55,.08)}.ara-login-error{color:var(--maroon);background:rgba(91,18,23,.05)}.ara-login-switch{text-align:center;margin-top:20px;color:var(--muted);font-size:11px}.ara-login-switch button{border:0;background:none;color:var(--maroon);cursor:pointer;font:600 11px inherit}.ara-login-footer{display:flex;justify-content:center;gap:10px;margin-top:25px;padding-top:16px;border-top:1px solid var(--border);color:var(--muted);font-size:9px;text-transform:uppercase}@media(max-width:600px){.ara-login-page{min-height:calc(100vh - 70px);padding:30px 15px}.ara-login-shell{padding:30px 20px}.ara-login-name-grid{grid-template-columns:1fr}}`}</style>
            <section className="ara-login-shell">
                <div className="ara-login-brand"><span className="ara-brand-small">THE HOUSE OF</span><span className="ara-brand-name">ARAmane Arts</span></div>
                <div className="ara-login-divider"><span /><b>✦</b><span /></div>
                <div className="ara-login-heading"><p className="ara-login-eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN ARAMANE ARTS'}</p><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p>{mode === 'login' ? 'Sign in to track your orders and manage your account.' : 'Create an account to save your details and track your orders.'}</p></div>
                <form className="ara-login-form" onSubmit={handleSubmit}>
                    {mode === 'register' && <div className="ara-login-name-grid"><label><span>First name</span><input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" autoComplete="given-name" required /></label><label><span>Last name</span><input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" autoComplete="family-name" /></label></div>}
                    <label><span>Email address</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
                    <label><span>Password</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required /></label>
                    <button className="ara-login-submit" type="submit" disabled={loading}>{loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign in' : 'Create account')}</button>
                </form>
                {mode === 'login' && <><div className="ara-login-divider"><span /><b>OR</b><span /></div>{GOOGLE_CLIENT_ID ? <div className="ara-google-button" ref={googleButtonRef} /> : <div className="ara-login-message">Google sign-in needs your Google OAuth client ID.</div>}</>}
                {message && <div className="ara-login-message">{message}</div>}{error && <div className="ara-login-error">{error}</div>}
                <div className="ara-login-switch">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}<button type="button" onClick={()=>switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? ' Create one' : ' Sign in'}</button></div>
                <div className="ara-login-footer"><span>ARAmane Arts</span><i>•</i><span>Heritage paintings</span></div>
            </section>
        </main>
    );
}