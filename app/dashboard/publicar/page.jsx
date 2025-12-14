'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

interface FormData {
  title: string;
  description: string;
  category: string;
  pricePerDay: string;
  pricePerWeek: string;
  pricePerMonth: string;
  location: string;
  images: File[];
}

const CATEGORIES = [
  'Electrónica',
  'Herramientas',
  'Equipamiento Deportivo',
  'Ropa y Accesorios',
  'Muebles',
  'Equipamiento para Eventos',
  'Cámaras y Fotografía',
  'Instrumentos Musicales',
  'Otros'
];

export default function PublishPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    pricePerDay: '',
    pricePerWeek: '',
    pricePerMonth: '',
    location: '',
    images: []
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Verificar número de imágenes
    if (fileArray.length > 5) {
      setError('Puedes subir máximo 5 imágenes');
      return;
    }

    // Verificar tamaño de cada imagen
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = fileArray.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      setError('El tamaño de cada imagen debe ser menor a 5MB');
      return;
    }

    setFormData(prev => ({ ...prev, images: fileArray }));
    
    // Crear vista previa de las imágenes
    const previews = fileArray.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
    setError('');
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    TEST
    alert('🔥 BOTÓN FUNCIONA!');
    console.log('🔥 TEST handleSubmit');
    console.log('User:', user);
    console.log('FormData:', formData);
    if (!user) {
      setError('Debes iniciar sesión primero');
      return;
    }

    // Validación de datos
    if (!formData.title.trim()) {
      setError('Por favor ingresa un título para el anuncio');
      return;
    }

    if (!formData.category) {
      setError('Por favor selecciona una categoría');
      return;
    }

    if (!formData.pricePerDay || parseFloat(formData.pricePerDay) <= 0) {
      setError('Por favor ingresa el precio por día');
      return;
    }

    if (formData.images.length === 0) {
      setError('Por favor sube al menos una imagen');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🚀 Iniciando proceso de publicación...');

      // 1. Subir imágenes a Firebase Storage
      console.log('📸 Subiendo imágenes...', formData.images.length);
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < formData.images.length; i++) {
        const image = formData.images[i];
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${randomString}_${image.name}`;
        const imageRef = ref(storage, `listings/${user.uid}/${fileName}`);
        
        console.log(`📤 Subiendo imagen ${i + 1}/${formData.images.length}:`, fileName);
        
        await uploadBytes(imageRef, image);
        const downloadUrl = await getDownloadURL(imageRef);
        uploadedUrls.push(downloadUrl);
        
        console.log(`✅ Imagen ${i + 1} subida:`, downloadUrl);
      }

      console.log('✅ Todas las imágenes subidas:', uploadedUrls);

      // 2. Obtener información del usuario
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      // 3. Crear documento del anuncio
      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        pricing: {
          perDay: parseFloat(formData.pricePerDay),
          perWeek: formData.pricePerWeek ? parseFloat(formData.pricePerWeek) : null,
          perMonth: formData.pricePerMonth ? parseFloat(formData.pricePerMonth) : null
        },
        location: formData.location.trim(),
        images: uploadedUrls,
        owner: {
          uid: user.uid,
          name: userData?.name || user.displayName || 'Usuario',
          email: user.email,
          phone: userData?.phone || null
        },
        status: 'active',
        available: true,
        views: 0,
        favorites: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Guardando datos en Firestore:', listingData);

      const docRef = await addDoc(collection(db, 'listings'), listingData);
      
      console.log('✅ ¡Anuncio creado exitosamente! ID:', docRef.id);

      setSuccess('¡Anuncio publicado con éxito! 🎉');
      
      // Resetear formulario
      setFormData({
        title: '',
        description: '',
        category: '',
        pricePerDay: '',
        pricePerWeek: '',
        pricePerMonth: '',
        location: '',
        images: []
      });
      setImagePreview([]);

      // Redirigir a la página del anuncio después de 2 segundos
      setTimeout(() => {
        router.push(`/listing/${docRef.id}`);
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error al publicar:', err);
      setError(`Error al publicar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Publicar Nuevo Anuncio</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-white mb-2 font-semibold">Título del Anuncio *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Ej: Cámara profesional en alquiler"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-white mb-2 font-semibold">Descripción *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-32"
                placeholder="Descripción detallada del producto..."
                required
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-white mb-2 font-semibold">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              >
                <option value="" className="bg-gray-800">Selecciona una categoría</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
                ))}
              </select>
            </div>

            {/* Precios */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white mb-2 font-semibold">Precio por Día (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerDay: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2 font-semibold">Precio por Semana (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerWeek}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerWeek: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-white mb-2 font-semibold">Precio por Mes (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerMonth}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerMonth: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-white mb-2 font-semibold">Ubicación *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Ciudad, Barrio"
                required
              />
            </div>

            {/* Subir Imágenes */}
            <div>
              <label className="block text-white mb-2 font-semibold">Imágenes (hasta 5) *</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
              />
              
              {/* Vista previa de imágenes */}
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={preview}
                        alt={`Vista previa ${index + 1}`}
                        width={150}
                        height={150}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Publicar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Publicando...
                </span>
              ) : (
                'Publicar Anuncio'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
