// js/leaderboard.js
class Leaderboard {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.leaderboardData = [];
        this.useFirebase = false;
        
        // 尝试初始化Firebase
        this.initFirebase();
        // 初始化用户名
        this.initUsername();
    }

    initFirebase() {
        try {
            if (typeof database !== 'undefined' && database !== null) {
                this.db = database;
                this.useFirebase = true;
                console.log('✅ Leaderboard 连接 Firebase 成功');
            }
        } catch (error) {
            console.log('⚠️ Leaderboard 使用本地模式');
        }
    }

    // 初始化用户名
    initUsername() {
        const saved = localStorage.getItem('typequest_username');
        if (saved) {
            this.currentUser = saved;
        } else {
            this.currentUser = '匿名玩家_' + Math.floor(Math.random() * 10000);
        }
    }

    // 设置用户名
    setUsername(username) {
        this.currentUser = username || '匿名玩家_' + Math.floor(Math.random() * 10000);
        localStorage.setItem('typequest_username', this.currentUser);
        return this.currentUser;
    }

    // 获取用户名
    getUsername() {
        return this.currentUser;
    }

    // 提交分数到排行榜
    async submitScore(scoreData) {
        const username = this.getUsername();
        const record = {
            username: username,
            wpm: scoreData.wpm,
            accuracy: scoreData.accuracy,
            book: scoreData.book,
            combo: scoreData.combo,
            rank: scoreData.rank,
            difficulty: scoreData.difficulty,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString()
        };

        // 保存到本地（始终保存）
        this.saveToLocal(record);

        // 尝试保存到Firebase
        if (this.useFirebase && this.db) {
            try {
                // 写入全局排行榜
                await this.db.ref('leaderboard').push(record);
                
                // 写入个人最佳记录
                const personalBestRef = this.db.ref(`personalBest/${username}/${scoreData.book}`);
                const snapshot = await personalBestRef.once('value');
                const currentBest = snapshot.val();
                
                if (!currentBest || scoreData.wpm > currentBest.wpm) {
                    await personalBestRef.set(record);
                }
                
                console.log('✅ 分数已提交到全球排行榜');
                return true;
            } catch (error) {
                console.log('⚠️ 提交到全球排行榜失败:', error);
            }
        }
        
        return false;
    }

    // 保存到本地
    saveToLocal(record) {
        const localRecords = JSON.parse(localStorage.getItem('typequest_leaderboard') || '[]');
        localRecords.push(record);
        
        // 只保留最佳记录
        const bestRecords = {};
        localRecords.forEach(r => {
            const key = `${r.username}_${r.book}`;
            if (!bestRecords[key] || r.wpm > bestRecords[key].wpm) {
                bestRecords[key] = r;
            }
        });
        
        localStorage.setItem('typequest_leaderboard', JSON.stringify(Object.values(bestRecords)));
    }

    // 获取排行榜数据
    async getLeaderboard(book = 'all', limit = 20) {
        // 优先从Firebase获取
        if (this.useFirebase && this.db) {
            try {
                let query = this.db.ref('leaderboard');
                const snapshot = await query.once('value');
                const data = [];
                
                snapshot.forEach(child => {
                    const record = child.val();
                    data.push(record);
                });
                
                // 按WPM降序排序
                data.sort((a, b) => b.wpm - a.wpm);
                
                // 按词书筛选
                if (book !== 'all') {
                    const filtered = data.filter(r => r.book === book);
                    return filtered.slice(0, limit);
                }
                
                return data.slice(0, limit);
            } catch (error) {
                console.log('⚠️ 从Firebase获取排行榜失败，使用本地数据');
            }
        }
        
        // 本地回退
        return this.getLocalLeaderboard(book, limit);
    }

    // 获取本地排行榜
    getLocalLeaderboard(book = 'all', limit = 20) {
        const localRecords = JSON.parse(localStorage.getItem('typequest_leaderboard') || '[]');
        
        // 按WPM降序排序
        localRecords.sort((a, b) => b.wpm - a.wpm);
        
        // 按词书筛选
        if (book !== 'all') {
            const filtered = localRecords.filter(r => r.book === book);
            return filtered.slice(0, limit);
        }
        
        return localRecords.slice(0, limit);
    }

    // 获取个人最佳记录
    async getPersonalBest(username, book) {
        // 优先从Firebase获取
        if (this.useFirebase && this.db) {
            try {
                // 全部词书
                if (book === 'all') {
                    const snapshot = await this.db.ref(`personalBest/${username}`).once('value');
                    const records = snapshot.val();
                    if (!records) return null;
                    
                    // 找出最高WPM的记录
                    const recordList = Object.values(records);
                    recordList.sort((a, b) => b.wpm - a.wpm);
                    return recordList[0];
                }
                
                // 指定词书
                const snapshot = await this.db.ref(`personalBest/${username}/${book}`).once('value');
                return snapshot.val();
            } catch (error) {
                console.log('⚠️ 从Firebase获取个人记录失败，使用本地数据');
            }
        }
        
        // 本地回退
        return this.getLocalPersonalBest(username, book);
    }

    // 获取本地个人最佳
    getLocalPersonalBest(username, book) {
        const localRecords = JSON.parse(localStorage.getItem('typequest_leaderboard') || '[]');
        const userRecords = localRecords.filter(r => r.username === username);
        
        if (userRecords.length === 0) return null;
        
        if (book !== 'all') {
            const filtered = userRecords.filter(r => r.book === book);
            if (filtered.length === 0) return null;
            filtered.sort((a, b) => b.wpm - a.wpm);
            return filtered[0];
        }
        
        userRecords.sort((a, b) => b.wpm - a.wpm);
        return userRecords[0];
    }

    // 实时监听排行榜更新
    onLeaderboardUpdate(callback, book = 'all') {
        if (this.useFirebase && this.db) {
            try {
                this.db.ref('leaderboard').on('value', (snapshot) => {
                    const data = [];
                    snapshot.forEach(child => {
                        data.push(child.val());
                    });
                    
                    // 排序
                    data.sort((a, b) => b.wpm - a.wpm);
                    
                    // 筛选
                    if (book !== 'all') {
                        const filtered = data.filter(r => r.book === book);
                        callback(filtered.slice(0, 20));
                    } else {
                        callback(data.slice(0, 20));
                    }
                });
            } catch (error) {
                console.log('⚠️ Firebase实时监听失败');
            }
        }
    }

    // 取消监听
    offLeaderboardUpdate() {
        if (this.useFirebase && this.db) {
            try {
                this.db.ref('leaderboard').off();
            } catch (error) {
                // 静默失败
            }
        }
    }
}

// 创建全局实例，供index.html调用
const leaderboard = new Leaderboard();
