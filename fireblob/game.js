"use strict";
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
                this.source[this.source.start ? 'start' : 'noteOn'](0, this.source.loop ? this.loopStart : 0);
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
                Renderer.gl.clearColor(1, 1, 1, 1);
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
///<reference path="../Engine/System.ts"/>
///<reference path="../Engine/AudioManager.ts"/>
///<reference path="../Engine/Renderer.ts"/>
var Game;
(function (Game) {
    //Engine.Renderer.preferredMode = Engine.RendererMode.CANVAS_2D;
    //Engine.AudioManager.preferredMode = Engine.AudioManagerMode.HTML;
    Game.X_OFFSET_FIREBLOB_GRAPHICS = 0;
    Game.Y_OFFSET_FIREBLOB_GRAPHICS = 0;
    Game.levelStates = new Array();
    Game.OPTIMIZE_EMISSION = false;
    Game.OPTIMIZE_TRANSPARENCY = false;
    Game.BLOB_EMISSION = 0;
    Game.BLOCK_EMISSION = 0;
    Game.TEXT_KEZARTS = "KEZARTS.COM";
    Engine.System.onInit = function () {
        if (Engine.Data.useLocalStorage) {
            Engine.Data.setID("com", "kez", "fireblob");
        }
        else {
            Engine.Data.setID("c", "k", "fbl");
        }
        Game.triggerActions("beforeanything");
        Engine.Renderer.clearColor(1, 1, 1);
        Engine.System.createEvent(Engine.EventType.CREATE_SCENE, "onCreateScene");
        Engine.System.createEvent(Engine.EventType.RESET_SCENE, "onReset");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateAnchor");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateText");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onControlPreUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onControlUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMoveUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onOverlapUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onAnimationUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepLateUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdateFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onTimeUpdate");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onTimeUpdateSceneBeforeDrawFixed");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawScene");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawTextSuperBack");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSwitchs");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsBack");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawButtonsBack");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesBack");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjects");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsFront");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPlayer");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawGoal");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawParticlesFront");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawPause");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawDialogs");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawButtons");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawText");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsAfterUI");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawAdFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawOrientationUI");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawTextFront");
        Engine.System.createEvent(Engine.EventType.CLEAR_SCENE, "onClearScene");
        for (var i = 0; i < 50; i += 1) {
            Game.levelStates[i] = Engine.Data.load("level" + i) || "";
            //console.log(levelStates[i]);
        }
        if (Game.levelStates[0] == "") {
            Game.levelStates[0] = "unlocked";
        }
        Game.triggerActions("loadgame");
        Engine.Box.debugRender = false;
        Game.startingSceneClass = Game.MainMenu;
        Game.OPTIMIZE_EMISSION = Game.OPTIMIZE_EMISSION || Engine.Renderer.mode == Engine.RendererMode.CANVAS_2D || Engine.AudioManager.mode != Engine.AudioManagerMode.WEB;
        Game.OPTIMIZE_TRANSPARENCY = Game.OPTIMIZE_TRANSPARENCY || Engine.Renderer.mode == Engine.RendererMode.CANVAS_2D || Engine.AudioManager.mode != Engine.AudioManagerMode.WEB;
        Game.BLOB_EMISSION = Game.OPTIMIZE_EMISSION ? 6 : 0;
        Game.BLOCK_EMISSION = Game.OPTIMIZE_EMISSION ? 11 : 2;
    };
})(Game || (Game = {}));
var Game;
(function (Game) {
    Game.REMOVE_LINKS_TITTLE = false;
    Game.HAS_PRELOADER = true;
    Game.HAS_LINKS = true;
    Game.HAS_LINKS_KEZARTS = true;
    Game.HAS_GOOGLE_PLAY_LOGOS = true;
    Game.IS_EDGE = /Edge/.test(navigator.userAgent);
    Game.FORCE_EDGE_TUTORIAL = Game.IS_EDGE;
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
    Game.IS_ARCADE = false;
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
            //console.log(def.type.type);
            //@ts-ignore
            new Game.Entities[def.type.type](def);
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
            _this.red = 1;
            _this.green = 1;
            _this.blue = 1;
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
///<reference path="../Utils/Fade.ts"/>
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
            _this.text.font = Game.FontManager.ads;
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
            _this.red = 255 / 255;
            _this.green = 255 / 255;
            _this.blue = 255 / 255;
            _this.alpha = 0;
            _this.sprite.setRGBA(_this.red, _this.green, _this.blue, 0);
            _this.maxAlpha = 0.5;
            _this.speed = 0.0166666666666667 * 4;
            return _this;
        }
        Object.defineProperty(LevelAdLoader, "blocked", {
            get: function () {
                return LevelAdLoader.instance.direction != 0 || LevelAdLoader.instance.alpha != 0;
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
var Game;
(function (Game) {
    var Orientation = /** @class */ (function (_super) {
        __extends(Orientation, _super);
        function Orientation() {
            var _this = _super.call(this) || this;
            Orientation.instance = _this;
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
            _this.fill.setRGBA(0 / 255, 88 / 255, 248 / 255, 0.85);
            _this.onViewUpdate();
            return _this;
        }
        Orientation.prototype.onViewUpdate = function () {
            this.fill.enabled = Engine.Renderer.xSizeView < Engine.Renderer.ySizeView;
            this.device.enabled = this.fill.enabled;
            this.text0.enabled = this.fill.enabled;
            this.text1.enabled = this.fill.enabled;
            this.fill.x = -Engine.Renderer.xSizeView * 0.5;
            this.fill.y = -Engine.Renderer.ySizeView * 0.5;
            this.fill.xSize = Engine.Renderer.xSizeView;
            this.fill.ySize = Engine.Renderer.ySizeView;
        };
        Object.defineProperty(Orientation.prototype, "blocked", {
            get: function () {
                return this.fill.enabled && Orientation.ready;
            },
            enumerable: false,
            configurable: true
        });
        Orientation.prototype.onDrawOrientationUI = function () {
            this.fill.render();
            this.device.render();
        };
        Orientation.prototype.onClearScene = function () {
            Orientation.instance = null;
        };
        Orientation.ready = false;
        Orientation.instance = null;
        return Orientation;
    }(Engine.Entity));
    Game.Orientation = Orientation;
    var FRAMES;
    Game.addAction("init", function () {
        var frame = new Utils.AnimationFrame(Game.Resources.texture, 35, 369, 142, 78, -142 * 0.5 - 0.5, -78 * 0.5 - 0.5);
        FRAMES = [frame];
        //Orientation.ready = true;
    });
    Game.addAction("onpreloadcomplete", function () {
        Orientation.ready = Game.TRACK_ORIENTATION;
    });
})(Game || (Game = {}));
var Game;
(function (Game) {
    var StateLink = /** @class */ (function () {
        function StateLink(state, condition, priority) {
            this.priority = 0;
            this.state = state;
            this.condition = condition;
            this.priority = priority;
        }
        return StateLink;
    }());
    Game.StateLink = StateLink;
    var State = /** @class */ (function () {
        function State(owner, name) {
            if (name === void 0) { name = ""; }
            this.name = "";
            this.transitional = false;
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
    Game.State = State;
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
            _this.freezeable = true;
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
            this._currentState = null;
            this.triggerListener(this._anyState._onEnter);
            this._currentState = this._startState;
            this.triggerListener(this._currentState._onEnter);
        };
        StateMachine.prototype.onMoveUpdate = function () {
            if (!this.freezeable || !Game.Scene.freezed) {
                this.triggerListener(this._anyState._onMoveUpdate);
                this.triggerListener(this._currentState._onMoveUpdate);
            }
        };
        StateMachine.prototype.onOverlapUpdate = function () {
            if (!this.freezeable || !Game.Scene.freezed) {
                this.triggerListener(this._anyState._onOverlapUpdate);
                this.triggerListener(this._currentState._onOverlapUpdate);
            }
        };
        StateMachine.prototype.onStepUpdate = function () {
            if (!this.freezeable || !Game.Scene.freezed) {
                this.triggerListener(this._anyState._onStepUpdate);
                this.triggerListener(this._currentState._onStepUpdate);
                var nextState = null;
                do {
                    nextState = this._currentState.checkLinks(this.owner);
                    if (nextState != null) {
                        this._nextState = nextState;
                        this.triggerListener(this._currentState._onExit);
                        this._oldState = this._currentState;
                        this._currentState = nextState;
                        this._nextState = null;
                        this.triggerListener(this._currentState._onEnter);
                    }
                } while (nextState != null && nextState.transitional);
            }
        };
        StateMachine.prototype.onTimeUpdate = function () {
            if (!this.freezeable || !Game.Scene.freezed) {
                this.triggerListener(this._anyState._onTimeUpdate);
                this.triggerListener(this._currentState._onTimeUpdate);
            }
        };
        return StateMachine;
    }(Engine.Entity));
    Game.StateMachine = StateMachine;
})(Game || (Game = {}));
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
        Button.prototype.onDrawButtonsBack = function () {
            if (!Game.Scene.paused) {
                this.control.bounds.render();
            }
        };
        Button.prototype.onDrawButtons = function () {
            if (Game.Scene.paused) {
                this.control.bounds.render();
            }
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
            _this.text.enabled = true;
            _this.text.pinned = true;
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
        function DialogButton(x, y, xSize, ySize) {
            var _this = _super.call(this) || this;
            _this.arrows = new Game.Arrows();
            _this.control = new Game.Control();
            _this.text = new Utils.Text();
            _this.dialog = new Game.ColorDialog("blue", x, y, xSize, ySize);
            _this.control.bounds = _this.dialog.fill;
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
        Object.defineProperty(DialogButton.prototype, "enabled", {
            set: function (value) {
                this.control.enabled = value;
                this.dialog.enabled = value;
                this.text.enabled = value;
            },
            enumerable: false,
            configurable: true
        });
        return DialogButton;
    }(Engine.Entity));
    Game.DialogButton = DialogButton;
})(Game || (Game = {}));
///<reference path="../../System/Button.ts"/>
var Game;
(function (Game) {
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
            FRAMES[0].applyToSprite(this.bounds);
        };
        ExitButton.prototype.onClearScene = function () {
            ExitButton.instance = null;
        };
        return ExitButton;
    }(Game.Button));
    Game.ExitButton = ExitButton;
    var FRAMES;
    var FRAMES_NORMAL;
    var FRAMES_TOUCH;
    Game.addAction("configure", function () {
        FRAMES_TOUCH = Game.FrameSelector.complex("exit button touch", Game.Resources.texture, 270, 479);
        FRAMES_NORMAL = Game.FrameSelector.complex("exit button normal", Game.Resources.texture, 270, 452);
        if (Game.IS_TOUCH) {
            FRAMES = FRAMES_TOUCH;
        }
        else {
            FRAMES = FRAMES_NORMAL;
        }
    });
})(Game || (Game = {}));
///<reference path="../../System/Button.ts"/>
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
            FRAMES = Game.FrameSelector.complex("google play button", Game.Resources.textureGooglePlay, 37, 37);
        }
    });
})(Game || (Game = {}));
///<reference path="../../System/Button.ts"/>
var Game;
(function (Game) {
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
                FRAMES[1].applyToSprite(this.bounds);
            }
            else {
                FRAMES[0].applyToSprite(this.bounds);
            }
        };
        MusicButton.prototype.onClearScene = function () {
            MusicButton.instance = null;
        };
        return MusicButton;
    }(Game.Button));
    Game.MusicButton = MusicButton;
    var FRAMES;
    var FRAMES_TOUCH;
    var FRAMES_NORMAL;
    Game.addAction("configure", function () {
        FRAMES_TOUCH = Game.FrameSelector.complex("music button touch", Game.Resources.texture, 30, 479);
        FRAMES_NORMAL = Game.FrameSelector.complex("music button normal", Game.Resources.texture, 30, 452);
        if (Game.IS_TOUCH) {
            FRAMES = FRAMES_TOUCH;
        }
        else {
            FRAMES = FRAMES_NORMAL;
        }
    });
})(Game || (Game = {}));
///<reference path="../../System/Button.ts"/>
var Game;
(function (Game) {
    var PauseButton = /** @class */ (function (_super) {
        __extends(PauseButton, _super);
        function PauseButton() {
            var _this = _super.call(this) || this;
            _this.pauseGraph = Game.Scene.paused;
            PauseButton.instance = _this;
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
            Game.Scene.switchPause();
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
                FRAMES[1].applyToSprite(this.bounds);
            }
            else {
                FRAMES[0].applyToSprite(this.bounds);
            }
        };
        PauseButton.prototype.onClearScene = function () {
            PauseButton.instance = null;
        };
        return PauseButton;
    }(Game.Button));
    Game.PauseButton = PauseButton;
    var FRAMES;
    var FRAMES_TOUCH;
    var FRAMES_NORMAL;
    Game.addAction("configure", function () {
        FRAMES_TOUCH = Game.FrameSelector.complex("pause button touch", Game.Resources.texture, 166, 479);
        FRAMES_NORMAL = Game.FrameSelector.complex("pause button normal", Game.Resources.texture, 166, 452);
        if (Game.IS_TOUCH) {
            FRAMES = FRAMES_TOUCH;
        }
        else {
            FRAMES = FRAMES_NORMAL;
        }
    });
})(Game || (Game = {}));
///<reference path="../../System/Button.ts"/>
var Game;
(function (Game) {
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
            FRAMES[0].applyToSprite(this.bounds);
        };
        ResetButton.prototype.onClearScene = function () {
            ResetButton.instance = null;
        };
        return ResetButton;
    }(Game.Button));
    Game.ResetButton = ResetButton;
    var FRAMES;
    var FRAMES_TOUCH;
    var FRAMES_NORMAL;
    Game.addAction("configure", function () {
        FRAMES_TOUCH = Game.FrameSelector.complex("reset button touch", Game.Resources.texture, 234, 479);
        FRAMES_NORMAL = Game.FrameSelector.complex("reset button normal", Game.Resources.texture, 234, 452);
        if (Game.IS_TOUCH) {
            FRAMES = FRAMES_TOUCH;
        }
        else {
            FRAMES = FRAMES_NORMAL;
        }
    });
})(Game || (Game = {}));
///<reference path="../../System/Button.ts"/>
var Game;
(function (Game) {
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
                FRAMES[1].applyToSprite(this.bounds);
            }
            else {
                FRAMES[0].applyToSprite(this.bounds);
            }
        };
        SoundButton.prototype.onClearScene = function () {
            SoundButton.instance = null;
        };
        return SoundButton;
    }(Game.Button));
    Game.SoundButton = SoundButton;
    var FRAMES;
    var FRAMES_TOUCH;
    var FRAMES_NORMAL;
    Game.addAction("configure", function () {
        FRAMES_TOUCH = Game.FrameSelector.complex("sound button touch", Game.Resources.texture, 98, 479);
        FRAMES_NORMAL = Game.FrameSelector.complex("sound button normal", Game.Resources.texture, 98, 452);
        if (Game.IS_TOUCH) {
            FRAMES = FRAMES_TOUCH;
        }
        else {
            FRAMES = FRAMES_NORMAL;
        }
    });
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var VARIANTS = 5;
        var frames = new Array();
        var animationsStand = new Array();
        var animationsMove = new Array();
        var animationsJump = new Array();
        var animationsFall = new Array();
        var animationsFallGround = new Array();
        var animationsLanding = new Array();
        function createFrames(xTexture, yTexture, xSize, ySize, xOffset, yOffset) {
            for (var index = 0; index < VARIANTS; index += 1) {
                var frame = new Utils.AnimationFrame();
                frame.texture = Game.Resources.texture; //Engine.Texture.load(Resources.PATH_TEXTURE_GRAPHICS_0);
                frame.xTexture = xTexture;
                frame.yTexture = yTexture + 14 * index;
                frame.xSize = xSize;
                frame.ySize = ySize;
                frame.xOffset = xOffset;
                frame.yOffset = yOffset;
                frames.push(frame);
            }
        }
        function createAllFrames() {
            createFrames(30, 141, 16, 11, -8, -11);
            createFrames(47, 142, 18, 10, -9, -10);
            createFrames(66, 143, 20, 9, -10, -9);
            createFrames(87, 140, 14, 12, -7, -12);
            createFrames(102, 139, 12, 13, -6, -12);
            createFrames(115, 140, 14, 12, -7, -12);
            createFrames(130, 141, 16, 11, -8, -11);
            createFrames(147, 140, 14, 12, -7, -12);
            createFrames(162, 139, 12, 13, -6, -12);
        }
        function getFrame(index, variant) {
            return frames[index * VARIANTS + variant];
        }
        function createAnims(array, name, steps, loop, frameIndices) {
            for (var indexVariant = 0; indexVariant < VARIANTS; indexVariant += 1) {
                var frames = new Array();
                for (var _i = 0, frameIndices_1 = frameIndices; _i < frameIndices_1.length; _i++) {
                    var indexFrame = frameIndices_1[_i];
                    frames.push(getFrame(indexFrame, indexVariant));
                }
                var animation = new Utils.Animation(name, loop, frames, steps, null, null);
                array.push(animation);
            }
        }
        function createAllAnims() {
            createAnims(animationsStand, "stand", 1, false, [0]);
            createAnims(animationsMove, "move", 5, true, [1, 2, 1, 0]);
            createAnims(animationsJump, "jump", 3, false, [3, 4]);
            createAnims(animationsFall, "fall", 3, false, [5, 6, 7, 8]);
            createAnims(animationsFallGround, "fall ground", 3, false, [6, 7, 8]);
            createAnims(animationsLanding, "landing", 3, false, [1, 2, 1, 0]);
        }
        Game.addAction("init", function () {
            createAllFrames();
            createAllAnims();
        });
        var Blob = /** @class */ (function (_super) {
            __extends(Blob, _super);
            function Blob(def, onFire, variant) {
                var _this = _super.call(this, def) || this;
                _this.variant = 0;
                _this.velMove = 0;
                _this.winning = false;
                _this.losing = false;
                _this.win = false;
                _this.lose = false;
                _this.countWinLose = 0;
                _this.xHit = 0;
                _this.def = def;
                _this.variant = variant;
                _this.sprite = new Engine.Sprite();
                _this.sprite.enabled = true;
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.xSize = Entities.Player.X_SIZE_BOX;
                _this.box.ySize = Entities.Player.Y_SIZE_BOX;
                _this.box.xOffset = -_this.box.xSize * 0.5;
                _this.box.yOffset = -_this.box.ySize;
                _this.onFire = onFire;
                _this.box.data = _this;
                Game.Scene.boxesBlobs.push(_this.box);
                if (onFire) {
                    Game.Scene.boxesFireEntities.push(_this.box);
                    if (!Game.OPTIMIZE_TRANSPARENCY) {
                        _this.sprite.setRGBA(1, 1, 1, 0.7);
                    }
                }
                _this.animator = new Utils.Animator();
                _this.animator.listener = _this;
                _this.initEmitters();
                _this.death = new Entities.BlobDeath();
                return _this;
            }
            Blob.prototype.initEmitters = function () {
                this.emitter0 = new Utils.Emitter();
                this.emitter0.enabled = this.onFire;
                this.emitter0.active = this.onFire;
                this.emitter0.emissionSteps = Game.BLOB_EMISSION;
                this.emitter0.xMin = -9;
                this.emitter0.xMax = 9;
                this.emitter0.yMin = -6;
                this.emitter0.yMax = 1;
                this.emitter0.yVelMin = -0.4;
                this.emitter0.yVelMax = -0.8;
                this.emitter0.yAccelMin = 0.004;
                this.emitter0.yAccelMax = 0.008;
                this.emitter0.lifeParticleMin = 30;
                this.emitter0.lifeParticleMax = 60;
                for (var index = 0; index < 60; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(196, 139 + this.variant * 14, 4, 4, 4, 4, 3, 4);
                    this.emitter0.addParticle(particle);
                }
                this.emitter1 = new Utils.Emitter();
                this.emitter1.enabled = this.onFire;
                this.emitter1.active = this.onFire;
                this.emitter1.emissionSteps = Game.BLOB_EMISSION;
                this.emitter1.xMin = -5;
                this.emitter1.xMax = 5;
                this.emitter1.yMin = -4;
                this.emitter1.yMax = -0;
                this.emitter1.yVelMin = -0.2;
                this.emitter1.yVelMax = -0.6;
                this.emitter1.yAccelMin = 0.002;
                this.emitter1.yAccelMax = 0.006;
                this.emitter1.lifeParticleMin = 30;
                this.emitter1.lifeParticleMax = 40;
                for (var index = 0; index < 40; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(196, 144 + this.variant * 14, 4, 4, 4, 4, 3, 4);
                    this.emitter1.addParticle(particle);
                }
            };
            //@ts-ignore
            Blob.prototype.onSetFrame = function (animator, animation, frame) {
                frame.applyToSprite(this.sprite);
            };
            Blob.prototype.onReset = function () {
                this.box.x = this.def.instance.x + Game.Scene.xSizeTile * 0.5;
                this.box.y = this.def.instance.y;
                this.xVel = 0;
                this.yVel = 0;
                this.sprite.xMirror = false;
                this.onGround = true;
                this.winning = false;
                this.losing = false;
                this.countWinLose = 0;
                this.win = false;
                this.lose = false;
                this.emitter0.active = this.onFire;
                this.emitter1.active = this.onFire;
                this.sprite.enabled = true;
                this.box.enabled = true;
                this.sprite.xMirror = this.def.flip.x;
                this.setState(Blob.STATE_STAND);
            };
            Blob.prototype.setState = function (nextState) {
                this.state = Blob.STATE_NONE;
                this.linkToState(nextState);
            };
            Blob.prototype.linkToState = function (nextState) {
                this.onStateExit(nextState);
                var oldState = this.state;
                this.state = nextState;
                this.onStateEnter(oldState);
            };
            Blob.prototype.checkStateLink = function (state, condition) {
                if (condition) {
                    this.linkToState(state);
                    return true;
                }
                return false;
            };
            Blob.prototype.checkStateLinks = function () {
                switch (this.state) {
                    case Blob.STATE_STAND:
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_FALL, !this.onGround))
                            break;
                        if (this.checkStateLink(Blob.STATE_ASCEND, this.canJump()))
                            break;
                        if (this.checkStateLink(Blob.STATE_WALK, this.xVel != 0))
                            break;
                        break;
                    case Blob.STATE_WALK:
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_FALL, !this.onGround))
                            break;
                        if (this.checkStateLink(Blob.STATE_ASCEND, this.canJump()))
                            break;
                        if (this.checkStateLink(Blob.STATE_STAND, this.xVel == 0))
                            break;
                        break;
                    case Blob.STATE_ASCEND:
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_FALL, this.yVel >= 0))
                            break;
                        break;
                    case Blob.STATE_FALL:
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_LANDING, this.onGround))
                            break;
                        break;
                    case Blob.STATE_LANDING: {
                        if (this.checkStateLink(Blob.STATE_DEAD, this.losing))
                            break;
                        if (this.checkStateLink(Blob.STATE_FALL, !this.onGround))
                            break;
                        if (this.checkStateLink(Blob.STATE_ASCEND, this.canJump()))
                            break;
                        if (this.checkStateLink(Blob.STATE_WALK, this.xVel != 0))
                            break;
                        if (this.checkStateLink(Blob.STATE_STAND, this.animator.ended))
                            break;
                    }
                }
            };
            //@ts-ignore
            Blob.prototype.onStateExit = function (nextState) {
                switch (this.state) {
                    case Blob.STATE_STAND:
                        break;
                    case Blob.STATE_WALK:
                        break;
                    case Blob.STATE_ASCEND:
                        break;
                    case Blob.STATE_FALL:
                        break;
                }
            };
            Blob.prototype.onStateEnter = function (oldState) {
                switch (this.state) {
                    case Blob.STATE_STAND:
                        this.animator.setAnimation(animationsStand[this.variant], false);
                        break;
                    case Blob.STATE_WALK:
                        this.animator.setAnimation(animationsMove[this.variant], false);
                        break;
                    case Blob.STATE_ASCEND:
                        this.animator.setAnimation(animationsJump[this.variant], false);
                        if (this.canJump() && oldState != Blob.STATE_ASCEND && oldState != Blob.STATE_FALL) {
                            this.yVel = -Entities.Player.VEL_JUMP;
                            Game.Resources.audioPlayerJump.play();
                        }
                        break;
                    case Blob.STATE_FALL:
                        if (oldState == Entities.Player.STATE_ASCEND) {
                            this.animator.setAnimation(animationsFall[this.variant], false);
                        }
                        else {
                            this.animator.setAnimation(animationsFallGround[this.variant], false);
                        }
                        break;
                    case Blob.STATE_LANDING:
                        this.animator.setAnimation(animationsLanding[this.variant], false);
                        break;
                    case Blob.STATE_DEAD:
                        Game.Resources.audioPlayerDead.play();
                        this.emitter0.active = false;
                        this.emitter1.active = false;
                        this.xVel = 0;
                        this.yVel = 0;
                        this.sprite.enabled = false;
                        this.box.enabled = false;
                        this.death.trigger(this.box.x, this.box.y - this.box.ySize * 0.5, this.variant);
                        //console.log("shake");
                        break;
                }
            };
            Blob.prototype.onMoveUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                var contacts = this.box.cast(Game.Scene.boxesTiles, null, true, this.xVel, true, Engine.Box.LAYER_ALL);
                this.box.translate(contacts, true, this.xVel, true);
                this.xHit = contacts == null ? 0 : (this.xVel > 0 ? 1 : -1);
                this.yVel += Game.Level.GRAVITY;
                contacts = this.box.cast(Game.Scene.boxesTiles, null, false, this.yVel, true, Engine.Box.LAYER_ALL);
                this.box.translate(contacts, false, this.yVel, true);
                this.onGround = false;
                if (contacts != null) {
                    this.onGround = this.yVel > 0;
                    this.yVel = 0;
                }
                this.emitter0.x = this.box.x;
                this.emitter0.y = this.box.y;
                this.emitter1.x = this.box.x;
                this.emitter1.y = this.box.y;
            };
            Blob.prototype.onOverlapUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                if (this.onFire && this.burnGoal) {
                }
                if (!this.winning && !this.losing) {
                    this.winning = this.getWinCondition();
                }
                if (!this.winning && !this.losing) {
                    this.losing = this.box.y > Game.Scene.ySizeLevel || this.box.collide(Game.Scene.boxesSpikes, null, true, 0, true, Engine.Box.LAYER_ALL) != null || this.getLossCondition();
                }
                if (this.winning) {
                    this.countWinLose += 1;
                    if (this.countWinLose >= Blob.STEPS_WAIT_WIN_LOSE) {
                        this.win = true;
                    }
                }
                if (this.losing) {
                    this.countWinLose += 1;
                    if (this.countWinLose >= Blob.STEPS_WAIT_WIN_LOSE) {
                        this.lose = true;
                    }
                }
            };
            Blob.prototype.onStepUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                if (!(Game.Scene.instance instanceof Game.MainMenu) && Game.Scene.nextSceneClass != null) {
                    this.xVel = 0;
                    this.box.y -= this.yVel;
                    this.yVel = 0;
                    this.emitter0.stop();
                    this.emitter1.stop();
                    return;
                }
                switch (this.state) {
                    case Blob.STATE_STAND:
                        this.move();
                        break;
                    case Blob.STATE_WALK:
                        this.move();
                        break;
                    case Blob.STATE_ASCEND:
                        this.move();
                        break;
                    case Blob.STATE_FALL:
                        this.move();
                        break;
                    case Blob.STATE_LANDING:
                        this.move();
                        break;
                }
                this.checkStateLinks();
            };
            Blob.prototype.canJump = function () {
                return false;
            };
            Blob.prototype.move = function () {
                if (this.getMoveDirection() < 0) {
                    this.sprite.xMirror = true;
                    this.xVel = -this.velMove;
                }
                else if (this.getMoveDirection() > 0) {
                    this.sprite.xMirror = false;
                    this.xVel = this.velMove;
                }
                else {
                    this.xVel = 0;
                }
            };
            Blob.prototype.onTimeUpdate = function () {
                if (Game.Scene.freezed) {
                    this.sprite.x = this.box.x;
                    this.sprite.y = this.box.y;
                }
                else {
                    var point = this.box.getExtrapolation(Game.Scene.boxesTiles, this.xVel, this.yVel, true, Engine.Box.LAYER_ALL);
                    this.sprite.x = point.x;
                    this.sprite.y = point.y;
                }
            };
            Blob.prototype.getMoveDirection = function () {
                return 0;
            };
            Blob.prototype.getWinCondition = function () {
                return false;
            };
            Blob.prototype.getLossCondition = function () {
                return false;
            };
            Blob.STEPS_WAIT_WIN_LOSE = 30;
            Blob.VEL_JUMP = 5.0;
            Blob.X_SIZE_BOX = 14;
            Blob.Y_SIZE_BOX = 10;
            Blob.STATE_NONE = 0;
            Blob.STATE_STAND = 1;
            Blob.STATE_WALK = 2;
            Blob.STATE_ASCEND = 3;
            Blob.STATE_FALL = 4;
            Blob.STATE_LANDING = 5;
            Blob.STATE_DEAD = 6;
            return Blob;
        }(Game.Entity));
        Entities.Blob = Blob;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var BlobDeath = /** @class */ (function (_super) {
            __extends(BlobDeath, _super);
            function BlobDeath() {
                var _this = _super.call(this) || this;
                _this.enabled = false;
                _this.count = 0;
                _this.sprites = new Array();
                for (var index = 0; index < 8; index += 1) {
                    _this.sprites.push(new Engine.Sprite());
                }
                return _this;
            }
            BlobDeath.prototype.trigger = function (x, y, variant) {
                this.enabled = true;
                this.variant = variant;
                for (var index = 0; index < 8; index += 1) {
                    var sprite = this.sprites[index];
                    sprite.x = x;
                    sprite.y = y;
                    sprite.setFull(true, false, Game.Resources.texture, 7, 7, -3.5, -3.5, 22 + 153, 122 + 17 + 14 * variant, 7, 7);
                }
            };
            BlobDeath.prototype.onReset = function () {
                this.enabled = false;
                this.count = 0;
            };
            BlobDeath.prototype.onStepUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                if (this.enabled) {
                    this.sprites[0].y -= BlobDeath.VEL;
                    this.sprites[1].x += BlobDeath.VEL * 0.85090352453;
                    this.sprites[1].y -= BlobDeath.VEL * 0.85090352453;
                    this.sprites[2].x += BlobDeath.VEL;
                    this.sprites[3].x += BlobDeath.VEL * 0.85090352453;
                    this.sprites[3].y += BlobDeath.VEL * 0.85090352453;
                    this.sprites[4].y += BlobDeath.VEL;
                    this.sprites[5].x -= BlobDeath.VEL * 0.85090352453;
                    this.sprites[5].y += BlobDeath.VEL * 0.85090352453;
                    this.sprites[6].x -= BlobDeath.VEL;
                    this.sprites[7].x -= BlobDeath.VEL * 0.85090352453;
                    this.sprites[7].y -= BlobDeath.VEL * 0.85090352453;
                    this.count += 1;
                    var ccc = 2;
                    if (this.count == 1 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Game.Resources.texture, 6, 6, -3.0, -3.0, 30 + 153, 122 + 17 + 14 * this.variant, 6, 6);
                        }
                    }
                    else if (this.count == 2 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Game.Resources.texture, 5, 5, -2.5, -2.5, 37 + 153, 122 + 17 + 14 * this.variant, 5, 5);
                        }
                    }
                    else if (this.count == 3 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Game.Resources.texture, 4, 4, -2.0, -2.0, 43 + 153, 122 + 17 + 14 * this.variant, 4, 4);
                        }
                    }
                    else if (this.count == 4 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Game.Resources.texture, 3, 3, -1.5, -1.5, 48 + 153, 122 + 17 + 14 * this.variant, 3, 3);
                        }
                    }
                    else if (this.count == 5 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].setFull(true, false, Game.Resources.texture, 1, 1, -0.5, -0.5, 52 + 153, 122 + 17 + 14 * this.variant, 1, 1);
                        }
                    }
                    else if (this.count == 6 * ccc) {
                        for (var index = 0; index < 8; index += 1) {
                            this.sprites[index].enabled = false;
                        }
                    }
                }
            };
            BlobDeath.prototype.onDrawPlayer = function () {
                if (this.enabled) {
                    for (var index = 0; index < 8; index += 1) {
                        this.sprites[index].render();
                    }
                }
            };
            BlobDeath.VEL = 2.5;
            return BlobDeath;
        }(Engine.Entity));
        Entities.BlobDeath = BlobDeath;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Block = /** @class */ (function (_super) {
            __extends(Block, _super);
            function Block(def) {
                var _this = _super.call(this, def) || this;
                _this.texture = Game.Resources.texture; //Engine.Texture.load(Resources.PATH_TEXTURE_GRAPHICS_0);
                _this.sprite = new Engine.Sprite();
                _this.sprite.x = def.instance.x;
                _this.sprite.y = def.instance.y - Game.Scene.xSizeTile;
                _this.box = new Engine.Box();
                _this.box.x = _this.sprite.x;
                _this.box.y = _this.sprite.y;
                _this.box.xSize = Game.Scene.xSizeTile;
                _this.ySize = _this.getProperty("ySize");
                Game.Scene.boxesTiles.push(_this.box);
                _this.emitter = new Utils.Emitter();
                _this.emitter.enabled = true;
                _this.emitter.emissionSteps = Game.BLOCK_EMISSION;
                _this.emitter.x = _this.sprite.x + Game.Scene.xSizeTile * 0.5;
                _this.emitter.y = _this.sprite.y;
                _this.emitter.xMin = -6;
                _this.emitter.xMax = 6;
                _this.emitter.yMin = 2;
                _this.emitter.yMax = 3;
                _this.emitter.yVelMin = 0.8;
                _this.emitter.yVelMax = 1.4;
                _this.emitter.yAccelMin = 0.004;
                _this.emitter.yAccelMax = 0.008;
                _this.emitter.lifeParticleMin = 30;
                _this.emitter.lifeParticleMax = 40;
                for (var index = 0; index < 60; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(53, 117, 4, 4, 2, 2, 2, 2);
                    _this.emitter.addParticle(particle);
                }
                return _this;
            }
            Block.prototype.onReset = function () {
                this.sprite.enabled = true;
                this.box.enabled = true;
                this.box.renderable = true;
                this.countYSize = this.ySize;
                this.disappearing = false;
                this.emitter.active = false;
                this.setForm();
            };
            Block.prototype.setForm = function () {
                var ySize = Math.ceil(this.countYSize);
                var yTexture = 3 + (this.disappearing ? 19 : 0);
                this.sprite.setFull(this.sprite.enabled, false, this.texture, Game.Scene.xSizeTile, ySize, 0, 0, 79 + (16 - ySize) * 19, yTexture, Game.Scene.xSizeTile, ySize);
                this.box.ySize = ySize;
            };
            Block.prototype.onOverlapUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                if (!this.disappearing) {
                    var overlaps = this.box.collide(Game.Scene.boxesFireEntities, null, false, -1, false, Engine.Box.LAYER_ALL);
                    overlaps = this.box.collide(Game.Scene.boxesFireEntities, overlaps, false, 1, false, Engine.Box.LAYER_ALL);
                    //overlaps = this.box.collide(Scene.boxesEntities, overlaps, true, -1, false, Engine.Box.LAYER_ALL);
                    //overlaps = this.box.collide(Scene.boxesEntities, overlaps, true, 1, false, Engine.Box.LAYER_ALL);
                    if (overlaps != null) {
                        if (overlaps[0].other.data.variant == 0) {
                            Game.Resources.audioPlayerIce.play();
                        }
                        this.disappearing = true;
                        this.emitter.active = true;
                    }
                }
            };
            Block.prototype.onStepUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                if (Game.Scene.nextSceneClass != null) {
                    this.emitter.stop();
                    return;
                }
                if (this.box.enabled && this.disappearing) {
                    this.countYSize -= Block.VEL_DISAPPEAR;
                    if (this.countYSize < 0) {
                        this.countYSize = 0;
                    }
                    this.setForm();
                    if (this.countYSize == 0) {
                        this.sprite.enabled = false;
                        this.box.enabled = false;
                        this.box.renderable = false;
                        this.emitter.active = false;
                    }
                }
            };
            Block.prototype.onTimeUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                if (Game.Scene.nextSceneClass != null) {
                    return;
                }
                if (this.sprite.enabled) {
                    if (!Game.OPTIMIZE_TRANSPARENCY) {
                        this.sprite.setRGBA(1, 1, 1, (this.countYSize + (this.disappearing ? Engine.System.stepExtrapolation : 0)) / this.ySize);
                    }
                }
            };
            Block.prototype.onDrawObjects = function () {
                this.sprite.render();
            };
            Block.VEL_DISAPPEAR = 0.23;
            return Block;
        }(Game.Entity));
        Entities.Block = Block;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
var Utils;
(function (Utils) {
    var Particle = /** @class */ (function (_super) {
        __extends(Particle, _super);
        function Particle() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.index = 0;
            _this.life = 0;
            _this.xOrigin = 0;
            _this.yOrigin = 0;
            _this.x = 0;
            _this.y = 0;
            _this.xVel = 0;
            _this.yVel = 0;
            _this.xAccel = 0;
            _this.yAccel = 0;
            _this.countSteps = 0;
            return _this;
        }
        Particle.prototype.reset = function () {
            this.enabled = false;
            this.sprite.enabled = false;
        };
        Particle.prototype.emit = function (index, life, xOrigin, yOrigin, x, y, xVel, yVel, xAccel, yAccel) {
            this.enabled = true;
            this.sprite.enabled = true;
            if (!Game.OPTIMIZE_TRANSPARENCY) {
                this.sprite.setRGBA(this.sprite.red, this.sprite.green, this.sprite.blue, 1);
            }
            this.index = index;
            this.life = life;
            this.xOrigin = xOrigin;
            this.yOrigin = yOrigin;
            this.x = x;
            this.y = y;
            this.xVel = xVel;
            this.yVel = yVel;
            this.xAccel = xAccel;
            this.yAccel = yAccel;
            this.countSteps = 0;
        };
        Particle.prototype.onReset = function () {
            this.reset();
        };
        Particle.prototype.onStepUpdate = function () {
            if (Game.Scene.paused || Game.Scene.freezed || (Game.Orientation.instance != null && Game.Orientation.instance.blocked) || (Game.LevelAdLoader.instance != null && Game.LevelAdLoader.blocked)) {
                return;
            }
            if (this.enabled && this.countSteps < this.life) {
                this.x += this.xVel;
                this.y += this.yVel;
                this.xVel += this.xAccel;
                this.yVel += this.yAccel;
                this.countSteps += 1;
                if (this.countSteps >= this.life) {
                    this.enabled = false;
                }
            }
        };
        Particle.prototype.onDrawParticlesBack = function () {
            if (!this.front) {
                this.drawParticles();
            }
        };
        Particle.prototype.onDrawParticlesFront = function () {
            if (this.front) {
                this.drawParticles();
            }
        };
        Particle.prototype.drawParticles = function () {
            if (this.enabled) {
                if (!Game.Scene.paused && !Game.Scene.freezed && !(Game.LevelAdLoader.instance != null && Game.LevelAdLoader.blocked) && !(Game.Orientation.instance != null && Game.Orientation.instance.blocked)) {
                    this.sprite.x = this.xOrigin + this.x + this.xVel * Engine.System.stepExtrapolation;
                    this.sprite.y = this.yOrigin + this.y + this.yVel * Engine.System.stepExtrapolation;
                    if (!Game.OPTIMIZE_TRANSPARENCY) {
                        this.sprite.setRGBA(this.sprite.red, this.sprite.green, this.sprite.blue, 1 - (this.countSteps + Engine.System.stepExtrapolation) / this.life);
                    }
                    this.sprite.render();
                }
                else {
                    this.sprite.x = this.xOrigin + this.x;
                    this.sprite.y = this.yOrigin + this.y;
                    if (!Game.OPTIMIZE_TRANSPARENCY) {
                        this.sprite.setRGBA(this.sprite.red, this.sprite.green, this.sprite.blue, 1 - (this.countSteps) / this.life);
                    }
                    this.sprite.render();
                }
            }
        };
        return Particle;
    }(Engine.Entity));
    Utils.Particle = Particle;
})(Utils || (Utils = {}));
///<reference path="../Entity.ts"/>
///<reference path="../../Utils/Particle.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var BoxParticle = /** @class */ (function (_super) {
            __extends(BoxParticle, _super);
            function BoxParticle(xTexture, yTexture, xSizeTexture, ySizeTexture, xSizeMin, xSizeMax, ySizeMin, ySizeMax) {
                var _this = _super.call(this) || this;
                _this.changed = false;
                _this.xTextureNext = 0;
                _this.yTextureNext = 0;
                _this.sprite = new Engine.Sprite();
                _this.xSizeMin = xSizeMin;
                _this.xSizeMax = xSizeMax;
                _this.ySizeMin = ySizeMin;
                _this.ySizeMax = ySizeMax;
                _this.xSizeTexture = xSizeTexture;
                _this.ySizeTexture = ySizeTexture;
                _this.setGraph(xTexture, yTexture);
                return _this;
            }
            BoxParticle.prototype.change = function (xTexture, yTexture) {
                this.changed = true;
                this.xTextureNext = xTexture;
                this.yTextureNext = yTexture;
            };
            BoxParticle.prototype.setGraph = function (xTexture, yTexture) {
                this.sprite.setFull(false, false, Game.Resources.texture, 0, 0, 0, 0, xTexture, yTexture, this.xSizeTexture, this.ySizeTexture);
            };
            BoxParticle.prototype.emit = function (index, life, xOrigin, yOrigin, x, y, xVel, yVel, xAccel, yAccel) {
                _super.prototype.emit.call(this, index, life, xOrigin, yOrigin, x, y, xVel, yVel, xAccel, yAccel);
                if (this.changed) {
                    this.setGraph(this.xTextureNext, this.yTextureNext);
                    this.changed = false;
                }
                //this.sprite.
                this.sprite.xSize = this.xSize = this.xSizeMin + (this.xSizeMax - this.xSizeMin) * Math.random();
                this.sprite.ySize = this.ySize = this.xSize;
                //this.sprite.ySize = this.ySize = this.ySizeMin + (this.ySizeMax - this.ySizeMin) * Math.random();
                this.sprite.xOffset = -this.sprite.xSize * 0.5;
                this.sprite.yOffset = -this.sprite.ySize * 0.5;
            };
            BoxParticle.prototype.onStepUpdate = function () {
                _super.prototype.onStepUpdate.call(this);
                if (Game.Scene.freezed) {
                    return;
                }
                if (this.enabled && this.countSteps < this.life) {
                    this.sprite.xSize = Math.ceil(this.xSize * ((this.life - this.countSteps) / this.life));
                    this.sprite.ySize = Math.ceil(this.ySize * ((this.life - this.countSteps) / this.life));
                    //this.ySize += 0.05;
                    //this.sprite.ySize = Math.ceil(this.ySize);
                    this.sprite.xOffset = -this.sprite.xSize * 0.5;
                    this.sprite.yOffset = -this.sprite.ySize * 0.5;
                }
            };
            BoxParticle.prototype.drawParticles = function () {
                if (!this.enabled && this.changed) {
                    this.setGraph(this.xTextureNext, this.yTextureNext);
                    this.changed = false;
                }
                _super.prototype.drawParticles.call(this);
            };
            return BoxParticle;
        }(Utils.Particle));
        Entities.BoxParticle = BoxParticle;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Blob.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var EnemyBlob = /** @class */ (function (_super) {
            __extends(EnemyBlob, _super);
            function EnemyBlob(def, onFire, variant, patrol) {
                var _this = _super.call(this, def, onFire, variant) || this;
                _this.burnGoal = onFire;
                _this.patrol = patrol;
                _this.velMove = _this.getProperty("vel");
                Game.Scene.boxesEnemies.push(_this.box);
                if (_this.patrol) {
                    _this.patrolBox = new Engine.Box();
                    _this.patrolBox.enabled = true;
                    _this.patrolBox.xSize = 1;
                    _this.patrolBox.ySize = 1;
                }
                return _this;
            }
            EnemyBlob.prototype.onReset = function () {
                _super.prototype.onReset.call(this);
                this.direction = this.sprite.xMirror ? -1 : 1;
            };
            EnemyBlob.prototype.onMoveUpdate = function () {
                _super.prototype.onMoveUpdate.call(this);
                if (Game.Scene.freezed) {
                    return;
                }
                if (this.xHit != 0) {
                    this.direction *= -1;
                }
                if (this.patrol && this.direction != 0 && this.state != EnemyBlob.STATE_ASCEND && this.state != EnemyBlob.STATE_FALL) {
                    this.patrolBox.x = this.box.x;
                    this.patrolBox.y = this.box.y;
                    if (this.direction > 0) {
                        this.patrolBox.x += this.box.xSize * 0.5;
                    }
                    else {
                        this.patrolBox.x -= (this.box.xSize * 0.5 + 1);
                    }
                    var overlaps = this.patrolBox.collide(Game.Scene.boxesTiles, null, true, 0, true, Engine.Box.LAYER_ALL);
                    if (overlaps == null) {
                        this.direction *= -1;
                    }
                }
            };
            EnemyBlob.prototype.onDrawObjects = function () {
                this.sprite.render();
            };
            EnemyBlob.prototype.getMoveDirection = function () {
                return this.direction;
            };
            return EnemyBlob;
        }(Entities.Blob));
        Entities.EnemyBlob = EnemyBlob;
        var FreeEnemyBlob = /** @class */ (function (_super) {
            __extends(FreeEnemyBlob, _super);
            function FreeEnemyBlob(def) {
                return _super.call(this, def, false, 1, false) || this;
            }
            return FreeEnemyBlob;
        }(EnemyBlob));
        Entities.FreeEnemyBlob = FreeEnemyBlob;
        var PatrolEnemyBlob = /** @class */ (function (_super) {
            __extends(PatrolEnemyBlob, _super);
            function PatrolEnemyBlob(def) {
                return _super.call(this, def, false, 2, true) || this;
            }
            return PatrolEnemyBlob;
        }(EnemyBlob));
        Entities.PatrolEnemyBlob = PatrolEnemyBlob;
        var FireFreeEnemyBlob = /** @class */ (function (_super) {
            __extends(FireFreeEnemyBlob, _super);
            function FireFreeEnemyBlob(def) {
                return _super.call(this, def, true, 1, false) || this;
            }
            return FireFreeEnemyBlob;
        }(EnemyBlob));
        Entities.FireFreeEnemyBlob = FireFreeEnemyBlob;
        var FirePatrolEnemyBlob = /** @class */ (function (_super) {
            __extends(FirePatrolEnemyBlob, _super);
            function FirePatrolEnemyBlob(def) {
                return _super.call(this, def, true, 2, true) || this;
            }
            return FirePatrolEnemyBlob;
        }(EnemyBlob));
        Entities.FirePatrolEnemyBlob = FirePatrolEnemyBlob;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Goal = /** @class */ (function (_super) {
            __extends(Goal, _super);
            function Goal(def) {
                var _this = _super.call(this, def) || this;
                _this.variant = -1;
                _this.final = false;
                _this.finalCount = 0;
                Goal.instance = _this;
                Game.Level.goals += 1;
                _this.sprite = new Engine.Sprite;
                _this.sprite.setFull(true, false, Game.Resources.texture, 26, 11, -13, -11, 48, 97, 26, 11);
                _this.sprite.x = def.instance.x + Game.Scene.xSizeTile * 0.5;
                _this.sprite.y = def.instance.y;
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.x = _this.sprite.x;
                _this.box.y = _this.sprite.y;
                _this.box.xSize = 24;
                _this.box.ySize = 8;
                _this.box.xOffset = -_this.box.xSize * 0.5;
                _this.box.yOffset = -_this.box.ySize;
                _this.initEmitters();
                _this.final = _this.getProperty("final");
                return _this;
            }
            Goal.prototype.initEmitters = function () {
                this.emitter0 = new Utils.Emitter();
                this.emitter0.enabled = true;
                this.emitter0.emissionSteps = Game.BLOB_EMISSION;
                this.emitter0.x = this.sprite.x;
                this.emitter0.y = this.sprite.y - 2.5;
                this.emitter0.xMin = -8;
                this.emitter0.xMax = 8;
                this.emitter0.yMin = -5;
                this.emitter0.yMax = -3;
                this.emitter0.yVelMin = -0.6;
                this.emitter0.yVelMax = -1.0;
                this.emitter0.yAccelMin = -0.004;
                this.emitter0.yAccelMax = -0.008;
                this.emitter0.lifeParticleMin = 30;
                this.emitter0.lifeParticleMax = 70;
                for (var index = 0; index < 60; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(196, 139, 4, 4, 4, 4, 3, 4);
                    particle.front = true;
                    this.emitter0.addParticle(particle);
                }
                this.emitter1 = new Utils.Emitter();
                this.emitter1.enabled = true;
                this.emitter1.emissionSteps = Game.BLOB_EMISSION;
                this.emitter1.x = this.sprite.x;
                this.emitter1.y = this.sprite.y - 2.5;
                this.emitter1.xMin = -4;
                this.emitter1.xMax = 4;
                this.emitter1.yMin = -5;
                this.emitter1.yMax = -3;
                this.emitter1.yVelMin = -0.4;
                this.emitter1.yVelMax = -0.8;
                this.emitter1.yAccelMin = -0.002;
                this.emitter1.yAccelMax = -0.006;
                this.emitter1.lifeParticleMin = 30;
                this.emitter1.lifeParticleMax = 60;
                for (var index = 0; index < 40; index += 1) {
                    //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                    var particle = new Entities.BoxParticle(196, 144, 4, 4, 4, 4, 3, 4);
                    particle.front = true;
                    this.emitter1.addParticle(particle);
                }
            };
            Goal.prototype.onReset = function () {
                this.box.enabled = true;
                this.emitter0.active = false;
                this.emitter1.active = false;
                this.variant = -1;
                if (this.getProperty("on")) {
                    this.variant = 0;
                    this.emitter0.active = true;
                    this.emitter1.active = true;
                    for (var _i = 0, _a = this.emitter0.particles; _i < _a.length; _i++) {
                        var particle = _a[_i];
                        particle.change(196, 139 + 14 * this.variant);
                    }
                    for (var _b = 0, _c = this.emitter1.particles; _b < _c.length; _b++) {
                        var particle = _c[_b];
                        particle.change(196, 144 + 14 * this.variant);
                    }
                }
            };
            Goal.prototype.onOverlapUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                if (this.final) {
                    if (Game.Scene.nextSceneClass == null) {
                        if (this.emitter0.active) {
                            this.finalCount += 1;
                            if (this.finalCount == 120) {
                                this.finalCount = 0;
                                this.emitter0.active = false;
                                this.emitter1.active = false;
                            }
                        }
                        else if (this.box.collide(Game.Scene.boxesFireEntities, null, true, 0, true, Engine.Box.LAYER_ALL)) {
                            Game.Resources.audioPlayerFire.play();
                            this.emitter0.active = true;
                            this.emitter1.active = true;
                        }
                    }
                }
                else if (Game.Level.countGoals != Game.Level.goals) {
                    var overlaps = this.box.collide(Game.Scene.boxesFireEntities, null, true, 0, true, Engine.Box.LAYER_ALL);
                    if (overlaps != null) {
                        for (var _i = 0, overlaps_1 = overlaps; _i < overlaps_1.length; _i++) {
                            var overlap = overlaps_1[_i];
                            var blob = overlap.other.data;
                            if (this.variant != blob.variant) {
                                Game.Resources.audioPlayerFire.play();
                                if (this.variant == 0) {
                                    Game.Level.countGoals -= 1;
                                }
                                if (blob.variant == 0) {
                                    Game.Level.countGoals += 1;
                                }
                                this.variant = blob.variant;
                                this.emitter0.active = true;
                                this.emitter1.active = true;
                                for (var _a = 0, _b = this.emitter0.particles; _a < _b.length; _a++) {
                                    var particle = _b[_a];
                                    particle.change(196, 139 + 14 * this.variant);
                                }
                                for (var _c = 0, _d = this.emitter1.particles; _c < _d.length; _c++) {
                                    var particle = _d[_c];
                                    particle.change(196, 144 + 14 * this.variant);
                                }
                                if (Game.Level.countGoals == Game.Level.goals) {
                                    break;
                                }
                            }
                        }
                    }
                }
            };
            Goal.prototype.onStepUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                if (!(Game.Scene.instance instanceof Game.MainMenu) && Game.Scene.nextSceneClass != null) {
                    this.emitter0.stop();
                    this.emitter1.stop();
                }
            };
            Goal.prototype.onDrawGoal = function () {
                this.sprite.render();
                //this.box.render();
            };
            return Goal;
        }(Game.Entity));
        Entities.Goal = Goal;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="Blob.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var ALPHA = 0.6;
        var X_MARGIN_CONTROL = 10;
        var Y_MARGIN_CONTROLS = 5;
        var X_SIZE_CONTROL = 63 + X_MARGIN_CONTROL * 2;
        var Y_SIZE_CONTROL = 100;
        var X_OFFSET_CONTROL = 10;
        var Player = /** @class */ (function (_super) {
            __extends(Player, _super);
            function Player(def) {
                var _this = _super.call(this, def, true, 0) || this;
                _this.stepsCountJump = 0;
                Player.instance = _this;
                _this.velMove = Player.VEL_MOVE;
                _this.burnGoal = true;
                _this.createControlLeft();
                _this.createControlRight();
                _this.createControlJump();
                _this.tryFixTouchControls();
                return _this;
            }
            Object.defineProperty(Player, "x", {
                get: function () {
                    return this.instance.sprite.x;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Player, "y", {
                get: function () {
                    return this.instance.sprite.y;
                },
                enumerable: false,
                configurable: true
            });
            Player.prototype.createControlLeft = function () {
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
                    this.controlLeft.bounds.setRGBA(1, 0, 0, ALPHA);
                    this.controlLeft.freezeable = false;
                    this.spriteControlLeft = new Engine.Sprite();
                    this.spriteControlLeft.enabled = true;
                    this.spriteControlLeft.pinned = true;
                    FRAMES[3].applyToSprite(this.spriteControlLeft);
                    if (!Game.OPTIMIZE_TRANSPARENCY) {
                        this.spriteControlLeft.setRGBA(1, 1, 1, ALPHA);
                    }
                    this.controlLeft.listener = this;
                    this.controlLeft.onPressedDelegate = function () {
                        FRAMES[0].applyToSprite(_this.spriteControlLeft);
                    };
                    this.controlLeft.onReleasedDelegate = function () {
                        FRAMES[3].applyToSprite(_this.spriteControlLeft);
                    };
                }
            };
            Player.prototype.createControlRight = function () {
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
                    this.controlRight.bounds.setRGBA(0, 1, 0, ALPHA);
                    this.controlRight.freezeable = false;
                    this.spriteControlRight = new Engine.Sprite();
                    this.spriteControlRight.enabled = true;
                    this.spriteControlRight.pinned = true;
                    FRAMES[4].applyToSprite(this.spriteControlRight);
                    if (!Game.OPTIMIZE_TRANSPARENCY) {
                        this.spriteControlRight.setRGBA(1, 1, 1, ALPHA);
                    }
                    this.controlRight.listener = this;
                    this.controlRight.onPressedDelegate = function () {
                        FRAMES[1].applyToSprite(_this.spriteControlRight);
                    };
                    this.controlRight.onReleasedDelegate = function () {
                        FRAMES[4].applyToSprite(_this.spriteControlRight);
                    };
                }
            };
            Player.prototype.createControlJump = function () {
                var _this = this;
                this.controlJump = new Game.Control();
                this.controlJump.enabled = true;
                this.controlJump.freezeable = true;
                this.controlJump.listener = this;
                this.controlJump.useKeyboard = true;
                this.controlJump.newInteractionRequired = true;
                this.controlJump.useMouse = false;
                this.controlJump.mouseButtons = [0];
                if (Game.IS_EDGE) {
                    this.controlJump.keys = [Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "Space", "space", "spacebar", " "];
                }
                else {
                    this.controlJump.keys = [Engine.Keyboard.W, Engine.Keyboard.H, Engine.Keyboard.UP, "up", "Up", Engine.Keyboard.SPACE, "Space", "space", "spacebar", " "];
                }
                if (Game.IS_TOUCH) {
                    this.controlJump.useTouch = true;
                    this.controlJump.bounds = new Engine.Sprite();
                    this.controlJump.bounds.enabled = true;
                    this.controlJump.bounds.pinned = true;
                    this.controlJump.bounds.xSize = X_SIZE_CONTROL;
                    this.controlJump.bounds.ySize = Y_SIZE_CONTROL;
                    this.controlJump.bounds.setRGBA(0, 0, 1, ALPHA);
                    this.controlJump.freezeable = false;
                    this.spriteControlJump = new Engine.Sprite();
                    this.spriteControlJump.enabled = true;
                    this.spriteControlJump.pinned = true;
                    FRAMES[5].applyToSprite(this.spriteControlJump);
                    if (!Game.OPTIMIZE_TRANSPARENCY) {
                        this.spriteControlJump.setRGBA(1, 1, 1, ALPHA);
                    }
                    this.controlJump.listener = this;
                    this.controlJump.onPressedDelegate = function () {
                        FRAMES[2].applyToSprite(_this.spriteControlJump);
                    };
                    this.controlJump.onReleasedDelegate = function () {
                        FRAMES[5].applyToSprite(_this.spriteControlJump);
                    };
                }
            };
            Player.prototype.onStepUpdate = function () {
                _super.prototype.onStepUpdate.call(this);
                if (Game.Scene.freezed) {
                    return;
                }
                this.stepsCountJump -= (this.stepsCountJump > 0 ? 1 : 0);
                if (this.controlJump.pressed) {
                    this.stepsCountJump = Player.STEPS_JUMP;
                }
            };
            Player.prototype.tryFixTouchControls = function () {
                if (Game.IS_TOUCH) {
                    this.controlLeft.bounds.x = -Engine.Renderer.xSizeView * 0.5;
                    this.controlLeft.bounds.y = Engine.Renderer.ySizeView * 0.5 - this.controlLeft.bounds.ySize;
                    this.controlRight.bounds.x = this.controlLeft.bounds.x + this.controlLeft.bounds.xSize + X_OFFSET_CONTROL;
                    this.controlRight.bounds.y = Engine.Renderer.ySizeView * 0.5 - this.controlRight.bounds.ySize;
                    this.controlJump.bounds.x = Engine.Renderer.xSizeView * 0.5 - this.controlRight.bounds.xSize;
                    this.controlJump.bounds.y = Engine.Renderer.ySizeView * 0.5 - this.controlRight.bounds.ySize;
                    this.spriteControlLeft.x = this.controlLeft.bounds.x + X_MARGIN_CONTROL;
                    this.spriteControlLeft.y = Engine.Renderer.ySizeView * 0.5 - this.spriteControlLeft.ySize - Y_MARGIN_CONTROLS;
                    this.spriteControlRight.x = this.controlRight.bounds.x + X_MARGIN_CONTROL;
                    this.spriteControlRight.y = Engine.Renderer.ySizeView * 0.5 - this.spriteControlRight.ySize - Y_MARGIN_CONTROLS;
                    this.spriteControlJump.x = this.controlJump.bounds.x + this.controlJump.bounds.xSize - this.spriteControlJump.xSize - X_MARGIN_CONTROL;
                    this.spriteControlJump.y = Engine.Renderer.ySizeView * 0.5 - this.spriteControlJump.ySize - Y_MARGIN_CONTROLS;
                }
            };
            Player.prototype.onDrawPlayer = function () {
                this.sprite.render();
                //this.box.render();
            };
            Player.prototype.onViewUpdate = function () {
                this.tryFixTouchControls();
            };
            Player.prototype.onDrawButtons = function () {
                if (Game.IS_TOUCH) {
                    //this.controlLeft.bounds.render();
                    //this.controlRight.bounds.render();
                    //this.controlJump.bounds.render();
                    this.spriteControlLeft.render();
                    this.spriteControlRight.render();
                    this.spriteControlJump.render();
                }
            };
            Player.prototype.canJump = function () {
                return this.stepsCountJump > 0;
            };
            Player.prototype.getMoveDirection = function () {
                return this.controlLeft.down ? -1 : (this.controlRight.down ? 1 : 0);
            };
            Player.prototype.getWinCondition = function () {
                return Game.Level.countGoals == Game.Level.goals;
            };
            Player.prototype.getLossCondition = function () {
                return this.box.collide(Game.Scene.boxesEnemies, null, true, 0, true, Engine.Box.LAYER_ALL) != null;
            };
            Player.VEL_MOVE = 1.3;
            Player.STEPS_JUMP = 7;
            return Player;
        }(Entities.Blob));
        Entities.Player = Player;
        var FRAMES;
        Game.addAction("configure", function () {
            FRAMES = Game.FrameSelector.complex("player a", Game.Resources.texture, 238, 99);
            FRAMES = Game.FrameSelector.complex("player b", Game.Resources.texture, 409, 439, FRAMES);
            FRAMES = Game.FrameSelector.complex("player c", Game.Resources.texture, 280, 182, FRAMES);
            FRAMES = Game.FrameSelector.complex("player d", Game.Resources.texture, 315, 439, FRAMES);
        });
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Spike = /** @class */ (function (_super) {
            __extends(Spike, _super);
            function Spike(def) {
                var _this = _super.call(this, def) || this;
                _this.sprite = new Engine.Sprite();
                _this.sprite.x = def.instance.x;
                _this.sprite.y = def.instance.y - 16;
                Game.Scene.spritesTiles.push(_this.sprite);
                _this.box0 = new Engine.Box();
                _this.box0.enabled = true;
                _this.box0.renderable = true;
                _this.box0.x = def.instance.x;
                _this.box0.y = def.instance.y - 16;
                Game.Scene.boxesSpikes.push(_this.box0);
                _this.box1 = new Engine.Box();
                _this.box1.enabled = true;
                _this.box1.renderable = true;
                _this.box1.x = def.instance.x;
                _this.box1.y = def.instance.y - 16;
                Game.Scene.boxesSpikes.push(_this.box1);
                switch (_this.getProperty("angle")) {
                    case 0:
                        _this.sprite.setFull(true, false, Game.Resources.texture, 16, 16, 0, 0, 3, 136, 16, 16);
                        _this.box0.x += 3;
                        _this.box0.y += 9;
                        _this.box0.xSize = 11;
                        _this.box0.ySize = 7;
                        _this.box1.x += 6;
                        _this.box1.y += 3;
                        _this.box1.xSize = 5;
                        _this.box1.ySize = 8;
                        break;
                }
                return _this;
            }
            Spike.prototype.onDrawObjects = function () {
                //this.sprite.render();
                //this.box0.render();
                //this.box1.render();
            };
            return Spike;
        }(Game.Entity));
        Entities.Spike = Spike;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var Switch = /** @class */ (function (_super) {
            __extends(Switch, _super);
            function Switch(def) {
                var _this = _super.call(this, def) || this;
                _this.lastFrame = false;
                _this.sprite = new Engine.Sprite();
                _this.sprite.enabled = true;
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.xSize = 10;
                _this.box.ySize = 9;
                _this.variant = _this.getProperty("variant");
                Game.Scene.switches.push(_this);
                return _this;
            }
            Switch.prototype.onReset = function () {
                this.setPressed(this.getProperty("pressed"));
                this.yVel = 0;
                this.sprite.x = this.def.instance.x;
                this.sprite.y = this.def.instance.y - 16;
                this.box.x = this.sprite.x + 3;
                this.box.y = this.sprite.y + 7;
            };
            Switch.prototype.setPressed = function (pressed) {
                this.pressed = pressed;
                this.box.enabled = !pressed;
                this.sprite.setFull(true, false, Game.Resources.texture, 16, 16, 0, 0, 421 + 19 * 2 * (pressed ? 1 : 0), 3 + 19 * this.variant, 16, 16);
            };
            Switch.prototype.onMoveUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                this.yVel += Game.Level.GRAVITY;
                var contacts = this.box.cast(Game.Scene.boxesTiles, null, false, this.yVel, true, Engine.Box.LAYER_ALL);
                this.box.translate(contacts, false, this.yVel, true);
                if (contacts != null) {
                    this.yVel = 0;
                }
            };
            Switch.prototype.onOverlapUpdate = function () {
                if (Game.Scene.freezed) {
                    return;
                }
                if (this.box.enabled && this.box.collide(Game.Scene.boxesBlobs, null, true, 0, true, Engine.Box.LAYER_ALL) != null) {
                    if (!this.lastFrame) {
                        this.lastFrame = true;
                        Game.Resources.audioPlayerSwitch.play();
                    }
                    for (var _i = 0, _a = Game.Scene.switches; _i < _a.length; _i++) {
                        var switchButton = _a[_i];
                        switchButton.change(this.variant);
                    }
                    for (var _b = 0, _c = Game.Scene.switchBlocks; _b < _c.length; _b++) {
                        var switchBlock = _c[_b];
                        switchBlock.change(this.variant);
                    }
                }
                else {
                    this.lastFrame = false;
                }
            };
            Switch.prototype.onTimeUpdate = function () {
                if (Game.Scene.freezed) {
                    this.sprite.x = this.box.x - 3;
                    this.sprite.y = this.box.y - 7;
                }
                else {
                    var point = this.box.getExtrapolation(Game.Scene.boxesTiles, 0, this.yVel, true, Engine.Box.LAYER_ALL);
                    this.sprite.x = point.x - 3;
                    this.sprite.y = point.y - 7;
                }
            };
            Switch.prototype.change = function (variant) {
                if (variant == this.variant) {
                    this.setPressed(!this.pressed);
                }
            };
            Switch.prototype.onDrawSwitchs = function () {
                this.sprite.render();
                //this.box.render();
            };
            return Switch;
        }(Game.Entity));
        Entities.Switch = Switch;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var SwitchBlock = /** @class */ (function (_super) {
            __extends(SwitchBlock, _super);
            function SwitchBlock(def) {
                var _this = _super.call(this, def) || this;
                _this.sprite = new Engine.Sprite();
                _this.sprite.enabled = true;
                _this.sprite.x = def.instance.x;
                _this.sprite.y = def.instance.y - 16;
                Game.Scene.spritesTiles.push(_this.sprite);
                _this.box = new Engine.Box();
                _this.box.enabled = true;
                _this.box.renderable = true;
                _this.box.x = _this.sprite.x;
                _this.box.y = _this.sprite.y;
                _this.box.xSize = 16;
                _this.box.ySize = 16;
                _this.variant = _this.getProperty("variant");
                Game.Scene.boxesTiles.push(_this.box);
                Game.Scene.switchBlocks.push(_this);
                return _this;
            }
            SwitchBlock.prototype.onReset = function () {
                this.setActive(this.getProperty("active"));
            };
            SwitchBlock.prototype.setActive = function (active) {
                this.active = active;
                this.box.enabled = active;
                this.sprite.setFull(true, false, Game.Resources.texture, 16, 16, 0, 0, 421 + 19 + 19 * 2 * (active ? 0 : 1), 3 + 19 * this.variant, 16, 16);
            };
            SwitchBlock.prototype.change = function (variant) {
                if (variant == this.variant) {
                    this.setActive(!this.active);
                }
            };
            SwitchBlock.prototype.onDrawObjects = function () {
                //this.sprite.render();
                //this.box.render();
            };
            return SwitchBlock;
        }(Game.Entity));
        Entities.SwitchBlock = SwitchBlock;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var TitleBlob = /** @class */ (function (_super) {
            __extends(TitleBlob, _super);
            function TitleBlob(def) {
                return _super.call(this, def, true, 0) || this;
            }
            TitleBlob.prototype.onDrawObjects = function () {
                this.sprite.render();
            };
            return TitleBlob;
        }(Entities.Blob));
        Entities.TitleBlob = TitleBlob;
        var LoadBlob = /** @class */ (function (_super) {
            __extends(LoadBlob, _super);
            function LoadBlob(def) {
                return _super.call(this, def, false, 0) || this;
            }
            LoadBlob.prototype.onDrawObjects = function () {
                this.sprite.render();
            };
            return LoadBlob;
        }(Entities.Blob));
        Entities.LoadBlob = LoadBlob;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var JumpTutorial = /** @class */ (function () {
            //@ts-ignore
            function JumpTutorial(def) {
                var text0 = new Utils.Text();
                text0.font = Game.FontManager.a;
                text0.scale = 1;
                text0.enabled = true;
                text0.pinned = true;
                text0.superBack = true;
                text0.str = (Game.IS_EDGE || Game.FORCE_EDGE_TUTORIAL) ? "H - UP ARROW OR SPACE" : "H - W - UP ARROW OR SPACE";
                text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.xAligned = 0;
                text0.yAligned = -240 * 0.25 - 14;
                var text1 = new Utils.Text();
                text1.font = Game.FontManager.a;
                text1.scale = 1;
                text1.enabled = true;
                text1.pinned = true;
                text1.superBack = true;
                text1.str = "TO JUMP";
                text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.xAligned = 0;
                text1.yAligned = text0.y + 13;
                if (Game.IS_TOUCH) {
                    text0.enabled = false;
                    text1.enabled = false;
                }
            }
            return JumpTutorial;
        }());
        Entities.JumpTutorial = JumpTutorial;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var LevelText = /** @class */ (function (_super) {
        __extends(LevelText, _super);
        function LevelText() {
            var _this = _super.call(this) || this;
            _this.text0 = new Utils.Text();
            _this.text0.font = Game.FontManager.a;
            _this.text0.scale = 1;
            _this.text0.enabled = true;
            _this.text0.pinned = true;
            _this.text0.superBack = true;
            _this.text0.front = true;
            _this.text0.str = "LEVEL " + (Game.Level.index < 10 ? "0" : "") + Game.Level.index;
            _this.text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text0.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text0.yAlignView = Utils.AnchorAlignment.START;
            _this.fix();
            _this.text0.yAligned = 5 + 4;
            return _this;
        }
        LevelText.prototype.fix = function () {
            if (Engine.Renderer.xSizeView >= 400) {
                this.text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
                this.text0.xAligned = 0;
            }
            else {
                this.text0.xAlignView = Utils.AnchorAlignment.START;
                this.text0.xAligned = 134 + (Engine.Renderer.xSizeView - 43 - 134) * 0.5;
            }
        };
        LevelText.prototype.onViewUpdate = function () {
            this.fix();
        };
        LevelText.prototype.onStepUpdate = function () {
            this.text0.superBack = !Game.Scene.paused;
        };
        return LevelText;
    }(Engine.Entity));
    Game.LevelText = LevelText;
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var MoveTutorial = /** @class */ (function () {
            //@ts-ignore
            function MoveTutorial(def) {
                var text0 = new Utils.Text();
                text0.font = Game.FontManager.a;
                text0.scale = 1;
                text0.superBack = true;
                text0.enabled = true;
                text0.pinned = true;
                text0.str = (Game.IS_EDGE || Game.FORCE_EDGE_TUTORIAL) ? "ARROW KEYS" : "A-D OR ARROW KEYS";
                text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.xAligned = 0;
                text0.yAligned = -240 * 0.25 + 24 + 8;
                var text1 = new Utils.Text();
                text1.font = Game.FontManager.a;
                text1.scale = 1;
                text1.superBack = true;
                text1.enabled = true;
                text1.pinned = true;
                text1.str = "TO MOVE";
                text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text1.xAligned = 0;
                text1.yAligned = text0.y + 13;
                if (Game.IS_TOUCH) {
                    text0.enabled = false;
                    text1.enabled = false;
                }
            }
            return MoveTutorial;
        }());
        Entities.MoveTutorial = MoveTutorial;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var Entities;
    (function (Entities) {
        var ResetTutorial = /** @class */ (function () {
            //@ts-ignore
            function ResetTutorial(def) {
                var text0 = new Utils.Text();
                text0.font = Game.FontManager.a;
                text0.scale = 1;
                text0.enabled = true;
                text0.pinned = true;
                text0.superBack = true;
                text0.str = "PRESS R TO RESET";
                text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
                text0.xAligned = 0;
                text0.yAligned = -240 * 0.25 - 18;
                if (Game.IS_TOUCH) {
                    text0.enabled = false;
                }
            }
            return ResetTutorial;
        }());
        Entities.ResetTutorial = ResetTutorial;
    })(Entities = Game.Entities || (Game.Entities = {}));
})(Game || (Game = {}));
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
///<reference path="../../Engine/Scene.ts"/>
///<reference path="../Game.ts"/>
var Game;
(function (Game) {
    var Scene = /** @class */ (function (_super) {
        __extends(Scene, _super);
        function Scene() {
            var _this = _super.call(this) || this;
            _this.fillWhite = new Engine.Sprite();
            Scene.instance = _this;
            Scene.fade = Game.SceneFade.init();
            Scene.stepsWait = 0;
            Engine.Renderer.camera(0, 0);
            if (!(Scene.instance instanceof Game.Level)) {
                Scene._paused = false;
                Scene.requirePauseSwitch = false;
            }
            //this.fillBlue.enabled = true;
            //this.fillBlue.pinned = true;
            //this.fillBlue.y = -60 - 8;
            //this.fillBlue.xSize = 160;
            //this.fillBlue.xOffset = -80;
            //this.fillBlue.setRGBA(104 / 255, 68 / 255, 252 / 255, 1);
            //this.fillWhite.enabled = true;
            _this.fillWhite.pinned = true;
            _this.fillWhite.y = 240 * 0.5 + 16;
            _this.fillWhite.xSize = 320;
            _this.fillWhite.xOffset = -160;
            _this.fillWhite.setRGBA(255 / 255, 255 / 255, 255 / 255, 1);
            Engine.Renderer.clearColor(0 / 255, 120 / 255, 255 / 255);
            if (Game.TRACK_ORIENTATION && Game.Orientation.ready) {
                new Game.Orientation();
            }
            return _this;
        }
        Object.defineProperty(Scene, "paused", {
            get: function () {
                return Scene._paused;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Scene, "freezed", {
            get: function () {
                return Scene.nextSceneClass != null || Scene.paused || (Game.Orientation.instance != null && Game.Orientation.instance.blocked) || (Game.LevelAdLoader.instance != null && Game.LevelAdLoader.blocked);
            },
            enumerable: false,
            configurable: true
        });
        Scene.switchPause = function () {
            Scene.requirePauseSwitch = !Scene.requirePauseSwitch;
        };
        Scene.prototype.createMap = function (mapName, skyName, variant, yOffset) {
            if (variant === void 0) { variant = ""; }
            if (yOffset === void 0) { yOffset = 0; }
            this.levels = JSON.parse(Engine.Assets.loadText(Game.Resources.PATH_LEVELS));
            Scene.xCountTiles = this.levels.width;
            Scene.yCountTiles = this.levels.height;
            Scene.spritesTiles = new Array();
            Scene.boxesTiles = new Array();
            Scene.xSizeLevel = this.levels.width * Scene.xSizeTile;
            Scene.ySizeLevel = this.levels.height * Scene.ySizeTile;
            this.skyName = skyName;
            this.createSky(this.levels);
            var level = Game.findInJSON(this.levels.layers, function (layer) {
                return layer.name == mapName + variant;
            });
            if (level == undefined || level == null) {
                level = Game.findInJSON(this.levels.layers, function (layer) {
                    return layer.name == mapName;
                });
            }
            for (var _i = 0, _a = level.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                if (layer.name != "Entities") {
                    var indexTile = 0;
                    for (var yIndex = 0; yIndex < Scene.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < Scene.xCountTiles; xIndex += 1) {
                            if (layer.data[indexTile] != 0) {
                                var x = xIndex * Scene.xSizeTile;
                                var y = yIndex * Scene.ySizeTile + yOffset;
                                Scene.spritesTiles.push(Scene.createSpriteTile(layer.data[indexTile], x, y));
                                //if(x > Scene.xSizeLevel){
                                //    Scene.xSizeLevel = x;
                                //}
                                //if(y > Scene.ySizeLevel){
                                //    Scene.ySizeLevel = y;
                                //}
                            }
                            indexTile += 1;
                        }
                    }
                    if (layer.name == "Terrain") {
                        indexTile = 0;
                        for (var yIndex = 0; yIndex < Scene.yCountTiles; yIndex += 1) {
                            for (var xIndex = 0; xIndex < Scene.xCountTiles; xIndex += 1) {
                                if (layer.data[indexTile] != 0 && Scene.getTileType(layer.data[indexTile]) != "NonSolid") {
                                    var x = xIndex * Scene.xSizeTile;
                                    var y = yIndex * Scene.ySizeTile + yOffset;
                                    var box = new Engine.Box();
                                    box.enabled = true;
                                    box.renderable = true;
                                    box.layer = Engine.Box.LAYER_ALL;
                                    box.x = x;
                                    box.y = y;
                                    box.xSize = Scene.xSizeTile;
                                    box.ySize = Scene.ySizeTile;
                                    Scene.boxesTiles.push(box);
                                }
                                indexTile += 1;
                            }
                        }
                    }
                }
            }
            Scene.boxesSpikes = new Array();
            Scene.boxesBlobs = new Array();
            Scene.boxesFireEntities = new Array();
            Scene.boxesEnemies = Array();
            Scene.switches = new Array();
            Scene.switchBlocks = new Array();
            //Scene.xSizeLevel += Scene.xSizeTile;
            //Scene.ySizeLevel += Scene.ySizeTile;
            var entities = Game.findInJSON(level.layers, function (layer) { return layer.name == "Entities"; }).objects;
            for (var _b = 0, entities_1 = entities; _b < entities_1.length; _b++) {
                var instancedef = entities_1[_b];
                var entitydef = Scene.getEntitydef(instancedef);
                entitydef.instance.y += yOffset;
                Game.Entity.create(entitydef);
            }
        };
        Scene.prototype.createSky = function (levels) {
            Scene.spritesSky = [];
            var sky = Game.findInJSON(levels.layers, function (layer) {
                return layer.name == Scene.instance.skyName;
            });
            this.createSkyPart(sky, 0, 0);
            var xSizeViewExtra = Engine.Renderer.xSizeView - (Engine.Renderer.xSizeViewIdeal + Scene.xSizeTile * 2);
            var xOffset = Engine.Renderer.xSizeViewIdeal + Scene.xSizeTile * 2;
            while (xSizeViewExtra > 0) {
                this.createSkyPart(sky, xOffset, 0);
                this.createSkyPart(sky, -xOffset, 0);
                xSizeViewExtra -= (Engine.Renderer.xSizeViewIdeal + Scene.xSizeTile * 2);
                xOffset += Engine.Renderer.xSizeViewIdeal + Scene.xSizeTile * 2;
            }
        };
        Scene.prototype.createSkyPart = function (sky, xOffset, yOffset) {
            for (var _i = 0, _a = sky.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                var indexTile = 0;
                for (var yIndex = 0; yIndex < Scene.yCountTiles; yIndex += 1) {
                    for (var xIndex = 0; xIndex < Scene.xCountTiles; xIndex += 1) {
                        if (layer.data[indexTile] != 0) {
                            var x = xOffset + xIndex * Scene.xSizeTile;
                            var y = yOffset + yIndex * Scene.ySizeTile;
                            Scene.spritesSky.push(Scene.createSpriteTile(layer.data[indexTile], x, y));
                            //if(x > Scene.xSizeLevel){
                            //    Scene.xSizeLevel = x;
                            //}
                            //if(y > Scene.ySizeLevel){
                            //    Scene.ySizeLevel = y;
                            //}
                        }
                        indexTile += 1;
                    }
                }
            }
        };
        Scene.createSpriteTile = function (indexTile, x, y) {
            var sprite = new Engine.Sprite();
            sprite.x = x;
            sprite.y = y;
            indexTile -= 1;
            var yIndexTile = new Int32Array([indexTile / Scene.tileColumns]);
            var xIndexTile = indexTile - yIndexTile[0] * Scene.tileColumns;
            var xTexture = Scene.offsetTiles + xIndexTile * (Scene.offsetTiles + Scene.xSizeTile);
            var yTexture = Scene.offsetTiles + yIndexTile[0] * (Scene.offsetTiles + Scene.ySizeTile);
            //console.log(yTexture);
            sprite.setFull(true, false, Game.Resources.texture, Scene.xSizeTile, Scene.ySizeTile, 0, 0, xTexture, yTexture, Scene.xSizeTile, Scene.ySizeTile);
            return sprite;
        };
        Scene.getEntitydef = function (instancedef) {
            var typedef = Game.findInJSON(Scene.tiles, function (typedef) {
                var gid = instancedef.gid & ~(Scene.FLIPPED_HORIZONTALLY_FLAG | Scene.FLIPPED_VERTICALLY_FLAG | Scene.FLIPPED_DIAGONALLY_FLAG);
                return typedef.id == gid - 1;
            });
            var entitydef = {};
            entitydef.type = typedef;
            entitydef.instance = instancedef;
            entitydef.flip = {};
            entitydef.flip.x = (instancedef.gid & (instancedef.gid & Scene.FLIPPED_HORIZONTALLY_FLAG)) != 0;
            entitydef.flip.y = (instancedef.gid & (instancedef.gid & Scene.FLIPPED_VERTICALLY_FLAG)) != 0;
            return entitydef;
        };
        Scene.getTileType = function (id) {
            var typedef = Game.findInJSON(Scene.tiles, function (typedef) {
                return typedef.id == id - 1;
            });
            if (typedef != null) {
                return typedef.type;
            }
            return null;
        };
        Scene.prototype.onReset = function () {
            Scene.fade.direction = -1;
            Scene.nextSceneClass = null;
            Scene.waiting = false;
            Scene.countStepsWait = 0;
        };
        Scene.prototype.onStepUpdate = function () {
            if (Scene.requirePauseSwitch) {
                Scene._paused = !Scene._paused;
                Scene.requirePauseSwitch = false;
            }
            if (Scene.waiting) {
                Scene.countStepsWait += 1;
                if (Scene.countStepsWait >= Scene.stepsWait) {
                    if (Scene.nextSceneClass == "reset") {
                        Engine.System.requireReset();
                    }
                    else {
                        Engine.System.nextSceneClass = Scene.nextSceneClass;
                    }
                    this.onEndWaiting();
                }
            }
            else {
                if (Scene.nextSceneClass != null && Scene.fade.direction != 1) {
                    //Scene.fade.direction = 1;
                }
                if (Scene.fade.direction == 1 && Scene.fade.alpha == 1) {
                    Scene.waiting = true;
                    this.onStartWaiting();
                }
            }
        };
        Scene.prototype.onStartWaiting = function () {
        };
        Scene.prototype.onEndWaiting = function () {
        };
        Scene.prototype.onSceneLateUpdate = function () {
        };
        Scene.prototype.onTimeUpdate = function () {
        };
        Scene.prototype.onViewUpdate = function () {
            this.createSky(this.levels);
        };
        Scene.prototype.onDrawScene = function () {
            for (var _i = 0, _a = Scene.spritesSky; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.render();
            }
            for (var _b = 0, _c = Scene.spritesTiles; _b < _c.length; _b++) {
                var sprite = _c[_b];
                sprite.render();
            }
            //if(Engine.Renderer.xFitView){
            //if(this.fillBlue.enabled){
            //    this.fillBlue.ySize = Engine.Renderer.ySizeView;
            //    this.fillBlue.yOffset = -Engine.Renderer.ySizeView;
            //    this.fillBlue.render();
            //}
            if (this.fillWhite.enabled) {
                this.fillWhite.ySize = Engine.Renderer.ySizeView;
                this.fillWhite.render();
            }
            //}
            for (var _d = 0, _e = Scene.boxesTiles; _d < _e.length; _d++) {
                var box = _e[_d];
                box.render();
            }
        };
        Scene.FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
        Scene.FLIPPED_VERTICALLY_FLAG = 0x40000000;
        Scene.FLIPPED_DIAGONALLY_FLAG = 0x20000000;
        Scene.stepsWait = 0;
        Scene.countStepsWait = 0;
        Scene.spritesSky = new Array();
        Scene.spritesTiles = new Array();
        Scene.boxesTiles = new Array();
        Scene.boxesEnemies = new Array();
        Scene.boxesSpikes = new Array();
        Scene.switches = new Array();
        Scene.switchBlocks = new Array();
        Scene.boxesBlobs = new Array();
        Scene.boxesFireEntities = new Array();
        Scene.offsetTiles = 0;
        Scene.maxLevels = 0;
        Scene.xSizeLevel = 0;
        Scene.ySizeLevel = 0;
        Scene.xSizeTile = 0;
        Scene.ySizeTile = 0;
        Scene.requirePauseSwitch = false;
        Scene._paused = false;
        return Scene;
    }(Engine.Scene));
    Game.Scene = Scene;
    Game.addAction("preinit", function () {
        var tileset = JSON.parse(Engine.Assets.loadText(Game.Resources.PATH_TILESET));
        //Engine.Texture.load(Resources.PATH_TEXTURE_GRAPHICS_0).preserved = true;
        Scene.tiles = tileset.tiles;
        Scene.xSizeTile = tileset.tilewidth;
        Scene.ySizeTile = tileset.tileheight;
        Scene.tileColumns = tileset.columns;
        Scene.offsetTiles = tileset.margin;
    });
})(Game || (Game = {}));
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    var Credits = /** @class */ (function (_super) {
        __extends(Credits, _super);
        function Credits() {
            var _this = _super.call(this) || this;
            Game.Resources.playBGM();
            new Game.MusicButton();
            new Game.SoundButton();
            _this.createMap("Credits", "Sky Main");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            _this.buttonBackGraph = new Engine.Sprite();
            _this.buttonBackGraph.setFull(true, true, Game.Resources.texture, 53, 20, -53 * 0.5, -10, 290, 323, 53, 20);
            _this.buttonBackGraph.x = 0;
            _this.buttonBackGraph.y = 240 * 0.25 + 23 + 12 + 3 + 9 - 5 - 50 + 10;
            _this.buttonBack = new Game.TextButton();
            _this.buttonBack.text.font = Game.FontManager.a;
            _this.buttonBack.text.enabled = true;
            _this.buttonBack.text.pinned = true;
            _this.buttonBack.text.str = "BACK";
            _this.buttonBack.control.bounds = _this.buttonBackGraph;
            _this.buttonBack.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.text.xAligned = _this.buttonBackGraph.x;
            _this.buttonBack.text.yAligned = _this.buttonBackGraph.y;
            _this.buttonBack.control.useKeyboard = true;
            _this.buttonBack.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            //this.buttonBack.button.yOffset = 0;
            _this.buttonBack.control.listener = {};
            _this.buttonBack.control.onPressedDelegate = function () {
                if (Game.Scene.nextSceneClass == null) {
                    Game.Scene.nextSceneClass = Game.MainMenu;
                }
            };
            _this.dialog = new Engine.Sprite();
            _this.dialog.setFull(true, true, Game.Resources.texture, 240 + 8, 164 + 8 + 9, -120 - 4, -82 - 4, 30, 182, 240 + 8, 164 + 8 + 9);
            _this.dialog.y = -10 + 50 - 10;
            var devone = new Utils.Text();
            devone.font = Game.FontManager.a;
            devone.scale = 1;
            devone.enabled = true;
            devone.pinned = true;
            devone.str = "CREATED BY:";
            devone.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            devone.xAlignView = Utils.AnchorAlignment.MIDDLE;
            devone.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            devone.yAlignView = Utils.AnchorAlignment.MIDDLE;
            devone.xAligned = 0;
            devone.yAligned = _this.dialog.y - 20 - 53;
            var devtwo = new Game.TextButton();
            devtwo.arrows.enabled = false;
            devtwo.text.font = Game.FontManager.a;
            devtwo.text.enabled = true;
            devtwo.text.pinned = true;
            devtwo.text.str = "KEZARTS";
            devtwo.control.url = null;
            devtwo.text.underlined = false;
            devtwo.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            devtwo.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            devtwo.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            devtwo.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            devtwo.text.yAligned = devone.y + 16;
            var musone = new Utils.Text();
            musone.font = Game.FontManager.a;
            musone.scale = 1;
            musone.enabled = true;
            musone.pinned = true;
            musone.str = "MUSIC:";
            musone.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            musone.xAlignView = Utils.AnchorAlignment.MIDDLE;
            musone.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            musone.yAlignView = Utils.AnchorAlignment.MIDDLE;
            musone.xAligned = 0;
            musone.yAligned = devtwo.text.y + 20;
            var mustwo = new Game.TextButton();
            mustwo.arrows.enabled = false;
            mustwo.text.font = Game.FontManager.a;
            mustwo.text.enabled = true;
            mustwo.text.pinned = true;
            mustwo.text.str = "EMMA_MA";
            mustwo.control.url = null;
            mustwo.text.underlined = false;
            mustwo.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            mustwo.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            mustwo.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            mustwo.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            mustwo.text.yAligned = musone.y + 16;
            var thuone = new Utils.Text();
            thuone.font = Game.FontManager.a;
            thuone.scale = 1;
            thuone.enabled = true;
            thuone.pinned = true;
            thuone.str = "THUMBNAIL:";
            thuone.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thuone.xAlignView = Utils.AnchorAlignment.MIDDLE;
            thuone.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thuone.yAlignView = Utils.AnchorAlignment.MIDDLE;
            thuone.xAligned = 0;
            thuone.yAligned = mustwo.text.y + 20;
            var thutwo = new Utils.Text();
            thutwo.font = Game.FontManager.a;
            thutwo.scale = 1;
            thutwo.enabled = true;
            thutwo.pinned = true;
            thutwo.str = "DEUSBEHEMOTH";
            thutwo.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thutwo.xAlignView = Utils.AnchorAlignment.MIDDLE;
            thutwo.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thutwo.yAlignView = Utils.AnchorAlignment.MIDDLE;
            thutwo.xAligned = 0;
            thutwo.yAligned = thuone.y + 15;
            _this.fillWhite.enabled = true;
            Engine.Renderer.clearColor(104 / 255, 68 / 255, 252 / 255);
            Game.triggerActions("credits");
            return _this;
        }
        Credits.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            this.dialog.render();
            this.buttonBackGraph.render();
        };
        return Credits;
    }(Game.Scene));
    Game.Credits = Credits;
})(Game || (Game = {}));
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    Game.TEXT_DESKTOP_CONTINUE_EXIT = "ESC OR CLICK HERE TO EXIT";
    var LastScene = /** @class */ (function (_super) {
        __extends(LastScene, _super);
        function LastScene() {
            var _this = _super.call(this) || this;
            LastScene.instance = _this;
            new Game.MusicButton();
            new Game.SoundButton();
            new Game.ExitButton();
            _this.createMap("End Screen", "Sky Main", Game.IS_TOUCH ? " - Touch" : "");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            var thanksText = new Utils.Text();
            thanksText.font = Game.FontManager.a;
            thanksText.scale = 2;
            thanksText.enabled = true;
            thanksText.pinned = true;
            thanksText.str = "THANKS FOR PLAYING!";
            thanksText.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thanksText.xAlignView = Utils.AnchorAlignment.MIDDLE;
            thanksText.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            thanksText.yAlignView = Utils.AnchorAlignment.MIDDLE;
            thanksText.xAligned = 0;
            thanksText.yAligned = -Engine.Renderer.ySizeViewIdeal * 0.25 - 23;
            var gameBy = new Utils.Text();
            gameBy.font = Game.FontManager.a;
            gameBy.scale = 1;
            gameBy.enabled = true;
            gameBy.pinned = true;
            gameBy.str = Game.HAS_LINKS_KEZARTS ? "A GAME BY KEZARTS:" : "A GAME BY";
            gameBy.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            gameBy.xAlignView = Utils.AnchorAlignment.MIDDLE;
            gameBy.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            gameBy.yAlignView = Utils.AnchorAlignment.MIDDLE;
            gameBy.xAligned = 0;
            gameBy.yAligned = thanksText.y + 25 + 22 - 5 + 1;
            _this.text1 = new Game.TextButton();
            _this.text1.arrows.enabled = Game.HAS_LINKS_KEZARTS;
            _this.text1.text.font = Game.FontManager.a;
            _this.text1.text.enabled = true;
            _this.text1.text.pinned = true;
            _this.text1.text.str = Game.HAS_LINKS_KEZARTS ? "KEZARTS.COM" : "KEZARTS";
            _this.text1.control.url = Game.HAS_LINKS_KEZARTS ? Game.URL_KEZARTS : null;
            _this.text1.text.underlined = Game.HAS_LINKS_KEZARTS;
            _this.text1.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text1.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text1.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text1.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text1.text.yAligned = gameBy.y + 16;
            //this.text1.button.yOffset = 0;
            _this.text1.control.onSelectionStayDelegate = function () {
                if (Game.HAS_LINKS_KEZARTS) {
                    Engine.Renderer.useHandPointer = true;
                }
            };
            var continueText0 = new Utils.Text();
            continueText0.font = Game.FontManager.a;
            continueText0.scale = 1;
            continueText0.enabled = true;
            continueText0.pinned = true;
            continueText0.str = Game.IS_TOUCH ? "PRESS THE EXIT BUTTON" : "PRESS ESC OR CLICK";
            continueText0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            continueText0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            continueText0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            continueText0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            continueText0.xAligned = 0;
            continueText0.yAligned = 93 + 6 - (Game.IS_TOUCH ? 83 : 0);
            var continueText1 = new Utils.Text();
            continueText1.font = Game.FontManager.a;
            continueText1.scale = 1;
            continueText1.enabled = true;
            continueText1.pinned = true;
            continueText1.str = "TO CONTINUE";
            continueText1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            continueText1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            continueText1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            continueText1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            continueText1.xAligned = 0;
            continueText1.yAligned = continueText0.y + 13;
            if (Game.IS_TOUCH) {
                continueText0.superBack = true;
                continueText1.superBack = true;
            }
            //this.start.control.onPressedDelegate = this.startPressed;
            _this.fillWhite.enabled = true;
            Engine.Renderer.clearColor(104 / 255, 68 / 255, 252 / 255);
            Game.triggerActions("endscreen");
            new Game.LevelAdLoader();
            return _this;
        }
        LastScene.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (Game.Scene.nextSceneClass == null) {
                if (!this.text1.control.selected || !Game.HAS_LINKS_KEZARTS || Game.IS_TOUCH) {
                    if (Game.IS_TOUCH) {
                        if (Game.ExitButton.instance.control.pressed) {
                            Game.triggerActions("exitlastlevel");
                            Game.Scene.nextSceneClass = Game.MainMenu;
                        }
                    }
                    else {
                        if (Game.ExitButton.instance.control.pressed || Engine.Mouse.down(0)) {
                            Game.triggerActions("exitlastlevel");
                            Game.Scene.nextSceneClass = Game.MainMenu;
                        }
                    }
                }
            }
        };
        LastScene.prototype.onClearScene = function () {
            LastScene.instance = null;
        };
        LastScene.instance = null;
        return LastScene;
    }(Game.Scene));
    Game.LastScene = LastScene;
})(Game || (Game = {}));
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    var STEPS_AD_TIME_FIRST = 30 * 60;
    var STEPS_AD_TIME_REGULAR = 110 * 60;
    var Level = /** @class */ (function (_super) {
        __extends(Level, _super);
        /*
        resetButton : ResetButton;
        exitButton : ExitButton;
        */
        function Level() {
            var _this = _super.call(this) || this;
            _this.winSaved = false;
            _this.exiting = false;
            _this.shaking = false;
            Level.goals = 0;
            Level.index = Level.nextIndex;
            Level.nextIndex = Level.index + 1;
            Game.Resources.playBGM();
            new Game.MusicButton();
            new Game.SoundButton();
            new Game.PauseButton();
            new Game.ResetButton();
            new Game.ExitButton();
            new Game.LevelText();
            _this.shake = new Utils.Shake();
            _this.shake.velocity = 2;
            _this.shake.distance = 2;
            _this.shake.minDistance = 0.01;
            _this.shake.reduction = 0.8;
            Game.triggerActions("level");
            var yOffset = 0;
            if (Game.IS_TOUCH) {
                switch (Level.index) {
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 10:
                    case 12:
                    case 13:
                    case 14:
                    case 15:
                    case 17:
                    case 21:
                    case 22:
                    case 25:
                        yOffset = -16;
                        break;
                    case 7:
                    case 8:
                    case 9:
                    case 11:
                    case 18:
                    case 20:
                    case 23:
                    case 26:
                    case 27:
                        yOffset = -32;
                        break;
                    case 28:
                        yOffset = -20;
                        break;
                }
            }
            _this.createMap("Level " + Level.index, "Sky Main", Game.IS_TOUCH ? " - Touch" : "", yOffset);
            //this.createMap("Level Test", "Sky Main");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            _this.fillPause = new Engine.Sprite();
            _this.fillPause.enabled = true;
            _this.fillPause.pinned = true;
            _this.fillPause.setRGBA(104 / 255, 68 / 255, 252 / 255, 0.7);
            _this.onViewUpdate();
            _this.textPause = new Utils.Text();
            _this.textPause.font = Game.FontManager.a;
            _this.textPause.scale = 1;
            _this.textPause.enabled = false;
            _this.textPause.pinned = true;
            _this.textPause.str = "PAUSED";
            _this.textPause.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.textPause.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.textPause.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.textPause.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.textPause.xAligned = 0;
            _this.textPause.yAligned = 0;
            _this.fillWhite.enabled = true;
            Engine.Renderer.clearColor(104 / 255, 68 / 255, 252 / 255);
            //triggerActions("level");
            new Game.LevelAdLoader();
            return _this;
        }
        Level.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.winSaved = false;
            this.shake.stop();
            this.shaking = false;
            Level.countGoals = 0;
            //triggerActions("play");
        };
        Level.prototype.onViewUpdate = function () {
            _super.prototype.onViewUpdate.call(this);
            this.fillPause.x = -Engine.Renderer.xSizeView * 0.5;
            this.fillPause.y = -Engine.Renderer.ySizeView * 0.5;
            this.fillPause.xSize = Engine.Renderer.xSizeView;
            this.fillPause.ySize = Engine.Renderer.ySizeView;
        };
        Level.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (!this.winSaved && Game.Entities.Player.instance.winning) {
                Game.levelStates[Level.index - 1] = "cleared";
                Engine.Data.save("level" + (Level.index - 1), "cleared", 60);
                if (Game.levelStates[Level.nextIndex - 1] == "") {
                    Engine.Data.save("level" + (Level.nextIndex - 1), "unlocked", 60);
                    Game.levelStates[Level.nextIndex - 1] = "unlocked";
                }
                Game.triggerActions("savegame");
                this.winSaved = true;
            }
            if (Game.Scene.nextSceneClass == null && Game.Entities.Player.instance.win) {
                if (Level.index == 28) {
                    Game.Scene.nextSceneClass = Game.LastScene;
                    Game.triggerActions("winlastlevel");
                }
                else {
                    Game.Scene.nextSceneClass = Level;
                    Game.triggerActions("playlevelbutton");
                    Game.triggerActions("winlevel");
                }
                Game.triggerActions("lose");
            }
            if (Game.Scene.nextSceneClass == null && Game.Entities.Player.instance.lose) {
                Game.Scene.nextSceneClass = "reset";
                Game.Scene.stepsWait = 0;
                Game.triggerActions("loselevel");
                Game.triggerActions("lose");
            }
            //console.log("TODO: UNCOMENT BELLOW AND ADD SPEEDRUN EXCEPTIONS");
            if (Game.ResetButton.instance != null && Game.ResetButton.instance.control.pressed && Game.Scene.nextSceneClass != "reset" && !this.exiting) {
                Game.Scene.nextSceneClass = "reset";
                Game.Scene.stepsWait = 0;
                Game.triggerActions("resetlevelbutton");
                Game.triggerActions("resetlevel");
                Game.triggerActions("lose");
            }
            if (Game.ExitButton.instance != null && Game.ExitButton.instance.control.pressed && !this.exiting) {
                Game.Scene.stepsWait = Game.STEPS_CHANGE_SCENE;
                Game.Scene.nextSceneClass = Game.LevelSelection;
                Game.Scene.stepsWait = Game.STEPS_CHANGE_SCENE;
                this.exiting = true;
                Game.triggerActions("exitlevel");
                Game.triggerActions("lose");
            }
            if (!this.shaking && Game.Entities.Player.instance.losing) {
                this.shake.start(1);
                this.shaking = true;
            }
            if (Level.countStepsAdTime > 0) {
                Level.countStepsAdTime -= 1;
            }
        };
        Level.prototype.onTimeUpdateSceneBeforeDrawFixed = function () {
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x + this.shake.position, y);
        };
        Level.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            /*
            var x = Entities.Player.x;
            if(Scene.xSizeLevel - Scene.xSizeTile * 2 < Engine.Renderer.xSizeView){
                x = Scene.xSizeLevel * 0.5;
            }
            else if(x < Engine.Renderer.xSizeView * 0.5 + Scene.xSizeTile){
                x = Engine.Renderer.xSizeView * 0.5 + Scene.xSizeTile;
            }
            else if(x > Scene.xSizeLevel - Engine.Renderer.xSizeView * 0.5 - Scene.xSizeTile){
                x = Scene.xSizeLevel - Engine.Renderer.xSizeView * 0.5 - Scene.xSizeTile;
            }
            var y = Entities.Player.y;
            if(Scene.ySizeLevel < Engine.Renderer.ySizeView){
                y = Scene.ySizeLevel * 0.5;
            }
            else if(y < Engine.Renderer.ySizeView * 0.5){
                y = Engine.Renderer.ySizeView * 0.5;
            }
            else if(y > Scene.ySizeLevel - Engine.Renderer.ySizeView * 0.5){
                y = Scene.ySizeLevel - Engine.Renderer.ySizeView * 0.5;
            }
            Engine.Renderer.camera(x + this.shake.position, y);
            */
        };
        ;
        Level.prototype.onDrawPause = function () {
            if (Game.Scene.paused) {
                if (!this.textPause.enabled) {
                    this.textPause.enabled = true;
                }
                this.fillPause.render();
            }
            else {
                if (this.textPause.enabled) {
                    this.textPause.enabled = false;
                }
            }
        };
        Level.prototype.onStartWaiting = function () {
            _super.prototype.onStartWaiting.call(this);
            if (!Level.speedrun) {
                Level.tryTriggerTimeAd();
            }
        };
        Level.tryTriggerTimeAd = function () {
            if (Level.countStepsAdTime <= 0) {
                if (Level.listenerAdTime != null) {
                    Level.listenerAdTime();
                }
                Game.MainMenu.clearAds();
                Level.countStepsAdTime = STEPS_AD_TIME_REGULAR;
            }
        };
        Level.clearAds = function () {
            Level.countStepsAdTime = STEPS_AD_TIME_REGULAR;
        };
        Level.GRAVITY = 0.2;
        Level.STATE_PLAYING = 1;
        Level.STATE_RESETING = 2;
        Level.STATE_EXITING = 3;
        Level.STATE_WAIT_AFTER_EXITING = 4;
        Level.STATE_WINNING = 5;
        Level.STATE_TO_NEXT_LEVEL = 6;
        Level.STATE_LOSE = 7;
        Level.countStepsAdTime = STEPS_AD_TIME_FIRST;
        Level.listenerAdTime = null;
        Level.listenerAdSpeedrun = null;
        Level.nextIndex = 1;
        return Level;
    }(Game.Scene));
    Game.Level = Level;
})(Game || (Game = {}));
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    var LevelSelection = /** @class */ (function (_super) {
        __extends(LevelSelection, _super);
        function LevelSelection() {
            var _this = _super.call(this) || this;
            LevelSelection.instance = _this;
            new Game.MusicButton();
            new Game.SoundButton();
            _this.buttonGraphs = new Array();
            _this.buttons = new Array();
            for (var j = 0; j < 4; j += 1) {
                for (var i = 0; i < 7; i += 1) {
                    var sprite = new Engine.Sprite();
                    sprite.setFull(true, true, Game.Resources.texture, 39, 20, -39 * 0.5, -10, 379, 344, 39, 20);
                    sprite.x = (sprite.xSize + 5) * i - (sprite.xSize + 5) * 3;
                    sprite.y = (sprite.ySize + 5) * j - (sprite.ySize + 5) * 1.5;
                    _this.buttonGraphs.push(sprite);
                    var button = new Game.TextButton();
                    button = new Game.TextButton();
                    button.text.font = Game.FontManager.a;
                    button.text.enabled = true;
                    button.text.pinned = true;
                    button.text.str = (j * 7 + i + 1) + "";
                    button.control.bounds = sprite;
                    button.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                    button.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
                    button.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                    button.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
                    button.text.xAligned = sprite.x;
                    button.text.yAligned = sprite.y;
                    //button.button.yOffset = 0;
                    button.control.listener = {};
                    button.control.listener.index = j * 7 + i + 1;
                    button.control.onPressedDelegate = function () {
                        if (Game.Scene.nextSceneClass == null) {
                            var that = this;
                            Game.Level.nextIndex = that.index;
                            Game.Scene.nextSceneClass = Game.Level;
                            Game.triggerActions("playlevelbutton");
                            Game.triggerActions("play");
                        }
                    };
                    _this.buttons.push(button);
                }
            }
            _this.buttonBackGraph = new Engine.Sprite();
            _this.buttonBackGraph.setFull(true, true, Game.Resources.texture, 53, 20, -53 * 0.5, -10, 290, 323, 53, 20);
            _this.buttonBackGraph.x = 0;
            _this.buttonBackGraph.y = 240 * 0.25 + 23;
            _this.buttonBack = new Game.TextButton();
            _this.buttonBack.text.font = Game.FontManager.a;
            _this.buttonBack.text.enabled = true;
            _this.buttonBack.text.pinned = true;
            _this.buttonBack.text.str = "BACK";
            _this.buttonBack.control.bounds = _this.buttonBackGraph;
            _this.buttonBack.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonBack.text.xAligned = _this.buttonBackGraph.x;
            _this.buttonBack.text.yAligned = _this.buttonBackGraph.y;
            _this.buttonBack.control.useKeyboard = true;
            _this.buttonBack.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            //this.buttonBack.button.yOffset = 0;
            _this.buttonBack.control.onPressedDelegate = function () {
                if (Game.Scene.nextSceneClass == null) {
                    Game.Scene.nextSceneClass = Game.MainMenu;
                }
            };
            _this.textSelect = new Utils.Text();
            _this.textSelect.font = Game.FontManager.a;
            _this.textSelect.scale = 2;
            _this.textSelect.enabled = true;
            _this.textSelect.pinned = true;
            _this.textSelect.str = "SELECT LEVEL";
            _this.textSelect.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.textSelect.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.textSelect.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.textSelect.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.textSelect.xAligned = 0;
            _this.textSelect.yAligned = -240 * 0.25 - 23;
            _this.createMap("Level Selection", "Sky Main");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            //this.fillBlue.enabled = true;
            _this.fillWhite.enabled = true;
            Engine.Renderer.clearColor(104 / 255, 68 / 255, 252 / 255);
            _this.fix();
            Game.triggerActions("levelselection");
            return _this;
        }
        LevelSelection.prototype.fix = function () {
            for (var i = 0; i < this.buttonGraphs.length; i += 1) {
                if (Game.levelStates[i] == "") {
                    this.buttonGraphs[i].setFull(true, true, Game.Resources.texture, 39, 20, -39 * 0.5, -10, 379, 344, 39, 20);
                    this.buttonGraphs[i].setRGBA(1, 1, 1, 0.2);
                    this.buttonGraphs[i].setRGBA(1, 1, 1, 0.2);
                    this.buttons[i].control.enabled = false;
                }
                else if (Game.levelStates[i] == "unlocked") {
                    this.buttonGraphs[i].setFull(true, true, Game.Resources.texture, 39, 20, -39 * 0.5, -10, 379, 344, 39, 20);
                    this.buttonGraphs[i].setRGBA(1, 1, 1, 1);
                    this.buttonGraphs[i].setRGBA(1, 1, 1, 1);
                    this.buttons[i].control.enabled = true;
                }
                else {
                    this.buttonGraphs[i].setFull(true, true, Game.Resources.texture, 39, 20, -39 * 0.5, -10, 339, 344, 39, 20);
                    this.buttonGraphs[i].setRGBA(1, 1, 1, 1);
                    this.buttonGraphs[i].setRGBA(1, 1, 1, 1);
                    this.buttons[i].control.enabled = true;
                }
            }
        };
        LevelSelection.prototype.onStepUpdate = function () {
            _super.prototype.onStepUpdate.call(this);
            if (!LevelSelection.allLevelsUnlocked && Game.allLevelsUnlocked) {
                this.fix();
                LevelSelection.allLevelsUnlocked = true;
            }
        };
        LevelSelection.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            for (var i = 0; i < this.buttonGraphs.length; i += 1) {
                this.buttonGraphs[i].render();
            }
            this.buttonBackGraph.render();
        };
        LevelSelection.allLevelsUnlocked = false;
        return LevelSelection;
    }(Game.Scene));
    Game.LevelSelection = LevelSelection;
})(Game || (Game = {}));
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    var MainMenu = /** @class */ (function (_super) {
        __extends(MainMenu, _super);
        function MainMenu() {
            var _this = _super.call(this) || this;
            new Game.MusicButton();
            new Game.SoundButton();
            if (!MainMenu.notFirst) {
                Game.Scene.fade.speed = 0.0166666666666667 * 1;
                MainMenu.notFirst = true;
            }
            _this.title = new Engine.Sprite();
            _this.title.setFull(true, true, Game.Resources.texture, 152, 26, -152 * 0.5, -26 * 0.5, 80, 105, 152, 26);
            _this.title.y = -240 * 0.25 - 16 + 10 - 5;
            if (!Game.OPTIMIZE_TRANSPARENCY) {
                _this.title.setRGBA(1, 1, 1, 0.7);
            }
            _this.spritesButton = new Array();
            for (var i = 0; i < (Game.HAS_LINKS ? 3 : 2); i += 1) {
                var sprite = new Engine.Sprite();
                sprite.enabled = true;
                sprite.pinned = true;
                if (MainMenu.LONG_BUTTON) {
                    sprite.setFull(true, true, Game.Resources.texture, 84, 20, -84 * 0.5, -10, 265, 413, 84, 20);
                }
                else {
                    sprite.setFull(true, true, Game.Resources.texture, 74, 20, -74 * 0.5, -10, 344, 323, 74, 20);
                }
                //sprite.x = -94 + i * 94;
                if (Game.HAS_LINKS) {
                    sprite.y = -25 + 25 * i;
                }
                else {
                    sprite.y = 2.5 - 8 + 25 * i;
                }
                _this.spritesButton.push(sprite);
            }
            _this.createMap("Main Menu", "Sky Main");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            _this.initEmitters();
            _this.kezarts = new Game.TextButton();
            _this.kezarts.arrows.enabled = Game.HAS_LINKS_KEZARTS;
            _this.kezarts.text.font = Game.FontManager.a; //HAS_LINKS_KEZARTS ? FontManager.a : FontManager.a;
            _this.kezarts.text.str = Game.HAS_LINKS_KEZARTS ? Game.TEXT_KEZARTS : "BY KEZARTS";
            _this.kezarts.control.url = Game.HAS_LINKS_KEZARTS && !Game.REMOVE_LINKS_TITTLE ? Game.URL_KEZARTS : null;
            _this.kezarts.text.underlined = Game.HAS_LINKS_KEZARTS && !Game.REMOVE_LINKS_TITTLE;
            _this.kezarts.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.yAligned = 105;
            _this.kezarts.text.enabled = !Game.REMOVE_LINKS_TITTLE;
            //this.kezarts.button.yOffset = 0;
            _this.kezarts.control.onSelectionStayDelegate = function () {
                if (Game.HAS_LINKS_KEZARTS && !Game.REMOVE_LINKS_TITTLE) {
                    Engine.Renderer.useHandPointer = true;
                }
            };
            _this.buttonStart = new Game.TextButton();
            _this.buttonStart.text.font = Game.FontManager.a;
            _this.buttonStart.text.str = "START";
            _this.buttonStart.control.bounds = _this.spritesButton[0];
            _this.buttonStart.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonStart.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonStart.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonStart.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonStart.text.yAligned = _this.spritesButton[0].y;
            //this.buttonStart.button.yOffset = 0;
            _this.buttonStart.control.onPressedDelegate = function () {
                if (Game.Scene.nextSceneClass == null) {
                    Game.Scene.fade.red = 1;
                    Game.Scene.fade.green = 1;
                    Game.Scene.fade.blue = 1;
                    Game.Scene.fade.speed = 0.0166666666666667 * 3;
                    Game.Scene.nextSceneClass = Game.LevelSelection;
                    Game.triggerActions("playbutton");
                }
            };
            _this.buttonCredits = new Game.TextButton();
            _this.buttonCredits.text.font = Game.FontManager.a;
            _this.buttonCredits.text.str = "CREDITS";
            _this.buttonCredits.control.bounds = _this.spritesButton[1];
            _this.buttonCredits.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonCredits.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonCredits.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.buttonCredits.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.buttonCredits.text.yAligned = _this.spritesButton[1].y;
            //this.buttonCredits.button.yOffset = 0;
            _this.buttonCredits.control.onPressedDelegate = function () {
                if (Game.Scene.nextSceneClass == null) {
                    Game.Scene.fade.red = 1;
                    Game.Scene.fade.green = 1;
                    Game.Scene.fade.blue = 1;
                    Game.Scene.fade.speed = 0.0166666666666667 * 3;
                    Game.Scene.nextSceneClass = Game.Credits;
                }
            };
            if (Game.HAS_LINKS) {
                _this.moregames = new Game.TextButton();
                _this.moregames.text.font = Game.FontManager.a;
                _this.moregames.text.str = MainMenu.STR_MORE_GAMES;
                _this.moregames.control.url = Game.URL_MORE_GAMES;
                //this.moregames.underlined = true;
                _this.moregames.control.bounds = _this.spritesButton[2];
                _this.moregames.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                _this.moregames.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
                _this.moregames.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
                _this.moregames.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
                _this.moregames.text.yAligned = _this.spritesButton[2].y;
                _this.moregames.text.underlined = true;
                //this.moregames.button.yOffset = 0;
                _this.moregames.arrows.enabled = MainMenu.STR_MORE_GAMES == "+GAMES";
                _this.moregames.control.onSelectionStayDelegate = function () {
                    Engine.Renderer.useHandPointer = true;
                };
            }
            Game.Resources.playBGM();
            _this.fillWhite.enabled = true;
            Engine.Renderer.clearColor(104 / 255, 68 / 255, 252 / 255);
            Game.triggerActions("mainmenu");
            return _this;
        }
        MainMenu.prototype.onStartWaiting = function () {
            _super.prototype.onStartWaiting.call(this);
        };
        MainMenu.clearAds = function () {
        };
        MainMenu.prototype.initEmitters = function () {
            this.emitter0 = new Utils.Emitter();
            this.emitter0.enabled = true;
            this.emitter0.active = true;
            this.emitter0.emissionSteps = Game.BLOB_EMISSION;
            this.emitter0.x = this.title.x;
            this.emitter0.y = this.title.y;
            this.emitter0.xMin = -160 * 0.5;
            this.emitter0.xMax = 160 * 0.5;
            this.emitter0.yMin = -17;
            this.emitter0.yMax = 17;
            this.emitter0.yVelMin = -0.6;
            this.emitter0.yVelMax = -1.0;
            this.emitter0.yAccelMin = -0.004;
            this.emitter0.yAccelMax = -0.008;
            this.emitter0.lifeParticleMin = 30;
            this.emitter0.lifeParticleMax = 70;
            for (var index = 0; index < 70; index += 1) {
                //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                var particle = new Game.Entities.BoxParticle(196, 139, 4, 4, 4, 4, 3, 4);
                particle.sprite.pinned = true;
                particle.front = true;
                this.emitter0.addParticle(particle);
            }
            this.emitter1 = new Utils.Emitter();
            this.emitter1.enabled = true;
            this.emitter1.active = true;
            this.emitter1.emissionSteps = Game.BLOB_EMISSION;
            this.emitter1.x = this.title.x;
            this.emitter1.y = this.title.y;
            this.emitter1.xMin = -145 * 0.5;
            this.emitter1.xMax = 145 * 0.5;
            this.emitter1.yMin = -14;
            this.emitter1.yMax = 14;
            this.emitter1.yVelMin = -0.4;
            this.emitter1.yVelMax = -0.8;
            this.emitter1.yAccelMin = -0.002;
            this.emitter1.yAccelMax = -0.006;
            this.emitter1.lifeParticleMin = 30;
            this.emitter1.lifeParticleMax = 60;
            for (var index = 0; index < 70; index += 1) {
                //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                var particle = new Game.Entities.BoxParticle(196, 144, 4, 4, 4, 4, 3, 4);
                particle.sprite.pinned = true;
                particle.front = true;
                this.emitter1.addParticle(particle);
            }
        };
        MainMenu.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            this.title.render();
            for (var i = 0; i < (Game.HAS_LINKS ? 3 : 2); i += 1) {
                this.spritesButton[i].render();
            }
        };
        MainMenu.STR_MORE_GAMES = "+GAMES";
        MainMenu.LONG_BUTTON = false;
        MainMenu.notFirst = false;
        return MainMenu;
    }(Game.Scene));
    Game.MainMenu = MainMenu;
})(Game || (Game = {}));
///<reference path="../../Engine/Scene.ts"/>
///<reference path="../System/Scene.ts"/>
var Game;
(function (Game) {
    var canexi = false;
    var Preloader = /** @class */ (function (_super) {
        __extends(Preloader, _super);
        function Preloader() {
            var _this = _super.call(this) || this;
            _this.now = "loading";
            _this.count = 0;
            _this.control = new Game.Control();
            Preloader.current = _this;
            Game.triggerActions("preinit");
            Game.triggerActions("init");
            Game.forEachPath("load", function (path) {
                Engine.Assets.queue(path);
            });
            Engine.Assets.download();
            if (Game.TRACK_ORIENTATION && Game.Orientation.instance == null) {
                new Game.Orientation();
            }
            _this.createMap("Preloader", "Sky Main");
            var x = Game.Scene.xSizeLevel * 0.5;
            var y = Game.Scene.ySizeLevel * 0.5;
            Engine.Renderer.camera(x, y);
            Game.Scene.fade.speed = 0.0166666666666667 * 1;
            _this.title = new Engine.Sprite();
            _this.title.setFull(true, true, Game.Resources.texture, 152, 26, -152 * 0.5, -26 * 0.5, 80, 105, 152, 26);
            _this.title.y = -240 * 0.25 - 16 + 10 - 5;
            _this.spriteBack = new Engine.Sprite();
            _this.spriteBack.setFull(true, true, Game.Resources.texture, 126, 15, 0, 0, 265, 381, 126, 15);
            _this.spriteBack.x = -_this.spriteBack.xSize * 0.5;
            _this.spriteBack.y = -8;
            _this.spriteBack.setRGBA(1, 1, 1, 0.7);
            _this.spriteBar = new Engine.Sprite();
            _this.spriteBar.enabled = true;
            _this.spriteBar.pinned = true;
            _this.spriteBar.xSize = 124;
            _this.spriteBar.ySize = 13;
            _this.spriteBar.x = -_this.spriteBar.xSize * 0.5;
            _this.spriteBar.xScale = 0;
            _this.spriteBar.y = -7;
            _this.spriteBar.setRGBA(228 / 255, 92 / 255, 16 / 255, 0.7);
            _this.text = new Utils.Text();
            _this.text.font = Game.FontManager.a;
            _this.text.scale = 1;
            _this.text.enabled = true;
            _this.text.pinned = true;
            _this.text.str = "LOADING   ";
            _this.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text.xAligned = 2;
            _this.text.yAligned = -8 * 0;
            //this.text.front = true;
            _this.control.enabled = true;
            _this.control.freezeable = true;
            _this.control.newInteractionRequired = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            _this.control.useTouch = true;
            _this.initEmitters();
            //Engine.Renderer.clearColor(0 / 255, 120 / 255, 255 / 255);
            Engine.Renderer.clearColor(104 / 255, 68 / 255, 252 / 255);
            _this.fillWhite.enabled = true;
            Game.triggerActions("preloader");
            return _this;
        }
        ;
        Preloader.prototype.initEmitters = function () {
            this.emitter0 = new Utils.Emitter();
            this.emitter0.enabled = true;
            this.emitter0.active = true;
            this.emitter0.emissionSteps = Game.BLOB_EMISSION;
            this.emitter0.x = this.spriteBar.x;
            this.emitter0.y = this.spriteBar.y;
            this.emitter0.xMin = 0;
            this.emitter0.xMax = 0;
            this.emitter0.yMin = 0;
            this.emitter0.yMax = 17;
            this.emitter0.yVelMin = -0.6;
            this.emitter0.yVelMax = -1.0;
            this.emitter0.yAccelMin = -0.004;
            this.emitter0.yAccelMax = -0.008;
            this.emitter0.lifeParticleMin = 30;
            this.emitter0.lifeParticleMax = 70;
            for (var index = 0; index < 70; index += 1) {
                //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                var particle = new Game.Entities.BoxParticle(196, 139, 4, 4, 4, 4, 3, 4);
                particle.sprite.pinned = true;
                particle.front = true;
                this.emitter0.addParticle(particle);
            }
            this.emitter1 = new Utils.Emitter();
            this.emitter1.enabled = true;
            this.emitter1.active = true;
            this.emitter1.emissionSteps = Game.BLOB_EMISSION;
            this.emitter1.x = this.spriteBar.x;
            this.emitter1.y = this.spriteBar.y;
            this.emitter1.xMin = 0;
            this.emitter1.xMax = 0;
            this.emitter1.yMin = 0;
            this.emitter1.yMax = 14;
            this.emitter1.yVelMin = -0.4;
            this.emitter1.yVelMax = -0.8;
            this.emitter1.yAccelMin = -0.002;
            this.emitter1.yAccelMax = -0.006;
            this.emitter1.lifeParticleMin = 30;
            this.emitter1.lifeParticleMax = 60;
            for (var index = 0; index < 70; index += 1) {
                //var particle = new Entities.BoxParticle(168 / 255, 0 / 255, 32 / 255, 7, 8, 3, 4);
                var particle = new Game.Entities.BoxParticle(196, 144, 4, 4, 4, 4, 3, 4);
                particle.sprite.pinned = true;
                particle.front = true;
                this.emitter1.addParticle(particle);
            }
        };
        Preloader.prototype.onStepUpdate = function () {
            Game.IS_TOUCH = Game.IS_TOUCH || Game.FORCE_TOUCH || this.control.touchPressed;
            var max = 0.3;
            if (max < Engine.Assets.downloadedRatio) {
                max = Engine.Assets.downloadedRatio;
            }
            this.spriteBar.xScale += Preloader.LOAD_VELOCITY;
            if (this.spriteBar.xScale > max) {
                this.spriteBar.xScale = max;
            }
            this.emitter0.xMax = this.spriteBar.xSize * this.spriteBar.xScale;
            this.emitter1.xMax = this.spriteBar.xSize * this.spriteBar.xScale;
            if (Game.Scene.freezed) {
                return;
            }
            switch (this.now) {
                case "loading":
                    Game.triggerActions("onpreloading");
                    this.count += 1;
                    if (this.count == 20) {
                        this.count = 0;
                        if (this.text.str == "LOADING   ") {
                            this.text.str = "LOADING.  ";
                        }
                        else if (this.text.str == "LOADING.  ") {
                            this.text.str = "LOADING.. ";
                        }
                        else if (this.text.str == "LOADING.. ") {
                            this.text.str = "LOADING...";
                        }
                        else if (this.text.str == "LOADING...") {
                            this.text.str = "LOADING   ";
                        }
                    }
                    if (Engine.Assets.downloadComplete && this.spriteBar.xScale == 1) {
                        if (Game.DIRECT_PRELOADER) {
                            this.text.str = "LOAD COMPLETE!";
                            this.text.xAligned = 0;
                            Game.HAS_STARTED = true;
                            Game.IS_TOUCH = Game.FORCE_TOUCH;
                            this.now = "exit";
                            this.text.enabled = true;
                            Game.Scene.fade.direction = 1;
                            //@ts-ignore
                            //Engine.AudioManager.verify();
                            Game.triggerActions("postinit");
                        }
                        else {
                            this.count = 0;
                            this.now = "click";
                            this.text.str = "PRESS TO CONTINUE";
                            this.text.xAligned = 0;
                            Game.triggerActions("onpreloadcomplete");
                            this.control.url = "";
                            this.control.onLinkTrigger = function (touch) {
                                Game.triggerActions("presstocontinue");
                                Game.IS_TOUCH = Game.IS_TOUCH || Game.FORCE_TOUCH || touch;
                                Preloader.current.control.onLinkTrigger = function () { };
                                canexi = true;
                            };
                        }
                    }
                    break;
                case "click":
                    this.count += 1;
                    if (this.count == 40) {
                        this.count = 0;
                        this.text.enabled = !this.text.enabled;
                    }
                    if (canexi) {
                        Game.HAS_STARTED = true;
                        Game.IS_TOUCH = Game.IS_TOUCH || this.control.touchPressed;
                        this.now = "exit";
                        this.text.enabled = true;
                        Game.Scene.fade.direction = 1;
                        Game.triggerActions("postinit");
                    }
                    break;
                case "exit":
                    if (Game.Scene.fade.alpha == 1 && Preloader.canFinish) {
                        this.now = "wait";
                        this.count = 0;
                    }
                    break;
                case "wait":
                    this.count += 1;
                    if (Game.startingSceneClass != Game.MainMenu) {
                        this.count = 60;
                    }
                    if (this.count >= 60) {
                        this.now = "switch";
                        Game.triggerActions("preloadchangecolor");
                        //TODO: TEMPORAL, FIX THIS:
                        if (Game.IS_TOUCH) {
                            //HAS_LINKS = false;
                        }
                        Engine.System.nextSceneClass = Game.PreloadEnd;
                    }
                    break;
            }
        };
        Preloader.prototype.onDrawScene = function () {
            _super.prototype.onDrawScene.call(this);
            this.spriteBar.render();
            this.spriteBack.render();
            this.title.render();
        };
        Preloader.LOAD_VELOCITY = 0.005;
        Preloader.validated = false;
        Preloader.validatedFromTouch = false;
        Preloader.canFinish = true;
        return Preloader;
    }(Game.Scene));
    Game.Preloader = Preloader;
})(Game || (Game = {}));
(function (Game) {
    var SimplePreloader = /** @class */ (function (_super) {
        __extends(SimplePreloader, _super);
        function SimplePreloader() {
            var _this = _super.call(this) || this;
            Game.triggerActions("preinit");
            Game.triggerActions("init");
            Game.forEachPath("load", function (path) {
                Engine.Assets.queue(path);
            });
            Engine.Assets.download();
            Game.Scene.fade.speed = 0.0166666666666667 * 1000;
            Engine.Renderer.clearColor(1, 1, 1);
            Game.triggerActions("preloader");
            Game.HAS_STARTED = true;
            Game.IS_TOUCH = Game.FORCE_TOUCH;
            return _this;
        }
        ;
        SimplePreloader.prototype.onStepUpdate = function () {
            if (Engine.Assets.downloadComplete) {
                Engine.System.nextSceneClass = Game.PreloadEnd;
            }
        };
        return SimplePreloader;
    }(Game.Scene));
    Game.SimplePreloader = SimplePreloader;
})(Game || (Game = {}));
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
                Engine.System.nextSceneClass = Game.SKIP_PRELOADER ? Game.SimplePreloader : Game.Preloader;
            }
        };
        return PreloadStart;
    }(Engine.Scene));
    Game.PreloadStart = PreloadStart;
    var PreloadEnd = /** @class */ (function (_super) {
        __extends(PreloadEnd, _super);
        function PreloadEnd() {
            var _this = _super.call(this) || this;
            Game.triggerActions("configure");
            Game.triggerActions("prepare");
            Game.triggerActions("start");
            Engine.System.nextSceneClass = Game.startingSceneClass;
            Game.triggerActions("preloadchangecolor");
            return _this;
        }
        return PreloadEnd;
    }(Engine.Scene));
    Game.PreloadEnd = PreloadEnd;
    Engine.System.nextSceneClass = PreloadStart;
})(Game || (Game = {}));
/*
namespace Game{
    export class Preloader extends Scene{
        protected constructor(){
            super();
            triggerActions("preinit");
            triggerActions("init");
            forEachPath("load", function(path : string){
                Engine.Assets.queue(path);
            });
            Engine.Assets.download();
        };
        
        protected onStepUpdate(){
            super.onStepUpdate();
            if(Engine.Assets.downloadComplete){
                Engine.System.nextSceneClass = PreloadEnd;
            }
        }
    }
}
*/ 
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
                this.arrowLeft.xAligned = this.bounds.x - this.arrowLeft.font.xSeparation - this.xOffset;
                this.arrowLeft.yAligned = this.bounds.y + this.yOffset;
                this.arrowRight.xAligned = this.bounds.x + this.bounds.xSize * this.bounds.xScale + this.arrowLeft.font.xSeparation + this.xOffset;
                this.arrowRight.yAligned = this.bounds.y + this.yOffset;
            }
        };
        return Arrows;
    }(Engine.Entity));
    Game.Arrows = Arrows;
})(Game || (Game = {}));
var Utils;
(function (Utils) {
    var CharacterDef = /** @class */ (function () {
        function CharacterDef() {
        }
        return CharacterDef;
    }());
    var Font = /** @class */ (function () {
        function Font() {
            this.ySize = 0;
            this.xSeparation = 0;
            this.charDefs = new Array();
        }
        Font.prototype.setChar = function (character, xTexture, yTexture, xSize) {
            var indexChar = character.charCodeAt(0) - " ".charCodeAt(0);
            this.charDefs[indexChar] = new CharacterDef();
            this.charDefs[indexChar].xTexture = xTexture;
            this.charDefs[indexChar].yTexture = yTexture;
            this.charDefs[indexChar].xSize = xSize;
        };
        Font.prototype.resizeChar = function (character, xSize) {
            this.charDefs[character.charCodeAt(0) - " ".charCodeAt(0)].xSize = xSize;
        };
        Font.prototype.setFull = function (texture, ySize, xSeparation, xTexture, yTexture, xSize, columns, xSeparationTexture, ySeparationTexture) {
            this.texture = texture;
            this.ySize = ySize;
            this.xSeparation = xSeparation;
            this.charDefs = new Array();
            var indexColumn = 0;
            do {
                var charDef = new CharacterDef();
                charDef.xTexture = xTexture + indexColumn * (xSize + xSeparationTexture);
                charDef.yTexture = yTexture;
                charDef.xSize = xSize;
                this.charDefs.push(charDef);
                indexColumn += 1;
                if (indexColumn == columns) {
                    yTexture += this.ySize + ySeparationTexture;
                    indexColumn = 0;
                }
            } while (this.charDefs.length <= "~".charCodeAt(0) - " ".charCodeAt(0));
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
            FontManager.a.setFull(Game.Resources.texture, 8, 1, 314, 272, 6, 13, 2, 2);
            FontManager.b = new Utils.Font();
            FontManager.b.setFull(Game.Resources.texture, 9, -1, 299, 211, 7, 13, 2, 2);
            FontManager.c = new Utils.Font();
            FontManager.c.setFull(Game.Resources.texture, 9, 0, 299, 211, 7, 13, 2, 2);
            FontManager.d = new Utils.Font();
            FontManager.d.setFull(Game.Resources.texture, 9, 1, 299, 211, 7, 13, 2, 2);
            FontManager.ads = new Utils.Font();
            FontManager.ads.setFull(Game.Resources.texture, 8, 1, 314, 272, 6, 13, 2, 2);
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
    var PATH_GOOGLE_PLAY_LOGO = "Assets/google-play-badge.png";
    var Resources = /** @class */ (function () {
        function Resources() {
        }
        Resources.playBGM = function () {
            if (!Resources.bgmPlayed) {
                Resources.bgm.autoplay();
                Resources.bgmPlayed = true;
            }
        };
        Resources.PATH_LEVELS = "Assets/Levels.json";
        Resources.PATH_TILESET = "Assets/Tileset.json";
        Resources.PATH_JUMP = "Assets/Jump.wmo";
        Resources.PATH_DEAD = "Assets/Dead.wmo";
        Resources.PATH_FIRE = "Assets/Fire.wmo";
        Resources.PATH_ICE = "Assets/Ice.wmo";
        Resources.PATH_SWITCH = "Assets/Switch.wmo";
        Resources.PATH_MUSIC = "Assets/Music.omw";
        Resources.PATH_FRAMES = "Assets/Graphics/frames.json";
        Resources.PATH_TEXTURE_GRAPHICS_0 = "Assets/Graphics 0.png";
        Resources.bgmPlayed = false;
        Resources.bgmVolumeTracker = 1;
        return Resources;
    }());
    Game.Resources = Resources;
    Game.addPath("preload", Resources.PATH_FRAMES);
    Game.addPath("preload", Resources.PATH_TEXTURE_GRAPHICS_0);
    Game.addPath("preload", Resources.PATH_LEVELS);
    Game.addPath("preload", Resources.PATH_TILESET);
    Game.addPath("load", Resources.PATH_JUMP);
    Game.addPath("load", Resources.PATH_DEAD);
    Game.addPath("load", Resources.PATH_FIRE);
    Game.addPath("load", Resources.PATH_ICE);
    Game.addPath("load", Resources.PATH_SWITCH);
    Game.addPath("load", Resources.PATH_MUSIC);
    Game.addAction("preinit", function () {
        Resources.texture = new Engine.Texture(Resources.PATH_TEXTURE_GRAPHICS_0, true, false);
        Resources.texture.preserved = true;
        if (Game.HAS_LINKS && Game.HAS_GOOGLE_PLAY_LOGOS) {
            Game.addPath("load", PATH_GOOGLE_PLAY_LOGO);
        }
    });
    Game.addAction("configure", function () {
        if (Game.HAS_LINKS && Game.HAS_GOOGLE_PLAY_LOGOS) {
            Resources.textureGooglePlay = new Engine.Texture(PATH_GOOGLE_PLAY_LOGO, false, true);
            Resources.textureGooglePlay.preserved = true;
        }
        Resources.bgm = new Engine.AudioPlayer(Resources.PATH_MUSIC);
        Resources.bgm.preserved = true;
        Resources.bgm.volume = Resources.bgm.restoreVolume = 1;
        if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
            Resources.bgm.loopEnd = 54.85;
        }
        else if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
            Resources.bgm.loopEnd = 54.85;
        }
        Game.bgms.push(Resources.bgm);
        Resources.audioPlayerJump = new Engine.AudioPlayer(Resources.PATH_JUMP);
        Resources.audioPlayerJump.preserved = true;
        Resources.audioPlayerJump.volume = Resources.audioPlayerJump.restoreVolume = 1;
        Game.sfxs.push(Resources.audioPlayerJump);
        Resources.audioPlayerDead = new Engine.AudioPlayer(Resources.PATH_DEAD);
        Resources.audioPlayerDead.preserved = true;
        Resources.audioPlayerDead.volume = Resources.audioPlayerDead.restoreVolume = 1;
        Game.sfxs.push(Resources.audioPlayerDead);
        Resources.audioPlayerFire = new Engine.AudioPlayer(Resources.PATH_FIRE);
        Resources.audioPlayerFire.preserved = true;
        Resources.audioPlayerFire.volume = Resources.audioPlayerFire.restoreVolume = 1;
        Game.sfxs.push(Resources.audioPlayerFire);
        Resources.audioPlayerIce = new Engine.AudioPlayer(Resources.PATH_ICE);
        Resources.audioPlayerIce.preserved = true;
        Resources.audioPlayerIce.volume = Resources.audioPlayerIce.restoreVolume = 1;
        Game.sfxs.push(Resources.audioPlayerIce);
        Resources.audioPlayerSwitch = new Engine.AudioPlayer(Resources.PATH_SWITCH);
        Resources.audioPlayerSwitch.preserved = true;
        Resources.audioPlayerSwitch.volume = Resources.audioPlayerSwitch.restoreVolume = 1;
        Game.sfxs.push(Resources.audioPlayerSwitch);
        if (Resources.bgmVolumeTracker < 1) {
            Game.muteAll();
        }
    });
})(Game || (Game = {}));
///<reference path="../Utils/Fade.ts"/>
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
            return instance;
        };
        SceneFade.setColor = function (red, green, blue) {
            //red = 0;
            //green = 0;
            //blue = 0;
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
///<reference path="../../Engine/Entity.ts"/>
var Utils;
(function (Utils) {
    var AnchorAlignment;
    (function (AnchorAlignment) {
        AnchorAlignment[AnchorAlignment["NONE"] = 0] = "NONE";
        AnchorAlignment[AnchorAlignment["START"] = 1] = "START";
        AnchorAlignment[AnchorAlignment["MIDDLE"] = 2] = "MIDDLE";
        AnchorAlignment[AnchorAlignment["END"] = 3] = "END";
    })(AnchorAlignment = Utils.AnchorAlignment || (Utils.AnchorAlignment = {}));
    var Anchor = /** @class */ (function (_super) {
        __extends(Anchor, _super);
        function Anchor() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._xAlignView = AnchorAlignment.NONE;
            _this._yAlignView = AnchorAlignment.NONE;
            _this._xAlignBounds = AnchorAlignment.NONE;
            _this._yAlignBounds = AnchorAlignment.NONE;
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
        Object.defineProperty(Anchor.prototype, "ready", {
            get: function () {
                return this._bounds != null && this._xAlignView != AnchorAlignment.NONE && this._xAlignBounds != AnchorAlignment.NONE && this._yAlignView != AnchorAlignment.NONE && this._yAlignBounds != AnchorAlignment.NONE;
            },
            enumerable: false,
            configurable: true
        });
        Anchor.prototype.fix = function () {
            this.xFix();
            this.yFix();
        };
        Anchor.prototype.xFix = function () {
            if (this._bounds != null && this._xAlignView != AnchorAlignment.NONE && this._xAlignBounds != AnchorAlignment.NONE) {
                var x = 0;
                switch (this._xAlignView) {
                    case AnchorAlignment.START:
                        x = -Engine.Renderer.xSizeView * 0.5 + this._xAligned;
                        switch (this._xAlignBounds) {
                            case AnchorAlignment.START:
                                break;
                            case AnchorAlignment.MIDDLE:
                                x -= this._bounds.xSize * this._bounds.xScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                x -= this._bounds.xSize * this._bounds.xScale;
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    case AnchorAlignment.MIDDLE:
                        x = this._xAligned;
                        switch (this._xAlignBounds) {
                            case AnchorAlignment.START:
                                break;
                            case AnchorAlignment.MIDDLE:
                                x -= this._bounds.xSize * this._bounds.xScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                x -= this._bounds.xSize * this._bounds.xScale;
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    case AnchorAlignment.END:
                        x = Engine.Renderer.xSizeView * 0.5 + this._xAligned - (this._bounds.xSize * this._bounds.xScale);
                        switch (this._xAlignBounds) {
                            case AnchorAlignment.START:
                                x += this._bounds.xSize * this._bounds.xScale;
                                break;
                            case AnchorAlignment.MIDDLE:
                                x += this._bounds.xSize * this._bounds.xScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    default:
                        console.log("ERROR");
                        break;
                }
                this._bounds.x = x;
            }
        };
        Anchor.prototype.yFix = function () {
            if (this._bounds != null && this._yAlignView != AnchorAlignment.NONE && this._yAlignBounds != AnchorAlignment.NONE) {
                var y = 0;
                switch (this._yAlignView) {
                    case AnchorAlignment.START:
                        y = -Engine.Renderer.ySizeView * 0.5 + this._yAligned;
                        switch (this._yAlignBounds) {
                            case AnchorAlignment.START:
                                break;
                            case AnchorAlignment.MIDDLE:
                                y -= this._bounds.ySize * this._bounds.yScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                y -= this._bounds.ySize * this._bounds.yScale;
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    case AnchorAlignment.MIDDLE:
                        y = this._yAligned;
                        switch (this._yAlignBounds) {
                            case AnchorAlignment.START:
                                break;
                            case AnchorAlignment.MIDDLE:
                                y -= this._bounds.ySize * this._bounds.yScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                y -= this._bounds.ySize * this._bounds.yScale;
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    case AnchorAlignment.END:
                        y = Engine.Renderer.ySizeView * 0.5 + this._yAligned - (this._bounds.ySize * this._bounds.yScale);
                        switch (this._yAlignBounds) {
                            case AnchorAlignment.START:
                                y += this._bounds.ySize * this._bounds.yScale;
                                break;
                            case AnchorAlignment.MIDDLE:
                                y += this._bounds.ySize * this._bounds.yScale * 0.5;
                                break;
                            case AnchorAlignment.END:
                                break;
                            default:
                                console.log("ERROR");
                                break;
                        }
                        break;
                    default:
                        console.log("ERROR");
                        break;
                }
                this._bounds.y = y;
            }
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
            return _this;
        }
        Object.defineProperty(Animator.prototype, "ended", {
            get: function () {
                return this.cycles > 0;
            },
            enumerable: false,
            configurable: true
        });
        Animator.prototype.setFrame = function () {
            var indexFrame = this.animation.indexArray != null ? this.animation.indexArray[this.indexFrame] : this.indexFrame;
            var frame = this.animation.frames[indexFrame];
            if (this.listener != null) {
                this.listener.onSetFrame(this, this.animation, frame);
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
            this.setFrame();
        };
        Animator.prototype.onAnimationUpdate = function () {
            if (!Game.Scene.freezed && this.animation != null && (this.animation.loop || this.cycles < 1)) {
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
                    this.setFrame();
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
                if ((this.freezeable && Game.Scene.freezed) || Control.selectionBlocker != null) {
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
                if (!used && this.useKeyboard && !(this.freezeable && Game.Scene.freezed)) {
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
                        this.setBorderColor(0 / 255, 0 / 255, 252 / 255, 1);
                        this.setFillColor(0 / 255, 120 / 255, 255 / 255, 1);
                        //this.setBorderColor(0 / 255, 0 / 255, 0 / 255, 1);
                        //this.setFillColor(0 / 255, 120 / 255, 255 / 255, 1);
                        this.setBandColor(255 / 255, 255 / 255, 255 / 255, 1);
                        break;
                    case "purple":
                        this.setBorderColor(88 / 255, 40 / 255, 188 / 255, 1);
                        this.setFillColor(152 / 255, 120 / 255, 248 / 255, 1);
                        this.setBandColor(255 / 255, 255 / 255, 255 / 255, 1);
                        break;
                    case "clearblue":
                        //this.setBorderColor(104 / 255, 136 / 255, 252 / 255, 1);
                        this.setBorderColor(184 / 255, 184 / 255, 248 / 255, 1);
                        this.setFillColor(164 / 255, 228 / 255, 252 / 255, 1);
                        this.setBandColor(255 / 255, 255 / 255, 255 / 255, 1);
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
var Utils;
(function (Utils) {
    var Emitter = /** @class */ (function (_super) {
        __extends(Emitter, _super);
        function Emitter() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.active = false;
            _this.particles = new Array();
            _this.countSteps = 0;
            _this.indexParticle = 0;
            _this.emissionSteps = 0;
            _this.x = 0;
            _this.y = 0;
            _this.xMin = 0;
            _this.xMax = 0;
            _this.yMin = 0;
            _this.yMax = 0;
            _this.xVelMin = 0;
            _this.xVelMax = 0;
            _this.yVelMin = 0;
            _this.yVelMax = 0;
            _this.xAccelMin = 0;
            _this.xAccelMax = 0;
            _this.yAccelMin = 0;
            _this.yAccelMax = 0;
            _this.lifeParticleMin = 0;
            _this.lifeParticleMax = 0;
            _this._enabled = false;
            return _this;
        }
        Object.defineProperty(Emitter.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (value) {
                for (var _i = 0, _a = this.particles; _i < _a.length; _i++) {
                    var particle = _a[_i];
                    particle.enabled = value;
                    particle.sprite.enabled = value;
                }
                this._enabled = value;
            },
            enumerable: false,
            configurable: true
        });
        Emitter.prototype.stop = function () {
            if (!this.active) {
                return;
            }
            this.active = false;
            for (var _i = 0, _a = this.particles; _i < _a.length; _i++) {
                var particle = _a[_i];
                particle.xVel = 0;
                particle.yVel = 0;
            }
        };
        Emitter.prototype.addParticle = function (particle) {
            this.particles.push(particle);
            particle.reset();
        };
        Emitter.prototype.addParticles = function (type, count) {
            for (var indexParticle = 0; indexParticle < count; indexParticle += 1) {
                this.addParticle(new type());
            }
        };
        Emitter.prototype.reset = function () {
            this.countSteps = 0;
            this.indexParticle = 0;
            for (var _i = 0, _a = this.particles; _i < _a.length; _i++) {
                var particle = _a[_i];
                particle.reset();
            }
        };
        Emitter.prototype.onReset = function () {
            this.countSteps = 0;
            this.indexParticle = 0;
        };
        Emitter.prototype.emitParticle = function () {
            var oldIndex = this.indexParticle;
            while (this.particles[this.indexParticle].enabled) {
                this.indexParticle += 1;
                if (this.indexParticle >= this.particles.length) {
                    this.indexParticle = 0;
                }
                if (this.indexParticle == oldIndex) {
                    return;
                }
            }
            this.particles[this.indexParticle].emit(this.indexParticle, this.lifeParticleMin + (this.lifeParticleMax - this.lifeParticleMin) * Math.random(), this.x, this.y, this.xMin + (this.xMax - this.xMin) * Math.random(), this.yMin + (this.yMax - this.yMin) * Math.random(), this.xVelMin + (this.xVelMax - this.xVelMin) * Math.random(), this.yVelMin + (this.yVelMax - this.yVelMin) * Math.random(), this.xAccelMin + (this.xAccelMax - this.xAccelMin) * Math.random(), this.yAccelMin + (this.yAccelMax - this.yAccelMin) * Math.random());
            this.indexParticle += 1;
            if (this.indexParticle >= this.particles.length) {
                this.indexParticle = 0;
            }
        };
        Emitter.prototype.onStepUpdate = function () {
            if (Game.Scene.freezed) {
                return;
            }
            if (this.active && this._enabled /* && this.indexParticle < this.particles.length */) {
                if (this.countSteps >= this.emissionSteps) {
                    this.emitParticle();
                    this.countSteps = 0;
                }
                this.countSteps += 1;
            }
        };
        return Emitter;
    }(Engine.Entity));
    Utils.Emitter = Emitter;
})(Utils || (Utils = {}));
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
var Utils;
(function (Utils) {
    var Shake = /** @class */ (function (_super) {
        __extends(Shake, _super);
        function Shake() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Shake.prototype, "ended", {
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
        };
        Shake.prototype.stop = function () {
            this.position = 0;
            this.direction = 0;
        };
        //@ts-ignore
        Shake.prototype.onReset = function () {
            this.position = 0;
            this.direction = 0;
        };
        //@ts-ignore
        Shake.prototype.onStepUpdate = function () {
            if (this.direction != 0 && !Game.Scene.freezed) {
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
///<reference path="Anchor.ts"/>
var Utils;
(function (Utils) {
    var Text = /** @class */ (function (_super) {
        __extends(Text, _super);
        function Text() {
            var _this = _super.call(this) || this;
            _this.sprites = new Array();
            _this.superBack = false;
            _this.front = false;
            _this._enabled = false;
            _this._pinned = false;
            _this._str = null;
            _this._font = null;
            _this._underlined = false;
            _this._scale = 1;
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
                sprite.enabled = value;
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
                    var charDef = this._font.charDefs[this._str.charCodeAt(indexChar) - " ".charCodeAt(0)];
                    sprite.setFull(this._enabled, this._pinned, this._font.texture, charDef.xSize * this._scale, this._font.ySize * this._scale, 0, 0, charDef.xTexture, charDef.yTexture, charDef.xSize, this._font.ySize);
                    xSizeText += sprite.xSize + this._font.xSeparation * this._scale;
                }
                this._bounds.enabled = this._enabled;
                this._bounds.pinned = this._pinned;
                this._bounds.xSize = xSizeText - this._font.xSeparation * this._scale;
                this._bounds.ySize = this._font.ySize * this._scale;
                if (this._underlined) {
                    this.underline.enabled = this._enabled;
                    this.underline.pinned = this._pinned;
                    this.underline.xSize = this._bounds.xSize - 1;
                    this.underline.ySize = this._scale;
                    this.underline2.enabled = this._enabled;
                    this.underline2.pinned = this._pinned;
                    this.underline2.xSize = this._bounds.xSize - 1;
                    this.underline2.ySize = this._scale;
                    this._bounds.ySize += this._scale * 2;
                }
                this.fix();
            }
        };
        Text.prototype.fix = function () {
            _super.prototype.fix.call(this);
            if (this._str != null && this._font != null && this.ready) {
                var x = this._bounds.x;
                for (var indexChar = 0; indexChar < this._str.length; indexChar += 1) {
                    var sprite = this.sprites[indexChar];
                    sprite.x = x;
                    sprite.y = this._bounds.y;
                    x += sprite.xSize + this._font.xSeparation * this._scale;
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
            if (this.superBack) {
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
            if (!this.superBack && !this.front) {
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
            if (!this.superBack && this.front) {
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
            console.log(path);
            console.log(Assets.assets);
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
    var Overlap = /** @class */ (function () {
        function Overlap(box, other) {
            this.box = box;
            this.other = other;
        }
        return Overlap;
    }());
    Engine.Overlap = Overlap;
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
                overlaps.push(new Overlap(this, other));
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
