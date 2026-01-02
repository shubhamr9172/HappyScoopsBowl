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
            <div style={styles.headerWrapper}>
                <h2 style={styles.gradientHeading}>
                    Build Your Own Bowl
                </h2>
                <div style={styles.decorativeLine}></div>
                <p style={styles.premiumSubtitle}>CRAFT YOUR DREAM DESSERT</p>
            </div>

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
    headerWrapper: {
        textAlign: 'center',
        marginBottom: '2.5rem',
        position: 'relative',
        marginTop: '1rem'
    },
    gradientHeading: {
        fontSize: '2.5rem',
        textAlign: 'center',
        marginBottom: '0.75rem',
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: '800',
        letterSpacing: '-1px'
    },
    decorativeLine: {
        width: '60px',
        height: '4px',
        background: 'linear-gradient(90deg, #FFD166 0%, #FFB84D 100%)',
        margin: '0 auto 1rem auto',
        borderRadius: '2px'
    },
    premiumSubtitle: {
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#95a5a6',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        fontWeight: '600'
    },
    heading: {
        marginBottom: '1rem',
        fontSize: '1.5rem',
        color: 'var(--text-dark)',
        fontWeight: '700'
    },
    card: {
        background: 'var(--white)',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
    },
    step: {
        marginBottom: '2rem'
    },
    stepTitle: {
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: 'var(--text-muted)',
        marginBottom: '1rem',
        fontWeight: '700'
    },
    optionsRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    optionsWrap: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem'
    },
    option: {
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        transition: 'all 0.2s',
        fontSize: '1rem',
        color: 'var(--text-body)',
        background: 'var(--bg-light)'
    },
    optionActive: {
        padding: '1rem',
        border: '1px solid var(--primary)',
        background: 'var(--primary-subtle)',
        borderRadius: '12px',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        color: 'var(--text-dark)',
        fontWeight: 600,
        boxShadow: '0 0 0 1px var(--primary)'
    },
    priceMeta: {
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        fontWeight: '500'
    },
    chip: {
        padding: '0.6rem 1.2rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--white)',
        color: 'var(--text-body)'
    },
    chipActive: {
        padding: '0.6rem 1.2rem',
        border: '1px solid var(--primary-dark)',
        background: 'var(--primary)',
        color: 'white',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.9rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 2px 8px rgba(142, 209, 184, 0.4)'
    },
    footer: {
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    buildBtn: {
        background: 'linear-gradient(135deg, #8ED1B8 0%, #6BB89F 100%)',
        color: 'white',
        padding: '0.85rem 1.75rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 12px rgba(142, 209, 184, 0.4)',
        fontWeight: 700,
        fontSize: '1rem',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    }
};

export default BowlBuilder;
