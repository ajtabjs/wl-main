var Module = typeof Module != "undefined" ? Module : {};
var ENVIRONMENT_IS_WEB = typeof window == "object";
var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
if (ENVIRONMENT_IS_NODE) {}
Module["expectedDataFileDownloads"] ??= 0;
Module["expectedDataFileDownloads"]++;
(() => {
    var isPthread = typeof ENVIRONMENT_IS_PTHREAD != "undefined" && ENVIRONMENT_IS_PTHREAD;
    var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER != "undefined" && ENVIRONMENT_IS_WASM_WORKER;
    if (isPthread || isWasmWorker) return;
    var isNode = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";

    function loadPackage(metadata) {
        var PACKAGE_PATH = "";
        if (typeof window === "object") {
            PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/")
        } else if (typeof process === "undefined" && typeof location !== "undefined") {
            PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/")
        }
        var PACKAGE_NAME = "Release/ctr-tt.data";
        var REMOTE_PACKAGE_BASE = "ctr-tt.data";
        var REMOTE_PACKAGE_NAME = Module["locateFile"] ? Module["locateFile"](REMOTE_PACKAGE_BASE, "") : REMOTE_PACKAGE_BASE;
        var REMOTE_PACKAGE_SIZE = metadata["remote_package_size"];

        // load files directly from /assets/
        if (metadata && Array.isArray(metadata["files"])) {
            function runWithFS(Module) {
                Module["FS_createPath"]("/", "assets", true, true);
                Module["FS_createPath"]("/assets", "maps", true, true);

                function mkdirp(dirPath) {
                    if (!dirPath || dirPath === "/") return;
                    var parts = dirPath.split("/");
                    var cur = "/";
                    for (var i = 1; i < parts.length; i++) {
                        var part = parts[i];
                        if (!part) continue;
                        Module["FS_createPath"](cur, part, true, true);
                        cur = (cur === "/" ? "" : cur) + "/" + part;
                    }
                }

                var files = metadata["files"];
                for (var i = 0; i < files.length; ++i) {
                    var full = files[i]["filename"];
                    if (!full || typeof full !== "string") continue;

                    var lastSlash = full.lastIndexOf("/");
                    var parent = lastSlash > 0 ? full.substring(0, lastSlash) : "/";
                    var name = full.substring(lastSlash + 1);
                    if (!name) continue;

                    mkdirp(parent);

                    var url = full[0] === "/" ? full.substring(1) : full;

                    // If a custom level was provided via index.html (?data=...), inject it here
                    // instead of preloading the original XML from /assets/.
                    try {
                        if (typeof window !== "undefined" &&
                            window.__CUSTOM_LEVEL_XML__ &&
                            (full === "/assets/maps/1_1.xml" || full === "assets/maps/1_1.xml")) {
                            var xmlStr = String(window.__CUSTOM_LEVEL_XML__);
                            var bytes;
                            if (typeof fflate !== "undefined" && fflate.strToU8) {
                                bytes = fflate.strToU8(xmlStr);
                            } else if (typeof TextEncoder !== "undefined") {
                                bytes = new TextEncoder().encode(xmlStr);
                            } else {
                                bytes = [];
                                for (var j = 0; j < xmlStr.length; j++) {
                                    bytes.push(xmlStr.charCodeAt(j) & 0xff);
                                }
                            }
                            Module["FS_createDataFile"](parent, name, bytes, true, true, true);
                            continue;
                        }
                    } catch (_) { }

                    Module["FS_createPreloadedFile"](parent, name, url, true, true);
                }
            }

            if (Module["calledRun"]) {
                runWithFS(Module);
            } else {
                (Module["preRun"] ??= []).push(runWithFS);
            }
            return;
        }

        function fetchRemotePackage(packageName, packageSize, callback, errback) {
            if (isNode) {
                require("fs").readFile(packageName, (err, contents) => {
                    if (err) {
                        errback(err)
                    } else {
                        callback(contents.buffer)
                    }
                });
                return
            }
            Module["dataFileDownloads"] ??= {};
            fetch(packageName).catch(cause => Promise.reject(new Error(`Network Error: ${packageName}`, {
                cause
            }))).then(response => {
                if (!response.ok) {
                    return Promise.reject(new Error(`${response.status}: ${response.url}`))
                }
                if (!response.body && response.arrayBuffer) {
                    return response.arrayBuffer().then(callback)
                }
                const reader = response.body.getReader();
                const iterate = () => reader.read().then(handleChunk).catch(cause => Promise.reject(new Error(`Unexpected error while handling : ${response.url} ${cause}`, {
                    cause
                })));
                const chunks = [];
                const headers = response.headers;
                const total = Number(headers.get("Content-Length") ?? packageSize);
                let loaded = 0;
                const handleChunk = ({
                    done,
                    value
                }) => {
                    if (!done) {
                        chunks.push(value);
                        loaded += value.length;
                        Module["dataFileDownloads"][packageName] = {
                            loaded,
                            total
                        };
                        let totalLoaded = 0;
                        let totalSize = 0;
                        for (const download of Object.values(Module["dataFileDownloads"])) {
                            totalLoaded += download.loaded;
                            totalSize += download.total
                        }
                        Module["setStatus"]?.(`Downloading data... (${totalLoaded}/${totalSize})`);
                        return iterate()
                    } else {
                        const packageData = new Uint8Array(chunks.map(c => c.length).reduce((a, b) => a + b, 0));
                        let offset = 0;
                        for (const chunk of chunks) {
                            packageData.set(chunk, offset);
                            offset += chunk.length
                        }
                        callback(packageData.buffer)
                    }
                };
                Module["setStatus"]?.("Downloading data...");
                return iterate()
            })
        }

        function handleError(error) {
            console.error("package error:", error)
        }
        var fetchedCallback = null;
        var fetched = Module["getPreloadedPackage"] ? Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;
        if (!fetched) fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, data => {
            if (fetchedCallback) {
                fetchedCallback(data);
                fetchedCallback = null
            } else {
                fetched = data
            }
        }, handleError);

        function runWithFS(Module) {
            function assert(check, msg) {
                if (!check) throw msg + (new Error).stack
            }
            Module["FS_createPath"]("/", "assets", true, true);
            Module["FS_createPath"]("/assets", "maps", true, true);

            function DataRequest(start, end, audio) {
                this.start = start;
                this.end = end;
                this.audio = audio
            }
            DataRequest.prototype = {
                requests: {},
                open: function(mode, name) {
                    this.name = name;
                    this.requests[name] = this;
                    Module["addRunDependency"](`fp ${this.name}`)
                },
                send: function() {},
                onload: function() {
                    var byteArray = this.byteArray.subarray(this.start, this.end);
                    this.finish(byteArray)
                },
                finish: function(byteArray) {
                    var that = this;
                    Module["FS_createDataFile"](this.name, null, byteArray, true, true, true);
                    Module["removeRunDependency"](`fp ${that.name}`);
                    this.requests[this.name] = null
                }
            };
            var files = metadata["files"];
            for (var i = 0; i < files.length; ++i) {
                new DataRequest(files[i]["start"], files[i]["end"], files[i]["audio"] || 0).open("GET", files[i]["filename"])
            }

            function processPackageData(arrayBuffer) {
                assert(arrayBuffer, "Loading data file failed.");
                assert(arrayBuffer.constructor.name === ArrayBuffer.name, "bad input to processPackageData");
                var byteArray = new Uint8Array(arrayBuffer);
                DataRequest.prototype.byteArray = byteArray;
                var files = metadata["files"];
                for (var i = 0; i < files.length; ++i) {
                    DataRequest.prototype.requests[files[i].filename].onload()
                }
                Module["removeRunDependency"]("datafile_Release/ctr-tt.data")
            }
            Module["addRunDependency"]("datafile_Release/ctr-tt.data");
            Module["preloadResults"] ??= {};
            Module["preloadResults"][PACKAGE_NAME] = {
                fromCache: false
            };
            if (fetched) {
                processPackageData(fetched);
                fetched = null
            } else {
                fetchedCallback = processPackageData
            }
        }
        if (Module["calledRun"]) {
            runWithFS(Module)
        } else {
            (Module["preRun"] ??= []).push(runWithFS)
        }
    }
    loadPackage({
        files: [{
            filename: "/assets/CutTheRopeTimetravel_logo_russ_512.png",
            start: 0,
            end: 51202
        }, {
            filename: "/assets/FamobiLogo.png",
            start: 51202,
            end: 53441
        }, {
            filename: "/assets/ZeptoLabLogo.png",
            start: 53441,
            end: 56646
        }, {
            filename: "/assets/assets_640_960.png",
            start: 56646,
            end: 191817
        }, {
            filename: "/assets/bgr_china_640_960.jpeg",
            start: 191817,
            end: 319986
        }, {
            filename: "/assets/bgr_dinosaurs_640_960.jpeg",
            start: 319986,
            end: 438674
        }, {
            filename: "/assets/bgr_disco_640_960.jpeg",
            start: 438674,
            end: 573944
        }, {
            filename: "/assets/bgr_egypt_640_960.jpeg",
            start: 573944,
            end: 688528
        }, {
            filename: "/assets/bgr_future_640_960.jpeg",
            start: 688528,
            end: 855762
        }, {
            filename: "/assets/bgr_greece_640_960.jpeg",
            start: 855762,
            end: 987266
        }, {
            filename: "/assets/bgr_industrial_640_960.jpeg",
            start: 987266,
            end: 1090968
        }, {
            filename: "/assets/bgr_medieval_640_960.jpeg",
            start: 1090968,
            end: 1221059
        }, {
            filename: "/assets/bgr_paradox_640_960.jpeg",
            start: 1221059,
            end: 1345905
        }, {
            filename: "/assets/bgr_pirate_640_960.jpeg",
            start: 1345905,
            end: 1478897
        }, {
            filename: "/assets/bgr_renaissance_640_960.jpeg",
            start: 1478897,
            end: 1610111
        }, {
            filename: "/assets/bgr_western_640_960.jpeg",
            start: 1610111,
            end: 1742349
        }, {
            filename: "/assets/body_assets_hist_640_960.png",
            start: 1742349,
            end: 1803379
        }, {
            filename: "/assets/candies_640_960.png",
            start: 1803379,
            end: 1869758
        }, {
            filename: "/assets/candy_radiosignal_640_960.png",
            start: 1869758,
            end: 1877422
        }, {
            filename: "/assets/candy_radiosignal_yellow.pb",
            start: 1877422,
            end: 1880364
        }, {
            filename: "/assets/cawologo.png",
            start: 1880364,
            end: 1888317
        }, {
            filename: "/assets/char_support_china_640_960.png",
            start: 1888317,
            end: 1909588
        }, {
            filename: "/assets/char_support_dinosaurs_640_960.png",
            start: 1909588,
            end: 1926274
        }, {
            filename: "/assets/char_support_disco_640_960.png",
            start: 1926274,
            end: 1939361
        }, {
            filename: "/assets/char_support_egypt_640_960.png",
            start: 1939361,
            end: 1954236
        }, {
            filename: "/assets/char_support_flying_future_640_960.png",
            start: 1954236,
            end: 1987338
        }, {
            filename: "/assets/char_support_future_640_960.png",
            start: 1987338,
            end: 1999143
        }, {
            filename: "/assets/char_support_industrial_640_960.png",
            start: 1999143,
            end: 2019671
        }, {
            filename: "/assets/char_support_medieval_640_960.png",
            start: 2019671,
            end: 2036086
        }, {
            filename: "/assets/char_support_paradox_640_960.png",
            start: 2036086,
            end: 2051502
        }, {
            filename: "/assets/char_support_pirate_640_960.png",
            start: 2051502,
            end: 2064103
        }, {
            filename: "/assets/char_support_renaissance_640_960.png",
            start: 2064103,
            end: 2080869
        }, {
            filename: "/assets/char_support_shadow_640_960.png",
            start: 2080869,
            end: 2081611
        }, {
            filename: "/assets/char_support_western_640_960.png",
            start: 2081611,
            end: 2096770
        }, {
            filename: "/assets/char_support_yellow.pb",
            start: 2096770,
            end: 2100759
        }, {
            filename: "/assets/chest_640_960.png",
            start: 2100759,
            end: 2145073
        }, {
            filename: "/assets/chest_light_spot_640_960.png",
            start: 2145073,
            end: 2150584
        }, {
            filename: "/assets/close_ad_button_640_960.png",
            start: 2150584,
            end: 2154191
        }, {
            filename: "/assets/daily_gift.pb",
            start: 2154191,
            end: 2182454
        }, {
            filename: "/assets/daily_gift_640_960.png",
            start: 2182454,
            end: 2207187
        }, {
            filename: "/assets/element_640_960.png",
            start: 2207187,
            end: 2238708
        }, {
            filename: "/assets/exp_chain_2_640_960.png",
            start: 2238708,
            end: 2239213
        }, {
            filename: "/assets/exp_chain_640_960.png",
            start: 2239213,
            end: 2240119
        }, {
            filename: "/assets/explosion.pb",
            start: 2240119,
            end: 2251584
        }, {
            filename: "/assets/explosion_640_960.png",
            start: 2251584,
            end: 2256568
        }, {
            filename: "/assets/font_big_640_960.png",
            start: 2256568,
            end: 2337122
        }, {
            filename: "/assets/font_numbers_big_640_960.png",
            start: 2337122,
            end: 2338779
        }, {
            filename: "/assets/font_small_640_960.png",
            start: 2338779,
            end: 2364704
        }, {
            filename: "/assets/future_pack.pb",
            start: 2364704,
            end: 2372074
        }, {
            filename: "/assets/fx_bubbles.pb",
            start: 2372074,
            end: 2380072
        }, {
            filename: "/assets/fx_bubbles_640_960.png",
            start: 2380072,
            end: 2380842
        }, {
            filename: "/assets/fx_cut_chain.pb",
            start: 2380842,
            end: 2381780
        }, {
            filename: "/assets/fx_cut_chain_640_960.png",
            start: 2381780,
            end: 2389968
        }, {
            filename: "/assets/fx_flash.pb",
            start: 2389968,
            end: 2403032
        }, {
            filename: "/assets/fx_flash_640_960.png",
            start: 2403032,
            end: 2457595
        }, {
            filename: "/assets/fx_glasses_apear.pb",
            start: 2457595,
            end: 2458386
        }, {
            filename: "/assets/fx_magnet.pb",
            start: 2458386,
            end: 2460613
        }, {
            filename: "/assets/fx_menu_levels.pb",
            start: 2460613,
            end: 2468521
        }, {
            filename: "/assets/fx_pack_selection_icon.pb",
            start: 2468521,
            end: 2469286
        }, {
            filename: "/assets/fx_pause_android.pb",
            start: 2469286,
            end: 2470038
        }, {
            filename: "/assets/fx_pause_android_640_960.png",
            start: 2470038,
            end: 2471553
        }, {
            filename: "/assets/fx_restart.pb",
            start: 2471553,
            end: 2476010
        }, {
            filename: "/assets/fx_restart_640_960.png",
            start: 2476010,
            end: 2526248
        }, {
            filename: "/assets/fx_shield_trigger.pb",
            start: 2526248,
            end: 2534360
        }, {
            filename: "/assets/fx_sleep.pb",
            start: 2534360,
            end: 2536408
        }, {
            filename: "/assets/fx_sleep_640_960.png",
            start: 2536408,
            end: 2536931
        }, {
            filename: "/assets/fx_snowflake_640_960.png",
            start: 2536931,
            end: 2545216
        }, {
            filename: "/assets/fx_snowflake_shine.pb",
            start: 2545216,
            end: 2549236
        }, {
            filename: "/assets/fx_sp_active.pb",
            start: 2549236,
            end: 2553252
        }, {
            filename: "/assets/fx_sp_popup.pb",
            start: 2553252,
            end: 2557404
        }, {
            filename: "/assets/fx_spiral.pb",
            start: 2557404,
            end: 2558949
        }, {
            filename: "/assets/fx_spiral_640_960.png",
            start: 2558949,
            end: 2580561
        }, {
            filename: "/assets/fx_trigger_candy.pb",
            start: 2580561,
            end: 2580986
        }, {
            filename: "/assets/gradients_640_960.png",
            start: 2580986,
            end: 2595585
        }, {
            filename: "/assets/hint_firefly.pb",
            start: 2595585,
            end: 2660138
        }, {
            filename: "/assets/hint_firefly_640_960.png",
            start: 2660138,
            end: 2666013
        }, {
            filename: "/assets/hint_popup_640_960.jpeg",
            start: 2666013,
            end: 2881881
        }, {
            filename: "/assets/hint_popup_640_960_alpha.png",
            start: 2881881,
            end: 2900037
        }, {
            filename: "/assets/hud.pb",
            start: 2900037,
            end: 2902201
        }, {
            filename: "/assets/hud_640_960.png",
            start: 2902201,
            end: 2916511
        }, {
            filename: "/assets/hud_buttons_sp_640_960.png",
            start: 2916511,
            end: 2929269
        }, {
            filename: "/assets/loaderbar_empty_640_960.png",
            start: 2929269,
            end: 2931430
        }, {
            filename: "/assets/loaderbar_full_640_960.png",
            start: 2931430,
            end: 2936239
        }, {
            filename: "/assets/logo_640_960.png",
            start: 2936239,
            end: 2992437
        }, {
            filename: "/assets/logo_ani.pb",
            start: 2992437,
            end: 3006065
        }, {
            filename: "/assets/maps/10_1.xml",
            start: 3006065,
            end: 3010504
        }, {
            filename: "/assets/maps/10_10.xml",
            start: 3010504,
            end: 3012058
        }, {
            filename: "/assets/maps/10_11.xml",
            start: 3012058,
            end: 3013979
        }, {
            filename: "/assets/maps/10_12.xml",
            start: 3013979,
            end: 3016237
        }, {
            filename: "/assets/maps/10_13.xml",
            start: 3016237,
            end: 3018081
        }, {
            filename: "/assets/maps/10_14.xml",
            start: 3018081,
            end: 3019951
        }, {
            filename: "/assets/maps/10_15.xml",
            start: 3019951,
            end: 3022474
        }, {
            filename: "/assets/maps/10_2.xml",
            start: 3022474,
            end: 3024710
        }, {
            filename: "/assets/maps/10_3.xml",
            start: 3024710,
            end: 3026734
        }, {
            filename: "/assets/maps/10_4.xml",
            start: 3026734,
            end: 3028685
        }, {
            filename: "/assets/maps/10_5.xml",
            start: 3028685,
            end: 3031520
        }, {
            filename: "/assets/maps/10_6.xml",
            start: 3031520,
            end: 3033598
        }, {
            filename: "/assets/maps/10_7.xml",
            start: 3033598,
            end: 3035530
        }, {
            filename: "/assets/maps/10_8.xml",
            start: 3035530,
            end: 3037637
        }, {
            filename: "/assets/maps/10_9.xml",
            start: 3037637,
            end: 3039485
        }, {
            filename: "/assets/maps/11_1.xml",
            start: 3039485,
            end: 3044220
        }, {
            filename: "/assets/maps/11_10.xml",
            start: 3044220,
            end: 3045270
        }, {
            filename: "/assets/maps/11_11.xml",
            start: 3045270,
            end: 3047604
        }, {
            filename: "/assets/maps/11_12.xml",
            start: 3047604,
            end: 3050175
        }, {
            filename: "/assets/maps/11_13.xml",
            start: 3050175,
            end: 3052959
        }, {
            filename: "/assets/maps/11_14.xml",
            start: 3052959,
            end: 3055057
        }, {
            filename: "/assets/maps/11_15.xml",
            start: 3055057,
            end: 3056827
        }, {
            filename: "/assets/maps/11_2.xml",
            start: 3056827,
            end: 3059490
        }, {
            filename: "/assets/maps/11_3.xml",
            start: 3059490,
            end: 3061650
        }, {
            filename: "/assets/maps/11_4.xml",
            start: 3061650,
            end: 3063921
        }, {
            filename: "/assets/maps/11_5.xml",
            start: 3063921,
            end: 3066014
        }, {
            filename: "/assets/maps/11_6.xml",
            start: 3066014,
            end: 3068027
        }, {
            filename: "/assets/maps/11_7.xml",
            start: 3068027,
            end: 3070655
        }, {
            filename: "/assets/maps/11_8.xml",
            start: 3070655,
            end: 3072612
        }, {
            filename: "/assets/maps/11_9.xml",
            start: 3072612,
            end: 3074882
        }, {
            filename: "/assets/maps/12_1.xml",
            start: 3074882,
            end: 3076879
        }, {
            filename: "/assets/maps/12_10.xml",
            start: 3076879,
            end: 3078755
        }, {
            filename: "/assets/maps/12_11.xml",
            start: 3078755,
            end: 3080915
        }, {
            filename: "/assets/maps/12_12.xml",
            start: 3080915,
            end: 3083191
        }, {
            filename: "/assets/maps/12_13.xml",
            start: 3083191,
            end: 3085480
        }, {
            filename: "/assets/maps/12_14.xml",
            start: 3085480,
            end: 3088758
        }, {
            filename: "/assets/maps/12_15.xml",
            start: 3088758,
            end: 3090373
        }, {
            filename: "/assets/maps/12_16.xml",
            start: 3090373,
            end: 3091760
        }, {
            filename: "/assets/maps/12_17.xml",
            start: 3091760,
            end: 3093525
        }, {
            filename: "/assets/maps/12_18.xml",
            start: 3093525,
            end: 3094660
        }, {
            filename: "/assets/maps/12_19.xml",
            start: 3094660,
            end: 3097054
        }, {
            filename: "/assets/maps/12_2.xml",
            start: 3097054,
            end: 3099567
        }, {
            filename: "/assets/maps/12_20.xml",
            start: 3099567,
            end: 3101605
        }, {
            filename: "/assets/maps/12_3.xml",
            start: 3101605,
            end: 3104524
        }, {
            filename: "/assets/maps/12_4.xml",
            start: 3104524,
            end: 3108363
        }, {
            filename: "/assets/maps/12_5.xml",
            start: 3108363,
            end: 3112560
        }, {
            filename: "/assets/maps/12_6.xml",
            start: 3112560,
            end: 3113846
        }, {
            filename: "/assets/maps/12_7.xml",
            start: 3113846,
            end: 3116208
        }, {
            filename: "/assets/maps/12_8.xml",
            start: 3116208,
            end: 3117794
        }, {
            filename: "/assets/maps/12_9.xml",
            start: 3117794,
            end: 3120030
        }, {
            filename: "/assets/maps/1_1.xml",
            start: 3120030,
            end: 3130473
        }, {
            filename: "/assets/maps/1_10.xml",
            start: 3130473,
            end: 3135531
        }, {
            filename: "/assets/maps/1_11.xml",
            start: 3135531,
            end: 3141010
        }, {
            filename: "/assets/maps/1_12.xml",
            start: 3141010,
            end: 3143332
        }, {
            filename: "/assets/maps/1_13.xml",
            start: 3143332,
            end: 3146730
        }, {
            filename: "/assets/maps/1_14.xml",
            start: 3146730,
            end: 3152147
        }, {
            filename: "/assets/maps/1_15.xml",
            start: 3152147,
            end: 3154929
        }, {
            filename: "/assets/maps/1_2.xml",
            start: 3154929,
            end: 3156304
        }, {
            filename: "/assets/maps/1_3.xml",
            start: 3156304,
            end: 3158119
        }, {
            filename: "/assets/maps/1_4.xml",
            start: 3158119,
            end: 3163203
        }, {
            filename: "/assets/maps/1_5.xml",
            start: 3163203,
            end: 3170803
        }, {
            filename: "/assets/maps/1_6.xml",
            start: 3170803,
            end: 3172672
        }, {
            filename: "/assets/maps/1_7.xml",
            start: 3172672,
            end: 3177019
        }, {
            filename: "/assets/maps/1_8.xml",
            start: 3177019,
            end: 3181984
        }, {
            filename: "/assets/maps/1_9.xml",
            start: 3181984,
            end: 3184832
        }, {
            filename: "/assets/maps/2_1.xml",
            start: 3184832,
            end: 3194268
        }, {
            filename: "/assets/maps/2_10.xml",
            start: 3194268,
            end: 3196357
        }, {
            filename: "/assets/maps/2_11.xml",
            start: 3196357,
            end: 3200928
        }, {
            filename: "/assets/maps/2_12.xml",
            start: 3200928,
            end: 3202370
        }, {
            filename: "/assets/maps/2_13.xml",
            start: 3202370,
            end: 3203709
        }, {
            filename: "/assets/maps/2_14.xml",
            start: 3203709,
            end: 3205590
        }, {
            filename: "/assets/maps/2_15.xml",
            start: 3205590,
            end: 3208359
        }, {
            filename: "/assets/maps/2_2.xml",
            start: 3208359,
            end: 3212934
        }, {
            filename: "/assets/maps/2_3.xml",
            start: 3212934,
            end: 3215846
        }, {
            filename: "/assets/maps/2_4.xml",
            start: 3215846,
            end: 3217737
        }, {
            filename: "/assets/maps/2_5.xml",
            start: 3217737,
            end: 3219895
        }, {
            filename: "/assets/maps/2_6.xml",
            start: 3219895,
            end: 3223950
        }, {
            filename: "/assets/maps/2_7.xml",
            start: 3223950,
            end: 3225717
        }, {
            filename: "/assets/maps/2_8.xml",
            start: 3225717,
            end: 3226966
        }, {
            filename: "/assets/maps/2_9.xml",
            start: 3226966,
            end: 3228461
        }, {
            filename: "/assets/maps/3_1.xml",
            start: 3228461,
            end: 3232694
        }, {
            filename: "/assets/maps/3_10.xml",
            start: 3232694,
            end: 3234284
        }, {
            filename: "/assets/maps/3_11.xml",
            start: 3234284,
            end: 3236816
        }, {
            filename: "/assets/maps/3_12.xml",
            start: 3236816,
            end: 3239436
        }, {
            filename: "/assets/maps/3_13.xml",
            start: 3239436,
            end: 3242247
        }, {
            filename: "/assets/maps/3_14.xml",
            start: 3242247,
            end: 3244404
        }, {
            filename: "/assets/maps/3_15.xml",
            start: 3244404,
            end: 3247625
        }, {
            filename: "/assets/maps/3_2.xml",
            start: 3247625,
            end: 3250221
        }, {
            filename: "/assets/maps/3_3.xml",
            start: 3250221,
            end: 3253086
        }, {
            filename: "/assets/maps/3_4.xml",
            start: 3253086,
            end: 3255404
        }, {
            filename: "/assets/maps/3_5.xml",
            start: 3255404,
            end: 3257396
        }, {
            filename: "/assets/maps/3_6.xml",
            start: 3257396,
            end: 3261720
        }, {
            filename: "/assets/maps/3_7.xml",
            start: 3261720,
            end: 3263543
        }, {
            filename: "/assets/maps/3_8.xml",
            start: 3263543,
            end: 3265185
        }, {
            filename: "/assets/maps/3_9.xml",
            start: 3265185,
            end: 3267230
        }, {
            filename: "/assets/maps/4_1.xml",
            start: 3267230,
            end: 3271149
        }, {
            filename: "/assets/maps/4_10.xml",
            start: 3271149,
            end: 3272973
        }, {
            filename: "/assets/maps/4_11.xml",
            start: 3272973,
            end: 3274175
        }, {
            filename: "/assets/maps/4_12.xml",
            start: 3274175,
            end: 3276286
        }, {
            filename: "/assets/maps/4_13.xml",
            start: 3276286,
            end: 3278865
        }, {
            filename: "/assets/maps/4_14.xml",
            start: 3278865,
            end: 3280337
        }, {
            filename: "/assets/maps/4_15.xml",
            start: 3280337,
            end: 3282135
        }, {
            filename: "/assets/maps/4_2.xml",
            start: 3282135,
            end: 3284243
        }, {
            filename: "/assets/maps/4_3.xml",
            start: 3284243,
            end: 3285649
        }, {
            filename: "/assets/maps/4_4.xml",
            start: 3285649,
            end: 3287173
        }, {
            filename: "/assets/maps/4_5.xml",
            start: 3287173,
            end: 3288543
        }, {
            filename: "/assets/maps/4_6.xml",
            start: 3288543,
            end: 3290104
        }, {
            filename: "/assets/maps/4_7.xml",
            start: 3290104,
            end: 3291361
        }, {
            filename: "/assets/maps/4_8.xml",
            start: 3291361,
            end: 3295299
        }, {
            filename: "/assets/maps/4_9.xml",
            start: 3295299,
            end: 3299268
        }, {
            filename: "/assets/maps/5_1.xml",
            start: 3299268,
            end: 3303967
        }, {
            filename: "/assets/maps/5_10.xml",
            start: 3303967,
            end: 3305532
        }, {
            filename: "/assets/maps/5_11.xml",
            start: 3305532,
            end: 3307625
        }, {
            filename: "/assets/maps/5_12.xml",
            start: 3307625,
            end: 3309278
        }, {
            filename: "/assets/maps/5_13.xml",
            start: 3309278,
            end: 3311757
        }, {
            filename: "/assets/maps/5_14.xml",
            start: 3311757,
            end: 3313926
        }, {
            filename: "/assets/maps/5_15.xml",
            start: 3313926,
            end: 3315582
        }, {
            filename: "/assets/maps/5_2.xml",
            start: 3315582,
            end: 3317359
        }, {
            filename: "/assets/maps/5_3.xml",
            start: 3317359,
            end: 3320027
        }, {
            filename: "/assets/maps/5_4.xml",
            start: 3320027,
            end: 3322227
        }, {
            filename: "/assets/maps/5_5.xml",
            start: 3322227,
            end: 3323776
        }, {
            filename: "/assets/maps/5_6.xml",
            start: 3323776,
            end: 3325415
        }, {
            filename: "/assets/maps/5_7.xml",
            start: 3325415,
            end: 3326878
        }, {
            filename: "/assets/maps/5_8.xml",
            start: 3326878,
            end: 3331171
        }, {
            filename: "/assets/maps/5_9.xml",
            start: 3331171,
            end: 3336165
        }, {
            filename: "/assets/maps/6_1.xml",
            start: 3336165,
            end: 3340822
        }, {
            filename: "/assets/maps/6_10.xml",
            start: 3340822,
            end: 3342616
        }, {
            filename: "/assets/maps/6_11.xml",
            start: 3342616,
            end: 3344388
        }, {
            filename: "/assets/maps/6_12.xml",
            start: 3344388,
            end: 3346571
        }, {
            filename: "/assets/maps/6_13.xml",
            start: 3346571,
            end: 3348361
        }, {
            filename: "/assets/maps/6_14.xml",
            start: 3348361,
            end: 3350920
        }, {
            filename: "/assets/maps/6_15.xml",
            start: 3350920,
            end: 3353845
        }, {
            filename: "/assets/maps/6_2.xml",
            start: 3353845,
            end: 3355568
        }, {
            filename: "/assets/maps/6_3.xml",
            start: 3355568,
            end: 3357212
        }, {
            filename: "/assets/maps/6_4.xml",
            start: 3357212,
            end: 3359105
        }, {
            filename: "/assets/maps/6_5.xml",
            start: 3359105,
            end: 3361255
        }, {
            filename: "/assets/maps/6_6.xml",
            start: 3361255,
            end: 3363220
        }, {
            filename: "/assets/maps/6_7.xml",
            start: 3363220,
            end: 3365288
        }, {
            filename: "/assets/maps/6_8.xml",
            start: 3365288,
            end: 3366344
        }, {
            filename: "/assets/maps/6_9.xml",
            start: 3366344,
            end: 3368401
        }, {
            filename: "/assets/maps/7_1.xml",
            start: 3368401,
            end: 3375466
        }, {
            filename: "/assets/maps/7_10.xml",
            start: 3375466,
            end: 3377359
        }, {
            filename: "/assets/maps/7_11.xml",
            start: 3377359,
            end: 3379323
        }, {
            filename: "/assets/maps/7_12.xml",
            start: 3379323,
            end: 3382116
        }, {
            filename: "/assets/maps/7_13.xml",
            start: 3382116,
            end: 3384482
        }, {
            filename: "/assets/maps/7_14.xml",
            start: 3384482,
            end: 3386603
        }, {
            filename: "/assets/maps/7_15.xml",
            start: 3386603,
            end: 3389289
        }, {
            filename: "/assets/maps/7_2.xml",
            start: 3389289,
            end: 3391138
        }, {
            filename: "/assets/maps/7_3.xml",
            start: 3391138,
            end: 3393466
        }, {
            filename: "/assets/maps/7_4.xml",
            start: 3393466,
            end: 3395957
        }, {
            filename: "/assets/maps/7_5.xml",
            start: 3395957,
            end: 3398083
        }, {
            filename: "/assets/maps/7_6.xml",
            start: 3398083,
            end: 3400788
        }, {
            filename: "/assets/maps/7_7.xml",
            start: 3400788,
            end: 3403140
        }, {
            filename: "/assets/maps/7_8.xml",
            start: 3403140,
            end: 3405752
        }, {
            filename: "/assets/maps/7_9.xml",
            start: 3405752,
            end: 3407921
        }, {
            filename: "/assets/maps/8_1.xml",
            start: 3407921,
            end: 3412215
        }, {
            filename: "/assets/maps/8_10.xml",
            start: 3412215,
            end: 3413777
        }, {
            filename: "/assets/maps/8_11.xml",
            start: 3413777,
            end: 3415774
        }, {
            filename: "/assets/maps/8_12.xml",
            start: 3415774,
            end: 3417463
        }, {
            filename: "/assets/maps/8_13.xml",
            start: 3417463,
            end: 3419245
        }, {
            filename: "/assets/maps/8_14.xml",
            start: 3419245,
            end: 3421450
        }, {
            filename: "/assets/maps/8_15.xml",
            start: 3421450,
            end: 3423664
        }, {
            filename: "/assets/maps/8_2.xml",
            start: 3423664,
            end: 3424966
        }, {
            filename: "/assets/maps/8_3.xml",
            start: 3424966,
            end: 3426625
        }, {
            filename: "/assets/maps/8_4.xml",
            start: 3426625,
            end: 3428335
        }, {
            filename: "/assets/maps/8_5.xml",
            start: 3428335,
            end: 3431027
        }, {
            filename: "/assets/maps/8_6.xml",
            start: 3431027,
            end: 3433134
        }, {
            filename: "/assets/maps/8_7.xml",
            start: 3433134,
            end: 3434395
        }, {
            filename: "/assets/maps/8_8.xml",
            start: 3434395,
            end: 3436562
        }, {
            filename: "/assets/maps/8_9.xml",
            start: 3436562,
            end: 3438755
        }, {
            filename: "/assets/maps/9_1.xml",
            start: 3438755,
            end: 3444106
        }, {
            filename: "/assets/maps/9_10.xml",
            start: 3444106,
            end: 3446481
        }, {
            filename: "/assets/maps/9_11.xml",
            start: 3446481,
            end: 3449322
        }, {
            filename: "/assets/maps/9_12.xml",
            start: 3449322,
            end: 3452094
        }, {
            filename: "/assets/maps/9_13.xml",
            start: 3452094,
            end: 3453585
        }, {
            filename: "/assets/maps/9_14.xml",
            start: 3453585,
            end: 3456084
        }, {
            filename: "/assets/maps/9_15.xml",
            start: 3456084,
            end: 3457558
        }, {
            filename: "/assets/maps/9_2.xml",
            start: 3457558,
            end: 3459241
        }, {
            filename: "/assets/maps/9_3.xml",
            start: 3459241,
            end: 3461080
        }, {
            filename: "/assets/maps/9_4.xml",
            start: 3461080,
            end: 3463670
        }, {
            filename: "/assets/maps/9_5.xml",
            start: 3463670,
            end: 3465662
        }, {
            filename: "/assets/maps/9_6.xml",
            start: 3465662,
            end: 3468603
        }, {
            filename: "/assets/maps/9_7.xml",
            start: 3468603,
            end: 3470179
        }, {
            filename: "/assets/maps/9_8.xml",
            start: 3470179,
            end: 3471399
        }, {
            filename: "/assets/maps/9_9.xml",
            start: 3471399,
            end: 3473598
        }, {
            filename: "/assets/maps/allmaps.xml",
            start: 3473598,
            end: 3478227
        }, {
            filename: "/assets/maps/hints.bin",
            start: 3478227,
            end: 4574516
        }, {
            filename: "/assets/maps/sortedlist.xml",
            start: 4574516,
            end: 4579411
        }, {
            filename: "/assets/mask_640_960.png",
            start: 4579411,
            end: 4586513
        }, {
            filename: "/assets/menu_agepopup_bgr_640_960.jpeg",
            start: 4586513,
            end: 4630565
        }, {
            filename: "/assets/menu_banner_640_960.png",
            start: 4630565,
            end: 4631508
        }, {
            filename: "/assets/menu_bgrs_640_960.png",
            start: 4631508,
            end: 4667373
        }, {
            filename: "/assets/menu_button_big_640_960.png",
            start: 4667373,
            end: 4714707
        }, {
            filename: "/assets/menu_button_small_640_960.png",
            start: 4714707,
            end: 4765240
        }, {
            filename: "/assets/menu_buttons_640_960.png",
            start: 4765240,
            end: 4798427
        }, {
            filename: "/assets/menu_daily_reward_640_960.png",
            start: 4798427,
            end: 4847935
        }, {
            filename: "/assets/menu_levels_640_960.png",
            start: 4847935,
            end: 4875090
        }, {
            filename: "/assets/menu_loading.pb",
            start: 4875090,
            end: 4938932
        }, {
            filename: "/assets/menu_loading_640_960.png",
            start: 4938932,
            end: 5000327
        }, {
            filename: "/assets/menu_main_640_960.png",
            start: 5000327,
            end: 5122678
        }, {
            filename: "/assets/menu_main_ani_640_960.png",
            start: 5122678,
            end: 5165181
        }, {
            filename: "/assets/menu_main_bgr_2_640_960.jpeg",
            start: 5165181,
            end: 5227389
        }, {
            filename: "/assets/menu_main_bgr_640_960.jpeg",
            start: 5227389,
            end: 5291430
        }, {
            filename: "/assets/menu_pack_selection_640_960.png",
            start: 5291430,
            end: 5373265
        }, {
            filename: "/assets/menu_pack_selection_icons_1_640_960.jpeg",
            start: 5373265,
            end: 5955569
        }, {
            filename: "/assets/menu_pack_selection_icons_1_640_960_alpha.png",
            start: 5955569,
            end: 5996827
        }, {
            filename: "/assets/menu_pack_selection_icons_2_640_960.jpeg",
            start: 5996827,
            end: 6303604
        }, {
            filename: "/assets/menu_pack_selection_icons_2_640_960_alpha.png",
            start: 6303604,
            end: 6317253
        }, {
            filename: "/assets/menu_pack_selection_icons_640_960.jpeg",
            start: 6317253,
            end: 7097625
        }, {
            filename: "/assets/menu_pack_selection_icons_640_960_alpha.png",
            start: 7097625,
            end: 7134541
        }, {
            filename: "/assets/menu_pack_selection_lock_ani.pb",
            start: 7134541,
            end: 7135996
        }, {
            filename: "/assets/menu_popup_640_960.png",
            start: 7135996,
            end: 7255087
        }, {
            filename: "/assets/menu_popup_achiev_640_960.png",
            start: 7255087,
            end: 7372130
        }, {
            filename: "/assets/menu_processing_ani_640_960.png",
            start: 7372130,
            end: 7374347
        }, {
            filename: "/assets/menu_settings_640_960.png",
            start: 7374347,
            end: 7403751
        }, {
            filename: "/assets/menu_shop_640_960.jpeg",
            start: 7403751,
            end: 7788033
        }, {
            filename: "/assets/menu_shop_640_960_alpha.png",
            start: 7788033,
            end: 7854050
        }, {
            filename: "/assets/menu_snowflakehunt_640_960.jpeg",
            start: 7854050,
            end: 8039129
        }, {
            filename: "/assets/menu_snowflakehunt_640_960_alpha.png",
            start: 8039129,
            end: 8046672
        }, {
            filename: "/assets/new_single_offer.pb",
            start: 8046672,
            end: 8065922
        }, {
            filename: "/assets/obj_axe_640_960.png",
            start: 8065922,
            end: 8069658
        }, {
            filename: "/assets/obj_blue_star_640_960.png",
            start: 8069658,
            end: 8087303
        }, {
            filename: "/assets/obj_bomb_640_960.png",
            start: 8087303,
            end: 8092441
        }, {
            filename: "/assets/obj_bouncer_01_640_960.png",
            start: 8092441,
            end: 8107727
        }, {
            filename: "/assets/obj_bouncer_02_640_960.png",
            start: 8107727,
            end: 8126276
        }, {
            filename: "/assets/obj_bubble_attached_640_960.png",
            start: 8126276,
            end: 8133039
        }, {
            filename: "/assets/obj_bubble_flight_640_960.png",
            start: 8133039,
            end: 8174360
        }, {
            filename: "/assets/obj_bubble_pop_640_960.png",
            start: 8174360,
            end: 8190927
        }, {
            filename: "/assets/obj_candy.pb",
            start: 8190927,
            end: 8204323
        }, {
            filename: "/assets/obj_candy_01_640_960.jpeg",
            start: 8204323,
            end: 8323434
        }, {
            filename: "/assets/obj_candy_01_640_960_alpha.png",
            start: 8323434,
            end: 8368357
        }, {
            filename: "/assets/obj_clock_640_960.png",
            start: 8368357,
            end: 8395506
        }, {
            filename: "/assets/obj_discoball_640_960.png",
            start: 8395506,
            end: 8434428
        }, {
            filename: "/assets/obj_door_trigger.pb",
            start: 8434428,
            end: 8445015
        }, {
            filename: "/assets/obj_door_trigger_640_960.png",
            start: 8445015,
            end: 8478556
        }, {
            filename: "/assets/obj_fan_640_960.png",
            start: 8478556,
            end: 8543705
        }, {
            filename: "/assets/obj_hook_01_640_960.png",
            start: 8543705,
            end: 8545862
        }, {
            filename: "/assets/obj_hook_03_640_960.png",
            start: 8545862,
            end: 8548658
        }, {
            filename: "/assets/obj_hook_auto_02_640_960.png",
            start: 8548658,
            end: 8552377
        }, {
            filename: "/assets/obj_hook_auto_640_960.png",
            start: 8552377,
            end: 8555865
        }, {
            filename: "/assets/obj_hook_movable_640_960.png",
            start: 8555865,
            end: 8563926
        }, {
            filename: "/assets/obj_lasso_640_960.png",
            start: 8563926,
            end: 8573412
        }, {
            filename: "/assets/obj_magnet_640_960.png",
            start: 8573412,
            end: 8591048
        }, {
            filename: "/assets/obj_pause_640_960.png",
            start: 8591048,
            end: 8610771
        }, {
            filename: "/assets/obj_pause_ani.pb",
            start: 8610771,
            end: 8614082
        }, {
            filename: "/assets/obj_pollen_640_960.png",
            start: 8614082,
            end: 8614491
        }, {
            filename: "/assets/obj_portal_640_960.png",
            start: 8614491,
            end: 8643228
        }, {
            filename: "/assets/obj_portal_hit.pb",
            start: 8643228,
            end: 8644145
        }, {
            filename: "/assets/obj_portal_spiral.pb",
            start: 8644145,
            end: 8644734
        }, {
            filename: "/assets/obj_pump_640_960.png",
            start: 8644734,
            end: 8668767
        }, {
            filename: "/assets/obj_rocket_640_960.png",
            start: 8668767,
            end: 8692580
        }, {
            filename: "/assets/obj_shield_trigger_640_960.png",
            start: 8692580,
            end: 8702630
        }, {
            filename: "/assets/obj_snail_640_960.png",
            start: 8702630,
            end: 8710125
        }, {
            filename: "/assets/obj_snowflake.pb",
            start: 8710125,
            end: 8718537
        }, {
            filename: "/assets/obj_snowflake_640_960.png",
            start: 8718537,
            end: 8725450
        }, {
            filename: "/assets/obj_spikes_01_640_960.png",
            start: 8725450,
            end: 8728706
        }, {
            filename: "/assets/obj_spikes_02_640_960.png",
            start: 8728706,
            end: 8732822
        }, {
            filename: "/assets/obj_spikes_03_640_960.png",
            start: 8732822,
            end: 8737666
        }, {
            filename: "/assets/obj_spikes_04_640_960.png",
            start: 8737666,
            end: 8742884
        }, {
            filename: "/assets/obj_star_disappear_640_960.jpeg",
            start: 8742884,
            end: 8882650
        }, {
            filename: "/assets/obj_star_disappear_640_960_alpha.png",
            start: 8882650,
            end: 8957332
        }, {
            filename: "/assets/obj_star_idle_640_960.png",
            start: 8957332,
            end: 9013305
        }, {
            filename: "/assets/object_1.pb",
            start: 9013305,
            end: 9013625
        }, {
            filename: "/assets/om_nom_caesar.pb",
            start: 9013625,
            end: 9184100
        }, {
            filename: "/assets/om_nom_cyborg.pb",
            start: 9184100,
            end: 9352430
        }, {
            filename: "/assets/om_nom_disco.pb",
            start: 9352430,
            end: 9526485
        }, {
            filename: "/assets/om_nom_emperor.pb",
            start: 9526485,
            end: 9746622
        }, {
            filename: "/assets/om_nom_inventor.pb",
            start: 9746622,
            end: 9937628
        }, {
            filename: "/assets/om_nom_new_year_hat.pb",
            start: 9937628,
            end: 10472382
        }, {
            filename: "/assets/om_nom_new_year_hat_640_960.png",
            start: 10472382,
            end: 10477750
        }, {
            filename: "/assets/om_nom_original.pb",
            start: 10477750,
            end: 10918822
        }, {
            filename: "/assets/om_nom_painter.pb",
            start: 10918822,
            end: 11132481
        }, {
            filename: "/assets/om_nom_pharaon.pb",
            start: 11132481,
            end: 11291030
        }, {
            filename: "/assets/om_nom_pirate.pb",
            start: 11291030,
            end: 11550693
        }, {
            filename: "/assets/om_nom_prehistoric.pb",
            start: 11550693,
            end: 11839908
        }, {
            filename: "/assets/om_nom_sherif.pb",
            start: 11839908,
            end: 12061575
        }, {
            filename: "/assets/om_nom_viking.pb",
            start: 12061575,
            end: 12207056
        }, {
            filename: "/assets/paradox_pack.pb",
            start: 12207056,
            end: 12268730
        }, {
            filename: "/assets/popup_lootbox_640_960.png",
            start: 12268730,
            end: 12341563
        }, {
            filename: "/assets/processing_assets_640_960.png",
            start: 12341563,
            end: 12342941
        }, {
            filename: "/assets/result_screen.pb",
            start: 12342941,
            end: 12455606
        }, {
            filename: "/assets/result_screen_640_960.jpeg",
            start: 12455606,
            end: 12843841
        }, {
            filename: "/assets/result_screen_640_960_alpha.png",
            start: 12843841,
            end: 12897764
        }, {
            filename: "/assets/result_screen_box_640_960.png",
            start: 12897764,
            end: 12921813
        }, {
            filename: "/assets/result_screen_hint_stars.pb",
            start: 12921813,
            end: 12929936
        }, {
            filename: "/assets/result_screen_hint_wing.pb",
            start: 12929936,
            end: 12936057
        }, {
            filename: "/assets/result_screen_stars.pb",
            start: 12936057,
            end: 12941095
        }, {
            filename: "/assets/result_screen_unlocked.pb",
            start: 12941095,
            end: 12943286
        }, {
            filename: "/assets/sp_popup_640_960.png",
            start: 12943286,
            end: 12973504
        }, {
            filename: "/assets/strings.xml",
            start: 12973504,
            end: 13228823
        }, {
            filename: "/assets/super_powers_640_960.png",
            start: 13228823,
            end: 13265542
        }, {
            filename: "/assets/tutorial_signs_640_960.png",
            start: 13265542,
            end: 13282798
        }, {
            filename: "/assets/water_tile_640_960.png",
            start: 13282798,
            end: 13295035
        }, {
            filename: "/assets/yt_palyer_empty.html",
            start: 13295035,
            end: 13320875
        }, {
            filename: "/assets/zepto_logo_640_960.png",
            start: 13320875,
            end: 13348351
        }, {
            filename: "/assets/zepto_splash.pb",
            start: 13348351,
            end: 13370319
        }],
        remote_package_size: 13370319
    })
})();
var moduleOverrides = {
    ...Module
};
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
    throw toThrow
};
var scriptDirectory = "";

function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
}
var readAsync, readBinary;
if (ENVIRONMENT_IS_NODE) {
    var fs = require("fs");
    var nodePath = require("path");
    scriptDirectory = __dirname + "/";
    readBinary = filename => {
        filename = isFileURI(filename) ? new URL(filename) : filename;
        var ret = fs.readFileSync(filename);
        return ret
    };
    readAsync = async (filename, binary = true) => {
        filename = isFileURI(filename) ? new URL(filename) : filename;
        var ret = fs.readFileSync(filename, binary ? undefined : "utf8");
        return ret
    };
    if (!Module["thisProgram"] && process.argv.length > 1) {
        thisProgram = process.argv[1].replace(/\\/g, "/")
    }
    arguments_ = process.argv.slice(2);
    if (typeof module != "undefined") {
        module["exports"] = Module
    }
    quit_ = (status, toThrow) => {
        process.exitCode = status;
        throw toThrow
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
    } else if (typeof document != "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.startsWith("blob:")) {
        scriptDirectory = ""
    } else {
        scriptDirectory = scriptDirectory.slice(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
    } {
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = url => {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response)
            }
        }
        readAsync = async url => {
            if (isFileURI(url)) {
                return new Promise((resolve, reject) => {
                    var xhr = new XMLHttpRequest;
                    xhr.open("GET", url, true);
                    xhr.responseType = "arraybuffer";
                    xhr.onload = () => {
                        if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                            resolve(xhr.response);
                            return
                        }
                        reject(xhr.status)
                    };
                    xhr.onerror = reject;
                    xhr.send(null)
                })
            }
            var response = await fetch(url, {
                credentials: "same-origin"
            });
            if (response.ok) {
                return response.arrayBuffer()
            }
            throw new Error(response.status + " : " + response.url)
        }
    }
} else {}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.error.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
var wasmBinary = Module["wasmBinary"];
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAP64, HEAPU64, HEAPF64;
var runtimeInitialized = false;
var isFileURI = filename => filename.startsWith("file://");

function updateMemoryViews() {
    var b = wasmMemory.buffer;
    Module["HEAP8"] = HEAP8 = new Int8Array(b);
    Module["HEAP16"] = HEAP16 = new Int16Array(b);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
    Module["HEAP32"] = HEAP32 = new Int32Array(b);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
    Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
    Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b)
}

function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(onPreRuns)
}

function initRuntime() {
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.initialized) FS.init();
    TTY.init();
    wasmExports["Ua"]();
    FS.ignorePermissions = false
}

function preMain() {}

function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(onPostRuns)
}
var runDependencies = 0;
var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
    return id
}

function addRunDependency(id) {
    runDependencies++;
    Module["monitorRunDependencies"]?.(runDependencies)
}

function removeRunDependency(id) {
    runDependencies--;
    Module["monitorRunDependencies"]?.(runDependencies);
    if (runDependencies == 0) {
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}

function abort(what) {
    Module["onAbort"]?.(what);
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e
}
var wasmBinaryFile;

function findWasmBinary() {
    return locateFile("ctr-tt.wasm")
}

function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
        return new Uint8Array(wasmBinary)
    }
    if (readBinary) {
        return readBinary(file)
    }
    throw "both async and sync fetching of the wasm failed"
}
async function getWasmBinary(binaryFile) {
    if (!wasmBinary) {
        try {
            var response = await readAsync(binaryFile);
            return new Uint8Array(response)
        } catch {}
    }
    return getBinarySync(binaryFile)
}
async function instantiateArrayBuffer(binaryFile, imports) {
    try {
        var binary = await getWasmBinary(binaryFile);
        var instance = await WebAssembly.instantiate(binary, imports);
        return instance
    } catch (reason) {
        err(`failed to asynchronously prepare wasm: ${reason}`);
        abort(reason)
    }
}
async function instantiateAsync(binary, binaryFile, imports) {
    if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE) {
        try {
            var response = fetch(binaryFile, {
                credentials: "same-origin"
            });
            var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
            return instantiationResult
        } catch (reason) {
            err(`wasm streaming compile failed: ${reason}`);
            err("falling back to ArrayBuffer instantiation")
        }
    }
    return instantiateArrayBuffer(binaryFile, imports)
}

function getWasmImports() {
    return {
        a: wasmImports
    }
}
async function createWasm() {
    function receiveInstance(instance, module) {
        wasmExports = instance.exports;
        wasmMemory = wasmExports["Ta"];
        updateMemoryViews();
        wasmTable = wasmExports["sb"];
        removeRunDependency("wasm-instantiate");
        return wasmExports
    }
    addRunDependency("wasm-instantiate");

    function receiveInstantiationResult(result) {
        return receiveInstance(result["instance"])
    }
    var info = getWasmImports();
    if (Module["instantiateWasm"]) {
        return new Promise((resolve, reject) => {
            Module["instantiateWasm"](info, (mod, inst) => {
                receiveInstance(mod, inst);
                resolve(mod.exports)
            })
        })
    }
    wasmBinaryFile ??= findWasmBinary();
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports
}
class ExitStatus {
    name = "ExitStatus";
    constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status
    }
}
var callRuntimeCallbacks = callbacks => {
    while (callbacks.length > 0) {
        callbacks.shift()(Module)
    }
};
var onPostRuns = [];
var addOnPostRun = cb => onPostRuns.unshift(cb);
var onPreRuns = [];
var addOnPreRun = cb => onPreRuns.unshift(cb);
var noExitRuntime = Module["noExitRuntime"] || true;
var stackRestore = val => __emscripten_stack_restore(val);
var stackSave = () => _emscripten_stack_get_current();
class ExceptionInfo {
    constructor(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24
    }
    set_type(type) {
        HEAPU32[this.ptr + 4 >> 2] = type
    }
    get_type() {
        return HEAPU32[this.ptr + 4 >> 2]
    }
    set_destructor(destructor) {
        HEAPU32[this.ptr + 8 >> 2] = destructor
    }
    get_destructor() {
        return HEAPU32[this.ptr + 8 >> 2]
    }
    set_caught(caught) {
        caught = caught ? 1 : 0;
        HEAP8[this.ptr + 12] = caught
    }
    get_caught() {
        return HEAP8[this.ptr + 12] != 0
    }
    set_rethrown(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[this.ptr + 13] = rethrown
    }
    get_rethrown() {
        return HEAP8[this.ptr + 13] != 0
    }
    init(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor)
    }
    set_adjusted_ptr(adjustedPtr) {
        HEAPU32[this.ptr + 16 >> 2] = adjustedPtr
    }
    get_adjusted_ptr() {
        return HEAPU32[this.ptr + 16 >> 2]
    }
}
var exceptionLast = 0;
var uncaughtExceptionCount = 0;
var ___cxa_throw = (ptr, type, destructor) => {
    var info = new ExceptionInfo(ptr);
    info.init(type, destructor);
    exceptionLast = ptr;
    uncaughtExceptionCount++;
    throw exceptionLast
};
var syscallGetVarargI = () => {
    var ret = HEAP32[+SYSCALLS.varargs >> 2];
    SYSCALLS.varargs += 4;
    return ret
};
var syscallGetVarargP = syscallGetVarargI;
var PATH = {
    isAbs: path => path.charAt(0) === "/",
    splitPath: filename => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    },
    normalizeArray: (parts, allowAboveRoot) => {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    },
    normalize: path => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.slice(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    },
    dirname: path => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.slice(0, -1)
        }
        return root + dir
    },
    basename: path => path && path.match(/([^\/]+|\/)\/*$/)[1],
    join: (...paths) => PATH.normalize(paths.join("/")),
    join2: (l, r) => PATH.normalize(l + "/" + r)
};
var initRandomFill = () => {
    if (ENVIRONMENT_IS_NODE) {
        var nodeCrypto = require("crypto");
        return view => nodeCrypto.randomFillSync(view)
    }
    return view => crypto.getRandomValues(view)
};
var randomFill = view => {
    (randomFill = initRandomFill())(view)
};
var PATH_FS = {
    resolve: (...args) => {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? args[i] : FS.cwd();
            if (typeof path != "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = PATH.isAbs(path)
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p => !!p), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    },
    relative: (from, to) => {
        from = PATH_FS.resolve(from).slice(1);
        to = PATH_FS.resolve(to).slice(1);

        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    }
};
var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder : undefined;
var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
    }
    var str = "";
    while (idx < endPtr) {
        var u0 = heapOrArray[idx++];
        if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue
        }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue
        }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2
        } else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63
        }
        if (u0 < 65536) {
            str += String.fromCharCode(u0)
        } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
        }
    }
    return str
};
var FS_stdin_getChar_buffer = [];
var lengthBytesUTF8 = str => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c <= 127) {
            len++
        } else if (c <= 2047) {
            len += 2
        } else if (c >= 55296 && c <= 57343) {
            len += 4;
            ++i
        } else {
            len += 3
        }
    }
    return len
};
var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            heap[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            heap[outIdx++] = 192 | u >> 6;
            heap[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            heap[outIdx++] = 224 | u >> 12;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx) break;
            heap[outIdx++] = 240 | u >> 18;
            heap[outIdx++] = 128 | u >> 12 & 63;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx
};
var intArrayFromString = (stringy, dontAddNull, length) => {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
};
var FS_stdin_getChar = () => {
    if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
            var BUFSIZE = 256;
            var buf = Buffer.alloc(BUFSIZE);
            var bytesRead = 0;
            var fd = process.stdin.fd;
            try {
                bytesRead = fs.readSync(fd, buf, 0, BUFSIZE)
            } catch (e) {
                if (e.toString().includes("EOF")) bytesRead = 0;
                else throw e
            }
            if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString("utf-8")
            }
        } else if (typeof window != "undefined" && typeof window.prompt == "function") {
            result = window.prompt("Input: ");
            if (result !== null) {
                result += "\n"
            }
        } else {}
        if (!result) {
            return null
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true)
    }
    return FS_stdin_getChar_buffer.shift()
};
var TTY = {
    ttys: [],
    init() {},
    shutdown() {},
    register(dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    },
    stream_ops: {
        open(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43)
            }
            stream.tty = tty;
            stream.seekable = false
        },
        close(stream) {
            stream.tty.ops.fsync(stream.tty)
        },
        fsync(stream) {
            stream.tty.ops.fsync(stream.tty)
        },
        read(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(29)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.atime = Date.now()
            }
            return bytesRead
        },
        write(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60)
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                }
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
            if (length) {
                stream.node.mtime = stream.node.ctime = Date.now()
            }
            return i
        }
    },
    default_tty_ops: {
        get_char(tty) {
            return FS_stdin_getChar()
        },
        put_char(tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        fsync(tty) {
            if (tty.output?.length > 0) {
                out(UTF8ArrayToString(tty.output));
                tty.output = []
            }
        },
        ioctl_tcgets(tty) {
            return {
                c_iflag: 25856,
                c_oflag: 5,
                c_cflag: 191,
                c_lflag: 35387,
                c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
        },
        ioctl_tcsets(tty, optional_actions, data) {
            return 0
        },
        ioctl_tiocgwinsz(tty) {
            return [24, 80]
        }
    },
    default_tty1_ops: {
        put_char(tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        fsync(tty) {
            if (tty.output?.length > 0) {
                err(UTF8ArrayToString(tty.output));
                tty.output = []
            }
        }
    }
};
var zeroMemory = (ptr, size) => HEAPU8.fill(0, ptr, ptr + size);
var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
var mmapAlloc = size => {
    size = alignMemory(size, 65536);
    var ptr = _emscripten_builtin_memalign(65536, size);
    if (ptr) zeroMemory(ptr, size);
    return ptr
};
var MEMFS = {
    ops_table: null,
    mount(mount) {
        return MEMFS.createNode(null, "/", 16895, 0)
    },
    createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63)
        }
        MEMFS.ops_table ||= {
            dir: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    lookup: MEMFS.node_ops.lookup,
                    mknod: MEMFS.node_ops.mknod,
                    rename: MEMFS.node_ops.rename,
                    unlink: MEMFS.node_ops.unlink,
                    rmdir: MEMFS.node_ops.rmdir,
                    readdir: MEMFS.node_ops.readdir,
                    symlink: MEMFS.node_ops.symlink
                },
                stream: {
                    llseek: MEMFS.stream_ops.llseek
                }
            },
            file: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr
                },
                stream: {
                    llseek: MEMFS.stream_ops.llseek,
                    read: MEMFS.stream_ops.read,
                    write: MEMFS.stream_ops.write,
                    mmap: MEMFS.stream_ops.mmap,
                    msync: MEMFS.stream_ops.msync
                }
            },
            link: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    readlink: MEMFS.node_ops.readlink
                },
                stream: {}
            },
            chrdev: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr
                },
                stream: FS.chrdev_stream_ops
            }
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.atime = node.mtime = node.ctime = Date.now();
        if (parent) {
            parent.contents[name] = node;
            parent.atime = parent.mtime = parent.ctime = node.atime
        }
        return node
    },
    getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    },
    expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0)
    },
    resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0
        } else {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize
        }
    },
    node_ops: {
        getattr(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.atime);
            attr.mtime = new Date(node.mtime);
            attr.ctime = new Date(node.ctime);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        },
        setattr(node, attr) {
            for (const key of ["mode", "atime", "mtime", "ctime"]) {
                if (attr[key] != null) {
                    node[key] = attr[key]
                }
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        },
        lookup(parent, name) {
            throw MEMFS.doesNotExistError
        },
        mknod(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        },
        rename(old_node, new_dir, new_name) {
            var new_node;
            try {
                new_node = FS.lookupNode(new_dir, new_name)
            } catch (e) {}
            if (new_node) {
                if (FS.isDir(old_node.mode)) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55)
                    }
                }
                FS.hashRemoveNode(new_node)
            }
            delete old_node.parent.contents[old_node.name];
            new_dir.contents[new_name] = old_node;
            old_node.name = new_name;
            new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now()
        },
        unlink(parent, name) {
            delete parent.contents[name];
            parent.ctime = parent.mtime = Date.now()
        },
        rmdir(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55)
            }
            delete parent.contents[name];
            parent.ctime = parent.mtime = Date.now()
        },
        readdir(node) {
            return [".", "..", ...Object.keys(node.contents)]
        },
        symlink(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        },
        readlink(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28)
            }
            return node.link
        }
    },
    stream_ops: {
        read(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
        },
        write(stream, buffer, offset, length, position, canOwn) {
            if (buffer.buffer === HEAP8.buffer) {
                canOwn = false
            }
            if (!length) return 0;
            var node = stream.node;
            node.mtime = node.ctime = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                node.contents.set(buffer.subarray(offset, offset + length), position)
            } else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        },
        llseek(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28)
            }
            return position
        },
        mmap(stream, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48)
                }
                if (contents) {
                    if (position > 0 || position + length < contents.length) {
                        if (contents.subarray) {
                            contents = contents.subarray(position, position + length)
                        } else {
                            contents = Array.prototype.slice.call(contents, position, position + length)
                        }
                    }
                    HEAP8.set(contents, ptr)
                }
            }
            return {
                ptr,
                allocated
            }
        },
        msync(stream, buffer, offset, length, mmapFlags) {
            MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        }
    }
};
var asyncLoad = async url => {
    var arrayBuffer = await readAsync(url);
    return new Uint8Array(arrayBuffer)
};
var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
    FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn)
};
var preloadPlugins = Module["preloadPlugins"] || [];
var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
    if (typeof Browser != "undefined") Browser.init();
    var handled = false;
    preloadPlugins.forEach(plugin => {
        if (handled) return;
        if (plugin["canHandle"](fullname)) {
            plugin["handle"](byteArray, fullname, finish, onerror);
            handled = true
        }
    });
    return handled
};
var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency(`cp ${fullname}`);

    function processData(byteArray) {
        function finish(byteArray) {
            preFinish?.();
            if (!dontCreateFile) {
                FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
            }
            onload?.();
            removeRunDependency(dep)
        }
        if (FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
                onerror?.();
                removeRunDependency(dep)
            })) {
            return
        }
        finish(byteArray)
    }
    addRunDependency(dep);
    if (typeof url == "string") {
        asyncLoad(url).then(processData, onerror)
    } else {
        processData(url)
    }
};
var FS_modeStringToFlags = str => {
    var flagModes = {
        r: 0,
        "r+": 2,
        w: 512 | 64 | 1,
        "w+": 512 | 64 | 2,
        a: 1024 | 64 | 1,
        "a+": 1024 | 64 | 2
    };
    var flags = flagModes[str];
    if (typeof flags == "undefined") {
        throw new Error(`Unknown file open mode: ${str}`)
    }
    return flags
};
var FS_getMode = (canRead, canWrite) => {
    var mode = 0;
    if (canRead) mode |= 292 | 73;
    if (canWrite) mode |= 146;
    return mode
};
var IDBFS = {
    dbs: {},
    indexedDB: () => {
        if (typeof indexedDB != "undefined") return indexedDB;
        var ret = null;
        if (typeof window == "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        return ret
    },
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    queuePersist: mount => {
        function onPersistComplete() {
            if (mount.idbPersistState === "again") startPersist();
            else mount.idbPersistState = 0
        }

        function startPersist() {
            mount.idbPersistState = "idb";
            IDBFS.syncfs(mount, false, onPersistComplete)
        }
        if (!mount.idbPersistState) {
            mount.idbPersistState = setTimeout(startPersist, 0)
        } else if (mount.idbPersistState === "idb") {
            mount.idbPersistState = "again"
        }
    },
    mount: mount => {
        var mnt = MEMFS.mount(mount);
        if (mount?.opts?.autoPersist) {
            mnt.idbPersistState = 0;
            var memfs_node_ops = mnt.node_ops;
            mnt.node_ops = {
                ...mnt.node_ops
            };
            mnt.node_ops.mknod = (parent, name, mode, dev) => {
                var node = memfs_node_ops.mknod(parent, name, mode, dev);
                node.node_ops = mnt.node_ops;
                node.idbfs_mount = mnt.mount;
                node.memfs_stream_ops = node.stream_ops;
                node.stream_ops = {
                    ...node.stream_ops
                };
                node.stream_ops.write = (stream, buffer, offset, length, position, canOwn) => {
                    stream.node.isModified = true;
                    return node.memfs_stream_ops.write(stream, buffer, offset, length, position, canOwn)
                };
                node.stream_ops.close = stream => {
                    var n = stream.node;
                    if (n.isModified) {
                        IDBFS.queuePersist(n.idbfs_mount);
                        n.isModified = false
                    }
                    if (n.memfs_stream_ops.close) return n.memfs_stream_ops.close(stream)
                };
                return node
            };
            mnt.node_ops.mkdir = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.mkdir(...args));
            mnt.node_ops.rmdir = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.rmdir(...args));
            mnt.node_ops.symlink = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.symlink(...args));
            mnt.node_ops.unlink = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.unlink(...args));
            mnt.node_ops.rename = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.rename(...args))
        }
        return mnt
    },
    syncfs: (mount, populate, callback) => {
        IDBFS.getLocalSet(mount, (err, local) => {
            if (err) return callback(err);
            IDBFS.getRemoteSet(mount, (err, remote) => {
                if (err) return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback)
            })
        })
    },
    quit: () => {
        Object.values(IDBFS.dbs).forEach(value => value.close());
        IDBFS.dbs = {}
    },
    getDB: (name, callback) => {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db)
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
        } catch (e) {
            return callback(e)
        }
        if (!req) {
            return callback("Unable to connect to IndexedDB")
        }
        req.onupgradeneeded = e => {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", {
                    unique: false
                })
            }
        };
        req.onsuccess = () => {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db)
        };
        req.onerror = e => {
            callback(e.target.error);
            e.preventDefault()
        }
    },
    getLocalSet: (mount, callback) => {
        var entries = {};

        function isRealDir(p) {
            return p !== "." && p !== ".."
        }

        function toAbsolute(root) {
            return p => PATH.join2(root, p)
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                check.push(...FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
            }
            entries[path] = {
                timestamp: stat.mtime
            }
        }
        return callback(null, {
            type: "local",
            entries
        })
    },
    getRemoteSet: (mount, callback) => {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, (err, db) => {
            if (err) return callback(err);
            try {
                var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                transaction.onerror = e => {
                    callback(e.target.error);
                    e.preventDefault()
                };
                var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                var index = store.index("timestamp");
                index.openKeyCursor().onsuccess = event => {
                    var cursor = event.target.result;
                    if (!cursor) {
                        return callback(null, {
                            type: "remote",
                            db,
                            entries
                        })
                    }
                    entries[cursor.primaryKey] = {
                        timestamp: cursor.key
                    };
                    cursor.continue()
                }
            } catch (e) {
                return callback(e)
            }
        })
    },
    loadLocalEntry: (path, callback) => {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path)
        } catch (e) {
            return callback(e)
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode
            })
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode,
                contents: node.contents
            })
        } else {
            return callback(new Error("node type not supported"))
        }
    },
    storeLocalEntry: (path, entry, callback) => {
        try {
            if (FS.isDir(entry["mode"])) {
                FS.mkdirTree(path, entry["mode"])
            } else if (FS.isFile(entry["mode"])) {
                FS.writeFile(path, entry["contents"], {
                    canOwn: true
                })
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry["mode"]);
            FS.utime(path, entry["timestamp"], entry["timestamp"])
        } catch (e) {
            return callback(e)
        }
        callback(null)
    },
    removeLocalEntry: (path, callback) => {
        try {
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path)
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path)
            }
        } catch (e) {
            return callback(e)
        }
        callback(null)
    },
    loadRemoteEntry: (store, path, callback) => {
        var req = store.get(path);
        req.onsuccess = event => callback(null, event.target.result);
        req.onerror = e => {
            callback(e.target.error);
            e.preventDefault()
        }
    },
    storeRemoteEntry: (store, path, entry, callback) => {
        try {
            var req = store.put(entry, path)
        } catch (e) {
            callback(e);
            return
        }
        req.onsuccess = event => callback();
        req.onerror = e => {
            callback(e.target.error);
            e.preventDefault()
        }
    },
    removeRemoteEntry: (store, path, callback) => {
        var req = store.delete(path);
        req.onsuccess = event => callback();
        req.onerror = e => {
            callback(e.target.error);
            e.preventDefault()
        }
    },
    reconcile: (src, dst, callback) => {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach(key => {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e["timestamp"].getTime() != e2["timestamp"].getTime()) {
                create.push(key);
                total++
            }
        });
        var remove = [];
        Object.keys(dst.entries).forEach(key => {
            if (!src.entries[key]) {
                remove.push(key);
                total++
            }
        });
        if (!total) {
            return callback(null)
        }
        var errored = false;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);

        function done(err) {
            if (err && !errored) {
                errored = true;
                return callback(err)
            }
        }
        transaction.onerror = transaction.onabort = e => {
            done(e.target.error);
            e.preventDefault()
        };
        transaction.oncomplete = e => {
            if (!errored) {
                callback(null)
            }
        };
        create.sort().forEach(path => {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, (err, entry) => {
                    if (err) return done(err);
                    IDBFS.storeLocalEntry(path, entry, done)
                })
            } else {
                IDBFS.loadLocalEntry(path, (err, entry) => {
                    if (err) return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done)
                })
            }
        });
        remove.sort().reverse().forEach(path => {
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done)
            } else {
                IDBFS.removeRemoteEntry(store, path, done)
            }
        })
    }
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    filesystems: null,
    syncFSRequests: 0,
    readFiles: {},
    ErrnoError: class {
        name = "ErrnoError";
        constructor(errno) {
            this.errno = errno
        }
    },
    FSStream: class {
        shared = {};
        get object() {
            return this.node
        }
        set object(val) {
            this.node = val
        }
        get isRead() {
            return (this.flags & 2097155) !== 1
        }
        get isWrite() {
            return (this.flags & 2097155) !== 0
        }
        get isAppend() {
            return this.flags & 1024
        }
        get flags() {
            return this.shared.flags
        }
        set flags(val) {
            this.shared.flags = val
        }
        get position() {
            return this.shared.position
        }
        set position(val) {
            this.shared.position = val
        }
    },
    FSNode: class {
        node_ops = {};
        stream_ops = {};
        readMode = 292 | 73;
        writeMode = 146;
        mounted = null;
        constructor(parent, name, mode, rdev) {
            if (!parent) {
                parent = this
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.rdev = rdev;
            this.atime = this.mtime = this.ctime = Date.now()
        }
        get read() {
            return (this.mode & this.readMode) === this.readMode
        }
        set read(val) {
            val ? this.mode |= this.readMode : this.mode &= ~this.readMode
        }
        get write() {
            return (this.mode & this.writeMode) === this.writeMode
        }
        set write(val) {
            val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode
        }
        get isFolder() {
            return FS.isDir(this.mode)
        }
        get isDevice() {
            return FS.isChrdev(this.mode)
        }
    },
    lookupPath(path, opts = {}) {
        if (!path) {
            throw new FS.ErrnoError(44)
        }
        opts.follow_mount ??= true;
        if (!PATH.isAbs(path)) {
            path = FS.cwd() + "/" + path
        }
        linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
            var parts = path.split("/").filter(p => !!p);
            var current = FS.root;
            var current_path = "/";
            for (var i = 0; i < parts.length; i++) {
                var islast = i === parts.length - 1;
                if (islast && opts.parent) {
                    break
                }
                if (parts[i] === ".") {
                    continue
                }
                if (parts[i] === "..") {
                    current_path = PATH.dirname(current_path);
                    current = current.parent;
                    continue
                }
                current_path = PATH.join2(current_path, parts[i]);
                try {
                    current = FS.lookupNode(current, parts[i])
                } catch (e) {
                    if (e?.errno === 44 && islast && opts.noent_okay) {
                        return {
                            path: current_path
                        }
                    }
                    throw e
                }
                if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
                    current = current.mounted.root
                }
                if (FS.isLink(current.mode) && (!islast || opts.follow)) {
                    if (!current.node_ops.readlink) {
                        throw new FS.ErrnoError(52)
                    }
                    var link = current.node_ops.readlink(current);
                    if (!PATH.isAbs(link)) {
                        link = PATH.dirname(current_path) + "/" + link
                    }
                    path = link + "/" + parts.slice(i + 1).join("/");
                    continue linkloop
                }
            }
            return {
                path: current_path,
                node: current
            }
        }
        throw new FS.ErrnoError(32)
    },
    getPath(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path
            }
            path = path ? `${node.name}/${path}` : node.name;
            node = node.parent
        }
    },
    hashName(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    },
    hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    },
    hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    },
    lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    },
    createNode(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node
    },
    destroyNode(node) {
        FS.hashRemoveNode(node)
    },
    isRoot(node) {
        return node === node.parent
    },
    isMountpoint(node) {
        return !!node.mounted
    },
    isFile(mode) {
        return (mode & 61440) === 32768
    },
    isDir(mode) {
        return (mode & 61440) === 16384
    },
    isLink(mode) {
        return (mode & 61440) === 40960
    },
    isChrdev(mode) {
        return (mode & 61440) === 8192
    },
    isBlkdev(mode) {
        return (mode & 61440) === 24576
    },
    isFIFO(mode) {
        return (mode & 61440) === 4096
    },
    isSocket(mode) {
        return (mode & 49152) === 49152
    },
    flagsToPermissionString(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    },
    nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.includes("r") && !(node.mode & 292)) {
            return 2
        } else if (perms.includes("w") && !(node.mode & 146)) {
            return 2
        } else if (perms.includes("x") && !(node.mode & 73)) {
            return 2
        }
        return 0
    },
    mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0
    },
    mayCreate(dir, name) {
        if (!FS.isDir(dir.mode)) {
            return 54
        }
        try {
            var node = FS.lookupNode(dir, name);
            return 20
        } catch (e) {}
        return FS.nodePermissions(dir, "wx")
    },
    mayDelete(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
            return errCode
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31
            }
        }
        return 0
    },
    mayOpen(node, flags) {
        if (!node) {
            return 44
        }
        if (FS.isLink(node.mode)) {
            return 32
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & (512 | 64)) {
                return 31
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    },
    checkOpExists(op, err) {
        if (!op) {
            throw new FS.ErrnoError(err)
        }
        return op
    },
    MAX_OPEN_FDS: 4096,
    nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(33)
    },
    getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        return stream
    },
    getStream: fd => FS.streams[fd],
    createStream(stream, fd = -1) {
        stream = Object.assign(new FS.FSStream, stream);
        if (fd == -1) {
            fd = FS.nextfd()
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    },
    closeStream(fd) {
        FS.streams[fd] = null
    },
    dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream
    },
    doSetAttr(stream, node, attr) {
        var setattr = stream?.stream_ops.setattr;
        var arg = setattr ? stream : node;
        setattr ??= node.node_ops.setattr;
        FS.checkOpExists(setattr, 63);
        setattr(arg, attr)
    },
    chrdev_stream_ops: {
        open(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            stream.stream_ops.open?.(stream)
        },
        llseek() {
            throw new FS.ErrnoError(70)
        }
    },
    major: dev => dev >> 8,
    minor: dev => dev & 255,
    makedev: (ma, mi) => ma << 8 | mi,
    registerDevice(dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    },
    getDevice: dev => FS.devices[dev],
    getMounts(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push(...m.mounts)
        }
        return mounts
    },
    syncfs(populate, callback) {
        if (typeof populate == "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`)
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode)
        }

        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach(mount => {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        })
    },
    mount(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54)
            }
        }
        var mount = {
            type,
            opts,
            mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    },
    unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(hash => {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.includes(current.mount)) {
                    FS.destroyNode(current)
                }
                current = next
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1)
    },
    lookup(parent, name) {
        return parent.node_ops.lookup(parent, name)
    },
    mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name) {
            throw new FS.ErrnoError(28)
        }
        if (name === "." || name === "..") {
            throw new FS.ErrnoError(20)
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    },
    statfs(path) {
        return FS.statfsNode(FS.lookupPath(path, {
            follow: true
        }).node)
    },
    statfsStream(stream) {
        return FS.statfsNode(stream.node)
    },
    statfsNode(node) {
        var rtn = {
            bsize: 4096,
            frsize: 4096,
            blocks: 1e6,
            bfree: 5e5,
            bavail: 5e5,
            files: FS.nextInode,
            ffree: FS.nextInode - 1,
            fsid: 42,
            flags: 2,
            namelen: 255
        };
        if (node.node_ops.statfs) {
            Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root))
        }
        return rtn
    },
    create(path, mode = 438) {
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    },
    mkdir(path, mode = 511) {
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    },
    mkdirTree(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var dir of dirs) {
            if (!dir) continue;
            if (d || PATH.isAbs(path)) d += "/";
            d += dir;
            try {
                FS.mkdir(d, mode)
            } catch (e) {
                if (e.errno != 20) throw e
            }
        }
    },
    mkdev(path, mode, dev) {
        if (typeof dev == "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    },
    symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44)
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    },
    rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, {
            parent: true
        });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, {
            parent: true
        });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28)
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(10)
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name);
            old_node.parent = new_dir
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
    },
    rmdir(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node)
    },
    readdir(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
        return readdir(node)
    },
    unlink(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44)
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node)
    },
    readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28)
        }
        return link.node_ops.readlink(link)
    },
    stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
        return getattr(node)
    },
    fstat(fd) {
        var stream = FS.getStreamChecked(fd);
        var node = stream.node;
        var getattr = stream.stream_ops.getattr;
        var arg = getattr ? stream : node;
        getattr ??= node.node_ops.getattr;
        FS.checkOpExists(getattr, 63);
        return getattr(arg)
    },
    lstat(path) {
        return FS.stat(path, true)
    },
    doChmod(stream, node, mode, dontFollow) {
        FS.doSetAttr(stream, node, {
            mode: mode & 4095 | node.mode & ~4095,
            ctime: Date.now(),
            dontFollow
        })
    },
    chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        FS.doChmod(null, node, mode, dontFollow)
    },
    lchmod(path, mode) {
        FS.chmod(path, mode, true)
    },
    fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.doChmod(stream, stream.node, mode, false)
    },
    doChown(stream, node, dontFollow) {
        FS.doSetAttr(stream, node, {
            timestamp: Date.now(),
            dontFollow
        })
    },
    chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        FS.doChown(null, node, dontFollow)
    },
    lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true)
    },
    fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.doChown(stream, stream.node, false)
    },
    doTruncate(stream, node, len) {
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        FS.doSetAttr(stream, node, {
            size: len,
            timestamp: Date.now()
        })
    },
    truncate(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28)
        }
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        FS.doTruncate(null, node, len)
    },
    ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if (len < 0 || (stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28)
        }
        FS.doTruncate(stream, stream.node, len)
    },
    utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
            atime,
            mtime
        })
    },
    open(path, flags, mode = 438) {
        if (path === "") {
            throw new FS.ErrnoError(44)
        }
        flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        var isDirPath;
        if (typeof path == "object") {
            node = path
        } else {
            isDirPath = path.endsWith("/");
            var lookup = FS.lookupPath(path, {
                follow: !(flags & 131072),
                noent_okay: true
            });
            node = lookup.node;
            path = lookup.path
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20)
                }
            } else if (isDirPath) {
                throw new FS.ErrnoError(31)
            } else {
                node = FS.mknod(path, mode | 511, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54)
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        if (flags & 512 && !created) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({
            node,
            path: FS.getPath(node),
            flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        });
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (created) {
            FS.chmod(node, mode & 511)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1
            }
        }
        return stream
    },
    close(stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
        stream.fd = null
    },
    isClosed(stream) {
        return stream.fd === null
    },
    llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70)
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    },
    read(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28)
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead
    },
    write(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28)
        }
        if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten
    },
    mmap(stream, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43)
        }
        if (!length) {
            throw new FS.ErrnoError(28)
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags)
    },
    msync(stream, buffer, offset, length, mmapFlags) {
        if (!stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    },
    ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    },
    readFile(path, opts = {}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error(`Invalid encoding type "${opts.encoding}"`)
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    },
    writeFile(path, data, opts = {}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
        } else {
            throw new Error("Unsupported data type")
        }
        FS.close(stream)
    },
    cwd: () => FS.currentPath,
    chdir(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54)
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        FS.currentPath = lookup.path
    },
    createDefaultDirectories() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    },
    createDefaultDevices() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: () => 0,
            write: (stream, buffer, offset, length, pos) => length,
            llseek: () => 0
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var randomBuffer = new Uint8Array(1024),
            randomLeft = 0;
        var randomByte = () => {
            if (randomLeft === 0) {
                randomFill(randomBuffer);
                randomLeft = randomBuffer.byteLength
            }
            return randomBuffer[--randomLeft]
        };
        FS.createDevice("/dev", "random", randomByte);
        FS.createDevice("/dev", "urandom", randomByte);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    },
    createSpecialDirectories() {
        FS.mkdir("/proc");
        var proc_self = FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount() {
                var node = FS.createNode(proc_self, "fd", 16895, 73);
                node.stream_ops = {
                    llseek: MEMFS.stream_ops.llseek
                };
                node.node_ops = {
                    lookup(parent, name) {
                        var fd = +name;
                        var stream = FS.getStreamChecked(fd);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: () => stream.path
                            },
                            id: fd + 1
                        };
                        ret.parent = ret;
                        return ret
                    },
                    readdir() {
                        return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString())
                    }
                };
                return node
            }
        }, {}, "/proc/self/fd")
    },
    createStandardStreams(input, output, error) {
        if (input) {
            FS.createDevice("/dev", "stdin", input)
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (output) {
            FS.createDevice("/dev", "stdout", null, output)
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (error) {
            FS.createDevice("/dev", "stderr", null, error)
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1)
    },
    staticInit() {
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            MEMFS,
            IDBFS
        }
    },
    init(input, output, error) {
        FS.initialized = true;
        input ??= Module["stdin"];
        output ??= Module["stdout"];
        error ??= Module["stderr"];
        FS.createStandardStreams(input, output, error)
    },
    quit() {
        FS.initialized = false;
        for (var stream of FS.streams) {
            if (stream) {
                FS.close(stream)
            }
        }
    },
    findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
            return null
        }
        return ret.object
    },
    analyzePath(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    },
    createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) {
                if (e.errno != 20) throw e
            }
            parent = current
        }
        return current
    },
    createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode)
    },
    createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
            parent = typeof parent == "string" ? parent : FS.getPath(parent);
            path = name ? PATH.join2(parent, name) : parent
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data == "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
    },
    createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open(stream) {
                stream.seekable = false
            },
            close(stream) {
                if (output?.buffer?.length) {
                    output(10)
                }
            },
            read(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6)
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.atime = Date.now()
                }
                return bytesRead
            },
            write(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                }
                if (length) {
                    stream.node.mtime = stream.node.ctime = Date.now()
                }
                return i
            }
        });
        return FS.mkdev(path, mode, dev)
    },
    forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else {
            try {
                obj.contents = readBinary(obj.url);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
        }
    },
    createLazyFile(parent, name, url, canRead, canWrite) {
        class LazyUint8Array {
            lengthKnown = false;
            chunks = [];
            get(idx) {
                if (idx > this.length - 1 || idx < 0) {
                    return undefined
                }
                var chunkOffset = idx % this.chunkSize;
                var chunkNum = idx / this.chunkSize | 0;
                return this.getter(chunkNum)[chunkOffset]
            }
            setDataGetter(getter) {
                this.getter = getter
            }
            cacheLength() {
                var xhr = new XMLHttpRequest;
                xhr.open("HEAD", url, false);
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                var datalength = Number(xhr.getResponseHeader("Content-length"));
                var header;
                var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
                var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
                var chunkSize = 1024 * 1024;
                if (!hasByteServing) chunkSize = datalength;
                var doXHR = (from, to) => {
                    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                    var xhr = new XMLHttpRequest;
                    xhr.open("GET", url, false);
                    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                    xhr.responseType = "arraybuffer";
                    if (xhr.overrideMimeType) {
                        xhr.overrideMimeType("text/plain; charset=x-user-defined")
                    }
                    xhr.send(null);
                    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                    if (xhr.response !== undefined) {
                        return new Uint8Array(xhr.response || [])
                    }
                    return intArrayFromString(xhr.responseText || "", true)
                };
                var lazyArray = this;
                lazyArray.setDataGetter(chunkNum => {
                    var start = chunkNum * chunkSize;
                    var end = (chunkNum + 1) * chunkSize - 1;
                    end = Math.min(end, datalength - 1);
                    if (typeof lazyArray.chunks[chunkNum] == "undefined") {
                        lazyArray.chunks[chunkNum] = doXHR(start, end)
                    }
                    if (typeof lazyArray.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
                    return lazyArray.chunks[chunkNum]
                });
                if (usesGzip || !datalength) {
                    chunkSize = datalength = 1;
                    datalength = this.getter(0).length;
                    chunkSize = datalength;
                    out("LazyFiles on gzip forces download of the whole file when length is accessed")
                }
                this._length = datalength;
                this._chunkSize = chunkSize;
                this.lengthKnown = true
            }
            get length() {
                if (!this.lengthKnown) {
                    this.cacheLength()
                }
                return this._length
            }
            get chunkSize() {
                if (!this.lengthKnown) {
                    this.cacheLength()
                }
                return this._chunkSize
            }
        }
        if (typeof XMLHttpRequest != "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function() {
                    return this.contents.length
                }
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(key => {
            var fn = node.stream_ops[key];
            stream_ops[key] = (...args) => {
                FS.forceLoadFile(node);
                return fn(...args)
            }
        });

        function writeChunks(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        }
        stream_ops.read = (stream, buffer, offset, length, position) => {
            FS.forceLoadFile(node);
            return writeChunks(stream, buffer, offset, length, position)
        };
        stream_ops.mmap = (stream, length, position, prot, flags) => {
            FS.forceLoadFile(node);
            var ptr = mmapAlloc(length);
            if (!ptr) {
                throw new FS.ErrnoError(48)
            }
            writeChunks(stream, HEAP8, ptr, length, position);
            return {
                ptr,
                allocated: true
            }
        };
        node.stream_ops = stream_ops;
        return node
    }
};
var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
            return path
        }
        var dir;
        if (dirfd === -100) {
            dir = FS.cwd()
        } else {
            var dirstream = SYSCALLS.getStreamFromFD(dirfd);
            dir = dirstream.path
        }
        if (path.length == 0) {
            if (!allowEmpty) {
                throw new FS.ErrnoError(44)
            }
            return dir
        }
        return dir + "/" + path
    },
    writeStat(buf, stat) {
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = stat.mode;
        HEAPU32[buf + 8 >> 2] = stat.nlink;
        HEAP32[buf + 12 >> 2] = stat.uid;
        HEAP32[buf + 16 >> 2] = stat.gid;
        HEAP32[buf + 20 >> 2] = stat.rdev;
        HEAP64[buf + 24 >> 3] = BigInt(stat.size);
        HEAP32[buf + 32 >> 2] = 4096;
        HEAP32[buf + 36 >> 2] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        HEAP64[buf + 40 >> 3] = BigInt(Math.floor(atime / 1e3));
        HEAPU32[buf + 48 >> 2] = atime % 1e3 * 1e3 * 1e3;
        HEAP64[buf + 56 >> 3] = BigInt(Math.floor(mtime / 1e3));
        HEAPU32[buf + 64 >> 2] = mtime % 1e3 * 1e3 * 1e3;
        HEAP64[buf + 72 >> 3] = BigInt(Math.floor(ctime / 1e3));
        HEAPU32[buf + 80 >> 2] = ctime % 1e3 * 1e3 * 1e3;
        HEAP64[buf + 88 >> 3] = BigInt(stat.ino);
        return 0
    },
    writeStatFs(buf, stats) {
        HEAP32[buf + 4 >> 2] = stats.bsize;
        HEAP32[buf + 40 >> 2] = stats.bsize;
        HEAP32[buf + 8 >> 2] = stats.blocks;
        HEAP32[buf + 12 >> 2] = stats.bfree;
        HEAP32[buf + 16 >> 2] = stats.bavail;
        HEAP32[buf + 20 >> 2] = stats.files;
        HEAP32[buf + 24 >> 2] = stats.ffree;
        HEAP32[buf + 28 >> 2] = stats.fsid;
        HEAP32[buf + 44 >> 2] = stats.flags;
        HEAP32[buf + 36 >> 2] = stats.namelen
    },
    doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43)
        }
        if (flags & 2) {
            return 0
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags)
    },
    getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream
    },
    varargs: undefined,
    getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret
    }
};

function ___syscall_fcntl64(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
            case 0: {
                var arg = syscallGetVarargI();
                if (arg < 0) {
                    return -28
                }
                while (FS.streams[arg]) {
                    arg++
                }
                var newStream;
                newStream = FS.dupStream(stream, arg);
                return newStream.fd
            }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4: {
                var arg = syscallGetVarargI();
                stream.flags |= arg;
                return 0
            }
            case 12: {
                var arg = syscallGetVarargP();
                var offset = 0;
                HEAP16[arg + offset >> 1] = 2;
                return 0
            }
            case 13:
            case 14:
                return 0
        }
        return -28
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno
    }
}

function ___syscall_fstat64(fd, buf) {
    try {
        return SYSCALLS.writeStat(buf, FS.fstat(fd))
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno
    }
}
var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);

function ___syscall_getdents64(fd, dirp, count) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        stream.getdents ||= FS.readdir(stream.path);
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var startIdx = Math.floor(off / struct_size);
        var endIdx = Math.min(stream.getdents.length, startIdx + Math.floor(count / struct_size));
        for (var idx = startIdx; idx < endIdx; idx++) {
            var id;
            var type;
            var name = stream.getdents[idx];
            if (name === ".") {
                id = stream.node.id;
                type = 4
            } else if (name === "..") {
                var lookup = FS.lookupPath(stream.path, {
                    parent: true
                });
                id = lookup.node.id;
                type = 4
            } else {
                var child;
                try {
                    child = FS.lookupNode(stream.node, name)
                } catch (e) {
                    if (e?.errno === 28) {
                        continue
                    }
                    throw e
                }
                id = child.id;
                type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8
            }
            HEAP64[dirp + pos >> 3] = BigInt(id);
            HEAP64[dirp + pos + 8 >> 3] = BigInt((idx + 1) * struct_size);
            HEAP16[dirp + pos + 16 >> 1] = 280;
            HEAP8[dirp + pos + 18] = type;
            stringToUTF8(name, dirp + pos + 19, 256);
            pos += struct_size
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno
    }
}

function ___syscall_ioctl(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
            case 21509: {
                if (!stream.tty) return -59;
                return 0
            }
            case 21505: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcgets) {
                    var termios = stream.tty.ops.ioctl_tcgets(stream);
                    var argp = syscallGetVarargP();
                    HEAP32[argp >> 2] = termios.c_iflag || 0;
                    HEAP32[argp + 4 >> 2] = termios.c_oflag || 0;
                    HEAP32[argp + 8 >> 2] = termios.c_cflag || 0;
                    HEAP32[argp + 12 >> 2] = termios.c_lflag || 0;
                    for (var i = 0; i < 32; i++) {
                        HEAP8[argp + i + 17] = termios.c_cc[i] || 0
                    }
                    return 0
                }
                return 0
            }
            case 21510:
            case 21511:
            case 21512: {
                if (!stream.tty) return -59;
                return 0
            }
            case 21506:
            case 21507:
            case 21508: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcsets) {
                    var argp = syscallGetVarargP();
                    var c_iflag = HEAP32[argp >> 2];
                    var c_oflag = HEAP32[argp + 4 >> 2];
                    var c_cflag = HEAP32[argp + 8 >> 2];
                    var c_lflag = HEAP32[argp + 12 >> 2];
                    var c_cc = [];
                    for (var i = 0; i < 32; i++) {
                        c_cc.push(HEAP8[argp + i + 17])
                    }
                    return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
                        c_iflag,
                        c_oflag,
                        c_cflag,
                        c_lflag,
                        c_cc
                    })
                }
                return 0
            }
            case 21519: {
                if (!stream.tty) return -59;
                var argp = syscallGetVarargP();
                HEAP32[argp >> 2] = 0;
                return 0
            }
            case 21520: {
                if (!stream.tty) return -59;
                return -28
            }
            case 21531: {
                var argp = syscallGetVarargP();
                return FS.ioctl(stream, op, argp)
            }
            case 21523: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tiocgwinsz) {
                    var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
                    var argp = syscallGetVarargP();
                    HEAP16[argp >> 1] = winsize[0];
                    HEAP16[argp + 2 >> 1] = winsize[1]
                }
                return 0
            }
            case 21524: {
                if (!stream.tty) return -59;
                return 0
            }
            case 21515: {
                if (!stream.tty) return -59;
                return 0
            }
            default:
                return -28
        }
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno
    }
}

function ___syscall_lstat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.writeStat(buf, FS.lstat(path))
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno
    }
}

function ___syscall_newfstatat(dirfd, path, buf, flags) {
    try {
        path = SYSCALLS.getStr(path);
        var nofollow = flags & 256;
        var allowEmpty = flags & 4096;
        flags = flags & ~6400;
        path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
        return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path))
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno
    }
}

function ___syscall_openat(dirfd, path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        var mode = varargs ? syscallGetVarargI() : 0;
        return FS.open(path, flags, mode).fd
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno
    }
}

function ___syscall_stat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.writeStat(buf, FS.stat(path))
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return -e.errno
    }
}
var __abort_js = () => abort("");
var runtimeKeepaliveCounter = 0;
var __emscripten_runtime_keepalive_clear = () => {
    noExitRuntime = false;
    runtimeKeepaliveCounter = 0
};
var __emscripten_throw_longjmp = () => {
    throw Infinity
};
var isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
var MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
var MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
var ydayFromDate = date => {
    var leap = isLeapYear(date.getFullYear());
    var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
    var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
    return yday
};
var INT53_MAX = 9007199254740992;
var INT53_MIN = -9007199254740992;
var bigintToI53Checked = num => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);

function __localtime_js(time, tmPtr) {
    time = bigintToI53Checked(time);
    var date = new Date(time * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var yday = ydayFromDate(date) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
    var start = new Date(date.getFullYear(), 0, 1);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[tmPtr + 32 >> 2] = dst
}
var __mktime_js = function(tmPtr) {
    var ret = (() => {
        var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900, HEAP32[tmPtr + 16 >> 2], HEAP32[tmPtr + 12 >> 2], HEAP32[tmPtr + 8 >> 2], HEAP32[tmPtr + 4 >> 2], HEAP32[tmPtr >> 2], 0);
        var dst = HEAP32[tmPtr + 32 >> 2];
        var guessedOffset = date.getTimezoneOffset();
        var start = new Date(date.getFullYear(), 0, 1);
        var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
        var winterOffset = start.getTimezoneOffset();
        var dstOffset = Math.min(winterOffset, summerOffset);
        if (dst < 0) {
            HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
        } else if (dst > 0 != (dstOffset == guessedOffset)) {
            var nonDstOffset = Math.max(winterOffset, summerOffset);
            var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
            date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
        }
        HEAP32[tmPtr + 24 >> 2] = date.getDay();
        var yday = ydayFromDate(date) | 0;
        HEAP32[tmPtr + 28 >> 2] = yday;
        HEAP32[tmPtr >> 2] = date.getSeconds();
        HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
        HEAP32[tmPtr + 8 >> 2] = date.getHours();
        HEAP32[tmPtr + 12 >> 2] = date.getDate();
        HEAP32[tmPtr + 16 >> 2] = date.getMonth();
        HEAP32[tmPtr + 20 >> 2] = date.getYear();
        var timeMs = date.getTime();
        if (isNaN(timeMs)) {
            return -1
        }
        return timeMs / 1e3
    })();
    return BigInt(ret)
};
var timers = {};
var handleException = e => {
    if (e instanceof ExitStatus || e == "unwind") {
        return EXITSTATUS
    }
    quit_(1, e)
};
var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
var _proc_exit = code => {
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
        Module["onExit"]?.(code);
        ABORT = true
    }
    quit_(code, new ExitStatus(code))
};
var exitJS = (status, implicit) => {
    EXITSTATUS = status;
    _proc_exit(status)
};
var _exit = exitJS;
var maybeExit = () => {
    if (!keepRuntimeAlive()) {
        try {
            _exit(EXITSTATUS)
        } catch (e) {
            handleException(e)
        }
    }
};
var callUserCallback = func => {
    if (ABORT) {
        return
    }
    try {
        func();
        maybeExit()
    } catch (e) {
        handleException(e)
    }
};
var _emscripten_get_now = () => performance.now();
var __setitimer_js = (which, timeout_ms) => {
    if (timers[which]) {
        clearTimeout(timers[which].id);
        delete timers[which]
    }
    if (!timeout_ms) return 0;
    var id = setTimeout(() => {
        delete timers[which];
        callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()))
    }, timeout_ms);
    timers[which] = {
        id,
        timeout_ms
    };
    return 0
};
var __tzset_js = (timezone, daylight, std_name, dst_name) => {
    var currentYear = (new Date).getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
    HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
    var extractZone = timezoneOffset => {
        var sign = timezoneOffset >= 0 ? "-" : "+";
        var absOffset = Math.abs(timezoneOffset);
        var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
        var minutes = String(absOffset % 60).padStart(2, "0");
        return `UTC${sign}${hours}${minutes}`
    };
    var winterName = extractZone(winterOffset);
    var summerName = extractZone(summerOffset);
    if (summerOffset < winterOffset) {
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17)
    } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17)
    }
};
var _emscripten_date_now = () => Date.now();
var nowIsMonotonic = 1;
var checkWasiClock = clock_id => clock_id >= 0 && clock_id <= 3;

function _clock_time_get(clk_id, ignored_precision, ptime) {
    ignored_precision = bigintToI53Checked(ignored_precision);
    if (!checkWasiClock(clk_id)) {
        return 28
    }
    var now;
    if (clk_id === 0) {
        now = _emscripten_date_now()
    } else if (nowIsMonotonic) {
        now = _emscripten_get_now()
    } else {
        return 52
    }
    var nsec = Math.round(now * 1e3 * 1e3);
    HEAP64[ptime >> 3] = BigInt(nsec);
    return 0
}
var readEmAsmArgsArray = [];
var readEmAsmArgs = (sigPtr, buf) => {
    readEmAsmArgsArray.length = 0;
    var ch;
    while (ch = HEAPU8[sigPtr++]) {
        var wide = ch != 105;
        wide &= ch != 112;
        buf += wide && buf % 8 ? 4 : 0;
        readEmAsmArgsArray.push(ch == 112 ? HEAPU32[buf >> 2] : ch == 106 ? HEAP64[buf >> 3] : ch == 105 ? HEAP32[buf >> 2] : HEAPF64[buf >> 3]);
        buf += wide ? 8 : 4
    }
    return readEmAsmArgsArray
};
var runEmAsmFunction = (code, sigPtr, argbuf) => {
    var args = readEmAsmArgs(sigPtr, argbuf);
    return ASM_CONSTS[code](...args)
};
var _emscripten_asm_const_int = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf);
var safeSetTimeout = (func, timeout) => setTimeout(() => {
    callUserCallback(func)
}, timeout);
var _emscripten_set_main_loop_timing = (mode, value) => {
    MainLoop.timingMode = mode;
    MainLoop.timingValue = value;
    if (!MainLoop.func) {
        return 1
    }
    if (!MainLoop.running) {
        MainLoop.running = true
    }
    if (mode == 0) {
        MainLoop.scheduler = function MainLoop_scheduler_setTimeout() {
            var timeUntilNextTick = Math.max(0, MainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
            setTimeout(MainLoop.runner, timeUntilNextTick)
        };
        MainLoop.method = "timeout"
    } else if (mode == 1) {
        MainLoop.scheduler = function MainLoop_scheduler_rAF() {
            MainLoop.requestAnimationFrame(MainLoop.runner)
        };
        MainLoop.method = "rAF"
    } else if (mode == 2) {
        if (typeof MainLoop.setImmediate == "undefined") {
            if (typeof setImmediate == "undefined") {
                var setImmediates = [];
                var emscriptenMainLoopMessageId = "setimmediate";
                var MainLoop_setImmediate_messageHandler = event => {
                    if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                        event.stopPropagation();
                        setImmediates.shift()()
                    }
                };
                addEventListener("message", MainLoop_setImmediate_messageHandler, true);
                MainLoop.setImmediate = func => {
                    setImmediates.push(func);
                    if (ENVIRONMENT_IS_WORKER) {
                        Module["setImmediates"] ??= [];
                        Module["setImmediates"].push(func);
                        postMessage({
                            target: emscriptenMainLoopMessageId
                        })
                    } else postMessage(emscriptenMainLoopMessageId, "*")
                }
            } else {
                MainLoop.setImmediate = setImmediate
            }
        }
        MainLoop.scheduler = function MainLoop_scheduler_setImmediate() {
            MainLoop.setImmediate(MainLoop.runner)
        };
        MainLoop.method = "immediate"
    }
    return 0
};
var setMainLoop = (iterFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
    MainLoop.func = iterFunc;
    MainLoop.arg = arg;
    var thisMainLoopId = MainLoop.currentlyRunningMainloop;

    function checkIsRunning() {
        if (thisMainLoopId < MainLoop.currentlyRunningMainloop) {
            maybeExit();
            return false
        }
        return true
    }
    MainLoop.running = false;
    MainLoop.runner = function MainLoop_runner() {
        if (ABORT) return;
        if (MainLoop.queue.length > 0) {
            var start = Date.now();
            var blocker = MainLoop.queue.shift();
            blocker.func(blocker.arg);
            if (MainLoop.remainingBlockers) {
                var remaining = MainLoop.remainingBlockers;
                var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                if (blocker.counted) {
                    MainLoop.remainingBlockers = next
                } else {
                    next = next + .5;
                    MainLoop.remainingBlockers = (8 * remaining + next) / 9
                }
            }
            MainLoop.updateStatus();
            if (!checkIsRunning()) return;
            setTimeout(MainLoop.runner, 0);
            return
        }
        if (!checkIsRunning()) return;
        MainLoop.currentFrameNumber = MainLoop.currentFrameNumber + 1 | 0;
        if (MainLoop.timingMode == 1 && MainLoop.timingValue > 1 && MainLoop.currentFrameNumber % MainLoop.timingValue != 0) {
            MainLoop.scheduler();
            return
        } else if (MainLoop.timingMode == 0) {
            MainLoop.tickStartTime = _emscripten_get_now()
        }
        MainLoop.runIter(iterFunc);
        if (!checkIsRunning()) return;
        MainLoop.scheduler()
    };
    if (!noSetTiming) {
        if (fps > 0) {
            _emscripten_set_main_loop_timing(0, 1e3 / fps)
        } else {
            _emscripten_set_main_loop_timing(1, 1)
        }
        MainLoop.scheduler()
    }
    if (simulateInfiniteLoop) {
        throw "unwind"
    }
};
var MainLoop = {
    running: false,
    scheduler: null,
    method: "",
    currentlyRunningMainloop: 0,
    func: null,
    arg: 0,
    timingMode: 0,
    timingValue: 0,
    currentFrameNumber: 0,
    queue: [],
    preMainLoop: [],
    postMainLoop: [],
    pause() {
        MainLoop.scheduler = null;
        MainLoop.currentlyRunningMainloop++
    },
    resume() {
        MainLoop.currentlyRunningMainloop++;
        var timingMode = MainLoop.timingMode;
        var timingValue = MainLoop.timingValue;
        var func = MainLoop.func;
        MainLoop.func = null;
        setMainLoop(func, 0, false, MainLoop.arg, true);
        _emscripten_set_main_loop_timing(timingMode, timingValue);
        MainLoop.scheduler()
    },
    updateStatus() {
        if (Module["setStatus"]) {
            var message = Module["statusMessage"] || "Please wait...";
            var remaining = MainLoop.remainingBlockers ?? 0;
            var expected = MainLoop.expectedBlockers ?? 0;
            if (remaining) {
                if (remaining < expected) {
                    Module["setStatus"](`{message} ({expected - remaining}/{expected})`)
                } else {
                    Module["setStatus"](message)
                }
            } else {
                Module["setStatus"]("")
            }
        }
    },
    init() {
        Module["preMainLoop"] && MainLoop.preMainLoop.push(Module["preMainLoop"]);
        Module["postMainLoop"] && MainLoop.postMainLoop.push(Module["postMainLoop"])
    },
    runIter(func) {
        if (ABORT) return;
        for (var pre of MainLoop.preMainLoop) {
            if (pre() === false) {
                return
            }
        }
        callUserCallback(func);
        for (var post of MainLoop.postMainLoop) {
            post()
        }
    },
    nextRAF: 0,
    fakeRequestAnimationFrame(func) {
        var now = Date.now();
        if (MainLoop.nextRAF === 0) {
            MainLoop.nextRAF = now + 1e3 / 60
        } else {
            while (now + 2 >= MainLoop.nextRAF) {
                MainLoop.nextRAF += 1e3 / 60
            }
        }
        var delay = Math.max(MainLoop.nextRAF - now, 0);
        setTimeout(func, delay)
    },
    requestAnimationFrame(func) {
        if (typeof requestAnimationFrame == "function") {
            requestAnimationFrame(func);
            return
        }
        var RAF = MainLoop.fakeRequestAnimationFrame;
        RAF(func)
    }
};
var safeRequestAnimationFrame = func => MainLoop.requestAnimationFrame(() => {
    callUserCallback(func)
});
var wasmTable;
var getWasmTableEntry = funcPtr => wasmTable.get(funcPtr);
var _emscripten_async_call = (func, arg, millis) => {
    var wrapper = () => getWasmTableEntry(func)(arg);
    if (millis >= 0 || ENVIRONMENT_IS_NODE) {
        safeSetTimeout(wrapper, millis)
    } else {
        safeRequestAnimationFrame(wrapper)
    }
};
var _emscripten_pause_main_loop = () => MainLoop.pause();
var getHeapMax = () => 2147483648;
var growMemory = size => {
    var b = wasmMemory.buffer;
    var pages = (size - b.byteLength + 65535) / 65536 | 0;
    try {
        wasmMemory.grow(pages);
        updateMemoryViews();
        return 1
    } catch (e) {}
};
var _emscripten_resize_heap = requestedSize => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
        return false
    }
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
        var replacement = growMemory(newSize);
        if (replacement) {
            return true
        }
    }
    return false
};
var _emscripten_resume_main_loop = () => MainLoop.resume();
var _emscripten_run_script_string = ptr => {
    var s = eval(UTF8ToString(ptr));
    if (s == null) {
        return 0
    }
    s += "";
    var me = _emscripten_run_script_string;
    var len = lengthBytesUTF8(s);
    if (!me.bufferSize || me.bufferSize < len + 1) {
        if (me.bufferSize) _free(me.buffer);
        me.bufferSize = len + 1;
        me.buffer = _malloc(me.bufferSize)
    }
    stringToUTF8(s, me.buffer, me.bufferSize);
    return me.buffer
};
var maybeCStringToJsString = cString => cString > 2 ? UTF8ToString(cString) : cString;
var specialHTMLTargets = [0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0];
var findEventTarget = target => {
    target = maybeCStringToJsString(target);
    var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : null);
    return domElement
};
var findCanvasEventTarget = findEventTarget;
var _emscripten_set_canvas_element_size = (target, width, height) => {
    var canvas = findCanvasEventTarget(target);
    if (!canvas) return -4;
    canvas.width = width;
    canvas.height = height;
    return 0
};
var JSEvents = {
    memcpy(target, src, size) {
        HEAP8.set(HEAP8.subarray(src, src + size), target)
    },
    removeAllEventListeners() {
        while (JSEvents.eventHandlers.length) {
            JSEvents._removeHandler(JSEvents.eventHandlers.length - 1)
        }
        JSEvents.deferredCalls = []
    },
    inEventHandler: 0,
    deferredCalls: [],
    deferCall(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length) return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i]) return false
            }
            return true
        }
        for (var call of JSEvents.deferredCalls) {
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return
            }
        }
        JSEvents.deferredCalls.push({
            targetFunction,
            precedence,
            argsList
        });
        JSEvents.deferredCalls.sort((x, y) => x.precedence < y.precedence)
    },
    removeDeferredCalls(targetFunction) {
        JSEvents.deferredCalls = JSEvents.deferredCalls.filter(call => call.targetFunction != targetFunction)
    },
    canPerformEventHandlerRequests() {
        if (navigator.userActivation) {
            return navigator.userActivation.isActive
        }
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
    },
    runDeferredCalls() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return
        }
        var deferredCalls = JSEvents.deferredCalls;
        JSEvents.deferredCalls = [];
        for (var call of deferredCalls) {
            call.targetFunction(...call.argsList)
        }
    },
    eventHandlers: [],
    removeAllHandlersOnTarget: (target, eventTypeString) => {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                JSEvents._removeHandler(i--)
            }
        }
    },
    _removeHandler(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1)
    },
    registerOrRemoveHandler(eventHandler) {
        if (!eventHandler.target) {
            return -4
        }
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = function(event) {
                ++JSEvents.inEventHandler;
                JSEvents.currentEventHandler = eventHandler;
                JSEvents.runDeferredCalls();
                eventHandler.handlerFunc(event);
                JSEvents.runDeferredCalls();
                --JSEvents.inEventHandler
            };
            eventHandler.target.addEventListener(eventHandler.eventTypeString, eventHandler.eventListenerFunc, eventHandler.useCapture);
            JSEvents.eventHandlers.push(eventHandler)
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                    JSEvents._removeHandler(i--)
                }
            }
        }
        return 0
    },
    getNodeNameForTarget(target) {
        if (!target) return "";
        if (target == window) return "#window";
        if (target == screen) return "#screen";
        return target?.nodeName || ""
    },
    fullscreenEnabled() {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled
    }
};
var registerKeyEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
    JSEvents.keyEvent ||= _malloc(160);
    var keyEventHandlerFunc = e => {
        var keyEventData = JSEvents.keyEvent;
        HEAPF64[keyEventData >> 3] = e.timeStamp;
        var idx = keyEventData >> 2;
        HEAP32[idx + 2] = e.location;
        HEAP8[keyEventData + 12] = e.ctrlKey;
        HEAP8[keyEventData + 13] = e.shiftKey;
        HEAP8[keyEventData + 14] = e.altKey;
        HEAP8[keyEventData + 15] = e.metaKey;
        HEAP8[keyEventData + 16] = e.repeat;
        HEAP32[idx + 5] = e.charCode;
        HEAP32[idx + 6] = e.keyCode;
        HEAP32[idx + 7] = e.which;
        stringToUTF8(e.key || "", keyEventData + 32, 32);
        stringToUTF8(e.code || "", keyEventData + 64, 32);
        stringToUTF8(e.char || "", keyEventData + 96, 32);
        stringToUTF8(e.locale || "", keyEventData + 128, 32);
        if (getWasmTableEntry(callbackfunc)(eventTypeId, keyEventData, userData)) e.preventDefault()
    };
    var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        callbackfunc,
        handlerFunc: keyEventHandlerFunc,
        useCapture
    };
    return JSEvents.registerOrRemoveHandler(eventHandler)
};
var _emscripten_set_keydown_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
var _emscripten_set_keyup_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
    var iterFunc = getWasmTableEntry(func);
    setMainLoop(iterFunc, fps, simulateInfiniteLoop)
};
var getBoundingClientRect = e => specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {
    left: 0,
    top: 0
};
var fillMouseEventData = (eventStruct, e, target) => {
    HEAPF64[eventStruct >> 3] = e.timeStamp;
    var idx = eventStruct >> 2;
    HEAP32[idx + 2] = e.screenX;
    HEAP32[idx + 3] = e.screenY;
    HEAP32[idx + 4] = e.clientX;
    HEAP32[idx + 5] = e.clientY;
    HEAP8[eventStruct + 24] = e.ctrlKey;
    HEAP8[eventStruct + 25] = e.shiftKey;
    HEAP8[eventStruct + 26] = e.altKey;
    HEAP8[eventStruct + 27] = e.metaKey;
    HEAP16[idx * 2 + 14] = e.button;
    HEAP16[idx * 2 + 15] = e.buttons;
    HEAP32[idx + 8] = e["movementX"];
    HEAP32[idx + 9] = e["movementY"];
    var rect = getBoundingClientRect(target);
    HEAP32[idx + 10] = e.clientX - (rect.left | 0);
    HEAP32[idx + 11] = e.clientY - (rect.top | 0)
};
var registerMouseEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
    JSEvents.mouseEvent ||= _malloc(64);
    target = findEventTarget(target);
    var mouseEventHandlerFunc = (e = event) => {
        fillMouseEventData(JSEvents.mouseEvent, e, target);
        if (getWasmTableEntry(callbackfunc)(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault()
    };
    var eventHandler = {
        target,
        allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
        eventTypeString,
        callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture
    };
    return JSEvents.registerOrRemoveHandler(eventHandler)
};
var _emscripten_set_mousedown_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
var _emscripten_set_mousemove_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
var _emscripten_set_mouseup_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
var registerTouchEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
    JSEvents.touchEvent ||= _malloc(1552);
    target = findEventTarget(target);
    var touchEventHandlerFunc = e => {
        var t, touches = {},
            et = e.touches;
        for (let t of et) {
            t.isChanged = t.onTarget = 0;
            touches[t.identifier] = t
        }
        for (let t of e.changedTouches) {
            t.isChanged = 1;
            touches[t.identifier] = t
        }
        for (let t of e.targetTouches) {
            touches[t.identifier].onTarget = 1
        }
        var touchEvent = JSEvents.touchEvent;
        HEAPF64[touchEvent >> 3] = e.timeStamp;
        HEAP8[touchEvent + 12] = e.ctrlKey;
        HEAP8[touchEvent + 13] = e.shiftKey;
        HEAP8[touchEvent + 14] = e.altKey;
        HEAP8[touchEvent + 15] = e.metaKey;
        var idx = touchEvent + 16;
        var targetRect = getBoundingClientRect(target);
        var numTouches = 0;
        for (let t of Object.values(touches)) {
            var idx32 = idx >> 2;
            HEAP32[idx32 + 0] = t.identifier;
            HEAP32[idx32 + 1] = t.screenX;
            HEAP32[idx32 + 2] = t.screenY;
            HEAP32[idx32 + 3] = t.clientX;
            HEAP32[idx32 + 4] = t.clientY;
            HEAP32[idx32 + 5] = t.pageX;
            HEAP32[idx32 + 6] = t.pageY;
            HEAP8[idx + 28] = t.isChanged;
            HEAP8[idx + 29] = t.onTarget;
            HEAP32[idx32 + 8] = t.clientX - (targetRect.left | 0);
            HEAP32[idx32 + 9] = t.clientY - (targetRect.top | 0);
            idx += 48;
            if (++numTouches > 31) {
                break
            }
        }
        HEAP32[touchEvent + 8 >> 2] = numTouches;
        if (getWasmTableEntry(callbackfunc)(eventTypeId, touchEvent, userData)) e.preventDefault()
    };
    var eventHandler = {
        target,
        allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
        eventTypeString,
        callbackfunc,
        handlerFunc: touchEventHandlerFunc,
        useCapture
    };
    return JSEvents.registerOrRemoveHandler(eventHandler)
};
var _emscripten_set_touchcancel_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
var _emscripten_set_touchend_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
var _emscripten_set_touchmove_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
var _emscripten_set_touchstart_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
var GLctx;
var webgl_enable_ANGLE_instanced_arrays = ctx => {
    var ext = ctx.getExtension("ANGLE_instanced_arrays");
    if (ext) {
        ctx["vertexAttribDivisor"] = (index, divisor) => ext["vertexAttribDivisorANGLE"](index, divisor);
        ctx["drawArraysInstanced"] = (mode, first, count, primcount) => ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
        ctx["drawElementsInstanced"] = (mode, count, type, indices, primcount) => ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
        return 1
    }
};
var webgl_enable_OES_vertex_array_object = ctx => {
    var ext = ctx.getExtension("OES_vertex_array_object");
    if (ext) {
        ctx["createVertexArray"] = () => ext["createVertexArrayOES"]();
        ctx["deleteVertexArray"] = vao => ext["deleteVertexArrayOES"](vao);
        ctx["bindVertexArray"] = vao => ext["bindVertexArrayOES"](vao);
        ctx["isVertexArray"] = vao => ext["isVertexArrayOES"](vao);
        return 1
    }
};
var webgl_enable_WEBGL_draw_buffers = ctx => {
    var ext = ctx.getExtension("WEBGL_draw_buffers");
    if (ext) {
        ctx["drawBuffers"] = (n, bufs) => ext["drawBuffersWEBGL"](n, bufs);
        return 1
    }
};
var webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance = ctx => !!(ctx.dibvbi = ctx.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"));
var webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance = ctx => !!(ctx.mdibvbi = ctx.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance"));
var webgl_enable_EXT_polygon_offset_clamp = ctx => !!(ctx.extPolygonOffsetClamp = ctx.getExtension("EXT_polygon_offset_clamp"));
var webgl_enable_EXT_clip_control = ctx => !!(ctx.extClipControl = ctx.getExtension("EXT_clip_control"));
var webgl_enable_WEBGL_polygon_mode = ctx => !!(ctx.webglPolygonMode = ctx.getExtension("WEBGL_polygon_mode"));
var webgl_enable_WEBGL_multi_draw = ctx => !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));
var getEmscriptenSupportedExtensions = ctx => {
    var supportedExtensions = ["ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_disjoint_timer_query", "EXT_frag_depth", "EXT_shader_texture_lod", "EXT_sRGB", "OES_element_index_uint", "OES_fbo_render_mipmap", "OES_standard_derivatives", "OES_texture_float", "OES_texture_half_float", "OES_texture_half_float_linear", "OES_vertex_array_object", "WEBGL_color_buffer_float", "WEBGL_depth_texture", "WEBGL_draw_buffers", "EXT_color_buffer_float", "EXT_conservative_depth", "EXT_disjoint_timer_query_webgl2", "EXT_texture_norm16", "NV_shader_noperspective_interpolation", "WEBGL_clip_cull_distance", "EXT_clip_control", "EXT_color_buffer_half_float", "EXT_depth_clamp", "EXT_float_blend", "EXT_polygon_offset_clamp", "EXT_texture_compression_bptc", "EXT_texture_compression_rgtc", "EXT_texture_filter_anisotropic", "KHR_parallel_shader_compile", "OES_texture_float_linear", "WEBGL_blend_func_extended", "WEBGL_compressed_texture_astc", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_etc1", "WEBGL_compressed_texture_s3tc", "WEBGL_compressed_texture_s3tc_srgb", "WEBGL_debug_renderer_info", "WEBGL_debug_shaders", "WEBGL_lose_context", "WEBGL_multi_draw", "WEBGL_polygon_mode"];
    return (ctx.getSupportedExtensions() || []).filter(ext => supportedExtensions.includes(ext))
};
var registerPreMainLoop = f => {
    typeof MainLoop != "undefined" && MainLoop.preMainLoop.push(f)
};
var GL = {
    counter: 1,
    buffers: [],
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    shaders: [],
    vaos: [],
    contexts: [],
    offscreenCanvases: {},
    queries: [],
    samplers: [],
    transformFeedbacks: [],
    syncs: [],
    byteSizeByTypeRoot: 5120,
    byteSizeByType: [1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8],
    stringCache: {},
    stringiCache: {},
    unpackAlignment: 4,
    unpackRowLength: 0,
    recordError: errorCode => {
        if (!GL.lastError) {
            GL.lastError = errorCode
        }
    },
    getNewId: table => {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null
        }
        while (table[ret]) {
            ret = GL.counter++
        }
        return ret
    },
    genObject: (n, buffers, createFunction, objectTable) => {
        for (var i = 0; i < n; i++) {
            var buffer = GLctx[createFunction]();
            var id = buffer && GL.getNewId(objectTable);
            if (buffer) {
                buffer.name = id;
                objectTable[id] = buffer
            } else {
                GL.recordError(1282)
            }
            HEAP32[buffers + i * 4 >> 2] = id
        }
    },
    MAX_TEMP_BUFFER_SIZE: 2097152,
    numTempVertexBuffersPerSize: 64,
    log2ceilLookup: i => 32 - Math.clz32(i === 0 ? 0 : i - 1),
    generateTempBuffers: (quads, context) => {
        var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
        context.tempVertexBufferCounters1 = [];
        context.tempVertexBufferCounters2 = [];
        context.tempVertexBufferCounters1.length = context.tempVertexBufferCounters2.length = largestIndex + 1;
        context.tempVertexBuffers1 = [];
        context.tempVertexBuffers2 = [];
        context.tempVertexBuffers1.length = context.tempVertexBuffers2.length = largestIndex + 1;
        context.tempIndexBuffers = [];
        context.tempIndexBuffers.length = largestIndex + 1;
        for (var i = 0; i <= largestIndex; ++i) {
            context.tempIndexBuffers[i] = null;
            context.tempVertexBufferCounters1[i] = context.tempVertexBufferCounters2[i] = 0;
            var ringbufferLength = GL.numTempVertexBuffersPerSize;
            context.tempVertexBuffers1[i] = [];
            context.tempVertexBuffers2[i] = [];
            var ringbuffer1 = context.tempVertexBuffers1[i];
            var ringbuffer2 = context.tempVertexBuffers2[i];
            ringbuffer1.length = ringbuffer2.length = ringbufferLength;
            for (var j = 0; j < ringbufferLength; ++j) {
                ringbuffer1[j] = ringbuffer2[j] = null
            }
        }
        if (quads) {
            context.tempQuadIndexBuffer = GLctx.createBuffer();
            context.GLctx.bindBuffer(34963, context.tempQuadIndexBuffer);
            var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
            var quadIndexes = new Uint16Array(numIndexes);
            var i = 0,
                v = 0;
            while (1) {
                quadIndexes[i++] = v;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 1;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 2;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 2;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 3;
                if (i >= numIndexes) break;
                v += 4
            }
            context.GLctx.bufferData(34963, quadIndexes, 35044);
            context.GLctx.bindBuffer(34963, null)
        }
    },
    getTempVertexBuffer: sizeBytes => {
        var idx = GL.log2ceilLookup(sizeBytes);
        var ringbuffer = GL.currentContext.tempVertexBuffers1[idx];
        var nextFreeBufferIndex = GL.currentContext.tempVertexBufferCounters1[idx];
        GL.currentContext.tempVertexBufferCounters1[idx] = GL.currentContext.tempVertexBufferCounters1[idx] + 1 & GL.numTempVertexBuffersPerSize - 1;
        var vbo = ringbuffer[nextFreeBufferIndex];
        if (vbo) {
            return vbo
        }
        var prevVBO = GLctx.getParameter(34964);
        ringbuffer[nextFreeBufferIndex] = GLctx.createBuffer();
        GLctx.bindBuffer(34962, ringbuffer[nextFreeBufferIndex]);
        GLctx.bufferData(34962, 1 << idx, 35048);
        GLctx.bindBuffer(34962, prevVBO);
        return ringbuffer[nextFreeBufferIndex]
    },
    getTempIndexBuffer: sizeBytes => {
        var idx = GL.log2ceilLookup(sizeBytes);
        var ibo = GL.currentContext.tempIndexBuffers[idx];
        if (ibo) {
            return ibo
        }
        var prevIBO = GLctx.getParameter(34965);
        GL.currentContext.tempIndexBuffers[idx] = GLctx.createBuffer();
        GLctx.bindBuffer(34963, GL.currentContext.tempIndexBuffers[idx]);
        GLctx.bufferData(34963, 1 << idx, 35048);
        GLctx.bindBuffer(34963, prevIBO);
        return GL.currentContext.tempIndexBuffers[idx]
    },
    newRenderingFrameStarted: () => {
        if (!GL.currentContext) {
            return
        }
        var vb = GL.currentContext.tempVertexBuffers1;
        GL.currentContext.tempVertexBuffers1 = GL.currentContext.tempVertexBuffers2;
        GL.currentContext.tempVertexBuffers2 = vb;
        vb = GL.currentContext.tempVertexBufferCounters1;
        GL.currentContext.tempVertexBufferCounters1 = GL.currentContext.tempVertexBufferCounters2;
        GL.currentContext.tempVertexBufferCounters2 = vb;
        var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
        for (var i = 0; i <= largestIndex; ++i) {
            GL.currentContext.tempVertexBufferCounters1[i] = 0
        }
    },
    getSource: (shader, count, string, length) => {
        var source = "";
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAPU32[length + i * 4 >> 2] : undefined;
            source += UTF8ToString(HEAPU32[string + i * 4 >> 2], len)
        }
        return source
    },
    calcBufLength: (size, type, stride, count) => {
        if (stride > 0) {
            return count * stride
        }
        var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
        return size * typeSize * count
    },
    usedTempBuffers: [],
    preDrawHandleClientVertexAttribBindings: count => {
        GL.resetBufferBinding = false;
        for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
            var cb = GL.currentContext.clientBuffers[i];
            if (!cb.clientside || !cb.enabled) continue;
            GL.resetBufferBinding = true;
            var size = GL.calcBufLength(cb.size, cb.type, cb.stride, count);
            var buf = GL.getTempVertexBuffer(size);
            GLctx.bindBuffer(34962, buf);
            GLctx.bufferSubData(34962, 0, HEAPU8.subarray(cb.ptr, cb.ptr + size));
            cb.vertexAttribPointerAdaptor.call(GLctx, i, cb.size, cb.type, cb.normalized, cb.stride, 0)
        }
    },
    postDrawHandleClientVertexAttribBindings: () => {
        if (GL.resetBufferBinding) {
            GLctx.bindBuffer(34962, GL.buffers[GLctx.currentArrayBufferBinding])
        }
    },
    createContext: (canvas, webGLContextAttributes) => {
        if (!canvas.getContextSafariWebGL2Fixed) {
            canvas.getContextSafariWebGL2Fixed = canvas.getContext;

            function fixedGetContext(ver, attrs) {
                var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
                return ver == "webgl" == gl instanceof WebGLRenderingContext ? gl : null
            }
            canvas.getContext = fixedGetContext
        }
        var ctx = webGLContextAttributes.majorVersion > 1 ? canvas.getContext("webgl2", webGLContextAttributes) : canvas.getContext("webgl", webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle
    },
    registerContext: (ctx, webGLContextAttributes) => {
        var handle = GL.getNewId(GL.contexts);
        var context = {
            handle,
            attributes: webGLContextAttributes,
            version: webGLContextAttributes.majorVersion,
            GLctx: ctx
        };
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
            GL.initExtensions(context)
        }
        context.maxVertexAttribs = context.GLctx.getParameter(34921);
        context.clientBuffers = [];
        for (var i = 0; i < context.maxVertexAttribs; i++) {
            context.clientBuffers[i] = {
                enabled: false,
                clientside: false,
                size: 0,
                type: 0,
                normalized: 0,
                stride: 0,
                ptr: 0,
                vertexAttribPointerAdaptor: null
            }
        }
        GL.generateTempBuffers(false, context);
        return handle
    },
    makeContextCurrent: contextHandle => {
        GL.currentContext = GL.contexts[contextHandle];
        Module["ctx"] = GLctx = GL.currentContext?.GLctx;
        return !(contextHandle && !GLctx)
    },
    getContext: contextHandle => GL.contexts[contextHandle],
    deleteContext: contextHandle => {
        if (GL.currentContext === GL.contexts[contextHandle]) {
            GL.currentContext = null
        }
        if (typeof JSEvents == "object") {
            JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas)
        }
        if (GL.contexts[contextHandle]?.GLctx.canvas) {
            GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined
        }
        GL.contexts[contextHandle] = null
    },
    initExtensions: context => {
        context ||= GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        webgl_enable_WEBGL_multi_draw(GLctx);
        webgl_enable_EXT_polygon_offset_clamp(GLctx);
        webgl_enable_EXT_clip_control(GLctx);
        webgl_enable_WEBGL_polygon_mode(GLctx);
        webgl_enable_ANGLE_instanced_arrays(GLctx);
        webgl_enable_OES_vertex_array_object(GLctx);
        webgl_enable_WEBGL_draw_buffers(GLctx);
        webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
        webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
        if (context.version >= 2) {
            GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query_webgl2")
        }
        if (context.version < 2 || !GLctx.disjointTimerQueryExt) {
            GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query")
        }
        getEmscriptenSupportedExtensions(GLctx).forEach(ext => {
            if (!ext.includes("lose_context") && !ext.includes("debug")) {
                GLctx.getExtension(ext)
            }
        })
    }
};
var webglPowerPreferences = ["default", "low-power", "high-performance"];
var _emscripten_webgl_do_create_context = (target, attributes) => {
    var attr32 = attributes >> 2;
    var powerPreference = HEAP32[attr32 + (8 >> 2)];
    var contextAttributes = {
        alpha: !!HEAP8[attributes + 0],
        depth: !!HEAP8[attributes + 1],
        stencil: !!HEAP8[attributes + 2],
        antialias: !!HEAP8[attributes + 3],
        premultipliedAlpha: !!HEAP8[attributes + 4],
        preserveDrawingBuffer: !!HEAP8[attributes + 5],
        powerPreference: webglPowerPreferences[powerPreference],
        failIfMajorPerformanceCaveat: !!HEAP8[attributes + 12],
        majorVersion: HEAP32[attr32 + (16 >> 2)],
        minorVersion: HEAP32[attr32 + (20 >> 2)],
        enableExtensionsByDefault: HEAP8[attributes + 24],
        explicitSwapControl: HEAP8[attributes + 25],
        proxyContextToMainThread: HEAP32[attr32 + (28 >> 2)],
        renderViaOffscreenBackBuffer: HEAP8[attributes + 32]
    };
    var canvas = findCanvasEventTarget(target);
    if (!canvas) {
        return 0
    }
    if (contextAttributes.explicitSwapControl) {
        return 0
    }
    var contextHandle = GL.createContext(canvas, contextAttributes);
    return contextHandle
};
var _emscripten_webgl_create_context = _emscripten_webgl_do_create_context;
var _emscripten_webgl_make_context_current = contextHandle => {
    var success = GL.makeContextCurrent(contextHandle);
    return success ? 0 : -5
};
var ENV = {};
var getExecutableName = () => thisProgram || "./this.program";
var getEnvStrings = () => {
    if (!getEnvStrings.strings) {
        var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
        var env = {
            USER: "web_user",
            LOGNAME: "web_user",
            PATH: "/",
            PWD: "/",
            HOME: "/home/web_user",
            LANG: lang,
            _: getExecutableName()
        };
        for (var x in ENV) {
            if (ENV[x] === undefined) delete env[x];
            else env[x] = ENV[x]
        }
        var strings = [];
        for (var x in env) {
            strings.push(`${x}=${env[x]}`)
        }
        getEnvStrings.strings = strings
    }
    return getEnvStrings.strings
};
var stringToAscii = (str, buffer) => {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++] = str.charCodeAt(i)
    }
    HEAP8[buffer] = 0
};
var _environ_get = (__environ, environ_buf) => {
    var bufSize = 0;
    getEnvStrings().forEach((string, i) => {
        var ptr = environ_buf + bufSize;
        HEAPU32[__environ + i * 4 >> 2] = ptr;
        stringToAscii(string, ptr);
        bufSize += string.length + 1
    });
    return 0
};
var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
    var strings = getEnvStrings();
    HEAPU32[penviron_count >> 2] = strings.length;
    var bufSize = 0;
    strings.forEach(string => bufSize += string.length + 1);
    HEAPU32[penviron_buf_size >> 2] = bufSize;
    return 0
};

function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno
    }
}
var doReadv = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[iov + 4 >> 2];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break;
        if (typeof offset != "undefined") {
            offset += curr
        }
    }
    return ret
};

function _fd_read(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doReadv(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno
    }
}

function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    try {
        if (isNaN(offset)) return 61;
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.llseek(stream, offset, whence);
        HEAP64[newOffset >> 3] = BigInt(stream.position);
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno
    }
}
var doWritev = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[iov + 4 >> 2];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) {
            break
        }
        if (typeof offset != "undefined") {
            offset += curr
        }
    }
    return ret
};

function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doWritev(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno
    }
}
var _glAttachShader = (program, shader) => {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader])
};
var _glBindTexture = (target, texture) => {
    GLctx.bindTexture(target, GL.textures[texture])
};
var _glBlendFunc = (x0, x1) => GLctx.blendFunc(x0, x1);
var _glClear = x0 => GLctx.clear(x0);
var _glCompileShader = shader => {
    GLctx.compileShader(GL.shaders[shader])
};
var _glCompressedTexImage2D = (target, level, internalFormat, width, height, border, imageSize, data) => {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
            GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data);
            return
        }
        GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, HEAPU8, data, imageSize);
        return
    }
    GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, HEAPU8.subarray(data, data + imageSize))
};
var _glCreateProgram = () => {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
    program.uniformIdCounter = 1;
    GL.programs[id] = program;
    return id
};
var _glCreateShader = shaderType => {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id
};
var _glDeleteBuffers = (n, buffers) => {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[buffers + i * 4 >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GLctx.currentArrayBufferBinding) GLctx.currentArrayBufferBinding = 0;
        if (id == GLctx.currentElementArrayBufferBinding) GLctx.currentElementArrayBufferBinding = 0;
        if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0
    }
};
var _glDeleteProgram = id => {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null
};
var _glDeleteShader = id => {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null
};
var _glDeleteTextures = (n, textures) => {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[textures + i * 4 >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null
    }
};
var _glDisable = x0 => GLctx.disable(x0);
var _glDisableVertexAttribArray = index => {
    var cb = GL.currentContext.clientBuffers[index];
    cb.enabled = false;
    GLctx.disableVertexAttribArray(index)
};
var _glDrawArrays = (mode, first, count) => {
    GL.preDrawHandleClientVertexAttribBindings(first + count);
    GLctx.drawArrays(mode, first, count);
    GL.postDrawHandleClientVertexAttribBindings()
};
var _glDrawElements = (mode, count, type, indices) => {
    var buf;
    var vertexes = 0;
    if (!GLctx.currentElementArrayBufferBinding) {
        var size = GL.calcBufLength(1, type, 0, count);
        buf = GL.getTempIndexBuffer(size);
        GLctx.bindBuffer(34963, buf);
        GLctx.bufferSubData(34963, 0, HEAPU8.subarray(indices, indices + size));
        if (count > 0) {
            for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
                var cb = GL.currentContext.clientBuffers[i];
                if (cb.clientside && cb.enabled) {
                    let arrayClass;
                    switch (type) {
                        case 5121:
                            arrayClass = Uint8Array;
                            break;
                        case 5123:
                            arrayClass = Uint16Array;
                            break;
                        default:
                            GL.recordError(1282);
                            return
                    }
                    vertexes = new arrayClass(HEAPU8.buffer, indices, count).reduce((max, current) => Math.max(max, current)) + 1;
                    break
                }
            }
        }
        indices = 0
    }
    GL.preDrawHandleClientVertexAttribBindings(vertexes);
    GLctx.drawElements(mode, count, type, indices);
    GL.postDrawHandleClientVertexAttribBindings(count);
    if (!GLctx.currentElementArrayBufferBinding) {
        GLctx.bindBuffer(34963, null)
    }
};
var _glEnable = x0 => GLctx.enable(x0);
var _glEnableVertexAttribArray = index => {
    var cb = GL.currentContext.clientBuffers[index];
    cb.enabled = true;
    GLctx.enableVertexAttribArray(index)
};
var _glGenBuffers = (n, buffers) => {
    GL.genObject(n, buffers, "createBuffer", GL.buffers)
};
var _glGenTextures = (n, textures) => {
    GL.genObject(n, textures, "createTexture", GL.textures)
};
var _glGetAttribLocation = (program, name) => GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
var writeI53ToI64 = (ptr, num) => {
    HEAPU32[ptr >> 2] = num;
    var lower = HEAPU32[ptr >> 2];
    HEAPU32[ptr + 4 >> 2] = (num - lower) / 4294967296
};
var webglGetExtensions = () => {
    var exts = getEmscriptenSupportedExtensions(GLctx);
    exts = exts.concat(exts.map(e => "GL_" + e));
    return exts
};
var emscriptenWebGLGet = (name_, p, type) => {
    if (!p) {
        GL.recordError(1281);
        return
    }
    var ret = undefined;
    switch (name_) {
        case 36346:
            ret = 1;
            break;
        case 36344:
            if (type != 0 && type != 1) {
                GL.recordError(1280)
            }
            return;
        case 34814:
        case 36345:
            ret = 0;
            break;
        case 34466:
            var formats = GLctx.getParameter(34467);
            ret = formats ? formats.length : 0;
            break;
        case 33309:
            if (GL.currentContext.version < 2) {
                GL.recordError(1282);
                return
            }
            ret = webglGetExtensions().length;
            break;
        case 33307:
        case 33308:
            if (GL.currentContext.version < 2) {
                GL.recordError(1280);
                return
            }
            ret = name_ == 33307 ? 3 : 0;
            break
    }
    if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
            case "number":
                ret = result;
                break;
            case "boolean":
                ret = result ? 1 : 0;
                break;
            case "string":
                GL.recordError(1280);
                return;
            case "object":
                if (result === null) {
                    switch (name_) {
                        case 34964:
                        case 35725:
                        case 34965:
                        case 36006:
                        case 36007:
                        case 32873:
                        case 34229:
                        case 36662:
                        case 36663:
                        case 35053:
                        case 35055:
                        case 36010:
                        case 35097:
                        case 35869:
                        case 32874:
                        case 36389:
                        case 35983:
                        case 35368:
                        case 34068: {
                            ret = 0;
                            break
                        }
                        default: {
                            GL.recordError(1280);
                            return
                        }
                    }
                } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                    for (var i = 0; i < result.length; ++i) {
                        switch (type) {
                            case 0:
                                HEAP32[p + i * 4 >> 2] = result[i];
                                break;
                            case 2:
                                HEAPF32[p + i * 4 >> 2] = result[i];
                                break;
                            case 4:
                                HEAP8[p + i] = result[i] ? 1 : 0;
                                break
                        }
                    }
                    return
                } else {
                    try {
                        ret = result.name | 0
                    } catch (e) {
                        GL.recordError(1280);
                        err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
                        return
                    }
                }
                break;
            default:
                GL.recordError(1280);
                err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof result}!`);
                return
        }
    }
    switch (type) {
        case 1:
            writeI53ToI64(p, ret);
            break;
        case 0:
            HEAP32[p >> 2] = ret;
            break;
        case 2:
            HEAPF32[p >> 2] = ret;
            break;
        case 4:
            HEAP8[p] = ret ? 1 : 0;
            break
    }
};
var _glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);
var _glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
};
var _glGetProgramiv = (program, pname, p) => {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return
    }
    program = GL.programs[program];
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(program);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35719) {
        if (!program.maxUniformLength) {
            var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
            for (var i = 0; i < numActiveUniforms; ++i) {
                program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1)
            }
        }
        HEAP32[p >> 2] = program.maxUniformLength
    } else if (pname == 35722) {
        if (!program.maxAttributeLength) {
            var numActiveAttributes = GLctx.getProgramParameter(program, 35721);
            for (var i = 0; i < numActiveAttributes; ++i) {
                program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1)
            }
        }
        HEAP32[p >> 2] = program.maxAttributeLength
    } else if (pname == 35381) {
        if (!program.maxUniformBlockNameLength) {
            var numActiveUniformBlocks = GLctx.getProgramParameter(program, 35382);
            for (var i = 0; i < numActiveUniformBlocks; ++i) {
                program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1)
            }
        }
        HEAP32[p >> 2] = program.maxUniformBlockNameLength
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname)
    }
};
var _glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
};
var _glGetShaderiv = (shader, pname, p) => {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        var logLength = log ? log.length + 1 : 0;
        HEAP32[p >> 2] = logLength
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[p >> 2] = sourceLength
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
    }
};
var stringToNewUTF8 = str => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8(str, ret, size);
    return ret
};
var _glGetString = name_ => {
    var ret = GL.stringCache[name_];
    if (!ret) {
        switch (name_) {
            case 7939:
                ret = stringToNewUTF8(webglGetExtensions().join(" "));
                break;
            case 7936:
            case 7937:
            case 37445:
            case 37446:
                var s = GLctx.getParameter(name_);
                if (!s) {
                    GL.recordError(1280)
                }
                ret = s ? stringToNewUTF8(s) : 0;
                break;
            case 7938:
                var webGLVersion = GLctx.getParameter(7938);
                var glVersion = `OpenGL ES 2.0 (${webGLVersion})`;
                if (GL.currentContext.version >= 2) glVersion = `OpenGL ES 3.0 (${webGLVersion})`;
                ret = stringToNewUTF8(glVersion);
                break;
            case 35724:
                var glslVersion = GLctx.getParameter(35724);
                var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
                var ver_num = glslVersion.match(ver_re);
                if (ver_num !== null) {
                    if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                    glslVersion = `OpenGL ES GLSL ES ${ver_num[1]} (${glslVersion})`
                }
                ret = stringToNewUTF8(glslVersion);
                break;
            default:
                GL.recordError(1280)
        }
        GL.stringCache[name_] = ret
    }
    return ret
};
var jstoi_q = str => parseInt(str);
var webglGetLeftBracePos = name => name.slice(-1) == "]" && name.lastIndexOf("[");
var webglPrepareUniformLocationsBeforeFirstUse = program => {
    var uniformLocsById = program.uniformLocsById,
        uniformSizeAndIdsByName = program.uniformSizeAndIdsByName,
        i, j;
    if (!uniformLocsById) {
        program.uniformLocsById = uniformLocsById = {};
        program.uniformArrayNamesById = {};
        var numActiveUniforms = GLctx.getProgramParameter(program, 35718);
        for (i = 0; i < numActiveUniforms; ++i) {
            var u = GLctx.getActiveUniform(program, i);
            var nm = u.name;
            var sz = u.size;
            var lb = webglGetLeftBracePos(nm);
            var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
            var id = program.uniformIdCounter;
            program.uniformIdCounter += sz;
            uniformSizeAndIdsByName[arrayName] = [sz, id];
            for (j = 0; j < sz; ++j) {
                uniformLocsById[id] = j;
                program.uniformArrayNamesById[id++] = arrayName
            }
        }
    }
};
var _glGetUniformLocation = (program, name) => {
    name = UTF8ToString(name);
    if (program = GL.programs[program]) {
        webglPrepareUniformLocationsBeforeFirstUse(program);
        var uniformLocsById = program.uniformLocsById;
        var arrayIndex = 0;
        var uniformBaseName = name;
        var leftBrace = webglGetLeftBracePos(name);
        if (leftBrace > 0) {
            arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
            uniformBaseName = name.slice(0, leftBrace)
        }
        var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
        if (sizeAndId && arrayIndex < sizeAndId[0]) {
            arrayIndex += sizeAndId[1];
            if (uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name)) {
                return arrayIndex
            }
        }
    } else {
        GL.recordError(1281)
    }
    return -1
};
var _glLineWidth = x0 => GLctx.lineWidth(x0);
var _glLinkProgram = program => {
    program = GL.programs[program];
    GLctx.linkProgram(program);
    program.uniformLocsById = 0;
    program.uniformSizeAndIdsByName = {}
};
var _glScissor = (x0, x1, x2, x3) => GLctx.scissor(x0, x1, x2, x3);
var _glShaderSource = (shader, count, string, length) => {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source)
};
var computeUnpackAlignedImageSize = (width, height, sizePerPixel) => {
    function roundedToNextMultipleOf(x, y) {
        return x + y - 1 & -y
    }
    var plainRowSize = (GL.unpackRowLength || width) * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, GL.unpackAlignment);
    return height * alignedRowSize
};
var colorChannelsInGlTextureFormat = format => {
    var colorChannels = {
        5: 3,
        6: 4,
        8: 2,
        29502: 3,
        29504: 4,
        26917: 2,
        26918: 2,
        29846: 3,
        29847: 4
    };
    return colorChannels[format - 6402] || 1
};
var heapObjectForWebGLType = type => {
    type -= 5120;
    if (type == 0) return HEAP8;
    if (type == 1) return HEAPU8;
    if (type == 2) return HEAP16;
    if (type == 4) return HEAP32;
    if (type == 6) return HEAPF32;
    if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782) return HEAPU32;
    return HEAPU16
};
var toTypedArrayIndex = (pointer, heap) => pointer >>> 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
    var heap = heapObjectForWebGLType(type);
    var sizePerPixel = colorChannelsInGlTextureFormat(format) * heap.BYTES_PER_ELEMENT;
    var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel);
    return heap.subarray(toTypedArrayIndex(pixels, heap), toTypedArrayIndex(pixels + bytes, heap))
};
var _glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
            return
        }
        if (pixels) {
            var heap = heapObjectForWebGLType(type);
            var index = toTypedArrayIndex(pixels, heap);
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, index);
            return
        }
    }
    var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null;
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData)
};
var _glTexParameteri = (x0, x1, x2) => GLctx.texParameteri(x0, x1, x2);
var webglGetUniformLocation = location => {
    var p = GLctx.currentProgram;
    if (p) {
        var webglLoc = p.uniformLocsById[location];
        if (typeof webglLoc == "number") {
            p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ""))
        }
        return webglLoc
    } else {
        GL.recordError(1282)
    }
};
var _glUniform1i = (location, v0) => {
    GLctx.uniform1i(webglGetUniformLocation(location), v0)
};
var _glUniform4f = (location, v0, v1, v2, v3) => {
    GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3)
};
var miniTempWebGLFloatBuffers = [];
var _glUniformMatrix3fv = (location, count, transpose, value) => {
    if (GL.currentContext.version >= 2) {
        count && GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, HEAPF32, value >> 2, count * 9);
        return
    }
    if (count <= 32) {
        count *= 9;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 9) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
            view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
            view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
            view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
            view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
            view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2)
    }
    GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view)
};
var _glUseProgram = program => {
    program = GL.programs[program];
    GLctx.useProgram(program);
    GLctx.currentProgram = program
};
var _glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
    var cb = GL.currentContext.clientBuffers[index];
    if (!GLctx.currentArrayBufferBinding) {
        cb.size = size;
        cb.type = type;
        cb.normalized = normalized;
        cb.stride = stride;
        cb.ptr = ptr;
        cb.clientside = true;
        cb.vertexAttribPointerAdaptor = function(index, size, type, normalized, stride, ptr) {
            this.vertexAttribPointer(index, size, type, normalized, stride, ptr)
        };
        return
    }
    cb.clientside = false;
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
};
var _glViewport = (x0, x1, x2, x3) => GLctx.viewport(x0, x1, x2, x3);

function _random_get(buffer, size) {
    try {
        randomFill(HEAPU8.subarray(buffer, buffer + size));
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
        return e.errno
    }
}
var stackAlloc = sz => __emscripten_stack_alloc(sz);
var stringToUTF8OnStack = str => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret
};
var getCFunc = ident => {
    var func = Module["_" + ident];
    return func
};
var writeArrayToMemory = (array, buffer) => {
    HEAP8.set(array, buffer)
};
var ccall = (ident, returnType, argTypes, args, opts) => {
    var toC = {
        string: str => {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                ret = stringToUTF8OnStack(str)
            }
            return ret
        },
        array: arr => {
            var ret = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }
    };

    function convertReturnValue(ret) {
        if (returnType === "string") {
            return UTF8ToString(ret)
        }
        if (returnType === "boolean") return Boolean(ret);
        return ret
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
        for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
                if (stack === 0) stack = stackSave();
                cArgs[i] = converter(args[i])
            } else {
                cArgs[i] = args[i]
            }
        }
    }
    var ret = func(...cArgs);

    function onDone(ret) {
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret)
    }
    ret = onDone(ret);
    return ret
};
var FS_createPath = FS.createPath;
var FS_unlink = path => FS.unlink(path);
var FS_createLazyFile = FS.createLazyFile;
var FS_createDevice = FS.createDevice;
FS.createPreloadedFile = FS_createPreloadedFile;
FS.staticInit();
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_unlink"] = FS.unlink;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
MEMFS.doesNotExistError = new FS.ErrnoError(44);
MEMFS.doesNotExistError.stack = "<generic error, no stack>";
Module["requestAnimationFrame"] = MainLoop.requestAnimationFrame;
Module["pauseMainLoop"] = MainLoop.pause;
Module["resumeMainLoop"] = MainLoop.resume;
MainLoop.init();
registerPreMainLoop(() => GL.newRenderingFrameStarted());
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i <= 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i)
}
var ASM_CONSTS = {
    870644: () => {
        try {
            Module.__cacheReadyFlag = true
        } catch (e) {}
        try {
            if (typeof checkDoneFlagAndSet === "function") {
                checkDoneFlagAndSet()
            }
        } catch (e) {
            console.warn("[Cache] checkDoneFlagAndSet error", e)
        }
        try {
            if (typeof applyDeferredUntarIfPossible === "function") {
                applyDeferredUntarIfPossible()
            }
        } catch (e) {
            console.warn("[Cache] applyDeferredUntarIfPossible error", e)
        }
        try {
            if (typeof maybeStartMainLoopIfReady === "function") {
                maybeStartMainLoopIfReady()
            }
        } catch (e) {
            console.warn("[Cache] maybeStartMainLoopIfReady error", e)
        }
        try {
            if (typeof ensureLateLoadAssets === "function") {
                ensureLateLoadAssets()
            }
        } catch (e) {
            console.warn("[Cache] ensureLateLoadAssets error", e)
        }
    },
    871349: () => {
        try {
            var base = typeof idbBase === "function" ? idbBase() : "/idb_assets/";
            var mountPoint = base.endsWith("/") ? base.slice(0, -1) : base;
            try {
                FS.mkdirTree(mountPoint)
            } catch (e) {}
            FS.mount(IDBFS, {}, mountPoint);
            FS.syncfs(true, function(err) {
                if (err) {
                    console.warn("[Cache] syncfs(true) error", err)
                }
                if (typeof _setCacheReady === "function") {
                    _setCacheReady()
                }
            })
        } catch (e) {
            console.warn("[Cache] mount error", e);
            if (typeof _setCacheReady === "function") {
                _setCacheReady()
            }
        }
    },
    871858: $0 => {
        console.log("[GameController] onFamobiQuitGame() called, state=" + $0)
    },
    871934: $0 => {
        if (window.requestedResources) {
            window.requestedResources[UTF8ToString($0)] = true
        }
    },
    872025: $0 => {
        console.warn("Resource fallback not found for", UTF8ToString($0))
    },
    872096: () => {
        if (!window.requestedResources) {
            window.requestedResources = {};
            window.printRequestedResources = function() {
                var count = 0;
                for (var path in window.requestedResources) {
                    console.log(path);
                    count++
                }
                console.log("Всего ресурсов:", count)
            }
        }
    },
    872360: ($0, $1) => {
        var dest = UTF8ToString($0);
        var src = UTF8ToString($1);
        var idx = dest.lastIndexOf("/");
        if (idx > 0) {
            var dir = dest.substring(0, idx);
            try {
                FS.mkdirTree(dir)
            } catch (e) {}
        }
        try {
            FS.unlink(dest)
        } catch (e) {}
        try {
            FS.symlink(src, dest)
        } catch (e) {}
    },
    872627: () => {
        try {
            if (window.GameInterface && typeof window.GameInterface.sendPreloadProgress === "function") {
                window.GameInterface.sendPreloadProgress(100)
            }
        } catch (e) {}
    },
    872795: () => {
        try {
            if (window.GameInterface && typeof window.GameInterface.gameReady === "function") {
                window.GameInterface.gameReady()
            }
            try {
                var ovl = document.getElementById("x_ovl");
                if (ovl && ovl.parentNode) {
                    ovl.parentNode.removeChild(ovl)
                }
            } catch (_) {}
        } catch (e) {}
    },
    873068: $0 => {
        var path = UTF8ToString($0);
        try {
            var stat = FS.stat(path);
            return stat.size
        } catch (e) {
            return 0
        }
    },
    873176: ($0, $1, $2) => {
        var path = UTF8ToString($0);
        var ptr = $1;
        try {
            var data = FS.readFile(path);
            HEAPU8.set(data, ptr)
        } catch (e) {}
    },
    873312: () => {
        if (typeof GameInterface !== "undefined" && GameInterface.hasFeature) {
            var result = GameInterface.hasFeature("credits") ? 1 : 0;
            return result
        }
        return 1
    },
    873473: $0 => {
        var path = UTF8ToString($0);
        try {
            var stat = FS.stat(path);
            return stat.size
        } catch (e) {
            return 0
        }
    },
    873581: ($0, $1, $2) => {
        var path = UTF8ToString($0);
        var ptr = $1;
        try {
            var data = FS.readFile(path);
            HEAPU8.set(data, ptr)
        } catch (e) {}
    },
    873717: () => {
        if (typeof GameInterface !== "undefined" && GameInterface.hasFeature) {
            var result = GameInterface.hasFeature("copyright") ? 1 : 0;
            return result
        }
        return 1
    },
    873880: $0 => {
        var path = UTF8ToString($0);
        try {
            var stat = FS.stat(path);
            return stat.size
        } catch (e) {
            return 0
        }
    },
    873988: ($0, $1, $2) => {
        var path = UTF8ToString($0);
        var ptr = $1;
        try {
            var data = FS.readFile(path);
            HEAPU8.set(data, ptr)
        } catch (e) {}
    },
    874124: () => {
        var secretClickCount = 0;
        var lastClickTime = 0;
        var overlayVisible = false;
        Module.canvas.addEventListener("click", function(e) {
            var rect = Module.canvas.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width;
            var y = (e.clientY - rect.top) / rect.height;
            if (overlayVisible) {
                Module._hideSecretOverlay();
                overlayVisible = false;
                secretClickCount = 0;
                lastClickTime = 0;
                return
            }
            if (x < .1 && y > .9) {
                var currentTime = Date.now() / 1e3;
                if (lastClickTime > 0 && currentTime - lastClickTime > .5) {
                    secretClickCount = 0
                }
                secretClickCount++;
                lastClickTime = currentTime;
                if (secretClickCount >= 5) {
                    Module._showSecretOverlay();
                    overlayVisible = true;
                    secretClickCount = 0;
                    lastClickTime = 0
                }
            }
        })
    },
    874859: $0 => {
        var path = UTF8ToString($0);
        try {
            var stat = FS.stat(path);
            return stat.size
        } catch (e) {
            return 0
        }
    },
    874967: ($0, $1) => {
        var path = UTF8ToString($0);
        var ptr = $1;
        try {
            var data = FS.readFile(path);
            HEAPU8.set(data, ptr)
        } catch (e) {}
    },
    875087: () => {
        setTimeout(function() {
            Module._famobi_showad_scheduled()
        }, 5e3)
    },
    875160: () => {
        if (Module.zfAudioDisabled) return;
        if (!Module.zfAudio) {
            var AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
            if (!AC) {
                console.warn("[Audio] WebAudio unsupported");
                Module.zfAudio = null;
                return
            }
            var ctx = new AC;
            var audio = {};
            audio.ctx = ctx;
            try {
                audio.masterGain = ctx.createGain();
                audio.masterGain.gain.value = 1;
                audio.masterGain.connect(ctx.destination)
            } catch (e) {
                console.warn("[Audio] masterGain init failed", e)
            }
            audio.buffers = Object.create(null);
            audio.playing = Object.create(null);
            audio.musicVolume = 1;
            (function() {
                audio._fsReady = false;
                audio._fsWaiters = [];
                audio._pendingLoads = [];
                audio._syncScheduled = false;
                audio._idbRoot = "/idb";

                function ensureDir(p) {
                    try {
                        if (!p || p === "/") return;
                        var parts = p.split("/");
                        var cur = "";
                        for (var i = 0; i < parts.length; i++) {
                            var seg = parts[i];
                            if (!seg) continue;
                            cur += "/" + seg;
                            try {
                                FS.mkdir(cur)
                            } catch (_e) {}
                        }
                    } catch (e) {}
                }
                audio._ensureCacheDirs = function(url) {
                    try {
                        var idx = url.lastIndexOf("/");
                        var dir = idx >= 0 ? url.substring(0, idx) : "";
                        ensureDir(audio._idbRoot + "/" + dir)
                    } catch (_) {}
                };
                audio._scheduleSync = function() {
                    if (audio._syncScheduled) return;
                    audio._syncScheduled = true;
                    setTimeout(function() {
                        try {
                            FS.syncfs(false, function(_e) {
                                audio._syncScheduled = false
                            })
                        } catch (e) {
                            audio._syncScheduled = false
                        }
                    }, 250)
                };
                try {
                    try {
                        FS.mkdir(audio._idbRoot)
                    } catch (_e) {}
                    try {
                        FS.mount(IDBFS, {}, audio._idbRoot)
                    } catch (e) {
                        console.warn("[Audio] IDBFS mount failed", e)
                    }
                    FS.syncfs(true, function(err) {
                        if (err) console.warn("[Cache] syncfs(true) error", err);
                        audio._fsReady = true;
                        try {
                            var pend = audio._pendingLoads || [];
                            audio._pendingLoads = [];
                            for (var i = 0; i < pend.length; i++) {
                                try {
                                    audio.loadBufferWithFallback(pend[i].k, pend[i].cb)
                                } catch (_) {}
                            }
                        } catch (e) {}
                        try {
                            var w = audio._fsWaiters;
                            audio._fsWaiters = [];
                            for (var j = 0; j < w.length; j++) {
                                try {
                                    w[j]()
                                } catch (_) {}
                            }
                        } catch (e) {}
                    })
                } catch (e) {
                    console.warn("[Audio] IDBFS setup failed", e);
                    audio._fsReady = true
                }
            })();
            (function() {
                var el = null;
                try {
                    el = document.createElement("audio")
                } catch (_) {}

                function can(t) {
                    try {
                        return el && typeof el.canPlayType === "function" && !!el.canPlayType(t)
                    } catch (_) {
                        return false
                    }
                }
                var order = [];
                if (can('audio/ogg; codecs="vorbis"')) order.push("ogg");
                if (can('audio/mp4; codecs="mp4a.40.2"')) order.push("m4a");
                if (can("audio/mpeg")) order.push("mp3");
                order.push("wav");
                audio._extOrder = order
            })();
            audio._inflight = Object.create(null);
            audio._waiters = Object.create(null);
            audio.loadBufferWithFallback = function(logicalKey, onReady) {
                try {
                    if (!logicalKey) return;
                    var key = logicalKey;
                    var dotO = key.indexOf(".o.");
                    if (dotO > 0) key = key.substring(0, dotO);
                    if (!audio._fsReady) {
                        audio._pendingLoads.push({
                            k: key,
                            cb: onReady
                        });
                        return
                    }
                    if (audio.buffers[key]) {
                        try {
                            onReady && onReady(audio.buffers[key])
                        } catch (_) {}
                        return
                    }
                    if (audio._inflight[key]) {
                        if (!audio._waiters[key]) audio._waiters[key] = [];
                        audio._waiters[key].push(onReady);
                        return
                    }
                    audio._inflight[key] = true;
                    audio._waiters[key] = [onReady];
                    var exts = Array.isArray(audio._extOrder) && audio._extOrder.length ? audio._extOrder.slice(0) : "ogg m4a mp3 wav".split(" ");
                    try {
                        var firstHit = -1;
                        for (var i = 0; i < exts.length; i++) {
                            var cp = audio._idbRoot + "/" + key + "." + exts[i];
                            try {
                                FS.stat(cp);
                                firstHit = i;
                                break
                            } catch (_s) {}
                        }
                        if (firstHit > 0) {
                            var t = exts[0];
                            exts[0] = exts[firstHit];
                            exts[firstHit] = t
                        }
                    } catch (_r) {}
                    var idx = 0;

                    function deliver(buf) {
                        audio.buffers[key] = buf;
                        var arr = audio._waiters[key] || [];
                        delete audio._waiters[key];
                        delete audio._inflight[key];
                        for (var i = 0; i < arr.length; i++) {
                            try {
                                arr[i] && arr[i](buf)
                            } catch (e) {}
                        }
                    }

                    function tryNext() {
                        if (idx >= exts.length) {
                            deliver(null);
                            return
                        }
                        var ext = exts[idx++];
                        var url = key + "." + ext;
                        var cachePath = audio._idbRoot + "/" + url;

                        function tryNetwork() {
                            fetch(url).then(function(r) {
                                if (!r.ok) throw new Error("HTTP " + r.status);
                                return r.arrayBuffer()
                            }).then(function(ab) {
                                try {
                                    audio._ensureCacheDirs(url);
                                    FS.writeFile(cachePath, new Uint8Array(ab));
                                    audio._scheduleSync()
                                } catch (_e) {}
                                return audio.ctx.decodeAudioData(ab)
                            }).then(function(buf) {
                                deliver(buf)
                            }).catch(function() {
                                tryNext()
                            })
                        }
                        try {
                            var data = FS.readFile(cachePath);
                            if (data && data.length > 0) {
                                var ab = data.byteOffset === 0 && data.byteLength === data.buffer.byteLength ? data.buffer : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                                audio.ctx.decodeAudioData(ab).then(function(buf) {
                                    deliver(buf)
                                }).catch(function() {
                                    tryNetwork()
                                });
                                return
                            }
                        } catch (_e) {}
                        tryNetwork()
                    }
                    tryNext()
                } catch (e) {
                    console.warn("[Audio] loadBufferWithFallback failed for", logicalKey, e);
                    try {
                        onReady && onReady(null)
                    } catch (_) {}
                }
            };
            audio.prefetch = function(key) {
                try {
                    if (!key) return;
                    if (audio.buffers[key]) return;
                    audio.loadBufferWithFallback(key, function(_) {})
                } catch (e) {}
            };
            audio.ensureUnlocked = function() {
                var resume = function() {
                    try {
                        if (ctx.state === "suspended") ctx.resume()
                    } catch (e) {}
                };
                var once = function() {
                    resume();
                    document.removeEventListener("pointerdown", once);
                    document.removeEventListener("keydown", once);
                    document.removeEventListener("touchstart", once)
                };
                document.addEventListener("pointerdown", once, {
                    once: true
                });
                document.addEventListener("keydown", once, {
                    once: true
                });
                document.addEventListener("touchstart", once, {
                    once: true
                })
            };
            audio.isMusicKey = function(key) {
                try {
                    var p = key;
                    var i = p.lastIndexOf("/");
                    var b = i >= 0 ? p.substring(i + 1) : p;
                    return b.indexOf("music_") === 0
                } catch (_) {
                    return false
                }
            };
            audio.stopMusic = function() {
                try {
                    var playing = audio.playing;
                    for (var k in playing) {
                        var arr = playing[k];
                        if (!arr || !arr.length) continue;
                        for (var i = arr.length - 1; i >= 0; i--) {
                            var it = arr[i];
                            if (it && it.isMusic) {
                                try {
                                    it.src.stop(0)
                                } catch (e) {}
                                arr.splice(i, 1)
                            }
                        }
                    }
                } catch (e) {}
            };
            Module.zfAudio = audio;
            audio.ensureUnlocked()
        }
        if (!Module.__soundKeys) Module.__soundKeys = Object.create(null)
    },
    881186: () => {
        if (Module.zfAudio && typeof Module.zfAudio.prefetch === "function") {
            try {
                Module.zfAudio.prefetch("assets/Sounds/music_menu")
            } catch (e) {}
            try {
                setTimeout(function() {
                    try {
                        Module.zfAudio.prefetch("assets/Sounds/tap_01")
                    } catch (e) {}
                }, 50)
            } catch (e) {}
            try {
                setTimeout(function() {
                    try {
                        Module.zfAudio.prefetch("assets/Sounds/music_game")
                    } catch (e) {}
                }, 100)
            } catch (e) {}
            setTimeout(function() {
                try {
                    var sk = Module.__soundKeys || {};
                    for (var id in sk) {
                        if (Object.prototype.hasOwnProperty.call(sk, id)) Module.zfAudio.prefetch(sk[id])
                    }
                } catch (e) {
                    console.warn("[Audio] bulk prefetch skipped", e)
                }
            }, 2e3)
        }
    },
    881812: ($0, $1) => {
        var key = UTF8ToString($0);
        if (!Module.__soundKeys) Module.__soundKeys = Object.create(null);
        Module.__soundKeys[$1 | 0] = key;
        try {
            if (Module.zfAudio && typeof Module.zfAudio.prefetch === "function") {
                var base = key;
                var i = base.lastIndexOf("/");
                if (i >= 0) base = base.substring(i + 1);
                var delay = 500;
                if (base.indexOf("music_menu") === 0) delay = 0;
                else if (base.indexOf("tap_") === 0) delay = 50;
                else if (base.indexOf("music_game") === 0) delay = 100;
                setTimeout(function() {
                    try {
                        Module.zfAudio.prefetch(key)
                    } catch (e) {}
                }, delay)
            }
        } catch (e) {}
    },
    882357: ($0, $1, $2) => {
        if (Module.zfAudioDisabled) return;
        if (!Module.zfAudio) return;
        var audio = Module.zfAudio;
        var key = Module.__soundKeys && Module.__soundKeys[$0 | 0] ? Module.__soundKeys[$0 | 0] : null;
        if (!key) return;
        var loopsParam = $1 | 0;
        var vol = +$2;
        var infinite = loopsParam < 0;
        var remaining = loopsParam > 0 ? loopsParam : 1;
        try {
            var i = key.lastIndexOf("/");
            var b = i >= 0 ? key.substring(i + 1) : key;
            if (b.indexOf("music_") === 0) infinite = true
        } catch (_) {}
        var isMusic = typeof audio.isMusicKey === "function" ? audio.isMusicKey(key) : false;
        if (isMusic && typeof audio.stopMusic === "function") audio.stopMusic();
        var startWithBuffer = function(buf) {
            if (!buf) return;
            var gain = audio.ctx.createGain();
            var eff = Math.max(0, Math.min(1, isNaN(vol) ? 1 : vol));
            gain.gain.value = eff;
            var src = audio.ctx.createBufferSource();
            src.buffer = buf;
            var dst = audio.masterGain ? audio.masterGain : audio.ctx.destination;
            src.loop = !!infinite;
            src.connect(gain).connect(dst);
            try {
                src.start(0)
            } catch (e) {
                console.warn("[Audio] start failed", e)
            }
            if (!audio.playing[key]) audio.playing[key] = [];
            audio.playing[key].push({
                src,
                gain,
                isMusic
            });
            src.onended = function() {
                var arr = audio.playing[key];
                if (arr) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i].src === src) {
                            arr.splice(i, 1);
                            break
                        }
                    }
                }
                if (!infinite && remaining > 1) {
                    remaining--;
                    startWithBuffer(buf)
                }
            }
        };
        var buf = audio.buffers[key];
        if (buf) startWithBuffer(buf);
        else if (typeof audio.loadBufferWithFallback === "function") audio.loadBufferWithFallback(key, startWithBuffer)
    },
    883923: ($0, $1) => {
        if (!Module.zfAudio) return;
        var key = Module.__soundKeys && Module.__soundKeys[$0 | 0] ? Module.__soundKeys[$0 | 0] : null;
        if (!key) return;
        var n = $1 | 0;
        var arr = Module.zfAudio.playing[key];
        if (!arr || arr.length === 0) return;
        if (n <= 0 || n > arr.length) n = arr.length;
        for (var i = 0; i < n; i++) {
            var it = arr.shift();
            try {
                it.src.stop(0)
            } catch (e) {}
        }
    },
    884277: () => {
        if (!Module.zfAudio) return;
        var playing = Module.zfAudio.playing;
        for (var k in playing) {
            var arr = playing[k];
            if (!arr) continue;
            while (arr.length) {
                var it = arr.shift();
                try {
                    it.src.stop(0)
                } catch (e) {}
            }
        }
    },
    884485: () => {
        if (Module.zfAudio && typeof Module.zfAudio.stopMusic === "function") Module.zfAudio.stopMusic()
    },
    884585: () => {
        if (Module.zfAudio && Module.zfAudio.ctx) Module.zfAudio.ctx.suspend()
    },
    884661: () => {
        if (Module.zfAudio && Module.zfAudio.ctx) Module.zfAudio.ctx.resume()
    },
    884736: ($0, $1) => {
        if (!Module.zfAudio) return;
        var key = Module.__soundKeys && Module.__soundKeys[$0 | 0] ? Module.__soundKeys[$0 | 0] : null;
        if (!key) return;
        var vol = Math.max(0, Math.min(1, +$1));
        var arr = Module.zfAudio.playing[key];
        if (!arr) return;
        for (var i = 0; i < arr.length; i++) {
            try {
                arr[i].gain.gain.value = vol
            } catch (e) {}
        }
    },
    885048: ($0, $1, $2) => {
        try {
            if (!window.__CTRTT_PREFS_INIT) return;
            var k = UTF8ToString($0);
            var v = UTF8ToString($1);
            window.__CTRTT_PREFS_MAP[k] = String(v);
            window.__CTRTT_PREFS_DIRTY = true;
            if (typeof window.__CTRTT_PREFS_scheduleFlush === "function") window.__CTRTT_PREFS_scheduleFlush(UTF8ToString($2))
        } catch (e) {}
    },
    885356: ($0, $1) => {
        try {
            if (typeof window !== "undefined" && !window.__CTRTT_PREFS_INIT) {
                window.__CTRTT_PREFS_INIT = true;
                window.__CTRTT_PREFS_MAP = {};
                window.__CTRTT_PREFS_DIRTY = false;
                window.__CTRTT_PREFS_FLUSH_SCHEDULED = false;
                window.__CTRTT_PREFS_flushNow = function(mapKey) {
                    try {
                        var s = typeof GameInterface !== "undefined" && GameInterface && GameInterface.storage ? GameInterface.storage : null;
                        var txt = JSON.stringify(window.__CTRTT_PREFS_MAP || {});
                        if (s && s.setItem) s.setItem(mapKey, txt);
                        else {
                            try {
                                localStorage.setItem(mapKey, txt)
                            } catch (e) {}
                        }
                        window.__CTRTT_PREFS_DIRTY = false
                    } catch (e) {}
                    window.__CTRTT_PREFS_FLUSH_SCHEDULED = false
                };
                window.__CTRTT_PREFS_scheduleFlush = function(mapKey) {
                    if (window.__CTRTT_PREFS_FLUSH_SCHEDULED) return;
                    window.__CTRTT_PREFS_FLUSH_SCHEDULED = true;
                    var flush = function() {
                        window.__CTRTT_PREFS_flushNow(mapKey)
                    };
                    if (typeof requestAnimationFrame === "function") requestAnimationFrame(function() {
                        flush()
                    });
                    else setTimeout(flush, 0)
                };
                window.__CTRTT_PREFS_load = function(prefix, mapKey) {
                    var s = typeof GameInterface !== "undefined" && GameInterface && GameInterface.storage ? GameInterface.storage : null;
                    var txt = null;
                    try {
                        if (s && s.getItem) txt = s.getItem(mapKey)
                    } catch (e) {
                        txt = null
                    }
                    if (!txt) {
                        try {
                            txt = localStorage.getItem(mapKey)
                        } catch (_) {
                            txt = null
                        }
                    }
                    if (txt) {
                        try {
                            window.__CTRTT_PREFS_MAP = JSON.parse(String(txt)) || {}
                            window.__CTRTT_PREFS_MAP["CTRTT_PREFS_PREFS_SUPERPOWERS_COUNT"] = "999";
                            window.__CTRTT_PREFS_MAP["CTRTT_PREFS_PREFS_HINTS_COUNT"] = "999";
                        } catch (e) {
                            window.__CTRTT_PREFS_MAP = {}
                        }
                        return
                    }
                    var map = {};
                    try {
                        if (s && typeof s.length === "number" && typeof s.key === "function") {
                            for (var i = 0; i < s.length; i++) {
                                var k = s.key(i);
                                if (k && k.indexOf(prefix) === 0) {
                                    try {
                                        var v = s.getItem(k);
                                        if (v !== null && v !== undefined) map[k] = String(v)
                                    } catch (_) {}
                                }
                            }
                        }
                    } catch (_) {}
                    try {
                        for (var j = 0; j < localStorage.length; j++) {
                            var lk = localStorage.key(j);
                            if (lk && lk.indexOf(prefix) === 0) {
                                try {
                                    var lv = localStorage.getItem(lk);
                                    if (lv !== null && lv !== undefined) map[lk] = String(lv)
                                } catch (_) {}
                            }
                        }
                    } catch (_) {}
                    window.__CTRTT_PREFS_MAP = map;
                    window.__CTRTT_PREFS_DIRTY = true
                }
            }
            if (typeof window !== "undefined" && typeof window.__CTRTT_PREFS_load === "function") {
                window.__CTRTT_PREFS_load(UTF8ToString($0), UTF8ToString($1));
                if (window.__CTRTT_PREFS_DIRTY) {
                    window.__CTRTT_PREFS_scheduleFlush(UTF8ToString($1))
                }
            }
        } catch (e) {}
    },
    887730: ($0, $1) => {
        try {
            var k = UTF8ToString($0);
            var v = null;
            if (k === "CTRTT_PREFS_PREFS_SUPERPOWERS_COUNT" || k === "CTRTT_PREFS_PREFS_HINTS_COUNT") {
                v = "999";
            } else if (window.__CTRTT_PREFS_INIT) {
                v = window.__CTRTT_PREFS_MAP && k in window.__CTRTT_PREFS_MAP ? window.__CTRTT_PREFS_MAP[k] : null
            }
            if (v !== null && v !== undefined) stringToUTF8(String(v), $1, 1024);
            else stringToUTF8("", $1, 1024)
        } catch (e) {
            stringToUTF8("", $1, 1024)
        }
    },
    888065: ($0, $1) => {
        try {
            if (!window.__CTRTT_PREFS_INIT) return;
            var k = UTF8ToString($0);
            if (window.__CTRTT_PREFS_MAP && k in window.__CTRTT_PREFS_MAP) delete window.__CTRTT_PREFS_MAP[k];
            window.__CTRTT_PREFS_DIRTY = true;
            if (typeof window.__CTRTT_PREFS_scheduleFlush === "function") window.__CTRTT_PREFS_scheduleFlush(UTF8ToString($1))
        } catch (e) {}
    },
    888407: ($0, $1) => {
        try {
            if (!window.__CTRTT_PREFS_INIT) return;
            var prefix = UTF8ToString($0);
            var map = window.__CTRTT_PREFS_MAP || {};
            var keys = Object.keys(map);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (k && k.indexOf(prefix) === 0) delete map[k]
            }
            window.__CTRTT_PREFS_DIRTY = true;
            if (typeof window.__CTRTT_PREFS_scheduleFlush === "function") window.__CTRTT_PREFS_scheduleFlush(UTF8ToString($1))
        } catch (e) {}
    },
    888832: $0 => {
        try {
            var k = UTF8ToString($0);
            var map = window.__CTRTT_PREFS_INIT && window.__CTRTT_PREFS_MAP ? window.__CTRTT_PREFS_MAP : null;
            if (!map) return 0;
            return k in map ? 1 : 0
        } catch (e) {
            return 0
        }
    },
    889041: () => {
        try {
            if (window.GameInterface !== undefined && typeof window.GameInterface.gameOver === "function") {
                window.GameInterface.gameOver().then(function() {
                    Module._famobi_gameover_resolved()
                }).catch(function(e) {
                    Module._famobi_gameover_resolved()
                })
            } else {
                Module._famobi_gameover_resolved()
            }
        } catch (e) {
            Module._famobi_gameover_resolved()
        }
    },
    889396: () => {
        try {
            if (window.GameInterface !== undefined && typeof window.GameInterface.gameQuit === "function") {
                window.GameInterface.gameQuit().then(function() {
                    Module._famobi_gamequit_resolved()
                }).catch(function(e) {
                    Module._famobi_gamequit_resolved()
                })
            } else {
                Module._famobi_gamequit_resolved()
            }
        } catch (e) {
            Module._famobi_gamequit_resolved()
        }
    },
    889751: $0 => {
        try {
            if (window.GameInterface !== undefined && typeof window.GameInterface.gameStart === "function") {
                var levelNum = $0;
                var p = window.GameInterface.gameStart(levelNum);
                if (p && typeof p.then === "function") {
                    p.then(function() {
                        Module._famobi_gamestart_resolved()
                    }).catch(function() {
                        Module._famobi_gamestart_resolved()
                    })
                } else {
                    Module._famobi_gamestart_resolved()
                }
            } else {
                Module._famobi_gamestart_resolved()
            }
        } catch (e) {
            Module._famobi_gamestart_resolved()
        }
    },
    890237: () => {
        try {
            if (window.GameInterface !== undefined && typeof window.GameInterface.gameComplete === "function") {
                window.GameInterface.gameComplete().then(function() {
                    Module._famobi_gamecomplete_resolved()
                }).catch(function(e) {
                    Module._famobi_gamecomplete_resolved()
                })
            } else {
                Module._famobi_gamecomplete_resolved()
            }
        } catch (e) {
            Module._famobi_gamecomplete_resolved()
        }
    },
    890616: () => {
        try {
            if (typeof window !== "undefined" && window.GameInterface !== undefined && typeof window.GameInterface.gameResume === "function") {
                window.GameInterface.gameResume().then(function() {
                    Module._famobi_gameresume_resolved()
                }).catch(function(e) {
                    console.warn("[ctrtt] gameResume rejected:", e);
                    Module._famobi_gameresume_resolved()
                })
            } else {
                Module._famobi_gameresume_resolved()
            }
        } catch (e) {
            console.error("[ctrtt] gameResume exception:", e);
            Module._famobi_gameresume_resolved()
        }
    },
    891116: () => {
        try {
            if (typeof window !== "undefined" && window.GameInterface !== undefined && typeof window.GameInterface.gamePause === "function") {
                window.GameInterface.gamePause().then(function() {
                    Module._famobi_gamepause_resolved()
                }).catch(function(e) {
                    console.warn("[ctrtt] gamePause rejected:", e);
                    Module._famobi_gamepause_resolved()
                })
            } else {
                Module._famobi_gamepause_resolved()
            }
        } catch (e) {
            console.error("[ctrtt] gamePause exception:", e);
            Module._famobi_gamepause_resolved()
        }
    },
    891608: $0 => {
        try {
            if (typeof window !== "undefined" && window.GameInterface !== undefined && typeof window.GameInterface.hasFeature === "function") {
                var feature = UTF8ToString($0);
                return window.GameInterface.hasFeature(feature) ? 1 : 0
            }
            return 1
        } catch (e) {
            console.error("[ctrtt] hasFeature exception:", e);
            return 1
        }
    },
    891928: $0 => {
        try {
            if (typeof window !== "undefined" && window.GameInterface !== undefined && typeof window.GameInterface.gameMuted === "function") {
                window.GameInterface.gameMuted(!!$0)
            }
        } catch (e) {
            console.error("[ctrtt] gameMuted exception:", e)
        }
    },
    892175: () => {
        try {
            if (typeof window !== "undefined" && window.GameInterface !== undefined && typeof window.GameInterface.hasFeature === "function") {
                return window.GameInterface.hasFeature("rewarded") ? 1 : 0
            }
        } catch (e) {
            console.error("[ctrtt] hasFeature exception:", e)
        }
        return 0
    },
    892456: $0 => {
        try {
            var placement = UTF8ToString($0);
            if (typeof window !== "undefined" && window.GameInterface !== undefined && typeof window.GameInterface.isRewardedAdAvailable === "function") {
                return window.GameInterface.isRewardedAdAvailable(placement) ? 1 : 0
            }
        } catch (e) {
            console.error("[ctrtt] isRewardedAdAvailable exception:", e)
        }
        return 0
    },
    892803: $0 => {
        try {
            var placement = UTF8ToString($0);
            if (typeof window !== "undefined" && window.GameInterface !== undefined && typeof window.GameInterface.showRewardedAd === "function") {
                window.GameInterface.showRewardedAd(placement).then(function(result) {
                    var granted = result && result.isRewardGranted === true;
                    Module.ccall("famobi_rewardedad_resolved", "void", ["number"], [granted ? 1 : 0])
                }).catch(function(err) {
                    console.error("[ctrtt] showRewardedAd error:", err);
                    Module.ccall("famobi_rewardedad_resolved", "void", ["number"], [0])
                })
            } else {
                Module.ccall("famobi_rewardedad_resolved", "void", ["number"], [0])
            }
        } catch (e) {
            console.error("[ctrtt] showRewardedAd exception:", e);
            Module.ccall("famobi_rewardedad_resolved", "void", ["number"], [0])
        }
    },
    893567: $0 => {
        try {
            if (typeof window !== "undefined" && window.GameInterface !== undefined && typeof window.GameInterface.showInterstitialAd === "function") {
                var evId = UTF8ToString($0);
                var p = window.GameInterface.showInterstitialAd(evId);
                if (p && typeof p.then === "function") {
                    p.then(function() {
                        Module._famobi_showinterstitialad_resolved()
                    }).catch(function(e) {
                        console.warn("[ctrtt] showInterstitialAd rejected:", e);
                        Module._famobi_showinterstitialad_resolved()
                    })
                } else {
                    Module._famobi_showinterstitialad_resolved()
                }
            } else {
                Module._famobi_showinterstitialad_resolved()
            }
        } catch (e) {
            console.error("[ctrtt] showInterstitialAd exception:", e);
            Module._famobi_showinterstitialad_resolved()
        }
    }
};

function print_stack_trace() {
    console.log("Stack trace:");
    console.trace()
}

function get_canvas_css_width() {
    var canvas = Module["canvas"] || document.getElementById("canvas");
    return canvas ? canvas.clientWidth : 0
}

function get_canvas_css_height() {
    var canvas = Module["canvas"] || document.getElementById("canvas");
    return canvas ? canvas.clientHeight : 0
}

function get_canvas_pixel_width() {
    var canvas = Module["canvas"] || document.getElementById("canvas");
    return canvas ? canvas.width : 0
}

function get_canvas_pixel_height() {
    var canvas = Module["canvas"] || document.getElementById("canvas");
    return canvas ? canvas.height : 0
}

function get_device_pixel_ratio() {
    return typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1
}

function setup_resize_handler() {
    function handleResize() {
        if (typeof _on_canvas_resize === "function") {
            _on_canvas_resize()
        }
    }
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    document.addEventListener("visibilitychange", handleResize);
    handleResize()
}
var wasmImports = {
    h: ___cxa_throw,
    G: ___syscall_fcntl64,
    da: ___syscall_fstat64,
    W: ___syscall_getdents64,
    ia: ___syscall_ioctl,
    ba: ___syscall_lstat64,
    aa: ___syscall_newfstatat,
    D: ___syscall_openat,
    ca: ___syscall_stat64,
    fa: __abort_js,
    S: __emscripten_runtime_keepalive_clear,
    Q: __emscripten_throw_longjmp,
    X: __localtime_js,
    Y: __mktime_js,
    T: __setitimer_js,
    ga: __tzset_js,
    ea: _clock_time_get,
    a: _emscripten_asm_const_int,
    ka: _emscripten_async_call,
    E: _emscripten_date_now,
    r: _emscripten_get_now,
    va: _emscripten_pause_main_loop,
    V: _emscripten_resize_heap,
    na: _emscripten_resume_main_loop,
    ja: _emscripten_run_script_string,
    Aa: _emscripten_set_canvas_element_size,
    Da: _emscripten_set_keydown_callback_on_thread,
    Ba: _emscripten_set_keyup_callback_on_thread,
    Ca: _emscripten_set_main_loop,
    Ga: _emscripten_set_mousedown_callback_on_thread,
    Fa: _emscripten_set_mousemove_callback_on_thread,
    Ea: _emscripten_set_mouseup_callback_on_thread,
    Ha: _emscripten_set_touchcancel_callback_on_thread,
    Ia: _emscripten_set_touchend_callback_on_thread,
    Ja: _emscripten_set_touchmove_callback_on_thread,
    Ka: _emscripten_set_touchstart_callback_on_thread,
    Sa: _emscripten_webgl_create_context,
    Ra: _emscripten_webgl_make_context_current,
    _: _environ_get,
    $: _environ_sizes_get,
    x: _fd_close,
    F: _fd_read,
    Z: _fd_seek,
    ha: _fd_write,
    M: get_canvas_css_height,
    N: get_canvas_css_width,
    Ma: get_canvas_pixel_height,
    Na: get_canvas_pixel_width,
    A: get_device_pixel_ratio,
    I: _glAttachShader,
    o: _glBindTexture,
    b: _glBlendFunc,
    Qa: _glClear,
    sa: _glCompileShader,
    K: _glCompressedTexImage2D,
    pa: _glCreateProgram,
    ua: _glCreateShader,
    k: _glDeleteBuffers,
    la: _glDeleteProgram,
    qa: _glDeleteShader,
    wa: _glDeleteTextures,
    v: _glDisable,
    e: _glDisableVertexAttribArray,
    p: _glDrawArrays,
    B: _glDrawElements,
    l: _glEnable,
    f: _glEnableVertexAttribArray,
    u: _glGenBuffers,
    xa: _glGenTextures,
    n: _glGetAttribLocation,
    L: _glGetIntegerv,
    ma: _glGetProgramInfoLog,
    H: _glGetProgramiv,
    ra: _glGetShaderInfoLog,
    J: _glGetShaderiv,
    Pa: _glGetString,
    m: _glGetUniformLocation,
    O: _glLineWidth,
    oa: _glLinkProgram,
    za: _glScissor,
    ta: _glShaderSource,
    y: _glTexImage2D,
    q: _glTexParameteri,
    t: _glUniform1i,
    s: _glUniform4f,
    i: _glUniformMatrix3fv,
    j: _glUseProgram,
    g: _glVertexAttribPointer,
    ya: _glViewport,
    z: invoke_ii,
    w: invoke_iiii,
    C: invoke_iiiiii,
    c: invoke_vi,
    d: invoke_vii,
    P: invoke_viiii,
    Oa: print_stack_trace,
    R: _proc_exit,
    U: _random_get,
    La: setup_resize_handler
};
var wasmExports;
createWasm();
var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["Ua"])();
var _main = Module["_main"] = (a0, a1) => (_main = Module["_main"] = wasmExports["Va"])(a0, a1);
var _zframework_init = Module["_zframework_init"] = a0 => (_zframework_init = Module["_zframework_init"] = wasmExports["Wa"])(a0);
var _on_canvas_resize = Module["_on_canvas_resize"] = () => (_on_canvas_resize = Module["_on_canvas_resize"] = wasmExports["Xa"])();
var _startMainLoop = Module["_startMainLoop"] = () => (_startMainLoop = Module["_startMainLoop"] = wasmExports["Ya"])();
var _pauseMainLoop = Module["_pauseMainLoop"] = () => (_pauseMainLoop = Module["_pauseMainLoop"] = wasmExports["Za"])();
var _resumeMainLoop = Module["_resumeMainLoop"] = () => (_resumeMainLoop = Module["_resumeMainLoop"] = wasmExports["_a"])();
var _setCacheReady = Module["_setCacheReady"] = () => (_setCacheReady = Module["_setCacheReady"] = wasmExports["$a"])();
var _famobi_gamestart_resolved = Module["_famobi_gamestart_resolved"] = () => (_famobi_gamestart_resolved = Module["_famobi_gamestart_resolved"] = wasmExports["ab"])();
var _famobi_gamecomplete_resolved = Module["_famobi_gamecomplete_resolved"] = () => (_famobi_gamecomplete_resolved = Module["_famobi_gamecomplete_resolved"] = wasmExports["bb"])();
var _famobi_gameover_resolved = Module["_famobi_gameover_resolved"] = () => (_famobi_gameover_resolved = Module["_famobi_gameover_resolved"] = wasmExports["cb"])();
var _famobi_gamequit_resolved = Module["_famobi_gamequit_resolved"] = () => (_famobi_gamequit_resolved = Module["_famobi_gamequit_resolved"] = wasmExports["db"])();
var _famobi_onGoToHome = Module["_famobi_onGoToHome"] = () => (_famobi_onGoToHome = Module["_famobi_onGoToHome"] = wasmExports["eb"])();
var _famobi_onGoToNextLevel = Module["_famobi_onGoToNextLevel"] = () => (_famobi_onGoToNextLevel = Module["_famobi_onGoToNextLevel"] = wasmExports["fb"])();
var _famobi_onGoToLevel = Module["_famobi_onGoToLevel"] = a0 => (_famobi_onGoToLevel = Module["_famobi_onGoToLevel"] = wasmExports["gb"])(a0);
var _famobi_onQuitGame = Module["_famobi_onQuitGame"] = () => (_famobi_onQuitGame = Module["_famobi_onQuitGame"] = wasmExports["hb"])();
var _famobi_onGameOverEvent = Module["_famobi_onGameOverEvent"] = () => (_famobi_onGameOverEvent = Module["_famobi_onGameOverEvent"] = wasmExports["ib"])();
var _famobi_restartlevel = Module["_famobi_restartlevel"] = () => (_famobi_restartlevel = Module["_famobi_restartlevel"] = wasmExports["jb"])();
var _famobi_gamepause_resolved = Module["_famobi_gamepause_resolved"] = () => (_famobi_gamepause_resolved = Module["_famobi_gamepause_resolved"] = wasmExports["kb"])();
var _famobi_gameresume_resolved = Module["_famobi_gameresume_resolved"] = () => (_famobi_gameresume_resolved = Module["_famobi_gameresume_resolved"] = wasmExports["lb"])();
var _famobi_showinterstitialad_resolved = Module["_famobi_showinterstitialad_resolved"] = () => (_famobi_showinterstitialad_resolved = Module["_famobi_showinterstitialad_resolved"] = wasmExports["mb"])();
var _famobi_showad_scheduled = Module["_famobi_showad_scheduled"] = () => (_famobi_showad_scheduled = Module["_famobi_showad_scheduled"] = wasmExports["nb"])();
var _famobi_rewardedad_resolved = Module["_famobi_rewardedad_resolved"] = a0 => (_famobi_rewardedad_resolved = Module["_famobi_rewardedad_resolved"] = wasmExports["ob"])(a0);
var _malloc = a0 => (_malloc = wasmExports["pb"])(a0);
var _showSecretOverlay = Module["_showSecretOverlay"] = () => (_showSecretOverlay = Module["_showSecretOverlay"] = wasmExports["qb"])();
var _hideSecretOverlay = Module["_hideSecretOverlay"] = () => (_hideSecretOverlay = Module["_hideSecretOverlay"] = wasmExports["rb"])();
var _emscripten_builtin_memalign = (a0, a1) => (_emscripten_builtin_memalign = wasmExports["tb"])(a0, a1);
var __emscripten_timeout = (a0, a1) => (__emscripten_timeout = wasmExports["ub"])(a0, a1);
var _setThrew = (a0, a1) => (_setThrew = wasmExports["vb"])(a0, a1);
var __emscripten_stack_restore = a0 => (__emscripten_stack_restore = wasmExports["wb"])(a0);
var __emscripten_stack_alloc = a0 => (__emscripten_stack_alloc = wasmExports["xb"])(a0);
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["yb"])();

function invoke_vi(index, a1) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)(a1)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0)
    }
}

function invoke_vii(index, a1, a2) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)(a1, a2)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0)
    }
}

function invoke_ii(index, a1) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0)
    }
}

function invoke_iiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1, a2, a3)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0)
    }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return getWasmTableEntry(index)(a1, a2, a3, a4, a5)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0)
    }
}

function invoke_viiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        getWasmTableEntry(index)(a1, a2, a3, a4)
    } catch (e) {
        stackRestore(sp);
        if (e !== e + 0) throw e;
        _setThrew(1, 0)
    }
}
Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;
Module["ccall"] = ccall;
Module["FS_createPreloadedFile"] = FS_createPreloadedFile;
Module["FS_unlink"] = FS_unlink;
Module["FS_createPath"] = FS_createPath;
Module["FS_createDevice"] = FS_createDevice;
Module["FS_createDataFile"] = FS_createDataFile;
Module["FS_createLazyFile"] = FS_createLazyFile;

function callMain(args = []) {
    var entryFunction = _main;
    args.unshift(thisProgram);
    var argc = args.length;
    var argv = stackAlloc((argc + 1) * 4);
    var argv_ptr = argv;
    args.forEach(arg => {
        HEAPU32[argv_ptr >> 2] = stringToUTF8OnStack(arg);
        argv_ptr += 4
    });
    HEAPU32[argv_ptr >> 2] = 0;
    try {
        var ret = entryFunction(argc, argv);
        exitJS(ret, true);
        return ret
    } catch (e) {
        return handleException(e)
    }
}

function run(args = arguments_) {
    if (runDependencies > 0) {
        dependenciesFulfilled = run;
        return
    }
    preRun();
    if (runDependencies > 0) {
        dependenciesFulfilled = run;
        return
    }

    function doRun() {
        Module["calledRun"] = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        Module["onRuntimeInitialized"]?.();
        var noInitialRun = Module["noInitialRun"];
        if (!noInitialRun) callMain(args);
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(() => {
            setTimeout(() => Module["setStatus"](""), 1);
            doRun()
        }, 1)
    } else {
        doRun()
    }
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
run();