// js/firebase-config.js
// 替换为你自己的Firebase配置信息
const firebaseConfig = {
    apiKey: "AIzaSyCL7qHx-kmj7PDhfnm_AcwKoMCZtw7xeFs",
    authDomain: "typequest-leaderboard.firebaseapp.com",
    databaseURL: "https://typequest-leaderboard-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "typequest-leaderboard",
    storageBucket: "typequest-leaderboard.firebasestorage.app",
    messagingSenderId: "57783452163",
    appId: "1:57783452163:web:dbab039b3f64198ce80436"
};

// 初始化Firebase（必须使用compat版本，不可修改）
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
