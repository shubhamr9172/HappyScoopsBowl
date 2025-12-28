import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ComboList from '../components/ComboList';
import BowlBuilder from '../components/BowlBuilder';
import CartModal from '../components/CartModal';

const CustomerHome = () => {
    const scrollToBuilder = () => {
        const el = document.getElementById('builder');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div style={{ background: 'var(--light)', minHeight: '100vh' }}>
            <Header />
            <Hero onCtaClick={scrollToBuilder} />
            <ComboList />
            <BowlBuilder />
            <CartModal />

            {/* Footer Spacer */}
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.8rem' }}>
                Made with ❤️ in Pune
            </div>
        </div>
    );
};

export default CustomerHome;
