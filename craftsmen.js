// Craftsmen Page Script
let currentPage = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and update nav
    updateNavigation();
    
    // Load craftsmen
    await loadCraftsmen();
    
    // Setup filters
    setupFilters();
    
    // Setup search
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
});

// Update navigation based on auth status
function updateNavigation() {
    const navButtons = document.getElementById('navButtons');
    if (window.API && window.API.TokenManager.isAuthenticated()) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userType = user.userType || user.user_type;
        
        // تحديد رابط لوحة التحكم حسب نوع المستخدم
        const dashboardLink = userType === 'craftsman' 
            ? 'craftsman-dashboard.html' 
            : 'client-dashboard.html';
        
        navButtons.innerHTML = `
            <a href="${dashboardLink}" class="btn btn-primary">لوحة التحكم</a>
            <a href="profile.html" class="btn btn-outline">البروفايل</a>
            <button class="btn btn-outline" id="logoutBtnNav">تسجيل الخروج</button>
        `;
        
        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtnNav');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (window.API && window.API.Auth) {
                    window.API.Auth.logout();
                }
            });
        }
    }
}

// Load craftsmen
async function loadCraftsmen(filters = {}) {
    const grid = document.getElementById('craftsmenGrid');
    grid.innerHTML = '<div class="loading">جاري التحميل...</div>';
    
    try {
        const response = await window.API.Craftsmen.getAll({
            ...filters,
            page: currentPage,
            limit: 12
        });
        
        if (response.data && response.data.length > 0) {
            displayCraftsmen(response.data);
            updateResultsCount(response.total || response.data.length);
            setupPagination(response.totalPages || 1);
        } else {
            grid.innerHTML = '<div class="no-results">لا توجد نتائج</div>';
            updateResultsCount(0);
        }
    } catch (error) {
        console.error('Error loading craftsmen:', error);
        grid.innerHTML = '<div class="error-message">حدث خطأ في تحميل البيانات</div>';
    }
}

// Display craftsmen
function displayCraftsmen(craftsmen) {
    const grid = document.getElementById('craftsmenGrid');
    grid.innerHTML = '';
    
    craftsmen.forEach(craftsman => {
        const card = createCraftsmanCard(craftsman);
        grid.appendChild(card);
    });
}

// Create craftsman card
function createCraftsmanCard(craftsman) {
    const card = document.createElement('div');
    card.className = 'craftsman-card';
    card.onclick = () => window.location.href = `craftsman-details.html?id=${craftsman.id}`;
    
    const rating = craftsman.rating || 0;
    const reviewsCount = craftsman.reviewsCount || 0;
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
    
    card.innerHTML = `
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
        ${craftsman.hourlyRate ? `<p class="craftsman-price">💰 ${craftsman.hourlyRate} جنيه/ساعة</p>` : ''}
        <button class="btn btn-outline btn-sm">عرض الملف</button>
    `;
    
    return card;
}

// Generate stars
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '⭐'.repeat(fullStars);
    if (hasHalfStar) stars += '⭐';
    return stars.padEnd(5, '☆');
}

// Setup filters
function setupFilters() {
    const filters = ['specialtyFilter', 'cityFilter', 'priceFilter', 'ratingFilter'];
    
    filters.forEach(filterId => {
        document.getElementById(filterId).addEventListener('change', handleFilterChange);
    });
    
    document.getElementById('clearFilters').addEventListener('click', () => {
        filters.forEach(filterId => {
            document.getElementById(filterId).value = '';
        });
        currentFilters = {};
        currentPage = 1;
        loadCraftsmen();
    });
}

// Handle filter change
function handleFilterChange() {
    currentFilters = {
        specialty: document.getElementById('specialtyFilter').value,
        city: document.getElementById('cityFilter').value,
        priceRange: document.getElementById('priceFilter').value,
        minRating: document.getElementById('ratingFilter').value
    };
    
    // Remove empty filters
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) delete currentFilters[key];
    });
    
    currentPage = 1;
    loadCraftsmen(currentFilters);
}

// Handle search
function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        currentFilters.query = query;
    } else {
        delete currentFilters.query;
    }
    currentPage = 1;
    loadCraftsmen(currentFilters);
}

// Update results count
function updateResultsCount(count) {
    document.getElementById('resultsCount').textContent = `تم العثور على ${count} حرفي`;
}

// Setup pagination
function setupPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    pagination.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = 'السابق';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            loadCraftsmen(currentFilters);
        }
    };
    pagination.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            loadCraftsmen(currentFilters);
        };
        pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'التالي';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadCraftsmen(currentFilters);
        }
    };
    pagination.appendChild(nextBtn);
}


