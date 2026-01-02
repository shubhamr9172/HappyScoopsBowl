import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [pinInput, setPinInput] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleLogin = () => {
        const success = login(pinInput);
        if (success) {
            navigate('/admin');
        } else {
            setLoginError('Incorrect PIN');
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--light)'
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <h3>Owner Login 🔐</h3>
                <p style={{ marginBottom: '1rem', color: '#666' }}>Enter PIN to access dashboard</p>
                {loginError && (
                    <div style={{
                        color: '#dc2626',
                        background: '#fee2e2',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'center'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span> {loginError}
                    </div>
                )}
                <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => {
                        setPinInput(e.target.value);
                        setLoginError('');
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleLogin();
                    }}
                    placeholder="Enter Owner PIN"
                    style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        width: '100%',
                        marginBottom: '1rem',
                        fontSize: '1rem'
                    }}
                />
                <button
                    onClick={handleLogin}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Login
                </button>
                <div style={{ marginTop: '1rem' }}>
                    <a href="/" style={{ color: '#888', fontSize: '0.9rem', textDecoration: 'none' }}>Back to Home</a>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
