window.ModeRegistry = {};

// Known middle modes (between Classic and Peaceful). Peaceful/Classic/Blender are positional.
window.ModeRegistry.MIDDLE = [
    { id: "wall", label: "Wall", trophySrcHints: ["trophy_01"], bitIndexV3: 0 },
    { id: "portal", label: "Portal", trophySrcHints: ["trophy_02"], bitIndexV3: 1 },
    { id: "cheese", label: "Cheese", trophySrcHints: ["trophy_03"], bitIndexV3: 2 },
    { id: "borderless", label: "Borderless", trophySrcHints: ["trophy_04"], bitIndexV3: 3 },
    { id: "twin", label: "Twin", trophySrcHints: ["trophy_05"], bitIndexV3: 4 },
    { id: "winged", label: "Winged", trophySrcHints: ["trophy_06"], bitIndexV3: 5 },
    { id: "yin_yang", label: "Yin Yang", trophySrcHints: ["trophy_07"], bitIndexV3: 6 },
    { id: "key", label: "Key", trophySrcHints: ["trophy_08"], bitIndexV3: 7 },
    { id: "sokoban", label: "Sokoban", trophySrcHints: ["trophy_09"], bitIndexV3: 8 },
    { id: "poison", label: "Poison", trophySrcHints: ["trophy_10"], bitIndexV3: 9 },
    { id: "dimension", label: "Dimension", trophySrcHints: ["trophy_11"], bitIndexV3: 10 },
    { id: "minesweeper", label: "Minesweeper", trophySrcHints: ["trophy_12"], bitIndexV3: 11 },
    { id: "statue", label: "Statue", trophySrcHints: ["trophy_13"], bitIndexV3: 12 },
    { id: "light", label: "Light", trophySrcHints: ["trophy_14"], bitIndexV3: 13 },
    { id: "shield", label: "Shield", trophySrcHints: ["/v16/trophy_15"], bitIndexV3: 14 },
    { id: "arrow", label: "Arrow", trophySrcHints: ["/v17/trophy_15"], bitIndexV3: 15 },
    { id: "hotdog", label: "Hotdog", trophySrcHints: ["trophy_16"], bitIndexV3: 16 },
    { id: "magnet", label: "Magnet", trophySrcHints: ["trophy_17"], bitIndexV3: 17 },
    { id: "gate", label: "Gate", trophySrcHints: ["trophy_18"], bitIndexV3: 18 },
    { id: "bridge", label: "Bridge", trophySrcHints: ["trophy_19"], bitIndexV3: 19 },
];

window.ModeRegistry.LABELS = (function () {
    const map = { classic: "Classic", peaceful: "Peaceful", blender: "Blender" };
    for (const m of window.ModeRegistry.MIDDLE) map[m.id] = m.label;
    return map;
})();

window.ModeRegistry._byBitV3 = (function () {
    const map = Object.create(null);
    for (const m of window.ModeRegistry.MIDDLE) map[m.bitIndexV3] = m.id;
    map[20] = "peaceful"; // v3 bitstring: Peaceful was last bit before Blender
    return map;
})();

window.ModeRegistry._matchMiddleId = function (src) {
    if (!src) return null;
    const s = String(src);
    for (const m of window.ModeRegistry.MIDDLE) {
        for (const hint of m.trophySrcHints) {
            if (s.includes(hint)) return m.id;
        }
    }
    return null;
};

window.ModeRegistry._provisionalId = function (src, index) {
    if (src) {
        const m = String(src).match(/trophy_(\d+)/i);
        if (m) return "trophy_" + m[1];
    }
    return "unknown_" + index;
};

window.ModeRegistry._trophySrc = function (child) {
    const img = child && (child.querySelector && child.querySelector("img"));
    return img ? img.src : "";
};

window.ModeRegistry.listActiveModes = function () {
    const root = document.getElementById("trophy");
    if (!root || !root.children || root.children.length === 0) {
        return [{ id: "classic", label: "Classic", index: 0 }];
    }
    const children = [...root.children];
    const last = children.length - 1;
    const used = new Set();
    const list = [];

    for (let i = 0; i < children.length; i++) {
        let id;
        if (i === 0) {
            id = "classic";
        } else if (i === last) {
            id = "blender";
        } else if (i === last - 1) {
            id = "peaceful";
        } else {
            const src = window.ModeRegistry._trophySrc(children[i]);
            id = window.ModeRegistry._matchMiddleId(src);
            // Fallback: expected slot among middle modes when layout matches catalog length
            if (!id) {
                const middleSlot = i - 1; // index into MIDDLE
                if (middleSlot >= 0 && middleSlot < window.ModeRegistry.MIDDLE.length) {
                    id = window.ModeRegistry.MIDDLE[middleSlot].id;
                } else {
                    id = window.ModeRegistry._provisionalId(src, i);
                }
            }
            if (used.has(id)) id = window.ModeRegistry._provisionalId(src, i);
        }
        used.add(id);
        list.push({
            id,
            label: window.ModeRegistry.LABELS[id] || id,
            index: i,
        });
    }
    return list;
};

window.ModeRegistry.has = function (id) {
    return window.ModeRegistry.listActiveModes().some((m) => m.id === id);
};

window.ModeRegistry.labelModeKey = function (key) {
    if (!key) return "Classic";
    if (key === "classic") return "Classic";
    if (key.indexOf("+") === -1) {
        return window.ModeRegistry.LABELS[key] || key;
    }
    return key.split("+").map((id) => window.ModeRegistry.LABELS[id] || id).join(", ");
};

window.ModeRegistry.bitstringV3ToModeKey = function (bits) {
    if (!bits || typeof bits !== "string") return "classic";
    if (!/^[01]+$/.test(bits)) return "classic";
    const ids = [];
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] === "1") {
            ids.push(window.ModeRegistry._byBitV3[i] || ("unknown_bit_" + i));
        }
    }
    if (ids.length === 0) return "classic";
    if (ids.length === 1) return ids[0];
    return ids.slice().sort().join("+");
};

// Reverse of bitstringV3ToModeKey — 21-char string for v11 / Bridge-era scrapers
window.ModeRegistry.modeKeyToBitstringV3 = function (modeKey) {
    const bits = new Array(21).fill("0");
    if (!modeKey || modeKey === "classic") return bits.join("");
    const ids = String(modeKey).split("+");
    const idToBit = Object.create(null);
    for (const bit of Object.keys(window.ModeRegistry._byBitV3)) {
        idToBit[window.ModeRegistry._byBitV3[bit]] = Number(bit);
    }
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (id === "classic" || id === "blender") continue;
        const bit = idToBit[id];
        if (typeof bit === "number" && bit >= 0 && bit < 21) bits[bit] = "1";
    }
    return bits.join("");
};

// Drop Bridge bit (index 19) so Peaceful stays last — 20-char string for v10
window.ModeRegistry.bitstringV3ToV2 = function (bits21) {
    if (!bits21 || typeof bits21 !== "string") return "00000000000000000000";
    if (bits21.length < 21) {
        // Already short / v2-shaped: pad or trim to 20
        const s = (bits21 + "00000000000000000000").slice(0, 20);
        return s;
    }
    return bits21.slice(0, 19) + bits21.slice(20);
};

window.ModeRegistry.isBitstringModePart = function (modePart) {
    return typeof modePart === "string" && /^[01]{20,21}$/.test(modePart);
};

window.ModeRegistry._blenderSelectedIds = function (modes) {
    // Blender UI: find random.png row and read which mode toggles are selected
    let element = null;
    for (const i of document.querySelectorAll("img")) {
        if (i.src && i.src.includes("random.png")) {
            element = i;
            break;
        }
    }
    if (!element) return [];
    try {
        const row = element.parentElement.parentElement.parentElement;
        const ids = [];
        let counter = -1;
        for (const child of row.children) {
            counter++;
            if (counter === 0) continue;
            const selected =
                child.firstElementChild &&
                child.firstElementChild.classList.length > 1 &&
                child.firstElementChild.children.length > 0;
            if (!selected) continue;
            // Map blender toggle order to modes excluding classic/blender: indices 1..n-2 of trophy list
            const modeIndex = counter; // 1-based into middle+peaceful relative to old scrape
            // Prefer matching by mode list: blender toggles align with trophies 1..last-1
            const trophyModes = modes.filter((m) => m.id !== "classic" && m.id !== "blender");
            const entry = trophyModes[counter - 1];
            if (entry) ids.push(entry.id);
        }
        return ids;
    } catch (e) {
        return [];
    }
};

window.ModeRegistry.getCurrentModeKey = function () {
    const modes = window.ModeRegistry.listActiveModes();
    if (!modes.length) return "classic";

    let selectedIndex = 0;
    if (window.timeKeeper && typeof window.timeKeeper.getCurrentSetting === "function") {
        selectedIndex = window.timeKeeper.getCurrentSetting("trophy");
    } else {
        // Fallback: odd-class-out on #trophy
        const root = document.getElementById("trophy");
        if (root) {
            const classNames = [];
            let notUnique = "";
            for (const el of root.children) {
                if (classNames.indexOf(el.className) === -1) classNames.push(el.className);
                else {
                    notUnique = el.className;
                    break;
                }
            }
            let n = 0;
            for (const el of root.children) {
                if (el.className !== notUnique) {
                    selectedIndex = n;
                    break;
                }
                n++;
            }
        }
    }

    if (selectedIndex < 0 || selectedIndex >= modes.length) selectedIndex = 0;
    const selected = modes[selectedIndex];

    if (selected.id === "classic") return "classic";
    if (selected.id !== "blender") return selected.id;

    const combo = window.ModeRegistry._blenderSelectedIds(modes);
    if (!combo.length) return "blender";
    return combo.slice().sort().join("+");
};

window.ModeRegistry.make = function () {
    window.isBridge = window.ModeRegistry.has("bridge");
};

window.ModeRegistry.alterCode = function (code) {
    return code;
};
