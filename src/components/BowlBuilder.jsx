import React, { useState } from 'react';
import { INGREDIENTS } from '../data/menu';
import { useCart } from '../context/CartContext';
import { Check, ChevronRight } from 'lucide-react';

const BowlBuilder = () => {
    const { addToCart } = useCart();
    // Selection State
    const [base, setBase] = useState(INGREDIENTS.bases[0]);
    const [sauce, setSauce] = useState(INGREDIENTS.sauces[0]);
    const [toppings, setToppings] = useState([]);

    const toggleTopping = (topping) => {
        if (toppings.find(t => t.id === topping.id)) {
            setToppings(toppings.filter(t => t.id !== topping.id));
        } else {
            setToppings([...toppings, topping]);
        }
    };

    const totalPrice = base.price + sauce.price + toppings.reduce((sum, t) => sum + t.price, 0);

    const handleAddToCart = () => {
        const customItem = {
            id: `custom-${Date.now()}`,
            name: 'Custom Creation 🎨',
            description: `${base.name}, ${sauce.name}, ${toppings.map(t => t.name).join(', ')}`,
            price: totalPrice,
            type: 'CUSTOM',
            details: { base, sauce, toppings }
        };
        addToCart(customItem);
        // Feedback via Cart Open
        setToppings([]);
    };

    return (
        <section style={styles.section} id="builder">
            <h2 style={styles.heading}>Build Your Own Bowl 🛠️</h2>

            <div style={styles.card}>
                {/* Steps */}
                <div style={styles.step}>
                    <h4 style={styles.stepTitle}>1. Choose Base</h4>
                    <div style={styles.optionsRow}>
                        {INGREDIENTS.bases.map(item => (
                            <button
                                key={item.id}
                                style={base.id === item.id ? styles.optionActive : styles.option}
                                onClick={() => setBase(item)}
                            >
                                {item.name}
                                <span style={styles.priceMeta}>+₹{item.price}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.step}>
                    <h4 style={styles.stepTitle}>2. Pick Sauce</h4>
                    <div style={styles.optionsRow}>
                        {INGREDIENTS.sauces.map(item => (
                            <button
                                key={item.id}
                                style={sauce.id === item.id ? styles.optionActive : styles.option}
                                onClick={() => setSauce(item)}
                            >
                                {item.name}
                                <span style={styles.priceMeta}>+₹{item.price}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.step}>
                    <h4 style={styles.stepTitle}>3. Add Toppings</h4>
                    <div style={styles.optionsWrap}>
                        {INGREDIENTS.toppings.map(item => {
                            const isSelected = toppings.some(t => t.id === item.id);
                            return (
                                <button
                                    key={item.id}
                                    style={isSelected ? styles.chipActive : styles.chip}
                                    onClick={() => toggleTopping(item)}
                                >
                                    {isSelected && <Check size={14} />} {item.name} (+₹{item.price})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Live Total */}
                <div style={styles.footer}>
                    <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>Total Price</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>₹{totalPrice}</div>
                    </div>
                    <button style={styles.buildBtn} onClick={handleAddToCart}>
                        Add to Order <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
};

const styles = {
    section: {
        padding: '0 1rem 2rem 1rem'
    },
    heading: {
        marginBottom: '1rem',
        fontSize: '1.25rem',
        color: 'var(--dark)'
    },
    card: {
        background: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-md)'
    },
    step: {
        marginBottom: '1.5rem'
    },
    stepTitle: {
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-gray)',
        marginBottom: '0.75rem'
    },
    optionsRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    },
    optionsWrap: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem'
    },
    option: {
        padding: '0.75rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        transition: 'all 0.2s',
        fontSize: '0.95rem'
    },
    optionActive: {
        padding: '0.75rem',
        border: '1px solid var(--primary)',
        background: 'rgba(255, 107, 107, 0.05)',
        borderRadius: 'var(--radius-sm)',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        color: 'var(--primary)',
        fontWeight: 600,
        boxShadow: '0 0 0 1px var(--primary)'
    },
    priceMeta: {
        fontSize: '0.8rem',
        color: 'var(--text-gray)'
    },
    chip: {
        padding: '0.5rem 1rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.875rem',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    chipActive: {
        padding: '0.5rem 1rem',
        border: '1px solid var(--secondary)',
        background: 'var(--secondary)',
        color: 'var(--dark)',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.875rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    footer: {
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--gray)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    buildBtn: {
        background: 'var(--dark)',
        color: 'var(--white)',
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-full)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: 'var(--shadow-lg)'
    }
};

export default BowlBuilder;
