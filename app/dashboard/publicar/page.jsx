'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  uploadBytesResumable 
} from 'firebase/storage';

// Definición de tipos de datos
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

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface ListingData {
  title: string;
  description: string;
  category: string;
  location: string;
  pricing: {
    perDay: number;
    perWeek: number | null;
    perMonth: number | null;
  };
  images: string[];
  owner: {
    uid: string;
    name: string;
    email: string | null;
    phone: string | null;
    photoURL: string | null;
  };
  status: string;
  available: boolean;
  views: number;
  favorites: number;
  bookings: number;
  createdAt: any;
  updatedAt: any;
}

// Categorías en español
const CATEGORIAS = [
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

// Constantes
const MAX_IMAGENES = 5;
const MAX_TAMANO_IMAGEN = 5 * 1024 * 1024; // 5MB
const MAX_REINTENTOS = 3;
const FORMATOS_VALIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function PaginaPublicar() {
  const { user, loading: cargandoAuth } = useAuth();
  const router = useRouter();
  
  // Estados de control de UI
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [progresoSubida, setProgresoSubida] = useState(0);
  const [vistaPreviaImagenes, setVistaPreviaImagenes] = useState<string[]>([]);
  
  // Estado de datos del formulario
  const [datosFormulario, setDatosFormulario] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    pricePerDay: '',
    pricePerWeek: '',
    pricePerMonth: '',
    location: '',
    images: []
  });

  // Verificar autenticación
  useEffect(() => {
    if (!cargandoAuth && !user) {
      console.log('⚠️ Usuario no autenticado, redirigiendo a login...');
      router.push('/login');
    }
  }, [user, cargandoAuth, router]);

  // Limpiar memoria de imágenes cuando se desmonte el componente
  useEffect(() => {
    return () => {
      vistaPreviaImagenes.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [vistaPreviaImagenes]);

  // ===== Funciones de validación =====
  
  const validarImagenes = useCallback((archivos: File[]): ValidationResult => {
    if (archivos.length === 0) {
      return { 
        valid: false, 
        error: 'Por favor sube al menos una imagen' 
      };
    }

    if (archivos.length > MAX_IMAGENES) {
      return { 
        valid: false, 
        error: `Puedes subir máximo ${MAX_IMAGENES} imágenes` 
      };
    }

    for (const archivo of archivos) {
      if (archivo.size > MAX_TAMANO_IMAGEN) {
        return { 
          valid: false, 
          error: `La imagen "${archivo.name}" supera el tamaño máximo de 5MB` 
        };
      }

      if (!FORMATOS_VALIDOS.includes(archivo.type)) {
        return { 
          valid: false, 
          error: `El formato de "${archivo.name}" no es válido. Usa JPG, PNG o WEBP` 
        };
      }
    }

    return { valid: true };
  }, []);

  const validarDatosFormulario = useCallback((): ValidationResult => {
    const tituloLimpiado = datosFormulario.title.trim();
    const descripcionLimpiada = datosFormulario.description.trim();
    const ubicacionLimpiada = datosFormulario.location.trim();

    if (!tituloLimpiado) {
      return { valid: false, error: 'Por favor ingresa un título para el anuncio' };
    }

    if (tituloLimpiado.length < 5) {
      return { valid: false, error: 'El título debe tener al menos 5 caracteres' };
    }

    if (!descripcionLimpiada) {
      return { valid: false, error: 'Por favor ingresa una descripción' };
    }

    if (descripcionLimpiada.length < 20) {
      return { valid: false, error: 'La descripción debe tener al menos 20 caracteres' };
    }

    if (!datosFormulario.category) {
      return { valid: false, error: 'Por favor selecciona una categoría' };
    }

    const precioPorDia = parseFloat(datosFormulario.pricePerDay);
    if (!datosFormulario.pricePerDay || isNaN(precioPorDia) || precioPorDia <= 0) {
      return { valid: false, error: 'Por favor ingresa un precio válido por día (mayor que 0)' };
    }

    if (!ubicacionLimpiada) {
      return { valid: false, error: 'Por favor ingresa una ubicación' };
    }

    if (datosFormulario.images.length === 0) {
      return { valid: false, error: 'Por favor sube al menos una imagen' };
    }

    return { valid: true };
  }, [datosFormulario]);

  // ===== Manejo de imágenes =====

  const manejarCambioImagen = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = e.target.files;
    
    if (!archivos || archivos.length === 0) {
      return;
    }

    const arrayArchivos = Array.from(archivos);
    
    // Validar imágenes
    const validacion = validarImagenes(arrayArchivos);
    if (!validacion.valid) {
      setError(validacion.error!);
      e.target.value = ''; // Limpiar el input
      return;
    }

    // Combinar imágenes antiguas y nuevas sin exceder el máximo
    const todasImagenes = [...datosFormulario.images, ...arrayArchivos].slice(0, MAX_IMAGENES);
    
    // Actualizar estado de imágenes
    setDatosFormulario(prev => ({ ...prev, images: todasImagenes }));
    
    // Crear vistas previas solo para las imágenes nuevas
    const nuevasVistasPrevias = arrayArchivos.slice(0, MAX_IMAGENES - datosFormulario.images.length)
      .map(archivo => URL.createObjectURL(archivo));
    
    setVistaPreviaImagenes(prev => [...prev, ...nuevasVistasPrevias].slice(0, MAX_IMAGENES));
    setError('');
  }, [datosFormulario.images, validarImagenes]);

  const eliminarImagen = useCallback((indice: number) => {
    // Liberar memoria de la imagen
    if (vistaPreviaImagenes[indice].startsWith('blob:')) {
      URL.revokeObjectURL(vistaPreviaImagenes[indice]);
    }

    setDatosFormulario(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indice)
    }));
    
    setVistaPreviaImagenes(prev => prev.filter((_, i) => i !== indice));
  }, [vistaPreviaImagenes]);

  // ===== Funciones de Firebase =====

  const subirImagenConReintento = useCallback(async (
    imagen: File, 
    indice: number, 
    totalImagenes: number,
    reintentos = 0
  ): Promise<string> => {
    try {
      const timestamp = Date.now();
      const cadenaAleatoria = Math.random().toString(36).substring(2, 15);
      const nombreArchivo = `${timestamp}_${cadenaAleatoria}_${imagen.name.replace(/[^a-z0-9.]/gi, '_')}`;
      const rutaStorage = `listings/${user!.uid}/${nombreArchivo}`;
      
      console.log(`📤 Subiendo imagen ${indice + 1}/${totalImagenes}`);
      
      const referenciaImagen = ref(storage, rutaStorage);
      const tareaSubida = uploadBytesResumable(referenciaImagen, imagen);
      
      // Seguir progreso para una sola imagen
      tareaSubida.on('state_changed', 
        (snapshot) => {
          const progreso = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const progresoTotal = (indice / totalImagenes) * 50 + (progreso / 100) * (50 / totalImagenes);
          setProgresoSubida(Math.round(progresoTotal));
        }
      );
      
      await tareaSubida;
      const urlDescarga = await getDownloadURL(tareaSubida.snapshot.ref);
      
      console.log(`✅ Imagen ${indice + 1} subida exitosamente`);
      return urlDescarga;
      
    } catch (err: any) {
      console.error(`❌ Error al subir imagen ${indice + 1}:`, err);
      
      if (reintentos < MAX_REINTENTOS) {
        console.log(`🔄 Reintentando... (${reintentos + 1}/${MAX_REINTENTOS})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (reintentos + 1)));
        return subirImagenConReintento(imagen, indice, totalImagenes, reintentos + 1);
      }
      
      throw new Error(`Error al subir imagen ${indice + 1}: ${err.message || 'Error desconocido'}`);
    }
  }, [user]);

  const subirImagenes = useCallback(async (imagenes: File[]): Promise<string[]> => {
    console.log('🚀 Iniciando subida de imágenes...');
    
    const urlsSubidas: string[] = [];
    
    // Subir imágenes secuencialmente para evitar problemas de memoria
    for (let i = 0; i < imagenes.length; i++) {
      try {
        const url = await subirImagenConReintento(imagenes[i], i, imagenes.length);
        urlsSubidas.push(url);
        
        // Actualizar progreso general
        const progreso = Math.round(((i + 1) / imagenes.length) * 50);
        setProgresoSubida(progreso);
        
      } catch (err: any) {
        console.error(`Error fatal en imagen ${i + 1}:`, err);
        throw err;
      }
    }
    
    console.log(`✅ ${urlsSubidas.length} imágenes subidas exitosamente`);
    return urlsSubidas;
  }, [subirImagenConReintento]);

  const obtenerDatosUsuario = useCallback(async (): Promise<any> => {
    if (!user) return null;
    
    try {
      const referenciaUsuario = doc(db, 'users', user.uid);
      const documentoUsuario = await getDoc(referenciaUsuario);
      
      if (documentoUsuario.exists()) {
        return documentoUsuario.data();
      }
      
      // Si el usuario no está en la colección 'users', usar datos básicos
      return {
        name: user.displayName || 'Usuario',
        email: user.email,
        phone: null,
        photoURL: user.photoURL
      };
    } catch (err) {
      console.warn('⚠️ No se pudo obtener datos del usuario, usando datos básicos:', err);
      return {
        name: user.displayName || 'Usuario',
        email: user.email,
        phone: null,
        photoURL: user.photoURL
      };
    }
  }, [user]);

  const prepararDatosAnuncio = useCallback((
    urlsSubidas: string[], 
    datosUsuario: any
  ): ListingData => {
    const precioPorDia = parseFloat(datosFormulario.pricePerDay);
    const precioPorSemana = datosFormulario.pricePerWeek ? parseFloat(datosFormulario.pricePerWeek) : null;
    const precioPorMes = datosFormulario.pricePerMonth ? parseFloat(datosFormulario.pricePerMonth) : null;

    return {
      // Información básica
      title: datosFormulario.title.trim(),
      description: datosFormulario.description.trim(),
      category: datosFormulario.category,
      location: datosFormulario.location.trim(),
      
      // Precios
      pricing: {
        perDay: precioPorDia,
        perWeek: precioPorSemana,
        perMonth: precioPorMes
      },
      
      // Imágenes
      images: urlsSubidas,
      
      // Información del propietario
      owner: {
        uid: user!.uid,
        name: datosUsuario?.name || user!.displayName || 'Usuario',
        email: user!.email,
        phone: datosUsuario?.phone || null,
        photoURL: user!.photoURL || datosUsuario?.photoURL || null
      },
      
      // Estado y estadísticas
      status: 'active',
      available: true,
      views: 0,
      favorites: 0,
      bookings: 0,
      
      // Marcas de tiempo
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
  }, [datosFormulario, user]);

  // ===== Envío del formulario =====

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎯 INICIO DE PUBLICACIÓN DE ANUNCIO');
    
    // Verificar autenticación
    if (!user) {
      setError('Debes iniciar sesión para publicar un anuncio');
      router.push('/login');
      return;
    }

    // Validar datos
    const validacion = validarDatosFormulario();
    if (!validacion.valid) {
      setError(validacion.error!);
      return;
    }

    // Iniciar proceso de publicación
    setCargando(true);
    setError('');
    setExito('');
    setProgresoSubida(0);

    try {
      // PASO 1: Subir imágenes
      console.log('📸 PASO 1: Subiendo imágenes...');
      const urlsSubidas = await subirImagenes(datosFormulario.images);
      setProgresoSubida(60);

      // PASO 2: Obtener datos del usuario
      console.log('👤 PASO 2: Obteniendo datos del usuario...');
      const datosUsuario = await obtenerDatosUsuario();
      setProgresoSubida(70);

      // PASO 3: Preparar datos del anuncio
      console.log('📦 PASO 3: Preparando datos del anuncio...');
      const datosAnuncio = prepararDatosAnuncio(urlsSubidas, datosUsuario);
      setProgresoSubida(80);

      // PASO 4: Guardar en Firestore
      console.log('💾 PASO 4: Guardando en Firestore...');
      const referenciaListings = collection(db, 'listings');
      const referenciaDoc = await addDoc(referenciaListings, datosAnuncio);
      
      console.log('✅ Documento creado con ID:', referenciaDoc.id);
      setProgresoSubida(100);

      // Éxito
      console.log('🎉 ¡PUBLICACIÓN EXITOSA!');
      
      setExito('¡Anuncio publicado con éxito! 🎉 Redirigiendo...');
      
      // Reiniciar formulario
      setDatosFormulario({
        title: '',
        description: '',
        category: '',
        pricePerDay: '',
        pricePerWeek: '',
        pricePerMonth: '',
        location: '',
        images: []
      });
      
      // Limpiar vistas previas
      vistaPreviaImagenes.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      setVistaPreviaImagenes([]);

      // Redirigir a la página del anuncio
      setTimeout(() => {
        router.push(`/listing/${referenciaDoc.id}`);
      }, 2000);

    } catch (err: any) {
      console.error('❌ ERROR EN LA PUBLICACIÓN:', err);
      
      let mensajeError = 'Error al publicar el anuncio';
      
      // Mensajes de error más claros
      if (err.code === 'storage/unauthorized') {
        mensajeError = 'No tienes permiso para subir imágenes. Verifica tu autenticación.';
      } else if (err.code === 'storage/canceled') {
        mensajeError = 'La subida de imágenes fue cancelada';
      } else if (err.code === 'storage/unknown') {
        mensajeError = 'Error de red o almacenamiento. Verifica tu conexión.';
      } else if (err.code === 'permission-denied') {
        mensajeError = 'Permiso denegado. Verifica las reglas de seguridad de Firebase.';
      } else if (err.code === 'unavailable') {
        mensajeError = 'Firebase no está disponible. Verifica tu conexión a Internet.';
      } else if (err.message) {
        mensajeError = err.message;
      }
      
      setError(mensajeError);
      setProgresoSubida(0);
      
    } finally {
      setCargando(false);
    }
  };

  // Pantalla de carga mientras se verifica autenticación
  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl text-white">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Interfaz principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
          
          {/* Encabezado */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Publicar Nuevo Anuncio
            </h1>
            <p className="text-white/70 text-lg">
              Completa el formulario para publicar tu artículo en alquiler
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-1">⚠️</span>
                <div>
                  <p className="font-semibold">Error</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {exito && (
            <div className="mb-6 p-4 bg-green-500/20 border-2 border-green-500 rounded-xl text-green-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-1">✅</span>
                <div>
                  <p className="font-semibold">¡Éxito!</p>
                  <p>{exito}</p>
                </div>
              </div>
            </div>
          )}

          {/* Barra de progreso */}
          {cargando && progresoSubida > 0 && (
            <div className="mb-6 p-4 bg-blue-500/20 border-2 border-blue-500 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">Procesando...</span>
                <span className="text-white font-bold">{progresoSubida}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progresoSubida}%` }}
                />
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={manejarEnvio} className="space-y-6">
            
            {/* Título */}
            <div>
              <label className="block text-white mb-2 font-semibold">
                Título del Anuncio <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={datosFormulario.title}
                onChange={(e) => setDatosFormulario(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                placeholder="Ej: Cámara Canon EOS R6 profesional"
                maxLength={100}
                disabled={cargando}
                required
              />
              <p className="text-white/50 text-sm mt-1">
                {datosFormulario.title.length}/100 caracteres
              </p>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-white mb-2 font-semibold">
                Descripción <span className="text-red-400">*</span>
              </label>
              <textarea
                value={datosFormulario.description}
                onChange={(e) => setDatosFormulario(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all min-h-32 resize-none"
                placeholder="Describe tu artículo en detalle: estado, características, accesorios incluidos..."
                maxLength={1000}
                disabled={cargando}
                required
              />
              <p className="text-white/50 text-sm mt-1">
                {datosFormulario.description.length}/1000 caracteres (mínimo 20)
              </p>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-white mb-2 font-semibold">
                Categoría <span className="text-red-400">*</span>
              </label>
              <select
                value={datosFormulario.category}
                onChange={(e) => setDatosFormulario(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all cursor-pointer disabled:opacity-50"
                disabled={cargando}
                required
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS.map(categoria => (
                  <option key={categoria} value={categoria} className="bg-gray-900">
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            {/* Precios */}
            <div>
              <label className="block text-white mb-2 font-semibold">
                Precios de Alquiler
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Por Día (€) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={datosFormulario.pricePerDay}
                    onChange={(e) => setDatosFormulario(prev => ({ ...prev, pricePerDay: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    placeholder="15.00"
                    disabled={cargando}
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Por Semana (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={datosFormulario.pricePerWeek}
                    onChange={(e) => setDatosFormulario(prev => ({ ...prev, pricePerWeek: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    placeholder="80.00"
                    disabled={cargando}
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 text-sm">
                    Por Mes (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={datosFormulario.pricePerMonth}
                    onChange={(e) => setDatosFormulario(prev => ({ ...prev, pricePerMonth: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                    placeholder="250.00"
                    disabled={cargando}
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-white mb-2 font-semibold">
                Ubicación <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={datosFormulario.location}
                onChange={(e) => setDatosFormulario(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                placeholder="Ej: Madrid Centro, Barcelona Eixample"
                maxLength={100}
                disabled={cargando}
                required
              />
            </div>

            {/* Subida de imágenes */}
            <div>
              <label className="block text-white mb-2 font-semibold">
                Imágenes (1-5 fotos) <span className="text-red-400">*</span>
              </label>
              
              {/* Botón para subir imágenes */}
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={manejarCambioImagen}
                  disabled={cargando || vistaPreviaImagenes.length >= MAX_IMAGENES}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white 
                    file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
                    file:text-sm file:font-semibold file:bg-gradient-to-r file:from-cyan-500 file:to-blue-500 
                    file:text-white hover:file:from-cyan-600 hover:file:to-blue-600 
                    file:transition-all file:cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed
                    cursor-pointer"
                  id="subida-imagenes"
                />
                <label htmlFor="subida-imagenes" className="text-white/50 text-sm mt-2 block">
                  Formatos: JPG, PNG, WEBP • Máx 5MB por imagen • Máx {MAX_IMAGENES} imágenes
                </label>
              </div>
              
              {/* Vistas previas de imágenes */}
              {vistaPreviaImagenes.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-white font-medium">
                      {vistaPreviaImagenes.length} de {MAX_IMAGENES} imágenes seleccionadas
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        vistaPreviaImagenes.forEach(url => {
                          if (url.startsWith('blob:')) {
                            URL.revokeObjectURL(url);
                          }
                        });
                        setVistaPreviaImagenes([]);
                        setDatosFormulario(prev => ({ ...prev, images: [] }));
                      }}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      disabled={cargando}
                    >
                      Eliminar todas
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {vistaPreviaImagenes.map((vistaPrevia, indice) => (
                      <div key={indice} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-white/5 border-2 border-white/20">
                          <img
                            src={vistaPrevia}
                            alt={`Vista previa ${indice + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarImagen(indice)}
                          disabled={cargando}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 
                            flex items-center justify-center font-bold
                            hover:bg-red-600 hover:scale-110 transform transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed
                            shadow-lg"
                          title="Eliminar imagen"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {indice + 1}
                        </div>
                      </div>
                    ))}
                    
                    {/* Espacio para añadir más imágenes si no se ha llegado al máximo */}
                    {vistaPreviaImagenes.length < MAX_IMAGENES && (
                      <label 
                        htmlFor="subida-imagenes"
                        className="aspect-square rounded-xl border-2 border-dashed border-white/30 
                          flex flex-col items-center justify-center cursor-pointer
                          hover:border-cyan-400 hover:bg-white/5 transition-all"
                      >
                        <div className="text-4xl text-white/50 mb-2">+</div>
                        <div className="text-white/70 text-sm text-center px-2">
                          Añadir más
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl 
                font-bold text-lg hover:from-cyan-600 hover:to-blue-600 
                transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] transform
                flex items-center justify-center gap-3 mt-8"
            >
              {cargando ? (
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
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
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
