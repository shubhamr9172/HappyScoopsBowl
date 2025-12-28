import { db } from "../firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, getDocs, setDoc } from "firebase/firestore";

const COLLECTION_NAME = "inventory";

// Helper to check if Firebase is configured
const isFirebaseConfigured = () => {
    try {
        return db.app.options.apiKey !== "PLACEHOLDER_API_KEY";
    } catch (e) {
        return false;
    }
};

// Default inventory items
const DEFAULT_INVENTORY = [
    // Bases
    { id: 'vanilla-base', name: 'Vanilla Ice Cream', category: 'base', currentStock: 100, unit: 'scoops', minStock: 20, costPerUnit: 15 },
    { id: 'chocolate-base', name: 'Chocolate Ice Cream', category: 'base', currentStock: 100, unit: 'scoops', minStock: 20, costPerUnit: 18 },
    { id: 'mango-base', name: 'Mango Ice Cream', category: 'base', currentStock: 100, unit: 'scoops', minStock: 20, costPerUnit: 18 },

    // Sauces
    { id: 'chocolate-sauce', name: 'Chocolate Sauce', category: 'sauce', currentStock: 50, unit: 'servings', minStock: 10, costPerUnit: 8 },
    { id: 'biscoff-sauce', name: 'Biscoff Sauce', category: 'sauce', currentStock: 50, unit: 'servings', minStock: 10, costPerUnit: 15 },
    { id: 'strawberry-sauce', name: 'Strawberry Sauce', category: 'sauce', currentStock: 50, unit: 'servings', minStock: 10, costPerUnit: 8 },
    { id: 'caramel-sauce', name: 'Caramel Sauce', category: 'sauce', currentStock: 50, unit: 'servings', minStock: 10, costPerUnit: 10 },

    // Toppings
    { id: 'brownie', name: 'Brownie Chunks', category: 'topping', currentStock: 40, unit: 'pieces', minStock: 10, costPerUnit: 12 },
    { id: 'choco-chips', name: 'Chocolate Chips', category: 'topping', currentStock: 60, unit: 'servings', minStock: 15, costPerUnit: 6 },
    { id: 'biscuit-crumbs', name: 'Biscuit Crumbs', category: 'topping', currentStock: 60, unit: 'servings', minStock: 15, costPerUnit: 6 },
    { id: 'mixed-nuts', name: 'Mixed Nuts', category: 'topping', currentStock: 50, unit: 'servings', minStock: 10, costPerUnit: 10 },
    { id: 'tutti-frutti', name: 'Tutti Frutti', category: 'topping', currentStock: 70, unit: 'servings', minStock: 15, costPerUnit: 4 }
];

// Ingredient mapping for menu items
export const INGREDIENT_RECIPES = {
    // Prebuilt Combos
    'biscoff-indulgence': [
        { id: 'vanilla-base', quantity: 2 },
        { id: 'biscoff-sauce', quantity: 1 },
        { id: 'biscuit-crumbs', quantity: 1 }
    ],
    'chocolate-overload': [
        { id: 'chocolate-base', quantity: 2 },
        { id: 'chocolate-sauce', quantity: 1 },
        { id: 'brownie', quantity: 1 }
    ],
    'mango-madness': [
        { id: 'mango-base', quantity: 2 },
        { id: 'strawberry-sauce', quantity: 1 },
        { id: 'mixed-nuts', quantity: 1 }
    ],
    'berry-blast': [
        { id: 'vanilla-base', quantity: 2 },
        { id: 'strawberry-sauce', quantity: 1 },
        { id: 'tutti-frutti', quantity: 1 }
    ],
    'nutty-professor': [
        { id: 'chocolate-base', quantity: 2 },
        { id: 'caramel-sauce', quantity: 1 },
        { id: 'mixed-nuts', quantity: 1 }
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
            // Get recipe for prebuilt combo
            const comboKey = itemId.toString().toLowerCase().replace(/\s+/g, '-');
            recipe = INGREDIENT_RECIPES[comboKey] || [];
        } else if (itemType === 'CUSTOM' && customDetails) {
            // Build recipe from custom selections
            if (customDetails.base) {
                const baseId = customDetails.base.name.toLowerCase() + '-base';
                recipe.push({ id: baseId, quantity: 2 });
            }
            if (customDetails.sauce) {
                const sauceId = customDetails.sauce.name.toLowerCase() + '-sauce';
                recipe.push({ id: sauceId, quantity: 1 });
            }
            if (customDetails.toppings) {
                customDetails.toppings.forEach(topping => {
                    const toppingId = topping.name.toLowerCase().replace(/\s+/g, '-');
                    recipe.push({ id: toppingId, quantity: 1 });
                });
            }
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

            orderItems.forEach(item => {
                let recipe = [];

                if (item.type === 'COMBO') {
                    const comboKey = item.id.toString().toLowerCase().replace(/\s+/g, '-');
                    recipe = INGREDIENT_RECIPES[comboKey] || [];
                } else if (item.type === 'CUSTOM' && item.details) {
                    if (item.details.base) {
                        const baseId = item.details.base.name.toLowerCase() + '-base';
                        recipe.push({ id: baseId, quantity: 2 });
                    }
                    if (item.details.sauce) {
                        const sauceId = item.details.sauce.name.toLowerCase() + '-sauce';
                        recipe.push({ id: sauceId, quantity: 1 });
                    }
                    if (item.details.toppings) {
                        item.details.toppings.forEach(topping => {
                            const toppingId = topping.name.toLowerCase().replace(/\s+/g, '-');
                            recipe.push({ id: toppingId, quantity: 1 });
                        });
                    }
                }

                recipe.forEach(ingredient => {
                    const idx = inventory.findIndex(i => i.id === ingredient.id);
                    if (idx !== -1) {
                        inventory[idx].currentStock -= ingredient.quantity;
                    }
                });
            });

            localStorage.setItem('inventory', JSON.stringify(inventory));
            window.dispatchEvent(new Event('inventory-updated'));
            return;
        }

        try {
            // Firebase implementation
            for (const item of orderItems) {
                let recipe = [];

                if (item.type === 'COMBO') {
                    const comboKey = item.id.toString().toLowerCase().replace(/\s+/g, '-');
                    recipe = INGREDIENT_RECIPES[comboKey] || [];
                } else if (item.type === 'CUSTOM' && item.details) {
                    if (item.details.base) {
                        const baseId = item.details.base.name.toLowerCase() + '-base';
                        recipe.push({ id: baseId, quantity: 2 });
                    }
                    if (item.details.sauce) {
                        const sauceId = item.details.sauce.name.toLowerCase() + '-sauce';
                        recipe.push({ id: sauceId, quantity: 1 });
                    }
                    if (item.details.toppings) {
                        item.details.toppings.forEach(topping => {
                            const toppingId = topping.name.toLowerCase().replace(/\s+/g, '-');
                            recipe.push({ id: toppingId, quantity: 1 });
                        });
                    }
                }

                for (const ingredient of recipe) {
                    const itemRef = doc(db, COLLECTION_NAME, ingredient.id);
                    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
                    const currentItem = snapshot.docs.find(d => d.id === ingredient.id);

                    if (currentItem) {
                        const data = currentItem.data();
                        await updateDoc(itemRef, {
                            currentStock: data.currentStock - ingredient.quantity
                        });
                    }
                }
            }
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

    // Get low stock items
    getLowStockItems: (inventory) => {
        return inventory.filter(item => item.currentStock <= item.minStock);
    },

    // Calculate cost for menu item
    calculateItemCost: (itemId, itemType, customDetails = null) => {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        let recipe = [];

        if (itemType === 'COMBO') {
            const comboKey = itemId.toString().toLowerCase().replace(/\s+/g, '-');
            recipe = INGREDIENT_RECIPES[comboKey] || [];
        } else if (itemType === 'CUSTOM' && customDetails) {
            if (customDetails.base) {
                const baseId = customDetails.base.name.toLowerCase() + '-base';
                recipe.push({ id: baseId, quantity: 2 });
            }
            if (customDetails.sauce) {
                const sauceId = customDetails.sauce.name.toLowerCase() + '-sauce';
                recipe.push({ id: sauceId, quantity: 1 });
            }
            if (customDetails.toppings) {
                customDetails.toppings.forEach(topping => {
                    const toppingId = topping.name.toLowerCase().replace(/\s+/g, '-');
                    recipe.push({ id: toppingId, quantity: 1 });
                });
            }
        }

        let totalCost = 0;
        recipe.forEach(ingredient => {
            const item = inventory.find(i => i.id === ingredient.id);
            if (item) {
                totalCost += item.costPerUnit * ingredient.quantity;
            }
        });

        return totalCost;
    }
};
