// Craftsman Details Page
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const craftsmanId = urlParams.get('id');
    
    if (!craftsmanId) {
        window.location.href = 'craftsmen.html';
        return;
    }
    
    await loadCraftsmanDetails(craftsmanId);
    await loadReviews(craftsmanId);
});

async function loadCraftsmanDetails(id) {
    const container = document.getElementById('craftsmanDetails');
    
    try {
        const craftsman = await window.API.Craftsmen.getById(id);
        
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
        
        const rating = craftsman.rating || 0;
        const reviewsCount = craftsman.reviewsCount || 0;
        
        container.innerHTML = `
            <div class="craftsman-details-header">
                <div class="craftsman-main-info">
                    <div class="craftsman-avatar-large">
                        ${craftsman.avatar ? `<img src="${craftsman.avatar}" alt="${craftsman.name}">` : '👷'}
                    </div>
                    <div class="craftsman-info">
                        <h1>${craftsman.name}</h1>
                        <p class="craftsman-specialty-large">${specialtyNames[craftsman.specialty] || craftsman.specialty}</p>
                        <div class="rating-large">
                            <span class="stars-large">${generateStars(rating)}</span>
                            <span class="rating-text-large">${rating.toFixed(1)} (${reviewsCount} تقييم)</span>
                        </div>
                        <p class="craftsman-location-large">📍 ${craftsman.city || 'غير محدد'}</p>
                        ${craftsman.hourlyRate ? `<p class="craftsman-price-large">💰 ${craftsman.hourlyRate} جنيه/ساعة</p>` : ''}
                    </div>
                </div>
                <div class="craftsman-actions">
                    <button class="btn btn-primary btn-large" id="createOrderBtn">طلب خدمة</button>
                    <button class="btn btn-outline btn-large" id="chatBtn">إرسال رسالة</button>
                </div>
            </div>
            
            <div class="craftsman-details-content">
                <div class="details-section">
                    <h2>نبذة عن الحرفي</h2>
                    <p class="craftsman-bio">${craftsman.bio || 'لا توجد معلومات متاحة'}</p>
                </div>
                
                ${craftsman.experience ? `
                <div class="details-section">
                    <h2>الخبرة</h2>
                    <p>${craftsman.experience} سنوات من الخبرة</p>
                </div>
                ` : ''}
                
                ${craftsman.portfolio && craftsman.portfolio.length > 0 ? `
                <div class="details-section">
                    <h2>معرض الأعمال</h2>
                    <div class="portfolio-gallery">
                        ${craftsman.portfolio.map(img => `
                            <div class="portfolio-item">
                                <img src="${img}" alt="عمل سابق">
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="details-section">
                    <h2>التقييمات والمراجعات</h2>
                    <div id="reviewsSection">
                        <div class="loading">جاري تحميل التقييمات...</div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup buttons
        document.getElementById('createOrderBtn').addEventListener('click', () => {
            if (!window.API.TokenManager.isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }
            window.location.href = `create-order.html?craftsmanId=${id}`;
        });
        
        document.getElementById('chatBtn').addEventListener('click', () => {
            if (!window.API.TokenManager.isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }
            // Create conversation and redirect to chat
            createConversation(id);
        });
        
    } catch (error) {
        console.error('Error loading craftsman:', error);
        container.innerHTML = '<div class="error-message">حدث خطأ في تحميل بيانات الحرفي</div>';
    }
}

async function loadReviews(craftsmanId) {
    try {
        const reviews = await window.API.Reviews.getCraftsmanReviews(craftsmanId);
        const reviewsSection = document.getElementById('reviewsSection');
        
        if (reviews && reviews.length > 0) {
            reviewsSection.innerHTML = reviews.map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <strong>${review.reviewerName}</strong>
                            <span class="review-date">${formatDate(review.createdAt)}</span>
                        </div>
                        <div class="review-rating">${generateStars(review.rating)}</div>
                    </div>
                    <p class="review-text">${review.comment || ''}</p>
                </div>
            `).join('');
        } else {
            reviewsSection.innerHTML = '<p class="no-reviews">لا توجد تقييمات بعد</p>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

async function createConversation(craftsmanId) {
    try {
        const conversation = await window.API.Chat.createConversation(null, craftsmanId);
        window.location.href = `chat.html?conversationId=${conversation.id}`;
    } catch (error) {
        console.error('Error creating conversation:', error);
        alert('حدث خطأ في إنشاء المحادثة');
    }
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


