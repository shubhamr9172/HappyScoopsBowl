import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { CartContext } from '../../context/CartContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate
}));

// Mock logo to avoid issue
vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }));

const renderHeader = (cartCount = 0, setIsCartOpen = vi.fn()) => {
    return render(
        <CartContext.Provider value={{ cartCount, setIsCartOpen }}>
            <Header />
        </CartContext.Provider>
    );
};

describe('Header Component', () => {
    it('should render brand name', () => {
        renderHeader();
        expect(screen.getByText('The Dreamy Bowl')).toBeInTheDocument();
    });

    it('should show correct cart count', () => {
        renderHeader(3);
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not show badge when cart is empty', () => {
        renderHeader(0);
        // Badge text '0' should not render because condition is > 0
        const badge = screen.queryByText('0');
        expect(badge).not.toBeInTheDocument();
    });

    it('should open cart when button clicked', () => {
        const setIsCartOpen = vi.fn();
        renderHeader(1, setIsCartOpen);

        const cartBtn = screen.getByText('Cart').closest('button');
        fireEvent.click(cartBtn);

        expect(setIsCartOpen).toHaveBeenCalledWith(true);
    });

    it('should navigate to home when logo clicked', () => {
        renderHeader();
        const logo = screen.getByText('The Dreamy Bowl').closest('div');
        // The click handler is on the parent div of brandSection's parent
        // Let's find the container by role or just text
        // The structure is: div(onClick) > div(logo) + div(brand)
        // We can find the brand text and click its parent's parent

        // Simpler: find by text and verify parent chain or just click the brand name as it bubbles
        fireEvent.click(screen.getByText('The Dreamy Bowl'));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
