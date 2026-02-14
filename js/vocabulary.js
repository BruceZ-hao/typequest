const vocabularyBooks = {
  cet4: [
    { en: "abundant", cn: "丰富的" },
    { en: "accurate", cn: "准确的" },
    { en: "active", cn: "积极的" },
    { en: "adapt", cn: "适应" },
    { en: "affect", cn: "影响" },
    { en: "approach", cn: "方法" },
    { en: "attitude", cn: "态度" },
    { en: "available", cn: "可获得的" },
    { en: "avoid", cn: "避免" },
    { en: "benefit", cn: "受益" }
  ]
};

let leaderboard;
let words = [];
let currentWordIndex = 0;
let currentCharIndex = 0;
let isPlaying = false;
let startTime = null;

function init() {
  leaderboard = new Leaderboard();
  renderUI();
  bindEvents();
  resetGame();
}

function renderUI() {
  document.getElementById('app').innerHTML = `
<div class="min-h-screen p-4 flex flex-col items-center">
  <h1 class="text-4xl font-bold mb-4">TypeQuest</h1>
  <div class="w-full max-w-2xl mb-4">
    <div class="text-sm mb-1">当前单词</div>
    <div id="word-display" class="text-2xl h-12"></div>
  </div>
  <input id="input" class="px-4 py-2 rounded bg-gray-800 border border-gray-600 w-full max-w-xl" placeholder="开始输入单词">
  <div class="mt-6">
    <button id="start" class="px-6 py-2 bg-cyan-600 rounded">开始游戏</button>
  </div>
</div>
  `;
}

function bindEvents() {
  document.getElementById('start').onclick = startGame;
  document.getElementById('input').addEventListener('input', onType);
}

function resetGame() {
  isPlaying = false;
  currentWordIndex = 0;
  currentCharIndex = 0;
  words = [...vocabularyBooks.cet4].sort(() => Math.random() - 0.5).slice(0, 10);
  showCurrentWord();
}

function startGame() {
  isPlaying = true;
  startTime = Date.now();
  document.getElementById('input').value = '';
  document.getElementById('input').focus();
}

function showCurrentWord() {
  const el = document.getElementById('word-display');
  if (currentWordIndex >= words.length) {
    el.innerText = '✅ 完成！';
    isPlaying = false;
    return;
  }
  el.innerText = words[currentWordIndex].en;
}

function onType(e) {
  if (!isPlaying) return;

  const val = e.target.value.trim();
  const current = words[currentWordIndex].en;

  if (val === current) {
    currentWordIndex++;
    currentCharIndex = 0;
    e.target.value = '';
    showCurrentWord();
  }
}

window.addEventListener('DOMContentLoaded', init);
