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

const FLOW_STEPS = [
    { key: "overview", label: "总览", detail: "入口与摘要" },
    { key: "difficulty", label: "难度", detail: "校准强度" },
    { key: "book", label: "词书", detail: "锁定词包" },
    { key: "briefing", label: "简报", detail: "确认任务" },
    { key: "arena", label: "训练", detail: "进入训练舱" },
    { key: "result", label: "结算", detail: "查看结果" }
];

const SCREEN_META = {
    overview: { title: "任务总览", detail: "先查看配置和数据，再决定进入哪一个独立界面。" },
    difficulty: { title: "步骤 1 / 选择训练强度", detail: "先决定这一轮要打多少词、允许多高难度，再进入词书页。" },
    book: { title: "步骤 2 / 选择词书", detail: "把目标考试或学习场景锁定，再生成这一轮的任务内容。" },
    briefing: { title: "步骤 3 / 任务简报", detail: "确认配置、本地最佳和词包规模，然后进入训练舱。" },
    arena: { title: "步骤 4 / 训练舱", detail: "开始输入，系统会实时计算速度、准确率和连击。" },
    result: { title: "步骤 5 / 结算面板", detail: "查看成绩，再决定继续训练还是转去历史页和排行榜页。" },
    history: { title: "成绩历史页", detail: "这里集中展示本地历史成绩，并支持导出和清空。" },
    leaderboard: { title: "排行榜页", detail: "这里展示本地最佳与云端榜单，并支持按词书过滤。" },
    profile: { title: "玩家档案页", detail: "这里管理昵称，并查看本地设备上的累计最佳表现。" }
};

const UTILITY_SCREENS = new Set(["history", "leaderboard", "profile"]);

const state = {
    currentBook: localStorage.getItem(STORAGE_KEYS.currentBook) || "cet4",
    currentDifficulty: localStorage.getItem(STORAGE_KEYS.currentDifficulty) || "normal",
    currentScreen: "overview",
    utilityReturnScreen: "overview",
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
    leaderboardType: "local",
    leaderboardFilter: "all",
    soundEnabled: localStorage.getItem(STORAGE_KEYS.soundEnabled) !== "false",
    wrongFlash: null,
    timerId: null
};

const elements = {};
const screenElements = {};

function init() {
    cacheElements();
    buildJourneySteps();
    buildDifficultyControls();
    buildBookControls();
    buildLeaderboardControls();
    bindEvents();
    prepareSession();
    syncUsername();
    refreshAllStatic();
    refreshArenaRealtime();
    showScreen("overview");
}

function cacheElements() {
    [
        "navHomeButton", "navProfileButton", "navHistoryButton", "navLeaderboardButton", "headerUsername",
        "journeySteps", "journeyLabel", "journeyDetail",
        "overviewStartButton", "overviewStartButtonSecondary", "overviewProfileButton", "overviewHistoryButton",
        "overviewHistoryButtonSecondary", "overviewLeaderboardButton",
        "metricBooks", "metricWords", "metricBestWpm", "metricRuns",
        "overviewCurrentBook", "overviewCurrentDifficulty", "overviewCurrentWords", "overviewCurrentBest", "recentRuns",
        "difficultyControls", "difficultySummaryLabel", "difficultySummaryCount", "difficultyBackButton", "difficultyNextButton",
        "bookControls", "bookSummaryLabel", "bookSummaryNote", "bookPackCount", "bookBackButton", "bookNextButton",
        "briefingDifficulty", "briefingBook", "briefingWordCount", "briefingLocalBest", "briefingBookNote",
        "briefingPackCount", "briefingAverageDifficulty", "briefingRecentRuns", "briefingBackButton", "briefingEnterArenaButton",
        "syncStatus", "soundToggleButton", "arenaStepLabel", "progressText", "translationLabel", "focusBookLabel",
        "progressBar", "typingStage", "stageBadge", "stageHint", "wordRack", "focusWord", "focusDifficultyLabel",
        "selectedWordCount", "typingInput", "startButton", "resetButton", "arenaBackButton", "arenaHomeButton",
        "statWpm", "statAccuracy", "statCombo", "statTime", "bookDescription", "localBestInline", "selectedSyncMode",
        "resultRank", "resultMessage", "resultWpm", "resultAccuracy", "resultCombo", "resultWordCount",
        "resultSyncStatus", "resultPlayAgainButton", "resultReturnBriefingButton", "resultHomeButton",
        "resultHistoryButton", "resultLeaderboardButton",
        "historyReturnButton", "historyRuns", "historyBestWpm", "historyAverageAccuracy", "historyWordCount", "historyRows",
        "exportButton", "clearHistoryButton",
        "leaderboardReturnButton", "leaderboardTypeControls", "leaderboardFilterControls", "personalBestText",
        "leaderboardStatusText", "leaderboardRows",
        "profileReturnButton", "profileNameInput", "saveProfileButton", "profileRuns", "profileBestWpm",
        "profileAverageAccuracy", "profileWords", "profileBestRows"
    ].forEach((id) => {
        elements[id] = document.getElementById(id);
    });

    document.querySelectorAll(".screen-view").forEach((screen) => {
        screenElements[screen.dataset.screen] = screen;
    });
}

function buildJourneySteps() {
    elements.journeySteps.innerHTML = FLOW_STEPS.map((step, index) => `
        <button class="journey-step" type="button" data-flow-step="${step.key}">
            <span class="journey-step-index">${String(index + 1).padStart(2, "0")}</span>
            <strong>${step.label}</strong>
            <small>${step.detail}</small>
        </button>
    `).join("");
}

function buildDifficultyControls() {
    elements.difficultyControls.innerHTML = Object.entries(DIFFICULTY_META).map(([key, meta]) => `
        <button class="chip-button ${key === state.currentDifficulty ? "is-active" : ""}" type="button" data-difficulty="${key}">
            <strong>${meta.label}</strong>
            <small>${meta.subtitle}</small>
        </button>
    `).join("");
}

function buildBookControls() {
    elements.bookControls.innerHTML = Object.entries(BOOK_META).map(([key, meta]) => `
        <button class="book-button ${key === state.currentBook ? "is-active" : ""}" type="button" data-book="${key}">
            <strong>${meta.label}</strong>
            <small>${meta.note}</small>
        </button>
    `).join("");
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
}

function bindEvents() {
    elements.navHomeButton.addEventListener("click", () => navigateTo("overview"));
    elements.navProfileButton.addEventListener("click", () => openUtilityScreen("profile"));
    elements.navHistoryButton.addEventListener("click", () => openUtilityScreen("history"));
    elements.navLeaderboardButton.addEventListener("click", () => openUtilityScreen("leaderboard"));

    elements.overviewStartButton.addEventListener("click", () => navigateTo("difficulty"));
    elements.overviewStartButtonSecondary.addEventListener("click", () => navigateTo("difficulty"));
    elements.overviewProfileButton.addEventListener("click", () => openUtilityScreen("profile"));
    elements.overviewHistoryButton.addEventListener("click", () => openUtilityScreen("history"));
    elements.overviewHistoryButtonSecondary.addEventListener("click", () => openUtilityScreen("history"));
    elements.overviewLeaderboardButton.addEventListener("click", () => openUtilityScreen("leaderboard"));

    elements.difficultyBackButton.addEventListener("click", () => navigateTo("overview"));
    elements.difficultyNextButton.addEventListener("click", () => navigateTo("book"));
    elements.bookBackButton.addEventListener("click", () => navigateTo("difficulty"));
    elements.bookNextButton.addEventListener("click", () => navigateTo("briefing"));
    elements.briefingBackButton.addEventListener("click", () => navigateTo("book"));
    elements.briefingEnterArenaButton.addEventListener("click", enterArena);

    elements.startButton.addEventListener("click", startSession);
    elements.resetButton.addEventListener("click", resetSession);
    elements.arenaBackButton.addEventListener("click", () => leaveArenaTo("briefing"));
    elements.arenaHomeButton.addEventListener("click", () => leaveArenaTo("overview"));
    elements.soundToggleButton.addEventListener("click", toggleSound);
    elements.typingStage.addEventListener("click", focusTypingInput);
    elements.typingInput.addEventListener("focus", focusTypingInput);
    elements.typingInput.addEventListener("input", handleTypingInput);

    elements.resultPlayAgainButton.addEventListener("click", enterArena);
    elements.resultReturnBriefingButton.addEventListener("click", () => navigateTo("briefing"));
    elements.resultHomeButton.addEventListener("click", () => navigateTo("overview"));
    elements.resultHistoryButton.addEventListener("click", () => openUtilityScreen("history"));
    elements.resultLeaderboardButton.addEventListener("click", () => openUtilityScreen("leaderboard"));

    elements.historyReturnButton.addEventListener("click", returnFromUtilityScreen);
    elements.leaderboardReturnButton.addEventListener("click", returnFromUtilityScreen);
    elements.profileReturnButton.addEventListener("click", returnFromUtilityScreen);
    elements.exportButton.addEventListener("click", exportHistory);
    elements.clearHistoryButton.addEventListener("click", clearHistory);
    elements.saveProfileButton.addEventListener("click", saveProfileName);
    elements.profileNameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            saveProfileName();
        }
    });

    elements.difficultyControls.addEventListener("click", (event) => handleDifficultySelection(event));
    elements.bookControls.addEventListener("click", (event) => handleBookSelection(event));
    elements.leaderboardTypeControls.addEventListener("click", (event) => handleLeaderboardTypeSelection(event));
    elements.leaderboardFilterControls.addEventListener("click", (event) => handleLeaderboardFilterSelection(event));
    elements.journeySteps.addEventListener("click", (event) => handleJourneySelection(event));

    document.addEventListener("keydown", handleGlobalKeydown);
}

function handleDifficultySelection(event) {
    const button = event.target.closest("[data-difficulty]");
    if (!button) {
        return;
    }

    state.currentDifficulty = button.dataset.difficulty;
    localStorage.setItem(STORAGE_KEYS.currentDifficulty, state.currentDifficulty);
    prepareSession();
    updateDifficultyControlState();
    refreshAllStatic();
}

function handleBookSelection(event) {
    const button = event.target.closest("[data-book]");
    if (!button) {
        return;
    }

    state.currentBook = button.dataset.book;
    localStorage.setItem(STORAGE_KEYS.currentBook, state.currentBook);
    prepareSession();
    updateBookControlState();
    refreshAllStatic();
}

async function handleLeaderboardTypeSelection(event) {
    const button = event.target.closest("[data-lb-type]");
    if (!button) {
        return;
    }

    state.leaderboardType = button.dataset.lbType;
    updateLeaderboardControlState();
    await loadLeaderboard();
}

async function handleLeaderboardFilterSelection(event) {
    const button = event.target.closest("[data-lb-filter]");
    if (!button) {
        return;
    }

    state.leaderboardFilter = button.dataset.lbFilter;
    updateLeaderboardControlState();
    await loadLeaderboard();
}

function handleJourneySelection(event) {
    const button = event.target.closest("[data-flow-step]");
    if (!button) {
        return;
    }

    const targetScreen = button.dataset.flowStep;
    if (targetScreen === "result" && !state.lastResult) {
        return;
    }
    if (targetScreen === "arena") {
        enterArena();
        return;
    }
    navigateTo(targetScreen);
}

function updateDifficultyControlState() {
    elements.difficultyControls.querySelectorAll("[data-difficulty]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.difficulty === state.currentDifficulty);
    });
}

function updateBookControlState() {
    elements.bookControls.querySelectorAll("[data-book]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.book === state.currentBook);
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

function showScreen(screenKey) {
    if (!screenElements[screenKey]) {
        return;
    }

    state.currentScreen = screenKey;
    Object.entries(screenElements).forEach(([key, screen]) => {
        screen.classList.toggle("is-active", key === screenKey);
    });

    refreshRouteState();

    if (screenKey === "history") {
        refreshHistoryScreen();
    } else if (screenKey === "profile") {
        refreshProfileScreen();
    } else if (screenKey === "leaderboard") {
        loadLeaderboard();
    } else if (screenKey === "arena") {
        refreshArenaStatic();
        refreshArenaRealtime();
        focusTypingInput();
    } else if (screenKey === "result") {
        populateResultScreen();
    }
}

function navigateTo(screenKey) {
    if (state.currentScreen === "arena" && screenKey !== "arena" && !leaveArenaGuard()) {
        return;
    }

    if (screenKey === "arena") {
        enterArena();
        return;
    }

    showScreen(screenKey);
}

function openUtilityScreen(screenKey) {
    if (!UTILITY_SCREENS.has(screenKey)) {
        return;
    }

    if (state.currentScreen === "arena" && !leaveArenaGuard()) {
        return;
    }

    state.utilityReturnScreen = state.currentScreen;
    showScreen(screenKey);
}

function returnFromUtilityScreen() {
    showScreen(state.utilityReturnScreen || "overview");
}

function leaveArenaTo(screenKey) {
    if (!leaveArenaGuard()) {
        return;
    }
    showScreen(screenKey);
}

function leaveArenaGuard() {
    if (!hasArenaProgress()) {
        prepareSession();
        refreshAllStatic();
        refreshArenaRealtime();
        return true;
    }

    const shouldLeave = window.confirm("当前训练舱里还有未完成的进度，确认离开并重置这一轮吗？");
    if (!shouldLeave) {
        return false;
    }

    prepareSession();
    refreshAllStatic();
    refreshArenaRealtime();
    return true;
}

function refreshRouteState() {
    const routeMapping = {
        navHomeButton: !UTILITY_SCREENS.has(state.currentScreen),
        navProfileButton: state.currentScreen === "profile",
        navHistoryButton: state.currentScreen === "history",
        navLeaderboardButton: state.currentScreen === "leaderboard"
    };

    Object.entries(routeMapping).forEach(([id, active]) => {
        elements[id].classList.toggle("is-route-active", active);
    });

    const meta = SCREEN_META[state.currentScreen];
    elements.journeyLabel.textContent = meta.title;
    elements.journeyDetail.textContent = meta.detail;

    const currentIndex = FLOW_STEPS.findIndex((step) => step.key === state.currentScreen);
    elements.journeySteps.querySelectorAll("[data-flow-step]").forEach((button, index) => {
        const target = button.dataset.flowStep;
        button.classList.toggle("is-active", currentIndex === index);
        button.classList.toggle("is-complete", currentIndex > index && currentIndex !== -1);
        button.classList.toggle("is-disabled", target === "result" && !state.lastResult);
    });
}

function refreshAllStatic() {
    refreshHeader();
    updateDifficultyControlState();
    updateBookControlState();
    updateLeaderboardControlState();
    refreshOverviewScreen();
    refreshDifficultyScreen();
    refreshBookScreen();
    refreshBriefingScreen();
    refreshArenaStatic();
    refreshProfileScreen();
    refreshHistoryScreen();
    refreshSyncStatus();
    populateResultScreen();
    refreshRouteState();
}

function refreshHeader() {
    elements.headerUsername.textContent = leaderboard.getUsername() || "匿名玩家";
    elements.profileNameInput.value = leaderboard.getUsername() || "";
}

function refreshOverviewScreen() {
    const history = loadHistory();
    const wordTotal = Object.values(vocabularyBooks).reduce((sum, pack) => sum + pack.length, 0);
    const bestWpm = history.length ? Math.max(...history.map((entry) => entry.wpm || 0)) : 0;
    const localBest = getLocalBestForBook(state.currentBook);

    elements.metricBooks.textContent = String(Object.keys(vocabularyBooks).length);
    elements.metricWords.textContent = String(wordTotal);
    elements.metricBestWpm.textContent = String(bestWpm);
    elements.metricRuns.textContent = String(history.length);
    elements.overviewCurrentBook.textContent = BOOK_META[state.currentBook].label;
    elements.overviewCurrentDifficulty.textContent = DIFFICULTY_META[state.currentDifficulty].label;
    elements.overviewCurrentWords.textContent = String(state.sessionWords.length);
    elements.overviewCurrentBest.textContent = localBest ? `${localBest.wpm} WPM / ${localBest.accuracy}%` : "暂无记录";

    renderRecentRuns(elements.recentRuns, 4);
}

function refreshDifficultyScreen() {
    const difficultyMeta = DIFFICULTY_META[state.currentDifficulty];
    elements.difficultySummaryLabel.textContent = difficultyMeta.label;
    elements.difficultySummaryCount.textContent = `${state.sessionWords.length} 词`;
}

function refreshBookScreen() {
    const bookMeta = BOOK_META[state.currentBook];
    const pack = vocabularyBooks[state.currentBook] || [];
    elements.bookSummaryLabel.textContent = bookMeta.label;
    elements.bookSummaryNote.textContent = bookMeta.note;
    elements.bookPackCount.textContent = String(pack.length);
}

function refreshBriefingScreen() {
    const bookMeta = BOOK_META[state.currentBook];
    const difficultyMeta = DIFFICULTY_META[state.currentDifficulty];
    const pack = vocabularyBooks[state.currentBook] || [];
    const averageDifficulty = pack.length
        ? (pack.reduce((sum, entry) => sum + (entry.difficulty || 1), 0) / pack.length).toFixed(1)
        : "0.0";
    const localBest = getLocalBestForBook(state.currentBook);

    elements.briefingDifficulty.textContent = difficultyMeta.label;
    elements.briefingBook.textContent = bookMeta.label;
    elements.briefingWordCount.textContent = String(state.sessionWords.length);
    elements.briefingLocalBest.textContent = localBest ? `${localBest.wpm} WPM / ${localBest.accuracy}%` : "暂无记录";
    elements.briefingBookNote.textContent = `${bookMeta.note} 当前模式会抽取 ${state.sessionWords.length} 个词。`;
    elements.briefingPackCount.textContent = String(pack.length);
    elements.briefingAverageDifficulty.textContent = String(averageDifficulty);

    renderRecentRuns(elements.briefingRecentRuns, 3);
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

function refreshProfileScreen() {
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

    const rows = Object.values(bestByBook).sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy);
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

function refreshHistoryScreen() {
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

async function loadLeaderboard() {
    const username = leaderboard.getUsername();
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
        ? getPersonalBestFromHistory(username, state.leaderboardFilter)
        : await leaderboard.getPersonalBest(username, state.leaderboardFilter);

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
    const records = loadHistory().filter((entry) => (entry.username || "匿名玩家") === username);
    const scoped = filter === "all" ? records : records.filter((entry) => entry.book === filter);
    if (!scoped.length) {
        return null;
    }
    return scoped.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)[0];
}

function refreshSyncStatus() {
    const isCloudReady = Boolean(leaderboard.useFirebase);
    elements.syncStatus.textContent = isCloudReady
        ? "云端榜单可用，最佳成绩会自动同步"
        : "当前为本地优先模式，成绩依然会完整保存";
    elements.syncStatus.className = `status-pill ${isCloudReady ? "status-cloud" : "status-local"}`;
    elements.soundToggleButton.textContent = `音效：${state.soundEnabled ? "开" : "关"}`;
}

function renderRecentRuns(container, limit) {
    const history = loadHistory();
    if (!history.length) {
        container.innerHTML = `<p class="panel-note">还没有训练记录。完成一轮后，这里会自动积累你的最近成绩。</p>`;
        return;
    }

    container.innerHTML = history.slice(0, limit).map((entry) => `
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
    state.resultSyncText = "成绩会先写入本地历史。";
    state.wrongFlash = null;
    stopTimer();
    elements.typingInput.value = "";
}

function resetSession() {
    prepareSession();
    refreshAllStatic();
    refreshArenaRealtime();
    if (state.currentScreen === "arena") {
        focusTypingInput();
    }
}

function enterArena() {
    prepareSession();
    refreshAllStatic();
    refreshArenaRealtime();
    showScreen("arena");
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
    if (state.currentScreen !== "arena") {
        return;
    }

    elements.typingInput.focus();
    const length = elements.typingInput.value.length;
    elements.typingInput.setSelectionRange(length, length);
}

function handleGlobalKeydown(event) {
    if (event.key === "Escape") {
        if (UTILITY_SCREENS.has(state.currentScreen)) {
            event.preventDefault();
            returnFromUtilityScreen();
            return;
        }

        if (state.currentScreen === "result") {
            event.preventDefault();
            navigateTo("overview");
            return;
        }
    }

    if (state.currentScreen === "arena" && event.key === "Enter" && document.activeElement !== elements.profileNameInput) {
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

    const result = buildResult();
    state.lastResult = result;
    state.resultSyncText = "成绩已写入本地历史，正在同步排行榜…";
    saveHistory(result);
    refreshAllStatic();
    showScreen("result");
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

    populateResultScreen();
    refreshOverviewScreen();
    refreshBriefingScreen();
    refreshProfileScreen();
    refreshHistoryScreen();
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

function syncUsername() {
    if (!leaderboard.getUsername()) {
        leaderboard.setUsername("匿名玩家");
    }
}

function saveProfileName() {
    const previousUsername = leaderboard.getUsername() || "匿名玩家";
    const nextValue = elements.profileNameInput.value.trim().slice(0, 20);
    const nextUsername = leaderboard.setUsername(nextValue || "匿名玩家");

    if (previousUsername !== nextUsername) {
        migrateLocalUsername(previousUsername, nextUsername);
    }

    refreshAllStatic();
}

function migrateLocalUsername(previousUsername, nextUsername) {
    const updatedHistory = loadHistory().map((entry) => {
        const currentName = entry.username || previousUsername;
        return currentName === previousUsername ? { ...entry, username: nextUsername } : entry;
    });
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(updatedHistory));

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
    state.lastResult = null;
    refreshAllStatic();
    if (state.currentScreen === "leaderboard") {
        loadLeaderboard();
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

function hasArenaProgress() {
    return state.isPlaying || state.currentWordIndex > 0 || state.typedBuffer.length > 0 || state.errorCount > 0;
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
