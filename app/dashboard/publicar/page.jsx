'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function PublicarAnuncio() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    phone: '',
    city: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserPlan(userDoc.data());
        }
      } else {
        router.push('/auth');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.category || !formData.price || !formData.description || !formData.phone) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    const planLimits = {
      free: 3,
      silver: 10,
      gold: 50,
      platinum: 9999
    };

    const currentPlan = userPlan?.plan || 'free';
    const usedAds = userPlan?.adsUsed || 0;
    const limit = planLimits[currentPlan];

    if (usedAds >= limit) {
      setError(`Has alcanzado el límite de anuncios en el plan ${currentPlan.toUpperCase()}. Por favor actualiza tu plan.`);
      return;
    }

    setUploading(true);

    try {
      const listingData = {
        ...formData,
        imageUrl: null,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Usuario',
        plan: currentPlan,
        status: 'active',
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'listings'), listingData);

      await updateDoc(doc(db, 'users', user.uid), {
        adsUsed: increment(1)
      });

      setSuccess('✅ ¡Anuncio publicado con éxito!');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error:', err);
      setError('Ocurrió un error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-900 flex items-center justify-center">
        <div className="text-emerald-400 text-2xl animate-pulse">⏳ Cargando...</div>
      </div>
    );
  }

  const currentPlan = userPlan?.plan || 'free';
  const usedAds = userPlan?.adsUsed || 0;
  const planLimits = { free: 3, silver: 10, gold: 50, platinum: 9999 };
  const remainingAds = planLimits[currentPlan] - usedAds;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
            🚀 Publicar Nuevo Anuncio
          </h1>
          <p className="text-gray-400">
            Anuncios restantes: <span className="text-emerald-400 font-bold">{remainingAds}</span> de {planLimits[currentPlan]}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-400">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500 rounded-xl text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-emerald-500/20 shadow-2xl">
            
            <div className="mb-6">
              <label className="block text-emerald-400 font-semibold mb-2">
                Título del Anuncio *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej: Mercedes Clase A en alquiler"
                className="w-full px-4 py-3 bg-gray-900/50 border border-emerald-500/30 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-emerald-400 font-semibold mb-2">
                Categoría *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900/50 border border-emerald-500/30 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                required
              >
                <option value="">Selecciona categoría</option>
                <option value="vehicles">🚗 Coches</option>
                <option value="equipment">🔧 Equipamiento</option>
                <option value="events">🎉 Eventos</option>
                <option value="electronics">💻 Electrónica</option>
                <option value="tools">🛠️ Herramientas</option>
                <option value="other">📦 Otros</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-emerald-400 font-semibold mb-2">
                Precio (€/día) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="90"
                className="w-full px-4 py-3 bg-gray-900/50 border border-emerald-500/30 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-emerald-400 font-semibold mb-2">
                Número de Teléfono *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="666666666"
                className="w-full px-4 py-3 bg-gray-900/50 border border-emerald-500/30 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-emerald-400 font-semibold mb-2">
                Ciudad *
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-900/50 border border-emerald-500/30 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                required
              >
                <option value="">Selecciona ciudad</option>
                <option value="Madrid">Madrid</option>
                <option value="Barcelona">Barcelona</option>
                <option value="Valencia">Valencia</option>
                <option value="Sevilla">Sevilla</option>
                <option value="Zaragoza">Zaragoza</option>
                <option value="Málaga">Málaga</option>
                <option value="Murcia">Murcia</option>
                <option value="Palma">Palma de Mallorca</option>
                <option value="Bilbao">Bilbao</option>
                <option value="Alicante">Alicante</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-emerald-400 font-semibold mb-2">
                Descripción detallada *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Escribe una descripción detallada del producto..."
                rows="5"
                maxLength="500"
                className="w-full px-4 py-3 bg-gray-900/50 border border-emerald-500/30 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition resize-none"
                required
              />
              <p className="text-gray-500 text-sm mt-1">{formData.description.length}/500 caracteres</p>
            </div>

          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-6 py-4 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl transition font-semibold"
            >
              ← Volver
            </button>
            
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publicando...
                </>
              ) : (
                <>
                  🚀 Publicar Ahora
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
