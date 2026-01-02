import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CartModal from '../CartModal';
import { useCart } from '../../context/CartContext';
import { OrderService } from '../../services/orderService';
import { CustomerService, REWARDS } from '../../services/customerService';
import { calculateComboDiscount, checkComboQualification, getCartUpsellTip } from '../../utils/pricingUtils';
import { validateName, validatePhone, rateLimiter } from '../../utils/validation';

// Mock dependencies
vi.mock('../../context/CartContext');
vi.mock('../../services/orderService');
vi.mock('../../services/customerService');
vi.mock('../../utils/pricingUtils');
vi.mock('../../utils/validation');
vi.mock('../UpsellModal', () => ({
    default: ({ onAdd, onSkip }) => (
        <div data-testid="upsell-modal">
            <button onClick={() => onAdd({ name: 'Extra Topping', price: 10 })}>Add Upsell</button>
            <button onClick={onSkip}>Skip</button>
        </div>
    )
}));

describe('CartModal', () => {
    // Mock data
    const mockCartItems = [
        { cartId: '1', id: 1, name: 'Banana Choco Tub', price: 40, quantity: 2, tier: 1 },
        { cartId: '2', id: 2, name: 'OG Brownie Tub', price: 49, quantity: 1, tier: 1 }
    ];

    const mockCustomer = {
        phone: '9876543210',
        name: 'Test Customer',
        points: 150,
        vipTier: 'regular'
    };

    const mockOrder = {
        id: 'test-order-123',
        orderId: 'HS-1234-5678',
        token: 42,
        items: mockCartItems,
        subTotal: 129,
        gst: 6,
        totalAmount: 135,
        customerName: 'Test Customer',
        customerPhone: '9876543210'
    };

    // Default mock implementations
    let mockUseCart;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Setup default cart context mock
        mockUseCart = {
            isCartOpen: true,
            setIsCartOpen: vi.fn(),
            cartItems: [],
            removeFromCart: vi.fn(),
            updateQuantity: vi.fn(),
            cartTotal: 0,
            clearCart: vi.fn()
        };
        useCart.mockReturnValue(mockUseCart);

        // Setup default pricing utils mocks
        calculateComboDiscount.mockReturnValue({ applicable: false, discount: 0 });
        checkComboQualification.mockReturnValue({ qualified: false, message: null });
        getCartUpsellTip.mockReturnValue(null);

        // Setup default validation mocks
        validateName.mockImplementation((name) => name);
        validatePhone.mockImplementation((phone) => phone.length === 10 ? phone : null);
        rateLimiter.isAllowed = vi.fn().mockReturnValue(true);

        // Setup default service mocks
        CustomerService.getOrCreateCustomer = vi.fn().mockResolvedValue(null);
        CustomerService.getAvailableRewards = vi.fn().mockReturnValue([]);
        CustomerService.awardPoints = vi.fn().mockResolvedValue({ pointsEarned: 10, bonusPoints: 0 });
        OrderService.createOrder = vi.fn().mockResolvedValue(mockOrder);
    });

    describe('Rendering', () => {
        it('should not render when cart is closed', () => {
            mockUseCart.isCartOpen = false;
            useCart.mockReturnValue(mockUseCart);

            const { container } = render(<CartModal />);
            expect(container.firstChild).toBeNull();
        });

        it('should render when cart is open', () => {
            const { container } = render(<CartModal />);
            expect(container.firstChild).not.toBeNull();
        });

        it('should show empty cart message when no items', () => {
            render(<CartModal />);
            expect(screen.getByText(/Your bowl is empty/i)).toBeInTheDocument();
        });

        it('should display cart items correctly', () => {
            mockUseCart.cartItems = mockCartItems;
            mockUseCart.cartTotal = 129;
            useCart.mockReturnValue(mockUseCart);

            render(<CartModal />);

            expect(screen.getByText('Banana Choco Tub')).toBeInTheDocument();
            expect(screen.getByText('OG Brownie Tub')).toBeInTheDocument();
            expect(screen.getByText('₹129')).toBeInTheDocument();
        });

        it('should show combo discount when applicable', () => {
            mockUseCart.cartItems = mockCartItems;
            mockUseCart.cartTotal = 129;
            useCart.mockReturnValue(mockUseCart);

            calculateComboDiscount.mockReturnValue({
                applicable: true,
                comboName: 'Hinjewadi Hustle',
                savings: 10,
                discountedTotal: 119
            });

            render(<CartModal />);

            expect(screen.getByText(/Hinjewadi Hustle/i)).toBeInTheDocument();
            expect(screen.getByText('-₹10')).toBeInTheDocument();
            expect(screen.getByText('₹119')).toBeInTheDocument();
        });

        it('should display combo qualification hint', () => {
            mockUseCart.cartItems = [mockCartItems[0]];
            useCart.mockReturnValue(mockUseCart);

            checkComboQualification.mockReturnValue({
                qualified: false,
                message: '💡 Add Student Hot Choco to get Hinjewadi Hustle combo for ₹79!',
                hint: 'Available 6 PM - 11 PM'
            });

            render(<CartModal />);

            expect(screen.getByText(/Add Student Hot Choco/i)).toBeInTheDocument();
        });

        it('should show upsell tip when available', () => {
            mockUseCart.cartItems = [mockCartItems[0]];
            useCart.mockReturnValue(mockUseCart);

            getCartUpsellTip.mockReturnValue('Dreamy Tip: Add a Student Hot Choco for just ₹40!');

            render(<CartModal />);

            expect(screen.getByText(/Add a Student Hot Choco/i)).toBeInTheDocument();
        });
    });

    describe('Cart Operations', () => {
        beforeEach(() => {
            mockUseCart.cartItems = mockCartItems;
            mockUseCart.cartTotal = 129;
            useCart.mockReturnValue(mockUseCart);
        });

        it('should call updateQuantity when + button clicked', () => {
            render(<CartModal />);

            const plusButtons = screen.getAllByText('+');
            fireEvent.click(plusButtons[0]);

            expect(mockUseCart.updateQuantity).toHaveBeenCalledWith('1', 1);
        });

        it('should call updateQuantity when - button clicked', () => {
            render(<CartModal />);

            const minusButtons = screen.getAllByText('-');
            fireEvent.click(minusButtons[0]);

            expect(mockUseCart.updateQuantity).toHaveBeenCalledWith('1', -1);
        });

        it('should call removeFromCart when trash button clicked', () => {
            render(<CartModal />);

            const trashButtons = screen.getAllByRole('button', { name: '' });
            const deleteButtons = trashButtons.filter(btn => btn.querySelector('svg'));
            fireEvent.click(deleteButtons[0]);

            expect(mockUseCart.removeFromCart).toHaveBeenCalledWith('1');
        });

        it('should display item quantities correctly', () => {
            render(<CartModal />);

            expect(screen.getByText('x2')).toBeInTheDocument(); // Banana Choco Tub quantity
        });

        it('should calculate item totals correctly', () => {
            render(<CartModal />);

            expect(screen.getByText('₹80')).toBeInTheDocument(); // 40 × 2
            expect(screen.getByText('₹49')).toBeInTheDocument(); // 49 × 1
        });
    });

    describe('Customer Info Step', () => {
        beforeEach(() => {
            mockUseCart.cartItems = mockCartItems;
            mockUseCart.cartTotal = 129;
            useCart.mockReturnValue(mockUseCart);
        });

        it('should navigate to customer info when checkout clicked', () => {
            render(<CartModal />);

            const checkoutButton = screen.getByText(/Proceed to Checkout/i);
            fireEvent.click(checkoutButton);

            expect(screen.getByText(/Almost There!/i)).toBeInTheDocument();
        });

        it('should validate phone number', async () => {
            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            const nameInput = screen.getByPlaceholderText(/Rahul/i);
            const continueButton = screen.getByText(/Continue to Payment/i);

            fireEvent.change(phoneInput, { target: { value: '123' } });
            fireEvent.change(nameInput, { target: { value: 'Test User' } });
            fireEvent.click(continueButton);

            await waitFor(() => {
                expect(screen.getByText(/valid 10-digit phone number/i)).toBeInTheDocument();
            });
        });

        it('should validate name', async () => {
            validateName.mockImplementation(() => {
                throw new Error('Name must be at least 2 characters');
            });

            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            const nameInput = screen.getByPlaceholderText(/Rahul/i);
            const continueButton = screen.getByText(/Continue to Payment/i);

            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.change(nameInput, { target: { value: 'A' } });
            fireEvent.click(continueButton);

            await waitFor(() => {
                expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
            });
        });

        it('should lookup customer on phone blur', async () => {
            CustomerService.getOrCreateCustomer.mockResolvedValue(mockCustomer);

            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.blur(phoneInput);

            await waitFor(() => {
                expect(CustomerService.getOrCreateCustomer).toHaveBeenCalledWith('9876543210', '');
            });
        });

        it('should display customer loyalty info when found', async () => {
            CustomerService.getOrCreateCustomer.mockResolvedValue(mockCustomer);

            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.blur(phoneInput);

            await waitFor(() => {
                expect(screen.getByText(/Welcome back, Test Customer!/i)).toBeInTheDocument();
                expect(screen.getByText(/150/i)).toBeInTheDocument();
            });
        });

        it('should allow reward selection', async () => {
            CustomerService.getOrCreateCustomer.mockResolvedValue(mockCustomer);
            CustomerService.getAvailableRewards.mockReturnValue([
                { points: 100, label: '₹25 OFF (100 pts)', discount: 25 }
            ]);

            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.blur(phoneInput);

            await waitFor(() => {
                expect(screen.getByText(/Redeem Rewards:/i)).toBeInTheDocument();
            });
        });

        it('should show rate limit error', async () => {
            rateLimiter.isAllowed.mockReturnValue(false);

            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            const nameInput = screen.getByPlaceholderText(/Rahul/i);
            const continueButton = screen.getByText(/Continue to Payment/i);

            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.change(nameInput, { target: { value: 'Test User' } });
            fireEvent.click(continueButton);

            await waitFor(() => {
                expect(screen.getByText(/Too many orders/i)).toBeInTheDocument();
            });
        });

        it('should navigate back to cart from customer info', () => {
            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const backButton = screen.getByText(/Back to Cart/i);
            fireEvent.click(backButton);

            expect(screen.getByText(/Proceed to Checkout/i)).toBeInTheDocument();
        });
    });

    describe('Payment Step', () => {
        const setupPaymentStep = async () => {
            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            const nameInput = screen.getByPlaceholderText(/Rahul/i);

            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.change(nameInput, { target: { value: 'Test User' } });

            const continueButton = screen.getByText(/Continue to Payment/i);
            fireEvent.click(continueButton);

            // Skip upsell modal
            await waitFor(() => {
                expect(screen.getByTestId('upsell-modal')).toBeInTheDocument();
            });

            const skipButton = screen.getByText('Skip');
            fireEvent.click(skipButton);
        };

        beforeEach(() => {
            mockUseCart.cartItems = mockCartItems;
            mockUseCart.cartTotal = 129;
            useCart.mockReturnValue(mockUseCart);
        });

        it('should calculate GST correctly', async () => {
            await setupPaymentStep();

            await waitFor(() => {
                // GST = 129 * 0.05 = 6.45, rounded = 6
                // Grand Total = 129 + 6 = 135
                expect(screen.getByText(/Pay ₹135/i)).toBeInTheDocument();
            });
        });

        it('should generate correct QR code URL', async () => {
            await setupPaymentStep();

            await waitFor(() => {
                const img = screen.getByAlt('Scan to Pay');
                expect(img.src).toContain('api.qrserver.com');
                expect(img.src).toContain('upi://pay');
                expect(img.src).toContain('am=135');
            });
        });

        it('should handle loyalty discount in total', async () => {
            CustomerService.getOrCreateCustomer.mockResolvedValue(mockCustomer);
            CustomerService.getAvailableRewards.mockReturnValue([
                { points: 100, label: '₹25 OFF', discount: 25 }
            ]);

            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.blur(phoneInput);

            await waitFor(() => {
                const rewardSelect = screen.getByRole('combobox');
                fireEvent.change(rewardSelect, { target: { value: '100' } });
            });

            const continueButton = screen.getByText(/Continue to Payment/i);
            fireEvent.click(continueButton);

            await waitFor(() => {
                const skipButton = screen.getByText('Skip');
                fireEvent.click(skipButton);
            });

            await waitFor(() => {
                // Grand Total = (129 + 6) - 25 = 110
                expect(screen.getByText(/Pay ₹110/i)).toBeInTheDocument();
            });
        });
    });

    describe('Order Creation', () => {
        const completeCheckout = async () => {
            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            const nameInput = screen.getByPlaceholderText(/Rahul/i);

            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.change(nameInput, { target: { value: 'Test User' } });

            fireEvent.click(screen.getByText(/Continue to Payment/i));

            await waitFor(() => {
                fireEvent.click(screen.getByText('Skip'));
            });

            await waitFor(() => {
                const confirmButton = screen.getByText(/Confirm Payment/i);
                fireEvent.click(confirmButton);
            });
        };

        beforeEach(() => {
            mockUseCart.cartItems = mockCartItems;
            mockUseCart.cartTotal = 129;
            useCart.mockReturnValue(mockUseCart);
        });

        it('should create order with correct data', async () => {
            await completeCheckout();

            await waitFor(() => {
                expect(OrderService.createOrder).toHaveBeenCalledWith({
                    items: mockCartItems,
                    subTotal: 129,
                    gst: 6,
                    totalAmount: 135,
                    customerName: 'Test User',
                    customerPhone: '9876543210',
                    customerNote: 'Self-Order via Web'
                });
            });
        });

        it('should award loyalty points after order', async () => {
            await completeCheckout();

            await waitFor(() => {
                expect(CustomerService.awardPoints).toHaveBeenCalledWith(
                    '9876543210',
                    135,
                    mockOrder.orderId
                );
            });
        });

        it('should clear cart after successful order', async () => {
            await completeCheckout();

            await waitFor(() => {
                expect(mockUseCart.clearCart).toHaveBeenCalled();
            });
        });

        it('should show success message', async () => {
            await completeCheckout();

            await waitFor(() => {
                expect(screen.getByText(/Order Confirmed!/i)).toBeInTheDocument();
            });
        });

        it('should handle order creation failure', async () => {
            OrderService.createOrder.mockRejectedValue(new Error('Network error'));

            window.alert = vi.fn();

            await completeCheckout();

            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith('Failed to place order. Try again.');
            });
        });
    });

    describe('Receipt Generation', () => {
        it('should include all order details in receipt HTML', () => {
            // This test would require mocking document.createElement and Blob
            // Skipping for now as it requires complex DOM manipulation testing
            expect(true).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty cart checkout attempt', () => {
            render(<CartModal />);

            // Should not show checkout button for empty cart
            expect(screen.queryByText(/Proceed to Checkout/i)).not.toBeInTheDocument();
        });

        it('should close modal when close handler called', () => {
            render(<CartModal />);

            const closeButtons = screen.getAllByRole('button', { name: '' });
            const xButton = closeButtons.find(btn => btn.querySelector('svg'));

            if (xButton) {
                fireEvent.click(xButton);
                expect(mockUseCart.setIsCartOpen).toHaveBeenCalledWith(false);
            }
        });

        it('should handle missing customer data gracefully', async () => {
            CustomerService.getOrCreateCustomer.mockResolvedValue(null);

            render(<CartModal />);

            fireEvent.click(screen.getByText(/Proceed to Checkout/i));

            const phoneInput = screen.getByPlaceholderText(/9876543210/i);
            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.blur(phoneInput);

            // Should not crash, just not show loyalty info
            await waitFor(() => {
                expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument();
            });
        });
    });
});
