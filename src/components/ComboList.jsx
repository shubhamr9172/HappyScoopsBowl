import React, { useState, useEffect } from 'react';
import { COMBO_MODULES, PREBUILT_COMBOS, PRICING_CONFIG } from '../data/menu';
import { useCart } from '../context/CartContext';
import { Plus, Clock, Verified, Sparkles, UtensilsCrossed, Gift } from 'lucide-react';
import { isItemAvailable, getAvailabilityMessage } from '../utils/pricingUtils';
import { InventoryService } from '../services/inventoryService';
import ComboBuilderModal from './ComboBuilderModal';
import BowlBuilder from './BowlBuilder';

const ComboList = ({ activeTab, setActiveTab }) => {
    const { addToCart } = useCart();
    const [menuAvailability, setMenuAvailability] = useState({});
    const [activeModule, setActiveModule] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    // Internal state removed, using props now

    useEffect(() => {
        const loadAvailability = async () => {
            const avail = await InventoryService.getMenuAvailability();
            setMenuAvailability(avail);
        };
        loadAvailability();

        const handleStorageChange = () => {
            loadAvailability();
        };

        window.addEventListener('menu-availability-updated', handleStorageChange);
        return () => window.removeEventListener('menu-availability-updated', handleStorageChange);
    }, []);

    const handleModuleClick = (module) => {
        setActiveModule(module);
    };

    const handleModalAdd = (result) => {
        if (result && result.selectedItems) {
            result.selectedItems.forEach(item => {
                addToCart(item);
            });
        }
    };

    const getTierBadge = (tier) => {
        const tierInfo = PRICING_CONFIG.tiers[tier];
        if (!tierInfo) return null;

        return {
            label: tierInfo.label,
            color: tierInfo.color
        };
    };

    return (
        <section style={styles.section} id="combos">
            {/* Navigation Tabs */}
            <div style={styles.navContainer}>
                <button
                    style={{ ...styles.navButton, ...(activeTab === 'combo' ? styles.activeNavButton : {}) }}
                    onClick={() => setActiveTab('combo')}
                >
                    <Gift size={18} />
                    <span>Combo Deals</span>
                </button>
                <button
                    style={{ ...styles.navButton, ...(activeTab === 'normal' ? styles.activeNavButton : {}) }}
                    onClick={() => setActiveTab('normal')}
                >
                    <UtensilsCrossed size={18} />
                    <span>Our Menu</span>
                </button>
                <button
                    style={{ ...styles.navButton, ...(activeTab === 'custom' ? styles.activeNavButton : {}) }}
                    onClick={() => setActiveTab('custom')}
                >
                    <Sparkles size={18} />
                    <span>Build Your Own</span>
                </button>
            </div>

            {/* Combo Section */}
            {activeTab === 'combo' && (
                <>
                    <div style={styles.headerWrapper}>
                        <h2 style={styles.gradientHeading}>
                            Special Combo Deals
                        </h2>
                        <div style={styles.decorativeLine}></div>
                        <p style={styles.premiumSubtitle}>CURATED BUNDLES FOR MAXIMUM DELIGHT</p>
                    </div>
                    <div style={styles.grid}>
                        {COMBO_MODULES.map((module, idx) => {
                            let isAvailable = true;
                            const hotChoco = PREBUILT_COMBOS.find(i => i.id === 3);
                            if (module.code === 'HINJEWADI_HUSTLE' && hotChoco) {
                                isAvailable = isItemAvailable(hotChoco);
                            }
                            if (menuAvailability[module.id] === false) isAvailable = false;

                            // Gradient colors for each card
                            const gradients = [
                                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                            ];



                            return (
                                <div
                                    key={module.id}
                                    style={{
                                        ...styles.comboCard,
                                        background: isAvailable ? gradients[idx % 3] : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                                        cursor: isAvailable ? 'pointer' : 'default',
                                        transform: isAvailable && hoveredId === module.id ? 'translateY(-4px)' : 'none',
                                        boxShadow: isAvailable && hoveredId === module.id ? '0 12px 24px rgba(102, 126, 234, 0.25)' : styles.comboCard.boxShadow,
                                        border: 'none',
                                        color: 'white' // Force white text inheritance
                                    }}
                                    onMouseEnter={() => isAvailable && setHoveredId(module.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => isAvailable && handleModuleClick(module)}
                                >
                                    {/* Badge */}
                                    <div style={styles.badge}>
                                        <Verified size={14} />
                                        <span>Best Deal</span>
                                    </div>

                                    {/* Content */}
                                    <div style={{ ...styles.comboContent, padding: '1rem' }}>
                                        <h3 style={{
                                            ...styles.comboTitle,
                                            color: 'white',
                                            fontSize: '2rem',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {module.headline}
                                        </h3>
                                        <p style={{
                                            ...styles.comboSubtext,
                                            color: 'rgba(255, 255, 255, 0.95)',
                                            fontWeight: '500',
                                            letterSpacing: '0.5px',
                                            marginBottom: '2rem'
                                        }}>
                                            {module.subtext}
                                        </p>

                                        {/* What's Included */}
                                        <div style={{
                                            ...styles.includesBox,
                                            background: 'rgba(255, 255, 255, 0.15)',
                                            border: '1px solid rgba(255, 255, 255, 0.4)',
                                            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 4px 15px rgba(0,0,0,0.05)',
                                            backdropFilter: 'blur(12px)'
                                        }}>
                                            <div style={{ ...styles.includesHeader, borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }}>
                                                <span style={styles.includesIcon}>📋</span>
                                                <span style={{ ...styles.includesTitle, color: 'white' }}>What's Included</span>
                                            </div>
                                            {module.code === 'HINJEWADI_HUSTLE' && (
                                                <div style={styles.includesContent}>
                                                    <div style={{ ...styles.includeStep, color: 'white' }}>Your choice of:</div>
                                                    <div style={styles.includeOptions}>
                                                        <div style={{ ...styles.includeOption, color: 'white' }}>• Banana Choco Tub</div>
                                                        <div style={{ ...styles.includeOption, color: 'white' }}>• OG Brownie Tub</div>
                                                    </div>
                                                    <div style={{ ...styles.includePlus, color: 'white' }}>+</div>
                                                    <div style={{ ...styles.includeFixed, color: 'white' }}>Student Hot Choco</div>
                                                </div>
                                            )}
                                            {module.code === 'DREAMY_DUO' && (
                                                <div style={styles.includesContent}>
                                                    <div style={{ ...styles.includeStep, color: 'white' }}>Pick ANY 2 from:</div>
                                                    <div style={styles.includeOptions}>
                                                        <div style={{ ...styles.includeOption, color: 'white' }}>• Triple Treat Tub (₹50)</div>
                                                        <div style={{ ...styles.includeOption, color: 'white' }}>• Cold Choco Shot (₹50)</div>
                                                        <div style={{ ...styles.includeOption, color: 'white' }}>• Oreo Midnight Tub (₹59)</div>
                                                    </div>
                                                </div>
                                            )}
                                            {module.code === 'ULTIMATE_ESCAPE' && (
                                                <div style={styles.includesContent}>
                                                    <div style={styles.includeOptions}>
                                                        <div style={{ ...styles.includeOption, color: 'white' }}>✓ The Ultimate Dreamy Bowl (₹129)</div>
                                                        <div style={{ ...styles.includePlus, color: 'white' }}>+</div>
                                                        <div style={{ ...styles.includeOption, color: 'white' }}>✓ Student Hot Choco (₹40)</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pricing */}
                                        <div style={{ ...styles.pricingBox, background: 'rgba(255, 255, 255, 0.2)' }}>
                                            <div style={styles.savingsBadge}>
                                                💰 Save ₹{module.pricingDisplay.save}
                                            </div>
                                            <div style={styles.priceRow}>
                                                <span style={{ ...styles.oldPrice, color: 'rgba(255, 255, 255, 0.7)' }}>₹{module.pricingDisplay.original}</span>
                                                <span style={{ ...styles.newPrice, color: 'white' }}>₹{module.pricingDisplay.current}</span>
                                            </div>
                                        </div>


                                        {/* CTA Button */}
                                        <button style={{
                                            ...styles.ctaButton,
                                            marginTop: 'auto', // Pushes button to bottom
                                            width: '100%', // FORCE FULL WIDTH
                                            background: 'white',
                                            color: '#1a202c',
                                            padding: '1.2rem', // Taller button
                                            borderRadius: '99px',
                                            border: 'none',
                                            fontSize: '0.95rem',
                                            fontWeight: '800',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', // Deeper shadow
                                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            opacity: isAvailable ? 1 : 0.6,
                                            letterSpacing: '1px' // Premium spacing
                                        }} disabled={!isAvailable}>
                                            {isAvailable ? (
                                                <>
                                                    <Plus size={20} fill="currentColor" strokeWidth={3} />
                                                    {isAvailable ? 'CONFIGURE DEAL' : 'UNAVAILABLE'}
                                                </>
                                            ) : 'Temporarily Out of Stock'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <ComboBuilderModal
                isOpen={!!activeModule}
                comboModule={activeModule}
                onClose={() => setActiveModule(null)}
                onAdd={handleModalAdd}
            />

            {/* Individual Menu Items (Normal Menu) */}
            {activeTab === 'normal' && (
                <div style={{ marginTop: '3rem' }}>
                    <div style={styles.headerWrapper}>
                        <h2 style={styles.gradientHeading}>
                            Signature Menu
                        </h2>
                        <div style={styles.decorativeLine}></div>
                        <p style={styles.premiumSubtitle}>HANDCRAFTED BOWLS & TREATS</p>
                    </div>

                    <div style={styles.menuGrid}>
                        {PREBUILT_COMBOS.map(combo => {
                            const isTimeAvailable = isItemAvailable(combo);
                            const isManualAvailable = menuAvailability[combo.id] !== false;
                            const available = isTimeAvailable && isManualAvailable;
                            const availabilityMsg = getAvailabilityMessage(combo);
                            const tierBadge = getTierBadge(combo.tier);

                            return (
                                <div
                                    key={combo.id}
                                    style={{
                                        ...styles.menuCard,
                                        opacity: available ? 1 : 0.7,
                                        transform: available && hoveredId === combo.id ? 'translateY(-5px)' : 'none',
                                        boxShadow: available && hoveredId === combo.id ? '0 0 0 3px #667eea, 0 20px 25px -5px rgba(0, 0, 0, 0.1)' : styles.menuCard.boxShadow,
                                        border: available && hoveredId === combo.id ? 'none' : '3px solid transparent'
                                    }}
                                    onMouseEnter={() => available && setHoveredId(combo.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <div style={styles.menuImageContainer}>
                                        <img src={combo.image} alt={combo.name} style={styles.menuImage} />
                                        {tierBadge && (
                                            <div style={{
                                                ...styles.tierBadge,
                                                background: tierBadge.color
                                            }}>
                                                {tierBadge.label}
                                            </div>
                                        )}
                                    </div>

                                    <div style={styles.menuContent}>
                                        <h3 style={styles.menuTitle}>{combo.name}</h3>
                                        <p style={styles.description}>{combo.description}</p>

                                        {availabilityMsg && (
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: available ? '#2ecc71' : '#e74c3c',
                                                marginBottom: '0.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <Clock size={14} />
                                                {availabilityMsg}
                                            </div>
                                        )}

                                        <div style={styles.menuPrice}>₹{combo.price}</div>

                                        <button
                                            style={{
                                                ...styles.menuAddButton,
                                                opacity: available ? 1 : 0.5,
                                                cursor: available ? 'pointer' : 'not-allowed'
                                            }}
                                            onClick={() => available && addToCart(combo)}
                                            disabled={!available}
                                        >
                                            {available ? (
                                                <>
                                                    <Plus size={18} />
                                                    Add to Cart
                                                </>
                                            ) : 'Unavailable'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Custom Bowl Builder */}
            {activeTab === 'custom' && (
                <div style={{ marginTop: '2rem' }}>
                    <BowlBuilder />
                </div>
            )}
        </section>
    );
};

const styles = {
    section: {
        padding: '1.25rem',
        minHeight: '80vh',
        maxWidth: '480px',
        margin: '0 auto',
        paddingBottom: '100px'
    },
    navContainer: {
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '2rem',
        background: 'white',
        padding: '0.4rem',
        borderRadius: '99px',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
        border: '1px solid rgba(102, 126, 234, 0.1)'
    },
    navButton: {
        flex: 1,
        padding: '0.7rem 0.5rem',
        borderRadius: '99px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        background: 'transparent',
        color: '#718096',
        fontWeight: '600',
        fontSize: '0.85rem',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    },
    activeNavButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontWeight: '700',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem'
    },
    headerWrapper: {
        marginBottom: '2rem',
        textAlign: 'center'
    },
    gradientHeading: {
        fontSize: '1.75rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.5rem',
        textAlign: 'center',
        paddingBottom: '0.2rem'
    },
    premiumSubtitle: {
        textAlign: 'center',
        fontSize: '0.7rem',
        color: '#718096',
        fontWeight: '600',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginTop: '0.8rem'
    },
    decorativeLine: {
        height: '3px',
        width: '60px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        margin: '0 auto',
        borderRadius: '2px',
        opacity: 0.8
    },
    comboCard: {
        background: 'white',
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column'
    },
    badge: {
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        padding: '0.4rem 0.8rem',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '50px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        fontSize: '0.75rem',
        fontWeight: '800',
        color: '#d69e2e',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        zIndex: 5,
        backdropFilter: 'blur(4px)'
    },
    comboContent: {
        textAlign: 'center',
        marginBottom: '1.5rem'
    },
    comboTitle: {
        fontSize: '1.75rem',
        fontWeight: '800',
        marginBottom: '0.5rem',
        color: '#2d3748',
        lineHeight: '1.2'
    },
    comboSubtext: {
        fontSize: '0.95rem',
        marginBottom: '1.5rem',
        color: '#718096',
        lineHeight: '1.5'
    },
    card: {
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid rgba(102, 126, 234, 0.05)',
        willChange: 'transform, box-shadow',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        position: 'relative'
    },
    imageContainer: {
        position: 'relative',
        height: '180px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        transition: 'transform 0.3s ease'
    },
    menuImageContainer: {
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)'
    },
    menuImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        transition: 'transform 0.5s ease'
    },
    info: {
        padding: '1.25rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    name: {
        fontSize: '1.15rem',
        fontWeight: '700',
        color: '#1a202c',
        lineHeight: '1.3',
        minHeight: '2.6rem',
        display: 'flex',
        alignItems: 'center'
    },
    description: {
        color: '#718096',
        fontSize: '0.75rem'
    },
    itemTier: {
        fontSize: '0.7rem',
        color: '#764ba2',
        fontWeight: '700',
        padding: '4px 8px',
        background: 'rgba(118, 75, 162, 0.1)',
        borderRadius: '6px',
        width: 'fit-content',
        border: '1px solid rgba(118, 75, 162, 0.1)'
    },
    priceTag: {
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        background: 'white',
        padding: '8px 14px',
        borderRadius: '24px',
        fontWeight: '700',
        fontSize: '1.1rem',
        color: '#1a202c',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    },
    addBtn: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        width: '100%',
        padding: '0.85rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: 700,
        fontSize: '1rem',
        transition: 'all 0.2s ease',
        border: 'none',
        minHeight: '48px',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    menuAddButton: {
        width: '100%',
        padding: '0.875rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    includesBox: {
        background: 'rgba(102, 126, 234, 0.05)',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(102, 126, 234, 0.1)'
    },
    includesTitle: {
        color: '#764ba2',
        fontWeight: '800',
        fontSize: '0.95rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    includeStep: {
        color: '#2d3748',
        fontSize: '0.9rem',
        fontWeight: '600'
    },
    includeOption: {
        color: '#4a5568',
        fontSize: '0.95rem',
        fontWeight: '500',
        lineHeight: '1.6'
    },
    includePlus: {
        color: '#667eea',
        fontSize: '1.2rem',
        fontWeight: '800',
        textAlign: 'center',
        margin: '0.25rem 0'
    },
    includeFixed: {
        color: '#4a5568',
        fontSize: '0.95rem',
        fontWeight: '600',
        paddingLeft: '0.5rem'
    },
    // Pricing Styles (Restored & Upgraded)
    pricingBox: {
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '1rem',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        marginBottom: '1rem'
    },
    savingsBadge: {
        display: 'inline-block',
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        color: '#744210',
        fontWeight: '800',
        fontSize: '0.85rem',
        padding: '4px 12px',
        borderRadius: '20px',
        marginBottom: '0.5rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    priceRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px', // CRITICAL: Adds space between prices
        marginTop: '0.25rem'
    },
    oldPrice: {
        fontSize: '1.2rem',
        textDecoration: 'line-through',
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600'
    },
    newPrice: {
        fontSize: '2.2rem',
        fontWeight: '800',
        color: 'white',
        textShadow: '0 2px 8px rgba(0,0,0,0.15)',
        lineHeight: '1'
    },
    menuGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '2rem'
    },
    menuCard: {
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        border: '1px solid rgba(0,0,0,0.05)'
    },
    menuImageContainer: {
        position: 'relative',
        width: '100%',
        paddingTop: '75%', // 4:3 Aspect Ratio (More landscape friendly)
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)'
    },
    menuImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover', // Fill the container
        transition: 'transform 0.5s ease',
        // padding: '10px' // Removed padding to fill space
    },
    menuContent: {
        padding: '1.5rem'
    },
    menuTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: '0.75rem'
    },
    menuPrice: {
        fontSize: '1.75rem',
        fontWeight: '800',
        color: '#667eea',
        marginBottom: '1rem'
    },
    menuAddButton: {
        width: '100%',
        padding: '0.875rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    tierBadge: {
        position: 'absolute',
        top: '12px',
        left: '12px',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '700',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }
};

export default ComboList;
