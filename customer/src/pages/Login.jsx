import { useState } from 'react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost/paintings/api/auth/user-login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'email', email, password }),
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = '/account';
            } else {
                setError(data.message || 'Login failed.');
            }
        } catch (err) {
            setError('Unable to login at this time.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLoginMock = () => {
        alert("Google Sign-in popup would open here. Remember to install @react-oauth/google!");
    };

    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '4px' }}>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.5rem', color: 'var(--maroon)', textAlign: 'center', marginBottom: '1rem' }}>Welcome Back</h1>
            <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '2rem' }}>Sign in to track your orders and manage your account.</p>

            {error && <div style={{ color: 'var(--maroon)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.75rem', border: '1px solid var(--border)', background: 'transparent', outline: 'none' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '0.75rem', border: '1px solid var(--border)', background: 'transparent', outline: 'none' }}
                />
                <button type="submit" className="ara-btn ara-btn-primary" disabled={loading} style={{ width: '100%', padding: '1rem', cursor: 'pointer' }}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div style={{ margin: '2rem 0', textAlign: 'center', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                <span style={{ padding: '0 1rem' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <button onClick={handleGoogleLoginMock} className="ara-btn ara-btn-secondary" style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.36,22 12.22,22C17.74,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg>
                Sign in with Google
            </button>
        </div>
    );
}
