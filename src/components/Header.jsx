import React from 'react';
import { ShoppingBag, Settings } from 'lucide-react';
import { useCart } from '../context/CartContext';
import logo from '../assets/logo.png';

const Header = () => {
    const { cartCount, setIsCartOpen } = useCart();

    return (
        <header style={styles.header}>
            <div onClick={() => window.location.href = '/'} style={{ ...styles.logo, cursor: 'pointer' }}>
                <img
                    src={logo}
                    alt="Happy Scoops"
                    style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px' }}
                />
                <h1 style={{ ...styles.brand, fontSize: '1.5rem', margin: 0 }}>Happy Scoops</h1>
            </div>

            <div style={styles.headerButtons}>
                <button
                    style={styles.adminBtn}
                    onClick={() => window.location.href = '/admin'}
                    title="Admin Dashboard"
                >
                    <Settings size={20} color="#666" />
                </button>

                <button style={styles.cartBtn} onClick={() => setIsCartOpen(true)}>
                    <ShoppingBag size={24} color="var(--dark)" />
                    {cartCount > 0 && (
                        <span style={styles.badge}>{cartCount}</span>
                    )}
                </button>
            </div>
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
    headerButtons: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    adminBtn: {
        padding: '0.5rem',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        opacity: 0.6
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
