// Profile Page Script
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

    // Load profile data
    await loadProfile();

    // Setup tabs
    setupTabs();

    // Setup forms
    setupForms();

    // Setup avatar upload
    setupAvatarUpload();

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        window.API.Auth.logout();
    });
});

// Load profile data
async function loadProfile() {
    try {
        console.log('[Profile] Loading profile from backend...');
        
        // محاولة جلب البيانات من الباك إند
        let profile;
        try {
            profile = await window.API.Users.getProfile();
            console.log('[Profile] Profile loaded from backend:', profile);
        } catch (error) {
            console.warn('[Profile] Failed to load from backend, using localStorage:', error);
            // Fallback: استخدام البيانات من localStorage
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (localUser.email) {
                profile = localUser;
                console.log('[Profile] Using localStorage data:', profile);
            } else {
                throw new Error('لا توجد بيانات متاحة');
            }
        }
        
        // Update header
        document.getElementById('profileName').textContent = profile.fullName || profile.name || 'مستخدم';
        document.getElementById('profileEmail').textContent = profile.email || '';
        
        if (profile.userType === 'craftsman' || profile.user_type === 'craftsman') {
            document.getElementById('profileType').textContent = 'حرفي';
            document.getElementById('craftsmanTab').style.display = 'block';
        } else {
            document.getElementById('profileType').textContent = 'عميل';
        }
        
        if (profile.avatar) {
            document.getElementById('profileAvatar').src = profile.avatar;
        }
        
        // Fill form fields
        document.getElementById('fullName').value = profile.fullName || profile.name || '';
        document.getElementById('email').value = profile.email || '';
        document.getElementById('phone').value = profile.phone || '';
        document.getElementById('address').value = profile.address || '';
        document.getElementById('city').value = profile.city || '';
        
        // Fill craftsman fields if applicable
        if ((profile.userType === 'craftsman' || profile.user_type === 'craftsman')) {
            if (profile.craftsmanInfo) {
                document.getElementById('specialty').value = profile.craftsmanInfo.specialty || '';
                document.getElementById('experience').value = profile.craftsmanInfo.experience || '';
                document.getElementById('hourlyRate').value = profile.craftsmanInfo.hourlyRate || '';
                document.getElementById('bio').value = profile.craftsmanInfo.bio || '';
            } else {
                // محاولة جلب البيانات من profile مباشرة
                document.getElementById('specialty').value = profile.specialty || '';
                document.getElementById('experience').value = profile.experience || '';
                document.getElementById('hourlyRate').value = profile.hourlyRate || '';
                document.getElementById('bio').value = profile.bio || '';
            }
        }
        
        // تحديث localStorage بالبيانات الجديدة من الباك إند
        if (profile.id || profile.email) {
            localStorage.setItem('user', JSON.stringify(profile));
            console.log('[Profile] Updated localStorage with backend data');
        }
    } catch (error) {
        console.error('[Profile] Error loading profile:', error);
        showMessage('فشل تحميل بيانات البروفايل: ' + (error.message || 'خطأ غير معروف'), 'error');
    }
}

// Setup tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked
            btn.classList.add('active');
            document.getElementById(`${targetTab}Tab`).classList.add('active');
        });
    });
}

// Setup forms
function setupForms() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value
        };
        
        try {
            console.log('[Profile] Updating profile:', formData);
            const updatedProfile = await window.API.Users.updateProfile(formData);
            
            console.log('[Profile] Profile updated successfully:', updatedProfile);
            
            // تحديث localStorage بالبيانات الجديدة
            if (updatedProfile) {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, ...updatedProfile };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('[Profile] Updated localStorage');
            }
            
            // تحديث العرض
            document.getElementById('profileName').textContent = formData.fullName;
            document.getElementById('profileEmail').textContent = formData.email;
            
            showMessage('تم تحديث البيانات بنجاح!', 'success');
        } catch (error) {
            console.error('[Profile] Update error:', error);
            showMessage(error.message || 'فشل تحديث البيانات', 'error');
        }
    });
    
    // Password form
    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmPassword) {
            showMessage('كلمة المرور غير متطابقة', 'error');
            return;
        }
        
        try {
            await window.API.Users.changePassword(oldPassword, newPassword);
            showMessage('تم تغيير كلمة المرور بنجاح!', 'success');
            passwordForm.reset();
        } catch (error) {
            showMessage(error.message || 'فشل تغيير كلمة المرور', 'error');
        }
    });
    
    // Craftsman form
    const craftsmanForm = document.getElementById('craftsmanForm');
    if (craftsmanForm) {
        craftsmanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                specialty: document.getElementById('specialty').value,
                experience: document.getElementById('experience').value,
                hourlyRate: document.getElementById('hourlyRate').value,
                bio: document.getElementById('bio').value
            };
            
            try {
                await window.API.Craftsmen.update(null, formData); // Will use current user ID
                showMessage('تم تحديث معلومات الحرفي بنجاح!', 'success');
            } catch (error) {
                showMessage(error.message || 'فشل تحديث المعلومات', 'error');
            }
        });
    }
}

// Setup avatar upload
function setupAvatarUpload() {
    const avatarUpload = document.getElementById('avatarUpload');
    avatarUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showMessage('يرجى اختيار ملف صورة', 'error');
            return;
        }
        
        try {
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profileAvatar').src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            // Upload to server
            const response = await window.API.File.upload(file, 'avatar');
            document.getElementById('profileAvatar').src = response.url;
            
            showMessage('تم رفع الصورة بنجاح!', 'success');
        } catch (error) {
            showMessage(error.message || 'فشل رفع الصورة', 'error');
        }
    });
}

// Show message function
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


