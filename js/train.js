const BOOK_META = {
    cet4: { label: "CET-4", note: "基础高频词汇，适合热身和建立节奏。" },
    cet6: { label: "CET-6", note: "更长的抽象词和学术词，要求稳定准确率。" },
    ielts: { label: "IELTS", note: "偏应用和学术混合词汇，适合提升语感。" },
    toefl: { label: "TOEFL", note: "偏正式阅读语料，长词占比更高。" },
    gre: { label: "GRE", note: "高难度词汇密度高，适合冲刺记忆。" },
    programming: { label: "Programming", note: "程序员英语，适合术语熟练度训练。" },
    business: { label: "Business", note: "商务与管理英语，适合职场语境。" },
    academic: { label: "Academic", note: "论文与学术表达词汇，偏研究场景。" }
};

const DIFFICULTY_META = {
    easy: { label: "热身", subtitle: "10 词 · 低压起手", count: 10, maxDifficulty: 2, stage: "Warm-up" },
    normal: { label: "标准", subtitle: "18 词 · 主训练区间", count: 18, maxDifficulty: 4, stage: "Standard" },
    hard: { label: "冲刺", subtitle: "28 词 · 全词库直出", count: 28, maxDifficulty: Infinity, stage: "Sprint" },
    daily: { label: "每日任务", subtitle: "15 词 · 当日固定种子", count: 15, maxDifficulty: Infinity, stage: "Daily" }
};

const STORAGE_KEYS = {
    history: "typequest_history",
    currentBook: "typequest_current_book",
    currentDifficulty: "typequest_current_difficulty",
    soundEnabled: "typequest_sound_enabled"
};

const trainStorage = window.typeQuestStorage || window.localStorage;
const MAIN_PAGE_PATH = "index.html";

const routeParams = new URLSearchParams(window.location.search);

const state = {
    currentBook: getInitialBook(),
    currentDifficulty: getInitialDifficulty(),
    sessionWords: [],
    currentWordIndex: 0,
    typedBuffer: "",
    errorCount: 0,
    currentCombo: 0,
    bestCombo: 0,
    completedCharCount: 0,
    startTime: null,
    isPlaying: false,
    lastResult: null,
    resultSyncText: "成绩会先写入本地历史。",
    soundEnabled: trainStorage.getItem(STORAGE_KEYS.soundEnabled) !== "false",
    wrongFlash: null,
    timerId: null
};

const elements = {};

function init() {
    cacheElements();
    bindEvents();
    syncUsername();
    persistCurrentSetup();
    prepareSession();
    refreshAllStatic();
    refreshArenaRealtime();
}

function cacheElements() {
    [
        "headerUsername",
        "trainMissionBook", "trainMissionDifficulty", "trainMissionWordCount", "trainMissionBest",
        "trainMissionLabel", "trainMissionNote", "trainMissionSubNote",
        "syncStatus", "soundToggleButton", "arenaBackButton", "arenaHomeButton", "arenaStepLabel",
        "progressText", "translationLabel", "focusBookLabel", "progressBar", "typingStage",
        "stageBadge", "stageHint", "wordRack", "focusWord", "focusDifficultyLabel", "selectedWordCount",
        "typingInput", "startButton", "resetButton",
        "statWpm", "statAccuracy", "statCombo", "statTime",
        "bookDescription", "localBestInline", "selectedSyncMode",
        "resultRank", "resultMessage", "resultWpm", "resultAccuracy", "resultCombo", "resultWordCount",
        "resultSyncStatus", "resultPlayAgainButton", "resultReturnBriefingButton", "resultHomeButton",
        "resultHistoryButton", "resultLeaderboardButton"
    ].forEach((id) => {
        elements[id] = document.getElementById(id);
    });
}

function bindEvents() {
    elements.arenaBackButton.addEventListener("click", () => attemptLeaveTo("briefing"));
    elements.arenaHomeButton.addEventListener("click", () => attemptLeaveTo("overview"));
    elements.soundToggleButton.addEventListener("click", toggleSound);
    elements.typingStage.addEventListener("click", focusTypingInput);
    elements.typingInput.addEventListener("focus", focusTypingInput);
    elements.typingInput.addEventListener("input", handleTypingInput);
    elements.startButton.addEventListener("click", startSession);
    elements.resetButton.addEventListener("click", resetSession);

    elements.resultPlayAgainButton.addEventListener("click", playAgain);
    elements.resultReturnBriefingButton.addEventListener("click", () => attemptLeaveTo("briefing"));
    elements.resultHomeButton.addEventListener("click", () => attemptLeaveTo("overview"));
    elements.resultHistoryButton.addEventListener("click", () => attemptLeaveTo("history"));
    elements.resultLeaderboardButton.addEventListener("click", () => attemptLeaveTo("leaderboard"));

    document.addEventListener("keydown", handleGlobalKeydown);
}

function getInitialBook() {
    const requestedBook = routeParams.get("book");
    if (requestedBook && BOOK_META[requestedBook]) {
        return requestedBook;
    }
    return trainStorage.getItem(STORAGE_KEYS.currentBook) || "cet4";
}

function getInitialDifficulty() {
    const requestedDifficulty = routeParams.get("difficulty");
    if (requestedDifficulty && DIFFICULTY_META[requestedDifficulty]) {
        return requestedDifficulty;
    }
    return trainStorage.getItem(STORAGE_KEYS.currentDifficulty) || "normal";
}

function persistCurrentSetup() {
    trainStorage.setItem(STORAGE_KEYS.currentBook, state.currentBook);
    trainStorage.setItem(STORAGE_KEYS.currentDifficulty, state.currentDifficulty);
}

function buildMainUrl(screenKey) {
    const url = new URL(MAIN_PAGE_PATH, window.location.href);
    if (screenKey) {
        url.searchParams.set("screen", screenKey);
    }
    url.searchParams.set("book", state.currentBook);
    url.searchParams.set("difficulty", state.currentDifficulty);
    return url.toString();
}

function navigateToMain(screenKey) {
    window.location.href = buildMainUrl(screenKey);
}

function attemptLeaveTo(screenKey) {
    if (!leaveArenaGuard()) {
        return;
    }
    navigateToMain(screenKey);
}

function leaveArenaGuard() {
    if (!hasUnfinishedProgress()) {
        return true;
    }

    return window.confirm("当前训练还没完成，确认离开并放弃这一轮吗？");
}

function hasUnfinishedProgress() {
    return Boolean(
        state.isPlaying ||
        state.typedBuffer.length > 0 ||
        state.errorCount > 0 ||
        (state.currentWordIndex > 0 && state.currentWordIndex < state.sessionWords.length)
    );
}

function refreshAllStatic() {
    refreshHeader();
    refreshMissionSummary();
    refreshArenaStatic();
    refreshSyncStatus();
    populateResultScreen();
}

function refreshHeader() {
    elements.headerUsername.textContent = leaderboard.getUsername() || "匿名玩家";
}

function refreshMissionSummary() {
    const bookMeta = BOOK_META[state.currentBook];
    const difficultyMeta = DIFFICULTY_META[state.currentDifficulty];
    const localBest = getLocalBestForBook(state.currentBook);

    elements.trainMissionBook.textContent = bookMeta.label;
    elements.trainMissionDifficulty.textContent = difficultyMeta.label;
    elements.trainMissionWordCount.textContent = String(state.sessionWords.length);
    elements.trainMissionBest.textContent = localBest ? `${localBest.wpm} WPM / ${localBest.accuracy}%` : "暂无记录";
    elements.trainMissionLabel.textContent = `${bookMeta.label} · ${difficultyMeta.label}`;
    elements.trainMissionNote.textContent = `${bookMeta.note} 当前模式会抽取 ${state.sessionWords.length} 个词，适合在独立页面里连续完成一整轮。`;
    elements.trainMissionSubNote.textContent = localBest
        ? `你在该词书上的最佳记录是 ${localBest.wpm} WPM，准确率 ${localBest.accuracy}%。`
        : "这本词书还没有本地最佳记录，可以用这一轮先建立基线。";
}

function refreshArenaStatic() {
    const bookMeta = BOOK_META[state.currentBook];
    const difficultyMeta = DIFFICULTY_META[state.currentDifficulty];
    const localBest = getLocalBestForBook(state.currentBook);

    elements.arenaStepLabel.textContent = `${bookMeta.label} · ${difficultyMeta.label} · ${state.sessionWords.length} 词`;
    elements.focusBookLabel.textContent = bookMeta.label;
    elements.focusDifficultyLabel.textContent = difficultyMeta.label;
    elements.selectedWordCount.textContent = `${state.sessionWords.length} 个词`;
    elements.bookDescription.textContent = bookMeta.note;
    elements.localBestInline.textContent = localBest ? `${localBest.wpm} WPM / ${localBest.accuracy}%` : "暂无记录";
    elements.selectedSyncMode.textContent = leaderboard.useFirebase ? "本地 + 云端最佳" : "本地优先";
}

function refreshArenaRealtime() {
    const currentWord = state.sessionWords[state.currentWordIndex];
    const progressRatio = state.sessionWords.length ? state.currentWordIndex / state.sessionWords.length : 0;

    elements.statWpm.textContent = String(getCurrentWpm());
    elements.statAccuracy.textContent = `${getCurrentAccuracy()}%`;
    elements.statCombo.textContent = String(state.currentCombo);
    elements.statTime.textContent = formatDuration(getElapsedMs());

    elements.progressText.textContent = `${state.currentWordIndex} / ${state.sessionWords.length}`;
    elements.translationLabel.textContent = currentWord ? currentWord.cn : "本轮完成";
    elements.progressBar.style.width = `${Math.min(100, Math.round(progressRatio * 100))}%`;
    elements.focusWord.textContent = currentWord ? currentWord.en : "Mission Complete";
    elements.stageBadge.textContent = state.isPlaying ? DIFFICULTY_META[state.currentDifficulty].stage : "待开始";
    elements.stageHint.textContent = getStageHint(currentWord);

    renderWordRack();
}

function renderWordRack() {
    if (!state.sessionWords.length) {
        elements.wordRack.innerHTML = `
            <article class="word-card is-current">
                <div class="word-card-header">
                    <span class="word-card-index">00</span>
                    <span class="translation-chip">等待生成</span>
                </div>
                <div class="word-text"><span class="word-char is-cursor">ready</span></div>
            </article>
        `;
        return;
    }

    const start = Math.max(0, state.currentWordIndex - 2);
    const end = Math.min(state.sessionWords.length, state.currentWordIndex + 6);
    const wrongFlash = state.wrongFlash && Date.now() - state.wrongFlash.at < 260 ? state.wrongFlash : null;

    elements.wordRack.innerHTML = state.sessionWords.slice(start, end).map((entry, localIndex) => {
        const index = start + localIndex;
        const isComplete = index < state.currentWordIndex;
        const isCurrent = index === state.currentWordIndex;
        const classes = ["word-card"];

        if (isComplete) {
            classes.push("is-complete");
        }
        if (isCurrent) {
            classes.push("is-current");
        }

        const chars = entry.en.split("").map((char, charIndex) => {
            const charClasses = ["word-char"];
            if (isComplete || (isCurrent && charIndex < state.typedBuffer.length)) {
                charClasses.push("is-correct");
            } else if (isCurrent && charIndex === state.typedBuffer.length) {
                charClasses.push("is-cursor");
            }

            if (
                wrongFlash &&
                wrongFlash.wordIndex === index &&
                wrongFlash.charIndex === charIndex &&
                isCurrent
            ) {
                charClasses.push("is-wrong");
            }

            return `<span class="${charClasses.join(" ")}">${escapeHtml(char)}</span>`;
        }).join("");

        return `
            <article class="${classes.join(" ")}">
                <div class="word-card-header">
                    <span class="word-card-index">${String(index + 1).padStart(2, "0")}</span>
                    <span class="translation-chip">${escapeHtml(entry.cn)}</span>
                </div>
                <div class="word-text">${chars}</div>
            </article>
        `;
    }).join("");
}

function prepareSession() {
    state.sessionWords = createSessionWords(state.currentBook, state.currentDifficulty);
    state.currentWordIndex = 0;
    state.typedBuffer = "";
    state.errorCount = 0;
    state.currentCombo = 0;
    state.bestCombo = 0;
    state.completedCharCount = 0;
    state.startTime = null;
    state.isPlaying = false;
    state.resultSyncText = state.lastResult ? state.resultSyncText : "成绩会先写入本地历史。";
    state.wrongFlash = null;
    stopTimer();
    elements.typingInput.value = "";
}

function resetSession() {
    prepareSession();
    refreshAllStatic();
    refreshArenaRealtime();
    focusTypingInput();
}

function playAgain() {
    prepareSession();
    refreshAllStatic();
    refreshArenaRealtime();
    elements.typingStage.scrollIntoView({ behavior: "smooth", block: "start" });
    focusTypingInput();
}

function startSession() {
    if (!state.sessionWords.length) {
        prepareSession();
    }

    if (!state.isPlaying) {
        state.isPlaying = true;
        if (!state.startTime) {
            state.startTime = Date.now();
        }
        startTimer();
        refreshArenaRealtime();
    }

    focusTypingInput();
}

function focusTypingInput() {
    elements.typingInput.focus();
    const length = elements.typingInput.value.length;
    elements.typingInput.setSelectionRange(length, length);
}

function handleGlobalKeydown(event) {
    if (event.key === "Escape") {
        event.preventDefault();
        attemptLeaveTo("briefing");
        return;
    }

    if (event.key === "Enter") {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === "BUTTON") {
            return;
        }
        event.preventDefault();
        startSession();
    }
}

function handleTypingInput() {
    const sanitized = elements.typingInput.value.toLowerCase().replace(/[^a-z]/g, "");

    if (!sanitized && !state.typedBuffer) {
        return;
    }

    if (!state.isPlaying && sanitized.length > 0) {
        startSession();
    }

    if (sanitized === state.typedBuffer) {
        return;
    }

    if (state.typedBuffer.startsWith(sanitized)) {
        state.typedBuffer = sanitized;
        refreshArenaRealtime();
        return;
    }

    if (sanitized.startsWith(state.typedBuffer) && sanitized.length === state.typedBuffer.length + 1) {
        const nextChar = sanitized.charAt(sanitized.length - 1);
        processCharacter(nextChar);
        elements.typingInput.value = state.typedBuffer;
        return;
    }

    elements.typingInput.value = state.typedBuffer;
}

function processCharacter(char) {
    const currentEntry = state.sessionWords[state.currentWordIndex];
    if (!state.isPlaying || !currentEntry) {
        return;
    }

    const expectedChar = currentEntry.en.charAt(state.typedBuffer.length).toLowerCase();
    if (!expectedChar) {
        return;
    }

    if (char === expectedChar) {
        state.typedBuffer += char;
        state.currentCombo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.currentCombo);
        pulseSound("good");

        if (state.typedBuffer.length === currentEntry.en.length) {
            state.completedCharCount += currentEntry.en.length;
            state.currentWordIndex += 1;
            state.typedBuffer = "";

            if (state.currentWordIndex >= state.sessionWords.length) {
                completeSession();
                return;
            }
        }
    } else {
        state.errorCount += 1;
        state.currentCombo = 0;
        state.wrongFlash = {
            wordIndex: state.currentWordIndex,
            charIndex: state.typedBuffer.length,
            at: Date.now()
        };
        pulseSound("bad");
    }

    refreshArenaRealtime();
}

function completeSession() {
    state.isPlaying = false;
    stopTimer();
    elements.typingInput.value = "";

    const result = buildResult();
    state.lastResult = result;
    state.resultSyncText = "成绩已写入本地历史，正在同步排行榜…";
    saveHistory(result);
    refreshAllStatic();
    refreshArenaRealtime();
    elements.resultRank.scrollIntoView({ behavior: "smooth", block: "center" });
    syncResult(result);
}

async function syncResult(result) {
    try {
        const syncMode = await leaderboard.submitScore(result);
        state.resultSyncText = syncMode === "cloud"
            ? "已同步到云端排行榜，同时更新了本地最佳成绩。"
            : "已更新本地排行榜；云端未启用或本次没有刷新个人最佳。";
    } catch (error) {
        state.resultSyncText = "成绩已保存在本地，云端同步失败。";
        console.error("TypeQuest sync failed:", error);
    }

    refreshMissionSummary();
    refreshArenaStatic();
    populateResultScreen();
}

function buildResult() {
    const wpm = getCurrentWpm();
    const accuracy = getCurrentAccuracy();
    const rank = calculateRank(wpm, accuracy);

    return {
        username: leaderboard.getUsername(),
        wpm,
        accuracy,
        book: state.currentBook,
        combo: state.bestCombo,
        rank: rank.grade,
        difficulty: state.currentDifficulty,
        wordCount: state.sessionWords.length,
        date: formatDate(new Date()),
        timestamp: Date.now()
    };
}

function populateResultScreen() {
    if (!state.lastResult) {
        elements.resultRank.textContent = "A";
        elements.resultMessage.textContent = "完成一轮训练后，这里会显示你的结算信息。";
        elements.resultWpm.textContent = "0";
        elements.resultAccuracy.textContent = "0%";
        elements.resultCombo.textContent = "0";
        elements.resultWordCount.textContent = "0";
        elements.resultSyncStatus.textContent = "成绩会先写入本地历史。";
        return;
    }

    elements.resultRank.textContent = state.lastResult.rank;
    elements.resultMessage.textContent = getResultMessage(state.lastResult.rank);
    elements.resultWpm.textContent = String(state.lastResult.wpm);
    elements.resultAccuracy.textContent = `${state.lastResult.accuracy}%`;
    elements.resultCombo.textContent = String(state.lastResult.combo);
    elements.resultWordCount.textContent = String(state.lastResult.wordCount);
    elements.resultSyncStatus.textContent = state.resultSyncText;
}

function refreshSyncStatus() {
    const isCloudReady = Boolean(leaderboard.useFirebase);
    elements.syncStatus.textContent = isCloudReady
        ? "云端榜单可用，最佳成绩会自动同步"
        : "当前为本地优先模式，成绩依然会完整保存";
    elements.syncStatus.className = `status-pill ${isCloudReady ? "status-cloud" : "status-local"}`;
    elements.soundToggleButton.textContent = `音效：${state.soundEnabled ? "开" : "关"}`;
}

function syncUsername() {
    if (!leaderboard.getUsername()) {
        leaderboard.setUsername("匿名玩家");
    }
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    trainStorage.setItem(STORAGE_KEYS.soundEnabled, String(state.soundEnabled));
    refreshSyncStatus();
}

function pulseSound(type) {
    if (!state.soundEnabled || (typeof window.AudioContext === "undefined" && typeof window.webkitAudioContext === "undefined")) {
        return;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!pulseSound.audioCtx) {
        pulseSound.audioCtx = new AudioCtor();
    }

    const ctx = pulseSound.audioCtx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    oscillator.type = "triangle";
    oscillator.frequency.value = type === "good" ? 660 : 210;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(type === "good" ? 0.045 : 0.03, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.13);
}

function createSessionWords(bookKey, difficultyKey) {
    const meta = DIFFICULTY_META[difficultyKey];
    const sourceWords = [...(vocabularyBooks[bookKey] || [])];
    const filtered = sourceWords.filter((entry) => (entry.difficulty || 1) <= meta.maxDifficulty);
    const workingSet = filtered.length >= meta.count ? filtered : sourceWords;
    const shuffled = shuffleWords(workingSet, difficultyKey === "daily" ? dailySeed(bookKey) : Date.now());
    return shuffled.slice(0, Math.min(meta.count, shuffled.length));
}

function shuffleWords(words, seed) {
    const list = [...words];
    const random = mulberry32(seed);
    for (let index = list.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
    }
    return list;
}

function mulberry32(seed) {
    let value = seed >>> 0;
    return function random() {
        value += 0x6d2b79f5;
        let current = Math.imul(value ^ value >>> 15, 1 | value);
        current ^= current + Math.imul(current ^ current >>> 7, 61 | current);
        return ((current ^ current >>> 14) >>> 0) / 4294967296;
    };
}

function dailySeed(bookKey) {
    const now = new Date();
    const dateToken = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
    return hashString(`${dateToken}:${bookKey}`);
}

function hashString(input) {
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(index);
        hash |= 0;
    }
    return hash >>> 0;
}

function loadHistory() {
    try {
        return JSON.parse(trainStorage.getItem(STORAGE_KEYS.history) || "[]");
    } catch (error) {
        console.error("TypeQuest history parse failed:", error);
        return [];
    }
}

function saveHistory(result) {
    const history = loadHistory();
    history.unshift(result);
    trainStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 120)));
}

function getLocalBestForBook(bookKey) {
    const records = loadHistory().filter((entry) => entry.book === bookKey);
    if (!records.length) {
        return null;
    }
    return records.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)[0];
}

function getCurrentAccuracy() {
    const correctChars = state.completedCharCount + state.typedBuffer.length;
    const total = correctChars + state.errorCount;
    if (!total) {
        return 100;
    }
    return Math.max(0, Math.round((correctChars / total) * 100));
}

function getCurrentWpm() {
    if (!state.startTime) {
        return 0;
    }
    const minutes = Math.max((Date.now() - state.startTime) / 60000, 1 / 60000);
    const totalUnits = (state.completedCharCount + state.typedBuffer.length) / 5;
    return Math.max(0, Math.round(totalUnits / minutes));
}

function getElapsedMs() {
    if (!state.startTime) {
        return 0;
    }
    return Date.now() - state.startTime;
}

function startTimer() {
    stopTimer();
    state.timerId = window.setInterval(() => {
        refreshArenaRealtime();
    }, 200);
}

function stopTimer() {
    if (state.timerId) {
        window.clearInterval(state.timerId);
        state.timerId = null;
    }
}

function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function formatDate(date) {
    return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(date);
}

function calculateRank(wpm, accuracy) {
    if (wpm >= 95 && accuracy >= 97) {
        return { grade: "SS" };
    }
    if (wpm >= 75 && accuracy >= 93) {
        return { grade: "S" };
    }
    if (wpm >= 58 && accuracy >= 88) {
        return { grade: "A" };
    }
    if (wpm >= 40 && accuracy >= 80) {
        return { grade: "B" };
    }
    return { grade: "C" };
}

function getResultMessage(rank) {
    const copy = {
        SS: "速度和准确率都压得很稳，这一轮已经接近竞速状态。",
        S: "节奏非常顺，继续保持准确率，下一轮可以冲更高速度。",
        A: "整体很扎实，已经具备持续提升的基础。",
        B: "完成度不错，下一步优先把误击压下去。",
        C: "这轮更像摸底，建议先用热身模式找回手感。"
    };
    return copy[rank] || copy.C;
}

function getStageHint(currentWord) {
    if (!state.isPlaying) {
        return "点击开始训练后，在输入框里持续输入当前单词。";
    }
    if (!currentWord) {
        return "所有词都已完成。";
    }
    return `保持节奏，当前目标词长度 ${currentWord.en.length}。`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

init();
