// ui-components.js
// UI Components and Rendering Functions for RentHub 2030

'use strict';

class UIComponents {
    // Create authentication buttons based on user state
    static createAuthButtons(user) {
        const navButtons = document.getElementById('nav-buttons');
        if (!navButtons) return;
        
        if (user) {
            // User is logged in
            navButtons.innerHTML = `
                <div class="user-menu">
                    <a href="dashboard.html" class="btn btn-outline" aria-label="Mi Dashboard">
                        <i class="fas fa-tachometer-alt" aria-hidden="true"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="publish.html" class="btn btn-primary" aria-label="Publicar anuncio">
                        <i class="fas fa-plus" aria-hidden="true"></i>
                        <span>Publicar</span>
                    </a>
                    <button class="btn btn-outline" id="signout-btn" aria-label="Cerrar sesión">
                        <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
                        <span>Salir</span>
                    </button>
                </div>
            `;
            
            // Add sign out listener
            const signoutBtn = document.getElementById('signout-btn');
            if (signoutBtn) {
                signoutBtn.addEventListener('click', async () => {
                    const firebaseService = new FirebaseService();
                    const result = await firebaseService.signOut();
                    if (result.success) {
                        window.location.reload();
                    }
                });
            }
        } else {
            // User is not logged in
            navButtons.innerHTML = `
                <div class="guest-buttons">
                    <button class="btn btn-outline" id="login-btn" aria-label="Iniciar sesión">
                        <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                        <span>Iniciar Sesión</span>
                    </button>
                    <button class="btn btn-primary" id="register-btn" aria-label="Registrarse">
                        <i class="fas fa-user-plus" aria-hidden="true"></i>
                        <span>Registrarse</span>
                    </button>
                </div>
            `;
            
            // Add modal listeners
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    authModal.showLoginModal();
                });
            }
            
            if (registerBtn) {
                registerBtn.addEventListener('click', () => {
                    authModal.showSignupModal();
                });
            }
        }
        
        console.log('Auth buttons updated for:', user ? 'logged in user' : 'guest');
    }

    // Create listing card
    static createListingCard(listing) {
        const card = document.createElement('article');
        card.className = 'listing-card';
        card.setAttribute('role', 'article');
        card.setAttribute('aria-labelledby', `listing-title-${listing.id}`);
        
        const sanitizedTitle = SecurityUtils.sanitizeText(listing.title, 50);
        const sanitizedLocation = SecurityUtils.sanitizeText(listing.location, 30);
        const sanitizedCategory = SecurityUtils.sanitizeText(listing.category, 20);
        const imageUrl = SecurityUtils.sanitizeURL(listing.images?.[0]);
        const price = SecurityUtils.validateNumber(listing.price, 0, 10000) || 0;
        const priceType = SecurityUtils.sanitizeText(listing.priceType || 'día');
        
        card.innerHTML = `
            <div class="listing-image-container">
                <img 
                    src="${imageUrl}" 
                    alt="${sanitizedTitle}" 
                    class="listing-image"
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="200"
                >
                <div class="listing-badge">
                    <span class="badge-text">Destacado</span>
                </div>
                <div class="listing-price">
                    <span class="price-amount">${price}€</span>
                    <span class="price-period">/${priceType}</span>
                </div>
            </div>
            <div class="listing-content">
                <h3 id="listing-title-${listing.id}" class="listing-title">
                    ${sanitizedTitle}
                </h3>
                <div class="listing-meta">
                    <span class="meta-item" aria-label="Ubicación">
                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                        ${sanitizedLocation}
                    </span>
                    <span class="meta-item" aria-label="Categoría">
                        <i class="fas fa-tag" aria-hidden="true"></i>
                        ${sanitizedCategory}
                    </span>
                </div>
                <div class="listing-actions">
                    <button 
                        class="btn btn-primary view-btn"
                        aria-label="Ver detalles de ${sanitizedTitle}"
                        data-listing-id="${listing.id}"
                    >
                        <span>Ver Detalles</span>
                        <i class="fas fa-arrow-right" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add click event
        card.querySelector('.view-btn').addEventListener('click', (e) => {
            e.preventDefault();
            const listingId = e.currentTarget.getAttribute('data-listing-id');
            if (listingId) {
                window.location.href = `listing-detail.html?id=${encodeURIComponent(listingId)}`;
            }
        });
        
        // Make entire card clickable on mobile
        if (window.innerWidth < 768) {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.view-btn')) {
                    window.location.href = `listing-detail.html?id=${encodeURIComponent(listing.id)}`;
                }
            });
            card.style.cursor = 'pointer';
        }
        
        return card;
    }

    // Show error toast
    static showError(message) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
            <span>${SecurityUtils.sanitizeText(message)}</span>
            <button class="toast-close" aria-label="Cerrar mensaje">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }

    // Show success toast
    static showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            <span>${SecurityUtils.sanitizeText(message)}</span>
            <button class="toast-close" aria-label="Cerrar mensaje">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }

    // Show loading state
    static showLoading() {
        const listingsGrid = document.getElementById('featuredListings');
        if (listingsGrid) {
            listingsGrid.innerHTML = `
                <div class="loading-state" role="status" aria-label="Cargando productos">
                    <div class="spinner" aria-hidden="true"></div>
                    <p>Cargando productos destacados...</p>
                </div>
            `;
        }
    }

    // Hide loading state
    static hideLoading() {
        const loadingState = document.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
    }

    // Show empty state
    static showEmptyState(container, message, icon = 'fa-inbox') {
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state" role="status">
                <i class="fas ${icon}" aria-hidden="true"></i>
                <h3>No se encontraron resultados</h3>
                <p>${SecurityUtils.sanitizeText(message)}</p>
            </div>
        `;
    }

    // Create category card
    static createCategoryCard(category) {
        const card = document.createElement('a');
        card.href = `listings.html?category=${encodeURIComponent(category.slug)}`;
        card.className = 'category-card';
        card.setAttribute('aria-label', `Ver ${category.name}`);
        
        card.innerHTML = `
            <div class="category-icon">
                <i class="fas ${category.icon}" aria-hidden="true"></i>
            </div>
            <h3 class="category-name">${SecurityUtils.sanitizeText(category.name)}</h3>
            <p class="category-count">${category.count || 0} productos</p>
        `;
        
        return card;
    }

    // Update listings grid
    static renderListings(listings, containerId = 'featuredListings') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!listings || listings.length === 0) {
            this.showEmptyState(
                container, 
                'No hay productos disponibles en este momento',
                'fa-box-open'
            );
            return;
        }
        
        container.innerHTML = '';
        
        listings.forEach(listing => {
            const card = this.createListingCard(listing);
            container.appendChild(card);
        });
    }

    // Create skeleton loader for listings
    static showSkeletonLoaders(count = 6, containerId = 'featuredListings') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'listing-card skeleton-card';
            skeleton.innerHTML = `
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-meta"></div>
                    <div class="skeleton-button"></div>
                </div>
            `;
            container.appendChild(skeleton);
        }
    }

    // Create confirmation modal
    static showConfirmModal(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${SecurityUtils.sanitizeText(title)}</h3>
                </div>
                <div class="modal-body">
                    <p>${SecurityUtils.sanitizeText(message)}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="cancel-btn">Cancelar</button>
                    <button class="btn btn-danger" id="confirm-btn">Confirmar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cancel button
        modal.querySelector('#cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        // Confirm button
        modal.querySelector('#confirm-btn').addEventListener('click', () => {
            onConfirm();
            modal.remove();
        });
        
        // Close on overlay click
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            modal.remove();
        });
    }

    // Format price
    static formatPrice(price) {
        const validPrice = SecurityUtils.validateNumber(price, 0, 10000) || 0;
        return validPrice.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Format date
    static formatDate(timestamp) {
        if (!timestamp) return 'Fecha no disponible';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format relative time (e.g., "hace 2 horas")
    static formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Justo ahora';
        if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
        if (diffDays < 30) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
        
        return this.formatDate(timestamp);
    }

    // Scroll to element smoothly
    static scrollTo(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copiado al portapapeles');
            return true;
        } catch (error) {
            this.showError('Error al copiar');
            return false;
        }
    }
}

console.log('UI components loaded successfully');
