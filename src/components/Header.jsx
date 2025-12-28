import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Header = () => {
    const { cartCount, setIsCartOpen } = useCart();

    return (
        <header style={styles.header}>
            <div style={styles.logo}>
                <img
                    src="/logos/logo_3d_glossy.png"
                    alt="Happy Scoops"
                    style={{ width: '45px', height: '45px', objectFit: 'contain' }}
                />
                <h1 style={{ ...styles.brand, fontSize: '1.5rem', margin: 0 }}>Happy Scoops</h1>
            </div>

            <button style={styles.cartBtn} onClick={() => setIsCartOpen(true)}>
                <ShoppingBag size={24} color="var(--dark)" />
                {cartCount > 0 && (
                    <span style={styles.badge}>{cartCount}</span>
                )}
            </button>
        </header>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    brand: {
        color: 'var(--primary)',
        fontWeight: 700
    },
    cartBtn: {
        position: 'relative',
        padding: '0.5rem'
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        background: 'var(--primary)',
        color: 'white',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
};

export default Header;
