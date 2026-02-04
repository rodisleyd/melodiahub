
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCSt_uTfWbmD43Vh8aEYdvYotMYK6M4yl0",
    authDomain: "melodyhub-8be7b.firebaseapp.com",
    projectId: "melodyhub-8be7b",
    storageBucket: "melodyhub-8be7b.firebasestorage.app",
    messagingSenderId: "327479054593",
    appId: "1:327479054593:web:31ac174cf6d51ab1b40b00"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
