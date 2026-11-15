// Configuration object
var config = {
    yMoveIncrement: 0.08,
    xMoveIncrement: 0.15,
    xMoveDamping: 0.96,
    yMoveDamping: 0.98,
    yMoveRestingJump: -6,
    edgeYMove: 1 / 10000,
    levelWidth: 1000,
    levelHeight: 1000,
    levelOffset: 0.5,
    fastDescendMultiplier: 0, // New configuration for fast descending
    gravityDirection: 1 // 1 for down, -1 for up
};

function modifyPlayerDraw() {
    player.draw = function () {
        ctx.fillStyle = 'rgb(255,0,0)';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.w / 40, this.h / 40);
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.lineTo(34, 0);
        ctx.lineTo(40, 0);
        ctx.lineTo(36, 7);
        ctx.lineTo(40, 7);
        ctx.lineTo(36, 15);
        ctx.lineTo(36, 10);
        ctx.lineTo(32, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // Draw the lightning thing

        // Draw the original black fill
        ctx.fillStyle = 'rgb(0,0,0)';
        var dir = dirTo(0, 0, this.xmove, this.ymove);
        var speed = distTo(0, 0, this.xmove, this.ymove);
        speed = Math.min(speed, 5);
        var move = distToMove(speed, dir);

        ctx.beginPath();
        ctx.arc(move.x * 1.5 + this.x + this.w / 2 - 7, move.y * 2 + this.y + this.h / 2 - 7, 3.7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(move.x * 1.5 + this.x + this.w / 2 + 7, move.y * 2 + this.y + this.h / 2 - 7, 3.7, 0, 2 * Math.PI);
        ctx.fill();
    };
    console.log("Player's draw method modified.");
}

function modifyPlayerUpdate() {
    // Player update function
    player.update = function () {
        var n = 0;
        while (n < game.currentLevel.blocks.length) {
            var b = game.currentLevel.blocks[n];
            if (b.collide && b.type == 'lava') {
                if (blocksCollidingEdge(this, b)) {
                    player.die();
                }
            }
            n++;
        }
        // Check for lava collisions

        this.ymove += config.yMoveIncrement * config.gravityDirection;
        if (Keys.keys[37] || Keys.keys[65]) {
            if (game.switchKeys) {
                this.xmove += config.xMoveIncrement;
            } else {
                this.xmove -= config.xMoveIncrement;
            }
            this.moved = true;
        }
        if (Keys.keys[39] || Keys.keys[68]) {
            if (game.switchKeys) {
                this.xmove -= config.xMoveIncrement;
            } else {
                this.xmove += config.xMoveIncrement;
            }
            this.moved = true;
        }

        updateBlock(this, game.currentLevel.blocks);
        // Physics

        this.resting = false;
        this.wallJumpLeft = false;
        this.wallJumpRight = false;
        var n = 0;
        while (n < game.currentLevel.blocks.length) {
            var b = game.currentLevel.blocks[n];
            if (blocksCollidingEdge(this, b) && b.collide) {
                if (this.x >= b.x + b.w || this.x + this.w <= b.x) {
                    this.xmove = 0;
                }
                if (this.y + this.h <= b.y) {
                    if (this.x < b.x + b.w && this.x + this.w > b.x) {
                        this.resting = true;
                    }
                } else if (this.x < b.x + b.w && this.x + this.w > b.x) {
                    this.ymove = 1 / 10000;
                }
                if (this.x + this.w == b.x) {
                    this.wallJumpLeft = true;
                }
                if (this.x == b.x + b.w) {
                    this.wallJumpRight = true;
                }
            }
            n++;
        }

        // Wall jump logic
        if (config.wallJumpEnabled && (this.wallJumpLeft || this.wallJumpRight)) {
            if (Keys.keys[38] || Keys.keys[87]) { // Jump key pressed
                this.ymove = -5; // Apply upward impulse
                if (this.wallJumpLeft) {
                    this.xmove = -3; // Apply force to the left for wall jump left
                } else if (this.wallJumpRight) {
                    this.xmove = 3; // Apply force to the right for wall jump right
                }
            }
        }

        if (this.resting) {
            this.ymove = 0;
            if (game.switchKeys) {
                if (Keys.keys[40] || Keys.keys[83]) {
                    this.ymove = config.yMoveRestingJump * config.gravityDirection;
                    this.moved = true;
                }
            } else {
                if (Keys.keys[38] || Keys.keys[87]) {
                    this.ymove = config.yMoveRestingJump * config.gravityDirection;
                    this.moved = true;
                }
            }
        }

        // Fast descend (or ascend if gravity is reversed) when holding down (or up if switchKeys is active)
        if (game.switchKeys) {
            if (Keys.keys[38] || Keys.keys[87]) {
                this.ymove += config.yMoveIncrement * config.fastDescendMultiplier * config.gravityDirection;
            }
        } else {
            if (Keys.keys[40] || Keys.keys[83]) {
                this.ymove += config.yMoveIncrement * config.fastDescendMultiplier * config.gravityDirection;
            }
        }

        // Calculate player move

        this.xmove *= config.xMoveDamping;
        this.ymove *= config.yMoveDamping;
        // Dampen

        if (this.x < -this.w * config.levelOffset) {
            this.x += config.levelWidth;
            game.levelX--;
            game.refreshLevel();
        }
        if (this.x > config.levelWidth - this.w * config.levelOffset) {
            this.x -= config.levelWidth;
            game.levelX++;
            game.refreshLevel();
        }
        if (this.y < -this.h * config.levelOffset) {
            this.y += config.levelHeight;
            game.levelY--;
            game.refreshLevel();
        }
        if (this.y > config.levelHeight - this.h * config.levelOffset) {
            this.y -= config.levelHeight;
            game.levelY++;
            game.refreshLevel();
        }
        // Move player through level walls
    }
    console.log("Player update function modified");
}

function modifyPlayerDie() {
    player.die = function () {
        if (game.playerDead) return;
        game.playerDead = true;
        game.respawnTime = 150;

        // Create red explosion particles
        for (let n = 0; n < 20; n++) {
            const particle = {
                x: this.x + this.w / 2 - 5 + Math.random() * 10 - 5,
                y: this.y + this.h / 2 - 5 + Math.random() * 10 - 5,
                w: 10,
                h: 10,
                color: 'rgb(255,0,0)',
                alpha: 2,
                decay: 0.08 - Math.random() / 20,
                xmove: Math.random() * 30 - 15,
                ymove: Math.random() * 30 - 20
            };
            particles.particles.push(particle);
        }

        // Create black circle particles
        for (let n = 0; n < 2; n++) {
            const particle = {
                x: this.x + this.w / 2,
                y: this.y + this.h / 2,
                r: 5,
                w: 10,
                h: 10,
                color: 'black',
                shape: 'circle',
                alpha: 150,
                decay: 1,
                xmove: Math.random() * 7.5 * (n * 2 - 1),
                ymove: Math.random() * 15 - 10
            };
            particles.particles.push(particle);
        }
    };
    console.log("Player's die method modified.");
}

var isFirstOpen = true;

function toggleDebugMenu() {
    if (debugMenu.style.display == "none") {
        debugMenu.style.display = "block"
    } else {
        debugMenu.style.display = "none";
    }
}

document.addEventListener("keydown", function (event) {
    if (event.key === "`" || event.key === "k") {
        toggleDebugMenu();
        if (isFirstOpen) {
            modifyPlayerDraw();
            modifyPlayerDie();
            modifyPlayerUpdate();

            var welcomeBox = document.createElement("div");
            welcomeBox.style.backgroundColor = "#333"; // dark background
            welcomeBox.style.padding = "5px";
            welcomeBox.style.borderBottom = "1px solid #666"; // grey border
            welcomeBox.style.borderRadius = "5px";

            var logoImage = document.createElement("img");
            logoImage.src = "johnbutlergames.com/images/logo.png";
            logoImage.style.width = "20px";
            logoImage.style.height = "20px";
            logoImage.style.marginRight = "10px";
            welcomeBox.appendChild(logoImage);

            var welcomeText = document.createElement("span");
            welcomeText.textContent = "Script Made By ppougj";
            welcomeText.style.color = "#fff";
            welcomeText.style.fontSize = "14px";
            welcomeBox.appendChild(welcomeText);

            var closeButton = document.createElement("button");
            closeButton.textContent = "X";
            closeButton.style.float = "right";
            closeButton.style.fontSize = "12px";
            closeButton.style.padding = "5px";
            closeButton.style.border = "none";
            closeButton.style.backgroundColor = "#444";
            closeButton.style.color = "#fff";
            closeButton.style.cursor = "pointer";
            closeButton.addEventListener("click", function () {
                welcomeBox.style.display = "none";
            });
            welcomeBox.appendChild(closeButton);

            document.body.appendChild(welcomeBox);
            isFirstOpen = false;
        }
    }
});

// Add a container for the debug menu
var debugMenu = document.createElement("div");
debugMenu.style.position = "absolute";
debugMenu.style.top = "10px";
debugMenu.style.left = "10px";
debugMenu.style.fontSize = "16px";
debugMenu.style.color = "white";
debugMenu.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
debugMenu.style.padding = "10px";
debugMenu.style.borderRadius = "5px";
debugMenu.style.display = "none"; // Initially hidden
debugMenu.style.resize = "both"; // Make resizable
debugMenu.style.overflow = "auto"; // Add overflow for resizing
document.body.appendChild(debugMenu);

// Add a header for the debug menu (for dragging)
var debugMenuHeader = document.createElement("div");
debugMenuHeader.style.cursor = "move";
debugMenuHeader.style.backgroundColor = "#333";
debugMenuHeader.style.color = "#fff";
debugMenuHeader.style.padding = "5px";
debugMenuHeader.style.fontWeight = "bold";
debugMenuHeader.textContent = "Debug Menu";
debugMenu.appendChild(debugMenuHeader);

// Add elements for various debug information
var positionTracker = document.createElement("div");
positionTracker.textContent = "Position: (X: 0.000, Y: 0.000)";
debugMenu.appendChild(positionTracker);

var velocityTracker = document.createElement("div");
velocityTracker.textContent = "Velocity: (X: 0.000, Y: 0.000)";
debugMenu.appendChild(velocityTracker);

var chunkTracker = document.createElement("div");
chunkTracker.textContent = "Chunk: (X: 0, Y: 0)";
debugMenu.appendChild(chunkTracker);

var fpsTracker = document.createElement("div");
fpsTracker.textContent = "FPS: 0";
debugMenu.appendChild(fpsTracker);

var gameTimeTracker = document.createElement("div");
gameTimeTracker.textContent = "Game Time: 0s";
debugMenu.appendChild(gameTimeTracker);

// Add a container for position inputs and button
var positionContainer = document.createElement("div");
positionContainer.style.marginTop = "10px";
debugMenu.appendChild(positionContainer);

// Input fields for setting position
var posXInput = document.createElement("input");
posXInput.type = "text";
posXInput.placeholder = "Enter X position";
positionContainer.appendChild(posXInput);

var posYInput = document.createElement("input");
posYInput.type = "text";
posYInput.placeholder = "Enter Y position";
positionContainer.appendChild(posYInput);

// Button to set position
var setPositionButton = document.createElement("button");
setPositionButton.textContent = "Set Position";
setPositionButton.addEventListener("click", function () {
    var newX = parseFloat(posXInput.value);
    var newY = parseFloat(posYInput.value);
    if (!isNaN(newX) && !isNaN(newY)) {
        player.x = newX;
        player.y = newY;
        positionTracker.textContent = "Position: (X: " + newX.toFixed(3) + ", Y: " + newY.toFixed(3) + ")";
    } else {
        alert("Invalid input! Please enter valid numbers for X and Y positions.");
    }
});
positionContainer.appendChild(setPositionButton);

// Add a container for the timer input and button
var timerContainer = document.createElement("div");
timerContainer.style.marginTop = "10px";
debugMenu.appendChild(timerContainer);

// Input field for setting the timer value
var timerInput = document.createElement("input");
timerInput.type = "text";
timerInput.placeholder = "Enter Timer Value (s)";
timerContainer.appendChild(timerInput);

// Button to set the timer value
var setTimerButton = document.createElement("button");
setTimerButton.textContent = "Set Timer";
setTimerButton.addEventListener("click", function () {
    var newTime = parseFloat(timerInput.value);
    if (!isNaN(newTime)) {
        timer = newTime;
        startTime = Date.now() - (newTime * 1000);
        gameTimeTracker.textContent = "Game Time: " + newTime.toFixed(1) + "s";
        timerRunning = false; // Pause the timer
    } else {
        alert("Invalid input! Please enter a valid number for the timer value.");
    }
});
timerContainer.appendChild(setTimerButton);

// Create a container for the reset and respawn configuration
var configContainer = document.createElement("div");
configContainer.style.marginBottom = "20px";
debugMenu.appendChild(configContainer);

// Create input fields and labels for each value
var configFields = [
    { label: "Level X", id: "levelX", defaultValue: 0 },
    { label: "Level Y", id: "levelY", defaultValue: 0 },
    { label: "Player X", id: "playerX", defaultValue: 480 },
    { label: "Player Y", id: "playerY", defaultValue: 500 },
    { label: "Player X Move", id: "playerXMove", defaultValue: 0 },
    { label: "Player Y Move", id: "playerYMove", defaultValue: 0 }
];

configFields.forEach(field => {
    var label = document.createElement("label");
    label.textContent = field.label;
    label.style.marginRight = "10px";
    configContainer.appendChild(label);

    var input = document.createElement("input");
    input.type = "text";
    input.id = field.id;
    input.value = field.defaultValue;
    input.style.marginRight = "10px";
    configContainer.appendChild(input);

    configContainer.appendChild(document.createElement("br"));
});

// Create a button to apply the changes to reset function
var applyResetConfigButton = document.createElement("button");
applyResetConfigButton.textContent = "Apply Reset Config";
applyResetConfigButton.style.marginRight = "10px";
applyResetConfigButton.addEventListener("click", function () {
    var levelX = parseInt(document.getElementById("levelX").value);
    var levelY = parseInt(document.getElementById("levelY").value);
    var playerX = parseInt(document.getElementById("playerX").value);
    var playerY = parseInt(document.getElementById("playerY").value);
    var playerXMove = parseInt(document.getElementById("playerXMove").value);
    var playerYMove = parseInt(document.getElementById("playerYMove").value);

    if (!isNaN(levelX) && !isNaN(levelY) && !isNaN(playerX) && !isNaN(playerY) && !isNaN(playerXMove) && !isNaN(playerYMove)) {
        game.reset = function () {
            this.levelX = levelX;
            this.levelY = levelY;
            this.checkpoint1 = false;
            player.x = playerX;
            player.y = playerY;
            player.xmove = playerXMove;
            player.ymove = playerYMove;
            player.moved = false;
            timer = 0;
            this.won = false;
            this.playerDead = false;
            this.refreshLevel();
        };
        alert("Reset configuration applied!");
    } else {
        alert("Invalid input values!");
    }
});
configContainer.appendChild(applyResetConfigButton);

// Create a button to apply the changes to respawn function
var applyRespawnConfigButton = document.createElement("button");
applyRespawnConfigButton.textContent = "Apply Respawn Config";
applyRespawnConfigButton.addEventListener("click", function () {
    var levelX = parseInt(document.getElementById("levelX").value);
    var levelY = parseInt(document.getElementById("levelY").value);
    var playerX = parseInt(document.getElementById("playerX").value);
    var playerY = parseInt(document.getElementById("playerY").value);
    var playerXMove = parseInt(document.getElementById("playerXMove").value);
    var playerYMove = parseInt(document.getElementById("playerYMove").value);

    if (!isNaN(levelX) && !isNaN(levelY) && !isNaN(playerX) && !isNaN(playerY) && !isNaN(playerXMove) && !isNaN(playerYMove)) {
        game.respawn = function () {
            this.levelX = levelX;
            this.levelY = levelY;
            player.x = playerX;
            player.y = playerY;
            player.xmove = playerXMove;
            player.ymove = playerYMove;
            this.playerDead = false;
            this.refreshLevel();
        };
        alert("Respawn configuration applied!");
    } else {
        alert("Invalid input values!");
    }
});
configContainer.appendChild(applyRespawnConfigButton);

// Function to create an input field for configuration
function createConfigInputField(labelText, configKey) {
    var container = document.createElement("div");

    var label = document.createElement("label");
    label.textContent = labelText;
    container.appendChild(label);

    var input = document.createElement("input");
    input.type = "number";
    input.value = config[configKey];
    input.style.marginLeft = "10px";
    input.addEventListener("change", function () {
        var newValue = parseFloat(input.value);
        if (!isNaN(newValue)) {
            config[configKey] = newValue;
        }
    });
    container.appendChild(input);

    debugMenu.appendChild(container);
}

// Add input fields for configuration values
createConfigInputField("X Move Damping:", "xMoveDamping");
createConfigInputField("Y Move Damping:", "yMoveDamping");
createConfigInputField("Speed:", "xMoveIncrement");
createConfigInputField("Jump hight:", "yMoveRestingJump");
createConfigInputField("Edge Y Move:", "edgeYMove");
createConfigInputField("Level Width:", "levelWidth");
createConfigInputField("Level Height:", "levelHeight");
createConfigInputField("Level Offset:", "levelOffset");
createConfigInputField("Fast Fall:", "fastDescendMultiplier");

// Function to store the original block types
var originalBlocks = [];

function storeOriginalBlocks() {
    for (let i = 0; i <= 29; i++) { // Loop through levels 0 to 29
        if (game.levels[i] && game.levels[i].blocks) {
            originalBlocks[i] = [];
            for (let j = 0; j <= 33; j++) { // Loop through blocks 0 to 33
                if (game.levels[i].blocks[j]) {
                    originalBlocks[i][j] = game.levels[i].blocks[j].type;
                }
            }
        }
    }
}

// Function to restore the original block types
function restoreOriginalBlocks() {
    for (let i = 0; i <= 29; i++) {
        if (game.levels[i] && game.levels[i].blocks) {
            for (let j = 0; j <= 33; j++) {
                if (game.levels[i].blocks[j]) {
                    game.levels[i].blocks[j].type = originalBlocks[i][j];
                }
            }
        }
    }
    console.log("All blocks have been restored to their original types.");
}

function changeLavaToBlock() {
    for (let i = 0; i <= 29; i++) { // Loop through levels 0 to 29
        if (game.levels[i] && game.levels[i].blocks) {
            for (let j = 0; j <= 33; j++) { // Loop through blocks 0 to 33
                if (game.levels[i].blocks[j] && game.levels[i].blocks[j].type === 'lava') {
                    game.levels[i].blocks[j].type = 'block';
                }
            }
        }
    }
    console.log("All lava blocks have been changed to block blocks.");
}

// Add a container for the toggle buttons
function createToggleButton(label, initialState, toggleFunction) {
    var buttonContainer = document.createElement("div");
    buttonContainer.style.marginBottom = "5px";

    var button = document.createElement("button");
    button.textContent = label;
    button.style.backgroundColor = initialState ? "green" : "red"; // Set initial color based on state

    button.addEventListener("click", function () {
        toggleFunction(function (newState) {
            button.style.backgroundColor = newState ? "green" : "red"; // Change color based on new state
        });
    });

    buttonContainer.appendChild(button);

    return buttonContainer;
}

// Toggle wall jump state
var wallJumpEnabled = config.wallJumpEnabled || false;
var toggleWallJumpButton = createToggleButton(
    "Toggle Wall Jump",
    wallJumpEnabled,
    function (callback) {
        wallJumpEnabled = !wallJumpEnabled;
        config.wallJumpEnabled = wallJumpEnabled;
        callback(wallJumpEnabled);
    }
);
debugMenu.appendChild(toggleWallJumpButton);

// Toggle gravity direction
var gravityDirection = config.gravityDirection || 1;
var toggleGravityButton = createToggleButton(
    "Toggle Gravity",
    gravityDirection === 1,
    function (callback) {
        gravityDirection *= -1;
        config.gravityDirection = gravityDirection;
        callback(gravityDirection === 1);
    }
);
debugMenu.appendChild(toggleGravityButton);

// Add a toggle button for lava
var noLavaEnabled = false;
var lavaToggleButton = createToggleButton(
    "Toggle No Lava",
    noLavaEnabled,
    function (callback) {
        if (!noLavaEnabled) {
            storeOriginalBlocks();
            changeLavaToBlock();
            noLavaEnabled = true;
        } else {
            restoreOriginalBlocks();
            noLavaEnabled = false;
        }
        callback(noLavaEnabled);
    }
);
debugMenu.appendChild(lavaToggleButton);

// Add a container for the game.won dropdown
var gameWonContainer = document.createElement("div");
gameWonContainer.style.marginTop = "10px";
debugMenu.appendChild(gameWonContainer);

// Add the game.won dropdown to the container
var gameWonLabel = document.createElement("label");
gameWonLabel.textContent = "Game Won: ";
gameWonLabel.style.marginRight = "5px";
gameWonContainer.appendChild(gameWonLabel);

var gameWonDropdown = document.createElement("select");
var optionTrue = document.createElement("option");
optionTrue.value = "true";
optionTrue.textContent = "True";
gameWonDropdown.appendChild(optionTrue);

var optionFalse = document.createElement("option");
optionFalse.value = "false";
optionFalse.textContent = "False";
optionFalse.selected = true;
gameWonDropdown.appendChild(optionFalse);

gameWonDropdown.addEventListener("change", function () {
    game.won = (this.value === "true");
});

gameWonContainer.appendChild(gameWonDropdown);

// Add buttons for save and load states
var saveStateButton = document.createElement("button");
saveStateButton.textContent = "Save State";
saveStateButton.addEventListener("click", function () {
    var state = {
        player: {
            x: player.x,
            y: player.y,
            xmove: player.xmove,
            ymove: player.ymove,
            resting: player.resting,
        },
        game: {
            currentLevel: game.currentLevel,
            levelX: game.levelX,
            levelY: game.levelY,
        }
    };
    localStorage.setItem('saveState', JSON.stringify(state));
});
debugMenu.appendChild(saveStateButton);

var loadStateButton = document.createElement("button");
loadStateButton.textContent = "Load State";
loadStateButton.addEventListener("click", function () {
    var state = JSON.parse(localStorage.getItem('saveState'));
    if (state) {
        player.x = state.player.x;
        player.y = state.player.y;
        player.xmove = state.player.xmove;
        player.ymove = state.player.ymove;
        player.resting = state.player.resting;

        game.currentLevel = state.game.currentLevel;
        game.levelX = state.game.levelX;
        game.levelY = state.game.levelY;
        game.refreshLevel();
    }
});
debugMenu.appendChild(loadStateButton);

// Add a container for God Mode
var GodModeContainer = document.createElement("div");
GodModeContainer.style.marginBottom = "20px";
debugMenu.appendChild(GodModeContainer);

// Add a button for God Mode
var GodModeButton = document.createElement("button");
GodModeButton.textContent = "God Mode";
GodModeButton.style.marginTop = "10px";
GodModeButton.addEventListener("click", function () {
    // Override the setter for game.playerDead
    Object.defineProperty(game, 'playerDead', {
        get: function () {
            return false;
        },
        set: function (value) {
        }
    });

    game.die();
    console.log("God Mode enabled!");
});
GodModeContainer.appendChild(GodModeButton);

// Add a button to turn off God Mode
var turnOffGodModeButton = document.createElement("button");
turnOffGodModeButton.textContent = "Turn Off God Mode";
turnOffGodModeButton.style.marginTop = "10px";
turnOffGodModeButton.addEventListener("click", function () {
    // Restore the original behavior of game.playerDead
    delete game.playerDead;
    console.log("God Mode disabled!");
});
GodModeContainer.appendChild(turnOffGodModeButton);

// Add a container for switchKeys
var switchKeysContainer = document.createElement("div");
switchKeysContainer.style.marginBottom = "20px";
debugMenu.appendChild(switchKeysContainer);

// Add a button to enable switchKeys
var enableSwitchKeysButton = document.createElement("button");
enableSwitchKeysButton.textContent = "Enable switchKeys";
enableSwitchKeysButton.style.marginTop = "10px";
enableSwitchKeysButton.addEventListener("click", function () {
    // Override the getter and setter for game.switchKeys
    Object.defineProperty(game, 'switchKeys', {
        get: function () {
            return true;
        },
        set: function (value) {
            // Ignore any attempt to change the value
        }
    });

    console.log("switchKeys enabled!");
});
switchKeysContainer.appendChild(enableSwitchKeysButton);

// Add a button to disable switchKeys
var disableSwitchKeysButton = document.createElement("button");
disableSwitchKeysButton.textContent = "Disable switchKeys";
disableSwitchKeysButton.style.marginTop = "10px";
disableSwitchKeysButton.addEventListener("click", function () {
    // Restore the original behavior of game.switchKeys
    delete game.switchKeys;
    console.log("switchKeys disabled!");
});
switchKeysContainer.appendChild(disableSwitchKeysButton);

// Settings button to open the settings tab
var settingsButton = document.createElement("button");
settingsButton.textContent = "Settings";
settingsButton.addEventListener("click", function () {
    settingsTab.style.display = settingsTab.style.display === "none" ? "block" : "none";
});
debugMenu.appendChild(settingsButton);

// Hide/show media tab
var mediaTabButton = document.createElement("button");
mediaTabButton.textContent = "Media Settings";
mediaTabButton.addEventListener("click", function () {
    mediaTab.style.display = mediaTab.style.display === "none" ? "block" : "none";
});
debugMenu.appendChild(mediaTabButton);

// Settings tab container
var settingsTab = document.createElement("div");
settingsTab.style.position = "absolute";
settingsTab.style.top = "10px";
settingsTab.style.left = "10px";
settingsTab.style.fontSize = "16px";
settingsTab.style.color = "white"; // Fixed quotation marks
settingsTab.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
settingsTab.style.padding = "10px";
settingsTab.style.borderRadius = "5px";
settingsTab.style.display = "none"; // Initially hidden
settingsTab.style.resize = "both"; // Make resizable
settingsTab.style.overflow = "auto"; // Add overflow for resizing
document.body.appendChild(settingsTab);

// Settings tab header
var settingsHeader = document.createElement("div");
settingsHeader.style.cursor = "move";
settingsHeader.style.backgroundColor = "#333";
settingsHeader.style.color = "#fff";
settingsHeader.style.padding = "5px";
settingsHeader.style.fontWeight = "bold";
settingsHeader.textContent = "Settings";
settingsTab.appendChild(settingsHeader);

// Input for selecting background color
var bgColorInput = document.createElement("input");
bgColorInput.type = "color";
bgColorInput.value = "#000000"; // Default color
bgColorInput.addEventListener("input", function () {
    debugMenu.style.backgroundColor = bgColorInput.value;
});
settingsTab.appendChild(document.createElement("br"));
settingsTab.appendChild(document.createTextNode("Debug Menu Background Color: "));
settingsTab.appendChild(bgColorInput);

// Input for changing text color
var textColorInput = document.createElement("input");
textColorInput.type = "color";
textColorInput.addEventListener("input", function () {
    debugMenu.style.color = textColorInput.value;
    settingsTab.style.color = textColorInput.value; // Change text color for settings tab
});
settingsTab.appendChild(document.createElement("br"));
settingsTab.appendChild(document.createTextNode("Text Color: "));
settingsTab.appendChild(textColorInput);

// Input for adjusting background color and image opacity
var bgOpacityInput = document.createElement("input");
bgOpacityInput.type = "range";
bgOpacityInput.min = "0";
bgOpacityInput.max = "1";
bgOpacityInput.step = "0.1";
bgOpacityInput.value = "1"; // Default value
bgOpacityInput.addEventListener("input", function () {
    var currentColor = debugMenu.style.backgroundColor;
    var currentImage = debugMenu.style.backgroundImage;
    var currentOpacity = bgOpacityInput.value;
    debugMenu.style.backgroundColor = rgbaToRgbaA(currentColor, currentOpacity);
    if (currentImage && currentImage !== 'none') {
        debugMenu.style.backgroundImage = rgbaToRgbaA(currentImage, currentOpacity);
    }
});
settingsTab.appendChild(document.createElement("br"));
settingsTab.appendChild(document.createTextNode("Background Color Opacity: "));
settingsTab.appendChild(bgOpacityInput);

// Function to convert RGBA color to RGBA with specified opacity
function rgbaToRgbaA(rgba, opacity) {
    return rgba.replace(/rgba?\(([^)]+)\)/, (match, colors) => {
        const [r, g, b, a] = colors.split(",").map(c => c.trim());
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    });
}

// Create a tab for image and video settings
var mediaTab = document.createElement("div");
mediaTab.style.position = "absolute";
mediaTab.style.top = "10px";
mediaTab.style.left = "10px";
mediaTab.style.fontSize = "16px";
mediaTab.style.color = "white";
mediaTab.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
mediaTab.style.padding = "10px";
mediaTab.style.borderRadius = "5px";
mediaTab.style.display = "none"; // Initially hidden
mediaTab.style.resize = "both"; // Make resizable
mediaTab.style.overflow = "auto"; // Add overflow for resizing
document.body.appendChild(mediaTab);

// Media tab header
var mediaHeader = document.createElement("div");
mediaHeader.style.cursor = "move";
mediaHeader.style.backgroundColor = "#333";
mediaHeader.style.color = "#fff";
mediaHeader.style.padding = "5px";
mediaHeader.style.fontWeight = "bold";
mediaHeader.textContent = "Media Settings";
mediaTab.appendChild(mediaHeader);

// Input for uploading background video file to the debug menu
var debugMenuBgVideoInput = document.createElement("input");
debugMenuBgVideoInput.type = "file";
debugMenuBgVideoInput.accept = "video/mp4";
debugMenuBgVideoInput.addEventListener("change", function (event) {
    var file = event.target.files[0];
    if (file) {
        var url = URL.createObjectURL(file);

        // Remove existing video if present
        var existingVideo = debugMenu.querySelector("video");
        if (existingVideo) {
            debugMenu.removeChild(existingVideo);
        }

        // Create video element
        var video = document.createElement("video");
        video.src = url;
        video.autoplay = true;
        video.loop = true;
        video.style.position = "absolute";
        video.style.top = "0";
        video.style.left = "0";
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.style.zIndex = "-1"; // Ensure the video is behind the content
        debugMenu.appendChild(video);

        // Create audio slider for volume control
        var audioSlider = document.createElement("input");
        audioSlider.type = "range";
        audioSlider.min = "0";
        audioSlider.max = "1";
        audioSlider.step = "0.01";
        audioSlider.value = "0.5"; // Default volume at 50%
        audioSlider.addEventListener("input", function () {
            video.volume = audioSlider.value;
        });
        mediaTab.appendChild(document.createElement("br"));
        mediaTab.appendChild(document.createTextNode("Debug Menu Background Video Volume: "));
        mediaTab.appendChild(audioSlider);
    }
});
mediaTab.appendChild(document.createElement("br"));
mediaTab.appendChild(document.createTextNode("Debug Menu Background Video: "));
mediaTab.appendChild(debugMenuBgVideoInput);

// Input for adding background image(URL) to the debug menu
var bgImageInput = document.createElement("input");
bgImageInput.type = "text";
bgImageInput.placeholder = "Enter background image URL";
bgImageInput.addEventListener("input", function () {
    debugMenu.style.backgroundImage = `url(${bgImageInput.value})`;
});
mediaTab.appendChild(document.createElement("br"));
mediaTab.appendChild(document.createTextNode("Background Image URL(Debug Menu): "));
mediaTab.appendChild(bgImageInput);

// Input for adding background image to the debug menu
var bgImageInputDebug = document.createElement("input");
bgImageInputDebug.type = "file";
bgImageInputDebug.addEventListener("change", function () {
    const file = bgImageInputDebug.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            debugMenu.style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
    }
});
mediaTab.appendChild(document.createElement("br"));
mediaTab.appendChild(document.createTextNode("Background Image (Debug Menu): "));
mediaTab.appendChild(bgImageInputDebug);

// Input for adding background image (URL) to the settings menu
var settingsTabBgImageInput = document.createElement("input");
settingsTabBgImageInput.type = "text";
settingsTabBgImageInput.placeholder = "Enter background image URL for settings menu";
settingsTabBgImageInput.addEventListener("input", function () {
    settingsTab.style.backgroundImage = `url(${settingsTabBgImageInput.value})`;
});
mediaTab.appendChild(document.createElement("br"));
mediaTab.appendChild(document.createTextNode("Background Image URL(settings): "));
mediaTab.appendChild(settingsTabBgImageInput);

// Input for adding background image to the settings menu
var bgImageInputSettings = document.createElement("input");
bgImageInputSettings.type = "file";
bgImageInputSettings.addEventListener("change", function () {
    const file = bgImageInputSettings.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            settingsTab.style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
    }
});
mediaTab.appendChild(document.createElement("br"));
mediaTab.appendChild(document.createTextNode("Background Image (Settings Menu): "));
mediaTab.appendChild(bgImageInputSettings);

// Input for background size
var bgSizeSelect = document.createElement("select");
bgSizeSelect.addEventListener("change", function () {
    debugMenu.style.backgroundSize = bgSizeSelect.value;
});
var bgSizeOptions = [
    "cover",
    "contain",
    "auto"
];
bgSizeOptions.forEach(function (option) {
    var bgSizeOption = document.createElement("option");
    bgSizeOption.textContent = option;
    bgSizeSelect.appendChild(bgSizeOption);
});
mediaTab.appendChild(document.createElement("br"));
mediaTab.appendChild(document.createTextNode("Background Size: "));
mediaTab.appendChild(bgSizeSelect);

// Input for background repeat
var bgRepeatSelect = document.createElement("select");
bgRepeatSelect.addEventListener("change", function () {
    debugMenu.style.backgroundRepeat = bgRepeatSelect.value === "true" ? "repeat" : "no-repeat";
});
var bgRepeatOptions = [
    "true",
    "false"
];
bgRepeatOptions.forEach(function (option) {
    var bgRepeatOption = document.createElement("option");
    bgRepeatOption.textContent = option;
    bgRepeatSelect.appendChild(bgRepeatOption);
});
mediaTab.appendChild(document.createElement("br"));
mediaTab.appendChild(document.createTextNode("Background Repeat: "));
mediaTab.appendChild(bgRepeatSelect);

// Make the media tab draggable
let isMediaDragging = false;
let mediaOffsetX, mediaOffsetY;

mediaHeader.addEventListener('mousedown', function (e) {
    isMediaDragging = true;
    mediaOffsetX = e.clientX - mediaTab.offsetLeft;
    mediaOffsetY = e.clientY - mediaTab.offsetTop;
});

document.addEventListener('mousemove', function (e) {
    if (isMediaDragging) {
        mediaTab.style.left = (e.clientX - mediaOffsetX) + 'px';
        mediaTab.style.top = (e.clientY - mediaOffsetY) + 'px';
    }
});

document.addEventListener('mouseup', function () {
    isMediaDragging = false;
});

// Input for changing font family
var fontSelector = document.createElement("select");
fontSelector.addEventListener("change", function () {
    var selectedFont = fontSelector.value;
    debugMenu.style.fontFamily = selectedFont;
    settingsTab.style.fontFamily = selectedFont;
});
var fontOptions = [
    "Abadi MT Condensed Light",
    "Albertus Extra Bold",
    "Albertus Medium",
    "Antique Olive",
    "Arial",
    "Arial Black",
    "Arial MT",
    "Arial Narrow",
    "Bazooka",
    "Book Antiqua",
    "Bookman Old Style",
    "Boulder",
    "Calisto MT",
    "Calligrapher",
    "Century Gothic",
    "Century Schoolbook",
    "Cezanne",
    "CG Omega",
    "CG Times",
    "Charlesworth",
    "Chaucer",
    "Clarendon Condensed",
    "Comic Sans MS",
    "Copperplate Gothic Bold",
    "Copperplate Gothic Light",
    "Cornerstone",
    "Haettenschweiler",
    "Heather",
    "Helvetica",
    "Marigold",
    "Market",
    "Matisse ITC",
    "MS LineDraw",
    "News GothicMT",
    "OCR A Extended",
    "Old Century",
    "Pegasus",
    "Pickwick",
    "Poster",
    "Pythagoras",
    "Sceptre",
    "Sherwood",
    "Signboard",
    "Socket",
    "Steamer",
    "Storybook",
    "Subway",
    "Tahoma",
    "Technical",
    "Teletype",
    "Tempus Sans ITC",
    "Times",
    "Times New Roman",
    "Times New Roman PS",
    "Trebuchet MS",
    "Verdana",
    "Westminster"
];
fontOptions.forEach(function (option) {
    var fontOption = document.createElement("option");
    fontOption.textContent = option;
    fontSelector.appendChild(fontOption);
});
settingsTab.appendChild(document.createElement("br"));
settingsTab.appendChild(document.createTextNode("Font Family: "));
settingsTab.appendChild(fontSelector);

// Set default font family for debug and settings menu
debugMenu.style.fontFamily = "Arial";
settingsTab.style.fontFamily = "Arial";

// Create a container for the input tracker
var inputTrackerContainer = document.createElement("div");
inputTrackerContainer.style.marginTop = "20px";
debugMenu.appendChild(inputTrackerContainer);

// Create labels for W, A, S, D
var wLabel = createInputLabel("W");
var aLabel = createInputLabel("A");
var sLabel = createInputLabel("S");
var dLabel = createInputLabel("D");
var rLabel = createInputLabel("Reset", "60px");

// Create labels for arrow keys
var upLabel = createInputLabel("↑");
var leftLabel = createInputLabel("←");
var downLabel = createInputLabel("↓");
var rightLabel = createInputLabel("→");

// Append labels to the input tracker container
[inputTrackerContainer, inputTrackerContainer].forEach(container => {
    container.appendChild(wLabel);
    container.appendChild(aLabel);
    container.appendChild(sLabel);
    container.appendChild(dLabel);
    container.appendChild(rLabel);
    container.appendChild(document.createElement("br")); // Add line break
    container.appendChild(upLabel);
    container.appendChild(leftLabel);
    container.appendChild(downLabel);
    container.appendChild(rightLabel);
});

// Function to create input labels
function createInputLabel(key, width = "30px") {
    var label = document.createElement("div");
    label.textContent = key;
    label.style.display = "inline-block";
    label.style.width = width; // Set the width based on the parameter
    label.style.height = "30px";
    label.style.backgroundColor = "black";
    label.style.color = "white";
    label.style.textAlign = "center";
    label.style.paddingTop = "8px";
    label.style.borderRadius = "5px";
    label.style.marginRight = "5px";
    return label;
}

// Function to toggle the background color of the labels when corresponding keys are pressed
function toggleLabelColor(label, isActive) {
    if (isActive) {
        label.style.backgroundColor = "green";
    } else {
        label.style.backgroundColor = "black";
    }
}

// Add event listeners to track keydown and keyup events for W, A, S, D
document.addEventListener("keydown", function (event) {
    if (event.key === "w") {
        toggleLabelColor(wLabel, true);
    } else if (event.key === "a") {
        toggleLabelColor(aLabel, true);
    } else if (event.key === "s") {
        toggleLabelColor(sLabel, true);
    } else if (event.key === "d") {
        toggleLabelColor(dLabel, true);
    } else if (event.key === "r") {
        toggleLabelColor(rLabel, true);
    }
});

document.addEventListener("keyup", function (event) {
    if (event.key === "w") {
        toggleLabelColor(wLabel, false);
    } else if (event.key === "a") {
        toggleLabelColor(aLabel, false);
    } else if (event.key === "s") {
        toggleLabelColor(sLabel, false);
    } else if (event.key === "d") {
        toggleLabelColor(dLabel, false);
    } else if (event.key === "r") {
        toggleLabelColor(rLabel, false);
    }
});

// Add event listeners to track keydown and keyup events for arrow keys
document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowUp") {
        toggleLabelColor(upLabel, true);
    } else if (event.key === "ArrowLeft") {
        toggleLabelColor(leftLabel, true);
    } else if (event.key === "ArrowDown") {
        toggleLabelColor(downLabel, true);
    } else if (event.key === "ArrowRight") {
        toggleLabelColor(rightLabel, true);
    }
});

document.addEventListener("keyup", function (event) {
    if (event.key === "ArrowUp") {
        toggleLabelColor(upLabel, false);
    } else if (event.key === "ArrowLeft") {
        toggleLabelColor(leftLabel, false);
    } else if (event.key === "ArrowDown") {
        toggleLabelColor(downLabel, false);
    } else if (event.key === "ArrowRight") {
        toggleLabelColor(rightLabel, false);
    }
});

var lastFrameLengths = [];
var lastFrameTime = Date.now();

var lastX = player.x;
var lastY = player.y;
var chunkSize = 1000; // Adjusted chunk size to 1000
var startTime = Date.now();
var lastFrameTime = Date.now();
var timerRunning = true;

function debugUpdate() {
    var currentTime = Date.now();
    var deltaTime = (currentTime - lastFrameTime) / 1000; // convert milliseconds to seconds
    lastFrameLengths.push(deltaTime);
    if (lastFrameLengths.length > 20) lastFrameLengths.shift();
    var fps = Math.round(1 / (lastFrameLengths.reduce((a, b) => a + b) / lastFrameLengths.length)); // calculate frames per second

    fpsTracker.textContent = "FPS: " + fps; // update FPS counter

    lastFrameTime = currentTime;

    var x = player.x.toFixed(3);
    var y = player.y.toFixed(3);

    var velocityX = player.xmove.toFixed(3);
    var velocityY = player.ymove.toFixed(3);

    var chunkX = Math.floor(player.x / chunkSize);
    var chunkY = Math.floor(player.y / chunkSize);

    var elapsedTime = (currentTime - startTime) / 1000; // convert milliseconds to seconds
    gameTimeTracker.textContent = "Game Time: " + elapsedTime.toFixed(1) + "s";

    positionTracker.textContent = "Position: (X: " + x + ", Y: " + y + ")";
    velocityTracker.textContent = "Velocity: (X: " + velocityX + ", Y: " + velocityY + ")";
    chunkTracker.textContent = "Chunk: (X: " + chunkX + ", Y: " + chunkY + ")";
}

// Function to update the debug menu position based on window size
function updateDebugMenuPosition() {
    var topPos = window.innerHeight * 0.01;
    var leftPos = window.innerWidth * 0.01;
    debugMenu.style.top = topPos + 'px';
    debugMenu.style.left = leftPos + 'px';
}

// Initial position update
updateDebugMenuPosition();

// Add event listener for window resize to update debug menu position
window.addEventListener('resize', updateDebugMenuPosition);

// Flag to indicate whether resizing or dragging is active
var isResizing = false;
var isDragging = false;

// Make the debug menu draggable
function makeDraggable(element) {
    var pos3 = 0, pos4 = 0, pos1 = 0, pos2 = 0;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        if (isResizing) return;
        isDragging = true;
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        if (!isDragging || isResizing) return;
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        isDragging = false;
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

debugMenuHeader.addEventListener('mousedown', function (e) {
    isDragging = true;
    offsetX = e.clientX - debugMenu.offsetLeft;
    offsetY = e.clientY - debugMenu.offsetTop;
});

document.addEventListener('mousemove', function (e) {
    if (isDragging) {
        debugMenu.style.left = (e.clientX - offsetX) + 'px';
        debugMenu.style.top = (e.clientY - offsetY) + 'px';
    }
});

document.addEventListener('mouseup', function () {
    isDragging = false;
});

// Make the settings tab draggable
let isSettingsDragging = false;
let settingsOffsetX, settingsOffsetY;

settingsHeader.addEventListener('mousedown', function (e) {
    isSettingsDragging = true;
    settingsOffsetX = e.clientX - settingsTab.offsetLeft;
    settingsOffsetY = e.clientY - settingsTab.offsetTop;
});

document.addEventListener('mousemove', function (e) {
    if (isSettingsDragging) {
        settingsTab.style.left = (e.clientX - settingsOffsetX) + 'px';
        settingsTab.style.top = (e.clientY - settingsOffsetY) + 'px';
    }
});

document.addEventListener('mouseup', function () {
    isSettingsDragging = false;
});

// Event listener for mousedown on debugMenu to initiate resizing
document.addEventListener('mousedown', function (event) {
    if (event.target === debugMenu) {
        var startX = event.clientX;
        var startY = event.clientY;
        var startWidth = debugMenu.offsetWidth;
        var startHeight = debugMenu.offsetHeight;

        // Set resizing flag
        isResizing = true;

        // Event listener for mousemove during resizing
        function handleMouseMove(event) {
            resizeDebugMenu(startX, startY, startWidth, startHeight, event);
        }

        // Event listener for mouseup to stop resizing
        function handleMouseUp() {
            // Reset resizing flag
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
});

// Event listener for mousedown on settingsTab to initiate resizing
document.addEventListener('mousedown', function (event) {
    if (event.target === settingsTab) {
        var startX = event.clientX;
        var startY = event.clientY;
        var startWidth = settingsTab.offsetWidth;
        var startHeight = settingsTab.offsetHeight;

        // Set resizing flag
        isResizing = true;

        // Event listener for mousemove during resizing
        function handleMouseMove(event) {
            resizeSettingsTab(startX, startY, startWidth, startHeight, event);
        }

        // Event listener for mouseup to stop resizing
        function handleMouseUp() {
            // Reset resizing flag
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
});