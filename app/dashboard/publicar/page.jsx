"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Calendar, MapPin, Euro, Package, FileText, Image as ImageIcon } from "lucide-react";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function PublicarPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
    precio: "",
    ubicacion: "",
    disponibilidadInicio: "",
    disponibilidadFin: "",
  });

  const [imagenes, setImagenes] = useState([]);
  const [imagenesPreview, setImagenesPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categorias = [
    "Trajes de Fiesta",
    "Vestidos de Gala",
    "Equipamiento Deportivo",
    "Herramientas y Máquinas",
    "Electrónica",
    "Mobiliario Eventos",
    "Vehículos Especiales",
    "Equipos Profesionales",
    "Otros"
  ];

  // Handle image selection
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + imagenes.length > 6) {
      setError("Máximo 6 imágenes permitidas");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Add new images to state
    setImagenes(prev => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagenesPreview(prev => [...prev, ...newPreviews]);
  };

  // Remove image
  const removeImage = (index) => {
    setImagenes(prev => prev.filter((_, i) => i !== index));
    setImagenesPreview(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Upload images to Firebase Storage
  const uploadImages = async (userId) => {
    const imageUrls = [];
    
    for (let i = 0; i < imagenes.length; i++) {
      const image = imagenes[i];
      const timestamp = Date.now();
      const imageName = `listings/${userId}/${timestamp}_${i}_${image.name}`;
      const imageRef = ref(storage, imageName);
      
      try {
        await uploadBytes(imageRef, image);
        const url = await getDownloadURL(imageRef);
        imageUrls.push(url);
      } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error("Error al subir las imágenes");
      }
    }
    
    return imageUrls;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.titulo || !formData.descripcion || !formData.categoria || !formData.precio) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }

    if (imagenes.length === 0) {
      setError("Por favor sube al menos una imagen");
      return;
    }

    if (!auth.currentUser) {
      setError("Debes iniciar sesión para publicar un anuncio");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      // Upload images first
      const imageUrls = await uploadImages(auth.currentUser.uid);

      // Create listing document
      const listingData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        precio: parseFloat(formData.precio),
        ubicacion: formData.ubicacion,
        disponibilidadInicio: formData.disponibilidadInicio || null,
        disponibilidadFin: formData.disponibilidadFin || null,
        imagenes: imageUrls,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        estado: "disponible",
        vistas: 0,
        favoritos: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      await addDoc(collection(db, "rentalItems"), listingData);

      setSuccess("¡Anuncio publicado exitosamente! 🎉");
      
      // Reset form
      setFormData({
        titulo: "",
        descripcion: "",
        categoria: "",
        precio: "",
        ubicacion: "",
        disponibilidadInicio: "",
        disponibilidadFin: "",
      });
      setImagenes([]);
      setImagenesPreview([]);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (error) {
      console.error("Error creating listing:", error);
      setError("Error al publicar el anuncio. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Publicar Anuncio
          </h1>
          <p className="text-purple-300 text-lg">
            Comparte tu artículo con la comunidad RentHub
          </p>
        </motion.div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-300 text-center"
          >
            {success}
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-300 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          {/* Image Upload Section */}
          <div className="mb-8">
            <label className="block text-white font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Imágenes (Máximo 6)
            </label>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              {imagenesPreview.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {imagenes.length < 6 && (
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-purple-400 rounded-xl cursor-pointer hover:border-purple-300 transition-colors bg-white/5">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <span className="text-purple-300 text-sm">
                    Click para subir imágenes
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Título *
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Ej: Traje de Ceremonia Premium"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Descripción *
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describe tu artículo en detalle..."
              rows="5"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Categoría *
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleInputChange}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400"
              required
            >
              <option value="" className="bg-slate-800">Selecciona una categoría</option>
              {categorias.map(cat => (
                <option key={cat} value={cat} className="bg-slate-800">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2 flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Precio por día (€) *
            </label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleInputChange}
              placeholder="50"
              step="0.01"
              min="0"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicación
            </label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleInputChange}
              placeholder="Madrid, España"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Availability Dates */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Disponible desde
              </label>
              <input
                type="date"
                name="disponibilidadInicio"
                value={formData.disponibilidadInicio}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Disponible hasta
              </label>
              <input
                type="date"
                name="disponibilidadFin"
                value={formData.disponibilidadFin}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            } text-white`}
          >
            {loading ? "Publicando..." : "Publicar Anuncio"}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
