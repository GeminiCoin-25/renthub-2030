// ===== main-script.js =====
// البرامج الرئيسية لموقع OS-RentHub

// 1. تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 OS-RentHub iniciado');
    initializeApp();
    checkAuthStatus();
    loadUserPreferences();
    setupEventListeners();
});

// 2. وظائف التهيئة
function initializeApp() {
    // تحميل اللغة المحفوظة
    const savedLang = localStorage.getItem('siteLang') || 'es';
    setLanguage(savedLang);
    
    // تحميل المفضلة
    loadFavorites();
    
    // تحميل سلة التسوق (إذا وجدت)
    loadCart();
    
    // إعداد التاريخ والوقت
    updateDateTime();
    
    // إعداد المراقبة لتفاعلات المستخدم
    setupUserInteractionTracking();
}

// 3. نظام اللغات
const translations = {
    es: {
        // التنقل
        'nav.home': 'Inicio',
        'nav.categories': 'Categorías',
        'nav.listings': 'Anuncios',
        'nav.how-it-works': 'Cómo funciona',
        'nav.login': 'Iniciar Sesión',
        'nav.signup': 'Registrarse',
        'nav.publish': 'Publicar',
        'nav.dashboard': 'Panel',
        'nav.messages': 'Mensajes',
        'nav.favorites': 'Favoritos',
        
        // البحث
        'search.placeholder': '¿Qué quieres alquilar?',
        'search.location': 'Ubicación',
        'search.button': 'Buscar',
        'search.filters': 'Filtros',
        'search.clear': 'Limpiar',
        
        // الإعلانات
        'listings.title': 'Anuncios Destacados',
        'listings.view_all': 'Ver todos',
        'listings.load_more': 'Cargar más',
        'listings.no_results': 'No se encontraron resultados',
        'listings.sort_by': 'Ordenar por',
        'listings.filter_by': 'Filtrar por',
        'listings.price_low': 'Precio: menor a mayor',
        'listings.price_high': 'Precio: mayor a menor',
        'listings.rating': 'Mejor valorados',
        'listings.newest': 'Más recientes',
        
        // الفئات
        'categories.title': 'Categorías Populares',
        'categories.tools': 'Herramientas',
        'categories.vehicles': 'Vehículos',
        'categories.electronics': 'Electrónica',
        'categories.home': 'Hogar',
        'categories.sports': 'Deporte',
        'categories.events': 'Eventos',
        
        // الأزرار
        'btn.rent': 'Alquilar ahora',
        'btn.view': 'Ver detalles',
        'btn.contact': 'Contactar',
        'btn.save': 'Guardar',
        'btn.cancel': 'Cancelar',
        'btn.confirm': 'Confirmar',
        'btn.delete': 'Eliminar',
        'btn.edit': 'Editar',
        'btn.share': 'Compartir',
        'btn.report': 'Reportar',
        
        // الرسائل
        'msg.success': '¡Operación exitosa!',
        'msg.error': 'Ha ocurrido un error',
        'msg.warning': 'Advertencia',
        'msg.info': 'Información',
        'msg.loading': 'Cargando...',
        'msg.saving': 'Guardando...',
        'msg.sending': 'Enviando...',
        
        // التواريخ
        'date.today': 'Hoy',
        'date.yesterday': 'Ayer',
        'date.tomorrow': 'Mañana',
        'date.this_week': 'Esta semana',
        'date.next_week': 'Próxima semana',
        'date.this_month': 'Este mes',
        'date.next_month': 'Próximo mes',
        
        // حالات التوفر
        'availability.available': 'Disponible',
        'availability.unavailable': 'No disponible',
        'availability.booked': 'Reservado',
        'availability.pending': 'Pendiente',
        
        // التقييمات
        'rating.excellent': 'Excelente',
        'rating.good': 'Bueno',
        'rating.average': 'Regular',
        'rating.poor': 'Malo',
        'rating.terrible': 'Terrible',
        
        // التسعير
        'price.per_hour': '/hora',
        'price.per_day': '/día',
        'price.per_week': '/semana',
        'price.per_month': '/mes',
        'price.deposit': 'Depósito',
        'price.total': 'Total',
        'price.discount': 'Descuento',
        
        // التحقق
        'verification.verified': 'Verificado',
        'verification.pending': 'Pendiente de verificación',
        'verification.rejected': 'Rechazado',
        
        // نهاية الترجمات الإسبانية
    },
    
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.categories': 'Categories',
        'nav.listings': 'Listings',
        'nav.how-it-works': 'How it works',
        'nav.login': 'Login',
        'nav.signup': 'Sign Up',
        'nav.publish': 'Publish',
        'nav.dashboard': 'Dashboard',
        'nav.messages': 'Messages',
        'nav.favorites': 'Favorites',
        
        // Search
        'search.placeholder': 'What do you want to rent?',
        'search.location': 'Location',
        'search.button': 'Search',
        'search.filters': 'Filters',
        'search.clear': 'Clear',
        
        // Listings
        'listings.title': 'Featured Listings',
        'listings.view_all': 'View all',
        'listings.load_more': 'Load more',
        'listings.no_results': 'No results found',
        'listings.sort_by': 'Sort by',
        'listings.filter_by': 'Filter by',
        'listings.price_low': 'Price: low to high',
        'listings.price_high': 'Price: high to low',
        'listings.rating': 'Top rated',
        'listings.newest': 'Newest',
        
        // Categories
        'categories.title': 'Popular Categories',
        'categories.tools': 'Tools',
        'categories.vehicles': 'Vehicles',
        'categories.electronics': 'Electronics',
        'categories.home': 'Home',
        'categories.sports': 'Sports',
        'categories.events': 'Events',
        
        // Buttons
        'btn.rent': 'Rent now',
        'btn.view': 'View details',
        'btn.contact': 'Contact',
        'btn.save': 'Save',
        'btn.cancel': 'Cancel',
        'btn.confirm': 'Confirm',
        'btn.delete': 'Delete',
        'btn.edit': 'Edit',
        'btn.share': 'Share',
        'btn.report': 'Report',
        
        // Messages
        'msg.success': 'Operation successful!',
        'msg.error': 'An error occurred',
        'msg.warning': 'Warning',
        'msg.info': 'Information',
        'msg.loading': 'Loading...',
        'msg.saving': 'Saving...',
        'msg.sending': 'Sending...',
        
        // Dates
        'date.today': 'Today',
        'date.yesterday': 'Yesterday',
        'date.tomorrow': 'Tomorrow',
        'date.this_week': 'This week',
        'date.next_week': 'Next week',
        'date.this_month': 'This month',
        'date.next_month': 'Next month',
        
        // Availability
        'availability.available': 'Available',
        'availability.unavailable': 'Unavailable',
        'availability.booked': 'Booked',
        'availability.pending': 'Pending',
        
        // Ratings
        'rating.excellent': 'Excellent',
        'rating.good': 'Good',
        'rating.average': 'Average',
        'rating.poor': 'Poor',
        'rating.terrible': 'Terrible',
        
        // Pricing
        'price.per_hour': '/hour',
        'price.per_day': '/day',
        'price.per_week': '/week',
        'price.per_month': '/month',
        'price.deposit': 'Deposit',
        'price.total': 'Total',
        'price.discount': 'Discount',
        
        // Verification
        'verification.verified': 'Verified',
        'verification.pending': 'Pending verification',
        'verification.rejected': 'Rejected',
    },
    
    ar: {
        // التنقل
        'nav.home': 'الرئيسية',
        'nav.categories': 'التصنيفات',
        'nav.listings': 'الإعلانات',
        'nav.how-it-works': 'كيف يعمل',
        'nav.login': 'تسجيل الدخول',
        'nav.signup': 'إنشاء حساب',
        'nav.publish': 'نشر',
        'nav.dashboard': 'لوحة التحكم',
        'nav.messages': 'الرسائل',
        'nav.favorites': 'المفضلة',
        
        // البحث
        'search.placeholder': 'ماذا تريد أن تستأجر؟',
        'search.location': 'الموقع',
        'search.button': 'بحث',
        'search.filters': 'الفلاتر',
        'search.clear': 'مسح',
        
        // الإعلانات
        'listings.title': 'إعلانات مميزة',
        'listings.view_all': 'عرض الكل',
        'listings.load_more': 'تحميل المزيد',
        'listings.no_results': 'لم يتم العثور على نتائج',
        'listings.sort_by': 'ترتيب حسب',
        'listings.filter_by': 'تصفية حسب',
        'listings.price_low': 'السعر: من الأقل للأعلى',
        'listings.price_high': 'السعر: من الأعلى للأقل',
        'listings.rating': 'الأعلى تقييماً',
        'listings.newest': 'الأحدث',
        
        // الفئات
        'categories.title': 'التصنيفات الشائعة',
        'categories.tools': 'أدوات',
        'categories.vehicles': 'مركبات',
        'categories.electronics': 'إلكترونيات',
        'categories.home': 'منزل',
        'categories.sports': 'رياضة',
        'categories.events': 'مناسبات',
        
        // الأزرار
        'btn.rent': 'استأجر الآن',
        'btn.view': 'عرض التفاصيل',
        'btn.contact': 'اتصال',
        'btn.save': 'حفظ',
        'btn.cancel': 'إلغاء',
        'btn.confirm': 'تأكيد',
        'btn.delete': 'حذف',
        'btn.edit': 'تعديل',
        'btn.share': 'مشاركة',
        'btn.report': 'الإبلاغ',
        
        // الرسائل
        'msg.success': 'تمت العملية بنجاح!',
        'msg.error': 'حدث خطأ',
        'msg.warning': 'تحذير',
        'msg.info': 'معلومات',
        'msg.loading': 'جاري التحميل...',
        'msg.saving': 'جاري الحفظ...',
        'msg.sending': 'جاري الإرسال...',
        
        // التواريخ
        'date.today': 'اليوم',
        'date.yesterday': 'أمس',
        'date.tomorrow': 'غداً',
        'date.this_week': 'هذا الأسبوع',
        'date.next_week': 'الأسبوع القادم',
        'date.this_month': 'هذا الشهر',
        'date.next_month': 'الشهر القادم',
        
        // حالات التوفر
        'availability.available': 'متاح',
        'availability.unavailable': 'غير متاح',
        'availability.booked': 'محجوز',
        'availability.pending': 'قيد الانتظار',
        
        // التقييمات
        'rating.excellent': 'ممتاز',
        'rating.good': 'جيد',
        'rating.average': 'متوسط',
        'rating.poor': 'ضعيف',
        'rating.terrible': 'سيء',
        
        // التسعير
        'price.per_hour': '/ساعة',
        'price.per_day': '/يوم',
        'price.per_week': '/أسبوع',
        'price.per_month': '/شهر',
        'price.deposit': 'عربون',
        'price.total': 'المجموع',
        'price.discount': 'خصم',
        
        // التحقق
        'verification.verified': 'تم التحقق',
        'verification.pending': 'قيد التحقق',
        'verification.rejected': 'مرفوض',
    }
};

function setLanguage(lang) {
    if (!translations[lang]) return;
    
    // تحديث اتجاه النص
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // تحديث أزرار اللغة
    updateLanguageButtons(lang);
    
    // تحديث النصوص
    updateTexts(lang);
    
    // حفظ اللغة
    localStorage.setItem('siteLang', lang);
    
    // إشعار
    showNotification(`Idioma cambiado a ${lang === 'es' ? 'Español' : lang === 'en' ? 'English' : 'العربية'}`, 'success');
}

function updateTexts(lang) {
    const texts = translations[lang];
    
    // تحديث جميع العناصر ذات data-translate
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (texts[key]) {
            element.textContent = texts[key];
        }
    });
    
    // تحديث placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (texts[key]) {
            element.placeholder = texts[key];
        }
    });
}

// 4. نظام المصادقة
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    updateAuthUI(isLoggedIn, userData);
    
    return { isLoggedIn, userData };
}

function updateAuthUI(isLoggedIn, userData) {
    const loginButtons = document.querySelectorAll('.login-btn, .auth-btn');
    const userElements = document.querySelectorAll('.user-info');
    
    if (isLoggedIn && userData.name) {
        // تحديث لعرض معلومات المستخدم
        userElements.forEach(el => {
            el.innerHTML = `
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-name">${userData.name}</div>
            `;
        });
        
        // إخفاء أزرار التسجيل وإظهار أزرار المستخدم
        loginButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    }
}

function loginUser(email, password) {
    // محاكاة تسجيل الدخول
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (email && password.length >= 6) {
                const userData = {
                    id: Date.now(),
                    email: email,
                    name: email.split('@')[0],
                    joined: new Date().toISOString(),
                    verified: false
                };
                
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userData', JSON.stringify(userData));
                
                updateAuthUI(true, userData);
                resolve(userData);
            } else {
                reject(new Error('Credenciales inválidas'));
            }
        }, 1000);
    });
}

function logoutUser() {
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userData');
    updateAuthUI(false, {});
    showNotification('Sesión cerrada correctamente', 'info');
    window.location.href = 'index.html';
}

// 5. نظام المفضلة
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites;
}

function toggleFavorite(itemId) {
    let favorites = loadFavorites();
    const index = favorites.indexOf(itemId);
    
    if (index === -1) {
        favorites.push(itemId);
        showNotification('Añadido a favoritos', 'success');
    } else {
        favorites.splice(index, 1);
        showNotification('Eliminado de favoritos', 'info');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButtons(itemId, index === -1);
    
    return favorites;
}

function updateFavoriteButtons(itemId, isFavorite) {
    const buttons = document.querySelectorAll(`[data-item-id="${itemId}"] .fav-btn`);
    buttons.forEach(btn => {
        const icon = btn.querySelector('i');
        if (isFavorite) {
            btn.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            btn.classList.remove('active');
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    });
}

// 6. نظام البحث
function performSearch(query, location, filters = {}) {
    showLoading('Buscando...');
    
    // محاكاة البحث
    return new Promise((resolve) => {
        setTimeout(() => {
            hideLoading();
            
            const results = {
                query: query,
                location: location,
                count: Math.floor(Math.random() * 50) + 10,
                items: generateMockResults(12)
            };
            
            showNotification(`Encontrados ${results.count} resultados`, 'success');
            resolve(results);
        }, 1500);
    });
}

function generateMockResults(count) {
    const items = [];
    const categories = ['tools', 'vehicles', 'electronics', 'home', 'sports', 'events'];
    const cities = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga'];
    
    for (let i = 0; i < count; i++) {
        items.push({
            id: i + 1,
            title: `Artículo de prueba ${i + 1}`,
            description: 'Descripción del artículo de prueba',
            price: Math.floor(Math.random() * 100) + 5,
            category: categories[Math.floor(Math.random() * categories.length)],
            location: cities[Math.floor(Math.random() * cities.length)],
            rating: (Math.random() * 2 + 3).toFixed(1),
            image: `https://via.placeholder.com/300x200?text=Item+${i + 1}`
        });
    }
    
    return items;
}

// 7. نظام الإشعارات
function showNotification(message, type = 'info', duration = 5000) {
    // إزالة أي إشعارات سابقة
    const existing = document.querySelector('.global-notification');
    if (existing) existing.remove();
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = 'global-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icons[type]}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // زر الإغلاق
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // إزالة تلقائية
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }
    
    return notification;
}

// 8. أدوات المساعدة
function showLoading(message = 'Cargando...') {
    const loading = document.createElement('div');
    loading.className = 'global-loading';
    loading.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    
    loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
        font-size: 1.2rem;
    `;
    
    document.body.appendChild(loading);
    return loading;
}

function hideLoading() {
    const loading = document.querySelector('.global-loading');
    if (loading) loading.remove();
}

function formatPrice(amount, currency = 'EUR') {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function formatDate(date, format = 'short') {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: format === 'short' ? 'short' : 'long',
        day: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 9. تفاعلات المستخدم
function setupEventListeners() {
    // البحث أثناء الكتابة
    const searchInput = document.getElementById('mainSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            if (this.value.length >= 3) {
                performSearch(this.value, '');
            }
        }, 500));
    }
    
    // أزرار اللغة
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
        });
    });
    
    // أزرار المفضلة
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.closest('[data-item-id]')?.getAttribute('data-item-id');
            if (itemId) {
                toggleFavorite(parseInt(itemId));
            }
        });
    });
    
    // أزرار المشاركة
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const url = window.location.href;
            const title = document.title;
            shareContent(title, url);
        });
    });
}

// 10. المشاركة
function shareContent(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        });
    } else {
        // نسخ الرابط
        navigator.clipboard.writeText(url);
        showNotification('Enlace copiado al portapapeles', 'success');
    }
}

// 11. التحميل التلقائي
function autoLoadMore() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadMoreListings();
            }
        });
    });
    
    const sentinel = document.querySelector('.load-more-sentinel');
    if (sentinel) {
        observer.observe(sentinel);
    }
}

// 12. تتبع التحليلات
function trackEvent(eventName, data = {}) {
    // محاكاة إرسال بيانات التحليلات
    console.log('Event tracked:', eventName, data);
    
    // في الموقع الحقيقي، هنا سيتم إرسال البيانات لـ Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, data);
    }
}

function setupUserInteractionTracking() {
    // تتبع النقرات
    document.addEventListener('click', function(e) {
        const target = e.target;
        const clickable = target.closest('a, button, [role="button"]');
        
        if (clickable) {
            trackEvent('click', {
                element: clickable.tagName,
                text: clickable.textContent?.trim().substring(0, 50),
                href: clickable.href,
                class: clickable.className
            });
        }
    });
    
    // تتبع النماذج
    document.addEventListener('submit', function(e) {
        trackEvent('form_submit', {
            form_id: e.target.id,
            form_action: e.target.action
        });
    });
}

// 13. إعدادات المستخدم
function loadUserPreferences() {
    const prefs = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    
    // تطبيق التفضيلات
    if (prefs.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    return prefs;
}

function saveUserPreferences(preferences) {
    const current = loadUserPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem('userPreferences', JSON.stringify(updated));
    showNotification('Preferencias guardadas', 'success');
}

// 14. التحديثات في الوقت الحقيقي
function updateDateTime() {
    const now = new Date();
    const timeElements = document.querySelectorAll('.current-time');
    
    timeElements.forEach(el => {
        el.textContent = now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    });
    
    // تحديث كل دقيقة
    setTimeout(updateDateTime, 60000);
}

// 15. التوافق
function checkCompatibility() {
    const features = {
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        geolocation: !!navigator.geolocation,
        serviceWorker: 'serviceWorker' in navigator,
        webShare: 'share' in navigator,
        clipboard: 'clipboard' in navigator
    };
    
    if (!features.localStorage) {
        showNotification('Tu navegador no soporta almacenamiento local', 'warning');
    }
    
    return features;
}

// 16. تصدير الوظائف (للاستخدام في ملفات أخرى)
window.RentHub = {
    // اللغات
    setLanguage,
    translations,
    
    // المصادقة
    checkAuthStatus,
    loginUser,
    logoutUser,
    
    // المفضلة
    loadFavorites,
    toggleFavorite,
    
    // البحث
    performSearch,
    
    // الإشعارات
    showNotification,
    
    // الأدوات
    formatPrice,
    formatDate,
    showLoading,
    hideLoading,
    
    // التحليلات
    trackEvent,
    
    // التفضيلات
    loadUserPreferences,
    saveUserPreferences,
    
    // التوافق
    checkCompatibility
};

// 17. التهيئة النهائية
console.log('✅ main-script.js loaded successfully');
