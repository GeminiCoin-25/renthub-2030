// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// ===== Configuración de Firebase =====
// ⚠️ Importante: Reemplaza estos valores con los tuyos desde Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ===== Inicialización de Firebase =====
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  // Verificar que Firebase no haya sido inicializado previamente
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Inicializar servicios
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Activar persistencia para Auth (mantener sesión iniciada)
  auth.setPersistence({
    type: 'LOCAL'
  } as any);
}

// Exportar servicios
export { app, auth, db, storage };

// Exportar configuración de Firebase para uso en otros lugares si es necesario
export { firebaseConfig };
