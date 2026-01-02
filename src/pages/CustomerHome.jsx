import React, { useState } from 'react';
import Header from '../components/Header';
import MiniBanner from '../components/MiniBanner';
import ComboList from '../components/ComboList';
import BowlBuilder from '../components/BowlBuilder';
import CartModal from '../components/CartModal';

const CustomerHome = () => {
    const [activeTab, setActiveTab] = useState('combo');

    const handleBannerClick = () => {
        setActiveTab('combo');
        // Small timeout to ensure state update processes before scroll (if needed)
        setTimeout(() => {
            const el = document.getElementById('combos');
            if (el) {
                // Scroll with offset for sticky header
                const headerOffset = 100;
                const elementPosition = el.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        }, 50);
    };

    return (
        <div style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
            <Header />
            <MiniBanner onBannerClick={handleBannerClick} />
            <div style={{ paddingTop: '1rem' }}></div>
            <ComboList activeTab={activeTab} setActiveTab={setActiveTab} />
            <CartModal />

            {/* Footer Spacer */}
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.8rem' }}>
                Made with ❤️ in Pune
            </div>
        </div>
    );
};

export default CustomerHome;
