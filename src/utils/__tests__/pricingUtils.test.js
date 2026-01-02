import { describe, it, expect } from 'vitest';
import {
    calculateCartDiscounts,
    calculateCartTotal,
    checkComboQualification,
    getItemTier,
    getCartUpsellTip
} from '../pricingUtils';

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
            expect(result.hasDiscount).toBe(true);
            expect(result.allowLoyalty).toBe(false);
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

        it('should apply Hinjewadi Hustle with higher saving (₹49 base)', () => {
            const cart = [
                { id: 2, price: 49, tier: 1 }, // Base (₹49)
                { id: 3, price: 40, tier: 1 }  // Hot Choco
            ];
            // Total 89. Target 79. Save 10.
            const result = calculateCartDiscounts(cart);
            expect(result.totalDiscount).toBe(10);
            expect(result.appliedCombos[0].name).toBe('Hinjewadi Hustle');
        });

        it('should apply Dreamy Duo combo (2 Mid-Tier items, Save ₹10)', () => {
            const cart = [
                { id: 4, price: 55, tier: 2 }, // Mid-Tier
                { id: 5, price: 49, tier: 2 }  // Mid-Tier
            ];
            const result = calculateCartDiscounts(cart);
            expect(result.totalDiscount).toBe(10);
            expect(result.appliedCombos[0].name).toBe('Dreamy Duo');
            expect(result.appliedCombos[0].saving).toBe(10);
        });

        it('should apply multiple Dreamy Duo combos for 4 tier-2 items', () => {
            const cart = [
                { id: 4, price: 55, tier: 2 },
                { id: 5, price: 49, tier: 2 },
                { id: 4, price: 55, tier: 2 },
                { id: 5, price: 49, tier: 2 }
            ];
            const result = calculateCartDiscounts(cart);
            expect(result.totalDiscount).toBe(20); // 2x Dreamy Duo
            expect(result.appliedCombos).toHaveLength(2);
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

        it('should handle empty cart', () => {
            const result = calculateCartDiscounts([]);
            expect(result.totalDiscount).toBe(0);
            expect(result.appliedCombos).toHaveLength(0);
            expect(result.hasDiscount).toBe(false);
            expect(result.allowLoyalty).toBe(true);
        });

        it('should handle single item (no discounts)', () => {
            const cart = [{ id: 1, price: 40, tier: 1 }];
            const result = calculateCartDiscounts(cart);
            expect(result.totalDiscount).toBe(0);
            expect(result.hasDiscount).toBe(false);
        });

        it('should handle non-qualifying items', () => {
            const cart = [
                { id: 6, price: 59, tier: 2 }, // Single mid-tier (needs 2)
                { id: 8, price: 149, tier: 3 } // Premium (not Ultimate)
            ];
            const result = calculateCartDiscounts(cart);
            expect(result.totalDiscount).toBe(0);
        });

        it('should apply multiple combos in complex cart', () => {
            const cart = [
                { id: 7, price: 129, tier: 3 }, // Ultimate
                { id: 3, price: 40, tier: 1 },  // Hot Choco (for Ultimate)
                { id: 4, price: 55, tier: 2 },  // Mid-Tier
                { id: 5, price: 49, tier: 2 }   // Mid-Tier (for Dreamy Duo)
            ];
            const result = calculateCartDiscounts(cart);
            // Should apply Ultimate (20) + Dreamy Duo (10) = 30
            expect(result.totalDiscount).toBe(30);
            expect(result.appliedCombos).toHaveLength(2);
        });
    });

    describe('calculateCartTotal', () => {
        it('should calculate correct subtotal for cart items', () => {
            const cart = [
                { id: 1, price: 40, quantity: 1 },
                { id: 2, price: 49, quantity: 2 }
            ];
            const result = calculateCartTotal(cart);
            expect(result.subtotal).toBe(138); // 40 + 98
            expect(result.total).toBe(138);
        });

        it('should include upsells in total', () => {
            const cart = [{ id: 1, price: 40, quantity: 1 }];
            const upsells = [{ price: 10, quantity: 2 }];
            const result = calculateCartTotal(cart, upsells);
            expect(result.subtotal).toBe(40);
            expect(result.upsellsTotal).toBe(20);
            expect(result.total).toBe(60);
        });

        it('should apply combo discount to total', () => {
            const cart = [
                { id: 7, price: 129, tier: 3 },
                { id: 3, price: 40, tier: 1 }
            ];
            const result = calculateCartTotal(cart);
            expect(result.subtotal).toBe(169);
            expect(result.comboDiscount).toBeTruthy();
            expect(result.savings).toBe(20);
            expect(result.total).toBe(149); // 169 - 20
        });

        it('should handle empty cart', () => {
            const result = calculateCartTotal([]);
            expect(result.subtotal).toBe(0);
            expect(result.total).toBe(0);
            expect(result.savings).toBe(0);
        });

        it('should calculate total with both combos and upsells', () => {
            const cart = [
                { id: 7, price: 129, tier: 3 },
                { id: 3, price: 40, tier: 1 }
            ];
            const upsells = [{ price: 15, quantity: 1 }];
            const result = calculateCartTotal(cart, upsells);
            expect(result.subtotal).toBe(169);
            expect(result.upsellsTotal).toBe(15);
            expect(result.savings).toBe(20);
            expect(result.total).toBe(164); // (169-20) + 15
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

        it('should show hint when only Tier 1 added', () => {
            const cart = [{ id: 1, tier: 1 }];
            const result = checkComboQualification(cart);
            expect(result.qualified).toBe(false);
            expect(result.message).toContain('Add Student Hot Choco');
        });

        it('should return no message for empty cart', () => {
            const result = checkComboQualification([]);
            expect(result.qualified).toBe(false);
            expect(result.message).toBeNull();
        });
    });

    describe('getItemTier', () => {
        it('should return correct tier for economy price (40)', () => {
            const tier = getItemTier(40);
            expect(tier.label).toBe('Economy');
            expect(tier.tier).toBe(1);
        });

        it('should return correct tier for economy price (49)', () => {
            const tier = getItemTier(49);
            expect(tier.label).toBe('Economy');
            expect(tier.tier).toBe(1);
        });

        it('should return correct tier for mid-tier price', () => {
            const tier = getItemTier(55);
            expect(tier.label).toBe('Mid-Tier');
            expect(tier.tier).toBe(2);
        });

        it('should return correct tier for premium price', () => {
            const tier = getItemTier(129);
            expect(tier.label).toBe('Premium');
            expect(tier.tier).toBe(3);
        });

        it('should return null for price outside all tiers', () => {
            const tier = getItemTier(200);
            expect(tier).toBeNull();
        });

        it('should handle boundary values correctly', () => {
            expect(getItemTier(40).tier).toBe(1); // Min Economy
            expect(getItemTier(49).tier).toBe(1); // Max Economy
            expect(getItemTier(50).tier).toBe(2); // Min Mid-Tier
            expect(getItemTier(59).tier).toBe(2); // Max Mid-Tier
        });
    });

    describe('getCartUpsellTip', () => {
        it('should suggest Hot Choco when cart has Tier 1 item', () => {
            const cart = [{ id: 1, tier: 1 }];
            const tip = getCartUpsellTip(cart);
            expect(tip).toContain('Student Hot Choco');
            expect(tip).toContain('Hinjewadi Hustle');
        });

        it('should suggest Economy item when cart has only Hot Choco', () => {
            const cart = [{ id: 3, tier: 1 }];
            const tip = getCartUpsellTip(cart);
            expect(tip).toContain('Student Special bowl');
        });

        it('should return null for empty cart', () => {
            const tip = getCartUpsellTip([]);
            expect(tip).toBeNull();
        });

        it('should not suggest when combo is already qualified', () => {
            const cart = [
                { id: 1, tier: 1 },
                { id: 3, tier: 1 }
            ];
            const tip = getCartUpsellTip(cart);
            // Should not suggest since combo is qualified
            expect(tip).toBeNull();
        });

        it('should suggest Dreamy Duo when 1 tier-2 item added', () => {
            const cart = [{ id: 4, tier: 2 }];
            const tip = getCartUpsellTip(cart);
            expect(tip).toContain('Dreamy Duo');
        });
    });
});
