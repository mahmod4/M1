// Client Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Authentication is checked by auth-guard.js
    // Wait for API to be loaded
    if (!window.API) {
        await new Promise(resolve => {
            const checkAPI = setInterval(() => {
                if (window.API) {
                    clearInterval(checkAPI);
                    resolve();
                }
            }, 100);
        });
    }

    // Load dashboard data
    await loadDashboardData();
    
    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.API.Auth.logout();
        });
    }
});

async function loadDashboardData() {
    try {
        // Load user info
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.fullName || user.name) {
            document.getElementById('userName').textContent = user.fullName || user.name;
        }

        // Load orders
        const orders = await window.API.Orders.getMyOrders();
        
        // Calculate stats
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'completed').length;
        const activeOrders = orders.filter(o => o.status === 'accepted' || o.status === 'in_progress').length;
        
        // Update stats
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('completedOrders').textContent = completedOrders;
        document.getElementById('activeOrders').textContent = activeOrders;
        
        // Load conversations count
        try {
            const conversations = await window.API.Chat.getConversations();
            document.getElementById('messagesCount').textContent = conversations.length || 0;
        } catch {
            document.getElementById('messagesCount').textContent = '0';
        }
        
        // Display recent orders
        const recentOrders = orders.slice(0, 5);
        displayRecentOrders(recentOrders);
        
        // Load featured craftsmen
        await loadFeaturedCraftsmen();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('recentOrders').innerHTML = '<div class="error-message">حدث خطأ في تحميل البيانات</div>';
    }
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrders');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="no-results">لا توجد طلبات بعد. <a href="create-order.html">أنشئ طلب جديد</a></div>';
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const statusColors = {
            pending: '#f59e0b',
            accepted: '#10b981',
            in_progress: '#3b82f6',
            completed: '#10b981',
            rejected: '#ef4444'
        };
        
        const statusNames = {
            pending: 'قيد الانتظار',
            accepted: 'مقبولة',
            in_progress: 'قيد التنفيذ',
            completed: 'مكتملة',
            rejected: 'مرفوضة'
        };
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>${order.title}</h3>
                        <p class="order-date">${formatDate(order.createdAt)}</p>
                    </div>
                    <span class="order-status" style="background: ${statusColors[order.status] || '#6b7280'}">
                        ${statusNames[order.status] || order.status}
                    </span>
                </div>
                <p class="order-description">${order.description}</p>
                <div class="order-details">
                    <span>📍 ${order.city || 'غير محدد'}</span>
                    ${order.budget ? `<span>💰 ${order.budget} جنيه</span>` : ''}
                    ${order.craftsman ? `<span>👷 ${order.craftsman.name}</span>` : ''}
                </div>
                <div class="order-actions">
                    <a href="my-orders.html" class="btn btn-outline btn-sm">عرض التفاصيل</a>
                </div>
            </div>
        `;
    }).join('');
}

async function loadFeaturedCraftsmen() {
    try {
        const craftsmen = await window.API.Craftsmen.getAll({
            limit: 4,
            sortBy: 'rating'
        });
        
        displayFeaturedCraftsmen(craftsmen.data || craftsmen);
    } catch (error) {
        console.error('Error loading featured craftsmen:', error);
        document.getElementById('featuredCraftsmen').innerHTML = '<div class="no-results">لا توجد نتائج</div>';
    }
}

function displayFeaturedCraftsmen(craftsmen) {
    const container = document.getElementById('featuredCraftsmen');
    
    if (!craftsmen || craftsmen.length === 0) {
        container.innerHTML = '<div class="no-results">لا توجد نتائج</div>';
        return;
    }
    
    const specialtyNames = {
        carpentry: 'نجارة',
        plumbing: 'سباكة',
        electrical: 'كهرباء',
        painting: 'دهان',
        tiling: 'بلاط',
        welding: 'حدادة',
        construction: 'بناء',
        other: 'أخرى'
    };
    
    container.innerHTML = craftsmen.map(craftsman => {
        const rating = craftsman.rating || 0;
        const reviewsCount = craftsman.reviewsCount || 0;
        
        return `
            <div class="craftsman-card" onclick="window.location.href='craftsman-details.html?id=${craftsman.id}'">
                <div class="craftsman-avatar">
                    ${craftsman.avatar ? `<img src="${craftsman.avatar}" alt="${craftsman.name}">` : '👷'}
                </div>
                <h3>${craftsman.name}</h3>
                <p class="craftsman-specialty">${specialtyNames[craftsman.specialty] || craftsman.specialty}</p>
                <div class="rating">
                    <span class="stars">${generateStars(rating)}</span>
                    <span class="rating-text">${rating.toFixed(1)} (${reviewsCount} تقييم)</span>
                </div>
                <p class="craftsman-location">📍 ${craftsman.city || 'غير محدد'}</p>
                <button class="btn btn-outline btn-sm">عرض الملف</button>
            </div>
        `;
    }).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '⭐'.repeat(fullStars);
    if (hasHalfStar) stars += '⭐';
    return stars.padEnd(5, '☆');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

