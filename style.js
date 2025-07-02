//Get the WebGL rendering context for our canvas(rendering area)
const canvas = document.getElementById('gameCanvas');
const gl = canvas.getContext('webgl');

// Initializing WebGL with alpha and blending
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.clearColor(0.0, 0.0, 0.1, 1.0);  // Dark blue base color

if (!gl) {
    alert('WebGL not supported');
    throw new Error('WebGL not supported');
}

// Set canvas size
function resizeCanvas() {

    canvas.width = 1200;
    canvas.height = 900;
    canvas.style.color = 'black';

    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.style.display = 'block';
    canvas.style.margin = 'auto';
    gl.viewport(0, 0, canvas.width, canvas.height);
}
resizeCanvas();


// Audio Manager Class
class AudioManager {
    constructor() {
        // Background music for different screens
        this.music = {
            start: new Audio('./music/intro.mp3'),
            game: new Audio('./music/ingame.mp3'),
            gameOver: new Audio('./music/gameover.mp3')
        };

        // Sound effects
        this.sfx = {
            buttonClick: new Audio('./music/buttonClick.wav'),
            fire: new Audio('./music/fire4.mp3'),
            bulletAsteroid: new Audio('./music/asteroidDestroy.mp3'),
            shipAsteroid: new Audio('./music/gameover2.mp3'),
            enemyBulletPlayer: new Audio('./music/gameover2.mp3'),
            loseLife: new Audio('./music/lose-life.mp3')
        };

        // default volumes
        this.musicVolume = 0.5;
        this.sfxVolume = 0.6;

        // Configuring background music
        Object.values(this.music).forEach(music => {
            music.loop = true;
            try {
                music.volume = this.validateVolume(this.musicVolume);
            } catch (error) {
                console.warn('Error setting music volume:', error);
            }
        });

        // Configuring sound effects (default volume)
        Object.values(this.sfx).forEach(sfx => {
            try {
                sfx.volume = this.validateVolume(this.sfxVolume);
            } catch (error) {
                console.warn('Error setting SFX volume:', error);
            }
        });

        // Set fire sound to very low volume(very noisy)
        try {
            this.sfx.fire.volume = this.validateVolume(0.05);
        } catch (error) {
            console.warn('Error setting fire sound volume:', error);
        }

        this.currentMusic = null;
    }

    // Validate and sanitize volume value
    validateVolume(volume) {
        const parsedVolume = parseFloat(volume);
        if (isNaN(parsedVolume) || !isFinite(parsedVolume)) {
            return 0.5;
        }
        return Math.max(0, Math.min(1, parsedVolume));
    }

    playSfx(type) {
        if (this.sfx[type]) {
            const sound = this.sfx[type].cloneNode();
            try {
                // Set volume based on type
                if (type === 'fire') {
                    sound.volume = this.validateVolume(0.05);
                } else {
                    sound.volume = this.validateVolume(this.sfxVolume);
                }
                sound.play().catch(error => {
                    console.warn(`Failed to play SFX: ${type}`, error);
                });
            } catch (error) {
                console.warn(`Error setting volume for ${type}:`, error);
            }
        }
    }

    playSFX(type) {
        return this.playSfx(type);
    }

    playMusic(type) {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }

        if (this.music[type]) {
            this.currentMusic = this.music[type];
            this.currentMusic.play().catch(error => {
                console.warn(`Failed to play music: ${type}`, error);
            });
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = this.validateVolume(volume);
        Object.values(this.music).forEach(music => {
            try {
                music.volume = this.musicVolume;
            } catch (error) {
                console.warn('Error setting music volume:', error);
            }
        });
    }

    setSfxVolume(volume) {
        this.sfxVolume = this.validateVolume(volume);
        Object.values(this.sfx).forEach(sfx => {
            try {
                if (sfx === this.sfx.fire) {
                    sfx.volume = this.validateVolume(0.05);
                } else {
                    sfx.volume = this.sfxVolume;
                }
            } catch (error) {
                console.warn('Error setting SFX volume:', error);
            }
        });
    }

    stopAll() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        Object.values(this.sfx).forEach(sfx => {
            sfx.pause();
            sfx.currentTime = 0;
        });
    }
}

// Global audio manager instance
const audioManager = new AudioManager();

// Create a StarField class to manage the space background
class StarField {
    constructor(numStars) {
        this.stars = [];
        this.numStars = numStars;
        this.initStars();


        this.gradientColors = [
            { pos: 0.0, color: [0.0, 0.0, 0.00, 1.0] },
            { pos: 0.5, color: [0.0, 0.0, 0.00, 1.0] },
            { pos: 1.0, color: [0.0, 0.0, 0.00, 1.0] }
        ];
    }

    initStars() {
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push({
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1,
                size: Math.random() * 0.008 + 0.002,
                speed: Math.random() * 0.002 + 0.001,
                brightness: Math.random() * 0.5 + 0.5,
                twinkleSpeed: Math.random() * 0.05 + 0.02,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }

    update() {
        const time = Date.now() * 0.001; // Current time in seconds
        this.stars.forEach(star => {
            // Moving star downward
            star.y -= star.speed;

            // Reset star position when it goes off screen
            if (star.y < -1) {
                star.y = 1;
                star.x = Math.random() * 2 - 1;
            }

            // Update twinkle effect
            star.brightness = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        });
    }

    draw() {

        // this.drawBackgroundGradient();

        // Draw each star
        gl.useProgram(program);
        this.stars.forEach(star => {
            const color = [star.brightness, star.brightness, star.brightness, 1.0];
            drawRect(star.x, star.y, star.size, star.size, color);
        });

        // Draw nebula effect
        this.drawNebula();
    }

    drawBackgroundGradient() {
        gl.useProgram(program);

        // Create a full-screen quad with gradient
        const vertices = new Float32Array([
            -1, -1,
            1, -1,
            1, 1,
            -1, 1
        ]);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);


        const y = -1;
        this.gradientColors.forEach((gradColor, index) => {
            const nextColor = this.gradientColors[index + 1] || this.gradientColors[index];
            const color = gradColor.color;
            gl.uniform4fv(colorLocation, new Float32Array(color));

            const height = index < this.gradientColors.length - 1
                ? (nextColor.pos - gradColor.pos) * 2
                : 0.1;

            drawRect(0, y + gradColor.pos * 2, 2, height, color);
        });
    }

    drawNebula() {
        const time = Date.now() * 0.0001;


        for (let i = 0; i < 5; i++) {
            const x = Math.sin(time * (i + 1) * 0.5) * 0.5;
            const y = Math.cos(time * (i + 1) * 0.3) * 0.5;
            const size = 0.3 + Math.sin(time * (i + 1)) * 0.1;

            // Use different colors for nebula clouds
            const colors = [
                [0.4, 0.0, 0.4, 0.05],  // Purple
                [0.0, 0.2, 0.4, 0.05],  // Blue
                [0.4, 0.0, 0.2, 0.05],  // Pink
                [0.2, 0.0, 0.3, 0.05],  // Magenta
                [0.0, 0.3, 0.4, 0.05]   // Cyan
            ];

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            drawRect(x, y, size, size, colors[i]);
        }
    }
}



// Game state
const game = {

    currentScreen: 'start', // 'start', 'game', 'gameOver'

    isPaused: false,
    currentScreen: 'start',
    starField: new StarField(200),  // 200 stars
    backgroundOffset: 0,


    player: {
        x: 0,
        y: -0.8,
        width: 0.16,
        height: 0.16,
        speed: 0.02,
        powerupActive: false,
        powerupTimer: 0
    },
    bullets: [],
    asteroids: [],
    powerups: [],
    score: 0,
    highScore: localStorage.getItem('highScore') || 0,
    lives: 3,
    level: 1,
    gameOver: false,
    keys: { left: false, right: false, space: false },
    lastShot: 0,
    shootDelay: 250,
    scorePerAsteroid: 10,
    levelScoreThreshold: 500,
    enemyShootDelay: 2000, // Time between enemy shots in milliseconds
    enemyBullets: [], // Array to store enemy bullets
    enemies: [], // Array to store shooting enemies
};


// Start Screen
function showStartScreen() {

    game.currentScreen = 'start';
    game.isPaused = false;
    document.getElementById('startScreen').style.display = 'block';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
    audioManager.playMusic('start');
}

function hideStartScreen() {
    document.getElementById('startScreen').style.display = 'none';
}


// Start Game
function startGame() {

    game.currentScreen = 'game';
    game.isPaused = false;
    hideStartScreen();
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
    resetGame();
    audioManager.playMusic('game');
}

// Add pause menu functions
function togglePauseMenu() {
    if (game.currentScreen === 'game') {
        if (game.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
}

function pauseGame() {
    game.isPaused = true;
    game.currentScreen = 'pause';
    document.getElementById('pauseScreen').style.display = 'block';
    document.getElementById('pauseOverlay').style.display = 'block';
}

function resumeGame() {
    audioManager.playMusic('game');

    game.isPaused = false;
    game.currentScreen = 'game';
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
}

function confirmMainMenu() {
    if (confirm('Are you sure you want to return to the main menu? Your progress will be lost.')) {
        resumeGame();
        showStartScreen();
    }
}


// Game Over
function showGameOverScreen() {
    game.currentScreen = 'gameOver';
    document.getElementById('gameOverScreen').style.display = 'block';
    document.getElementById('finalScore').textContent = `Score: ${game.score}`;
    document.getElementById('finalHighScore').textContent = `High Score: ${game.highScore}`;
    audioManager.playMusic('gameOver');
}



// New Enemy class for shooting obstacles
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 0.15;
        this.height = 0.15;
        this.hitPoints = 5;
        this.lastShot = 0;
        this.speed = 0.001;
        this.color = [1, 1, 1, 1];
        this.score = 50;
        this.rotation = 0;
        this.rotationSpeed = 0.02;
    }

    update(currentTime) {
        this.y -= this.speed;
        this.rotation += this.rotationSpeed;

        if (currentTime - this.lastShot > game.enemyShootDelay) {
            this.shoot();
            this.lastShot = currentTime;
        }

        return this.y > -1.1;
    }

    shoot() {
        // Shoot in 6 directions (60 degree intervals)
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3);
            const speed = 0.01;
            game.enemyBullets.push({
                x: this.x,
                y: this.y,
                speedX: Math.sin(angle) * speed,
                speedY: Math.cos(angle) * speed,
                width: 0.02,
                height: 0.02,
                color: [1, 0, 0, 1]
            });
        }
    }

    draw() {
        gl.useProgram(texturedProgram);

        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        const vertices = new Float32Array([
            this.x + (-halfWidth * cos - halfHeight * sin),
            this.y + (-halfWidth * sin + halfHeight * cos),
            this.x + (halfWidth * cos - halfHeight * sin),
            this.y + (halfWidth * sin + halfHeight * cos),
            this.x + (halfWidth * cos + halfHeight * sin),
            this.y + (halfWidth * sin - halfHeight * cos),
            this.x + (-halfWidth * cos + halfHeight * sin),
            this.y + (-halfWidth * sin - halfHeight * cos)
        ]);

        const texCoords = new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(texturedPositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texturedPositionLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLocation);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.enemy);
        gl.uniform1i(textureLocation, 0);
        gl.uniform4fv(texturedColorLocation, this.color);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    hit() {
        this.hitPoints--;
        // Fade color as health decreases
        this.color[0] -= 0.15;
        return this.hitPoints <= 0;
    }
}



// Update high score display
document.getElementById('highScore').textContent = `High Score: ${game.highScore}`;

// Shader sources
const vertexShaderSource = `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 color;
    void main() {
        gl_FragColor = color;
    }
`;


// texture shader sources 
const texturedVertexShaderSource = `
attribute vec2 position;
attribute vec2 texCoord;
varying vec2 vTexCoord;

void main() {
gl_Position = vec4(position, 0.0, 1.0);
vTexCoord = texCoord;
}
`;

const texturedFragmentShaderSource = `
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec4 color;

void main() {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    // Discard pixels where alpha is very low (nearly transparent)
    if (texColor.a < 0.1) {
        discard;
    }
    gl_FragColor = texColor * color;
}
`;



// texture loading function to properly handle alpha
function loadTexture(url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);


    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 0]));

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // Enable alpha blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
    };

    image.src = url;
    return texture;
}



// Helper function to check if value is a power of two
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}


// Call loadTexture during initialization
const textures = {
    asteroid1: loadTexture('./images/asteroid.png'),
    asteroid2: loadTexture('./images/a1.png'),
    asteroid3: loadTexture('./images/a2.png'),
    spaceship: loadTexture('./images/s3.png'),
    bullet: loadTexture('./images/b6.png'),

    powerup: loadTexture('./images/powerup.png'),
    enemyBullet: loadTexture('./images/bullet.png'),
    enemy: loadTexture('./images/enemy.png')
};




// textured program
const texturedProgram = (() => {
    const vertexShader = createShader(gl.VERTEX_SHADER, texturedVertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, texturedFragmentShaderSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    return prog;
})();

// Get locations for textured program
const texturedPositionLocation = gl.getAttribLocation(texturedProgram, 'position');
texCoordLocation = gl.getAttribLocation(texturedProgram, 'texCoord');
const textureLocation = gl.getUniformLocation(texturedProgram, 'uTexture');
const texturedColorLocation = gl.getUniformLocation(texturedProgram, 'color');

// Creating texture coordinate buffer
const texCoordBuffer = gl.createBuffer();

// Creating and compiling shaders
function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

// Creating program
const program = (() => {
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    return prog;
})();

gl.useProgram(program);

// Get locations
const positionLocation = gl.getAttribLocation(program, 'position');
const colorLocation = gl.getUniformLocation(program, 'color');

// Create buffer
const positionBuffer = gl.createBuffer();

// Drawing functions
function drawTriangle(x, y, width, height, color, rotation = 0) {
    const vertices = [
        x, y + height / 2,
        x - width / 2, y - height / 2,
        x + width / 2, y - height / 2
    ];

    // Apply rotation
    const rotatedVertices = [];
    for (let i = 0; i < vertices.length; i += 2) {
        const vx = vertices[i] - x;
        const vy = vertices[i + 1] - y;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        rotatedVertices.push(
            x + (vx * cos - vy * sin),
            y + (vx * sin + vy * cos)
        );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rotatedVertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    gl.uniform4fv(colorLocation, color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function drawRect(x, y, width, height, color) {
    const vertices = new Float32Array([
        x - width / 2, y - height / 2,
        x + width / 2, y - height / 2,
        x + width / 2, y + height / 2,
        x - width / 2, y + height / 2
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    gl.uniform4fv(colorLocation, color);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

// Updating spaceship drawing function
function drawSpaceship(x, y) {
    gl.useProgram(texturedProgram);

    const vertices = new Float32Array([
        x - 0.085, y - 0.085,
        x + 0.085, y - 0.085,
        x + 0.085, y + 0.085,
        x - 0.085, y + 0.085
    ]);

    const texCoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ]);

    // Set position attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(texturedPositionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texturedPositionLocation);

    // Set texture coordinate attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLocation);

    // Bind texture and draw
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.spaceship);
    gl.uniform1i(textureLocation, 0);
    gl.uniform4fv(texturedColorLocation, [1, 1, 1, 1]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

// Add textured bullet drawing
function drawTexturedBullet(bullet) {
    gl.useProgram(texturedProgram);

    const vertices = new Float32Array([
        bullet.x - bullet.width / 2, bullet.y - bullet.height / 2,
        bullet.x + bullet.width / 2, bullet.y - bullet.height / 2,
        bullet.x + bullet.width / 2, bullet.y + bullet.height / 2,
        bullet.x - bullet.width / 2, bullet.y + bullet.height / 2
    ]);

    const texCoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ]);

    // Set position attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(texturedPositionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texturedPositionLocation);

    // Set texture coordinate attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLocation);

    // Bind texture and draw
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.bullet);
    gl.uniform1i(textureLocation, 0);
    gl.uniform4fv(texturedColorLocation, [1, 1, 0, 1]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

// Modified Asteroid class for varied hit points
class Asteroid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 0.2;
        this.height = 0.2;
        this.hitPoints = Math.floor(Math.random() * 5) + 1;
        this.initialHitPoints = this.hitPoints;

        // Select texture based on hit points
        this.texture = textures[`asteroid${Math.min(this.hitPoints, 3)}`];

        const baseSpeed = 0.002;
        const levelSpeedMultiplier = 1 + (Math.min(game.level, 20) * 0.1);
        this.speed = Math.min(baseSpeed * levelSpeedMultiplier, 0.006);

        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        const colorIntensity = 0.2 + (this.hitPoints / 5) * 0.8;
        this.color = [colorIntensity, colorIntensity, colorIntensity, 1];
        this.score = this.hitPoints * 10;
    }

    update() {
        this.y -= this.speed;
        this.rotation += this.rotationSpeed;
        return this.y > -1;
    }


    draw() {
        gl.useProgram(texturedProgram);

        // Quad instead of a polygon for proper texture mapping
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;


        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        const vertices = new Float32Array([
            // Top-left
            this.x + (-halfWidth * cos - halfHeight * sin),
            this.y + (-halfWidth * sin + halfHeight * cos),
            // Top-right
            this.x + (halfWidth * cos - halfHeight * sin),
            this.y + (halfWidth * sin + halfHeight * cos),
            // Bottom-right
            this.x + (halfWidth * cos + halfHeight * sin),
            this.y + (halfWidth * sin - halfHeight * cos),
            // Bottom-left
            this.x + (-halfWidth * cos + halfHeight * sin),
            this.y + (-halfWidth * sin - halfHeight * cos)
        ]);

        // Standard texture coordinates for a quad
        const texCoords = new Float32Array([
            0.0, 1.0,  // Top-left
            1.0, 1.0,  // Top-right
            1.0, 0.0,  // Bottom-right
            0.0, 0.0   // Bottom-left
        ]);

        // Set position attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(texturedPositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texturedPositionLocation);

        // Set texture coordinate attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLocation);

        // Bind texture and set uniforms
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(textureLocation, 0);
        gl.uniform4fv(texturedColorLocation, this.color);

        // Draw as a triangle fan
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    hit() {
        this.hitPoints--;
        this.color[0] -= 0.2;
        this.color[1] -= 0.1;
        return this.hitPoints <= 0;
    }

}

// Update Powerup class to use texture
class Powerup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 0.12;
        this.height = 0.12;
        this.speed = 0.003;
        this.rotation = 0;
    }

    update() {
        this.y -= this.speed;
        this.rotation += 0.05;
        return this.y > -1.1;
    }

    draw() {
        gl.useProgram(texturedProgram);

        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        const vertices = new Float32Array([
            this.x + (-halfWidth * cos - halfHeight * sin),
            this.y + (-halfWidth * sin + halfHeight * cos),
            this.x + (halfWidth * cos - halfHeight * sin),
            this.y + (halfWidth * sin + halfHeight * cos),
            this.x + (halfWidth * cos + halfHeight * sin),
            this.y + (halfWidth * sin - halfHeight * cos),
            this.x + (-halfWidth * cos + halfHeight * sin),
            this.y + (-halfWidth * sin - halfHeight * cos)
        ]);

        const texCoords = new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(texturedPositionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texturedPositionLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLocation);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures.powerup);
        gl.uniform1i(textureLocation, 0);
        gl.uniform4fv(texturedColorLocation, [1, 1, 1, 1]);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

// function to draw enemy bullets with texture
function drawEnemyBullet(bullet) {
    gl.useProgram(texturedProgram);

    const vertices = new Float32Array([
        bullet.x - bullet.width / 2, bullet.y - bullet.height / 2,
        bullet.x + bullet.width / 2, bullet.y - bullet.height / 2,
        bullet.x + bullet.width / 2, bullet.y + bullet.height / 2,
        bullet.x - bullet.width / 2, bullet.y + bullet.height / 2
    ]);

    const texCoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(texturedPositionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texturedPositionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLocation);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures.enemyBullet);
    gl.uniform1i(textureLocation, 0);
    gl.uniform4fv(texturedColorLocation, [1, 1, 1, 1]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}


// function to spawn enemies
function spawnEnemy() {
    if (!game.gameOver) {
        const x = Math.random() * 1.8 - 0.9;
        game.enemies.push(new Enemy(x, 1.1));
    }
}


// Update enemy bullets
function updateEnemyBullets() {
    game.enemyBullets = game.enemyBullets.filter(bullet => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;

        // Check collision with player
        if (checkCollision(bullet, game.player)) {
            audioManager.playSFX('enemyBulletPlayer');
            game.lives--;
            document.getElementById('lives').textContent = `Lives: ${game.lives}`;
            if (game.lives <= 0) {
                audioManager.playSFX('gameover');
                gameOver();
            }
            return false;
        }

        // Remove bullets that are off screen
        return bullet.y > -1.1 && bullet.y < 1.1 && bullet.x > -1.1 && bullet.x < 1.1;
    });
}

// Update enemies
function updateEnemies() {
    const currentTime = Date.now();
    game.enemies = game.enemies.filter(enemy => {
        // Update enemy position and checking if it's still within the game bounds
        if (!enemy.update(currentTime)) return false;


        let enemyDestroyed = false;
        game.bullets = game.bullets.filter(bullet => {
            if (checkCollision(bullet, enemy)) {
                if (enemy.hit()) {
                    audioManager.playSFX('bulletAsteroid');
                    game.score += enemy.score;
                    document.getElementById('score').textContent = `Score: ${game.score}`;
                    enemyDestroyed = true;
                }
                return false;
            }
            return true;
        });


        return !enemyDestroyed;
    });
}

// Game functions
function spawnAsteroid() {
    if (!game.gameOver) {
        const currentAsteroids = game.asteroids.length;
        const maxAsteroids = game.maxAsteroidsOnScreen + Math.floor(game.level / 2);

        if (currentAsteroids < maxAsteroids) {
            const x = Math.random() * 1.8 - 0.9;
            const minSpacing = 0.3;
            let canSpawn = true;

            for (let asteroid of game.asteroids) {
                if (Math.abs(asteroid.y - 1.1) < minSpacing) {
                    canSpawn = false;
                    break;
                }
            }

            if (canSpawn) {
                game.asteroids.push(new Asteroid(x, 1.1));
            }
        }
    }
}

function spawnPowerup() {
    if (!game.gameOver && Math.random() < 0.1) {
        const x = Math.random() * 1.8 - 0.9;
        game.powerups.push(new Powerup(x, 1.1));
    }
}

function fireBullet(angle = 0) {
    // audioManager.playSFX('fire');
    if (!game.gameOver && Date.now() - game.lastShot >= game.shootDelay) {
        const speed = 0.02;
        const bullet = {
            x: game.player.x,
            y: game.player.y + game.player.height / 2,
            speedX: Math.sin(angle) * speed,
            speedY: Math.cos(angle) * speed,
            width: 0.02,
            height: 0.04
        };
        game.bullets.push(bullet);
        if (game.player.powerupActive) {
            game.bullets.push({ ...bullet, speedX: Math.sin(angle + 0.3) * speed });
            game.bullets.push({ ...bullet, speedX: Math.sin(angle - 0.3) * speed });
        }
        game.lastShot = Date.now();
    }
}

function checkCollision(rect1, rect2) {
    return !(rect1.x + rect1.width / 2 < rect2.x - rect2.width / 2 ||
        rect1.x - rect1.width / 2 > rect2.x + rect2.width / 2 ||
        rect1.y + rect1.height / 2 < rect2.y - rect2.height / 2 ||
        rect1.y - rect1.height / 2 > rect2.y + rect2.height / 2);
}

function resetGame() {
    audioManager.playMusic('game');
    game.player.x = 0;
    game.player.y = -0.8;
    game.player.powerupActive = false;
    game.player.powerupTimer = 0;
    game.bullets = [];
    game.asteroids = [];
    game.powerups = [];
    game.enemies = [];
    game.score = 0;
    game.lives = 3;
    game.level = 1;
    game.gameOver = false;
    game.lastBonusLifeScore = 0;
    game.asteroidSpawnRate = 0.02;  // Base spawn rate
    game.maxAsteroidsOnScreen = 5;  // Initial max asteroids
    game.enemySpawnRate = 0.002;    // Base spawn rate for enemies
    game.maxEnemiesOnScreen = 2;



    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('score').textContent = `Score: ${game.score}`;
    document.getElementById('lives').textContent = `Lives: ${game.lives}`;
    document.getElementById('level').textContent = `Level: ${game.level}`;
    document.getElementById('powerupStatus').textContent = '';
}

// Update functions
function updatePlayer() {
    if (game.keys.left && game.player.x > -0.9) {
        game.player.x -= game.player.speed;
    }
    if (game.keys.right && game.player.x < 0.9) {
        game.player.x += game.player.speed;
    }
    if (game.keys.space) {
        audioManager.playSFX('fire');
        fireBullet();
    }

    // Update powerup timer
    if (game.player.powerupActive) {
        game.player.powerupTimer--;
        if (game.player.powerupTimer <= 0) {
            game.player.powerupActive = false;
            document.getElementById('powerupStatus').textContent = '';
        } else {
            document.getElementById('powerupStatus').textContent =
                `Triple Shot: ${Math.ceil(game.player.powerupTimer / 60)}s`;
        }
    }
}

function updateBullets() {
    game.bullets = game.bullets.filter(bullet => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        return bullet.y < 1;
    });
}


function updateAsteroids() {
    game.asteroids = game.asteroids.filter(asteroid => asteroid.update());

    // Check for collisions with bullets
    game.bullets = game.bullets.filter(bullet => {
        let bulletHit = false;
        game.asteroids = game.asteroids.filter(asteroid => {
            if (!bulletHit && checkCollision(bullet, asteroid)) {
                bulletHit = true;
                if (asteroid.hit()) {
                    audioManager.playSFX('bulletAsteroid');
                    const scoreIncrease = game.scorePerAsteroid *
                        (asteroid.initialHitPoints || 1) *
                        Math.min(game.level, 5);

                    game.score += scoreIncrease;
                    document.getElementById('score').textContent = `Score: ${game.score}`;

                    // Check for bonus life
                    if (game.score >= game.lastBonusLifeScore + game.bonusLifeThreshold &&
                        game.lives < game.maxLives) {
                        game.lives++;
                        game.lastBonusLifeScore = game.score;
                        document.getElementById('lives').textContent = `Lives: ${game.lives}`;
                    }
                    return false;
                }
            }
            return true;
        });
        return !bulletHit;
    });


    // checking collisions with player
    if (!game.gameOver) {
        game.asteroids.forEach(asteroid => {
            if (checkCollision(game.player, asteroid)) {
                game.lives--;
                audioManager.playSFX('shipAsteroid');
                //  game.player.powerupActive = false;
                //  game.player.powerupTimer = 0;
                document.getElementById('lives').textContent = `Lives: ${game.lives}`;

                if (game.lives <= 0) {
                    audioManager.playSFX('gameover');
                    gameOver();
                } else {
                    // Reset player position
                    game.player.powerupActive = false;
                    game.player.powerupTimer = 0;
                    game.player.x = 0;
                    game.player.y = -0.8;
                    // game.player.style.color = "red"

                }
            }
        });
    }
}

function updatePowerups() {
    game.powerups = game.powerups.filter(powerup => {
        if (checkCollision(game.player, powerup)) {
            audioManager.playSFX('powerup');
            game.player.powerupActive = true;
            game.player.powerupTimer = 300; // 5 seconds at 60fps
            return false;
        }
        return powerup.update();
    });
}


function gameOver() {
    game.gameOver = true;
    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('highScore', game.highScore);
        document.getElementById('highScore').textContent = `High Score: ${game.highScore}`;
    }
    showGameOverScreen();
}

// Start button
document.getElementById('startButton').addEventListener('click', () => {
    audioManager.playSFX('buttonClick');
    startGame();
});

document.getElementById('aboutButton').addEventListener('click', () => {
    audioManager.playSFX('buttonClick');
    document.getElementById('aboutContent').style.display = 'block';
});

document.getElementById('closeAbout').addEventListener('click', () => {
    audioManager.playSFX('buttonClick');
    document.getElementById('aboutContent').style.display = 'none';
});


document.getElementById('mainMenuButton').addEventListener('click', () => {
    audioManager.playSFX('buttonClick');
    showStartScreen();
});

document.getElementById('highScoresButton').addEventListener('click', () => {
    audioManager.playSFX('buttonClick');
    alert(`Current High Score: ${game.highScore}`);
});



// event listeners for pause menu
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        audioManager.playSFX('buttonClick');
        togglePauseMenu();
    }
});

document.getElementById('resumeButton').addEventListener('click', () => {
    audioManager.playSFX('buttonClick');
    resumeGame();
});

document.getElementById('restartFromPause').addEventListener('click', () => {
    audioManager.playSFX('buttonClick');
    if (confirm('Are you sure you want to restart? Your progress will be lost.')) {
        resumeGame();
        resetGame();
    }
});

// document.getElementById('aboutFromPause').addEventListener('click', () => {
//     document.getElementById('aboutContent').style.display = 'block';
// });

document.getElementById('mainMenuFromPause').addEventListener('click', () => {
    audioManager.playSFX('buttonClick');
    confirmMainMenu();
});


// level progression logic
function checkLevelProgression() {
    const oldLevel = game.level;
    const newLevel = Math.floor(game.score / game.levelScoreThreshold) + 1;

    if (newLevel > oldLevel) {
        game.level = Math.min(newLevel, 50);  // maximum level cap at 50
        document.getElementById('level').textContent = `Level: ${game.level}`;

        // game parameters for the new level
        game.maxAsteroidsOnScreen = Math.min(5 + Math.floor(game.level / 3), 12);
        game.asteroidSpawnRate = Math.min(0.02 + (game.level * 0.002), 0.08);
        game.powerupSpawnRate = Math.min(0.005 + (game.level * 0.0005), 0.02);

        // Enemy spawn rate for new level (start from level 7)

        if (game.level >= 7 && game.level <= 8) {
            game.enemySpawnRate = Math.min(0.002 + (game.level * 0.001), 0.02);
            game.maxEnemiesOnScreen = 1;
        }

        if (game.level >= 9 && game.level <= 12) {
            game.enemySpawnRate = Math.min(0.002 + (game.level * 0.001), 0.02);
        }

        if (game.level >= 13 && game.level <= 15) {
            game.enemySpawnRate = Math.min(0.002 + (game.level * 0.001), 0.02);

            game.maxEnemiesOnScreen = 3;
        }

        if (game.level >= 16) {
            game.enemySpawnRate = Math.min(0.002 + (game.level * 0.001), 0.02);

            game.maxEnemiesOnScreen = 4;
        }
    }
}

// the main update function
function update() {
    if (!game.gameOver) {
        updatePlayer();
        updateBullets();
        updateAsteroids();
        updatePowerups();
        updateEnemies();
        updateEnemyBullets();
        checkLevelProgression();

        if (Math.random() < game.asteroidSpawnRate) {
            spawnAsteroid();
        }

        if (Math.random() < game.powerupSpawnRate) {
            spawnPowerup();
        }

        if (game.level >= 7 && game.enemies.length < game.maxEnemiesOnScreen && Math.random() < game.enemySpawnRate) {
            spawnEnemy();
        }
    }
}


function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    game.starField.update();
    game.starField.draw();

    drawSpaceship(game.player.x, game.player.y);


    game.bullets.forEach(bullet => {
        drawTexturedBullet(bullet);
    });

    game.enemyBullets.forEach(bullet => {
        drawEnemyBullet(bullet);
    });

    game.asteroids.forEach(asteroid => {
        asteroid.draw();
    });

    game.powerups.forEach(powerup => {
        powerup.draw();
    });

    game.enemies.forEach(enemy => {
        enemy.draw();
    });

    // Request the next frame
    // requestAnimationFrame(render);
}

function gameLoop(currentTime) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    game.starField.update();
    game.starField.draw();
    if (game.currentScreen === 'game' && !game.isPaused) {
        update();
        render();
    }
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!game.isPaused) {
        switch (e.key.toLowerCase()) {
            case 'arrowleft':
            case 'a':
                game.keys.left = true;
                break;
            case 'arrowright':
            case 'd':
                game.keys.right = true;
                break;
            case ' ':
                game.keys.space = true;
                e.preventDefault();
                break;
        }
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
            game.keys.left = false;
            break;
        case 'arrowright':
        case 'd':
            game.keys.right = false;
            break;
        case ' ':
            game.keys.space = false;
            break;
    }
});


document.getElementById('restartButton').addEventListener('click', () => {
    audioManager.playSFX('buttonClick');
    resumeGame();
    resetGame();

});


// Volume control functions
function setMusicVolume(volume) {
    Object.values(audioManager.music).forEach(music => {
        music.volume = volume;
    });
}

function setSFXVolume(volume) {
    Object.values(audioManager.sfx).forEach(sfx => {
        sfx.volume = volume;
    });
}

showStartScreen();
gameLoop();