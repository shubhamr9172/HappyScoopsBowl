// Input validation and sanitization utilities

/**
 * Sanitize text input to prevent XSS attacks
 * Removes HTML tags and limits length
 */
export const sanitizeInput = (input, maxLength = 100) => {
    if (!input) return '';

    return input
        .toString()
        .trim()
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/['"]/g, '') // Remove quotes
        .substring(0, maxLength);
};

/**
 * Validate and sanitize phone number
 * Must be exactly 10 digits
 */
export const validatePhone = (phone) => {
    const cleaned = phone.toString().replace(/\D/g, ''); // Remove non-digits
    return /^[0-9]{10}$/.test(cleaned) ? cleaned : null;
};

/**
 * Validate and sanitize name
 * Must be 2-50 characters, letters and spaces only
 */
export const validateName = (name) => {
    const sanitized = sanitizeInput(name, 50);

    if (sanitized.length < 2) {
        throw new Error('Name must be at least 2 characters');
    }

    if (!/^[a-zA-Z\s]+$/.test(sanitized)) {
        throw new Error('Name can only contain letters and spaces');
    }

    return sanitized;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
    const sanitized = sanitizeInput(email, 100);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(sanitized)) {
        throw new Error('Invalid email format');
    }

    return sanitized.toLowerCase();
};

/**
 * Sanitize order notes/comments
 */
export const sanitizeNote = (note, maxLength = 200) => {
    return sanitizeInput(note, maxLength);
};

/**
 * Validate positive number (for prices, quantities)
 */
export const validatePositiveNumber = (value) => {
    const num = parseFloat(value);

    if (isNaN(num) || num < 0) {
        throw new Error('Must be a positive number');
    }

    return num;
};

/**
 * Rate limiting helper
 * Prevents spam by limiting actions per time period
 */
class RateLimiter {
    constructor() {
        this.actions = new Map();
    }

    /**
     * Check if action is allowed
     * @param {string} key - Unique identifier (e.g., phone number, IP)
     * @param {number} maxAttempts - Maximum attempts allowed
     * @param {number} windowMs - Time window in milliseconds
     */
    isAllowed(key, maxAttempts = 5, windowMs = 60000) {
        const now = Date.now();
        const userActions = this.actions.get(key) || [];

        // Remove old attempts outside the time window
        const recentActions = userActions.filter(time => now - time < windowMs);

        if (recentActions.length >= maxAttempts) {
            return false;
        }

        // Add current attempt
        recentActions.push(now);
        this.actions.set(key, recentActions);

        return true;
    }

    /**
     * Clear rate limit for a key
     */
    reset(key) {
        this.actions.delete(key);
    }

    /**
     * Clear all rate limits (useful for development/testing)
     */
    clearAll() {
        this.actions.clear();
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Validate order data before submission
 */
export const validateOrderData = (orderData) => {
    const errors = [];

    // Validate customer name
    try {
        orderData.customerName = validateName(orderData.customerName);
    } catch (error) {
        errors.push(`Name: ${error.message}`);
    }

    // Validate phone
    const validPhone = validatePhone(orderData.customerPhone);
    if (!validPhone) {
        errors.push('Phone: Must be a valid 10-digit number');
    } else {
        orderData.customerPhone = validPhone;
    }

    // Validate items exist
    if (!orderData.items || orderData.items.length === 0) {
        errors.push('Cart is empty');
    }

    // Validate amounts
    try {
        orderData.totalAmount = validatePositiveNumber(orderData.totalAmount);
        orderData.subTotal = validatePositiveNumber(orderData.subTotal);
        orderData.gst = validatePositiveNumber(orderData.gst);
    } catch (error) {
        errors.push(`Amount: ${error.message}`);
    }

    // Sanitize note if present
    if (orderData.customerNote) {
        orderData.customerNote = sanitizeNote(orderData.customerNote);
    }

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }

    return orderData;
};

/**
 * Escape HTML to prevent XSS
 */
export const escapeHtml = (text) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
};
