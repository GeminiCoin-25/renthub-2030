'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Form data type definition
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

// Spanish categories
const CATEGORIES = [
  'Electrónica',
  'Herramientas',
  'Equipamiento Deportivo',
  'Ropa y Accesorios',
  'Muebles',
  'Equipamiento para Eventos',
  'Cámaras y Fotografía',
  'Instrumentos Musicales',
  'Vehículos',
  'Otros'
];

export default function PublishPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // UI control states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  
  // Form data state
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

  // Check user authentication
  useEffect(() => {
    if (!user) {
      console.log('⚠️ Usuario no autenticado, redirigiendo a login...');
      router.push('/login');
    } else {
      console.log('✅ Usuario autenticado:', user.email);
    }
  }, [user, router]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 Usuario seleccionando imágenes...');
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      console.log('⚠️ No se seleccionaron archivos');
      return;
    }

    const fileArray = Array.from(files);
    console.log(`📂 ${fileArray.length} archivos seleccionados`);
    
    // Check number of images
    if (fileArray.length > 5) {
      setError('Puedes subir máximo 5 imágenes');
      console.error('❌ Demasiadas imágenes:', fileArray.length);
      return;
    }

    // Check file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = fileArray.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      setError('El tamaño de cada imagen debe ser menor a 5MB');
      console.error('❌ Archivos muy grandes:', invalidFiles);
      return;
    }

    // Check file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidTypes = fileArray.filter(file => !validTypes.includes(file.type));
    
    if (invalidTypes.length > 0) {
      setError('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)');
      console.error('❌ Tipos de archivo inválidos:', invalidTypes);
      return;
    }

    // Save images to state
    setFormData(prev => ({ ...prev, images: fileArray }));
    
    // Create image previews
    const previews = fileArray.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
    setError('');
    
    console.log('✅ Imágenes seleccionadas correctamente:', fileArray.length);
  };

  // Remove image from list
  const removeImage = (index: number) => {
    console.log(`🗑️ Eliminando imagen ${index + 1}`);
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    
    console.log('✅ Imagen eliminada');
  };

  // Upload images to Firebase Storage
  const uploadImages = async (images: File[]): Promise<string[]> => {
    console.log('🚀 Iniciando subida de imágenes a Firebase Storage...');
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileName = `${timestamp}_${randomString}_${image.name.replace(/\s/g, '_')}`;
        const storagePath = `listings/${user!.uid}/${fileName}`;
        
        console.log(`📤 Subiendo imagen ${i + 1}/${images.length}: ${fileName}`);
        
        // Create Storage reference
        const imageRef = ref(storage, storagePath);
        
        // Upload image
        const uploadResult = await uploadBytes(imageRef, image);
        console.log(`✅ Imagen ${i + 1} subida al Storage`);
        
        // Get download URL
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        uploadedUrls.push(downloadUrl);
        
        // Update progress bar
        const progress = Math.round(((i + 1) / images.length) * 50); // 50% for images
        setUploadProgress(progress);
        
        console.log(`✅ URL de imagen ${i + 1}:`, downloadUrl);
      }
      
      console.log('✅ Todas las imágenes subidas exitosamente');
      return uploadedUrls;
      
    } catch (err: any) {
      console.error('❌ Error al subir imágenes:', err);
      throw new Error(`Error al subir imágenes: ${err.message}`);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('='.repeat(60));
    console.log('🎯 INICIO DE PUBLICACIÓN DE ANUNCIO');
    console.log('='.repeat(60));
    
    // Check authentication
    if (!user) {
      const errorMsg = 'Debes iniciar sesión primero';
      setError(errorMsg);
      console.error('❌', errorMsg);
      return;
    }
    
    console.log('✅ Usuario:', user.email, '| UID:', user.uid);

    // === Data validation ===
    console.log('🔍 Validando datos del formulario...');
    
    // Check title
    if (!formData.title || !formData.title.trim()) {
      const errorMsg = 'Por favor ingresa un título para el anuncio';
      setError(errorMsg);
      console.error('❌', errorMsg);
      return;
    }
    
    // Check description
    if (!formData.description || !formData.description.trim()) {
      const errorMsg = 'Por favor ingresa una descripción';
      setError(errorMsg);
      console.error('❌', errorMsg);
      return;
    }

    // Check category
    if (!formData.category) {
      const errorMsg = 'Por favor selecciona una categoría';
      setError(errorMsg);
      console.error('❌', errorMsg);
      return;
    }

    // Check price
    const pricePerDay = parseFloat(formData.pricePerDay);
    if (!formData.pricePerDay || isNaN(pricePerDay) || pricePerDay <= 0) {
      const errorMsg = 'Por favor ingresa un precio válido por día';
      setError(errorMsg);
      console.error('❌', errorMsg);
      return;
    }
    
    // Check location
    if (!formData.location || !formData.location.trim()) {
      const errorMsg = 'Por favor ingresa una ubicación';
      setError(errorMsg);
      console.error('❌', errorMsg);
      return;
    }

    // Check images
    if (!formData.images || formData.images.length === 0) {
      const errorMsg = 'Por favor sube al menos una imagen';
      setError(errorMsg);
      console.error('❌', errorMsg);
      return;
    }

    console.log('✅ Todos los datos son válidos');
    console.log('📝 Datos del formulario:', {
      title: formData.title,
      category: formData.category,
      pricePerDay: pricePerDay,
      location: formData.location,
      images: formData.images.length
    });

    // Start publishing process
    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // === STEP 1: Upload images ===
      console.log('📸 PASO 1: Subiendo imágenes...');
      const uploadedUrls = await uploadImages(formData.images);
      console.log(`✅ ${uploadedUrls.length} imágenes subidas exitosamente`);
      
      setUploadProgress(60);

      // === STEP 2: Get user data ===
      console.log('👤 PASO 2: Obteniendo datos del usuario...');
      let userData = null;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        userData = userDoc.exists() ? userDoc.data() : null;
        console.log('✅ Datos del usuario obtenidos:', userData?.name || 'Sin nombre');
      } catch (err) {
        console.warn('⚠️ No se pudo obtener datos del usuario, continuando sin ellos');
      }
      
      setUploadProgress(70);

      // === STEP 3: Prepare listing data ===
      console.log('📦 PASO 3: Preparando datos del anuncio...');
      
      const listingData = {
        // Basic information
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        
        // Pricing
        pricing: {
          perDay: pricePerDay,
          perWeek: formData.pricePerWeek ? parseFloat(formData.pricePerWeek) : null,
          perMonth: formData.pricePerMonth ? parseFloat(formData.pricePerMonth) : null
        },
        
        // Images
        images: uploadedUrls,
        
        // Owner information
        owner: {
          uid: user.uid,
          name: userData?.name || user.displayName || 'Usuario',
          email: user.email || '',
          phone: userData?.phone || null,
          photoURL: user.photoURL || null
        },
        
        // Status and statistics
        status: 'active',
        available: true,
        views: 0,
        favorites: 0,
        bookings: 0,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Datos preparados para Firestore');
      setUploadProgress(80);

      // === STEP 4: Save to Firestore ===
      console.log('💾 PASO 4: Guardando en Firestore...');
      const listingsRef = collection(db, 'listings');
      const docRef = await addDoc(listingsRef, listingData);
      
      console.log('✅ Documento creado con ID:', docRef.id);
      setUploadProgress(100);

      // === Success ===
      console.log('='.repeat(60));
      console.log('🎉 ¡PUBLICACIÓN EXITOSA!');
      console.log('='.repeat(60));
      
      setSuccess('¡Anuncio publicado con éxito! 🎉 Redirigiendo...');
      
      // Reset form
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
      setUploadProgress(0);

      // Navigate to listing page
      setTimeout(() => {
        console.log('➡️ Redirigiendo a /listing/' + docRef.id);
        router.push(`/listing/${docRef.id}`);
      }, 2000);

    } catch (err: any) {
      console.error('='.repeat(60));
      console.error('❌ ERROR EN LA PUBLICACIÓN');
      console.error('='.repeat(60));
      console.error('Tipo de error:', err.name);
      console.error('Mensaje:', err.message);
      console.error('Stack:', err.stack);
      
      // Detailed error messages
      let errorMessage = 'Error al publicar el anuncio';
      
      if (err.code === 'storage/unauthorized') {
        errorMessage = 'No tienes permiso para subir imágenes. Verifica tu cuenta.';
      } else if (err.code === 'storage/canceled') {
        errorMessage = 'Subida de imágenes cancelada';
      } else if (err.code === 'storage/unknown') {
        errorMessage = 'Error desconocido en Firebase Storage';
      } else if (err.code === 'permission-denied') {
        errorMessage = 'Permiso denegado en Firestore. Verifica las reglas de seguridad.';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
      setUploadProgress(0);
      
    } finally {
      setLoading(false);
      console.log('🏁 Proceso finalizado');
    }
  };

  // Loading screen if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl text-white">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Main interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          
          {/* Header */}
          <h1 className="text-4xl font-bold text-white mb-2 text-center">
            Publicar Nuevo Anuncio
          </h1>
          <p className="text-white/70 text-center mb-8">
            Completa el formulario para publicar tu artículo en alquiler
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-200 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold mb-1">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border-2 border-green-500 rounded-xl text-green-200 flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <p className="font-semibold mb-1">¡Éxito!</p>
                <p>{success}</p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {loading && uploadProgress > 0 && (
            <div className="mb-6 p-4 bg-blue-500/20 border-2 border-blue-500 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">Subiendo anuncio...</span>
                <span className="text-white font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-white mb-2 font-semibold text-lg">
                Título del Anuncio <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                placeholder="Ej: Cámara Canon EOS R6 profesional"
                maxLength={100}
                disabled={loading}
              />
              <p className="text-white/50 text-sm mt-1">
                {formData.title.length}/100 caracteres
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white mb-2 font-semibold text-lg">
                Descripción <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all min-h-32 resize-none"
                placeholder="Describe tu artículo en detalle: estado, características, accesorios incluidos..."
                maxLength={1000}
                disabled={loading}
              />
              <p className="text-white/50 text-sm mt-1">
                {formData.description.length}/1000 caracteres
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-white mb-2 font-semibold text-lg">
                Categoría <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all cursor-pointer"
                disabled={loading}
              >
                <option value="" className="bg-gray-900">Selecciona una categoría</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-gray-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Prices */}
            <div>
              <label className="block text-white mb-2 font-semibold text-lg">
                Precios de Alquiler
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Daily price */}
                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Por Día (€) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerDay: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    placeholder="15.00"
                    disabled={loading}
                  />
                </div>

                {/* Weekly price */}
                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Por Semana (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerWeek}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerWeek: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    placeholder="80.00"
                    disabled={loading}
                  />
                </div>

                {/* Monthly price */}
                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Por Mes (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerMonth}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerMonth: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    placeholder="250.00"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-white mb-2 font-semibold text-lg">
                Ubicación <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                placeholder="Ej: Madrid Centro, Barcelona Eixample"
                maxLength={100}
                disabled={loading}
              />
            </div>

            {/* Upload images */}
            <div>
              <label className="block text-white mb-2 font-semibold text-lg">
                Imágenes (1-5 fotos) <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white 
                  file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 
                  file:text-sm file:font-semibold file:bg-gradient-to-r file:from-cyan-500 file:to-blue-500 
                  file:text-white hover:file:from-cyan-600 hover:file:to-blue-600 
                  file:transition-all file:cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-white/50 text-sm mt-2">
                Formatos: JPG, PNG, WEBP, GIF • Tamaño máximo: 5MB por imagen
              </p>
              
              {/* Image previews */}
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-white/5 border-2 border-white/20">
                        <img
                          src={preview}
                          alt={`Vista previa ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={loading}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 
                          flex items-center justify-center font-bold
                          opacity-0 group-hover:opacity-100 transition-opacity
                          hover:bg-red-600 hover:scale-110 transform
                          disabled:opacity-50 disabled:cursor-not-allowed
                          shadow-lg"
                        title="Eliminar imagen"
                      >
                        ✕
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl 
                font-bold text-lg hover:from-cyan-600 hover:to-blue-600 
                transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                shadow-xl hover:shadow-cyan-500/50 hover:scale-[1.02] transform
                flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none" 
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                    />
                  </svg>
                  <span>Publicando anuncio...</span>
                </>
              ) : (
                <>
                  <span>📢</span>
                  <span>Publicar Anuncio</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
