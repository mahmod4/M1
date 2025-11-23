// Authentication Guard - حماية الصفحات
// يجب تضمين هذا الملف في جميع الصفحات المحمية

// قائمة الصفحات المحمية (تتطلب تسجيل دخول)
const PROTECTED_PAGES = [
    'profile.html',
    'my-orders.html',
    'chat.html',
    'create-order.html',
    'add-review.html',
    'admin-dashboard.html',
    'craftsman-dashboard.html',
    'client-dashboard.html'
];

// قائمة الصفحات التي يجب تسجيل الخروج منها (إذا كان المستخدم مسجل دخول)
const AUTH_PAGES = [
    'login.html',
    'signup.html'
];

// التحقق من المصادقة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // التحقق من الصفحات المحمية
    if (PROTECTED_PAGES.includes(currentPage)) {
        protectPage();
    }
    
    // التحقق من صفحات المصادقة (تسجيل الدخول/التسجيل)
    if (AUTH_PAGES.includes(currentPage)) {
        redirectIfAuthenticated();
    }
    
    // التحقق من انتهاء صلاحية التوكن
    checkTokenValidity();
});

// حماية الصفحة - التحقق من تسجيل الدخول
async function protectPage() {
    // انتظر تحميل API
    if (!window.API) {
        // إعادة المحاولة بعد 100ms
        setTimeout(protectPage, 100);
        return;
    }
    
    if (!window.API.TokenManager.isAuthenticated()) {
        // حفظ الصفحة المطلوبة للعودة إليها بعد تسجيل الدخول
        const returnUrl = window.location.href;
        localStorage.setItem('returnUrl', returnUrl);
        
        // إعادة التوجيه لصفحة تسجيل الدخول
        window.location.href = 'login.html';
        return;
    }
    
    // التحقق من صحة التوكن مع السيرفر
    try {
        const isValid = await validateToken();
        if (!isValid) {
            // التوكن غير صالح
            window.API.TokenManager.removeToken();
            localStorage.setItem('returnUrl', window.location.href);
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        console.error('Token validation error:', error);
        // في حالة الخطأ، نسمح بالوصول لكن نتحقق لاحقاً
    }
}

// إعادة التوجيه إذا كان المستخدم مسجل دخول بالفعل
function redirectIfAuthenticated() {
    if (!window.API) {
        setTimeout(redirectIfAuthenticated, 100);
        return;
    }
    
    if (window.API.TokenManager.isAuthenticated()) {
        // التحقق من وجود returnUrl
        const returnUrl = localStorage.getItem('returnUrl');
        if (returnUrl) {
            localStorage.removeItem('returnUrl');
            window.location.href = returnUrl;
        } else {
            // التوجيه إلى صفحة البروفايل بدلاً من index.html
            window.location.href = 'profile.html';
        }
    }
}

// التحقق من صحة التوكن
async function validateToken() {
    try {
        // محاولة جلب بيانات المستخدم للتحقق من صحة التوكن
        const user = await window.API.Users.getProfile();
        return !!user;
    } catch (error) {
        // إذا كان الخطأ 401 (غير مصرح)، التوكن غير صالح
        if (error.message && error.message.includes('401')) {
            return false;
        }
        // في حالة أخطاء أخرى، نعتبر التوكن صالحاً مؤقتاً
        return true;
    }
}

// التحقق من انتهاء صلاحية التوكن
function checkTokenValidity() {
    if (!window.API || !window.API.TokenManager.isAuthenticated()) {
        return;
    }
    
    const token = window.API.TokenManager.getToken();
    if (!token) return;
    
    try {
        // محاولة فك تشفير JWT (إذا كان JWT)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp;
        
        if (exp) {
            const expirationTime = exp * 1000; // تحويل لـ milliseconds
            const currentTime = Date.now();
            
            // إذا انتهت الصلاحية
            if (currentTime >= expirationTime) {
                window.API.TokenManager.removeToken();
                if (PROTECTED_PAGES.includes(window.location.pathname.split('/').pop())) {
                    window.location.href = 'login.html';
                }
            } else {
                // التحقق قبل 5 دقائق من انتهاء الصلاحية
                const timeUntilExpiry = expirationTime - currentTime;
                const fiveMinutes = 5 * 60 * 1000;
                
                if (timeUntilExpiry < fiveMinutes) {
                    // محاولة تجديد التوكن (إذا كان متاحاً)
                    refreshTokenIfNeeded();
                }
            }
        }
    } catch (error) {
        // إذا لم يكن JWT، نتجاهل
        console.log('Token is not JWT format');
    }
}

// تجديد التوكن إذا لزم الأمر
async function refreshTokenIfNeeded() {
    try {
        // إذا كان هناك endpoint لتجديد التوكن
        // await window.API.Auth.refreshToken();
        console.log('Token refresh needed');
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
}

// حماية من XSS - تنظيف المدخلات
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// حماية من XSS - تنظيف HTML
function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// Export للاستخدام في ملفات أخرى
window.AuthGuard = {
    protectPage,
    redirectIfAuthenticated,
    validateToken,
    sanitizeInput,
    sanitizeHTML
};

console.log('Auth Guard loaded! 🔒');

