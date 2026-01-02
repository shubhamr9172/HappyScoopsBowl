import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import { PREBUILT_COMBOS } from '../data/menu';
import { calculateCartDiscounts } from '../utils/pricingUtils';

// 1. Create a Test Component to interact with the Context
const TestCartComponent = () => {
    const { cartItems, addToCart, cartTotal, cartCount } = useCart();

    return (
        <div>
            <div data-testid="cart-count">{cartCount}</div>
            <div data-testid="cart-total">{cartTotal}</div>
            <div data-testid="cart-items">
                {cartItems.map(item => (
                    <div key={item.cartId} data-testid={`item-${item.id}`}>
                        {item.name} - Qty: {item.quantity}
                    </div>
                ))}
            </div>
            <button
                onClick={() => addToCart({ id: 1, name: "Banana Choco Tub", price: 40, tier: 1 })}
            >
                Add Economy
            </button>
            <button
                onClick={() => addToCart({ id: 3, name: "Student Hot Choco", price: 40, tier: 1 })}
            >
                Add Hot Choco
            </button>
            <button
                onClick={() => addToCart({ id: 7, name: "The Ultimate Dreamy", price: 129, tier: 3 })}
            >
                Add Premium
            </button>
        </div>
    );
};

describe('Integration: Cart Flow', () => {
    it('should update cart state when items are added', async () => {
        render(
            <CartProvider>
                <TestCartComponent />
            </CartProvider>
        );

        // Initial state
        expect(screen.getByTestId('cart-count')).toHaveTextContent('0');

        // Add Item
        fireEvent.click(screen.getByText('Add Economy'));

        // Verify update
        await waitFor(() => {
            expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
            expect(screen.getByTestId('cart-total')).toHaveTextContent('40'); // Price is 40
        });
    });

    it('should correctly calculate total for multiple items', async () => {
        render(
            <CartProvider>
                <TestCartComponent />
            </CartProvider>
        );

        // Add 2 Economy items (40 each)
        fireEvent.click(screen.getByText('Add Economy'));
        fireEvent.click(screen.getByText('Add Economy'));

        await waitFor(() => {
            expect(screen.getByTestId('cart-items')).toHaveTextContent('Qty: 2');
            expect(screen.getByTestId('cart-total')).toHaveTextContent('80');
        });
    });

    it('should handle logic validation (Hinjewadi Hustle scenario)', () => {
        // This validates that the PRICING UTILS we tested in unit tests actually work with the DATA the cart uses
        // We simulate the data structure that would be in the cart

        const cartItems = [
            { id: 1, name: "Banana Choco Tub", price: 40, tier: 1 },
            { id: 3, name: "Student Hot Choco", price: 40, tier: 1 }
        ];

        // This function is what the CartModal uses to determine if a discount applies
        const discountResult = calculateCartDiscounts(cartItems);

        // Expect Hinjewadi Hustle (Total 79, so 40+40=80 - 79 = 1 saving)
        expect(discountResult.totalDiscount).toBe(1);
        expect(discountResult.appliedCombos[0].name).toBe('Hinjewadi Hustle');
    });
});
