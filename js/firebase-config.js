// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCL7qHx-kmj7PDhfnm_AcwKoMCZtw7xeFs",
  authDomain: "typequest-leaderboard.firebaseapp.com",
  databaseURL: "https://typequest-leaderboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "typequest-leaderboard",
  storageBucket: "typequest-leaderboard.firebasestorage.app",
  messagingSenderId: "57783452163",
  appId: "1:57783452163:web:dbab039b3f64198ce80436",
  measurementId: "G-L2J5QX000S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
