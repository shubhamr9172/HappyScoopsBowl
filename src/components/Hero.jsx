import React from 'react';

const Hero = ({ onCtaClick }) => {
    return (
        <section style={styles.hero}>
            <div style={styles.content}>
                <span style={styles.tag}>✨ Best Dessert in Hinjawadi</span>
                <h1 style={styles.title}>Craft Your <br /> <span className="text-gradient">Dream Bowl</span></h1>
                <p style={styles.subtitle}>Ice cream, brownies, sauces & magic. Starting at ₹129.</p>
                <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={onCtaClick}>
                    Build Your Own 🍦
                </button>
            </div>
        </section>
    );
};

const styles = {
    hero: {
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, var(--bg-mint) 0%, var(--bg-cream) 100%)',
        borderBottomLeftRadius: 'var(--radius-xl)',
        borderBottomRightRadius: 'var(--radius-xl)',
        marginBottom: '2rem'
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    tag: {
        background: 'rgba(142, 209, 184, 0.15)',
        color: 'var(--primary-dark)',
        padding: '0.4rem 1rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.85rem',
        fontWeight: 700,
        marginBottom: '1.25rem',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
    },
    title: {
        fontSize: '2.5rem',
        lineHeight: 1.1,
        marginBottom: '1rem',
        color: 'var(--text-dark)',
        fontWeight: '800'
    },
    subtitle: {
        color: 'var(--text-body)',
        fontSize: '1.1rem',
        maxWidth: '300px',
        lineHeight: '1.5'
    }
};

export default Hero;
