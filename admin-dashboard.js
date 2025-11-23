// Admin Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is admin
    if (!window.API.TokenManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load stats
    await loadStats();
});

async function loadStats() {
    try {
        const stats = await window.API.Admin.getStats();
        
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalCraftsmen').textContent = stats.totalCraftsmen || 0;
        document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
        document.getElementById('completedOrders').textContent = stats.completedOrders || 0;
        
        // Load recent activity
        if (stats.recentActivity) {
            displayActivity(stats.recentActivity);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function displayActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (activities.length === 0) {
        container.innerHTML = '<div class="no-results">لا يوجد نشاط حديث</div>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${getActivityIcon(activity.type)}</div>
            <div class="activity-content">
                <p><strong>${activity.description}</strong></p>
                <span class="activity-time">${formatDate(activity.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        user_registered: '👤',
        order_created: '📋',
        order_completed: '✅',
        review_added: '⭐'
    };
    return icons[type] || '📌';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


