// Byte fetching for the content store. A byte[] cannot cross the async interop boundary
// directly, so a fetch resolves into a JS-side stash keyed by URL; the managed side then
// copies it out synchronously into a buffer it already sized.

import { setLoadingProgress } from "./loading-progress.js";

const stash = new Map();

const RETRY_DELAY_MS = 2000;

async function fetchBytesOnce(url, key = url) {
    const response = await fetch(url);
    if (!response.ok) {
        return -1;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    stash.set(key, bytes);
    return bytes.length;
}

export async function fetchBytes(url) {
    const loaded = await fetchBytesOnce(url);
    if (loaded >= 0) {
        return loaded;
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    const bypass = `${url}${url.includes("?") ? "&" : "?"}ctrdxRetry=1`;
    return fetchBytesOnce(bypass, url);
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
    const response = await fetch(url);
    return response.ok ? await response.text() : null;
}

export function reportContentProgress(type, loaded, total) {
    setLoadingProgress(type, loaded, total);
}
