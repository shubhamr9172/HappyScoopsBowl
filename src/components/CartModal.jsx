import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, ArrowRight, Gift, Star, Download } from 'lucide-react';
import { OrderService } from '../services/orderService';
import { CustomerService, REWARDS } from '../services/customerService';
import { validateName, validatePhone, validateOrderData, rateLimiter, sanitizeInput } from '../utils/validation';
import upiQr from '../assets/upi_qr.png';
import logo from '../assets/logo.png';

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

    // Loyalty Program States
    const [customer, setCustomer] = useState(null);
    const [selectedReward, setSelectedReward] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [lookingUp, setLookingUp] = useState(false);
    const [earnedPointsData, setEarnedPointsData] = useState(null);

    // Close Handler
    const handleClose = () => {
        setIsCartOpen(false);
        setStep('CART'); // Reset immediately so next open is fresh
    };

    if (!isCartOpen) return null;

    // Customer lookup
    const handlePhoneLookup = async () => {
        if (customerPhone.length === 10) {
            setLookingUp(true);
            try {
                const cust = await CustomerService.getOrCreateCustomer(customerPhone, customerName);
                setCustomer(cust);
                if (cust.name && !customerName) {
                    setCustomerName(cust.name);
                }
            } catch (error) {
                console.error('Error looking up customer:', error);
            }
            setLookingUp(false);
        }
    };

    // Reward selection
    const handleRewardSelect = async (points) => {
        if (!customer || customer.points < points) return;

        try {
            const disc = REWARDS[points];
            setSelectedReward(points);
            setDiscount(disc);
        } catch (error) {
            alert('Error applying reward');
        }
    };

    const handleCustomerSubmit = () => {
        // Validate name
        try {
            const validatedName = validateName(customerName);
            setCustomerName(validatedName);
        } catch (error) {
            alert(error.message);
            return;
        }

        // Validate phone
        const validatedPhone = validatePhone(customerPhone);
        if (!validatedPhone) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }
        setCustomerPhone(validatedPhone);

        // Check rate limit
        if (!rateLimiter.isAllowed(validatedPhone, 3, 300000)) { // 3 orders per 5 minutes
            alert('Too many orders. Please wait a few minutes before ordering again.');
            return;
        }

        setStep('PAYMENT');
    };

    // Download Receipt
    const handleDownloadReceipt = async () => {
        const originalText = document.getElementById('downloadBtn').innerText;
        document.getElementById('downloadBtn').innerText = 'Preparing...';

        try {
            let logoSrc = logo;
            try {
                // Try to convert to base64 for embedding
                const response = await fetch(logo);
                const blob = await response.blob();
                logoSrc = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(logo);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.warn("Logo conversion failed, using path", e);
            }

            // Generate with whatever logo source we have
            generateReceipt(logoSrc);
        } catch (e) {
            console.error("Download failed:", e);
            alert("Could not download receipt. Please try again.");
        } finally {
            if (document.getElementById('downloadBtn')) {
                document.getElementById('downloadBtn').innerText = originalText;
            }
        }
    };

    const generateReceipt = (logoSrc) => {
        const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${lastOrder?.orderId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            max-width: 420px; 
            margin: 0 auto; 
            padding: 30px 20px; 
            background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
            color: #1f2937;
        }
        .receipt-container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.15);
        }
        .logo-section { 
            text-align: center; 
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f3f4f6;
        }
        .logo-section img { 
            width: 120px; 
            height: auto; 
            display: block; 
            margin: 0 auto 15px; 
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .brand-name {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
        }
        .business-info { 
            color: #6b7280; 
            font-size: 13px; 
            line-height: 1.6;
        }
        .order-info {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0;
            font-size: 14px;
        }
        .info-label { color: #6b7280; font-weight: 500; }
        .info-value { color: #1f2937; font-weight: 600; }
        .token-section { 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 25px; 
            margin: 25px 0; 
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        .token-label { 
            font-size: 11px; 
            color: rgba(255,255,255,0.9); 
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .token-num { 
            font-size: 56px; 
            font-weight: 800; 
            color: white;
            text-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .divider { 
            border: none; 
            border-top: 2px dashed #e5e7eb; 
            margin: 20px 0; 
        }
        .solid-divider { 
            border: none; 
            border-top: 2px solid #667eea; 
            margin: 20px 0; 
        }
        .items-section {
            margin: 25px 0;
        }
        .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #667eea;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        .item-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 12px 0;
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .item-row:last-child { border-bottom: none; }
        .item-name { 
            color: #1f2937; 
            font-weight: 500;
            font-size: 15px;
        }
        .item-price { 
            color: #667eea; 
            font-weight: 600;
            font-size: 15px;
        }
        .totals-section {
            background: #f9fafb;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0;
            font-size: 14px;
        }
        .grand-total { 
            font-weight: 700; 
            font-size: 20px;
            color: #667eea;
            padding-top: 15px;
            margin-top: 15px;
            border-top: 2px solid #e5e7eb;
        }
        .loyalty-section { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white; 
            padding: 18px; 
            border-radius: 12px; 
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .loyalty-title {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .loyalty-details {
            font-size: 12px;
            opacity: 0.95;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px dashed #e5e7eb;
        }
        .tagline {
            font-style: italic; 
            color: #667eea;
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .thank-you {
            color: #6b7280;
            font-size: 13px;
            margin-bottom: 5px;
        }
        .visit-again {
            color: #9ca3af;
            font-size: 12px;
        }
        @media print {
            body { background: white; padding: 0; }
            .receipt-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="logo-section">
            <img src="${logoSrc}" alt="Happy Scoops Logo" />
            <div class="brand-name">Happy Scoops</div>
            <div class="business-info">
                Hinjawadi, Pune<br>
                GSTIN: 27ABCDE1234F1Z5<br>
                ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
        </div>
        
        <div class="order-info">
            <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">${lastOrder?.orderId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Customer</span>
                <span class="info-value">${lastOrder?.customerName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Phone</span>
                <span class="info-value">${lastOrder?.customerPhone}</span>
            </div>
        </div>
        
        <div class="token-section">
            <div class="token-label">Token Number</div>
            <div class="token-num">${lastOrder?.token}</div>
        </div>
        
        <hr class="divider">
        
        <div class="items-section">
            <div class="section-title">Order Items</div>
            ${lastOrder?.items?.map(item => `
                <div class="item-row">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">₹${item.price}</span>
                </div>
            `).join('')}
        </div>
        
        <hr class="solid-divider">
        
        <div class="totals-section">
            <div class="total-row">
                <span>Sub Total</span>
                <span>₹${lastOrder?.subTotal}</span>
            </div>
            <div class="total-row">
                <span>GST (5%)</span>
                <span>₹${lastOrder?.gst}</span>
            </div>
            ${discount > 0 ? `
            <div class="total-row" style="color: #10b981;">
                <span>Loyalty Discount</span>
                <span>-₹${discount}</span>
            </div>
            ` : ''}
            
            <div class="total-row grand-total">
                <span>GRAND TOTAL</span>
                <span>₹${lastOrder?.totalAmount}</span>
            </div>
        </div>
        
        ${earnedPointsData?.pointsEarned > 0 ? `
        <div class="loyalty-section">
            <div class="loyalty-title">
                <span>💎</span>
                <span>Loyalty Rewards</span>
            </div>
            <div class="loyalty-details">
                Points Earned: +${earnedPointsData?.pointsEarned}<br>
                ${earnedPointsData?.bonusPoints > 0 ? `(Includes ${earnedPointsData?.bonusPoints} bonus)<br>` : ''}
                Total Points: ${(customer?.points || 0) + (earnedPointsData?.pointsEarned || 0)}
            </div>
        </div>
        ` : ''}
        
        <div class="footer">
            <div class="tagline">"Life is short, make it sweet!" 🍨</div>
            <div class="thank-you">Thank you for visiting Happy Scoops!</div>
            <div class="visit-again">Please visit again!</div>
        </div>
    </div>
</body>
</html>
`;
        const blob = new Blob([receiptHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt - ${lastOrder?.orderId} -${new Date().getTime()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderCustomerInfo = () => (
        <div style={styles.body}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Almost There! 🍦</h3>
                <p style={{ color: '#666' }}>Who should we call out when it's ready?</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={styles.label}>Phone Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        style={{ ...styles.input, flex: 1 }}
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        onBlur={handlePhoneLookup}
                    />
                    <button
                        style={styles.lookupBtn}
                        onClick={handlePhoneLookup}
                        disabled={lookingUp}
                    >
                        {lookingUp ? '...' : '🔍'}
                    </button>
                </div>
            </div>

            {customer && (
                <div style={styles.loyaltyCard}>
                    <div style={styles.loyaltyHeader}>
                        <span>💎 Welcome back, {customer.name || 'Valued Customer'}!</span>
                        {customer.vipTier !== 'regular' && (
                            <span style={styles.vipBadge}>
                                <Star size={14} /> {customer.vipTier.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div style={styles.loyaltyPoints}>
                        <strong>{customer.points}</strong> points available
                    </div>

                    {CustomerService.getAvailableRewards(customer.points).length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <label style={styles.label}>🎁 Redeem Rewards:</label>
                            <select
                                style={styles.input}
                                value={selectedReward || ''}
                                onChange={(e) => handleRewardSelect(parseInt(e.target.value))}
                            >
                                <option value="">No reward (save points)</option>
                                {CustomerService.getAvailableRewards(customer.points).map(reward => (
                                    <option key={reward.points} value={reward.points}>
                                        {reward.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedReward && (
                        <div style={styles.discountApplied}>
                            ✅ Discount of ₹{discount} applied!
                        </div>
                    )}

                    <div style={styles.pointsEarn}>
                        This order: +{Math.floor(cartTotal + (cartTotal * 0.05) - discount)} points
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <label style={styles.label}>Your Name</label>
                <input
                    style={styles.input}
                    placeholder="e.g. Rahul"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
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
    const grandTotal = cartTotal + gstAmount - discount;

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
            await new Promise(r => setTimeout(r, 1000));

            const createdOrder = await OrderService.createOrder(orderData);

            // Award Loyalty Points
            let pointsSummary = null;
            if (customerPhone) {
                try {
                    pointsSummary = await CustomerService.awardPoints(customerPhone, grandTotal, createdOrder.orderId);
                    setEarnedPointsData(pointsSummary);
                } catch (err) {
                    console.error("Failed to award points", err);
                }
            }

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
                    <img src={logo} alt="Happy Scoops" style={{ width: '100px', height: 'auto', marginBottom: '0.5rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                    <h4 style={{ margin: '0.5rem 0' }}>Happy Scoops Bowl 🍨</h4>
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

                {/* Loyalty Points Section in Receipt */}
                {earnedPointsData && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#92400e' }}>Points Earned</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#b45309' }}>+{earnedPointsData.pointsEarned} 💎</div>
                        {earnedPointsData.bonusPoints > 0 && (
                            <div style={{ fontSize: '0.8rem', color: '#d97706' }}>
                                (Includes {earnedPointsData.bonusPoints} bonus points!)
                            </div>
                        )}
                    </div>
                )}

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
            <button id="downloadBtn" style={styles.downloadBtn} onClick={handleDownloadReceipt}>
                <Download size={18} /> Download Receipt
            </button>
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
    downloadBtn: {
        background: '#4CAF50',
        color: 'white',
        width: '100%',
        padding: '1rem',
        borderRadius: '99px',
        marginTop: '1rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        border: 'none',
        fontSize: '1rem'
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
    },
    lookupBtn: {
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid #ddd',
        background: 'var(--primary)',
        color: 'white',
        cursor: 'pointer',
        fontSize: '1.2rem'
    },
    loyaltyCard: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '16px',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
    },
    loyaltyHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        fontSize: '1.1rem',
        fontWeight: '600'
    },
    vipBadge: {
        background: 'rgba(255, 215, 0, 0.3)',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        border: '1px solid rgba(255, 215, 0, 0.5)'
    },
    loyaltyPoints: {
        fontSize: '0.9rem',
        marginBottom: '0.5rem',
        opacity: 0.9
    },
    discountApplied: {
        background: 'rgba(76, 175, 80, 0.2)',
        padding: '0.75rem',
        borderRadius: '8px',
        marginTop: '1rem',
        fontWeight: '600',
        textAlign: 'center'
    },
    pointsEarn: {
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        textAlign: 'center'
    }
};

export default CartModal;
