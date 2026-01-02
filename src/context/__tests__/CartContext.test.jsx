import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';

// Wrapper for testing hooks
const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

describe('CartContext', () => {
    describe('Initial State', () => {
        it('should initialize with empty cart', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            expect(result.current.cartItems).toEqual([]);
            expect(result.current.cartCount).toBe(0);
            expect(result.current.cartTotal).toBe(0);
            expect(result.current.isCartOpen).toBe(false);
        });
    });

    describe('addToCart', () => {
        it('should add new item to cart', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40, tier: 1 };

            act(() => {
                result.current.addToCart(item);
            });

            expect(result.current.cartItems).toHaveLength(1);
            expect(result.current.cartItems[0].name).toBe('Test Item');
            expect(result.current.cartItems[0].quantity).toBe(1);
            expect(result.current.cartItems[0].cartId).toBeDefined();
        });

        it('should open cart modal after adding item', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40, tier: 1 };

            act(() => {
                result.current.addToCart(item);
            });

            expect(result.current.isCartOpen).toBe(true);
        });

        it('should increment quantity when adding same item', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40, tier: 1 };

            act(() => {
                result.current.addToCart(item);
                result.current.addToCart(item);
            });

            expect(result.current.cartItems).toHaveLength(1);
            expect(result.current.cartItems[0].quantity).toBe(2);
        });

        it('should add multiple different items', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item1 = { id: 1, name: 'Item 1', price: 40, tier: 1 };
            const item2 = { id: 2, name: 'Item 2', price: 50, tier: 2 };

            act(() => {
                result.current.addToCart(item1);
                result.current.addToCart(item2);
            });

            expect(result.current.cartItems).toHaveLength(2);
            expect(result.current.cartCount).toBe(2);
        });

        it('should generate unique cartId for each item', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item1 = { id: 1, name: 'Item 1', price: 40 };
            const item2 = { id: 2, name: 'Item 2', price: 50 };

            act(() => {
                result.current.addToCart(item1);
                result.current.addToCart(item2);
            });

            const cartId1 = result.current.cartItems[0].cartId;
            const cartId2 = result.current.cartItems[1].cartId;
            expect(cartId1).toBeDefined();
            expect(cartId2).toBeDefined();
            expect(cartId1).not.toBe(cartId2);
        });
    });

    describe('removeFromCart', () => {
        it('should remove item from cart by cartId', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
            });

            const cartId = result.current.cartItems[0].cartId;

            act(() => {
                result.current.removeFromCart(cartId);
            });

            expect(result.current.cartItems).toHaveLength(0);
        });

        it('should only remove the specific item', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item1 = { id: 1, name: 'Item 1', price: 40 };
            const item2 = { id: 2, name: 'Item 2', price: 50 };

            act(() => {
                result.current.addToCart(item1);
                result.current.addToCart(item2);
            });

            const cartId1 = result.current.cartItems[0].cartId;

            act(() => {
                result.current.removeFromCart(cartId1);
            });

            expect(result.current.cartItems).toHaveLength(1);
            expect(result.current.cartItems[0].name).toBe('Item 2');
        });

        it('should handle removing non-existent item gracefully', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
            });

            act(() => {
                result.current.removeFromCart('non-existent-id');
            });

            expect(result.current.cartItems).toHaveLength(1);
        });
    });

    describe('updateQuantity', () => {
        it('should increase quantity with positive delta', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
            });

            const cartId = result.current.cartItems[0].cartId;

            act(() => {
                result.current.updateQuantity(cartId, 2);
            });

            expect(result.current.cartItems[0].quantity).toBe(3); // 1 + 2
        });

        it('should decrease quantity with negative delta', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
                result.current.addToCart(item); // quantity = 2
            });

            const cartId = result.current.cartItems[0].cartId;

            act(() => {
                result.current.updateQuantity(cartId, -1);
            });

            expect(result.current.cartItems[0].quantity).toBe(1);
        });

        it('should remove item when quantity reaches 0', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
            });

            const cartId = result.current.cartItems[0].cartId;

            act(() => {
                result.current.updateQuantity(cartId, -1);
            });

            expect(result.current.cartItems).toHaveLength(0);
        });

        it('should not allow negative quantities', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
            });

            const cartId = result.current.cartItems[0].cartId;

            act(() => {
                result.current.updateQuantity(cartId, -10);
            });

            expect(result.current.cartItems).toHaveLength(0);
        });

        it('should handle updating non-existent item', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
            });

            act(() => {
                result.current.updateQuantity('non-existent', 2);
            });

            // Should not change existing item
            expect(result.current.cartItems[0].quantity).toBe(1);
        });
    });

    describe('clearCart', () => {
        it('should remove all items from cart', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item1 = { id: 1, name: 'Item 1', price: 40 };
            const item2 = { id: 2, name: 'Item 2', price: 50 };

            act(() => {
                result.current.addToCart(item1);
                result.current.addToCart(item2);
            });

            expect(result.current.cartItems).toHaveLength(2);

            act(() => {
                result.current.clearCart();
            });

            expect(result.current.cartItems).toHaveLength(0);
            expect(result.current.cartCount).toBe(0);
            expect(result.current.cartTotal).toBe(0);
        });

        it('should handle clearing already empty cart', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            act(() => {
                result.current.clearCart();
            });

            expect(result.current.cartItems).toHaveLength(0);
        });
    });

    describe('cartTotal', () => {
        it('should calculate total for single item', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
            });

            expect(result.current.cartTotal).toBe(40);
        });

        it('should calculate total for multiple items', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item1 = { id: 1, name: 'Item 1', price: 40 };
            const item2 = { id: 2, name: 'Item 2', price: 50 };

            act(() => {
                result.current.addToCart(item1);
                result.current.addToCart(item2);
            });

            expect(result.current.cartTotal).toBe(90);
        });

        it('should calculate total considering quantities', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
                result.current.addToCart(item);
                result.current.addToCart(item);
            });

            expect(result.current.cartTotal).toBe(120); // 40 × 3
        });

        it('should update total after quantity change', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
            });

            const cartId = result.current.cartItems[0].cartId;

            act(() => {
                result.current.updateQuantity(cartId, 4); // quantity becomes 5
            });

            expect(result.current.cartTotal).toBe(200); // 40 × 5
        });

        it('should be 0 for empty cart', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            expect(result.current.cartTotal).toBe(0);
        });
    });

    describe('cartCount', () => {
        it('should count single item', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
            });

            expect(result.current.cartCount).toBe(1);
        });

        it('should count total quantity across all items', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item1 = { id: 1, name: 'Item 1', price: 40 };
            const item2 = { id: 2, name: 'Item 2', price: 50 };

            act(() => {
                result.current.addToCart(item1);
                result.current.addToCart(item1); // quantity 2
                result.current.addToCart(item2); // quantity 1
            });

            expect(result.current.cartCount).toBe(3); // 2 + 1
        });

        it('should be 0 for empty cart', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            expect(result.current.cartCount).toBe(0);
        });

        it('should update after removing item', () => {
            const { result } = renderHook(() => useCart(), { wrapper });
            const item = { id: 1, name: 'Test Item', price: 40 };

            act(() => {
                result.current.addToCart(item);
                result.current.addToCart(item);
            });

            expect(result.current.cartCount).toBe(2);

            const cartId = result.current.cartItems[0].cartId;

            act(() => {
                result.current.removeFromCart(cartId);
            });

            expect(result.current.cartCount).toBe(0);
        });
    });

    describe('isCartOpen', () => {
        it('should update cart open state', () => {
            const { result } = renderHook(() => useCart(), { wrapper });

            expect(result.current.isCartOpen).toBe(false);

            act(() => {
                result.current.setIsCartOpen(true);
            });

            expect(result.current.isCartOpen).toBe(true);

            act(() => {
                result.current.setIsCartOpen(false);
            });

            expect(result.current.isCartOpen).toBe(false);
        });
    });
});
