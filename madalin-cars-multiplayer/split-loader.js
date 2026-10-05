"use strict";

// Build/7d7b82eb5e1c0ce8feedf2e1323e904d.unityweb is 45,346,425 bytes, which is
// over jsdelivr's 20 MB per-file limit, so it is stored as three parts and
// stitched back together here, the same way station-141 and papery-planes do it.
// The result is cached so only the first load pays for it.
//
// The same bytes are also in this folder as ../data.unityweb - both files hash to
// 02501bb6c228dcae673011803331f52a181a413a, so the duplicate was dropped rather
// than split twice. Build/37f4fe02fe4acc34c6a26d8cf99ddc67.json still names the
// single file, and this loader substitutes the merged copy for it.

var DATA_PATH = "Build/7d7b82eb5e1c0ce8feedf2e1323e904d.unityweb";
var DATA_PARTS = 3;

async function mergeFiles(fileParts, cacheKey) {
  let cache = null;
  try {
    cache = await caches.open("madalin-cars-multiplayer");
  } catch (err) {
    cache = null;
  }
  if (cache) {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return URL.createObjectURL(await cachedResponse.blob());
    }
  }
  const buffers = await Promise.all(
    fileParts.map(part => fetch(part).then(r => {
      if (!r.ok) throw new Error("Failed to fetch " + part + " (HTTP " + r.status + ")");
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

// This archive is one of Unity's "Compressed Content" variants - the copy in the
// repo starts with 6b 8d 00 "UnityWeb Compressed Content (brotli)" - so the check
// looks for "UnityWeb" anywhere in the first 12 bytes rather than testing a fixed
// variant string. It is the same assertion that caught papery-planes being handed
// a CDN error page with a 200 status.
async function checkArchive(url) {
  const res = await fetch(url, { headers: { Range: "bytes=0-11" } });
  if (!res.ok && res.status !== 206) {
    throw new Error("HTTP " + res.status);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  const head = String.fromCharCode.apply(null, bytes);
  if (head.indexOf("UnityWeb") === -1) {
    throw new Error("expected a UnityWeb archive, got " + JSON.stringify(head));
  }
}

// Returns the overrides object for UnityLoader.instantiate.
//
// dataUrl has to go inside Module. instantiate() copies the third argument like
// this:
//
//     for (var a in r)
//       "Module" == a ? (for (var i in r[a]) o.Module[i] = r[a][i]) : o[a] = r[a];
//
// and then folds the build config JSON in with
//
//     for (var a in o) "undefined" == typeof n[a] && (n[a] = o[a]);
//
// where n is o.Module. So a top-level dataUrl override would be ignored, but one
// under Module is already defined by the time the JSON is read and is therefore
// kept.
//
// A blob: URL survives resolveBuildUrl() unchanged. Its test is
// /(http|https|ftp|file):\/\// with no anchor, and a blob: URL contains "http://"
// in its origin, so it matches and is returned as-is instead of being resolved
// against the config's directory. This loader has no ".unityweb" suffix check on
// the download path - the only occurrence of that string is in a hint about
// server-side gzip - so unlike papery-planes no fragment is needed here.
window.prepareSplitBuild = async function (overrides) {
  const dataUrl = await mergeFiles(
    getParts(DATA_PATH, 0, DATA_PARTS - 1),
    "madalin-cars-multiplayer/" + DATA_PATH
  );
  try {
    await checkArchive(dataUrl);
  } catch (err) {
    throw new Error(
      "the " + DATA_PARTS + " parts of " + DATA_PATH + " did not reassemble into the " +
      "game data archive (" + err.message + ")"
    );
  }
  return Object.assign({}, overrides, { Module: { dataUrl: dataUrl } });
};