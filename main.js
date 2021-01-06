const appWidth = 480;
const appHeight = 720;
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
    .add('zombie', 'assets/zombie.png')
    .load(afterLoaded)

function appropriatePosition(current, min, max) {
    return current > max ? max : current < min ? min : current;
}

function afterLoaded(loader, resources) {
    const zombies = [];
    // field background
    const fieldTexture = resources['field'].texture;
    const fieldSprite = new PIXI.TilingSprite(fieldTexture, fieldTexture.width, fieldTexture.height);
    fieldSprite.interactive = true;
    fieldSprite.tilePosition.y += -300;
    fieldSprite.tilePosition.x += -200;

    const limitFieldSpritePosition = (tileSprite) => {
        const maxTileSpriteTilePositionX = 0;
        const minTileSpriteTilePositionX = -(tileSprite.width - appWidth);
        const maxTileSpriteTilePositionY = 0;
        const minTileSpriteTilePositionY = -(tileSprite.height - appHeight);
        let x = tileSprite.tilePosition.x;
        let y = tileSprite.tilePosition.y;

        return [appropriatePosition(x, minTileSpriteTilePositionX, maxTileSpriteTilePositionX), appropriatePosition(y, minTileSpriteTilePositionY, maxTileSpriteTilePositionY)];
    }

    fieldSprite
        .on('pointerdown', function (event) {
            // start dragging event
            // store data of dragging event
            // to get position
            this.data = event.data;
            this.oldPosition = this.data.getLocalPosition(this.parent);
            this.dragging = true
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
                const offSetX = newPosition.x - this.oldPosition.x;
                const offSetY = newPosition.y - this.oldPosition.y;
                fieldSprite.tilePosition.x += offSetX;
                fieldSprite.tilePosition.y += offSetY;
                [fieldSprite.tilePosition.x, fieldSprite.tilePosition.y] = limitFieldSpritePosition(fieldSprite);
                zombies.forEach((zombie, index) => {
                    zombie.x += offSetX;
                    zombie.x = appropriatePosition(zombie.x, zombie.minX, zombie.maxX);
                    if (!index) {
                        console.log('maxX:' + zombie.maxX + ' ---- minX: ' + zombie.minX);
                        console.log('x:' + zombie.x);
                    }
                    zombie.y += offSetY;
                    zombie.y = appropriatePosition(zombie.y, zombie.minY, zombie.maxY);
                });
                this.oldPosition = newPosition;
            }
        })

    app.stage.addChild(fieldSprite);

    // zombie
    function createZombie(x, y) {
        const zombieTexture = resources['zombie'].texture;
        const zombie = PIXI.Sprite.from(zombieTexture);
        zombie.anchor.set(0.5);
        zombie.scale.set(0.3);
        x = x < 75 ? x + 75 : x;
        x = x > (appWidth - 75) ? x - 75 : x;
        zombie.x = x;
        y = y < 325 ? y + 325 : y;
        y = y > (appHeight - 100) ? y - 100 : y;
        zombie.y = y;
        zombie.maxX = zombie.x - fieldSprite.tilePosition.x;
        zombie.minX = zombie.x - (fieldTexture.width - (appWidth - fieldSprite.tilePosition.x)); // the remain length on the right
        zombie.maxY = zombie.y - fieldSprite.tilePosition.y;
        zombie.minY = zombie.y - (fieldTexture.height - (appHeight - fieldSprite.tilePosition.y)); // the remain height on bottom
        zombies.push(zombie);
        app.stage.addChild(zombie);
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
    app.stage.addChild(aimSprite);

    // fire button image
    const fireBtnTexture = resources['fireBtn'].texture;
    const fireBtnSprite = PIXI.Sprite.from(fireBtnTexture);
    fireBtnSprite.width = 80;
    fireBtnSprite.height = 80;
    fireBtnSprite.x = app.screen.width - 80;
    fireBtnSprite.y = app.screen.height - 80;
    fireBtnSprite.anchor.set(0.5);
    fireBtnSprite.interactive = true;
    fireBtnSprite.on('pointerdown', function () {
        fireBtnSprite.width = 100;
        fireBtnSprite.height = 100;
        aimSprite.y -= 30;
        setTimeout(() => {
            fireBtnSprite.width = 80;
            fireBtnSprite.height = 80;
            aimSprite.y = app.screen.height / 2;
        },100);
    });
    app.stage.addChild(fireBtnSprite);

}

