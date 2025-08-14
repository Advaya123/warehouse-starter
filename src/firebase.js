// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDPHgDPctY3KU1MY1DGBZQkNI0ILp_dFgU",
  authDomain: "warehouse-app-f9727.firebaseapp.com",
  projectId: "warehouse-app-f9727",
  storageBucket: "warehouse-app-f9727.firebasestorage.app",
  messagingSenderId: "966125893438",
  appId: "1:966125893438:web:69a8b2de74b702ea679e6f",
  measurementId: "G-57HHSH0VRT"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
