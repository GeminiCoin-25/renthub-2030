// auth-modal.js
// Authentication Modal Components for RentHub 2030

'use strict';

class AuthModal {
    constructor() {
        this.currentModal = null;
        this.firebaseService = null;
    }

    // Set Firebase service instance
    setFirebaseService(service) {
        this.firebaseService = service;
    }

    // Show login modal
    showLoginModal() {
        this.closeModal();
        
        const modal = this.createModal('login');
        document.body.appendChild(modal);
        this.currentModal = modal;
        
        // Add event listeners
        this.setupLoginListeners(modal);
        
        // Focus on email input
        setTimeout(() => {
            modal.querySelector('#login-email').focus();
        }, 100);
    }

    // Show signup modal
    showSignupModal() {
        this.closeModal();
        
        const modal = this.createModal('signup');
        document.body.appendChild(modal);
        this.currentModal = modal;
        
        // Add event listeners
        this.setupSignupListeners(modal);
        
        // Focus on name input
        setTimeout(() => {
            modal.querySelector('#signup-name').focus();
        }, 100);
    }

    // Create modal element
    createModal(type) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${type}-title`);
        
        if (type === 'login') {
            modal.innerHTML = this.getLoginHTML();
        } else {
            modal.innerHTML = this.getSignupHTML();
        }
        
        return modal;
    }

    // Get login modal HTML
    getLoginHTML() {
        return `
            <div class="modal-overlay" aria-hidden="true"></div>
            <div class="modal-content">
                <button class="modal-close" aria-label="Cerrar modal">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="modal-header">
                    <h2 id="login-title" class="modal-title">Iniciar Sesión</h2>
                    <p class="modal-subtitle">Accede a tu cuenta de RentHub</p>
                </div>
                
                <form class="auth-form" id="login-form">
                    <div class="form-group">
                        <label for="login-email" class="form-label">
                            <i class="fas fa-envelope"></i>
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="login-email" 
                            class="form-input"
                            placeholder="tu@email.com"
                            required
                            autocomplete="email"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password" class="form-label">
                            <i class="fas fa-lock"></i>
                            Contraseña
                        </label>
                        <input 
                            type="password" 
                            id="login-password" 
                            class="form-input"
                            placeholder="Tu contraseña"
                            required
                            autocomplete="current-password"
                        >
                    </div>
                    
                    <div class="form-footer">
                        <button type="button" class="link-button" id="forgot-password-btn">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                    
                    <div class="form-error" id="login-error" role="alert" aria-live="polite"></div>
                    
                    <button type="submit" class="btn btn-primary btn-block" id="login-submit-btn">
                        <span class="btn-text">Iniciar Sesión</span>
                        <span class="btn-loader" style="display: none;">
                            <i class="fas fa-spinner fa-spin"></i>
                        </span>
                    </button>
                    
                    <div class="form-divider">
                        <span>¿No tienes cuenta?</span>
                    </div>
                    
                    <button type="button" class="btn btn-outline btn-block" id="switch-to-signup">
                        Crear Cuenta Nueva
                    </button>
                </form>
            </div>
        `;
    }

    // Get signup modal HTML
    getSignupHTML() {
        return `
            <div class="modal-overlay" aria-hidden="true"></div>
            <div class="modal-content">
                <button class="modal-close" aria-label="Cerrar modal">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="modal-header">
                    <h2 id="signup-title" class="modal-title">Crear Cuenta</h2>
                    <p class="modal-subtitle">Únete a RentHub hoy</p>
                </div>
                
                <form class="auth-form" id="signup-form">
                    <div class="form-group">
                        <label for="signup-name" class="form-label">
                            <i class="fas fa-user"></i>
                            Nombre Completo
                        </label>
                        <input 
                            type="text" 
                            id="signup-name" 
                            class="form-input"
                            placeholder="Juan Pérez"
                            required
                            autocomplete="name"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-email" class="form-label">
                            <i class="fas fa-envelope"></i>
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="signup-email" 
                            class="form-input"
                            placeholder="tu@email.com"
                            required
                            autocomplete="email"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-password" class="form-label">
                            <i class="fas fa-lock"></i>
                            Contraseña
                        </label>
                        <input 
                            type="password" 
                            id="signup-password" 
                            class="form-input"
                            placeholder="Mínimo 6 caracteres"
                            required
                            autocomplete="new-password"
                            minlength="6"
                        >
                        <small class="form-hint">Mínimo 6 caracteres</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-password-confirm" class="form-label">
                            <i class="fas fa-lock"></i>
                            Confirmar Contraseña
                        </label>
                        <input 
                            type="password" 
                            id="signup-password-confirm" 
                            class="form-input"
                            placeholder="Repite tu contraseña"
                            required
                            autocomplete="new-password"
                            minlength="6"
                        >
                    </div>
                    
                    <div class="form-error" id="signup-error" role="alert" aria-live="polite"></div>
                    
                    <button type="submit" class="btn btn-primary btn-block" id="signup-submit-btn">
                        <span class="btn-text">Crear Cuenta</span>
                        <span class="btn-loader" style="display: none;">
                            <i class="fas fa-spinner fa-spin"></i>
                        </span>
                    </button>
                    
                    <div class="form-divider">
                        <span>¿Ya tienes cuenta?</span>
                    </div>
                    
                    <button type="button" class="btn btn-outline btn-block" id="switch-to-login">
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        `;
    }

    // Setup login event listeners
    setupLoginListeners(modal) {
        // Close modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Switch to signup
        modal.querySelector('#switch-to-signup').addEventListener('click', () => {
            this.showSignupModal();
        });
        
        // Forgot password
        modal.querySelector('#forgot-password-btn').addEventListener('click', () => {
            this.showForgotPasswordPrompt();
        });
        
        // Login form submit
        modal.querySelector('#login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(modal);
        });
        
        // ESC key to close
        document.addEventListener('keydown', this.handleEscapeKey);
    }

    // Setup signup event listeners
    setupSignupListeners(modal) {
        // Close modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Switch to login
        modal.querySelector('#switch-to-login').addEventListener('click', () => {
            this.showLoginModal();
        });
        
        // Signup form submit
        modal.querySelector('#signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSignup(modal);
        });
        
        // ESC key to close
        document.addEventListener('keydown', this.handleEscapeKey);
    }

    // Handle login
    async handleLogin(modal) {
        const email = modal.querySelector('#login-email').value.trim();
        const password = modal.querySelector('#login-password').value;
        const errorDiv = modal.querySelector('#login-error');
        const submitBtn = modal.querySelector('#login-submit-btn');
        
        // Clear previous errors
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        
        // Validate inputs
        if (!SecurityUtils.validateEmail(email)) {
            this.showError(errorDiv, 'Email inválido');
            return;
        }
        
        if (!password) {
            this.showError(errorDiv, 'Por favor ingresa tu contraseña');
            return;
        }
        
        // Show loading
        this.setButtonLoading(submitBtn, true);
        
        try {
            const result = await this.firebaseService.signIn(email, password);
            
            if (result.success) {
                this.showSuccessMessage('¡Bienvenido de nuevo!');
                this.closeModal();
                
                // Reload page to update UI
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showError(errorDiv, result.error);
            }
        } catch (error) {
            this.showError(errorDiv, 'Error al iniciar sesión. Intenta de nuevo.');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    // Handle signup
    async handleSignup(modal) {
        const name = modal.querySelector('#signup-name').value.trim();
        const email = modal.querySelector('#signup-email').value.trim();
        const password = modal.querySelector('#signup-password').value;
        const passwordConfirm = modal.querySelector('#signup-password-confirm').value;
        const errorDiv = modal.querySelector('#signup-error');
        const submitBtn = modal.querySelector('#signup-submit-btn');
        
        // Clear previous errors
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        
        // Validate inputs
        if (!name || name.length < 2) {
            this.showError(errorDiv, 'Por favor ingresa tu nombre completo');
            return;
        }
        
        if (!SecurityUtils.validateEmail(email)) {
            this.showError(errorDiv, 'Email inválido');
            return;
        }
        
        const passwordValidation = SecurityUtils.validatePassword(password);
        if (!passwordValidation.valid) {
            this.showError(errorDiv, passwordValidation.message);
            return;
        }
        
        if (password !== passwordConfirm) {
            this.showError(errorDiv, 'Las contraseñas no coinciden');
            return;
        }
        
        // Show loading
        this.setButtonLoading(submitBtn, true);
        
        try {
            const result = await this.firebaseService.signUp(email, password, name);
            
            if (result.success) {
                this.showSuccessMessage('¡Cuenta creada exitosamente!');
                this.closeModal();
                
                // Reload page to update UI
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showError(errorDiv, result.error);
            }
        } catch (error) {
            this.showError(errorDiv, 'Error al crear cuenta. Intenta de nuevo.');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    // Show forgot password prompt
    async showForgotPasswordPrompt() {
        const email = prompt('Ingresa tu email para recuperar tu contraseña:');
        
        if (!email) return;
        
        if (!SecurityUtils.validateEmail(email)) {
            alert('Email inválido');
            return;
        }
        
        try {
            const result = await this.firebaseService.resetPassword(email);
            
            if (result.success) {
                alert('Email de recuperación enviado. Revisa tu bandeja de entrada.');
            } else {
                alert(result.error);
            }
        } catch (error) {
            alert('Error al enviar email de recuperación');
        }
    }

    // Show error message
    showError(errorDiv, message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    // Show success toast
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Set button loading state
    setButtonLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        
        if (isLoading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            button.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            button.disabled = false;
        }
    }

    // Handle escape key
    handleEscapeKey = (e) => {
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    // Close modal
    closeModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
            document.removeEventListener('keydown', this.handleEscapeKey);
        }
    }
}

// Create global instance
const authModal = new AuthModal();

console.log('Auth modal loaded successfully');
