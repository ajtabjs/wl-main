var encodeChars = "abcdefghijklmnop"

function drawCompetetivePatchText() {
    if (competetivePatchText.length > 959) {
        ctx.fillStyle = "rgb(240,240,240)";
        ctx.fillRect(0, 480, 1000, 380);
        ctx.fillStyle = "red";
        ctx.font = "12px Courier New";
        ctx.textAlign = "left";
        var length = 137;
        for (var n = 0; n < 30; n++) {
            ctx.fillText(competetivePatchText.slice(length * n, length * (n + 1)), 5, 500 + 12 * n);
        }
    } else {
        ctx.fillStyle = "white";
        ctx.font = "12px Courier New";
        ctx.textAlign = "left";
        var length = 137;
        var rows = Math.ceil(competetivePatchText.length / 137);
        for (var n = 0; n < 7; n++) {
            ctx.fillText(competetivePatchText.slice(length * n, length * (n + 1)), 5, 993 - (rows - 1) * 12 + 12 * n);
        }
    }
}

var paragraph = document.createElement("p");
document.body.appendChild(paragraph);
paragraph.style.marginLeft = "10px";
paragraph.style.color = "white";

async function copyCompetetivePatchTextToClipboard() {
    try {
        await navigator.clipboard.writeText(competetivePatchText);
        window.alert("Competetive patch text copied!");
    } catch(err) {
        window.alert("Competetive patch text failed to copy! (Check website permissions) Text has been put in a paragraph element for you to copy :)");
        paragraph.innerHTML = competetivePatchText;
    }
}

function resetCompetetivePatchMovement() {
    movement = [];
    competetivePatchText = "";
}

var movement = [];
function competetivePatchMovementTrack() {
    movement.push({
        left: Keys.keys[37] || Keys.keys[65],
        right: Keys.keys[39] || Keys.keys[68],
        up: Keys.keys[37] || Keys.keys[68],
        down: Keys.keys[39] || Keys.keys[63]
    });
}

var competetivePatchText = "";
function generateCompetetivePatchText() {
    competetivePatchText = compressString(binaryToString(encodeToBinary(movement)));
    if(competetivePatchText.startsWith("a")) competetivePatchText = competetivePatchText.slice(1);
}

function decodeCompetetivePatchText(text) {
    if("1234567890".includes(text[0])) text = "a" + text;
    return decodeFromBinary(stringToBinary(decompressString(text)));
}

function encodeToBinary(m) {
    return m.map(e => {
        var s = "";
        s += e.left ? "1" : "0";
        s += e.right ? "1" : "0";
        s += e.up ? "1" : "0";
        s += e.down ? "1" : "0";
        return s;
    }).join("");
}

function decodeFromBinary(str) {
    var m = [];
    for (var n = 0; n < str.length; n += 4) {
        var left = str[n] === "1";
        var right = str[n + 1] === "1";
        var up = str[n + 2] === "1";
        var down = str[n + 3] === "1";
        m.push({ left: left, right: right, up: up, down: down });
    }
    return m;
}

function binaryToDec(bin) {
    return [...bin].map((e, i) => e === "1" ? 2 ** (3 - i) : 0).reduce((a, b) => a + b);
}

function decToBinary(dec) {
    return dec.toString(2).padStart(4, 0);
}

function binaryToString(bin) {
    var str = "";
    for (var n = 0; n < bin.length; n += 4) {
        str += encodeChars[binaryToDec(bin.slice(n, n + 4))];
    }
    return str;
}

function stringToBinary(str) {
    var bin = "";
    for (var char of str) {
        var i = encodeChars.indexOf(char);
        bin += decToBinary(i);
    }
    return bin;
}

function compressString(str) {
    var data = [];
    for (var char of str) {
        if (data.length == 0) data.push({ char: char, n: 0 });
        if (data[data.length - 1].char != char) data.push({ char: char, n: 0 });
        data[data.length - 1].n++;
    }
    return data.map(e => e.char + (e.n > 1 ? e.n : "")).reduce((a, b) => a + b, "");
}

function decompressString(str) {
    var res = "";
    for (var n = 0; n < str.length; n++) {
        var char = str[n];
        var numStr = "";
        for (var n2 = n + 1; n2 < str.length; n2++) {
            if (isNaN(Number(str[n2]))) break;
            numStr += str[n2];
        }
        if (numStr.length === 0) numStr = "1";
        var count = Number(numStr);
        res += char.repeat(count);
        n = n2 - 1;
    }
    return res;
}