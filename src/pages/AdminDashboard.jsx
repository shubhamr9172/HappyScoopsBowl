import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../services/orderService';
import { NotificationService } from '../services/notificationService';
import { InventoryService } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, CheckCircle, Clock, ChefHat, Bell, Volume2, VolumeX, Package, LogOut, Search, History, LayoutGrid } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { isAuthenticated, login, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pinInput, setPinInput] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'history'

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
                NotificationService.checkLowStock(inventory);
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

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    // Note: Authentication is now handled by ProtectedRoute wrapper in App.jsx
    // This component is only rendered if isAuthenticated is true.

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
        try {
            await OrderService.updateOrderStatus(id, newStatus);
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status. Please try again.');
        }
    };

    const handlePayment = async (id) => {
        try {
            await OrderService.updatePaymentStatus(id, 'PAID');
            // Success feedback could be added here if needed
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Failed to mark as paid. Please check Firestore rules and try again.');
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
                <div style={styles.headerTop}>
                    <div style={styles.titleSection}>
                        <h2 style={styles.title}>Admin Dashboard</h2>
                        <div style={styles.badge}>🛡️</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={styles.muteBtn} onClick={handleToggleMute} title={isMuted ? "Unmute" : "Mute"}>
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                <div style={styles.navGrid}>
                    <div onClick={() => navigate('/admin/analytics')} style={{ ...styles.navCard, cursor: 'pointer' }}>
                        <div style={styles.navIcon}>📊</div>
                        <span style={styles.navLabel}>Analytics</span>
                    </div>
                    <div onClick={() => navigate('/admin/inventory')} style={{ ...styles.navCard, position: 'relative', cursor: 'pointer' }}>
                        <div style={styles.navIcon}>📦</div>
                        <span style={styles.navLabel}>Inventory</span>
                        {lowStockCount > 0 && (
                            <span style={styles.alertBadge}>{lowStockCount}</span>
                        )}
                    </div>
                    <div onClick={() => navigate('/kitchen')} style={{ ...styles.navCard, cursor: 'pointer' }}>
                        <div style={styles.navIcon}>👨‍🍳</div>
                        <span style={styles.navLabel}>Kitchen</span>
                    </div>
                </div>

                <div style={styles.stats}>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>💰</div>
                        <div style={styles.statContent}>
                            <small style={styles.statLabel}>Today's Sale</small>
                            <strong style={styles.statValue}>₹{todayRevenue}</strong>
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>🔔</div>
                        <div style={styles.statContent}>
                            <small style={styles.statLabel}>Active Orders</small>
                            <strong style={styles.statValue}>{activeOrders}</strong>
                        </div>
                    </div>
                </div>

                {/* Controls Section: Search & View Switch */}
                <div style={styles.controlsSection}>
                    <div style={styles.searchBox}>
                        <Search size={20} color="#666" />
                        <input
                            style={styles.searchInput}
                            placeholder="Search by ID, Name, Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>×</button>
                        )}
                    </div>

                    <div style={styles.viewToggle}>
                        <button
                            style={viewMode === 'active' ? styles.toggleBtnActive : styles.toggleBtn}
                            onClick={() => setViewMode('active')}
                        >
                            <LayoutGrid size={18} /> Active
                        </button>
                        <button
                            style={viewMode === 'history' ? styles.toggleBtnActive : styles.toggleBtn}
                            onClick={() => setViewMode('history')}
                        >
                            <History size={18} /> History
                        </button>
                    </div>
                </div>
            </header>

            <div style={styles.list}>
                {loading ? <p>Loading orders...</p> :
                    orders
                        .filter(order => {
                            // 1. Filter by View Mode
                            if (viewMode === 'active') {
                                if (order.orderStatus === 'COMPLETED') return false;
                            } else {
                                if (order.orderStatus !== 'COMPLETED') return false;
                            }

                            // 2. Filter by Search
                            if (!searchTerm) return true;
                            const term = searchTerm.toLowerCase();
                            return (
                                (order.orderId && order.orderId.toLowerCase().includes(term)) ||
                                (order.customerName && order.customerName.toLowerCase().includes(term)) ||
                                (order.customerPhone && order.customerPhone.includes(term)) ||
                                (order.token && order.token.toString().includes(term))
                            );
                        })
                        .map(order => (
                            <div key={order.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <div style={styles.tokenBox}>
                                        <small>TOKEN</small>
                                        <span>{order.token || '?'}</span>
                                    </div>
                                    <div style={styles.meta}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', wordBreak: 'break-all', lineHeight: '1.3' }}>#{order.orderId || order.id.slice(0, 8)}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(order.timestamp?.seconds ? order.timestamp.seconds * 1000 : order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        {order.customerName && (
                                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', wordBreak: 'break-word' }}>
                                                {order.customerName}
                                            </div>
                                        )}
                                        {order.customerPhone && (
                                            <div style={{ fontSize: '0.75rem', color: '#999' }}>
                                                {order.customerPhone}
                                            </div>
                                        )}
                                    </div>
                                    <div style={styles.priceSection}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.3rem', color: '#667eea', whiteSpace: 'nowrap' }}>₹{order.totalAmount}</div>
                                        <div style={{
                                            color: order.paymentStatus === 'PAID' ? '#10b981' : '#ef4444',
                                            fontWeight: '600',
                                            fontSize: '0.7rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            whiteSpace: 'nowrap'
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
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        fontFamily: "'Outfit', sans-serif"
    },
    header: {
        marginBottom: '1.5rem',
        background: 'white',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.12)'
    },
    headerTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem'
    },
    titleSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    title: {
        margin: 0,
        fontSize: '2rem',
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: '800',
        letterSpacing: '-1px'
    },
    badge: {
        fontSize: '1.5rem',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
    },
    navGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        marginBottom: '1.25rem'
    },
    navCard: {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        padding: '1.25rem',
        borderRadius: '16px',
        textDecoration: 'none',
        textDecoration: 'none',
        color: '#2c3e50',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    },
    navIcon: {
        fontSize: '1.75rem',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
    },
    navLabel: {
        fontSize: '0.85rem',
        fontWeight: '600',
        textAlign: 'center'
    },
    muteBtn: {
        padding: '0.75rem',
        background: 'rgba(102, 126, 234, 0.1)',
        color: '#667eea',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
    },
    logoutBtn: {
        padding: '0.75rem',
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
    },
    alertBadge: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: '#ef4444',
        color: 'white',
        fontSize: '0.7rem',
        fontWeight: '700',
        minWidth: '20px',
        height: '20px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 6px',
        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
    },
    stats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem'
    },
    statCard: {
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        padding: '1rem',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        transition: 'all 0.3s ease'
    },
    statIcon: {
        fontSize: '2rem',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
    },
    statContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    statLabel: {
        fontSize: '0.75rem',
        color: '#6b7280',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    statValue: {
        fontSize: '1.5rem',
        color: '#667eea',
        fontWeight: '700'
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    card: {
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '24px',
        padding: '1.5rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        border: '1px solid white',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    cardHeader: {
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
    },
    tokenBox: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '0.75rem',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '70px',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    meta: {
        fontSize: '0.9rem',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden'
    },
    priceSection: {
        textAlign: 'right',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.25rem',
        marginLeft: 'auto',
        flexShrink: 0
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
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9rem',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        transition: 'all 0.3s ease'
    },
    statusGroup: {
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(102, 126, 234, 0.05)',
        padding: '0.5rem',
        borderRadius: '12px',
        border: '1px solid rgba(102, 126, 234, 0.1)'
    },
    statusBtn: {
        flex: 1,
        padding: '0.6rem',
        borderRadius: '8px',
        border: '1px solid rgba(102, 126, 234, 0.2)',
        background: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: '#667eea'
    },
    statusBtnActive: {
        flex: 1,
        padding: '0.6rem',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.85rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    },
    statusBtnActive: {
        flex: 1,
        padding: '0.6rem',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.85rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.2s ease'
    },
    controlsSection: {
        marginTop: '1.5rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center'
    },
    searchBox: {
        flex: 2,
        minWidth: '250px',
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s ease'
    },
    searchInput: {
        border: 'none',
        background: 'transparent',
        outline: 'none',
        width: '100%',
        fontSize: '0.95rem',
        color: '#2d3748',
        padding: '0.5rem 0'
    },
    clearBtn: {
        background: 'none',
        border: 'none',
        color: '#a0aec0',
        fontSize: '1.25rem',
        cursor: 'pointer',
        padding: '0 0.5rem'
    },
    viewToggle: {
        flex: 1,
        minWidth: '200px',
        display: 'flex',
        background: '#f1f5f9',
        padding: '4px',
        borderRadius: '12px',
        gap: '4px'
    },
    toggleBtn: {
        flex: 1,
        border: 'none',
        background: 'transparent',
        padding: '0.75rem',
        borderRadius: '8px',
        color: '#64748b',
        fontWeight: '600',
        fontSize: '0.9rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s ease'
    },
    toggleBtnActive: {
        flex: 1,
        border: 'none',
        background: 'white',
        padding: '0.75rem',
        borderRadius: '8px',
        color: '#667eea',
        fontWeight: '700',
        fontSize: '0.9rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease'
    }
};

export default AdminDashboard;
