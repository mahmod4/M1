// API Service Layer - للتفاعل مع الباك إند
// Base URL - Xano API
// الرابط الكامل: https://x8ki-letl-twmt.n7.xano.io/workspace/132210-0/api/320199/query/3199389
const API_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:XDzfWuf5'; // Xano API Base URL

// Xano Query IDs - قم بتحديثها حسب Query IDs في Xano Dashboard
const XANO_QUERY_IDS = {
    SIGNUP: '3199390', // Query ID للتسجيل
    LOGIN: '3199389',  // Query ID لتسجيل الدخول
    // يمكنك إضافة المزيد هنا
};

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
        try {
            console.log('[API] Signup called with:', { ...userData, password: '***' });
            let response;
            
            // إذا كان هناك Query ID للتسجيل، استخدمه
            if (XANO_QUERY_IDS.SIGNUP) {
                console.log('[API] Using Query ID:', XANO_QUERY_IDS.SIGNUP);
                response = await XanoQueries.callQuery(XANO_QUERY_IDS.SIGNUP, userData);
            } else {
                // محاولة استخدام REST endpoint
                try {
                    console.log('[API] Trying REST endpoint: /auth/signup');
                    response = await apiRequest('/auth/signup', {
                        method: 'POST',
                        body: userData
                    });
                } catch (error) {
                    // إذا فشل REST endpoint، حاول استخدام Query 3199390
                    console.warn('[API] REST endpoint failed, trying query endpoint 3199390...');
                    response = await XanoQueries.callQuery('3199390', userData);
                }
            }
            
            console.log('[API] Signup response:', response);
            
            // التحقق من أن الرد يحتوي على بيانات المستخدم
            if (!response) {
                throw new Error('لم يتم استلام رد من السيرفر');
            }
            
            // حفظ token و user إذا كانا موجودين
            if (response.token) {
                TokenManager.setToken(response.token);
                console.log('[API] Token saved');
            } else if (response.data && response.data.token) {
                TokenManager.setToken(response.data.token);
                console.log('[API] Token saved from response.data');
            }
            
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
                console.log('[API] User saved from response.user');
            } else if (response.data && response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                console.log('[API] User saved from response.data.user');
            } else if (response.id || response.email) {
                // إذا كان الرد هو user object مباشرة
                const userToSave = {
                    id: response.id,
                    email: response.email,
                    fullName: response.name || response.fullName || userData.fullName,
                    phone: response.phone || userData.phone,
                    userType: response.userType || response.user_type || userData.userType,
                    specialty: response.specialty || userData.specialty
                };
                localStorage.setItem('user', JSON.stringify(userToSave));
                console.log('[API] User saved from response object:', userToSave);
            } else {
                console.warn('[API] No user data in response, saving from userData');
                // حفظ البيانات المرسلة كـ user مؤقت
                localStorage.setItem('user', JSON.stringify({
                    email: userData.email,
                    fullName: userData.fullName,
                    phone: userData.phone,
                    userType: userData.userType,
                    specialty: userData.specialty
                }));
            }
            
            // تحديث الأزرار بعد التسجيل
            if (typeof updateAuthNavigation === 'function') {
                setTimeout(() => updateAuthNavigation(), 100);
            }
            
            return response;
        } catch (error) {
            console.error('[API] Signup error:', error);
            
            // معالجة أخطاء محددة
            if (error.message) {
                if (error.message.includes('already exists') || 
                    error.message.includes('مستخدم موجود') ||
                    error.message.includes('مستخدم بالفعل')) {
                    throw new Error('البريد الإلكتروني مستخدم بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر');
                }
                
                if (error.message.includes('404') || error.message.includes('not found')) {
                    throw new Error('Endpoint غير موجود. يرجى التحقق من إعدادات Xano أو تحديث Query ID في api.js');
                }
                
                if (error.message.includes('400') || error.message.includes('Bad Request')) {
                    throw new Error('بيانات غير صحيحة. يرجى التحقق من جميع الحقول');
                }
            }
            
            throw error;
        }
    },
    
    // تسجيل الدخول
    login: async (email, password) => {
        try {
            let response;
            
            // إذا كان هناك Query ID لتسجيل الدخول، استخدمه
            if (XANO_QUERY_IDS.LOGIN) {
                response = await XanoQueries.callQuery(XANO_QUERY_IDS.LOGIN, { email, password });
            } else {
                // محاولة استخدام REST endpoint
                try {
                    response = await apiRequest('/auth/login', {
                        method: 'POST',
                        body: { email, password }
                    });
                } catch (error) {
                    // إذا فشل REST endpoint، حاول استخدام Query
                    console.warn('REST endpoint failed, trying query endpoint...');
                    response = await XanoQueries.callQuery('3199390', { email, password });
                }
            }
            
            // التحقق من أن الرد صحيح
            if (!response) {
                throw new Error('لم يتم استلام رد من السيرفر');
            }
            
            // حفظ token و user
            if (response.token) {
                TokenManager.setToken(response.token);
            } else if (response.data && response.data.token) {
                TokenManager.setToken(response.data.token);
            }
            
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
            } else if (response.data && response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            } else if (response.id || response.email) {
                // إذا كان الرد هو user object مباشرة
                localStorage.setItem('user', JSON.stringify(response));
            }
            
            // التحقق من أن المستخدم تم حفظه بنجاح
            const savedUser = localStorage.getItem('user');
            if (!savedUser) {
                throw new Error('فشل حفظ بيانات المستخدم');
            }
            
            // تحديث الأزرار بعد تسجيل الدخول
            if (typeof updateAuthNavigation === 'function') {
                setTimeout(() => updateAuthNavigation(), 100);
            }
            
            return response;
        } catch (error) {
            // معالجة أخطاء محددة
            if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
            }
            
            if (error.message && error.message.includes('404')) {
                throw new Error('المستخدم غير موجود. يرجى التحقق من البريد الإلكتروني');
            }
            
            if (error.message && error.message.includes('403')) {
                throw new Error('تم تعطيل حسابك. يرجى التواصل مع الدعم');
            }
            
            throw error;
        }
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
            
            // تحديث الأزرار بعد تسجيل الدخول
            if (typeof updateAuthNavigation === 'function') {
                setTimeout(() => updateAuthNavigation(), 100);
            }
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
        return await apiRequest('/auth/me');
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
            console.log(`[Xano Query ${queryId}] Calling:`, fullUrl);
            console.log(`[Xano Query ${queryId}] Params:`, { ...params, password: params.password ? '***' : undefined });
            
            const response = await fetch(fullUrl, config);
            
            console.log(`[Xano Query ${queryId}] Response status:`, response.status);
            
            if (response.status === 401) {
                TokenManager.removeToken();
                throw new Error('انتهت صلاحية الجلسة');
            }
            
            if (response.status === 403) {
                throw new Error('ليس لديك صلاحية للوصول');
            }
            
            let data;
            try {
                data = await response.json();
                console.log(`[Xano Query ${queryId}] Response data:`, data);
            } catch (parseError) {
                const text = await response.text();
                console.error(`[Xano Query ${queryId}] Failed to parse JSON:`, text);
                throw new Error('رد غير صحيح من السيرفر');
            }
            
            // معالجة أخطاء محددة من Xano
            if (response.status === 400) {
                if (data.message && (data.message.includes('already exists') || data.message.includes('مستخدم'))) {
                    throw new Error('البريد الإلكتروني مستخدم بالفعل');
                }
                throw new Error(data.message || data.error || 'بيانات غير صحيحة');
            }
            
            if (response.status === 404) {
                // في حالة التسجيل، 404 يعني أن Query غير موجود
                if (queryId === '3199390' || queryId === XANO_QUERY_IDS.SIGNUP) {
                    throw new Error('Query ID للتسجيل غير موجود في Xano. يرجى التحقق من Query ID: 3199390');
                }
                throw new Error('المستخدم غير موجود أو Endpoint غير موجود');
            }
            
            if (response.status >= 500) {
                throw new Error('خطأ في السيرفر. يرجى المحاولة لاحقاً');
            }
            
            // إرجاع البيانات
            const result = data.data || data;
            console.log(`[Xano Query ${queryId}] Returning:`, result);
            return result;
        } catch (error) {
            console.error(`[Xano Query ${queryId}] Error:`, error);
            
            // إذا كان الخطأ من fetch نفسه (مثل network error)
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('فشل الاتصال بالسيرفر. يرجى التحقق من الاتصال بالإنترنت');
            }
            
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

