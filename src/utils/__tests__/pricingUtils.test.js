import { describe, it, expect } from 'vitest';
import { calculateCartDiscounts, checkComboQualification, getItemTier } from '../pricingUtils';

// Mock data
const mockCart = [
    { id: 7, name: "The Ultimate Dreamy", price: 129, tier: 3 }, // Premium
    { id: 3, name: "Student Hot Choco", price: 40, tier: 1 },    // Hot Choco
    { id: 1, name: "Banana Choco Tub", price: 40, tier: 1 }      // Economy
];

describe('Pricing Utils', () => {
    describe('calculateCartDiscounts', () => {
        it('should apply Ultimate Escape combo (Save ₹20)', () => {
            const cart = [
                { id: 7, price: 129, tier: 3 },
                { id: 3, price: 40, tier: 1 }
            ];
            const result = calculateCartDiscounts(cart);
            expect(result.totalDiscount).toBe(20);
            expect(result.appliedCombos).toHaveLength(1);
            expect(result.appliedCombos[0].name).toBe('Ultimate Escape');
        });

        it('should apply Hinjewadi Hustle combo (Total ₹79, Save ₹1)', () => {
            const cart = [
                { id: 1, price: 40, tier: 1 }, // Base
                { id: 3, price: 40, tier: 1 }  // Hot Choco
            ];
            // Total 80. Target 79. Save 1.
            const result = calculateCartDiscounts(cart);
            expect(result.totalDiscount).toBe(1);
            expect(result.appliedCombos[0].name).toBe('Hinjewadi Hustle');
        });

        it('should prioritize combos correctly (Ultimate > Hustle)', () => {
            // Ultimate (7) + Hot Choco (3) + Economy (1)
            // Should match Ultimate (7+3) first, leaving Economy (1) alone.
            const cart = [
                { id: 7, price: 129, tier: 3 },
                { id: 3, price: 40, tier: 1 },
                { id: 1, price: 40, tier: 1 }
            ];
            const result = calculateCartDiscounts(cart);
            expect(result.totalDiscount).toBe(20);
            expect(result.appliedCombos).toHaveLength(1);
            expect(result.appliedCombos[0].name).toBe('Ultimate Escape');
        });
    });

    describe('checkComboQualification', () => {
        it('should show success message when Hinjewadi Hustle qualified', () => {
            const cart = [
                { id: 1, tier: 1 },
                { id: 3, tier: 1 }
            ];
            const result = checkComboQualification(cart);
            expect(result.qualified).toBe(true);
            expect(result.message).toContain('Hinjewadi Hustle combo applied');
        });

        it('should show hint when only Hot Choco added', () => {
            const cart = [{ id: 3, tier: 1 }];
            const result = checkComboQualification(cart);
            expect(result.qualified).toBe(false);
            expect(result.message).toContain('Add any Student Special item');
        });
    });

    describe('getItemTier', () => {
        it('should return correct tier for economy price', () => {
            const tier = getItemTier(40);
            expect(tier.label).toBe('Economy');
        });

        it('should return correct tier for mid-tier price', () => {
            const tier = getItemTier(55);
            expect(tier.label).toBe('Mid-Tier');
        });
    });
});
