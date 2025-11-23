// Craftsman Dashboard
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
        const orders = await window.API.Orders.getCraftsmanOrders();
        
        // Calculate stats
        const totalOrders = orders.length;
        const acceptedOrders = orders.filter(o => o.status === 'accepted' || o.status === 'in_progress').length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        
        // Update stats
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('acceptedOrders').textContent = acceptedOrders;
        document.getElementById('pendingOrders').textContent = pendingOrders;
        
        // Load average rating (if available)
        const profile = await window.API.Users.getProfile();
        if (profile.rating) {
            document.getElementById('averageRating').textContent = profile.rating.toFixed(1);
        } else {
            document.getElementById('averageRating').textContent = '-';
        }
        
        // Display recent orders
        const recentOrders = orders.slice(0, 5);
        displayRecentOrders(recentOrders);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('recentOrders').innerHTML = '<div class="error-message">حدث خطأ في تحميل البيانات</div>';
    }
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrders');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="no-results">لا توجد طلبات بعد</div>';
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
                </div>
                <div class="order-actions">
                    <a href="my-orders.html" class="btn btn-outline btn-sm">عرض التفاصيل</a>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

