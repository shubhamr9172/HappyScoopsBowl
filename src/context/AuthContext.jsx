import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

const ADMIN_PASSWORD = 'Shubham@&9172'; // TODO: Move to env variables for production
const AUTH_KEY = 'admin_authenticated';
const AUTH_EXPIRY = 'admin_auth_expiry';

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = () => {
            const authStatus = localStorage.getItem(AUTH_KEY);
            const expiry = localStorage.getItem(AUTH_EXPIRY);

            if (authStatus === 'true' && expiry) {
                const expiryTime = parseInt(expiry);
                const now = Date.now();

                if (now < expiryTime) {
                    setIsAuthenticated(true);
                } else {
                    // Session expired
                    logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = (password) => {
        if (password === ADMIN_PASSWORD) {
            // Set auth to expire in 8 hours
            const expiryTime = Date.now() + (8 * 60 * 60 * 1000);

            localStorage.setItem(AUTH_KEY, 'true');
            localStorage.setItem(AUTH_EXPIRY, expiryTime.toString());
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(AUTH_EXPIRY);
        setIsAuthenticated(false);
    };

    const value = {
        isAuthenticated,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
