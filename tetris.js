/** @type {HTMLCanvasElement} */
const gridCanvas = document.getElementById("gridCanvas");

/** @type {HTMLCanvasElement} */
const gameCanvas = document.getElementById("gameCanvas");

const gctx = gridCanvas.getContext("2d");
const ctx = gameCanvas.getContext("2d");

const canvasWidth = gameCanvas.getAttribute("width");
const canvasHeight = gameCanvas.getAttribute("height");
const blockSize = 35
let centerX;

const Images = {
    Blue: new Image(),
    Green: new Image(),
    LightBlue: new Image(),
    Orange: new Image(),
    Purple: new Image(),
    Red: new Image(),
    Yellow: new Image()
};

const Tetrominos = [{
        name: 'I-Block',
        image: Images.LightBlue,
        shape: [
            [1, 1, 1, 1]
        ]
    },
    {
        name: 'J-Block',
        image: Images.Blue,
        shape: [
            [2, 0, 0, 0],
            [2, 2, 2, 2]
        ]
    },
    {
        name: 'L-Block',
        image: Images.Orange,
        shape: [
            [0, 0, 0, 3],
            [3, 3, 3, 3]
        ]
    },
    {
        name: 'O-Block',
        image: Images.Yellow,
        shape: [
            [4, 4],
            [4, 4]
        ]
    },
    {
        name: 'S-Block',
        image: Images.Green,
        shape: [
            [0, 5, 5],
            [5, 5, 0]
        ]
    },
    {
        name: 'T-Block',
        image: Images.Purple,
        shape: [
            [0, 6, 0],
            [6, 6, 6]
        ]
    },
    {
        name: 'Z-Block',
        image: Images.Red,
        shape: [
            [7, 7, 0],
            [0, 7, 7]
        ]
    }
];

let Playfield = [];

const Directions = {
    DOWN: "DOWN",
    RIGHT: "RIGHT",
    LEFT: "LEFT"
};

function init() {
    for (let i = 0; i < canvasHeight / blockSize; i++) {
        let row = [];
        for (let y = 0; y < canvasWidth / blockSize; y++) {
            row.push({
                image: null,
                descending: false,
                x: y * blockSize,
                y: i * blockSize,
            });
        }
        Playfield.push(row);
    }
    centerX = Math.floor(Playfield[0].length / 2);
    drawGrid();
    loadImages().then(() => spawnTetromino());
}

function drawGrid() {
    gctx.strokeStyle = 'white';
    gctx.lineWidth = 3.3;
    gctx.fillStyle = "#a29bfe";
    gctx.fillRect(0, 0, canvasWidth, canvasHeight);
    for (let x = 0; x <= canvasWidth; x += blockSize) {
        gctx.moveTo(x, 0);
        gctx.lineTo(x, canvasHeight);
    }
    for (let y = 0; y <= canvasHeight; y += blockSize) {
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
        loadImage(Images.Blue, "assets/Blue.png"),
        loadImage(Images.Green, "assets/Green.png"),
        loadImage(Images.LightBlue, "assets/LightBlue.png"),
        loadImage(Images.Orange, "assets/Orange.png"),
        loadImage(Images.Purple, "assets/Purple.png"),
        loadImage(Images.Red, "assets/Red.png"),
        loadImage(Images.Yellow, "assets/Yellow.png")
    ]);
}

function drawBlock(block) {
    ctx.drawImage(block.image, block.x, block.y, blockSize, blockSize);
}

function spawnTetromino(currentBlocksPositions) {

    if(currentBlocksPositions != undefined) {
        currentBlocksPositions.forEach(currentBlockPosition => {
            Playfield[currentBlockPosition.i][currentBlockPosition.y].descending = false;
        })
    }

    let tetromino = Tetrominos[Math.floor(Math.random() * Tetrominos.length)];
    //let tetromino = Tetrominos[3];
    let length = tetromino.shape[0].length;
    let halfLength = Math.floor(length / 2) + length % 2;
    let xSpawn = centerX - halfLength;

    for (let y = 0; y < tetromino.shape.length; y++) {
        let xLastSpawn = xSpawn;
        tetromino.shape[y].forEach(block => {
            if (block != 0) {
                Playfield[y][xLastSpawn].descending = true;
                Playfield[y][xLastSpawn].image = tetromino.image;
            }
            xLastSpawn++;
        })
    }

    refreshGrid();
}

function refreshGrid() {
    let currentBlocksPositions = [];
    Playfield.forEach((line, i) => {
        line.forEach((block, y) => {
            if (block.descending == true) {
                currentBlocksPositions.push({
                    i: i,
                    y: y
                });
                drawBlock(block);
            }
        });
    });

    currentBlocksPositions = currentBlocksPositions.reverse();

    setTimeout(() => {

        let futureBlocksPositions = getFutureBlockPositions(currentBlocksPositions, Directions.DOWN);
        let canDescend = futureBlocksPositions.length > 0 ? true : false;
        console.log("canDescend:", canDescend, "futureBlocksPositions:", futureBlocksPositions);

        for (let i = 0; i < futureBlocksPositions.length; i++) {
            descendBlock(currentBlocksPositions[i], futureBlocksPositions[i]);
        }

        if (canDescend) {
            refreshGrid();
        }
        else {
            spawnTetromino(currentBlocksPositions);
        }
    }, 100);
}

function getFutureBlockPositions(currentBlocksPositions, direction) {
    let futureBlocksPositions = [];
    if (direction == Directions.DOWN) {
        currentBlocksPositions.every(currentBlockPosition => {
            // stai uscendo fuori dal campo di gioco (in basso)?
            let isGoingOutside = currentBlockPosition.i + 1 > Playfield.length - 1;
            
            if(isGoingOutside) {
                return false;
            }

            // tocchi un altro blocco?
            let isColliding = Playfield[currentBlockPosition.i + 1][currentBlockPosition.y].image != null;
            // è della tua figura?
            let isYourBlock = currentBlocksPositions.includes(currentBlockPosition);

            if (isColliding && !isYourBlock) {
                console.log("AAAAAAAAAAAAAAAAAAAAAAAA")
                futureBlocksPositions = [];
                return false;
            }
            futureBlocksPositions.push({
                i: currentBlockPosition.i + 1,
                y: currentBlockPosition.y
            });
            return true;
        });
    }
    return futureBlocksPositions;
}

function descendBlock(currentBlockPosition, futureBlockPosition) {
    let currentBlock = Playfield[currentBlockPosition.i][currentBlockPosition.y];
    ctx.clearRect(currentBlock.x, currentBlock.y, blockSize, blockSize);
    let tmpBlockImg = Playfield[currentBlockPosition.i][currentBlockPosition.y].image;
    Playfield[currentBlockPosition.i][currentBlockPosition.y].descending = false;
    Playfield[currentBlockPosition.i][currentBlockPosition.y].image = null;

    Playfield[futureBlockPosition.i][futureBlockPosition.y].image = tmpBlockImg;
    Playfield[futureBlockPosition.i][futureBlockPosition.y].descending = true;
}

init();