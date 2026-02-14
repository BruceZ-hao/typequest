// js/firebase-config.js
// 替换为你自己的Firebase配置信息（可选）
const firebaseConfig = {
    apiKey: "AIzaSyCL7qHx-kmj7PDhfnm_AcwKoMCZtw7xeFs",
    authDomain: "typequest-leaderboard.firebaseapp.com",
    databaseURL: "https://typequest-leaderboard-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "typequest-leaderboard",
    storageBucket: "typequest-leaderboard.firebasestorage.app",
    messagingSenderId: "57783452163",
    appId: "1:57783452163:web:dbab039b3f64198ce80436"
};

// 安全初始化Firebase（无网络时自动降级）
let database = null;
let firebaseInitialized = false;

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        firebaseInitialized = true;
        console.log('✅ Firebase 初始化成功');
    }
} catch (error) {
    console.log('⚠️ Firebase 初始化失败，使用本地模式:', error);
}
