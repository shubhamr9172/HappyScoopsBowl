export const PREBUILT_COMBOS = [
    {
        id: 1,
        name: "Banana Choco Tub",
        price: 40,
        description: "Fresh Robusta bananas with hot chocolate ganache.",
        image: "https://images.unsplash.com/photo-1599785209796-786432b228bc?auto=format&fit=crop&q=80&w=300",
        tier: 1,
        brownieCost: 2
    },
    {
        id: 2,
        name: "OG Brownie Tub",
        price: 49,
        description: "Classic walnut brownie chunks drowning in ganache.",
        image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=300",
        tier: 1,
        brownieCost: 2
    },
    {
        id: 3,
        name: "Student Hot Choco",
        price: 40,
        description: "Rich, warm, and comforting. The perfect study buddy.",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=300",
        tier: 1,
        brownieCost: 0,
        timeRestricted: true,
        availableHours: { start: 18, end: 23 } // 6 PM - 11 PM
    },
    {
        id: 4,
        name: "Triple Treat Tub",
        price: 50,
        description: "Brownie + Oreo + KitKat in one tub.",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=300",
        tier: 2,
        brownieCost: 2
    },
    {
        id: 5,
        name: "Cold Choco Shot",
        price: 50,
        description: "Chilled chocolate shot for a quick buzz.",
        image: "https://images.unsplash.com/photo-1577805947697-b984381e958d?auto=format&fit=crop&q=80&w=300",
        tier: 2,
        brownieCost: 0
    },
    {
        id: 6,
        name: "Oreo Midnight Tub",
        price: 59,
        description: "Crushed Oreos layered with dark chocolate.",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=300",
        tier: 2,
        brownieCost: 2
    },
    {
        id: 7,
        description: "1 Full Brownie (4 cubes); double mousse; 1 KitKat finger + 2 Oreos; heavy ganache + gold dust.",
        price: 129,
        tier: 3, // Premium tier
        comboEligible: false,
        image: "/images/menu/the_ultimate_dreamy.jpg"
    },
    {
        id: 8,
        name: "Strawberry Biscoff",
        description: "1 Full Brownie + 6 sliced strawberries; 2 tsp Biscoff spread + 1 Biscoff biscuit + white choco shavings.",
        price: 149,
        tier: 3, // Premium tier
        comboEligible: false,
        image: "/images/menu/strawberry_biscoff.jpg"
    }
];

// Pricing Configuration for Hinjewadi Student Market
// Tiers: 1 (Economy), 2 (Mid-Tier), 3 (Premium)
export const PRICING_CONFIG = {
    tiers: {
        1: { label: 'Economy', color: '#98FF98', min: 40, max: 49 },
        2: { label: 'Mid-Tier', color: '#FFFF00', min: 50, max: 59 },
        3: { label: 'Premium', color: '#FF00FF', min: 129, max: 149 }
    },
    // Global deducted items per order
    packaging: {
        tub: 1, // 300ml Kraft Tub
        spoon: 1
    },
    combos: {
        hinjewadiHustle: { price: 79, save: 'Variable' },
        dreamyDuo: { discount: 10, save: 10 },
        ultimateEscape: { price: 149, save: 20 }
    },
    upsells: [
        {
            id: 'u1',
            name: 'Extra Brownie Cube',
            description: 'Add rich, fudgy brownie cube',
            price: 25,
            margin: 'high',
            icon: '🍫'
        },
        {
            id: 'u2',
            name: 'Extra Ganache Drizzle',
            description: 'Warm chocolate ganache topping',
            price: 20,
            margin: 'high',
            icon: '🍯'
        },
        {
            id: 'u3',
            name: 'Gold Dust Finish',
            description: 'Premium edible gold dust',
            price: 30,
            margin: 'premium',
            icon: '✨'
        }
    ]
};

// Advanced Combo Modules (New Design)
export const COMBO_MODULES = [
    {
        id: 'module_a',
        code: 'HINJEWADI_HUSTLE',
        headline: "Hinjewadi Hustle 🌙",
        subtext: "Perfect for a late-night study break.",
        pricingDisplay: { original: 89, current: 79, save: 10 },
        badge: "Verified Deal",
        config: {
            type: '1_PLUS_FIXED',
            allowedItemIds: [1, 2], // Banana Choco Tub, OG Brownie Tub
            fixedItemId: 3 // Student Hot Choco
        }
    },
    {
        id: 'module_b',
        code: 'DREAMY_DUO',
        headline: "The Dreamy Duo 👯‍♂️",
        subtext: "Double the joy, half the price.",
        pricingDisplay: { original: 100, current: 90, save: 10 },
        badge: "Verified Deal",
        config: {
            type: 'SELECT_2_FROM_SET',
            allowedItemIds: [4, 5, 6] // Triple Treat Tub, Cold Choco Shot, Oreo Midnight Tub
        }
    },
    {
        id: 'module_c',
        code: 'ULTIMATE_ESCAPE',
        headline: "The Ultimate Escape ✨",
        subtext: "For the ultimate chocolate lover.",
        pricingDisplay: { original: 169, current: 149, save: 20 }, // 129 + 40 = 169. Save 20.
        badge: "Verified Deal",
        config: {
            type: 'FIXED_BUNDLE',
            items: [7, 3] // Ultimate Dreamy, Student Hot Choco
        }
    }
];
export const INGREDIENTS = {
    bases: [
        { id: 'b1', name: 'Brownie Cubes', price: 45 },
        { id: 'b2', name: 'Whipped Chocolate Mousse', price: 60 },
        { id: 'b3', name: 'Fresh Sliced Banana', price: 20 }
    ],
    sauces: [
        { id: 's1', name: 'Hot Chocolate Fudge', price: 35 },
        { id: 's2', name: 'Warm Ganache', price: 40 },
        { id: 's3', name: 'Melted Dark Chocolate', price: 30 },
        { id: 's4', name: 'Biscoff Spread', price: 45 }
    ],
    toppings: [
        { id: 't2', name: 'KitKat Finger', price: 40 },
        { id: 't3', name: 'Oreo (Whole)', price: 30 },
        { id: 't4', name: 'Crushed Oreo', price: 25 },
        { id: 't5', name: 'Gems', price: 25 },
        { id: 't6', name: 'Biscoff Biscuit', price: 35 },
        { id: 't7', name: 'Little Hearts', price: 20 },
        { id: 't8', name: 'Fresh Strawberries', price: 35 },
        { id: 't9', name: 'Sliced Banana', price: 20 },
        { id: 't14', name: 'Mixed Nuts', price: 35 },
        { id: 't16', name: 'Biscuit Crumbs', price: 20 }
    ]
};
