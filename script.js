
"use strict";

// BRIAN EMOJI CATCHER
// HTML: index.html | CSS: style.css | JS: script.js

const gameArea = document.getElementById("game-area");
const emojiContainer = document.getElementById("emoji-container");
const player = document.getElementById("player");

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const bestDisplay = document.getElementById("best");

const overlay = document.getElementById("overlay");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");

const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");
const leftButton = document.getElementById("left-btn");
const rightButton = document.getElementById("right-btn");

// GAME SETTINGS
const GAME_DURATION = 60;
const PLAYER_SPEED = 340;

// Only non-fruit emojis are used in this game.
const emojiTypes = [
    { symbol: "😀", points: 10 },
    { symbol: "😎", points: 10 },
    { symbol: "🥳", points: 15 },
    { symbol: "😍", points: 10 },
    { symbol: "🤩", points: 15 },
    { symbol: "👻", points: 10 },
    { symbol: "⭐", points: 20 },
    { symbol: "🌟", points: 20 },
    { symbol: "❤️", points: 10 },
    { symbol: "💖", points: 15 },
    { symbol: "💎", points: 30 },
    { symbol: "👑", points: 25 },
    { symbol: "⚡", points: 20 }
];

const BOMB = "💣";
const BOMB_POINTS = -15;

// GAME STATE
let score = 0;
let bestScore = loadBestScore();
let timeLeft = GAME_DURATION;

let playerX = 0.5;
let running = false;
let gameOver = false;

let emojis = [];
let keys = {};

let lastFrame = 0;
let spawnTimer = 0;
let animationId = null;
let countdownId = null;
let lastTimestamp = 0;

let activePointer = null;

// HIGH SCORE STORAGE
function loadBestScore() {
    try {
        return Number(localStorage.getItem("brianEmojiCatcherBest")) || 0;
    } catch (error) {
        return 0;
    }
}

function saveBestScore() {
    try {
        localStorage.setItem(
            "brianEmojiCatcherBest",
            String(bestScore)
        );
    } catch (error) {
        // The game can still run if storage is unavailable.
    }
}

bestDisplay.textContent = bestScore;

// KEEP PLAYER INSIDE THE GAME AREA
function positionPlayer() {
    playerX = Math.max(0.06, Math.min(0.94, playerX));
    player.style.left = `${playerX * 100}%`;
}

// UPDATE THE SCORE
function updateScore(points) {
    score = Math.max(0, score + points);
    scoreDisplay.textContent = score;

    if (score > bestScore) {
        bestScore = score;
        bestDisplay.textContent = bestScore;
        saveBestScore();
    }
}

// REMOVE ALL FALLING EMOJIS
function clearEmojis() {
    emojis.forEach(emoji => emoji.element.remove());
    emojis = [];
}

// CREATE A FALLING EMOJI
function createEmoji() {
    const isBomb = Math.random() < 0.15;

    const selected = isBomb
        ? { symbol: BOMB, points: BOMB_POINTS }
        : emojiTypes[
            Math.floor(Math.random() * emojiTypes.length)
        ];

    const element = document.createElement("div");

    element.className = "falling-emoji";
    element.textContent = selected.symbol;
    element.setAttribute("aria-hidden", "true");

    const areaWidth = gameArea.clientWidth;
    const emojiWidth = 42;

    const x = Math.random() * Math.max(1, areaWidth - emojiWidth);

    element.style.transform = `translate(${x}px, -45px)`;

    emojiContainer.appendChild(element);

    emojis.push({
        element: element,
        x: x,
        y: -45,
        points: selected.points,
        isBomb: isBomb,

        speed:
            125 +
            Math.random() * 90 +
            (GAME_DURATION - timeLeft) * 2.2
    });
}

// MOVE PLAYER WITH KEYBOARD
function handleKeyboard() {
    if (keys.ArrowLeft || keys.a || keys.A) {
        playerX -= PLAYER_SPEED * getDelta() /
            gameArea.clientWidth;
    }

    if (keys.ArrowRight || keys.d || keys.D) {
        playerX += PLAYER_SPEED * getDelta() /
            gameArea.clientWidth;
    }

    positionPlayer();
}

let frameDelta = 0;

function getDelta() {
    return frameDelta;
}

// MAIN GAME LOOP
function gameLoop(timestamp) {
    if (!running) return;

    frameDelta = Math.min(
        (timestamp - (lastFrame || timestamp)) / 1000,
        0.04
    );

    lastFrame = timestamp;

    handleKeyboard();

    // Spawn emojis more frequently as time passes.
    spawnTimer += frameDelta;

    const spawnInterval = Math.max(
        0.32,
        0.85 - (GAME_DURATION - timeLeft) * 0.008
    );

    if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        createEmoji();
    }

    moveAndCatchEmojis();

    animationId = requestAnimationFrame(gameLoop);
}

// MOVE EMOJIS AND CHECK FOR CATCHES
function moveAndCatchEmojis() {
    const areaWidth = gameArea.clientWidth;
    const areaHeight = gameArea.clientHeight;

    const playerCenter = playerX * areaWidth;
    const playerTop = areaHeight - player.offsetHeight - 10;

    for (let i = emojis.length - 1; i >= 0; i--) {
        const emoji = emojis[i];

        emoji.y += emoji.speed * frameDelta;

        emoji.element.style.transform =
            `translate(${emoji.x}px, ${emoji.y}px)`;

        const emojiCenterX = emoji.x + 18;
        const emojiBottom = emoji.y + 34;

        const horizontalHit =
            Math.abs(emojiCenterX - playerCenter) < 43;

        const verticalHit =
            emojiBottom >= playerTop &&
            emoji.y <= areaHeight - 10;

        if (horizontalHit && verticalHit) {
            updateScore(emoji.points);

            if (emoji.isBomb) {
                gameArea.style.borderColor = "#fb7185";

                setTimeout(() => {
                    gameArea.style.borderColor = "";
                }, 180);
            }

            emoji.element.remove();
            emojis.splice(i, 1);
            continue;
        }

        // Remove emojis that have fallen out of view.
        if (emoji.y > areaHeight + 50) {
            emoji.element.remove();
            emojis.splice(i, 1);
        }
    }
}

// START OR RESTART THE GAME
function startGame() {
    cancelAnimationFrame(animationId);
    clearInterval(countdownId);

    clearEmojis();

    score = 0;
    timeLeft = GAME_DURATION;
    playerX = 0.5;

    running = true;
    gameOver = false;

    lastFrame = 0;
    spawnTimer = 0;
    frameDelta = 0;

    keys = {};

    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;

    positionPlayer();

    overlay.style.display = "none";

    startButton.textContent = "▶ PLAY AGAIN";

    countdownId = setInterval(() => {
        if (!running) return;

        timeLeft--;

        timeDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            finishGame();
        }
    }, 1000);

    animationId = requestAnimationFrame(gameLoop);
}

// END THE GAME
function finishGame() {
    running = false;
    gameOver = true;

    cancelAnimationFrame(animationId);
    clearInterval(countdownId);

    keys = {};

    // Save and display the final high score.
    if (score > bestScore) {
        bestScore = score;
        bestDisplay.textContent = bestScore;
        saveBestScore();
    }

    clearEmojis();

    overlay.style.display = "flex";

    messageTitle.textContent = "🏆 Game Over!";

    messageText.textContent =
        `Amazing effort! You scored ${score} points. ` +
        (score >= bestScore && score > 0
            ? "Keep up the great work!"
            : `Your best score is ${bestScore}. Try again!`);

    startButton.textContent = "▶ PLAY AGAIN";
}

// KEYBOARD EVENTS
document.addEventListener("keydown", event => {
    if (
        ["ArrowLeft", "ArrowRight", " "].includes(event.key) &&
        gameArea.contains(document.activeElement)
    ) {
        event.preventDefault();
    }

    if (
        ["ArrowLeft", "ArrowRight", "a", "A", "d", "D"]
            .includes(event.key)
    ) {
        keys[event.key] = true;
    }
});

document.addEventListener("keyup", event => {
    keys[event.key] = false;
});

window.addEventListener("blur", () => {
    keys = {};
});

// ON-SCREEN ARROW BUTTONS
function setupMoveButton(button, direction) {
    const press = event => {
        event.preventDefault();
        keys[direction] = true;
    };

    const release = event => {
        event.preventDefault();
        keys[direction] = false;
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("pointerleave", release);
}

setupMoveButton(leftButton, "ArrowLeft");
setupMoveButton(rightButton, "ArrowRight");

// TOUCH AND DRAG CONTROL
function movePlayerToPointer(event) {
    const rect = gameArea.getBoundingClientRect();

    playerX = (event.clientX - rect.left) / rect.width;

    positionPlayer();
}

gameArea.addEventListener("pointerdown", event => {
    if (!running) return;

    activePointer = event.pointerId;

    try {
        gameArea.setPointerCapture(event.pointerId);
    } catch (error) {
        // Pointer capture may not be available on every device.
    }

    movePlayerToPointer(event);
});

gameArea.addEventListener("pointermove", event => {
    if (!running || activePointer !== event.pointerId) return;

    movePlayerToPointer(event);
});

function releasePointer(event) {
    if (activePointer === event.pointerId) {
        activePointer = null;
    }
}

gameArea.addEventListener("pointerup", releasePointer);
gameArea.addEventListener("pointercancel", releasePointer);

// BUTTON EVENTS
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// INITIALISE THE GAME
positionPlayer();
