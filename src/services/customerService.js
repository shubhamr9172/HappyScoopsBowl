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

// God Level Rewards (Gamified)
export const REWARDS = {
    50: 0,    // "The Drizzle" (Free Topping - handled operationally)
    120: 49,  // "The Free Dream" (Free OG Brownie Tub)
    200: 100  // Big Spender Bonus
};

// VIP tiers (Retaining for legacy, but Streaks are priority now)
export const VIP_TIERS = {
    regular: { min: 0, bonus: 0, name: 'Regular' },
    silver: { min: 500, bonus: 5, name: 'Silver' },
    gold: { min: 1000, bonus: 10, name: 'Gold' }
};

export const CustomerService = {
    // ... getOrCreateCustomer remains mostly same, just ensuring fields exist ...
    getOrCreateCustomer: async (phone, name = '') => {
        // ... (standard lookup) ...
        // Ensure new fields exist on returned object
        const defaultCust = {
            phone, name, points: 0, totalSpent: 0, orderCount: 0,
            joinDate: new Date().toISOString(), lastVisit: new Date().toISOString(),
            currentStreak: 0, lastOrderDate: null, // NEW FIELDS
            vipTier: 'regular', orderHistory: []
        };

        // ... local/firebase fetching ...
        // Merge defaults to ensure streak fields exist
        // (Implementation detail skipped for brevity, assumed handled in existing code or below)
        if (!isFirebaseConfigured()) {
            const customers = JSON.parse(localStorage.getItem('customers') || '{}');
            if (customers[phone]) return { ...defaultCust, ...customers[phone] };
            // create new...
            customers[phone] = defaultCust;
            localStorage.setItem('customers', JSON.stringify(customers));
            return defaultCust;
        }
        // ... firebase ...
        // (Assuming similar merge logic)
        try {
            const customerRef = doc(db, COLLECTION_NAME, phone);
            const customerSnap = await getDoc(customerRef);
            if (customerSnap.exists()) return { ...defaultCust, ...customerSnap.data() };
            await setDoc(customerRef, defaultCust);
            return defaultCust;
        } catch (e) { return defaultCust; }
    },

    // Award points + Handle Streaks
    awardPoints: async (phone, amount, orderId) => {
        const customer = await CustomerService.getOrCreateCustomer(phone);
        const now = new Date();

        // 1. Calculate Base Points
        const basePoints = Math.floor(amount / 10);
        let bonusPoints = 0;
        let streakMessage = null;

        // 2. STREAK LOGIC (The Habit Engine)
        let newStreak = 1;
        if (customer.lastOrderDate) {
            const lastDate = new Date(customer.lastOrderDate);
            const diffHours = (now - lastDate) / (1000 * 60 * 60);

            if (diffHours <= 24) {
                newStreak = (customer.currentStreak || 0) + 1;
            } else {
                newStreak = 1; // Streak broken
            }
        }

        // 3. Streak Milestones
        if (newStreak === 3) {
            bonusPoints += 25;
            streakMessage = "🔥 3-Day Streak! +25 Bonus Points!";
        } else if (newStreak === 5) {
            bonusPoints += 50;
            streakMessage = "🔥🔥 5-Day Streak! +50 Bonus Points!";
        }

        // 4. Update Data
        const totalPoints = basePoints + bonusPoints;
        const newPoints = customer.points + totalPoints;
        const newTotalSpent = customer.totalSpent + amount;

        // ... storage updates ...
        if (!isFirebaseConfigured()) {
            const customers = JSON.parse(localStorage.getItem('customers') || '{}');
            customers[phone] = {
                ...customer,
                points: newPoints,
                totalSpent: newTotalSpent,
                orderCount: customer.orderCount + 1,
                currentStreak: newStreak,
                lastOrderDate: now.toISOString(),
                orderHistory: [...(customer.orderHistory || []), orderId]
            };
            localStorage.setItem('customers', JSON.stringify(customers));
            window.dispatchEvent(new Event('customers-updated'));
            return { pointsEarned: totalPoints, bonusPoints, newStreak, streakMessage };
        }

        try {
            const customerRef = doc(db, COLLECTION_NAME, phone);
            // Re-calculate derived values for Firebase update if needed or just use what we computed
            const newOrderCount = customer.orderCount + 1;
            const orderHistory = [...(customer.orderHistory || []), orderId];

            // Determine tier again for consistency or reuse logic if we trust var scope
            // Simplest is to just update the fields we know changed
            await updateDoc(customerRef, {
                points: newPoints,
                totalSpent: newTotalSpent,
                orderCount: newOrderCount,
                // Upgrade tier if points crossed threshold
                vipTier: (newPoints >= VIP_TIERS.gold.min) ? 'gold' : (newPoints >= VIP_TIERS.silver.min) ? 'silver' : 'regular',
                orderHistory,
                currentStreak: newStreak,
                lastOrderDate: now, // Firestore timestamp
                lastVisit: now
            });

            return { pointsEarned: totalPoints, bonusPoints, newStreak, streakMessage };
        } catch (error) {
            console.error("Error awarding points:", error);
            return { pointsEarned: 0, bonusPoints: 0, newStreak: 1, streakMessage: null };
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
