/**
 * Sistema de Gestión de Suscripciones - RentHub 2030
 * Archivo: subscriptions.js
 */

// ==================== Definición de Planes Disponibles ====================
const subscriptionPlans = {
    free: {
        name: "Gratis",
        price: 0,
        adsLimit: 1,
        features: ["Un solo anuncio", "Soporte básico por correo"],
        color: "#6c757d",
        icon: "🆓"
    },
    bronze: {
        name: "Bronce",
        price: 5,
        adsLimit: 5,
        features: ["Hasta 5 anuncios", "Prioridad media en búsquedas", "Soporte por correo", "Extensión de anuncio 7 días"],
        color: "#cd7f32",
        icon: "🥉"
    },
    silver: {
        name: "Plata",
        price: 15,
        adsLimit: 20,
        features: ["Hasta 20 anuncios", "Destacar anuncio en color plata", "Soporte inmediato en 24 horas", "Reportes de vistas básicos", "Actualizaciones mensuales"],
        color: "#c0c0c0",
        icon: "🥈"
    },
    gold: {
        name: "Oro",
        price: 30,
        adsLimit: 100,
        features: ["Anuncios prácticamente ilimitados", "Destacado prominente en página principal", "Soporte telefónico rápido", "Reportes de rendimiento avanzados", "Prioridad máxima en búsquedas", "Análisis de mercado"],
        color: "#ffd700",
        icon: "🥇"
    }
};

// ==================== Gestión de Datos del Usuario ====================
// Datos del usuario (se reemplazarán con conexión a base de datos más adelante)
let currentUser = null;

// Cargar datos del usuario desde localStorage o crear datos de prueba
function loadUserData() {
    const savedUser = localStorage.getItem('renthub_user');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        console.log('✅ Datos de usuario cargados:', currentUser);
    } else {
        // Datos de prueba para nuevo usuario
        currentUser = {
            id: Date.now(),
            name: "Usuario Nuevo",
            email: "usuario@ejemplo.com",
            currentPlan: "free",
            adsPublished: 0,
            subscriptionDate: null,
            paymentMethod: null,
            activeAds: []
        };
        saveUserData();
        console.log('🆕 Nuevo usuario creado');
    }
    
    return currentUser;
}

// Guardar datos del usuario
function saveUserData() {
    localStorage.setItem('renthub_user', JSON.stringify(currentUser));
}

// ==================== Funciones Principales ====================

// 1. Verificar elegibilidad para publicar
function checkPublishEligibility() {
    const user = currentUser || loadUserData();
    const plan = subscriptionPlans[user.currentPlan];
    
    if (user.adsPublished >= plan.adsLimit) {
        // Alcanzó el límite máximo, mostrar opciones de mejora
        showUpgradeOptions(plan);
        return {
            canPublish: false,
            reason: `Alcanzaste el límite máximo (${user.adsPublished}/${plan.adsLimit})`,
            plan: plan.name
        };
    }
    
    return {
        canPublish: true,
        remainingAds: plan.adsLimit - user.adsPublished,
        plan: plan.name
    };
}

// 2. Simular publicación de nuevo anuncio
function publishNewAd(adData) {
    const eligibility = checkPublishEligibility();
    
    if (!eligibility.canPublish) {
        alert(`⚠️ No puedes publicar un nuevo anuncio.\nPlan actual: ${eligibility.plan}\n${eligibility.reason}\n\nPor favor, mejora tu plan desde la página de suscripciones.`);
        return false;
    }
    
    // Simular proceso de publicación
    currentUser.adsPublished++;
    currentUser.activeAds.push({
        id: Date.now(),
        title: adData.title || "Nuevo anuncio",
        date: new Date().toISOString().split('T')[0],
        status: "Activo"
    });
    
    saveUserData();
    
    console.log(`✅ Nuevo anuncio publicado. Anuncios publicados: ${currentUser.adsPublished}`);
    alert(`✅ ¡Tu anuncio se publicó exitosamente!\nTe quedan ${eligibility.remainingAds - 1} anuncios en tu plan actual.`);
    
    return true;
}

// 3. Mostrar opciones de mejora
function showUpgradeOptions(currentPlan) {
    // Esto se integrará con upgrade-plans.html
    console.log('📊 Mostrando opciones de mejora para el usuario');
    
    // Guardar plan actual para mejora
    sessionStorage.setItem('upgrade_from_plan', currentUser.currentPlan);
    
    // Redirigir usuario a página de mejora
    setTimeout(() => {
        if (confirm(`Alcanzaste el límite máximo en tu plan actual (${currentPlan.name}).\n¿Quieres ir a la página de mejora de suscripción?`)) {
            window.location.href = 'upgrade-plans.html';
        }
    }, 500);
}

// 4. Mejorar plan del usuario
function upgradeUserPlan(newPlanKey) {
    if (!subscriptionPlans[newPlanKey]) {
        alert('❌ El plan seleccionado no existe');
        return false;
    }
    
    const oldPlan = subscriptionPlans[currentUser.currentPlan];
    const newPlan = subscriptionPlans[newPlanKey];
    
    // Actualizar datos del usuario
    currentUser.currentPlan = newPlanKey;
    currentUser.subscriptionDate = new Date().toISOString();
    currentUser.adsPublished = 0; // Reiniciar contador después de mejora
    
    saveUserData();
    
    // Notificación de éxito
    const successMessage = `
        🎉 ¡Mejora exitosa!
        
        De: ${oldPlan.name}
        A: ${newPlan.name}
        
        Precio: ${newPlan.price === 0 ? 'Gratis' : `€${newPlan.price}/mes`}
        Nuevo límite: ${newPlan.adsLimit === 100 ? 'Ilimitados' : newPlan.adsLimit} anuncios
        
        Ahora puedes publicar nuevos anuncios.
    `;
    
    alert(successMessage);
    console.log(`🔄 Usuario mejorado a ${newPlan.name}`);
    
    // Actualizar interfaz si la función existe
    if (typeof updateSubscriptionUI === 'function') {
        updateSubscriptionUI();
    }
    
    return true;
}

// 5. Obtener información del plan actual
function getCurrentPlanInfo() {
    const user = currentUser || loadUserData();
    const plan = subscriptionPlans[user.currentPlan];
    
    return {
        ...plan,
        adsUsed: user.adsPublished,
        adsRemaining: plan.adsLimit - user.adsPublished,
        usagePercentage: Math.min(100, (user.adsPublished / plan.adsLimit) * 100)
    };
}

// 6. Crear visualización comparativa de planes (para usar en upgrade-plans.html)
function renderPlansComparison() {
    const plansContainer = document.getElementById('plansComparison');
    if (!plansContainer) return;
    
    let html = `
        <div class="plans-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0;">
    `;
    
    Object.entries(subscriptionPlans).forEach(([key, plan]) => {
        const isCurrentPlan = currentUser && currentUser.currentPlan === key;
        
        html += `
            <div class="plan-card" style="
                border: 2px solid ${isCurrentPlan ? plan.color : '#e0e0e0'};
                border-radius: 12px;
                padding: 25px;
                background: ${isCurrentPlan ? '#f9f9f9' : 'white'};
                position: relative;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            ">
                ${isCurrentPlan ? 
                    `<div style="position: absolute; top: -10px; right: 20px; background: ${plan.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Tu Plan Actual</div>` 
                    : ''}
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">${plan.icon}</div>
                    <h3 style="color: ${plan.color}; margin: 10px 0; font-size: 24px;">${plan.name}</h3>
                    <div style="font-size: 28px; font-weight: bold; color: #333; margin: 15px 0;">
                        ${plan.price === 0 ? 'Gratis' : `€${plan.price}<span style="font-size: 14px; color: #666;">/mes</span>`}
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <div style="font-size: 18px; font-weight: bold; color: #444; margin-bottom: 10px;">
                        ${plan.adsLimit === 100 ? 'Anuncios Ilimitados' : `Hasta ${plan.adsLimit} anuncios`}
                    </div>
                    <ul style="text-align: left; padding-left: 15px; margin: 0;">
                        ${plan.features.map(feature => `
                            <li style="margin-bottom: 10px; padding-left: 10px; position: relative;">
                                <span style="position: absolute; left: -15px; color: #4CAF50;">✓</span>
                                ${feature}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <button onclick="selectPlan('${key}')" 
                    style="
                        width: 100%;
                        padding: 12px;
                        background: ${isCurrentPlan ? '#e0e0e0' : plan.color};
                        color: ${isCurrentPlan ? '#666' : 'white'};
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: ${isCurrentPlan ? 'default' : 'pointer'};
                        transition: all 0.3s;
                    "
                    ${isCurrentPlan ? 'disabled' : ''}
                    onmouseover="this.style.transform='${isCurrentPlan ? '' : 'translateY(-2px)'}'"
                    onmouseout="this.style.transform='translateY(0)'"
                >
                    ${isCurrentPlan ? 'Actualmente Activo' : `Elegir ${plan.name}`}
                </button>
            </div>
        `;
    });
    
    html += `</div>`;
    plansContainer.innerHTML = html;
}

// 7. Seleccionar plan (para botón en interfaz)
function selectPlan(planKey) {
    if (currentUser && currentUser.currentPlan === planKey) {
        alert('¡Este ya es tu plan actual!');
        return;
    }
    
    const plan = subscriptionPlans[planKey];
    
    if (confirm(`¿Quieres suscribirte al plan ${plan.name} por €${plan.price}/mes?`)) {
        upgradeUserPlan(planKey);
    }
}

// ==================== Inicialización Automática ====================
// Cargar datos del usuario al ejecutar el script
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    console.log('🚀 Sistema de suscripciones listo para funcionar');
    
    // Si estamos en página de planes, mostrarlos
    if (document.getElementById('plansComparison')) {
        renderPlansComparison();
    }
    
    // Si estamos en panel de control, mostrar información de suscripción
    if (document.getElementById('subscriptionStatus')) {
        displaySubscriptionStatus();
    }
});

// ==================== Función auxiliar para mostrar estado ====================
function displaySubscriptionStatus() {
    const container = document.getElementById('subscriptionStatus');
    if (!container) return;
    
    const planInfo = getCurrentPlanInfo();
    
    container.innerHTML = `
        <div style="background: linear-gradient(135deg, ${planInfo.color}20, ${planInfo.color}40); 
                    padding: 20px; 
                    border-radius: 12px; 
                    border-left: 5px solid ${planInfo.color};
                    margin: 20px 0;">
            <h3 style="margin-top: 0; color: ${planInfo.color};">
                ${planInfo.icon} Tu suscripción actual: ${planInfo.name}
            </h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 15px 0;">
                <div>
                    <div style="font-size: 14px; color: #666;">Anuncios Usados</div>
                    <div style="font-size: 24px; font-weight: bold;">
                        ${planInfo.adsUsed} / ${planInfo.adsLimit === 100 ? '∞' : planInfo.adsLimit}
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 14px; color: #666;">Estado</div>
                    <div style="font-size: 18px; font-weight: bold; color: ${planInfo.adsRemaining > 0 ? '#4CAF50' : '#f44336'}">
                        ${planInfo.adsRemaining > 0 ? 'Activo' : 'Completado'}
                    </div>
                </div>
            </div>
            <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden; margin: 15px 0;">
                <div style="background: ${planInfo.color}; height: 100%; width: ${planInfo.usagePercentage}%;"></div>
            </div>
            <div style="font-size: 14px; color: #666; text-align: center;">
                ${planInfo.adsRemaining > 0 ? 
                    `Quedan ${planInfo.adsRemaining} anuncios disponibles` : 
                    'Alcanzaste el límite máximo, <a href="upgrade-plans.html" style="color: #2196F3; font-weight: bold;">mejora ahora</a>'}
            </div>
        </div>
    `;
}

// Hacer funciones disponibles globalmente para llamadas desde HTML
window.checkPublishEligibility = checkPublishEligibility;
window.publishNewAd = publishNewAd;
window.upgradeUserPlan = upgradeUserPlan;
window.getCurrentPlanInfo = getCurrentPlanInfo;
window.renderPlansComparison = renderPlansComparison;
window.selectPlan = selectPlan;
window.displaySubscriptionStatus = displaySubscriptionStatus;
