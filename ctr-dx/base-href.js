// Returns the page's base href for relative asset loading.
// This reads the <base href> element or falls back to "./".

export function getBaseHref() {
    const base = document.querySelector("base[href]");
    return base?.href ?? "./";
}