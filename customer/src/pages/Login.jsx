import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../config/api';
import { useToast } from '../components/ToastProvider';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Login() {
    const { toast } = useToast();
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const googleButtonRef = useRef(null);

    useEffect(() => {
        if (mode !== 'login' || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return;
        let cancelled = false;
        const renderGoogle = () => {
            if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
            googleButtonRef.current.innerHTML = '';
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async ({ credential }) => {
                    setLoading(true);
                    try {
                        const res = await fetch(apiUrl('auth/user-login.php'), {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                            body: JSON.stringify({ type: 'google', token: credential }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok || !data.success) throw new Error(data.message || 'Google sign-in failed.');
                        toast.success('Signed in with Google.');
                        window.location.replace('/account');
                    } catch (err) { toast.error(err.message || 'Google sign-in failed.'); }
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
    }, [mode, toast]);

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const endpoint = mode === 'login' ? 'auth/user-login.php' : 'auth/user-register.php';
            const body = mode === 'login'
                ? { type: 'email', email: email.trim().toLowerCase(), password }
                : { email: email.trim().toLowerCase(), password, first_name: firstName.trim(), last_name: lastName.trim() };
            const res = await fetch(apiUrl(endpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) throw new Error(data.message || 'Unable to continue.');
            toast.success(mode === 'login' ? 'Signed in successfully.' : 'Account created successfully.');
            window.location.replace('/account');
        } catch (err) { toast.error(err.message || 'Unable to continue.'); }
        finally { setLoading(false); }
    };

    const switchMode = nextMode => { setMode(nextMode); setPassword(''); };

    return (
        <main className="ara-login-page">
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
                {mode === 'login' && <><div className="ara-login-divider"><span /><b>OR</b><span /></div><div className="ara-google-button" ref={googleButtonRef}>{!GOOGLE_CLIENT_ID && <span className="ara-login-message">Google sign-in needs your Google OAuth client ID.</span>}</div></>}
                <div className="ara-login-switch">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}<button type="button" onClick={()=>switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? ' Create one' : ' Sign in'}</button></div>
                <div className="ara-login-footer"><span>ARAmane Arts</span><i>•</i><span>Heritage paintings</span></div>
            </section>
        </main>
    );
}