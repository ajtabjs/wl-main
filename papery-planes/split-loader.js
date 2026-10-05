"use strict";

// unity/ppw.wasm.code.unityweb is over jsdelivr's 20 MB per-file limit, so it is
// stored as parts and stitched back together here, the same way station-141 does
// it.
//
// poki's master-loader.js waits for window.prepareSplitBuild() before it loads
// the SDK, and hands the patched build config back through
// window.config.unityWebglBuildUrl. UnityLoader.2019.1.js is therefore used
// completely unmodified.

var CODE_PATH = "unity/ppw.wasm.code.unityweb";
var CODE_PARTS = 2;

async function mergeFiles(fileParts, cacheKey) {
  let cache = null;
  try {
    cache = await caches.open("paperyplanes");
  } catch (err) {
    cache = null;
  }
  if (cache) {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }
  }
  const buffers = await Promise.all(
    fileParts.map(part => fetch(part).then(r => {
      if (!r.ok) throw new Error("Failed to fetch " + part);
      return r.arrayBuffer();
    }))
  );
  const mergedBlob = new Blob(buffers);
  if (cache) {
    try {
      await cache.put(cacheKey, new Response(mergedBlob));
    } catch (err) {
      console.warn("Cache write failed for " + cacheKey, err);
    }
  }
  return URL.createObjectURL(mergedBlob);
}

function getParts(file, start, end) {
  let parts = [];
  for (let i = start; i <= end; i++) {
    parts.push(file + ".part" + i);
  }
  return parts;
}

window.prepareSplitBuild = async function (buildUrl) {
  const jsonUrl = new URL(buildUrl, document.baseURI).href;
  const config = await fetch(jsonUrl).then(r => r.json());

  const mergedCode = await mergeFiles(
    getParts(CODE_PATH, 0, CODE_PARTS - 1),
    "paperyplanes/" + CODE_PATH
  );
  // Unity's 2019 loader only schedules the wasm download when the URL ends in
  // ".unityweb", and its resolveBuildUrl() only leaves a URL untouched when it
  // can see a scheme it recognises. A fragment satisfies both: the "https://"
  // inside the blob: URL satisfies the scheme test and the ".unityweb" tail
  // satisfies the suffix test, while neither of them reaches the blob itself.
  config.wasmCodeUrl = mergedCode + "#" + CODE_PATH.split("/").pop();

  ["dataUrl", "wasmFrameworkUrl", "wasmMemoryUrl", "backgroundUrl"].forEach(key => {
    if (config[key]) config[key] = new URL(config[key], jsonUrl).href;
  });

  return URL.createObjectURL(
    new Blob([JSON.stringify(config)], { type: "application/json" })
  );
};
