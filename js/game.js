let player, cursors, jumpSound, hitSound, collectSound, music;
let obstacles, onions, score = 0, level = 1, lives = 3;
let scoreText, levelText, livesText;

let jumpCount = 0;
let slideTimer = null;

function startPhaserGame() {
  score = 0;
  level = 1;
  lives = 3;

  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'gameContainer',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 800 }, debug: false }
    },
    scene: { preload, create, update }
  };

  return new Phaser.Game(config);
}

function preload() {
  this.load.image('bg', 'assets/game_background.png');
  this.load.image('obstacle', 'assets/log.png');
  this.load.image('onion', 'assets/onion.png');
  this.load.spritesheet('ogre', 'assets/ogre_spritesheet.png', { frameWidth: 64, frameHeight: 64 });

  this.load.audio('jump', 'assets/jump.mp3');
  this.load.audio('hit', 'assets/hit.mp3');
  this.load.audio('collect', 'assets/collect.mp3');
  this.load.audio('music', 'assets/music_fast.mp3');
}

function create() {
  this.add.image(400, 225, 'bg');

  player = this.physics.add.sprite(100, 300, 'ogre').setScale(1);
  player.setCollideWorldBounds(true);

  this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('ogre', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });
  player.anims.play('run', true);

  cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.on('keydown-SPACE', jumpHandler);

  jumpSound = this.sound.add('jump');
  hitSound = this.sound.add('hit');
  collectSound = this.sound.add('collect');
  music = this.sound.add('music', { loop: true, volume: 0.5 });
  music.play();

  obstacles = this.physics.add.group();
  onions = this.physics.add.group();

  this.time.addEvent({ delay: 1500, callback: spawnObstacle, callbackScope: this, loop: true });
  this.time.addEvent({ delay: 3000, callback: spawnOnion, callbackScope: this, loop: true });

  this.physics.add.collider(player, obstacles, hitObstacle, null, this);
  this.physics.add.overlap(player, onions, collectOnion, null, this);

  scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '20px', fill: '#fff' });
  levelText = this.add.text(16, 40, 'Nivel: 1', { fontSize: '20px', fill: '#fff' });
  livesText = this.add.text(16, 64, 'Vidas: 3', { fontSize: '20px', fill: '#fff' });
}

function update() {
  if (player.body.onFloor()) jumpCount = 0;

  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.flipX = true;
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.flipX = false;
  } else {
    player.setVelocityX(0);
  }

  if (cursors.up.isDown && !player.body.touching.down) {
    player.setVelocityX(player.flipX ? -300 : 300);
  }

  if (cursors.down.isDown && !slideTimer) {
    player.setScale(1, 0.5);
    slideTimer = setTimeout(() => {
      player.setScale(1, 1);
      slideTimer = null;
    }, 400);
  }

  Phaser.Actions.IncX(obstacles.getChildren(), -5 - level);
  Phaser.Actions.IncX(onions.getChildren(), -5 - level);
}

function jumpHandler() {
  if (jumpCount < 2) {
    player.setVelocityY(-400);
    jumpSound.play();
    jumpCount++;
  }
}

function spawnObstacle() {
  const obst = obstacles.create(850, 380, 'obstacle').setScale(0.15);
  obst.setImmovable(true);
  obst.body.allowGravity = false;
}

function spawnOnion() {
  const onion = onions.create(850, Phaser.Math.Between(250, 370), 'onion').setScale(0.15);
  onion.body.allowGravity = false;
}

function collectOnion(player, onion) {
  collectSound.play();
  onion.destroy();
  score += 2;
  updateScore();
}

function hitObstacle(player, obstacle) {
  hitSound.play();
  lives--;
  livesText.setText('Vidas: ' + lives);
  obstacle.destroy();

  if (lives <= 0) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.stop();
    music.stop();

    document.getElementById("finalScore").innerText = "Puntos: " + score;
    document.getElementById("gameOverScreen").style.display = "flex";
  }
}

function updateScore() {
  scoreText.setText('Puntos: ' + score);
  if (score % 10 === 0 && score !== 0) {
    level++;
    levelText.setText('Nivel: ' + level);
  }
}
