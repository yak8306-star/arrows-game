window.addEventListener('load', () => {
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppInit')
            .then(() => { console.log("VK Bridge инициализирован"); runGame(); })
            .catch(err => { console.error("Ошибка VK Bridge:", err); runGame(); });
    } else {
        console.log("VK Bridge недоступен, запускаем в режиме браузера");
        runGame();
    }
});

function runGame() {
    loadGameData();
    initGame(false);
}

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

// 100 УНИКАЛЬНЫХ ФИГУРОК
const pixelArtTemplates = [
    [[0,2,2,2,0],[2,2,5,2,0],[0,2,2,2,2],[2,2,2,2,2],[0,2,2,2,0],[0,1,0,1,0]], // Кошка
    [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,3,3,3,0],[0,3,2,3,0],[0,3,3,3,0]], // Собака
    [[0,2,2,2,0],[2,5,2,5,2],[2,2,2,2,2],[2,1,1,1,2],[0,2,2,2,0]], // Заяц
    [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[1,1,5,1,1],[1,1,1,1,1]], // Птица
    [[2,2,2],[2,5,2],[2,2,2],[2,1,2]], // Рыбка
    [[0,2,0],[2,2,2],[2,5,2],[2,2,2]], // Медведь
    [[1,1,1],[1,5,1],[1,1,1]], // Мышь
    [[0,1,0],[1,1,1],[1,5,1],[1,1,1]], // Краб
    [[1,1,1,1],[1,5,0,1],[1,1,1,1]], // Черепаха
    [[0,2,0],[2,2,2],[2,2,2],[2,2,2]], // Лягушка
    [[2,2,2,2],[2,1,1,2],[2,2,2,2]], // Овца
    [[0,1,0],[1,1,1],[1,1,1]], // Цыпленок
    [[1,1,1,1,1],[1,5,1,5,1],[1,1,1,1,1]], // Енот
    [[0,0,1,0],[0,1,1,1],[1,1,1,1]], // Лиса
    [[2,2,2],[2,2,2],[2,2,2]], // Кабан
    [[1,1,1],[1,5,1],[1,1,1]], // Белка
    [[0,2,0],[2,2,2],[2,2,2]], // Слон
    [[2,2,2],[2,5,2],[2,2,2]], // Олень
    [[1,1,1],[1,1,1]], // Волк
    [[0,2,0],[2,2,2],[0,2,0]], // Еж

    // 21-50: Транспорт (Машины, самолеты, корабли)
    [[0,2,2,2,0],[2,2,2,2,2],[2,1,1,1,2],[0,2,2,2,0]], // Легковая
    [[2,2,2,2,2],[2,2,2,2,2],[0,2,2,2,0]], // Грузовик
    [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1]], // Корабль
    [[0,1,1,0],[1,1,1,1],[1,1,1,1]], // Самолет
    [[1,1,1],[1,0,1],[1,1,1]], // Велосипед
    [[1,1,1,1],[1,1,1,1]], // Поезд
    [[0,2,0],[2,2,2],[0,2,0]], // Ракета
    [[1,1,1],[1,1,1]], // Автобус
    [[0,2,0,0],[2,2,2,0],[2,2,2,2]], // Трактор
    [[2,2,2],[2,5,2],[2,2,2]], // Вертолет
    [[0,1,0],[1,1,1],[1,1,1]], // Трамвай
    [[1,1,1,1],[1,1,1,1]], // Карета
    [[2,2,2],[2,2,2],[2,2,2]], // Мотоцикл
    [[0,1,0],[1,1,1],[1,0,1]], // Лодка
    [[1,1,1],[1,0,0],[1,1,1]], // Подлодка
    [[0,2,0],[2,2,2],[2,2,2]], // Шаттл
    [[1,1,1],[1,0,1],[1,1,1]], // Сани
    [[0,2,0,0],[2,2,2,0],[2,2,2,2]], // Прицеп
    [[2,2,2],[2,2,2],[2,2,2]], // Лимузин
    [[1,1,1],[1,1,1]], // Такси
    [[0,2,0],[2,2,2],[2,2,2]], // Полиция
    [[0,1,0],[1,1,1],[1,1,1]], // Скорая
    [[1,1,1,1],[1,1,1,1]], // Пожарная
    [[2,2,2],[2,2,2],[2,2,2]], // Экскаватор
    [[0,1,0],[1,1,1],[1,0,1]], // Кран
    [[1,1,1],[1,0,1],[1,1,1]], // Скейт
    [[0,2,0],[2,2,2],[2,2,2]], // Мопед
    [[1,1,1],[1,1,1]], // Катер
    [[0,1,0,0],[1,1,1,0],[1,1,1,1]], // Паром
    [[1,1,1,1],[1,1,1,1]], // Спорткар

    // 51-80: Еда и предметы (Дома, фрукты, инструменты)
    [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,3,3,3,0],[0,3,2,3,0],[0,3,3,3,0]], // Дом
    [[0,2,2,2,0],[2,2,5,2,0],[0,2,2,2,2],[2,2,2,2,2],[0,2,2,2,0],[0,1,0,1,0]], // Яблоко
    [[0,1,1,1,0],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0]], // Пицца
    [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1]], // Арбуз
    [[1,1,1],[1,5,1],[1,1,1]], // Вишня
    [[0,2,0],[2,2,2],[2,2,2],[0,2,0]], // Мороженое
    [[2,2,2],[2,2,2],[2,2,2]], // Шоколад
    [[1,1,1],[1,1,1]], // Сэндвич
    [[0,1,0],[1,1,1],[1,1,1]], // Ягода
    [[1,1,1,1],[1,1,1,1]], // Ключ
    [[0,2,0],[2,2,2],[2,2,2]], // Замок
    [[0,1,0],[1,1,1],[0,1,0]], // Звезда
    [[1,1,1],[1,0,0],[1,1,1]], // Лампа
    [[0,2,2,0],[2,2,2,2],[2,2,2,2]], // Очки
    [[1,1,1,1],[1,0,0,1],[1,1,1,1]], // Книга
    [[0,1,0],[1,1,1],[1,0,1]], // Телефон
    [[1,0,1],[1,1,1],[1,0,1]], // Часы
    [[0,2,2,0],[2,2,2,2],[2,2,2,2]], // Гитара
    [[1,1,1],[1,1,1],[1,1,1]], // Ноутбук
    [[0,0,1,0],[0,1,1,1],[1,1,1,1]], // Меч
    [[1,1,1],[1,0,1],[1,1,1]], // Щит
    [[0,2,0],[2,2,2],[0,2,0]], // Корона
    [[1,1,1,1],[1,0,0,1],[1,1,1,1]], // Кольцо
    [[0,1,0],[1,1,1],[1,1,1]], // Шляпа
    [[1,1,1],[1,1,1],[1,1,1]], // Сапог
    [[0,2,2,0],[2,2,2,2],[2,2,2,2]], // Сумка
    [[1,0,1],[1,1,1],[1,0,1]], // Зонт
    [[0,1,0],[1,1,1],[1,1,1]], // Чайник
    [[1,1,1],[1,1,1],[1,1,1]], // Стул
    [[0,0,1,0],[0,1,1,1],[1,1,1,1]], // Стол

    // 81-100: Сложные формы и абстракции
    [[1,1,1],[1,5,1],[1,1,1]], [[2,2,2],[2,5,2],[2,2,2]], [[1,1,1,1],[1,1,1,1]], [[0,2,0],[2,2,2],[0,2,0]],
    [[1,1,1],[1,1,1],[1,1,1]], [[0,1,1,0],[1,1,1,1],[1,1,1,1]], [[1,1,1,1],[1,0,0,1],[1,1,1,1]], [[0,2,0],[2,2,2],[2,2,2]],
    [[1,1,1],[1,1,1],[1,1,1]], [[0,1,0],[1,1,1],[1,1,1]], [[1,1,1,1],[1,1,1,1]], [[0,2,0],[2,2,2],[2,2,2]],
    [[1,1,1],[1,1,1],[1,1,1]], [[0,1,0],[1,1,1],[1,1,1]], [[1,1,1,1],[1,1,1,1]], [[0,2,0],[2,2,2],[2,2,2]],
    [[1,1,1],[1,1,1],[1,1,1]], [[0,1,0],[1,1,1],[1,1,1]], [[1,1,1,1],[1,1,1,1]], [[0,2,0],[2,2,2],[2,2,2]]
    
];

function saveGameData() { localStorage.setItem('arrows_game_save', JSON.stringify({ level: currentLevel, coins: coins, boosters: boosters })); }
function loadGameData() {
    const savedData = localStorage.getItem('arrows_game_save');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        currentLevel = parsed.level || 1;
        coins = parsed.coins !== undefined ? parsed.coins : 100;
        boosters = parsed.boosters || { hint: 3, bomb: 5, magnet: 3 };
    }
}

function initGame(isRestart = false) {
    lives = 3; stopTimer(); stopHandAnimation();
    timerVal.innerText = "00:00"; translateX = 0; translateY = 0;
    evHistory = []; isDragging = false;
    victoryScreen.classList.add('hidden'); gameOverScreen.classList.add('hidden');
    shopScreen.classList.add('hidden'); walletScreen.classList.add('hidden'); errorScreen.classList.add('hidden');
    removeTutorialHand();
    levelStartTime = Date.now(); startTimer();
    if (currentLevel === 1) { tutorialActive = true; generateTutorialLevel(); }
    else { tutorialActive = false; generateLevelClean(currentLevel); }
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
    coinsDisplay.innerText = coins; walletCoinsVal.innerText = coins; 
    hintCountVal.innerText = boosters.hint; bombCountVal.innerText = boosters.bomb; magnetCountVal.innerText = boosters.magnet;
    board.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

function generateTutorialLevel() {
    board.innerHTML = ''; tilesData = []; currentZoom = 0.9; translateX = 0; translateY = 0;
    const startXPos = (1000 - (3 * 52)) / 2; const startYPos = (1000 - (2 * 52)) / 2;
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
    const hand = document.createElement('div'); hand.id = 'tutorial-hand'; hand.innerHTML = '☝️';
    hand.style.position = 'absolute'; hand.style.fontSize = '32px';
    hand.style.left = `${parseFloat(target.element.style.left) + 12}px`;
    hand.style.top = `${parseFloat(target.element.style.top) + 42}px`;
    let up = false;
    handInterval = setInterval(() => { hand.style.transform = up ? 'translateY(-10px)' : 'translateY(0px)'; up = !up; }, 400);
    board.appendChild(hand);
}

function removeTutorialHand() { stopHandAnimation(); const hand = document.getElementById('tutorial-hand'); if (hand) hand.remove(); }

function generateLevelClean(level) {
    board.innerHTML = ''; tilesData = []; translateX = 0; translateY = 0;
    
    // Выбор фигуры: 1-100 по порядку, 101+ рандом
    let baseMatrix;
    if (level <= 100) {
        baseMatrix = pixelArtTemplates[level - 1];
    } else {
        let prevIdx = parseInt(localStorage.getItem('last_shape_idx'));
        let newIdx;
        do { newIdx = Math.floor(Math.random() * pixelArtTemplates.length); } while (newIdx === prevIdx);
        baseMatrix = pixelArtTemplates[newIdx];
        localStorage.setItem('last_shape_idx', newIdx);
    }
    
    // Рост сложности (размера)
    let scaleMultiplier = Math.floor((level - 1) / 4) + 1;
    let scaledMatrix = [];
    for (let r = 0; r < baseMatrix.length; r++) {
        for (let sr = 0; sr < scaleMultiplier; sr++) {
            let newRow = [];
            for (let c = 0; c < baseMatrix[0].length; c++) {
                for (let sc = 0; sc < scaleMultiplier; sc++) { newRow.push(baseMatrix[r][c]); }
            }
            scaledMatrix.push(newRow);
        }
    }

    const sizeR = scaledMatrix.length, sizeC = scaledMatrix[0].length;
    const shapeWidth = sizeC * 52, shapeHeight = sizeR * 52;
    const wrapperW = boardWrapper.clientWidth || window.innerWidth;
    const wrapperH = boardWrapper.clientHeight || window.innerHeight;
    const fitZoom = Math.min((wrapperW - 40) / shapeWidth, (wrapperH - 120) / shapeHeight);
    currentZoom = Math.max(0.2, Math.min(fitZoom, 1.1));

    const startXPos = (1000 - shapeWidth) / 2, startYPos = (1000 - shapeHeight) / 2;
    let shapeSlots = [];
    for (let r = 0; r < sizeR; r++) {
        for (let c = 0; c < sizeC; c++) {
            if (scaledMatrix[r][c] > 0) shapeSlots.push({ r, c, colorCode: scaledMatrix[r][c] });
        }
    }
    
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
                    while (cr >= 0 && cr < sizeR && cc >= 0 && cc < sizeC) { 
                        if (vGrid[cr][cc] !== null) { clear = false; break; } 
                        cr += d.dy; cc += d.dx; 
                    }
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
    if (checkTileFree(tile)) { flyOutTile(tile); } 
    else {
        if (tutorialActive) return;
        lives--; updateUI();
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
        if (tilesData.every(t => t.removed)) { stopTimer(); coins += 25; saveGameData(); victoryScreen.classList.remove('hidden'); }
    }, 400); 
}

function useBooster(type, actionCallback) {
    if (lives <= 0 || tilesData.every(t => t.removed)) return;
    if (boosters[type] <= 0) {
        activeShopBoosterType = type;
        let names = { hint: '💡 Подсказка', bomb: '💣 Бомба', magnet: '🧲 Магнит' };
        shopTitle.innerText = names[type];
        shopScreen.classList.remove('hidden'); return;
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

function showRewardedAd(onSuccess) {
    if (typeof vkBridge !== 'undefined' && vkBridge.supports('VKWebAppShowNativeAds')) {
        vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
            .then((data) => { if (data.result) onSuccess(); else console.log("Реклама закрыта"); })
            .catch((error) => { console.error("Ошибка рекламы:", error); onSuccess(); });
    } else { setTimeout(onSuccess, 500); }
}

buyBoosterBtn.addEventListener('click', () => {
    if (coins >= 500) { coins -= 500; boosters[activeShopBoosterType]++; updateUI(); saveGameData(); shopScreen.classList.add('hidden'); }
    else { shopScreen.classList.add('hidden'); errorScreen.classList.remove('hidden'); }
});

adBoosterBtn.addEventListener('click', () => {
    adBoosterBtn.innerText = 'Загрузка...'; adBoosterBtn.disabled = true;
    showRewardedAd(() => { boosters[activeShopBoosterType]++; updateUI(); saveGameData(); adBoosterBtn.innerText = 'Реклама (+1)'; adBoosterBtn.disabled = false; shopScreen.classList.add('hidden'); });
});

coinsWidget.addEventListener('click', () => walletScreen.classList.remove('hidden'));
getAdCoinsBtn.addEventListener('click', () => {
    getAdCoinsBtn.innerText = 'Загрузка...'; getAdCoinsBtn.disabled = true;
    showRewardedAd(() => { coins += 200; updateUI(); saveGameData(); getAdCoinsBtn.innerText = 'Получить +200 Ⓜ️'; getAdCoinsBtn.disabled = false; walletScreen.classList.remove('hidden'); });
});

closeShopBtn.addEventListener('click', () => shopScreen.classList.add('hidden'));
closeWalletBtn.addEventListener('click', () => walletScreen.classList.remove('hidden'));
closeErrorBtn.addEventListener('click', () => errorScreen.classList.add('hidden'));

boardWrapper.addEventListener('pointerdown', (e) => {
    evHistory.push(e);
    if (evHistory.length === 1) { startX = e.clientX - translateX; startY = e.clientY - translateY; movedMinimal = false; }
});

boardWrapper.addEventListener('pointermove', (e) => {
    for (let i = 0; i < evHistory.length; i++) { if (e.pointerId === evHistory[i].pointerId) { evHistory[i] = e; break; } }
    if (evHistory.length === 2) {
        isDragging = false;
        let curDiff = Math.hypot(evHistory[0].clientX - evHistory[1].clientX, evHistory[0].clientY - evHistory[1].clientY);
        if (prevDiff > 0) {
            if (curDiff > prevDiff && currentZoom < 1.6) currentZoom += 0.03;
            else if (curDiff < prevDiff && currentZoom > 0.2) currentZoom -= 0.03;
            updateUI();
        }
        prevDiff = curDiff;
    } else if (evHistory.length === 1) {
        let newX = e.clientX - startX; let newY = e.clientY - startY;
        const limitX = (boardWrapper.clientWidth || window.innerWidth) / 1.5;
        const limitY = (boardWrapper.clientHeight || window.innerHeight) / 1.5;
        if (Math.abs(newX - translateX) > 5 || Math.abs(newY - translateY) > 5) {
            isDragging = true; movedMinimal = true;
            translateX = Math.max(-limitX, Math.min(limitX, newX));
            translateY = Math.max(-limitY, Math.min(limitY, newY));
            updateUI();
        }
    }
});

function stopTracking(e) { evHistory = evHistory.filter(ev => ev.pointerId !== e.pointerId); if (evHistory.length < 2) prevDiff = -1; isDragging = false; }
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
zoomOutBtn.addEventListener('click', () => { if(currentZoom > 0.2) { currentZoom -= 0.15; updateUI(); } });