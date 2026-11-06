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
