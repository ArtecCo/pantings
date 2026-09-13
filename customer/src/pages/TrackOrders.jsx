import { useState, useEffect } from 'react';

export default function TrackOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost/paintings/api/orders/my-orders.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // credentials: 'omit' // Depending on auth strategy
            });
            const data = await response.json();
            
            if (data.success) {
                setOrders(data.orders);
            } else {
                setError(data.message || 'Failed to fetch orders');
            }
        } catch (err) {
            setError('An error occurred while fetching your orders');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading your orders...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Track Orders</h1>
            {orders.length === 0 ? (
                <div className="text-gray-500 text-center py-10 border rounded-lg bg-gray-50">
                    You have no orders yet.
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">Order #{order.order_number}</h3>
                                    <p className="text-sm text-gray-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Total Amount</p>
                                    <p className="text-lg font-bold">${parseFloat(order.total_amount).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Shipping Details</p>
                                    <p className="text-sm text-gray-600">{order.shipping_name}</p>
                                    <p className="text-sm text-gray-600">{order.shipping_city}, {order.shipping_country}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function getStatusColor(status) {
    switch (status) {
        case 'Order created': return 'bg-blue-100 text-blue-800';
        case 'Artist to get in touch': return 'bg-purple-100 text-purple-800';
        case 'Accepted': return 'bg-yellow-100 text-yellow-800';
        case 'Processing': return 'bg-orange-100 text-orange-800';
        case 'Dispatched': return 'bg-indigo-100 text-indigo-800';
        case 'Delivered': return 'bg-green-100 text-green-800';
        case 'REJECTED': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
