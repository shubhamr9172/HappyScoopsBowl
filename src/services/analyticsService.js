// Analytics Service - Business Intelligence for Dessert Bowl
// Calculates revenue, trends, popular items, and peak hours

export const AnalyticsService = {
    // Get date range for filtering
    getDateRange: (period) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'today':
                return { start: today, end: new Date() };

            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return { start: yesterday, end: today };

            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() - 7);
                return { start: weekStart, end: new Date() };

            case 'month':
                const monthStart = new Date(today);
                monthStart.setDate(monthStart.getDate() - 30);
                return { start: monthStart, end: new Date() };

            default:
                return { start: today, end: new Date() };
        }
    },

    // Filter orders by date range
    filterOrdersByDate: (orders, period) => {
        const { start, end } = AnalyticsService.getDateRange(period);

        return orders.filter(order => {
            const orderDate = new Date(order.timestamp?.seconds ? order.timestamp.seconds * 1000 : order.timestamp);
            return orderDate >= start && orderDate <= end;
        });
    },

    // Calculate total revenue
    calculateRevenue: (orders) => {
        return orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    },

    // Get revenue by period
    getRevenueSummary: (orders) => {
        const todayOrders = AnalyticsService.filterOrdersByDate(orders, 'today');
        const yesterdayOrders = AnalyticsService.filterOrdersByDate(orders, 'yesterday');
        const weekOrders = AnalyticsService.filterOrdersByDate(orders, 'week');
        const monthOrders = AnalyticsService.filterOrdersByDate(orders, 'month');

        const todayRevenue = AnalyticsService.calculateRevenue(todayOrders);
        const yesterdayRevenue = AnalyticsService.calculateRevenue(yesterdayOrders);
        const weekRevenue = AnalyticsService.calculateRevenue(weekOrders);
        const monthRevenue = AnalyticsService.calculateRevenue(monthOrders);

        // Calculate percentage changes
        const todayChange = yesterdayRevenue > 0
            ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
            : 0;

        return {
            today: {
                revenue: todayRevenue,
                orders: todayOrders.length,
                change: todayChange
            },
            week: {
                revenue: weekRevenue,
                orders: weekOrders.length
            },
            month: {
                revenue: monthRevenue,
                orders: monthOrders.length
            }
        };
    },

    // Get popular items
    getPopularItems: (orders) => {
        const itemCounts = {};

        orders.forEach(order => {
            order.items?.forEach(item => {
                const key = item.name;
                if (!itemCounts[key]) {
                    itemCounts[key] = {
                        name: item.name,
                        count: 0,
                        revenue: 0,
                        type: item.type
                    };
                }
                itemCounts[key].count += 1;
                itemCounts[key].revenue += item.price;
            });
        });

        // Convert to array and sort by count
        return Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 items
    },

    // Get hourly breakdown
    getHourlyBreakdown: (orders) => {
        const hourlyData = Array(24).fill(0).map((_, hour) => ({
            hour,
            orders: 0,
            revenue: 0
        }));

        orders.forEach(order => {
            const orderDate = new Date(order.timestamp?.seconds ? order.timestamp.seconds * 1000 : order.timestamp);
            const hour = orderDate.getHours();

            hourlyData[hour].orders += 1;
            hourlyData[hour].revenue += order.totalAmount || 0;
        });

        return hourlyData.filter(h => h.orders > 0); // Only show hours with orders
    },

    // Get peak hours
    getPeakHours: (orders) => {
        const hourlyData = AnalyticsService.getHourlyBreakdown(orders);
        return hourlyData
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5); // Top 5 busiest hours
    },

    // Calculate average order value
    getAverageOrderValue: (orders) => {
        if (orders.length === 0) return 0;
        const totalRevenue = AnalyticsService.calculateRevenue(orders);
        return Math.round(totalRevenue / orders.length);
    },

    // Get daily sales for chart
    getDailySales: (orders, days = 7) => {
        const dailyData = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayOrders = orders.filter(order => {
                const orderDate = new Date(order.timestamp?.seconds ? order.timestamp.seconds * 1000 : order.timestamp);
                return orderDate >= date && orderDate < nextDate;
            });

            dailyData.push({
                date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                revenue: AnalyticsService.calculateRevenue(dayOrders),
                orders: dayOrders.length
            });
        }

        return dailyData;
    },

    // Get order status breakdown
    getOrderStatusBreakdown: (orders) => {
        const breakdown = {
            CREATED: 0,
            PREPARING: 0,
            READY: 0,
            COMPLETED: 0
        };

        orders.forEach(order => {
            if (breakdown.hasOwnProperty(order.orderStatus)) {
                breakdown[order.orderStatus] += 1;
            }
        });

        return breakdown;
    },

    // Get combo vs custom ratio
    getItemTypeRatio: (orders) => {
        let comboCount = 0;
        let customCount = 0;

        orders.forEach(order => {
            order.items?.forEach(item => {
                if (item.type === 'COMBO') comboCount++;
                else if (item.type === 'CUSTOM') customCount++;
            });
        });

        const total = comboCount + customCount;
        return {
            combo: {
                count: comboCount,
                percentage: total > 0 ? Math.round((comboCount / total) * 100) : 0
            },
            custom: {
                count: customCount,
                percentage: total > 0 ? Math.round((customCount / total) * 100) : 0
            }
        };
    }
};
