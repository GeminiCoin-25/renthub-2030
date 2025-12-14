'use client';

import { useState, useEffect, useMemo } from 'react';
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

// Validation result type
interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Spanish categories - using useMemo for optimization
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

// Constants
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_RETRIES = 3;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

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

  // Memory cleanup - revoke blob URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreview.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreview]);

  // ===== VALIDATION FUNCTIONS =====
  
  // Validate images
  const validateImages = (files: File[]): ValidationResult => {
    if (files.length > MAX_IMAGES) {
      return { 
        valid: false, 
        error: `Puedes subir máximo ${MAX_IMAGES} imágenes` 
      };
    }

    const oversizedFiles = files.filter(file => file.size > MAX_IMAGE_SIZE);
    if (oversizedFiles.length > 0) {
