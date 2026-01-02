import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import logo from '../assets/logo.png';

const Header = () => {
    const { cartCount, setIsCartOpen } = useCart();
    const navigate = useNavigate();

    return (
        <header style={styles.header}>
            <div onClick={() => navigate('/')} style={styles.logoContainer}>
                <div style={styles.logoWrapper}>
                    <img
                        src={logo}
                        alt="The Dreamy Bowl"
                        style={styles.logoImage}
                    />
                </div>
                <div style={styles.brandSection}>
                    <h1 style={styles.brandName}>The Dreamy Bowl</h1>
                    <p style={styles.tagline}>Desserts Made with Love</p>
                </div>
            </div>

            <button style={styles.cartBtn} onClick={() => setIsCartOpen(true)}>
                <div style={styles.cartIcon}>
                    <ShoppingBag size={22} color="white" strokeWidth={2.5} />
                    {cartCount > 0 && (
                        <span style={styles.badge}>{cartCount}</span>
                    )}
                </div>
                <span style={styles.cartText}>Cart</span>
            </button>
        </header>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        position: 'sticky',
        top: 0,
        background: 'white',
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)',
        borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
    },
    logoWrapper: {
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        padding: '0.5rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
    },
    logoImage: {
        width: '50px',
        height: '50px',
        objectFit: 'contain',
        borderRadius: '8px'
    },
    brandSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem'
    },
    brandName: {
        margin: 0,
        fontSize: '1.35rem',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: '1.2'
    },
    tagline: {
        margin: 0,
        fontSize: '0.7rem',
        color: '#6b7280',
        fontWeight: '500',
        letterSpacing: '0.3px',
        textTransform: 'uppercase'
    },
    cartBtn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '12px',
        padding: '0.65rem 1rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        minWidth: '70px'
    },
    cartIcon: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    cartText: {
        color: 'white',
        fontSize: '0.7rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    badge: {
        position: 'absolute',
        top: '-6px',
        right: '-6px',
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
        padding: '0 5px',
        border: '2px solid white',
        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
    }
};

export default Header;

