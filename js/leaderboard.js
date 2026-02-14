// js/leaderboard.js
class Leaderboard {
    constructor() {
        this.db = firebase.database();
        this.currentUser = null;
        this.leaderboardData = [];
        // 初始化用户名
        this.initUsername();
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
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            date: new Date().toLocaleDateString()
        };

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
            
            return true;
        } catch (error) {
            console.error('提交分数失败:', error);
            return false;
        }
    }

    // 获取排行榜数据
    async getLeaderboard(book = 'all', limit = 20) {
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
            console.error('获取排行榜失败:', error);
            return [];
        }
    }

    // 获取个人最佳记录
    async getPersonalBest(username, book) {
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
            console.error('获取个人记录失败:', error);
            return null;
        }
    }

    // 实时监听排行榜更新
    onLeaderboardUpdate(callback, book = 'all') {
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
    }

    // 取消监听
    offLeaderboardUpdate() {
        this.db.ref('leaderboard').off();
    }
}

// 创建全局实例，供index.html调用
const leaderboard = new Leaderboard();
