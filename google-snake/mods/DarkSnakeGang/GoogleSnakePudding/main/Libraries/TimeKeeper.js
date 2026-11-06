window.TimeKeeper = {};

window.TimeKeeper.make = function () {
    /*
    storage v4:
    att-modeKey-count-speed-size : number (legacy) OR
      { total, lastAttempt, session, lastSession }
      session = attempts since this page load; lastSession = previous page's session count
    25|50|100|ALL-modeKey-count-speed-size: {time, date, att, sum}
    H-modeKey-count-speed-size: {high, time, date}
    modeKey = classic | wall | ... | peaceful | wall+portal (blender)
    */
    window.timeKeeper = {};
    window.timeKeeper.debug = false;
    window.timeKeeper.playing = false;
    window.timeKeeper.runStarted = false;
    window.timeKeeper.dialogActive = false;

    window.timeKeeper.refreshSpeedInfo = function () {
        if (typeof window.SpeedInfoUpdate === "function") {
            window.SpeedInfoUpdate().catch(function (e) {
                console.error("SpeedInfoUpdate error:", e);
            });
        }
    };

    // Mid-run: paint one personal row (or mark dirty if Speed Info is hidden)
    window.timeKeeper.paintSpeedInfoRow = function (score) {
        if (typeof window.SpeedInfoPaintPersonalRow === "function") {
            window.SpeedInfoPaintPersonalRow(score);
            return;
        }
        window.timeKeeper.refreshSpeedInfo();
    };

    // Prefer frozen run settings (no #trophy walk) once a run has started.
    window.timeKeeper.shouldTrack = function (ctx) {
        if (window.daily_challenge) return false;
        if (typeof window.aimTrainer !== "undefined" || typeof window.megaWholeSnakeObject !== "undefined") {
            return false;
        }
        const c = ctx || window.timeKeeper.getSaveContext();
        if (c.count > 6 || c.speed > 2 || c.size > 2) return false;
        return true;
    };

    window.timeKeeper.resolveRunContext = function () {
        return {
            modeKey: window.ModeRegistry.getCurrentModeKey(),
            count: window.timeKeeper.getCurrentSetting("count"),
            speed: window.timeKeeper.getCurrentSetting("speed"),
            size: window.timeKeeper.getCurrentSetting("size"),
        };
    };

    // Prefer the mode/settings frozen at run start so score events after a
    // trophy switch (reset/death) cannot write PBs into the newly selected mode.
    window.timeKeeper.getSaveContext = function () {
        if (
            (window.timeKeeper.runStarted || window.timeKeeper.playing) &&
            typeof window.timeKeeper.mode === "string" &&
            typeof window.timeKeeper.count === "number" &&
            typeof window.timeKeeper.speed === "number" &&
            typeof window.timeKeeper.size === "number"
        ) {
            return {
                modeKey: window.timeKeeper.mode,
                count: window.timeKeeper.count,
                speed: window.timeKeeper.speed,
                size: window.timeKeeper.size,
            };
        }
        return window.timeKeeper.resolveRunContext();
    };

    window.timeKeeper.buildKey = function (prefix, ctx) {
        const c = ctx || window.timeKeeper.getSaveContext();
        return prefix + "-" + c.modeKey + "-" + c.count + "-" + c.speed + "-" + c.size;
    };

    // Normalize legacy number / partial objects into the attempt stats record
    window.timeKeeper.normalizeAttemptRecord = function (raw) {
        if (typeof raw === "number" && !isNaN(raw)) {
            return {
                total: raw,
                lastAttempt: null,
                session: 0,
                lastSession: 0,
            };
        }
        if (!raw || typeof raw !== "object") {
            return {
                total: 0,
                lastAttempt: null,
                session: 0,
                lastSession: 0,
            };
        }
        return {
            total: typeof raw.total === "number" ? raw.total : 0,
            lastAttempt: raw.lastAttempt != null ? raw.lastAttempt : null,
            session: typeof raw.session === "number" ? raw.session : 0,
            lastSession: typeof raw.lastSession === "number" ? raw.lastSession : 0,
        };
    };

    window.timeKeeper.getAttemptTotal = function (raw) {
        if (typeof raw === "number" && !isNaN(raw)) return raw;
        if (raw && typeof raw === "object" && typeof raw.total === "number") return raw.total;
        return 0;
    };

    // On page load: roll previous page's session into lastSession
    window.timeKeeper.rollAttemptSession = function (rec) {
        const r = window.timeKeeper.normalizeAttemptRecord(rec);
        if (r.session > 0) {
            r.lastSession = r.session;
            r.session = 0;
        }
        return r;
    };

    window.timeKeeper.getStorage = function () {
        if (!window.timeKeeper._storageCache) {
            try {
                window.timeKeeper._storageCache = JSON.parse(
                    localStorage.getItem("snake_timeKeeper") || '{"version":4}'
                );
            } catch (e) {
                window.timeKeeper._storageCache = { version: 4 };
            }
        }
        return window.timeKeeper._storageCache;
    };

    // Persist immediately (settings edits, attempt count, end-of-run flush helpers)
    window.timeKeeper.setStorage = function (storage) {
        if (typeof window.timeKeeper.syncLegacyTimeKeeperMirrors === "function") {
            window.timeKeeper.syncLegacyTimeKeeperMirrors(storage);
        }
        window.timeKeeper._storageCache = storage;
        localStorage.setItem("snake_timeKeeper", JSON.stringify(storage));
        window.timeKeeper._storageDirty = false;
    };

    // Mid-run mutations stay in memory until flushStorage (death / All)
    window.timeKeeper.markStorageDirty = function () {
        window.timeKeeper._storageDirty = true;
    };

    window.timeKeeper.flushStorage = function () {
        if (!window.timeKeeper._storageDirty || !window.timeKeeper._storageCache) return;
        if (typeof window.timeKeeper.syncLegacyTimeKeeperMirrors === "function") {
            window.timeKeeper.syncLegacyTimeKeeperMirrors(window.timeKeeper._storageCache);
        }
        localStorage.setItem(
            "snake_timeKeeper",
            JSON.stringify(window.timeKeeper._storageCache)
        );
        window.timeKeeper._storageDirty = false;
    };

    window.timeKeeper._isBitstringStorageKey = function (key) {
        if (!key || key === "version") return false;
        const parts = key.split("-");
        return (
            parts.length >= 5 &&
            window.ModeRegistry &&
            typeof window.ModeRegistry.isBitstringModePart === "function" &&
            window.ModeRegistry.isBitstringModePart(parts[1])
        );
    };

    window.timeKeeper._cloneStorageValue = function (value) {
        if (value == null || typeof value !== "object") return value;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return value;
        }
    };

    // Keep v10 (20-bit) / v11 (21-bit) keys in sync with modeKey rows for downgrade
    window.timeKeeper.syncLegacyTimeKeeperMirrors = function (storage) {
        if (!storage || typeof storage !== "object") return storage;
        if (
            !window.ModeRegistry ||
            typeof window.ModeRegistry.modeKeyToBitstringV3 !== "function" ||
            typeof window.ModeRegistry.bitstringV3ToV2 !== "function"
        ) {
            return storage;
        }
        const keys = Object.keys(storage);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key === "version") continue;
            if (window.timeKeeper._isBitstringStorageKey(key)) continue;
            const parts = key.split("-");
            if (parts.length < 5) continue;
            const prefix = parts[0];
            if (
                prefix !== "25" &&
                prefix !== "50" &&
                prefix !== "100" &&
                prefix !== "ALL" &&
                prefix !== "H" &&
                prefix !== "att"
            ) {
                continue;
            }
            const modeKey = parts[1];
            if (!modeKey || /^[01]+$/.test(modeKey)) continue;
            const suffix = parts.slice(2).join("-");
            const bits21 = window.ModeRegistry.modeKeyToBitstringV3(modeKey);
            const bits20 = window.ModeRegistry.bitstringV3ToV2(bits21);
            const key21 = prefix + "-" + bits21 + "-" + suffix;
            const key20 = prefix + "-" + bits20 + "-" + suffix;
            const raw = storage[key];
            if (prefix === "att") {
                const total = window.timeKeeper.getAttemptTotal(raw);
                storage[key21] = total;
                storage[key20] = total;
            } else {
                const cloned = window.timeKeeper._cloneStorageValue(raw);
                storage[key21] = cloned;
                storage[key20] = window.timeKeeper._cloneStorageValue(raw);
            }
        }
        return storage;
    };

    // Compat: callers expecting mode "string" now get stable modeKey
    window.timeKeeper.getCurrentMode = function () {
        return window.ModeRegistry.getCurrentModeKey();
    };

    window.timeKeeper.gotApple = function (time, score) {
        if (!window.SpeedrunMod && typeof stats !== "undefined" && stats.apples) {
            stats.apples.session++;
            stats.apples.lifetime++;
            if (typeof updateCounterDisplay === "function") {
                updateCounterDisplay();
            }
        }
        if (
            !window.SpeedrunMod &&
            window.pudding_settings &&
            window.pudding_settings.randomizeThemeApple &&
            typeof window.setTheme === "function" &&
            typeof window.getRandomThemeName === "function"
        ) {
            window.setTheme(window.getRandomThemeName());
        }
        if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) return;

        window.timeKeeper.lastAppleDate = new Date();
        window.timeKeeper.lastAppleTime = time;

        if (score == 25 || score == 50 || score == 100) {
            window.timeKeeper.savePB(time, score);
        }
        window.timeKeeper.updateHighscoreLive(time, score);
    };

    window.timeKeeper.gotAll = function (time, score) {
        if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) return;
        if (window.timeKeeper.playing || window.timeKeeper.runStarted) {
            window.timeKeeper.saveScore(time, score);
        }
        window.timeKeeper.savePB(time, "ALL");
        // End of successful run: persist mid-run PB/HS memory
        window.timeKeeper.flushStorage();
        window.timeKeeper.playing = false;
    };

    // tick() calls this on every tick after a win or death until reset; only the
    // first call (while playing) may save. runStarted stays true until reset.
    window.timeKeeper.death = function (time, score) {
        if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) {
            window.timeKeeper.playing = false;
            return;
        }
        if (window.timeKeeper.playing) {
            window.timeKeeper.saveScore(time, score);
        }
        window.timeKeeper.playing = false;
    };

    window.timeKeeper.start = function () {
        window.timeKeeper.playing = true;
        window.timeKeeper.runStarted = true;
        const ctx = window.timeKeeper.resolveRunContext();
        window.timeKeeper.mode = ctx.modeKey;
        window.timeKeeper.count = ctx.count;
        window.timeKeeper.speed = ctx.speed;
        window.timeKeeper.size = ctx.size;
        if (typeof window.freezeRunSelectors === "function") {
            window.freezeRunSelectors();
        }
    };

    // get the current setting, name = 'count', 'speed', 'size' or 'trophy'
    window.timeKeeper.getCurrentSetting = function (name) {
        let getSelectedIndex = function (name) {
            let elementList = document.getElementById(name);
            if (!elementList) return 0;
            let number = 0;
            let classNames = [];
            let notUnique = "";
            for (const element of elementList.children) {
                if (classNames.indexOf(element.className) == -1) {
                    classNames.push(element.className);
                } else {
                    notUnique = element.className;
                    break;
                }
            }
            for (const element of elementList.children) {
                if (element.className != notUnique) {
                    return number;
                }
                number++;
            }
            return 0;
        };

        if (!window.SpeedrunMod && name != "trophy") {
            return eval(window[name + "_var"]);
        }
        return getSelectedIndex(name);
    };

    window.timeKeeper.scheduleLiveRefresh = function () {
        if (window.timeKeeper._liveRefreshQueued) return;
        window.timeKeeper._liveRefreshQueued = true;
        queueMicrotask(function () {
            window.timeKeeper._liveRefreshQueued = false;
            window.timeKeeper.paintSpeedInfoRow("H");
        });
    };

    // Mid-run: update Highscore PB in memory when current apples beat the stored best
    window.timeKeeper.updateHighscoreLive = function (time, score) {
        const ctx = window.timeKeeper.getSaveContext();
        if (!window.timeKeeper.shouldTrack(ctx)) return;
        if (typeof score !== "number" || isNaN(score)) return;

        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey("H", ctx);
        const appleTime =
            typeof window.timeKeeper.lastAppleTime !== "undefined"
                ? window.timeKeeper.lastAppleTime
                : Math.floor(time);

        if (typeof storage[name] == "undefined") {
            storage[name] = {
                high: score,
                time: appleTime,
                date:
                    typeof window.timeKeeper.lastAppleDate !== "undefined"
                        ? window.timeKeeper.lastAppleDate
                        : new Date(),
            };
            window.timeKeeper.markStorageDirty();
            window.timeKeeper.scheduleLiveRefresh();
            return;
        }

        const cur = storage[name];
        if (score < cur.high) return;
        if (score == cur.high && appleTime >= cur.time) return;

        cur.high = score;
        cur.time = appleTime;
        cur.date =
            typeof window.timeKeeper.lastAppleDate !== "undefined"
                ? window.timeKeeper.lastAppleDate
                : new Date();
        window.timeKeeper.markStorageDirty();
        window.timeKeeper.scheduleLiveRefresh();
    };

    window.timeKeeper.saveScore = function (time, score) {
        const ctx = window.timeKeeper.getSaveContext();
        if (!window.timeKeeper.shouldTrack(ctx)) return;

        if (typeof window.timeKeeper.lastAppleDate == "undefined") {
            window.timeKeeper.lastAppleDate = new Date();
        }
        if (typeof window.timeKeeper.lastAppleTime == "undefined") {
            window.timeKeeper.lastAppleTime = time;
        }

        time = Math.floor(time);
        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey("H", ctx);
        if (typeof storage[name] == "undefined") {
            storage[name] = {
                high: score,
                time: window.timeKeeper.lastAppleTime,
                date: window.timeKeeper.lastAppleDate,
            };
        } else if (
            score > storage[name].high ||
            (score == storage[name].high &&
                window.timeKeeper.lastAppleTime < storage[name].time)
        ) {
            storage[name].high = score;
            storage[name].time = window.timeKeeper.lastAppleTime;
            storage[name].date = window.timeKeeper.lastAppleDate;
        }
        // Drop unused average accumulators if present
        if (storage[name]) {
            delete storage[name].sum;
            delete storage[name].att;
        }
        // End of run: persist memory (including any mid-run PB/HS dirty state)
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.savePB = function (time, score) {
        const ctx = window.timeKeeper.getSaveContext();
        if (!window.timeKeeper.shouldTrack(ctx)) return;

        time = Math.floor(time);
        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey(String(score), ctx);

        if (typeof storage[name] == "undefined") {
            storage[name] = { time: time, date: new Date(), att: 1, sum: time };
        } else {
            if (typeof storage[name].att == "undefined") storage[name].att = 0;
            storage[name].att += 1;
            if (typeof storage[name].sum == "undefined") storage[name].sum = 0;
            storage[name].sum += time;
            if (time < storage[name].time) {
                storage[name] = {
                    time: time,
                    date: new Date(),
                    att: storage[name].att,
                    sum: storage[name].sum,
                };
            }
        }
        // Mid-run (25/50/100) or pre-flush ALL: keep in memory only; paint one row
        window.timeKeeper.markStorageDirty();
        window.timeKeeper.paintSpeedInfoRow(score);
    };

    // Only count if a run had actually started (not play→esc→play)
    window.timeKeeper.addAttempt = function () {
        if (!window.timeKeeper.runStarted) {
            window.timeKeeper.playing = false;
            return;
        }
        const ctx = {
            modeKey: window.timeKeeper.mode || window.ModeRegistry.getCurrentModeKey(),
            count:
                typeof window.timeKeeper.count === "number"
                    ? window.timeKeeper.count
                    : window.timeKeeper.getCurrentSetting("count"),
            speed:
                typeof window.timeKeeper.speed === "number"
                    ? window.timeKeeper.speed
                    : window.timeKeeper.getCurrentSetting("speed"),
            size:
                typeof window.timeKeeper.size === "number"
                    ? window.timeKeeper.size
                    : window.timeKeeper.getCurrentSetting("size"),
        };
        if (!window.timeKeeper.shouldTrack(ctx)) {
            window.timeKeeper.runStarted = false;
            window.timeKeeper.playing = false;
            return;
        }

        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey("att", ctx);
        const rec = window.timeKeeper.normalizeAttemptRecord(storage[name]);
        const now = new Date();
        rec.total += 1;
        rec.lastAttempt = now;
        rec.session += 1;
        storage[name] = rec;
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.runStarted = false;
        window.timeKeeper.playing = false;
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.setAttempts = function (attempts) {
        if (isNaN(attempts)) return;
        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey("att");
        const rec = window.timeKeeper.normalizeAttemptRecord(storage[name]);
        rec.total = attempts;
        storage[name] = rec;
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.setPB = function (time, score, attempts, average) {
        if (isNaN(time)) return;
        if (score != 25 && score != 50 && score != 100 && score != "ALL") return;
        if (isNaN(attempts)) return;
        if (isNaN(average)) return;
        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey(String(score));
        storage[name] = {
            time: time,
            date: new Date(),
            att: attempts,
            sum: Math.round(average * attempts),
        };
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.setScore = function (highscore, time) {
        if (isNaN(highscore)) return;
        if (isNaN(time)) return;
        const storage = window.timeKeeper.getStorage();
        const ctx = window.timeKeeper.resolveRunContext();
        const name = window.timeKeeper.buildKey("H", ctx);
        storage[name] = {
            high: highscore,
            time: time,
            date: new Date(),
        };
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.formatDuration = function (ms) {
        ms = Math.floor(ms);
        const hours = Math.floor(ms / 3600000);
        const minutes = String(Math.floor((ms - hours * 3600000) / 60000)).padStart(2, "0");
        const seconds = String(
            Math.floor((ms - minutes * 60000 - hours * 3600000) / 1000)
        ).padStart(2, "0");
        const mseconds = String(
            ms - minutes * 60000 - seconds * 1000 - hours * 3600000
        ).padStart(3, "0");
        if (hours == 0) return minutes + ":" + seconds + ":" + mseconds;
        return hours + ":" + minutes + ":" + seconds + ":" + mseconds;
    };

    // Local calendar date as YYYY-MM-DD
    window.timeKeeper.formatAchievedOn = function (raw) {
        const date = new Date(raw);
        if (isNaN(date.getTime())) return "—";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + d;
    };

    // Local calendar date + time as YYYY-MM-DD HH:MM:SS
    window.timeKeeper.formatAchievedOnWithTime = function (raw) {
        const date = new Date(raw);
        if (isNaN(date.getTime())) return "—";
        const y = date.getFullYear();
        const mo = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        const s = String(date.getSeconds()).padStart(2, "0");
        return y + "-" + mo + "-" + d + " " + h + ":" + mi + ":" + s;
    };

    // ms → SRC-like 1m2s345ms (shared with SpeedInfo personal rows)
    window.timeKeeper.formatTimeSrcStyle = function (ms) {
        ms = Math.floor(Number(ms) || 0);
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        let out = "";
        if (hours > 0) out += hours + "h";
        if (minutes > 0 || hours > 0) out += minutes + "m";
        out += seconds + "s";
        if (hours === 0) out += String(milliseconds).padStart(3, "0") + "ms";
        if (hours > 0) out = out.split("s")[0] + "s";
        return out;
    };

    // v10 Speed Info personal PB format: zero-padded 01m23s456ms (keeps ms when hours > 0)
    window.timeKeeper.formatTimeV10Style = function (ms) {
        ms = Math.floor(Number(ms) || 0);
        const hours = Math.floor(ms / 3600000);
        const minutes = String(Math.floor(ms / 60000 - hours * 60)).padStart(2, "0");
        const seconds = String(
            Math.floor((ms - minutes * 60000 - hours * 3600000) / 1000)
        ).padStart(2, "0");
        const mseconds = String(
            ms - minutes * 60000 - seconds * 1000 - hours * 3600000
        ).padStart(3, "0");
        if (hours === 0) return minutes + "m" + seconds + "s" + mseconds + "ms";
        return hours + "h" + minutes + "m" + seconds + "s" + mseconds + "ms";
    };

    // Speed Info PB times: current SRC style by default; v10 padded style when toggled
    window.timeKeeper.formatDisplayTime = function (ms) {
        if (
            window.pudding_settings &&
            window.pudding_settings.OldTimeKeeperFormat
        ) {
            return window.timeKeeper.formatTimeV10Style(ms);
        }
        return window.timeKeeper.formatTimeSrcStyle(ms);
    };

    window.timeKeeper.makeStorage = function () {
        let storage = localStorage.getItem("snake_timeKeeper");
        if (storage == null) {
            storage = { version: 2 };
            const old_pbs = localStorage.getItem("snake_pbs");
            if (old_pbs != null) {
                const old = JSON.parse(old_pbs);
                for (let mode = 0; mode < 20; mode++) {
                    let modeStr = "00000000000000000000".split("");
                    if (mode != 0) modeStr[mode - 1] = "1";
                    modeStr = modeStr.join("");
                    for (let count = 0; count < 5; count++) {
                        for (let speed = 0; speed < 3; speed++) {
                            for (let size = 0; size < 3; size++) {
                                for (const score of ["25", "50", "100", "ALL", "att", "H"]) {
                                    const name =
                                        score + "-" + mode + "-" + count + "-" + speed + "-" + size;
                                    if (typeof old[name] != "undefined") {
                                        storage[
                                            score +
                                                "-" +
                                                modeStr +
                                                "-" +
                                                count +
                                                "-" +
                                                speed +
                                                "-" +
                                                size
                                        ] = old[name];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            storage = JSON.parse(storage);
        }

        if (storage.version == 2) {
            const migrated = { version: 3 };
            for (const key of Object.keys(storage)) {
                if (key === "version") continue;
                const parts = key.split("-");
                if (parts.length >= 5 && /^[01]{20}$/.test(parts[1])) {
                    const modeStr = parts[1];
                    const newModeStr = modeStr.slice(0, 19) + "0" + modeStr.slice(19);
                    migrated[parts[0] + "-" + newModeStr + "-" + parts.slice(2).join("-")] =
                        storage[key];
                } else {
                    migrated[key] = storage[key];
                }
            }
            storage = migrated;
        }

        if (storage.version == 3) {
            const migrated = { version: 4 };
            for (const key of Object.keys(storage)) {
                if (key === "version") continue;
                const parts = key.split("-");
                if (parts.length >= 5 && /^[01]{21}$/.test(parts[1])) {
                    const modeKey = window.ModeRegistry.bitstringV3ToModeKey(parts[1]);
                    const modeKeyName =
                        parts[0] + "-" + modeKey + "-" + parts.slice(2).join("-");
                    // Prefer existing modeKey row if both present; always keep bitstring
                    if (typeof migrated[modeKeyName] === "undefined") {
                        migrated[modeKeyName] = storage[key];
                    }
                    migrated[key] = storage[key];
                    if (typeof window.ModeRegistry.bitstringV3ToV2 === "function") {
                        const bits20 = window.ModeRegistry.bitstringV3ToV2(parts[1]);
                        const key20 =
                            parts[0] + "-" + bits20 + "-" + parts.slice(2).join("-");
                        if (typeof migrated[key20] === "undefined") {
                            migrated[key20] = storage[key];
                        }
                    }
                } else {
                    migrated[key] = storage[key];
                }
            }
            storage = migrated;
        }

        if (storage.version != 4) {
            console.error("TimeKeeper storage version unexpected:", storage.version);
            storage.version = 4;
        }

        // Strip unused highscore average fields (sum/att) from modeKey H-* rows only
        for (const key of Object.keys(storage)) {
            if (key === "version" || key.slice(0, 2) !== "H-") continue;
            if (window.timeKeeper._isBitstringStorageKey(key)) continue;
            const rec = storage[key];
            if (!rec || typeof rec !== "object") continue;
            delete rec.sum;
            delete rec.att;
        }

        // Migrate modeKey att-* numbers → objects; leave bitstring att-* as numbers for v11
        for (const key of Object.keys(storage)) {
            if (key === "version" || key.slice(0, 4) !== "att-") continue;
            if (window.timeKeeper._isBitstringStorageKey(key)) {
                // Coerce accidental objects back to a plain total for old mods
                if (typeof storage[key] === "object") {
                    storage[key] = window.timeKeeper.getAttemptTotal(storage[key]);
                }
                continue;
            }
            storage[key] = window.timeKeeper.rollAttemptSession(storage[key]);
        }

        if (typeof window.timeKeeper.syncLegacyTimeKeeperMirrors === "function") {
            window.timeKeeper.syncLegacyTimeKeeperMirrors(storage);
        }

        localStorage.setItem("snake_timeKeeper", JSON.stringify(storage));
        window.timeKeeper._storageCache = storage;
        window.timeKeeper._storageDirty = false;
    };

    window.timeKeeper.showDialog = function () {
        window.timeKeeper.dialogActive = true;
        const btn = document.getElementById("time-keeper");
        if (btn) btn.innerHTML = "Hide";

        const body = document.querySelector("body");
        const oldBd = document.getElementById("timeKeeperBackdrop");
        if (oldBd) oldBd.remove();
        const oldDialog = document.getElementById("timeKeeperDialog");
        if (oldDialog) oldDialog.remove();

        const backdrop = document.createElement("div");
        backdrop.id = "timeKeeperBackdrop";
        backdrop.style.cssText =
            "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:10099;" +
            "background:rgba(0,0,0,0.45);";
        backdrop.addEventListener("click", function () {
            window.timeKeeper.hideDialog();
        });
        body.insertBefore(backdrop, body.firstChild);

        const dialog = document.createElement("div");
        dialog.setAttribute("open", "");
        dialog.setAttribute("id", "timeKeeperDialog");

        const ctx = window.timeKeeper.resolveRunContext();
        const gamemode = window.ModeRegistry.labelModeKey(ctx.modeKey);

        const bold = document.createElement("div");
        bold.appendChild(document.createTextNode("TimeKeeper Details"));
        bold.style = "color:white;font-family:Roboto,Arial;font-weight:bold;text-align:center;";
        dialog.appendChild(bold);
        dialog.appendChild(document.createElement("br"));
        dialog.appendChild(document.createTextNode("Mode: " + gamemode));
        dialog.appendChild(document.createElement("br"));

        switch (ctx.count) {
            case 0: dialog.appendChild(document.createTextNode("1 Apple, ")); break;
            case 1: dialog.appendChild(document.createTextNode("3 Apples, ")); break;
            case 2: dialog.appendChild(document.createTextNode("5 Apples, ")); break;
            case 3: dialog.appendChild(document.createTextNode("10 Apples, ")); break;
            case 4: dialog.appendChild(document.createTextNode("Dice count, ")); break;
            case 5: dialog.appendChild(document.createTextNode("Bomb count, ")); break;
            case 6: dialog.appendChild(document.createTextNode("Tally count, ")); break;
            default: dialog.appendChild(document.createTextNode("MoreMenu Apples, ")); break;
        }
        switch (ctx.speed) {
            case 0: dialog.appendChild(document.createTextNode("Normal speed, ")); break;
            case 1: dialog.appendChild(document.createTextNode("Fast speed, ")); break;
            case 2: dialog.appendChild(document.createTextNode("Slow speed, ")); break;
            default: dialog.appendChild(document.createTextNode("MoreMenu speed, ")); break;
        }
        switch (ctx.size) {
            case 0: dialog.appendChild(document.createTextNode("Normal size")); break;
            case 1: dialog.appendChild(document.createTextNode("Small size")); break;
            case 2: dialog.appendChild(document.createTextNode("Large size")); break;
            default: dialog.appendChild(document.createTextNode("MoreMenu size")); break;
        }

        dialog.appendChild(document.createElement("br"));
        dialog.appendChild(document.createElement("br"));

        const storage = window.timeKeeper.getStorage();
        const attKey = window.timeKeeper.buildKey("att", ctx);
        const attemptRec = window.timeKeeper.normalizeAttemptRecord(storage[attKey]);

        const cellStyle =
            "box-sizing:border-box;padding:6px 8px;border:1px solid rgba(255,255,255,0.22);border-radius:6px;min-width:0;";

        function line(parent, text) {
            parent.appendChild(document.createTextNode(text));
            parent.appendChild(document.createElement("br"));
        }

        function titleLine(parent, text) {
            const span = document.createElement("span");
            span.style = "font-weight:bold;";
            span.appendChild(document.createTextNode(text));
            parent.appendChild(span);
            parent.appendChild(document.createElement("br"));
        }

        function buildTimedCell(score) {
            const cell = document.createElement("div");
            cell.style = cellStyle;
            const name = window.timeKeeper.buildKey(score, ctx);
            const titles = {
                "25": "25 Apples",
                "50": "50 Apples",
                "100": "100 Apples",
                ALL: "All Apples",
            };
            titleLine(cell, titles[score] + ":");
            const data = storage[name];
            if (typeof data == "undefined") {
                line(cell, "None");
                return cell;
            }
            line(cell, "Best Time: " + window.timeKeeper.formatDuration(data.time));
            line(cell, "Achieved on: " + window.timeKeeper.formatAchievedOnWithTime(data.date));
            if (data.att != undefined && data.sum != undefined && data.att > 0) {
                const avg = Math.floor(data.sum / data.att);
                line(cell, "Attempts to this point: " + data.att);
                line(cell, "Average: " + window.timeKeeper.formatDuration(avg));
            }
            return cell;
        }

        function buildHighscoreCell() {
            const cell = document.createElement("div");
            cell.style = cellStyle;
            titleLine(cell, "Highscore:");
            const name = window.timeKeeper.buildKey("H", ctx);
            const data = storage[name];
            if (typeof data == "undefined" || data.high == null) {
                line(cell, "None");
                return cell;
            }
            line(cell, String(data.high));
            line(cell, "Duration: " + window.timeKeeper.formatDuration(data.time));
            line(cell, "Achieved on: " + window.timeKeeper.formatAchievedOnWithTime(data.date));
            return cell;
        }

        function buildAttemptsCell() {
            const cell = document.createElement("div");
            cell.style = cellStyle;
            titleLine(cell, "Total Attempts:");
            line(cell, String(attemptRec.total));
            if (attemptRec.lastAttempt != null) {
                line(
                    cell,
                    "Latest: " + window.timeKeeper.formatAchievedOn(attemptRec.lastAttempt)
                );
            }
            line(cell, "This session: " + attemptRec.session);
            line(cell, "Last session: " + attemptRec.lastSession);
            return cell;
        }

        function buildRow(left, right) {
            const row = document.createElement("div");
            row.style = "display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;";
            row.appendChild(left);
            row.appendChild(right);
            return row;
        }

        dialog.appendChild(buildRow(buildTimedCell("25"), buildTimedCell("50")));
        dialog.appendChild(buildRow(buildTimedCell("100"), buildTimedCell("ALL")));
        dialog.appendChild(buildRow(buildHighscoreCell(), buildAttemptsCell()));

        if (window.SpeedrunMod && typeof window.buildSpeedInfoTrackingControls === "function") {
            const trackingControls = window.buildSpeedInfoTrackingControls();
            dialog.appendChild(trackingControls);
            if (typeof window.wireSpeedInfoTrackingControls === "function") {
                window.wireSpeedInfoTrackingControls(trackingControls);
            }
        }

        const buttonClose = document.createElement("button");
        buttonClose.appendChild(document.createTextNode("Close"));
        buttonClose.addEventListener("click", function () {
            window.timeKeeper.toggleDialog();
        });
        buttonClose.style =
            "display:block;margin:12px auto 0;color:white;background-color:" +
            window.button_color +
            ";";
        buttonClose.className = "btn";
        dialog.appendChild(buttonClose);

        dialog.setAttribute(
            "style",
            "outline: none;border-radius: 10px;z-index:10100;background:" +
                window.real_topbar_color +
                ";color:white;font-family:Roboto,Arial;min-width:420px;max-width:560px;"
        );
        dialog.classList.add("custom-dialog");
        body.insertBefore(dialog, body.firstChild);
    };

    window.timeKeeper.hideDialog = function () {
        const child = document.getElementById("timeKeeperDialog");
        if (child && child.parentElement) child.parentElement.removeChild(child);
        const backdrop = document.getElementById("timeKeeperBackdrop");
        if (backdrop && backdrop.parentElement) backdrop.parentElement.removeChild(backdrop);
        window.timeKeeper.dialogActive = false;
        const btn = document.getElementById("time-keeper");
        if (btn) btn.innerHTML = "Details";
    };

    window.timeKeeper.toggleDialog = function () {
        if (window.timeKeeper.dialogActive) window.timeKeeper.hideDialog();
        else window.timeKeeper.showDialog();
    };

    window.timeKeeper.setup = function () {
        window.timeKeeper.makeStorage();
        if (window.ModeRegistry && typeof window.ModeRegistry.has === "function") {
            window.isBridge = window.ModeRegistry.has("bridge");
        }
    };

    window.timeKeeper.setup();
};

window.TimeKeeper.alterCode = function (code) {
    func_regex = new RegExp(/tick\(\){[^\\]{1,4000}light=Math.max[\s\S]*?=function/);
    window.catchError(func_regex, code);
    let func = code.match(/tick\(\){[^\\]{1,4000}light=Math.max[\s\S]*?=function/)[0];
    StartOfNext = func.substring(func.lastIndexOf(";"), func.length);
    func = func.substring(0, func.lastIndexOf(";"));

    // v12: this.header=c;this.Oh=this.Eb=this.ticks=this.ob=0
    // v13: this.header=c;this.Sh=this.Fb=this.ticks=this.ob=0
    const scoreCtor = code.match(
        /this\.header=[a-zA-Z0-9_$];this\.([a-zA-Z0-9_$]{1,8})=this\.([a-zA-Z0-9_$]{1,8})=this\.ticks=/
    );
    let scoreFunc;
    let timeFunc;
    if (scoreCtor) {
        scoreFunc = "this." + scoreCtor[1];
        timeFunc = "this.ticks*this." + scoreCtor[2];
    } else {
        scoreFuncVar = func.match(/[a-zA-Z0-9$]{1,8}\=\=\=\n?25/)[0].split("=")[0];
        scoreFunc = func.match(
            `${window.escapeRegex(scoreFuncVar.replace("\n", ""))}=\n?this.[a-zA-Z0-9$]{1,8}`
        )[0].split("=")[1];
        timeFunc = func.match(/\([a-zA-Z0-9$]{1,8}\*[a-zA-Z0-9$]{1,8}\)/)[0];
        ticksVar = timeFunc.split("(")[1].split("*")[0];
        tickLengthVar = timeFunc.split("*")[1].split(")")[0];
        realTicks = func.match(`${escapeRegex(ticksVar)}=this.[a-zA-Z0-9$]{1,8}`)[0].split("=")[1];
        realTickLength = func.match(`${escapeRegex(tickLengthVar)}=this.[a-zA-Z0-9$]{1,8}`)[0].split(
            "="
        )[1];
        timeFunc = `${realTicks}*${realTickLength}`;
    }

    ownFunc = "window.timeKeeper.gotApple(Math.floor(" + timeFunc + ")," + scoreFunc + ");";
    if25_regex = new RegExp(/if\([a-zA-Z0-9$]{1,8}\=\=\=\n?25/);
    const if25_in_tick = func.match(if25_regex);
    if (if25_in_tick) {
        ownFuncIndex = func.indexOf(if25_in_tick[0]);
        func = func.slice(0, ownFuncIndex) + ownFunc + func.slice(ownFuncIndex);
    }

    func =
        func.slice(0, func.indexOf("WIN.play()") + 11) +
        "window.timeKeeper.gotAll(Math.floor(" +
        timeFunc +
        ")," +
        scoreFunc +
        ")," +
        func.slice(func.indexOf("WIN.play()") + 11);

    death = func.match(/if\(this.[a-zA-Z0-9$]{1,8}\|\|this.[a-zA-Z0-9$]{1,8}\)/)[0];
    death = death.slice(death.indexOf("(") + 1, death.indexOf("|"));
    func =
        func.slice(0, func.indexOf("{") + 1) +
        "if(" +
        death +
        "){window.timeKeeper.death(Math.floor(" +
        timeFunc +
        ")," +
        scoreFunc +
        ");}else if(!window.timeKeeper.runStarted){window.timeKeeper.start();}" +
        func.slice(func.indexOf("{") + 1);

    code = code.assertReplace(func_regex, func + StartOfNext);

    // v13 moved the 25/50/100 HUD update out of tick() into a helper.
    if (!if25_in_tick) {
        const appleHud = /([a-zA-Z0-9_$]{1,8})=function\(a,b,c,d\)\{if\(b===25\|\|b===50\|\|b===100\)/;
        window.catchError(appleHud, code);
        code = code.assertReplace(
            appleHud,
            "$1=function(a,b,c,d){window.timeKeeper.gotApple(Math.floor(c*d),b);if(b===25||b===50||b===100)"
        );
    }

    // Count attempts / clear runStarted on reset (SpeedrunMod has no Counter.js hook).
    // Safe to call twice: second addAttempt no-ops when runStarted is already false.
    code = code.assertReplace(
        /;this\.reset\(\)\}\}/,
        `;window.timeKeeper.addAttempt();this.reset()}}`
    );

    return code;
};
