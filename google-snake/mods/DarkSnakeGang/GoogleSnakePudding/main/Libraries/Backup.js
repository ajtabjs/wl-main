window.Backup = {};

window.Backup.make = function () {
  const BACKUP_FORMAT = "puddingmod-backup";
  const BACKUP_VERSION = 1;

  const WHITELIST = [
    "snake_timeKeeper",
    "inputCounterMod",
    "PuddingSettings",
    "keybinds",
    "_snake_pb",
    "_snake_timer_format",
    "_snake_show_delta",
    "_snake_null_split",
    "_snake_aheadg",
    "_snake_aheadl",
    "_snake_behindg",
    "_snake_behindl",
    "_snake_pb_bridge_migrated",
    "snakeAdvancedSettings",
  ];

  const SETTINGS_KEYS = new Set([
    "PuddingSettings",
    "keybinds",
    "_snake_timer_format",
    "_snake_show_delta",
    "_snake_null_split",
    "_snake_aheadg",
    "_snake_aheadl",
    "_snake_behindg",
    "_snake_behindl",
    "_snake_pb_bridge_migrated",
    "snakeAdvancedSettings",
  ]);

  function parseMaybeJson(raw) {
    if (raw == null) return undefined;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }

  function readLocalJson(key) {
    const raw = localStorage.getItem(key);
    if (raw == null) return undefined;
    return parseMaybeJson(raw);
  }

  function writeValue(key, value) {
    if (value === undefined) return;
    if (value === null) {
      localStorage.removeItem(key);
      return;
    }
    if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
  }

  function isPbRow(key) {
    return /^(25|50|100|ALL)-/.test(key);
  }

  function isHighscoreKey(key) {
    return key.slice(0, 2) === "H-";
  }

  function isAttemptKey(key) {
    return key.slice(0, 4) === "att-";
  }

  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function mergePbEntry(local, imported) {
    if (!local) return imported;
    if (!imported) return local;
    const localTime = num(local.time, Infinity);
    const importedTime = num(imported.time, Infinity);
    const better = importedTime < localTime ? imported : local;
    return {
      time: better.time,
      date: better.date,
      att: Math.max(num(local.att, 0), num(imported.att, 0)),
      sum: Math.max(num(local.sum, 0), num(imported.sum, 0)),
    };
  }

  function mergeHighscoreEntry(local, imported) {
    if (!local) return imported;
    if (!imported) return local;
    const lHigh = num(local.high, -Infinity);
    const iHigh = num(imported.high, -Infinity);
    if (iHigh > lHigh) return imported;
    if (iHigh < lHigh) return local;
    const lTime = num(local.time, Infinity);
    const iTime = num(imported.time, Infinity);
    return iTime < lTime ? imported : local;
  }

  function attemptTotal(raw) {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (raw && typeof raw === "object" && typeof raw.total === "number") {
      return raw.total;
    }
    return 0;
  }

  function mergeAttemptEntry(local, imported) {
    if (!local && imported == null) return imported;
    // Legacy att-* values are plain numbers (v10/v11); current are objects
    if (typeof local === "number" || typeof imported === "number") {
      return Math.max(attemptTotal(local), attemptTotal(imported));
    }
    if (!local) {
      const rec = Object.assign({}, imported);
      if (typeof rec.session !== "number") rec.session = 0;
      if (typeof rec.total !== "number") rec.total = attemptTotal(imported);
      return rec;
    }
    if (!imported) return local;
    return {
      total: Math.max(attemptTotal(local), attemptTotal(imported)),
      session: typeof local.session === "number" ? local.session : 0,
      lastAttempt:
        local.lastAttempt != null ? local.lastAttempt : imported.lastAttempt,
      lastSession: Math.max(
        num(local.lastSession, 0),
        num(imported.lastSession, 0)
      ),
    };
  }

  function mergeTimeKeeper(local, imported) {
    const out =
      local && typeof local === "object" ? Object.assign({}, local) : {};
    const src =
      imported && typeof imported === "object" ? imported : {};
    for (const key of Object.keys(src)) {
      if (key === "version") continue;
      const a = out[key];
      const b = src[key];
      if (isPbKey(key)) {
        out[key] = mergePbEntry(a, b);
      } else if (isHighscoreKey(key)) {
        out[key] = mergeHighscoreEntry(a, b);
      } else if (isAttemptKey(key)) {
        out[key] = mergeAttemptEntry(a, b);
      } else if (a === undefined) {
        out[key] = b;
      }
    }
    out.version = 4;
    return out;
  }

  function mergeCounter(local, imported) {
    const base =
      local && typeof local === "object"
        ? JSON.parse(JSON.stringify(local))
        : {
            visible: true,
            statShown: "inputs",
            statDurationShown: "game",
            inputs: { game: 0, session: 0, lifetime: 0 },
            plays: { session: 0, lifetime: 0 },
            apples: { session: 0, lifetime: 0 },
          };
    const src = imported && typeof imported === "object" ? imported : {};

    function ensureBucket(obj, name, fields) {
      if (!obj[name] || typeof obj[name] !== "object") obj[name] = {};
      for (const f of fields) {
        if (typeof obj[name][f] !== "number") obj[name][f] = 0;
      }
    }

    ensureBucket(base, "inputs", ["game", "session", "lifetime"]);
    ensureBucket(base, "plays", ["session", "lifetime"]);
    ensureBucket(base, "apples", ["session", "lifetime"]);
    ensureBucket(base, "goldenFruit", [
      "apple",
      "cherry",
      "strawberry",
      "carrot",
      "watermelon",
    ]);

    if (src.inputs && typeof src.inputs === "object") {
      base.inputs.lifetime = Math.max(
        num(base.inputs.lifetime, 0),
        num(src.inputs.lifetime, 0)
      );
    }
    if (src.plays && typeof src.plays === "object") {
      base.plays.lifetime = Math.max(
        num(base.plays.lifetime, 0),
        num(src.plays.lifetime, 0)
      );
    }
    if (src.apples && typeof src.apples === "object") {
      base.apples.lifetime = Math.max(
        num(base.apples.lifetime, 0),
        num(src.apples.lifetime, 0)
      );
    }
    if (src.goldenFruit && typeof src.goldenFruit === "object") {
      for (const k of [
        "apple",
        "cherry",
        "strawberry",
        "carrot",
        "watermelon",
      ]) {
        base.goldenFruit[k] = Math.max(
          num(base.goldenFruit[k], 0),
          num(src.goldenFruit[k], 0)
        );
      }
    }

    if (typeof src.statShown === "string") base.statShown = src.statShown;
    if (typeof src.statDurationShown === "string") {
      base.statDurationShown = src.statDurationShown;
    }
    if (typeof src.visible === "boolean") base.visible = src.visible;

    return base;
  }

  function mergeSnakePb(local, imported) {
    if (imported == null) return local;
    if (local == null) return imported;
    if (typeof imported === "number" && typeof local === "number") {
      return imported < local ? imported : local;
    }
    if (typeof imported !== "object" || typeof local !== "object") {
      return imported;
    }
    const out = Array.isArray(local) ? local.slice() : Object.assign({}, local);
    for (const key of Object.keys(imported)) {
      out[key] = mergeSnakePb(out[key], imported[key]);
    }
    return out;
  }

  function collectExportData() {
    if (typeof window.flushSnakePb === "function") {
      window.flushSnakePb();
    }
    if (typeof window.timeKeeper !== "undefined" &&
        typeof window.timeKeeper.flushStorage === "function") {
      window.timeKeeper.flushStorage();
    }
    if (typeof window.saveSettings === "function") {
      window.saveSettings();
    }
    if (typeof window.saveStatistics === "function") {
      window.saveStatistics();
    }

    const data = {};
    for (const key of WHITELIST) {
      const value = readLocalJson(key);
      if (value !== undefined) data[key] = value;
    }
    return data;
  }

  function applyReplace(data) {
    for (const key of WHITELIST) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      writeValue(key, data[key]);
    }
  }

  function applyMerge(data) {
    for (const key of WHITELIST) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      const imported = data[key];

      if (key === "snake_timeKeeper") {
        writeValue(key, mergeTimeKeeper(readLocalJson(key), imported));
        continue;
      }
      if (key === "inputCounterMod") {
        writeValue(key, mergeCounter(readLocalJson(key), imported));
        continue;
      }
      if (key === "_snake_pb") {
        writeValue(key, mergeSnakePb(readLocalJson(key), imported));
        continue;
      }
      if (SETTINGS_KEYS.has(key)) {
        writeValue(key, imported);
      }
    }
  }

  window.exportPuddingBackup = function () {
    const payload = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: collectExportData(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const day = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "puddingmod-backup-" + day + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  window.importPuddingBackup = function (file, mode) {
    if (!file) return;
    if (mode !== "merge" && mode !== "replace") {
      alert("Invalid import mode");
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        alert("Invalid backup file (not JSON)");
        return;
      }
      if (
        !parsed ||
        parsed.format !== BACKUP_FORMAT ||
        !parsed.data ||
        typeof parsed.data !== "object"
      ) {
        alert("Invalid backup file (wrong format)");
        return;
      }

      const confirmMsg =
        mode === "merge"
          ? "Merge this backup into your Pudding Mod data? Better PBs and higher lifetime counts are kept; settings from the file are applied. The page will reload."
          : "Replace Pudding Mod data with this backup for all keys in the file? Existing values for those keys will be overwritten. The page will reload.";

      if (!confirm(confirmMsg)) return;

      try {
        if (mode === "merge") applyMerge(parsed.data);
        else applyReplace(parsed.data);
      } catch (e) {
        console.error(e);
        alert("Import failed");
        return;
      }
      location.reload();
    };
    reader.onerror = function () {
      alert("Could not read backup file");
    };
    reader.readAsText(file);
  };

  window.wirePuddingBackupButtons = function (opts) {
    if (!opts) return;
    const exportBtn = opts.exportBtn;
    const mergeBtn = opts.mergeBtn;
    const replaceBtn = opts.replaceBtn;
    const fileInput = opts.fileInput;
    if (!fileInput) return;

    let pendingMode = "merge";

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        window.exportPuddingBackup();
      });
    }

    function openPicker(mode) {
      pendingMode = mode;
      fileInput.value = "";
      fileInput.click();
    }

    if (mergeBtn) {
      mergeBtn.addEventListener("click", function () {
        openPicker("merge");
      });
    }
    if (replaceBtn) {
      replaceBtn.addEventListener("click", function () {
        openPicker("replace");
      });
    }

    fileInput.addEventListener("change", function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      window.importPuddingBackup(file, pendingMode);
    });
  };
};

window.Backup.alterCode = function (code) {
  return code;
};
