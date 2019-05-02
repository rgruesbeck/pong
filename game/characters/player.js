/**
 * game/character/player.js
 * 
 * What it Does:
 *   This file is a basic player character
 *   it extends the Sprite class and adds two collision detections methods
 * 
 * What to Change:
 *   Add any character specific methods
 *   eg. eat
 * 
 */

import Sprite from '../objects/sprite.js';

class Player extends Sprite {
    constructor(options) {
        super(options);

        this.ctx = options.ctx;
        this.color = options.color;
    }

    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    collisionsWith(entities) {
        let result = Object.entries(entities)
        .find((ent) => { return this.collidesWith(ent[1]); })
        ? true : false;

        return result;
    };

    collidesWith(entity) {
        let vx = entity.cx - this.cx;
        let vy = entity.cy - this.cy;
        let distance = Math.sqrt(vx * vx + vy * vy);
        return distance < (entity.radius + this.radius);
    }
}

export default Player;