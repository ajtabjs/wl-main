window.Counter = {};

window.Counter.make = function () {
    window.defaultGoldenFruitStats = function () {
        return {
            apple: 0,
            cherry: 0,
            strawberry: 0,
            carrot: 0,
            watermelon: 0,
        };
    };

    window.ensureGoldenFruitStats = function (s) {
        if (!s.goldenFruit || typeof s.goldenFruit !== "object") {
            s.goldenFruit = window.defaultGoldenFruitStats();
        }
        const keys = ["apple", "cherry", "strawberry", "carrot", "watermelon"];
        for (let i = 0; i < keys.length; i++) {
            if (typeof s.goldenFruit[keys[i]] !== "number") s.goldenFruit[keys[i]] = 0;
        }
        return s;
    };

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
                },
                goldenFruit: window.defaultGoldenFruitStats(),
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

        window.ensureGoldenFruitStats(stats);

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
            window.ensureGoldenFruitStats(stats);
            localStorage.setItem('inputCounterMod', JSON.stringify(stats));
        }
    }

    window.renderGoldenFruitCounter = function () {
        if (typeof divList === "undefined" || !divList) return;
        window.ensureGoldenFruitStats(stats);
        const meta = window.GOLDEN_FRUIT_META || [];
        let html = '<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">';
        for (let i = 0; i < meta.length; i++) {
            const key = meta[i].key;
            const icon = meta[i].icon;
            const n = stats.goldenFruit[key] || 0;
            // Always show golden apple; hide other golds at 0
            if (n === 0 && key !== "apple") continue;
            html +=
                '<span style="display:inline-flex;align-items:center;gap:2px;">' +
                '<img src="' + icon + '" width="18" height="18" style="image-rendering:auto;vertical-align:middle;" alt="">' +
                '<span>' + n + "</span></span>";
        }
        html += "</span>";
        return html;
    };

    window.renderPlainCounter = function () {
        const iconSrc = typeof getStatIconImageSrc === "function"
            ? getStatIconImageSrc()
            : "";
        const next = String(stats[stats.statShown][stats.statDurationShown]);
        return (
            '<span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">' +
            '<img src="' + iconSrc + '" width="18" height="18" style="image-rendering:auto;vertical-align:middle;" alt="">' +
            "<span>" + next + "</span></span>"
        );
    };

    window.updateCounterDisplay = function () {
        if (typeof divList === "undefined" || !divList) return;
        const html =
            stats.statShown === "goldenFruit"
                ? window.renderGoldenFruitCounter()
                : window.renderPlainCounter();
        if (divList.dataset.counterHtml === html) return;
        divList.dataset.counterHtml = html;
        divList.innerHTML = html;
        // Same layout for every counter mode (matches golden-fruit placement)
        divList.style.width = "auto";
        divList.style.minWidth = "25px";
        const icon = document.getElementById("stat-icon");
        if (icon) icon.style.display = "none";
    };

    window.recordGoldenFruit = function (offset) {
        if (typeof stats === "undefined") return;
        window.ensureGoldenFruitStats(stats);
        const meta = window.GOLDEN_FRUIT_META || [];
        const entry = meta[offset];
        if (!entry) return;
        stats.goldenFruit[entry.key] = (stats.goldenFruit[entry.key] || 0) + 1;
        saveStatistics();
        if (stats.statShown === "goldenFruit") updateCounterDisplay();
    };

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
                },
                goldenFruit: window.defaultGoldenFruitStats(),
            };
            stats.walls = { game: 0 };
            stats.hide = { count: "" };
            saveStatistics();
            updateCounterDisplay();
            alert('All stats have been reset');
        } else {
            alert('Did not reset all stats');
        }
    }

    window.promptToEditStatCount = function () {
        if (stats.statShown === 'hide' || stats.statShown === 'walls' || stats.statShown === 'goldenFruit') {
            alert(`Not changing stat for "hide", "walls", or "golden fruit"`)
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
                return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9btSKVDgYp4pChOtlFRRylikWwUNoKrTqYXPoFTRqSFBdHwbXg4Mdi1cHFWVcHV0EQ/ABxdXFSdJES/5cUWsR4cNyPd/ced+8Af7PKVLNnDlA1y0gn4mIuvyoGX9EHAcOIICwxU09mFrPwHF/38PH1LsazvM/9OQaVgskAn0g8x3TDIt4gntm0dM77xAIrSwrxOfGEQRckfuS67PIb55LDfp4pGNn0PLFALJa6WO5iVjZU4mniqKJqlO/Puaxw3uKsVuusfU/+wlBBW8lwneYoElhCEimIkFFHBVVYiNGqkWIiTftxD/+I40+RSyZXBYwcC6hBheT4wf/gd7dmcWrSTQrFgd4X2/4YA4K7QKth29/Htt06AQLPwJXW8deawOwn6Y2OFj0CwtvAxXVHk/eAyx0g8qRLhuRIAZr+YhF4P6NvygNDt8DAmttbex+nD0CWulq+AQ4OgfESZa97vLu/u7d/z7T7+wGU4HK0eqYBnAAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+cGFBYZAWMC8r4AAABWSURBVHja7cExAQAAAMKg9U9tDB+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4G8AjwABivmCPgAAAABJRU5ErkJggg=="
            case 'walls':
                return "https://www.google.com/logos/fnbx/snake_arcade/v16/trophy_01.png"
            case 'apples':
                return "https://www.google.com/logos/fnbx/snake_arcade/v3/apple_00.png"
            case 'plays':
                return "https://fonts.gstatic.com/s/i/googlematerialicons/play_arrow/v6/white-24dp/2x/gm_play_arrow_white_24dp.png"
            case 'goldenFruit':
                return "data:image/png;base64,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"
            default:
                return "https://www.google.com/logos/fnbx/snake_arcade/keys.svg"
        }
    }

    window.setCounter = function () {
        //stats.visible = !stats.visible;
        const icon = document.getElementById('stat-icon');
        const num = document.getElementById('counter-num');
        // Icon lives inside #counter-num for consistent placement across all modes
        if (icon) icon.style.display = 'none';
        if (stats.visible) {
            if (num) num.style.display = 'inherit';
        }
        else {
            if (num) num.style.display = 'none';
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

    // v12: let Ni=ucF(this.Ca,this.Sb(null,5));
    // v13: (h=p6E(a.Ca,a.Vb(null,5)))&&(...)
    const wall_spawn_let = /(?:let|const|var) ([a-zA-Z0-9_$]{1,8})=\n?[a-zA-Z0-9_$]{1,8}\(this\.[a-zA-Z0-9_$]{1,8},this\.[a-zA-Z0-9_$]{1,8}\(null,5\)\);/
    const wall_spawn_assign = /\(([a-zA-Z0-9_$]{1,8})=[a-zA-Z0-9_$]{1,8}\((?:this|a)\.[a-zA-Z0-9_$]{1,8},(?:this|a)\.[a-zA-Z0-9_$]{1,8}\(null,5\)\)\)/

    const wall_let_match = code.match(wall_spawn_let)
    if (wall_let_match) {
        catchError(wall_spawn_let, code)
        const wall_pos = wall_let_match[1]
        const wall_counter_code = `${wall_let_match[0]}
    if(${wall_pos}){stats.walls.game++;
    window.wallCoords.push([${wall_pos}.x, ${wall_pos}.y]);
    updateCounterDisplay();}
    `
        if (window.NepDebug) {
            console.log("Wall thing: " + wall_pos)
            console.log("Wall thing 2: " + wall_counter_code)
        }
        code = code.assertReplace(wall_spawn_let, wall_counter_code)
    } else {
        catchError(wall_spawn_assign, code)
        const wall_assign_match = code.match(wall_spawn_assign)
        const wall_pos = wall_assign_match[1]
        const inner = wall_assign_match[0].slice(1, -1)
        code = code.assertReplace(
            wall_spawn_assign,
            `(${inner},${wall_pos}&&(stats.walls.game++,window.wallCoords.push([${wall_pos}.x,${wall_pos}.y]),updateCounterDisplay()),${wall_pos})`
        )
    }
    

    // Matches https://darksnakegang.github.io/GoogleSnakeWallSolver/ sizes
    // (Normal/Standard 17×15, Small 10×9, Large 24×21).
    window.WALL_SOLVER_SIZES = {
        0: { width: 17, height: 15, cells: 255 }, // Normal / Standard
        1: { width: 10, height: 9, cells: 90 },   // Small
        2: { width: 24, height: 21, cells: 504 }, // Large
    };
    window.WALL_SOLVER_URL = "https://darksnakegang.github.io/GoogleSnakeWallSolver/";

    /** Canonical 0/1 bits for the Wall Solver (1 = wall, 0 = empty). */
    window.coordinatesToBoardString = function coordinatesToBoardString(coordinates) {
        const sizeIdx = window.timeKeeper && typeof window.timeKeeper.getCurrentSetting === "function"
            ? window.timeKeeper.getCurrentSetting("size")
            : -1;
        const dims = window.WALL_SOLVER_SIZES[sizeIdx];
        if (!dims) return false;

        const board = Array(dims.cells).fill("0");
        (coordinates || []).forEach(function (coord) {
            const x = coord[0];
            const y = coord[1];
            if (x < 0 || y < 0 || x >= dims.width || y >= dims.height) return;
            board[y * dims.width + x] = "1";
        });
        return board.join("");
    };

    window.openWallSolverForPattern = function openWallSolverForPattern(coordinates) {
        const bits = window.coordinatesToBoardString(coordinates);
        if (!bits) return false;
        const url = window.WALL_SOLVER_URL + "?board=" + encodeURIComponent(bits) + "&solve=1";
        window.open(url, "_blank", "noopener,noreferrer");
        return true;
    };

    let death_wall_icon = document.querySelector('[jsname="LpoWPe"]');
    if (death_wall_icon) {
        death_wall_icon.addEventListener("click", function () {
            window.openWallSolverForPattern(window.wallCoords);
        });
    }

    return code;
}
