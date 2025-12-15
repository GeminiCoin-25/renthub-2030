// firebase-config.js
// Firebase Configuration for RentHub 2030

const firebaseConfig = {
    apiKey: "AIzaSyDA223bKA90MX_QpWuF1ARgWKldjXuiNo4",
    authDomain: "renthub-2030.firebaseapp.com",
    projectId: "renthub-2030",
    storageBucket: "renthub-2030.firebasestorage.app",
    messagingSenderId: "23301901800",
    appId: "1:23301901800:web:2679c834aac406c72d685d",
    measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export services for use in other files
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log('Firebase initialized successfully');
