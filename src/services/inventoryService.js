import { db } from "../firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

const COLLECTION_NAME = "inventory";

// Helper to check if Firebase is configured
const isFirebaseConfigured = () => {
    try {
        return db.app.options.apiKey !== "PLACEHOLDER_API_KEY";
    } catch (e) {
        return false;
    }
};

// Default inventory items for "The Dreamy Bowl"
const DEFAULT_INVENTORY = [
    // Bases & Bakery
    { id: 'brownie-cube', name: 'Brownie Cubes', category: 'bakery', currentStock: 200, unit: 'pieces', minStock: 50, costPerUnit: 5, alertMessage: "CRITICAL: Brownie stock low!" },
    { id: 'choc-mousse', name: 'Chocolate Mousse', category: 'base', currentStock: 100, unit: 'scoops', minStock: 20, costPerUnit: 15 },
    { id: 'vanilla-ice-cream', name: 'Vanilla Ice Cream', category: 'base', currentStock: 50, unit: 'scoops', minStock: 10, costPerUnit: 12 },

    // Dairy & Liquids
    { id: 'milk', name: 'Milk', category: 'dairy', currentStock: 10000, unit: 'ml', minStock: 1000, costPerUnit: 0.06 }, // 60/liter
    { id: 'ganache', name: 'Dark Choc Ganache', category: 'sauce', currentStock: 2000, unit: 'ml', minStock: 500, costPerUnit: 0.5 },
    { id: 'hot-fudge', name: 'Hot Chocolate Fudge', category: 'sauce', currentStock: 2000, unit: 'ml', minStock: 500, costPerUnit: 0.4 },
    { id: 'biscoff-spread', name: 'Biscoff Spread', category: 'sauce', currentStock: 1000, unit: 'grams', minStock: 200, costPerUnit: 1.2 },

    // Produce
    { id: 'banana', name: 'Banana', category: 'produce', currentStock: 30, unit: 'pieces', minStock: 5, costPerUnit: 5 },
    { id: 'strawberry', name: 'Strawberry', category: 'produce', currentStock: 50, unit: 'pieces', minStock: 10, costPerUnit: 8 },

    // Toppings & Mix-ins
    { id: 'oreo', name: 'Oreo Biscuit', category: 'topping', currentStock: 100, unit: 'pieces', minStock: 20, costPerUnit: 5 },
    { id: 'kitkat', name: 'KitKat Finger', category: 'topping', currentStock: 100, unit: 'pieces', minStock: 20, costPerUnit: 6 },
    { id: 'biscoff-biscuit', name: 'Biscoff Biscuit', category: 'topping', currentStock: 100, unit: 'pieces', minStock: 20, costPerUnit: 8 },
    { id: 'marshmallow', name: 'Marshmallow', category: 'topping', currentStock: 100, unit: 'pieces', minStock: 20, costPerUnit: 2 },
    { id: 'choco-chips-dark', name: 'Dark Choco Chips', category: 'topping', currentStock: 1000, unit: 'grams', minStock: 200, costPerUnit: 0.5 },
    { id: 'choco-chips-milk', name: 'Milk Choco Chips', category: 'topping', currentStock: 1000, unit: 'grams', minStock: 200, costPerUnit: 0.5 },
    { id: 'choco-chips-white', name: 'White Choco Chips', category: 'topping', currentStock: 1000, unit: 'grams', minStock: 200, costPerUnit: 0.5 },
    { id: 'white-shavings', name: 'White Choco Shavings', category: 'topping', currentStock: 500, unit: 'grams', minStock: 100, costPerUnit: 0.8 },
    { id: 'gold-dust', name: 'Edible Gold Dust', category: 'topping', currentStock: 50, unit: 'servings', minStock: 5, costPerUnit: 20 },
    { id: 'dark-chocolate-block', name: 'Dark Chocolate Block', category: 'base', currentStock: 2000, unit: 'grams', minStock: 500, costPerUnit: 0.6 },
    { id: 'cornflour', name: 'Cornflour', category: 'pantry', currentStock: 1000, unit: 'grams', minStock: 200, costPerUnit: 0.1 },

    // Packaging
    { id: 'paper-tub-300ml', name: '300ml Paper Tub', category: 'packaging', currentStock: 200, unit: 'pieces', minStock: 30, costPerUnit: 3 },
    { id: 'wooden-spoon', name: 'Wooden Spoon', category: 'packaging', currentStock: 500, unit: 'pieces', minStock: 50, costPerUnit: 1 },
    { id: 'paper-cup-150ml', name: '150ml Paper Cup', category: 'packaging', currentStock: 200, unit: 'pieces', minStock: 30, costPerUnit: 2 },
];

// Ingredient mapping for menu items (Key is Item ID from menu.js)
export const INGREDIENT_RECIPES = {
    // 1. Banana Choco Tub
    '1': [
        { id: 'brownie-cube', quantity: 1 },
        { id: 'banana', quantity: 0.5 },
        { id: 'hot-fudge', quantity: 30 }, // ml
        { id: 'paper-tub-300ml', quantity: 1 },
        { id: 'wooden-spoon', quantity: 1 }
    ],
    // 2. OG Brownie Tub
    '2': [
        { id: 'brownie-cube', quantity: 2 },
        { id: 'choc-mousse', quantity: 1 },
        { id: 'ganache', quantity: 15 }, // ml
        { id: 'paper-tub-300ml', quantity: 1 },
        { id: 'wooden-spoon', quantity: 1 }
    ],
    // 3. Student Hot Choco
    '3': [
        { id: 'milk', quantity: 150 },
        { id: 'dark-chocolate-block', quantity: 20 }, // grams
        { id: 'cornflour', quantity: 5 }, // grams
        { id: 'marshmallow', quantity: 1 },
        { id: 'paper-cup-150ml', quantity: 1 }
    ],
    // 4. Triple Treat Tub
    '4': [
        { id: 'choc-mousse', quantity: 2 },
        { id: 'choco-chips-dark', quantity: 10 },
        { id: 'choco-chips-milk', quantity: 10 },
        { id: 'choco-chips-white', quantity: 10 },
        { id: 'paper-tub-300ml', quantity: 1 },
        { id: 'wooden-spoon', quantity: 1 }
    ],
    // 5. Cold Choco Shot
    '5': [
        { id: 'milk', quantity: 180 },
        { id: 'ganache', quantity: 30 },
        { id: 'choc-mousse', quantity: 1 },
        { id: 'paper-cup-150ml', quantity: 1 } // Using paper cup for now
    ],
    // 6. Oreo Midnight Tub
    '6': [
        { id: 'oreo', quantity: 1.5 },
        { id: 'brownie-cube', quantity: 2 },
        { id: 'choc-mousse', quantity: 1 },
        { id: 'paper-tub-300ml', quantity: 1 },
        { id: 'wooden-spoon', quantity: 1 }
    ],
    // 7. The Ultimate Dreamy
    '7': [
        { id: 'brownie-cube', quantity: 4 },
        { id: 'choc-mousse', quantity: 2 },
        { id: 'kitkat', quantity: 1 },
        { id: 'oreo', quantity: 2 },
        { id: 'ganache', quantity: 30 },
        { id: 'gold-dust', quantity: 1 },
        { id: 'paper-tub-300ml', quantity: 1 },
        { id: 'wooden-spoon', quantity: 1 }
    ],
    // 8. Strawberry Biscoff
    '8': [
        { id: 'brownie-cube', quantity: 4 },
        { id: 'strawberry', quantity: 3 },
        { id: 'biscoff-spread', quantity: 15 }, // grams
        { id: 'biscoff-biscuit', quantity: 1 },
        { id: 'white-shavings', quantity: 5 },
        { id: 'paper-tub-300ml', quantity: 1 },
        { id: 'wooden-spoon', quantity: 1 }
    ]
};

export const InventoryService = {
    // Initialize inventory with default items
    initializeInventory: async () => {
        if (!isFirebaseConfigured()) {
            const localInventory = localStorage.getItem('inventory');
            if (!localInventory) {
                localStorage.setItem('inventory', JSON.stringify(DEFAULT_INVENTORY));
            }
            return;
        }

        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            if (snapshot.empty) {
                // Initialize with default items
                for (const item of DEFAULT_INVENTORY) {
                    await setDoc(doc(db, COLLECTION_NAME, item.id), {
                        ...item,
                        lastRestocked: new Date(),
                        usageHistory: []
                    });
                }
            }
        } catch (error) {
            console.warn("Firebase init failed, using LocalStorage:", error);
            const localInventory = localStorage.getItem('inventory');
            if (!localInventory) {
                localStorage.setItem('inventory', JSON.stringify(DEFAULT_INVENTORY));
            }
        }
    },

    // Subscribe to inventory changes
    subscribeToInventory: (callback) => {
        if (!isFirebaseConfigured()) {
            const loadLocal = () => {
                const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
                callback(inventory);
            };
            loadLocal();
            window.addEventListener('inventory-updated', loadLocal);
            return () => window.removeEventListener('inventory-updated', loadLocal);
        }

        try {
            const unsubscribe = onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
                const inventory = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(inventory);
            }, (error) => {
                console.warn("Firebase subscribe failed, using LocalStorage:", error);
                const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
                callback(inventory);
            });
            return unsubscribe;
        } catch (error) {
            console.error("Setup error:", error);
            return () => { };
        }
    },

    // Check if item can be made (has enough stock)
    checkAvailability: (itemId, itemType, customDetails = null) => {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');

        let recipe = [];

        if (itemType === 'COMBO') {
            // All modules in combo (this logic usually handled by checking individual items in cart)
            // But if checking a single combo ADDITION, we might need to check the specific items.
            // For now, assuming availability check is per-item.
            return true;
        }

        // Check standard menu item
        const recipeKey = itemId.toString();
        if (INGREDIENT_RECIPES[recipeKey]) {
            recipe = INGREDIENT_RECIPES[recipeKey];
        } else if (itemType === 'CUSTOM' && customDetails) {
            // Build recipe from custom selections
            if (customDetails.base) {
                const baseId = customDetails.base.id; // Assuming custom details pass correct IDs
                recipe.push({ id: baseId, quantity: 2 });
            }
            // Add other custom logic if needed, but for now focusing on Menu Items
        }

        // Check if all ingredients are available
        for (const ingredient of recipe) {
            const item = inventory.find(i => i.id === ingredient.id);
            if (!item || item.currentStock < ingredient.quantity) {
                return false;
            }
        }

        return true;
    },

    // Deduct stock for an order
    deductStock: async (orderItems) => {
        if (!isFirebaseConfigured()) {
            const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');

            // If inventory is empty/old, re-init with default to ensure we have items
            if (inventory.length === 0 || !inventory.find(i => i.id === 'brownie-cube')) {
                // Merge with default if missing critical items (fallback safety)
                // But better to just let it be if user deleted them. 
                // Here we assume "If completely empty", init.
            }

            orderItems.forEach(item => {
                let recipe = [];
                const recipeKey = item.id.toString();

                if (INGREDIENT_RECIPES[recipeKey]) {
                    recipe = INGREDIENT_RECIPES[recipeKey];
                } else {
                    // Handle Combos acting as single items or custom items if any
                }

                recipe.forEach(ingredient => {
                    const idx = inventory.findIndex(i => i.id === ingredient.id);
                    if (idx !== -1) {
                        const deductQty = ingredient.quantity * (item.quantity || 1);
                        inventory[idx].currentStock = Math.max(0, inventory[idx].currentStock - deductQty);
                    }
                });
            });

            localStorage.setItem('inventory', JSON.stringify(inventory));
            window.dispatchEvent(new Event('inventory-updated'));
            return;
        }

        try {
            // Firebase implementation - Optimized
            // 1. Aggregation: Calculate total needed for each ingredient first
            const deductions = {}; // Map<IngredientID, TotalQuantity>

            for (const item of orderItems) {
                let recipe = [];
                const recipeKey = item.id.toString();

                if (INGREDIENT_RECIPES[recipeKey]) {
                    recipe = INGREDIENT_RECIPES[recipeKey];
                }

                // Add logic for custom items if needed in future

                for (const ingredient of recipe) {
                    const totalQty = ingredient.quantity * (item.quantity || 1);
                    deductions[ingredient.id] = (deductions[ingredient.id] || 0) + totalQty;
                }
            }

            // 2. Execution: Update each affected ingredient
            // Using Promise.all for parallel processing since operations are independent per ingredient
            const updates = Object.entries(deductions).map(async ([ingId, qty]) => {
                const itemRef = doc(db, COLLECTION_NAME, ingId);
                try {
                    const itemSnap = await getDoc(itemRef);
                    if (itemSnap.exists()) {
                        const currentData = itemSnap.data();
                        await updateDoc(itemRef, {
                            currentStock: Math.max(0, (currentData.currentStock || 0) - qty)
                        });
                    }
                } catch (err) {
                    console.error(`Failed to update stock for ${ingId}:`, err);
                }
            });

            await Promise.all(updates);

        } catch (error) {
            console.error("Error deducting stock:", error);
        }
    },

    // Update stock (restock or adjust)
    updateStock: async (itemId, newStock) => {
        if (!isFirebaseConfigured()) {
            const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
            const idx = inventory.findIndex(i => i.id === itemId);
            if (idx !== -1) {
                inventory[idx].currentStock = newStock;
                inventory[idx].lastRestocked = new Date().toISOString();
            }
            localStorage.setItem('inventory', JSON.stringify(inventory));
            window.dispatchEvent(new Event('inventory-updated'));
            return;
        }

        try {
            const itemRef = doc(db, COLLECTION_NAME, itemId);
            await updateDoc(itemRef, {
                currentStock: newStock,
                lastRestocked: new Date()
            });
        } catch (error) {
            console.error("Error updating stock:", error);
        }
    },

    // Add new item
    addItem: async (itemData) => {
        if (!isFirebaseConfigured()) {
            const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
            const newItem = { ...itemData, id: Date.now().toString() };
            inventory.push(newItem);
            localStorage.setItem('inventory', JSON.stringify(inventory));
            window.dispatchEvent(new Event('inventory-updated'));
            return newItem;
        }

        try {
            // Use custom ID if provided (like 'sugar'), otherwise auto-id
            const itemId = itemData.id || Date.now().toString();
            // Create doc
            await setDoc(doc(db, COLLECTION_NAME, itemId), {
                ...itemData,
                id: itemId,
                lastRestocked: new Date()
            });
            return { ...itemData, id: itemId };
        } catch (error) {
            console.error("Error adding item:", error);
            throw error;
        }
    },

    // Delete item
    deleteItem: async (itemId) => {
        if (!isFirebaseConfigured()) {
            const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
            const updatedInventory = inventory.filter(i => i.id !== itemId);
            localStorage.setItem('inventory', JSON.stringify(updatedInventory));
            window.dispatchEvent(new Event('inventory-updated'));
            return;
        }

        try {
            await deleteDoc(doc(db, COLLECTION_NAME, itemId));
        } catch (error) {
            console.error("Error deleting item:", error);
            throw error;
        }
    },

    // Update item details (name, cost, category, etc)
    updateItemDetails: async (itemId, updates) => {
        if (!isFirebaseConfigured()) {
            const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
            const idx = inventory.findIndex(i => i.id === itemId);
            if (idx !== -1) {
                inventory[idx] = { ...inventory[idx], ...updates };
                localStorage.setItem('inventory', JSON.stringify(inventory));
                window.dispatchEvent(new Event('inventory-updated'));
            }
            return;
        }

        try {
            const itemRef = doc(db, COLLECTION_NAME, itemId);
            await updateDoc(itemRef, updates);
        } catch (error) {
            console.error("Error updating item details:", error);
            throw error;
        }
    },

    // --- Menu Availability Management ---

    // Get menu availability status
    getMenuAvailability: async () => {
        if (!isFirebaseConfigured()) {
            return JSON.parse(localStorage.getItem('menu_availability') || '{}');
        }
        try {
            // For now, let's just use localStorage for availability to ensure it works immediately
            // across reloads on this device, which matches the "kitchen tablet" use case.
            return JSON.parse(localStorage.getItem('menu_availability') || '{}');
        } catch (e) {
            return JSON.parse(localStorage.getItem('menu_availability') || '{}');
        }
    },

    // Toggle menu item availability
    updateItemAvailability: async (itemId, isAvailable) => {
        const availability = JSON.parse(localStorage.getItem('menu_availability') || '{}');
        availability[itemId] = isAvailable;
        localStorage.setItem('menu_availability', JSON.stringify(availability));
        window.dispatchEvent(new Event('menu-availability-updated'));
    },

    // Get low stock items helper
    getLowStockItems: (inventory) => {
        if (!Array.isArray(inventory)) return [];
        return inventory.filter(item => item.currentStock <= (item.minStock || 0));
    }
};
