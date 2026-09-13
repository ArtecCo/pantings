import { useState } from 'react';

export default function Cart() {
    // Mock cart data
    const [cartItems] = useState([
        { id: 1, title: 'Sacred Grove (22K Gold)', price: 450.00, quantity: 1, image: 'https://via.placeholder.com/150' },
        { id: 2, title: 'Lotus Pond Series 1', price: 220.00, quantity: 1, image: 'https://via.placeholder.com/150' }
    ]);

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = 25.00;
    const total = subtotal + shipping;

    const [formData, setFormData] = useState({
        shipping_name: '',
        shipping_phone: '',
        shipping_city: '',
        shipping_state: '',
        shipping_postal_code: '',
        shipping_country: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost/paintings/api/orders/create.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subtotal,
                    shipping_amount: shipping,
                    discount_amount: 0,
                    ...formData
                })
            });
            const data = await res.json();
            
            if (data.success) {
                // Redirect to account to track order
                window.location.href = '/account';
            } else {
                setError(data.message || 'Checkout failed. Please ensure you are logged in.');
            }
        } catch (err) {
            setError('An error occurred during checkout.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 2rem' }}>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3rem', color: 'var(--maroon)', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                Your Cart
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4rem' }}>
                {/* Cart Items */}
                <div>
                    {cartItems.length === 0 ? (
                        <p style={{ color: 'var(--muted)' }}>Your cart is empty.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {cartItems.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                                    <div style={{ width: '120px', height: '120px', backgroundColor: 'var(--cream)', border: '1px solid var(--border)' }}></div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.25rem', color: 'var(--maroon)', marginBottom: '0.5rem' }}>{item.title}</h3>
                                        <p style={{ color: 'var(--muted)' }}>Quantity: {item.quantity}</p>
                                        <p style={{ fontWeight: '600', color: 'var(--brown)', marginTop: '1rem' }}>${item.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Checkout Panel */}
                <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', padding: '2rem', height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--maroon)', marginBottom: '1.5rem' }}>Order Summary</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--muted)' }}>
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--muted)' }}>
                        <span>Shipping</span>
                        <span>${shipping.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '2rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--brown)' }}>
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    {error && <div style={{ color: 'var(--maroon)', marginBottom: '1rem' }}>{error}</div>}

                    <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--maroon)', marginTop: '1rem' }}>Shipping Address</h3>
                        <input type="text" name="shipping_name" placeholder="Full Name" onChange={handleChange} required style={{ padding: '0.75rem', border: '1px solid var(--border)', background: 'transparent' }} />
                        <input type="text" name="shipping_phone" placeholder="Phone Number" onChange={handleChange} required style={{ padding: '0.75rem', border: '1px solid var(--border)', background: 'transparent' }} />
                        <input type="text" name="shipping_city" placeholder="City" onChange={handleChange} required style={{ padding: '0.75rem', border: '1px solid var(--border)', background: 'transparent' }} />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input type="text" name="shipping_state" placeholder="State/Province" onChange={handleChange} required style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', background: 'transparent' }} />
                            <input type="text" name="shipping_postal_code" placeholder="Postal Code" onChange={handleChange} required style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border)', background: 'transparent' }} />
                        </div>
                        <input type="text" name="shipping_country" placeholder="Country" onChange={handleChange} required style={{ padding: '0.75rem', border: '1px solid var(--border)', background: 'transparent' }} />
                        
                        <button type="submit" className="ara-btn ara-btn-primary" disabled={loading || cartItems.length === 0} style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
                            {loading ? 'Processing...' : 'Complete Checkout'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
