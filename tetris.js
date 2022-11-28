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

const Blocks = {
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
        image: Blocks.LightBlue,
        shape: [
            [1, 1, 1, 1]
        ]
    },
    {
        name: 'J-Block',
        image: Blocks.Blue,
        shape: [
            [2, 0, 0, 0],
            [2, 2, 2, 2]
        ]
    },
    {
        name: 'L-Block',
        image: Blocks.Orange,
        shape: [
            [0, 0, 0, 3],
            [3, 3, 3, 3]
        ]
    },
    {
        name: 'O-Block',
        image: Blocks.Yellow,
        shape: [
            [4, 4],
            [4, 4]
        ]
    },
    {
        name: 'S-Block',
        image: Blocks.Green,
        shape: [
            [0, 5, 5],
            [5, 5, 0]
        ]
    },
    {
        name: 'T-Block',
        image: Blocks.Purple,
        shape: [
            [0, 6, 0],
            [6, 6, 6]
        ]
    },
    {
        name: 'Z-Block',
        image: Blocks.Red,
        shape: [
            [7, 7, 0],
            [0, 7, 7]
        ]
    }
];

let Playfield = [];

function init() {
    for (let i = 0; i < canvasHeight / blockSize; i++) {
        let row = [];
        for (let y = 0; y < canvasWidth / blockSize; y++) {
            row.push({
                image: null,
                active: false,
                x: y * blockSize,
                y: i * blockSize,
            });
        }
        Playfield.push(row);
    }
    centerX = Math.floor(Playfield[0].length / 2);
    drawGrid();
    loadImages().then(play);
}

function drawGrid() {
    gctx.strokeStyle = 'white';
    gctx.lineWidth = 3.5;
    gctx.fillStyle = "#a29bfe";

    gctx.fillRect(0, 0, canvasWidth, canvasHeight);

    gctx.beginPath();
    for (let x = 0; x <= canvasWidth; x += blockSize) {
        gctx.moveTo(x, 0);
        gctx.lineTo(x, canvasHeight);
    }
    for (let y = 0; y <= canvasHeight; y += blockSize) {
        gctx.moveTo(0, y);
        gctx.lineTo(canvasWidth, y);
    }
    gctx.stroke();
    gctx.closePath();
}

function loadImage(img, src) {
    return new Promise((resolve) => {
        img.src = src;
        img.onload = () => resolve();
    });
}

function loadImages() {
    return Promise.all([
        loadImage(Blocks.Blue, "assets/Blue.png"),
        loadImage(Blocks.Green, "assets/Green.png"),
        loadImage(Blocks.LightBlue, "assets/LightBlue.png"),
        loadImage(Blocks.Orange, "assets/Orange.png"),
        loadImage(Blocks.Purple, "assets/Purple.png"),
        loadImage(Blocks.Red, "assets/Red.png"),
        loadImage(Blocks.Yellow, "assets/Yellow.png")
    ]);
}

function drawBlock(block) {
    ctx.drawImage(block.image, block.x, block.y, blockSize, blockSize);
}

function spawnTetromino() {
    let tetromino = Tetrominos[Math.floor(Math.random() * Tetrominos.length)];
    //let tetromino = Tetrominos[3];
    let length = tetromino.shape[0].length;
    let halfLength = Math.floor(length / 2) + length % 2;
    let xSpawn = centerX - halfLength;

    for (let y = 0; y < tetromino.shape.length; y++) {
        let xLastSpawn = xSpawn;
        tetromino.shape[y].forEach(block => {
            if (block != 0) {
                Playfield[y][xLastSpawn].active = true;
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
            if (block.active == true) {
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

        let futureBlocksPositions = [];
        let canDescend = currentBlocksPositions.every(currentBlockPosition => {
            if (currentBlockPosition.i + 1 > Playfield.length - 1 // se esci fuori campo di gioco
                || (Playfield[currentBlockPosition.i + 1][currentBlockPosition.y].image != null // o se tocchi un altro blocco
                    && !currentBlocksPositions.includes(currentBlockPosition)) // che non è della tua figura
            ) {
                return false;
            }
            futureBlocksPositions.push({
                i: currentBlockPosition.i + 1,
                y: currentBlockPosition.y
            });
            return true;
        });

        console.log("canDescend:", canDescend, "futureBlocksPositions:", futureBlocksPositions);

        for (let i = 0; i < futureBlocksPositions.length; i++) {
            descendBlock(currentBlocksPositions[i], futureBlocksPositions[i]);
        }

        if(canDescend) refreshGrid();
        // else spawnTetromino();
    }, 100);
}

function descendBlock(currentBlockPosition, futureBlockPosition) {
    let currentBlock = Playfield[currentBlockPosition.i][currentBlockPosition.y];
    ctx.clearRect(currentBlock.x, currentBlock.y, blockSize, blockSize);
    let tmpBlockImg = Playfield[currentBlockPosition.i][currentBlockPosition.y].image;
    Playfield[currentBlockPosition.i][currentBlockPosition.y].active = false;
    Playfield[currentBlockPosition.i][currentBlockPosition.y].image = null;

    Playfield[futureBlockPosition.i][futureBlockPosition.y].image = tmpBlockImg;
    Playfield[futureBlockPosition.i][futureBlockPosition.y].active = true;
}

function play() {
    spawnTetromino();
}

init();