import React, { useEffect, useState } from 'react';
import { OrderService } from '../services/orderService';
import { NotificationService } from '../services/notificationService';
import { Volume2, VolumeX, Settings } from 'lucide-react';

const KitchenDisplay = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        // Initialize notifications
        NotificationService.init().then(() => {
            setIsMuted(NotificationService.isMuted);
        });

        const unsubscribe = OrderService.subscribeToOrders((data) => {
            // Filter out completed orders
            const activeOrders = data.filter(o => o.orderStatus !== 'COMPLETED');
            setOrders(activeOrders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleToggleMute = () => {
        const newMuteState = NotificationService.toggleMute();
        setIsMuted(newMuteState);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        await OrderService.updateOrderStatus(orderId, newStatus);
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading kitchen display...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>👨‍🍳 Kitchen Display</h1>
                <div style={styles.headerActions}>
                    <button style={styles.muteBtn} onClick={handleToggleMute}>
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                    <a href="/admin" style={styles.adminLink}>
                        <Settings size={20} /> Admin
                    </a>
                </div>
            </header>

            {orders.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🍦</div>
                    <h3>No Active Orders</h3>
                    <p>Waiting for customers...</p>
                </div>
            ) : (
                <div style={styles.ordersGrid}>
                    {orders.map(order => {
                        const colorScheme = NotificationService.getOrderColor(order);
                        const age = NotificationService.getOrderAge(order);

                        return (
                            <div
                                key={order.id}
                                style={{
                                    ...styles.orderCard,
                                    background: colorScheme.bg,
                                    borderColor: colorScheme.border
                                }}
                            >
                                {/* Token Number */}
                                <div style={styles.tokenSection}>
                                    <div style={styles.tokenLabel}>TOKEN</div>
                                    <div style={{
                                        ...styles.tokenNumber,
                                        color: colorScheme.text
                                    }}>
                                        {order.token || '?'}
                                    </div>
                                </div>

                                {/* Order Age */}
                                <div style={{
                                    ...styles.ageLabel,
                                    background: colorScheme.border,
                                    color: 'white'
                                }}>
                                    {age < 1 ? 'Just now' : `${age} min ago`} • {colorScheme.label}
                                </div>

                                {/* Items List */}
                                <div style={styles.itemsList}>
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} style={styles.item}>
                                            <span style={styles.itemBullet}>•</span>
                                            <span style={styles.itemName}>{item.name}</span>
                                            {item.type === 'CUSTOM' && (
                                                <div style={styles.itemDetails}>
                                                    {item.details?.base?.name}, {item.details?.sauce?.name}
                                                    {item.details?.toppings?.length > 0 && (
                                                        <span>, +{item.details.toppings.length} toppings</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Status Actions */}
                                <div style={styles.actions}>
                                    {order.orderStatus === 'CREATED' && (
                                        <button
                                            style={styles.startBtn}
                                            onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                                        >
                                            ▶️ START PREP
                                        </button>
                                    )}
                                    {order.orderStatus === 'PREPARING' && (
                                        <button
                                            style={styles.readyBtn}
                                            onClick={() => handleStatusUpdate(order.id, 'READY')}
                                        >
                                            ✅ MARK READY
                                        </button>
                                    )}
                                    {order.orderStatus === 'READY' && (
                                        <div style={styles.readyBadge}>
                                            🔔 READY FOR PICKUP
                                        </div>
                                    )}
                                </div>

                                {/* Order ID (small, for reference) */}
                                <div style={styles.orderId}>#{order.orderId || order.id.slice(0, 8)}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        color: '#2c3e50',
        padding: '1rem',
        maxWidth: '100vw',
        overflow: 'hidden',
        fontFamily: "'Outfit', sans-serif"
    },
    loading: {
        textAlign: 'center',
        padding: '3rem',
        fontSize: '1.2rem'
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '1rem',
        padding: '1.5rem',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
    },
    title: {
        margin: 0,
        fontSize: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: '800',
        letterSpacing: '-1px'
    },
    headerActions: {
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    muteBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1.2rem',
        background: 'white',
        color: '#64748b',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
    },
    adminLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 0.9rem',
        background: '#2196F3',
        color: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        color: '#999'
    },
    emptyIcon: {
        fontSize: '5rem',
        marginBottom: '1rem'
    },
    ordersGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        padding: '0.5rem'
    },
    orderCard: {
        padding: '1.5rem',
        borderRadius: '24px',
        border: 'none',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minWidth: 0,
        maxWidth: '100%',
        background: 'rgba(255,255,255,0.95)',
        transition: 'transform 0.2s ease'
    },
    tokenSection: {
        textAlign: 'center',
        padding: '1rem 0'
    },
    tokenLabel: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: '0.25rem',
        letterSpacing: '1px',
        textTransform: 'uppercase'
    },
    tokenNumber: {
        fontSize: 'clamp(3rem, 10vw, 4.5rem)',
        fontWeight: '900',
        lineHeight: 1,
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    },
    ageLabel: {
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        textAlign: 'center',
        fontWeight: '700',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    itemsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '16px',
        border: '1px solid #e2e8f0'
    },
    item: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    itemBullet: {
        fontSize: '1.5rem',
        marginRight: '0.5rem',
        color: '#FF6B6B'
    },
    itemName: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#1e293b'
    },
    itemDetails: {
        fontSize: '0.85rem',
        color: '#666',
        marginLeft: '2rem'
    },
    actions: {
        marginTop: '0.5rem'
    },
    startBtn: {
        width: '100%',
        padding: '1rem',
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        fontSize: '1.1rem',
        fontWeight: '700',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    readyBtn: {
        width: '100%',
        padding: '1rem',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        fontSize: '1.1rem',
        fontWeight: '700',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    readyBadge: {
        width: '100%',
        padding: '1rem',
        background: '#FF9800',
        color: 'white',
        borderRadius: '12px',
        fontSize: '1.1rem',
        fontWeight: '700',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        animation: 'pulse 2s infinite'
    },
    orderId: {
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#999',
        marginTop: '0.5rem'
    }
};

export default KitchenDisplay;
