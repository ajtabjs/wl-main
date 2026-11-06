window.SplitPanel = {};

window.SplitPanel.make = function () {

    const CAT_MAX = { 0: 25, 1: 50, 2: 100, 3: Infinity };
    const CAT_STANDARDS = {
        0: [25],
        1: [25, 50],
        2: [25, 50, 100],
        3: [25, 50, 100, "ALL"],
    };

    window.splitPanelVisible = false;
    window._splitPanelRows = {};

    function selectedIndex(sel) {
        const el = document.querySelector(sel);
        if (!el || !el.children) return 0;
        const kids = Array.from(el.children);
        let idx = kids.findIndex(function (q) {
            return q.className && String(q.className).includes("tuJOWd");
        });
        if (idx >= 0) return idx;
        if (typeof getSelected === "function") {
            try { return getSelected(sel); } catch (e) {}
        }
        return 0;
    }

    function nestGet(root, path) {
        let cur = root;
        for (let i = 0; i < path.length; i++) {
            if (cur == null) return undefined;
            const p = path[i];
            if (cur[p] != null) cur = cur[p];
            else if (cur[String(p)] != null) cur = cur[String(p)];
            else return undefined;
        }
        return cur;
    }

    function currentBucket() {
        let _mode;
        let _count;
        let _speed;
        let _size;
        if (
            typeof window.getRunSelectors === "function" &&
            window.timeKeeper &&
            (window.timeKeeper.runStarted || window.timeKeeper.playing)
        ) {
            const sel = window.getRunSelectors();
            _mode = sel.mode;
            _count = sel.count;
            _speed = sel.speed;
            _size = sel.size;
        } else {
            _mode = selectedIndex("#trophy");
            _count = selectedIndex("#count");
            _speed = selectedIndex("#speed");
            _size = selectedIndex("#size");
        }
        const _cat = window._cat != null ? window._cat : 3;
        const path = [_mode, _count, _speed, _size, _cat];
        return {
            pb: nestGet(window._pb, path) || {},
            run: nestGet(window._run, path) || {},
            cat: _cat,
        };
    }

    function splitSortKey(key) {
        if (key === "ALL" || key === "all") return 1e9;
        return Number(key) || 0;
    }

    function splitLabel(key) {
        if (key === "ALL" || key === "all") return "ALL";
        return String(key);
    }

    function listSplitKeys() {
        const { cat } = currentBucket();
        const max = CAT_MAX[cat] != null ? CAT_MAX[cat] : Infinity;
        const standards = CAT_STANDARDS[cat] || CAT_STANDARDS[3];
        const keys = new Set();
        const splits = Array.isArray(window._splits) ? window._splits : [];
        for (const s of splits) {
            const n = +s;
            if (!n) continue;
            if (n <= max) keys.add(n);
        }
        const { pb } = currentBucket();
        for (const k of Object.keys(pb || {})) {
            if (k === "ALL" || k === "all") continue;
            const n = +k;
            if (!n) continue;
            if (n <= max) keys.add(n);
        }
        for (const s of standards) keys.add(s);
        return Array.from(keys).sort((a, b) => splitSortKey(a) - splitSortKey(b));
    }

    function lookup(obj, key) {
        if (!obj) return undefined;
        if (obj[key] != null && obj[key] !== "") return obj[key];
        if (obj[String(key)] != null && obj[String(key)] !== "") return obj[String(key)];
        return undefined;
    }

    function formatTime(t) {
        const n = +t;
        if (!isFinite(n) || n <= 0) return "";
        if (typeof n.timeFormat === "function") return n.timeFormat();
        return String(n);
    }

    function formatDelta(delta) {
        if (delta == null || !isFinite(delta) || delta === 0) {
            return { text: "—", color: "white" };
        }
        if (!window._splitDeltaColors) {
            window._splitDeltaColors = {
                aheadg: localStorage._snake_aheadg || "#008010",
                aheadl: localStorage._snake_aheadl || "#53dd87",
                behindg: localStorage._snake_behindg || "#dd3333",
                behindl: localStorage._snake_behindl || "#a00000",
            };
        }
        const colors = window._splitDeltaColors;
        const abs = typeof Math.abs(delta).timeFormat === "function"
            ? Math.abs(delta).timeFormat()
            : String(Math.abs(delta));
        const last = window._lastDelta || 0;
        const color = delta > 0
            ? (delta > last ? colors.behindl : colors.behindg)
            : (delta > last ? colors.aheadl : colors.aheadg);
        return { text: (delta < 0 ? "-" : "+") + abs, color: color };
    }

    // Refresh cached colors when Timer settings change them
    window.refreshSplitDeltaColors = function () {
        window._splitDeltaColors = {
            aheadg: localStorage._snake_aheadg || "#008010",
            aheadl: localStorage._snake_aheadl || "#53dd87",
            behindg: localStorage._snake_behindg || "#dd3333",
            behindl: localStorage._snake_behindl || "#a00000",
        };
    };

    function rowStyle(active) {
        return "display:flex;align-items:center;justify-content:space-between;gap:4px;padding:3px 4px;margin:0;border-radius:3px;font-family:Roboto,Arial,sans-serif;font-size:12px;line-height:1.25;color:white;"
            + (active ? "background:rgba(255,255,255,0.14);" : "");
    }

    window.SplitPanelShow = function () {
        const box = document.getElementById("split-panel-pudding");
        if (!box) return;
        box.style.display = "flex";
        box.style.visibility = "visible";
        window.splitPanelVisible = true;
        if (window.pudding_settings) window.pudding_settings.SplitPanel = true;
        window.SplitPanelRefresh();
    };

    window.SplitPanelHide = function () {
        const box = document.getElementById("split-panel-pudding");
        if (!box) return;
        box.style.visibility = "hidden";
        window.splitPanelVisible = false;
        if (window.pudding_settings) window.pudding_settings.SplitPanel = false;
        const cb = document.getElementById("ShowSplitPanel");
        if (cb) cb.checked = false;
    };

    window.ToggleSplitPanel = function () {
        if (window.pudding_settings) {
            window.pudding_settings.SplitPanel = !window.pudding_settings.SplitPanel;
        }
        if (window.pudding_settings && window.pudding_settings.SplitPanel) {
            window.SplitPanelShow();
        } else {
            window.SplitPanelHide();
        }
        if (typeof window.saveSettings === "function") window.saveSettings();
    };

    window.SplitPanelRefresh = function () {
        const list = document.getElementById("split-panel-list");
        if (!list) return;
        const keys = listSplitKeys();
        const { pb, run } = currentBucket();
        window._splitPanelRows = {};
        list.innerHTML = "";

        let nextKey = null;
        for (const key of keys) {
            if (lookup(run, key) == null) {
                nextKey = key;
                break;
            }
        }

        for (const key of keys) {
            const row = document.createElement("div");
            const isNext = key === nextKey;
            row.style.cssText = rowStyle(isNext);
            row.dataset.splitKey = String(key);

            const nameEl = document.createElement("span");
            nameEl.style.cssText = "flex:0 0 42px;font-weight:" + (isNext ? "700" : "500") + ";";
            nameEl.textContent = splitLabel(key);

            const timeEl = document.createElement("span");
            timeEl.style.cssText = "flex:1;text-align:right;font-variant-numeric:tabular-nums;";
            const runVal = lookup(run, key);
            const pbVal = lookup(pb, key);
            if (runVal != null) {
                timeEl.textContent = formatTime(runVal);
            } else if (pbVal) {
                timeEl.textContent = formatTime(pbVal);
                timeEl.style.color = "rgba(255,255,255,0.55)";
            } else {
                timeEl.textContent = "";
            }

            const deltaEl = document.createElement("span");
            deltaEl.style.cssText = "flex:0 0 72px;text-align:right;font-variant-numeric:tabular-nums;";
            if (runVal != null && pbVal) {
                const d = +runVal - +pbVal;
                const fmt = formatDelta(d);
                deltaEl.textContent = fmt.text;
                deltaEl.style.color = fmt.color;
                if (d < 0) timeEl.style.color = fmt.color;
                else timeEl.style.color = "white";
            } else {
                deltaEl.textContent = "—";
                deltaEl.style.color = "rgba(255,255,255,0.55)";
            }

            row.appendChild(nameEl);
            row.appendChild(timeEl);
            row.appendChild(deltaEl);
            list.appendChild(row);
            window._splitPanelRows[String(key)] = { row: row, nameEl: nameEl, timeEl: timeEl, deltaEl: deltaEl };
        }
    };

    window.SplitPanelOnReset = function () {
        window.SplitPanelRefresh();
    };

    window.SplitPanelOnSplit = function (score, splitTime, delta) {
        const box = document.getElementById("split-panel-pudding");
        if (!box || box.style.visibility === "hidden" || !window.splitPanelVisible) return;

        const key = score === "ALL" || score === "all" ? "ALL" : score;
        const rec = window._splitPanelRows && window._splitPanelRows[String(key)];
        if (!rec) {
            window.SplitPanelRefresh();
            return;
        }
        rec.timeEl.textContent = formatTime(splitTime);
        rec.timeEl.style.color = "white";
        let d = delta;
        if (d == null || !isFinite(d)) {
            const pbVal = lookup(currentBucket().pb, key);
            if (pbVal) d = +splitTime - +pbVal;
        }
        if (d != null && isFinite(d) && d !== 0) {
            const fmt = formatDelta(d);
            rec.deltaEl.textContent = fmt.text;
            rec.deltaEl.style.color = fmt.color;
            rec.timeEl.style.color = d < 0 ? fmt.color : "white";
        } else {
            rec.deltaEl.textContent = "—";
            rec.deltaEl.style.color = "white";
        }
        rec.row.style.cssText = rowStyle(false);
        rec.nameEl.style.fontWeight = "500";

        const keys = listSplitKeys();
        let found = false;
        for (const k of keys) {
            if (String(k) === String(key)) {
                found = true;
                continue;
            }
            if (found) {
                const next = window._splitPanelRows[String(k)];
                if (next) {
                    next.row.style.cssText = rowStyle(true);
                    next.nameEl.style.fontWeight = "700";
                }
                break;
            }
        }
    };

    window.SplitPanelSetup = function () {
        const host = document.getElementsByClassName("sEOCsb")[0];
        if (!host) return;

        const box = document.createElement("div");
        box.id = "split-panel-pudding";
        box.style.cssText = window.puddingSidebarStyleLeft || window.puddingSidebarStyle;
        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.boxSizing = "border-box";
        box.style.visibility = "hidden";

        const title = document.createElement("div");
        title.style.cssText = "font-weight:bold;color:white;font-family:Roboto,Arial,sans-serif;text-align:center;margin:0 0 6px;padding:0 0 6px;border-bottom:1px solid rgba(255,255,255,0.22);";
        title.textContent = "Splits";

        const header = document.createElement("div");
        header.style.cssText = "display:flex;justify-content:space-between;gap:4px;padding:0 4px 4px;font-family:Roboto,Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.7);";
        header.innerHTML = '<span style="flex:0 0 42px;">Split</span><span style="flex:1;text-align:right;">Time</span><span style="flex:0 0 72px;text-align:right;">+/-</span>';

        const list = document.createElement("div");
        list.id = "split-panel-list";
        list.style.cssText = "flex:1;min-height:0;overflow:auto;";

        box.appendChild(title);
        box.appendChild(header);
        box.appendChild(list);
        host.appendChild(box);

        window.SplitPanelRefresh();

        ["trophy", "count", "speed", "size"].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("click", function () {
                    setTimeout(window.SplitPanelRefresh, 0);
                });
            }
        });

        if (window.pudding_settings && window.pudding_settings.SplitPanel && !window.isSnakeMobileVersion) {
            window.SplitPanelShow();
        }
    };

    window.SplitPanelSetup();
};

window.SplitPanel.alterCode = function (code) {
    return code;
};
