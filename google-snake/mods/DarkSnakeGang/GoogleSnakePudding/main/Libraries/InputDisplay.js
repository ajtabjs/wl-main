window.InputDisplay = {};

window.InputDisplay.make = function () {

  // Bottom reserved strip in Speed Info — same region as the old D-pad.
  const section =
    document.getElementById("input-display-section") ||
    window.speedinfoInput ||
    document.getElementById("speedinfo-popup-pudding");

  const pad = document.createElement("div");
  pad.id = "input-display-container";
  pad.style =
    "display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;width:100%;z-index:10001;line-height:normal;";
  section.appendChild(pad);

  const btnBase =
    "border-radius:8px;font-size:28px;color:white;display:none;background-color:#1155CC;font-family:Roboto,Arial,sans-serif;vertical-align:middle;text-align:center;line-height:40px;width:44px;height:40px;box-sizing:border-box;flex-shrink:0;";

  function makeBtn(id, label) {
    const el = document.createElement("div");
    el.className = "input-button";
    el.id = id;
    el.style.cssText = btnBase;
    el.textContent = label;
    return el;
  }

  const topBtn = makeBtn("top-button-id", "↑");
  pad.appendChild(topBtn);

  const row = document.createElement("div");
  row.style = "display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;";
  row.appendChild(makeBtn("left-button-id", "←"));
  row.appendChild(makeBtn("down-button-id", "↓"));
  row.appendChild(makeBtn("right-button-id", "→"));
  pad.appendChild(row);

  function syncInputSectionVisibility() {
    const sec = document.getElementById("input-display-section");
    if (!sec) return;
    const on = !!(window.pudding_settings && window.pudding_settings.InputDisplay);
    // flex so the D-pad can center horizontally and sit on the bottom edge
    sec.style.display = on ? "flex" : "none";
  }

  let first_time_checker = true;
  window.toggle_input_display = function toggle_input_display() {
    // First call syncs from saved settings without flipping the flag
    if (first_time_checker) {
      first_time_checker = false;
    } else {
      window.pudding_settings.InputDisplay = !window.pudding_settings.InputDisplay;
    }

    const ids = ["left-button-id", "down-button-id", "right-button-id", "top-button-id"];
    if (window.pudding_settings.InputDisplay) {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        el.style.display = "inline-block";
        el.style.visibility = "visible";
      }
    } else {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        el.style.display = "none";
      }
    }
    syncInputSectionVisibility();
  };

  window.LightInputOn = function (direction) {
    if (window.button_color == "#FFFFFF" || window.button_color == "white") {
      document.getElementById(direction).style.backgroundColor = "#999999";
    }
    document.getElementById(direction).style.backgroundColor = incrementColor(window.button_color);
  };

  window.LightInputOff = function (direction) {
    document.getElementById(direction).style.backgroundColor = window.button_color;
  };

  function incrementColor(hexColor) {
    return (
      "#" +
      hexColor.slice(1).replace(/../g, (char) => {
        const incrementedValue = parseInt(char, 16) + 32;
        return incrementedValue > 255 ? "FF" : incrementedValue.toString(16).padStart(2, "0");
      })
    );
  }
};
window.InputDisplay.alterCode = function (code) {

  // Code to alter snake code here
  document.addEventListener('keydown', (event)=> {
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable)) return;

    if (event.key === 'ArrowRight' || (event.code === 'KeyD')){

      window.LightInputOn("right-button-id");
      //console.log('aaaaaas')
    }
    else if (event.key === 'ArrowLeft' || (event.code === 'KeyA')) {
      window.LightInputOn("left-button-id");
    }
    else if (event.key === 'ArrowDown' || (event.code === 'KeyS')) {
      window.LightInputOn("down-button-id");
    }
    else if (event.key === 'ArrowUp' || (event.code === 'KeyW')) {
      window.LightInputOn("top-button-id");
    }
  });

  document.addEventListener('keyup', (event)=> {
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable)) return;

    if (event.key === 'ArrowRight' || (event.code === 'KeyD')){
      window.LightInputOff("right-button-id");
    }
    else if (event.key === 'ArrowLeft' || (event.code === 'KeyA')) {
      window.LightInputOff("left-button-id");
    }
    else if (event.key === 'ArrowDown' || (event.code === 'KeyS')) {
      window.LightInputOff("down-button-id");
    }
    else if (event.key === 'ArrowUp' || (event.code === 'KeyW')) {
      window.LightInputOff("top-button-id");
    }
  });

  return code;
}
