"use strict";

/** @type {HTMLCanvasElement} */
const gridCanvas = document.getElementById("gridCanvas");

/** @type {HTMLCanvasElement} */
const gameCanvas = document.getElementById("gameCanvas");

const gctx = gridCanvas.getContext("2d");
const ctx = gameCanvas.getContext("2d");

const canvasWidth = gameCanvas.getAttribute("width");
const canvasHeight = gameCanvas.getAttribute("height");

class Tetromino { 
    constructor(name, image, shape) {
        this._name = name;
        this._image = image;
        this._shape = shape;
    }
    get name() {
        return this._name;
    }
    get image() {
        return this._image;
    }
    get shape() {
        return this._shape;
    }
}

class PlayfieldPosition {
    constructor(i, y) {
        this._i = i;
        this._y = y;
    }
    get i() {
        return this._i;
    }
    get y() {
        return this._y;
    }
}

class NextTetrominoPositions {
    positions = [];
    permitted = true;
    ignore = false;
}

class Block {
    constructor(image, descending, x, y) {
        this._image = image;
        this._descending = descending;
        this._x = x;
        this._y = y;
    }
    get image() {
        return this._image;
    }
    get descending() {
        return this._descending;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    set image(value) {
        this._image = value;
    }
    set descending(value) {
        this._descending = value;
    }
}

class Playfield {
    constructor(blockSize) {
        this._blockSize = blockSize;
        this._blocks = [];
        this._centerX = null;
        this.init();
    }
    get blockSize() {
        return this._blockSize;
    }
    get blocks() {
        return this._blocks;
    }
    get centerX() {
        return this._centerX;
    }
    init() {
        for (let i = 0; i < canvasHeight / this._blockSize; i++) {
            let row = [];
            for (let y = 0; y < canvasWidth / this._blockSize; y++) {
                row.push(new Block(null, false, y*this._blockSize, i*this._blockSize));
            }
            this.addRow(row);
        }
        this._centerX = Math.floor(this.getRow(0).length / 2);
    }
    getBlock(position) {
        return this._blocks[position.i][position.y];
    }
    getRow(i) {
        return this._blocks[i];
    }
    addRow(row) {
        this._blocks.push(row);
    }
}

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

const playfield = new Playfield(35);

let currentBlocksPositions = [];

let descendInterval;
let gameOver = false;

function init() {
    drawGrid();
    document.addEventListener('keydown', function(event) {
        if(!gameOver) {
            if(event.code == 'KeyS') {
                move(directions.DOWN);
            } else if(event.code == 'KeyA') {
                move(directions.LEFT);
            } else if(event.code == 'KeyD') {
                move(directions.RIGHT);
            } else if(event.code == 'Space') {
                move(directions.GROUND);
            }
        }
    });
    loadImages().then(() => play());
}

function move(direction) {
    let nextTetrominoPositions = getNextBlockPositions(currentBlocksPositions, direction);
    if(nextTetrominoPositions.permitted) {
        // MOVE BLOCKS IN THE PLAYFIELD
        // REMOVE OLD BLOCKS FROM THE CANVAS
        for (let i = 0; i < nextTetrominoPositions.positions.length; i++) {
            // FROM
            let fromBlock = playfield.getBlock(currentBlocksPositions[i]);
            let img = fromBlock.image;
            fromBlock.descending = false;
            fromBlock.image = null;
            // TO
            let toBlock = playfield.getBlock(nextTetrominoPositions.positions[i]);
            ctx.clearRect(fromBlock.x, fromBlock.y, playfield.blockSize, playfield.blockSize);
            toBlock.image = img;
            toBlock.descending = true;
        }
        drawDescendingBlocks();
    } else if(nextTetrominoPositions.ignore) {
        //DO NOTHING
    } else {
        currentBlocksPositions.forEach(currentBlockPosition => {
            playfield.getBlock(currentBlockPosition).descending = false;
        })
        spawnTetromino();
    }
}

function drawGrid() {
    gctx.strokeStyle = 'white';
    gctx.lineWidth = 3.3;
    gctx.fillStyle = "#a29bfe";
    gctx.fillRect(0, 0, canvasWidth, canvasHeight);
    for (let x = 0; x <= canvasWidth; x += playfield.blockSize) {
        gctx.moveTo(x, 0);
        gctx.lineTo(x, canvasHeight);
    }
    for (let y = 0; y <= canvasHeight; y += playfield.blockSize) {
        gctx.moveTo(0, y);
        gctx.lineTo(canvasWidth, y);
    }
    gctx.stroke();
}

function loadImage(img, src) {
    return new Promise((resolve) => {
        img.src = src;
        img.onload = () => resolve();
    });
}

function loadImages() {
    return Promise.all([
        loadImage(images.Blue, "assets/Blue.png"),
        loadImage(images.Green, "assets/Green.png"),
        loadImage(images.LightBlue, "assets/LightBlue.png"),
        loadImage(images.Orange, "assets/Orange.png"),
        loadImage(images.Purple, "assets/Purple.png"),
        loadImage(images.Red, "assets/Red.png"),
        loadImage(images.Yellow, "assets/Yellow.png")
    ]);
}

function drawBlock(block) {
    ctx.drawImage(block.image, block.x, block.y, playfield.blockSize, playfield.blockSize);
}

function spawnTetromino() {

    //let tetromino = tetrominoList[Math.floor(Math.random() * tetrominoList.length)];
    let tetromino = tetrominoList[3];
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

    let nextBlockPositions = getNextBlockPositions(spawnPositions, directions.SPAWN);
    if(nextBlockPositions.permitted) {
        spawnPositions.forEach(spawnPositions => {
            let block = playfield.getBlock(new PlayfieldPosition(spawnPositions.i, spawnPositions.y));
            block.descending = true;
            block.image = tetromino.image;
        })
        drawDescendingBlocks();
        return true;
    } else {
        clearInterval(descendInterval);
        gameOver = true;
        console.log("HAI PERSO");
        return false;
    }
}

function drawDescendingBlocks() {
    currentBlocksPositions = [];
    playfield.blocks.forEach((row, i) => {
        row.forEach((block, y) => {
            if (block.descending) {
                currentBlocksPositions.push(new PlayfieldPosition(i, y));
                drawBlock(block);
            }
        });
    });
    currentBlocksPositions = currentBlocksPositions.reverse();
}

function getNextBlockPositions(currentBlocksPositions, direction) {

    let nextTetrominoPositions = new NextTetrominoPositions();

    currentBlocksPositions.every(currentBlockPosition => {
        let futurePosition;

        if(direction === directions.DOWN) {
            futurePosition = new PlayfieldPosition(currentBlockPosition.i + 1, currentBlockPosition.y);
        } else if(direction === directions.LEFT) {
            futurePosition = new PlayfieldPosition(currentBlockPosition.i, currentBlockPosition.y - 1);
            nextTetrominoPositions.ignore = true;
        } else if(direction === directions.RIGHT) {
            futurePosition = new PlayfieldPosition(currentBlockPosition.i, currentBlockPosition.y + 1);
            nextTetrominoPositions.ignore = true;
        } else if (direction === directions.GROUND) {
            // TODO
        } else if(direction === directions.SPAWN) {
            futurePosition = currentBlockPosition;
        }

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
    return futurePosition.i > playfield.blocks.length - 1
        || futurePosition.y > playfield.blocks[0].length
        || futurePosition.y < 0;
}

function isPositionAlreadyOccupied(futurePosition) {
    let block = playfield.getBlock(futurePosition);
    return block.image != null && block.descending === false;
}

function play() {
    spawnTetromino()
    descendInterval = setInterval(() => {
        move(directions.DOWN)
    }, 100);
}

init();