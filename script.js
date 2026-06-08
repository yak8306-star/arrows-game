// Ждем загрузки всех ресурсов и VK Bridge
window.addEventListener('load', () => {
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppInit').then(() => {
            console.log("VK Bridge инициализирован");
            runGame(); // Запускаем игру только после инициализации
        }).catch(err => {
            console.error("Ошибка VK Bridge:", err);
            runGame(); // Запускаем игру даже если ошибка, чтобы она работала вне VK
        });
    } else {
        runGame(); // Если мы не в VK, просто запускаем игру
    }
});

function runGame() {
    // ВСТАВЬ СЮДА ВЕСЬ СВОЙ ОСТАЛЬНОЙ КОД, начиная с "const board = ..." 
    // и заканчивая "window.onload = initGame;" (эту строку можно убрать)
  
const board = document.getElementById('game-board');
const boardWrapper = document.getElementById('game-board-wrapper');
const livesDisplay = document.getElementById('lives-display');
const levelDisplay = document.getElementById('level-val');
const timerVal = document.getElementById('timer-val');
const coinsDisplay = document.getElementById('coins-val');
const walletCoinsVal = document.getElementById('wallet-coins-val');

const victoryScreen = document.getElementById('victory-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const shopScreen = document.getElementById('shop-screen');
const walletScreen = document.getElementById('wallet-screen');
const errorScreen = document.getElementById('error-screen');
const shopTitle = document.getElementById('shop-title');

const nextLevelBtn = document.getElementById('next-level-btn');
const restartBtn = document.getElementById('restart-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const buyBoosterBtn = document.getElementById('buy-booster-btn');
const adBoosterBtn = document.getElementById('ad-booster-btn');

const coinsWidget = document.getElementById('coins-display');
const closeShopBtn = document.getElementById('close-shop-btn');
const closeWalletBtn = document.getElementById('close-wallet-btn');
const closeErrorBtn = document.getElementById('close-error-btn');
const getAdCoinsBtn = document.getElementById('get-ad-coins-btn');

const hintBtn = document.getElementById('hint-btn');
const hintCountVal = document.getElementById('hint-count');
const bombBtn = document.getElementById('bomb-btn');
const bombCountVal = document.getElementById('bomb-count');
const magnetBtn = document.getElementById('magnet-btn');
const magnetCountVal = document.getElementById('magnet-count');

let currentLevel = 1;
let lives = 3;
let coins = 100;
let boosters = { hint: 3, bomb: 5, magnet: 3 };

let activeShopBoosterType = null; 
let tilesData = [];
let tutorialActive = false;
let currentZoom = 0.75;
let levelStartTime;
let timerInterval = null;
let handInterval = null; 
let currentFigureKey = null;

let isDragging = false;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;

const directions = {
    '▲': { dx: 0, dy: -1 },
    '▶': { dx: 1, dy: 0 },
    '▼': { dx: 0, dy: 1 },
    '◀': { dx: -1, dy: 0 }
};
const dirSymbols = ['▲', '▶', '▼', '◀'];

const pixelArtTemplates = {
    duck: [[0, 2, 2, 2, 0], [2, 2, 5, 2, 0], [0, 2, 2, 2, 2], [2, 2, 2, 2, 2], [0, 2, 2, 2, 0], [0, 1, 0, 1, 0]],
    heart: [[0, 1, 1, 0, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 1, 0, 0, 0]],
    house: [[0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [0, 3, 3, 3, 0], [0, 3, 2, 3, 0], [0, 3, 3, 3, 0]],
    smiley: [[0, 2, 2, 2, 0], [2, 5, 2, 5, 2], [2, 2, 2, 2, 2], [2, 1, 1, 1, 2], [0, 2, 2, 2, 0]]
};

let figuresPool = [];

function saveGameData() {
    localStorage.setItem('arrows_game_save', JSON.stringify({ level: currentLevel, coins: coins, boosters: boosters }));
}

function loadGameData() {
    const savedData = localStorage.getItem('arrows_game_save');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        currentLevel = parsed.level || 1;
        coins = parsed.coins !== undefined ? parsed.coins : 100;
        boosters = parsed.boosters || { hint: 3, bomb: 5, magnet: 3 };
    }
}

function refillPool() {
    figuresPool = Object.keys(pixelArtTemplates);
    figuresPool.sort(() => Math.random() - 0.5);
}

function initGame(isRestart = false) {
    lives = 3;
    stopTimer();
    stopHandAnimation();
    timerVal.innerText = "00:00";
    translateX = 0;
    translateY = 0;
    evHistory = [];
    isDragging = false;
    
    victoryScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    shopScreen.classList.add('hidden');
    walletScreen.classList.add('hidden');
    errorScreen.classList.add('hidden');
    removeTutorialHand();
    
    levelStartTime = Date.now();
    startTimer();

    if (currentLevel === 1) {
        tutorialActive = true;
        currentFigureKey = null;
        generateTutorialLevel();
    } else {
        tutorialActive = false;
        if (!isRestart || !currentFigureKey) {
            if (figuresPool.length === 0) refillPool();
            currentFigureKey = figuresPool.pop();
        }
        generateLevelWithDifficulty(currentFigureKey, currentLevel);
    }
    updateUI();
}

function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - levelStartTime) / 1000);
        const m = Math.floor(diff / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        timerVal.innerText = `${m}:${s}`;
    }, 1000);
}

function stopTimer() { if (timerInterval) clearInterval(timerInterval); }
function stopHandAnimation() { if (handInterval) clearInterval(handInterval); }

function updateUI() {
    levelDisplay.innerText = currentLevel;
    livesDisplay.innerText = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    coinsDisplay.innerText = coins;
    walletCoinsVal.innerText = coins; 
    hintCountVal.innerText = boosters.hint;
    bombCountVal.innerText = boosters.bomb;
    magnetCountVal.innerText = boosters.magnet;
    board.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

function generateTutorialLevel() {
    board.innerHTML = '';
    tilesData = [];
    currentZoom = 0.9;
    const startXPos = (1000 - (3 * 52)) / 2;
    const startYPos = (1000 - (2 * 52)) / 2;
    const layout = [
        { r: 0, c: 0, dir: '◀', target: true, color: 1 }, { r: 0, c: 1, dir: '▲', color: 2 },
        { r: 0, c: 2, dir: '▶', color: 3 }, { r: 1, c: 0, dir: '▼', color: 4 },
        { r: 1, c: 1, dir: '▼', color: 1 }, { r: 1, c: 2, dir: '▼', color: 2 }
    ];
    layout.forEach((item) => {
        const tileEl = document.createElement('div');
        tileEl.className = `tile color-${item.color}`;
        tileEl.innerText = item.dir;
        tileEl.style.left = `${startXPos + item.c * 52}px`;
        tileEl.style.top = `${startYPos + item.r * 52}px`;
        if (item.target) tileEl.classList.add('tutorial-active');
        board.appendChild(tileEl);
        tilesData.push({ element: tileEl, row: item.r, col: item.c, dir: item.dir, removed: false, isTarget: item.target || false });
    });
    createTutorialHand();
}

function createTutorialHand() {
    const target = tilesData.find(t => t.isTarget);
    if (!target) return;
    const hand = document.createElement('div');
    hand.id = 'tutorial-hand';
    hand.innerHTML = '☝️';
    hand.style.position = 'absolute';
    hand.style.fontSize = '32px';
    hand.style.left = `${parseFloat(target.element.style.left) + 12}px`;
    hand.style.top = `${parseFloat(target.element.style.top) + 42}px`;
    let up = false;
    handInterval = setInterval(() => {
        hand.style.transform = up ? 'translateY(-10px)' : 'translateY(0px)';
        up = !up;
    }, 400);
    board.appendChild(hand);
}

function removeTutorialHand() { stopHandAnimation(); const hand = document.getElementById('tutorial-hand'); if (hand) hand.remove(); }

function generateLevelWithDifficulty(figureKey, level) {
    board.innerHTML = '';
    tilesData = [];
    let baseMatrix = pixelArtTemplates[figureKey];
    if (level >= 3) {
        let extraRows = Math.min(Math.floor((level - 3) / 2), 3);
        let extraCols = Math.min(Math.floor((level - 3) / 2), 3);
        let newMatrix = [];
        for(let r=0; r < baseMatrix.length + extraRows; r++) {
            let row = [];
            for(let c=0; c < baseMatrix[0].length + extraCols; c++) {
                if (r < baseMatrix.length && c < baseMatrix[0].length) row.push(baseMatrix[r][c]);
                else row.push((Math.random() > 0.6) ? Math.floor(Math.random() * 5) + 1 : 0);
            }
            newMatrix.push(row);
        }
        baseMatrix = newMatrix;
    }
    const sizeR = baseMatrix.length, sizeC = baseMatrix[0].length;
    currentZoom = (Math.max(sizeR, sizeC) <= 5) ? 0.85 : (Math.max(sizeR, sizeC) <= 8) ? 0.70 : 0.55;
    const startXPos = (1000 - (sizeC * 52)) / 2, startYPos = (1000 - (sizeR * 52)) / 2;
    let shapeSlots = [];
    for (let r = 0; r < sizeR; r++) for (let c = 0; c < sizeC; c++) if (baseMatrix[r][c] > 0) shapeSlots.push({ r, c, colorCode: baseMatrix[r][c] });
    let finalTiles = [], success = false;
    while (!success) {
        finalTiles = [];
        let vGrid = Array(sizeR).fill(null).map(() => Array(sizeC).fill(null));
        shapeSlots.forEach(s => vGrid[s.r][s.c] = true);
        let remaining = [...shapeSlots], failed = false;
        while (remaining.length > 0) {
            let moves = [];
            for (let i = 0; i < remaining.length; i++) {
                let slot = remaining[i];
                dirSymbols.forEach(sym => {
                    const d = directions[sym];
                    let cr = slot.r + d.dy, cc = slot.c + d.dx, clear = true;
                    while (cr >= 0 && cr < sizeR && cc >= 0 && cc < sizeC) { if (vGrid[cr][cc] !== null) { clear = false; break; } cr += d.dy; cc += d.dx; }
                    if (clear) moves.push({ idx: i, slot, dir: sym });
                });
            }
            if (moves.length === 0) { failed = true; break; }
            let m = moves[Math.floor(Math.random() * moves.length)];
            remaining.splice(m.idx, 1);
            vGrid[m.slot.r][m.slot.c] = null;
            finalTiles.push({ r: m.slot.r, c: m.slot.c, dir: m.dir, color: m.slot.colorCode });
        }
        if (!failed) success = true;
    }
    finalTiles.forEach((tile) => {
        const tileEl = document.createElement('div');
        tileEl.className = `tile color-${tile.color}`;
        tileEl.innerText = tile.dir; 
        tileEl.style.left = `${startXPos + tile.c * 52}px`;
        tileEl.style.top = `${startYPos + tile.r * 52}px`;
        board.appendChild(tileEl);
        tilesData.push({ element: tileEl, row: tile.r, col: tile.c, dir: tile.dir, removed: false });
    });
}

function handleTileClick(tile) {
    if (tile.removed || lives <= 0) return;
    document.querySelectorAll('.tile').forEach(el => el.classList.remove('hint-highlight'));
    if (checkTileFree(tile)) {
        flyOutTile(tile);
    } else {
        if (tutorialActive) return;
        lives--;
        updateUI();
        tile.element.style.transform = 'scale(0.85)';
        setTimeout(() => { if(!tile.removed) tile.element.style.transform = 'scale(1)'; }, 130);
        if (lives <= 0) { stopTimer(); gameOverScreen.classList.remove('hidden'); }
    }
}

function checkTileFree(tile) {
    const dirInfo = directions[tile.dir];
    let clear = true;
    tilesData.forEach(other => {
        if (other.removed) return;
        if (dirInfo.dx !== 0 && other.row === tile.row) {
            if (dirInfo.dx > 0 && other.col > tile.col) clear = false;
            if (dirInfo.dx < 0 && other.col < tile.col) clear = false;
        }
        if (dirInfo.dy !== 0 && other.col === tile.col) {
            if (dirInfo.dy > 0 && other.row > tile.row) clear = false;
            if (dirInfo.dy < 0 && other.row < tile.row) clear = false;
        }
    });
    return clear;
}

function flyOutTile(tile) {
    tile.removed = true;
    const dirInfo = directions[tile.dir];
    tile.element.style.transform = `translate(${dirInfo.dx * 2500}px, ${dirInfo.dy * 2500}px)`;
    tile.element.style.opacity = '0';
    if (tutorialActive && tile.isTarget) { removeTutorialHand(); tutorialActive = false; }
    setTimeout(() => {
        tile.element.remove();
        if (tilesData.every(t => t.removed)) {
            stopTimer(); coins += 25; saveGameData();
            victoryScreen.classList.remove('hidden');
        }
    }, 400); 
}

function useBooster(type, actionCallback) {
    if (lives <= 0 || tilesData.every(t => t.removed)) return;
    if (boosters[type] <= 0) {
        activeShopBoosterType = type;
        let names = { hint: '💡 Подсказка', bomb: '💣 Бомба', magnet: '🧲 Магнит' };
        shopTitle.innerText = names[type];
        shopScreen.classList.remove('hidden');
        return;
    }
    if (actionCallback()) { boosters[type]--; updateUI(); saveGameData(); }
}

hintBtn.addEventListener('click', () => useBooster('hint', () => {
    let validTile = tilesData.find(t => !t.removed && checkTileFree(t));
    if (validTile) { validTile.element.classList.add('hint-highlight'); return true; }
    return false;
}));

bombBtn.addEventListener('click', () => useBooster('bomb', () => {
    let activeTiles = tilesData.filter(t => !t.removed);
    if (activeTiles.length === 0) return false;
    activeTiles.sort(() => Math.random() - 0.5).slice(0, 3).forEach(tile => {
        tile.removed = true; tile.element.classList.add('bomb-exploding');
        setTimeout(() => tile.element.remove(), 300);
    });
    setTimeout(() => { if (tilesData.every(t => t.removed)) { stopTimer(); coins += 25; saveGameData(); victoryScreen.classList.remove('hidden'); } }, 320);
    return true;
}));

magnetBtn.addEventListener('click', () => useBooster('magnet', () => {
    let freeTiles = tilesData.filter(t => !t.removed && checkTileFree(t));
    if (freeTiles.length === 0) return false;
    freeTiles.slice(0, 5).forEach(tile => flyOutTile(tile));
    return true;
}));

buyBoosterBtn.addEventListener('click', () => {
    if (coins >= 500) { coins -= 500; boosters[activeShopBoosterType]++; updateUI(); saveGameData(); shopScreen.classList.add('hidden'); }
    else { shopScreen.classList.add('hidden'); errorScreen.classList.remove('hidden'); }
});

adBoosterBtn.addEventListener('click', () => {
    adBoosterBtn.innerText = 'Загрузка...'; adBoosterBtn.disabled = true;
    setTimeout(() => { boosters[activeShopBoosterType]++; updateUI(); saveGameData(); adBoosterBtn.innerText = 'Реклама (+1)'; adBoosterBtn.disabled = false; shopScreen.classList.add('hidden'); }, 2000);
});

coinsWidget.addEventListener('click', () => walletScreen.classList.remove('hidden'));

getAdCoinsBtn.addEventListener('click', () => {
    getAdCoinsBtn.innerText = 'Загрузка...'; getAdCoinsBtn.disabled = true;
    setTimeout(() => { coins += 200; updateUI(); saveGameData(); getAdCoinsBtn.innerText = 'Получить +200 Ⓜ️'; getAdCoinsBtn.disabled = false; walletScreen.classList.add('hidden'); }, 2000);
});

closeShopBtn.addEventListener('click', () => shopScreen.classList.add('hidden'));
closeWalletBtn.addEventListener('click', () => walletScreen.classList.add('hidden'));
closeErrorBtn.addEventListener('click', () => errorScreen.classList.add('hidden'));

let evHistory = []; 
let prevDiff = -1;
let movedMinimal = false;

boardWrapper.addEventListener('pointerdown', (e) => {
    evHistory.push(e);
    if (evHistory.length === 1) {
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        movedMinimal = false;
    }
});

boardWrapper.addEventListener('pointermove', (e) => {
    for (let i = 0; i < evHistory.length; i++) { if (e.pointerId === evHistory[i].pointerId) { evHistory[i] = e; break; } }
    if (evHistory.length === 2) {
        isDragging = false;
        let curDiff = Math.hypot(evHistory[0].clientX - evHistory[1].clientX, evHistory[0].clientY - evHistory[1].clientY);
        if (prevDiff > 0) {
            if (curDiff > prevDiff && currentZoom < 1.6) currentZoom += 0.03;
            else if (curDiff < prevDiff && currentZoom > 0.3) currentZoom -= 0.03;
            updateUI();
        }
        prevDiff = curDiff;
    } else if (evHistory.length === 1) {
        let newX = e.clientX - startX;
        let newY = e.clientY - startY;
        if (Math.abs(newX - translateX) > 5 || Math.abs(newY - translateY) > 5) {
            isDragging = true;
            movedMinimal = true;
            translateX = newX;
            translateY = newY;
            updateUI();
        }
    }
});

function stopTracking(e) { 
    evHistory = evHistory.filter(ev => ev.pointerId !== e.pointerId); 
    if (evHistory.length < 2) prevDiff = -1; 
    isDragging = false;
}
boardWrapper.addEventListener('pointerup', stopTracking);
boardWrapper.addEventListener('pointercancel', stopTracking);

board.addEventListener('click', (e) => {
    if (movedMinimal) { movedMinimal = false; return; }
    const clickedEl = e.target.closest('.tile');
    if (!clickedEl) return;
    const tile = tilesData.find(t => t.element === clickedEl);
    if (tile) handleTileClick(tile);
});

nextLevelBtn.addEventListener('click', () => { currentLevel++; saveGameData(); initGame(false); });
restartBtn.addEventListener('click', () => { initGame(true); });
zoomInBtn.addEventListener('click', () => { if(currentZoom < 1.6) { currentZoom += 0.15; updateUI(); } });
zoomOutBtn.addEventListener('click', () => { if(currentZoom > 0.3) { currentZoom -= 0.15; updateUI(); } });

window.onload = () => { loadGameData(); initGame(false); };
loadGameData();
    initGame(false);
}