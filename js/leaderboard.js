// js/leaderboard.js
class Leaderboard {
    constructor() {
        this.db = firebase.database();
        this.currentUser = null;
        this.leaderboardData = [];
    }

    // 设置用户名
    setUsername(username) {
        this.currentUser = username || '匿名玩家_' + Math.floor(Math.random() * 10000);
        localStorage.setItem('typequest_username', this.currentUser);
        return this.currentUser;
    }

    // 获取用户名
    getUsername() {
        return localStorage.getItem('typequest_username') || this.currentUser;
    }

    // 提交分数
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
            // 写入到排行榜
            await this.db.ref('leaderboard').push(record);
            
            // 同时写入个人最佳记录
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

    // 获取排行榜（前20名）
    async getLeaderboard(book = 'all', limit = 20) {
        try {
            let query = this.db.ref('leaderboard');
            
            if (book !== 'all') {
                // 按词书筛选需要在客户端完成，因为 Firebase 实时数据库不支持复杂查询
                const snapshot = await query.once('value');
                const data = [];
                snapshot.forEach(child => {
                    const record = child.val();
                    if (record.book === book) {
                        data.push(record);
                    }
                });
                
                // 按 WPM 排序并限制数量
                return data.sort((a, b) => b.wpm - a.wpm).slice(0, limit);
            } else {
                const snapshot = await query.orderByChild('wpm').limitToLast(limit).once('value');
                const data = [];
                snapshot.forEach(child => {
                    data.unshift(child.val()); // 反转以获得降序
                });
                return data;
            }
        } catch (error) {
            console.error('获取排行榜失败:', error);
            return [];
        }
    }

    // 获取个人记录
    async getPersonalBest(username, book) {
        try {
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
}

// 创建全局实例
const leaderboard = new Leaderboard();
