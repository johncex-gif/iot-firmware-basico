// =============================================================================
// Inicialización del SDK de Firebase para el Cliente
// =============================================================================
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase utilizando variables de entorno de Next.js.
// Las variables prefijadas con NEXT_PUBLIC_ se exponen al navegador.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Evitar inicializar múltiples instancias de Firebase durante el Hot Reloading en desarrollo (SSR).
// Si ya hay aplicaciones inicializadas, reutiliza la existente (getApp()), de lo contrario inicializa una nueva.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Instancia de Firebase Auth para la gestión de sesiones de usuario.
export const auth = getAuth(app);

// Instancia de Firestore para interactuar con las colecciones de base de datos en tiempo real.
export const db = getFirestore(app);

// Proveedor de Google Auth para habilitar el inicio de sesión con popup de Google.
export const googleProvider = new GoogleAuthProvider();

export default app;
