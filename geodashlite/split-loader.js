"use strict";

// Build/GeometryDashLite.data.unityweb is 25,106,751 bytes, which is over jsdelivr's 20 MB per-file limit - the CDN
// answers 403 with a text/plain body instead of the file. It is stored as 2
// parts and stitched back together here, the same way station-141,
// papery-planes and madalin-cars-multiplayer do it, then cached so only the
// first load pays for it.
//
// UnityLoader.instantiate is wrapped rather than edited at the call site, so
// index.html needed nothing but the <script> tag above. The wrapper hands back a
// forwarding proxy because these pages do use the return value - georgeandtheprinter
// and scrapmetal both call unityInstance.SetFullscreen(1).

var DATA_PATH = "Build/GeometryDashLite.data.unityweb";
var DATA_PARTS = 2;
var DATA_SIZE = 25106751;
var DATA_PREFIX = "\u001f\u008b\b\u0018j\u0019cc\u0004\u0000Geomet";

async function mergeFiles(fileParts, cacheKey) {
  let cache = null;
  try {
    cache = await caches.open(geodashlite);
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
  const merged = new Blob(buffers);
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

// The reassembled blob has to be the same bytes the file always was. Comparing
// the length and the leading bytes against the values recorded when the split was
// made is format-agnostic - it works for the plain "UnityWeb Data1.0" header, for
// the brotli variant, and for the raw asm.js .data blobs that have no header at
// all - and it still catches the failure mode that bit papery-planes, where a CDN
// error page arrives with a 200 status.
async function checkArchive(url) {
  const head = await fetch(url, { headers: { Range: "bytes=0-15" } });
  if (!head.ok && head.status !== 206) throw new Error("HTTP " + head.status);
  const bytes = new Uint8Array(await head.arrayBuffer());
  const prefix = String.fromCharCode.apply(null, bytes);
  if (prefix !== DATA_PREFIX) {
    throw new Error("the merged copy starts " + JSON.stringify(prefix) +
      " instead of " + JSON.stringify(DATA_PREFIX));
  }
  const size = await fetch(url, { headers: { Range: "bytes=0-0" } });
  const range = size.headers.get("Content-Range") || "";
  const total = range.split("/")[1];
  if (total && Number(total) !== DATA_SIZE) {
    throw new Error("the merged copy is " + total + " bytes, expected " + DATA_SIZE);
  }
  return url;
}

function makeProxy() {
  let target = null;
  const proxy = new Proxy(
    {},
    {
      get(_, prop) {
        if (!target) return function () {};
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      },
      set(_, prop, value) {
        if (target) target[prop] = value;
        return true;
      }
    }
  );
  return { proxy, attach: (t) => { target = t; } };
}

(function () {
  const original = UnityLoader.instantiate;
  UnityLoader.instantiate = function (container, configUrl, overrides) {
    const {proxy, attach} = makeProxy();
    mergeFiles(getParts(DATA_PATH, 0, DATA_PARTS - 1), "geodashlite/" + DATA_PATH)
      .then(checkArchive)
      .then(function (mergedUrl) {
        const next = Object.assign({}, overrides, {
          Module: Object.assign({}, overrides && overrides.Module, {
            dataUrl: mergedUrl
          })
        });
        attach(original(container, configUrl, next));
      })
      .catch(function (err) {
        console.error("geodashlite: could not load the split game data:", err);
        const el = document.getElementById(container) ||
          document.querySelector("canvas") && document.querySelector("canvas").parentNode;
        if (el) {
          el.textContent = "geodashlite can't load its game data: " + err.message;
        }
      });
    return proxy;
  };
})();
