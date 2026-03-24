# TypeQuest

TypeQuest 是一个部署在 GitHub Pages 上的静态单词打字训练网站，面向 CET-4、CET-6、IELTS、TOEFL、GRE、编程英语、商务英语和学术英语。

本次整理后的版本重点放在三个方向：

- 更完整的训练界面：重做首页结构、训练区、实时统计、词书选择和移动端输入体验。
- 更稳的本地数据：新增本地玩家资料、训练历史、历史导出和最近成绩流。
- 更干净的排行榜逻辑：本地榜单与云端榜单都按“每位玩家在每本词书上的最佳成绩”展示，减少重复记录干扰。

## 网站地址

[https://brucez-hao.github.io/typequest/](https://brucez-hao.github.io/typequest/)

## 目录结构

- `index.html`：主页结构
- `styles/site.css`：页面样式
- `js/app.js`：训练逻辑、资料页、历史记录和 UI 交互
- `js/vocabulary.js`：词库数据
- `js/leaderboard.js`：本地/云端排行榜逻辑
- `js/firebase-config.js`：Firebase 配置

## 本地打开

这是一个纯静态项目，直接打开 `index.html` 即可运行；如果需要更稳定地测试 Firebase 读写，建议通过本地静态服务器访问。

## 排行榜说明

- 无论云端是否可用，成绩都会写入本地历史。
- 本地排行榜会自动保留每个用户在每本词书上的最佳成绩。
- 云端排行榜只有在刷新个人最佳时才会新增记录，避免同一用户的重复成绩堆积。
