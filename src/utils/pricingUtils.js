import { PRICING_CONFIG } from '../data/menu';

/**
 * Get tier information for a given price
 * @param {number} price - Item price
 * @returns {object} Tier information
 */
export const getItemTier = (price) => {
    for (const [tierNum, tierInfo] of Object.entries(PRICING_CONFIG.tiers)) {
        if (price >= tierInfo.min && price <= tierInfo.max) {
            return { tier: parseInt(tierNum), ...tierInfo };
        }
    }
    return null;
};

/**
 * Check if current time allows item to be displayed
 * @param {object} item - Menu item with potential time restrictions
 * @returns {boolean} Whether item is currently available
 */
export const isItemAvailable = (item) => {
    if (!item.timeRestricted || !item.availableHours) {
        return true; // No time restrictions
    }

    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = item.availableHours;

    return currentHour >= start && currentHour < end;
};

/**
 * Get availability message for time-restricted items
 * @param {object} item - Menu item
 * @returns {string|null} Availability message or null
 */
export const getAvailabilityMessage = (item) => {
    if (!item.timeRestricted || !item.availableHours) {
        return null;
    }

    if (isItemAvailable(item)) {
        return `Available now until ${formatHour(item.availableHours.end)}`;
    }

    return `Available from ${formatHour(item.availableHours.start)} - ${formatHour(item.availableHours.end)}`;
};

/**
 * Format hour in 12-hour format
 * @param {number} hour - Hour in 24-hour format
 * @returns {string} Formatted hour
 */
const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
};

/**
 * Calculate applicable combo discounts safely
 * @param {array} cartItems - Items in cart
 * @returns {object} Discount details { totalDiscount, appliedCombos: [] }
 */
export const calculateCartDiscounts = (cartItems) => {
    let unallocatedItems = [...cartItems.map(item => ({ ...item }))]; // Clone to track usage
    let appliedCombos = [];
    let totalDiscount = 0;

    // --- 1. Ultimate Escape (Hardest to qualify) ---
    // Rule: Ultimate Dreamy (7) + Student Hot Choco (3) = ₹149 Total.
    while (true) {
        const ultimates = unallocatedItems.filter(i => i.id === 7);
        const hotChocos = unallocatedItems.filter(i => i.id === 3);

        if (ultimates.length > 0 && hotChocos.length > 0) {
            const ultimate = ultimates[0];
            const choco = hotChocos[0];

            // Calc: (129 + 40) = 169. Target = 149. Save = 20.
            const saving = 20;
            totalDiscount += saving;
            appliedCombos.push({ name: 'Ultimate Escape', saving });

            removeItemOnce(unallocatedItems, ultimate);
            removeItemOnce(unallocatedItems, choco);
        } else {
            break;
        }
    }

    // --- 2. Hinjewadi Hustle ---
    // Rule: Any Economy (Tier 1, excl Hot Choco) + Student Hot Choco = ₹79 Total.
    // Economy Prices: 40 or 49. Hot Choco: 40.
    while (true) {
        const hotChocos = unallocatedItems.filter(i => i.id === 3);
        const tier1Bases = unallocatedItems.filter(i => i.tier === 1 && i.id !== 3);

        if (hotChocos.length > 0 && tier1Bases.length > 0) {
            const choco = hotChocos[0];
            const base = tier1Bases[0];

            // If Base=40, Total=80. Target=79. Save=1.
            // If Base=49, Total=89. Target=79. Save=10.
            const originalSum = (base.price || 0) + (choco.price || 0);
            const saving = originalSum - 79;

            if (saving > 0) {
                totalDiscount += saving;
                appliedCombos.push({ name: 'Hinjewadi Hustle', saving });
                removeItemOnce(unallocatedItems, choco);
                removeItemOnce(unallocatedItems, base);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    // --- 3. Dreamy Duo ---
    // Rule: Any 2 Mid-Tier (Tier 2) items = ₹10 FLAT Discount.
    while (true) {
        // Find any 2 items from Tier 2
        const tier2Items = unallocatedItems.filter(i => i.tier === 2);

        if (tier2Items.length >= 2) {
            const item1 = tier2Items[0];
            const item2 = tier2Items[1];

            const saving = 10; // Flat ₹10 OFF
            totalDiscount += saving;
            appliedCombos.push({ name: 'Dreamy Duo', saving });

            removeItemOnce(unallocatedItems, item1);
            removeItemOnce(unallocatedItems, item2);
        } else {
            break;
        }
    }

    return {
        totalDiscount,
        appliedCombos,
        hasDiscount: totalDiscount > 0,
        allowLoyalty: totalDiscount === 0 // BLOCK Loyalty if combo is applied
    };
};

// Helper to remove item instance
const removeItemOnce = (arr, itemToRemove) => {
    const index = arr.indexOf(itemToRemove);
    if (index > -1) {
        arr.splice(index, 1);
    }
};

// Legacy support if needed, but calculateCartDiscounts is preferred
export const calculateComboDiscount = (cartItems) => {
    const result = calculateCartDiscounts(cartItems);
    if (!result.hasDiscount) return { applicable: false, discount: 0, savings: 0 };

    // Calculate original total to provide discountedTotal
    const originalTotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // Adapt to old return format for smoother transition if needed
    // But better to update CartModal to use new format
    return {
        applicable: true,
        comboName: result.appliedCombos.map(c => c.name).join(' + '),
        discount: result.totalDiscount,
        savings: result.totalDiscount,
        discountedTotal: originalTotal - result.totalDiscount,
        originalTotal // Include this too just in case
    };
};

/**
 * Get smart upsell tip for cart
 * @param {array} cartItems
 * @returns {string|null} Tip message
 */
export const getCartUpsellTip = (cartItems) => {
    if (cartItems.length === 0) return null;

    // Check availability of specific items to trigger tips regardless of cart size
    // We iterate to find the first relevant tip

    // Scenario 1: User has Economy Item (Tier 1) but NO Hot Choco -> Suggest Hot Choco
    const hasTier1 = cartItems.some(i => i.tier === 1 && i.id !== 3);
    const hasHotChoco = cartItems.some(i => i.id === 3);

    if (hasTier1 && !hasHotChoco) {
        return "Dreamy Tip: Add a Student Hot Choco for just ₹40 to unlock the Hinjewadi Hustle deal (Save ₹10)!";
    }

    // Scenario 2: User has Hot Choco but NO Tier 1 -> Suggest Economy Item
    if (hasHotChoco && !hasTier1) {
        return "Dreamy Tip: Add any Student Special bowl for just ₹40-49 to unlock the Hinjewadi Hustle deal!";
    }

    // Scenario 3: User has exactly 1 Dreamy Duo Item (Tier 2 from set) -> Suggest 2nd
    // For this specific deal, counting matters to avoid spamming if they already have 2
    const duoItems = cartItems.filter(i => i.id === 4 || i.id === 5);
    if (duoItems.length === 1) {
        return "Dreamy Tip: Add another Triple Treat or Cold Choco Shot to get the Dreamy Duo deal (2 for ₹90)!";
    }

    // Fallback: If nothing specific and cart is small, maybe general upsell?
    // For now returning null to avoid annoyance
    return null;
};

/**
 * Get upsell suggestions based on cart contents
 * @param {array} cartItems - Items in cart
 * @returns {array} Suggested upsell items
 */
export const getUpsellSuggestions = (cartItems) => {
    // Return all upsells for now
    // Can be made smarter based on cart contents
    return PRICING_CONFIG.upsells;
};

/**
 * Calculate cart total with discounts
 * @param {array} cartItems - Items in cart
 * @param {array} upsellItems - Selected upsell items
 * @returns {object} Total calculation breakdown
 */
export const calculateCartTotal = (cartItems, upsellItems = []) => {
    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1));
    }, 0);

    // Calculate upsells total
    const upsellsTotal = upsellItems.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1));
    }, 0);

    // Check for combo discount
    const comboDiscount = calculateComboDiscount(cartItems);

    // Calculate final total
    let total = subtotal + upsellsTotal;

    if (comboDiscount.applicable) {
        total = comboDiscount.discountedTotal + upsellsTotal;
    }

    return {
        subtotal,
        upsellsTotal,
        comboDiscount: comboDiscount.applicable ? comboDiscount : null,
        total,
        savings: comboDiscount.applicable ? comboDiscount.savings : 0
    };
};

/**
 * Check if cart qualifies for combo (for UI hints)
 * @param {array} cartItems - Items in cart
 * @returns {object} Qualification status and hints
 */
export const checkComboQualification = (cartItems) => {
    // Check for Student Hot Choco by ID (3)
    const hasStudentHotChoco = cartItems.some(
        item => item.id === 3
    );

    // Check for Tier 1 items (excluding Hot Choco itself) for Hinjewadi Hustle
    const hasTier1Item = cartItems.some(
        item => item.tier === 1 && item.id !== 3
    );

    if (hasStudentHotChoco && hasTier1Item) {
        return {
            qualified: true,
            message: "🎉 Hinjewadi Hustle combo applied! Total: ₹79"
        };
    }

    if (hasStudentHotChoco && !hasTier1Item) {
        return {
            qualified: false,
            message: "💡 Add any Student Special item to get Hinjewadi Hustle combo for ₹79!",
            hint: "Add Banana Choco Tub or OG Brownie Tub"
        };
    }

    if (!hasStudentHotChoco && hasTier1Item) {
        return {
            qualified: false,
            message: "💡 Add Student Hot Choco to get Hinjewadi Hustle combo for ₹79!",
            hint: "Available 6 PM - 11 PM"
        };
    }

    return {
        qualified: false,
        message: null
    };
};
