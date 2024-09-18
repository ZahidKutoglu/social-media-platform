import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    authDomain: "socialmedia-auth-1be7f.firebaseapp.com",
    projectId: "socialmedia-auth-1be7f",
    storageBucket: "socialmedia-auth-1be7f.appspot.com",
    messagingSenderId: "952428612871",
    appId: "1:952428612871:web:e69bcbd3981bd1a0f809a2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence, browserSessionPersistence);

export { auth, db, storage, collection, addDoc, getDocs, query, where, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, googleProvider };