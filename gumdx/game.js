"use strict";
var Engine;
(function (Engine) {
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
                return Assets.downloadedSize == size && !Assets.downloadingAssets;
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
                this.source[this.source.start ? 'start' : 'noteOn'](0, this.source.loop ? 40 * 0 : 0);
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
                if (this == other || !other.enabled || (mask != Box.LAYER_ALL && !(mask & other.layer)) || this.xSize == 0 || this.ySize == 0 || other.xSize == 0 || other.ySize == 0) {
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
            if (this == other || !other.enabled || (mask != Box.LAYER_ALL && !(mask & other.layer)) || this.xSize == 0 || this.ySize == 0 || other.xSize == 0 || other.ySize == 0) {
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
                Renderer.gl.clearColor(26 / 255, 26 / 255, 26 / 255, 1);
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
                //System.pauseCount -= 1;
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
            Engine.Data.setID("com", "kez", "gumdx");
        }
        else {
            Engine.Data.setID("c", "k", "gmx");
        }
        //SceneColors.clearColor(255, 255, 255);
        Engine.System.createEvent(Engine.EventType.CREATE_SCENE, "onCreateScene");
        Engine.System.createEvent(Engine.EventType.INIT_SCENE, "onInitScene");
        Engine.System.createEvent(Engine.EventType.RESET_SCENE, "onReset");
        Engine.System.createEvent(Engine.EventType.RESET_SCENE, "onStart");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateAnchor");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateText");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdate");
        Engine.System.createEvent(Engine.EventType.CUSTOM, "onGameSwitchChange");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onControlPreUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onControlUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMoveReady");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMoveConfigUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onPlatformMoveUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMoveUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onOverlapUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onOverlapBlockUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onAnimationUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepLateUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdateFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onTimeUpdate");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onTimeUpdateSceneBeforeDrawFixed");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawBackground");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSceneSky");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSceneMap");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSceneFill");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawTextSuperBack");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesBack");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsBack");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticles");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjects");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawBoxes");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesFrontPaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPlayerPaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawGoalPaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsFrontPaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawGoalParticlesFrontPaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesPaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawControlsPaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesFrontUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPlayerUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawGoalUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsFrontUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawGoalParticlesFrontUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawControlsUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPause");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawUIDialogs");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawButtons");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawDialogs");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPreloadParticles");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawText");
        /*
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesFrontUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPlayerUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawGoalUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsFrontUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawGoalParticlesFrontUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesUnpaused");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawControlsUnpaused");
        */
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsAfterUI");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawOrientationUI");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawAdFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawTextFront");
        Engine.System.createEvent(Engine.EventType.CLEAR_SCENE, "onClearScene");
        for (var i = 1; i <= Game.MAX_LEVELS; i += 1) {
            Game.dataLevelsNormal[i] = Engine.Data.load("level.normal." + i) || "locked";
        }
        if (Game.dataLevelsNormal[1] == "locked") {
            Game.dataLevelsNormal[1] = "unlocked";
        }
        for (var i = 1; i <= Game.MAX_LEVELS; i += 1) {
            Game.dataLevelsHard[i] = Engine.Data.load("level.hard." + i) || "locked";
        }
        if (Game.dataLevelsHard[1] == "locked") {
            Game.dataLevelsHard[1] = "unlocked";
        }
        Game.levelSpeedrunNormal = +(Engine.Data.load("speedrunlevel.normal"));
        Game.levelSpeedrunNormal = isNaN(Game.levelSpeedrunNormal) ? 1 : Game.levelSpeedrunNormal;
        Game.levelSpeedrunNormal = Game.levelSpeedrunNormal == 0 ? 1 : Game.levelSpeedrunNormal;
        Game.dataSpeedrunNormal = +(Engine.Data.load("speedrundata.normal"));
        Game.dataSpeedrunNormal = isNaN(Game.dataSpeedrunNormal) ? 0 : Game.dataSpeedrunNormal;
        Game.recordSpeedrunNormal = +(Engine.Data.load("speedrunrecord.normal"));
        Game.recordSpeedrunNormal = isNaN(Game.recordSpeedrunNormal) ? 0 : Game.recordSpeedrunNormal;
        Game.levelSpeedrunHard = +(Engine.Data.load("speedrunlevel.hard"));
        Game.levelSpeedrunHard = isNaN(Game.levelSpeedrunHard) ? 1 : Game.levelSpeedrunHard;
        Game.levelSpeedrunHard = Game.levelSpeedrunHard == 0 ? 1 : Game.levelSpeedrunHard;
        Game.dataSpeedrunHard = +(Engine.Data.load("speedrundata.hard"));
        Game.dataSpeedrunHard = isNaN(Game.dataSpeedrunHard) ? 0 : Game.dataSpeedrunHard;
        Game.recordSpeedrunHard = +(Engine.Data.load("speedrunrecord.hard"));
        Game.recordSpeedrunHard = isNaN(Game.recordSpeedrunHard) ? 0 : Game.recordSpeedrunHard;
        Game.triggerActions("loadgame");
        //FORCE_TOUCH = true;
        Engine.Box.debugRender = false;
        //SKIP_PRELOADER = true;
        //Level.hard = true;
        //startingSceneClass = LastScene;
        Game.startingSceneClass = Game.MainMenu;
    };
    //console.log("ADD SPEEDRUNNN FOR BOTH DIFFICULTIES AND UPDATE THE SAVE METHOD AND KONGREGATE API");
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
    Game.dataLevelsNormal = new Array();
    Game.dataLevelsHard = new Array();
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
            eval("new " + def.type.type + "(def)");
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
                        var overlaps = this.boxSolid.collide(Game.SceneMap.instance.boxesSolids, null, false, 1, false);
                        for (var _i = 0, overlaps_1 = overlaps; _i < overlaps_1.length; _i++) {
                            var contact = overlaps_1[_i];
                            if (contact.other.data instanceof Platformer.Platform) {
                                var parent = contact.other.data;
                                if (parent.yGetVelMove() >= 0) {
                                    if (contact.other.data == this.platformParent) {
                                        //return;
                                        newPlatformParent = contact.other.data;
                                    }
                                    else {
                                        newPlatformParent = contact.other.data;
                                    }
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
                    this.stateStand.onEnter = function () { _this.stateStandOnEnter(); };
                    this.stateStand.onReady = function () {
                        _this.animator.setAnimation(_this.animStand);
                    };
                    this.stateStand.addLink(this.stateMove, function () { return _this.dirMove != 0 && _this.moveActionsEnabled; });
                    this.stateStand.addLink(this.stateAscend, function () { return _this.yVel < 0; });
                    this.stateStand.addLink(this.stateFall, function () { return _this.yVel > 0 && _this.yDirContact == 0; });
                    this.stateMove.onEnter = function () { _this.stateMoveOnEnter(); };
                    this.stateMove.onReady = function () {
                        _this.animator.setAnimation(_this.animMove);
                    };
                    this.stateMove.addLink(this.stateStand, function () { return _this.dirMove == 0 || !_this.moveActionsEnabled; });
                    this.stateMove.addLink(this.stateAscend, function () { return _this.yVel < 0; });
                    this.stateMove.addLink(this.stateFall, function () { return _this.yVel > 0 && _this.yDirContact == 0; });
                    this.stateAscend.onEnter = function () { _this.stateAscendOnEnter(); };
                    this.stateAscend.onReady = function () {
                        _this.animator.setAnimation(_this.animAscend);
                        if (_this.jumping && _this.sfxJump != null) {
                            _this.sfxJump.play();
                        }
                    };
                    this.stateAscend.addLink(this.stateFall, function () { return _this.yVel > 0; });
                    this.stateFall.onEnter = function () { _this.stateFallOnEnter(); };
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
                    this.stateLanding.onEnter = function () { _this.stateLandingOnEnter(); };
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
                BaseMachineEntity.prototype.stateStandOnEnter = function () {
                    this.moveActionsEnabled = true;
                    this.turnActionsEnabled = true;
                    this.jumpActionsEnabled = true;
                    this.platformActionsEnabled = true;
                };
                BaseMachineEntity.prototype.stateMoveOnEnter = function () {
                    this.moveActionsEnabled = true;
                    this.turnActionsEnabled = true;
                    this.jumpActionsEnabled = true;
                    this.platformActionsEnabled = true;
                };
                BaseMachineEntity.prototype.stateAscendOnEnter = function () {
                    this.moveActionsEnabled = true;
                    this.turnActionsEnabled = true;
                    this.jumpActionsEnabled = true;
                    this.platformActionsEnabled = true;
                };
                BaseMachineEntity.prototype.stateFallOnEnter = function () {
                    this.moveActionsEnabled = true;
                    this.turnActionsEnabled = true;
                    this.jumpActionsEnabled = false;
                    this.platformActionsEnabled = true;
                };
                BaseMachineEntity.prototype.stateLandingOnEnter = function () {
                    this.moveActionsEnabled = true;
                    this.turnActionsEnabled = true;
                    this.jumpActionsEnabled = true;
                    this.platformActionsEnabled = true;
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
                function Platform(def, controller) {
                    if (controller === void 0) { controller = null; }
                    var _this = _super.call(this, def) || this;
                    _this.children = null;
                    _this.controller = controller;
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
                    if (this.controller != null) {
                        this.box.enabled = true;
                        this.box.xSize = this.controller.getXSizeBoxStart();
                        this.box.ySize = this.controller.getYSizeBoxStart();
                    }
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
                Platform.prototype.onPlatformMoveUpdate = function () {
                    if (!Game.SceneFreezer.stoped && this.machine.currentState == this.stateMoving) {
                        if (this.controller != null) {
                            this.box.enabled = this.controller.isBoxEnabled();
                            this.box.xSize = this.controller.getXSizeBox();
                            this.box.ySize = this.controller.getYSizeBox();
                        }
                        this.xMove();
                        this.yMove();
                    }
                };
                Platform.prototype.onStepUpdate = function () {
                    if (this.controller != null) {
                        this.box.enabled = this.controller.isBoxEnabled();
                        this.box.xSize = this.controller.getXSizeBox();
                        this.box.ySize = this.controller.getYSizeBox();
                    }
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
                        if (this.controller != null) {
                            this.controller.setXBox(this.box.x);
                        }
                        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                            var child = _a[_i];
                            child.xMoveOnPlatform(this.xGetVelMove());
                        }
                        this.xDist -= this.xGetMagMove();
                        if (this.xDist <= 0) {
                            this.box.x = this.xNext;
                            if (this.controller != null) {
                                this.controller.setXBox(this.box.x);
                            }
                        }
                        var dirMove = this.xDir > 0 ? 1 : -1;
                        if (this.box.enabled && this.box.xSize > 0 && this.box.ySize > 0) {
                            for (var _b = 0, interactables_1 = interactables; _b < interactables_1.length; _b++) {
                                var interactable = interactables_1[_b];
                                var contacts = this.box.collideAgainst(interactable.boxSolid, null, true, 0, true, Engine.Box.LAYER_ALL);
                                if (contacts != null) {
                                    var distMove = this.box.getDist(interactable.boxSolid, dirMove, true);
                                    //contacts = interactable.boxSolid.cast(SceneMap.instance.boxesTiles, null, true, -distMove, false, Engine.Box.LAYER_ALL);
                                    //interactable.boxSolid.translate(contacts, true, -distMove, false);
                                    interactable.boxSolid.position[0] -= distMove;
                                    interactable.onPlatformOverlapX();
                                }
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
                        if (this.controller != null) {
                            this.controller.setYBox(this.box.y);
                        }
                        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                            var child = _a[_i];
                            child.yMoveOnPlatform(this.yGetVelMove());
                        }
                        this.yDist -= this.yGetMagMove();
                        if (this.yDist <= 0) {
                            var delta = this.yNext - this.box.y;
                            this.box.y = this.yNext;
                            if (this.controller != null) {
                                this.controller.setYBox(this.box.y);
                            }
                            if (this.yDist < 0) {
                                for (var _b = 0, _c = this.children; _b < _c.length; _b++) {
                                    var child = _c[_b];
                                    child.yMoveOnPlatform(delta);
                                }
                            }
                        }
                        var dirMove = this.yDir > 0 ? 1 : -1;
                        if (this.box.enabled && this.box.xSize > 0 && this.box.ySize > 0) {
                            for (var _d = 0, interactables_2 = interactables; _d < interactables_2.length; _d++) {
                                var interactable = interactables_2[_d];
                                var contacts = this.box.collideAgainst(interactable.boxSolid, null, true, 0, true, Engine.Box.LAYER_ALL);
                                if (contacts != null) {
                                    var distMove = this.box.getDist(interactable.boxSolid, dirMove, false);
                                    //contacts = interactable.boxSolid.cast(SceneMap.instance.boxesTiles, null, false, -distMove, false, Engine.Box.LAYER_ALL);
                                    //interactable.boxSolid.translate(contacts, false, -distMove, false);
                                    interactable.boxSolid.y -= distMove / Engine.Box.UNIT;
                                    interactable.onPlatformOverlapY();
                                }
                            }
                        }
                    }
                };
                Platform.prototype.onTimeUpdate = function () {
                    var xDraw = this.box.x + this.xGetVelMove() * Engine.System.deltaTime;
                    var yDraw = this.box.y + this.yGetVelMove() * Engine.System.deltaTime;
                    if (!Game.SceneFreezer.stoped) {
                        this.sprite.x = this.box.x;
                        this.sprite.y = this.box.y;
                    }
                    else {
                        this.sprite.x = xDraw;
                        this.sprite.y = yDraw;
                    }
                    if (this.controller != null) {
                        this.controller.setXDraw(this.sprite.x);
                        this.controller.setYDraw(this.sprite.y);
                    }
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
                Platform.prototype.disable = function () {
                    this.box.enabled = false;
                };
                Platform.prototype.fixSize = function () {
                    if (this.controller != null) {
                        this.box.enabled = this.controller.isBoxEnabled();
                        this.box.xSize = this.controller.getXSizeBox();
                        this.box.ySize = this.controller.getYSizeBox();
                    }
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
            StateMachine.prototype.forceStateChange = function (nextState) {
                this._nextState = nextState;
                this.triggerListener(this._anyState._onExit);
                this.triggerListener(this._currentState._onExit);
                this._oldState = this._currentState;
                this._currentState = nextState;
                this._nextState = null;
                this.triggerListener(this._anyState._onEnter);
                this.triggerListener(this._currentState._onEnter);
                this.triggerListener(this._anyState._onReady);
                this.triggerListener(this._currentState._onReady);
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
                            this.controlAction.keys = [Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "Space", "space", " "];
                        }
                        else {
                            this.controlAction.keys = [Engine.Keyboard.W, Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "Space", "space", " "];
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
                    BasicJumperControls.prototype.consumeDelayedAction = function () {
                        this.countStepsDelayAction = 0;
                    };
                    BasicJumperControls.prototype.onDrawControlsUnpaused = function () {
                        if (!Game.SceneFreezer.stoped) {
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
                        }
                    };
                    BasicJumperControls.prototype.onDrawControlsPaused = function () {
                        if (Game.SceneFreezer.stoped) {
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
            Game.SceneColors.clearColor(26, 26, 26);
            //SceneColors.clearColor(101, 197, 200);
            //SceneColors.clearColor(104, 172, 222);
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
                this.countStepsWait += 1;
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
        function SceneMap() {
            var _this = _super.call(this) || this;
            _this.offsetTiles = 0;
            _this.xSizeMap = 0;
            _this.ySizeMap = 0;
            _this.xSizeTile = 0;
            _this.ySizeTile = 0;
            SceneMap.instance = _this;
            _this.spritesRepeat = [];
            _this.spritesTerrain = [];
            _this.boxesSolids = [];
            _this.boxesEnemies = [];
            return _this;
        }
        SceneMap.prototype.loadMap = function (pathMap) {
            this.loadDef(pathMap);
            this.createMap();
            this.createEntities();
            this.createRepeats();
        };
        SceneMap.prototype.loadSky = function (pathSky) {
            this.defSky = JSON.parse(Engine.Assets.loadText(pathSky));
            this.createSky();
        };
        SceneMap.prototype.loadDef = function (pathMap) {
            //TODO: Suboptimal
            var tileset = JSON.parse(Engine.Assets.loadText(Game.Resources.PATH_TILESET));
            this.tiles = tileset.tiles;
            this.xSizeTile = tileset.tilewidth;
            this.ySizeTile = tileset.tileheight;
            this.tileColumns = tileset.columns;
            this.offsetTiles = tileset.margin;
            this.defMap = JSON.parse(Engine.Assets.loadText(pathMap));
            this.xCountTiles = this.defMap.width;
            this.yCountTiles = this.defMap.height;
            this.spritesTerrain = new Array();
            this.boxesSolids = new Array();
            this.boxesEnemies = Array();
            this.xSizeMap = this.defMap.width * this.xSizeTile;
            this.ySizeMap = this.defMap.height * this.ySizeTile;
        };
        SceneMap.prototype.createMap = function () {
            for (var _i = 0, _a = this.defMap.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                if (layer.name.indexOf("Entities") < 0 && layer.name.indexOf("Repeat") < 0 && layer.name.indexOf("Ignore") < 0) {
                    var indexTile = 0;
                    var tileDefMatrix = [];
                    for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                            tileDefMatrix[xIndex + yIndex * this.xCountTiles] = false;
                            if (layer.data[indexTile] != 0) {
                                var x = xIndex * this.xSizeTile;
                                var y = yIndex * this.ySizeTile;
                                var tileDef = this.getTileDef(layer.data[indexTile]);
                                if (tileDef == null) {
                                    this.spritesTerrain.push(this.createSpriteTile(layer.data[indexTile], x, y));
                                }
                                else if (tileDef.type == "Terrain") {
                                    if (this.getTileType(layer.data[indexTile]) == "Terrain") {
                                        tileDefMatrix[xIndex + yIndex * this.xCountTiles] = true;
                                    }
                                    this.spritesTerrain.push(this.createSpriteTile(layer.data[indexTile], x, y));
                                }
                                else {
                                    //eval("new " + tileType + "({def : layer.data[indexTile], x : x, y : y})");
                                    eval("new " + tileDef.type + "({tileDef : tileDef, instance : {x : x, y : y, indexTile : layer.data[indexTile]}})");
                                }
                            }
                            indexTile += 1;
                        }
                    }
                    for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                            if (tileDefMatrix[xIndex + yIndex * this.xCountTiles]) {
                                this.generateBox(tileDefMatrix, xIndex, yIndex, this.xCountTiles, this.yCountTiles, this.xCountTiles);
                            }
                        }
                    }
                }
            }
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
            box.red = Math.random() * 0.5;
            box.green = Math.random() * 0.5;
            box.blue = Math.random() * 0.5;
            this.boxesSolids.push(box);
        };
        SceneMap.prototype.createEntities = function () {
            var entities = Game.findInJSON(this.defMap.layers, function (layer) { return layer.name.indexOf("Entities") >= 0; }).objects;
            for (var _i = 0, entities_1 = entities; _i < entities_1.length; _i++) {
                var instancedef = entities_1[_i];
                var entitydef = this.getEntitydef(instancedef);
                Game.Entity.create(entitydef);
            }
        };
        SceneMap.prototype.createRepeats = function () {
            this.spritesRepeat = [];
            for (var _i = 0, _a = this.defMap.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                if (layer.name.indexOf("Repeat") >= 0) {
                    this.createRepeatLayer(layer);
                }
            }
        };
        SceneMap.prototype.createRepeatLayer = function (layer) {
            this.createRepeatLayerTiles(layer, 0, 0);
        };
        SceneMap.prototype.createRepeatLayerTiles = function (layer, xOffset, yOffset) {
            var indexTile = 0;
            for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                    if (layer.data[indexTile] != 0) {
                        var x = xOffset + xIndex * this.xSizeTile;
                        var y = yOffset + yIndex * this.ySizeTile;
                        this.spritesRepeat.push(this.createSpriteTile(layer.data[indexTile], x, y));
                    }
                    indexTile += 1;
                }
            }
        };
        SceneMap.prototype.createSky = function () {
            if (this.defSky != null) {
                for (var _i = 0, _a = this.defSky.layers; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    if (layer.name.indexOf("Entities") < 0 && layer.name.indexOf("Repeat") >= 0 && layer.name.indexOf("Ignore") < 0) {
                        this.createRepeatLayer(layer);
                    }
                }
            }
        };
        SceneMap.prototype.createSpriteTile = function (indexTile, x, y) {
            var sprite = new Engine.Sprite();
            sprite.x = x;
            sprite.y = y;
            indexTile -= 1;
            var yIndexTile = new Int32Array([indexTile / this.tileColumns]);
            var xIndexTile = indexTile - yIndexTile[0] * this.tileColumns;
            var xTexture = this.offsetTiles + xIndexTile * (this.offsetTiles + this.xSizeTile);
            var yTexture = this.offsetTiles + yIndexTile[0] * (this.offsetTiles + this.ySizeTile);
            sprite.setFull(true, false, Game.Resources.textureGumRem, this.xSizeTile, this.ySizeTile, 0, 0, xTexture, yTexture, this.xSizeTile, this.ySizeTile);
            return sprite;
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
        SceneMap.prototype.getTileDef = function (id) {
            return Game.findInJSON(this.tiles, function (typedef) {
                return typedef.id == id - 1;
            });
        };
        SceneMap.prototype.onViewUpdate = function () {
            //this.createRepeats();
            //this.createSky();
        };
        SceneMap.prototype.onDrawSceneMap = function () {
            this._drawSpritesRepeat();
            for (var _i = 0, _a = this.spritesTerrain; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.render();
            }
            for (var _b = 0, _c = this.boxesSolids; _b < _c.length; _b++) {
                var box = _c[_b];
                box.render();
            }
        };
        SceneMap.prototype._drawSpritesRepeat = function () {
            for (var _i = 0, _a = this.spritesRepeat; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.render();
                var xOld = sprite.x;
                var xCheck = (Engine.Renderer.xSizeView - this.xSizeMap) * 0.5 + sprite.x + (this.xSizeMap - 16);
                while (xCheck <= Engine.Renderer.xSizeView) {
                    sprite.x += (this.xSizeMap - 16);
                    sprite.render();
                    xCheck = (Engine.Renderer.xSizeView - this.xSizeMap) * 0.5 + sprite.x + (this.xSizeMap - 16);
                }
                sprite.x = xOld;
                xOld = sprite.x;
                xCheck = (Engine.Renderer.xSizeView - this.xSizeMap) * 0.5 + sprite.x - (this.xSizeMap - 16);
                xCheck += 8;
                while (xCheck >= 0) {
                    sprite.x -= (this.xSizeMap - 16);
                    sprite.render();
                    xCheck = (Engine.Renderer.xSizeView - this.xSizeMap) * 0.5 + sprite.x - (this.xSizeMap - 16);
                    xCheck += 8;
                }
                sprite.x = xOld;
            }
        };
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
        FRAME_BUTTONS = Game.FrameSelector.complex("credits menu buttons", Game.Resources.textureGumRem, 437, 236);
        FRAME_DIALOG = Game.FrameSelector.complex("credits menu dialog", Game.Resources.textureGumRem, 437, 59);
    });
    var Credits = /** @class */ (function (_super) {
        __extends(Credits, _super);
        function Credits() {
            var _this = _super.call(this) || this;
            new Game.MusicButton();
            new Game.SoundButton();
            _this.spriteDialog = new Engine.Sprite();
            _this.spriteDialog.enabled = true;
            _this.spriteDialog.pinned = true;
            _this.spriteDialog.x = 0;
            _this.spriteDialog.y = -70 - 10 - 10 + 1 + 34 - 5;
            FRAME_DIALOG[0].applyToSprite(_this.spriteDialog);
            var devone = new Utils.Text();
            devone.font = Game.FontManager.a;
            devone.scale = 1;
            devone.enabled = true;
            devone.pinned = true;
            devone.str = "CREATED BY:";
            devone.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            devone.xAlignView = Utils.AnchorAlignment.MIDDLE;
            devone.yAlignBounds = Utils.AnchorAlignment.START;
            devone.yAlignView = Utils.AnchorAlignment.MIDDLE;
            devone.yAligned = _this.spriteDialog.y + 6 + 1;
            var devtwo = new Utils.Text();
            devtwo.font = Game.FontManager.a;
            devtwo.scale = 1;
            devtwo.enabled = true;
            devtwo.pinned = true;
            devtwo.str = "KEZARTS";
            devtwo.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            devtwo.xAlignView = Utils.AnchorAlignment.MIDDLE;
            devtwo.yAlignBounds = Utils.AnchorAlignment.START;
            devtwo.yAlignView = Utils.AnchorAlignment.MIDDLE;
            devtwo.yAligned = devone.y + 12 + 2;
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
            musone.yAligned = devtwo.y + 16 + 2;
            var mustwo = new Utils.Text();
            mustwo.font = Game.FontManager.a;
            mustwo.scale = 1;
            mustwo.enabled = true;
            mustwo.pinned = true;
            mustwo.str = "NIELDACAN";
            mustwo.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            mustwo.xAlignView = Utils.AnchorAlignment.MIDDLE;
            mustwo.yAlignBounds = Utils.AnchorAlignment.START;
            mustwo.yAlignView = Utils.AnchorAlignment.MIDDLE;
            mustwo.yAligned = musone.y + 12 + 2;
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
            thuone.yAligned = mustwo.y + 16 + 2;
            var thutwo = new Utils.Text();
            thutwo.font = Game.FontManager.a;
            thutwo.scale = 1;
            thutwo.enabled = true;
            thutwo.pinned = true;
            thutwo.str = "NIELDACAN";
            thutwo.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thutwo.xAlignView = Utils.AnchorAlignment.MIDDLE;
            thutwo.yAlignBounds = Utils.AnchorAlignment.START;
            thutwo.yAlignView = Utils.AnchorAlignment.MIDDLE;
            thutwo.yAligned = thuone.y + 12 + 2;
            _this.backButton = new Game.DialogButton(FRAME_BUTTONS[0], "BACK", 0, 100 - 10 + 4 - 14);
            _this.backButton.control.listener = _this;
            _this.backButton.control.useKeyboard = true;
            _this.backButton.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            _this.backButton.control.onPressedDelegate = _this.backPressed;
            _this.backButton.control.onReleasedDelegate = _this.backReleased;
            _this.loadMap(Game.Resources.PATH_MAP_NONE);
            //var x = Scene.xSizeLevel * 0.5;
            //var y = Scene.ySizeLevel * 0.5;
            //Engine.Renderer.camera(x, y);
            //SceneColors.enabledDown = false;
            //this.loadSky(Resources.PATH_MAP_SKY);
            new Game.DecoCredits();
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
            var pepeOffset = 10;
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
            text0.yAligned = -38 * 2 + 8 - 2 - 20 - 5 + pepeOffset;
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
            _this.text1.text.yAligned = -38 * 2 + pepeOffset + 8 - 0.5;
            if (Game.Level.speedrun) {
                _this.text1.control.enabled = false;
                _this.text1.text.str = Game.LevelSaveManager.hasSpeedrunRecord ? "NEW RECORD! " + Game.SpeedrunTimer.getTextValue(Game.LevelSaveManager.recordSpeedrun) : "YOUR TIME! " + Game.SpeedrunTimer.getTextValue(Game.Level.countStepsSpeedrun);
            }
            else {
                _this.text1.control.enabled = Game.HAS_LINKS_KEZARTS;
                _this.text1.control.url = Game.HAS_LINKS_KEZARTS ? Game.URL_KEZARTS : null;
                _this.text1.control.onSelectionStayDelegate = function () {
                    Engine.Renderer.useHandPointer = Game.HAS_LINKS_KEZARTS;
                };
                _this.text1.text.underlined = Game.HAS_LINKS_KEZARTS;
                _this.text1.text.setUnderlineShadowColor(38 / 255, 38 / 255, 38 / 255, 1);
                _this.text1.text.str = Game.HAS_LINKS_KEZARTS ? "BY KEZARTS - KEZARTS.COM" : "BY KEZARTS";
            }
            var pepe = 20;
            _this.continueButton = new Game.TextButton();
            _this.continueButton.control.listener = _this;
            _this.continueButton.control.blockOthersSelection = true;
            _this.continueButton.control.bounds = null;
            _this.continueButton.control.enabled = !Game.IS_TOUCH;
            _this.continueButton.arrows.enabled = false;
            _this.continueButton.text.font = Game.FontManager.a;
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
                text4.font = Game.FontManager.a;
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
            _this.loadMap(Game.Level.hard ? Game.Resources.PATH_MAP_LAST_HARD : Game.Resources.PATH_MAP_LAST_NORMAL);
            var x = Game.SceneMap.instance.xSizeMap * 0.5;
            var y = Game.SceneMap.instance.xSizeMap * 0.5;
            Engine.Renderer.camera(x, y);
            //SceneColors.enabledDown = false;
            //this.loadSky(Resources.PATH_MAP_SKY);
            Game.triggerActions("endscreen");
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
        LastScene.prototype.onTimeUpdateSceneBeforeDrawFixed = function () {
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
            //Engine.Renderer.camera(x + LevelShake.position, y);
            Engine.Renderer.camera(x, y);
        };
        LastScene.prototype.onStartWaiting = function () {
            _super.prototype.onStartWaiting.call(this);
            if (Game.Scene.nextSceneClass == Game.MainMenu || Game.Scene.nextSceneClass == Game.LevelSelection) {
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
    Game.LEVELS_PAGES = 2;
    Game.MAX_LEVELS = Game.LEVELS_PER_PAGE * Game.LEVELS_PAGES;
    var FRAME_BUTTON_NORMAL;
    var FRAME_BUTTON_CLEARED;
    var FRAME_BUTTON_NAVIGATION;
    Game.addAction("configure", function () {
        FRAME_BUTTON_NORMAL = Game.FrameSelector.complex("selection button normal", Game.Resources.textureGumRem, 437, 202);
        FRAME_BUTTON_CLEARED = Game.FrameSelector.complex("selection button cleared", Game.Resources.textureGumRem, 437, 236);
        FRAME_BUTTON_NAVIGATION = Game.FrameSelector.complex("selection button navigation", Game.Resources.textureGumRem, 437, 236);
    });
    var dataLevels = function () {
        return Game.Level.hard ? Game.dataLevelsHard : Game.dataLevelsNormal;
    };
    var LevelSelection = /** @class */ (function (_super) {
        __extends(LevelSelection, _super);
        function LevelSelection() {
            var _this = _super.call(this) || this;
            _this.buttons = new Array();
            _this.xButtons = 0;
            _this.yButtons = -34 + 5 - 6 - 4 - Y_SPEARATION_BUTTONS - 8 + 3 + 10 - 7.5;
            _this.yButtons2 = 5;
            LevelSelection.instance = _this;
            var pepe = 100 - 10 + 4 - 9;
            X_SIZE_BUTTON = FRAME_BUTTON_NORMAL[0].xSize;
            Y_SIZE_BUTTON = FRAME_BUTTON_NORMAL[0].ySize;
            _this.xButtons = -0.5 * (FRAME_BUTTON_NORMAL[0].xSize + X_SPEARATION_BUTTONS) * (X_COUNT_BUTTONS - 1);
            new Game.MusicButton();
            new Game.SoundButton();
            _this.spriteDialogTitle = new Engine.Sprite();
            _this.spriteDialogTitle.enabled = true;
            _this.spriteDialogTitle.pinned = true;
            _this.spriteDialogTitle.x = 0;
            _this.spriteDialogTitle.y = -pepe - 1.5;
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
            _this.backButton = new Game.DialogButton(FRAME_BUTTON_NAVIGATION[0], "BACK", 0, pepe + 6);
            _this.backButton.control.listener = _this;
            _this.backButton.control.useKeyboard = true;
            _this.backButton.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            _this.backButton.control.onPressedDelegate = _this.backPressed;
            _this.backButton.control.onReleasedDelegate = _this.backReleased;
            _this.speedrunButton = new Game.DialogButton(FRAME_BUTTON_NAVIGATION[0], "SPEEDRUN", 0, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * 3);
            _this.speedrunButton.control.listener = _this;
            _this.speedrunButton.control.onPressedDelegate = _this.speedrunPressed;
            _this.speedrunButton.control.onReleasedDelegate = _this.speedrunReleased;
            _this.switchButton = new Game.DialogButton(FRAME_BUTTON_NAVIGATION[0], ">", _this.buttons[2].dialog.x, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * 3);
            _this.switchButton.control.listener = _this;
            _this.switchButton.arrows.enabled = false;
            _this.switchButton.control.onSelectionStartDelegate = _this.switchEnter;
            _this.switchButton.control.onSelectionEndDelegate = _this.switchExit;
            _this.switchButton.control.onPressedDelegate = _this.switchPress;
            _this.switchButton2 = new Game.DialogButton(FRAME_BUTTON_NAVIGATION[0], "<", _this.buttons[0].dialog.x, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * 3);
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
            //this.loadSky(Resources.PATH_MAP_SKY);
            new Game.DecoLevelSelection(false);
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
            var count = 1 + (Game.Level.hard ? LevelSelection.indexPageHard : LevelSelection.indexPageNormal) * Game.LEVELS_PER_PAGE;
            for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
                var button = _a[_i];
                button.text.str = count + "";
                switch (dataLevels()[count]) {
                    case "locked":
                        //button.enabled = false;
                        button.dialog.enabled = false;
                        button.control.enabled = false;
                        button.text.font = Game.FontManager.a;
                        button.arrows.arrowLeft.font = Game.FontManager.a;
                        button.arrows.arrowRight.font = Game.FontManager.a;
                        FRAME_BUTTON_NORMAL[0].applyToSprite(button.dialog);
                        button.dialog.setRGBA(1, 1, 1, 0.1);
                        break;
                    case "unlocked":
                        button.enabled = true;
                        button.control.enabled = true;
                        button.text.font = Game.FontManager.a;
                        button.arrows.arrowLeft.font = Game.FontManager.a;
                        button.arrows.arrowRight.font = Game.FontManager.a;
                        FRAME_BUTTON_NORMAL[0].applyToSprite(button.dialog);
                        button.dialog.setRGBA(1, 1, 1, 1);
                        break;
                    case "cleared":
                        button.enabled = true;
                        button.control.enabled = true;
                        button.text.font = Game.FontManager.a;
                        button.arrows.arrowLeft.font = Game.FontManager.a;
                        button.arrows.arrowRight.font = Game.FontManager.a;
                        FRAME_BUTTON_CLEARED[0].applyToSprite(button.dialog);
                        button.dialog.setRGBA(1, 1, 1, 1);
                        break;
                }
                count += 1;
            }
        };
        LevelSelection.unlockAllLevels = function () {
            for (var indexLevel = 1; indexLevel <= Game.MAX_LEVELS; indexLevel += 1) {
                if (Game.dataLevelsNormal[indexLevel] == "locked") {
                    Game.dataLevelsNormal[indexLevel] = "unlocked";
                    Engine.Data.save("level.normal." + indexLevel, "unlocked", 60);
                }
                if (Game.dataLevelsHard[indexLevel] == "locked") {
                    Game.dataLevelsHard[indexLevel] = "unlocked";
                    Engine.Data.save("level.hard." + indexLevel, "unlocked", 60);
                }
            }
            if (LevelSelection.instance != null) {
                LevelSelection.instance.fixButtons();
            }
            else if (Game.MainMenu.instance != null) {
                Game.MainMenu.instance.hard.text.str = "INSANE MODE";
                Game.MainMenu.instance.hard.control.enabled = Game.dataLevelsNormal[Game.MAX_LEVELS] == "cleared" || Game.dataLevelsHard[2] == "unlocked";
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
                this.speedrunButton.control.enabled = false;
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
                this.backButton.control.enabled = false;
                this.switchButton.control.enabled = false;
                this.switchButton2.control.enabled = false;
                this.speedrunButton.control.enabled = false;
            }
        };
        LevelSelection.prototype.backReleased = function () {
            //    this.backButton.control.enabled = false;
        };
        LevelSelection.prototype.speedrunPressed = function () {
            if (this.nextSceneClass == null) {
                this.stepsWait = 0;
                this.nextSceneClass = Game.SpeedrunMenu;
                for (var _i = 0, _a = this.buttons; _i < _a.length; _i++) {
                    var button = _a[_i];
                    button.control.enabled = false;
                }
                this.backButton.control.enabled = false;
                this.switchButton.control.enabled = false;
                this.switchButton2.control.enabled = false;
                this.speedrunButton.control.enabled = false;
            }
        };
        LevelSelection.prototype.speedrunReleased = function () {
            //    this.speedrun.control.enabled = false;
        };
        LevelSelection.prototype.switchEnter = function () {
            this.switchButton.text.str = ">>>";
        };
        LevelSelection.prototype.switchExit = function () {
            this.switchButton.text.str = ">";
        };
        LevelSelection.prototype.switchPress = function () {
            if (Game.Level.hard) {
                LevelSelection.indexPageHard += 1;
                if (LevelSelection.indexPageHard >= Game.LEVELS_PAGES) {
                    LevelSelection.indexPageHard = 0;
                }
            }
            else {
                LevelSelection.indexPageNormal += 1;
                if (LevelSelection.indexPageNormal >= Game.LEVELS_PAGES) {
                    LevelSelection.indexPageNormal = 0;
                }
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
            if (Game.Level.hard) {
                LevelSelection.indexPageHard -= 1;
                if (LevelSelection.indexPageHard < 0) {
                    LevelSelection.indexPageHard = Game.LEVELS_PAGES - 1;
                }
            }
            else {
                LevelSelection.indexPageNormal -= 1;
                if (LevelSelection.indexPageNormal < 0) {
                    LevelSelection.indexPageNormal = Game.LEVELS_PAGES - 1;
                }
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
        LevelSelection.indexPageNormal = 0;
        LevelSelection.indexPageHard = 0;
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
    Game.TEXT_KEZARTS = "KEZARTS.COM";
    Game.UP_VERSION = true;
    Game.CENTER_VERSION = true;
    var FRAME_BUTTONS;
    Game.addAction("configure", function () {
        FRAME_BUTTONS = Game.FrameSelector.complex("main menu buttons", Game.Resources.textureGumRem, 437, 168);
    });
    Game.REMOVE_TITTLE_LINK = false;
    var MainMenu = /** @class */ (function (_super) {
        __extends(MainMenu, _super);
        function MainMenu() {
            var _this = _super.call(this) || this;
            _this.spriteButtonMoreGames = null;
            MainMenu.instance = _this;
            new Game.MainMenuObjects();
            Game.Resources.playBGM();
            new Game.MusicButton();
            new Game.SoundButton();
            Game.TryCreatePlaystoreButton();
            _this.spriteVersion = new Engine.Sprite();
            _this.spriteVersion.setFull(!Game.REMOVE_TITTLE_LINK, true, Game.Resources.textureVersion, 46, 8, -46 * 0.5, 0, 8 * 4, 4 * 4, 46 * 4, 8 * 4);
            _this.spriteVersion.xScale = 0.5;
            _this.spriteVersion.yScale = 0.5;
            _this.spriteVersion.x = 0;
            _this.spriteVersion.y = -Engine.Renderer.ySizeView * 0.5 + 10.5;
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
            _this.hard = new Game.TextButton();
            _this.hard.control.listener = _this;
            _this.hard.control.enabled = Game.dataLevelsNormal[Game.MAX_LEVELS] == "cleared" || Game.dataLevelsHard[1] == "cleared";
            _this.hard.text.font = Game.FontManager.a;
            _this.hard.text.scale = 1;
            _this.hard.text.enabled = true;
            _this.hard.text.pinned = true;
            _this.hard.text.str = (Game.dataLevelsNormal[Game.MAX_LEVELS] == "cleared" || Game.dataLevelsHard[1] == "cleared") ? "INSANE MODE" : "?????? ????";
            _this.hard.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.hard.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.hard.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.hard.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.hard.control.onPressedDelegate = _this.hardPressed;
            _this.hard.control.onReleasedDelegate = _this.hardReleased;
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
            ypos = -19 + 15 - 5 + 12 + 7;
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
            //this.spriteButtonSpeedrun.setRGBA(1, 1, 1, dataLevelsNormal[MAX_LEVELS] == "cleared" ? 1 : 0.1);
            _this.hard.text.xAligned = _this.spriteButtonSpeedrun.x;
            _this.hard.text.yAligned = _this.spriteButtonSpeedrun.y + 1;
            _this.hard.control.bounds = _this.spriteButtonSpeedrun;
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
            _this.kezarts.text.enabled = true;
            _this.kezarts.text.pinned = true;
            if (!Game.REMOVE_TITTLE_LINK) {
                _this.kezarts.text.str = Game.HAS_LINKS_KEZARTS ? Game.TEXT_KEZARTS : "BY KEZARTS";
            }
            else {
                _this.kezarts.text.str = "VER 1.5.0";
            }
            _this.kezarts.text.underlined = Game.HAS_LINKS_KEZARTS && !Game.REMOVE_TITTLE_LINK;
            _this.kezarts.text.setUnderlineShadowColor(38 / 255, 38 / 255, 38 / 255, 1);
            _this.kezarts.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.yAlignBounds = Utils.AnchorAlignment.END;
            _this.kezarts.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.yAligned = 120 + (Game.HAS_LINKS_KEZARTS ? -3 : -6) - 5;
            //this.kezarts.arrows.enabled = false;
            //}
            var x = _this.xSizeMap * 0.5;
            var y = _this.ySizeMap * 0.5;
            Engine.Renderer.camera(x, y - 16 * 0);
            //this.fillBlue.enabled = true;
            //this.loadSky(Resources.PATH_MAP_SKY);
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
                this.hard.control.enabled = false;
                this.credits.control.enabled = false;
                if (Game.HAS_LINKS) {
                    this.moregames.control.enabled = false;
                }
                Game.Level.hard = false;
                this.stepsWait = 0;
                this.nextSceneClass = Game.LevelSelection;
                Game.SceneFade.setColor(26, 26, 26);
                Game.triggerActions("playbutton");
            }
        };
        MainMenu.prototype.startReleased = function () {
            //    this.start.control.enabled = false;
        };
        MainMenu.prototype.hardPressed = function () {
            if (this.nextSceneClass == null) {
                this.hard.control.enabled = false;
                this.credits.control.enabled = false;
                if (Game.HAS_LINKS) {
                    this.moregames.control.enabled = false;
                }
                Game.Level.hard = true;
                this.stepsWait = 0;
                this.nextSceneClass = Game.LevelSelection;
                Game.SceneFade.setColor(26, 26, 26);
                Game.triggerActions("playbutton");
            }
        };
        MainMenu.prototype.hardReleased = function () {
            //    this.start.control.enabled = false;
        };
        MainMenu.prototype.creditsPressed = function () {
            if (this.nextSceneClass == null) {
                this.start.control.enabled = false;
                this.hard.control.enabled = false;
                if (Game.HAS_LINKS) {
                    this.moregames.control.enabled = false;
                }
                this.stepsWait = 0;
                this.nextSceneClass = Game.Credits;
                Game.SceneFade.setColor(26, 26, 26);
            }
        };
        MainMenu.prototype.creditsReleased = function () {
            //    this.credits.control.enabled = false;
        };
        MainMenu.prototype.onDrawDialogs = function () {
            this.spriteVersion.render();
            this.spriteButtonStart.render();
            this.spriteButtonSpeedrun.render();
            this.spriteButtonCredits.render();
            if (this.spriteButtonMoreGames != null) {
                this.spriteButtonMoreGames.render();
            }
        };
        MainMenu.prototype.onClearScene = function () {
            MainMenu.instance = null;
        };
        MainMenu.instance = null;
        return MainMenu;
    }(Game.SceneMap));
    Game.MainMenu = MainMenu;
})(Game || (Game = {}));
///<reference path="../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    var X_SPEARATION_BUTTONS = 15;
    var OFFSET_SINGLE = 14;
    var OFFSET_DOUBLE = 20 - 2;
    var FRAME;
    var FRAME_BUTTONS;
    Game.addAction("preloader", function () {
        FRAME = Game.FrameSelector.complex("speedrun dialog", Game.Resources.textureGumRem, 437, 59);
        FRAME_BUTTONS = Game.FrameSelector.complex("speedrun buttons", Game.Resources.textureGumRem, 437, 236);
    });
    var SpeedrunMenu = /** @class */ (function (_super) {
        __extends(SpeedrunMenu, _super);
        function SpeedrunMenu() {
            var _this = _super.call(this) || this;
            _this.yButtons = 20;
            new Game.MusicButton();
            new Game.SoundButton();
            _this.spriteDialog = new Engine.Sprite();
            _this.spriteDialog.enabled = true;
            _this.spriteDialog.pinned = true;
            _this.spriteDialog.y = -10;
            FRAME[0].applyToSprite(_this.spriteDialog);
            _this.spriteDialog.yOffset -= _this.spriteDialog.ySize * 0.5;
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
            recordB.str = Game.SpeedrunTimer.getTextValue(Game.LevelSaveManager.recordSpeedrun);
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
            timeB.str = Game.LevelSaveManager.dataSpeedrun == 0 ? "0.000" : Game.SpeedrunTimer.getTextValue(Game.LevelSaveManager.dataSpeedrun);
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
            levelB.str = Game.LevelSaveManager.levelSpeedrun + "";
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
            _this.continueButton.dialog.setRGBA(1, 1, 1, Game.LevelSaveManager.dataSpeedrun > 1 ? 1 : 0.1);
            _this.continueButton.control.enabled = Game.LevelSaveManager.dataSpeedrun > 0;
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
            //SceneColors.enabledDown = false;
            //this.loadSky(Resources.PATH_MAP_SKY);
            new Game.DecoLevelSelection(true);
            Game.triggerActions("levelselection");
            return _this;
        }
        SpeedrunMenu.prototype.startSpeedrun = function (isNew) {
            Game.Level.speedrun = true;
            Game.Level.countStepsSpeedrun = isNew ? 0 : Game.LevelSaveManager.dataSpeedrun;
            Game.LevelSaveManager.hasSpeedrunRecord = false;
            Game.Level.nextIndex = isNew ? 1 : Game.LevelSaveManager.levelSpeedrun;
            this.stepsWait = Game.STEPS_CHANGE_SCENE;
            this.nextSceneClass = Game.Level;
            //SceneFade.setColor(255, 255, 255);
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
                this.nextSceneClass = Game.LevelSelection;
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
    Game.addAction("configure", function () {
        Game.BACK_BUTTON_FRAMES_A = Game.FrameSelector.complex("673", Game.Resources.textureGumRem, 574, 222);
        Game.BACK_BUTTON_FRAMES_B = Game.FrameSelector.complex("674", Game.Resources.textureGumRem, 798, 926);
        Game.BACK_BUTTON_FRAMES_BORDER_A = Game.FrameSelector.complex("673", Game.Resources.textureGumRem, 574, 269);
        Game.BACK_BUTTON_FRAMES_BORDER_B = Game.FrameSelector.complex("674", Game.Resources.textureGumRem, 798, 973);
    });
    Game.UI_BACK_ALPHA = 0.5;
    var Level = /** @class */ (function (_super) {
        __extends(Level, _super);
        function Level() {
            var _this = _super.call(this) || this;
            _this.exiting = false;
            Level.instance = _this;
            Level.index = Level.nextIndex;
            Level.nextIndex = Level.index + 1;
            Game.Resources.playBGM();
            _this.uiZoneA = new Engine.Sprite();
            _this.uiZoneA.enabled = true;
            _this.uiZoneA.pinned = true;
            Game.BACK_BUTTON_FRAMES_A[Game.IS_TOUCH ? 1 : 0].applyToSprite(_this.uiZoneA);
            _this.uiZoneA.setRGBA(1, 1, 1, Game.UI_BACK_ALPHA);
            _this.uiZoneA.x = -Engine.Renderer.xSizeView / 2;
            _this.uiZoneA.y = -Engine.Renderer.ySizeView / 2;
            _this.uiZoneBorderA = new Engine.Sprite();
            _this.uiZoneBorderA.enabled = true;
            _this.uiZoneBorderA.pinned = true;
            Game.BACK_BUTTON_FRAMES_BORDER_A[Game.IS_TOUCH ? 1 : 0].applyToSprite(_this.uiZoneBorderA);
            _this.uiZoneBorderA.x = -Engine.Renderer.xSizeView / 2;
            _this.uiZoneBorderA.y = -Engine.Renderer.ySizeView / 2;
            _this.uiZoneB = new Engine.Sprite();
            _this.uiZoneB.enabled = true;
            _this.uiZoneB.pinned = true;
            Game.BACK_BUTTON_FRAMES_B[Game.IS_TOUCH ? 1 : 0].applyToSprite(_this.uiZoneB);
            _this.uiZoneB.setRGBA(1, 1, 1, Game.UI_BACK_ALPHA);
            _this.uiZoneB.x = Engine.Renderer.xSizeView / 2;
            _this.uiZoneB.y = -Engine.Renderer.ySizeView / 2;
            _this.uiZoneBorderB = new Engine.Sprite();
            _this.uiZoneBorderB.enabled = true;
            _this.uiZoneBorderB.pinned = true;
            Game.BACK_BUTTON_FRAMES_BORDER_B[Game.IS_TOUCH ? 1 : 0].applyToSprite(_this.uiZoneBorderB);
            _this.uiZoneBorderB.x = Engine.Renderer.xSizeView / 2;
            _this.uiZoneBorderB.y = -Engine.Renderer.ySizeView / 2;
            new Game.MusicButton();
            new Game.SoundButton();
            new Game.PauseButton();
            new Game.ResetButton();
            if (Level.speedrun) {
                new Game.SpeedrunTimer();
            }
            new Game.ExitButton();
            new Game.LevelText();
            Game.LevelShake.init();
            Game.LevelPauseUI.init();
            Game.LevelAds.init();
            Game.LevelSaveManager.init();
            Game.triggerActions("level");
            _this.loadMap(Game.getPathLevel(Level.index, Level.hard));
            //this.loadMap(getPathLevel(1, Level.hard));
            //this.loadSky(Resources.PATH_MAP_SKY);
            //this.loadMap(getPathLevel(1));
            //this.loadMap(Resources.PATH_LEVEL_TEST);
            if (Level.index == 1) {
                new Game.MoveTutorial();
            }
            else if (Level.index == 2) {
                new Game.JumpTutorial();
            }
            else if (Level.index == 9) {
                new Game.ResetTutorial();
            }
            new Game.LevelAdLoader();
            return _this;
        }
        Level.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            //triggerActions("play");
        };
        Level.prototype.onViewUpdate = function () {
            this.uiZoneA.x = -Engine.Renderer.xSizeView / 2;
            this.uiZoneA.y = -Engine.Renderer.ySizeView / 2;
            this.uiZoneB.x = Engine.Renderer.xSizeView / 2;
            this.uiZoneB.y = -Engine.Renderer.ySizeView / 2;
            this.uiZoneBorderA.x = -Engine.Renderer.xSizeView / 2;
            this.uiZoneBorderA.y = -Engine.Renderer.ySizeView / 2;
            this.uiZoneBorderB.x = Engine.Renderer.xSizeView / 2;
            this.uiZoneBorderB.y = -Engine.Renderer.ySizeView / 2;
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
            if (Game.ResetButton.instance != null && Game.ResetButton.instance.control.pressed && !this.exiting) {
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
            //Engine.Renderer.camera(x + LevelShake.position, y);
            Engine.Renderer.camera(x, y);
        };
        Level.prototype.onDrawUIDialogs = function () {
            this.uiZoneA.render();
            this.uiZoneB.render();
            this.uiZoneBorderA.render();
            this.uiZoneBorderB.render();
        };
        /*
        protected onDrawSceneMap(){
            super.onDrawSceneMap();
            if(Engine.Box.debugRender){
                for(var box of this.boxesEnemies){
                    if(box.data != null && box.data != undefined && box.data.spikeAngle != null && box.data.spikeAngle != undefined){
                        box.render();
                    }
                }
            }
        }
        */
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
    var FILL_R = 26 / 255;
    var FILL_G = 26 / 255;
    var FILL_B = 26 / 255;
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
        Object.defineProperty(LevelSaveManager, "recordSpeedrun", {
            get: function () {
                return Game.Level.hard ? Game.recordSpeedrunHard : Game.recordSpeedrunNormal;
            },
            set: function (value) {
                if (Game.Level.hard) {
                    Game.recordSpeedrunHard = value;
                }
                else {
                    Game.recordSpeedrunNormal = value;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelSaveManager, "levelSpeedrun", {
            get: function () {
                return Game.Level.hard ? Game.levelSpeedrunHard : Game.levelSpeedrunNormal;
            },
            set: function (value) {
                if (Game.Level.hard) {
                    Game.levelSpeedrunHard = value;
                }
                else {
                    Game.levelSpeedrunNormal = value;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelSaveManager, "dataSpeedrun", {
            get: function () {
                return Game.Level.hard ? Game.dataSpeedrunHard : Game.dataSpeedrunNormal;
            },
            set: function (value) {
                if (Game.Level.hard) {
                    Game.dataSpeedrunHard = value;
                }
                else {
                    Game.dataSpeedrunNormal = value;
                }
            },
            enumerable: false,
            configurable: true
        });
        LevelSaveManager.init = function () {
            new LevelSaveManager();
        };
        LevelSaveManager.prototype.onReset = function () {
            this.winSaved = false;
        };
        LevelSaveManager.prototype.onStepUpdate = function () {
            if (!this.winSaved && Game.Player.instance.winning) {
                if (Game.Level.hard) {
                    Game.dataLevelsHard[Game.Level.index] = "cleared";
                    Engine.Data.save("level.hard." + (Game.Level.index), "cleared", 60);
                    if (Game.dataLevelsHard[Game.Level.nextIndex] == "locked") {
                        Engine.Data.save("level.hard." + (Game.Level.nextIndex), "unlocked", 60);
                        Game.dataLevelsHard[Game.Level.nextIndex] = "unlocked";
                    }
                }
                else {
                    Game.dataLevelsNormal[Game.Level.index] = "cleared";
                    Engine.Data.save("level.normal." + (Game.Level.index), "cleared", 60);
                    if (Game.dataLevelsNormal[Game.Level.nextIndex] == "locked") {
                        Engine.Data.save("level.normal." + (Game.Level.nextIndex), "unlocked", 60);
                        Game.dataLevelsNormal[Game.Level.nextIndex] = "unlocked";
                    }
                }
                if (Game.Level.speedrun && Game.Level.nextIndex > Game.MAX_LEVELS && (LevelSaveManager.recordSpeedrun == 0 || Game.Level.countStepsSpeedrun < LevelSaveManager.recordSpeedrun)) {
                    LevelSaveManager.hasSpeedrunRecord = LevelSaveManager.recordSpeedrun > 0;
                    LevelSaveManager.recordSpeedrun = Game.Level.countStepsSpeedrun;
                    Engine.Data.save("speedrunrecord." + (Game.Level.hard ? "hard" : "normal"), LevelSaveManager.recordSpeedrun, 60);
                    LevelSaveManager.levelSpeedrun = 1;
                    Engine.Data.save("speedrunlevel." + (Game.Level.hard ? "hard" : "normal"), 0, 60);
                    LevelSaveManager.dataSpeedrun = 0;
                    Engine.Data.save("speedrundata." + (Game.Level.hard ? "hard" : "normal"), 0, 60);
                }
                else if (Game.Level.speedrun && Game.Level.nextIndex > Game.MAX_LEVELS) {
                    LevelSaveManager.hasSpeedrunRecord = false;
                    LevelSaveManager.levelSpeedrun = 1;
                    Engine.Data.save("speedrunlevel." + (Game.Level.hard ? "hard" : "normal"), 0, 60);
                    LevelSaveManager.dataSpeedrun = 0;
                    Engine.Data.save("speedrundata." + (Game.Level.hard ? "hard" : "normal"), 0, 60);
                }
                else if (Game.Level.speedrun) {
                    LevelSaveManager.levelSpeedrun = Game.Level.nextIndex;
                    Engine.Data.save("speedrunlevel." + (Game.Level.hard ? "hard" : "normal"), LevelSaveManager.levelSpeedrun, 60);
                    LevelSaveManager.dataSpeedrun = Game.Level.countStepsSpeedrun;
                    Engine.Data.save("speedrundata." + (Game.Level.hard ? "hard" : "normal"), LevelSaveManager.dataSpeedrun, 60);
                }
                if (Game.Level.hard) {
                    if (!Game.Level.speedrun && Game.Level.index < Game.MAX_LEVELS && Game.Level.index == Game.LEVELS_PER_PAGE * (Game.LevelSelection.indexPageHard + 1)) {
                        Game.LevelSelection.indexPageHard += 1;
                    }
                }
                else {
                    if (!Game.Level.speedrun && Game.Level.index < Game.MAX_LEVELS && Game.Level.index == Game.LEVELS_PER_PAGE * (Game.LevelSelection.indexPageNormal + 1)) {
                        Game.LevelSelection.indexPageNormal += 1;
                    }
                }
                this.winSaved = true;
                Game.triggerActions("savegame");
            }
            if (Game.Level.speedrun && !this.winSaved && !this.exiting && Game.ExitButton.instance.control.pressed) {
                LevelSaveManager.levelSpeedrun = Game.Level.index;
                Engine.Data.save("speedrunlevel." + (Game.Level.hard ? "hard" : "normal"), LevelSaveManager.levelSpeedrun, 60);
                LevelSaveManager.dataSpeedrun = Game.Level.countStepsSpeedrun;
                Engine.Data.save("speedrundata." + (Game.Level.hard ? "hard" : "normal"), LevelSaveManager.dataSpeedrun, 60);
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
    var X_LOADING_START = -80 + 59 - 10 + 7;
    var X_LOADING_PRESS = -42 + 1 - 10.5;
    var X_LOADING_COMPLETE = -34;
    var Y_LOADING = -60 + 54 + 14 - 11;
    var STEPS_DOTS = 20;
    var STEPS_BLINK_TEXT = 40;
    var STEPS_NEXT = 60;
    var canexi = false;
    var Preloader = /** @class */ (function (_super) {
        __extends(Preloader, _super);
        function Preloader() {
            var _this = _super.call(this) || this;
            _this.count = 0;
            Preloader.current = _this;
            Game.SceneFade.speed = 0.0166666666666667 * 1;
            _this.text = new Utils.Text();
            _this.text.font = Game.FontManager.a;
            _this.text.scale = 1;
            _this.text.enabled = true;
            _this.text.pinned = true;
            _this.text.str = "LOADING   ";
            _this.text.xAlignBounds = Utils.AnchorAlignment.START;
            _this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAligned = X_LOADING_START;
            _this.text.yAligned = Y_LOADING;
            _this.text.front = false;
            _this.control = new Game.Control();
            _this.control.enabled = true;
            _this.control.freezeable = true;
            _this.control.newInteractionRequired = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            _this.control.useTouch = true;
            _this.bar = new Game.LoadingBar();
            //SceneColors.enabledDown = false;
            //SceneColors.clearColor(CLEAR_RED, CLEAR_GREEN, CLEAR_BLUE);
            _this.loadMap(Game.Resources.PATH_MAP_NONE);
            _this.initStates();
            new Game.DecoPreloader();
            Game.triggerActions("preloader");
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
                _this.count += 1;
                if (_this.count == STEPS_DOTS) {
                    _this.count = 0;
                    if (_this.text.str == "LOADING   ") {
                        _this.text.str = "LOADING.  ";
                    }
                    else if (_this.text.str == "LOADING.  ") {
                        _this.text.str = "LOADING.. ";
                    }
                    else if (_this.text.str == "LOADING.. ") {
                        _this.text.str = "LOADING...";
                    }
                    else if (_this.text.str == "LOADING...") {
                        _this.text.str = "LOADING   ";
                    }
                }
            };
            loading.addLink(exit, function () { return Game.DIRECT_PRELOADER && Engine.Assets.downloadComplete && _this.bar.full; });
            loading.addLink(click, function () { return Engine.Assets.downloadComplete && _this.bar.full; });
            click.onEnter = function () {
                _this.count = 0;
                _this.text.str = "PRESS TO CONTINUE";
                _this.text.xAligned = X_LOADING_PRESS;
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
                    _this.text.enabled = !_this.text.enabled;
                }
            };
            click.addLink(exit, function () { return canexi; });
            exit.onEnter = function () {
                if (Game.DIRECT_PRELOADER) {
                    _this.text.str = "LOAD COMPLETE!";
                    _this.text.xAligned = X_LOADING_COMPLETE;
                    //@ts-ignore
                    //Engine.AudioManager.verify();
                }
                Game.HAS_STARTED = true;
                Game.IS_TOUCH = Game.IS_TOUCH || Game.FORCE_TOUCH || _this.control.touchPressed;
                //HAS_LINKS = HAS_LINKS && !IS_TOUCH;
                _this.text.enabled = true;
                Game.SceneFade.trigger();
                Game.triggerActions("postinit");
            };
            exit.onStepUpdate = function () {
            };
            exit.addLink(wait, function () { return Game.SceneFade.filled && Preloader.canFinish; });
            wait.onEnter = function () {
                _this.count = 0;
            };
            wait.onStepUpdate = function () {
                _this.count += 1;
            };
            wait.addLink(next, function () { return (Game.startingSceneClass != Game.MainMenu || _this.count >= STEPS_NEXT); });
            next.onEnter = function () {
                //triggerActions("preloadchangecolor");
                Game.triggerActions("endpreloader");
                Engine.System.nextSceneClass = Game.PreloadEnd;
            };
            next.onStepUpdate = function () {
                // if(Preloader.canExit){
                //     this.count += 1;
                //     if(this.count >= STEPS_NEXT){
                //         Engine.System.nextSceneClass = PreloadEnd;
                //         Preloader.canExit = false;
                //     }
                // }
            };
            new Game.Flow.StateMachine(this).startState = loading;
        };
        Preloader.canFinish = true;
        return Preloader;
    }(Game.SceneMap));
    Game.Preloader = Preloader;
})(Game || (Game = {}));
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
            //SceneColors.clearColor(0, 0, 0);
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
        FRAMES = Game.FrameSelector.complex("exit button", Game.Resources.textureGumRem, 364, 581);
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
        FRAMES = Game.FrameSelector.complex("music button", Game.Resources.textureGumRem, 364, 581);
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
        FRAMES = Game.FrameSelector.complex("pause button", Game.Resources.textureGumRem, 364, 581);
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
        FRAMES = Game.FrameSelector.complex("reset button", Game.Resources.textureGumRem, 364, 581);
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
        FRAMES = Game.FrameSelector.complex("sound button", Game.Resources.textureGumRem, 364, 581);
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
    var FRAMES;
    var FRAMES_BORDER;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("673", Game.Resources.textureGumRem, 820, 767);
        FRAMES_BORDER = Game.FrameSelector.complex("673", Game.Resources.textureGumRem, 820, 814);
    });
    var LevelText = /** @class */ (function (_super) {
        __extends(LevelText, _super);
        function LevelText() {
            var _this = _super.call(this) || this;
            _this.text0 = new Utils.Text();
            _this.text0.font = Game.FontManager.b;
            _this.text0.scale = 1;
            _this.text0.enabled = true;
            _this.text0.pinned = true;
            _this.text0.str = "LEVEL " + (Game.Level.index < 10 ? "0" : "") + Game.Level.index;
            _this.text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text0.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text0.yAlignView = Utils.AnchorAlignment.START;
            _this.text0.xAligned = 0;
            _this.text0.yAligned = Game.Y_BUTTONS_TOP + (Game.Level.speedrun ? 1 : 1 + 5);
            if (Game.IS_TOUCH) {
                //this.text0.enabled = false;
            }
            _this.uiZone = new Engine.Sprite();
            _this.uiZone.enabled = true;
            _this.uiZone.pinned = true;
            FRAMES[Game.IS_TOUCH ? 1 : 0].applyToSprite(_this.uiZone);
            _this.uiZone.setRGBA(1, 1, 1, Game.UI_BACK_ALPHA);
            _this.uiZone.x = -Engine.Renderer.xSizeView / 2;
            _this.uiZone.y = -Engine.Renderer.ySizeView / 2;
            _this.uiZoneBorder = new Engine.Sprite();
            _this.uiZoneBorder.enabled = true;
            _this.uiZoneBorder.pinned = true;
            FRAMES_BORDER[Game.IS_TOUCH ? 1 : 0].applyToSprite(_this.uiZoneBorder);
            _this.uiZoneBorder.x = -Engine.Renderer.xSizeView / 2;
            _this.uiZoneBorder.y = -Engine.Renderer.ySizeView / 2;
            _this.fix();
            return _this;
        }
        LevelText.prototype.fix = function () {
            if (Engine.Renderer.xSizeView >= 400) {
                this.text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
                this.text0.xAligned = 0;
                this.uiZone.x = 0;
            }
            else {
                this.text0.xAlignView = Utils.AnchorAlignment.START;
                this.text0.xAligned = 134 + (Engine.Renderer.xSizeView - 43 - 134) * 0.5;
                this.uiZone.x = 50 - 4.5;
            }
            this.uiZone.y = -Engine.Renderer.ySizeView / 2;
            this.uiZoneBorder.x = this.uiZone.x;
            this.uiZoneBorder.y = this.uiZone.y;
        };
        LevelText.prototype.onViewUpdate = function () {
            this.fix();
        };
        LevelText.prototype.onDrawUIDialogs = function () {
            this.uiZone.render();
            this.uiZoneBorder.render();
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
            _this.text.font = Game.FontManager.b;
            _this.text.scale = 1;
            _this.text.enabled = true;
            _this.text.pinned = true;
            _this.text.str = Game.Level.countStepsSpeedrun == 0 ? "0.000" : SpeedrunTimer.getTextValue(Game.Level.countStepsSpeedrun);
            _this.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text.yAlignView = Utils.AnchorAlignment.START;
            _this.text.xAligned = 0;
            _this.text.yAligned = Game.Y_BUTTONS_TOP + 10;
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
            if (Engine.Renderer.xSizeView >= 400) {
                this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
                this.text.xAligned = 0;
            }
            else {
                this.text.xAlignView = Utils.AnchorAlignment.START;
                this.text.xAligned = 134 + (Engine.Renderer.xSizeView - 43 - 134) * 0.5;
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
            FontManager.a.setFull(Game.Resources.textureGumRem, 23, 908, 0);
            FontManager.b = new Utils.Font();
            FontManager.b.setFull(Game.Resources.textureGumRem, 201, 908, -1);
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
    var PATH_BGM = "Assets/Audio/gumrem.omw";
    var PATH_SFX_GUM_REM_BALL_ON_WALL = "Assets/Audio/gumrem-ball-on-wall.wom";
    var PATH_SFX_GUM_REM_CANNON = "Assets/Audio/gumrem-cannon.wom";
    var PATH_SFX_GUM_REM_DEATH = "Assets/Audio/gumrem-death.wom";
    var PATH_SFX_GUM_REM_FALL = "Assets/Audio/gumrem-fall.wom";
    var PATH_SFX_GUM_REM_FIRE = "Assets/Audio/gumrem-fire.wom";
    var PATH_SFX_GUM_REM_GROUND = "Assets/Audio/gumrem-ground.wom";
    var PATH_SFX_GUM_REM_JUMP = "Assets/Audio/gumrem-jump.wom";
    var PATH_SFX_GUM_REM_SWITCH = "Assets/Audio/gumrem-switch.wom";
    var PATH_SFX_GUM_REM_WALK_A = "Assets/Audio/gumrem-walk-a.wom";
    var PATH_SFX_GUM_REM_WALK_B = "Assets/Audio/gumrem-walk-b.wom";
    var PATH_SFX_GUM_REM_WIN = "Assets/Audio/gumrem-win.wom";
    var PATH_SFX_GUM_REM_SUMMON = "Assets/Audio/gumrem-summon.wom";
    Game.PATH_TEXTURE_GUM_REM = "Assets/Graphics/GumRem.png";
    Game.PATH_TEXTURE_VERSION = "Assets/Graphics/Version.png";
    var PATH_GOOGLE_PLAY_LOGO = "Assets/Graphics/google-play-badge.png";
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
        Resources.PATH_TILESET = "Assets/Maps/Tileset.json";
        Resources.PATH_FRAMES = "Assets/Graphics/frames.json";
        Resources.PATH_MAPS = "Assets/Maps/";
        Resources.PATH_MAP_NONE = Resources.PATH_MAPS + "None.json";
        Resources.PATH_MAP_SKY = Resources.PATH_MAPS + "Sky.json";
        Resources.PATH_MAP_PRELOADER = Resources.PATH_MAPS + "Preloader.json";
        Resources.PATH_MAP_MAIN_MENU = Resources.PATH_MAPS + "MainMenu.json";
        Resources.PATH_MAP_MAIN_MENU_TOUCH = Resources.PATH_MAPS + "MainMenuTouch.json";
        Resources.PATH_MAP_LAST_NORMAL = Resources.PATH_MAPS + "LastScene-Normal.json";
        Resources.PATH_MAP_LAST_HARD = Resources.PATH_MAPS + "LastScene-Hard.json";
        Resources.PATH_LEVEL = Resources.PATH_MAPS + "Level";
        Resources.bgmPlayed = false;
        Resources.bgmVolumeTracker = 1;
        return Resources;
    }());
    Game.Resources = Resources;
    function getPathLevel(index, hard) {
        return Resources.PATH_LEVEL + "" + (index < 10 ? "0" : "") + index + "-" + (hard ? "Hard" : "Normal") + ".json";
    }
    Game.getPathLevel = getPathLevel;
    Game.addPath("preload", Resources.PATH_FRAMES);
    Game.addPath("preload", Game.PATH_TEXTURE_GUM_REM);
    Game.addPath("preload", Game.PATH_TEXTURE_VERSION);
    Game.addPath("preload", Resources.PATH_TILESET);
    Game.addPath("preload", Resources.PATH_MAP_NONE);
    Game.addPath("preload", Resources.PATH_MAP_SKY);
    Game.addPath("preload", Resources.PATH_MAP_PRELOADER);
    Game.addPath("load", Resources.PATH_LEVEL_TEST);
    Game.addPath("load", Resources.PATH_MAP_MAIN_MENU);
    Game.addPath("load", Resources.PATH_MAP_MAIN_MENU_TOUCH);
    Game.addPath("load", Resources.PATH_MAP_LAST_NORMAL);
    Game.addPath("load", Resources.PATH_MAP_LAST_HARD);
    for (var indexLevel = 1; indexLevel <= Game.MAX_LEVELS; indexLevel += 1) {
        Game.addPath("load", getPathLevel(indexLevel, false));
        Game.addPath("load", getPathLevel(indexLevel, true));
    }
    Game.addPath("load", PATH_BGM);
    Game.addPath("load", PATH_SFX_GUM_REM_BALL_ON_WALL);
    Game.addPath("load", PATH_SFX_GUM_REM_CANNON);
    Game.addPath("load", PATH_SFX_GUM_REM_DEATH);
    Game.addPath("load", PATH_SFX_GUM_REM_FALL);
    Game.addPath("load", PATH_SFX_GUM_REM_FIRE);
    Game.addPath("load", PATH_SFX_GUM_REM_GROUND);
    Game.addPath("load", PATH_SFX_GUM_REM_JUMP);
    Game.addPath("load", PATH_SFX_GUM_REM_SWITCH);
    Game.addPath("load", PATH_SFX_GUM_REM_WALK_A);
    Game.addPath("load", PATH_SFX_GUM_REM_WALK_B);
    Game.addPath("load", PATH_SFX_GUM_REM_WIN);
    Game.addPath("load", PATH_SFX_GUM_REM_SUMMON);
    Game.addAction("preinit", function () {
        Resources.textureGumRem = new Engine.Texture(Game.PATH_TEXTURE_GUM_REM, true, false);
        Resources.textureGumRem.preserved = true;
        Resources.textureVersion = new Engine.Texture(Game.PATH_TEXTURE_VERSION, false, true);
        Resources.textureVersion.preserved = true;
        if (Game.HAS_LINKS && Game.HAS_GOOGLE_PLAY_LOGOS) {
            Game.addPath("load", PATH_GOOGLE_PLAY_LOGO);
        }
    });
    Game.addAction("preconfigure", function () {
    });
    Game.addAction("configure", function () {
        if (Game.HAS_LINKS && Game.HAS_GOOGLE_PLAY_LOGOS) {
            Resources.textureGooglePlay = new Engine.Texture(PATH_GOOGLE_PLAY_LOGO, false, true);
            Resources.textureGooglePlay.preserved = true;
        }
        var vscale = 0.75;
        var vscalebgm = 1.2;
        var vscalesfx = 1;
        Resources.bgm = new Engine.AudioPlayer(PATH_BGM);
        Resources.bgm.preserved = true;
        Resources.bgm.volume = Resources.bgm.restoreVolume = 1 * vscale * vscalebgm;
        Resources.bgm.loopStart = 0;
        Resources.bgm.loopEnd = 89.624960;
        Game.bgms.push(Resources.bgm);
        Resources.sfxGumRemBallOnWall = new Engine.AudioPlayer(PATH_SFX_GUM_REM_BALL_ON_WALL);
        Resources.sfxGumRemBallOnWall.preserved = true;
        Resources.sfxGumRemBallOnWall.volume = Resources.sfxGumRemBallOnWall.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemBallOnWall);
        Resources.sfxGumRemCannon = new Engine.AudioPlayer(PATH_SFX_GUM_REM_CANNON);
        Resources.sfxGumRemCannon.preserved = true;
        Resources.sfxGumRemCannon.volume = Resources.sfxGumRemCannon.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemCannon);
        Resources.sfxGumRemDeath = new Engine.AudioPlayer(PATH_SFX_GUM_REM_DEATH);
        Resources.sfxGumRemDeath.preserved = true;
        Resources.sfxGumRemDeath.volume = Resources.sfxGumRemDeath.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemDeath);
        Resources.sfxGumRemFall = new Engine.AudioPlayer(PATH_SFX_GUM_REM_FALL);
        Resources.sfxGumRemFall.preserved = true;
        Resources.sfxGumRemFall.volume = Resources.sfxGumRemFall.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemFall);
        Resources.sfxGumRemFire = new Engine.AudioPlayer(PATH_SFX_GUM_REM_FIRE);
        Resources.sfxGumRemFire.preserved = true;
        Resources.sfxGumRemFire.volume = Resources.sfxGumRemFire.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemFire);
        Resources.sfxGumRemGround = new Engine.AudioPlayer(PATH_SFX_GUM_REM_GROUND);
        Resources.sfxGumRemGround.preserved = true;
        Resources.sfxGumRemGround.volume = Resources.sfxGumRemGround.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemGround);
        Resources.sfxGumRemJump = new Engine.AudioPlayer(PATH_SFX_GUM_REM_JUMP);
        Resources.sfxGumRemJump.preserved = true;
        Resources.sfxGumRemJump.volume = Resources.sfxGumRemJump.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemJump);
        Resources.sfxGumRemSwitch = new Engine.AudioPlayer(PATH_SFX_GUM_REM_SWITCH);
        Resources.sfxGumRemSwitch.preserved = true;
        Resources.sfxGumRemSwitch.volume = Resources.sfxGumRemSwitch.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemSwitch);
        Resources.sfxGumRemWalkA = new Engine.AudioPlayer(PATH_SFX_GUM_REM_WALK_A);
        Resources.sfxGumRemWalkA.preserved = true;
        Resources.sfxGumRemWalkA.volume = Resources.sfxGumRemWalkA.restoreVolume = 0.50 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemWalkA);
        Resources.sfxGumRemWalkB = new Engine.AudioPlayer(PATH_SFX_GUM_REM_WALK_B);
        Resources.sfxGumRemWalkB.preserved = true;
        Resources.sfxGumRemWalkB.volume = Resources.sfxGumRemWalkB.restoreVolume = 0.50 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemWalkB);
        Resources.sfxGumRemWin = new Engine.AudioPlayer(PATH_SFX_GUM_REM_WIN);
        Resources.sfxGumRemWin.preserved = true;
        Resources.sfxGumRemWin.volume = Resources.sfxGumRemWin.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemWin);
        Resources.sfxGumRemSummon = new Engine.AudioPlayer(PATH_SFX_GUM_REM_SUMMON);
        Resources.sfxGumRemSummon.preserved = true;
        Resources.sfxGumRemSummon.volume = Resources.sfxGumRemSummon.restoreVolume = 0.70 * vscale * vscalesfx;
        Game.sfxs.push(Resources.sfxGumRemSummon);
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
            _this.fillDown.y = 120 + 16;
            _this.fillDown.xSize = 320;
            _this.fillDown.xOffset = -160;
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
            Engine.Renderer.clearColor(red / 255, green / 255, blue / 255);
        };
        SceneColors.setDownColor = function (red, green, blue, alpha) {
            red = 248;
            green = 248;
            blue = 248;
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
            _this.red = 26 / 255;
            _this.green = 26 / 255;
            _this.blue = 26 / 255;
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
                this.alpha += this.speed * this.direction;
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
                var extAlpha = this.alpha + this.speed * this.direction * Engine.System.stepExtrapolation;
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
            instance.red = red / 255;
            instance.green = green / 255;
            instance.blue = blue / 255;
            instance.sprite.setRGBA(instance.red, instance.green, instance.blue, instance.maxAlpha);
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
            var yOffset = 24 - 6;
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
            _this.text0.yAligned = yOffset;
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
            _this.device.y = 0 - 6;
            FRAMES[0].applyToSprite(_this.device);
            _this.fill = new Engine.Sprite();
            _this.fill.enabled = true;
            _this.fill.pinned = true;
            _this.fill.setRGBA(0 / 255, 88 / 255, 248 / 255, 1);
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
        //FRAMES = FrameSelector.complex(Resources.texture, 13, 74);
        //ready = true;
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
            else {
                box.xSize = 0;
                box.ySize = 0;
                box.xOffset = 0;
                box.yOffset = 0;
            }
        };
        AnimationFrame.prototype.applyToBoxEx = function (box) {
            if (this.hasBox) {
                box.enabled = true;
                box.xSize = this.xSizeBox;
                box.ySize = this.ySizeBox;
                box.xOffset = this.xOffsetBox;
                box.yOffset = this.yOffsetBox;
            }
            else {
                box.enabled = false;
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
            return _this;
        }
        Object.defineProperty(Animator.prototype, "ended", {
            get: function () {
                return this.cycles > 0;
            },
            enumerable: false,
            configurable: true
        });
        Animator.prototype.setCurrentFrame = function () {
            if (this.animation != null) {
                var indexFrame = this.animation.indexArray != null ? this.animation.indexArray[this.indexFrame] : this.indexFrame;
                var frame = this.animation.frames[indexFrame];
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
    var FRAMES;
    Game.addAction("preinit", function () {
        FRAMES = Game.FrameSelector.complex("preload bar", Game.Resources.textureGumRem, 437, 270);
    });
    var LoadingBar = /** @class */ (function (_super) {
        __extends(LoadingBar, _super);
        function LoadingBar() {
            var _this = _super.call(this) || this;
            _this.loadCount = 0;
            _this.count = 0;
            if (Game.startingSceneClass != Game.MainMenu) {
                Game.LOAD_VELOCITY *= 60000;
            }
            _this.spriteBack = new Engine.Sprite();
            _this.spriteBack.enabled = true;
            _this.spriteBack.pinned = true;
            FRAMES[0].applyToSprite(_this.spriteBack);
            _this.spriteBack.x = -_this.spriteBack.xSize * 0.5;
            _this.spriteBack.y = 4 - 11;
            _this.spriteBar = new Engine.Sprite();
            _this.spriteBar.enabled = true;
            _this.spriteBar.pinned = true;
            FRAMES[1].applyToSprite(_this.spriteBar);
            _this.spriteBar.x = _this.spriteBack.x + 1;
            _this.spriteBar.y = _this.spriteBack.y + 1;
            _this.loadSize = _this.spriteBar.xSize;
            _this.spriteBar.xSize = 1;
            if (Engine.Renderer.mode != Engine.RendererMode.CANVAS_2D) {
                //this.spriteBar.setRGBA(1, 1, 1, 0.6);
            }
            return _this;
        }
        Object.defineProperty(LoadingBar.prototype, "full", {
            get: function () {
                return this.spriteBar.xSize == this.loadSize;
            },
            enumerable: false,
            configurable: true
        });
        LoadingBar.prototype.onStepUpdate = function () {
            this.count += 1;
            if (this.count > 60 * 2) {
                Game.MAX += Math.random() * 0.1;
                if (Game.MAX > 0.9) {
                    Game.MAX = 0.9;
                }
                this.count = 0;
            }
            var max = Game.MAX;
            if (max < Engine.Assets.downloadedRatio) {
                max = Engine.Assets.downloadedRatio;
            }
            max *= this.loadSize;
            this.loadCount += Game.LOAD_VELOCITY;
            if (this.loadCount > max) {
                this.loadCount = max;
            }
            //this.emitter0.xMax = this.spriteBar.xSize * this.spriteBar.xScale;
            //this.emitter1.xMax = this.spriteBar.xSize * this.spriteBar.xScale;
            this.spriteBar.xSize = Math.floor(this.loadCount);
        };
        LoadingBar.prototype.onDrawObjects = function () {
            this.spriteBar.render();
        };
        LoadingBar.prototype.onDrawDialogs = function () {
            this.spriteBack.render();
        };
        return LoadingBar;
    }(Engine.Entity));
    Game.LoadingBar = LoadingBar;
})(Game || (Game = {}));
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
    function range(start, end) {
        return start + Math.random() * (end - start);
    }
    Game.range = range;
})(Game || (Game = {}));
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
                _this.emissionSteps = 0;
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
                this.countEmitt = 0;
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
            Emitter.prototype.onStepUpdate = function () {
                if (!Game.SceneFreezer.stoped && this.emissionSteps > 0) {
                    this.countEmitt += 1;
                    if (this.countEmitt >= this.emissionSteps) {
                        this.emittChunk();
                        this.countEmitt = 0;
                    }
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
    var JumpTutorial = /** @class */ (function (_super) {
        __extends(JumpTutorial, _super);
        function JumpTutorial() {
            var _this = _super.call(this) || this;
            JumpTutorial.instance = _this;
            var xPosA = 0;
            var yPosA = -60 + 7;
            _this.text0 = new Utils.Text();
            _this.text0.font = Game.FontManager.a;
            _this.text0.scale = 1;
            _this.text0.enabled = true;
            _this.text0.pinned = true;
            if (Game.IS_EDGE || Game.FORCE_EDGE_TUTORIAL) {
                _this.text0.str = "3. PRESS DOWN ARROW OR";
            }
            else {
                _this.text0.str = "3. PRESS S - DOWN ARROW OR";
            }
            _this.text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text0.xAligned = xPosA;
            _this.text0.yAligned = yPosA;
            _this.text0.superback = true;
            _this.text1 = new Utils.Text();
            _this.text1.font = Game.FontManager.a;
            _this.text1.scale = 1;
            _this.text1.enabled = true;
            _this.text1.pinned = true;
            _this.text1.str = "ANY JUMP BUTTON TO FALL!";
            _this.text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text1.xAligned = xPosA;
            _this.text1.yAligned = yPosA + 10;
            _this.text1.superback = true;
            var xPosB = 0;
            var yPosB = -80 - 1;
            _this.text2 = new Utils.Text();
            _this.text2.font = Game.FontManager.a;
            _this.text2.scale = 1;
            _this.text2.enabled = true;
            _this.text2.pinned = true;
            _this.text2.str = "2. H -" + ((Game.IS_EDGE || Game.FORCE_EDGE_TUTORIAL) ? " " : " W - ") + "UP ARROW";
            _this.text2.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text2.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text2.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text2.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text2.xAligned = xPosB;
            _this.text2.yAligned = yPosB;
            _this.text2.superback = true;
            _this.text3 = new Utils.Text();
            _this.text3.font = Game.FontManager.a;
            _this.text3.scale = 1;
            _this.text3.enabled = true;
            _this.text3.pinned = true;
            _this.text3.str = "OR SPACE TO JUMP!";
            _this.text3.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text3.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text3.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text3.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text3.xAligned = xPosB;
            _this.text3.yAligned = yPosB + 10;
            _this.text3.superback = true;
            if (Game.IS_TOUCH) {
                _this.text0.enabled = false;
                _this.text1.enabled = false;
                _this.text2.enabled = false;
                _this.text3.enabled = false;
            }
            return _this;
        }
        return JumpTutorial;
    }(Engine.Entity));
    Game.JumpTutorial = JumpTutorial;
})(Game || (Game = {}));
///<reference path = "../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var FRAMES_DECO_A;
    var ANIM_DECO_A;
    var FRAMES_DECO_B;
    var ANIM_DECO_B;
    var FRAMES_DECO_C;
    var ANIM_DECO_C;
    Game.addAction("configure", function () {
        FRAMES_DECO_A = Game.FrameSelector.complex("main menu deco a", Game.Resources.textureGumRem, 437, 391);
        ANIM_DECO_A = new Utils.Animation("stand", true, FRAMES_DECO_A, 10, [0, 1, 2, 1], null);
        FRAMES_DECO_B = Game.FrameSelector.complex("main menu deco b", Game.Resources.textureGumRem, 535, 391);
        ANIM_DECO_B = new Utils.Animation("stand", true, FRAMES_DECO_B, 10, [0, 1, 2, 1], null);
        FRAMES_DECO_C = Game.FrameSelector.complex("main menu deco c", Game.Resources.textureGumRem, 55, 86);
        ANIM_DECO_C = new Utils.Animation("stay", true, FRAMES_DECO_C, 5, [8, 7, 6, 5, 6, 7], null);
    });
    var MainMenuObjects = /** @class */ (function (_super) {
        __extends(MainMenuObjects, _super);
        function MainMenuObjects() {
            var _this = _super.call(this) || this;
            new Game.Title();
            var pos = Game.HAS_LINKS ? 50 : 30;
            new Game.DecoBase(-pos, 38, false, true, ANIM_DECO_A);
            new Game.DecoBase(pos, 38, true, true, ANIM_DECO_B);
            new Game.DecoBase(pos, 65, false, true, ANIM_DECO_C);
            new Game.DecoBase(-pos, 65, false, true, ANIM_DECO_C);
            return _this;
        }
        return MainMenuObjects;
    }(Engine.Entity));
    Game.MainMenuObjects = MainMenuObjects;
})(Game || (Game = {}));
///<reference path="../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var MoveTutorial = /** @class */ (function (_super) {
        __extends(MoveTutorial, _super);
        function MoveTutorial() {
            var _this = _super.call(this) || this;
            var pos = -20 - 20 - 10 + 8 - 21;
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.a;
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
            text1.font = Game.FontManager.a;
            text1.scale = 1;
            text1.enabled = true;
            text1.pinned = true;
            text1.str = Game.IS_TOUCH ? "   " : "TO MOVE!";
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
///<reference path="../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var ResetTutorial = /** @class */ (function (_super) {
        __extends(ResetTutorial, _super);
        function ResetTutorial() {
            var _this = _super.call(this) || this;
            var pos = -20;
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.a;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = "R TO RESET";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.xAligned = 0;
            text0.yAligned = pos;
            text0.superback = true;
            //if(IS_TOUCH){
            text0.enabled = false;
            return _this;
            //}
        }
        return ResetTutorial;
    }(Engine.Entity));
    Game.ResetTutorial = ResetTutorial;
})(Game || (Game = {}));
///<reference path = "../../Game/Arcade/WorldEntity.ts"/>
var Game;
(function (Game) {
    var SPRITE_COUNT = 12;
    var EMOTION_COUNT = 6;
    var OFFSET_COLOR = SPRITE_COUNT * EMOTION_COUNT;
    var FRAMES_BOXES;
    var FRAMES_BLOB;
    var FRAMES_DEAD_PLAYER;
    var FRAMES_DEAD_ENEMY;
    Game.EMOTION_NEUTRAL = 0;
    Game.EMOTION_HAPPY = 1;
    Game.EMOTION_SAD = 2;
    Game.EMOTION_ANGRY = 3;
    Game.EMOTION_BORED = 4;
    Game.EMOTION_VERY_SAD = 5;
    var ANIM_STAND;
    var ANIM_MOVE;
    var ANIM_ASCEND;
    var ANIM_FALL;
    var ANIM_FALL_ASCEND;
    var ANIM_LANDING;
    var ANIM_DEAD_PLAYER_GIRL;
    var ANIM_DEAD_PLAYER_BOY;
    var ANIM_DEAD_ENEMY_GIRL;
    var ANIM_DEAD_ENEMY_BOY;
    var ANIM_WAITING_FOR_SUMMON;
    var ANIM_SUMMONED;
    Game.addAction("preinit", function () {
        FRAMES_BOXES = Game.FrameSelector.complex("blob boxes", Game.Resources.textureGumRem, 21, 59);
        FRAMES_BLOB = Game.FrameSelector.complex("blob sprites", Game.Resources.textureGumRem, 21, 112);
        FRAMES_DEAD_PLAYER = Game.FrameSelector.complex("blob dead player", Game.Resources.textureGumRem, 364, 641);
        FRAMES_DEAD_ENEMY = Game.FrameSelector.complex("blob dead enemy", Game.Resources.textureGumRem, 364, 703);
        ANIM_STAND = new Utils.Animation("stand", true, FRAMES_BLOB, 10, [0, 1, 2, 1], null);
        ANIM_MOVE = new Utils.Animation("move", true, FRAMES_BLOB, 5, [0, 1, 2, 1], null);
        ANIM_ASCEND = new Utils.Animation("ascend", false, FRAMES_BLOB, 3, [4, 5, 6], null);
        ANIM_FALL_ASCEND = new Utils.Animation("fall ascend", false, FRAMES_BLOB, 5, [7, 8, 9, 10, 11], null);
        ANIM_FALL = new Utils.Animation("fall", false, FRAMES_BLOB, 5, [8, 9, 10, 11], null);
        ANIM_LANDING = new Utils.Animation("landing", false, FRAMES_BLOB, 6, [1, 2, 1], null);
        ANIM_DEAD_PLAYER_GIRL = new Utils.Animation("dead player girl", false, FRAMES_DEAD_PLAYER, 2, [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], null);
        ANIM_DEAD_PLAYER_BOY = new Utils.Animation("dead player boy", false, FRAMES_DEAD_PLAYER, 2, [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], null);
        ANIM_DEAD_ENEMY_GIRL = new Utils.Animation("dead enemy girl", false, FRAMES_DEAD_ENEMY, 2, [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], null);
        ANIM_DEAD_ENEMY_BOY = new Utils.Animation("dead enemy boy", false, FRAMES_DEAD_ENEMY, 2, [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], null);
        ANIM_WAITING_FOR_SUMMON = new Utils.Animation("enemy waiting for summon", false, FRAMES_DEAD_ENEMY, 2, [16, 16], null);
        ANIM_SUMMONED = new Utils.Animation("enemy summoned", false, FRAMES_DEAD_ENEMY, 2, [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6], null);
    });
    var Blob = /** @class */ (function (_super) {
        __extends(Blob, _super);
        function Blob(def, color) {
            var _this = _super.call(this, def) || this;
            _this.contactsSolids = null;
            _this.contactsGround = null;
            _this.contactsSpikes = null;
            _this.xVelMove = 0;
            _this.yVelJump = 0;
            _this.yVelFall = 0;
            _this.emotion = 0;
            _this.decoration = false;
            _this._xOverlapsPlatform = false;
            _this._xCollidesOnPlatform = false;
            _this._yOverlapsPlatform = false;
            _this.color = color;
            FRAMES_BOXES[0].applyToBox(_this.boxSolid);
            _this.boxSolid.data = _this;
            _this.xVelMove = _this.getProperty("vel move") || 0;
            _this.yVelJump = _this.getProperty("vel jump") || 0;
            _this.yVelFall = _this.getProperty("vel fall") || 0;
            _this.xAlign = "middle";
            _this.yAlign = "end";
            _this.emitter = new Game.Emission.Emitter((_this.color == 0 || _this.color == 1) ? Game.DeadParticlePlayer : Game.DeadParticleEnemy, 16);
            _this.emitter.sizeEmission = 8;
            return _this;
        }
        Object.defineProperty(Blob.prototype, "xOverlapsPlatform", {
            get: function () {
                return this._xOverlapsPlatform;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Blob.prototype, "xCollidesOnPlatform", {
            get: function () {
                return this._xCollidesOnPlatform;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Blob.prototype, "yOverlapsPlatform", {
            get: function () {
                return this._yOverlapsPlatform;
            },
            enumerable: false,
            configurable: true
        });
        Blob.prototype.initStates = function () {
            var _this = this;
            _super.prototype.initStates.call(this);
            this.stateStand = new Game.Flow.State(this, "stand");
            this.stateMove = new Game.Flow.State(this, "move"),
                this.stateJump = new Game.Flow.State(this, "jump");
            this.stateFall = new Game.Flow.State(this, "fall");
            this.stateLanding = new Game.Flow.State(this, "landing");
            this.stateDead = new Game.Flow.State(this, "dead");
            this.stateWaitingForSummon = new Game.Flow.State(this, "waiting for summon");
            this.stateSummoned = new Game.Flow.State(this, "summoned");
            this.stateStand.onEnter = function () { _this.onStateStandEnter(); };
            this.stateStand.onReady = function () { _this.onStateStandReady(); };
            this.stateStand.onMoveUpdate = function () { _this.onStateStandMoveUpdate(); };
            this.stateStand.onOverlapUpdate = function () { _this.onStateStandOverlapUpdate(); };
            this.stateStand.onStepUpdate = function () { _this.onStateStandStepUpdate(); };
            this.stateStand.onTimeUpdate = function () { _this.onStateStandTimeUpdate(); };
            this.stateStand.onExit = function () { _this.onStateStandExit(); };
            this.stateStand.addLink(this.stateDead, function () { return _this.isDead(); });
            this.stateStand.addLink(this.stateFall, function () { return !_this.onGround() || (_this.sprite.yMirror && _this.needFall()); });
            this.stateStand.addLink(this.stateJump, function () { return _this.needJump(); });
            this.stateStand.addLink(this.stateMove, function () { return _this.getMoveDirection() != 0; });
            this.stateMove.onEnter = function () { _this.onStateMoveEnter(); };
            this.stateMove.onReady = function () { _this.onStateMoveReady(); };
            this.stateMove.onMoveUpdate = function () { _this.onStateMoveMoveUpdate(); };
            this.stateMove.onOverlapUpdate = function () { _this.onStateMoveOverlapUpdate(); };
            this.stateMove.onStepUpdate = function () { _this.onStateMoveStepUpdate(); };
            this.stateMove.onTimeUpdate = function () { _this.onStateMoveTimeUpdate(); };
            this.stateMove.onExit = function () { _this.onStateMoveExit(); };
            this.stateMove.addLink(this.stateDead, function () { return _this.isDead(); });
            this.stateMove.addLink(this.stateFall, function () { return !_this.onGround() || (_this.sprite.yMirror && _this.needFall()); });
            this.stateMove.addLink(this.stateJump, function () { return _this.needJump(); });
            this.stateMove.addLink(this.stateStand, function () { return _this.getMoveDirection() == 0; });
            this.stateJump.onEnter = function () { _this.onStateJumpEnter(); };
            this.stateJump.onReady = function () { _this.onStateJumpReady(); };
            this.stateJump.onMoveUpdate = function () { _this.onStateJumpMoveUpdate(); };
            this.stateJump.onOverlapUpdate = function () { _this.onStateJumpOverlapUpdate(); };
            this.stateJump.onStepUpdate = function () { _this.onStateJumpStepUpdate(); };
            this.stateJump.onTimeUpdate = function () { _this.onStateJumpTimeUpdate(); };
            this.stateJump.onExit = function () { _this.onStateJumpExit(); };
            this.stateJump.addLink(this.stateDead, function () { return _this.isDead(); });
            this.stateJump.addLink(this.stateLanding, function () { return _this.yDirContact != 0; });
            this.stateJump.addLink(this.stateFall, function () { return _this.yVel > 0; });
            this.stateFall.onEnter = function () { _this.onStateFallEnter(); };
            this.stateFall.onReady = function () { _this.onStateFallReady(); };
            this.stateFall.onMoveUpdate = function () { _this.onStateFallMoveUpdate(); };
            this.stateFall.onOverlapUpdate = function () { _this.onStateFallOverlapUpdate(); };
            this.stateFall.onStepUpdate = function () { _this.onStateFallStepUpdate(); };
            this.stateFall.onTimeUpdate = function () { _this.onStateFallTimeUpdate(); };
            this.stateFall.onExit = function () { _this.onStateFallExit(); };
            this.stateFall.addLink(this.stateDead, function () { return _this.isDead(); });
            this.stateFall.addLink(this.stateLanding, function () { return _this.yDirContact > 0; });
            this.stateLanding.onEnter = function () { _this.onStateLandingEnter(); };
            this.stateLanding.onReady = function () { _this.onStateLandingReady(); };
            this.stateLanding.onMoveUpdate = function () { _this.onStateLandingMoveUpdate(); };
            this.stateLanding.onOverlapUpdate = function () { _this.onStateLandingOverlapUpdate(); };
            this.stateLanding.onStepUpdate = function () { _this.onStateLandingStepUpdate(); };
            this.stateLanding.onTimeUpdate = function () { _this.onStateLandingTimeUpdate(); };
            this.stateLanding.onExit = function () { _this.onStateLandingExit(); };
            this.stateLanding.addLink(this.stateDead, function () { return _this.isDead(); });
            this.stateLanding.addLink(this.stateFall, function () { return !_this.onGround() || (_this.sprite.yMirror && _this.needFall()); });
            this.stateLanding.addLink(this.stateJump, function () { return _this.needJump(); });
            this.stateLanding.addLink(this.stateMove, function () { return _this.getMoveDirection() != 0; });
            this.stateLanding.addLink(this.stateStand, function () { return _this.landingEnd(); });
            this.stateDead.onEnter = function () { _this.onStateDeadEnter(); };
            this.stateDead.onReady = function () { _this.onStateDeadReady(); };
            this.stateDead.onMoveUpdate = function () { _this.onStateDeadMoveUpdate(); };
            this.stateDead.onOverlapUpdate = function () { _this.onStateDeadOverlapUpdate(); };
            this.stateDead.onStepUpdate = function () { _this.onStateDeadStepUpdate(); };
            this.stateDead.onTimeUpdate = function () { _this.onStateDeadTimeUpdate(); };
            this.stateDead.onExit = function () { _this.onStateDeadExit(); };
            this.stateWaitingForSummon.onReady = function () {
                _this.boxSolid.enabled = false;
                _this.yScaleForceWorld = 0;
                _this.xVel = 0;
                _this.yVel = 0;
                _this.animator.setAnimation(ANIM_WAITING_FOR_SUMMON);
            };
            this.stateSummoned.onReady = function () {
                _this.sprite.xMirror = _this.def.flip.x;
                _this.boxSolid.enabled = false;
                _this.boxSolid.x = _this.def.instance.x + Game.SceneMap.instance.xSizeTile * 0.5;
                _this.boxSolid.y = _this.def.instance.y + 32;
                _this.yScaleForceWorld = 0;
                _this.xVel = 0;
                _this.yVel = 0;
                _this.animator.setAnimation(ANIM_SUMMONED);
            };
            this.stateSummoned.onExit = function () {
                _this.boxSolid.enabled = true;
            };
            this.stateSummoned.addLink(this.stateFall, function () { return _this.animator.ended; });
            return this.stateStand;
        };
        Blob.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            if (this.sprite.yMirror) {
                this.boxSolid.y += this.boxSolid.ySize;
            }
            this.boxSolid.enabled = true;
            this.contactsSolids = null;
            this.contactsGround = null;
            this.contactsSpikes = null;
            this.emotion = Game.EMOTION_NEUTRAL;
        };
        Blob.prototype.summon = function () {
            this.machine.forceStateChange(this.stateSummoned);
        };
        Blob.prototype.isDead = function () {
            return this.contactsSolids != null || this.boxSolid.y >= Game.SceneMap.instance.ySizeMap || this.contactsSpikes != null;
        };
        Blob.prototype.getMoveDirection = function () {
            return 0;
        };
        Blob.prototype.getMoveVelocity = function () {
            return this.getMoveDirection() * this.xVelMove;
        };
        Blob.prototype.onGround = function () {
            return this.contactsGround != null || this.decoration;
        };
        Blob.prototype.needFall = function () {
            return false;
        };
        Blob.prototype.needJump = function () {
            return false;
        };
        Blob.prototype.landingEnd = function () {
            return this.animator.animation != null && this.animator.animation == ANIM_LANDING && this.animator.ended;
        };
        Blob.prototype.onStateStandEnter = function () {
        };
        Blob.prototype.onStateStandReady = function () {
            this.animator.setAnimation(ANIM_STAND);
            this.yScaleForceWorld = 0;
        };
        Blob.prototype.onStateStandMoveUpdate = function () {
        };
        Blob.prototype.onStateStandOverlapUpdate = function () {
        };
        Blob.prototype.onStateStandStepUpdate = function () {
            this.xVel = this.getMoveVelocity();
            if (this.xVel != 0) {
                this.sprite.xMirror = this.getMoveDirection() < 0;
            }
        };
        Blob.prototype.onStateStandTimeUpdate = function () {
        };
        Blob.prototype.onStateStandExit = function () {
        };
        Blob.prototype.onStateMoveEnter = function () {
        };
        Blob.prototype.onStateMoveReady = function () {
            this.animator.setAnimation(ANIM_MOVE);
            this.yScaleForceWorld = 0;
        };
        Blob.prototype.onStateMoveMoveUpdate = function () {
        };
        Blob.prototype.onStateMoveOverlapUpdate = function () {
        };
        Blob.prototype.onStateMoveStepUpdate = function () {
            this.xVel = this.getMoveVelocity();
            if (this.xVel != 0) {
                this.sprite.xMirror = this.getMoveDirection() < 0;
            }
        };
        Blob.prototype.onStateMoveTimeUpdate = function () {
        };
        Blob.prototype.onStateMoveExit = function () {
        };
        Blob.prototype.onStateJumpEnter = function () {
        };
        Blob.prototype.onStateJumpReady = function () {
            this.animator.setAnimation(ANIM_ASCEND);
            this.xVel = 0;
            this.yVel = -this.yVelJump;
            this.yScaleForceWorld = 1;
        };
        Blob.prototype.onStateJumpMoveUpdate = function () {
        };
        Blob.prototype.onStateJumpOverlapUpdate = function () {
        };
        Blob.prototype.onStateJumpStepUpdate = function () {
        };
        Blob.prototype.onStateJumpTimeUpdate = function () {
        };
        Blob.prototype.onStateJumpExit = function () {
        };
        Blob.prototype.onStateFallEnter = function () {
            this.sprite.yMirror = false;
        };
        Blob.prototype.onStateFallReady = function () {
            if (this.animator.animation == ANIM_ASCEND) {
                this.animator.setAnimation(ANIM_FALL_ASCEND);
            }
            else {
                this.animator.setAnimation(ANIM_FALL);
            }
            this.xVel = 0;
            if (this.needFall()) {
                this.yVel = this.yVelFall;
            }
            this.yScaleForceWorld = 1;
        };
        Blob.prototype.onStateFallMoveUpdate = function () {
        };
        Blob.prototype.onStateFallOverlapUpdate = function () {
        };
        Blob.prototype.onStateFallStepUpdate = function () {
        };
        Blob.prototype.onStateFallTimeUpdate = function () {
        };
        Blob.prototype.onStateFallExit = function () {
        };
        Blob.prototype.onStateLandingEnter = function () {
            this.sprite.yMirror = this.yDirContact < 0;
            this.checkGroundContacts();
        };
        Blob.prototype.onStateLandingReady = function () {
            this.animator.setAnimation(ANIM_LANDING);
            this.yScaleForceWorld = 0;
        };
        Blob.prototype.onStateLandingMoveUpdate = function () {
        };
        Blob.prototype.onStateLandingOverlapUpdate = function () {
        };
        Blob.prototype.onStateLandingStepUpdate = function () {
        };
        Blob.prototype.onStateLandingTimeUpdate = function () {
        };
        Blob.prototype.onStateLandingExit = function () {
        };
        Blob.prototype.onStateDeadEnter = function () {
            this.yScaleForceWorld = 0;
            this.xVel = 0;
            this.yVel = 0;
        };
        Blob.prototype.onStateDeadReady = function () {
            switch (this.color) {
                case 0:
                    this.animator.setAnimation(ANIM_DEAD_PLAYER_GIRL);
                    break;
                case 1:
                    this.animator.setAnimation(ANIM_DEAD_PLAYER_BOY);
                    break;
                case 2:
                    this.animator.setAnimation(ANIM_DEAD_ENEMY_BOY);
                    break;
                case 3:
                    this.animator.setAnimation(ANIM_DEAD_ENEMY_GIRL);
                    break;
            }
            this.emitter.x = this.boxSolid.x;
            this.emitter.y = this.boxSolid.y - this.boxSolid.ySize * 0.5;
            //this.emitter.emittChunk();
            this.boxSolid.enabled = false;
        };
        Blob.prototype.onStateDeadMoveUpdate = function () {
        };
        Blob.prototype.onStateDeadOverlapUpdate = function () {
        };
        Blob.prototype.onStateDeadStepUpdate = function () {
        };
        Blob.prototype.onStateDeadTimeUpdate = function () {
        };
        Blob.prototype.onStateDeadExit = function () {
        };
        Blob.prototype.onMoveReady = function () {
            this._xOverlapsPlatform = false;
            this._xCollidesOnPlatform = false;
            this._yOverlapsPlatform = false;
        };
        Blob.prototype.xMoveOnPlatform = function (dist) {
            //if(!this.moveActionsEnabled || this.dirMove == 0 || (this.dirMove > 0 && dist < 0)){
            var contacts = this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, true, dist, true, Engine.Box.LAYER_ALL);
            this.boxSolid.translate(contacts, true, dist, true);
            this._xCollidesOnPlatform = contacts != null;
            //}
        };
        Blob.prototype.yMoveOnPlatform = function (dist) {
            var contacts = this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, false, dist, true, Engine.Box.LAYER_ALL);
            this.boxSolid.translate(contacts, false, dist, true);
        };
        Blob.prototype.onPlatformOverlapX = function () {
            this._xOverlapsPlatform = true;
        };
        Blob.prototype.onPlatformOverlapY = function () {
            this._yOverlapsPlatform = true;
        };
        Blob.prototype.onMoveUpdate = function () {
            _super.prototype.onMoveUpdate.call(this);
        };
        Blob.prototype.onOverlapUpdate = function () {
            if (!Game.SceneFreezer.stoped) {
                this.contactsSolids = null; //this.boxSolid.collide(SceneMap.instance.boxesTiles, null, true, 0, true, Engine.Box.LAYER_ALL);
                this.checkGroundContacts();
                this.contactsSpikes = this.boxSolid.collide(Game.Spike.boxes, null, true, 0, true, Engine.Box.LAYER_ALL);
            }
        };
        Blob.prototype.checkGroundContacts = function () {
            this.contactsGround = this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, false, this.sprite.yMirror ? -1 : 1, false, Engine.Box.LAYER_ALL);
        };
        Blob.prototype.onSetFrame = function (_animator, _animation, _frame) {
            if (this.machine.currentState != this.stateDead && this.machine.currentState != this.stateWaitingForSummon && this.machine.currentState != this.stateSummoned) {
                FRAMES_BLOB[_animation.indexArray[_animator.indexFrame] + this.emotion * SPRITE_COUNT + this.color * OFFSET_COLOR].applyToSprite(this.sprite);
            }
            else {
                _frame.applyToSprite(this.sprite);
            }
        };
        Blob.prototype.drawBlob = function () {
            this.sprite.y -= this.sprite.yMirror ? this.boxSolid.ySize : 0;
            this.sprite.render();
            this.sprite.y += this.sprite.yMirror ? this.boxSolid.ySize : 0;
            if (Engine.Box.debugRender) {
                this.boxSolid.render();
            }
        };
        Blob.prototype.setHappy = function () {
            this.emotion = Game.EMOTION_HAPPY;
        };
        Blob.prototype.setSad = function () {
            this.emotion = Game.EMOTION_SAD;
        };
        Blob.prototype.setVerySad = function () {
            this.emotion = Game.EMOTION_VERY_SAD;
        };
        Blob.prototype.onDrawObjectsFront = function () {
            _super.prototype.onDrawObjectsFront.call(this);
        };
        Blob.prototype.onClearScene = function () {
            Blob.blobBoxes = [];
        };
        Blob.blobBoxes = [];
        return Blob;
    }(Game.Arcade.WorldEntity));
    Game.Blob = Blob;
})(Game || (Game = {}));
/*
namespace Game{
    //var VEL_MOVE = 1.3;
    

    //DOWN CONTROL TO UNSTUCK

    

    export class Blob extends Arcade.Platformer.BaseMachineEntity{
        

        protected imDead(){
            return this.boxSolid.y + this.boxSolid.ySize * 0.5 > SceneMap.instance.ySizeMap || this.contactsSpikes != null || this.contactsTiles != null;
        }

        

    

        


        

        

        protected onTimeUpdate(){
            super.onTimeUpdate();
        }

        

        
    }
}
*/ 
///<reference path="Blob.ts"/>
var Game;
(function (Game) {
    var GoalBlob = /** @class */ (function (_super) {
        __extends(GoalBlob, _super);
        function GoalBlob() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        GoalBlob.prototype.drawBlob = function () {
            this.sprite.xMirror = Game.Player.instance.boxSolid.x <= this.boxSolid.x;
            _super.prototype.drawBlob.call(this);
        };
        return GoalBlob;
    }(Game.Blob));
    Game.GoalBlob = GoalBlob;
})(Game || (Game = {}));
///<reference path = "../../Game/Arcade/WorldEntity.ts"/>
var Game;
(function (Game) {
    var FRAMES_AIR_HORIZONTAL;
    //var FRAMES_HORIZONTAL : Array<Utils.AnimationFrame>;
    //var FRAMES_VERTICAL : Array<Utils.AnimationFrame>;
    var ANIM_STAND;
    var ANIM_SHOOT;
    Game.addAction("configure", function () {
        FRAMES_AIR_HORIZONTAL = Game.FrameSelector.complex("cannon air horizontal", Game.Resources.textureGumRem, 411, 963);
        ANIM_STAND = new Utils.Animation("stand", false, FRAMES_AIR_HORIZONTAL, 1, [0], null);
        ANIM_SHOOT = new Utils.Animation("shoot", false, FRAMES_AIR_HORIZONTAL, 2, [1, 2, 2, 2, 3, 3, 4, 5, 5, 6, 7, 0], null);
    });
    var Cannon = /** @class */ (function (_super) {
        __extends(Cannon, _super);
        function Cannon(def) {
            var _this = _super.call(this, def) || this;
            _this.currentBall = 0;
            Game.SceneMap.instance.boxesEnemies.push(_this.boxSolid);
            _this.xScaleForceWorld = 0;
            _this.yScaleForceWorld = 0;
            _this.xCanMove = false;
            _this.yCanMove = false;
            _this.vertical = _this.getProperty("vertical");
            _this.fullRedBall = _this.getProperty("full red ball");
            _this.redSmoke = _this.getProperty("red smoke");
            _this.waitStepsStart = _this.getProperty("wait steps start");
            _this.waitSteps = _this.getProperty("wait steps");
            _this.grounded = _this.getProperty("grounded");
            _this.ballSpeed = _this.getProperty("ball speed");
            _this.stateWait = new Game.Flow.State(_this, "wait");
            _this.stateShooting = new Game.Flow.State(_this, "shooting");
            _this.balls = [];
            for (var ballIndex = 0; ballIndex < 10; ballIndex += 1) {
                _this.balls.push(new Game.CannonBall(_this));
            }
            _this.explo = new Game.ExploCannon(_this);
            if (_this.grounded) {
            }
            else {
                if (_this.vertical) {
                }
                else {
                    _this.xAlign = "start";
                    _this.yAlign = "middle";
                    _this.frames = FRAMES_AIR_HORIZONTAL;
                    _this.xOffsetShoot = 22 * (_this.def.flip.x ? -1 : 1);
                    _this.yOffsetShoot = 0;
                    _this.xOffsetShoot2 = 26 * (_this.def.flip.x ? -1 : 1);
                    _this.yOffsetShoot2 = 0;
                }
            }
            _this.stateWait.onEnter = function () {
                _this.animator.setAnimation(ANIM_STAND);
                _this.countWaitSteps = _this.machine.oldState == null ? _this.waitStepsStart : _this.waitSteps;
            };
            _this.stateWait.onStepUpdate = function () {
                _this.countWaitSteps -= 1;
            };
            _this.stateWait.addLink(_this.stateShooting, function () {
                return _this.countWaitSteps <= 0 && _this.animator.indexFrame == 0;
            });
            _this.stateShooting.onEnter = function () {
                _this.animator.setAnimation(ANIM_SHOOT);
                _this.hasShoot = false;
            };
            _this.stateShooting.onStepUpdate = function () {
                if (!_this.hasShoot && _this.animator.indexFrame == 4) {
                    _this.balls[_this.currentBall].active();
                    _this.currentBall += 1;
                    if (_this.currentBall == _this.balls.length) {
                        _this.currentBall = 0;
                    }
                    _this.explo.active();
                    Game.Resources.sfxGumRemCannon.play();
                    _this.hasShoot = true;
                }
            };
            _this.stateShooting.addLink(_this.stateWait, function () {
                return _this.animator.ended;
            });
            _this.machine.startState = _this.stateWait;
            return _this;
        }
        Cannon.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.currentBall = 0;
            this.boxSolid.xMirror = this.def.flip.x;
            this.boxSolid.yMirror = this.def.flip.y;
        };
        Cannon.prototype.onStart = function () {
            /*
            var checkDir = 0;
            if(this.vertical){
                checkDir = this.sprite.xMirror ? -1 : 1;
            }
            else{
                checkDir = this.sprite.yMirror ? -1 : 1;
            }
            var contacts = this.boxSolid.collide(SceneMap.instance.boxesTiles, null, this.vertical, checkDir, false, Engine.Box.LAYER_ALL);
            if(contacts != null){
                for(var contact of contacts){
                    if(contact.other.data instanceof Arcade.Platformer.Platform){
                        (contact.other.data as Arcade.Platformer.Platform).addChild(this);
                        break;
                    }
                }
            }
            */
        };
        Cannon.prototype.xMoveOnPlatform = function (dist) {
            this.boxSolid.x += dist;
        };
        Cannon.prototype.yMoveOnPlatform = function (dist) {
            this.boxSolid.y += dist;
        };
        Cannon.prototype.onPlatformOverlapX = function () {
        };
        Cannon.prototype.onPlatformOverlapY = function () {
        };
        Cannon.prototype.onSetFrame = function (_animator, _animation, _frame) {
            this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToSprite(this.sprite);
            this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToBox(this.boxSolid);
        };
        Cannon.prototype.onDrawObjectsBack = function () {
            for (var _i = 0, _a = this.balls; _i < _a.length; _i++) {
                var ball = _a[_i];
                ball.draw();
            }
            if (this.platformParent != null) {
                this.sprite.x += this.platformParent.xGetVelMove() * Engine.System.deltaTime;
                this.sprite.y += this.platformParent.yGetVelMove() * Engine.System.deltaTime;
            }
            this.sprite.render();
            this.boxSolid.render();
        };
        return Cannon;
    }(Game.Arcade.WorldEntity));
    Game.Cannon = Cannon;
})(Game || (Game = {}));
///<reference path = "../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var STATE_INACTIVE = 0;
    var STATE_MOVING = 1;
    var STATE_WALL = 2;
    var FRAMES_AIR_HORIZONTAL_WHITE;
    var ANIM_INACTIVE;
    var ANIM_MOVING;
    var ANIM_WALL;
    Game.addAction("configure", function () {
        FRAMES_AIR_HORIZONTAL_WHITE = Game.FrameSelector.complex("cannon air horizontal", Game.Resources.textureGumRem, 366, 804);
        ANIM_INACTIVE = new Utils.Animation("inactive", false, FRAMES_AIR_HORIZONTAL_WHITE, 2, [11, 11], null);
        ANIM_MOVING = new Utils.Animation("active", true, FRAMES_AIR_HORIZONTAL_WHITE, 4, [1, 2, 3, 2], null);
        ANIM_WALL = new Utils.Animation("active", false, FRAMES_AIR_HORIZONTAL_WHITE, 2, [4, 5, 6, 7, 8, 9, 10, 11, 11], null);
    });
    var CannonBall = /** @class */ (function (_super) {
        __extends(CannonBall, _super);
        function CannonBall(cannon) {
            var _this = _super.call(this) || this;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.animator = new Utils.Animator();
            _this.animator.owner = _this;
            _this.animator.listener = _this;
            _this.cannon = cannon;
            _this.boxSolid = new Engine.Box();
            _this.boxSolid.enabled = true;
            _this.boxSolid.renderable = true;
            _this.boxOverlap = new Engine.Box();
            _this.boxOverlap.enabled = false;
            _this.boxOverlap.renderable = true;
            Game.SceneMap.instance.boxesEnemies.push(_this.boxOverlap);
            if (_this.cannon.grounded) {
            }
            else {
                if (_this.cannon.vertical) {
                }
                else {
                    if (_this.cannon.fullRedBall) {
                    }
                    else {
                        _this.whiteTail = true;
                        _this.frames = FRAMES_AIR_HORIZONTAL_WHITE;
                    }
                }
            }
            _this.frames[0].applyToBox(_this.boxSolid);
            return _this;
        }
        CannonBall.prototype.onReset = function () {
            this.sprite.xMirror = this.boxSolid.xMirror = this.cannon.sprite.xMirror;
            this.sprite.yMirror = this.boxSolid.yMirror = this.cannon.sprite.yMirror;
            this.boxOverlap.enabled = false;
            this.state = STATE_INACTIVE;
            this.animator.setAnimation(ANIM_INACTIVE);
        };
        CannonBall.prototype.xDist = function () {
            if (this.cannon.vertical) {
                return 0;
            }
            return this.cannon.ballSpeed * (this.cannon.sprite.xMirror ? -1 : 1);
        };
        CannonBall.prototype.yDist = function () {
            if (!this.cannon.vertical) {
                return 0;
            }
            return this.cannon.ballSpeed * (this.cannon.sprite.yMirror ? -1 : 1);
        };
        CannonBall.prototype.onMoveUpdate = function () {
            if (this.state == STATE_MOVING) {
                if (this.cannon.vertical) {
                }
                else {
                    var contacts = this.boxSolid.cast(Game.SceneMap.instance.boxesSolids, null, true, this.xDist(), true, Engine.Box.LAYER_ALL);
                    this.boxSolid.translate(contacts, true, this.xDist(), true);
                    this.boxOverlap.x = this.boxSolid.x;
                    this.boxOverlap.y = this.boxSolid.y;
                    if (contacts != null) {
                        this.state = STATE_WALL;
                        this.animator.setAnimation(ANIM_WALL);
                        Game.Resources.sfxGumRemBallOnWall.play();
                    }
                }
            }
        };
        CannonBall.prototype.onStepUpdate = function () {
            switch (this.state) {
                case STATE_INACTIVE:
                    break;
                case STATE_MOVING:
                    break;
                case STATE_WALL:
                    break;
            }
        };
        CannonBall.prototype.active = function () {
            this.state = STATE_MOVING;
            this.boxOverlap.enabled = true;
            this.boxSolid.x = this.boxOverlap.x = this.cannon.boxSolid.x + this.cannon.xOffsetShoot2;
            this.boxSolid.y = this.boxOverlap.y = this.cannon.boxSolid.y + this.cannon.yOffsetShoot2;
            this.animator.setAnimation(ANIM_MOVING);
        };
        CannonBall.prototype.onSetFrame = function (_animator, _animation, _frame) {
            this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToSprite(this.sprite);
            this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToBox(this.boxOverlap);
        };
        CannonBall.prototype.draw = function () {
            if (this.state == STATE_INACTIVE) {
                return;
            }
            var xDraw = 0;
            var yDraw = 0;
            if (this.state == STATE_MOVING) {
                var point = this.boxSolid.getExtrapolation(Game.SceneMap.instance.boxesSolids, this.xDist(), this.yDist(), true, Engine.Box.LAYER_ALL);
                xDraw = point.x;
                yDraw = point.y;
            }
            else {
                xDraw = this.boxSolid.x;
                yDraw = this.boxSolid.y;
            }
            this.sprite.x = this.boxSolid.x = this.boxOverlap.x = xDraw;
            this.sprite.y = this.boxSolid.y = this.boxOverlap.y = yDraw;
            this.sprite.render();
            this.boxSolid.render();
            this.boxOverlap.render();
        };
        return CannonBall;
    }(Engine.Entity));
    Game.CannonBall = CannonBall;
})(Game || (Game = {}));
///<reference path = "../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var FRAMES_AIR_HORIZONTAL_WHITE;
    var ANIM_INACTIVE;
    var ANIM_ACTIVE;
    Game.addAction("configure", function () {
        FRAMES_AIR_HORIZONTAL_WHITE = Game.FrameSelector.complex("cannon air horizontal", Game.Resources.textureGumRem, 621, 539);
        ANIM_INACTIVE = new Utils.Animation("inactive", false, FRAMES_AIR_HORIZONTAL_WHITE, 2, [9, 9], null);
        ANIM_ACTIVE = new Utils.Animation("active", false, FRAMES_AIR_HORIZONTAL_WHITE, 2, [1, 3, 4, 5, 6, 7, 8, 9, 9], null);
    });
    var ExploCannon = /** @class */ (function (_super) {
        __extends(ExploCannon, _super);
        function ExploCannon(cannon) {
            var _this = _super.call(this) || this;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.animator = new Utils.Animator();
            _this.animator.owner = _this;
            _this.animator.listener = _this;
            _this.cannon = cannon;
            _this.boxSolid = new Engine.Box();
            _this.boxSolid.enabled = false;
            _this.boxSolid.renderable = true;
            if (_this.cannon.grounded) {
            }
            else {
                if (_this.cannon.vertical) {
                }
                else {
                    if (_this.cannon.redSmoke) {
                    }
                    else {
                        _this.white = true;
                        _this.frames = FRAMES_AIR_HORIZONTAL_WHITE;
                    }
                }
            }
            return _this;
        }
        ExploCannon.prototype.onReset = function () {
            this.sprite.xMirror = this.boxSolid.xMirror = this.cannon.sprite.xMirror;
            this.sprite.yMirror = this.boxSolid.yMirror = this.cannon.sprite.yMirror;
            this.boxSolid.x = this.cannon.boxSolid.x + this.cannon.xOffsetShoot;
            this.boxSolid.y = this.cannon.boxSolid.y + this.cannon.yOffsetShoot;
            this.boxSolid.enabled = false;
            this.animator.setAnimation(ANIM_INACTIVE);
        };
        ExploCannon.prototype.active = function () {
            this.boxSolid.enabled = !this.white;
            this.animator.setAnimation(ANIM_ACTIVE);
        };
        ExploCannon.prototype.onSetFrame = function (_animator, _animation, _frame) {
            this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToSprite(this.sprite);
            this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToBox(this.boxSolid);
        };
        ExploCannon.prototype.onDrawObjectsBack = function () {
            if (this.animator.ended) {
                return;
            }
            this.sprite.x = this.cannon.sprite.x + this.cannon.xOffsetShoot;
            this.sprite.y = this.cannon.sprite.y + this.cannon.yOffsetShoot;
            this.sprite.render();
            this.boxSolid.render();
        };
        return ExploCannon;
    }(Engine.Entity));
    Game.ExploCannon = ExploCannon;
})(Game || (Game = {}));
///<reference path = "../../Game/Utils/Emission/SimpleParticle.ts"/>
var Game;
(function (Game) {
    var SPEED = 2.0;
    var VEL_SCALE = 1.0;
    var SPRITE_COUNT = 7;
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("dead particles", Game.Resources.textureGumRem, 251, 59);
    });
    var DeadParticle = /** @class */ (function (_super) {
        __extends(DeadParticle, _super);
        function DeadParticle(emitter, color) {
            var _this = _super.call(this, emitter) || this;
            _this.countSteps = 0;
            _this.color = 0;
            _this.parentRelative = false;
            _this.color = color;
            return _this;
        }
        Object.defineProperty(DeadParticle.prototype, "xRange", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DeadParticle.prototype, "yRange", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DeadParticle.prototype, "xRangeVel", {
            get: function () {
                switch (this.index) {
                    case 0: return 0 * SPEED * VEL_SCALE;
                    case 1: return 0.85090352453 * SPEED * VEL_SCALE;
                    case 2: return 1 * SPEED * VEL_SCALE;
                    case 3: return 0.85090352453 * SPEED * VEL_SCALE;
                    case 4: return 0 * SPEED * VEL_SCALE;
                    case 5: return -0.85090352453 * SPEED * VEL_SCALE;
                    case 6: return -1 * SPEED * VEL_SCALE;
                    default: return -0.85090352453 * SPEED * VEL_SCALE;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DeadParticle.prototype, "yRangeVel", {
            get: function () {
                switch (this.index) {
                    case 0: return 1 * SPEED * VEL_SCALE;
                    case 1: return 0.85090352453 * SPEED * VEL_SCALE;
                    case 2: return 0 * SPEED * VEL_SCALE;
                    case 3: return -0.85090352453 * SPEED * VEL_SCALE;
                    case 4: return -1 * SPEED * VEL_SCALE;
                    case 5: return -0.85090352453 * SPEED * VEL_SCALE;
                    case 6: return 0 * SPEED * VEL_SCALE;
                    default: return 0.85090352453 * SPEED * VEL_SCALE;
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DeadParticle.prototype, "xRangeAccel", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DeadParticle.prototype, "yRangeAccel", {
            get: function () {
                return 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(DeadParticle.prototype, "rangeLife", {
            get: function () {
                return 300;
            },
            enumerable: false,
            configurable: true
        });
        DeadParticle.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.countSteps = 0;
        };
        DeadParticle.prototype.emitt = function (index) {
            _super.prototype.emitt.call(this, index);
            FRAMES[0 + this.color * SPRITE_COUNT].applyToSprite(this.sprite);
        };
        DeadParticle.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (this.enabled && !Game.SceneFreezer.stoped) {
                if (this.countSteps == DeadParticle.STEPS) {
                    FRAMES[1 + this.color * SPRITE_COUNT].applyToSprite(this.sprite);
                }
                else if (this.countSteps == DeadParticle.STEPS * 2) {
                    FRAMES[2 + this.color * SPRITE_COUNT].applyToSprite(this.sprite);
                }
                else if (this.countSteps == DeadParticle.STEPS * 3) {
                    FRAMES[3 + this.color * SPRITE_COUNT].applyToSprite(this.sprite);
                }
                else if (this.countSteps == DeadParticle.STEPS * 4) {
                    FRAMES[4 + this.color * SPRITE_COUNT].applyToSprite(this.sprite);
                }
                else if (this.countSteps == DeadParticle.STEPS * 5) {
                    FRAMES[5 + this.color * SPRITE_COUNT].applyToSprite(this.sprite);
                }
                else if (this.countSteps == DeadParticle.STEPS * 6) {
                    FRAMES[6 + this.color * SPRITE_COUNT].applyToSprite(this.sprite);
                }
                else if (this.countSteps == DeadParticle.STEPS * 7) {
                    FRAMES[7 + this.color * SPRITE_COUNT].applyToSprite(this.sprite);
                    this.sprite.enabled = false;
                }
                this.countSteps += 1;
            }
        };
        DeadParticle.STEPS = 2;
        return DeadParticle;
    }(Game.Emission.SimpleParticle));
    Game.DeadParticle = DeadParticle;
    var DeadParticlePlayer = /** @class */ (function (_super) {
        __extends(DeadParticlePlayer, _super);
        function DeadParticlePlayer(emitter) {
            return _super.call(this, emitter, 0) || this;
        }
        DeadParticlePlayer.prototype.onDrawParticles = function () {
        };
        DeadParticlePlayer.prototype.onDrawParticlesBack = function () {
        };
        DeadParticlePlayer.prototype.onDrawParticlesFrontUnpaused = function () {
            if (!Game.SceneFreezer.stoped) {
                this.sprite.render();
            }
        };
        DeadParticlePlayer.prototype.onDrawParticlesFrontPaused = function () {
            if (Game.SceneFreezer.stoped) {
                this.sprite.render();
            }
        };
        return DeadParticlePlayer;
    }(DeadParticle));
    Game.DeadParticlePlayer = DeadParticlePlayer;
    var DeadParticleEnemy = /** @class */ (function (_super) {
        __extends(DeadParticleEnemy, _super);
        function DeadParticleEnemy(emitter) {
            return _super.call(this, emitter, 1) || this;
        }
        return DeadParticleEnemy;
    }(DeadParticle));
    Game.DeadParticleEnemy = DeadParticleEnemy;
})(Game || (Game = {}));
///<reference path="Blob.ts"/>
var Game;
(function (Game) {
    var enemies = [];
    var EnemyBase = /** @class */ (function (_super) {
        __extends(EnemyBase, _super);
        function EnemyBase(def, color) {
            var _this = _super.call(this, def, color) || this;
            _this.flipOnAbyss = true;
            _this.verysad = false;
            _this.flipOnAbyss = !_this.getProperty("can fall");
            _this.boxSolid.data = _this;
            Game.SceneMap.instance.boxesEnemies.push(_this.boxSolid);
            _this.boxPatrol = new Engine.Box();
            _this.boxPatrol.enabled = true;
            _this.boxPatrol.renderable = true;
            _this.boxPatrol.xSize = 1;
            _this.boxPatrol.ySize = 1;
            _this.boxPatrol.green = 0;
            _this.boxPatrol.blue = 1;
            enemies.push(_this);
            return _this;
        }
        EnemyBase.prototype.fixBoxPatrolPosition = function () {
            this.boxPatrol.x = this.boxSolid.x;
            if (this.sprite.yMirror) {
                this.boxPatrol.y = this.boxSolid.y - this.boxSolid.ySize - 1;
            }
            else {
                this.boxPatrol.y = this.boxSolid.y;
            }
            if (this.xVel > 0) {
                this.boxPatrol.x += this.boxSolid.xSize * 0.15;
            }
            else {
                this.boxPatrol.x -= (this.boxSolid.xSize * 0.15 + 1);
            }
        };
        EnemyBase.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.verysad = false;
        };
        EnemyBase.prototype.getMoveDirection = function () {
            if (Game.Player.instance.winning || Game.Player.instance.losing) {
                return 0;
            }
            return this.xVelMove == 0 ? 0 : (this.sprite.xMirror ? -1 : 1);
        };
        EnemyBase.prototype.onMoveUpdate = function () {
            _super.prototype.onMoveUpdate.call(this);
            if (!Game.SceneFreezer.stoped && this.getMoveDirection() != 0) {
                var flip = false;
                if ((this.xDirContact > 0 && this.getMoveDirection() > 0) || (this.xDirContact < 0 && this.getMoveDirection() < 0)) {
                    flip = true;
                }
                if (this.flipOnAbyss) {
                    this.fixBoxPatrolPosition();
                    if (this.onGround() && this.boxPatrol.collide(Game.SceneMap.instance.boxesSolids, null, true, 0, true, Engine.Box.LAYER_ALL) == null) {
                        flip = true;
                    }
                }
                if (flip) {
                    this.sprite.xMirror = !this.sprite.xMirror;
                }
            }
        };
        EnemyBase.prototype.onBlobDead = function () {
        };
        EnemyBase.onPlayerDead = function () {
            for (var _i = 0, enemies_1 = enemies; _i < enemies_1.length; _i++) {
                var enemy = enemies_1[_i];
                if (enemy.color == 2) {
                    enemy.setVerySad();
                }
                else {
                    enemy.setHappy();
                }
            }
        };
        EnemyBase.onPlayerWon = function () {
            for (var _i = 0, enemies_2 = enemies; _i < enemies_2.length; _i++) {
                var enemy = enemies_2[_i];
                enemy.setVerySad();
            }
        };
        EnemyBase.prototype.onDrawObjects = function () {
            this.drawBlob();
        };
        EnemyBase.prototype.onClearScene = function () {
            enemies = [];
        };
        EnemyBase.prototype.onDrawObjectsFrontUnpaused = function () {
            if (this.boxPatrol.enabled && this.boxPatrol.renderable) {
                this.fixBoxPatrolPosition();
                this.boxPatrol.render();
            }
        };
        return EnemyBase;
    }(Game.Blob));
    Game.EnemyBase = EnemyBase;
    var EnemyFemale = /** @class */ (function (_super) {
        __extends(EnemyFemale, _super);
        function EnemyFemale(def) {
            return _super.call(this, def, 3) || this;
        }
        return EnemyFemale;
    }(EnemyBase));
    Game.EnemyFemale = EnemyFemale;
    var EnemyMale = /** @class */ (function (_super) {
        __extends(EnemyMale, _super);
        function EnemyMale(def) {
            return _super.call(this, def, 2) || this;
        }
        return EnemyMale;
    }(EnemyBase));
    Game.EnemyMale = EnemyMale;
})(Game || (Game = {}));
///<reference path = "../../Game/System/Entity.ts"/>
var Game;
(function (Game) {
    var STATE_SMALL = 0;
    var STATE_GROWING = 1;
    var STATE_BIG = 2;
    var STATE_SHRINKING = 3;
    var FRAMES_HORIZONTAL;
    var FRAMES_VERTICAL;
    var ANIM_SMALL;
    var ANIM_GROWING;
    var ANIM_BIG;
    var ANIM_SHRINKING;
    Game.addAction("configure", function () {
        FRAMES_HORIZONTAL = Game.FrameSelector.complex("fire horizontal", Game.Resources.textureGumRem, 411, 882);
        FRAMES_VERTICAL = Game.FrameSelector.complex("fire vertical", Game.Resources.textureGumRem, 657, 882);
        ANIM_SMALL = new Utils.Animation("small", true, FRAMES_HORIZONTAL, 4, [0, 1, 2, 3, 2, 1], null);
        ANIM_GROWING = new Utils.Animation("growing", false, FRAMES_HORIZONTAL, 2, [2, 3, 4, 5, 6, 8, 9, 10], null);
        ANIM_BIG = new Utils.Animation("big", true, FRAMES_HORIZONTAL, 3, [11, 12, 13, 14], null);
        ANIM_SHRINKING = new Utils.Animation("shrinking", false, FRAMES_HORIZONTAL, 2, [10, 9, 8, 6, 5, 4, 3, 2], null);
    });
    var FirePillar = /** @class */ (function (_super) {
        __extends(FirePillar, _super);
        function FirePillar(def) {
            var _this = _super.call(this, def) || this;
            _this.startBig = _this.getProperty("start big");
            _this.stepsStart = _this.getProperty("steps start");
            _this.stepsBig = _this.getProperty("steps big");
            _this.stepsSmall = _this.getProperty("steps small");
            _this.vertical = _this.getProperty("vertical");
            if (_this.vertical) {
                def.instance.y -= Game.SceneMap.instance.xSizeTile * 0.5;
                _this.frames = FRAMES_VERTICAL;
                if (def.flip.x) {
                    def.instance.x += -7;
                }
                else {
                    def.instance.x += 7 + Game.SceneMap.instance.xSizeTile;
                }
            }
            else {
                def.instance.x += Game.SceneMap.instance.xSizeTile * 0.5;
                _this.frames = FRAMES_HORIZONTAL;
                if (def.flip.y) {
                    def.instance.y += -7 - Game.SceneMap.instance.ySizeTile;
                }
                else {
                    def.instance.y += 7;
                }
            }
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.sprite.x = def.instance.x;
            _this.sprite.y = def.instance.y;
            _this.sprite.xMirror = _this.def.flip.x;
            _this.sprite.yMirror = _this.def.flip.y;
            _this.xArea = _this.getProperty("area x");
            _this.yArea = _this.getProperty("area y");
            if (_this.xArea + _this.yArea > 0) {
                _this.box = new Engine.Box();
                _this.box.enabled = false;
                _this.box.renderable = true;
                _this.box.x = def.instance.x;
                _this.box.y = def.instance.y;
                _this.box.xMirror = _this.def.flip.x;
                _this.box.yMirror = _this.def.flip.y;
                _this.frames[0].applyToBox(_this.box);
                Game.SceneMap.instance.boxesEnemies.push(_this.box);
                if (_this.xArea > 0) {
                    _this.xArea--;
                }
                else if (_this.yArea > 0) {
                    _this.yArea--;
                }
            }
            _this.animator = new Utils.Animator();
            _this.animator.owner = _this;
            _this.animator.listener = _this;
            return _this;
        }
        FirePillar.prototype.onReset = function () {
            if (this.startBig) {
                this.setBig(this.stepsStart);
            }
            else {
                this.setSmall(this.stepsStart);
            }
        };
        FirePillar.prototype.setBig = function (steps) {
            this.state = STATE_BIG;
            this.animator.setAnimation(ANIM_BIG);
            this.countSteps = steps;
        };
        FirePillar.prototype.setSmall = function (steps) {
            this.state = STATE_SMALL;
            this.animator.setAnimation(ANIM_SMALL);
            this.countSteps = steps;
        };
        FirePillar.prototype.onStepUpdate = function () {
            switch (this.state) {
                case STATE_SMALL:
                    if (this.countSteps == 0) {
                        this.animator.setAnimation(ANIM_GROWING);
                        Game.Resources.sfxGumRemFire.play();
                        this.state = STATE_GROWING;
                    }
                    else {
                        this.countSteps -= 1;
                    }
                    break;
                case STATE_GROWING:
                    if (this.animator.ended) {
                        this.setBig(this.stepsBig);
                    }
                    break;
                case STATE_BIG:
                    if (this.countSteps == 0) {
                        this.animator.setAnimation(ANIM_SHRINKING);
                        this.state = STATE_SHRINKING;
                    }
                    else {
                        this.countSteps -= 1;
                    }
                    break;
                case STATE_SHRINKING:
                    if (this.animator.ended) {
                        this.setSmall(this.stepsSmall);
                    }
                    break;
            }
        };
        FirePillar.prototype.onSetFrame = function (_animator, _animation, _frame) {
            this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToSprite(this.sprite);
            if (this.box != null) {
                this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToBoxEx(this.box);
                if (this.xArea > 0) {
                    this.box.xSize += Game.SceneMap.instance.xSizeTile * this.xArea;
                }
                else if (this.yArea > 0) {
                    this.box.ySize += Game.SceneMap.instance.ySizeTile * this.yArea;
                }
            }
        };
        FirePillar.prototype.onDrawObjectsBack = function () {
            this.sprite.render();
        };
        FirePillar.prototype.onDrawBoxes = function () {
            if (this.box != null && this.box.enabled) {
                this.box.render();
            }
        };
        return FirePillar;
    }(Game.Entity));
    Game.FirePillar = FirePillar;
})(Game || (Game = {}));
///<reference path = "../../Game/Arcade/WorldEntity.ts"/>
var Game;
(function (Game) {
    var FRAMES_RED;
    var FRAMES_WHITE;
    Game.addAction("configure", function () {
        FRAMES_RED = Game.FrameSelector.complex("ghost red", Game.Resources.textureGumRem, 540, 926);
        FRAMES_WHITE = Game.FrameSelector.complex("ghost white", Game.Resources.textureGumRem, 669, 926);
    });
    var Ghost = /** @class */ (function (_super) {
        __extends(Ghost, _super);
        function Ghost(def) {
            var _this = _super.call(this, def) || this;
            _this.sprite = new Engine.Sprite();
            Game.SceneMap.instance.boxesEnemies.push(_this.boxSolid);
            _this.sprite.enabled = true;
            _this.xStart = def.instance.x;
            _this.xStart += Game.SceneMap.instance.xSizeTile * 0.5;
            _this.areaMove = _this.getProperty("area move") * Game.SceneMap.instance.xSizeTile;
            _this.stepsMove = _this.getProperty("steps move");
            _this.stepsMoveStart = _this.getProperty("steps move start");
            _this.frames = _this.getProperty("red head") ? FRAMES_RED : FRAMES_WHITE;
            _this.anim = new Utils.Animation("ghost", true, FRAMES_RED, _this.getProperty("speed anim"), [0, 1, 2, 3, 4, 3, 2, 1], null);
            _this.yAlign = "middle";
            return _this;
        }
        Ghost.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.yScaleForceWorld = 0;
            this.countStepsMove = this.stepsMoveStart;
            this.boxSolid.x = this.findPosition(this.countStepsMove);
            this.sprite.x = this.boxSolid.x;
            this.animator.setAnimation(this.anim);
        };
        Ghost.prototype.findPosition = function (countSteps) {
            var moveValue = countSteps / this.stepsMove;
            moveValue *= 2 * Math.PI;
            moveValue = (1 + Math.sin(moveValue - Math.PI * 0.5)) * 0.5 * this.areaMove;
            return this.xStart + moveValue;
        };
        Ghost.prototype.onMoveUpdate = function () {
            _super.prototype.onMoveUpdate.call(this);
            if (!Game.SceneFreezer.stoped) {
                this.countStepsMove += 1;
                if (this.countStepsMove > this.stepsMove) {
                    this.countStepsMove = 0;
                }
                this.sprite.xMirror = this.countStepsMove >= this.stepsMove * 0.5;
                if (this.areaMove < 0) {
                    this.sprite.xMirror = !this.sprite.xMirror;
                }
            }
            this.boxSolid.x = this.findPosition(this.countStepsMove);
        };
        Ghost.prototype.onTimeUpdate = function () {
            _super.prototype.onTimeUpdate.call(this);
            var extrapolation = 0;
            if (!Game.SceneFreezer.stoped) {
                extrapolation = Engine.System.stepExtrapolation * (this.countStepsMove == this.stepsMove ? -1 : 1);
            }
            this.sprite.x = this.findPosition(this.countStepsMove + extrapolation);
        };
        Ghost.prototype.onSetFrame = function (_animator, _animation, _frame) {
            this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToSprite(this.sprite);
            this.frames[this.animator.animation.indexArray[this.animator.indexFrame]].applyToBox(this.boxSolid);
        };
        Ghost.prototype.onDrawObjectsBack = function () {
            this.sprite.render();
            this.boxSolid.render();
        };
        return Ghost;
    }(Game.Arcade.WorldEntity));
    Game.Ghost = Ghost;
})(Game || (Game = {}));
///<reference path="../../Game/System/Entity.ts"/>
var Game;
(function (Game) {
    var GhostBlock = /** @class */ (function (_super) {
        __extends(GhostBlock, _super);
        function GhostBlock(def) {
            var _this = _super.call(this, def) || this;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.sprite.x = _this.def.instance.x;
            _this.sprite.y = _this.def.instance.y - Game.SceneMap.instance.ySizeTile;
            var xArea = _this.getProperty("area x");
            var yArea = _this.getProperty("area y");
            if (xArea + yArea > 0) {
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.x = _this.sprite.x;
                _this.box.y = _this.sprite.y;
                _this.box.xSize = 16;
                _this.box.ySize = 16;
                if (xArea > 1) {
                    xArea--;
                    _this.box.xSize += Game.SceneMap.instance.xSizeTile * xArea;
                }
                else if (yArea > 1) {
                    yArea--;
                    _this.box.ySize += Game.SceneMap.instance.ySizeTile * yArea;
                }
                Game.SceneMap.instance.boxesSolids.push(_this.box);
            }
            _this.variant = _this.getProperty("variant");
            return _this;
        }
        GhostBlock.prototype.onReset = function () {
            this.setOn(this.getProperty("on"));
        };
        GhostBlock.prototype.setOn = function (on) {
            this.on = on;
            if (this.box != null) {
                this.box.enabled = on;
            }
            this.sprite.setFull(true, false, Game.Resources.textureGumRem, 16, 16, 0, 0, 630 + 19 * (on ? 0 : 1), 79 + 19 * this.variant, 16, 16);
        };
        GhostBlock.prototype.isBoxEnabled = function () {
            return this.box.enabled;
        };
        GhostBlock.prototype.getXSizeBox = function () {
            return this.box.xSize;
        };
        GhostBlock.prototype.getYSizeBox = function () {
            return this.box.ySize;
        };
        GhostBlock.prototype.getXSizeBoxStart = function () {
            return this.box.xSize;
        };
        GhostBlock.prototype.getYSizeBoxStart = function () {
            return this.box.ySize;
        };
        GhostBlock.prototype.setXDraw = function (value) {
            this.sprite.x = value;
        };
        GhostBlock.prototype.setYDraw = function (value) {
            this.sprite.y = value;
        };
        GhostBlock.prototype.setXBox = function (value) {
            this.box.x = value;
        };
        GhostBlock.prototype.setYBox = function (value) {
            this.box.y = value;
        };
        GhostBlock.prototype.onGameSwitchChange = function () {
            if (this.variant == Game.Switch.getCurrentVariant()) {
                this.setOn(!this.on);
            }
        };
        GhostBlock.prototype.onDrawObjectsBack = function () {
            this.sprite.render();
        };
        GhostBlock.prototype.onDrawBoxes = function () {
            if (this.box != null) {
                this.box.render();
            }
        };
        return GhostBlock;
    }(Game.Entity));
    Game.GhostBlock = GhostBlock;
})(Game || (Game = {}));
///<reference path="../../Game/Arcade/Platformer/Simple/Goal.ts"/>
var Game;
(function (Game) {
    var Goal = /** @class */ (function (_super) {
        __extends(Goal, _super);
        function Goal(def) {
            var _this = _super.call(this, def) || this;
            _this.blob = new Game.GoalBlob(def, 1);
            _this.hearth = new Game.Hearth();
            return _this;
        }
        Goal.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.sprite.enabled = false;
            this.boxSolid.enabled = false;
            this.owned = false;
        };
        Goal.prototype.onOverlapUpdate = function () {
            _super.prototype.onOverlapUpdate.call(this);
            if (!this.owned && this.blob.boxSolid.collideAgainst(Game.Player.instance.boxSolid, null, false, 0, false, Engine.Box.LAYER_ALL) != null) {
                this.hearth.show(this.boxSolid.x - (this.boxSolid.x - Game.Player.instance.boxSolid.x) * 0.5, this.boxSolid.y, this.sprite.yMirror);
                this.owned = true;
            }
        };
        Goal.prototype.onDrawGoalUnpaused = function () {
            if (!Game.SceneFreezer.stoped) {
                this.blob.drawBlob();
                this.hearth.draw();
            }
        };
        Goal.prototype.onDrawGoalPaused = function () {
            if (Game.SceneFreezer.stoped) {
                this.blob.drawBlob();
                this.hearth.draw();
            }
        };
        Goal.prototype.yIsMirrored = function () {
            return this.sprite.yMirror;
        };
        return Goal;
    }(Game.Arcade.Platformer.Simple.Goal));
    Game.Goal = Goal;
})(Game || (Game = {}));
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var FRAMES;
    var ANIM_NONE;
    var ANIM_APPEAR;
    var ANIM_STAY;
    var ANIM_HIDE;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("hearth", Game.Resources.textureGumRem, 55, 86);
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
        Hearth.prototype.draw = function () {
            var blob = Game.Goal.instance.blob;
            this.sprite.x = blob.boxSolid.x - (blob.boxSolid.x - Game.Player.instance.boxSolid.x) * 0.5;
            this.sprite.y = blob.boxSolid.y - (blob.sprite.yMirror ? blob.boxSolid.ySize : 0) - 20 * (blob.sprite.yMirror ? -1 : 1);
            this.sprite.render();
        };
        return Hearth;
    }(Engine.Entity));
    Game.Hearth = Hearth;
})(Game || (Game = {}));
///<reference path="Blob.ts"/>
var Game;
(function (Game) {
    var DEFAULT_STEPS_WAIT_LOSSING = 40;
    var DEFAULT_STEPS_WAIT_WINNING = 60;
    var FRAMES_CONTROL_NORMAL;
    var FRAMES_CONTROL_UPSIDE_DOWN;
    Game.addAction("configure", function () {
        FRAMES_CONTROL_NORMAL = Game.FrameSelector.complex("player control normal a", Game.Resources.textureGumRem, 364, 177);
        FRAMES_CONTROL_UPSIDE_DOWN = Game.FrameSelector.complex("player control stuck a", Game.Resources.textureGumRem, 932, 285);
    });
    var Player = /** @class */ (function (_super) {
        __extends(Player, _super);
        function Player(def) {
            var _this = _super.call(this, def, 0) || this;
            _this.stepsWin = DEFAULT_STEPS_WAIT_WINNING;
            _this.stepsLoss = DEFAULT_STEPS_WAIT_LOSSING;
            _this._canWin = true;
            _this._canLoss = true;
            Player._instance = _this;
            _this.xVelMove = 1.3;
            _this.yVelJump = 6.5;
            _this.yVelFall = 3;
            _this.contactsEnemies = null;
            _this.controls = new Game.Interaction.Controls.Platformer.BasicJumperControls(FRAMES_CONTROL_NORMAL, 0.95);
            return _this;
        }
        Object.defineProperty(Player, "instance", {
            get: function () {
                return Player._instance;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "xRender", {
            get: function () {
                return this.xDraw;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "yRender", {
            get: function () {
                return this.yDraw - this.boxSolid.ySize * 0.5;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "winning", {
            get: function () {
                return this._winning;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "hasWon", {
            get: function () {
                return this._hasWon;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "losing", {
            get: function () {
                return this._losing;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "hasLost", {
            get: function () {
                return this._hasLost;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "canWin", {
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
        Object.defineProperty(Player.prototype, "canLoss", {
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
        Player.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.countStepsWin = 0;
            this._winning = false;
            this._hasWon = false;
            this.countStepsLoss = 0;
            this._losing = false;
            this._hasLost = false;
            this.fixUpsideDownControls();
        };
        Player.prototype.fixUpsideDownControls = function () {
            this.controls.frames = this.sprite.yMirror ? FRAMES_CONTROL_UPSIDE_DOWN : FRAMES_CONTROL_NORMAL;
            if (this.sprite.yMirror) {
                if (Game.IS_EDGE) {
                    this.controls.controlAction.keys = [Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.DOWN, "down", "Down", Engine.Keyboard.SPACE, "Space", "space", " "];
                }
                else {
                    this.controls.controlAction.keys = [Engine.Keyboard.W, Engine.Keyboard.S, Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.DOWN, "down", "Down", Engine.Keyboard.SPACE, "Space", "space", " "];
                }
            }
            else {
                if (Game.IS_EDGE) {
                    this.controls.controlAction.keys = [Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "Space", "space", " "];
                }
                else {
                    this.controls.controlAction.keys = [Engine.Keyboard.W, Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "Space", "space", " "];
                }
            }
        };
        Player.prototype.onStepUpdate = function () {
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
        Player.prototype.onGoal = function () {
            this.setHappy();
            Game.Goal.instance.blob.setHappy();
            Game.EnemyBase.onPlayerWon();
            Game.Resources.sfxGumRemWin.play();
        };
        Player.prototype.onWinning = function () {
        };
        Player.prototype.onWon = function () {
        };
        Player.prototype.onDeath = function () {
        };
        Player.prototype.onLosing = function () {
        };
        Player.prototype.onLost = function () {
        };
        Object.defineProperty(Player.prototype, "winCondition", {
            get: function () {
                return Game.Goal.instance.owned;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "lossCondition", {
            get: function () {
                return this.machine.currentState == this.stateDead;
            },
            enumerable: false,
            configurable: true
        });
        Player.prototype.getMoveDirection = function () {
            if (Game.Goal.instance.owned) {
                return 0;
            }
            return this.controls.downLeft ? -1 : (this.controls.downRight ? 1 : 0);
        };
        Player.prototype.needJump = function () {
            return this.controls.pressedDelayedAction && !this.winning;
        };
        Player.prototype.needFall = function () {
            return this.controls.pressedDelayedAction && !this.winning;
        };
        Player.prototype.onStateMoveStepUpdate = function () {
            _super.prototype.onStateMoveStepUpdate.call(this);
            if (this.animator.indexFrame == 1 && this.animator.countSteps == 1) {
                //Resources.sfxGumRemWalkB.play();
            }
            else if (this.animator.indexFrame == 3 && this.animator.countSteps == 1) {
                //Resources.sfxGumRemWalkA.play();
            }
        };
        Player.prototype.onStateJumpEnter = function () {
            _super.prototype.onStateJumpEnter.call(this);
            this.controls.consumeDelayedAction();
        };
        Player.prototype.onStateJumpReady = function () {
            _super.prototype.onStateJumpReady.call(this);
            Game.Resources.sfxGumRemJump.play();
        };
        Player.prototype.onStateFallEnter = function () {
            _super.prototype.onStateFallEnter.call(this);
            this.fixUpsideDownControls();
            if (this.machine.oldState != this.stateJump) {
                Game.Resources.sfxGumRemFall.play();
            }
            this.controls.consumeDelayedAction();
        };
        Player.prototype.onStateFallReady = function () {
            _super.prototype.onStateFallReady.call(this);
        };
        Player.prototype.onStateLandingEnter = function () {
            _super.prototype.onStateLandingEnter.call(this);
            this.fixUpsideDownControls();
        };
        Player.prototype.onStateLandingReady = function () {
            _super.prototype.onStateLandingReady.call(this);
            //Resources.sfxGumRemWalkB.play();
            //Resources.sfxGumRemGround.play();
        };
        Player.prototype.onStateDeadEnter = function () {
            _super.prototype.onStateDeadEnter.call(this);
            Game.Goal.instance.blob.setVerySad();
            Game.EnemyBase.onPlayerDead();
        };
        Player.prototype.onStateDeadReady = function () {
            _super.prototype.onStateDeadReady.call(this);
            Game.Resources.sfxGumRemDeath.play();
        };
        Player.prototype.onOverlapUpdate = function () {
            _super.prototype.onOverlapUpdate.call(this);
            if (!Game.SceneFreezer.stoped) {
                this.contactsEnemies = this.boxSolid.collide(Game.SceneMap.instance.boxesEnemies, null, true, 0, true, Engine.Box.LAYER_ALL);
            }
        };
        Player.prototype.isDead = function () {
            return _super.prototype.isDead.call(this) || this.contactsEnemies != null;
        };
        Player.prototype.onDrawPlayerUnpaused = function () {
            if (!Game.SceneFreezer.stoped) {
                this.drawBlob();
            }
        };
        Player.prototype.onDrawPlayerPaused = function () {
            if (Game.SceneFreezer.stoped) {
                this.drawBlob();
            }
        };
        Player.prototype.drawBlob = function () {
            if (Game.Goal.instance.owned) {
                this.sprite.xMirror = Game.Goal.instance.boxSolid.x < this.boxSolid.x;
            }
            _super.prototype.drawBlob.call(this);
        };
        return Player;
    }(Game.Blob));
    Game.Player = Player;
})(Game || (Game = {}));
///<reference path = "../../Game/System/Entity.ts"/>
var Game;
(function (Game) {
    var Spike = /** @class */ (function (_super) {
        __extends(Spike, _super);
        function Spike(def, frame, xOffset, yOffset) {
            var _this = _super.call(this, def) || this;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.sprite.x = def.instance.x + xOffset;
            _this.sprite.y = def.instance.y + yOffset;
            _this.sprite.xMirror = _this.def.flip.x;
            _this.sprite.yMirror = _this.def.flip.y;
            frame.applyToSprite(_this.sprite);
            var xArea = _this.getProperty("area x");
            var yArea = _this.getProperty("area y");
            if (xArea + yArea > 0) {
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.x = def.instance.x + xOffset;
                _this.box.y = def.instance.y + yOffset;
                frame.applyToBox(_this.box);
                if (xArea > 1) {
                    xArea--;
                    _this.box.xSize += Game.SceneMap.instance.xSizeTile * xArea;
                }
                else if (yArea > 1) {
                    yArea--;
                    _this.box.ySize += Game.SceneMap.instance.ySizeTile * yArea;
                }
                Game.SceneMap.instance.boxesEnemies.push(_this.box);
                //Spike.boxes.push(this.box);
            }
            return _this;
        }
        Spike.prototype.onDrawObjectsBack = function () {
            this.sprite.render();
        };
        Spike.prototype.onDrawBoxes = function () {
            if (this.box != null) {
                this.box.render();
            }
        };
        Spike.prototype.onClearScene = function () {
            Spike.boxes = [];
        };
        Spike.boxes = [];
        return Spike;
    }(Game.Entity));
    Game.Spike = Spike;
    var FRAME_180;
    var FRAME_360;
    var FRAME_090;
    var FRAME_270;
    Game.addAction("configure", function () {
        FRAME_180 = Game.FrameSelector.complex("spike 180 damage", Game.Resources.textureGumRem, 389, 533)[0];
        FRAME_360 = Game.FrameSelector.complex("spike 360 damage", Game.Resources.textureGumRem, 485, 533)[0];
        FRAME_090 = Game.FrameSelector.complex("spike 90 damage", Game.Resources.textureGumRem, 485, 558)[0];
        FRAME_270 = Game.FrameSelector.complex("spike 270 damage", Game.Resources.textureGumRem, 389, 558)[0];
    });
    var Spike180 = /** @class */ (function (_super) {
        __extends(Spike180, _super);
        function Spike180(def) {
            return _super.call(this, def, FRAME_180, Game.SceneMap.instance.xSizeTile * 0.5, 0) || this;
        }
        return Spike180;
    }(Spike));
    Game.Spike180 = Spike180;
    var Spike360 = /** @class */ (function (_super) {
        __extends(Spike360, _super);
        function Spike360(def) {
            return _super.call(this, def, FRAME_360, Game.SceneMap.instance.xSizeTile * 0.5, -Game.SceneMap.instance.xSizeTile) || this;
        }
        return Spike360;
    }(Spike));
    Game.Spike360 = Spike360;
    var Spike90 = /** @class */ (function (_super) {
        __extends(Spike90, _super);
        function Spike90(def) {
            return _super.call(this, def, FRAME_090, Game.SceneMap.instance.xSizeTile, -Game.SceneMap.instance.xSizeTile * 0.5) || this;
        }
        return Spike90;
    }(Spike));
    Game.Spike90 = Spike90;
    var Spike270 = /** @class */ (function (_super) {
        __extends(Spike270, _super);
        function Spike270(def) {
            return _super.call(this, def, FRAME_270, 0, -Game.SceneMap.instance.xSizeTile * 0.5) || this;
        }
        return Spike270;
    }(Spike));
    Game.Spike270 = Spike270;
})(Game || (Game = {}));
///<reference path="Blob.ts"/>
var Game;
(function (Game) {
    var SummonedEnemy = /** @class */ (function (_super) {
        __extends(SummonedEnemy, _super);
        function SummonedEnemy(def) {
            var _this = _super.call(this, def) || this;
            _this.machine.startState = _this.stateWaitingForSummon;
            return _this;
        }
        SummonedEnemy.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
        };
        return SummonedEnemy;
    }(Game.EnemyMale));
    Game.SummonedEnemy = SummonedEnemy;
})(Game || (Game = {}));
///<reference path = "../../Game/Arcade/WorldEntity.ts"/>
var Game;
(function (Game) {
    var FRAMES_AIR_HORIZONTAL;
    //var FRAMES_HORIZONTAL : Array<Utils.AnimationFrame>;
    //var FRAMES_VERTICAL : Array<Utils.AnimationFrame>;
    var ANIM_STAND;
    var ANIM_SHOOT;
    Game.addAction("configure", function () {
        FRAMES_AIR_HORIZONTAL = Game.FrameSelector.complex("cannon air horizontal", Game.Resources.textureGumRem, 656, 457);
        ANIM_STAND = new Utils.Animation("stand", false, FRAMES_AIR_HORIZONTAL, 1, [0], null);
        ANIM_SHOOT = new Utils.Animation("shoot", false, FRAMES_AIR_HORIZONTAL, 1, [5, 5, 6, 6, 7, 7, 6, 5, 0, 1, 2, 3, 4, 3, 2, 1, 0, 5, 6, 7, 6, 5, 0], null);
    });
    var Summoner = /** @class */ (function (_super) {
        __extends(Summoner, _super);
        function Summoner(def) {
            var _this = _super.call(this, def) || this;
            _this.currentEnemy = 0;
            Game.SceneMap.instance.boxesEnemies.push(_this.boxSolid);
            _this.xScaleForceWorld = 0;
            _this.yScaleForceWorld = 0;
            _this.xCanMove = false;
            _this.yCanMove = false;
            _this.xAlign = "middle";
            _this.yAlign = "start";
            _this.waitStepsStart = _this.getProperty("wait steps start");
            _this.waitSteps = _this.getProperty("wait steps");
            _this.stateWait = new Game.Flow.State(_this, "wait");
            _this.stateShooting = new Game.Flow.State(_this, "shooting");
            _this.enemies = [];
            for (var enemyIndex = 0; enemyIndex < _this.getProperty("enemies"); enemyIndex += 1) {
                _this.enemies.push(new Game.SummonedEnemy(def));
            }
            _this.stateWait.onEnter = function () {
                _this.animator.setAnimation(ANIM_STAND);
                _this.countWaitSteps = _this.machine.oldState == null ? _this.waitStepsStart : _this.waitSteps;
            };
            _this.stateWait.onStepUpdate = function () {
                _this.countWaitSteps -= 1;
            };
            _this.stateWait.addLink(_this.stateShooting, function () {
                return _this.countWaitSteps <= 0 && _this.animator.indexFrame == 0;
            });
            _this.stateShooting.onEnter = function () {
                _this.animator.setAnimation(ANIM_SHOOT);
                _this.hasShoot = false;
            };
            _this.stateShooting.onStepUpdate = function () {
                if (!_this.hasShoot && _this.animator.indexFrame == 6) {
                    _this.enemies[_this.currentEnemy].summon();
                    _this.currentEnemy += 1;
                    if (_this.currentEnemy == _this.enemies.length) {
                        _this.currentEnemy = 0;
                    }
                    Game.Resources.sfxGumRemSummon.play();
                    _this.hasShoot = true;
                }
            };
            _this.stateShooting.addLink(_this.stateWait, function () {
                return _this.animator.ended;
            });
            _this.machine.startState = _this.stateWait;
            return _this;
        }
        Summoner.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.currentEnemy = 0;
        };
        Summoner.prototype.onStart = function () {
            /*
            var checkDir = 0;
            if(this.vertical){
                checkDir = this.sprite.xMirror ? -1 : 1;
            }
            else{
                checkDir = this.sprite.yMirror ? -1 : 1;
            }
            var contacts = this.boxSolid.collide(SceneMap.instance.boxesTiles, null, this.vertical, checkDir, false, Engine.Box.LAYER_ALL);
            if(contacts != null){
                for(var contact of contacts){
                    if(contact.other.data instanceof Arcade.Platformer.Platform){
                        (contact.other.data as Arcade.Platformer.Platform).addChild(this);
                        break;
                    }
                }
            }
            */
        };
        Summoner.prototype.onSetFrame = function (_animator, _animation, _frame) {
            _frame.applyToSprite(this.sprite);
            _frame.applyToBox(this.boxSolid);
        };
        Summoner.prototype.onDrawObjectsBack = function () {
            if (this.platformParent != null) {
                this.sprite.x += this.platformParent.xGetVelMove() * Engine.System.deltaTime;
                this.sprite.y += this.platformParent.yGetVelMove() * Engine.System.deltaTime;
            }
            this.sprite.render();
            this.boxSolid.render();
        };
        return Summoner;
    }(Game.Arcade.WorldEntity));
    Game.Summoner = Summoner;
})(Game || (Game = {}));
///<reference path="../../Game/Arcade/Platformer/BaseMachineEntity.ts"/>
var Game;
(function (Game) {
    var currentVariant = 0;
    var Switch = /** @class */ (function (_super) {
        __extends(Switch, _super);
        function Switch(def) {
            var _this = _super.call(this, def) || this;
            _this.lastFrame = false;
            _this.boxSolid.xSize = 10;
            _this.boxSolid.ySize = 9;
            _this.boxSolid.xOffset = -_this.boxSolid.xSize * 0.5;
            _this.boxSolid.yOffset = -_this.boxSolid.ySize;
            _this.boxSolid.red = 1;
            _this.boxOverlap.blue = 1;
            _this.variant = _this.getProperty("variant");
            if (_this.variant == 4) {
                Game.SceneMap.instance.boxesEnemies.push(_this.boxSolid);
            }
            _this.boxOverlap.renderable = false;
            return _this;
        }
        Switch.getCurrentVariant = function () {
            return currentVariant;
        };
        Switch.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.setOn(this.getProperty("on"));
            this.yScaleForceWorld = 0;
            this.lastFrame = false;
            if (this.sprite.yMirror) {
                this.boxSolid.yOffset = 0;
            }
        };
        Switch.prototype.setOn = function (on) {
            this.on = on;
            this.boxSolid.enabled = !on;
            this.sprite.setFull(true, false, Game.Resources.textureGumRem, 16, 16, -8, -16, 592 + 19 * (on ? 0 : 1), 79 + 19 * this.variant, 16, 16);
        };
        Switch.prototype.onOverlapUpdate = function () {
            _super.prototype.onOverlapUpdate.call(this);
            if (Game.SceneFreezer.stoped) {
                return;
            }
            Switch.AAAA = this.boxSolid;
            if (this.boxSolid.enabled && this.boxSolid.collideAgainst(Game.Player.instance.boxSolid, null, true, 0, true, Engine.Box.LAYER_ALL) != null) {
                if (!this.lastFrame) {
                    this.lastFrame = true;
                    Game.Resources.sfxGumRemSwitch.play();
                }
                currentVariant = this.variant;
                Engine.System.triggerCustomEvent("onGameSwitchChange");
            }
            else {
                this.lastFrame = false;
            }
        };
        Switch.prototype.onGameSwitchChange = function () {
            if (this.variant == currentVariant) {
                this.setOn(!this.on);
            }
        };
        Switch.prototype.onDrawObjects = function () {
            this.sprite.render();
            this.boxSolid.render();
        };
        return Switch;
    }(Game.Arcade.Platformer.BaseMachineEntity));
    Game.Switch = Switch;
})(Game || (Game = {}));
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var FRAMES;
    Game.addAction("preinit", function () {
        FRAMES = Game.FrameSelector.complex("title", Game.Resources.textureGumRem, 437, 314);
    });
    var Title = /** @class */ (function (_super) {
        __extends(Title, _super);
        function Title() {
            var _this = _super.call(this) || this;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.sprite.pinned = true;
            FRAMES[0].applyToSprite(_this.sprite);
            _this.sprite.y = -100 + 4.5;
            return _this;
        }
        Title.prototype.onDrawObjects = function () {
            this.sprite.render();
        };
        return Title;
    }(Engine.Entity));
    Game.Title = Title;
})(Game || (Game = {}));
///<reference path = "../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var DecoBase = /** @class */ (function (_super) {
        __extends(DecoBase, _super);
        function DecoBase(x, y, xMirror, yMirror, animation) {
            var _this = _super.call(this) || this;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.sprite.pinned = true;
            _this.sprite.x = x;
            _this.sprite.y = y;
            _this.sprite.xMirror = xMirror;
            _this.sprite.yMirror = yMirror;
            _this.animator = new Utils.Animator();
            _this.animator.listener = _this;
            _this.animator.owner = _this;
            _this.animator.setAnimation(animation);
            return _this;
        }
        DecoBase.prototype.onSetFrame = function (_animator, _animation, _frame) {
            _frame.applyToSprite(this.sprite);
        };
        DecoBase.prototype.onDrawObjects = function () {
            this.sprite.render();
        };
        return DecoBase;
    }(Engine.Entity));
    Game.DecoBase = DecoBase;
})(Game || (Game = {}));
///<reference path = "DecoBase.ts"/>
var Game;
(function (Game) {
    var FRAMES_DECO_A;
    var ANIM_DECO_A;
    var FRAMES_DECO_B;
    var ANIM_DECO_B;
    var FRAMES_DECO_C;
    var ANIM_DECO_C;
    Game.addAction("configure", function () {
        FRAMES_DECO_A = Game.FrameSelector.complex("main menu deco a", Game.Resources.textureGumRem, 437, 391);
        ANIM_DECO_A = new Utils.Animation("stand", true, FRAMES_DECO_A, 10, [0, 1, 2, 1], null);
        FRAMES_DECO_B = Game.FrameSelector.complex("main menu deco b", Game.Resources.textureGumRem, 535, 391);
        ANIM_DECO_B = new Utils.Animation("stand", true, FRAMES_DECO_B, 10, [0, 1, 2, 1], null);
        FRAMES_DECO_C = Game.FrameSelector.complex("main menu deco c", Game.Resources.textureGumRem, 55, 86);
        ANIM_DECO_C = new Utils.Animation("stay", true, FRAMES_DECO_C, 5, [8, 7, 6, 5, 6, 7], null);
    });
    var DecoCredits = /** @class */ (function () {
        function DecoCredits() {
            var x = 10;
            var y = 38 - 30 - 30 - 30 - 8;
            new Game.DecoBase(-x, y, false, false, ANIM_DECO_A);
            new Game.DecoBase(x, y, true, false, ANIM_DECO_B);
            new Game.DecoBase(x, y - 27, false, false, ANIM_DECO_C);
            new Game.DecoBase(-x, y - 27, false, false, ANIM_DECO_C);
        }
        return DecoCredits;
    }());
    Game.DecoCredits = DecoCredits;
})(Game || (Game = {}));
///<reference path = "DecoBase.ts"/>
var Game;
(function (Game) {
    var FRAMES_DECO_A_NORMAL;
    var ANIM_DECO_A_NORMAL;
    var FRAMES_DECO_B_NORMAL;
    var ANIM_DECO_B_NORMAL;
    var FRAMES_DECO_A_HARD;
    var ANIM_DECO_A_HARD;
    var FRAMES_DECO_B_HARD;
    var ANIM_DECO_B_HARD;
    Game.addAction("preinit", function () {
        FRAMES_DECO_A_NORMAL = Game.FrameSelector.complex("deco a", Game.Resources.textureGumRem, 55, 59);
        ANIM_DECO_A_NORMAL = new Utils.Animation("stand", true, FRAMES_DECO_A_NORMAL, 10, [0, 1, 2, 1], null);
        FRAMES_DECO_B_NORMAL = Game.FrameSelector.complex("deco b", Game.Resources.textureGumRem, 153, 59);
        ANIM_DECO_B_NORMAL = new Utils.Animation("stand", true, FRAMES_DECO_B_NORMAL, 10, [0, 1, 2, 1], null);
        FRAMES_DECO_A_HARD = Game.FrameSelector.complex("deco a", Game.Resources.textureGumRem, 437, 418);
        ANIM_DECO_A_HARD = new Utils.Animation("stand", true, FRAMES_DECO_A_HARD, 10, [0, 1, 2, 1], null);
        FRAMES_DECO_B_HARD = Game.FrameSelector.complex("deco b", Game.Resources.textureGumRem, 535, 418);
        ANIM_DECO_B_HARD = new Utils.Animation("stand", true, FRAMES_DECO_B_HARD, 10, [0, 1, 2, 1], null);
    });
    var DecoLevelSelection = /** @class */ (function () {
        function DecoLevelSelection(speedrun) {
            new Game.DecoBase(-81 - (speedrun ? 7 : 0), 62 + (speedrun ? 6 : 0), false, speedrun ? false : true, Game.Level.hard ? ANIM_DECO_A_HARD : ANIM_DECO_A_NORMAL);
            new Game.DecoBase(81 + (speedrun ? 7 : 0), 62 + (speedrun ? 6 : 0), true, speedrun ? false : true, Game.Level.hard ? ANIM_DECO_B_HARD : ANIM_DECO_B_NORMAL);
        }
        return DecoLevelSelection;
    }());
    Game.DecoLevelSelection = DecoLevelSelection;
})(Game || (Game = {}));
///<reference path = "DecoBase.ts"/>
var Game;
(function (Game) {
    var FRAMES_DECO_A;
    var ANIM_DECO_A;
    var FRAMES_DECO_B;
    var ANIM_DECO_B;
    Game.addAction("preinit", function () {
        FRAMES_DECO_A = Game.FrameSelector.complex("preloader deco a", Game.Resources.textureGumRem, 55, 59);
        ANIM_DECO_A = new Utils.Animation("stand", true, FRAMES_DECO_A, 10, [0, 1, 2, 1], null);
        FRAMES_DECO_B = Game.FrameSelector.complex("preloader deco b", Game.Resources.textureGumRem, 153, 59);
        ANIM_DECO_B = new Utils.Animation("stand", true, FRAMES_DECO_B, 10, [0, 1, 2, 1], null);
    });
    var DecoPreloader = /** @class */ (function () {
        function DecoPreloader() {
            new Game.DecoBase(-40, -7, false, false, ANIM_DECO_A);
            new Game.DecoBase(40, 8, true, true, ANIM_DECO_B);
        }
        return DecoPreloader;
    }());
    Game.DecoPreloader = DecoPreloader;
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
            _this.red = 26 / 255;
            _this.green = 26 / 255;
            _this.blue = 26 / 255;
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
