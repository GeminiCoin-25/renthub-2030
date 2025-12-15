// app/layout.tsx - الهيكل العام للموقع مع دعم المصادقة
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import '../styles/global.css'; // تأكد من المسار الصحيح

// مكونات التنقل
function Navigation() {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* الشعار */}
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-700 flex items-center">
                <span className="mr-2">🏠</span>
                RentHub
              </Link>
              <span className="ml-2 text-sm text-gray-600 hidden md:inline">
                Alquiler Profesional
              </span>
            </div>

            {/* روابط التنقل */}
            <div className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                Inicio
              </Link>
              <Link href="/listings" className="text-gray-700 hover:text-blue-600 font-medium">
                Productos
              </Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">
                Cómo funciona
              </Link>
              <Link href="/publish" className="text-gray-700 hover:text-blue-600 font-medium">
                Publicar
              </Link>
            </div>

            {/* أزرار المستخدم */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700 hidden
