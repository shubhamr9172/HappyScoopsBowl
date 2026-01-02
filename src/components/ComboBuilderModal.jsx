import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { PREBUILT_COMBOS } from '../data/menu'; // Actually items

const ComboBuilderModal = ({ isOpen, onClose, comboModule, onAdd }) => {
    const [selectedItems, setSelectedItems] = useState([]);

    // Reset selection when modal opens with new module
    useEffect(() => {
        if (isOpen) {
            setSelectedItems([]);
        }
    }, [isOpen, comboModule]);

    if (!isOpen || !comboModule) return null;

    const { config, headline, subtext, pricingDisplay } = comboModule;
    const allItems = PREBUILT_COMBOS; // Alias for clarity

    // Get selectable options based on config
    const options = config.allowedItemIds
        ? allItems.filter(item => config.allowedItemIds.includes(item.id))
        : [];

    const handleSelect = (item) => {
        if (config.type === '1_PLUS_FIXED') {
            // Single selection implies replacing current selection or just setting it
            setSelectedItems([item]);
        } else if (config.type === 'SELECT_2_FROM_SET') {
            // Toggle selection
            if (selectedItems.find(i => i.id === item.id)) {
                setSelectedItems(prev => prev.filter(i => i.id !== item.id));
            } else {
                if (selectedItems.length < 2) {
                    setSelectedItems(prev => [...prev, item]);
                } else {
                    // Maybe replace the first one? Or just don't allow > 2
                    // Let's replace the first one for smoother UX or just alert?
                    // "Pick Your Two" -> Let's enforce limit.
                    // Better UX: If 2 selected, clicking unselected does nothing or replaces oldest?
                    // Let's just block and show hint. Or replaces first.
                    // I will make it replace the first one to be "Speed Mode".
                    setSelectedItems(prev => [prev[1], item]);
                }
            }
        }
    };

    const isComplete = () => {
        if (config.type === '1_PLUS_FIXED') return selectedItems.length === 1;
        if (config.type === 'SELECT_2_FROM_SET') return selectedItems.length === 2;
        return true; // Fixed bundle
    };

    const handleAdd = () => {
        if (!isComplete()) return;

        let finalItems = [];
        if (config.type === '1_PLUS_FIXED') {
            const fixedItem = allItems.find(i => i.id === config.fixedItemId);
            finalItems = [...selectedItems, fixedItem];
        } else if (config.type === 'SELECT_2_FROM_SET') {
            finalItems = [...selectedItems];
        } else if (config.type === 'FIXED_BUNDLE') {
            config.items.forEach(id => {
                const item = allItems.find(i => i.id === id);
                if (item) finalItems.push(item);
            });
        }

        onAdd({
            ...comboModule,
            selectedItems: finalItems
        });
        onClose();
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button style={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>

                <div style={styles.header}>
                    <h2 style={styles.title}>{headline}</h2>
                    <p style={styles.subtext}>{subtext}</p>
                </div>

                <div style={styles.content}>
                    {config.type === 'FIXED_BUNDLE' ? (
                        <div style={{ padding: '1rem 0' }}>
                            <div style={styles.bundleItemsBox}>
                                <div style={styles.bundleTitle}>This bundle includes:</div>
                                <div style={styles.bundleItems}>
                                    {config.items.map(itemId => {
                                        const item = allItems.find(i => i.id === itemId);
                                        return (
                                            <div key={itemId} style={styles.bundleItem}>
                                                <div style={styles.bundleItemIcon}>✓</div>
                                                <div>
                                                    <div style={styles.bundleItemName}>{item?.name}</div>
                                                    <div style={styles.bundleItemPrice}>₹{item?.price}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p style={styles.instruction}>
                                {config.type === '1_PLUS_FIXED' ? 'Select your Bowl:' : 'Pick 2 items:'}
                            </p>
                            <div style={styles.grid}>
                                {options.map(item => {
                                    const isSelected = selectedItems.find(i => i.id === item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                ...styles.optionCard,
                                                ...(isSelected ? styles.selectedCard : {})
                                            }}
                                            onClick={() => handleSelect(item)}
                                        >
                                            <img src={item.image} alt={item.name} style={styles.optionImg} />
                                            <div style={styles.optionInfo}>
                                                <div style={styles.optionName}>{item.name}</div>
                                                {isSelected && <div style={styles.checkBadge}><Check size={12} /></div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div style={styles.footer}>
                    <div style={styles.priceContainer}>
                        <span style={styles.originalPrice}>₹{pricingDisplay.original}</span>
                        <span style={styles.currentPrice}>₹{pricingDisplay.current}</span>
                    </div>
                    <button
                        style={{
                            ...styles.addBtn,
                            opacity: isComplete() ? 1 : 0.5,
                            cursor: isComplete() ? 'pointer' : 'not-allowed'
                        }}
                        onClick={handleAdd}
                        disabled={!isComplete()}
                    >
                        Add to Order
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        padding: '1rem'
    },
    modal: {
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '0',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    },
    closeBtn: {
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(0, 0, 0, 0.1)',
        border: 'none',
        color: '#2c3e50',
        cursor: 'pointer',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        zIndex: 10
    },
    header: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem 1.5rem',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        color: 'white',
        textAlign: 'center'
    },
    title: {
        fontSize: '2rem',
        fontWeight: '800',
        margin: '0 0 8px 0',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },
    subtext: {
        fontSize: '1rem',
        opacity: 0.95,
        margin: 0
    },
    content: {
        padding: '2rem 1.5rem'
    },
    bundleItemsBox: {
        background: '#f8f9fa',
        borderRadius: '16px',
        padding: '1.5rem'
    },
    bundleTitle: {
        color: '#2c3e50',
        fontWeight: '700',
        fontSize: '1.1rem',
        marginBottom: '1rem',
        textAlign: 'center'
    },
    bundleItems: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    bundleItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'white',
        padding: '1rem',
        borderRadius: '12px',
        border: '2px solid #e9ecef'
    },
    bundleItemIcon: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '1.1rem'
    },
    bundleItemName: {
        color: '#2c3e50',
        fontWeight: '700',
        fontSize: '1rem'
    },
    bundleItemPrice: {
        color: '#667eea',
        fontSize: '0.9rem',
        fontWeight: '600'
    },
    instruction: {
        color: '#2c3e50',
        fontWeight: '700',
        marginBottom: '1rem',
        fontSize: '1.1rem'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    optionCard: {
        background: '#f8f9fa',
        borderRadius: '16px',
        padding: '1rem',
        cursor: 'pointer',
        border: '3px solid transparent',
        transition: 'all 0.2s',
        position: 'relative'
    },
    selectedCard: {
        borderColor: '#667eea',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        transform: 'scale(1.02)'
    },
    optionImg: {
        width: '100%',
        aspectRatio: '1/1',
        objectFit: 'cover',
        borderRadius: '12px',
        marginBottom: '8px'
    },
    optionInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    optionName: {
        color: '#2c3e50',
        fontSize: '0.9rem',
        fontWeight: '700'
    },
    checkBadge: {
        background: '#667eea',
        color: 'white',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem',
        borderTop: '2px solid #f1f3f5',
        background: '#f8f9fa',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px'
    },
    priceContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    originalPrice: {
        textDecoration: 'line-through',
        color: '#95a5a6',
        fontSize: '0.9rem'
    },
    currentPrice: {
        color: '#667eea',
        fontSize: '2rem',
        fontWeight: '800'
    },
    addBtn: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '1rem 2rem',
        borderRadius: '50px',
        fontSize: '1rem',
        fontWeight: '700',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

export default ComboBuilderModal;
