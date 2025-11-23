// Create Order Page
document.addEventListener('DOMContentLoaded', () => {
    // Authentication is checked by auth-guard.js
    // Wait for API to be loaded
    if (!window.API) {
        const checkAPI = setInterval(() => {
            if (window.API) {
                clearInterval(checkAPI);
                setupForm();
            }
        }, 100);
        return;
    }
    setupForm();
});

function setupForm() {
    
    // Get craftsman ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const craftsmanId = urlParams.get('craftsmanId');
    if (craftsmanId) {
        document.getElementById('craftsmanId').value = craftsmanId;
    }
    
    // Setup form
    const orderForm = document.getElementById('orderForm');
    orderForm.addEventListener('submit', handleSubmit);
    
    // Setup file upload
    document.getElementById('orderFiles').addEventListener('change', handleFileUpload);
});

async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        craftsmanId: document.getElementById('craftsmanId').value || null,
        serviceType: document.getElementById('serviceType').value,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        budget: document.getElementById('budget').value || null,
        preferredDate: document.getElementById('preferredDate').value || null
    };
    
    try {
        const order = await window.API.Orders.create(formData);
        showMessage('تم إنشاء الطلب بنجاح!', 'success');
        
        setTimeout(() => {
            window.location.href = 'my-orders.html';
        }, 1500);
    } catch (error) {
        showMessage(error.message || 'فشل إنشاء الطلب', 'error');
    }
}

function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    const container = document.getElementById('orderUploadedFiles');
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const div = document.createElement('div');
                div.className = 'uploaded-file';
                div.innerHTML = `
                    <img src="${event.target.result}" alt="مرفق">
                    <button type="button" onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
                `;
                container.appendChild(div);
            };
            reader.readAsDataURL(file);
        }
    });
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


