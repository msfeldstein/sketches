const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 604;
const LAVA_TOP = 618;
const GRAVITY = 0.75;
const keys = new Set();
const justPressed = new Set();

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;

function keyName(event) {
  if (event.code === "Space") return "Space";
  if (event.code === "Enter") return "Enter";
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") return "Shift";
  return event.key.toLowerCase();
}

window.addEventListener("keydown", (event) => {
  const name = keyName(event);
  if (!keys.has(name)) justPressed.add(name);
  keys.add(name);
  if (
    [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Space",
      "ShiftLeft",
      "ShiftRight",
    ].includes(event.code)
  ) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(keyName(event));
});

function isDown(...names) {
  return names.some((name) => keys.has(name));
}

function wasPressed(...names) {
  return names.some((name) => justPressed.has(name));
}

function drawText(text, x, y, size, color = "#fff6dd", align = "center") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "Trebuchet MS", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 8;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapText(text, x, y, maxWidth, lineHeight, size, color = "#fff6dd") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "Trebuchet MS", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 8;
  const words = text.split(" ");
  let line = "";
  let row = 0;
  words.forEach((word, index) => {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && index > 0) {
      ctx.fillText(line.trim(), x, y + row * lineHeight);
      line = `${word} `;
      row += 1;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line.trim(), x, y + row * lineHeight);
  ctx.restore();
}

function roundedRect(x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.closePath();
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

const game = {
  mode: "title",
  time: 0,
  sceneTime: 0,
  message: "",
  messageTime: 0,
  battleIndex: 0,
  cameraShake: 0,
  lavaLevel: HEIGHT + 40,
  clouds: Array.from({ length: 13 }, (_, i) => ({
    x: (i * 167) % WIDTH,
    y: 70 + (i % 4) * 45,
    scale: 0.7 + (i % 5) * 0.16,
    speed: 0.18 + (i % 3) * 0.07,
  })),
  stars: Array.from({ length: 80 }, () => ({
    x: rand(0, WIDTH),
    y: rand(0, HEIGHT * 0.55),
    r: rand(0.7, 2.2),
    twinkle: rand(0, TAU),
  })),
  particles: [],
  projectiles: [],
  animals: [],
  boss: null,
};

const introScenes = [
  {
    duration: 5.4,
    kind: "jump",
    caption:
      "A blue jumping suit wakes up. It can jump really, really high.",
  },
  {
    duration: 5.8,
    kind: "flood",
    caption:
      "The world starts flooding with lava, so the hero jumps up to the clouds.",
  },
  {
    duration: 5.6,
    kind: "shop",
    caption:
      "In a cloud shop, the hero buys a lava suit made for floating in lava.",
  },
  {
    duration: 5.4,
    kind: "dive",
    caption:
      "Crouch, keep crouching, shoot downward, and splash into the lava.",
  },
];

const battles = [
  {
    name: "Purple Antenna Circle",
    subtitle: "Tiny purple people stick to black tiles and chant da-da-da.",
    type: "chorus",
    maxPower: 120,
    color: "#a94cff",
  },
  {
    name: "Metal Round Sphere",
    subtitle:
      "A metal shell cracks open. You notice bad-guy darkness on the suit.",
    type: "sphere",
    maxPower: 155,
    color: "#b7c0d7",
  },
  {
    name: "The King's Hammer",
    subtitle:
      "The king shoots around the tiles. Hit the target spot to drain his power.",
    type: "king",
    maxPower: 190,
    color: "#f24848",
  },
  {
    name: "The Orange Prince",
    subtitle:
      "The prince is fireproof, eats animals, and fires a very sick laser.",
    type: "prince",
    maxPower: 210,
    color: "#ff8b24",
  },
  {
    name: "Princess and Queen",
    subtitle:
      "The queen has the crown. Knock it off and clear the suit's blackness.",
    type: "royal",
    maxPower: 260,
    color: "#ff6ad5",
  },
];

const player = {
  x: 170,
  y: GROUND_Y - 96,
  w: 45,
  h: 86,
  vx: 0,
  vy: 0,
  facing: 1,
  onGround: false,
  crouching: false,
  diving: false,
  laserCooldown: 0,
  punchCooldown: 0,
  hammerCooldown: 0,
  hurtCooldown: 0,
  energy: 100,
  darkness: 0,
  hasLavaSuit: false,
  hasHammer: false,
  shellPower: "none",
  checkpointX: 170,
  checkpointY: GROUND_Y - 96,
};

function addParticle(x, y, vx, vy, radius, color, life, gravity = 0) {
  game.particles.push({ x, y, vx, vy, radius, color, life, maxLife: life, gravity });
}

function burst(x, y, color, count = 18, speed = 5) {
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, TAU);
    const mag = rand(speed * 0.25, speed);
    addParticle(
      x,
      y,
      Math.cos(angle) * mag,
      Math.sin(angle) * mag,
      rand(3, 8),
      color,
      rand(0.35, 0.8),
      0.1
    );
  }
}

function say(message, seconds = 3.2) {
  game.message = message;
  game.messageTime = seconds;
}

function resetPlayerForBattle() {
  player.x = player.checkpointX;
  player.y = player.checkpointY;
  player.vx = 0;
  player.vy = 0;
  player.energy = 100;
  player.hurtCooldown = 1.2;
  player.crouching = false;
  player.diving = false;
  game.projectiles = [];
  game.animals = [];
}

function startBattle(index) {
  game.battleIndex = index;
  const spec = battles[index];
  player.checkpointX = 160;
  player.checkpointY = GROUND_Y - player.h;
  resetPlayerForBattle();
  game.mode = "battle";
  game.sceneTime = 0;
  game.lavaLevel = LAVA_TOP;
  game.boss = createBoss(spec);
  say(`${spec.name}: ${spec.subtitle}`, 4.8);
}

function createBoss(spec) {
  const common = {
    name: spec.name,
    type: spec.type,
    power: spec.maxPower,
    maxPower: spec.maxPower,
    color: spec.color,
    x: 920,
    y: 384,
    radius: 54,
    phase: 0,
    cooldown: 1.4,
    defeated: false,
    crown: spec.type === "royal",
    targetAngle: 0,
    animalsReleased: 0,
  };

  if (spec.type === "chorus") {
    common.minions = Array.from({ length: 7 }, (_, i) => ({
      angle: (i / 7) * TAU,
      radius: 86,
      chant: i % 2 ? "da" : "DA",
    }));
    common.tiles = common.minions.map((minion) => ({
      x: common.x + Math.cos(minion.angle) * minion.radius,
      y: common.y + Math.sin(minion.angle) * minion.radius,
      angle: minion.angle,
    }));
  }

  if (spec.type === "sphere") {
    common.shell = 1;
    common.badGuys = Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * TAU,
      radius: 42 + (i % 2) * 24,
    }));
  }

  if (spec.type === "king") {
    common.tiles = Array.from({ length: 5 }, (_, i) => ({
      x: 740 + i * 80,
      y: 315 + Math.sin(i) * 60,
    }));
    common.tileIndex = 0;
    common.bridgeBroken = false;
    common.bridgeFixed = false;
    common.bridgeParts = 3;
    common.jumpTimer = 1.0;
  }

  if (spec.type === "prince") {
    common.animalTimer = 1.2;
    common.shieldAngle = 0;
    common.fireproofHintShown = false;
  }

  if (spec.type === "royal") {
    common.princess = {
      x: 780,
      y: 405,
      radius: 42,
      power: 95,
      maxPower: 95,
      cooldown: 1.0,
    };
    common.queen = {
      x: 990,
      y: 360,
      radius: 58,
      power: 165,
      maxPower: 165,
      cooldown: 1.6,
      crown: true,
    };
  }

  return common;
}

function playerBounds() {
  return {
    x: player.x - player.w / 2,
    y: player.y,
    w: player.w,
    h: player.crouching ? player.h * 0.62 : player.h,
  };
}

function bossBounds(boss = game.boss) {
  if (!boss) return { x: 0, y: 0, w: 0, h: 0 };
  return {
    x: boss.x - boss.radius,
    y: boss.y - boss.radius,
    w: boss.radius * 2,
    h: boss.radius * 2,
  };
}

function damagePlayer(amount, sourceX) {
  if (player.hurtCooldown > 0 || game.mode !== "battle") return;
  player.energy -= amount;
  player.hurtCooldown = 0.9;
  player.vx = sourceX < player.x ? 9 : -9;
  player.vy = -8;
  game.cameraShake = Math.max(game.cameraShake, 8);
  burst(player.x, player.y + 38, "#3bd2ff", 12, 4);
  if (player.energy <= 0) {
    say("You lost your suit power. Restarting this battle checkpoint!", 3.6);
    game.sceneTime = -2.0;
    player.energy = 1;
    setTimeout(() => {
      if (game.mode === "battle") resetPlayerForBattle();
    }, 900);
  }
}

function damageBoss(amount, x, y, method) {
  const boss = game.boss;
  if (!boss || boss.defeated) return;

  if (boss.type === "royal") {
    const target = nearestRoyalTarget(x, y);
    if (!target) return;
    target.power = Math.max(0, target.power - amount);
    boss.power = boss.princess.power + boss.queen.power;
    burst(x, y, target === boss.queen ? "#ff6ad5" : "#ffd1f1", 10, 4);
    if (target === boss.queen && target.crown && (method === "hammer" || method === "animal")) {
      target.crown = false;
      burst(target.x, target.y - 65, "#ffe36e", 28, 6);
      say("The queen's crown popped off!", 2.6);
    }
  } else {
    if (boss.type === "sphere" && boss.shell > 0) {
      boss.shell = Math.max(0, boss.shell - amount / 95);
      amount *= 0.35;
      if (boss.shell === 0) {
        player.darkness = Math.max(player.darkness, 0.55);
        say("Bad guys spill out. Squiggly black darkness crawls onto the suit!", 4);
        burst(boss.x, boss.y, "#1a0a24", 35, 8);
      }
    }

    if (boss.type === "king" && method !== "target") {
      amount *= 0.3;
      if (Math.random() < 0.08) say("The king only loses big power on the glowing target spot!", 2.8);
    }

    if (boss.type === "prince" && method === "laser") {
      amount = 0;
      if (!boss.fireproofHintShown) {
        boss.fireproofHintShown = true;
        say("The orange prince is fireproof. Lasers splash off him!", 3.2);
      }
    }

    boss.power = Math.max(0, boss.power - amount);
    burst(x, y, method === "target" ? "#fff16b" : boss.color, 12, 4.5);
  }

  if (boss.power <= 0) {
    defeatBoss();
  }
}

function nearestRoyalTarget(x, y) {
  const boss = game.boss;
  if (!boss || boss.type !== "royal") return null;
  const queenDistance = Math.hypot(x - boss.queen.x, y - boss.queen.y);
  const princessDistance = Math.hypot(x - boss.princess.x, y - boss.princess.y);
  if (queenDistance < boss.queen.radius + 50) return boss.queen;
  if (princessDistance < boss.princess.radius + 50) return boss.princess;
  return queenDistance < princessDistance ? boss.queen : boss.princess;
}

function defeatBoss() {
  const boss = game.boss;
  boss.defeated = true;
  game.cameraShake = 13;
  burst(boss.x, boss.y, "#fff16b", 45, 9);

  if (boss.type === "king") {
    player.hasHammer = true;
    say("You picked up the King's Hammer. It was once huge, but now it is yours!", 5);
  } else if (boss.type === "prince") {
    say("The prince lost his power and coughed up the animals he ate!", 4);
    releaseAnimal(boss.x, boss.y, true);
  } else if (boss.type === "royal") {
    player.darkness = 0;
    say("The blackness goes away from your suit. Game one is complete!", 5);
  } else {
    say(`${boss.name} lost all its power!`, 3);
  }
}

function advanceAfterDefeat(dt) {
  if (!game.boss || !game.boss.defeated) return;
  game.boss.phase += dt;
  if (game.boss.phase < 3.5) return;
  if (game.battleIndex + 1 < battles.length) {
    startBattle(game.battleIndex + 1);
  } else {
    game.mode = "ending";
    game.sceneTime = 0;
  }
}

function shootLaser() {
  if (player.laserCooldown > 0) return;
  player.laserCooldown = 0.28;
  const downShot = player.crouching && isDown("arrowdown", "s");
  const vx = downShot ? 0 : player.facing * 18;
  const vy = downShot ? 20 : 0;
  const projectile = {
    kind: "laser",
    x: player.x + player.facing * 28,
    y: player.y + (player.crouching ? 44 : 31),
    vx,
    vy,
    w: downShot ? 10 : 42,
    h: downShot ? 42 : 10,
    color: "#4de8ff",
    life: 0.75,
    damage: downShot ? 18 : 13,
  };
  game.projectiles.push(projectile);
  burst(projectile.x, projectile.y, "#4de8ff", 5, 2.2);
}

function punch() {
  if (player.punchCooldown > 0) return;
  player.punchCooldown = 0.42;
  const hit = {
    x: player.x + player.facing * 48 - 24,
    y: player.y + 25,
    w: 56,
    h: 44,
  };
  if (game.boss && rectsOverlap(hit, bossBounds())) {
    damageBoss(18, hit.x + hit.w / 2, hit.y + hit.h / 2, "punch");
  }
  burst(player.x + player.facing * 52, player.y + 42, "#fff6dd", 7, 2.6);
}

function swingHammer() {
  if (!player.hasHammer) {
    punch();
    return;
  }
  if (player.hammerCooldown > 0) return;
  player.hammerCooldown = 0.62;

  const shellBonus = player.shellPower === "green" ? 12 : 0;
  const hit = {
    x: player.x + player.facing * 64 - 34,
    y: player.y + 4,
    w: 76,
    h: 76,
  };

  if (game.boss && rectsOverlap(hit, bossBounds())) {
    damageBoss(27 + shellBonus, hit.x + hit.w / 2, hit.y + hit.h / 2, "hammer");
  }

  game.projectiles.forEach((projectile) => {
    if (projectile.kind === "enemy" && rectsOverlap(hit, projectile)) {
      projectile.life = 0;
      burst(projectile.x, projectile.y, "#9cff76", 8, 3);
    }
  });

  burst(player.x + player.facing * 58, player.y + 42, "#ffe36e", 12, 4);
}

function throwAnimal(animal) {
  game.projectiles.push({
    kind: "animal",
    animalType: animal.type,
    x: player.x + player.facing * 28,
    y: player.y + 20,
    vx: player.facing * (animal.type === "turtle" ? 15 : 12),
    vy: animal.type === "turtle" ? -2 : -6,
    w: animal.type === "turtle" ? 30 : 26,
    h: animal.type === "turtle" ? 22 : 28,
    color: animal.color,
    life: 2.0,
    damage: animal.type === "turtle" ? 35 : 20,
  });
  animal.caught = false;
  animal.life = 0;
  say(
    animal.type === "turtle"
      ? "Green turtle shell power!"
      : "You threw a rescued animal back at the bad guys!",
    1.8
  );
}

function releaseAnimal(x, y, forceTurtle = false) {
  const isTurtle = forceTurtle || Math.random() < 0.16;
  game.animals.push({
    type: isTurtle ? "turtle" : ["rabbit", "bird", "fox"][Math.floor(rand(0, 3))],
    x,
    y,
    vx: rand(-4, 4),
    vy: rand(-11, -6),
    color: isTurtle ? "#59ff67" : ["#fff4a3", "#f6c28b", "#d5e9ff"][Math.floor(rand(0, 3))],
    caught: false,
    life: 10,
  });
}

function updatePlayer(dt) {
  const left = isDown("arrowleft", "a");
  const right = isDown("arrowright", "d");
  const down = isDown("arrowdown", "s", "Shift");
  const jumpPressed = wasPressed("arrowup", "w", "Space");

  player.crouching = down && player.onGround;
  const accel = player.crouching ? 0.5 : 1.35;
  const maxSpeed = player.crouching ? 3 : 8;

  if (left) {
    player.vx -= accel;
    player.facing = -1;
  }
  if (right) {
    player.vx += accel;
    player.facing = 1;
  }
  if (!left && !right) player.vx *= player.onGround ? 0.78 : 0.96;

  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  if (jumpPressed && player.onGround) {
    player.vy = player.hasLavaSuit ? -19 : -22;
    player.onGround = false;
    burst(player.x, player.y + player.h, "#b8f3ff", 10, 3);
  }

  if (wasPressed("z")) shootLaser();
  if (wasPressed("x")) punch();
  if (wasPressed("c")) {
    const held =
      game.animals.find((animal) => animal.caught && animal.type === "turtle") ||
      game.animals.find((animal) => animal.caught);
    if (held) {
      throwAnimal(held);
    } else {
      swingHammer();
    }
  }

  if (down && !player.onGround && player.hasLavaSuit) {
    player.diving = true;
    player.vy += 1.1;
  }

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  player.x = clamp(player.x, 38, WIDTH - 38);

  const floor = player.hasLavaSuit ? LAVA_TOP - player.h * 0.54 : GROUND_Y - player.h;
  if (player.y > floor) {
    if (!player.onGround && player.diving) {
      game.cameraShake = Math.max(game.cameraShake, 9);
      burst(player.x, LAVA_TOP, "#ff7a1a", 30, 8);
    }
    player.y = floor;
    player.vy = player.hasLavaSuit ? Math.sin(game.time * 5) * 0.45 : 0;
    player.onGround = true;
    player.diving = false;
  } else {
    player.onGround = false;
  }

  player.laserCooldown = Math.max(0, player.laserCooldown - dt);
  player.punchCooldown = Math.max(0, player.punchCooldown - dt);
  player.hammerCooldown = Math.max(0, player.hammerCooldown - dt);
  player.hurtCooldown = Math.max(0, player.hurtCooldown - dt);
}

function updateProjectiles(dt) {
  game.projectiles.forEach((projectile) => {
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.life -= dt;
    if (projectile.kind === "animal") projectile.vy += 0.35;

    if (projectile.kind === "laser" || projectile.kind === "animal") {
      const bounds = {
        x: projectile.x - projectile.w / 2,
        y: projectile.y - projectile.h / 2,
        w: projectile.w,
        h: projectile.h,
      };
      if (game.boss && !game.boss.defeated) {
        if (fixesBridgePart(projectile)) {
          projectile.life = 0;
        } else if (game.boss.type === "king" && hitsKingTarget(projectile)) {
          projectile.life = 0;
          damageBoss(projectile.damage * 2.6, projectile.x, projectile.y, "target");
        } else if (game.boss.type === "royal") {
          const target = nearestRoyalTarget(projectile.x, projectile.y);
          if (target) {
            const distance = Math.hypot(projectile.x - target.x, projectile.y - target.y);
            if (distance < target.radius + projectile.w) {
              projectile.life = 0;
              damageBoss(projectile.damage, projectile.x, projectile.y, projectile.kind);
            }
          }
        } else if (rectsOverlap(bounds, bossBounds())) {
          projectile.life = 0;
          damageBoss(projectile.damage, projectile.x, projectile.y, projectile.kind);
        }
      }
    }

    if (projectile.kind === "enemy") {
      const bounds = {
        x: projectile.x - projectile.w / 2,
        y: projectile.y - projectile.h / 2,
        w: projectile.w,
        h: projectile.h,
      };
      if (rectsOverlap(bounds, playerBounds())) {
        projectile.life = 0;
        damagePlayer(projectile.damage, projectile.x);
        burst(projectile.x, projectile.y, projectile.color, 10, 4);
      }
    }
  });

  game.projectiles = game.projectiles.filter(
    (projectile) =>
      projectile.life > 0 &&
      projectile.x > -120 &&
      projectile.x < WIDTH + 120 &&
      projectile.y > -160 &&
      projectile.y < HEIGHT + 160
  );
}

function updateAnimals(dt) {
  game.animals.forEach((animal) => {
    if (animal.caught) {
      animal.x = lerp(animal.x, player.x - player.facing * 34, 0.2);
      animal.y = lerp(animal.y, player.y + 24, 0.2);
      animal.life = 10;
      return;
    }

    animal.vy += 0.32;
    animal.x += animal.vx;
    animal.y += animal.vy;
    animal.life -= dt;

    if (animal.y > LAVA_TOP - 26) {
      animal.y = LAVA_TOP - 26;
      animal.vy = -7;
      animal.vx *= 0.9;
    }

    if (rectsOverlap({ x: animal.x - 18, y: animal.y - 18, w: 36, h: 36 }, playerBounds())) {
      if (animal.type === "turtle") {
        player.shellPower = "green";
        player.hasHammer = true;
        animal.caught = true;
        say("The rare green turtle went into your hammer and made shell power!", 3.6);
      } else {
        animal.caught = true;
      }
    }
  });

  game.animals = game.animals.filter((animal) => animal.life > 0 || animal.caught);
}

function updateBoss(dt) {
  const boss = game.boss;
  if (!boss || boss.defeated) return;
  boss.phase += dt;
  boss.cooldown -= dt;

  if (boss.type === "chorus") updateChorusBoss(boss, dt);
  if (boss.type === "sphere") updateSphereBoss(boss, dt);
  if (boss.type === "king") updateKingBoss(boss, dt);
  if (boss.type === "prince") updatePrinceBoss(boss, dt);
  if (boss.type === "royal") updateRoyalBoss(boss, dt);
}

function shootEnemyLaser(x, y, targetX, targetY, color, damage = 12, speed = 7, size = 18) {
  const angle = Math.atan2(targetY - y, targetX - x);
  game.projectiles.push({
    kind: "enemy",
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    w: size,
    h: size,
    color,
    life: 4,
    damage,
  });
}

function updateChorusBoss(boss, dt) {
  boss.targetAngle += dt * 2.7;
  boss.minions.forEach((minion, i) => {
    minion.angle += dt * (1.45 + Math.sin(boss.phase + i) * 0.12);
  });
  boss.x = 890 + Math.sin(boss.phase * 0.8) * 42;
  boss.y = 365 + Math.cos(boss.phase * 1.1) * 28;

  if (boss.cooldown <= 0) {
    boss.cooldown = boss.power < boss.maxPower * 0.5 ? 0.58 : 0.9;
    const minion = boss.minions[Math.floor(rand(0, boss.minions.length))];
    const x = boss.x + Math.cos(minion.angle) * minion.radius;
    const y = boss.y + Math.sin(minion.angle) * minion.radius;
    shootEnemyLaser(x, y, player.x, player.y + 35, "#b35cff", 9, 6, 15);
    if (Math.random() < 0.25) say("da da da da da...", 1.3);
  }

  if (boss.power < boss.maxPower * 0.42 && Math.random() < dt * 1.7) {
    shootEnemyLaser(boss.x, boss.y, player.x, player.y + 35, "#d894ff", 16, 8, 28);
  }
}

function updateSphereBoss(boss, dt) {
  boss.x = 925 + Math.sin(boss.phase * 1.1) * 86;
  boss.y = 372 + Math.sin(boss.phase * 1.7) * 46;
  boss.badGuys.forEach((badGuy, i) => {
    badGuy.angle += dt * (1.2 + i * 0.05);
  });

  if (boss.cooldown <= 0) {
    boss.cooldown = boss.shell > 0 ? 1.25 : 0.64;
    const fromShell = boss.shell > 0;
    shootEnemyLaser(
      boss.x + rand(-30, 30),
      boss.y + rand(-30, 30),
      player.x,
      player.y + 34,
      fromShell ? "#d9e0f5" : "#120014",
      fromShell ? 10 : 14,
      fromShell ? 5.5 : 7.5,
      fromShell ? 18 : 22
    );
  }
}

function updateKingBoss(boss, dt) {
  boss.jumpTimer -= dt;
  if (boss.jumpTimer <= 0) {
    boss.jumpTimer = 1.2;
    boss.tileIndex = (boss.tileIndex + 1 + Math.floor(rand(0, 2))) % boss.tiles.length;
    game.cameraShake = Math.max(game.cameraShake, 4);
  }

  const tile = boss.tiles[boss.tileIndex];
  boss.x = lerp(boss.x, tile.x, 0.08);
  boss.y = lerp(boss.y, tile.y - 42, 0.08);
  boss.targetAngle += dt * 3.2;

  if (!boss.bridgeBroken && boss.power < boss.maxPower * 0.67) {
    boss.bridgeBroken = true;
    say("The king broke the little bridge! Hit the three shining bridge parts to fix it.", 4.2);
    game.cameraShake = 14;
  }

  if (boss.cooldown <= 0) {
    boss.cooldown = 0.75;
    shootEnemyLaser(boss.x, boss.y, player.x, player.y + 33, "#ff4545", 14, 8, 20);
  }
}

function fixesBridgePart(projectile) {
  const boss = game.boss;
  if (
    !boss ||
    boss.type !== "king" ||
    !boss.bridgeBroken ||
    boss.bridgeFixed ||
    projectile.kind !== "laser"
  ) {
    return false;
  }

  for (let i = 0; i < boss.bridgeParts; i += 1) {
    const x = 514 + i * 80;
    const y = 494 + Math.sin(game.time * 4 + i) * 8;
    if (Math.hypot(projectile.x - x, projectile.y - y) < 42) {
      boss.bridgeParts -= 1;
      burst(x, y, "#59ff67", 22, 5);
      if (boss.bridgeParts <= 0) {
        boss.bridgeFixed = true;
        say("The three bridge parts magically snapped back together!", 3.2);
      } else {
        say(`${boss.bridgeParts} bridge part${boss.bridgeParts === 1 ? "" : "s"} left!`, 1.7);
      }
      return true;
    }
  }

  return false;
}

function updatePrinceBoss(boss, dt) {
  boss.x = 920 + Math.sin(boss.phase * 1.25) * 95;
  boss.y = 376 + Math.cos(boss.phase * 0.85) * 36;
  boss.shieldAngle += dt * 4;
  boss.animalTimer -= dt;

  if (boss.animalTimer <= 0) {
    boss.animalTimer = rand(3.5, 5.8);
    releaseAnimal(boss.x, boss.y);
    boss.animalsReleased += 1;
  }

  if (boss.cooldown <= 0) {
    boss.cooldown = boss.power < boss.maxPower * 0.45 ? 0.62 : 1.0;
    const wide = boss.power < boss.maxPower * 0.7;
    shootEnemyLaser(boss.x, boss.y, player.x, player.y + 34, "#ff8b24", wide ? 18 : 14, 8.8, wide ? 32 : 24);
    if (wide) {
      shootEnemyLaser(boss.x, boss.y, player.x, player.y - 20, "#ffd166", 12, 7, 18);
    }
  }
}

function updateRoyalBoss(boss, dt) {
  boss.princess.x = 760 + Math.sin(boss.phase * 1.1) * 55;
  boss.princess.y = 408 + Math.cos(boss.phase * 1.4) * 28;
  boss.queen.x = 1005 + Math.cos(boss.phase * 0.8) * 45;
  boss.queen.y = 350 + Math.sin(boss.phase * 0.95) * 35;
  boss.princess.cooldown -= dt;
  boss.queen.cooldown -= dt;

  if (boss.princess.cooldown <= 0) {
    boss.princess.cooldown = 0.95;
    shootEnemyLaser(
      boss.princess.x,
      boss.princess.y,
      player.x,
      player.y + 36,
      "#ff9be5",
      10,
      6.8,
      18
    );
  }

  if (boss.queen.cooldown <= 0) {
    boss.queen.cooldown = boss.queen.crown ? 1.35 : 0.95;
    shootEnemyLaser(
      boss.queen.x,
      boss.queen.y,
      player.x,
      player.y + 36,
      boss.queen.crown ? "#ffea70" : "#e245ff",
      boss.queen.crown ? 17 : 13,
      boss.queen.crown ? 7.5 : 6.5,
      boss.queen.crown ? 30 : 22
    );
  }

  if (boss.power < boss.maxPower * 0.55 && Math.random() < dt * 0.4) {
    releaseAnimal(boss.queen.x, boss.queen.y);
  }
}

function hitsKingTarget(projectile) {
  const boss = game.boss;
  if (!boss || boss.type !== "king") return false;
  const tx = boss.x + Math.cos(boss.targetAngle) * 42;
  const ty = boss.y + Math.sin(boss.targetAngle) * 42;
  return Math.hypot(projectile.x - tx, projectile.y - ty) < 38;
}

function updateIntro(dt) {
  if (wasPressed("Enter")) {
    const current = currentIntroScene();
    game.sceneTime += current.duration;
  }

  const scene = currentIntroScene();
  if (scene.kind === "flood") {
    game.lavaLevel = lerp(game.lavaLevel, 458, 0.015);
  }
  if (scene.kind === "shop" && game.sceneTime > introSceneStart() + 2.4) {
    player.hasLavaSuit = true;
  }
  if (scene.kind === "dive") {
    player.hasLavaSuit = true;
    if (game.sceneTime > introSceneStart() + 2.1) game.lavaLevel = lerp(game.lavaLevel, LAVA_TOP, 0.035);
  }

  game.sceneTime += dt;
  const total = introScenes.reduce((sum, item) => sum + item.duration, 0);
  if (game.sceneTime >= total) {
    player.hasLavaSuit = true;
    startBattle(0);
  }
}

function currentIntroScene() {
  let elapsed = 0;
  for (const scene of introScenes) {
    if (game.sceneTime < elapsed + scene.duration) return scene;
    elapsed += scene.duration;
  }
  return introScenes[introScenes.length - 1];
}

function introSceneStart() {
  let elapsed = 0;
  const scene = currentIntroScene();
  for (const item of introScenes) {
    if (item === scene) return elapsed;
    elapsed += item.duration;
  }
  return 0;
}

function updateParticles(dt) {
  game.particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.life -= dt;
  });
  game.particles = game.particles.filter((particle) => particle.life > 0);
}

function update(dt) {
  game.time += dt;
  game.messageTime = Math.max(0, game.messageTime - dt);
  game.cameraShake = Math.max(0, game.cameraShake - dt * 15);

  if (game.mode === "title") {
    if (wasPressed("Enter") || wasPressed("Space")) {
      game.mode = "intro";
      game.sceneTime = 0;
      game.lavaLevel = HEIGHT + 60;
      player.x = 230;
      player.y = GROUND_Y - player.h;
      player.hasLavaSuit = false;
    }
  } else if (game.mode === "intro") {
    updateIntro(dt);
  } else if (game.mode === "battle") {
    if (game.sceneTime >= 0) {
      updatePlayer(dt);
      updateBoss(dt);
      updateProjectiles(dt);
      updateAnimals(dt);
      advanceAfterDefeat(dt);
    } else {
      game.sceneTime += dt;
    }
  } else if (game.mode === "ending") {
    if (wasPressed("Enter")) {
      game.mode = "title";
      game.sceneTime = 0;
      player.hasHammer = false;
      player.shellPower = "none";
      player.hasLavaSuit = false;
      player.darkness = 0;
      game.battleIndex = 0;
      game.boss = null;
    }
    if (wasPressed("n")) {
      say("Game two is still being dreamed up.", 3.4);
    }
  }

  updateParticles(dt);
  justPressed.clear();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#15062a");
  gradient.addColorStop(0.45, "#232f78");
  gradient.addColorStop(1, "#fd6b1e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  game.stars.forEach((star) => {
    const alpha = 0.45 + Math.sin(game.time * 2 + star.twinkle) * 0.25;
    ctx.fillStyle = `rgba(255, 255, 225, ${alpha})`;
    circle(star.x, star.y, star.r);
    ctx.fill();
  });

  game.clouds.forEach((cloud) => {
    cloud.x -= cloud.speed;
    if (cloud.x < -180) cloud.x = WIDTH + 160;
    drawCloud(cloud.x, cloud.y, cloud.scale);
  });
}

function drawCloud(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 245, 221, 0.82)";
  circle(-42, 14, 27);
  ctx.fill();
  circle(-13, -3, 38);
  ctx.fill();
  circle(28, 9, 31);
  ctx.fill();
  circle(55, 17, 22);
  ctx.fill();
  roundedRect(-68, 14, 142, 31, 17);
  ctx.fill();
  ctx.restore();
}

function drawLava(level = game.lavaLevel) {
  const top = level;
  const gradient = ctx.createLinearGradient(0, top, 0, HEIGHT);
  gradient.addColorStop(0, "#ffdf5a");
  gradient.addColorStop(0.16, "#ff7a1a");
  gradient.addColorStop(0.58, "#b31313");
  gradient.addColorStop(1, "#39000d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, top, WIDTH, HEIGHT - top);

  for (let x = -40; x < WIDTH + 40; x += 36) {
    const wave = Math.sin(x * 0.025 + game.time * 4.2) * 8;
    ctx.fillStyle = x % 72 === 0 ? "#fff16b" : "#ff9d1f";
    circle(x, top + wave, 18);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255, 232, 90, 0.75)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = 0; x <= WIDTH; x += 12) {
    const y = top + Math.sin(x * 0.018 + game.time * 3.3) * 9;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawArena() {
  drawSky();
  drawLava(LAVA_TOP);

  ctx.fillStyle = "#27102e";
  roundedRect(66, GROUND_Y, 338, 34, 18);
  ctx.fill();
  ctx.fillStyle = "#110717";
  roundedRect(82, GROUND_Y + 8, 306, 13, 10);
  ctx.fill();

  if (game.boss && game.boss.type === "king" && game.boss.bridgeBroken) {
    drawBridge(game.boss.bridgeFixed);
  } else {
    drawBridge(true);
  }

  drawBlackTiles();
}

function drawBridge(fixed) {
  ctx.save();
  ctx.fillStyle = fixed ? "#593b25" : "#2a1720";
  for (let i = 0; i < 6; i += 1) {
    const brokenDrop = fixed ? 0 : (i % 3) * 16 + Math.sin(game.time * 5 + i) * 4;
    roundedRect(472 + i * 45, 518 + brokenDrop, 38, 16, 4);
    ctx.fill();
  }
  if (!fixed) {
    ctx.fillStyle = "#59ff67";
    for (let i = 0; i < 3; i += 1) {
      circle(514 + i * 80, 494 + Math.sin(game.time * 4 + i) * 8, 8);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBlackTiles() {
  if (!game.boss) return;
  const boss = game.boss;
  ctx.save();
  ctx.fillStyle = "#07030a";
  ctx.strokeStyle = "#4b235f";
  ctx.lineWidth = 3;

  if (boss.type === "chorus") {
    boss.minions.forEach((minion) => {
      const x = boss.x + Math.cos(minion.angle) * minion.radius;
      const y = boss.y + Math.sin(minion.angle) * minion.radius;
      roundedRect(x - 24, y + 28, 48, 16, 5);
      ctx.fill();
      ctx.stroke();
    });
  } else if (boss.type === "king") {
    boss.tiles.forEach((tile) => {
      roundedRect(tile.x - 36, tile.y - 8, 72, 20, 5);
      ctx.fill();
      ctx.stroke();
    });
  } else {
    for (let i = 0; i < 4; i += 1) {
      roundedRect(720 + i * 110, 485 + Math.sin(i) * 18, 76, 18, 5);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.hurtCooldown > 0 && Math.floor(game.time * 18) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  const height = player.crouching ? player.h * 0.62 : player.h;
  const bodyY = player.crouching ? 28 : 18;
  const suitColor = player.hasLavaSuit ? "#e33b28" : "#1f7fff";
  const trimColor = player.hasLavaSuit ? "#ffda5e" : "#9be9ff";

  ctx.fillStyle = "#ffe0bd";
  circle(0, bodyY - 14, 18);
  ctx.fill();

  ctx.fillStyle = suitColor;
  roundedRect(-22, bodyY, 44, height - 20, 14);
  ctx.fill();

  ctx.fillStyle = trimColor;
  roundedRect(-8, bodyY + 10, 16, height - 40, 8);
  ctx.fill();

  if (player.darkness > 0) {
    ctx.strokeStyle = "#05010a";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = 0; i < 6; i += 1) {
      const offset = -19 + i * 8;
      const top = i % 2 === 0 ? bodyY + 3 : bodyY + height - 42;
      ctx.beginPath();
      ctx.moveTo(offset, top);
      ctx.bezierCurveTo(
        offset + 9,
        top + 8,
        offset - 11,
        top + 20,
        offset + 5,
        top + 31
      );
      ctx.stroke();
    }
  }

  ctx.strokeStyle = suitColor;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-18, bodyY + 28);
  ctx.lineTo(-35, bodyY + 48);
  ctx.moveTo(18, bodyY + 28);
  ctx.lineTo(36, bodyY + 42);
  ctx.moveTo(-12, bodyY + height - 22);
  ctx.lineTo(-24, bodyY + height - 2);
  ctx.moveTo(12, bodyY + height - 22);
  ctx.lineTo(26, bodyY + height - 2);
  ctx.stroke();

  ctx.fillStyle = "#101626";
  circle(-6, bodyY - 18, 3);
  ctx.fill();
  circle(7, bodyY - 18, 3);
  ctx.fill();

  if (player.laserCooldown > 0.18) {
    ctx.fillStyle = "#4de8ff";
    roundedRect(player.facing * 20, bodyY + 30, player.facing * 46, 8, 4);
    ctx.fill();
  }

  if (player.hasHammer) {
    ctx.save();
    ctx.translate(player.facing * 36, bodyY + 36);
    ctx.rotate(player.facing * (player.hammerCooldown > 0 ? -0.9 : -0.25));
    ctx.strokeStyle = "#7c4a25";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(player.facing * 44, -18);
    ctx.stroke();
    ctx.fillStyle = player.shellPower === "green" ? "#59ff67" : "#c9c1aa";
    roundedRect(player.facing * 38 - 15, -34, 34, 28, 7);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawBoss() {
  const boss = game.boss;
  if (!boss) return;
  if (boss.type === "chorus") drawChorusBoss(boss);
  if (boss.type === "sphere") drawSphereBoss(boss);
  if (boss.type === "king") drawKingBoss(boss);
  if (boss.type === "prince") drawPrinceBoss(boss);
  if (boss.type === "royal") drawRoyalBoss(boss);
}

function drawAntennaPerson(x, y, color, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, -17);
  ctx.lineTo(-16, -32);
  ctx.moveTo(8, -17);
  ctx.lineTo(16, -32);
  ctx.stroke();
  ctx.fillStyle = color;
  circle(-17, -35, 5);
  ctx.fill();
  circle(17, -35, 5);
  ctx.fill();
  roundedRect(-18, -18, 36, 46, 15);
  ctx.fill();
  ctx.fillStyle = "#fff";
  circle(-6, -4, 3);
  ctx.fill();
  circle(7, -4, 3);
  ctx.fill();
  ctx.restore();
}

function drawChorusBoss(boss) {
  boss.minions.forEach((minion) => {
    const x = boss.x + Math.cos(minion.angle) * minion.radius;
    const y = boss.y + Math.sin(minion.angle) * minion.radius;
    drawAntennaPerson(x, y, boss.color, 0.88);
  });

  ctx.save();
  ctx.globalAlpha = 0.38 + Math.sin(game.time * 9) * 0.12;
  ctx.strokeStyle = "#ce8cff";
  ctx.lineWidth = boss.power < boss.maxPower * 0.45 ? 24 : 12;
  circle(boss.x, boss.y, 52 + Math.sin(game.time * 6) * 7);
  ctx.stroke();
  ctx.restore();

  drawText("da da da", boss.x, boss.y, 23, "#fff6ff");
}

function drawSphereBoss(boss) {
  ctx.save();
  ctx.translate(boss.x, boss.y);
  const shellRadius = boss.radius + boss.shell * 26;
  const gradient = ctx.createRadialGradient(-16, -18, 12, 0, 0, shellRadius);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.3, "#b7c0d7");
  gradient.addColorStop(1, "#475068");
  ctx.fillStyle = gradient;
  circle(0, 0, shellRadius);
  ctx.fill();
  ctx.strokeStyle = "#121820";
  ctx.lineWidth = 4;
  ctx.stroke();

  if (boss.shell <= 0) {
    boss.badGuys.forEach((badGuy) => {
      const x = Math.cos(badGuy.angle) * badGuy.radius;
      const y = Math.sin(badGuy.angle) * badGuy.radius;
      drawAntennaPerson(x, y, "#120014", 0.48);
    });
  }
  ctx.restore();
}

function drawKingBoss(boss) {
  drawAntennaPerson(boss.x, boss.y, "#f24848", 1.35);
  ctx.fillStyle = "#ffe36e";
  roundedRect(boss.x - 31, boss.y - 73, 62, 16, 4);
  ctx.fill();
  ctx.fillStyle = "#ff934f";
  circle(boss.x, boss.y - 82, 14);
  ctx.fill();

  const tx = boss.x + Math.cos(boss.targetAngle) * 42;
  const ty = boss.y + Math.sin(boss.targetAngle) * 42;
  ctx.strokeStyle = "#fff16b";
  ctx.lineWidth = 5;
  circle(tx, ty, 18 + Math.sin(game.time * 8) * 3);
  ctx.stroke();
  drawHammerRelic(boss.x - 92, boss.y + 28, 0.75);
}

function drawPrinceBoss(boss) {
  drawAntennaPerson(boss.x, boss.y, "#ff8b24", 1.25);
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 8;
  ctx.beginPath();
  const sx = boss.x + Math.cos(boss.shieldAngle) * 72;
  const sy = boss.y + Math.sin(boss.shieldAngle) * 72;
  ctx.arc(sx, sy, 22, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 139, 36, 0.22)";
  circle(boss.x, boss.y, 82);
  ctx.fill();
}

function drawRoyalBoss(boss) {
  drawAntennaPerson(boss.princess.x, boss.princess.y, "#ff9be5", 1.04);
  drawText("Princess", boss.princess.x, boss.princess.y + 68, 18, "#ffd1f1");
  drawAntennaPerson(boss.queen.x, boss.queen.y, "#e245ff", 1.38);
  if (boss.queen.crown) {
    ctx.fillStyle = "#ffe36e";
    ctx.beginPath();
    ctx.moveTo(boss.queen.x - 38, boss.queen.y - 73);
    ctx.lineTo(boss.queen.x - 22, boss.queen.y - 101);
    ctx.lineTo(boss.queen.x, boss.queen.y - 77);
    ctx.lineTo(boss.queen.x + 22, boss.queen.y - 101);
    ctx.lineTo(boss.queen.x + 38, boss.queen.y - 73);
    ctx.closePath();
    ctx.fill();
  }
  drawText("Queen", boss.queen.x, boss.queen.y + 86, 22, "#ffd1f1");
}

function drawHammerRelic(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(-0.55);
  ctx.strokeStyle = "#85552c";
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(88, 0);
  ctx.stroke();
  ctx.fillStyle = "#c9c1aa";
  roundedRect(70, -24, 52, 48, 9);
  ctx.fill();
  ctx.restore();
}

function drawProjectiles() {
  game.projectiles.forEach((projectile) => {
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    if (projectile.kind === "laser") {
      ctx.fillStyle = projectile.color;
      roundedRect(-projectile.w / 2, -projectile.h / 2, projectile.w, projectile.h, 5);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#fff";
      roundedRect(-projectile.w / 2, -projectile.h / 2, projectile.w, projectile.h, 5);
      ctx.fill();
    } else if (projectile.kind === "enemy") {
      ctx.fillStyle = projectile.color;
      circle(0, 0, projectile.w / 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 3;
      circle(0, 0, projectile.w * 0.42);
      ctx.stroke();
    } else {
      drawAnimalShape(0, 0, projectile.animalType, projectile.color, 0.85);
    }
    ctx.restore();
  });
}

function drawAnimals() {
  game.animals.forEach((animal) => {
    if (animal.caught && animal.type !== "turtle") return;
    drawAnimalShape(animal.x, animal.y, animal.type, animal.color, animal.caught ? 0.7 : 1);
  });
}

function drawAnimalShape(x, y, type, color, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  if (type === "turtle") {
    ctx.fillStyle = "#59ff67";
    circle(0, 0, 17);
    ctx.fill();
    ctx.fillStyle = "#247a2e";
    roundedRect(-19, -11, 38, 22, 12);
    ctx.fill();
    ctx.fillStyle = "#b9ff7a";
    circle(21, -2, 8);
    ctx.fill();
  } else if (type === "bird") {
    ctx.beginPath();
    ctx.moveTo(-18, 5);
    ctx.lineTo(0, -16);
    ctx.lineTo(18, 5);
    ctx.lineTo(0, -5);
    ctx.closePath();
    ctx.fill();
  } else {
    roundedRect(-15, -12, 30, 24, 10);
    ctx.fill();
    circle(-8, -18, 6);
    ctx.fill();
    circle(8, -18, 6);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles() {
  game.particles.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    circle(particle.x, particle.y, particle.radius);
    ctx.fill();
    ctx.restore();
  });
}

function drawHud() {
  if (game.mode !== "battle") return;
  const boss = game.boss;
  ctx.save();
  ctx.fillStyle = "rgba(12, 6, 22, 0.68)";
  roundedRect(28, 24, 426, 96, 18);
  ctx.fill();
  drawMeter(58, 52, 350, 18, player.energy / 100, "#3bd2ff", "Suit Power");
  drawMeter(58, 86, 350, 18, boss ? boss.power / boss.maxPower : 0, "#b35cff", "Enemy Power");
  ctx.fillStyle = "#fff6dd";
  ctx.font = '700 15px "Trebuchet MS", Arial, sans-serif';
  ctx.fillText(`Battle ${game.battleIndex + 1}/${battles.length}: ${boss.name}`, 58, 37);
  ctx.restore();

  if (player.hasHammer || player.shellPower === "green") {
    ctx.save();
    ctx.fillStyle = "rgba(12, 6, 22, 0.68)";
    roundedRect(WIDTH - 278, 24, 244, 66, 18);
    ctx.fill();
    drawText(player.hasHammer ? "King's Hammer: C" : "", WIDTH - 156, 49, 18, "#ffe36e");
    if (player.shellPower === "green") drawText("Green turtle shell power", WIDTH - 156, 73, 16, "#9cff76");
    ctx.restore();
  }
}

function drawMeter(x, y, w, h, percent, color, label) {
  ctx.fillStyle = "#16091d";
  roundedRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundedRect(x, y, w * clamp(percent, 0, 1), h, h / 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2;
  roundedRect(x, y, w, h, h / 2);
  ctx.stroke();
  ctx.fillStyle = "#fff6dd";
  ctx.font = '700 12px "Trebuchet MS", Arial, sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 8, y + h / 2);
}

function drawControls() {
  ctx.save();
  ctx.fillStyle = "rgba(12, 6, 22, 0.55)";
  roundedRect(28, HEIGHT - 66, 716, 42, 14);
  ctx.fill();
  ctx.fillStyle = "#fff6dd";
  ctx.font = '700 17px "Trebuchet MS", Arial, sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Move: arrows/WASD   Jump: Space/W/Up   Crouch/Dive: Down/Shift   Laser: Z   Punch: X   Hammer/Throw turtle: C", 48, HEIGHT - 45);
  ctx.restore();
}

function drawMessage() {
  if (game.messageTime <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(game.messageTime, 0, 1);
  ctx.fillStyle = "rgba(12, 6, 22, 0.78)";
  roundedRect(210, 132, 860, 92, 22);
  ctx.fill();
  wrapText(game.message, WIDTH / 2, 166, 790, 27, 22, "#fff6dd");
  ctx.restore();
}

function drawIntro() {
  drawSky();
  const scene = currentIntroScene();
  const local = game.sceneTime - introSceneStart();

  if (scene.kind === "jump") {
    drawLava(HEIGHT + 40);
    const jumpY = 448 - Math.abs(Math.sin(local * 2.7)) * 210;
    player.hasLavaSuit = false;
    drawCinematicHero(360, jumpY, false, false);
    drawText("BLUE JUMPING SUIT", WIDTH / 2, 78, 36, "#9be9ff");
  }

  if (scene.kind === "flood") {
    drawLava(game.lavaLevel);
    drawCinematicHero(420, 420 - Math.sin(local * 4) * 100, false, false);
    drawCloud(595, 244, 1.35);
    drawCloud(746, 210, 1.0);
    drawText("THE WORLD STARTS FLOODING", WIDTH / 2, 78, 34, "#ffdf5a");
  }

  if (scene.kind === "shop") {
    drawLava(HEIGHT + 40);
    ctx.fillStyle = "#50255d";
    roundedRect(376, 254, 528, 222, 28);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    roundedRect(410, 214, 462, 62, 22);
    ctx.fill();
    drawText("CLOUD SHOP", 641, 245, 30, "#351240");
    drawCinematicHero(520, 410, false, false);
    drawCinematicHero(740, 410, true, false);
    drawText("BUY LAVA SUIT", WIDTH / 2, 552, 32, "#ffda5e");
  }

  if (scene.kind === "dive") {
    drawLava(game.lavaLevel);
    const crouch = local < 2.1;
    const y = crouch ? 342 : lerp(342, 578, clamp((local - 2.1) / 2.4, 0, 1));
    drawCinematicHero(640, y, true, crouch);
    if (!crouch) {
      ctx.strokeStyle = "#4de8ff";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(640, y + 62);
      ctx.lineTo(640, y + 150);
      ctx.stroke();
    }
    drawText("CROUCH, SHOOT DOWN, FLOAT IN LAVA", WIDTH / 2, 78, 30, "#fff6dd");
  }

  wrapText(scene.caption, WIDTH / 2, 625, 920, 31, 24);
  drawText("Press Enter to skip ahead", WIDTH - 160, HEIGHT - 34, 17, "#fff6dd");
}

function drawCinematicHero(x, y, lavaSuit, crouch) {
  const old = { ...player };
  player.x = x;
  player.y = y;
  player.hasLavaSuit = lavaSuit;
  player.crouching = crouch;
  player.darkness = 0;
  player.hasHammer = false;
  drawPlayer();
  Object.assign(player, old);
}

function drawTitle() {
  drawSky();
  drawLava(540 + Math.sin(game.time * 2) * 16);
  drawCinematicHero(330, 382 + Math.sin(game.time * 3) * 35, false, false);
  drawAntennaPerson(890, 410, "#a94cff", 1.2);
  drawHammerRelic(735, 470, 1);
  drawText("LAVA CLOUDS", WIDTH / 2, 144, 68, "#ffdf5a");
  drawText("The King's Hammer", WIDTH / 2, 202, 34, "#fff6dd");
  wrapText(
    "A high-jumping suit, a lava flood, purple antenna people, black tiles, rescued animals, and bosses who lose power instead of dying.",
    WIDTH / 2,
    276,
    760,
    30,
    23
  );
  drawText("Press Enter to start Game One", WIDTH / 2, 590, 30, "#9be9ff");
  drawControls();
}

function drawEnding() {
  drawSky();
  drawLava(LAVA_TOP);
  drawCinematicHero(430, LAVA_TOP - 78, true, false);
  player.hasHammer = true;
  player.darkness = 0;
  drawHammerRelic(670, 445, 1.15);
  drawText("GAME ONE COMPLETE", WIDTH / 2, 138, 56, "#ffdf5a");
  wrapText(
    "The queen and princess lost their power. The squiggly black darkness is gone from the suit.",
    WIDTH / 2,
    238,
    820,
    34,
    27
  );
  ctx.save();
  ctx.fillStyle = "rgba(12, 6, 22, 0.7)";
  roundedRect(342, 360, 276, 78, 18);
  roundedRect(662, 360, 276, 78, 18);
  ctx.fill();
  drawText("Play again", 480, 399, 28, "#9be9ff");
  drawText("Next game", 800, 399, 28, "#9cff76");
  ctx.restore();
  drawText("Enter = play again    N = next game", WIDTH / 2, 540, 24);
  drawMessage();
}

function render() {
  ctx.save();
  const shake = game.cameraShake;
  if (shake > 0) ctx.translate(rand(-shake, shake), rand(-shake, shake));

  if (game.mode === "title") drawTitle();
  else if (game.mode === "intro") drawIntro();
  else if (game.mode === "battle") {
    drawArena();
    drawBoss();
    drawAnimals();
    drawProjectiles();
    drawPlayer();
    drawParticles();
    drawHud();
    drawControls();
    drawMessage();
  } else if (game.mode === "ending") drawEnding();

  ctx.restore();
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
