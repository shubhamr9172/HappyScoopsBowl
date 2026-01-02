import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryService } from '../services/inventoryService';
import { PREBUILT_COMBOS } from '../data/menu';
import { Package, AlertTriangle, TrendingUp, DollarSign, Plus, Minus, List, ToggleLeft, ToggleRight } from 'lucide-react';

const Inventory = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [menuAvailability, setMenuAvailability] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'menu'

    // Edit Stock (Quick Edit)
    const [editingItem, setEditingItem] = useState(null);
    const [newStock, setNewStock] = useState('');

    // Full Item Edit/Add
    const [showItemForm, setShowItemForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [itemFormData, setItemFormData] = useState({
        id: '',
        name: '',
        category: 'base',
        currentStock: 0,
        unit: 'pieces',
        minStock: 10,
        costPerUnit: 0
    });

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
            const newStockValue = Math.max(0, parseInt(item.currentStock) + adjustment);
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

    const handleEditItem = (item) => {
        setItemFormData(item);
        setIsEditing(true);
        setShowItemForm(true);
    };

    const handleAddNew = () => {
        setItemFormData({
            id: '',
            name: '',
            category: 'base',
            currentStock: 0,
            unit: 'pieces',
            minStock: 10,
            costPerUnit: 0
        });
        setIsEditing(false);
        setShowItemForm(true);
    };

    const handleSaveItem = async () => {
        try {
            if (isEditing) {
                await InventoryService.updateItemDetails(itemFormData.id, itemFormData);
            } else {
                await InventoryService.addItem(itemFormData);
            }
            setShowItemForm(false);
        } catch (error) {
            console.error("Failed to save item:", error);
            alert("Failed to save item. Please try again.");
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item? This cannot be undone.")) {
            await InventoryService.deleteItem(itemId);
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

    // Filter valid categories (in case of old data)
    // const validCategories = ['base', 'sauce', 'topping', 'bakery', 'dairy', 'produce', 'pantry', 'packaging'];

    // Group dynamically
    const groupedInventory = inventory.reduce((acc, item) => {
        const cat = item.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

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
                <div>
                    <h2 style={{ margin: 0 }}>📦 Inventory Management</h2>
                    <div onClick={() => navigate('/admin')} style={{ ...styles.backLink, cursor: 'pointer' }}>← Back to Dashboard</div>
                </div>
                {activeTab === 'inventory' && (
                    <button style={styles.addBtn} onClick={handleAddNew}>
                        <Plus size={20} /> Add New Item
                    </button>
                )}
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
                <div style={styles.menuGrid}>
                    {PREBUILT_COMBOS.map(combo => {
                        const isAvailable = menuAvailability[combo.id] !== false;
                        return (
                            <div key={combo.id} style={{
                                ...styles.menuCard,
                                opacity: isAvailable ? 1 : 0.8,
                                filter: isAvailable ? 'none' : 'grayscale(100%)',
                                transform: isAvailable ? 'scale(1)' : 'scale(0.98)'
                            }}>
                                <div style={styles.menuImageContainer}>
                                    <img
                                        src={combo.image}
                                        alt={combo.name}
                                        style={styles.menuImage}
                                    />
                                    <div style={{
                                        ...styles.statusChip,
                                        background: isAvailable ? '#4CAF50' : '#9E9E9E'
                                    }}>
                                        {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                                    </div>
                                </div>
                                <div style={styles.menuContent}>
                                    <h3 style={styles.menuTitle}>{combo.name}</h3>
                                    <p style={styles.menuPrice}>₹{combo.price}</p>

                                    <button
                                        onClick={() => handleToggleAvailability(combo.id)}
                                        style={{
                                            ...styles.toggleBtn,
                                            background: isAvailable ? '#E8F5E9' : '#F5F5F5',
                                            color: isAvailable ? '#2E7D32' : '#757575',
                                            border: isAvailable ? '1px solid #A5D6A7' : '1px solid #E0E0E0'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            justifyContent: 'center',
                                            width: '100%'
                                        }}>
                                            {isAvailable ? <ToggleRight size={22} fill="#4CAF50" /> : <ToggleLeft size={22} />}
                                            <span>{isAvailable ? 'On Menu' : 'Hidden'}</span>
                                        </div>
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
                                {category.charAt(0).toUpperCase() + category.slice(1)}s
                            </h3>
                            <div style={styles.itemsGrid}>
                                {items.map(item => {
                                    const colors = getStockColor(item);
                                    const status = getStockStatus(item);
                                    const isQuickEditing = editingItem === item.id;

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
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleEditItem(item)}
                                                        style={styles.iconBtn}
                                                        title="Edit Details"
                                                    >
                                                        <span>✏️</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        style={styles.iconBtn}
                                                        title="Delete Item"
                                                    >
                                                        <span>🗑️</span>
                                                    </button>
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

                                            {isQuickEditing ? (
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

            {/* Add/Edit Modal */}
            {showItemForm && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3>{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
                            <button onClick={() => setShowItemForm(false)} style={styles.closeBtn}><span>✕</span></button>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Item Name</label>
                            <input
                                style={styles.input}
                                value={itemFormData.name}
                                onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })}
                                placeholder="e.g., Chocolate Syrup"
                            />
                        </div>
                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Category</label>
                                <select
                                    style={styles.select}
                                    value={itemFormData.category}
                                    onChange={e => setItemFormData({ ...itemFormData, category: e.target.value })}
                                >
                                    <option value="base">Base</option>
                                    <option value="sauce">Sauce</option>
                                    <option value="topping">Topping</option>
                                    <option value="bakery">Bakery</option>
                                    <option value="dairy">Dairy</option>
                                    <option value="produce">Produce</option>
                                    <option value="pantry">Pantry</option>
                                    <option value="packaging">Packaging</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Unit</label>
                                <select
                                    style={styles.select}
                                    value={itemFormData.unit}
                                    onChange={e => setItemFormData({ ...itemFormData, unit: e.target.value })}
                                >
                                    <option value="pieces">Pieces</option>
                                    <option value="grams">Grams</option>
                                    <option value="ml">ml</option>
                                    <option value="scoops">Scoops</option>
                                    <option value="servings">Servings</option>
                                </select>
                            </div>
                        </div>
                        <div style={styles.row}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Current Stock</label>
                                <input
                                    type="number"
                                    style={styles.input}
                                    value={itemFormData.currentStock}
                                    onChange={e => setItemFormData({ ...itemFormData, currentStock: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Min Alert Stock</label>
                                <input
                                    type="number"
                                    style={styles.input}
                                    value={itemFormData.minStock}
                                    onChange={e => setItemFormData({ ...itemFormData, minStock: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Cost Per Unit (₹)</label>
                            <input
                                type="number"
                                step="0.1"
                                style={styles.input}
                                value={itemFormData.costPerUnit}
                                onChange={e => setItemFormData({ ...itemFormData, costPerUnit: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <button style={styles.submitBtn} onClick={handleSaveItem}>
                            {isEditing ? 'Save Changes' : 'Add Item'}
                        </button>
                    </div>
                </div>
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
        fontSize: '0.9rem',
        display: 'block',
        marginTop: '0.25rem'
    },
    addBtn: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
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
        transition: 'transform 0.2s ease',
        position: 'relative'
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
        fontSize: '1.1rem',
        maxWidth: '65%'
    },
    iconBtn: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s'
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
    },
    // Modal Styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(5px)'
    },
    modal: {
        background: 'white',
        padding: '2rem',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    formGroup: {
        marginBottom: '1rem',
        width: '100%'
    },
    row: {
        display: 'flex',
        gap: '1rem'
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#475569'
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '1rem',
        outline: 'none',
        marginTop: '0.25rem'
    },
    select: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '1rem',
        outline: 'none',
        marginTop: '0.25rem',
        background: 'white'
    },
    submitBtn: {
        width: '100%',
        padding: '1rem',
        marginTop: '1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        fontWeight: '700',
        fontSize: '1rem',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    // New Menu Redesign Styles
    menuGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        padding: '0.5rem'
    },
    menuCard: {
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
    },
    menuImageContainer: {
        height: '180px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
    },
    menuImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.5s ease'
    },
    statusChip: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        padding: '4px 12px',
        borderRadius: '20px',
        color: 'white',
        fontSize: '0.7rem',
        fontWeight: '800',
        letterSpacing: '0.5px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
    },
    menuContent: {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flex: 1
    },
    menuTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        margin: 0,
        color: '#1a1a1a',
        letterSpacing: '-0.5px'
    },
    menuPrice: {
        fontSize: '1.1rem',
        color: '#666',
        fontWeight: '500',
        margin: '0 0 1rem 0'
    },
    toggleBtn: {
        marginTop: 'auto',
        padding: '0.75rem',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '600',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export default Inventory;
