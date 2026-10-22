window.__CTRTT_BUILD_INDEX__ = 60;

// Глобальные переключатели режима загрузки
(function(){
    try {
        var NO_BR = true;
        if (typeof window !== 'undefined') {
            window.__CTR_NO_BR__ = NO_BR;
            window.__CTR_BOOT_NAMES__ = {
                data: 'ctr-tt.data',
                wasm: 'ctrtt.wasm',
                loadassets: 'loadassets.tar'
            };
        }
    } catch (_) { /* no-op */ }
})();

// AUDIO-001 (СЂР°РЅРЅСЏСЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ): РµСЃР»Рё РїРѕСЂС‚Р°Р» СѓР¶Рµ Р·РЅР°РµС‚ mute-СЃРѕСЃС‚РѕСЏРЅРёРµ,
// СЃРѕС…СЂР°РЅРёРј РµРіРѕ РІ Module.__PortalDesiredMute РґРѕ РёРЅРёС†РёР°Р»РёР·Р°С†РёРё Р°СѓРґРёРѕ РІ WASM.
(function(){
    try {
        if (typeof window !== 'undefined' && window.GameInterface && typeof window.GameInterface.isMuted === 'function') {
            var m = !!window.GameInterface.isMuted();
            if (!window.Module) window.Module = {};
            window.Module.__PortalDesiredMute = m;
        }
    } catch (e) { /* no-op */ }
})();

// === РџСЂРѕРіСЂРµСЃСЃ Р·Р°РіСЂСѓР·РєРё РґР»СЏ Famobi API ===
(function() {
    const progress = {
        data: 0,
        wasm: 0,
        loadassets: 0
    };
    
    let lastSentProgress = -1; // Для предотвращения дублей и откатов прогресса

    function updateProgress(file, percent) {
        progress[file] = Math.min(100, Math.max(0, percent));
        
        // Р’С‹С‡РёСЃР»СЏРµРј РїСЂРѕРіСЂРµСЃСЃ С‚РѕР»СЊРєРѕ РґР»СЏ Р·Р°РіСЂСѓР¶РµРЅРЅС‹С… РєСЂРёС‚РёС‡РЅС‹С… С„Р°Р№Р»РѕРІ (data + wasm)
        // loadassets РјРѕР¶РµС‚ РіСЂСѓР·РёС‚СЊСЃСЏ РїРѕР·Р¶Рµ, РЅРµ СѓС‡РёС‚С‹РІР°РµРј РµРіРѕ РІ РѕСЃРЅРѕРІРЅРѕРј РїСЂРѕРіСЂРµСЃСЃРµ
        const criticalProgress = (progress.data + progress.wasm) / 2;
        // РћРіСЂР°РЅРёС‡РёРІР°РµРј РјР°РєСЃРёРјСѓРј 99%, С‡С‚РѕР±С‹ 100% РѕС‚РїСЂР°РІР»СЏР»СЃСЏ С‚РѕР»СЊРєРѕ РІ onLoadingComplete
        // Кандидат на отправку прогресса: 0..99 (100 отправляем только в onLoadingComplete)
        const roundedCandidate = Math.min(99, Math.floor(criticalProgress));

        // Не допускаем уменьшения прогресса: делаем монотоничным
        // Если уже был отправлен 100% — игнорируем дальнейшие обновления
        if (lastSentProgress >= 100) {
            return;
        }
        const rounded = Math.max(0, Math.max(lastSentProgress, roundedCandidate));

        // Р‘РµР·РѕРїР°СЃРЅРѕ РѕР±РЅРѕРІР»СЏРµРј РїСЂРѕС†РµРЅС‚С‹, РµСЃР»Рё СЌР»РµРјРµРЅС‚ СЃСѓС‰РµСЃС‚РІСѓРµС‚
        try {
            var label = document.getElementById('x_unity-loading-percent');
            if (label) label.textContent = String(rounded) + '%';
        } catch (_) { /* no-op */ }

        // РќРµ РѕС‚РїСЂР°РІР»СЏРµРј РѕРґРёРЅР°РєРѕРІС‹Р№ РїСЂРѕС†РµРЅС‚ РґРІР°Р¶РґС‹
        if (rounded === lastSentProgress) {
            return;
        }
        lastSentProgress = rounded;

        // РћР±РЅРѕРІР»СЏРµРј UI Р»РѕР°РґРµСЂ
        try {
            const bar = document.getElementById('x_unity-loading-bar-inner');
            if (bar) bar.style.width = rounded + '%';
        } catch (e) {}

        // РћС‚РїСЂР°РІР»СЏРµРј РІ Famobi API
        try {
            if (window.GameInterface !== undefined && 
                window.GameInterface.sendPreloadProgress !== undefined) {
                window.GameInterface.sendPreloadProgress(rounded);
            }
        } catch (e) {
            console.warn('[Progress] Failed to send to Famobi:', e);
        }

        console.log('[Progress] ' + file + ': ' + percent + '% | Critical: ' + rounded + '% (data:' + progress.data + ', wasm:' + progress.wasm + ', loadassets:' + progress.loadassets + ')');
    }

    function onLoadingComplete() {
        console.log('[Progress] Loading complete!');
        
        // Проверяем, что 100% ещё не отправлялся
        if (lastSentProgress !== 100) {
            lastSentProgress = 100;
            
            // Обновляем UI прогресс-бара до 100% (но ОВЕРЛЕЙ НЕ УБИРАЕМ здесь)
            try {
                const bar = document.getElementById('x_unity-loading-bar-inner');
                if (bar) bar.style.width = '100%';
                const label = document.getElementById('x_unity-loading-percent');
                if (label) label.textContent = '100%';
            } catch (e) {}

            // Отправляем 100% в Famobi
            try {
                if (window.GameInterface !== undefined && 
                    window.GameInterface.sendPreloadProgress !== undefined) {
                    window.GameInterface.sendPreloadProgress(100);
                    console.log('[Progress] Final 100% sent');
                }
            } catch (e) {}
        }
    }

    window.__ctrtt_updateProgress = updateProgress;
    window.__ctrtt_onLoadingComplete = onLoadingComplete;

    // Гарантированно отправить 100% ПЕРЕД gameReady, если ещё не было отправлено
    window.__ctrtt_forceSend100IfNeeded = function(){
        try {
            if (lastSentProgress < 100) {
                lastSentProgress = 100;
                try {
                    const bar = document.getElementById('x_unity-loading-bar-inner');
                    if (bar) bar.style.width = '100%';
                    const label = document.getElementById('x_unity-loading-percent');
                    if (label) label.textContent = '100%';
                } catch (_) {}
                if (window.GameInterface && typeof window.GameInterface.sendPreloadProgress === 'function') {
                    window.GameInterface.sendPreloadProgress(100);
                    console.log('[Progress] Forced 100% sent before gameReady');
                }
            }
        } catch (_) {}
    };
})();

// РћС‡РµСЂРµРґСЊ РґР»СЏ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕР№ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё FS.syncfs, С‡С‚РѕР±С‹ РёР·Р±РµРіР°С‚СЊ РїР°СЂР°Р»Р»РµР»СЊРЅС‹С… РѕРїРµСЂР°С†РёР№
var __ctrtt_syncChain = Promise.resolve();
function syncfsQueued(populate, cb) {
    try {
        __ctrtt_syncChain = __ctrtt_syncChain.then(function () {
            return new Promise(function (resolve) {
                try {
                    FS.syncfs(!!populate, function (err) { resolve(err || null); });
                } catch (e) {
                    // Р•СЃР»Рё FS.syncfs Р±СЂРѕСЃРёР» СЃРёРЅС…СЂРѕРЅРЅРѕ, РЅРµ СЂРѕРЅСЏРµРј С†РµРїРѕС‡РєСѓ
                    resolve(e || true);
                }
            });
        });
        if (typeof cb === 'function') {
            __ctrtt_syncChain.then(function (err) { try { cb(err || null); } catch (_) {} });
        }
        return __ctrtt_syncChain;
    } catch (_) {
        // Р’ РєСЂР°Р№РЅРµРј СЃР»СѓС‡Р°Рµ РІС‹Р·РѕРІРµРј РЅР°РїСЂСЏРјСѓСЋ, РЅРѕ РѕР±РµСЂРЅС‘Рј РІ try/catch
        try { FS.syncfs(!!populate, function (err) { if (cb) cb(err || null); }); } catch (_) {}
        return Promise.resolve();
    }
}

function idbBase() {
    return '/idb_assets_v' + String(window.__CTRTT_BUILD_INDEX__ || 0) + '/';
}

async function openCacheDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ctrtt-cache-' + String(window.__CTRTT_BUILD_INDEX__ || 0), 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files');
            }
        };
    });
}

async function getCachedFile(url) {
    try {
        const db = await openCacheDB();
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        return new Promise((resolve, reject) => {
            const request = store.get(url);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    } catch (e) {
        console.warn('[Cache] Failed to get cached file:', e);
        return null;
    }
}

async function setCachedFile(url, data) {
    try {
        const db = await openCacheDB();
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        store.put(data, url);
        console.log('[Cache] Cached file:', url);
    } catch (e) {
        console.warn('[Cache] Failed to cache file:', e);
    }
}

async function fetchAndMaybeDecompress(url) {
    var NO_BR = !!(typeof window !== 'undefined' && window.__CTR_NO_BR__);
    var BOOT = (typeof window !== 'undefined' && window.__CTR_BOOT_NAMES__) ? window.__CTR_BOOT_NAMES__ : { data:'ctrtt.data.br', wasm:'ctrtt.wasm.br', loadassets:'loadassets.tar.br' };

    // Определяем тип файла для трекинга прогресса
    let progressKey = null;
    if (url.includes(BOOT.data)) progressKey = 'data';
    else if (url.includes(BOOT.wasm)) progressKey = 'wasm';
    else if (url.includes(BOOT.loadassets)) progressKey = 'loadassets';

    // Кэшируем только критичные файлы (data/wasm)
    if (!NO_BR && (url.endsWith('.data.br') || url.endsWith('.wasm.br'))) {
        const cached = await getCachedFile(url);
        if (cached) {
            console.log('[Cache] Using cached file:', url);
            if (progressKey) window.__ctrtt_updateProgress(progressKey, 100);
            return cached;
        }
    }

    const r = await fetch(url, { cache: 'default' });
    if (!r.ok) throw new Error('Failed ' + url + ' HTTP ' + r.status);

    const contentLength = r.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    let loaded = 0;
    const reader = r.body && r.body.getReader ? r.body.getReader() : null;
    const chunks = [];

    if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            if (progressKey && total > 0) {
                const downloadPercent = Math.floor((loaded / total) * 50);
                window.__ctrtt_updateProgress(progressKey, downloadPercent);
            }
        }
    } else {
        // Fallback без stream reader (старые браузеры)
        const buf = await r.arrayBuffer();
        chunks.push(new Uint8Array(buf));
        loaded = buf.byteLength;
        if (progressKey && total > 0) {
            const downloadPercent = Math.floor((loaded / total) * 50);
            window.__ctrtt_updateProgress(progressKey, downloadPercent);
        }
    }

    const bytes = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }

    if (NO_BR) {
        if (progressKey) window.__ctrtt_updateProgress(progressKey, 100);
        return bytes.buffer;
    }

    if (progressKey) window.__ctrtt_updateProgress(progressKey, 75);
    const decompressed = BrotliDecode(bytes).buffer;
    if (progressKey) window.__ctrtt_updateProgress(progressKey, 100);

    if (url.endsWith('.data.br') || url.endsWith('.wasm.br')) {
        await setCachedFile(url, decompressed);
    }
    return decompressed;
}

var loadAssetsTarBuffer = null;

function checkDoneFlagAndSet() {
    try {
        if (Module.__LoadAssetsExtractionDone)
            return true;
        let exists = false;
        try {
            exists = FS.analyzePath(idbBase() + '.loadassets_done').exists;
        } catch (_) {}
        if (exists) {
            Module.__LoadAssetsExtractionDone = true;
            Module.__loadAssetsPreRunApplied = true;
            if (typeof maybeStartMainLoopIfReady === 'function')
                maybeStartMainLoopIfReady();
            return true;
        }
    } catch (e) {
        console.warn('[LoadAssets][Release] checkDoneFlagAndSet error', e);
    }
    return false;
}

function untarToFS(arrayBuffer, done) {
    if (!arrayBuffer) {
        if (done)
            done();
        return;
    }
    try {
        const data = new Uint8Array(arrayBuffer);
        let offset = 0;
        function readString(buf, start, len) {
            let s = '';
            for (let i = 0; i < len; i++) {
                const c = buf[start + i];
                if (c === 0)
                    break;
                s += String.fromCharCode(c);
            }
            return s.trim();
        }
        function readOctal(buf, start, len) {
            let s = readString(buf, start, len).replace(/[^0-7]/g, '');
            return s ? parseInt(s, 8) : 0;
        }
        while (offset + 512 <= data.length) {
            let name = readString(data, offset, 100);
            if (!name)
                break;
            if (name.startsWith('LoadAssets/'))
                name = name.substring('LoadAssets/'.length);
            if (!name) {
                const sizeSkip = readOctal(data, offset + 124, 12);
                const blocksSkip = Math.ceil(sizeSkip / 512);
                const contentOffsetSkip = offset + 512;
                offset = contentOffsetSkip + blocksSkip * 512;
                continue;
            }
            const size = readOctal(data, offset + 124, 12);
            const typeflag = data[offset + 156];
            const contentOffset = offset + 512;
            if (name.endsWith('/') || typeflag === 53) {
                try {
                    FS.mkdirTree(idbBase() + name);
                } catch (e) {}
                try {
                    FS.mkdirTree('/assets/' + name);
                } catch (e) {}
            } else {
                const fileData = data.subarray(contentOffset, contentOffset + size);
                const dir = name.includes('/') ? name.substring(0, name.lastIndexOf('/')) : '';
                if (dir) {
                    try {
                        FS.mkdirTree(idbBase() + dir);
                    } catch (e) {}
                }
                FS.writeFile(idbBase() + name, fileData);
                const assetPath = '/assets/' + name;
                const idbPath = idbBase() + name;
                if (dir) {
                    try {
                        FS.mkdirTree('/assets/' + dir);
                    } catch (e) {}
                }
                try {
                    FS.unlink(assetPath);
                } catch (e) {}
                try {
                    FS.symlink(idbPath, assetPath);
                } catch (e) {}
            }
            const blocks = Math.ceil(size / 512);
            offset = contentOffset + blocks * 512;
        }
        syncfsQueued(false, (err) => {
            if (err)
                console.error('[LoadAssets][Release] sync error', err);
            else
                console.log('[LoadAssets][Release] extracted');
            // done flag
            try {
                let exists = false;
                try {
                    exists = FS.analyzePath(idbBase() + '.loadassets_done').exists;
                } catch (_) {}
                if (!exists) {
                    FS.writeFile(idbBase() + '.loadassets_done', 'v1');
                    syncfsQueued(false, e2 => {
                        if (e2)
                            console.warn('[LoadAssets][Release] done-flag sync error', e2);
                        else
                            console.log('[LoadAssets][Release] done flag persisted');
                    });
                }
            } catch (e2) {
                console.warn('[LoadAssets][Release] done flag write failed', e2);
            }
            Module.__LoadAssetsExtractionDone = true;
            Module.__loadAssetsPreRunApplied = true;
            if (Module.__LoadAssetsNeedBlocking && typeof removeRunDependency === 'function')
                removeRunDependency('loadassets');
            if (done)
                done();
            if (typeof maybeStartMainLoopIfReady === 'function')
                maybeStartMainLoopIfReady();
        });
    } catch (e) {
        console.warn('[LoadAssets][Release] untar failed', e);
        if (done)
            done();
    }
}

function maybeStartMainLoopIfReady() {
    if (!Module.__cacheReadyFlag)
        return;
    if (Module.__LoadAssetsNeedBlocking && !Module.__LoadAssetsExtractionDone)
        return;
    if (!Module.__mainLoopStarted && typeof _startMainLoop === 'function') {
        Module.__mainLoopStarted = true;

        // НЕ скрываем оверлей и НЕ зовём gameReady здесь — дождёмся главного меню
        _startMainLoop();

        // GAME-005: Р РµРіРёСЃС‚СЂРёСЂСѓРµРј РЅР°РІРёРіР°С†РёРѕРЅРЅС‹Рµ РєРѕР»Р±СЌРєРё РџРћРЎР›Р• gameReady
        try {
            if (window.GameInterface !== undefined) {
                // PAUSE-001: РіР»РѕР±Р°Р»СЊРЅР°СЏ РїР°СѓР·Р°/СЂРµР·СЋРј РёР· РїРѕСЂС‚Р°Р»Р° (РјР°СЃС‚РµСЂ-РїР°СѓР·Р°)
                (function(){
                    function ensureOverlay(){
                        var ov = document.getElementById('x_pause_overlay');
                        if (ov) return ov;
                        var canvas = document.getElementById('canvas');
                        var parent = canvas && canvas.parentNode ? canvas.parentNode : null;
                        ov = document.createElement('div');
                        ov.id = 'x_pause_overlay';
                        ov.style.position = 'absolute';
                        ov.style.left = '0';
                        ov.style.top = '0';
                        ov.style.right = '0';
                        ov.style.bottom = '0';
                        ov.style.background = 'rgba(0,0,0,0.4)';
                        ov.style.zIndex = '1'; // СЃР»РµРґСѓСЋС‰РёР№ СѓСЂРѕРІРµРЅСЊ РЅР°Рґ РєР°РЅРІР°СЃРѕРј
                        ov.style.display = 'none';
                        // Р’РђР–РќРћ: РЅРµ РїРµСЂРµС…РІР°С‚С‹РІР°РµРј СЃРѕР±С‹С‚РёСЏ, С‡С‚РѕР±С‹ UI РїРѕСЂС‚Р°Р»Р° РѕСЃС‚Р°РІР°Р»СЃСЏ РєР»РёРєР°Р±РµР»СЊРЅС‹Рј,
                        // Р±Р»РѕРєРёСЂРѕРІРєСѓ РІРІРѕРґР° РґРµР»Р°РµРј РЅР° СЃР°РјРѕРј РєР°РЅРІР°СЃРµ РїСЂРё РїР°СѓР·Рµ
                        ov.style.pointerEvents = 'none';
                        if (parent) {
                            // РіР°СЂР°РЅС‚РёСЂСѓРµРј, С‡С‚Рѕ РєРѕРЅС‚РµР№РЅРµСЂ СЃРѕР·РґР°С‘С‚ РєРѕРЅС‚РµРєСЃС‚ РїРѕР·РёС†РёРѕРЅРёСЂРѕРІР°РЅРёСЏ
                            try {
                                var cs = window.getComputedStyle(parent);
                                if (cs && cs.position === 'static') parent.style.position = 'relative';
                            } catch(_) { parent.style.position = 'relative'; }
                            // РІСЃС‚Р°РІР»СЏРµРј СЃСЂР°Р·Сѓ РїРѕСЃР»Рµ canvas
                            try {
                                if (canvas && canvas.nextSibling) parent.insertBefore(ov, canvas.nextSibling);
                                else parent.appendChild(ov);
                            } catch(_) { parent.appendChild(ov); }
                        } else {
                            // Р·Р°РїР°СЃРЅРѕР№ РІР°СЂРёР°РЅС‚: РґРѕР±Р°РІРёРј РІ body, РЅРѕ СЃ РЅРёР·РєРёРј z-index
                            document.body.appendChild(ov);
                        }
                        return ov;
                    }
                    function setCanvasInput(paused){
                        try {
                            var canvas = document.getElementById('canvas');
                            if (!canvas) return;
                            if (paused) {
                                if (canvas.__prevPointerEvents === undefined) {
                                    canvas.__prevPointerEvents = canvas.style.pointerEvents || '';
                                }
                                canvas.style.pointerEvents = 'none';
                            } else {
                                var prev = (canvas.__prevPointerEvents !== undefined) ? canvas.__prevPointerEvents : '';
                                canvas.style.pointerEvents = prev;
                            }
                        } catch(_) {}
                    }
                    function showOverlay(){ var ov = ensureOverlay(); ov.style.display = 'block'; setCanvasInput(true); }
                    function hideOverlay(){ var ov = ensureOverlay(); ov.style.display = 'none'; setCanvasInput(false); }

                    // РїСЂРёРјРµРЅСЏРµРј РЅР°С‡Р°Р»СЊРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ, РµСЃР»Рё РґРѕСЃС‚СѓРїРЅРѕ isPaused()
                    try {
                        if (typeof window.GameInterface.isPaused === 'function') {
                            var paused = !!window.GameInterface.isPaused();
                            if (paused) {
                                if (typeof Module._pauseMainLoop === 'function') Module._pauseMainLoop();
                                showOverlay();
                            }
                        }
                    } catch(_) {}

                    if (typeof window.GameInterface.onPauseStateChange === 'function') {
                        window.GameInterface.onPauseStateChange(function(isPaused){
                            if (isPaused) {
                                if (typeof Module._pauseMainLoop === 'function') Module._pauseMainLoop();
                                showOverlay();
                            } else {
                                if (typeof Module._resumeMainLoop === 'function') Module._resumeMainLoop();
                                hideOverlay();
                            }
                        });
                    }
                })();
                
                // VISIBILITY-001: Пауза при потере видимости вкладки (только если портал поддерживает visibilitychange)
                (function(){
                    // Проверяем поддержку visibilitychange через GameInterface
                    var supportsVisibility = false;
                    try {
                        if (typeof window.GameInterface.hasFeature === 'function') {
                            supportsVisibility = !!window.GameInterface.hasFeature("visibilitychange");
                        }
                    } catch(_) {}
                    
                    if (!supportsVisibility) {
                        console.log('[VISIBILITY-001] visibilitychange not supported by portal - skipping visibility handling');
                        return;
                    }
                    
                    console.log('[VISIBILITY-001] visibilitychange supported - registering handlers');
                    
                    function onVisibilityChanged() {
                        try {
                            // Проверяем различные префиксные варианты document.hidden
                            var isHidden = !!(document.hidden || document.mozHidden || document.webkitHidden || document.msHidden);
                            
                            if (isHidden) {
                                console.log('[VISIBILITY-001] Page hidden - pausing game and audio');
                                // Ставим игру на паузу
                                if (typeof Module._pauseMainLoop === 'function') {
                                    Module._pauseMainLoop();
                                }
                                // Останавливаем звук (если аудио инициализировано)
                                if (Module.zfAudio && Module.zfAudio.ctx) {
                                    try {
                                        if (Module.zfAudio.ctx.state === 'running') {
                                            Module.zfAudio._visibilityPaused = true;
                                            Module.zfAudio.ctx.suspend();
                                        }
                                    } catch(e) {
                                        console.warn('[VISIBILITY-001] Failed to suspend audio:', e);
                                    }
                                }
                            } else {
                                console.log('[VISIBILITY-001] Page visible - resuming game and audio');
                                // Возобновляем игру
                                if (typeof Module._resumeMainLoop === 'function') {
                                    Module._resumeMainLoop();
                                }
                                // Возобновляем звук (только если останавливали мы, а не портал через mute)
                                if (Module.zfAudio && Module.zfAudio.ctx && Module.zfAudio._visibilityPaused) {
                                    try {
                                        if (Module.zfAudio.ctx.state === 'suspended') {
                                            // Проверяем что портал не замьютил звук
                                            var portalMuted = !!(Module.zfAudio._portalMuted || Module.__PortalDesiredMute);
                                            if (!portalMuted) {
                                                Module.zfAudio.ctx.resume();
                                            }
                                        }
                                        Module.zfAudio._visibilityPaused = false;
                                    } catch(e) {
                                        console.warn('[VISIBILITY-001] Failed to resume audio:', e);
                                    }
                                }
                            }
                        } catch(e) {
                            console.warn('[VISIBILITY-001] onVisibilityChanged error:', e);
                        }
                    }
                    
                    // Регистрируем обработчики для всех браузеров
                    document.addEventListener("visibilitychange", onVisibilityChanged, false);
                    document.addEventListener("mozvisibilitychange", onVisibilityChanged, false);
                    document.addEventListener("webkitvisibilitychange", onVisibilityChanged, false);
                    document.addEventListener("msvisibilitychange", onVisibilityChanged, false);
                })();
                
                // AUDIO-001: СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ mute СЃРѕСЃС‚РѕСЏРЅРёСЏ РїРѕСЂС‚Р°Р»Р°
                try {
                    if (typeof window.GameInterface.isMuted === 'function') {
                        var initialMuted = false;
                        try { initialMuted = !!window.GameInterface.isMuted(); } catch(_) {}
                        // РЎРѕС…СЂР°РЅСЏРµРј Р¶РµР»Р°РµРјРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ РґРѕ РёРЅРёС†РёР°Р»РёР·Р°С†РёРё Р·РІСѓРєР°
                        Module.__PortalDesiredMute = initialMuted;
                        // Р•СЃР»Рё Р°СѓРґРёРѕ СѓР¶Рµ РёРЅРёС†РёР°Р»РёР·РёСЂРѕРІР°РЅРѕ вЂ” РїСЂРёРјРµРЅРёРј СЃСЂР°Р·Сѓ
                        if (Module.zfAudio && Module.zfAudio.masterGain) {
                            Module.zfAudio._portalMuted = initialMuted;
                            if (initialMuted) {
                                if (typeof Module.zfAudio._portalPrevMaster !== 'number') {
                                    try { Module.zfAudio._portalPrevMaster = Module.zfAudio.masterGain.gain.value; } catch(_) { Module.zfAudio._portalPrevMaster = 1.0; }
                                }
                                try { Module.zfAudio.masterGain.gain.value = 0.0; } catch(_) {}
                            } else {
                                var prev = (typeof Module.zfAudio._portalPrevMaster === 'number') ? Module.zfAudio._portalPrevMaster : 1.0;
                                try { Module.zfAudio.masterGain.gain.value = prev; } catch(_) {}
                                try { if (Module.zfAudio.ctx && Module.zfAudio.ctx.state === 'suspended') Module.zfAudio.ctx.resume(); } catch(_) {}
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[AUDIO-001] initial isMuted sync failed', e);
                }

                if (typeof window.GameInterface.onGoToHome === 'function') {
                    window.GameInterface.onGoToHome(function() {
                        if (typeof Module._famobi_onGoToHome === 'function') {
                            Module._famobi_onGoToHome();
                        }
                    });
                }
                
                if (typeof window.GameInterface.onGoToNextLevel === 'function') {
                    window.GameInterface.onGoToNextLevel(function() {
                        if (typeof Module._famobi_onGoToNextLevel === 'function') {
                            Module._famobi_onGoToNextLevel();
                        }
                    });
                }
                
                if (typeof window.GameInterface.onGoToLevel === 'function') {
                    window.GameInterface.onGoToLevel(function(level) {
                        if (typeof Module._famobi_onGoToLevel === 'function') {
                            Module._famobi_onGoToLevel(level);
                        }
                    });
                }

                if (typeof window.GameInterface.onQuitGame === 'function') {
                    window.GameInterface.onQuitGame(function() {
                        if (typeof Module._famobi_onQuitGame === 'function') {
                            Module._famobi_onQuitGame();
                        }
                    });
                }

                if (typeof window.GameInterface.onGameOver === 'function') {
                    window.GameInterface.onGameOver(function() {
                        if (typeof Module._famobi_onGameOverEvent === 'function') {
                            Module._famobi_onGameOverEvent();
                        }
                    });
                }

                // Рестарт уровня через портал
                if (typeof window.GameInterface.onRestartGame === 'function') {
                    window.GameInterface.onRestartGame(function(){
                        if (typeof Module._famobi_restartlevel === 'function') {
                            Module._famobi_restartlevel();
                        }
                    });
                }

                // AUDIO-001: РїРѕРґРїРёСЃРєР° РЅР° РёР·РјРµРЅРµРЅРёСЏ mute
                try {
                    if (typeof window.GameInterface.onMuteStateChange === 'function') {
                        window.GameInterface.onMuteStateChange(function(muted){
                            var wantMute = !!muted;
                            Module.__PortalDesiredMute = wantMute;
                            if (Module.zfAudio && Module.zfAudio.masterGain) {
                                Module.zfAudio._portalMuted = wantMute;
                                if (wantMute) {
                                    if (typeof Module.zfAudio._portalPrevMaster !== 'number') {
                                        try { Module.zfAudio._portalPrevMaster = Module.zfAudio.masterGain.gain.value; } catch(_) { Module.zfAudio._portalPrevMaster = 1.0; }
                                    }
                                    try { Module.zfAudio.masterGain.gain.value = 0.0; } catch(_) {}
                                } else {
                                    var prev = (typeof Module.zfAudio._portalPrevMaster === 'number') ? Module.zfAudio._portalPrevMaster : 1.0;
                                    try { Module.zfAudio.masterGain.gain.value = prev; } catch(_) {}
                                    try { if (Module.zfAudio.ctx && Module.zfAudio.ctx.state === 'suspended') Module.zfAudio.ctx.resume(); } catch(_) {}
                                }
                            }
                        });
                    } else if (typeof window.GameInterface.onAudioStateChange === 'function') {
                        // Fallback: РЅРµРєРѕС‚РѕСЂС‹Рµ РїРѕСЂС‚Р°Р»С‹ РёСЃРїРѕР»СЊР·СѓСЋС‚ onAudioStateChange
                        window.GameInterface.onAudioStateChange(function(state){
                            var wantMute = !!state;
                            Module.__PortalDesiredMute = wantMute;
                            if (Module.zfAudio && Module.zfAudio.masterGain) {
                                Module.zfAudio._portalMuted = wantMute;
                                if (wantMute) {
                                    if (typeof Module.zfAudio._portalPrevMaster !== 'number') {
                                        try { Module.zfAudio._portalPrevMaster = Module.zfAudio.masterGain.gain.value; } catch(_) { Module.zfAudio._portalPrevMaster = 1.0; }
                                    }
                                    try { Module.zfAudio.masterGain.gain.value = 0.0; } catch(_) {}
                                } else {
                                    var prev = (typeof Module.zfAudio._portalPrevMaster === 'number') ? Module.zfAudio._portalPrevMaster : 1.0;
                                    try { Module.zfAudio.masterGain.gain.value = prev; } catch(_) {}
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.warn('[AUDIO-001] mute change registration failed', e);
                }
            }
        } catch (e) {
            //console.warn('[Famobi] Failed to register navigation callbacks:', e);
        }
    }
}

// Вызывается из C++/игры, когда ГЛАВНОЕ МЕНЮ реально на экране.
// Скрывает загрузочный оверлей и отправляет gameReady в Famobi (однократно).
(function(){
    let menuReadyOnce = false;
    function onMenuReady(){
        if (menuReadyOnce) return;
        menuReadyOnce = true;
        // Обеспечить отправку 100% перед gameReady, если не было
        try { if (typeof window.__ctrtt_forceSend100IfNeeded === 'function') window.__ctrtt_forceSend100IfNeeded(); } catch(_) {}
        // Безопасно скрываем оверлей
        try {
            const ovl = document.getElementById('x_ovl');
            if (ovl) ovl.remove();
        } catch (e) { console.warn('[MenuReady] Failed to remove overlay:', e); }

        // Уведомляем Famobi об отображении меню
        try {
            if (window.GameInterface && typeof window.GameInterface.gameReady === 'function') {
                window.GameInterface.gameReady();
                // console.log('[Famobi] gameReady() on main menu');
            }
        } catch (e) {}
    }
    window.__ctrtt_onMenuReady = onMenuReady;
})();

// GAME-002: Запрос «старт уровня» у портала и продолжение игры после разрешения.
// Если портал не предоставляет промис-API, продолжаем сразу.
(function(){
    async function requestStartLevel(){
        try {
            // Попробуем несколько сигнатур API: gameStart() / startGame()
            var GI = (typeof window !== 'undefined') ? window.GameInterface : undefined;
            var p = null;
            if (GI && typeof GI.gameStart === 'function') {
                try { p = GI.gameStart(); } catch(_) { p = null; }
            } else if (GI && typeof GI.startGame === 'function') {
                try { p = GI.startGame(); } catch(_) { p = null; }
            }
            if (p && typeof p.then === 'function') {
                try { await p; } catch(_) {}
            }
        } catch(_) {}
        // Продолжаем запуск уровня в C++
        try {
            if (typeof Module !== 'undefined' && typeof Module._ctrtt_on_portal_game_start_continue === 'function') {
                Module._ctrtt_on_portal_game_start_continue();
            }
        } catch(_) {}
    }
    window.__ctrtt_requestStartLevel = function(){
        // Не блокируем поток JS: запускаем асинхронно
        try { requestStartLevel(); } catch(_) { /* no-op */ }
    };
})();

function applyDeferredUntarIfPossible() {
    try {
        if (!Module.__cacheReadyFlag)
            return;
        if (Module.__LoadAssetsExtractionDone)
            return;
        if (loadAssetsTarBuffer && !Module.__loadAssetsPreRunApplied) {
            console.log('[LoadAssets][Release] applying deferred untar');
            untarToFS(loadAssetsTarBuffer);
        }
    } catch (e) {
        console.warn('[LoadAssets][Release] applyDeferredUntarIfPossible error', e);
    }
}

function startLoadAssetsFetch(blocking) {
    if (!blocking && !Module.__cacheReadyFlag) {
        Module.__LoadAssetsLateFetchRequested = true;
        console.log('[LoadAssets][Release] startLoadAssetsFetch: defer (cache not ready)');
        return;
    }
    if (checkDoneFlagAndSet()) {
        console.log('[LoadAssets][Release] startLoadAssetsFetch: done flag -> skip');
        return;
    }
    if (Module.__loadAssetsPreloadStarted || self.__LOADASSETS_FETCH_IN_PROGRESS)
        return;
    Module.__loadAssetsPreloadStarted = true;
    if (blocking)
        Module.__LoadAssetsNeedBlocking = true;
    else
        Module.__LoadAssetsNeedBlocking = Module.__LoadAssetsNeedBlocking || false;
    if (blocking && typeof addRunDependency === 'function')
        addRunDependency('loadassets');
    self.__LOADASSETS_FETCH_IN_PROGRESS = true;
    console.log('[LoadAssets][Release] fetch start (blocking=' + (!!blocking) + ')');
    
    var BOOT = (typeof window !== 'undefined' && window.__CTR_BOOT_NAMES__) ? window.__CTR_BOOT_NAMES__ : { loadassets:'loadassets.tar.br' };
    var NO_BR = !!(typeof window !== 'undefined' && window.__CTR_NO_BR__);
    fetch(BOOT.loadassets, {
        cache: 'default'
    })
    .then(async r => {
        if (!r.ok)
            throw new Error('HTTP ' + r.status);
        
        // РџРѕР»СѓС‡Р°РµРј СЂР°Р·РјРµСЂ РґР»СЏ РїСЂРѕРіСЂРµСЃСЃР°
        const contentLength = r.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        let loaded = 0;
        const reader = r.body.getReader();
        const chunks = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            
            // РћР±РЅРѕРІР»СЏРµРј РїСЂРѕРіСЂРµСЃСЃ Р·Р°РіСЂСѓР·РєРё (50% РѕС‚ РѕР±С‰РµРіРѕ РїСЂРѕРіСЂРµСЃСЃР°)
            if (total > 0) {
                const downloadPercent = Math.floor((loaded / total) * 50);
                window.__ctrtt_updateProgress('loadassets', downloadPercent);
            }
        }
        
        const bytes = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.length;
        }
        
        return bytes.buffer;
    })
    .then(buf => {
        if (!NO_BR) {
            window.__ctrtt_updateProgress('loadassets', 75);
            loadAssetsTarBuffer = BrotliDecode(new Uint8Array(buf)).buffer;
        } else {
            // В Debug tar не сжат — используем как есть
            loadAssetsTarBuffer = buf;
        }
        window.__ctrtt_updateProgress('loadassets', 100);
        console.log('[LoadAssets] downloaded ' + BOOT.loadassets);
        applyDeferredUntarIfPossible();
    })
    .catch(e => {
        console.warn('[LoadAssets][Release] fetch failed', e);
        if (blocking && typeof removeRunDependency === 'function')
            removeRunDependency('loadassets');
    })
    .finally(() => {
        self.__LOADASSETS_FETCH_IN_PROGRESS = false;
    });
}

function ensureLateLoadAssets() {
    try {
        if (!Module.__cacheReadyFlag) {
            Module.__LoadAssetsLateFetchRequested = true;
            console.log('[LoadAssets][Release] ensureLateLoadAssets: defer (cache)');
            return;
        }
        if (checkDoneFlagAndSet())
            return;
        if (Module.__LoadAssetsExtractionDone)
            return;
        if (!Module.__loadAssetsPreRunApplied) {
            if (!Module.__loadAssetsPreloadStarted && !self.__LOADASSETS_FETCH_IN_PROGRESS) {
                console.log('[LoadAssets][Release] ensureLateLoadAssets: starting late fetch');
                startLoadAssetsFetch(false);
            } else if (loadAssetsTarBuffer) {
                applyDeferredUntarIfPossible();
            }
        }
    } catch (e) {
        console.warn('[LoadAssets][Release] ensureLateLoadAssets error', e);
    }
}

(function () {
    function receiveLate(e) {
        if (!e || !e.data)
            return;
        if (e.data === 'TUTORIAL_COMPLETED') {
            try {
                localStorage.setItem('tutorialCompleted', '1');
            } catch (_) {}
            startLoadAssetsFetch(false);
        }
    }
    if (typeof window !== 'undefined')
        window.addEventListener('message', receiveLate);
})();

(function () {
    const s = document.createElement('script');
    s.src = 'ctr-tt.js';
    document.body.appendChild(s);
})();

var Module = {
    preRun: [],
    postRun: [],
    print: function () {
        console.log([].slice.call(arguments).join(' '));
    },
    printErr: function () {
        console.error([].slice.call(arguments).join(' '));
    },
    canvas: (function () {
        var c = document.getElementById('canvas');
        c.addEventListener('webglcontextlost', function (e) {
            alert('FIXME: WebGL context lost, reload the page');
            e.preventDefault();
        }, false);
        return c;
    })(),
    setStatus: function () {},
    monitorRunDependencies: function () {},
    locateFile: function (name, dir) {
        var BOOT = (typeof window !== 'undefined' && window.__CTR_BOOT_NAMES__) ? window.__CTR_BOOT_NAMES__ : { wasm:'ctrtt.wasm.br', data:'ctrtt.data.br' };
        return name.endsWith('.wasm') ? (dir + BOOT.wasm) : name.endsWith('.data') ? (dir + BOOT.data) : (dir + name);
    },
    getPreloadedPackage: function (pkgName, pkgSize) {
        return null;
    }
};

if ("function" == typeof WebAssembly.instantiateStreaming) {
    const orig = WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming = async function (respPromise, importObj) {
        var NO_BR = !!(typeof window !== 'undefined' && window.__CTR_NO_BR__);
        var BOOT = (typeof window !== 'undefined' && window.__CTR_BOOT_NAMES__) ? window.__CTR_BOOT_NAMES__ : { wasm:'ctrtt.wasm.br' };
        if (!NO_BR) {
            let resp = await respPromise;
            if (resp && resp.headers && resp.headers.get && resp.headers.get('content-encoding') === 'br') {
                return orig(Promise.resolve(resp), importObj);
            }
        }
        const buf = await fetchAndMaybeDecompress(BOOT.wasm);
        return WebAssembly.instantiate(buf, importObj);
    };
}
if ("function" == typeof Module.instantiateWasm) {
    Module.instantiateWasm;
    Module.instantiateWasm = async function (imports, onSuccess) {
        var BOOT = (typeof window !== 'undefined' && window.__CTR_BOOT_NAMES__) ? window.__CTR_BOOT_NAMES__ : { wasm:'ctrtt.wasm.br' };
        let a = await fetchAndMaybeDecompress(BOOT.wasm);
        return WebAssembly.instantiate(a, imports).then((r => onSuccess(r.instance, r.module))), {};
    };
}
window.onerror = function (e) {
    console.log('onerror: ' + (e && e.message ? e.message : e));
};
Module.instantiateWasm = function (imports, successCallback) {
    var BOOT = (typeof window !== 'undefined' && window.__CTR_BOOT_NAMES__) ? window.__CTR_BOOT_NAMES__ : { wasm:'ctrtt.wasm.br' };
    fetchAndMaybeDecompress(BOOT.wasm)
    .then(decoded => WebAssembly.instantiate(decoded, imports))
    .then(result => successCallback(result.instance, result.module))
    .catch(e => console.error('WASM instantiation failed:', e));
    return {}; // required dummy return
};