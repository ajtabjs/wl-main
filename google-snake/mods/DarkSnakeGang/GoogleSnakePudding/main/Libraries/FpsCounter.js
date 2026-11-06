// Frames-per-second label in the board's top-right corner, styled and placed like
// the "Pudding Mod vNN" indicator (PuddingInit runCodeAfter) mirrored to the right.
// Runs its own requestAnimationFrame loop only while enabled (the game renders on
// rAF too, so this matches the game's frame rate). No snake.js changes.

window.FpsCounter = {};

window.FpsCounter.make = function () {
    const SAMPLE_MS = 500;
    let el = null;
    let rafId = 0;
    let frames = 0;
    let windowStart = 0;

    // Same host/sibling as the mod indicator; null until the board DOM exists.
    function ensureEl() {
        if (el && el.isConnected) return el;
        const host = document.getElementsByClassName("EjCLSb")[0];
        if (!host) return null;
        if (!el) {
            el = document.createElement("div");
            el.id = "pudding-fps-counter";
            el.style =
                "position:absolute;right:0;font-family:Roboto,Arial,sans-serif;color:white;font-size:14px;" +
                "padding-top:4px;padding-right:30px;user-select:none;pointer-events:none;" +
                "font-variant-numeric:tabular-nums;display:none;";
            el.textContent = "-- FPS";
        }
        host.insertBefore(el, document.getElementsByClassName("jNB0Ic")[0] || null);
        return el;
    }

    function loop(t) {
        frames++;
        if (!windowStart) windowStart = t;
        const elapsed = t - windowStart;
        if (elapsed >= SAMPLE_MS) {
            if (ensureEl()) {
                el.style.display = "block";
                el.textContent = Math.round((frames * 1000) / elapsed) + " FPS";
            }
            frames = 0;
            windowStart = t;
        }
        rafId = requestAnimationFrame(loop);
    }

    // rAF pauses while hidden; drop the stale window so the first sample after
    // returning is not averaged over the hidden time.
    document.addEventListener("visibilitychange", function () {
        frames = 0;
        windowStart = 0;
    });

    window.FpsCounterSetEnabled = function (on) {
        if (on) {
            if (rafId) return;
            frames = 0;
            windowStart = 0;
            if (ensureEl()) {
                el.textContent = "-- FPS";
                el.style.display = "block";
            }
            rafId = requestAnimationFrame(loop);
        } else {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = 0;
            if (el) el.style.display = "none";
        }
    };

    // Wires a settings switch (Pudding settings panel / Speedrun Mod controls).
    window.FpsCounterBindCheckbox = function (checkbox) {
        if (!checkbox) return;
        checkbox.checked = !!window.pudding_settings.FpsCounter;
        checkbox.addEventListener("change", function () {
            window.pudding_settings.FpsCounter = !!checkbox.checked;
            window.FpsCounterSetEnabled(window.pudding_settings.FpsCounter);
            if (typeof window.saveSettings === "function") window.saveSettings();
        });
    };

    window.FpsCounterSetEnabled(!!(window.pudding_settings && window.pudding_settings.FpsCounter));
};

window.FpsCounter.alterCode = function (code) {
    return code;
};
