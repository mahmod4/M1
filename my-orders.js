// My Orders Page
let currentStatus = 'all';

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
    
    // Load orders
    await loadOrders();
    
    // Setup tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatus = btn.getAttribute('data-status');
            loadOrders();
        });
    });
});

async function loadOrders() {
    const list = document.getElementById('ordersList');
    list.innerHTML = '<div class="loading">جاري التحميل...</div>';
    
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let orders;
        
        if (user.userType === 'craftsman') {
            orders = await window.API.Orders.getCraftsmanOrders();
        } else {
            orders = await window.API.Orders.getMyOrders();
        }
        
        // Filter by status
        let filteredOrders = orders;
        if (currentStatus !== 'all') {
            filteredOrders = orders.filter(order => order.status === currentStatus);
        }
        
        if (filteredOrders.length > 0) {
            displayOrders(filteredOrders);
        } else {
            list.innerHTML = '<div class="no-results">لا توجد طلبات</div>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        list.innerHTML = '<div class="error-message">حدث خطأ في تحميل الطلبات</div>';
    }
}

function displayOrders(orders) {
    const list = document.getElementById('ordersList');
    list.innerHTML = '';
    
    orders.forEach(order => {
        const card = createOrderCard(order);
        list.appendChild(card);
    });
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
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
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isCraftsman = user.userType === 'craftsman';
    
    card.innerHTML = `
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
            ${order.client ? `<span>👤 ${order.client.name}</span>` : ''}
        </div>
        
        <div class="order-actions">
            <a href="order-details.html?id=${order.id}" class="btn btn-outline btn-sm">عرض التفاصيل</a>
            ${order.status === 'pending' && isCraftsman ? `
                <button class="btn btn-primary btn-sm" onclick="acceptOrder('${order.id}')">قبول</button>
                <button class="btn btn-outline btn-sm" onclick="rejectOrder('${order.id}')">رفض</button>
            ` : ''}
            ${order.status === 'accepted' || order.status === 'in_progress' ? `
                <a href="chat.html?orderId=${order.id}" class="btn btn-outline btn-sm">المحادثة</a>
            ` : ''}
        </div>
    `;
    
    return card;
}

async function acceptOrder(orderId) {
    if (!confirm('هل أنت متأكد من قبول هذا الطلب؟')) return;
    
    try {
        await window.API.Orders.accept(orderId);
        showMessage('تم قبول الطلب بنجاح!', 'success');
        loadOrders();
    } catch (error) {
        showMessage(error.message || 'فشل قبول الطلب', 'error');
    }
}

async function rejectOrder(orderId) {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
    
    try {
        await window.API.Orders.reject(orderId);
        showMessage('تم رفض الطلب', 'success');
        loadOrders();
    } catch (error) {
        showMessage(error.message || 'فشل رفض الطلب', 'error');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translateX(-50%)';
    messageDiv.style.zIndex = '10000';
    messageDiv.style.padding = '1rem 2rem';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}


