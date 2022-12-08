"use strict";

// ----------------------- CLASSES -----------------------

class Tetromino { 
    constructor(name, image, shape) {
        this.name = name;
        this.image = image;
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
    positions = [];
    permitted = true;
}

class Block {
    constructor(image, falling, x, y) {
        this.image = image;
        this.falling = falling;
        this.x = x;
        this.y = y;
    }
}

class Playfield {
    constructor(canvas, blockSize) {
        this.blockSize = blockSize;
        this.blocks = [];
        this.canvas = canvas;
        this.canvasWidth = canvas.getAttribute("width");
        this.canvasHeight = canvas.getAttribute("height");
        this.ctx = canvas.getContext("2d");
        this.centerX = null;
        this.init();
    }
    init() {
        for (let i = 0; i < this.canvasHeight / this.blockSize; i++) {
            let row = [];
            for (let y = 0; y < this.canvasWidth / this.blockSize; y++) {
                row.push(new Block(null, false, y*this.blockSize, i*this.blockSize));
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

// --------------------- GLOBAL VARS ---------------------

/** @type {HTMLCanvasElement} */
const gridCanvas = document.getElementById("gridCanvas");

/** @type {HTMLCanvasElement} */
const gameCanvas = document.getElementById("gameCanvas");

const gctx = gridCanvas.getContext("2d");

const images = {
    Blue: new Image(),
    Green: new Image(),
    LightBlue: new Image(),
    Orange: new Image(),
    Purple: new Image(),
    Red: new Image(),
    Yellow: new Image()
};

const tetrominoList = [
    new Tetromino('I-Block', images.LightBlue, [
        [1, 1, 1, 1]
    ]),
    new Tetromino('J-Block', images.Blue, [
        [1, 0, 0, 0],
        [1, 1, 1, 1]
    ]),
    new Tetromino('L-Block', images.Orange, [
        [0, 0, 0, 1],
        [1, 1, 1, 1]
    ]),
    new Tetromino('O-Block', images.Yellow, [
        [1, 1],
        [1, 1]
    ]),
    new Tetromino('S-Block', images.Green, [
        [0, 1, 1],
        [1, 1, 0]
    ]),
    new Tetromino('T-Block', images.Purple, [
        [0, 1, 0],
        [1, 1, 1]
    ]),
    new Tetromino('Z-Block', images.Red, [
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

const playfield = new Playfield(gameCanvas, 35);

let currentBlocksPositions = [];

let fallInterval;
let gameOver = false;

// -------------------------------------------------------

function init() {
    drawGrid();
    document.addEventListener('keydown', function(event) {
        if(!gameOver) {
            if(event.code === 'KeyS' || event.code === 'ArrowDown') {
                move(directions.DOWN);
            } else if(event.code === 'KeyA' || event.code === 'ArrowLeft') {
                move(directions.LEFT);
            } else if(event.code === 'KeyD' || event.code === 'ArrowRight') {
                move(directions.RIGHT);
            } else if(event.code === 'Space' || event.code === 'KeyS') {
                move(directions.GROUND);
            }
        }
    });
    Promise.all([
        loadImage(images.Blue, "assets/Blue.png"),
        loadImage(images.Green, "assets/Green.png"),
        loadImage(images.LightBlue, "assets/LightBlue.png"),
        loadImage(images.Orange, "assets/Orange.png"),
        loadImage(images.Purple, "assets/Purple.png"),
        loadImage(images.Red, "assets/Red.png"),
        loadImage(images.Yellow, "assets/Yellow.png")
    ]).then(play);
}

function move(direction) {
    let nextBlocksPositions = getNextBlocksPositions(currentBlocksPositions, direction);
    if(nextBlocksPositions.permitted) {
        let img = playfield.getBlock(currentBlocksPositions[0]).image;
        // REMOVE OLD BLOCKS FROM PLAYFIELD AND CANVAS
        currentBlocksPositions.forEach(currentBlockPosition => {
            let oldBlock = playfield.getBlock(currentBlockPosition);
            oldBlock.falling = false;
            oldBlock.image = null;
            playfield.ctx.clearRect(oldBlock.x, oldBlock.y, playfield.blockSize, playfield.blockSize);
        });
        // UPDATE currentBlocksPositions
        // ADD NEW BLOCKS TO PLAYFIELD AND CANVAS
        currentBlocksPositions = nextBlocksPositions.positions;
        nextBlocksPositions.positions.forEach(nextBlockPosition => {
            let newBlock = playfield.getBlock(nextBlockPosition);
            newBlock.image = img;
            newBlock.falling = true;
            playfield.ctx.drawImage(newBlock.image, newBlock.x, newBlock.y, playfield.blockSize, playfield.blockSize);
        });
    } else if(direction === directions.DOWN) {
        currentBlocksPositions.forEach(currentBlockPosition => {
            playfield.getBlock(currentBlockPosition).falling = false;
        })
        spawnTetromino();
    }
}

function drawGrid() {
    gctx.strokeStyle = 'white';
    gctx.lineWidth = 3.3;
    gctx.fillStyle = "#a29bfe";
    gctx.fillRect(0, 0, playfield.canvasWidth, playfield.canvasHeight);
    for (let x = 0; x <= playfield.canvasWidth; x += playfield.blockSize) {
        gctx.moveTo(x, 0);
        gctx.lineTo(x, playfield.canvasHeight);
    }
    for (let y = 0; y <= playfield.canvasHeight; y += playfield.blockSize) {
        gctx.moveTo(0, y);
        gctx.lineTo(playfield.canvasWidth, y);
    }
    gctx.stroke();
}

function loadImage(img, src) {
    return new Promise((resolve) => {
        img.src = src;
        img.onload = () => resolve();
    });
}

function spawnTetromino() {

    let tetromino = tetrominoList[Math.floor(Math.random() * tetrominoList.length)];
    //let tetromino = tetrominoList[3];
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

    currentBlocksPositions = [];
    let nextBlocksPositions = getNextBlocksPositions(spawnPositions, directions.SPAWN);
    if(nextBlocksPositions.permitted) {
        nextBlocksPositions.positions.forEach(nextBlockPosition => {
            currentBlocksPositions.push(nextBlockPosition);
            let block = playfield.getBlock(new PlayfieldPosition(nextBlockPosition.i, nextBlockPosition.y));
            block.falling = true;
            block.image = tetromino.image;
            playfield.ctx.drawImage(block.image, block.x, block.y, playfield.blockSize, playfield.blockSize);
        });
        return true;
    } else {
        clearInterval(fallInterval);
        gameOver = true;
        console.log("HAI PERSO");
        return false;
    }
}

function getNextBlocksPositions(currentBlocksPositions, direction) {

    let nextTetrominoPositions = new NextTetrominoPositions();

    currentBlocksPositions.every(currentBlockPosition => {

        const futurePositionCalculator = {
            [directions.DOWN]: new PlayfieldPosition(currentBlockPosition.i + 1, currentBlockPosition.y),
            [directions.LEFT]: new PlayfieldPosition(currentBlockPosition.i, currentBlockPosition.y - 1),
            [directions.RIGHT]: new PlayfieldPosition(currentBlockPosition.i, currentBlockPosition.y + 1),
            [directions.GROUND]: null, //TODO
            [directions.SPAWN]: currentBlockPosition
        };

        let futurePosition = futurePositionCalculator[direction];

        if(isPositionOutside(futurePosition) || isPositionAlreadyOccupied(futurePosition)) {
            nextTetrominoPositions.positions = [];
            nextTetrominoPositions.permitted = false;
            return false;
        }
        nextTetrominoPositions.positions.push(futurePosition);
        return true;
    });

    return nextTetrominoPositions;
}

function isPositionOutside(futurePosition) {
    return (futurePosition.i > playfield.blocks.length - 1      // DOWN
        || futurePosition.y < 0                                 // LEFT
        || futurePosition.y > playfield.blocks[0].length - 1);  // RIGHT
}

function isPositionAlreadyOccupied(futurePosition) {
    let block = playfield.getBlock(futurePosition);
    return block.image != null && block.falling === false;
}

function play() {
    spawnTetromino()
    fallInterval = setInterval(() => {
        move(directions.DOWN)
    }, 500);
}

init();