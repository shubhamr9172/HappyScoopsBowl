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
        background: 'linear-gradient(180deg, var(--light) 0%, #FFF0F0 100%)',
        borderBottomLeftRadius: 'var(--radius-lg)',
        borderBottomRightRadius: 'var(--radius-lg)',
        marginBottom: '2rem'
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    tag: {
        background: 'rgba(255, 107, 107, 0.1)',
        color: 'var(--primary)',
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.875rem',
        fontWeight: 600,
        marginBottom: '1rem'
    },
    title: {
        fontSize: '2.5rem',
        lineHeight: 1.1,
        marginBottom: '0.75rem',
        color: 'var(--dark)'
    },
    subtitle: {
        color: 'var(--text-gray)',
        fontSize: '1rem',
        maxWidth: '280px'
    }
};

export default Hero;
