import React from 'react';
import { PREBUILT_COMBOS } from '../data/menu';
import { useCart } from '../context/CartContext';
import { Plus } from 'lucide-react';

const ComboList = () => {
    const { addToCart } = useCart();

    return (
        <section style={styles.section} id="combos">
            <h2 style={styles.heading}>Crafted for You 🍫</h2>
            <div style={styles.grid}>
                {PREBUILT_COMBOS.map(combo => (
                    <div key={combo.id} style={styles.card}>
                        <div style={styles.imageContainer}>
                            <img src={combo.image} alt={combo.name} style={styles.image} />
                            <div style={styles.priceTag}>₹{combo.price}</div>
                        </div>
                        <div style={styles.info}>
                            <h3 style={styles.name}>{combo.name}</h3>
                            <p style={styles.desc}>{combo.description}</p>
                            <button
                                style={styles.addBtn}
                                onClick={() => addToCart({ ...combo, type: 'COMBO' })}
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    </div>
                ))}
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
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '1rem'
    },
    card: {
        background: 'var(--white)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column'
    },
    imageContainer: {
        position: 'relative',
        height: '120px'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    priceTag: {
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        background: 'var(--white)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm)',
        fontWeight: '700',
        fontSize: '0.9rem',
        boxShadow: 'var(--shadow-sm)'
    },
    info: {
        padding: '0.75rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    name: {
        fontSize: '1rem',
        marginBottom: '0.25rem'
    },
    desc: {
        color: 'var(--text-gray)',
        fontSize: '0.75rem',
        marginBottom: '0.75rem',
        flex: 1
    },
    addBtn: {
        background: 'var(--gray)',
        color: 'var(--dark)',
        width: '100%',
        padding: '0.5rem',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        fontWeight: 600,
        transition: 'var(--transition)'
    }
};

export default ComboList;
