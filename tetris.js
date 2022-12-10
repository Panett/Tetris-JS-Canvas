"use strict";

// ----------------------- CLASSES -----------------------

class Tetromino { 
    constructor(name, blockImages, shape) {
        this.name = name;
        this.blockImages = blockImages;
        this.shape = shape;
    }
}

class PlayfieldPosition {
    constructor(i, y) {
        this.i = i;
        this.y = y;
    }
}

class NextTetrominoPositions {
    constructor() {
        this.positions = [];
        this.permitted = true;
    }
}

class Block {
    constructor(blockImages, falling, x, y) {
        this.blockImages = blockImages;
        this.falling = falling;
        this.x = x;
        this.y = y;
    }
}

class Playfield {
    constructor(canvas, gridCanvas, blockSize) {
        this.blockSize = blockSize;
        this.blocks = [];
        this.currentBlocksPositions = [];
        this.lowestPossiblePositions = [];
        this.mainCtx = canvas.getContext("2d");
        this.gridCtx = gridCanvas.getContext("2d");
        this.canvasWidth = canvas.getAttribute("width");
        this.canvasHeight = canvas.getAttribute("height");
        this.centerX = null;
        this.init();
    }
    init() {
        for (let i = 0; i < this.canvasHeight / this.blockSize; i++) {
            let row = [];
            for (let y = 0; y < this.canvasWidth / this.blockSize; y++) {
                row.push(new Block(new BlockImages(null, null), false, y*this.blockSize, i*this.blockSize));
            }
            this.addRow(row);
        }
        this.centerX = Math.floor(this.getRow(0).length / 2);
    }
    getBlock(position) {
        return this.blocks[position.i][position.y];
    }
    getRow(i) {
        return this.blocks[i];
    }
    addRow(row) {
        this.blocks.push(row);
    }
}

class BlockImages {
    constructor(filled, empty) {
        this.filled = filled;
        this.empty = empty;
    }
}

// --------------------- GLOBAL VARS ---------------------

/** @type {HTMLCanvasElement} */
const gameGridCanvas = document.getElementById("gameGridCanvas");

/** @type {HTMLCanvasElement} */
const gameCanvas = document.getElementById("gameCanvas");

/** @type {HTMLCanvasElement} */
const nextTetrominoGridCanvas = document.getElementById("nextTetrominoGridCanvas");

/** @type {HTMLCanvasElement} */
const nextTetrominoCanvas = document.getElementById("nextTetrominoCanvas");

const blockImages = {
    blue: new BlockImages(new Image(), new Image()),
    green: new BlockImages(new Image(), new Image()),
    lightBlue: new BlockImages(new Image(), new Image()),
    orange: new BlockImages(new Image(), new Image()),
    purple: new BlockImages(new Image(), new Image()),
    red: new BlockImages(new Image(), new Image()),
    yellow: new BlockImages(new Image(), new Image())
};

const tetrominoList = [
    new Tetromino('I-Block', blockImages.lightBlue, [
        [1, 1, 1, 1]
    ]),
    new Tetromino('J-Block', blockImages.blue, [
        [1, 0, 0, 0],
        [1, 1, 1, 1]
    ]),
    new Tetromino('L-Block', blockImages.orange, [
        [0, 0, 0, 1],
        [1, 1, 1, 1]
    ]),
    new Tetromino('O-Block', blockImages.yellow, [
        [1, 1],
        [1, 1]
    ]),
    new Tetromino('S-Block', blockImages.green, [
        [0, 1, 1],
        [1, 1, 0]
    ]),
    new Tetromino('T-Block', blockImages.purple, [
        [0, 1, 0],
        [1, 1, 1]
    ]),
    new Tetromino('Z-Block', blockImages.red, [
        [1, 1, 0],
        [0, 1, 1]
    ])
]

const directions = {
    DOWN: "DOWN",
    RIGHT: "RIGHT",
    LEFT: "LEFT",
    GROUND: "GROUND",
    SPAWN: "SPAWN"
};

const gamePlayfield = new Playfield(gameCanvas, gameGridCanvas, 35);
const nextTetrominoPlayfield = new Playfield(nextTetrominoCanvas, nextTetrominoGridCanvas, 35);

let nextTetromino = null;
let fallInterval;
let gameOver = false;

// -------------------------------------------------------

function init() {
    drawGrid(gamePlayfield);
    drawGrid(nextTetrominoPlayfield);
    nextTetromino = tetrominoList[Math.floor(Math.random() * tetrominoList.length)];
    document.addEventListener('keydown', function(event) {
        if(!gameOver) {
            if(event.code === 'KeyS' || event.code === 'ArrowDown') {
                move(directions.DOWN);
            } else if(event.code === 'KeyA' || event.code === 'ArrowLeft') {
                move(directions.LEFT);
            } else if(event.code === 'KeyD' || event.code === 'ArrowRight') {
                move(directions.RIGHT);
            } else if(event.code === 'Space') {
                move(directions.GROUND);
            } else if(event.code === 'KeyQ') {
                rotate(directions.LEFT);
            } else if(event.code === 'KeyE') {
                rotate(directions.RIGHT);
            }
        }
    });
    return Promise.all([
        loadImage(blockImages.blue.filled, "assets/filled/Blue.png"),
        loadImage(blockImages.green.filled, "assets/filled/Green.png"),
        loadImage(blockImages.lightBlue.filled, "assets/filled/LightBlue.png"),
        loadImage(blockImages.orange.filled, "assets/filled/Orange.png"),
        loadImage(blockImages.purple.filled, "assets/filled/Purple.png"),
        loadImage(blockImages.red.filled, "assets/filled/Red.png"),
        loadImage(blockImages.yellow.filled, "assets/filled/Yellow.png"),

        loadImage(blockImages.blue.empty, "assets/empty/Blue.png"),
        loadImage(blockImages.green.empty, "assets/empty/Green.png"),
        loadImage(blockImages.lightBlue.empty, "assets/empty/LightBlue.png"),
        loadImage(blockImages.orange.empty, "assets/empty/Orange.png"),
        loadImage(blockImages.purple.empty, "assets/empty/Purple.png"),
        loadImage(blockImages.red.empty, "assets/empty/Red.png"),
        loadImage(blockImages.yellow.empty, "assets/empty/Yellow.png")
    ]);
}

function rotate(direction) {
    console.log(gamePlayfield.currentBlocksPositions);
}

function move(direction) {
    let nextBlocksPositions = getNextBlocksPositions(gamePlayfield.currentBlocksPositions, direction);
    if(nextBlocksPositions.permitted) {
        let img = {};
        img = Object.assign(img, gamePlayfield.getBlock(gamePlayfield.currentBlocksPositions[0]).blockImages);
        // REMOVE OLD BLOCKS FROM PLAYFIELD AND CANVAS
        gamePlayfield.currentBlocksPositions.forEach(currentBlockPosition => {
            let oldBlock = gamePlayfield.getBlock(currentBlockPosition);
            oldBlock.falling = false;
            oldBlock.blockImages.filled = null;
            gamePlayfield.mainCtx.clearRect(oldBlock.x, oldBlock.y, gamePlayfield.blockSize, gamePlayfield.blockSize);
        });
        // UPDATE currentBlocksPositions
        // ADD NEW BLOCKS TO PLAYFIELD AND CANVAS
        gamePlayfield.currentBlocksPositions = nextBlocksPositions.positions;
        nextBlocksPositions.positions.forEach(nextBlockPosition => {
            let newBlock = gamePlayfield.getBlock(nextBlockPosition);
            newBlock.blockImages.filled = img.filled;
            newBlock.falling = true;
            gamePlayfield.mainCtx.drawImage(newBlock.blockImages.filled, newBlock.x, newBlock.y, gamePlayfield.blockSize, gamePlayfield.blockSize);
        });
        // DELETE THE FINAL POSITION TO THE GROUND
        gamePlayfield.lowestPossiblePositions.forEach(position => {
            let block = gamePlayfield.getBlock(position);
            if(block.blockImages.empty !== null) {
                block.blockImages.empty = null;
                gamePlayfield.mainCtx.clearRect(block.x, block.y, gamePlayfield.blockSize, gamePlayfield.blockSize);
            }
        });
        // DRAW THE FINAL POSITION TO THE GROUND
        gamePlayfield.lowestPossiblePositions = findLowestPossiblePositions(gamePlayfield.currentBlocksPositions);
        gamePlayfield.lowestPossiblePositions.forEach(position => {
            if(!gamePlayfield.currentBlocksPositions.includes(position)) {
                let block = gamePlayfield.getBlock(position);
                block.blockImages.empty = img.empty;
                gamePlayfield.mainCtx.drawImage(img.empty, block.x, block.y, gamePlayfield.blockSize, gamePlayfield.blockSize);
            }
        });
    } else if(direction === directions.DOWN || direction === directions.GROUND) {
        gamePlayfield.currentBlocksPositions.forEach(currentBlockPosition => {
            gamePlayfield.getBlock(currentBlockPosition).falling = false;
        })
        spawnTetromino();
    }
}

function drawGrid(playfield) {
    let ctx = playfield.gridCtx;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3.3;
    ctx.fillStyle = "#cfccfa";
    ctx.fillRect(0, 0, playfield.canvasWidth, playfield.canvasHeight);
    for (let x = 0; x <= playfield.canvasWidth; x += playfield.blockSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, playfield.canvasHeight);
    }
    for (let y = 0; y <= playfield.canvasHeight; y += playfield.blockSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(playfield.canvasWidth, y);
    }
    ctx.stroke();
}

function loadImage(img, src) {
    return new Promise((resolve) => {
        img.src = src;
        img.onload = () => resolve();
    });
}

function calculateSpawnPositions(tetromino, playfield) {
    let length = tetromino.shape[0].length;
    let halfLength = Math.floor(length / 2) + length % 2;
    let xSpawn = playfield.centerX - halfLength;
    let spawnPositions = [];
    for (let y = 0; y < tetromino.shape.length; y++) {
        let xLastSpawn = xSpawn;
        tetromino.shape[y].forEach(tetrominoBlock => {
            if (tetrominoBlock === 1) {
                spawnPositions.push(new PlayfieldPosition(y, xLastSpawn));
            }
            xLastSpawn++;
        })
    }
    return spawnPositions;
}

function spawnTetromino() {
    let tetromino = nextTetromino;
    nextTetromino = tetrominoList[Math.floor(Math.random() * tetrominoList.length)];
    let spawnPositions = calculateSpawnPositions(tetromino, gamePlayfield);
    let nextTetrominoSpawnPositions = calculateSpawnPositions(nextTetromino, nextTetrominoPlayfield);

    // DRAW IN THE NEXT TETROMINO CANVAS
    nextTetrominoPlayfield.currentBlocksPositions.forEach(position => {
        let block = nextTetrominoPlayfield.getBlock(position);
        nextTetrominoPlayfield.mainCtx.clearRect(block.x, block.y, nextTetrominoPlayfield.blockSize, nextTetrominoPlayfield.blockSize);
    });
    nextTetrominoPlayfield.currentBlocksPositions = [];
    nextTetrominoSpawnPositions.forEach(position => {
        let offsetPosition = new PlayfieldPosition(position.i + 1, position.y);
        nextTetrominoPlayfield.currentBlocksPositions.push(offsetPosition);
        let block = nextTetrominoPlayfield.getBlock(offsetPosition);
        nextTetrominoPlayfield.mainCtx.drawImage(nextTetromino.blockImages.filled, block.x, block.y, nextTetromino.blockSize, nextTetromino.blockSize);
    });

    // DRAW IN THE MAIN TETROMINO CANVAS
    gamePlayfield.currentBlocksPositions = [];
    let nextBlocksPositions = getNextBlocksPositions(spawnPositions, directions.SPAWN);
    if(nextBlocksPositions.permitted) {
        nextBlocksPositions.positions.forEach(position => {
            gamePlayfield.currentBlocksPositions.push(position);
            let block = gamePlayfield.getBlock(position);
            block.falling = true;
            block.blockImages.filled = tetromino.blockImages.filled;
            gamePlayfield.mainCtx.drawImage(block.blockImages.filled, block.x, block.y, gamePlayfield.blockSize, gamePlayfield.blockSize);
        });
        // DRAW THE FINAL POSITION TO THE GROUND
        gamePlayfield.lowestPossiblePositions = findLowestPossiblePositions(gamePlayfield.currentBlocksPositions);
        gamePlayfield.lowestPossiblePositions.forEach(position => {
            let block = gamePlayfield.getBlock(position);
            gamePlayfield.mainCtx.drawImage(tetromino.blockImages.empty, block.x, block.y, gamePlayfield.blockSize, gamePlayfield.blockSize);
        });
        return true;
    } else {
        clearInterval(fallInterval);
        gameOver = true;
        console.log("HAI PERSO");
        return false;
    }
}

function findLowestPossiblePositions(currentBlocksPositions) {
    let found = false;
    let lastPossiblePosition = currentBlocksPositions;
    while(!found) {
        let nextBlocksPositions = getNextBlocksPositions(lastPossiblePosition, directions.DOWN);
        if(nextBlocksPositions.permitted) {
            lastPossiblePosition = nextBlocksPositions.positions;
        } else {
            found = true;
        }
    }
    return lastPossiblePosition;
}

function getNextBlocksPositions(currentBlocksPositions, direction) {

    let nextTetrominoPositions = new NextTetrominoPositions();

    if(direction === directions.GROUND) {
        nextTetrominoPositions.positions = findLowestPossiblePositions(currentBlocksPositions);
    } else {
        currentBlocksPositions.map(currentBlockPosition => {
            const futurePositionCalculator = {
                [directions.DOWN]: new PlayfieldPosition(currentBlockPosition.i + 1, currentBlockPosition.y),
                [directions.LEFT]: new PlayfieldPosition(currentBlockPosition.i, currentBlockPosition.y - 1),
                [directions.RIGHT]: new PlayfieldPosition(currentBlockPosition.i, currentBlockPosition.y + 1),
                DEFAULT: currentBlockPosition
            };
            return futurePositionCalculator[direction] || futurePositionCalculator['DEFAULT'];
        }).every(futurePosition => {
            if(isPositionOutside(futurePosition) || isPositionAlreadyOccupied(futurePosition)) {
                nextTetrominoPositions.positions = [];
                nextTetrominoPositions.permitted = false;
                return false;
            }
            nextTetrominoPositions.positions.push(futurePosition);
            return true;
        });
    }
    return nextTetrominoPositions;
}

function isPositionOutside(futurePosition) {
    return (futurePosition.i > gamePlayfield.blocks.length - 1      // DOWN
        || futurePosition.y < 0                                     // LEFT
        || futurePosition.y > gamePlayfield.blocks[0].length - 1);  // RIGHT
}

function isPositionAlreadyOccupied(futurePosition) {
    let block = gamePlayfield.getBlock(futurePosition);
    return block.blockImages.filled != null && block.falling === false;
}

function play() {
    console.log(gamePlayfield)
    spawnTetromino()
    fallInterval = setInterval(() => {
        move(directions.DOWN)
    }, 500);
}

init().then(play);