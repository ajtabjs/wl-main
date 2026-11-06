window.CustomBowl = {};

window.CustomBowl.make = function () {
    const FRUIT_BOWL_INDEX = 24;
    const COUNT_MINIMA = {
        0: 1,  // 1a
        1: 3,  // 3a
        2: 5,  // 5a
        3: 10, // 10a
        4: 6,  // dice
        5: 24, // bomb
        6: 5   // tally
    };
    const BOWL_SPRITE = "https://www.google.com/logos/fnbx/snake_arcade/v17/apple_22.png";

    window.custom_pair_call_counter = 0;
    window.__portalAppleArrayName = window.__portalAppleArrayName || "ka";
    window.__customBowlCountOverride = null;
    window._fruitBowlTab = window._fruitBowlTab || "general";

    function clampCountIndex(count) {
        const n = Number(count);
        if (isNaN(n)) return 0;
        if (n < 0) return 0;
        if (n > 6) return 6;
        return n;
    }

    function readCountIndexFromDom() {
        const root = document.getElementById("count");
        if (!root || !root.children || !root.children.length) return null;
        for (let i = 0; i < root.children.length; i++) {
            const el = root.children[i];
            const cls = el.className || "";
            if ((el.classList && el.classList.contains("tuJOWd")) || /\btuJOWd\b/.test(cls)) {
                return i;
            }
        }
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
        return null;
    }

    function getCountIndex() {
        if (typeof window.__customBowlCountOverride === "number" && !isNaN(window.__customBowlCountOverride)) {
            return clampCountIndex(window.__customBowlCountOverride);
        }
        const fromDom = readCountIndexFromDom();
        if (fromDom !== null) return clampCountIndex(fromDom);
        try {
            if (window.timeKeeper && typeof window.timeKeeper.getCurrentSetting === "function") {
                const c = window.timeKeeper.getCurrentSetting("count");
                if (typeof c === "number" && !isNaN(c)) return clampCountIndex(c);
            }
        } catch (e) { /* set_ref may not exist yet */ }
        return 0;
    }

    function countMinima(count) {
        return COUNT_MINIMA.hasOwnProperty(count) ? COUNT_MINIMA[count] : 1;
    }

    window.getPortalPairMinimum = function () {
        return countMinima(getCountIndex());
    };

    function countKey(count) {
        return String(count);
    }

    function isPortalTab() {
        return window._fruitBowlTab === "portal";
    }

    function storeNameForKind(kind) {
        return kind === "general" ? "SelectedPairsByCountGeneral" : "SelectedPairsByCount";
    }

    function minForKind(kind, count) {
        count = clampCountIndex(count);
        if (kind === "portal") return countMinima(count);
        if (window.pudding_settings && window.pudding_settings.AlwaysUniqueFruit) {
            return countMinima(count);
        }
        return 1;
    }

    function minForTab() {
        return minForKind(isPortalTab() ? "portal" : "general", getCountIndex());
    }

    function defaultPoolForCount(count) {
        return normalizePool([], countMinima(count));
    }

    function normalizePool(pool, min) {
        let next = Array.isArray(pool) ? pool.map(Number).filter((n) => !isNaN(n) && n !== FRUIT_BOWL_INDEX) : [];
        next = Array.from(new Set(next));
        if (next.length < min) {
            for (let i = 0; i < 64 && next.length < min; i++) {
                if (i === FRUIT_BOWL_INDEX) continue;
                if (!next.includes(i)) next.push(i);
            }
        }
        return next;
    }

    function copyPoolArray(pool, fallbackCount) {
        if (Array.isArray(pool)) {
            return pool.map(Number).filter((n) => !isNaN(n) && n !== FRUIT_BOWL_INDEX);
        }
        return defaultPoolForCount(fallbackCount);
    }

    function ensureStore(kind) {
        const name = storeNameForKind(kind);
        if (!window.pudding_settings[name] || typeof window.pudding_settings[name] !== "object") {
            window.pudding_settings[name] = {};
        }
        const store = window.pudding_settings[name];
        const portalStore = window.pudding_settings.SelectedPairsByCount;
        for (const c of Object.keys(COUNT_MINIMA)) {
            const key = countKey(c);
            if (!Array.isArray(store[key])) {
                const src = kind === "general" && portalStore && Array.isArray(portalStore[key])
                    ? portalStore[key]
                    : null;
                store[key] = copyPoolArray(src, Number(c));
            }
        }
        return store;
    }

    function getPoolForKind(kind, minOverride) {
        const store = ensureStore(kind);
        const count = getCountIndex();
        const key = countKey(count);
        const min = Math.max(minForKind(kind, count), minOverride || 0);
        const pool = normalizePool(store[key], min);
        store[key] = pool;
        if (kind === "portal") {
            window.pudding_settings.SelectedPairs = pool;
        }
        return pool;
    }

    function setPoolForKind(kind, pool) {
        const store = ensureStore(kind);
        const count = getCountIndex();
        const key = countKey(count);
        const min = minForKind(kind, count);
        const next = normalizePool(pool, min);
        store[key] = next;
        if (kind === "portal") {
            window.pudding_settings.SelectedPairs = next;
        }
        return next;
    }

    function getPoolForCurrentCount(minOverride) {
        return getPoolForKind(isPortalTab() ? "portal" : "general", minOverride);
    }

    function setPoolForCurrentCount(pool) {
        return setPoolForKind(isPortalTab() ? "portal" : "general", pool);
    }

    function ensurePoolMeetsMinimum() {
        ensureStore("portal");
        ensureStore("general");
        getPoolForKind("portal");
        if (window.pudding_settings && window.pudding_settings.AlwaysUniqueFruit) {
            const store = ensureStore("general");
            for (const c of Object.keys(COUNT_MINIMA)) {
                const key = countKey(c);
                store[key] = normalizePool(store[key], countMinima(Number(c)));
            }
        }
        getPoolForKind("general");
        return getPoolForCurrentCount();
    }

    function getAppleList(appleManager) {
        if (!appleManager) return null;
        const key = window.__portalAppleArrayName || "ka";
        if (Array.isArray(appleManager[key])) return appleManager[key];
        if (Array.isArray(appleManager.ka)) return appleManager.ka;
        return null;
    }

    // Types currently visible on the board (type < 0 = slot being reassigned, not showing).
    function typesOnBoard(appleManager, ctx) {
        const showing = new Set();
        const apples = getAppleList(appleManager);
        if (!apples) return showing;
        ctx = ctx || {};
        for (const apple of apples) {
            if (!apple) continue;
            const t = Number(apple.type);
            if (isNaN(t) || t < 0) continue;
            if (ctx.lh !== undefined && !!apple.Lh !== ctx.lh) continue;
            if (ctx.oka !== undefined && !!apple.Oka !== ctx.oka) continue;
            if (ctx.pairOka && ctx.pairOka.indexOf(!!apple.Oka) < 0) continue;
            showing.add(t);
        }
        return showing;
    }

    function pendingApple(appleManager) {
        const apples = getAppleList(appleManager);
        if (!apples) return null;
        for (const apple of apples) {
            if (!apple) continue;
            const t = Number(apple.type);
            if (isNaN(t) || t < 0) return apple;
        }
        return null;
    }

    function assignContext(appleManager, opts) {
        opts = opts || {};
        const settings = appleManager && appleManager.settings;
        const pending = pendingApple(appleManager);
        const ctx = {};
        if (opts.pairOka) {
            ctx.pairOka = opts.pairOka;
        } else if (pending && pending.Oka !== undefined &&
            window.__bowlIsMode && window.__bowlIsMode(settings, 10)) {
            ctx.oka = !!pending.Oka;
        }
        if (opts.lh !== undefined) {
            ctx.lh = !!opts.lh;
        } else if (pending && window.__bowlIsMode && window.__bowlIsMode(settings, 9)) {
            ctx.lh = !!pending.Lh;
        }
        return ctx;
    }

    function pickMatchesCtx(entry, ctx) {
        if (entry.lh !== undefined && ctx.lh !== undefined && entry.lh !== ctx.lh) return false;
        if (entry.oka !== undefined && ctx.oka !== undefined && entry.oka !== ctx.oka) return false;
        if (entry.pairOka && ctx.pairOka) {
            for (let i = 0; i < entry.pairOka.length; i++) {
                if (ctx.pairOka.indexOf(entry.pairOka[i]) >= 0) return true;
            }
            return false;
        }
        if (entry.pairOka && ctx.oka !== undefined) {
            return entry.pairOka.indexOf(ctx.oka) >= 0;
        }
        return true;
    }

    function mergeUniquePicks(showing, ctx) {
        if (!window.__bowlUniquePicks) return;
        window.__bowlUniquePicks.forEach(function (entry) {
            if (pickMatchesCtx(entry, ctx)) showing.add(entry.type);
        });
    }

    // Dimension pairs alternate Oka; assign before type picks when unique needs it.
    window.ensureCustomBowlDimensionOka = function (appleManager) {
        if (!appleManager || !window.__bowlIsMode || !window.__bowlIsMode(appleManager.settings, 10)) return;
        const apples = getAppleList(appleManager);
        if (!apples || apples.length < 2) return;
        for (let b = 0; b + 1 < apples.length; b += 2) {
            const c = Math.random() < 0.5;
            apples[b].Oka = c;
            apples[b + 1].Oka = !c;
        }
    };

    // When every pool type still looks "on board", pick the least-used ones
    // (the eaten slot, once cleared to -1, is the only 0-count type at minimum).
    function rarestPoolTypes(appleManager, pool, ctx) {
        ctx = ctx || {};
        const counts = new Map();
        for (let i = 0; i < pool.length; i++) counts.set(pool[i], 0);
        const apples = getAppleList(appleManager);
        if (apples) {
            for (const apple of apples) {
                if (!apple) continue;
                const t = Number(apple.type);
                if (!counts.has(t)) continue;
                if (ctx.lh !== undefined && !!apple.Lh !== ctx.lh) continue;
                if (ctx.oka !== undefined && !!apple.Oka !== ctx.oka) continue;
                if (ctx.pairOka && ctx.pairOka.indexOf(!!apple.Oka) < 0) continue;
                counts.set(t, counts.get(t) + 1);
            }
        }
        let best = Infinity;
        counts.forEach(function (n) { if (n < best) best = n; });
        return pool.filter(function (t) { return counts.get(t) === best; });
    }

    function isCustomBowlActive(settings) {
        if (!(window.pudding_settings && window.pudding_settings.PortalPairs && settings)) return false;
        const prop = window.__fruitBowlSettingProp || "Ka";
        return Number(settings[prop]) === 24;
    }

    function syncCountOverride(settings) {
        if (settings && typeof settings.ka === "number" && !isNaN(settings.ka)) {
            window.__customBowlCountOverride = settings.ka;
        }
    }

    function rememberUniquePick(type, ctx) {
        if (!window.__bowlUniquePicks) window.__bowlUniquePicks = [];
        const entry = { type: type };
        if (ctx) {
            if (ctx.lh !== undefined) entry.lh = ctx.lh;
            if (ctx.oka !== undefined) entry.oka = ctx.oka;
            if (ctx.pairOka) entry.pairOka = ctx.pairOka.slice();
        }
        window.__bowlUniquePicks.push(entry);
        if (!window.__bowlUniquePicksClear) {
            window.__bowlUniquePicksClear = true;
            setTimeout(function () {
                window.__bowlUniquePicks = [];
                window.__bowlUniquePicksClear = false;
            }, 0);
        }
    }

    /**
     * Roll a fruit from the custom bowl pool.
     * Portal always unique + portal store.
     * Other modes use General store; unique iff AlwaysUniqueFruit.
     * Simultaneous 3a/5a picks in one turn share __bowlUniquePicks.
     */
    window.pickCustomPortalType = function (appleManager, isPortal, opts) {
        syncCountOverride(appleManager && appleManager.settings);
        try {
            const kind = isPortal ? "portal" : "general";
            const pool = getPoolForKind(kind);
            if (!pool.length) return 0;
            const useUnique = !!isPortal ||
                !!(window.pudding_settings && window.pudding_settings.AlwaysUniqueFruit);
            if (!useUnique) {
                return pool[Math.floor(Math.random() * pool.length)];
            }
            const ctx = assignContext(appleManager, opts || {});
            const showing = typesOnBoard(appleManager, ctx);
            mergeUniquePicks(showing, ctx);
            const available = pool.filter((t) => !showing.has(t));
            const source = available.length > 0 ? available : rarestPoolTypes(appleManager, pool, ctx);
            const picked = source[Math.floor(Math.random() * source.length)];
            rememberUniquePick(picked, ctx);
            return picked;
        } finally {
            window.__customBowlCountOverride = null;
        }
    };

    // Portal-only full board assign: clear slots, then roll with showing-list rules.
    window.assignCustomPortalPairTypes = function (appleManager) {
        if (!appleManager || !isCustomBowlActive(appleManager.settings)) return false;
        const apples = getAppleList(appleManager);
        if (!apples || apples.length < 2) return false;

        window.ensureCustomBowlDimensionOka(appleManager);

        for (let i = 0; i < apples.length; i++) apples[i].type = -1;

        for (let i = 0; i < apples.length; i += 2) {
            const a0 = apples[i];
            const a1 = apples[i + 1];
            const opts = {};
            if (window.__bowlIsMode && window.__bowlIsMode(appleManager.settings, 10)) {
                opts.pairOka = [!!a0.Oka, a1 ? !!a1.Oka : !!a0.Oka];
            } else if (window.__bowlIsMode && window.__bowlIsMode(appleManager.settings, 9)) {
                opts.lh = !!a0.Lh;
            }
            const t = window.pickCustomPortalType(appleManager, true, opts);
            apples[i].type = t;
            if (apples[i + 1]) apples[i + 1].type = t;
        }
        return true;
    };

    // Portal-only safety: if two pairs share a type, re-roll with showing-list rules.
    window.enforceUniquePortalFruitTypes = function (appleManager) {
        if (!appleManager || !isCustomBowlActive(appleManager.settings)) return;
        // assignCustomPortalPairTypes already enforces per-dimension uniqueness.
        if (window.__bowlIsMode && window.__bowlIsMode(appleManager.settings, 10)) return;
        const apples = getAppleList(appleManager);
        if (!apples || apples.length < 2) return;

        const seen = new Set();
        for (let i = 0; i < apples.length; i += 2) {
            const a0 = apples[i];
            const a1 = apples[i + 1];
            let t = Number(a0 && a0.type);
            if (isNaN(t) || t < 0 || seen.has(t)) {
                if (a0) a0.type = -1;
                if (a1) a1.type = -1;
                const opts = {};
                if (window.__bowlIsMode && window.__bowlIsMode(appleManager.settings, 9)) {
                    opts.lh = !!a0.Lh;
                }
                t = window.pickCustomPortalType(appleManager, true, opts);
                if (a0) a0.type = t;
                if (a1) a1.type = t;
            } else if (a1 && Number(a1.type) !== t) {
                a1.type = t;
            }
            seen.add(t);
        }
    };

    window.give_custom_pair = function () {
        return window.pickCustomPortalType(null, true);
    };
    window.startCustomBowlDeal = function () { /* no-op */ };
    window.endCustomBowlDeal = function () { /* no-op */ };

    function getFruitSrc(index) {
        const apple = document.querySelector("#apple");
        if (apple && apple.children[index] && apple.children[index].src) {
            return apple.children[index].src;
        }
        if (index < FRUIT_BOWL_INDEX) {
            const ver = index >= 22 ? "v18" : "v17";
            const num = String(index).padStart(2, "0");
            return `https://www.google.com/logos/fnbx/snake_arcade/${ver}/apple_${num}.png`;
        }
        return BOWL_SPRITE;
    }

    function buildFruitOptions() {
        const apple = document.querySelector("#apple");
        const options = [];
        if (!apple) return options;
        for (let i = 0; i < apple.children.length; i++) {
            if (i === FRUIT_BOWL_INDEX) continue;
            options.push(i);
        }
        return options;
    }

    function tabButtonStyle(active) {
        const bg = active ? "#1155CC" : "rgba(17,85,204,0.45)";
        return "margin:0;padding:4px 16px;color:white;background-color:" + bg +
            ";font-family:Roboto,Arial,sans-serif;border:1px solid rgba(255,255,255,0.25);";
    }

    function syncTabUi() {
        const portalBtn = document.getElementById("fruit-bowl-tab-portal");
        const generalBtn = document.getElementById("fruit-bowl-tab-general");
        const uniqueRow = document.getElementById("fruit-bowl-unique-row");
        const portalNote = document.getElementById("fruit-bowl-portal-note");
        const portalOn = isPortalTab();
        if (portalBtn) portalBtn.style.cssText = tabButtonStyle(portalOn);
        if (generalBtn) generalBtn.style.cssText = tabButtonStyle(!portalOn);
        if (uniqueRow) uniqueRow.style.display = portalOn ? "none" : "flex";
        if (portalNote) portalNote.style.display = portalOn ? "block" : "none";
    }

    function updateStatusLabel() {
        const el = document.getElementById("fruit-bowl-status");
        if (!el) return;
        const pool = getPoolForCurrentCount();
        const min = minForTab();
        el.textContent = `Selected ${pool.length} / min ${min}`;
    }

    function renderFruitGrid() {
        const grid = document.getElementById("fruit-bowl-grid");
        if (!grid) return;
        const pool = new Set(getPoolForCurrentCount());
        const options = buildFruitOptions();
        const min = minForTab();
        grid.innerHTML = "";

        const rowSize = 7;
        for (let i = 0; i < options.length; i += rowSize) {
            const row = document.createElement("div");
            row.style = "display:flex;flex-wrap:nowrap;gap:8px;margin-bottom:8px;justify-content:center;";
            options.slice(i, i + rowSize).forEach((fruitIndex) => {
                const selected = pool.has(fruitIndex);
                const cell = document.createElement("div");
                cell.className = "blender_icon" + (selected ? " blender_icon_on" : "");
                cell.style = "width:52px;height:52px;padding-bottom:0;flex:0 0 52px;display:flex;align-items:center;justify-content:center;cursor:pointer;";
                cell.dataset.fruit = String(fruitIndex);
                cell.title = `Fruit ${fruitIndex}`;

                const img = document.createElement("img");
                img.className = "blender_icon_img" + (selected ? " blender_icon_img_selected" : "");
                img.src = getFruitSrc(fruitIndex);
                img.draggable = false;
                img.style = "width:44px;height:44px;max-width:100%;";
                cell.appendChild(img);

                cell.addEventListener("click", function () {
                    if (!window.pudding_settings.PortalPairs) return;
                    const current = getPoolForCurrentCount().slice();
                    const idx = current.indexOf(fruitIndex);
                    if (idx >= 0) {
                        if (current.length <= min) return;
                        current.splice(idx, 1);
                    } else {
                        current.push(fruitIndex);
                    }
                    setPoolForCurrentCount(current.sort((a, b) => a - b));
                    if (typeof window.saveSettings === "function") window.saveSettings();
                    renderFruitGrid();
                    updateStatusLabel();
                });

                row.appendChild(cell);
            });
            grid.appendChild(row);
        }
        updateStatusLabel();
    }

    function syncPanelEnabledState() {
        const toggle = document.getElementById("fruit-bowl-enable");
        if (toggle) toggle.checked = !!window.pudding_settings.PortalPairs;
        const uniqueToggle = document.getElementById("fruit-bowl-always-unique");
        if (uniqueToggle) uniqueToggle.checked = !!window.pudding_settings.AlwaysUniqueFruit;
        const grid = document.getElementById("fruit-bowl-grid");
        if (grid) {
            grid.style.opacity = window.pudding_settings.PortalPairs ? "1" : "0.45";
            grid.style.pointerEvents = window.pudding_settings.PortalPairs ? "auto" : "none";
        }
        syncTabUi();
    }

    function setFruitBowlTab(tab) {
        window._fruitBowlTab = tab === "general" ? "general" : "portal";
        ensurePoolMeetsMinimum();
        syncPanelEnabledState();
        renderFruitGrid();
    }

    // Theme background is applied separately via applyPanelTheme (Theme.js sets real_topbar_color).
    const PANEL_STYLE =
        "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100000;" +
        "padding:18px 20px 16px;display:none;border-radius:8px;" +
        "width:min(560px,92vw);min-width:280px;height:auto;min-height:320px;max-height:min(720px,88vh);" +
        "overflow-x:hidden;overflow-y:auto;visibility:hidden;box-sizing:border-box;" +
        "box-shadow:0 12px 36px rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.18);";

    const BACKDROP_STYLE =
        "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99999;" +
        "background:rgba(0,0,0,0.45);display:none;visibility:hidden;";

    function applyPanelTheme(panel) {
        if (!panel) return;
        const color = window.real_topbar_color || "#4a752c";
        panel.style.background = color;
        panel.style.backgroundColor = color;
    }

    function getPanelHost() {
        return document.body;
    }

    function ensureUi() {
        const host = getPanelHost();
        if (!host) return;

        document.querySelectorAll("#fruit-bowl-settings-icon").forEach((el) => el.remove());

        // If an old tiny in-game panel exists, rebuild it.
        const existing = document.getElementById("fruit-bowl-popup-pudding");
        if (existing && existing.parentElement !== host) {
            existing.remove();
            const oldBd = document.getElementById("fruit-bowl-backdrop-pudding");
            if (oldBd) oldBd.remove();
        }

        const legacy = document.getElementById("portal-pairs-popup-pudding");
        if (legacy) legacy.remove();

        let backdrop = document.getElementById("fruit-bowl-backdrop-pudding");
        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.id = "fruit-bowl-backdrop-pudding";
            backdrop.style.cssText = BACKDROP_STYLE;
            backdrop.addEventListener("click", function () {
                window.PortalPairsPanelHide();
            });
            host.appendChild(backdrop);
        } else if (backdrop.parentElement !== host) {
            host.appendChild(backdrop);
        }

        let panel = document.getElementById("fruit-bowl-popup-pudding");
        if (panel && !document.getElementById("fruit-bowl-tab-portal")) {
            panel.remove();
            panel = null;
        }
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "fruit-bowl-popup-pudding";
            panel.style.cssText = PANEL_STYLE;
            panel.innerHTML = `
                <div style="color:white;font-family:Roboto,Arial,sans-serif;text-align:center;margin-bottom:10px;font-size:22px;font-weight:bold;letter-spacing:0.2px;">Fruit Bowl Settings</div>
                <div style="display:flex;justify-content:center;gap:8px;margin:0 auto 12px;">
                    <button type="button" class="btn" id="fruit-bowl-tab-general">General</button>
                    <button type="button" class="btn" id="fruit-bowl-tab-portal">Portal</button>
                </div>
                <div style="display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;margin:0 auto 12px;width:100%;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <input class="form-check-input" type="checkbox" role="switch" id="fruit-bowl-enable" style="margin:0;float:none;position:static;">
                        <label class="form-check-label" for="fruit-bowl-enable" style="margin:0;color:white;font-family:Roboto,Arial,sans-serif;font-size:16px;line-height:1.2;">Enable custom fruit bowl</label>
                    </div>
                    <div id="fruit-bowl-unique-row" style="display:none;align-items:center;gap:8px;">
                        <input class="form-check-input" type="checkbox" role="switch" id="fruit-bowl-always-unique" style="margin:0;float:none;position:static;">
                        <label class="form-check-label" for="fruit-bowl-always-unique" style="margin:0;color:white;font-family:Roboto,Arial,sans-serif;font-size:16px;line-height:1.2;">Always Unique Fruit</label>
                    </div>
                </div>
                <div id="fruit-bowl-portal-note" style="display:none;color:#dce8c8;font-family:Roboto,Arial,sans-serif;font-size:14px;margin:0 0 10px 0;text-align:center;">Portal fruit bowl is always unique</div>
                <div id="fruit-bowl-status" style="color:#dce8c8;font-family:Roboto,Arial,sans-serif;font-size:15px;margin:0 0 12px 0;text-align:center;"></div>
                <div id="fruit-bowl-grid" style="padding:4px 0 8px;display:flex;flex-direction:column;align-items:center;"></div>
                <button type="button" class="btn" style="margin:8px auto 0;display:block;color:white;background-color:#1155CC;font-family:Roboto,Arial,sans-serif;" id="fruit-bowl-close">Close</button>
            `;
            host.appendChild(panel);
            applyPanelTheme(panel);

            document.getElementById("fruit-bowl-tab-portal").addEventListener("click", function () {
                setFruitBowlTab("portal");
            });
            document.getElementById("fruit-bowl-tab-general").addEventListener("click", function () {
                setFruitBowlTab("general");
            });
            document.getElementById("fruit-bowl-enable").addEventListener("change", function () {
                window.pudding_settings.PortalPairs = !!this.checked;
                ensurePoolMeetsMinimum();
                if (typeof window.saveSettings === "function") window.saveSettings();
                syncPanelEnabledState();
                renderFruitGrid();
            });
            document.getElementById("fruit-bowl-always-unique").addEventListener("change", function () {
                window.pudding_settings.AlwaysUniqueFruit = !!this.checked;
                if (this.checked) {
                    const store = ensureStore("general");
                    for (const c of Object.keys(COUNT_MINIMA)) {
                        const key = countKey(c);
                        store[key] = normalizePool(store[key], countMinima(Number(c)));
                    }
                }
                getPoolForKind("general");
                if (typeof window.saveSettings === "function") window.saveSettings();
                syncPanelEnabledState();
                renderFruitGrid();
            });
            document.getElementById("fruit-bowl-close").addEventListener("click", function () {
                window.PortalPairsPanelHide();
            });
        } else {
            if (panel.parentElement !== host) host.appendChild(panel);
            const shown = !!window.portalPairsPanelVisible;
            panel.style.cssText = PANEL_STYLE + (shown
                ? "display:block;visibility:visible;"
                : "display:none;visibility:hidden;");
            applyPanelTheme(panel);
            backdrop.style.cssText = BACKDROP_STYLE + (shown
                ? "display:block;visibility:visible;"
                : "display:none;visibility:hidden;");
        }

        syncPanelEnabledState();
        renderFruitGrid();
    }

    window.PortalPairsPanelShow = function () {
        ensureUi();
        try { ensurePoolMeetsMinimum(); } catch (e) { /* settings may still be loading */ }
        syncPanelEnabledState();
        renderFruitGrid();
        const panel = document.getElementById("fruit-bowl-popup-pudding");
        const backdrop = document.getElementById("fruit-bowl-backdrop-pudding");
        if (panel) {
            panel.style.display = "block";
            panel.style.visibility = "visible";
            applyPanelTheme(panel);
        }
        if (backdrop) {
            backdrop.style.display = "block";
            backdrop.style.visibility = "visible";
        }
        window.portalPairsPanelVisible = true;
    };

    window.PortalPairsPanelHide = function () {
        const panel = document.getElementById("fruit-bowl-popup-pudding");
        const backdrop = document.getElementById("fruit-bowl-backdrop-pudding");
        if (panel) {
            panel.style.display = "none";
            panel.style.visibility = "hidden";
        }
        if (backdrop) {
            backdrop.style.display = "none";
            backdrop.style.visibility = "hidden";
        }
        window.portalPairsPanelVisible = false;
    };

    window.TogglePortalPairsPanel = function () {
        if (window.portalPairsPanelVisible) window.PortalPairsPanelHide();
        else window.PortalPairsPanelShow();
    };

    window.CustomBowlSyncUi = function () {
        if (!window.portalPairsPanelVisible) return;
        ensurePoolMeetsMinimum();
        syncPanelEnabledState();
        renderFruitGrid();
    };

    setTimeout(function () {
        try { ensurePoolMeetsMinimum(); } catch (e) { /* ignore */ }
        ensureUi();
        window.PortalPairsPanelHide();
    }, 0);
};

window.CustomBowl.alterCode = function (code) {
    const reset_regex = new RegExp(/;this\.reset\(\)\}\}/);
    catchError(reset_regex, code);
    code = code.assertReplace(reset_regex, `window.custom_pair_call_counter=0;$&`);

    code = code.assertReplace(
        /case "apple":/,
        `case "apple":setTimeout(function(){window.CustomBowlSyncUi&&window.CustomBowlSyncUi()},0);`
    );
    code = code.assertReplace(
        /case "count":/,
        `case "count":setTimeout(function(){window.CustomBowlSyncUi&&window.CustomBowlSyncUi()},0);`
    );

    const aaf_regex = /([a-zA-Z0-9_$]{1,8})=function\(a\)\{if\(a\.settings\.([a-zA-Z0-9_$]{1,8})===24\)\{/;
    catchError(aaf_regex, code);
    const aaf_match = code.match(aaf_regex);
    const aaf_name = aaf_match[1];
    const fruit_setting = aaf_match[2];

    const baf_regex = /([a-zA-Z0-9_$]{1,8})=function\(a\)\{if\(([a-zA-Z0-9_$]{1,8})\(a\.settings,2\)\)\{var b=\s*Math\.floor\(48\/a\.([a-zA-Z0-9_$]{1,8})\.length\);/;
    catchError(baf_regex, code);
    const baf_match = code.match(baf_regex);
    const baf_name = baf_match[1];
    const portal_check = baf_match[2];
    const apple_array = baf_match[3];
    window.__portalAppleArrayName = apple_array;
    window.__fruitBowlSettingProp = fruit_setting;

    // Portal init: clear + roll from (pool − showing) pair by pair.
    code = code.assertReplace(
        baf_regex,
        `${baf_name}=function(a){window.__bowlIsMode=${portal_check};` +
        `if(${portal_check}(a.settings,2)&&window.assignCustomPortalPairTypes&&window.assignCustomPortalPairTypes(a))return;` +
        `if(${portal_check}(a.settings,2)){var b=Math.floor(48/a.${apple_array}.length);`
    );

    // Custom bowl pick: portal → portal store + unique; other modes → general store + AlwaysUniqueFruit.
    code = code.assertReplace(
        aaf_regex,
        `${aaf_name}=function(a){` +
        `if(window.pudding_settings&&window.pudding_settings.PortalPairs&&a.settings.${fruit_setting}===24){` +
        `return window.pickCustomPortalType(a,${portal_check}(a.settings,2));}` +
        `if(a.settings.${fruit_setting}===24){`
    );

    // v12: Ni&&(this.wa.ka[vd].type=aaF(this.wa),this.wa.ka[Ok].type=this.wa.ka[vd].type)
    // v13: e&&(a.wa.ka[k].type=Q3E(a.wa),a.wa.ka[d].type=a.wa.ka[k].type)
    const inplace_regex = new RegExp(
        `([a-zA-Z0-9_$]{1,8})&&\\(([a-zA-Z0-9_$]{1,8}\\.)wa\\.ka\\[([a-zA-Z0-9_$]{1,8})\\]\\.type=${aaf_name}\\(\\2wa\\),\\2wa\\.ka\\[([a-zA-Z0-9_$]{1,8})\\]\\.type=\\2wa\\.ka\\[\\3\\]\\.type\\)`
    );
    catchError(inplace_regex, code);
    const inplace_match = code.match(inplace_regex);
    code = code.assertReplace(
        inplace_regex,
        `${inplace_match[1]}&&(${inplace_match[2]}wa.ka[${inplace_match[3]}].type=-1,${inplace_match[2]}wa.ka[${inplace_match[4]}].type=-1,${inplace_match[2]}wa.ka[${inplace_match[3]}].type=${aaf_name}(${inplace_match[2]}wa),${inplace_match[2]}wa.ka[${inplace_match[4]}].type=${inplace_match[2]}wa.ka[${inplace_match[3]}].type)`
    );

    // Non-portal eat/respawn (3a/5a/10a): clear the reused slot first, same as
    // tally's type:-1 new apple, so the eaten type leaves "showing" and can re-roll.
    const eat_retype_regex = new RegExp(
        `:([a-zA-Z0-9_$]{1,8})&&\\(([a-zA-Z0-9_$]{1,8})\\.type=${aaf_name}\\(([a-zA-Z0-9_$]{1,8})\\.wa\\)\\)`
    );
    catchError(eat_retype_regex, code);
    code = code.assertReplace(
        eat_retype_regex,
        `:$1&&($2.type=-1,$2.type=${aaf_name}($3.wa))`
    );

    // Non-portal start-of-game fill: stage every slot as -1, then pick sequentially
    // so typesOnBoard sees earlier apples in the same wave.
    const classic_fill_regex = new RegExp(
        `else for\\(var ([a-zA-Z0-9_$]{1,8}) of this\\.${apple_array}\\)\\1\\.type=${aaf_name}\\(this\\)`
    );
    catchError(classic_fill_regex, code);
    code = code.assertReplace(
        classic_fill_regex,
        `else{for(var $1 of this.${apple_array})$1.type=-1;` +
        `window.ensureCustomBowlDimensionOka&&window.ensureCustomBowlDimensionOka(this);` +
        `for($1 of this.${apple_array})$1.type=${aaf_name}(this)}`
    );

    const refill_regex = new RegExp(
        `if\\(([a-zA-Z0-9_$]{1,8})\\(a\\.settings,2\\)&&b\\.length>0\\)for\\(b\\[0\\]\\.type=${aaf_name}\\(a\\.([a-zA-Z0-9_$]{1,8})\\),b\\[1\\]\\.type=b\\[0\\]\\.type,a=2;a<b\\.length;a\\+=2\\)b\\[a\\]\\.type=\\(b\\[a-2\\]\\.type\\+1\\)%\\n?24,b\\[a\\+1\\]\\.type=b\\[a\\]\\.type`
    );
    catchError(refill_regex, code);
    const refill_match = code.match(refill_regex);
    const mode_check = refill_match[1];
    const apple_mgr_prop = refill_match[2];

    const refill_replacement =
        `if(${mode_check}(a.settings,2)&&b.length>0){` +
        `if(window.pudding_settings&&window.pudding_settings.PortalPairs&&a.settings.${fruit_setting}===24&&window.assignCustomPortalPairTypes){` +
        `window.assignCustomPortalPairTypes(a.${apple_mgr_prop});` +
        `}else for(b[0].type=${aaf_name}(a.${apple_mgr_prop}),b[1].type=b[0].type,a=2;a<b.length;a+=2)b[a].type=(b[a-2].type+1)%24,b[a+1].type=b[a].type;` +
        `window.enforceUniquePortalFruitTypes&&window.enforceUniquePortalFruitTypes(a.${apple_mgr_prop})` +
        `}`;

    code = code.assertReplace(refill_regex, refill_replacement);

    // Enforce after baF without breaking if/else (comma expression).
    code = code.assertReplace(
        new RegExp(`${baf_name}\\(this\\)`),
        `(${baf_name}(this),window.enforceUniquePortalFruitTypes&&window.enforceUniquePortalFruitTypes(this))`
    );
    const bafArgRegex = new RegExp(`${baf_name}\\(a\\.([a-zA-Z0-9_$]{1,8})\\)`);
    catchError(bafArgRegex, code);
    const bafArgProp = code.match(bafArgRegex)[1];
    code = code.assertReplace(
        bafArgRegex,
        `(${baf_name}(a.${bafArgProp}),window.enforceUniquePortalFruitTypes&&window.enforceUniquePortalFruitTypes(a.${bafArgProp}))`
    );

    return code;
};
