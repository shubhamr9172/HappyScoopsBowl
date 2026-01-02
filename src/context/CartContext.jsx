import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const addToCart = (item) => {
        setCartItems(prev => {
            // Check if item already exists (matching ID and same custom details if any)
            const existingItemIndex = prev.findIndex(i => i.id === item.id);

            // For custom items, we'd need deeper comparison, but for menu items ID is enough
            // If we add deep comparison later, we can use JSON.stringify(i.details) === JSON.stringify(item.details)

            if (existingItemIndex > -1) {
                // Item exists, increment quantity
                const newItems = [...prev];
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: (newItems[existingItemIndex].quantity || 1) + 1
                };
                return newItems;
            }

            // New item, add with qty 1
            return [...prev, { ...item, quantity: 1, cartId: Date.now() + Math.random() }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (cartId) => {
        setCartItems(prev => prev.filter(item => item.cartId !== cartId));
    };

    const updateQuantity = (cartId, delta) => {
        setCartItems(prev => {
            return prev.map(item => {
                if (item.cartId === cartId) {
                    const newQty = Math.max(0, (item.quantity || 1) + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(item => item.quantity > 0); // Remove if qty 0
        });
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            isCartOpen,
            setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
};
