var game = new Phaser.Game(
  800, 600,
  Phaser.AUTO,
  "barkanoid",
  {
    preload: phaserPreload,
    create: phaserCreate,
    update: phaserUpdate
  }
);

var ball;
var paddle;
var tiles;
var livesText;
var introText = "Press Space to Begin!";
var background;
var cursors;
var text;

var dead = false;

var bounce;
var explosion;

var ballOnPaddle = true;
var lives = 3;
var score = 0;

var heartEmitter;

var heart0, heart1, heart2;

var scoreText = "0";

var defaultTextOptions = {
  font: "20px Arial",
  align: "left",
  fill: "#ffffff"
};

var boldTextOptions = {
  font: "20px Arial",
  fill: "#ffffff",
  align: "center"
};

function phaserPreload(){
  game.load.image("background", "assets/background.png");

  game.load.image("tile0", "assets/tile0.png");
  game.load.image("tile1", "assets/tile1.png");
  game.load.image("tile2", "assets/tile2.png");
  game.load.image("tile3", "assets/tile3.png");
  game.load.image("tile4", "assets/tile4.png");
  game.load.image("tile5", "assets/tile5.png");

  game.load.image("particle0", "assets/particle0.png");
  //game.load.image("particle1", "assets/particle1.png");

  game.load.image("hearticle", "assets/hearticle.png");

  game.load.image("heart", "assets/heart.png");

  game.load.image("paddle", "assets/paddle.png");
  game.load.image("ball", "assets/ball.png");


  game.load.audio('bounce', ['assets/audio/bouncer.ogg']);
  game.load.audio('explosion', ['assets/audio/explode.ogg']);
}

function phaserCreate(){


  // Use arcade style physics no collision on bottom of screen
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.arcade.checkCollision.down = false;

  background = game.add.tileSprite(0, 0, 800, 600, "background");

  tiles = game.add.group();
  tiles.enableBody = true;
  tiles.physicsBodyType = Phaser.Physics.ARCADE;

  for (var y = 0; y < 4; y++){
    for (var x = 0; x < 15; x++){
      var randomTileNumber = Math.floor(Math.random() * 6);
      var tile = tiles.create(120 + (x * 36), 100 + (y * 52), "tile" + randomTileNumber);
      tile.body.bounce.set(1);
      tile.body.immovable = true;
    }
  }

  paddle = game.add.sprite(game.world.centerX, 500, "paddle");
  paddle.anchor.setTo(0.5, 0.5);
  game.physics.enable(paddle, Phaser.Physics.ARCADE);
  paddle.body.collideWorldBounds = true;
  paddle.body.bounce.set(1);
  paddle.body.immovable = true;

  ball = game.add.sprite(game.world.centerX, paddle.y - 16, "ball");
  ball.anchor.set(0.5);
  ball.checkWorldBounds = true;
  game.physics.enable(ball, Phaser.Physics.ARCADE);
  ball.body.collideWorldBounds = true;
  ball.body.bounce.set(1);
  ball.events.onOutOfBounds.add(helpers.death, this);

  text = game.add.text(game.world.width-10, 5, scoreText);
  text.anchor.set(1,0);
  text.align = 'center';

  text.font = 'Arial';
  text.fontWeight = 'bold';
  text.fontSize = 24;
  text.fill = '#FFFFFF';

  heart0 = game.add.sprite(10,10,'heart');
  heart1 = game.add.sprite(32,10,'heart');
  heart2 = game.add.sprite(54,10,'heart');

  introText = game.add.text(game.world.centerX-10, game.world.centerY+20, introText);
  introText.anchor.set(0.5,0.5);
  introText.align = 'center';

  introText.font = 'Arial';
  introText.fontWeight = 'bold';
  introText.fontSize = 52;
  introText.fill = '#FFFFFF';

  /*
      Particle fun
  */
  emitter = game.add.emitter(0,0,100);
  emitter.makeParticles('particle0');
  emitter.gravity = 200;

  /*heartEmitter = game.add.emitter(0,0,100);
  heartEmitter.makeParticle('hearticle');
  heartEmitter.gravity = 200; // I'm so lazy .__.*/

  bounce = game.add.audio('bounce');
  explosion = game.add.audio('explosion');


  cursors = this.input.keyboard.createCursorKeys();
  release = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function phaserUpdate(){




  if (dead && release.isDown)
    reset();


  if(release.isDown && ballOnPaddle && !dead )
  {
    helpers.release();
  }



  /*
    Paddle motion + acceleration! :D
  */
  if (paddle.body.velocity.x > 0)
    paddle.body.velocity.x-=50;
  else if (paddle.body.velocity.x < 0)
    paddle.body.velocity.x+=50;
  else
    paddle.body.velocity.x=0;

  if (cursors.left.isDown)
  {
      paddle.body.velocity.x = -400;
  }
  else if (cursors.right.isDown)
  {
      paddle.body.velocity.x = 400;
  }



  if (paddle.x < 24){
    paddle.x = 24;
  } else if (paddle.x > game.width - 24){
    paddle.x = game.width - 24;
  }

  if (ballOnPaddle){
    ball.body.x = paddle.x;
  } else {
    game.physics.arcade.collide(ball, paddle, helpers.ballCollideWithPaddle, null, this);
    game.physics.arcade.collide(ball, tiles, helpers.ballCollideWithTiles, null, this);
  }


}

function particleBurst(x, y){
  emitter.x = x;
  emitter.y = y;

  explosion.play();

  emitter.start(true, 2000, null, 20);
}

function reset()
{
  dead = false;
  lives = 3;
  score = 0;

  ballOnPaddle = true;

  text.setText(score);

  ball.body.velocity.set(0);
  ball.x = paddle.x + 16;
  ball.y = paddle.y - 16;

  tiles.callAll("revive");
  heart0.visible = true;
  heart1.visible = true;
  heart2.visible = true;


}

var helpers = {

  release: function(){
    if (ballOnPaddle) {
      ballOnPaddle = false;
      ball.body.velocity.y = -300;
      ball.body.velocity.x = -75;
      introText.visible = false;
    }
  },

  death: function() {
    lives--;
    explosion.play();

    // AWFUL implementation, please fix
    if (lives === 2)
    {
        heart2.visible = false;
        particleBurst(64,20);
    }
    else if (lives == 1)
    {
        heart1.visible = false;
        particleBurst(42,20);
    }

    if (lives === 0) {
      heart0.visible = false;
      particleBurst(20,20);
      helpers.gameOver();
    } else {
      ballOnPaddle = true;
      ball.reset(paddle.body.x + 16, paddle.y - 16);
    }
  },

  gameOver: function() {
    ball.body.velocity.setTo(0, 0);
    introText.text = "Game Over!";
    introText.visible = true;

    dead = true;
  },

  ballCollideWithTiles: function(ball, tile){
    tile.kill();

    particleBurst(tile.body.x + 16, tile.body.y + 8);


    score += 10;
    //scoreText = "score: " + score;

    text.setText(score);

    if (tiles.countLiving() <= 0){
      score += 1000;
      introText.text = "You Win!";

      dead = true;
    }
  },

  ballCollideWithPaddle: function(ball, paddle){
    var diff = 0;

    bounce.play();

    if (ball.x < paddle.x){
      diff = paddle.x - ball.x;
      ball.body.velocity.x = (-10 * diff);
    } else if (ball.x > paddle.x){
      diff = ball.x -paddle.x;
      ball.body.velocity.x = (10 * diff);
    } else {
      ball.body.velocity.x = 2 + Math.random() * 8;
    }
  }
};
