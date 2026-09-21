(function () {
	'use strict';

	if (window.__splitLoaderPatched) return;
	window.__splitLoaderPatched = true;

	var FILE_NAMES = [];
	try {
		var md = window.config && window.config.metadata;
		if (md && md.data_filename) FILE_NAMES.push(md.data_filename);
		if (md && md.code_filename) FILE_NAMES.push(md.code_filename);
	} catch (e) { /* fall through to defaults */ }
	if (!FILE_NAMES.length) {
		FILE_NAMES = [
			'b4c6ea99dc51c73858f47239f387f162.data',
			'f944e4c35e7de77e9a40598d481f8cba.wasm'
		];
	}

	var CHUNK_SIZE = 20 * 1024 * 1024; 

	function mimeFor(name) {
		if (/\.wasm$/i.test(name)) return 'application/wasm';
		if (/\.js$/i.test(name)) return 'text/javascript';
		return 'application/octet-stream';
	}

	/** Absolute-ize a url against the page base. */
	function absUrl(url) {
		try { return new URL(String(url), document.baseURI).href; } catch (e) { return String(url); }
	}

	/**
	 * Fetch `<file>.part0`, `.part1`, ... sequentially until a part is missing
	 * and concatenate them into a single Blob.
	 */
	async function mergeFiles(file) {
		var parts = [];
		var index = 0;
		var type = mimeFor(file);

		for (;;) {
			var partUrl = file + '.part' + index;
			var res;
			try {
				res = await fetch(partUrl, { cache: 'force-cache' });
			} catch (err) {
				if (index === 0) throw err; // nothing split at all — let caller fall back
				break; // network error after a good part: treat as end of sequence
			}
			if (!res.ok) break; // missing part = end of sequence (also covers 404)
			var part = await res.arrayBuffer();
			parts.push(part);
			console.log('[split-loader] loaded ' + partUrl + ' (' + (part.byteLength / 1048576).toFixed(2) + ' MB)');
			// The final split is smaller than the configured chunk size, so avoid
			// probing for a non-existent next part on servers with fallback routes.
			if (part.byteLength < CHUNK_SIZE) break;
			index++;
		}

		if (!parts.length) throw new Error('[split-loader] No parts found for ' + file);
		return new Blob(parts, { type: type });
	}

	// abs url -> { blobUrl, size }
	var MERGED = {};
	// blobUrl -> Blob (so synthetic responses can hand out real bytes)
	var BLOB_STORE = {};

	function getMerged(url) {
		url = absUrl(url);
		if (MERGED[url]) return MERGED[url];
		if (url.indexOf('?') > -1 && MERGED[url.split('?')[0]]) return MERGED[url.split('?')[0]];
		return null;
	}

	function isSplitFile(url) {
		var clean = absUrl(url).split('?')[0];
		return FILE_NAMES.some(function (name) {
			return clean === absUrl('Build/' + name);
		});
	}

	// Kick off merges for every split file up front (in parallel).
	var mergePromises = FILE_NAMES.map(function (name) {
		var fileUrl = 'Build/' + name;
		var url = absUrl(fileUrl);
		return mergeFiles(fileUrl).then(function (blob) {
			var blobUrl = URL.createObjectURL(blob);
			BLOB_STORE[blobUrl] = blob;
			MERGED[url] = { blobUrl: blobUrl, size: blob.size, type: blob.type };
			console.log('[split-loader] ready: ' + fileUrl + ' (' + (blob.size / 1048576).toFixed(2) + ' MB from ' + Math.ceil(blob.size / CHUNK_SIZE) + ' parts)');
		}).catch(function (err) {
			console.warn('[split-loader] merge failed for ' + name + ', requests will fall back to direct fetch:', err);
		});
	});

	window.splitLoader = {
		mergeFiles: mergeFiles,
		ready: Promise.all(mergePromises)
	};

	function syntheticHeaders(size, type) {
		return {
			'Content-Length': String(size),
			'Content-Type': type || 'application/octet-stream',
			'Content-Encoding': 'identity',
			'Accept-Ranges': 'none'
		};
	}

	// ------------------------- fetch patch -------------------------
	var nativeFetch = window.fetch;
	window.fetch = function (input, init) {
		var url = typeof input === 'string' ? input : (input && input.url) || '';
		var entry = getMerged(url);
		if (!entry && !isSplitFile(url)) return nativeFetch.apply(this, arguments);

		return window.splitLoader.ready.then(function () {
			entry = getMerged(url);
			if (!entry) return nativeFetch.apply(window, [input, init]);
			return new Response(BLOB_STORE[entry.blobUrl], {
				status: 200,
				statusText: 'OK',
				headers: syntheticHeaders(entry.size, entry.type)
			});
		});
	};

	// ------------------------- XHR patch -------------------------
	var NativeXHR = window.XMLHttpRequest;
	var XHR_NEW = function () {
		var self = this;
		var xhr = new NativeXHR();
		var info = null; // { url, size, type }

		var _open = xhr.open;
		xhr.open = function (method, url) {
			info = null;
			var entry = getMerged(url);
			if (entry || isSplitFile(url)) {
				var clean = absUrl(String(url)).split('?')[0];
				info = { url: clean, size: entry && entry.size, type: mimeFor(clean) };
			}
			return _open.apply(xhr, arguments);
		};

		var _send = xhr.send;
		xhr.send = function () {
			var sendArgs = arguments;
			if (!info) return _send.apply(xhr, sendArgs);

			window.splitLoader.ready.then(function () {
				var entry = getMerged(info.url);
				if (!entry || !BLOB_STORE[entry.blobUrl]) {
					throw new Error('[split-loader] no merged blob for ' + info.url);
				}
				var blob = BLOB_STORE[entry.blobUrl];
				var headers = syntheticHeaders(entry.size, info.type);

				function fireProgress(loaded, total) {
					try {
						if (typeof xhr.onprogress === 'function') {
							xhr.onprogress({ lengthComputable: true, loaded: loaded, total: total });
						}
					} catch (e) { /* ignore */ }
				}

				var fr = new FileReader();
				fr.onload = function () {
					var buffer = fr.result;
					var text = null;
					try { text = new TextDecoder('utf-8').decode(new Uint8Array(buffer)); } catch (e) { /* binary */ }

					Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
					Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
					Object.defineProperty(xhr, 'statusText', { value: 'OK', configurable: true });
					Object.defineProperty(xhr, 'response', {
						configurable: true,
						get: function () {
							switch (xhr.responseType) {
								case '': case 'text': return text;
								case 'arraybuffer': return buffer;
								case 'blob': return blob;
								case 'json':
									try { return JSON.parse(text); } catch (e) { return null; }
								default: return text;
							}
						}
					});
					Object.defineProperty(xhr, 'responseText', {
						configurable: true,
						get: function () { return text; }
					});
					Object.defineProperty(xhr, 'getResponseHeader', {
						value: function (name) {
							var key = String(name).toLowerCase();
							for (var h in headers) {
								if (h.toLowerCase() === key) return headers[h];
							}
							return null;
						},
						configurable: true
					});
					Object.defineProperty(xhr, 'getAllResponseHeaders', {
						value: function () {
							return Object.keys(headers)
								.map(function (h) { return h + ': ' + headers[h] + '\r\n'; })
								.join('');
						},
						configurable: true
					});

					fireProgress(entry.size, entry.size);
					if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
					if (typeof xhr.onload === 'function') {
						xhr.onload({ target: xhr, type: 'load', loaded: entry.size, total: entry.size, lengthComputable: true });
					}
					if (typeof xhr.onloadend === 'function') xhr.onloadend();
				};
				fr.onerror = function () {
					Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
					Object.defineProperty(xhr, 'status', { value: 500, configurable: true });
					if (typeof xhr.onerror === 'function') xhr.onerror({ target: xhr, type: 'error' });
					if (typeof xhr.onloadend === 'function') xhr.onloadend();
				};
				fr.readAsArrayBuffer(blob);

				if (typeof xhr.onloadstart === 'function') xhr.onloadstart();
			}).catch(function (err) {
				console.error('[split-loader] XHR interception failed for ' + info.url + ', falling back to direct request', err);
				// Last resort: let the original request through (will 404, but keeps behavior sane).
				_send.apply(xhr, sendArgs);
			});
		};

		return xhr;
	};
	// Preserve prototype + static constants so instanceof and constants keep working.
	XHR_NEW.prototype = NativeXHR.prototype;
	['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'].forEach(function (k, i) {
		try { XHR_NEW[k] = i; } catch (e) { /* ignore */ }
	});
	window.XMLHttpRequest = XHR_NEW;

	console.log('[split-loader] active for: ' + FILE_NAMES.join(', '));
})();
