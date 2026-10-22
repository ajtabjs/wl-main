// Byte fetching for the content store. A byte[] cannot cross the async interop boundary
// directly, so a fetch resolves into a JS-side stash keyed by URL; the managed side then
// copies it out synchronously into a buffer it already sized.

import { setLoadingProgress } from "./loading-progress.js";

const stash = new Map();

const retryableStatus = new Set([403, 408, 425, 429, 500, 502, 503, 504]);
const retryDelaysMs = [250, 700, 1800];

async function fetchWithRetry(url) {
    let response = await fetch(url);
    for (const delay of retryDelaysMs) {
        if (!retryableStatus.has(response.status)) {
            return response;
        }
        await new Promise((resolve) =>
            setTimeout(resolve, delay + Math.random() * delay * 0.5),
        );
        response = await fetch(url);
    }
    return response;
}

export async function fetchBytes(url) {
    const response = await fetchWithRetry(url);
    if (!response.ok) {
        return -1;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    stash.set(url, bytes);
    return bytes.length;
}

export function takeStashed(url, destination) {
    const bytes = stash.get(url);
    if (bytes === undefined) {
        return 0;
    }
    destination.set(bytes);
    stash.delete(url);
    return bytes.length;
}

export async function fetchText(url) {
    const response = await fetchWithRetry(url);
    return response.ok ? await response.text() : null;
}

export function reportContentProgress(type, loaded, total) {
    setLoadingProgress(type, loaded, total);
}
