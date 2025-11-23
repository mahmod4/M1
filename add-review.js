// Add Review Page
document.addEventListener('DOMContentLoaded', () => {
    // Authentication is checked by auth-guard.js
    // Wait for API to be loaded
    if (!window.API) {
        const checkAPI = setInterval(() => {
            if (window.API) {
                clearInterval(checkAPI);
                setupReviewForm();
            }
        }, 100);
        return;
    }
    setupReviewForm();
});

function setupReviewForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const craftsmanId = urlParams.get('craftsmanId');
    
    if (!craftsmanId) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('craftsmanId').value = craftsmanId;
    
    const form = document.getElementById('reviewForm');
    form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const craftsmanId = document.getElementById('craftsmanId').value;
    const rating = document.querySelector('input[name="rating"]:checked').value;
    const comment = document.getElementById('comment').value;
    
    try {
        await window.API.Reviews.addReview(craftsmanId, {
            rating: parseInt(rating),
            comment: comment
        });
        
        showMessage('تم إضافة التقييم بنجاح!', 'success');
        
        setTimeout(() => {
            window.location.href = `craftsman-details.html?id=${craftsmanId}`;
        }, 1500);
    } catch (error) {
        showMessage(error.message || 'فشل إضافة التقييم', 'error');
    }
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


