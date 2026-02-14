class Leaderboard {
  constructor() {
    this.username = localStorage.getItem('username') || '玩家' + Math.random().toString(16).slice(2,6);
  }

  getUsername() {
    return this.username;
  }

  setUsername(name) {
    if (name && name.trim()) {
      this.username = name.trim();
      localStorage.setItem('username', this.username);
    }
  }

  async submitScore(score) {
    console.log('提交成绩', score);
  }

  async getLeaderboard() {
    return [];
  }

  async getPersonalBest() {
    return null;
  }
}
