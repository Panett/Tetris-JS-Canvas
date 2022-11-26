/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

ctx.strokeStyle = 'black';
ctx.lineWidth = .5;

const canvasWidth = 350
const canvasHeight = 700
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
    ctx.beginPath();
    for (let x = 0; x <= canvasWidth; x += blockSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
    }
    for (let y = 0; y <= canvasHeight; y += blockSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
    }
    ctx.closePath();
    ctx.stroke();
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
    
    let tetromino = Tetrominos[Math.floor(Math.random() * Tetrominos.length)];
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
    let activeBlocks = [];
    Playfield.forEach(line => {
        line.forEach((block) => {
            if (block.active == true) {
                activeBlocks.push(block);
                drawBlock(block.block, block.x, block.y);
            }
        });
    });
    
    setTimeout(() => {
        activeBlocks.forEach(block => {
            //let offset = ctx.lineWidth+.3;
            //let blockPlusLineSize = blockSize+offset;
            //console.log(blockPlusLineSize);
            //ctx.clearRect(block.x-offset, block.y-offset, blockPlusLineSize, blockPlusLineSize);
        })
    }, 1000);
}



function play() {
    console.log(Playfield)
    spawnTetromino();
}

init();