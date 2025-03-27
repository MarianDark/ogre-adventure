let player, cursors, jumpSound, hitSound, collectSound, music;
let obstacles, onions, score = 0, level = 1, lives = 3;
let scoreText, levelText, livesText;

let jumpCount = 0;
let slideTimer = null;
let isMuted = false;


function toggleMusic() {
  isMuted = !isMuted;
  if (music) {
    music.setMute(isMuted);
  }

  // Cambia ícono visual
  const btn = document.getElementById('muteButton');
  btn.textContent = isMuted ? "🔇 Unmute" : "🔊 Mute";
}

function startPhaserGame() {
  score = 0;
  level = 1;
  lives = 3;

  const config = {
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%'
    },
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

  this.load.image('ogre_idle', 'assets/ogre_idle.png');
  this.load.image('ogre_run', 'assets/ogre_run.png');
  this.load.image('ogre_slide', 'assets/ogre_slide.png');
  this.load.image('ogre_jump', 'assets/ogre_jump.png');

  this.load.audio('jump', 'assets/jump.mp3');
  this.load.audio('hit', 'assets/hit.mp3');
  this.load.audio('collect', 'assets/collect.mp3');
  this.load.audio('music', 'assets/music_fast.mp3');
}

function create() {
  this.add.image(0, 0, 'bg').setOrigin(0).setDisplaySize(this.scale.width, this.scale.height);

  player = this.physics.add.sprite(100, 380, 'ogre_idle'); // posición a ras del suelo
  player.setCollideWorldBounds(true);
  player.setScale(0.4);

  cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.on('keydown-SPACE', jumpHandler);

  jumpSound = this.sound.add('jump');
  hitSound = this.sound.add('hit');
  collectSound = this.sound.add('collect');
  music = this.sound.add('music', { loop: true, volume: 0.5 });
  music.play();

  obstacles = this.physics.add.group();
  onions = this.physics.add.group();

  this.time.addEvent({ delay: 7000, callback: spawnObstacle, callbackScope: this, loop: true });
  this.time.addEvent({ delay: 4000, callback: spawnOnion, callbackScope: this, loop: true });

  this.physics.add.collider(player, obstacles, hitObstacle, null, this);
  this.physics.add.overlap(player, onions, collectOnion, null, this);

  scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '20px', fill: '#fff' });
  levelText = this.add.text(16, 40, 'Nivel: 1', { fontSize: '20px', fill: '#fff' });
  livesText = this.add.text(16, 64, 'Vidas: 3', { fontSize: '20px', fill: '#fff' });
}

function update() {
  if (player.body.onFloor()) jumpCount = 0;

  // Movimiento lateral
  if (cursors.left.isDown) {
    player.setVelocityX(-500);
    player.flipX = true;
    player.setTexture('ogre_idle'); // puedes cambiar esto por otra imagen si quieres caminar hacia atrás
  } else if (cursors.right.isDown) {
    player.setVelocityX(500);
    player.flipX = false;
    player.setTexture('ogre_run');
  } else {
    player.setVelocityX(0);
    player.setTexture('ogre_idle');
  }

  // Aceleración en el aire
  if (cursors.up.isDown && !player.body.touching.down) {
    player.setVelocityX(player.flipX ? -600 : 600);
  }

  // Slide
  if (cursors.down.isDown && !slideTimer) {
    player.setTexture('ogre_slide');
    player.setScale(0.35, 0.2);
    slideTimer = setTimeout(() => {
      player.setScale(0.4);
      slideTimer = null;
    }, 400);
  } else if (!player.body.touching.down) {
    player.setTexture('ogre_jump');
  }

  Phaser.Actions.IncX(obstacles.getChildren(), -6 - level);
  Phaser.Actions.IncX(onions.getChildren(), -6 - level);
}

function jumpHandler() {
  if (jumpCount < 2) {
    player.setVelocityY(-600);
    jumpSound.play();
    jumpCount++;
  }
}

function spawnObstacle() {
  const yGround = this.scale.height - 70;
  const obst = obstacles.create(850, yGround, 'obstacle').setScale(0.15);
  obst.setImmovable(true);
  obst.body.allowGravity = false;
}

function spawnOnion() {
  const yGround = this.scale.height - 70; // Ajusta "70" según el tamaño de tu imagen de onion
  const onion = onions.create(850, yGround, 'onion').setScale(0.15);
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
