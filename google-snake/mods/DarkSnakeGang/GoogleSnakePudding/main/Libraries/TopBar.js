window.TopBar = {};

window.TopBar.make = function () {

  // Code that runs before anything else here, loading variables, etc.
  // Recommended to use "window." for things
  window.getImgFromElement = function getImgFromElement(element) {
    return element.replace('class=', '').replace('width=', '').replace('height=', '').split('=')[1].split('"')[1];
  }

 // window.topbar_icons = true;
  window.count_setting = 0;
  window.speed_setting = 0;

  window.toggle_topbar_icons = function () {
    window.pudding_settings.TopBar = !window.pudding_settings.TopBar;
    if (typeof window.saveSettings === "function") {
      window.saveSettings();
    }
    if (typeof window.apply_topbar_icons === "function") {
      window.apply_topbar_icons();
    }
  }

  window.setup_topbar_checkbox = function () {
    const settingsBox = document.getElementById("settings-popup-pudding");
    const topbarCheckbox = (settingsBox && settingsBox.querySelector("#TopBarIcons"))
      || document.getElementById("TopBarIcons");
    if (!topbarCheckbox) return;
    if (topbarCheckbox.dataset.topbarBound === "1") {
      topbarCheckbox.checked = !!window.pudding_settings.TopBar;
      return;
    }
    topbarCheckbox.addEventListener("change", window.toggle_topbar_icons);
    topbarCheckbox.checked = !!window.pudding_settings.TopBar;
    topbarCheckbox.dataset.topbarBound = "1";
  };

  window.setup_topbar_checkbox();

}

window.TopBar.alterCode = function (code) {

  window.count_img_arr = Array.from(document.querySelector('#count').children).map(el=>el.src);
  window.speed_img_arr = Array.from(document.querySelector('#speed').children).map(el=>el.src);
  const appleRoot = document.querySelector('#apple');
  window.apple_img_arr = appleRoot ? Array.from(appleRoot.children).map(el => el.src) : [];

  window.getSelectorRowIndex = function (selectorId) {
    const elementList = document.getElementById(selectorId);
    if (!elementList || !elementList.children.length) return 0;
    let number = 0;
    const classNames = [];
    let notUnique = "";
    for (const element of elementList.children) {
      if (classNames.indexOf(element.className) === -1) {
        classNames.push(element.className);
      } else {
        notUnique = element.className;
        break;
      }
    }
    for (const element of elementList.children) {
      if (element.className !== notUnique) return number;
      number++;
    }
    return 0;
  };

  window.apply_topbar_icons = function () {
    if (typeof window.control_mute_img !== "function") return;
    if (!window.speed_img_arr || !window.count_img_arr) return;

    const daily = !!window.daily_challenge;
    const topBar = !!(window.pudding_settings && window.pudding_settings.TopBar) && !daily;

    let speedIdx = 0;
    let countIdx = 0;
    if (window.timeKeeper && typeof window.timeKeeper.getCurrentSetting === "function") {
      try {
        speedIdx = window.timeKeeper.getCurrentSetting("speed");
        countIdx = window.timeKeeper.getCurrentSetting("count");
      } catch (e) { /* settings refs may be unavailable early */ }
    }

    const speedSrc = window.speed_img_arr[speedIdx] || window.speed_img_arr[0];
    window.control_mute_img(topBar, speedSrc);

    if (!window.fruit_jsname) return;
    const fruitImg = document.querySelector('[jsname="' + window.fruit_jsname + '"]');
    if (!fruitImg) return;

    if (topBar) {
      fruitImg.src = window.count_img_arr[countIdx] || window.count_img_arr[0];
      return;
    }

    if (window.apple_img_arr && window.apple_img_arr.length) {
      const appleIdx = window.getSelectorRowIndex("apple");
      fruitImg.src = window.apple_img_arr[appleIdx] || window.apple_img_arr[0];
    }
  };

  count_regex = new RegExp(/case "count"\:[a-zA-Z0-9_$]{1,8}\.[a-zA-Z0-9_$]{1,8}\.[a-zA-Z0-9_$]{1,8}/)
  speed_regex = new RegExp(/case "speed"\:[a-zA-Z0-9_$]{1,8}\.[a-zA-Z0-9_$]{1,8}\.[a-zA-Z0-9_$]{1,8}/)
  size_regex = new RegExp(/case "size"\:[a-zA-Z0-9_$]{1,8}\.[a-zA-Z0-9_$]{1,8}\.[a-zA-Z0-9_$]{1,8}/)

  count_ref = code.match(count_regex)[0].split('.')[2]
  speed_ref = code.match(speed_regex)[0].split('.')[2]
  size_ref = code.match(size_regex)[0].split('.')[2]

  settings_reference = code.match(count_regex)[0].split(':')[1].split('.')[0] + '.' + code.match(count_regex)[0].split('.')[1]

  //set_count_code = `$&${count_var}=`
  //set_speed_code = `$&${speed_var}=`

  code = code.assertReplace(/switch\(b\){case "apple"\:/, `window.set_ref = ${settings_reference}; $&`);

  count_var = `window.set_ref.${count_ref}`
  speed_var = `window.set_ref.${speed_ref}`
  size_var = `window.set_ref.${size_ref}`


  //code = code.assertReplace(count_regex, set_count_code);
  //code = code.assertReplace(speed_regex, set_speed_code);

  fruit_jsname = document.querySelector('[src$="apple_00.png"]').getAttribute("jsname")
  window.fruit_jsname = fruit_jsname;
  fruit_src = `document.querySelector('[jsname="${fruit_jsname}"]').src `

  window.mute_divs = document.querySelectorAll('[aria-label="Mute"]');
  window.mute_default_innerHTML = [];
  for (let i = 0; i < window.mute_divs.length; i++) {
    window.mute_default_innerHTML[i] = window.mute_divs[i].innerHTML;
  }
  window.mute_speed_element = document.createElement('img');
  window.mute_speed_element.classList.add('EFcTud')
  window.mute_speed_element.src = "https://www.google.com/logos/fnbx/snake_arcade/v3/speed_00.png"
  window.mute_speed_element.style.padding = '0px';
  window.mute_speed_copy = window.mute_speed_element.cloneNode(true);

  window.control_mute_img = function control_mute_img(TopBar, SpeedSrc) {
    if (!window.mute_divs || !window.mute_divs.length) return;
    if (TopBar) {
      for (let index = 0; index < window.mute_divs.length; index++) {
        const element = window.mute_divs[index];
        element.innerHTML = ''
      }
      window.mute_speed_element.src = SpeedSrc
      window.mute_speed_copy.src = SpeedSrc
      window.mute_divs[0].appendChild(window.mute_speed_element)
      if (window.mute_divs[1]) {
        window.mute_divs[1].appendChild(window.mute_speed_copy)
      }
      return;
    }
    for (let index = 0; index < window.mute_divs.length; index++) {
      const element = window.mute_divs[index];
      element.innerHTML = window.mute_default_innerHTML[index]
    }
  }

  reset_regex = new RegExp(/;this\.reset\(\)\}\}/)

  set_on_reset = `;
  if (window.pudding_settings.TopBar && !window.daily_challenge) {
    ${fruit_src} = window.count_img_arr[${count_var}]
  }
  window.control_mute_img(window.pudding_settings.TopBar, window.speed_img_arr[${speed_var}])
  if(window.daily_challenge){
    window.control_mute_img(false, window.speed_img_arr[${speed_var}])
  }
  $&`
  code = code.assertReplace(reset_regex, set_on_reset)

  window.set_ref = {};
  eval(speed_var + `=0`)
  eval(count_var + `=0`)
  eval(size_var + `=0`)

  window.apply_topbar_icons();

  return code;
}
