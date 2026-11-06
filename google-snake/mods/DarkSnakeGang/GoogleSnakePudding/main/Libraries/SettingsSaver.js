window.SettingsSaver = {};

window.SettingsSaver.make = function () {
    const COUNT_KEYS = ["0", "1", "2", "3", "4", "5", "6"];
    const COUNT_MINIMA = { 0: 1, 1: 3, 2: 5, 3: 10, 4: 6, 5: 24, 6: 5 };
    const PUDDING_SETTINGS_VERSION = 1;

    const GAME_SETTING_KEYS = [
        "trophy",
        "count",
        "speed",
        "size",
        "graphics",
        "theme",
        "color",
        "apple",
    ];

    // v12/v13 share the same menu rows today; caps are fallbacks when DOM is not ready yet.
    const FALLBACK_ROW_LIMITS = {
        trophy: 25,
        count: 7,
        speed: 3,
        size: 3,
        graphics: 7,
        theme: 24,
        color: 24,
        apple: 50,
    };

    function getSelectorRowLength(selectorId) {
        const row = document.getElementById(selectorId);
        return row && row.children ? row.children.length : 0;
    }

    function clampSettingIndex(index, maxLen) {
        let i = Number(index);
        if (isNaN(i) || i < 0) return 0;
        if (!maxLen || maxLen <= 0) return i;
        return Math.min(i, maxLen - 1);
    }

    function nativeGraphicsCount() {
        return window.nativeGraphicsCount || 4;
    }

    // Pair-mix slots (indices >= native count) map back to a native style if mix icons are missing.
    function fallbackNativeGraphics(savedIndex) {
        const n = nativeGraphicsCount();
        const g = Number(savedIndex);
        if (isNaN(g) || g < 0) return 0;
        if (g < n - 1) return g;
        const pools = {};
        pools[n - 1] = 0;
        pools[n] = 0;
        pools[n + 1] = 1;
        pools[n + 2] = 0;
        return Object.prototype.hasOwnProperty.call(pools, g) ? pools[g] : 0;
    }

    function requiredGraphicsRowLength(savedGraphics) {
        const g = Number(savedGraphics);
        if (isNaN(g) || g < 0) return nativeGraphicsCount();
        const n = nativeGraphicsCount();
        if (g < n) return n;
        return n + 3;
    }

    function graphicsRowReady(savedGraphics) {
        const len = getSelectorRowLength("graphics");
        if (!len) return false;
        return len >= requiredGraphicsRowLength(savedGraphics);
    }

    function sanitizeSavedGameSettings(snap, options) {
        if (!snap || typeof snap !== "object") return snap;
        const out = Object.assign({}, snap);
        const savedRows = out._rowLengths && typeof out._rowLengths === "object" ? out._rowLengths : null;
        const allowGraphicsFallback = !!(options && options.allowGraphicsFallback);

        for (const key of GAME_SETTING_KEYS) {
            if (typeof out[key] !== "number" || isNaN(out[key])) continue;

            let maxLen = getSelectorRowLength(key);
            if (!maxLen && savedRows && typeof savedRows[key] === "number") {
                maxLen = savedRows[key];
            }
            if (!maxLen && FALLBACK_ROW_LIMITS[key]) {
                maxLen = FALLBACK_ROW_LIMITS[key];
            }

            if (key === "graphics" && maxLen && out[key] >= nativeGraphicsCount()) {
                if (allowGraphicsFallback && maxLen < requiredGraphicsRowLength(out[key])) {
                    out[key] = fallbackNativeGraphics(out[key]);
                } else {
                    out[key] = clampSettingIndex(out[key], maxLen);
                }
            } else if (maxLen) {
                out[key] = clampSettingIndex(out[key], maxLen);
            }
        }

        return out;
    }

    function defaultPoolForCount(count) {
        const min = COUNT_MINIMA[count] || 1;
        const pool = [];
        for (let i = 0; pool.length < min; i++) {
            if (i === 24) continue; // skip fruit bowl
            pool.push(i);
        }
        return pool;
    }

    function migrateSelectedPairsByCount(settings) {
        if (settings.SelectedPairsByCount && typeof settings.SelectedPairsByCount === "object") {
            for (const key of COUNT_KEYS) {
                if (!Array.isArray(settings.SelectedPairsByCount[key])) {
                    settings.SelectedPairsByCount[key] = defaultPoolForCount(Number(key));
                }
            }
            return settings;
        }

        const legacy = Array.isArray(settings.SelectedPairs) ? settings.SelectedPairs.map(Number) : null;
        settings.SelectedPairsByCount = {};
        for (const key of COUNT_KEYS) {
            const count = Number(key);
            const min = COUNT_MINIMA[count];
            // Seed each count with only its own minimum slice of the old shared list
            const seed = legacy ? legacy.slice(0, min) : defaultPoolForCount(count);
            const pool = Array.from(new Set(seed.map(Number).filter((n) => !isNaN(n) && n !== 24)));
            for (let i = 0; pool.length < min; i++) {
                if (i === 24) continue;
                if (!pool.includes(i)) pool.push(i);
            }
            settings.SelectedPairsByCount[key] = pool;
        }
        return settings;
    }

    function copyPool(pool, fallbackCount) {
        if (Array.isArray(pool)) {
            return pool.map(Number).filter((n) => !isNaN(n) && n !== 24);
        }
        return defaultPoolForCount(fallbackCount);
    }

    function migrateSelectedPairsByCountGeneral(settings) {
        if (!settings.SelectedPairsByCountGeneral || typeof settings.SelectedPairsByCountGeneral !== "object") {
            settings.SelectedPairsByCountGeneral = {};
        }
        for (const key of COUNT_KEYS) {
            if (!Array.isArray(settings.SelectedPairsByCountGeneral[key])) {
                const src = settings.SelectedPairsByCount && settings.SelectedPairsByCount[key];
                settings.SelectedPairsByCountGeneral[key] = copyPool(src, Number(key));
            }
        }
        return settings;
    }

    function migratePuddingSettings(settings) {
        if (!settings || typeof settings !== "object") return settings;

        if (typeof settings.StorageVersion !== "number") {
            settings.StorageVersion = PUDDING_SETTINGS_VERSION;
        }

        settings = migrateSelectedPairsByCount(settings);
        settings.SelectedPairs = settings.SelectedPairsByCount["0"];
        settings = migrateSelectedPairsByCountGeneral(settings);

        if (settings.SavedGameSettings && typeof settings.SavedGameSettings === "object") {
            settings.SavedGameSettings = sanitizeSavedGameSettings(settings.SavedGameSettings, {
                allowGraphicsFallback: true,
            });
        }

        settings.StorageVersion = PUDDING_SETTINGS_VERSION;
        return settings;
    }

    window.loadSettings = function () {
        let pudding_settings = localStorage.getItem('PuddingSettings');
        if (pudding_settings === null) {
            pudding_settings = {
                StorageVersion: PUDDING_SETTINGS_VERSION,
                Skull: false,
                SokoGoals: true,
                InputDisplay: false,
                TopBar: true,
                SpeedInfo: false,
                ShowWrHolders: true,
                TrackedPlayerName: "",
                PortalPairs: false,
                AlwaysUniqueFruit: true,
                SelectedPairs: defaultPoolForCount(0),
                SelectedPairsByCount: {},
                SelectedPairsByCountGeneral: {},
                DisableRandom: false,
                randomizeThemeApple: false,
                ScrollBar: false,
                SaveGameSettings: true,
                SavedGameSettings: null,
                SplitPanel: false,
                BigPanelText: true,
                OldTimeKeeperFormat: false,
                FpsCounter: false,
            };
            for (const key of COUNT_KEYS) {
                pudding_settings.SelectedPairsByCount[key] = defaultPoolForCount(Number(key));
                pudding_settings.SelectedPairsByCountGeneral[key] = defaultPoolForCount(Number(key)).slice();
            }
        } else {
            pudding_settings = JSON.parse(pudding_settings);
            const needsPersist = typeof pudding_settings.StorageVersion !== "number";
            if (typeof pudding_settings.PortalPairs !== 'boolean') {
                pudding_settings.PortalPairs = false;
            }
            if (typeof pudding_settings.AlwaysUniqueFruit !== 'boolean') {
                pudding_settings.AlwaysUniqueFruit = true;
            }
            if (typeof pudding_settings.ScrollBar !== 'boolean') {
                pudding_settings.ScrollBar = false;
            }
            if (typeof pudding_settings.ShowWrHolders !== 'boolean') {
                pudding_settings.ShowWrHolders = true;
            }
            if (typeof pudding_settings.TrackedPlayerName !== 'string') {
                pudding_settings.TrackedPlayerName = "";
            }
            if (typeof pudding_settings.SaveGameSettings !== 'boolean') {
                pudding_settings.SaveGameSettings = true;
            }
            if (typeof pudding_settings.SplitPanel !== 'boolean') {
                pudding_settings.SplitPanel = false;
            }
            if (typeof pudding_settings.BigPanelText !== 'boolean') {
                pudding_settings.BigPanelText = true;
            }
            if (typeof pudding_settings.OldTimeKeeperFormat !== 'boolean') {
                pudding_settings.OldTimeKeeperFormat = false;
            }
            if (typeof pudding_settings.FpsCounter !== 'boolean') {
                pudding_settings.FpsCounter = false;
            }
            if (
                pudding_settings.SavedGameSettings !== null &&
                typeof pudding_settings.SavedGameSettings !== 'object'
            ) {
                pudding_settings.SavedGameSettings = null;
            }
            pudding_settings = migratePuddingSettings(pudding_settings);
            if (needsPersist) {
                window._puddingSettingsNeedsPersist = true;
            }
        }

        return pudding_settings;
    }
    window.pudding_settings = window.loadSettings();

    window.saveSettings = function () {
        const s = window.pudding_settings;
        if (typeof s !== 'undefined' &&
            typeof s.Skull !== 'undefined' &&
            typeof s.SokoGoals !== 'undefined' &&
            typeof s.InputDisplay !== 'undefined' &&
            typeof s.TopBar !== 'undefined' &&
            typeof s.SpeedInfo !== 'undefined' &&
            typeof s.PortalPairs !== 'undefined' &&
            typeof s.DisableRandom !== 'undefined' &&
            typeof s.randomizeThemeApple !== 'undefined'
        ) {
            localStorage.setItem('PuddingSettings', JSON.stringify(s));
        }
    }

    if (window._puddingSettingsNeedsPersist) {
        window.saveSettings();
        window._puddingSettingsNeedsPersist = false;
    }

    // Read selected child index for a Google Snake selector row
    window.readGameSettingIndex = function (selectorId) {
        const root = document.getElementById(selectorId);
        if (!root || !root.children || !root.children.length) return 0;

        // Selected icon uses tuJOWd (optionally with other classes)
        for (let i = 0; i < root.children.length; i++) {
            const el = root.children[i];
            if (el.classList && el.classList.contains("tuJOWd")) return i;
            const cls = el.className || "";
            if (cls === "tuJOWd" || cls === "DqMRee tuJOWd") return i;
        }

        // Odd-class-out (trophy / count style)
        const classNames = [];
        let notUnique = "";
        for (const el of root.children) {
            if (classNames.indexOf(el.className) === -1) classNames.push(el.className);
            else {
                notUnique = el.className;
                break;
            }
        }
        if (notUnique) {
            let n = 0;
            for (const el of root.children) {
                if (el.className !== notUnique) return n;
                n++;
            }
        }
        return 0;
    };

    window.clickGameSettingIndex = function (selectorId, index) {
        let i = Number(index);
        if (isNaN(i) || i < 0) i = 0;

        // Google's p7 selector (scroll + settings object). Child .click() does not stick.
        if (typeof window.puddingMenuSelect === "function") {
            return window.puddingMenuSelect(selectorId, i);
        }
        return false;
    };

    window._openSnakeSettingsPanel = function () {
        const gear =
            document.querySelector('div[jsname="iyH4Cb"]') ||
            document.querySelector('div[jsname^="iyH4Cb"]');
        if (gear && typeof gear.click === "function") {
            gear.click();
            return true;
        }
        return false;
    };

    window._closeSnakeSettingsPanel = function () {
        // Native back control uses class p17HVe
        const back =
            document.querySelector(".p17HVe") ||
            document.querySelector('[class^="p17HVe"]') ||
            document.querySelector('[class*="p17HVe"]');
        if (back && typeof back.click === "function") {
            back.click();
            return true;
        }
        return false;
    };

    window.saveCurrentGameSettings = function () {
        if (!window.pudding_settings) return;
        const snap = {};
        for (const key of GAME_SETTING_KEYS) {
            snap[key] = window.readGameSettingIndex(key);
        }
        // Prefer live vars when DOM class detection is ambiguous
        if (typeof window.graphics_selected === "number") {
            snap.graphics = window.graphics_selected;
        }
        if (typeof window.fruit_selected === "number") {
            snap.apple = window.fruit_selected;
        }
        snap._rowLengths = {};
        for (const key of GAME_SETTING_KEYS) {
            const len = getSelectorRowLength(key);
            if (len) snap._rowLengths[key] = len;
        }
        snap._nativeGraphicsCount = nativeGraphicsCount();
        window.pudding_settings.SavedGameSettings = sanitizeSavedGameSettings(snap, {
            allowGraphicsFallback: false,
        });
        if (typeof window.saveSettings === "function") window.saveSettings();
    };

    window.applySavedGameSettingsOnce = function () {
        if (window._puddingGameSettingsApplied) return;

        const s = window.pudding_settings;
        if (!s || !s.SaveGameSettings) {
            window._puddingGameSettingsApplied = true;
            return;
        }
        let snap = s.SavedGameSettings;
        if (!snap || typeof snap !== "object") {
            window._puddingGameSettingsApplied = true;
            return;
        }
        snap = sanitizeSavedGameSettings(snap, { allowGraphicsFallback: false });

        const gear =
            document.querySelector('div[jsname="iyH4Cb"]') ||
            document.querySelector('div[jsname^="iyH4Cb"]');
        const trophy = document.getElementById("trophy");
        const p7Ready = typeof window._puddingSnakeP7 === "function";

        if (!gear || !trophy || !trophy.children || !trophy.children.length || !p7Ready) {
            if (typeof window._puddingGameSettingsApplyTries !== "number") {
                window._puddingGameSettingsApplyTries = 0;
            }
            window._puddingGameSettingsApplyTries++;
            if (window._puddingGameSettingsApplyTries > 100) {
                window._puddingGameSettingsApplied = true;
                return;
            }
            setTimeout(window.applySavedGameSettingsOnce, 50);
            return;
        }

        window._puddingGameSettingsApplied = true;

        // Open settings → wait until menu is live → apply via p7 → back (p17HVe).
        window._openSnakeSettingsPanel();

        const order = [
            "trophy",
            "count",
            "speed",
            "size",
            "graphics",
            "theme",
            "color",
            "apple",
        ];

        let waitTries = 0;
        function waitMenuThenApply() {
            waitTries++;
            const menu = window._puddingSnakeMenu;
            const ready =
                menu &&
                menu.oa === "settings" &&
                typeof window._puddingSnakeP7 === "function";

            if (!ready) {
                if (waitTries > 80) {
                    // Still try back so we don't leave settings open
                    window._closeSnakeSettingsPanel();
                    return;
                }
                setTimeout(waitMenuThenApply, 50);
                return;
            }

            if (typeof snap.graphics === "number" && snap.graphics >= nativeGraphicsCount()) {
                if (typeof window.appendPairGraphicsIcons === "function") {
                    window.appendPairGraphicsIcons();
                }
                if (!graphicsRowReady(snap.graphics)) {
                    if (waitTries > 80) {
                        snap = sanitizeSavedGameSettings(snap, { allowGraphicsFallback: true });
                    } else {
                        setTimeout(waitMenuThenApply, 50);
                        return;
                    }
                }
            }

            for (const key of order) {
                if (typeof snap[key] === "number") {
                    window.puddingMenuSelect(key, snap[key]);
                }
            }

            setTimeout(function () {
                window._closeSnakeSettingsPanel();
            }, 100);
        }

        setTimeout(waitMenuThenApply, 50);
    };

    // Public helper used after alterCode exposes Google's selector.
    window.puddingMenuSelect = function (id, index) {
        const menu = window._puddingSnakeMenu;
        const p7 = window._puddingSnakeP7;
        if (!menu || typeof p7 !== "function") return false;
        const row =
            (menu.ka && menu.ka.iW && menu.ka.iW.get(id)) ||
            document.getElementById(id);
        if (!row || !row.children || !row.children.length) return false;
        let i = Number(index);
        if (isNaN(i) || i < 0) i = 0;
        if (i >= row.children.length) i = row.children.length - 1;
        p7(menu, row, true, i);
        return true;
    };
}

window.SettingsSaver.alterCode = function (code) {
    reset_regex = new RegExp(/;this\.reset\(\)\}\}/)

    settings_reset_code = `
    saveSettings();
    $&`

    catchError(reset_regex, code)
    code = code.assertReplace(reset_regex, settings_reset_code);

    stop_regex = new RegExp(/stop\(a\){/)
    catchError(stop_regex, code)
    save_settings_code = `stop\(a\){saveSettings();`

    code = code.assertReplace(stop_regex, save_settings_code);

    // Expose Google's menu selector (p7). Child element .click() does not change settings;
    // selection is scroll-position based and writes a.settings.* inside this function.
    const menuSelectRegex = /([a-zA-Z0-9_$]{1,8})=function\(a,b,c,d=-1\)\{d=d!==-1\?d:([a-zA-Z0-9_$]{1,8})\(a,b\);for\(var e=0;e<b\.children\.length/;
    catchError(menuSelectRegex, code);
    code = code.assertReplace(
        menuSelectRegex,
        `$1=window._puddingSnakeP7=function(a,b,c,d=-1){window._puddingSnakeMenu=a;d=d!==-1?d:$2(a,b);for(var e=0;e<b.children.length`
    );

    // Capture menu when native settings open (Ec).
    const openSettingsRegex = /([a-zA-Z0-9_$]{1,8})\(\)\{var a=this\.menu;a\.oa="settings";/;
    catchError(openSettingsRegex, code);
    code = code.assertReplace(
        openSettingsRegex,
        `$1(){var a=this.menu;window._puddingSnakeMenu=a;a.oa="settings";`
    );

    return code;
}
