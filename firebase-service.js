// firebase-service.js
// Firebase Service Layer for RentHub 2030

'use strict';

class FirebaseService {
    constructor() {
        this.initialized = false;
    }

    // Initialize Firebase service
    async initialize() {
        try {
            if (this.initialized) {
                console.log('Firebase already initialized');
                return true;
            }

            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }

            // Check if auth, db, storage are available
            if (!auth || !db || !storage) {
                throw new Error('Firebase services not initialized');
            }

            this.initialized = true;
            console.log('Firebase service initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Firebase service:', error);
            return false;
        }
    }

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    // Sign up with email and password
    async signUp(email, password, displayName) {
        try {
            // Validate inputs
            if (!SecurityUtils.validateEmail(email)) {
                throw new Error('Email inválido');
            }

            const passwordValidation = SecurityUtils.validatePassword(password);
            if (!passwordValidation.valid) {
                throw new Error(passwordValidation.message);
            }

            // Create user
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update profile with display name
            if (displayName) {
                await user.updateProfile({
                    displayName: SecurityUtils.sanitizeText(displayName, 50)
                });
            }

            // Create user document in Firestore
            await db.collection('users').doc(user.uid).set({
                email: email,
                displayName: displayName || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user',
                verified: false
            });

            console.log('User registered successfully:', user.uid);
            return { success: true, user: user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            // Validate inputs
            if (!SecurityUtils.validateEmail(email)) {
                throw new Error('Email inválido');
            }

            if (!password) {
                throw new Error('Contraseña requerida');
            }

            // Sign in
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            console.log('User signed in successfully:', user.uid);
            return { success: true, user: user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Sign out
    async signOut() {
        try {
            await auth.signOut();
            console.log('User signed out successfully');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Send password reset email
    async resetPassword(email) {
        try {
            if (!SecurityUtils.validateEmail(email)) {
                throw new Error('Email inválido');
            }

            await auth.sendPasswordResetEmail(email);
            console.log('Password reset email sent to:', email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Get current user
    getCurrentUser() {
        return auth.currentUser;
    }

    // ============================================
    // FIRESTORE METHODS - LISTINGS
    // ============================================

    // Get featured listings
    async getFeaturedListings(limit = 6) {
        try {
            const snapshot = await db.collection('listings')
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const listings = [];
            snapshot.forEach(doc => {
                listings.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`Loaded ${listings.length} featured listings`);
            return listings;
        } catch (error) {
            console.error('Error getting featured listings:', error);
            return [];
        }
    }

    // Get listing by ID
    async getListingById(listingId) {
        try {
            const doc = await db.collection('listings').doc(listingId).get();
            
            if (!doc.exists) {
                throw new Error('Listing not found');
            }

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error getting listing:', error);
            throw error;
        }
    }

    // Search listings
    async searchListings(searchParams) {
        try {
            let query = db.collection('listings').where('status', '==', 'active');

            // Apply filters
            if (searchParams.category && searchParams.category !== 'all') {
                query = query.where('category', '==', searchParams.category);
            }

            if (searchParams.location) {
                query = query.where('location', '==', searchParams.location);
            }

            if (searchParams.maxPrice) {
                const maxPrice = SecurityUtils.validateNumber(searchParams.maxPrice, 0, 10000);
                if (maxPrice) {
                    query = query.where('price', '<=', maxPrice);
                }
            }

            // Execute query
            const snapshot = await query.orderBy('createdAt', 'desc').limit(20).get();

            const listings = [];
            snapshot.forEach(doc => {
                listings.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`Search found ${listings.length} listings`);
            return listings;
        } catch (error) {
            console.error('Error searching listings:', error);
            return [];
        }
    }

    // Create new listing
    async createListing(listingData) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Debes iniciar sesión para publicar');
            }

            // Validate listing data
            if (!listingData.title || !listingData.description || !listingData.price) {
                throw new Error('Faltan campos requeridos');
            }

            // Sanitize inputs
            const sanitizedData = {
                title: SecurityUtils.sanitizeText(listingData.title, 100),
                description: SecurityUtils.sanitizeText(listingData.description, 1000),
                category: SecurityUtils.sanitizeText(listingData.category, 50),
                location: SecurityUtils.sanitizeText(listingData.location, 100),
                price: SecurityUtils.validateNumber(listingData.price, 0, 10000),
                priceType: SecurityUtils.sanitizeText(listingData.priceType || 'día', 20),
                images: listingData.images || [],
                userId: user.uid,
                userEmail: user.email,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Create listing
            const docRef = await db.collection('listings').add(sanitizedData);

            console.log('Listing created successfully:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating listing:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Update listing
    async updateListing(listingId, updates) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Debes iniciar sesión');
            }

            // Verify ownership
            const listing = await this.getListingById(listingId);
            if (listing.userId !== user.uid) {
                throw new Error('No tienes permiso para editar este anuncio');
            }

            // Sanitize updates
            const sanitizedUpdates = {};
            if (updates.title) sanitizedUpdates.title = SecurityUtils.sanitizeText(updates.title, 100);
            if (updates.description) sanitizedUpdates.description = SecurityUtils.sanitizeText(updates.description, 1000);
            if (updates.price) sanitizedUpdates.price = SecurityUtils.validateNumber(updates.price, 0, 10000);
            if (updates.location) sanitizedUpdates.location = SecurityUtils.sanitizeText(updates.location, 100);
            sanitizedUpdates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

            // Update listing
            await db.collection('listings').doc(listingId).update(sanitizedUpdates);

            console.log('Listing updated successfully:', listingId);
            return { success: true };
        } catch (error) {
            console.error('Error updating listing:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Delete listing
    async deleteListing(listingId) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Debes iniciar sesión');
            }

            // Verify ownership
            const listing = await this.getListingById(listingId);
            if (listing.userId !== user.uid) {
                throw new Error('No tienes permiso para eliminar este anuncio');
            }

            // Delete listing
            await db.collection('listings').doc(listingId).delete();

            console.log('Listing deleted successfully:', listingId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting listing:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // ============================================
    // STORAGE METHODS
    // ============================================

    // Upload image to Firebase Storage
    async uploadImage(file, path = 'listings') {
        try {
            // Validate file
            if (!SecurityUtils.validateFileType(file)) {
                throw new Error('Tipo de archivo no permitido');
            }

            if (!SecurityUtils.validateFileSize(file)) {
                throw new Error('El archivo es demasiado grande (máx. 5MB)');
            }

            // Generate unique filename
            const fileName = `${Date.now()}_${SecurityUtils.sanitizeFileName(file.name)}`;
            const storageRef = storage.ref(`${path}/${fileName}`);

            // Upload file
            const snapshot = await storageRef.put(file);
            
            // Get download URL
            const downloadURL = await snapshot.ref.getDownloadURL();

            console.log('Image uploaded successfully:', downloadURL);
            return { success: true, url: downloadURL };
        } catch (error) {
            console.error('Error uploading image:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Delete image from Firebase Storage
    async deleteImage(imageUrl) {
        try {
            const imageRef = storage.refFromURL(imageUrl);
            await imageRef.delete();
            
            console.log('Image deleted successfully');
            return { success: true };
        } catch (error) {
            console.error('Error deleting image:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // ============================================
    // USER METHODS
    // ============================================

    // Get user profile
    async getUserProfile(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            
            if (!doc.exists) {
                throw new Error('Usuario no encontrado');
            }

            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    // Update user profile
    async updateUserProfile(updates) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Debes iniciar sesión');
            }

            // Sanitize updates
            const sanitizedUpdates = {};
            if (updates.displayName) {
                sanitizedUpdates.displayName = SecurityUtils.sanitizeText(updates.displayName, 50);
            }
            if (updates.phone) {
                sanitizedUpdates.phone = SecurityUtils.sanitizeText(updates.phone, 20);
            }
            if (updates.bio) {
                sanitizedUpdates.bio = SecurityUtils.sanitizeText(updates.bio, 500);
            }
            sanitizedUpdates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

            // Update Firestore
            await db.collection('users').doc(user.uid).update(sanitizedUpdates);

            // Update Auth profile if displayName changed
            if (updates.displayName) {
                await user.updateProfile({
                    displayName: sanitizedUpdates.displayName
                });
            }

            console.log('User profile updated successfully');
            return { success: true };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // ============================================
    // ERROR HANDLING
    // ============================================

    getErrorMessage(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'Este email ya está registrado',
            'auth/invalid-email': 'Email inválido',
            'auth/weak-password': 'La contraseña es muy débil',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
            'permission-denied': 'No tienes permiso para realizar esta acción',
            'not-found': 'Recurso no encontrado',
            'already-exists': 'El recurso ya existe'
        };

        const errorCode = error.code || '';
        return errorMessages[errorCode] || error.message || 'Error desconocido';
    }
}

console.log('Firebase service loaded successfully');
