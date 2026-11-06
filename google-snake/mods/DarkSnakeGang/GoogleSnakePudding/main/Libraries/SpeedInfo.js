window.SpeedInfo = {};

window.SpeedInfo.make = function () {

    window.isBridge = true; // refreshed from ModeRegistry when trophies exist

    // First game must be CE, the other is the normal game
    const gameIDs = ["o1y9pyk6", "9dow0go1"];
    window.first_time_call = true;
    window.requestsMade = 0;
    // Invalidate in-flight WR/tracking paints when settings change mid-fetch
    let srcQueryId = 0;

    // FastSnakeStats runs-derived WR timelines (preferred over legacy daily/ snapshots)
    const FASTSNAKE_BASE = "https://cdn.jsdelivr.net/gh/DarkSnakeGang/FastSnakeStats@main/time-travel-cache";
    const RUNS_DATES_URL = `${FASTSNAKE_BASE}/metadata/available-dates-runs.json`;
    const TIMELINES_URL = `${FASTSNAKE_BASE}/runs-derived/wr-timelines.json`;

    let timelinesData = null;
    let runsDatesMeta = null;
    let timelinesPromise = null;
    let fssVersion = null; // available-dates-runs.json lastUpdated — only reuse memory if this matches

    // In-memory runs boards for the current FSS publish only
    const runsBoardCache = Object.create(null); // key -> { data, version }
    const runsBoardPromises = Object.create(null);
    const LEVEL_TO_RUNS_FILE = {
        "25": "25_Apples.json",
        "50": "50_Apples.json",
        "100": "100_Apples.json",
        "All": "All_Apples.json",
        "H": "High_Score.json",
    };

    // --- Tab visibility / dirty flush (seamless tab-back) ---
    function isTabHidden() {
        return typeof document !== "undefined" && document.hidden;
    }

    window.markSpeedInfoDirty = function (opts) {
        window._speedInfoNeedsRefresh = true;
        if (opts && opts.src) window._speedInfoSrcNeedsRefresh = true;
    };

    function clearRunsBoardCache() {
        for (const k of Object.keys(runsBoardCache)) delete runsBoardCache[k];
        for (const k of Object.keys(runsBoardPromises)) delete runsBoardPromises[k];
    }

    function goldCacheSettingPrefix(modeKey, count, speed, size) {
        return modeKey + "|" + count + "|" + speed + "|" + size + "|";
    }

    function goldCacheScorePrefix(modeKey, count, speed, size, score) {
        return goldCacheSettingPrefix(modeKey, count, speed, size) + score + "|";
    }

    function pruneSpeedInfoGoldCache(modeKey, count, speed, size) {
        if (!window._speedInfoGoldCache) return;
        if (
            typeof modeKey !== "string" ||
            typeof count !== "number" ||
            typeof speed !== "number" ||
            typeof size !== "number"
        ) {
            return;
        }
        const keep = goldCacheSettingPrefix(modeKey, count, speed, size);
        for (const key of Object.keys(window._speedInfoGoldCache)) {
            if (key.indexOf(keep) !== 0) delete window._speedInfoGoldCache[key];
        }
    }

    function rememberGoldCache(gKey, gold, modeKey, count, speed, size, score) {
        if (!window._speedInfoGoldCache) window._speedInfoGoldCache = {};
        if (
            typeof modeKey === "string" &&
            typeof count === "number" &&
            typeof speed === "number" &&
            typeof size === "number" &&
            score != null
        ) {
            const scorePrefix = goldCacheScorePrefix(modeKey, count, speed, size, score);
            for (const key of Object.keys(window._speedInfoGoldCache)) {
                if (key.indexOf(scorePrefix) === 0 && key !== gKey) {
                    delete window._speedInfoGoldCache[key];
                }
            }
        }
        window._speedInfoGoldCache[gKey] = !!gold;
    }

    function resolveSpeedInfoSettingContext() {
        if (
            window.timeKeeper &&
            (window.timeKeeper.runStarted || window.timeKeeper.playing) &&
            typeof window.timeKeeper.mode === "string" &&
            typeof window.timeKeeper.count === "number"
        ) {
            return {
                modeKey: window.timeKeeper.mode,
                count: window.timeKeeper.count,
                speed: window.timeKeeper.speed,
                size: window.timeKeeper.size,
            };
        }
        if (!window.timeKeeper || typeof window.timeKeeper.getCurrentSetting !== "function") {
            return null;
        }
        try {
            return {
                modeKey:
                    typeof window.timeKeeper.getCurrentMode === "function"
                        ? window.timeKeeper.getCurrentMode()
                        : null,
                count: window.timeKeeper.getCurrentSetting("count"),
                speed: window.timeKeeper.getCurrentSetting("speed"),
                size: window.timeKeeper.getCurrentSetting("size"),
            };
        } catch (e) {
            return null;
        }
    }

    window.flushSpeedInfoIfNeeded = function () {
        if (isTabHidden()) return;
        const needSrc = !!window._speedInfoSrcNeedsRefresh;
        const needPaint = !!window._speedInfoNeedsRefresh;
        if (!needSrc && !needPaint) return;
        window._speedInfoSrcNeedsRefresh = false;
        window._speedInfoNeedsRefresh = false;
        if (needSrc && typeof window.getAllSrc === "function") {
            window.getAllSrc().catch(function (e) {
                console.error("getAllSrc error:", e);
            });
            return;
        }
        if (needPaint && typeof window.SpeedInfoUpdate === "function") {
            window.SpeedInfoUpdate().catch(function (e) {
                console.error("SpeedInfoUpdate error:", e);
            });
        }
    };

    function onTabVisibilityChange() {
        if (isTabHidden()) {
            clearRunsBoardCache();
            const ctx = resolveSpeedInfoSettingContext();
            if (ctx && ctx.modeKey != null) {
                pruneSpeedInfoGoldCache(ctx.modeKey, ctx.count, ctx.speed, ctx.size);
            }
            return;
        }
        window.flushSpeedInfoIfNeeded();
    }

    if (typeof document !== "undefined" && !window._speedInfoVisibilityHooked) {
        window._speedInfoVisibilityHooked = true;
        document.addEventListener("visibilitychange", onTabVisibilityChange);
    }

    // Match FastSnakeStats tally-boards.js (typical dedicated HS modes)
    const TYPICAL_HIGHSCORE_MODES = {
        1: "Wall",
        2: "Portal",
        8: "Key",
        9: "Sokoban",
        10: "Poison",
        12: "Minesweeper",
        13: "Statue",
        15: "Shield",
        17: "Hotdog",
        19: "Gate",
        20: "Bridge",
    };

    // Dedicated main-game High Score categories (Cheese HS was removed from SRC).
    // Non-HS modes submit Tally highscores on Category Extensions instead.
    const TALLY_COUNT = 6;
    const SRC_GAME = "snake_game";
    const SRC_GAME_CE = "snake_game_ce";

    const SRC_LEVEL_BY_MODE = {
        0: "5d7e0vvw", // Classic
        1: "xd13o769", // Wall
        2: "rw6e78gd", // Portal
        3: "rdnq00qd", // Cheese
        4: "nwl2ll0d", // Borderless
        5: "n93mv5nd", // Twin
        6: "z9856279", // Winged
        7: "n93lkxz9", // Yin Yang
        8: "z985kzr9", // Key
        9: "rdn4ej79", // Sokoban
        10: "ldyrq3r9", // Poison
        11: "ldy64pz9", // Dimension
        12: "kwjr0erd", // Minesweeper
        13: "rdqv8kg9", // Statue
        14: "rdqkpgmd", // Light
        15: "xd47pv2d", // Shield
        16: "rdnjgm69", // Arrow
        17: "dqzzvn1d", // Hotdog
        18: "dno527nw", // Magnet
        19: "wkkjnjxw", // Gate
        20: "9x1zey3d", // Bridge
        21: "y9mrvj1w", // Peaceful
    };

    const SRC_IL_CATEGORY = {
        "25": "mke9xe9d",
        "50": "5dw410gk",
        "100": "wk6nwme2",
        "ALL": "n2yov4ed",
        "All": "n2yov4ed",
    };

    const SRC_HS_CATEGORY_BY_MODE = {
        1: "7kj63r42", // Wall
        2: "n2y9g8ed", // Portal
        8: "q25ewmv2", // Key
        9: "xd11gn8d", // Sokoban
        10: "wdmr0lek", // Poison
        12: "ndxr78rd", // Minesweeper
        13: "8249v5nd", // Statue
        15: "02q686jk", // Shield
        17: "mkemx192", // Hotdog
        19: "zd31z3n2", // Gate
        20: "mke3e76d", // Bridge
    };

    // CE "Tally Highscore (non-highscore modes)" mode values (FSS tally-boards.js)
    const CE_TALLY_MODE_BY_MODE = {
        0: "lr3d7n2l", // Classic
        3: "1dknd7jl", // Cheese
        4: "q8k3z7kq", // Borderless
        5: "qyzm4e71", // Twin
        6: "ln8736dl", // Winged
        7: "10vy7e5l", // Yin Yang
        11: "qj7odygq", // Dimension
        14: "q65w7k7l", // Light
        16: "lmoenj41", // Arrow
        18: "1w4j8w5q", // Magnet
    };

    const SRC_COUNT_VAR = "0nwovxdl";
    const SRC_COUNT_VAL = {
        0: "mlnmj661", // 1 Apple
        1: "5q88w7rq", // 3 Apples
        2: "4qyoge3l", // 5 Apples
        3: "qvvpkp7q", // 10 Apples
        4: "qoxx6dxq", // Dice
        5: "1pyp3vg1", // Bomb
        6: "qznw4k2q", // Tally
    };
    const SRC_SIZE_VAR = "p854j77l";
    const SRC_SIZE_VAL = {
        0: "z19gp0jl", // Standard
        1: "81pw5rel", // Small
        2: "p12e0gv1", // Large
    };
    const SRC_IL_SPEED_VAR = "68k1g0yl";
    const SRC_IL_SPEED_VAL = {
        0: "192dxz4q", // Normal
        1: "12v4922q", // Fast
        2: "1py6exn1", // Slow
    };
    const SRC_HS_SPEED_VAR = "0nwomwdl";
    const SRC_HS_SPEED_VAL = {
        0: "xqkkj49q", // Normal
        1: "gq7ej4n1", // Fast
        2: "192d23kq", // Slow
    };

    const CE_TALLY_HS_CATEGORY = "rkl4elqd";
    const CE_SPEED_VAR = "gnx3m4gn";
    const CE_SPEED_VAL = {
        0: "lmo2pr01", // Normal
        1: "1w479v6q", // Fast
        2: "qoxj984q", // Slow
    };
    const CE_SIZE_VAR = "ql6mkzw8";
    const CE_SIZE_VAL = {
        0: "q75ogky1", // Standard
        1: "1gn6gyml", // Small
        2: "qznw4kmq", // Large
    };
    const CE_MODE_VAR = "onvxz158";

    // Match SRC/FastSnakeStats boards: no 100 on Small; Yin Yang has no 50 on Small
    function shouldShowCategory(level, size, mode) {
        if (level === "100" && size === 1) return false;
        if (level === "50" && mode === 7 && size === 1) return false; // Yin Yang: no 50 on Small
        return true;
    }

    // SRC removed Statue Bomb and Statue 10a highscore (non-competitive max-score ties)
    function isRemovedStatueHighscore(mode, count) {
        return mode === 13 && (count === 3 || count === 5); // Statue + 10 Apples or Bomb
    }

    // FSS HS boards: typical HS modes on any count; on Tally every mode except Peaceful/Blender
    function canShowSrcHighscore(mode, count) {
        if (mode === 21 || mode === 22) return false; // Peaceful, Blender
        if (isRemovedStatueHighscore(mode, count)) return false;
        if (TYPICAL_HIGHSCORE_MODES[mode]) return true;
        if (count === TALLY_COUNT) return true;
        return false;
    }

    // Submit link only when SRC has a real board (HS category or CE Tally-HS mode)
    function canSubmitHighscore(mode, count) {
        if (mode === 21 || mode === 22) return false;
        if (isRemovedStatueHighscore(mode, count)) return false;
        if (SRC_HS_CATEGORY_BY_MODE[mode]) return true;
        if (count === TALLY_COUNT && CE_TALLY_MODE_BY_MODE[mode]) return true;
        return false;
    }

    // Personal HS may gold only when SRC/CE has an HS category for this combo
    function canGoldHighscore(mode, count, speed, size) {
        if (!canSubmitHighscore(mode, count)) return false;
        if (size > 2 || count > 6 || speed > 2) return false;
        return true;
    }

    function srcVarPair(varId, valueId) {
        return varId + "." + valueId;
    }

    // Always include defaults (1 Apple / Normal / Standard) so the form matches in-game settings
    function buildSrcSubmitUrl(score, mode, count, speed, size) {
        if (size > 2 || count > 6 || speed > 2) return null;

        if (score === "H") {
            if (!canSubmitHighscore(mode, count)) return null;
            const hsCat = SRC_HS_CATEGORY_BY_MODE[mode];
            if (hsCat) {
                const x = [
                    hsCat,
                    srcVarPair(SRC_COUNT_VAR, SRC_COUNT_VAL[count]),
                    srcVarPair(SRC_HS_SPEED_VAR, SRC_HS_SPEED_VAL[speed]),
                    srcVarPair(SRC_SIZE_VAR, SRC_SIZE_VAL[size]),
                ].join("-");
                return `https://www.speedrun.com/${SRC_GAME}/runs/new?x=${x}`;
            }
            const ceMode = CE_TALLY_MODE_BY_MODE[mode];
            if (count === TALLY_COUNT && ceMode) {
                const x = [
                    CE_TALLY_HS_CATEGORY,
                    srcVarPair(CE_SPEED_VAR, CE_SPEED_VAL[speed]),
                    srcVarPair(CE_SIZE_VAR, CE_SIZE_VAL[size]),
                    srcVarPair(CE_MODE_VAR, ceMode),
                ].join("-");
                return `https://www.speedrun.com/${SRC_GAME_CE}/runs/new?x=${x}`;
            }
            return null;
        }

        const levelId = SRC_LEVEL_BY_MODE[mode];
        const catId = SRC_IL_CATEGORY[score];
        if (!levelId || !catId) return null;

        const x = [
            "l_" + levelId,
            catId,
            srcVarPair(SRC_COUNT_VAR, SRC_COUNT_VAL[count]),
            srcVarPair(SRC_IL_SPEED_VAR, SRC_IL_SPEED_VAL[speed]),
            srcVarPair(SRC_SIZE_VAR, SRC_SIZE_VAL[size]),
        ].join("-");
        return `https://www.speedrun.com/${SRC_GAME}/runs/new?x=${x}`;
    }

    function pbValueHtml(text, score, mode, count, speed, size, gold) {
        const color = gold ? "#FFD700" : "#ADD8E6";
        const url = buildSrcSubmitUrl(score, mode, count, speed, size);
        if (url) {
            return `<a target="_blank" style="text-decoration: none;color:${color} !important;" href="${url}">${text}</a>`;
        }
        if (gold) return `<span style="color:${color} !important">${text}</span>`;
        return text;
    }

    function goldCacheKey(modeKey, count, speed, size, score, displayText) {
        return modeKey + "|" + count + "|" + speed + "|" + size + "|" + score + "|" + displayText;
    }

    // SRC encodes apple count in the duration seconds field (0.187 → 187, 1.234 → 1234)
    function wrHighscoreFromRun(run) {
        if (!run || !run.times) return null;
        if (typeof run.times.primary_t === "number" && isFinite(run.times.primary_t)) {
            return Math.round(run.times.primary_t * 1000 + 1e-6);
        }
        const primary = String(run.times.primary || "");
        const m = primary.match(/PT(?:\d+H)?(?:\d+M)?(\d+(?:\.\d+)?)S/i);
        if (m) return Math.round(parseFloat(m[1]) * 1000 + 1e-6);
        return null;
    }

    function fssModeName(mode, modeKey) {
        if (modeKey && window.ModeRegistry && typeof window.ModeRegistry.labelModeKey === "function") {
            const label = window.ModeRegistry.labelModeKey(modeKey);
            if (label && label.indexOf(",") < 0) return label;
        }
        return window.modeToTxt[mode] && window.modeToTxt[mode].name;
    }

    // Timed: lower ms wins. Highscore: higher apples wins (only when SRC has an HS board). Unheld → gold.
    async function shouldGoldPb(score, mode, count, speed, size, pb, modeKey) {
        if (score === "H") {
            // Must match a real SRC/CE HS category (not merely FSS display rules)
            if (!canGoldHighscore(mode, count, speed, size)) return false;
        }

        const modeName = fssModeName(mode, modeKey);
        const countName = window.countToTxt[count] && window.countToTxt[count].name;
        const speedName = window.speedToTxt[speed] && window.speedToTxt[speed].name;
        const sizeName = window.sizeToTxt[size] && window.sizeToTxt[size].name;
        if (!modeName || !countName || !speedName || !sizeName) return false;

        const categoryName =
            score === "H" ? "High Score" : (score === "ALL" ? "All" : score) + " Apples";
        const cacheKey = `${countName}|${speedName}|${sizeName}|${modeName}|${categoryName}`;

        try {
            const record = await getRecordForKey(cacheKey);
            if (!record.success || !record.runs || !record.runs.length) return true; // unheld
            const wr = record.runs[0];
            if (score === "H") {
                const wrHigh = wrHighscoreFromRun(wr);
                if (wrHigh == null || pb.high == null) return false;
                return Number(pb.high) > wrHigh;
            }
            if (pb.time == null || !wr.times || typeof wr.times.primary_t !== "number") return false;
            const wrMs = Math.round(wr.times.primary_t * 1000 + 1e-6);
            return Number(pb.time) < wrMs;
        } catch (e) {
            if (window.NepDebug) console.error("shouldGoldPb failed:", e);
            return false;
        }
    }

    function sleepFor(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function withCacheBust(url, bust) {
        if (!bust) return url;
        return url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + encodeURIComponent(bust);
    }

    async function getJSON(url, options) {
        const opts = options || {};
        const fetchUrl = withCacheBust(url, opts.bust);
        const res = await fetch(fetchUrl, opts.cache === false ? { cache: "no-store" } : undefined);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${fetchUrl}`);
        return res.json();
    }

    // Binary search: latest WR snapshot on or before `date` (same as FastSnakeStats GitHubCacheFetcher)
    function wrAsOf(timeline, date) {
        if (!timeline || !timeline.length) return [];
        let lo = 0;
        let hi = timeline.length - 1;
        let best = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (timeline[mid].d <= date) {
                best = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return best >= 0 ? timeline[best].runs : [];
    }

    function expandCompactRun(r, date) {
        const isGuest = r.g || String(r.p).indexOf("guest:") === 0;
        return {
            id: r.id,
            date: date,
            weblink: r.w,
            times: { primary: r.t, primary_t: r.pt },
            players: {
                data: [
                    isGuest
                        ? {
                            rel: "guest",
                            name: r.n,
                            "name-style": r.ns || {
                                style: "solid",
                                color: { dark: "#9e9e9e", light: "#9e9e9e" },
                            },
                        }
                        : {
                            rel: "user",
                            id: r.p,
                            names: { international: r.n },
                            weblink: "https://www.speedrun.com/user/" + r.p,
                            "name-style": r.ns || undefined,
                        },
                ],
            },
            values: {},
        };
    }

    async function loadRunsDerived() {
        // Always check FSS metadata — whatever they published is what we use
        let datesMeta;
        try {
            datesMeta = await getJSON(RUNS_DATES_URL, { cache: false });
            window.requestsMade += 1;
        } catch (e) {
            if (timelinesData && runsDatesMeta) {
                const date = runsDatesMeta.availableDates[runsDatesMeta.availableDates.length - 1];
                return { timelines: timelinesData, date };
            }
            throw e;
        }

        if (!datesMeta.availableDates || !datesMeta.availableDates.length) {
            throw new Error("No available dates in runs-derived metadata");
        }

        const version = datesMeta.lastUpdated || datesMeta.availableDates[datesMeta.availableDates.length - 1];

        // Same FSS publish already in memory — reuse it (no time-based expiry)
        if (timelinesData && fssVersion === version) {
            runsDatesMeta = datesMeta;
            const date = datesMeta.availableDates[datesMeta.availableDates.length - 1];
            return { timelines: timelinesData, date };
        }

        if (timelinesPromise) return timelinesPromise;

        const datesMetaForLoad = datesMeta;
        const versionForLoad = version;
        timelinesPromise = (async () => {
            if (window.NepDebug) {
                console.log("Loading FastSnakeStats runs-derived timelines...", versionForLoad);
            }
            const timelines = await getJSON(TIMELINES_URL, { bust: versionForLoad });
            if (!timelines.boards) {
                throw new Error("runs-derived timelines missing boards");
            }
            if (fssVersion && fssVersion !== versionForLoad) {
                for (const k of Object.keys(runsBoardCache)) delete runsBoardCache[k];
            }
            runsDatesMeta = datesMetaForLoad;
            timelinesData = timelines;
            fssVersion = versionForLoad;
            window.requestsMade += 1;
            const date = datesMetaForLoad.availableDates[datesMetaForLoad.availableDates.length - 1];
            if (window.NepDebug) {
                console.log(`Runs-derived ready as of ${date} (${Object.keys(timelines.boards).length} boards, v=${versionForLoad})`);
            }
            return { timelines, date };
        })().finally(() => {
            timelinesPromise = null;
        });

        return timelinesPromise;
    }

    function modeFolderName(modeName) {
        return String(modeName || "").replace(/ /g, "_");
    }

    function getTrackedPlayerName() {
        return (window.pudding_settings && window.pudding_settings.TrackedPlayerName || "").trim();
    }

    function shouldShowWrHolders() {
        return !!(window.pudding_settings && window.pudding_settings.ShowWrHolders) && !getTrackedPlayerName();
    }

    function playerNameFromExpandedRun(run) {
        if (!run || !run.players || !run.players.data || !run.players.data[0]) return "";
        const p = run.players.data[0];
        if (p.rel === "guest") return p.name || "";
        return (p.names && p.names.international) || p.name || "";
    }

    function wrLink(href, text) {
        return `<a target="_blank" style="text-decoration: none;color:#ADD8E6 !important;" href="${href}">${text}</a>`;
    }

    function formatWrRow(label, timeText, weblink, playerName) {
        let html = `${label}: ${wrLink(weblink, timeText)}`;
        if (shouldShowWrHolders() && playerName) {
            html += `<br>${wrLink(weblink, `by ${playerName}`)}`;
        }
        return html;
    }

    function formatTrackRow(label, timeText, weblink) {
        if (!weblink) return `${label}: ${timeText}`;
        return `${label}: ${wrLink(weblink, timeText)}`;
    }

    function formatTimeTSeconds(timeT) {
        if (typeof timeT !== "number" || !isFinite(timeT)) return "None";
        const totalMs = Math.round(timeT * 1000);
        const hours = Math.floor(totalMs / 3600000);
        const minutes = Math.floor((totalMs % 3600000) / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        const milliseconds = totalMs % 1000;
        let convertedTime = "";
        if (hours > 0) convertedTime += hours + "h";
        if (minutes > 0 || hours > 0) convertedTime += minutes + "m";
        convertedTime += seconds + "s";
        if (hours === 0 && milliseconds > 0) {
            convertedTime += String(milliseconds).padStart(3, "0") + "ms";
        }
        if (hours > 0) {
            convertedTime = convertedTime.split("s")[0] + "s";
        }
        return convertedTime;
    }

    async function loadRunsBoard(modeName, level) {
        const file = LEVEL_TO_RUNS_FILE[level];
        if (!file) throw new Error("Unknown level for runs board: " + level);
        await loadRunsDerived();
        const folder = modeFolderName(modeName);
        const cacheKey = `${folder}/${file}`;
        const cached = runsBoardCache[cacheKey];
        if (cached && cached.version === fssVersion) {
            return cached.data;
        }
        if (runsBoardPromises[cacheKey]) return runsBoardPromises[cacheKey];

        const url = `${FASTSNAKE_BASE}/runs/${folder}/${file}`;
        runsBoardPromises[cacheKey] = (async () => {
            const data = await getJSON(url, { bust: fssVersion });
            window.requestsMade += 1;
            runsBoardCache[cacheKey] = { data, version: fssVersion };
            return data;
        })().finally(() => {
            delete runsBoardPromises[cacheKey];
        });
        return runsBoardPromises[cacheKey];
    }

    // Timed: lower timeT wins. High Score encodes apples as duration (0.072 → 72), so higher wins.
    function findBestTrackedRun(boardData, playerName, categoryKey, preferHigher) {
        if (!boardData || !boardData.runs) return null;
        const target = playerName.toLowerCase();
        let best = null;
        for (const run of Object.values(boardData.runs)) {
            if (!run || !run.playerName) continue;
            if (String(run.playerName).toLowerCase() !== target) continue;
            if (run.category !== categoryKey) continue;
            if (typeof run.timeT !== "number") continue;
            if (!best) {
                best = run;
                continue;
            }
            if (preferHigher ? run.timeT > best.timeT : run.timeT < best.timeT) best = run;
        }
        return best;
    }

    // Look up one category key as of the latest runs-derived date
    async function getRecordForKey(cacheKey) {
        const { timelines, date } = await loadRunsDerived();
        const top = wrAsOf(timelines.boards[cacheKey], date);
        return {
            date,
            success: top.length > 0,
            runs: top.map((r) => expandCompactRun(r, date)),
        };
    }

    // Preload timelines (startup / legacy hooks)
    async function getLatestCacheData() {
        const { timelines, date } = await loadRunsDerived();
        return { date, source: "runs-derived", boards: timelines.boards };
    }

    // Legacy function for compatibility (now uses runs-derived)
    window.makeAPIrequest = function (requestURL, callback) {
        if (window.NepDebug) {
            console.log("Legacy API request called, using runs-derived instead");
        }
        getLatestCacheData().then(data => {
            if (callback && typeof callback === "function") {
                callback(data);
            }
        }).catch(error => {
            if (window.NepDebug) {
                console.error("Runs-derived fetch failed:", error);
            }
            if (callback && typeof callback === "function") {
                callback({ data: { runs: [] } });
            }
        });
    }

    // Legacy function for compatibility
    window.getGameDetails = function () {
        if (window.NepDebug) {
            console.log("getGameDetails called - using runs-derived instead");
        }
        getLatestCacheData().catch(error => {
            if (window.NepDebug) {
                console.error("Failed to initialize runs-derived data:", error);
            }
        });
    }

    window.modeToTxt = {
        0: { name: "Classic" },
        1: { name: "Wall" },
        2: { name: "Portal" },
        3: { name: "Cheese" },
        4: { name: "Borderless" },
        5: { name: "Twin" },
        6: { name: "Winged" },
        7: { name: "Yin Yang" },
        8: { name: "Key" },
        9: { name: "Sokoban" },
        10: { name: "Poison" },
        11: { name: "Dimension" },
        12: { name: "Minesweeper" },
        13: { name: "Statue" },
        14: { name: "Light" },
        15: { name: "Shield" },
        16: { name: "Arrow" },
        17: { name: "Hotdog" },
        18: { name: "Magnet" },
        19: { name: "Gate" },
        20: { name: "Bridge" },
        21: { name: "Peaceful" },
        22: { name: "Blender" },
    }

    window.countToTxt = {
        0: { name: "1 Apple" },
        1: { name: "3 Apples" },
        2: { name: "5 Apples" },
        3: { name: "10 Apples" },
        4: { name: "Dice" },
        5: { name: "Bomb" },
        6: { name: "Tally" },
    }

    window.sizeToTxt = {
        0: { name: "Standard" },
        1: { name: "Small" },
        2: { name: "Large" },
    }

    window.speedToTxt = {
        0: { name: "Normal" },
        1: { name: "Fast" },
        2: { name: "Slow" },
    }

    daily_button.addEventListener("click", function() {
        SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e))
        EmptyAll()
      });

    window.getRecordSRC = async function (level) {
        const queryId = srcQueryId;

        if (isTabHidden()) {
            window.markSpeedInfoDirty({ src: true });
            return;
        }

        if(window.daily_challenge){
            EmptyAll();
            return;
        }

        if (!window.pudding_settings.SpeedInfo) {
            // For those that don't want to see speedrun info, to keep the game stable without api calls
            EmptyAll();
            return;
        }

        // Modes list
        CLASSIC = 0
        WALL = 1
        PORTAL = 2
        CHEESE = 3
        BORDERLESS = 4
        TWIN = 5
        WINGED = 6
        YINYANG = 7
        KEY = 8
        SOKO = 9
        POISON = 10
        DIMENSION = 11
        MINESWEEPER = 12
        STATUE = 13
        LIGHT = 14
        SHIELD = 15
        ARROW = 16
        HOTDOG = 17
        MAGNET = 18
        GATE = 19
        BRIDGE = 20
        PEACEFUL = 21
        BLENDER = 22

        // Speed list
        DEFAULT_SPEED = 0
        FAST = 1
        SLOW = 2

        // Count settings
        ONE_APPLE = 0;
        THREE_APPLES = 1;
        FIVE_APPLES = 2;
        TEN_APPLES = 3;
        DICE = 4;
        BOMB = 5;


        let count = window.timeKeeper.getCurrentSetting("count");
        let speed = window.timeKeeper.getCurrentSetting("speed");
        let size = window.timeKeeper.getCurrentSetting("size");
        let mode = window.CurrentModeNum;

        // > 6 = beyond Tally (MoreMenu / custom counts)
        if (size > 2 || count > 6) {
            EmptyAll();
            return;
        }
        if (mode == BLENDER) {
            EmptyAll();
            return;
        }
        if (!shouldShowCategory(level, size, mode)) {
            if (queryId !== srcQueryId) return;
            if (level === "H") HandleHighscore("Empty");
            else if (level === "100") Handle100("Empty");
            else if (level === "50") Handle50("Empty");
            else if (level === "25") Handle25("Empty");
            else if (level === "All") HandleAll("Empty");
            return;
        }
        // Highscore WR: FSS typical HS modes; Tally CE-HS modes on Tally (not Peaceful)
        if (level === "H" && !canShowSrcHighscore(mode, count)) {
            if (queryId !== srcQueryId) return;
            HandleHighscore("Empty");
            return;
        }

        // Build cache key based on FastSnakeStats format
        const modeName = window.modeToTxt[mode].name;
        const countName = window.countToTxt[count].name;
        const speedName = window.speedToTxt[speed].name;
        const sizeName = window.sizeToTxt[size].name;
        
        // Determine category name
        let categoryName;
        if (level === "H") {
            categoryName = "High Score";
        } else {
            categoryName = level + " Apples";
        }

        // Build the cache key in FastSnakeStats format
        const cacheKey = `${countName}|${speedName}|${sizeName}|${modeName}|${categoryName}`;

        if (window.NepDebug) {
            console.log(`Looking for runs-derived key: ${cacheKey}`);
        }

        let recordData;
        try {
            recordData = await getRecordForKey(cacheKey);
        } catch (error) {
            if (window.NepDebug) {
                console.error("Failed to get runs-derived record:", error);
            }
            if (queryId !== srcQueryId) return;
            EmptyAll();
            return;
        }

        if (queryId !== srcQueryId) return;

        if (window.NepDebug) {
            console.log(`Record data for key ${cacheKey}:`, recordData);
        }

        if (!recordData || !recordData.success || !recordData.runs || recordData.runs.length === 0) {
            if (window.NepDebug) {
                console.log(`No successful runs found for key: ${cacheKey}`);
            }
            // Visible boards with no WR yet should show "None" (N/A boards already returned earlier)
            const empty = { data: { runs: [] } };
            switch (level) {
                case "25": Handle25(empty); break;
                case "50": Handle50(empty); break;
                case "100": Handle100(empty); break;
                case "All": HandleAll(empty); break;
                case "H": HandleHighscore(empty); break;
                default: break;
            }
            return;
        }

        // Runs are already expanded objects from runs-derived timelines
        const bestRun = recordData.runs[0];

        if (!bestRun || !bestRun.times || !bestRun.times.primary || !bestRun.weblink) {
            if (window.NepDebug) {
                console.log(`Invalid run data structure for key: ${cacheKey}`, bestRun);
            }
            const empty = { data: { runs: [] } };
            switch (level) {
                case "25": Handle25(empty); break;
                case "50": Handle50(empty); break;
                case "100": Handle100(empty); break;
                case "All": HandleAll(empty); break;
                case "H": HandleHighscore(empty); break;
                default: break;
            }
            return;
        }

        const runData = {
            data: {
                runs: [{
                    run: {
                        times: { primary: bestRun.times.primary },
                        weblink: bestRun.weblink
                    },
                    playerName: playerNameFromExpandedRun(bestRun)
                }]
            }
        };

        if (queryId !== srcQueryId) return;

        switch (level) {
            case "H": HandleHighscore(runData); break;
            case "25": Handle25(runData); break;
            case "50": Handle50(runData); break;
            case "100": Handle100(runData); break;
            case "All": HandleAll(runData); break;
            default:
                if (window.NepDebug) {
                    console.warn(`No handler found for level: ${level}`);
                }
                break;
        }

    }

    //window.getRecordSRC("H");

    function EmptyTracking() {
        for (const id of ["25track", "50track", "100track", "Alltrack", "Htrack"]) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = "";
        }
    }

    function EmptyAll() {
        emp = "Empty"
        Handle25(emp);
        Handle50(emp);
        Handle100(emp);
        HandleAll(emp);
        HandleHighscore(emp);
        EmptyTracking();
        updateSrcAndTrackingVisibility();
    }

    function isBlenderMode() {
        if (window.CurrentModeNum === 22) return true;
        try {
            if (window.timeKeeper && typeof window.timeKeeper.getCurrentMode === "function") {
                return window.timeKeeper.getCurrentMode() === "blender";
            }
        } catch (e) { /* ignore */ }
        return false;
    }

    function updateSrcAndTrackingVisibility() {
        const srcSection = document.getElementById("src-section");
        const trackSection = document.getElementById("tracking-section");
        const label = document.getElementById("tracking-label");
        const hideSrc = isBlenderMode() || !!window.daily_challenge;

        if (srcSection) {
            srcSection.style.display = hideSrc ? "none" : "block";
        }
        if (!trackSection) return;

        if (hideSrc) {
            trackSection.style.display = "none";
            EmptyTracking();
            return;
        }

        const name = getTrackedPlayerName();
        if (name) {
            trackSection.style.display = "block";
            if (label) label.textContent = `Tracking: ${name}`;
        } else {
            trackSection.style.display = "none";
            EmptyTracking();
        }
    }

    function updateTrackingSectionVisibility() {
        updateSrcAndTrackingVisibility();
    }

    window.refreshTrackedPlayerUi = function () {
        updateTrackingSectionVisibility();
    };

    window.buildSpeedInfoTrackingControls = function () {
        const btnColor = window.button_color || "#1155CC";
        const section = document.createElement("div");
        section.className = "speedinfo-tracking-controls";
        section.style.cssText =
            "margin:12px 0 0;padding:12px 0 0;border-top:1px solid rgba(255,255,255,0.22);";
        section.innerHTML = `
        <div style="font-weight:bold;color:white;font-family:Roboto,Arial,sans-serif;text-align:center;margin-bottom:8px;">SRC / Tracking</div>
        <div style="display:flex;gap:10px;align-items:flex-start;justify-content:center;flex-wrap:wrap;text-align:left;">
          <div style="display:flex;align-items:center;gap:6px;padding-top:4px;">
            <input class="form-check-input" type="checkbox" role="switch" id="ShowWrHolders" style="width:1.3em;height:1.3em;margin:0;">
            <label class="form-check-label" for="ShowWrHolders" style="margin:0;white-space:nowrap;color:white;font-family:Roboto,Arial,sans-serif;">Show WR holders</label>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <label for="TrackedPlayerInput" class="form-check-label" style="margin:0;white-space:nowrap;color:white;font-family:Roboto,Arial,sans-serif;">Track player</label>
            <input type="text" class="form-control" id="TrackedPlayerInput" list="tracked-player-suggestions" placeholder="SRC username" autocomplete="off" style="width:140px;display:inline-block;background-color:${btnColor};color:white;font-family:Roboto,Arial,sans-serif;border:1px solid rgba(255,255,255,0.25);border-radius:4px;outline:none;text-align:left;caret-color:white;padding:2px 6px;">
            <datalist id="tracked-player-suggestions"></datalist>
            <button class="btn" type="button" style="margin:0;color:white;background-color:${btnColor};font-family:Roboto,Arial,sans-serif;padding:2px 10px;" id="TrackedPlayerSet">Set</button>
            <button class="btn" type="button" style="margin:0;color:white;background-color:${btnColor};font-family:Roboto,Arial,sans-serif;padding:2px 10px;" id="TrackedPlayerClear">Clear</button>
          </div>
        </div>`;
        return section;
    };

    window.wireSpeedInfoTrackingControls = function (root) {
        if (!root || !window.pudding_settings) return;

        const wrholders_checkbox = root.querySelector("#ShowWrHolders");
        const tracked_input = root.querySelector("#TrackedPlayerInput");
        const trackedSetBtn = root.querySelector("#TrackedPlayerSet");
        const trackedClearBtn = root.querySelector("#TrackedPlayerClear");
        if (!wrholders_checkbox || !tracked_input || !trackedSetBtn || !trackedClearBtn) return;

        function syncSpeedInfoExclusiveUi() {
            const tracking = !!(window.pudding_settings.TrackedPlayerName || "").trim();
            if (tracking) {
                wrholders_checkbox.checked = false;
                wrholders_checkbox.disabled = true;
                wrholders_checkbox.title = "Clear tracked player to show WR holders";
            } else {
                wrholders_checkbox.disabled = false;
                wrholders_checkbox.title = "";
                wrholders_checkbox.checked = !!window.pudding_settings.ShowWrHolders;
            }
            tracked_input.value = window.pudding_settings.TrackedPlayerName || "";
        }

        function refreshSrcAfterSpeedInfoChange() {
            if (typeof window.refreshTrackedPlayerUi === "function") {
                window.refreshTrackedPlayerUi();
            }
            if (typeof window.getAllSrc === "function") {
                window.getAllSrc().catch(function (e) {
                    console.error("getAllSrc error:", e);
                });
            }
        }

        syncSpeedInfoExclusiveUi();
        if (typeof window.fillTrackedPlayerSuggestions === "function") {
            window.fillTrackedPlayerSuggestions();
        }

        tracked_input.addEventListener("keydown", function (evt) {
            evt.stopPropagation();
            if (evt.key === "Enter") {
                evt.preventDefault();
                trackedSetBtn.click();
            }
        });
        tracked_input.addEventListener("keyup", function (evt) {
            evt.stopPropagation();
        });

        wrholders_checkbox.addEventListener("change", function () {
            if (wrholders_checkbox.disabled) return;
            if (wrholders_checkbox.checked) {
                window.pudding_settings.TrackedPlayerName = "";
                tracked_input.value = "";
            }
            window.pudding_settings.ShowWrHolders = !!wrholders_checkbox.checked;
            if (typeof window.saveSettings === "function") window.saveSettings();
            syncSpeedInfoExclusiveUi();
            refreshSrcAfterSpeedInfoChange();
        });

        trackedSetBtn.addEventListener("click", function () {
            const name = (tracked_input.value || "").trim();
            window.pudding_settings.TrackedPlayerName = name;
            if (name) {
                window.pudding_settings.ShowWrHolders = false;
            }
            if (typeof window.saveSettings === "function") window.saveSettings();
            syncSpeedInfoExclusiveUi();
            refreshSrcAfterSpeedInfoChange();
        });

        trackedClearBtn.addEventListener("click", function () {
            tracked_input.value = "";
            window.pudding_settings.TrackedPlayerName = "";
            if (typeof window.saveSettings === "function") window.saveSettings();
            syncSpeedInfoExclusiveUi();
            refreshSrcAfterSpeedInfoChange();
        });
    };

    window.fillTrackedPlayerSuggestions = function () {
        if (isTabHidden()) {
            window.markSpeedInfoDirty({ src: true });
            return;
        }
        const list = document.getElementById("tracked-player-suggestions");
        if (!list) return;
        list.innerHTML = "";
        if (!timelinesData || !timelinesData.boards || !runsDatesMeta) return;
        const date = runsDatesMeta.availableDates[runsDatesMeta.availableDates.length - 1];
        const names = new Set();
        for (const timeline of Object.values(timelinesData.boards)) {
            const top = wrAsOf(timeline, date);
            for (const r of top) {
                if (r && r.n) names.add(r.n);
            }
        }
        for (const name of [...names].sort((a, b) => a.localeCompare(b))) {
            const opt = document.createElement("option");
            opt.value = name;
            list.appendChild(opt);
        }
    };

    window.getTrackedRecord = async function (level) {
        const queryId = srcQueryId;
        if (isTabHidden()) {
            window.markSpeedInfoDirty({ src: true });
            return;
        }
        const trackIds = {
            "25": "25track",
            "50": "50track",
            "100": "100track",
            "All": "Alltrack",
            "H": "Htrack",
        };
        const elId = trackIds[level];
        const el = elId ? document.getElementById(elId) : null;
        const labels = {
            "25": "25 Apples",
            "50": "50 Apples",
            "100": "100 Apples",
            "All": "All Apples",
            "H": "Highscore",
        };

        if (!el) return;

        const playerName = getTrackedPlayerName();
        if (!playerName || !window.pudding_settings.SpeedInfo || window.daily_challenge) {
            el.innerHTML = "";
            return;
        }

        let count = window.timeKeeper.getCurrentSetting("count");
        let speed = window.timeKeeper.getCurrentSetting("speed");
        let size = window.timeKeeper.getCurrentSetting("size");
        let mode = window.CurrentModeNum;

        const WALL = 1, PORTAL = 2, CHEESE = 3, KEY = 8, SOKO = 9, POISON = 10;
        const MINESWEEPER = 12, STATUE = 13, SHIELD = 15, HOTDOG = 17, GATE = 19, BRIDGE = 20, BLENDER = 22;
        if (size > 2 || count > 6 || mode == BLENDER) {
            el.innerHTML = "";
            return;
        }
        if (!shouldShowCategory(level, size, mode)) {
            el.innerHTML = "";
            return;
        }
        // Tracking Highscore: same FSS rules as SRC WR (not Peaceful)
        if (level === "H" && !canShowSrcHighscore(mode, count)) {
            el.innerHTML = "";
            return;
        }

        const modeName = window.modeToTxt[mode].name;
        const countName = window.countToTxt[count].name;
        const speedName = window.speedToTxt[speed].name;
        const sizeName = window.sizeToTxt[size].name;
        const categoryName = level === "H" ? "High Score" : level + " Apples";
        const categoryKey = `${countName}|${speedName}|${sizeName}|${modeName}|${categoryName}`;

        try {
            const board = await loadRunsBoard(modeName, level);
            if (queryId !== srcQueryId) return;
            const best = findBestTrackedRun(board, playerName, categoryKey, level === "H");
            if (!best) {
                el.innerHTML = `${labels[level]}: None`;
                return;
            }
            if (level === "H") {
                const highscore = Math.round(best.timeT * 1000 + 1e-6);
                const text = highscore + " Apples";
                el.innerHTML = formatTrackRow(labels[level], text, best.weblink);
            } else {
                const text = best.time ? convertTime(best.time) : formatTimeTSeconds(best.timeT);
                el.innerHTML = formatTrackRow(labels[level], text, best.weblink);
            }
        } catch (error) {
            if (queryId !== srcQueryId) return;
            if (window.NepDebug) {
                console.error("Tracked run lookup failed:", error);
            }
            el.innerHTML = `${labels[level]}: None`;
        }
    };

    window.getAllSrc = async function () {
        if (isTabHidden()) {
            window.markSpeedInfoDirty({ src: true });
            return;
        }
        const queryId = ++srcQueryId;
        if (isBlenderMode() || window.daily_challenge) {
            EmptyAll();
            return;
        }
        updateSrcAndTrackingVisibility();
        // Drop previous mode's WR/tracking immediately so it can't linger during fetch
        Handle25("Empty");
        Handle50("Empty");
        Handle100("Empty");
        HandleAll("Empty");
        HandleHighscore("Empty");
        EmptyTracking();

        const levels = ["25", "50", "100", "All", "H"];
        for (const element of levels) {
            if (queryId !== srcQueryId) return;
            await getRecordSRC(element);
        }
        if (queryId !== srcQueryId) return;
        if (getTrackedPlayerName()) {
            for (const element of levels) {
                if (queryId !== srcQueryId) return;
                await window.getTrackedRecord(element);
            }
        } else {
            EmptyTracking();
        }
        if (queryId !== srcQueryId) return;
        if (typeof window.fillTrackedPlayerSuggestions === "function") {
            window.fillTrackedPlayerSuggestions();
        }
        // Refresh personal PB gold colors now that FSS WRs are ready
        if (typeof window.SpeedInfoUpdate === "function") {
            window.SpeedInfoUpdate().catch(function (e) {
                console.error("SpeedInfoUpdate error:", e);
            });
        }
    }

    function Handle25(response) {
        if (response == "Empty") {
            document.getElementById('25src').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('25src').innerHTML = `25 Apples: None`
            return;
        }

        world_record = convertTime(response["data"]["runs"][0]["run"]["times"]["primary"]);
        const playerName = response["data"]["runs"][0].playerName || "";
        document.getElementById('25src').innerHTML = formatWrRow(
            "25 Apples",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );

        if (window.NepDebug) {
            //console.log("Found 25 apples " + world_record + " " + response["data"]["runs"][0]["run"].weblink)
        }
    }
    function Handle50(response) {
        if (response == "Empty") {
            document.getElementById('50src').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('50src').innerHTML = `50 Apples: None`
            return;
        }
        world_record = convertTime(response["data"]["runs"][0]["run"]["times"]["primary"]);
        const playerName = response["data"]["runs"][0].playerName || "";
        document.getElementById('50src').innerHTML = formatWrRow(
            "50 Apples",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );
    }
    function Handle100(response) {
        if (response == "Empty") {
            document.getElementById('100src').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('100src').innerHTML = `100 Apples: None`
            return;
        }
        world_record = convertTime(response["data"]["runs"][0]["run"]["times"]["primary"]);
        const playerName = response["data"]["runs"][0].playerName || "";
        document.getElementById('100src').innerHTML = formatWrRow(
            "100 Apples",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );
    }
    function HandleAll(response) {
        if (response == "Empty") {
            document.getElementById('Allsrc').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('Allsrc').innerHTML = `All Apples: None`
            return;
        }
        world_record = convertTime(response["data"]["runs"][0]["run"]["times"]["primary"]);
        const playerName = response["data"]["runs"][0].playerName || "";
        document.getElementById('Allsrc').innerHTML = formatWrRow(
            "All Apples",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );
    }

    function HandleHighscore(response) {

        if (response == "Empty") {
            document.getElementById('Hsrc').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('Hsrc').innerHTML = `Highscore: None`
            return;
        }

        highscore = wrHighscoreFromRun(response["data"]["runs"][0]["run"]);
        if (highscore == null) {
            document.getElementById('Hsrc').innerHTML = `Highscore: None`
            return;
        }
        world_record = highscore + " Apples";
        const playerName = response["data"]["runs"][0].playerName || "";

        document.getElementById('Hsrc').innerHTML = formatWrRow(
            "Highscore",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );
        if (window.NepDebug) {
            //console.log("Found highscore " + highscore + " " + response["data"]["runs"][0]["run"].weblink)
        }
    }

    // This shit was generated by ChatGPT
    function convertTime(duration) {
        if (!duration) return "None";
        const regex = /PT(?:(\d+)H)?(?:(\d+)M)?([\d.]+)S/;
        const matches = String(duration).match(regex);
        if (!matches) return "None";

        let convertedTime = '';

        if (matches[1]) {
            convertedTime += matches[1] + 'h';
        }

        if (matches[2]) {
            convertedTime += matches[2] + 'm';
        }

        const seconds = parseFloat(matches[3]);

        if (seconds > 0 || convertedTime === '') {
            const wholeSeconds = Math.floor(seconds);
            convertedTime += wholeSeconds + 's';

            const milliseconds = String(Math.round((seconds - wholeSeconds) * 1000)).padStart(3, "0");

            if (milliseconds > 0) {
                convertedTime += milliseconds + 'ms';
            }
        }

        if (convertedTime.includes('h')) {
            convertedTime = convertedTime.split('s')[0] + "s";
        }

        return convertedTime;
    }

    function countOccurrences(str, char) {
        const regex = new RegExp(char, "g");
        const matches = str.match(regex);
        return matches ? matches.length : 0;
    }

    // Prefetch runs-derived timelines on startup
    getLatestCacheData().then(() => {
        if (typeof window.fillTrackedPlayerSuggestions === "function") {
            window.fillTrackedPlayerSuggestions();
        }
    }).catch(error => {
        if (window.NepDebug) {
            console.error("Failed to initialize runs-derived data:", error);
        }
    });

   // window.speedinfoVisible = false;

    window.SpeedInfoShow = function () {
        const speedinfoBox = document.getElementById('speedinfo-popup-pudding');
        if (!speedinfoBox) return;
        speedinfoBox.style.display = 'flex';
        speedinfoBox.style.visibility = 'visible';
        window.pudding_settings.SpeedInfo = true;
        const speedInfoToggle = document.getElementById("AlwaysOnTimeKeeper") ||
            document.getElementById("SpeedrunSpeedInfo");
        if (speedInfoToggle) speedInfoToggle.checked = true;
        if (typeof window.saveSettings === "function") window.saveSettings();

        // Panel was hidden: flush any deferred personal/SRC refresh
        window._speedInfoNeedsRefresh = true;
        if (typeof window.flushSpeedInfoIfNeeded === "function") {
            window.flushSpeedInfoIfNeeded();
        } else {
            window._speedInfoNeedsRefresh = false;
            window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));
        }
    }

    window.SpeedInfoHide = function () {
        const speedinfoBox = document.getElementById('speedinfo-popup-pudding');
        if (!speedinfoBox) return;
        speedinfoBox.style.display = 'flex';
        speedinfoBox.style.visibility = 'hidden';
        window.pudding_settings.SpeedInfo = false;
        const speedInfoToggle = document.getElementById("AlwaysOnTimeKeeper") ||
            document.getElementById("SpeedrunSpeedInfo");
        if (speedInfoToggle) speedInfoToggle.checked = false;
        if (typeof window.saveSettings === "function") window.saveSettings();
    }

    window.SpeedInfoIsVisible = function () {
        const box = document.getElementById("speedinfo-popup-pudding");
        return !!(box && box.style.visibility !== "hidden");
    };

    window.SpeedInfoSetup = function () {

        const d = document.createElement('div');
        d.id = 'speedinfo-container';
        d.style = 'position:absolute;left:465px;top:45px;z-index:10000;';
        document.getElementsByClassName('sEOCsb')[0].appendChild(d);
        const speedinfoElement = document.querySelector('#speedinfo-container');


        const speedinfoBox = document.createElement('div');
        speedinfoBox.style = window.puddingSidebarStyle;
        speedinfoBox.id = 'speedinfo-popup-pudding';
        speedinfoBox.style.visibility = 'hidden';
        speedinfoBox.style.display = 'flex';
        speedinfoBox.style.flexDirection = 'column';
        speedinfoBox.style.boxSizing = 'border-box';
        window.speedinfoInput = speedinfoBox;
        speedinfoBox.innerHTML = `
<style>
#speedinfo-popup-pudding .si-header {
  display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 0 8px;
}
#speedinfo-popup-pudding .si-header-title {
  color:white;font-family:Roboto,Arial,sans-serif;font-weight:600;letter-spacing:0.04em;font-size:13px;
}
#speedinfo-popup-pudding .si-section {
  margin:0 0 8px;padding:0 0 8px;border-bottom:1px solid rgba(255,255,255,0.18);
}
#speedinfo-popup-pudding .si-section:last-child { border-bottom:none;margin-bottom:0;padding-bottom:0; }
#speedinfo-popup-pudding .si-section-title {
  display:block;color:rgba(255,255,255,0.75);font-family:Roboto,Arial,sans-serif;font-size:11px;
  font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;
}
#speedinfo-popup-pudding .si-stack {
  display:flex;flex-direction:column;gap:2px;
}
#speedinfo-popup-pudding .si-stack .form-check-label {
  margin:0;color:white;font-family:Roboto,Arial,sans-serif;font-size:16px;line-height:1.3;
}
#speedinfo-popup-pudding.pudding-text-compact .si-stack .form-check-label {
  font-size:12px;
}
#speedinfo-popup-pudding .form-check.form-switch .form-check-label {
  margin:0;color:white;font-family:Roboto,Arial,sans-serif;font-size:16px;line-height:1.25;
}
#speedinfo-popup-pudding.pudding-text-compact .form-check.form-switch .form-check-label {
  font-size:12px;
}
#speedinfo-popup-pudding .si-btn {
  box-sizing:border-box;margin:0;padding:4px 8px;color:white;background-color:#1155CC;border:none;
  border-radius:4px;font-family:Roboto,Arial,sans-serif;font-size:12px;line-height:1.3;cursor:pointer;
}
#speedinfo-popup-pudding .si-btn-block {
  display:block;width:100%;margin:0 0 4px;padding:5px 8px;
}
#speedinfo-popup-pudding .si-btn-row { display:flex;gap:4px;margin:0 0 2px; }
#speedinfo-popup-pudding .si-btn-row .si-btn { flex:1;margin:0;padding:5px 6px;font-size:11px; }
#speedinfo-popup-pudding .form-check.form-switch {
  display:flex;align-items:center;gap:6px;margin:0 0 4px;min-height:0;padding-left:0;
}
#speedinfo-popup-pudding .form-check.form-switch .form-check-input { margin:0;float:none;flex-shrink:0; }
#speedinfo-popup-pudding #si-main { flex:1;min-height:0;overflow-x:hidden;overflow-y:auto; }
#speedinfo-popup-pudding #speedrun-controls-section {
  flex-shrink:0;margin-top:auto;padding:8px 0 0;border-top:1px solid rgba(255,255,255,0.18);
}
#speedinfo-popup-pudding #input-display-section {
  flex-shrink:0;margin-top:auto;margin-bottom:0;width:100%;min-height:104px;box-sizing:border-box;
  padding:6px 0 0;border-top:1px solid rgba(255,255,255,0.18);justify-content:center;align-items:flex-end;
}
</style>

<div id="si-main">
  <div class="si-header">
    <span class="si-header-title">Speed Info</span>
    <button type="button" class="btn si-btn" id="time-keeper" jsname="time-keeper">Details</button>
  </div>

  <div id="si-personal" class="si-section">
    <span class="si-section-title">Personal</span>
    <div class="si-stack">
      <label id="mode-selected" class="form-check-label"></label>
      <label id="mode-selected2" class="form-check-label"></label>
      <label id="25" class="form-check-label"></label>
      <label id="50" class="form-check-label"></label>
      <label id="100" class="form-check-label"></label>
      <label id="ALL" class="form-check-label"></label>
      <label id="H" class="form-check-label"></label>
      <label id="att" class="form-check-label"></label>
    </div>
  </div>

  <div id="src-section" class="si-section">
    <span class="si-section-title">SRC World Records</span>
    <div class="si-stack">
      <label id="25src" class="form-check-label"></label>
      <label id="50src" class="form-check-label"></label>
      <label id="100src" class="form-check-label"></label>
      <label id="Allsrc" class="form-check-label"></label>
      <label id="Hsrc" class="form-check-label"></label>
    </div>
  </div>

  <div id="tracking-section" class="si-section" style="display:none;">
    <span id="tracking-label" class="si-section-title">Tracking</span>
    <div class="si-stack">
      <label id="25track" class="form-check-label"></label>
      <label id="50track" class="form-check-label"></label>
      <label id="100track" class="form-check-label"></label>
      <label id="Alltrack" class="form-check-label"></label>
      <label id="Htrack" class="form-check-label"></label>
    </div>
  </div>
</div>

<div id="speedrun-controls-section" style="display:none;"></div>

<div id="input-display-section" style="display:none;"></div>

<button type="button" class="btn si-btn" style="display:none;" id="speedinfo-close" jsname="speedinfo-close">Close</button>
`;

        document.getElementsByClassName('sEOCsb')[0].appendChild(speedinfoBox);
        if (typeof window.applyPuddingPanelTextSize === "function") {
            window.applyPuddingPanelTextSize();
        }
        window.cacheSpeedInfoElements = function () {
            const ids = [
                "mode-selected",
                "mode-selected2",
                "att",
                "25",
                "50",
                "100",
                "ALL",
                "H",
                "25src",
                "50src",
                "100src",
                "Allsrc",
                "Hsrc",
                "25track",
                "50track",
                "100track",
                "Alltrack",
                "Htrack",
            ];
            window._speedInfoEls = window._speedInfoEls || {};
            for (let i = 0; i < ids.length; i++) {
                window._speedInfoEls[ids[i]] = document.getElementById(ids[i]);
            }
        };
        window.siEl = function (id) {
            if (!window._speedInfoEls) window.cacheSpeedInfoElements();
            const cached = window._speedInfoEls && window._speedInfoEls[id];
            if (cached && cached.isConnected) return cached;
            const el = document.getElementById(id);
            if (window._speedInfoEls) window._speedInfoEls[id] = el;
            return el;
        };
        window.cacheSpeedInfoElements();
        updateTrackingSectionVisibility();

        if (window.SpeedrunMod) {
            const speedrunControls = document.getElementById("speedrun-controls-section");
            if (speedrunControls) {
                speedrunControls.innerHTML = `
        <span class="si-section-title">Controls</span>
        <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="SpeedrunSpeedInfo">
        <label class="form-check-label" for="SpeedrunSpeedInfo">Show Speed Info</label>
        </div>
        <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" data-speedrun-topbar>
        <label class="form-check-label" data-speedrun-topbar-label>Top Bar Icons</label>
        </div>
        <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="SpeedrunFpsCounter">
        <label class="form-check-label" for="SpeedrunFpsCounter">FPS Counter</label>
        </div>
        <button type="button" class="btn si-btn si-btn-block" id="ResetKeybind">Reset Key: Shift</button>
        <button type="button" class="btn si-btn si-btn-block" id="ExportBackup">Export backup</button>
        <div class="si-btn-row">
        <button type="button" class="btn si-btn" id="ImportMergeBackup">Import merge</button>
        <button type="button" class="btn si-btn" id="ImportReplaceBackup">Import replace</button>
        </div>
        <input type="file" id="PuddingBackupFile" accept="application/json,.json" style="display:none;">
                `;
                speedrunControls.style.display = "block";
            }
            const speedrunTopbar = speedinfoBox.querySelector("[data-speedrun-topbar]");
            if (speedrunTopbar) speedrunTopbar.id = "TopBarIcons";
            const speedrunTopbarLabel = speedinfoBox.querySelector("[data-speedrun-topbar-label]");
            if (speedrunTopbarLabel) speedrunTopbarLabel.setAttribute("for", "TopBarIcons");
            if (typeof window.setup_topbar_checkbox === "function") {
                window.setup_topbar_checkbox();
            }
            const speedInfoCb = document.getElementById("SpeedrunSpeedInfo");
            if (speedInfoCb) {
                speedInfoCb.checked = !!window.pudding_settings.SpeedInfo;
                speedInfoCb.addEventListener("change", window.ToggleSpeedInfo);
            }
            if (typeof window.FpsCounterBindCheckbox === "function") {
                window.FpsCounterBindCheckbox(document.getElementById("SpeedrunFpsCounter"));
            }
            if (typeof window.wirePuddingBackupButtons === "function") {
                window.wirePuddingBackupButtons({
                    exportBtn: document.getElementById("ExportBackup"),
                    mergeBtn: document.getElementById("ImportMergeBackup"),
                    replaceBtn: document.getElementById("ImportReplaceBackup"),
                    fileInput: document.getElementById("PuddingBackupFile"),
                });
            }
        }

        const speedinfoCloseElements = document.getElementById('speedinfo-close');
        speedinfoCloseElements.addEventListener('click', window.SpeedInfoHide);
        //speedinfoCloseElements[1].addEventListener('click', hideSettingsBox);


        //document.getElementById('toggle-counter').addEventListener('click', toggleCounter);

        tempID = "time-keeper"; // Inspect element on Timer and take jsname from it
        document.querySelector("button[jsname^=\"" + tempID + "\"]").addEventListener("click", (e) => {
            if(!window.daily_challenge){
                window.timeKeeper.toggleDialog();
            }
        });

        //debugger
    }

    window.SpeedInfoSetup();

    window.ToggleSpeedInfo = function () {

          window.pudding_settings.SpeedInfo = !window.pudding_settings.SpeedInfo;

        if (window.pudding_settings.SpeedInfo) {
            // Show it
            window.SpeedInfoShow();
        }
        else {
            // Hide it
            window.SpeedInfoHide();
        }
        if (typeof window.saveSettings === "function") window.saveSettings();
    }

    //Listeners to hide/show speedinfo box
    const backButton = 'p17HVe';
    document.querySelector("[class^=\"" + backButton + "\"]").addEventListener("click", (e) => {
        window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));
    });

    const playButton = 'NSjDf';
    document.querySelector("[jsname^=\"" + playButton + "\"]").addEventListener("click", (e) => {
        window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));
    });

    window.SpeedInfoUpdate = function () {
        if (isTabHidden()) {
            window.markSpeedInfoDirty();
            return Promise.resolve();
        }
        if (typeof window.SpeedInfoIsVisible === "function" && !window.SpeedInfoIsVisible()) {
            window._speedInfoNeedsRefresh = true;
            return Promise.resolve();
        }
        // Coalesce death/reset/addAttempt bursts into one paint
        if (window._speedInfoUpdateTimer) {
            return window._speedInfoUpdatePromise || Promise.resolve();
        }
        window._speedInfoUpdatePromise = new Promise(function (resolve, reject) {
            window._speedInfoUpdateTimer = setTimeout(function () {
                window._speedInfoUpdateTimer = null;
                runSpeedInfoUpdate()
                    .then(resolve, reject)
                    .finally(function () {
                        window._speedInfoUpdatePromise = null;
                    });
            }, 0);
        });
        return window._speedInfoUpdatePromise;
    };

    // Mid-run: update one personal PB/HS row without rebuilding SRC / mode labels
    window.SpeedInfoPaintPersonalRow = function (score) {
        if (isTabHidden()) {
            window.markSpeedInfoDirty();
            return;
        }
        if (typeof window.SpeedInfoIsVisible === "function" && !window.SpeedInfoIsVisible()) {
            window._speedInfoNeedsRefresh = true;
            return;
        }
        if (!window.timeKeeper || window.daily_challenge) return;
        if (!window._speedInfoGoldCache) window._speedInfoGoldCache = {};

        const midRun =
            (window.timeKeeper.runStarted || window.timeKeeper.playing) &&
            typeof window.timeKeeper.mode === "string" &&
            typeof window.timeKeeper.count === "number";

        let modeKey;
        let count;
        let speed;
        let size;
        let mode = window.CurrentModeNum;
        if (midRun) {
            modeKey = window.timeKeeper.mode;
            count = window.timeKeeper.count;
            speed = window.timeKeeper.speed;
            size = window.timeKeeper.size;
        } else {
            count = window.timeKeeper.getCurrentSetting("count");
            speed = window.timeKeeper.getCurrentSetting("speed");
            size = window.timeKeeper.getCurrentSetting("size");
            modeKey = window.timeKeeper.getCurrentMode();
        }

        let storage = {};
        try {
            storage =
                typeof window.timeKeeper.getStorage === "function"
                    ? window.timeKeeper.getStorage()
                    : JSON.parse(localStorage["snake_timeKeeper"] || "{}");
        } catch (e) {
            storage = {};
        }

        const scoreKey = String(score);
        const bold = typeof window.siEl === "function"
            ? window.siEl(scoreKey === "ALL" ? "ALL" : scoreKey)
            : document.getElementById(scoreKey === "ALL" ? "ALL" : scoreKey);
        if (!bold) return;

        const name = scoreKey + "-" + modeKey + "-" + count + "-" + speed + "-" + size;
        const fmt = window.timeKeeper.formatDisplayTime
            ? window.timeKeeper.formatDisplayTime.bind(window.timeKeeper)
            : window.timeKeeper.formatTimeSrcStyle
              ? window.timeKeeper.formatTimeSrcStyle.bind(window.timeKeeper)
              : function (ms) {
                    return String(ms);
                };

        if (scoreKey === "att") {
            const totalAttempts =
                typeof window.timeKeeper.getAttemptTotal === "function"
                    ? window.timeKeeper.getAttemptTotal(storage[name])
                    : typeof storage[name] === "number"
                      ? storage[name]
                      : 0;
            const next = "Total Attempts: " + totalAttempts;
            if (bold.textContent !== next) bold.textContent = next;
            return;
        }

        if (scoreKey !== "H" && !shouldShowCategory(scoreKey === "ALL" ? "All" : scoreKey, size, mode)) {
            if (bold.innerHTML !== "") bold.innerHTML = "";
            return;
        }

        const gen = (window._speedInfoUpdateGen = (window._speedInfoUpdateGen || 0) + 1);

        function queueGoldJob(scoreId, labelPrefix, displayText, pb, gKey) {
            if (typeof window._speedInfoGoldCache[gKey] === "boolean") return;
            setTimeout(function () {
                if (gen !== window._speedInfoUpdateGen) return;
                if (isTabHidden()) {
                    window.markSpeedInfoDirty();
                    return;
                }
                shouldGoldPb(scoreId, mode, count, speed, size, pb, modeKey).then(function (gold) {
                    if (gen !== window._speedInfoUpdateGen) return;
                    rememberGoldCache(gKey, gold, modeKey, count, speed, size, scoreId);
                    const el = siEl(scoreId);
                    if (!el) return;
                    el.innerHTML =
                        labelPrefix +
                        pbValueHtml(displayText, scoreId, mode, count, speed, size, !!gold);
                });
            }, 0);
        }

        if (scoreKey === "H") {
            if (typeof storage[name] != "undefined" && storage[name].high != null) {
                const highText = String(storage[name].high) + " Apples";
                const gKey = goldCacheKey(modeKey, count, speed, size, "H", highText);
                const allowGold = canGoldHighscore(mode, count, speed, size);
                const knownGold = allowGold && window._speedInfoGoldCache[gKey];
                bold.innerHTML =
                    "Highscore: " +
                    pbValueHtml(highText, "H", mode, count, speed, size, !!knownGold);
                if (allowGold) {
                    queueGoldJob("H", "Highscore: ", highText, storage[name], gKey);
                }
            } else if (bold.textContent !== "Highscore: None") {
                bold.textContent = "Highscore: None";
            }
            return;
        }

        const label = scoreKey === "ALL" ? "All Apples" : scoreKey + " Apples";
        if (typeof storage[name] != "undefined" && storage[name].time != null) {
            const displayText = fmt(storage[name].time);
            const gKey = goldCacheKey(modeKey, count, speed, size, scoreKey, displayText);
            const knownGold = window._speedInfoGoldCache[gKey];
            bold.innerHTML =
                label +
                ": " +
                pbValueHtml(displayText, scoreKey, mode, count, speed, size, !!knownGold);
            queueGoldJob(scoreKey, label + ": ", displayText, storage[name], gKey);
        } else {
            const noneText = label + ": None";
            if (bold.textContent !== noneText) bold.textContent = noneText;
        }
    };

    async function runSpeedInfoUpdate() {
        if (isTabHidden()) {
            window.markSpeedInfoDirty();
            return;
        }
        const gen = (window._speedInfoUpdateGen = (window._speedInfoUpdateGen || 0) + 1);
        if (!window._speedInfoGoldCache) window._speedInfoGoldCache = {};

        let count;
        let speed;
        let size;
        let modeKey;
        let mode = window.CurrentModeNum;
        const midRun =
            window.timeKeeper &&
            (window.timeKeeper.runStarted || window.timeKeeper.playing) &&
            typeof window.timeKeeper.mode === "string" &&
            typeof window.timeKeeper.count === "number";

        if (midRun) {
            modeKey = window.timeKeeper.mode;
            count = window.timeKeeper.count;
            speed = window.timeKeeper.speed;
            size = window.timeKeeper.size;
        } else {
            if (window.ModeRegistry && typeof window.ModeRegistry.has === "function") {
                try {
                    window.isBridge = window.ModeRegistry.has("bridge");
                } catch (e) { /* trophy DOM may be missing early */ }
            }
            count = window.timeKeeper.getCurrentSetting("count");
            speed = window.timeKeeper.getCurrentSetting("speed");
            size = window.timeKeeper.getCurrentSetting("size");
            modeKey = window.timeKeeper.getCurrentMode();
        }

        pruneSpeedInfoGoldCache(modeKey, count, speed, size);

        let storage = {};
        try {
            storage =
                typeof window.timeKeeper.getStorage === "function"
                    ? window.timeKeeper.getStorage()
                    : JSON.parse(localStorage["snake_timeKeeper"] || "{}");
        } catch (e) {
            storage = {};
        }

        const gamemode = window.ModeRegistry
            ? window.ModeRegistry.labelModeKey(modeKey)
            : modeKey;

        mode_label = typeof window.siEl === "function"
            ? window.siEl("mode-selected")
            : document.getElementById("mode-selected");
        mode_label2 = typeof window.siEl === "function"
            ? window.siEl("mode-selected2")
            : document.getElementById("mode-selected2");

        if (window.daily_challenge) {
            if (mode_label) mode_label.textContent = "Daily Challenge";
            if (mode_label2) mode_label2.textContent = "(TimeKeeper disabled)";
            for (const score of ["att", "25", "50", "100", "ALL", "H"]) {
                const el = typeof window.siEl === "function"
                    ? window.siEl(score)
                    : document.getElementById(score);
                if (el) el.textContent = "";
            }
            updateSrcAndTrackingVisibility();
            return;
        }

        updateSrcAndTrackingVisibility();

        if (mode_label) {
            mode_label.textContent =
                gamemode +
                ", " +
                window.HandleCount(count).substring(0, window.HandleCount(count).lastIndexOf(","));
        }
        if (mode_label2) {
            mode_label2.textContent = window.HandleSpeed(speed) + window.HandleSize(size);
        }

        const fmt = window.timeKeeper.formatDisplayTime
            ? window.timeKeeper.formatDisplayTime.bind(window.timeKeeper)
            : window.timeKeeper.formatTimeSrcStyle
              ? window.timeKeeper.formatTimeSrcStyle.bind(window.timeKeeper)
              : function (ms) {
                    return String(ms);
                };

        const goldJobs = [];

        for (const score of ["att", "25", "50", "100", "ALL", "H"]) {
            const name = score + "-" + modeKey + "-" + count + "-" + speed + "-" + size;
            const bold = typeof window.siEl === "function"
                ? window.siEl(score)
                : document.getElementById(score);
            if (!bold) continue;

            if (score == "att") {
                const totalAttempts =
                    typeof window.timeKeeper.getAttemptTotal === "function"
                        ? window.timeKeeper.getAttemptTotal(storage[name])
                        : typeof storage[name] === "number"
                          ? storage[name]
                          : 0;
                const next = "Total Attempts: " + totalAttempts;
                if (bold.textContent !== next) bold.textContent = next;
                continue;
            }

            // Match SRC visibility (100/YY50); Highscore always shown locally
            if (!shouldShowCategory(score === "ALL" ? "All" : score, size, mode)) {
                if (bold.textContent !== "") bold.textContent = "";
                continue;
            }

            if (score == "H") {
                if (typeof storage[name] != "undefined" && storage[name].high != null) {
                    const highText = String(storage[name].high) + " Apples";
                    const gKey = goldCacheKey(modeKey, count, speed, size, "H", highText);
                    const allowGold = canGoldHighscore(mode, count, speed, size);
                    const knownGold = allowGold && window._speedInfoGoldCache[gKey];
                    bold.innerHTML =
                        "Highscore: " +
                        pbValueHtml(highText, "H", mode, count, speed, size, !!knownGold);
                    if (allowGold && typeof window._speedInfoGoldCache[gKey] !== "boolean") {
                        goldJobs.push({
                            score: "H",
                            elId: "H",
                            labelPrefix: "Highscore: ",
                            displayText: highText,
                            pb: storage[name],
                            gKey: gKey,
                        });
                    }
                } else if (bold.textContent !== "Highscore: None") {
                    bold.textContent = "Highscore: None";
                }
                continue;
            }

            const label = score === "ALL" ? "All Apples" : score + " Apples";
            if (typeof storage[name] != "undefined" && storage[name].time != null) {
                const displayText = fmt(storage[name].time);
                const gKey = goldCacheKey(modeKey, count, speed, size, score, displayText);
                const knownGold = window._speedInfoGoldCache[gKey];
                bold.innerHTML =
                    label +
                    ": " +
                    pbValueHtml(displayText, score, mode, count, speed, size, !!knownGold);
                if (typeof knownGold !== "boolean") {
                    goldJobs.push({
                        score: score,
                        elId: score,
                        labelPrefix: label + ": ",
                        displayText: displayText,
                        pb: storage[name],
                        gKey: gKey,
                    });
                }
            } else {
                const noneText = label + ": None";
                if (bold.textContent !== noneText) bold.textContent = noneText;
            }
        }

        if (goldJobs.length === 0) return;

        const goldMode = mode;
        const goldCount = count;
        const goldSpeed = speed;
        const goldSize = size;
        const goldModeKey = modeKey;
        setTimeout(function () {
            if (gen !== window._speedInfoUpdateGen) return;
            if (isTabHidden()) {
                window.markSpeedInfoDirty();
                return;
            }
            Promise.all(
                goldJobs.map(function (job) {
                    return shouldGoldPb(
                        job.score,
                        goldMode,
                        goldCount,
                        goldSpeed,
                        goldSize,
                        job.pb,
                        goldModeKey
                    ).then(function (gold) {
                        return { job: job, gold: gold };
                    });
                })
            )
                .then(function (results) {
                    if (gen !== window._speedInfoUpdateGen) return;
                    if (isTabHidden()) {
                        window.markSpeedInfoDirty();
                        return;
                    }
                    for (let i = 0; i < results.length; i++) {
                        const r = results[i];
                        rememberGoldCache(
                            r.job.gKey,
                            r.gold,
                            goldModeKey,
                            goldCount,
                            goldSpeed,
                            goldSize,
                            r.job.score
                        );
                        const el = typeof window.siEl === "function"
                            ? window.siEl(r.job.elId)
                            : document.getElementById(r.job.elId);
                        if (!el) continue;
                        el.innerHTML =
                            r.job.labelPrefix +
                            pbValueHtml(
                                r.job.displayText,
                                r.job.score,
                                goldMode,
                                goldCount,
                                goldSpeed,
                                goldSize,
                                !!r.gold
                            );
                    }
                    pruneSpeedInfoGoldCache(goldModeKey, goldCount, goldSpeed, goldSize);
                })
                .catch(function (e) {
                    if (window.NepDebug) console.error("SpeedInfo gold update failed:", e);
                });
        }, 0);
    }

    window.HandleCount = function (count) {
        switch (count) {
            case 0: return "1 Apple, "; break;
            case 1: return "3 Apples, "; break;
            case 2: return "5 Apples, "; break;
            case 3: return "10 Apples, "; break;
            case 4: return "Dice count, "; break;
            case 5: return "Bomb count, "; break;
            case 6: return "Tally count, "; break;
            default: return "MoreMenu Apples, "; break;
        }
    }
    window.HandleSpeed = function (speed) {
        switch (speed) {
            case 0: return "Normal speed, "; break;
            case 1: return "Fast speed, "; break;
            case 2: return "Slow speed, "; break;
            default: return "MoreMenu speed, "; break;

        }
    }
    window.HandleSize = function (size) {
        switch (size) {
            case 0: return "Normal size"; break;
            case 1: return "Small size"; break;
            case 2: return "Large size"; break;
            default: return "MoreMenu size"; break;
        }
    }

}

window.SpeedInfo.alterCode = function (code) {
    
    reset_regex = new RegExp(/;this\.reset\(\)\}\}/)

    speedinfo_reset = `;window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));
    if(window.first_time_call){window.getAllSrc().catch(e=>console.error('getAllSrc error:',e));window.first_time_call=false;}
    ;$&`


    catchError(reset_regex, code)
    code = code.assertReplace(reset_regex, speedinfo_reset);

    switch_regex = new RegExp(/switch\(b\){case "apple"/)
    speedinfo_switch = `window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));switch(b){case "apple"`
    code = code.assertReplace(switch_regex, speedinfo_switch);

    window.CurrentModeNum = 0;
    mode_regex = new RegExp(/case "trophy"\:/)
    // Set mode first, then refresh personal + SRC after CurrentModeNum is assigned
    mode_get_code = `case "trophy":queueMicrotask(function(){window.SpeedInfoUpdate().catch(function(e){console.error('SpeedInfoUpdate error:',e);});window.getAllSrc().catch(function(e){console.error('getAllSrc error:',e);});});window.CurrentModeNum = `
    code = code.assertReplace(mode_regex, mode_get_code);

    const settings_refresh =
        'queueMicrotask(function(){window.SpeedInfoUpdate().catch(function(e){console.error("SpeedInfoUpdate error:",e);});window.getAllSrc().catch(function(e){console.error("getAllSrc error:",e);});if(typeof window.apply_topbar_icons==="function")window.apply_topbar_icons();});';

    count_regex = new RegExp(/case "count"\:/);
    code = code.assertReplace(count_regex, 'case "count":' + settings_refresh);

    speed_regex = new RegExp(/case "speed"\:/);
    code = code.assertReplace(speed_regex, 'case "speed":' + settings_refresh);

    size_regex = new RegExp(/case "size"\:/);
    code = code.assertReplace(size_regex, 'case "size":' + settings_refresh);

    return code;
}
