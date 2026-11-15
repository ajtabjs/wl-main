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
        Renderer.xSizeViewIdeal = 170 * 1;
        Renderer.ySizeViewIdeal = 120 * 1;
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
    Engine.System.onInit = function () {
        if (Engine.Data.useLocalStorage) {
            Engine.Data.setID("com", "kez", "minicolors");
        }
        else {
            Engine.Data.setID("c", "k", "col");
        }
        Game.SceneColors.clearColor(255, 255, 255);
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
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSceneMap");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSceneFill");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawObjectsBack");
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
        Game.recordSpeedrun = +(Engine.Data.load("speedrunrecord"));
        Game.recordSpeedrun = isNaN(Game.recordSpeedrun) ? 0 : Game.recordSpeedrun;
        Game.triggerActions("loadgame");
        Engine.Box.debugRender = false;
        //SKIP_PRELOADER = true;
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
    Game.STEPS_CHANGE_SCENE = 10;
    Game.STEPS_CHANGE_SCENE_AD = 30;
    Game.X_BUTTONS_LEFT = 8;
    Game.X_BUTTONS_RIGHT = -8;
    Game.Y_BUTTONS_TOP = 2;
    Game.Y_BUTTONS_BOTTOM = -2;
    Game.Y_ARROWS_GAME_BUTTONS = 2;
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
            //@ts-ignore
            new Game[def.type.type](def);
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
///<reference path="Entity.ts"/>
var Game;
(function (Game) {
    var PhysicEntity = /** @class */ (function (_super) {
        __extends(PhysicEntity, _super);
        function PhysicEntity(def, hasSolidBox, solidGroups, hasCheckBox, checkGroups) {
            var _this = _super.call(this, def) || this;
            _this.x = 0;
            _this.y = 0;
            _this.xOffsetDraw = 0;
            _this.yOffsetDraw = 0;
            _this.xAlign = "start";
            _this.yAlign = "start";
            _this.xVel = 0;
            _this.yVel = 0;
            _this.xCanMove = true;
            _this.yCanMove = true;
            _this.xStop = true;
            _this.yStop = true;
            _this.xDirContact = 0;
            _this.yDirContact = 0;
            _this.gravityScale = 1;
            _this.yMaxVel = 0;
            _this.drawFront = false;
            _this.drawAfterUI = false;
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            if (hasSolidBox) {
                _this.boxSolid = new Engine.Box();
                _this.boxSolid.enabled = true;
                _this.boxSolid.renderable = true;
                if (solidGroups != null) {
                    for (var _i = 0, solidGroups_1 = solidGroups; _i < solidGroups_1.length; _i++) {
                        var group = solidGroups_1[_i];
                        group.push(_this.boxSolid);
                    }
                }
            }
            if (hasCheckBox) {
                _this.boxCheck = new Engine.Box();
                _this.boxCheck.enabled = true;
                _this.boxCheck.renderable = true;
                _this.boxCheck.red = 1;
                if (checkGroups != null) {
                    for (var _a = 0, checkGroups_1 = checkGroups; _a < checkGroups_1.length; _a++) {
                        var group = checkGroups_1[_a];
                        group.push(_this.boxCheck);
                    }
                }
            }
            _this.animator = new Utils.Animator();
            _this.animator.owner = _this;
            _this.animator.listener = _this;
            _this.machine = new Game.StateMachine(_this);
            _this.machine.owner = _this;
            _this.machine.startState = _this.initStates();
            return _this;
        }
        Object.defineProperty(PhysicEntity.prototype, "xDraw", {
            get: function () {
                return this.sprite.x + this.xOffsetDraw;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PhysicEntity.prototype, "yDraw", {
            get: function () {
                return this.sprite.y + this.yOffsetDraw;
            },
            enumerable: false,
            configurable: true
        });
        PhysicEntity.prototype.initStates = function () {
            return new Game.State(this);
        };
        PhysicEntity.prototype.onReset = function () {
            if (this.def.flip.x) {
                switch (this.xAlign) {
                    case "start":
                        this.x = this.def.instance.x;
                        break;
                    case "middle":
                        this.x = this.def.instance.x - Game.SceneMap.instance.xSizeTile * 0.5;
                        break;
                    case "end":
                        this.x = this.def.instance.x - Game.SceneMap.instance.xSizeTile;
                        break;
                }
                this.x += Game.SceneMap.instance.xSizeTile;
            }
            else {
                switch (this.xAlign) {
                    case "start":
                        this.x = this.def.instance.x;
                        break;
                    case "middle":
                        this.x = this.def.instance.x + Game.SceneMap.instance.xSizeTile * 0.5;
                        break;
                    case "end":
                        this.x = this.def.instance.x + Game.SceneMap.instance.xSizeTile;
                        break;
                }
            }
            if (this.def.flip.y) {
                switch (this.yAlign) {
                    case "start":
                        this.y = this.def.instance.y;
                        break;
                    case "middle":
                        this.y = this.def.instance.y - Game.SceneMap.instance.ySizeTile * 0.5;
                        break;
                    case "end":
                        this.y = this.def.instance.y - Game.SceneMap.instance.ySizeTile;
                        break;
                }
            }
            else {
                switch (this.yAlign) {
                    case "start":
                        this.y = this.def.instance.y;
                        break;
                    case "middle":
                        this.y = this.def.instance.y + Game.SceneMap.instance.ySizeTile * 0.5;
                        break;
                    case "end":
                        this.y = this.def.instance.y + Game.SceneMap.instance.ySizeTile;
                        break;
                }
                this.y -= Game.SceneMap.instance.ySizeTile;
            }
            this.sprite.enabled = true;
            this.sprite.x = this.x;
            this.sprite.y = this.y;
            this.sprite.xMirror = this.def.flip.x;
            this.sprite.yMirror = this.def.flip.y;
            if (this.boxSolid != null) {
                this.boxSolid.enabled = true;
                this.boxSolid.x = this.x;
                this.boxSolid.y = this.y;
                //this.boxSolid.xMirror = this.def.flip.x;
                //this.boxSolid.yMirror = this.def.flip.y;
                //TODO: TEMPORAL WORKAROUND
                if (this.sprite.yMirror) {
                    this.boxSolid.y += this.boxSolid.ySize;
                }
            }
            if (this.boxCheck != null) {
                this.boxCheck.enabled = true;
                this.boxCheck.x = this.x;
                this.boxCheck.y = this.y;
                this.boxCheck.xMirror = this.def.flip.x;
                this.boxCheck.yMirror = this.def.flip.y;
            }
            this.xVel = 0;
            this.yVel = 0;
            this.xDirContact = 0;
            this.yDirContact = 0;
            this.xContacts = null;
            this.yContacts = null;
        };
        //@ts-ignore
        PhysicEntity.prototype.onSetFrame = function (animator, animation, frame) {
            frame.applyToSprite(this.sprite);
            if (this.boxCheck != null) {
                frame.applyToBox(this.boxCheck);
            }
        };
        PhysicEntity.prototype.onMoveUpdate = function () {
            if (!Game.SceneFreezer.stoped) {
                this.xContacts = null;
                this.xDirContact = 0;
                this.yContacts = null;
                this.yDirContact = 0;
                if (this.xCanMove) {
                    if (this.boxSolid != null) {
                        this.xContacts = this.boxSolid.cast(Game.SceneMap.instance.boxesTiles, null, true, this.xVel, true, Engine.Box.LAYER_ALL);
                        this.boxSolid.translate(this.xContacts, true, this.xVel, true);
                        if (this.xContacts != null) {
                            this.xDirContact = this.xVel < 0 ? -1 : 1;
                            if (this.xStop) {
                                this.xVel = 0;
                            }
                        }
                        this.x = this.boxSolid.x;
                    }
                    else {
                        this.x += this.xVel;
                    }
                }
                if (this.yCanMove) {
                    this.yVel += Game.Level.GRAVITY * this.gravityScale;
                    if (this.yMaxVel > 0 && this.yVel > this.yMaxVel) {
                        this.yVel = this.yMaxVel;
                    }
                    if (this.boxSolid != null) {
                        this.yContacts = this.boxSolid.cast(Game.SceneMap.instance.boxesTiles, null, false, this.yVel, true, Engine.Box.LAYER_ALL);
                        this.boxSolid.translate(this.yContacts, false, this.yVel, true);
                        if (this.yContacts != null) {
                            this.yDirContact = this.yVel < 0 ? -1 : 1;
                            if (this.yStop) {
                                this.yVel = 0;
                            }
                        }
                        this.y = this.boxSolid.y;
                    }
                    else {
                        this.y += this.yVel;
                    }
                }
                if (this.boxCheck != null) {
                    this.boxCheck.x = this.x;
                    this.boxCheck.y = this.y;
                }
            }
        };
        PhysicEntity.prototype.getContacts = function (xAxis, dir) {
            if (dir != 0) {
                if (xAxis) {
                    return this.boxSolid.cast(Game.SceneMap.instance.boxesTiles, null, true, dir > 0 ? 1 : -1, false, Engine.Box.LAYER_ALL);
                }
                else {
                    return this.boxSolid.cast(Game.SceneMap.instance.boxesTiles, null, false, dir > 0 ? 1 : -1, false, Engine.Box.LAYER_ALL);
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
            var xDraw = this.x;
            var yDraw = this.y;
            if (!Game.SceneFreezer.stoped) {
                if (this.boxSolid != null) {
                    if (this.xCanMove && this.yCanMove) {
                        var point = this.boxSolid.getExtrapolation(Game.SceneMap.instance.boxesTiles, this.xVel, this.yVel, true, Engine.Box.LAYER_ALL);
                        xDraw = point.x;
                        yDraw = point.y;
                    }
                    else if (this.xCanMove) {
                        var point = this.boxSolid.getExtrapolation(Game.SceneMap.instance.boxesTiles, this.xVel, 0, true, Engine.Box.LAYER_ALL);
                        xDraw = point.x;
                        yDraw = this.boxSolid.y;
                    }
                    else if (this.yCanMove) {
                        var point = this.boxSolid.getExtrapolation(Game.SceneMap.instance.boxesTiles, 0, this.yVel, true, Engine.Box.LAYER_ALL);
                        xDraw = this.boxSolid.x;
                        yDraw = point.y;
                    }
                    else {
                        xDraw = this.boxSolid.x;
                        yDraw = this.boxSolid.y;
                    }
                }
                else {
                    xDraw += this.xCanMove ? this.xVel * Engine.System.stepExtrapolation : 0;
                    yDraw += this.yCanMove ? this.yVel * Engine.System.stepExtrapolation : 0;
                }
            }
            this.sprite.x = xDraw;
            this.sprite.y = yDraw;
            //TODO: TEMPORAL WORKAROUND
            if (this.sprite.yMirror && this.boxSolid != null) {
                this.sprite.y -= this.boxSolid.ySize;
            }
        };
        PhysicEntity.prototype.onDrawObjectsBack = function () {
            if (!this.drawAfterUI && !this.drawFront) {
                this.draw();
            }
        };
        PhysicEntity.prototype.onDrawObjectsFront = function () {
            if (!this.drawAfterUI && this.drawFront) {
                this.draw();
            }
        };
        PhysicEntity.prototype.onDrawObjectsAfterUI = function () {
            if (this.drawAfterUI) {
                this.draw();
            }
        };
        PhysicEntity.prototype.draw = function () {
            this.sprite.render();
            if (this.boxSolid != null) {
                this.boxSolid.renderExtrapolated(Game.SceneMap.instance.boxesTiles, this.xVel, this.yVel, true, Engine.Box.LAYER_ALL);
            }
            if (this.boxCheck != null) {
                var xOld = this.boxCheck.x;
                var yOld = this.boxCheck.y;
                this.boxCheck.x = this.sprite.x;
                this.boxCheck.y = this.sprite.y;
                this.boxCheck.render();
                this.boxCheck.x = xOld;
                this.boxCheck.y = yOld;
            }
        };
        return PhysicEntity;
    }(Game.Entity));
    Game.PhysicEntity = PhysicEntity;
})(Game || (Game = {}));
///<reference path="PhysicEntity.ts"/>
var Game;
(function (Game) {
    var Enemy = /** @class */ (function (_super) {
        __extends(Enemy, _super);
        function Enemy(def) {
            var _this = _super.call(this, def, true, [Game.SceneMap.instance.boxesEnemies], false, null) || this;
            Enemy.enemies.push(_this);
            _this.boxPatrol = new Engine.Box();
            _this.boxPatrol.enabled = true;
            _this.boxPatrol.renderable = true;
            _this.boxPatrol.xSize = 1;
            _this.boxPatrol.ySize = 1;
            _this.boxPatrol.green = 0;
            _this.boxPatrol.blue = 1;
            _this.blue = _this.getProperty("blue");
            _this.animSteps = _this.getProperty("anim steps");
            _this.velMove = _this.getProperty("vel move");
            _this.xStop = false;
            if (_this.blue) {
                _this.animMoveOn = new Utils.Animation("move on", true, FRAMES, _this.animSteps, [12, 13, 14, 13], null);
                _this.animMoveOff = new Utils.Animation("move off", true, FRAMES, _this.animSteps, [17, 18, 19, 18], null);
                _this.animAirOn = new Utils.Animation("air on", false, FRAMES, 2, [15, 16], null);
                _this.animAirOff = new Utils.Animation("air off", false, FRAMES, 2, [20, 21], null);
            }
            else {
                _this.animMoveOn = new Utils.Animation("move on", true, FRAMES, _this.animSteps, [1, 2, 3, 2], null);
                _this.animMoveOff = new Utils.Animation("move off", true, FRAMES, _this.animSteps, [6, 7, 8, 7], null);
                _this.animAirOn = new Utils.Animation("air on", false, FRAMES, 2, [4, 5], null);
                _this.animAirOff = new Utils.Animation("air off", false, FRAMES, 2, [9, 10], null);
            }
            FRAMES[0].applyToBox(_this.boxSolid);
            _this.xAlign = "middle";
            if (def.flip.y) {
                _this.yAlign = "end";
            }
            else {
                _this.yAlign = "end";
            }
            _this.drawFront = true;
            return _this;
        }
        Enemy.prototype.initStates = function () {
            var _this = this;
            _super.prototype.initStates.call(this);
            this.stateMove = new Game.State(this);
            this.stateAir = new Game.State(this);
            this.stateMove.onEnter = function () {
                _this.animator.setAnimation(_this.on ? _this.animMoveOn : _this.animMoveOff);
            };
            this.stateMove.onOverlapUpdate = function () {
                _this.fixBoxPatrolPosition();
                _this.needFlip = _this.needFlip || (_this.yContacts != null && _this.boxPatrol.collide(Game.SceneMap.instance.boxesTiles, null, true, 0, true, Engine.Box.LAYER_ALL) == null);
            };
            this.stateMove.addLink(this.stateAir, function () { return _this.yContacts == null; });
            this.stateAir.onEnter = function () {
                _this.animator.setAnimation(_this.on ? _this.animAirOn : _this.animAirOff);
            };
            this.stateAir.addLink(this.stateMove, function () { return _this.yContacts != null; });
            this.machine.anyState.onOverlapUpdate = function () {
                _this.needFlip = _this.needFlip || _this.xDirContact != 0;
            };
            this.machine.anyState.onStepUpdate = function () {
                if (_this.needFlip) {
                    _this.sprite.xMirror = !_this.sprite.xMirror;
                    _this.xVel *= -1;
                }
                _this.needFlip = false;
            };
            return this.stateMove;
        };
        Enemy.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.on = this.getProperty("on");
            this.boxSolid.enabled = this.on;
            this.gravityScale = this.sprite.yMirror ? -1 : 1;
            this.xVel = this.velMove * (this.sprite.xMirror ? -1 : 1);
            this.needFlip = false;
        };
        Enemy.prototype.setOn = function (on) {
            this.on = on;
            this.boxSolid.enabled = on;
            if (this.machine.currentState == this.stateMove) {
                this.animator.setAnimation(this.on ? this.animMoveOn : this.animMoveOff, true);
            }
            else if (this.machine.currentState == this.stateAir) {
                this.animator.setAnimation(this.on ? this.animAirOn : this.animAirOff, true);
            }
        };
        Enemy.switchBlues = function (loud) {
            var switched = false;
            for (var _i = 0, _a = Enemy.enemies; _i < _a.length; _i++) {
                var enemy = _a[_i];
                if (enemy.blue) {
                    enemy.setOn(!enemy.on);
                    switched = true;
                }
            }
            if (switched && loud) {
                Game.Resources.sfxSwitch.play();
            }
        };
        Enemy.prototype.fixBoxPatrolPosition = function () {
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
        Enemy.prototype.onDrawObjectsFront = function () {
            _super.prototype.onDrawObjectsFront.call(this);
            if (this.boxPatrol.enabled && this.boxPatrol.renderable) {
                this.fixBoxPatrolPosition();
                this.boxPatrol.render();
            }
        };
        Enemy.prototype.onClearScene = function () {
            if (Enemy.enemies.length > 0) {
                Enemy.enemies = [];
            }
        };
        Enemy.enemies = [];
        return Enemy;
    }(Game.PhysicEntity));
    Game.Enemy = Enemy;
    var FRAMES;
    Game.addAction("configure", function () {
        //    FRAMES = FrameSelector.complex(Resources.texture, 108, 221);
    });
})(Game || (Game = {}));
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var VEL = 1.0;
    var STEPS = 5;
    var ExploPlayer = /** @class */ (function (_super) {
        __extends(ExploPlayer, _super);
        function ExploPlayer() {
            var _this = _super.call(this) || this;
            _this.enabled = false;
            _this.countSteps = 0;
            _this.spriteTopLeft = new Engine.Sprite();
            _this.spriteTopRight = new Engine.Sprite();
            _this.spriteBottomLeft = new Engine.Sprite();
            _this.spriteBottomRight = new Engine.Sprite();
            _this.spriteTop = new Engine.Sprite();
            _this.spriteLeft = new Engine.Sprite();
            _this.spriteBottom = new Engine.Sprite();
            _this.spriteRight = new Engine.Sprite();
            _this.spriteTopLeft.enabled = true;
            _this.spriteTopRight.enabled = true;
            _this.spriteBottomLeft.enabled = true;
            _this.spriteBottomRight.enabled = true;
            _this.spriteTop.enabled = true;
            _this.spriteLeft.enabled = true;
            _this.spriteBottom.enabled = true;
            _this.spriteRight.enabled = true;
            return _this;
        }
        ExploPlayer.prototype.onReset = function () {
            this.enabled = false;
            this.countSteps = 0;
        };
        ExploPlayer.prototype.activate = function (x, y) {
            this.countSteps = 0;
            this.spriteTopLeft.x = x;
            this.spriteTopLeft.y = y;
            this.spriteTopRight.x = x;
            this.spriteTopRight.y = y;
            this.spriteBottomLeft.x = x;
            this.spriteBottomLeft.y = y;
            this.spriteBottomRight.x = x;
            this.spriteBottomRight.y = y;
            this.spriteTop.x = x;
            this.spriteTop.y = y;
            this.spriteLeft.x = x;
            this.spriteLeft.y = y;
            this.spriteBottom.x = x;
            this.spriteBottom.y = y;
            this.spriteRight.x = x;
            this.spriteRight.y = y;
            FRAMES[0].applyToSprite(this.spriteTopLeft);
            FRAMES[0].applyToSprite(this.spriteTopRight);
            FRAMES[0].applyToSprite(this.spriteBottomLeft);
            FRAMES[0].applyToSprite(this.spriteBottomRight);
            FRAMES[0].applyToSprite(this.spriteTop);
            FRAMES[0].applyToSprite(this.spriteLeft);
            FRAMES[0].applyToSprite(this.spriteBottom);
            FRAMES[0].applyToSprite(this.spriteRight);
            this.enabled = true;
        };
        ExploPlayer.prototype.onStepUpdate = function () {
            if (this.enabled && !Game.SceneFreezer.stoped) {
                if (this.countSteps == STEPS) {
                    FRAMES[1].applyToSprite(this.spriteTopLeft);
                    FRAMES[1].applyToSprite(this.spriteTopRight);
                    FRAMES[1].applyToSprite(this.spriteBottomLeft);
                    FRAMES[1].applyToSprite(this.spriteBottomRight);
                    FRAMES[1].applyToSprite(this.spriteTop);
                    FRAMES[1].applyToSprite(this.spriteLeft);
                    FRAMES[1].applyToSprite(this.spriteBottom);
                    FRAMES[1].applyToSprite(this.spriteRight);
                }
                else if (this.countSteps == STEPS * 2) {
                    FRAMES[2].applyToSprite(this.spriteTopLeft);
                    FRAMES[2].applyToSprite(this.spriteTopRight);
                    FRAMES[2].applyToSprite(this.spriteBottomLeft);
                    FRAMES[2].applyToSprite(this.spriteBottomRight);
                    FRAMES[2].applyToSprite(this.spriteTop);
                    FRAMES[2].applyToSprite(this.spriteLeft);
                    FRAMES[2].applyToSprite(this.spriteBottom);
                    FRAMES[2].applyToSprite(this.spriteRight);
                }
                else if (this.countSteps == STEPS * 3) {
                    FRAMES[3].applyToSprite(this.spriteTopLeft);
                    FRAMES[3].applyToSprite(this.spriteTopRight);
                    FRAMES[3].applyToSprite(this.spriteBottomLeft);
                    FRAMES[3].applyToSprite(this.spriteBottomRight);
                    FRAMES[3].applyToSprite(this.spriteTop);
                    FRAMES[3].applyToSprite(this.spriteLeft);
                    FRAMES[3].applyToSprite(this.spriteBottom);
                    FRAMES[3].applyToSprite(this.spriteRight);
                }
                this.countSteps += 1;
            }
        };
        ExploPlayer.prototype.onDrawParticlesFront = function () {
            if (this.enabled && !Game.SceneFreezer.stoped) {
                this.spriteTopLeft.x -= VEL * Engine.System.deltaTime * (60) * 0.85090352453;
                this.spriteTopLeft.y -= VEL * Engine.System.deltaTime * (60) * 0.85090352453;
                this.spriteTopRight.x += VEL * Engine.System.deltaTime * (60) * 0.85090352453;
                this.spriteTopRight.y -= VEL * Engine.System.deltaTime * (60) * 0.85090352453;
                this.spriteBottomLeft.x -= VEL * Engine.System.deltaTime * (60) * 0.85090352453;
                this.spriteBottomLeft.y += VEL * Engine.System.deltaTime * (60) * 0.85090352453;
                this.spriteBottomRight.x += VEL * Engine.System.deltaTime * (60) * 0.85090352453;
                this.spriteBottomRight.y += VEL * Engine.System.deltaTime * (60) * 0.85090352453;
                this.spriteTop.y -= VEL * Engine.System.deltaTime * (60);
                this.spriteLeft.x -= VEL * Engine.System.deltaTime * (60);
                this.spriteBottom.y += VEL * Engine.System.deltaTime * (60);
                this.spriteRight.x += VEL * Engine.System.deltaTime * (60);
            }
            if (this.enabled) {
                //this.spriteTopLeft.render();
                //this.spriteTopRight.render();
                //this.spriteBottomLeft.render();
                //this.spriteBottomRight.render();
                this.spriteTop.render();
                this.spriteLeft.render();
                this.spriteBottom.render();
                this.spriteRight.render();
            }
        };
        return ExploPlayer;
    }(Engine.Entity));
    Game.ExploPlayer = ExploPlayer;
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("explo player", Game.Resources.texture, 178, 56);
    });
})(Game || (Game = {}));
///<reference path="PhysicEntity.ts"/>
var Game;
(function (Game) {
    var Goal = /** @class */ (function (_super) {
        __extends(Goal, _super);
        function Goal(def) {
            var _this = _super.call(this, def, false, null, true, null) || this;
            _this.last = false;
            _this.got = false;
            _this.hearth = null;
            _this.other = null;
            var otherInstance = Goal.instance;
            Goal.instance = _this;
            _this.drawFront = true;
            _this.yAlign = "end";
            _this.xAlign = "middle";
            _this.xCanMove = false;
            _this.yCanMove = false;
            _this.gravityScale = 0;
            FRAMES[0].applyToBox(_this.boxCheck);
            _this.last = _this.getProperty("last");
            if (_this.last && otherInstance != null) {
                _this.other = otherInstance;
                otherInstance.other = _this;
            }
            _this.hearth = new Game.Hearth();
            return _this;
        }
        Goal.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.got = false;
        };
        Goal.prototype.initStates = function () {
            var _this = this;
            _super.prototype.initStates.call(this);
            var waiting = new Game.State(this);
            var got = new Game.State(this);
            waiting.onEnter = function () {
                if (_this.machine.oldState == got) {
                    _this.animator.setAnimation(ANIM_MAD, true);
                    _this.hearth.hide();
                    _this.got = false;
                }
                else {
                    _this.animator.setAnimation(ANIM_NORMAL);
                }
            };
            waiting.onOverlapUpdate = function () {
                _this.got = _this.boxCheck.collideAgainst(Game.Player.instance.boxSolid, null, true, 0, true, Engine.Box.LAYER_ALL) != null;
            };
            waiting.addLink(got, function () { return _this.got; });
            got.onEnter = function () {
                _this.animator.setAnimation(ANIM_GOT, true);
                _this.hearth.show(_this.sprite.x, _this.sprite.y, _this.sprite.yMirror);
                Game.Resources.sfxWin.play();
            };
            got.addLink(waiting, function () { return _this.other != null && _this.other.got; });
            return waiting;
        };
        Goal.prototype.onClearScene = function () {
            Goal.instance = null;
        };
        return Goal;
    }(Game.PhysicEntity));
    Game.Goal = Goal;
    var FRAMES;
    var ANIM_NORMAL;
    var ANIM_MAD;
    var ANIM_GOT;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("goal", Game.Resources.texture, 95, 72);
        ANIM_NORMAL = new Utils.Animation("normal", true, FRAMES, 10, [1, 2, 3, 2], null);
        ANIM_MAD = new Utils.Animation("mad", true, FRAMES, 13, [7, 8, 9, 8], null);
        ANIM_GOT = new Utils.Animation("got", true, FRAMES, 6, [4, 5, 6, 5], null);
    });
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
        FRAMES = Game.FrameSelector.complex("hearth", Game.Resources.texture, 95, 118);
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
            var none = new Game.State(this);
            var appear = new Game.State(this);
            var stay = new Game.State(this);
            var hide = new Game.State(this);
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
            this.machine = new Game.StateMachine(this);
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
            this.sprite.render();
        };
        return Hearth;
    }(Engine.Entity));
    Game.Hearth = Hearth;
})(Game || (Game = {}));
///<reference path="PhysicEntity.ts"/>
var Game;
(function (Game) {
    var STEPS_SWITCH = 5;
    var X_VEL = 0.75;
    var STEPS_WAIT_WINNING = 60;
    var STEPS_WAIT_LOSSING = 26;
    var CAN_FALL = true;
    var FRAMES;
    var ANIM_MOVE;
    var ANIM_AIR;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("player", Game.Resources.texture, 178, 24);
        ANIM_MOVE = new Utils.Animation("move", true, FRAMES, 6, [1, 2, 3, 2], null);
        ANIM_AIR = new Utils.Animation("air", false, FRAMES, 1, [4], null);
    });
    var Player = /** @class */ (function (_super) {
        __extends(Player, _super);
        function Player(def) {
            var _this = _super.call(this, def, true, null, false, null) || this;
            Player.instance = _this;
            FRAMES[0].applyToBox(_this.boxSolid);
            _this.xAlign = "middle";
            _this.yAlign = "end";
            _this.controllable = _this.getProperty("controllable");
            _this.boxPatrol = new Engine.Box();
            _this.boxPatrol.enabled = true;
            _this.boxPatrol.renderable = true;
            _this.boxPatrol.xSize = 1;
            _this.boxPatrol.ySize = 1;
            _this.boxPatrol.green = 0;
            _this.boxPatrol.blue = 1;
            _this.control = new Game.Control();
            _this.control.enabled = true;
            _this.control.freezeable = true;
            _this.control.newInteractionRequired = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            _this.control.useTouch = true;
            _this.control.useKeyboard = true;
            _this.control.keys = [Engine.Keyboard.X, Engine.Keyboard.SPACE, "Space", "spacebar", "space", " "];
            _this.explo = new Game.ExploPlayer();
            return _this;
        }
        Object.defineProperty(Player.prototype, "requireSwitch", {
            get: function () {
                return !this.winning && !this.losing && this.controllable && this.control.stepsSincePressed > 0 && this.control.stepsSincePressed < STEPS_SWITCH;
            },
            enumerable: false,
            configurable: true
        });
        Player.prototype.initStates = function () {
            var _this = this;
            _super.prototype.initStates.call(this);
            var move = new Game.State(this, "move");
            var air = new Game.State(this, "air");
            var dead = new Game.State(this, "dead");
            move.onEnter = function () {
                _this.animator.setAnimation(ANIM_MOVE);
                _this.xVel = X_VEL * (_this.sprite.xMirror ? -1 : 1);
            };
            move.onMoveUpdate = function () {
                _this.fixBoxPatrolPosition();
                if (_this.xDirContact != 0 || (!CAN_FALL && _this.yContacts != null && _this.boxPatrol.collide(Game.SceneMap.instance.boxesTiles, null, true, 0, true, Engine.Box.LAYER_ALL) == null)) {
                    _this.sprite.xMirror = !_this.sprite.xMirror;
                    _this.xVel = X_VEL * (_this.sprite.xMirror ? -1 : 1);
                }
                else {
                }
            };
            move.onOverlapUpdate = function () {
                _this.checkOverlaps();
            };
            move.onExit = function () {
                _this.xVel = 0;
            };
            move.addLink(dead, function () { return _this.losing; });
            move.addLink(air, function () { return _this.yDirContact == 0 || _this.requireSwitch; });
            air.onEnter = function () {
                _this.animator.setAnimation(ANIM_AIR);
                if (_this.yDirContact != 0 && _this.requireSwitch) {
                    _this.sprite.yMirror = !_this.sprite.yMirror;
                    _this.gravityScale *= -1;
                    var blocksSwitched = _this.checkSwitchBlocks();
                    if (blocksSwitched) {
                        Game.Resources.sfxSwitch.play();
                    }
                    else {
                        Game.Resources.sfxJump.play();
                    }
                }
            };
            air.onOverlapUpdate = function () {
                _this.checkOverlaps();
            };
            air.onExit = function () {
                for (var rep = 0; rep < 2; rep += 1) {
                    _this.fixBoxPatrolPosition();
                    if (!CAN_FALL && _this.boxPatrol.collide(Game.SceneMap.instance.boxesTiles, null, true, 0, true, Engine.Box.LAYER_ALL) == null) {
                        _this.sprite.xMirror = !_this.sprite.xMirror;
                    }
                }
            };
            air.addLink(dead, function () { return _this.losing; });
            air.addLink(move, function () { return _this.yDirContact != 0; });
            dead.onEnter = function () {
                Game.Resources.sfxDeath.play();
                _this.sprite.enabled = false;
                _this.explo.activate(_this.boxSolid.x, _this.boxSolid.y - _this.boxSolid.ySize * 0.5);
                _this.gravityScale = 0;
                _this.xVel = 0;
                _this.yVel = 0;
            };
            this.machine.anyState.onStepUpdate = function () {
                if (_this.winning || _this.losing) {
                    _this.countStepsWait += 1;
                    _this.hasWon = _this.winning && _this.countStepsWait >= STEPS_WAIT_WINNING;
                    _this.hasLost = _this.losing && _this.countStepsWait >= STEPS_WAIT_LOSSING;
                }
            };
            return move;
        };
        Player.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            this.gravityScale = this.sprite.yMirror ? -1 : 1;
            this.countStepsWait = 0;
            this.winning = false;
            this.hasWon = false;
            this.losing = false;
            this.hasLost = false;
        };
        Player.prototype.fixBoxPatrolPosition = function () {
            this.boxPatrol.x = this.boxSolid.x;
            if (this.sprite.yMirror) {
                this.boxPatrol.y = this.boxSolid.y - this.boxSolid.ySize - 1;
            }
            else {
                this.boxPatrol.y = this.boxSolid.y;
            }
            if (this.sprite.xMirror) {
                this.boxPatrol.x -= (this.boxSolid.xSize * 0.5 + 1);
            }
            else {
                this.boxPatrol.x += this.boxSolid.xSize * 0.5;
            }
        };
        Player.prototype.checkOverlaps = function () {
            if (this.controllable) {
                if (!this.winning && Game.Goal.instance != null && !Game.Goal.instance.last) {
                    this.winning = this.boxSolid.collideAgainst(Game.Goal.instance.boxCheck, null, true, 0, true, Engine.Box.LAYER_ALL) != null;
                }
                if (!this.winning && !this.losing) {
                    var contacts = this.boxSolid.collide(Game.SceneMap.instance.boxesEnemies, null, true, 0, true, Engine.Box.LAYER_ALL);
                    if (contacts != null || (this.boxSolid.y < this.boxSolid.ySize * 0.5 || this.boxSolid.y >= Game.SceneMap.instance.ySizeMap + this.boxSolid.ySize * 0.5)) {
                        this.losing = true;
                        Game.Resources.sfxDeath.play();
                    }
                }
            }
        };
        Player.prototype.checkSwitchBlocks = function () {
            if (this.yContacts == null) {
                return false;
            }
            var blockTypes = [];
            for (var _i = 0, _a = this.yContacts; _i < _a.length; _i++) {
                var contact = _a[_i];
                if (contact.other.data != null && contact.other.data.switchType != null && contact.other.data.switchType != undefined) {
                    if (blockTypes.indexOf(contact.other.data.switchType) < 0) {
                        blockTypes.push(contact.other.data.switchType);
                    }
                }
            }
            for (var _b = 0, blockTypes_1 = blockTypes; _b < blockTypes_1.length; _b++) {
                var type = blockTypes_1[_b];
                Game.Level.switchBlocks(type);
            }
            return blockTypes.length > 0;
        };
        Player.prototype.onViewUpdate = function () {
            this.tryFixTouchControls();
        };
        Player.prototype.tryFixTouchControls = function () {
            if (Game.IS_TOUCH) {
            }
        };
        Player.prototype.onStepUpdate = function () {
            //this.drawAfterUI = !SceneFreezer.stoped;
        };
        Player.prototype.onDrawObjectsFront = function () {
            _super.prototype.onDrawObjectsFront.call(this);
            if (this.boxPatrol.enabled && this.boxPatrol.renderable) {
                this.fixBoxPatrolPosition();
                this.boxPatrol.render();
            }
        };
        Player.prototype.onClearScene = function () {
            Player.instance = null;
        };
        return Player;
    }(Game.PhysicEntity));
    Game.Player = Player;
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
                    }
                } while (nextState != null && nextState.transitional);
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
    Game.StateMachine = StateMachine;
})(Game || (Game = {}));
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var BoxBlocks = /** @class */ (function (_super) {
        __extends(BoxBlocks, _super);
        function BoxBlocks(block) {
            var _this = _super.call(this) || this;
            _this.type = "";
            _this.box = new Engine.Box();
            _this.box.data = block;
            _this.box.renderable = true;
            Game.SceneMap.instance.boxesTiles.push(_this.box);
            Block.boxesBlocks.push(_this);
            return _this;
        }
        BoxBlocks.prototype.onReset = function () {
            this.box.enabled = this.startOn;
        };
        BoxBlocks.prototype.switchOn = function () {
            this.box.enabled = !this.box.enabled;
        };
        BoxBlocks.prototype.onDrawObjectsBack = function () {
            this.box.render();
        };
        return BoxBlocks;
    }(Engine.Entity));
    var Block = /** @class */ (function (_super) {
        __extends(Block, _super);
        function Block(def) {
            var _this = _super.call(this, def) || this;
            _this.type = "";
            _this.processed = false;
            Block.blockArrayEmpty = false;
            Block.blockArray.push(_this);
            _this.xOrder = _this.getProperty("x order");
            _this.yOrder = _this.getProperty("y order");
            _this.sprite = new Engine.Sprite();
            _this.sprite.x = def.instance.x;
            _this.sprite.y = def.instance.y - Game.SceneMap.instance.ySizeTile;
            _this.control = new Game.Control();
            _this.control.bounds = _this.sprite;
            _this.control.enabled = true;
            _this.control.freezeable = true;
            _this.control.listener = _this;
            _this.control.newInteractionRequired = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            //this.control.useTouch = true;
            var x = _this.def.instance.x / Game.SceneMap.instance.xSizeTile;
            var y = _this.def.instance.y / Game.SceneMap.instance.ySizeTile;
            Block.matrix[y * Game.SceneMap.instance.xCountTiles + x] = _this;
            return _this;
        }
        Block.prototype.onCreateScene = function () {
            if (!Block.matrixProcessed) {
                for (var y = 0; y < Game.SceneMap.instance.yCountTiles; y += 1) {
                    for (var x = 0; x < Game.SceneMap.instance.xCountTiles; x += 1) {
                        var block = Block.matrix[y * Game.SceneMap.instance.xCountTiles + x];
                        if (block != null && !block.processed) {
                            block.processed = true;
                            Block.createBoxesBlock(x, y, block);
                        }
                    }
                }
                Block.matrixProcessed = true;
            }
        };
        Block.createBoxesBlock = function (xStart, yStart, block) {
            var xSize = 1;
            var ySize = 1;
            for (var x = xStart + 1; x < Game.SceneMap.instance.xCountTiles; x += 1) {
                var other = Block.matrix[yStart * Game.SceneMap.instance.xCountTiles + x];
                if (other != null && !other.processed && other.type == block.type && other.getProperty("on") == block.getProperty("on")) {
                    other.processed = true;
                    xSize += 1;
                }
                else {
                    break;
                }
            }
            for (var y = yStart + 1; y < Game.SceneMap.instance.yCountTiles; y += 1) {
                var other = Block.matrix[y * Game.SceneMap.instance.xCountTiles + xStart];
                if (other != null && !other.processed && other.type == block.type && other.getProperty("on") == block.getProperty("on")) {
                    other.processed = true;
                    ySize += 1;
                }
                else {
                    break;
                }
            }
            if (xSize != 1 || ySize == 1) {
                var box = new BoxBlocks(block);
                box.type = block.type;
                box.startOn = block.getProperty("on");
                box.box.x = block.def.instance.x;
                box.box.y = block.def.instance.y - Game.SceneMap.instance.ySizeTile;
                box.box.xSize = xSize * Game.SceneMap.instance.xSizeTile;
                box.box.ySize = 1 * Game.SceneMap.instance.ySizeTile;
            }
            if (ySize > 1) {
                var box = new BoxBlocks(block);
                box.type = block.type;
                box.startOn = block.getProperty("on");
                box.box.x = block.def.instance.x;
                box.box.y = block.def.instance.y - Game.SceneMap.instance.ySizeTile;
                box.box.xSize = 1 * Game.SceneMap.instance.xSizeTile;
                box.box.ySize = ySize * Game.SceneMap.instance.ySizeTile;
            }
        };
        Block.prototype.onReset = function () {
            this.setOn(this.getProperty("on"));
        };
        Block.prototype.setOn = function (on) {
            this.on = on;
            var xTextureOffset = 11 * (this.on ? 0 : 1) + 22 * this.xOrder;
            var yTextureOffset = 11 * this.yOrder;
            this.sprite.setFull(true, false, Game.Resources.texture, 8, 8, 0, 0, 14 + xTextureOffset, 102 + yTextureOffset, 8, 8);
        };
        Block.prototype.switchAllOfType = function (loud) {
            if (loud === void 0) { loud = true; }
            for (var _i = 0, _a = Block.blockArray; _i < _a.length; _i++) {
                var block = _a[_i];
                if (block.type == this.type) {
                    block.setOn(!block.on);
                }
            }
            for (var _b = 0, _c = Block.boxesBlocks; _b < _c.length; _b++) {
                var box = _c[_b];
                if (box.type == this.type) {
                    box.switchOn();
                }
            }
            if (loud) {
                Game.Resources.sfxSwitch.play();
            }
        };
        Block.switchBlues = function () {
            for (var _i = 0, _a = Block.blockArray; _i < _a.length; _i++) {
                var block = _a[_i];
                if (block.type == "blue") {
                    block.switchAllOfType(true);
                    break;
                }
            }
        };
        Block.prototype.onClearScene = function () {
            if (!Block.blockArrayEmpty) {
                Block.blockArray = [];
                Block.blockArrayEmpty = true;
            }
            if (Block.matrixProcessed) {
                Block.matrix = [];
                Block.boxesBlocks = [];
                Block.matrixProcessed = false;
            }
        };
        Block.prototype.onDrawObjectsBack = function () {
            this.sprite.render();
        };
        Block.blockArrayEmpty = true;
        Block.blockArray = new Array();
        Block.matrix = [];
        Block.matrixProcessed = false;
        Block.boxesBlocks = [];
        return Block;
    }(Game.Entity));
    Game.Block = Block;
    var PurpleBlock = /** @class */ (function (_super) {
        __extends(PurpleBlock, _super);
        function PurpleBlock(def) {
            var _this = _super.call(this, def) || this;
            _this.type = "purple";
            return _this;
        }
        return PurpleBlock;
    }(Block));
    Game.PurpleBlock = PurpleBlock;
    var BlueBlock = /** @class */ (function (_super) {
        __extends(BlueBlock, _super);
        function BlueBlock(def) {
            var _this = _super.call(this, def) || this;
            _this.type = "blue";
            return _this;
        }
        return BlueBlock;
    }(Block));
    Game.BlueBlock = BlueBlock;
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
            FRAMES[7 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
        };
        ExitButton.prototype.onClearScene = function () {
            ExitButton.instance = null;
        };
        return ExitButton;
    }(Game.Button));
    Game.ExitButton = ExitButton;
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("exit button", Game.Resources.texture, 13, 35);
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
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("music button", Game.Resources.texture, 13, 35);
    });
})(Game || (Game = {}));
///<reference path="../../System/Button.ts"/>
var Game;
(function (Game) {
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
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("pause button", Game.Resources.texture, 13, 35);
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
            FRAMES[6 + (Game.IS_TOUCH ? 8 : 0)].applyToSprite(this.bounds);
        };
        ResetButton.prototype.onClearScene = function () {
            ResetButton.instance = null;
        };
        return ResetButton;
    }(Game.Button));
    Game.ResetButton = ResetButton;
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("reset button", Game.Resources.texture, 13, 35);
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
    var FRAMES;
    Game.addAction("configure", function () {
        FRAMES = Game.FrameSelector.complex("sound button", Game.Resources.texture, 13, 35);
    });
})(Game || (Game = {}));
var Game;
(function (Game) {
    var JumpTutorialBig = /** @class */ (function () {
        function JumpTutorialBig() {
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.a;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = Game.IS_TOUCH ? "YOU CAN HOLD YOUR TOUCHS" : "YOU CAN HOLD THE BUTTON";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.START;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.xAligned = 0;
            text0.yAligned = -38 + 4 - 1;
            var text1 = new Utils.Text();
            text1.font = Game.FontManager.a;
            text1.scale = 1;
            text1.enabled = true;
            text1.pinned = true;
            text1.str = "TO JUMP HIGHER!";
            text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignBounds = Utils.AnchorAlignment.START;
            text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.xAligned = 0;
            text1.yAligned = -31 + 4 + 0;
        }
        return JumpTutorialBig;
    }());
    Game.JumpTutorialBig = JumpTutorialBig;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var JumpTutorialSmall = /** @class */ (function () {
        function JumpTutorialSmall() {
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.a;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = Game.IS_TOUCH ? "TOUCH THE RIGHT SIDE" : "C, UP ARROW OR";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.START;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.xAligned = 0;
            text0.yAligned = -38 + 4 - 1;
            var text1 = new Utils.Text();
            text1.font = Game.FontManager.a;
            text1.scale = 1;
            text1.enabled = true;
            text1.pinned = true;
            text1.str = Game.IS_TOUCH ? "OF THE SCREEN TO JUMP!" : "LEFT CLICK TO JUMP!";
            text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignBounds = Utils.AnchorAlignment.START;
            text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.xAligned = 0;
            text1.yAligned = -31 + 4 + 0;
            var text2 = new Utils.Text();
            text2.font = Game.FontManager.a;
            text2.scale = 1;
            text2.enabled = true;
            text2.pinned = true;
            text2.str = "ALSO, YOU CAN PERFORM";
            text2.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text2.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text2.yAlignBounds = Utils.AnchorAlignment.START;
            text2.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text2.xAligned = 0;
            text2.yAligned = 38 - 4 + 2 + 3 + 2 - 1;
            var text3 = new Utils.Text();
            text3.font = Game.FontManager.a;
            text3.scale = 1;
            text3.enabled = true;
            text3.pinned = true;
            text3.str = "WALL JUMPS!";
            text3.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text3.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text3.yAlignBounds = Utils.AnchorAlignment.START;
            text3.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text3.xAligned = 0;
            text3.yAligned = 45 - 4 + 2 + 3 + 2 + 0;
        }
        return JumpTutorialSmall;
    }());
    Game.JumpTutorialSmall = JumpTutorialSmall;
})(Game || (Game = {}));
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
            _this.text0.str = "LEVEL " + (Game.Level.index < 10 ? "0" : "") + Game.Level.index;
            _this.text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.text0.yAlignBounds = Utils.AnchorAlignment.END;
            _this.text0.yAlignView = Utils.AnchorAlignment.END;
            _this.text0.xAligned = 0;
            _this.text0.yAligned = -Game.Y_BUTTONS_TOP;
            return _this;
        }
        LevelText.prototype.onStepUpdate = function () {
            var enabled = Game.Level.index > 1 && Engine.Renderer.xSizeView / Engine.Renderer.ySizeView >= 1.25;
            if (this.text0.enabled != enabled) {
                //this.text0.enabled = enabled;
            }
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
            _this.text.xAligned = 0;
            _this.text.yAligned = Game.Y_ARROWS_GAME_BUTTONS + 1;
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
///<reference path="../Entity.ts"/>
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
///<reference path="../Entity.ts"/>
var Game;
(function (Game) {
    var SwitchTutorial2 = /** @class */ (function (_super) {
        __extends(SwitchTutorial2, _super);
        function SwitchTutorial2(def) {
            var _this = _super.call(this, def) || this;
            var pos = -20 - 11 - 11 - 5 + 3 + 2;
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.a;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = "WHEN YOU SWITCH THE GRAVITY WHILE WALKING";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.xAligned = 0;
            text0.yAligned = pos;
            text0.front = false;
            var text1 = new Utils.Text();
            text1.font = Game.FontManager.a;
            text1.scale = 1;
            text1.enabled = true;
            text1.pinned = true;
            text1.str = "ON A COLORED PLATFORM, YOU FLIP THE STATE";
            text1.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text1.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text1.xAligned = 0;
            text1.yAligned = pos + 7;
            text1.front = false;
            var text2 = new Utils.Text();
            text2.font = Game.FontManager.a;
            text2.scale = 1;
            text2.enabled = true;
            text2.pinned = true;
            text2.str = "OF ALL PLATFORMS OF THE SAME COLOR";
            text2.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text2.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text2.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text2.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text2.xAligned = 0;
            text2.yAligned = pos + 14;
            text2.front = false;
            return _this;
        }
        return SwitchTutorial2;
    }(Game.Entity));
    Game.SwitchTutorial2 = SwitchTutorial2;
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
            _this.spritesTiles = [];
            _this.boxesTiles = [];
            _this.boxesEnemies = [];
            _this.dataTiles = [];
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
            this.spritesTiles = new Array();
            this.boxesTiles = new Array();
            this.xSizeMap = this.defMap.width * this.xSizeTile;
            this.ySizeMap = this.defMap.height * this.ySizeTile;
        };
        SceneMap.prototype.createMap = function () {
            for (var _i = 0, _a = this.defMap.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                if (layer.name.indexOf("Entities") < 0 && layer.name.indexOf("Repeat") < 0 && layer.name.indexOf("Ignore") < 0) {
                    var indexTile = 0;
                    for (var yIndex = 0; yIndex < this.yCountTiles; yIndex += 1) {
                        for (var xIndex = 0; xIndex < this.xCountTiles; xIndex += 1) {
                            if (layer.data[indexTile] != 0) {
                                var x = xIndex * this.xSizeTile;
                                var y = yIndex * this.ySizeTile;
                                var sprite = this.createSpriteTile(layer.data[indexTile], x, y);
                                sprite.data = null;
                                var box = null;
                                if (this.getTileType(layer.data[indexTile]) == "Solid") {
                                    box = new Engine.Box();
                                    box.enabled = true;
                                    box.renderable = true;
                                    box.layer = Engine.Box.LAYER_ALL;
                                    box.x = x;
                                    box.y = y;
                                    box.xSize = this.xSizeTile;
                                    box.ySize = this.ySizeTile;
                                    this.boxesTiles.push(box);
                                }
                                var data = {};
                                data.type = this.getTileType(layer.data[indexTile]);
                                data.sprite = sprite;
                                data.box = box;
                                var def = this.getTileDef(layer.data[indexTile]);
                                if (def.properties != null && def.properties != undefined) {
                                    for (var _b = 0, _c = def.properties; _b < _c.length; _b++) {
                                        var prop = _c[_b];
                                        data[prop.name] = prop.value;
                                    }
                                }
                                var yIndexTile = new Int32Array([(layer.data[indexTile] - 1) / this.tileColumns]);
                                var xIndexTile = layer.data[indexTile] - 1 - yIndexTile[0] * this.tileColumns;
                                data.xTextureStart = this.offsetTiles + xIndexTile * (this.offsetTiles + this.xSizeTile);
                                data.yTextureStart = this.offsetTiles + yIndexTile[0] * (this.offsetTiles + this.ySizeTile);
                                sprite.data = data;
                                if (box != null) {
                                    box.data = data;
                                }
                                this.dataTiles.push(data);
                                this.spritesTiles.push(sprite);
                            }
                            indexTile += 1;
                        }
                    }
                }
            }
        };
        SceneMap.prototype.createEntities = function () {
            this.boxesEnemies = Array();
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
            var xSizeViewExtra = Engine.Renderer.xSizeView - this.xSizeMap;
            var xOffset = this.xSizeMap;
            while (xSizeViewExtra > 0) {
                this.createRepeatLayerTiles(layer, xOffset, 0);
                this.createRepeatLayerTiles(layer, -xOffset, 0);
                xSizeViewExtra -= this.xSizeMap;
                xOffset += this.xSizeMap;
            }
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
                    this.createRepeatLayer(layer);
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
            sprite.setFull(true, false, Game.Resources.texture, this.xSizeTile, this.ySizeTile, 0, 0, xTexture, yTexture, this.xSizeTile, this.ySizeTile);
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
        SceneMap.prototype.getTileType = function (id) {
            var typedef = Game.findInJSON(this.tiles, function (typedef) {
                return typedef.id == id - 1;
            });
            if (typedef != null) {
                return typedef.type;
            }
            return null;
        };
        SceneMap.prototype.onViewUpdate = function () {
            this.createRepeats();
            this.createSky();
        };
        SceneMap.prototype.onDrawSceneMap = function () {
            for (var _i = 0, _a = this.spritesRepeat; _i < _a.length; _i++) {
                var sprite = _a[_i];
                sprite.render();
            }
            for (var _b = 0, _c = this.spritesTiles; _b < _c.length; _b++) {
                var sprite = _c[_b];
                sprite.render();
            }
            for (var _d = 0, _e = this.boxesTiles; _d < _e.length; _d++) {
                var box = _e[_d];
                box.render();
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
    var Y_COUNT_BUTTONS = 4;
    var X_SIZE_BUTTON = 34;
    var Y_SIZE_BUTTON = 14;
    var Y_SPEARATION_BUTTONS = 4;
    var Credits = /** @class */ (function (_super) {
        __extends(Credits, _super);
        function Credits() {
            var _this = _super.call(this) || this;
            _this.yButtons = -29.5;
            new Game.MusicButton();
            new Game.SoundButton();
            var dialog = new Game.ColorDialog("blue", 0, -56 * 0.5, 152 + 4 - 32 - 26, 56);
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
            devone.yAligned = dialog.y + 3;
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
            devtwo.yAligned = devone.y + 7;
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
            musone.yAligned = devtwo.y + 11;
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
            mustwo.yAligned = musone.y + 7;
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
            thuone.yAligned = mustwo.y + 11;
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
            thutwo.xAligned = 0;
            thutwo.yAligned = thuone.y + 7;
            _this.backButton = new Game.DialogButton(0, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * Y_COUNT_BUTTONS + 2 - 7 - 0.5, X_SIZE_BUTTON + 5, Y_SIZE_BUTTON);
            _this.backButton.control.listener = _this;
            _this.backButton.text.font = Game.FontManager.a;
            _this.backButton.text.scale = 1;
            _this.backButton.text.enabled = true;
            _this.backButton.text.pinned = true;
            _this.backButton.text.str = "BACK";
            _this.backButton.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.backButton.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.backButton.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.backButton.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.backButton.text.xAligned = _this.backButton.dialog.x;
            _this.backButton.text.yAligned = _this.backButton.dialog.y + 4 - 0.5;
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
        return Credits;
    }(Game.SceneMap));
    Game.Credits = Credits;
})(Game || (Game = {}));
///<reference path="../System/Scene/SceneMap.ts"/>
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
            var text0 = new Utils.Text();
            text0.font = Game.FontManager.a;
            text0.scale = 1;
            text0.enabled = true;
            text0.pinned = true;
            text0.str = "THANKS FOR PLAYING!";
            text0.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text0.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAlignBounds = Utils.AnchorAlignment.START;
            text0.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text0.yAligned = -38 + 4 - 1;
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
            _this.text1.text.yAligned = -31 + 4 + 0;
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
            _this.continueButton = new Game.TextButton();
            _this.continueButton.control.listener = _this;
            _this.continueButton.control.blockOthersSelection = true;
            _this.continueButton.text.font = Game.FontManager.a;
            _this.continueButton.text.scale = 1;
            _this.continueButton.text.enabled = true;
            _this.continueButton.text.pinned = true;
            _this.continueButton.text.str = Game.IS_TOUCH ? "TOUCH HERE TO EXIT" : Game.TEXT_DESKTOP_CONTINUE_EXIT;
            _this.continueButton.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.continueButton.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.continueButton.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.continueButton.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.continueButton.text.yAligned = 40 + 5 + 2 + 0.5;
            //this.start.control.onPressedDelegate = this.startPressed;
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
            Game.Level.resetBlocks();
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
    var X_COUNT_BUTTONS = 4;
    var Y_COUNT_BUTTONS = 3;
    var X_SIZE_BUTTON = 34;
    var Y_SIZE_BUTTON = 14;
    var X_SPEARATION_BUTTONS = 5;
    var Y_SPEARATION_BUTTONS = 4;
    Game.LEVELS_PER_PAGE = 12;
    Game.LEVELS_PAGES = 3;
    Game.MAX_LEVELS = Game.LEVELS_PER_PAGE * Game.LEVELS_PAGES;
    var LevelSelection = /** @class */ (function (_super) {
        __extends(LevelSelection, _super);
        function LevelSelection() {
            var _this = _super.call(this) || this;
            _this.buttons = new Array();
            _this.xButtons = -0.5 * (X_SIZE_BUTTON + X_SPEARATION_BUTTONS) * (X_COUNT_BUTTONS - 1);
            _this.yButtons = -34 + 5;
            _this.yButtons2 = 5;
            LevelSelection.instance = _this;
            new Game.MusicButton();
            new Game.SoundButton();
            var selecttext = new Utils.Text();
            selecttext.font = Game.FontManager.a;
            selecttext.scale = 1;
            selecttext.enabled = true;
            selecttext.pinned = true;
            selecttext.str = "SELECT LEVEL";
            selecttext.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            selecttext.xAlignView = Utils.AnchorAlignment.MIDDLE;
            selecttext.yAlignBounds = Utils.AnchorAlignment.START;
            selecttext.yAlignView = Utils.AnchorAlignment.MIDDLE;
            selecttext.xAligned = 0;
            selecttext.yAligned = -46;
            _this.createButtons();
            //new ColorDialog("purple", 0, -19 + 6, 60, 27);
            _this.backButton = new Game.DialogButton(0, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * (Y_COUNT_BUTTONS + 0) + 2 + _this.yButtons2, X_SIZE_BUTTON + 5, Y_SIZE_BUTTON);
            _this.backButton.control.listener = _this;
            _this.backButton.text.font = Game.FontManager.a;
            _this.backButton.text.scale = 1;
            _this.backButton.text.enabled = true;
            _this.backButton.text.pinned = true;
            _this.backButton.text.str = "BACK";
            _this.backButton.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.backButton.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.backButton.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.backButton.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.backButton.text.xAligned = _this.backButton.dialog.x;
            _this.backButton.text.yAligned = _this.backButton.dialog.y + 4 - 0.5;
            _this.backButton.control.useKeyboard = true;
            _this.backButton.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            _this.backButton.control.onPressedDelegate = _this.backPressed;
            _this.backButton.control.onReleasedDelegate = _this.backReleased;
            _this.switchButton = new Game.DialogButton(_this.buttons[_this.buttons.length - 2].dialog.x + X_SIZE_BUTTON + X_SPEARATION_BUTTONS, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * Y_COUNT_BUTTONS + 2 + _this.yButtons2, X_SIZE_BUTTON, Y_SIZE_BUTTON);
            _this.switchButton.control.listener = _this;
            _this.switchButton.text.font = Game.FontManager.a;
            _this.switchButton.text.scale = 1;
            _this.switchButton.text.enabled = true;
            _this.switchButton.text.pinned = true;
            _this.switchButton.text.str = ">";
            _this.switchButton.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.switchButton.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.switchButton.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.switchButton.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.switchButton.text.xAligned = _this.switchButton.dialog.x;
            _this.switchButton.text.yAligned = _this.switchButton.dialog.y + 4 - 0.5;
            _this.switchButton.arrows.enabled = false;
            _this.switchButton.control.onSelectionStartDelegate = _this.switchEnter;
            _this.switchButton.control.onSelectionEndDelegate = _this.switchExit;
            _this.switchButton.control.onPressedDelegate = _this.switchPress;
            _this.switchButton2 = new Game.DialogButton(_this.buttons[_this.buttons.length - 4].dialog.x, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * Y_COUNT_BUTTONS + 2 + _this.yButtons2, X_SIZE_BUTTON, Y_SIZE_BUTTON);
            _this.switchButton2.control.listener = _this;
            _this.switchButton2.text.font = Game.FontManager.a;
            _this.switchButton2.text.scale = 1;
            _this.switchButton2.text.enabled = true;
            _this.switchButton2.text.pinned = true;
            _this.switchButton2.text.str = "<";
            _this.switchButton2.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.switchButton2.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.switchButton2.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.switchButton2.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.switchButton2.text.xAligned = _this.switchButton2.dialog.x;
            _this.switchButton2.text.yAligned = _this.switchButton2.dialog.y + 4 - 0.5;
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
                    this.buttons[count] = new Game.DialogButton(x, y, X_SIZE_BUTTON, Y_SIZE_BUTTON);
                    this.buttons[count].owner = this;
                    this.buttons[count].control.listener = this.buttons[count];
                    this.buttons[count].text.font = Game.FontManager.a;
                    this.buttons[count].text.scale = 1;
                    this.buttons[count].text.enabled = true;
                    this.buttons[count].text.pinned = true;
                    this.buttons[count].text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                    this.buttons[count].text.xAlignView = Utils.AnchorAlignment.MIDDLE;
                    this.buttons[count].text.yAlignBounds = Utils.AnchorAlignment.START;
                    this.buttons[count].text.yAlignView = Utils.AnchorAlignment.MIDDLE;
                    this.buttons[count].text.xAligned = this.buttons[count].dialog.x;
                    this.buttons[count].text.yAligned = this.buttons[count].dialog.y + 4;
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
                        button.text.font = Game.FontManager.a;
                        button.control.enabled = false;
                        button.dialog.style = "clearblue";
                        break;
                    case "unlocked":
                        button.enabled = true;
                        button.dialog.enabled = true;
                        button.control.enabled = true;
                        button.text.font = Game.FontManager.a;
                        button.dialog.style = "purple";
                        break;
                    case "cleared":
                        button.enabled = true;
                        button.dialog.enabled = true;
                        button.control.enabled = true;
                        button.text.font = Game.FontManager.a;
                        button.dialog.style = "blue";
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
    var MainMenu = /** @class */ (function (_super) {
        __extends(MainMenu, _super);
        function MainMenu() {
            var _this = _super.call(this) || this;
            Game.Resources.playBGM();
            new Game.MusicButton();
            new Game.SoundButton();
            Game.TryCreatePlaystoreButton();
            var textmini = new Utils.Text();
            textmini.font = Game.FontManager.a;
            textmini.scale = 1;
            textmini.enabled = true;
            textmini.pinned = true;
            textmini.str = "MINI";
            textmini.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            textmini.xAlignView = Utils.AnchorAlignment.MIDDLE;
            textmini.yAlignBounds = Utils.AnchorAlignment.START;
            textmini.yAlignView = Utils.AnchorAlignment.MIDDLE;
            textmini.xAligned = 0;
            textmini.yAligned = -60 + 6 + 6 + 0;
            var textswitcher = new Utils.Text();
            textswitcher.font = Game.FontManager.a;
            textswitcher.scale = 2;
            textswitcher.enabled = true;
            textswitcher.pinned = true;
            textswitcher.str = "COLORS!";
            textswitcher.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            textswitcher.xAlignView = Utils.AnchorAlignment.MIDDLE;
            textswitcher.yAlignBounds = Utils.AnchorAlignment.START;
            textswitcher.yAlignView = Utils.AnchorAlignment.MIDDLE;
            textswitcher.xAligned = 0;
            textswitcher.yAligned = -60 + 6 + 13 + 0;
            _this.start = new Game.TextButton();
            _this.start.control.listener = _this;
            _this.start.text.font = Game.FontManager.a;
            _this.start.text.scale = 1;
            _this.start.text.enabled = true;
            _this.start.text.pinned = true;
            _this.start.text.str = "START";
            _this.start.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.start.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.start.text.yAlignBounds = Utils.AnchorAlignment.START;
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
            _this.speedrun.text.yAlignBounds = Utils.AnchorAlignment.START;
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
            _this.credits.text.yAlignBounds = Utils.AnchorAlignment.START;
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
                _this.moregames.text.yAlignBounds = Utils.AnchorAlignment.START;
                _this.moregames.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
                //this.moregames.text.setUnderlineShadowColor(0, 0, 252 / 255, 1);
            }
            if (Game.IS_TOUCH) {
                var xsize = 56;
                var ysize = 15;
                var ypos = 0;
                var yoff = 0;
                if (Game.HAS_LINKS) {
                    var xpos = -31;
                    var xoff = 62;
                    ypos = -19;
                    yoff = 22;
                    _this.starttouch = new Game.ColorDialog("blue", xpos, ypos, xsize, ysize);
                    _this.speedruntouch = new Game.ColorDialog("blue", xpos + xoff, ypos, xsize, ysize);
                    _this.creditstouch = new Game.ColorDialog("blue", xpos, ypos + yoff, xsize, ysize);
                    _this.moregamestouch = new Game.ColorDialog("blue", xpos + xoff, ypos + yoff, xsize, ysize);
                    //new ColorDialog("purple", 0, yPos + yOff * 2, 50, 12);
                }
                else {
                    ypos = -23;
                    yoff = 19;
                    _this.starttouch = new Game.ColorDialog("blue", 0, ypos, xsize, ysize);
                    _this.speedruntouch = new Game.ColorDialog("blue", 0, ypos + yoff, xsize, ysize);
                    _this.creditstouch = new Game.ColorDialog("blue", 0, ypos + yoff * 2, xsize, ysize);
                }
                _this.start.text.xAligned = _this.starttouch.x;
                _this.start.text.yAligned = _this.starttouch.y + 4;
                _this.start.control.bounds = _this.starttouch.fill;
                _this.speedrun.text.xAligned = _this.speedruntouch.x;
                _this.speedrun.text.yAligned = _this.speedruntouch.y + 4;
                _this.speedrun.control.bounds = _this.speedruntouch.fill;
                _this.credits.text.xAligned = _this.creditstouch.x;
                _this.credits.text.yAligned = _this.creditstouch.y + 4;
                _this.credits.control.bounds = _this.creditstouch.fill;
                if (Game.HAS_LINKS) {
                    _this.moregames.text.xAligned = _this.moregamestouch.x;
                    _this.moregames.text.yAligned = _this.moregamestouch.y + 4;
                    _this.moregames.control.bounds = _this.moregamestouch.fill;
                    _this.loadMap(Game.Resources.PATH_MAP_MAIN_MENU);
                }
                else {
                    _this.loadMap(Game.Resources.PATH_MAP_MAIN_MENU_TOUCH);
                }
            }
            else {
                if (Game.HAS_LINKS) {
                    new Game.ColorDialog("blue", 0, -19, 60, 37);
                    _this.start.text.yAligned = -60 + 44;
                    _this.speedrun.text.yAligned = -60 + 44 + 7;
                    _this.credits.text.yAligned = -60 + 44 + 14;
                    _this.moregames.text.yAligned = -60 + 44 + 21;
                    _this.moregames.text.underlined = true;
                }
                else {
                    new Game.ColorDialog("blue", 0, -19 + 6, 60, 27);
                    _this.start.text.yAligned = -60 + 44 + 6;
                    _this.speedrun.text.yAligned = -60 + 44 + 6 + 7;
                    _this.credits.text.yAligned = -60 + 44 + 6 + 14;
                }
                _this.loadMap(Game.Resources.PATH_MAP_MAIN_MENU);
            }
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
            _this.kezarts.text.str = Game.HAS_LINKS && Game.HAS_LINKS_KEZARTS ? "KEZARTS.COM" : "BY KEZARTS";
            _this.kezarts.text.underlined = Game.HAS_LINKS_KEZARTS;
            _this.kezarts.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.yAlignBounds = Utils.AnchorAlignment.END;
            _this.kezarts.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.kezarts.text.yAligned = 60 + ((Game.IS_TOUCH && !Game.HAS_LINKS_KEZARTS) ? -3 : -6);
            //this.kezarts.arrows.enabled = false;
            //}
            var x = _this.xSizeMap * 0.5;
            var y = _this.ySizeMap * 0.5;
            Engine.Renderer.camera(x, y);
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
        return MainMenu;
    }(Game.SceneMap));
    Game.MainMenu = MainMenu;
})(Game || (Game = {}));
///<reference path="../System/Scene/SceneMap.ts"/>
var Game;
(function (Game) {
    var Y_COUNT_BUTTONS = 4;
    var X_SIZE_BUTTON = 40;
    var Y_SIZE_BUTTON = 14;
    var X_SPEARATION_BUTTONS = 5 + 1;
    var Y_SPEARATION_BUTTONS = 4;
    var OFFSET_SINGLE = 7;
    var OFFSET_DOUBLE = 10;
    var SpeedrunMenu = /** @class */ (function (_super) {
        __extends(SpeedrunMenu, _super);
        function SpeedrunMenu() {
            var _this = _super.call(this) || this;
            _this.yButtons = -29.5 - 3;
            new Game.MusicButton();
            new Game.SoundButton();
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
            recordA.yAligned = -30.5;
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
            _this.newButton = new Game.DialogButton(-X_SIZE_BUTTON - 5 - X_SPEARATION_BUTTONS, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * Y_COUNT_BUTTONS + 2 - 7 - 0.5, X_SIZE_BUTTON + 5, Y_SIZE_BUTTON);
            _this.newButton.control.listener = _this;
            _this.newButton.text.font = Game.FontManager.a;
            _this.newButton.text.scale = 1;
            _this.newButton.text.enabled = true;
            _this.newButton.text.pinned = true;
            _this.newButton.text.str = "NEW RUN";
            _this.newButton.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.newButton.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.newButton.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.newButton.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.newButton.text.xAligned = _this.newButton.dialog.x;
            _this.newButton.text.yAligned = _this.newButton.dialog.y + 4 - 0.5;
            _this.newButton.control.onPressedDelegate = _this.newPressed;
            _this.newButton.control.onReleasedDelegate = _this.newReleased;
            _this.continueButton = new Game.DialogButton(0, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * Y_COUNT_BUTTONS + 2 - 7 - 0.5, X_SIZE_BUTTON + 5, Y_SIZE_BUTTON);
            _this.continueButton.dialog.style = Game.dataSpeedrun > 0 ? _this.continueButton.dialog.style : "clearblue";
            _this.continueButton.control.enabled = Game.dataSpeedrun > 0;
            _this.continueButton.control.listener = _this;
            _this.continueButton.text.font = Game.FontManager.a;
            _this.continueButton.text.scale = 1;
            _this.continueButton.text.enabled = true;
            _this.continueButton.text.pinned = true;
            _this.continueButton.text.str = "CONTINUE";
            _this.continueButton.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.continueButton.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.continueButton.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.continueButton.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.continueButton.text.xAligned = _this.continueButton.dialog.x;
            _this.continueButton.text.yAligned = _this.continueButton.dialog.y + 4 - 0.5;
            _this.continueButton.control.onPressedDelegate = _this.continuePressed;
            _this.continueButton.control.onReleasedDelegate = _this.continueReleased;
            _this.backButton = new Game.DialogButton(X_SIZE_BUTTON + 5 + X_SPEARATION_BUTTONS, _this.yButtons + (Y_SIZE_BUTTON + Y_SPEARATION_BUTTONS) * Y_COUNT_BUTTONS + 2 - 7 - 0.5, X_SIZE_BUTTON + 5, Y_SIZE_BUTTON);
            _this.backButton.control.listener = _this;
            _this.backButton.text.font = Game.FontManager.a;
            _this.backButton.text.scale = 1;
            _this.backButton.text.enabled = true;
            _this.backButton.text.pinned = true;
            _this.backButton.text.str = "BACK";
            _this.backButton.text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.backButton.text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.backButton.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.backButton.text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.backButton.text.xAligned = _this.backButton.dialog.x;
            _this.backButton.text.yAligned = _this.backButton.dialog.y + 4 - 0.5;
            _this.backButton.control.useKeyboard = true;
            _this.backButton.control.keys = [Engine.Keyboard.ESC, "esc", "Esc", "ESC"];
            _this.backButton.control.onPressedDelegate = _this.backPressed;
            _this.backButton.control.onReleasedDelegate = _this.backReleased;
            _this.loadMap(Game.Resources.PATH_MAP_NONE);
            //var x = Scene.xSizeLevel * 0.5;
            //var y = Scene.ySizeLevel * 0.5;
            //Engine.Renderer.camera(x, y);
            Game.SceneColors.enabledDown = false;
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
    var OFFSET_TEXTURE_SWITCH = 55;
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
            if (Level.index == 2) {
                new Game.SwitchTutorial2({});
            }
            Game.LevelShake.init();
            Game.LevelPauseUI.init();
            Game.LevelAds.init();
            Game.LevelSaveManager.init();
            Game.triggerActions("level");
            _this.loadMap(Game.getPathLevel(Level.index));
            //this.loadMap(getPathLevel(1));
            //this.loadMap(Resources.PATH_LEVEL_TEST);
            _this.initSpikes();
            new Game.LevelAdLoader();
            return _this;
        }
        Level.prototype.initSpikes = function () {
            for (var _i = 0, _a = Game.SceneMap.instance.dataTiles; _i < _a.length; _i++) {
                var data = _a[_i];
                if (data.spikeAngle != null && data.spikeAngle != undefined) {
                    var box = data.box;
                    switch (data.spikeAngle) {
                        case 0:
                            box.x += 2;
                            box.y += 4;
                            box.xSize -= 3;
                            box.ySize -= 4;
                            break;
                        case 90:
                            box.x += 4;
                            box.y += 2;
                            box.xSize -= 4;
                            box.ySize -= 3;
                            break;
                        case 180:
                            box.x += 2;
                            box.y -= 0;
                            box.xSize -= 3;
                            box.ySize -= 4;
                            break;
                        case 270:
                            box.x -= 0;
                            box.y += 2;
                            box.xSize -= 4;
                            box.ySize -= 3;
                            break;
                    }
                }
            }
            var newBoxesTiles = [];
            for (var _b = 0, _c = this.boxesTiles; _b < _c.length; _b++) {
                var box = _c[_b];
                if (box.data.spikeAngle != null && box.data.spikeAngle != undefined) {
                    this.boxesEnemies.push(box);
                }
                else {
                    newBoxesTiles.push(box);
                }
            }
            this.boxesTiles = newBoxesTiles;
        };
        Level.prototype.onReset = function () {
            _super.prototype.onReset.call(this);
            Level.resetBlocks();
            //triggerActions("play");
        };
        Level.resetBlocks = function () {
            for (var _i = 0, _a = Game.SceneMap.instance.dataTiles; _i < _a.length; _i++) {
                var data = _a[_i];
                if (data.switchType != null && data.switchType != undefined) {
                    data.sprite.setFull(true, false, Game.Resources.texture, Game.SceneMap.instance.xSizeTile, Game.SceneMap.instance.ySizeTile, 0, 0, data.xTextureStart, data.yTextureStart, Game.SceneMap.instance.xSizeTile, Game.SceneMap.instance.ySizeTile);
                    data.box.enabled = data.startEnabled;
                }
            }
        };
        Level.switchBlocks = function (switchType) {
            for (var _i = 0, _a = Game.SceneMap.instance.dataTiles; _i < _a.length; _i++) {
                var data = _a[_i];
                if (data.switchType != null && data.switchType != undefined && data.switchType == switchType) {
                    data.box.enabled = !data.box.enabled;
                    var yTexture = 0;
                    if (data.startEnabled) {
                        if (data.box.enabled) {
                            yTexture = data.yTextureStart;
                        }
                        else {
                            yTexture = data.yTextureStart + OFFSET_TEXTURE_SWITCH;
                        }
                    }
                    else {
                        if (data.box.enabled) {
                            yTexture = data.yTextureStart - OFFSET_TEXTURE_SWITCH;
                        }
                        else {
                            yTexture = data.yTextureStart;
                        }
                    }
                    data.sprite.setFull(true, false, Game.Resources.texture, Game.SceneMap.instance.xSizeTile, Game.SceneMap.instance.ySizeTile, 0, 0, data.xTextureStart, yTexture, Game.SceneMap.instance.xSizeTile, Game.SceneMap.instance.ySizeTile);
                }
            }
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
            var x = Game.Player.instance.xDraw;
            if (this.xSizeMap - this.xSizeTile * 2 < Engine.Renderer.xSizeView) {
                x = this.xSizeMap * 0.5;
            }
            else if (x < Engine.Renderer.xSizeView * 0.5 + this.xSizeTile) {
                x = Engine.Renderer.xSizeView * 0.5 + this.xSizeTile;
            }
            else if (x > this.xSizeMap - Engine.Renderer.xSizeView * 0.5 - this.xSizeTile) {
                x = this.xSizeMap - Engine.Renderer.xSizeView * 0.5 - this.xSizeTile;
            }
            var y = Game.Player.instance.yDraw;
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
        Level.GRAVITY = 0.1;
        Level.Y_VEL_MAX = 3;
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
                    Engine.Data.save("speedrunrecord", Game.recordSpeedrun, 60);
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
    var X_LOADING_START = -80 + 59 + 3.5;
    var X_LOADING_PRESS = -42 + 8.5;
    var X_LOADING_COMPLETE = -34;
    var Y_LOADING = -60 + 54;
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
            _this.bar = new Game.LoadingBar(-60 + 61, 52, 5);
            _this.bar.setColor(1, 1, 1, 1);
            _this.bar.setShadowColor(0, 0, 0, 1);
            Game.SceneColors.enabledDown = false;
            //SceneColors.clearColor(CLEAR_RED, CLEAR_GREEN, CLEAR_BLUE);
            _this.loadMap(Game.Resources.PATH_MAP_NONE);
            _this.initStates();
            Game.triggerActions("preloader");
            return _this;
        }
        ;
        Preloader.prototype.initStates = function () {
            var _this = this;
            var loading = new Game.State(this);
            var click = new Game.State(this);
            var exit = new Game.State(this);
            var wait = new Game.State(this);
            var next = new Game.State(this);
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
            new Game.StateMachine(this).startState = loading;
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
            FontManager.a.setFull(Game.Resources.texture, 13, 125, -1);
            //FontManager.b = new Utils.Font();
            //FontManager.b.setFull(Resources.texture, 13, 253, -1);
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
    var PATH_BGM = "Assets/Audio/Komiku_-_03_-_Time_for_the_walk_of_the_day.omw";
    var PATH_SFX_JUMP = "Assets/Audio/jump.wom";
    var PATH_SFX_DEATH = "Assets/Audio/death.wom";
    var PATH_SFX_SWITCH = "Assets/Audio/switch.wom";
    var PATH_SFX_WIN = "Assets/Audio/win.wom";
    var PATH_TEXTURE_GRAPHICS = "Assets/Graphics/Main.png";
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
    Game.addPath("preload", Resources.PATH_FRAMES);
    Game.addPath("preload", PATH_TEXTURE_GRAPHICS);
    Game.addPath("preload", Resources.PATH_TILESET);
    Game.addPath("preload", Resources.PATH_MAP_NONE);
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
    Game.addAction("preinit", function () {
        Resources.texture = new Engine.Texture(PATH_TEXTURE_GRAPHICS, true, false);
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
        Resources.bgm = new Engine.AudioPlayer(PATH_BGM);
        Resources.bgm.preserved = true;
        Resources.bgm.volume = Resources.bgm.restoreVolume = 1;
        if (Engine.AudioManager.mode == Engine.AudioManagerMode.HTML) {
            Resources.bgm.loopEnd = 109.7665;
        }
        else if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
            Resources.bgm.loopEnd = 109.7665;
        }
        Game.bgms.push(Resources.bgm);
        Resources.sfxJump = new Engine.AudioPlayer(PATH_SFX_JUMP);
        Resources.sfxJump.preserved = true;
        Resources.sfxJump.volume = Resources.sfxJump.restoreVolume = 1;
        Game.sfxs.push(Resources.sfxJump);
        Resources.sfxDeath = new Engine.AudioPlayer(PATH_SFX_DEATH);
        Resources.sfxDeath.preserved = true;
        Resources.sfxDeath.volume = Resources.sfxDeath.restoreVolume = 1;
        Game.sfxs.push(Resources.sfxDeath);
        Resources.sfxSwitch = new Engine.AudioPlayer(PATH_SFX_SWITCH);
        Resources.sfxSwitch.preserved = true;
        Resources.sfxSwitch.volume = Resources.sfxSwitch.restoreVolume = 1;
        Game.sfxs.push(Resources.sfxSwitch);
        Resources.sfxWin = new Engine.AudioPlayer(PATH_SFX_WIN);
        Resources.sfxWin.preserved = true;
        Resources.sfxWin.volume = Resources.sfxWin.restoreVolume = 1;
        Game.sfxs.push(Resources.sfxWin);
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
            _this.red = 0;
            _this.green = 0;
            _this.blue = 0;
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
        //FRAMES = FrameSelector.complex("scene orientator", Resources.texture, 13, 74);
        //ready = true;
    });
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
            _this.text.font = Game.FontManager.a;
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
                        this.setFillColor(0 / 255, 0 / 255, 0 / 255, 1);
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
            _this.count = 0;
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
            if (this._str != null && this._font != null && this.ready) {
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
        Text.prototype.onDrawText = function () {
            if (!this.front) {
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
            if (this.front) {
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
