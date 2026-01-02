import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { PRICING_CONFIG } from '../data/menu';

const MiniBanner = ({ onBannerClick }) => {
    // Get Hinjewadi Hustle details if available
    const hustleConfig = PRICING_CONFIG.combos?.hinjewadiHustle;
    const price = hustleConfig?.discountedTotal || 79;

    return (
        <div style={styles.container} onClick={onBannerClick}>
            <div style={styles.content}>
                <div style={styles.badge}>
                    <Sparkles size={14} fill="currentColor" /> Deal of the Day
                </div>
                <h3 style={styles.title}>
                    Hinjewadi Hustle <span style={styles.highlight}>@ ₹{price}</span>
                </h3>
                <p style={styles.subtext}>
                    Late night study? Grab a brownie + hot choco!
                </p>
            </div>
            <div style={styles.action}>
                <span style={styles.btnText}>Grab It</span>
                <div style={styles.iconCircle}>
                    <ArrowRight size={16} color="#667EEA" />
                </div>
            </div>

            {/* Background Decor Elements */}
            <div style={styles.circle1}></div>
            <div style={styles.circle2}></div>
        </div>
    );
};

const styles = {
    container: {
        margin: '1rem 1.25rem 0 1.25rem',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #667EEA 0%, #764ba2 100%)',
        padding: '1.5rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 25px -5px rgba(102, 126, 234, 0.4)',
        transition: 'transform 0.2s ease',
    },
    content: {
        position: 'relative',
        zIndex: 2,
        flex: 1
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px',
        border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    title: {
        margin: 0,
        fontSize: '1.4rem',
        fontWeight: '800',
        lineHeight: 1.2,
        marginBottom: '4px',
        color: 'white'
    },
    highlight: {
        color: '#F59E0B', // Gold
        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    subtext: {
        margin: 0,
        fontSize: '0.85rem',
        opacity: 0.9,
        fontWeight: '400'
    },
    action: {
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        marginLeft: '1rem'
    },
    btnText: {
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    iconCircle: {
        width: '36px',
        height: '36px',
        background: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    // Decorative circles
    circle1: {
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: 1
    },
    circle2: {
        position: 'absolute',
        bottom: '-30px',
        left: '20%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: 1
    }
};

export default MiniBanner;
