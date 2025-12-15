// app.js
// Main Application Logic for RentHub 2030

'use strict';

// Global state management
const AppState = {
    user: null,
    listings: [],
    categories: [
        { name: 'Herramientas', slug: 'herramientas', icon: 'fa-tools', count: 0 },
        { name: 'Electrónica', slug: 'electronica', icon: 'fa-laptop', count: 0 },
        { name: 'Deportes', slug: 'deportes', icon: 'fa-futbol', count: 0 },
        { name: 'Vehículos', slug: 'vehiculos', icon: 'fa-car', count: 0 },
        { name: 'Hogar', slug: 'hogar', icon: 'fa-home', count: 0 },
        { name: 'Otros', slug: 'otros', icon: 'fa-ellipsis-h', count: 0 }
    ],
    
    setUser(user) {
        this.user = user;
        this.notifyListeners('user', user);
    },
    
    setListings(listings) {
        this.listings = listings;
        this.notifyListeners('listings', listings);
    },
    
    listeners: {},
    
    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
};

// Main Application Class
class RentHubApp {
    constructor() {
        this.firebaseService = new FirebaseService();
        this.initialize();
    }

    async initialize() {
        try {
            console.log('Initializing RentHub App...');
            
            // Set current year in footer
            const yearElement = document.getElementById('current-year');
            if (yearElement) {
                yearElement.textContent = new Date().getFullYear();
            }
            
            // Initialize Firebase
            const firebaseInitialized = await this.firebaseService.initialize();
            
            if (!firebaseInitialized) {
                throw new Error('Firebase initialization failed');
            }
            
            // Set Firebase service for auth modal
            authModal.setFirebaseService(this.firebaseService);
            
            // Get current user immediately
            const initialUser = this.firebaseService.getCurrentUser();
            console.log('Initial user:', initialUser ? initialUser.email : 'none');
            UIComponents.createAuthButtons(initialUser);
            
            // Set up auth state listener
            auth.onAuthStateChanged((user) => {
                console.log('Auth state changed:', user ? user.email : 'logged out');
                AppState.setUser(user);
                UIComponents.createAuthButtons(user);
            });
            
            // Load featured listings
            await this.loadFeaturedListings();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize mobile menu
            this.initMobileMenu();
            
            // Handle scroll effects
            this.handleScroll();
            
            // Initialize categories
            this.initCategories();
            
            console.log('RentHub App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            UIComponents.showError('Error al cargar la aplicación');
        }
    }

    async loadFeaturedListings() {
        try {
            UIComponents.showSkeletonLoaders(6);
            
            // Rate limiting
            if (!SecurityUtils.rateLimiter.isAllowed('loadListings', 5, 10000)) {
                throw new Error('Demasiadas solicitudes. Intenta más tarde.');
            }
            
            const listings = await this.firebaseService.getFeaturedListings(6);
            AppState.setListings(listings);
            
            if (listings && listings.length > 0) {
                UIComponents.renderListings(listings);
            } else {
                this.showSampleListings();
            }
        } catch (error) {
            console.error('Error loading listings:', error);
            
            // Show sample listings as fallback
            this.showSampleListings();
            
            if (error.message !== 'Demasiadas solicitudes. Intenta más tarde.') {
                UIComponents.showError('Mostrando productos de ejemplo');
            }
        }
    }

    showSampleListings() {
        const sampleListings = [
            {
                id: 'sample-1',
                title: 'Taladro Percutor Profesional',
                description: 'Taladro de alta potencia para trabajos profesionales',
                location: 'Madrid',
                price: 15,
                priceType: 'día',
                category: 'Herramientas',
                images: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80']
            },
            {
                id: 'sample-2',
                title: 'Cámara DSLR Canon EOS',
                description: 'Cámara profesional con lente 24-70mm',
                location: 'Barcelona',
                price: 40,
                priceType: 'día',
                category: 'Electrónica',
                images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80']
            },
            {
                id: 'sample-3',
                title: 'Bicicleta de Montaña',
                description: 'Bicicleta de montaña de 21 velocidades',
                location: 'Valencia',
                price: 12,
                priceType: 'día',
                category: 'Deportes',
                images: ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80']
            },
            {
                id: 'sample-4',
                title: 'Cortacésped Eléctrico',
                description: 'Cortacésped eléctrico para jardines medianos',
                location: 'Sevilla',
                price: 18,
                priceType: 'día',
                category: 'Hogar',
                images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80']
            },
            {
                id: 'sample-5',
                title: 'Proyector HD 1080p',
                description: 'Proyector de alta definición para presentaciones',
                location: 'Málaga',
                price: 25,
                priceType: 'día',
                category: 'Electrónica',
                images: ['https://images.unsplash.com/photo-1561830358-ad755c3e4c8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80']
            },
            {
                id: 'sample-6',
                title: 'Kayak Doble',
                description: 'Kayak para dos personas con remos incluidos',
                location: 'Bilbao',
                price: 30,
                priceType: 'día',
                category: 'Deportes',
                images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80']
            }
        ];
        
        UIComponents.renderListings(sampleListings);
    }

    setupEventListeners() {
        // Search form submission
        const searchForm = document.querySelector('.search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }
        
        // Search button click
        const searchButton = document.getElementById('search-button');
        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }
        
        // Search input keypress
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch();
                }
            });
        }
        
        // Price input validation
        const priceInput = document.getElementById('max-price-input');
        if (priceInput) {
            priceInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (value < 0) e.target.value = 0;
                if (value > 10000) e.target.value = 10000;
            });
        }
        
        // Category links
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const category = card.getAttribute('data-category');
                if (category) {
                    this.searchByCategory(category);
                }
            });
        });
    }

    handleSearch() {
        const searchInput = document.getElementById('search-input');
        const categorySelect = document.getElementById('category-select');
        const locationInput = document.getElementById('location-input');
        const priceInput = document.getElementById('max-price-input');
        
        const searchParams = {
            query: searchInput?.value?.trim() || '',
            category: categorySelect?.value || 'all',
            location: locationInput?.value?.trim() || '',
            maxPrice: priceInput?.value || ''
        };
        
        // Sanitize inputs
        if (searchParams.query) {
            searchParams.query = SecurityUtils.sanitizeText(searchParams.query, 100);
        }
        if (searchParams.location) {
            searchParams.location = SecurityUtils.sanitizeText(searchParams.location, 50);
        }
        
        // Build URL with search parameters
        const params = new URLSearchParams();
        if (searchParams.query) params.set('q', searchParams.query);
        if (searchParams.category && searchParams.category !== 'all') params.set('category', searchParams.category);
        if (searchParams.location) params.set('location', searchParams.location);
        if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);
        
        // Redirect to listings page with search params
        window.location.href = `listings.html?${params.toString()}`;
    }

    searchByCategory(category) {
        window.location.href = `listings.html?category=${encodeURIComponent(category)}`;
    }

    initMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
                
                mobileToggle.setAttribute('aria-expanded', !isExpanded);
                navMenu.classList.toggle('show');
                
                // Change icon
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.className = navMenu.classList.contains('show') ? 'fas fa-times' : 'fas fa-bars';
                }
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-toggle')) {
                    navMenu.classList.remove('show');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    const icon = mobileToggle.querySelector('i');
                    if (icon) icon.className = 'fas fa-bars';
                }
            });
            
            // Close menu when clicking on a link
            navMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('show');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    const icon = mobileToggle.querySelector('i');
                    if (icon) icon.className = 'fas fa-bars';
                });
            });
        }
    }

    handleScroll() {
        const header = document.querySelector('.main-header');
        
        if (header) {
            let lastScroll = 0;
            
            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset;
                
                if (currentScroll > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                
                lastScroll = currentScroll;
            });
        }
    }

    initCategories() {
        const categoriesGrid = document.querySelector('.categories-grid');
        
        if (categoriesGrid) {
            categoriesGrid.innerHTML = '';
            
            AppState.categories.forEach(category => {
                const card = UIComponents.createCategoryCard(category);
                categoriesGrid.appendChild(card);
            });
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.rentHubApp = new RentHubApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Page is now visible');
        // Refresh auth state when page becomes visible
        if (window.rentHubApp && window.rentHubApp.firebaseService) {
            const user = window.rentHubApp.firebaseService.getCurrentUser();
            UIComponents.createAuthButtons(user);
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    UIComponents.showSuccess('Conexión restaurada');
});

window.addEventListener('offline', () => {
    UIComponents.showError('Sin conexión a internet');
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Don't show error toast for every error, only critical ones
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

console.log('App script loaded successfully');
