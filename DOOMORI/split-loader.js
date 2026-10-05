"use strict";

// // Build/WEBGL Doomori Build.data.gz is 89,846,132 bytes, stored as 5 part(s).
//
// These builds use UnityLoader.instantiate's replacement, createUnityInstance(canvas, config, onProgress),
// and index.html passes the config as an inline object literal rather than as a JSON
// file. Two things follow from that and both make this loader simpler than the ones
// used for the older games: there is no build config to fetch, so there is no
// "undefined" == typeof o[k] merge to get dataUrl past, and there is no
// resolveBuildUrl() prefixing relative paths, so a blob: URL is handed to fetch()
// exactly as it is.

var ENTRIES = [
  {
    "key": "dataUrl",
    "path": "Build/WEBGL Doomori Build.data.gz",
    "parts": 5,
    "size": 89846132,
    "prefix": "UnityWebData1.0\u0000",
    "mime": null
  }
];

async function mergeFiles(fileParts, cacheKey, mimeType) {
  let cache = null;
  try {
    cache = await caches.open(DOOMORI);
  } catch (err) {
    cache = null;
  }
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return URL.createObjectURL(await cached.blob());
  }
  const buffers = await Promise.all(
    fileParts.map(function (part) {
      return fetch(part).then(function (r) {
        if (!r.ok) throw new Error("Failed to fetch " + part + " (HTTP " + r.status + ")");
        return r.arrayBuffer();
      });
    })
  );
  // The MIME type matters for the wasm: createUnityInstance tries
  // WebAssembly.instantiateStreaming() first, which rejects a response whose
  // Content-Type is not application/wasm. A Blob built without a type serves as "",
  // so the streaming path would always fail and fall back to instantiate() every
  // visit. The data archive is fetched as an ArrayBuffer and does not care.
  const merged = new Blob(buffers, mimeType ? { type: mimeType } : undefined);
  if (cache) {
    try {
      await cache.put(cacheKey, new Response(merged));
    } catch (err) {
      console.warn("Cache write failed for " + cacheKey, err);
    }
  }
  return URL.createObjectURL(merged);
}

function getParts(file, start, end) {
  const parts = [];
  for (let i = start; i <= end; i++) parts.push(file + ".part" + i);
  return parts;
}

// Format-agnostic: compares the length and the leading bytes recorded at split
// time. Catches a short or mis-ordered merge, and the papery-planes failure mode
// where a CDN error page arrives with a 200 status.
async function checkArchive(url, entry) {
  const head = await fetch(url, { headers: { Range: "bytes=0-15" } });
  if (!head.ok && head.status !== 206) throw new Error("HTTP " + head.status);
  const prefix = String.fromCharCode.apply(null, new Uint8Array(await head.arrayBuffer()));
  if (prefix !== entry.prefix) {
    throw new Error(entry.key + " starts " + JSON.stringify(prefix) +
      " instead of " + JSON.stringify(entry.prefix));
  }
  const res = await fetch(url, { headers: { Range: "bytes=0-0" } });
  const total = (res.headers.get("Content-Range") || "").split("/")[1];
  if (total && Number(total) !== entry.size) {
    throw new Error(entry.key + " is " + total + " bytes, expected " + entry.size);
  }
  return url;
}

(function () {
  const original = window.createUnityInstance;
  window.createUnityInstance = function (canvas, config, onProgress) {
    const patched = Object.assign({}, config);
    let chain = Promise.resolve();
    chain = chain.then(function () {
      return mergeFiles(getParts(ENTRIES[0].path, 0, ENTRIES[0].parts - 1), "DOOMORI/Build/WEBGL Doomori Build.data.gz", null).then(function (url) {
        return checkArchive(url, ENTRIES[0]).then(function () {
          patched.dataUrl = url;
        });
      });
    });
    return chain
      .then(function () {
        return original(canvas, patched, onProgress);
      })
      .catch(function (err) {
        console.error("DOOMORI: could not load the split game data:", err);
        if (canvas) {
          canvas.textContent = "DOOMORI can't load its game data: " + err.message;
        }
      });
  };
})();
