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
    descend(fromPosition, toPosition) {
        let fromBlock = this.getBlock(fromPosition);
        let tmpBlockImg = fromBlock.image;
        fromBlock.descending = false;
        fromBlock.image = null;

        let toBlock = this.getBlock(toPosition);
        ctx.clearRect(fromBlock.x, fromBlock.y, this._blockSize, this._blockSize);
        toBlock.image = tmpBlockImg;
        toBlock.descending = true;
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

const playfield = new Playfield(35);

const directions = {
    DOWN: "DOWN",
    RIGHT: "RIGHT",
    LEFT: "LEFT"
};

function init() {
    drawGrid();
    loadImages().then(() => spawnTetromino());
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

    let tetromino = tetrominoList[Math.floor(Math.random() * tetrominoList.length)];
    //let tetromino = tetrominoList[3];
    let length = tetromino.shape[0].length;
    let halfLength = Math.floor(length / 2) + length % 2;
    let xSpawn = playfield.centerX - halfLength;

    for (let y = 0; y < tetromino.shape.length; y++) {
        let xLastSpawn = xSpawn;
        tetromino.shape[y].forEach(tetrominoBlock => {
            if (tetrominoBlock === 1) {
                let block = playfield.getBlock(new PlayfieldPosition(y, xLastSpawn));
                block.descending = true;
                block.image = tetromino.image;
            }
            xLastSpawn++;
        })
    }

    updateDescendingTetromino();
}

function updateDescendingTetromino() {
    let currentBlocksPositions = [];
    playfield.blocks.forEach((row, i) => {
        row.forEach((block, y) => {
            if (block.descending) {
                currentBlocksPositions.push(new PlayfieldPosition(i, y));
                drawBlock(block);
            }
        });
    });

    currentBlocksPositions = currentBlocksPositions.reverse();

    setTimeout(() => {

        let futureBlocksPositions = getFutureBlockPositions(currentBlocksPositions, directions.DOWN);
        let canDescend = futureBlocksPositions.length > 0;
        //console.log("canDescend:", canDescend, "futureBlocksPositions:", futureBlocksPositions);

        for (let i = 0; i < futureBlocksPositions.length; i++) {
            playfield.descend(currentBlocksPositions[i], futureBlocksPositions[i]);
        }

        if (canDescend) {
            updateDescendingTetromino();
        }
        else {
            currentBlocksPositions.forEach(currentBlockPosition => {
                playfield.getBlock(currentBlockPosition).descending = false;
            })
            spawnTetromino(currentBlocksPositions);
        }
    }, 100);
}

function getFutureBlockPositions(currentBlocksPositions, direction) {
    let futureBlocksPositions = [];
    if (direction === directions.DOWN) {
        currentBlocksPositions.every(currentBlockPosition => {

            let futurePosition = new PlayfieldPosition(currentBlockPosition.i + 1, currentBlockPosition.y);

            // usciresti fuori dal campo di gioco (in basso)?
            let isGoingOutside = futurePosition.i > playfield.blocks.length - 1;

            if(isGoingOutside) {
                return false;
            }

            // andresti sopra un altro blocco?
            let isColliding = playfield.getBlock(futurePosition).image != null;
            // è della tua figura?
            let isYourBlock = currentBlocksPositions.includes(futurePosition);

            isYourBlock = true;

            if (isColliding && !isYourBlock) {
                futureBlocksPositions = [];
                return false;
            }
            futureBlocksPositions.push(futurePosition);
            return true;
        });
    }
    return futureBlocksPositions;
}

init();