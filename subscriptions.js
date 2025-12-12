// subscriptions.js
const RentHubSubscriptions = {
    plans: {
        free: {
            id: "free",
            name: "Plan Gratis",
            price: 0,
            currency: "€",
            period: "month",
            maxAds: 1,
            refreshHours: 24,
            color: "#666666",
            badge: "🆓 GRATIS",
            features: [
                "1 anuncio activo",
                "Actualización cada 24 horas",
                "Aparece en listados básicos",
                "Sin costo mensual"
            ]
        },
        bronze: {
            id: "bronze",
            name: "Plan Bronce",
            price: 5,
            currency: "€",
            period: "month",
            maxAds: 5,
            refreshHours: 12,
            color: "#CD7F32",
            badge: "🥉 BRONCE",
            features: [
                "5 anuncios simultáneos",
                "Actualización cada 12 horas",
                "Destacado color bronce",
                "Mejor visibilidad",
                "Soporte prioritario"
            ]
        },
        silver: {
            id: "silver",
            name: "Plan Plata",
            price: 15,
            currency: "€",
            period: "month",
            maxAds: 10,
            refreshHours: 6,
            color: "#C0C0C0",
            badge: "🥈 PLATA",
            features: [
                "10 anuncios simultáneos",
                "Actualización cada 6 horas",
                "Destacado color plata",
                "Posición preferente",
                "Estadísticas avanzadas",
                "Soporte 24/7"
            ]
        },
        gold: {
            id: "gold",
            name: "Plan Oro",
            price: 30,
            currency: "€",
            period: "month",
            maxAds: 100,
            refreshHours: 2,
            color: "#FFD700",
            badge: "🥇 ORO",
            features: [
                "100 anuncios simultáneos",
                "Actualización cada 2 horas",
                "Destacado color oro",
                "Posición premium TOP",
                "Estadísticas completas",
                "Soporte dedicado",
                "Promociones exclusivas"
            ]
        }
    },

    // Obtener plan del usuario
    getUserPlan() {
        const planId = localStorage.getItem('userPlan') || 'free';
        return this.plans[planId] || this.plans.free;
    },

    // Cambiar plan del usuario
    setUserPlan(planId) {
        if (this.plans[planId]) {
            localStorage.setItem('userPlan', planId);
            return true;
        }
        return false;
    },

    // Verificar si puede publicar más
    canPublishMore(userId) {
        const userPlan = this.getUserPlan();
        const userAds = JSON.parse(localStorage.getItem('userAds') || '[]');
        const userAdsCount = userAds.filter(ad => ad.userId === userId).length;
        
        return userAdsCount < userPlan.maxAds;
    },

    // Calcular tiempo para próxima actualización
    getNextRefreshTime(adId) {
        const ad = this.getAd(adId);
        if (!ad) return null;
        
        const userPlan = this.getUserPlan();
        const lastRefresh = new Date(ad.lastRefresh);
        const nextRefresh = new Date(lastRefresh.getTime() + (userPlan.refreshHours * 60 * 60 * 1000));
        
        return nextRefresh;
    },

    // Formatear tiempo restante
    formatTimeRemaining(nextRefresh) {
        const now = new Date();
        const diff = nextRefresh - now;
        
        if (diff <= 0) return "¡Listo para actualizar!";
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
};

// Hacer disponible globalmente
window.RentHubSubscriptions = RentHubSubscriptions;
