"use strict";

// // Build/WebGL.data.gz is 21,040,352 bytes, stored as 2 part(s).
// Build/WebGL.wasm.gz is 22,419,922 bytes, stored as 2 part(s).
//
// These builds use UnityLoader.instantiate's replacement, createUnityInstance(canvas, config, onProgress),
// and index.html passes the config as an inline object literal rather than as a JSON
// file. Two things follow from that and both make this loader simpler than the ones
// used for the older games: there is no build config to fetch, so there is no
// "undefined" == typeof o[k] merge to get dataUrl past, and there is no
// resolveBuildUrl() prefixing relative paths, so a blob: URL is handed to fetch()
// exactly as it is.
//
// codeUrl is split as well. It is a real WebAssembly module despite the
// .gz suffix - the file starts 00 61 73 6d, not 1f 8b - and nothing in the
// 2020 loader inflates anything, so .gz here is only part of the build name.

var ENTRIES = [
  {
    "key": "dataUrl",
    "path": "Build/WebGL.data.gz",
    "parts": 2,
    "size": 21040352,
    "prefix": "UnityWebData1.0\u0000",
    "mime": null
  },
  {
    "key": "codeUrl",
    "path": "Build/WebGL.wasm.gz",
    "parts": 2,
    "size": 22419922,
    "prefix": "\u0000asm\u0001\u0000\u0000\u0000\u0001\u00fa=\u00be\u0005`\u0002\u007f",
    "mime": "application/wasm"
  }
];

async function mergeFiles(fileParts, cacheKey, mimeType) {
  let cache = null;
  try {
    cache = await caches.open("santy-is-home");
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

// The merge is exposed as prepareSplitBuild(config) rather than by wrapping the
// global, and index.html calls it before createUnityInstance. Wrapping the global
// does not work here: three of these pages inject their loader at runtime with
//
//     var script = document.createElement("script");
//     script.src = loaderUrl;                 // "buildUrl + "/X.loader.js""
//     script.onload = () => createUnityInstance(canvas, config, ...)
//
// and the loader's top-level "function createUnityInstance(...)" declaration goes
// through CreateGlobalFunctionBinding, which redefines the property as
// non-configurable. That silently discards an accessor installed beforehand, and
// throws "Cannot redefine property: createUnityInstance" if it is installed as a
// setter. Both were observed before this was written the other way round.
//
// config is mutated in place and the promise resolves with it, so a caller with a
// config variable only needs to await it, and a caller with an inline object
// literal passes the literal straight in.
window.prepareSplitBuild = function (config) {
  let chain = Promise.resolve();
    chain = chain.then(function () {
      return mergeFiles(getParts(ENTRIES[0].path, 0, ENTRIES[0].parts - 1), "santy-is-home/Build/WebGL.data.gz", null).then(function (url) {
        return checkArchive(url, ENTRIES[0]).then(function () {
          config.dataUrl = url;
        });
      });
    });
    chain = chain.then(function () {
      return mergeFiles(getParts(ENTRIES[1].path, 0, ENTRIES[1].parts - 1), "santy-is-home/Build/WebGL.wasm.gz", "application/wasm").then(function (url) {
        return checkArchive(url, ENTRIES[1]).then(function () {
          config.codeUrl = url;
        });
      });
    });
  return chain
    .then(function () {
      return config;
    })
    .catch(function (err) {
      console.error("santy-is-home: could not load the split game data:", err);
      const canvas = document.querySelector("canvas");
      if (canvas) {
        canvas.textContent = "santy-is-home can't load its game data: " + err.message;
      }
      return config;
    });
};
