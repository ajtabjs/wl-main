new MoneyMovers.Game();

// GameDistribution stub SDK — replaces the original html5.api.gamedistribution.com SDK.
window.GD_OPTIONS = window.GD_OPTIONS || {
    gameId: "03ea76ffb4294a0391077e374903bf22",
    advertisementSettings: { autoplay: false },
    onEvent: function (event) {
        switch (event.name) {
            case "SDK_GAME_PAUSE":
                if (window.app && typeof app.adStarted === "function") app.adStarted();
                break;
            case "SDK_GAME_START":
                if (window.app && typeof app.adEnded === "function") app.adEnded();
                break;
        }
    }
};

(function () {
    var adInProgress = false;

    function fire(name) {
        var opts = window.GD_OPTIONS;
        if (opts && typeof opts.onEvent === "function") opts.onEvent({ name: name });
    }

    function simulateAd(kind) {
        return new Promise(function (resolve) {
            if (adInProgress) {
                resolve({ success: false, reason: "busy" });
                return;
            }
            adInProgress = true;
            fire("SDK_GAME_PAUSE");

            setTimeout(function () {
                adInProgress = false;
                if (kind === "rewarded") fire("SDK_REWARDED_WATCH_COMPLETE");
                fire("SDK_GAME_START");
                resolve({ success: true, name: kind });
            }, kind === "rewarded" ? 5000 : 3000);
        });
    }

    window.gdsdk = {
        showBanner: function () {
            return simulateAd("display");
        },
        showAd: function (type) {
            return simulateAd(type || "interstitial");
        },
        preloadAd: function () {
            return Promise.resolve();
        },
        showRewardedAd: function () {
            return simulateAd("rewarded");
        },
        openConsole: function () {}
    };

    setTimeout(function () {
        fire("SDK_GDPR_TRACKING");
        fire("SDK_GDPR_TARGETING");
    }, 0);
})();
