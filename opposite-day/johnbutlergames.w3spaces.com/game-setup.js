/*
Copyright 2023 John Butler
All Rights Reserved
*/

var word = "", canvas, ctx, fps, lastTime = new Date().getTime();
function initialize() {
    document.title = title;

    document.body.style.backgroundColor = "rgb(50,50,50)";
    document.body.style.margin = 0;

    canvas = document.getElementById("canvas");
    canvas.style.backgroundColor = "white";
    canvas.style.margin = 0;
    canvas.style.position = "absolute";
    canvas.style.top = "50%";
    canvas.style.left = "50%";
    canvas.style["-ms-transform"] = "translate(-50%,-50%)";
    canvas.style.transform = "translate(-50%,-50%)";
    var ratio = dimensions.width / dimensions.height;
    var sizeText = "min(100vw,100vh)";
    if (ratio > 1) {
        sizeText = `min(${100 / ratio}vw,100vh)`;
        canvas.style.width = `calc(${sizeText} * ${ratio})`;
        canvas.style.height = sizeText;
    } else if (ratio < 1) {
        sizeText = `min(100vw,${100 * ratio}vh)`;
        canvas.style.width = sizeText;
        canvas.style.height = `calc(${sizeText} * ${1 / ratio})`;
    } else {
        canvas.style.width = sizeText;
        canvas.style.height = sizeText;
    }
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    ctx = canvas.getContext("2d");
    window.onmousemove = function (event) {
        var rect = canvas.getBoundingClientRect();
        Mouse.x = Math.min(Math.max((event.pageX - rect.x) / rect.width, 0), 1) * canvas.width;
        Mouse.y = Math.min(Math.max((event.pageY - rect.y) / rect.height, 0), 1) * canvas.height;
        Mouse.xmove += event.movementX * canvas.width / rect.width;
        Mouse.ymove += event.movementY * canvas.height / rect.height;
    }
    window.ontouchmove = function (event) {
        var rect = canvas.getBoundingClientRect();
        Mouse.x = Math.min(Math.max((event.touches[0].pageX - rect.x) / rect.width, 0), 1) * canvas.width;
        Mouse.y = Math.min(Math.max((event.touches[0].pageY - rect.y) / rect.height, 0), 1) * canvas.height;
    }
    window.onclick = function (event) {
        Mouse.click = true;
        Mouse.clickButtons[event.button] = true;
    }
    window.onmousedown = function (event) {
        Mouse.down = true;
        Mouse.downStart = true;
        Mouse.buttons[event.button] = true;
        Mouse.startButtons[event.button] = true;
    }
    window.ontouchstart = function (event) {
        Mouse.down = true;
        Mouse.downStart = true;
        var rect = canvas.getBoundingClientRect();
        Mouse.x = Math.min(Math.max((event.touches[0].pageX - rect.x) / rect.width, 0), 1) * canvas.width;
        Mouse.y = Math.min(Math.max((event.touches[0].pageY - rect.y) / rect.height, 0), 1) * canvas.height;
    }
    window.ontouchend = function (event) {
        Mouse.down = false;
        Mouse.click = true;
    }
    window.onmouseup = function (event) {
        Mouse.down = false;
        Mouse.buttons[event.button] = false;
        Mouse.clickButtons[event.button] = true;
        Mouse.click = true;
    }
    window.oncontextmenu = function (event) {
        event.preventDefault();
    }
    window.onwheel = function (event) {
        Mouse.scrollX = event.deltaX;
        Mouse.scrollY = event.deltaY;
    }
    window.onkeydown = function (event) {
        Keys.keys[event.keyCode] = true;
        Keys.down[event.keyCode] = true;
        word += String.fromCharCode(event.keyCode);
    }
    window.onkeyup = function (event) {
        Keys.keys[event.keyCode] = false;
        Keys.up[event.keyCode] = true;
    }

    Loading.loadLogoImage();
    Loading.loadImages();
    Loading.loadAudios();

    for (var key of Object.keys(Physics)) {
        this[key] = Physics[key];
    }

    ctx.roundRect = (x, y, w, h, r, b) => {
        if(!b) ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arc(x + w - r, y + r, r, 1.5 * Math.PI, 2 * Math.PI);
        ctx.lineTo(x + w, y + h - r);
        ctx.arc(x + w - r, y + h - r, r, 0 * Math.PI, 0.5 * Math.PI);
        ctx.lineTo(x + r, y + h);
        ctx.arc(x + r, y + h - r, r, 0.5 * Math.PI, Math.PI);
        ctx.lineTo(x, y + r);
        ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
    }
}
var Loading = {
    animation: 0,
    loads: 0,
    loaded: false,
    intro: 1,
    logoImage: false,
    percent: 0,
    loadImages: function () {
        for (var n in images) {
            var image = document.createElement("img");
            image.src = images[n];
            image.onload = function () {
                Loading.loads++;
            }
            images[n] = image;
        }
    },
    loadAudios: function () {
        for (var n in audios) {
            var audio = document.createElement("audio");
            audio.src = audios[n];
            audio.oncanplaythrough = function () {
                Loading.loads++;
            }
            audios[n] = audio;
        }
    },
    loadLogoImage: function () {
        this.logoImage = document.createElement("img");
        this.logoImage.src = "johnbutlergames.w3spaces.com/logoLarge.png";
        this.logoImage.onload = function () {
            Loading.loads++;
        }
    },
    updateLoadingScreen: function () {
        var s = Math.min(dimensions.width, dimensions.height) / 500;
        var percent = this.loads / (Object.keys(images).length + Object.keys(audios).length + 1);
        this.percent = this.percent * 0.9 + percent * 0.1;
        ctx.save();
        ctx.translate(dimensions.width / 2, dimensions.height / 2);
        ctx.scale(s, s);
        ctx.translate(-250, -250);
        if (percent == 1) {
            var a = 1 - this.percent * (Object.keys(images).length + Object.keys(audios).length + 1) + this.loads - 1;
            ctx.globalAlpha = a;
        }
        ctx.fillStyle = "black";
        ctx.fillRect(45, 270, 410, 15);
        ctx.fillStyle = "blue";
        ctx.fillRect(47.5, 272.5, 405 * this.percent, 10);
        ctx.beginPath();
        ctx.rect(47.5, 272.5, 405 * this.percent, 10);
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "rgb(255,100,0)";
        var a = this.animation / 2 % 40;
        for (var n = 0; n < 40; n++) {
            ctx.beginPath();
            ctx.moveTo(n * 20 + a + 5, 272.5);
            ctx.lineTo(n * 20 + a + 12.5, 272.5);
            ctx.lineTo(n * 20 + a + 7.5, 282.5);
            ctx.lineTo(n * 20 + a, 282.5);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.font = "30px Arial";
        ctx.fillText("Loading...", 250, 250);
        ctx.restore();

        this.animation++;
        if (percent == 1 && this.percent > 0.99) this.loaded = true;
    },
    updateIntro: function () {
        var s = Math.min(dimensions.width, dimensions.height) / 500;
        var i = Math.min(Physics.easeInOut(this.intro / 100), Physics.easeInOut((250 - this.intro) / 100));
        var i2 = Math.min(Physics.easeInOut(this.intro / 50), Physics.easeInOut((250 - this.intro) / 50));
        ctx.save();
        ctx.translate(dimensions.width / 2, dimensions.height / 2);
        ctx.scale(s * i2, s * i2);
        ctx.translate(-250, -250);
        ctx.globalAlpha = i;
        ctx.drawImage(this.logoImage, 0, 0, 500, 500);
        ctx.restore();

        this.intro++;
        if (this.intro == 300) this.intro = 0;
    }
}
var Mouse = {
    x: 0,
    y: 0,
    xmove: 0,
    ymove: 0,
    down: false,
    downStart: false,
    click: false,
    buttons: [],
    startButtons: [],
    clickButtons: [],
    scrollX: 0,
    scrollY: 0,
    inBox: function (x, y, w, h) { return this.x > x && this.x < x + w && this.y > y && this.y < y + h },
    clickInBox: function (x, y, w, h) { return this.inBox(x, y, w, h) && this.click }
}
var Keys = {
    keys: [],
    down: [],
    up: []
}
var Physics = {
    dirTo: (x1, y1, x2, y2) => 90 + (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI),
    distToMove: (distance, direction) => ({ x: distance * Math.sin(direction * Math.PI / 180), y: -distance * Math.cos(direction * Math.PI / 180) }),
    distTo: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    rotate: (cx, cy, x, y, a) => ([a = Math.PI / 180 * a, { x: (Math.cos(a) * (x - cx)) + (Math.sin(a) * (y - cy)) + cx, y: (Math.cos(a) * (y - cy)) - (Math.sin(a) * (x - cx)) + cy }][1]),
    easeInOut: function (a) {
        a = 1.02 / (1 + 2.71828 ** (-10 * (a - 0.5))) - 0.007;
        return Math.min(Math.max(a, 0), 1);
    },
    blocksColliding: (b1, b2) => r(b1.x + b1.w) > r(b2.x) && r(b1.x) < r(b2.x + b2.w) && r(b1.y + b1.h) > r(b2.y) && r(b1.y) < r(b2.y + b2.h),
    blocksCollidingEdge: (b1, b2) => r(b1.x + b1.w) >= r(b2.x) && r(b1.x) <= r(b2.x + b2.w) && r(b1.y + b1.h) >= r(b2.y) && r(b1.y) <= r(b2.y + b2.h),
    blocksCollidingCorner: (b1, b2) => (b1.x + b1.w == b2.x || b2.x + b2.w == b1.x) && (b1.y + b1.h == b2.y || b2.y + b2.h == b1.y),
    r: n => Math.round(n * 10000) / 10000,
    easeInBack: function (a) {
        if (a < 0.5) {
            return easeInOut(a * 2);
        } else {
            return easeInOut((1 - a) * 2);
        }
    }
}
function updateBlocks(blocks, data = {}) {
    data.gravity = data.gravity || { x: 0, y: 0 };
    data.damping = data.damping || { x: 1, y: 1 };
    data.maxCollisions = data.maxCollisions || 100;

    function initBlock(block) {
        if (!block.initialized) {
            block.density = block.density || 1;
            block.mass = block.mass || block.w * block.h * block.density;
            block.bounce = { x: 1, y: 1 };
            block.move = block.move || { x: 0, y: 0 };
            block.static = block.static || false;
            block.resting = block.resting || { x: 0, y: 0 };
            block.last = block.last || { x: 0, y: 0 }
            block.initialized = true;
        }

        block.collided = false;
        if (!block.static) {
            if (!block.resting.x) {
                block.move.x *= data.damping.x;
                block.move.x += data.gravity.x;
            }
            if (!block.resting.y) {
                block.move.y *= data.damping.y;
                block.move.y += data.gravity.y;
            }
        }

        block.resting.x = false;
        block.resting.y = false;
        block.last.x = block.x;
        block.last.y = block.y;
    }

    function initialize() {
        for (var n in blocks) {
            blocks[n].id = n;
        }
        for (var block of blocks) {
            initBlock(block);
        }
    }

    function resolveCollision(b1, b2, a) {
        if ((b1.static || b1.resting[a]) && (b2.static || b2.resting[a])) return false;
        if (!(b2.static || b2.resting[a]) && (b1.static || b1.resting[a])) return resolveCollision(b2, b1, a);

        b1.collided = true;
        b2.collided = true;
        //blocks have collided

        var c1 = { x: b1.last.x + b1.w / 2, y: b1.last.y + b1.h / 2 };
        var c2 = { x: b2.last.x + b2.w / 2, y: b2.last.y + b2.h / 2 };
        //find centers

        var c = a;
        var dim = a == 'x' ? 'w' : 'h';

        if (b2.static || b2.resting[a]) {
            //static-dynamic collision
            if (c1[a] > c2[a]) {
                b1[a] = b2[a] + b2[dim];
            } else {
                b1[a] = b2[a] - b1[dim];
            }
            var avg = (b1.move[a] + b2.move[a]) / 2;
            b1.move[a] = avg;
            b1.resting[a] = true;
        } else {
            //dynamic-dynamic collision
            if (c1[a] > c2[a]) {
                var dist = b2[a] + b2[dim] - b1[a];
                b1[a] += dist / 2;
                b2[a] -= dist / 2;
            } else {
                var dist = b2[a] - b1[a] - b1[dim];
                b1[a] += dist / 2;
                b2[a] -= dist / 2;
            }
            var avg = (b1.move[a] + b2.move[a]) / 2;
            b1.move[a] = avg;
            b2.move[a] = avg;
        }
        return true;
    }

    function updateStaticAxis(a) {
        for (var block of blocks) {
            if (!block.static) continue;
            block[a] += block.move[a];
        }
    }

    function updateAxis(a) {
        for (var block of blocks) {
            if (block.static) continue;
            block[a] += block.move[a];
        }
        var n3 = 0;
        while (n3 < data.maxCollisions) {
            var collisions = false;
            for (var n = 0; n < blocks.length; n++) {
                var block = blocks[n];
                for (var n2 = n + 1; n2 < blocks.length; n2++) {
                    var block2 = blocks[n2];
                    if (blocksColliding(block, block2)) {
                        var x = resolveCollision(block2, block, a);
                        var y = resolveCollision(block, block2, a);
                        collisions = collisions || x || y;
                    }
                }
            }
            if (!collisions) break;
            n3++;
        }
    }

    initialize();
    updateStaticAxis("x");
    updateAxis("x");
    updateStaticAxis("y");
    updateAxis("y");
}
function joystick(x, y, r) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(200,200,200,0.8)";
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();

    var dirToMouse = dirTo(x, y, Mouse.x, Mouse.y);
    var distToMouse = distTo(x, y, Mouse.x, Mouse.y);
    ctx.strokeStyle = "black";
    ctx.fillStyle = "rgba(100,100,100,0.5)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    Keys.keys[37] = false;
    Keys.keys[65] = false;
    Keys.keys[39] = false;
    Keys.keys[68] = false;
    Keys.keys[38] = false;
    Keys.keys[87] = false;
    Keys.keys[40] = false;
    Keys.keys[83] = false;
    if (Mouse.down && distToMouse < r * 3) {
        var move = distToMove(Math.min(distToMouse, r / 2), dirToMouse);
        ctx.arc(x + move.x, y + move.y, r / 2, 0, 2 * Math.PI);

        move = distToMove(1, dirToMouse);
        if (move.x < -0.3) {
            Keys.keys[37] = true;
            Keys.keys[65] = true;
        }
        if (move.x > 0.3) {
            Keys.keys[39] = true;
            Keys.keys[68] = true;
        }
        if (move.y < -0.3) {
            Keys.keys[38] = true;
            Keys.keys[87] = true;
        }
        if (move.y > 0.3) {
            Keys.keys[40] = true;
            Keys.keys[83] = true;
        }
    } else {
        ctx.arc(x, y, r / 2, 0, 2 * Math.PI);
    }
    ctx.fill();
    ctx.stroke();
}
function turn(angle, targetAngle) {
    angle %= 360;
    targetAngle %= 360;
    if (angle < 0) {
        angle += 360;
    }
    if (targetAngle < 0) {
        targetAngle += 360;
    }
    var turnRight = targetAngle - angle;
    var turnLeft = targetAngle - angle;
    if (turnRight < 0) {
        turnLeft += 360;
    } else {
        turnLeft -= 360;
    }
    if (Math.abs(turnRight) < Math.abs(turnLeft)) {
        return turnRight;
    } else {
        return turnLeft;
    }
}
function distToSeg(x, y, x1, y1, x2, y2) {
    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;
    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) {
        param = dot / len_sq;
    }
    var xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}
function update() {
    var d = new Date().getTime();
    fps = Math.round(600 / (d - lastTime));
    lastTime = d;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (Loading.loaded) {
        if (Loading.intro) {
            Loading.updateIntro();
        } else {
            main();
        }
    } else {
        Loading.updateLoadingScreen();
    }
    Mouse.click = false;
    Mouse.downStart = false;
    Mouse.right = false;
    Mouse.startButtons = [];
    Mouse.clickButtons = [];
    Mouse.scrollX = 0;
    Mouse.scrollY = 0;
    Mouse.xmove = 0;
    Mouse.ymove = 0;
    Keys.down = [];
    Keys.up = [];
}