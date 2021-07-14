window.onload = function() {
    const canvas = document.getElementById("viewport");
    const ctx = canvas.getContext("2d");

    let lastFrame = 0;
    let fpsTime = 0;
    let frameCount = 0;
    let fps = 0;

    let initialilsed = false;

    let images = [];
    let tileImage;

    let loadCount = 0;
    let loadTotal = 0;
    let preLoaded = false;

    function loadImages(imagefiles) {
        loadCount = 0;
        loadTotal = imagefiles.length;
        preLoaded = false;

        let loadedImages = [];
        for (let i=0; i<imagefiles.length; i++) {
            let image = new Image();

            image.onload = function () {
                loadCount++;
                if (loadCount == loadTotal) {
                    preLoaded = true;
                }
            };

            image.src = imagefiles[i];

            loadedImages[i] = image;
        }

        return loadedImages;
    }

    let Level = function (columns, rows, tilewidth, tileheight) {
        this.columns = columns;
        this.rows = rows;
        this.tilewidth = tilewidth;
        this.tileheight = tileheight;

        this.tiles = [];
        for (let i=0; i<this.columns; i++) {
            this.tiles[i] = [];
            for (let j=0; j<this.rows; j++) {
                this.tiles[i][j] = 0;
            }
        }
    };

    Level.prototype.generate = function() {
        for (let i=0; i<this.columns; i++) {
            for (let j =0; j<this.rows; j++) {
                if (i == 0 || i == this.columns - 1 || j == 0 || j == this.rows - 1) {
                    this.tiles[i][j] = 1;
                } else {
                    this.tiles[i][j] = 0;
                }
            }
        }
    };

    function Snake() {
        this.init(0, 0, 1, 10, 1);
    }

    Snake.prototype.directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];

    Snake.prototype.init = function(x, y, direction, speed, numSegments) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = speed;
        this.moveDelay = 0;

        this.segments = [];
        this.growSegments = 0;
        for (let i=0; i<numSegments; i++) {
            this.segments.push({x:this.x - i*this.directions[direction][0], y:this.y - i*this.directions[direction][1]});
        }
    }

    Snake.prototype.grow = function() {
        this.growSegments++;
    };

    Snake.prototype.tryMove = function(dt) {
        this.moveDelay += dt;
        let maxMoveDelay = 1 / this.speed;
        if (this.moveDelay > maxMoveDelay) {
            return true;
        }
        return false;
    };

    Snake.prototype.nextMove = function () {
        let nextx = this.x + this.directions[this.direction][0];
        let nexty = this.y + this.directions[this.direction][1];
        return {x:nextx, y:nexty};
    };

    Snake.prototype.move = function() {
        let nextMove = this.nextMove();
        this.x = nextMove.x;
        this.y = nextMove.y;

        let lastSeg = this.segments[this.segments.length -1];
        let growx = lastSeg.x;
        let growy = lastSeg.y;

        for (let i=this.segments.length-1; i>=1; i--) {
            this.segments[i].x = this.segments[i -1].x;
            this.segments[i].y = this.segments[i -1].y;
        };

        if (this.growSegments > 0) {
            this.segments.push({x:growx, y:growy});
            this.growSegments--;
        };

        this.segments[0].x = this.x;
        this.segments[0].y = this.y;

        this.moveDelay = 0;
    };

    let snake = new Snake();
    let level = new Level(20, 15, 32, 32);

    let score = 0;
    let gameOver = true;
    let gameOverTime = 1;
    let gameOverDelay = 0.5;

    function init() {
        images = loadImages(["furby-sprite-1.png"]);
        tileImage = images[0];

        canvas.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKeyDown);

        newGame();
        gameOver = true;

        main(0);

    };

    function tryNewGame() {
        if (gameOverTime > gameOverDelay) {
            newGame();
            gameOver = false;
        }
    };

    function newGame() {
        snake.init(10, 10, 1, 10, 4);

        level.generate();

        addDoughnut();

        score = 0;

        gameOver = false;
    };

    function addDoughnut() {
        let valid = false;
        while (!valid) {
            let ax = randRange(0, level.columns-1);
            let ay = randRange(0, level.rows-1);
            console.log(ax, ay)
            let overlap = false;
            for (let i=0; i<snake.segments.length; i++) {
                let sx = snake.segments[i].x;
                let sy = snake.segments[i].y;

                if (ax == sx && ay == sy) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap && level.tiles[ax][ay] == 0) {
                level.tiles[ax][ay] = 2;
                valid = true;
            }
        }
    };

    function main(timeframe) {
        window.requestAnimationFrame(main);

        if (!initialilsed) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let loadPercentage = loadCount/loadTotal;
            ctx.strokeStyle = "#ff8080";
            ctx.lineWidth = 3;
            ctx.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width -37,  32);
            ctx.fillStyle = "#ff8080";
            ctx.fillRect(18.5, 0.5 + canvas.height - 51, loadPercentage*(canvas.width-37), 32);

            let loadText = "Loaded " + loadCount + "/" + loadTotal + " images";
            ctx.fillStyle = "#000000";
            ctx.fint = "16px Verdana";
            ctx.fillText(loadText, 18, 0.5 + canvas.height - 63);
            
            if (preLoaded) {
                initialilsed = true;
            }
        } else {
            update(timeframe);
            render();
        }
    }

    function update(timeframe) {
        let dt = (timeframe - lastFrame) / 1000;
        lastFrame = timeframe;

        updateFps(dt);

        if (!gameOver) {
            updateGame(dt);
        } else {
            gameOverTime += dt;
        }
    };

    function updateGame(dt) {
        if (snake.tryMove(dt)) {
            let nextMove = snake.nextMove();
            let nx = nextMove.x;
            let ny = nextMove.y;

            if (nx >= 0 && nx < level.columns && ny >= 0 && ny < level.rows) {
                if (level.tiles[nx][ny] == 1) {
                    gameOver = true;
                }

                for (let i=0; i<snake.segments.length; i++) {
                    let sx = snake.segments[i].x;
                    let sy = snake.segments[i].y;
                    
                    if (nx == sx && ny == sy) {
                        gameOver = true;
                        break;
                    }
                };

                if (!gameOver) {
                    snake.move();

                    if (level.tiles[nx][ny] == 2) {
                        level.tiles[nx][ny] = 0;

                        addDoughnut()

                        snake.grow();

                        score++
                    }
                }
            } else {
                gameOver = true;
            }
            if (gameOver) {
                gameOverTime = 0;
            }
        }
    };

    function updateFps(dt) {
        if (fpsTime > 0.25) {
            fps = Math.round(frameCount / fpsTime);

            fpsTime = 0;
            frameCount = 0;
        }

        fpsTime += dt;
        frameCount++;
    }

    function render() {
        ctx.fillStyle = "#577ddb";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawLevel();
        drawSnake();

        if (gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#ffffff";
        ctx.font = "24px Verdana";
        drawCentreText("Press any key to start the furby machine", 0, canvas.height/2, canvas.width);
        }
    };

    function drawLevel() {
        for (let i=0; i<level.columns; i++) {
            for (let j=0; j<level.rows; j++) {
                let tile = level.tiles[i][j];
                let tilex = i*level.tilewidth;
                let tiley = j*level.tileheight;

                if (tile == 0) {
                    ctx.fillStyle = "#f7e697";
                    ctx.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 1) {
                    ctx.fillStyle = "#bcae76";
                    ctx.fillRect(tilex, tiley, level.tilewidth, level.tileheight);
                } else if (tile == 2) {
                    ctx.fillStyle = "#f7e697";
                    ctx.fillRect(tilex, tiley, level.tilewidth, level.tileheight);

                    let tx = 0;
                    let ty = 3;
                    let tilew = 64;
                    let tileh = 64;
                    ctx.drawImage(tileImage, tx*tilew, ty*tileh,tilew, tileh, tilex, tiley, level.tilewidth, level.tileheight);
                }
            }
        }
    };

    function drawSnake() {
        for (let i=0; i<snake.segments.length; i++) {
            let segment = snake.segments[i];
            let segx = segment.x;
            let segy = segment.y;
            let tilex = segx*level.tilewidth;
            let tiley = segy*level.tileheight;

            let tx = 0;
            let ty = 0;

            if (i == 0) {
                let nseg = snake.segments[i+1];
                if (segy < nseg.y) {
                    tx = 3; ty = 0;
                } else if (segx >nseg.x) {
                    tx = 4; ty = 0;
                } else if (segy > nseg.y) {
                    tx = 4; ty = 1;
                } else if (segx < nseg.x) {
                    tx = 3; ty = 1
                }
            } else if (i == snake.segments.length-1) {
                let pseg = snake.segments[i-1];
                if (pseg.y < segy) {
                    tx = 3; ty = 2;
                } else if (pseg.x > segx) {
                    tx = 4; ty = 2;
                } else if (pseg.y > segy) {
                    tx = 4, ty = 3;
                } else if (pseg.x < segx) {
                    tx = 3; ty = 3;
                }
            } else {
                let pseg = snake.segments[i-1];
                let nseg = snake.segments[i+1];
                if (pseg.x < segx && nseg.x > segx || nseg.x < segx && pseg.x > segx) {
                    tx = 1; ty= 0;
                } else if (pseg.x < segx && nseg.y > segy || nseg.x < segx && pseg.y > segy) {
                    tx = 2; ty =1;
                } else if (pseg.y < segy && nseg.y < segy || nseg.y < segy && pseg.y > segy) {
                    tx = 2; ty = 1;
                } else if (pseg.y < segy && nseg.x < segx || nseg.y < segy && pseg.x < segx) {
                    tx = 2; ty = 2;
                } else if (pseg.x > segx && nseg.y < segy || nseg.x > segx && pseg.y < segy) {
                    tx = 0; ty = 1;
                } else if (pseg.y > segy && nseg.x > segx || nseg.y > segy && pseg.x > segx) {
                    tx = 0; ty = 0;
                }
            }
            ctx.drawImage(tileImage, tx*64, ty*64, 64, 64, tilex, tiley, level.tilewidth, level.tileheight);
        }
    }

    function drawCentreText(text, x, y, width) {
        let textdim = ctx.measureText(text);
        ctx.fillText(text, x + (width-textdim.width)/2, y);
    }
    function randRange(low, high) {
        return Math.floor(low + Math.random()*(high-low+1));
    }

    function onMouseDown(e) {
        let pos = getMousePos(canvas, e);

        if (gameOver) {
            tryNewGame();
        } else {
            snake.direction = (snake.direction + 1) % snake.directions.length;
        }
    }

    function onKeyDown(e) {
        if (gameOver) {
            tryNewGame();
        } else {
            if (e.keyCode == 37 || e.keyCode == 65) {
                if (snake.direction != 1) {
                    snake.direction = 3;
                }
            } else if (e.keyCode == 38 || e.keyCode == 87) {
                if (snake.direction != 2) {
                    snake.direction = 0
                }
            } else if (e.keyCode == 39 || e.keyCode == 68) {
                if (snake.direction != 3) {
                    snake.direction = 1;
                }
            } else if (e.keyCode == 40 || e.keyCode == 83) {
                if (snake.direction != 0) {
                    snake.direction = 2
                }
            }

            if (e.keyCode ==32) {
                snake.grow();
            }
        }
    }

    function getMousePos(canvas, e) {
        let rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
            y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
        };
    }
    init();
}