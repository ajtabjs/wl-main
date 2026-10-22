/* global console:false*/
"use strict";

var GamePix = {
    Hooks: {
        Social: "SOCIAL",
        Video: "VIDEO",
        Shop: "SHOP",
        Link: "LINK",
        Text: "TEXT",
        Info: "INFO",
        AppInstall: "APP_INSTALL",
        Rewards: "Rewards",
    },
    Actions: {
        Share: "SHARE",
        Play: "PLAY",
        Open: "OPEN",
        Buy: "BUY",
        Download: "DOWNLOAD",
    },
    on: {},
    game: {
        gameLoading: function (perc) {
            // console.log('GamePix Loading Event', perc);

            var elem = document.getElementById("myBar");
            elem.style.width = perc + "%";
        },
        gameLoaded: function (callback) {
            console.log("GamePix Loaded Event");
            callback();
            document.getElementById("progressScreen").remove();
        },
        ping: function (type, object) {
            console.log(type);
            console.log(object);
            try {
                //    GamePix.on.pause();
                //console.log('Game Paused');
            } catch (e) {
                console.log(e.message);
            }
            try {
                //    GamePix.on.soundOff();
                //console.log('Sound Paused');
            } catch (e) {
                console.log(e.message);
            }
            var i = 0;
            var seconds = 5;
            //crea il div
            var div = document.createElement("div");

            var p = document.createElement("p");
            p.id = "pCountDownGpx";
            p.textContent = "WAIT";
            p.style.position = "relative";
            p.style.color = "white";
            p.style.left = "50%";
            p.style.top = "50%";
            p.style.marginLeft = -1 * parseInt(window.innerWidth / 2);
            p.style.marginTop = -1 * parseInt(window.innerHeight / 2);
            p.style.color = "white";

            div.appendChild(p);

            //document.getElementsByTagName('body')[0].appendChild(div);

            var timer = setInterval(function () {
                if (i == seconds) {
                    clearInterval(timer);
                    //rimuovi il div
                    //document.getElementsByTagName('body')[0].removeChild(document.getElementById('waitingDivToRemoveGPX'));
                    try {
                        GamePix.on.resume();
                        //console.log('Game Resumed');
                    } catch (e) {
                        console.log(e.message);
                    }
                    try {
                        GamePix.on.soundOn();
                        //console.log('Sound Resumed');
                    } catch (e) {
                        console.log(e.message);
                    }
                } else {
                    i++;
                    //document.getElementById('pCountDownGpx').textContent = 'Game will resume in: ' + (seconds - i) + ' seconds';
                    //console.log('Game will resume in: ' + (seconds - i) + ' seconds');
                }
            }, 1000);
        },
        remap: function (url, object, callback) {
            var time = 5;
            console.log(url, object, "the game will back in" + time);
            setTimeout(function () {
                if (object.type == "shop" && object.params.action == "buy" && object.params.value !== undefined) {
                    return callback({ status: "success", value: Number(object.params.value) });
                } else {
                    return callback({ status: "success" });
                }
            }, time * 1000);
        },
        customLoading: function (bool) {
            if (bool === true && document.getElementById("waitingDivLevelGPX") === null) {
                //crea il div
                var div = document.createElement("div");
                div.id = "waitingDivLevelGPX";
                div.style.position = "fixed";
                div.style.top = "0px";
                div.style.left = "0px";
                div.style.width = window.innerWidth + "px";
                div.style.height = window.innerHeight + "px";
                div.style.backgroundColor = "rgba(27, 20, 23, 0.79)";

                var p = document.createElement("p");
                p.id = "pWaitGpx";
                p.textContent = "Wait";
                p.style.position = "relative";
                p.style.color = "white";
                p.style.left = "50%";
                p.style.top = "50%";
                p.style.marginLeft = -1 * parseInt(window.innerWidth / 2);
                p.style.marginTop = -1 * parseInt(window.innerHeight / 2);
                p.style.color = "white";

                div.appendChild(p);

                document.getElementsByTagName("body")[0].appendChild(div);
            } else if (bool === false && document.getElementById("waitingDivLevelGPX") !== null) {
                document.getElementsByTagName("body")[0].removeChild(document.getElementById("waitingDivLevelGPX"));
            }
        },
    },
    hook: function (hookType) {
        var Hook = function Hook() {
            this.type = hookType;
            this.internal_action = null;
            this.internal_value = null;
            this.onSuccessInternal = function () {
                console.log("empty");
            };
            this.onFailInternal = function () {
                console.log("empty");
            };
        };

        Hook.prototype.action = function (ActionType) {
            this.internal_action = ActionType;
            return this;
        };

        Hook.prototype.value = function (Value) {
            this.internal_value = Value;
            return this;
        };

        Hook.prototype.onSuccess = function (callback) {
            if (callback) this.onSuccessInternal = callback;
            return this;
        };

        Hook.prototype.onFail = function (callback) {
            if (callback) this.onFailInternal = callback;
            return this;
        };

        var instanced_hook = new Hook();

        /* ------ CALL THE GAME HOOK's CONFIG ------ */
        if (window.Promise) {
            var p = new Promise(function (resolve, reject) {
                //Open game hook configuration
                setTimeout(function () {
                    if (true) {
                        resolve("Success!");
                    } else {
                        reject("Failure!");
                    }
                }, 2000);
            });

            p.then(function () {
                instanced_hook.onSuccessInternal();
            }).catch(function () {
                instanced_hook.onFailInternal();
            });
        } else {
            //Open game hook configuration
            setTimeout(function () {
                if (true) {
                    instanced_hook.onSuccessInternal();
                } else {
                    instanced_hook.onFailInternal();
                }
            }, 2000);
        }

        return instanced_hook;
    },
    lang: function () {
        var default_lang = "en";
        var query = window.location.search.substring(1);
        var lang = null;
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (decodeURIComponent(pair[0]) == "lang") {
                lang = decodeURIComponent(pair[1]);
            }
        }
        if (!lang) {
            lang = window.navigator.userLanguage || window.navigator.language || default_lang;
        }
        return lang.substring(0, 2);
    },
    localStorage: {
        internal_storage: {},
        getItem: function (key) {
            try {
                // Retrieve the entire JSON object from localStorage
                const data = window.localStorage.getItem("cut-the-rope-experiments-data");
                // Parse the object and return the specific key
                const parsedData = data ? JSON.parse(data) : this.internal_storage;
                return parsedData[key] || null;
            } catch (e) {
                return this.internal_storage[key] || null;
            }
        },

        setItem: function (key, value) {
            try {
                // Retrieve the current data object from localStorage
                const data = window.localStorage.getItem("cut-the-rope-experiments-data");
                const parsedData = data ? JSON.parse(data) : this.internal_storage;

                // Add or update the key-value pair
                parsedData[key] = value;

                // Store the updated object back into localStorage as a JSON string
                window.localStorage.setItem("cut-the-rope-experiments-data", JSON.stringify(parsedData));
                this.internal_storage[key] = value;
            } catch (e) {
                this.internal_storage[key] = value;
            }
        },

        removeItem: function (key) {
            try {
                // Retrieve the current data object from localStorage
                const data = window.localStorage.getItem("cut-the-rope-experiments-data");
                const parsedData = data ? JSON.parse(data) : this.internal_storage;

                // Remove the specific key from the object
                delete parsedData[key];

                // Store the updated object back into localStorage
                window.localStorage.setItem("cut-the-rope-experiments-data", JSON.stringify(parsedData));
                delete this.internal_storage[key];
            } catch (e) {
                delete this.internal_storage[key];
            }
        },
    },
    text: function (string) {
        return "Placeholder for:" + string;
    },
    createUIGameError: function () {
        var div = document.createElement("div");
        div.id = "gamepix_13_game_error";

        var p1 = document.createElement("p");
        p1.id = "gamepix_13_img_error";

        var p2 = document.createElement("p");
        p2.id = "gamepix_13_label_error";
        p2.textContent = GamePix.text("text_id_game_not_supported");
        //se GamePix.lang() == 'ar' || 'fa' dir="rtl";
        if (GamePix.lang() == "ar" || GamePix.lang() == "fa") {
            p2.setAttribute("dir", "rtl");
        }

        div.appendChild(p1);
        div.appendChild(p2);

        document.body.appendChild(div);
    },
};
