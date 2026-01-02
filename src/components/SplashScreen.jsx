import React, { useState, useEffect } from 'react';
import { ShoppingBag, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const SplashScreen = ({ onFinish }) => {
    const [fadeIn, setFadeIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Trigger fade-in animation after component mounts
        setTimeout(() => setFadeIn(true), 100);
    }, []);

    const handleCustomerStart = () => {
        // Fade out before finishing
        setFadeIn(false);
        setTimeout(() => {
            onFinish();
        }, 300);
    };

    const handleStaffLogin = () => {
        // Fade out and navigate
        setFadeIn(false);
        setTimeout(() => {
            navigate('/admin');
        }, 300);
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
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            zIndex: 9999,
            padding: '3rem 2rem',
            overflow: 'auto',
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
        },
        content: {
            textAlign: 'center',
            maxWidth: '450px',
            width: '100%',
            padding: '1rem 0',
            transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.4s ease-out'
        },
        logo: {
            width: '220px',
            height: 'auto',
            marginBottom: '1.5rem',
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.2))',
            animation: 'float 3s ease-in-out infinite',
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto',
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 0.5s ease-in 0.2s'
        },
        title: {
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800',
            marginBottom: '1rem',
            textShadow: 'none',
            lineHeight: '1.2',
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 0.5s ease-in 0.3s'
        },
        subtitle: {
            fontSize: '0.9rem',
            color: '#95a5a6',
            marginBottom: '3rem',
            fontWeight: '600',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 0.5s ease-in 0.4s'
        },
        buttonsContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            marginBottom: '2rem',
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 0.5s ease-in 0.5s'
        },
        customerBtn: {
            background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
            color: 'white',
            padding: '1.25rem 2.5rem',
            borderRadius: '50px',
            border: 'none',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 20px rgba(44, 62, 80, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0)'
        },
        staffBtn: {
            background: 'rgba(255,255,255,0.6)',
            color: '#7f8c8d',
            padding: '1rem 2rem',
            borderRadius: '50px',
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
        },
        footer: {
            color: '#95a5a6',
            fontSize: '0.8rem',
            fontWeight: '500',
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 0.5s ease-in 0.6s'
        }
    };

    return (
        <div style={styles.container}>
            <style>
                {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1)); }
                        50% { transform: translateY(-10px); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.15)); }
                    }
                    
                    @keyframes pulse-glow {
                        0%, 100% { box-shadow: 0 10px 30px rgba(44, 62, 80, 0.3); }
                        50% { box-shadow: 0 15px 40px rgba(52, 152, 219, 0.4); }
                    }

                    .customer-btn:hover {
                        transform: translateY(-4px) !important;
                        box-shadow: 0 15px 35px rgba(44, 62, 80, 0.4) !important;
                    }
                    
                    .customer-btn:active {
                        transform: translateY(-2px) !important;
                    }
                    
                    .staff-btn:hover {
                        background: rgba(255, 255, 255, 0.8) !important;
                        border-color: #2c3e50 !important;
                        color: #2c3e50 !important;
                    }
                    
                    .staff-btn:active {
                        transform: scale(0.98);
                    }
                `}
            </style>

            <div style={styles.content}>
                <img src={logo} alt="The Dreamy Bowl" style={styles.logo} />

                <h1 style={styles.title}>Welcome to<br />The Dreamy Bowl!</h1>
                <p style={styles.subtitle}>Delicious desserts made with love</p>

                <div style={styles.buttonsContainer}>
                    <button
                        className="customer-btn"
                        style={styles.customerBtn}
                        onClick={handleCustomerStart}
                    >
                        <ShoppingBag size={22} />
                        <span>Order Now</span>
                    </button>

                    <button
                        className="staff-btn"
                        style={styles.staffBtn}
                        onClick={handleStaffLogin}
                    >
                        <UserCog size={20} />
                        <span>Staff Login</span>
                    </button>
                </div>

                <p style={styles.footer}>
                    Tap "Order Now" to browse our menu
                </p>
            </div>
        </div >
    );
};

export default SplashScreen;
