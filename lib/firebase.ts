// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCYFAKlLc3SqcSkYdZFVh13yPv48FtcGvw",
  authDomain: "cheikysdb-9ef6b.firebaseapp.com",
  projectId: "cheikysdb-9ef6b",
  storageBucket: "cheikysdb-9ef6b.appspot.com",
  messagingSenderId: "877811034570",
  appId: "1:877811034570:web:87d854fa099ae69e584733",
  measurementId: "G-MMMC2DQ9KC",
}

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

export { app, db, auth, storage }
