// js/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyCL7qHx-kmj7PDhfnm_AcwKoMCZtw7xeFs",
    authDomain: "typequest-leaderboard.firebaseapp.com",
    databaseURL: "https://typequest-leaderboard-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "typequest-leaderboard",
    storageBucket: "typequest-leaderboard.firebasestorage.app",
    messagingSenderId: "57783452163",
    appId: "1:57783452163:web:dbab039b3f64198ce80436"
};

// 使用 compat 版本初始化
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
