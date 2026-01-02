import React, { useEffect, useState } from 'react';
import { InventoryService } from '../services/inventoryService';
import { PREBUILT_COMBOS } from '../data/menu';
import { Package, AlertTriangle, TrendingUp, DollarSign, Plus, Minus, List, ToggleLeft, ToggleRight } from 'lucide-react';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [menuAvailability, setMenuAvailability] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'menu'
    const [editingItem, setEditingItem] = useState(null);
    const [newStock, setNewStock] = useState('');

    useEffect(() => {
        // Initialize inventory
        InventoryService.initializeInventory();

        const loadData = async () => {
            const avail = await InventoryService.getMenuAvailability();
            setMenuAvailability(avail);
        };

        loadData();

        // Subscribe to changes
        const unsubscribe = InventoryService.subscribeToInventory((data) => {
            setInventory(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleToggleAvailability = async (itemId) => {
        const currentStatus = menuAvailability[itemId] !== false; // Default to true if undefined
        const newStatus = !currentStatus;

        const updated = { ...menuAvailability, [itemId]: newStatus };
        setMenuAvailability(updated);

        await InventoryService.updateItemAvailability(itemId, newStatus);
    };

    const lowStockItems = InventoryService.getLowStockItems(inventory);

    const handleAdjustStock = async (itemId, adjustment) => {
        const item = inventory.find(i => i.id === itemId);
        if (item) {
            const newStockValue = Math.max(0, item.currentStock + adjustment);
            await InventoryService.updateStock(itemId, newStockValue);
        }
    };

    const handleSetStock = async (itemId) => {
        const stockValue = parseInt(newStock);
        if (!isNaN(stockValue) && stockValue >= 0) {
            await InventoryService.updateStock(itemId, stockValue);
            setEditingItem(null);
            setNewStock('');
        }
    };

    const getStockColor = (item) => {
        if (item.currentStock === 0) return { bg: '#FFEBEE', border: '#f44336', text: '#C62828' };
        if (item.currentStock <= item.minStock) return { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' };
        return { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' };
    };

    const getStockStatus = (item) => {
        if (item.currentStock === 0) return 'OUT OF STOCK';
        if (item.currentStock <= item.minStock) return 'LOW STOCK';
        return 'IN STOCK';
    };

    const groupedInventory = {
        base: inventory.filter(i => i.category === 'base'),
        sauce: inventory.filter(i => i.category === 'sauce'),
        topping: inventory.filter(i => i.category === 'topping')
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading inventory...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2>📦 Inventory Management</h2>
                <a href="/admin" style={styles.backLink}>← Back to Dashboard</a>
            </header>

            {/* Navigation Tabs */}
            <div style={styles.tabContainer}>
                <button
                    style={activeTab === 'inventory' ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab('inventory')}
                >
                    <Package size={18} />
                    <span>Ingredients Stock</span>
                </button>
                <button
                    style={activeTab === 'menu' ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab('menu')}
                >
                    <List size={18} />
                    <span>Menu Availability</span>
                </button>
            </div>

            {activeTab === 'menu' && (
                // --- Menu Management View ---
                <div style={styles.grid}>
                    {PREBUILT_COMBOS.map(combo => {
                        const isAvailable = menuAvailability[combo.id] !== false;
                        return (
                            <div key={combo.id} style={{
                                ...styles.card,
                                opacity: isAvailable ? 1 : 0.7,
                                border: isAvailable ? 'none' : '1px solid #ddd'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img
                                            src={combo.image}
                                            alt={combo.name}
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '8px',
                                                objectFit: 'cover',
                                                filter: isAvailable ? 'none' : 'grayscale(100%)'
                                            }}
                                        />
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', color: 'var(--text-dark)' }}>
                                                {combo.name}
                                            </h3>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                color: isAvailable ? 'var(--success)' : 'var(--text-muted)',
                                                fontWeight: '600'
                                            }}>
                                                {isAvailable ? '• Available' : '• Unavailable'}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleToggleAvailability(combo.id)}
                                        style={{
                                            background: isAvailable ? 'var(--primary-subtle)' : '#fee2e2',
                                            color: isAvailable ? 'var(--primary-dark)' : '#ef4444',
                                            border: 'none',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '99px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isAvailable ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        {isAvailable ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'inventory' && (
                // --- Inventory View (Original Content) ---
                <>
                    {/* Low Stock Alert */}
                    {lowStockItems.length > 0 && (
                        <div style={styles.alertBox}>
                            <AlertTriangle size={24} color="#FF9800" />
                            <div>
                                <strong>{lowStockItems.length} items need restocking</strong>
                                <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                    {lowStockItems.map(item => item.name).join(', ')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div style={styles.summaryGrid}>
                        <div style={styles.summaryCard}>
                            <Package size={24} color="#2196F3" />
                            <div>
                                <div style={styles.summaryLabel}>Total Items</div>
                                <div style={styles.summaryValue}>{inventory.length}</div>
                            </div>
                        </div>
                        <div style={styles.summaryCard}>
                            <AlertTriangle size={24} color="#FF9800" />
                            <div>
                                <div style={styles.summaryLabel}>Low Stock</div>
                                <div style={styles.summaryValue}>{lowStockItems.length}</div>
                            </div>
                        </div>
                        <div style={styles.summaryCard}>
                            <DollarSign size={24} color="#4CAF50" />
                            <div>
                                <div style={styles.summaryLabel}>Total Value</div>
                                <div style={styles.summaryValue}>
                                    ₹{inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory by Category */}
                    {Object.entries(groupedInventory).map(([category, items]) => (
                        <div key={category} style={styles.section}>
                            <h3 style={styles.categoryTitle}>
                                {category === 'base' ? '🍦 Ice Cream Bases' :
                                    category === 'sauce' ? '🍫 Sauces' : '🎂 Toppings'}
                            </h3>
                            <div style={styles.itemsGrid}>
                                {items.map(item => {
                                    const colors = getStockColor(item);
                                    const status = getStockStatus(item);
                                    const isEditing = editingItem === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                ...styles.itemCard,
                                                background: colors.bg,
                                                borderColor: colors.border
                                            }}
                                        >
                                            <div style={styles.itemHeader}>
                                                <div style={styles.itemName}>{item.name}</div>
                                                <div
                                                    style={{
                                                        ...styles.statusBadge,
                                                        background: colors.border,
                                                        color: 'white'
                                                    }}
                                                >
                                                    {status}
                                                </div>
                                            </div>

                                            <div style={styles.stockInfo}>
                                                <div style={styles.stockDisplay}>
                                                    <span style={{ ...styles.stockNumber, color: colors.text }}>
                                                        {item.currentStock}
                                                    </span>
                                                    <span style={styles.stockUnit}>{item.unit}</span>
                                                </div>
                                                <div style={styles.minStock}>Min: {item.minStock}</div>
                                            </div>

                                            <div style={styles.costInfo}>
                                                <span>Cost: ₹{item.costPerUnit}/{item.unit}</span>
                                                <span>Value: ₹{item.currentStock * item.costPerUnit}</span>
                                            </div>

                                            {isEditing ? (
                                                <div style={styles.editControls}>
                                                    <input
                                                        type="number"
                                                        value={newStock}
                                                        onChange={(e) => setNewStock(e.target.value)}
                                                        placeholder="New stock"
                                                        style={styles.stockInput}
                                                        autoFocus
                                                    />
                                                    <button
                                                        style={styles.saveBtn}
                                                        onClick={() => handleSetStock(item.id)}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        style={styles.cancelBtn}
                                                        onClick={() => {
                                                            setEditingItem(null);
                                                            setNewStock('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={styles.controls}>
                                                    <button
                                                        style={styles.adjustBtn}
                                                        onClick={() => handleAdjustStock(item.id, -10)}
                                                    >
                                                        <Minus size={16} /> 10
                                                    </button>
                                                    <button
                                                        style={styles.adjustBtn}
                                                        onClick={() => handleAdjustStock(item.id, -1)}
                                                    >
                                                        <Minus size={16} /> 1
                                                    </button>
                                                    <button
                                                        style={styles.setBtn}
                                                        onClick={() => {
                                                            setEditingItem(item.id);
                                                            setNewStock(item.currentStock.toString());
                                                        }}
                                                    >
                                                        Set
                                                    </button>
                                                    <button
                                                        style={styles.adjustBtn}
                                                        onClick={() => handleAdjustStock(item.id, 1)}
                                                    >
                                                        <Plus size={16} /> 1
                                                    </button>
                                                    <button
                                                        style={styles.adjustBtn}
                                                        onClick={() => handleAdjustStock(item.id, 10)}
                                                    >
                                                        <Plus size={16} /> 10
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
        fontFamily: "'Outfit', sans-serif"
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
        marginBottom: '2rem',
        background: 'rgba(255,255,255,0.8)',
        padding: '1.5rem',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
    },
    backLink: {
        color: '#2196F3',
        textDecoration: 'none',
        fontSize: '0.9rem'
    },
    alertBox: {
        background: '#FFF3E0',
        border: '2px solid #FF9800',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
    },
    summaryCard: {
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    summaryLabel: {
        fontSize: '0.85rem',
        color: '#666',
        marginBottom: '0.25rem'
    },
    summaryValue: {
        fontSize: '1.75rem',
        fontWeight: '700',
        color: 'var(--text-dark)'
    },
    section: {
        marginBottom: '2rem'
    },
    categoryTitle: {
        marginBottom: '1rem',
        fontSize: '1.2rem'
    },
    itemsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem'
    },
    itemCard: {
        padding: '1.5rem',
        borderRadius: '20px',
        border: 'none',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
        background: 'white',
        transition: 'transform 0.2s ease'
    },
    tabContainer: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        background: 'rgba(255,255,255,0.5)',
        padding: '0.5rem',
        borderRadius: '50px',
        width: 'fit-content'
    },
    tab: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0.75rem 1.5rem',
        borderRadius: '50px',
        border: 'none',
        background: 'transparent',
        color: '#64748b',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    tabActive: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0.75rem 1.5rem',
        borderRadius: '50px',
        border: 'none',
        background: 'white',
        color: '#0f172a',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    itemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
    },
    itemName: {
        fontWeight: '600',
        fontSize: '1.1rem'
    },
    statusBadge: {
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    stockInfo: {
        marginBottom: '1rem'
    },
    stockDisplay: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.5rem',
        marginBottom: '0.25rem'
    },
    stockNumber: {
        fontSize: '2.5rem',
        fontWeight: '700'
    },
    stockUnit: {
        fontSize: '1rem',
        color: '#666'
    },
    minStock: {
        fontSize: '0.85rem',
        color: '#666'
    },
    costInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        color: '#666',
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(0,0,0,0.1)'
    },
    controls: {
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
    },
    adjustBtn: {
        flex: 1,
        minWidth: '60px',
        padding: '0.5rem',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem'
    },
    setBtn: {
        flex: 1,
        minWidth: '60px',
        padding: '0.5rem',
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    editControls: {
        display: 'flex',
        gap: '0.5rem'
    },
    stockInput: {
        flex: 1,
        padding: '0.5rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '1rem'
    },
    saveBtn: {
        padding: '0.5rem 1rem',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    cancelBtn: {
        padding: '0.5rem 1rem',
        background: '#666',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer'
    }
};

export default Inventory;
