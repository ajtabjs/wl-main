window.GraphicsMix = {};

window.GraphicsMix.make = function () {

    window.nativeGraphicsCount = 4;

    window.puddingMixStyle = function (g) {
        if (typeof g !== "number") g = window.graphics_selected;
        const n = window.nativeGraphicsCount || 4;
        const pools = {};
        pools[n - 1] = [0, 1, 2];
        pools[n] = [0, 1];
        pools[n + 1] = [1, 2];
        pools[n + 2] = [0, 2];
        const pool = pools[g];
        if (!pool) return g;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    // Left half of A | right half of B. CSS split so it works even when canvas is CORS-tainted.
    function makeSplitIcon(leftSrc, rightSrc) {
        const wrap = document.createElement("div");
        wrap.classList.add("DqMRee");
        wrap.classList.add("SsAred");
        wrap.style.position = "relative";
        wrap.style.overflow = "hidden";
        wrap.style.display = "inline-block";
        wrap.style.verticalAlign = "top";

        const leftClip = document.createElement("div");
        leftClip.style.cssText = "position:absolute;left:0;top:0;width:50%;height:100%;overflow:hidden;";
        const leftImg = document.createElement("img");
        leftImg.src = leftSrc;
        leftImg.alt = "";
        leftImg.style.cssText = "position:absolute;left:0;top:0;height:100%;width:200%;max-width:none;object-fit:cover;object-position:left center;pointer-events:none;";
        leftClip.appendChild(leftImg);

        const rightClip = document.createElement("div");
        rightClip.style.cssText = "position:absolute;left:50%;top:0;width:50%;height:100%;overflow:hidden;";
        const rightImg = document.createElement("img");
        rightImg.src = rightSrc;
        rightImg.alt = "";
        rightImg.style.cssText = "position:absolute;right:0;top:0;height:100%;width:200%;max-width:none;object-fit:cover;object-position:right center;pointer-events:none;";
        rightClip.appendChild(rightImg);

        wrap.appendChild(leftClip);
        wrap.appendChild(rightClip);
        return wrap;
    }

    window.appendPairGraphicsIcons = function () {
        if (window._puddingPairGraphicsAdded) return true;
        const row = document.querySelector("#graphics");
        if (!row || !row.children || row.children.length < 3) return false;

        window.nativeGraphicsCount = row.children.length;
        const srcs = [row.children[0].src, row.children[1].src, row.children[2].src];
        const pairs = [[0, 1], [1, 2], [0, 2]];
        for (let i = 0; i < pairs.length; i++) {
            row.appendChild(makeSplitIcon(srcs[pairs[i][0]], srcs[pairs[i][1]]));
        }
        window._puddingPairGraphicsAdded = true;
        return true;
    };

    function tryAppend(attemptsLeft) {
        try {
            if (window.appendPairGraphicsIcons()) return;
        } catch (e) {
            console.error("[GraphicsMix] append failed", e);
        }
        if (attemptsLeft <= 0) return;
        setTimeout(function () { tryAppend(attemptsLeft - 1); }, 100);
    }

    tryAppend(50);
}

window.GraphicsMix.alterCode = function (code) {

    const mixPicker = new RegExp(
        /function\(\)\{(?:var|let|const) [a-zA-Z0-9_$]{1,8}=\[0,1,2\];return [a-zA-Z0-9_$]{1,8}\[Math\.floor\(Math\.random\(\)\*[a-zA-Z0-9_$]{1,8}\.length\)\]\}/
    );
    catchError(mixPicker, code);
    code = code.assertReplace(mixPicker, "function(){return window.puddingMixStyle(window.graphics_selected)}");

    const mixAssign = new RegExp(
        /[a-zA-Z0-9_$]{1,8}:[a-zA-Z0-9_$]{1,8}\.settings\.([a-zA-Z0-9_$]{1,8})===3\?[a-zA-Z0-9_$]{1,8}\(\):void 0/
    );
    catchError(mixAssign, code);
    const gfxField = code.match(mixAssign)[1];

    const mixCheck = new RegExp(`\\.settings\\.${gfxField}===3`, "g");
    catchError(mixCheck, code);
    code = code.assertReplaceAll(mixCheck, `.settings.${gfxField}>=3`);

    return code;
}
