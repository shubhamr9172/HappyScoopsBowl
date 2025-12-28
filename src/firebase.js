import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBVlRU4b80T20nx-Wru44VjrOj6C-Cfvns",
    authDomain: "dil-se-cafe.firebaseapp.com",
    projectId: "dil-se-cafe",
    storageBucket: "dil-se-cafe.firebasestorage.app",
    messagingSenderId: "243054707294",
    appId: "1:243054707294:web:2154b3f896ab4859946acf",
    measurementId: "G-KZ105QV93Z"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
