// Notification Service - Sound and Visual Alerts for New Orders

// Simple notification sound (base64 encoded beep)
const NOTIFICATION_SOUND = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OmfTgwOUKXh8LdjHAU5k9jyzHksBSR3x/DdkEAKFF+16+uoVRQKRp/g8r5sIQYsgc7y2Ik2CBhnu+zpn04MDlCl4fC3YxwFOZPY8sx5LAUkd8fw3ZBAChRftevr');

export const NotificationService = {
    lastOrderCount: 0,
    isMuted: false,
    hasPermission: false,

    // Initialize notification service
    init: async () => {
        // Request browser notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            NotificationService.hasPermission = permission === 'granted';
        } else if ('Notification' in window && Notification.permission === 'granted') {
            NotificationService.hasPermission = true;
        }

        // Load mute preference from localStorage
        const mutePreference = localStorage.getItem('notifications_muted');
        NotificationService.isMuted = mutePreference === 'true';
    },

    // Toggle mute/unmute
    toggleMute: () => {
        NotificationService.isMuted = !NotificationService.isMuted;
        localStorage.setItem('notifications_muted', NotificationService.isMuted.toString());
        return NotificationService.isMuted;
    },

    // Play notification sound
    playSound: () => {
        if (NotificationService.isMuted) return;

        try {
            NOTIFICATION_SOUND.currentTime = 0;
            NOTIFICATION_SOUND.play().catch(err => {
                console.log('Sound play failed:', err);
            });
        } catch (error) {
            console.log('Sound error:', error);
        }
    },

    // Show browser notification
    showBrowserNotification: (order) => {
        if (!NotificationService.hasPermission) return;

        try {
            const notification = new Notification('🍦 New Order!', {
                body: `Token #${order.token} - ₹${order.totalAmount}`,
                icon: '/logos/logo_3d_glossy.png',
                badge: '/logos/logo_3d_glossy.png',
                tag: 'new-order',
                requireInteraction: false
            });

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);
        } catch (error) {
            console.log('Browser notification error:', error);
        }
    },

    // Flash screen animation
    flashScreen: () => {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 107, 107, 0.3);
            z-index: 9999;
            pointer-events: none;
            animation: flashAnimation 0.5s ease-out;
        `;

        // Add keyframe animation
        if (!document.getElementById('flash-animation-style')) {
            const style = document.createElement('style');
            style.id = 'flash-animation-style';
            style.textContent = `
                @keyframes flashAnimation {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    },

    // Check for new orders and notify
    checkNewOrders: (orders) => {
        const currentCount = orders.filter(o => o.orderStatus !== 'COMPLETED').length;

        // If order count increased, we have a new order
        if (currentCount > NotificationService.lastOrderCount && NotificationService.lastOrderCount > 0) {
            // Find the newest order
            const newestOrder = orders
                .filter(o => o.orderStatus !== 'COMPLETED')
                .sort((a, b) => {
                    const timeA = a.timestamp?.seconds || a.timestamp;
                    const timeB = b.timestamp?.seconds || b.timestamp;
                    return timeB - timeA;
                })[0];

            if (newestOrder) {
                NotificationService.playSound();
                NotificationService.flashScreen();
                NotificationService.showBrowserNotification(newestOrder);
            }
        }

        NotificationService.lastOrderCount = currentCount;
    },

    // Get order age in minutes
    getOrderAge: (order) => {
        const orderTime = order.timestamp?.seconds
            ? order.timestamp.seconds * 1000
            : order.timestamp;
        const now = Date.now();
        return Math.floor((now - orderTime) / 60000); // minutes
    },

    // Get color based on order age
    getOrderColor: (order) => {
        const age = NotificationService.getOrderAge(order);

        if (age < 3) return { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32', label: 'NEW' };
        if (age < 7) return { bg: '#FFF3E0', border: '#FF9800', text: '#E65100', label: 'NORMAL' };
        return { bg: '#FFEBEE', border: '#f44336', text: '#C62828', label: 'URGENT' };
    }
};
