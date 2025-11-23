// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Search functionality
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.btn-search');

if (searchButton) {
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            alert(`البحث عن: ${searchTerm}`);
            // هنا يمكن إضافة منطق البحث الفعلي
        }
    });
}

// Form submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('شكراً لك! تم إرسال رسالتك بنجاح.');
        contactForm.reset();
    });
}

// Add scroll effect to header
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }
    
    lastScroll = currentScroll;
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards and craftsman cards
document.querySelectorAll('.service-card, .craftsman-card, .step').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Add hover effect to service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add click effect to craftsman cards
document.querySelectorAll('.craftsman-card .btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const craftsmanName = this.closest('.craftsman-card').querySelector('h3').textContent;
        alert(`عرض ملف ${craftsmanName}`);
    });
});

// Add active state to navigation links on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-menu a');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Add active class styling
const style = document.createElement('style');
style.textContent = `
    .nav-menu a.active {
        color: var(--primary-color);
        font-weight: 700;
    }
`;
document.head.appendChild(style);

// Service card click functionality
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', function() {
        const serviceName = this.querySelector('h3').textContent;
        alert(`تم اختيار خدمة: ${serviceName}`);
        // هنا يمكن إضافة منطق الانتقال لصفحة الخدمة
    });
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Search input enter key
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
}

// Update navigation based on auth status
function updateAuthNavigation() {
    const navButtons = document.querySelector('.nav-buttons');
    if (!navButtons) return;
    
    if (window.API && window.API.TokenManager.isAuthenticated()) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        navButtons.innerHTML = `
            <a href="profile.html" class="btn btn-outline">البروفايل</a>
            <button class="btn btn-primary" id="logoutBtnMain">تسجيل الخروج</button>
        `;
        
        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtnMain');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (window.API && window.API.Auth) {
                    window.API.Auth.logout();
                }
            });
        }
    } else {
        navButtons.innerHTML = `
            <a href="login.html" class="btn btn-outline">تسجيل الدخول</a>
            <a href="signup.html" class="btn btn-primary">انضم كحرفي</a>
        `;
    }
}

// Update navigation on page load
if (window.API) {
    updateAuthNavigation();
} else {
    // Wait for API to load
    window.addEventListener('load', () => {
        if (window.API) {
            updateAuthNavigation();
        }
    });
}

console.log('منصة الحرفيين - تم تحميل الموقع بنجاح! 🛠️');


