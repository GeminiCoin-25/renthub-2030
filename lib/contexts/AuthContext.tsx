// contexts/AuthContext.tsx - إدارة المصادقة
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('يجب استخدام useAuth داخل AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let message = 'خطأ في تسجيل الدخول';
      
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'بريد إلكتروني غير صالح';
          break;
        case 'auth/user-disabled':
          message = 'الحساب معطل';
          break;
        case 'auth/user-not-found':
          message = 'المستخدم غير موجود';
          break;
        case 'auth/wrong-password':
          message = 'كلمة مرور خاطئة';
          break;
        case 'auth/too-many-requests':
          message = 'محاولات كثيرة. حاول لاحقاً';
          break;
        default:
          message = error.message || 'خطأ غير معروف';
      }
      
      throw new Error(message);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      if (password.length < 6) {
        throw new Error('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (displayName && user) {
        console.log('تم إنشاء مستخدم بالاسم:', displayName);
      }

      return user;
    } catch (error: any) {
      let message = 'خطأ في إنشاء الحساب';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'هذا البريد الإلكتروني مسجل بالفعل';
          break;
        case 'auth/invalid-email':
          message = 'بريد إلكتروني غير صالح';
          break;
        case 'auth/weak-password':
          message = 'كلمة مرور ضعيفة';
          break;
        case 'auth/operation-not-allowed':
          message = 'عملية غير مسموحة';
          break;
        default:
          message = error.message || 'خطأ غير معروف';
      }
      
      throw new Error(message);
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new Error('خطأ في تسجيل الخروج: ' + error.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      let message = 'خطأ في إرسال بريد الاستعادة';
      
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'بريد إلكتروني غير صالح';
          break;
        case 'auth/user-not-found':
          message = 'المستخدم غير موجود';
          break;
        default:
          message = error.message || 'خطأ غير معروف';
      }
      
      throw new Error(message);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut: signOutUser,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
