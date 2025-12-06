// ==============================================================================
// 🔴 RentHub 2030 - قاعدة البيانات والمنطق الخلفي (backend_logic.js)
// هذا الملف يجب أن يعمل مع index.html و item_detail.html
// ==============================================================================

// 1. هياكل البيانات ونظام الأرباح (SUBSCRIPTION PLANS)
const SUBSCRIPTION_PLANS = {
    'GOLD': { name: 'ذهبية', price: 59, bumpFrequencyHours: 1, maxListings: Infinity },
    'SILVER': { name: 'فضية', price: 29, bumpFrequencyHours: 12, maxListings: 100 },
    'BRONZE': { name: 'نحاسية', price: 9, bumpFrequencyHours: 24, maxListings: 50 }
};

// 2. جدول المستخدمين (USERS)
let USERS = [
    {
        id: 1, name: "أحمد محمد", nameEs: "Ahmed Mohamed", email: "ahmed@rh.com", phoneNumber: "+34 612 345 678", city: "Madrid", ratingAvg: 4.9, totalRatings: 38, verified: true, memberSince: "2023-01-15",
        type: 'Owner', plan: 'GOLD', hasUsedTrial: false
    },
    {
        id: 2, name: "كارلوس غارسيا", nameEs: "Carlos García", email: "carlos@rh.com", phoneNumber: "+34 623 456 789", city: "Barcelona", ratingAvg: 4.8, totalRatings: 124, verified: true, memberSince: "2022-08-20",
        type: 'Owner', plan: 'SILVER', hasUsedTrial: false
    },
    {
        id: 3, name: "فاطمة العلي", nameEs: "Fatima Al-Ali", email: "fatima@rh.com", phoneNumber: "+34 634 567 890", city: "Valencia", ratingAvg: 5.0, totalRatings: 89, verified: true, memberSince: "2023-03-10",
        type: 'Owner', plan: 'BRONZE', hasUsedTrial: true 
    },
    {
        id: 4, name: "خوان رودريغيز", nameEs: "Juan Rodríguez", email: "juan@rh.com", phoneNumber: "+34 645 678 901", city: "Sevilla", ratingAvg: 4.7, totalRatings: 56, verified: true, memberSince: "2022-11-05",
        type: 'Owner', plan: 'BRONZE', hasUsedTrial: false
    }
];

// 3. جدول المنتجات (ITEMS)
let ITEMS = [
    {
        id: 1, ownerId: 1, title: "جرار زراعي John Deere 5075E", titleEs: "Tractor Agrícola John Deere 5075E", description: "جرار زراعي قوي من John Deere، مثالي للأراضي الكبيرة...", category: "heavy", pricePerDay: 250, currency: "€", city: "Madrid", country: "España", available: true, images: ["https://i.ibb.co/L5k6W6x/tractor.jpg"], rating: 4.9, totalReviews: 38, badge: { ar: "الأكثر طلباً"}, specifications: { power: "75 HP", fuel: "Diesel" },
        lastBumpTime: new Date(Date.now() - 3600000 * 2), isActive: true, trialEndsOn: null 
    },
    {
        id: 2, ownerId: 2, title: "مثقاب كهربائي Bosch Professional GSB 18V", titleEs: "Taladro Eléctrico Bosch Professional GSB 18V", description: "مثقاب احترافي من Bosch بقوة 18 فولت، مثالي لجميع أعمال الحفر والثقب...", category: "tools", pricePerDay: 15, currency: "€", city: "Barcelona", country: "España", available: true, images: ["https://i.ibb.co/tCg3v0m/drill.jpg"], rating: 4.8, totalReviews: 124, badge: { ar: "خصم 40%"}, specifications: { voltage: "18V", type: "Hammer" },
        lastBumpTime: new Date(Date.now() - 3600000 * 25), isActive: true, trialEndsOn: null
    },
    {
        id: 3, ownerId: 3, title: "Tesla Model 3 Long Range 2023", titleEs: "Tesla Model 3 Long Range 2023", description: "سيارة كهربائية فاخرة Tesla Model 3 موديل 2023. مدى يصل إلى 580 كم، قيادة ذاتية...", category: "car", pricePerDay: 80, currency: "€", city: "Valencia", country: "España", available: true, images: ["https://i.ibb.co/L5k6W6x/tractor.jpg"], rating: 5.0, totalReviews: 89, badge: { ar: "جديد"}, specifications: { range: "580 km", year: "2023" },
        lastBumpTime: new Date(Date.now() - 3600000 * 1), isActive: true, trialEndsOn: null
    },
    {
        id: 4, ownerId: 4, title: "خيمة احترافية للمناسبات 10x10 متر", titleEs: "Carpa Profesional para Eventos 10x10 metros", description: "خيمة كبيرة احترافية مثالية للأفراح والمناسبات...", category: "events", pricePerDay: 120, currency: "€", city: "Sevilla", country: "España", available: true, images: ["https://i.ibb.co/tCg3v0m/drill.jpg"], rating: 4.7, totalReviews: 56, badge: { ar: "عرض خاص"}, specifications: { size: "10x10 metros", color: "White" },
        lastBumpTime: new Date(Date.now() - 3600000 * 10), isActive: true, trialEndsOn: null
    },
    // إعلان تجريبي 
    {
        id: 5, ownerId: 4, title: "رافع كهربائي صغير (تجريبي)", titleEs: "Mini Elevador Eléctrico (Prueba)", description: "رافع كهربائي مثالي لأعمال الصيانة المنزلية...", category: "tools", pricePerDay: 40, currency: "€", city: "Sevilla", country: "España", available: true, images: ["https://i.ibb.co/L5k6W6x/tractor.jpg"], rating: 4.5, totalReviews: 0, badge: { ar: "تجريبي"}, specifications: { power: "2KW", height: "3m" },
        lastBumpTime: new Date(), isActive: true, 
        trialEndsOn: new Date(Date.now() + 3600000 * 0.5) 
    }
];

// 4. منطق الـ BUMP SYSTEM والإيقاف التلقائي
function runScheduledBumps() {
    const currentTime = Date.now();
    ITEMS.forEach(item => {
        if (!item.isActive) return;

        // 1. التحقق من انتهاء الفترة التجريبية
        if (item.trialEndsOn && currentTime >= item.trialEndsOn.getTime()) {
            item.isActive = false; 
            item.trialEndsOn = null; 
            return; 
        }

        // 2. تطبيق Bump
        const user = USERS.find(u => u.id === item.ownerId);
        if (!user || user.type !== 'Owner' || !user.plan) return;
        const plan = SUBSCRIPTION_PLANS[user.plan];
        const bumpIntervalMs = plan.bumpFrequencyHours * 60 * 60 * 1000;

        if (currentTime >= item.lastBumpTime.getTime() + bumpIntervalMs) {
            item.lastBumpTime = new Date(currentTime); 
        }
    });
}

// 6. دوال البحث والفلترة 
function searchItems(query = "", city = "") {
    query = query.toLowerCase().trim();
    city = city.toLowerCase().trim();
    
    let results = ITEMS.filter(item => {
        // نستخدم العنوان العربي والإنجليزي للبحث
        const titleMatch = (item.title && item.title.toLowerCase().includes(query)) ||
                           (item.titleEs && item.titleEs.toLowerCase().includes(query));
        
        const matchesQuery = query === "" || titleMatch || (item.category && item.category.toLowerCase().includes(query));
        const matchesCity = city === "" || (item.city && item.city.toLowerCase().includes(city));
        
        return matchesQuery && matchesCity && item.available && item.isActive;
    });
    
    // الفرز حسب أولوية الـ Bump (الأحدث رفعاً يظهر أولاً)
    results.sort((a, b) => b.lastBumpTime.getTime() - a.lastBumpTime.getTime());
    
    return results;
}

// 7. دوال جلب البيانات المفردة
function getItemById(itemId) {
    return ITEMS.find(item => item.id === parseInt(itemId)) || null;
}

function getUserById(userId) {
    return USERS.find(user => user.id === parseInt(userId)) || null;
}

// التنفيذ: تشغيل دالة الترقية عند تحميل الصفحة
runScheduledBumps(); 

// تصدير الدوال والبيانات للمتصفح
if (typeof window !== 'undefined') {
    window.RentHubDB = {
        USERS, ITEMS, SUBSCRIPTION_PLANS,
        searchItems, getItemById, getUserById
    };
}
