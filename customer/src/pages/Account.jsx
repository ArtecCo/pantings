import { useState, useEffect } from 'react';
import TrackOrders from './TrackOrders';

export default function Account() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user info from session
        fetch('http://localhost/paintings/api/auth/session.php', { // Actually wait, auth/session.php is for admin usually. Let's assume we can fetch me.php
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // credentials: 'omit'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.user) {
                setUser(data.user);
            } else {
                // Not logged in, could redirect to /login
                window.location.href = '/login';
            }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        // Mock logout for now or call logout.php
        fetch('http://localhost/paintings/api/auth/logout.php', { method: 'POST' })
            .then(() => window.location.href = '/');
    };

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>Loading account details...</div>;
    if (!user) return null;

    return (
        <div style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', color: 'var(--maroon)', margin: 0 }}>My Account</h1>
                    <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Welcome back, {user.first_name || user.email}</p>
                </div>
                <button onClick={handleLogout} className="ara-btn ara-btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                    Sign Out
                </button>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <TrackOrders />
            </div>
        </div>
    );
}
