const appWidth = 480;
const appHeight = 720;
let startCountingDown = true;
let countDownTime = 30;
let countDownInterval;
let app = new PIXI.Application({
    width: appWidth,
    height: appHeight
})
document.body.appendChild(app.view);

const container = app.stage;

const loader = new PIXI.Loader();
loader
    .add('field', 'assets/field.jpg')
    .add('aim', 'assets/aim.svg')
    .add('fireBtn', 'assets/fire-btn.svg')
    .add('zombie', 'assets/zombie.svg')
    .add('fail', 'assets/fail.png')
    .add('success', 'assets/success.png')
    .load(afterLoaded)

function appropriatePosition(current, min, max) {
    return current > max ? max : current < min ? min : current;
}

function afterLoaded(loader, resources) {
    const zombies = [];
    // field background
    const fieldTexture = resources['field'].texture;
    const fieldSprite = new PIXI.TilingSprite(fieldTexture, fieldTexture.width, fieldTexture.height);
    fieldSprite.tilePosition.y += -300;
    fieldSprite.tilePosition.x += -200;

    const limitFieldSpritePosition = (newX, newY, tileSprite) => {
        const maxTileSpriteTilePositionX = 0;
        const minTileSpriteTilePositionX = -(tileSprite.width - appWidth);
        const maxTileSpriteTilePositionY = 0;
        const minTileSpriteTilePositionY = -(tileSprite.height - appHeight);

        return [appropriatePosition(newX, minTileSpriteTilePositionX, maxTileSpriteTilePositionX), appropriatePosition(newY, minTileSpriteTilePositionY, maxTileSpriteTilePositionY)];
    }

    fieldSprite
        .on('pointerdown', function (event) {
            // start dragging event
            // store data of dragging event
            // to get position
            this.data = event.data;
            this.oldPosition = this.data.getLocalPosition(this.parent);
            this.dragging = true;
        })
        .on('pointerup', function () {
            this.dragging = false;
            this.data = null;
        })
        .on('pointerupoutside', function () {
            this.dragging = false;
            this.data = null;
        })
        .on('pointermove', function () {
            if (this.dragging) {
                const newPosition = this.data.getLocalPosition(this.parent);

                // calculate distance changes
                const offSetX = newPosition.x - this.oldPosition.x;
                const offSetY = newPosition.y - this.oldPosition.y;

                // calculate new til position of back field
                let newFieldSpriteTileX = fieldSprite.tilePosition.x + offSetX;
                let newFieldSpriteTileY = fieldSprite.tilePosition.y + offSetY;

                // limit scroll to border of field image only
                [newFieldSpriteTileX, newFieldSpriteTileY] = limitFieldSpritePosition(newFieldSpriteTileX, newFieldSpriteTileY, fieldSprite);

                // calculate real change after limit
                const realOffsetX = newFieldSpriteTileX - fieldSprite.tilePosition.x;
                const realOffsetY = newFieldSpriteTileY - fieldSprite.tilePosition.y;
                fieldSprite.tilePosition.x = newFieldSpriteTileX;
                fieldSprite.tilePosition.y = newFieldSpriteTileY;

                // zombie should move along with back field image
                zombies.forEach((zombie, index) => {
                    zombie.x += realOffsetX;
                    zombie.y += realOffsetY;
                });
                this.oldPosition = newPosition;
            }
        })

    container.addChild(fieldSprite);

    // zombie
    function createZombie(x, y) {
        const zombieTexture = resources['zombie'].texture;
        const zombie = PIXI.Sprite.from(zombieTexture);
        zombie.anchor.set(0.5);
        zombie.scale.set(0.5);
        x = x < 75 ? x + 75 : x;
        x = x > (appWidth - 100) ? x - 100 : x;
        zombie.x = x;
        y = y < 325 ? y + 325 : y;
        y = y > (appHeight - 300) ? y - 300 : y;
        zombie.y = y;

        // create some extra properties that will control movement :
        // create a random direction in radians. This is a number between 0 and PI*2 which is the equivalent of 0 - 360 degrees
        zombie.direction = Math.random() * Math.PI * 2;

        // this number will be used to modify the direction of the zombie over time
        zombie.turningSpeed = Math.random() - 0.8;

        // create a random speed for the zombie between 2 - 4
        zombie.speed = 0.08 + Math.random() * 0.16;
        zombies.push(zombie);
        container.addChild(zombie);
    }
    for (let i = 0; i < 5; i++) {
        createZombie(
          Math.floor(Math.random() * app.screen.width),
          Math.floor(Math.random() * app.screen.height),
        );
    }

    // aim image
    const aimTexture = resources['aim'].texture;
    const aimSprite = PIXI.Sprite.from(aimTexture);
    aimSprite.width = 100;
    aimSprite.height = 100;
    aimSprite.x = app.screen.width / 2;
    aimSprite.y = app.screen.height / 2;
    aimSprite.anchor.set(0.5);
    const aimPoint = new PIXI.Point(aimSprite.x, aimSprite.y);


    // header
    const headerText = new PIXI.Text('OBJECT: KILL ALL ZOMBIES', new PIXI.TextStyle({}));
    const zombieCountText = new PIXI.Text('0/5', new PIXI.TextStyle({
        fill: 'red'
    }));
    zombieCountText.x = headerText.width + 10;
    container.addChild(headerText);
    container.addChild(zombieCountText);

    // timer
    const timer = new PIXI.Text(`${countDownTime}`);
    timer.y = 40;
    container.addChild(timer);

    // fire button image
    const fireBtnTexture = resources['fireBtn'].texture;
    const fireBtnSprite = PIXI.Sprite.from(fireBtnTexture);
    fireBtnSprite.width = 80;
    fireBtnSprite.height = 80;
    fireBtnSprite.x = app.screen.width - 80;
    fireBtnSprite.y = app.screen.height - 80;
    fireBtnSprite.anchor.set(0.5);
    // fireBtnSprite.interactive = true;
    fireBtnSprite.on('pointerdown', function () {
        fireBtnSprite.width = 100;
        fireBtnSprite.height = 100;
        aimSprite.y -= 30;
        for (let i = 0; i < zombies.length; i++) {
            if (zombies[i].containsPoint(aimPoint)) {
                const z = zombies[i];
                zombies.splice(i, 1);
                const zombieDieInterval = setInterval(() => {
                   if (z.rotation >= Math.PI * 0.5) {
                       clearInterval(zombieDieInterval);
                       container.removeChild(z);
                   } else {
                       z.rotation += Math.PI * 0.02;
                   }
                }, 5);

                zombieCountText.text = `${5 - zombies.length}/5`;
                break;
            }
        }
        if (!zombies.length) {
            clearInterval(countDownInterval);
            onEnding();
        }
        setTimeout(() => {
            fireBtnSprite.width = 80;
            fireBtnSprite.height = 80;
            aimSprite.y = app.screen.height / 2;
        },100);
    });

    container.children.forEach((c) => {
        c.alpha = 0.5;
        c.interactive = false;
    });

    const zombieMove = () => {
        zombies.forEach((z) => {
            z.x += Math.sin(z.direction) * z.speed;
            z.y += Math.cos(z.direction) * z.speed;
        });
    }

    const overlay = new PIXI.Sprite(PIXI.Texture.EMPTY);
    overlay.width = app.screen.width;
    overlay.height = app.screen.height;
    overlay.interactive = true;


    const startText = new PIXI.Text('Scrolling to start', new PIXI.TextStyle({}));
    startText.anchor.set(0.5);
    startText.x = app.screen.width/2;
    startText.y = app.screen.height/2;
    container.addChild(startText);

    overlay.on('pointerdown', function () {
        container.children.forEach((c) => {
            c.alpha = 1;
        });
        container.removeChild(startText);
        container.addChild(aimSprite);
        container.addChild(fireBtnSprite);
        fieldSprite.interactive = true;
        fireBtnSprite.interactive = true;
        app.ticker.add(zombieMove);

        countDownInterval = setInterval(() => {
            --countDownTime;
            timer.text = countDownTime;
            if (!countDownTime) {
                clearInterval(countDownInterval);
                onEnding();
            }
        }, 1000);
        container.removeChild(overlay);
    });
    container.addChild(overlay);


    const onEnding = () => {
        container.children.forEach((c) => {
            c.alpha = 0.5;
            c.interactive = false;
        });
        container.removeChild(aimSprite);
        container.removeChild(fireBtnSprite);
        const texture = resources[zombies.length ? 'fail' : 'success'].texture;
        const sprite = PIXI.Sprite.from(texture);
        sprite.anchor.set(0.5);
        sprite.width = 320;
        sprite.height = 280;
        sprite.x = appWidth/2;
        sprite.y = appHeight/2;
        container.addChild(sprite);
        app.ticker.remove(zombieMove);
    }
}

