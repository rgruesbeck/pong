/**
 * game/character/ball.js
 * 
 * What it Does:
 *   This file is a basic ball character
 *   it extends the Sprite class and adds two collision detections methods
 * 
 * What to Change:
 *   Add any character specific methods
 *   eg. eat
 * 
 */

import ImageSprite from '../objects/imageSprite.js';

class Ball extends ImageSprite {
    constructor(options) {
        super(options);

        this.dx = 1;
        this.dy = 1;
        this.launched = true;
    }

    move(m) {
        if (!this.launched) { return; }

        super.move(this.dx, this.dy, m);
    }

    launch(delay, dx) {
        this.stop();
        if (delay) {
            setTimeout(() => {
                this.launched = true;
                this.x = this.x + dx;
                this.dx = dx;
            }, delay);
        } else {
            this.launched = true;
            this.x = this.x + dx;
            this.dx = dx;
        }
    }

    stop() {
        this.launched = false;
        this.dx = 0;
    }

    collisionsWith(entities) {
        let result = entities
        .find((ent) => { return this.collidesWith(ent); });

        return result;
    };

    collidesWith(entity) {
        let vx = entity.cx - this.cx;
        let vy = entity.cy - this.cy;
        let distance = Math.sqrt(vx * vx + vy * vy);
        return distance < (entity.radius + this.radius);
    }
}

export default Ball;