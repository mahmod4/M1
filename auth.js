// Google Sign-In Configuration
// Replace YOUR_GOOGLE_CLIENT_ID with your actual Google Client ID
// Get it from: https://console.cloud.google.com/apis/credentials

// Handle Google Sign-In for Login
async function handleGoogleSignIn(response) {
    console.log('Google Sign-In Response:', response);
    
    try {
        // Send Google token to backend
        const result = await window.API.Auth.loginWithGoogle(response.credential);
        
        showMessage('تم تسجيل الدخول بنجاح!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showMessage(error.message || 'فشل تسجيل الدخول عبر Google', 'error');
    }
}

// Handle Google Sign-Up
async function handleGoogleSignUp(response) {
    console.log('Google Sign-Up Response:', response);
    
    try {
        const userType = document.getElementById('userType').value;
        const specialty = document.getElementById('specialty')?.value || '';
        
        // Send to backend
        const result = await window.API.Auth.signup({
            googleToken: response.credential,
            userType: userType,
            specialty: specialty
        });
        
        showMessage('تم إنشاء الحساب بنجاح!', 'success');
        
        setTimeout(() => {
            if (userType === 'craftsman') {
                window.location.href = 'craftsman-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 1000);
    } catch (error) {
        showMessage(error.message || 'فشل إنشاء الحساب', 'error');
    }
}

// Parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

// User Type Selector (for signup page)
const clientBtn = document.getElementById('clientBtn');
const craftsmanBtn = document.getElementById('craftsmanBtn');
const userTypeInput = document.getElementById('userType');
const specialtyGroup = document.getElementById('specialtyGroup');

if (clientBtn && craftsmanBtn) {
    clientBtn.addEventListener('click', () => {
        clientBtn.classList.add('active');
        craftsmanBtn.classList.remove('active');
        if (userTypeInput) userTypeInput.value = 'client';
        if (specialtyGroup) specialtyGroup.style.display = 'none';
    });

    craftsmanBtn.addEventListener('click', () => {
        craftsmanBtn.classList.add('active');
        clientBtn.classList.remove('active');
        if (userTypeInput) userTypeInput.value = 'craftsman';
        if (specialtyGroup) specialtyGroup.style.display = 'block';
    });
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const remember = document.querySelector('input[name="remember"]').checked;
        
        // Basic validation
        if (!email || !password) {
            showMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
            return;
        }
        
        try {
            // Call API
            const response = await window.API.Auth.login(email, password);
            
            showMessage('تم تسجيل الدخول بنجاح!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            showMessage(error.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى', 'error');
        }
    });
}

// Signup Form Handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('signupEmail').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const userType = document.getElementById('userType').value;
        const specialty = document.getElementById('specialty')?.value || '';
        const terms = document.querySelector('input[name="terms"]').checked;
        
        // Validation
        if (!fullName || !email || !phone || !password || !confirmPassword) {
            showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        if (password.length < 8) {
            showMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('كلمة المرور غير متطابقة', 'error');
            return;
        }
        
        if (userType === 'craftsman' && !specialty) {
            showMessage('يرجى اختيار التخصص', 'error');
            return;
        }
        
        if (!terms) {
            showMessage('يجب الموافقة على الشروط والأحكام', 'error');
            return;
        }
        
        try {
            // Call API
            const userData = {
                fullName,
                email,
                phone,
                password,
                userType,
                specialty: userType === 'craftsman' ? specialty : undefined
            };
            
            const response = await window.API.Auth.signup(userData);
            
            showMessage('تم إنشاء الحساب بنجاح!', 'success');
            
            setTimeout(() => {
                if (userType === 'craftsman') {
                    window.location.href = 'craftsman-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
        } catch (error) {
            showMessage(error.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى', 'error');
        }
    });
}

// Password confirmation validation
const confirmPasswordInput = document.getElementById('confirmPassword');
if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', () => {
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordInput.setCustomValidity('كلمة المرور غير متطابقة');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    });
}

// Password strength indicator
const passwordInput = document.getElementById('signupPassword');
if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strengthIndicator = document.getElementById('passwordStrength');
        
        if (!strengthIndicator) {
            const indicator = document.createElement('div');
            indicator.id = 'passwordStrength';
            indicator.className = 'password-strength';
            passwordInput.parentElement.appendChild(indicator);
        }
        
        const indicator = document.getElementById('passwordStrength');
        let strength = 'weak';
        let text = 'ضعيف';
        
        if (password.length >= 8) {
            if (password.match(/[a-z]/) && password.match(/[A-Z]/) && password.match(/[0-9]/) && password.match(/[^a-zA-Z0-9]/)) {
                strength = 'strong';
                text = 'قوي';
            } else if (password.match(/[a-z]/) && password.match(/[A-Z]/) && password.match(/[0-9]/)) {
                strength = 'medium';
                text = 'متوسط';
            }
        }
        
        indicator.className = `password-strength ${strength}`;
        indicator.textContent = password.length > 0 ? `قوة كلمة المرور: ${text}` : '';
    });
}

// Show message function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.error-message, .success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = message;
    
    const form = document.querySelector('.auth-form');
    if (form) {
        form.insertBefore(messageDiv, form.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('user');
    if (user && window.location.pathname.includes('login.html')) {
        // User is already logged in, redirect to home
        const userData = JSON.parse(user);
        if (userData.email) {
            window.location.href = 'index.html';
        }
    }
});

console.log('Auth scripts loaded successfully! 🔐');

