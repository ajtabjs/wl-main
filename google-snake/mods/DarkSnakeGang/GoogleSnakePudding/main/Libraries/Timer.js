
// const arrayIndices = n => Array(n).fill().map((q, i) => i)

// const [classic, wall, portal, cheese, infinity, twin, winged, yinyang, key, sokoban, poison, dimension, minesweeper, statue, light, peaceful] = arrayIndices(16)
// const [one, three, five, dice] = arrayIndices(4)
// const [normal, fast, slow] = arrayIndices(3)
// const [standard, small, large] = arrayIndices(3)


function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}
function rgbToHex(rgb) {
  let hex = '#';
  hex += rgb.r.toString(16).padStart(2, '0');
  hex += rgb.g.toString(16).padStart(2, '0');
  hex += rgb.b.toString(16).padStart(2, '0');
  return hex;
}


window.Timer = {
  make: function() {
    window.getSelected = function(selector, selectedClass = 'DqMRee tuJOWd') {
      return (
        [...document.querySelector(selector).children].map(
          (q, i) => [q, i]
        ).filter(
          ([q,]) => q.className === selectedClass
        )[0] || [0, 0]
      )[1]
    }

    // Freeze menu indices once per run; split/win paths read these instead of scraping DOM
    window.freezeRunSelectors = function () {
      if (typeof getSelected !== "function") return;
      try {
        window._runTrophy = getSelected("#trophy");
        window._runCount = getSelected("#count");
        window._runSpeed = getSelected("#speed");
        window._runSize = getSelected("#size");
      } catch (e) { /* menu may be missing early */ }
    };

    window.getRunSelectors = function () {
      const midRun =
        window.timeKeeper &&
        (window.timeKeeper.runStarted || window.timeKeeper.playing) &&
        typeof window._runTrophy === "number" &&
        typeof window._runCount === "number" &&
        typeof window._runSpeed === "number" &&
        typeof window._runSize === "number";
      if (midRun) {
        return {
          mode: window._runTrophy,
          count: window._runCount,
          speed: window._runSpeed,
          size: window._runSize,
        };
      }
      if (typeof getSelected === "function") {
        try {
          return {
            mode: getSelected("#trophy"),
            count: getSelected("#count"),
            speed: getSelected("#speed"),
            size: getSelected("#size"),
          };
        } catch (e) { /* fall through */ }
      }
      return {
        mode: window._runTrophy || 0,
        count: window._runCount || 0,
        speed: window._runSpeed || 0,
        size: window._runSize || 0,
      };
    };

    String.prototype.color = function(c) { return `<span style="color:${c}">${this.toString()}</span>` }

    Number.prototype.timeFormat = function() {
      const time = +this

      const hours   = Math.floor(time / 3600)
      const minutes = Math.floor((time / 60) % 60)
      const seconds = Math.floor(time % 60)
      const millis  = Math.floor((time % 1).toFixed(4) * 1000)

      let out = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2,'0')}.${millis.toString().padStart(3, '0')}`
      out = out.slice(out.search(/[^0:]/))

      return (out[0] === '.' ? '0' : '') + out
    }
    String.prototype.timeFormat = function() {
      return (+this).timeFormat()
    }

    window._splits = []

    window._cat = 3

    function refreshSplitPanel() {
      if (typeof window.SplitPanelRefresh === "function") window.SplitPanelRefresh()
    }

    localStorage._snake_timer_format = localStorage._snake_timer_format ?? 1
    window._format = localStorage._snake_timer_format

    localStorage._snake_show_delta = localStorage._snake_show_delta ?? 0
    window._showDelta = +localStorage._snake_show_delta

    localStorage._snake_pb = localStorage._snake_pb ?? '{}'
    window._pb = JSON.parse(localStorage._snake_pb)
    window._snakePbDirty = false

    // Persist timer split PBs; mid-run only marks dirty until flush/persist
    window.flushSnakePb = function () {
      if (!window._snakePbDirty || !window._pb) return
      localStorage._snake_pb = JSON.stringify(window._pb)
      window._snakePbDirty = false
    }
    window.persistSnakePb = function () {
      if (!window._pb) return
      localStorage._snake_pb = JSON.stringify(window._pb)
      window._snakePbDirty = false
    }
    window.markSnakePbDirty = function () {
      window._snakePbDirty = true
    }

    // Bridge inserted before Peaceful: old mode index 20 (Peaceful) -> 21
    if (!localStorage._snake_pb_bridge_migrated) {
      if (window._pb[20] && !window._pb[21]) {
        window._pb[21] = window._pb[20];
        delete window._pb[20];
        window.persistSnakePb();
      }
      localStorage._snake_pb_bridge_migrated = '1';
    }


    localStorage._snake_aheadg  = localStorage._snake_aheadg  ?? '#008010'
    localStorage._snake_aheadl  = localStorage._snake_aheadl  ?? '#53dd87'
    localStorage._snake_behindg = localStorage._snake_behindg ?? '#dd3333'
    localStorage._snake_behindl = localStorage._snake_behindl ?? '#a00000'

    const nullFormats = [
      '-:--:--:---',
        '--:--:---',
         '-:--:---',
           '--:---',
            '-:---',
      '-:--:--.---',
        '--:--.---',
         '-:--.---',
           '--.---',
            '-.---',
    ]
    localStorage._snake_null_split = localStorage._snake_null_split ?? nullFormats[_format]


    const timerSplitDiv = document.getElementsByClassName('Jc72He rc48Qb')[0]
    const deltaDiv = document.createElement('div')
    deltaDiv.id = 'timerDelta'
    window._timerDeltaEl = deltaDiv
    window.setTimerDeltaDisplay = function (el, text, color) {
      const node = el || window._timerDeltaEl || document.getElementById('timerDelta')
      if (!node) return
      window._timerDeltaEl = node
      const next = text == null ? '-' : String(text)
      const nextColor = color || 'white'
      if (node.textContent !== next) node.textContent = next
      if (node.style.color !== nextColor) node.style.color = nextColor
    }
    window.setTimerDeltaDisplay(deltaDiv, '-', 'white')
    timerSplitDiv.appendChild(deltaDiv)
    if(!_showDelta) deltaDiv.style.display = 'none'

    // const realTimerDiv = document.getElementsByClassName('Jc72He gmwAbc')[0]
    // realTimerDiv.style.position = 'relative'
    // if(_showDelta) realTimerDiv.style.bottom = window.location.href.includes('fbx') ? '9px' : '13px'

    // const wholeTimerDiv = document.getElementsByClassName('A2vT0')[0]
    // wholeTimerDiv.style.cursor = 'pointer'


    window.editTimer = function() {
      // console.warn(window.themes)

      function closeEditBox() {
        const box = document.getElementById('edit-box')
        const bd = document.getElementById('edit-box-backdrop')
        if (box) box.remove()
        if (bd) bd.remove()
      }

      let editBox = document.getElementById('edit-box')
      if(editBox) {
        closeEditBox()
      } else {
        const theme = window.themes[getSelected('#theme', 'DqMRee tuJOWd') || getSelected('#theme', 'tuJOWd')]

        const btnColor = window.button_color || '#1155CC'
        editBox = document.createElement('div')
        editBox.id = 'edit-box'
        editBox.style = `
          background-color: ${theme.real_top_bar ?? '#aaaaff'};
          border-radius: 0.5vw;
          position: absolute;
          height: auto;
          max-height: 94vh;
          z-index: 1000000;
          top: 20px;
          left: 50%;
          backdrop-filter: blur(5px);
          text-align: center;
          padding: 10px 14px 12px;
          transform: translate(-50%, 0);
          box-shadow: 0px 0px 8px rgba(0,0,0,0.4);
          border: 1px solid ${theme.topbar_color ?? '#4444dd'};
          font-size: 2vh;
          color: #ffffff;
          width: 58vw;
          max-width: 640px;
          font-family: Roboto,Arial,sans-serif;
          overflow-x: hidden;
          overflow-y: auto;
          box-sizing: border-box;
        `
        const iconRow = 'display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:0.3vh;margin:0 auto;'
        const iconStyle = 'cursor: pointer; border: 0.45vh ridge #00000000; border-radius: 1vh; width: 3.2vh; height: 3.2vh;'
        const iconSel = 'cursor: pointer; border: 0.45vh ridge #af4490ff; border-radius: 1vh; width: 3.2vh; height: 3.2vh;'
        editBox.innerHTML = `
<style>
#edit-box .timer-settings-header {
  color:white;font-family:Roboto,Arial,sans-serif;font-weight:600;letter-spacing:0.04em;
  font-size:2.4vh;margin:0 0 10px;display:block;
}
#edit-box .timer-settings-section {
  margin:0 0 10px;padding:0 0 10px;border-bottom:1px solid rgba(255,255,255,0.18);text-align:center;
}
#edit-box .timer-settings-section:last-of-type { border-bottom:none;margin-bottom:4px;padding-bottom:0; }
#edit-box .timer-settings-section-title {
  display:block;color:rgba(255,255,255,0.75);font-family:Roboto,Arial,sans-serif;font-size:1.5vh;
  font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;
}
#edit-box .timer-settings-btn {
  box-sizing:border-box;margin:0;padding:5px 12px;color:white;background-color:${btnColor};border:none;
  border-radius:4px;font-family:Roboto,Arial,sans-serif;font-size:1.7vh;line-height:1.3;cursor:pointer;
}
#edit-box .timer-settings-btn-block {
  display:block;width:100%;max-width:220px;margin:10px auto 2px;
}
#edit-box .timer-settings-btn-row { display:flex;gap:6px;align-items:center;flex-wrap:wrap; }
#edit-box .form-check.form-switch {
  display:inline-flex;align-items:center;gap:6px;margin:0;min-height:0;padding-left:0;
}
#edit-box .form-check.form-switch .form-check-input { margin:0;float:none;flex-shrink:0;width:1.3em;height:1.3em; }
#edit-box .form-check-label { margin:0;color:white;font-family:Roboto,Arial,sans-serif; }
#edit-box .timer-settings-input {
  background-color:${btnColor};color:white;font-family:Roboto,Arial,sans-serif;
  border:1px solid rgba(255,255,255,0.25);border-radius:4px;outline:none;caret-color:white;padding:3px 8px;
}
#edit-box .timer-settings-pb-input {
  font-family:Consolas,monospace;background-color:rgba(0,0,0,0.2);color:white;
  border:1px solid rgba(255,255,255,0.25);border-radius:4px;padding:2px 6px;outline:none;
}
#edit-box .timer-settings-cols {
  display:flex;gap:12px;justify-content:center;align-items:flex-start;flex-wrap:wrap;
}
#edit-box .timer-settings-col { flex:1;min-width:0; }
#edit-box .timer-settings-track-row {
  display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;text-align:left;
}
</style>

<span class="timer-settings-header">Timer settings</span>

<div class="timer-settings-section">
  <span class="timer-settings-section-title">Speed Info</span>
  <div class="timer-settings-track-row">
    <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" role="switch" id="ShowWrHolders">
      <label class="form-check-label" for="ShowWrHolders">Show WR holders</label>
    </div>
    <div class="timer-settings-btn-row">
      <label for="TrackedPlayerInput" class="form-check-label">Track player</label>
      <input type="text" class="form-control timer-settings-input" id="TrackedPlayerInput" list="tracked-player-suggestions" placeholder="SRC username" autocomplete="off" style="width:140px;text-align:center;">
      <datalist id="tracked-player-suggestions"></datalist>
      <button class="btn timer-settings-btn" type="button" id="TrackedPlayerSet">Set</button>
      <button class="btn timer-settings-btn" type="button" id="TrackedPlayerClear">Clear</button>
    </div>
  </div>
</div>

<div class="timer-settings-section">
  <span class="timer-settings-section-title">Mode</span>
  <div id="edit-mode" style="${iconRow}">
  <img class="sel" style="${iconSel}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_00.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_01.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_02.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_03.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_04.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_05.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_06.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_07.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_08.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_09.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_10.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_11.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_12.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_13.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_14.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v17/trophy_15.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v18/trophy_16.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v19/trophy_17.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v20/trophy_18.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v21/trophy_19.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v22/trophy_20.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_15.png" />
  </div>
</div>

<div class="timer-settings-section">
  <span class="timer-settings-section-title">Count</span>
  <div id="edit-count" style="${iconRow}">
  <img class="sel" style="${iconSel}" src="https://www.google.com/logos/fnbx/snake_arcade/v17/count_00.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v17/count_01.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v17/count_02.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v18/count_03.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v18/count_04.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v18/count_05.png" />
  <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v19/count_06.png" />
  </div>
</div>

<div class="timer-settings-section">
  <div class="timer-settings-cols">
    <div class="timer-settings-col">
      <span class="timer-settings-section-title">Speed</span>
      <div id="edit-speed" style="${iconRow}">
        <img class="sel" style="${iconSel}" src="https://www.google.com/logos/fnbx/snake_arcade/v3/speed_00.png" />
        <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v3/speed_01.png" />
        <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v3/speed_02.png" />
      </div>
    </div>
    <div class="timer-settings-col">
      <span class="timer-settings-section-title">Size</span>
      <div id="edit-size" style="${iconRow}">
        <img class="sel" style="${iconSel}" src="https://www.google.com/logos/fnbx/snake_arcade/v4/size_00.png" />
        <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v4/size_01.png" />
        <img class="uns" style="${iconStyle}" src="https://www.google.com/logos/fnbx/snake_arcade/v4/size_02.png" />
      </div>
    </div>
  </div>
</div>

<div class="timer-settings-section">
  <div class="timer-settings-cols">
    <div class="timer-settings-col">
      <span class="timer-settings-section-title">Category</span>
      <div id="edit-cat" style="${iconRow}">
        <img class="uns" style="background-color: #ffffff55; ${iconStyle}" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFISURBVFhH7dS9K0VhAMfx46XoZlcUg2KQJClZGJWJRUZMyB9hMiuFRdkMSikLi7IYGaRuyWBUlCIWfH/P89zuc457Ood7SXm+9ek8z307z3m5JwqFQqF/X53bplXAKsbRgSvsYA1+Z2iwQ9O7207gzg4rl7WAQ3RiDw+YxCgWsIlS2uE1zvHqvGARVaUd+TXhFidmVk4L2LDDr1Xvtmklf1RHpiNtNbN4/iXIXdYCKtWPSzuM1YwBtJnZDzUPne5pMyun13yPWEFN68MTts0snt7rhi7NMHTTaiFLqEktuMAp8l62ZxzZYXp5fkyf2YcWMYM35KkIfafqDqDTOWJm+WqHvpN8YH0q66+ziynouuuhpX/AoKOd6Ci30Aud8kYMYR26H2Zxj2+np1npzk6ag1rGDfz3jjGGX60HXch6vIdCodBfKoo+AGWkQQgZgnjDAAAAAElFTkSuQmCC" />
        <img class="uns" style="background-color: #ffffff55; ${iconStyle}" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFxSURBVFhH7dTPKwRhHMfxwUXEQRTFBUUOKH+Ag5RSyMlJhHCQkyMH/gMXVy5KcXFy0IaLi/y4SEIcSC5+lNzw/jzzjLHbzu62uxd53vXqme82TTPPzq7ncrlc/74Cu0Y1iQl8mSlcjzHlH/60iE604QSrWEPKCu0aVTk6cIcbXOAUV/jdOuaxj3G8QTcwjJyag5661EzJ64bOGTFT2CV2/cPo0u1AJg3YdcOuQVvoQpWZIsr0BprRihIzxdeAc3yYKezBrtV2TVqmN3CEM7wjhh4E1eDZP4zrya4pbyBdRdCTaxvrMYNP3KIYSi/mgX8Y1yD0bvSaKY/NQhfWy6f2oN1JbBo6r91MEWXzEuqJVZldH5Fsm2vtem/XvLUDPVmdmTxvDJr7zBR2iG3/MLsqoAvru2xECxbsZysI0nkvuEY/tOXL0HlDyKlN6EKBVywhMf396pcSnKd/zlHkJX3XTag0U+r0a9FuuVwu11/J874Bi3VEBBwOxJ0AAAAASUVORK5CYII=" />
        <img class="uns" style="background-color: #ffffff55; ${iconStyle}" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHFSURBVFhH7ZS/S5ZRFMcfQssGDYJMRSWo5nLKKUR01QiRXMrW2qqptpYImoLoD1BqFFFaCqShQbChQQdBUFKJGmyICtLq87333J4f3icxApf7gQ/nnPve533Pe+99bpZIJBKJCKdxCndcFec+vsbPOIfXsMoATuJ7XMQJ3JPbqB/+jl80EOEZ/kI1MYLTVl/FwChqTA2M4R2rZ7CWG7iEl/Elqokqg6gvGndVzjK+8qljHrUyRW6inu11VYQ2i0IN/PBpiSeoLznqqpwHqPETeNbye1jkFGr8oauMQxbFB4viJzb4tITOh1bpm6tyNi3qT3T5NHtnMbCKX7HDVUaxgSJ1B7Adt3xa4qNFNRB+IDbvExZXet8NHEGtTpWwXYdRc0Rs3jY2+tSz3wa0Tcd8WuKkxQ0MW9lisUgras4f/qWB0hIanRaLDYSxQDc247qrjLoGtFQx9HboXwy5Kqcf9Y5rj9+imujDIhctPre4iybUxaKL4w3qlbmEw6jTL46jbr8V1Ph5fIyaewUDT1Fjd7HHog7qLNaiy0UPxbyFgXO4gOGzNbyOVR6hmtUcHcgX+F/RpXPGp3/lAtZtdSKRSBw0WfYbwvtk36FSVnUAAAAASUVORK5CYII=" />
        <img class="sel" style="background-color: #ffffff55; ${iconSel}" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFGSURBVFhH7dRPKwZBAMfxQbkoJTk4uTqgCAcHJy8AEW/guTiKHLhQbnLiBcg7UM5yk4O44ULhpghF8u/7m52ntmdnd5s9ar71aXZ2Ds/uTPuYWCwWi5V0iCss2Fm2e1wkl96+8ZVchteBX+dYNzztQet5neAmufTX7EZfs248wDh67Sy8Fjd6K3sAbd+ynRkz78bQKj1ADyawjmt8YA6hNaHSA9S3f9eNW9AR6CjS6QfKqvwAt3iyM2M23VjlGIqO2bvYj1FcYhVrWMIDQo+h9Ah86dz1ab146P4M6u2j6DM8xWty6c+3A9r+I7Q36IQK3YXCHWhcHMMKNnCuG6l+0AftwA7eMY0BaHeGMIwRtOIONXTjDYPQmjziGZnOoE+uzc6yTUFbvmhnxmzjE7qXppdQ+hPzrU8ity435qU3isVisf+SMX/8akN+RRD52gAAAABJRU5ErkJggg==" />
      </div>
    </div>
    <div class="timer-settings-col">
      <span class="timer-settings-section-title">Personal bests</span>
      <div id="edit-times" style="display:inline-grid;grid-template-columns:auto auto;gap:4px 10px;justify-content:center;text-align:left;">
        <div>
          <label class="form-check-label" for="edit-25">25</label>
          <input class="text-input timer-settings-pb-input" size="9" name="edit-25" id="edit-25" type="text" />
        </div>
        <div>
          <label class="form-check-label" for="edit-50">50</label>
          <input class="text-input timer-settings-pb-input" size="9" name="edit-50" id="edit-50" type="text" />
        </div>
        <div>
          <label class="form-check-label" for="edit-100">100</label>
          <input class="text-input timer-settings-pb-input" size="9" name="edit-100" id="edit-100" type="text" />
        </div>
        <div>
          <label class="form-check-label" for="edit-ALL">ALL</label>
          <input class="text-input timer-settings-pb-input" size="9" name="edit-ALL" id="edit-ALL" type="text" />
        </div>
      </div>
    </div>
  </div>
</div>

<div class="timer-settings-section">
  <span class="timer-settings-section-title">Custom splits</span>
  <div id="edit-customsplit"></div>
  <div id="edit-split" style="margin-top:6px;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;">
    <label class="form-check-label" for="edit-splitscore">New Split</label>
    <input class="text-input timer-settings-pb-input" size="6" name="edit-splitscore" id="edit-splitscore" type="number" placeholder="Score" />
    <button class="btn timer-settings-btn" type="button" id="edit-addsplit">Add</button>
  </div>
</div>

<div class="timer-settings-section" id="edit-display">
  <span class="timer-settings-section-title">Display</span>
  <div style="display:flex;gap:20px;justify-content:center;align-items:center;flex-wrap:wrap;">
    <div style="display:flex;align-items:center;gap:8px;">
      <label class="form-check-label" for="edit-format">Timer Format</label>
      <select class="form-control timer-settings-input" id="edit-format" style="width:auto;display:inline-block;">
        <option value="0">0:00:00:000</option>
        <option value="1">  00:00:000</option>
        <option value="2">   0:00:000</option>
        <option value="3">     00:000</option>
        <option value="4">      0:000</option>
        <option value="5">0:00:00.000</option>
        <option value="6">  00:00.000</option>
        <option value="7">   0:00.000</option>
        <option value="8">     00.000</option>
        <option value="9">      0.000</option>
      </select>
    </div>
    <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" checked="true" name="edit-delta" id="edit-delta" />
      <label class="form-check-label" for="edit-delta">Show Delta</label>
    </div>
  </div>
  <span class="timer-settings-section-title" style="margin-top:10px;">Delta colors</span>
  <div style="display:inline-grid;grid-template-columns:auto auto;gap:6px 18px;justify-content:center;text-align:left;align-items:center;">
    <div><label class="form-check-label" for="edit-aheadg">Ahead (gaining)</label>
    <input class="text-input" style="margin:0 0 0 6px;padding:0;border:0;width:5vh;height:2.6vh;vertical-align:middle;" name="edit-aheadg" id="edit-aheadg" type="color" /></div>
    <div><label class="form-check-label" for="edit-aheadl">Ahead (losing)</label>
    <input class="text-input" style="margin:0 0 0 6px;padding:0;border:0;width:5vh;height:2.6vh;vertical-align:middle;" name="edit-aheadl" id="edit-aheadl" type="color" /></div>
    <div><label class="form-check-label" for="edit-behindg">Behind (gaining)</label>
    <input class="text-input" style="margin:0 0 0 6px;padding:0;border:0;width:5vh;height:2.6vh;vertical-align:middle;" name="edit-behindg" id="edit-behindg" type="color" /></div>
    <div><label class="form-check-label" for="edit-behindl">Behind (losing)</label>
    <input class="text-input" style="margin:0 0 0 6px;padding:0;border:0;width:5vh;height:2.6vh;vertical-align:middle;" name="edit-behindl" id="edit-behindl" type="color" /></div>
  </div>
</div>

<button type="button" class="btn timer-settings-btn timer-settings-btn-block" id="close-box">Close</button>
        `
        const backdrop = document.createElement('div')
        backdrop.id = 'edit-box-backdrop'
        backdrop.style.cssText =
          'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:999999;' +
          'background:rgba(0,0,0,0.45);'
        backdrop.addEventListener('click', closeEditBox)
        document.body.appendChild(backdrop)
        document.body.appendChild(editBox)
        document.getElementById('close-box').addEventListener('click', closeEditBox)

        if (typeof window.wireSpeedInfoTrackingControls === "function") {
          window.wireSpeedInfoTrackingControls(editBox)
        }

        const toggleDelta = document.getElementById('edit-delta')
        toggleDelta.checked = +_showDelta
        toggleDelta.addEventListener('change', function() {
          window._showDelta = +toggleDelta.checked
          localStorage._snake_show_delta = _showDelta

          if(_showDelta) {
            deltaDiv.style.display = ''
            // realTimerDiv.style.bottom = window.location.href.includes('fbx') ? '9px' : '13px'
          } else {
            deltaDiv.style.display = 'none'
            // realTimerDiv.style.bottom = '0px'
          }
        })


        const formatSelect = document.getElementById('edit-format')
        formatSelect.value = _format
        formatSelect.addEventListener('change', function() {
          window._format = +formatSelect.value
          localStorage._snake_timer_format = _format
          localStorage._snake_null_split = nullFormats[window._format]
        })

        const customSplitSectionDiv = document.getElementById('edit-customsplit')
        const newSplitInput = document.getElementById('edit-splitscore')
        newSplitInput.addEventListener('keydown', function() {
          setTimeout(function() {
            newSplitInput.value = newSplitInput.value.replace(/\D/g, '')
          }, 1)
        })
        document.getElementById('edit-addsplit').addEventListener('click', function() {
          const splitScore = document.getElementById('edit-splitscore').value
          if(!+splitScore) return

          const splitDiv = document.createElement('div')

          const splitName = `edit-${splitScore}`

          const splitLabel = document.createElement('label')
          splitLabel.for = splitName
          splitLabel.innerText = splitScore.toString().padStart(3, ' ') + ' '

          const splitInput = document.createElement('input')
          splitInput.className = 'text-input'
          splitInput.id = splitInput.name = splitName
          splitInput.size = 9
          splitInput.type = 'text'


          const splitDeleteButton = document.createElement('button')
          splitDeleteButton.innerText = 'Delete'
          splitDeleteButton.className = 'btn'
          splitDeleteButton.addEventListener('click', function() {
            splitDiv.remove()

            const _mode  = getSelected('#edit-mode',  'sel')
            const _count = getSelected('#edit-count', 'sel')
            const _speed = getSelected('#edit-speed', 'sel')
            const _size  = getSelected('#edit-size',  'sel')

            window._cat  = getSelected('#edit-cat',  'sel')

            delete _pb[_mode][_count][_speed][_size][_cat][splitScore]
            localStorage._snake_pb = JSON.stringify(_pb)
            while(_splits.includes(+splitScore)) {
              _splits.splice(_splits.indexOf(+splitScore), 1)
            }
            refreshSplitPanel()
          })

          if(!window._splits.includes(+splitScore)) window._splits.push(+splitScore)
          refreshSplitPanel()

          function handleChange() {
            const val = splitInput.value.split(':')
            let time = 0
            for(let i = 1; i <= val.length; i++) {
              let s = i === 1 ? 1 : i === 2 ? 60 : i === 3 ? 3600 : 0
              time += s * +val.at(-i)
            }


            const key = splitInput.name.replace('edit-', '')
            splitInput.className = 'text-input'

            const _mode  = getSelected('#edit-mode',  'sel')
            const _count = getSelected('#edit-count', 'sel')
            const _speed = getSelected('#edit-speed', 'sel')
            const _size  = getSelected('#edit-size',  'sel')

            window._cat  = getSelected('#edit-cat',   'sel')

            if(!_pb[_mode]) _pb[_mode] = {}
            if(!_pb[_mode][_count]) _pb[_mode][_count] = {}
            if(!_pb[_mode][_count][_speed]) _pb[_mode][_count][_speed] = {}
            if(!_pb[_mode][_count][_speed][_size]) _pb[_mode][_count][_speed][_size] = {}
            if(!_pb[_mode][_count][_speed][_size][_cat]) _pb[_mode][_count][_speed][_size][_cat] = {}
            _pb[_mode][_count][_speed][_size][_cat][key] = time || ''

            localStorage._snake_pb = JSON.stringify(_pb)
            refreshSplitPanel()


            splitInput.value = time === 0 ? '' : time.timeFormat()
          }
          handleChange()

          splitInput.addEventListener('keydown', function(evt) {
            if(evt.key === 'Escape' || evt.key === 'Enter') handleChange()

            setTimeout(function() {
              splitInput.value = splitInput.value.replace(/[^\d.:]/g, '')
            }, 1)
          })
          splitInput.addEventListener('change', handleChange)

          splitDiv.appendChild(splitLabel)
          splitDiv.appendChild(splitInput)
          splitDiv.appendChild(splitDeleteButton )

          customSplitSectionDiv.appendChild(splitDiv)

        })

        const divs = ['edit-mode', 'edit-count', 'edit-speed', 'edit-size'].map(q => document.getElementById(q))
        const selectors = ['#trophy', '#count', '#speed', '#size']
        for(let j = 0; j < 4; j++) {
          let temp = [...document.querySelector(selectors[j]).children]
          temp.forEach((q, i) => {
            if(_r = divs[j].children[i]) {
              _r.style.border = i === getSelected(selectors[j]) ? '0.5vh ridge #af4490ff' : '0.5vh ridge #00000000'
              _r.className = i === getSelected(selectors[j]) ? 'sel' : 'uns'
            }
          })
        }

        const cats = [...document.getElementById('edit-cat').children]
        cats.forEach((q, i) => {
          q.style.border = i === _cat ? '0.5vh ridge #af4490ff' : '0.5vh ridge #00000000'
          q.className = i === _cat ? 'sel' : 'uns'
        })


        for(const inp of document.getElementById('edit-times').children) {
          const el = inp.children[1]

          function handleChange() {
            const val = el.value.split(':')
            let time = 0
            for(let i = 1; i <= val.length; i++) {
              let s = i === 1 ? 1 : i === 2 ? 60 : i === 3 ? 3600 : 0
              time += s * +val.at(-i)
            }

            const key = el.name.replace('edit-', '')

            const _mode  = getSelected('#edit-mode',  'sel')
            const _count = getSelected('#edit-count', 'sel')
            const _speed = getSelected('#edit-speed', 'sel')
            const _size  = getSelected('#edit-size',  'sel')

            window._cat  = getSelected('#edit-cat',   'sel')

            if(!_pb[_mode]) _pb[_mode] = {}
            if(!_pb[_mode][_count]) _pb[_mode][_count] = {}
            if(!_pb[_mode][_count][_speed]) _pb[_mode][_count][_speed] = {}
            if(!_pb[_mode][_count][_speed][_size]) _pb[_mode][_count][_speed][_size] = {}
            if(!_pb[_mode][_count][_speed][_size][_cat]) _pb[_mode][_count][_speed][_size][_cat] = {}
            _pb[_mode][_count][_speed][_size][_cat][key] = time || ''

            localStorage._snake_pb = JSON.stringify(_pb)
            refreshSplitPanel()


            el.value = time === 0 ? '' : time.timeFormat()
          }

          el.addEventListener('keydown', function(evt) {
            if(evt.key === 'Escape' || evt.key === 'Enter') handleChange()

            setTimeout(function() {
              el.value = el.value.replace(/[^\d.:]/g, '')
            }, 1)
          })

          el.addEventListener('change', handleChange)
        }

        function updateToMode() {

          const _mode  = getSelected('#edit-mode',  'sel')
          const _count = getSelected('#edit-count', 'sel')
          const _speed = getSelected('#edit-speed', 'sel')
          const _size  = getSelected('#edit-size',  'sel')

          window._cat  = getSelected('#edit-cat',   'sel')

          const time = _pb[_mode] && _pb[_mode][_count] && _pb[_mode][_count][_speed] && _pb[_mode][_count][_speed][_size] && _pb[_mode][_count][_speed][_size][_cat] ? _pb[_mode][_count][_speed][_size][_cat] : {}

          for(const inp of document.getElementById('edit-times').children) {
            const el = inp.children[1]
            const key = el.name.replace('edit-', '')


            el.value = time[key] ? time[key].timeFormat() : ''

          }

          for(let i = customSplitSectionDiv.children.length - 1; i >= 0; i--) {
            customSplitSectionDiv.removeChild(customSplitSectionDiv.children[i])
          }

          for(const [_splitName, _splitTime] of Object.entries(time)) {
            if(!['25', '50', '100', 'ALL'].includes(_splitName)) {
              const splitDiv = document.createElement('div')
              const splitName = `edit-${_splitName}`

              const splitLabel = document.createElement('label')
              splitLabel.for = splitName
              splitLabel.innerText = _splitName.padStart(3, ' ') + ' '

              const splitInput = document.createElement('input')
              splitInput.id = splitInput.name = splitName
              splitInput.size = 9
              splitInput.type = 'text'
              splitInput.className = 'text-input'
              splitInput.value = +_splitTime ? _splitTime.timeFormat() : ''

              const splitDeleteButton = document.createElement('button')
              // splitDeleteButton.id = `delete-${splitName}`
              splitDeleteButton.innerText = 'Delete'
              splitDeleteButton.className = 'btn'
              splitDeleteButton.addEventListener('click', function() {
                splitDiv.remove()
                delete time[_splitName]
                delete _pb[_mode][_count][_speed][_size][_cat][_splitName]
                localStorage._snake_pb = JSON.stringify(_pb)
                while(window._splits.includes(+_splitName)) {
                  window._splits.splice(window._splits.indexOf(+_splitName), 1)
                }
                refreshSplitPanel()
              })

              if(!window._splits.includes(+_splitName)) window._splits.push(+_splitName)


              function handleChange() {
                const val = splitInput.value.split(':')
                let time = 0
                for(let i = 1; i <= val.length; i++) {
                  let s = i === 1 ? 1 : i === 2 ? 60 : i === 3 ? 3600 : 0
                  time += s * +val.at(-i)
                }

                const key = splitInput.name.replace('edit-', '')


                const _mode  = getSelected('#edit-mode',  'sel')
                const _count = getSelected('#edit-count', 'sel')
                const _speed = getSelected('#edit-speed', 'sel')
                const _size  = getSelected('#edit-size',  'sel')

                window._cat  = getSelected('#edit-cat',   'sel')

                if(!_pb[_mode]) _pb[_mode] = {}
                if(!_pb[_mode][_count]) _pb[_mode][_count] = {}
                if(!_pb[_mode][_count][_speed]) _pb[_mode][_count][_speed] = {}
                if(!_pb[_mode][_count][_speed][_size]) _pb[_mode][_count][_speed][_size] = {}
                if(!_pb[_mode][_count][_speed][_size][_cat]) _pb[_mode][_count][_speed][_size][_cat] = {}
                _pb[_mode][_count][_speed][_size][_cat][key] = time || ''

                localStorage._snake_pb = JSON.stringify(_pb)
                refreshSplitPanel()

                splitInput.value = time === 0 ? '' : time.timeFormat()
              }
              handleChange()

              splitInput.addEventListener('keydown', function(evt) {
                if(evt.key === 'Escape' || evt.key === 'Enter') handleChange()

                setTimeout(function() {
                  splitInput.value = splitInput.value.replace(/[^\d.:]/g, '')
                }, 1)
              })
              splitInput.addEventListener('change', handleChange)


              splitDiv.appendChild(splitLabel)
              splitDiv.appendChild(splitInput)
              splitDiv.appendChild(splitDeleteButton)

              customSplitSectionDiv.appendChild(splitDiv)

            }
          }
          refreshSplitPanel()
        }
        updateToMode()


        for(const id of ['edit-mode', 'edit-count', 'edit-speed', 'edit-size', 'edit-cat'])
          for(const opt of document.getElementById(id).children) {
            opt.addEventListener('click', function() {
              for(const opt1 of document.getElementById(id).children) {
                opt1.style.border = '0.5vh ridge #00000000'
                opt1.className = 'uns'
              }
              opt.style.border = '0.5vh ridge #af4490ff'
              opt.className = 'sel'

              updateToMode()
            })
          }



        for(const subid of ['aheadg', 'aheadl', 'behindg', 'behindl']) {
          // console.log(localStorage[subid])
          const el = document.getElementById(`edit-${subid}`)
          el.value = localStorage[`_snake_${subid}`]
          el.addEventListener('change', function() {
            localStorage[`_snake_${subid}`] = el.value
            if (typeof window.refreshSplitDeltaColors === "function") {
              window.refreshSplitDeltaColors()
            }
          })
        }





      }
    }





  },
  alterCode: function(code) {

    code = code.replace('"--:--:---"', 'localStorage._snake_null_split')
    code = code.replace('"25"', 'Math.min(25, ...(window._splits.length === 0 ? [25] : window._splits)) || 25')

    const resetFunction = code.match(
      /reset\(\)\n?{\n?this\n?\.\n?[a-zA-Z0-9_$]{1,8}\n?=\n?\[\];\n?var a\n?=\n?[a-zA-Z0-9_$]{1,8}\n?\(\n?this\n?\.\n?settings[^]*?\)\}\;/
    )[0]

    /*
    const modeKey = resetFunction.match(
      /0===this\.settings\.[a-zA-Z0-9_$]{1,8}/
    )[0].replace('0===this.settings.', '')
    const countKey = resetFunction.match(
      /2===this\.settings\.[a-zA-Z0-9_$]{1,8}/
    )[0].replace('2===this.settings.', '')
    const speedKey = code.match(
      /0!==a\.settings\.[a-zA-Z0-9_$]{1,8}\?-10:0/
    )[0].replace('0!==a.settings.', '').replace('?-10:0', '')
    const sizeKey = resetFunction.match(
      /1!==this\.settings\.[a-zA-Z0-9_$]{1,8}/
    )[0].replace('1!==this.settings.', '')
*/

    code = code.replace(resetFunction,
      resetFunction.replace(
        'reset(){',
        `reset(){this.xdddd=[];
          if (typeof window.flushSnakePb === "function") window.flushSnakePb();
          if (typeof window.freezeRunSelectors === "function") window.freezeRunSelectors();

          const _mode  = window._runTrophy
          const _count = window._runCount
          const _speed = window._runSpeed
          const _size  = window._runSize

          window._run = {}
          window._run[_mode] = {}
          window._run[_mode][_count] = {}
          window._run[_mode][_count][_speed] = {}
          window._run[_mode][_count][_speed][_size] = {}
          window._run[_mode][_count][_speed][_size][_cat] = {}


          if(!window._pb) window._pb = {}
          if(!window._pb[_mode]) window._pb[_mode] = {}
          if(!window._pb[_mode][_count]) window._pb[_mode][_count] = {}
          if(!window._pb[_mode][_count][_speed]) window._pb[_mode][_count][_speed] = {}
          if(!window._pb[_mode][_count][_speed][_size]) window._pb[_mode][_count][_speed][_size] = {}
          if(!window._pb[_mode][_count][_speed][_size][_cat]) window._pb[_mode][_count][_speed][_size][_cat] = {}

          for(let __ind = window._splits.length - 1; __ind >= 0; __ind--) {
            if(!window._pb[_mode][_count][_speed][_size][_cat][window._splits[__ind]]) {
              window._splits.splice(__ind, 1)
            }
          }

          for(let __key of Object.keys(window._pb[_mode][_count][_speed][_size][_cat])) {
            if(!['25','50','100','ALL'].includes(__key) && !window._splits.includes(+__key)) {
              window._splits.push(+__key)
            }
          }


          const deltaDiv = window._timerDeltaEl || document.getElementById('timerDelta')
          if (typeof window.setTimerDeltaDisplay === "function") window.setTimerDeltaDisplay(deltaDiv, '-', 'white')
          else if (deltaDiv) deltaDiv.textContent = '-'

          window._lastDelta = 0
          if (typeof window.SplitPanelOnReset === "function") window.SplitPanelOnReset()

        `
      )
    )


    const timeFormatFunction = code.match(
      /[a-zA-Z0-9_$]{1,8}=function\(a\){a=Math\.floor\(a\);if\(a<=0\)return[^]*?3,"0"\)}/
    )[0]


    code = code.replace(timeFormatFunction,
      timeFormatFunction.replace(
        'function(a){',
        `window._flj = function(a) {
          // Cache node; only rewrite when leading whitespace is present (avoid per-tick layout thrash)
          try {
            if (!window._splitTimeDivEl) {
              window._splitTimeDivEl = document.getElementsByClassName('Jc72He rc48Qb')[0].children[1]
            }
            const _el = window._splitTimeDivEl
            const _html = _el.innerHTML
            if (_html && /^[\\s\\u2000-\\u200B\\uFEFF]/.test(_html)) {
              _el.innerHTML = _html.trimStart()
            }
          } catch (e) {}
        `
      ).replace(
        '"00:00:000"',
        `['0:00:00:000', '00:00:000', '0:00:000', '00:000', '0:000', '0:00:00.000', '00:00.000', '0:00.000', '00.000', '0.000'][_format]`
      ).replace(
        'if(600<=b)return"9:59:59:999";',
        ''
      ).replace(
        'return(0===c?"":c.toString()+":")+(b%60).toString().padStart(2,"0")+":"+(Math.floor(a/1E3)%60).toString().padStart(2,"0")+":"+(a%1E3).toString().padStart(3,"0")',
        `
        const _hours = c === 0 ? "" : c.toString() + ":"
        const _minutes = b % 60
        const _seconds = (Math.floor(a / 1E3) % 60).toString()
        const _millis = (a % 1E3).toString().padStart(3, "0")
        return [
          c.toString() + ":" + _minutes.toString().padStart(2,"0") + ":" + _seconds.padStart(2,"0") + ":" + _millis,
          _hours + _minutes.toString().padStart(2,"0") + ":" + _seconds.padStart(2,"0") + ":" + _millis,
          _hours + _minutes.toString().padStart(2,_hours ? "0" : " ") + ":" + _seconds.padStart(2,"0") + ":" + _millis,
          _hours + (_minutes ? _minutes.toString().padStart(2,_hours ? "0" : " ") + ":" : _hours ? "00:" : "   ") + _seconds.padStart(2,"0") + ":" + _millis,
          _hours + (_minutes ? _minutes.toString().padStart(2,_hours ? "0" : " ") + ":" : _hours ? "00:" : "   ") + _seconds.padStart(2,_hours || _minutes ? "0" : " ") + ":" + _millis,

          c.toString() + ":" + _minutes.toString().padStart(2,"0") + ":" + _seconds.padStart(2,"0") + "." + _millis,
          _hours + _minutes.toString().padStart(2,"0") + ":" + _seconds.padStart(2,"0") + "." + _millis,
          _hours + _minutes.toString().padStart(2,_hours ? "0" : " ") + ":" + _seconds.padStart(2,"0") + "." + _millis,
          _hours + (_minutes ? _minutes.toString().padStart(2,_hours ? "0" : " ") + ":" : _hours ? "00:" : "   ") + _seconds.padStart(2,"0") + "." + _millis,
          _hours + (_minutes ? _minutes.toString().padStart(2,_hours ? "0" : " ") + ":" : _hours ? "00:" : "   ") + _seconds.padStart(2,_hours || _minutes ? "0" : " ") + "." + _millis,
        ][_format]`
      )
    )

    let score
    let ticks
    let dt
    let winTicks
    let winDt
    const stuffBlock = code.match(
      /[a-zA-Z0-9_$]{1,8}=this\.header,[a-zA-Z0-9_$]{1,8}=\n?this\.[a-zA-Z0-9_$]{1,8},[a-zA-Z0-9_$]{1,8}=this\.ticks,[a-zA-Z0-9_$]{1,8}=this\.[a-zA-Z0-9_$]{1,8};/
    )
    if (stuffBlock) {
      score = stuffBlock[0].match(/header,[a-zA-Z0-9_$]{1,8}=\n?this\.[a-zA-Z0-9_$]{1,8}/)[0].replace(/header,[a-zA-Z0-9_$]{1,8}=/,'')
      ticks = stuffBlock[0].match(/[a-zA-Z0-9_$]{1,8}=this\.ticks/)[0].replace(/[a-zA-Z0-9_$]{1,8}=/,'')
      dt    = stuffBlock[0].match(/ticks,[a-zA-Z0-9_$]{1,8}=this\.[a-zA-Z0-9_$]{1,8}/)[0].replace(/ticks,[a-zA-Z0-9_$]{1,8}=/,'')
      winTicks = ticks
      winDt = dt
    } else {
      // v13: 25/50/100 HUD lives in q7E=function(a,b,c,d){if(b===25...
      score = 'b'
      ticks = 'c'
      dt = 'd'
      const scoreCtor = code.match(
        /this\.header=[a-zA-Z0-9_$];this\.([a-zA-Z0-9_$]{1,8})=this\.([a-zA-Z0-9_$]{1,8})=this\.ticks=/
      )
      winTicks = 'this.ticks'
      winDt = scoreCtor ? ('this.' + scoreCtor[2]) : 'this.Fb'
    }



    const splitStuff = code.match(
      /if\(2?5?=?=?=?\n?[a-zA-Z0-9_$]{1,8}=?=?=?2?5?\|\|5?0?=?=?=?[a-zA-Z0-9_$]{1,8}=?=?=?5?0?\|\|1?0?0?=?=?=?[a-zA-Z0-9_$]{1,8}=?=?=?1?0?0?\)/
    )[0]

    code = code.replace(
      splitStuff,
      `
      if([25, 50, 100].includes(${score}) || window._splits.includes(${score})) {
        const deltaDiv = window._timerDeltaEl || document.getElementById('timerDelta')
        window._timerDeltaEl = deltaDiv
        const _sel = typeof window.getRunSelectors === "function"
          ? window.getRunSelectors()
          : { mode: getSelected('#trophy'), count: getSelected('#count'), speed: getSelected('#speed'), size: getSelected('#size') }
        const _mode  = _sel.mode
        const _count = _sel.count
        const _speed = _sel.speed
        const _size  = _sel.size

        const _split = ${ticks} * ${dt} * 1e-3

        window._run[_mode][_count][_speed][_size][_cat][${score}] = _split
        let _delta = NaN

        if(window._pb[_mode][_count][_speed][_size][_cat][${score}]) {
          _delta = _split - window._pb[_mode][_count][_speed][_size][_cat][${score}]
          const _absDeltaString = Math.abs(_delta).timeFormat()
          if(_delta !== 0) {
            const _dColor = localStorage[
              _delta > 0 ?
                _delta > _lastDelta ? '_snake_behindl' : '_snake_behindg'
              :
                _delta > _lastDelta ? '_snake_aheadl'  : '_snake_aheadg'
            ]
            if (typeof window.setTimerDeltaDisplay === "function")
              window.setTimerDeltaDisplay(deltaDiv, (_delta < 0 ? '-' : '+') + _absDeltaString, _dColor)
            else
              deltaDiv.innerHTML = ((_delta < 0 ? '-' : '+') + _absDeltaString).color(_dColor)
          } else if (typeof window.setTimerDeltaDisplay === "function") {
            window.setTimerDeltaDisplay(deltaDiv, '-', 'white')
          } else {
            deltaDiv.innerHTML = '-'.color('white')
          }



          window._lastDelta = _delta
        } else if (typeof window.setTimerDeltaDisplay === "function") {
          window.setTimerDeltaDisplay(deltaDiv, '-', 'white')
        } else {
          deltaDiv.innerHTML = '-'.color('white')
        }

        if(
          (
            (${score} === 25  && _cat === 0) ||
            (${score} === 50  && _cat === 1) ||
            (${score} === 100 && _cat === 2)
          ) && (
            !window._pb[_mode][_count][_speed][_size][_cat][${score}] ||
            _split - window._pb[_mode][_count][_speed][_size][_cat][${score}] < 0
          )
        ) {
          window._pb[_mode][_count][_speed][_size][_cat] = window._run[_mode][_count][_speed][_size][_cat]
          if (typeof window.markSnakePbDirty === "function") window.markSnakePbDirty()
          else localStorage._snake_pb = JSON.stringify(window._pb)
        }

        if (typeof window.SplitPanelOnSplit === "function") window.SplitPanelOnSplit(${score}, _split, _delta)




      }


      if([25, 50, 100].includes(${score}) || window._splits.includes(${score}))

      `
    )

    const winStuff = code.match(
      /_\.[a-zA-Z0-9_$]{1,8}\([a-zA-Z0-9_$]{1,8}\.[a-zA-Z0-9_$]{1,8},"ALL"\);/
    )[0]

    code = code.replace(
      winStuff,
      `
      ${winStuff}
      const deltaDiv = window._timerDeltaEl || document.getElementById('timerDelta')
      window._timerDeltaEl = deltaDiv
      const _sel = typeof window.getRunSelectors === "function"
        ? window.getRunSelectors()
        : { mode: getSelected('#trophy'), count: getSelected('#count'), speed: getSelected('#speed'), size: getSelected('#size') }
      const _mode  = _sel.mode
      const _count = _sel.count
      const _speed = _sel.speed
      const _size  = _sel.size

      const _time = ${winTicks} * ${winDt} * 1e-3

      let _delta = NaN

      window._run[_mode][_count][_speed][_size][_cat]['ALL'] = _time
      if(window._pb[_mode][_count][_speed][_size][_cat]['ALL']) {
        _delta = _time - window._pb[_mode][_count][_speed][_size][_cat]['ALL']
        const _absDeltaString = Math.abs(_delta).timeFormat()
        if(_delta !== 0) {
          const _dColor = localStorage[
            _delta > 0 ?
              _delta > _lastDelta ? '_snake_behindl' : '_snake_behindg'
            :
              _delta > _lastDelta ? '_snake_aheadl'  : '_snake_aheadg'
          ]
          if (typeof window.setTimerDeltaDisplay === "function")
            window.setTimerDeltaDisplay(deltaDiv, (_delta < 0 ? '-' : '+') + _absDeltaString, _dColor)
          else
            deltaDiv.innerHTML = ((_delta < 0 ? '-' : '+') + _absDeltaString).color(_dColor)
        } else if (typeof window.setTimerDeltaDisplay === "function") {
          window.setTimerDeltaDisplay(deltaDiv, '-', 'white')
        } else {
          deltaDiv.innerHTML = '-'.color('white')
        }
      } else if (typeof window.setTimerDeltaDisplay === "function") {
        window.setTimerDeltaDisplay(deltaDiv, '-', 'white')
      } else {
        deltaDiv.innerHTML = '-'.color('white')
      }

      if(_delta < 0 || isNaN(_delta)) {
        window._pb[_mode][_count][_speed][_size][_cat] = window._run[_mode][_count][_speed][_size][_cat]
        if (typeof window.persistSnakePb === "function") window.persistSnakePb()
        else localStorage._snake_pb = JSON.stringify(window._pb)
      }

      if (typeof window.SplitPanelOnSplit === "function") window.SplitPanelOnSplit("ALL", _time, _delta)



      `
    )

    return code
  }
}
