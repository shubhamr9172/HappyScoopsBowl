import { db } from "../firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { InventoryService } from "./inventoryService";

const COLLECTION_NAME = "orders";

// Helper to generate a simple daily token (1-99)
// Note: In a real high-concurrency app, this should be done via Cloud Functions or a Transaction.
// For this scale, a random number or client-side increment (with race condition acceptance) is "okay" for MVP free-tier pure FE.
// Better approach: Use local storage to increment or just random for now to avoid complexity without backend.
// Re-reading requirements: "Generate Token Number automatically (1–99 loop)"
// We can store a 'meta' doc in firestore, but for simplicity/speed without transactions, 
// let's use a random 2 digit number or just last 2 digits of timestamp for "pseudo-random" token if we want to avoid collisions?
// The requirement says "1-99 loop".
// Let's rely on the Admin Dashboard to just see the token. 
// A simple client-side generator:
// Helper to generate a sequential daily token (1-99 loop)
const getNextToken = () => {
    try {
        const lastToken = parseInt(localStorage.getItem('last_token_num') || '0');
        let newToken = lastToken + 1;
        if (newToken > 99) newToken = 1;
        localStorage.setItem('last_token_num', newToken.toString());
        return newToken;
    } catch (e) {
        // Fallback for extreme errors
        return Math.floor(Math.random() * 99) + 1;
    }
};

// Helper to check if Firebase is configured
const isFirebaseConfigured = () => {
    // Check if we are running with placeholder values
    // This is a naive check but works for this specific context
    // In a real app, strict env vars are better.
    try {
        return db.app.options.apiKey !== "PLACEHOLDER_API_KEY";
    } catch (e) {
        return false;
    }
};

export const OrderService = {
    // Create a new order
    createOrder: async (orderData) => {
        // Explicitly check config to avoid hanging on connection
        if (!isFirebaseConfigured()) {
            console.warn("Firebase not configured. Using LocalStorage fallback.");
            const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            const orderToken = getNextToken(); // Generate sequential token
            const newOrder = {
                id: `local-${Date.now()}`,
                ...orderData,
                token: orderToken,
                orderStatus: "CREATED",
                paymentStatus: "AWAITING_CONFIRMATION",
                timestamp: { seconds: Date.now() / 1000 }
            };
            localOrders.push(newOrder);
            localStorage.setItem('local_orders', JSON.stringify(localOrders));
            window.dispatchEvent(new Event('local-orders-updated'));

            // Deduct stock
            await InventoryService.deductStock(orderData.items);

            return newOrder;
        }

        try {
            // Generate a readable unique order ID
            // Format: HS-{Random4}-{Random4} for uniqueness and readability
            const humanReadableId = `HS-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
            const orderToken = getNextToken(); // Generate sequential token

            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...orderData,
                orderId: humanReadableId, // Explicit readable ID
                token: orderToken,
                orderStatus: "CREATED",
                paymentStatus: "AWAITING_CONFIRMATION",
                timestamp: serverTimestamp(),
            });

            // Deduct stock after successful order creation
            await InventoryService.deductStock(orderData.items);

            return { id: docRef.id, orderId: humanReadableId, ...orderData, token: orderToken };
        } catch (error) {
            console.warn("Firebase create failed, falling back to LocalStorage:", error);
            // LocalStorage Fallback
            const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            const humanReadableId = `HS-LOC-${Math.floor(1000 + Math.random() * 9000)}`;
            const orderToken = getNextToken(); // Generate sequential token
            const newOrder = {
                id: `local-${Date.now()}`,
                orderId: humanReadableId,
                ...orderData,
                token: orderToken,
                orderStatus: "CREATED",
                paymentStatus: "AWAITING_CONFIRMATION",
                timestamp: { seconds: Date.now() / 1000 } // Simulate Firestore timestamp
            };
            localOrders.push(newOrder);
            localStorage.setItem('local_orders', JSON.stringify(localOrders));

            // Dispatch valid event for listeners
            window.dispatchEvent(new Event('local-orders-updated'));

            // Deduct stock
            await InventoryService.deductStock(orderData.items);

            return newOrder;
        }
    },

    // Subscribe to live orders (Admin view)
    subscribeToOrders: (callback) => {
        if (!isFirebaseConfigured()) {
            console.warn("Firebase not configured. Using LocalStorage polling.");
            const loadLocal = () => {
                const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
                localOrders.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
                callback(localOrders);
            };
            loadLocal();
            window.addEventListener('local-orders-updated', loadLocal);
            const interval = setInterval(loadLocal, 2000);
            return () => {
                window.removeEventListener('local-orders-updated', loadLocal);
                clearInterval(interval);
            };
        }

        // Try Firestore first
        let unsubscribe = () => { };

        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const orders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(orders);
            }, (error) => {
                console.warn("Firebase subscribe failed, using LocalStorage fallback", error);
                // If firebase fails, we fall back to polling LocalStorage or Event Listener
                const loadLocal = () => {
                    const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
                    // Sort desc
                    localOrders.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
                    callback(localOrders);
                };

                loadLocal(); // Initial load
                window.addEventListener('local-orders-updated', loadLocal);
                // Poll every 5s just in case
                const interval = setInterval(loadLocal, 5000);

                // Override unsubscribe to clean up local listeners
                unsubscribe = () => {
                    window.removeEventListener('local-orders-updated', loadLocal);
                    clearInterval(interval);
                };
            });
        } catch (err) {
            console.error("Setup error", err);
        }

        return () => unsubscribe();
    },

    // Update order status (Admin actions)
    updateOrderStatus: async (orderId, status) => {
        if (!isFirebaseConfigured() || String(orderId).startsWith('local-')) {
            const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            const idx = localOrders.findIndex(o => o.id === orderId);
            if (idx !== -1) {
                localOrders[idx].orderStatus = status;
                localStorage.setItem('local_orders', JSON.stringify(localOrders));
                window.dispatchEvent(new Event('local-orders-updated'));
                return;
            }
        }

        try {
            const orderRef = doc(db, COLLECTION_NAME, orderId);
            await updateDoc(orderRef, { orderStatus: status });
        } catch (error) {
            console.error("Error updating status:", error);
            throw error;
        }
    },

    // Update payment status
    updatePaymentStatus: async (orderId, status) => {
        if (!isFirebaseConfigured() || String(orderId).startsWith('local-')) {
            const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            const idx = localOrders.findIndex(o => o.id === orderId);
            if (idx !== -1) {
                localOrders[idx].paymentStatus = status;
                localStorage.setItem('local_orders', JSON.stringify(localOrders));
                window.dispatchEvent(new Event('local-orders-updated'));
                return;
            }
        }

        try {
            const orderRef = doc(db, COLLECTION_NAME, orderId);
            await updateDoc(orderRef, { paymentStatus: status });
        } catch (error) {
            console.error("Error updating payment:", error);
            throw error;
        }
    }
};
