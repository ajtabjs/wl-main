window.Core = {};

window.Core.make = function () {

    /// Code inspired by fishes, aka copy-pasted
    window.uiImage = function (src) {
        let img = new Image();
        img.src = src;
        img.classList.add('DqMRee');
        img.classList.add('SsAred'); // Hardcoded, need to figure out what this is and how to make it dynamic or something.
        return img;
    };

    //document.body.style.overflow = 'hidden'; // Hide scroll bar

    window.escapeRegex = function (string) {
        return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    window.graphics_selected = 0;

    daily_button = document.querySelector('[jsname="Prvkrf"]');
    window.daily_challenge = false

    // Options for the Intersection Observer
    var options = {
        root: null, // Use the viewport as the root
        threshold: 0.5 // Trigger when 50% of the element is visible
    };

    // Callback function to handle intersection changes
    function handleIntersection(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // The element is now visible
                window.daily_challenge = false;
            }
        });
    }

    // Create an Intersection Observer
    var observer = new IntersectionObserver(handleIntersection, options);

    // Start observing the button
    observer.observe(daily_button);

    daily_button.addEventListener("click", function() {
        window.daily_challenge = true;
        window.first_time_call = true;
      });

}

window.Core.alterCode = function (code) {

    if (code.match(/loaded_/) !== null) {
        console.log(code);
        console.log("Google experiment detected, please provide the above text to Yarmiplay by pressing copy ^^^");
        window.loaded_code = true;
      }
      else {
        window.loaded_code = false;
      }

    return code;
}
window.Theme = {};

window.Theme.make = function () {

  // style for all pudding sidebar overlays
  window.puddingSidebarStyle = 'position:absolute;left:100%;z-index:10000;background-color:#4a752c;padding:8px;display:block;border-radius:3px;width:220px;height:584px;top:0px;overflow:hidden;';
  window.puddingSidebarStyleLeft = 'position:absolute;right:100%;left:auto;z-index:10000;background-color:#4a752c;padding:8px;display:block;border-radius:3px;width:220px;height:584px;top:0px;overflow:hidden;';

  let advancedSettings = JSON.parse(localStorage.getItem('snakeAdvancedSettings')) ?? {};

  window.themes = [
    {
      name: 'Default Sun',
      light_tiles: '#aad751',
      dark_tiles: '#a2d149',
      shadow: '#94bd46',
      border: '#578a34',
      key_block_sign_color: '#38640e',
      real_top_bar: '#4a752c',
      endscreen_background: '#4dc1f9',
      sep_color: '#7eccfa',
      topbar_color: '#3a91bb',
      buttons_color: '#1155CC',
      bg_color: '#4dc1f9',
      bottom_color: '#4dc1f9'
    },
    {
      name: 'Official Dark',
      light_tiles: '#494351',
      dark_tiles: '#443e4c',
      shadow: '#3d3644',
      border: '#2c2730',
      key_block_sign_color: '#453d4d',
      real_top_bar: '#262428',
      endscreen_background: '#2a2640',
      sep_color: '#363438',
      topbar_color: '#111111',
      buttons_color: '#111111',
      bg_color: '#262428',
      bottom_color: '#262428'
    },
    {
      name: 'Snow',
      light_tiles: '#deeced',
      dark_tiles: '#d1e4e6',
      shadow: '#b9d4d5',
      border: '#879fa1',
      key_block_sign_color: '#506486',
      real_top_bar: '#75898a',
      endscreen_background: '#8cbfd9',
      sep_color: '#85999a',
      topbar_color: '#677f91',
      buttons_color: '#677f91',
      bg_color: '#75898a',
      bottom_color: '#75898a'
    },
    {
      name: 'Volcano',
      light_tiles: '#6e3535',
      dark_tiles: '#673232',
      shadow: '#633131',
      border: '#a33e3e',
      key_block_sign_color: '#642b2b',
      real_top_bar: '#762d2d',
      endscreen_background: '#292e4c',
      sep_color: '#863d3d',
      topbar_color: '#a33e3e',
      buttons_color: '#a33e3e',
      bg_color: '#762d2d',
      bottom_color: '#762d2d'
    },
    {
      name: 'Desert',
      light_tiles: '#f2d78c',
      dark_tiles: '#eccd79',
      shadow: '#e6c770',
      border: '#977b26',
      key_block_sign_color: '#594d26',
      real_top_bar: '#725e1d',
      endscreen_background: '#5fb7e3',
      sep_color: '#826e2d',
      topbar_color: '#977b26',
      buttons_color: '#977b26',
      bg_color: '#725e1d',
      bottom_color: '#725e1d'
    },
    {
      name: 'Official Jungle',
      light_tiles: '#3f5543',
      dark_tiles: '#3b4f3f',
      shadow: '#334737',
      border: '#253227',
      key_block_sign_color: '#354b38',
      real_top_bar: '#202822',
      endscreen_background: '#2b375a',
      sep_color: '#303832',
      topbar_color: '#253227',
      buttons_color: '#253227',
      bg_color: '#202822',
      bottom_color: '#202822'
    },
    {
      name: 'Pool',
      light_tiles: '#b4d0f9',
      dark_tiles: '#a3c5f5',
      shadow: '#94baf0',
      border: '#275ba5',
      key_block_sign_color: '#11325f',
      real_top_bar: '#1d457c',
      endscreen_background: '#42a5f0',
      sep_color: '#2d558c',
      topbar_color: '#275ba5',
      buttons_color: '#1155CC',
      bg_color: '#1d457c',
      bottom_color: '#1d457c'
    },
    {
      name: 'Space',
      light_tiles: '#432c68',
      dark_tiles: '#3d285d',
      shadow: '#3a2956',
      border: '#604096',
      key_block_sign_color: '#3f305a',
      real_top_bar: '#432a6f',
      endscreen_background: '#32224f',
      sep_color: '#533a7f',
      topbar_color: '#604096',
      buttons_color: '#604096',
      bg_color: '#432a6f',
      bottom_color: '#432a6f'
    },
    {
      name: "Globe",
      sep_color: '#7eccfa',
      topbar_color: '#3a91bb',
      real_top_bar: '#4a752c',
      buttons_color: '#1155CC',
      bg_color: '#4dc1f9',
      bottom_color: '#4dc1f9'
    },
    {
      name: 'True Dark',
      light_tiles: '#1D1D1D',
      dark_tiles: '#161616',
      shadow: '#111111',
      border: '#000000',
      key_block_sign_color: '#1D1D1D',
      real_top_bar: '#111111',
      endscreen_background: '#000000',
      sep_color: '#212121',
      topbar_color: '#000000',
      buttons_color: '#000000',
      bg_color: '#111111',
      bottom_color: '#111111'
    },
    {
      name: 'Planeptune',
      light_tiles: '#d0b4f9',
      dark_tiles: '#c5a3f5',
      shadow: '#ba94f0',
      border: '#5b27a5',
      key_block_sign_color: '#32115f',
      real_top_bar: '#451d7c',
      endscreen_background: '#a542f0',
      sep_color: '#6b37b5',
      topbar_color: '#5b27a5',
      buttons_color: '#5b27a5',
      bg_color: '#a542f0',
      bottom_color: '#a542f0'
    },
    {
      name: 'Lastation',
      light_tiles: '#0050b0',
      dark_tiles: '#0059b9',
      shadow: '#003478',
      border: '#000c30',
      key_block_sign_color: '#0050b0',
      real_top_bar: '#000220',
      endscreen_background: '#000C30',
      sep_color: '#101230',
      topbar_color: '#01055C',
      buttons_color: '#01055C',
      bg_color: '#000c30',
      bottom_color: '#000c30'
    },
    {
      name: 'Pacman',
      light_tiles: '#1D1D1D',
      dark_tiles: '#161616',
      shadow: '#000000',
      border: '#0805c6',
      key_block_sign_color: '#000000',
      real_top_bar: '#080576',
      endscreen_background: '#000000',
      sep_color: '#000000',
      topbar_color: '#0805c6',
      buttons_color: '#0605a6',
      bg_color: '#000000',
      bottom_color: '#000000'
    },
    {
      name: 'Sonic',
      light_tiles: '#B25900',
      dark_tiles: '#A05000',
      shadow: '#333333',
      border: '#124f00',
      key_block_sign_color: '#0f81d8',
      real_top_bar: '#2bb800',
      endscreen_background: '#0f81d8',
      sep_color: '#1f91e8',
      topbar_color: '#124f00',
      buttons_color: '#124f00',
      bg_color: '#0f81d8',
      bottom_color: '#0f81d8'
    },
    {
      name: 'Jungle',
      light_tiles: '#499D43',
      dark_tiles: '#36982F',
      shadow: '#336E2B',
      border: '#335B36',
      key_block_sign_color: '#36982F',
      real_top_bar: '#476C42',
      endscreen_background: '#13867E',
      sep_color: '#47724C',
      topbar_color: '#133B26',
      buttons_color: '#133B26',
      bg_color: '#37623C',
      bottom_color: '#37623C'
    },
    {
      name: 'Pudding',
      light_tiles: '#ffef4f',
      dark_tiles: '#ffdf3f',
      shadow: '#dfbf1f',
      border: '#a55229',
      key_block_sign_color: '#ffdf3f',
      real_top_bar: '#853209',
      endscreen_background: '#853209',
      sep_color: '#efcf2f',
      topbar_color: '#752209',
      buttons_color: '#752209',
      bg_color: '#dfbf1f',
      bottom_color: '#dfbf1f'
    },
    {
      name: 'Ice',
      light_tiles: '#57DDFF',
      dark_tiles: '#57D5F4',
      shadow: '#57B0C7',
      border: '#006080',
      key_block_sign_color: '#57D5F4',
      real_top_bar: '#00495C',
      endscreen_background: '#00E1E6',
      sep_color: '#10C1C6',
      topbar_color: '#00293C',
      buttons_color: '#00293C',
      bg_color: '#00B1B6',
      bottom_color: '#00B1B6'
    },
    {
      name: "ModLoader",
      light_tiles: advancedSettings.themeCol1 ?? '#1D1D1D',
      dark_tiles: advancedSettings.themeCol2 ?? '#161616',
      shadow: advancedSettings.themeCol3 ?? '#111111',
      border: advancedSettings.themeCol4 ?? '#000000',
      key_block_sign_color: advancedSettings.themeCol5 ?? '#1D1D1D',
      real_top_bar: advancedSettings.themeCol6 ?? '#111111',
      endscreen_background: advancedSettings.themeCol7 ?? '#000000',
      sep_color: '#7eccfa',
      topbar_color: '#3a91bb',
      buttons_color: '#1155CC',
      bg_color: '#4dc1f9',
      bottom_color: '#4dc1f9'
    }

  ];

  for (let src of [
    'https://i.postimg.cc/R0R1ZMNx/dark-night.png',
    'https://i.postimg.cc/t4bxfYzt/planeptune.png',
    'https://i.postimg.cc/T2rc2X5Y/Lastation-Logo.png',
    'https://i.postimg.cc/C53WfD61/pacman.png',
    'https://i.postimg.cc/8PLc5bjq/sonic-theme.png',
    'https://i.postimg.cc/6Q2DyGbK/jungle.png',
    'https://i.postimg.cc/5y7gwwGY/pudding-cr.png',
    'https://i.postimg.cc/1XqLvbhJ/Ice2.png',
    'https://i.postimg.cc/HLr5YJmb/modloader-icon.png',
    'https://i.postimg.cc/cCr9LrNZ/neptune-planet.png',
  ]) document.querySelector('#theme').appendChild(uiImage(src));

}

window.Theme.alterCode = function (code) {
  /*light tiles
    dark tiles
    shadow
    border
    key block sign color
    top bar
    endscreen background*/
  //console.log("Adding new themes")

  // Settings topbar: zFl3vb
  // Settings background: wXSCdb
  // Settings buttons: FL0z2d

  window.ui_topbar = document.getElementsByClassName('zFl3vb');
  window.ui_background = document.getElementsByClassName('sXu3u');
  window.ui_buttons = document.getElementsByClassName('FL0z2d');
  window.ui_topbar.style = '';
  window.ui_background.style = '';
  window.ui_buttons.style = '';
  window.ui_sep = document.getElementsByClassName('e1XC2b');
  window.ui_sep.style = '';
  window.ui_bottom = document.getElementsByClassName('T7SB3d');
  window.ui_bottom.style = '';

  window.boot_button = document.getElementsByClassName('btn');
  window.boot_check = document.getElementsByClassName('form-check-input');
  window.boot_dropdown = document.getElementsByClassName('form-control');
  window.input_button = document.getElementsByClassName('input-button');

  window.real_topbar_color = "#4a752c";
  window.button_color = "#1155CC";

  // ChatGPT wrote this crap
  function getAttributesByName(themeName) {
    const theme = window.themes.find((theme) => theme.name === themeName);
    if (theme) {
      const { name, set_theme, ...attributes } = theme;
      return attributes;
    }
    return null; // Return null if theme doesn't exist
  }

  window.setTheme = function (theme_name) {

    loop_array = [
      { loop_on: window.ui_sep, attribute: "borderBottomColor", color: "sep_color" },
      { loop_on: window.ui_topbar, attribute: "background", color: "topbar_color" },
      { loop_on: window.ui_buttons, attribute: "background", color: "buttons_color" },
      { loop_on: window.input_button, attribute: "background", color: "buttons_color" },
      { loop_on: window.ui_background, attribute: "background", color: "bg_color" },
      { loop_on: window.ui_bottom, attribute: "background", color: "bottom_color" },
      { loop_on: window.boot_button, attribute: "backgroundColor", color: "buttons_color" },
      { loop_on: window.boot_check, attribute: "backgroundColor", color: "buttons_color" },
      { loop_on: window.boot_dropdown, attribute: "backgroundColor", color: "buttons_color" },
    ]

    const themeAttributes = getAttributesByName(theme_name);
    if (themeAttributes) {
      // Extract individual attribute values using destructuring
      // ChatGPT wrote this crap
      var {
        light_tiles,
        dark_tiles,
        shadow,
        border,
        key_block_sign_color,
        real_top_bar,
        endscreen_background,
        sep_color,
        topbar_color,
        buttons_color,
        bg_color,
        bottom_color,
      } = themeAttributes;
    }

    for (let element of loop_array) {
      for (let h of element["loop_on"]) {
        eval("h.style." + element["attribute"] + " = " + element["color"] + ";")
      }
    }

    document.getElementById('settings-popup-pudding').style.background = real_top_bar;
    document.getElementById('speedinfo-popup-pudding').style.background = real_top_bar;
    const splitPanel = document.getElementById('split-panel-pudding');
    if (splitPanel) splitPanel.style.background = real_top_bar;
    const portalPanel = document.getElementById('fruit-bowl-popup-pudding') || document.getElementById('portal-pairs-popup-pudding');
    if (portalPanel) {
      portalPanel.style.background = real_top_bar;
      portalPanel.style.backgroundColor = real_top_bar;
    }

    window.real_topbar_color = real_top_bar;
    window.button_color = buttons_color;

    if (theme_name != "Globe") {
      window.snake.setCustomTheme(light_tiles, dark_tiles, shadow, border, key_block_sign_color, real_top_bar, endscreen_background)
    }
    else {
      window.snake.clearCustomTheme();
    }

    if (localStorage.getItem('snakeChosenMod') === "VisibilityMod" || window.isVisi) {
      document.getElementById('delete-stuff-draggable').style.backgroundColor = border;
      document.getElementById('delete-stuff-draggable').style.borderColor = border;

      document.getElementById('drag-handle').style.borderColor = border;

      document.getElementById('visi-title').style.backgroundColor = real_top_bar;
      document.getElementById('visi-boxes').style.backgroundColor = real_top_bar;
      document.getElementById('flash-snake-timing').style.backgroundColor = buttons_color;

    }


  }

  window.getRandomThemeName = function getRandomThemeName() {
    const filteredThemes = window.themes.filter((theme) => theme.name !== 'Globe' && theme.name !== 'ModLoader');
    const randomIndex = Math.floor(Math.random() * filteredThemes.length);
    return filteredThemes[randomIndex].name;
  }

  window.randomTheme = false;

  code = code.assertReplace(/case "theme":/, `case "theme":
  if(d<window.themes.length){window.randomTheme = false;window.setTheme(window.themes[d].name);}
  else{window.randomTheme = true;window.setTheme(window.getRandomThemeName());};
  `)

  reset_regex = new RegExp(/;this\.reset\(\)\}\}/)

  set_on_reset = `;
  if(window.randomTheme){window.setTheme(window.getRandomThemeName());}
  $&`
  code = code.assertReplace(reset_regex, set_on_reset)
  return code;
}
window.ModeRegistry = {};

// Known middle modes (between Classic and Peaceful). Peaceful/Classic/Blender are positional.
window.ModeRegistry.MIDDLE = [
    { id: "wall", label: "Wall", trophySrcHints: ["trophy_01"], bitIndexV3: 0 },
    { id: "portal", label: "Portal", trophySrcHints: ["trophy_02"], bitIndexV3: 1 },
    { id: "cheese", label: "Cheese", trophySrcHints: ["trophy_03"], bitIndexV3: 2 },
    { id: "borderless", label: "Borderless", trophySrcHints: ["trophy_04"], bitIndexV3: 3 },
    { id: "twin", label: "Twin", trophySrcHints: ["trophy_05"], bitIndexV3: 4 },
    { id: "winged", label: "Winged", trophySrcHints: ["trophy_06"], bitIndexV3: 5 },
    { id: "yin_yang", label: "Yin Yang", trophySrcHints: ["trophy_07"], bitIndexV3: 6 },
    { id: "key", label: "Key", trophySrcHints: ["trophy_08"], bitIndexV3: 7 },
    { id: "sokoban", label: "Sokoban", trophySrcHints: ["trophy_09"], bitIndexV3: 8 },
    { id: "poison", label: "Poison", trophySrcHints: ["trophy_10"], bitIndexV3: 9 },
    { id: "dimension", label: "Dimension", trophySrcHints: ["trophy_11"], bitIndexV3: 10 },
    { id: "minesweeper", label: "Minesweeper", trophySrcHints: ["trophy_12"], bitIndexV3: 11 },
    { id: "statue", label: "Statue", trophySrcHints: ["trophy_13"], bitIndexV3: 12 },
    { id: "light", label: "Light", trophySrcHints: ["trophy_14"], bitIndexV3: 13 },
    { id: "shield", label: "Shield", trophySrcHints: ["/v16/trophy_15"], bitIndexV3: 14 },
    { id: "arrow", label: "Arrow", trophySrcHints: ["/v17/trophy_15"], bitIndexV3: 15 },
    { id: "hotdog", label: "Hotdog", trophySrcHints: ["trophy_16"], bitIndexV3: 16 },
    { id: "magnet", label: "Magnet", trophySrcHints: ["trophy_17"], bitIndexV3: 17 },
    { id: "gate", label: "Gate", trophySrcHints: ["trophy_18"], bitIndexV3: 18 },
    { id: "bridge", label: "Bridge", trophySrcHints: ["trophy_19"], bitIndexV3: 19 },
];

window.ModeRegistry.LABELS = (function () {
    const map = { classic: "Classic", peaceful: "Peaceful", blender: "Blender" };
    for (const m of window.ModeRegistry.MIDDLE) map[m.id] = m.label;
    return map;
})();

window.ModeRegistry._byBitV3 = (function () {
    const map = Object.create(null);
    for (const m of window.ModeRegistry.MIDDLE) map[m.bitIndexV3] = m.id;
    map[20] = "peaceful"; // v3 bitstring: Peaceful was last bit before Blender
    return map;
})();

window.ModeRegistry._matchMiddleId = function (src) {
    if (!src) return null;
    const s = String(src);
    for (const m of window.ModeRegistry.MIDDLE) {
        for (const hint of m.trophySrcHints) {
            if (s.includes(hint)) return m.id;
        }
    }
    return null;
};

window.ModeRegistry._provisionalId = function (src, index) {
    if (src) {
        const m = String(src).match(/trophy_(\d+)/i);
        if (m) return "trophy_" + m[1];
    }
    return "unknown_" + index;
};

window.ModeRegistry._trophySrc = function (child) {
    const img = child && (child.querySelector && child.querySelector("img"));
    return img ? img.src : "";
};

window.ModeRegistry.listActiveModes = function () {
    const root = document.getElementById("trophy");
    if (!root || !root.children || root.children.length === 0) {
        return [{ id: "classic", label: "Classic", index: 0 }];
    }
    const children = [...root.children];
    const last = children.length - 1;
    const used = new Set();
    const list = [];

    for (let i = 0; i < children.length; i++) {
        let id;
        if (i === 0) {
            id = "classic";
        } else if (i === last) {
            id = "blender";
        } else if (i === last - 1) {
            id = "peaceful";
        } else {
            const src = window.ModeRegistry._trophySrc(children[i]);
            id = window.ModeRegistry._matchMiddleId(src);
            // Fallback: expected slot among middle modes when layout matches catalog length
            if (!id) {
                const middleSlot = i - 1; // index into MIDDLE
                if (middleSlot >= 0 && middleSlot < window.ModeRegistry.MIDDLE.length) {
                    id = window.ModeRegistry.MIDDLE[middleSlot].id;
                } else {
                    id = window.ModeRegistry._provisionalId(src, i);
                }
            }
            if (used.has(id)) id = window.ModeRegistry._provisionalId(src, i);
        }
        used.add(id);
        list.push({
            id,
            label: window.ModeRegistry.LABELS[id] || id,
            index: i,
        });
    }
    return list;
};

window.ModeRegistry.has = function (id) {
    return window.ModeRegistry.listActiveModes().some((m) => m.id === id);
};

window.ModeRegistry.labelModeKey = function (key) {
    if (!key) return "Classic";
    if (key === "classic") return "Classic";
    if (key.indexOf("+") === -1) {
        return window.ModeRegistry.LABELS[key] || key;
    }
    return key.split("+").map((id) => window.ModeRegistry.LABELS[id] || id).join(", ");
};

window.ModeRegistry.bitstringV3ToModeKey = function (bits) {
    if (!bits || typeof bits !== "string") return "classic";
    if (!/^[01]+$/.test(bits)) return "classic";
    const ids = [];
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] === "1") {
            ids.push(window.ModeRegistry._byBitV3[i] || ("unknown_bit_" + i));
        }
    }
    if (ids.length === 0) return "classic";
    if (ids.length === 1) return ids[0];
    return ids.slice().sort().join("+");
};

// Reverse of bitstringV3ToModeKey — 21-char string for v11 / Bridge-era scrapers
window.ModeRegistry.modeKeyToBitstringV3 = function (modeKey) {
    const bits = new Array(21).fill("0");
    if (!modeKey || modeKey === "classic") return bits.join("");
    const ids = String(modeKey).split("+");
    const idToBit = Object.create(null);
    for (const bit of Object.keys(window.ModeRegistry._byBitV3)) {
        idToBit[window.ModeRegistry._byBitV3[bit]] = Number(bit);
    }
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (id === "classic" || id === "blender") continue;
        const bit = idToBit[id];
        if (typeof bit === "number" && bit >= 0 && bit < 21) bits[bit] = "1";
    }
    return bits.join("");
};

// Drop Bridge bit (index 19) so Peaceful stays last — 20-char string for v10
window.ModeRegistry.bitstringV3ToV2 = function (bits21) {
    if (!bits21 || typeof bits21 !== "string") return "00000000000000000000";
    if (bits21.length < 21) {
        const s = (bits21 + "00000000000000000000").slice(0, 20);
        return s;
    }
    return bits21.slice(0, 19) + bits21.slice(20);
};

window.ModeRegistry.isBitstringModePart = function (modePart) {
    return typeof modePart === "string" && /^[01]{20,21}$/.test(modePart);
};

window.ModeRegistry._blenderSelectedIds = function (modes) {
    // Blender UI: find random.png row and read which mode toggles are selected
    let element = null;
    for (const i of document.querySelectorAll("img")) {
        if (i.src && i.src.includes("random.png")) {
            element = i;
            break;
        }
    }
    if (!element) return [];
    try {
        const row = element.parentElement.parentElement.parentElement;
        const ids = [];
        let counter = -1;
        for (const child of row.children) {
            counter++;
            if (counter === 0) continue;
            const selected =
                child.firstElementChild &&
                child.firstElementChild.classList.length > 1 &&
                child.firstElementChild.children.length > 0;
            if (!selected) continue;
            // Map blender toggle order to modes excluding classic/blender: indices 1..n-2 of trophy list
            const modeIndex = counter; // 1-based into middle+peaceful relative to old scrape
            // Prefer matching by mode list: blender toggles align with trophies 1..last-1
            const trophyModes = modes.filter((m) => m.id !== "classic" && m.id !== "blender");
            const entry = trophyModes[counter - 1];
            if (entry) ids.push(entry.id);
        }
        return ids;
    } catch (e) {
        return [];
    }
};

window.ModeRegistry.getCurrentModeKey = function () {
    const modes = window.ModeRegistry.listActiveModes();
    if (!modes.length) return "classic";

    let selectedIndex = 0;
    if (window.timeKeeper && typeof window.timeKeeper.getCurrentSetting === "function") {
        selectedIndex = window.timeKeeper.getCurrentSetting("trophy");
    } else {
        // Fallback: odd-class-out on #trophy
        const root = document.getElementById("trophy");
        if (root) {
            const classNames = [];
            let notUnique = "";
            for (const el of root.children) {
                if (classNames.indexOf(el.className) === -1) classNames.push(el.className);
                else {
                    notUnique = el.className;
                    break;
                }
            }
            let n = 0;
            for (const el of root.children) {
                if (el.className !== notUnique) {
                    selectedIndex = n;
                    break;
                }
                n++;
            }
        }
    }

    if (selectedIndex < 0 || selectedIndex >= modes.length) selectedIndex = 0;
    const selected = modes[selectedIndex];

    if (selected.id === "classic") return "classic";
    if (selected.id !== "blender") return selected.id;

    const combo = window.ModeRegistry._blenderSelectedIds(modes);
    if (!combo.length) return "blender";
    return combo.slice().sort().join("+");
};

window.ModeRegistry.make = function () {
    window.isBridge = window.ModeRegistry.has("bridge");
};

window.ModeRegistry.alterCode = function (code) {
    return code;
};
window.DistinctVisual = {};

window.DistinctVisual.make = function () {

    window.toggle_skull_func = function toggle_skull_func() {
        window.pudding_settings.Skull = !window.pudding_settings.Skull;
    }

    window.toggle_soko_goal = function toggle_soko_goal() {
        window.pudding_settings.SokoGoals = !window.pudding_settings.SokoGoals;
    }

    function i(src) {
        let img = new Image();
        img.src = src;
        img.crossOrigin = 'Anonymous';
        img.width = img.height = 128;
        return img;
    }

    window.skull = i('https://www.google.com/logos/fnbx/snake_arcade/v12/trophy_10.png');
    window.px_skull = i('https://www.google.com/logos/fnbx/snake_arcade/pixel/px_trophy_10.png');
    window.real_skull = i('https://i.postimg.cc/prstgqbL/poison-skull.png');
    window.ghost_skull = i('https://i.postimg.cc/DZqL146Z/poison-ghost.png');
    window.px_ghost_skull = i('https://i.postimg.cc/cLF34LtP/px-poison-ghost.png');

    // window.skull_toggle = false;
    // window.soko_toggle = true;

    window.distinct_soko_goal = new Image();
    window.distinct_soko_goal.src = 'https://i.postimg.cc/x11nt4Pb/box-distinct-soko-goals.png';
    window.distinct_soko_goal.currentSrc = 'https://i.postimg.cc/x11nt4Pb/box-distinct-soko-goals.png';
    window.distinct_soko_goal.crossOrigin = "Anonymous";

    window.distinct_soko_goal_px = new Image();
    window.distinct_soko_goal_px.src = 'https://i.postimg.cc/NFnWqP35/px-box-red.png';
    window.distinct_soko_goal_px.currentSrc = 'https://i.postimg.cc/NFnWqP35/px-box-red.png';
    window.distinct_soko_goal_px.crossOrigin = "Anonymous";

}

window.DistinctVisual.alterCode = function (code) {

    realism_draw = new RegExp(/function\(a,b\){switch.*{d/);
    catchError(realism_draw, code);
    realism_switch = code.match(realism_draw)[0];

    realism_path = new RegExp(/function\(a,b\){switch.*}}/);
    catchError(realism_path, code);
    last_path = code.match(realism_path)[0].split('.')[9].split('}')[0]

    get_graphics = realism_switch.split(':')[1].split(')')[0];

    window.drawing_apple = true;

    get_apple_stuff = new RegExp(/(?:let|const|var).*[a-zA-Z0-9_$]{1,8}\.canvas\:.*\([a-zA-Z0-9_$]{1,8}\.[a-zA-Z0-9_$]{1,8}\);/)
    catchError(get_apple_stuff, code);
    poison_default = code.match(get_apple_stuff)[0]
    b_graphics = poison_default.split('(')[2].split(')')[0]

    get_apple_code = `
    if(window.pudding_settings.Skull){
        b.type = ${poison_default.split('?')[1].split('=')[1]} ? ${poison_default.split('<')[1].split('?')[0]} - 1 : b.type;
    }
    ${poison_default}
    `

    code = code.assertReplace(get_apple_stuff, get_apple_code)

    disable_real_grey = new RegExp(/\(f=[a-zA-Z0-9_$]{1,8}.[a-zA-Z0-9_$]{1,8}\)==null\|\|[a-zA-Z0-9_$]{1,8}\(f,b,c,-1\)/)
    catchError(disable_real_grey, code);
    real_grey = code.match(disable_real_grey)[0]
    real_grey_path = real_grey.split(')')[0].split('=')[1]

    new_grey_code = `
    if (${real_grey_path} && ${real_grey_path}.path.includes("poison-skull")) {
        ${real_grey.slice(0, -1).slice(0, -1).slice(0, -1)}0)
    }
    else {
        ${real_grey}
    }
    `

    code = code.assertReplace(disable_real_grey, new_grey_code)

    // Match only the box goal creation. v12 puts the sequence.png creation on the
    // same line just before it, which a greedy match swallows — that truncated the
    // rebuilt call and grabbed the sequence property instead of the box one.
    sokondeez = new RegExp(/this\.[a-zA-Z0-9_$]{1,8}=new [a-zA-Z0-9_$]{1,8}\(this\.[a-zA-Z0-9_$]{1,8},"[^"]*box[^"]*",\d+,this\.[a-zA-Z0-9_$]{1,8},"[^"]*"\)/)
    catchError(sokondeez, code);
    sokondeez_code = code.match(sokondeez)[0]

    sokondeez_nuts = `
    window.SokoRef=this;
    window.DefaultSokoGoal=${sokondeez_code};
    window.DistinctSokoFinal=${sokondeez_code.split('=')[1].split('"')[0]} "${window.distinct_soko_goal.src}" ${sokondeez_code.split('"')[2]} "${window.distinct_soko_goal_px.src}" ${sokondeez_code.split('"')[4]}
    `

    code = code.assertReplace(sokondeez, sokondeez_nuts)

    reset_regex = new RegExp(/;this\.reset\(\)\}\}/)

    set_on_reset = `;
    if (window.pudding_settings.SokoGoals) {
        window.SokoRef.${sokondeez_code.split('=')[0].split('.')[1]} = window.DistinctSokoFinal;
    }
    else {
        window.SokoRef.${sokondeez_code.split('=')[0].split('.')[1]} = window.DefaultSokoGoal;
    }
    $&`
    code = code.assertReplace(reset_regex, set_on_reset)

    return code;
}
window.SettingsSaver = {};

window.SettingsSaver.make = function () {
    const COUNT_KEYS = ["0", "1", "2", "3", "4", "5", "6"];
    const COUNT_MINIMA = { 0: 1, 1: 3, 2: 5, 3: 10, 4: 6, 5: 24, 6: 5 };
    const PUDDING_SETTINGS_VERSION = 1;

    const GAME_SETTING_KEYS = [
        "trophy",
        "count",
        "speed",
        "size",
        "graphics",
        "theme",
        "color",
        "apple",
    ];

    // v12/v13 share the same menu rows today; caps are fallbacks when DOM is not ready yet.
    const FALLBACK_ROW_LIMITS = {
        trophy: 25,
        count: 7,
        speed: 3,
        size: 3,
        graphics: 7,
        theme: 24,
        color: 24,
        apple: 50,
    };

    function getSelectorRowLength(selectorId) {
        const row = document.getElementById(selectorId);
        return row && row.children ? row.children.length : 0;
    }

    function clampSettingIndex(index, maxLen) {
        let i = Number(index);
        if (isNaN(i) || i < 0) return 0;
        if (!maxLen || maxLen <= 0) return i;
        return Math.min(i, maxLen - 1);
    }

    function nativeGraphicsCount() {
        return window.nativeGraphicsCount || 4;
    }

    // Pair-mix slots (indices >= native count) map back to a native style if mix icons are missing.
    function fallbackNativeGraphics(savedIndex) {
        const n = nativeGraphicsCount();
        const g = Number(savedIndex);
        if (isNaN(g) || g < 0) return 0;
        if (g < n - 1) return g;
        const pools = {};
        pools[n - 1] = 0;
        pools[n] = 0;
        pools[n + 1] = 1;
        pools[n + 2] = 0;
        return Object.prototype.hasOwnProperty.call(pools, g) ? pools[g] : 0;
    }

    function requiredGraphicsRowLength(savedGraphics) {
        const g = Number(savedGraphics);
        if (isNaN(g) || g < 0) return nativeGraphicsCount();
        const n = nativeGraphicsCount();
        if (g < n) return n;
        return n + 3;
    }

    function graphicsRowReady(savedGraphics) {
        const len = getSelectorRowLength("graphics");
        if (!len) return false;
        return len >= requiredGraphicsRowLength(savedGraphics);
    }

    function sanitizeSavedGameSettings(snap, options) {
        if (!snap || typeof snap !== "object") return snap;
        const out = Object.assign({}, snap);
        const savedRows = out._rowLengths && typeof out._rowLengths === "object" ? out._rowLengths : null;
        const allowGraphicsFallback = !!(options && options.allowGraphicsFallback);

        for (const key of GAME_SETTING_KEYS) {
            if (typeof out[key] !== "number" || isNaN(out[key])) continue;

            let maxLen = getSelectorRowLength(key);
            if (!maxLen && savedRows && typeof savedRows[key] === "number") {
                maxLen = savedRows[key];
            }
            if (!maxLen && FALLBACK_ROW_LIMITS[key]) {
                maxLen = FALLBACK_ROW_LIMITS[key];
            }

            if (key === "graphics" && maxLen && out[key] >= nativeGraphicsCount()) {
                if (allowGraphicsFallback && maxLen < requiredGraphicsRowLength(out[key])) {
                    out[key] = fallbackNativeGraphics(out[key]);
                } else {
                    out[key] = clampSettingIndex(out[key], maxLen);
                }
            } else if (maxLen) {
                out[key] = clampSettingIndex(out[key], maxLen);
            }
        }

        return out;
    }

    function defaultPoolForCount(count) {
        const min = COUNT_MINIMA[count] || 1;
        const pool = [];
        for (let i = 0; pool.length < min; i++) {
            if (i === 24) continue; // skip fruit bowl
            pool.push(i);
        }
        return pool;
    }

    function migrateSelectedPairsByCount(settings) {
        if (settings.SelectedPairsByCount && typeof settings.SelectedPairsByCount === "object") {
            for (const key of COUNT_KEYS) {
                if (!Array.isArray(settings.SelectedPairsByCount[key])) {
                    settings.SelectedPairsByCount[key] = defaultPoolForCount(Number(key));
                }
            }
            return settings;
        }

        const legacy = Array.isArray(settings.SelectedPairs) ? settings.SelectedPairs.map(Number) : null;
        settings.SelectedPairsByCount = {};
        for (const key of COUNT_KEYS) {
            const count = Number(key);
            const min = COUNT_MINIMA[count];
            // Seed each count with only its own minimum slice of the old shared list
            const seed = legacy ? legacy.slice(0, min) : defaultPoolForCount(count);
            const pool = Array.from(new Set(seed.map(Number).filter((n) => !isNaN(n) && n !== 24)));
            for (let i = 0; pool.length < min; i++) {
                if (i === 24) continue;
                if (!pool.includes(i)) pool.push(i);
            }
            settings.SelectedPairsByCount[key] = pool;
        }
        return settings;
    }

    function migratePuddingSettings(settings) {
        if (!settings || typeof settings !== "object") return settings;

        if (typeof settings.StorageVersion !== "number") {
            settings.StorageVersion = PUDDING_SETTINGS_VERSION;
        }

        settings = migrateSelectedPairsByCount(settings);
        settings.SelectedPairs = settings.SelectedPairsByCount["0"];

        if (settings.SavedGameSettings && typeof settings.SavedGameSettings === "object") {
            settings.SavedGameSettings = sanitizeSavedGameSettings(settings.SavedGameSettings, {
                allowGraphicsFallback: true,
            });
        }

        settings.StorageVersion = PUDDING_SETTINGS_VERSION;
        return settings;
    }

    window.loadSettings = function () {
        let pudding_settings = localStorage.getItem('PuddingSettings');
        if (pudding_settings === null) {
            pudding_settings = {
                StorageVersion: PUDDING_SETTINGS_VERSION,
                Skull: false,
                SokoGoals: true,
                InputDisplay: false,
                TopBar: true,
                SpeedInfo: false,
                ShowWrHolders: true,
                TrackedPlayerName: "",
                PortalPairs: false,
                AlwaysUniqueFruit: false,
                SelectedPairs: defaultPoolForCount(0),
                SelectedPairsByCount: {},
                DisableRandom: false,
                randomizeThemeApple: false,
                ScrollBar: false,
                SaveGameSettings: true,
                SavedGameSettings: null,
                SplitPanel: false,
            };
            for (const key of COUNT_KEYS) {
                pudding_settings.SelectedPairsByCount[key] = defaultPoolForCount(Number(key));
            }
        } else {
            pudding_settings = JSON.parse(pudding_settings);
            const needsPersist = typeof pudding_settings.StorageVersion !== "number";
            if (typeof pudding_settings.PortalPairs !== 'boolean') {
                pudding_settings.PortalPairs = false;
            }
            if (typeof pudding_settings.AlwaysUniqueFruit !== 'boolean') {
                pudding_settings.AlwaysUniqueFruit = false;
            }
            if (typeof pudding_settings.ScrollBar !== 'boolean') {
                pudding_settings.ScrollBar = false;
            }
            if (typeof pudding_settings.ShowWrHolders !== 'boolean') {
                pudding_settings.ShowWrHolders = true;
            }
            if (typeof pudding_settings.TrackedPlayerName !== 'string') {
                pudding_settings.TrackedPlayerName = "";
            }
            if (typeof pudding_settings.SaveGameSettings !== 'boolean') {
                pudding_settings.SaveGameSettings = true;
            }
            if (typeof pudding_settings.SplitPanel !== 'boolean') {
                pudding_settings.SplitPanel = false;
            }
            if (
                pudding_settings.SavedGameSettings !== null &&
                typeof pudding_settings.SavedGameSettings !== 'object'
            ) {
                pudding_settings.SavedGameSettings = null;
            }
            pudding_settings = migratePuddingSettings(pudding_settings);
            if (needsPersist) {
                window._puddingSettingsNeedsPersist = true;
            }
        }

        return pudding_settings;
    }
    window.pudding_settings = window.loadSettings();
    if (window._puddingSettingsNeedsPersist && typeof window.saveSettings === "function") {
        window.saveSettings();
        window._puddingSettingsNeedsPersist = false;
    }

    window.saveSettings = function () {
        const s = window.pudding_settings;
        if (typeof s !== 'undefined' &&
            typeof s.Skull !== 'undefined' &&
            typeof s.SokoGoals !== 'undefined' &&
            typeof s.InputDisplay !== 'undefined' &&
            typeof s.TopBar !== 'undefined' &&
            typeof s.SpeedInfo !== 'undefined' &&
            typeof s.PortalPairs !== 'undefined' &&
            typeof s.DisableRandom !== 'undefined' &&
            typeof s.randomizeThemeApple !== 'undefined'
        ) {
            localStorage.setItem('PuddingSettings', JSON.stringify(s));
        }
    }

    // Read selected child index for a Google Snake selector row
    window.readGameSettingIndex = function (selectorId) {
        const root = document.getElementById(selectorId);
        if (!root || !root.children || !root.children.length) return 0;

        // Selected icon uses tuJOWd (optionally with other classes)
        for (let i = 0; i < root.children.length; i++) {
            const el = root.children[i];
            const cls = el.className || "";
            if (cls === "tuJOWd" || cls === "DqMRee tuJOWd" || cls === "DqMRee") return i;
            if (el.classList && el.classList.contains("tuJOWd")) return i;
        }

        // Odd-class-out (trophy / count style)
        const classNames = [];
        let notUnique = "";
        for (const el of root.children) {
            if (classNames.indexOf(el.className) === -1) classNames.push(el.className);
            else {
                notUnique = el.className;
                break;
            }
        }
        if (notUnique) {
            let n = 0;
            for (const el of root.children) {
                if (el.className !== notUnique) return n;
                n++;
            }
        }
        return 0;
    };

    window.clickGameSettingIndex = function (selectorId, index) {
        let i = Number(index);
        if (isNaN(i) || i < 0) i = 0;

        // Google's p7 selector (scroll + settings object). Child .click() does not stick.
        if (typeof window.puddingMenuSelect === "function") {
            return window.puddingMenuSelect(selectorId, i);
        }
        return false;
    };

    window._openSnakeSettingsPanel = function () {
        const gear =
            document.querySelector('div[jsname="iyH4Cb"]') ||
            document.querySelector('div[jsname^="iyH4Cb"]');
        if (gear && typeof gear.click === "function") {
            gear.click();
            return true;
        }
        return false;
    };

    window._closeSnakeSettingsPanel = function () {
        // Native back control uses class p17HVe
        const back =
            document.querySelector(".p17HVe") ||
            document.querySelector('[class^="p17HVe"]') ||
            document.querySelector('[class*="p17HVe"]');
        if (back && typeof back.click === "function") {
            back.click();
            return true;
        }
        return false;
    };

    window.saveCurrentGameSettings = function () {
        if (!window.pudding_settings) return;
        const snap = {};
        for (const key of GAME_SETTING_KEYS) {
            snap[key] = window.readGameSettingIndex(key);
        }
        // Prefer live vars when DOM class detection is ambiguous
        if (typeof window.graphics_selected === "number") {
            snap.graphics = window.graphics_selected;
        }
        if (typeof window.fruit_selected === "number") {
            snap.apple = window.fruit_selected;
        }
        snap._rowLengths = {};
        for (const key of GAME_SETTING_KEYS) {
            const len = getSelectorRowLength(key);
            if (len) snap._rowLengths[key] = len;
        }
        snap._nativeGraphicsCount = nativeGraphicsCount();
        window.pudding_settings.SavedGameSettings = sanitizeSavedGameSettings(snap, {
            allowGraphicsFallback: false,
        });
        if (typeof window.saveSettings === "function") window.saveSettings();
    };

    window.applySavedGameSettingsOnce = function () {
        if (window._puddingGameSettingsApplied) return;

        const s = window.pudding_settings;
        if (!s || !s.SaveGameSettings) {
            window._puddingGameSettingsApplied = true;
            return;
        }
        let snap = s.SavedGameSettings;
        if (!snap || typeof snap !== "object") {
            window._puddingGameSettingsApplied = true;
            return;
        }
        snap = sanitizeSavedGameSettings(snap, { allowGraphicsFallback: false });

        const gear =
            document.querySelector('div[jsname="iyH4Cb"]') ||
            document.querySelector('div[jsname^="iyH4Cb"]');
        const trophy = document.getElementById("trophy");
        const p7Ready = typeof window._puddingSnakeP7 === "function";

        if (!gear || !trophy || !trophy.children || !trophy.children.length || !p7Ready) {
            if (typeof window._puddingGameSettingsApplyTries !== "number") {
                window._puddingGameSettingsApplyTries = 0;
            }
            window._puddingGameSettingsApplyTries++;
            if (window._puddingGameSettingsApplyTries > 100) {
                window._puddingGameSettingsApplied = true;
                return;
            }
            setTimeout(window.applySavedGameSettingsOnce, 50);
            return;
        }

        window._puddingGameSettingsApplied = true;

        // Open settings → wait until menu is live → apply via p7 → back (p17HVe).
        window._openSnakeSettingsPanel();

        const order = [
            "trophy",
            "count",
            "speed",
            "size",
            "graphics",
            "theme",
            "color",
            "apple",
        ];

        let waitTries = 0;
        function waitMenuThenApply() {
            waitTries++;
            const menu = window._puddingSnakeMenu;
            const ready =
                menu &&
                menu.oa === "settings" &&
                typeof window._puddingSnakeP7 === "function";

            if (!ready) {
                if (waitTries > 80) {
                    // Still try back so we don't leave settings open
                    window._closeSnakeSettingsPanel();
                    return;
                }
                setTimeout(waitMenuThenApply, 50);
                return;
            }

            if (typeof snap.graphics === "number" && snap.graphics >= nativeGraphicsCount()) {
                if (typeof window.appendPairGraphicsIcons === "function") {
                    window.appendPairGraphicsIcons();
                }
                if (!graphicsRowReady(snap.graphics)) {
                    if (waitTries > 80) {
                        snap = sanitizeSavedGameSettings(snap, { allowGraphicsFallback: true });
                    } else {
                        setTimeout(waitMenuThenApply, 50);
                        return;
                    }
                }
            }

            for (const key of order) {
                if (typeof snap[key] === "number") {
                    window.puddingMenuSelect(key, snap[key]);
                }
            }

            setTimeout(function () {
                window._closeSnakeSettingsPanel();
            }, 100);
        }

        setTimeout(waitMenuThenApply, 50);
    };

    // Public helper used after alterCode exposes Google's selector.
    window.puddingMenuSelect = function (id, index) {
        const menu = window._puddingSnakeMenu;
        const p7 = window._puddingSnakeP7;
        if (!menu || typeof p7 !== "function") return false;
        const row =
            (menu.ka && menu.ka.iW && menu.ka.iW.get(id)) ||
            document.getElementById(id);
        if (!row || !row.children || !row.children.length) return false;
        let i = Number(index);
        if (isNaN(i) || i < 0) i = 0;
        if (i >= row.children.length) i = row.children.length - 1;
        p7(menu, row, true, i);
        return true;
    };
}

window.SettingsSaver.alterCode = function (code) {
    reset_regex = new RegExp(/;this\.reset\(\)\}\}/)

    settings_reset_code = `
    saveSettings();
    $&`

    catchError(reset_regex, code)
    code = code.assertReplace(reset_regex, settings_reset_code);

    stop_regex = new RegExp(/stop\(a\){/)
    catchError(stop_regex, code)
    save_settings_code = `stop\(a\){saveSettings();`

    code = code.assertReplace(stop_regex, save_settings_code);

    // Expose Google's menu selector (p7). Child element .click() does not change settings;
    // selection is scroll-position based and writes a.settings.* inside this function.
    const menuSelectRegex = /([a-zA-Z0-9_$]{1,8})=function\(a,b,c,d=-1\)\{d=d!==-1\?d:([a-zA-Z0-9_$]{1,8})\(a,b\);for\(var e=0;e<b\.children\.length/;
    catchError(menuSelectRegex, code);
    code = code.assertReplace(
        menuSelectRegex,
        `$1=window._puddingSnakeP7=function(a,b,c,d=-1){window._puddingSnakeMenu=a;d=d!==-1?d:$2(a,b);for(var e=0;e<b.children.length`
    );

    // Capture menu when native settings open (Ec).
    const openSettingsRegex = /([a-zA-Z0-9_$]{1,8})\(\)\{var a=this\.menu;a\.oa="settings";/;
    catchError(openSettingsRegex, code);
    code = code.assertReplace(
        openSettingsRegex,
        `$1(){var a=this.menu;window._puddingSnakeMenu=a;a.oa="settings";`
    );

    return code;
}
window.Counter = {};

window.Counter.make = function () {
    window.loadStatistics = function () {
        let stats = localStorage.getItem('inputCounterMod');
        if (stats === null) {
            stats = {
                visible: true,
                statShown: 'inputs',
                statDurationShown: 'game',
                inputs: {
                    game: 0,
                    session: 0,
                    lifetime: 0
                },
                plays: {
                    session: 0,
                    lifetime: 0
                },
                apples: {
                    session: 0,
                    lifetime: 0
                }
            };
        } else {
            stats = JSON.parse(stats);
        }

        if (typeof stats.apples === 'undefined') {
            stats.apples = {
                session: 0,
                lifetime: 0
            }
        }

        //Make sure these get reset
        stats.inputs.game = 0;
        stats.inputs.session = 0;
        stats.plays.session = 0;
        stats.apples.session = 0;
        stats.visible = true;

        stats.walls = {
            game: 0
        };

        stats.hide = {
            count: ""
        };

        return stats;
    }
    window.stats = window.loadStatistics();
    window.saveStatistics = function () {
        if (typeof stats !== 'undefined' &&
            typeof stats.statShown !== 'undefined' &&
            typeof stats.statDurationShown !== 'undefined' &&
            typeof stats.inputs !== 'undefined' &&
            typeof stats.plays !== 'undefined' &&
            typeof stats.inputs.game !== 'undefined' &&
            typeof stats.inputs.session !== 'undefined' &&
            typeof stats.inputs.lifetime !== 'undefined' &&
            typeof stats.plays.session !== 'undefined' &&
            typeof stats.plays.lifetime !== 'undefined' &&
            typeof stats.apples.session !== 'undefined' &&
            typeof stats.apples.lifetime !== 'undefined' &&
            typeof stats.visible !== 'undefined'
        ) {
            localStorage.setItem('inputCounterMod', JSON.stringify(stats));
        }
    }
    window.updateCounterDisplay = function () {
        divList.innerHTML = stats[stats.statShown][stats.statDurationShown];
    }
    window.promptToResetStats = function () {
        let userResponse = prompt('Type DELETE to reset all stats. Cannot be undone');
        if (userResponse === 'DELETE') {
            localStorage.removeItem('inputCounterMod');
            stats = {
                visible: true,
                statShown: 'inputs',
                statDurationShown: 'game',
                inputs: {
                    game: 0,
                    session: 0,
                    lifetime: 0
                },
                plays: {
                    session: 0,
                    lifetime: 0
                },
                apples: {
                    session: 0,
                    lifetime: 0
                }
            };
            saveStatistics();
            updateCounterDisplay();
            alert('All stats have been reset');
        } else {
            alert('Did not reset all stats');
        }
    }

    window.promptToEditStatCount = function () {
        if (stats.statShown === 'hide' || stats.statShown === 'walls') {
            alert(`Not changing stat for "hide" or "walls"`)
            return;
        }
        let userResponse = prompt(`Change the stat count for "${stats.statShown} - ${stats.statDurationShown}"? This won't change any of the other stats. Current value: ${stats[stats.statShown][stats.statDurationShown]}`, stats[stats.statShown][stats.statDurationShown]);
        userResponse = parseInt(userResponse, 10);
        if (isNaN(userResponse)) {
            alert('Invalid - did not change stat count');
        } else {
            stats[stats.statShown][stats.statDurationShown] = userResponse;
            saveStatistics();
            updateCounterDisplay();
            alert(`Changed stat count to ${userResponse}`);
        }
    }

    window.getStatIconImageSrc = function () {
        switch (stats.statShown) {
            case 'hide':
                return "https://i.postimg.cc/bNFfLPCn/Empty.png"
            case 'walls':
                return "https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_01.png"
            case 'apples':
                return "https://www.google.com/logos/fnbx/snake_arcade/v3/apple_00.png"
            case 'plays':
                return "https://fonts.gstatic.com/s/i/googlematerialicons/play_arrow/v6/white-24dp/2x/gm_play_arrow_white_24dp.png"
            default:
                return "https://www.google.com/logos/fnbx/snake_arcade/keys.svg"
        }
    }

    window.setCounter = function () {
        //stats.visible = !stats.visible;
        if (stats.visible) {
            document.getElementById('stat-icon').style.display = 'inline';
            document.getElementById('counter-num').style.display = 'inherit';
            //document.getElementById('toggle-counter').innerHTML = 'Hide counter';
        }
        else {
            document.getElementById('stat-icon').style.display = 'none';
            document.getElementById('counter-num').style.display = 'none';
            //document.getElementById('toggle-counter').innerHTML = 'Show counter';
        }
        saveStatistics();
    }

}

window.Counter.alterCode = function (code) {

    reset_regex = new RegExp(/;this\.reset\(\)\}\}/)
    window.wallCoords = [];

    counter_reset_code = `;stats.inputs.game = 0;
    stats.walls.game = 0;
    window.wallCoords = [];
    window.BootstrapHide();
    stats.plays.session++;
    stats.plays.lifetime++;
    window.timeKeeper.addAttempt();
    saveStatistics();
    stats.visible = true;
    if((window.CurrentModeNum != 1 && window.CurrentModeNum != 19) && stats.statShown == "walls"){
        stats.visible = false;
    }
    window.setCounter();
    updateCounterDisplay();
    $&`

    catchError(reset_regex, code)
    code = code.assertReplace(reset_regex, counter_reset_code);

    window.IncrementCounter = function(){

        if(!window.timeKeeper.runStarted)
        {
            window.timeKeeper.start();
        }

        stats.inputs.game++;
        stats.inputs.session++;
        stats.inputs.lifetime++;
        stats.statShown === 'inputs' && updateCounterDisplay();

    }


    document.addEventListener('keydown', (event)=> {
        const ae = document.activeElement;
        if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable)) return;
        if(!event.repeat)
        {
            if ((event.key === 'ArrowRight') || (event.code === 'KeyD')){
                window.IncrementCounter();
            }
            else if (event.key === 'ArrowLeft'|| (event.code === 'KeyA'))
            {
                window.IncrementCounter();
            }
            else if (event.key === 'ArrowDown'|| (event.code === 'KeyS'))
            {
                window.IncrementCounter();
            }
            else if (event.key === 'ArrowUp'|| (event.code === 'KeyW'))
            {
                window.IncrementCounter();
            }
        }
    }
      );




    stop_regex = new RegExp(/stop\(a\){/)
    catchError(stop_regex, code)
    save_stats_code = `stop\(a\){saveStatistics();`
    

    code = code.assertReplace(stop_regex, save_stats_code);

    wall_spawn_regex = new RegExp(/(?:let|const|var) [a-zA-Z0-9_$]{1,8}=\n?[a-zA-Z0-9_$]{1,8}\(this\.[a-zA-Z0-9_$]{1,8},this\.[a-zA-Z0-9_$]{1,8}\(null,5\)\);/gm)
    catchError(wall_spawn_regex, code)
    wall_pos = code.match(wall_spawn_regex)[0].split('=')[0].split(' ')[1]

    wall_counter_code = `${code.match(wall_spawn_regex)[0]}
    if(${wall_pos}){stats.walls.game++;
    window.wallCoords.push([${wall_pos}.x, ${wall_pos}.y]);
    updateCounterDisplay();}
    `
    if (window.NepDebug) {
        console.log("Wall thing: " + wall_pos)
        console.log("Wall thing 2: " + wall_counter_code)
    }
    code = code.assertReplace(wall_spawn_regex, wall_counter_code);
    

    window.coordinatesToBoardString = function coordinatesToBoardString(coordinates) {
        if(window.timeKeeper.getCurrentSetting("size") != 1)
            return false;

        // Initialize an array of 90 tiles, all initialized to '1' (empty)
        let board = Array(90).fill('1');

        // Set '2' (wall) for each coordinate in the list
        coordinates.forEach(coord => {
            let [x, y] = coord;
            let index = y * 10 + x; // Calculate the index in the 1D array
            board[index] = '2'; // Set '2' at the calculated index
        });

        // Join the array into a single string of 90 characters
        return board.join('');
    }

    let death_wall_icon = document.querySelector('[jsname="LpoWPe"]');

    death_wall_icon.addEventListener("click", function () {
        pattern_string = window.coordinatesToBoardString(window.wallCoords)
        if(pattern_string){
            navigator.clipboard.writeText("pattern " + pattern_string);
        }
    });
    

    return code;
}
window.TimeKeeper = {};

window.TimeKeeper.make = function () {
    /*
    storage v4:
    att-modeKey-count-speed-size : number (legacy) OR
      { total, lastAttempt, session, lastSession }
      session = attempts since this page load; lastSession = previous page's session count
    25|50|100|ALL-modeKey-count-speed-size: {time, date, att, sum}
    H-modeKey-count-speed-size: {high, time, date}
    modeKey = classic | wall | ... | peaceful | wall+portal (blender)
    */
    window.timeKeeper = {};
    window.timeKeeper.debug = false;
    window.timeKeeper.playing = false;
    window.timeKeeper.runStarted = false;
    window.timeKeeper.dialogActive = false;

    window.timeKeeper.refreshSpeedInfo = function () {
        if (typeof window.SpeedInfoUpdate === "function") {
            window.SpeedInfoUpdate().catch(function (e) {
                console.error("SpeedInfoUpdate error:", e);
            });
        }
    };

    // Prefer frozen run settings (no #trophy walk) once a run has started.
    window.timeKeeper.shouldTrack = function (ctx) {
        if (window.daily_challenge) return false;
        if (typeof window.aimTrainer !== "undefined" || typeof window.megaWholeSnakeObject !== "undefined") {
            return false;
        }
        const c = ctx || window.timeKeeper.getSaveContext();
        if (c.count > 6 || c.speed > 2 || c.size > 2) return false;
        return true;
    };

    window.timeKeeper.resolveRunContext = function () {
        return {
            modeKey: window.ModeRegistry.getCurrentModeKey(),
            count: window.timeKeeper.getCurrentSetting("count"),
            speed: window.timeKeeper.getCurrentSetting("speed"),
            size: window.timeKeeper.getCurrentSetting("size"),
        };
    };

    // Prefer the mode/settings frozen at run start so score events after a
    // trophy switch (reset/death) cannot write PBs into the newly selected mode.
    window.timeKeeper.getSaveContext = function () {
        if (
            (window.timeKeeper.runStarted || window.timeKeeper.playing) &&
            typeof window.timeKeeper.mode === "string" &&
            typeof window.timeKeeper.count === "number" &&
            typeof window.timeKeeper.speed === "number" &&
            typeof window.timeKeeper.size === "number"
        ) {
            return {
                modeKey: window.timeKeeper.mode,
                count: window.timeKeeper.count,
                speed: window.timeKeeper.speed,
                size: window.timeKeeper.size,
            };
        }
        return window.timeKeeper.resolveRunContext();
    };

    window.timeKeeper.buildKey = function (prefix, ctx) {
        const c = ctx || window.timeKeeper.getSaveContext();
        return prefix + "-" + c.modeKey + "-" + c.count + "-" + c.speed + "-" + c.size;
    };

    // Normalize legacy number / partial objects into the attempt stats record
    window.timeKeeper.normalizeAttemptRecord = function (raw) {
        if (typeof raw === "number" && !isNaN(raw)) {
            return {
                total: raw,
                lastAttempt: null,
                session: 0,
                lastSession: 0,
            };
        }
        if (!raw || typeof raw !== "object") {
            return {
                total: 0,
                lastAttempt: null,
                session: 0,
                lastSession: 0,
            };
        }
        return {
            total: typeof raw.total === "number" ? raw.total : 0,
            lastAttempt: raw.lastAttempt != null ? raw.lastAttempt : null,
            session: typeof raw.session === "number" ? raw.session : 0,
            lastSession: typeof raw.lastSession === "number" ? raw.lastSession : 0,
        };
    };

    window.timeKeeper.getAttemptTotal = function (raw) {
        if (typeof raw === "number" && !isNaN(raw)) return raw;
        if (raw && typeof raw === "object" && typeof raw.total === "number") return raw.total;
        return 0;
    };

    // On page load: roll previous page's session into lastSession
    window.timeKeeper.rollAttemptSession = function (rec) {
        const r = window.timeKeeper.normalizeAttemptRecord(rec);
        if (r.session > 0) {
            r.lastSession = r.session;
            r.session = 0;
        }
        return r;
    };

    window.timeKeeper.getStorage = function () {
        if (!window.timeKeeper._storageCache) {
            try {
                window.timeKeeper._storageCache = JSON.parse(
                    localStorage.getItem("snake_timeKeeper") || '{"version":4}'
                );
            } catch (e) {
                window.timeKeeper._storageCache = { version: 4 };
            }
        }
        return window.timeKeeper._storageCache;
    };

    // Persist immediately (settings edits, attempt count, end-of-run flush helpers)
    window.timeKeeper.setStorage = function (storage) {
        if (typeof window.timeKeeper.syncLegacyTimeKeeperMirrors === "function") {
            window.timeKeeper.syncLegacyTimeKeeperMirrors(storage);
        }
        window.timeKeeper._storageCache = storage;
        localStorage.setItem("snake_timeKeeper", JSON.stringify(storage));
        window.timeKeeper._storageDirty = false;
    };

    // Mid-run mutations stay in memory until flushStorage (death / All)
    window.timeKeeper.markStorageDirty = function () {
        window.timeKeeper._storageDirty = true;
    };

    window.timeKeeper.flushStorage = function () {
        if (!window.timeKeeper._storageDirty || !window.timeKeeper._storageCache) return;
        if (typeof window.timeKeeper.syncLegacyTimeKeeperMirrors === "function") {
            window.timeKeeper.syncLegacyTimeKeeperMirrors(window.timeKeeper._storageCache);
        }
        localStorage.setItem(
            "snake_timeKeeper",
            JSON.stringify(window.timeKeeper._storageCache)
        );
        window.timeKeeper._storageDirty = false;
    };

    window.timeKeeper._isBitstringStorageKey = function (key) {
        if (!key || key === "version") return false;
        const parts = key.split("-");
        return (
            parts.length >= 5 &&
            window.ModeRegistry &&
            typeof window.ModeRegistry.isBitstringModePart === "function" &&
            window.ModeRegistry.isBitstringModePart(parts[1])
        );
    };

    window.timeKeeper._cloneStorageValue = function (value) {
        if (value == null || typeof value !== "object") return value;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return value;
        }
    };

    // Keep v10 (20-bit) / v11 (21-bit) keys in sync with modeKey rows for downgrade
    window.timeKeeper.syncLegacyTimeKeeperMirrors = function (storage) {
        if (!storage || typeof storage !== "object") return storage;
        if (
            !window.ModeRegistry ||
            typeof window.ModeRegistry.modeKeyToBitstringV3 !== "function" ||
            typeof window.ModeRegistry.bitstringV3ToV2 !== "function"
        ) {
            return storage;
        }
        const keys = Object.keys(storage);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key === "version") continue;
            if (window.timeKeeper._isBitstringStorageKey(key)) continue;
            const parts = key.split("-");
            if (parts.length < 5) continue;
            const prefix = parts[0];
            if (
                prefix !== "25" &&
                prefix !== "50" &&
                prefix !== "100" &&
                prefix !== "ALL" &&
                prefix !== "H" &&
                prefix !== "att"
            ) {
                continue;
            }
            const modeKey = parts[1];
            if (!modeKey || /^[01]+$/.test(modeKey)) continue;
            const suffix = parts.slice(2).join("-");
            const bits21 = window.ModeRegistry.modeKeyToBitstringV3(modeKey);
            const bits20 = window.ModeRegistry.bitstringV3ToV2(bits21);
            const key21 = prefix + "-" + bits21 + "-" + suffix;
            const key20 = prefix + "-" + bits20 + "-" + suffix;
            const raw = storage[key];
            if (prefix === "att") {
                const total = window.timeKeeper.getAttemptTotal(raw);
                storage[key21] = total;
                storage[key20] = total;
            } else {
                storage[key21] = window.timeKeeper._cloneStorageValue(raw);
                storage[key20] = window.timeKeeper._cloneStorageValue(raw);
            }
        }
        return storage;
    };

    // Compat: callers expecting mode "string" now get stable modeKey
    window.timeKeeper.getCurrentMode = function () {
        return window.ModeRegistry.getCurrentModeKey();
    };

    window.timeKeeper.ensurePlaying = function () {
        if (!window.timeKeeper.runStarted) {
            window.timeKeeper.start();
        } else {
            window.timeKeeper.playing = true;
        }
    };

    window.timeKeeper.gotApple = function (time, score) {
        stats.apples.session++;
        stats.apples.lifetime++;
        updateCounterDisplay();
        if (window.pudding_settings && window.pudding_settings.randomizeThemeApple) {
            window.setTheme(window.getRandomThemeName());
        }
        if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) return;

        window.timeKeeper.ensurePlaying();
        window.timeKeeper.lastAppleDate = new Date();
        window.timeKeeper.lastAppleTime = time;

        if (score == 25 || score == 50 || score == 100) {
            window.timeKeeper.savePB(time, score);
        }
        // Mirror milestone PBs: refresh Highscore as soon as this run beats the stored best
        window.timeKeeper.updateHighscoreLive(time, score);
    };

    window.timeKeeper.gotAll = function (time, score) {
        if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) return;
        window.timeKeeper.ensurePlaying();
        window.timeKeeper.savePB(time, "ALL");
        // End of successful run: persist mid-run PB/HS memory
        window.timeKeeper.flushStorage();
    };

    window.timeKeeper.death = function (time, score) {
        if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) {
            window.timeKeeper.playing = false;
            return;
        }
        if (window.timeKeeper.playing || window.timeKeeper.runStarted) {
            window.timeKeeper.saveScore(time, score);
        }
        window.timeKeeper.playing = false;
    };

    window.timeKeeper.start = function () {
        window.timeKeeper.playing = true;
        window.timeKeeper.runStarted = true;
        const ctx = window.timeKeeper.resolveRunContext();
        window.timeKeeper.mode = ctx.modeKey;
        window.timeKeeper.count = ctx.count;
        window.timeKeeper.speed = ctx.speed;
        window.timeKeeper.size = ctx.size;
    };

    // get the current setting, name = 'count', 'speed', 'size' or 'trophy'
    window.timeKeeper.getCurrentSetting = function (name) {
        let getSelectedIndex = function (name) {
            let elementList = document.getElementById(name);
            if (!elementList) return 0;
            let number = 0;
            let classNames = [];
            let notUnique = "";
            for (const element of elementList.children) {
                if (classNames.indexOf(element.className) == -1) {
                    classNames.push(element.className);
                } else {
                    notUnique = element.className;
                    break;
                }
            }
            for (const element of elementList.children) {
                if (element.className != notUnique) {
                    return number;
                }
                number++;
            }
            return 0;
        };

        if (name != "trophy") {
            return eval(window[name + "_var"]);
        }
        return getSelectedIndex(name);
    };

    // Mid-run: update Highscore PB in memory when current apples beat the stored best
    window.timeKeeper.updateHighscoreLive = function (time, score) {
        const ctx = window.timeKeeper.getSaveContext();
        if (!window.timeKeeper.shouldTrack(ctx)) return;
        if (typeof score !== "number" || isNaN(score)) return;

        time = Math.floor(time);
        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey("H", ctx);
        const appleTime =
            typeof window.timeKeeper.lastAppleTime !== "undefined"
                ? window.timeKeeper.lastAppleTime
                : time;
        const appleDate =
            typeof window.timeKeeper.lastAppleDate !== "undefined"
                ? window.timeKeeper.lastAppleDate
                : new Date();

        if (typeof storage[name] == "undefined") {
            storage[name] = {
                high: score,
                time: appleTime,
                date: appleDate,
            };
            window.timeKeeper.markStorageDirty();
            window.timeKeeper.refreshSpeedInfo();
            return;
        }

        const cur = storage[name];
        if (
            score > cur.high ||
            (score == cur.high && appleTime < cur.time)
        ) {
            cur.high = score;
            cur.time = appleTime;
            cur.date = appleDate;
            window.timeKeeper.markStorageDirty();
            window.timeKeeper.refreshSpeedInfo();
        }
    };

    window.timeKeeper.saveScore = function (time, score) {
        const ctx = window.timeKeeper.getSaveContext();
        if (!window.timeKeeper.shouldTrack(ctx)) return;

        if (typeof window.timeKeeper.lastAppleDate == "undefined") {
            window.timeKeeper.lastAppleDate = new Date();
        }
        if (typeof window.timeKeeper.lastAppleTime == "undefined") {
            window.timeKeeper.lastAppleTime = time;
        }

        time = Math.floor(time);
        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey("H", ctx);
        if (typeof storage[name] == "undefined") {
            storage[name] = {
                high: score,
                time: window.timeKeeper.lastAppleTime,
                date: window.timeKeeper.lastAppleDate,
            };
        } else if (
            score > storage[name].high ||
            (score == storage[name].high && time < storage[name].time)
        ) {
            storage[name].high = score;
            storage[name].time = window.timeKeeper.lastAppleTime;
            storage[name].date = window.timeKeeper.lastAppleDate;
        }
        // Drop unused average accumulators if present
        if (storage[name]) {
            delete storage[name].sum;
            delete storage[name].att;
        }
        // End of run: persist memory (including any mid-run PB/HS dirty state)
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.savePB = function (time, score) {
        const ctx = window.timeKeeper.getSaveContext();
        if (!window.timeKeeper.shouldTrack(ctx)) return;

        time = Math.floor(time);
        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey(String(score), ctx);

        if (typeof storage[name] == "undefined") {
            storage[name] = { time: time, date: new Date(), att: 1, sum: time };
        } else {
            if (typeof storage[name].att == "undefined") storage[name].att = 0;
            storage[name].att += 1;
            if (typeof storage[name].sum == "undefined") storage[name].sum = 0;
            storage[name].sum += time;
            if (time < storage[name].time) {
                storage[name] = {
                    time: time,
                    date: new Date(),
                    att: storage[name].att,
                    sum: storage[name].sum,
                };
            }
        }
        // Mid-run (25/50/100) or pre-flush ALL: keep in memory only
        window.timeKeeper.markStorageDirty();
        window.timeKeeper.refreshSpeedInfo();
    };

    // Only count if a run had actually started (not play→esc→play)
    window.timeKeeper.addAttempt = function () {
        if (!window.timeKeeper.runStarted) {
            window.timeKeeper.playing = false;
            return;
        }
        const ctx = {
            modeKey: window.timeKeeper.mode || window.ModeRegistry.getCurrentModeKey(),
            count:
                typeof window.timeKeeper.count === "number"
                    ? window.timeKeeper.count
                    : window.timeKeeper.getCurrentSetting("count"),
            speed:
                typeof window.timeKeeper.speed === "number"
                    ? window.timeKeeper.speed
                    : window.timeKeeper.getCurrentSetting("speed"),
            size:
                typeof window.timeKeeper.size === "number"
                    ? window.timeKeeper.size
                    : window.timeKeeper.getCurrentSetting("size"),
        };
        if (!window.timeKeeper.shouldTrack(ctx)) {
            window.timeKeeper.runStarted = false;
            window.timeKeeper.playing = false;
            return;
        }

        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey("att", ctx);
        const rec = window.timeKeeper.normalizeAttemptRecord(storage[name]);
        const now = new Date();
        rec.total += 1;
        rec.lastAttempt = now;
        rec.session += 1;
        storage[name] = rec;
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.runStarted = false;
        window.timeKeeper.playing = false;
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.setAttempts = function (attempts) {
        if (isNaN(attempts)) return;
        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey("att");
        const rec = window.timeKeeper.normalizeAttemptRecord(storage[name]);
        rec.total = attempts;
        storage[name] = rec;
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.setPB = function (time, score, attempts, average) {
        if (isNaN(time)) return;
        if (score != 25 && score != 50 && score != 100 && score != "ALL") return;
        if (isNaN(attempts)) return;
        if (isNaN(average)) return;
        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey(String(score));
        storage[name] = {
            time: time,
            date: new Date(),
            att: attempts,
            sum: Math.round(average * attempts),
        };
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.setScore = function (highscore, time) {
        if (isNaN(highscore)) return;
        if (isNaN(time)) return;
        const storage = window.timeKeeper.getStorage();
        const ctx = window.timeKeeper.resolveRunContext();
        const name = window.timeKeeper.buildKey("H", ctx);
        storage[name] = {
            high: highscore,
            time: time,
            date: new Date(),
        };
        window.timeKeeper.setStorage(storage);
        window.timeKeeper.refreshSpeedInfo();
    };

    window.timeKeeper.formatDuration = function (ms) {
        ms = Math.floor(ms);
        const hours = Math.floor(ms / 3600000);
        const minutes = String(Math.floor((ms - hours * 3600000) / 60000)).padStart(2, "0");
        const seconds = String(
            Math.floor((ms - minutes * 60000 - hours * 3600000) / 1000)
        ).padStart(2, "0");
        const mseconds = String(
            ms - minutes * 60000 - seconds * 1000 - hours * 3600000
        ).padStart(3, "0");
        if (hours == 0) return minutes + ":" + seconds + ":" + mseconds;
        return hours + ":" + minutes + ":" + seconds + ":" + mseconds;
    };

    // Local calendar date as YYYY-MM-DD
    window.timeKeeper.formatAchievedOn = function (raw) {
        const date = new Date(raw);
        if (isNaN(date.getTime())) return "—";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + d;
    };

    // Local calendar date + time as YYYY-MM-DD HH:MM:SS
    window.timeKeeper.formatAchievedOnWithTime = function (raw) {
        const date = new Date(raw);
        if (isNaN(date.getTime())) return "—";
        const y = date.getFullYear();
        const mo = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        const s = String(date.getSeconds()).padStart(2, "0");
        return y + "-" + mo + "-" + d + " " + h + ":" + mi + ":" + s;
    };

    // ms → SRC-like 1m2s345ms (shared with SpeedInfo personal rows)
    window.timeKeeper.formatTimeSrcStyle = function (ms) {
        ms = Math.floor(Number(ms) || 0);
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        let out = "";
        if (hours > 0) out += hours + "h";
        if (minutes > 0 || hours > 0) out += minutes + "m";
        out += seconds + "s";
        if (hours === 0) out += String(milliseconds).padStart(3, "0") + "ms";
        if (hours > 0) out = out.split("s")[0] + "s";
        return out;
    };

    window.timeKeeper.makeStorage = function () {
        let storage = localStorage.getItem("snake_timeKeeper");
        if (storage == null) {
            storage = { version: 2 };
            const old_pbs = localStorage.getItem("snake_pbs");
            if (old_pbs != null) {
                const old = JSON.parse(old_pbs);
                for (let mode = 0; mode < 20; mode++) {
                    let modeStr = "00000000000000000000".split("");
                    if (mode != 0) modeStr[mode - 1] = "1";
                    modeStr = modeStr.join("");
                    for (let count = 0; count < 5; count++) {
                        for (let speed = 0; speed < 3; speed++) {
                            for (let size = 0; size < 3; size++) {
                                for (const score of ["25", "50", "100", "ALL", "att", "H"]) {
                                    const name =
                                        score + "-" + mode + "-" + count + "-" + speed + "-" + size;
                                    if (typeof old[name] != "undefined") {
                                        storage[
                                            score +
                                                "-" +
                                                modeStr +
                                                "-" +
                                                count +
                                                "-" +
                                                speed +
                                                "-" +
                                                size
                                        ] = old[name];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            storage = JSON.parse(storage);
        }

        if (storage.version == 2) {
            const migrated = { version: 3 };
            for (const key of Object.keys(storage)) {
                if (key === "version") continue;
                const parts = key.split("-");
                if (parts.length >= 5 && /^[01]{20}$/.test(parts[1])) {
                    const modeStr = parts[1];
                    const newModeStr = modeStr.slice(0, 19) + "0" + modeStr.slice(19);
                    migrated[parts[0] + "-" + newModeStr + "-" + parts.slice(2).join("-")] =
                        storage[key];
                } else {
                    migrated[key] = storage[key];
                }
            }
            storage = migrated;
        }

        if (storage.version == 3) {
            const migrated = { version: 4 };
            for (const key of Object.keys(storage)) {
                if (key === "version") continue;
                const parts = key.split("-");
                if (parts.length >= 5 && /^[01]{21}$/.test(parts[1])) {
                    const modeKey = window.ModeRegistry.bitstringV3ToModeKey(parts[1]);
                    const modeKeyName =
                        parts[0] + "-" + modeKey + "-" + parts.slice(2).join("-");
                    if (typeof migrated[modeKeyName] === "undefined") {
                        migrated[modeKeyName] = storage[key];
                    }
                    migrated[key] = storage[key];
                    if (typeof window.ModeRegistry.bitstringV3ToV2 === "function") {
                        const bits20 = window.ModeRegistry.bitstringV3ToV2(parts[1]);
                        const key20 =
                            parts[0] + "-" + bits20 + "-" + parts.slice(2).join("-");
                        if (typeof migrated[key20] === "undefined") {
                            migrated[key20] = storage[key];
                        }
                    }
                } else {
                    migrated[key] = storage[key];
                }
            }
            storage = migrated;
        }

        if (storage.version != 4) {
            console.error("TimeKeeper storage version unexpected:", storage.version);
            storage.version = 4;
        }

        // Strip unused highscore average fields (sum/att) from modeKey H-* rows only
        for (const key of Object.keys(storage)) {
            if (key === "version" || key.slice(0, 2) !== "H-") continue;
            if (window.timeKeeper._isBitstringStorageKey(key)) continue;
            const rec = storage[key];
            if (!rec || typeof rec !== "object") continue;
            delete rec.sum;
            delete rec.att;
        }

        // Migrate modeKey att-* numbers → objects; leave bitstring att-* as numbers for v11
        for (const key of Object.keys(storage)) {
            if (key === "version" || key.slice(0, 4) !== "att-") continue;
            if (window.timeKeeper._isBitstringStorageKey(key)) {
                if (typeof storage[key] === "object") {
                    storage[key] = window.timeKeeper.getAttemptTotal(storage[key]);
                }
                continue;
            }
            storage[key] = window.timeKeeper.rollAttemptSession(storage[key]);
        }

        if (typeof window.timeKeeper.syncLegacyTimeKeeperMirrors === "function") {
            window.timeKeeper.syncLegacyTimeKeeperMirrors(storage);
        }

        localStorage.setItem("snake_timeKeeper", JSON.stringify(storage));
        window.timeKeeper._storageCache = storage;
        window.timeKeeper._storageDirty = false;
    };

    window.timeKeeper.showDialog = function () {
        window.timeKeeper.dialogActive = true;
        const btn = document.getElementById("time-keeper");
        if (btn) btn.innerHTML = "Hide";

        const body = document.querySelector("body");
        const oldBd = document.getElementById("timeKeeperBackdrop");
        if (oldBd) oldBd.remove();
        const oldDialog = document.getElementById("timeKeeperDialog");
        if (oldDialog) oldDialog.remove();

        const backdrop = document.createElement("div");
        backdrop.id = "timeKeeperBackdrop";
        backdrop.style.cssText =
            "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:10099;" +
            "background:rgba(0,0,0,0.45);";
        backdrop.addEventListener("click", function () {
            window.timeKeeper.hideDialog();
        });
        body.insertBefore(backdrop, body.firstChild);

        const dialog = document.createElement("div");
        dialog.setAttribute("open", "");
        dialog.setAttribute("id", "timeKeeperDialog");

        const ctx = window.timeKeeper.resolveRunContext();
        const gamemode = window.ModeRegistry.labelModeKey(ctx.modeKey);

        const bold = document.createElement("div");
        bold.appendChild(document.createTextNode("TimeKeeper Details"));
        bold.style = "color:white;font-family:Roboto,Arial;font-weight:bold;text-align:center;";
        dialog.appendChild(bold);
        dialog.appendChild(document.createElement("br"));
        dialog.appendChild(document.createTextNode("Mode: " + gamemode));
        dialog.appendChild(document.createElement("br"));

        switch (ctx.count) {
            case 0: dialog.appendChild(document.createTextNode("1 Apple, ")); break;
            case 1: dialog.appendChild(document.createTextNode("3 Apples, ")); break;
            case 2: dialog.appendChild(document.createTextNode("5 Apples, ")); break;
            case 3: dialog.appendChild(document.createTextNode("10 Apples, ")); break;
            case 4: dialog.appendChild(document.createTextNode("Dice count, ")); break;
            case 5: dialog.appendChild(document.createTextNode("Bomb count, ")); break;
            case 6: dialog.appendChild(document.createTextNode("Tally count, ")); break;
            default: dialog.appendChild(document.createTextNode("MoreMenu Apples, ")); break;
        }
        switch (ctx.speed) {
            case 0: dialog.appendChild(document.createTextNode("Normal speed, ")); break;
            case 1: dialog.appendChild(document.createTextNode("Fast speed, ")); break;
            case 2: dialog.appendChild(document.createTextNode("Slow speed, ")); break;
            default: dialog.appendChild(document.createTextNode("MoreMenu speed, ")); break;
        }
        switch (ctx.size) {
            case 0: dialog.appendChild(document.createTextNode("Normal size")); break;
            case 1: dialog.appendChild(document.createTextNode("Small size")); break;
            case 2: dialog.appendChild(document.createTextNode("Large size")); break;
            default: dialog.appendChild(document.createTextNode("MoreMenu size")); break;
        }

        dialog.appendChild(document.createElement("br"));
        dialog.appendChild(document.createElement("br"));

        const storage = window.timeKeeper.getStorage();
        const attKey = window.timeKeeper.buildKey("att", ctx);
        const attemptRec = window.timeKeeper.normalizeAttemptRecord(storage[attKey]);

        const cellStyle =
            "box-sizing:border-box;padding:6px 8px;border:1px solid rgba(255,255,255,0.22);border-radius:6px;min-width:0;";

        function line(parent, text) {
            parent.appendChild(document.createTextNode(text));
            parent.appendChild(document.createElement("br"));
        }

        function titleLine(parent, text) {
            const span = document.createElement("span");
            span.style = "font-weight:bold;";
            span.appendChild(document.createTextNode(text));
            parent.appendChild(span);
            parent.appendChild(document.createElement("br"));
        }

        function buildTimedCell(score) {
            const cell = document.createElement("div");
            cell.style = cellStyle;
            const name = window.timeKeeper.buildKey(score, ctx);
            const titles = {
                "25": "25 Apples",
                "50": "50 Apples",
                "100": "100 Apples",
                ALL: "All Apples",
            };
            titleLine(cell, titles[score] + ":");
            const data = storage[name];
            if (typeof data == "undefined") {
                line(cell, "None");
                return cell;
            }
            line(cell, "Best Time: " + window.timeKeeper.formatDuration(data.time));
            line(cell, "Achieved on: " + window.timeKeeper.formatAchievedOnWithTime(data.date));
            if (data.att != undefined && data.sum != undefined && data.att > 0) {
                const avg = Math.floor(data.sum / data.att);
                line(cell, "Attempts to this point: " + data.att);
                line(cell, "Average: " + window.timeKeeper.formatDuration(avg));
            }
            return cell;
        }

        function buildHighscoreCell() {
            const cell = document.createElement("div");
            cell.style = cellStyle;
            titleLine(cell, "Highscore:");
            const name = window.timeKeeper.buildKey("H", ctx);
            const data = storage[name];
            if (typeof data == "undefined" || data.high == null) {
                line(cell, "None");
                return cell;
            }
            line(cell, String(data.high));
            line(cell, "Duration: " + window.timeKeeper.formatDuration(data.time));
            line(cell, "Achieved on: " + window.timeKeeper.formatAchievedOnWithTime(data.date));
            return cell;
        }

        function buildAttemptsCell() {
            const cell = document.createElement("div");
            cell.style = cellStyle;
            titleLine(cell, "Total Attempts:");
            line(cell, String(attemptRec.total));
            if (attemptRec.lastAttempt != null) {
                line(
                    cell,
                    "Latest: " + window.timeKeeper.formatAchievedOn(attemptRec.lastAttempt)
                );
            }
            line(cell, "This session: " + attemptRec.session);
            line(cell, "Last session: " + attemptRec.lastSession);
            return cell;
        }

        function buildRow(left, right) {
            const row = document.createElement("div");
            row.style = "display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;";
            row.appendChild(left);
            row.appendChild(right);
            return row;
        }

        dialog.appendChild(buildRow(buildTimedCell("25"), buildTimedCell("50")));
        dialog.appendChild(buildRow(buildTimedCell("100"), buildTimedCell("ALL")));
        dialog.appendChild(buildRow(buildHighscoreCell(), buildAttemptsCell()));

        const buttonClose = document.createElement("button");
        buttonClose.appendChild(document.createTextNode("Close"));
        buttonClose.addEventListener("click", function () {
            window.timeKeeper.toggleDialog();
        });
        buttonClose.style =
            "display:block;margin:12px auto 0;color:white;background-color:" +
            window.button_color +
            ";";
        buttonClose.className = "btn";
        dialog.appendChild(buttonClose);

        dialog.setAttribute(
            "style",
            "outline: none;border-radius: 10px;z-index:10100;background:" +
                window.real_topbar_color +
                ";color:white;font-family:Roboto,Arial;min-width:420px;max-width:560px;"
        );
        dialog.classList.add("custom-dialog");
        body.insertBefore(dialog, body.firstChild);
    };

    window.timeKeeper.hideDialog = function () {
        const child = document.getElementById("timeKeeperDialog");
        if (child && child.parentElement) child.parentElement.removeChild(child);
        const backdrop = document.getElementById("timeKeeperBackdrop");
        if (backdrop && backdrop.parentElement) backdrop.parentElement.removeChild(backdrop);
        window.timeKeeper.dialogActive = false;
        const btn = document.getElementById("time-keeper");
        if (btn) btn.innerHTML = "Details";
    };

    window.timeKeeper.toggleDialog = function () {
        if (window.timeKeeper.dialogActive) window.timeKeeper.hideDialog();
        else window.timeKeeper.showDialog();
    };

    window.timeKeeper.setup = function () {
        window.timeKeeper.makeStorage();
        if (window.ModeRegistry && typeof window.ModeRegistry.has === "function") {
            window.isBridge = window.ModeRegistry.has("bridge");
        }
    };

    window.timeKeeper.setup();
};

window.TimeKeeper.alterCode = function (code) {
    func_regex = new RegExp(/tick\(\){[^\\]{1,4000}light=Math.max[\s\S]*?=function/);
    window.catchError(func_regex, code);
    let func = code.match(/tick\(\){[^\\]{1,4000}light=Math.max[\s\S]*?=function/)[0];
    StartOfNext = func.substring(func.lastIndexOf(";"), func.length);
    func = func.substring(0, func.lastIndexOf(";"));

    scoreFuncVar = func.match(/[a-zA-Z0-9$]{1,4}\=\=\=\n?25/)[0].split("=")[0];
    scoreFunc = func.match(
        `${window.escapeRegex(scoreFuncVar.replace("\n", ""))}=\n?this.[a-zA-Z0-9$]{1,6}`
    )[0].split("=")[1];
    timeFunc = func.match(/\([a-zA-Z0-9$]{1,6}\*[a-zA-Z0-9$]{1,6}\)/)[0];
    ticksVar = timeFunc.split("(")[1].split("*")[0];
    tickLengthVar = timeFunc.split("*")[1].split(")")[0];
    realTicks = func.match(`${escapeRegex(ticksVar)}=this.[a-zA-Z0-9$]{1,6}`)[0].split("=")[1];
    realTickLength = func.match(`${escapeRegex(tickLengthVar)}=this.[a-zA-Z0-9$]{1,6}`)[0].split(
        "="
    )[1];
    timeFunc = `${realTicks}*${realTickLength}`;

    ownFunc = "window.timeKeeper.gotApple(Math.floor(" + timeFunc + ")," + scoreFunc + ");";
    if25_regex = new RegExp(/if\([a-zA-Z0-9$]{1,4}\=\=\=\n?25/);
    ownFuncIndex = func.indexOf(func.match(if25_regex)[0]);
    func = func.slice(0, ownFuncIndex) + ownFunc + func.slice(ownFuncIndex);

    func =
        func.slice(0, func.indexOf("WIN.play()") + 11) +
        "window.timeKeeper.gotAll(Math.floor(" +
        timeFunc +
        ")," +
        scoreFunc +
        ")," +
        func.slice(func.indexOf("WIN.play()") + 11);

    death = func.match(/if\(this.[a-zA-Z0-9$]{1,4}\|\|this.[a-zA-Z0-9$]{1,4}\)/)[0];
    death = death.slice(death.indexOf("(") + 1, death.indexOf("|"));
    func =
        func.slice(0, func.indexOf("{") + 1) +
        "if(" +
        death +
        "){window.timeKeeper.death(Math.floor(" +
        timeFunc +
        ")," +
        scoreFunc +
        ");}" +
        func.slice(func.indexOf("{") + 1);

    code = code.assertReplace(func_regex, func + StartOfNext);
    return code;
};
window.SpeedInfo = {};

window.SpeedInfo.make = function () {

    window.isBridge = true; // refreshed from ModeRegistry when trophies exist

    // First game must be CE, the other is the normal game
    const gameIDs = ["o1y9pyk6", "9dow0go1"];
    window.first_time_call = true;
    window.requestsMade = 0;
    // Invalidate in-flight WR/tracking paints when settings change mid-fetch
    let srcQueryId = 0;

    // FastSnakeStats runs-derived WR timelines (preferred over legacy daily/ snapshots)
    const FASTSNAKE_BASE = "https://cdn.jsdelivr.net/gh/DarkSnakeGang/FastSnakeStats@main/time-travel-cache";
    const RUNS_DATES_URL = `${FASTSNAKE_BASE}/metadata/available-dates-runs.json`;
    const TIMELINES_URL = `${FASTSNAKE_BASE}/runs-derived/wr-timelines.json`;

    let timelinesData = null;
    let runsDatesMeta = null;
    let timelinesPromise = null;
    let fssVersion = null; // available-dates-runs.json lastUpdated — only reuse memory if this matches

    // In-memory runs boards for the current FSS publish only
    const runsBoardCache = Object.create(null); // key -> { data, version }
    const runsBoardPromises = Object.create(null);
    const LEVEL_TO_RUNS_FILE = {
        "25": "25_Apples.json",
        "50": "50_Apples.json",
        "100": "100_Apples.json",
        "All": "All_Apples.json",
        "H": "High_Score.json",
    };

    // Match FastSnakeStats tally-boards.js (typical dedicated HS modes)
    const TYPICAL_HIGHSCORE_MODES = {
        1: "Wall",
        2: "Portal",
        8: "Key",
        9: "Sokoban",
        10: "Poison",
        12: "Minesweeper",
        13: "Statue",
        15: "Shield",
        17: "Hotdog",
        19: "Gate",
        20: "Bridge",
    };

    // Dedicated main-game High Score categories (Cheese HS was removed from SRC).
    // Non-HS modes submit Tally highscores on Category Extensions instead.
    const TALLY_COUNT = 6;
    const SRC_GAME = "snake_game";
    const SRC_GAME_CE = "snake_game_ce";

    const SRC_LEVEL_BY_MODE = {
        0: "5d7e0vvw", // Classic
        1: "xd13o769", // Wall
        2: "rw6e78gd", // Portal
        3: "rdnq00qd", // Cheese
        4: "nwl2ll0d", // Borderless
        5: "n93mv5nd", // Twin
        6: "z9856279", // Winged
        7: "n93lkxz9", // Yin Yang
        8: "z985kzr9", // Key
        9: "rdn4ej79", // Sokoban
        10: "ldyrq3r9", // Poison
        11: "ldy64pz9", // Dimension
        12: "kwjr0erd", // Minesweeper
        13: "rdqv8kg9", // Statue
        14: "rdqkpgmd", // Light
        15: "xd47pv2d", // Shield
        16: "rdnjgm69", // Arrow
        17: "dqzzvn1d", // Hotdog
        18: "dno527nw", // Magnet
        19: "wkkjnjxw", // Gate
        20: "9x1zey3d", // Bridge
        21: "y9mrvj1w", // Peaceful
    };

    const SRC_IL_CATEGORY = {
        "25": "mke9xe9d",
        "50": "5dw410gk",
        "100": "wk6nwme2",
        "ALL": "n2yov4ed",
        "All": "n2yov4ed",
    };

    const SRC_HS_CATEGORY_BY_MODE = {
        1: "7kj63r42", // Wall
        2: "n2y9g8ed", // Portal
        8: "q25ewmv2", // Key
        9: "xd11gn8d", // Sokoban
        10: "wdmr0lek", // Poison
        12: "ndxr78rd", // Minesweeper
        13: "8249v5nd", // Statue
        15: "02q686jk", // Shield
        17: "mkemx192", // Hotdog
        19: "zd31z3n2", // Gate
        20: "mke3e76d", // Bridge
    };

    // CE "Tally Highscore (non-highscore modes)" mode values (FSS tally-boards.js)
    const CE_TALLY_MODE_BY_MODE = {
        0: "lr3d7n2l", // Classic
        3: "1dknd7jl", // Cheese
        4: "q8k3z7kq", // Borderless
        5: "qyzm4e71", // Twin
        6: "ln8736dl", // Winged
        7: "10vy7e5l", // Yin Yang
        11: "qj7odygq", // Dimension
        14: "q65w7k7l", // Light
        16: "lmoenj41", // Arrow
        18: "1w4j8w5q", // Magnet
    };

    const SRC_COUNT_VAR = "0nwovxdl";
    const SRC_COUNT_VAL = {
        0: "mlnmj661", // 1 Apple
        1: "5q88w7rq", // 3 Apples
        2: "4qyoge3l", // 5 Apples
        3: "qvvpkp7q", // 10 Apples
        4: "qoxx6dxq", // Dice
        5: "1pyp3vg1", // Bomb
        6: "qznw4k2q", // Tally
    };
    const SRC_SIZE_VAR = "p854j77l";
    const SRC_SIZE_VAL = {
        0: "z19gp0jl", // Standard
        1: "81pw5rel", // Small
        2: "p12e0gv1", // Large
    };
    const SRC_IL_SPEED_VAR = "68k1g0yl";
    const SRC_IL_SPEED_VAL = {
        0: "192dxz4q", // Normal
        1: "12v4922q", // Fast
        2: "1py6exn1", // Slow
    };
    const SRC_HS_SPEED_VAR = "0nwomwdl";
    const SRC_HS_SPEED_VAL = {
        0: "xqkkj49q", // Normal
        1: "gq7ej4n1", // Fast
        2: "192d23kq", // Slow
    };

    const CE_TALLY_HS_CATEGORY = "rkl4elqd";
    const CE_SPEED_VAR = "gnx3m4gn";
    const CE_SPEED_VAL = {
        0: "lmo2pr01", // Normal
        1: "1w479v6q", // Fast
        2: "qoxj984q", // Slow
    };
    const CE_SIZE_VAR = "ql6mkzw8";
    const CE_SIZE_VAL = {
        0: "q75ogky1", // Standard
        1: "1gn6gyml", // Small
        2: "qznw4kmq", // Large
    };
    const CE_MODE_VAR = "onvxz158";

    // Match SRC/FastSnakeStats boards: no 100 on Small; Yin Yang has no 50 on Small
    function shouldShowCategory(level, size, mode) {
        if (level === "100" && size === 1) return false;
        if (level === "50" && mode === 7 && size === 1) return false; // Yin Yang: no 50 on Small
        return true;
    }

    // SRC removed Statue Bomb and Statue 10a highscore (non-competitive max-score ties)
    function isRemovedStatueHighscore(mode, count) {
        return mode === 13 && (count === 3 || count === 5); // Statue + 10 Apples or Bomb
    }

    // FSS HS boards: typical HS modes on any count; on Tally every mode except Peaceful/Blender
    function canShowSrcHighscore(mode, count) {
        if (mode === 21 || mode === 22) return false; // Peaceful, Blender
        if (isRemovedStatueHighscore(mode, count)) return false;
        if (TYPICAL_HIGHSCORE_MODES[mode]) return true;
        if (count === TALLY_COUNT) return true;
        return false;
    }

    // Submit link only when SRC has a real board (HS category or CE Tally-HS mode)
    function canSubmitHighscore(mode, count) {
        if (mode === 21 || mode === 22) return false;
        if (isRemovedStatueHighscore(mode, count)) return false;
        if (SRC_HS_CATEGORY_BY_MODE[mode]) return true;
        if (count === TALLY_COUNT && CE_TALLY_MODE_BY_MODE[mode]) return true;
        return false;
    }

    function srcVarPair(varId, valueId) {
        return varId + "." + valueId;
    }

    // Always include defaults (1 Apple / Normal / Standard) so the form matches in-game settings
    function buildSrcSubmitUrl(score, mode, count, speed, size) {
        if (size > 2 || count > 6 || speed > 2) return null;

        if (score === "H") {
            if (!canSubmitHighscore(mode, count)) return null;
            const hsCat = SRC_HS_CATEGORY_BY_MODE[mode];
            if (hsCat) {
                const x = [
                    hsCat,
                    srcVarPair(SRC_COUNT_VAR, SRC_COUNT_VAL[count]),
                    srcVarPair(SRC_HS_SPEED_VAR, SRC_HS_SPEED_VAL[speed]),
                    srcVarPair(SRC_SIZE_VAR, SRC_SIZE_VAL[size]),
                ].join("-");
                return `https://www.speedrun.com/${SRC_GAME}/runs/new?x=${x}`;
            }
            const ceMode = CE_TALLY_MODE_BY_MODE[mode];
            if (count === TALLY_COUNT && ceMode) {
                const x = [
                    CE_TALLY_HS_CATEGORY,
                    srcVarPair(CE_SPEED_VAR, CE_SPEED_VAL[speed]),
                    srcVarPair(CE_SIZE_VAR, CE_SIZE_VAL[size]),
                    srcVarPair(CE_MODE_VAR, ceMode),
                ].join("-");
                return `https://www.speedrun.com/${SRC_GAME_CE}/runs/new?x=${x}`;
            }
            return null;
        }

        const levelId = SRC_LEVEL_BY_MODE[mode];
        const catId = SRC_IL_CATEGORY[score];
        if (!levelId || !catId) return null;

        const x = [
            "l_" + levelId,
            catId,
            srcVarPair(SRC_COUNT_VAR, SRC_COUNT_VAL[count]),
            srcVarPair(SRC_IL_SPEED_VAR, SRC_IL_SPEED_VAL[speed]),
            srcVarPair(SRC_SIZE_VAR, SRC_SIZE_VAL[size]),
        ].join("-");
        return `https://www.speedrun.com/${SRC_GAME}/runs/new?x=${x}`;
    }

    function pbValueHtml(text, score, mode, count, speed, size, gold) {
        const color = gold ? "#FFD700" : "#ADD8E6";
        const url = buildSrcSubmitUrl(score, mode, count, speed, size);
        if (url) {
            return `<a target="_blank" style="text-decoration: none;color:${color} !important;" href="${url}">${text}</a>`;
        }
        if (gold) return `<span style="color:${color} !important">${text}</span>`;
        return text;
    }

    function goldCacheKey(modeKey, count, speed, size, score, displayText) {
        return modeKey + "|" + count + "|" + speed + "|" + size + "|" + score + "|" + displayText;
    }

    // SRC encodes apple count in the duration seconds field (0.187 → 187, 1.234 → 1234)
    function wrHighscoreFromRun(run) {
        if (!run || !run.times) return null;
        if (typeof run.times.primary_t === "number" && isFinite(run.times.primary_t)) {
            return Math.round(run.times.primary_t * 1000 + 1e-6);
        }
        const primary = String(run.times.primary || "");
        const m = primary.match(/PT(?:\d+H)?(?:\d+M)?(\d+(?:\.\d+)?)S/i);
        if (m) return Math.round(parseFloat(m[1]) * 1000 + 1e-6);
        return null;
    }

    function fssModeName(mode, modeKey) {
        if (modeKey && window.ModeRegistry && typeof window.ModeRegistry.labelModeKey === "function") {
            const label = window.ModeRegistry.labelModeKey(modeKey);
            if (label && label.indexOf(",") < 0) return label;
        }
        return window.modeToTxt[mode] && window.modeToTxt[mode].name;
    }

    // Timed: lower ms wins. Highscore: higher apples wins (only when HS board applies). Unheld → gold.
    async function shouldGoldPb(score, mode, count, speed, size, pb, modeKey) {
        if (score === "H" && !canShowSrcHighscore(mode, count)) return false;

        const modeName = fssModeName(mode, modeKey);
        const countName = window.countToTxt[count] && window.countToTxt[count].name;
        const speedName = window.speedToTxt[speed] && window.speedToTxt[speed].name;
        const sizeName = window.sizeToTxt[size] && window.sizeToTxt[size].name;
        if (!modeName || !countName || !speedName || !sizeName) return false;

        const categoryName =
            score === "H" ? "High Score" : (score === "ALL" ? "All" : score) + " Apples";
        const cacheKey = `${countName}|${speedName}|${sizeName}|${modeName}|${categoryName}`;

        try {
            const record = await getRecordForKey(cacheKey);
            if (!record.success || !record.runs || !record.runs.length) return true; // unheld
            const wr = record.runs[0];
            if (score === "H") {
                const wrHigh = wrHighscoreFromRun(wr);
                if (wrHigh == null || pb.high == null) return false;
                return Number(pb.high) > wrHigh;
            }
            if (pb.time == null || !wr.times || typeof wr.times.primary_t !== "number") return false;
            const wrMs = Math.round(wr.times.primary_t * 1000 + 1e-6);
            return Number(pb.time) < wrMs;
        } catch (e) {
            if (window.NepDebug) console.error("shouldGoldPb failed:", e);
            return false;
        }
    }

    function sleepFor(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function withCacheBust(url, bust) {
        if (!bust) return url;
        return url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + encodeURIComponent(bust);
    }

    async function getJSON(url, options) {
        const opts = options || {};
        const fetchUrl = withCacheBust(url, opts.bust);
        const res = await fetch(fetchUrl, opts.cache === false ? { cache: "no-store" } : undefined);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${fetchUrl}`);
        return res.json();
    }

    // Binary search: latest WR snapshot on or before `date` (same as FastSnakeStats GitHubCacheFetcher)
    function wrAsOf(timeline, date) {
        if (!timeline || !timeline.length) return [];
        let lo = 0;
        let hi = timeline.length - 1;
        let best = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (timeline[mid].d <= date) {
                best = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return best >= 0 ? timeline[best].runs : [];
    }

    function expandCompactRun(r, date) {
        const isGuest = r.g || String(r.p).indexOf("guest:") === 0;
        return {
            id: r.id,
            date: date,
            weblink: r.w,
            times: { primary: r.t, primary_t: r.pt },
            players: {
                data: [
                    isGuest
                        ? {
                            rel: "guest",
                            name: r.n,
                            "name-style": r.ns || {
                                style: "solid",
                                color: { dark: "#9e9e9e", light: "#9e9e9e" },
                            },
                        }
                        : {
                            rel: "user",
                            id: r.p,
                            names: { international: r.n },
                            weblink: "https://www.speedrun.com/user/" + r.p,
                            "name-style": r.ns || undefined,
                        },
                ],
            },
            values: {},
        };
    }

    async function loadRunsDerived() {
        // Always check FSS metadata — whatever they published is what we use
        let datesMeta;
        try {
            datesMeta = await getJSON(RUNS_DATES_URL, { cache: false });
            window.requestsMade += 1;
        } catch (e) {
            if (timelinesData && runsDatesMeta) {
                const date = runsDatesMeta.availableDates[runsDatesMeta.availableDates.length - 1];
                return { timelines: timelinesData, date };
            }
            throw e;
        }

        if (!datesMeta.availableDates || !datesMeta.availableDates.length) {
            throw new Error("No available dates in runs-derived metadata");
        }

        const version = datesMeta.lastUpdated || datesMeta.availableDates[datesMeta.availableDates.length - 1];

        // Same FSS publish already in memory — reuse it (no time-based expiry)
        if (timelinesData && fssVersion === version) {
            runsDatesMeta = datesMeta;
            const date = datesMeta.availableDates[datesMeta.availableDates.length - 1];
            return { timelines: timelinesData, date };
        }

        if (timelinesPromise) return timelinesPromise;

        const datesMetaForLoad = datesMeta;
        const versionForLoad = version;
        timelinesPromise = (async () => {
            if (window.NepDebug) {
                console.log("Loading FastSnakeStats runs-derived timelines...", versionForLoad);
            }
            const timelines = await getJSON(TIMELINES_URL, { bust: versionForLoad });
            if (!timelines.boards) {
                throw new Error("runs-derived timelines missing boards");
            }
            if (fssVersion && fssVersion !== versionForLoad) {
                for (const k of Object.keys(runsBoardCache)) delete runsBoardCache[k];
            }
            runsDatesMeta = datesMetaForLoad;
            timelinesData = timelines;
            fssVersion = versionForLoad;
            window.requestsMade += 1;
            const date = datesMetaForLoad.availableDates[datesMetaForLoad.availableDates.length - 1];
            if (window.NepDebug) {
                console.log(`Runs-derived ready as of ${date} (${Object.keys(timelines.boards).length} boards, v=${versionForLoad})`);
            }
            return { timelines, date };
        })().finally(() => {
            timelinesPromise = null;
        });

        return timelinesPromise;
    }

    function modeFolderName(modeName) {
        return String(modeName || "").replace(/ /g, "_");
    }

    function getTrackedPlayerName() {
        return (window.pudding_settings && window.pudding_settings.TrackedPlayerName || "").trim();
    }

    function shouldShowWrHolders() {
        return !!(window.pudding_settings && window.pudding_settings.ShowWrHolders) && !getTrackedPlayerName();
    }

    function playerNameFromExpandedRun(run) {
        if (!run || !run.players || !run.players.data || !run.players.data[0]) return "";
        const p = run.players.data[0];
        if (p.rel === "guest") return p.name || "";
        return (p.names && p.names.international) || p.name || "";
    }

    function wrLink(href, text) {
        return `<a target="_blank" style="text-decoration: none;color:#ADD8E6 !important;" href="${href}">${text}</a>`;
    }

    function formatWrRow(label, timeText, weblink, playerName) {
        let html = `${label}: ${wrLink(weblink, timeText)}`;
        if (shouldShowWrHolders() && playerName) {
            html += `<br>${wrLink(weblink, `by ${playerName}`)}`;
        }
        return html;
    }

    function formatTrackRow(label, timeText, weblink) {
        if (!weblink) return `${label}: ${timeText}`;
        return `${label}: ${wrLink(weblink, timeText)}`;
    }

    function formatTimeTSeconds(timeT) {
        if (typeof timeT !== "number" || !isFinite(timeT)) return "None";
        const totalMs = Math.round(timeT * 1000);
        const hours = Math.floor(totalMs / 3600000);
        const minutes = Math.floor((totalMs % 3600000) / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        const milliseconds = totalMs % 1000;
        let convertedTime = "";
        if (hours > 0) convertedTime += hours + "h";
        if (minutes > 0 || hours > 0) convertedTime += minutes + "m";
        convertedTime += seconds + "s";
        if (hours === 0 && milliseconds > 0) {
            convertedTime += String(milliseconds).padStart(3, "0") + "ms";
        }
        if (hours > 0) {
            convertedTime = convertedTime.split("s")[0] + "s";
        }
        return convertedTime;
    }

    async function loadRunsBoard(modeName, level) {
        const file = LEVEL_TO_RUNS_FILE[level];
        if (!file) throw new Error("Unknown level for runs board: " + level);
        await loadRunsDerived();
        const folder = modeFolderName(modeName);
        const cacheKey = `${folder}/${file}`;
        const cached = runsBoardCache[cacheKey];
        if (cached && cached.version === fssVersion) {
            return cached.data;
        }
        if (runsBoardPromises[cacheKey]) return runsBoardPromises[cacheKey];

        const url = `${FASTSNAKE_BASE}/runs/${folder}/${file}`;
        runsBoardPromises[cacheKey] = (async () => {
            const data = await getJSON(url, { bust: fssVersion });
            window.requestsMade += 1;
            runsBoardCache[cacheKey] = { data, version: fssVersion };
            return data;
        })().finally(() => {
            delete runsBoardPromises[cacheKey];
        });
        return runsBoardPromises[cacheKey];
    }

    function findBestTrackedRun(boardData, playerName, categoryKey) {
        if (!boardData || !boardData.runs) return null;
        const target = playerName.toLowerCase();
        let best = null;
        for (const run of Object.values(boardData.runs)) {
            if (!run || !run.playerName) continue;
            if (String(run.playerName).toLowerCase() !== target) continue;
            if (run.category !== categoryKey) continue;
            if (typeof run.timeT !== "number") continue;
            if (!best || run.timeT < best.timeT) best = run;
        }
        return best;
    }

    // Look up one category key as of the latest runs-derived date
    async function getRecordForKey(cacheKey) {
        const { timelines, date } = await loadRunsDerived();
        const top = wrAsOf(timelines.boards[cacheKey], date);
        return {
            date,
            success: top.length > 0,
            runs: top.map((r) => expandCompactRun(r, date)),
        };
    }

    // Preload timelines (startup / legacy hooks)
    async function getLatestCacheData() {
        const { timelines, date } = await loadRunsDerived();
        return { date, source: "runs-derived", boards: timelines.boards };
    }

    // Legacy function for compatibility (now uses runs-derived)
    window.makeAPIrequest = function (requestURL, callback) {
        if (window.NepDebug) {
            console.log("Legacy API request called, using runs-derived instead");
        }
        getLatestCacheData().then(data => {
            if (callback && typeof callback === "function") {
                callback(data);
            }
        }).catch(error => {
            if (window.NepDebug) {
                console.error("Runs-derived fetch failed:", error);
            }
            if (callback && typeof callback === "function") {
                callback({ data: { runs: [] } });
            }
        });
    }

    // Legacy function for compatibility
    window.getGameDetails = function () {
        if (window.NepDebug) {
            console.log("getGameDetails called - using runs-derived instead");
        }
        getLatestCacheData().catch(error => {
            if (window.NepDebug) {
                console.error("Failed to initialize runs-derived data:", error);
            }
        });
    }

    window.modeToTxt = {
        0: { name: "Classic" },
        1: { name: "Wall" },
        2: { name: "Portal" },
        3: { name: "Cheese" },
        4: { name: "Borderless" },
        5: { name: "Twin" },
        6: { name: "Winged" },
        7: { name: "Yin Yang" },
        8: { name: "Key" },
        9: { name: "Sokoban" },
        10: { name: "Poison" },
        11: { name: "Dimension" },
        12: { name: "Minesweeper" },
        13: { name: "Statue" },
        14: { name: "Light" },
        15: { name: "Shield" },
        16: { name: "Arrow" },
        17: { name: "Hotdog" },
        18: { name: "Magnet" },
        19: { name: "Gate" },
        20: { name: "Bridge" },
        21: { name: "Peaceful" },
        22: { name: "Blender" },
    }

    window.countToTxt = {
        0: { name: "1 Apple" },
        1: { name: "3 Apples" },
        2: { name: "5 Apples" },
        3: { name: "10 Apples" },
        4: { name: "Dice" },
        5: { name: "Bomb" },
        6: { name: "Tally" },
    }

    window.sizeToTxt = {
        0: { name: "Standard" },
        1: { name: "Small" },
        2: { name: "Large" },
    }

    window.speedToTxt = {
        0: { name: "Normal" },
        1: { name: "Fast" },
        2: { name: "Slow" },
    }

    daily_button.addEventListener("click", function() {
        SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e))
        EmptyAll()
      });

    window.getRecordSRC = async function (level) {
        const queryId = srcQueryId;

        if(window.daily_challenge){
            EmptyAll();
            return;
        }

        if (!window.pudding_settings.SpeedInfo) {
            // For those that don't want to see speedrun info, to keep the game stable without api calls
            EmptyAll();
            return;
        }

        // Modes list
        CLASSIC = 0
        WALL = 1
        PORTAL = 2
        CHEESE = 3
        BORDERLESS = 4
        TWIN = 5
        WINGED = 6
        YINYANG = 7
        KEY = 8
        SOKO = 9
        POISON = 10
        DIMENSION = 11
        MINESWEEPER = 12
        STATUE = 13
        LIGHT = 14
        SHIELD = 15
        ARROW = 16
        HOTDOG = 17
        MAGNET = 18
        GATE = 19
        BRIDGE = 20
        PEACEFUL = 21
        BLENDER = 22

        // Speed list
        DEFAULT_SPEED = 0
        FAST = 1
        SLOW = 2

        // Count settings
        ONE_APPLE = 0;
        THREE_APPLES = 1;
        FIVE_APPLES = 2;
        TEN_APPLES = 3;
        DICE = 4;
        BOMB = 5;


        let count = window.timeKeeper.getCurrentSetting("count");
        let speed = window.timeKeeper.getCurrentSetting("speed");
        let size = window.timeKeeper.getCurrentSetting("size");
        let mode = window.CurrentModeNum;

        // > 6 = beyond Tally (MoreMenu / custom counts)
        if (size > 2 || count > 6) {
            EmptyAll();
            return;
        }
        if (mode == BLENDER) {
            EmptyAll();
            return;
        }
        if (!shouldShowCategory(level, size, mode)) {
            if (queryId !== srcQueryId) return;
            if (level === "H") HandleHighscore("Empty");
            else if (level === "100") Handle100("Empty");
            else if (level === "50") Handle50("Empty");
            else if (level === "25") Handle25("Empty");
            else if (level === "All") HandleAll("Empty");
            return;
        }
        // Highscore WR: FSS typical HS modes; Tally CE-HS modes on Tally (not Peaceful)
        if (level === "H" && !canShowSrcHighscore(mode, count)) {
            if (queryId !== srcQueryId) return;
            HandleHighscore("Empty");
            return;
        }

        // Build cache key based on FastSnakeStats format
        const modeName = window.modeToTxt[mode].name;
        const countName = window.countToTxt[count].name;
        const speedName = window.speedToTxt[speed].name;
        const sizeName = window.sizeToTxt[size].name;
        
        // Determine category name
        let categoryName;
        if (level === "H") {
            categoryName = "High Score";
        } else {
            categoryName = level + " Apples";
        }

        // Build the cache key in FastSnakeStats format
        const cacheKey = `${countName}|${speedName}|${sizeName}|${modeName}|${categoryName}`;

        if (window.NepDebug) {
            console.log(`Looking for runs-derived key: ${cacheKey}`);
        }

        let recordData;
        try {
            recordData = await getRecordForKey(cacheKey);
        } catch (error) {
            if (window.NepDebug) {
                console.error("Failed to get runs-derived record:", error);
            }
            if (queryId !== srcQueryId) return;
            EmptyAll();
            return;
        }

        if (queryId !== srcQueryId) return;

        if (window.NepDebug) {
            console.log(`Record data for key ${cacheKey}:`, recordData);
        }

        if (!recordData || !recordData.success || !recordData.runs || recordData.runs.length === 0) {
            if (window.NepDebug) {
                console.log(`No successful runs found for key: ${cacheKey}`);
            }
            // Visible boards with no WR yet should show "None" (N/A boards already returned earlier)
            const empty = { data: { runs: [] } };
            switch (level) {
                case "25": Handle25(empty); break;
                case "50": Handle50(empty); break;
                case "100": Handle100(empty); break;
                case "All": HandleAll(empty); break;
                case "H": HandleHighscore(empty); break;
                default: break;
            }
            return;
        }

        // Runs are already expanded objects from runs-derived timelines
        const bestRun = recordData.runs[0];

        if (!bestRun || !bestRun.times || !bestRun.times.primary || !bestRun.weblink) {
            if (window.NepDebug) {
                console.log(`Invalid run data structure for key: ${cacheKey}`, bestRun);
            }
            const empty = { data: { runs: [] } };
            switch (level) {
                case "25": Handle25(empty); break;
                case "50": Handle50(empty); break;
                case "100": Handle100(empty); break;
                case "All": HandleAll(empty); break;
                case "H": HandleHighscore(empty); break;
                default: break;
            }
            return;
        }

        const runData = {
            data: {
                runs: [{
                    run: {
                        times: { primary: bestRun.times.primary },
                        weblink: bestRun.weblink
                    },
                    playerName: playerNameFromExpandedRun(bestRun)
                }]
            }
        };

        if (queryId !== srcQueryId) return;

        switch (level) {
            case "H": HandleHighscore(runData); break;
            case "25": Handle25(runData); break;
            case "50": Handle50(runData); break;
            case "100": Handle100(runData); break;
            case "All": HandleAll(runData); break;
            default:
                if (window.NepDebug) {
                    console.warn(`No handler found for level: ${level}`);
                }
                break;
        }

    }

    //window.getRecordSRC("H");

    function EmptyTracking() {
        for (const id of ["25track", "50track", "100track", "Alltrack", "Htrack"]) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = "";
        }
    }

    function EmptyAll() {
        emp = "Empty"
        Handle25(emp);
        Handle50(emp);
        Handle100(emp);
        HandleAll(emp);
        HandleHighscore(emp);
        EmptyTracking();
        updateSrcAndTrackingVisibility();
    }

    function isBlenderMode() {
        if (window.CurrentModeNum === 22) return true;
        try {
            if (window.timeKeeper && typeof window.timeKeeper.getCurrentMode === "function") {
                return window.timeKeeper.getCurrentMode() === "blender";
            }
        } catch (e) { /* ignore */ }
        return false;
    }

    function updateSrcAndTrackingVisibility() {
        const srcSection = document.getElementById("src-section");
        const trackSection = document.getElementById("tracking-section");
        const label = document.getElementById("tracking-label");
        const hideSrc = isBlenderMode() || !!window.daily_challenge;

        if (srcSection) {
            srcSection.style.display = hideSrc ? "none" : "block";
        }
        if (!trackSection) return;

        if (hideSrc) {
            trackSection.style.display = "none";
            EmptyTracking();
            return;
        }

        const name = getTrackedPlayerName();
        if (name) {
            trackSection.style.display = "block";
            if (label) label.textContent = `Tracking: ${name}`;
        } else {
            trackSection.style.display = "none";
            EmptyTracking();
        }
    }

    function updateTrackingSectionVisibility() {
        updateSrcAndTrackingVisibility();
    }

    window.refreshTrackedPlayerUi = function () {
        updateTrackingSectionVisibility();
    };

    window.fillTrackedPlayerSuggestions = function () {
        const list = document.getElementById("tracked-player-suggestions");
        if (!list) return;
        list.innerHTML = "";
        if (!timelinesData || !timelinesData.boards || !runsDatesMeta) return;
        const date = runsDatesMeta.availableDates[runsDatesMeta.availableDates.length - 1];
        const names = new Set();
        for (const timeline of Object.values(timelinesData.boards)) {
            const top = wrAsOf(timeline, date);
            for (const r of top) {
                if (r && r.n) names.add(r.n);
            }
        }
        for (const name of [...names].sort((a, b) => a.localeCompare(b))) {
            const opt = document.createElement("option");
            opt.value = name;
            list.appendChild(opt);
        }
    };

    window.getTrackedRecord = async function (level) {
        const queryId = srcQueryId;
        const trackIds = {
            "25": "25track",
            "50": "50track",
            "100": "100track",
            "All": "Alltrack",
            "H": "Htrack",
        };
        const elId = trackIds[level];
        const el = elId ? document.getElementById(elId) : null;
        const labels = {
            "25": "25 Apples",
            "50": "50 Apples",
            "100": "100 Apples",
            "All": "All Apples",
            "H": "Highscore",
        };

        if (!el) return;

        const playerName = getTrackedPlayerName();
        if (!playerName || !window.pudding_settings.SpeedInfo || window.daily_challenge) {
            el.innerHTML = "";
            return;
        }

        let count = window.timeKeeper.getCurrentSetting("count");
        let speed = window.timeKeeper.getCurrentSetting("speed");
        let size = window.timeKeeper.getCurrentSetting("size");
        let mode = window.CurrentModeNum;

        const WALL = 1, PORTAL = 2, CHEESE = 3, KEY = 8, SOKO = 9, POISON = 10;
        const MINESWEEPER = 12, STATUE = 13, SHIELD = 15, HOTDOG = 17, GATE = 19, BRIDGE = 20, BLENDER = 22;
        if (size > 2 || count > 6 || mode == BLENDER) {
            el.innerHTML = "";
            return;
        }
        if (!shouldShowCategory(level, size, mode)) {
            el.innerHTML = "";
            return;
        }
        // Tracking Highscore: same FSS rules as SRC WR (not Peaceful)
        if (level === "H" && !canShowSrcHighscore(mode, count)) {
            el.innerHTML = "";
            return;
        }

        const modeName = window.modeToTxt[mode].name;
        const countName = window.countToTxt[count].name;
        const speedName = window.speedToTxt[speed].name;
        const sizeName = window.sizeToTxt[size].name;
        const categoryName = level === "H" ? "High Score" : level + " Apples";
        const categoryKey = `${countName}|${speedName}|${sizeName}|${modeName}|${categoryName}`;

        try {
            const board = await loadRunsBoard(modeName, level);
            if (queryId !== srcQueryId) return;
            const best = findBestTrackedRun(board, playerName, categoryKey);
            if (!best) {
                el.innerHTML = `${labels[level]}: None`;
                return;
            }
            if (level === "H") {
                const primary = best.time || ("PT" + best.timeT + "S");
                const highscore = parseInt(String(primary).split(".")[1]).toString();
                const text = (isNaN(parseInt(highscore, 10)) ? String(Math.round(best.timeT * 1000)) : highscore) + " Apples";
                el.innerHTML = formatTrackRow(labels[level], text, best.weblink);
            } else {
                const text = best.time ? convertTime(best.time) : formatTimeTSeconds(best.timeT);
                el.innerHTML = formatTrackRow(labels[level], text, best.weblink);
            }
        } catch (error) {
            if (queryId !== srcQueryId) return;
            if (window.NepDebug) {
                console.error("Tracked run lookup failed:", error);
            }
            el.innerHTML = `${labels[level]}: None`;
        }
    };

    window.getAllSrc = async function () {
        const queryId = ++srcQueryId;
        if (isBlenderMode() || window.daily_challenge) {
            EmptyAll();
            return;
        }
        updateSrcAndTrackingVisibility();
        // Drop previous mode's WR/tracking immediately so it can't linger during fetch
        Handle25("Empty");
        Handle50("Empty");
        Handle100("Empty");
        HandleAll("Empty");
        HandleHighscore("Empty");
        EmptyTracking();

        const levels = ["25", "50", "100", "All", "H"];
        for (const element of levels) {
            if (queryId !== srcQueryId) return;
            await getRecordSRC(element);
        }
        if (queryId !== srcQueryId) return;
        if (getTrackedPlayerName()) {
            for (const element of levels) {
                if (queryId !== srcQueryId) return;
                await window.getTrackedRecord(element);
            }
        } else {
            EmptyTracking();
        }
        if (queryId !== srcQueryId) return;
        if (typeof window.fillTrackedPlayerSuggestions === "function") {
            window.fillTrackedPlayerSuggestions();
        }
        // Refresh personal PB gold colors now that FSS WRs are ready
        if (typeof window.SpeedInfoUpdate === "function") {
            window.SpeedInfoUpdate().catch(function (e) {
                console.error("SpeedInfoUpdate error:", e);
            });
        }
    }

    function Handle25(response) {
        if (response == "Empty") {
            document.getElementById('25src').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('25src').innerHTML = `25 Apples: None`
            return;
        }

        world_record = convertTime(response["data"]["runs"][0]["run"]["times"]["primary"]);
        const playerName = response["data"]["runs"][0].playerName || "";
        document.getElementById('25src').innerHTML = formatWrRow(
            "25 Apples",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );

        if (window.NepDebug) {
            //console.log("Found 25 apples " + world_record + " " + response["data"]["runs"][0]["run"].weblink)
        }
    }
    function Handle50(response) {
        if (response == "Empty") {
            document.getElementById('50src').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('50src').innerHTML = `50 Apples: None`
            return;
        }
        world_record = convertTime(response["data"]["runs"][0]["run"]["times"]["primary"]);
        const playerName = response["data"]["runs"][0].playerName || "";
        document.getElementById('50src').innerHTML = formatWrRow(
            "50 Apples",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );
    }
    function Handle100(response) {
        if (response == "Empty") {
            document.getElementById('100src').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('100src').innerHTML = `100 Apples: None`
            return;
        }
        world_record = convertTime(response["data"]["runs"][0]["run"]["times"]["primary"]);
        const playerName = response["data"]["runs"][0].playerName || "";
        document.getElementById('100src').innerHTML = formatWrRow(
            "100 Apples",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );
    }
    function HandleAll(response) {
        if (response == "Empty") {
            document.getElementById('Allsrc').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('Allsrc').innerHTML = `All Apples: None`
            return;
        }
        world_record = convertTime(response["data"]["runs"][0]["run"]["times"]["primary"]);
        const playerName = response["data"]["runs"][0].playerName || "";
        document.getElementById('Allsrc').innerHTML = formatWrRow(
            "All Apples",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );
    }

    function HandleHighscore(response) {

        if (response == "Empty") {
            document.getElementById('Hsrc').innerHTML = ` `
            return;
        }

        if (typeof response["data"]["runs"][0] == "undefined") {
            document.getElementById('Hsrc').innerHTML = `Highscore: None`
            return;
        }

        highscore = parseInt(response["data"]["runs"][0]["run"]["times"]["primary"].toString().split('.')[1]).toString();
        world_record = highscore + " Apples";
        const playerName = response["data"]["runs"][0].playerName || "";

        document.getElementById('Hsrc').innerHTML = formatWrRow(
            "Highscore",
            world_record,
            response["data"]["runs"][0]["run"].weblink,
            playerName
        );
        if (window.NepDebug) {
            //console.log("Found highscore " + highscore + " " + response["data"]["runs"][0]["run"].weblink)
        }
    }

    // This shit was generated by ChatGPT
    function convertTime(duration) {
        const regex = /PT(?:(\d+)H)?(?:(\d+)M)?([\d.]+)S/;
        const matches = duration.match(regex);

        let convertedTime = '';

        if (matches[1]) {
            convertedTime += matches[1] + 'h';
        }

        if (matches[2]) {
            convertedTime += matches[2] + 'm';
        }

        const seconds = parseFloat(matches[3]);

        if (seconds > 0 || convertedTime === '') {
            const wholeSeconds = Math.floor(seconds);
            convertedTime += wholeSeconds + 's';

            const milliseconds = String(Math.round((seconds - wholeSeconds) * 1000)).padStart(3, "0");

            if (milliseconds > 0) {
                convertedTime += milliseconds + 'ms';
            }
        }

        if (convertedTime.includes('h')) {
            convertedTime = convertedTime.split('s')[0] + "s";
        }

        return convertedTime;
    }

    function countOccurrences(str, char) {
        const regex = new RegExp(char, "g");
        const matches = str.match(regex);
        return matches ? matches.length : 0;
    }

    // Prefetch runs-derived timelines on startup
    getLatestCacheData().then(() => {
        if (typeof window.fillTrackedPlayerSuggestions === "function") {
            window.fillTrackedPlayerSuggestions();
        }
    }).catch(error => {
        if (window.NepDebug) {
            console.error("Failed to initialize runs-derived data:", error);
        }
    });

   // window.speedinfoVisible = false;

    window.SpeedInfoShow = function () {
        const speedinfoBox = document.getElementById('speedinfo-popup-pudding');
        speedinfoBox.style.display = 'flex';
        speedinfoBox.style.visibility = 'visible';
        window.pudding_settings.SpeedInfo = true;

        window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));
    }

    window.SpeedInfoHide = function () {
        const speedinfoBox = document.getElementById('speedinfo-popup-pudding');
        speedinfoBox.style.display = 'flex';
        speedinfoBox.style.visibility = 'hidden';
        window.pudding_settings.SpeedInfo = false;
        document.getElementById('AlwaysOnTimeKeeper').checked = false;
    }

    window.SpeedInfoSetup = function () {

        const d = document.createElement('div');
        d.id = 'speedinfo-container';
        d.style = 'position:absolute;left:465px;top:45px;z-index:10000;';
        document.getElementsByClassName('sEOCsb')[0].appendChild(d);
        const speedinfoElement = document.querySelector('#speedinfo-container');


        const speedinfoBox = document.createElement('div');
        speedinfoBox.style = window.puddingSidebarStyle;
        speedinfoBox.id = 'speedinfo-popup-pudding';
        speedinfoBox.style.visibility = 'hidden';
        speedinfoBox.style.display = 'flex';
        speedinfoBox.style.flexDirection = 'column';
        speedinfoBox.style.boxSizing = 'border-box';
        window.speedinfoInput = speedinfoBox;
        const siSection =
            "margin:0 0 6px;padding:0 0 6px;border-bottom:1px solid rgba(255,255,255,0.22);";
        const siLabel =
            "margin:3px;color:white;font-family:Roboto,Arial,sans-serif;";
        const siTitle =
            "font-weight:bold;color:white;font-family:Roboto,Arial,sans-serif;";
        speedinfoBox.innerHTML = `

        <div id="si-main" style="flex:1;min-height:0;overflow:hidden;">
        <div id="si-personal" style="${siSection}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 3px;">
        <span style="${siTitle}">Speed Info</span>
        <button class="btn" style="margin:0;padding:2px 8px;font-size:12px;line-height:1.2;color:white;background-color:#1155CC;font-family:Roboto,Arial,sans-serif;" id="time-keeper" jsname="time-keeper">Details</button>
        </div>
        <label id="mode-selected" class="form-check-label" style="${siLabel}"></label><br>
        <label id="mode-selected2" class="form-check-label" style="${siLabel}"></label><br>
        <label id="25" class="form-check-label" style="${siLabel}"></label><br>
        <label id="50" class="form-check-label" style="${siLabel}"></label><br>
        <label id="100" class="form-check-label" style="${siLabel}"></label><br>
        <label id="ALL" class="form-check-label" style="${siLabel}"></label><br>
        <label id="H" class="form-check-label" style="${siLabel}"></label><br>
        <label id="att" class="form-check-label" style="${siLabel}"></label><br>
        </div>

        <div id="src-section" style="${siSection}">
        <span style="${siTitle}display:flex;justify-content:center;align-items:center;text-align:center;">SRC World Records</span>
        <label id="25src" class="form-check-label" style="${siLabel}"></label><br>
        <label id="50src" class="form-check-label" style="${siLabel}"></label><br>
        <label id="100src" class="form-check-label" style="${siLabel}"></label><br>
        <label id="Allsrc" class="form-check-label" style="${siLabel}"></label><br>
        <label id="Hsrc" class="form-check-label" style="${siLabel}"></label><br>
        </div>

        <div id="tracking-section" style="display:none;${siSection}">
        <span id="tracking-label" style="${siTitle}display:flex;justify-content:center;align-items:center;text-align:center;">Tracking</span>
        <label id="25track" class="form-check-label" style="${siLabel}"></label><br>
        <label id="50track" class="form-check-label" style="${siLabel}"></label><br>
        <label id="100track" class="form-check-label" style="${siLabel}"></label><br>
        <label id="Alltrack" class="form-check-label" style="${siLabel}"></label><br>
        <label id="Htrack" class="form-check-label" style="${siLabel}"></label><br>
        </div>
        </div>

        <div id="input-display-section" style="display:none;flex-shrink:0;margin-top:auto;margin-bottom:0;width:100%;min-height:104px;box-sizing:border-box;padding:6px 0 0;border-top:1px solid rgba(255,255,255,0.22);justify-content:center;align-items:flex-end;"></div>

  <button class="btn" style="display:none;margin:3px;color:white;background-color:#1155CC;font-family:Roboto,Arial,sans-serif;" id="speedinfo-close" jsname="speedinfo-close">Close</button>

  `;

  document.getElementsByClassName('sEOCsb')[0].appendChild(speedinfoBox);
        updateTrackingSectionVisibility();

        const speedinfoCloseElements = document.getElementById('speedinfo-close');
        speedinfoCloseElements.addEventListener('click', window.SpeedInfoHide);
        //speedinfoCloseElements[1].addEventListener('click', hideSettingsBox);


        //document.getElementById('toggle-counter').addEventListener('click', toggleCounter);

        tempID = "time-keeper"; // Inspect element on Timer and take jsname from it
        document.querySelector("button[jsname^=\"" + tempID + "\"]").addEventListener("click", (e) => {
            if(!window.daily_challenge){
                window.timeKeeper.toggleDialog();
            }
        });

        //debugger
    }

    window.SpeedInfoSetup();

    window.ToggleSpeedInfo = function () {

          window.pudding_settings.SpeedInfo = !window.pudding_settings.SpeedInfo;

        if (window.pudding_settings.SpeedInfo) {
            // Show it
            window.SpeedInfoShow();
        }
        else {
            // Hide it
            window.SpeedInfoHide();
        }
    }

    //Listeners to hide/show speedinfo box
    const backButton = 'p17HVe';
    document.querySelector("[class^=\"" + backButton + "\"]").addEventListener("click", (e) => {
        window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));
    });

    const playButton = 'NSjDf';
    document.querySelector("[jsname^=\"" + playButton + "\"]").addEventListener("click", (e) => {
        window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));
    });

    window.SpeedInfoUpdate = function () {
        // Coalesce death/reset/addAttempt bursts into one paint
        if (window._speedInfoUpdateTimer) {
            return window._speedInfoUpdatePromise || Promise.resolve();
        }
        window._speedInfoUpdatePromise = new Promise(function (resolve, reject) {
            window._speedInfoUpdateTimer = setTimeout(function () {
                window._speedInfoUpdateTimer = null;
                runSpeedInfoUpdate()
                    .then(resolve, reject)
                    .finally(function () {
                        window._speedInfoUpdatePromise = null;
                    });
            }, 0);
        });
        return window._speedInfoUpdatePromise;
    };

    async function runSpeedInfoUpdate() {
        const gen = (window._speedInfoUpdateGen = (window._speedInfoUpdateGen || 0) + 1);
        if (!window._speedInfoGoldCache) window._speedInfoGoldCache = {};

        let count;
        let speed;
        let size;
        let modeKey;
        let mode = window.CurrentModeNum;
        const midRun =
            window.timeKeeper &&
            (window.timeKeeper.runStarted || window.timeKeeper.playing) &&
            typeof window.timeKeeper.mode === "string" &&
            typeof window.timeKeeper.count === "number";

        if (midRun) {
            modeKey = window.timeKeeper.mode;
            count = window.timeKeeper.count;
            speed = window.timeKeeper.speed;
            size = window.timeKeeper.size;
        } else {
            if (window.ModeRegistry && typeof window.ModeRegistry.has === "function") {
                try {
                    window.isBridge = window.ModeRegistry.has("bridge");
                } catch (e) { /* trophy DOM may be missing early */ }
            }
            count = window.timeKeeper.getCurrentSetting("count");
            speed = window.timeKeeper.getCurrentSetting("speed");
            size = window.timeKeeper.getCurrentSetting("size");
            modeKey = window.timeKeeper.getCurrentMode();
        }

        let storage = {};
        try {
            storage =
                typeof window.timeKeeper.getStorage === "function"
                    ? window.timeKeeper.getStorage()
                    : JSON.parse(localStorage["snake_timeKeeper"] || "{}");
        } catch (e) {
            storage = {};
        }

        const gamemode = window.ModeRegistry
            ? window.ModeRegistry.labelModeKey(modeKey)
            : modeKey;

        mode_label = document.getElementById("mode-selected");
        mode_label2 = document.getElementById("mode-selected2");

        if (window.daily_challenge) {
            mode_label.innerHTML = "Daily Challenge";
            mode_label2.innerHTML = "(TimeKeeper disabled)";
            for (const score of ["att", "25", "50", "100", "ALL", "H"]) {
                const el = document.getElementById(score);
                if (el) el.innerHTML = "";
            }
            updateSrcAndTrackingVisibility();
            return;
        }

        updateSrcAndTrackingVisibility();

        mode_label.innerHTML =
            gamemode +
            ", " +
            window.HandleCount(count).substring(0, window.HandleCount(count).lastIndexOf(","));
        mode_label2.innerHTML = window.HandleSpeed(speed) + window.HandleSize(size);

        const fmt = window.timeKeeper.formatTimeSrcStyle
            ? window.timeKeeper.formatTimeSrcStyle.bind(window.timeKeeper)
            : function (ms) {
                  return String(ms);
              };

        const goldJobs = [];

        for (const score of ["att", "25", "50", "100", "ALL", "H"]) {
            const name = score + "-" + modeKey + "-" + count + "-" + speed + "-" + size;
            const bold = document.getElementById(score);
            if (!bold) continue;

            if (score == "att") {
                const totalAttempts =
                    typeof window.timeKeeper.getAttemptTotal === "function"
                        ? window.timeKeeper.getAttemptTotal(storage[name])
                        : typeof storage[name] === "number"
                          ? storage[name]
                          : 0;
                bold.innerHTML = "Total Attempts: " + totalAttempts;
                continue;
            }

            // Match SRC visibility (100/YY50); Highscore always shown locally
            if (!shouldShowCategory(score === "ALL" ? "All" : score, size, mode)) {
                bold.innerHTML = "";
                continue;
            }

            if (score == "H") {
                if (typeof storage[name] != "undefined" && storage[name].high != null) {
                    const highText = String(storage[name].high) + " Apples";
                    const gKey = goldCacheKey(modeKey, count, speed, size, "H", highText);
                    const knownGold = window._speedInfoGoldCache[gKey];
                    bold.innerHTML =
                        "Highscore: " +
                        pbValueHtml(highText, "H", mode, count, speed, size, !!knownGold);
                    if (canShowSrcHighscore(mode, count)) {
                        goldJobs.push({
                            score: "H",
                            elId: "H",
                            labelPrefix: "Highscore: ",
                            displayText: highText,
                            pb: storage[name],
                            gKey: gKey,
                        });
                    }
                } else {
                    bold.innerHTML = "Highscore: None";
                }
                continue;
            }

            const label = score === "ALL" ? "All Apples" : score + " Apples";
            if (typeof storage[name] != "undefined" && storage[name].time != null) {
                const displayText = fmt(storage[name].time);
                const gKey = goldCacheKey(modeKey, count, speed, size, score, displayText);
                const knownGold = window._speedInfoGoldCache[gKey];
                bold.innerHTML =
                    label +
                    ": " +
                    pbValueHtml(displayText, score, mode, count, speed, size, !!knownGold);
                goldJobs.push({
                    score: score,
                    elId: score,
                    labelPrefix: label + ": ",
                    displayText: displayText,
                    pb: storage[name],
                    gKey: gKey,
                });
            } else {
                bold.innerHTML = label + ": None";
            }
        }

        if (goldJobs.length === 0) return;

        const goldMode = mode;
        const goldCount = count;
        const goldSpeed = speed;
        const goldSize = size;
        const goldModeKey = modeKey;
        setTimeout(function () {
            if (gen !== window._speedInfoUpdateGen) return;
            Promise.all(
                goldJobs.map(function (job) {
                    return shouldGoldPb(
                        job.score,
                        goldMode,
                        goldCount,
                        goldSpeed,
                        goldSize,
                        job.pb,
                        goldModeKey
                    ).then(function (gold) {
                        return { job: job, gold: gold };
                    });
                })
            )
                .then(function (results) {
                    if (gen !== window._speedInfoUpdateGen) return;
                    for (let i = 0; i < results.length; i++) {
                        const r = results[i];
                        window._speedInfoGoldCache[r.job.gKey] = !!r.gold;
                        const el = document.getElementById(r.job.elId);
                        if (!el) continue;
                        el.innerHTML =
                            r.job.labelPrefix +
                            pbValueHtml(
                                r.job.displayText,
                                r.job.score,
                                goldMode,
                                goldCount,
                                goldSpeed,
                                goldSize,
                                !!r.gold
                            );
                    }
                })
                .catch(function (e) {
                    if (window.NepDebug) console.error("SpeedInfo gold update failed:", e);
                });
        }, 0);
    }

    window.HandleCount = function (count) {
        switch (count) {
            case 0: return "1 Apple, "; break;
            case 1: return "3 Apples, "; break;
            case 2: return "5 Apples, "; break;
            case 3: return "10 Apples, "; break;
            case 4: return "Dice count, "; break;
            case 5: return "Bomb count, "; break;
            case 6: return "Tally count, "; break;
            default: return "MoreMenu Apples, "; break;
        }
    }
    window.HandleSpeed = function (speed) {
        switch (speed) {
            case 0: return "Normal speed, "; break;
            case 1: return "Fast speed, "; break;
            case 2: return "Slow speed, "; break;
            default: return "MoreMenu speed, "; break;

        }
    }
    window.HandleSize = function (size) {
        switch (size) {
            case 0: return "Normal size"; break;
            case 1: return "Small size"; break;
            case 2: return "Large size"; break;
            default: return "MoreMenu size"; break;
        }
    }

}

window.SpeedInfo.alterCode = function (code) {
    
    reset_regex = new RegExp(/;this\.reset\(\)\}\}/)

    speedinfo_reset = `;window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));
    if(window.first_time_call){window.getAllSrc().catch(e=>console.error('getAllSrc error:',e));window.first_time_call=false;}
    ;$&`


    catchError(reset_regex, code)
    code = code.assertReplace(reset_regex, speedinfo_reset);

    switch_regex = new RegExp(/switch\(b\){case "apple"/)
    speedinfo_switch = `window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));switch(b){case "apple"`
    code = code.assertReplace(switch_regex, speedinfo_switch);

    window.CurrentModeNum = 0;
    mode_regex = new RegExp(/case "trophy"\:/)
    // Set mode first, then refresh personal + SRC after CurrentModeNum is assigned
    mode_get_code = `case "trophy":queueMicrotask(function(){window.SpeedInfoUpdate().catch(function(e){console.error('SpeedInfoUpdate error:',e);});window.getAllSrc().catch(function(e){console.error('getAllSrc error:',e);});});window.CurrentModeNum = `
    code = code.assertReplace(mode_regex, mode_get_code);

    /*
    count_regex = new RegExp(/case "count"\:/)
    count_get_code = `case "count":window.getAllSrc();`
    code = code.assertReplace(mode_regex, count_get_code);

    speed_regex = new RegExp(/case "speed"\:/)
    speed_get_code = `case "speed":window.getAllSrc();`
    code = code.assertReplace(speed_regex, speed_get_code);

    size_regex = new RegExp(/case "size"\:/)
    size_get_code = `case "size":window.getAllSrc();`
    code = code.assertReplace(size_regex, size_get_code);
    */

    return code;
}
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
  }

}

window.TopBar.alterCode = function (code) {

  window.count_img_arr = Array.from(document.querySelector('#count').children).map(el=>el.src);
  window.speed_img_arr = Array.from(document.querySelector('#speed').children).map(el=>el.src);

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
  fruit_src = `document.querySelector('[jsname="${fruit_jsname}"]').src `

  window.mute_divs = document.querySelectorAll('[aria-label="Mute"]');
  window.mute_default_innerHTML = [window.mute_divs[0].innerHTML, window.mute_divs[1].innerHTML]
  window.mute_speed_element = document.createElement('img');
  window.mute_speed_element.classList.add('EFcTud')
  window.mute_speed_element.src = "https://www.google.com/logos/fnbx/snake_arcade/v3/speed_00.png"
  window.mute_speed_element.style.padding = '0px';
  window.mute_speed_copy = window.mute_speed_element.cloneNode(true);

  window.control_mute_img = function control_mute_img(TopBar, SpeedSrc) {
    if (TopBar) {
      for (let index = 0; index < window.mute_divs.length; index++) {
        const element = window.mute_divs[index];
        element.innerHTML = ''
      }
      window.mute_speed_element.src = SpeedSrc
      window.mute_speed_copy.src = SpeedSrc
      window.mute_divs[0].appendChild(window.mute_speed_element)
      window.mute_divs[1].appendChild(window.mute_speed_copy)
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

  return code;
}
window.BootstrapMenuSpeedrun = {};

window.BootstrapMenuSpeedrun.make = function () {

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

    window.ToggleScrollbar = function () {
        window.pudding_settings.ScrollBar = !window.pudding_settings.ScrollBar;
        if (window.pudding_settings.ScrollBar) {
            // Disable it
            document.body.style.overflow = 'hidden';
        }
        else {
            // Enable it
            document.body.style.overflow = '';
        }
    }


    window.BootstrapSetup = function () {

        const a = new Image();
        a.src = getStatIconImageSrc();
        a.id = 'stat-icon';
        a.width = a.height = 25;
        a.style = 'position:relative;left:200px;top:70px;';
        window.divList = document.createElement('div');
        divList.class = 'counter-num'
        divList.style = 'width:25px;z-index:5;position:relative;left:230px;top:45px;font-size:14px;font-family:Roboto,Arial,sans-serif;color:white;font-size:14px;line-height: normal;'
        divList.id = 'counter-num'

        document.getElementsByClassName('sEOCsb')[0].appendChild(a);
        document.getElementsByClassName('sEOCsb')[0].appendChild(divList);

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

        <script src="https://code.jquery.com/jquery-3.7.0.slim.js" integrity="sha256-7GO+jepT9gJe9LB4XFf8snVOjX3iYNb0FHYr5LI1N5c=" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.2/dist/umd/popper.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" crossorigin="anonymous"></script>

        <span style="color:white;font-family:Roboto,Arial,sans-serif;display:flex; justify-content: center; align-items: center; text-align: center;">Speedrun Mod Settings</span>

    <select style="margin-top:3px;margin-bottom:3px;margin-left: auto; margin-right: auto;background-color:#1155CC;color:white;font-family:Roboto,Arial,sans-serif;display:flex; justify-content: center; align-items: center; text-align: center; align:center;" id="stat-chooser" class="form-control">
        <option value="inputGame">Count game inputs</option>
        <option value="inputSession">Count session inputs</option>
        <option value="inputLifetime">Count lifetime inputs</option>
        <option value="playsSession">Count session resets</option>
        <option value="playsLifetime">Count lifetime resets</option>
        <option value="applesSession">Count fruit session</option>
        <option value="applesLifetime">Count fruit lifetime</option>
        <option value="wallsGame">Count walls</option>
        <option value="hideCount">Hide counter</option>
    </select>

  <button class="btn" style="margin:3px;color:white;background-color:#1155CC;font-family:Roboto,Arial,sans-serif;" id="edit-stat">Edit stat</button>
  <button class="btn" style="margin:3px;color:white;background-color:#1155CC;font-family:Roboto,Arial,sans-serif;" id="reset-stats">Reset stats</button><br>
  <div class="form-check form-check-inline">
    <input class="form-check-input" type="checkbox" role="switch" id="SkullPoisonFruit">
    <label class="form-check-label" for="SkullPoisonFruit" style="margin:3px;color:white;font-family:Roboto,Arial,sans-serif;">Skull Poison Fruit</label>
    </div>
    <div class="form-check form-check-inline">
    <input class="form-check-input" type="checkbox" role="switch" id="DistinctSokoGoals">
    <label class="form-check-label" for="DistinctSokoGoals" style="margin:3px;color:white;font-family:Roboto,Arial,sans-serif;">Distinct Soko Goals</label>
    </div>
    <div class="form-check form-check-inline">
    <input class="form-check-input" type="checkbox" role="switch" id="TopBarIcons">
    <label class="form-check-label" for="TopBarIcons" style="margin:3px;color:white;font-family:Roboto,Arial,sans-serif;">Top Bar Icons</label>
    </div>
    <div class="form-check form-check-inline">
    <input class="form-check-input" type="checkbox" role="switch" id="AlwaysOnTimeKeeper">
    <label class="form-check-label" for="AlwaysOnTimeKeeper" style="margin:3px;color:white;font-family:Roboto,Arial,sans-serif;">Show Speed Info</label>
    </div>
    <div class="form-check form-check-inline">
    <input class="form-check-input" type="checkbox" role="switch" id="DisableRandom">
    <label class="form-check-label" for="DisableRandom" style="margin:3px;color:white;font-family:Roboto,Arial,sans-serif;">Disable Randomizer</label>
    </div>
    <div class="form-check form-check-inline">
    <input class="form-check-input" type="checkbox" role="switch" id="RemoveScrollbar">
    <label class="form-check-label" for="RemoveScrollbar" style="margin:3px;color:white;font-family:Roboto,Arial,sans-serif;">Remove Scrollbar</label>
    </div>
    <div class="form-check form-check-inline">
    <input class="form-check-input" type="checkbox" role="switch" id="SaveGameSettings">
    <label class="form-check-label" for="SaveGameSettings" style="margin:3px;color:white;font-family:Roboto,Arial,sans-serif;">Save Game Settings</label>
    </div>
  <button class="btn" style="margin:3px;color:white;background-color:#1155CC;font-family:Roboto,Arial,sans-serif;" id="ResetKeybind">Reset Key: Shift</button><br>

<select style="display:none;margin:3px;background-color:#1155CC;color:white;font-family:Roboto,Arial,sans-serif; align-items: center; text-align: center;" id="snakePride" class="form-control flex-row">
  <option value="0">Default Rainbow</option>
</select>

  <button class="btn" style="display:none;margin:3px;color:white;background-color:#1155CC;font-family:Roboto,Arial,sans-serif;" id="settings-close" jsname="settings-close">Close</button>

  <br>
  <button class="btn" style="margin:3px;color:white;background-color:#1155CC;font-family:Roboto,Arial,sans-serif;" id="ScrollLeftBtn">Scroll Left</button><br>

  `;

  document.getElementsByClassName('sEOCsb')[0].appendChild(settingsBox);

        ScrollLeftBtn = document.getElementById("ScrollLeftBtn");
        ScrollLeftBtn.style.display = 'none';

        skull_checkbox = document.getElementById("SkullPoisonFruit");
        skull_checkbox.checked = window.pudding_settings.Skull;
        skull_checkbox.addEventListener("change", toggle_skull_func);

        soko_checkbox = document.getElementById("DistinctSokoGoals");
        soko_checkbox.checked = window.pudding_settings.SokoGoals;
        soko_checkbox.addEventListener("change", toggle_soko_goal);

        topbar_checkbox = document.getElementById("TopBarIcons");
        topbar_checkbox.addEventListener("change", window.toggle_topbar_icons);
        topbar_checkbox.checked = window.pudding_settings.TopBar;

        speedinfo_checkbox = document.getElementById("AlwaysOnTimeKeeper");
        speedinfo_checkbox.addEventListener("change", window.ToggleSpeedInfo);
        speedinfo_checkbox.checked = window.pudding_settings.SpeedInfo;

        randombtn_checkbox = document.getElementById("DisableRandom");
        randombtn_checkbox.addEventListener("change", window.ToggleRandom);
        randombtn_checkbox.checked = window.pudding_settings.DisableRandom;
        window.applyRandomButtonState(window.pudding_settings.DisableRandom);

        scrollbtn_checkbox = document.getElementById("RemoveScrollbar");
        scrollbtn_checkbox.addEventListener("change", window.ToggleScrollbar);
        scrollbtn_checkbox.checked = window.pudding_settings.ScrollBar;

        if (window.pudding_settings.ScrollBar) {
            // Disable it
            document.body.style.overflow = 'hidden';
        }
        else {
            // Enable it
            document.body.style.overflow = '';
        }

        const saveGameSettingsCheckbox = document.getElementById("SaveGameSettings");
        if (typeof window.pudding_settings.SaveGameSettings !== "boolean") {
            window.pudding_settings.SaveGameSettings = true;
        }
        saveGameSettingsCheckbox.checked = !!window.pudding_settings.SaveGameSettings;
        saveGameSettingsCheckbox.addEventListener("change", function () {
            window.pudding_settings.SaveGameSettings = !!saveGameSettingsCheckbox.checked;
            if (typeof window.saveSettings === "function") window.saveSettings();
        });

        if(window.isSnakeMobileVersion){
            speedinfo_checkbox.disabled = true;
            speedinfo_checkbox.checked = false;
            window.SpeedInfoHide();

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
            wallsGame: { stat: 'walls', duration: 'game' },
            hideCount: { stat: 'hide', duration: 'count' },
        }

        document.querySelector(`#stat-chooser option[value=${settingsToValues[stats.statShown][stats.statDurationShown]}]`).selected = true;

        const settingsCloseElements = document.getElementById('settings-close');
        settingsCloseElements.addEventListener('click', window.BootstrapHide);

        document.getElementById('stat-chooser').onchange = function () {
            stats.statShown = valuesToSettings[this.value].stat;
            stats.statDurationShown = valuesToSettings[this.value].duration;
            document.getElementById('stat-icon').src = getStatIconImageSrc();
            updateCounterDisplay();
        }

        document.getElementById('edit-stat').addEventListener('click', promptToEditStatCount);
        document.getElementById('reset-stats').addEventListener('click', promptToResetStats);
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

window.BootstrapMenuSpeedrun.alterCode = function (code) {
    if(window.pudding_settings.SpeedInfo)
    {
        window.SpeedInfoShow();
    }
    setTimeout(function () {
        if (typeof window.applySavedGameSettingsOnce === "function") {
            window.applySavedGameSettingsOnce();
        }
    }, 0);
    return code;
}
window.ResetKeySpeedrun = {};

window.ResetKeySpeedrun.make = function () {
    window._speedrunKeybinds = JSON.parse(localStorage.getItem("keybinds")) || {};
    if (!window._speedrunKeybinds.resetKey) {
        window._speedrunKeybinds.resetKey = "Shift";
    }

    const button = document.getElementById("ResetKeybind");
    window._speedrunResetKeyButton = button;
    if (button) {
        button.textContent = "Reset Key: " + window._speedrunKeybinds.resetKey;
        button.addEventListener("click", function () {
            button.textContent = "Press any key...";
            document.addEventListener("keydown", function handler(e) {
                window._speedrunKeybinds.resetKey = e.key;
                button.textContent = "Reset Key: " + e.key;
                localStorage.setItem("keybinds", JSON.stringify(window._speedrunKeybinds));
                document.removeEventListener("keydown", handler);
            });
        });
    }
};

window.ResetKeySpeedrun.alterCode = function (code) {
    document.addEventListener("keydown", function (e) {
        if (e.repeat) return;
        const keybinds = window._speedrunKeybinds || {};
        if (e.key !== keybinds.resetKey) return;

        const resetButton = window._speedrunResetKeyButton || document.getElementById("ResetKeybind");
        window._speedrunResetKeyButton = resetButton;
        if (resetButton && resetButton.textContent === "Press any key...") return;
        if (window.timeKeeper && window.timeKeeper.dialogActive) return;
        if (document.getElementById("edit-box")) return;

        document.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27 }));
        const play = document.querySelector('[jsname="NSjDf"]');
        if (play) play.click();
    });
    return code;
};
window.SpeedrunPerf = {};

window.SpeedrunPerf.make = function () {
    function inRun() {
        const tk = window.timeKeeper;
        return !!(tk && (tk.playing || tk.runStarted) && !tk._deathHandled);
    }

    function allowFullSpeedInfo() {
        return !!window._speedrunAllowSpeedInfo || !inRun();
    }

    // --- Death latch: original death() is injected at the start of every tick ---
    if (window.timeKeeper && typeof window.timeKeeper.death === "function") {
        const origDeath = window.timeKeeper.death;
        window.timeKeeper.death = function (time, score) {
            if (window.timeKeeper._deathHandled) return;
            window.timeKeeper._deathHandled = true;
            origDeath(time, score);
            if (typeof window.timeKeeper.flushStorage === "function") {
                window.timeKeeper.flushStorage();
            }
        };
    }

    if (window.timeKeeper && typeof window.timeKeeper.start === "function") {
        const origStart = window.timeKeeper.start;
        window.timeKeeper.start = function () {
            window.timeKeeper._deathHandled = false;
            return origStart.apply(this, arguments);
        };
    }

    if (window.timeKeeper && typeof window.timeKeeper.addAttempt === "function") {
        const origAddAttempt = window.timeKeeper.addAttempt;
        window.timeKeeper.addAttempt = function () {
            const result = origAddAttempt.apply(this, arguments);
            window.timeKeeper._deathHandled = false;
            return result;
        };
    }

    // --- gotApple: freeze context first, skip Dragon Fruit, cheap counter ---
    if (window.timeKeeper && typeof window.timeKeeper.gotApple === "function") {
        const origCounter = window.updateCounterDisplay;
        window.timeKeeper.gotApple = function (time, score) {
            window.timeKeeper.ensurePlaying();
            if (typeof stats !== "undefined") {
                stats.apples.session++;
                stats.apples.lifetime++;
                if (stats.statShown === "apples" && typeof origCounter === "function") {
                    origCounter();
                }
            }
            if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) return;

            window.timeKeeper.lastAppleDate = new Date();
            window.timeKeeper.lastAppleTime = time;

            if (score == 25 || score == 50 || score == 100) {
                window.timeKeeper.savePB(time, score);
            }
            window.timeKeeper.updateHighscoreLive(time, score);
        };
    }

    if (window.timeKeeper && typeof window.timeKeeper.gotAll === "function") {
        const origGotAll = window.timeKeeper.gotAll;
        window.timeKeeper.gotAll = function (time, score) {
            window._speedrunAllowSpeedInfo = true;
            try {
                return origGotAll(time, score);
            } finally {
                window._speedrunAllowSpeedInfo = false;
            }
        };
    }

    // --- Speed Info: skip if hidden; no gold/WR work mid-run ---
    function cheapHsPaint() {
        try {
            if (!window.pudding_settings || !window.pudding_settings.SpeedInfo) return;
            const el = document.getElementById("H");
            if (!el || !window.timeKeeper) return;
            const storage = window.timeKeeper.getStorage();
            const ctx = window.timeKeeper.getSaveContext();
            const rec = storage[window.timeKeeper.buildKey("H", ctx)];
            if (rec && rec.high != null) {
                el.textContent = "Highscore: " + rec.high + " Apples";
            }
        } catch (e) {}
    }

    if (typeof window.SpeedInfoUpdate === "function") {
        const origSpeedInfoUpdate = window.SpeedInfoUpdate;
        let debounceTimer = null;
        let debouncePromise = null;
        window.SpeedInfoUpdate = function () {
            if (window.pudding_settings && window.pudding_settings.SpeedInfo === false) {
                return Promise.resolve();
            }
            if (!allowFullSpeedInfo()) {
                cheapHsPaint();
                return Promise.resolve();
            }
            if (debounceTimer) return debouncePromise || Promise.resolve();
            debouncePromise = new Promise(function (resolve, reject) {
                debounceTimer = setTimeout(function () {
                    debounceTimer = null;
                    origSpeedInfoUpdate()
                        .then(resolve, reject)
                        .finally(function () {
                            debouncePromise = null;
                        });
                }, 32);
            });
            return debouncePromise;
        };
    }

    if (typeof window.getAllSrc === "function") {
        const origGetAllSrc = window.getAllSrc;
        window.getAllSrc = function () {
            if (inRun()) return Promise.resolve();
            return origGetAllSrc.apply(this, arguments);
        };
        // Shared SpeedInfo kicks getAllSrc on the first gameplay reset; prefetch idle instead
        window.first_time_call = false;
    }

    // --- saveSettings: skip while a run is in progress (reset injects this first) ---
    if (typeof window.saveSettings === "function") {
        const origSaveSettings = window.saveSettings;
        window.saveSettings = function () {
            if (window.timeKeeper && window.timeKeeper.runStarted) return;
            return origSaveSettings.apply(this, arguments);
        };
    }

    // --- Blender: cache random.png row; never scan every img ---
    if (window.ModeRegistry && typeof window.ModeRegistry._blenderSelectedIds === "function") {
        window.ModeRegistry._blenderSelectedIds = function (modes) {
            if (!window._speedrunBlenderRow) {
                const img =
                    document.querySelector('#trophy img[src*="random.png"]') ||
                    document.querySelector('img[src*="random.png"]');
                if (img) {
                    try {
                        window._speedrunBlenderRow = img.parentElement.parentElement.parentElement;
                    } catch (e) {
                        return [];
                    }
                }
            }
            const row = window._speedrunBlenderRow;
            if (!row) return [];
            try {
                const ids = [];
                let counter = -1;
                const trophyModes = modes.filter(function (m) {
                    return m.id !== "classic" && m.id !== "blender";
                });
                for (const child of row.children) {
                    counter++;
                    if (counter === 0) continue;
                    const selected =
                        child.firstElementChild &&
                        child.firstElementChild.classList.length > 1 &&
                        child.firstElementChild.children.length > 0;
                    if (!selected) continue;
                    const entry = trophyModes[counter - 1];
                    if (entry) ids.push(entry.id);
                }
                return ids;
            } catch (e) {
                return [];
            }
        };
    }

    // --- setTheme: no eval ---
    if (typeof window.setTheme === "function" && Array.isArray(window.themes)) {
        window.setTheme = function (theme_name) {
            const theme = window.themes.find(function (t) {
                return t.name === theme_name;
            });
            if (!theme) return;

            const colorByKey = {
                sep_color: theme.sep_color,
                topbar_color: theme.topbar_color,
                buttons_color: theme.buttons_color,
                bg_color: theme.bg_color,
                bottom_color: theme.bottom_color,
            };
            const loops = [
                { loop_on: window.ui_sep, attribute: "borderBottomColor", color: "sep_color" },
                { loop_on: window.ui_topbar, attribute: "background", color: "topbar_color" },
                { loop_on: window.ui_buttons, attribute: "background", color: "buttons_color" },
                { loop_on: window.input_button, attribute: "background", color: "buttons_color" },
                { loop_on: window.ui_background, attribute: "background", color: "bg_color" },
                { loop_on: window.ui_bottom, attribute: "background", color: "bottom_color" },
                { loop_on: window.boot_button, attribute: "backgroundColor", color: "buttons_color" },
                { loop_on: window.boot_check, attribute: "backgroundColor", color: "buttons_color" },
                { loop_on: window.boot_dropdown, attribute: "backgroundColor", color: "buttons_color" },
            ];
            for (let i = 0; i < loops.length; i++) {
                const spec = loops[i];
                if (!spec.loop_on) continue;
                const value = colorByKey[spec.color];
                for (let h = 0; h < spec.loop_on.length; h++) {
                    const node = spec.loop_on[h];
                    if (node && node.style) node.style[spec.attribute] = value;
                }
            }

            const settingsBox = document.getElementById("settings-popup-pudding");
            if (settingsBox) settingsBox.style.background = theme.real_top_bar;
            const speedinfo = document.getElementById("speedinfo-popup-pudding");
            if (speedinfo) speedinfo.style.background = theme.real_top_bar;
            const splitPanel = document.getElementById("split-panel-pudding");
            if (splitPanel) splitPanel.style.background = theme.real_top_bar;

            window.real_topbar_color = theme.real_top_bar;
            window.button_color = theme.buttons_color;

            if (window.snake) {
                if (theme_name !== "Globe") {
                    window.snake.setCustomTheme(
                        theme.light_tiles,
                        theme.dark_tiles,
                        theme.shadow,
                        theme.border,
                        theme.key_block_sign_color,
                        theme.real_top_bar,
                        theme.endscreen_background
                    );
                } else {
                    window.snake.clearCustomTheme();
                }
            }
        };
    }
};

window.SpeedrunPerf.alterCode = function (code) {
    // Wall spawn: only paint the counter when walls are the selected stat
    code = code.replace(
        /window\.wallCoords\.push\(\[([^\]]+)\]\);\s*updateCounterDisplay\(\);/,
        'window.wallCoords.push([$1]);if(stats.statShown==="walls")updateCounterDisplay();'
    );
    return code;
};
window.SpeedrunMod = {};

////////////////////////////////////////////////////////////////////
//RUNCODEBEFORE
////////////////////////////////////////////////////////////////////

window.SpeedrunMod.runCodeBefore = function () {
  window.isVisi = false;

  console.log("Thank you for loading Speedrun Mod!");
  console.log("Please provide feedback and report bugs in #snake-modding in the Official Google Snake Discord");
  console.log("Google Snake SRC Discord link: https://discord.gg/dDuCTm62EZ");

  window.getRandomBoolean = function () {
    return Math.random() < 0.5;
  };

  window.getRandomInt = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  window.escapeRegex = function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
  };

  window.loadCode = function loadAndRunCodeSynchronous(url) {
    let req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.onload = function () {
      if (this.status === 200) {
        (1, eval)(this.responseText);
      } else {
        console.log(`Loading selected mod returned non-200 status. Received: ${this.status}`);
      }
    };
    req.onerror = function (event) {
      console.error(`Error when attempting to retrieve mod code from ${url}`);
      console.log(event);
    };
    req.send();
  };

  window.NepDebug = false;
  if (localStorage.getItem("snakeChosenMod") === "customUrl") {
    console.log("Detect customUrl - enabling debug mode and printing initial code");
    window.NepDebug = true;
  }

  window.catchError = function catchError(culprit_regex, code) {
    try {
      something = code.match(culprit_regex)[0];
    } catch (e) {
      console.log("I caught it!");
      console.log(culprit_regex);
      console.log(code);
      throw e;
    }
    return false;
  };

  window.Libraries = [
    "Core",
    "Theme",
    "ModeRegistry",
    "DistinctVisual",
    "SettingsSaver",
    "Counter",
    "TimeKeeper",
    "SpeedInfo",
    "TopBar",
    "BootstrapMenuSpeedrun",
    "ResetKeySpeedrun",
    "SpeedrunPerf",
  ];
  console.log("Enabling Speedrun Mod");

  libUrlPrefix = window.NepDebug
    ? "http://127.0.0.1:5500/Libraries/"
    : "../../mods/DarkSnakeGang/GoogleSnakePudding/main/Libraries/";
  window.Libraries.forEach((LibName) => {
    console.log("Loading library: " + LibName);
    eval("window." + LibName + ".make();");
  });

  if (window.pudding_settings) {
    window.pudding_settings.randomizeThemeApple = false;
  }
};

////////////////////////////////////////////////////////////////////
//ALTERSNAKECODE
////////////////////////////////////////////////////////////////////

window.SpeedrunMod.alterSnakeCode = function (code) {
  if (window.NepDebug) {
    console.log(code);
  }

  code = code.replaceAll(/\$\$/gm, `doubleD`);
  code = code.replaceAll(/\$\&/gm, `$ &`);

  window.Libraries.forEach((LibName) => {
    console.log("Alter code with library: " + LibName);
    eval("code = window." + LibName + ".alterCode(code);");
  });

  console.log("Done, enjoy Speedrun Mod!");

  if (window.NepDebug) {
    console.log(code);
  }

  return code;
};

////////////////////////////////////////////////////////////////////
//RUNCODEAFTER
////////////////////////////////////////////////////////////////////

window.SpeedrunMod.runCodeAfter = function () {
  let modIndicator = document.createElement("div");
  modIndicator.style =
    "position:absolute;font-family:Roboto,Arial,sans-serif;color:white;font-size:14px;padding-top:4px;padding-left:30px;user-select: none;";
  modIndicator.textContent = "Speedrun Mod v12";
  let canvasNode = document.getElementsByClassName("jNB0Ic")[0];
  document.getElementsByClassName("EjCLSb")[0].insertBefore(modIndicator, canvasNode);

  if (typeof window.applySavedGameSettingsOnce === "function") {
    setTimeout(window.applySavedGameSettingsOnce, 0);
  }

  const prefetchSrc = function () {
    if (typeof window.getAllSrc === "function") {
      window.getAllSrc().catch(function (e) {
        console.error("getAllSrc error:", e);
      });
    }
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(prefetchSrc, { timeout: 2500 });
  } else {
    setTimeout(prefetchSrc, 0);
  }
};
