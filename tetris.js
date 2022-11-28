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
    id: 1,
    name: 'I-Block',
    block: Blocks.LightBlue,
    shape: [
        [1, 1, 1, 1]
    ]
},
{
    id: 2,
    name: 'J-Block',
    block: Blocks.Blue,
    shape: [
        [2, 0, 0, 0],
        [2, 2, 2, 2]
    ]
},
{
    id: 3,
    name: 'L-Block',
    block: Blocks.Orange,
    shape: [
        [0, 0, 0, 3],
        [3, 3, 3, 3]
    ]
},
{
    id: 4,
    name: 'O-Block',
    block: Blocks.Yellow,
    shape: [
        [4, 4],
        [4, 4]
    ]
},
{
    id: 5,
    name: 'S-Block',
    block: Blocks.Green,
    shape: [
        [0, 5, 5],
        [5, 5, 0]
    ]
},
{
    id: 6,
    name: 'T-Block',
    block: Blocks.Purple,
    shape: [
        [0, 6, 0],
        [6, 6, 6]
    ]
},
{
    id: 7,
    name: 'Z-Block',
    block: Blocks.Red,
    shape: [
        [7, 7, 0],
        [0, 7, 7]
    ]
}
];

let Playfield = [];

function init() {
    for(let i = 0; i < canvasHeight / blockSize; i++) {
        let row = [];
        for(let y = 0; y < canvasWidth / blockSize; y++) {
            row.push({
                block: null,
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
    gctx.strokeStyle = 'black';
    gctx.lineWidth = .5;
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

function drawBlock(block, x, y) {
    ctx.drawImage(block, x, y, blockSize, blockSize);
}

function spawnTetromino() {
    //let tetromino = Tetrominos[Math.floor(Math.random() * Tetrominos.length)];
    let tetromino = Tetrominos[3];
    let length = tetromino.shape[0].length;
    let halfLength = Math.floor(length / 2) + length % 2;
    let xSpawn = centerX - halfLength;

    for(let y = 0; y < tetromino.shape.length; y++) {
        let xLastSpawn = xSpawn;
        tetromino.shape[y].forEach(block => {
            if(block != 0) {
                Playfield[y][xLastSpawn].active = true;
                Playfield[y][xLastSpawn].block = tetromino.block;
            }
            xLastSpawn++;
        })
    }

    refreshGrid();
}

function refreshGrid() {
    let activeBlocksPositions = [];
    Playfield.forEach((line, i) => {
        line.forEach((block, y) => {
            if (block.active == true) {
                activeBlocksPositions.push({i: i, y: y});
                drawBlock(block.block, block.x, block.y);
            }
        });
    });

    activeBlocksPositions = activeBlocksPositions.reverse();

    setTimeout(() => {

        let futureBlocksPositions = [];
        let outOfBound = false;
        activeBlocksPositions.every(activeBlockPosition => {
            if(activeBlockPosition.i + 1 > Playfield.length - 1) {
                console.log("HO PRESO ER PALO");
                outOfBound = true;
                return false;
            }
            let futureBlockPosition = {i: activeBlockPosition.i + 1, y: activeBlockPosition.y};
            futureBlocksPositions.push(futureBlockPosition);
            return true;
        })
        
        // activeBlocksPositions
        // futureBlocksPositions

        for(let i = 0; i < futureBlocksPositions.length; i++) {
            descendBlock(activeBlocksPositions[i], futureBlocksPositions[i]);
        }

        refreshGrid();
    }, 1000);
}

function descendBlock(currentBlockPosition, futureBlockPosition) {
    let currentBlock = Playfield[currentBlockPosition.i][currentBlockPosition.y];
    ctx.clearRect(currentBlock.x, currentBlock.y, blockSize, blockSize);
    let tmpBlockImg = Playfield[currentBlockPosition.i][currentBlockPosition.y].block;
    Playfield[currentBlockPosition.i][currentBlockPosition.y].active = false;
    Playfield[currentBlockPosition.i][currentBlockPosition.y].block = null;

    Playfield[futureBlockPosition.i][futureBlockPosition.y].block = tmpBlockImg;
    Playfield[futureBlockPosition.i][futureBlockPosition.y].active = true;
}

function play() {
    spawnTetromino();
}

init();