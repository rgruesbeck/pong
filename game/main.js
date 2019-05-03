/**
 * game/main.js
 * 
 * What it Does:
 *   This file is the main game class
 *   Important parts are the load, create, and play functions
 *   
 *   Load: is where images, sounds, and fonts are loaded
 *   
 *   Create: is where game elements and characters are created
 *   
 *   Play: is where game characters are updated according to game play
 *   before drawing a new frame to the screen, and calling play again
 *   this creates an animation just like the pages of a flip book
 * 
 *   Other parts include boilerplate for requesting and canceling new frames
 *   handling input events, pausing, muting, etc.
 * 
 * What to Change:
 *   Most things to change will be in the play function
 */

import {
    requestAnimationFrame,
    cancelAnimationFrame
} from './helpers/animationframe.js';

import {
    loadList,
    loadImage,
    loadSound,
    loadFont
} from './helpers/loaders.js';

import { boundBy } from './helpers/utils.js';

import Image from './objects/image.js';
import Player from './characters/player.js';
import Ball from './characters/ball.js';

class Game {

    constructor(canvas, overlay, topbar, config) {
        this.config = config; // customization

        this.overlay = overlay;

        this.topbar = topbar;
        this.topbar.active = this.config.settings.gameTopBar;

        this.canvas = canvas; // game screen
        this.ctx = canvas.getContext("2d"); // game screen context
        this.canvas.width = window.innerWidth; // set game screen width
        this.canvas.height = topbar.active ? window.innerHeight - this.topbar.clientHeight : window.innerHeight; // set game screen height

        // frame count, rate, and time
        // this is just a place to keep track of frame rate (not set it)
        this.frame = {
            count: 0,
            time: Date.now(),
            rate: null,
            scale: null
        };

        // game settings
        this.state = {
            current: 'ready',
            prev: 'loading',
            winScore: this.config.settings.winScore,
            paused: false,
            muted: localStorage.getItem('game-muted') === 'true'
        };

        this.input = {
            active: 'keyboard',
            keyboard: { up: false, right: false, left: false, down: false },
            mouse: { x: 0, y: 0, click: false },
            touch: { x: 0, y: 0 },
        };

        this.screen = {
            top: 0,
            bottom: this.canvas.height,
            left: 0,
            right: this.canvas.width,
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height / 2,
            scale: ((this.canvas.width + this.canvas.height) / 2) * 0.003
        };

        this.images = {}; // place to keep images
        this.sounds = {}; // place to keep sounds
        this.fonts = {}; // place to keep fonts

        // setup event listeners
        // handle keyboard events
        document.addEventListener('keydown', ({ code }) => this.handleKeyboardInput('keydown', code));
        document.addEventListener('keyup', ({ code }) => this.handleKeyboardInput('keyup', code));

        // setup event listeners for mouse movement
        document.addEventListener('mousemove', ({ clientY }) => this.handleMouseMove(clientY));

        // setup event listeners for mouse movement
        document.addEventListener('touchmove', ({ touches }) => this.handleTouchMove(touches[0]));

        // handle overlay clicks
        this.overlay.root.addEventListener('click', ({ target }) => this.handleClicks(target));

        // handle resize events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener("orientationchange", (e) => this.handleResize(e));

        // set document body to backgroundColor
        document.body.style.backgroundColor = this.config.colors.backgroundColor;

        // set loading indicator to textColor
        document.querySelector('#loading').style.color = this.config.colors.textColor;

        // set topbar and topbar color
        this.topbar.style.display = this.topbar.active ? 'block' : 'none';
        this.topbar.style.backgroundColor = this.config.colors.primaryColor;
    }

    load() {
        // load pictures, sounds, and fonts

        
        // make a list of assets
        const gameAssets = [
            loadImage('backgroundImage', this.config.images.backgroundImage),
            loadImage('ballImage', this.config.images.ballImage),
            loadSound('bounceSound', this.config.sounds.bounceSound),
            loadSound('scoreSound', this.config.sounds.scoreSound),
            loadSound('backgroundMusic', this.config.sounds.backgroundMusic),
            loadFont('gameFont', this.config.settings.fontFamily)
        ];

        // put the loaded assets the respective containers
        loadList(gameAssets)
        .then((assets) => {

            this.images = assets.image;
            this.sounds = assets.sound;

        })
        .then(() => this.create());
    }

    create() {
        // create game characters

        const { scale, centerY, right } = this.screen;

        let playerHeight = 60 * scale;
        let playerWidth = 10 * scale;

        this.player1 = new Player({
            name: 'player1',
            ctx: this.ctx,
            color: this.config.colors.textColor,
            x: right - playerWidth,
            y: centerY - playerHeight / 2,
            width: playerWidth,
            height: playerHeight,
            speed: 50,
            bounds: this.screen
        })

        this.player2 = new Player({
            name: 'player2',
            ctx: this.ctx,
            color: this.config.colors.textColor,
            x: 0,
            y: centerY - playerHeight / 2,
            width: playerWidth,
            height: playerHeight,
            speed: 50,
            bounds: this.screen
        });


        // field
        this.field = new Image({
            ctx: this.ctx,
            image: this.images.backgroundImage,
            x: 0,
            y: 0,
            width: this.screen.right,
            height: this.screen.bottom
        });


        // ball
        let ballWidth = 20 * scale;
        let ballHeight = 20 * scale;

        this.ball = new Ball({
            ctx: this.ctx,
            image: this.images.ballImage,
            x: this.screen.right + ballWidth,
            y: this.player1.y,
            width: ballWidth,
            height: ballHeight,
            speed: 20,
            bounds: {
                top: 0,
                right: this.screen.right + ballWidth,
                left: this.screen.left - ballWidth,
                bottom: this.screen.bottom
            }
        })


        // set overlay styles
        this.overlay.setStyles({...this.config.colors, ...this.config.settings});

        this.play();
    }

    play() {
        // update game characters

        // clear the screen of the last picture
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = this.config.colors.backgroundColor; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // draw and do stuff that you need to do
        // no matter the game state
        this.field.draw();

        this.ctx.globalAlpha = 1;

        // update scores
        this.overlay.setScore1(`${this.player1.score}/${this.state.winScore}`);
        this.overlay.setScore2(`${this.player2.score}/${this.state.winScore}`);

        // ready to play
        if (this.state.current === 'ready') {
            this.overlay.hideLoading();
            this.canvas.style.opacity = 1;

            this.overlay.setBanner('Game');
            this.overlay.setButton('Play');
            this.overlay.showStats();

            this.overlay.setMute(this.state.muted);
            this.overlay.setPause(this.state.paused);

            this.overlay.setInstructions({
                desktop: this.config.settings.instructionsDesktop,
                mobile: this.config.settings.instructionsMobile
            });

            //dev
            //this.setState({ current: 'play' });
            // this.overlay.hideBanner();
            // this.overlay.hideButton();
        }

        // game play
        if (this.state.current === 'play') {
            // hide overlays if coming from ready
            if (this.state.prev === 'ready') {
                this.overlay.hideBanner();
                this.overlay.hideButton();
                this.overlay.hideInstructions();
            }

            // check for winner
            if (this.player1.score === this.state.winScore) {
                this.setState({ current: 'win-player1'})
            }

            if (this.player2.score === this.state.winScore) {
                this.setState({ current: 'win-player2'})
            }


            if (!this.state.muted) { this.sounds.backgroundMusic.play(); }

            // player 1
            if (this.input.active === 'keyboard') {
                let dy1 = (this.input.keyboard.up ? -1 : 0) + (this.input.keyboard.down ? 1 : 0);
                this.player1.move(0, dy1, this.frame.scale);
            }

            if (this.input.active === 'mouse') {
                let y = this.input.mouse.y - this.canvas.offsetTop;
                let diffY =  y - this.player1.y - this.player1.height / 2;
                this.player1.move(0, diffY / 100, 1);
            }
            
            if (this.input.active === 'touch') {
                let y = this.input.touch.y - this.canvas.offsetTop;
                let diffY =  y - this.player1.y - this.player1.height / 2;
                this.player1.move(0, diffY / 100, 1);
            }

            this.player1.draw();

            // player 2 (computer)
            if (this.ball.launched && this.ball.dx < 0) {

                // move computer player toward the ball
                // get diffY and calculate dy
                let diffY = this.ball.y - this.player2.y;
                let dy2 = diffY / (this.ball.x * 2); 

                // apply a speed limit
                let dy2capped = boundBy(dy2, 1, -1);
                this.player2.move(0, dy2capped, this.frame.scale);
            }

            this.player2.draw();

            // ball
            // bounce ball off of ceiling or floor
            let onEdgeY = this.ball.y === this.screen.top || this.ball.y === this.screen.bottom - this.ball.height;
            if (onEdgeY) { this.ball.dy = -this.ball.dy; }

            // bounce ball off player1
            let collided = this.ball.collisionsWith([this.player1, this.player2]);
            if (collided && collided.name === 'player1') {
                // play bounce sound
                this.sounds.bounceSound.currentTime = 0;
                this.sounds.bounceSound.play();

                // add some velocity
                let extraPushX = this.player1.vy / 50;
                this.ball.dx = -1 + extraPushX;
            }

            // bounce ball off player2
            if (collided && collided.name === 'player2') {
                // play bounce sound
                this.sounds.bounceSound.currentTime = 0;
                this.sounds.bounceSound.play();

                this.ball.dx = 1;
            }

            // if ball touches left side, player1 scores
            if (this.ball.launched && this.ball.x <= this.ball.bounds.left) {
                // play score sound
                this.sounds.scoreSound.currentTime = 0;
                this.sounds.scoreSound.play();

                // give player1 one point
                this.player1.score += 1;

                this.ball.setY(this.player2.y);
                this.ball.launch(3000, 1, this.player2.width);
            }

            // if ball touches right side, player2 scores
            if (this.ball.launched && this.ball.x + this.ball.width >= this.ball.bounds.right) {
                // play score sound
                this.sounds.scoreSound.currentTime = 0;
                this.sounds.scoreSound.play();

                // give player2 one point
                this.player2.score += 1;

                this.ball.stop();
            }

            this.ball.move(this.frame.scale);
            this.ball.draw();
        }

        // player wins
        if (this.state.current === 'win-player1') {
            this.overlay.setBanner('Winner!')
        }

        if (this.state.current === 'win-player2') {
            this.overlay.setBanner('Try again!')
        }

        // draw the next screen
        this.requestFrame(() => this.play());
    }

    relaunchBall() {
        this.ball.setY(this.player1.y);
        this.ball.launch(null, -1, this.player1.width);
    }

    // event listeners

    handleClicks(target) {

        // mute
        if (target.id === 'mute') {
            this.mute();
            return;
        }

        // pause
        if (target.id === 'pause') {
            this.pause();
            return;
        }

        // button
        if ( target.id === 'button') {
            this.setState({ current: 'play' });

            // if defaulting to have sound on by default
            // double mute() to warmup iphone audio here
            this.mute();
            this.mute();
            return;
        }

        // relaunch ball
        let onSide = this.ball.launched === false && this.ball.x > this.screen.centerX;
        if (this.state.current === 'play' && onSide) {
            this.relaunchBall();
        }

        if (this.state.current.includes('win')) {
            document.location.reload();
        }
    }

    handleKeyboardInput(type, code) {
        this.input.active = 'keyboard';

        if (type === 'keydown') {
            if (code === 'ArrowUp') {
                this.input.keyboard.up = true
            }
            if (code === 'ArrowRight') {
                this.input.keyboard.right = true
            }
            if (code === 'ArrowDown') {
                this.input.keyboard.down = true
            }
            if (code === 'ArrowLeft') {
                this.input.keyboard.left = true
            }
        }

        if (type === 'keyup') {
            if (code === 'ArrowUp') {
                this.input.keyboard.up = false
            }
            if (code === 'ArrowRight') {
                this.input.keyboard.right = false
            }
            if (code === 'ArrowDown') {
                this.input.keyboard.down = false
            }
            if (code === 'ArrowLeft') {
                this.input.keyboard.left = false
            }

            // KeyP: pause and play game
            if (code === 'KeyP') {
                this.pause();
            }

            // Launch ball or Start
            if (code === 'Space' || code === 'Enter') {
                let onSide = this.ball.launched === false && this.ball.x > this.screen.centerX;
                if (this.state.current === 'play' && onSide) {
                    this.relaunchBall()
                }

                if (this.state.current.includes('win')) {
                    document.location.reload();
                }
            }
        }
    }

    handleMouseMove(y) {
        this.input.active = 'mouse';
        this.input.mouse.y = y;
    }

    handleTouchMove(touch) {
        let { clientY } = touch;

        this.input.active = 'touch';
        this.input.touch.y = clientY;
    }

    handleResize() {

        document.location.reload();
    }

    // game helpers
    // pause game
    pause() {
        this.state.paused = !this.state.paused;
        this.overlay.setPause(this.state.paused);

        if (this.state.paused) {
            // pause game loop
            this.cancelFrame();

            // mute all game sounds
            Object.keys(this.sounds).forEach((key) => {
                this.sounds[key].muted = true;
                this.sounds[key].pause();
            });

            this.overlay.setBanner('Paused');
        } else {
            // resume game loop
            this.requestFrame(() => this.play(), true);

            // resume game sounds if game not muted
            if (!this.state.muted) {
                Object.keys(this.sounds).forEach((key) => {
                    this.sounds[key].muted = false;
                    this.sounds.backgroundMusic.play();
                });
            }

            this.overlay.hideBanner();
        }
    }

    // mute game
    mute() {
        let key = 'game-muted';
        localStorage.setItem(
            key,
            localStorage.getItem(key) === 'true' ? 'false' : 'true'
        );
        this.state.muted = localStorage.getItem(key) === 'true';

        this.overlay.setMute(this.state.muted);

        if (this.state.muted) {
            // mute all game sounds
            Object.keys(this.sounds).forEach((key) => {
                this.sounds[key].muted = true;
                this.sounds[key].pause();
            });
        } else {
            // unmute all game sounds
            // and play background music
            // if game not paused
            if (!this.state.paused) {
                Object.keys(this.sounds).forEach((key) => {
                    this.sounds[key].muted = false;
                    this.sounds.backgroundMusic.play();
                });
            }
        }
    }

    // reset game
    reset() {
        document.location.reload();
    }

    // update game state
    setState(state) {
        this.state = {
            ...this.state,
            ...{ prev: this.state.current },
            ...state,
        };
    }

    // request new frame
    // wraps requestAnimationFrame.
    // see game/helpers/animationframe.js for more information
    requestFrame(next, resumed) {
        let now = Date.now();
        this.frame = {
            count: requestAnimationFrame(next),
            time: now,
            rate: resumed ? now : now - this.frame.time,
            scale: this.screen.scale * this.frame.rate * 0.01
        };
    }

    // cancel frame
    // wraps cancelAnimationFrame.
    // see game/helpers/animationframe.js for more information
    cancelFrame() {
        cancelAnimationFrame(this.frame.count);
    }
}

export default Game;