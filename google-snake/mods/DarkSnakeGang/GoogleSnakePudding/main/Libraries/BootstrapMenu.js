window.BootstrapMenu = {};

window.BootstrapMenu.make = function () {

    window.bootstrapVisible = false;

    window.BootstrapShow = function () {
        const settingsBox = document.getElementById('settings-popup-pudding');
        settingsBox.style.display = 'block';
        settingsBox.style.visibility = 'visible';
        window.bootstrapVisible = true;

    }

    window.BootstrapHide = function () {
        const settingsBox = document.getElementById('settings-popup-pudding');
        settingsBox.style.visibility = 'hidden';
        if (typeof window.PortalPairsPanelHide === "function") {
            window.PortalPairsPanelHide();
        }
        if (window.bootstrapVisible && typeof window.getAllSrc != "undefined") {
            window.getAllSrc();
        }
        window.bootstrapVisible = false;

    }

    random_button_jsname = 'qycu7d' // Hardcoded because I'm lazy

    // Get the button by its jsname attribute
    window.random_button = document.querySelector(`[jsname="${random_button_jsname}"]`);
    if (window.random_button) {
        window._randomButtonOriginalHtml = window.random_button.innerHTML;
        window._randomButtonOriginalColor = window.random_button.style.color || "";
    }

    window.applyRandomButtonState = function (disabled) {
        const btn = window.random_button;
        if (!btn) return;
        if (disabled) {
            btn.style.pointerEvents = "none";
            btn.textContent = "Disabled";
            btn.style.color = "grey";
        } else {
            btn.style.pointerEvents = "auto";
            if (window._randomButtonOriginalHtml != null) {
                btn.innerHTML = window._randomButtonOriginalHtml;
            } else {
                btn.textContent = "Shuffle";
            }
            btn.style.color = window._randomButtonOriginalColor || "";
        }
    };

    // Disable the button
    window.ToggleRandom = function () {
        window.pudding_settings.DisableRandom = !window.pudding_settings.DisableRandom;
        window.applyRandomButtonState(window.pudding_settings.DisableRandom);
    }

    window.BootstrapSetup = function () {

        const a = new Image();
        a.src = getStatIconImageSrc();
        a.id = 'stat-icon';
        a.width = a.height = 25;
        a.style = 'position:relative;left:200px;top:70px;';
        window.divList = document.createElement('div');
        divList.class = 'counter-num'
        // Nudge below Google's built-in in-game timer (was 45px)
        divList.style = 'width:25px;z-index:5;position:relative;left:230px;top:52px;font-size:14px;font-family:Roboto,Arial,sans-serif;color:white;font-size:14px;line-height: normal;'
        divList.id = 'counter-num'

        document.getElementsByClassName('sEOCsb')[0].appendChild(a);
        document.getElementsByClassName('sEOCsb')[0].appendChild(divList);

        const d = document.createElement('div');
        d.id = 'input-counter-settings-container';
        d.style = 'position:absolute;left:465px;top:45px;z-index:10002;';
        document.getElementsByClassName('sEOCsb')[0].appendChild(d);

        const css_stripped = window.NepDebug
            ? "http://127.0.0.1:5500/bootstrap-stripped.css"
            : '../../mods/DarkSnakeGang/GoogleSnakePudding/main/bootstrap-stripped.css';

        const xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                const cssText = xhr.responseText;
                window.bootstrap_css = cssText;

                const styleElement = document.getElementsByTagName('style')[0];
                if (styleElement) {
                    styleElement.innerHTML = styleElement.innerHTML + cssText;
                }

                let styleElnew = document.getElementById('custom-style');
                if (!styleElnew) {
                    styleElnew = document.createElement('style');
                    styleElnew.id = 'custom-style';
                    document.head.appendChild(styleElnew);
                    styleElnew.innerHTML = cssText;
                }
            } else {
                console.error('Failed to load Bootstrap CSS:', xhr.status, xhr.statusText);
            }
        };

        xhr.onerror = function () {
            console.error('Network error while loading Bootstrap CSS');
        };

        xhr.ontimeout = function () {
            console.error('Timeout while loading Bootstrap CSS');
        };

        xhr.timeout = 10000;
        xhr.open('GET', css_stripped, true);
        xhr.send();

        const settingsBox = document.createElement('div');
        settingsBox.style = window.puddingSidebarStyle;
        settingsBox.style.display = 'none';
        settingsBox.id = 'settings-popup-pudding';
        settingsBox.innerHTML = `
<style>
#settings-popup-pudding .pudding-settings-header {
  color: white;
  font-family: Roboto, Arial, sans-serif;
  font-weight: 600;
  letter-spacing: 0.04em;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin: 0 0 8px;
  font-size: 13px;
}
#settings-popup-pudding .pudding-settings-section {
  margin: 0 0 8px;
  padding: 0 0 8px;
  border-bottom: 1px solid rgba(255,255,255,0.18);
}
#settings-popup-pudding .pudding-settings-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
#settings-popup-pudding .pudding-settings-section-title {
  display: block;
  color: rgba(255,255,255,0.75);
  font-family: Roboto, Arial, sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 6px;
}
#settings-popup-pudding .pudding-settings-btn {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin: 0 0 4px;
  padding: 5px 8px;
  color: white;
  background-color: #1155CC;
  border: none;
  border-radius: 4px;
  font-family: Roboto, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.3;
  text-align: center;
  cursor: pointer;
}
#settings-popup-pudding .pudding-settings-btn-row {
  display: flex;
  gap: 4px;
  margin: 0 0 4px;
}
#settings-popup-pudding .pudding-settings-btn-row .pudding-settings-btn {
  flex: 1;
  margin: 0;
}
#settings-popup-pudding #stat-chooser {
  width: 100%;
  box-sizing: border-box;
  margin: 0 0 4px;
  padding: 4px 6px;
  background-color: #1155CC;
  color: white;
  font-family: Roboto, Arial, sans-serif;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  text-align: center;
}
#settings-popup-pudding .form-check.form-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
  min-height: 0;
  padding-left: 0;
}
#settings-popup-pudding .form-check.form-switch .form-check-input {
  margin: 0;
  float: none;
  flex-shrink: 0;
}
#settings-popup-pudding .form-check-label {
  margin: 0;
  color: white;
  font-family: Roboto, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.25;
}
#settings-popup-pudding.pudding-text-compact .form-check-label,
#settings-popup-pudding.pudding-text-compact .pudding-settings-btn,
#settings-popup-pudding.pudding-text-compact #stat-chooser {
  font-size: 12px;
}
</style>

<span class="pudding-settings-header">Pudding Mod Settings</span>

<div class="pudding-settings-section">
  <span class="pudding-settings-section-title">Counter</span>
  <select id="stat-chooser" class="form-control">
    <option value="inputGame">Count game inputs</option>
    <option value="inputSession">Count session inputs</option>
    <option value="inputLifetime">Count lifetime inputs</option>
    <option value="playsSession">Count session resets</option>
    <option value="playsLifetime">Count lifetime resets</option>
    <option value="applesSession">Count fruit session</option>
    <option value="applesLifetime">Count fruit lifetime</option>
    <option value="goldenFruitCount">Count golden fruit</option>
    <option value="wallsGame">Count walls</option>
    <option value="hideCount">Hide counter</option>
  </select>
  <div class="pudding-settings-btn-row">
    <button type="button" class="btn pudding-settings-btn" id="edit-stat">Edit stat</button>
    <button type="button" class="btn pudding-settings-btn" id="reset-stats">Reset stats</button>
  </div>
</div>

<div class="pudding-settings-section">
  <span class="pudding-settings-section-title">Display</span>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="InputDisplay">
    <label class="form-check-label" for="InputDisplay">Input Display</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="TopBarIcons">
    <label class="form-check-label" for="TopBarIcons">Top Bar Icons</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="AlwaysOnTimeKeeper">
    <label class="form-check-label" for="AlwaysOnTimeKeeper">Show Speed Info</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="OldTimeKeeperFormat">
    <label class="form-check-label" for="OldTimeKeeperFormat">Old TimeKeeper format</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="ShowSplitPanel">
    <label class="form-check-label" for="ShowSplitPanel">Show Split Panel</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="BigPanelText">
    <label class="form-check-label" for="BigPanelText">Large panel text</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="FpsCounter">
    <label class="form-check-label" for="FpsCounter">FPS Counter</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="EatThemeRandomizer">
    <label class="form-check-label" for="EatThemeRandomizer" id="EatThemeRandomizer2">"Dragon Fruit"</label>
  </div>
</div>

<div class="pudding-settings-section">
  <span class="pudding-settings-section-title">Gameplay</span>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="SkullPoisonFruit">
    <label class="form-check-label" for="SkullPoisonFruit">Skull Poison Fruit</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="DistinctSokoGoals">
    <label class="form-check-label" for="DistinctSokoGoals">Distinct Soko Goals</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="DisableRandom">
    <label class="form-check-label" for="DisableRandom">Disable Randomizer</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" role="switch" id="SaveGameSettings">
    <label class="form-check-label" for="SaveGameSettings">Save Game Settings</label>
  </div>
</div>

<div class="pudding-settings-section">
  <span class="pudding-settings-section-title">Tools</span>
  <button type="button" class="btn pudding-settings-btn" id="TimerSettings">Timer settings</button>
  <button type="button" class="btn pudding-settings-btn" id="ResetKeybind">Reset Key: Shift</button>
  <button type="button" class="btn pudding-settings-btn" id="CustomBowlFruits" onclick="window.TogglePortalPairsPanel&&window.TogglePortalPairsPanel()">Custom Bowl Fruits</button>
</div>

<div class="pudding-settings-section">
  <span class="pudding-settings-section-title">Backup</span>
  <button type="button" class="btn pudding-settings-btn" id="ExportBackup">Export backup</button>
  <div class="pudding-settings-btn-row">
    <button type="button" class="btn pudding-settings-btn" id="ImportMergeBackup">Import merge</button>
    <button type="button" class="btn pudding-settings-btn" id="ImportReplaceBackup">Import replace</button>
  </div>
  <input type="file" id="PuddingBackupFile" accept="application/json,.json" style="display:none;">
</div>

<select style="display:none;margin:3px;background-color:#1155CC;color:white;font-family:Roboto,Arial,sans-serif;align-items:center;text-align:center;" id="snakePride" class="form-control flex-row">
  <option value="0">Default Rainbow</option>
</select>

<button class="btn pudding-settings-btn" style="display:none;" id="settings-close" jsname="settings-close">Close</button>
<button class="btn pudding-settings-btn" style="display:none;" id="ScrollLeftBtn">Scroll Left</button>
`;

        document.getElementsByClassName('sEOCsb')[0].appendChild(settingsBox);
        if (typeof window.applyPuddingPanelTextSize === "function") {
          window.applyPuddingPanelTextSize();
        }

        timer_settings = document.getElementById("TimerSettings");
        timer_settings.addEventListener("click", window.editTimer);

        ScrollLeftBtn = document.getElementById("ScrollLeftBtn");
        ScrollLeftBtn.style.display = 'none';

        EatThemeRandomizer = document.getElementById("EatThemeRandomizer");
        EatThemeRandomizer2 = document.getElementById("EatThemeRandomizer2");
        EatThemeRandomizer.checked = window.pudding_settings.randomizeThemeApple;
        EatThemeRandomizer.addEventListener("change", function() {
            window.pudding_settings.randomizeThemeApple = !window.pudding_settings.randomizeThemeApple;
        });

        const bigPanelTextCheckbox = document.getElementById("BigPanelText");
        if (bigPanelTextCheckbox) {
            bigPanelTextCheckbox.checked = window.pudding_settings.BigPanelText !== false;
            bigPanelTextCheckbox.addEventListener("change", function () {
                window.pudding_settings.BigPanelText = !!bigPanelTextCheckbox.checked;
                if (typeof window.applyPuddingPanelTextSize === "function") {
                    window.applyPuddingPanelTextSize();
                }
                if (typeof window.saveSettings === "function") window.saveSettings();
            });
        }

        if (typeof window.FpsCounterBindCheckbox === "function") {
            window.FpsCounterBindCheckbox(document.getElementById("FpsCounter"));
        }

        const oldTimeKeeperFormatCheckbox = document.getElementById("OldTimeKeeperFormat");
        if (oldTimeKeeperFormatCheckbox) {
            if (typeof window.pudding_settings.OldTimeKeeperFormat !== "boolean") {
                window.pudding_settings.OldTimeKeeperFormat = false;
            }
            oldTimeKeeperFormatCheckbox.checked = !!window.pudding_settings.OldTimeKeeperFormat;
            oldTimeKeeperFormatCheckbox.addEventListener("change", function () {
                window.pudding_settings.OldTimeKeeperFormat = !!oldTimeKeeperFormatCheckbox.checked;
                if (typeof window.saveSettings === "function") window.saveSettings();
                if (window.timeKeeper && typeof window.timeKeeper.refreshSpeedInfo === "function") {
                    window.timeKeeper.refreshSpeedInfo();
                }
            });
        }

        skull_checkbox = document.getElementById("SkullPoisonFruit");
        skull_checkbox.checked = window.pudding_settings.Skull;
        skull_checkbox.addEventListener("change", toggle_skull_func);

        soko_checkbox = document.getElementById("DistinctSokoGoals");
        soko_checkbox.checked = window.pudding_settings.SokoGoals;
        soko_checkbox.addEventListener("change", toggle_soko_goal);

        input_checkbox = document.getElementById("InputDisplay");
        input_checkbox.addEventListener("change", toggle_input_display);
        input_checkbox.checked = window.pudding_settings.InputDisplay;
        toggle_input_display();

        if (typeof window.setup_topbar_checkbox === "function") {
            window.setup_topbar_checkbox();
        } else {
            const topbar_checkbox = settingsBox.querySelector("#TopBarIcons");
            if (topbar_checkbox) {
                topbar_checkbox.addEventListener("change", window.toggle_topbar_icons);
                topbar_checkbox.checked = window.pudding_settings.TopBar;
            }
        }

        speedinfo_checkbox = document.getElementById("AlwaysOnTimeKeeper");
        speedinfo_checkbox.addEventListener("change", window.ToggleSpeedInfo);
        speedinfo_checkbox.checked = window.pudding_settings.SpeedInfo;

        splitpanel_checkbox = document.getElementById("ShowSplitPanel");
        if (typeof window.pudding_settings.SplitPanel !== "boolean") {
            window.pudding_settings.SplitPanel = false;
        }
        splitpanel_checkbox.checked = !!window.pudding_settings.SplitPanel;
        splitpanel_checkbox.addEventListener("change", window.ToggleSplitPanel);

        randombtn_checkbox = document.getElementById("DisableRandom");
        randombtn_checkbox.addEventListener("change", window.ToggleRandom);
        randombtn_checkbox.checked = window.pudding_settings.DisableRandom;
        window.applyRandomButtonState(window.pudding_settings.DisableRandom);

        const saveGameSettingsCheckbox = document.getElementById("SaveGameSettings");
        if (typeof window.pudding_settings.SaveGameSettings !== "boolean") {
            window.pudding_settings.SaveGameSettings = true;
        }
        saveGameSettingsCheckbox.checked = !!window.pudding_settings.SaveGameSettings;
        saveGameSettingsCheckbox.addEventListener("change", function () {
            window.pudding_settings.SaveGameSettings = !!saveGameSettingsCheckbox.checked;
            if (typeof window.saveSettings === "function") window.saveSettings();
        });

        if (localStorage.getItem('snakeChosenMod') === "PuddingMod" || window.NepDebug) {
            EatThemeRandomizer.style.display = 'none';
            EatThemeRandomizer2.style.display = 'none';
            EatThemeRandomizer.checked = false;
            window.pudding_settings.randomizeThemeApple = false;
            EatThemeRandomizer.parentElement.style.display = 'none';
        } else
        {
            EatThemeRandomizer.parentElement.style.display = 'block';
            console.log("Disabling SpeedInfo")
            speedinfo_checkbox.disabled = true;
            speedinfo_checkbox.checked = false;
            window.SpeedInfoHide();
        }

        if(window.isSnakeMobileVersion){
            speedinfo_checkbox.disabled = true;
            speedinfo_checkbox.checked = false;
            window.SpeedInfoHide();

            splitpanel_checkbox.disabled = true;
            splitpanel_checkbox.checked = false;
            if (typeof window.SplitPanelHide === "function") window.SplitPanelHide();

            input_checkbox.disabled = true;
            ScrollLeftBtn.style.display = '';
            ScrollLeftBtn.addEventListener("click", function () {
                document.documentElement.scrollLeft -= 800;
            });
        }

        let settingsToValues = {
            inputs: {
                game: 'inputGame',
                session: 'inputSession',
                lifetime: 'inputLifetime'
            },
            plays: {
                session: 'playsSession',
                lifetime: 'playsLifetime'
            },
            apples: {
                session: 'applesSession',
                lifetime: 'applesLifetime'
            },
            goldenFruit: {
                lifetime: 'goldenFruitCount'
            },
            walls: {
                game: 'wallsGame'
            },
            hide: {
                count: 'hideCount'
            }
        }

        let valuesToSettings = {
            inputGame: { stat: 'inputs', duration: 'game' },
            inputSession: { stat: 'inputs', duration: 'session' },
            inputLifetime: { stat: 'inputs', duration: 'lifetime' },
            playsSession: { stat: 'plays', duration: 'session' },
            playsLifetime: { stat: 'plays', duration: 'lifetime' },
            applesSession: { stat: 'apples', duration: 'session' },
            applesLifetime: { stat: 'apples', duration: 'lifetime' },
            goldenFruitCount: { stat: 'goldenFruit', duration: 'lifetime' },
            wallsGame: { stat: 'walls', duration: 'game' },
            hideCount: { stat: 'hide', duration: 'count' },
        }

        const chosenValue =
            settingsToValues[stats.statShown] &&
            settingsToValues[stats.statShown][stats.statDurationShown];
        const chosenOpt = chosenValue
            ? document.querySelector(`#stat-chooser option[value=${chosenValue}]`)
            : null;
        if (chosenOpt) chosenOpt.selected = true;

        const settingsCloseElements = document.getElementById('settings-close');
        settingsCloseElements.addEventListener('click', window.BootstrapHide);

        document.getElementById('stat-chooser').onchange = function () {
            stats.statShown = valuesToSettings[this.value].stat;
            stats.statDurationShown = valuesToSettings[this.value].duration;
            if (typeof window.setCounter === "function") window.setCounter();
            updateCounterDisplay();
        }

        document.getElementById('edit-stat').addEventListener('click', promptToEditStatCount);
        document.getElementById('reset-stats').addEventListener('click', promptToResetStats);

        if (typeof window.wirePuddingBackupButtons === "function") {
            window.wirePuddingBackupButtons({
                exportBtn: document.getElementById("ExportBackup"),
                mergeBtn: document.getElementById("ImportMergeBackup"),
                replaceBtn: document.getElementById("ImportReplaceBackup"),
                fileInput: document.getElementById("PuddingBackupFile"),
            });
        }
    }

    window.BootstrapSetup();

    window.ToggleBootstrap = function () {
        if (!window.bootstrapVisible) {
            // Show it
            window.BootstrapShow();
        }
        else {
            // Hide it
            window.BootstrapHide();
        }
    }

    //Listeners to hide/show settings box
    const settingsButton = 'iyH4Cb';
    document.querySelector("div[jsname^=\"" + settingsButton + "\"]").addEventListener("click", (e) => {
        window.BootstrapShow();
        if (window.isSnakeMobileVersion) {
            window.enableScrollMobile();
            if (localStorage.getItem('snakeChosenMod') === "VisibilityMod") {
                document.getElementById('delete-stuff-popup').hidden = false;
            }
        }
    });

    const backButton = 'p17HVe';
    document.querySelector("[class^=\"" + backButton + "\"]").addEventListener("click", (e) => {
        window.BootstrapHide();
        if (window.isSnakeMobileVersion) {
            if (localStorage.getItem('snakeChosenMod') === "VisibilityMod") {
                document.getElementById('delete-stuff-popup').hidden = true;
            }
        }
    });

    const playButton = 'NSjDf';
    document.querySelector("[jsname^=\"" + playButton + "\"]").addEventListener("click", (e) => {
        if (typeof window.saveCurrentGameSettings === "function") {
            window.saveCurrentGameSettings();
        }
        window.BootstrapHide();
        if (window.isSnakeMobileVersion) {
            if (localStorage.getItem('snakeChosenMod') === "VisibilityMod") {
                document.getElementById('delete-stuff-popup').hidden = true;
            }
        }
    });


    // Function to enable horizontal scroll
    window.enableScrollMobile = function () {
        // Enable scroll by setting overflow to auto
        document.body.style.overflowX = 'auto';
        document.documentElement.scrollLeft = document.documentElement.scrollWidth;
    }

}

window.BootstrapMenu.alterCode = function (code) {
    if(window.pudding_settings.SpeedInfo)
    {
        window.SpeedInfoShow();
    }
    // After patched game is live: restore saved selectors once per page load
    // (applySavedGameSettingsOnce polls until #trophy exists)
    setTimeout(function () {
        if (typeof window.applySavedGameSettingsOnce === "function") {
            window.applySavedGameSettingsOnce();
        }
    }, 0);
    return code;
}
