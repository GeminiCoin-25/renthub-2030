// app/layout.tsx - الهيكل العام للموقع
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import '../styles.css'; // مسار CSS - تأكد أنه صحيح

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  return (
    <html lang="es">
      <head>
        <title>RentHub - Alquila lo que necesites</title>
        <meta name="description" content="Plataforma profesional para alquilar equipos, herramientas y más" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gray-50">
        {/* الرأس */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4">
            <nav className="flex justify-between items-center h-16">
              {/* الشعار */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">RH</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">RentHub</div>
                    <div className="text-xs text-gray-500">Alquiler Profesional</div>
                  </div>
                </Link>
              </div>

              {/* روابط التنقل */}
              <div className="hidden md:flex items-center gap-6">
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
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <div className="hidden md:block text-sm text-gray-600">
                      Hola, <span className="font-medium">{user.displayName || user.email?.split('@')[0]}</span>
                    </div>
                    <Link
                      href="/publish"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                    >
                      + Publicar
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                      }}
                      className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('signup');
                        setShowAuthModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                    >
                      Registrarse
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </header>

        {/* المحتوى الرئيسي */}
        <main className="flex-grow">
          {children}
        </main>

        {/* التذييل */}
        <footer className="bg-gray-900 text-white mt-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">RH</span>
                  </div>
                  <span className="font-bold">RentHub</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Conectando personas con equipos desde 2024
                </p>
              </div>
              <div className="text-gray-400 text-sm">
                © {new Date().getFullYear()} RentHub. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </footer>

        {/* نافذة المصادقة */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </body>
    </html>
  );
}
