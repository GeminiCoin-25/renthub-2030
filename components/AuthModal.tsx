'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon, EnvelopeIcon, LockIcon, UserIcon } from '@heroicons/react/24/outline';

type AuthMode = 'login' | 'signup' | 'forgot-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // إغلاق عند الضغط على زر ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // لا تعرض إذا لم يكن مفتوحاً
  if (!isOpen) return null;

  // التحقق من صحة البيانات
  const validateForm = () => {
    setError('');
    
    if (mode === 'login') {
      if (!formData.email || !formData.password) {
        setError('Por favor completa todos los campos');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Email inválido');
        return false;
      }
    }
    
    if (mode === 'signup') {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Por favor completa todos los campos');
        return false;
      }
      if (formData.name.length < 2) {
        setError('El nombre debe tener al menos 2 caracteres');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Email inválido');
        return false;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return false;
      }
    }
    
    if (mode === 'forgot-password') {
      if (!formData.email) {
        setError('Por favor ingresa tu email');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Email inválido');
        return false;
      }
    }
    
    return true;
  };

  // معالجة إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      if (mode === 'login') {
        await signIn(formData.email, formData.password);
        onClose();
      } else if (mode === 'signup') {
        await signUp(formData.email, formData.password, formData.name);
        onClose();
      } else if (mode === 'forgot-password') {
        await resetPassword(formData.email);
        setError('Email de recuperación enviado. Revisa tu bandeja de entrada.');
        setTimeout(() => {
          setMode('login');
          setFormData(prev => ({ ...prev, email: '' }));
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* الخلفية */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* النافذة */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          
          {/* زر الإغلاق */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          
          {/* العنوان */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'login' && 'Iniciar Sesión'}
              {mode === 'signup' && 'Crear Cuenta'}
              {mode === 'forgot-password' && 'Recuperar Contraseña'}
            </h2>
            <p className="text-gray-600">
              {mode === 'login' && 'Accede a tu cuenta de RentHub'}
              {mode === 'signup' && 'Únete a RentHub hoy'}
              {mode === 'forgot-password' && 'Recupera tu contraseña'}
            </p>
          </div>
          
          {/* رسالة الخطأ */}
          {error && (
            <div className="mx-8 mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {/* النموذج */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
            
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-2" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                  disabled={loading}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <EnvelopeIcon className="h-4 w-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>
            
            {(mode === 'login' || mode === 'signup') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <LockIcon className="h-4 w-4 inline mr-2" />
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  disabled={loading}
                />
              </div>
            )}
            
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <LockIcon className="h-4 w-4 inline mr-2" />
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Repite tu contraseña"
                  disabled={loading}
                />
              </div>
            )}
            
            {/* رابط نسيت كلمة المرور */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  disabled={loading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
            
            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                <span>
                  {mode === 'login' && 'Iniciar Sesión'}
                  {mode === 'signup' && 'Crear Cuenta'}
                  {mode === 'forgot-password' && 'Enviar Email'}
                </span>
              )}
            </button>
            
            {/* تغيير النمط */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                {mode === 'login' && '¿No tienes cuenta? '}
                {mode === 'signup' && '¿Ya tienes cuenta? '}
                {mode === 'forgot-password' && '¿Recordaste tu contraseña? '}
                
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'login') setMode('signup');
                    else if (mode === 'signup' || mode === 'forgot-password') setMode('login');
                  }}
                  className="text-blue-600 font-semibold hover:text-blue-800 ml-1"
                  disabled={loading}
                >
                  {mode === 'login' && 'Crear Cuenta'}
                  {(mode === 'signup' || mode === 'forgot-password') && 'Iniciar Sesión'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
