"use strict";
var Engine;
(function (Engine) {
    Engine.EXTERNAL_LOAD_COMPLETE = true;
    var Asset = /** @class */ (function () {
        function Asset(path) {
            this.headerReceived = false;
            this.size = 0;
            this.downloadedSize = 0;
            this.path = Assets.root + path;
        }
        return Asset;
    }());
    var ImageAssetData = /** @class */ (function () {
        function ImageAssetData(xSize, ySize, xSizeSource, ySizeSource, imageData, bytes, filterable) {
            this.xSize = xSize;
            this.ySize = ySize;
            this.xSizeSource = xSizeSource;
            this.ySizeSource = ySizeSource;
            this.imageData = imageData;
            this.bytes = bytes;
            this.filterable = filterable;
        }
        return ImageAssetData;
    }());
    Engine.ImageAssetData = ImageAssetData;
    var Assets = /** @class */ (function () {
        function Assets() {
        }
        Assets.downloadNextAssetHeader = function () {
            Assets.currentAsset = Assets.assets[Assets.assetHeaderDownloadIndex];
            var xhr = new XMLHttpRequest();
            xhr.onloadstart = function () {
                this.responseType = "arraybuffer";
            };
            //xhr.responseType = "arraybuffer";
            xhr.open("GET", Assets.currentAsset.path, true);
            xhr.onreadystatechange = function () {
                if (this.readyState == this.HEADERS_RECEIVED) {
                    Assets.currentAsset.headerReceived = true;
                    if (this.getResponseHeader("Content-Length") != null) {
                        Assets.currentAsset.size = +this.getResponseHeader("Content-Length");
                    }
                    else {
                        Assets.currentAsset.size = 1;
                    }
                    this.abort();
                    Assets.assetHeaderDownloadIndex += 1;
                    if (Assets.assetHeaderDownloadIndex == Assets.assets.length) {
                        Assets.downloadNextAssetBlob();
                    }
                    else {
                        Assets.downloadNextAssetHeader();
                    }
                }
            };
            xhr.onerror = function () {
                //console.log("ERROR");
                Assets.downloadNextAssetHeader();
            };
            xhr.send();
        };
        Assets.downloadNextAssetBlob = function () {
            Assets.currentAsset = Assets.assets[Assets.assetBlobDownloadIndex];
            var xhr = new XMLHttpRequest();
            xhr.onloadstart = function () {
                if (Assets.currentAsset.path.indexOf(".json") > 0 || Assets.currentAsset.path.indexOf(".txt") > 0 || Assets.currentAsset.path.indexOf(".glsl") > 0) {
                    xhr.responseType = "text";
                }
                else {
                    xhr.responseType = "arraybuffer";
                }
            };
            /*
            if(Assets.currentAsset.path.indexOf(".json") > 0 || Assets.currentAsset.path.indexOf(".txt") > 0 || Assets.currentAsset.path.indexOf(".glsl") > 0){
                xhr.responseType = "text";
            }
            else{
                xhr.responseType = "arraybuffer";
            }
            */
            xhr.open("GET", Assets.currentAsset.path, true);
            xhr.onprogress = function (e) {
                Assets.currentAsset.downloadedSize = e.loaded;
                if (Assets.currentAsset.downloadedSize > Assets.currentAsset.size) {
                    Assets.currentAsset.downloadedSize = Assets.currentAsset.size;
                }
            };
            xhr.onreadystatechange = function () {
                if (this.readyState == XMLHttpRequest.DONE) {
                    if (this.status == 200 || this.status == 304 || this.status == 206 || (this.status == 0 && this.response)) {
                        Assets.currentAsset.downloadedSize = Assets.currentAsset.size;
                        if (Assets.currentAsset.path.indexOf(".png") > 0 || Assets.currentAsset.path.indexOf(".jpg") > 0 || Assets.currentAsset.path.indexOf(".jpeg") > 0 || Assets.currentAsset.path.indexOf(".jpe") > 0) {
                            Assets.currentAsset.blob = new Blob([new Uint8Array(this.response)]);
                            Assets.prepareImageAsset();
                        }
                        else if (Assets.currentAsset.path.indexOf(".m4a") > 0 || Assets.currentAsset.path.indexOf(".ogg") > 0 || Assets.currentAsset.path.indexOf(".wav") > 0) {
                            Assets.currentAsset.buffer = this.response;
                            Assets.prepareSoundAsset();
                        }
                        else if (Assets.currentAsset.path.indexOf(".json") > 0 || Assets.currentAsset.path.indexOf(".txt") > 0 || Assets.currentAsset.path.indexOf(".glsl") > 0) {
                            Assets.currentAsset.text = xhr.responseText;
                            Assets.stepAssetDownloadQueue();
                        }
                        else {
                            Assets.currentAsset.blob = this.response;
                            Assets.stepAssetDownloadQueue();
                        }
                    }
                    else {
                        //console.log("ERROR");
                        Assets.downloadNextAssetBlob();
                    }
                }
            };
            xhr.onerror = function () {
                //console.log("ERROR");
                Assets.downloadNextAssetBlob();
            };
            xhr.send();
        };
        Assets.stepAssetDownloadQueue = function () {
            Assets.assetBlobDownloadIndex += 1;
            if (Assets.assetBlobDownloadIndex == Assets.assets.length) {
                Assets.downloadingAssets = false;
            }
            else {
                Assets.downloadNextAssetBlob();
            }
        };
        Assets.prepareImageAsset = function () {
            Assets.currentAsset.image = document.createElement("img");
            Assets.currentAsset.image.onload = function () {
                Assets.currentAsset.blob = null;
                Assets.stepAssetDownloadQueue();
            };
            Assets.currentAsset.image.onerror = function () {
                //console.log("ERROR");
                Assets.prepareImageAsset();
            };
            Assets.currentAsset.image.src = URL.createObjectURL(Assets.currentAsset.blob);
        };
        Assets.prepareSoundAsset = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                Assets.currentAsset.blob = new Blob([new Uint8Array(Assets.currentAsset.buffer)]);
                Assets.currentAsset.audioURL = URL.createObjectURL(Assets.currentAsset.blob);
                Assets.stepAssetDownloadQueue();
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                //@ts-ignore
                Engine.AudioManager.context.decodeAudioData(Assets.currentAsset.buffer, function (buffer) {
                    Assets.currentAsset.audio = buffer;
                    Assets.currentAsset.buffer = null;
                    Assets.stepAssetDownloadQueue();
                }, function () {
                    //console.log("ERROR");
                    Assets.prepareSoundAsset();
                });
            }
            else {
                Assets.stepAssetDownloadQueue();
            }
        };
        Assets.queue = function (path) {
            if (Assets.downloadingAssets) {
                console.log("ERROR");
            }
            else {
                if (path.indexOf(".ogg") > 0 || path.indexOf(".m4a") > 0 || path.indexOf(".wav") > 0) {
                    console.log("ERROR");
                }
                else if (path.indexOf(".omw") > 0 || path.indexOf(".owm") > 0 || path.indexOf(".mow") > 0 || path.indexOf(".mwo") > 0 || path.indexOf(".wom") > 0 || path.indexOf(".wmo") > 0) {
                    path = Assets.findAudioExtension(path);
                    if (path == "") {
                        console.log("ERROR");
                        return;
                    }
                }
                Assets.assets.push(new Asset(path));
            }
        };
        Assets.download = function () {
            if (Assets.downloadingAssets) {
                console.log("ERROR");
            }
            else if (Assets.assetHeaderDownloadIndex >= Assets.assets.length) {
                console.log("ERROR");
            }
            else {
                Assets.assetQueueStart = Assets.assetHeaderDownloadIndex;
                Assets.downloadingAssets = true;
                Assets.downloadNextAssetHeader();
            }
        };
        Object.defineProperty(Assets, "downloadSize", {
            get: function () {
                var retSize = 0;
                for (var assetIndex = Assets.assetQueueStart; assetIndex < Assets.assets.length; assetIndex += 1) {
                    if (!Assets.assets[assetIndex].headerReceived) {
                        return 0;
                    }
                    retSize += Assets.assets[assetIndex].size;
                }
                return retSize;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Assets, "downloadedSize", {
            get: function () {
                var retSize = 0;
                for (var assetIndex = Assets.assetQueueStart; assetIndex < Assets.assets.length; assetIndex += 1) {
                    retSize += Assets.assets[assetIndex].downloadedSize;
                }
                return retSize;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Assets, "downloadedRatio", {
            get: function () {
                var size = Assets.downloadSize;
                if (size == 0) {
                    return 0;
                }
                return Assets.downloadedSize / size;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Assets, "downloadComplete", {
            get: function () {
                var size = Assets.downloadSize;
                if (size == 0) {
                    return false;
                }
                return Assets.downloadedSize == size && !Assets.downloadingAssets && Engine.EXTERNAL_LOAD_COMPLETE;
            },
            enumerable: false,
            configurable: true
        });
        Assets.findAsset = function (path) {
            path = Assets.root + path;
            for (var assetIndex = 0; assetIndex < Assets.assets.length; assetIndex += 1) {
                if (Assets.assets[assetIndex].path == path) {
                    return Assets.assets[assetIndex];
                }
            }
            console.log("error");
            return null;
        };
        Assets.isPOW2 = function (value) {
            return (value != 0) && ((value & (value - 1)) == 0);
        };
        Assets.getNextPOW = function (value) {
            var xSizePOW2 = 2;
            while (xSizePOW2 < value) {
                xSizePOW2 *= 2;
            }
            return xSizePOW2;
        };
        Assets.loadImage = function (path) {
            var asset = Assets.findAsset(path);
            if (asset == null || asset.image == null) {
                console.log("ERROR");
                return null;
            }
            else {
                if (Engine.Renderer.mode == Engine.RendererMode.CANVAS_2D) {
                    var canvas = document.createElement("canvas");
                    canvas.width = asset.image.width;
                    canvas.height = asset.image.height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(asset.image, 0, 0);
                    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    return new ImageAssetData(canvas.width, canvas.height, canvas.width, canvas.height, imageData, imageData.data, false);
                }
                else {
                    var xSize = asset.image.width;
                    var ySize = asset.image.height;
                    if (this.isPOW2(xSize) && this.isPOW2(ySize)) {
                        var canvas = document.createElement("canvas");
                        canvas.width = asset.image.width;
                        canvas.height = asset.image.height;
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(asset.image, 0, 0);
                        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        return new ImageAssetData(canvas.width, canvas.height, canvas.width, canvas.height, imageData, imageData.data, true);
                    }
                    else {
                        //@ts-ignore
                        var maxDim = Engine.Renderer.gl.getParameter(Engine.Renderer.gl.MAX_TEXTURE_SIZE);
                        if (xSize <= maxDim && ySize <= maxDim) {
                            var xSizePOW2 = Assets.getNextPOW(xSize);
                            var ySizePOW2 = Assets.getNextPOW(ySize);
                            var canvas = document.createElement("canvas");
                            canvas.width = xSizePOW2;
                            canvas.height = ySizePOW2;
                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(asset.image, 0, 0);
                            var imageData = ctx.getImageData(0, 0, xSizePOW2, ySizePOW2);
                            return new ImageAssetData(canvas.width, canvas.height, xSize, ySize, imageData, imageData.data, true);
                        }
                        else {
                            var canvas = document.createElement("canvas");
                            canvas.width = asset.image.width;
                            canvas.height = asset.image.height;
                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(asset.image, 0, 0);
                            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            return new ImageAssetData(canvas.width, canvas.height, canvas.width, canvas.height, imageData, imageData.data, false);
                        }
                    }
                }
            }
        };
        Assets.loadText = function (path) {
            var asset = Assets.findAsset(path);
            if (asset == null || asset.text == null) {
                console.log("ERROR");
                return null;
            }
            else {
                return asset.text;
            }
        };
        ;
        Assets.loadAudio = function (path) {
            var asset = Assets.findAsset(Assets.findAudioExtension(path));
            if (asset == null || asset.audio == null) {
                console.log("ERROR");
                return null;
            }
            else {
                return asset.audio;
            }
        };
        Assets.root = "";
        Assets.assets = new Array();
        Assets.assetQueueStart = 0;
        Assets.assetHeaderDownloadIndex = 0;
        Assets.assetBlobDownloadIndex = 0;
        Assets.downloadingAssets = false;
        Assets.findAudioExtension = function (path) {
            var extFind = "";
            var extReplace = "";
            if (path.indexOf(".omw") > 0) {
                extFind = ".omw";
                if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".owm") > 0) {
                extFind = ".owm";
                if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".mow") > 0) {
                extFind = ".mow";
                if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".mwo") > 0) {
                extFind = ".mwo";
                if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".wom") > 0) {
                extFind = ".wom";
                if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else {
                    return "";
                }
            }
            else if (path.indexOf(".wmo") > 0) {
                extFind = ".wmo";
                if (Engine.AudioManager.wavSupported) {
                    extReplace = ".wav";
                }
                else if (Engine.AudioManager.aacSupported) {
                    extReplace = ".m4a";
                }
                else if (Engine.AudioManager.oggSupported) {
                    extReplace = ".ogg";
                }
                else {
                    return "";
                }
            }
            else {
                return "";
            }
            var folder = (extReplace == ".ogg" ? "OGG/" : (extReplace == ".m4a" ? "M4A/" : "WAV/"));
            var slashIndex = path.lastIndexOf("/") + 1;
            path = path.substr(0, slashIndex) + folder + path.substr(slashIndex);
            return path.substr(0, path.indexOf(extFind)) + extReplace;
        };
        return Assets;
    }());
    Engine.Assets = Assets;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var AudioPlayer = /** @class */ (function () {
        function AudioPlayer(path) {
            this.loopStart = 0;
            this.loopEnd = 0;
            //TODO: NOT OPTIMAL, CHANGE THIS
            this.restoreVolume = 1;
            this._volume = 1;
            this._muted = false;
            if (!Engine.System.canCreateScene) {
                console.log("error");
            }
            //@ts-ignore
            Engine.AudioManager.players.push(this);
            this.path = path;
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                this.buffer = Engine.Assets.loadAudio(path);
                //@ts-ignore
                this.volumeGain = Engine.AudioManager.context.createGain();
                //@ts-ignore
                this.volumeGain.connect(Engine.AudioManager.context.destination);
                //@ts-ignore
                this.muteGain = Engine.AudioManager.context.createGain();
                this.muteGain.connect(this.volumeGain);
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                this.path = path;
                this.lockTime = -1;
                this.htmlAudio = new Audio();
                this.htmlAudio.src = Engine.Assets.findAsset(Engine.Assets.findAudioExtension(path)).audioURL;
                var that = this;
                this.htmlAudio.addEventListener('timeupdate', function () {
                    if (Engine.System.pauseCount > 0 && that.lockTime >= 0) {
                        this.currentTime = that.lockTime;
                    }
                    else {
                        if (that.loopEnd > 0 && (this.currentTime > that.loopEnd || that.htmlAudio.ended)) {
                            this.currentTime = that.loopStart;
                            this.play();
                        }
                    }
                }, false);
            }
            this.muted = false;
        }
        Object.defineProperty(AudioPlayer.prototype, "volume", {
            get: function () {
                return this._volume;
            },
            set: function (value) {
                if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                    this._volume = value;
                    this.volumeGain.gain.value = value;
                }
                else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                    this._volume = value;
                    this.htmlAudio.volume = value;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(AudioPlayer.prototype, "muted", {
            get: function () {
                return this._muted;
            },
            set: function (value) {
                if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                    this._muted = value;
                    //@ts-ignore
                    this.muteGain.gain.value = (this._muted || Engine.AudioManager._muted || Engine.System.pauseCount > 0) ? 0 : 1;
                }
                else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                    this._muted = value;
                    //@ts-ignore
                    this.htmlAudio.muted = this._muted || Engine.AudioManager._muted || Engine.System.pauseCount > 0;
                }
            },
            enumerable: false,
            configurable: true
        });
        //@ts-ignore
        AudioPlayer.recycleAll = function () {
            var newPlayers = new Array();
            //@ts-ignore
            for (var _i = 0, _a = Engine.AudioManager.players; _i < _a.length; _i++) {
                var player = _a[_i];
                var owner = player;
                while (owner.owner != null) {
                    owner = owner.owner;
                }
                if (owner.preserved) {
                    newPlayers.push(player);
                }
                else {
                    player.destroy();
                }
            }
            //@ts-ignore
            Engine.AudioManager.players = newPlayers;
        };
        /*
        //@ts-ignore
        private verify(){
            if(AudioManager.mode == AudioManagerMode.WEB){
                
            }
            else if(AudioManager.mode == AudioManagerMode.HTML){
                if(this.autoplayed){
                    //@ts-ignore
                    this.autoplayed = false;
                    this.play();
                    if(System.pauseCount > 0){
                        this.lockTime = this.htmlAudio.currentTime;
                        this.muted = this._muted;
                    }
                }
            }
        }
        */
        //@ts-ignore
        AudioPlayer.prototype.pause = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                if (this.played) {
                    this.lockTime = this.htmlAudio.currentTime;
                    this.muted = this._muted;
                }
            }
        };
        //@ts-ignore
        AudioPlayer.prototype.resume = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                if (this.played) {
                    this.htmlAudio.currentTime = this.lockTime;
                    this.lockTime = -1;
                    this.muted = this._muted;
                }
            }
        };
        AudioPlayer.prototype.destroy = function () {
            this.muted = true;
            this.stop();
        };
        AudioPlayer.prototype.play = function (pitch) {
            if (pitch === void 0) { pitch = 1; }
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                //if(AudioManager.verified){
                this.autoplay(pitch);
                //}
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                //if(AudioManager.verified){
                //@ts-ignore
                this.played = true;
                try {
                    this.htmlAudio.currentTime = 0;
                }
                catch (e) {
                }
                this.htmlAudio.playbackRate = pitch;
                this.htmlAudio.play();
                //}
            }
        };
        AudioPlayer.prototype.autoplay = function (pitch) {
            if (pitch === void 0) { pitch = 1; }
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                if (this.played) {
                    this.source.stop();
                }
                //@ts-ignore
                this.played = true;
                //@ts-ignore
                this.source = Engine.AudioManager.context.createBufferSource();
                this.source.buffer = this.buffer;
                this.source.loop = this.loopEnd > 0;
                this.source.playbackRate.value = pitch;
                if (this.source.loop) {
                    this.source.loopStart = this.loopStart;
                    this.source.loopEnd = this.loopEnd;
                }
                this.source.connect(this.muteGain);
                //@ts-ignore
                this.source[this.source.start ? 'start' : 'noteOn'](0, this.source.loop ? 77 * 0 : 0);
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                //if(AudioManager.verified){
                this.play();
                //}
                //else{
                //@ts-ignore
                //    this.autoplayed = true;
                //}
            }
        };
        AudioPlayer.prototype.stop = function () {
            if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
                if (this.played) {
                    this.source.stop();
                }
            }
            else if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
                if ( /*AudioManager.verified &&*/this.played) {
                    this.htmlAudio.currentTime = 0;
                    this.htmlAudio.pause();
                }
                //else if(this.autoplay){
                //@ts-ignore
                //    this.autoplayed = false;
                //}
            }
        };
        return AudioPlayer;
    }());
    Engine.AudioPlayer = AudioPlayer;
})(Engine || (Engine = {}));
///<reference path="AudioPlayer.ts"/>
var Engine;
(function (Engine) {
    var AudioManagerMode;
    (function (AudioManagerMode) {
        AudioManagerMode[AudioManagerMode["NONE"] = 0] = "NONE";
        AudioManagerMode[AudioManagerMode["HTML"] = 1] = "HTML";
        AudioManagerMode[AudioManagerMode["WEB"] = 2] = "WEB";
    })(AudioManagerMode = Engine.AudioManagerMode || (Engine.AudioManagerMode = {}));
    var AudioManager = /** @class */ (function () {
        function AudioManager() {
        }
        Object.defineProperty(AudioManager, "muted", {
            get: function () {
                return AudioManager._muted;
            },
            set: function (value) {
                AudioManager._muted = value;
                for (var _i = 0, _a = AudioManager.players; _i < _a.length; _i++) {
                    var player = _a[_i];
                    //@ts-ignore
                    player.muted = player._muted;
                }
            },
            enumerable: false,
            configurable: true
        });
        //@ts-ignore
        AudioManager.init = function () {
            //@ts-ignore
            AudioManager.supported = window.Audio !== undefined;
            //@ts-ignore
            AudioManager.webSupported = window.AudioContext !== undefined || window.webkitAudioContext !== undefined;
            if (AudioManager.supported) {
                var audio = new Audio();
                //@ts-ignore
                AudioManager.wavSupported = audio.canPlayType("audio/wav; codecs=2").length > 0 || audio.canPlayType("audio/wav; codecs=1").length > 0 || audio.canPlayType("audio/wav; codecs=0").length > 0 || audio.canPlayType("audio/wav").length > 0;
                //@ts-ignore
                AudioManager.oggSupported = audio.canPlayType("audio/ogg; codecs=vorbis").length > 0 || audio.canPlayType("audio/ogg").length > 0;
                //@ts-ignore
                AudioManager.aacSupported = /*audio.canPlayType("audio/m4a").length > 0 ||*/ audio.canPlayType("audio/aac").length > 0 || audio.canPlayType("audio/mp4").length > 0;
            }
            //@ts-ignore
            AudioManager.supported = AudioManager.wavSupported || AudioManager.oggSupported || AudioManager.aacSupported;
            if (!AudioManager.supported || AudioManager.preferredMode == AudioManagerMode.NONE) {
                if (AudioManager.preferredMode == AudioManagerMode.NONE) {
                    console.error("Set \"AudioManager.preferredMode = AudioManagerMode.NONE\" only for testing proposes.");
                }
                //@ts-ignore
                AudioManager.mode = AudioManagerMode.NONE;
            }
            else if (AudioManager.webSupported && AudioManager.preferredMode == AudioManagerMode.WEB) {
                //@ts-ignore
                AudioManager.mode = AudioManagerMode.WEB;
                //@ts-ignore
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                //@ts-ignore
                AudioManager.context = new window.AudioContext();
                AudioManager.context.suspend();
                //@ts-ignore
                AudioManager.context.createGain = AudioManager.context.createGain || AudioManager.context.createGainNode;
            }
            else {
                if (AudioManager.preferredMode == AudioManagerMode.HTML) {
                    console.error("Set \"AudioManager.preferredMode = AudioManagerMode.HTML\" only for testing proposes.");
                }
                //@ts-ignore
                AudioManager.mode = AudioManagerMode.HTML;
            }
            //@ts-ignore
            AudioManager.inited = true;
        };
        //@ts-ignore
        AudioManager.verify = function () {
            if (Engine.System.pauseCount == 0 && AudioManager.inited && !AudioManager.verified) {
                if (AudioManager.mode == AudioManagerMode.WEB) {
                    AudioManager.context.resume();
                    if (Engine.System.pauseCount > 0) {
                        //    AudioManager.context.suspend();
                    }
                }
                //for(var player of AudioManager.players){
                //@ts-ignore
                //player.verify();
                //}
                //@ts-ignore
                AudioManager.verified = true;
            }
            if (AudioManager.verified && AudioManager.mode == AudioManagerMode.WEB && AudioManager.context.state == "suspended") {
                AudioManager.context.resume();
            }
        };
        //@ts-ignore
        AudioManager.pause = function () {
            /*
            if(AudioManager.mode == AudioManagerMode.WEB){
                if(AudioManager.verified){
                    AudioManager.context.suspend();
                }
            }
            for(var player of AudioManager.players){
                //@ts-ignore
                player.pause();
            }
            */
        };
        //@ts-ignore
        AudioManager.resume = function () {
            /*
            if(AudioManager.mode == AudioManagerMode.WEB){
                if(AudioManager.verified){
                    AudioManager.context.resume();
                }
            }
            for(var player of AudioManager.players){
                //@ts-ignore
                player.resume();
            }
            */
        };
        //@ts-ignore
        AudioManager.checkSuspended = function () {
            if (Engine.System.pauseCount == 0 && AudioManager.inited && AudioManager.verified && AudioManager.mode == AudioManagerMode.WEB && AudioManager.context.state == "suspended") {
                AudioManager.context.resume();
            }
        };
        AudioManager.preferredMode = AudioManagerMode.WEB;
        AudioManager.wavSupported = false;
        AudioManager.oggSupported = false;
        AudioManager.aacSupported = false;
        AudioManager.verified = false;
        AudioManager.supported = false;
        AudioManager.webSupported = false;
        AudioManager.players = new Array();
        AudioManager._muted = false;
        return AudioManager;
    }());
    Engine.AudioManager = AudioManager;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var InteractableBounds = /** @class */ (function () {
        function InteractableBounds() {
            this.enabled = false;
            this.pinned = false;
            this.x = 0;
            this.y = 0;
            this.xSize = 8;
            this.ySize = 8;
            this.xOffset = 0;
            this.yOffset = 0;
            this.xScale = 1;
            this.yScale = 1;
            this.xMirror = false;
            this.yMirror = false;
            this.angle = 0;
            this.useTouchRadius = true;
            this.data = null;
        }
        Object.defineProperty(InteractableBounds.prototype, "mouseOver", {
            get: function () {
                if (this.pinned) {
                    var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale);
                    var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale);
                    var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale);
                    var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale);
                }
                else {
                    var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale - Engine.Renderer.xCamera);
                    var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale - Engine.Renderer.yCamera);
                    var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale - Engine.Renderer.xCamera);
                    var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale - Engine.Renderer.yCamera);
                }
                return Engine.Mouse.in(x0, y0, x1, y1);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(InteractableBounds.prototype, "touched", {
            get: function () {
                if (this.pinned) {
                    var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale);
                    var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale);
                    var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale);
                    var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale);
                }
                else {
                    var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale - Engine.Renderer.xCamera);
                    var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale - Engine.Renderer.yCamera);
                    var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale - Engine.Renderer.xCamera);
                    var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale - Engine.Renderer.yCamera);
                }
                return Engine.TouchInput.down(x0, y0, x1, y1, this.useTouchRadius);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(InteractableBounds.prototype, "pointed", {
            get: function () {
                if (this.pinned) {
                    var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale);
                    var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale);
                    var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale);
                    var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale);
                }
                else {
                    var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale - Engine.Renderer.xCamera);
                    var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale - Engine.Renderer.yCamera);
                    var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale - Engine.Renderer.xCamera);
                    var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale - Engine.Renderer.yCamera);
                }
                return Engine.TouchInput.pressed(x0, y0, x1, y1, this.useTouchRadius);
            },
            enumerable: false,
            configurable: true
        });
        InteractableBounds.prototype.pointInside = function (x, y, radius) {
            if (this.pinned) {
                var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale);
                var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale);
                var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale);
                var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale);
            }
            else {
                var x0 = Engine.Renderer.xViewToWindow(this.x + this.xOffset * this.xScale - Engine.Renderer.xCamera);
                var y0 = Engine.Renderer.yViewToWindow(this.y + this.yOffset * this.yScale - Engine.Renderer.yCamera);
                var x1 = Engine.Renderer.xViewToWindow(this.x + (this.xSize + this.xOffset) * this.xScale - Engine.Renderer.xCamera);
                var y1 = Engine.Renderer.yViewToWindow(this.y + (this.ySize + this.yOffset) * this.yScale - Engine.Renderer.yCamera);
            }
            if (radius == null || radius == undefined) {
                radius = 1;
            }
            radius = radius == 0 ? 1 : radius;
            x /= radius;
            y /= radius;
            var rx0 = x0 / radius;
            var ry0 = y0 / radius;
            var rx1 = x1 / radius;
            var ry1 = y1 / radius;
            return x >= rx0 && x <= rx1 && y >= ry0 && y <= ry1;
        };
        InteractableBounds.prototype.render = function () {
        };
        //@ts-ignore
        InteractableBounds.prototype.setRGBA = function (red, green, blue, alpha) {
        };
        return InteractableBounds;
    }());
    Engine.InteractableBounds = InteractableBounds;
})(Engine || (Engine = {}));
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
///<reference path="InteractableBounds.ts"/>
var Engine;
(function (Engine) {
    var CanvasTexture = /** @class */ (function () {
        function CanvasTexture(sprite) {
            this.canvas = document.createElement("canvas");
            this.context = this.canvas.getContext("2d");
            //@ts-ignore
            this.context.drawImage(sprite.texture.canvas, sprite.xTexture, sprite.yTexture, sprite.xSizeTexture, sprite.ySizeTexture, 0, 0, sprite.xSizeTexture, sprite.ySizeTexture);
            //@ts-ignore
            var imageData = this.context.getImageData(0, 0, sprite.xSizeTexture, sprite.ySizeTexture);
            var data = imageData.data;
            //@ts-ignore
            for (var indexPixel = 0; indexPixel < sprite.xSizeTexture * sprite.ySizeTexture * 4; indexPixel += 4) {
                //@ts-ignore
                data[indexPixel + 0] = data[indexPixel + 0] * sprite.red;
                //@ts-ignore
                data[indexPixel + 1] = data[indexPixel + 1] * sprite.green;
                //@ts-ignore
                data[indexPixel + 2] = data[indexPixel + 2] * sprite.blue;
                //@ts-ignore
                data[indexPixel + 3] = data[indexPixel + 3] * sprite.alpha;
            }
            //@ts-ignore
            this.context.clearRect(0, 0, sprite.xSizeTexture, sprite.ySizeTexture);
            this.context.putImageData(imageData, 0, 0);
        }
        return CanvasTexture;
    }());
    var Sprite = /** @class */ (function (_super) {
        __extends(Sprite, _super);
        function Sprite() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.red = 1;
            _this.green = 1;
            _this.blue = 1;
            _this.alpha = 1;
            _this.texture = null;
            //Canvas
            _this.xTexture = 0;
            _this.yTexture = 0;
            _this.xSizeTexture = 0;
            _this.ySizeTexture = 0;
            _this.dirty = false;
            //GL
            //@ts-ignore
            _this.u0 = 0;
            //@ts-ignore
            _this.v0 = 0;
            //@ts-ignore
            _this.u1 = 0;
            //@ts-ignore
            _this.v1 = 0;
            //@ts-ignore
            _this.setHSVA = function (hue, saturation, value, alpha) {
                console.log("error");
            };
            return _this;
        }
        Sprite.prototype.setFull = function (enabled, pinned, texture, xSize, ySize, xOffset, yOffset, xTexture, yTexture, xSizeTexture, ySizeTexture) {
            if (texture == null) {
                console.log("error");
            }
            else {
                this.enabled = enabled;
                this.pinned = pinned;
                this.xSize = xSize;
                this.ySize = ySize;
                this.xOffset = xOffset;
                this.yOffset = yOffset;
                this.texture = texture;
                if (Engine.Renderer.mode == Engine.RendererMode.WEB_GL) {
                    //@ts-ignore
                    this.u0 = xTexture / texture.assetData.xSize;
                    //@ts-ignore
                    this.v0 = yTexture / texture.assetData.ySize;
                    //@ts-ignore
                    this.u1 = (xTexture + xSizeTexture) / texture.assetData.xSize;
                    //@ts-ignore
                    this.v1 = (yTexture + ySizeTexture) / texture.assetData.ySize;
                }
                else {
                    this.xTexture = xTexture;
                    this.yTexture = yTexture;
                    this.xSizeTexture = xSizeTexture;
                    this.ySizeTexture = ySizeTexture;
                    this.dirty = true;
                }
            }
        };
        Sprite.prototype.setRGBA = function (red, green, blue, alpha) {
            if (Engine.Renderer.mode == Engine.RendererMode.CANVAS_2D && (this.red != red || this.green != green || this.blue != blue || this.alpha != alpha)) {
                this.dirty = true;
            }
            //@ts-ignore
            this.red = red;
            //@ts-ignore
            this.green = green;
            //@ts-ignore
            this.blue = blue;
            //@ts-ignore
            this.alpha = alpha;
        };
        Sprite.prototype.render = function () {
            _super.prototype.render.call(this);
            if (Engine.Renderer.mode == Engine.RendererMode.CANVAS_2D && this.dirty && this.texture != null) {
                if (this.red != 1 || this.green != 1 || this.blue != 1 || this.alpha != 1) {
                    if (this.xSizeTexture > 0 && this.ySizeTexture > 0) {
                        this.canvasTexture = new CanvasTexture(this);
                    }
                    else {
                        this.canvasTexture = null;
                    }
                }
                else {
                    this.canvasTexture = null;
                }
                this.dirty = false;
            }
            //@ts-ignore
            Engine.Renderer.renderSprite(this);
        };
        return Sprite;
    }(Engine.InteractableBounds));
    Engine.Sprite = Sprite;
})(Engine || (Engine = {}));
///<reference path="Sprite.ts"/>
var Engine;
(function (Engine) {
    var Contact = /** @class */ (function () {
        function Contact(box, other, distance) {
            this.box = box;
            this.other = other;
            this.distance = distance;
        }
        return Contact;
    }());
    Engine.Contact = Contact;
    /*
    export class Overlap{
        public readonly box : Box;
        public readonly other : Box;

        public constructor(box : Box, other : Box){
            this.box = box;
            this.other = other;
        }
    }
    */
    var Point = /** @class */ (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    }());
    Engine.Point = Point;
    var Box = /** @class */ (function () {
        function Box() {
            this.position = new Int32Array(2);
            this.offset = new Int32Array(2);
            this.size = new Int32Array([8000, 8000]);
            this.enabled = false;
            this.layer = Box.LAYER_NONE;
            this.xMirror = false;
            this.yMirror = false;
            this.data = null;
            this.renderable = false;
            this.red = 0;
            this.green = 1;
            this.blue = 0;
            this.alpha = 0.5;
        }
        Object.defineProperty(Box.prototype, "x", {
            get: function () {
                return this.position[0] / Box.UNIT;
            },
            set: function (value) {
                this.position[0] = value * Box.UNIT;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "y", {
            get: function () {
                return this.position[1] / Box.UNIT;
            },
            set: function (value) {
                this.position[1] = value * Box.UNIT;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "xOffset", {
            get: function () {
                return this.offset[0] / Box.UNIT;
            },
            set: function (value) {
                this.offset[0] = value * Box.UNIT;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "yOffset", {
            get: function () {
                return this.offset[1] / Box.UNIT;
            },
            set: function (value) {
                this.offset[1] = value * Box.UNIT;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "xSize", {
            get: function () {
                return this.size[0] / Box.UNIT;
            },
            set: function (value) {
                this.size[0] = value * Box.UNIT;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Box.prototype, "ySize", {
            get: function () {
                return this.size[1] / Box.UNIT;
            },
            set: function (value) {
                this.size[1] = value * Box.UNIT;
            },
            enumerable: false,
            configurable: true
        });
        Box.setInterval = function (box, interval, xAxis) {
            if (xAxis) {
                if (box.xMirror) {
                    interval[0] = box.position[0] - box.offset[0] - box.size[0];
                    interval[1] = box.position[0] - box.offset[0];
                }
                else {
                    interval[0] = box.position[0] + box.offset[0];
                    interval[1] = box.position[0] + box.offset[0] + box.size[0];
                }
                if (box.yMirror) {
                    interval[2] = box.position[1] - box.offset[1] - box.size[1];
                    interval[3] = box.position[1] - box.offset[1];
                }
                else {
                    interval[2] = box.position[1] + box.offset[1];
                    interval[3] = box.position[1] + box.offset[1] + box.size[1];
                }
            }
            else {
                if (box.xMirror) {
                    interval[0] = box.position[1] - box.offset[1] - box.size[1];
                    interval[1] = box.position[1] - box.offset[1];
                }
                else {
                    interval[0] = box.position[1] + box.offset[1];
                    interval[1] = box.position[1] + box.offset[1] + box.size[1];
                }
                if (box.yMirror) {
                    interval[2] = box.position[0] - box.offset[0] - box.size[0];
                    interval[3] = box.position[0] - box.offset[0];
                }
                else {
                    interval[2] = box.position[0] + box.offset[0];
                    interval[3] = box.position[0] + box.offset[0] + box.size[0];
                }
            }
        };
        Box.intervalExclusiveCollides = function (startA, endA, startB, endB) {
            return (startA <= startB && startB < endA) || (startB <= startA && startA < endB);
        };
        Box.intervalDifference = function (startA, endA, startB, endB) {
            if (startA < startB) {
                return endA - startB;
            }
            return startA - endB;
        };
        Box.prototype.castAgainst = function (other, contacts, xAxis, distance, scaleDistance, mask) {
            if (scaleDistance === void 0) { scaleDistance = true; }
            if (mask === void 0) { mask = Box.LAYER_ALL; }
            if (distance != 0) {
                distance *= scaleDistance ? Box.UNIT : 1;
                Box.setInterval(this, Box.intervalA, xAxis);
                if (this == other || !other.enabled || (mask != Box.LAYER_ALL && !(mask & other.layer))) {
                    return contacts;
                }
                Box.setInterval(other, Box.intervalB, xAxis);
                if (Box.intervalExclusiveCollides(Box.intervalB[0], Box.intervalB[1], Box.intervalA[0], Box.intervalA[1])) {
                    return contacts;
                }
                if (!Box.intervalExclusiveCollides(Box.intervalB[2], Box.intervalB[3], Box.intervalA[2], Box.intervalA[3])) {
                    return contacts;
                }
                if (Box.intervalExclusiveCollides(Box.intervalB[0] - (distance > 0 ? distance : 0), Box.intervalB[1] - (distance < 0 ? distance : 0), Box.intervalA[0], Box.intervalA[1])) {
                    var intervalDist = Box.intervalDifference(Box.intervalB[0], Box.intervalB[1], Box.intervalA[0], Box.intervalA[1]);
                    if (Math.abs(distance) < Math.abs(intervalDist)) {
                        return contacts;
                    }
                    if (contacts == null || contacts.length == 0 || Math.abs(intervalDist) < Math.abs(contacts[0].distance)) {
                        contacts = [];
                        contacts[0] = new Contact(this, other, intervalDist);
                    }
                    else if (Math.abs(intervalDist) == Math.abs(contacts[0].distance)) {
                        contacts = contacts || [];
                        contacts.push(new Contact(this, other, intervalDist));
                    }
                }
            }
            return contacts;
        };
        Box.prototype.cast = function (boxes, contacts, xAxis, distance, scaleDistance, mask) {
            if (scaleDistance === void 0) { scaleDistance = true; }
            if (mask === void 0) { mask = Box.LAYER_ALL; }
            for (var _i = 0, boxes_1 = boxes; _i < boxes_1.length; _i++) {
                var other = boxes_1[_i];
                contacts = this.castAgainst(other, contacts, xAxis, distance, scaleDistance, mask);
            }
            return contacts;
        };
        Box.prototype.collideAgainst = function (other, overlaps, xAxis, distance, scaleDistance, mask) {
            if (overlaps === void 0) { overlaps = null; }
            if (xAxis === void 0) { xAxis = false; }
            if (distance === void 0) { distance = 0; }
            if (scaleDistance === void 0) { scaleDistance = true; }
            if (mask === void 0) { mask = Box.LAYER_ALL; }
            distance *= scaleDistance ? Box.UNIT : 1;
            if (this == other || !other.enabled || (mask != Box.LAYER_ALL && !(mask & other.layer))) {
                return overlaps;
            }
            Box.setInterval(this, Box.intervalA, xAxis);
            Box.setInterval(other, Box.intervalB, xAxis);
            if (!Box.intervalExclusiveCollides(Box.intervalB[2], Box.intervalB[3], Box.intervalA[2], Box.intervalA[3])) {
                return overlaps;
            }
            if (Box.intervalExclusiveCollides(Box.intervalB[0] - (distance > 0 ? distance : 0), Box.intervalB[1] - (distance < 0 ? distance : 0), Box.intervalA[0], Box.intervalA[1])) {
                overlaps = overlaps || [];
                overlaps.push(new Contact(this, other, 0));
            }
            return overlaps;
        };
        Box.prototype.collide = function (boxes, overlaps, xAxis, distance, scaleDistance, mask) {
            if (overlaps === void 0) { overlaps = null; }
            if (xAxis === void 0) { xAxis = false; }
            if (distance === void 0) { distance = 0; }
            if (scaleDistance === void 0) { scaleDistance = true; }
            if (mask === void 0) { mask = Box.LAYER_ALL; }
            for (var _i = 0, boxes_2 = boxes; _i < boxes_2.length; _i++) {
                var other = boxes_2[_i];
                overlaps = this.collideAgainst(other, overlaps, xAxis, distance, scaleDistance, mask);
            }
            return overlaps;
        };
        Box.prototype.getDist = function (other, dir, xAxis) {
            Box.setInterval(this, Box.intervalA, xAxis);
            Box.setInterval(other, Box.intervalB, xAxis);
            if (dir >= 0) {
                return Box.intervalB[0] - Box.intervalA[1];
            }
            else {
                return Box.intervalB[1] - Box.intervalA[0];
            }
        };
        Box.prototype.translate = function (contacts, xAxis, distance, scaleDistance) {
            if (scaleDistance === void 0) { scaleDistance = true; }
            distance *= scaleDistance ? Box.UNIT : 1;
            if (contacts == null || contacts.length == 0) {
                this.position[0] += xAxis ? distance : 0;
                this.position[1] += xAxis ? 0 : distance;
            }
            else {
                this.position[0] += xAxis ? contacts[0].distance : 0;
                this.position[1] += xAxis ? 0 : contacts[0].distance;
            }
        };
        Box.prototype.getExtrapolation = function (boxes, xDistance, yDistance, scaleDistance, mask) {
            if (scaleDistance === void 0) { scaleDistance = true; }
            if (mask === void 0) { mask = Box.LAYER_ALL; }
            var oldX = this.position[0];
            var oldY = this.position[1];
            xDistance = xDistance * Engine.System.stepExtrapolation;
            yDistance = yDistance * Engine.System.stepExtrapolation;
            if (boxes == null) {
                this.position[0] += xDistance * (scaleDistance ? Box.UNIT : 1);
                this.position[1] += yDistance * (scaleDistance ? Box.UNIT : 1);
            }
            else {
                var contacts = this.cast(boxes, null, true, xDistance, scaleDistance, mask);
                this.translate(contacts, true, xDistance, scaleDistance);
                contacts = this.cast(boxes, null, false, yDistance, scaleDistance, mask);
                this.translate(contacts, false, yDistance, scaleDistance);
            }
            var point = new Point(this.position[0] / Box.UNIT, this.position[1] / Box.UNIT);
            this.position[0] = oldX;
            this.position[1] = oldY;
            return point;
        };
        Box.renderBoxAt = function (box, x, y) {
            if (Box.debugRender && box.enabled && box.renderable) {
                if (Box.sprite == null) {
                    Box.sprite = new Engine.Sprite();
                    Box.sprite.enabled = true;
                }
                Box.sprite.x = x;
                Box.sprite.y = y;
                Box.sprite.xOffset = box.offset[0] / Box.UNIT;
                Box.sprite.yOffset = box.offset[1] / Box.UNIT;
                Box.sprite.xSize = box.size[0] / Box.UNIT;
                Box.sprite.ySize = box.size[1] / Box.UNIT;
                Box.sprite.xMirror = box.xMirror;
                Box.sprite.yMirror = box.yMirror;
                Box.sprite.setRGBA(box.red, box.green, box.blue, box.alpha);
                Box.sprite.render();
            }
        };
        Box.prototype.render = function () {
            Box.renderBoxAt(this, this.x, this.y);
        };
        Box.prototype.renderAt = function (x, y) {
            Box.renderBoxAt(this, x, y);
        };
        Box.prototype.renderExtrapolated = function (boxes, xDistance, yDistance, scaleDistance, mask) {
            if (scaleDistance === void 0) { scaleDistance = true; }
            if (mask === void 0) { mask = Box.LAYER_ALL; }
            var point = this.getExtrapolation(boxes, xDistance, yDistance, scaleDistance, mask);
            Box.renderBoxAt(this, point.x, point.y);
        };
        Box.UNIT = 1000.0;
        Box.LAYER_NONE = 0;
        Box.LAYER_ALL = 1;
        Box.debugRender = true;
        Box.intervalA = new Int32Array(4);
        Box.intervalB = new Int32Array(4);
        return Box;
    }());
    Engine.Box = Box;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Data = /** @class */ (function () {
        function Data() {
        }
        Data.setID = function (domain, developer, game) {
            Data.id = domain + "." + developer + "." + game;
            Data.idToken = Data.id + ".";
        };
        Data.validateID = function () {
            if (Data.id == "") {
                console.error("PLEASE SET A VALID DATA ID");
            }
        };
        Data.save = function (name, value, days) {
            Data.externalSave(name, value);
            Data.validateID();
            name = Data.idToken + name;
            if (Data.useLocalStorage) {
                try {
                    localStorage.setItem(name, value + "");
                }
                catch (error) {
                    console.log(error);
                }
            }
            else {
                try {
                    var date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    var expires = "expires=" + date.toUTCString();
                    document.cookie = name + "=" + value + ";" + expires + ";path=/; SameSite=None; Secure";
                }
                catch (error) {
                    console.log(error);
                }
            }
        };
        ;
        Data.load = function (name) {
            var externalRet = Data.externalLoad(name);
            if (externalRet != null && externalRet != undefined) {
                return externalRet;
            }
            Data.validateID();
            name = Data.idToken + name;
            if (Data.useLocalStorage) {
                try {
                    return localStorage.getItem(name);
                }
                catch (error) {
                    console.log(error);
                    return null;
                }
            }
            else {
                try {
                    name = name + "=";
                    var arrayCookies = document.cookie.split(';');
                    for (var indexCoockie = 0; indexCoockie < arrayCookies.length; indexCoockie += 1) {
                        var cookie = arrayCookies[indexCoockie];
                        while (cookie.charAt(0) == ' ') {
                            cookie = cookie.substring(1);
                        }
                        if (cookie.indexOf(name) == 0) {
                            return cookie.substring(name.length, cookie.length);
                        }
                    }
                    return null;
                }
                catch (error) {
                    console.log(error);
                    return null;
                }
            }
        };
        ;
        Data.id = "";
        Data.idToken = "";
        Data.useLocalStorage = false;
        Data.externalSave = function (_name, _value) { };
        Data.externalLoad = function (_name) { return null; };
        return Data;
    }());
    Engine.Data = Data;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Entity = /** @class */ (function () {
        function Entity() {
            this.preserved = false;
            Engine.System.addListenersFrom(this);
        }
        return Entity;
    }());
    Engine.Entity = Entity;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Keyboard = /** @class */ (function () {
        function Keyboard() {
        }
        Keyboard.hasDown = function (keyCode, old) {
            for (var indexCode = 0; indexCode < (old ? Keyboard.oldKeyPressEvents.length : Keyboard.keyPressEvents.length); indexCode += 1) {
                if (keyCode == (old ? Keyboard.oldKeyPressEvents[indexCode] : Keyboard.keyPressEvents[indexCode])) {
                    return true;
                }
            }
            return false;
        };
        Keyboard.down = function (keyCode) {
            return Keyboard.hasDown(keyCode, false);
        };
        Keyboard.onDown = function (event) {
            if (event.key == null || event.key == undefined) {
                return false;
            }
            var code = event.key.toLowerCase();
            var indexCode = Keyboard.readedKeyPressEvents.length;
            for (var indexEvent = 0; indexEvent < Keyboard.readedKeyPressEvents.length; indexEvent += 1) {
                if (Keyboard.readedKeyPressEvents[indexEvent] == "") {
                    indexCode = indexEvent;
                }
                else if (Keyboard.readedKeyPressEvents[indexEvent] == code) {
                    indexCode = -1;
                    break;
                }
            }
            if (indexCode >= 0) {
                Keyboard.readedKeyPressEvents[indexCode] = code;
            }
            switch (code) {
                case Keyboard.UP:
                case "up":
                case "Up":
                case Keyboard.DOWN:
                case "down":
                case "Down":
                case Keyboard.LEFT:
                case "left":
                case "Left":
                case Keyboard.RIGHT:
                case "right":
                case "Right":
                case Keyboard.SPACE:
                case "space":
                case "Space":
                case " ":
                case "spacebar":
                case Keyboard.ESC:
                case "esc":
                case "Esc":
                case "ESC":
                    event.preventDefault();
                    //@ts-ignore
                    if (event.stopPropagation !== "undefined") {
                        event.stopPropagation();
                    }
                    else {
                        event.cancelBubble = true;
                    }
                    return true;
            }
            return false;
        };
        Keyboard.onUp = function (event) {
            if (event.key == null || event.key == undefined) {
                return false;
            }
            var code = event.key.toLowerCase();
            for (var indexEvent = 0; indexEvent < Keyboard.readedKeyPressEvents.length; indexEvent += 1) {
                if (Keyboard.readedKeyPressEvents[indexEvent] == code) {
                    Keyboard.readedKeyPressEvents[indexEvent] = "";
                    break;
                }
            }
            return false;
        };
        //@ts-ignore
        Keyboard.update = function () {
            for (var indexEvent = 0; indexEvent < Keyboard.keyPressEvents.length; indexEvent += 1) {
                Keyboard.oldKeyPressEvents[indexEvent] = Keyboard.keyPressEvents[indexEvent];
            }
            for (var indexEvent = 0; indexEvent < Keyboard.readedKeyPressEvents.length; indexEvent += 1) {
                Keyboard.keyPressEvents[indexEvent] = Keyboard.readedKeyPressEvents[indexEvent];
            }
        };
        Keyboard.A = "a";
        Keyboard.B = "b";
        Keyboard.C = "c";
        Keyboard.D = "d";
        Keyboard.E = "e";
        Keyboard.F = "f";
        Keyboard.G = "g";
        Keyboard.H = "h";
        Keyboard.I = "i";
        Keyboard.J = "j";
        Keyboard.K = "k";
        Keyboard.L = "l";
        Keyboard.M = "m";
        Keyboard.N = "n";
        Keyboard.O = "o";
        Keyboard.P = "p";
        Keyboard.Q = "q";
        Keyboard.R = "r";
        Keyboard.S = "s";
        Keyboard.T = "t";
        Keyboard.U = "u";
        Keyboard.V = "v";
        Keyboard.W = "w";
        Keyboard.X = "x";
        Keyboard.Y = "y";
        Keyboard.Z = "z";
        Keyboard.UP = "arrowup";
        Keyboard.DOWN = "arrowdown";
        Keyboard.LEFT = "arrowleft";
        Keyboard.RIGHT = "arrowright";
        Keyboard.SPACE = " ";
        Keyboard.ESC = "escape";
        Keyboard.readedKeyPressEvents = [];
        Keyboard.oldKeyPressEvents = [];
        Keyboard.keyPressEvents = [];
        Keyboard.up = function (keyCode) {
            return !Keyboard.hasDown(keyCode, false);
        };
        Keyboard.pressed = function (keyCode) {
            return Keyboard.hasDown(keyCode, false) && !Keyboard.hasDown(keyCode, true);
        };
        Keyboard.released = function (keyCode) {
            return !Keyboard.hasDown(keyCode, false) && Keyboard.hasDown(keyCode, true);
        };
        return Keyboard;
    }());
    Engine.Keyboard = Keyboard;
    //@ts-ignore
    window.addEventListener("keydown", Keyboard.onDown, false);
    //@ts-ignore
    window.addEventListener("keyup", Keyboard.onUp, false);
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Link = /** @class */ (function () {
        function Link(owner, url) {
            this.owner = owner;
            this.url = url;
        }
        return Link;
    }());
    var LinkManager = /** @class */ (function () {
        function LinkManager() {
        }
        LinkManager.add = function (owner, url) {
            var link = null;
            for (var _i = 0, _a = LinkManager.links; _i < _a.length; _i++) {
                var arrayLink = _a[_i];
                if (arrayLink.owner == owner && arrayLink.url == url) {
                    link = arrayLink;
                }
            }
            if (link == null) {
                LinkManager.links.push(new Link(owner, url));
            }
        };
        LinkManager.remove = function (owner, url) {
            var newLinks = new Array();
            for (var _i = 0, _a = LinkManager.links; _i < _a.length; _i++) {
                var link = _a[_i];
                if (link.owner != owner || link.url != url) {
                    newLinks.push(link);
                }
            }
            LinkManager.links = newLinks;
        };
        LinkManager.triggerMouse = function (event) {
            if (Game.LevelAdLoader.instance != null && Game.LevelAdLoader.blocked) {
                return;
            }
            for (var _i = 0, _a = LinkManager.links; _i < _a.length; _i++) {
                var link = _a[_i];
                if (link.owner.bounds == null || (link.owner.bounds.enabled && link.owner.bounds.pointInside(event.clientX, event.clientY, 1) && link.owner.linkCondition())) {
                    if (link.owner != null && link.owner.onLinkTrigger != null) {
                        link.owner.onLinkTrigger(false);
                    }
                    else {
                        window.open(link.url, '_blank');
                    }
                }
            }
        };
        LinkManager.triggerTouch = function (event) {
            if (Game.LevelAdLoader.instance != null && Game.LevelAdLoader.blocked) {
                return;
            }
            for (var _i = 0, _a = LinkManager.links; _i < _a.length; _i++) {
                var link = _a[_i];
                for (var indexEventTouch = 0; indexEventTouch < event.changedTouches.length; indexEventTouch += 1) {
                    var touch = event.changedTouches.item(indexEventTouch);
                    var radius = touch.radiusX < touch.radiusY ? touch.radiusX : touch.radiusY;
                    //if(radius == null || radius == undefined){
                    radius = 1;
                    //}
                    if (link.owner.bounds == null || (link.owner.bounds.enabled && link.owner.bounds.pointInside(touch.clientX, touch.clientY, radius) && link.owner.linkCondition())) {
                        if (link.owner != null && link.owner.onLinkTrigger != null) {
                            link.owner.onLinkTrigger(true);
                        }
                        else {
                            window.open(link.url, '_blank');
                        }
                        break;
                    }
                }
            }
        };
        LinkManager.links = new Array();
        return LinkManager;
    }());
    Engine.LinkManager = LinkManager;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Mouse = /** @class */ (function () {
        function Mouse() {
        }
        Object.defineProperty(Mouse, "x", {
            get: function () {
                return Mouse._x;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Mouse, "y", {
            get: function () {
                return Mouse._y;
            },
            enumerable: false,
            configurable: true
        });
        Mouse.hasDown = function (indexButton, old) {
            if (indexButton < (old ? Mouse.oldButtonPressEvents.length : Mouse.buttonPressEvents.length)) {
                return old ? Mouse.oldButtonPressEvents[indexButton] : Mouse.buttonPressEvents[indexButton];
            }
            return false;
        };
        ;
        Mouse.down = function (indexButton) {
            return Mouse.hasDown(indexButton, false);
        };
        Mouse.up = function (indexButton) {
            return !Mouse.hasDown(indexButton, false);
        };
        Mouse.pressed = function (indexButton) {
            return Mouse.hasDown(indexButton, false) && !Mouse.hasDown(indexButton, true);
        };
        Mouse.released = function (indexButton) {
            return !Mouse.hasDown(indexButton, false) && Mouse.hasDown(indexButton, true);
        };
        Mouse.in = function (x0, y0, x1, y1) {
            return x0 <= Mouse._x && x1 >= Mouse._x && y0 <= Mouse._y && y1 >= Mouse._y;
        };
        Mouse.clickedIn = function (indexButton, x0, y0, x1, y1) {
            if (Mouse.released(indexButton)) {
                var downX = Mouse.pressPositionsX[indexButton];
                var downY = Mouse.pressPositionsY[indexButton];
                var downIn = x0 <= downX && x1 >= downX && y0 <= downY && y1 >= downY;
                var upIn = Mouse.in(x0, y0, x1, y1);
                return downIn && upIn;
            }
            return false;
        };
        Mouse.onDown = function (event) {
            Mouse._x = event.clientX;
            Mouse._y = event.clientY;
            Mouse.readedButtonPressEvents[event.button] = true;
            Mouse.pressPositionsX[event.button] = Mouse._x;
            Mouse.pressPositionsY[event.button] = Mouse._y;
            return false;
        };
        Mouse.onUp = function (event) {
            Mouse._x = event.clientX;
            Mouse._y = event.clientY;
            Mouse.readedButtonPressEvents[event.button] = false;
            return false;
        };
        Mouse.onMove = function (event) {
            Mouse._x = event.clientX;
            Mouse._y = event.clientY;
            return false;
        };
        //@ts-ignore
        Mouse.update = function () {
            for (var indexEvent = 0; indexEvent < Mouse.buttonPressEvents.length; indexEvent += 1) {
                Mouse.oldButtonPressEvents[indexEvent] = Mouse.buttonPressEvents[indexEvent];
            }
            for (var indexEvent = 0; indexEvent < Mouse.readedButtonPressEvents.length; indexEvent += 1) {
                Mouse.buttonPressEvents[indexEvent] = Mouse.readedButtonPressEvents[indexEvent];
            }
        };
        Mouse._x = 0;
        Mouse._y = 0;
        Mouse.readedButtonPressEvents = new Array();
        Mouse.oldButtonPressEvents = new Array();
        Mouse.buttonPressEvents = new Array();
        Mouse.pressPositionsX = new Array();
        Mouse.pressPositionsY = new Array();
        return Mouse;
    }());
    Engine.Mouse = Mouse;
    //@ts-ignore
    window.addEventListener("mousedown", Mouse.onDown, false);
    //@ts-ignore
    window.addEventListener("mouseup", Mouse.onUp, false);
    //@ts-ignore
    window.addEventListener("mousemove", Mouse.onMove, false);
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var RendererMode;
    (function (RendererMode) {
        RendererMode[RendererMode["CANVAS_2D"] = 0] = "CANVAS_2D";
        RendererMode[RendererMode["WEB_GL"] = 1] = "WEB_GL";
    })(RendererMode = Engine.RendererMode || (Engine.RendererMode = {}));
    var Renderer = /** @class */ (function () {
        function Renderer() {
        }
        Renderer.xViewToWindow = function (x) {
            return (x + Renderer.xSizeView * 0.5) * (Renderer.xSizeWindow) / Renderer.xSizeView;
        };
        Renderer.yViewToWindow = function (y) {
            return (y + Renderer.ySizeView * 0.5) * (Renderer.ySizeWindow) / Renderer.ySizeView;
        };
        /*
        public static xViewToWindow(x : number){
            return (x + Renderer.xSizeView * 0.5) * (Renderer.xSizeWindow) / Renderer.xSizeView - (Renderer.topLeftCamera ? (Renderer.xSizeWindow) * 0.5 : 0);
        }
    
        public static yViewToWindow(y : number){
            return (y + Renderer.ySizeView * 0.5) * (SysRenderertem.ySizeWindow) / Renderer.ySizeView - (Renderer.topLeftCamera ? (Renderer.ySizeWindow) * 0.5 : 0);
        }

        Engine.topLeftCamera = function(enabled){
            System.topLeftCamera = enabled;
            if(System.usingGLRenderer){
                System.Renderer.gl.uniform1i(System.glTopLeftCamera, enabled ? 1 : 0);
            }
        }
        */
        Renderer.camera = function (x, y) {
            Renderer.xCamera = x;
            Renderer.yCamera = y;
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.uniform2f(Renderer.glCameraPosition, x, y);
            }
        };
        Renderer.sizeView = function (x, y) {
            Renderer.xSizeViewIdeal = x;
            Renderer.ySizeViewIdeal = y;
            Renderer.fixViewValues();
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.uniform2f(Renderer.glSizeView, Renderer.xSizeView, Renderer.xSizeView);
            }
        };
        Renderer.scaleView = function (x, y) {
            Renderer.xScaleView = x;
            Renderer.yScaleView = y;
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.uniform2f(Renderer.glScaleView, x, y);
            }
        };
        ;
        Renderer.clearColor = function (red, green, blue) {
            Renderer.clearRed = red;
            Renderer.clearGreen = green;
            Renderer.clearBlue = blue;
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.clearColor(red, green, blue, 1);
            }
        };
        Renderer.fixViewValues = function () {
            Renderer.xFitView = Renderer.ySizeWindow > Renderer.xSizeWindow || (Renderer.xSizeWindow / Renderer.ySizeWindow < (Renderer.xSizeViewIdeal / Renderer.ySizeViewIdeal - 0.001));
            if (Renderer.xFitView) {
                //@ts-ignore
                Renderer.xSizeView = Renderer.xSizeViewIdeal;
                //@ts-ignore
                Renderer.ySizeView = Renderer.ySizeWindow * Renderer.xSizeViewIdeal / Renderer.xSizeWindow;
            }
            else {
                //@ts-ignore
                Renderer.xSizeView = Renderer.xSizeWindow * Renderer.ySizeViewIdeal / Renderer.ySizeWindow;
                //@ts-ignore
                Renderer.ySizeView = Renderer.ySizeViewIdeal;
            }
        };
        //@ts-ignore
        Renderer.fixCanvasSize = function () {
            if (Renderer.autoscale) {
                var xSize = window.innerWidth;
                var ySize = window.innerHeight;
                Renderer.canvas.style.width = "100%";
                Renderer.canvas.style.height = "100%";
                Renderer.canvas.width = xSize * (Renderer.useDPI ? Renderer.dpr : 1);
                Renderer.canvas.height = ySize * (Renderer.useDPI ? Renderer.dpr : 1);
                //@ts-ignore
                Renderer.xSizeWindow = xSize;
                //@ts-ignore
                Renderer.ySizeWindow = ySize;
                Renderer.fixViewValues();
            }
            if (Renderer.mode == RendererMode.WEB_GL) {
                Renderer.gl.viewport(0, 0, Renderer.canvas.width, Renderer.canvas.height);
                Renderer.gl.uniform2f(Renderer.glSizeView, Renderer.xSizeView, Renderer.ySizeView);
            }
            else {
                if (Renderer.context.imageSmoothingEnabled != null && Renderer.context.imageSmoothingEnabled != undefined) {
                    Renderer.context.imageSmoothingEnabled = false;
                }
                //@ts-ignore
                else if (Renderer.context.msImageSmoothingEnabled != null && Renderer.context.msImageSmoothingEnabled != undefined) {
                    //@ts-ignore
                    Renderer.context.msImageSmoothingEnabled = false;
                }
            }
        };
        //@ts-ignore
        Renderer.clear = function () {
            if (Renderer.mode == RendererMode.CANVAS_2D) {
                Renderer.context.fillStyle = "rgba(" + Renderer.clearRed * 255 + ", " + Renderer.clearGreen * 255 + ", " + Renderer.clearBlue * 255 + ", 1.0)";
                Renderer.context.fillRect(0, 0, Renderer.canvas.width, Renderer.canvas.height);
            }
            else {
                Renderer.gl.clear(Renderer.gl.COLOR_BUFFER_BIT);
            }
            //@ts-ignore
            Renderer.drawCalls = 0;
        };
        //@ts-ignore
        Renderer.renderSprite = function (sprite) {
            if (sprite.enabled) {
                if (Renderer.mode == RendererMode.CANVAS_2D) {
                    Renderer.context.scale((Renderer.useDPI ? Renderer.dpr : 1), (Renderer.useDPI ? Renderer.dpr : 1));
                    Renderer.context.translate(Renderer.xSizeWindow * 0.5, Renderer.ySizeWindow * 0.5);
                    if (Renderer.xFitView) {
                        Renderer.context.scale(Renderer.xSizeWindow / Renderer.xSizeView, Renderer.xSizeWindow / Renderer.xSizeView);
                    }
                    else {
                        Renderer.context.scale(Renderer.ySizeWindow / Renderer.ySizeView, Renderer.ySizeWindow / Renderer.ySizeView);
                    }
                    if (Renderer.xScaleView != 1 && Renderer.yScaleView != 1) {
                        Renderer.context.scale(Renderer.xScaleView, Renderer.yScaleView);
                    }
                    if (!sprite.pinned) {
                        Renderer.context.translate(-Renderer.xCamera, -Renderer.yCamera);
                    }
                    Renderer.context.translate(sprite.x, sprite.y);
                    if (sprite.xScale != 1 || sprite.yScale != 1 || sprite.xMirror || sprite.yMirror) {
                        Renderer.context.scale(sprite.xScale * (sprite.xMirror ? -1 : 1), sprite.yScale * (sprite.yMirror ? -1 : 1));
                    }
                    //if(sprite.xSize != sprite.xSizeTexture || sprite.ySize != sprite.ySizeTexture){
                    //    System.context.scale(sprite.xSize / sprite.xSizeTexture, sprite.ySize / sprite.ySizeTexture);
                    //}
                    if (sprite.angle != 0) {
                        Renderer.context.rotate(sprite.angle * Engine.System.PI_OVER_180);
                    }
                    Renderer.context.translate(sprite.xOffset, sprite.yOffset);
                    //@ts-ignore
                    if (sprite.texture == null) {
                        Renderer.context.fillStyle = "rgba(" + sprite.red * 255 + ", " + sprite.green * 255 + ", " + sprite.blue * 255 + ", " + sprite.alpha + ")";
                        Renderer.context.fillRect(0, 0, sprite.xSize, sprite.ySize);
                    }
                    //@ts-ignore
                    else if (sprite.canvasTexture == null) {
                        //@ts-ignore
                        Renderer.context.drawImage(sprite.texture.canvas, sprite.xTexture, sprite.yTexture, sprite.xSizeTexture, sprite.ySizeTexture, 0, 0, sprite.xSize, sprite.ySize);
                    }
                    else {
                        //@ts-ignore
                        Renderer.context.drawImage(sprite.canvasTexture.canvas, 0, 0, sprite.xSizeTexture, sprite.ySizeTexture, 0, 0, sprite.xSize, sprite.ySize);
                    }
                    if (Renderer.context.resetTransform != null && Renderer.context.resetTransform != undefined) {
                        Renderer.context.resetTransform();
                    }
                    else {
                        Renderer.context.setTransform(1, 0, 0, 1, 0, 0);
                    }
                }
                else {
                    if (Renderer.drawableCount == Renderer.maxElementsDrawCall) {
                        Renderer.update();
                    }
                    Renderer.vertexArray.push(sprite.pinned ? 1 : 0);
                    Renderer.vertexArray.push(sprite.x);
                    Renderer.vertexArray.push(sprite.y);
                    Renderer.vertexArray.push(sprite.xOffset);
                    Renderer.vertexArray.push(sprite.yOffset);
                    Renderer.vertexArray.push(sprite.xScale);
                    Renderer.vertexArray.push(sprite.yScale);
                    Renderer.vertexArray.push(sprite.xMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.yMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.angle);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.u0);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.v0);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.texture == null ? -1 : sprite.texture.slot);
                    Renderer.vertexArray.push(sprite.red);
                    Renderer.vertexArray.push(sprite.green);
                    Renderer.vertexArray.push(sprite.blue);
                    Renderer.vertexArray.push(sprite.alpha);
                    Renderer.vertexArray.push(sprite.pinned ? 1 : 0);
                    Renderer.vertexArray.push(sprite.x);
                    Renderer.vertexArray.push(sprite.y);
                    Renderer.vertexArray.push(sprite.xOffset + sprite.xSize);
                    Renderer.vertexArray.push(sprite.yOffset);
                    Renderer.vertexArray.push(sprite.xScale);
                    Renderer.vertexArray.push(sprite.yScale);
                    Renderer.vertexArray.push(sprite.xMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.yMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.angle);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.u1);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.v0);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.texture == null ? -1 : sprite.texture.slot);
                    Renderer.vertexArray.push(sprite.red);
                    Renderer.vertexArray.push(sprite.green);
                    Renderer.vertexArray.push(sprite.blue);
                    Renderer.vertexArray.push(sprite.alpha);
                    Renderer.vertexArray.push(sprite.pinned ? 1 : 0);
                    Renderer.vertexArray.push(sprite.x);
                    Renderer.vertexArray.push(sprite.y);
                    Renderer.vertexArray.push(sprite.xOffset);
                    Renderer.vertexArray.push(sprite.yOffset + sprite.ySize);
                    Renderer.vertexArray.push(sprite.xScale);
                    Renderer.vertexArray.push(sprite.yScale);
                    Renderer.vertexArray.push(sprite.xMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.yMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.angle);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.u0);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.v1);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.texture == null ? -1 : sprite.texture.slot);
                    Renderer.vertexArray.push(sprite.red);
                    Renderer.vertexArray.push(sprite.green);
                    Renderer.vertexArray.push(sprite.blue);
                    Renderer.vertexArray.push(sprite.alpha);
                    Renderer.vertexArray.push(sprite.pinned ? 1 : 0);
                    Renderer.vertexArray.push(sprite.x);
                    Renderer.vertexArray.push(sprite.y);
                    Renderer.vertexArray.push(sprite.xOffset + sprite.xSize);
                    Renderer.vertexArray.push(sprite.yOffset + sprite.ySize);
                    Renderer.vertexArray.push(sprite.xScale);
                    Renderer.vertexArray.push(sprite.yScale);
                    Renderer.vertexArray.push(sprite.xMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.yMirror ? 1 : 0);
                    Renderer.vertexArray.push(sprite.angle);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.u1);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.v1);
                    //@ts-ignore
                    Renderer.vertexArray.push(sprite.texture == null ? -1 : sprite.texture.slot);
                    Renderer.vertexArray.push(sprite.red);
                    Renderer.vertexArray.push(sprite.green);
                    Renderer.vertexArray.push(sprite.blue);
                    Renderer.vertexArray.push(sprite.alpha);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 0);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 1);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 2);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 1);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 3);
                    Renderer.faceArray.push(Renderer.SPRITE_RENDERER_VERTICES * Renderer.drawableCount + 2);
                    Renderer.drawableCount += 1;
                }
            }
        };
        Renderer.update = function () {
            if (Renderer.mode == RendererMode.CANVAS_2D) {
                //@ts-ignore
                Renderer.drawCalls += 1;
            }
            else {
                if (Renderer.drawableCount > 0) {
                    Renderer.gl.bindBuffer(Renderer.gl.ARRAY_BUFFER, Renderer.vertexBuffer);
                    Renderer.gl.bufferData(Renderer.gl.ARRAY_BUFFER, new Float32Array(Renderer.vertexArray), Renderer.gl.DYNAMIC_DRAW);
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexPinned, 1, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (0));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexAnchor, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexPosition, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexScale, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexMirror, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexAngle, 1, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexUV, 2, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2 + 2 + 1));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexTexture, 1, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2));
                    Renderer.gl.vertexAttribPointer(Renderer.glVertexColor, 4, Renderer.gl.FLOAT, false, 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1 + 4), 4 * (1 + 2 + 2 + 2 + 2 + 1 + 2 + 1));
                    Renderer.gl.bindBuffer(Renderer.gl.ELEMENT_ARRAY_BUFFER, Renderer.faceBuffer);
                    Renderer.gl.bufferData(Renderer.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Renderer.faceArray), Renderer.gl.DYNAMIC_DRAW);
                    Renderer.gl.drawElements(Renderer.gl.TRIANGLES, Renderer.drawableCount * (3 + 3), Renderer.gl.UNSIGNED_SHORT, 0);
                    Renderer.gl.flush();
                    //@ts-ignore
                    Renderer.drawCalls += 1;
                    Renderer.vertexArray = [];
                    Renderer.faceArray = [];
                    Renderer.drawableCount = 0;
                }
            }
        };
        //@ts-ignore
        Renderer.updateHandCursor = function () {
            if (Renderer.useHandPointer) {
                Renderer.canvas.style.cursor = "pointer";
                Renderer.useHandPointer = false;
            }
            else {
                Renderer.canvas.style.cursor = "default";
            }
        };
        //@ts-ignore
        Renderer.init = function () {
            Renderer.canvas = document.getElementById('gameCanvas');
            if (Renderer.autoscale) {
                Renderer.canvas.style.display = "block";
                Renderer.canvas.style.position = "absolute";
                Renderer.canvas.style.top = "0px";
                Renderer.canvas.style.left = "0px";
                var xSize = window.innerWidth;
                var ySize = window.innerHeight;
                Renderer.canvas.style.width = "100%";
                Renderer.canvas.style.height = "100%";
                Renderer.canvas.width = xSize * (Renderer.useDPI ? Renderer.dpr : 1);
                Renderer.canvas.height = ySize * (Renderer.useDPI ? Renderer.dpr : 1);
                //@ts-ignore
                Renderer.xSizeWindow = xSize;
                //@ts-ignore
                Renderer.ySizeWindow = ySize;
                //@ts-ignore
                Renderer.xSizeView = Renderer.xSizeWindow * Renderer.ySizeViewIdeal / Renderer.ySizeWindow;
                //@ts-ignore
                Renderer.ySizeView = Renderer.ySizeViewIdeal;
                Renderer.fixViewValues();
            }
            else {
                //@ts-ignore
                Renderer.xSizeWindow = Renderer.canvas.width;
                //@ts-ignore
                Renderer.ySizeWindow = Renderer.canvas.height;
                //@ts-ignore
                Renderer.xSizeView = Renderer.xSizeWindow * Renderer.ySizeViewIdeal / Renderer.ySizeWindow;
                //@ts-ignore
                Renderer.ySizeView = Renderer.ySizeViewIdeal;
                Renderer.fixViewValues();
            }
            if (Renderer.preferredMode == RendererMode.WEB_GL) {
                try {
                    //@ts-ignore
                    Renderer.gl = Renderer.canvas.getContext("webgl") || Renderer.canvas.getContext("experimental-webgl");
                    //@ts-ignore
                    Renderer.glSupported = Renderer.gl && Renderer.gl instanceof WebGLRenderingContext;
                }
                catch (e) {
                    //@ts-ignore
                    Renderer.glSupported = false;
                }
            }
            if (Renderer.glSupported && Renderer.preferredMode == RendererMode.WEB_GL) {
                //@ts-ignore
                Renderer.mode = RendererMode.WEB_GL;
                Engine.Assets.queue(Renderer.PATH_SHADER_VERTEX);
                Engine.Assets.queue(Renderer.PATH_SHADER_FRAGMENT);
                Engine.Assets.download();
                Renderer.initGL();
            }
            else {
                if (Renderer.preferredMode == RendererMode.CANVAS_2D) {
                    console.error("Set \"Renderer.preferredMode = RendererMode.CANVAS_2D\" only for testing proposes.");
                }
                //@ts-ignore
                Renderer.mode = RendererMode.CANVAS_2D;
                Renderer.context = Renderer.canvas.getContext("2d");
                if (Renderer.context.imageSmoothingEnabled != null && Renderer.context.imageSmoothingEnabled != undefined) {
                    Renderer.context.imageSmoothingEnabled = false;
                }
                //@ts-ignore
                else if (Renderer.context.msImageSmoothingEnabled != null && Renderer.context.msImageSmoothingEnabled != undefined) {
                    //@ts-ignore
                    Renderer.context.msImageSmoothingEnabled = false;
                }
                //@ts-ignore
                Renderer.inited = true;
            }
        };
        Renderer.getGLTextureUnitIndex = function (index) {
            switch (index) {
                case 0: return Renderer.gl.TEXTURE0;
                case 1: return Renderer.gl.TEXTURE1;
                case 2: return Renderer.gl.TEXTURE2;
                case 3: return Renderer.gl.TEXTURE3;
                case 4: return Renderer.gl.TEXTURE4;
                case 5: return Renderer.gl.TEXTURE5;
                case 6: return Renderer.gl.TEXTURE6;
                case 7: return Renderer.gl.TEXTURE7;
                case 8: return Renderer.gl.TEXTURE8;
                case 9: return Renderer.gl.TEXTURE9;
                case 10: return Renderer.gl.TEXTURE10;
                case 11: return Renderer.gl.TEXTURE11;
                case 12: return Renderer.gl.TEXTURE12;
                case 13: return Renderer.gl.TEXTURE13;
                case 14: return Renderer.gl.TEXTURE14;
                case 15: return Renderer.gl.TEXTURE15;
                case 16: return Renderer.gl.TEXTURE16;
                case 17: return Renderer.gl.TEXTURE17;
                case 18: return Renderer.gl.TEXTURE18;
                case 19: return Renderer.gl.TEXTURE19;
                case 20: return Renderer.gl.TEXTURE20;
                case 21: return Renderer.gl.TEXTURE21;
                case 22: return Renderer.gl.TEXTURE22;
                case 23: return Renderer.gl.TEXTURE23;
                case 24: return Renderer.gl.TEXTURE24;
                case 25: return Renderer.gl.TEXTURE25;
                case 26: return Renderer.gl.TEXTURE26;
                case 27: return Renderer.gl.TEXTURE27;
                case 28: return Renderer.gl.TEXTURE28;
                case 29: return Renderer.gl.TEXTURE29;
                case 30: return Renderer.gl.TEXTURE30;
                case 31: return Renderer.gl.TEXTURE31;
                default: return Renderer.gl.NONE;
            }
        };
        Renderer.createShader = function (source, type) {
            var shader = Renderer.gl.createShader(type);
            if (shader == null || shader == Renderer.gl.NONE) {
                console.log("Error");
            }
            else {
                Renderer.gl.shaderSource(shader, source);
                Renderer.gl.compileShader(shader);
                var shaderCompileStatus = Renderer.gl.getShaderParameter(shader, Renderer.gl.COMPILE_STATUS);
                if (shaderCompileStatus <= 0) {
                    console.log("Error");
                }
                else {
                    return shader;
                }
            }
            return Renderer.gl.NONE;
        };
        //@ts-ignore
        Renderer.renderTexture = function (texture, filter) {
            Renderer.textureSamplerIndices[texture.slot] = texture.slot;
            Renderer.gl.uniform1iv(Renderer.glTextureSamplers, new Int32Array(Renderer.textureSamplerIndices));
            Renderer.gl.activeTexture(Renderer.getGLTextureUnitIndex(texture.slot));
            Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, Renderer.textureSlots[texture.slot]);
            //@ts-ignore
            Renderer.gl.texImage2D(Renderer.gl.TEXTURE_2D, 0, Renderer.gl.RGBA, texture.assetData.xSize, texture.assetData.ySize, 0, Renderer.gl.RGBA, Renderer.gl.UNSIGNED_BYTE, new Uint8Array(texture.assetData.bytes));
            //@ts-ignore
            if (filter && texture.assetData.filterable) {
                Renderer.gl.generateMipmap(Renderer.gl.TEXTURE_2D);
                Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MAG_FILTER, Renderer.gl.LINEAR);
                Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MIN_FILTER, Renderer.gl.LINEAR_MIPMAP_LINEAR);
            }
            else {
                Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MAG_FILTER, Renderer.gl.NEAREST);
                Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MIN_FILTER, Renderer.gl.NEAREST);
                Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_T, Renderer.gl.CLAMP_TO_EDGE);
                Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_S, Renderer.gl.CLAMP_TO_EDGE);
            }
        };
        Renderer.initGL = function () {
            if (Engine.Assets.downloadComplete) {
                for (var indexSlot = 0; indexSlot < Renderer.MAX_TEXTURE_SLOTS; indexSlot += 1) {
                    Renderer.textureSamplerIndices[indexSlot] = 0;
                }
                //TODO: USE Renderer.gl.MAX_TEXTURE_IMAGE_UNITS
                Renderer.vertexShader = Renderer.createShader(Engine.Assets.loadText(Renderer.PATH_SHADER_VERTEX), Renderer.gl.VERTEX_SHADER);
                var fragmentSource = "#define MAX_TEXTURE_SLOTS " + Renderer.MAX_TEXTURE_SLOTS + "\n" + "precision mediump float;\n" + Engine.Assets.loadText(Renderer.PATH_SHADER_FRAGMENT);
                Renderer.fragmentShader = Renderer.createShader(fragmentSource, Renderer.gl.FRAGMENT_SHADER);
                Renderer.shaderProgram = Renderer.gl.createProgram();
                if (Renderer.shaderProgram == null || Renderer.shaderProgram == 0) {
                    console.log("Error");
                }
                else {
                    Renderer.gl.attachShader(Renderer.shaderProgram, Renderer.vertexShader);
                    Renderer.gl.attachShader(Renderer.shaderProgram, Renderer.fragmentShader);
                    Renderer.gl.linkProgram(Renderer.shaderProgram);
                    Renderer.glTextureSamplers = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "textures");
                    Renderer.glSizeView = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "view_size");
                    Renderer.glScaleView = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "view_scale");
                    Renderer.glCameraPosition = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "camera_position");
                    //Renderer.glTopLeftCamera = Renderer.gl.getUniformLocation(Renderer.shaderProgram, "top_left_camera");
                    //glPixelPerfect = Renderer.gl.getUniformLocation(shaderProgram, "pixel_perfect");
                    Renderer.glVertexPinned = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_pinned");
                    Renderer.glVertexAnchor = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_anchor");
                    Renderer.glVertexPosition = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_position");
                    Renderer.glVertexScale = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_scale");
                    Renderer.glVertexMirror = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_mirror");
                    Renderer.glVertexAngle = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_angle");
                    Renderer.glVertexUV = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_uv");
                    Renderer.glVertexTexture = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_texture");
                    Renderer.glVertexColor = Renderer.gl.getAttribLocation(Renderer.shaderProgram, "vertex_color");
                    Renderer.gl.useProgram(Renderer.shaderProgram);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexPinned);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexAnchor);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexPosition);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexScale);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexMirror);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexAngle);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexUV);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexTexture);
                    Renderer.gl.enableVertexAttribArray(Renderer.glVertexColor);
                    Renderer.gl.uniform1iv(Renderer.glTextureSamplers, new Int32Array(Renderer.textureSamplerIndices));
                    Renderer.gl.viewport(0, 0, Renderer.canvas.width, Renderer.canvas.height);
                    Renderer.gl.uniform2f(Renderer.glSizeView, Renderer.xSizeView, Renderer.ySizeView);
                    Renderer.gl.uniform2f(Renderer.glScaleView, Renderer.xScaleView, Renderer.yScaleView);
                    //TODO: Android
                    //Renderer.gl.uniform2f(rly_cursor_location, rly_cursorX, rly_cursorY);
                    //Renderer.gl.uniform1iv(rly_top_left_cursor_location, rly_top_left_cursor);
                    //Renderer.gl.uniform1iv(rly_pixel_perfect_location, rly_pixel_perfect);
                    Renderer.vertexBuffer = Renderer.gl.createBuffer();
                    Renderer.faceBuffer = Renderer.gl.createBuffer();
                    Renderer.gl.enable(Renderer.gl.BLEND);
                    Renderer.gl.blendFuncSeparate(Renderer.gl.SRC_ALPHA, Renderer.gl.ONE_MINUS_SRC_ALPHA, Renderer.gl.ZERO, Renderer.gl.ONE);
                    //glBlendFunc(Renderer.gl.ONE, Renderer.gl.ONE_MINUS_SRC_ALPHA);
                    Renderer.gl.clearColor(Renderer.clearRed, Renderer.clearGreen, Renderer.clearBlue, 1);
                    //Renderer.gl.clear(Renderer.gl.COLOR_BUFFER_BIT);
                    for (var indexSlot = 0; indexSlot < Renderer.MAX_TEXTURE_SLOTS; indexSlot += 1) {
                        Renderer.textureSlots[indexSlot] = Renderer.gl.createTexture();
                        Renderer.gl.activeTexture(Renderer.getGLTextureUnitIndex(indexSlot));
                        Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, Renderer.textureSlots[indexSlot]);
                        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MAG_FILTER, Renderer.gl.NEAREST);
                        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_MIN_FILTER, Renderer.gl.NEAREST);
                        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_T, Renderer.gl.CLAMP_TO_EDGE);
                        Renderer.gl.texParameteri(Renderer.gl.TEXTURE_2D, Renderer.gl.TEXTURE_WRAP_S, Renderer.gl.CLAMP_TO_EDGE);
                    }
                    Renderer.gl.activeTexture(Renderer.getGLTextureUnitIndex(0));
                    Renderer.gl.bindTexture(Renderer.gl.TEXTURE_2D, Renderer.textureSlots[0]);
                    Renderer.gl.texImage2D(Renderer.gl.TEXTURE_2D, 0, Renderer.gl.RGBA, 2, 2, 0, Renderer.gl.RGBA, Renderer.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]));
                }
                Renderer.gl.clearColor(0, 0, 0, 1);
                //@ts-ignore
                Renderer.inited = true;
            }
            else {
                setTimeout(Renderer.initGL, 1.0 / 60.0);
            }
        };
        //GL
        Renderer.MAX_TEXTURE_SLOTS = 8;
        Renderer.SPRITE_RENDERER_VERTICES = 4;
        //private static readonly  SPRITE_RENDERER_VERTEX_ATTRIBUTES = 17;
        //private static readonly  SPRITE_RENDERER_FACE_INDICES = 6;
        Renderer.PATH_SHADER_VERTEX = "System/Vertex.glsl";
        Renderer.PATH_SHADER_FRAGMENT = "System/Fragment.glsl";
        Renderer.inited = false;
        Renderer.preferredMode = RendererMode.WEB_GL;
        Renderer.glSupported = false;
        Renderer.useHandPointer = false;
        //private static topLeftCamera = false;
        Renderer.xCamera = 0;
        Renderer.yCamera = 0;
        Renderer.xSizeViewIdeal = 320 * 1;
        Renderer.ySizeViewIdeal = 240 * 1;
        Renderer.clearRed = 0;
        Renderer.clearGreen = 0;
        Renderer.clearBlue = 0;
        Renderer.xFitView = false;
        Renderer.xScaleView = 1;
        Renderer.yScaleView = 1;
        Renderer.drawCalls = 0;
        Renderer.autoscale = true;
        Renderer.maxElementsDrawCall = 8192;
        Renderer.textureSlots = new Array();
        Renderer.drawableCount = 0;
        Renderer.vertexArray = new Array();
        Renderer.faceArray = new Array();
        Renderer.textureSamplerIndices = new Array();
        Renderer.useDPI = true;
        Renderer.dpr = window.devicePixelRatio || 1;
        Renderer.a = false;
        return Renderer;
    }());
    Engine.Renderer = Renderer;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Scene = /** @class */ (function () {
        function Scene() {
            //@ts-ignore
            if (!Engine.System.canCreateScene || Engine.System.creatingScene) {
                console.log("error");
            }
            //@ts-ignore
            Engine.System.creatingScene = true;
        }
        Object.defineProperty(Scene.prototype, "preserved", {
            get: function () {
                return false;
            },
            //@ts-ignore
            set: function (value) {
                console.log("ERROR");
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "owner", {
            get: function () {
                return null;
            },
            //@ts-ignore
            set: function (value) {
                console.log("ERROR");
            },
            enumerable: false,
            configurable: true
        });
        return Scene;
    }());
    Engine.Scene = Scene;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var EventType;
    (function (EventType) {
        EventType[EventType["CUSTOM"] = 0] = "CUSTOM";
        EventType[EventType["CREATE_SCENE"] = 1] = "CREATE_SCENE";
        EventType[EventType["INIT_SCENE"] = 2] = "INIT_SCENE";
        EventType[EventType["RESET_SCENE"] = 3] = "RESET_SCENE";
        EventType[EventType["VIEW_UPDATE"] = 4] = "VIEW_UPDATE";
        EventType[EventType["STEP_UPDATE"] = 5] = "STEP_UPDATE";
        EventType[EventType["TIME_UPDATE"] = 6] = "TIME_UPDATE";
        EventType[EventType["CLEAR_SCENE"] = 7] = "CLEAR_SCENE";
        EventType[EventType["DESTROY"] = 8] = "DESTROY";
        EventType[EventType["SURVIVE"] = 9] = "SURVIVE";
    })(EventType = Engine.EventType || (Engine.EventType = {}));
    var EventListenerGroup = /** @class */ (function () {
        function EventListenerGroup(name) {
            this.name = "";
            this.receptors = new Array();
            this.name = name;
        }
        return EventListenerGroup;
    }());
    var EventReceptor = /** @class */ (function () {
        function EventReceptor(chainable, action) {
            this.chainable = chainable;
            this.action = action;
        }
        return EventReceptor;
    }());
    var System = /** @class */ (function () {
        function System() {
        }
        System.triggerEvents = function (type) {
            for (var _i = 0, _a = System.listenerGroups[type]; _i < _a.length; _i++) {
                var listener = _a[_i];
                for (var _b = 0, _c = listener.receptors; _b < _c.length; _b++) {
                    var receptor = _c[_b];
                    receptor.action(receptor.chainable);
                }
            }
        };
        System.triggerCustomEvent = function (name) {
            for (var _i = 0, _a = System.listenerGroups[EventType.CUSTOM]; _i < _a.length; _i++) {
                var listener = _a[_i];
                if (listener.name == name) {
                    for (var _b = 0, _c = listener.receptors; _b < _c.length; _b++) {
                        var receptor = _c[_b];
                        receptor.action(receptor.chainable);
                    }
                    return;
                }
            }
            console.log("error");
        };
        System.getDestroyReceptors = function () {
            var callReceptors = [];
            for (var _i = 0, _a = System.listenerGroups[EventType.DESTROY]; _i < _a.length; _i++) {
                var listener = _a[_i];
                for (var _b = 0, _c = listener.receptors; _b < _c.length; _b++) {
                    var receptor = _c[_b];
                    var owner = receptor.chainable;
                    while (owner.owner != null) {
                        owner = owner.owner;
                    }
                    if (owner.preserved == null || !owner.preserved) {
                        callReceptors.push(receptor);
                    }
                }
            }
            return callReceptors;
        };
        System.onViewChanged = function () {
            System.triggerEvents(EventType.VIEW_UPDATE);
        };
        System.onStepUpdate = function () {
            if (System.nextSceneClass != null) {
                System.needReset = true;
                if (System.currentScene != null) {
                    System.triggerEvents(EventType.CLEAR_SCENE);
                    var destroyReceptors = System.getDestroyReceptors();
                    for (var _i = 0, _a = System.listenerGroups; _i < _a.length; _i++) {
                        var listenerGroup = _a[_i];
                        for (var _b = 0, listenerGroup_1 = listenerGroup; _b < listenerGroup_1.length; _b++) {
                            var listener = listenerGroup_1[_b];
                            var newReceptors = [];
                            for (var _c = 0, _d = listener.receptors; _c < _d.length; _c++) {
                                var receptor = _d[_c];
                                var owner = receptor.chainable;
                                while (owner.owner != null) {
                                    owner = owner.owner;
                                }
                                if (owner.preserved != null && owner.preserved) {
                                    newReceptors.push(receptor);
                                }
                            }
                            listener.receptors = newReceptors;
                        }
                    }
                    for (var _e = 0, destroyReceptors_1 = destroyReceptors; _e < destroyReceptors_1.length; _e++) {
                        var receptor = destroyReceptors_1[_e];
                        receptor.action(receptor.chainable);
                    }
                    //@ts-ignore
                    Engine.Texture.recycleAll();
                    //@ts-ignore
                    Engine.AudioPlayer.recycleAll();
                    System.triggerEvents(EventType.SURVIVE);
                }
                System.currentSceneClass = System.nextSceneClass;
                System.nextSceneClass = null;
                //@ts-ignore
                System.canCreateScene = true;
                //@ts-ignore
                System.currentScene = new System.currentSceneClass();
                System.triggerEvents(EventType.CREATE_SCENE);
                System.addListenersFrom(System.currentScene);
                //@ts-ignore
                System.canCreateScene = false;
                System.creatingScene = false;
                System.triggerEvents(EventType.INIT_SCENE);
            }
            if (System.needReset) {
                System.needReset = false;
                System.triggerEvents(EventType.RESET_SCENE);
            }
            System.triggerEvents(EventType.STEP_UPDATE);
        };
        System.onTimeUpdate = function () {
            //@ts-ignore
            Engine.AudioManager.checkSuspended();
            System.triggerEvents(EventType.TIME_UPDATE);
        };
        System.requireReset = function () {
            System.needReset = true;
        };
        System.update = function () {
            //if(System.hasFocus && !document.hasFocus()){
            //    System.hasFocus = false;
            //    Engine.pause();
            //}
            //else if(!System.hasFocus && document.hasFocus()){
            //    System.hasFocus = true;
            //    Engine.resume();
            //}
            if (System.pauseCount == 0) {
                //@ts-ignore
                Engine.Renderer.clear();
                while (System.stepTimeCount >= System.STEP_DELTA_TIME) {
                    //@ts-ignore
                    System.stepExtrapolation = 1;
                    if (System.inputInStepUpdate) {
                        //(NewKit as any).updateTouchscreen();
                        //@ts-ignore
                        Engine.Keyboard.update();
                        //@ts-ignore
                        Engine.Mouse.update();
                        //@ts-ignore
                        Engine.TouchInput.update();
                    }
                    System.onStepUpdate();
                    //@ts-ignore
                    Engine.Renderer.updateHandCursor();
                    System.stepTimeCount -= System.STEP_DELTA_TIME;
                }
                //@ts-ignore
                System.stepExtrapolation = System.stepTimeCount / System.STEP_DELTA_TIME;
                if (Engine.Renderer.xSizeWindow != window.innerWidth || Engine.Renderer.ySizeWindow != window.innerHeight) {
                    //@ts-ignore
                    Engine.Renderer.fixCanvasSize();
                    System.triggerEvents(EventType.VIEW_UPDATE);
                }
                if (!System.inputInStepUpdate) {
                    //(NewKit as any).updateTouchscreen();
                    //@ts-ignore
                    Engine.Keyboard.update();
                    //@ts-ignore
                    Engine.Mouse.update();
                    //@ts-ignore
                    Engine.TouchInput.update();
                }
                System.onTimeUpdate();
                //@ts-ignore
                Engine.Renderer.update();
                //@ts-ignore
                var nowTime = Date.now() / 1000.0;
                //@ts-ignore
                System.deltaTime = nowTime - System.oldTime;
                if (System.deltaTime > System.MAX_DELTA_TIME) {
                    //@ts-ignore
                    System.deltaTime = System.MAX_DELTA_TIME;
                }
                else if (System.deltaTime < 0) {
                    //@ts-ignore
                    System.deltaTime = 0;
                }
                System.stepTimeCount += System.deltaTime;
                System.oldTime = nowTime;
            }
            window.requestAnimationFrame(System.update);
        };
        System.pause = function () {
            //@ts-ignore
            System.pauseCount += 1;
            if (System.pauseCount == 1) {
                //@ts-ignore
                Engine.AudioManager.pause();
            }
        };
        ;
        System.resume = function () {
            if (System.pauseCount > 0) {
                //@ts-ignore
                System.pauseCount = 0;
                if (System.pauseCount == 0) {
                    //@ts-ignore
                    Engine.AudioManager.resume();
                    System.oldTime = Date.now() - System.STEP_DELTA_TIME;
                }
            }
            else {
                console.log("error");
            }
        };
        ;
        System.start = function () {
            if (Engine.Renderer.inited && Engine.AudioManager.inited) {
                System.canCreateEvents = true;
                System.onInit();
                System.canCreateEvents = false;
                //@ts-ignore
                System.started = true;
                window.requestAnimationFrame(System.update);
            }
            else {
                setTimeout(System.start, 1.0 / 60.0);
            }
        };
        System.run = function () {
            System.onRun();
            if (System.inited) {
                console.log("ERROR");
            }
            else {
                System.inited = true;
                //@ts-ignore
                Engine.Renderer.init();
                //@ts-ignore
                Engine.AudioManager.init();
                setTimeout(System.start, 1.0 / 60.0);
            }
        };
        System.STEP_DELTA_TIME = 1.0 / 60.0;
        System.MAX_DELTA_TIME = System.STEP_DELTA_TIME * 4;
        System.PI_OVER_180 = Math.PI / 180;
        System.inited = false;
        System.started = false;
        System.stepTimeCount = 0;
        System.stepExtrapolation = 0;
        System.oldTime = 0;
        System.deltaTime = 0;
        System.pauseCount = 0;
        System.listenerGroups = [[], [], [], [], [], [], [], [], [], []];
        System.canCreateEvents = false;
        System.canCreateScene = false;
        System.creatingScene = false;
        System.needReset = false;
        /*
        Engine.useHandPointer = false;
        Engine.onclick = null;
        */
        System.inputInStepUpdate = true;
        System.createEvent = function (type, name) {
            if (System.canCreateEvents) {
                System.listenerGroups[type].push(new EventListenerGroup(name));
            }
            else {
                console.log("error");
            }
        };
        System.addListenersFrom = function (chainable) {
            if (!System.creatingScene) {
                console.log("error");
            }
            for (var _i = 0, _a = System.listenerGroups; _i < _a.length; _i++) {
                var listenerGroup = _a[_i];
                for (var _b = 0, listenerGroup_2 = listenerGroup; _b < listenerGroup_2.length; _b++) {
                    var listener = listenerGroup_2[_b];
                    if (chainable.constructor != null) {
                        for (var prop in chainable.constructor) {
                            if (prop == listener.name) {
                                listener.receptors.push(new EventReceptor(chainable, chainable.constructor[prop]));
                            }
                        }
                    }
                    for (var prop in chainable) {
                        if (prop == listener.name) {
                            listener.receptors.push(new EventReceptor(chainable, chainable[prop].bind(chainable)));
                        }
                    }
                }
            }
        };
        System.onRun = function () {
        };
        return System;
    }());
    Engine.System = System;
    if (!window.requestAnimationFrame) {
        //@ts-ignore
        window.requestAnimationFrame = function () {
            window.requestAnimationFrame =
                window['requestAnimationFrame'] ||
                    //@ts-ignore
                    window['mozRequestAnimationFrame'] ||
                    //@ts-ignore
                    window['webkitRequestAnimationFrame'] ||
                    //@ts-ignore
                    window['msRequestAnimationFrame'] ||
                    //@ts-ignore
                    window['oRequestAnimationFrame'] ||
                    //@ts-ignore
                    function (callback, element) {
                        element = element;
                        window.setTimeout(callback, 1000 / 60);
                    };
        };
    }
    window.onclick = function (event) {
        //@ts-ignore
        Engine.AudioManager.verify();
        Engine.LinkManager.triggerMouse(event);
    };
    window.ontouchstart = function (event) {
        //window.onclick = function(_event : MouseEvent){}
        //@ts-ignore
        Engine.AudioManager.verify();
        Engine.LinkManager.triggerTouch(event);
    };
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var Texture = /** @class */ (function () {
        function Texture(path, hasClearColor, filter) {
            this._path = "";
            this.slot = 0;
            this.preserved = false;
            //@ts-ignore
            if (!Engine.System.creatingScene) {
                console.error("error");
            }
            this._path = path;
            //@ts-ignore
            this.slot = Texture.textures.length;
            this.assetData = Engine.Assets.loadImage(path);
            this.filter = filter;
            if (hasClearColor) {
                this.applyClearColor();
            }
            if (Engine.Renderer.mode == Engine.RendererMode.CANVAS_2D) {
                this.canvas = document.createElement("canvas");
                this.canvas.width = this.assetData.xSize;
                this.canvas.height = this.assetData.ySize;
                this.context = this.canvas.getContext("2d");
                this.context.putImageData(this.assetData.imageData, 0, 0);
            }
            else {
                //@ts-ignore
                Engine.Renderer.renderTexture(this, this.filter);
            }
            Texture.textures.push(this);
        }
        Object.defineProperty(Texture.prototype, "path", {
            get: function () {
                return this._path;
            },
            enumerable: false,
            configurable: true
        });
        //@ts-ignore
        Texture.recycleAll = function () {
            var newTextures = new Array();
            for (var _i = 0, _a = Texture.textures; _i < _a.length; _i++) {
                var texture = _a[_i];
                var owner = texture;
                while (owner.owner != null) {
                    owner = owner.owner;
                }
                if (owner.preserved) {
                    var oldSlot = texture.slot;
                    //@ts-ignore
                    texture.slot = newTextures.length;
                    if (Engine.Renderer.mode == Engine.RendererMode.WEB_GL && oldSlot != texture.slot) {
                        //@ts-ignore
                        Engine.Renderer.renderTexture(texture);
                    }
                    newTextures.push(texture);
                }
            }
            Texture.textures = newTextures;
        };
        Texture.prototype.getRed = function (x, y) {
            return this.assetData.bytes[(y * this.assetData.xSize + x) * 4];
        };
        Texture.prototype.getGreen = function (x, y) {
            return this.assetData.bytes[(y * this.assetData.xSize + x) * 4 + 1];
        };
        Texture.prototype.getBlue = function (x, y) {
            return this.assetData.bytes[(y * this.assetData.xSize + x) * 4 + 2];
        };
        Texture.prototype.getAlpha = function (x, y) {
            return this.assetData.bytes[(y * this.assetData.xSize + x) * 4 + 3];
        };
        Texture.prototype.setRGBA = function (x, y, r, g, b, a) {
            this.assetData.bytes[(y * this.assetData.xSize + x) * 4 + 0] = r;
            this.assetData.bytes[(y * this.assetData.xSize + x) * 4 + 1] = g;
            this.assetData.bytes[(y * this.assetData.xSize + x) * 4 + 2] = b;
            this.assetData.bytes[(y * this.assetData.xSize + x) * 4 + 3] = a;
        };
        Texture.prototype.applyClearColor = function () {
            var color = {};
            color.r = this.getRed(0, 0);
            color.g = this.getGreen(0, 0);
            color.b = this.getBlue(0, 0);
            color.a = this.getAlpha(0, 0);
            for (var yIndex = 0; yIndex < this.assetData.ySize; yIndex += 1) {
                for (var xIndex = 0; xIndex < this.assetData.xSize; xIndex += 1) {
                    if (color.r == this.getRed(xIndex, yIndex) && color.g == this.getGreen(xIndex, yIndex) && color.b == this.getBlue(xIndex, yIndex) && color.a == this.getAlpha(xIndex, yIndex)) {
                        this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 0] = 0;
                        this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 1] = 0;
                        this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 2] = 0;
                        this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 3] = 0;
                    }
                }
            }
        };
        Texture.prototype.clear = function () {
            for (var yIndex = 0; yIndex < this.assetData.ySize; yIndex += 1) {
                for (var xIndex = 0; xIndex < this.assetData.xSize; xIndex += 1) {
                    this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 0] = 0;
                    this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 1] = 0;
                    this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 2] = 0;
                    this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 3] = 0;
                }
            }
        };
        Texture.prototype.copy = function (other) {
            for (var yIndex = 0; yIndex < this.assetData.ySize; yIndex += 1) {
                for (var xIndex = 0; xIndex < this.assetData.xSize; xIndex += 1) {
                    this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 0] = other.assetData.bytes[(yIndex * other.assetData.xSize + xIndex) * 4 + 0];
                    this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 1] = other.assetData.bytes[(yIndex * other.assetData.xSize + xIndex) * 4 + 1];
                    this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 2] = other.assetData.bytes[(yIndex * other.assetData.xSize + xIndex) * 4 + 2];
                    this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 3] = other.assetData.bytes[(yIndex * other.assetData.xSize + xIndex) * 4 + 3];
                }
            }
        };
        Texture.prototype.clearColor = function (x, y) {
            var r = this.getRed(x, y);
            var g = this.getRed(x, y);
            var b = this.getRed(x, y);
            var a = this.getRed(x, y);
            for (var yIndex = 0; yIndex < this.assetData.ySize; yIndex += 1) {
                for (var xIndex = 0; xIndex < this.assetData.xSize; xIndex += 1) {
                    if (r == this.getRed(xIndex, yIndex) && g == this.getGreen(xIndex, yIndex) && b == this.getBlue(xIndex, yIndex) && a == this.getAlpha(xIndex, yIndex)) {
                        this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 0] = 0;
                        this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 1] = 0;
                        this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 2] = 0;
                        this.assetData.bytes[(yIndex * this.assetData.xSize + xIndex) * 4 + 3] = 0;
                    }
                }
            }
        };
        Texture.prototype.renderAgain = function () {
            //console.error("OPTIMIZE THIS");
            //@ts-ignore
            Engine.Renderer.renderTexture(this, this.filter);
        };
        Texture.textures = new Array();
        return Texture;
    }());
    Engine.Texture = Texture;
})(Engine || (Engine = {}));
var Engine;
(function (Engine) {
    var TouchState;
    (function (TouchState) {
        TouchState[TouchState["New"] = 0] = "New";
        TouchState[TouchState["Pressed"] = 1] = "Pressed";
        TouchState[TouchState["Down"] = 2] = "Down";
        TouchState[TouchState["Canceled"] = 3] = "Canceled";
        TouchState[TouchState["Released"] = 4] = "Released";
    })(TouchState || (TouchState = {}));
    var TouchData = /** @class */ (function () {
        function TouchData(touch, state) {
            this.start = touch;
            this.previous = touch;
            this.current = touch;
            this.next = null;
            this.state = state;
        }
        return TouchData;
    }());
    var touchDataArray = new Array();
    var touchStart = function (event) {
        event.preventDefault();
        for (var indexEventTouch = 0; indexEventTouch < event.changedTouches.length; indexEventTouch += 1) {
            var touch = event.changedTouches.item(indexEventTouch);
            var add = true;
            for (var indexTouchData = 0; indexTouchData < touchDataArray.length; indexTouchData += 1) {
                var touchData = touchDataArray[indexTouchData];
                if (touchData == null) {
                    touchDataArray[indexTouchData] = new TouchData(touch, TouchState.New);
                    add = false;
                    break;
                }
                if (touch.identifier == touchData.current.identifier) {
                    if (touchData.state == TouchState.Canceled || touchData.state == TouchState.Released) {
                        touchDataArray[indexTouchData] = new TouchData(touch, TouchState.New);
                    }
                    else {
                        touchDataArray[indexTouchData].next = touch;
                    }
                    add = false;
                    break;
                }
            }
            if (add) {
                touchDataArray.push(new TouchData(touch, TouchState.New));
            }
        }
    };
    var touchMove = function (event) {
        event.preventDefault();
        for (var indexEventTouch = 0; indexEventTouch < event.changedTouches.length; indexEventTouch += 1) {
            var touch = event.changedTouches.item(indexEventTouch);
            for (var indexTouchData = 0; indexTouchData < touchDataArray.length; indexTouchData += 1) {
                var touchData = touchDataArray[indexTouchData];
                if (touchData != null && touchData.start.identifier == touch.identifier) {
                    touchData.next = touch;
                    break;
                }
            }
        }
    };
    var touchCancel = function (event) {
        event.preventDefault();
        for (var indexEventTouch = 0; indexEventTouch < event.changedTouches.length; indexEventTouch += 1) {
            var touch = event.changedTouches.item(indexEventTouch);
            for (var indexTouchData = 0; indexTouchData < touchDataArray.length; indexTouchData += 1) {
                var touchData = touchDataArray[indexTouchData];
                if (touchData != null && touchData.start.identifier == touch.identifier) {
                    touchData.next = touch;
                    if (touchData.state == TouchState.New || touchData.state == TouchState.Pressed || touchData.state == TouchState.Down) {
                        touchData.state = TouchState.Canceled;
                    }
                    break;
                }
            }
        }
    };
    var touchEnd = function (event) {
        touchCancel(event);
    };
    window.addEventListener("touchstart", touchStart, { passive: false });
    window.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("touchcancel", touchCancel, { passive: false });
    window.addEventListener("touchend", touchEnd, { passive: false });
    window.document.addEventListener("touchstart", function (e) {
        e.preventDefault();
    }, { passive: false });
    window.document.addEventListener("touchmove", function (e) {
        e.preventDefault();
    }, { passive: false });
    window.document.addEventListener("touchcancel", function (e) {
        e.preventDefault();
    }, { passive: false });
    window.document.addEventListener("touchend", function (e) {
        e.preventDefault();
    }, { passive: false });
    window.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    }, { passive: false });
    window.addEventListener('gesturechange', function (e) {
        e.preventDefault();
    }, { passive: false });
    window.addEventListener('gestureend', function (e) {
        e.preventDefault();
    }, { passive: false });
    window.document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    }, { passive: false });
    window.document.addEventListener('gesturechange', function (e) {
        e.preventDefault();
    }, { passive: false });
    window.document.addEventListener('gestureend', function (e) {
        e.preventDefault();
    }, { passive: false });
    var TouchInput = /** @class */ (function () {
        function TouchInput() {
        }
        TouchInput.findDown = function (x0, y0, x1, y1, useRadius, findPressed) {
            for (var _i = 0, touchDataArray_1 = touchDataArray; _i < touchDataArray_1.length; _i++) {
                var touchData = touchDataArray_1[_i];
                if (touchData != null) {
                    var touch = touchData.current;
                    if (touchData.state == TouchState.Pressed || (!findPressed && touchData.state == TouchState.Down)) {
                        var radius = touch.radiusX < touch.radiusY ? touch.radiusX : touch.radiusY;
                        if (radius == null || radius == undefined) {
                            radius = 1;
                        }
                        if (!useRadius) {
                            radius = 1;
                        }
                        radius = radius == 0 ? 1 : radius;
                        var x = touch.clientX / radius;
                        var y = touch.clientY / radius;
                        var rx0 = x0 / radius;
                        var ry0 = y0 / radius;
                        var rx1 = x1 / radius;
                        var ry1 = y1 / radius;
                        if (x >= rx0 && x <= rx1 && y >= ry0 && y <= ry1) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        TouchInput.down = function (x0, y0, x1, y1, useRadius) {
            return TouchInput.findDown(x0, y0, x1, y1, useRadius, false);
        };
        TouchInput.pressed = function (x0, y0, x1, y1, useRadius) {
            return TouchInput.findDown(x0, y0, x1, y1, useRadius, true);
        };
        //@ts-ignore
        TouchInput.update = function () {
            for (var indexTouchData = 0; indexTouchData < touchDataArray.length; indexTouchData += 1) {
                var touchData = touchDataArray[indexTouchData];
                if (touchData != null) {
                    if (touchData.next != null) {
                        touchData.previous = touchData.current;
                        touchData.current = touchData.next;
                        touchData.next = null;
                    }
                    //window.parent.document.getElementById("myHeader").textContent = touchData.current.identifier + " " + touchData.current.force + " " + touchData.current.radiusX;
                    switch (touchData.state) {
                        case TouchState.New:
                            touchData.state = TouchState.Pressed;
                            break;
                        case TouchState.Pressed:
                            touchData.state = TouchState.Down;
                            break;
                        case TouchState.Canceled:
                            touchData.state = TouchState.Released;
                            break;
                        case TouchState.Released:
                            touchDataArray[indexTouchData] = null;
                            break;
                    }
                }
            }
        };
        return TouchInput;
    }());
    Engine.TouchInput = TouchInput;
})(Engine || (Engine = {}));
///<reference path="../Engine/System.ts"/>
///<reference path="../Engine/AudioManager.ts"/>
///<reference path="../Engine/Renderer.ts"/>
var Game;
(function (Game) {
    //Engine.Renderer.preferredMode = Engine.RendererMode.CANVAS_2D;
    //Engine.AudioManager.preferredMode = Engine.AudioManagerMode.HTML;
    Engine.System.onInit = function () {
        if (Engine.Data.useLocalStorage) {
            Engine.Data.setID("com", "kez", "emeraldandamber");
        }
        else {
            Engine.Data.setID("c", "k", "e_a");
        }
        Game.SceneColors.clearColor(255, 255, 255);
        Engine.System.createEvent(Engine.EventType.CREATE_SCENE, "onCreateScene");
        Engine.System.createEvent(Engine.EventType.INIT_SCENE, "onInitScene");
        Engine.System.createEvent(Engine.EventType.RESET_SCENE, "onReset");
        Engine.System.createEvent(Engine.EventType.RESET_SCENE, "onStart");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateAnchor");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateText");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdate");
        Engine.System.createEvent(Engine.EventType.CUSTOM, "onSwitchPressed");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onControlPreUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onControlUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMoveReady");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMoveConfigUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMoveUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onOverlapUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onAnimationUpdate");
        ;
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepLateUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdateFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onTimeUpdate");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onTimeUpdateSceneBeforeDrawFixed");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawBackground");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSceneMap");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSceneFill");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawTextSuperBack");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsBack");
        //Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticles");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjects");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPlayer");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsFront");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawGoal");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticles");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesFront");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPause");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawDialogs");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawButtons");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawText");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsAfterUI");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawOrientationUI");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawAdFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawTextFront");
        Engine.System.createEvent(Engine.EventType.CLEAR_SCENE, "onClearScene");
        for (var i = 1; i <= Game.MAX_LEVELS; i += 1) {
            Game.dataLevels[i] = Engine.Data.load("level" + i) || "locked";
        }
        if (Game.dataLevels[1] == "locked") {
            Game.dataLevels[1] = "unlocked";
        }
        Game.levelSpeedrun = +(Engine.Data.load("speedrunlevel"));
        Game.levelSpeedrun = isNaN(Game.levelSpeedrun) ? 1 : Game.levelSpeedrun;
        Game.levelSpeedrun = Game.levelSpeedrun == 0 ? 1 : Game.levelSpeedrun;
        Game.dataSpeedrun = +(Engine.Data.load("speedrundata"));
        Game.dataSpeedrun = isNaN(Game.dataSpeedrun) ? 0 : Game.dataSpeedrun;
        Game.recordSpeedrun = +(Engine.Data.load("speedrunrecord2.0"));
        Game.recordSpeedrun = isNaN(Game.recordSpeedrun) ? 0 : Game.recordSpeedrun;
        Game.triggerActions("loadgame");
        Engine.Box.debugRender = false;
        //SKIP_PRELOADER = true;
        //FORCE_TOUCH=true;
        //Utils.Fade.scale = 5000;
        Game.startingSceneClass = Game.MainMenu;
    };
})(Game || (Game = {}));
var Game;
(function (Game) {
    Game.HAS_PRELOADER = true;
    Game.HAS_LINKS = true;
    Game.HAS_LINKS_KEZARTS = true;
    Game.HAS_GOOGLE_PLAY_LOGOS = false;
    Game.IS_EDGE = /Edge/.test(navigator.userAgent);
    Game.FORCE_EDGE_TUTORIAL = false;
    Game.STEPS_CHANGE_SCENE = 10;
    Game.STEPS_CHANGE_SCENE_AD = 30;
    Game.X_BUTTONS_LEFT = 8;
    Game.X_BUTTONS_RIGHT = -8;
    Game.Y_BUTTONS_TOP = 2;
    Game.Y_BUTTONS_BOTTOM = -2;
    Game.Y_ARROWS_GAME_BUTTONS = 6;
    Game.X_SEPARATION_BUTTONS_LEFT = 9;
    Game.MUSIC_MUTED = false;
    Game.SOUND_MUTED = false;
    Game.IS_TOUCH = false;
    Game.SKIP_PRELOADER = false;
    Game.FORCE_TOUCH = false;
    Game.DIRECT_PRELOADER = false;
    Game.TRACK_ORIENTATION = false;
    Game.URL_MORE_GAMES = "https://kezarts.com/games";
    Game.URL_KEZARTS = "https://kezarts.com/games";
    Game.TEXT_MORE_GAMES = "+GAMES";
    Game.IS_APP = false;
    Game.OPTIMIZE_TRANSPARENCY = false;
    Game.fixViewHandler = function () { };
    Game.HAS_STARTED = false;
    Game.STRONG_TOUCH_MUTE_CHECK = false;
    function muteAll() {
        if (Game.Resources.bgm != null) {
            Game.Resources.bgm.volume = 0;
        }
        for (var _i = 0, sfxs_1 = Game.sfxs; _i < sfxs_1.length; _i++) {
            var player = sfxs_1[_i];
            player.volume = 0;
        }
    }
    Game.muteAll = muteAll;
    Game.unmute = function () {
        if (Game.Resources.bgmVolumeTracker < 1) {
            Game.Resources.bgmVolumeTracker = 1;
            if (Game.Resources.bgm != null) {
                Game.Resources.bgm.volume = Game.Resources.bgmVolumeTracker == 1 ? Game.Resources.bgm.restoreVolume : 0;
            }
            if (Game.Resources.bgmVolumeTracker == 1) {
                for (var _i = 0, sfxs_2 = Game.sfxs; _i < sfxs_2.length; _i++) {
                    var player = sfxs_2[_i];
                    player.volume = player.restoreVolume;
                }
            }
        }
        return Game.Resources.bgmVolumeTracker == 1;
    };
    Game.mute = function () {
        Game.Resources.bgmVolumeTracker -= 1;
        muteAll();
        return Game.Resources.bgmVolumeTracker < 1;
    };
    Engine.System.onRun = function () {
        if (!Game.IS_APP) {
            /*
            if(document.onvisibilitychange == undefined){
                
            }
            else{
                document.onvisibilitychange = function(){
                    if(document.visibilityState == "visible"){
                        onShow();
                        Engine.System.resume();
                    }
                    else if(document.visibilityState == "hidden"){
                        onHide();
                        Engine.System.pause();
                    }
                }
            }
            */
            window.onfocus = function () {
                Game.fixViewHandler();
                //unmute();
                //Engine.System.resume();
            };
            window.onblur = function () {
                Game.fixViewHandler();
                //mute();
                //Engine.System.pause();
            };
            document.addEventListener("visibilitychange", function () {
                Game.fixViewHandler();
                if (document.visibilityState == "visible") {
                    if (Game.STRONG_TOUCH_MUTE_CHECK) {
                        if (Game.HAS_STARTED && !Game.IS_TOUCH) {
                            Game.unmute();
                        }
                    }
                    else {
                        Game.unmute();
                    }
                    Engine.System.resume();
                }
                else if (document.visibilityState == "hidden") {
                    if (Game.STRONG_TOUCH_MUTE_CHECK) {
                        if (Game.HAS_STARTED && !Game.IS_TOUCH) {
                            Game.mute();
                        }
                    }
                    else {
                        Game.mute();
                    }
                    Engine.System.pause();
                }
            });
        }
    };
    var pathGroups = new Array();
    var actionGroups = new Array();
    Game.dataLevels = new Array();
    //console.log("Fix Canvas Mode Shake, IN ALL IS A BIG PROBLEM ON THE RENDERER ROOT; EVERITHING WORKS BAD, NOT ONLY THE SHAKE");
    //console.log("TEST CANVAS MODE ON MOBILE TO TEST IF THE DPI DONT SHOW PROBLEMS");
    //console.log("FIX IE MODE");
    //console.log("GENERAL SOUNDS");
    //console.log("SCROLL");
    //console.log("TEST ON KITKAT (4.4 API 19 OR 4.4.4 API 20) AFTER THE IE PORT. THE KITKAT VERSION SHOULD USE CANVAS OR TEST IF WEBGL WORK ON 4.4.4 API 20");
    //console.log("FIX CONTROL/BUTTON TOUCH PROBLEM: CONTROL BLOCK IS NOT WORKING WITH TOUCH");
    Game.bgms = new Array();
    Game.sfxs = new Array();
    function switchMusicMute() {
        Game.MUSIC_MUTED = !Game.MUSIC_MUTED;
        for (var _i = 0, bgms_1 = Game.bgms; _i < bgms_1.length; _i++) {
            var player = bgms_1[_i];
            player.muted = Game.MUSIC_MUTED;
        }
    }
    Game.switchMusicMute = switchMusicMute;
    function switchSoundMute() {
        Game.SOUND_MUTED = !Game.SOUND_MUTED;
        for (var _i = 0, sfxs_3 = Game.sfxs; _i < sfxs_3.length; _i++) {
            var player = sfxs_3[_i];
            player.muted = Game.SOUND_MUTED;
        }
    }
    Game.switchSoundMute = switchSoundMute;
    function findInJSON(jsonObj, funct) {
        if (jsonObj.find != null && jsonObj.find != undefined) {
            return jsonObj.find(funct);
        }
        else {
            for (var _i = 0, jsonObj_1 = jsonObj; _i < jsonObj_1.length; _i++) {
                var obj = jsonObj_1[_i];
                if (funct(obj)) {
                    return obj;
                }
            }
            return undefined;
        }
    }
    Game.findInJSON = findInJSON;
    function addElement(groups, type, element) {
        for (var _i = 0, groups_1 = groups; _i < groups_1.length; _i++) {
            var group = groups_1[_i];
            if (group.type == type) {
                group.elements.push(element);
                return;
            }
        }
        var group = {};
        group.type = type;
        group.elements = [element];
        groups.push(group);
    }
    function addPath(type, path) {
        addElement(pathGroups, type, path);
    }
    Game.addPath = addPath;
    function addAction(type, action) {
        addElement(actionGroups, type, action);
    }
    Game.addAction = addAction;
    function forEachPath(type, action) {
        for (var _i = 0, pathGroups_1 = pathGroups; _i < pathGroups_1.length; _i++) {
            var group = pathGroups_1[_i];
            if (group.type == type) {
                for (var _a = 0, _b = group.elements; _a < _b.length; _a++) {
                    var path = _b[_a];
                    action(path);
                }
                return;
            }
        }
    }
    Game.forEachPath = forEachPath;
    function triggerActions(type) {
        for (var _i = 0, actionGroups_1 = actionGroups; _i < actionGroups_1.length; _i++) {
            var group = actionGroups_1[_i];
            if (group.type == type) {
                for (var _a = 0, _b = group.elements; _a < _b.length; _a++) {
                    var action = _b[_a];
                    action();
                }
                return;
            }
        }
    }
    Game.triggerActions = triggerActions;
})(Game || (Game = {}));
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var Entity = /** @class */ (function (_super) {
        __extends(Entity, _super);
        function Entity(def) {
            var _this = _super.call(this) || this;
            _this.def = def;
            return _this;
        }
        //@ts-ignore
        Entity.create = function (def) {
            //console.log(def);
            if (def.type.type == "Game.Player") {
                //console.log("PLAYER");
                this.playerDef = def;
            }
            else {
                eval("new " + def.type.type + "(def)");
            }
        };
        Entity.createPlayer = function () {
            if (this.playerDef != null) {
                eval("new " + this.playerDef.type.type + "(this.playerDef)");
                this.playerDef = null;
            }
        };
        Entity.getDefProperty = function (def, name) {
            var prop = null;
            if (def.instance.properties != undefined) {
                prop = Game.findInJSON(def.instance.properties, function (prop) {
                    return prop.name == name;
                });
            }
            if (prop == null && def.type.properties != undefined) {
                prop = Game.findInJSON(def.type.properties, function (prop) {
                    return prop.name == name;
                });
            }
            if (prop != null) {
                return prop.value;
            }
            return null;
        };
        Entity.prototype.getProperty = function (name) {
            return Entity.getDefProperty(this.def, name);
        };
        Entity.playerDef = null;
        return Entity;
    }(Engine.Entity));
    Game.Entity = Entity;
})(Game || (Game = {}));
///<reference path="../System/Entity.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        Arcade.xForceWorld = 0;
        Arcade.yForceWorld = 0.2;
        var X_VEL_MAX_DEFAULT = 0;
        var Y_VEL_MAX_DEFAULT = 10;
        var PhysicEntity = /** @class */ (function (_super) {
            __extends(PhysicEntity, _super);
            function PhysicEntity(def) {
                var _this = _super.call(this, def) || this;
                _this.xOffsetDraw = 0;
                _this.yOffsetDraw = 0;
                _this.xAlign = "middle";
                _this.yAlign = "end";
                _this.xVel = 0;
                _this.yVel = 0;
                _this.xCanMove = true;
                _this.yCanMove = true;
                _this.xStop = true;
                _this.yStop = true;
                _this.xDirContact = 0;
                _this.yDirContact = 0;
                _this.xScaleForceWorld = 1;
                _this.yScaleForceWorld = 1;
                _this.xMaxVel = X_VEL_MAX_DEFAULT;
                _this.yMaxVel = Y_VEL_MAX_DEFAULT;
                _this.xDraw = 0;
                _this.yDraw = 0;
                _this.boxSolid = new Engine.Box();
                _this.boxSolid.enabled = true;
                _this.boxSolid.renderable = true;
                _this.boxSolid.xSize = 8;
                _this.boxSolid.ySize = 8;
                _this.boxSolid.xOffset = -4;
                _this.boxSolid.yOffset = -8;
                return _this;
            }
            Object.defineProperty(PhysicEntity.prototype, "xVelExtern", {
                get: function () {
                    return 0;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(PhysicEntity.prototype, "yVelExtern", {
                get: function () {
                    return 0;
                },
                enumerable: false,
                configurable: true
            });
            PhysicEntity.prototype.onReset = function () {
                if (this.def.flip.x) {
                    switch (this.xAlign) {
                        case "start":
                            this.boxSolid.x = this.def.instance.x;
                            break;
                        case "middle":
                            this.boxSolid.x = this.def.instance.x - Game.SceneMap.instance.xSizeTile * 0.5;
                            break;
                        case "end":
                            this.boxSolid.x = this.def.instance.x - Game.SceneMap.instance.xSizeTile;
                            break;
                    }
                    this.boxSolid.x += Game.SceneMap.instance.xSizeTile;
                }
                else {
                    switch (this.xAlign) {
                        case "start":
                            this.boxSolid.x = this.def.instance.x;
                            break;
                        case "middle":
                            this.boxSolid.x = this.def.instance.x + Game.SceneMap.instance.xSizeTile * 0.5;
                            break;
                        case "end":
                            this.boxSolid.x = this.def.instance.x + Game.SceneMap.instance.xSizeTile;
                            break;
                    }
                }
                if (this.def.flip.y) {
                    switch (this.yAlign) {
                        case "start":
                            this.boxSolid.y = this.def.instance.y;
                            break;
                        case "middle":
                            this.boxSolid.y = this.def.instance.y - Game.SceneMap.instance.ySizeTile * 0.5;
                            break;
                        case "end":
                            this.boxSolid.y = this.def.instance.y - Game.SceneMap.instance.ySizeTile;
                            break;
                    }
                }
                else {
                    switch (this.yAlign) {
                        case "start":
                            this.boxSolid.y = this.def.instance.y;
                            break;
                        case "middle":
                            this.boxSolid.y = this.def.instance.y + Game.SceneMap.instance.ySizeTile * 0.5;
                            break;
                        case "end":
                            this.boxSolid.y = this.def.instance.y + Game.SceneMap.instance.ySizeTile;
                            break;
                    }
                    this.boxSolid.y -= Game.SceneMap.instance.ySizeTile;
                }
                this.boxSolid.enabled = true;
                this.xDraw = this.boxSolid.x;
                this.yDraw = this.boxSolid.y;
                this.xVel = 0;
                this.yVel = 0;
                this.xDirContact = 0;
                this.yDirContact = 0;
                this.xContacts = null;
                this.yContacts = null;
            };
            PhysicEntity.prototype.onMoveUpdate = function () {
                if (!Game.SceneFreezer.stoped) {
                    this.xContacts = null;
                    this.xDirContact = 0;
                    this.yContacts = null;
                    this.yDirContact = 0;
                    if (this.xCanMove) {
                        this.xVel += Arcade.xForceWorld * this.xScaleForceWorld;
                        if (this.xMaxVel > 0 && this.xVel > this.xMaxVel) {
                            this.xVel = this.xMaxVel;
                        }
                        else if (this.xMaxVel < 0 && this.xVel < -this.xMaxVel) {
                            this.xVel = -this.xMaxVel;
                        }
                        if (this.boxSolid != null) {
                            this.xContacts = this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, true, this.xVel, true, Engine.Box.LAYER_ALL);
                            this.boxSolid.translate(this.xContacts, true, this.xVel, true);
                            if (this.xContacts != null) {
                                this.xDirContact = this.xVel < 0 ? -1 : 1;
                                if (this.xStop) {
                                    this.xVel = 0;
                                }
                            }
                        }
                    }
                    if (this.yCanMove) {
                        this.yVel += Arcade.yForceWorld * this.yScaleForceWorld;
                        if (this.yMaxVel > 0 && this.yVel > this.yMaxVel) {
                            this.yVel = this.yMaxVel;
                        }
                        else if (this.yMaxVel < 0 && this.yVel < -this.yMaxVel) {
                            this.yVel = -this.yMaxVel;
                        }
                        if (this.boxSolid != null) {
                            this.yContacts = this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, false, this.yVel, true, Engine.Box.LAYER_ALL);
                            this.boxSolid.translate(this.yContacts, false, this.yVel, true);
                            if (this.yContacts != null) {
                                this.yDirContact = this.yVel < 0 ? -1 : 1;
                                if (this.yStop) {
                                    this.yVel = 0;
                                }
                            }
                        }
                    }
                }
                this.xDraw = this.boxSolid.x;
                this.yDraw = this.boxSolid.y;
            };
            PhysicEntity.prototype.getContacts = function (xAxis, dir) {
                if (dir != 0) {
                    if (xAxis) {
                        return this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, true, dir > 0 ? 1 : -1, false, Engine.Box.LAYER_ALL);
                    }
                    else {
                        return this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, false, dir > 0 ? 1 : -1, false, Engine.Box.LAYER_ALL);
                    }
                }
                return null;
            };
            PhysicEntity.prototype.hasContact = function (xAxis, dir) {
                return this.getContacts(xAxis, dir) != null;
            };
            PhysicEntity.prototype.getDirContact = function (xAxis, dir) {
                if (this.hasContact(xAxis, dir)) {
                    return dir > 0 ? 1 : -1;
                }
                return 0;
            };
            PhysicEntity.prototype.onTimeUpdate = function () {
                if (!Game.SceneFreezer.stoped) {
                    if (this.xCanMove && this.yCanMove) {
                        var point = this.boxSolid.getExtrapolation(Game.SceneMap.instance.boxesSolids, this.xVel + this.xVelExtern, this.yVel + this.yVelExtern, true, Engine.Box.LAYER_ALL);
                        this.xDraw = point.x;
                        this.yDraw = point.y;
                    }
                    else if (this.xCanMove) {
                        var point = this.boxSolid.getExtrapolation(Game.SceneMap.instance.boxesSolids, this.xVel + this.xVelExtern, 0, true, Engine.Box.LAYER_ALL);
                        this.xDraw = point.x;
                        this.yDraw = this.boxSolid.y;
                    }
                    else if (this.yCanMove) {
                        var point = this.boxSolid.getExtrapolation(Game.SceneMap.instance.boxesSolids, 0, this.yVel + this.yVelExtern, true, Engine.Box.LAYER_ALL);
                        this.xDraw = this.boxSolid.x;
                        this.yDraw = point.y;
                    }
                    else {
                        this.xDraw = this.boxSolid.x;
                        this.yDraw = this.boxSolid.y;
                    }
                }
            };
            PhysicEntity.prototype.onDrawObjectsFront = function () {
                if (Engine.Box.debugRender) {
                    this.boxSolid.renderExtrapolated(Game.SceneMap.instance.boxesSolids, this.xVel + this.xVelExtern, this.yVel + this.yVelExtern, true, Engine.Box.LAYER_ALL);
                }
            };
            return PhysicEntity;
        }(Game.Entity));
        Arcade.PhysicEntity = PhysicEntity;
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path="PhysicEntity.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var WorldEntity = /** @class */ (function (_super) {
            __extends(WorldEntity, _super);
            function WorldEntity(def) {
                var _this = _super.call(this, def) || this;
                _this.sprite = new Engine.Sprite();
                _this.sprite.enabled = true;
                _this.animator = new Utils.Animator();
                _this.animator.owner = _this;
                _this.animator.listener = _this;
                _this.machine = new Game.Flow.StateMachine(_this);
                _this.machine.owner = _this;
                _this.machine.startState = _this.initStates();
                return _this;
            }
            WorldEntity.prototype.initStates = function () {
                return new Game.Flow.State(this);
            };
            WorldEntity.prototype.onSetFrame = function (_animator, _animation, _frame) {
                _frame.applyToSprite(this.sprite);
            };
            WorldEntity.prototype.onReset = function () {
                _super.prototype.onReset.call(this);
                this.sprite.enabled = true;
                this.sprite.x = this.xDraw;
                this.sprite.y = this.yDraw;
                this.sprite.xMirror = this.def.flip.x;
                this.sprite.yMirror = this.def.flip.y;
            };
            WorldEntity.prototype.onMoveUpdate = function () {
                _super.prototype.onMoveUpdate.call(this);
                this.sprite.x = this.xDraw;
                this.sprite.y = this.yDraw;
            };
            WorldEntity.prototype.onTimeUpdate = function () {
                _super.prototype.onTimeUpdate.call(this);
                this.sprite.x = this.xDraw;
                this.sprite.y = this.yDraw;
            };
            return WorldEntity;
        }(Arcade.PhysicEntity));
        Arcade.WorldEntity = WorldEntity;
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path = "../WorldEntity.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var X_MOVE_VEL_DEFAULT = 1.3;
            var Y_VEL_JUMP_DEFAULT = 5.0;
            var Y_DRAG_CANCEL_JUMP_DEFAULT = 0.7;
            var BaseEntity = /** @class */ (function (_super) {
                __extends(BaseEntity, _super);
                function BaseEntity() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.platformParent = null;
                    _this.moveActionsEnabled = true;
                    _this.turnActionsEnabled = true;
                    _this._jumpActionsEnabled = true;
                    _this._platformActionsEnabled = true;
                    _this.xVelMove = X_MOVE_VEL_DEFAULT;
                    _this.yVelJump = Y_VEL_JUMP_DEFAULT;
                    _this._jumping = false;
                    _this._canCancelJump = true;
                    _this._jumpCanceled = false;
                    _this.yDragCancelJump = Y_DRAG_CANCEL_JUMP_DEFAULT;
                    _this._xOverlapsPlatform = false;
                    _this._xCollidesOnPlatform = false;
                    _this._yOverlapsPlatform = false;
                    return _this;
                }
                Object.defineProperty(BaseEntity.prototype, "jumpActionsEnabled", {
                    get: function () {
                        return this._jumpActionsEnabled;
                    },
                    set: function (value) {
                        this._jumpActionsEnabled = value;
                        if (!this._jumpActionsEnabled) {
                            this._jumpCanceled = false;
                            this._jumping = false;
                        }
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "platformActionsEnabled", {
                    get: function () {
                        return this._platformActionsEnabled;
                    },
                    set: function (value) {
                        this._platformActionsEnabled = value;
                        if (!this._platformActionsEnabled && this.platformParent != null) {
                            this.platformParent.removeChild(this);
                        }
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "jumping", {
                    get: function () {
                        return this._jumping;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "canCancelJump", {
                    get: function () {
                        return this._canCancelJump;
                    },
                    set: function (value) {
                        this._canCancelJump = value;
                        if (!this._canCancelJump) {
                            this._jumpCanceled = false;
                        }
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "xOverlapsPlatform", {
                    get: function () {
                        return this._xOverlapsPlatform;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "xCollidesOnPlatform", {
                    get: function () {
                        return this._xCollidesOnPlatform;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "yOverlapsPlatform", {
                    get: function () {
                        return this._yOverlapsPlatform;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "dirMove", {
                    get: function () {
                        return 0;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "jumpControlPressed", {
                    get: function () {
                        return false;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "jumpControlDown", {
                    get: function () {
                        return false;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "xVelExtern", {
                    get: function () {
                        if (this.platformParent != null) {
                            return this.platformParent.xGetVelMove();
                        }
                        return 0;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseEntity.prototype, "yVelExtern", {
                    get: function () {
                        if (this.platformParent != null) {
                            return this.platformParent.yGetVelMove();
                        }
                        return 0;
                    },
                    enumerable: false,
                    configurable: true
                });
                BaseEntity.prototype.onInitScene = function () {
                    Platformer.Platform.pushInteractable(this);
                };
                BaseEntity.prototype.onReset = function () {
                    _super.prototype.onReset.call(this);
                    this._jumping = false;
                    this._jumpCanceled = false;
                };
                BaseEntity.prototype.onMoveReady = function () {
                    this._xOverlapsPlatform = false;
                    this._xCollidesOnPlatform = false;
                    this._yOverlapsPlatform = false;
                };
                BaseEntity.prototype.onMoveUpdate = function () {
                    _super.prototype.onMoveUpdate.call(this);
                    if (!Game.SceneFreezer.stoped) {
                        if (this.moveActionsEnabled) {
                            this.xVel = this.xVelMove * this.dirMove;
                        }
                        if (this.turnActionsEnabled && this.dirMove != 0) {
                            this.sprite.xMirror = this.dirMove < 0;
                        }
                        if (!this._jumping && this._jumpActionsEnabled && this.yDirContact > 0 && this.jumpControlPressed) {
                            this.yVel = -this.yVelJump;
                            this._jumpCanceled = false;
                            this._jumping = true;
                        }
                        if (this._jumping && !this._jumpCanceled && this.yVel < 0 && this._canCancelJump && !this.jumpControlDown) {
                            this._jumpCanceled = true;
                        }
                        if (this._jumping && this._jumpCanceled && this.yVel < 0) {
                            this.yVel *= this.yDragCancelJump;
                        }
                        if (this._jumping && this.yVel >= 0) {
                            this._jumpCanceled = false,
                                this._jumping = false;
                        }
                        if (this.platformActionsEnabled) {
                            this.platformCheck();
                        }
                    }
                };
                BaseEntity.prototype.platformCheck = function () {
                    var newPlatformParent = null;
                    if (this.yDirContact > 0) {
                        for (var _i = 0, _a = this.yContacts; _i < _a.length; _i++) {
                            var contact = _a[_i];
                            if (contact.other.data instanceof Platformer.Platform) {
                                if (contact.other.data == this.platformParent) {
                                    return;
                                }
                                else {
                                    newPlatformParent = contact.other.data;
                                }
                            }
                        }
                    }
                    if (newPlatformParent != null) {
                        newPlatformParent.addChild(this);
                    }
                    else if (this.platformParent != null) {
                        this.platformParent.removeChild(this);
                    }
                };
                BaseEntity.prototype.xMoveOnPlatform = function (dist) {
                    //if(!this.moveActionsEnabled || this.dirMove == 0 || (this.dirMove > 0 && dist < 0)){
                    var contacts = this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, true, dist, true, Engine.Box.LAYER_ALL);
                    this.boxSolid.translate(contacts, true, dist, true);
                    this._xCollidesOnPlatform = contacts != null;
                    //}
                };
                BaseEntity.prototype.yMoveOnPlatform = function (dist) {
                    var contacts = this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, false, dist, true, Engine.Box.LAYER_ALL);
                    this.boxSolid.translate(contacts, false, dist, true);
                };
                BaseEntity.prototype.onPlatformOverlapX = function () {
                    this._xOverlapsPlatform = true;
                };
                BaseEntity.prototype.onPlatformOverlapY = function () {
                    this._yOverlapsPlatform = true;
                };
                return BaseEntity;
            }(Arcade.WorldEntity));
            Platformer.BaseEntity = BaseEntity;
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path = "BaseEntity.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var BaseMachineEntity = /** @class */ (function (_super) {
                __extends(BaseMachineEntity, _super);
                function BaseMachineEntity(def) {
                    var _this = _super.call(this, def) || this;
                    _this.boxOverlap = new Engine.Box();
                    _this.boxOverlap.enabled = true;
                    _this.boxOverlap.renderable = true;
                    _this.boxOverlap.red = 0;
                    _this.boxOverlap.green = 0;
                    _this.boxOverlap.blue = 1;
                    return _this;
                }
                BaseMachineEntity.prototype.initStates = function () {
                    var _this = this;
                    _super.prototype.initStates.call(this);
                    this.stateStand = new Game.Flow.State(this, "stand");
                    this.stateMove = new Game.Flow.State(this, "move");
                    this.stateAscend = new Game.Flow.State(this, "ascend");
                    this.stateFall = new Game.Flow.State(this, "fall");
                    this.stateLanding = new Game.Flow.State(this, "landing");
                    this.stateStand.onEnter = function () {
                        _this.moveActionsEnabled = true;
                        _this.turnActionsEnabled = true;
                        _this.jumpActionsEnabled = true;
                        _this.platformActionsEnabled = true;
                    };
                    this.stateStand.onReady = function () {
                        _this.animator.setAnimation(_this.animStand);
                    };
                    this.stateStand.addLink(this.stateMove, function () { return _this.dirMove != 0 && _this.moveActionsEnabled; });
                    this.stateStand.addLink(this.stateAscend, function () { return _this.yVel < 0; });
                    this.stateStand.addLink(this.stateFall, function () { return _this.yVel > 0 && _this.yDirContact == 0; });
                    this.stateMove.onEnter = function () {
                        _this.moveActionsEnabled = true;
                        _this.turnActionsEnabled = true;
                        _this.jumpActionsEnabled = true;
                        _this.platformActionsEnabled = true;
                    };
                    this.stateMove.onReady = function () {
                        _this.animator.setAnimation(_this.animMove);
                    };
                    this.stateMove.addLink(this.stateStand, function () { return _this.dirMove == 0 || !_this.moveActionsEnabled; });
                    this.stateMove.addLink(this.stateAscend, function () { return _this.yVel < 0; });
                    this.stateMove.addLink(this.stateFall, function () { return _this.yVel > 0 && _this.yDirContact == 0; });
                    this.stateAscend.onEnter = function () {
                        _this.moveActionsEnabled = true;
                        _this.turnActionsEnabled = true;
                        _this.jumpActionsEnabled = true;
                        _this.platformActionsEnabled = true;
                    };
                    this.stateAscend.onReady = function () {
                        _this.animator.setAnimation(_this.animAscend);
                        if (_this.jumping && _this.sfxJump != null) {
                            _this.sfxJump.play();
                        }
                    };
                    this.stateAscend.addLink(this.stateFall, function () { return _this.yVel >= 0; });
                    this.stateFall.onEnter = function () {
                        _this.moveActionsEnabled = true;
                        _this.turnActionsEnabled = true;
                        _this.jumpActionsEnabled = false;
                        _this.platformActionsEnabled = true;
                    };
                    this.stateFall.onReady = function () {
                        if (_this.animator.animation == _this.animAscend && _this.animFallAscend != null) {
                            _this.animator.setAnimation(_this.animFallAscend);
                        }
                        else {
                            _this.animator.setAnimation(_this.animFall);
                        }
                    };
                    this.stateFall.addLink(this.stateAscend, function () { return _this.yVel < 0; });
                    this.stateFall.addLink(this.stateLanding, function () { return _this.yVel >= 0 && _this.yDirContact > 0; });
                    this.stateLanding.onEnter = function () {
                        _this.moveActionsEnabled = true;
                        _this.turnActionsEnabled = true;
                        _this.jumpActionsEnabled = true;
                        _this.platformActionsEnabled = true;
                    };
                    this.stateLanding.onReady = function () {
                        _this.animator.setAnimation(_this.animLanding);
                    };
                    this.stateLanding.addLink(this.stateStand, function () { return _this.animLanding == null; });
                    this.stateLanding.addLink(this.stateStand, function () { return _this.dirMove == 0 && _this.animator.animation == _this.animLanding && _this.animator.ended; });
                    this.stateLanding.addLink(this.stateMove, function () { return _this.dirMove != 0; });
                    this.stateLanding.addLink(this.stateAscend, function () { return _this.yVel < 0; });
                    this.stateLanding.addLink(this.stateFall, function () { return _this.yVel > 0 && _this.yDirContact == 0; });
                    return this.stateStand;
                };
                BaseMachineEntity.prototype.onReset = function () {
                    _super.prototype.onReset.call(this);
                    this.boxOverlap.x = this.boxSolid.x;
                    this.boxOverlap.y = this.boxSolid.y;
                };
                BaseMachineEntity.prototype.onMoveUpdate = function () {
                    _super.prototype.onMoveUpdate.call(this);
                    this.boxOverlap.x = this.boxSolid.x;
                    this.boxOverlap.y = this.boxSolid.y;
                };
                BaseMachineEntity.prototype.onOverlapUpdate = function () {
                    this.boxOverlap.x = this.boxSolid.x;
                    this.boxOverlap.y = this.boxSolid.y;
                };
                BaseMachineEntity.prototype.onDrawObjectsFront = function () {
                    _super.prototype.onDrawObjectsFront.call(this);
                    if (Engine.Box.debugRender) {
                        this.boxOverlap.x = this.boxSolid.x;
                        this.boxOverlap.y = this.boxSolid.y;
                        this.boxOverlap.render();
                    }
                };
                return BaseMachineEntity;
            }(Platformer.BaseEntity));
            Platformer.BaseMachineEntity = BaseMachineEntity;
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path = "BaseMachineEntity.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var BaseDrawablePlayer = /** @class */ (function (_super) {
                __extends(BaseDrawablePlayer, _super);
                function BaseDrawablePlayer() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Object.defineProperty(BaseDrawablePlayer.prototype, "xRender", {
                    get: function () {
                        return this.xDraw;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseDrawablePlayer.prototype, "yRender", {
                    get: function () {
                        return this.yDraw;
                    },
                    enumerable: false,
                    configurable: true
                });
                BaseDrawablePlayer.prototype.onDrawPlayer = function () {
                    this.sprite.render();
                };
                return BaseDrawablePlayer;
            }(Platformer.BaseMachineEntity));
            Platformer.BaseDrawablePlayer = BaseDrawablePlayer;
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path = "BaseDrawablePlayer.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var DEFAULT_STEPS_WAIT_WINNING_LOSSING = 26;
            var BaseFlowPlayer = /** @class */ (function (_super) {
                __extends(BaseFlowPlayer, _super);
                function BaseFlowPlayer(def) {
                    var _this = _super.call(this, def) || this;
                    _this.stepsWin = DEFAULT_STEPS_WAIT_WINNING_LOSSING;
                    _this.stepsLoss = DEFAULT_STEPS_WAIT_WINNING_LOSSING;
                    _this._canWin = true;
                    _this._canLoss = true;
                    BaseFlowPlayer._instance = _this;
                    return _this;
                }
                Object.defineProperty(BaseFlowPlayer, "instance", {
                    get: function () {
                        return BaseFlowPlayer._instance;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseFlowPlayer.prototype, "winning", {
                    get: function () {
                        return this._winning;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseFlowPlayer.prototype, "hasWon", {
                    get: function () {
                        return this._hasWon;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseFlowPlayer.prototype, "losing", {
                    get: function () {
                        return this._losing;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseFlowPlayer.prototype, "hasLost", {
                    get: function () {
                        return this._hasLost;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseFlowPlayer.prototype, "winCondition", {
                    get: function () {
                        return false;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseFlowPlayer.prototype, "lossCondition", {
                    get: function () {
                        return false;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseFlowPlayer.prototype, "canWin", {
                    get: function () {
                        return this._canWin;
                    },
                    set: function (value) {
                        this._canWin = value;
                        if (!this._canWin) {
                            this._winning = false;
                            this._hasWon = false;
                            this.countStepsWin = 0;
                        }
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(BaseFlowPlayer.prototype, "canLoss", {
                    get: function () {
                        return this.canLoss;
                    },
                    set: function (value) {
                        this._canLoss = value;
                        if (!this._canLoss) {
                            this._losing = false;
                            this._hasLost = false;
                            this.countStepsLoss = 0;
                        }
                    },
                    enumerable: false,
                    configurable: true
                });
                BaseFlowPlayer.prototype.onReset = function () {
                    _super.prototype.onReset.call(this);
                    this.countStepsWin = 0;
                    this._winning = false;
                    this._hasWon = false;
                    this.countStepsLoss = 0;
                    this._losing = false;
                    this._hasLost = false;
                };
                BaseFlowPlayer.prototype.onStepUpdate = function () {
                    if (!Game.SceneFreezer.stoped) {
                        if (this._winning && !this._hasWon) {
                            this.countStepsWin -= 1;
                            if (this.countStepsWin <= 0) {
                                this._hasWon = true;
                                this.onWon();
                            }
                        }
                        if (this._losing && !this._hasLost) {
                            this.countStepsLoss -= 1;
                            if (this.countStepsLoss <= 0) {
                                this._hasLost = true;
                                this.onWon();
                            }
                        }
                        if (!this._winning && this.winCondition) {
                            this.onGoal();
                            if (this._canWin) {
                                this._winning = true;
                                this.countStepsWin = this.stepsWin;
                                this.onWinning();
                            }
                        }
                        if (!this._winning && !this._losing && this.lossCondition) {
                            this.onDeath();
                            if (this._canLoss) {
                                this._losing = true;
                                this.countStepsLoss = this.stepsLoss;
                                this.onLosing();
                            }
                        }
                    }
                };
                BaseFlowPlayer.prototype.onGoal = function () {
                };
                BaseFlowPlayer.prototype.onWinning = function () {
                };
                BaseFlowPlayer.prototype.onWon = function () {
                };
                BaseFlowPlayer.prototype.onDeath = function () {
                };
                BaseFlowPlayer.prototype.onLosing = function () {
                };
                BaseFlowPlayer.prototype.onLost = function () {
                };
                return BaseFlowPlayer;
            }(Platformer.BaseDrawablePlayer));
            Platformer.BaseFlowPlayer = BaseFlowPlayer;
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path = "BaseFlowPlayer.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var BaseAwarePlayer = /** @class */ (function (_super) {
                __extends(BaseAwarePlayer, _super);
                function BaseAwarePlayer() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                BaseAwarePlayer.prototype.onReset = function () {
                    _super.prototype.onReset.call(this);
                    this.contactsEnemies = null;
                };
                BaseAwarePlayer.prototype.onOverlapUpdate = function () {
                    _super.prototype.onOverlapUpdate.call(this);
                    if (!Game.SceneFreezer.stoped) {
                        this.contactsEnemies = this.boxOverlap.collide(Game.SceneMap.instance.boxesEnemies, null, true, 0, true, Engine.Box.LAYER_ALL);
                        this.contactsSolids = this.boxSolid.collide(Game.SceneMap.instance.boxesSolids, null, true, 0, true, Engine.Box.LAYER_ALL);
                    }
                };
                return BaseAwarePlayer;
            }(Platformer.BaseFlowPlayer));
            Platformer.BaseAwarePlayer = BaseAwarePlayer;
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path = "../../System/Entity.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var interactables = null;
            var Platform = /** @class */ (function (_super) {
                __extends(Platform, _super);
                function Platform(def) {
                    var _this = _super.call(this, def) || this;
                    _this.children = null;
                    interactables = interactables || [];
                    _this.box = new Engine.Box();
                    _this.box.enabled = true;
                    _this.box.renderable = true;
                    _this.box.xSize = Game.SceneMap.instance.xSizeTile;
                    _this.box.ySize = Game.SceneMap.instance.ySizeTile;
                    _this.box.data = _this;
                    Game.SceneMap.instance.boxesSolids.push(_this.box);
                    _this.sprite = new Engine.Sprite();
                    _this.xOrigin = def.instance.x;
                    _this.yOrigin = def.instance.y - Game.SceneMap.instance.ySizeTile;
                    _this.xDestiny = _this.xOrigin + _this.getProperty("dist tiles x") * Game.SceneMap.instance.xSizeTile;
                    _this.yDestiny = _this.yOrigin + _this.getProperty("dist tiles y") * Game.SceneMap.instance.ySizeTile;
                    _this.velMove = _this.getProperty("vel move");
                    _this.stepsWaitStart = _this.getProperty("wait steps start");
                    _this.stepsWaitOrigin = _this.getProperty("wait steps origin");
                    _this.stepsWaitDestiny = _this.getProperty("wait steps destiny");
                    _this.initStates();
                    return _this;
                    //this.sprite.enabled = true;
                }
                Platform.prototype.initStates = function () {
                    var _this = this;
                    this.stateWaiting = new Game.Flow.State(this, "waiting");
                    this.stateMoving = new Game.Flow.State(this, "moving");
                    this.stateWaiting.onEnter = function () {
                        if (_this.machine.oldState == null) {
                            _this.onOrigin = true;
                            _this.countStepsWait = _this.stepsWaitStart;
                        }
                        else {
                            _this.onOrigin = !_this.onOrigin;
                            _this.countStepsWait = _this.onOrigin ? _this.stepsWaitOrigin : _this.stepsWaitDestiny;
                        }
                        _this.xDist = 0;
                        _this.yDist = 0;
                        _this.xDir = 0;
                        _this.yDir = 0;
                        _this.xVel = 0;
                        _this.yVel = 0;
                    };
                    this.stateWaiting.onStepUpdate = function () {
                        _this.countStepsWait -= 1;
                    };
                    this.stateWaiting.addLink(this.stateMoving, function () { return _this.countStepsWait <= 0; });
                    this.stateMoving.onEnter = function () {
                        if (_this.onOrigin) {
                            _this.xNext = _this.xDestiny;
                            _this.yNext = _this.yDestiny;
                        }
                        else {
                            _this.xNext = _this.xOrigin;
                            _this.yNext = _this.yOrigin;
                        }
                        _this.xDist = _this.xNext - _this.box.x;
                        _this.yDist = _this.yNext - _this.box.y;
                        var magnitude = Math.sqrt(_this.xDist * _this.xDist + _this.yDist * _this.yDist);
                        _this.xDir = _this.xDist / magnitude;
                        _this.yDir = _this.yDist / magnitude;
                        _this.xVel = _this.velMove * _this.xDir * (_this.xDir < 0 ? -1 : 1);
                        _this.yVel = _this.velMove * _this.yDir * (_this.yDir < 0 ? -1 : 1);
                        _this.xDist *= (_this.xDist < 0 ? -1 : 1);
                        _this.yDist *= (_this.yDist < 0 ? -1 : 1);
                    };
                    this.stateMoving.onMoveUpdate = function () {
                        _this.xMove();
                        _this.yMove();
                    };
                    this.stateMoving.addLink(this.stateWaiting, function () { return _this.xDist <= 0 && _this.yDist <= 0; });
                    this.machine = new Game.Flow.StateMachine(this);
                    this.machine.owner = this;
                    this.machine.startState = this.stateWaiting;
                };
                Platform.pushInteractable = function (interactable) {
                    if (interactables != null) {
                        interactables.push(interactable);
                    }
                };
                Platform.prototype.onReset = function () {
                    this.box.x = this.xOrigin;
                    this.box.y = this.yOrigin;
                    if (this.children != null) {
                        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                            var child = _a[_i];
                            child.platformParent = null;
                        }
                    }
                    this.children = [];
                };
                Platform.prototype.addChild = function (child) {
                    if (child.platformParent != this) {
                        if (child.platformParent != null) {
                            child.platformParent.removeChild(child);
                        }
                        child.platformParent = this;
                        this.children.push(child);
                    }
                };
                Platform.prototype.removeChild = function (child) {
                    child.platformParent = null;
                    var newChildren = [];
                    for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                        var oldChild = _a[_i];
                        if (oldChild != child) {
                            newChildren.push(oldChild);
                        }
                    }
                    this.children = newChildren;
                };
                Platform.prototype.onStepUpdate = function () {
                };
                Platform.prototype.xGetMagMove = function () {
                    return this.xDist > this.xVel ? this.xVel : this.xDist;
                };
                Platform.prototype.xGetVelMove = function () {
                    return this.xGetMagMove() * (this.xDir > 0 ? 1 : -1);
                };
                Platform.prototype.xMove = function () {
                    if (this.xGetMagMove() != 0) {
                        this.box.x += this.xGetVelMove();
                        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                            var child = _a[_i];
                            child.xMoveOnPlatform(this.xGetVelMove());
                        }
                        this.xDist -= this.xGetMagMove();
                        if (this.xDist <= 0) {
                            this.box.x = this.xNext;
                        }
                        var dirMove = this.xDir > 0 ? 1 : -1;
                        for (var _b = 0, interactables_1 = interactables; _b < interactables_1.length; _b++) {
                            var interactable = interactables_1[_b];
                            var contacts = this.box.collideAgainst(interactable.boxSolid, null, true, 0, true, Engine.Box.LAYER_ALL);
                            if (contacts != null) {
                                var distMove = this.box.getDist(interactable.boxSolid, dirMove, true);
                                contacts = interactable.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, true, -distMove, false, Engine.Box.LAYER_ALL);
                                interactable.boxSolid.translate(contacts, true, -distMove, false);
                                interactable.onPlatformOverlapX();
                            }
                        }
                    }
                };
                Platform.prototype.yGetMagMove = function () {
                    return this.yDist > this.yVel ? this.yVel : this.yDist;
                };
                Platform.prototype.yGetVelMove = function () {
                    return this.yGetMagMove() * (this.yDir > 0 ? 1 : -1);
                };
                Platform.prototype.yMove = function () {
                    if (this.yGetMagMove()) {
                        this.box.y += this.yGetVelMove();
                        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                            var child = _a[_i];
                            child.yMoveOnPlatform(this.yGetVelMove());
                        }
                        this.yDist -= this.yGetMagMove();
                        if (this.yDist <= 0) {
                            var delta = this.yNext - this.box.y;
                            this.box.y = this.yNext;
                            if (this.yDist < 0) {
                                for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
                                    var child = _c[_b];
                                    child.yMoveOnPlatform(delta);
                                }
                            }
                        }
                        var dirMove = this.yDir > 0 ? 1 : -1;
                        for (var _d = 0, interactables_2 = interactables; _d < interactables_2.length; _d++) {
                            var interactable = interactables_2[_d];
                            var contacts = this.box.collideAgainst(interactable.boxSolid, null, true, 0, true, Engine.Box.LAYER_ALL);
                            if (contacts != null) {
                                var distMove = this.box.getDist(interactable.boxSolid, dirMove, false);
                                contacts = interactable.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, false, -distMove, false, Engine.Box.LAYER_ALL);
                                interactable.boxSolid.translate(contacts, false, -distMove, false);
                                interactable.onPlatformOverlapY();
                            }
                        }
                    }
                };
                Platform.prototype.onTimeUpdate = function () {
                    var xDraw = this.box.x;
                    var yDraw = this.box.y;
                    this.sprite.x = xDraw;
                    this.sprite.y = yDraw;
                };
                Platform.prototype.onDrawObjects = function () {
                    //this.sprite.render();
                };
                Platform.prototype.onDrawObjectsFront = function () {
                    if (Engine.Box.debugRender) {
                        var xOld = this.box.x;
                        var yOld = this.box.y;
                        this.box.x += this.xGetVelMove() * Engine.System.deltaTime;
                        this.box.y += this.yGetVelMove() * Engine.System.deltaTime;
                        this.box.render();
                        this.box.x = xOld;
                        this.box.y = yOld;
                    }
                };
                Platform.prototype.onClearScene = function () {
                    interactables = null;
                };
                return Platform;
            }(Game.Entity));
            Platformer.Platform = Platform;
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path = "../BaseAwarePlayer.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var Simple;
            (function (Simple) {
                var BaseFlowPlayer = /** @class */ (function (_super) {
                    __extends(BaseFlowPlayer, _super);
                    function BaseFlowPlayer(def) {
                        return _super.call(this, def) || this;
                    }
                    Object.defineProperty(BaseFlowPlayer.prototype, "winCondition", {
                        get: function () {
                            return this.boxOverlap.collideAgainst(Simple.Goal.instance.boxOverlap, null, true, 0, true, Engine.Box.LAYER_ALL) != null;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(BaseFlowPlayer.prototype, "lossCondition", {
                        get: function () {
                            return this.contactsEnemies != null || this.contactsSolids != null || this.boxSolid.y > Game.SceneMap.instance.ySizeMap;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    return BaseFlowPlayer;
                }(Platformer.BaseAwarePlayer));
                Simple.BaseFlowPlayer = BaseFlowPlayer;
            })(Simple = Platformer.Simple || (Platformer.Simple = {}));
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path = "BaseFlowPlayer.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var Simple;
            (function (Simple) {
                var ControllablePlayer = /** @class */ (function (_super) {
                    __extends(ControllablePlayer, _super);
                    function ControllablePlayer(def, framesControls, alphaControls) {
                        if (alphaControls === void 0) { alphaControls = 0.5; }
                        var _this = _super.call(this, def) || this;
                        _this.controls = new Game.Interaction.Controls.Platformer.BasicJumperControls(framesControls, alphaControls);
                        return _this;
                    }
                    Object.defineProperty(ControllablePlayer.prototype, "dirMove", {
                        get: function () {
                            return this.controls.downLeft ? -1 : (this.controls.downRight ? 1 : 0);
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(ControllablePlayer.prototype, "jumpControlPressed", {
                        get: function () {
                            return this.controls.pressedDelayedAction;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(ControllablePlayer.prototype, "jumpControlDown", {
                        get: function () {
                            return this.controls.downAction;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    return ControllablePlayer;
                }(Simple.BaseFlowPlayer));
                Simple.ControllablePlayer = ControllablePlayer;
            })(Simple = Platformer.Simple || (Platformer.Simple = {}));
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path="../BaseMachineEntity.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var Simple;
            (function (Simple) {
                var Goal = /** @class */ (function (_super) {
                    __extends(Goal, _super);
                    function Goal(def) {
                        var _this = _super.call(this, def) || this;
                        Goal.instance = _this;
                        return _this;
                    }
                    Goal.prototype.onDrawGoal = function () {
                        this.sprite.render();
                    };
                    Goal.prototype.onClearScene = function () {
                        Goal.instance = null;
                    };
                    Goal.instance = null;
                    return Goal;
                }(Platformer.BaseMachineEntity));
                Simple.Goal = Goal;
            })(Simple = Platformer.Simple || (Platformer.Simple = {}));
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
///<reference path = "BaseFlowPlayer.ts"/>
var Game;
(function (Game) {
    var Arcade;
    (function (Arcade) {
        var Platformer;
        (function (Platformer) {
            var Simple;
            (function (Simple) {
                var RunnerPlayer = /** @class */ (function (_super) {
                    __extends(RunnerPlayer, _super);
                    function RunnerPlayer(def) {
                        var _this = _super.call(this, def) || this;
                        _this.controls = new Game.Interaction.Controls.Platformer.BasicRunnerControls();
                        return _this;
                    }
                    Object.defineProperty(RunnerPlayer.prototype, "dirMove", {
                        get: function () {
                            return this.sprite.xMirror ? -1 : 1;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(RunnerPlayer.prototype, "jumpControlPressed", {
                        get: function () {
                            return this.controls.pressedDelayedAction;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(RunnerPlayer.prototype, "jumpControlDown", {
                        get: function () {
                            return this.controls.downAction;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    return RunnerPlayer;
                }(Simple.BaseFlowPlayer));
                Simple.RunnerPlayer = RunnerPlayer;
            })(Simple = Platformer.Simple || (Platformer.Simple = {}));
        })(Platformer = Arcade.Platformer || (Arcade.Platformer = {}));
    })(Arcade = Game.Arcade || (Game.Arcade = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Flow;
    (function (Flow) {
        Flow.LENGTH_STATE_CHANGE_CHAIN = 10;
        var StateLink = /** @class */ (function () {
            function StateLink(state, condition, priority) {
                this.priority = 0;
                this.state = state;
                this.condition = condition;
                this.priority = priority;
            }
            return StateLink;
        }());
        Flow.StateLink = StateLink;
        var State = /** @class */ (function () {
            function State(owner, name) {
                if (name === void 0) { name = ""; }
                this.name = "";
                this.recursive = false;
                this.links = new Array();
                this.owner = owner;
                this.name = name;
            }
            Object.defineProperty(State.prototype, "onEnter", {
                set: function (value) {
                    this._onEnter = value.bind(this.owner);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(State.prototype, "onReady", {
                set: function (value) {
                    this._onReady = value.bind(this.owner);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(State.prototype, "onMoveUpdate", {
                set: function (value) {
                    this._onMoveUpdate = value.bind(this.owner);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(State.prototype, "onOverlapUpdate", {
                set: function (value) {
                    this._onOverlapUpdate = value.bind(this.owner);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(State.prototype, "onStepUpdate", {
                set: function (value) {
                    this._onStepUpdate = value.bind(this.owner);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(State.prototype, "onTimeUpdate", {
                set: function (value) {
                    this._onTimeUpdate = value.bind(this.owner);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(State.prototype, "onExit", {
                set: function (value) {
                    this._onExit = value.bind(this.owner);
                },
                enumerable: false,
                configurable: true
            });
            State.prototype.addLink = function (other, condition, priority) {
                if (priority === void 0) { priority = -1; }
                this.links.push(new StateLink(other, condition.bind(this.owner), priority));
                if (priority != -1) {
                    this.links.sort(function (a, b) {
                        if (a.priority < 0 && b.priority < 0) {
                            return 0;
                        }
                        if (a.priority < 0) {
                            return -1;
                        }
                        if (b.priority < 0) {
                            return -1;
                        }
                        return a.priority - b.priority;
                    });
                }
            };
            State.prototype.checkLinks = function (that) {
                for (var _i = 0, _a = this.links; _i < _a.length; _i++) {
                    var link = _a[_i];
                    if (link.condition(that)) {
                        return link.state;
                    }
                }
                return null;
            };
            return State;
        }());
        Flow.State = State;
        var StateAccess = /** @class */ (function (_super) {
            __extends(StateAccess, _super);
            function StateAccess() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return StateAccess;
        }(State));
        var StateMachine = /** @class */ (function (_super) {
            __extends(StateMachine, _super);
            function StateMachine(owner) {
                var _this = _super.call(this) || this;
                _this.recursive = true;
                _this.stoppable = true;
                _this.owner = owner;
                _this._anyState = new State(owner);
                return _this;
            }
            Object.defineProperty(StateMachine.prototype, "anyState", {
                get: function () {
                    return this._anyState;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(StateMachine.prototype, "startState", {
                get: function () {
                    return this._startState;
                },
                set: function (value) {
                    this._startState = value;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(StateMachine.prototype, "oldState", {
                get: function () {
                    return this._oldState;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(StateMachine.prototype, "currentState", {
                get: function () {
                    return this._currentState;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(StateMachine.prototype, "nextState", {
                get: function () {
                    return this._nextState;
                },
                enumerable: false,
                configurable: true
            });
            /*
            triggerUserListener(type : number){
                if(this.currentState.onUserUpdate != null){
                    this.currentState.onUserUpdate(type, this.owner as any);
                }
            }
            */
            StateMachine.prototype.triggerListener = function (listener) {
                if (listener != null) {
                    listener(this.owner);
                }
            };
            StateMachine.prototype.onReset = function () {
                this._nextState = null;
                this._oldState = null;
                this._currentState = this._startState;
                this.triggerListener(this._anyState._onEnter);
                this.triggerListener(this._currentState._onEnter);
                this.triggerListener(this._anyState._onReady);
                this.triggerListener(this._currentState._onReady);
            };
            StateMachine.prototype.onMoveUpdate = function () {
                if (!this.stoppable || !Game.SceneFreezer.stoped) {
                    this.triggerListener(this._anyState._onMoveUpdate);
                    this.triggerListener(this._currentState._onMoveUpdate);
                }
            };
            StateMachine.prototype.onOverlapUpdate = function () {
                if (!this.stoppable || !Game.SceneFreezer.stoped) {
                    this.triggerListener(this._anyState._onOverlapUpdate);
                    this.triggerListener(this._currentState._onOverlapUpdate);
                }
            };
            StateMachine.prototype.onStepUpdate = function () {
                if (!this.stoppable || !Game.SceneFreezer.stoped) {
                    this.triggerListener(this._anyState._onStepUpdate);
                    this.triggerListener(this._currentState._onStepUpdate);
                    var nextState = null;
                    var countStateChanges = 0;
                    do {
                        nextState = this._currentState.checkLinks(this.owner);
                        if (nextState != null) {
                            this._nextState = nextState;
                            this.triggerListener(this._anyState._onExit);
                            this.triggerListener(this._currentState._onExit);
                            this._oldState = this._currentState;
                            this._currentState = nextState;
                            this._nextState = null;
                            this.triggerListener(this._anyState._onEnter);
                            this.triggerListener(this._currentState._onEnter);
                            countStateChanges += 1;
                        }
                    } while (nextState != null && (this.recursive || nextState.recursive) && countStateChanges < Flow.LENGTH_STATE_CHANGE_CHAIN);
                    if (countStateChanges > 0) {
                        this.triggerListener(this._anyState._onReady);
                        this.triggerListener(this._currentState._onReady);
                        if (countStateChanges >= Flow.LENGTH_STATE_CHANGE_CHAIN) {
                            console.warn("Warning: state change chain was broken because there was too much recursion. Please check your state links");
                        }
                    }
                }
            };
            StateMachine.prototype.onTimeUpdate = function () {
                if (!this.stoppable || !Game.SceneFreezer.stoped) {
                    this.triggerListener(this._anyState._onTimeUpdate);
                    this.triggerListener(this._currentState._onTimeUpdate);
                }
            };
            return StateMachine;
        }(Engine.Entity));
        Flow.StateMachine = StateMachine;
    })(Flow = Game.Flow || (Game.Flow = {}));
})(Game || (Game = {}));
///<reference path="../../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var Interaction;
    (function (Interaction) {
        var Controls;
        (function (Controls) {
            var Platformer;
            (function (Platformer) {
                var X_MARGIN_CONTROL = 10;
                var Y_MARGIN_CONTROLS = 5;
                var X_SIZE_CONTROL = 63 + X_MARGIN_CONTROL * 2;
                var Y_SIZE_CONTROL = 100;
                var X_OFFSET_CONTROL = 10;
                var BasicJumperControls = /** @class */ (function (_super) {
                    __extends(BasicJumperControls, _super);
                    function BasicJumperControls(frames, alpha) {
                        var _this = _super.call(this) || this;
                        _this.countStepsDelayAction = 0;
                        _this.stepsDelayAction = 5;
                        _this._frames = frames;
                        _this.alpha = alpha;
                        _this.createControlLeft();
                        _this.createControlRight();
                        _this.createcontrolAction();
                        _this.tryFixTouchControls();
                        return _this;
                    }
                    Object.defineProperty(BasicJumperControls.prototype, "frames", {
                        get: function () {
                            return this._frames;
                        },
                        set: function (value) {
                            this._frames = value;
                            if (Game.IS_TOUCH && this._frames != null) {
                                if (this.controlLeft.down) {
                                    this._frames[1].applyToSprite(this.spriteControlLeft);
                                }
                                else {
                                    this._frames[0].applyToSprite(this.spriteControlLeft);
                                }
                                if (this.controlRight.down) {
                                    this._frames[3].applyToSprite(this.spriteControlRight);
                                }
                                else {
                                    this._frames[2].applyToSprite(this.spriteControlRight);
                                }
                                if (this.controlAction.down) {
                                    this._frames[5].applyToSprite(this.spriteControlAction);
                                }
                                else {
                                    this._frames[4].applyToSprite(this.spriteControlAction);
                                }
                            }
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(BasicJumperControls.prototype, "downLeft", {
                        get: function () {
                            return this.controlLeft.down;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(BasicJumperControls.prototype, "downRight", {
                        get: function () {
                            return this.controlRight.down;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(BasicJumperControls.prototype, "pressedDelayedAction", {
                        get: function () {
                            return this.countStepsDelayAction > 0;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(BasicJumperControls.prototype, "pressedAction", {
                        get: function () {
                            return this.controlAction.pressed;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(BasicJumperControls.prototype, "downAction", {
                        get: function () {
                            return this.controlAction.down;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    BasicJumperControls.prototype.createControlLeft = function () {
                        var _this = this;
                        this.controlLeft = new Game.Control();
                        this.controlLeft.enabled = true;
                        this.controlLeft.freezeable = true;
                        this.controlLeft.listener = this;
                        this.controlLeft.useKeyboard = true;
                        this.controlLeft.newInteractionRequired = false;
                        this.controlLeft.useMouse = false;
                        this.controlLeft.mouseButtons = [0];
                        if (Game.IS_EDGE) {
                            this.controlLeft.keys = [Engine.Keyboard.LEFT, "left", "Left"];
                        }
                        else {
                            this.controlLeft.keys = [Engine.Keyboard.A, Engine.Keyboard.LEFT, "left", "Left"];
                        }
                        if (Game.IS_TOUCH) {
                            this.controlLeft.useTouch = true;
                            this.controlLeft.bounds = new Engine.Sprite();
                            this.controlLeft.bounds.enabled = true;
                            this.controlLeft.bounds.pinned = true;
                            this.controlLeft.bounds.xSize = X_SIZE_CONTROL;
                            this.controlLeft.bounds.ySize = Y_SIZE_CONTROL;
                            this.controlLeft.bounds.setRGBA(1, 0, 0, this.alpha);
                            this.spriteControlLeft = new Engine.Sprite();
                            this.spriteControlLeft.enabled = true;
                            this.spriteControlLeft.pinned = true;
                            if (this._frames != null)
                                this._frames[0].applyToSprite(this.spriteControlLeft);
                            if (!Game.OPTIMIZE_TRANSPARENCY) {
                                this.spriteControlLeft.setRGBA(1, 1, 1, this.alpha);
                            }
                            this.controlLeft.listener = this;
                            this.controlLeft.onPressedDelegate = function () {
                                if (_this._frames != null)
                                    _this._frames[1].applyToSprite(_this.spriteControlLeft);
                            };
                            this.controlLeft.onReleasedDelegate = function () {
                                if (_this._frames != null)
                                    _this._frames[0].applyToSprite(_this.spriteControlLeft);
                            };
                        }
                    };
                    BasicJumperControls.prototype.createControlRight = function () {
                        var _this = this;
                        this.controlRight = new Game.Control();
                        this.controlRight.enabled = true;
                        this.controlRight.freezeable = true;
                        this.controlRight.listener = this;
                        this.controlRight.useKeyboard = true;
                        this.controlRight.newInteractionRequired = false;
                        this.controlRight.useMouse = false;
                        this.controlRight.mouseButtons = [0];
                        if (Game.IS_EDGE) {
                            this.controlRight.keys = [Engine.Keyboard.RIGHT, "right", "Right"];
                        }
                        else {
                            this.controlRight.keys = [Engine.Keyboard.D, Engine.Keyboard.RIGHT, "right", "Right"];
                        }
                        if (Game.IS_TOUCH) {
                            this.controlRight.useTouch = true;
                            this.controlRight.bounds = new Engine.Sprite();
                            this.controlRight.bounds.enabled = true;
                            this.controlRight.bounds.pinned = true;
                            this.controlRight.bounds.xSize = X_SIZE_CONTROL;
                            this.controlRight.bounds.ySize = Y_SIZE_CONTROL;
                            this.controlRight.bounds.setRGBA(0, 1, 0, this.alpha);
                            this.spriteControlRight = new Engine.Sprite();
                            this.spriteControlRight.enabled = true;
                            this.spriteControlRight.pinned = true;
                            if (this._frames != null)
                                this._frames[2].applyToSprite(this.spriteControlRight);
                            if (!Game.OPTIMIZE_TRANSPARENCY) {
                                this.spriteControlRight.setRGBA(1, 1, 1, this.alpha);
                            }
                            this.controlRight.listener = this;
                            this.controlRight.onPressedDelegate = function () {
                                if (_this._frames != null)
                                    _this._frames[3].applyToSprite(_this.spriteControlRight);
                            };
                            this.controlRight.onReleasedDelegate = function () {
                                if (_this._frames != null)
                                    _this._frames[2].applyToSprite(_this.spriteControlRight);
                            };
                        }
                    };
                    BasicJumperControls.prototype.createcontrolAction = function () {
                        var _this = this;
                        this.controlAction = new Game.Control();
                        this.controlAction.enabled = true;
                        this.controlAction.freezeable = true;
                        this.controlAction.listener = this;
                        this.controlAction.useKeyboard = true;
                        this.controlAction.newInteractionRequired = true;
                        this.controlAction.useMouse = false;
                        this.controlAction.mouseButtons = [0];
                        if (Game.IS_EDGE) {
                            this.controlAction.keys = [Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "spacebar", "Space", "space", " "];
                        }
                        else {
                            this.controlAction.keys = [Engine.Keyboard.W, Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "spacebar", "Space", "space", " "];
                        }
                        if (Game.IS_TOUCH) {
                            this.controlAction.useTouch = true;
                            this.controlAction.bounds = new Engine.Sprite();
                            this.controlAction.bounds.enabled = true;
                            this.controlAction.bounds.pinned = true;
                            this.controlAction.bounds.xSize = X_SIZE_CONTROL;
                            this.controlAction.bounds.ySize = Y_SIZE_CONTROL;
                            this.controlAction.bounds.setRGBA(0, 0, 1, this.alpha);
                            this.spriteControlAction = new Engine.Sprite();
                            this.spriteControlAction.enabled = true;
                            this.spriteControlAction.pinned = true;
                            if (this._frames != null)
                                this._frames[4].applyToSprite(this.spriteControlAction);
                            if (!Game.OPTIMIZE_TRANSPARENCY) {
                                this.spriteControlAction.setRGBA(1, 1, 1, this.alpha);
                            }
                            this.controlAction.listener = this;
                            this.controlAction.onPressedDelegate = function () {
                                if (_this._frames != null)
                                    _this._frames[5].applyToSprite(_this.spriteControlAction);
                            };
                            this.controlAction.onReleasedDelegate = function () {
                                if (_this._frames != null)
                                    _this._frames[4].applyToSprite(_this.spriteControlAction);
                            };
                        }
                    };
                    BasicJumperControls.prototype.tryFixTouchControls = function () {
                        if (Game.IS_TOUCH) {
                            this.controlLeft.bounds.x = -Engine.Renderer.xSizeView * 0.5;
                            this.controlLeft.bounds.y = Engine.Renderer.ySizeView * 0.5 - this.controlLeft.bounds.ySize;
                            this.controlRight.bounds.x = this.controlLeft.bounds.x + this.controlLeft.bounds.xSize + X_OFFSET_CONTROL;
                            this.controlRight.bounds.y = Engine.Renderer.ySizeView * 0.5 - this.controlRight.bounds.ySize;
                            this.controlAction.bounds.x = Engine.Renderer.xSizeView * 0.5 - this.controlRight.bounds.xSize;
                            this.controlAction.bounds.y = Engine.Renderer.ySizeView * 0.5 - this.controlRight.bounds.ySize;
                            this.spriteControlLeft.x = this.controlLeft.bounds.x + X_MARGIN_CONTROL;
                            this.spriteControlLeft.y = Engine.Renderer.ySizeView * 0.5 - this.spriteControlLeft.ySize - Y_MARGIN_CONTROLS;
                            this.spriteControlRight.x = this.controlRight.bounds.x + X_MARGIN_CONTROL;
                            this.spriteControlRight.y = Engine.Renderer.ySizeView * 0.5 - this.spriteControlRight.ySize - Y_MARGIN_CONTROLS;
                            this.spriteControlAction.x = this.controlAction.bounds.x + this.controlAction.bounds.xSize - this.spriteControlAction.xSize - X_MARGIN_CONTROL;
                            this.spriteControlAction.y = Engine.Renderer.ySizeView * 0.5 - this.spriteControlAction.ySize - Y_MARGIN_CONTROLS;
                        }
                    };
                    BasicJumperControls.prototype.onReset = function () {
                        this.countStepsDelayAction = 0;
                    };
                    BasicJumperControls.prototype.onViewUpdate = function () {
                        this.tryFixTouchControls();
                    };
                    BasicJumperControls.prototype.onStepUpdate = function () {
                        if (!Game.SceneFreezer.stoped) {
                            this.countStepsDelayAction -= (this.countStepsDelayAction > 0 ? 1 : 0);
                            if (this.controlAction.pressed) {
                                this.countStepsDelayAction = this.stepsDelayAction;
                            }
                        }
                    };
                    BasicJumperControls.prototype.onDrawButtons = function () {
                        if (Game.IS_TOUCH) {
                            if (this._frames == null) {
                                this.controlLeft.bounds.render();
                                this.controlRight.bounds.render();
                                this.controlAction.bounds.render();
                            }
                            else {
                                this.spriteControlLeft.render();
                                this.spriteControlRight.render();
                                this.spriteControlAction.render();
                            }
                        }
                    };
                    return BasicJumperControls;
                }(Engine.Entity));
                Platformer.BasicJumperControls = BasicJumperControls;
            })(Platformer = Controls.Platformer || (Controls.Platformer = {}));
        })(Controls = Interaction.Controls || (Interaction.Controls = {}));
    })(Interaction = Game.Interaction || (Game.Interaction = {}));
})(Game || (Game = {}));
///<reference path="../../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var Interaction;
    (function (Interaction) {
        var Controls;
        (function (Controls) {
            var Platformer;
            (function (Platformer) {
                var BasicRunnerControls = /** @class */ (function (_super) {
                    __extends(BasicRunnerControls, _super);
                    function BasicRunnerControls() {
                        var _this = _super.call(this) || this;
                        _this.countStepsDelayAction = 0;
                        _this.stepsDelayAction = 5;
                        _this.controlAction = new Game.Control();
                        _this.controlAction.enabled = true;
                        _this.controlAction.freezeable = true;
                        _this.controlAction.listener = _this;
                        _this.controlAction.useKeyboard = true;
                        _this.controlAction.newInteractionRequired = true;
                        _this.controlAction.useMouse = false;
                        _this.controlAction.mouseButtons = [0];
                        if (Game.IS_EDGE) {
                            _this.controlAction.keys = [Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "spacebar", "Space", "space", " "];
                        }
                        else {
                            _this.controlAction.keys = [Engine.Keyboard.W, Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "spacebar", "Space", "space", " "];
                        }
                        _this.controlAction.useTouch = true;
                        return _this;
                    }
                    Object.defineProperty(BasicRunnerControls.prototype, "pressedDelayedAction", {
                        get: function () {
                            return this.countStepsDelayAction > 0;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(BasicRunnerControls.prototype, "pressedAction", {
                        get: function () {
                            return this.controlAction.pressed;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    Object.defineProperty(BasicRunnerControls.prototype, "downAction", {
                        get: function () {
                            return this.controlAction.down;
                        },
                        enumerable: false,
                        configurable: true
                    });
                    BasicRunnerControls.prototype.onReset = function () {
                        this.countStepsDelayAction = 0;
                    };
                    BasicRunnerControls.prototype.onStepUpdate = function () {
                        if (!Game.SceneFreezer.stoped) {
                            this.countStepsDelayAction -= (this.countStepsDelayAction > 0 ? 1 : 0);
                            if (this.controlAction.pressed) {
                                this.countStepsDelayAction = this.stepsDelayAction;
                            }
                        }
                    };
                    return BasicRunnerControls;
                }(Engine.Entity));
                Platformer.BasicRunnerControls = BasicRunnerControls;
            })(Platformer = Controls.Platformer || (Controls.Platformer = {}));
        })(Controls = Interaction.Controls || (Interaction.Controls = {}));
    })(Interaction = Game.Interaction || (Game.Interaction = {}));
})(Game || (Game = {}));
///<reference path="../../../Engine/Scene.ts"/>
///<reference path="../../Game.ts"/>
var Game;
(function (Game) {
    var Scene = /** @class */ (function (_super) {
        __extends(Scene, _super);
        function Scene() {
            var _this = _super.call(this) || this;
            _this.countStepsWait = 0;
            _this.stepsWait = 0;
            Scene.instance = _this;
            Game.SceneFreezer.init();
            Game.SceneFade.init();
            Game.SceneColors.init();
            Game.SceneColors.clearColor(0, 0, 0);
            Game.SceneOrientator.init();
            return _this;
        }
        Object.defineProperty(Scene, "nextSceneClass", {
            get: function () {
                return Scene.instance.nextSceneClass;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Scene, "waiting", {
            get: function () {
                return Scene.instance.waiting;
            },
            enumerable: false,
            configurable: true
        });
        Scene.prototype.onReset = function () {
            this.nextSceneClass = null;
            this.waiting = false;
            this.countStepsWait = 0;
        };
        Scene.prototype.onStepUpdate = function () {
            if (this.waiting) {
                this.countStepsWait += 1 * Utils.Fade.scale;
                if (this.countStepsWait >= this.stepsWait) {
                    if (this.nextSceneClass == "reset") {
                        Engine.System.requireReset();
                    }
                    else {
                        Engine.System.nextSceneClass = this.nextSceneClass;
                    }
                    this.onEndWaiting();
                }
            }
            else if (!this.waiting && this.nextSceneClass != null && Game.SceneFade.filled && (Game.LevelAdLoader.instance == null || !Game.LevelAdLoader.blocked)) {
                this.waiting = true;
                this.onStartWaiting();
            }
        };
        Scene.prototype.onStartWaiting = function () {
        };
        Scene.prototype.onEndWaiting = function () {
        };
        return Scene;
    }(Engine.Scene));
    Game.Scene = Scene;
})(Game || (Game = {}));
///<reference path="Scene.ts"/>
var Game;
(function (Game) {
    var FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
    var FLIPPED_VERTICALLY_FLAG = 0x40000000;
    var FLIPPED_DIAGONALLY_FLAG = 0x20000000;
    var SceneMap = /** @class */ (function (_super) {
        __extends(SceneMap, _super);
        //private defSky : any;
        function SceneMap() {
            var _this = _super.call(this) || this;
            _this.offsetTiles = 0;
            _this.xSizeMap = 0;
            _this.ySizeMap = 0;
            _this.xSizeTile = 0;
            _this.ySizeTile = 0;
            SceneMap.instance = _this;
            _this.boxesSolids = [];
            _this.boxesSticky = [];
            _this.noOneWaySolids = [];
            _this.newOneWaySolids = [];
            _this.boxesEnemies = [];
            _this.dataTiles = [];
            return _this;
            //console.error("REMEMBER TO OPTIMIZE THIS SHIT");
        }
        SceneMap.prototype.loadMap = function (pathTerrain, _pathSky) {
            if (_pathSky === void 0) { _pathSky = null; }
            this.loadDefTerrain(pathTerrain);
            this.loadDefSky(null);
            this.createMapBoxes(this.defMapSky);
            this.createMapBoxes(this.defMapTerrain);
            this.createEntities(this.defMapSky);
            this.createEntities(this.defMapTerrain);
            Game.Resources.textureMapBack.clear();
            this.buildTexture(this.defMapSky, true);
            this.buildTexture(this.defMapTerrain, true);
            Game.Resources.textureMapTerrain.clear();
            this.buildTexture(this.defMapSky, false);
            this.buildTexture(this.defMapTerrain, false);
            this.spriteTerrain = new Engine.Sprite();
            this.spriteTerrain.setFull(true, false, Game.Resources.textureMapTerrain, this.xSizeMap, this.ySizeMap, 0, 0, 1, 1, this.xSizeMap, this.ySizeMap);
            for (var _i = 0, _a = this.boxesSolids; _i < _a.length; _i++) {
                var box = _a[_i];
                this.noOneWaySolids.push(box);
            }
            for (var _b = 0, _c = this.newOneWaySolids; _b < _c.length; _b++) {
                var box = _c[_b];
                this.boxesSolids.push(box);
            }
            this.onViewUpdate();
        };
        SceneMap.prototype.onViewUpdate = function () {
            this.spritesBack = [];
            if (Engine.Renderer.xFitView) {
                this.onViewUpdateY();
            }
            else {
                this.onViewUpdateX();
            }
            var sprite = new Engine.Sprite();
            sprite.setFull(true, false, Game.Resources.textureMapBack, this.xSizeMap, this.ySizeMap, 0, 0, 1, 1, this.xSizeMap, this.ySizeMap);
            this.spritesBack.push(sprite);
        };
        SceneMap.prototype.onViewUpdateX = function () {
            var count = Engine.Renderer.xSizeView - this.xSizeMap;
            count /= 2.0;
            var lastSize = count + this.xSizeTile;
            count /= this.xSizeMap;
            count = Math.ceil(count);
            for (var i = 0; i < count; i++) {
                this.spritesBack.push(this.createSpriteBackX(i, 1, i == count - 1, lastSize));
                this.spritesBack.push(this.createSpriteBackX(i, -1, i == count - 1, lastSize));
            }
        };
        SceneMap.prototype.onViewUpdateY = function () {
            var count = Engine.Renderer.ySizeView - this.ySizeMap;
            count /= 2.0;
            var lastSize = count;
            count /= this.ySizeMap;
            count = Math.ceil(count);
            for (var i = 0; i < count; i++) {
                this.spritesBack.push(this.createSpriteBackY(i, 1, i == count - 1, lastSize));
                this.spritesBack.push(this.createSpriteBackY(i, -1, i == count - 1, lastSize));
            }
        };
        SceneMap.prototype.createSpriteBackX = function (index, dir, last, lastSize) {
            var sprite = new Engine.Sprite();
            if (last) {
                if (dir > 0) {
                    sprite.setFull(true, false, Game.Resources.textureMapBack, lastSize, this.ySizeMap, 0, 0, 1, 1, lastSize, this.ySizeMap);
                    sprite.x = this.xSizeMap * dir + this.xSizeMap * index * dir;
                }
                else {
                    sprite.setFull(true, false, Game.Resources.textureMapBack, lastSize, this.ySizeMap, 0, 0, 1 + (this.xSizeMap - lastSize), 1, lastSize, this.ySizeMap);
                    sprite.x = lastSize * dir + this.xSizeMap * index * dir;
                }
            }
            else {
                sprite.setFull(true, false, Game.Resources.textureMapBack, this.xSizeMap, this.ySizeMap, 0, 0, 1, 1, this.xSizeMap, this.ySizeMap);
                sprite.x = this.xSizeMap * dir + this.xSizeMap * index * dir;
            }
            return sprite;
        };
        SceneMap.prototype.createSpriteBackY = function (index, dir, last, lastSize) {
            var sprite = new Engine.Sprite();
            if (last) {
                if (dir > 0) {
                    sprite.setFull(true, false, Game.Resources.textureMapBack, this.xSizeMap, lastSize, 0, 0, 1, 1, this.xSizeMap, lastSize);
                    sprite.y = this.ySizeMap * dir + this.ySizeMap * index * dir;
                }
                else {
                    sprite.setFull(true, false, Game.Resources.textureMapBack, this.xSizeMap, lastSize, 0, 0, 1, 1 + (this.ySizeMap - lastSize), this.xSizeMap, lastSize);
                    sprite.y = lastSize * dir + this.ySizeMap * index * dir;
                }
            }
            else {
                sprite.setFull(true, false, Game.Resources.textureMapBack, this.xSizeMap, this.ySizeMap, 0, 0, 1, 1, this.xSizeMap, this.ySizeMap);
                sprite.y = this.ySizeMap * dir + this.ySizeMap * index * dir;
            }
            return sprite;
        };
        SceneMap.prototype.loadDefTerrain = function (pathMap) {
            //TODO: Suboptimal
            var tileset = JSON.parse(Engine.Assets.loadText(Game.Resources.PATH_TILESET));
            this.tiles = tileset.tiles;
            this.xSizeTile = tileset.tilewidth;
            this.ySizeTile = tileset.tileheight;
            this.tileColumns = tileset.columns;
            this.offsetTiles = tileset.margin;
            this.defMapTerrain = JSON.parse(Engine.Assets.loadText(pathMap));
            this.xCountTiles = this.defMapTerrain.width;
            this.yCountTiles = this.defMapTerrain.height;
            this.xSizeMap = this.defMapTerrain.width * this.xSizeTile;
            this.ySizeMap = this.defMapTerrain.height * this.ySizeTile;
            this.boxesSolids = new Array();
            this.boxesSticky = new Array();
            this.noOneWaySolids = new Array();
            this.newOneWaySolids = new Array();
        };
        SceneMap.prototype.loadDefSky = function (pathMap) {
            if (pathMap == null) {
                this.defMapSky = null;
                return;
            }
            var xUnitSky = Math.floor(this.xSizeMap / Engine.Renderer.xSizeView);
            var yUnitSky = Math.floor(this.ySizeMap / Engine.Renderer.ySizeView);
            //TODO: Suboptimal
            this.defMapSky = JSON.parse(Engine.Assets.loadText(pathMap + xUnitSky + "x" + yUnitSky + ".json"));
        };
        SceneMap.prototype.createMapBoxes = function (def) {
            if (def == null)
                return;
            for (var _i = 0, _a = def.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                if (layer.name.indexOf("Entities") < 0 && layer.name.indexOf("Repeat") < 0 && layer.name.indexOf("Ignore") < 0) {
                    var indexTile = 0;
                    var tileDefMatrix = [];
                    for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                            tileDefMatrix[xIndex + yIndex * this.xCountTiles] = false;
                            if (layer.data[indexTile] != 0) {
                                if (this.getTileType(layer.data[indexTile]) == "Terrain") {
                                    tileDefMatrix[xIndex + yIndex * this.xCountTiles] = true;
                                }
                            }
                            indexTile += 1;
                        }
                    }
                    for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                            if (tileDefMatrix[xIndex + yIndex * this.xCountTiles]) {
                                this.boxesSolids.push(this.generateBox(tileDefMatrix, xIndex, yIndex, this.xCountTiles, this.yCountTiles, this.xCountTiles));
                            }
                        }
                    }
                    var indexTile = 0;
                    var tileDefMatrix = [];
                    for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                            tileDefMatrix[xIndex + yIndex * this.xCountTiles] = false;
                            if (layer.data[indexTile] != 0) {
                                if (this.getTileType(layer.data[indexTile]) == "StickyTerrain") {
                                    tileDefMatrix[xIndex + yIndex * this.xCountTiles] = true;
                                }
                            }
                            indexTile += 1;
                        }
                    }
                    for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                            if (tileDefMatrix[xIndex + yIndex * this.xCountTiles]) {
                                var box = this.generateBox(tileDefMatrix, xIndex, yIndex, this.xCountTiles, this.yCountTiles, this.xCountTiles);
                                this.boxesSolids.push(box);
                                this.boxesSticky.push(box);
                            }
                        }
                    }
                    var indexTile = 0;
                    var tileDefMatrix = [];
                    for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                            tileDefMatrix[xIndex + yIndex * this.xCountTiles] = false;
                            if (layer.data[indexTile] != 0) {
                                if (this.getTileType(layer.data[indexTile]) == "OneWay") {
                                    tileDefMatrix[xIndex + yIndex * this.xCountTiles] = true;
                                }
                            }
                            indexTile += 1;
                        }
                    }
                    for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                            if (tileDefMatrix[xIndex + yIndex * this.xCountTiles]) {
                                this.newOneWaySolids.push(this.generateBox(tileDefMatrix, xIndex, yIndex, this.xCountTiles, this.yCountTiles, this.xCountTiles));
                            }
                        }
                    }
                }
            }
        };
        SceneMap.prototype.generateBox = function (tileDefMatrix, xStart, yStart, xMax, yMax, xSize) {
            for (var y = yStart; y < yMax; y += 1) {
                for (var x = xStart; x < xMax; x += 1) {
                    if (!tileDefMatrix[x + y * xSize]) {
                        xMax = x;
                        break;
                    }
                }
                if (y < yMax - 1 && !tileDefMatrix[xStart + (y + 1) * xSize]) {
                    yMax = y + 1;
                    break;
                }
            }
            for (var y = yStart; y < yMax; y += 1) {
                for (var x = xStart; x < xMax; x += 1) {
                    tileDefMatrix[x + y * xSize] = false;
                }
            }
            var box = new Engine.Box();
            box.enabled = true;
            box.renderable = true;
            box.layer = Engine.Box.LAYER_ALL;
            box.x = xStart * this.xSizeTile;
            box.y = yStart * this.ySizeTile;
            box.xSize = (xMax - xStart) * this.xSizeTile;
            box.ySize = (yMax - yStart) * this.ySizeTile;
            box.red = Math.random() * 1;
            box.green = Math.random() * 1;
            box.blue = Math.random() * 1;
            box.alpha = 0.9;
            return box;
        };
        SceneMap.prototype.createEntities = function (def) {
            if (def == null)
                return;
            this.boxesEnemies = Array();
            for (var _i = 0, _a = def.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                if (layer.name.indexOf("Entities") >= 0) {
                    var entities = layer.objects;
                    for (var _b = 0, entities_1 = entities; _b < entities_1.length; _b++) {
                        var instancedef = entities_1[_b];
                        var entitydef = this.getEntitydef(instancedef);
                        Game.Entity.create(entitydef);
                    }
                }
            }
            Game.Entity.createPlayer();
        };
        SceneMap.prototype.getEntitydef = function (instancedef) {
            var typedef = Game.findInJSON(this.tiles, function (typedef) {
                var gid = instancedef.gid & ~(FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG);
                return typedef.id == gid - 1;
            });
            var entitydef = {};
            entitydef.type = typedef;
            entitydef.instance = instancedef;
            entitydef.flip = {};
            entitydef.flip.x = (instancedef.gid & (instancedef.gid & FLIPPED_HORIZONTALLY_FLAG)) != 0;
            entitydef.flip.y = (instancedef.gid & (instancedef.gid & FLIPPED_VERTICALLY_FLAG)) != 0;
            return entitydef;
        };
        SceneMap.prototype.getTileType = function (id) {
            var typedef = Game.findInJSON(this.tiles, function (typedef) {
                return typedef.id == id - 1;
            });
            if (typedef != null) {
                return typedef.type;
            }
            return null;
        };
        SceneMap.prototype.onDrawSceneSky = function () {
            for (var _i = 0, _a = this.spritesBack; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.render();
            }
        };
        SceneMap.prototype.onDrawSceneMap = function () {
            //this.drawLayers(this.defMap);
            this.spriteTerrain.render();
            //SceneColors.instance.drawFill();
            for (var _i = 0, _a = this.boxesSolids; _i < _a.length; _i++) {
                var box = _a[_i];
                box.render();
            }
            for (var _b = 0, _c = this.boxesSticky; _b < _c.length; _b++) {
                var box = _c[_b];
                box.render();
            }
        };
        SceneMap.prototype.buildTexture = function (def, back) {
            if (def == null)
                return;
            var texture = back ? Game.Resources.textureMapBack : Game.Resources.textureMapTerrain;
            for (var _i = 0, _a = def.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                if (layer.name.indexOf("Entities") >= 0 || layer.name.indexOf("Ignore") >= 0)
                    continue;
                if (back && layer.name.indexOf("Repeat") < 0)
                    continue;
                if (!back && layer.name.indexOf("Repeat") >= 0)
                    continue;
                for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                    for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                        var indexTile = xIndex + yIndex * this.xCountTiles;
                        var data = layer.data[indexTile];
                        if (data == 0)
                            continue;
                        data--;
                        var yPixTil = Math.floor(data / Math.floor(Game.Resources.texture.assetData.xSize / (this.xSizeTile + this.offsetTiles)));
                        var xPixTil = data - (yPixTil * Math.floor(Game.Resources.texture.assetData.ySize / (this.xSizeTile + this.offsetTiles)));
                        var xPixPut = this.offsetTiles + xPixTil * (this.xSizeTile + this.offsetTiles);
                        var yPixPut = this.offsetTiles + yPixTil * (this.xSizeTile + this.offsetTiles);
                        for (var xPix = 0; xPix < this.xSizeTile; xPix += 1) {
                            for (var yPix = 0; yPix < this.ySizeTile; yPix += 1) {
                                var alpha = Game.Resources.texture.getAlpha(xPixPut + xPix, yPixPut + yPix);
                                if (alpha != 0) {
                                    var red = Game.Resources.texture.getRed(xPixPut + xPix, yPixPut + yPix);
                                    var green = Game.Resources.texture.getGreen(xPixPut + xPix, yPixPut + yPix);
                                    var blue = Game.Resources.texture.getBlue(xPixPut + xPix, yPixPut + yPix);
                                    var xmap = xIndex * this.xSizeTile + xPix + 1;
                                    var ymap = yIndex * this.xSizeTile + yPix + 1;
                                    texture.setRGBA(xmap, ymap, red, green, blue, alpha);
                                }
                            }
                        }
                    }
                }
            }
            for (var xPix = 0; xPix < this.xSizeMap + 1; xPix += 1) {
                var red = texture.getRed(xPix, 1);
                var green = texture.getGreen(xPix, 1);
                var blue = texture.getBlue(xPix, 1);
                var alpha = texture.getAlpha(xPix, 1);
                texture.setRGBA(xPix, 0, red, green, blue, alpha);
                red = texture.getRed(xPix, this.ySizeMap);
                green = texture.getGreen(xPix, this.ySizeMap);
                blue = texture.getBlue(xPix, this.ySizeMap);
                alpha = texture.getAlpha(xPix, this.ySizeMap);
                texture.setRGBA(xPix, this.ySizeMap + 1, red, green, blue, alpha);
            }
            for (var yPix = 0; yPix < this.ySizeMap + 1; yPix += 1) {
                var red = texture.getRed(1, yPix);
                var green = texture.getGreen(1, yPix);
                var blue = texture.getBlue(1, yPix);
                var alpha = texture.getAlpha(1, yPix);
                texture.setRGBA(0, yPix, red, green, blue, alpha);
                red = texture.getRed(this.xSizeMap, yPix);
                green = texture.getGreen(this.xSizeMap, yPix);
                blue = texture.getBlue(this.xSizeMap, yPix);
                alpha = texture.getAlpha(this.xSizeMap, yPix);
                texture.setRGBA(this.xSizeMap + 1, yPix, red, green, blue, alpha);
            }
            texture.renderAgain();
        };
        SceneMap.maxRepetitionsX = Infinity;
        SceneMap.maxRepetitionsY = Infinity;
        SceneMap.instance = null;
        return SceneMap;
    }(Game.Scene));
    Game.SceneMap = SceneMap;
})(Game || (Game = {}));
///<reference path="../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    var BaseBackScene = /** @class */ (function (_super) {
        __extends(BaseBackScene, _super);
        function BaseBackScene() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return BaseBackScene;
    }(Game.SceneMap));
    Game.BaseBackScene = BaseBackScene;
})(Game || (Game = {}));
///<reference path="../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    var FRAME_BUTTONS;
    var FRAME_DIALOG;
    Game.addAction("configure", function () {
        FRAME_BUTTONS = Game.FrameSelector.complex("credits menu buttons", Game.Resources.texture, 21, 771);
        FRAME_DIALOG = Game.FrameSelector.complex("credits menu dialog", Game.Resources.texture, 21, 842);
    });
    var Credits = /** @class */ (function (_super) {
        __extends(Credits, _super);
        function Credits() {
            var _this = _super.call(this) || this;
            new Game.MusicButton();
            new Game.SoundButton();
            new Game.Background();
            _this.spriteDialog = new Engine.Sprite();
            _this.spriteDialog.enabled = true;
            _this.spriteDialog.pinned = true;
            _this.spriteDialog.x = 0;
            _this.spriteDialog.y = -70 - 10 - 10 + 1;
            FRAME_DIALOG[0].applyToSprite(_this.spriteDialog);
            var devone = new Utils.Text();
            devone.font = Game.FontManager.a;
            devone.scale = 1;
            devone.enabled = true;
            devone.pinned = true;
            devone.str = "DESIGN AND CODING:";
            devone.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            devone.xAlignView = Utils.AnchorAlignment.MIDDLE;
            devone.yAlignBounds = Utils.AnchorAlignment.START;
            devone.yAlignView = Utils.AnchorAlignment.MIDDLE;
            devone.yAligned = _this.spriteDialog.y + 3 + 10;
            var devtwo = new Utils.Text();
            devtwo.font = Game.FontManager.a;
            devtwo.scale = 1;
            devtwo.enabled = true;
            devtwo.pinned = true;
            devtwo.str = "NOA";
            devtwo.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            devtwo.xAlignView = Utils.AnchorAlignment.MIDDLE;
            devtwo.yAlignBounds = Utils.AnchorAlignment.START;
            devtwo.yAlignView = Utils.AnchorAlignment.MIDDLE;
            devtwo.yAligned = devone.y + 12;
            var graone = new Utils.Text();
            graone.font = Game.FontManager.a;
            graone.scale = 1;
            graone.enabled = true;
            graone.pinned = true;
            graone.str = "GRAPHICS (UI AND ENVIRONMENT):";
            graone.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            graone.xAlignView = Utils.AnchorAlignment.MIDDLE;
            graone.yAlignBounds = Utils.AnchorAlignment.START;
            graone.yAlignView = Utils.AnchorAlignment.MIDDLE;
            graone.yAligned = devtwo.y + 16;
            var gratwo = new Utils.Text();
            gratwo.font = Game.FontManager.a;
            gratwo.scale = 1;
            gratwo.enabled = true;
            gratwo.pinned = true;
            gratwo.str = "RE4PERX6";
            gratwo.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            gratwo.xAlignView = Utils.AnchorAlignment.MIDDLE;
            gratwo.yAlignBounds = Utils.AnchorAlignment.START;
            gratwo.yAlignView = Utils.AnchorAlignment.MIDDLE;
            gratwo.yAligned = graone.y + 12;
            var grathr = new Utils.Text();
            grathr.font = Game.FontManager.a;
            grathr.scale = 1;
            grathr.enabled = true;
            grathr.pinned = true;
            grathr.str = "GRAPHICS (FONT, CONFIG BUTTONS AND CHARACTERS):";
            grathr.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            grathr.xAlignView = Utils.AnchorAlignment.MIDDLE;
            grathr.yAlignBounds = Utils.AnchorAlignment.START;
            grathr.yAlignView = Utils.AnchorAlignment.MIDDLE;
            grathr.yAligned = gratwo.y + 16;
            var grafou = new Utils.Text();
            grafou.font = Game.FontManager.a;
            grafou.scale = 1;
            grafou.enabled = true;
            grafou.pinned = true;
            grafou.str = "NOA";
            grafou.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            grafou.xAlignView = Utils.AnchorAlignment.MIDDLE;
            grafou.yAlignBounds = Utils.AnchorAlignment.START;
            grafou.yAlignView = Utils.AnchorAlignment.MIDDLE;
            grafou.yAligned = grathr.y + 12;
            var offsetLastCredits = -34;
            var posLastCredits = 10 - 2;
            var musone = new Utils.Text();
            musone.font = Game.FontManager.a;
            musone.scale = 1;
            musone.enabled = true;
            musone.pinned = true;
            musone.str = "MUSIC:";
            musone.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            musone.xAlignView = Utils.AnchorAlignment.MIDDLE;
            musone.yAlignBounds = Utils.AnchorAlignment.START;
            musone.yAlignView = Utils.AnchorAlignment.MIDDLE;
            musone.xAligned = -offsetLastCredits + posLastCredits;
            musone.yAligned = grafou.y + 16;
            var mustwo = new Utils.Text();
            mustwo.font = Game.FontManager.a;
            mustwo.scale = 1;
            mustwo.enabled = true;
            mustwo.pinned = true;
            mustwo.str = "KOMIKU";
            mustwo.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            mustwo.xAlignView = Utils.AnchorAlignment.MIDDLE;
            mustwo.yAlignBounds = Utils.AnchorAlignment.START;
            mustwo.yAlignView = Utils.AnchorAlignment.MIDDLE;
            mustwo.xAligned = -offsetLastCredits + posLastCredits;
            mustwo.yAligned = musone.y + 12;
            var thuone = new Utils.Text();
            thuone.font = Game.FontManager.a;
            thuone.scale = 1;
            thuone.enabled = true;
            thuone.pinned = true;
            thuone.str = "THUMBNAIL:";
            thuone.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thuone.xAlignView = Utils.AnchorAlignment.MIDDLE;
            thuone.yAlignBounds = Utils.AnchorAlignment.START;
            thuone.yAlignView = Utils.AnchorAlignment.MIDDLE;
            thuone.xAligned = offsetLastCredits + posLastCredits;
            thuone.yAligned = grafou.y + 16;
            var thutwo = new Utils.Text();
            thutwo.font = Game.FontManager.a;
            thutwo.scale = 1;
            thutwo.enabled = true;
            thutwo.pinned = true;
            thutwo.str = "DEUSBEHEMOTH";
            thutwo.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thutwo.xAlignView = Utils.AnchorAlignment.MIDDLE;
            thutwo.yAlignBounds = Utils.AnchorAlignment.START;
            thutwo.yAlignView = Utils.AnchorAlignment.MIDDLE;
            thutwo.xAligned = offsetLastCredits + posLastCredits;
            thutwo.yAligned = thuone.y + 12;
            _this.backButton = new Game.DialogButton(FRAME_BUTTONS[0], "BACK", 0, 100 - 10 + 4);
            _this.backButton.control.listener = _this;
            _this.backButton.control.useKeyboard = true;
            _this.backButton.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            _this.backButton.control.onPressedDelegate = _this.backPressed;
            _this.backButton.control.onReleasedDelegate = _this.backReleased;
            _this.loadMap(Game.Resources.PATH_MAP_NONE);
            //var x = Scene.xSizeLevel * 0.5;
            //var y = Scene.ySizeLevel * 0.5;
            //Engine.Renderer.camera(x, y);
            Game.SceneColors.enabledDown = false;
            Game.triggerActions("credits");
            return _this;
        }
        Credits.prototype.backPressed = function () {
            if (Game.Scene.nextSceneClass == null) {
                this.stepsWait = 0;
                this.nextSceneClass = Game.MainMenu;
            }
        };
        Credits.prototype.backReleased = function () {
            //    this.backButton.control.enabled = false;
        };
        Credits.prototype.onDrawDialogs = function () {
            this.spriteDialog.render();
        };
        return Credits;
    }(Game.SceneMap));
    Game.Credits = Credits;
})(Game || (Game = {}));
///<reference path="../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    Game.TEXT_DESKTOP_CONTINUE_EXIT = "ESC OR CLICK TO EXIT";
    var LastScene = /** @class */ (function (_super) {
        __extends(LastScene, _super);
        function LastScene() {
            var _this = _super.call(this) || this;
            LastScene.instance = _this;
            new Game.MusicButton();
            new Game.SoundButton();
            new Game.ExitButton();
            new Game.Background();
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.a;
            text0.scale = 2;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = "THANKS FOR PLAYING!";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.START;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAligned = -38 * 2 + 8 - 2 - 20 - 5;
            _this.text1 = new Game.TextButton();
            _this.text1.control.listener = _this;
            _this.text1.text.font = Game.FontManager.a;
            _this.text1.text.scale = 1;
            _this.text1.text.enabled = true;
            _this.text1.text.pinned = true;
            _this.text1.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text1.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text1.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text1.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text1.text.yAligned = -38 * 2;
            if (Game.Level.speedrun) {
                _this.text1.control.enabled = false;
                _this.text1.text.str = Game.LevelSaveManager.hasSpeedrunRecord ? "NEW RECORD! " + Game.SpeedrunTimer.getTextValue(Game.recordSpeedrun) : "YOUR TIME! " + Game.SpeedrunTimer.getTextValue(Game.Level.countStepsSpeedrun);
            }
            else {
                _this.text1.control.enabled = Game.HAS_LINKS_KEZARTS;
                _this.text1.control.url = Game.HAS_LINKS_KEZARTS ? Game.URL_KEZARTS : null;
                _this.text1.control.onSelectionStayDelegate = function () {
                    Engine.Renderer.useHandPointer = Game.HAS_LINKS_KEZARTS;
                };
                _this.text1.text.underlined = Game.HAS_LINKS_KEZARTS;
                _this.text1.text.str = Game.HAS_LINKS_KEZARTS ? "BY KEZARTS - KEZARTS.COM" : "BY KEZARTS";
            }
            var pepe = 40 + 5 + 2 + 0.5 + 50 - (Game.IS_TOUCH ? 30 + 20 : 30 - 10);
            _this.continueButton = new Game.TextButton();
            _this.continueButton.control.listener = _this;
            _this.continueButton.control.blockOthersSelection = true;
            _this.continueButton.control.bounds = null;
            _this.continueButton.control.enabled = !Game.IS_TOUCH;
            _this.continueButton.arrows.enabled = false;
            _this.continueButton.text.font = Game.FontManager.b;
            _this.continueButton.text.scale = 1;
            _this.continueButton.text.enabled = true;
            _this.continueButton.text.pinned = true;
            _this.continueButton.text.str = Game.IS_TOUCH ? "PRESS THE DOOR BUTTON" : Game.TEXT_DESKTOP_CONTINUE_EXIT;
            _this.continueButton.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.continueButton.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.continueButton.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.continueButton.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.continueButton.text.yAligned = pepe;
            //this.start.control.onPressedDelegate = this.startPressed;
            if (Game.IS_TOUCH) {
                var text4 = new Utils.Text();
                text4.font = Game.FontManager.b;
                text4.scale = 1;
                text4.enabled = true;
                text4.pinned = true;
                text4.str = Game.IS_TOUCH ? "TO CONTINUE" : Game.TEXT_DESKTOP_CONTINUE_EXIT;
                text4.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text4.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text4.yAlignBounds = Utils.AnchorAlignment.START;
                text4.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text4.yAligned = pepe + 10;
            }
            _this.loadMap(Game.Resources.PATH_MAP_LAST);
            //var x = Scene.xSizeLevel * 0.5;
            //var y = Scene.ySizeLevel * 0.5;
            //Engine.Renderer.camera(x, y);
            Game.SceneColors.enabledDown = false;
            Game.triggerActions("endscreen");
            new Game.LevelAdLoader();
            return _this;
        }
        LastScene.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
        };
        LastScene.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (Game.Scene.nextSceneClass == null && (Game.ExitButton.instance.control.pressed || this.continueButton.control.pressed)) {
                Game.triggerActions("exitlastlevel");
                this.nextSceneClass = Game.MainMenu;
                this.stepsWait = Game.STEPS_CHANGE_SCENE;
            }
        };
        LastScene.prototype.onClearScene = function () {
            LastScene.instance = null;
        };
        LastScene.instance = null;
        return LastScene;
    }(Game.SceneMap));
    Game.LastScene = LastScene;
})(Game || (Game = {}));
///<reference path="../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    var X_COUNT_BUTTONS = 3;
    var Y_COUNT_BUTTONS = 3;
    var X_SIZE_BUTTON = 0;
    var Y_SIZE_BUTTON = 0;
    var X_SPEARATION_BUTTONS = 8;
    var Y_SPEARATION_BUTTONS = 8;
    Game.LEVELS_PER_PAGE = 9;
    Game.LEVELS_PAGES = 3;
    Game.MAX_LEVELS = 27; //LEVELS_PER_PAGE * LEVELS_PAGES;
    var FRAME_BUTTON_NORMAL;
    var FRAME_BUTTON_CLEARED;
    var FRAME_BUTTON_NAVIGATION;
    Game.addAction("configure", function () {
        FRAME_BUTTON_NORMAL = Game.FrameSelector.complex("selection button normal", Game.Resources.texture, 21, 666 + 3);
        FRAME_BUTTON_CLEARED = Game.FrameSelector.complex("selection button cleared", Game.Resources.texture, 21, 700 + 3);
        FRAME_BUTTON_NAVIGATION = Game.FrameSelector.complex("selection button navigation", Game.Resources.texture, 21, 734 + 3);
    });
    var LevelSelection = /** @class */ (function (_super) {
        __extends(LevelSelection, _super);
        function LevelSelection() {
            var _this = _super.call(this) || this;
            _this.buttons = new Array();
            _this.xButtons = 0;
            _this.yButtons = -34 + 5 - 6.5;
            _this.yButtons2 = 5;
            LevelSelection.instance = _this;
            var pepe = 100 - 10 + 4 - 9;
            X_SIZE_BUTTON = FRAME_BUTTON_NORMAL[0].xSize;
            Y_SIZE_BUTTON = FRAME_BUTTON_NORMAL[0].ySize;
            _this.xButtons = -0.5 * (FRAME_BUTTON_NORMAL[0].xSize + X_SPEARATION_BUTTONS) * (X_COUNT_BUTTONS - 1);
            new Game.MusicButton();
            new Game.SoundButton();
            new Game.Background();
            _this.spriteDialogTitle = new Engine.Sprite();
            _this.spriteDialogTitle.enabled = true;
            _this.spriteDialogTitle.pinned = true;
            _this.spriteDialogTitle.x = 0;
            _this.spriteDialogTitle.y = -pepe;
            var selecttext = new Utils.Text();
            selecttext.font = Game.FontManager.a;
            selecttext.scale = 2;
            selecttext.enabled = true;
            selecttext.pinned = true;
            selecttext.str = "SELECT LEVEL";
            selecttext.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            selecttext.xAlignView = Utils.AnchorAlignment.MIDDLE;
            selecttext.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            selecttext.yAlignView = Utils.AnchorAlignment.MIDDLE;
            selecttext.xAligned = _this.spriteDialogTitle.x;
            selecttext.yAligned = _this.spriteDialogTitle.y;
            _this.createButtons();
            //new ColorDialog("purple", 0, -19 + 6, 60, 27);
            _this.backButton = new Game.DialogButton(FRAME_BUTTON_NAVIGATION[0], "BACK", 0, pepe);
            _this.backButton.control.listener = _this;
            _this.backButton.control.useKeyboard = true;
            _this.backButton.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            _this.backButton.control.onPressedDelegate = _this.backPressed;
            _this.backButton.control.onReleasedDelegate = _this.backReleased;
            _this.switchButton = new Game.DialogButton(FRAME_BUTTON_NAVIGATION[0], ">", _this.buttons[2].dialog.x, pepe);
            _this.switchButton.control.listener = _this;
            _this.switchButton.arrows.enabled = false;
            _this.switchButton.control.onSelectionStartDelegate = _this.switchEnter;
            _this.switchButton.control.onSelectionEndDelegate = _this.switchExit;
            _this.switchButton.control.onPressedDelegate = _this.switchPress;
            _this.switchButton2 = new Game.DialogButton(FRAME_BUTTON_NAVIGATION[0], "<", _this.buttons[0].dialog.x, pepe);
            _this.switchButton2.control.listener = _this;
            _this.switchButton2.arrows.enabled = false;
            _this.switchButton2.control.onSelectionStartDelegate = _this.switchEnter2;
            _this.switchButton2.control.onSelectionEndDelegate = _this.switchExit2;
            _this.switchButton2.control.onPressedDelegate = _this.switchPress2;
            _this.loadMap(Game.Resources.PATH_MAP_NONE);
            var x = _this.xSizeMap * 0.5;
            var y = _this.ySizeMap * 0.5;
            Engine.Renderer.camera(x, y);
            //this.fillBlue.enabled = true;
            _this.fixButtons();
            Game.triggerActions("levelselection");
            return _this;
        }
        LevelSelection.prototype.createButtons = function () {
            var count = 0;
            for (var yIndex = 0; yIndex < Y_COUNT_BUTTONS; yIndex += 1) {
                for (var xIndex = 0; xIndex < X_COUNT_BUTTONS; xIndex += 1) {
                    var x = this.xButtons + (X_SIZE_BUTTON + X_SPEARATION_BUTTONS) * xIndex;
                    var y = this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * yIndex;
                    this.buttons[count] = new Game.DialogButton(FRAME_BUTTON_NORMAL[0], "1", x, y);
                    this.buttons[count].owner = this;
                    this.buttons[count].control.listener = this.buttons[count];
                    this.buttons[count].control.onPressedDelegate = function () {
                        this.owner.setLevel(+this.text.str);
                    };
                    this.buttons[count].control.onReleasedDelegate = function () {
                        //    (this as any as DialogButton).control.enabled = false;
                    };
                    count += 1;
                }
            }
        };
        LevelSelection.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
        };
        LevelSelection.prototype.fixButtons = function () {
            var count = 1 + LevelSelection.indexPage * Game.LEVELS_PER_PAGE;
            for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
                var button = _a[_i];
                button.text.str = count + "";
                switch (Game.dataLevels[count]) {
                    case "locked":
                        //button.enabled = false;
                        //button.dialog.enabled = false;
                        button.control.enabled = false;
                        FRAME_BUTTON_NORMAL[0].applyToSprite(button.dialog);
                        button.dialog.setRGBA(1, 1, 1, 0.1);
                        break;
                    case "unlocked":
                        button.enabled = true;
                        button.control.enabled = true;
                        FRAME_BUTTON_NORMAL[0].applyToSprite(button.dialog);
                        button.dialog.setRGBA(1, 1, 1, 1);
                        break;
                    case "cleared":
                        button.enabled = true;
                        button.control.enabled = true;
                        FRAME_BUTTON_CLEARED[0].applyToSprite(button.dialog);
                        button.dialog.setRGBA(1, 1, 1, 1);
                        break;
                }
                count += 1;
            }
        };
        LevelSelection.unlockAllLevels = function () {
            for (var indexLevel = 1; indexLevel <= Game.MAX_LEVELS; indexLevel += 1) {
                if (Game.dataLevels[indexLevel] == "locked") {
                    Game.dataLevels[indexLevel] = "unlocked";
                    Engine.Data.save("level" + indexLevel, "unlocked", 60);
                }
            }
            if (LevelSelection.instance != null) {
                LevelSelection.instance.fixButtons();
            }
        };
        LevelSelection.prototype.setLevel = function (index) {
            if (this.nextSceneClass == null) {
                Game.Level.speedrun = false;
                Game.Level.nextIndex = index;
                this.stepsWait = Game.STEPS_CHANGE_SCENE;
                this.nextSceneClass = Game.Level;
                for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
                    var button = _a[_i];
                    if (button.text.str != index + "") {
                        button.control.enabled = false;
                    }
                }
                this.backButton.control.enabled = false;
                this.switchButton.control.enabled = false;
                this.switchButton2.control.enabled = false;
                Game.triggerActions("playlevelbutton");
                Game.triggerActions("play");
            }
        };
        LevelSelection.prototype.onStartWaiting = function () {
            _super.prototype.onStartWaiting.call(this);
        };
        LevelSelection.prototype.backPressed = function () {
            if (this.nextSceneClass == null) {
                this.stepsWait = 0;
                this.nextSceneClass = Game.MainMenu;
                for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
                    var button = _a[_i];
                    button.control.enabled = false;
                }
                this.switchButton.control.enabled = false;
                this.switchButton2.control.enabled = false;
            }
        };
        LevelSelection.prototype.backReleased = function () {
            //    this.backButton.control.enabled = false;
        };
        LevelSelection.prototype.switchEnter = function () {
            this.switchButton.text.str = ">>>";
        };
        LevelSelection.prototype.switchExit = function () {
            this.switchButton.text.str = ">";
        };
        LevelSelection.prototype.switchPress = function () {
            LevelSelection.indexPage += 1;
            if (LevelSelection.indexPage >= Game.LEVELS_PAGES) {
                LevelSelection.indexPage = 0;
            }
            this.fixButtons();
            this.switchButton.text.str = ">>>";
        };
        LevelSelection.prototype.switchEnter2 = function () {
            this.switchButton2.text.str = "<<<";
        };
        LevelSelection.prototype.switchExit2 = function () {
            this.switchButton2.text.str = "<";
        };
        LevelSelection.prototype.switchPress2 = function () {
            LevelSelection.indexPage -= 1;
            if (LevelSelection.indexPage < 0) {
                LevelSelection.indexPage = Game.LEVELS_PAGES - 1;
            }
            this.fixButtons();
            this.switchButton2.text.str = "<<<";
        };
        LevelSelection.prototype.onDrawDialogs = function () {
            //this.spriteDialogTitle.render();
        };
        LevelSelection.prototype.onClearScene = function () {
            LevelSelection.instance = null;
        };
        LevelSelection.instance = null;
        LevelSelection.indexPage = 0;
        return LevelSelection;
    }(Game.SceneMap));
    Game.LevelSelection = LevelSelection;
})(Game || (Game = {}));
function unlockAllLevels() {
    Game.LevelSelection.unlockAllLevels();
}
///<reference path="../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    Game.REMOVE_TITTLE_LINK = false;
    var FRAME_BUTTONS;
    Game.addAction("configure", function () {
        FRAME_BUTTONS = Game.FrameSelector.complex("main menu buttons", Game.Resources.texture, 21, 632 + 3);
    });
    var MainMenu = /** @class */ (function (_super) {
        __extends(MainMenu, _super);
        function MainMenu() {
            var _this = _super.call(this) || this;
            _this.spriteButtonMoreGames = null;
            new Game.Background();
            new Game.MainMenuObjects();
            Game.Resources.playBGM();
            new Game.MusicButton();
            new Game.SoundButton();
            Game.TryCreatePlaystoreButton();
            /*
            var txt2 = new Utils.Text();
            txt2.font = FontManager.a;
            txt2.scale = 1.0;
            txt2.enabled = true;
            txt2.pinned = true;
            txt2.str = "VER 2.0";
            txt2.xAlignBounds = Utils.AnchorAlignment.END;
            txt2.xAlignView = Utils.AnchorAlignment.END;
            txt2.yAlignBounds = Utils.AnchorAlignment.START;
            txt2.yAlignView = Utils.AnchorAlignment.START;
            txt2.xAligned = -6;
            txt2.yAligned = 6;
            */
            _this.start = new Game.TextButton();
            _this.start.control.listener = _this;
            _this.start.text.font = Game.FontManager.a;
            _this.start.text.scale = 1;
            _this.start.text.enabled = true;
            _this.start.text.pinned = true;
            _this.start.text.str = "START";
            _this.start.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.start.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.start.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.start.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.start.control.onPressedDelegate = _this.startPressed;
            _this.start.control.onReleasedDelegate = _this.startReleased;
            _this.speedrun = new Game.TextButton();
            _this.speedrun.control.listener = _this;
            _this.speedrun.text.font = Game.FontManager.a;
            _this.speedrun.text.scale = 1;
            _this.speedrun.text.enabled = true;
            _this.speedrun.text.pinned = true;
            _this.speedrun.text.str = "SPEEDRUN";
            _this.speedrun.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.speedrun.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.speedrun.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.speedrun.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.speedrun.control.onPressedDelegate = _this.speedrunPressed;
            _this.speedrun.control.onReleasedDelegate = _this.speedrunReleased;
            _this.credits = new Game.TextButton();
            _this.credits.control.listener = _this;
            _this.credits.text.font = Game.FontManager.a;
            _this.credits.text.scale = 1;
            _this.credits.text.enabled = true;
            _this.credits.text.pinned = true;
            _this.credits.text.str = "CREDITS";
            _this.credits.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.credits.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.credits.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.credits.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.credits.control.onPressedDelegate = _this.creditsPressed;
            _this.credits.control.onReleasedDelegate = _this.creditsReleased;
            if (Game.HAS_LINKS) {
                _this.moregames = new Game.TextButton();
                _this.moregames.control.listener = _this;
                _this.moregames.control.url = Game.URL_MORE_GAMES;
                _this.moregames.control.onSelectionStayDelegate = function () {
                    Engine.Renderer.useHandPointer = true;
                };
                _this.moregames.text.font = Game.FontManager.a;
                _this.moregames.text.scale = 1;
                _this.moregames.text.enabled = true;
                _this.moregames.text.pinned = true;
                _this.moregames.text.str = Game.TEXT_MORE_GAMES;
                _this.moregames.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                _this.moregames.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
                _this.moregames.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                _this.moregames.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
                //this.moregames.text.setUnderlineShadowColor(0, 0, 252 / 255, 1);
            }
            var ypos = 0;
            var yoff = 0;
            var xpos = 0;
            var xoff = 3;
            ypos = -19 + 15 - 5 + 12;
            yoff = 3;
            _this.spriteButtonStart = new Engine.Sprite();
            _this.spriteButtonStart.enabled = true;
            _this.spriteButtonStart.pinned = true;
            _this.spriteButtonStart.x = xpos - (FRAME_BUTTONS[0].xSize * 0.5 + xoff);
            _this.spriteButtonStart.y = ypos - (FRAME_BUTTONS[0].ySize * 0.5 + yoff);
            FRAME_BUTTONS[0].applyToSprite(_this.spriteButtonStart);
            _this.start.text.xAligned = _this.spriteButtonStart.x;
            _this.start.text.yAligned = _this.spriteButtonStart.y + 1;
            _this.start.control.bounds = _this.spriteButtonStart;
            _this.spriteButtonSpeedrun = new Engine.Sprite();
            _this.spriteButtonSpeedrun.enabled = true;
            _this.spriteButtonSpeedrun.pinned = true;
            _this.spriteButtonSpeedrun.x = xpos + (FRAME_BUTTONS[0].xSize * 0.5 + xoff);
            _this.spriteButtonSpeedrun.y = ypos - (FRAME_BUTTONS[0].ySize * 0.5 + yoff);
            FRAME_BUTTONS[0].applyToSprite(_this.spriteButtonSpeedrun);
            _this.speedrun.text.xAligned = _this.spriteButtonSpeedrun.x;
            _this.speedrun.text.yAligned = _this.spriteButtonSpeedrun.y + 1;
            _this.speedrun.control.bounds = _this.spriteButtonSpeedrun;
            _this.spriteButtonCredits = new Engine.Sprite();
            _this.spriteButtonCredits.enabled = true;
            _this.spriteButtonCredits.pinned = true;
            _this.spriteButtonCredits.x = xpos - (FRAME_BUTTONS[0].xSize * 0.5 + xoff);
            _this.spriteButtonCredits.y = ypos + (FRAME_BUTTONS[0].ySize * 0.5 + yoff);
            FRAME_BUTTONS[0].applyToSprite(_this.spriteButtonCredits);
            _this.credits.text.xAligned = _this.spriteButtonCredits.x;
            _this.credits.text.yAligned = _this.spriteButtonCredits.y + 1;
            _this.credits.control.bounds = _this.spriteButtonCredits;
            if (Game.HAS_LINKS) {
                _this.spriteButtonMoreGames = new Engine.Sprite();
                _this.spriteButtonMoreGames.enabled = true;
                _this.spriteButtonMoreGames.pinned = true;
                _this.spriteButtonMoreGames.x = xpos + (FRAME_BUTTONS[0].xSize * 0.5 + xoff);
                _this.spriteButtonMoreGames.y = ypos + (FRAME_BUTTONS[0].ySize * 0.5 + yoff);
                FRAME_BUTTONS[0].applyToSprite(_this.spriteButtonMoreGames);
                _this.moregames.text.xAligned = _this.spriteButtonMoreGames.x;
                _this.moregames.text.yAligned = _this.spriteButtonMoreGames.y + 1;
                _this.moregames.control.bounds = _this.spriteButtonMoreGames;
            }
            else {
                _this.spriteButtonCredits.x = 0;
                _this.credits.text.xAligned = _this.spriteButtonCredits.x;
            }
            _this.loadMap(Game.Resources.PATH_MAP_MAIN_MENU);
            /*if(dataLevels[30] == "cleared" || recordSpeedrun > 0){
                this.time = new Utils.Text;
                this.time.font = FontManager.a;
                this.time.scale = 1;
                this.time.enabled = true;
                this.time.pinned = true;
                this.time.str = "BEST: " + SpeedrunTimer.getTextValue(recordSpeedrun);
                this.time.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                this.time.xAlignView = Utils.AnchorAlignment.MIDDLE;
                this.time.yAlignBounds = Utils.AnchorAlignment.END;
                this.time.yAlignView = Utils.AnchorAlignment.MIDDLE;
                this.time.yAligned = 60 + ((IS_TOUCH && !HAS_LINKS) ? -3 : -6);
            }
            else{*/
            _this.kezarts = new Game.TextButton();
            _this.kezarts.control.listener = _this;
            _this.kezarts.control.enabled = Game.HAS_LINKS_KEZARTS && !Game.REMOVE_TITTLE_LINK;
            _this.kezarts.control.url = Game.HAS_LINKS_KEZARTS ? Game.URL_KEZARTS : null;
            _this.kezarts.control.onSelectionStayDelegate = function () {
                Engine.Renderer.useHandPointer = Game.HAS_LINKS_KEZARTS;
            };
            _this.kezarts.text.font = Game.FontManager.a;
            _this.kezarts.text.scale = 1;
            _this.kezarts.text.enabled = !Game.REMOVE_TITTLE_LINK;
            _this.kezarts.text.pinned = true;
            _this.kezarts.text.str = Game.HAS_LINKS_KEZARTS ? "KEZARTS.COM" : "BY KEZARTS";
            _this.kezarts.text.underlined = Game.HAS_LINKS_KEZARTS;
            _this.kezarts.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.yAlignBounds = Utils.AnchorAlignment.END;
            _this.kezarts.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.yAligned = 120 + (!Game.HAS_LINKS_KEZARTS ? -7 : -7);
            //this.kezarts.arrows.enabled = false;
            //}
            var x = _this.xSizeMap * 0.5;
            var y = _this.ySizeMap * 0.5;
            Engine.Renderer.camera(x, y - 16 * 0);
            //this.fillBlue.enabled = true;
            Game.triggerActions("mainmenu");
            return _this;
        }
        MainMenu.prototype.onStartWaiting = function () {
            _super.prototype.onStartWaiting.call(this);
            if (Game.LevelAds.tryTriggerSpeedrunAd()) {
                this.stepsWait = Game.STEPS_CHANGE_SCENE_AD;
            }
        };
        MainMenu.prototype.startPressed = function () {
            if (this.nextSceneClass == null) {
                this.speedrun.control.enabled = false;
                this.credits.control.enabled = false;
                if (Game.HAS_LINKS) {
                    this.moregames.control.enabled = false;
                }
                this.stepsWait = 0;
                this.nextSceneClass = Game.LevelSelection;
                Game.SceneFade.setColor(255, 255, 255);
                Game.triggerActions("playbutton");
            }
        };
        MainMenu.prototype.startReleased = function () {
            //    this.start.control.enabled = false;
        };
        MainMenu.prototype.speedrunPressed = function () {
            if (this.nextSceneClass == null) {
                this.start.control.enabled = false;
                this.speedrun.control.enabled = false;
                if (Game.HAS_LINKS) {
                    this.moregames.control.enabled = false;
                }
                this.stepsWait = 0;
                this.nextSceneClass = Game.SpeedrunMenu;
                Game.SceneFade.setColor(255, 255, 255);
                Game.triggerActions("playbutton");
            }
        };
        MainMenu.prototype.speedrunReleased = function () {
            //    this.speedrun.control.enabled = false;
        };
        MainMenu.prototype.creditsPressed = function () {
            if (this.nextSceneClass == null) {
                this.start.control.enabled = false;
                this.speedrun.control.enabled = false;
                if (Game.HAS_LINKS) {
                    this.moregames.control.enabled = false;
                }
                this.stepsWait = 0;
                this.nextSceneClass = Game.Credits;
                Game.SceneFade.setColor(255, 255, 255);
            }
        };
        MainMenu.prototype.creditsReleased = function () {
            //    this.credits.control.enabled = false;
        };
        MainMenu.prototype.onDrawDialogs = function () {
            this.spriteButtonStart.render();
            this.spriteButtonSpeedrun.render();
            this.spriteButtonCredits.render();
            if (this.spriteButtonMoreGames != null) {
                this.spriteButtonMoreGames.render();
            }
        };
        return MainMenu;
    }(Game.SceneMap));
    Game.MainMenu = MainMenu;
})(Game || (Game = {}));
///<reference path="../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    var X_SPEARATION_BUTTONS = 5;
    var OFFSET_SINGLE = 14;
    var OFFSET_DOUBLE = 20 - 2;
    var FRAME;
    var FRAME_BUTTONS;
    Game.addAction("preloader", function () {
        FRAME = Game.FrameSelector.complex("speedrun dialog", Game.Resources.texture, 104, 699);
        FRAME_BUTTONS = Game.FrameSelector.complex("speedrun buttons", Game.Resources.texture, 104, 808);
    });
    var SpeedrunMenu = /** @class */ (function (_super) {
        __extends(SpeedrunMenu, _super);
        function SpeedrunMenu() {
            var _this = _super.call(this) || this;
            _this.yButtons = 20;
            new Game.MusicButton();
            new Game.SoundButton();
            new Game.Background();
            _this.spriteDialog = new Engine.Sprite();
            _this.spriteDialog.enabled = true;
            _this.spriteDialog.pinned = true;
            _this.spriteDialog.y = -10;
            FRAME[0].applyToSprite(_this.spriteDialog);
            var recordA = new Utils.Text();
            recordA.font = Game.FontManager.a;
            recordA.scale = 1;
            recordA.enabled = true;
            recordA.pinned = true;
            recordA.str = "BEST TIME:";
            recordA.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            recordA.xAlignView = Utils.AnchorAlignment.MIDDLE;
            recordA.yAlignBounds = Utils.AnchorAlignment.START;
            recordA.yAlignView = Utils.AnchorAlignment.MIDDLE;
            recordA.xAligned = 0;
            recordA.yAligned = _this.spriteDialog.y - _this.spriteDialog.ySize * 0.5 + 5 + 2;
            var recordB = new Utils.Text();
            recordB.font = Game.FontManager.a;
            recordB.scale = 1;
            recordB.enabled = true;
            recordB.pinned = true;
            recordB.str = Game.SpeedrunTimer.getTextValue(Game.recordSpeedrun);
            recordB.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            recordB.xAlignView = Utils.AnchorAlignment.MIDDLE;
            recordB.yAlignBounds = Utils.AnchorAlignment.START;
            recordB.yAlignView = Utils.AnchorAlignment.MIDDLE;
            recordB.xAligned = 0;
            recordB.yAligned = recordA.y + OFFSET_SINGLE;
            var timeA = new Utils.Text();
            timeA.font = Game.FontManager.a;
            timeA.scale = 1;
            timeA.enabled = true;
            timeA.pinned = true;
            timeA.str = "CURRENT TIME:";
            timeA.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            timeA.xAlignView = Utils.AnchorAlignment.MIDDLE;
            timeA.yAlignBounds = Utils.AnchorAlignment.START;
            timeA.yAlignView = Utils.AnchorAlignment.MIDDLE;
            timeA.xAligned = 0;
            timeA.yAligned = recordB.y + OFFSET_DOUBLE;
            var timeB = new Utils.Text();
            timeB.font = Game.FontManager.a;
            timeB.scale = 1;
            timeB.enabled = true;
            timeB.pinned = true;
            timeB.str = Game.dataSpeedrun == 0 ? "0.000" : Game.SpeedrunTimer.getTextValue(Game.dataSpeedrun);
            timeB.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            timeB.xAlignView = Utils.AnchorAlignment.MIDDLE;
            timeB.yAlignBounds = Utils.AnchorAlignment.START;
            timeB.yAlignView = Utils.AnchorAlignment.MIDDLE;
            timeB.xAligned = 0;
            timeB.yAligned = timeA.y + OFFSET_SINGLE;
            var levelA = new Utils.Text();
            levelA.font = Game.FontManager.a;
            levelA.scale = 1;
            levelA.enabled = true;
            levelA.pinned = true;
            levelA.str = "CURRENT LEVEL:";
            levelA.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            levelA.xAlignView = Utils.AnchorAlignment.MIDDLE;
            levelA.yAlignBounds = Utils.AnchorAlignment.START;
            levelA.yAlignView = Utils.AnchorAlignment.MIDDLE;
            levelA.xAligned = 0;
            levelA.yAligned = timeB.y + OFFSET_DOUBLE;
            var levelB = new Utils.Text();
            levelB.font = Game.FontManager.a;
            levelB.scale = 1;
            levelB.enabled = true;
            levelB.pinned = true;
            levelB.str = Game.levelSpeedrun + "";
            levelB.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            levelB.xAlignView = Utils.AnchorAlignment.MIDDLE;
            levelB.yAlignBounds = Utils.AnchorAlignment.START;
            levelB.yAlignView = Utils.AnchorAlignment.MIDDLE;
            levelB.xAligned = 0;
            levelB.yAligned = levelA.y + OFFSET_SINGLE;
            _this.yButtons = 100 - 10 + 4 - 9 - 5;
            _this.newButton = new Game.DialogButton(FRAME_BUTTONS[0], "NEW RUN", -X_SPEARATION_BUTTONS - FRAME_BUTTONS[0].xSize, _this.yButtons);
            _this.newButton.control.listener = _this;
            _this.newButton.control.onPressedDelegate = _this.newPressed;
            _this.newButton.control.onReleasedDelegate = _this.newReleased;
            _this.continueButton = new Game.DialogButton(FRAME_BUTTONS[0], "CONTINUE", 0, _this.yButtons);
            _this.continueButton.dialog.setRGBA(1, 1, 1, Game.dataSpeedrun > 1 ? 1 : 0.1);
            _this.continueButton.control.enabled = Game.dataSpeedrun > 0;
            _this.continueButton.control.listener = _this;
            _this.continueButton.control.onPressedDelegate = _this.continuePressed;
            _this.continueButton.control.onReleasedDelegate = _this.continueReleased;
            _this.backButton = new Game.DialogButton(FRAME_BUTTONS[0], "BACK", X_SPEARATION_BUTTONS + FRAME_BUTTONS[0].xSize, _this.yButtons);
            _this.backButton.control.listener = _this;
            _this.backButton.control.useKeyboard = true;
            _this.backButton.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            _this.backButton.control.onPressedDelegate = _this.backPressed;
            _this.backButton.control.onReleasedDelegate = _this.backReleased;
            _this.loadMap(Game.Resources.PATH_MAP_NONE);
            //var x = Scene.xSizeLevel * 0.5;
            //var y = Scene.ySizeLevel * 0.5;
            //Engine.Renderer.camera(x, y);
            Game.SceneColors.enabledDown = false;
            Game.triggerActions("speedrunmenu");
            Game.triggerActions("levelselection");
            return _this;
        }
        SpeedrunMenu.prototype.startSpeedrun = function (isNew) {
            Game.Level.speedrun = true;
            Game.Level.countStepsSpeedrun = isNew ? 0 : Game.dataSpeedrun;
            Game.LevelSaveManager.hasSpeedrunRecord = false;
            Game.Level.nextIndex = isNew ? 1 : Game.levelSpeedrun;
            this.stepsWait = Game.STEPS_CHANGE_SCENE;
            this.nextSceneClass = Game.Level;
            Game.SceneFade.setColor(255, 255, 255);
            Game.triggerActions("playlevelbutton");
            Game.triggerActions("play");
        };
        SpeedrunMenu.prototype.newPressed = function () {
            if (Game.Scene.nextSceneClass == null) {
                this.startSpeedrun(true);
                this.continueButton.control.enabled = false;
                this.backButton.control.enabled = false;
            }
        };
        SpeedrunMenu.prototype.newReleased = function () {
            //    this.backButton.control.enabled = false;
        };
        SpeedrunMenu.prototype.continuePressed = function () {
            if (Game.Scene.nextSceneClass == null) {
                this.startSpeedrun(false);
                this.newButton.control.enabled = false;
                this.backButton.control.enabled = false;
            }
        };
        SpeedrunMenu.prototype.continueReleased = function () {
            //    this.backButton.control.enabled = false;
        };
        SpeedrunMenu.prototype.backPressed = function () {
            if (Game.Scene.nextSceneClass == null) {
                this.stepsWait = 0;
                this.nextSceneClass = Game.MainMenu;
                this.newButton.control.enabled = false;
                this.continueButton.control.enabled = false;
            }
        };
        SpeedrunMenu.prototype.backReleased = function () {
            //    this.backButton.control.enabled = false;
        };
        SpeedrunMenu.prototype.onDrawDialogs = function () {
            this.spriteDialog.render();
        };
        return SpeedrunMenu;
    }(Game.SceneMap));
    Game.SpeedrunMenu = SpeedrunMenu;
})(Game || (Game = {}));
/*
this.speedrunPressed;
speedrunPressed(){
            if(this.nextSceneClass == null){

                
            }
        }
        
        */ 
///<reference path="../../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    var Level = /** @class */ (function (_super) {
        __extends(Level, _super);
        function Level() {
            var _this = _super.call(this) || this;
            _this.exiting = false;
            Level.instance = _this;
            Level.index = Level.nextIndex;
            Level.nextIndex = Level.index + 1;
            Game.Resources.playBGM();
            new Game.MusicButton();
            new Game.SoundButton();
            if (Level.speedrun) {
                new Game.SpeedrunTimer();
            }
            else {
                new Game.PauseButton();
                new Game.ResetButton();
            }
            new Game.ExitButton();
            new Game.LevelText();
            new Game.Background();
            Game.LevelShake.init();
            Game.LevelPauseUI.init();
            Game.LevelAds.init();
            Game.LevelSaveManager.init();
            Game.triggerActions("level");
            _this.loadMap(Game.getlev(Level.index));
            //this.loadMap(getPathLevel(1));
            //this.loadMap(Resources.PATH_LEVEL_TEST);
            if (Level.index == 1) {
                new Game.MoveTutorial();
            }
            else if (Level.index == 2) {
                new Game.JumpTutorial();
            }
            else if (Level.index == 5) {
                new Game.StuckTutorial();
            }
            new Game.LevelAdLoader();
            return _this;
        }
        Level.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            //triggerActions("play");
        };
        Level.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (this.nextSceneClass == null && Game.Player.instance.hasWon) {
                if (Level.index == Game.MAX_LEVELS) {
                    this.stepsWait = Game.STEPS_CHANGE_SCENE;
                    this.nextSceneClass = Game.LastScene;
                    Game.triggerActions("winlastlevel");
                }
                else {
                    this.nextSceneClass = Level;
                    Game.triggerActions("playlevelbutton");
                    Game.triggerActions("winlevel");
                }
                Game.triggerActions("lose");
            }
            if (this.nextSceneClass == null && Game.Player.instance.hasLost) {
                this.nextSceneClass = "reset";
                this.stepsWait = 0;
                Game.triggerActions("loselevel");
                Game.triggerActions("lose");
            }
            if (Game.ResetButton.instance != null && Game.ResetButton.instance.control.pressed && Game.Scene.nextSceneClass != "reset" && !this.exiting) {
                this.nextSceneClass = "reset";
                this.stepsWait = 0;
                Game.triggerActions("resetlevelbutton");
                Game.triggerActions("resetlevel");
                Game.triggerActions("lose");
            }
            if (Game.ExitButton.instance.control.pressed && !this.exiting) {
                this.stepsWait = Game.STEPS_CHANGE_SCENE;
                if (Level.speedrun) {
                    this.nextSceneClass = Game.SpeedrunMenu;
                }
                else {
                    this.nextSceneClass = Game.LevelSelection;
                }
                this.stepsWait = Game.STEPS_CHANGE_SCENE;
                this.exiting = true;
                Game.triggerActions("exitlevel");
                Game.triggerActions("lose");
            }
        };
        Level.prototype.onTimeUpdateSceneBeforeDrawFixed = function () {
            //var x = this.xSizeMap * 0.5;
            //var y = this.ySizeMap * 0.5;
            var x = Game.Player.instance.xRender;
            if (this.xSizeMap - this.xSizeTile * 2 < Engine.Renderer.xSizeView) {
                x = this.xSizeMap * 0.5;
            }
            else if (x < Engine.Renderer.xSizeView * 0.5 + this.xSizeTile) {
                x = Engine.Renderer.xSizeView * 0.5 + this.xSizeTile;
            }
            else if (x > this.xSizeMap - Engine.Renderer.xSizeView * 0.5 - this.xSizeTile) {
                x = this.xSizeMap - Engine.Renderer.xSizeView * 0.5 - this.xSizeTile;
            }
            var y = Game.Player.instance.yRender;
            if (this.ySizeMap - this.ySizeTile * 2 < Engine.Renderer.ySizeView) {
                y = this.ySizeMap * 0.5;
            }
            else if (y < Engine.Renderer.ySizeView * 0.5 + this.ySizeTile) {
                y = Engine.Renderer.ySizeView * 0.5 + this.ySizeTile;
            }
            else if (y > this.ySizeMap - Engine.Renderer.ySizeView * 0.5 - this.ySizeTile) {
                y = this.ySizeMap - Engine.Renderer.ySizeView * 0.5 - this.ySizeTile;
            }
            Engine.Renderer.camera(x + Game.LevelShake.position, y);
        };
        Level.prototype.onDrawSceneMap = function () {
            _super.prototype.onDrawSceneMap.call(this);
            if (Engine.Box.debugRender) {
                for (var _i = 0, _a = this.boxesEnemies; _i < _a.length; _i++) {
                    var box = _a[_i];
                    if (box.data != null && box.data != undefined && box.data.spikeAngle != null && box.data.spikeAngle != undefined) {
                        box.render();
                    }
                }
            }
        };
        Level.prototype.onStartWaiting = function () {
            _super.prototype.onStartWaiting.call(this);
            Game.LevelAds.tryTriggerTimeAd();
        };
        Level.prototype.onClearScene = function () {
            Level.instance = null;
        };
        Level.nextIndex = 1;
        return Level;
    }(Game.SceneMap));
    Game.Level = Level;
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var TIME_AD_SPEEDRUN = 60000;
    var STEPS_AD_TIME_FIRST = 30 * 60;
    var STEPS_AD_TIME_REGULAR = 110 * 60;
    var LevelAds = /** @class */ (function (_super) {
        __extends(LevelAds, _super);
        function LevelAds() {
            return _super.call(this) || this;
        }
        LevelAds.init = function () {
            new LevelAds();
        };
        LevelAds.prototype.onStepUpdate = function () {
            if (!Game.Level.speedrun) {
                if (LevelAds.countStepsAdTime > 0) {
                    LevelAds.countStepsAdTime -= 1;
                }
            }
        };
        LevelAds.tryTriggerTimeAd = function () {
            if (!Game.Level.speedrun) {
                if (LevelAds.countStepsAdTime <= 0) {
                    if (LevelAds.listenerAdTime != null) {
                        LevelAds.listenerAdTime();
                    }
                    LevelAds.clearSpeedrunCounter();
                    LevelAds.countStepsAdTime = STEPS_AD_TIME_REGULAR;
                    return LevelAds.listenerAdTime != null;
                }
            }
            return false;
        };
        LevelAds.tryTriggerSpeedrunAd = function () {
            if (Game.Scene.nextSceneClass == Game.Level && Game.Level.speedrun) {
                if (LevelAds.dateSpeedrun == 0 || Date.now() - LevelAds.dateSpeedrun >= TIME_AD_SPEEDRUN) {
                    if (LevelAds.listenerAdSpeedrun != null) {
                        LevelAds.listenerAdSpeedrun();
                    }
                    LevelAds.clearTimeCounter();
                    LevelAds.dateSpeedrun = Date.now();
                    return LevelAds.listenerAdSpeedrun != null;
                }
            }
            return false;
        };
        LevelAds.clearTimeCounter = function () {
            LevelAds.countStepsAdTime = STEPS_AD_TIME_REGULAR;
        };
        LevelAds.clearSpeedrunCounter = function () {
            LevelAds.dateSpeedrun = Date.now();
        };
        LevelAds.listenerAdTime = null;
        LevelAds.listenerAdSpeedrun = null;
        LevelAds.countStepsAdTime = STEPS_AD_TIME_FIRST;
        LevelAds.dateSpeedrun = 0;
        return LevelAds;
    }(Engine.Entity));
    Game.LevelAds = LevelAds;
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var FILL_R = 0 / 255;
    var FILL_G = 0 / 255;
    var FILL_B = 0 / 255;
    var FILL_A = 0.7;
    var LevelPauseUI = /** @class */ (function (_super) {
        __extends(LevelPauseUI, _super);
        function LevelPauseUI() {
            var _this = _super.call(this) || this;
            _this.fill = new Engine.Sprite();
            _this.fill.enabled = true;
            _this.fill.pinned = true;
            _this.fill.setRGBA(FILL_R, FILL_G, FILL_B, FILL_A);
            _this.onViewUpdate();
            _this.text = new Utils.Text();
            _this.text.font = Game.FontManager.a;
            _this.text.scale = 1;
            _this.text.enabled = false;
            _this.text.pinned = true;
            _this.text.str = "PAUSED";
            _this.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAligned = 0;
            _this.text.yAligned = 0;
            return _this;
        }
        LevelPauseUI.init = function () {
            new LevelPauseUI();
        };
        LevelPauseUI.prototype.onViewUpdate = function () {
            this.fill.x = -Engine.Renderer.xSizeView * 0.5;
            this.fill.y = -Engine.Renderer.ySizeView * 0.5;
            this.fill.xSize = Engine.Renderer.xSizeView;
            this.fill.ySize = Engine.Renderer.ySizeView;
        };
        LevelPauseUI.prototype.onDrawPause = function () {
            if (Game.SceneFreezer.paused) {
                if (!this.text.enabled) {
                    this.text.enabled = true;
                }
                this.fill.render();
            }
            else {
                if (this.text.enabled) {
                    this.text.enabled = false;
                }
            }
        };
        return LevelPauseUI;
    }(Engine.Entity));
    Game.LevelPauseUI = LevelPauseUI;
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var LevelSaveManager = /** @class */ (function (_super) {
        __extends(LevelSaveManager, _super);
        function LevelSaveManager() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.winSaved = false;
            _this.exiting = false;
            return _this;
        }
        LevelSaveManager.init = function () {
            new LevelSaveManager();
        };
        LevelSaveManager.prototype.onReset = function () {
            this.winSaved = false;
        };
        LevelSaveManager.prototype.onStepUpdate = function () {
            if (!this.winSaved && Game.Player.instance.winning) {
                Game.dataLevels[Game.Level.index] = "cleared";
                Engine.Data.save("level" + (Game.Level.index), "cleared", 60);
                if (Game.dataLevels[Game.Level.nextIndex] == "locked") {
                    Engine.Data.save("level" + (Game.Level.nextIndex), "unlocked", 60);
                    Game.dataLevels[Game.Level.nextIndex] = "unlocked";
                }
                if (Game.Level.speedrun && Game.Level.nextIndex > Game.MAX_LEVELS && (Game.recordSpeedrun == 0 || Game.Level.countStepsSpeedrun < Game.recordSpeedrun)) {
                    LevelSaveManager.hasSpeedrunRecord = Game.recordSpeedrun > 0;
                    Game.recordSpeedrun = Game.Level.countStepsSpeedrun;
                    Engine.Data.save("speedrunrecord2.0", Game.recordSpeedrun, 60);
                    Game.levelSpeedrun = 1;
                    Engine.Data.save("speedrunlevel", 0, 60);
                    Game.dataSpeedrun = 0;
                    Engine.Data.save("speedrundata", 0, 60);
                }
                else if (Game.Level.speedrun && Game.Level.nextIndex > Game.MAX_LEVELS) {
                    LevelSaveManager.hasSpeedrunRecord = false;
                    Game.levelSpeedrun = 1;
                    Engine.Data.save("speedrunlevel", 0, 60);
                    Game.dataSpeedrun = 0;
                    Engine.Data.save("speedrundata", 0, 60);
                }
                else if (Game.Level.speedrun) {
                    Game.levelSpeedrun = Game.Level.nextIndex;
                    Engine.Data.save("speedrunlevel", Game.levelSpeedrun, 60);
                    Game.dataSpeedrun = Game.Level.countStepsSpeedrun;
                    Engine.Data.save("speedrundata", Game.dataSpeedrun, 60);
                }
                if (!Game.Level.speedrun && Game.Level.index < Game.MAX_LEVELS && Game.Level.index == Game.LEVELS_PER_PAGE * (Game.LevelSelection.indexPage + 1)) {
                    Game.LevelSelection.indexPage += 1;
                }
                this.winSaved = true;
                Game.triggerActions("savegame");
            }
            if (Game.Level.speedrun && !this.winSaved && !this.exiting && Game.ExitButton.instance.control.pressed) {
                Game.levelSpeedrun = Game.Level.index;
                Engine.Data.save("speedrunlevel", Game.levelSpeedrun, 60);
                Game.dataSpeedrun = Game.Level.countStepsSpeedrun;
                Engine.Data.save("speedrundata", Game.dataSpeedrun, 60);
                this.exiting = true;
            }
        };
        return LevelSaveManager;
    }(Engine.Entity));
    Game.LevelSaveManager = LevelSaveManager;
})(Game || (Game = {}));
var Utils;
(function (Utils) {
    var Shake = /** @class */ (function (_super) {
        __extends(Shake, _super);
        function Shake() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._triggered = false;
            return _this;
        }
        Object.defineProperty(Shake.prototype, "triggered", {
            get: function () {
                return this._triggered;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Shake.prototype, "inactive", {
            get: function () {
                return this.position == 0 && this.direction == 0;
            },
            enumerable: false,
            configurable: true
        });
        Shake.prototype.start = function (direction) {
            this.position = 0;
            this.countDistance = this.distance;
            this.direction = direction;
            this._triggered = true;
        };
        Shake.prototype.stop = function () {
            this.position = 0;
            this.direction = 0;
            this._triggered = false;
        };
        Shake.prototype.onReset = function () {
            this.position = 0;
            this.direction = 0;
            this._triggered = false;
        };
        Shake.prototype.onStepUpdate = function () {
            if (this.direction != 0 && !Game.SceneFreezer.stoped) {
                this.position += this.velocity * this.direction;
                var change = false;
                if ((this.direction > 0 && this.position > this.countDistance) || (this.direction < 0 && this.position < -this.countDistance)) {
                    change = true;
                }
                if (change) {
                    this.position = this.countDistance * this.direction;
                    this.direction *= -1;
                    this.countDistance *= this.reduction;
                    if (this.countDistance <= this.minDistance) {
                        this.position = 0;
                        this.direction = 0;
                    }
                }
            }
        };
        return Shake;
    }(Engine.Entity));
    Utils.Shake = Shake;
})(Utils || (Utils = {}));
///<reference path="../../Utils/Shake.ts"/>
var Game;
(function (Game) {
    var VELOCITY = 2;
    var DISTANCE = 2;
    var MIN_DISTANCE = 0.01;
    var REDUCTION = 0.8;
    var START_DIRECTION = 1;
    var LevelShake = /** @class */ (function (_super) {
        __extends(LevelShake, _super);
        function LevelShake() {
            var _this = _super.call(this) || this;
            _this.velocity = VELOCITY;
            _this.distance = DISTANCE;
            _this.minDistance = MIN_DISTANCE;
            _this.reduction = REDUCTION;
            return _this;
        }
        Object.defineProperty(LevelShake, "triggered", {
            get: function () {
                return LevelShake.instance.triggered;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelShake, "position", {
            get: function () {
                return LevelShake.instance.position;
            },
            enumerable: false,
            configurable: true
        });
        LevelShake.init = function () {
            LevelShake.instance = new LevelShake();
        };
        LevelShake.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (!this.triggered && Game.Player.instance.losing) {
                this.start(START_DIRECTION);
            }
        };
        LevelShake.prototype.onClearScene = function () {
            LevelShake.instance = null;
        };
        LevelShake.instance = null;
        return LevelShake;
    }(Utils.Shake));
    Game.LevelShake = LevelShake;
})(Game || (Game = {}));
///<reference path="../../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    var X_POS = 0;
    var Y_POS = -40 - 5;
    var X_POS_BARS = X_POS - 66 + 1;
    var Y_POS_BARS = Y_POS - 6;
    var X_POS_NUMBERS = X_POS + 50 - 8 - 8 - 8 - 8 - 4;
    var Y_POS_NUMBERS = Y_POS + 30 + 2 + 0.5;
    var X_POS_PRESS = X_POS;
    var Y_POS_PRESS = Y_POS + 60;
    var STEPS_BLINK_TEXT = 40;
    var STEPS_NEXT = 60;
    var canexi = false;
    var Preloader = /** @class */ (function (_super) {
        __extends(Preloader, _super);
        function Preloader() {
            var _this = _super.call(this) || this;
            _this.count = 0;
            _this.loadCount = 0;
            _this.blink = false;
            _this.countLoadingSize = 0;
            Preloader.current = _this;
            Game.SceneFade.speed = 0.0166666666666667 * 1;
            _this.control = new Game.Control();
            _this.control.enabled = true;
            _this.control.freezeable = true;
            _this.control.newInteractionRequired = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            _this.control.useTouch = true;
            Game.SceneColors.enabledDown = false;
            //SceneColors.clearColor(CLEAR_RED, CLEAR_GREEN, CLEAR_BLUE);
            _this.loadMap(Game.Resources.PATH_MAP_PRELOADER);
            var texture = new Engine.Texture(Game.PATH_TEXTURE_PRELOADER, true, false);
            var frameMainGraph = Game.FrameSelector.complex("preloader main frame", texture, 1, 1);
            _this.mainGraph = new Engine.Sprite();
            _this.mainGraph.enabled = true;
            _this.mainGraph.pinned = true;
            _this.mainGraph.x = X_POS;
            _this.mainGraph.y = Y_POS;
            frameMainGraph[0].applyToSprite(_this.mainGraph);
            _this.mainGraph.xSize *= 0.5;
            _this.mainGraph.ySize *= 0.5;
            _this.mainGraph.xOffset = -_this.mainGraph.xSize * 0.5;
            _this.mainGraph.yOffset = -_this.mainGraph.ySize * 0.5;
            _this.framesBars = Game.FrameSelector.complex("preloader bar frames", texture, 1, 197);
            _this.bars = [];
            for (var xIndex = 0; xIndex < 10; xIndex += 1) {
                var bar = new Engine.Sprite();
                bar.enabled = true;
                bar.pinned = true;
                bar.x = X_POS_BARS + xIndex * (_this.framesBars[0].xSize + 1) * 0.5;
                if (xIndex >= 5) {
                    bar.x += 0.5;
                    _this.framesBars[3].applyToSprite(bar);
                }
                else {
                    _this.framesBars[0].applyToSprite(bar);
                }
                bar.y = Y_POS_BARS;
                bar.xSize *= 0.5;
                bar.ySize *= 0.5;
                _this.bars.push(bar);
            }
            _this.framesNumbers = Game.FrameSelector.complex("preloader number frames", texture, 1, 267);
            _this.spriteNumbers = new Engine.Sprite();
            _this.spriteNumbers.enabled = true;
            _this.spriteNumbers.pinned = true;
            _this.spriteNumbers.x = X_POS_NUMBERS;
            _this.spriteNumbers.y = Y_POS_NUMBERS;
            _this.framesNumbers[0].applyToSprite(_this.spriteNumbers);
            _this.spriteNumbers.xScale *= 0.5;
            _this.spriteNumbers.yScale *= 0.5;
            var framesEmerald = Game.FrameSelector.complex("preloader emerald", Game.Resources.texture, 21, 226);
            _this.spriteEmerald = new Engine.Sprite();
            _this.spriteEmerald.enabled = true;
            _this.spriteEmerald.x = 16 * 9 + 8;
            _this.spriteEmerald.y = 16 * 15;
            _this.animatorEmerald = new Utils.Animator();
            _this.animatorEmerald.owner = _this;
            _this.animatorEmerald.listener = _this;
            _this.animatorEmerald.setAnimation(new Utils.Animation("stand", true, framesEmerald, 10, [4, 5, 6, 7], null));
            var framesAmber = Game.FrameSelector.complex("preloader amber", Game.Resources.texture, 21, 319);
            _this.spriteAmber = new Engine.Sprite();
            _this.spriteAmber.enabled = true;
            _this.spriteAmber.x = 16 * 12 + 8;
            _this.spriteAmber.y = 16 * 13;
            _this.spriteAmber.xMirror = true;
            _this.animatorAmber = new Utils.Animator();
            _this.animatorAmber.owner = _this;
            _this.animatorAmber.listener = _this;
            _this.animatorAmber.setAnimation(new Utils.Animation("stand", true, framesAmber, 10, [3, 4, 5, 4], null));
            _this.framesPress = Game.FrameSelector.complex("preloader press", texture, 185, 197);
            _this.spritePress = new Engine.Sprite();
            _this.spritePress.enabled = false;
            _this.spritePress.pinned = true;
            _this.spritePress.x = X_POS_PRESS;
            _this.spritePress.y = Y_POS_PRESS;
            _this.framesPress[0].applyToSprite(_this.spritePress);
            _this.spritePress.xScale = 0.5;
            _this.spritePress.yScale = 0.5;
            /*
            var txt2 = new Utils.Text();
            txt2.font = FontManager.a;
            txt2.scale = 1.0;
            txt2.enabled = true;
            txt2.pinned = true;
            txt2.str = "VER 2.0";
            txt2.xAlignBounds = Utils.AnchorAlignment.END;
            txt2.xAlignView = Utils.AnchorAlignment.END;
            txt2.yAlignBounds = Utils.AnchorAlignment.START;
            txt2.yAlignView = Utils.AnchorAlignment.START;
            txt2.xAligned = -6;
            txt2.yAligned = 6;
            */
            _this.initStates();
            Game.triggerActions("preloader");
            new Game.Background();
            return _this;
        }
        ;
        Preloader.prototype.initStates = function () {
            var _this = this;
            var loading = new Game.Flow.State(this);
            var click = new Game.Flow.State(this);
            var exit = new Game.Flow.State(this);
            var wait = new Game.Flow.State(this);
            var next = new Game.Flow.State(this);
            loading.onStepUpdate = function () {
                Game.triggerActions("onpreloading");
                _this.countLoadingSize += 1;
                if (_this.countLoadingSize > 60 * 2) {
                    Game.MAX += Math.random() * 0.1;
                    if (Game.MAX > 0.9) {
                        Game.MAX = 0.9;
                    }
                    _this.countLoadingSize = 0;
                }
                var max = Game.MAX;
                if (max < Engine.Assets.downloadedRatio) {
                    max = Engine.Assets.downloadedRatio;
                }
                max *= 100;
                _this.loadCount += Game.LOAD_VELOCITY;
                if (_this.loadCount > max) {
                    _this.loadCount = max;
                }
                for (var indexBar = 0; indexBar < 10; indexBar += 1) {
                    var bar = _this.bars[indexBar];
                    if (_this.loadCount >= (indexBar + 1) * 10 - 5) {
                        if (_this.loadCount >= (indexBar + 1) * 10) {
                            if (indexBar < 5) {
                                _this.framesBars[2].applyToSprite(bar);
                            }
                            else {
                                _this.framesBars[5].applyToSprite(bar);
                            }
                        }
                        else {
                            if (indexBar < 5) {
                                _this.framesBars[1].applyToSprite(bar);
                            }
                            else {
                                _this.framesBars[4].applyToSprite(bar);
                            }
                        }
                        bar.xSize *= 0.5;
                        bar.ySize *= 0.5;
                    }
                }
                var indexFrameNumber = Math.floor(_this.loadCount / 5);
                _this.framesNumbers[indexFrameNumber].applyToSprite(_this.spriteNumbers);
                _this.spriteNumbers.xScale = 0.5;
                _this.spriteNumbers.yScale = 0.5;
            };
            loading.addLink(exit, function () { return Game.DIRECT_PRELOADER && Engine.Assets.downloadComplete && _this.loadCount >= 100; });
            loading.addLink(click, function () { return Engine.Assets.downloadComplete && _this.loadCount >= 100; });
            click.onEnter = function () {
                _this.count = 0;
                _this.spritePress.enabled = true;
                Game.triggerActions("onpreloadcomplete");
                _this.control.url = "";
                _this.control.onLinkTrigger = function (touch) {
                    Game.triggerActions("presstocontinue");
                    Game.IS_TOUCH = Game.IS_TOUCH || Game.FORCE_TOUCH || touch;
                    Preloader.current.control.onLinkTrigger = function () { };
                    canexi = true;
                };
            };
            click.onStepUpdate = function () {
                _this.count += 1;
                if (_this.count == STEPS_BLINK_TEXT) {
                    _this.count = 0;
                    _this.blink = !_this.blink;
                    if (_this.blink) {
                        _this.framesNumbers[_this.framesNumbers.length - 1].applyToSprite(_this.spriteNumbers);
                        _this.framesPress[1].applyToSprite(_this.spritePress);
                        for (var _i = 0, _a = _this.bars; _i < _a.length; _i++) {
                            var bar = _a[_i];
                            bar.enabled = false;
                        }
                    }
                    else {
                        _this.framesNumbers[_this.framesNumbers.length - 2].applyToSprite(_this.spriteNumbers);
                        _this.framesPress[0].applyToSprite(_this.spritePress);
                        for (var _b = 0, _c = _this.bars; _b < _c.length; _b++) {
                            var bar = _c[_b];
                            bar.enabled = true;
                        }
                    }
                }
            };
            click.addLink(exit, function () { return canexi; });
            exit.onEnter = function () {
                if (Game.DIRECT_PRELOADER) {
                    //this.text.str = "LOAD COMPLETE!";
                    //this.text.xAligned = X_LOADING_COMPLETE;
                    //@ts-ignore
                    //Engine.AudioManager.verify();
                }
                Game.HAS_STARTED = true;
                Game.IS_TOUCH = Game.IS_TOUCH || Game.FORCE_TOUCH || _this.control.touchPressed;
                //HAS_LINKS = HAS_LINKS && !IS_TOUCH;
                _this.framesNumbers[_this.framesNumbers.length - 2].applyToSprite(_this.spriteNumbers);
                _this.framesPress[0].applyToSprite(_this.spritePress);
                for (var _i = 0, _a = _this.bars; _i < _a.length; _i++) {
                    var bar = _a[_i];
                    bar.enabled = true;
                }
                Game.SceneFade.trigger();
                Game.triggerActions("postinit");
            };
            exit.addLink(wait, function () { return Game.SceneFade.filled && Preloader.canFinish; });
            wait.onEnter = function () {
                _this.count = 0;
            };
            wait.onStepUpdate = function () {
                _this.count += 1;
            };
            wait.addLink(next, function () { return Game.startingSceneClass != Game.MainMenu || _this.count >= STEPS_NEXT; });
            next.onEnter = function () {
                //triggerActions("preloadchangecolor");
                Game.triggerActions("endpreloader");
                Engine.System.nextSceneClass = Game.PreloadEnd;
            };
            new Game.Flow.StateMachine(this).startState = loading;
        };
        Preloader.prototype.onSetFrame = function (animator, _animation, frame) {
            if (animator == this.animatorEmerald) {
                frame.applyToSprite(this.spriteEmerald);
            }
            else {
                frame.applyToSprite(this.spriteAmber);
            }
        };
        Preloader.prototype.onTimeUpdate = function () {
            Engine.Renderer.camera(this.xSizeMap * 0.5, this.ySizeMap * 0.5);
        };
        Preloader.prototype.onDrawDialogs = function () {
            this.mainGraph.render();
            for (var _i = 0, _a = this.bars; _i < _a.length; _i++) {
                var bar = _a[_i];
                bar.render();
            }
            this.spriteNumbers.render();
            this.spriteEmerald.render();
            this.spriteAmber.render();
            this.spritePress.render();
        };
        Preloader.canFinish = true;
        return Preloader;
    }(Game.SceneMap));
    Game.Preloader = Preloader;
})(Game || (Game = {}));
/*
///<reference path="../../System/Scene/SceneMap.ts"/>
namespace Game{
    var X_LOADING_START = -80 + 59 + 3.5;
    var X_LOADING_PRESS = -42 + 8.5;
    var X_LOADING_COMPLETE = -34;
    var Y_LOADING = -60 + 54;

    var STEPS_DOTS = 20;
    var STEPS_BLINK_TEXT = 40;
    var STEPS_NEXT = 60;

    export class Preloader extends SceneMap{
        protected text : Utils.Text;
        protected count = 0;
        protected bar : LoadingBar;
        protected control : Control;

        protected constructor(){
            super();
            SceneFade.speed = 0.0166666666666667 * 1;

            this.text = new Utils.Text();
            this.text.font = FontManager.a;
            this.text.scale = 1;
            this.text.enabled = true;
            this.text.pinned = true;
            this.text.str = "LOADING   ";
            this.text.xAlignBounds = Utils.AnchorAlignment.START;
            this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            this.text.yAlignBounds = Utils.AnchorAlignment.START;
            this.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            this.text.xAligned = X_LOADING_START;
            this.text.yAligned = Y_LOADING;
            this.text.front = false;

            this.control = new Control();
            this.control.enabled = true;
            this.control.freezeable = true;
            this.control.newInteractionRequired = true;
            this.control.useMouse = true;
            this.control.mouseButtons = [0];
            this.control.useTouch = true;

            this.bar = new LoadingBar(-60 + 61, 52, 5);
            this.bar.setColor(1, 1, 1, 1);
            this.bar.setShadowColor(0, 0, 0, 1);
            
            SceneColors.enabledDown = false;
            //SceneColors.clearColor(CLEAR_RED, CLEAR_GREEN, CLEAR_BLUE);

            this.loadMap(Resources.PATH_MAP_NONE);

            this.initStates();

            triggerActions("preloader");
        };

        protected initStates(){
            var loading = new Flow.State(this);
            var click = new Flow.State(this);
            var exit = new Flow.State(this);
            var wait = new Flow.State(this);
            var next = new Flow.State(this);

            loading.onStepUpdate = ()=>{
                this.count += 1;
                if(this.count == STEPS_DOTS){
                    this.count = 0;
                    if(this.text.str == "LOADING   "){
                        this.text.str = "LOADING.  "
                    }
                    else if(this.text.str == "LOADING.  "){
                        this.text.str = "LOADING.. "
                    }
                    else if(this.text.str == "LOADING.. "){
                        this.text.str = "LOADING..."
                    }
                    else if(this.text.str == "LOADING..."){
                        this.text.str = "LOADING   "
                    }
                }
            }
            loading.addLink(exit, () => DIRECT_PRELOADER && Engine.Assets.downloadComplete && this.bar.full);
            loading.addLink(click, () => Engine.Assets.downloadComplete && this.bar.full);

            click.onEnter = ()=>{
                this.count = 0;
                this.text.str = "PRESS TO CONTINUE";
                this.text.xAligned = X_LOADING_PRESS;
            }
            click.onStepUpdate = ()=>{
                this.count += 1;
                if(this.count == STEPS_BLINK_TEXT){
                    this.count = 0;
                    this.text.enabled = !this.text.enabled;
                }
            }
            click.addLink(exit, () => this.control.pressed);

            exit.onEnter = ()=>{
                if(DIRECT_PRELOADER){
                    this.text.str = "LOAD COMPLETE!";
                    this.text.xAligned = X_LOADING_COMPLETE;
                    //@ts-ignore
                    //Engine.AudioManager.verify();
                }
                HAS_STARTED = true;
                IS_TOUCH = FORCE_TOUCH || this.control.touchPressed;
                HAS_LINKS = HAS_LINKS && !IS_TOUCH;
                this.text.enabled = true;
                SceneFade.trigger();
                triggerActions("postinit");
            }
            exit.addLink(wait, () => SceneFade.filled);

            wait.onEnter = ()=>{
                this.count = 0;
            }
            wait.onStepUpdate = ()=>{
                this.count += 1;
            }
            wait.addLink(next, () => startingSceneClass != MainMenu || this.count >= STEPS_NEXT);

            next.onEnter = ()=>{
                //triggerActions("preloadchangecolor");
                Engine.System.nextSceneClass = PreloadEnd;
            }

            new Flow.StateMachine(this).startState = loading;
        }
    }
}
*/ 
///<reference path="../../../Engine/Scene.ts"/>
var Game;
(function (Game) {
    var PreloadStart = /** @class */ (function (_super) {
        __extends(PreloadStart, _super);
        function PreloadStart() {
            var _this = _super.call(this) || this;
            Game.forEachPath("preload", function (path) {
                Engine.Assets.queue(path);
            });
            Engine.Assets.download();
            return _this;
            //triggerActions("preloadchangecolor");
        }
        PreloadStart.prototype.onStepUpdate = function () {
            if (Engine.Assets.downloadComplete) {
                Engine.System.nextSceneClass = PreloadMiddle;
            }
        };
        return PreloadStart;
    }(Engine.Scene));
    Game.PreloadStart = PreloadStart;
    var PreloadMiddle = /** @class */ (function (_super) {
        __extends(PreloadMiddle, _super);
        function PreloadMiddle() {
            var _this = _super.call(this) || this;
            Game.triggerActions("preinit");
            Game.triggerActions("init");
            Game.forEachPath("load", function (path) {
                Engine.Assets.queue(path);
            });
            Engine.Assets.download();
            Engine.System.nextSceneClass = Game.SKIP_PRELOADER ? SimplePreloader : Game.Preloader;
            return _this;
        }
        return PreloadMiddle;
    }(Engine.Scene));
    Game.PreloadMiddle = PreloadMiddle;
    var SimplePreloader = /** @class */ (function (_super) {
        __extends(SimplePreloader, _super);
        function SimplePreloader() {
            var _this = _super.call(this) || this;
            Game.SceneFade.speed = 0.0166666666666667 * 1000;
            Game.SceneColors.clearColor(0, 0, 0);
            Game.triggerActions("preloader");
            Game.IS_TOUCH = Game.FORCE_TOUCH;
            Game.triggerActions("postinit");
            return _this;
        }
        ;
        SimplePreloader.prototype.onStepUpdate = function () {
            if (Engine.Assets.downloadComplete) {
                Engine.System.nextSceneClass = PreloadEnd;
            }
        };
        return SimplePreloader;
    }(Game.Scene));
    Game.SimplePreloader = SimplePreloader;
    var PreloadEnd = /** @class */ (function (_super) {
        __extends(PreloadEnd, _super);
        function PreloadEnd() {
            var _this = _super.call(this) || this;
            Game.triggerActions("preconfigure");
            Game.triggerActions("configure");
            Game.triggerActions("prepare");
            Game.triggerActions("start");
            Engine.System.nextSceneClass = Game.startingSceneClass;
            return _this;
            //triggerActions("preloadchangecolor");
        }
        return PreloadEnd;
    }(Engine.Scene));
    Game.PreloadEnd = PreloadEnd;
})(Game || (Game = {}));
Engine.System.nextSceneClass = Game.PreloadStart;
var Game;
(function (Game) {
    var Button = /** @class */ (function (_super) {
        __extends(Button, _super);
        function Button(bounds) {
            if (bounds === void 0) { bounds = new Engine.Sprite(); }
            var _this = _super.call(this) || this;
            _this.arrows = new Game.Arrows();
            _this.control = new Game.Control();
            _this.anchor = new Utils.Anchor();
            _this.control.bounds = bounds;
            _this.anchor.bounds = bounds;
            _this.control.enabled = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            _this.control.useTouch = true;
            _this.control.blockOthersSelection = true;
            _this.control.newInteractionRequired = true;
            _this.control.listener = _this;
            _this.arrows.control = _this.control;
            _this.arrows.bounds = _this.control.bounds;
            return _this;
            //this.control.audioSelected = Resources.sfxMouseOver;
            //this.control.audioPressed = Resources.sfxMouseClick;
        }
        Object.defineProperty(Button.prototype, "bounds", {
            get: function () {
                return this.control.bounds;
            },
            enumerable: false,
            configurable: true
        });
        Button.prototype.onDrawButtons = function () {
            this.control.bounds.render();
        };
        return Button;
    }(Engine.Entity));
    Game.Button = Button;
    var TextButton = /** @class */ (function (_super) {
        __extends(TextButton, _super);
        function TextButton() {
            var _this = _super.call(this) || this;
            _this.arrows = new Game.Arrows();
            _this.control = new Game.Control();
            _this.text = new Utils.Text();
            _this.control.bounds = _this.text.bounds;
            _this.control.enabled = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            _this.control.useTouch = true;
            _this.control.blockOthersSelection = true;
            _this.control.newInteractionRequired = true;
            _this.control.listener = _this;
            _this.arrows.control = _this.control;
            _this.arrows.bounds = _this.text.bounds;
            return _this;
            //this.control.audioSelected = Resources.sfxMouseOver;
            //this.control.audioPressed = Resources.sfxMouseClick;
        }
        return TextButton;
    }(Engine.Entity));
    Game.TextButton = TextButton;
    var DialogButton = /** @class */ (function (_super) {
        __extends(DialogButton, _super);
        function DialogButton(frame, str, x, y) {
            var _this = _super.call(this) || this;
            _this.arrows = new Game.Arrows();
            _this.control = new Game.Control();
            _this.text = new Utils.Text();
            _this.dialog = new Engine.Sprite();
            _this.dialog.enabled = true;
            _this.dialog.pinned = true;
            _this.dialog.x = x;
            _this.dialog.y = y;
            frame.applyToSprite(_this.dialog);
            _this.control.bounds = _this.dialog;
            _this.control.enabled = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            _this.control.useTouch = true;
            _this.control.blockOthersSelection = true;
            _this.control.newInteractionRequired = true;
            _this.control.listener = _this;
            _this.arrows.control = _this.control;
            _this.arrows.bounds = _this.text.bounds;
            _this.text.font = Game.FontManager.a;
            _this.text.scale = 1;
            _this.text.enabled = true;
            _this.text.pinned = true;
            _this.text.str = str;
            _this.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAligned = _this.dialog.x;
            _this.text.yAligned = _this.dialog.y + 1;
            return _this;
            //this.control.audioSelected = Resources.sfxMouseOver;
            //this.control.audioPressed = Resources.sfxMouseClick;
        }
        Object.defineProperty(DialogButton.prototype, "enabled", {
            set: function (value) {
                this.control.enabled = value;
                this.dialog.enabled = value;
                this.text.enabled = value;
            },
            enumerable: false,
            configurable: true
        });
        DialogButton.prototype.onDrawDialogs = function () {
            this.dialog.render();
        };
        return DialogButton;
    }(Engine.Entity));
    Game.DialogButton = DialogButton;
})(Game || (Game = {}));
///<reference path="../../../System/Button.ts"/>
var Game;
(function (Game) {
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("exit button", Game.Resources.texture, 21, 454);
    });
    var ExitButton = /** @class */ (function (_super) {
        __extends(ExitButton, _super);
        function ExitButton() {
            var _this = _super.call(this) || this;
            ExitButton.instance = _this;
            _this.bounds.enabled = true;
            _this.bounds.pinned = true;
            _this.fix();
            _this.anchor.xAlignBounds = Utils.AnchorAlignment.END;
            _this.anchor.xAlignView = Utils.AnchorAlignment.END;
            _this.anchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.yAlignView = Utils.AnchorAlignment.START;
            _this.anchor.xAligned = -Game.X_BUTTONS_LEFT;
            _this.anchor.yAligned = Game.Y_BUTTONS_TOP;
            _this.arrows.yOffset = Game.Y_ARROWS_GAME_BUTTONS;
            _this.control.useKeyboard = true;
            _this.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            _this.control.onPressedDelegate = _this.onPressed;
            return _this;
        }
        ExitButton.prototype.onPressed = function () {
            if (Game.Scene.nextSceneClass == null) {
                //Scene.switchPause();
                //this.fix(); 
            }
        };
        ExitButton.prototype.onStepUpdate = function () {
            /*
            if(Scene.nextSceneClass != null && Scene.nextSceneClass != Level && Scene.nextSceneClass != LastScene && Scene.nextSceneClass != "reset"){
                this.control.enabled = false;
                this.control.bounds.enabled = false;
            }
            else{
                this.control.enabled = true;
                this.control.bounds.enabled = true;
            }
            */
        };
        ExitButton.prototype.fix = function () {
            FRAMES[7 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
        };
        ExitButton.prototype.onClearScene = function () {
            ExitButton.instance = null;
        };
        return ExitButton;
    }(Game.Button));
    Game.ExitButton = ExitButton;
})(Game || (Game = {}));
///<reference path="../../../System/Button.ts"/>
var Game;
(function (Game) {
    Game.PLAYSTORE_BUTTON_POSITION = "bottom right";
    var SCALE = 0.060;
    var PlayStoreButton = /** @class */ (function (_super) {
        __extends(PlayStoreButton, _super);
        function PlayStoreButton() {
            var _this = _super.call(this) || this;
            _this.bounds.enabled = true;
            _this.bounds.pinned = true;
            _this.arrows.enabled = false;
            FRAMES[0].applyToSprite(_this.bounds);
            _this.bounds.xSize *= SCALE;
            _this.bounds.ySize *= SCALE;
            /*
            this.anchor.xAlignBounds = Utils.AnchorAlignment.START;
            this.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            this.anchor.yAlignBounds = Utils.AnchorAlignment.END;
            this.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            this.anchor.xAligned = 40 + (Engine.Renderer.xSizeView * 0.5 - 40) * 0.5 - this.bounds.xSize * 0.5;
            this.anchor.yAligned = 56;

            
            this.anchor.xAlignBounds = Utils.AnchorAlignment.START;
            this.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            this.anchor.yAlignBounds = Utils.AnchorAlignment.END;
            this.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            this.anchor.xAligned = 43;
            this.anchor.yAligned = 56;
            */
            switch (Game.PLAYSTORE_BUTTON_POSITION) {
                case "top right":
                    _this.anchor.xAlignBounds = Utils.AnchorAlignment.END;
                    _this.anchor.xAlignView = Utils.AnchorAlignment.END;
                    _this.anchor.yAlignBounds = Utils.AnchorAlignment.START;
                    _this.anchor.yAlignView = Utils.AnchorAlignment.START;
                    _this.anchor.xAligned = -3;
                    _this.anchor.yAligned = 2;
                    break;
                case "bottom left":
                    _this.anchor.xAlignBounds = Utils.AnchorAlignment.START;
                    _this.anchor.xAlignView = Utils.AnchorAlignment.START;
                    _this.anchor.yAlignBounds = Utils.AnchorAlignment.END;
                    _this.anchor.yAlignView = Utils.AnchorAlignment.END;
                    _this.anchor.xAligned = 3;
                    _this.anchor.yAligned = -4;
                    break;
                case "bottom right":
                    _this.anchor.xAlignBounds = Utils.AnchorAlignment.END;
                    _this.anchor.xAlignView = Utils.AnchorAlignment.END;
                    _this.anchor.yAlignBounds = Utils.AnchorAlignment.END;
                    _this.anchor.yAlignView = Utils.AnchorAlignment.END;
                    _this.anchor.xAligned = -3;
                    _this.anchor.yAligned = -4;
                    break;
                case "right":
                    _this.anchor.xAlignBounds = Utils.AnchorAlignment.END;
                    _this.anchor.xAlignView = Utils.AnchorAlignment.END;
                    _this.anchor.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                    _this.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
                    _this.anchor.xAligned = -3;
                    _this.anchor.yAligned = -0.5;
                    break;
            }
            _this.control.url = "https://play.google.com/store/apps/details?id=com.kezarts.miniblocks";
            _this.control.onSelectionStayDelegate = function () {
                Engine.Renderer.useHandPointer = true;
            };
            return _this;
        }
        PlayStoreButton.prototype.onViewUpdate = function () {
            //this.anchor.xAligned = 40 + (Engine.Renderer.xSizeView * 0.5 - 40) * 0.5 - this.bounds.xSize * 0.5;
        };
        return PlayStoreButton;
    }(Game.Button));
    Game.PlayStoreButton = PlayStoreButton;
    function TryCreatePlaystoreButton() {
        if (Game.HAS_LINKS && Game.HAS_GOOGLE_PLAY_LOGOS) {
            new PlayStoreButton();
        }
    }
    Game.TryCreatePlaystoreButton = TryCreatePlaystoreButton;
    var FRAMES;
    Game.addAction("prepare", function () {
        if (Game.HAS_LINKS && Game.HAS_GOOGLE_PLAY_LOGOS) {
            FRAMES = Game.FrameSelector.complex("google play", Game.Resources.textureGooglePlay, 37, 37);
        }
    });
})(Game || (Game = {}));
///<reference path="../../../System/Button.ts"/>
var Game;
(function (Game) {
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("music button", Game.Resources.texture, 21, 454);
    });
    var MusicButton = /** @class */ (function (_super) {
        __extends(MusicButton, _super);
        function MusicButton() {
            var _this = _super.call(this) || this;
            MusicButton.instance = _this;
            _this.bounds.enabled = true;
            _this.bounds.pinned = true;
            _this.fix();
            _this.anchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.xAlignView = Utils.AnchorAlignment.START;
            _this.anchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.yAlignView = Utils.AnchorAlignment.START;
            _this.anchor.xAligned = Game.X_BUTTONS_LEFT;
            _this.anchor.yAligned = Game.Y_BUTTONS_TOP;
            _this.arrows.yOffset = Game.Y_ARROWS_GAME_BUTTONS;
            _this.control.useKeyboard = true;
            _this.control.keys = [Engine.Keyboard.M];
            _this.control.onPressedDelegate = _this.onPressed;
            return _this;
        }
        MusicButton.prototype.onPressed = function () {
            Game.switchMusicMute();
            this.fix();
        };
        MusicButton.prototype.fix = function () {
            if (Game.MUSIC_MUTED) {
                FRAMES[1 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
            }
            else {
                FRAMES[0 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
            }
        };
        MusicButton.prototype.onClearScene = function () {
            MusicButton.instance = null;
        };
        return MusicButton;
    }(Game.Button));
    Game.MusicButton = MusicButton;
})(Game || (Game = {}));
///<reference path="../../../System/Button.ts"/>
var Game;
(function (Game) {
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("pause button", Game.Resources.texture, 21, 454);
    });
    var PauseButton = /** @class */ (function (_super) {
        __extends(PauseButton, _super);
        function PauseButton() {
            var _this = _super.call(this) || this;
            _this.pauseGraph = false;
            PauseButton.instance = _this;
            _this.pauseGraph = Game.SceneFreezer.paused;
            _this.bounds.enabled = true;
            _this.bounds.pinned = true;
            _this.fix();
            _this.anchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.xAlignView = Utils.AnchorAlignment.START;
            _this.anchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.yAlignView = Utils.AnchorAlignment.START;
            _this.anchor.xAligned = Game.X_BUTTONS_LEFT + Game.MusicButton.instance.bounds.xSize + Game.X_SEPARATION_BUTTONS_LEFT + Game.SoundButton.instance.bounds.xSize + Game.X_SEPARATION_BUTTONS_LEFT;
            _this.anchor.yAligned = Game.Y_BUTTONS_TOP;
            _this.arrows.yOffset = Game.Y_ARROWS_GAME_BUTTONS;
            _this.control.useKeyboard = true;
            _this.control.keys = [Engine.Keyboard.P];
            _this.control.onPressedDelegate = _this.onPressed;
            return _this;
        }
        PauseButton.prototype.onPressed = function () {
            Game.SceneFreezer.switchPause();
            this.pauseGraph = !this.pauseGraph;
            this.fix();
        };
        PauseButton.prototype.onStepUpdate = function () {
            /*
            if(Scene.nextSceneClass != null && Scene.nextSceneClass != Level && Scene.nextSceneClass != LastScene && Scene.nextSceneClass != "reset"){
                this.control.enabled = false;
                this.control.bounds.enabled = false;
            }
            else{
                this.control.enabled = true;
                this.control.bounds.enabled = true;
            }
            */
            //console.log(this.control.selected);
        };
        PauseButton.prototype.fix = function () {
            if (this.pauseGraph) {
                FRAMES[5 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
            }
            else {
                FRAMES[4 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
            }
        };
        PauseButton.prototype.onClearScene = function () {
            PauseButton.instance = null;
        };
        return PauseButton;
    }(Game.Button));
    Game.PauseButton = PauseButton;
})(Game || (Game = {}));
///<reference path="../../../System/Button.ts"/>
var Game;
(function (Game) {
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("reset button", Game.Resources.texture, 21, 454);
    });
    var ResetButton = /** @class */ (function (_super) {
        __extends(ResetButton, _super);
        function ResetButton() {
            var _this = _super.call(this) || this;
            ResetButton.instance = _this;
            _this.bounds.enabled = true;
            _this.bounds.pinned = true;
            _this.fix();
            _this.anchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.xAlignView = Utils.AnchorAlignment.START;
            _this.anchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.yAlignView = Utils.AnchorAlignment.START;
            _this.anchor.xAligned = Game.X_BUTTONS_LEFT + Game.MusicButton.instance.bounds.xSize + Game.X_SEPARATION_BUTTONS_LEFT + Game.SoundButton.instance.bounds.xSize + Game.X_SEPARATION_BUTTONS_LEFT + Game.PauseButton.instance.bounds.xSize + Game.X_SEPARATION_BUTTONS_LEFT;
            _this.anchor.yAligned = Game.Y_BUTTONS_TOP;
            _this.arrows.yOffset = Game.Y_ARROWS_GAME_BUTTONS;
            _this.control.useKeyboard = true;
            _this.control.keys = [Engine.Keyboard.R];
            return _this;
            //this.control.onPressedDelegate = this.onPressed;
        }
        ResetButton.prototype.onStepUpdate = function () {
            /*
            if(Scene.nextSceneClass != null && Scene.nextSceneClass != Level && Scene.nextSceneClass != LastScene){
                this.control.enabled = false;
                this.control.bounds.enabled = false;
            }
            else{
                this.control.enabled = true;
                this.control.bounds.enabled = true;
            }
            */
        };
        ResetButton.prototype.fix = function () {
            FRAMES[6 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
        };
        ResetButton.prototype.onClearScene = function () {
            ResetButton.instance = null;
        };
        return ResetButton;
    }(Game.Button));
    Game.ResetButton = ResetButton;
})(Game || (Game = {}));
///<reference path="../../../System/Button.ts"/>
var Game;
(function (Game) {
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("sound button", Game.Resources.texture, 21, 454);
    });
    var SoundButton = /** @class */ (function (_super) {
        __extends(SoundButton, _super);
        function SoundButton() {
            var _this = _super.call(this) || this;
            SoundButton.instance = _this;
            _this.bounds.enabled = true;
            _this.bounds.pinned = true;
            _this.fix();
            _this.anchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.xAlignView = Utils.AnchorAlignment.START;
            _this.anchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchor.yAlignView = Utils.AnchorAlignment.START;
            _this.anchor.xAligned = Game.X_BUTTONS_LEFT + Game.MusicButton.instance.bounds.xSize + Game.X_SEPARATION_BUTTONS_LEFT;
            _this.anchor.yAligned = Game.Y_BUTTONS_TOP;
            _this.arrows.yOffset = Game.Y_ARROWS_GAME_BUTTONS;
            _this.control.useKeyboard = true;
            _this.control.keys = [Engine.Keyboard.N];
            _this.control.onPressedDelegate = _this.onPressed;
            return _this;
        }
        SoundButton.prototype.onPressed = function () {
            Game.switchSoundMute();
            this.fix();
        };
        SoundButton.prototype.fix = function () {
            if (Game.SOUND_MUTED) {
                FRAMES[3 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
            }
            else {
                FRAMES[2 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
            }
        };
        SoundButton.prototype.onClearScene = function () {
            SoundButton.instance = null;
        };
        return SoundButton;
    }(Game.Button));
    Game.SoundButton = SoundButton;
})(Game || (Game = {}));
var Game;
(function (Game) {
    Game.SPEEDRUN_TEXT_OFFSET = 37;
    var LevelText = /** @class */ (function (_super) {
        __extends(LevelText, _super);
        function LevelText() {
            var _this = _super.call(this) || this;
            _this.text0 = new Utils.Text();
            _this.text0.font = Game.FontManager.a;
            _this.text0.scale = 1;
            _this.text0.enabled = true;
            _this.text0.pinned = true;
            _this.text0.str = "LEVEL " + (Game.Level.index < 10 ? "0" : "") + Game.Level.index;
            _this.text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text0.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text0.yAlignView = Utils.AnchorAlignment.START;
            _this.text0.xAligned = 0;
            _this.text0.yAligned = Game.Y_ARROWS_GAME_BUTTONS + 1 + 5;
            if (Game.IS_TOUCH) {
                //this.text0.enabled = false;
            }
            _this.fix();
            return _this;
        }
        LevelText.prototype.fix = function () {
            if (Game.Level.speedrun) {
                this.text0.xAligned = -Game.SPEEDRUN_TEXT_OFFSET;
            }
            else {
                if (Engine.Renderer.xSizeView >= 400) {
                    this.text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
                    this.text0.xAligned = 0;
                }
                else {
                    this.text0.xAlignView = Utils.AnchorAlignment.START;
                    this.text0.xAligned = 134 + (Engine.Renderer.xSizeView - 43 - 134) * 0.5;
                }
            }
        };
        LevelText.prototype.onViewUpdate = function () {
            this.fix();
        };
        return LevelText;
    }(Engine.Entity));
    Game.LevelText = LevelText;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var SpeedrunTimer = /** @class */ (function (_super) {
        __extends(SpeedrunTimer, _super);
        function SpeedrunTimer() {
            var _this = _super.call(this) || this;
            _this.text = new Utils.Text();
            _this.text.font = Game.FontManager.a;
            _this.text.scale = 1;
            _this.text.enabled = true;
            _this.text.pinned = true;
            _this.text.str = Game.Level.countStepsSpeedrun == 0 ? "0.000" : SpeedrunTimer.getTextValue(Game.Level.countStepsSpeedrun);
            _this.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text.yAlignView = Utils.AnchorAlignment.START;
            _this.text.xAligned = Game.SPEEDRUN_TEXT_OFFSET;
            _this.text.yAligned = Game.Y_ARROWS_GAME_BUTTONS + 1 + 5;
            return _this;
        }
        SpeedrunTimer.getTextValue = function (stepsTime) {
            var text = "9999.999";
            if (stepsTime > 0) {
                var seconds = new Int32Array([stepsTime / 60]);
                if (seconds[0] <= 9999) {
                    var milliseconds = new Int32Array([(stepsTime - seconds[0] * 60) * 1000.0 * (1.0 / 60.0)]);
                    text = seconds[0] + ".";
                    if (milliseconds[0] < 10) {
                        text += "00" + milliseconds[0];
                    }
                    else if (milliseconds[0] < 100) {
                        text += "0" + milliseconds[0];
                    }
                    else {
                        text += milliseconds[0];
                    }
                }
            }
            return text;
        };
        SpeedrunTimer.getValue = function (stepsTime) {
            var value = 9999999;
            if (stepsTime > 0) {
                var seconds = new Int32Array([stepsTime / 60]);
                if (seconds[0] <= 9999) {
                    var milliseconds = new Int32Array([(stepsTime - seconds[0] * 60) * 1000.0 * (1.0 / 60.0)]);
                    value = seconds[0] * 1000 + milliseconds[0];
                }
            }
            return value;
        };
        SpeedrunTimer.prototype.onStepUpdate = function () {
            if (!Game.Player.instance.winning && !Game.Player.instance.losing && !Game.SceneFreezer.stoped) {
                Game.Level.countStepsSpeedrun += 1;
                this.text.str = SpeedrunTimer.getTextValue(Game.Level.countStepsSpeedrun);
            }
        };
        return SpeedrunTimer;
    }(Engine.Entity));
    Game.SpeedrunTimer = SpeedrunTimer;
})(Game || (Game = {}));
///<reference path="../../../System/Entity.ts"/>
var Game;
(function (Game) {
    var SwitchTutorial = /** @class */ (function (_super) {
        __extends(SwitchTutorial, _super);
        function SwitchTutorial(def) {
            var _this = _super.call(this, def) || this;
            var pos = -20 - 11;
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.a;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = Game.IS_TOUCH ? "TOUCH TO SWITCH THE GRAVITY" : "X, SPACE OR LEFT CLICK";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.xAligned = 0;
            text0.yAligned = pos + (Game.IS_TOUCH ? 3.5 : 0);
            if (!Game.IS_TOUCH) {
                var text1 = new Utils.Text();
                text1.font = Game.FontManager.a;
                text1.scale = 1;
                text1.enabled = true;
                text1.pinned = true;
                text1.str = "TO SWITCH THE GRAVITY";
                text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.xAligned = 0;
                text1.yAligned = pos + 7;
            }
            return _this;
        }
        return SwitchTutorial;
    }(Game.Entity));
    Game.SwitchTutorial = SwitchTutorial;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Arrows = /** @class */ (function (_super) {
        __extends(Arrows, _super);
        function Arrows() {
            var _this = _super.call(this) || this;
            _this.enabled = true;
            _this.xOffset = 0;
            _this.yOffset = 0;
            _this.arrowLeft = new Utils.Text();
            _this.arrowLeft.owner = _this;
            _this.arrowLeft.str = ">";
            _this.arrowLeft.font = Game.FontManager.a;
            _this.arrowLeft.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.arrowLeft.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.arrowLeft.xAlignBounds = Utils.AnchorAlignment.END;
            _this.arrowLeft.yAlignBounds = Utils.AnchorAlignment.START;
            _this.arrowRight = new Utils.Text();
            _this.arrowRight.owner = _this;
            _this.arrowRight.str = "<";
            _this.arrowRight.font = Game.FontManager.a;
            _this.arrowRight.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.arrowRight.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.arrowRight.xAlignBounds = Utils.AnchorAlignment.START;
            _this.arrowRight.yAlignBounds = Utils.AnchorAlignment.START;
            return _this;
        }
        Object.defineProperty(Arrows.prototype, "font", {
            set: function (value) {
                this.arrowLeft.font = value;
                this.arrowRight.font = value;
            },
            enumerable: false,
            configurable: true
        });
        Arrows.prototype.onTimeUpdate = function () {
            this.arrowLeft.enabled = false;
            this.arrowRight.enabled = false;
            //console.log(this.bounds.selected);
            if (this.control.selected) {
                this.arrowLeft.enabled = this.enabled && this.bounds.enabled;
                this.arrowRight.enabled = this.enabled && this.bounds.enabled;
                this.arrowLeft.pinned = this.bounds.pinned;
                this.arrowRight.pinned = this.bounds.pinned;
                this.arrowLeft.xAligned = this.bounds.x - this.arrowLeft.font.xOffset - this.xOffset;
                this.arrowLeft.yAligned = this.bounds.y + this.yOffset;
                this.arrowRight.xAligned = this.bounds.x + this.bounds.xSize * this.bounds.xScale + this.arrowLeft.font.xOffset + this.xOffset;
                this.arrowRight.yAligned = this.bounds.y + this.yOffset;
            }
        };
        return Arrows;
    }(Engine.Entity));
    Game.Arrows = Arrows;
})(Game || (Game = {}));
var Utils;
(function (Utils) {
    var Font = /** @class */ (function () {
        function Font() {
            this.ySize = 0;
            this.xOffset = 0;
        }
        Font.prototype.setFull = function (texture, xTexture, yTexture, xOffset) {
            this.texture = texture;
            this.frames = Game.FrameSelector.complex("font", texture, xTexture, yTexture);
            this.xOffset = xOffset;
            this.ySize = this.frames[0].ySize;
            return this;
        };
        return Font;
    }());
    Utils.Font = Font;
})(Utils || (Utils = {}));
///<reference path="../Utils/Font.ts"/>
var Game;
(function (Game) {
    var FontManager = /** @class */ (function () {
        function FontManager() {
        }
        FontManager.createFondts = function () {
            FontManager.a = new Utils.Font();
            FontManager.a.setFull(Game.Resources.texture, 124, 634 + 3, 0);
            FontManager.b = new Utils.Font();
            FontManager.b.setFull(Game.Resources.texture, 21, 388, 0);
        };
        return FontManager;
    }());
    Game.FontManager = FontManager;
    Game.addAction("init", function () {
        FontManager.createFondts();
    });
})(Game || (Game = {}));
var Game;
(function (Game) {
    var offsetFrame = 0;
    var testFrames = null;
    var loadedFrames = null;
    Game.DEBUG_FRAME_SELECTOR = false;
    if (Game.DEBUG_FRAME_SELECTOR) {
        Game.addAction("start", function () {
            console.log(testFrames);
            console.log(JSON.stringify(testFrames));
        });
    }
    var FrameSelector = /** @class */ (function () {
        function FrameSelector() {
        }
        FrameSelector.complex = function (message, texture, x, y, frames, offset) {
            if (frames === void 0) { frames = new Array(); }
            if (offset === void 0) { offset = 0; }
            if (Game.DEBUG_FRAME_SELECTOR) {
                if (testFrames == null) {
                    
                    testFrames = {};
                }
                console.log(message);
                offsetFrame = offset;
                var oldLength = frames.length;
                findHorizontalFrames(frames, texture, x, y);
                var jsonFrames = {};
                var count = 0;
                for (var index = oldLength; index < frames.length; index += 1) {
                    jsonFrames[count + ""] = frames[index].getGeneric();
                    count += 1;
                }
                testFrames[texture.path + " " + x + " " + y] = jsonFrames;
            }
            else {
                if (loadedFrames == null) {
                    loadedFrames = JSON.parse(Engine.Assets.loadText(Game.Resources.PATH_FRAMES));
                }
                var count = 0;
                var generic = loadedFrames[texture.path + " " + x + " " + y][count + ""];
                while (generic != null && generic != undefined) {
                    frames.push(new Utils.AnimationFrame(texture, generic.xTexture, generic.yTexture, generic.xSize, generic.ySize, generic.xOffset, generic.yOffset, null, generic.hasBox, generic.xSizeBox, generic.ySizeBox, generic.xOffsetBox, generic.yOffsetBox));
                    count += 1;
                    generic = loadedFrames[texture.path + " " + x + " " + y][count + ""];
                }
            }
            return frames;
        };
        return FrameSelector;
    }());
    Game.FrameSelector = FrameSelector;
    var colorRect = { r: 0, g: 0, b: 0, a: 255 };
    var colorMark = { r: 255, g: 255, b: 255, a: 255 };
    function findHorizontalFrames(frames, texture, x, y) {
        var xLimit = xFindLimit(texture, x, y);
        var yLimit = yFindLimit(texture, x, y);
        var xSearch = x + 2;
        var ySearch = y + 2;
        while (xSearch < xLimit - 3) {
            var frame = new Utils.AnimationFrame();
            frames.push(frame);
            xSearch = initComplexFrame(frame, texture, xSearch, ySearch) + 1;
        }
        var color = {};
        copyColor(color, texture, x, yLimit);
        if (compareColor(color, colorRect)) {
            findHorizontalFrames(frames, texture, x, yLimit - 1);
        }
    }
    function initComplexFrame(frame, texture, x, y) {
        var xLimit = xFindLimit(texture, x, y);
        var yLimit = yFindLimit(texture, x, y);
        var colorSearch = {};
        var xMarkOffsetStart = 0;
        var xMarkOffsetEnd = 0;
        var xBoxStart = 0;
        var xBoxEnd = 0;
        for (var xIndex = x + 1; xIndex < xLimit - 1; xIndex += 1) {
            copyColor(colorSearch, texture, xIndex, y);
            if (compareColor(colorSearch, colorMark)) {
                if (xBoxStart == 0) {
                    xBoxStart = xIndex;
                }
                xBoxEnd = xIndex + 1;
            }
            copyColor(colorSearch, texture, xIndex, yLimit - 1);
            if (compareColor(colorSearch, colorMark)) {
                if (xMarkOffsetStart == 0) {
                    xMarkOffsetStart = xIndex;
                }
                xMarkOffsetEnd = xIndex + 1;
            }
        }
        var yMarkOffsetStart = 0;
        var yMarkOffsetEnd = 0;
        var yBoxStart = 0;
        var yBoxEnd = 0;
        for (var yIndex = y + 1; yIndex < yLimit - 1; yIndex += 1) {
            copyColor(colorSearch, texture, x, yIndex);
            if (compareColor(colorSearch, colorMark)) {
                if (yBoxStart == 0) {
                    yBoxStart = yIndex;
                }
                yBoxEnd = yIndex + 1;
            }
            copyColor(colorSearch, texture, xLimit - 1, yIndex);
            if (compareColor(colorSearch, colorMark)) {
                if (yMarkOffsetStart == 0) {
                    yMarkOffsetStart = yIndex;
                }
                yMarkOffsetEnd = yIndex + 1;
            }
        }
        frame.texture = texture;
        frame.xSize = xLimit - 2 - (x + 2) - offsetFrame * 2;
        frame.ySize = yLimit - 2 - (y + 2) - offsetFrame * 2;
        frame.xTexture = x + 2 + offsetFrame;
        frame.yTexture = y + 2 + offsetFrame;
        if (xMarkOffsetStart > 0) {
            frame.xOffset = frame.xTexture - xMarkOffsetStart - (xMarkOffsetEnd - xMarkOffsetStart) * 0.5;
        }
        if (yMarkOffsetStart > 0) {
            frame.yOffset = frame.yTexture - yMarkOffsetStart - (yMarkOffsetEnd - yMarkOffsetStart) * 0.5;
        }
        if (xBoxStart > 0) {
            frame.hasBox = true;
            frame.xSizeBox = xBoxEnd - xBoxStart;
            if (xMarkOffsetStart > 0) {
                frame.xOffsetBox = xBoxStart - xMarkOffsetStart - (xMarkOffsetEnd - xMarkOffsetStart) * 0.5;
            }
        }
        else if (yBoxStart > 0) {
            frame.hasBox = true;
            frame.xSizeBox = frame.xSize;
            if (xMarkOffsetStart > 0) {
                frame.xOffsetBox = frame.xTexture - xMarkOffsetStart - (xMarkOffsetEnd - xMarkOffsetStart) * 0.5;
            }
        }
        if (yBoxStart > 0) {
            frame.hasBox = true;
            frame.ySizeBox = yBoxEnd - yBoxStart;
            if (yMarkOffsetStart > 0) {
                frame.yOffsetBox = yBoxStart - yMarkOffsetStart - (yMarkOffsetEnd - yMarkOffsetStart) * 0.5;
            }
        }
        else if (xBoxStart > 0) {
            frame.hasBox = true;
            frame.ySizeBox = frame.ySize;
            if (yMarkOffsetStart > 0) {
                frame.yOffsetBox = frame.yTexture - yMarkOffsetStart - (yMarkOffsetEnd - yMarkOffsetStart) * 0.5;
            }
        }
        return xLimit;
    }
    function xFindLimit(texture, x, y) {
        var colorCompare = {};
        y += 1;
        do {
            x += 1;
            copyColor(colorCompare, texture, x, y);
        } while (!compareColor(colorCompare, colorRect) && !compareColor(colorCompare, colorMark));
        return x += 1;
    }
    function yFindLimit(texture, x, y) {
        var colorCompare = {};
        x += 1;
        do {
            y += 1;
            copyColor(colorCompare, texture, x, y);
        } while (!compareColor(colorCompare, colorRect) && !compareColor(colorCompare, colorMark));
        return y += 1;
    }
    function copyColor(color, texture, x, y) {
        color.r = texture.getRed(x, y);
        color.g = texture.getGreen(x, y);
        color.b = texture.getBlue(x, y);
        color.a = texture.getAlpha(x, y);
    }
    function compareColor(colorA, colorB) {
        return colorA.r == colorB.r && colorA.g == colorB.g && colorA.b == colorB.b && colorA.a == colorB.a;
    }
})(Game || (Game = {}));
var Game;
(function (Game) {
    var PATH_BGM = "Assets/Audio/Komiku_-_04_-_The_weekly_fair.omw";
    var PATH_SFX_JUMP = "Assets/Audio/jump.wom";
    var PATH_SFX_DEATH = "Assets/Audio/dead.wom";
    var PATH_SFX_SWITCH = "Assets/Audio/switch.wom";
    var PATH_SFX_WIN = "Assets/Audio/win.wom";
    var PATH_SFX_GHOST_BLOCK = "Assets/Audio/ghostblock.wom";
    var PATH_SFX_STUCK = "Assets/Audio/stuck.wom";
    var PATH_SFX_UNSTUCK = "Assets/Audio/unstuck.wom";
    var PATH_SFX_JUMPER = "Assets/Audio/jumper.wom";
    var PATH_SFX_BUTTON = "Assets/Audio/button.wom";
    Game.PATH_TEXTURE_GRAPHICS = "Assets/Graphics/Main-A.png";
    Game.PATH_TEXTURE_PRELOADER = "Assets/Graphics/Main-B.png";
    Game.PATH_TEXTURE_TITLE = "Assets/Graphics/Main-C.png";
    Game.PATH_TEXTURE_ENEMIES = "Assets/Graphics/Main-D.png";
    var PATH_GOOGLE_PLAY_LOGO = "Assets/Graphics/google-play-badge.png";
    Game.PATH_TEXTURE_MAP_BACK = "Assets/Graphics/MapBack.png";
    Game.PATH_TEXTURE_MAP_TERRAIN = "Assets/Graphics/MapTerrain.png";
    var Resources = /** @class */ (function () {
        function Resources() {
        }
        Resources.playBGM = function () {
            if (!Resources.bgmPlayed) {
                Resources.bgm.autoplay();
                Resources.bgmPlayed = true;
            }
        };
        Resources.PATH_LEVEL_TEST = "Assets/Maps/LevelTest.json";
        Resources.PATH_TILESET = "Assets/Maps/TilesetNew.json";
        Resources.PATH_FRAMES = "Assets/Graphics/frames.json";
        Resources.PATH_MAPS = "Assets/Maps/";
        Resources.PATH_MAP_NONE = Resources.PATH_MAPS + "None.json";
        Resources.PATH_MAP_PRELOADER = Resources.PATH_MAPS + "Preloader.json";
        Resources.PATH_MAP_MAIN_MENU = Resources.PATH_MAPS + "MainMenu.json";
        Resources.PATH_MAP_MAIN_MENU_TOUCH = Resources.PATH_MAPS + "MainMenuTouch.json";
        Resources.PATH_MAP_LAST = Resources.PATH_MAPS + "LastScene.json";
        Resources.PATH_LEVEL = Resources.PATH_MAPS + "Level";
        Resources.bgmPlayed = false;
        Resources.bgmVolumeTracker = 1;
        return Resources;
    }());
    Game.Resources = Resources;
    function getPathLevel(index) {
        return Resources.PATH_LEVEL + "" + (index < 10 ? "0" : "") + index + ".json";
    }
    Game.getPathLevel = getPathLevel;
    Game.addPath("preload", Game.PATH_TEXTURE_MAP_BACK);
    Game.addPath("preload", Game.PATH_TEXTURE_MAP_TERRAIN);
    Game.addPath("preload", Resources.PATH_FRAMES);
    Game.addPath("preload", Game.PATH_TEXTURE_GRAPHICS);
    Game.addPath("preload", Game.PATH_TEXTURE_PRELOADER);
    Game.addPath("preload", Resources.PATH_TILESET);
    Game.addPath("preload", Resources.PATH_MAP_NONE);
    Game.addPath("preload", Resources.PATH_MAP_PRELOADER);
    Game.addPath("load", Game.PATH_TEXTURE_TITLE);
    Game.addPath("load", Game.PATH_TEXTURE_ENEMIES);
    Game.addPath("load", Resources.PATH_LEVEL_TEST);
    Game.addPath("load", Resources.PATH_MAP_MAIN_MENU);
    Game.addPath("load", Resources.PATH_MAP_MAIN_MENU_TOUCH);
    Game.addPath("load", Resources.PATH_MAP_LAST);
    for (var indexLevel = 1; indexLevel <= Game.MAX_LEVELS; indexLevel += 1) {
        Game.addPath("load", getPathLevel(indexLevel));
    }
    Game.addPath("load", PATH_BGM);
    Game.addPath("load", PATH_SFX_JUMP);
    Game.addPath("load", PATH_SFX_DEATH);
    Game.addPath("load", PATH_SFX_SWITCH);
    Game.addPath("load", PATH_SFX_WIN);
    Game.addPath("load", PATH_SFX_GHOST_BLOCK);
    Game.addPath("load", PATH_SFX_STUCK);
    Game.addPath("load", PATH_SFX_UNSTUCK);
    Game.addPath("load", PATH_SFX_JUMPER);
    Game.addPath("load", PATH_SFX_BUTTON);
    Game.addAction("preinit", function () {
        Resources.texture = new Engine.Texture(Game.PATH_TEXTURE_GRAPHICS, true, false);
        Resources.texture.preserved = true;
        Resources.textureMapBack = new Engine.Texture(Game.PATH_TEXTURE_MAP_BACK, false, false);
        Resources.textureMapBack.preserved = true;
        Resources.textureMapTerrain = new Engine.Texture(Game.PATH_TEXTURE_MAP_TERRAIN, false, false);
        Resources.textureMapTerrain.preserved = true;
        if (Game.HAS_LINKS && Game.HAS_GOOGLE_PLAY_LOGOS) {
            Game.addPath("load", PATH_GOOGLE_PLAY_LOGO);
        }
    });
    Game.addAction("preconfigure", function () {
        Resources.textureEnemies = new Engine.Texture(Game.PATH_TEXTURE_ENEMIES, true, false);
        Resources.textureEnemies.preserved = true;
    });
    Game.addAction("configure", function () {
        if (Game.HAS_LINKS && Game.HAS_GOOGLE_PLAY_LOGOS) {
            Resources.textureGooglePlay = new Engine.Texture(PATH_GOOGLE_PLAY_LOGO, false, true);
            Resources.textureGooglePlay.preserved = true;
        }
        Resources.bgm = new Engine.AudioPlayer(PATH_BGM);
        Resources.bgm.preserved = true;
        Resources.bgm.volume = Resources.bgm.restoreVolume = 1;
        if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
            Resources.bgm.loopStart = 5.38;
            Resources.bgm.loopEnd = 80.05;
        }
        else if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
            Resources.bgm.loopStart = 5.38;
            Resources.bgm.loopEnd = 80.05;
        }
        Game.bgms.push(Resources.bgm);
        var vscale = 1.2;
        Resources.sfxJump = new Engine.AudioPlayer(PATH_SFX_JUMP);
        Resources.sfxJump.preserved = true;
        Resources.sfxJump.volume = Resources.sfxJump.restoreVolume = 0.65 * vscale;
        Game.sfxs.push(Resources.sfxJump);
        Resources.sfxDeath = new Engine.AudioPlayer(PATH_SFX_DEATH);
        Resources.sfxDeath.preserved = true;
        Resources.sfxDeath.volume = Resources.sfxDeath.restoreVolume = 0.45 * vscale;
        Game.sfxs.push(Resources.sfxDeath);
        Resources.sfxSwitch = new Engine.AudioPlayer(PATH_SFX_SWITCH);
        Resources.sfxSwitch.preserved = true;
        Game.sfxs.push(Resources.sfxSwitch);
        Resources.sfxWin = new Engine.AudioPlayer(PATH_SFX_WIN);
        Resources.sfxWin.preserved = true;
        Resources.sfxWin.volume = Resources.sfxWin.restoreVolume = 0.8 * vscale;
        Game.sfxs.push(Resources.sfxWin);
        Resources.sfxGhostBlock = new Engine.AudioPlayer(PATH_SFX_GHOST_BLOCK);
        Resources.sfxGhostBlock.preserved = true;
        Game.sfxs.push(Resources.sfxGhostBlock);
        Resources.sfxStuck = new Engine.AudioPlayer(PATH_SFX_STUCK);
        Resources.sfxStuck.preserved = true;
        Resources.sfxStuck.volume = Resources.sfxStuck.restoreVolume = 0.7 * vscale;
        Game.sfxs.push(Resources.sfxStuck);
        Resources.sfxUnStuck = new Engine.AudioPlayer(PATH_SFX_UNSTUCK);
        Resources.sfxUnStuck.preserved = true;
        Resources.sfxUnStuck.volume = Resources.sfxUnStuck.restoreVolume = 0.5 * vscale;
        Game.sfxs.push(Resources.sfxUnStuck);
        Resources.sfxJumper = new Engine.AudioPlayer(PATH_SFX_JUMPER);
        Resources.sfxJumper.preserved = true;
        Resources.sfxJumper.volume = Resources.sfxJumper.restoreVolume = 2.8 * vscale;
        Game.sfxs.push(Resources.sfxJumper);
        Resources.sfxButton = new Engine.AudioPlayer(PATH_SFX_BUTTON);
        Resources.sfxButton.preserved = true;
        Resources.sfxButton.volume = Resources.sfxButton.restoreVolume = 2.0 * vscale;
        Game.sfxs.push(Resources.sfxButton);
        if (Resources.bgmVolumeTracker < 1) {
            Game.muteAll();
        }
    });
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var DOWN_RED = 0;
    var DOWN_GREEN = 0;
    var DOWN_BLUE = 0;
    var DOWN_ALPHA = 1;
    var SceneColors = /** @class */ (function (_super) {
        __extends(SceneColors, _super);
        function SceneColors() {
            var _this = _super.call(this) || this;
            SceneColors.instance = _this;
            _this.fillDown = new Engine.Sprite();
            //this.fillBlue.enabled = true;
            //this.fillBlue.pinned = true;
            //this.fillBlue.y = -60 - 8;
            //this.fillBlue.xSize = 160;
            //this.fillBlue.xOffset = -80;
            //this.fillBlue.setRGBA(104 / 255, 68 / 255, 252 / 255, 1);
            _this.fillDown.enabled = true;
            _this.fillDown.pinned = true;
            _this.fillDown.y = 60 + 8;
            _this.fillDown.xSize = 160;
            _this.fillDown.xOffset = -80;
            _this.fillDown.setRGBA(DOWN_RED / 255, DOWN_GREEN / 255, DOWN_BLUE / 255, DOWN_ALPHA);
            return _this;
        }
        Object.defineProperty(SceneColors, "enabledDown", {
            set: function (value) {
                SceneColors.instance.fillDown.enabled = value;
            },
            enumerable: false,
            configurable: true
        });
        SceneColors.init = function () {
            new SceneColors();
        };
        SceneColors.clearColor = function (red, green, blue) {
            red = 0;
            green = 0;
            blue = 0;
            Engine.Renderer.clearColor(red / 255, green / 255, blue / 255);
        };
        SceneColors.setDownColor = function (red, green, blue, alpha) {
            red = 0;
            green = 0;
            blue = 0;
            SceneColors.instance.fillDown.setRGBA(red / 255, green / 255, blue / 255, alpha);
        };
        SceneColors.prototype.onDrawSceneFill = function () {
            if (Engine.Renderer.xFitView) {
                //if(this.fillBlue.enabled){
                //    this.fillBlue.ySize = Engine.Renderer.ySizeView;
                //    this.fillBlue.yOffset = -Engine.Renderer.ySizeView;
                //    this.fillBlue.render();
                //}
                if (this.fillDown.enabled) {
                    this.fillDown.ySize = Engine.Renderer.ySizeView;
                    //this.fillDown.render();
                }
            }
        };
        SceneColors.prototype.onClearScene = function () {
            SceneColors.instance = null;
        };
        return SceneColors;
    }(Engine.Entity));
    Game.SceneColors = SceneColors;
})(Game || (Game = {}));
///<reference path="../../Engine/Entity.ts"/>
var Utils;
(function (Utils) {
    var Fade = /** @class */ (function (_super) {
        __extends(Fade, _super);
        function Fade() {
            var _this = _super.call(this) || this;
            _this.speed = 0.0166666666666667 * 4;
            _this.direction = -1;
            _this.alpha = 1;
            _this.red = 0 / 255;
            _this.green = 0 / 255;
            _this.blue = 0 / 255;
            _this.maxAlpha = 1;
            _this.drawAlpha = 1;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.sprite.pinned = true;
            _this.sprite.setRGBA(_this.red, _this.green, _this.blue, _this.maxAlpha);
            _this.onViewUpdate();
            return _this;
        }
        Fade.prototype.onViewUpdate = function () {
            this.sprite.xSize = Engine.Renderer.xSizeView;
            this.sprite.ySize = Engine.Renderer.ySizeView;
            this.sprite.x = -Engine.Renderer.xSizeView * 0.5;
            this.sprite.y = -Engine.Renderer.ySizeView * 0.5;
        };
        Fade.prototype.onStepUpdateFade = function () {
            if (this.direction != 0) {
                this.alpha += this.speed * this.direction * Fade.scale;
                if (this.direction < 0 && this.alpha <= 0) {
                    this.direction = 0;
                    this.alpha = 0;
                    this.sprite.setRGBA(this.red, this.green, this.blue, 0);
                }
                else if (this.direction > 0 && this.alpha >= this.maxAlpha) {
                    this.direction = 0;
                    this.alpha = this.maxAlpha;
                    this.sprite.setRGBA(this.red, this.green, this.blue, this.maxAlpha);
                }
            }
        };
        Fade.prototype.onTimeUpdate = function () {
            if (this.direction != 0) {
                var extAlpha = this.alpha + this.speed * this.direction * Fade.scale * Engine.System.stepExtrapolation;
                if (this.direction < 0 && extAlpha < 0) {
                    extAlpha = 0;
                }
                else if (this.direction > 0 && extAlpha > this.maxAlpha) {
                    extAlpha = this.maxAlpha;
                }
                this.sprite.setRGBA(this.red, this.green, this.blue, extAlpha);
                this.drawAlpha = extAlpha;
            }
            else {
                this.drawAlpha = this.alpha;
            }
        };
        Fade.prototype.onDrawFade = function () {
            this.sprite.render();
        };
        Fade.scale = 1;
        return Fade;
    }(Engine.Entity));
    Utils.Fade = Fade;
})(Utils || (Utils = {}));
///<reference path="../../Utils/Fade.ts"/>
var Game;
(function (Game) {
    var instance = null;
    var SceneFade = /** @class */ (function (_super) {
        __extends(SceneFade, _super);
        function SceneFade() {
            return _super.call(this) || this;
        }
        Object.defineProperty(SceneFade, "speed", {
            set: function (value) {
                instance.speed = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SceneFade, "filled", {
            get: function () {
                return instance.alpha == 1;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SceneFade, "drawAlpha", {
            get: function () {
                if (instance != null) {
                    return instance.drawAlpha;
                }
                return null;
            },
            enumerable: false,
            configurable: true
        });
        SceneFade.init = function () {
            instance = instance || new SceneFade();
            instance.preserved = true;
            instance.speed = 0.0833 * (0.75);
        };
        SceneFade.setColor = function (red, green, blue) {
            red = 0;
            green = 0;
            blue = 0;
            instance.red = red / 255;
            instance.green = green / 255;
            instance.blue = blue / 255;
        };
        SceneFade.trigger = function () {
            instance.direction = 1;
        };
        SceneFade.prototype.onReset = function () {
            this.direction = -1;
        };
        SceneFade.prototype.onStepUpdate = function () {
            if (!Game.Scene.waiting && Game.Scene.nextSceneClass != null && this.direction != 1 && (Game.LevelAdLoader.instance == null || !Game.LevelAdLoader.blocked)) {
                this.direction = 1;
            }
        };
        return SceneFade;
    }(Utils.Fade));
    Game.SceneFade = SceneFade;
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var instance = null;
    var SceneFreezer = /** @class */ (function (_super) {
        __extends(SceneFreezer, _super);
        function SceneFreezer() {
            var _this = _super.call(this) || this;
            _this.requirePauseSwitch = false;
            _this.paused = false;
            if (!(Game.Scene.instance instanceof Game.Level)) {
                _this.paused = false;
                _this.requirePauseSwitch = false;
            }
            return _this;
        }
        Object.defineProperty(SceneFreezer, "paused", {
            get: function () {
                return instance.paused;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(SceneFreezer, "stoped", {
            get: function () {
                return Game.Scene.nextSceneClass != null || instance.paused || Game.SceneOrientator.blocked || (Game.LevelAdLoader.instance != null && Game.LevelAdLoader.blocked);
            },
            enumerable: false,
            configurable: true
        });
        SceneFreezer.switchPause = function () {
            instance.requirePauseSwitch = !instance.requirePauseSwitch;
        };
        SceneFreezer.init = function () {
            instance = new SceneFreezer();
        };
        SceneFreezer.prototype.onStepUpdate = function () {
            if (this.requirePauseSwitch) {
                this.paused = !this.paused;
                this.requirePauseSwitch = false;
            }
        };
        SceneFreezer.prototype.onClearScene = function () {
            instance = null;
        };
        return SceneFreezer;
    }(Engine.Entity));
    Game.SceneFreezer = SceneFreezer;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var instance = null;
    var ready = false;
    var SceneOrientator = /** @class */ (function (_super) {
        __extends(SceneOrientator, _super);
        function SceneOrientator() {
            var _this = _super.call(this) || this;
            var yOffset = 24 + 6;
            _this.text0 = new Utils.Text();
            _this.text0.font = Game.FontManager.a;
            _this.text0.scale = 1;
            _this.text0.enabled = true;
            _this.text0.pinned = true;
            _this.text0.str = "PLEASE ROTATE";
            _this.text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text0.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text0.xAligned = 0;
            _this.text0.yAligned = yOffset - 2;
            _this.text0.front = true;
            _this.text1 = new Utils.Text();
            _this.text1.font = Game.FontManager.a;
            _this.text1.scale = 1;
            _this.text1.enabled = true;
            _this.text1.pinned = true;
            _this.text1.str = "YOUR DEVICE";
            _this.text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text1.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text1.xAligned = 0;
            _this.text1.yAligned = yOffset + 8;
            _this.text1.front = true;
            _this.device = new Engine.Sprite();
            _this.device.enabled = true;
            _this.device.pinned = true;
            _this.device.y = 0 - 6 - 8;
            FRAMES[0].applyToSprite(_this.device);
            _this.fill = new Engine.Sprite();
            _this.fill.enabled = true;
            _this.fill.pinned = true;
            _this.fill.setRGBA(0 / 255, 0 / 255, 0 / 255, 1);
            _this.onViewUpdate();
            return _this;
        }
        Object.defineProperty(SceneOrientator, "blocked", {
            get: function () {
                return instance != null && instance.fill.enabled;
            },
            enumerable: false,
            configurable: true
        });
        SceneOrientator.init = function () {
            if (Game.TRACK_ORIENTATION && ready) {
                instance = instance || new SceneOrientator();
            }
        };
        SceneOrientator.prototype.onViewUpdate = function () {
            this.fill.enabled = Engine.Renderer.xSizeView < Engine.Renderer.ySizeView;
            this.device.enabled = this.fill.enabled;
            this.text0.enabled = this.fill.enabled;
            this.text1.enabled = this.fill.enabled;
            this.fill.x = -Engine.Renderer.xSizeView * 0.5;
            this.fill.y = -Engine.Renderer.ySizeView * 0.5;
            this.fill.xSize = Engine.Renderer.xSizeView;
            this.fill.ySize = Engine.Renderer.ySizeView;
        };
        SceneOrientator.prototype.onDrawOrientationUI = function () {
            this.fill.render();
            this.device.render();
        };
        SceneOrientator.prototype.onClearScene = function () {
            instance = null;
        };
        return SceneOrientator;
    }(Engine.Entity));
    Game.SceneOrientator = SceneOrientator;
    var FRAMES = null;
    Game.addAction("init", function () {
        FRAMES = [new Utils.AnimationFrame(Game.Resources.texture, 715, 122, 142, 78, -142 * 0.5, -78 * 0.5)];
    });
    Game.addAction("onpreloadcomplete", function () {
        ready = true;
    });
})(Game || (Game = {}));
///<reference path="../../Engine/Entity.ts"/>
var Utils;
(function (Utils) {
    var AnchorAlignment;
    (function (AnchorAlignment) {
        AnchorAlignment[AnchorAlignment["START"] = 0] = "START";
        AnchorAlignment[AnchorAlignment["MIDDLE"] = 1] = "MIDDLE";
        AnchorAlignment[AnchorAlignment["END"] = 2] = "END";
    })(AnchorAlignment = Utils.AnchorAlignment || (Utils.AnchorAlignment = {}));
    var Anchor = /** @class */ (function (_super) {
        __extends(Anchor, _super);
        function Anchor() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._bounds = null;
            _this._xAlignView = AnchorAlignment.MIDDLE;
            _this._yAlignView = AnchorAlignment.MIDDLE;
            _this._xAlignBounds = AnchorAlignment.MIDDLE;
            _this._yAlignBounds = AnchorAlignment.MIDDLE;
            _this._xAligned = 0;
            _this._yAligned = 0;
            return _this;
        }
        Object.defineProperty(Anchor.prototype, "bounds", {
            get: function () {
                return this._bounds;
            },
            set: function (value) {
                this._bounds = value;
                this.fix();
            },
            enumerable: false,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "xAlignView", {
            get: function () {
                return this._xAlignView;
            },
            set: function (value) {
                this._xAlignView = value;
                this.fix();
            },
            enumerable: false,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "yAlignView", {
            get: function () {
                return this._yAlignView;
            },
            set: function (value) {
                this._yAlignView = value;
                this.fix();
            },
            enumerable: false,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "xAlignBounds", {
            get: function () {
                return this._xAlignBounds;
            },
            set: function (value) {
                this._xAlignBounds = value;
                this.fix();
            },
            enumerable: false,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "yAlignBounds", {
            get: function () {
                return this._yAlignBounds;
            },
            set: function (value) {
                this._yAlignBounds = value;
                this.fix();
            },
            enumerable: false,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "xAligned", {
            get: function () {
                return this._xAligned;
            },
            set: function (value) {
                this._xAligned = value;
                this.fix();
            },
            enumerable: false,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "yAligned", {
            get: function () {
                return this._yAligned;
            },
            set: function (value) {
                this._yAligned = value;
                this.fix();
            },
            enumerable: false,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Anchor.prototype, "x", {
            get: function () {
                return this._bounds.x;
            },
            enumerable: false,
            configurable: true
        });
        ;
        Object.defineProperty(Anchor.prototype, "y", {
            get: function () {
                return this._bounds.y;
            },
            enumerable: false,
            configurable: true
        });
        ;
        Anchor.prototype.fix = function () {
            this.xFix();
            this.yFix();
        };
        Anchor.prototype.xFix = function () {
            var xSizeBounds = this.bounds == null ? 0 : this.bounds.xSize;
            var xScaleBounds = this.bounds == null ? 1 : this.bounds.xScale;
            var x = 0;
            switch (this._xAlignView) {
                case AnchorAlignment.START:
                    x = -Engine.Renderer.xSizeView * 0.5 + this._xAligned;
                    switch (this._xAlignBounds) {
                        case AnchorAlignment.START:
                            break;
                        case AnchorAlignment.MIDDLE:
                            x -= xSizeBounds * xScaleBounds * 0.5;
                            break;
                        case AnchorAlignment.END:
                            x -= xSizeBounds * xScaleBounds;
                            break;
                    }
                    break;
                case AnchorAlignment.MIDDLE:
                    x = this._xAligned;
                    switch (this._xAlignBounds) {
                        case AnchorAlignment.START:
                            break;
                        case AnchorAlignment.MIDDLE:
                            x -= xSizeBounds * xScaleBounds * 0.5;
                            break;
                        case AnchorAlignment.END:
                            x -= xSizeBounds * xScaleBounds;
                            break;
                    }
                    break;
                case AnchorAlignment.END:
                    x = Engine.Renderer.xSizeView * 0.5 + this._xAligned - (xSizeBounds * xScaleBounds);
                    switch (this._xAlignBounds) {
                        case AnchorAlignment.START:
                            x += xSizeBounds * xScaleBounds;
                            break;
                        case AnchorAlignment.MIDDLE:
                            x += xSizeBounds * xScaleBounds * 0.5;
                            break;
                        case AnchorAlignment.END:
                            break;
                    }
                    break;
            }
            this._bounds.x = x;
        };
        Anchor.prototype.yFix = function () {
            var ySizeBounds = this.bounds == null ? 0 : this.bounds.ySize;
            var yScaleBounds = this.bounds == null ? 1 : this.bounds.yScale;
            var y = 0;
            switch (this._yAlignView) {
                case AnchorAlignment.START:
                    y = -Engine.Renderer.ySizeView * 0.5 + this._yAligned;
                    switch (this._yAlignBounds) {
                        case AnchorAlignment.START:
                            break;
                        case AnchorAlignment.MIDDLE:
                            y -= ySizeBounds * yScaleBounds * 0.5;
                            break;
                        case AnchorAlignment.END:
                            y -= ySizeBounds * yScaleBounds;
                            break;
                    }
                    break;
                case AnchorAlignment.MIDDLE:
                    y = this._yAligned;
                    switch (this._yAlignBounds) {
                        case AnchorAlignment.START:
                            break;
                        case AnchorAlignment.MIDDLE:
                            y -= ySizeBounds * yScaleBounds * 0.5;
                            break;
                        case AnchorAlignment.END:
                            y -= ySizeBounds * yScaleBounds;
                            break;
                    }
                    break;
                case AnchorAlignment.END:
                    y = Engine.Renderer.ySizeView * 0.5 + this._yAligned - (ySizeBounds * yScaleBounds);
                    switch (this._yAlignBounds) {
                        case AnchorAlignment.START:
                            y += ySizeBounds * yScaleBounds;
                            break;
                        case AnchorAlignment.MIDDLE:
                            y += ySizeBounds * yScaleBounds * 0.5;
                            break;
                        case AnchorAlignment.END:
                            break;
                    }
                    break;
            }
            this._bounds.y = y;
        };
        Anchor.prototype.setFullPosition = function (xAlignView, yAlignView, xAlignBounds, yAlignBounds, xAligned, yAligned) {
            this._xAlignView = xAlignView;
            this._yAlignView = yAlignView;
            this._xAlignBounds = xAlignBounds;
            this._yAlignBounds = yAlignBounds;
            this._xAligned = xAligned;
            this._yAligned = yAligned;
            this.fix();
            return this;
        };
        //@ts-ignore
        Anchor.prototype.onViewUpdateAnchor = function () {
            this.fix();
        };
        return Anchor;
    }(Engine.Entity));
    Utils.Anchor = Anchor;
})(Utils || (Utils = {}));
///<reference path = "../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var UI;
    (function (UI) {
        var FRAMES_DEFAULT;
        Game.addAction("configure", function () {
            FRAMES_DEFAULT = Game.FrameSelector.complex("dialog default a", Game.Resources.texture, 21, 159);
            //FRAMES_DEFAULT = FrameSelector.complex("dialog default b", Resources.texture, 45, 159, FRAMES_DEFAULT);
        });
        var Dialog = /** @class */ (function (_super) {
            __extends(Dialog, _super);
            function Dialog(frames) {
                if (frames === void 0) { frames = null; }
                var _this = _super.call(this) || this;
                _this.dirty = false;
                _this.bounds = new Engine.InteractableBounds();
                _this.anchor = new Utils.Anchor();
                _this.anchor.bounds = _this.bounds;
                _this._xSize = _this.bounds.xSize;
                _this._ySize = _this.bounds.ySize;
                _this.sprites = [];
                _this.spriteTopLeft = new Engine.Sprite();
                _this.sprites.push(_this.spriteTopLeft);
                _this.spriteTop = new Engine.Sprite();
                _this.sprites.push(_this.spriteTop);
                _this.spriteTopRight = new Engine.Sprite();
                _this.sprites.push(_this.spriteTopRight);
                _this.spriteLeft = new Engine.Sprite();
                _this.sprites.push(_this.spriteLeft);
                _this.spriteMiddle = new Engine.Sprite();
                _this.sprites.push(_this.spriteMiddle);
                _this.spriteRight = new Engine.Sprite();
                _this.sprites.push(_this.spriteRight);
                _this.spriteBottomLeft = new Engine.Sprite();
                _this.sprites.push(_this.spriteBottomLeft);
                _this.spriteBottom = new Engine.Sprite();
                _this.sprites.push(_this.spriteBottom);
                _this.spriteBottomRight = new Engine.Sprite();
                _this.sprites.push(_this.spriteBottomRight);
                _this.spriteIcon = new Engine.Sprite();
                _this.sprites.push(_this.spriteIcon);
                _this.frames = frames || FRAMES_DEFAULT;
                _this.enabled = true;
                _this.pinned = true;
                return _this;
            }
            Object.defineProperty(Dialog.prototype, "enabled", {
                get: function () {
                    return this.bounds.enabled;
                },
                set: function (value) {
                    this.bounds.enabled = value;
                    for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                        var sprite = _a[_i];
                        sprite.enabled = this.bounds.enabled;
                    }
                    this.spriteIcon.enabled = this.bounds.enabled && this.frames.length > 9;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "pinned", {
                get: function () {
                    return this.bounds.pinned;
                },
                set: function (value) {
                    this.bounds.pinned = value;
                    for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                        var sprite = _a[_i];
                        sprite.pinned = this.bounds.pinned;
                    }
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "frames", {
                get: function () {
                    return this._frames;
                },
                set: function (value) {
                    this._frames = value;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "x", {
                get: function () {
                    return this.bounds.x;
                },
                set: function (_value) {
                    //this.bounds.x = value;
                    //this.dirty = true;
                    console.warn("UNIMPLEMENTED");
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "xAlignView", {
                get: function () {
                    return this.anchor.xAlignView;
                },
                set: function (value) {
                    this.anchor.xAlignView = value;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "xAlignBounds", {
                get: function () {
                    return this.anchor.xAlignBounds;
                },
                set: function (value) {
                    this.anchor.xAlignBounds = value;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "xAligned", {
                get: function () {
                    return this.anchor.xAlignView;
                },
                set: function (value) {
                    this.anchor.xAligned = value;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "y", {
                get: function () {
                    return this.bounds.y;
                },
                set: function (_value) {
                    //this.bounds.y = value;
                    //this.dirty = true;
                    console.warn("UNIMPLEMENTED");
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "yAlignView", {
                get: function () {
                    return this.anchor.yAlignView;
                },
                set: function (value) {
                    this.anchor.yAlignView = value;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "yAlignBounds", {
                get: function () {
                    return this.anchor.yAlignBounds;
                },
                set: function (value) {
                    this.anchor.yAlignBounds = value;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "yAligned", {
                get: function () {
                    return this.anchor.yAlignView;
                },
                set: function (value) {
                    this.anchor.yAligned = value;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "xSize", {
                get: function () {
                    return this._xSize;
                },
                set: function (value) {
                    this._xSize = value;
                    this.bounds.xSize = this._xSize;
                    this.anchor.bounds = this.bounds;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "ySize", {
                get: function () {
                    return this._ySize;
                },
                set: function (value) {
                    this._ySize = value;
                    this.bounds.ySize = this._ySize;
                    this.anchor.bounds = this.bounds;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "xOffset", {
                get: function () {
                    return this.bounds.xOffset;
                },
                set: function (value) {
                    this.bounds.xOffset = value;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "yOffset", {
                get: function () {
                    return this.bounds.yOffset;
                },
                set: function (value) {
                    this.bounds.yOffset = value;
                    this.dirty = true;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "xScale", {
                get: function () {
                    return this.bounds.xScale;
                },
                set: function (_value) {
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "yScale", {
                get: function () {
                    return this.bounds.yScale;
                },
                set: function (_value) {
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "xMirror", {
                get: function () {
                    return this.bounds.xMirror;
                },
                set: function (_value) {
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "yMirror", {
                get: function () {
                    return this.bounds.yMirror;
                },
                set: function (_value) {
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "angle", {
                get: function () {
                    return this.bounds.angle;
                },
                set: function (_value) {
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "useTouchRadius", {
                get: function () {
                    return this.bounds.useTouchRadius;
                },
                set: function (value) {
                    this.bounds.useTouchRadius = value;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "data", {
                get: function () {
                    return this.bounds.data;
                },
                set: function (value) {
                    this.bounds.data = value;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "mouseOver", {
                get: function () {
                    return this.bounds.mouseOver;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "touched", {
                get: function () {
                    return this.bounds.touched;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Dialog.prototype, "pointed", {
                get: function () {
                    return this.bounds.pointed;
                },
                enumerable: false,
                configurable: true
            });
            Dialog.prototype.pointInside = function (x, y, radius) {
                return this.bounds.pointInside(x, y, radius);
            };
            Dialog.prototype.onDrawDialogs = function () {
                this.render();
            };
            Dialog.prototype.render = function () {
                if (this.dirty) {
                    this.fix();
                    this.anchor.fix();
                }
                for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                    var sprite = _a[_i];
                    sprite.render();
                }
            };
            Dialog.prototype.fix = function () {
                var lengthArraySprites = this.frames.length > 9 ? 10 : 9;
                for (var indexSprite = 0; indexSprite < lengthArraySprites; indexSprite += 1) {
                    this.frames[indexSprite].applyToSprite(this.sprites[indexSprite]);
                }
                if (lengthArraySprites == 10) {
                    this._xSize = this._xSize < this.spriteIcon.xSize ? this.spriteIcon.xSize : this._xSize;
                    this._ySize = this._ySize < this.spriteIcon.ySize ? this.spriteIcon.ySize : this._ySize;
                }
                this.spriteTop.xSize = this._xSize;
                this.spriteBottom.xSize = this._xSize;
                this.spriteLeft.ySize = this._ySize;
                this.spriteRight.ySize = this._ySize;
                this.spriteMiddle.xSize = this._xSize;
                this.spriteMiddle.ySize = this._ySize;
                this.bounds.xSize = this.spriteLeft.xSize + this.spriteRight.xSize + this._xSize;
                this.bounds.ySize = this.spriteLeft.ySize + this.spriteBottom.ySize + this._ySize;
                this.spriteTopLeft.x = this.bounds.x;
                this.spriteTop.x = this.bounds.x + this.spriteTopLeft.xSize;
                this.spriteTopRight.x = this.bounds.x + this.spriteTopLeft.xSize + this.spriteTop.xSize;
                this.spriteLeft.x = this.bounds.x;
                this.spriteMiddle.x = this.bounds.x + this.spriteTopLeft.xSize;
                this.spriteRight.x = this.bounds.x + this.spriteTopLeft.xSize + this.spriteTop.xSize;
                this.spriteBottomLeft.x = this.bounds.x;
                this.spriteBottom.x = this.bounds.x + this.spriteTopLeft.xSize;
                this.spriteBottomRight.x = this.bounds.x + this.spriteTopLeft.xSize + this.spriteTop.xSize;
                this.spriteTopLeft.y = this.bounds.y;
                this.spriteLeft.y = this.bounds.y + this.spriteTopLeft.ySize;
                this.spriteBottomLeft.y = this.bounds.y + this.spriteTopLeft.ySize + this.spriteLeft.ySize;
                this.spriteTop.y = this.bounds.y;
                this.spriteMiddle.y = this.bounds.y + this.spriteTopLeft.ySize;
                this.spriteBottom.y = this.bounds.y + this.spriteTopLeft.ySize + this.spriteLeft.ySize;
                this.spriteTopRight.y = this.bounds.y;
                this.spriteRight.y = this.bounds.y + this.spriteTopLeft.ySize;
                this.spriteBottomRight.y = this.bounds.y + this.spriteTopLeft.ySize + this.spriteLeft.ySize;
                if (lengthArraySprites == 10) {
                    this.spriteIcon.x = this.bounds.x + this.spriteTopLeft.xSize;
                    this.spriteIcon.y = this.bounds.y + this.spriteTopLeft.ySize;
                }
                for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                    var sprite = _a[_i];
                    sprite.xOffset = this.xOffset;
                    sprite.yOffset = this.yOffset;
                }
            };
            //@ts-ignore
            Dialog.prototype.setRGBA = function (red, green, blue, alpha) {
            };
            return Dialog;
        }(Engine.Entity));
        UI.Dialog = Dialog;
    })(UI = Game.UI || (Game.UI = {}));
})(Game || (Game = {}));
///<reference path="Anchor.ts"/>
var Utils;
(function (Utils) {
    var Text = /** @class */ (function (_super) {
        __extends(Text, _super);
        function Text() {
            var _this = _super.call(this) || this;
            _this.sprites = new Array();
            _this.front = false;
            _this._enabled = false;
            _this._pinned = false;
            _this._str = null;
            _this._font = null;
            _this._underlined = false;
            _this._scale = 1;
            _this.superback = false;
            _this._bounds = new Engine.Sprite();
            _this.underline = new Engine.Sprite();
            _this.underline2 = new Engine.Sprite();
            _this.underline2.setRGBA(0, 0, 0, 1);
            _this._bounds.setRGBA(1, 1, 1, 0.2);
            return _this;
        }
        Text.prototype.setEnabled = function (value) {
            this._enabled = value;
            this._bounds.enabled = value;
            for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.enabled = false;
            }
            if (this._str != null) {
                for (var indexSprite = 0; indexSprite < this._str.length; indexSprite += 1) {
                    this.sprites[indexSprite].enabled = value;
                }
            }
            if (this._underlined) {
                this.underline.enabled = value;
                this.underline2.enabled = value;
            }
        };
        Object.defineProperty(Text.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "pinned", {
            get: function () {
                return this._pinned;
            },
            set: function (value) {
                this._pinned = value;
                this._bounds.pinned = value;
                for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                    var sprite = _a[_i];
                    sprite.pinned = value;
                }
                if (this._underlined) {
                    this.underline.pinned = value;
                    this.underline2.pinned = value;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "str", {
            get: function () {
                return this._str;
            },
            set: function (value) {
                this._str = value;
                this.fixStr();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "font", {
            get: function () {
                return this._font;
            },
            set: function (value) {
                this._font = value;
                this.fixStr();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "underlined", {
            get: function () {
                return this._underlined;
            },
            set: function (value) {
                this._underlined = value;
                this.fixStr();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Text.prototype, "scale", {
            get: function () {
                return this._scale;
            },
            set: function (value) {
                this._scale = value;
                this.fixStr();
            },
            enumerable: false,
            configurable: true
        });
        Text.prototype.setUnderlineShadowColor = function (red, green, blue, alpha) {
            this.underline2.setRGBA(red, green, blue, alpha);
        };
        Text.prototype.fixStr = function () {
            if (this._str != null && this._font != null) {
                for (var indexSprite = this.sprites.length; indexSprite < this._str.length; indexSprite += 1) {
                    this.sprites.push(new Engine.Sprite());
                }
                for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                    var sprite = _a[_i];
                    sprite.enabled = false;
                }
                var xSizeText = 0;
                for (var indexChar = 0; indexChar < this._str.length; indexChar += 1) {
                    var sprite = this.sprites[indexChar];
                    sprite.enabled = this._enabled;
                    sprite.pinned = this._pinned;
                    var charDef = this._font.frames[this._str.charCodeAt(indexChar) - " ".charCodeAt(0)];
                    sprite.setFull(this._enabled, this._pinned, this._font.texture, charDef.xSize * this._scale, this._font.ySize * this._scale, 0, 0, charDef.xTexture, charDef.yTexture, charDef.xSize, this._font.ySize);
                    xSizeText += sprite.xSize + this._font.xOffset * this._scale;
                }
                this._bounds.enabled = this._enabled;
                this._bounds.pinned = this._pinned;
                this._bounds.xSize = xSizeText - this._font.xOffset * this._scale;
                this._bounds.ySize = this._font.ySize * this._scale;
                if (this._underlined) {
                    this.underline.enabled = this._enabled;
                    this.underline.pinned = this._pinned;
                    this.underline.xSize = this._bounds.xSize;
                    this.underline.ySize = this._scale;
                    this.underline2.enabled = this._enabled;
                    this.underline2.pinned = this._pinned;
                    this.underline2.xSize = this._bounds.xSize;
                    this.underline2.ySize = this._scale;
                    this._bounds.ySize += this._scale * 2;
                }
                this.fix();
            }
        };
        Text.prototype.fix = function () {
            _super.prototype.fix.call(this);
            if (this._str != null && this._font != null) {
                var x = this._bounds.x;
                for (var indexChar = 0; indexChar < this._str.length; indexChar += 1) {
                    var sprite = this.sprites[indexChar];
                    sprite.x = x;
                    sprite.y = this._bounds.y;
                    x += sprite.xSize + this._font.xOffset * this._scale;
                }
                if (this._underlined) {
                    this.underline.x = this._bounds.x;
                    this.underline.y = this._bounds.y + this._bounds.ySize - this.scale;
                    this.underline2.x = this._bounds.x + this.scale;
                    this.underline2.y = this._bounds.y + this._bounds.ySize;
                }
            }
        };
        Text.prototype.onViewUpdateText = function () {
            this.fix();
        };
        Text.prototype.onDrawTextSuperBack = function () {
            if (this.superback) {
                //this._bounds.render();
                for (var indexSprite = 0; indexSprite < this.sprites.length; indexSprite += 1) {
                    this.sprites[indexSprite].render();
                }
                if (this._underlined) {
                    this.underline.render();
                    this.underline2.render();
                }
            }
        };
        Text.prototype.onDrawText = function () {
            if (!this.front && !this.superback) {
                //this._bounds.render();
                for (var indexSprite = 0; indexSprite < this.sprites.length; indexSprite += 1) {
                    this.sprites[indexSprite].render();
                }
                if (this._underlined) {
                    this.underline.render();
                    this.underline2.render();
                }
            }
        };
        Text.prototype.onDrawTextFront = function () {
            if (this.front && !this.superback) {
                //this._bounds.render();
                for (var indexSprite = 0; indexSprite < this.sprites.length; indexSprite += 1) {
                    this.sprites[indexSprite].render();
                }
                if (this._underlined) {
                    this.underline.render();
                    this.underline2.render();
                }
            }
        };
        return Text;
    }(Utils.Anchor));
    Utils.Text = Text;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
    var Animation = /** @class */ (function () {
        function Animation(name, loop, frames, steps, indexArray, stepArray) {
            this.loop = false;
            this.name = name;
            this.loop = loop;
            this.frames = frames;
            this.steps = steps;
            this.indexArray = indexArray;
            this.stepArray = stepArray;
        }
        return Animation;
    }());
    Utils.Animation = Animation;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
    var AnimationFrame = /** @class */ (function () {
        function AnimationFrame(texture, xTexture, yTexture, xSize, ySize, xOffset, yOffset, data, hasBox, xSizeBox, ySizeBox, xOffsetBox, yOffsetBox) {
            if (texture === void 0) { texture = null; }
            if (xTexture === void 0) { xTexture = 0; }
            if (yTexture === void 0) { yTexture = 0; }
            if (xSize === void 0) { xSize = 0; }
            if (ySize === void 0) { ySize = 0; }
            if (xOffset === void 0) { xOffset = 0; }
            if (yOffset === void 0) { yOffset = 0; }
            if (data === void 0) { data = null; }
            if (hasBox === void 0) { hasBox = false; }
            if (xSizeBox === void 0) { xSizeBox = 0; }
            if (ySizeBox === void 0) { ySizeBox = 0; }
            if (xOffsetBox === void 0) { xOffsetBox = 0; }
            if (yOffsetBox === void 0) { yOffsetBox = 0; }
            this.xTexture = 0;
            this.yTexture = 0;
            this.xSize = 0;
            this.ySize = 0;
            this.xOffset = 0;
            this.yOffset = 0;
            this.hasBox = false;
            this.xSizeBox = 0;
            this.ySizeBox = 0;
            this.xOffsetBox = 0;
            this.yOffsetBox = 0;
            this.texture = texture;
            this.xTexture = xTexture;
            this.yTexture = yTexture;
            this.xSize = xSize;
            this.ySize = ySize;
            this.xOffset = xOffset;
            this.yOffset = yOffset;
            this.data = data;
            this.hasBox = hasBox;
            this.xSizeBox = xSizeBox;
            this.ySizeBox = ySizeBox;
            this.xOffsetBox = xOffsetBox;
            this.yOffsetBox = yOffsetBox;
        }
        AnimationFrame.prototype.applyToSprite = function (sprite) {
            sprite.setFull(sprite.enabled, sprite.pinned, this.texture, this.xSize, this.ySize, this.xOffset, this.yOffset, this.xTexture, this.yTexture, this.xSize, this.ySize);
        };
        AnimationFrame.prototype.applyToBox = function (box) {
            if (this.hasBox) {
                box.xSize = this.xSizeBox;
                box.ySize = this.ySizeBox;
                box.xOffset = this.xOffsetBox;
                box.yOffset = this.yOffsetBox;
            }
        };
        AnimationFrame.prototype.getGeneric = function () {
            var generic = {};
            generic.xTexture = this.xTexture;
            generic.yTexture = this.yTexture;
            generic.xSize = this.xSize;
            generic.ySize = this.ySize;
            generic.xOffset = this.xOffset;
            generic.yOffset = this.yOffset;
            generic.hasBox = this.hasBox;
            generic.xSizeBox = this.xSizeBox;
            generic.ySizeBox = this.ySizeBox;
            generic.xOffsetBox = this.xOffsetBox;
            generic.yOffsetBox = this.yOffsetBox;
            return generic;
        };
        return AnimationFrame;
    }());
    Utils.AnimationFrame = AnimationFrame;
})(Utils || (Utils = {}));
var Utils;
(function (Utils) {
    var Animator = /** @class */ (function (_super) {
        __extends(Animator, _super);
        function Animator() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.indexFrame = 0;
            _this.countSteps = 0;
            _this.cycles = 0;
            _this.off = 0;
            return _this;
        }
        Object.defineProperty(Animator.prototype, "ended", {
            get: function () {
                return this.cycles > 0;
            },
            enumerable: false,
            configurable: true
        });
        Animator.prototype.setoff = function (off) {
            this.off = off;
            this.setCurrentFrame();
        };
        Animator.prototype.setCurrentFrame = function () {
            if (this.animation != null) {
                var indexFrame = this.animation.indexArray != null ? this.animation.indexArray[this.indexFrame] : this.indexFrame;
                var frame = this.animation.frames[indexFrame + this.off];
                if (this.listener != null) {
                    this.listener.onSetFrame(this, this.animation, frame);
                }
            }
        };
        Animator.prototype.setAnimation = function (animation, preserveStatus) {
            if (preserveStatus === void 0) { preserveStatus = false; }
            this.animation = animation;
            if (!preserveStatus) {
                this.indexFrame = 0;
                this.countSteps = 0;
                this.cycles = 0;
            }
            this.setCurrentFrame();
        };
        Animator.prototype.onAnimationUpdate = function () {
            if (!Game.SceneFreezer.stoped && this.animation != null && (this.animation.loop || this.cycles < 1)) {
                var indexFrame = this.animation.indexArray != null ? this.animation.indexArray[this.indexFrame] : this.indexFrame;
                var steps = this.animation.stepArray != null ? this.animation.stepArray[indexFrame] : this.animation.steps;
                if (this.countSteps >= steps) {
                    this.countSteps = 0;
                    this.indexFrame += 1;
                    var length = this.animation.indexArray != null ? this.animation.indexArray.length : this.animation.frames.length;
                    if (this.indexFrame >= length) {
                        this.indexFrame = this.animation.loop ? 0 : length - 1;
                        this.cycles += 1;
                    }
                    this.setCurrentFrame();
                }
                this.countSteps += 1;
            }
        };
        return Animator;
    }(Engine.Entity));
    Utils.Animator = Animator;
})(Utils || (Utils = {}));
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var Control = /** @class */ (function (_super) {
        __extends(Control, _super);
        function Control() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._enabled = false;
            _this._selected = false;
            _this._url = null;
            _this.linkCondition = function () { return true; };
            _this.onLinkTrigger = null;
            _this.useMouse = false;
            _this.useKeyboard = false;
            _this.useTouch = false;
            _this.newInteractionRequired = false;
            _this.blockOthersSelection = false;
            _this.freezeable = false;
            _this._firstDown = false;
            _this._firstUp = false;
            _this.firstUpdate = false;
            _this._downSteps = 0;
            _this._stepsSincePressed = 0;
            _this._upSteps = 0;
            _this._stepsSinceReleased = 0;
            _this._touchDown = false;
            return _this;
        }
        Object.defineProperty(Control.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                this.setEnabled(value);
            },
            enumerable: false,
            configurable: true
        });
        Control.prototype.setEnabled = function (value) {
            var oldEnabled = this.enabled;
            this._enabled = value;
            if (value != oldEnabled) {
                if (value) {
                    this.onEnable();
                }
                else {
                    if (this._selected) {
                        this._selected = false;
                        if (this._url != null) {
                            Engine.LinkManager.remove(this, this._url);
                        }
                        this.onSelectionEnd();
                    }
                    this.onDisable();
                }
            }
        };
        Object.defineProperty(Control.prototype, "selected", {
            get: function () {
                return this._selected;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "url", {
            get: function () {
                return this._url;
            },
            set: function (value) {
                if (this._url != null) {
                    Engine.LinkManager.remove(this, this._url);
                }
                this._url = value;
                if (this._url != null) {
                    Engine.LinkManager.add(this, this._url);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "downSteps", {
            get: function () {
                return this._downSteps;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "stepsSincePressed", {
            get: function () {
                return this._stepsSincePressed;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "pressed", {
            get: function () {
                return this._downSteps == 1;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "down", {
            get: function () {
                return this._downSteps > 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "upSteps", {
            get: function () {
                return this._upSteps;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "stepsSinceReleased", {
            get: function () {
                return this._stepsSinceReleased;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "released", {
            get: function () {
                return this._upSteps == 1;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "up", {
            get: function () {
                return !this.down;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "touchDown", {
            get: function () {
                return this._touchDown;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "touchPressed", {
            get: function () {
                return this._touchDown && this.pressed;
            },
            enumerable: false,
            configurable: true
        });
        Control.prototype.onEnable = function () {
            if (this.onEnableDelegate != null) {
                this.onEnableDelegate.call(this.listener);
            }
        };
        Control.prototype.onDisable = function () {
            if (this.onDisableDelegate != null) {
                this.onDisableDelegate.call(this.listener);
            }
        };
        Control.prototype.onSelectionStart = function () {
            if (this.audioSelected != null && this.firstUpdate && !this.touchSelected) {
                this.audioSelected.play();
            }
            if (this.onSelectionStartDelegate != null) {
                this.onSelectionStartDelegate.call(this.listener);
            }
        };
        Control.prototype.onSelectionStay = function () {
            if (this.onSelectionStayDelegate != null) {
                this.onSelectionStayDelegate.call(this.listener);
            }
        };
        Control.prototype.onSelectionEnd = function () {
            if (this.onSelectionEndDelegate != null) {
                this.onSelectionEndDelegate.call(this.listener);
            }
        };
        Control.prototype.onPressed = function () {
            if (this.audioPressed != null) {
                this.audioPressed.play();
            }
            if (this.onPressedDelegate != null) {
                this.onPressedDelegate.call(this.listener);
            }
        };
        Control.prototype.onReleased = function () {
            if (this.onReleasedDelegate != null) {
                this.onReleasedDelegate.call(this.listener);
            }
        };
        //TODO: Not optimal, change it
        Control.prototype.onClearScene = function () {
            if (this.url != null) {
                Engine.LinkManager.remove(this, this._url);
            }
        };
        //TODO: Not optimal, change it
        Control.prototype.onControlPreUpdate = function () {
            Control.selectionBlocker = null;
        };
        Control.prototype.onControlUpdate = function () {
            if (Game.LevelAdLoader.instance != null && Game.LevelAdLoader.blocked) {
                return;
            }
            var oldSelected = this._selected;
            this.mouseSelected = false;
            this.touchSelected = false;
            if (this.enabled) {
                this.mouseSelected = this.useMouse && (this.bounds == null || this.bounds.mouseOver);
                this.touchSelected = this.useTouch && (this.bounds == null || this.bounds.touched);
                if ((this.freezeable && Game.SceneFreezer.stoped) || Control.selectionBlocker != null) {
                    this.mouseSelected = false;
                    this.touchSelected = false;
                }
                if (!this._selected && (this.mouseSelected || this.touchSelected)) {
                    this._selected = true;
                    this.onSelectionStart();
                }
                else if (this._selected && !(this.mouseSelected || this.touchSelected)) {
                    this._selected = false;
                    this.onSelectionEnd();
                }
                if (this._selected && this.blockOthersSelection) {
                    Control.selectionBlocker = this;
                }
                var used = false;
                if (this.mouseSelected && this.mouseButtons != null) {
                    for (var _i = 0, _a = this.mouseButtons; _i < _a.length; _i++) {
                        var buttonIndex = _a[_i];
                        if (this.newInteractionRequired) {
                            used = this._downSteps == 0 ? Engine.Mouse.pressed(buttonIndex) : Engine.Mouse.down(buttonIndex);
                        }
                        else {
                            used = Engine.Mouse.down(buttonIndex);
                        }
                        if (used) {
                            break;
                        }
                    }
                }
                var touchUsed = false;
                if (this.touchSelected) {
                    if (this.newInteractionRequired) {
                        if (this.bounds != null) {
                            touchUsed = this._downSteps == 0 ? this.bounds.pointed : this.bounds.touched;
                        }
                        else {
                            if (this._downSteps == 0) {
                                touchUsed = Engine.TouchInput.pressed(0, 0, Engine.Renderer.xSizeWindow, Engine.Renderer.ySizeWindow, true);
                            }
                            else {
                                touchUsed = Engine.TouchInput.down(0, 0, Engine.Renderer.xSizeWindow, Engine.Renderer.ySizeWindow, true);
                            }
                        }
                    }
                    else {
                        if (this.bounds != null) {
                            touchUsed = this.bounds.touched;
                        }
                        else {
                            touchUsed = Engine.TouchInput.down(0, 0, Engine.Renderer.xSizeWindow, Engine.Renderer.ySizeWindow, true);
                        }
                    }
                    used = used || touchUsed;
                }
                if (!used && this.useKeyboard && !(this.freezeable && Game.SceneFreezer.stoped)) {
                    for (var _b = 0, _c = this.keys; _b < _c.length; _b++) {
                        var key = _c[_b];
                        if (this.newInteractionRequired) {
                            used = this._downSteps == 0 ? Engine.Keyboard.pressed(key) : Engine.Keyboard.down(key);
                        }
                        else {
                            used = Engine.Keyboard.down(key);
                        }
                        if (used) {
                            break;
                        }
                    }
                }
                if (used) {
                    this._firstDown = true;
                    this._downSteps += 1;
                    this._upSteps = 0;
                    this._touchDown = touchUsed;
                    if (this.pressed) {
                        this._stepsSincePressed = 0;
                        this.onPressed();
                    }
                }
                else if (this._firstDown) {
                    this._firstUp = true;
                    this._downSteps = 0;
                    this._upSteps += 1;
                    this._touchDown = false;
                    if (this.released) {
                        this._stepsSinceReleased = 0;
                        this.onReleased();
                    }
                }
                if (this._firstDown) {
                    this._stepsSincePressed += 1;
                }
                if (this._firstUp) {
                    this._stepsSinceReleased += 1;
                }
            }
            if (this._selected && oldSelected) {
                this.onSelectionStay();
            }
            this.firstUpdate = true;
        };
        Control.selectionBlocker = null;
        return Control;
    }(Engine.Entity));
    Game.Control = Control;
})(Game || (Game = {}));
/*

        protected onControlUpdate(){
            var oldSelected = this._selected;
            if(this.enabled){
                var mouseSelected = this.useMouse && (this.bounds == null || this.bounds.mouseOver);
                var boundsTouched = false;
                if(this.useTouch && this.bounds != null){
                    if(this.newInteractionRequired){
                        boundsTouched = this._downSteps == 0 ? this.bounds.pointed : this.bounds.touched;
                    }
                    else{
                        boundsTouched = this.bounds.touched;
                    }
                }
                else if(this.useTouch && this.bounds == null){
                    if(this.newInteractionRequired){
                        if(this._downSteps == 0){
                            boundsTouched = Engine.TouchInput.down(0, 0, Engine.Renderer.xSizeWindow, Engine.Renderer.ySizeWindow, true);
                        }
                        else{

                        }
                    }
                    else{
                        
                    }

                    
                }
                var touchSelected = boundsTouched || (this.useTouch && this.bounds == null);
                if((this.freezeable && Scene.freezed) || Control.selectionBlocker != null){
                    mouseSelected = false;
                    boundsTouched = false;
                    touchSelected = false;
                }
                if(!this._selected && (mouseSelected || touchSelected)){
                    this._selected = true;
                    if(this._url != null){
                        Engine.LinkManager.add(this, this._url);
                    }
                    this.onSelectionStart();
                }
                else if(this._selected && !(mouseSelected || touchSelected)){
                    this._selected = false;
                    if(this._url != null){
                        Engine.LinkManager.remove(this, this._url);
                    }
                    this.onSelectionEnd();
                }
                if(this._selected && this.blockOthersSelection){
                    Control.selectionBlocker = this;
                }
                var used = false;
                if(mouseSelected && this.mouseButtons != null){
                    for(var buttonIndex of this.mouseButtons){
                        if(this.newInteractionRequired){
                            used = this._downSteps == 0 ? Engine.Mouse.pressed(buttonIndex) : Engine.Mouse.down(buttonIndex);
                        }
                        else{
                            used = Engine.Mouse.down(buttonIndex);
                        }
                        if(used){
                            break;
                        }
                    }
                }
                var touchUsed = false;
                if(this.useTouch && touchSelected){
                    if(this.bounds == null){
                        touchUsed = Engine.TouchInput.down(0, 0, Engine.Renderer.xSizeWindow, Engine.Renderer.ySizeWindow, true);
                    }
                    else{
                        touchUsed = boundsTouched;
                    }
                    used = used || touchUsed;
                }
                if(!used && this.useKeyboard && !(this.freezeable && Scene.freezed)){
                    for(var key of this.keys){
                        if(this.newInteractionRequired){
                            used = this._downSteps == 0 ? Engine.Keyboard.pressed(key) : Engine.Keyboard.down(key);
                        }
                        else{
                            used = Engine.Keyboard.down(key);
                        }
                        if(used){
                            break;
                        }
                    }
                }
                if(used){
                    this._firstDown = true;
                    this._downSteps += 1;
                    this._upSteps = 0;
                    this._touchDown = touchUsed;
                    if(this.pressed){
                        this._stepsSincePressed = 0;
                        this.onPressed();
                    }
                }
                else if(this._firstDown){
                    this._firstUp = true;
                    this._downSteps = 0;
                    this._upSteps += 1;
                    if(this.released){
                        this._stepsSinceReleased = 0;
                        this.onReleased();
                    }
                }
                if(!this.pressed){
                     = false;
                }
                if(this._firstDown){
                    this._stepsSincePressed += 1;
                }
                if(this._firstUp){
                    this._stepsSinceReleased += 1;
                }
            }
            if(this._selected && oldSelected){
                this.onSelectionStay();
            }
        }
    }
}
*/ 
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var Dialog = /** @class */ (function (_super) {
        __extends(Dialog, _super);
        function Dialog(x, y, xSize, ySize) {
            var _this = _super.call(this) || this;
            _this.up = new Engine.Sprite();
            _this.left = new Engine.Sprite();
            _this.down = new Engine.Sprite();
            _this.right = new Engine.Sprite();
            _this.fill = new Engine.Sprite();
            _this.rightBand = new Engine.Sprite();
            _this.downBand = new Engine.Sprite();
            _this.upAnchor = new Utils.Anchor();
            _this.leftAnchor = new Utils.Anchor();
            _this.rightAnchor = new Utils.Anchor();
            _this.downAnchor = new Utils.Anchor();
            _this.fillAnchor = new Utils.Anchor();
            _this.rightBandAnchor = new Utils.Anchor();
            _this.downBandAnchor = new Utils.Anchor();
            _this.x = x;
            _this.y = y;
            _this.up.enabled = true;
            _this.up.pinned = true;
            _this.up.xSize = xSize - 2;
            _this.up.ySize = 1;
            _this.upAnchor.bounds = _this.up;
            _this.upAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.upAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.upAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.upAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.upAnchor.xAligned = x + 1 - xSize * 0.5;
            _this.upAnchor.yAligned = y;
            _this.left.enabled = true;
            _this.left.pinned = true;
            _this.left.xSize = 1;
            _this.left.ySize = ySize - 2;
            _this.leftAnchor.bounds = _this.left;
            _this.leftAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.leftAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.leftAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.leftAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.leftAnchor.xAligned = x - xSize * 0.5;
            _this.leftAnchor.yAligned = y + 1;
            _this.down.enabled = true;
            _this.down.pinned = true;
            _this.down.xSize = xSize - 2;
            _this.down.ySize = 1;
            _this.downAnchor.bounds = _this.down;
            _this.downAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.downAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.downAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.downAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.downAnchor.xAligned = x + 1 - xSize * 0.5;
            _this.downAnchor.yAligned = y + ySize - 1;
            _this.downBand.enabled = true;
            _this.downBand.pinned = true;
            _this.downBand.xSize = xSize - 3;
            _this.downBand.ySize = 1;
            _this.downBandAnchor.bounds = _this.downBand;
            _this.downBandAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.downBandAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.downBandAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.downBandAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.downBandAnchor.xAligned = x + 2 - xSize * 0.5;
            _this.downBandAnchor.yAligned = y + ySize - 2;
            _this.right.enabled = true;
            _this.right.pinned = true;
            _this.right.xSize = 1;
            _this.right.ySize = ySize - 2;
            _this.rightAnchor.bounds = _this.right;
            _this.rightAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.rightAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.rightAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.rightAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.rightAnchor.xAligned = x + xSize * 0.5 - 1;
            _this.rightAnchor.yAligned = y + 1;
            _this.rightBand.enabled = true;
            _this.rightBand.pinned = true;
            _this.rightBand.xSize = 1;
            _this.rightBand.ySize = ySize - 3;
            _this.rightBandAnchor.bounds = _this.rightBand;
            _this.rightBandAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.rightBandAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.rightBandAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.rightBandAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.rightBandAnchor.xAligned = x + xSize * 0.5 - 2;
            _this.rightBandAnchor.yAligned = y + 2;
            _this.fill.enabled = true;
            _this.fill.pinned = true;
            _this.fill.xSize = xSize - 2;
            _this.fill.ySize = ySize - 2;
            _this.fillAnchor.bounds = _this.fill;
            _this.fillAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.fillAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.fillAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.fillAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.fillAnchor.xAligned = x - xSize * 0.5 + 1;
            _this.fillAnchor.yAligned = y + 1;
            return _this;
        }
        Object.defineProperty(Dialog.prototype, "enabled", {
            set: function (value) {
                this.up.enabled = value;
                this.left.enabled = value;
                this.down.enabled = value;
                this.right.enabled = value;
                this.fill.enabled = value;
                this.rightBand.enabled = value;
                this.downBand.enabled = value;
            },
            enumerable: false,
            configurable: true
        });
        Dialog.prototype.setBorderColor = function (red, green, blue, alpha) {
            this.up.setRGBA(red, green, blue, alpha);
            this.left.setRGBA(red, green, blue, alpha);
            this.right.setRGBA(red, green, blue, alpha);
            this.down.setRGBA(red, green, blue, alpha);
        };
        Dialog.prototype.setFillColor = function (red, green, blue, alpha) {
            this.fill.setRGBA(red, green, blue, alpha);
        };
        Dialog.prototype.setBandColor = function (red, green, blue, alpha) {
            this.rightBand.setRGBA(red, green, blue, alpha);
            this.downBand.setRGBA(red, green, blue, alpha);
        };
        Dialog.prototype.onDrawDialogs = function () {
            this.up.render();
            this.left.render();
            this.right.render();
            this.down.render();
            this.fill.render();
            this.rightBand.render();
            this.downBand.render();
        };
        return Dialog;
    }(Engine.Entity));
    Game.Dialog = Dialog;
    var ColorDialog = /** @class */ (function (_super) {
        __extends(ColorDialog, _super);
        function ColorDialog(style, x, y, xSize, ySize) {
            var _this = _super.call(this, x, y, xSize, ySize) || this;
            _this.style = style;
            return _this;
        }
        Object.defineProperty(ColorDialog.prototype, "style", {
            get: function () {
                return this._style;
            },
            set: function (style) {
                this._style = style;
                switch (style) {
                    case "blue":
                        //this.setBorderColor(0 / 255, 88 / 255, 0 / 255, 1);
                        //this.setFillColor(0 / 255, 168 / 255, 0 / 255, 1);
                        //this.setBorderColor(0 / 255, 0 / 255, 188 / 255, 1);
                        //this.setFillColor(0 / 255, 88 / 255, 248 / 255, 1);
                        this.setBorderColor(255 / 255, 255 / 255, 255 / 255, 1);
                        this.setFillColor(0 / 255, 0 / 255, 0 / 255, 1);
                        //this.setBorderColor(0 / 255, 0 / 255, 0 / 255, 1);
                        //this.setFillColor(0 / 255, 120 / 255, 255 / 255, 1);
                        this.setBandColor(0 / 255, 0 / 255, 0 / 255, 1);
                        break;
                    case "purple":
                        this.setBorderColor(184 / 255, 248 / 255, 24 / 255, 1);
                        this.setFillColor(0 / 255, 0 / 0, 0 / 0, 1);
                        this.setBandColor(0 / 255, 0 / 255, 0 / 255, 1);
                        break;
                    case "clearblue":
                        //this.setBorderColor(104 / 255, 136 / 255, 252 / 255, 1);
                        this.setBorderColor(0 / 255, 0 / 255, 0 / 255, 1);
                        this.setFillColor(0 / 255, 0 / 255, 0 / 255, 1);
                        this.setBandColor(0 / 255, 0 / 255, 0 / 255, 1);
                        break;
                }
            },
            enumerable: false,
            configurable: true
        });
        return ColorDialog;
    }(Dialog));
    Game.ColorDialog = ColorDialog;
})(Game || (Game = {}));
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    Game.MAX = 0.3;
    Game.LOAD_VELOCITY = 1.0;
    var LoadingBar = /** @class */ (function (_super) {
        __extends(LoadingBar, _super);
        function LoadingBar(y, xSize, ySize) {
            var _this = _super.call(this) || this;
            _this.up = new Engine.Sprite();
            _this.left = new Engine.Sprite();
            _this.right = new Engine.Sprite();
            _this.down = new Engine.Sprite();
            _this.fill = new Engine.Sprite();
            _this.upShadow = new Engine.Sprite();
            _this.leftShadow = new Engine.Sprite();
            _this.rightShadow = new Engine.Sprite();
            _this.downShadow = new Engine.Sprite();
            _this.upAnchor = new Utils.Anchor();
            _this.leftAnchor = new Utils.Anchor();
            _this.rightAnchor = new Utils.Anchor();
            _this.downAnchor = new Utils.Anchor();
            _this.fillAnchor = new Utils.Anchor();
            _this.upShadowAnchor = new Utils.Anchor();
            _this.leftShadowAnchor = new Utils.Anchor();
            _this.rightShadowAnchor = new Utils.Anchor();
            _this.downShadowAnchor = new Utils.Anchor();
            _this.loadCount = 0;
            if (Game.startingSceneClass != Game.MainMenu) {
                Game.LOAD_VELOCITY *= 60000;
            }
            _this.up.enabled = true;
            _this.up.pinned = true;
            _this.up.xSize = xSize - 2;
            _this.up.ySize = 1;
            _this.upAnchor.bounds = _this.up;
            _this.upAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.upAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.upAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.upAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.upAnchor.xAligned = 1 - xSize * 0.5;
            _this.upAnchor.yAligned = y;
            _this.upShadow.enabled = true;
            _this.upShadow.pinned = true;
            _this.upShadow.xSize = xSize - 2;
            _this.upShadow.ySize = 1;
            _this.upShadowAnchor.bounds = _this.upShadow;
            _this.upShadowAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.upShadowAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.upShadowAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.upShadowAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.upShadowAnchor.xAligned = 2 - xSize * 0.5;
            _this.upShadowAnchor.yAligned = y + 1;
            _this.left.enabled = true;
            _this.left.pinned = true;
            _this.left.xSize = 1;
            _this.left.ySize = ySize - 2;
            _this.leftAnchor.bounds = _this.left;
            _this.leftAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.leftAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.leftAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.leftAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.leftAnchor.xAligned = -xSize * 0.5;
            _this.leftAnchor.yAligned = y + 1;
            _this.leftShadow.enabled = true;
            _this.leftShadow.pinned = true;
            _this.leftShadow.xSize = 1;
            _this.leftShadow.ySize = ySize - 2;
            _this.leftShadowAnchor.bounds = _this.leftShadow;
            _this.leftShadowAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.leftShadowAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.leftShadowAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.leftShadowAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.leftShadowAnchor.xAligned = -xSize * 0.5 + 1;
            _this.leftShadowAnchor.yAligned = y + 2;
            _this.down.enabled = true;
            _this.down.pinned = true;
            _this.down.xSize = xSize - 2;
            _this.down.ySize = 1;
            _this.downAnchor.bounds = _this.down;
            _this.downAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.downAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.downAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.downAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.downAnchor.xAligned = 1 - xSize * 0.5;
            _this.downAnchor.yAligned = y + ySize - 1;
            _this.downShadow.enabled = true;
            _this.downShadow.pinned = true;
            _this.downShadow.xSize = xSize - 2;
            _this.downShadow.ySize = 1;
            _this.downShadowAnchor.bounds = _this.downShadow;
            _this.downShadowAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.downShadowAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.downShadowAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.downShadowAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.downShadowAnchor.xAligned = 2 - xSize * 0.5;
            _this.downShadowAnchor.yAligned = y + ySize;
            _this.right.enabled = true;
            _this.right.pinned = true;
            _this.right.xSize = 1;
            _this.right.ySize = ySize - 2;
            _this.rightAnchor.bounds = _this.right;
            _this.rightAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.rightAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.rightAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.rightAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.rightAnchor.xAligned = xSize * 0.5 - 1;
            _this.rightAnchor.yAligned = y + 1;
            _this.rightShadow.enabled = true;
            _this.rightShadow.pinned = true;
            _this.rightShadow.xSize = 1;
            _this.rightShadow.ySize = ySize - 2;
            _this.rightShadowAnchor.bounds = _this.rightShadow;
            _this.rightShadowAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.rightShadowAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.rightShadowAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.rightShadowAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.rightShadowAnchor.xAligned = xSize * 0.5;
            _this.rightShadowAnchor.yAligned = y + 2;
            _this.fill.enabled = true;
            _this.fill.pinned = true;
            _this.fill.xSize = 0;
            _this.fill.ySize = ySize;
            _this.fillAnchor.bounds = _this.fill;
            _this.fillAnchor.xAlignBounds = Utils.AnchorAlignment.START;
            _this.fillAnchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.fillAnchor.yAlignBounds = Utils.AnchorAlignment.START;
            _this.fillAnchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.fillAnchor.xAligned = -xSize * 0.5 + 1;
            _this.fillAnchor.yAligned = y;
            _this.loadSize = xSize - 2;
            return _this;
        }
        Object.defineProperty(LoadingBar.prototype, "full", {
            get: function () {
                return this.fill.xSize == this.loadSize;
            },
            enumerable: false,
            configurable: true
        });
        LoadingBar.prototype.setColor = function (red, green, blue, alpha) {
            this.up.setRGBA(red, green, blue, alpha);
            this.left.setRGBA(red, green, blue, alpha);
            this.right.setRGBA(red, green, blue, alpha);
            this.down.setRGBA(red, green, blue, alpha);
            this.fill.setRGBA(red, green, blue, alpha);
        };
        LoadingBar.prototype.setShadowColor = function (red, green, blue, alpha) {
            this.upShadow.setRGBA(red, green, blue, alpha);
            this.leftShadow.setRGBA(red, green, blue, alpha);
            this.rightShadow.setRGBA(red, green, blue, alpha);
            this.downShadow.setRGBA(red, green, blue, alpha);
        };
        LoadingBar.prototype.onStepUpdate = function () {
            var max = Game.MAX;
            if (max < Engine.Assets.downloadedRatio) {
                max = Engine.Assets.downloadedRatio;
            }
            max *= this.loadSize;
            this.loadCount += Game.LOAD_VELOCITY;
            if (this.loadCount > max) {
                this.loadCount = max;
            }
            this.fill.xSize = Math.floor(this.loadCount);
            this.leftShadowAnchor.xAligned = -(this.loadSize + 2) * 0.5 + 1 + this.fill.xSize;
        };
        LoadingBar.prototype.onDrawDialogs = function () {
            this.upShadow.render();
            this.leftShadow.render();
            this.rightShadow.render();
            this.downShadow.render();
            this.up.render();
            this.left.render();
            this.right.render();
            this.down.render();
            this.fill.render();
        };
        return LoadingBar;
    }(Engine.Entity));
    Game.LoadingBar = LoadingBar;
})(Game || (Game = {}));
/*
void init_bar_loading(float x, float y, float size_x, float size_y, float centered_x, float centered_y, float int_centered){
    game->canvases_bar_loading = require_any_memory(&game_memory, sizeof(struct game_engine_canvas) * MAX_CANVASES_BAR_LOADING);
    for(int index_canvas = 0; index_canvas < MAX_CANVASES_BAR_LOADING; index_canvas += 1){
         init_canvas(&game->canvases_bar_loading[index_canvas], 1);
    }
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_ST], 0, 0, 0, POSITION_X_TEXTURE_BLUE, POSITION_Y_TEXTURE_BLUE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_ST].x = x + 2;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_ST].y = y + 1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_ST].size_x = size_x - 1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_ST].size_y = 1;
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_SL], 0, 0, 0, POSITION_X_TEXTURE_BLUE, POSITION_Y_TEXTURE_BLUE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SL].x = x + 1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SL].y = y + 2;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SL].size_x = 1.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SL].size_y = size_y - 1;
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_SR], 0, 0, 0, POSITION_X_TEXTURE_BLUE, POSITION_Y_TEXTURE_BLUE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SR].x = x + 2 + size_x - 0.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SR].y = y + 2;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SR].size_x = 1.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SR].size_y = size_y;
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_SB], 0, 0, 0, POSITION_X_TEXTURE_BLUE, POSITION_Y_TEXTURE_BLUE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SB].x = x + 2;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SB].y = y + 2 + size_y - 0.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SB].size_x = size_x;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SB].size_y = 1.1;
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_T], 0, 0, 0, POSITION_X_TEXTURE_WHITE, POSITION_Y_TEXTURE_WHITE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_T].x = x + 1 - 0.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_T].y = y;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_T].size_x = size_x + 0.2;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_T].size_y = 1.1;
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_L], 0, 0, 0, POSITION_X_TEXTURE_WHITE, POSITION_Y_TEXTURE_WHITE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_L].x = x;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_L].y = y + 1 - 0.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_L].size_x = 1.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_L].size_y = size_y + 0.2;
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_R], 0, 0, 0, POSITION_X_TEXTURE_WHITE, POSITION_Y_TEXTURE_WHITE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_R].x = x + 1 + size_x - 0.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_R].y = y + 1 - 0.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_R].size_x = 1.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_R].size_y = size_y + 0.2;
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_B], 0, 0, 0, POSITION_X_TEXTURE_WHITE, POSITION_Y_TEXTURE_WHITE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_B].x = x + 1 - 0.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_B].y = y + 1 + size_y - 0.1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_B].size_x = size_x + 0.2;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_B].size_y = 1.1;
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_SF], 0, 0, 0, POSITION_X_TEXTURE_BLUE, POSITION_Y_TEXTURE_BLUE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SF].x = x + 1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SF].y = y + 1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SF].size_x = 0;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SF].size_y = size_y + 1;
    set_canvas_graph(&game->canvases_bar_loading[CANVAS_BAR_LOADING_F], 0, 0, 0, POSITION_X_TEXTURE_WHITE, POSITION_Y_TEXTURE_WHITE, 1, 1);
    game->canvases_bar_loading[CANVAS_BAR_LOADING_F].x = x + 1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_F].y = y + 1;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_F].size_x = 0;
    game->canvases_bar_loading[CANVAS_BAR_LOADING_F].size_y = size_y;
    for(int index_canvas = 0; index_canvas < MAX_CANVASES_BAR_LOADING; index_canvas += 1){
         game->canvases_bar_loading[index_canvas].x -= centered_x ? (int_centered ? (int)((size_x + 3) * 0.5) : (size_x + 3) * 0.5) : 0;
         game->canvases_bar_loading[index_canvas].y -= centered_y ? (int_centered ? (int)((size_y + 3) * 0.5) : (size_y + 3) * 0.5) : 0;
    }
}

void set_value_bar_loading(float value, float size_x){
    game->canvases_bar_loading[CANVAS_BAR_LOADING_F].size_x = (int)(value / (1.0 / size_x));
    game->canvases_bar_loading[CANVAS_BAR_LOADING_SF].size_x = game->canvases_bar_loading[CANVAS_BAR_LOADING_F].size_x + 1;
}

void draw_bar_loading(){
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_SF], 1);
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_ST], 1);
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_SL], 1);
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_SR], 1);
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_SB], 1);
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_F], 1);
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_T], 1);
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_L], 1);
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_R], 1);
    draw_canvases(&game->canvases_bar_loading[CANVAS_BAR_LOADING_B], 1);
}

*/ 
///<reference path = "../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var Transform = /** @class */ (function (_super) {
        __extends(Transform, _super);
        function Transform() {
            var _this = _super.call(this) || this;
            _this._x = 0;
            _this._y = 0;
            _this._xLocal = 0;
            _this._yLocal = 0;
            _this._parent = null;
            _this._parentRelative = true;
            _this._children = [];
            return _this;
        }
        Object.defineProperty(Transform.prototype, "x", {
            get: function () {
                return this._x;
            },
            set: function (value) {
                this._x = value;
                if (this._parent != null && this._parentRelative) {
                    this._xLocal = this._x - this._parent.x;
                }
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child.xLocal = child._xLocal;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "y", {
            get: function () {
                return this._y;
            },
            set: function (value) {
                this._y = value;
                if (this._parent != null && this._parentRelative) {
                    this._yLocal = this._y - this._parent.y;
                }
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child.yLocal = child._yLocal;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "xLocal", {
            get: function () {
                return this._xLocal;
            },
            set: function (value) {
                this._xLocal = value;
                if (this._parent != null && this._parentRelative) {
                    this._x = this._parent._x + this._xLocal;
                }
                else {
                    this._x = this._xLocal;
                }
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child.xLocal = child._xLocal;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "yLocal", {
            get: function () {
                return this._yLocal;
            },
            set: function (value) {
                this._yLocal = value;
                if (this._parent != null && this._parentRelative) {
                    this._y = this._parent._y + this._yLocal;
                }
                else {
                    this._y = this._yLocal;
                }
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child.yLocal = child._yLocal;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            set: function (value) {
                if (this._parent != null) {
                    this._parent._children.splice(this._parent._children.indexOf(this), 1);
                }
                try {
                    this._parent = value;
                    this.x = this._x;
                    this.y = this._y;
                }
                catch (e) {
                    console.error(e);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "parentRelative", {
            get: function () {
                return this._parentRelative;
            },
            set: function (value) {
                this._parentRelative = value;
                this.x = this._x;
                this.y = this._y;
            },
            enumerable: false,
            configurable: true
        });
        return Transform;
    }(Engine.Entity));
    Game.Transform = Transform;
})(Game || (Game = {}));
/*
///<reference path = "../Transform.ts"/>
namespace Game.Emission{
    export class Emitter extends Transform{
        public enabled = true;

        protected stepsFirstEmitt = 0;
        protected stepsRepeatEmitt = 5;
        protected loop = true;
        protected sizeEmission = 1;

        public xMirror = false;
        public get xDir(){
            return this.xMirror ? -1 : 1;
        }
        public yMirror = false;
        public get yDir(){
            return this.yMirror ? -1 : 1;
        }
        
        private countStepsEmitt : number;
        private indexArrayParticle : number;
        private indexEmissionParticle : number;

        private particles : Array<BaseParticle>;

        public constructor(def : any, particleClass : typeof BaseParticle, countParticles : number){
            super(def);
            this.particles = [];
            for(var indexCount = 0; indexCount < countParticles; indexCount += 1){
                var particle = new particleClass(this);
                particle.parent = this;
                this.particles.push(particle);
            }
        }

        protected onReset(){
            this.countStepsEmitt = this.stepsFirstEmitt;
            this.indexArrayParticle = 0;
            this.indexEmissionParticle = 0;
        }

        protected onStepUpdate(){
            if(!SceneFreezer.stoped && this.enabled && (this.indexArrayParticle < this.particles.length || this.loop)){
                if(this.countStepsEmitt <= 0){
                    for(var indexEmitt = 0; indexEmitt < this.sizeEmission; indexEmitt += 1){
                        this.emittParticle();
                        if(!this.loop && this.indexArrayParticle >= this.particles.length){
                            break;
                        }
                    }
                    this.countStepsEmitt = this.stepsRepeatEmitt;
                }
                else{
                    this.countStepsEmitt -= 1;
                }
            }
        }

        protected emittParticle(){
            if(this.indexArrayParticle < this.particles.length){
                var particle = this.particles[this.indexArrayParticle];
                this.indexArrayParticle += 1;
                if(this.loop && this.indexArrayParticle >= this.particles.length){
                    this.indexArrayParticle = 0;
                }
                var indexEmissionParticle = this.indexEmissionParticle;
                this.indexEmissionParticle += 1;
                particle.emitt(indexEmissionParticle);
                return particle;
            }
            return null;
        }
    }
}
*/ 
///<reference path = "../Transform.ts"/>
var Game;
(function (Game) {
    var Emission;
    (function (Emission) {
        var BaseParticle = /** @class */ (function (_super) {
            __extends(BaseParticle, _super);
            function BaseParticle(emitter) {
                var _this = _super.call(this) || this;
                _this._enabled = false;
                _this._emitter = emitter;
                return _this;
            }
            Object.defineProperty(BaseParticle.prototype, "emitter", {
                get: function () {
                    return this._emitter;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(BaseParticle.prototype, "enabled", {
                get: function () {
                    return this._enabled;
                },
                set: function (value) {
                    this.setEnabled(value);
                },
                enumerable: false,
                configurable: true
            });
            BaseParticle.prototype.onReset = function () {
                this.enabled = false;
            };
            BaseParticle.prototype.emitt = function (index) {
                this.enabled = true;
                this.x = this.parent.x;
                this.y = this.parent.y;
                this.index = index;
            };
            BaseParticle.prototype.setEnabled = function (value) {
                this._enabled = value;
            };
            return BaseParticle;
        }(Game.Transform));
        Emission.BaseParticle = BaseParticle;
    })(Emission = Game.Emission || (Game.Emission = {}));
})(Game || (Game = {}));
///<reference path = "BaseParticle.ts"/>
var Game;
(function (Game) {
    var Emission;
    (function (Emission) {
        var BaseVisualParticle = /** @class */ (function (_super) {
            __extends(BaseVisualParticle, _super);
            function BaseVisualParticle(emitter) {
                var _this = _super.call(this, emitter) || this;
                _this.sprite = new Engine.Sprite();
                return _this;
            }
            BaseVisualParticle.prototype.setEnabled = function (value) {
                _super.prototype.setEnabled.call(this, value);
                this.sprite.enabled = value;
            };
            BaseVisualParticle.prototype.onTimeUpdate = function () {
                this.sprite.x = this.x;
                this.sprite.y = this.y;
            };
            BaseVisualParticle.prototype.onDrawParticles = function () {
                this.sprite.render();
            };
            return BaseVisualParticle;
        }(Emission.BaseParticle));
        Emission.BaseVisualParticle = BaseVisualParticle;
    })(Emission = Game.Emission || (Game.Emission = {}));
})(Game || (Game = {}));
///<reference path = "../Transform.ts"/>
var Game;
(function (Game) {
    var Emission;
    (function (Emission) {
        var Emitter = /** @class */ (function (_super) {
            __extends(Emitter, _super);
            function Emitter(particleClass, countParticles) {
                var _this = _super.call(this) || this;
                _this.sizeEmission = 1;
                _this.xMirror = false;
                _this.yMirror = false;
                _this.particles = [];
                for (var indexCount = 0; indexCount < countParticles; indexCount += 1) {
                    var particle = new particleClass(_this);
                    particle.parent = _this;
                    _this.particles.push(particle);
                }
                return _this;
            }
            Object.defineProperty(Emitter.prototype, "xDir", {
                get: function () {
                    return this.xMirror ? -1 : 1;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Emitter.prototype, "yDir", {
                get: function () {
                    return this.yMirror ? -1 : 1;
                },
                enumerable: false,
                configurable: true
            });
            Emitter.prototype.onReset = function () {
                this.indexArrayParticle = 0;
                this.indexEmissionParticle = 0;
            };
            Emitter.prototype.emittSingle = function () {
                if (this.indexArrayParticle < this.particles.length) {
                    var particle = this.particles[this.indexArrayParticle];
                    this.indexArrayParticle += 1;
                    if (this.indexArrayParticle >= this.particles.length) {
                        this.indexArrayParticle = 0;
                    }
                    var indexEmissionParticle = this.indexEmissionParticle;
                    this.indexEmissionParticle += 1;
                    particle.emitt(indexEmissionParticle);
                    return particle;
                }
                return null;
            };
            Emitter.prototype.emittChunk = function () {
                for (var indexEmitt = 0; indexEmitt < this.sizeEmission; indexEmitt += 1) {
                    this.emittSingle();
                }
            };
            return Emitter;
        }(Game.Transform));
        Emission.Emitter = Emitter;
    })(Emission = Game.Emission || (Game.Emission = {}));
})(Game || (Game = {}));
///<reference path = "BaseVisualParticle.ts"/>
var Game;
(function (Game) {
    var Emission;
    (function (Emission) {
        var SimpleParticle = /** @class */ (function (_super) {
            __extends(SimpleParticle, _super);
            function SimpleParticle() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.eternal = false;
                return _this;
            }
            Object.defineProperty(SimpleParticle.prototype, "xRange", {
                get: function () {
                    return 1;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(SimpleParticle.prototype, "yRange", {
                get: function () {
                    return 1;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(SimpleParticle.prototype, "xRangeVel", {
                get: function () {
                    return 0.1;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(SimpleParticle.prototype, "yRangeVel", {
                get: function () {
                    return 0.1;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(SimpleParticle.prototype, "xRangeAccel", {
                get: function () {
                    return 0.1;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(SimpleParticle.prototype, "yRangeAccel", {
                get: function () {
                    return 0.1;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(SimpleParticle.prototype, "rangeLife", {
                get: function () {
                    return 180;
                },
                enumerable: false,
                configurable: true
            });
            SimpleParticle.prototype.emitt = function (index) {
                _super.prototype.emitt.call(this, index);
                this.x = this.parent.x;
                this.y = this.parent.y;
                this.x += this.xRange * this.emitter.xDir;
                this.y += this.yRange * this.emitter.yDir;
                this.xVel = this.xRangeVel * this.emitter.xDir;
                this.yVel = this.yRangeVel * this.emitter.yDir;
                this.xAccel = this.xRangeAccel * this.emitter.xDir;
                this.yAccel = this.yRangeAccel * this.emitter.yDir;
                this.countLife = this.rangeLife;
            };
            SimpleParticle.prototype.onMoveUpdate = function () {
                if (!Game.SceneFreezer.stoped && this.enabled) {
                    this.x += this.xVel;
                    this.y += this.yVel;
                    this.xVel += this.xAccel;
                    this.yVel += this.yAccel;
                }
            };
            SimpleParticle.prototype.onStepUpdate = function () {
                if (!Game.SceneFreezer.stoped && this.enabled && !this.eternal) {
                    this.countLife -= 1;
                    if (this.countLife <= 0) {
                        this.enabled = false;
                    }
                }
            };
            SimpleParticle.prototype.onTimeUpdate = function () {
                _super.prototype.onTimeUpdate.call(this);
                if (!Game.SceneFreezer.stoped && this.enabled) {
                    this.sprite.x += this.xVel * Engine.System.deltaTime;
                    this.sprite.y += this.yVel * Engine.System.deltaTime;
                }
            };
            return SimpleParticle;
        }(Emission.BaseVisualParticle));
        Emission.SimpleParticle = SimpleParticle;
    })(Emission = Game.Emission || (Game.Emission = {}));
})(Game || (Game = {}));
///<reference path="../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var FRAME;
    Game.addAction("preloader", function () {
        FRAME = Game.FrameSelector.complex("background", Game.Resources.texture, 375, 298);
    });
    var Background = /** @class */ (function (_super) {
        __extends(Background, _super);
        function Background() {
            var _this = _super.call(this) || this;
            _this.createSprites();
            return _this;
        }
        Background.prototype.createSprites = function () {
            this.spriteArray = [];
            var xPos = -Engine.Renderer.xSizeView * 0.5;
            while (xPos < Engine.Renderer.xSizeView) {
                var sprite = new Engine.Sprite();
                sprite.enabled = true;
                sprite.x = xPos;
                sprite.y = 8;
                FRAME[0].applyToSprite(sprite);
                this.spriteArray.push(sprite);
                xPos += FRAME[0].xSize;
            }
        };
        Background.prototype.onViewUpdate = function () {
            this.createSprites();
        };
        Background.prototype.onDrawBackground = function () {
            for (var _i = 0, _a = this.spriteArray; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.render();
            }
        };
        return Background;
    }(Engine.Entity));
    Game.Background = Background;
})(Game || (Game = {}));
///<reference path="../Game/Arcade/Platformer/Simple/ControllablePlayer.ts"/>
var Game;
(function (Game) {
    //var VEL_MOVE = 1.3;
    var FRAMES_BOXES;
    var FRAMES_ANIM_NORMAL;
    var FRAMES_ANIM_HAPPY;
    var FRAMES_ANIM_SAD;
    var enemies = [];
    //DOWN CONTROL TO UNSTUCK
    var anims = {
        stand: null,
        move: null,
        ascend: null,
        fall: null,
        fallAscend: null,
        landing: null,
    };
    Game.addAction("configure", function () {
        FRAMES_BOXES = Game.FrameSelector.complex("enemy boxes", Game.Resources.textureEnemies, 1, 1);
        FRAMES_ANIM_NORMAL = Game.FrameSelector.complex("enemy normal", Game.Resources.textureEnemies, 1, 24);
        FRAMES_ANIM_HAPPY = Game.FrameSelector.complex("enemy happy", Game.Resources.textureEnemies, 1, 48);
        FRAMES_ANIM_SAD = Game.FrameSelector.complex("enemy sad", Game.Resources.textureEnemies, 1, 72);
        anims.stand = new Utils.Animation("stand", true, FRAMES_ANIM_NORMAL, 10, [0, 1, 2, 3], null);
        anims.move = new Utils.Animation("move", true, FRAMES_ANIM_NORMAL, 5, [0, 1, 2, 3], null);
        anims.ascend = new Utils.Animation("ascend", false, FRAMES_ANIM_NORMAL, 3, [9, 10, 11], null);
        anims.fallAscend = new Utils.Animation("fall ascend", false, FRAMES_ANIM_NORMAL, 5, [12, 13, 14, 15, 16], null);
        anims.fall = new Utils.Animation("fall", false, FRAMES_ANIM_NORMAL, 5, [13, 14, 15, 16], null);
        anims.landing = new Utils.Animation("landing", false, FRAMES_ANIM_NORMAL, 6, [1, 2, 3], null);
    });
    var EnemyA = /** @class */ (function (_super) {
        __extends(EnemyA, _super);
        function EnemyA(def) {
            var _this = _super.call(this, def) || this;
            _this.flipOnWall = true;
            _this.flipOnAbyss = true;
            _this.canHappy = true;
            FRAMES_BOXES[0].applyToBox(_this.boxSolid);
            ///this.xVelMove = VEL_MOVE;
            _this.initOverlaps();
            _this.initAnimations();
            _this.initEmitters();
            //this.sfxJump = Resources.sfxJump;
            //new Game.UI.Dialog();
            _this.xVelMove = _this.getProperty("vel move");
            Game.SceneMap.instance.boxesEnemies.push(_this.boxOverlap);
            enemies.push(_this);
            _this.boxPatrol = new Engine.Box();
            _this.boxPatrol.enabled = true;
            _this.boxPatrol.renderable = true;
            _this.boxPatrol.xSize = 1;
            _this.boxPatrol.ySize = 1;
            _this.boxPatrol.green = 0;
            _this.boxPatrol.blue = 1;
            return _this;
        }
        Object.defineProperty(EnemyA.prototype, "losing", {
            get: function () {
                return this.boxOverlap.collide(Game.Spike.boxes, null, true, 0, false, Engine.Box.LAYER_ALL) != null || this.boxSolid.collide(Game.SceneMap.instance.boxesSolids, null, true, 0, true, Engine.Box.LAYER_ALL) != null;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(EnemyA.prototype, "dirMove", {
            get: function () {
                return this.xVelMove == 0 ? 0 : (this.sprite.xMirror ? -1 : 1);
            },
            enumerable: false,
            configurable: true
        });
        EnemyA.prototype.fixBoxPatrolPosition = function () {
            this.boxPatrol.x = this.boxSolid.x;
            if (this.sprite.yMirror) {
                this.boxPatrol.y = this.boxSolid.y - this.boxSolid.ySize - 1;
            }
            else {
                this.boxPatrol.y = this.boxSolid.y;
            }
            if (this.xVel > 0) {
                this.boxPatrol.x += this.boxSolid.xSize * 0.5;
            }
            else {
                this.boxPatrol.x -= (this.boxSolid.xSize * 0.5 + 1);
            }
        };
        EnemyA.prototype.onOverlapUpdate = function () {
            _super.prototype.onOverlapUpdate.call(this);
        };
        EnemyA.prototype.initStates = function () {
            var _this = this;
            _super.prototype.initStates.call(this);
            this.stateDead = new Game.Flow.State(this, "dead");
            this.stateWin = new Game.Flow.State(this, "win");
            this.stateStand.addLink(this.stateWin, function () { return Game.Player.instance.winning || Game.Player.instance.losing || (Game.Goal.instance).boxSolid.enabled == false; });
            this.stateStand.addLink(this.stateDead, function () { return _this.losing; });
            this.stateMove.addLink(this.stateWin, function () { return Game.Player.instance.winning || Game.Player.instance.losing || (Game.Goal.instance).boxSolid.enabled == false; });
            this.stateMove.addLink(this.stateDead, function () { return _this.losing; });
            this.stateAscend.addLink(this.stateDead, function () { return _this.losing; });
            this.stateFall.addLink(this.stateDead, function () { return _this.losing; });
            this.stateLanding.addLink(this.stateDead, function () { return _this.losing; });
            this.stateWin.onEnter = function () {
                _this.xVel = 0;
                _this.moveActionsEnabled = false;
                _this.turnActionsEnabled = false;
                _this.jumpActionsEnabled = false;
                _this.platformActionsEnabled = true;
            };
            this.stateWin.onReady = function () {
                _this.animator.setAnimation(_this.animStand);
                _this.flipOnAbyss = false;
                _this.flipOnWall = false;
            };
            this.stateWin.addLink(this.stateDead, function () { return _this.losing; });
            this.stateDead.onEnter = function () {
                _this.moveActionsEnabled = false;
                _this.turnActionsEnabled = false;
                _this.jumpActionsEnabled = false;
                _this.platformActionsEnabled = false;
                _this.yScaleForceWorld = 0;
                _this.xVel = 0;
                _this.yVel = 0;
                _this.emitterDead.x = _this.boxSolid.x;
                _this.emitterDead.y = _this.boxSolid.y - _this.boxSolid.ySize * 0.5;
                _this.emitterDead.xMirror = _this.sprite.xMirror;
                _this.emitterDead.emittChunk();
                Game.Resources.sfxDeath.play();
            };
            this.stateDead.onReady = function () {
                _this.boxSolid.enabled = false;
                _this.boxOverlap.enabled = false;
                _this.sprite.enabled = false;
                _this.flipOnAbyss = false;
                _this.flipOnWall = false;
                EnemyA.setSad();
            };
            this.machine.anyState.onOverlapUpdate = function () {
            };
            this.machine.anyState.onStepUpdate = function () {
                var flip = false;
                if (_this.flipOnWall) {
                    if ((_this.xDirContact > 0 && _this.dirMove > 0) || (_this.xDirContact < 0 && _this.dirMove < 0)) {
                        flip = true;
                    }
                }
                if (_this.flipOnAbyss) {
                    _this.fixBoxPatrolPosition();
                    if (_this.yDirContact > 0 && _this.boxPatrol.collide(Game.SceneMap.instance.boxesSolids, null, true, 0, true, Engine.Box.LAYER_ALL) == null) {
                        flip = true;
                    }
                }
                if (flip) {
                    _this.sprite.xMirror = !_this.sprite.xMirror;
                }
            };
            return this.stateStand;
        };
        EnemyA.prototype.initOverlaps = function () {
        };
        EnemyA.prototype.initAnimations = function () {
            this.animStand = anims.stand;
            this.animMove = anims.move;
            this.animAscend = anims.ascend;
            this.animFall = anims.fall;
            this.animFallAscend = anims.fallAscend;
            this.animLanding = anims.landing;
        };
        EnemyA.prototype.initEmitters = function () {
            this.emitterDead = new Game.Emission.Emitter(Game.ParticleEnemy, 14);
            this.emitterDead.sizeEmission = 7;
        };
        EnemyA.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.fixFrames(FRAMES_ANIM_NORMAL);
            this.yScaleForceWorld = 1;
            this.boxSolid.enabled = true;
            this.boxOverlap.enabled = true;
            this.sprite.enabled = true;
            this.flipOnAbyss = true;
            this.flipOnWall = true;
            this.canHappy = true;
        };
        EnemyA.prototype.fixFrames = function (frameArray) {
            for (var prop in anims) {
                var anim = anims[prop];
                anim.frames = frameArray;
            }
            this.animator.setCurrentFrame();
        };
        EnemyA.prototype.onSetFrame = function (_animator, _animation, _frame) {
            _super.prototype.onSetFrame.call(this, _animator, _animation, _frame);
            _frame.applyToBox(this.boxOverlap);
        };
        EnemyA.prototype.onMoveUpdate = function () {
            _super.prototype.onMoveUpdate.call(this);
        };
        EnemyA.prototype.stuckPlatformCheck = function () {
        };
        EnemyA.prototype.onStepUpdate = function () {
        };
        EnemyA.prototype.onGoal = function () {
            Game.Resources.sfxWin.play();
        };
        EnemyA.prototype.onLosing = function () {
            Game.Resources.sfxDeath.play();
        };
        EnemyA.prototype.onTimeUpdate = function () {
            _super.prototype.onTimeUpdate.call(this);
        };
        EnemyA.prototype.onDrawObjects = function () {
            this.sprite.render();
        };
        EnemyA.prototype.onClearScene = function () {
            enemies = [];
        };
        EnemyA.prototype.onDrawObjectsFront = function () {
            _super.prototype.onDrawObjectsFront.call(this);
            if (this.boxPatrol.enabled && this.boxPatrol.renderable) {
                this.fixBoxPatrolPosition();
                this.boxPatrol.render();
            }
        };
        EnemyA.setHappy = function () {
            for (var _i = 0, enemies_1 = enemies; _i < enemies_1.length; _i++) {
                var enemy = enemies_1[_i];
                if (enemy.canHappy) {
                    enemy.fixFrames(FRAMES_ANIM_HAPPY);
                }
            }
        };
        EnemyA.setSad = function () {
            for (var _i = 0, enemies_2 = enemies; _i < enemies_2.length; _i++) {
                var enemy = enemies_2[_i];
                enemy.fixFrames(FRAMES_ANIM_SAD);
                enemy.canHappy = false;
            }
        };
        return EnemyA;
    }(Game.Arcade.Platformer.BaseMachineEntity));
    Game.EnemyA = EnemyA;
})(Game || (Game = {}));
///<reference path="../Game/Arcade/Platformer/Simple/Goal.ts"/>
var Game;
(function (Game) {
    var FRAMES_BOXES;
    var FRAMES_ANIM_NORMAL;
    var FRAMES_ANIM_HAPPY;
    var FRAMES_ANIM_SAD;
    //DOWN CONTROL TO UNSTUCK
    var anims = {
        stand: null,
        move: null,
        ascend: null,
        fall: null,
        fallAscend: null,
        landing: null,
    };
    Game.addAction("configure", function () {
        FRAMES_BOXES = Game.FrameSelector.complex("goal boxes", Game.Resources.texture, 21, 298);
        FRAMES_ANIM_NORMAL = Game.FrameSelector.complex("goal normal", Game.Resources.texture, 21, 319);
        FRAMES_ANIM_HAPPY = Game.FrameSelector.complex("goal happy", Game.Resources.texture, 21, 342);
        FRAMES_ANIM_SAD = Game.FrameSelector.complex("goal sad", Game.Resources.texture, 21, 365);
        anims.stand = new Utils.Animation("stand", true, FRAMES_ANIM_NORMAL, 10, [0, 1, 2, 1], null);
        anims.move = new Utils.Animation("move", true, FRAMES_ANIM_NORMAL, 5, [0, 1, 2, 1], null);
        anims.ascend = new Utils.Animation("ascend", false, FRAMES_ANIM_NORMAL, 3, [6, 7, 8], null);
        anims.fallAscend = new Utils.Animation("fall ascend", false, FRAMES_ANIM_NORMAL, 5, [9, 10, 11, 12, 13], null);
        anims.fall = new Utils.Animation("fall", false, FRAMES_ANIM_NORMAL, 5, [11, 12, 13], null);
        anims.landing = new Utils.Animation("landing", false, FRAMES_ANIM_NORMAL, 6, [1, 2, 1], null);
    });
    var Goal = /** @class */ (function (_super) {
        __extends(Goal, _super);
        function Goal(def) {
            var _this = _super.call(this, def) || this;
            FRAMES_BOXES[0].applyToBox(_this.boxSolid);
            _this.initAnimations();
            _this.hearth = new Game.Hearth();
            _this.emitterDead = new Game.Emission.Emitter(Game.ParticleAmber, 14);
            _this.emitterDead.sizeEmission = 7;
            return _this;
        }
        Goal.prototype.initStates = function () {
            var _this = this;
            _super.prototype.initStates.call(this);
            this.stateStandWinning = new Game.Flow.State(this, "stand winning");
            this.stateAscendWinning = new Game.Flow.State(this, "ascend winning");
            this.stateFallWinning = new Game.Flow.State(this, "fall winning");
            this.stateLandingWinning = new Game.Flow.State(this, "landing winning");
            this.stateStand.addLink(this.stateAscendWinning, function () { return Game.Player.instance.winning && !(Game.Player.instance instanceof Game.PlayerEnding); });
            this.stateAscendWinning.onEnter = function () {
                _this.fixFrames(FRAMES_ANIM_HAPPY);
                _this.animator.setAnimation(_this.animAscend);
                _this.yVel = -3;
            };
            this.stateAscendWinning.addLink(this.stateFallWinning, function () { return _this.yVel >= 0; });
            this.stateFallWinning.onEnter = function () {
                _this.animator.setAnimation(_this.animFall);
            };
            this.stateFallWinning.addLink(this.stateLandingWinning, function () { return _this.yDirContact > 0; });
            this.stateLandingWinning.onEnter = function () {
                _this.hearth.show(_this.boxSolid.x - (_this.boxSolid.x - Game.Player.instance.boxSolid.x) * 0.5, _this.boxSolid.y, false);
                _this.animator.setAnimation(_this.animLanding);
            };
            this.stateLandingWinning.addLink(this.stateStandWinning, function () { return _this.animator.ended; });
            this.stateStandWinning.onEnter = function () {
                _this.animator.setAnimation(_this.animStand);
            };
            return this.stateStand;
        };
        Goal.prototype.initAnimations = function () {
            this.animStand = anims.stand;
            this.animMove = anims.move;
            this.animAscend = anims.ascend;
            this.animFall = anims.fall;
            this.animFallAscend = anims.fallAscend;
            this.animLanding = anims.landing;
        };
        Goal.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.boxSolid.enabled = true;
            this.boxOverlap.enabled = true;
            this.sprite.enabled = true;
            //if(Player.instance instanceof PlayerEnding){
            //    this.fixFrames(FRAMES_ANIM_SAD);
            //}
            //else{
            this.fixFrames(FRAMES_ANIM_NORMAL);
            //}
        };
        Goal.prototype.fixFrames = function (frameArray) {
            for (var prop in anims) {
                var anim = anims[prop];
                anim.frames = frameArray;
            }
            this.animator.setCurrentFrame();
        };
        Goal.prototype.setSad = function () {
            if (Game.Player.instance instanceof Game.PlayerEnding) {
                //this.fixFrames(FRAMES_ANIM_HAPPY);
            }
            else {
                this.fixFrames(FRAMES_ANIM_SAD);
            }
        };
        Goal.prototype.setMirror = function (mirror) {
            this.sprite.xMirror = mirror;
        };
        Goal.prototype.crush = function () {
            this.emitterDead.x = this.boxSolid.x;
            this.emitterDead.y = this.boxSolid.y - this.boxSolid.ySize * 0.5;
            this.emitterDead.xMirror = this.sprite.xMirror;
            this.emitterDead.emittChunk();
            this.boxSolid.enabled = false;
            this.boxOverlap.enabled = false;
            this.sprite.enabled = false;
            Game.Resources.sfxDeath.play();
        };
        Goal.prototype.tryCrush = function () {
            if (this.boxSolid.enabled && this.boxSolid.y > Game.SceneMap.instance.ySizeMap) {
                this.crush();
                Game.EnemyA.setSad();
                Game.Player.instance.setSad();
            }
        };
        Goal.prototype.onSetFrame = function (_animator, _animation, _frame) {
            _super.prototype.onSetFrame.call(this, _animator, _animation, _frame);
            _frame.applyToBox(this.boxOverlap);
        };
        return Goal;
    }(Game.Arcade.Platformer.Simple.Goal));
    Game.Goal = Goal;
})(Game || (Game = {}));
///<reference path="../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var FRAMES;
    var ANIM_NONE;
    var ANIM_APPEAR;
    var ANIM_STAY;
    var ANIM_HIDE;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("hearth", Game.Resources.texture, 21, 119);
        ANIM_NONE = new Utils.Animation("none", false, FRAMES, 1, [0], null);
        ANIM_APPEAR = new Utils.Animation("appear", false, FRAMES, 1, [1, 2, 3, 4, 5, 6, 7, 8, 9], null);
        ANIM_STAY = new Utils.Animation("stay", true, FRAMES, 4, [8, 7, 6, 5, 6, 7], null);
        ANIM_HIDE = new Utils.Animation("appear", false, FRAMES, 1, [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], null);
    });
    var Hearth = /** @class */ (function (_super) {
        __extends(Hearth, _super);
        function Hearth() {
            var _this = _super.call(this) || this;
            _this.active = false;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.animator = new Utils.Animator();
            _this.animator.owner = _this;
            _this.animator.listener = _this;
            _this.initStates();
            return _this;
        }
        Hearth.prototype.initStates = function () {
            var _this = this;
            var none = new Game.Flow.State(this);
            var appear = new Game.Flow.State(this);
            var stay = new Game.Flow.State(this);
            var hide = new Game.Flow.State(this);
            none.onEnter = function () {
                _this.animator.setAnimation(ANIM_NONE);
            };
            none.addLink(appear, function () { return _this.active; });
            appear.onEnter = function () {
                _this.animator.setAnimation(ANIM_APPEAR);
            };
            appear.addLink(hide, function () { return !_this.active; });
            appear.addLink(stay, function () { return _this.animator.ended; });
            stay.onEnter = function () {
                _this.animator.setAnimation(ANIM_STAY);
            };
            stay.addLink(hide, function () { return !_this.active; });
            hide.onEnter = function () {
                _this.animator.setAnimation(ANIM_HIDE);
            };
            hide.addLink(appear, function () { return _this.active; });
            this.machine = new Game.Flow.StateMachine(this);
            this.machine.startState = none;
        };
        Hearth.prototype.onReset = function () {
            this.active = false;
            this.animator.setAnimation(ANIM_NONE);
            this.indexFrame = 0;
            this.nextIndexFrame = 0;
        };
        Hearth.prototype.show = function (x, y, mirror) {
            this.active = true;
            this.sprite.x = x;
            this.sprite.y = y;
            this.sprite.yMirror = mirror;
            this.sprite.y += 15 * (mirror ? 1 : -1);
        };
        Hearth.prototype.hide = function () {
            this.active = false;
        };
        //@ts-ignore
        Hearth.prototype.onSetFrame = function (animator, animation, frame) {
            this.indexFrame = this.nextIndexFrame;
            frame.applyToSprite(this.sprite);
            this.nextIndexFrame = animation.indexArray[animator.indexFrame];
        };
        Hearth.prototype.fixAnimation = function () {
            var fixIndex = this.animator.animation.indexArray.indexOf(this.indexFrame);
            if (fixIndex >= 0) {
                this.animator.indexFrame = fixIndex;
                this.animator.animation.frames[this.indexFrame].applyToSprite(this.sprite);
            }
        };
        Hearth.prototype.onDrawObjectsFront = function () {
            this.sprite.x = Game.Goal.instance.boxSolid.x - (Game.Goal.instance.boxSolid.x - Game.Player.instance.boxSolid.x) * 0.5;
            this.sprite.y = Game.Goal.instance.boxSolid.y - 15;
            this.sprite.render();
        };
        return Hearth;
    }(Engine.Entity));
    Game.Hearth = Hearth;
})(Game || (Game = {}));
///<reference path="../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var JumpTutorial = /** @class */ (function (_super) {
        __extends(JumpTutorial, _super);
        function JumpTutorial() {
            var _this = _super.call(this) || this;
            var xPosA = 0 + 44 + 4;
            var yPosA = -20 - 20 - 10 + 47 + 4;
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.b;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = "2. H -" + ((Game.IS_EDGE || Game.FORCE_EDGE_TUTORIAL) ? " " : " W - ") + "UP ARROW";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.xAligned = xPosA;
            text0.yAligned = yPosA;
            text0.superback = true;
            var text1 = new Utils.Text();
            text1.font = Game.FontManager.b;
            text1.scale = 1;
            text1.enabled = true;
            text1.pinned = true;
            text1.str = "OR SPACE TO JUMP!";
            text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.xAligned = xPosA;
            text1.yAligned = yPosA + 10;
            text1.superback = true;
            if (Game.IS_TOUCH) {
                text0.enabled = false;
                text1.enabled = false;
            }
            var xPosB = 0;
            var yPosB = -20 - 20 - 10 + 17 - 34 + 20 - 8;
            var text2 = new Utils.Text();
            text2.font = Game.FontManager.b;
            text2.scale = 1;
            text2.enabled = true;
            text2.pinned = true;
            text2.str = Game.IS_TOUCH ? "1. HOLD THE JUMP BUTTON" : "3. HOLD THE JUMP BUTTON";
            text2.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text2.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text2.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text2.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text2.xAligned = xPosB;
            text2.yAligned = yPosB;
            text2.superback = true;
            var text3 = new Utils.Text();
            text3.font = Game.FontManager.b;
            text3.scale = 1;
            text3.enabled = true;
            text3.pinned = true;
            text3.str = "TO JUMP HIGHER!";
            text3.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text3.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text3.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text3.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text3.xAligned = xPosB;
            text3.yAligned = yPosB + 10;
            text3.superback = true;
            return _this;
        }
        return JumpTutorial;
    }(Engine.Entity));
    Game.JumpTutorial = JumpTutorial;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var tes = false;
    var lev = [];
    Game.addAction("configure", function () {
        for (var i = 0; i <= Game.MAX_LEVELS; i++)
            lev[i] = i;
        sor();
        ver();
    });
    function getlev(ind) {
        return Game.Resources.PATH_LEVEL + "" + (lev[ind] < 10 ? "0" : "") + lev[ind] + ".json";
    }
    Game.getlev = getlev;
    function ver() {
        if (tes) {
            console.error("TESTING LEVEL FINDER");
            var old = Date.now();
            for (var i = 0; i <= Game.MAX_LEVELS; i++) {
                var fou = false;
                for (var j = 0; j <= Game.MAX_LEVELS; j++) {
                    if (lev[j] == i) {
                        fou = true;
                        break;
                    }
                }
                if (!fou)
                    console.error("Level " + i + " is missing");
            }
            console.log("MY TIME: " + (Date.now() - old) / 1000);
        }
    }
    function sor() {
        /*
        var i=28;
        lev[i++]=57;
        lev[i++]=44;
        lev[i++]=60;
        lev[i++]=38;
        lev[i++]=89;
        lev[i++]=75;
        lev[i++]=33;
        lev[i++]=69;
        lev[i++]=77;
        lev[i++]=51;
        lev[i++]=92;
        lev[i++]=37;
        lev[i++]=45;
        lev[i++]=59;
        lev[i++]=79;
        lev[i++]=47;
        lev[i++]=28;
        lev[i++]=74;
        lev[i++]=87;
        lev[i++]=80;
        lev[i++]=64;
        lev[i++]=54;
        lev[i++]=66;
        lev[i++]=29;
        lev[i++]=30;
        lev[i++]=31;
        lev[i++]=68;
        lev[i++]=32;
        lev[i++]=36;
        lev[i++]=43;
        lev[i++]=52;
        lev[i++]=41;
        lev[i++]=39;
        lev[i++]=48;
        lev[i++]=82;
        lev[i++]=61;
        lev[i++]=55;
        lev[i++]=53;
        lev[i++]=58;
        lev[i++]=94;
        lev[i++]=70;
        lev[i++]=34;
        lev[i++]=42;
        lev[i++]=49;
        lev[i++]=50;
        lev[i++]=71;
        lev[i++]=40;
        lev[i++]=84;
        lev[i++]=76;
        lev[i++]=56;
        lev[i++]=91;
        lev[i++]=93;
        lev[i++]=46;
        lev[i++]=97;
        lev[i++]=62;
        lev[i++]=90;
        lev[i++]=78;
        lev[i++]=63;
        lev[i++]=65;
        lev[i++]=67;
        lev[i++]=35;
        lev[i++]=99;
        lev[i++]=95;
        lev[i++]=72;
        lev[i++]=85;
        lev[i++]=98;
        lev[i++]=73;
        lev[i++]=86;
        lev[i++]=83;
        lev[i++]=81;
        lev[i++]=96;
        lev[i++]=88;
        for(i=28;i<MAX_LEVELS;i++){
            console.log(i + " - " + lev[i] + " is " + i);
        }
        */
    }
})(Game || (Game = {}));
///<reference path = "../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var TEXTURE;
    var FRAMES;
    var ANIM;
    var FRAMES_EMERALD;
    var ANIM_EMERALD;
    var FRAMES_AMBER;
    var FRAMES_HEART;
    var FRAME_BY_KEZ;
    Game.addAction("configure", function () {
        TEXTURE = new Engine.Texture(Game.PATH_TEXTURE_TITLE, true, false);
        TEXTURE.preserved = true;
        FRAMES = Game.FrameSelector.complex("main menu title", TEXTURE, 1, 1);
        ANIM = new Utils.Animation("title", true, FRAMES, 4, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 0, 0, 0, 0, 0, 0], null);
        FRAMES_EMERALD = Game.FrameSelector.complex("main menu emerald", Game.Resources.texture, 21, 250);
        ANIM_EMERALD = new Utils.Animation("stuck", true, FRAMES_EMERALD, 10, [18, 19, 20, 17], null);
        FRAMES_AMBER = Game.FrameSelector.complex("main menu amber", Game.Resources.texture, 21, 342);
        FRAMES_HEART = Game.FrameSelector.complex("main menu heart", Game.Resources.texture, 21, 119);
        FRAME_BY_KEZ = Game.FrameSelector.complex("by kez", Game.Resources.texture, 205, 699);
    });
    var MainMenuObjects = /** @class */ (function (_super) {
        __extends(MainMenuObjects, _super);
        function MainMenuObjects() {
            var _this = _super.call(this) || this;
            _this.spriteTitle = new Engine.Sprite();
            _this.spriteTitle.enabled = true;
            _this.spriteTitle.pinned = true;
            _this.spriteTitle.x = 0;
            _this.spriteTitle.y = -110;
            _this.spriteTitle.xScale = 0.5;
            _this.spriteTitle.yScale = 0.5;
            _this.animatorTitle = new Utils.Animator();
            _this.animatorTitle.owner = _this;
            _this.animatorTitle.listener = _this;
            _this.animatorTitle.setAnimation(ANIM);
            _this.spriteEmerald = new Engine.Sprite();
            _this.spriteEmerald.enabled = true;
            _this.spriteEmerald.x = 16 * 9 + 8;
            _this.spriteEmerald.y = 16 * 13 - 7;
            _this.animatorEmerald = new Utils.Animator();
            _this.animatorEmerald.owner = _this;
            _this.animatorEmerald.listener = _this;
            _this.animatorEmerald.setAnimation(ANIM_EMERALD);
            _this.spriteAmber = new Engine.Sprite();
            _this.spriteAmber.enabled = true;
            _this.spriteAmber.x = 16 * 12 + 8;
            _this.spriteAmber.y = 16 * 13;
            _this.spriteAmber.xMirror = true;
            _this.animatorAmber = new Utils.Animator();
            _this.animatorAmber.owner = _this;
            _this.animatorAmber.listener = _this;
            _this.animatorAmber.setAnimation(new Utils.Animation("stand", true, FRAMES_AMBER, 10, [3, 4, 5, 4], null));
            _this.spriteHeart = new Engine.Sprite();
            _this.spriteHeart.enabled = true;
            _this.spriteHeart.x = 16 * 12 + 8 - 16 - 8;
            _this.spriteHeart.y = 16 * 13 - 6;
            _this.spriteHeart.xMirror = true;
            _this.animatorHeart = new Utils.Animator();
            _this.animatorHeart.owner = _this;
            _this.animatorHeart.listener = _this;
            _this.animatorHeart.setAnimation(new Utils.Animation("stay", true, FRAMES_HEART, 4, [8, 7, 6, 5, 6, 7], null));
            _this.spriteByKez = new Engine.Sprite();
            _this.spriteByKez.enabled = !Game.REMOVE_TITTLE_LINK;
            _this.spriteByKez.pinned = true;
            _this.spriteByKez.x = 0;
            _this.spriteByKez.y = 100 + 8 + 1;
            FRAME_BY_KEZ[0].applyToSprite(_this.spriteByKez);
            return _this;
        }
        MainMenuObjects.prototype.onSetFrame = function (animator, _animation, frame) {
            if (animator == this.animatorTitle) {
                frame.applyToSprite(this.spriteTitle);
            }
            else if (animator == this.animatorEmerald) {
                frame.applyToSprite(this.spriteEmerald);
            }
            else if (animator == this.animatorAmber) {
                frame.applyToSprite(this.spriteAmber);
            }
            else {
                frame.applyToSprite(this.spriteHeart);
            }
        };
        MainMenuObjects.prototype.onDrawDialogs = function () {
            this.spriteTitle.render();
            this.spriteEmerald.render();
            this.spriteAmber.render();
            this.spriteHeart.render();
            this.spriteByKez.render();
        };
        return MainMenuObjects;
    }(Engine.Entity));
    Game.MainMenuObjects = MainMenuObjects;
})(Game || (Game = {}));
var Game;
(function (Game) {
    function ran(sta, end) {
        return sta + Math.random() * (end - sta);
    }
    Game.ran = ran;
    function sig(val) {
        return val < 0 ? -1 : 1;
    }
    Game.sig = sig;
    function dir(val) {
        return val == 0 ? 0 : val < 0 ? -1 : 1;
    }
    Game.dir = dir;
})(Game || (Game = {}));
///<reference path="../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var MoveTutorial = /** @class */ (function (_super) {
        __extends(MoveTutorial, _super);
        function MoveTutorial() {
            var _this = _super.call(this) || this;
            var pos = -20 - 20 - 10 + 8;
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.b;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = (Game.IS_EDGE || Game.FORCE_EDGE_TUTORIAL) ? "1. ARROW KEYS" : "1. A - D OR ARROW KEYS";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.xAligned = 0;
            text0.yAligned = pos;
            text0.superback = true;
            var text1 = new Utils.Text();
            text1.font = Game.FontManager.b;
            text1.scale = 1;
            text1.enabled = true;
            text1.pinned = true;
            text1.str = Game.IS_TOUCH ? "   " : "TO MOVE";
            text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.xAligned = 0;
            text1.yAligned = pos + 10;
            text1.superback = true;
            if (Game.IS_TOUCH) {
                text0.enabled = false;
                text1.enabled = false;
            }
            return _this;
        }
        return MoveTutorial;
    }(Engine.Entity));
    Game.MoveTutorial = MoveTutorial;
})(Game || (Game = {}));
///<reference path = "../Game/Arcade/Platformer/Platform.ts"/>
var Game;
(function (Game) {
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("platforms", Game.Resources.texture, 175, 119);
    });
    var Platform = /** @class */ (function (_super) {
        __extends(Platform, _super);
        function Platform(def) {
            var _this = _super.call(this, def) || this;
            _this.xSize = def.instance.width / Game.SceneMap.instance.xSizeTile;
            _this.ySize = def.instance.height / Game.SceneMap.instance.ySizeTile;
            _this.sprites = [];
            for (var xIndex = 0; xIndex < _this.xSize; xIndex += 1) {
                for (var yIndex = 0; yIndex < _this.ySize; yIndex += 1) {
                    var sprite = new Engine.Sprite();
                    sprite.enabled = true;
                    if (_this.xSize == 1 && _this.ySize == 1) {
                        FRAMES[0].applyToSprite(sprite);
                    }
                    else if (_this.xSize == 1) {
                        if (yIndex == 0) {
                            FRAMES[4].applyToSprite(sprite);
                        }
                        else if (yIndex == _this.ySize - 1) {
                            FRAMES[12].applyToSprite(sprite);
                        }
                        else {
                            FRAMES[8].applyToSprite(sprite);
                        }
                    }
                    else if (_this.ySize == 1) {
                        if (xIndex == 0) {
                            FRAMES[1].applyToSprite(sprite);
                        }
                        else if (xIndex == _this.xSize - 1) {
                            FRAMES[3].applyToSprite(sprite);
                        }
                        else {
                            FRAMES[2].applyToSprite(sprite);
                        }
                    }
                    else {
                        if (xIndex == 0 && yIndex == 0) {
                            //console.log("A");
                            FRAMES[5].applyToSprite(sprite);
                        }
                        else if (xIndex == 0 && yIndex == _this.ySize - 1) {
                            FRAMES[13].applyToSprite(sprite);
                        }
                        else if (xIndex == _this.xSize - 1 && yIndex == 0) {
                            FRAMES[7].applyToSprite(sprite);
                        }
                        else if (xIndex == _this.xSize - 1 && yIndex == _this.ySize - 1) {
                            FRAMES[15].applyToSprite(sprite);
                        }
                        else if (xIndex == 0) {
                            FRAMES[9].applyToSprite(sprite);
                        }
                        else if (xIndex == _this.xSize - 1) {
                            FRAMES[11].applyToSprite(sprite);
                        }
                        else if (yIndex == 0) {
                            FRAMES[6].applyToSprite(sprite);
                        }
                        else if (yIndex == _this.ySize - 1) {
                            FRAMES[14].applyToSprite(sprite);
                        }
                        else {
                            FRAMES[10].applyToSprite(sprite);
                        }
                    }
                    sprite.xOffset = xIndex * Game.SceneMap.instance.xSizeTile;
                    sprite.yOffset = yIndex * Game.SceneMap.instance.ySizeTile;
                    _this.sprites.push(sprite);
                }
            }
            _this.box.xSize = _this.xSize * Game.SceneMap.instance.xSizeTile;
            _this.box.ySize = _this.ySize * Game.SceneMap.instance.ySizeTile;
            _this.box.yOffset -= (_this.ySize - 1) * Game.SceneMap.instance.ySizeTile;
            return _this;
        }
        Platform.prototype.onDrawObjects = function () {
            _super.prototype.onDrawObjects.call(this);
            for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.x = this.box.x + (Game.SceneFreezer.stoped ? 0 : this.xGetVelMove() * Engine.System.deltaTime);
                sprite.y = this.box.y + this.box.yOffset + (Game.SceneFreezer.stoped ? 0 : this.yGetVelMove() * Engine.System.deltaTime);
                sprite.render();
            }
        };
        return Platform;
    }(Game.Arcade.Platformer.Platform));
    Game.Platform = Platform;
})(Game || (Game = {}));
///<reference path="../Game/Arcade/Platformer/Simple/ControllablePlayer.ts"/>
var Game;
(function (Game) {
    //var VEL_MOVE = 1.3;
    var FRAMES_BOXES;
    var FRAMES_ANIM_NORMAL;
    var FRAMES_ANIM_HAPPY;
    var FRAMES_ANIM_SAD;
    var FRAMES_CONTROL_NORMAL;
    var FRAMES_CONTROL_STUCK;
    //DOWN CONTROL TO UNSTUCK
    var anims = {
        stand: null,
        move: null,
        ascend: null,
        fall: null,
        fallAscend: null,
        landing: null,
        stuck: null,
    };
    Game.addAction("configure", function () {
        FRAMES_BOXES = Game.FrameSelector.complex("player boxes", Game.Resources.texture, 21, 203);
        FRAMES_ANIM_NORMAL = Game.FrameSelector.complex("player normal", Game.Resources.texture, 21, 226);
        FRAMES_ANIM_HAPPY = Game.FrameSelector.complex("player happy", Game.Resources.texture, 21, 250);
        FRAMES_ANIM_SAD = Game.FrameSelector.complex("player sad", Game.Resources.texture, 21, 274);
        anims.stand = new Utils.Animation("stand", true, FRAMES_ANIM_NORMAL, 10, [0, 1, 2, 3], null);
        anims.move = new Utils.Animation("move", true, FRAMES_ANIM_NORMAL, 5, [0, 1, 2, 3], null);
        anims.ascend = new Utils.Animation("ascend", false, FRAMES_ANIM_NORMAL, 3, [9, 10, 11], null);
        anims.fallAscend = new Utils.Animation("fall ascend", false, FRAMES_ANIM_NORMAL, 5, [12, 13, 14, 15, 16], null);
        anims.fall = new Utils.Animation("fall", false, FRAMES_ANIM_NORMAL, 5, [13, 14, 15, 16], null);
        anims.landing = new Utils.Animation("landing", false, FRAMES_ANIM_NORMAL, 6, [1, 2, 3], null);
        anims.stuck = new Utils.Animation("stuck", true, FRAMES_ANIM_NORMAL, 10, [18, 19, 20, 17], null);
        FRAMES_CONTROL_NORMAL = Game.FrameSelector.complex("player control normal a", Game.Resources.texture, 21, 512 + 3);
        FRAMES_CONTROL_NORMAL = Game.FrameSelector.complex("player control normal b", Game.Resources.texture, 161, 512 + 3, FRAMES_CONTROL_NORMAL);
        FRAMES_CONTROL_STUCK = Game.FrameSelector.complex("player control stuck a", Game.Resources.texture, 21, 512 + 3);
        FRAMES_CONTROL_STUCK = Game.FrameSelector.complex("player control stuck b", Game.Resources.texture, 161, 573 + 3, FRAMES_CONTROL_STUCK);
    });
    var Player = /** @class */ (function (_super) {
        __extends(Player, _super);
        function Player(def) {
            var _this = _super.call(this, def, FRAMES_CONTROL_NORMAL, 1) || this;
            FRAMES_BOXES[0].applyToBox(_this.boxSolid);
            ///this.xVelMove = VEL_MOVE;
            _this.initOverlaps();
            _this.initAnimations();
            _this.initEmitters();
            _this.sfxJump = Game.Resources.sfxJump;
            //new Game.UI.Dialog();
            _this.stepsWin = 100;
            _this.stepsLoss = 50;
            return _this;
        }
        Object.defineProperty(Player.prototype, "pressedControlUnstuck", {
            get: function () {
                return this.controls.pressedAction || Engine.Keyboard.pressed(Engine.Keyboard.S) || Engine.Keyboard.pressed(Engine.Keyboard.DOWN);
            },
            enumerable: false,
            configurable: true
        });
        Player.prototype.initStates = function () {
            var _this = this;
            _super.prototype.initStates.call(this);
            this.stateStuck = new Game.Flow.State(this, "stuck");
            this.stateWin = new Game.Flow.State(this, "win");
            this.stateDead = new Game.Flow.State(this, "dead");
            this.stateStand.addLink(this.stateWin, function () { return _this.winning; });
            this.stateStand.addLink(this.stateDead, function () { return _this.losing; });
            this.stateMove.addLink(this.stateWin, function () { return _this.winning; });
            this.stateMove.addLink(this.stateDead, function () { return _this.losing; });
            this.stateAscend.addLink(this.stateDead, function () { return _this.losing; });
            this.stateFall.addLink(this.stateDead, function () { return _this.losing; });
            this.stateFall.addLink(this.stateStuck, function () { return _this.yDirContact < 0 && _this.stuckContacts != null; });
            this.stateLanding.addLink(this.stateDead, function () { return _this.losing; });
            this.stateStuck.onEnter = function () {
                _this.moveActionsEnabled = false;
                _this.turnActionsEnabled = true;
                _this.jumpActionsEnabled = false;
                _this.platformActionsEnabled = false;
                _this.yScaleForceWorld = 0;
                _this.xVel = 0;
                _this.yVel = 0;
            };
            this.stateStuck.onReady = function () {
                _this.animator.setAnimation(_this.animStuck);
                _this.stuckPlatformCheck();
                _this.emitterStuck.x = _this.boxStuck.x + _this.boxStuck.xOffset;
                _this.emitterStuck.y = _this.boxStuck.y + _this.boxStuck.yOffset;
                _this.emitterStuck.emittChunk();
                _this.controls.frames = FRAMES_CONTROL_STUCK;
                Game.Resources.sfxUnStuck.play();
            };
            this.stateStuck.onStepUpdate = function () {
                _this.stuckPlatformCheck();
            };
            this.stateStuck.onExit = function () {
                _this.yVel = 0;
                _this.yScaleForceWorld = 1;
                _this.stuckContacts = null;
                _this.controls.frames = FRAMES_CONTROL_NORMAL;
                if (_this.platformParent != null) {
                    _this.platformParent.removeChild(_this);
                }
                if (_this.pressedControlUnstuck || _this.xOverlapsPlatform || _this.xCollidesOnPlatform || (_this.stuckContacts == null && _this.yOverlapsPlatform)) {
                    _this.emitterUnStuck.x = _this.boxStuck.x + _this.boxStuck.xOffset;
                    _this.emitterUnStuck.y = _this.boxStuck.y + _this.boxStuck.yOffset;
                    _this.emitterUnStuck.emittChunk();
                    Game.Resources.sfxUnStuck.play();
                }
            };
            this.stateStuck.addLink(this.stateWin, function () { return _this.winning; });
            this.stateStuck.addLink(this.stateDead, function () { return _this.losing; });
            this.stateStuck.addLink(this.stateFall, function () { return _this.pressedControlUnstuck || _this.stuckContacts == null || _this.xOverlapsPlatform || _this.xCollidesOnPlatform; });
            this.stateWin.onEnter = function () {
                _this.xVel = 0;
                _this.moveActionsEnabled = false;
                _this.turnActionsEnabled = false;
                _this.jumpActionsEnabled = false;
                _this.platformActionsEnabled = true;
            };
            this.stateWin.onReady = function () {
                _this.animator.setAnimation(_this.animStand);
                Game.EnemyA.setSad();
                Game.Jumper.setsad();
                Game.Fly.setsad();
            };
            this.stateDead.onEnter = function () {
                _this.moveActionsEnabled = false;
                _this.turnActionsEnabled = false;
                _this.jumpActionsEnabled = false;
                _this.platformActionsEnabled = false;
                _this.yScaleForceWorld = 0;
                _this.xVel = 0;
                _this.yVel = 0;
                _this.emitterDead.x = _this.boxSolid.x;
                _this.emitterDead.y = _this.boxSolid.y - _this.boxSolid.ySize * 0.5;
                _this.emitterDead.xMirror = _this.sprite.xMirror;
                _this.emitterDead.emittChunk();
                Game.Goal.instance.setSad();
            };
            this.stateDead.onReady = function () {
                _this.boxSolid.enabled = false;
                _this.boxOverlap.enabled = false;
                _this.sprite.enabled = false;
                Game.EnemyA.setHappy();
                Game.Jumper.sethap();
                Game.Fly.sethap();
            };
            this.machine.anyState.onOverlapUpdate = function () {
                _this.boxStuck.x = _this.boxSolid.x;
                _this.boxStuck.y = _this.boxSolid.y;
                _this.stuckContacts = _this.boxStuck.collide(Game.SceneMap.instance.boxesSolids, null, true, 0, false, Engine.Box.LAYER_ALL);
            };
            this.machine.anyState.onStepUpdate = function () {
                Game.Goal.instance.tryCrush();
                if (_this.winning) {
                    if (Game.Goal.instance.boxSolid.x > _this.boxSolid.x) {
                        _this.sprite.xMirror = false;
                        Game.Goal.instance.setMirror(true);
                    }
                    else {
                        _this.sprite.xMirror = true;
                        Game.Goal.instance.setMirror(false);
                    }
                }
            };
            return this.stateStand;
        };
        Player.prototype.initOverlaps = function () {
            this.boxStuck = new Engine.Box();
            this.boxStuck.enabled = true;
            this.boxStuck.renderable = true;
            FRAMES_BOXES[1].applyToBox(this.boxStuck);
            this.boxStuck.red = 1;
            this.boxStuck.green = 0;
            this.boxStuck.blue = 0;
        };
        Player.prototype.initAnimations = function () {
            this.animStand = anims.stand;
            this.animMove = anims.move;
            this.animAscend = anims.ascend;
            this.animFall = anims.fall;
            this.animFallAscend = anims.fallAscend;
            this.animLanding = anims.landing;
            this.animStuck = anims.stuck;
        };
        Player.prototype.initEmitters = function () {
            this.emitterStuck = new Game.Emission.Emitter(Game.ParticleStuck, 12);
            this.emitterStuck.sizeEmission = 4;
            this.emitterUnStuck = new Game.Emission.Emitter(Game.ParticleUnStuck, 12);
            this.emitterUnStuck.sizeEmission = 4;
            this.emitterDead = new Game.Emission.Emitter(Game.ParticleEmerald, 14);
            this.emitterDead.sizeEmission = 7;
        };
        Player.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.setNormal();
            this.yScaleForceWorld = 1;
            this.stuckContacts = null;
            this.boxSolid.enabled = true;
            this.boxOverlap.enabled = true;
            this.sprite.enabled = true;
            this.controls.frames = FRAMES_CONTROL_NORMAL;
        };
        Player.prototype.fixFrames = function (frameArray) {
            for (var prop in anims) {
                var anim = anims[prop];
                anim.frames = frameArray;
            }
            this.animator.setCurrentFrame();
        };
        Player.prototype.setHappy = function () {
            this.fixFrames(FRAMES_ANIM_HAPPY);
        };
        Player.prototype.setNormal = function () {
            this.fixFrames(FRAMES_ANIM_NORMAL);
        };
        Player.prototype.setSad = function () {
            this.fixFrames(FRAMES_ANIM_SAD);
        };
        Player.prototype.onSetFrame = function (_animator, _animation, _frame) {
            _super.prototype.onSetFrame.call(this, _animator, _animation, _frame);
            _frame.applyToBox(this.boxOverlap);
        };
        Player.prototype.onMoveUpdate = function () {
            _super.prototype.onMoveUpdate.call(this);
        };
        Player.prototype.stuckPlatformCheck = function () {
            var newPlatformParent = null;
            if (this.stuckContacts != null) {
                for (var _i = 0, _a = this.stuckContacts; _i < _a.length; _i++) {
                    var contact = _a[_i];
                    if (contact.other.data instanceof Game.Arcade.Platformer.Platform) {
                        if (contact.other.data == this.platformParent) {
                            return;
                        }
                        else {
                            newPlatformParent = contact.other.data;
                        }
                    }
                }
            }
            if (newPlatformParent != null) {
                newPlatformParent.addChild(this);
            }
            else if (this.platformParent != null) {
                this.platformParent.removeChild(this);
            }
        };
        Player.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
        };
        Player.prototype.onGoal = function () {
            Game.Resources.sfxWin.play();
        };
        Player.prototype.onWinning = function () {
            this.setHappy();
        };
        Player.prototype.onLosing = function () {
            Game.Resources.sfxDeath.play();
        };
        Player.prototype.onTimeUpdate = function () {
            _super.prototype.onTimeUpdate.call(this);
            this.boxStuck.x = this.boxSolid.x;
            this.boxStuck.y = this.boxSolid.y;
        };
        Player.prototype.onDrawObjectsFront = function () {
            _super.prototype.onDrawObjectsFront.call(this);
            if (Engine.Box.debugRender) {
                this.boxStuck.render();
            }
        };
        return Player;
    }(Game.Arcade.Platformer.Simple.ControllablePlayer));
    Game.Player = Player;
})(Game || (Game = {}));
///<reference path = "Player.ts"/>
var Game;
(function (Game) {
    var FRAMES_ANIM_NORMAL;
    var FRAMES_ANIM_HAPPY;
    var FRAMES_ANIM_SAD;
    Game.addAction("configure", function () {
        FRAMES_ANIM_NORMAL = Game.FrameSelector.complex("enemy normal", Game.Resources.textureEnemies, 1, 24);
        FRAMES_ANIM_HAPPY = Game.FrameSelector.complex("enemy happy", Game.Resources.textureEnemies, 1, 48);
        FRAMES_ANIM_SAD = Game.FrameSelector.complex("enemy sad", Game.Resources.textureEnemies, 1, 72);
    });
    var PlayerEnding = /** @class */ (function (_super) {
        __extends(PlayerEnding, _super);
        function PlayerEnding(def) {
            return _super.call(this, def) || this;
        }
        Object.defineProperty(PlayerEnding.prototype, "winCondition", {
            get: function () {
                return false;
            },
            enumerable: false,
            configurable: true
        });
        PlayerEnding.prototype.onOverlapUpdate = function () {
            _super.prototype.onOverlapUpdate.call(this);
            if (!Game.SceneFreezer.stoped) {
                if (this.boxOverlap.collideAgainst(Game.Goal.instance.boxOverlap, null, true, 0, true, Engine.Box.LAYER_ALL) != null) {
                    this.setSad();
                    Game.Goal.instance.crush();
                }
            }
        };
        PlayerEnding.prototype.setHappy = function () {
            this.fixFrames(FRAMES_ANIM_HAPPY);
        };
        PlayerEnding.prototype.setNormal = function () {
            this.fixFrames(FRAMES_ANIM_NORMAL);
        };
        PlayerEnding.prototype.setSad = function () {
            this.fixFrames(FRAMES_ANIM_SAD);
        };
        return PlayerEnding;
    }(Game.Player));
    Game.PlayerEnding = PlayerEnding;
})(Game || (Game = {}));
///<reference path = "../Game/Utils/Emission/SimpleParticle.ts"/>
var Game;
(function (Game) {
    var ParticleStuck = /** @class */ (function (_super) {
        __extends(ParticleStuck, _super);
        function ParticleStuck(emitter) {
            var _this = _super.call(this, emitter) || this;
            _this.parentRelative = false;
            return _this;
        }
        Object.defineProperty(ParticleStuck.prototype, "xRange", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleStuck.prototype, "yRange", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleStuck.prototype, "xRangeVel", {
            get: function () {
                return -2 + Math.random() * 4;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleStuck.prototype, "yRangeVel", {
            get: function () {
                return -1.5 - Math.random() * 1.5;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleStuck.prototype, "xRangeAccel", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleStuck.prototype, "yRangeAccel", {
            get: function () {
                return Game.Arcade.yForceWorld;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleStuck.prototype, "rangeLife", {
            get: function () {
                return 300;
            },
            enumerable: false,
            configurable: true
        });
        ParticleStuck.prototype.emitt = function (index) {
            _super.prototype.emitt.call(this, index);
            TERRAIN_FRAMES[Math.floor(Math.random() * (EMERALD_FRAMES.length - 3)) + 1].applyToSprite(this.sprite);
        };
        return ParticleStuck;
    }(Game.Emission.SimpleParticle));
    Game.ParticleStuck = ParticleStuck;
    var ParticleUnStuck = /** @class */ (function (_super) {
        __extends(ParticleUnStuck, _super);
        function ParticleUnStuck(emitter) {
            var _this = _super.call(this, emitter) || this;
            _this.parentRelative = false;
            return _this;
        }
        Object.defineProperty(ParticleUnStuck.prototype, "xRange", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleUnStuck.prototype, "yRange", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleUnStuck.prototype, "xRangeVel", {
            get: function () {
                return -1 + Math.random() * 2;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleUnStuck.prototype, "yRangeVel", {
            get: function () {
                return -1 + Math.random() * 1;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleUnStuck.prototype, "xRangeAccel", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleUnStuck.prototype, "yRangeAccel", {
            get: function () {
                return Game.Arcade.yForceWorld;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleUnStuck.prototype, "rangeLife", {
            get: function () {
                return 300;
            },
            enumerable: false,
            configurable: true
        });
        ParticleUnStuck.prototype.emitt = function (index) {
            _super.prototype.emitt.call(this, index);
            TERRAIN_FRAMES[Math.floor(Math.random() * (EMERALD_FRAMES.length - 3)) + 2].applyToSprite(this.sprite);
        };
        return ParticleUnStuck;
    }(Game.Emission.SimpleParticle));
    Game.ParticleUnStuck = ParticleUnStuck;
    var ParticleDead = /** @class */ (function (_super) {
        __extends(ParticleDead, _super);
        function ParticleDead(emitter) {
            var _this = _super.call(this, emitter) || this;
            _this.parentRelative = false;
            return _this;
        }
        Object.defineProperty(ParticleDead.prototype, "xRange", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleDead.prototype, "yRange", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleDead.prototype, "xRangeVel", {
            get: function () {
                return -3 + Math.random() * 6;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleDead.prototype, "yRangeVel", {
            get: function () {
                return -5 + Math.random() * 3;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleDead.prototype, "xRangeAccel", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleDead.prototype, "yRangeAccel", {
            get: function () {
                return Game.Arcade.yForceWorld;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ParticleDead.prototype, "rangeLife", {
            get: function () {
                return 300;
            },
            enumerable: false,
            configurable: true
        });
        return ParticleDead;
    }(Game.Emission.SimpleParticle));
    Game.ParticleDead = ParticleDead;
    var EMERALD_FRAMES;
    var ENEMY_FRAMES;
    var AMBER_FRAMES;
    var TERRAIN_FRAMES;
    Game.addAction("configure", function () {
        EMERALD_FRAMES = Game.FrameSelector.complex("", Game.Resources.texture, 88, 145);
        ENEMY_FRAMES = Game.FrameSelector.complex("", Game.Resources.texture, 88, 161);
        AMBER_FRAMES = Game.FrameSelector.complex("", Game.Resources.texture, 88, 177);
        TERRAIN_FRAMES = Game.FrameSelector.complex("", Game.Resources.texture, 88, 193);
    });
    var ParticleEmerald = /** @class */ (function (_super) {
        __extends(ParticleEmerald, _super);
        function ParticleEmerald() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ParticleEmerald.prototype.emitt = function (index) {
            _super.prototype.emitt.call(this, index);
            if (Game.Player.instance instanceof Game.PlayerEnding) {
                ENEMY_FRAMES[Math.floor(Math.random() * (ENEMY_FRAMES.length - 3)) + 1].applyToSprite(this.sprite);
            }
            else {
                EMERALD_FRAMES[Math.floor(Math.random() * (EMERALD_FRAMES.length - 3)) + 1].applyToSprite(this.sprite);
            }
        };
        return ParticleEmerald;
    }(ParticleDead));
    Game.ParticleEmerald = ParticleEmerald;
    var ParticleEnemy = /** @class */ (function (_super) {
        __extends(ParticleEnemy, _super);
        function ParticleEnemy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ParticleEnemy.prototype.emitt = function (index) {
            _super.prototype.emitt.call(this, index);
            ENEMY_FRAMES[Math.floor(Math.random() * (ENEMY_FRAMES.length - 3)) + 1].applyToSprite(this.sprite);
        };
        return ParticleEnemy;
    }(ParticleDead));
    Game.ParticleEnemy = ParticleEnemy;
    var ParticleAmber = /** @class */ (function (_super) {
        __extends(ParticleAmber, _super);
        function ParticleAmber() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ParticleAmber.prototype.emitt = function (index) {
            _super.prototype.emitt.call(this, index);
            AMBER_FRAMES[Math.floor(Math.random() * (AMBER_FRAMES.length - 3)) + 1].applyToSprite(this.sprite);
        };
        return ParticleAmber;
    }(ParticleDead));
    Game.ParticleAmber = ParticleAmber;
})(Game || (Game = {}));
///<reference path = "../Game/Arcade/WorldEntity.ts"/>
var Game;
(function (Game) {
    var Spike = /** @class */ (function (_super) {
        __extends(Spike, _super);
        function Spike(def, frameBoxSolid, framesBoxesDamage, anim) {
            var _this = _super.call(this, def) || this;
            _this.boxesDamage = [];
            frameBoxSolid[0].applyToBox(_this.boxSolid);
            for (var _i = 0, framesBoxesDamage_1 = framesBoxesDamage; _i < framesBoxesDamage_1.length; _i++) {
                var frame = framesBoxesDamage_1[_i];
                var boxDamage = new Engine.Box();
                boxDamage.enabled = true;
                boxDamage.renderable = true;
                frame.applyToBox(boxDamage);
                Game.SceneMap.instance.boxesEnemies.push(boxDamage);
                _this.boxesDamage.push(boxDamage);
                Spike.boxes.push(boxDamage);
            }
            _this.xScaleForceWorld = 0;
            _this.yScaleForceWorld = 0;
            _this.xCanMove = false;
            _this.yCanMove = false;
            _this.animator.setAnimation(anim);
            return _this;
        }
        Spike.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            for (var _i = 0, _a = this.boxesDamage; _i < _a.length; _i++) {
                var boxDamage = _a[_i];
                boxDamage.x = this.boxSolid.x;
                boxDamage.y = this.boxSolid.y;
            }
        };
        Spike.prototype.onStart = function () {
            var contacts = this.boxSolid.collide(Game.SceneMap.instance.boxesSolids, null, false, 0, false, Engine.Box.LAYER_ALL);
            if (contacts != null) {
                for (var _i = 0, contacts_1 = contacts; _i < contacts_1.length; _i++) {
                    var contact = contacts_1[_i];
                    if (contact.other.data instanceof Game.Arcade.Platformer.Platform) {
                        contact.other.data.addChild(this);
                        break;
                    }
                }
            }
        };
        Spike.prototype.xMoveOnPlatform = function (dist) {
            this.boxSolid.x += dist;
            for (var _i = 0, _a = this.boxesDamage; _i < _a.length; _i++) {
                var boxDamage = _a[_i];
                boxDamage.x += dist;
            }
        };
        Spike.prototype.yMoveOnPlatform = function (dist) {
            this.boxSolid.y += dist;
            for (var _i = 0, _a = this.boxesDamage; _i < _a.length; _i++) {
                var boxDamage = _a[_i];
                boxDamage.y += dist;
            }
        };
        Spike.prototype.onPlatformOverlapX = function () {
        };
        Spike.prototype.onPlatformOverlapY = function () {
        };
        Spike.prototype.onDrawObjectsBack = function () {
            if (this.platformParent != null) {
                this.sprite.x += this.platformParent.xGetVelMove() * Engine.System.deltaTime;
                this.sprite.y += this.platformParent.yGetVelMove() * Engine.System.deltaTime;
            }
            this.sprite.render();
            if (Engine.Box.debugRender) {
                for (var _i = 0, _a = this.boxesDamage; _i < _a.length; _i++) {
                    var boxDamage = _a[_i];
                    boxDamage.render();
                }
            }
        };
        Spike.prototype.onClearScene = function () {
            Spike.boxes = [];
        };
        Spike.boxes = [];
        return Spike;
    }(Game.Arcade.WorldEntity));
    Game.Spike = Spike;
    var FRAME_BOX_SOLID_180;
    var FRAMES_BOXES_DAMAGE_180;
    var FRAMES_ANIM_180;
    var ANIM_180;
    Game.addAction("configure", function () {
        FRAME_BOX_SOLID_180 = Game.FrameSelector.complex("spike 180 solid", Game.Resources.texture, 263, 119);
        FRAMES_BOXES_DAMAGE_180 = Game.FrameSelector.complex("spike 180 damage", Game.Resources.texture, 287, 119);
        FRAMES_ANIM_180 = Game.FrameSelector.complex("spike 180 anim", Game.Resources.texture, 263, 143);
        ANIM_180 = new Utils.Animation("spike 180", false, FRAMES_ANIM_180, 1, [0], null);
    });
    var Spike180 = /** @class */ (function (_super) {
        __extends(Spike180, _super);
        function Spike180(def) {
            var _this = _super.call(this, def, FRAME_BOX_SOLID_180, FRAMES_BOXES_DAMAGE_180, ANIM_180) || this;
            _this.xAlign = "middle";
            return _this;
        }
        return Spike180;
    }(Spike));
    Game.Spike180 = Spike180;
    var FRAME_BOX_SOLID_360;
    var FRAMES_BOXES_DAMAGE_360;
    var FRAMES_ANIM_360;
    var ANIM_360;
    Game.addAction("configure", function () {
        FRAME_BOX_SOLID_360 = Game.FrameSelector.complex("spike 360 solid", Game.Resources.texture, 263, 167);
        FRAMES_BOXES_DAMAGE_360 = Game.FrameSelector.complex("spike 360 damage", Game.Resources.texture, 287, 167);
        FRAMES_ANIM_360 = Game.FrameSelector.complex("spike 360 anim", Game.Resources.texture, 263, 191);
        ANIM_360 = new Utils.Animation("spike 360", false, FRAMES_ANIM_360, 1, [0], null);
    });
    var Spike360 = /** @class */ (function (_super) {
        __extends(Spike360, _super);
        function Spike360(def) {
            var _this = _super.call(this, def, FRAME_BOX_SOLID_360, FRAMES_BOXES_DAMAGE_360, ANIM_360) || this;
            _this.xAlign = "middle";
            _this.yAlign = "start";
            return _this;
        }
        return Spike360;
    }(Spike));
    Game.Spike360 = Spike360;
    var FRAME_BOX_SOLID_90;
    var FRAMES_BOXES_DAMAGE_90;
    var FRAMES_ANIM_90;
    var ANIM_90;
    Game.addAction("configure", function () {
        FRAME_BOX_SOLID_90 = Game.FrameSelector.complex("spike 90 solid", Game.Resources.texture, 351, 119);
        FRAMES_BOXES_DAMAGE_90 = Game.FrameSelector.complex("spike 90 damage", Game.Resources.texture, 375, 119);
        FRAMES_ANIM_90 = Game.FrameSelector.complex("spike 90 anim", Game.Resources.texture, 351, 143);
        ANIM_90 = new Utils.Animation("spike 90", false, FRAMES_ANIM_90, 1, [0], null);
    });
    var Spike90 = /** @class */ (function (_super) {
        __extends(Spike90, _super);
        function Spike90(def) {
            var _this = _super.call(this, def, FRAME_BOX_SOLID_90, FRAMES_BOXES_DAMAGE_90, ANIM_90) || this;
            _this.xAlign = "start";
            _this.yAlign = "middle";
            return _this;
        }
        return Spike90;
    }(Spike));
    Game.Spike90 = Spike90;
    var FRAME_BOX_SOLID_270;
    var FRAMES_BOXES_DAMAGE_270;
    var FRAMES_ANIM_270;
    var ANIM_270;
    Game.addAction("configure", function () {
        FRAME_BOX_SOLID_270 = Game.FrameSelector.complex("spike 270 solid", Game.Resources.texture, 351, 167);
        FRAMES_BOXES_DAMAGE_270 = Game.FrameSelector.complex("spike 270 damage", Game.Resources.texture, 375, 167);
        FRAMES_ANIM_270 = Game.FrameSelector.complex("spike 270 anim", Game.Resources.texture, 351, 191);
        ANIM_270 = new Utils.Animation("spike 270", false, FRAMES_ANIM_270, 1, [0], null);
    });
    var Spike270 = /** @class */ (function (_super) {
        __extends(Spike270, _super);
        function Spike270(def) {
            var _this = _super.call(this, def, FRAME_BOX_SOLID_270, FRAMES_BOXES_DAMAGE_270, ANIM_270) || this;
            _this.xAlign = "end";
            _this.yAlign = "middle";
            return _this;
        }
        return Spike270;
    }(Spike));
    Game.Spike270 = Spike270;
})(Game || (Game = {}));
///<reference path="../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var StuckTutorial = /** @class */ (function (_super) {
        __extends(StuckTutorial, _super);
        function StuckTutorial() {
            var _this = _super.call(this) || this;
            var xPosA = 48 * 0.5 - 8;
            var yPosA = -20 - 20 - 10 + 47 + 16 + 8;
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.b;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = (Game.IS_TOUCH ? "2." : "4.") + " JUMP HIGH ENOUGH";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.xAligned = xPosA;
            text0.yAligned = yPosA;
            text0.superback = true;
            var text1 = new Utils.Text();
            text1.font = Game.FontManager.b;
            text1.scale = 1;
            text1.enabled = true;
            text1.pinned = true;
            text1.str = "UNDER SOLID SURFACES";
            text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.xAligned = xPosA;
            text1.yAligned = yPosA + 10;
            text1.superback = true;
            var text2 = new Utils.Text();
            text2.font = Game.FontManager.b;
            text2.scale = 1;
            text2.enabled = true;
            text2.pinned = true;
            text2.str = "TO GET STUCK ON THEM!";
            text2.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text2.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text2.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text2.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text2.xAligned = xPosA;
            text2.yAligned = yPosA + 20;
            text2.superback = true;
            var xPosB = -8;
            var yPosB = -20 - 20 - 10 + 17 - 34 + 20 - 2 - 8 - 8;
            var text4 = new Utils.Text();
            text4.font = Game.FontManager.b;
            text4.scale = 1;
            text4.enabled = true;
            text4.pinned = true;
            if (Game.IS_TOUCH) {
                text4.str = "3. PRESS THE JUMP BUTTON";
            }
            else if (Game.IS_EDGE || Game.FORCE_EDGE_TUTORIAL) {
                text4.str = "5. PRESS DOWN ARROW OR";
            }
            else {
                text4.str = "5. PRESS S - DOWN ARROW OR";
            }
            text4.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text4.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text4.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text4.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text4.xAligned = xPosB;
            text4.yAligned = yPosB;
            text4.superback = true;
            var text3 = new Utils.Text();
            text3.font = Game.FontManager.b;
            text3.scale = 1;
            text3.enabled = true;
            text3.pinned = true;
            if (Game.IS_TOUCH) {
                text3.str = "TO LET GO";
            }
            else {
                text3.str = "ANY JUMP BUTTON TO LET GO";
            }
            text3.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text3.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text3.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text3.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text3.xAligned = xPosB;
            text3.yAligned = yPosB + 10;
            text3.superback = true;
            return _this;
        }
        return StuckTutorial;
    }(Engine.Entity));
    Game.StuckTutorial = StuckTutorial;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Block;
    (function (Block) {
        Block.preserved = false;
        Block.ins = [];
        Block.def = [];
        Block.cou = 0;
        var Instance = /** @class */ (function (_super) {
            __extends(Instance, _super);
            function Instance(_df) {
                var _this = _super.call(this, _df) || this;
                Block.ins[Block.cou] = _this;
                Block.def[Block.cou] = _df;
                Block.def[Block.cou].instance.y -= Game.SceneMap.instance.ySizeTile * 1;
                Block.conspr(Block.cou);
                Block.conbox(Block.cou);
                if (Block.cou == 0)
                    Engine.System.addListenersFrom(Game.Block);
                _this.ind = Block.cou++;
                return _this;
            }
            return Instance;
        }(Game.Entity));
        Block.Instance = Instance;
        function onReset() {
            Block.resmec();
        }
        Block.onReset = onReset;
        function onStepUpdate() {
            if (Game.SceneFreezer.stoped)
                return;
        }
        Block.onStepUpdate = onStepUpdate;
        function onDrawObjectsBack() {
            Block.draspr();
            Block.drabox();
        }
        Block.onDrawObjectsBack = onDrawObjectsBack;
        function onClearScene() {
            Block.cou = 0;
        }
        Block.onClearScene = onClearScene;
    })(Block = Game.Block || (Game.Block = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Block;
    (function (Block) {
        Block.box = [];
        function conbox(i) {
            Block.box[i] = new Engine.Box();
            Block.box[i].renderable = true;
            Block.box[i].x = Block.def[i].instance.x;
            Block.box[i].y = Block.def[i].instance.y;
            Block.box[i].xSize = Game.SceneMap.instance.xSizeTile;
            Block.box[i].ySize = Game.SceneMap.instance.ySizeTile;
            Block.box[i].data = i;
            Game.SceneMap.instance.boxesSolids.push(Block.box[i]);
        }
        Block.conbox = conbox;
        function drabox() {
            for (var i = 0; i < Block.cou; i++)
                Block.box[i].render();
        }
        Block.drabox = drabox;
    })(Block = Game.Block || (Game.Block = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Block;
    (function (Block) {
        var fra;
        Game.addAction("preconfigure", function () { return fra = Game.FrameSelector.complex("blo", Game.Resources.texture, 712, 203); });
        var ena = [];
        function resmec() {
            for (var i = 0; i < Block.cou; i++) {
                ena[i] = !Block.ins[i].getProperty("ena");
                swi(i);
            }
        }
        Block.resmec = resmec;
        function swi(i) {
            ena[i] = !ena[i];
            Block.box[i].enabled = ena[i];
            fra[ena[i] ? 0 : 1].applyToSprite(Block.spr[i]);
        }
        function onSwitchPressed() {
            for (var i = 0; i < Block.cou; i++)
                swi(i);
        }
        Block.onSwitchPressed = onSwitchPressed;
    })(Block = Game.Block || (Game.Block = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Block;
    (function (Block) {
        Block.spr = [];
        function conspr(i) {
            Block.spr[i] = new Engine.Sprite();
            Block.spr[i].enabled = true;
            Block.spr[i].x = Block.def[i].instance.x;
            Block.spr[i].y = Block.def[i].instance.y;
        }
        Block.conspr = conspr;
        function draspr() {
            for (var i = 0; i < Block.cou; i++)
                Block.spr[i].render();
        }
        Block.draspr = draspr;
    })(Block = Game.Block || (Game.Block = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Switch;
    (function (Switch) {
        Switch.preserved = false;
        Switch.ins = [];
        Switch.def = [];
        Switch.cou = 0;
        function onClearScene() { Switch.cou = 0; }
        Switch.onClearScene = onClearScene;
        var Instance = /** @class */ (function (_super) {
            __extends(Instance, _super);
            function Instance(_df) {
                var _this = _super.call(this, _df) || this;
                Switch.ins[Switch.cou] = _this;
                Switch.def[Switch.cou] = _df;
                Switch.def[Switch.cou].instance.x += Game.SceneMap.instance.xSizeTile * 0.5;
                Switch.def[Switch.cou].instance.y -= (Game.SceneMap.instance.ySizeTile - Switch.fra[0].ySizeBox) * (Switch.def[Switch.cou].flip.y ? 1 : 0);
                Switch.conphy(Switch.cou);
                Switch.conspr(Switch.cou);
                Switch.conani(Switch.cou);
                if (Switch.cou == 0)
                    Engine.System.addListenersFrom(Game.Switch);
                _this.ind = Switch.cou++;
                return _this;
            }
            Instance.prototype.onSetFrame = function (_, __, fra) {
                Switch.fraani(this.ind, fra);
            };
            return Instance;
        }(Game.Entity));
        Switch.Instance = Instance;
        function onReset() {
            Switch.resphy();
            Switch.resspr();
            Switch.resmec();
        }
        Switch.onReset = onReset;
        function onMoveUpdate() {
            if (Game.SceneFreezer.stoped)
                return;
            Switch.movphy();
        }
        Switch.onMoveUpdate = onMoveUpdate;
        function onOverlapUpdate() {
            if (Game.SceneFreezer.stoped)
                return;
            Switch.ovemec();
        }
        Switch.onOverlapUpdate = onOverlapUpdate;
        function onTimeUpdate() {
            Switch.timphy();
            Switch.timspr();
        }
        Switch.onTimeUpdate = onTimeUpdate;
        function onDrawObjects() {
            Switch.draspr();
            Switch.draphy();
        }
        Switch.onDrawObjects = onDrawObjects;
    })(Switch = Game.Switch || (Game.Switch = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Switch;
    (function (Switch) {
        Switch.ani = [];
        function conani(i) {
            Switch.ani[i] = new Utils.Animator();
            Switch.ani[i].owner = Switch.ani[i].listener = Switch.ins[i];
        }
        Switch.conani = conani;
        function fraani(i, fra) {
            fra.applyToSprite(Switch.spr[i]);
            Switch.spr[i].yOffset += Switch.spr[i].yMirror ? Switch.box[i].ySize : 0;
        }
        Switch.fraani = fraani;
    })(Switch = Game.Switch || (Game.Switch = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Switch;
    (function (Switch) {
        var aninor;
        var anidow;
        Game.addAction("configure", function () {
            aninor = new Utils.Animation("nor", true, Switch.fra, 8, [1, 2, 3, 2], null);
            anidow = new Utils.Animation("dow", true, Switch.fra, 8, [5, 6, 7, 6], null);
        });
        var dow = [];
        function resmec() {
            for (var i = 0; i < Switch.cou; i++) {
                dow[i] = Switch.ins[i].getProperty("dow");
                Switch.ani[i].setAnimation(dow[i] ? anidow : aninor);
            }
        }
        Switch.resmec = resmec;
        function ovemec() {
            for (var i = 0; i < Switch.cou; i++) {
                if (!dow[i] && Switch.box[i].collideAgainst(Game.Player.instance.boxSolid) != null) {
                    Engine.System.triggerCustomEvent("onSwitchPressed");
                }
            }
        }
        Switch.ovemec = ovemec;
        function onSwitchPressed() {
            for (var i = 0; i < Switch.cou; i++) {
                Game.Resources.sfxButton.play();
                dow[i] = !dow[i];
                Switch.ani[i].setAnimation(dow[i] ? anidow : aninor);
            }
        }
        Switch.onSwitchPressed = onSwitchPressed;
    })(Switch = Game.Switch || (Game.Switch = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Switch;
    (function (Switch) {
        Switch.box = [];
        Switch.horvel = [];
        Switch.vervel = [];
        var maxvervel = 6;
        var gra = 0.2;
        Switch.grasca = [];
        Switch.gradir = [];
        Switch.horhit = [];
        Switch.verhit = [];
        Switch.horhitdir = [];
        Switch.verhitdir = [];
        Switch.ext = [];
        Switch.horextvel = [];
        Switch.verextvel = [];
        function conphy(i) {
            Switch.box[i] = new Engine.Box();
            Switch.box[i].enabled = Switch.box[i].renderable = true;
            Switch.fra[0].applyToBox(Switch.box[i]);
        }
        Switch.conphy = conphy;
        function resphy() {
            for (var i = 0; i < Switch.cou; i++) {
                Switch.box[i].enabled = true;
                Switch.box[i].x = Switch.def[i].instance.x;
                Switch.box[i].y = Switch.def[i].instance.y;
                Switch.horvel[i] = 0;
                Switch.vervel[i] = 0;
                Switch.grasca[i] = 1;
                Switch.gradir[i] = Switch.def[i].flip.y ? -1 : 1;
                Switch.horhit[i] = null;
                Switch.verhit[i] = null;
                Switch.horhitdir[i] = 0;
                Switch.verhitdir[i] = 0;
                Switch.horextvel[i] = 0;
                Switch.verextvel[i] = 0;
            }
        }
        Switch.resphy = resphy;
        function movphy() {
            for (var i = 0; i < Switch.cou; i++) {
                Switch.horhit[i] = Switch.box[i].cast(Game.SceneMap.instance.boxesSolids, null, true, Switch.horvel[i], true, Engine.Box.LAYER_ALL);
                Switch.box[i].translate(Switch.horhit[i], true, Switch.horvel[i], true);
                Switch.horhitdir[i] = Switch.horhit[i] == null ? 0 : (Switch.horvel[i] < 0 ? -1 : 1);
                //horvel[i]=horhit[i]!=null?0:horvel[i];
                Switch.vervel[i] += gra * Switch.grasca[i] * Switch.gradir[i];
                Switch.vervel[i] = Math.abs(Switch.vervel[i]) > maxvervel ? Game.dir(Switch.vervel[i]) * maxvervel : Switch.vervel[i];
                Switch.verhit[i] = Switch.box[i].cast(Game.SceneMap.instance.boxesSolids, null, false, Switch.vervel[i] == 0 ? Switch.gradir[i] : Switch.vervel[i], Switch.vervel[i] != 0, Engine.Box.LAYER_ALL);
                Switch.box[i].translate(Switch.verhit[i], false, Switch.vervel[i], true);
                Switch.verhitdir[i] = Switch.verhit[i] == null ? 0 : (Switch.vervel[i] < 0 ? -1 : 1);
                Switch.vervel[i] = Switch.verhit[i] != null ? 0 : Switch.vervel[i];
            }
        }
        Switch.movphy = movphy;
        function timphy() {
            for (var i = 0; i < Switch.cou; i++) {
                Switch.horextvel[i] = (Switch.horextvel[i] + Switch.horvel[i]) * (Game.SceneFreezer.stoped ? 0 : 1);
                Switch.verextvel[i] = (Switch.verextvel[i] + Switch.vervel[i]) * (Game.SceneFreezer.stoped ? 0 : 1);
                Switch.ext[i] = Switch.box[i].getExtrapolation(Game.SceneMap.instance.boxesSolids, Switch.horextvel[i], Switch.verextvel[i], true);
                Switch.horextvel[i] = 0;
                Switch.verextvel[i] = 0;
            }
        }
        Switch.timphy = timphy;
        function draphy() {
            for (var i = 0; i < Switch.cou; i++)
                Switch.box[i].renderAt(Switch.ext[i].x, Switch.ext[i].y);
        }
        Switch.draphy = draphy;
    })(Switch = Game.Switch || (Game.Switch = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Switch;
    (function (Switch) {
        Game.addAction("preconfigure", function () {
            Switch.fra = Game.FrameSelector.complex("flopat", Game.Resources.texture, 758, 203);
        });
        Switch.spr = [];
        function conspr(i) {
            Switch.spr[i] = new Engine.Sprite();
            Switch.spr[i].enabled = true;
            Switch.spr[i].yMirror = Switch.def[i].flip.y;
        }
        Switch.conspr = conspr;
        function resspr() {
            for (var i = 0; i < Switch.cou; i++) {
                Switch.spr[i].x = Switch.def[i].instance.x;
                Switch.spr[i].y = Switch.def[i].instance.y;
            }
        }
        Switch.resspr = resspr;
        function timspr() {
            for (var i = 0; i < Switch.cou; i++) {
                Switch.spr[i].xMirror = Switch.horvel[i] == 0 ? Switch.spr[i].xMirror : Switch.horvel[i] < 0;
                Switch.spr[i].x = Switch.ext[i].x;
                Switch.spr[i].y = Switch.ext[i].y;
            }
        }
        Switch.timspr = timspr;
        function draspr() {
            for (var i = 0; i < Switch.cou; i++)
                Switch.spr[i].render();
        }
        Switch.draspr = draspr;
    })(Switch = Game.Switch || (Game.Switch = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Fly;
    (function (Fly) {
        Fly.preserved = false;
        Fly.ins = [];
        Fly.def = [];
        Fly.cou = 0;
        var Instance = /** @class */ (function (_super) {
            __extends(Instance, _super);
            function Instance(_df) {
                var _this = _super.call(this, _df) || this;
                Fly.ins[Fly.cou] = _this;
                Fly.def[Fly.cou] = _df;
                Fly.def[Fly.cou].instance.x += Game.SceneMap.instance.xSizeTile * 0.5;
                Fly.def[Fly.cou].instance.y -= Game.SceneMap.instance.ySizeTile * 0.5;
                Fly.conphy(Fly.cou);
                Fly.conspr(Fly.cou);
                Fly.conani(Fly.cou);
                if (Fly.cou == 0)
                    Engine.System.addListenersFrom(Game.Fly);
                _this.ind = Fly.cou++;
                return _this;
            }
            Instance.prototype.onSetFrame = function (_, __, fra) {
                Fly.fraani(this.ind, fra);
                Fly.fraphy(this.ind, fra);
            };
            return Instance;
        }(Game.Entity));
        Fly.Instance = Instance;
        function onReset() {
            Fly.resphy();
            Fly.resspr();
            Fly.resemo();
            Fly.resani();
        }
        Fly.onReset = onReset;
        function onMoveUpdate() {
            if (Game.SceneFreezer.stoped)
                return;
            Fly.movphy();
        }
        Fly.onMoveUpdate = onMoveUpdate;
        function onStepUpdate() {
            if (Game.SceneFreezer.stoped)
                return;
        }
        Fly.onStepUpdate = onStepUpdate;
        function onTimeUpdate() {
            Fly.timphy();
            Fly.timspr();
        }
        Fly.onTimeUpdate = onTimeUpdate;
        function onDrawObjects() {
            Fly.draspr();
            Fly.draphy();
        }
        Fly.onDrawObjects = onDrawObjects;
        function onClearScene() {
            Fly.cou = 0;
        }
        Fly.onClearScene = onClearScene;
    })(Fly = Game.Fly || (Game.Fly = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Fly;
    (function (Fly) {
        Fly.ani = [];
        Game.addAction("configure", function () {
            var fra = Game.FrameSelector.complex("fly", Game.Resources.textureEnemies, 1, 133);
            Fly.anispr = new Utils.Animation("ani", true, fra, 7, [0, 1, 2, 1], null);
        });
        function conani(i) {
            Fly.ani[i] = new Utils.Animator();
            Fly.ani[i].owner = Fly.ani[i].listener = Fly.ins[i];
        }
        Fly.conani = conani;
        function resani() {
            for (var i = 0; i < Fly.cou; i++)
                Fly.ani[i].setAnimation(Fly.anispr);
        }
        Fly.resani = resani;
        function fraani(i, fra) {
            fra.applyToSprite(Fly.spr[i]);
        }
        Fly.fraani = fraani;
    })(Fly = Game.Fly || (Game.Fly = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Fly;
    (function (Fly) {
        function resemo() {
            for (var i = 0; i < Fly.cou; i++)
                Fly.ani[i].setoff(0);
        }
        Fly.resemo = resemo;
        function sethap() {
            for (var i = 0; i < Fly.cou; i++)
                Fly.ani[i].setoff(3);
        }
        Fly.sethap = sethap;
        function setsad() {
            for (var i = 0; i < Fly.cou; i++)
                Fly.ani[i].setoff(6);
        }
        Fly.setsad = setsad;
    })(Fly = Game.Fly || (Game.Fly = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Fly;
    (function (Fly) {
        var box = [];
        var horare = [];
        var horste = [];
        var horsta = [];
        var horcou = [];
        var verare = [];
        var verste = [];
        var versta = [];
        var vercou = [];
        Fly.hormir = [];
        Fly.horext = [];
        Fly.verext = [];
        function conphy(i) {
            box[i] = new Engine.Box();
            box[i].enabled = box[i].renderable = true;
            Game.SceneMap.instance.boxesEnemies.push(box[i]);
            horare[i] = Fly.ins[i].getProperty("horare") * Game.SceneMap.instance.xSizeTile;
            horste[i] = Fly.ins[i].getProperty("horste");
            horsta[i] = Fly.ins[i].getProperty("horsta");
            verare[i] = Fly.ins[i].getProperty("verare") * Game.SceneMap.instance.xSizeTile;
            verste[i] = Fly.ins[i].getProperty("verste");
            versta[i] = Fly.ins[i].getProperty("versta");
        }
        Fly.conphy = conphy;
        function resphy() {
            for (var i = 0; i < Fly.cou; i++) {
                horcou[i] = horsta[i];
                box[i].x = finhor(i, horcou[i]);
                vercou[i] = versta[i];
                box[i].y = finver(i, vercou[i]);
                Fly.hormir[i] = false;
            }
        }
        Fly.resphy = resphy;
        function finhor(i, cou) {
            if (horste[i] == 0)
                return Fly.def[i].instance.x;
            var mov = cou / horste[i];
            mov *= 2 * Math.PI;
            mov = (1 + Math.sin(mov - Math.PI * 0.5)) * 0.5 * horare[i];
            return Fly.def[i].instance.x + mov;
        }
        function finver(i, cou) {
            if (verste[i] == 0)
                return Fly.def[i].instance.y;
            var mov = cou / verste[i];
            mov *= 2 * Math.PI;
            mov = (1 + Math.sin(mov - Math.PI * 0.5)) * 0.5 * verare[i];
            return Fly.def[i].instance.y + mov;
        }
        function movphy() {
            for (var i = 0; i < Fly.cou; i++) {
                horcou[i] += (Game.Player.instance.winning || Game.Player.instance.losing ? 0 : 1);
                if (horcou[i] > horste[i])
                    horcou[i] = 0;
                if (horare[i] != 0)
                    Fly.hormir[i] = horcou[i] >= horste[i] * 0.5;
                if (horare[i] < 0)
                    Fly.hormir[i] = !Fly.hormir[i];
                vercou[i] += (Game.Player.instance.winning || Game.Player.instance.losing ? 0 : 1);
                if (vercou[i] > verste[i])
                    vercou[i] = 0;
                if (verare[i] != 0)
                    Fly.hormir[i] = vercou[i] >= verste[i] * 0.5;
                if (verare[i] < 0)
                    Fly.hormir[i] = !Fly.hormir[i];
                box[i].x = finhor(i, horcou[i]);
                box[i].y = finver(i, vercou[i]);
            }
        }
        Fly.movphy = movphy;
        function fraphy(i, fra) {
            fra.applyToBox(box[i]);
        }
        Fly.fraphy = fraphy;
        function timphy() {
            for (var i = 0; i < Fly.cou; i++) {
                Fly.horext[i] = Game.SceneFreezer.stoped ? 0 : Engine.System.stepExtrapolation * (Game.Player.instance.winning || Game.Player.instance.losing ? 0 : 1) * (horcou[i] == horste[i] ? -1 : 1);
                Fly.horext[i] = finhor(i, horcou[i] + Fly.horext[i]);
                Fly.verext[i] = Game.SceneFreezer.stoped ? 0 : Engine.System.stepExtrapolation * (Game.Player.instance.winning || Game.Player.instance.losing ? 0 : 1) * (vercou[i] == verste[i] ? -1 : 1);
                Fly.verext[i] = finver(i, vercou[i] + Fly.verext[i]);
            }
        }
        Fly.timphy = timphy;
        function draphy() {
            for (var i = 0; i < Fly.cou; i++)
                box[i].renderAt(Fly.horext[i], Fly.verext[i]);
        }
        Fly.draphy = draphy;
    })(Fly = Game.Fly || (Game.Fly = {}));
})(Game || (Game = {}));
/*


namespace Game{


    export class Fly extends Entity implements Utils.AnimatorListener{
        public box:Engine.Box;
        active:boolean;
        onScreenActivation:Boolean;
        xOnScreenActivation:number;
        yOnScreenActivation:number;

        protected constructor(def:any){
            super(def);
            this.box=new Engine.Box();
            box[i].enabled=true;
            box[i].renderable=true;
            FRAMES[0].applyToBox(this.box);
            box[i].data=this;

            SceneMap.instance.boxesEnemies.push(this.box);
            

            this.onScreenActivation=this.getProperty("on screen activation");
            this.xOnScreenActivation=this.getProperty("on screen activation x");
            this.yOnScreenActivation=this.getProperty("on screen activation y");
        }

        onReset(){
            

            

            this.active=!this.onScreenActivation;
        }

        

        

        

        
        onSetFrame(_animator: Utils.Animator, _animation: Utils.Animation, frame: Utils.AnimationFrame): void {
            frame.applyToSprite(this.sprite);
        }

        public onDrawObjects(){
            this.sprite.render();
            box[i].render();
        }

    }
}


*/
var Game;
(function (Game) {
    var Fly;
    (function (Fly) {
        Fly.spr = [];
        function conspr(i) {
            Fly.spr[i] = new Engine.Sprite();
            Fly.spr[i].enabled = true;
            Fly.spr[i].yMirror = Fly.def[i].flip.y;
        }
        Fly.conspr = conspr;
        function resspr() {
            for (var i = 0; i < Fly.cou; i++) {
                Fly.spr[i].x = Fly.def[i].instance.x;
                Fly.spr[i].y = Fly.def[i].instance.y;
            }
        }
        Fly.resspr = resspr;
        function timspr() {
            for (var i = 0; i < Fly.cou; i++) {
                Fly.spr[i].xMirror = Fly.hormir[i];
                Fly.spr[i].x = Fly.horext[i];
                Fly.spr[i].y = Fly.verext[i];
            }
        }
        Fly.timspr = timspr;
        function draspr() {
            for (var i = 0; i < Fly.cou; i++) {
                Fly.spr[i].render();
            }
        }
        Fly.draspr = draspr;
    })(Fly = Game.Fly || (Game.Fly = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.preserved = false;
        Jumper.ins = [];
        Jumper.def = [];
        Jumper.cou = 0;
        function onClearScene() {
            Jumper.cou = 0;
        }
        Jumper.onClearScene = onClearScene;
        var Instance = /** @class */ (function (_super) {
            __extends(Instance, _super);
            function Instance(_df) {
                var _this = _super.call(this, _df) || this;
                _this.platformParent = null;
                Jumper.ins[Jumper.cou] = _this;
                Jumper.def[Jumper.cou] = _df;
                Jumper.def[Jumper.cou].instance.x += Game.SceneMap.instance.xSizeTile * 0.5;
                Jumper.def[Jumper.cou].instance.y -= (Game.SceneMap.instance.ySizeTile - Jumper.fra[0].ySizeBox) * (Jumper.def[Jumper.cou].flip.y ? 1 : 0);
                Jumper.conspr(Jumper.cou);
                Jumper.conani(Jumper.cou);
                Jumper.conphy(Jumper.cou);
                Jumper.conove(Jumper.cou);
                Jumper.condra(Jumper.cou);
                Jumper.consta(Jumper.cou);
                if (Jumper.cou == 0)
                    Engine.System.addListenersFrom(Game.Jumper);
                _this.ind = Jumper.cou++;
                return _this;
            }
            Instance.prototype.xMoveOnPlatform = function (dis) {
                Jumper.horplamov(this.ind, dis);
            };
            Instance.prototype.yMoveOnPlatform = function (dis) {
                Jumper.verplamov(this.ind, dis);
            };
            Instance.prototype.onPlatformOverlapX = function () { };
            Instance.prototype.onPlatformOverlapY = function () { };
            Instance.prototype.onSetFrame = function (_, __, fra) {
                Jumper.fraani(this.ind, fra);
                Jumper.fraove(this.ind, fra);
            };
            return Instance;
        }(Game.Entity));
        Jumper.Instance = Instance;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        function onReset() {
            Jumper.resphy();
            Jumper.resspr();
            Jumper.resemo();
            Jumper.resove();
            Jumper.ressta();
        }
        Jumper.onReset = onReset;
        function onMoveUpdate() {
            if (Game.SceneFreezer.stoped)
                return;
            Jumper.movphy();
            Jumper.movpla();
            Jumper.movove();
        }
        Jumper.onMoveUpdate = onMoveUpdate;
        function onStepUpdate() {
            if (Game.SceneFreezer.stoped)
                return;
            Jumper.stesta();
        }
        Jumper.onStepUpdate = onStepUpdate;
        function onTimeUpdate() {
            Jumper.timpla();
            Jumper.timphy();
            Jumper.timspr();
            Jumper.timove();
        }
        Jumper.onTimeUpdate = onTimeUpdate;
        function onDrawObjects() {
            Jumper.draspr();
            Jumper.draphy();
            Jumper.draove();
        }
        Jumper.onDrawObjects = onDrawObjects;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.sta = [];
        function consta(i) {
            Jumper.conjum(i);
        }
        Jumper.consta = consta;
        function ressta() {
            Jumper.residl();
            Jumper.resjum();
        }
        Jumper.ressta = ressta;
        function stesta() {
            for (var i = 0; i < Jumper.cou; i++) {
                switch (Jumper.sta[i]) {
                    case Jumper.staidl:
                        Jumper.steidl(i);
                        break;
                    case Jumper.stapre:
                        Jumper.stepre(i);
                        break;
                    case Jumper.stajum:
                        Jumper.stejum(i);
                        break;
                    case Jumper.stafal:
                        Jumper.stefal(i);
                        break;
                    case Jumper.stalan:
                        Jumper.stelan(i);
                        break;
                }
            }
        }
        Jumper.stesta = stesta;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.ani = [];
        function conani(i) {
            Jumper.ani[i] = new Utils.Animator();
            Jumper.ani[i].owner = Jumper.ani[i].listener = Jumper.ins[i];
        }
        Jumper.conani = conani;
        function fraani(i, fra) {
            fra.applyToSprite(Jumper.spr[i]);
            Jumper.spr[i].yOffset += Jumper.spr[i].yMirror ? Jumper.box[i].ySize : 0;
        }
        Jumper.fraani = fraani;
        function offani(off) {
            for (var i = 0; i < Jumper.cou; i++)
                Jumper.ani[i].setoff(off);
        }
        Jumper.offani = offani;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
/*
export var ani:Utils.Animator;
export function conani(){
    ani=new Utils.Animator();
    ani.enabled=true;
    ani.owner=ani.listener=Game.Player;
}
export function resani(){
    ani.enabled=true;
}
export function onSetFrame(_:Utils.Animator,__:Animation,fra:Utils.AnimationFrame){
    ani.off=offani*(((xhitdir>0&&!spr.xMirror)||(xhitdir<0&&spr.xMirror))?1:0);
    fra.applyToSprite(spr);
}
export function timani(){
    ani.setCurrentFrame();
}
*/ 
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.drasca = [];
        var minvel = 0.01;
        function condra(i) {
            Jumper.drasca[i] = Jumper.ins[i].getProperty("drasca");
        }
        Jumper.condra = condra;
        function stedra(i) {
            Jumper.horvel[i] *= Jumper.drasca[i];
            Jumper.horvel[i] = Math.abs(Jumper.horvel[i]) < minvel ? 0 : Jumper.horvel[i];
        }
        Jumper.stedra = stedra;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        function resemo() {
            for (var i = 0; i < Jumper.cou; i++)
                Jumper.ani[i].setoff(0);
        }
        Jumper.resemo = resemo;
        function sethap() {
            for (var i = 0; i < Jumper.cou; i++)
                Jumper.ani[i].setoff(9);
        }
        Jumper.sethap = sethap;
        function setsad() {
            for (var i = 0; i < Jumper.cou; i++)
                Jumper.ani[i].setoff(18);
        }
        Jumper.setsad = setsad;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Game.addAction("preconfigure", function () {
            Jumper.fra = Game.FrameSelector.complex("jumper", Game.Resources.textureEnemies, 1, 96);
        });
        Jumper.spr = [];
        function conspr(i) {
            Jumper.spr[i] = new Engine.Sprite();
            Jumper.spr[i].enabled = true;
            Jumper.spr[i].yMirror = Jumper.def[i].flip.y;
        }
        Jumper.conspr = conspr;
        function resspr() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.spr[i].x = Jumper.def[i].instance.x;
                Jumper.spr[i].y = Jumper.def[i].instance.y;
            }
        }
        Jumper.resspr = resspr;
        function timspr() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.spr[i].x = Jumper.ext[i].x;
                Jumper.spr[i].y = Jumper.ext[i].y;
            }
        }
        Jumper.timspr = timspr;
        function draspr() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.spr[i].render();
            }
        }
        Jumper.draspr = draspr;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.ove = [];
        function conove(i) {
            Jumper.ove[i] = new Engine.Box();
            Jumper.ove[i].enabled = Jumper.ove[i].renderable = true;
            Game.SceneMap.instance.boxesEnemies.push(Jumper.ove[i]);
        }
        Jumper.conove = conove;
        function resove() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.ove[i].x = Jumper.def[i].instance.x;
                Jumper.ove[i].y = Jumper.def[i].instance.y;
            }
        }
        Jumper.resove = resove;
        function movove() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.ove[i].x = Jumper.box[i].x;
                Jumper.ove[i].y = Jumper.box[i].y;
            }
        }
        Jumper.movove = movove;
        function fraove(i, fra) {
            fra.applyToBox(Jumper.ove[i]);
            Jumper.ove[i].yOffset = Jumper.spr[i].yMirror ? -Jumper.box[i].ySize : Jumper.ove[i].yOffset;
        }
        Jumper.fraove = fraove;
        function timove() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.ove[i].x = Jumper.ext[i].x;
                Jumper.ove[i].y = Jumper.ext[i].y;
            }
        }
        Jumper.timove = timove;
        function draove() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.ove[i].render();
            }
        }
        Jumper.draove = draove;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.box = [];
        Jumper.horvel = [];
        Jumper.vervel = [];
        Jumper.gradir = [];
        Jumper.verhit = [];
        Jumper.verhitdir = [];
        Jumper.ext = [];
        Jumper.horextvel = [];
        Jumper.verextvel = [];
        function conphy(i) {
            Jumper.box[i] = new Engine.Box();
            Jumper.box[i].enabled = Jumper.box[i].renderable = true;
            Jumper.fra[0].applyToBox(Jumper.box[i]);
        }
        Jumper.conphy = conphy;
        function resphy() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.box[i].enabled = true;
                Jumper.box[i].x = Jumper.def[i].instance.x;
                Jumper.box[i].y = Jumper.def[i].instance.y;
                Jumper.horvel[i] = 0;
                Jumper.vervel[i] = 0;
                Jumper.gradir[i] = Jumper.def[i].flip.y ? -1 : 1;
                Jumper.verhit[i] = null;
                Jumper.verhitdir[i] = 0;
                Jumper.horextvel[i] = 0;
                Jumper.verextvel[i] = 0;
            }
        }
        Jumper.resphy = resphy;
        function movphy() {
            for (var i = 0; i < Jumper.cou; i++) {
                var horhit = Jumper.box[i].cast(Game.SceneMap.instance.boxesSolids, null, true, Jumper.horvel[i], true, Engine.Box.LAYER_ALL);
                Jumper.box[i].translate(horhit, true, Jumper.horvel[i], true);
                Jumper.vervel[i] += Game.Arcade.yForceWorld * Jumper.gradir[i];
                Jumper.verhit[i] = Jumper.box[i].cast(Game.SceneMap.instance.boxesSolids, null, false, Jumper.vervel[i], true, Engine.Box.LAYER_ALL);
                Jumper.box[i].translate(Jumper.verhit[i], false, Jumper.vervel[i], true);
                Jumper.verhitdir[i] = Jumper.verhit[i] == null ? 0 : (Jumper.vervel[i] < 0 ? -1 : 1);
                Jumper.vervel[i] = Jumper.verhit[i] != null ? 0 : Jumper.vervel[i];
            }
        }
        Jumper.movphy = movphy;
        function timphy() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.horextvel[i] = (Jumper.horextvel[i] + Jumper.horvel[i]) * (Game.SceneFreezer.stoped ? 0 : 1);
                Jumper.verextvel[i] = (Jumper.verextvel[i] + Jumper.vervel[i]) * (Game.SceneFreezer.stoped ? 0 : 1);
                Jumper.ext[i] = Jumper.box[i].getExtrapolation(Game.SceneMap.instance.boxesSolids, Jumper.horextvel[i], Jumper.verextvel[i], true);
                Jumper.horextvel[i] = 0;
                Jumper.verextvel[i] = 0;
            }
        }
        Jumper.timphy = timphy;
        function draphy() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.box[i].renderAt(Jumper.ext[i].x, Jumper.ext[i].y);
            }
        }
        Jumper.draphy = draphy;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        function conpla(i) {
            Jumper.ins[i].boxSolid = Jumper.box[i];
            Game.Platform.pushInteractable(Jumper.ins[i]);
        }
        Jumper.conpla = conpla;
        function movpla() {
            for (var i = 0; i < Jumper.cou; i++) {
                var pla = null;
                if (Game.dir(Jumper.verhitdir[i]) == Jumper.gradir[i]) {
                    for (var _i = 0, _a = Jumper.verhit[i]; _i < _a.length; _i++) {
                        var hit = _a[_i];
                        if (hit.other.data instanceof Game.Platform) {
                            if (hit.other.data == Jumper.ins[i].platformParent) {
                                return;
                            }
                            else {
                                pla = hit.other.data;
                            }
                        }
                    }
                }
                if (pla != null)
                    pla.addChild(Jumper.ins[i]);
                else if (Jumper.ins[i].platformParent != null)
                    Jumper.ins[i].platformParent.removeChild(Jumper.ins[i]);
            }
        }
        Jumper.movpla = movpla;
        function horplamov(i, dis) {
            var hit = Jumper.box[i].cast(Game.SceneMap.instance.boxesSolids, null, true, dis, true, Engine.Box.LAYER_ALL);
            Jumper.box[i].translate(hit, true, dis, true);
        }
        Jumper.horplamov = horplamov;
        function verplamov(i, dis) {
            var hit = Jumper.box[i].cast(Game.SceneMap.instance.boxesSolids, null, false, dis, true, Engine.Box.LAYER_ALL);
            Jumper.box[i].translate(hit, false, dis, true);
        }
        Jumper.verplamov = verplamov;
        function timpla() {
            if (Game.SceneFreezer.stoped)
                return;
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.horextvel[i] += Jumper.ins[i].platformParent == null ? 0 : Jumper.ins[i].platformParent.xGetVelMove();
                Jumper.verextvel[i] += Jumper.ins[i].platformParent == null ? 0 : Jumper.ins[i].platformParent.yGetVelMove();
            }
        }
        Jumper.timpla = timpla;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.stacou = Jumper.stacou || 0;
        Jumper.stafal = Jumper.stacou++;
        Game.addAction("configure", function () { Jumper.anifal = new Utils.Animation("fal", false, Jumper.fra, 6, [6, 7, 8], null); });
        function setfal(i) {
            Jumper.ani[i].setAnimation(Jumper.anifal);
            Jumper.sta[i] = Jumper.stafal;
        }
        Jumper.setfal = setfal;
        function stefal(i) {
            if (Jumper.verhitdir[i] == Jumper.gradir[i])
                Jumper.setlan(i);
        }
        Jumper.stefal = stefal;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.stacou = Jumper.stacou || 0;
        Jumper.staidl = Jumper.stacou++;
        Game.addAction("configure", function () { Jumper.aniidl = new Utils.Animation("idl", true, Jumper.fra, 10, [1, 2, 3, 2], null); });
        var couidl = [];
        var couexi = [];
        function residl() {
            for (var i = 0; i < Jumper.cou; i++) {
                setidl(i);
                couidl[i] = Jumper.ins[i].getProperty("steidlbeg");
                couexi[i] = 0;
            }
        }
        Jumper.residl = residl;
        function setidl(i) {
            Jumper.ani[i].setAnimation(Jumper.aniidl);
            Jumper.sta[i] = Jumper.staidl;
            couidl[i] = Jumper.ins[i].getProperty("steidl");
        }
        Jumper.setidl = setidl;
        function steidl(i) {
            Jumper.stedra(i);
            couidl[i] -= Jumper.horvel[i] == 0 ? 1 : 0;
            if (Jumper.verhitdir[i] == 0)
                Jumper.setfal(i);
            else if (couidl[i] <= 0 && !Game.Player.instance.winning && !Game.Player.instance.losing) {
                couexi[i]++;
                Jumper.box[i].x = couexi[i] % 2 == 0 ? Jumper.box[i].x : Jumper.def[i].instance.x;
                Jumper.setpre(i);
            }
        }
        Jumper.steidl = steidl;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.stacou = Jumper.stacou || 0;
        Jumper.stajum = Jumper.stacou++;
        Game.addAction("configure", function () { Jumper.anijum = new Utils.Animation("jum", false, Jumper.fra, 3, [4, 5], null); });
        Jumper.horjumvel = [];
        Jumper.verjumvel = [];
        Jumper.horjumdir = [];
        function conjum(i) {
            Jumper.horjumvel[i] = Jumper.ins[i].getProperty("horjumvel");
            Jumper.verjumvel[i] = Jumper.ins[i].getProperty("verjumvel");
        }
        Jumper.conjum = conjum;
        function resjum() {
            for (var i = 0; i < Jumper.cou; i++) {
                Jumper.horjumdir[i] = Jumper.ins[i].getProperty("horjumdir");
            }
        }
        Jumper.resjum = resjum;
        function setjum(i) {
            Game.Resources.sfxJumper.play();
            Jumper.ani[i].setAnimation(Jumper.anijum);
            Jumper.horvel[i] = Jumper.horjumvel[i] * Jumper.horjumdir[i];
            Jumper.vervel[i] = -Jumper.verjumvel[i] * Jumper.gradir[i];
            Jumper.horjumdir[i] *= -1;
            Jumper.sta[i] = Jumper.stajum;
        }
        Jumper.setjum = setjum;
        function stejum(i) {
            if (Game.dir(Jumper.vervel[i]) == Jumper.gradir[i])
                Jumper.setfal(i);
        }
        Jumper.stejum = stejum;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.stacou = Jumper.stacou || 0;
        Jumper.stalan = Jumper.stacou++;
        Game.addAction("configure", function () { Jumper.anilan = new Utils.Animation("lan", false, Jumper.fra, 3, [2, 3, 2], null); });
        function setlan(i) {
            Jumper.ani[i].setAnimation(Jumper.anilan);
            Jumper.sta[i] = Jumper.stalan;
            Jumper.stedra(i);
        }
        Jumper.setlan = setlan;
        function stelan(i) {
            Jumper.stedra(i);
            if (Jumper.verhitdir[i] == 0)
                Jumper.setfal(i);
            else if (Jumper.ani[i].ended)
                Jumper.setidl(i);
        }
        Jumper.stelan = stelan;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Jumper;
    (function (Jumper) {
        Jumper.stacou = Jumper.stacou || 0;
        Jumper.stapre = Jumper.stacou++;
        Game.addAction("configure", function () { Jumper.anipre = new Utils.Animation("pre", false, Jumper.fra, 3, [2, 3, 2, 1, 1], null); });
        function setpre(i) {
            Jumper.ani[i].setAnimation(Jumper.anipre);
            Jumper.sta[i] = Jumper.stapre;
        }
        Jumper.setpre = setpre;
        function stepre(i) {
            if (Jumper.verhitdir[i] == 0)
                Jumper.setfal(i);
            else if (Jumper.ani[i].ended)
                Jumper.setjum(i);
        }
        Jumper.stepre = stepre;
    })(Jumper = Game.Jumper || (Game.Jumper = {}));
})(Game || (Game = {}));
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var X_LOADING_START = 0;
    var STEPS_DOTS = 20;
    //TODO: CHANGE SCENE FREEZER
    var LevelAdLoader = /** @class */ (function (_super) {
        __extends(LevelAdLoader, _super);
        function LevelAdLoader() {
            var _this = _super.call(this) || this;
            _this.count = 0;
            LevelAdLoader.instance = _this;
            _this.text = new Utils.Text();
            _this.text.font = Game.FontManager.b;
            _this.text.scale = 1;
            _this.text.enabled = false;
            _this.text.pinned = true;
            _this.text.str = "   PLEASE WAIT   ";
            _this.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAligned = X_LOADING_START;
            _this.text.yAligned = 0;
            _this.text.front = true;
            _this.red = 0 / 255;
            _this.green = 0 / 255;
            _this.blue = 0 / 255;
            _this.alpha = 0;
            _this.sprite.setRGBA(_this.red, _this.green, _this.blue, 0);
            _this.maxAlpha = 0.5;
            _this.speed = 0.0166666666666667 * 4;
            return _this;
        }
        Object.defineProperty(LevelAdLoader, "blocked", {
            get: function () {
                return LevelAdLoader.instance.alpha != 0;
            },
            enumerable: false,
            configurable: true
        });
        LevelAdLoader.prototype.onStepUpdate = function () {
            if (this.direction > 0 && !this.text.enabled && this.alpha > 0.05) {
                //this.text.enabled = true;
            }
            else if (this.direction < 0 && this.text.enabled && this.alpha < 0.05) {
                //this.text.enabled = false;
            }
            if (this.text.enabled) {
                this.count += 1;
                if (this.count == STEPS_DOTS) {
                    this.count = 0;
                    if (this.text.str == "   PLEASE WAIT   ") {
                        this.text.str = "  .PLEASE WAIT.  ";
                    }
                    else if (this.text.str == "  .PLEASE WAIT.  ") {
                        this.text.str = " ..PLEASE WAIT.. ";
                    }
                    else if (this.text.str == " ..PLEASE WAIT.. ") {
                        this.text.str = "...PLEASE WAIT...";
                    }
                    else if (this.text.str == "...PLEASE WAIT...") {
                        this.text.str = "   PLEASE WAIT   ";
                    }
                }
                if (!LevelAdLoader.blocked) {
                    this.text.enabled = false;
                }
            }
        };
        LevelAdLoader.prototype.onDrawFade = function () {
        };
        LevelAdLoader.prototype.onDrawAdFade = function () {
            this.sprite.render();
        };
        LevelAdLoader.show = function () {
            LevelAdLoader.instance.text.enabled = true;
            LevelAdLoader.instance.text.str = "   PLEASE WAIT   ";
            LevelAdLoader.instance.count = 0;
            LevelAdLoader.instance.direction = 1;
            //LevelAdLoader.instance.speed = 0.0166666666666667 * 9999;
        };
        LevelAdLoader.hide = function (slowOnSpeedrun) {
            if (slowOnSpeedrun === void 0) { slowOnSpeedrun = false; }
            if (Game.Level.speedrun && slowOnSpeedrun && (Game.Scene.nextSceneClass == Game.Level || Game.Scene.nextSceneClass == "reset")) {
                LevelAdLoader.instance.speed = 0.0166666666666667 * 1;
            }
            else {
                LevelAdLoader.instance.speed = 0.0166666666666667 * 4;
            }
            LevelAdLoader.instance.direction = -1;
        };
        LevelAdLoader.prototype.onClearScene = function () {
            LevelAdLoader.instance = null;
        };
        LevelAdLoader.instance = null;
        return LevelAdLoader;
    }(Utils.Fade));
    Game.LevelAdLoader = LevelAdLoader;
})(Game || (Game = {}));
