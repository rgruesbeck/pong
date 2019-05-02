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

import Image from './objects/image.js';
import Player from './characters/player.js';

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
        document.addEventListener('keydown', ({ code }) => this.handleKeyboardInput('keydown', code), false);
        document.addEventListener('keyup', ({ code }) => this.handleKeyboardInput('keyup', code), false);

        // handle overlay clicks
        this.overlay.root.addEventListener('click', ({ target }) => this.handleClicks(target), false);

        // handle resize events
        window.addEventListener('resize', () => this.handleResize(), false);
        window.addEventListener("orientationchange", (e) => this.handleResize(e), false);

        // handle post message
        window.addEventListener('message', (e) => this.handlePostMessage(e), false);

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

        let playerHeight = 35 * scale;
        let playerWidth = 5 * scale;

        this.player1 = new Player({
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
        this.ball = new Image({
            ctx: this.ctx,
            image: this.images.ballImage,
            x: 0,
            y: 0,
            width: 60,
            height: 60
        })


        // set overlay styles
        this.overlay.setStyles({...this.config.colors, ...this.config.settings});

        this.play();
    }

    play() {
        // update game characters

        // clear the screen of the last picture
        this.ctx.fillStyle = this.config.colors.backgroundColor; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // draw and do stuff that you need to do
        // no matter the game state
        this.field.draw();

        // ready to play
        if (this.state.current === 'ready') {
            this.overlay.hideLoading();
            this.canvas.style.opacity = 1;

            this.overlay.setBanner('Game');
            this.overlay.setButton('Play');
            this.overlay.showStats();
            this.overlay.setLives('10');
            this.overlay.setScore('10');

            this.overlay.setMute(this.state.muted);
            this.overlay.setPause(this.state.paused);

            //dev
            this.setState({ current: 'play' });
            this.overlay.hideBanner();
            this.overlay.hideButton();
        }

        // game play
        if (this.state.current === 'play') {
            if (!this.state.muted) { this.sounds.backgroundMusic.play(); }

            // player 1
            let dy1 = (this.input.keyboard.up ? -1 : 0) + (this.input.keyboard.down ? 1 : 0);

            this.player1.move(0, dy1, this.frame.scale);
            this.player1.draw();

            // player 2
            let dy2 = dy1 / 2;

            this.player2.move(0, dy2, this.frame.scale);
            this.player2.draw();

            // ball
            this.ball.draw();
        }

        // player wins
        if (this.state.current === 'win') {

        }

        // game over
        if (this.state.current === 'over') {

        }

        // draw the next screen
        this.requestFrame(() => this.play());
    }

    start() {

    }

    // event listeners

    handleClicks(target) {

        // mute
        if (target.id === 'mute') {
            this.mute();
        }

        // pause
        if (target.id === 'pause') {
            this.pause();
        }

        // button
        if ( target.id === 'button') {
            this.setState({ current: 'play' });
            this.overlay.hideBanner();
            this.overlay.hideButton();

            // if defaulting to have sound on by default
            // double mute() to warmup iphone audio here
            this.mute();
            this.mute();
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

            // spacebar: pause and play game
            if (code === 'Space') {
                this.pause();
            }
        }
    }

    handleResize() {

        document.location.reload();
    }

    handlePostMessage(e) {
        // for koji messages
        // https://gist.github.com/rgruesbeck/174d29f244494ead21e2621f6f0d79ee

        console.log('postmesage');
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