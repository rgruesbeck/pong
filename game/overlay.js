/**
 * game/overlay.js
 * 
 * What it Does:
 *   This file provides methods for showing and setting text, buttons, etc on the an html overlay of the game screen.
 *   
 *   show(<node string>):
 *   show is a helper that takes string matching the node to show
 *   eg. show('button')
 * 
 *   hide(<node string>):
 *   hide is a helper that takes string matching the node to hide
 *   eg. hide('button')
 *   
 * What to Change:
 *   changes to the overlay are mage here, index.html, and style.css
 *   
 * How to Use it:
 *   write some html containing the 
 *   pass a dom node into the Overlay constructor
 *   eg. const overlay = new Overlay(<overlay node>);
 * 
 */

class Overlay {
    constructor(node) {
        this.root = node;

        this.container = node.querySelector('.container');

        this.loading = node.querySelector('#loading');
        this.banner = node.querySelector('#banner');
        this.button = node.querySelector('#button');

        this.instructions = node.querySelector('#instructions');

        this.score1 = node.querySelector('#score1');
        this.score2 = node.querySelector('#score2');
        this.mute = node.querySelector('#mute');
        this.pause = node.querySelector('#pause');

        this.styles = {};
    }

    setLoading() {
        this.show('loading');
    }

    hideLoading() {
        this.hide('loading');
    }

    setBanner(message) {
        this.banner.textContent = message;
        this.show('banner');
    }

    hideBanner() {
        this.hide('banner');
    }

    setButton(message) {
        this.button.style.fontFamily = this.styles.fontFamily;
        // fix for safari
        this.button.innerHTML = `<span id="buttonspan">${message}</span>`;
        this.show('button');
    }

    hideButton() {
        this.hide('button');
    }

    setInstructions({ desktop, mobile }) {
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
            // show mobile instructions

            this.instructions.textContent = mobile;
        } else {
            // show desktop instructions

            this.instructions.textContent = desktop;
        }
        this.show('instructions');
    }

    hideInstructions() {
        this.hide('instructions');
    }

    showStats() {
        this.show('score1');
        this.show('score2');
    }

    setScore1(score) {
        this.score1.textContent = `P1: ${score}`;
    }

    setScore2(score) {
        this.score2.textContent = `P2: ${score}`;
    }

    setStyles(styles) {
        this.styles = { ...this.styles, ...styles };
        this.applyStyles();
    }

    applyStyles() {
        this.container.style.color = this.styles.textColor;
        this.container.style.fontFamily = this.styles.fontFamily;

        this.button.style.backgroundColor = this.styles.primaryColor;
    }

    setMute(muted) {
        this.mute.textContent = muted ? 'volume_off' : 'volume_up';
        this.show('mute');
    }

    setPause(paused) {
        this.pause.textContent = paused ? 'play_arrow' : 'pause';
        this.show('pause');
    }

    show(node) {
        this[node].active = true;
        this[node].style.visibility = 'visible';
        this[node].style.opacity = 1;
    }

    hide(node) {
        this[node].active = false;
        this[node].style.opacity = 0;
        this[node].style.visibility = 'hidden';
    }
}

export default Overlay;