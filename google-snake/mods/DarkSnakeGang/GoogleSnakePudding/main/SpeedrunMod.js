window.SpeedrunMod = window.SpeedrunMod || {};

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
    window.daily_challenge = false;

    if (daily_button) {
        // Options for the Intersection Observer
        var options = {
            root: null, // Use the viewport as the root
            threshold: 0.5 // Trigger when 50% of the element is visible
        };

        // Callback function to handle intersection changes
        function handleIntersection(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // The element is now visible on classic menu
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

    // Snake recoloring uses getImageData on offscreen canvases; avoid Chrome's readback warning.
    // This causes lag, so we'd rather have the readback warning than the lag.
    /*
    code = code.assertReplaceAll(
        '.getContext("2d")',
        '.getContext("2d",{willReadFrequently:!0})'
    );
    */

    return code;
}
window.Theme = {};

window.Theme.make = function () {

  // Compact matches the board; large-text mode uses a taller fixed panel (no resize sync).
  window.PUDDING_SIDEBAR_HEIGHT_COMPACT = 584;
  window.PUDDING_SIDEBAR_HEIGHT_BIG = 740;
  window.puddingSidebarStyle = 'position:absolute;left:100%;z-index:10000;background-color:#4a752c;padding:10px 8px;display:block;border-radius:3px;width:248px;height:740px;top:0px;overflow-x:hidden;overflow-y:auto;box-sizing:border-box;';
  window.puddingSidebarStyleLeft = 'position:absolute;right:100%;left:auto;z-index:10000;background-color:#4a752c;padding:10px 8px;display:block;border-radius:3px;width:248px;height:584px;top:0px;overflow-x:hidden;overflow-y:auto;box-sizing:border-box;';

  // Big (default) vs compact redesign text + matching fixed height for settings / Speed Info
  window.applyPuddingPanelTextSize = function () {
    const big = !(window.pudding_settings && window.pudding_settings.BigPanelText === false);
    const height = (big ? window.PUDDING_SIDEBAR_HEIGHT_BIG : window.PUDDING_SIDEBAR_HEIGHT_COMPACT) + "px";
    const ids = ["settings-popup-pudding", "speedinfo-popup-pudding"];
    for (let i = 0; i < ids.length; i++) {
      const el = document.getElementById(ids[i]);
      if (!el) continue;
      el.classList.toggle("pudding-text-big", big);
      el.classList.toggle("pudding-text-compact", !big);
      el.style.height = height;
    }
  };

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
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV/TiiIVBTuIdAhYnSyIijhKFYtgobQVWnUwufQLmjQkKS6OgmvBwY/FqoOLs64OroIg+AHi6uKk6CIl/i8ptIjx4Lgf7+497t4BQqPCVDMwAaiaZaTiMTGbWxW7X+FHGAMIYERipp5IL2bgOb7u4ePrXZRneZ/7c/QpeZMBPpF4jumGRbxBPLNp6Zz3iUOsJCnE58TjBl2Q+JHrsstvnIsOCzwzZGRS88QhYrHYwXIHs5KhEk8TRxRVo3wh67LCeYuzWqmx1j35C4N5bSXNdZphxLGEBJIQIaOGMiqwEKVVI8VEivZjHv5hx58kl0yuMhg5FlCFCsnxg//B727NwtSkmxSMAV0vtv0xCnTvAs26bX8f23bzBPA/A1da219tALOfpNfbWuQI6N8GLq7bmrwHXO4AQ0+6ZEiO5KcpFArA+xl9Uw4YvAV619zeWvs4fQAy1NXyDXBwCIwVKXvd4909nb39e6bV3w9oy3KjwrJK+wAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+cDHBAFDhwTaV8AABxzSURBVHja7X17mF1Vledvrb3POffWK6lKilRCQggRyAMSnglkgNax1dbP+RxhIAlPlZcKiISA5FmpBJIQ3shDEGw7qAEUGFrFaWemRxvpHrRnbMdGx1EURG1E5SEkdc85e681f5xzb6oqlaRSlaq6Fc76vvtV1a17zz13r9/+rcdee22gkEIKKaSQOpJ169YzEVExEoUMuxQoqyOZPO0U+reXvqcfX7by/QD+vjy+Jb1t0wZF93Ydrs/kYtjrR84//yMGAJTMeZ547W1rr5OzLr/SDOdnFgCoIwnt67lS5PctLS0rL7qm8/xHb9ro3r/kfFMA4G0gMVcAAM3NjT/2ImpA91981apjv/XwVv+ec88zBQAOcCkdNEEBgA3/RlJHRBQFgX3svJXrxt360FbZ8swzVADgAJZnnvlHAEClu5IAgIikJghmiNKXjybSX/zyJUY0br+CYMC0QkRMRCaPHEwOnjH/yL/XqD1AYDAYxjB5Ma/96S0ce+JJUzzpx4SUUy++IYpmHbnotPiLyy5/+sxzPm1+8qNn9ltUUISBdSib73zgHb966dc/JyaokBCRsjGadvuFn7+9839/6PSrzZOP3+JHCgAEQDs6OuYAOBqAG0vAsdbCGANVRT0m11R7TmamSpzKzFmzpx974km3KDFEFEosNgjYO/lXSf2i371U2fFP//AHefUPXxgyE9gBmgmnqucS0Ypifu5fqYKSNXPHotDiz6+/lgGWCcwAEVi891EUHhXDrf/mYzde9eGlXzJPbPvCkFlgID4AA5DGxsZFRHSaqqZVVhgLD2ZWIlLNplrdPkhVAVUvXm0Y6fTDZpIaIgUBTCAVEifCQXDS/JPe/Z2v3H/5C+89+1Pm+R8/q8PNAD2BYPIbNsXc3f8iBBhjsKN7u4/jOC1HpVB8pl8RJUApZGZQfOe5y687YUJbs3zbWoJzgwbB2yIMrFf731f5fW+7qiASBdgATFypVHw5jOaXKLj8jpWrZM1d9wxJh0UeoA7Bao1hY02gKv35DOScF0t25YXXdk697NKL5YobbuMCAAcWWxFljku/OvPeSRiG7RDt7CDS3/78FSoAcABFBd579c73a7by50wcxz40wQWXXN218PEvbvKLz7nZFAA4wMhgD2FjhgLDAUG6AGDmTKMFAA4QBhBVqKoS9a8eZgYAkySJWMvv/eTy1adsXH+VnHHmYlMA4MCZ/bo7H6HH78o2IK+0GgCOnHuMFgA4AJxAJoPd+YCqChGpMoGJ41hMGL33kuWdp21cv0HPOHOpKQAwhsUJEEURB6VyIF4gYEgPNRFR7gcIAIGyClgJkGWQHbqbyKEAwFgRYxhSDQfNgNRjvHPKht9z2Wc6Zz3++BOypnMDFwAYoyKiEPFQUcgAZjMJkXr4MCg1JEqXQmL93etvFgAYq+K9Q2NTE8IwwEDo3IAAZU6cg0CXnPPpVeMfvGOLgw2pAMCYDAM5cwTNwHw5IYBY2Xnny1GpoxwFpwPA2VctMwUAxmQUIGhqbNrnxStWURGn6uUCAGhtHS8FAMYoA9jA7hLz74EDQKwgMsYnnkITLLh4+coj7l55nazs6uICAGOSAVr2mQEMiNSLCwJbIuH/mLECCgDUfdhHBNadMb6qIooiQBlmgAVbKgQPBRkmEQHYnP6ZDTfzqs61vgDAWJr9xLBhCeVyuZbt21c8xS5VMnzcH15746gyka7qXM8FAOo57FOtVQOpKpgZQVTCvmb0dpoQ9UEYBsaa/5CzSgGA+rb5vRZ3EEURGhoaoSqDLWOrLiL8ewBY0bnaFwCoa68/UzKxIk1jNDS1IChF8D7L9Q/ieuzSFABOuWD5qumNRHrZjZu5AMAYkYaGMgxbgGTQmPIiEgRBCGOPAYCmtjYqAFC3jl/2qErz+PFDuh5njCLMDAM6FQB2/OnV3QLAFioYZRNQdQEom4/NTS1wIlAa3P67fAGJRQSk+s7Oex8wXVd9yhcMUOdOoAohLJcxrrUVygZKBh77HgmwAqwgn6SwxIf/7sXfTkJlhx59+ae4AEAdigHBZJXAKJcaEJTK8DLkLX8EQBjcIs7PBoCFCxdSAYB6ZACmrABECK0T2lAqleBFwJov9Q4yslBVsdbAEh8FAA0vvlgAoJ5NgBDQ1ta+S25gqCGmqp8HAC0uLXyAehWvgAlCjG+bCK+ErBEL5z8HNftrjiAbng8A16/rdAUA6pQBvBdE5QY0jWuByM4dQYNhgupGWCKCcw4Aplx05fLxRRRQp8KcVQCNH9+KKCrDO7/fLp0DaHIUlg8rAFDHIuIxvm0C2O4L5XO/6uvJAKqqBAtV3a2ei0RQHUhQitDe0QEn2QIQqQBgOO8hPtsIkq0NANYaBDYA71IyLr0YJfubxEaBSbYnJwL45wIAdSjOObS0taOttRUuzey/iCCO49yG91Z0kng45xGGIawxIN5TqCiaLTHTpMIE1KmkXtA28SDYqJQBwiu6Kwm8l36dwGrVcKXSjUqlAvGyF0dAAEhQmIB6jADyCqCDpx0CgoGqRxxXoKK7rQfo2TUkdSmICSFCsNljaBgWDFAn0lOp3gsamlrQOqEdaeKQppnNV83axrHyXq+Vpimcd7srHiGnAlU9vABAHcX9VWp3LkXHlMkIyyU4FbhBhoBp6naXMyAA8NCZMFGRCq4nFiAisLWYMu0QKBhQRrUl3L4CSsTD+f7Bo0JQMrx83VpTAKCOWCDxDhMmHIQJbROQpmm2jj/IKiAiRpoke3pJuL07tYMCQN6OBGP5EKseiZER/+zMlve5H2OResHB06YiKJUBMFR7z2ChfnsH9vvdVAXQ/hNDhggkZI0PB8cA1fr00Ri8/a4MHi3C413GtKGpBVOmT4dLM8UT0y4g2B/YF/UgohKAcFAAqFWtEo3iAA5t9vd0vEZa+s7kbJHGY8rUQ9A8rjUr/1IFE4HZDEXV6KeKWMEEkNue6g43qDxAdeCqbdfHGgiqPXVEBMw82B03Q579mtt30iz+nzHzMGiPalAigrUGabpfWUCziWt+c+/mrjeHlAgyxoxJFvDew+cesvd+5AFIvsZCRIRKkqJjylRMmHAQktSD2dYYKgxDpGl3DbgD87uqawRRH1PNIAKIDEjiIhE02nF/zRQxY+7R80DG7mKaiAhBEPQyXQMRay1s/yuJVQRFBQBGzQfJVuZIAecUUw6eio5ph8ClKUw/SovCCNbYAUdeRIxSqbS71yorQIpfFgAYLQAwZcPMDA/F7LnHgEyAqjXqyRBEBDaZQqtMsDcplUt7YozqE9t3yx77QmXFgdaDMAEOIEPoTlJMmjwFkw+eijTx2fYvD/QdUlUPYqBUChGGFnEc5yuDkq8ECtgYBNaCjYFh7uVj9I0EVD1EJB0yAAoZfO5BlMA2wLzjjgfbEJo6SB767e29pVK2VbzaMo5zphhocosNgw1+VgBgFCVNHaYcehgmdUxD4lKwIZCnPP1Le81jMDO4H0UPwEkkFQURv1j4AKMVhioQlRtw7AknAsjyEOKztX4zgJC6Z6QwiGQWu6yW7DdDBkBh//fV+yeADRKnmDXnKLRNPAhOPLhqs+Gh8Ps07gPVQQ4UJSbyzsXlUumlggFGWvkAkiTFuNY2vGPW3DznzyN8HwxV/UOSJK8VABjh5E819Xz8iQtQbmyG9+i1Kti3C/j+BqCqis2yty/csalr++6qRwsADMPgExnEqcPhs4/C1BmHIU6TUcFhllcwPwSA1Z2dpogChifQAwAY0qyYkxipV4ybMAlHH3diXuptAKpV7o8YFlUVrPLsnuZ6wQBDFoExBBVFVtihUAIWnLwIpXLjsNH8AJjIuKSiUWj+FQCee+7HWgBgOOa/Aup8fsCDQXfqcdSxx2HqtOlIkpGn/qywRIWYQEQvBIafB4Anvvo1KQAwLCMu2aCzwfbuCqbPOAzzjjkBifNgHvnQOc8xSGADEPEzN65bveP0M/+TAaRggOFJ9BDAjMQ5tLVPxIJFp0IUcCKQ0cBjvrUscwPd/wSAo+fMLdrEDZsJYEacepggxCnvfBcamlryJg+0l317w2z/vU8BfCd3UKUAwLC5gAQyFqe+6y/RNrEjt/uZ68ejUIZITD4MQxLvn/v1r3/9f8GG1q5bXwBgeAJtRnecYv6xx2P6jJnojlMItDbzR74QVSBelJlhrP321x9+yF+9rsvsPYgtZK9DxIraxg0lwHCAuOIx77iFmD3/BHTHKcjYrMZPaFgzfb1UXqs6lir9c5ImIvDfAADTMUkLAOy3KV/dJGOwI04wZ/4xOG7BSUi9AEMp6d6PeDDWsqr/SVND6RkA2LJsmRQAGBLNS22mAQzDASrdCWbNnY8FJ58K72RUN83knUEhxBCCsDWwZB65ec0KWdnVZfHWm3u8uSIVPEBbX2WAt3Z0Y87R87Dg5EVIXZp5/Dz6S+WsUICNT10FhK8CgIfuNRItGKCfOLrX35qt30MZToDDj5qHo09YCK/Zzlse5ToJg/zMISGJgpDg/Xfv3dz1s09svpFv7Fy3VwAUDNB3tveo0jXG5IpXxE4w77jjccSsuajEHgyBCeygGjoPCwMQkcDDR/gcyiGNm9A6IGQWANiTRyWC1HuwLWHhvzsJ06YfijjJttg58WDQqJOoh0KhYgOmCqU/Qyt9Y/WDt+H6j368ODhy0LOJGWCD1CvKzeNx0qmn9lB+tg3beQ+RuimTU8NMKXDfA1d3uTdSw4hFCwZAjwMZwD1O5sh26oCyffXZunlezGENnCgqscPUQ6Zj/vELUG5oQZwkEOJabb4KINCcBUaTpkiMNZy6+MWJUw/9HOa9j6YcetqAlyHelgxAuqvjR5QdvlhJHLwS5sydjxNOPgU2bEAldZA8Eqh26VIVjMJe0/7CVA0CS0py5y1XfLR75uJzzIq/mKMFAPrE8dmsF1TXRVgBFt65cZMJifNobG7FotP+EnPmHwsRhtesuLKng7jTYZTR/npiA8Pd6faXAfw12ifTtPM/sE+wfBs4gYz+jl+rmm8mRuIERAYzZh6JOfOOQ1RqQnccw9S2bvt8g4aBiO+123e08c3WsElo3ec2b3jt0q0PmfumTSwA0B+995y92aaMALFL4X2K1gmTMHf+8Zg0eQrixCFxKcgwBALqQZJDOMxxv4eqAMQYa5Lu5JdhYLauWn8933DxRftMSW+LMFBVYYyB93mzBmJ0JymCqIxZs9+BmUfOgQnKSB3VbD0gdQvo/DspMSEAf/quTZ3dZy5eYhDHBQB2M1tqVTKJE4AJ0w87HDOPmIXWCRMRpx4Vn+aDy3t0j6rXYzajwgY5k/lSqWTi7h1fv++WDV8/48yl5quPbBuUS3rAO4FCAJiQOEGqjI6p03Hyqe/CCQsWoWXcBOxIPBzGztY3VVUiojR1b4ihq99QpRnzjhq0M1IHDLAbyq1673365XKf1/Vdc6/tlWeFKCFJPcABphwyFTNmHo72SR3wSohFslJuqoaFA5sLVIshBUFgRmR8VH3e4MoBYB+GoY3j7ms+f/OGn0dzZpq71qzyYxgAQ/KBq2XQtdy9V4VLPdQDbC2mz5iOQ6bPRFv7QRAwYq87w7dBTPpqIsgYHlHWEHE59Uc2rqTfue3m9Q/85rU/m7s+csGQshF1AADZrXL7f3WP5wmgvBuWiEOcpgAbNDaPw+SDD8FBHVPQ2joBTgSpV3hNoXnB5uApOOvUYW0wIqOTMQ7BA2KMIef866T24kYiXb7mfn1qiNcf0wygxEidQLxHQ3MT2lvbMH3mTBzUMQVOFGkqiJMsi5ednGFr/RiGksQxhmGtGcm2OUpEYmxoU4dPfv7WVb9Yet5ac/OGS4aci7Sjr8T+Pd3q2TcM0+v5xLnaLCw1lDGxox1Tph6CSZM7UG5shrHZIg6SBC6uQJEVzVWpe7Ced88unlEU1folDncyKI9efDmK7PbYffbBmzq3nXPlBvvlO9a4/XF9u3cKMrUetsP9ZauzidlkCy5KSEXhnQMxIwwCtE4Yj/b2drS1T0TbxIPQ1DwOMBbeKZx4uCQL84LAghsbsb07BikgXrOkDg0WBJIrPxjSuX6DEB+WSzZOkmdu3bL2yldefct8+Z7b99sqRL8AWLL0FvOHl39GJy+ag6ef/qa9/IpLdPny5dRfq9W9DcJeKZIzb9xLvq/eexAxmC2sCdDY0oymcePRNnEiOjomoaV5PIJSBFVF6h1SLxAXA8ownBdoiMKTgi2hXApR6a7ActaPn5ghtepeASkPCJhEjCCwCAI7kmlgb4LAxGnyUxBO/9bffQ9zDm3Xr6d/2m8f3ks751+5vnHrHWv77Sk3rnX8iobGxo0AXE/g7PmAY4bvM1DS52RsZUYYBmgoNyAISmhsbEBTUxOamsah3NiEUkMjTBBlXn4QIAgCOOdqpsNUm1kjs8lCeUNmzY5RYc0OYkp2JDkAKAeAQAkDAgAABEGAcrmcvW9klC9CYBME23ek8bu2bln/g3edf5H5H1sf2K9rkBYAYlGKwjKiSCZdunzjprZxrUFcefNPjQ32d5Pax/1C1f3+vzz1rcP/+Mc/4q3uHSTeI3UO6j1INO+IoXnKNa+j5+wUDBMGueNkEYYBwlKEUqmMhsYGRKUGhOUSGspNiKIIRAZJkilOheBU4L2Hy6twbL4LB2xAefSwc8+91uCsqjAwtTaJ1gCmqQTnFHEco1oryeB+C7pqa/6qCEMLY7KZPzzK75sHEaiqsGG2xlR2dG//8NZbN/7g0i8+ZO77yHn7v5989ZfrNmzkzWtWyoXLVrwzCOzfNpZLzd4nCNhCJa2dcevU51QtWZrN71wfF8kaHgN5Y2Zl2CjoEafbXk5fNlOzDZaqgjQVdO+o9A4De9hsayzKDVGfAeN9nFYC51zeRFpy2869TBoRwRoLYwlRFNWeExmOxaBdACDERMwmieP49AdvveGppcuvs9tu3uyGg2Z6fZsVXTfwps5VcuHy1ZMDY74ZBObYpBJXVDU0zCS0K98bmF18ApGdTKC7mIA+f0NrbVWc96h0JzWHqzoTs/V4gbUGpVJpSADoCT4Rge/r04jCWlOLQkbK4ZPMQRVLhojV+SQ9875bNjy5ct0NduO6VW64PreX9r73nb/XTXfea25a85k/H7tw0ROkODKMynO9qPdELAoCMRQEBYHIwgMQNdkWJRCECGQMvGZ1daqovT57u8maI+bXMTbP5glgmOGdQFR26Y1HBARBWAPWzja4NGgAZKYKYKbawxjKr60gBnrqfTjjfgUJQCAmdWmy+P5brv/PKzo32k1dw6f83Y7eGYuXmMceedh/5BNXBA3NbfcgCC+S1EFEhKi2XjosA0JEqFQqte4a1Y8Lw6BmXsa6VPMc1TyIF/GBDYyqaurSJQ/evP7Rles32o1rV7rhvpfdam/Nuk7esGGjwqd68XVdlxnwbaQIvHeOiGw1AtjfdfHVGe9Fsvg/63QFawwOJOnRyMFFUWRT719OxV344Jaup85ffp3dOkw2f8AAyPjR0nvPPpe//aUv+guvXXNqQLzVBMGhSZJ4EmWqTX/erUe7s8Aif4X2/rmnyuo6KbsaThC40AbWe/9iJU0+9OCtG370oZVr7ZMb17uRuoc9TysVPP9//kXPvXq5/ZubN78w/4SFDxPzVBsE84iINEsRcmYzqQeedtpR7bvVqs/PvqngXbZmDaJVar3Tv+YSBaFBmvz3yo43P/DgnZufv/KGm+zfdK12IwrCgb7w9LMWm8cffcQDwKXXrL2EjbmZLTXHcepVlQNjSIXy1LFibyVVA2GAsSC1LiB9U8x5GKucpdJ37uFnzwoTBAF8XLm9rTG6+ob1q+X0s5aaxx/dNuKF5gM2rD997jlNVOnZ518yj37u9n+et/Dkb5D6WVG5dBgE5EW8IcMiPj+siAaEPB3jAKjdft/NBtX/UJakEqiqQqIoMip42cVy/n23dt3+9He/i7Vr1/Dn7rlbRvX+90Uu/8Jfm7s+9tGMDa5dfRWZYIUxQXscx2oZoqJm10THgckAu89H7EwwqaonIlMqlRDH8VMu1k88cMe6X59xxuXm8Se+ICo7dNQBvK+y/PoNfMOq1RoR6Uc/s2ZGCN5IwBJrLJIkES8Cawy/vQEAUSWKoojS1L+aqnQ9eFPnnQBw1nkrzKMPbfJ1w2CDlaXXXmu3bdnict/gncS02oald3vn4byTPFfAPRU/wsupIxLOVWsFs6SWiippGIYm9Q4AvgTwmvtuXPPClu99n374/R/QtmWX1UXd+X6Zf5/cvIlf+NFP6KltD3kAOP/am86MKFkZhXyMdx6pSwVZVYvhEcqsjSQAqruHVFWYGUEQMLNFkla+r07W3HfLhm8DwAcv+ZT5xv13+rq6//15sfcv/bj5wMdWyhXvOUT/6oJrwukdLR9mpquJ6UQA8M7BZ6WthhV0IIR1QpKHPEzWWGbDcGn6v4hxx44/v/Hw1rtvTU8/a6k5cvZs3dS1tu52mwyLBk67+DbzD5+/ygPAKX91gT3q6FnvB7nLPPz7wjCES1OozwoDcvMwFpEgyNbsbRAEWat4pX9SR7e/8JuXHvu7h+/1APDhJWebJx7+iq9bBhu+Sx9Oi5dcyI88fF3ty3/82q5FSjgXwIeC0E5R1ayUyztnsnJNrq44MmV1/bWYmqRPFrEaZ1Mvp3Jnalp6JY+ql6odv6a7ieer5slk/f898gMdswUqqW7MMCZkaw2c84mqPK2Ez953Y+eT1fcvu//L5tZlH5e9dek6gAFQlSNo8dmLeeYR7bpx3acEAM5cub6tyfASSpMPGuF3l4IwrNYbCMR7EQWEDVsS7Z0pqLZFq3retV2+vaKK3e8G7qvwqg1nzcBhmCF5mRoAFWJRVTVQJiYObACnAvH+V8T8Nfby0D1bun5cc4rPW2u2fekhgf5qTHi4I0q9V2zewq9Om0ZfPmdpjRUuvLZzTkj2PfD+fUI42UbheCKCE4H3LjcVUss150yRhRXKtbUGVtkjAPoJRPs+keWuIepUlIjYsGVmAzYMEkWapi+A9R+F8DWKgv96f9fqtwDAqdLis87mx766zWOMyajY3tXPfp9++OTfmunN4+SeFdfUtHXJstWTU4O/AJlTDNHJpDIrDMOGnu91cVJVlgCsO0NJySxHb8+yx/9BAGTnvzMOyP9vmJmIGBxk/xcP+DSuENG/EJn/Rj541nt89/7bV75ZveD6u+82lT/+UTd2dgrGqIy683XZxs38xquv88EtzXLj2lW9BvLylRsOc969U4VmeujJRDRRnJ8RBmETB6ZW9Fmt1fMiyFLRvHPbGNCrL4DNz+2THv2CnHNwzr1BRL9n5RcAPCvingmt+fndN3b1Onn7gx++1jQ0Ex790l0C2T7mExl15X13q9Lme+/h1994k+5YcV2/q2IXXbNmRsS2PU3TBUFgpolzJTA1pDCNUF5gSMcTUeCdWhh+ESQMSAlAmURfJEUKkheQnaj9WwAvW2N/qir/L3butQdv3RT3/cw1a2+0z//8df3KtkcFeP6AWp+u6/BrRdcNHB7UTi9t30GHnnKKX3vSCXsc/AuXb4oCKw1x9/aw1NBiX3nl5ZcPnjFFk0p3GBgKP9u19s8D8VNeeeUV7v63l3X+EYfrhq6xS+9jHgC7yOTJdNkVV9IrP/whzZk1m5gIHh6OI5RaD9W1V56zVycsUaVzlizl2UceQdX2Mc8995zOnjVX12/eqEgTxdtI/j89hgEgDURRsgAAAABJRU5ErkJggg==',
    'data:image/png;base64,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',
    'data:image/png;base64,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',
    'data:image/png;base64,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',
    'data:image/png;base64,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',
    'data:image/png;base64,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',
    'data:image/png;base64,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',
    'data:image/png;base64,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',
    'data:image/png;base64,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',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAIABJREFUeNrtnWV8Xdext0/AKGZmZkZLsshiZsmWQbLIJMuSxcwyQzhpqA0zNpyGU4fTUNskThpumxRubvP2w+28M2utTecc2bLjpOn93Q9T2ZYsp5pn/jOz9l4zuvHxcd3/Fhsb4zY9OaY7ND+qO75vVHcM7fj+Ud2RhVHdgbkx3fzMmG4KPz8+PoZfy218jP5sHD83jl8zrju6f0J3/ADZpO74wUnd4X2TupmpcfH1/3t+XmT/8Q6fQEfOTY/qFmZGdfP4cXJiTNc3NG61rWcicv2OqYqS5umejPVTRxNqpm8NL516IqBo8hXfgol3vHLG3/fMGT3puW4Ebeh973WD7/jnDr4SWtD/RFxp/61rawaOFjX29zS0DVZ0dA1H9g2OWk1OjOsWZid0++YmEZYJ3cQEh+L/APiRI3xmclS3b2ZENzc1qhseGV/V3j2VUNY215lUv/9G/9KDbznnHf7WKvMgmKbvBxM009QFtDkwS5sD85RpsEidBEs0i5RxtFGwWDMCZkmDYBI/AKvj+mFVTA+sjOmGldFdsCqqE0xjOsEmYee3Xmt3vRVX3HVjcePeztZdAwlDw6OrCAQCYmZ6QlGU/wPgHDp9XO30YZT3Ud3u/infyo5922Lrj9zrXnTRV9brLgaz7IvAPPs4WGUfA/ucI+CQexjs1x0Cu3X7uGUtgH3mHH6cBdv0abDNmMSPk2CTNg62aaP4cQRsUgbBes0A2KzpB5ukvWCdvBesEveAdcJusIrvBJPI7bAivAOWhbbBqvAWsI9v+yo8d8e9pY17tnX2DPlOT03o9s9PqWD4PwC+t7wvTA/rZqdGdF3o9JK2g30h1ZecsCu4EsxzrgLL3CvALv8ycMi/BBzyLsaPx9GO4a+PgoMEQc7pIJjQQGCdMoCORwiS+8AaIbBK7gGrhC4ZAsvY7Wjb0DrALKoFloU0w7KgzWAatgl80lpO5NV29nX2DPrOzUyiMkz95NPET9LxUxMY7dNDutHR8RXrd+2vi1p/+aP2xdf9yzzverDOvxqciq4ER8kKL0dDCAouFSBcJEPAleCIcQgyVRCsnUAbQwhQBdKGmQowJUju5RAkdTMAGARxO8FKgiCmHSwQAovorWAZuQVWhWyEC/zXg0nw+n8FpTc9WtPUVTc6OrZi//y0jtThpwjCT8rx08LxfUOTTgXtx8a8qq77xLLwJrAu+gU4lV0HTqVoJdeBYzFBcJUKgitOD4EqHdhnzqPNCgimGAQ2EgSpCEHqkPFUEC+pwA4EYRtYxHQgBK0MAsuoZrCM2AIWkZvBPKwRlvnXwQV+1WAX1fBJdkX7WG//kBOBMDM1+ZMC4ScT8Qvo+J7BKY+srZcec6646VuL4lvBvvxGcKpA55cTAGTXyyA4Fl+L9jNwKpZAWAoEB7UQYCqwy5jhEOjVA9ZUDyyWCuJ2aVTAMpogIBVoYgBYRGwCs9ANCEI9rA6qhfM8y8AssPLbNYVbj3X3DnoQCFOTPw1F+Pfn+KkhXf/wpN26tssPOlfd9p1V2R3gVHkLuFTeDM4VZDei/YKDwCD4uaEaLAECuSaQIMjep9QDGUo9YDQVJPFUYK1KBVwFtp9CBTairWcQmIXUgklAJZzvUQIm/mXfpRY1H+wfGLYjEP7dNcK/zflzk8MIwOh5ZTsu6narve0by/J7wLH6DnCuvh1cqm9DuxUhuEVAwEEwUAOjKcE4BPa5RzkAaHbZ+5V6IGvOMBWgCvBUMAhWa7gK2EgqkIgqgGlAowKxQgWijauAWWgdmAVVo1UhAOWgcysAi4CSb/KrWrsnJ8bPm5+b/rdB8KM7fpLkfmpQ17r3QGZQ4y1vWFbcB041d4FrzR3gQiYgMA7CTWg3yBA4l4qUoA+BqiZwJAhEd2CfqxSF9tnqVDCHzsdUkDHFVUBOBYYFoawC8adSAQQgchOrBczDGhgEpsE1YBpUCWYBFZgOymCVbzHoXHLAJbLsjS1tXZn75mf+LWnhR456rOzHxk0yWq+5zKbqQbCrfgBc6+4Fl9p70O5Gu4tDYAyEKoRATgunguBKrRLkIwSsRaRUoD4jUKWCLG1XwAtCrgLWxlSA1QKdhrVAVKvcETAVCN+oqEBIHVMArAXANLAcU0IpmPkXwzL3XDjPJQvi162/bGR01GThR1aDHzHXY9T3HszwXX/Ph9bVj6Dj7xd2Hzqe7F5h92hA4BCI1FClVoMb5bqAIHAWEDixwvBKcGAQXC6nAkf9VJCDhqnA9kxUQHQE1qqOwEqoAJ0LUBowV9cCESoVoDTAVIAgqADTgDIw9S8BU99CWO2dDzqnDLANzv+wqW13xv6FmR+tNvgRWrsR3czEkK5w+1UTdrWPgGPdw+DW8CC4ktULq3tABYMxEFQQVC8OAesOSq5FFfgZqsFV4KBJBaqDIk1XsKCnAlPYGYizAaoFxAmhVbKkAj2YBpSOwJLOBeSWsA3TQCsCsFUuBi3kYrAOTLEYJBUwD6BUUI4AlIKpXxGY+BQgBHmoBplwnnMaZBRvnJidmdJNT//wLeMPeoQ7PT6oGxgat45tvu0h65on0PEPg3vDQ/gRrf6X3Axg0AeBUsOpIFClA6k7KL7GoCh0FCrgSACcQgVYW0hpQOoIUkcxDWjPBayYCnSBDaWBeP1isEVTDJpTGghTp4FqbRrwK0YV4ACY+OTAaq8s0NmtAb+4kocGh4at52Z/2JTwwzl/rE/XP3EoIqzl0ZOWlY+hk9H56x9h5kbGYBBAMBgECAwGrggSBK51pAZ3aiHAdMBqAjQnAYFz6c8ZBI4sFVzNU0EhTwWOoiB0zDsO9rIKYEew7gBTAXvWEYjDIUoDGdo0YJOiKgaTRTEYv5t3BN8zDZhQGvDJRwByEYRsWOWZiRAkgY1/9smdu/dGLGCB+ENBcO6/Kcn+aK+ua/zyouKZ331XOP0BpPS8At6bn0D5fwhcGhCCDY8iBI9yEAQMzNQg1HMQXIQaGIdAKgxv0ksFaCwVKCrgIKlAvjgbYCqg6gikNEAQYDH4/dOA0g1YqM4EWBpABTCnbgABMCEAfAphFdYBq7xyUQ1ywNI/F+yD88AmcB3YB2Z/t7llZ9G++dn/AACQUnL+jsmfNxfNfQwlcx9C+dzvoXr/h1CGH9f0vgreW34FjvWPgAsBsOExNBUMKhC0aqBA4CpBwDoF3h24VJAK8HrAueznqoKQHxLxWkCoAHYEjlQL5JEKHGZmPA1M8TSQZjwNWGM3IKcB/TMBI90AAUDnAabBtbAaawAT/wpMAWUMAqugUrALLQWniDJwiyoDdzTXiGJwCc8Hh6B1YOWTBjWNrc37FmZFbTX2EwRAOL9j6pY9hfOfQun8B1A+/76wD5hVHziJILyPILwGPk1PgVPDo+BCADQ+poLgEUUNFlMC5nylRXSmeqDyJn5iWK5SgeJrVaeEl8vnAjwNHJWLQTvREkppwFZKA+mkAuPKySCqAAMA04CV1A0kSGlgu0gDvA4wx0LQHFOAWfgmMMUUYBrCFcAqvAHsIuvBKaYB3OI3gGfCBvBOagCvhFrwjKsC9+hycIskAEoYAE6huWDtlwHLnBKhoGLTnnMNwTlz/hQ6v33q9t6i+S/Q2SehQraPoGLhI/6Rfr9wEmoOfMyASO17A/y2PgPO6HxnpghcDdwbBAj1DxmHgApDahFrlFRgTAVYLVDEnxc4SMUggwDTQMFp0kAGpQFSAHUaUB0NJ/OnhJZYB1igAphHbwNzTAHm0e2YClrBCs0+vg2cElvBbU07eKW2g+/aVvBPQ1u7FfxTm8A3ZTN4JTWCVyIHwCO2CtwQAOfwUrAPKQTrgFyw8MkGc+8MMPFIhfNsYyCvrLFXguAnAcAYi/y9um1Tt3UVL/wRyhc+5rbvY6hg9gfZ6M+kz1ciFDUH8M8XPoSMwd9AcPtz4IopwbH+YV4nrDcGwf1CBe5lqYCdEYhUwFRAOilkHcH1SkfAisErEIZTpIF1Ig1kiTSgelRsgwBYpwyDZXI/WCT2g2UiPR3sYWnALrkbnFJ7wC2tBzwze8B33V4IzOmB4NweCMnbCyE5XRC8bjcEZe+EgIwOdD5BsBX8UraAz5rN4JnYCG5xDeAcXQ12YeVgFVwClgGFYBGQDxZ+OQwAC99MMPdaC6buaxCCaFSCjV37EYJzoQLfv9pH5++curGpeB86nxy9n1sl2YFPtLZf+bwEQwVazf6PoWrfScgdfxdiOk+A1+YnwQkLRqdarAXqqS6gmuAB0SbexwGQUoGBCtwAjuU3iI5AFIOqNKC0hKIbyJVOBg+AbfYC5v05sE6fAau1U2CF0W+NANhhGnDKnAC3dRPglTsB/oVTEFwyBeFlMxBZNgVRaJGl4xBRMgLhRUMQVtDPnZ+7F4IRgKDsTgjM2gn+6R3gk9ICHklN4BK/ERyi12M6qAPrsBp0fCVYBpehlYBVYBFaASsGzUkBfLPAzDsdzFAFTNySQGcbBeW1TU37F+a+NwTfy/kk+12TVxWU7P8KnfqpxulVBz8V9pkw/PWBTw1gkEHAFEEQSAVj+uAbELHtefDe9BhKP8JQcz841twHzrVqFbhLowIuQgVYHSDOBTRpAFXAPv9SsMu9GGxzjoENRr5N9mGM/EOsDnDM2w9u+QfBu/gQBJQdgZDKoxBZexxi6o9BHFpC/RGIrz8IcbUHILZmHqIr5yCilJw/ic4fh/DiYQgrGoRQBIAUwD+7G7wzOsE9dTu4JHeAQ3wL2EVvAbuYjWATtQGsIxrANqIObMJrwSa0CqxCUQFCSmUALDAFmPuuQwXIwjSAAHimIgTJsNo1Ac63jYTGLR0F+76nEpy18ydH+3V9E0dCy/d/9s+KA5+jcz9RHH7oc6iW7Qth/PcSEJUSDCoQCIJy6hywcKxCECoX3oeS6Xche+h1SNj9AoS2Pgk+myg1PIBOp6eHd4FD5W3gUHErOJTfgnYTOJTeAPZYANoVXwf2RdeiXQP2hT9jCkCpwLXkSvAouxJ8K6+CoNqfQXjDNRCz8VpI2HwtJDddA2ua0Zp+Bimbr4LkTZdD0sbLIH79RRBbdwztMDr+AMTU7Eebh5iqOYgqn0HnT0BI4Sj45Q6AV1YvuK7tBueUXeCYvBPsE7aDXUI7fmwD+7gWsI9tAofYTWAb1Qi2kVwBbCNqwCasGqwZAJICFGIqyEPnY1voi2kA6wBzzzQwwzRAEKx0ioWVjlH/3L6rK3R+7uzPCc7K+RNjQ7qRsSmLmv3vf1J+8CvheD2HH/4SavSs+rACQ5WAgUAgePQhKEMISlEJSmd+CxVz7zErn30HSibfhPyRVyGz/wSkdj8HibuehNhtj0J028MQ1fogRLbcj3YfRLXcCzFo8a33QGL7vbCm425I234PpO+4GzJ23AmZO+6AzG13QEbHbZDecROktfwCnX8tJG25BpI2XYV2JSRuuAwSGi+FhA0XQXzDMbQjEIvRH1m5D0JKZ1gq8MoZBdeMYXBJ7wentL3gmNINDild4LQGAVizExyTdoBDQgc4JiIEca0cgJjNqAQbEYL1rCOwJQVAAGxCK8CSFCComCmAFdYBln4EQBbWAgTAWnQ+B8DULQGW2UeAtVf8J4NDwxbT01NnBcFZVPyjGP0DusaFlx4rO/Q1VMsRr3L6ka9kqz3yR83vyejrZBAQnMqDHIJKDQQfIAQIwOzvUAXeQ3sHiiffZgCUTL7BrJQ+jr8KJaMvQfHIr6Fo+AUoHHoWCgafhvyBpyCv71eQu/cxyOl+BLJ3/xKydt0H6TvvgbXb7oS1HbfD2rbbIK3tFkhtuwFSEYDkJgLgakje8jNYs/lKjP7LIX7DpRCF0R9acQj8i/eBV/4MuOVMgWvWOLhkjaGh8zOGEIIBhKAXnLEgdE7dA04pnQgBOh9VQAKApYDYZsz9m8E+BhUgilpCkQawDiAArELKWCFICmAVmIcA5HIFEIWgDIBrIloc6KyCwT8q67HZGf5yyQ8KgFT0tc/eP1F66C/M+bLjZQf/kdvRP0Ht0T/LRr+XP6cHghoCRQlOalSgdAYBmHobIXgL7Q0omngditD5BaMvQ8Hwr6Fg4AV0+nOQ1/805Pb+CnJ6n4R1e5+A7O5HIWv3Q5DZ+SBkIgAZBMD2OyENo39t+22Q2koA3AhrW38BqVuvY2kgrvFKiKi9DAIqjoF3yWHwKNgP7nkL6PhZcM+d5raOisJxcMseBtdMtIxBBAEBSCMAulEJOjEN7BRpoJ0B4JiAChCDChC9CT9SHbAe0wACgGnAJpQrgDUBECSlAa4AFqwOQAC8EQD3FKEAHAATl2jQmQVAZl7lxP59Z14UnlnRN9an6564LKX8EDr1yJdQd4Qc/6XK8ehkcvixr9G+4Xb8G+XX+Of0efZ1EgiLQEDdgZQKylAFSoUKFBEAE2+iIQRjr0Hh6CsIwAmMegFA3zOQ2ycA6EEA9jwK2V0PQ+ZuAuB+lP57MQ3ciYbyv+02hOBWWNNyI8Ruug5C6q4Ev8pLwavkInAvOg7uhYfBs+ggeBYeAM+CfeCROw8eeTMIANq6SXDPJgBGtACs3csAcBIAOBEAiR0CgDbM/80sBdjHUB2wgQFgEykpQCUCgCkguFjbCUiFoBd1AgRAEraEBEA8mLhGwyrHSDjPwh+2tGxLmZ87s6JwyV84MT6iGxkdX5XY++anMf0fQcb4R1C8gNJ/+CuoP/ZnaLjoG6hTObvu+F+0duwvKhC+ESD80VAJDnyqSQWSCpSgCrA0MEVp4DcIwOtQOP46KgCqwPBLUDD0AuQNPo8K8Czk9j8FORT9TAEeg6w9jyAAv4TszvvR7sUa4C5Yg/IfvfkmCK7/OfhW/ww8y6/A4vAy8C67BKP+YgaBV/FRtEMKAHl6AGQRAKOLALCbA5CEKSBxmwJA3FYEYAsDwA4BsGEA1MqdgDW2grwQLBQA5DEFMGedwFowFZ2AiTtXAFPXGDBxjoILrYPA2j3q05GR0VVTk5PnFgCK/tnxXl1J/y+vCOr+A0T1/BYien6PHz+AuIGTkDb+KRQsYDF45Guov+ivsP6Sv0PDxX+HuovU9jdUg7+i8xUQakgRDCD4zKgKUC1QOvOugOAtVAJUgHFUAFSB/BEC4EXIRxXIHXgWcjANrEMFIBXI2fs4qwEyOn8JyR33QFTT7RC0/ibwrf05eFVdD96V14JP1VXgU3kleFVcDj7ll4J3qRoAVIECAmA/eOQLAHLUCnAaAJJ3YCGoBcCeAIgmAFQpQAIgRLSCAUIBWCeQzRTAzIcUgDoBSgFJTAFMUQEIgNWO4aAz9YLY1LwrzuR8YEnOnxnv120fviQlpPsjiN77O4jpfR9i+j6E6L6TzCJ7yT6C2MFPIGX8C8ib/zNUHvkbNFzyLTRe9t+wAa3h4v9iINQagPC1XChyCHgq0FeBstnfszRQPP02FE1RHfAmUwFWB4y8DPkIAKWBgsHnMBVgHdD/K8jsfhySdzwEkVvvhaBNd4Bv/a3gU3cz+NbdAP51vwC/Gor+65gCEADeEgBlegAU6gGQewYAsE5AC4CdDABPAewwiAFQKVpBOgso5jUAAeCzjhWC5tgJsLMAagUJApcErgBOkQhAGKyyD0YIPGFLc/uSU8ESKBnFtm/kvDV7X34vrOckOv/3aB+g4z+EmH78PaaDmIE/MOfHDn4G0QOfQdTA5xAz9CUkj/8Rsue+htLD6PSLvoX1lyIMaOsv+S9Uir9xCChtHOVKYKgCH7PnCPTcQJMGsA4oEXVACUJQjBAUjZyAvIHnIaPnaUjc+ThEtPwSgrbcB/6N94DfhrsgoPF2CFh/G/g33AL+9Tf++wGIUQNQryiABIBoBS3UZwHUCnopZwGmrgRArKwAqx1C4HwLH3D0in5vcmLivImJie8HAEX/HEr/+sGbu0j6Y3p/t4jzP4W4oc8gdvhL2eLQCILoQbShLyB+5EtInfwT5Mx/AyWH/gpVR0kJ/oYg/AXrB7TjmD6O/RHqjmLrePgLqDmEHcbBT6AKlaBq4SRU7PsAKhCC8rn3oGzmHVYHFIy9DlmDL0NK9wsQs+MpCGt7DIKaH4aALb+EgE0PQOBmivx7IXDj3Wh3IAC3/hsA2GU8BcQiANGNpwGADoNy2TMBDQCqswAGAHYCJg4RDIBV9kGgW+EKeUVVXfv3zZ9WBU75ycnxYd3g6IxlTM87f4/ci7JP1ovSLzv/Yxb5aueT4+NGvoL40T9C3OifmMXTx5E/MiCiBr9gFodQJI18Dqnjn0Pm1OeQM/sFFMx9DkULn2Fx+SkUz/8Biuc+hsKZk5A/+T7kjL0HmcNvQ2r/G5DY/TJEd/4awrY9DyHtz0Bwy5MQtPUJ/PgohLY8AsHND0FQ0wOoAAjAZjUAS1SAxWqAvB8agGojAOTpAbDWOABMAUIZAMstfcDE1u/vff0DllNTk2cHAHuNG6O/ov/ew+roj5GjH50/oO/8r7jTx8jxf0bHKybBQCCwr0cYYgY/h6j+P7D6IRLBitz7ARBoUT2/g8ju9yBiz7tob0PE7jchbOdrELrzFQjdfgLtBQjdhtbxPELwLIS1PwWhrU9ASOtjCMCjCADKf9ODLAWcFQDnsgswkgKMAWC7CABW4qmgcQDieQ1AADhFcADsgmCVrT+qgBMkp+cfPp0KnCL6h3R9owtOkd2//WckOoRFf98HzPmxKumPxUiOFVHPncwdnjD2Ndo3ssWPfs0+p4GA/h4CRN8rZuAjDhb9G3t/j8XmbxkEUd3vQFTXWxDZ+QZEdL4GETtfRvs1hO94EZ3/Ageg7Wn2nCCk9VEBACkA1QD3nxEAhl3AETTpHGDhDM8BTtMFLFEBTg2ASgGoEFQBsMLKG5Zbef1zT/deJzomPiMApOgv77v/oqA9HyuVP8l/n1r6P2eRzGRflnvJ8X+BhHGyv/KP9Gf4OVkNEJhYUgwCCEEiRWHfG/8N+rei8N+kdjOq+12I2oMA7CYAXoeIXa8gACdUADyHCoAAtPxKpQBnB4A2BRwHT5R/rQLMCQD4SaC7sZNAg3OAHWdQBJ4pAImGANgTAAGwysYXVcARElJzL9q/b2FRFVg09/ePztrgD/87iv5oqvwpMvtOCvkXhd/wF9yJGNEk+7Lz0eHx6Pj4ib/hx7+Jj3/lUIypIBCpQFYBUhZKMVRoYsqJ7hYAdOsDIBSgQyhABykAAfA4A4AKQeMAaItAXwmAKgFA+WUaADyYAnAAPBgAs+DOAJjizl9nRAHSTn8QpH8OcKoi8PQAxGkBcFAAWGbpCSutvL7b29tnMz01tTQAWPRP9Opq+u8YC+yi6H+Pt34i98eiVMeis+IGP5OLPiry4sf+LDs/jpxPDp8g+xtTgXjpzwgCSgcITCxTgS+ZksRgPRGrTgP4b0YzBXiPARDR9SYHoPNVoQC8DmAKoAdA8KIAqBSg9ufgU3M9B6CSHwR5l6HzGQAo/yXHUAFUAORzBXBXKYCrAMAlY5g/DDLyLMDgKFjvJFA6B7DRPweQAcg7awBWWnuDbrkDZOSUjC2mAkaOfEfp/t6yhJ43vozofp/JsHTwQxEaqy//VPGPiZwvRf64cPzk3yERjT4mCBXgEHzD/k4cdQpUOwyLNIDfm6vAB+zfJPi4AryNCvAbCKcaoJMU4CUI344KsP0F1gkwANoUAEKWAgA5v4bk/1pUgKtkBfBiABwXKUAFQB4HwE0FACmAaxYCkE4A9Iungd3iaeAuNP4wSHoayAFoPgUAhucAhm3gaWoANQBYB1xo5g6WToFfjo6OLjN2LmDwB/OT/boN3ZdWuzS9DpF73hEHP+gM6gDk1o/k/3NW9ceiE+MxmimqeaT/jTmbHJ849V/o/P8SH//OUkEcpYRxKRX8SQaApQGsA2L6pDTwPisEo/ZIhaBaARCAHZgGZACeWhIA/noKwAG4BgG4UgaAPQtgCsBrAE8CoEABgClAjgoAJv9CAdaSAtA7gl0Y/Z28AyAAEpWngQ7ifQA1ALbqZwEh6pPAgtO0geouAAGw1wKwwpoVgqBb5gCVtY3V+xbmTw0Ayf/sxKAuru2+J+0bXwSPpucheOebECvyPzv6lQH4Qq78JfmX8j6LeOH4xKlvEQYOAoNgXNQDo9/wdpG+BykJpRRWB9Bp40nWdURj/RHF6oC3EYTfqDqBE9gWqgF4+gwBuEEAcL2BAlD+VwPgQQDk7wf3/AWlBlinAOCSNSQAEAqAKcARFYC9ESS9DyCngBZ0PCkAfxxsKz8MqtN7GFSKjuePg/lJ4DotAO6LK8BKLAJX2Pgxx1MNcL65OysGPYPjn5ybNTwe1vxmGou/PUPz7q4bn/0fjy3PMQDctzwPfu2vYlX+PjrpYy7T1P+rWr94If9xQvoTpyQA/huSpr+DxOl/yABQXRAvugIChxSEnR9QSsHUwtpBKjb3fsC6D94JvMMB2CUA2IEKoAHgGQ0ARmuAxjvA71QAVFyB8q9WgGM8+qkNpAJQOgVkCjAlABjDFEDOJwj6ZACcGAA8/7M3ghKlF0JaVS+E6L0PECZqAPlpoPph0DqjR8Em9DjYJQZWofNX2ofBctsgWG7tDxdaesMyK0+40MIDLhB2nqnb/+zavcd9ZnraOAB07LswOaAr331Nr+2GX4PHlmfBo/l58Gx+EdybXgTPrS9BaNdvEQKl/9cHIF4GgEc+c/7M/4MktASEIYFSAaWBMWoNv2F/L06VBmIH/yDqgJO8E6CzAHUrqH8WsAgAShdwnwYArgA3IwC/UAFwjQDgcm0KKD7KU0CRdAysUoAcOgMgAEYFAINMAZzT96oAoHcCd6Hzt2sAsJffB5BeCZMAkN4HKOPvAwTQKSAqgH8umHnTW8GZYOqZBiZuybDKNRFWOcfBSqcYWG4fASvsyPnBsMw6EB3vh+YDyy3R8agA5PwL8aPuQjvIyi/v1S8GtcOaUAEiW+5/1Wnj8+Cx+RmmAASA51b5VYC/AAAgAElEQVQEovkEeGx9GQJ2vMUUgM722WEOqwGUFMDzvyEApAJyLUB1gkEdICnAx3InQK2g4VkAArBrqQBIzwLugsANEgA36SnA1RyA8itkAPgh0DGUf3oOcNAIAKgAWVwBXDKHZAXQB4COgQkAe3ofkEX/VrDB9s8mqpG9EWwZWguWITVgEVwJ5oHlYO5fDKZ+dFGU3xQ2oYuiHhmw0n0trHJPhZWuybDSOQFWOMfDCnop1CEaViAALPptgtECmQIss0QASAEIAHMBwEoncPKJenVG791BRf4nhnVdg/Oero1P/ctj89PgsQkB2CIBwBXAq+UV8EDzbkdH9H4szvv5mT/ldE31TypATpcB+G9NMcgOiPQKQaUTIADeZ+cP0WcBAE8B4ih4IwFwJ1eABkkBbtAqQCVPAd7iQZBnMQJQJCnAQeVBUO4M7wIQAI9skQIy6YXQQXYA5JCyB+ySOsE2YTtYx7az20HskmgU3RKmaSH8fiANjTINqgZTuiYeUCHmBCi3hOmSKN0SNvHKgtWeGQhBOqz2SINVbmtglUsiQhCPFgMrHKNghQMBEArLbEIQgAAEQCiABIBQAJEG/rWzs8uT3h80AGAe5b9q9+Uddg2Y+wmAzc+CZ9NzsgJ4bj2BALwMXq2vor0Gnm2vQ9DuD9ghUML41/wQiKUBfvCTIKeBfzBLwF8nnFIBvtQD4IPvCcADHABJAQiAeuMA+AgAfMovMXgS6KECwDOf1wCu2eMY7cNgn9YPtsnd7JKoZexOdjmUbghbsBvCLWx0nAVdEY+iC6Kb5EER5hj5ZsHV8jVxdkmUAMDo58MicvFjNjqfLB0VAAFABVAAiGOvhS93RAVwCBf5P0QogC+mAm8OgIUCAFOBZfZQUFrTcUDVDSiPfScHdSkdd95nXfs0uG96igFAhaBn8wsCghNoLzMV8EYAvFAFPFvfBL8d77Gne4nj4hBoTFEBdSfAisCpv8s1gLFWkACIPmcAPKgHwO0qBfgF+KlSgE/FlawG4I+CL8LIP84A8C45whSADoFcsPJ3yBjlQyTZwKgedjfQSoyQtYqTZgRsY1fEaU6AZXSzuCEsXRFXTQ0LJueTlbM5AWZC/k2881EFUP591qESCAVwQwDcUjD3YwpwSeAK4BiLCqAGQKQArAEutPbiAJhrFYDaQf/w5PsWVC+LyK96j45Priif/s3X0Z0vg/OGJ8B141O8ENTUAZgGWl8Br7bXWBrw7vgN/vot8Ox4G0J6/oAQ/AUSWa//18XPAsa1XUCcpgY4lwpgDIBbOQB1P2evhPlWX8+eA3hXYvRXiAKw7GLWCnoWHQFXdLxD5jS7Im6TOgxWKf1iRkAv2l4GgXV8lzJCVgKADY4kAPgVcTYnILxRNSNAGhilDIowY/OCCtDxeWxQBAGw2isTpT8dAViLAKACuCTBCpd4DoCTlALCRBEYxFOApR9TAOoCKP9TG8gh8EAoPMDGNejroaHhFRNqBZgaHdD1jB+LLZ77kF3Nyhp+G7ybngXn9QgBpYEmJQ14ogJ4YhrwxhTg3fEm2tvMPNreBv9d72Nh+CfmeH4m8FfVaSDv/+NUp4Fx0mngsKQAn5y7GmCLPgCiBSQAaoUCVF0PPlUIAMk/QYBFoAcWf865B9iMAJoPYJM6zi6HykMi1gzyIRHsejiNjDMCACqAeaSYFUQAyDMC+Mg4s+Ba5nxzrAE0CuBDKSCfF4AMAFQALABXu6eh6SmAU7QAIBydL3UBVAD68hYQHU4pYIW1J6y29QYzex+wcPSFFZbu0NK2PXZublYBgMa5dEzc2Fkwc5K9fMnv530I4TtQDRqfYmcBSi1gqAIMgm3vgGf7O+C9/T0I6/1MTgNyYaj/PIDkn84BRP6XzgGiVc8D2AOhcwaAWgHEgyAEwK+G1wAeJReDY95BsMsU08LUg6TTxPTQNYN6Y2L2qABQjYmhGiCyBR3frACgmRxagwpAlT+fGWiqnhUkAYBFoKQAqz0IgjXo/CTRAcSx/L/MIRKWseinIpArwEobP3S4L5ja+TKnmzv4aux8U2coLKvulE4FhQL06zZPPXITvX3DLmHM/R4q6R7/wU8gbfAdBOA5cN30nNwOalQAIfDqeAshQOdvexd//S544kf/3R9C9PCfefRLTwVl538jXhQRj4XpTEE6CZQOgnrPvg08NQA3sehnj4KxBqDXwZ3yj4ItTQnJXgC7rDkxJcQIAPKAiL3KnCAZANWAiBgxOziqSZ4SYh7aiLm/QUwJqWGjY01pSgh2AKvR+TQmhgZFrfTMxdy/js0JWim3gKIDcE3CNJAAq13oACgWTF1iwMwlCixcItHCwMI5BC0YLBwC0Nl+YObgbRSAmMSMmxbm5zgAbKnB6Iguu/ept/Mm6R7eb9kbuPQmLr2RW3voMyiaPQmBHagGCIFH86/llpC6ATkVtL/NICAAvLa9h4Yft/8Wa4NPMNK/gSSqCVTOZwdI9BhZfjHkU/aYmUe/chIYeQ4B8Ku/hQEQgF2Ad9W14Fx0CZ8URgMi2LAo1XyADPW4ODUAA8qEEHl2MC8CSf5pQIRZ5FYwxeg3ww7AHKt/mhLCB0Y2YCqoB8uwWrAKrQFr9vy/ih0A2YaUoZWATXAR2AYXgl1wAdgF5aHlgH3QOrAPyAR7/3Sw808De79UsPNdA7beiWDrGQe2HtFg5RaOEISCuWOQAoARBaAU4O4f9fakmErKDn8GRqYtwrY9+w86Xs0afhMd/3s+2oVu6tL9fVQCekkzofdtcN38PLhtwXQgtYQiFXhRKpAh4CCQIpAa+O78HUT0fy46ha9Vr4d9Jd4HUHUAqpdClGcB72hPAs8QgIDGOxkA9DTQr+5GcC29is0Qts87IqaEGAPA+KAoGQAsAC0x+i1id6HtxNYPe39UADoDcEzcBi5rdoB7ynbwTNsO3mu3g09aB/imtYJvagtaM/iKARHeyY3gnbQevBLrwDOuGjxiK8A9ms8Kco0oApeIfHAJzQWnoCxwDExHCFLB3jcVnZ9MF0PBxjMWrN0jEYAwMCcFcApCR/szZ5vaGQJAf2bp5PePvr5+C3pHQLdvcq+uc/BgRFDHCfZ4NWTbi5DU8zqUYC1QuY9m+3zE3s+n17Trj34JOZMfgk/rS+Cy6UWWCoxB4CNqAqYGwqg+8Nv5e4hEEOLH/wwJo9rXwuj9Qu3jYP5amAKA6lnAzqV3AYEb70EIuAJ4Vv2CDYmwp9GxBADNCZJmBhoBwFYPAMr/lol96PgeBoB9yl5wS+8Dn+wBCMgdgOD8ATYbIDS/D8LyeyEkt5sPiFhHAyK2g396G/ilIQApTQwAr6RN8ogYz/gaNiJGmhHkwmYEFbI5Qc4hOeAYlAkOAWsx+tPAzi8FbH2SwEYAYOWGALiGovNR/h0DMfJJ/n2MKgDZSuwG2rftjDh0cL9Od2hqj665/9IK/7aX2Q+U3rQJ3fZrjLZXIGf8PTa0gW7oVIjhD3UIQeXBz9nzeWeEgI6HOQRSPcDTgU/723JxSOmAqUE7FYpvQ8AulPa+T9ghEjtSZu3fH/i7hiwFfCgAeE95HLznTUUBdrx0WgACt/CDoODN94Fvw+3gUnYtGxDhIE0Ly79YOy5OBmBOTgFsYGTaOLZ/I2C5ZghsUwfBNWsU/AsmIKxshs0GiC6fhqiyCQgvHoHQwiEIQefTdJCg3B4IytkDgWw6yC55PIwfjYdJbcLo34LRvxEB2IAA1CMAFP2VbEIYGxIVTgAUgEtYHjgHrwMHBMA+AOUfU4CdbwrYeBMAcWDjEYMKEAGWrqIGcET5t/cHU3K2nbdRAC4wc4G69ZsrLjp2BAGY3KOr23tNj1/7S/yHiQDQDzcMf8j0Fm5K/1vspm6VNPoFIag5/AU0HPsjZIx+gN3BS+DahDVBG1cCOiDybn8TP74lg+CDKUFtXq1vgWfbW6gI70J4z4f8bSB6yDTwMbtzEN2rdwZAj4O7fiPeB+CPgxd7Ghiy9REGAL0ZHLDpHvCovomNj3UskpZLXCHmBeoDsF+jANQFWKHzrbENdF03BUGlCxBdvR/i6g5AbO0CxFTPQ2QZHw5B00HCioYRAD4dhAAIzkUIMPrJ+YGZOyEgvYMNiCIAKPq9kzdzABI3MPn3IPmPqVRNCeNj4pj8B2ejAmSg89dyAHx4/rfB/G/jruR/bQGI0b+IAlAhmF9S1cMBmOrWle654ahv2wn+mrVQAfZDxlwbsuNViOl6A2jgI13UqDzwBz7U4dDn0HD8T1C2/3MI3fUmOG/m3QGDQFIDBgKlBQ6DZAQH+xx+nScWkj74tUG73oGIHv7mUaykAAhA5J73xDuBv+HOFy+ESO8DhHY8B6Ht/H2A0LYnILT1MYz+B8Gz7g42KoaNiJGHSAsAxKQwNigqR6sAdpnzYE0tIJpX4T6IrD0KCeuPQ+L6o+j4gwjBPrR5iK6aRQCm5fEwHIABJv8MgBwEYF2XUIAdGgXwSdmMCkDyjwAkrAfPBAKA5B/zfxQBUIrOLwJnkn9UAEcCIDAD7AKkAjAZFSABoz8WLRqjPxwsXXj+t7D3X7QDUAOQkpl/lAFwYKpHl9N5+61+rS+K9+uel1MBQUAvYdI7+eG7XoPM0d9hLfAHDoKYCkI3eQiEtJH3WTpgaiDVBQIE7443xKGRMKYSCEjbGxyY1lfY3/XA7sIHfx244w0I241O3/MueycwukfUANgFRO5+DWsBrAF24X8b/jcyFeigyyFPgN+mB8G9/m42McyJ1s2oZwYWXa0AwAZFXcwGRSkKcBCsMfptM+bAp/gQxDZcAsmbroCExksgth6dX3+EAUDjYQiAqMo5NiCKAAgvGVMUIK9XUYDs3QyAAAZAOypACwKABeAaXgB6JVL+Xw8e8bXgHlsNbjEVPPojS9DxBADKv1QABqSz6GcA+CAAXgmiAIxiBaCFMyoA6wBEAbhI9EsARCWm33r0yCGdbn6yT7d2+91P+rcIKSUIWCp4gb12RdEWsQujDgEIQRAS+96BMuoMDn0qQ0B3+jZc9GemBmGdb4HLlhP8qSE9M1CDIBn+nqKftZEIC50psLMFTCf07oF70wvs8ImOob2bXwDflhfBv+1FCEALbHsBAlueBf+tT4HvlifAayPNFXyADZV2qrqNmXOVtHLmBjEz8HoxLu4q7aQwNiruKGsFrTP3gWvBIYhefzmkNP0Mkjbx6SA0HyiugYZEaQGIJABKuQKElYwqAJAC0HQwqgGo+EMA/DO3YwpoA//UVg4ApQAaEcfyvygAY1ABYsrBNapUUwA6UQEYKBWAqXIBaO0pOgBWAGIH4BTCCkDK/2boZDO7xQG40NwVAiOSnjx4YJ+OvQKWvO3eVwLwhxra/hRC8Ky4ccNVQIIgnKQXc3AoQkAtWd7Uh1B76FN5PlDVoS/Y3T5Sg4yxD5ljCQT+9FDUBwwGYeLPZedj9Huydw5+zU4dPdDx9DDKbePTaE+BW+MT4LrhcXBd/wgbHeda90twqXtAnhrGxsvLyyZuVQAo/4UeAFdoALDLoUmhhyC4+jI2IWTN1msgceOVkLDxcoz+yxCCixGAowYARFXMySkgvJgUYEgAgAog5gQGrhMKkIEdwNp21gH4pYoOIHmTqgCs4QVg9FIKwDW8APQ0UgBi/jc7TQFIttzSDbyDYl+hwyB2ByCh4753KKLo1eowNQRSKmAQvMzzL0IQjhbW+SakDf+WtYd0RsCng/FxMetRDSoPYXu3911wazqhpAWVKY7HLqJZ63xPpgLP84dR9FSSHk9vfBLcNz6BIGDEs2miYu+AmCWsnhtoFICSa5R5gYV8ZKwt5n+nguMQt+k6yGi/UQyJ+hkbEpW48QqIRwDiMAUYUwCeAgQARaMCgAEOAFOAbghgAGAHkLkN/FABfNmAyCbe/yepAJAKQMr/EbwApPzvEqYUgHaiALT1XaQAdFpaAcgOg6zcwd0v6h26McTGvMa33/9+wNYnIATzaGjbU+wlS6keUCA4oUCw63UGAkEQt/cddlJYe1iaCcgHRtUe+YqBUDj3CarGm+Cy+UVw28LfKWBOp9NE4XjZ+Vu581n0Nz0H7uR8ejFl81PggQrgvvFxNk6WjZ1newceYNNDDQG4xYgCXMvGxHEALgObnIvArfhSSGm5GdI7boaUrT9nI+KSm66GJDYg6gquADIAhxcHoHhUzAccUHUAe7gCsBZwGyqAOANIFR0AFYCJUgFYjfKP+V9TAPL87ygdAAUY5n8bzP9UALL8zwpADoCp/eLRz84BrD3AxSfifX4UPDpGbwGfDNz6OARjBR3S8qQMQehiEIiagKvBmxCBFXrG6O9ZcaiogZIWyNZNnoTAbZgWNr3ATxK3nhDOF1EvzKOJO99Ddv7T6PhfCQV4nI2ad1//MF86oVGAu/UUgA+PVhRATAwtvAJsci8Br4qr2KSw9PbbIKX1RjYljBQgWRoThykgsfEyVgTGNRw/tQIgAKGkAAhAcG4vOp/kXzoDEC2gfgdABSB2AB4JVABWYQFYzk//WAGo5H+nwCye/9kJIOZ/b1X+dxf533np+Z9slbUnOHuHn2RHwaMIQGzrPScDm8n5j2I1jR9bTwWBtjBkvTlW56QGCb3vQvHcR6raQBkaSecGNFgqc/wDBOEVVITn2bGy4njF+Z4o/e7M+Tz63Rsl+X+Myz8C4NogTRO/fxEA9BSg9DpwKLoKbPIug4Da6yBz512Qvv12SGu7FVLbbkIAbkAA+JSwpM2YBhqv0APgqAEAEVIXIA6BQvPpDKBXcwZgrAPgBWCjtgDE/t81UioARf4XJ4D20gmgdAAk8r8Vy/+GJ4Cnyv8GAIyNjepiW+5+33/LIwjAI+yG7VIhCKd7euxsnlLCG1wNurgaULvIOgXVBFECof4YzQ78AtZNfMDaSzeEwHnjM+yJo6eIfHK++2Yp+p8UJuSfBkmL/M8AqDMGwC18bCy2ggQAOd+u8Gp2GBS1+VZYt/s+dP6dkNZxGxsVl9Z2M6S2ogI0IQDNAgAsBBdTgKgqDkBU+RQ7BaQZwWGqGcEMAHEGEJApAUBDopuxCBTPAJIa+Zh4uQDUz/95LP87BCoHQMbyv6Ve/jc9Tf43SAGT4yO6+JY73vHbzAcrLApBh4CAdQe8RQwXh0WyGggQQtGoNiiY/pA9SKqS5gcz4+pQd+RzrBs+h8KZDyG+5w3w3foCuGx4CpzW/wpcNz6tOF8V/WyUPOV/MUGcbRepvU+eGywtmJIUwKn8BjYy1gHlP6DhFkjbcT/kdD2I0X8vmxXIhkXKANwAKc3XcwBYIagAEFt/nNUAcXU0J5grQET5LIQUTUBg/gj45AyAZ2YvuKd3g1taJ7im7ALn5G3gnNQBTolt4BTfDM7xW8ApbiM4xW4A59j14BxTDy4xteAaXYUm+v8Inv9dVAAslv+p/7d0E9W/fADke9r8z58FsCeCvAicnRzSJbbe8orvJn6l2gACdU2A3QE7IyAItktt4gmREiQ14GkhbBcViW/AmsH3oHT+I1YfaCaJi19XIwy1hz9jD5yyRn4L0Vhk+mJL6rrhCXCqfwycGx5juwRcpX1DDcr0cLe6B8TkcGV8vGMF7RzmM4NdKm+EoI13QsqOX7KJoVldD0HGzvsYAOk77oK1YlgkmxaKdUDKVi0ACRsuRQguYSeBcXVHILxyHwQUz4JX7iQbDOGcMQTOa2lEbA8fEZvcCY7JO8AhaQd7FdyBzQfeCrYxYkB05AawDq8Hmwj+ONgqpBKsgkvBMojPBbQOLADrgDywCcgB24BssPXPAFs/ivxUNJ7/bby0+Z8DwPM/c/Apo58/IFpm4QaegTG8DaTLIKntNz7pvZHeo3/AEAJWGIruQLSIHAIlJbCzAlEgatLCLn5uELn7TchA59LAp2pyvLxLgI+LZwslaH8AAbH/I7ZVJHfsHbZZhEDza/4VeDbyxVPOtQ+CUy2fHO5YfS84Vt0NTtV8ajhB4L3+bghtug8Stz8MWT2PQz6bGfg4Ov9hyNj9Sz4sUgJgu3EAEtmg6CvZoOiYhosgqPwQeOXPg2vuNLhkT4Jr1hi7FMrvA/QjBHw8rOOaTjYQwoHdBlJdB48Ws4Ej+U0gAkCaDCpdBLUMUIZDW/hksSURZp5pbEeAqXuSfBOYxsKZOkeBqVMYWgiYOASBqZ0/mNj5wmrM/Sa2aHY0IoYbvQ622sYbVqHRbeGV1l6gW+kMPiEJTx6ig6CD03267I7rbvVqfBAC6fk5e4omINj6CC8MJQhafyUOi57hbaJQAw0IO9UgvCqrQqh4ppA9iiDMfwjV+/hGkfL5D+WVMuR4GhVPM4JpUnjVAr2U8jsom30XCifegpyRNyCz/2VI2/trNhhqzZ7nmKV1PwuZe5+F3L7noGDweSgcoo/PsDmB2T18XCyfFqoHgJ4CrMEUIE0Lj11/ORsV61F4ANzyFsA9V7oXOIkmAEinmQB94ERDIVL4jWA2IJpuA6HzCQB7vatg+uNgLFXj4aVrYMp4eD4TkMzENYG9BbSaTQSLgFX2Iewe4Eobf3SqD78IaumJPb7Xacyb3RUMi11767Gjh3S6wzO9uqLtVx71XP8Av0bFILifQ9BEEDzMIAhh6eBxuS4IZcWhvhroK8JLrEaQYAjDWoGBsIdAeJePhd/Hdwsxx5OxgZC/hZKZ99DeVaaDopVNvw3l029B+cxvoGzqTTQaGP06FI+9DEUjv2bOz2WTQp9G5/9KBcAjTAH4uFhlXrBUA6S23gxpWAOktVwPCVgABlVdCh5FR8Gt8BADgM8GUADgl0L5nUDnjF6920DKTCB2FYxmA8fwcTA28lDIGnETWBoMLS6CsgUR6zQLItg8QFIAF+1QSDYRzC4QIxsBsOEArKCBENbepzXdSkdIWpt39OLjRwiAPl1N58U9Hg33sTt0WggexJTwEHu8ylICQsDrAkUNQqUuYVEQJFV4SZwhvIzVPz1lfBkV4TXIGH4LnUyvolGkax0vOV8ZD/sGnxE8/jqfEzz2KuTTmFgxLDqPAfAMGxVLk0LXMQAeh2waFdtFA6MfYACk77wb0jH6pS4gvf1mSN76Cwituwq8Si8Bj2K6GXyUXw4t5IOi5dEwdCMom24EDfGpIGImgFNKl3wh1CFJGg/foh0HE8EBoA0hNiL/szkAAYXyaHg2FdRHPRk8CUzkQRBRqjkAwQhAALZ0frACAViO0r4SI3xJAKAC5BRW9nAAZvt0W7oPVXg23A0B7AoVQrDpHoTgXv5KFYNAmxIM1ICB8IwWBE1qUMHAlEGoA/6avXyy6yVIwXyfN/4WmwpejpJfKs8FVoZCSs4vFM6nCaHM+WxQ9POQN/AcpgGMfhoWvfcJMS38MZR/mhX8EJP/DAJA7AzI2H47pLTcAhEbrmPXwz1LL0UAxM0gdjXsoN6IWDEZJEuaDEYj4veKiSC7RfTr5f8Ydf5H+Y/Qk/+gYkP599HKvzQQcrUzjYMj+efXwNWTQOgiyJIBWOkENQ2bKhgA+6cHdDv75iO86+/g780JCAIRAkUNHjCaEjRqoAHhWRUML+h1DVqT5v2ECGBid5+Atf2vQf7YmyjvXOpLUerZiHgW+a/Kzs9H57MRsbLzefTniDnBTP73KPKfxYZF38eGRSe33gbhjTeAT/W14FVxJb8bIN8NPM4mhPF7gdJgiGlxLVzMBUL5d2EF4F4+EUQuACn/i9HwIv9L8q+ZBbSI/FsI+Tc9I/n3WrL8k51n6gZtHTsiDh/ar9NNTYzo+ocnLQLX3/wPv4bbIGDD7WyYQmDjXfx9OoOUIKmBujYwBsLTHAZ6YUOjDKKNlKBQG/5ZSMfzENz2HHsYFb3rRViz9wSbBkpbQmg4dPHEa1A0+jIbDVuEABSy+cAEwLN8VwAtieh7kpk0KDp7D3YAux6AlI57IKb5dghefwO7FeRViZFfdbUYDkHXw5XZANKEUJb/sQB0k/O/mAmQPsQLQHX+Z/Kv5H87zP/yWPgly792CIQJGwJhRP4p+q19Uf69z0j+qVBcbev7j156KZTOAfh691FdzKbr3vaqu429O88gaLxDvE3LUwKBEKRSA+NpQZ0aJBieVsHAlcEQCMWkz5OKBOPfDWp9CruQp9gouKhtz0DczmcguesZXvn3PAvZvc9C1t6nIXvvU/jxScjofhzS9zwGqbsegaRtD0Js230QsYWuh98GvvU3g0/tDfxOIFnVdexquHcFvxruJV8NP6oaDWOY/12kqWDsOjiXf2c2DmYHHwgl+n82DUzMAViy/Kuqfxb9rnwMjH71T9G/CqNflv+lRr+JKzh5RSivhdNx4OzksC6r5bKb3Gv4zRk/ukCx/jaWEuhqdYBKDejOfaAGhIf0QFDXCE/owcAdyZ42MnvGiInPETikJG1PiQlgNA72MQhsfpRZUPMjYg6AmAnI3gK+n80HpvTlv+Fu8NtwJ5sKQlPC2Z2A+pvEfMDrUfqlm8Gqi6F0J5BGwxQdkW8Fu+fNa+Wf8r9G/ruNyH+bgfzbnkb+2YJI30yU/7Uo/ykIgCj+XKQpYAiAQxhGvyT/fmcl/1QAhselKxdD6H/mpoZ0tTsPd7pV3YQ/qBv59Sl2j+42RQ2kAlGVFgJZWtAHQeoYHjWiDE+wiZ4sVUjpwpiJz4ew6Z9P8Jc9W6Xv8yj//vjvBEvO3yKcr5oIEkCXQcRkMD/pSpj6Wrgc/VcaDIbwVI+GI/lnU8EmxVQwIf/pQv5TjMl/i6H8R0jyX6GRf8MhUIbTwFeT/DsqM4A08m+1dPmXAMgvrtJeDSMF2N47F0vvzdMPyI/m6VO0qNRAqg3YD1aVFrQgiBpBKha3PqKFgZwo2+Mqe0Ll6McVh0smwyQczyaBPsTBw3+XK9K9Rpx/u8r5N8rO92HTQa+Wp4Oy+YDSdNCiI/JQCB79avkfFfJ/6urfXqr+YzaK1XAq+Q8pN1wOqZZ/dZB3mxYAABguSURBVPEn5F8u/uxpGvjZ9f7qFLC1dVvsvPpy6Pj4mG54ZHxFUN01X3tX/5zdnWNSWS+BcAuvDeS0cAdPCxoQ9IpFSRXUyqAPhAEUj7HjZ83nZac/rBoBy6M+UBX1rHXF/x5et6icXy+cX/dzRfqr+IVQb3kqiDb6tYc/6uiXqv8+dvzrxKr/XUL+t/HWL56vhrPXP/yRij/VDCC5+PNRij9Td6n3T1DJ/yLF3xlGPw2NMncM4NfDJ9QDImg83OSILnXzJfe5lPN78/TD4mrwC/4DlNOCHghCEfgNnHv1ugahCgKIYKEO5Eh2uES21YgJZzNr0jqdR/z9elF/DwOSp6nbmWJpIl84n88DkKaCqaSfDYWi6D9sEP1u+sUfjYPB6Ofy3yUXfw6i+HOg5ZDq4i+CP/yx1hz9nmnxF64p/laK4m+F1ZlFP/X/gZFr7ps3GBBBI2KmhnW1O/Z30A0a6o1ZpNRcz27RakCo14IQIINwp9I6Sl2DDIMaCGNQaI07W3E4t/tFupEinjueRT392/TfsEFy/i0Gzqf/Pz6amYBc+r3kwdBHePRT5U8DoQxy/2LRv1Mu/pQpYMaOfiuVnYAU/VT8+YnizweLPy9R/LHWL9F49KtO/qSz/TMCAPN/YVlNx379ETF8SNSobk//lKdX+ZX/YkuUqD/GXGkIwg0GIMg1goEq3G0ECKmdlKBYzPjXcKffKzudilAe8Yrjpajn179FtS8KPqPOZyPhlM0g0rGvJP3u8kTQKXkpBJsGlj7Ao18aBi1PAjUW/RtY9NvK0a8q/s6w9VttJPrP5OSPq4UXXGju8a9dnV2eM8aGRLExcQhBTMNFr7qV8h8UA4FaJaMgSIpwk4DhVkUVROcgK4MxIDYpKcOobeJ5XXI4+/tM5u8yiHjZ8SLq6b/NTy74rmf/HxZ3/jFD6c8V0r9OnPurKn/pwY8m+hNPF/1VLPot1dEvWj+LU0a/1PoFG2n9ziz6z1vtAm5+0a9OLzYmjg2KnB7WVbTv66V359ns/MorTwuCPwPhBgWE+ltkGCRlYGlCAMFGtklQMLt7EZM+L339Hby42yAtf1JHvOJ4f9XwB/bfW3WNVvZP4Xwu/dIwaEX6XfT7/kXP/bW5X45+Tet3ltFv64/yL0X/mRV/0tTwdQWnGBQpp4GBSXfP0kv/h49Ov8wICFeLGuE6TbGoqIIeDPpASFBIKaPxjkWMgyM7XI70W8X3vVn8O8YczyXfR9oDIE76DJwv5gB6aAZBTutJPy/86KmftvDjewCU3L9I5S9yvyb65cr/x4l+If+nHhUrpYGZyVFdQsPhJ12KLhFTs1QgsGFKAoQqBQRFFa7nLaRGGVRpQlYIFRQqOPz1HW3gcMXp/mL3n6Hjxfm+RvKlEbBSwWfofHfxvN9Ndj4fAsmlX3nm7yQ/89+u9P2x2r5fU/nr9/1nm/utzy73s+hf5Qy+IQlPzs3OnHpYNOsGpkd0jTtnq+nyJD0YYdOz8YfnYwwEBsPPNKqggaFGOVPgdoMKCgmMm/j4VtZmCpP+XP66GxSHi/wuOd1XcjqLeLXjpdGvlyqtXon0nH8x56ue94sXPnjVrxR+Tou2fcouYGUbeKUy+1+a/Suiny2BlPv+01f+Zxv9UvVfVbfx9OPi+cKIMborsCyg7PCXtECZfmjskESAwH+gEgxXqGC4yggMPE3oA6GohBoOIyalFuFwP/EQx0ftdKpN6N/VOP5y2fHKAiil1VuK89V530m88OGkqvqVwk9f+rVn/vqnfhanOfXT9v2BcvSvOMvov9D8DBdGUBpYQBUoaZkbs889wp+Lo2QqICiqIINAP3ANDFfywksG4hoDhdA37mBVZKtMcbhxp/tU6Od54Xh11LNiT73+ZV5P9o04n7V8PbLznaS8L73xi1X/4tJfoYp+tfRLK2DFC5906kdn/i6xiz7yXWnjfVZ9/1mtjGFj4ybGdH1D4zYYKd950A+N/fCOsB8kB+E4/+Gy5Qp6tYImTWiBoOVM3K5mYLBBzcyuNWL8cwygqqvF37uKKw1z+hVKtKukXuv4Y5qo55W+dvcPOd9tEec7p0nO53nfQZ33NVW/cem3VB35qgs//rpXilgCnche+CDpXy0VfhT9dt/vzJ+MLY2yPsOlUYoKjOpyNs1cZJ9zELzoh0dWLGBYTBWMpQlZIQyhUHcXviqTI1ttksOlos7A6ULqjTleinpZ8qeVUz6p4DPq/D2y87Utn5L37aIaVRvAa5Ym/Z6K9JuopJ9e9zJ44neWbZ8U/We1No61hJNjuu7+USeHjMl/uubO8915ahBUMHjJMEjKoA/EJcpGrnJ9pTBuGkfL0n6p8v3E95einT/IOWroeLnF00Y9l3zs80Wr55KuL/uLOD++hb3payzvS1U/f9a/iPR7pakKP+WBz2pN4Xf2z/ultm8ZzQe28PhnV3fPmS+OlFRg38yYbm3d8OGVCcPgmInRQiDgD5TBIANxSJikDEe1QMgKoYZCDcbp7GLl7wm45O+tdrqU4w0cL3I9RTw5X974OSYOefi8f22137WI81s1zpde9NTP+5ZGqv5TSv8pCr8VSyz8yOnSniBpQ0hCWu7hU0X/aZdHT02M6/oHRy3tUgf+bkFTslOHwD4DoyZnlkkqy6lkanUwCoSAQgOGAocCiPJ7Sc7VzuYmRflh1b+ldvo+OeLlgx1Nrhf7fiXJTxf7/tgDHqXaP7Xz9d7yZXlfON/Yca+Rqt9E86w/Qrv1UxR+y09T+GmcrtoPdL6pGynH91seLavA7LiuaNNw1/KYfrBJGQCrNQNgnTIIdmtROrOn+CIFenOWGQeCq4NhymAvWrJ1rEdUdnQRU76G/x09hxcdUJxesE+OdlnqjTpeHfV6+V7V5+sXfIrsqyp+jfNVp33iNS/DvE/Sn6xU/WLbl1r6V1LPr5Z+PefrR/kFKqdrFkNcYAfrCiu6Thf9pwWAnwvQKtmx87yy+t4zje8D6zX9bGKmlTBbVAWnTPzh5syAJ4NhgTuDRaIeFPpgqFVDrisOGX6+UO3s/cr3NnC6yPFM6vUcTxs+pVxPUZ+u3vMrXutWH/EazflKu6eu+A2KPoO8rxz4mKoOfFar3/NTvekjOft0Dr9A/Lna6NTP1j30vcnJifOM9f1nDACpwPz0uK5553DKqpgesE7ayzdmJEsw0BIFDoX92hF2eZIc4Zk/x4DgDpoXUKjBUMGhZ3JUF6gcLTt7XiXvek6naGeVvV7EZ0pyP8if6BlE/S6DQx6l2j8b52tP+8zcVXlflv5oTdUv3fEjh1/IC7glOVxtbCsIVv6bmlpT6KXP00X/kgBQp4Lkyr4rlkfvEdsyJOuVgbBi1s+GKtN6FVd0Br1S7ZE/yy1PbXOK5atM/eeqr5edrXG4cafzHH86x3fJUa/O9w6JbfK1brnVUxV8atnXOD9A2fIpveTBi75UHvnitI/2/FHRt4pWvdgFwwqbAFhmRUseKNJFDrdw10j6Uo0Kv6ikrCv275tfkvOXDADbKI4F4cjo2Crn1K5PTWN3g3XiHrYzh61NSVKAYMsUkmiaNofCFusGx3RShgnmOAaE2pmLmaja5eqdHC05W+NwrdNdZadLUi8cLxd59ECnkz3R05d8B/mdPn7Cpzi/YcnOt2TSnykXfaZuPOevco6FlY604DEcVogFD8usA8SGD2XJ0/ln4Xjm/NXOYO7o/+nIyOiqqcnJJft1yV9IRM3PjOu27hxKWRW1iy1LYrPyE7vAipkaCC0U1on897Zr+sAhbQicM0eZA9n6NerJJWNXr7XmxjZ08jWtysp24XC6okXVvOR0Odr7lRyfpnY8vcWjknvpZY7ENj3J36w94ZNaPfVyR/0N3yj75rTg0SsdTNh6lyR5vx8td1ruEAkr7Gm/j8r5bMmjdsPX2UQ+7QbSLXeEzc1tS5b+MwZAgmDf3IRuXd3eiQvDtoN1/C60TrE0QQKCQ8FtD1+rwsDo5lu2EvlHSiN2KX3guBYdljnCnOounMxtTHa0HN1ZRhxON3TY6nbhdBHtGqlnEb9LOc9P2q480NFEvb7kNyivdEvVfnApWKDjLTDqzX1zwZStd8uAVYssd9Q6PwyW0W4fG9WGT2tPVuSREy842+i/wBZSs4snDiyh6v9eAEhdwezUuC44p/Ox5WEdYlPGDrE0aRdboWYABbMuFRjc2Mo1Mvy1DYJit6YHHFJ7wWkttWeDzMHsmbxs9PtB/l4+OVza17tW3+k82g2kXuV4R1XUs43esZvR9A54wmmUSxVYBpWDeUCJstXTmxY6ZbO1Ltzxa/leP7bUKVHe67PCMQadH4XOD9c4f7nG+R5nHfnSLkDPoPjH6Fn/Uqr+7w0AETaNAAwNj1rgD/STVZEdfFNW7HaVqaEQYDA4hGKoLUHAQrv32P497dfa4OfskrrAPnkP28zpSA6mFe1p3OF0N49aOWd2QZPu6O9mq9ul1a18gbORiMcij+7u20ZtYrN7rMQqV4vgajAPqgRTWubEVrkViWWOeWyjJ3O+t3A+rXRbovOXS84Xm73oQuf3dj62fGb2fp8MDg1Z6K+E/cEAkCCYm5nQ7dgzFGoa2fpP06g2viyJNmbFSkBsMwIGNytmO8SmLT1j8Ki/nrZxStYhmyUZrWeVLKYdrGPawDq2lVtMC9pWsIpuRmtim7ssIzaJ/X1ifVsIX+BkGlgFpgFijWtAGV/lypxfKDt/tXeOiPwsdD5JfrqIfmWd21Kdv4ycb6W0emfj/PNMXeF8U9d/btvRGap+z/9HAUCuB2YndRvb+wpWhDSDGa1JY9syydr49kxm7Xpw6ANizNRf286/h/T9xL9hwZYzivWskc1gHtmEtgXMaUkjs01sX6952Ea2sInv7RVbO9nmzhqxvLFSWLlwfolY4cZ3+JHzTbylNW5q56cZcb6U86PknG/gfKvv7/zzzdxZv9+wsbngTFq+cwqABMH+uUld5eaepguD8IcfuVU4BS2agJCsdRFTgRLddoqva1G+LzmcWTM6vglti7DN3FiU057eRrGqVUR72GKOF1EfQFFfrBf1XPKZ81WSr17jJjl/pZGC73TOv8DybCp+dP6F9lBcWd90YP/C93L+9wZADUFRQ1fXBQH4Q4+gRYlNirHt2c2y4yw11iJM++caJ8uO5s62lG0zX8goO32jyul8QaO8pzek9jSOpwKvSF7cuHjUr9Vb4ry485edzvln2+5dYEfzfbrOhfPPCQCS7UMI8ut3914QsIHJsOQgblvO0rTfRx3hhg5vWMTp1WJHr57UaxyvyD3L9T680FOiXl/yRbHHtnjHCOdHGDrfyp+f8lmfC+e7M+dn5fN3+8+V387JN2HLJwUEhfWdey7wawDT0EbmJGYsH+vbZpVsbzb8vHCy4mi1s7UON5fyutrpBtFeLhd4ZkYdzxc2G4v6VVLUqySfij1pgfNyh3DtIY/c558b57Ocj7KPkb9Hcv65iP5zqgASBPvnpnQVG3c3L/OvhdXB9SqHrRcOPJ2t13Nyg9bZxhweLByu53T9aGfFnZD6xR2/eNQbSr6o9O2V/b3KCZ/o879nztdhtU8FX0llfTPJ/rl0/jkFQG0EQWNbd9HqoNrvVgTWgIXaeUuyOuZkyZijZWerIlzjcH2nq9o5KdpP4Xit3C8S9RrJVxd7Icadfw76fGz1vsNqv4jl/B/AVz8IAPzIeEq3Y3d/hG1k3cnzvcsV54VIJpwaUqN8TrZq4WSVow2crTjcLEAd6epoL1RFuzbHax1vTO6lXK+OenS+g57kS0e71iLf09n+OTnhc6Dx7yc7dnRGfN9W70cHQH54NDupGxwasQ5Zu+mhCxECk4AKZqbkPLVjmVVyC6xcxNH6ztZzuL+Qd9npBSqn5/Kq/pQRryf3BrleinrpcMdIvmcvcJy58y9QPQg6n7V5duATHP/QwOCQ9fz87A/m/B8UAOXYeEI3NzOpK2nYNWEXUQdWodVgFVLFHGniz40KNNnBkuk7WjjbjDlb3+FqeVecro52Ey/J8Rmqfv4Ujmdyz3M9Rf0KOeql/l5f8qnY81xSsWf4KpcH+/vnm9Hpngtk5ZVMzM7O6M72ePcnA4AEAT1AWpid0nXs6ssIXrvpQ4eoWnCPqwenqBqwCasEiyB+AmfiR1bMzFTlaLl4E85mES453EftcG2kG8i8xvEk9cYcz+V+paNU4UeoHK+KegPJVzlWVexdYOTNHvpzds3LxgtM7LzZkkda5ujgEfxhc0t7BlX69GDnh3b+jwKA9vnBpG5kdNQkq6L1MqeoKnCLqwGfpHrwTKgFt9hqcIyoAFt6szaAnF4oy/gqehDDnKw24XAfyeFLcXqaQY437niV3Itcv1zO9QGaFk9+kcPcg73Msaiz8Wtpdj+tb5e2els4+rFN3rTIMTF13WUjI6Mm82f4PP8/BgAJAppQSWrQuqMnM3BN3RtWQSVsZYpXfDVaFXjGVbEdOm74Z84RpWAfWgzWgYVg4Z8PZr7c4eyQhh7HsrZNat1UDjfmdJJ5N3Q6q+qV4k6SeoM8Lzs+BC7EqL9QOP5CS1+4EKN+mcj1kuQvY472Yo6m5QxSZC+2wt3E1gvOM3ECV9+IN5q2tmXSzV16k+fHdP6PDoBWDaYoNZxXWNvebR9a8o2pbz44hZey5Ym0QMlDZbRS3Z2tVKOdOsXgGFoIdsEFYBOQC1b+0oDlTDD1ygATz3RY7SGObOXcTm/nKE5fjoXdcvHUTurnyfHL7ZU8v8IuhEX9ctsgWGEbwF/atPFj07lXs00cPmw7hzqil2KmCAbJvaWj3zcFJVXd9Pbu93ma9x8JgFwbTIzr9s1P6/oGhuzSCjcfNPfP/265RzbYBBWAI1ueXMy2aHErEvt0C9laNdcIsnxwDSfLY2vWac0a37RJu/b4tk3auWPjmwrWPinMrLzXgJVXMlh5JoKlRwJaPFi4x4KlewxYudEmLr6Mka1jZSvZQ/hadsdAsZlrKbt5Fnc8fvwuNbPgYH//gB21dz9Wrv/JAaAGYQrTwr75GV1374BHSsHGYxZ+Od9e4LwWIzobrP1z2BIl+6BccCInh+WxjVrkcJfQHLZb1ykom+3XoxXrDoHpfNEiM75vV9q6be+Xwlav2/kk8fVrbAFTHNh68jXstIeXrWJz5Y43dwoGc1rISE6npYz2vizaWcQvEYDVNiT1zvTrb9dk5B3r7tnrQUXe1NTUv9XxPxkAtC3jpG7/woyut2/QaV3p5jHH4LxPLnROheUuqSjxGew9e5qoaeWbATZ+tFGLVqpxh+s73Y6MVq3Rti2fZL5xSzjdmi1ejBXLl2n9egTbwGXponZ8EDotQDje74wcL23musDMBezdgz/Jzi8d6+3tcyLH04yen4Ljf3IAGIIwqxsdHV1Ru7G9Liix5FHM6f863z4Bc3cSmGJu59u01rALF+YeaJ7JYOHF5d0azcY7mW3Z5JGeIEe7jYh2G/dIsMZot3I7neN9l+z4FZbuTOZX23r9KzAi6dHaho119P+BHD/9E4n4nzwA2hqBp4a52Wld555e37yyjX3eETknVrsmwvl2MXCBfQwWeQnsxg29e7/aJR4tjm3XogsYbN4OmimamUsUmLtEgLlzOH4MQwtlO3fNnULAzFGS+jNzPBWBF7DDG2cm9d5BsSfyiir7Orv2+M7Nzuqosv935/j/WADUIJDRqRipAn3s7NrrW1y9eVtIYsG91t7JXy2zjwSddSicZx0Cy+zC+bAFunVLFy/Z9Su6fxcqrl/TJUyq7AOxqg9glf1Kuo0rpnBJu/VYO4e/ZmbD/+x8MzfQrXJiM3fPN3UFS6eAr4IiU+4tKqvdtqtzjy/JO5P5mWn5v/un/vP9yf8HngqG+bkZ3dDwyKqWjl0JhRUbOqPWFN7oGpjyFkb7t8usg0Bn7gc6Mx80b9CZeuFHLMjMsRo394ILmPG3bOh5O+3R0a12YUsVdSu4k6WP9LnVtr7fOnlHvBURl35jfnF159bWbQlDQ8OrqIUjp8/+Bzn9PxaAxVpJAmHfwpxuYX6WdRR9/QNW7dt2RdZuaK7ILantScooOhoen3Wrb9iaJ9z9415x9o56x94j/H17j7CT9h6hZO+jc99x8495xTc08Ynw2LW30l693KLKntqGTRVtHTsj+/r6reigZgH/HWrf6CHNT13e/9cDsJhC0EiUwwf36y4+dli240cP6WhVKoFCUi3Ny2eXXdCRJNuUsw/h3zt+FP/O8SOyHT50QH4w85/ucH37/5L9JOEb1HdtAAAAAElFTkSuQmCC',
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

    const settingsBox = document.getElementById('settings-popup-pudding');
    if (settingsBox) settingsBox.style.background = real_top_bar;
    const speedinfo = document.getElementById('speedinfo-popup-pudding');
    if (speedinfo) speedinfo.style.background = real_top_bar;
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
window.SpeedrunCss = {};

window.SpeedrunCss.make = function () {
    const cssUrl = window.NepDebug
        ? "http://127.0.0.1:5500/bootstrap-stripped.css"
        : "../../mods/DarkSnakeGang/GoogleSnakePudding/main/bootstrap-stripped.css";

    const xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            const cssText = xhr.responseText;
            window.bootstrap_css = cssText;

            const styleElement = document.getElementsByTagName("style")[0];
            if (styleElement) {
                styleElement.innerHTML = styleElement.innerHTML + cssText;
            }

            let styleElnew = document.getElementById("custom-style");
            if (!styleElnew) {
                styleElnew = document.createElement("style");
                styleElnew.id = "custom-style";
                document.head.appendChild(styleElnew);
            }
            styleElnew.innerHTML = cssText;
        } else {
            console.error("Failed to load Bootstrap CSS:", xhr.status, xhr.statusText);
        }
    };

    xhr.onerror = function () {
        console.error("Network error while loading Bootstrap CSS");
    };

    xhr.ontimeout = function () {
        console.error("Timeout while loading Bootstrap CSS");
    };

    xhr.timeout = 10000;
    xhr.open("GET", cssUrl, true);
    xhr.send();
};

window.SpeedrunCss.alterCode = function (code) {
    return code;
};
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
        // Already short / v2-shaped: pad or trim to 20
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

    // Mid-run: paint one personal row (or mark dirty if Speed Info is hidden)
    window.timeKeeper.paintSpeedInfoRow = function (score) {
        if (typeof window.SpeedInfoPaintPersonalRow === "function") {
            window.SpeedInfoPaintPersonalRow(score);
            return;
        }
        window.timeKeeper.refreshSpeedInfo();
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
                const cloned = window.timeKeeper._cloneStorageValue(raw);
                storage[key21] = cloned;
                storage[key20] = window.timeKeeper._cloneStorageValue(raw);
            }
        }
        return storage;
    };

    // Compat: callers expecting mode "string" now get stable modeKey
    window.timeKeeper.getCurrentMode = function () {
        return window.ModeRegistry.getCurrentModeKey();
    };

    window.timeKeeper.gotApple = function (time, score) {
        if (!window.SpeedrunMod && typeof stats !== "undefined" && stats.apples) {
            stats.apples.session++;
            stats.apples.lifetime++;
            if (typeof updateCounterDisplay === "function") {
                updateCounterDisplay();
            }
        }
        if (
            !window.SpeedrunMod &&
            window.pudding_settings &&
            window.pudding_settings.randomizeThemeApple &&
            typeof window.setTheme === "function" &&
            typeof window.getRandomThemeName === "function"
        ) {
            window.setTheme(window.getRandomThemeName());
        }
        if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) return;

        window.timeKeeper.lastAppleDate = new Date();
        window.timeKeeper.lastAppleTime = time;

        if (score == 25 || score == 50 || score == 100) {
            window.timeKeeper.savePB(time, score);
        }
        window.timeKeeper.updateHighscoreLive(time, score);
    };

    window.timeKeeper.gotAll = function (time, score) {
        if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) return;
        if (window.timeKeeper.playing || window.timeKeeper.runStarted) {
            window.timeKeeper.saveScore(time, score);
        }
        window.timeKeeper.savePB(time, "ALL");
        // End of successful run: persist mid-run PB/HS memory
        window.timeKeeper.flushStorage();
        window.timeKeeper.playing = false;
    };

    // tick() calls this on every tick after a win or death until reset; only the
    // first call (while playing) may save. runStarted stays true until reset.
    window.timeKeeper.death = function (time, score) {
        if (!window.timeKeeper.shouldTrack(window.timeKeeper.getSaveContext())) {
            window.timeKeeper.playing = false;
            return;
        }
        if (window.timeKeeper.playing) {
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
        if (typeof window.freezeRunSelectors === "function") {
            window.freezeRunSelectors();
        }
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

        if (!window.SpeedrunMod && name != "trophy") {
            return eval(window[name + "_var"]);
        }
        return getSelectedIndex(name);
    };

    window.timeKeeper.scheduleLiveRefresh = function () {
        if (window.timeKeeper._liveRefreshQueued) return;
        window.timeKeeper._liveRefreshQueued = true;
        queueMicrotask(function () {
            window.timeKeeper._liveRefreshQueued = false;
            window.timeKeeper.paintSpeedInfoRow("H");
        });
    };

    // Mid-run: update Highscore PB in memory when current apples beat the stored best
    window.timeKeeper.updateHighscoreLive = function (time, score) {
        const ctx = window.timeKeeper.getSaveContext();
        if (!window.timeKeeper.shouldTrack(ctx)) return;
        if (typeof score !== "number" || isNaN(score)) return;

        const storage = window.timeKeeper.getStorage();
        const name = window.timeKeeper.buildKey("H", ctx);
        const appleTime =
            typeof window.timeKeeper.lastAppleTime !== "undefined"
                ? window.timeKeeper.lastAppleTime
                : Math.floor(time);

        if (typeof storage[name] == "undefined") {
            storage[name] = {
                high: score,
                time: appleTime,
                date:
                    typeof window.timeKeeper.lastAppleDate !== "undefined"
                        ? window.timeKeeper.lastAppleDate
                        : new Date(),
            };
            window.timeKeeper.markStorageDirty();
            window.timeKeeper.scheduleLiveRefresh();
            return;
        }

        const cur = storage[name];
        if (score < cur.high) return;
        if (score == cur.high && appleTime >= cur.time) return;

        cur.high = score;
        cur.time = appleTime;
        cur.date =
            typeof window.timeKeeper.lastAppleDate !== "undefined"
                ? window.timeKeeper.lastAppleDate
                : new Date();
        window.timeKeeper.markStorageDirty();
        window.timeKeeper.scheduleLiveRefresh();
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
            (score == storage[name].high &&
                window.timeKeeper.lastAppleTime < storage[name].time)
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
        // Mid-run (25/50/100) or pre-flush ALL: keep in memory only; paint one row
        window.timeKeeper.markStorageDirty();
        window.timeKeeper.paintSpeedInfoRow(score);
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

    // v10 Speed Info personal PB format: zero-padded 01m23s456ms (keeps ms when hours > 0)
    window.timeKeeper.formatTimeV10Style = function (ms) {
        ms = Math.floor(Number(ms) || 0);
        const hours = Math.floor(ms / 3600000);
        const minutes = String(Math.floor(ms / 60000 - hours * 60)).padStart(2, "0");
        const seconds = String(
            Math.floor((ms - minutes * 60000 - hours * 3600000) / 1000)
        ).padStart(2, "0");
        const mseconds = String(
            ms - minutes * 60000 - seconds * 1000 - hours * 3600000
        ).padStart(3, "0");
        if (hours === 0) return minutes + "m" + seconds + "s" + mseconds + "ms";
        return hours + "h" + minutes + "m" + seconds + "s" + mseconds + "ms";
    };

    // Speed Info PB times: current SRC style by default; v10 padded style when toggled
    window.timeKeeper.formatDisplayTime = function (ms) {
        if (
            window.pudding_settings &&
            window.pudding_settings.OldTimeKeeperFormat
        ) {
            return window.timeKeeper.formatTimeV10Style(ms);
        }
        return window.timeKeeper.formatTimeSrcStyle(ms);
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
                    // Prefer existing modeKey row if both present; always keep bitstring
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
                // Coerce accidental objects back to a plain total for old mods
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

        if (window.SpeedrunMod && typeof window.buildSpeedInfoTrackingControls === "function") {
            const trackingControls = window.buildSpeedInfoTrackingControls();
            dialog.appendChild(trackingControls);
            if (typeof window.wireSpeedInfoTrackingControls === "function") {
                window.wireSpeedInfoTrackingControls(trackingControls);
            }
        }

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

    // v12: this.header=c;this.Oh=this.Eb=this.ticks=this.ob=0
    // v13: this.header=c;this.Sh=this.Fb=this.ticks=this.ob=0
    const scoreCtor = code.match(
        /this\.header=[a-zA-Z0-9_$];this\.([a-zA-Z0-9_$]{1,8})=this\.([a-zA-Z0-9_$]{1,8})=this\.ticks=/
    );
    let scoreFunc;
    let timeFunc;
    if (scoreCtor) {
        scoreFunc = "this." + scoreCtor[1];
        timeFunc = "this.ticks*this." + scoreCtor[2];
    } else {
        scoreFuncVar = func.match(/[a-zA-Z0-9$]{1,8}\=\=\=\n?25/)[0].split("=")[0];
        scoreFunc = func.match(
            `${window.escapeRegex(scoreFuncVar.replace("\n", ""))}=\n?this.[a-zA-Z0-9$]{1,8}`
        )[0].split("=")[1];
        timeFunc = func.match(/\([a-zA-Z0-9$]{1,8}\*[a-zA-Z0-9$]{1,8}\)/)[0];
        ticksVar = timeFunc.split("(")[1].split("*")[0];
        tickLengthVar = timeFunc.split("*")[1].split(")")[0];
        realTicks = func.match(`${escapeRegex(ticksVar)}=this.[a-zA-Z0-9$]{1,8}`)[0].split("=")[1];
        realTickLength = func.match(`${escapeRegex(tickLengthVar)}=this.[a-zA-Z0-9$]{1,8}`)[0].split(
            "="
        )[1];
        timeFunc = `${realTicks}*${realTickLength}`;
    }

    ownFunc = "window.timeKeeper.gotApple(Math.floor(" + timeFunc + ")," + scoreFunc + ");";
    if25_regex = new RegExp(/if\([a-zA-Z0-9$]{1,8}\=\=\=\n?25/);
    const if25_in_tick = func.match(if25_regex);
    if (if25_in_tick) {
        ownFuncIndex = func.indexOf(if25_in_tick[0]);
        func = func.slice(0, ownFuncIndex) + ownFunc + func.slice(ownFuncIndex);
    }

    func =
        func.slice(0, func.indexOf("WIN.play()") + 11) +
        "window.timeKeeper.gotAll(Math.floor(" +
        timeFunc +
        ")," +
        scoreFunc +
        ")," +
        func.slice(func.indexOf("WIN.play()") + 11);

    death = func.match(/if\(this.[a-zA-Z0-9$]{1,8}\|\|this.[a-zA-Z0-9$]{1,8}\)/)[0];
    death = death.slice(death.indexOf("(") + 1, death.indexOf("|"));
    func =
        func.slice(0, func.indexOf("{") + 1) +
        "if(" +
        death +
        "){window.timeKeeper.death(Math.floor(" +
        timeFunc +
        ")," +
        scoreFunc +
        ");}else if(!window.timeKeeper.runStarted){window.timeKeeper.start();}" +
        func.slice(func.indexOf("{") + 1);

    code = code.assertReplace(func_regex, func + StartOfNext);

    // v13 moved the 25/50/100 HUD update out of tick() into a helper.
    if (!if25_in_tick) {
        const appleHud = /([a-zA-Z0-9_$]{1,8})=function\(a,b,c,d\)\{if\(b===25\|\|b===50\|\|b===100\)/;
        window.catchError(appleHud, code);
        code = code.assertReplace(
            appleHud,
            "$1=function(a,b,c,d){window.timeKeeper.gotApple(Math.floor(c*d),b);if(b===25||b===50||b===100)"
        );
    }

    // Count attempts / clear runStarted on reset (SpeedrunMod has no Counter.js hook).
    // Safe to call twice: second addAttempt no-ops when runStarted is already false.
    code = code.assertReplace(
        /;this\.reset\(\)\}\}/,
        `;window.timeKeeper.addAttempt();this.reset()}}`
    );

    return code;
};
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
window.Backup = {};

window.Backup.make = function () {
  const BACKUP_FORMAT = "puddingmod-backup";
  const BACKUP_VERSION = 1;

  const WHITELIST = [
    "snake_timeKeeper",
    "inputCounterMod",
    "PuddingSettings",
    "keybinds",
    "_snake_pb",
    "_snake_timer_format",
    "_snake_show_delta",
    "_snake_null_split",
    "_snake_aheadg",
    "_snake_aheadl",
    "_snake_behindg",
    "_snake_behindl",
    "_snake_pb_bridge_migrated",
    "snakeAdvancedSettings",
  ];

  const SETTINGS_KEYS = new Set([
    "PuddingSettings",
    "keybinds",
    "_snake_timer_format",
    "_snake_show_delta",
    "_snake_null_split",
    "_snake_aheadg",
    "_snake_aheadl",
    "_snake_behindg",
    "_snake_behindl",
    "_snake_pb_bridge_migrated",
    "snakeAdvancedSettings",
  ]);

  function parseMaybeJson(raw) {
    if (raw == null) return undefined;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }

  function readLocalJson(key) {
    const raw = localStorage.getItem(key);
    if (raw == null) return undefined;
    return parseMaybeJson(raw);
  }

  function writeValue(key, value) {
    if (value === undefined) return;
    if (value === null) {
      localStorage.removeItem(key);
      return;
    }
    if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
  }

  function isPbRow(key) {
    return /^(25|50|100|ALL)-/.test(key);
  }

  function isHighscoreKey(key) {
    return key.slice(0, 2) === "H-";
  }

  function isAttemptKey(key) {
    return key.slice(0, 4) === "att-";
  }

  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function mergePbEntry(local, imported) {
    if (!local) return imported;
    if (!imported) return local;
    const localTime = num(local.time, Infinity);
    const importedTime = num(imported.time, Infinity);
    const better = importedTime < localTime ? imported : local;
    return {
      time: better.time,
      date: better.date,
      att: Math.max(num(local.att, 0), num(imported.att, 0)),
      sum: Math.max(num(local.sum, 0), num(imported.sum, 0)),
    };
  }

  function mergeHighscoreEntry(local, imported) {
    if (!local) return imported;
    if (!imported) return local;
    const lHigh = num(local.high, -Infinity);
    const iHigh = num(imported.high, -Infinity);
    if (iHigh > lHigh) return imported;
    if (iHigh < lHigh) return local;
    const lTime = num(local.time, Infinity);
    const iTime = num(imported.time, Infinity);
    return iTime < lTime ? imported : local;
  }

  function attemptTotal(raw) {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (raw && typeof raw === "object" && typeof raw.total === "number") {
      return raw.total;
    }
    return 0;
  }

  function mergeAttemptEntry(local, imported) {
    if (!local && imported == null) return imported;
    // Legacy att-* values are plain numbers (v10/v11); current are objects
    if (typeof local === "number" || typeof imported === "number") {
      return Math.max(attemptTotal(local), attemptTotal(imported));
    }
    if (!local) {
      const rec = Object.assign({}, imported);
      if (typeof rec.session !== "number") rec.session = 0;
      if (typeof rec.total !== "number") rec.total = attemptTotal(imported);
      return rec;
    }
    if (!imported) return local;
    return {
      total: Math.max(attemptTotal(local), attemptTotal(imported)),
      session: typeof local.session === "number" ? local.session : 0,
      lastAttempt:
        local.lastAttempt != null ? local.lastAttempt : imported.lastAttempt,
      lastSession: Math.max(
        num(local.lastSession, 0),
        num(imported.lastSession, 0)
      ),
    };
  }

  function mergeTimeKeeper(local, imported) {
    const out =
      local && typeof local === "object" ? Object.assign({}, local) : {};
    const src =
      imported && typeof imported === "object" ? imported : {};
    for (const key of Object.keys(src)) {
      if (key === "version") continue;
      const a = out[key];
      const b = src[key];
      if (isPbKey(key)) {
        out[key] = mergePbEntry(a, b);
      } else if (isHighscoreKey(key)) {
        out[key] = mergeHighscoreEntry(a, b);
      } else if (isAttemptKey(key)) {
        out[key] = mergeAttemptEntry(a, b);
      } else if (a === undefined) {
        out[key] = b;
      }
    }
    out.version = 4;
    return out;
  }

  function mergeCounter(local, imported) {
    const base =
      local && typeof local === "object"
        ? JSON.parse(JSON.stringify(local))
        : {
            visible: true,
            statShown: "inputs",
            statDurationShown: "game",
            inputs: { game: 0, session: 0, lifetime: 0 },
            plays: { session: 0, lifetime: 0 },
            apples: { session: 0, lifetime: 0 },
          };
    const src = imported && typeof imported === "object" ? imported : {};

    function ensureBucket(obj, name, fields) {
      if (!obj[name] || typeof obj[name] !== "object") obj[name] = {};
      for (const f of fields) {
        if (typeof obj[name][f] !== "number") obj[name][f] = 0;
      }
    }

    ensureBucket(base, "inputs", ["game", "session", "lifetime"]);
    ensureBucket(base, "plays", ["session", "lifetime"]);
    ensureBucket(base, "apples", ["session", "lifetime"]);
    ensureBucket(base, "goldenFruit", [
      "apple",
      "cherry",
      "strawberry",
      "carrot",
      "watermelon",
    ]);

    if (src.inputs && typeof src.inputs === "object") {
      base.inputs.lifetime = Math.max(
        num(base.inputs.lifetime, 0),
        num(src.inputs.lifetime, 0)
      );
    }
    if (src.plays && typeof src.plays === "object") {
      base.plays.lifetime = Math.max(
        num(base.plays.lifetime, 0),
        num(src.plays.lifetime, 0)
      );
    }
    if (src.apples && typeof src.apples === "object") {
      base.apples.lifetime = Math.max(
        num(base.apples.lifetime, 0),
        num(src.apples.lifetime, 0)
      );
    }
    if (src.goldenFruit && typeof src.goldenFruit === "object") {
      for (const k of [
        "apple",
        "cherry",
        "strawberry",
        "carrot",
        "watermelon",
      ]) {
        base.goldenFruit[k] = Math.max(
          num(base.goldenFruit[k], 0),
          num(src.goldenFruit[k], 0)
        );
      }
    }

    if (typeof src.statShown === "string") base.statShown = src.statShown;
    if (typeof src.statDurationShown === "string") {
      base.statDurationShown = src.statDurationShown;
    }
    if (typeof src.visible === "boolean") base.visible = src.visible;

    return base;
  }

  function mergeSnakePb(local, imported) {
    if (imported == null) return local;
    if (local == null) return imported;
    if (typeof imported === "number" && typeof local === "number") {
      return imported < local ? imported : local;
    }
    if (typeof imported !== "object" || typeof local !== "object") {
      return imported;
    }
    const out = Array.isArray(local) ? local.slice() : Object.assign({}, local);
    for (const key of Object.keys(imported)) {
      out[key] = mergeSnakePb(out[key], imported[key]);
    }
    return out;
  }

  function collectExportData() {
    if (typeof window.flushSnakePb === "function") {
      window.flushSnakePb();
    }
    if (typeof window.timeKeeper !== "undefined" &&
        typeof window.timeKeeper.flushStorage === "function") {
      window.timeKeeper.flushStorage();
    }
    if (typeof window.saveSettings === "function") {
      window.saveSettings();
    }
    if (typeof window.saveStatistics === "function") {
      window.saveStatistics();
    }

    const data = {};
    for (const key of WHITELIST) {
      const value = readLocalJson(key);
      if (value !== undefined) data[key] = value;
    }
    return data;
  }

  function applyReplace(data) {
    for (const key of WHITELIST) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      writeValue(key, data[key]);
    }
  }

  function applyMerge(data) {
    for (const key of WHITELIST) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      const imported = data[key];

      if (key === "snake_timeKeeper") {
        writeValue(key, mergeTimeKeeper(readLocalJson(key), imported));
        continue;
      }
      if (key === "inputCounterMod") {
        writeValue(key, mergeCounter(readLocalJson(key), imported));
        continue;
      }
      if (key === "_snake_pb") {
        writeValue(key, mergeSnakePb(readLocalJson(key), imported));
        continue;
      }
      if (SETTINGS_KEYS.has(key)) {
        writeValue(key, imported);
      }
    }
  }

  window.exportPuddingBackup = function () {
    const payload = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: collectExportData(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const day = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "puddingmod-backup-" + day + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  window.importPuddingBackup = function (file, mode) {
    if (!file) return;
    if (mode !== "merge" && mode !== "replace") {
      alert("Invalid import mode");
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        alert("Invalid backup file (not JSON)");
        return;
      }
      if (
        !parsed ||
        parsed.format !== BACKUP_FORMAT ||
        !parsed.data ||
        typeof parsed.data !== "object"
      ) {
        alert("Invalid backup file (wrong format)");
        return;
      }

      const confirmMsg =
        mode === "merge"
          ? "Merge this backup into your Pudding Mod data? Better PBs and higher lifetime counts are kept; settings from the file are applied. The page will reload."
          : "Replace Pudding Mod data with this backup for all keys in the file? Existing values for those keys will be overwritten. The page will reload.";

      if (!confirm(confirmMsg)) return;

      try {
        if (mode === "merge") applyMerge(parsed.data);
        else applyReplace(parsed.data);
      } catch (e) {
        console.error(e);
        alert("Import failed");
        return;
      }
      location.reload();
    };
    reader.onerror = function () {
      alert("Could not read backup file");
    };
    reader.readAsText(file);
  };

  window.wirePuddingBackupButtons = function (opts) {
    if (!opts) return;
    const exportBtn = opts.exportBtn;
    const mergeBtn = opts.mergeBtn;
    const replaceBtn = opts.replaceBtn;
    const fileInput = opts.fileInput;
    if (!fileInput) return;

    let pendingMode = "merge";

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        window.exportPuddingBackup();
      });
    }

    function openPicker(mode) {
      pendingMode = mode;
      fileInput.value = "";
      fileInput.click();
    }

    if (mergeBtn) {
      mergeBtn.addEventListener("click", function () {
        openPicker("merge");
      });
    }
    if (replaceBtn) {
      replaceBtn.addEventListener("click", function () {
        openPicker("replace");
      });
    }

    fileInput.addEventListener("change", function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      window.importPuddingBackup(file, pendingMode);
    });
  };
};

window.Backup.alterCode = function (code) {
  return code;
};
// Frames-per-second label in the board's top-right corner, styled and placed like
// the "Pudding Mod vNN" indicator (PuddingInit runCodeAfter) mirrored to the right.
// Runs its own requestAnimationFrame loop only while enabled (the game renders on
// rAF too, so this matches the game's frame rate). No snake.js changes.

window.FpsCounter = {};

window.FpsCounter.make = function () {
    const SAMPLE_MS = 500;
    let el = null;
    let rafId = 0;
    let frames = 0;
    let windowStart = 0;

    // Same host/sibling as the mod indicator; null until the board DOM exists.
    function ensureEl() {
        if (el && el.isConnected) return el;
        const host = document.getElementsByClassName("EjCLSb")[0];
        if (!host) return null;
        if (!el) {
            el = document.createElement("div");
            el.id = "pudding-fps-counter";
            el.style =
                "position:absolute;right:0;font-family:Roboto,Arial,sans-serif;color:white;font-size:14px;" +
                "padding-top:4px;padding-right:30px;user-select:none;pointer-events:none;" +
                "font-variant-numeric:tabular-nums;display:none;";
            el.textContent = "-- FPS";
        }
        host.insertBefore(el, document.getElementsByClassName("jNB0Ic")[0] || null);
        return el;
    }

    function loop(t) {
        frames++;
        if (!windowStart) windowStart = t;
        const elapsed = t - windowStart;
        if (elapsed >= SAMPLE_MS) {
            if (ensureEl()) {
                el.style.display = "block";
                el.textContent = Math.round((frames * 1000) / elapsed) + " FPS";
            }
            frames = 0;
            windowStart = t;
        }
        rafId = requestAnimationFrame(loop);
    }

    // rAF pauses while hidden; drop the stale window so the first sample after
    // returning is not averaged over the hidden time.
    document.addEventListener("visibilitychange", function () {
        frames = 0;
        windowStart = 0;
    });

    window.FpsCounterSetEnabled = function (on) {
        if (on) {
            if (rafId) return;
            frames = 0;
            windowStart = 0;
            if (ensureEl()) {
                el.textContent = "-- FPS";
                el.style.display = "block";
            }
            rafId = requestAnimationFrame(loop);
        } else {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = 0;
            if (el) el.style.display = "none";
        }
    };

    // Wires a settings switch (Pudding settings panel / Speedrun Mod controls).
    window.FpsCounterBindCheckbox = function (checkbox) {
        if (!checkbox) return;
        checkbox.checked = !!window.pudding_settings.FpsCounter;
        checkbox.addEventListener("change", function () {
            window.pudding_settings.FpsCounter = !!checkbox.checked;
            window.FpsCounterSetEnabled(window.pudding_settings.FpsCounter);
            if (typeof window.saveSettings === "function") window.saveSettings();
        });
    };

    window.FpsCounterSetEnabled(!!(window.pudding_settings && window.pudding_settings.FpsCounter));
};

window.FpsCounter.alterCode = function (code) {
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

    // --- Tab visibility / dirty flush (seamless tab-back) ---
    function isTabHidden() {
        return typeof document !== "undefined" && document.hidden;
    }

    window.markSpeedInfoDirty = function (opts) {
        window._speedInfoNeedsRefresh = true;
        if (opts && opts.src) window._speedInfoSrcNeedsRefresh = true;
    };

    function clearRunsBoardCache() {
        for (const k of Object.keys(runsBoardCache)) delete runsBoardCache[k];
        for (const k of Object.keys(runsBoardPromises)) delete runsBoardPromises[k];
    }

    function goldCacheSettingPrefix(modeKey, count, speed, size) {
        return modeKey + "|" + count + "|" + speed + "|" + size + "|";
    }

    function goldCacheScorePrefix(modeKey, count, speed, size, score) {
        return goldCacheSettingPrefix(modeKey, count, speed, size) + score + "|";
    }

    function pruneSpeedInfoGoldCache(modeKey, count, speed, size) {
        if (!window._speedInfoGoldCache) return;
        if (
            typeof modeKey !== "string" ||
            typeof count !== "number" ||
            typeof speed !== "number" ||
            typeof size !== "number"
        ) {
            return;
        }
        const keep = goldCacheSettingPrefix(modeKey, count, speed, size);
        for (const key of Object.keys(window._speedInfoGoldCache)) {
            if (key.indexOf(keep) !== 0) delete window._speedInfoGoldCache[key];
        }
    }

    function rememberGoldCache(gKey, gold, modeKey, count, speed, size, score) {
        if (!window._speedInfoGoldCache) window._speedInfoGoldCache = {};
        if (
            typeof modeKey === "string" &&
            typeof count === "number" &&
            typeof speed === "number" &&
            typeof size === "number" &&
            score != null
        ) {
            const scorePrefix = goldCacheScorePrefix(modeKey, count, speed, size, score);
            for (const key of Object.keys(window._speedInfoGoldCache)) {
                if (key.indexOf(scorePrefix) === 0 && key !== gKey) {
                    delete window._speedInfoGoldCache[key];
                }
            }
        }
        window._speedInfoGoldCache[gKey] = !!gold;
    }

    function resolveSpeedInfoSettingContext() {
        if (
            window.timeKeeper &&
            (window.timeKeeper.runStarted || window.timeKeeper.playing) &&
            typeof window.timeKeeper.mode === "string" &&
            typeof window.timeKeeper.count === "number"
        ) {
            return {
                modeKey: window.timeKeeper.mode,
                count: window.timeKeeper.count,
                speed: window.timeKeeper.speed,
                size: window.timeKeeper.size,
            };
        }
        if (!window.timeKeeper || typeof window.timeKeeper.getCurrentSetting !== "function") {
            return null;
        }
        try {
            return {
                modeKey:
                    typeof window.timeKeeper.getCurrentMode === "function"
                        ? window.timeKeeper.getCurrentMode()
                        : null,
                count: window.timeKeeper.getCurrentSetting("count"),
                speed: window.timeKeeper.getCurrentSetting("speed"),
                size: window.timeKeeper.getCurrentSetting("size"),
            };
        } catch (e) {
            return null;
        }
    }

    window.flushSpeedInfoIfNeeded = function () {
        if (isTabHidden()) return;
        const needSrc = !!window._speedInfoSrcNeedsRefresh;
        const needPaint = !!window._speedInfoNeedsRefresh;
        if (!needSrc && !needPaint) return;
        window._speedInfoSrcNeedsRefresh = false;
        window._speedInfoNeedsRefresh = false;
        if (needSrc && typeof window.getAllSrc === "function") {
            window.getAllSrc().catch(function (e) {
                console.error("getAllSrc error:", e);
            });
            return;
        }
        if (needPaint && typeof window.SpeedInfoUpdate === "function") {
            window.SpeedInfoUpdate().catch(function (e) {
                console.error("SpeedInfoUpdate error:", e);
            });
        }
    };

    function onTabVisibilityChange() {
        if (isTabHidden()) {
            clearRunsBoardCache();
            const ctx = resolveSpeedInfoSettingContext();
            if (ctx && ctx.modeKey != null) {
                pruneSpeedInfoGoldCache(ctx.modeKey, ctx.count, ctx.speed, ctx.size);
            }
            return;
        }
        window.flushSpeedInfoIfNeeded();
    }

    if (typeof document !== "undefined" && !window._speedInfoVisibilityHooked) {
        window._speedInfoVisibilityHooked = true;
        document.addEventListener("visibilitychange", onTabVisibilityChange);
    }

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

    // Personal HS may gold only when SRC/CE has an HS category for this combo
    function canGoldHighscore(mode, count, speed, size) {
        if (!canSubmitHighscore(mode, count)) return false;
        if (size > 2 || count > 6 || speed > 2) return false;
        return true;
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

    // Timed: lower ms wins. Highscore: higher apples wins (only when SRC has an HS board). Unheld → gold.
    async function shouldGoldPb(score, mode, count, speed, size, pb, modeKey) {
        if (score === "H") {
            // Must match a real SRC/CE HS category (not merely FSS display rules)
            if (!canGoldHighscore(mode, count, speed, size)) return false;
        }

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

    // Timed: lower timeT wins. High Score encodes apples as duration (0.072 → 72), so higher wins.
    function findBestTrackedRun(boardData, playerName, categoryKey, preferHigher) {
        if (!boardData || !boardData.runs) return null;
        const target = playerName.toLowerCase();
        let best = null;
        for (const run of Object.values(boardData.runs)) {
            if (!run || !run.playerName) continue;
            if (String(run.playerName).toLowerCase() !== target) continue;
            if (run.category !== categoryKey) continue;
            if (typeof run.timeT !== "number") continue;
            if (!best) {
                best = run;
                continue;
            }
            if (preferHigher ? run.timeT > best.timeT : run.timeT < best.timeT) best = run;
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

        if (isTabHidden()) {
            window.markSpeedInfoDirty({ src: true });
            return;
        }

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

    window.buildSpeedInfoTrackingControls = function () {
        const btnColor = window.button_color || "#1155CC";
        const section = document.createElement("div");
        section.className = "speedinfo-tracking-controls";
        section.style.cssText =
            "margin:12px 0 0;padding:12px 0 0;border-top:1px solid rgba(255,255,255,0.22);";
        section.innerHTML = `
        <div style="font-weight:bold;color:white;font-family:Roboto,Arial,sans-serif;text-align:center;margin-bottom:8px;">SRC / Tracking</div>
        <div style="display:flex;gap:10px;align-items:flex-start;justify-content:center;flex-wrap:wrap;text-align:left;">
          <div style="display:flex;align-items:center;gap:6px;padding-top:4px;">
            <input class="form-check-input" type="checkbox" role="switch" id="ShowWrHolders" style="width:1.3em;height:1.3em;margin:0;">
            <label class="form-check-label" for="ShowWrHolders" style="margin:0;white-space:nowrap;color:white;font-family:Roboto,Arial,sans-serif;">Show WR holders</label>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <label for="TrackedPlayerInput" class="form-check-label" style="margin:0;white-space:nowrap;color:white;font-family:Roboto,Arial,sans-serif;">Track player</label>
            <input type="text" class="form-control" id="TrackedPlayerInput" list="tracked-player-suggestions" placeholder="SRC username" autocomplete="off" style="width:140px;display:inline-block;background-color:${btnColor};color:white;font-family:Roboto,Arial,sans-serif;border:1px solid rgba(255,255,255,0.25);border-radius:4px;outline:none;text-align:left;caret-color:white;padding:2px 6px;">
            <datalist id="tracked-player-suggestions"></datalist>
            <button class="btn" type="button" style="margin:0;color:white;background-color:${btnColor};font-family:Roboto,Arial,sans-serif;padding:2px 10px;" id="TrackedPlayerSet">Set</button>
            <button class="btn" type="button" style="margin:0;color:white;background-color:${btnColor};font-family:Roboto,Arial,sans-serif;padding:2px 10px;" id="TrackedPlayerClear">Clear</button>
          </div>
        </div>`;
        return section;
    };

    window.wireSpeedInfoTrackingControls = function (root) {
        if (!root || !window.pudding_settings) return;

        const wrholders_checkbox = root.querySelector("#ShowWrHolders");
        const tracked_input = root.querySelector("#TrackedPlayerInput");
        const trackedSetBtn = root.querySelector("#TrackedPlayerSet");
        const trackedClearBtn = root.querySelector("#TrackedPlayerClear");
        if (!wrholders_checkbox || !tracked_input || !trackedSetBtn || !trackedClearBtn) return;

        function syncSpeedInfoExclusiveUi() {
            const tracking = !!(window.pudding_settings.TrackedPlayerName || "").trim();
            if (tracking) {
                wrholders_checkbox.checked = false;
                wrholders_checkbox.disabled = true;
                wrholders_checkbox.title = "Clear tracked player to show WR holders";
            } else {
                wrholders_checkbox.disabled = false;
                wrholders_checkbox.title = "";
                wrholders_checkbox.checked = !!window.pudding_settings.ShowWrHolders;
            }
            tracked_input.value = window.pudding_settings.TrackedPlayerName || "";
        }

        function refreshSrcAfterSpeedInfoChange() {
            if (typeof window.refreshTrackedPlayerUi === "function") {
                window.refreshTrackedPlayerUi();
            }
            if (typeof window.getAllSrc === "function") {
                window.getAllSrc().catch(function (e) {
                    console.error("getAllSrc error:", e);
                });
            }
        }

        syncSpeedInfoExclusiveUi();
        if (typeof window.fillTrackedPlayerSuggestions === "function") {
            window.fillTrackedPlayerSuggestions();
        }

        tracked_input.addEventListener("keydown", function (evt) {
            evt.stopPropagation();
            if (evt.key === "Enter") {
                evt.preventDefault();
                trackedSetBtn.click();
            }
        });
        tracked_input.addEventListener("keyup", function (evt) {
            evt.stopPropagation();
        });

        wrholders_checkbox.addEventListener("change", function () {
            if (wrholders_checkbox.disabled) return;
            if (wrholders_checkbox.checked) {
                window.pudding_settings.TrackedPlayerName = "";
                tracked_input.value = "";
            }
            window.pudding_settings.ShowWrHolders = !!wrholders_checkbox.checked;
            if (typeof window.saveSettings === "function") window.saveSettings();
            syncSpeedInfoExclusiveUi();
            refreshSrcAfterSpeedInfoChange();
        });

        trackedSetBtn.addEventListener("click", function () {
            const name = (tracked_input.value || "").trim();
            window.pudding_settings.TrackedPlayerName = name;
            if (name) {
                window.pudding_settings.ShowWrHolders = false;
            }
            if (typeof window.saveSettings === "function") window.saveSettings();
            syncSpeedInfoExclusiveUi();
            refreshSrcAfterSpeedInfoChange();
        });

        trackedClearBtn.addEventListener("click", function () {
            tracked_input.value = "";
            window.pudding_settings.TrackedPlayerName = "";
            if (typeof window.saveSettings === "function") window.saveSettings();
            syncSpeedInfoExclusiveUi();
            refreshSrcAfterSpeedInfoChange();
        });
    };

    window.fillTrackedPlayerSuggestions = function () {
        if (isTabHidden()) {
            window.markSpeedInfoDirty({ src: true });
            return;
        }
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
        if (isTabHidden()) {
            window.markSpeedInfoDirty({ src: true });
            return;
        }
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
            const best = findBestTrackedRun(board, playerName, categoryKey, level === "H");
            if (!best) {
                el.innerHTML = `${labels[level]}: None`;
                return;
            }
            if (level === "H") {
                const highscore = Math.round(best.timeT * 1000 + 1e-6);
                const text = highscore + " Apples";
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
        if (isTabHidden()) {
            window.markSpeedInfoDirty({ src: true });
            return;
        }
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

        highscore = wrHighscoreFromRun(response["data"]["runs"][0]["run"]);
        if (highscore == null) {
            document.getElementById('Hsrc').innerHTML = `Highscore: None`
            return;
        }
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
        if (!duration) return "None";
        const regex = /PT(?:(\d+)H)?(?:(\d+)M)?([\d.]+)S/;
        const matches = String(duration).match(regex);
        if (!matches) return "None";

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
        if (!speedinfoBox) return;
        speedinfoBox.style.display = 'flex';
        speedinfoBox.style.visibility = 'visible';
        window.pudding_settings.SpeedInfo = true;
        const speedInfoToggle = document.getElementById("AlwaysOnTimeKeeper") ||
            document.getElementById("SpeedrunSpeedInfo");
        if (speedInfoToggle) speedInfoToggle.checked = true;
        if (typeof window.saveSettings === "function") window.saveSettings();

        // Panel was hidden: flush any deferred personal/SRC refresh
        window._speedInfoNeedsRefresh = true;
        if (typeof window.flushSpeedInfoIfNeeded === "function") {
            window.flushSpeedInfoIfNeeded();
        } else {
            window._speedInfoNeedsRefresh = false;
            window.SpeedInfoUpdate().catch(e=>console.error('SpeedInfoUpdate error:',e));
        }
    }

    window.SpeedInfoHide = function () {
        const speedinfoBox = document.getElementById('speedinfo-popup-pudding');
        if (!speedinfoBox) return;
        speedinfoBox.style.display = 'flex';
        speedinfoBox.style.visibility = 'hidden';
        window.pudding_settings.SpeedInfo = false;
        const speedInfoToggle = document.getElementById("AlwaysOnTimeKeeper") ||
            document.getElementById("SpeedrunSpeedInfo");
        if (speedInfoToggle) speedInfoToggle.checked = false;
        if (typeof window.saveSettings === "function") window.saveSettings();
    }

    window.SpeedInfoIsVisible = function () {
        const box = document.getElementById("speedinfo-popup-pudding");
        return !!(box && box.style.visibility !== "hidden");
    };

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
        speedinfoBox.innerHTML = `
<style>
#speedinfo-popup-pudding .si-header {
  display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 0 8px;
}
#speedinfo-popup-pudding .si-header-title {
  color:white;font-family:Roboto,Arial,sans-serif;font-weight:600;letter-spacing:0.04em;font-size:13px;
}
#speedinfo-popup-pudding .si-section {
  margin:0 0 8px;padding:0 0 8px;border-bottom:1px solid rgba(255,255,255,0.18);
}
#speedinfo-popup-pudding .si-section:last-child { border-bottom:none;margin-bottom:0;padding-bottom:0; }
#speedinfo-popup-pudding .si-section-title {
  display:block;color:rgba(255,255,255,0.75);font-family:Roboto,Arial,sans-serif;font-size:11px;
  font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;
}
#speedinfo-popup-pudding .si-stack {
  display:flex;flex-direction:column;gap:2px;
}
#speedinfo-popup-pudding .si-stack .form-check-label {
  margin:0;color:white;font-family:Roboto,Arial,sans-serif;font-size:16px;line-height:1.3;
}
#speedinfo-popup-pudding.pudding-text-compact .si-stack .form-check-label {
  font-size:12px;
}
#speedinfo-popup-pudding .form-check.form-switch .form-check-label {
  margin:0;color:white;font-family:Roboto,Arial,sans-serif;font-size:16px;line-height:1.25;
}
#speedinfo-popup-pudding.pudding-text-compact .form-check.form-switch .form-check-label {
  font-size:12px;
}
#speedinfo-popup-pudding .si-btn {
  box-sizing:border-box;margin:0;padding:4px 8px;color:white;background-color:#1155CC;border:none;
  border-radius:4px;font-family:Roboto,Arial,sans-serif;font-size:12px;line-height:1.3;cursor:pointer;
}
#speedinfo-popup-pudding .si-btn-block {
  display:block;width:100%;margin:0 0 4px;padding:5px 8px;
}
#speedinfo-popup-pudding .si-btn-row { display:flex;gap:4px;margin:0 0 2px; }
#speedinfo-popup-pudding .si-btn-row .si-btn { flex:1;margin:0;padding:5px 6px;font-size:11px; }
#speedinfo-popup-pudding .form-check.form-switch {
  display:flex;align-items:center;gap:6px;margin:0 0 4px;min-height:0;padding-left:0;
}
#speedinfo-popup-pudding .form-check.form-switch .form-check-input { margin:0;float:none;flex-shrink:0; }
#speedinfo-popup-pudding #si-main { flex:1;min-height:0;overflow-x:hidden;overflow-y:auto; }
#speedinfo-popup-pudding #speedrun-controls-section {
  flex-shrink:0;margin-top:auto;padding:8px 0 0;border-top:1px solid rgba(255,255,255,0.18);
}
#speedinfo-popup-pudding #input-display-section {
  flex-shrink:0;margin-top:auto;margin-bottom:0;width:100%;min-height:104px;box-sizing:border-box;
  padding:6px 0 0;border-top:1px solid rgba(255,255,255,0.18);justify-content:center;align-items:flex-end;
}
</style>

<div id="si-main">
  <div class="si-header">
    <span class="si-header-title">Speed Info</span>
    <button type="button" class="btn si-btn" id="time-keeper" jsname="time-keeper">Details</button>
  </div>

  <div id="si-personal" class="si-section">
    <span class="si-section-title">Personal</span>
    <div class="si-stack">
      <label id="mode-selected" class="form-check-label"></label>
      <label id="mode-selected2" class="form-check-label"></label>
      <label id="25" class="form-check-label"></label>
      <label id="50" class="form-check-label"></label>
      <label id="100" class="form-check-label"></label>
      <label id="ALL" class="form-check-label"></label>
      <label id="H" class="form-check-label"></label>
      <label id="att" class="form-check-label"></label>
    </div>
  </div>

  <div id="src-section" class="si-section">
    <span class="si-section-title">SRC World Records</span>
    <div class="si-stack">
      <label id="25src" class="form-check-label"></label>
      <label id="50src" class="form-check-label"></label>
      <label id="100src" class="form-check-label"></label>
      <label id="Allsrc" class="form-check-label"></label>
      <label id="Hsrc" class="form-check-label"></label>
    </div>
  </div>

  <div id="tracking-section" class="si-section" style="display:none;">
    <span id="tracking-label" class="si-section-title">Tracking</span>
    <div class="si-stack">
      <label id="25track" class="form-check-label"></label>
      <label id="50track" class="form-check-label"></label>
      <label id="100track" class="form-check-label"></label>
      <label id="Alltrack" class="form-check-label"></label>
      <label id="Htrack" class="form-check-label"></label>
    </div>
  </div>
</div>

<div id="speedrun-controls-section" style="display:none;"></div>

<div id="input-display-section" style="display:none;"></div>

<button type="button" class="btn si-btn" style="display:none;" id="speedinfo-close" jsname="speedinfo-close">Close</button>
`;

        document.getElementsByClassName('sEOCsb')[0].appendChild(speedinfoBox);
        if (typeof window.applyPuddingPanelTextSize === "function") {
            window.applyPuddingPanelTextSize();
        }
        window.cacheSpeedInfoElements = function () {
            const ids = [
                "mode-selected",
                "mode-selected2",
                "att",
                "25",
                "50",
                "100",
                "ALL",
                "H",
                "25src",
                "50src",
                "100src",
                "Allsrc",
                "Hsrc",
                "25track",
                "50track",
                "100track",
                "Alltrack",
                "Htrack",
            ];
            window._speedInfoEls = window._speedInfoEls || {};
            for (let i = 0; i < ids.length; i++) {
                window._speedInfoEls[ids[i]] = document.getElementById(ids[i]);
            }
        };
        window.siEl = function (id) {
            if (!window._speedInfoEls) window.cacheSpeedInfoElements();
            const cached = window._speedInfoEls && window._speedInfoEls[id];
            if (cached && cached.isConnected) return cached;
            const el = document.getElementById(id);
            if (window._speedInfoEls) window._speedInfoEls[id] = el;
            return el;
        };
        window.cacheSpeedInfoElements();
        updateTrackingSectionVisibility();

        if (window.SpeedrunMod) {
            const speedrunControls = document.getElementById("speedrun-controls-section");
            if (speedrunControls) {
                speedrunControls.innerHTML = `
        <span class="si-section-title">Controls</span>
        <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="SpeedrunSpeedInfo">
        <label class="form-check-label" for="SpeedrunSpeedInfo">Show Speed Info</label>
        </div>
        <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" data-speedrun-topbar>
        <label class="form-check-label" data-speedrun-topbar-label>Top Bar Icons</label>
        </div>
        <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="SpeedrunFpsCounter">
        <label class="form-check-label" for="SpeedrunFpsCounter">FPS Counter</label>
        </div>
        <button type="button" class="btn si-btn si-btn-block" id="ResetKeybind">Reset Key: Shift</button>
        <button type="button" class="btn si-btn si-btn-block" id="ExportBackup">Export backup</button>
        <div class="si-btn-row">
        <button type="button" class="btn si-btn" id="ImportMergeBackup">Import merge</button>
        <button type="button" class="btn si-btn" id="ImportReplaceBackup">Import replace</button>
        </div>
        <input type="file" id="PuddingBackupFile" accept="application/json,.json" style="display:none;">
                `;
                speedrunControls.style.display = "block";
            }
            const speedrunTopbar = speedinfoBox.querySelector("[data-speedrun-topbar]");
            if (speedrunTopbar) speedrunTopbar.id = "TopBarIcons";
            const speedrunTopbarLabel = speedinfoBox.querySelector("[data-speedrun-topbar-label]");
            if (speedrunTopbarLabel) speedrunTopbarLabel.setAttribute("for", "TopBarIcons");
            if (typeof window.setup_topbar_checkbox === "function") {
                window.setup_topbar_checkbox();
            }
            const speedInfoCb = document.getElementById("SpeedrunSpeedInfo");
            if (speedInfoCb) {
                speedInfoCb.checked = !!window.pudding_settings.SpeedInfo;
                speedInfoCb.addEventListener("change", window.ToggleSpeedInfo);
            }
            if (typeof window.FpsCounterBindCheckbox === "function") {
                window.FpsCounterBindCheckbox(document.getElementById("SpeedrunFpsCounter"));
            }
            if (typeof window.wirePuddingBackupButtons === "function") {
                window.wirePuddingBackupButtons({
                    exportBtn: document.getElementById("ExportBackup"),
                    mergeBtn: document.getElementById("ImportMergeBackup"),
                    replaceBtn: document.getElementById("ImportReplaceBackup"),
                    fileInput: document.getElementById("PuddingBackupFile"),
                });
            }
        }

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
        if (typeof window.saveSettings === "function") window.saveSettings();
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
        if (isTabHidden()) {
            window.markSpeedInfoDirty();
            return Promise.resolve();
        }
        if (typeof window.SpeedInfoIsVisible === "function" && !window.SpeedInfoIsVisible()) {
            window._speedInfoNeedsRefresh = true;
            return Promise.resolve();
        }
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

    // Mid-run: update one personal PB/HS row without rebuilding SRC / mode labels
    window.SpeedInfoPaintPersonalRow = function (score) {
        if (isTabHidden()) {
            window.markSpeedInfoDirty();
            return;
        }
        if (typeof window.SpeedInfoIsVisible === "function" && !window.SpeedInfoIsVisible()) {
            window._speedInfoNeedsRefresh = true;
            return;
        }
        if (!window.timeKeeper || window.daily_challenge) return;
        if (!window._speedInfoGoldCache) window._speedInfoGoldCache = {};

        const midRun =
            (window.timeKeeper.runStarted || window.timeKeeper.playing) &&
            typeof window.timeKeeper.mode === "string" &&
            typeof window.timeKeeper.count === "number";

        let modeKey;
        let count;
        let speed;
        let size;
        let mode = window.CurrentModeNum;
        if (midRun) {
            modeKey = window.timeKeeper.mode;
            count = window.timeKeeper.count;
            speed = window.timeKeeper.speed;
            size = window.timeKeeper.size;
        } else {
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

        const scoreKey = String(score);
        const bold = typeof window.siEl === "function"
            ? window.siEl(scoreKey === "ALL" ? "ALL" : scoreKey)
            : document.getElementById(scoreKey === "ALL" ? "ALL" : scoreKey);
        if (!bold) return;

        const name = scoreKey + "-" + modeKey + "-" + count + "-" + speed + "-" + size;
        const fmt = window.timeKeeper.formatDisplayTime
            ? window.timeKeeper.formatDisplayTime.bind(window.timeKeeper)
            : window.timeKeeper.formatTimeSrcStyle
              ? window.timeKeeper.formatTimeSrcStyle.bind(window.timeKeeper)
              : function (ms) {
                    return String(ms);
                };

        if (scoreKey === "att") {
            const totalAttempts =
                typeof window.timeKeeper.getAttemptTotal === "function"
                    ? window.timeKeeper.getAttemptTotal(storage[name])
                    : typeof storage[name] === "number"
                      ? storage[name]
                      : 0;
            const next = "Total Attempts: " + totalAttempts;
            if (bold.textContent !== next) bold.textContent = next;
            return;
        }

        if (scoreKey !== "H" && !shouldShowCategory(scoreKey === "ALL" ? "All" : scoreKey, size, mode)) {
            if (bold.innerHTML !== "") bold.innerHTML = "";
            return;
        }

        const gen = (window._speedInfoUpdateGen = (window._speedInfoUpdateGen || 0) + 1);

        function queueGoldJob(scoreId, labelPrefix, displayText, pb, gKey) {
            if (typeof window._speedInfoGoldCache[gKey] === "boolean") return;
            setTimeout(function () {
                if (gen !== window._speedInfoUpdateGen) return;
                if (isTabHidden()) {
                    window.markSpeedInfoDirty();
                    return;
                }
                shouldGoldPb(scoreId, mode, count, speed, size, pb, modeKey).then(function (gold) {
                    if (gen !== window._speedInfoUpdateGen) return;
                    rememberGoldCache(gKey, gold, modeKey, count, speed, size, scoreId);
                    const el = siEl(scoreId);
                    if (!el) return;
                    el.innerHTML =
                        labelPrefix +
                        pbValueHtml(displayText, scoreId, mode, count, speed, size, !!gold);
                });
            }, 0);
        }

        if (scoreKey === "H") {
            if (typeof storage[name] != "undefined" && storage[name].high != null) {
                const highText = String(storage[name].high) + " Apples";
                const gKey = goldCacheKey(modeKey, count, speed, size, "H", highText);
                const allowGold = canGoldHighscore(mode, count, speed, size);
                const knownGold = allowGold && window._speedInfoGoldCache[gKey];
                bold.innerHTML =
                    "Highscore: " +
                    pbValueHtml(highText, "H", mode, count, speed, size, !!knownGold);
                if (allowGold) {
                    queueGoldJob("H", "Highscore: ", highText, storage[name], gKey);
                }
            } else if (bold.textContent !== "Highscore: None") {
                bold.textContent = "Highscore: None";
            }
            return;
        }

        const label = scoreKey === "ALL" ? "All Apples" : scoreKey + " Apples";
        if (typeof storage[name] != "undefined" && storage[name].time != null) {
            const displayText = fmt(storage[name].time);
            const gKey = goldCacheKey(modeKey, count, speed, size, scoreKey, displayText);
            const knownGold = window._speedInfoGoldCache[gKey];
            bold.innerHTML =
                label +
                ": " +
                pbValueHtml(displayText, scoreKey, mode, count, speed, size, !!knownGold);
            queueGoldJob(scoreKey, label + ": ", displayText, storage[name], gKey);
        } else {
            const noneText = label + ": None";
            if (bold.textContent !== noneText) bold.textContent = noneText;
        }
    };

    async function runSpeedInfoUpdate() {
        if (isTabHidden()) {
            window.markSpeedInfoDirty();
            return;
        }
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

        pruneSpeedInfoGoldCache(modeKey, count, speed, size);

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

        mode_label = typeof window.siEl === "function"
            ? window.siEl("mode-selected")
            : document.getElementById("mode-selected");
        mode_label2 = typeof window.siEl === "function"
            ? window.siEl("mode-selected2")
            : document.getElementById("mode-selected2");

        if (window.daily_challenge) {
            if (mode_label) mode_label.textContent = "Daily Challenge";
            if (mode_label2) mode_label2.textContent = "(TimeKeeper disabled)";
            for (const score of ["att", "25", "50", "100", "ALL", "H"]) {
                const el = typeof window.siEl === "function"
                    ? window.siEl(score)
                    : document.getElementById(score);
                if (el) el.textContent = "";
            }
            updateSrcAndTrackingVisibility();
            return;
        }

        updateSrcAndTrackingVisibility();

        if (mode_label) {
            mode_label.textContent =
                gamemode +
                ", " +
                window.HandleCount(count).substring(0, window.HandleCount(count).lastIndexOf(","));
        }
        if (mode_label2) {
            mode_label2.textContent = window.HandleSpeed(speed) + window.HandleSize(size);
        }

        const fmt = window.timeKeeper.formatDisplayTime
            ? window.timeKeeper.formatDisplayTime.bind(window.timeKeeper)
            : window.timeKeeper.formatTimeSrcStyle
              ? window.timeKeeper.formatTimeSrcStyle.bind(window.timeKeeper)
              : function (ms) {
                    return String(ms);
                };

        const goldJobs = [];

        for (const score of ["att", "25", "50", "100", "ALL", "H"]) {
            const name = score + "-" + modeKey + "-" + count + "-" + speed + "-" + size;
            const bold = typeof window.siEl === "function"
                ? window.siEl(score)
                : document.getElementById(score);
            if (!bold) continue;

            if (score == "att") {
                const totalAttempts =
                    typeof window.timeKeeper.getAttemptTotal === "function"
                        ? window.timeKeeper.getAttemptTotal(storage[name])
                        : typeof storage[name] === "number"
                          ? storage[name]
                          : 0;
                const next = "Total Attempts: " + totalAttempts;
                if (bold.textContent !== next) bold.textContent = next;
                continue;
            }

            // Match SRC visibility (100/YY50); Highscore always shown locally
            if (!shouldShowCategory(score === "ALL" ? "All" : score, size, mode)) {
                if (bold.textContent !== "") bold.textContent = "";
                continue;
            }

            if (score == "H") {
                if (typeof storage[name] != "undefined" && storage[name].high != null) {
                    const highText = String(storage[name].high) + " Apples";
                    const gKey = goldCacheKey(modeKey, count, speed, size, "H", highText);
                    const allowGold = canGoldHighscore(mode, count, speed, size);
                    const knownGold = allowGold && window._speedInfoGoldCache[gKey];
                    bold.innerHTML =
                        "Highscore: " +
                        pbValueHtml(highText, "H", mode, count, speed, size, !!knownGold);
                    if (allowGold && typeof window._speedInfoGoldCache[gKey] !== "boolean") {
                        goldJobs.push({
                            score: "H",
                            elId: "H",
                            labelPrefix: "Highscore: ",
                            displayText: highText,
                            pb: storage[name],
                            gKey: gKey,
                        });
                    }
                } else if (bold.textContent !== "Highscore: None") {
                    bold.textContent = "Highscore: None";
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
                if (typeof knownGold !== "boolean") {
                    goldJobs.push({
                        score: score,
                        elId: score,
                        labelPrefix: label + ": ",
                        displayText: displayText,
                        pb: storage[name],
                        gKey: gKey,
                    });
                }
            } else {
                const noneText = label + ": None";
                if (bold.textContent !== noneText) bold.textContent = noneText;
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
            if (isTabHidden()) {
                window.markSpeedInfoDirty();
                return;
            }
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
                    if (isTabHidden()) {
                        window.markSpeedInfoDirty();
                        return;
                    }
                    for (let i = 0; i < results.length; i++) {
                        const r = results[i];
                        rememberGoldCache(
                            r.job.gKey,
                            r.gold,
                            goldModeKey,
                            goldCount,
                            goldSpeed,
                            goldSize,
                            r.job.score
                        );
                        const el = typeof window.siEl === "function"
                            ? window.siEl(r.job.elId)
                            : document.getElementById(r.job.elId);
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
                    pruneSpeedInfoGoldCache(goldModeKey, goldCount, goldSpeed, goldSize);
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

    const settings_refresh =
        'queueMicrotask(function(){window.SpeedInfoUpdate().catch(function(e){console.error("SpeedInfoUpdate error:",e);});window.getAllSrc().catch(function(e){console.error("getAllSrc error:",e);});if(typeof window.apply_topbar_icons==="function")window.apply_topbar_icons();});';

    count_regex = new RegExp(/case "count"\:/);
    code = code.assertReplace(count_regex, 'case "count":' + settings_refresh);

    speed_regex = new RegExp(/case "speed"\:/);
    code = code.assertReplace(speed_regex, 'case "speed":' + settings_refresh);

    size_regex = new RegExp(/case "size"\:/);
    code = code.assertReplace(size_regex, 'case "size":' + settings_refresh);

    return code;
}
window.ResetKey = {}

window.ResetKey.make = function (){
  // Persist Shift default so alterCode keydown matches UI / docs
  let keybinds = {};
  try {
    keybinds = JSON.parse(localStorage.getItem("keybinds")) || {};
  } catch (e) {
    keybinds = {};
  }
  if (!keybinds.resetKey) {
    keybinds.resetKey = "Shift";
    localStorage.setItem("keybinds", JSON.stringify(keybinds));
  }

  function setupKeybindPicker(buttonId, keybindType) {
      const buttons = document.querySelectorAll("#" + buttonId);
      if (!buttons.length) return;
      if (!keybinds[keybindType]) {
          keybinds[keybindType] = "Shift";
          localStorage.setItem("keybinds", JSON.stringify(keybinds));
      }
      const label = `Reset Key: ${keybinds[keybindType]}`;
      buttons.forEach(function (button) {
          button.textContent = label;
          button.addEventListener("click", function () {
              buttons.forEach(function (b) {
                  b.textContent = "Press any key...";
              });
              document.addEventListener("keydown", function handler(e) {
                  keybinds[keybindType] = e.key;
                  const next = `Reset Key: ${e.key}`;
                  buttons.forEach(function (b) {
                      b.textContent = next;
                  });
                  localStorage.setItem("keybinds", JSON.stringify(keybinds));
                  document.removeEventListener("keydown", handler);
              });
          });
      });
  }

  // Apply to each bind
  setupKeybindPicker("ResetKeybind", "resetKey");
}

window.ResetKey.alterCode = function(code){
  if (window.SpeedrunMod) {
    const keyHandler =
      /([a-zA-Z0-9_$]{1,8})\(a\)\{if\(!this\.closed\)\{var b=\s*a\.VTa\?a\.Qh:void 0/;
    code = code.assertReplace(
      keyHandler,
      "$1(a){if(!this.closed){var _ae=document.activeElement;if(_ae&&(_ae.tagName==='INPUT'||_ae.tagName==='TEXTAREA'||_ae.tagName==='SELECT'||_ae.isContentEditable))return;var b= a.VTa?a.Qh:void 0"
    );
  }

  function isTypingInField() {
    const ae = document.activeElement;
    return !!(
      ae &&
      (ae.tagName === "INPUT" ||
        ae.tagName === "TEXTAREA" ||
        ae.tagName === "SELECT" ||
        ae.isContentEditable)
    );
  }

  document.addEventListener('keydown', function(e){
    let keybinds = {};
    try {
      keybinds = JSON.parse(localStorage.getItem("keybinds")) || {};
    } catch (err) {
      keybinds = {};
    }
    const resetKey = keybinds.resetKey || "Shift";
    const resetButtons = document.querySelectorAll("#ResetKeybind");
    let isSettingKeybind = false;
    resetButtons.forEach(function (btn) {
      if (btn.textContent === "Press any key...") isSettingKeybind = true;
    });
    const dialogActive = window.timeKeeper && window.timeKeeper.dialogActive;
    if(!(isSettingKeybind || isTypingInField() || dialogActive || document.getElementById('edit-box'))){
        if(e.key === resetKey){
            const keydownEvent = new KeyboardEvent('keydown', {
                keyCode: 27
            });
            document.dispatchEvent(keydownEvent);
            const playBtn = document.querySelector('[jsname="NSjDf"]');
            if (playBtn) playBtn.click();
        }
    }
  });
  return code
}
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

  window.loadSpeedrunSettings = function () {
    let settings = null;
    try {
      const raw = localStorage.getItem("PuddingSettings");
      if (raw) settings = JSON.parse(raw);
    } catch (e) {
      settings = null;
    }
    if (!settings || typeof settings !== "object") {
      settings = {};
    }
    if (typeof settings.TopBar !== "boolean") settings.TopBar = true;
    if (typeof settings.SpeedInfo !== "boolean") settings.SpeedInfo = true;
    if (typeof settings.ShowWrHolders !== "boolean") settings.ShowWrHolders = true;
    if (typeof settings.TrackedPlayerName !== "string") settings.TrackedPlayerName = "";
    if (typeof settings.FpsCounter !== "boolean") settings.FpsCounter = false;
    return settings;
  };

  window.pudding_settings = window.loadSpeedrunSettings();

  window.saveSettings = function () {
    const s = window.pudding_settings;
    if (s && typeof s === "object") {
      localStorage.setItem("PuddingSettings", JSON.stringify(s));
    }
  };

  window.Libraries = [
    "Core",
    "Theme",
    "SpeedrunCss",
    "ModeRegistry",
    "TimeKeeper",
    "TopBar",
    "Backup",
    "FpsCounter",
    "SpeedInfo",
    "ResetKey",
  ];
  console.log("Enabling Speedrun Mod");

  libUrlPrefix = window.NepDebug
    ? "http://127.0.0.1:5500/Libraries/"
    : "../../mods/DarkSnakeGang/GoogleSnakePudding/main/Libraries/";
  window.Libraries.forEach((LibName) => {
    console.log("Loading library: " + LibName);
    try {
      if (!window[LibName] && typeof window.loadCode === "function") {
        window.loadCode(libUrlPrefix + LibName + ".js");
      }
      eval("window." + LibName + ".make();");
    } catch (e) {
      console.error("Library failed: " + LibName, e);
    }
  });

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
  modIndicator.textContent = "Speedrun Mod v13";
  let canvasNode = document.getElementsByClassName("jNB0Ic")[0];
  document.getElementsByClassName("EjCLSb")[0].insertBefore(modIndicator, canvasNode);

  if (window.pudding_settings && window.pudding_settings.SpeedInfo && typeof window.SpeedInfoShow === "function") {
    window.SpeedInfoShow();
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
