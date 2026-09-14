import { useState, useEffect } from 'react';
import TrackOrders from './TrackOrders';
import { apiUrl } from '../config/api';
import { useToast } from '../components/ToastProvider';

export default function Account() {
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(apiUrl('auth/user-session.php'), {
            method: 'GET',
            credentials: 'include',
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.success && data.user) {
                    setUser(data.user);
                } else if (res.status !== 401) {
                    toast.error(data.message || 'Unable to load your account.');
                    window.location.href = '/login';
                } else {
                    window.location.href = '/login';
                }
            })
            .catch((err) => {
                console.error('User session check failed:', err);
                toast.error('Unable to load your account.');
                window.location.href = '/login';
            })
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch(apiUrl('auth/user-logout.php'), {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.success === false) throw new Error(data.message || 'Unable to sign out.');
            toast.success('Signed out successfully.');
        } catch (error) {
            toast.error(error.message || 'Unable to sign out.');
        } finally {
            setTimeout(() => { window.location.href = '/'; }, 500);
        }
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
            <div style={{ marginTop: '2rem' }}><TrackOrders /></div>
        </div>
    );
}
