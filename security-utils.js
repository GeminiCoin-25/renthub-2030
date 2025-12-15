// security-utils.js
// Security and Input Validation Utilities for RentHub 2030

'use strict';

const SecurityUtils = Object.freeze({
    // Sanitize text input
    sanitizeText(text, maxLength = 100) {
        if (!text || typeof text !== 'string') return '';
        
        // Remove dangerous characters but keep basic formatting
        let sanitized = String(text)
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript:
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
        
        // Limit length
        if (maxLength && sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength) + '...';
        }
        
        return sanitized;
    },

    // Sanitize HTML to prevent XSS
    sanitizeHTML(html) {
        if (!html) return '';
        
        const temp = document.createElement('div');
        temp.textContent = String(html);
        return temp.innerHTML;
    },

    // Validate URL
    validateURL(url) {
        if (!url || typeof url !== 'string') return false;
        
        try {
            const urlObj = new URL(url);
            const allowedProtocols = ['https:', 'http:', 'data:'];
            const allowedHosts = [
                'unsplash.com',
                'firebasestorage.googleapis.com',
                'cloudinary.com',
                'localhost'
            ];
            
            return allowedProtocols.includes(urlObj.protocol) && 
                   (allowedHosts.some(host => urlObj.hostname.includes(host)) || 
                    urlObj.protocol === 'data:');
        } catch {
            return false;
        }
    },

    // Sanitize URL with fallback
    sanitizeURL(url, fallback = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80') {
        return this.validateURL(url) ? url : fallback;
    },

    // Validate number within range
    validateNumber(num, min = 0, max = 10000) {
        if (num === '' || num === null || num === undefined) return null;
        
        const parsed = parseFloat(num);
        if (isNaN(parsed)) return null;
        
        return Math.max(min, Math.min(max, parsed));
    },

    // Rate limiter to prevent abuse
    rateLimiter: {
        requests: new Map(),
        
        isAllowed(key, maxRequests = 10, timeWindow = 60000) {
            const now = Date.now();
            
            if (!this.requests.has(key)) {
                this.requests.set(key, []);
            }
            
            const timestamps = this.requests.get(key);
            const validTimestamps = timestamps.filter(time => now - time < timeWindow);
            
            if (validTimestamps.length >= maxRequests) {
                return false;
            }
            
            validTimestamps.push(now);
            this.requests.set(key, validTimestamps);
            return true;
        },
        
        reset(key) {
            this.requests.delete(key);
        }
    },

    // Validate email format
    validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    },

    // Validate password strength
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, message: 'La contraseña es requerida' };
        }
        
        if (password.length < 6) {
            return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
        }
        
        if (password.length > 128) {
            return { valid: false, message: 'La contraseña es demasiado larga' };
        }
        
        return { valid: true, message: 'Contraseña válida' };
    },

    // Sanitize file name
    sanitizeFileName(fileName) {
        if (!fileName || typeof fileName !== 'string') return '';
        
        return fileName
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .substring(0, 255);
    },

    // Validate file type
    validateFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
        if (!file || !file.type) return false;
        return allowedTypes.includes(file.type);
    },

    // Validate file size (default 5MB)
    validateFileSize(file, maxSizeBytes = 5 * 1024 * 1024) {
        if (!file || !file.size) return false;
        return file.size <= maxSizeBytes;
    }
});

console.log('Security utilities loaded successfully');
