class Leaderboard {
    constructor() {
        if (!window.firebase) {
            console.error('Firebase 未加载');
            this.db = null;
            this.currentUser = '匿名玩家_' + Math.floor(Math.random()*10000);
            return;
        }
        this.db = firebase.database();
        this.currentUser = localStorage.getItem('typequest_username') || '匿名玩家_' + Math.floor(Math.random()*10000);
    }
    setUsername(name) {
        this.currentUser = name || '匿名玩家_' + Math.floor(Math.random()*10000);
        localStorage.setItem('typequest_username', this.currentUser);
        return this.currentUser;
    }
    getUsername() {
        return localStorage.getItem('typequest_username') || this.currentUser;
    }
    async submitScore(data) {
        if (!this.db) return false;
        const u = this.getUsername();
        const rec = {
            username: u,
            wpm: data.wpm,
            accuracy: data.accuracy,
            book: data.book,
            combo: data.combo,
            rank: data.rank,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            date: new Date().toLocaleDateString()
        };
        try {
            await this.db.ref('leaderboard').push(rec);
            const bestRef = this.db.ref(`personalBest/${u}/${data.book}`);
            const snap = await bestRef.once('value');
            const cur = snap.val();
            if (!cur || data.wpm > cur.wpm) await bestRef.set(rec);
            return true;
        } catch (e) {
            console.error('提交失败', e);
            return false;
        }
    }
    async getLeaderboard(book='all', limit=20) {
        if (!this.db) return [];
        try {
            const q = this.db.ref('leaderboard');
            const snap = await q.once('value');
            const arr = [];
            snap.forEach(c => arr.push(c.val()));
            let res = arr.sort((a,b) => (b.wpm||0)-(a.wpm||0));
            if (book!=='all') res = res.filter(x => x.book===book);
            return res.slice(0, limit);
        } catch (e) {
            console.error('获取排行失败', e);
            return [];
        }
    }
    async getPersonalBest(u, book) {
        if (!this.db) return null;
        try {
            const snap = await this.db.ref(`personalBest/${u}/${book}`).once('value');
            return snap.val();
        } catch (e) {
            console.error('获取个人记录失败', e);
            return null;
        }
    }
}
