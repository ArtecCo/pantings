import { useState } from 'react';

const API = 'http://localhost/paintings/api';

export default function Login() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const clearMessages = () => {
        setError('');
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearMessages();
        setLoading(true);

        try {
            const endpoint = mode === 'login' ? 'auth/user-login.php' : 'auth/user-register.php';
            const body = mode === 'login'
                ? { type: 'email', email: email.trim().toLowerCase(), password }
                : {
                    email: email.trim().toLowerCase(),
                    password,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                };

            const res = await fetch(`${API}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                throw new Error(data.message || (mode === 'login' ? 'Unable to sign in.' : 'Unable to create your account.'));
            }

            window.location.replace('/account');
        } catch (err) {
            setError(err.message || 'Unable to continue.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        clearMessages();
        setMessage('Google Sign-In setup is ready on the backend. Add your Google OAuth client ID to the customer environment configuration, then this button can be enabled.');
    };

    const switchMode = (nextMode) => {
        clearMessages();
        setMode(nextMode);
        setPassword('');
    };

    return (
        <main className="ara-login-page">
            <section className="ara-login-shell">
                <div className="ara-login-brand">
                    <div className="ara-login-mark">A</div>
                    <div>
                        <div className="ara-login-brand-name">ARAmane Arts</div>
                        <div className="ara-login-brand-subtitle">Heritage Paintings</div>
                    </div>
                </div>

                <div className="ara-login-divider">
                    <span /><b>✦</b><span />
                </div>

                <div className="ara-login-heading">
                    <p className="ara-login-eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN ARAMANE ARTS'}</p>
                    <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
                    <p>
                        {mode === 'login'
                            ? 'Sign in to track your orders and manage your account.'
                            : 'Create an account to save your details and track your orders.'}
                    </p>
                </div>

                <form className="ara-login-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="ara-login-name-grid">
                            <label>
                                <span>First name</span>
                                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" autoComplete="given-name" required />
                            </label>
                            <label>
                                <span>Last name</span>
                                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" autoComplete="family-name" />
                            </label>
                        </div>
                    )}

                    <label>
                        <span>Email address</span>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
                    </label>

                    <label>
                        <span>Password</span>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required />
                    </label>

                    <button className="ara-login-submit" type="submit" disabled={loading}>
                        {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign in' : 'Create account')}
                        {!loading && <span>→</span>}
                    </button>
                </form>

                <div className="ara-login-divider ara-login-or">
                    <span /><b>OR</b><span />
                </div>

                <button type="button" className="ara-google-button" onClick={handleGoogleLogin}>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12s3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.33 10 10.19 10 5.52 0 9.28-3.67 9.28-9.09 0-1.15-.15-1.81-.15-1.81Z" /></svg>
                    Continue with Google
                </button>

                {message && <div className="ara-login-message">{message}</div>}
                {error && <div className="ara-login-error">{error}</div>}

                <div className="ara-login-switch">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                        {mode === 'login' ? 'Create one' : 'Sign in'}
                    </button>
                </div>

                <div className="ara-login-footer">
                    <span>ARAmane Arts</span><i>•</i><span>Heritage paintings</span>
                </div>
            </section>
        </main>
    );
}
