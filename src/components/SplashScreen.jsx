import React from 'react';
import { ShoppingBag, UserCog } from 'lucide-react';
import logo from '../assets/logo.png';

const SplashScreen = ({ onFinish }) => {
    const handleCustomerStart = () => {
        onFinish();
    };

    const handleStaffLogin = () => {
        window.location.href = '/admin';
    };

    const styles = {
        container: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: 9999,
            padding: '2rem'
        },
        content: {
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%'
        },
        logo: {
            width: '180px',
            height: 'auto',
            marginBottom: '2rem',
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))',
            animation: 'float 3s ease-in-out infinite'
        },
        title: {
            fontSize: '2.5rem',
            color: 'white',
            fontWeight: '700',
            marginBottom: '0.5rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)'
        },
        subtitle: {
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '3rem',
            fontWeight: '400'
        },
        buttonsContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%'
        },
        customerBtn: {
            background: 'white',
            color: '#667eea',
            padding: '1.5rem 2rem',
            borderRadius: '16px',
            border: 'none',
            fontSize: '1.2rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            transform: 'translateY(0)'
        },
        staffBtn: {
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            padding: '1.25rem 2rem',
            borderRadius: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
        },
        footer: {
            marginTop: '3rem',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.9rem'
        }
    };

    return (
        <div style={styles.container}>
            <style>
                {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                    }
                    
                    .customer-btn:hover {
                        transform: translateY(-5px) !important;
                        box-shadow: 0 15px 40px rgba(0,0,0,0.3) !important;
                    }
                    
                    .staff-btn:hover {
                        background: rgba(255,255,255,0.25) !important;
                        border-color: rgba(255,255,255,0.5) !important;
                    }
                `}
            </style>

            <div style={styles.content}>
                <img src={logo} alt="Happy Scoops" style={styles.logo} />

                <h1 style={styles.title}>Welcome to Happy Scoops! 🍨</h1>
                <p style={styles.subtitle}>Delicious desserts made with love</p>

                <div style={styles.buttonsContainer}>
                    <button
                        className="customer-btn"
                        style={styles.customerBtn}
                        onClick={handleCustomerStart}
                    >
                        <ShoppingBag size={28} />
                        <span>Order Now</span>
                    </button>

                    <button
                        className="staff-btn"
                        style={styles.staffBtn}
                        onClick={handleStaffLogin}
                    >
                        <UserCog size={22} />
                        <span>Staff Login</span>
                    </button>
                </div>

                <p style={styles.footer}>
                    Tap "Order Now" to browse our menu
                </p>
            </div>
        </div>
    );
};

export default SplashScreen;
