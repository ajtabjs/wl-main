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
                this.source[this.source.start ? 'start' : 'noteOn'](0, this.source.loop ? /*this.loopStart*/ 0 : 0);
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
        Renderer.xSizeViewIdeal = 235 * 1;
        Renderer.ySizeViewIdeal = 176 * 1;
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
            Engine.Data.setID("com", "kez", "zristrev");
        }
        else {
            Engine.Data.setID("c", "k", "zrsrev");
        }
        Game.SceneColors.clearColor(0, 0, 0);
        Engine.System.createEvent(Engine.EventType.CREATE_SCENE, "onCreateScene");
        Engine.System.createEvent(Engine.EventType.RESET_SCENE, "onReset");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateAnchor");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdateText");
        Engine.System.createEvent(Engine.EventType.VIEW_UPDATE, "onViewUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onControlPreUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onControlUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMapUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onMoveUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onOverlapUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onAnimationUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepLateUpdate");
        Engine.System.createEvent(Engine.EventType.STEP_UPDATE, "onStepUpdateFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onPlayerConfigureTimeUpdate");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onMapConfigureTimeUpdate");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onTimeUpdate");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onTimeUpdateSceneBeforeDrawFixed");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSceneMap");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawSceneFill");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawFog");
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
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawTextFront");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawAdFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawFade");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawOrientationUI");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawTextSuperFront");
        Engine.System.createEvent(Engine.EventType.TIME_UPDATE, "onDrawAdsDemo");
        Engine.System.createEvent(Engine.EventType.CLEAR_SCENE, "onClearScene");
        /*

        for(var i = 1; i <= MAX_LEVELS; i += 1){
            dataLevels[i] = Engine.Data.load("level " + i) as any || "locked";
        }
        if(dataLevels[1] == "locked"){
            dataLevels[1] = "unlocked";
        }
        recordSpeedrun = +(Engine.Data.load("speedrun"));
        recordSpeedrun = isNaN(recordSpeedrun) ? 0 : recordSpeedrun;
        */
        //SKIP_CREDITS = true;
        //SKIP_PRELOADER = true;
        Engine.Box.debugRender = false;
        Game.startingSceneClass = Game.Level;
    };
})(Game || (Game = {}));
var Game;
(function (Game) {
    Game.HAS_PRELOADER = true;
    Game.HAS_LINKS = true;
    Game.HAS_LINKS_KEZARTS = true;
    Game.HAS_GOOGLE_PLAY_LOGOS = true;
    Game.IS_EDGE = /Edge/.test(navigator.userAgent);
    Game.STEPS_CHANGE_SCENE = 10;
    Game.STEPS_CHANGE_SCENE_AD = 30;
    Game.X_BUTTONS_LEFT = 3;
    Game.X_BUTTONS_RIGHT = -3;
    Game.Y_BUTTONS_TOP = 4;
    Game.Y_BUTTONS_BOTTOM = -2;
    Game.Y_ARROWS_GAME_BUTTONS = 2;
    Game.X_SEPARATION_BUTTONS_LEFT = 9;
    Game.MUSIC_MUTED = false;
    Game.SOUND_MUTED = false;
    Game.IS_TOUCH = false;
    Game.SKIP_PRELOADER = false;
    Game.FORCE_TOUCH = false;
    Game.SKIP_CREDITS = false;
    Game.SKIP_CREDITS_SPECIAL = true;
    Game.DIRECT_PRELOADER = false;
    Game.TRACK_ORIENTATION = false;
    Game.URL_MORE_GAMES = "https://kezarts.com/games";
    Game.URL_KEZARTS = "https://kezarts.com/games";
    Game.TEXT_MORE_GAMES = "+GAMES";
    Game.IS_APP = false;
    Game.IS_IOS_SAFARI = false;
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
            //Resources.bgmVolumeTracker += 1;
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
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var OUTFIT_OFFSET = 4;
    var STATE_INACTIVE = 1;
    var STATE_IN_AIR = 2;
    var STATE_RUNNING = 3;
    var STATE_SLIDE = 4;
    var STATE_DEAD = 5;
    var INDEX_STATES_TRANS = 100;
    var STATE_TRANS_IN_GROUND = 101;
    var STATE_TRANS_JUMP = 102;
    var STATE_TRANS_SWITCH_GRAVITY = 103;
    var STATE_TRANS_DOUBLE_JUMP = 104;
    //var STEPS_JUMP = 7;
    var POSITION_START_X = 16 * (1 + 198 * 0);
    var POSITION_START_Y = 8 * 16;
    var PHYSICS_AXIS_X = 0;
    var PHYSICS_AXIS_Y = 1;
    var SIZE_FULL = 16;
    var SIZE_HALF = 8;
    var CAP_VELOCITY_Y = 300;
    var SPEED_ROTATION = 10;
    var VELOCITY_NORMAL = 4.2;
    var VELOCITY_SPEED_UP = VELOCITY_NORMAL * 1.7;
    var VELOCITY_JUMP = -5.5;
    var VELOCITY_DOUBLE_JUMP = -5.5;
    var MAX_STEPS_SLIDE = 25;
    var MAX_SIZE_SCORE_UPDATER = 32;
    var STEP_SCORE = 1;
    var GRAVITY = 0.350;
    var MAX_LAG_STEPS = 12;
    var MAX_PARTICLES = 15;
    var CAP_VELOCITY_Y_PARTICLE = 300;
    var MIN_PARTICLE_POSITION_X = -8;
    var MIN_PARTICLE_POSITION_Y = -8;
    var PARTICLE_POSITION_INTERVAL_X = 16;
    var PARTICLE_POSITION_INTERVAL_Y = 16;
    var MIN_PARTICLE_SPEED_X = -10;
    var MIN_PARTICLE_SPEED_Y = -10;
    var PARTICLE_SPEED_INTERVAL_X = 20;
    var PARTICLE_SPEED_INTERVAL_Y = 20;
    var FRAMES_PLAYER = null;
    var FRAMES_PARTICLES = null;
    Game.addAction("init", function () {
        FRAMES_PLAYER = Game.FrameSelector.complex("player", Game.Resources.texture, 1, 256);
        FRAMES_PARTICLES = Game.FrameSelector.complex("particles", Game.Resources.texture, 251, 28);
    });
    var box;
    var sprite;
    var controlJump;
    var controlSlide;
    var score = 0;
    var count_score_updater = 0;
    var xCursorTime = 0;
    var yCursorTime = 0;
    var position_old_x = 0;
    var state = 0;
    var damaged = false;
    var in_ground = false;
    var count_steps_slide = 0;
    var gravity_switched = false;
    var air_jump_performed = false;
    var performed_lag_jump = false;
    var performed_lag_slide = false;
    var count_steps_lag_jump = 0;
    var count_steps_lag_slide = 0;
    var spritesParticles = [];
    var speedParticles = [];
    var yVel = 0;
    function init_player() {
        score = Game.loapoi();
        init_physics();
        init_visuals();
        init_particles();
        set_state(STATE_INACTIVE);
    }
    function init_physics() {
        box = new Engine.Box();
        box.enabled = true;
        box.renderable = true;
    }
    function init_visuals() {
        sprite = new Engine.Sprite();
    }
    function init_particles() {
        for (var particle_index = 0; particle_index < MAX_PARTICLES; particle_index += 1) {
            spritesParticles.push(new Engine.Sprite());
            speedParticles.push(new Engine.Point(0, 0));
        }
    }
    function update_player_behaviors() {
        check_backtrack();
        //if(is_key_pressed(KEY_C)){
        //    int x0_box, y0_box, x1_box, y1_box;
        //    get_physics_box_form(index_box, &x0_box, &y0_box, &x1_box, &y1_box);
        //    x0_box += MAP_WIDTH * SIZE_TILE;
        //    x1_box += MAP_WIDTH * SIZE_TILE;
        //    set_physics_box_form(index_box, x0_box, y0_box, x1_box, y1_box);
        //}
        if (!Game.LevelFlow.freezed || Game.LevelFlow.reseting) {
            if (Game.LevelFlow.playing) {
                update_lag_controls();
                update_states();
                update_physics();
                update_score();
            }
            check_state_links();
        }
        if (state == STATE_DEAD) {
            for (var particle_index = 0; particle_index < MAX_PARTICLES; particle_index += 1) {
                speedParticles[particle_index].y += (gravity_switched ? -GRAVITY : GRAVITY);
                if (speedParticles[particle_index].y < -CAP_VELOCITY_Y_PARTICLE) {
                    speedParticles[particle_index].y = -CAP_VELOCITY_Y_PARTICLE;
                }
                else if (speedParticles[particle_index].y > CAP_VELOCITY_Y_PARTICLE) {
                    speedParticles[particle_index].y = CAP_VELOCITY_Y_PARTICLE;
                }
                spritesParticles[particle_index].x += speedParticles[particle_index].x;
                spritesParticles[particle_index].y += speedParticles[particle_index].y;
            }
        }
    }
    function xVel() {
        return Game.LevelData.currentRule == Game.RULE_SPEED_UP ? VELOCITY_SPEED_UP : VELOCITY_NORMAL;
    }
    function tryFixTouchControls() {
        if (Game.IS_TOUCH) {
            controlJump.bounds.y = -Engine.Renderer.ySizeView * 0.5;
            controlJump.bounds.xSize = Engine.Renderer.xSizeView * 0.5;
            controlJump.bounds.ySize = Engine.Renderer.ySizeView;
            controlSlide.bounds.x = -Engine.Renderer.xSizeView * 0.5;
            controlSlide.bounds.y = -Engine.Renderer.ySizeView * 0.5;
            controlSlide.bounds.xSize = Engine.Renderer.xSizeView * 0.5;
            controlSlide.bounds.ySize = Engine.Renderer.ySizeView;
        }
    }
    function check_backtrack() {
        if (Game.LevelFlow.backtracking) {
            box.x -= Game.MAP_WIDTH * Game.SIZE_TILE;
            position_old_x -= Game.MAP_WIDTH * Game.SIZE_TILE;
            xCursorTime -= Game.MAP_WIDTH * Game.SIZE_TILE;
        }
    }
    function update_lag_controls() {
        performed_lag_jump = false;
        performed_lag_slide = false;
        if (Game.LevelFlow.lagged) {
            if (count_steps_lag_jump > 0) {
                count_steps_lag_jump -= 1;
                if (count_steps_lag_jump % MAX_LAG_STEPS == 0) {
                    performed_lag_jump = true;
                }
            }
            if (count_steps_lag_slide > 0) {
                count_steps_lag_slide -= 1;
                if (count_steps_lag_slide % MAX_LAG_STEPS == 0) {
                    performed_lag_slide = true;
                }
            }
            if (requireJump()) {
                count_steps_lag_jump += MAX_LAG_STEPS;
            }
            if (requireSlide()) {
                count_steps_lag_slide += MAX_LAG_STEPS;
            }
        }
        else {
            count_steps_lag_jump = 0;
            count_steps_lag_slide = 0;
        }
    }
    function update_physics() {
        in_ground = false;
        move_player(PHYSICS_AXIS_X);
        yVel += (gravity_switched ? -GRAVITY : GRAVITY);
        if (yVel < -CAP_VELOCITY_Y) {
            yVel = -CAP_VELOCITY_Y;
        }
        else if (yVel > CAP_VELOCITY_Y) {
            yVel = CAP_VELOCITY_Y;
        }
        move_player(PHYSICS_AXIS_Y);
    }
    function update_score() {
        var position_x = box.x;
        count_score_updater += position_x - position_old_x;
        position_old_x = position_x;
        if (count_score_updater >= MAX_SIZE_SCORE_UPDATER) {
            count_score_updater -= MAX_SIZE_SCORE_UPDATER;
            score += STEP_SCORE * scoreMultipler();
        }
    }
    Game.maxmultipler = 999999;
    function scoreMultipler() {
        var val = Math.floor((Game.screens) / 5) + 1;
        return val > Game.maxmultipler ? Game.maxmultipler : val;
    }
    Game.scoreMultipler = scoreMultipler;
    function move_player(axis) {
        var can_touch_ground = axis == PHYSICS_AXIS_Y && (gravity_switched ? yVel < 0 : yVel > 0);
        var hits = box.cast(Game.boxesTiles, null, axis == PHYSICS_AXIS_X, axis == PHYSICS_AXIS_X ? xVel() : yVel, true, Engine.Box.LAYER_ALL);
        box.translate(hits, axis == PHYSICS_AXIS_X, axis == PHYSICS_AXIS_X ? xVel() : yVel, true);
        if (hits != null) {
            for (var contact_index = 0; contact_index < hits.length; contact_index += 1) {
                var contact_value = hits[contact_index].other.data;
                if (contact_value == Game.VALUE_TILE_RED || contact_value == Game.VALUE_TILE_RED_HALF || contact_value == Game.VALUE_TILE_RED_HALF_B) {
                    damaged = true;
                    break;
                }
                else if (axis == PHYSICS_AXIS_Y) {
                    yVel = 0;
                    if (can_touch_ground) {
                        in_ground = true;
                    }
                }
            }
        }
    }
    function update_states() {
        switch (state) {
            case STATE_INACTIVE:
                break;
            case STATE_IN_AIR:
                sprite.angle += (Game.LevelFlow.freezed ? 0 : (gravity_switched ? -SPEED_ROTATION : SPEED_ROTATION));
                break;
            case STATE_RUNNING:
                break;
            case STATE_SLIDE:
                count_steps_slide += 1;
                break;
            case STATE_DEAD:
                break;
        }
    }
    function check_state_links() {
        if (state != STATE_DEAD && state != STATE_INACTIVE && (damaged || box.y > (Game.MAP_HEIGHT + 1) * Game.SIZE_TILE || box.y < -(SIZE_FULL + Game.SIZE_TILE * 3))) {
            set_state(STATE_DEAD);
            return;
        }
        switch (state) {
            case STATE_INACTIVE:
                if (Game.LevelFlow.playing) {
                    set_state(STATE_IN_AIR);
                }
                break;
            case STATE_IN_AIR:
                if (in_ground) {
                    set_state(STATE_TRANS_IN_GROUND);
                }
                else if (!air_jump_performed && jump_control_pressed()) {
                    if (Game.LevelData.currentRule == Game.RULE_GRAVITY) {
                        set_state(STATE_TRANS_SWITCH_GRAVITY);
                    }
                    else if (Game.LevelData.currentRule == Game.RULE_DOUBLE_JUMP) {
                        set_state(STATE_TRANS_DOUBLE_JUMP);
                    }
                }
                break;
            case STATE_RUNNING:
                if (!in_ground) {
                    set_state(STATE_IN_AIR);
                }
                else if (jump_control_pressed()) {
                    set_state(STATE_TRANS_JUMP);
                }
                else if (slide_control_pressed()) {
                    set_state(STATE_SLIDE);
                }
                break;
            case STATE_SLIDE:
                var hits = box.cast(Game.boxesTiles, null, false, gravity_switched ? 1 : -1, true, Engine.Box.LAYER_ALL);
                if (hits == null || hits.length == 0) {
                    if (!in_ground) {
                        set_state(STATE_IN_AIR);
                    }
                    else if (jump_control_pressed()) {
                        set_state(STATE_TRANS_JUMP);
                    }
                    else if (count_steps_slide >= MAX_STEPS_SLIDE) {
                        set_state(STATE_RUNNING);
                    }
                }
                else if (count_steps_slide >= MAX_STEPS_SLIDE || jump_control_pressed()) {
                    for (var contact_index = 0; contact_index < hits.length; contact_index += 1) {
                        var contact_value = hits[contact_index].other.data;
                        if (contact_value == Game.VALUE_TILE_RED || contact_value == Game.VALUE_TILE_RED_HALF || contact_value == Game.VALUE_TILE_RED_HALF_B) {
                            set_state(STATE_DEAD);
                            break;
                        }
                    }
                }
                break;
            case STATE_DEAD:
                if (Game.LevelFlow.reseting) {
                    set_state(STATE_INACTIVE);
                }
                break;
            case STATE_TRANS_IN_GROUND:
                if (jump_control_pressed()) {
                    set_state(STATE_TRANS_JUMP);
                }
                else if (slide_control_pressed()) {
                    set_state(STATE_SLIDE);
                }
                else {
                    set_state(STATE_RUNNING);
                }
                break;
            case STATE_TRANS_JUMP:
                set_state(STATE_IN_AIR);
                break;
            case STATE_TRANS_SWITCH_GRAVITY:
                set_state(STATE_IN_AIR);
                break;
            case STATE_TRANS_DOUBLE_JUMP:
                set_state(STATE_IN_AIR);
                break;
        }
    }
    function set_state(next_state) {
        exit_state(next_state);
        var old_state = state;
        state = next_state;
        enter_state(old_state);
        if (state >= INDEX_STATES_TRANS) {
            check_state_links();
        }
    }
    function exit_state(next_state) {
        next_state = next_state;
        switch (state) {
            case STATE_INACTIVE:
                sprite.enabled = true;
                box.enabled = true;
                FRAMES_PLAYER[0 + Game.curout * OUTFIT_OFFSET].applyToSprite(sprite);
                score++;
                break;
            case STATE_IN_AIR:
                sprite.angle = 0;
                break;
            case STATE_RUNNING:
                break;
            case STATE_SLIDE:
                box.ySize = SIZE_FULL;
                if (gravity_switched) {
                    FRAMES_PLAYER[1 + Game.curout * OUTFIT_OFFSET].applyToSprite(sprite);
                }
                else {
                    box.y -= SIZE_HALF;
                    FRAMES_PLAYER[0 + Game.curout * OUTFIT_OFFSET].applyToSprite(sprite);
                }
                break;
            case STATE_DEAD:
                break;
            case STATE_TRANS_IN_GROUND:
                break;
            case STATE_TRANS_JUMP:
                break;
        }
    }
    function setPlayerInitialPosition() {
        box.x = POSITION_START_X;
        xCursorTime = box.x;
        position_old_x = POSITION_START_X;
    }
    Game.setPlayerInitialPosition = setPlayerInitialPosition;
    function enter_state(old_state) {
        old_state = old_state;
        switch (state) {
            case STATE_INACTIVE:
                count_score_updater = 0;
                gravity_switched = false;
                air_jump_performed = false;
                box.x = POSITION_START_X;
                box.y = POSITION_START_Y;
                xCursorTime = box.x;
                yCursorTime = box.y;
                position_old_x = POSITION_START_X;
                box.xSize = SIZE_FULL;
                box.ySize = SIZE_FULL;
                FRAMES_PLAYER[0 + Game.curout * OUTFIT_OFFSET].applyToSprite(sprite);
                for (var particle_index = 0; particle_index < MAX_PARTICLES; particle_index += 1) {
                    spritesParticles[particle_index].enabled = false;
                }
                break;
            case STATE_IN_AIR:
                break;
            case STATE_RUNNING:
                break;
            case STATE_SLIDE:
                count_steps_slide = 0;
                box.ySize = SIZE_HALF;
                if (gravity_switched) {
                    FRAMES_PLAYER[3 + Game.curout * OUTFIT_OFFSET].applyToSprite(sprite);
                }
                else {
                    box.y += SIZE_HALF;
                    FRAMES_PLAYER[2 + Game.curout * OUTFIT_OFFSET].applyToSprite(sprite);
                }
                Game.Resources.sfxSlide.play();
                break;
            case STATE_DEAD:
                damaged = false;
                sprite.enabled = false;
                box.enabled = false;
                yVel = 0;
                Game.Resources.sfxDead.play();
                thrown_particles();
                break;
            case STATE_TRANS_IN_GROUND:
                air_jump_performed = false;
                break;
            case STATE_TRANS_JUMP:
                yVel = gravity_switched ? -VELOCITY_JUMP : VELOCITY_JUMP;
                Game.Resources.sfxJump.play();
                break;
            case STATE_TRANS_SWITCH_GRAVITY:
                air_jump_performed = true;
                gravity_switched = !gravity_switched;
                if (gravity_switched) {
                    FRAMES_PLAYER[1 + Game.curout * OUTFIT_OFFSET].applyToSprite(sprite);
                }
                else {
                    FRAMES_PLAYER[0 + Game.curout * OUTFIT_OFFSET].applyToSprite(sprite);
                }
                Game.Resources.sfxGravityJump.play();
                break;
            case STATE_TRANS_DOUBLE_JUMP:
                air_jump_performed = true;
                yVel = VELOCITY_DOUBLE_JUMP;
                Game.Resources.sfxJump.play();
                break;
        }
    }
    function update_player_visuals() {
        if (state == STATE_SLIDE) {
            sprite.x = xCursorTime + SIZE_HALF;
            sprite.y = yCursorTime + SIZE_HALF / 2;
        }
        else {
            sprite.x = xCursorTime + SIZE_HALF;
            sprite.y = yCursorTime + SIZE_HALF;
        }
        //set_canvas_form(index_canvas, cursor_x, cursor_y, cursor_x + SIZE_FULL, cursor_y + current_size_y);
        if (state == STATE_DEAD) {
            for (var particle_index = 0; particle_index < MAX_PARTICLES; particle_index += 1) {
                var xOld = spritesParticles[particle_index].x;
                var yOld = spritesParticles[particle_index].y;
                spritesParticles[particle_index].x += speedParticles[particle_index].x * Engine.System.stepExtrapolation;
                spritesParticles[particle_index].y += speedParticles[particle_index].y * Engine.System.stepExtrapolation;
                spritesParticles[particle_index].render();
                spritesParticles[particle_index].x = xOld;
                spritesParticles[particle_index].y = yOld;
            }
        }
    }
    function thrown_particles() {
        for (var particle_index = 0; particle_index < MAX_PARTICLES; particle_index += 1) {
            var spriteParticle = spritesParticles[particle_index];
            var speedParticle = speedParticles[particle_index];
            spriteParticle.enabled = true;
            spriteParticle.x = xCursorTime + SIZE_HALF;
            spriteParticle.y = yCursorTime + SIZE_HALF * (gravity_switched ? -1 : 1);
            spriteParticle.x += MIN_PARTICLE_POSITION_X + Math.random() * PARTICLE_POSITION_INTERVAL_X;
            spriteParticle.y += (MIN_PARTICLE_POSITION_Y + Math.random() * PARTICLE_POSITION_INTERVAL_Y) * (gravity_switched ? -1 : 1);
            speedParticle.x = MIN_PARTICLE_SPEED_X + Math.random() * PARTICLE_SPEED_INTERVAL_X;
            speedParticle.y = (MIN_PARTICLE_SPEED_Y + Math.random() * PARTICLE_SPEED_INTERVAL_Y) * (gravity_switched ? -1 : 1);
            var particle_type = Math.floor(Math.random() * 3);
            FRAMES_PARTICLES[4 + particle_type].applyToSprite(spriteParticle);
        }
    }
    function is_player_dead() {
        return state == STATE_DEAD;
    }
    function slide_control_pressed() {
        return Game.LevelData.currentRule == Game.RULE_LAG ? performed_lag_slide : requireSlide();
    }
    function jump_control_pressed() {
        return Game.LevelData.currentRule == Game.RULE_LAG ? performed_lag_jump : requireJump();
    }
    function requireJump() {
        return controlJump.pressed; // || (controlJump.stepsSincePressed > 0 && controlJump.stepsSincePressed < STEPS_JUMP);
    }
    function requireSlide() {
        return controlSlide.pressed; // || (controlSlide.stepsSincePressed > 0 && controlSlide.stepsSincePressed < STEPS_JUMP);
    }
    var Player = /** @class */ (function (_super) {
        __extends(Player, _super);
        function Player() {
            return _super.call(this) || this;
        }
        Object.defineProperty(Player, "score", {
            get: function () {
                return score;
            },
            set: function (val) {
                score = val;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player, "cursor", {
            get: function () {
                //if(LevelFlow.freezed || Engine.System.stepExtrapolation == 0){
                //    return Player.physicsCursor;
                //}
                //else{
                return xCursorTime;
                //}
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player, "physicsCursor", {
            get: function () {
                return box.x + SIZE_HALF;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player, "physicsCursorY", {
            get: function () {
                return box.y + SIZE_HALF;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Player, "dead", {
            get: function () {
                return is_player_dead();
            },
            enumerable: false,
            configurable: true
        });
        Player.init = function () {
            init_player();
            controlJump = new Game.Control();
            controlJump.enabled = true;
            controlJump.freezeable = true;
            controlJump.listener = this;
            controlJump.useKeyboard = false;
            controlJump.newInteractionRequired = true;
            controlJump.useMouse = true;
            controlJump.mouseButtons = [0];
            controlSlide = new Game.Control();
            controlSlide.enabled = true;
            controlSlide.freezeable = true;
            controlSlide.listener = this;
            controlSlide.useKeyboard = true;
            controlSlide.newInteractionRequired = true;
            controlSlide.useMouse = true;
            controlSlide.mouseButtons = [2];
            controlSlide.keys = [Engine.Keyboard.C, Engine.Keyboard.SPACE, Engine.Keyboard.S, Engine.Keyboard.DOWN];
            if (Game.IS_TOUCH) {
                controlJump.useTouch = true;
                controlJump.bounds = new Engine.Sprite();
                controlJump.bounds.enabled = true;
                controlJump.bounds.pinned = true;
                controlSlide.useTouch = true;
                controlSlide.bounds = new Engine.Sprite();
                controlSlide.bounds.enabled = true;
                controlSlide.bounds.pinned = true;
                tryFixTouchControls();
            }
            new Player();
        };
        Player.prototype.onViewUpdate = function () {
            tryFixTouchControls();
        };
        Player.prototype.onStepUpdate = function () {
            if (controlJump.enabled && Game.LevelFlow.freezed) {
                controlJump.enabled = false;
                controlSlide.enabled = false;
            }
            else if (!controlJump.enabled && !Game.LevelFlow.freezed) {
                controlJump.enabled = true;
                controlSlide.enabled = true;
            }
            update_player_behaviors();
        };
        Player.prototype.onPlayerConfigureTimeUpdate = function () {
            if (!Game.LevelFlow.freezed || Game.LevelFlow.backtracking) {
                var xOld = box.x;
                var hits = box.cast(Game.boxesTiles, null, true, xVel() * Engine.System.stepExtrapolation, true, Engine.Box.LAYER_ALL);
                box.translate(hits, true, xVel() * Engine.System.stepExtrapolation, true);
                xCursorTime = box.x;
                box.x = xOld;
                var yOld = box.y;
                var hits = box.cast(Game.boxesTiles, null, false, yVel * Engine.System.stepExtrapolation, true, Engine.Box.LAYER_ALL);
                box.translate(hits, false, yVel * Engine.System.stepExtrapolation, true);
                yCursorTime = box.y;
                box.y = yOld;
            }
        };
        Player.prototype.onDrawPlayer = function () {
            if (Game.LevelData.currentRule != Game.RULE_INVISIBILITY) {
                update_player_visuals();
                sprite.render();
            }
            if (Engine.Box.debugRender) {
                box.renderExtrapolated(Game.boxesTiles, xVel() * (Game.LevelFlow.freezed ? 0 : 1), yVel * (Game.LevelFlow.freezed ? 0 : 1), true, Engine.Box.LAYER_ALL);
            }
        };
        return Player;
    }(Engine.Entity));
    Game.Player = Player;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Button = /** @class */ (function (_super) {
        __extends(Button, _super);
        function Button(bounds) {
            if (bounds === void 0) { bounds = new Engine.Sprite(); }
            var _this = _super.call(this) || this;
            _this.ind = 0;
            _this.arrows = new Game.Arrows();
            _this.control = new Game.Control();
            _this.anchor = new Utils.Anchor();
            _this.superfront = false;
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
            if (!this.superfront)
                this.control.bounds.render();
        };
        Button.prototype.onDrawTextSuperFront = function () {
            if (this.superfront)
                this.control.bounds.render();
        };
        return Button;
    }(Engine.Entity));
    Game.Button = Button;
    var TextButton = /** @class */ (function (_super) {
        __extends(TextButton, _super);
        function TextButton() {
            var _this = _super.call(this) || this;
            _this.text = new Utils.Text();
            _this.control = new Game.Control();
            _this.control.bounds = _this.text.bounds;
            _this.control.enabled = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            _this.control.useTouch = true;
            _this.control.blockOthersSelection = true;
            _this.control.newInteractionRequired = true;
            _this.control.listener = _this;
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
    var instance;
    var PauseButton = /** @class */ (function (_super) {
        __extends(PauseButton, _super);
        function PauseButton() {
            var _this = _super.call(this) || this;
            _this.control.enabled = false;
            _this.control.aud = null;
            _this.text.font = Game.FontManager.a;
            _this.text.scale = 1;
            _this.text.enabled = false;
            _this.text.pinned = true;
            _this.text.xAlignBounds = Utils.AnchorAlignment.END;
            _this.text.xAlignView = Utils.AnchorAlignment.END;
            _this.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text.yAlignView = Utils.AnchorAlignment.START;
            _this.text.xAligned = Game.X_BUTTONS_RIGHT;
            _this.text.yAligned = Game.Y_BUTTONS_TOP;
            _this.text.str = "PAUSE" + (Game.IS_TOUCH ? "" : " (P)");
            _this.text.front = true;
            if (Game.IS_TOUCH) {
                _this.text.bounds.ySize += Game.Y_SIZE_EXTRA_TOUCH;
                //this.text.bounds.y = 0;
            }
            _this.control.useKeyboard = true;
            _this.control.keys = [Engine.Keyboard.P];
            return _this;
        }
        PauseButton.init = function () {
            instance = new PauseButton();
        };
        Object.defineProperty(PauseButton, "enabled", {
            set: function (value) {
                instance.text.enabled = value;
                instance.control.enabled = value;
                instance.control.blockOthersSelection = value;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(PauseButton, "pressed", {
            get: function () {
                return instance.control.pressed;
            },
            enumerable: false,
            configurable: true
        });
        PauseButton.prototype.fixText = function () {
            if (Game.LevelFlow.paused) {
                this.text.str = "UNPAUSE" + (Game.IS_TOUCH ? "" : " (P)");
            }
            else {
                this.text.str = "PAUSE" + (Game.IS_TOUCH ? "" : " (P)");
            }
            if (Game.IS_TOUCH) {
                this.text.bounds.ySize += Game.Y_SIZE_EXTRA_TOUCH;
                //this.text.bounds.y = 0;
            }
            Game.Resources.sfxBlip.play();
        };
        PauseButton.prototype.onViewUpdate = function () {
            this.fixText();
        };
        PauseButton.prototype.onStepUpdate = function () {
            if (this.text.str.indexOf("UN") >= 0) {
                if (!Game.LevelFlow.paused) {
                    this.fixText();
                }
            }
            else {
                if (Game.LevelFlow.paused) {
                    this.fixText();
                }
            }
        };
        return PauseButton;
    }(Game.TextButton));
    Game.PauseButton = PauseButton;
})(Game || (Game = {}));
///<reference path="../../System/Button.ts"/>
var Game;
(function (Game) {
    Game.Y_SIZE_EXTRA_TOUCH = 20;
    var SoundButton = /** @class */ (function (_super) {
        __extends(SoundButton, _super);
        function SoundButton() {
            var _this = _super.call(this) || this;
            _this.inited = false;
            _this.control.enabled = false;
            _this.control.aud = null;
            _this.text.font = Game.FontManager.a;
            _this.text.scale = 1;
            _this.text.enabled = false;
            _this.text.pinned = true;
            _this.text.xAlignBounds = Utils.AnchorAlignment.START;
            _this.text.xAlignView = Utils.AnchorAlignment.START;
            _this.text.yAlignBounds = Utils.AnchorAlignment.START;
            _this.text.yAlignView = Utils.AnchorAlignment.START;
            _this.text.xAligned = Game.X_BUTTONS_LEFT;
            _this.text.yAligned = Game.Y_BUTTONS_TOP;
            _this.text.front = true;
            _this.fixText();
            _this.control.useKeyboard = true;
            _this.control.keys = [Engine.Keyboard.M];
            _this.control.onPressedDelegate = _this.onPressed;
            return _this;
        }
        SoundButton.init = function () {
            SoundButton.instance = new SoundButton();
        };
        SoundButton.prototype.onPressed = function () {
            Game.switchSoundMute();
            Game.switchMusicMute();
            this.fixText();
        };
        SoundButton.prototype.fixText = function () {
            if (Game.SOUND_MUTED) {
                this.text.str = "UNMUTE" + (Game.IS_TOUCH ? "" : " (M)");
            }
            else {
                this.text.str = "MUTE" + (Game.IS_TOUCH ? "" : " (M)");
            }
            if (Game.IS_TOUCH) {
                this.text.bounds.ySize += Game.Y_SIZE_EXTRA_TOUCH;
                //this.text.bounds.y = 0;
            }
        };
        SoundButton.prototype.onStepUpdate = function () {
            if (!this.inited && Game.Resources.bgmPlayed && !this.control.enabled) {
                this.inited = true;
                this.control.enabled = true;
                this.text.enabled = true;
            }
        };
        SoundButton.prototype.onViewUpdate = function () {
            this.fixText();
        };
        return SoundButton;
    }(Game.TextButton));
    Game.SoundButton = SoundButton;
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
            else if (!this.waiting && this.nextSceneClass != null && Game.SceneFade.filled) {
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
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var STEPS_ENTERING = 60;
    var STEPS_CREATED_BY = 200;
    var STEPS_LEAVING_CREATED_BY = 60;
    var STEPS_LEAVING_TITLE = 50;
    var STEPS_ENTERING_PLAY = 20;
    var frameA;
    var frameB;
    var ver = -10 - 11 + 6;
    var LevelMenu = /** @class */ (function (_super) {
        __extends(LevelMenu, _super);
        function LevelMenu() {
            var _this = _super.call(this) || this;
            _this.countSteps = 0;
            _this.countStepsBlink = 0;
            _this.finished = false;
            Game.SceneFade.disable();
            Game.SceneFade.speed = 1000000;
            _this.textCreatedBy = Game.SceneText.createMiddleText("CREATED BY: KEZARTS AND NIELDACAN", 0, false);
            _this.textMusic = Game.SceneText.createMiddleText(" ", 7, false);
            Game.SceneText.yOffsetText = 0;
            _this.textTitle = Game.SceneText.createMiddleText("ZRIST DX!!", ver - 10, false);
            _this.textTitle.scale = 3;
            _this.textVer = Game.SceneText.createMiddleText(" ", ver - 10 + 5, false);
            _this.textVer.scale = 1;
            _this.textVer.xAligned = 31 + 5 + 2 + 1 + 1;
            _this.textJump = Game.SceneText.createMiddleText(Game.STR_JUMP, ver + 15, false);
            _this.textSlide = Game.SceneText.createMiddleText(Game.STR_SLIDE, ver + 25, false);
            _this.textStart = Game.SceneText.createMiddleText(Game.STR_START, ver + 47, false);
            frameA = new Engine.Sprite();
            frameA.enabled = false;
            frameA.pinned = true;
            frameA.y = ver - 25;
            FRAMES[1].applyToSprite(frameA);
            frameB = new Engine.Sprite();
            frameB.enabled = false;
            frameB.pinned = true;
            frameB.y = ver + 6;
            FRAMES[2].applyToSprite(frameB);
            _this.initStates();
            Game.triggerActions("zriststart");
            return _this;
        }
        Object.defineProperty(LevelMenu, "finished", {
            get: function () {
                return LevelMenu.instance.finished;
            },
            enumerable: false,
            configurable: true
        });
        LevelMenu.init = function () {
            LevelMenu.instance = new LevelMenu();
        };
        LevelMenu.prototype.initStates = function () {
            var _this = this;
            var entering = new Game.State(this);
            var createdBy = new Game.State(this);
            var leavingCreatedBy = new Game.State(this);
            var title = new Game.State(this);
            var leavingTitle = new Game.State(this);
            var enteringPlay = new Game.State(this);
            var end = new Game.State(this);
            entering.addLink(title, function () { return Game.SKIP_CREDITS; });
            entering.addLink(createdBy, function () { return _this.steps >= STEPS_ENTERING; });
            createdBy.onEnter = function () {
                Game.Resources.playBGM();
                _this.textCreatedBy.enabled = true;
                _this.textMusic.enabled = true;
                Game.triggerActions("zristenteringgame");
            };
            createdBy.addLink(leavingCreatedBy, function () { return _this.steps >= STEPS_CREATED_BY; });
            leavingCreatedBy.onEnter = function () {
                _this.textCreatedBy.enabled = false;
                _this.textMusic.enabled = false;
            };
            leavingCreatedBy.addLink(title, function () { return _this.steps >= STEPS_LEAVING_CREATED_BY; });
            title.onEnter = function () {
                if (Game.SKIP_CREDITS) {
                    Game.triggerActions("zristenteringgame");
                    Game.Resources.playBGM();
                }
                _this.textTitle.enabled = true;
                _this.textVer.enabled = true;
                _this.textJump.enabled = true;
                _this.textSlide.enabled = true;
                _this.textStart.enabled = true;
                frameA.enabled = true;
                frameB.enabled = true;
                Game.textScore.enabled = true;
                Game.textHiScore.enabled = true;
                Game.LevelGraphics.canRender = true;
            };
            title.onStepUpdate = function () {
                _this.updateTextStart(false);
            };
            title.addLink(leavingTitle, function () { return Game.LevelControl.pressed; });
            leavingTitle.onEnter = function () {
                _this.countSteps = 0;
                _this.countStepsBlink = 0;
                _this.textStart.enabled = false;
                Game.Resources.sfxEvent.play();
                Game.triggerActions("playbutton");
            };
            leavingTitle.onStepUpdate = function () {
                _this.countSteps += 1;
                _this.updateTextStart(true);
            };
            leavingTitle.addLink(enteringPlay, function () { return _this.countSteps >= STEPS_LEAVING_TITLE; });
            enteringPlay.onEnter = function () {
                _this.textTitle.enabled = false;
                _this.textVer.enabled = false;
                _this.textJump.enabled = false;
                _this.textSlide.enabled = false;
                _this.textStart.enabled = false;
                frameA.enabled = false;
                frameB.enabled = false;
            };
            enteringPlay.onStepUpdate = function () {
                _this.countSteps += 1;
            };
            enteringPlay.addLink(end, function () { return _this.countSteps >= STEPS_ENTERING_PLAY; });
            end.onEnter = function () {
                _this.finished = true;
            };
            var machine = new Game.StateMachine(this);
            machine.anyState.onEnter = function () {
                _this.steps = 0;
            };
            machine.anyState.onStepUpdate = function () {
                _this.steps += 1;
            };
            machine.startState = entering;
        };
        LevelMenu.prototype.updateTextStart = function (fast) {
            this.countStepsBlink += 1;
            if (this.countStepsBlink >= (fast ? Game.STEPS_BLINK_TEXT_PROCEED_FAST : Game.STEPS_BLINK_TEXT_PROCEED_NORMAL)) {
                this.textStart.enabled = !this.textStart.enabled;
                this.countStepsBlink = 0;
            }
        };
        LevelMenu.prototype.onDrawDialogs = function () {
            frameA.render();
            frameB.render();
        };
        return LevelMenu;
    }(Engine.Entity));
    Game.LevelMenu = LevelMenu;
    var FRAMES = null;
    Game.addAction("init", function () {
        FRAMES = Game.FrameSelector.complex("Level Menu", Game.Resources.texture, 513, 1);
    });
})(Game || (Game = {}));
///<reference path="../../System/Scene/Scene.ts"/>
///<reference path="LevelMenu.ts"/>
var Game;
(function (Game) {
    Game.STEPS_BLINK_TEXT_PROCEED_NORMAL = 40;
    Game.STEPS_BLINK_TEXT_PROCEED_FAST = 4;
    Game.SIZE_TILE = 16;
    var Level = /** @class */ (function (_super) {
        __extends(Level, _super);
        function Level() {
            var _this = _super.call(this) || this;
            Game.triggerActions("zristbeforecreatelevel");
            //Resources.playBGM();
            Level.initStr();
            Game.SoundButton.init();
            Game.PauseButton.init();
            Game.Player.init();
            Game.LevelControl.init();
            Game.LevelMenu.init();
            Game.LevelData.init();
            Game.LevelMaps.init();
            Game.LevelFlow.init();
            Game.LevelGraphics.init();
            Game.LevelFog.init();
            Game.LevelPhysics.init();
            Game.LevelAdLoader.init();
            return _this;
        }
        Level.initStr = function () {
            Game.SceneText.yOffsetText = 0;
            Game.STR_JUMP = Game.IS_TOUCH ? "TOUCH RIGHT TO JUMP" : "LEFT CLICK TO JUMP";
            Game.STR_SLIDE = Game.IS_TOUCH ? "TOUCH LEFT TO SLIDE" : "C OR RIGHT CLICK TO SLIDE";
            Game.STR_START = Game.IS_TOUCH ? "TOUCH TO START" : "PRESS LEFT CLICK TO START";
            Game.STR_CONTINUE = Game.IS_TOUCH ? "TOUCH TO CONTINUE" : "PRESS LEFT CLICK TO CONTINUE";
        };
        return Level;
    }(Game.Scene));
    Game.Level = Level;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var fra = [];
    var filspr;
    var bacspr;
    var adstex;
    var timtex;
    var endcou;
    var skicou;
    var skispr;
    var skibut;
    var skitex;
    var skisel = false;
    var ver = -20 + 6;
    var rew = false;
    Game.addAction("init", function () { fra = Game.FrameSelector.complex("adsdem", Game.Resources.texture, 1, 766); });
    Game.hasrew = function (_st) { return false; };
    function makadsdem() {
        filspr = new Engine.Sprite();
        filspr.enabled = false;
        filspr.pinned = true;
        fra[2].applyToSprite(filspr);
        Engine.System.addListenersFrom(adsdemlis);
        bacspr = new Engine.Sprite();
        fra[0].applyToSprite(bacspr);
        bacspr.pinned = true;
        bacspr.y = ver - 20;
        adstex = Game.SceneText.createMiddleText("", ver - 8, false);
        adstex.scale = 2;
        timtex = Game.SceneText.createMiddleText("", ver + 9, false);
        skispr = new Engine.Sprite();
        skispr.enabled = false;
        skispr.pinned = true;
        fra[1].applyToSprite(skispr);
        skibut = new Game.Button(skispr);
        skibut.arrows.font = Game.FontManager.a;
        skibut.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        skibut.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        skibut.anchor.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        skibut.anchor.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        skibut.anchor.xAligned = 0;
        skibut.anchor.yAligned = ver + 59.5 - 3 - 18 - 8 + 1;
        skibut.arrows.enabled = false;
        skibut.control.enabled = false;
        skibut.control.url = " ";
        skibut.control.onLinkTrigger = function () {
            if (filspr.enabled) {
                //if(skibut.control.aud!=null)skibut.control.aud.play();
                if (rew) {
                    dis();
                    setTimeout(Game.fairewads, 100);
                }
                else {
                    dis();
                    setTimeout(Game.endintads, 100);
                }
            }
        };
        skitex = new Utils.Text();
        skitex.font = Game.FontManager.a;
        skitex.str = " ";
        skitex.scale = 1;
        skitex.enabled = skitex.pinned = true;
        skitex.front = false;
        skitex.xAlignView = Utils.AnchorAlignment.MIDDLE;
        skitex.yAlignView = Utils.AnchorAlignment.MIDDLE;
        skitex.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        skitex.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        skitex.xAligned = 0;
        skitex.yAligned = ver + 59.5 - 3 - 18 - 8 + 1;
    }
    Game.makadsdem = makadsdem;
    function tri(str, tim) {
        console.warn(str + " AD TRIGGERED");
        filspr.enabled = true;
        bacspr.enabled = true;
        adsdemlis.onViewUpdate();
        adstex.enabled = true;
        adstex.str = str + " AD";
        endcou = tim * 60;
        timtex.str = "AD WILL FINISH IN " + (endcou / 60) + " SECONDS";
        timtex.enabled = true;
        skispr.enabled = true;
        skispr.alpha = rew ? 1 : Game.alpdisbut;
        skitex.enabled = true;
        skibut.control.enabled = rew;
        skicou = rew ? 0 : 5 * 60;
        skitex.str = rew ? "SKIP AD (NO REWARD)" : skistr(5);
        for (var _i = 0, _a = skitex.sprites; _i < _a.length; _i++) {
            var spr = _a[_i];
            spr.alpha = rew ? 1 : Game.alpdisbut + 0.05 * 2;
        }
    }
    function skistr(sec) {
        return sec == 1 ? "SKIP IN 1 SECOND" + (rew ? " (NO REWARD)" : "") : "SKIP IN " + sec + " SECONDS" + (rew ? " (NO REWARD)" : "");
    }
    function dis() {
        filspr.enabled = false;
        bacspr.enabled = false;
        adstex.enabled = false;
        timtex.enabled = false;
        skispr.enabled = false;
        skibut.control.enabled = false;
        skitex.enabled = false;
        skisel = false;
        rew = false;
    }
    Game.triintads = function () { tri("INTERSTITIAL", 10); };
    Game.endintads = function () { };
    Game.trirewads = function () {
        rew = true;
        tri("REWARDED", 5 * 3);
    };
    Game.endrewads = function () { };
    Game.fairewads = function () { };
    var adsdemlis;
    (function (adsdemlis) {
        adsdemlis.owner = null;
        adsdemlis.preserved = false;
        function onViewUpdate() {
            filspr.xSize = Engine.Renderer.xSizeView + 10;
            filspr.ySize = Engine.Renderer.ySizeView + 10;
            filspr.xOffset = -filspr.xSize * 0.5;
            filspr.yOffset = -filspr.ySize * 0.5;
        }
        adsdemlis.onViewUpdate = onViewUpdate;
        function onStepUpdate() {
            if (filspr.enabled) {
                if (skicou > 0)
                    skicou--;
                else {
                    if (skibut.control.selected && !skisel) {
                        skitex.str = ">SKIP AD" + (rew ? " (NO REWARD)" : "") + "<";
                        skisel = true;
                    }
                    else if (!skibut.control.selected && skisel) {
                        skitex.str = "SKIP AD" + (rew ? " (NO REWARD)" : "");
                        skisel = false;
                    }
                }
                if (skicou % 60 == 1) {
                    var val = (skicou - 1) / 60;
                    if (val == 0) {
                        skispr.alpha = 1;
                        skibut.control.enabled = true;
                        skitex.str = "SKIP AD" + (rew ? " (NO REWARD)" : "");
                        for (var _i = 0, _a = skitex.sprites; _i < _a.length; _i++) {
                            var spr = _a[_i];
                            spr.alpha = 1;
                        }
                    }
                    else
                        skitex.str = skistr(val);
                }
                if (endcou > 0)
                    endcou--;
                if (endcou % 60 == 1) {
                    var val = (endcou - 1) / 60;
                    if (val == 1)
                        timtex.str = "AD WILL FINISH IN 1 SECOND";
                    else if (val == 0) {
                        if (rew) {
                            dis();
                            Game.endrewads();
                        }
                        else {
                            dis();
                            Game.endintads();
                        }
                    }
                    else
                        timtex.str = "AD WILL FINISH IN " + val + " SECONDS";
                }
            }
        }
        adsdemlis.onStepUpdate = onStepUpdate;
        function onDrawAdsDemo() {
            if (filspr.enabled) {
                filspr.render();
                bacspr.render();
                adstex.drawMe();
                timtex.drawMe();
                skispr.render();
                skitex.drawMe();
            }
        }
        adsdemlis.onDrawAdsDemo = onDrawAdsDemo;
    })(adsdemlis = Game.adsdemlis || (Game.adsdemlis = {}));
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var X_LOADING_START = 0;
    var STEPS_DOTS = 20;
    //TODO: CHANGE SCENE FREEZER
    var LevelAdLoader = /** @class */ (function (_super) {
        __extends(LevelAdLoader, _super);
        function LevelAdLoader() {
            var _this = _super.call(this) || this;
            _this.sprite = new Engine.Sprite();
            _this.sprite.setRGBA(0, 0, 0, 0.5);
            _this.sprite.enabled = false;
            _this.sprite.pinned = true;
            _this.frame = new Engine.Sprite();
            _this.frame.setFull(false, true, Game.Resources.texture, 79, 21, -79 * 0.5, -21 * 0.5, 245, 55, 79, 21);
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
            _this.onViewUpdate();
            return _this;
        }
        Object.defineProperty(LevelAdLoader, "blocked", {
            get: function () {
                return LevelAdLoader.instance.sprite.enabled;
            },
            enumerable: false,
            configurable: true
        });
        /*
        function initPause(){
            
    
            pauseDialog = new Engine.Sprite();
            pauseDialog.pinned = true;
            pauseDialog.y = 0;
            FRAMES_PAUSE[0].applyToSprite(pauseDialog);
        }
    

        */
        LevelAdLoader.init = function () {
            LevelAdLoader.instance = new LevelAdLoader();
        };
        LevelAdLoader.prototype.onViewUpdate = function () {
            this.sprite.xSize = Engine.Renderer.xSizeView;
            this.sprite.ySize = Engine.Renderer.ySizeView;
            this.sprite.x = -Engine.Renderer.xSizeView * 0.5;
            this.sprite.y = -Engine.Renderer.ySizeViewIdeal * 0.5;
        };
        LevelAdLoader.prototype.onStepUpdate = function () {
            if (this.text.enabled) {
                this.count += 1;
                if (this.count >= STEPS_DOTS) {
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
            }
        };
        LevelAdLoader.prototype.onDrawAdFade = function () {
            this.sprite.render();
            this.frame.render();
        };
        LevelAdLoader.show = function () {
            LevelAdLoader.instance.sprite.enabled = true;
            LevelAdLoader.instance.frame.enabled = true;
            LevelAdLoader.instance.text.enabled = true;
            LevelAdLoader.instance.text.str = "   PLEASE WAIT   ";
            LevelAdLoader.instance.count = 0;
        };
        LevelAdLoader.hide = function () {
            LevelAdLoader.instance.sprite.enabled = false;
            LevelAdLoader.instance.frame.enabled = false;
            LevelAdLoader.instance.text.enabled = false;
        };
        LevelAdLoader.prototype.onClearScene = function () {
            LevelAdLoader.instance = null;
        };
        return LevelAdLoader;
    }(Engine.Entity));
    Game.LevelAdLoader = LevelAdLoader;
})(Game || (Game = {}));
///<reference path="../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var Control = /** @class */ (function (_super) {
        __extends(Control, _super);
        function Control() {
            var _this = _super.call(this) || this;
            _this.aud = null;
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
            _this.aud = Control.defaud;
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
                            //    Engine.LinkManager.remove(this, this._url);
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
                if (this.aud != null)
                    this.aud.play();
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
        Control.defaud = null;
        return Control;
    }(Engine.Entity));
    Game.Control = Control;
})(Game || (Game = {}));
///<reference path="../../Utils/Control.ts"/>
var Game;
(function (Game) {
    var LevelControl = /** @class */ (function (_super) {
        __extends(LevelControl, _super);
        function LevelControl() {
            var _this = _super.call(this) || this;
            _this.enabled = true;
            _this.freezeable = true;
            _this.listener = _this;
            _this.useKeyboard = false;
            _this.newInteractionRequired = true;
            _this.useMouse = true;
            _this.mouseButtons = [0];
            //this.keys = [Engine.Keyboard.X];
            _this.useTouch = true;
            return _this;
        }
        Object.defineProperty(LevelControl, "pressed", {
            get: function () {
                return LevelControl.instance.pressed;
            },
            enumerable: false,
            configurable: true
        });
        LevelControl.init = function () {
            LevelControl.instance = new LevelControl();
        };
        return LevelControl;
    }(Game.Control));
    Game.LevelControl = LevelControl;
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    Game.MAX_RULES = 8;
    Game.RULE_VOID = -1;
    Game.RULE_NOTHING = 0;
    Game.RULE_FOG = 1;
    Game.RULE_SPEED_UP = 2;
    Game.RULE_INVISIBILITY = 3;
    Game.RULE_LAG = 4;
    Game.RULE_MEMORY = 5;
    Game.RULE_DOUBLE_JUMP = 6;
    Game.RULE_GRAVITY = 7;
    var MAP_HISTORIAL_LENGTH_EASY = 3;
    var MAP_HISTORIAL_LENGTH_HARD = 3;
    var RULE_HISTORIAL_LENGTH = 4;
    var MAX_MAPS = 5;
    var DIFICULTY_EASY = 0;
    Game.DIFICULTY_HARD = 1;
    var RULE_MAX_ENTERS_EASY = 1;
    Game.testRule = -1;
    Game.testDifficulty = -1;
    Game.testMap = -1;
    var previousRule = 0;
    var previousDifficulty = 0;
    var previousMap = 0;
    var currentRule = 0;
    var currentDifficulty = 0;
    var currentMap = 0;
    var futureRule = 0;
    var futureDifficulty = 0;
    var futureMap = 0;
    var ruleEnterCount = new Int32Array(Game.MAX_RULES);
    var ruleHistorial = new Int32Array(RULE_HISTORIAL_LENGTH);
    var mapHistorialsEasy = new Int32Array(Game.MAX_RULES * MAP_HISTORIAL_LENGTH_EASY);
    var mapHistorialsHard = new Int32Array(Game.MAX_RULES * MAP_HISTORIAL_LENGTH_HARD);
    function initHistorials() {
        for (var historialIndex = 0; historialIndex < RULE_HISTORIAL_LENGTH; historialIndex += 1) {
            ruleHistorial[historialIndex] = 9;
        }
        for (var mapHistorialIndex = 0; mapHistorialIndex < Game.MAX_RULES * MAP_HISTORIAL_LENGTH_EASY; mapHistorialIndex += 1) {
            mapHistorialsEasy[mapHistorialIndex] = 9;
        }
        for (var mapHistorialIndex = 0; mapHistorialIndex < Game.MAX_RULES * MAP_HISTORIAL_LENGTH_HARD; mapHistorialIndex += 1) {
            mapHistorialsHard[mapHistorialIndex] = 9;
        }
    }
    function setFirstMap() {
        currentRule = 0;
        currentDifficulty = 0;
        futureRule = 0;
        futureDifficulty = 0;
        for (var indexRule = 0; indexRule < Game.MAX_RULES; indexRule += 1) {
            ruleEnterCount[indexRule] = 0;
        }
        updateMaps();
        setNextMap();
        previousRule = Game.RULE_VOID;
    }
    function updateMaps() {
        var mapHistorials = futureDifficulty == DIFICULTY_EASY ? mapHistorialsEasy : mapHistorialsHard;
        var mapHistorialsLength = futureDifficulty == DIFICULTY_EASY ? MAP_HISTORIAL_LENGTH_EASY : MAP_HISTORIAL_LENGTH_HARD;
        var possibleFutureMaps = [];
        for (var index_map = 0; index_map < MAX_MAPS; index_map += 1) {
            var addMap = true;
            for (var indexHistorial = 0; indexHistorial < mapHistorialsLength; indexHistorial += 1) {
                if (mapHistorials[futureRule * mapHistorialsLength + indexHistorial] == index_map) {
                    addMap = false;
                    break;
                }
            }
            if (addMap) {
                possibleFutureMaps.push(index_map);
            }
        }
        if (Game.testMap >= 0) {
            previousMap = Game.testMap;
            currentMap = Game.testMap;
            futureMap = Game.testMap;
        }
        else {
            previousMap = currentMap;
            currentMap = futureMap;
            futureMap = possibleFutureMaps[Math.floor(Math.random() * possibleFutureMaps.length)];
        }
    }
    function setNextMap() {
        updateHistorials();
        updateRules();
        updateDifficulty();
        updateMaps();
    }
    function updateHistorials() {
        ruleEnterCount[futureRule] += 1;
        for (var indexHistorial = RULE_HISTORIAL_LENGTH - 1; indexHistorial > 0; indexHistorial -= 1) {
            ruleHistorial[indexHistorial] = ruleHistorial[indexHistorial - 1];
        }
        ruleHistorial[0] = futureRule;
        var mapHistorials = futureDifficulty == DIFICULTY_EASY ? mapHistorialsEasy : mapHistorialsHard;
        var mapHistorialsLength = futureDifficulty == DIFICULTY_EASY ? MAP_HISTORIAL_LENGTH_EASY : MAP_HISTORIAL_LENGTH_HARD;
        for (var indexMapHistorial = mapHistorialsLength - 1; indexMapHistorial > 0; indexMapHistorial -= 1) {
            mapHistorials[futureRule * mapHistorialsLength + indexMapHistorial] = mapHistorials[futureRule * mapHistorialsLength + indexMapHistorial - 1];
        }
        mapHistorials[futureRule * mapHistorialsLength] = futureMap;
    }
    function updateRules() {
        var possibleFutureRules = new Int32Array(Game.MAX_RULES - 1);
        var maxPossibleFutureRules = 0;
        for (var rule_index = 1; rule_index < Game.MAX_RULES; rule_index += 1) {
            var add_rule = true;
            for (var indexHistorial = 0; indexHistorial < RULE_HISTORIAL_LENGTH; indexHistorial += 1) {
                if (ruleHistorial[indexHistorial] == rule_index) {
                    add_rule = false;
                    break;
                }
            }
            if (add_rule) {
                maxPossibleFutureRules += 1;
                possibleFutureRules[maxPossibleFutureRules - 1] = rule_index;
            }
        }
        if (Game.testRule >= 0) {
            previousRule = Game.testRule;
            currentRule = Game.testRule;
            futureRule = Game.testRule;
        }
        else {
            previousRule = currentRule;
            currentRule = futureRule;
            futureRule = possibleFutureRules[Math.floor(Math.random() * maxPossibleFutureRules)];
        }
    }
    function updateDifficulty() {
        if (Game.testDifficulty >= 0) {
            previousDifficulty = Game.testDifficulty;
            currentDifficulty = Game.testDifficulty;
            futureDifficulty = Game.testDifficulty;
        }
        else {
            previousDifficulty = currentDifficulty;
            currentDifficulty = futureDifficulty;
            if (ruleEnterCount[futureRule] >= RULE_MAX_ENTERS_EASY) {
                futureDifficulty = Game.DIFICULTY_HARD;
            }
            else {
                futureDifficulty = DIFICULTY_EASY;
            }
        }
    }
    var LevelData = /** @class */ (function (_super) {
        __extends(LevelData, _super);
        function LevelData() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(LevelData, "previousRule", {
            get: function () {
                return previousRule;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelData, "previousDifficulty", {
            get: function () {
                return previousDifficulty;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelData, "previousMap", {
            get: function () {
                return previousMap;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelData, "currentRule", {
            get: function () {
                return currentRule;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelData, "currentDifficulty", {
            get: function () {
                return currentDifficulty;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelData, "currentMap", {
            get: function () {
                return currentMap;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelData, "futureRule", {
            get: function () {
                return futureRule;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelData, "futureDifficulty", {
            get: function () {
                return futureDifficulty;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelData, "futureMap", {
            get: function () {
                return futureMap;
            },
            enumerable: false,
            configurable: true
        });
        LevelData.init = function () {
            initHistorials();
            setFirstMap();
        };
        LevelData.setFirstMap = function () {
            setFirstMap();
        };
        LevelData.setNextMap = function () {
            setNextMap();
        };
        return LevelData;
    }(Engine.Entity));
    Game.LevelData = LevelData;
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var STEPS_LEAVING_PLAY = 20;
    var STEPS_NEXT_RULE = 40;
    var STEPS_NEXT_RULE_EXPLAIN = 50;
    var STEPS_MEMORY_STAY = 60;
    var SPEED_MEMORY_FORWARD = 160 * 3 / 60;
    var SPEED_MEMORY_BACKWARD = 320 * 3 / 60;
    var STRING_PAUSE_INDICATOR = "PAUSED";
    var TIME_INDICATION_SHOW = 4.0;
    var instance;
    var stateWaitingStart;
    var statePlaying;
    var stateBacktrack;
    var stateNextRule;
    var stateNextRuleExplain;
    var stateNextRuleContinue;
    var stateMemoryForward;
    var stateMemoryStay;
    var stateMemoryBackward;
    var statePaused;
    var stateLeavingPlay;
    var stateGameOver;
    var stateContinueGame;
    var stateShop;
    var stateReset;
    var machine;
    var indicationFrameA;
    var indicationFrameB;
    var pauseDialog;
    var textIndicationJump;
    var textIndicationSlide;
    //var paused = false;
    var pauseFrame;
    var pauseText;
    Game.screens = 0;
    var hiScreens = 0;
    var countSteps = 0;
    var countStepsBlink = 0;
    var distMemory = 0;
    var indication_cursor_x = 0;
    var indication_show_time_count = 0;
    var score = 0;
    function initTexts() {
        Game.textScore = Game.SceneText.createMiddleStartText("", 1, false);
        //textScore.enabled=false;
        score = Game.loapoi();
        Game.textHiScore = Game.SceneText.createMiddleStartText("CREDITS: " + score, 4, false);
        Game.textHiScore.front = true;
        textIndicationJump = Game.SceneText.createMiddleText(Game.STR_JUMP, -6, false);
        textIndicationSlide = Game.SceneText.createMiddleText(Game.STR_SLIDE, 6, false);
    }
    function initFrames() {
        indicationFrameA = new Engine.Sprite();
        indicationFrameA.pinned = true;
        indicationFrameA.y = 3;
        FRAMES_SMALL[0].applyToSprite(indicationFrameA);
        indicationFrameB = new Engine.Sprite();
        indicationFrameB.pinned = true;
        indicationFrameB.y = -2;
        indicationFrameB.yMirror = true;
        FRAMES_SMALL[0].applyToSprite(indicationFrameB);
    }
    function initHiScore() {
        var hiScreensData = Engine.Data.load("hiScreens");
        hiScreens = hiScreensData == null ? 0 : +hiScreensData;
        Game.triggerActions("loadgame");
    }
    function saveHiScore() {
        Game.savpoi();
        savscrdat();
        Game.triggerActions("savegame");
    }
    function delscrdat() {
        hiScreens = 0;
        savscrdat();
    }
    Game.delscrdat = delscrdat;
    function savscrdat() {
        Engine.Data.save("hiScreens", hiScreens, 60);
    }
    Game.savscrdat = savscrdat;
    function initPause() {
        pauseText = Game.SceneText.createMiddleText(STRING_PAUSE_INDICATOR, 0, false);
        pauseFrame = new Engine.Sprite();
        pauseFrame.setRGBA(0, 0, 0, 0.5);
        pauseFrame.enabled = false;
        pauseFrame.pinned = true;
        fixPauseFrame();
        pauseDialog = new Engine.Sprite();
        pauseDialog.pinned = true;
        pauseDialog.y = 0;
        FRAMES_PAUSE[0].applyToSprite(pauseDialog);
    }
    function fixPauseFrame() {
        pauseFrame.xSize = Engine.Renderer.xSizeView;
        pauseFrame.ySize = Engine.Renderer.ySizeView;
        pauseFrame.x = -Engine.Renderer.xSizeView * 0.5;
        pauseFrame.y = -Engine.Renderer.ySizeViewIdeal * 0.5;
    }
    function updpoi() {
        if (Game.scoreMultipler() > 1) {
            Game.textHiScore.str = "(+" + (Game.scoreMultipler() - 1) + ") CREDITS: " + Game.Player.score;
            for (var i = 0; i < Game.textHiScore.sprites.length; i++) {
                Game.textHiScore.sprites[i].red = 0;
                Game.textHiScore.sprites[i].blue = 0;
                if (Game.textHiScore.str[i] == ")")
                    return;
            }
        }
        else {
            Game.textHiScore.str = "CREDITS: " + Game.Player.score;
            for (var _i = 0, _a = Game.textHiScore.sprites; _i < _a.length; _i++) {
                var spr = _a[_i];
                spr.red = 1;
                spr.blue = 1;
            }
        }
    }
    Game.updpoi = updpoi;
    function initStates() {
        stateWaitingStart = new Game.State(instance);
        statePlaying = new Game.State(instance);
        stateBacktrack = new Game.State(instance);
        stateNextRule = new Game.State(instance);
        stateNextRuleExplain = new Game.State(instance);
        stateNextRuleContinue = new Game.State(instance);
        stateMemoryForward = new Game.State(instance);
        stateMemoryStay = new Game.State(instance);
        stateMemoryBackward = new Game.State(instance);
        statePaused = new Game.State(instance);
        stateLeavingPlay = new Game.State(instance);
        stateGameOver = new Game.State(instance);
        stateContinueGame = new Game.State(instance);
        stateReset = new Game.State(instance);
        stateShop = new Game.State(instance);
        stateWaitingStart.addLink(statePlaying, function () { return Game.LevelMenu.finished; });
        statePlaying.onEnter = function () {
            var bonval = (5 - Game.screens % 5);
            if (bonval == 1)
                Game.textScore.str = "BONUS NEXT LEVEL";
            else
                Game.textScore.str = "BONUS IN " + bonval + " LEVELS";
            Game.textHiScore.yAligned = 8 + Game.SceneText.yOffsetText;
            Game.PauseButton.enabled = true;
            if (machine.oldState == stateWaitingStart /* || machine.oldState == stateReset */) {
                Game.triggerActions("play");
            }
            if (machine.oldState == stateWaitingStart || machine.oldState == stateReset) {
                Game.triggerActions("zriststartplay");
            }
        };
        statePlaying.onStepUpdate = function () {
            if (score != Game.Player.score) {
                score = Game.Player.score;
                updpoi();
            }
        };
        statePlaying.onExit = function () {
            Game.PauseButton.enabled = machine.nextState == statePaused;
        };
        statePlaying.addLink(stateLeavingPlay, function () { return Game.Player.dead; });
        statePlaying.addLink(stateBacktrack, function () { return Game.Player.physicsCursor >= Game.MAP_WIDTH * Game.SIZE_TILE; });
        statePlaying.addLink(statePaused, function () { return Game.PauseButton.pressed; });
        statePaused.onEnter = function () {
            //paused = true;
            pauseText.enabled = true;
            pauseFrame.enabled = true;
            pauseDialog.enabled = true;
        };
        statePaused.onStepUpdate = function () {
        };
        statePaused.onExit = function () {
            //paused = false;
            pauseText.enabled = false;
            pauseFrame.enabled = false;
            pauseDialog.enabled = false;
        };
        statePaused.addLink(statePlaying, function () { return Game.PauseButton.pressed; });
        stateBacktrack.onEnter = function () {
        };
        stateBacktrack.onStepUpdate = function () {
        };
        stateBacktrack.addLink(stateNextRule, function () { return true; });
        stateNextRule.onEnter = function () {
            countSteps = 0;
            Game.LevelData.setNextMap();
            Game.Resources.sfxEvent.play();
            Game.screens += 1;
            var bonval = (5 - Game.screens % 5);
            if (bonval == 1)
                Game.textScore.str = "BONUS NEXT LEVEL";
            else
                Game.textScore.str = "BONUS IN " + bonval + " LEVELS";
            updpoi();
            if (Game.screens > hiScreens) {
                hiScreens = Game.screens;
            }
            saveHiScore();
            Game.triggerActions("zristnextrule");
            if (Game.LevelData.currentRule != Game.RULE_GRAVITY) {
                Game.triggerActions("zriststopplay");
            }
            Game.enarultex();
        };
        stateNextRule.onStepUpdate = function () {
            countSteps += 1;
        };
        stateNextRule.addLink(stateNextRuleExplain, function () { return countSteps >= STEPS_NEXT_RULE; });
        stateNextRuleExplain.onEnter = function () {
            countSteps = 0;
            Game.triggerActions("lose");
            Game.enarulexptex();
        };
        stateNextRuleExplain.onStepUpdate = function () {
            countSteps += 1;
        };
        stateNextRuleExplain.addLink(stateNextRuleContinue, function () { return countSteps >= STEPS_NEXT_RULE_EXPLAIN; });
        stateNextRuleContinue.onEnter = function () {
            Game.enanexrulcon();
            countStepsBlink = 0;
        };
        stateNextRuleContinue.onStepUpdate = function () {
            Game.stenexrul();
            countStepsBlink += 1;
            if (countStepsBlink >= Game.STEPS_BLINK_TEXT_PROCEED_NORMAL) {
                //textContinue.enabled = !textContinue.enabled;
                countStepsBlink = 0;
            }
        };
        stateNextRuleContinue.onExit = function () {
            Game.exinexrul();
        };
        stateNextRuleContinue.addLink(stateMemoryForward, function () { return Game.LevelData.currentRule == Game.RULE_MEMORY && Game.connexrul(); });
        stateNextRuleContinue.addLink(statePlaying, function () { return Game.connexrul(); });
        stateMemoryForward.onEnter = function () {
            distMemory = 0;
        };
        stateMemoryForward.onStepUpdate = function () {
            distMemory += SPEED_MEMORY_FORWARD * (Game.SceneOrientator.blocked ? 0 : 1);
        };
        stateMemoryForward.addLink(stateMemoryStay, function () { return LevelFlow.cursor >= LevelFlow.maxCursor; });
        stateMemoryStay.onEnter = function () {
            countSteps = 0;
        };
        stateMemoryStay.onStepUpdate = function () {
            countSteps += 1 * (Game.SceneOrientator.blocked ? 0 : 1);
        };
        stateMemoryStay.addLink(stateMemoryBackward, function () { return countSteps >= STEPS_MEMORY_STAY; });
        stateMemoryBackward.onEnter = function () {
            distMemory = 0;
        };
        stateMemoryBackward.onStepUpdate = function () {
            distMemory -= SPEED_MEMORY_BACKWARD * (Game.SceneOrientator.blocked ? 0 : 1);
        };
        stateMemoryBackward.addLink(statePlaying, function () { return LevelFlow.cursor <= LevelFlow.defaultCursor; });
        stateLeavingPlay.onEnter = function () {
            if (Game.LevelData.currentRule != Game.RULE_GRAVITY) {
                Game.triggerActions("zristleavingplay");
            }
            countSteps = 0;
            saveHiScore();
        };
        stateLeavingPlay.onStepUpdate = function () {
            countSteps += 1;
            if (countSteps == STEPS_LEAVING_PLAY) {
                //triggerActions("zristcheckad");
            }
            if (countSteps > STEPS_LEAVING_PLAY) {
                countSteps = STEPS_LEAVING_PLAY;
            }
        };
        stateLeavingPlay.addLink(stateGameOver, function () { return countSteps >= STEPS_LEAVING_PLAY && Game.LevelAdLoader.instance.sprite.enabled == false; });
        stateGameOver.onEnter = function () {
            Game.entove();
        };
        stateGameOver.onStepUpdate = function () {
            Game.steove();
        };
        stateGameOver.onExit = function () {
            Game.exiove();
        };
        stateGameOver.addLink(stateContinueGame, function () { return Game.linove() && Game.congam; });
        stateGameOver.addLink(stateReset, function () { return Game.linove(); });
        stateContinueGame.onEnter = function () {
            Game.triggerActions("resetlevelbutton");
        };
        stateContinueGame.addLink(stateMemoryForward, function () { return Game.LevelData.currentRule == Game.RULE_MEMORY; });
        stateContinueGame.addLink(statePlaying, function () { return true; });
        stateReset.onEnter = function () {
        };
        stateReset.onStepUpdate = function () {
        };
        stateReset.onExit = function () {
            Game.screens = 0;
            Game.textHiScore.yAligned = 4 + Game.SceneText.yOffsetText;
            Game.textScore.enabled = false;
            updpoi();
            Game.LevelData.setFirstMap();
            Game.triggerActions("resetlevelbutton");
        };
        stateReset.addLink(stateShop, function () { return true; });
        stateShop.onEnter = function () {
            Game.entsho();
        };
        stateShop.onTimeUpdate = function () {
            Game.timsho();
        };
        stateShop.onExit = function () {
            Game.exisho();
            Game.textScore.str = "BONUS IN 5 LEVELS";
            Game.textScore.enabled = true;
        };
        stateShop.addLink(statePlaying, function () { return Game.linsho(); });
        machine = new Game.StateMachine(instance);
        machine.startState = stateWaitingStart;
    }
    function updateIndicationUI() {
        if (machine.currentState == statePlaying) {
            if (indication_cursor_x == Game.Player.physicsCursor) {
                indication_show_time_count += Engine.System.deltaTime;
            }
            else {
                indication_cursor_x = Game.Player.physicsCursor;
                indication_show_time_count = 0;
            }
            if (indication_show_time_count >= TIME_INDICATION_SHOW) {
                if (!textIndicationJump.enabled) {
                    textIndicationJump.enabled = true;
                    textIndicationSlide.enabled = true;
                    indicationFrameA.enabled = true;
                    indicationFrameB.enabled = true;
                }
            }
            else {
                if (textIndicationJump.enabled) {
                    textIndicationJump.enabled = false;
                    textIndicationSlide.enabled = false;
                    indicationFrameA.enabled = false;
                    indicationFrameB.enabled = false;
                }
            }
        }
        else {
            indication_show_time_count = 0;
            indication_cursor_x = -100;
            if (textIndicationJump.enabled) {
                textIndicationJump.enabled = false;
                textIndicationSlide.enabled = false;
                indicationFrameA.enabled = false;
                indicationFrameB.enabled = false;
            }
        }
    }
    var LevelFlow = /** @class */ (function (_super) {
        __extends(LevelFlow, _super);
        function LevelFlow() {
            return _super.call(this) || this;
        }
        Object.defineProperty(LevelFlow, "cursor", {
            get: function () {
                var cursor = 0;
                switch (machine.currentState) {
                    case stateMemoryForward:
                        cursor = LevelFlow.defaultCursor + distMemory + SPEED_MEMORY_FORWARD * Engine.System.stepExtrapolation;
                        if (cursor > LevelFlow.maxCursor) {
                            cursor = LevelFlow.maxCursor;
                        }
                        break;
                    case stateMemoryStay:
                        cursor = LevelFlow.maxCursor;
                        break;
                    case stateMemoryBackward:
                        cursor = LevelFlow.maxCursor + distMemory - SPEED_MEMORY_BACKWARD * Engine.System.stepExtrapolation;
                        if (cursor < LevelFlow.defaultCursor) {
                            cursor = LevelFlow.defaultCursor;
                        }
                        break;
                    default:
                        cursor = LevelFlow.defaultCursor;
                        break;
                }
                return cursor;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelFlow, "defaultCursor", {
            get: function () {
                return Game.Player.cursor - Engine.Renderer.xSizeView / 6; /* + Engine.Renderer.xSizeView * 0.5 - Engine.Renderer.xSizeView * 0.2778*/
                ;
                //return Player.cursor + (HALF_VIEW_WIDTH_IDEAL - FOLLOW_PLAYER_OFFSET) - get_half_view_width();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelFlow, "maxCursor", {
            get: function () {
                return Game.MAP_WIDTH * Game.SIZE_TILE - Engine.Renderer.xSizeView;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelFlow, "freezed", {
            get: function () {
                var freezed = machine.currentState == stateWaitingStart;
                freezed = freezed || machine.currentState == stateBacktrack;
                freezed = freezed || machine.currentState == stateNextRule;
                freezed = freezed || machine.currentState == stateNextRuleExplain;
                freezed = freezed || machine.currentState == stateNextRuleContinue;
                freezed = freezed || machine.currentState == stateMemoryForward;
                freezed = freezed || machine.currentState == statePaused;
                freezed = freezed || machine.currentState == stateMemoryStay;
                freezed = freezed || machine.currentState == stateMemoryBackward;
                freezed = freezed || machine.currentState == stateLeavingPlay;
                freezed = freezed || machine.currentState == stateGameOver;
                freezed = freezed || machine.currentState == stateContinueGame;
                freezed = freezed || machine.currentState == stateShop;
                freezed = freezed || machine.currentState == stateReset;
                freezed = freezed || Game.SceneOrientator.blocked;
                return freezed;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelFlow, "backtracking", {
            get: function () {
                return machine.currentState == stateBacktrack;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelFlow, "reseting", {
            get: function () {
                return machine.currentState == stateReset || machine.currentState == stateContinueGame;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelFlow, "playing", {
            get: function () {
                return machine.currentState == statePlaying;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelFlow, "lagged", {
            get: function () {
                return Game.LevelData.currentRule == Game.RULE_LAG;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LevelFlow, "paused", {
            get: function () {
                return machine.currentState == statePaused;
            },
            enumerable: false,
            configurable: true
        });
        LevelFlow.init = function () {
            instance = new LevelFlow();
            initHiScore();
            initTexts();
            initFrames();
            Game.makadsdem();
            Game.makove();
            initPause();
            Game.maksho();
            Game.maknexrul();
            initStates();
        };
        LevelFlow.prototype.onViewUpdate = function () {
            fixPauseFrame();
            Game.vieove();
        };
        LevelFlow.prototype.onTimeUpdate = function () {
            updateIndicationUI();
        };
        LevelFlow.prototype.onDrawPause = function () {
            pauseFrame.render();
        };
        LevelFlow.prototype.onDrawDialogs = function () {
            Game.drasho();
            Game.dranexrul();
            Game.draove();
            indicationFrameA.render();
            indicationFrameB.render();
            pauseDialog.render();
        };
        return LevelFlow;
    }(Engine.Entity));
    Game.LevelFlow = LevelFlow;
    //var FRAMES : Array<Utils.AnimationFrame> = null;
    var FRAMES_SMALL = null;
    var FRAMES_PAUSE = null;
    Game.addAction("init", function () {
        //FRAMES = FrameSelector.complex("levelFlow a", Resources.texture, 513, 1);
        FRAMES_SMALL = Game.FrameSelector.complex("levelFlow b", Game.Resources.texture, 379, 50);
        FRAMES_PAUSE = Game.FrameSelector.complex("levelFlow c", Game.Resources.texture, 1, 33);
    });
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var MAX_CANVASES_FOG = 6;
    var MAX_ALPHA_FOG = 0.45;
    var DELTA_ALPHA_FOG = 1.0;
    var POSITION_START_FOG;
    var sprites = [];
    var alpha = 0;
    var LevelFog = /** @class */ (function (_super) {
        __extends(LevelFog, _super);
        function LevelFog() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LevelFog.init = function () {
            new LevelFog();
            POSITION_START_FOG = Game.SIZE_TILE * 1;
            for (var indexSprite = 0; indexSprite < MAX_CANVASES_FOG; indexSprite += 1) {
                var sprite = new Engine.Sprite;
                //sprite.pinned = true;
                sprite.x = POSITION_START_FOG + Game.SIZE_TILE * indexSprite;
                sprite.y = 0;
                sprite.ySize = Engine.Renderer.ySizeViewIdeal;
                sprites.push(sprite);
            }
            LevelFog.fix();
        };
        LevelFog.fix = function () {
            for (var indexSprite = 0; indexSprite < sprites.length; indexSprite += 1) {
                var sprite = sprites[indexSprite];
                sprite.xSize = Engine.Renderer.xSizeView;
            }
        };
        LevelFog.prototype.onViewUpdate = function () {
            LevelFog.fix();
        };
        LevelFog.prototype.onTimeUpdate = function () {
            if (Game.LevelData.currentRule == Game.RULE_FOG) {
                alpha += DELTA_ALPHA_FOG * Engine.System.deltaTime;
                if (alpha > MAX_ALPHA_FOG) {
                    alpha = MAX_ALPHA_FOG;
                }
            }
            else {
                if (Game.LevelData.currentRule == Game.RULE_NOTHING) {
                    alpha = 0;
                }
                else {
                    alpha -= DELTA_ALPHA_FOG * Engine.System.deltaTime;
                    if (alpha <= 0) {
                        alpha = 0;
                    }
                }
            }
            if (alpha > 0) {
                var x = Game.Player.cursor + Game.SIZE_TILE * 8;
                for (var _i = 0, sprites_1 = sprites; _i < sprites_1.length; _i++) {
                    var sprite = sprites_1[_i];
                    sprite.x = x;
                    x += Game.SIZE_TILE;
                    sprite.enabled = true;
                    sprite.setRGBA(0, 0, 0, alpha);
                }
            }
            else {
                for (var _a = 0, sprites_2 = sprites; _a < sprites_2.length; _a++) {
                    var sprite = sprites_2[_a];
                    sprite.enabled = false;
                }
            }
        };
        LevelFog.prototype.onDrawFog = function () {
            for (var _i = 0, sprites_3 = sprites; _i < sprites_3.length; _i++) {
                var sprite = sprites_3[_i];
                sprite.render();
            }
        };
        return LevelFog;
    }(Engine.Entity));
    Game.LevelFog = LevelFog;
})(Game || (Game = {}));
var Game;
(function (Game) {
    Game.enaove = false;
    var fra = [];
    var spr = null;
    var texove;
    var stebli = 0;
    var ver = -8;
    var adsspr;
    var adsbut;
    var adstex;
    var adssel = false;
    var retspr;
    var retbut;
    var rettex;
    var retsel = false;
    var conspr;
    var conbut;
    var contex;
    var consel = false;
    Game.alpdisbut = 0.15;
    Game.congam = false;
    Game.addAction("init", function () {
        fra = Game.FrameSelector.complex("gamove", Game.Resources.texture, 642, 476);
    });
    function makove() {
        texove = Game.SceneText.createMiddleText("GAME OVER", -5, false);
        texove.scale = 3;
        spr = new Engine.Sprite();
        spr.pinned = true;
        fra[0].applyToSprite(spr);
        adsspr = new Engine.Sprite();
        adsspr.enabled = false;
        adsspr.pinned = true;
        fra[3].applyToSprite(adsspr);
        adsbut = new Game.Button(adsspr);
        adsbut.arrows.font = Game.FontManager.a;
        adsbut.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        adsbut.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        adsbut.anchor.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        adsbut.anchor.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        adsbut.anchor.xAligned = 0;
        adsbut.anchor.yAligned = ver + 12;
        adsbut.arrows.enabled = false;
        adsbut.control.enabled = false;
        adsbut.control.url = " ";
        adsbut.control.onLinkTrigger = function () {
            if (Game.enaove && adsbut.control.enabled) {
                //if(adsbut.control.aud!=null)adsbut.control.aud.play();
                Game.Resources.sfxBlipUp.play();
                adsbut.control.enabled = false;
                retbut.control.enabled = false;
                conbut.control.enabled = false;
                Game.trioveads();
            }
        };
        adstex = new Utils.Text();
        adstex.font = Game.FontManager.a;
        adstex.str = " ";
        adstex.scale = 1;
        adstex.enabled = adstex.pinned = true;
        adstex.front = false;
        adstex.xAlignView = Utils.AnchorAlignment.MIDDLE;
        adstex.yAlignView = Utils.AnchorAlignment.MIDDLE;
        adstex.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        adstex.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        adstex.xAligned = 0;
        adstex.yAligned = ver + 12;
        retspr = new Engine.Sprite();
        retspr.enabled = false;
        retspr.pinned = true;
        fra[3].applyToSprite(retspr);
        retspr.red = 0;
        retspr.blue = 0;
        retbut = new Game.Button(retspr);
        retbut.arrows.font = Game.FontManager.a;
        retbut.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        retbut.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        retbut.anchor.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        retbut.anchor.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        retbut.anchor.xAligned = 0;
        retbut.anchor.yAligned = ver + 12;
        retbut.arrows.enabled = false;
        retbut.control.enabled = false;
        retbut.control.url = " ";
        retbut.control.onLinkTrigger = function () {
            if (Game.enaove && retbut.control.enabled) {
                //Resources.sfxBlipUp.play();
                adsbut.control.enabled = false;
                retbut.control.enabled = false;
                retbut.control.enabled = false;
                conbut.control.enabled = false;
                Game.enaove = false;
                Game.congam = true;
                Game.setPlayerInitialPosition();
            }
        };
        rettex = new Utils.Text();
        rettex.font = Game.FontManager.a;
        rettex.str = " ";
        rettex.scale = 1;
        rettex.enabled = rettex.pinned = true;
        rettex.front = false;
        rettex.xAlignView = Utils.AnchorAlignment.MIDDLE;
        rettex.yAlignView = Utils.AnchorAlignment.MIDDLE;
        rettex.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        rettex.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        rettex.xAligned = 0;
        rettex.yAligned = ver + 12;
        conspr = new Engine.Sprite();
        conspr.enabled = false;
        conspr.pinned = true;
        fra[3].applyToSprite(conspr);
        conbut = new Game.Button(conspr);
        conbut.arrows.font = Game.FontManager.a;
        conbut.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        conbut.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        conbut.anchor.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        conbut.anchor.yAlignBounds = Utils.AnchorAlignment.START;
        conbut.anchor.xAligned = 0;
        conbut.anchor.yAligned = ver + 35 - 6 + 0.5;
        conbut.arrows.enabled = false;
        conbut.control.enabled = false;
        conbut.control.url = " ";
        conbut.control.onLinkTrigger = function () {
            if (Game.enaove && conbut.control.enabled) {
                Game.Resources.sfxBlipUp.play();
                adsbut.control.enabled = false;
                retbut.control.enabled = false;
                conbut.control.enabled = false;
                Game.triovecon();
            }
        };
        contex = new Utils.Text();
        contex.font = Game.FontManager.a;
        contex.str = " ";
        contex.scale = 1;
        contex.enabled = contex.pinned = true;
        contex.front = false;
        contex.xAlignView = Utils.AnchorAlignment.MIDDLE;
        contex.yAlignView = Utils.AnchorAlignment.MIDDLE;
        contex.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        contex.yAlignBounds = Utils.AnchorAlignment.START;
        contex.xAligned = 0;
        contex.yAligned = ver + 39.5;
        vieove();
    }
    Game.makove = makove;
    Game.trioveads = function () {
        Game.endoveads();
    };
    Game.endoveads = function () {
        Game.setPlayerInitialPosition();
        adsbut.control.enabled = false;
        adstex.str = " ";
        adsspr.enabled = false;
        conbut.control.enabled = false;
        conspr.alpha = Game.alpdisbut;
        for (var _i = 0, _a = contex.sprites; _i < _a.length; _i++) {
            var spr = _a[_i];
            spr.alpha = Game.alpdisbut + 0.05 * 2;
        }
        retbut.control.enabled = true;
        rettex.str = "GO!!";
        for (var _b = 0, _c = rettex.sprites; _b < _c.length; _b++) {
            var spr = _c[_b];
            spr.red = 0;
            spr.blue = 0;
        }
        retspr.enabled = true;
        retsel = false;
    };
    Game.faioveads = function () {
        adstex.str = "RETRY? (AD)";
        //var rew=
        Game.hasrew("gamove");
        adsspr.enabled = true;
        //adsbut.control.enabled=rew;
        adssel = false;
        conbut.control.enabled = true;
    };
    Game.trioveret = function () {
    };
    Game.triovecre = function () {
    };
    Game.triovecon = function () {
        Game.endovecon();
    };
    Game.endovecon = function () {
        Game.enaove = false;
    };
    function entove() {
        Game.enaove = true;
        texove.enabled = true;
        spr.enabled = true;
        stebli = 0;
        var off = -10 - 9 + 0.5;
        spr.y = ver - 20 + off;
        texove.yAligned = ver - 3 + 1.5 + 2 + off;
        Game.triggerActions("lose");
        if (Game.LevelData.currentRule != Game.RULE_GRAVITY)
            Game.triggerActions("zriststopplay");
    }
    Game.entove = entove;
    function vieove() {
        if (spr == null)
            return;
    }
    Game.vieove = vieove;
    function steove() {
        stebli += 1;
        if (stebli == Game.STEPS_BLINK_TEXT_PROCEED_NORMAL) {
            adstex.str = "RETRY? (AD)";
            //var rew=
            Game.hasrew("gamove");
            adsspr.enabled = true;
            //adsbut.control.enabled=rew;
            adssel = false;
            conspr.enabled = true;
            conbut.control.enabled = true;
            contex.str = "CONTINUE";
            consel = false;
            conspr.alpha = 1;
            for (var _i = 0, _a = contex.sprites; _i < _a.length; _i++) {
                var spr = _a[_i];
                spr.alpha = 1;
            }
        }
        if (stebli >= Game.STEPS_BLINK_TEXT_PROCEED_NORMAL) {
            if (adsbut.control.selected && !adssel) {
                adstex.str = ">RETRY? (AD)<";
                adssel = true;
            }
            else if (!adsbut.control.selected && adssel) {
                adstex.str = adstex.str == ">RETRY? (AD)<" ? "RETRY? (AD)" : adstex.str;
                adssel = false;
            }
            if (retbut.control.selected && !retsel) {
                rettex.str = ">GO!!<";
                retsel = true;
                for (var _b = 0, _c = rettex.sprites; _b < _c.length; _b++) {
                    var spr = _c[_b];
                    spr.red = 0;
                    spr.blue = 0;
                }
            }
            else if (!retbut.control.selected && retsel) {
                rettex.str = "GO!!";
                retsel = false;
                for (var _d = 0, _e = rettex.sprites; _d < _e.length; _d++) {
                    var spr = _e[_d];
                    spr.red = 0;
                    spr.blue = 0;
                }
            }
            if (conbut.control.selected && !consel) {
                contex.str = ">CONTINUE<";
                consel = true;
            }
            else if (!conbut.control.selected && consel) {
                contex.str = "CONTINUE";
                consel = false;
            }
        }
    }
    Game.steove = steove;
    function enagamoveads() {
        adsbut.control.enabled = true;
        adsspr.alpha = 1;
        for (var _i = 0, _a = adstex.sprites; _i < _a.length; _i++) {
            var spr = _a[_i];
            spr.alpha = 1;
        }
    }
    Game.enagamoveads = enagamoveads;
    function disgamoveads() {
        adsbut.control.enabled = false;
        adsspr.alpha = Game.alpdisbut + 0.05 * 2 * 0;
        for (var _i = 0, _a = adstex.sprites; _i < _a.length; _i++) {
            var spr = _a[_i];
            spr.alpha = Game.alpdisbut + 0.05 * 2;
        }
    }
    Game.disgamoveads = disgamoveads;
    function linove() {
        return !Game.enaove;
    }
    Game.linove = linove;
    function exiove() {
        texove.enabled = false;
        spr.enabled = false;
        adsspr.enabled = false;
        adsbut.control.enabled = false;
        adstex.str = " ";
        adssel = false;
        retspr.enabled = false;
        retbut.control.enabled = false;
        rettex.str = " ";
        retsel = false;
        conspr.enabled = false;
        conbut.control.enabled = false;
        contex.str = " ";
        consel = false;
        if (Game.congam) {
            Game.triggerActions("zristcontinue");
            Game.congam = false;
        }
    }
    Game.exiove = exiove;
    function draove() {
        spr.render();
        adsspr.render();
        retspr.render();
        conspr.render();
    }
    Game.draove = draove;
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var MAX_TILES_SCREEN_Y = 11;
    var SIZE_TILE_HALF = 8;
    var tilred = 1;
    var tilgre = 1;
    var tilblu = 1;
    var tilalp = 1;
    var obsred = 1;
    var obsgre = 0;
    var obsblu = 0;
    var obsalp = 1;
    //var instance : LevelMaps;
    var countTilesScreenX = 0;
    var spritesTiles = [];
    Game.boxesTiles = [];
    function setNeededSprites() {
        spritesTiles = [];
        Game.boxesTiles = [];
        countTilesScreenX = Math.ceil(Engine.Renderer.xSizeView / Game.SIZE_TILE) + 2;
        for (var indexSprite = spritesTiles.length; indexSprite < countTilesScreenX * MAX_TILES_SCREEN_Y; indexSprite += 1) {
            var sprite = new Engine.Sprite();
            spritesTiles.push(sprite);
            var box = new Engine.Box();
            box.renderable = true;
            box.xSize = Game.SIZE_TILE;
            box.ySize = Game.SIZE_TILE;
            Game.boxesTiles.push(box);
        }
    }
    function updateMapSprites() {
        var cursorTiled = (Game.LevelFlow.cursor) / Game.SIZE_TILE;
        if (cursorTiled < 0) {
            cursorTiled -= 1;
        }
        for (var indexTileX = 0; indexTileX < countTilesScreenX; indexTileX += 1) {
            for (var indexTileY = 0; indexTileY < MAX_TILES_SCREEN_Y; indexTileY += 1) {
                var dataTile = Game.LevelMaps.getTile(cursorTiled + indexTileX, indexTileY);
                var spriteTile = spritesTiles[indexTileX * MAX_TILES_SCREEN_Y + indexTileY];
                var boxTile = Game.boxesTiles[indexTileX * MAX_TILES_SCREEN_Y + indexTileY];
                if (dataTile != null) {
                    spriteTile.enabled = true;
                    spriteTile.x = dataTile.x;
                    spriteTile.y = dataTile.y;
                    boxTile.enabled = true;
                    boxTile.x = dataTile.x;
                    boxTile.y = dataTile.y;
                    boxTile.data = dataTile.value;
                    if (dataTile.value == Game.VALUE_TILE_BLUE) {
                        FRAMES[0 + Game.curter * 2].applyToSprite(spriteTile);
                        spriteTile.setRGBA(tilred, tilgre, tilblu, tilalp);
                        boxTile.ySize = Game.SIZE_TILE;
                    }
                    else if (dataTile.value == Game.VALUE_TILE_BLUE_HALF) {
                        FRAMES[1 + Game.curter * 2].applyToSprite(spriteTile);
                        spriteTile.setRGBA(tilred, tilgre, tilblu, tilalp);
                        boxTile.ySize = SIZE_TILE_HALF;
                    }
                    else if (dataTile.value == Game.VALUE_TILE_RED) {
                        FRAMES[0 + Game.curter * 2].applyToSprite(spriteTile);
                        spriteTile.setRGBA(obsred, obsgre, obsblu, obsalp);
                        boxTile.ySize = Game.SIZE_TILE;
                    }
                    else if (dataTile.value == Game.VALUE_TILE_RED_HALF) {
                        FRAMES[1 + Game.curter * 2].applyToSprite(spriteTile);
                        spriteTile.setRGBA(obsred, obsgre, obsblu, obsalp);
                        boxTile.ySize = SIZE_TILE_HALF;
                    }
                    else if (dataTile.value == Game.VALUE_TILE_BLUE_HALF_B) {
                        FRAMES[1 + Game.curter * 2].applyToSprite(spriteTile);
                        spriteTile.setRGBA(tilred, tilgre, tilblu, tilalp);
                        spriteTile.y += SIZE_TILE_HALF;
                        boxTile.y += SIZE_TILE_HALF;
                        boxTile.ySize = SIZE_TILE_HALF;
                    }
                    else if (dataTile.value == Game.VALUE_TILE_RED_HALF_B) {
                        FRAMES[1 + Game.curter * 2].applyToSprite(spriteTile);
                        spriteTile.setRGBA(obsred, obsgre, obsblu, obsalp);
                        spriteTile.y += SIZE_TILE_HALF;
                        boxTile.y += SIZE_TILE_HALF;
                        boxTile.ySize = SIZE_TILE_HALF;
                    }
                    if (boxTile.x < Game.Player.physicsCursor - Game.SIZE_TILE || boxTile.x > Game.Player.physicsCursor + Game.SIZE_TILE * 2 || boxTile.y < Game.Player.physicsCursorY - Game.SIZE_TILE * 3 || boxTile.y > Game.Player.physicsCursorY + Game.SIZE_TILE * 3) {
                        boxTile.enabled = false;
                    }
                }
                else {
                    spriteTile.enabled = false;
                    boxTile.enabled = false;
                }
            }
        }
    }
    function drawMapSprites() {
        for (var _i = 0, spritesTiles_1 = spritesTiles; _i < spritesTiles_1.length; _i++) {
            var sprite = spritesTiles_1[_i];
            sprite.render();
        }
        if (Engine.Box.debugRender) {
            for (var _a = 0, boxesTiles_1 = Game.boxesTiles; _a < boxesTiles_1.length; _a++) {
                var box = boxesTiles_1[_a];
                box.render();
            }
        }
    }
    var LevelGraphics = /** @class */ (function (_super) {
        __extends(LevelGraphics, _super);
        function LevelGraphics() {
            var _this = _super.call(this) || this;
            setNeededSprites();
            return _this;
        }
        LevelGraphics.init = function () {
            new LevelGraphics();
        };
        LevelGraphics.prototype.onViewUpdate = function () {
            setNeededSprites();
        };
        LevelGraphics.prototype.onMapUpdate = function () {
            updateMapSprites();
        };
        LevelGraphics.prototype.onMapConfigureTimeUpdate = function () {
            updateMapSprites();
            Engine.Renderer.camera(Game.LevelFlow.cursor + Engine.Renderer.xSizeView * 0.5, Engine.Renderer.ySizeViewIdeal * 0.5);
        };
        LevelGraphics.prototype.onDrawSceneMap = function () {
            if (LevelGraphics.canRender) {
                drawMapSprites();
            }
        };
        LevelGraphics.canRender = false;
        return LevelGraphics;
    }(Engine.Entity));
    Game.LevelGraphics = LevelGraphics;
    var FRAMES = null;
    Game.addAction("init", function () {
        FRAMES = Game.FrameSelector.complex("scene", Game.Resources.texture, 593, 256);
    });
})(Game || (Game = {}));
var Game;
(function (Game) {
    Game.VALUE_TILE_NONE = 0;
    Game.VALUE_TILE_BLUE = 1;
    Game.VALUE_TILE_BLUE_HALF = 2;
    Game.VALUE_TILE_RED = 3;
    Game.VALUE_TILE_RED_HALF = 4;
    Game.VALUE_TILE_BLUE_HALF_B = 5;
    Game.VALUE_TILE_RED_HALF_B = 6;
    Game.MAP_WIDTH = 200;
    Game.MAP_HEIGHT = 11;
    var indexValueX = 0;
    var indexValueY = 0;
    var colorBlue = { r: 0, g: 0, b: 0, a: 0 };
    var colorRed = { r: 0, g: 0, b: 0, a: 0 };
    var colorWhite = { r: 0, g: 0, b: 0, a: 0 };
    var colorGreen = { r: 0, g: 0, b: 0, a: 0 };
    var tiledMaps = [];
    function initColors() {
        colorBlue.r = Game.Resources.texture.getRed(FRAMES[5].xTexture, FRAMES[5].yTexture);
        colorBlue.g = Game.Resources.texture.getGreen(FRAMES[5].xTexture, FRAMES[5].yTexture);
        colorBlue.b = Game.Resources.texture.getBlue(FRAMES[5].xTexture, FRAMES[5].yTexture);
        colorBlue.a = Game.Resources.texture.getAlpha(FRAMES[5].xTexture, FRAMES[5].yTexture);
        colorRed.r = Game.Resources.texture.getRed(FRAMES[6].xTexture, FRAMES[6].yTexture);
        colorRed.g = Game.Resources.texture.getGreen(FRAMES[6].xTexture, FRAMES[6].yTexture);
        colorRed.b = Game.Resources.texture.getBlue(FRAMES[6].xTexture, FRAMES[6].yTexture);
        colorRed.a = Game.Resources.texture.getAlpha(FRAMES[6].xTexture, FRAMES[6].yTexture);
        colorWhite.r = Game.Resources.texture.getRed(FRAMES[7].xTexture, FRAMES[7].yTexture);
        colorWhite.g = Game.Resources.texture.getGreen(FRAMES[7].xTexture, FRAMES[7].yTexture);
        colorWhite.b = Game.Resources.texture.getBlue(FRAMES[7].xTexture, FRAMES[7].yTexture);
        colorWhite.a = Game.Resources.texture.getAlpha(FRAMES[7].xTexture, FRAMES[7].yTexture);
        colorGreen.r = Game.Resources.texture.getRed(FRAMES[8].xTexture, FRAMES[8].yTexture);
        colorGreen.g = Game.Resources.texture.getGreen(FRAMES[8].xTexture, FRAMES[8].yTexture);
        colorGreen.b = Game.Resources.texture.getBlue(FRAMES[8].xTexture, FRAMES[8].yTexture);
        colorGreen.a = Game.Resources.texture.getAlpha(FRAMES[8].xTexture, FRAMES[8].yTexture);
    }
    var ran = 10;
    function compareColor(x, y, otherColor) {
        var color = {};
        color.r = Game.Resources.texture.getRed(x, y);
        color.g = Game.Resources.texture.getGreen(x, y);
        color.b = Game.Resources.texture.getBlue(x, y);
        //color.a = Resources.texture.getAlpha(x, y);
        return color.r > otherColor.r - ran && color.r < otherColor.r + ran &&
            color.g > otherColor.g - ran && color.g < otherColor.g + ran &&
            color.b > otherColor.b - ran && color.b < otherColor.b + ran;
    }
    function initMaps() {
        for (var indexX = 0; indexX < MAP_FRAME[0].xSize; indexX += 1) {
            tiledMaps[indexX] = [];
            for (var indexY = 0; indexY < MAP_FRAME[0].ySize; indexY += 1) {
                if (compareColor(indexX + MAP_FRAME[0].xTexture, indexY + MAP_FRAME[0].yTexture, colorBlue)) {
                    tiledMaps[indexX][indexY] = Game.VALUE_TILE_BLUE;
                }
                else if (compareColor(indexX + MAP_FRAME[0].xTexture, indexY + MAP_FRAME[0].yTexture, colorRed)) {
                    tiledMaps[indexX][indexY] = Game.VALUE_TILE_RED;
                }
                else if (compareColor(indexX + MAP_FRAME[0].xTexture, indexY + MAP_FRAME[0].yTexture, colorWhite)) {
                    if (compareColor(indexX + MAP_FRAME[0].xTexture, indexY - 1 + MAP_FRAME[0].yTexture, colorBlue)) {
                        tiledMaps[indexX][indexY] = Game.VALUE_TILE_BLUE_HALF;
                    }
                    else {
                        tiledMaps[indexX][indexY] = Game.VALUE_TILE_RED_HALF;
                    }
                }
                else if (compareColor(indexX + MAP_FRAME[0].xTexture, indexY + MAP_FRAME[0].yTexture, colorGreen)) {
                    if (compareColor(indexX + MAP_FRAME[0].xTexture, indexY + 1 + MAP_FRAME[0].yTexture, colorBlue)) {
                        tiledMaps[indexX][indexY] = Game.VALUE_TILE_BLUE_HALF_B;
                    }
                    else {
                        tiledMaps[indexX][indexY] = Game.VALUE_TILE_RED_HALF_B;
                    }
                }
                else {
                    tiledMaps[indexX][indexY] = Game.VALUE_TILE_NONE;
                }
            }
        }
    }
    function getTile(indexX, indexY) {
        var dataTile = { value: 0, x: 0, y: 0 };
        dataTile.x = Math.floor(indexX) * Game.SIZE_TILE;
        dataTile.y = indexY * Game.SIZE_TILE;
        if (dataTile.y >= Engine.Renderer.ySizeViewIdeal * Game.SIZE_TILE || dataTile.y <= -Game.SIZE_TILE) {
            return null;
        }
        indexValueX = indexX;
        indexValueY = indexY;
        if ((Game.LevelData.previousRule == Game.RULE_VOID && indexX < 0) || indexX >= Game.MAP_WIDTH * 2) {
            if (indexValueY == Game.MAP_HEIGHT - 1) {
                dataTile.value = Game.VALUE_TILE_BLUE;
            }
            else {
                dataTile.value = Game.VALUE_TILE_NONE;
            }
        }
        else {
            if (indexX < 0) {
                //TODO
                indexValueX += Game.MAP_WIDTH;
                findTileIndexValues(Game.LevelData.previousRule, Game.LevelData.previousDifficulty, Game.LevelData.previousMap);
            }
            else if (indexX >= Game.MAP_WIDTH) {
                //TODO
                indexValueX -= Game.MAP_WIDTH;
                findTileIndexValues(Game.LevelData.futureRule, Game.LevelData.futureDifficulty, Game.LevelData.futureMap);
            }
            else {
                findTileIndexValues(Game.LevelData.currentRule, Game.LevelData.currentDifficulty, Game.LevelData.currentMap);
            }
            dataTile.value = tiledMaps[Math.floor(indexValueX)][indexValueY];
        }
        if (dataTile.value != Game.VALUE_TILE_NONE) {
            return dataTile;
        }
        return null;
    }
    function findTileIndexValues(rule, difficulty, map) {
        var x_offset = map;
        if (rule != Game.RULE_NOTHING) {
            indexValueY += (rule * 2 - 1) * Game.MAP_HEIGHT;
            if (difficulty == Game.DIFICULTY_HARD) {
                indexValueY += Game.MAP_HEIGHT;
            }
        }
        indexValueX += x_offset * Game.MAP_WIDTH;
    }
    var FRAMES = null;
    var MAP_FRAME = null;
    Game.addAction("init", function () {
        FRAMES = Game.FrameSelector.complex("LevelMaps a", Game.Resources.texture, 251, 1);
        MAP_FRAME = Game.FrameSelector.complex("LevelMaps b", Game.Resources.texture, 1, 79);
    });
    var LevelMaps = /** @class */ (function () {
        function LevelMaps() {
        }
        LevelMaps.init = function () {
            initColors();
            initMaps();
        };
        LevelMaps.getTile = function (indexX, indexY) {
            return getTile(indexX, indexY);
        };
        return LevelMaps;
    }());
    Game.LevelMaps = LevelMaps;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var STRING_NEXT_RULE = "NEXT RULE:";
    var STRING_RULE_NONE = "NONE";
    var STRING_RULE_FOG = "FOG";
    var STRING_RULE_SPEED_UP = "SPEED UP";
    var STRING_RULE_MEMORY = "MEMORY";
    var STRING_RULE_DOUBLE_JUMP = "EXTRA JUMP IN AIR";
    var STRING_RULE_LAG = "LAG";
    var STRING_RULE_INVISIBLE = "INVISIBLE";
    var STRING_RULE_GRAVITY = "JUMP IN AIR TO SWITCH GRAVITY";
    var spr;
    var nextex;
    var rultex;
    var fra = [];
    var ver = -20;
    var adsspr;
    var adsbut;
    var adstex;
    var adssel = false;
    var conspr;
    var conbut;
    var contex;
    var consel = false;
    var ena = false;
    Game.addAction("init", function () {
        fra = Game.FrameSelector.complex("nexrulfra", Game.Resources.texture, 1, 603);
    });
    function maknexrul() {
        spr = new Engine.Sprite();
        fra[0].applyToSprite(spr);
        spr.pinned = true;
        spr.y = ver - 20;
        nextex = Game.SceneText.createMiddleText(STRING_NEXT_RULE, ver - 8, false);
        nextex.scale = 2;
        rultex = Game.SceneText.createMiddleText(STRING_RULE_NONE, ver + 9, false);
        adsspr = new Engine.Sprite();
        adsspr.enabled = false;
        adsspr.pinned = true;
        fra[1].applyToSprite(adsspr);
        adsbut = new Game.Button(adsspr);
        adsbut.arrows.font = Game.FontManager.a;
        adsbut.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        adsbut.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        adsbut.anchor.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        adsbut.anchor.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        adsbut.anchor.xAligned = 0;
        adsbut.anchor.yAligned = ver + 59.5 - 3 - 25;
        adsbut.arrows.enabled = false;
        adsbut.control.enabled = false;
        adsbut.control.url = " ";
        adsbut.control.onLinkTrigger = function () {
            if (adsbut.control.enabled) {
                //if(adsbut.control.aud!=null)adsbut.control.aud.play();
                Game.Resources.sfxBlipUp.play();
                adsbut.control.enabled = false;
                Game.trinexads();
            }
        };
        adstex = new Utils.Text();
        adstex.font = Game.FontManager.a;
        adstex.str = " ";
        adstex.scale = 1;
        adstex.enabled = adstex.pinned = true;
        adstex.front = false;
        adstex.xAlignView = Utils.AnchorAlignment.MIDDLE;
        adstex.yAlignView = Utils.AnchorAlignment.MIDDLE;
        adstex.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        adstex.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        adstex.xAligned = 0;
        adstex.yAligned = ver + 59.5 - 3 - 25;
        conspr = new Engine.Sprite();
        conspr.enabled = false;
        conspr.pinned = true;
        fra[2].applyToSprite(conspr);
        conbut = new Game.Button(conspr);
        conbut.control.aud = null; //Resources.sfxBlipUp;
        conbut.arrows.font = Game.FontManager.a;
        conbut.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        conbut.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        conbut.anchor.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        conbut.anchor.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        conbut.anchor.xAligned = 0;
        conbut.anchor.yAligned = ver + 59.5 - 3;
        conbut.arrows.enabled = false;
        conbut.control.enabled = false;
        conbut.control.onPressedDelegate = function () {
            ena = false;
        };
        contex = new Utils.Text();
        contex.font = Game.FontManager.a;
        contex.str = " ";
        contex.scale = 1;
        contex.enabled = contex.pinned = true;
        contex.front = false;
        contex.xAlignView = Utils.AnchorAlignment.MIDDLE;
        contex.yAlignView = Utils.AnchorAlignment.MIDDLE;
        contex.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        contex.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
        contex.xAligned = 0;
        contex.yAligned = ver + 59.5 - 3;
    }
    Game.maknexrul = maknexrul;
    Game.trinexads = function () {
        Game.endnexads();
    };
    Game.endnexads = function () {
        adsbut.control.enabled = false;
        adstex.str = "" + (100 * 2 * Game.scoreMultipler()) + " CREDITS OBTAINED!!";
        Game.Resources.sfxBuy.play();
        adsspr.red = 0;
        adsspr.blue = 0;
        adsspr.alpha = 0; //alpdisbut+0.05*2*0;
        for (var _i = 0, _a = adstex.sprites; _i < _a.length; _i++) {
            var spr = _a[_i];
            spr.red = 0;
            spr.blue = 0;
            spr.alpha = 1;
        }
        adstex.yAligned = ver + 59.5 - 3 - 25 - 6 + 2 + 1;
        Game.Player.score += 100 * 2 * Game.scoreMultipler();
        Game.updpoi();
        Game.savpoi();
    };
    Game.fainexads = function () {
        adstex.str = "+" + (100 * 2 * Game.scoreMultipler()) + " CREDITS (AD)";
        //var rew=
        Game.hasrew("nexrul");
        adsspr.enabled = true;
        //adsbut.control.enabled=rew;
        adssel = false;
        /*
        if(rew){
            adsspr.alpha=1;
            for(var spr of adstex.sprites){
                spr.alpha=1;
            }
        }
        else{
            adsspr.alpha=alpdisbut+0.05*2*0;
            for(var spr of adstex.sprites){
                spr.alpha=alpdisbut+0.05*2;
            }
        }
        */
    };
    function enarultex() {
        ena = true;
        setRuleText();
        nextex.enabled = true;
        spr.enabled = true;
    }
    Game.enarultex = enarultex;
    function enarulexptex() {
        rultex.enabled = true;
    }
    Game.enarulexptex = enarulexptex;
    function enanexrulcon() {
        adstex.str = "+" + (100 * 2 * Game.scoreMultipler()) + " CREDITS (AD)";
        //var rew=
        Game.hasrew("nexrul");
        adsspr.enabled = true;
        //adsbut.control.enabled=rew;
        adstex.yAligned = ver + 59.5 - 3 - 25;
        adssel = false;
        /*
        if(rew){
            adsspr.red=1;
            adsspr.blue=1;
            adsspr.alpha=1;
            for(var spr of adstex.sprites){
                spr.red=1;
                spr.blue=1;
                spr.alpha=1;
            }
        }
        else{
            adsspr.red=1;
            adsspr.blue=1;
            adsspr.alpha=alpdisbut+0.05*2*0;
            for(var spr of adstex.sprites){
                spr.red=1;
                spr.blue=1;
                spr.alpha=alpdisbut+0.05*2;
            }
        }
        */
        conspr.enabled = true;
        conbut.control.enabled = true;
        contex.str = "CONTINUE";
        consel = false;
    }
    Game.enanexrulcon = enanexrulcon;
    function enanexrulads() {
        adsbut.control.enabled = true;
        adsspr.red = 1;
        adsspr.blue = 1;
        adsspr.alpha = 1;
        for (var _i = 0, _a = adstex.sprites; _i < _a.length; _i++) {
            var spr = _a[_i];
            spr.red = 1;
            spr.blue = 1;
            spr.alpha = 1;
        }
    }
    Game.enanexrulads = enanexrulads;
    function disnexrulads() {
        adsbut.control.enabled = false;
        adsspr.red = 1;
        adsspr.blue = 1;
        adsspr.alpha = Game.alpdisbut + 0.05 * 2 * 0;
        for (var _i = 0, _a = adstex.sprites; _i < _a.length; _i++) {
            var spr = _a[_i];
            spr.red = 1;
            spr.blue = 1;
            spr.alpha = Game.alpdisbut + 0.05 * 2;
        }
    }
    Game.disnexrulads = disnexrulads;
    function stenexrul() {
        if (adsbut.control.enabled) {
            if (adsbut.control.selected && !adssel) {
                adstex.str = ">+" + (100 * 2 * Game.scoreMultipler()) + " CREDITS (AD)<";
                adssel = true;
                for (var _i = 0, _a = adstex.sprites; _i < _a.length; _i++) {
                    var spr = _a[_i];
                    spr.red = 1;
                    spr.blue = 1;
                }
            }
            else if (!adsbut.control.selected && adssel) {
                adstex.str = "+" + (100 * 2 * Game.scoreMultipler()) + " CREDITS (AD)";
                adssel = false;
            }
        }
        if (conbut.control.selected && !consel) {
            contex.str = ">CONTINUE<";
            consel = true;
        }
        else if (!conbut.control.selected && consel) {
            contex.str = "CONTINUE";
            consel = false;
        }
    }
    Game.stenexrul = stenexrul;
    function dranexrul() {
        spr.render();
        adsspr.render();
        conspr.render();
    }
    Game.dranexrul = dranexrul;
    function exinexrul() {
        adsspr.enabled = false;
        adsbut.control.enabled = false;
        adstex.str = " ";
        adssel = false;
        ena = false;
        nextex.enabled = false;
        rultex.enabled = false;
        spr.enabled = false;
        conspr.enabled = false;
        conbut.control.enabled = false;
        contex.str = " ";
        consel = false;
        Game.triggerActions("playlevelbutton");
        Game.triggerActions("zriststartplay");
    }
    Game.exinexrul = exinexrul;
    function connexrul() {
        return !ena;
    }
    Game.connexrul = connexrul;
    function setRuleText() {
        switch (Game.LevelData.currentRule) {
            case Game.RULE_FOG:
                rultex.str = STRING_RULE_FOG;
                break;
            case Game.RULE_SPEED_UP:
                rultex.str = STRING_RULE_SPEED_UP;
                break;
            case Game.RULE_MEMORY:
                rultex.str = STRING_RULE_MEMORY;
                break;
            case Game.RULE_DOUBLE_JUMP:
                rultex.str = STRING_RULE_DOUBLE_JUMP;
                break;
            case Game.RULE_LAG:
                rultex.str = STRING_RULE_LAG;
                break;
            case Game.RULE_INVISIBILITY:
                rultex.str = STRING_RULE_INVISIBLE;
                break;
            case Game.RULE_GRAVITY:
                rultex.str = STRING_RULE_GRAVITY;
                break;
            default:
                rultex.str = STRING_RULE_NONE;
                break;
        }
    }
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var LevelPhysics = /** @class */ (function (_super) {
        __extends(LevelPhysics, _super);
        function LevelPhysics() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LevelPhysics.init = function () {
            //console.error("TODO");
        };
        return LevelPhysics;
    }(Engine.Entity));
    Game.LevelPhysics = LevelPhysics;
})(Game || (Game = {}));
/*


*/ 
/*

#define STRING_SCORE_DEFAULT "SCORE: 0000000000"
#define STRING_HI_SCORE_DEFAULT "HI: 0000000000"




static void write_generic_text_score(unsigned int is_hi){
    unsigned int score_to_write = is_hi ? hi_score : score;
    char string_score[LENGTH_STRING_SCORE_DEFAULT + 1] = "";
    sprintf(string_score, is_hi ? "HI: %u" : "SCORE: %u", score_to_write);
    disable_canvases(is_hi ? index_canvases_text_hi_score : index_canvases_text_score, get_needed_chars(is_hi ? STRING_HI_SCORE_DEFAULT : STRING_SCORE_DEFAULT));
    //write_text(is_hi ? index_canvases_text_hi_score : index_canvases_text_score, index_texture, string_score, cursor_x + get_half_view_width() - 3000, 3000, 1000, -1, ANCHOR_MIDDLE, ANCHOR_START);
    write_text(is_hi ? index_canvases_text_hi_score : index_canvases_text_score, index_texture, string_score, cursor_x + get_view_width() - 3000, is_hi ? 7000 : 0, 1000, -1, ANCHOR_END, ANCHOR_START);
}

*/ 
var Game;
(function (Game) {
    var ver = -74;
    var spr;
    var fra = null;
    var stabut;
    var delbut;
    var act = false;
    Game.shopau = false;
    function loapoi() {
        var poi = +(Engine.Data.load("dpnt"));
        poi = isNaN(poi) ? 0 : poi;
        return poi;
    }
    Game.loapoi = loapoi;
    function savpoi() {
        Engine.Data.save("dpnt", Game.Player.score, 60);
    }
    Game.savpoi = savpoi;
    Game.addAction("init", function () {
        Game.inioutsho();
        Game.initersho();
        fra = Game.FrameSelector.complex("shosta", Game.Resources.texture, 573, 306);
        spr = new Engine.Sprite();
        Game.FrameSelector.complex("sho", Game.Resources.texture, 1, 359)[0].applyToSprite(spr);
        spr.enabled = false;
        spr.pinned = true;
        spr.y = ver;
    });
    function maksho() {
        Game.makoutsho();
        Game.maktersho();
        var spr = new Engine.Sprite();
        fra[0].applyToSprite(spr);
        spr.enabled = spr.pinned = true;
        stabut = new Game.Button(spr);
        stabut.control.aud = null; //Resources.sfxBlipUp;
        stabut.arrows.font = Game.FontManager.a;
        stabut.arrows.xOffset = -27 - 29 - 3;
        stabut.arrows.yOffset = 8;
        stabut.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        stabut.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        stabut.anchor.xAlignBounds = Utils.AnchorAlignment.END;
        stabut.anchor.yAlignBounds = Utils.AnchorAlignment.END;
        stabut.anchor.xAligned = 104;
        stabut.anchor.yAligned = 86;
        stabut.control.enabled = false;
        stabut.bounds.alpha = 0;
        stabut.control.onPressedDelegate = function () { act = false; };
        spr = new Engine.Sprite();
        fra[1].applyToSprite(spr);
        spr.enabled = spr.pinned = true;
        delbut = new Game.Button(spr);
        delbut.control.aud = Game.Resources.sfxBlipDown;
        delbut.arrows.font = Game.FontManager.a;
        delbut.arrows.arrowLeft.sprites[0].green = 0;
        delbut.arrows.arrowLeft.sprites[0].blue = 0;
        delbut.arrows.arrowRight.sprites[0].green = 0;
        delbut.arrows.arrowRight.sprites[0].blue = 0;
        delbut.arrows.xOffset = -27 + 19;
        delbut.arrows.yOffset = 8;
        delbut.anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        delbut.anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        delbut.anchor.xAlignBounds = Utils.AnchorAlignment.START;
        delbut.anchor.yAlignBounds = Utils.AnchorAlignment.END;
        delbut.anchor.xAligned = -104;
        delbut.anchor.yAligned = 86;
        delbut.control.enabled = false;
        delbut.bounds.alpha = 0;
        delbut.control.onPressedDelegate = function () {
            Game.shopau = true;
            Game.pauoutsho();
            Game.pautersho();
            stabut.control.enabled = false;
            delbut.control.enabled = false;
            Game.enaresgui();
        };
        Game.makresgui();
        //entsho();
    }
    Game.maksho = maksho;
    function fixsho() {
        Game.fixoutsho();
        Game.fixtersho();
        timsho();
    }
    Game.fixsho = fixsho;
    function deldat() {
        Game.Player.score = 0;
        savpoi();
        Game.delscrdat();
        Game.deloutdat();
        Game.delterdat();
        Game.updpoi();
        fixsho();
    }
    Game.deldat = deldat;
    function consho() {
        Game.shopau = false;
        Game.conoutsho();
        Game.contersho();
        stabut.control.enabled = true;
        delbut.control.enabled = true;
    }
    Game.consho = consho;
    function entsho() {
        spr.enabled = true;
        stabut.control.enabled = true;
        stabut.bounds.alpha = 1;
        delbut.control.enabled = true;
        delbut.bounds.alpha = 1;
        fixsho();
        act = true;
        Game.triggerActions("zristshop");
    }
    Game.entsho = entsho;
    function timsho() {
        if (Game.shopau)
            return;
        Game.timoutsho();
        Game.timtersho();
    }
    Game.timsho = timsho;
    function exisho() {
        Game.exioutsho();
        Game.exitersho();
        spr.enabled = false;
        stabut.bounds.alpha = 0;
        stabut.control.enabled = false;
        delbut.bounds.alpha = 0;
        delbut.control.enabled = false;
        Game.triggerActions("zristexitshop");
    }
    Game.exisho = exisho;
    function linsho() {
        return !act;
    }
    Game.linsho = linsho;
    function drasho() {
        spr.render();
    }
    Game.drasho = drasho;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var pri = [0, 0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 9999];
    var curtok = "curout";
    var owntok = "ownout";
    Game.curout = 0;
    var fra = null;
    var but = [];
    var tex = [];
    var hor = -40 - 53 - 5 - 2;
    var ver = -38 - 6 + 3;
    var horsep = 34;
    var versep = 37;
    var own = [true, true, false, false, false, false, false, false, false, false, false, false];
    var sta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    function inioutsho() {
        fra = Game.FrameSelector.complex("shochabut", Game.Resources.texture, 218, 359);
        Game.curout = +(Engine.Data.load(curtok));
        Game.curout = isNaN(Game.curout) ? 0 : Game.curout;
        for (var i = 2; i < 12; i++) {
            var val = +(Engine.Data.load(owntok + i));
            val = isNaN(val) ? 0 : val;
            own[i] = val != 0;
        }
    }
    Game.inioutsho = inioutsho;
    function deloutdat() {
        Game.curter = 0;
        Engine.Data.save(curtok, Game.curter, 60);
        for (var i = 2; i < 12; i++) {
            own[i] = false;
            Engine.Data.save(owntok + i, 0, 60);
        }
    }
    Game.deloutdat = deloutdat;
    function makoutsho() {
        for (var x = 0; x < 6; x++)
            for (var y = 0; y < 2; y++) {
                var i = x + y * 6;
                var spr = new Engine.Sprite();
                fra[i].applyToSprite(spr);
                spr.enabled = spr.pinned = true;
                but[i] = new Game.Button(spr);
                but[i].control.aud = null;
                but[i].ind = i;
                but[i].anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
                but[i].anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
                but[i].anchor.xAlignBounds = Utils.AnchorAlignment.START;
                but[i].anchor.yAlignBounds = Utils.AnchorAlignment.END;
                but[i].anchor.xAligned = hor + horsep * x;
                but[i].anchor.yAligned = ver + versep * y;
                but[i].arrows.enabled = false;
                but[i].control.enabled = false;
                but[i].bounds.alpha = 0;
                but[i].control.onPressedDelegate = function () {
                    tex[Game.curout].str = "-";
                    Game.curout = this.ind;
                    tex[Game.curout].str = "^";
                    Engine.Data.save(curtok, Game.curout, 60);
                    if (!own[Game.curout]) {
                        Game.Player.score -= pri[Game.curout];
                        Game.updpoi();
                        own[Game.curout] = true;
                        Engine.Data.save(owntok + Game.curout, 1, 60);
                        Game.savpoi();
                        Game.triggerActions("savegame");
                        Game.fixsho();
                        Game.Resources.sfxBuy.play();
                    }
                    else {
                        Game.Resources.sfxBlip.play();
                    }
                };
                tex[i] = new Utils.Text();
                tex[i].font = Game.FontManager.a;
                tex[i].scale = 1;
                tex[i].enabled = tex[i].pinned = true;
                tex[i].front = false;
                tex[i].xAlignView = Utils.AnchorAlignment.MIDDLE;
                tex[i].yAlignView = Utils.AnchorAlignment.MIDDLE;
                tex[i].xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                tex[i].yAlignBounds = Utils.AnchorAlignment.START;
                tex[i].xAligned = hor + 15 + 34 * x * 1;
                tex[i].yAligned = ver - 9 + 37 * y * 1;
            }
    }
    Game.makoutsho = makoutsho;
    function fixoutsho() {
        for (var x = 0; x < 6; x++)
            for (var y = 0; y < 2; y++) {
                var i = x + y * 6;
                but[i].bounds.alpha = 1;
                fra[i].applyToSprite(but[i].bounds);
                but[i].control.enabled = own[i] || (pri[i] <= Game.Player.score);
                tex[i].str = own[i] ? (Game.curout == i ? "^" : "-") : pri[i] + "";
                sta[i] = 0;
            }
    }
    Game.fixoutsho = fixoutsho;
    function pauoutsho() {
        for (var i = 0; i < 12; i++)
            but[i].control.enabled = false;
    }
    Game.pauoutsho = pauoutsho;
    function conoutsho() {
        fixoutsho();
    }
    Game.conoutsho = conoutsho;
    function timoutsho() {
        for (var x = 0; x < 6; x++)
            for (var y = 0; y < 2; y++) {
                var i = x + y * 6;
                var spr = but[i].bounds;
                if (Game.curout == i) {
                    if (sta[i] != 1) {
                        fra[i].applyToSprite(spr);
                        but[i].bounds.red = 1;
                        but[i].bounds.green = 1;
                        but[i].bounds.blue = 1;
                        but[i].bounds.alpha = 1;
                        for (var _i = 0, _a = tex[i].sprites; _i < _a.length; _i++) {
                            var spr = _a[_i];
                            spr.red = 1;
                            spr.green = 1;
                            spr.blue = 1;
                            spr.alpha = 1;
                        }
                        sta[i] = 1;
                    }
                }
                else if (but[i].control.selected) {
                    if (sta[i] != 2) {
                        fra[i].applyToSprite(spr);
                        but[i].bounds.red = 1;
                        but[i].bounds.green = 1;
                        but[i].bounds.blue = 1;
                        but[i].bounds.alpha = 1;
                        for (var _b = 0, _c = tex[i].sprites; _b < _c.length; _b++) {
                            var spr = _c[_b];
                            spr.red = 1;
                            spr.green = 1;
                            spr.blue = 1;
                            spr.alpha = 1;
                        }
                        sta[i] = 2;
                    }
                }
                else if (but[i].control.enabled && !but[i].control.selected) {
                    if (sta[i] != 3) {
                        fra[i + 12].applyToSprite(spr);
                        if (own[i]) {
                            but[i].bounds.red = 1;
                            but[i].bounds.green = 1;
                            but[i].bounds.blue = 1;
                            but[i].bounds.alpha = 1;
                            for (var _d = 0, _e = tex[i].sprites; _d < _e.length; _d++) {
                                var spr = _e[_d];
                                spr.red = 1;
                                spr.green = 1;
                                spr.blue = 1;
                                spr.alpha = 1;
                            }
                        }
                        else {
                            but[i].bounds.red = 0;
                            but[i].bounds.green = 1;
                            but[i].bounds.blue = 0;
                            but[i].bounds.alpha = 1;
                            for (var _f = 0, _g = tex[i].sprites; _f < _g.length; _f++) {
                                var spr = _g[_f];
                                spr.red = 0;
                                spr.green = 1;
                                spr.blue = 0;
                                spr.alpha = 1;
                            }
                        }
                        sta[i] = 3;
                    }
                }
                else if (!but[i].control.enabled) {
                    if (sta[i] != 4) {
                        fra[i + 24].applyToSprite(spr);
                        but[i].bounds.red = 0.25;
                        but[i].bounds.green = 0.25;
                        but[i].bounds.blue = 0.25;
                        but[i].bounds.alpha = 1;
                        for (var _h = 0, _j = tex[i].sprites; _h < _j.length; _h++) {
                            var spr = _j[_h];
                            spr.red = 0.75;
                            spr.green = 0.75;
                            spr.blue = 0.75;
                            spr.alpha = 1;
                        }
                        sta[i] = 4;
                    }
                }
            }
    }
    Game.timoutsho = timoutsho;
    function exioutsho() {
        for (var x = 0; x < 6; x++)
            for (var y = 0; y < 2; y++) {
                var i = x + y * 6;
                but[i].bounds.alpha = 0;
                but[i].control.enabled = false;
                tex[i].str = "";
            }
    }
    Game.exioutsho = exioutsho;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var fra;
    var spr = [];
    var but = [];
    var sel = [false, false];
    var ver = 10 - 6;
    Game.addAction("init", function () {
        fra = Game.FrameSelector.complex("resgui", Game.Resources.texture, 853, 256);
    });
    function makresgui() {
        spr[0] = new Engine.Sprite();
        spr[0].enabled = false;
        spr[0].pinned = true;
        spr[0].alpha = 0.95;
        fra[5].applyToSprite(spr[0]);
        spr[1] = new Engine.Sprite();
        spr[1].enabled = false;
        spr[1].pinned = true;
        spr[1].y = ver;
        fra[0].applyToSprite(spr[1]);
        spr[2] = new Engine.Sprite();
        spr[2].enabled = false;
        spr[2].pinned = true;
        fra[1].applyToSprite(spr[2]);
        but[0] = new Game.Button(spr[2]);
        but[0].arrows.font = Game.FontManager.a;
        but[0].anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        but[0].anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        but[0].anchor.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        but[0].anchor.yAlignBounds = Utils.AnchorAlignment.START;
        but[0].anchor.xAligned = 0;
        but[0].anchor.yAligned = ver + 33 - 3 - 1.5;
        but[0].arrows.enabled = false;
        but[0].control.enabled = false;
        but[0].control.onPressedDelegate = exi;
        spr[3] = new Engine.Sprite();
        spr[3].enabled = false;
        spr[3].pinned = true;
        fra[3].applyToSprite(spr[3]);
        but[1] = new Game.Button(spr[3]);
        but[1].control.aud = Game.Resources.sfxBlipDown;
        but[1].arrows.font = Game.FontManager.a;
        but[1].anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
        but[1].anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
        but[1].anchor.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
        but[1].anchor.yAlignBounds = Utils.AnchorAlignment.START;
        but[1].anchor.xAligned = 0;
        but[1].anchor.yAligned = ver + 33 - 3 - 1.5 - 30 - 1;
        but[1].arrows.enabled = false;
        but[1].control.enabled = false;
        but[1].control.onPressedDelegate = function () {
            Game.deldat();
            exi();
        };
        Engine.System.addListenersFrom(resgui);
    }
    Game.makresgui = makresgui;
    function enaresgui() {
        spr[0].enabled = true;
        spr[1].enabled = true;
        spr[2].enabled = true;
        spr[3].enabled = true;
        but[0].control.enabled = true;
        but[1].control.enabled = true;
        sel[0] = false;
        sel[1] = false;
        fra[1].applyToSprite(spr[2]);
        fra[3].applyToSprite(spr[3]);
        resgui.onTimeUpdate();
        resgui.onViewUpdate();
    }
    Game.enaresgui = enaresgui;
    function exi() {
        spr[0].enabled = false;
        spr[1].enabled = false;
        spr[2].enabled = false;
        spr[3].enabled = false;
        but[0].control.enabled = false;
        but[1].control.enabled = false;
        sel[0] = false;
        sel[1] = false;
        Game.consho();
    }
    var resgui;
    (function (resgui) {
        resgui.owner = null;
        resgui.preserved = false;
        function onViewUpdate() {
            spr[0].xSize = Engine.Renderer.xSizeView + 10;
            spr[0].ySize = Engine.Renderer.ySizeView + 10;
            spr[0].xOffset = -spr[0].xSize * 0.5;
            spr[0].yOffset = -spr[0].ySize * 0.5;
        }
        resgui.onViewUpdate = onViewUpdate;
        function onTimeUpdate() {
            if (spr[0].enabled) {
                if (but[0].control.selected && !sel[0]) {
                    fra[2].applyToSprite(spr[2]);
                    sel[0] = true;
                }
                else if (!but[0].control.selected && sel[0]) {
                    fra[1].applyToSprite(spr[2]);
                    sel[0] = false;
                }
                if (but[1].control.selected && !sel[1]) {
                    fra[4].applyToSprite(spr[3]);
                    sel[1] = true;
                }
                else if (!but[1].control.selected && sel[1]) {
                    fra[3].applyToSprite(spr[3]);
                    sel[1] = false;
                }
            }
        }
        resgui.onTimeUpdate = onTimeUpdate;
        function onDrawObjectsAfterUI() {
            spr[0].render();
            spr[1].render();
            spr[2].render();
            spr[3].render();
        }
        resgui.onDrawObjectsAfterUI = onDrawObjectsAfterUI;
    })(resgui = Game.resgui || (Game.resgui = {}));
})(Game || (Game = {}));
var Game;
(function (Game) {
    var pri = [0, 0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5999];
    var curtok = "curter";
    var owntok = "ownter";
    Game.curter = 0;
    var fra = null;
    var but = [];
    var tex = [];
    var hor = -40 - 53 - 5 - 2;
    var ver = -38 - 6 + 3 + 20 + 80 - 30 + 1;
    var horsep = 34;
    var versep = 37 - 5 - 4;
    var own = [true, true, false, false, false, false, false, false, false, false, false, false];
    var sta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    function initersho() {
        fra = Game.FrameSelector.complex("shoterbut", Game.Resources.texture, 218, 493);
        Game.curter = +(Engine.Data.load(curtok));
        Game.curter = isNaN(Game.curter) ? 0 : Game.curter;
        for (var i = 2; i < 12; i++) {
            var val = +(Engine.Data.load(owntok + i));
            val = isNaN(val) ? 0 : val;
            own[i] = val != 0;
        }
    }
    Game.initersho = initersho;
    function delterdat() {
        Game.curout = 0;
        Engine.Data.save(curtok, Game.curout, 60);
        for (var i = 2; i < 12; i++) {
            own[i] = false;
            Engine.Data.save(owntok + i, 0, 60);
        }
    }
    Game.delterdat = delterdat;
    function maktersho() {
        for (var x = 0; x < 6; x++)
            for (var y = 0; y < 2; y++) {
                var i = x + y * 6;
                var spr = new Engine.Sprite();
                fra[i].applyToSprite(spr);
                spr.enabled = spr.pinned = true;
                but[i] = new Game.Button(spr);
                but[i].control.aud = null;
                but[i].ind = i;
                but[i].anchor.xAlignView = Utils.AnchorAlignment.MIDDLE;
                but[i].anchor.yAlignView = Utils.AnchorAlignment.MIDDLE;
                but[i].anchor.xAlignBounds = Utils.AnchorAlignment.START;
                but[i].anchor.yAlignBounds = Utils.AnchorAlignment.END;
                but[i].anchor.xAligned = hor + horsep * x;
                but[i].anchor.yAligned = ver + versep * y;
                but[i].arrows.enabled = false;
                but[i].control.enabled = false;
                but[i].bounds.alpha = 0;
                but[i].control.onPressedDelegate = function () {
                    tex[Game.curter].str = "-";
                    Game.curter = this.ind;
                    tex[Game.curter].str = "^";
                    Engine.Data.save(curtok, Game.curter, 60);
                    if (!own[Game.curter]) {
                        Game.Player.score -= pri[Game.curter];
                        Game.updpoi();
                        own[Game.curter] = true;
                        Engine.Data.save(owntok + Game.curter, 1, 60);
                        Game.savpoi();
                        Game.triggerActions("savegame");
                        Game.fixsho();
                        Game.Resources.sfxBuy.play();
                    }
                    else {
                        Game.Resources.sfxBlip.play();
                    }
                };
                tex[i] = new Utils.Text();
                tex[i].font = Game.FontManager.a;
                tex[i].scale = 1;
                tex[i].enabled = tex[i].pinned = true;
                tex[i].front = false;
                tex[i].xAlignView = Utils.AnchorAlignment.MIDDLE;
                tex[i].yAlignView = Utils.AnchorAlignment.MIDDLE;
                tex[i].xAlignBounds = Utils.AnchorAlignment.MIDDLE;
                tex[i].yAlignBounds = Utils.AnchorAlignment.START;
                tex[i].xAligned = hor + 15 + 34 * x * 1;
                tex[i].yAligned = ver - 9 + (37 - 5 - 4) * y * 1;
            }
    }
    Game.maktersho = maktersho;
    function fixtersho() {
        for (var x = 0; x < 6; x++)
            for (var y = 0; y < 2; y++) {
                var i = x + y * 6;
                but[i].bounds.alpha = 1;
                fra[i].applyToSprite(but[i].bounds);
                but[i].control.enabled = own[i] || (pri[i] <= Game.Player.score);
                tex[i].str = own[i] ? (Game.curter == i ? "^" : "-") : pri[i] + "";
                sta[i] = 0;
            }
    }
    Game.fixtersho = fixtersho;
    function pautersho() {
        for (var i = 0; i < 12; i++)
            but[i].control.enabled = false;
    }
    Game.pautersho = pautersho;
    function contersho() {
        fixtersho();
    }
    Game.contersho = contersho;
    function timtersho() {
        for (var x = 0; x < 6; x++)
            for (var y = 0; y < 2; y++) {
                var i = x + y * 6;
                var spr = but[i].bounds;
                if (Game.curter == i) {
                    if (sta[i] != 1) {
                        fra[i].applyToSprite(spr);
                        but[i].bounds.red = 1;
                        but[i].bounds.green = 1;
                        but[i].bounds.blue = 1;
                        but[i].bounds.alpha = 1;
                        for (var _i = 0, _a = tex[i].sprites; _i < _a.length; _i++) {
                            var spr = _a[_i];
                            spr.red = 1;
                            spr.green = 1;
                            spr.blue = 1;
                            spr.alpha = 1;
                        }
                        sta[i] = 1;
                    }
                }
                else if (but[i].control.selected) {
                    if (sta[i] != 2) {
                        fra[i].applyToSprite(spr);
                        but[i].bounds.red = 1;
                        but[i].bounds.green = 1;
                        but[i].bounds.blue = 1;
                        but[i].bounds.alpha = 1;
                        for (var _b = 0, _c = tex[i].sprites; _b < _c.length; _b++) {
                            var spr = _c[_b];
                            spr.red = 1;
                            spr.green = 1;
                            spr.blue = 1;
                            spr.alpha = 1;
                        }
                        sta[i] = 2;
                    }
                }
                else if (but[i].control.enabled && !but[i].control.selected) {
                    if (sta[i] != 3) {
                        fra[i + 12].applyToSprite(spr);
                        if (own[i]) {
                            but[i].bounds.red = 1;
                            but[i].bounds.green = 1;
                            but[i].bounds.blue = 1;
                            but[i].bounds.alpha = 1;
                            for (var _d = 0, _e = tex[i].sprites; _d < _e.length; _d++) {
                                var spr = _e[_d];
                                spr.red = 1;
                                spr.green = 1;
                                spr.blue = 1;
                                spr.alpha = 1;
                            }
                        }
                        else {
                            but[i].bounds.red = 0;
                            but[i].bounds.green = 1;
                            but[i].bounds.blue = 0;
                            but[i].bounds.alpha = 1;
                            for (var _f = 0, _g = tex[i].sprites; _f < _g.length; _f++) {
                                var spr = _g[_f];
                                spr.red = 0;
                                spr.green = 1;
                                spr.blue = 0;
                                spr.alpha = 1;
                            }
                        }
                        sta[i] = 3;
                    }
                }
                else if (!but[i].control.enabled) {
                    if (sta[i] != 4) {
                        fra[i + 24].applyToSprite(spr);
                        but[i].bounds.red = 0.25;
                        but[i].bounds.green = 0.25;
                        but[i].bounds.blue = 0.25;
                        but[i].bounds.alpha = 1;
                        for (var _h = 0, _j = tex[i].sprites; _h < _j.length; _h++) {
                            var spr = _j[_h];
                            spr.red = 0.75;
                            spr.green = 0.75;
                            spr.blue = 0.75;
                            spr.alpha = 1;
                        }
                        sta[i] = 4;
                    }
                }
            }
    }
    Game.timtersho = timtersho;
    function exitersho() {
        for (var x = 0; x < 6; x++)
            for (var y = 0; y < 2; y++) {
                var i = x + y * 6;
                but[i].bounds.alpha = 0;
                but[i].control.enabled = false;
                tex[i].str = "";
            }
    }
    Game.exitersho = exitersho;
})(Game || (Game = {}));
///<reference path="../../System/Scene/Scene.ts"/>
var Game;
(function (Game) {
    var X_LOADING_START = -80 + 59 + 0.5;
    var X_LOADING_PRESS = -42 + 2;
    var X_LOADING_COMPLETE = -34 + 1;
    var Y_LOADING = -60 + 54 - 3;
    var STEPS_DOTS = 20;
    var STEPS_BLINK_TEXT = 40;
    var STEPS_NEXT = 120;
    var CLEAR_RED = 0;
    var CLEAR_GREEN = 0;
    var CLEAR_BLUE = 0;
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
            Game.triggerActions("zristpreloaderbutton");
            _this.control = new Game.Control();
            _this.control.enabled = true;
            _this.control.freezeable = true;
            _this.control.newInteractionRequired = true;
            _this.control.useMouse = true;
            _this.control.mouseButtons = [0];
            _this.control.useTouch = true;
            _this.bar = new Game.PreloaderBar(3 - 3);
            Game.SceneColors.clearColor(CLEAR_RED, CLEAR_GREEN, CLEAR_BLUE);
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
                _this.count += 1;
                Game.triggerActions("onpreloading");
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
                _this.text.enabled = true;
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
            wait.addLink(next, function () { return _this.count >= STEPS_NEXT; });
            next.onEnter = function () {
                //triggerActions("preloadchangecolor");
                Engine.System.nextSceneClass = Game.PreloadEnd;
            };
            var machine = new Game.StateMachine(this);
            machine.stoppable = false;
            machine.startState = loading;
        };
        Preloader.canFinish = true;
        return Preloader;
    }(Game.Scene));
    Game.Preloader = Preloader;
})(Game || (Game = {}));
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    Game.MAX = 0.3;
    Game.LOAD_VELOCITY = 1.0;
    var PreloaderBar = /** @class */ (function (_super) {
        __extends(PreloaderBar, _super);
        function PreloaderBar(y) {
            var _this = _super.call(this) || this;
            _this.loadCount = 0;
            //if(startingSceneClass != Credits){
            //LOAD_VELOCITY *= 60000;
            //}
            _this.border = new Engine.Sprite();
            _this.border.enabled = true;
            _this.border.pinned = true;
            FRAMES[0].applyToSprite(_this.border);
            _this.anchorBorder = new Utils.Anchor();
            _this.anchorBorder.bounds = _this.border;
            _this.anchorBorder.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            _this.anchorBorder.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.anchorBorder.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchorBorder.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.anchorBorder.xAligned = 0;
            _this.anchorBorder.yAligned = y;
            _this.fill = new Engine.Sprite();
            _this.fill.enabled = true;
            _this.fill.pinned = true;
            FRAMES[1].applyToSprite(_this.fill);
            _this.fill.xMirror = true;
            _this.anchorFill = new Utils.Anchor();
            _this.anchorFill.bounds = _this.fill;
            _this.anchorFill.xAlignBounds = Utils.AnchorAlignment.START;
            _this.anchorFill.xAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.anchorFill.yAlignBounds = Utils.AnchorAlignment.START;
            _this.anchorFill.yAlignView = Utils.AnchorAlignment.MIDDLE;
            _this.anchorFill.xAligned = _this.fill.xSize * 0.5;
            _this.anchorFill.yAligned = y;
            _this.loadSize = _this.border.xSize;
            return _this;
        }
        Object.defineProperty(PreloaderBar.prototype, "full", {
            get: function () {
                return this.fill.xSize == 0;
            },
            enumerable: false,
            configurable: true
        });
        PreloaderBar.prototype.onStepUpdate = function () {
            var max = Game.MAX;
            if (max < Engine.Assets.downloadedRatio) {
                max = Engine.Assets.downloadedRatio;
            }
            max *= this.loadSize;
            this.loadCount += Game.LOAD_VELOCITY;
            if (this.loadCount > max) {
                this.loadCount = max;
            }
            this.fill.xSize = this.loadSize - Math.floor(this.loadCount);
        };
        PreloaderBar.prototype.onDrawDialogs = function () {
            this.fill.render();
            this.border.render();
        };
        return PreloaderBar;
    }(Engine.Entity));
    Game.PreloaderBar = PreloaderBar;
    var FRAMES = null;
    Game.addAction("init", function () {
        FRAMES = Game.FrameSelector.complex("PreloaderBar", Game.Resources.texture, 1, 1);
    });
})(Game || (Game = {}));
///<reference path="../../../Engine/Scene.ts"/>
var Game;
(function (Game) {
    var PreloadStart = /** @class */ (function (_super) {
        __extends(PreloadStart, _super);
        function PreloadStart() {
            var _this = _super.call(this) || this;
            Game.triggerActions("pathconfigure");
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
        FontManager.createFonts = function () {
            FontManager.a = new Utils.Font();
            FontManager.a.setFull(Game.Resources.texture, 95, 1, -1);
        };
        return FontManager;
    }());
    Game.FontManager = FontManager;
    Game.addAction("init", function () {
        FontManager.createFonts();
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
    Game.PATH_ROOT_RESOURCES = "";
    var PATH_BGM;
    var PATH_SFX_EVENT;
    var PATH_SFX_SLIDE;
    var PATH_SFX_DEAD;
    var PATH_SFX_JUMP;
    var PATH_SFX_BLIP;
    var PATH_SFX_BUY;
    var PATH_SFX_BLIP_UP;
    var PATH_SFX_BLIP_DOWN;
    var PATH_SFX_GRAVITY_JUMP;
    var PATH_TEXTURE_GRAPHICS;
    var PATH_GOOGLE_PLAY_LOGO;
    Game.addAction("pathconfigure", function () {
        PATH_BGM = Game.PATH_ROOT_RESOURCES + "Assets/Audio/Theme.omw";
        PATH_SFX_EVENT = Game.PATH_ROOT_RESOURCES + "Assets/Audio/Event.wom";
        PATH_SFX_SLIDE = Game.PATH_ROOT_RESOURCES + "Assets/Audio/Slide.wom";
        PATH_SFX_DEAD = Game.PATH_ROOT_RESOURCES + "Assets/Audio/Dead.wom";
        PATH_SFX_JUMP = Game.PATH_ROOT_RESOURCES + "Assets/Audio/Jump.wom";
        PATH_SFX_BLIP = Game.PATH_ROOT_RESOURCES + "Assets/Audio/butext.wom";
        PATH_SFX_BLIP_UP = Game.PATH_ROOT_RESOURCES + "Assets/Audio/butesp.wom";
        PATH_SFX_BLIP_DOWN = Game.PATH_ROOT_RESOURCES + "Assets/Audio/butalt.wom";
        PATH_SFX_BUY = Game.PATH_ROOT_RESOURCES + "Assets/Audio/coi.wom";
        PATH_SFX_GRAVITY_JUMP = Game.PATH_ROOT_RESOURCES + "Assets/Audio/GravityJump.wom";
        PATH_TEXTURE_GRAPHICS = Game.PATH_ROOT_RESOURCES + "Assets/Graphics/Main.png";
        PATH_GOOGLE_PLAY_LOGO = Game.PATH_ROOT_RESOURCES + "Assets/Graphics/google-play-badge.png";
        Game.addPath("preload", Resources.PATH_FRAMES);
        Game.addPath("preload", PATH_TEXTURE_GRAPHICS);
        Game.addPath("load", PATH_BGM);
        Game.addPath("load", PATH_SFX_EVENT);
        Game.addPath("load", PATH_SFX_SLIDE);
        Game.addPath("load", PATH_SFX_DEAD);
        Game.addPath("load", PATH_SFX_JUMP);
        Game.addPath("load", PATH_SFX_BUY);
        Game.addPath("load", PATH_SFX_GRAVITY_JUMP);
        Game.addPath("preload", PATH_SFX_BLIP);
        Game.addPath("preload", PATH_SFX_BLIP_UP);
        Game.addPath("preload", PATH_SFX_BLIP_DOWN);
    });
    var Resources = /** @class */ (function () {
        function Resources() {
        }
        Resources.playBGM = function () {
            if (!Resources.bgmPlayed) {
                Resources.bgm.autoplay();
                Resources.bgmPlayed = true;
            }
        };
        Resources.PATH_FRAMES = "Assets/Graphics/frames.json";
        Resources.bgmPlayed = false;
        Resources.bgmVolumeTracker = 1;
        return Resources;
    }());
    Game.Resources = Resources;
    Game.addAction("preinit", function () {
        Resources.texture = new Engine.Texture(PATH_TEXTURE_GRAPHICS, true, false);
        Resources.texture.preserved = true;
        if (Game.HAS_LINKS && Game.HAS_GOOGLE_PLAY_LOGOS) {
            Game.addPath("load", PATH_GOOGLE_PLAY_LOGO);
        }
    });
    Game.addAction("preinit", function () {
        Resources.sfxBlip = new Engine.AudioPlayer(PATH_SFX_BLIP);
        Resources.sfxBlip.preserved = true;
        Resources.sfxBlip.volume = Resources.sfxBlip.restoreVolume = 2.4;
        Game.sfxs.push(Resources.sfxBlip);
        Game.Control.defaud = Resources.sfxBlip;
        Resources.sfxBlipUp = Resources.sfxBlip;
        /*
        Resources.sfxBlipUp = new Engine.AudioPlayer(PATH_SFX_BLIP_UP);
        Resources.sfxBlipUp.preserved = true;
        Resources.sfxBlipUp.volume = Resources.sfxBlipUp.restoreVolume = 2.3;
        sfxs.push(Resources.sfxBlipUp);
        */
        Resources.sfxBlipDown = new Engine.AudioPlayer(PATH_SFX_BLIP_DOWN);
        Resources.sfxBlipDown.preserved = true;
        Resources.sfxBlipDown.volume = Resources.sfxBlipDown.restoreVolume = 2.50;
        Game.sfxs.push(Resources.sfxBlipDown);
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
            Resources.bgm.loopEnd = 130;
        }
        else if (Engine.AudioManager.mode == Engine.AudioManagerMode.WEB) {
            Resources.bgm.loopStart = 12.8;
            Resources.bgm.loopEnd = 128;
        }
        Game.bgms.push(Resources.bgm);
        Resources.sfxEvent = new Engine.AudioPlayer(PATH_SFX_EVENT);
        Resources.sfxEvent.preserved = true;
        Resources.sfxEvent.volume = Resources.sfxEvent.restoreVolume = 1;
        Game.sfxs.push(Resources.sfxEvent);
        Resources.sfxSlide = new Engine.AudioPlayer(PATH_SFX_SLIDE);
        Resources.sfxSlide.preserved = true;
        Resources.sfxSlide.volume = Resources.sfxSlide.restoreVolume = 1;
        Game.sfxs.push(Resources.sfxSlide);
        Resources.sfxDead = new Engine.AudioPlayer(PATH_SFX_DEAD);
        Resources.sfxDead.preserved = true;
        Resources.sfxDead.volume = Resources.sfxDead.restoreVolume = 1;
        Game.sfxs.push(Resources.sfxDead);
        Resources.sfxJump = new Engine.AudioPlayer(PATH_SFX_JUMP);
        Resources.sfxJump.preserved = true;
        Resources.sfxJump.volume = Resources.sfxJump.restoreVolume = 1;
        Game.sfxs.push(Resources.sfxJump);
        Resources.sfxGravityJump = new Engine.AudioPlayer(PATH_SFX_GRAVITY_JUMP);
        Resources.sfxGravityJump.preserved = true;
        Resources.sfxGravityJump.volume = Resources.sfxGravityJump.restoreVolume = 1;
        Game.sfxs.push(Resources.sfxGravityJump);
        Resources.sfxBuy = new Engine.AudioPlayer(PATH_SFX_BUY);
        Resources.sfxBuy.preserved = true;
        Resources.sfxBuy.volume = Resources.sfxBuy.restoreVolume = 2.4;
        Game.sfxs.push(Resources.sfxBuy);
        if (Resources.bgmVolumeTracker < 1) {
            Game.muteAll();
        }
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
            this._currentState = null;
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
///<reference path="../../../Engine/Entity.ts"/>
var Game;
(function (Game) {
    var SceneColors = /** @class */ (function (_super) {
        __extends(SceneColors, _super);
        function SceneColors() {
            return _super.call(this) || this;
        }
        SceneColors.init = function () {
            new SceneColors();
        };
        SceneColors.clearColor = function (red, green, blue) {
            Engine.Renderer.clearColor(red / 255, green / 255, blue / 255);
        };
        SceneColors.prototype.onDrawSceneFill = function () {
        };
        SceneColors.prototype.onClearScene = function () {
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
            _this.sprite = new Engine.Sprite();
            _this.sprite.enabled = true;
            _this.sprite.pinned = true;
            _this.sprite.setRGBA(_this.red, _this.green, _this.blue, 1);
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
                else if (this.direction > 0 && this.alpha >= 1) {
                    this.direction = 0;
                    this.alpha = 1;
                    this.sprite.setRGBA(this.red, this.green, this.blue, 1);
                }
            }
        };
        Fade.prototype.onDrawFade = function () {
            if (this.direction != 0) {
                var extAlpha = this.alpha + this.speed * this.direction * Engine.System.stepExtrapolation;
                if (this.direction < 0 && extAlpha < 0) {
                    extAlpha = 0;
                }
                else if (this.direction > 0 && extAlpha > 1) {
                    extAlpha = 1;
                }
                this.sprite.setRGBA(this.red, this.green, this.blue, extAlpha);
            }
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
        SceneFade.init = function () {
            instance = instance || new SceneFade();
            instance.preserved = true;
            instance.red = 0;
            instance.green = 0;
            instance.blue = 0;
            instance.speed = 0.0833 * (0.75);
        };
        SceneFade.disable = function () {
            instance.sprite.enabled = false;
        };
        SceneFade.setColor = function (red, green, blue) {
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
            if (!Game.Scene.waiting && Game.Scene.nextSceneClass != null && this.direction != 1) {
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
                return Game.Scene.nextSceneClass != null || instance.paused || Game.SceneOrientator.blocked;
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
            _this.text0.superfront = true;
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
            _this.text1.superfront = true;
            _this.device = new Engine.Sprite();
            _this.device.enabled = true;
            _this.device.pinned = true;
            _this.device.y = 0 - 6;
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
        //FRAMES = [];
        //FRAMES[0] = new Utils.AnimationFrame(Resources.texture, 391, 5, 72, 40, -72 * 0.5, -40 * 0.5);
        //ready = true;
    });
})(Game || (Game = {}));
///<reference path="Scene.ts"/>
///<reference path="../../Game.ts"/>
var Game;
(function (Game) {
    var SceneText = /** @class */ (function () {
        function SceneText() {
        }
        SceneText.createMiddleText = function (str, y, enabled, yOffsetAddition) {
            if (y === void 0) { y = 0; }
            if (enabled === void 0) { enabled = true; }
            if (yOffsetAddition === void 0) { yOffsetAddition = 0; }
            var text = new Utils.Text();
            text.font = Game.FontManager.a;
            text.scale = 1;
            text.enabled = enabled;
            text.pinned = true;
            text.str = str;
            text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text.xAligned = 0;
            text.yAligned = y + SceneText.yOffsetText;
            text.front = false;
            SceneText.yOffsetText += yOffsetAddition;
            return text;
        };
        SceneText.createMiddleStartText = function (str, y, enabled, yOffsetAddition) {
            if (y === void 0) { y = 0; }
            if (enabled === void 0) { enabled = true; }
            if (yOffsetAddition === void 0) { yOffsetAddition = 0; }
            var text = new Utils.Text();
            text.font = Game.FontManager.a;
            text.scale = 1;
            text.enabled = enabled;
            text.pinned = true;
            text.str = str;
            text.xAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text.yAlignBounds = Utils.AnchorAlignment.START;
            text.yAlignView = Utils.AnchorAlignment.START;
            text.xAligned = 0;
            text.yAligned = y + SceneText.yOffsetText;
            text.front = false;
            SceneText.yOffsetText += yOffsetAddition;
            return text;
        };
        SceneText.createStartMiddleText = function (str, x, y, enabled, yOffsetAddition) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (enabled === void 0) { enabled = true; }
            if (yOffsetAddition === void 0) { yOffsetAddition = 0; }
            var text = new Utils.Text();
            text.font = Game.FontManager.a;
            text.scale = 1;
            text.enabled = enabled;
            text.pinned = true;
            text.str = str;
            text.xAlignBounds = Utils.AnchorAlignment.START;
            text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text.xAligned = x;
            text.yAligned = y + SceneText.yOffsetText;
            text.front = false;
            SceneText.yOffsetText += yOffsetAddition;
            return text;
        };
        SceneText.createEndMiddleText = function (str, x, y, enabled, yOffsetAddition) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (enabled === void 0) { enabled = true; }
            if (yOffsetAddition === void 0) { yOffsetAddition = 0; }
            var text = new Utils.Text();
            text.font = Game.FontManager.a;
            text.scale = 1;
            text.enabled = enabled;
            text.pinned = true;
            text.str = str;
            text.xAlignBounds = Utils.AnchorAlignment.END;
            text.xAlignView = Utils.AnchorAlignment.MIDDLE;
            text.yAlignBounds = Utils.AnchorAlignment.MIDDLE;
            text.yAlignView = Utils.AnchorAlignment.MIDDLE;
            text.xAligned = x;
            text.yAligned = y + SceneText.yOffsetText;
            text.front = false;
            SceneText.yOffsetText += yOffsetAddition;
            return text;
        };
        SceneText.yOffsetText = 0;
        return SceneText;
    }());
    Game.SceneText = SceneText;
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
///<reference path="Anchor.ts"/>
var Utils;
(function (Utils) {
    var Text = /** @class */ (function (_super) {
        __extends(Text, _super);
        function Text() {
            var _this = _super.call(this) || this;
            _this.sprites = new Array();
            _this.front = false;
            _this.superfront = false;
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
            if (!this.front && !this.superfront) {
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
        Text.prototype.onDrawTextSuperFront = function () {
            if (this.superfront) {
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
        Text.prototype.drawMe = function () {
            //this._bounds.render();
            for (var indexSprite = 0; indexSprite < this.sprites.length; indexSprite += 1) {
                this.sprites[indexSprite].render();
            }
            if (this._underlined) {
                this.underline.render();
                this.underline2.render();
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
            if (this.enabled) {
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
            }
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
            var minred = color.r - 10;
            var maxred = color.r + 10;
            var mingre = color.g - 10;
            var maxgre = color.g + 10;
            var minblu = color.b - 10;
            var maxblu = color.b + 10;
            for (var yIndex = 0; yIndex < this.assetData.ySize; yIndex += 1) {
                for (var xIndex = 0; xIndex < this.assetData.xSize; xIndex += 1) {
                    color.r = this.getRed(xIndex, yIndex);
                    color.g = this.getGreen(xIndex, yIndex);
                    color.b = this.getBlue(xIndex, yIndex);
                    color.a = this.getAlpha(xIndex, yIndex);
                    if (color.r > minred && color.r < maxred && color.g > mingre && color.g < maxgre && color.b > minblu && color.b < maxblu) {
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
