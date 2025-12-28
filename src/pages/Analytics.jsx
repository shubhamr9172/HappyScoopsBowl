import React, { useEffect, useState } from 'react';
import { OrderService } from '../services/orderService';
import { AnalyticsService } from '../services/analyticsService';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Clock, Award } from 'lucide-react';

const Analytics = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('today');

    useEffect(() => {
        const unsubscribe = OrderService.subscribeToOrders((data) => {
            setOrders(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading analytics...</div>
            </div>
        );
    }

    const filteredOrders = AnalyticsService.filterOrdersByDate(orders, period);
    const summary = AnalyticsService.getRevenueSummary(orders);
    const popularItems = AnalyticsService.getPopularItems(filteredOrders);
    const peakHours = AnalyticsService.getPeakHours(filteredOrders);
    const avgOrderValue = AnalyticsService.getAverageOrderValue(filteredOrders);
    const dailySales = AnalyticsService.getDailySales(orders, 7);
    const itemTypeRatio = AnalyticsService.getItemTypeRatio(filteredOrders);

    // Find max revenue for chart scaling
    const maxRevenue = Math.max(...dailySales.map(d => d.revenue), 1);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2>📊 Business Analytics</h2>
                <a href="/admin" style={styles.backLink}>← Back to Dashboard</a>
            </header>

            {/* Period Selector */}
            <div style={styles.periodSelector}>
                {['today', 'week', 'month'].map(p => (
                    <button
                        key={p}
                        style={period === p ? styles.periodBtnActive : styles.periodBtn}
                        onClick={() => setPeriod(p)}
                    >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>

            {/* Revenue Summary Cards */}
            <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>
                        <DollarSign size={24} color="#4CAF50" />
                    </div>
                    <div>
                        <div style={styles.metricLabel}>Today's Revenue</div>
                        <div style={styles.metricValue}>₹{summary.today.revenue}</div>
                        <div style={styles.metricChange}>
                            {summary.today.change > 0 ? (
                                <span style={{ color: '#4CAF50' }}>
                                    <TrendingUp size={14} /> +{summary.today.change}%
                                </span>
                            ) : summary.today.change < 0 ? (
                                <span style={{ color: '#f44336' }}>
                                    <TrendingDown size={14} /> {summary.today.change}%
                                </span>
                            ) : (
                                <span style={{ color: '#666' }}>No change</span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>
                        <ShoppingBag size={24} color="#2196F3" />
                    </div>
                    <div>
                        <div style={styles.metricLabel}>Total Orders</div>
                        <div style={styles.metricValue}>{filteredOrders.length}</div>
                        <div style={styles.metricSubtext}>
                            {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
                        </div>
                    </div>
                </div>

                <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>
                        <Award size={24} color="#FF9800" />
                    </div>
                    <div>
                        <div style={styles.metricLabel}>Avg Order Value</div>
                        <div style={styles.metricValue}>₹{avgOrderValue}</div>
                        <div style={styles.metricSubtext}>Per order</div>
                    </div>
                </div>
            </div>

            {/* Sales Trend Chart */}
            <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>📈 7-Day Sales Trend</h3>
                <div style={styles.chart}>
                    {dailySales.map((day, idx) => (
                        <div key={idx} style={styles.chartBar}>
                            <div style={styles.barContainer}>
                                <div
                                    style={{
                                        ...styles.bar,
                                        height: `${(day.revenue / maxRevenue) * 100}%`,
                                        minHeight: day.revenue > 0 ? '20px' : '0'
                                    }}
                                >
                                    <span style={styles.barValue}>₹{day.revenue}</span>
                                </div>
                            </div>
                            <div style={styles.barLabel}>{day.date}</div>
                            <div style={styles.barSubLabel}>{day.orders} orders</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Popular Items */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>🏆 Popular Items</h3>
                <div style={styles.itemsList}>
                    {popularItems.length > 0 ? (
                        popularItems.map((item, idx) => (
                            <div key={idx} style={styles.itemRow}>
                                <div style={styles.itemRank}>#{idx + 1}</div>
                                <div style={styles.itemInfo}>
                                    <div style={styles.itemName}>{item.name}</div>
                                    <div style={styles.itemMeta}>
                                        {item.count} orders • ₹{item.revenue} revenue
                                    </div>
                                </div>
                                <div style={styles.itemBadge}>
                                    {item.type === 'COMBO' ? '🍫' : '🎨'}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={styles.emptyState}>No orders yet for this period</div>
                    )}
                </div>
            </div>

            {/* Peak Hours */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>⏰ Peak Hours</h3>
                <div style={styles.peakHoursList}>
                    {peakHours.length > 0 ? (
                        peakHours.map((hour, idx) => (
                            <div key={idx} style={styles.peakHourRow}>
                                <div style={styles.hourTime}>
                                    {hour.hour === 0 ? '12 AM' : hour.hour < 12 ? `${hour.hour} AM` : hour.hour === 12 ? '12 PM' : `${hour.hour - 12} PM`}
                                </div>
                                <div style={styles.hourBar}>
                                    <div
                                        style={{
                                            ...styles.hourBarFill,
                                            width: `${(hour.orders / peakHours[0].orders) * 100}%`
                                        }}
                                    />
                                </div>
                                <div style={styles.hourStats}>
                                    {hour.orders} orders • ₹{hour.revenue}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={styles.emptyState}>No orders yet for this period</div>
                    )}
                </div>
            </div>

            {/* Item Type Ratio */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>🎯 Combo vs Custom</h3>
                <div style={styles.ratioContainer}>
                    <div style={styles.ratioBar}>
                        <div
                            style={{
                                ...styles.ratioSegment,
                                width: `${itemTypeRatio.combo.percentage}%`,
                                background: '#FF6B6B'
                            }}
                        >
                            {itemTypeRatio.combo.percentage > 0 && `${itemTypeRatio.combo.percentage}%`}
                        </div>
                        <div
                            style={{
                                ...styles.ratioSegment,
                                width: `${itemTypeRatio.custom.percentage}%`,
                                background: '#8D6E63'
                            }}
                        >
                            {itemTypeRatio.custom.percentage > 0 && `${itemTypeRatio.custom.percentage}%`}
                        </div>
                    </div>
                    <div style={styles.ratioLegend}>
                        <div style={styles.legendItem}>
                            <div style={{ ...styles.legendDot, background: '#FF6B6B' }} />
                            <span>Combos ({itemTypeRatio.combo.count})</span>
                        </div>
                        <div style={styles.legendItem}>
                            <div style={{ ...styles.legendDot, background: '#8D6E63' }} />
                            <span>Custom ({itemTypeRatio.custom.count})</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
        background: '#f4f4f4',
        minHeight: '100vh'
    },
    loading: {
        textAlign: 'center',
        padding: '3rem',
        color: '#666'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
    },
    backLink: {
        color: '#2196F3',
        textDecoration: 'none',
        fontSize: '0.9rem'
    },
    periodSelector: {
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        background: 'white',
        padding: '0.5rem',
        borderRadius: '12px'
    },
    periodBtn: {
        flex: 1,
        padding: '0.75rem',
        borderRadius: '8px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '500'
    },
    periodBtnActive: {
        flex: 1,
        padding: '0.75rem',
        borderRadius: '8px',
        background: 'var(--dark)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600'
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    metricCard: {
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        gap: '1rem'
    },
    metricIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    metricLabel: {
        fontSize: '0.85rem',
        color: '#666',
        marginBottom: '0.25rem'
    },
    metricValue: {
        fontSize: '1.75rem',
        fontWeight: '700',
        color: 'var(--dark)',
        marginBottom: '0.25rem'
    },
    metricChange: {
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
    },
    metricSubtext: {
        fontSize: '0.85rem',
        color: '#999'
    },
    chartCard: {
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '1.5rem'
    },
    chartTitle: {
        marginBottom: '1.5rem',
        fontSize: '1.1rem'
    },
    chart: {
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-end',
        height: '200px'
    },
    chartBar: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    barContainer: {
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
    },
    bar: {
        width: '100%',
        background: 'linear-gradient(180deg, #FF6B6B 0%, #D32F2F 100%)',
        borderRadius: '4px 4px 0 0',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '0.25rem',
        transition: 'height 0.3s ease'
    },
    barValue: {
        fontSize: '0.7rem',
        fontWeight: '600',
        color: 'white'
    },
    barLabel: {
        fontSize: '0.75rem',
        marginTop: '0.5rem',
        fontWeight: '500'
    },
    barSubLabel: {
        fontSize: '0.65rem',
        color: '#999'
    },
    section: {
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '1.5rem'
    },
    sectionTitle: {
        marginBottom: '1rem',
        fontSize: '1.1rem'
    },
    itemsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    itemRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem',
        background: '#f9f9f9',
        borderRadius: '8px'
    },
    itemRank: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#FF6B6B',
        minWidth: '40px'
    },
    itemInfo: {
        flex: 1
    },
    itemName: {
        fontWeight: '600',
        marginBottom: '0.25rem'
    },
    itemMeta: {
        fontSize: '0.85rem',
        color: '#666'
    },
    itemBadge: {
        fontSize: '1.5rem'
    },
    peakHoursList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    peakHourRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    hourTime: {
        minWidth: '70px',
        fontWeight: '600',
        fontSize: '0.9rem'
    },
    hourBar: {
        flex: 1,
        height: '24px',
        background: '#f0f0f0',
        borderRadius: '12px',
        overflow: 'hidden'
    },
    hourBarFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #FF6B6B 0%, #D32F2F 100%)',
        transition: 'width 0.3s ease'
    },
    hourStats: {
        fontSize: '0.85rem',
        color: '#666',
        minWidth: '120px',
        textAlign: 'right'
    },
    ratioContainer: {
        marginTop: '1rem'
    },
    ratioBar: {
        display: 'flex',
        height: '40px',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '1rem'
    },
    ratioSegment: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        fontSize: '0.9rem'
    },
    ratioLegend: {
        display: 'flex',
        gap: '2rem',
        justifyContent: 'center'
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem'
    },
    legendDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%'
    },
    emptyState: {
        textAlign: 'center',
        padding: '2rem',
        color: '#999',
        fontStyle: 'italic'
    }
};

export default Analytics;
