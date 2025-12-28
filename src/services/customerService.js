import { db } from "../firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, getDocs, setDoc, getDoc, query, where } from "firebase/firestore";

const COLLECTION_NAME = "customers";

// Helper to check if Firebase is configured
const isFirebaseConfigured = () => {
    try {
        return db.app.options.apiKey !== "PLACEHOLDER_API_KEY";
    } catch (e) {
        return false;
    }
};

// Rewards configuration (Approx 10-15% Cashback Value)
// 1 Point = ₹1 Spent
export const REWARDS = {
    200: 20,   // 200 points = ₹20 off (10%)
    500: 60,   // 500 points = ₹60 off (12%)
    1000: 150  // 1000 points = ₹150 off (15%)
};

// VIP tiers
export const VIP_TIERS = {
    regular: { min: 0, bonus: 0, name: 'Regular' },
    silver: { min: 500, bonus: 5, name: 'Silver' }, // 5% bonus points
    gold: { min: 1000, bonus: 10, name: 'Gold' }    // 10% bonus points
};

export const CustomerService = {
    // Get or create customer by phone
    getOrCreateCustomer: async (phone, name = '') => {
        if (!isFirebaseConfigured()) {
            // LocalStorage fallback
            const customers = JSON.parse(localStorage.getItem('customers') || '{}');

            if (customers[phone]) {
                return customers[phone];
            }

            // Create new customer
            const newCustomer = {
                phone,
                name,
                points: 0,
                totalSpent: 0,
                orderCount: 0,
                joinDate: new Date().toISOString(),
                lastVisit: new Date().toISOString(),
                vipTier: 'regular',
                orderHistory: []
            };

            customers[phone] = newCustomer;
            localStorage.setItem('customers', JSON.stringify(customers));
            window.dispatchEvent(new Event('customers-updated'));

            return newCustomer;
        }

        try {
            // Firebase implementation
            const customerRef = doc(db, COLLECTION_NAME, phone);
            const customerSnap = await getDoc(customerRef);

            if (customerSnap.exists()) {
                // Update last visit
                await updateDoc(customerRef, {
                    lastVisit: new Date()
                });
                return { phone, ...customerSnap.data() };
            }

            // Create new customer
            const newCustomer = {
                phone,
                name,
                points: 0,
                totalSpent: 0,
                orderCount: 0,
                joinDate: new Date(),
                lastVisit: new Date(),
                vipTier: 'regular',
                orderHistory: []
            };

            await setDoc(customerRef, newCustomer);
            return newCustomer;
        } catch (error) {
            console.error("Error getting/creating customer:", error);
            // Fallback to LocalStorage
            const customers = JSON.parse(localStorage.getItem('customers') || '{}');
            if (!customers[phone]) {
                customers[phone] = {
                    phone, name, points: 0, totalSpent: 0, orderCount: 0,
                    joinDate: new Date().toISOString(), lastVisit: new Date().toISOString(),
                    vipTier: 'regular', orderHistory: []
                };
                localStorage.setItem('customers', JSON.stringify(customers));
            }
            return customers[phone];
        }
    },

    // Award points for purchase
    awardPoints: async (phone, amount, orderId) => {
        const customer = await CustomerService.getOrCreateCustomer(phone);

        // Calculate points with VIP bonus
        const basePoints = Math.floor(amount); // ₹1 = 1 point
        const tierBonus = VIP_TIERS[customer.vipTier].bonus;
        const bonusPoints = Math.floor(basePoints * (tierBonus / 100));
        const totalPoints = basePoints + bonusPoints;

        const newPoints = customer.points + totalPoints;
        const newTotalSpent = customer.totalSpent + amount;
        const newOrderCount = customer.orderCount + 1;

        // Determine new VIP tier
        let newTier = 'regular';
        if (newPoints >= VIP_TIERS.gold.min) newTier = 'gold';
        else if (newPoints >= VIP_TIERS.silver.min) newTier = 'silver';

        // Update order history
        const orderHistory = [...(customer.orderHistory || []), orderId];

        if (!isFirebaseConfigured()) {
            const customers = JSON.parse(localStorage.getItem('customers') || '{}');
            customers[phone] = {
                ...customer,
                points: newPoints,
                totalSpent: newTotalSpent,
                orderCount: newOrderCount,
                vipTier: newTier,
                orderHistory,
                lastVisit: new Date().toISOString()
            };
            localStorage.setItem('customers', JSON.stringify(customers));
            window.dispatchEvent(new Event('customers-updated'));
            return { pointsEarned: totalPoints, bonusPoints, newTier };
        }

        try {
            const customerRef = doc(db, COLLECTION_NAME, phone);
            await updateDoc(customerRef, {
                points: newPoints,
                totalSpent: newTotalSpent,
                orderCount: newOrderCount,
                vipTier: newTier,
                orderHistory,
                lastVisit: new Date()
            });

            return { pointsEarned: totalPoints, bonusPoints, newTier };
        } catch (error) {
            console.error("Error awarding points:", error);
            return { pointsEarned: 0, bonusPoints: 0, newTier: customer.vipTier };
        }
    },

    // Redeem points for discount
    redeemPoints: async (phone, pointsToRedeem) => {
        const customer = await CustomerService.getOrCreateCustomer(phone);

        if (customer.points < pointsToRedeem) {
            throw new Error('Insufficient points');
        }

        const discount = REWARDS[pointsToRedeem];
        if (!discount) {
            throw new Error('Invalid reward amount');
        }

        const newPoints = customer.points - pointsToRedeem;

        if (!isFirebaseConfigured()) {
            const customers = JSON.parse(localStorage.getItem('customers') || '{}');
            customers[phone].points = newPoints;
            localStorage.setItem('customers', JSON.stringify(customers));
            window.dispatchEvent(new Event('customers-updated'));
            return discount;
        }

        try {
            const customerRef = doc(db, COLLECTION_NAME, phone);
            await updateDoc(customerRef, {
                points: newPoints
            });
            return discount;
        } catch (error) {
            console.error("Error redeeming points:", error);
            throw error;
        }
    },

    // Get available rewards for customer
    getAvailableRewards: (points) => {
        return Object.entries(REWARDS)
            .filter(([requiredPoints]) => points >= parseInt(requiredPoints))
            .map(([requiredPoints, discount]) => ({
                points: parseInt(requiredPoints),
                discount,
                label: `${requiredPoints} points = ₹${discount} off`
            }))
            .sort((a, b) => b.points - a.points); // Highest first
    },

    // Get VIP tier info
    getVIPTierInfo: (points) => {
        let tier = 'regular';
        if (points >= VIP_TIERS.gold.min) tier = 'gold';
        else if (points >= VIP_TIERS.silver.min) tier = 'silver';

        return {
            current: VIP_TIERS[tier],
            next: tier === 'regular' ? VIP_TIERS.silver : tier === 'silver' ? VIP_TIERS.gold : null,
            pointsToNext: tier === 'regular' ? VIP_TIERS.silver.min - points : tier === 'silver' ? VIP_TIERS.gold.min - points : 0
        };
    },

    // Subscribe to all customers (for admin)
    subscribeToCustomers: (callback) => {
        if (!isFirebaseConfigured()) {
            const loadLocal = () => {
                const customers = JSON.parse(localStorage.getItem('customers') || '{}');
                callback(Object.values(customers));
            };
            loadLocal();
            window.addEventListener('customers-updated', loadLocal);
            return () => window.removeEventListener('customers-updated', loadLocal);
        }

        try {
            const unsubscribe = onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
                const customers = snapshot.docs.map(doc => ({
                    phone: doc.id,
                    ...doc.data()
                }));
                callback(customers);
            }, (error) => {
                console.warn("Firebase subscribe failed, using LocalStorage:", error);
                const customers = JSON.parse(localStorage.getItem('customers') || '{}');
                callback(Object.values(customers));
            });
            return unsubscribe;
        } catch (error) {
            console.error("Setup error:", error);
            return () => { };
        }
    },

    // Get top customers
    getTopCustomers: async (limit = 10) => {
        if (!isFirebaseConfigured()) {
            const customers = JSON.parse(localStorage.getItem('customers') || '{}');
            return Object.values(customers)
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, limit);
        }

        try {
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            const customers = snapshot.docs.map(doc => ({
                phone: doc.id,
                ...doc.data()
            }));
            return customers
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, limit);
        } catch (error) {
            console.error("Error getting top customers:", error);
            return [];
        }
    }
};
