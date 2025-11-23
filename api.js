// API Service Layer - للتفاعل مع الباك إند
// Base URL - Xano API
// الرابط الكامل: https://x8ki-letl-twmt.n7.xano.io/workspace/132210-0/api/320199/query/3199389
const API_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:320199'; // Xano API Base URL

// Token Management
const TokenManager = {
    getToken: () => {
        return localStorage.getItem('authToken');
    },
    
    setToken: (token) => {
        localStorage.setItem('authToken', token);
    },
    
    removeToken: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },
    
    isAuthenticated: () => {
        return !!localStorage.getItem('authToken');
    }
};

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const token = TokenManager.getToken();
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };
    
    if (options.body && typeof options.body === 'object') {
        // حماية: تنظيف البيانات قبل الإرسال
        const sanitizedBody = sanitizeRequestBody(options.body);
        config.body = JSON.stringify(sanitizedBody);
    }
    
    try {
        // حماية: تنظيف endpoint من أي محاولات injection
        const cleanEndpoint = endpoint.replace(/[^a-zA-Z0-9\/\-_?=&]/g, '');
        
        const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
            ...config,
            credentials: 'same-origin' // حماية: منع إرسال credentials تلقائياً
        });
        
        // حماية: التحقق من حالة الاستجابة
        if (response.status === 401) {
            // غير مصرح - حذف التوكن وإعادة التوجيه
            TokenManager.removeToken();
            if (window.location.pathname.includes('profile') || 
                window.location.pathname.includes('orders') ||
                window.location.pathname.includes('chat')) {
                window.location.href = 'login.html';
            }
            throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        }
        
        if (response.status === 403) {
            throw new Error('ليس لديك صلاحية للوصول إلى هذا المورد');
        }
        
        // Handle non-JSON responses
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(text || 'حدث خطأ في الطلب');
            }
        }
        
        // Xano may return data in different formats
        // Handle both { success: true, data: {...} } and direct data
        if (data.success === false || (response.status >= 400 && response.status < 600)) {
            const errorMessage = data.message || data.error || 'حدث خطأ في الطلب';
            throw new Error(errorMessage);
        }
        
        // Return data directly or from data.data if wrapped
        return data.data || data;
    } catch (error) {
        // حماية: عدم عرض تفاصيل الخطأ الحساسة في console في الإنتاج
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('API Error:', error);
        } else {
            console.error('API Error occurred');
        }
        throw error;
    }
}

// 1️⃣ Authentication API
const AuthAPI = {
    // تسجيل مستخدم جديد
    signup: async (userData) => {
        return await apiRequest('/auth/signup', {
            method: 'POST',
            body: userData
        });
    },
    
    // تسجيل الدخول
    login: async (email, password) => {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        
        if (response.token) {
            TokenManager.setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        return response;
    },
    
    // تسجيل الدخول عبر Google
    loginWithGoogle: async (googleToken) => {
        const response = await apiRequest('/auth/google', {
            method: 'POST',
            body: { token: googleToken }
        });
        
        if (response.token) {
            TokenManager.setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        return response;
    },
    
    // إرسال كود التحقق
    sendVerificationCode: async (email) => {
        return await apiRequest('/auth/send-verification', {
            method: 'POST',
            body: { email }
        });
    },
    
    // استرجاع الحساب
    forgotPassword: async (email) => {
        return await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: { email }
        });
    },
    
    // تسجيل الخروج
    logout: () => {
        TokenManager.removeToken();
        window.location.href = 'index.html';
    }
};

// 2️⃣ Users API
const UsersAPI = {
    // الحصول على معلومات المستخدم
    getProfile: async () => {
        return await apiRequest('/users/profile');
    },
    
    // تحديث البروفايل
    updateProfile: async (userData) => {
        return await apiRequest('/users/profile', {
            method: 'PUT',
            body: userData
        });
    },
    
    // رفع صورة البروفايل
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const token = TokenManager.getToken();
        const response = await fetch(`${API_BASE_URL}/users/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        return await response.json();
    },
    
    // تغيير كلمة المرور
    changePassword: async (oldPassword, newPassword) => {
        return await apiRequest('/users/change-password', {
            method: 'POST',
            body: { oldPassword, newPassword }
        });
    }
};

// 3️⃣ Craftsmen API
const CraftsmenAPI = {
    // الحصول على جميع الحرفيين
    getAll: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiRequest(`/craftsmen?${queryParams}`);
    },
    
    // الحصول على حرفي محدد
    getById: async (id) => {
        return await apiRequest(`/craftsmen/${id}`);
    },
    
    // إنشاء ملف حرفي
    create: async (craftsmanData) => {
        return await apiRequest('/craftsmen', {
            method: 'POST',
            body: craftsmanData
        });
    },
    
    // تحديث بيانات الحرفي
    update: async (id, craftsmanData) => {
        return await apiRequest(`/craftsmen/${id}`, {
            method: 'PUT',
            body: craftsmanData
        });
    },
    
    // البحث عن حرفيين
    search: async (query, filters = {}) => {
        return await apiRequest('/craftsmen/search', {
            method: 'POST',
            body: { query, ...filters }
        });
    }
};

// 4️⃣ Orders API
const OrdersAPI = {
    // إنشاء طلب جديد
    create: async (orderData) => {
        return await apiRequest('/orders', {
            method: 'POST',
            body: orderData
        });
    },
    
    // الحصول على طلبات المستخدم
    getMyOrders: async () => {
        return await apiRequest('/orders/my-orders');
    },
    
    // الحصول على طلبات الحرفي
    getCraftsmanOrders: async () => {
        return await apiRequest('/orders/craftsman-orders');
    },
    
    // الحصول على طلب محدد
    getById: async (id) => {
        return await apiRequest(`/orders/${id}`);
    },
    
    // قبول طلب
    accept: async (id) => {
        return await apiRequest(`/orders/${id}/accept`, {
            method: 'POST'
        });
    },
    
    // رفض طلب
    reject: async (id) => {
        return await apiRequest(`/orders/${id}/reject`, {
            method: 'POST'
        });
    },
    
    // تحديث حالة الطلب
    updateStatus: async (id, status) => {
        return await apiRequest(`/orders/${id}/status`, {
            method: 'PUT',
            body: { status }
        });
    }
};

// 5️⃣ Chat API
const ChatAPI = {
    // إنشاء محادثة
    createConversation: async (orderId, participantId) => {
        return await apiRequest('/chat/conversations', {
            method: 'POST',
            body: { orderId, participantId }
        });
    },
    
    // الحصول على المحادثات
    getConversations: async () => {
        return await apiRequest('/chat/conversations');
    },
    
    // الحصول على رسائل محادثة
    getMessages: async (conversationId) => {
        return await apiRequest(`/chat/conversations/${conversationId}/messages`);
    },
    
    // إرسال رسالة
    sendMessage: async (conversationId, message) => {
        return await apiRequest(`/chat/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: { message }
        });
    },
    
    // الحصول على الإشعارات
    getNotifications: async () => {
        return await apiRequest('/chat/notifications');
    }
};

// 6️⃣ Reviews API
const ReviewsAPI = {
    // إضافة تقييم
    addReview: async (craftsmanId, reviewData) => {
        return await apiRequest(`/reviews/craftsmen/${craftsmanId}`, {
            method: 'POST',
            body: reviewData
        });
    },
    
    // الحصول على تقييمات حرفي
    getCraftsmanReviews: async (craftsmanId) => {
        return await apiRequest(`/reviews/craftsmen/${craftsmanId}`);
    },
    
    // تحديث تقييم
    updateReview: async (reviewId, reviewData) => {
        return await apiRequest(`/reviews/${reviewId}`, {
            method: 'PUT',
            body: reviewData
        });
    },
    
    // حذف تقييم
    deleteReview: async (reviewId) => {
        return await apiRequest(`/reviews/${reviewId}`, {
            method: 'DELETE'
        });
    }
};

// 7️⃣ Payment API (اختياري)
const PaymentAPI = {
    // إنشاء فاتورة
    createInvoice: async (orderId, amount) => {
        return await apiRequest('/payments/invoices', {
            method: 'POST',
            body: { orderId, amount }
        });
    },
    
    // معالجة الدفع
    processPayment: async (invoiceId, paymentMethod) => {
        return await apiRequest(`/payments/invoices/${invoiceId}/pay`, {
            method: 'POST',
            body: { paymentMethod }
        });
    },
    
    // الحصول على حالة الفاتورة
    getInvoiceStatus: async (invoiceId) => {
        return await apiRequest(`/payments/invoices/${invoiceId}`);
    }
};

// 8️⃣ File Upload API
const FileAPI = {
    // رفع ملف
    upload: async (file, type = 'general') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const token = TokenManager.getToken();
        const response = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        return await response.json();
    },
    
    // رفع عدة ملفات
    uploadMultiple: async (files, type = 'general') => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('type', type);
        
        const token = TokenManager.getToken();
        const response = await fetch(`${API_BASE_URL}/files/upload-multiple`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        return await response.json();
    }
};

// 9️⃣ Admin API
const AdminAPI = {
    // إحصائيات
    getStats: async () => {
        return await apiRequest('/admin/stats');
    },
    
    // إدارة المستخدمين
    getUsers: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiRequest(`/admin/users?${queryParams}`);
    },
    
    // تعطيل/تفعيل مستخدم
    toggleUser: async (userId, status) => {
        return await apiRequest(`/admin/users/${userId}/toggle`, {
            method: 'PUT',
            body: { status }
        });
    },
    
    // حذف مستخدم
    deleteUser: async (userId) => {
        return await apiRequest(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
    },
    
    // إدارة الحرفيين
    getCraftsmen: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiRequest(`/admin/craftsmen?${queryParams}`);
    }
};

// تنظيف بيانات الطلب من أي محاولات XSS
function sanitizeRequestBody(body) {
    if (typeof body !== 'object' || body === null) {
        return body;
    }
    
    const sanitized = {};
    for (const key in body) {
        if (body.hasOwnProperty(key)) {
            const value = body[key];
            if (typeof value === 'string') {
                // إزالة أي محاولات script injection
                sanitized[key] = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeRequestBody(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
}

// Xano Query Endpoints Helper
// للتعامل مع Query Endpoints المحددة في Xano
const XanoQueries = {
    // Query 3199391
    query3199391: async (params = {}) => {
        const queryId = '3199391';
        const fullUrl = `https://x8ki-letl-twmt.n7.xano.io/api:320199/query/${queryId}`;
        
        const token = TokenManager.getToken();
        const config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(sanitizeRequestBody(params)),
            credentials: 'same-origin'
        };
        
        try {
            const response = await fetch(fullUrl, config);
            
            if (response.status === 401) {
                TokenManager.removeToken();
                throw new Error('انتهت صلاحية الجلسة');
            }
            
            const data = await response.json();
            return data.data || data;
        } catch (error) {
            console.error('Xano Query 3199391 Error:', error);
            throw error;
        }
    },
    
    // Query 3199390
    query3199390: async (params = {}) => {
        const queryId = '3199390';
        const fullUrl = `https://x8ki-letl-twmt.n7.xano.io/api:320199/query/${queryId}`;
        
        const token = TokenManager.getToken();
        const config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(sanitizeRequestBody(params)),
            credentials: 'same-origin'
        };
        
        try {
            const response = await fetch(fullUrl, config);
            
            if (response.status === 401) {
                TokenManager.removeToken();
                throw new Error('انتهت صلاحية الجلسة');
            }
            
            const data = await response.json();
            return data.data || data;
        } catch (error) {
            console.error('Xano Query 3199390 Error:', error);
            throw error;
        }
    },
    
    // Generic Query Helper
    callQuery: async (queryId, params = {}) => {
        const fullUrl = `https://x8ki-letl-twmt.n7.xano.io/api:320199/query/${queryId}`;
        
        const token = TokenManager.getToken();
        const config = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(sanitizeRequestBody(params)),
            credentials: 'same-origin'
        };
        
        try {
            const response = await fetch(fullUrl, config);
            
            if (response.status === 401) {
                TokenManager.removeToken();
                throw new Error('انتهت صلاحية الجلسة');
            }
            
            if (response.status === 403) {
                throw new Error('ليس لديك صلاحية للوصول');
            }
            
            const data = await response.json();
            return data.data || data;
        } catch (error) {
            console.error(`Xano Query ${queryId} Error:`, error);
            throw error;
        }
    }
};

// Export APIs
window.API = {
    Auth: AuthAPI,
    Users: UsersAPI,
    Craftsmen: CraftsmenAPI,
    Orders: OrdersAPI,
    Chat: ChatAPI,
    Reviews: ReviewsAPI,
    Payment: PaymentAPI,
    File: FileAPI,
    Admin: AdminAPI,
    XanoQueries: XanoQueries,
    TokenManager
};

console.log('API Service Layer loaded! 🚀');

