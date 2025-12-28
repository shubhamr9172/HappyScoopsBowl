import React, { useEffect, useState } from 'react';
import { OrderService } from '../services/orderService';
import { NotificationService } from '../services/notificationService';
import { InventoryService } from '../services/inventoryService';
import { RefreshCw, CheckCircle, Clock, ChefHat, Bell, Volume2, VolumeX, Package } from 'lucide-react';

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [lowStockCount, setLowStockCount] = useState(0);

    useEffect(() => {
        // Initialize notifications
        if (isAuthenticated) {
            NotificationService.init().then(() => {
                setIsMuted(NotificationService.isMuted);
            });

            // Subscribe to inventory for low stock alerts
            const unsubInventory = InventoryService.subscribeToInventory((inventory) => {
                const lowStock = InventoryService.getLowStockItems(inventory);
                setLowStockCount(lowStock.length);
            });

            return () => unsubInventory();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Only run subscription if authenticated
        if (isAuthenticated) {
            const unsubscribe = OrderService.subscribeToOrders((data) => {
                setOrders(data);
                setLoading(false);

                // Check for new orders and notify
                NotificationService.checkNewOrders(data);
            });
            return () => unsubscribe();
        }
    }, [isAuthenticated]);

    const handleToggleMute = () => {
        const newMuteState = NotificationService.toggleMute();
        setIsMuted(newMuteState);
    };

    if (!isAuthenticated) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--light)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-lg)',
                    width: '90%',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}>
                    <h3>Owner Login 🔐</h3>
                    <p style={{ marginBottom: '1rem', color: '#666' }}>Enter PIN to access dashboard</p>
                    <input
                        type="password"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="PIN (Try 1234)"
                        style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            width: '100%',
                            marginBottom: '1rem',
                            fontSize: '1rem'
                        }}
                    />
                    <button
                        onClick={() => {
                            if (pinInput === '1234') setIsAuthenticated(true);
                            else alert('Incorrect PIN');
                        }}
                        style={{
                            ...styles.payBtn,
                            width: '100%',
                            padding: '1rem',
                            background: 'var(--primary)',
                            color: 'white'
                        }}
                    >
                        Login
                    </button>
                    <div style={{ marginTop: '1rem' }}>
                        <a href="/" style={{ color: '#888', fontSize: '0.9rem' }}>Back to Home</a>
                    </div>
                </div>
            </div>
        );
    }

    // Helpers
    const getStatusColor = (status) => {
        switch (status) {
            case 'CREATED': return 'gray';
            case 'PREPARING': return 'orange';
            case 'READY': return 'green';
            case 'COMPLETED': return 'blue';
            default: return 'black';
        }
    };

    const handleStatus = async (id, newStatus) => {
        await OrderService.updateOrderStatus(id, newStatus);
    };

    const handlePayment = async (id) => {
        if (window.confirm('Confirm payment received for this order?')) {
            await OrderService.updatePaymentStatus(id, 'PAID');
        }
    };

    // Calculate Summary
    // Count all orders since customers pay upfront via UPI
    // The "PAID" status is just admin confirmation, not actual payment
    const todayRevenue = orders
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const activeOrders = orders.filter(o => o.orderStatus !== 'COMPLETED').length;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h2>Admin Dashboard 🛡️</h2>
                    <div style={styles.headerLinks}>
                        <a href="/admin/analytics" style={styles.analyticsLink}>
                            📊 Analytics
                        </a>
                        <a href="/admin/inventory" style={{ ...styles.kitchenLink, position: 'relative' }}>
                            <Package size={16} /> Inventory
                            {lowStockCount > 0 && (
                                <span style={styles.alertBadge}>{lowStockCount}</span>
                            )}
                        </a>
                        <a href="/kitchen" style={styles.kitchenLink}>
                            👨‍🍳 Kitchen
                        </a>
                        <button style={styles.muteBtn} onClick={handleToggleMute}>
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                    </div>
                </div>
                <div style={styles.stats}>
                    <div style={styles.statCard}>
                        <small>Today's Sale</small>
                        <strong>₹{todayRevenue}</strong>
                    </div>
                    <div style={styles.statCard}>
                        <small>Active Orders</small>
                        <strong>{activeOrders}</strong>
                    </div>
                </div>
            </header>

            <div style={styles.list}>
                {loading ? <p>Loading orders...</p> : orders.map(order => (
                    <div key={order.id} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div style={styles.tokenBox}>
                                <small>TOKEN</small>
                                <span>{order.token || '?'}</span>
                            </div>
                            <div style={styles.meta}>
                                <div style={{ fontWeight: 'bold' }}>#{order.orderId || order.id.slice(0, 5)}</div>
                                <div>{new Date(order.timestamp?.seconds ? order.timestamp.seconds * 1000 : order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                {order.customerName && (
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                        {order.customerName} | {order.customerPhone}
                                    </div>
                                )}
                            </div>
                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>₹{order.totalAmount}</div>
                                <div style={{
                                    color: order.paymentStatus === 'PAID' ? 'green' : 'red',
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem'
                                }}>
                                    {order.paymentStatus}
                                </div>
                            </div>
                        </div>

                        <hr style={styles.divider} />

                        <div style={styles.items}>
                            {order.items?.map((item, idx) => (
                                <div key={idx} style={styles.itemRow}>
                                    <span>{item.name}</span>
                                    {item.type === 'CUSTOM' && (
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                            {item.details.base.name} + {item.details.sauce.name}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={styles.actions}>
                            {/* Payment Action */}
                            {order.paymentStatus !== 'PAID' && (
                                <button style={styles.payBtn} onClick={() => handlePayment(order.id)}>
                                    Mark PAID ✅
                                </button>
                            )}

                            {/* Status Workflow */}
                            <div style={styles.statusGroup}>
                                <button
                                    style={order.orderStatus === 'CREATED' ? styles.statusBtnActive : styles.statusBtn}
                                    onClick={() => handleStatus(order.id, 'PREPARING')}
                                >
                                    Prep <ChefHat size={14} />
                                </button>
                                <button
                                    style={order.orderStatus === 'PREPARING' ? styles.statusBtnActive : styles.statusBtn}
                                    onClick={() => handleStatus(order.id, 'READY')}
                                >
                                    Ready <Bell size={14} />
                                </button>
                                <button
                                    style={order.orderStatus === 'READY' ? styles.statusBtnActive : styles.statusBtn}
                                    onClick={() => handleStatus(order.id, 'COMPLETED')}
                                >
                                    Done <CheckCircle size={14} />
                                </button>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold', color: getStatusColor(order.orderStatus) }}>
                            Status: {order.orderStatus}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '1rem',
        background: '#f4f4f4',
        minHeight: '100vh'
    },
    header: {
        marginBottom: '1.5rem'
    },
    headerLinks: {
        display: 'flex',
        gap: '0.5rem',
        marginTop: '0.5rem',
        alignItems: 'center'
    },
    analyticsLink: {
        display: 'inline-block',
        padding: '0.5rem 1rem',
        background: '#2196F3',
        color: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: '600'
    },
    kitchenLink: {
        display: 'inline-block',
        padding: '0.5rem 1rem',
        background: '#4CAF50',
        color: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: '600'
    },
    muteBtn: {
        padding: '0.5rem',
        background: '#666',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    alertBadge: {
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        background: '#f44336',
        color: 'white',
        fontSize: '0.7rem',
        fontWeight: '700',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    stats: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1rem'
    },
    statCard: {
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        flex: 1,
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    card: {
        background: 'white',
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    cardHeader: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
    },
    tokenBox: {
        background: 'var(--dark)',
        color: 'white',
        padding: '0.5rem',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '50px'
    },
    meta: {
        fontSize: '0.9rem'
    },
    divider: {
        border: 'none',
        borderTop: '1px solid #eee',
        margin: '0.75rem 0'
    },
    items: {
        marginBottom: '1rem'
    },
    itemRow: {
        marginBottom: '0.25rem',
        fontSize: '0.95rem'
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    payBtn: {
        background: '#e0f2f1',
        color: '#00695c',
        padding: '0.5rem',
        borderRadius: '6px',
        fontWeight: 'bold'
    },
    statusGroup: {
        display: 'flex',
        gap: '0.5rem',
        background: '#f9f9f9',
        padding: '4px',
        borderRadius: '8px'
    },
    statusBtn: {
        flex: 1,
        padding: '0.5rem',
        borderRadius: '6px',
        border: '1px solid #ddd',
        background: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.8rem'
    },
    statusBtnActive: {
        flex: 1,
        padding: '0.5rem',
        borderRadius: '6px',
        background: 'var(--dark)',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.8rem',
        fontWeight: 'bold'
    }
};

export default AdminDashboard;
