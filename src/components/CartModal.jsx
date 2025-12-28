import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { OrderService } from '../services/orderService';
import upiQr from '../assets/upi_qr.png';

// This is a complex component handling Cart View, Checkout, Payment Simulation, and Bill Receipt.
// For the sake of modularity, usually we split, but for this "Cart Modal" flow it's cohesive.

const CartModal = () => {
    const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, cartTotal, clearCart } = useCart();

    // Checkout States
    // steps: 'CART' -> 'CUSTOMER_INFO' -> 'PAYMENT' -> 'SUCCESS'
    const [step, setStep] = useState('CART');
    const [loading, setLoading] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Close Handler
    const handleClose = () => {
        setIsCartOpen(false);
        setStep('CART'); // Reset immediately so next open is fresh
    };

    if (!isCartOpen) return null;

    const handleCustomerSubmit = () => {
        if (!customerName.trim() || customerName.trim().length < 2) {
            alert("Please enter a valid name (at least 2 characters).");
            return;
        }
        if (!customerPhone.trim() || !/^\d{10}$/.test(customerPhone.trim())) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }
        setStep('PAYMENT');
    };

    const renderCustomerInfo = () => (
        <div style={styles.body}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Almost There! 🍦</h3>
                <p style={{ color: '#666' }}>Who should we call out when it's ready?</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={styles.label}>Your Name</label>
                <input
                    style={styles.input}
                    placeholder="e.g. Rahul"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                />
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={styles.label}>Phone Number</label>
                <input
                    style={styles.input}
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                />
            </div>

            <button style={styles.checkoutBtn} onClick={handleCustomerSubmit}>
                Continue to Payment <ArrowRight size={18} />
            </button>

            <button style={styles.linkBtn} onClick={() => setStep('CART')}>
                Back to Cart
            </button>
        </div>
    );

    // --- Actions ---

    // GST Calculation Config
    const GST_RATE = 0.05; // 5%
    const gstAmount = Math.round(cartTotal * GST_RATE);
    const grandTotal = cartTotal + gstAmount;

    // UPI Link for Dynamic QR
    // VPA: shubhamreddy9172-2@okaxis
    const upiLink = `upi://pay?pa=shubhamreddy9172-2@okaxis&pn=HappyScoops&am=${grandTotal}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;

    const handleConfirmPayment = async () => {
        setLoading(true);
        const orderData = {
            items: cartItems,
            subTotal: cartTotal,
            gst: gstAmount,
            totalAmount: grandTotal,
            customerName,
            customerPhone,
            customerNote: "Self-Order via Web"
        };

        try {
            // Simulate network delay
            await new Promise(r => setTimeout(r, 1500));

            const createdOrder = await OrderService.createOrder(orderData);
            setLastOrder(createdOrder);
            clearCart();
            setStep('SUCCESS');
        } catch (e) {
            alert("Failed to place order. Try again.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- Sub-Views ---

    const renderCartList = () => (
        <>
            <div style={styles.body}>
                {cartItems.length === 0 ? (
                    <div style={styles.empty}>
                        <p>Your bowl is empty 🥣</p>
                        <button style={styles.linkBtn} onClick={handleClose}>Start Ordering</button>
                    </div>
                ) : (
                    cartItems.map(item => (
                        <div key={item.cartId} style={styles.itemRow}>
                            <div style={styles.itemInfo}>
                                <div style={styles.itemName}>{item.name}</div>
                                <div style={styles.itemPrice}>₹{item.price}</div>
                                {item.type === 'CUSTOM' && (
                                    <div style={styles.itemMeta}>
                                        {item.details.base.name} + {item.details.sauce.name}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => removeFromCart(item.cartId)} style={styles.removeBtn}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
            {cartItems.length > 0 && (
                <div style={styles.footer}>
                    <div style={styles.totalRow}>
                        <span>Total</span>
                        <span style={styles.totalVal}>₹{cartTotal}</span>
                    </div>
                    <button style={styles.checkoutBtn} onClick={() => setStep('CUSTOMER_INFO')}>
                        Proceed to Checkout <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </>
    );

    const renderPayment = () => (
        <div style={styles.body}>
            <div style={styles.qrContainer}>
                <h3 style={{ marginBottom: '1rem' }}>Pay ₹{grandTotal}</h3>
                <div style={styles.qrPlaceholder}>
                    {/* Dynamic QR Code requesting exact amount */}
                    <img
                        src={qrCodeUrl}
                        alt="Scan to Pay"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                </div>
                <div style={{ margin: '1rem 0', fontSize: '0.9rem', color: '#555' }}>
                    <p style={{ marginBottom: '0.5rem' }}>Scanning this QR will automatically request <strong>₹{grandTotal}</strong>.</p>
                    <a
                        href={upiLink}
                        style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                        Tap to Pay on Mobile
                    </a>
                </div>

                <button
                    style={loading ? styles.disabledBtn : styles.payBtn}
                    onClick={handleConfirmPayment}
                    disabled={loading}
                >
                    {loading ? 'Confirming...' : 'I Have Paid ✅'}
                </button>

                <button style={{ ...styles.linkBtn, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} onClick={() => setStep('CART')} disabled={loading}>
                    Back
                </button>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div style={styles.body}>
            <div style={styles.bill}>
                <div style={styles.billHeader}>
                    <h4>Happy Scoops Bowl 🍨</h4>
                    <p>Hinjawadi, Pune</p>
                    <p style={{ fontSize: '0.8rem' }}>GSTIN: 27ABCDE1234F1Z5</p>
                </div>
                <hr style={styles.dashed} />

                <div style={styles.billRow}>
                    <span>Order ID</span>
                    <span>{lastOrder?.orderId || 'PENDING'}</span>
                </div>
                <div style={styles.billRow}>
                    <span>Date</span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>

                <div style={styles.tokenBox}>
                    <small>TOKEN NO</small>
                    <div style={styles.tokenNum}>{lastOrder?.token}</div>
                </div>

                <hr style={styles.dashed} />

                <div style={styles.billItems}>
                    {lastOrder?.items?.map((item, idx) => (
                        <div key={idx} style={styles.billItemRow}>
                            <span>{item.name}</span>
                            <span>{item.price}</span>
                        </div>
                    ))}
                </div>

                <hr style={styles.solid} />
                <div style={styles.billRow}>
                    <span>Sub Total</span>
                    <span>₹{lastOrder?.subTotal}</span>
                </div>
                <div style={styles.billRow}>
                    <span>GST (5%)</span>
                    <span>₹{lastOrder?.gst}</span>
                </div>

                <div style={{ ...styles.billTotal, marginTop: '10px', fontSize: '1.2rem' }}>
                    <span>GRAND TOTAL</span>
                    <span>₹{lastOrder?.totalAmount}</span>
                </div>
                <hr style={styles.solid} />

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontStyle: 'italic', color: '#555' }}>
                    <p>"Life is short, make it sweet!" 🍬</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Thank you for visiting Happy Scoops!</p>
                </div>
            </div>
            <button style={styles.closeMainBtn} onClick={handleClose}>Close & New Order</button>
        </div>
    );

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3>{step === 'CART' ? 'Your Cart 🛒' :
                        step === 'PAYMENT' ? 'Payment 💸' : 'Receipt 🧾'}</h3>
                    {step !== 'SUCCESS' && (
                        <button onClick={handleClose}><X size={24} /></button>
                    )}
                </div>

                {step === 'CART' && renderCartList()}
                {step === 'CUSTOMER_INFO' && renderCustomerInfo()}
                {step === 'PAYMENT' && renderPayment()}
                {step === 'SUCCESS' && renderSuccess()}
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end' // Bottom sheet style
    },
    modal: {
        background: 'var(--light)',
        width: '100%',
        maxHeight: '90vh',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out'
    },
    header: {
        padding: '1.5rem',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--white)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px'
    },
    body: {
        padding: '1.5rem',
        overflowY: 'auto',
        flex: 1
    },
    footer: {
        padding: '1.5rem',
        background: 'var(--white)',
        borderTop: '1px solid #eee',
        boxShadow: '0 -4px 10px rgba(0,0,0,0.05)'
    },
    empty: {
        textAlign: 'center',
        padding: '3rem 0',
        color: '#666'
    },
    itemRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--white)',
        padding: '1rem',
        borderRadius: '12px',
        marginBottom: '0.8rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    },
    itemInfo: {
        flex: 1
    },
    itemName: {
        fontWeight: 600
    },
    itemPrice: {
        color: 'var(--primary)',
        fontWeight: 700
    },
    itemMeta: { // details
        fontSize: '0.75rem',
        color: '#888'
    },
    removeBtn: {
        color: 'var(--danger)',
        padding: '0.5rem'
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        fontSize: '1.1rem',
        fontWeight: 600
    },
    totalVal: {
        color: 'var(--primary)',
        fontSize: '1.5rem'
    },
    checkoutBtn: {
        background: 'var(--dark)',
        color: 'white',
        width: '100%',
        padding: '1rem',
        borderRadius: '99px',
        fontSize: '1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem'
    },
    // Payment Styles
    qrContainer: {
        textAlign: 'center',
        padding: '1rem',
        background: 'white',
        borderRadius: '16px'
    },
    qrPlaceholder: {
        width: '200px',
        height: '200px',
        background: '#eee',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        overflow: 'hidden'
    },
    payBtn: {
        background: 'var(--success)',
        color: 'white',
        width: '100%',
        padding: '1rem',
        borderRadius: '12px',
        fontSize: '1.1rem',
        fontWeight: 700,
        margin: '1rem 0'
    },
    disabledBtn: {
        background: '#ccc',
        color: 'white',
        width: '100%',
        padding: '1rem',
        borderRadius: '12px',
        margin: '1rem 0'
    },
    hint: {
        color: '#666',
        fontSize: '0.9rem'
    },
    linkBtn: {
        color: 'var(--dark)',
        textDecoration: 'underline',
        fontSize: '0.9rem',
        marginTop: '0.5rem'
    },
    // Bill Styles
    bill: {
        background: '#fff',
        padding: '20px',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        fontFamily: 'monospace'
    },
    billHeader: {
        textAlign: 'center',
        marginBottom: '1rem'
    },
    dashed: {
        borderTop: '1px dashed #ccc',
        margin: '10px 0',
        borderBottom: 'none'
    },
    solid: {
        borderTop: '1px solid #000',
        margin: '10px 0',
        borderBottom: 'none'
    },
    billRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.9rem',
        marginBottom: '4px'
    },
    tokenBox: {
        border: '2px solid #000',
        padding: '10px',
        textAlign: 'center',
        margin: '15px 0',
        borderRadius: '8px'
    },
    tokenNum: {
        fontSize: '2rem',
        fontWeight: 'bold'
    },
    billItems: {
        margin: '10px 0'
    },
    billItemRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.9rem',
        marginBottom: '4px'
    },
    billTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: 'bold',
        fontSize: '1.1rem'
    },
    closeMainBtn: {
        background: 'var(--primary)',
        color: 'white',
        width: '100%',
        padding: '1rem',
        borderRadius: '99px',
        marginTop: '1.5rem',
        fontWeight: 600
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '600',
        color: 'var(--dark)'
    },
    input: {
        width: '100%',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid #ddd',
        fontSize: '1rem',
        outline: 'none',
        background: 'var(--light)'
    }
};

export default CartModal;
