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

const state = {
    currentBook: localStorage.getItem(STORAGE_KEYS.currentBook) || "cet4",
    currentDifficulty: localStorage.getItem(STORAGE_KEYS.currentDifficulty) || "normal",
    sessionWords: [],
    currentWordIndex: 0,
    typedBuffer: "",
    errorCount: 0,
    currentCombo: 0,
    bestCombo: 0,
    completedCharCount: 0,
    startTime: null,
    isPlaying: false,
    pendingResult: null,
    resultSyncText: "成绩已写入本地历史。",
    leaderboardType: "local",
    leaderboardFilter: "all",
    soundEnabled: localStorage.getItem(STORAGE_KEYS.soundEnabled) !== "false",
    wrongFlash: null,
    timerId: null
};

const elements = {};

function init() {
    cacheElements();
    buildDifficultyControls();
    buildBookControls();
    buildLeaderboardControls();
    bindEvents();
    prepareSession();
    syncUsername();
    refreshAll();
    refreshRecentRuns();
}

function cacheElements() {
    [
        "headerUsername",
        "leaderboardQuickButton",
        "profileButton",
        "heroStartButton",
        "heroHistoryButton",
        "metricBooks",
        "metricWords",
        "metricBestWpm",
        "metricRuns",
        "syncStatus",
        "soundToggleButton",
        "difficultyControls",
        "bookControls",
        "progressText",
        "translationLabel",
        "focusBookLabel",
        "progressBar",
        "typingStage",
        "stageBadge",
        "stageHint",
        "wordRack",
        "focusWord",
        "focusDifficultyLabel",
        "selectedWordCount",
        "typingInput",
        "startButton",
        "resetButton",
        "leaderboardButton",
        "historyButton",
        "statWpm",
        "statAccuracy",
        "statCombo",
        "statTime",
        "packSummary",
        "bookDescription",
        "localBestInline",
        "selectedSyncMode",
        "recentRuns",
        "exportButton",
        "clearHistoryButton",
        "profileModal",
        "profileNameInput",
        "saveProfileButton",
        "profileRuns",
        "profileBestWpm",
        "profileAverageAccuracy",
        "profileWords",
        "profileBestRows",
        "leaderboardModal",
        "leaderboardTypeControls",
        "leaderboardFilterControls",
        "personalBestText",
        "leaderboardStatusText",
        "leaderboardRows",
        "historyModal",
        "historyRuns",
        "historyBestWpm",
        "historyAverageAccuracy",
        "historyWordCount",
        "historyRows",
        "resultModal",
        "resultRank",
        "resultMessage",
        "resultWpm",
        "resultAccuracy",
        "resultCombo",
        "resultWordCount",
        "resultSyncStatus",
        "playAgainButton",
        "resultLeaderboardButton"
    ].forEach((id) => {
        elements[id] = document.getElementById(id);
    });
}

function bindEvents() {
    elements.heroStartButton.addEventListener("click", startSession);
    elements.startButton.addEventListener("click", startSession);
    elements.resetButton.addEventListener("click", resetSession);
    elements.historyButton.addEventListener("click", openHistoryModal);
    elements.heroHistoryButton.addEventListener("click", openHistoryModal);
    elements.leaderboardButton.addEventListener("click", openLeaderboardModal);
    elements.leaderboardQuickButton.addEventListener("click", openLeaderboardModal);
    elements.resultLeaderboardButton.addEventListener("click", () => {
        closeModal("resultModal");
        openLeaderboardModal();
    });
    elements.profileButton.addEventListener("click", openProfileModal);
    elements.saveProfileButton.addEventListener("click", saveProfileName);
    elements.exportButton.addEventListener("click", exportHistory);
    elements.clearHistoryButton.addEventListener("click", clearHistory);
    elements.playAgainButton.addEventListener("click", () => {
        closeModal("resultModal");
        resetSession();
        startSession();
    });
    elements.soundToggleButton.addEventListener("click", toggleSound);
    elements.typingStage.addEventListener("click", focusTypingInput);
    elements.typingInput.addEventListener("focus", focusTypingInput);
    elements.typingInput.addEventListener("input", handleTypingInput);
    elements.profileNameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            saveProfileName();
        }
    });

    document.querySelectorAll("[data-close-modal]").forEach((button) => {
        button.addEventListener("click", () => closeModal(button.dataset.closeModal));
    });

    document.querySelectorAll(".modal-shell").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    document.addEventListener("keydown", handleGlobalKeydown);
}

function buildDifficultyControls() {
    elements.difficultyControls.innerHTML = Object.entries(DIFFICULTY_META).map(([key, meta]) => `
        <button class="chip-button ${key === state.currentDifficulty ? "is-active" : ""}" type="button" data-difficulty="${key}">
            <strong>${meta.label}</strong>
            <small>${meta.subtitle}</small>
        </button>
    `).join("");

    elements.difficultyControls.querySelectorAll("[data-difficulty]").forEach((button) => {
        button.addEventListener("click", () => {
            state.currentDifficulty = button.dataset.difficulty;
            localStorage.setItem(STORAGE_KEYS.currentDifficulty, state.currentDifficulty);
            prepareSession();
            refreshAll();
            focusTypingInput();
        });
    });
}

function buildBookControls() {
    elements.bookControls.innerHTML = Object.entries(BOOK_META).map(([key, meta]) => `
        <button class="book-button ${key === state.currentBook ? "is-active" : ""}" type="button" data-book="${key}">
            <strong>${meta.label}</strong>
            <small>${meta.note}</small>
        </button>
    `).join("");

    elements.bookControls.querySelectorAll("[data-book]").forEach((button) => {
        button.addEventListener("click", () => {
            state.currentBook = button.dataset.book;
            localStorage.setItem(STORAGE_KEYS.currentBook, state.currentBook);
            prepareSession();
            refreshAll();
            focusTypingInput();
        });
    });
}

function buildLeaderboardControls() {
    const typeOptions = [
        { key: "local", label: "本地最佳", subtitle: "当前浏览器记录" },
        { key: "global", label: "云端榜单", subtitle: "Firebase 可用时显示" }
    ];

    elements.leaderboardTypeControls.innerHTML = typeOptions.map((option) => `
        <button class="chip-button ${option.key === state.leaderboardType ? "is-active" : ""}" type="button" data-lb-type="${option.key}">
            <strong>${option.label}</strong>
            <small>${option.subtitle}</small>
        </button>
    `).join("");

    elements.leaderboardFilterControls.innerHTML = [
        { key: "all", label: "全部" },
        ...Object.entries(BOOK_META).map(([key, meta]) => ({ key, label: meta.label }))
    ].map((option) => `
        <button class="chip-button ${option.key === state.leaderboardFilter ? "is-active" : ""}" type="button" data-lb-filter="${option.key}">
            <strong>${option.label}</strong>
        </button>
    `).join("");

    elements.leaderboardTypeControls.querySelectorAll("[data-lb-type]").forEach((button) => {
        button.addEventListener("click", async () => {
            state.leaderboardType = button.dataset.lbType;
            updateLeaderboardControlState();
            await loadLeaderboard();
        });
    });

    elements.leaderboardFilterControls.querySelectorAll("[data-lb-filter]").forEach((button) => {
        button.addEventListener("click", async () => {
            state.leaderboardFilter = button.dataset.lbFilter;
            updateLeaderboardControlState();
            await loadLeaderboard();
        });
    });
}

function updateLeaderboardControlState() {
    elements.leaderboardTypeControls.querySelectorAll("[data-lb-type]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.lbType === state.leaderboardType);
    });

    elements.leaderboardFilterControls.querySelectorAll("[data-lb-filter]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.lbFilter === state.leaderboardFilter);
    });
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
    state.pendingResult = null;
    state.resultSyncText = "成绩已写入本地历史。";
    state.wrongFlash = null;
    stopTimer();
    elements.typingInput.value = "";
}

function resetSession() {
    prepareSession();
    refreshAll();
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
        refreshAll();
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
        const openModalElement = document.querySelector(".modal-shell.is-open");
        if (openModalElement) {
            closeModal(openModalElement.id);
            return;
        }
    }

    if (document.querySelector(".modal-shell.is-open")) {
        return;
    }

    if (event.key === "Enter" && document.activeElement !== elements.profileNameInput) {
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
        refreshAll();
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

    refreshAll();
}

function completeSession() {
    state.isPlaying = false;
    stopTimer();

    const result = buildResult();
    saveHistory(result);
    state.pendingResult = result;
    state.resultSyncText = "成绩已写入本地历史，正在同步排行榜…";
    populateResultModal(result);
    refreshAll();
    refreshRecentRuns();
    openModal("resultModal");
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

    elements.resultSyncStatus.textContent = state.resultSyncText;
    refreshRecentRuns();
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

function populateResultModal(result) {
    elements.resultRank.textContent = result.rank;
    elements.resultMessage.textContent = getResultMessage(result.rank);
    elements.resultWpm.textContent = String(result.wpm);
    elements.resultAccuracy.textContent = `${result.accuracy}%`;
    elements.resultCombo.textContent = String(result.combo);
    elements.resultWordCount.textContent = String(result.wordCount);
    elements.resultSyncStatus.textContent = state.resultSyncText;
}

function refreshAll() {
    refreshHeader();
    refreshHeroMetrics();
    refreshLiveStats();
    refreshSessionSummary();
    renderWordRack();
    refreshSyncStatus();
}

function refreshHeader() {
    const username = leaderboard.getUsername();
    elements.headerUsername.textContent = username || "匿名玩家";
    elements.profileNameInput.value = username || "";
}

function refreshHeroMetrics() {
    const history = loadHistory();
    const wordTotal = Object.values(vocabularyBooks).reduce((sum, words) => sum + words.length, 0);
    const bestWpm = history.length ? Math.max(...history.map((entry) => entry.wpm || 0)) : 0;

    elements.metricBooks.textContent = String(Object.keys(vocabularyBooks).length);
    elements.metricWords.textContent = String(wordTotal);
    elements.metricBestWpm.textContent = String(bestWpm);
    elements.metricRuns.textContent = String(history.length);
}

function refreshLiveStats() {
    elements.statWpm.textContent = String(getCurrentWpm());
    elements.statAccuracy.textContent = `${getCurrentAccuracy()}%`;
    elements.statCombo.textContent = String(state.currentCombo);
    elements.statTime.textContent = formatDuration(getElapsedMs());

    const currentWord = state.sessionWords[state.currentWordIndex];
    const progressRatio = state.sessionWords.length ? state.currentWordIndex / state.sessionWords.length : 0;
    elements.progressText.textContent = `${state.currentWordIndex} / ${state.sessionWords.length}`;
    elements.translationLabel.textContent = currentWord ? currentWord.cn : "本轮完成";
    elements.focusBookLabel.textContent = BOOK_META[state.currentBook].label;
    elements.progressBar.style.width = `${Math.min(100, Math.round(progressRatio * 100))}%`;
    elements.focusWord.textContent = currentWord ? currentWord.en : "Mission Complete";
    elements.focusDifficultyLabel.textContent = DIFFICULTY_META[state.currentDifficulty].label;
    elements.selectedWordCount.textContent = `${state.sessionWords.length} 个词`;
    elements.stageBadge.textContent = state.isPlaying ? DIFFICULTY_META[state.currentDifficulty].stage : "待开始";
    elements.stageHint.textContent = getStageHint(currentWord);
}

function refreshSessionSummary() {
    const packWords = vocabularyBooks[state.currentBook] || [];
    const currentMeta = BOOK_META[state.currentBook];
    const difficultyMeta = DIFFICULTY_META[state.currentDifficulty];
    const avgDifficulty = packWords.length
        ? (packWords.reduce((sum, entry) => sum + (entry.difficulty || 1), 0) / packWords.length).toFixed(1)
        : "0.0";
    const localBest = getLocalBestForBook(state.currentBook);

    elements.bookDescription.textContent = currentMeta.note;
    elements.packSummary.textContent = `${currentMeta.label} 当前共 ${packWords.length} 个词，平均难度 ${avgDifficulty}。` +
        `${difficultyMeta.label} 模式会抽取 ${state.sessionWords.length} 个词。`;
    elements.localBestInline.textContent = localBest
        ? `${localBest.wpm} WPM / ${localBest.accuracy}%`
        : "暂无记录";
    elements.selectedSyncMode.textContent = leaderboard.useFirebase ? "本地 + 云端最佳" : "本地优先";
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
    const wrongFlash = state.wrongFlash && Date.now() - state.wrongFlash.at < 240 ? state.wrongFlash : null;

    elements.wordRack.innerHTML = state.sessionWords.slice(start, end).map((entry, localIndex) => {
        const index = start + localIndex;
        const isComplete = index < state.currentWordIndex;
        const isCurrent = index === state.currentWordIndex;
        const cardClass = isComplete ? "is-complete" : isCurrent ? "is-current" : "is-upcoming";
        const renderedChars = entry.en.split("").map((char, charIndex) => {
            const classes = ["word-char"];

            if (isComplete || (isCurrent && charIndex < state.typedBuffer.length)) {
                classes.push("is-correct");
            } else if (isCurrent && charIndex === state.typedBuffer.length) {
                classes.push("is-cursor");
            }

            if (
                wrongFlash &&
                wrongFlash.wordIndex === index &&
                wrongFlash.charIndex === charIndex &&
                isCurrent
            ) {
                classes.push("is-wrong");
            }

            return `<span class="${classes.join(" ")}">${escapeHtml(char)}</span>`;
        }).join("");

        return `
            <article class="word-card ${cardClass}">
                <div class="word-card-header">
                    <span class="word-card-index">${String(index + 1).padStart(2, "0")}</span>
                    <span class="translation-chip">${escapeHtml(entry.cn)}</span>
                </div>
                <div class="word-text">${renderedChars}</div>
            </article>
        `;
    }).join("");
}

function refreshRecentRuns() {
    const history = loadHistory();

    if (!history.length) {
        elements.recentRuns.innerHTML = `<p class="recent-empty">还没有训练记录。先完成一轮，站点会开始积累你的本地数据。</p>`;
    } else {
        elements.recentRuns.innerHTML = history.slice(0, 4).map((entry) => `
            <article class="recent-item">
                <div class="recent-item-top">
                    <span>${escapeHtml((BOOK_META[entry.book] || {}).label || entry.book || "Unknown")}</span>
                    <span>${escapeHtml(entry.date || "-")}</span>
                </div>
                <div class="recent-item-bottom">
                    <strong>${entry.wpm} WPM</strong>
                    <span class="rank-badge">${escapeHtml(entry.rank || "-")}</span>
                </div>
            </article>
        `).join("");
    }

    populateProfileModal();
    populateHistoryModal();
}

function refreshSyncStatus() {
    const isCloudReady = Boolean(leaderboard && leaderboard.useFirebase);
    elements.syncStatus.textContent = isCloudReady
        ? "云端榜单可用，最佳成绩会自动同步"
        : "当前为本地优先模式，成绩依然会完整保存";
    elements.syncStatus.className = `status-pill ${isCloudReady ? "status-cloud" : "status-local"}`;
    elements.soundToggleButton.textContent = `音效：${state.soundEnabled ? "开" : "关"}`;
}

function populateProfileModal() {
    const history = loadHistory();
    const totalRuns = history.length;
    const bestWpm = totalRuns ? Math.max(...history.map((entry) => entry.wpm || 0)) : 0;
    const averageAccuracy = totalRuns
        ? Math.round(history.reduce((sum, entry) => sum + (entry.accuracy || 0), 0) / totalRuns)
        : 0;
    const totalWords = history.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);

    elements.profileRuns.textContent = String(totalRuns);
    elements.profileBestWpm.textContent = String(bestWpm);
    elements.profileAverageAccuracy.textContent = `${averageAccuracy}%`;
    elements.profileWords.textContent = String(totalWords);

    const bestByBook = {};
    history.forEach((entry) => {
        const key = entry.book;
        if (!bestByBook[key] || isBetterRecord(entry, bestByBook[key])) {
            bestByBook[key] = entry;
        }
    });

    const rows = Object.values(bestByBook).sort((a, b) => b.wpm - a.wpm);
    elements.profileBestRows.innerHTML = rows.length
        ? rows.map((entry) => `
            <tr>
                <td>${escapeHtml((BOOK_META[entry.book] || {}).label || entry.book || "-")}</td>
                <td>${entry.wpm}</td>
                <td>${entry.accuracy}%</td>
                <td>${escapeHtml(entry.rank || "-")}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="4">暂无记录</td></tr>`;
}

function populateHistoryModal() {
    const history = loadHistory();
    const totalRuns = history.length;
    const bestWpm = totalRuns ? Math.max(...history.map((entry) => entry.wpm || 0)) : 0;
    const averageAccuracy = totalRuns
        ? Math.round(history.reduce((sum, entry) => sum + (entry.accuracy || 0), 0) / totalRuns)
        : 0;
    const totalWords = history.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);

    elements.historyRuns.textContent = String(totalRuns);
    elements.historyBestWpm.textContent = String(bestWpm);
    elements.historyAverageAccuracy.textContent = `${averageAccuracy}%`;
    elements.historyWordCount.textContent = String(totalWords);

    elements.historyRows.innerHTML = history.length
        ? history.map((entry) => `
            <tr>
                <td>${escapeHtml(entry.date || "-")}</td>
                <td>${escapeHtml(entry.username || "匿名玩家")}</td>
                <td>${escapeHtml((BOOK_META[entry.book] || {}).label || entry.book || "-")}</td>
                <td>${escapeHtml((DIFFICULTY_META[entry.difficulty] || {}).label || entry.difficulty || "-")}</td>
                <td>${entry.wpm}</td>
                <td>${entry.accuracy}%</td>
                <td>${escapeHtml(entry.rank || "-")}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="7">暂无记录</td></tr>`;
}

async function openLeaderboardModal() {
    openModal("leaderboardModal");
    await loadLeaderboard();
}

function openHistoryModal() {
    populateHistoryModal();
    openModal("historyModal");
}

function openProfileModal() {
    populateProfileModal();
    openModal("profileModal");
}

async function loadLeaderboard() {
    const currentUser = leaderboard.getUsername();
    elements.leaderboardStatusText.textContent = "正在加载…";
    elements.leaderboardRows.innerHTML = `<tr><td colspan="6">加载中…</td></tr>`;

    let rows = [];
    try {
        rows = state.leaderboardType === "local"
            ? getLocalLeaderboardRows(state.leaderboardFilter)
            : await leaderboard.getLeaderboard(state.leaderboardFilter, 20);
        elements.leaderboardStatusText.textContent = state.leaderboardType === "local"
            ? "显示当前浏览器的最佳成绩"
            : leaderboard.useFirebase
                ? "显示 Firebase 云端最佳成绩"
                : "Firebase 不可用，当前已回退到本地模式";
    } catch (error) {
        console.error("TypeQuest leaderboard failed:", error);
        rows = getLocalLeaderboardRows(state.leaderboardFilter);
        elements.leaderboardStatusText.textContent = "云端加载失败，已回退到本地成绩";
    }

    const personalBest = state.leaderboardType === "local"
        ? getPersonalBestFromHistory(currentUser, state.leaderboardFilter)
        : await leaderboard.getPersonalBest(currentUser, state.leaderboardFilter);

    elements.personalBestText.textContent = personalBest
        ? `${personalBest.wpm} WPM / ${personalBest.accuracy}% / ${(BOOK_META[personalBest.book] || {}).label || personalBest.book}`
        : "暂无记录";

    elements.leaderboardRows.innerHTML = rows.length
        ? rows.map((entry, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(entry.username || "匿名玩家")}</td>
                <td>${escapeHtml((BOOK_META[entry.book] || {}).label || entry.book || "-")}</td>
                <td>${entry.wpm}</td>
                <td>${entry.accuracy}%</td>
                <td>${escapeHtml(entry.date || "-")}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="6">暂无数据</td></tr>`;
}

function getLocalLeaderboardRows(filter) {
    const history = loadHistory();
    const bestMap = {};

    history.forEach((entry) => {
        if (filter !== "all" && entry.book !== filter) {
            return;
        }

        const key = `${entry.username || "匿名玩家"}::${entry.book || "unknown"}`;
        if (!bestMap[key] || isBetterRecord(entry, bestMap[key])) {
            bestMap[key] = entry;
        }
    });

    return Object.values(bestMap)
        .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
        .slice(0, 20);
}

function getPersonalBestFromHistory(username, filter) {
    const history = loadHistory().filter((entry) => (entry.username || "匿名玩家") === username);
    const scoped = filter === "all" ? history : history.filter((entry) => entry.book === filter);
    if (!scoped.length) {
        return null;
    }

    return scoped.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)[0];
}

function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
}

function saveProfileName() {
    const previousUsername = leaderboard.getUsername() || "匿名玩家";
    const value = elements.profileNameInput.value.trim().slice(0, 20);
    const username = leaderboard.setUsername(value || "匿名玩家");
    if (username !== previousUsername) {
        migrateLocalUsername(previousUsername, username);
    }
    elements.profileNameInput.value = username;
    refreshAll();
    refreshRecentRuns();
}

function syncUsername() {
    if (!leaderboard.getUsername()) {
        leaderboard.setUsername("匿名玩家");
    }
    refreshHeader();
}

function migrateLocalUsername(previousUsername, nextUsername) {
    const history = loadHistory().map((entry) => {
        const currentName = entry.username || previousUsername;
        return currentName === previousUsername ? { ...entry, username: nextUsername } : entry;
    });
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));

    const leaderboardRecords = JSON.parse(localStorage.getItem("typequest_leaderboard") || "[]").map((entry) => {
        const currentName = entry.username || previousUsername;
        return currentName === previousUsername ? { ...entry, username: nextUsername } : entry;
    });
    localStorage.setItem("typequest_leaderboard", JSON.stringify(leaderboardRecords));
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem(STORAGE_KEYS.soundEnabled, String(state.soundEnabled));
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
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || "[]");
    } catch (error) {
        console.error("TypeQuest history parse failed:", error);
        return [];
    }
}

function saveHistory(result) {
    const history = loadHistory();
    history.unshift(result);
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 120)));
}

function clearHistory() {
    if (!window.confirm("确定要清空本地训练历史吗？这个操作不会影响云端榜单。")) {
        return;
    }

    localStorage.removeItem(STORAGE_KEYS.history);
    localStorage.removeItem("typequest_leaderboard");
    refreshAll();
    refreshRecentRuns();
    if (document.querySelector("#historyModal.is-open")) {
        populateHistoryModal();
    }
}

function exportHistory() {
    const history = loadHistory();
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `typequest-history-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
}

function getLocalBestForBook(bookKey) {
    const records = loadHistory().filter((entry) => entry.book === bookKey);
    if (!records.length) {
        return null;
    }

    return records.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)[0];
}

function isBetterRecord(next, current) {
    return next.wpm > current.wpm || (next.wpm === current.wpm && next.accuracy > current.accuracy);
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
        refreshLiveStats();
        renderWordRack();
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
    if (state.pendingResult) {
        return "本轮已结束，可以直接重开或切去看排行榜。";
    }
    if (!state.isPlaying) {
        return "点击“开始训练”或把焦点放到输入框后直接输入。";
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
