let gifts = [];
let status = "waiting";
let lastTimestamp;
let santaX;
let santaY;
let sceneOffset;
let score = 0;
let platforms = [];
let sticks = [];
let trees = [];
let clouds = [];
let specialGifts = []; // Special gifts revealed every 10 points
let jumpUsed = false; // Track if jump was used during current fall
let jumpVelocity = 0;
let isJumping = false;

const config = {
  canvasWidth: 375,
  canvasHeight: 375,
  platformHeight: 100,
  santaDistanceFromEdge: 10,
  paddingX: 100,
  perfectAreaSize: 10,
  backgroundSpeedMultiplier: 0.2,
  speed: 4,
  santaWidth: 17,
  santaHeight: 30,
  jumpPower: -15, // Negative means upward
  gravity: 0.8,
  jumpSuccessRate: 0.20 // 20% chance
};

const colours = {
  lightBg: "#62AFB9",
  medBg: "#182757",
  darkBg: "#0D5B66",
  lightHill: "#E9E9E9",
  medHill: "#34A65F",
  darkHill: "#07133A",
  platform: "#9B4546",
  platformTop: "#620E0E",
  em: "#CC231E",
  skin: "#CF6D60"
};

const hills = [
  {
    baseHeight: 120,
    amplitude: 20,
    stretch: 0.5,
    colour: colours.lightHill
  },
  {
    baseHeight: 100,
    amplitude: 10,
    stretch: 1,
    colour: colours.medHill
  },
  {
    baseHeight: 70,
    amplitude: 20,
    stretch: 0.5,
    colour: colours.darkHill
  }
];

const scoreElement = createElementStyle(
  "div",
  `position:absolute;top:1.5em;font-size:5em;font-weight:900;text-shadow:${addShadow(
    colours.darkHill,
    7
  )}`
);

const jumpIndicator = createElementStyle(
  "div",
  `position:absolute;bottom:2em;left:50%;transform:translateX(-50%);font-size:1.2em;opacity:0;transition:opacity 0.3s;background:rgba(255,255,255,0.2);padding:0.5em 1.5em;border-radius:20px;backdrop-filter:blur(10px);color:white;font-weight:bold;`,
  "Press SPACE to Jump! 🚀"
);

const canvas = createElementStyle("canvas");
const introductionElement = createElementStyle(
  "div",
  `font-size:1.2em;position:absolute;text-align:center;transition:opacity 2s;width:300px`,
  "Press and hold to stretch sugar cane. Release to walk!<br><small style='margin-top:10px;display:block;'>🎁 Every 10 points = Special Gift!<br>💫 Press SPACE while falling to jump!</small>"
);
const perfectElement = createElementStyle(
  "div",
  "position:absolute;opacity:0;transition:opacity 2s;font-size:2em;font-weight:bold;color:#FFD700;text-shadow:2px 2px 4px rgba(0,0,0,0.5)",
  "✨ Perfect! +2"
);
const restartButton = createElementStyle(
  "button",
  `width:120px;height:120px;position:absolute;border-radius:50%;color:white;background-color:${colours.em};border:none;font-weight:700;font-size:1.2em;display:none;cursor:pointer`,
  "RESTART"
);

const giftNotification = createElementStyle(
  "div",
  `position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:2em;opacity:0;transition:all 1s;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:1em 2em;border-radius:20px;color:white;font-weight:bold;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:1000;pointer-events:none;`,
  "🎁 SPECIAL GIFT UNLOCKED! 🎁"
);

function generateGift(platform) {
  gifts.push({
    x: platform.x + platform.w / 2,
    y: config.canvasHeight - config.platformHeight - 25,
    size: 20,
    revealed: false
  });
}

// Generate special gift every 10 points
function generateSpecialGift() {
  const platform = platforms[platforms.length - 2]; // Place on recent platform
  if (platform) {
    specialGifts.push({
      x: platform.x + platform.w / 2,
      y: config.canvasHeight - config.platformHeight - 40,
      size: 30,
      revealed: false,
      openProgress: 0,
      particles: []
    });
  }
}

function revealSpecialGift(gift) {
  gift.revealed = true;
  
  // Show notification
  giftNotification.style.opacity = "1";
  giftNotification.style.transform = "translate(-50%, -50%) scale(1.2)";
  
  setTimeout(() => {
    giftNotification.style.opacity = "0";
    giftNotification.style.transform = "translate(-50%, -50%) scale(1)";
  }, 2000);
  
  // Create celebration particles
  for (let i = 0; i < 20; i++) {
    gift.particles.push({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 2,
      life: 60,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`
    });
  }
}

// Adding snow
for (let i = 0; i <= 30; i++) {
  createElementStyle(
    "i",
    `font-size: ${3 * Math.random()}em;left: ${
      100 * Math.random()
    }%; animation-delay: ${10 * Math.random()}s, ${2 * Math.random()}s`,
    "."
  );
}

// Adding colorful stars
const starColors = [
  "#ffffff",
  "#ffd27d",
  "#b5e8ff",
  "#ffb3c6"
];

for (let i = 0; i <= 40; i++) {
  const color = starColors[Math.floor(Math.random() * starColors.length)];

  createElementStyle(
    "span",
    `
    position: fixed;
    top: ${60 * Math.random()}%;
    left: ${100 * Math.random()}%;
    font-size: ${Math.random() * 1.3 + 0.4}em;
    color: ${color};
    opacity: ${Math.random() * 0.6 + 0.4};
    animation: starTwinkle ${2 + Math.random() * 4}s infinite alternate;
    z-index: 1;
    `,
    "✦"
  );
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

Array.prototype.last = function () {
  return this[this.length - 1];
};

Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    
    // If falling and haven't used jump, attempt jump
    if (status == "falling" && !jumpUsed) {
      attemptJump();
    } else if (status == "waiting" || status == "fell") {
      resetGame();
    }
    return;
  }
});

function attemptJump() {
  jumpUsed = true;
  const success = Math.random() < config.jumpSuccessRate;
  
  if (success) {
    // Successful jump!
    jumpVelocity = config.jumpPower;
    isJumping = true;
    status = "jumping";
    jumpIndicator.innerHTML = "🎉 JUMP SUCCESS! 🎉";
    jumpIndicator.style.background = "rgba(0,255,0,0.3)";
    jumpIndicator.style.opacity = "1";
    
    setTimeout(() => {
      jumpIndicator.style.opacity = "0";
    }, 1000);
  } else {
    // Failed jump
    jumpIndicator.innerHTML = "❌ Jump Failed! ❌";
    jumpIndicator.style.background = "rgba(255,0,0,0.3)";
    jumpIndicator.style.opacity = "1";
    
    setTimeout(() => {
      jumpIndicator.style.opacity = "0";
    }, 1000);
  }
}

["mousedown", "touchstart"].forEach(function (evt) {
  window.addEventListener(evt, function (event) {
    if (status == "waiting") {
      lastTimestamp = undefined;
      introductionElement.style.opacity = 0;
      status = "stretching";
      window.requestAnimationFrame(animate);
    }
  });
});

["mouseup", "touchend"].forEach(function (evt) {
  window.addEventListener(evt, function (event) {
    if (status == "stretching") {
      status = "turning";
    }
  });
});

window.addEventListener("resize", function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});

window.requestAnimationFrame(animate);

resetGame();

function resetGame() {
  status = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;
  jumpUsed = false;
  jumpVelocity = 0;
  isJumping = false;
  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  jumpIndicator.style.opacity = "0";
  jumpIndicator.innerHTML = "Press SPACE to Jump! 🚀";
  jumpIndicator.style.background = "rgba(255,255,255,0.2)";
  scoreElement.innerText = score;
  platforms = [{ x: 50, w: 50 }];
  santaX = platforms[0].x + platforms[0].w - config.santaDistanceFromEdge;
  santaY = 0;
  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];
  trees = [];
  clouds = [];
  gifts = [];
  specialGifts = [];

  for (let i = 0; i <= 20; i++) {
    if (i <= 3) generatePlatform();
    generateTree();
    generateCloud();
  }

  draw();
}

function generateCloud() {
  const minimumGap = 60;
  const maximumGap = 300;

  const lastCloud = clouds[clouds.length - 1];
  let furthestX = lastCloud ? lastCloud.x : 0;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));

  const y =
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap)) -
    window.innerHeight / 1.2;

  const w = Math.floor(Math.random() * 15 + 15);
  clouds.push({ x, y, w });
}

function generateTree() {
  const minimumGap = 30;
  const maximumGap = 150;

  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));

  const treeColors = [colours.lightHill, colours.medBg, colours.medHill];
  const color = treeColors[Math.floor(Math.random() * 3)];

  trees.push({ x, color });
}

function generatePlatform() {
  const minimumGap = 40;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;

  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
}

function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  switch (status) {
    case "waiting":
      return;
    case "stretching": {
      sticks.last().length += (timestamp - lastTimestamp) / config.speed;
      break;
    }
    case "turning": {
      sticks.last().rotation += (timestamp - lastTimestamp) / config.speed;

      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;

        const [nextPlatform, perfectHit] = thePlatformTheStickHits();

        if (nextPlatform) {
          // Generate regular gift (30% chance)
          if (Math.random() < 0.3) {
            generateGift(nextPlatform);
          }

          score += perfectHit ? 2 : 1;
          scoreElement.innerText = score;

          // Check for special gift every 10 points
          if (score % 10 === 0 && score > 0) {
            generateSpecialGift();
          }

          if (perfectHit) {
            perfectElement.style.opacity = 1;
            setTimeout(() => (perfectElement.style.opacity = 0), 1000);
          }

          generatePlatform();
          generateTree();
          generateTree();
          generateCloud();
          generateCloud();
        }

        status = "walking";
      }
      break;
    }
    case "walking": {
      santaX += (timestamp - lastTimestamp) / config.speed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        const maxSantaX =
          nextPlatform.x + nextPlatform.w - config.santaDistanceFromEdge;
        if (santaX > maxSantaX) {
          santaX = maxSantaX;
          status = "transitioning";
        }
      } else {
        const maxSantaX =
          sticks.last().x + sticks.last().length + config.santaWidth;
        if (santaX > maxSantaX) {
          santaX = maxSantaX;
          status = "falling";
          jumpUsed = false; // Reset jump for new fall
          jumpIndicator.style.opacity = "1"; // Show jump indicator
        }
      }
      break;
    }
    case "jumping": {
      // Apply jump physics
      santaX += (timestamp - lastTimestamp) / config.speed;
      jumpVelocity += config.gravity;
      santaY += jumpVelocity;

      // Check if landed on a platform
      const [landedPlatform] = thePlatformTheStickHits();
      if (landedPlatform && santaY >= 0) {
        // Successfully landed!
        santaY = 0;
        const maxSantaX =
          landedPlatform.x + landedPlatform.w - config.santaDistanceFromEdge;
        if (santaX < maxSantaX) {
          santaX += (timestamp - lastTimestamp) / config.speed;
          if (santaX > maxSantaX) {
            santaX = maxSantaX;
            status = "transitioning";
          }
        } else {
          status = "transitioning";
        }
      } else if (santaY > config.platformHeight) {
        // Still falling, continue down
        status = "falling";
      }
      break;
    }
    case "falling": {
      if (santaY < config.platformHeight) {
        santaY += (timestamp - lastTimestamp) / config.speed;
      } else {
        status = "fell";
        jumpIndicator.style.opacity = "0";
      }
      break;
    }
    case "transitioning": {
      sceneOffset += (timestamp - lastTimestamp) / 2;

      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        if (sceneOffset > nextPlatform.x + nextPlatform.w - config.paddingX) {
          sticks.push({
            x: nextPlatform.x + nextPlatform.w,
            length: 0,
            rotation: 0
          });
          status = "waiting";
        }
      }
      break;
    }
    case "fell": {
      if (sticks.last().rotation < 180) {
        sticks.last().rotation += (timestamp - lastTimestamp) / config.speed;
      }

      if (santaY < config.platformHeight) {
        santaY += (timestamp - lastTimestamp) / config.speed;
      }

      if (
        sticks.last().rotation >= 180 &&
        santaY >= config.platformHeight
      ) {
        restartButton.style.display = "block";
      }
      break;
    }
  }

  draw();
  window.requestAnimationFrame(animate);

  lastTimestamp = timestamp;
}

function thePlatformTheStickHits() {
  if (sticks.last().rotation != 90)
    throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  if (
    platformTheStickHits &&
    platformTheStickHits.x +
      platformTheStickHits.w / 2 -
      config.perfectAreaSize / 2 <
      stickFarX &&
    stickFarX <
      platformTheStickHits.x +
        platformTheStickHits.w / 2 +
        config.perfectAreaSize / 2
  )
    return [platformTheStickHits, true];

  return [platformTheStickHits, false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawBackground();
  ctx.translate(
    (window.innerWidth - config.canvasWidth) / 2 - sceneOffset,
    (window.innerHeight - config.canvasHeight) / 2
  );

  drawPlatforms();
  drawGifts();
  drawSpecialGifts();
  drawSanta();
  drawSticks();
  checkGiftCollision();
  checkSpecialGiftCollision();

  ctx.restore();
}

function drawGifts() {
  gifts.forEach(gift => {
    if (gift.revealed) return;

    ctx.save();
    ctx.fillStyle = "#ff4d6d";

    ctx.fillRect(
      gift.x - gift.size / 2,
      gift.y,
      gift.size,
      gift.size
    );

    // ribbon
    ctx.fillStyle = "gold";
    ctx.fillRect(gift.x - 2, gift.y, 4, gift.size);
    ctx.fillRect(
      gift.x - gift.size / 2,
      gift.y + gift.size / 2 - 2,
      gift.size,
      4
    );

    ctx.restore();
  });
}

function drawSpecialGifts() {
  specialGifts.forEach(gift => {
    ctx.save();
    
    // Draw particles
    gift.particles.forEach((particle, index) => {
      if (particle.life <= 0) {
        gift.particles.splice(index, 1);
        return;
      }
      
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 60;
      ctx.beginPath();
      ctx.arc(
        gift.x + particle.x,
        gift.y + particle.y,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3; // gravity
      particle.life--;
    });
    
    if (gift.revealed && gift.openProgress < 1) {
      gift.openProgress += 0.05;
    }
    
    if (!gift.revealed || gift.openProgress < 1) {
      // Draw the special gift box
      const pulse = Math.sin(Date.now() / 200) * 2;
      const size = gift.size + pulse;
      
      // Glow effect
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 20;
      
      // Box
      ctx.fillStyle = "#9333ea";
      ctx.fillRect(
        gift.x - size / 2,
        gift.y,
        size,
        size
      );
      
      // Opening animation
      if (gift.openProgress > 0) {
        const openAmount = size * gift.openProgress;
        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(
          gift.x - size / 2,
          gift.y - openAmount,
          size,
          size / 4
        );
      }
      
      ctx.shadowBlur = 0;
      
      // Golden ribbon
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(gift.x - 3, gift.y, 6, size);
      ctx.fillRect(
        gift.x - size / 2,
        gift.y + size / 2 - 3,
        size,
        6
      );
      
      // Sparkles
      for (let i = 0; i < 3; i++) {
        const angle = (Date.now() / 500 + i * 2) % (Math.PI * 2);
        const dist = 15 + pulse;
        const sparkleX = gift.x + Math.cos(angle) * dist;
        const sparkleY = gift.y + gift.size / 2 + Math.sin(angle) * dist;
        
        ctx.fillStyle = "#FFD700";
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200 + i) * 0.5;
        ctx.font = "12px Arial";
        ctx.fillText("✨", sparkleX, sparkleY);
      }
      
      ctx.globalAlpha = 1;
    }
    
    ctx.restore();
  });
}

function checkGiftCollision() {
  gifts.forEach(gift => {
    if (gift.revealed) return;

    if (
      santaX > gift.x - gift.size &&
      santaX < gift.x + gift.size &&
      santaY < gift.y + gift.size
    ) {
      gift.revealed = true;
      score += 1;
      scoreElement.innerText = score;
    }
  });
}

function checkSpecialGiftCollision() {
  specialGifts.forEach(gift => {
    if (gift.revealed) return;

    if (
      santaX > gift.x - gift.size &&
      santaX < gift.x + gift.size &&
      santaY < gift.y + gift.size
    ) {
      revealSpecialGift(gift);
      score += 5; // Bonus points!
      scoreElement.innerText = score;
    }
  });
}

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    let newX = x + 3;
    let newW = w - 6;
    let platformHeight =
      config.platformHeight + (window.innerHeight - config.canvasHeight) / 2;
    ctx.fillStyle = colours.platform;
    ctx.fillRect(
      newX,
      config.canvasHeight - config.platformHeight,
      newW,
      platformHeight
    );

    for (let i = 1; i <= platformHeight / 10; ++i) {
      let yGap = config.canvasHeight - config.platformHeight + i * 10;
      ctx.moveTo(newX, yGap);
      ctx.lineTo(newX + newW, yGap);
      let xGap = i % 2 ? 0 : 10;
      for (let j = 1; j < newW / 30; ++j) {
        let x = j * 20 + xGap;
        ctx.moveTo(newX + x, yGap);
        ctx.lineTo(newX + x, yGap + 10);
      }
      ctx.strokeStyle = colours.platformTop;
      ctx.stroke();
    }

    ctx.fillStyle = colours.platformTop;
    ctx.fillRect(x, config.canvasHeight - config.platformHeight, w, 10);

    if (sticks.last().x < x) {
      ctx.fillStyle = "white";
      ctx.fillRect(
        x + w / 2 - config.perfectAreaSize / 2,
        config.canvasHeight - config.platformHeight,
        config.perfectAreaSize,
        config.perfectAreaSize
      );
    }
  });
}

function drawSanta() {
  ctx.save();
  ctx.fillStyle = "red";
  ctx.translate(
    santaX - config.santaWidth / 2,
    santaY +
      config.canvasHeight -
      config.platformHeight -
      config.santaHeight / 2
  );

  // Rotation when jumping
  if (isJumping || status === "jumping") {
    ctx.rotate(Math.sin(Date.now() / 100) * 0.1);
  }

  ctx.fillRect(
    -config.santaWidth / 2,
    -config.santaHeight / 2,
    config.santaWidth,
    config.santaHeight - 4
  );

  const legDistance = 5;
  ctx.beginPath();
  ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = colours.skin;
  ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
  ctx.fill();
  
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(7, -2, 3, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "red";
  ctx.moveTo(-8, -13.5);
  ctx.lineTo(-15, -3.5);
  ctx.lineTo(-5, -7);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.fillRect(-config.santaWidth / 2, -12, config.santaWidth, 3);

  ctx.fillStyle = "black";
  ctx.fillRect(-config.santaWidth / 2, 2, config.santaWidth, 2);
  ctx.fillStyle = "white";
  ctx.fillRect(-config.santaWidth / 2, 4, config.santaWidth, 4.5);

  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(-17, -2, 3, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.restore();
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();

    ctx.translate(stick.x, config.canvasHeight - config.platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);

    ctx.strokeStyle = ctx.createPattern(createCandyPattern(), "repeat");
    ctx.stroke();

    ctx.restore();
  });
}

function drawBackground() {
  var gradient = ctx.createRadialGradient(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0,
    window.innerHeight / 2,
    window.innerWidth / 2,
    window.innerWidth
  );
  gradient.addColorStop(0, colours.lightBg);
  gradient.addColorStop(1, colours.darkBg);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  hills.forEach((hill) =>
    drawHill(hill.baseHeight, hill.amplitude, hill.stretch, hill.colour)
  );
  trees.forEach((tree) => drawTree(tree.x, tree.color));
  clouds.forEach((cloud) => drawCloud(cloud.x, cloud.y, cloud.w));
}

function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
  for (let i = 0; i < window.innerWidth; i++) {
    ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
  }
  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTree(x, color) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * config.backgroundSpeedMultiplier + x) * hills[1].stretch,
    getTreeY(x, hills[1].baseHeight, hills[1].amplitude)
  );

  const treeTrunkHeight = 15;
  const treeTrunkWidth = 10;
  const treeCrownHeight = 60;
  const treeCrownWidth = 30;

  // Draw trunk
  ctx.fillStyle = colours.darkHill;
  ctx.fillRect(
    -treeTrunkWidth / 2,
    -treeTrunkHeight,
    treeTrunkWidth,
    treeTrunkHeight
  );

  // Draw crown
  ctx.beginPath();

  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight * 3);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight * 3);

  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight * 2);
  ctx.lineTo(0, -(treeTrunkHeight / 2 + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight * 2);

  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight / 2));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);

  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();
}

function drawCloud(x, y, width) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * config.backgroundSpeedMultiplier + x) * hills[1].stretch,
    getTreeY(x, hills[1].baseHeight, hills[1].amplitude)
  );

  height = width * 1.5;
  ctx.beginPath();
  ctx.arc(x, y, width, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(x + height, y - width, height, Math.PI * 1, Math.PI * 2);
  ctx.arc(x + height * 2, y - width, height, Math.PI * 1.2, Math.PI);
  ctx.arc(x + width * 3, y, width, Math.PI * 1.5, Math.PI * 0.5);
  ctx.moveTo(x + width * 3, y + width);
  ctx.lineTo(x, y + width);
  ctx.fillStyle = "rgba(255, 255, 255, .3)";
  ctx.fill();

  ctx.restore();
}

function createCandyPattern() {
  const patternCanvas = document.createElement("canvas");
  const pctx = patternCanvas.getContext("2d");

  const max = 15;
  let i = 0;
  let x = 0;
  let z = 90;

  while (i < max) {
    pctx.beginPath();
    pctx.moveTo(0, x);
    pctx.lineTo(0, z);
    pctx.lineWidth = 24;
    pctx.strokeStyle = "red";
    pctx.stroke();

    pctx.beginPath();
    pctx.moveTo(0, x + 24);
    pctx.lineTo(0, z + 24);
    pctx.lineWidth = 24;
    pctx.strokeStyle = "white";
    pctx.stroke();

    x += 48;
    z += 48;
    i++;
  }

  return patternCanvas;
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus(
      (sceneOffset * config.backgroundSpeedMultiplier + windowX) * stretch
    ) *
      amplitude +
    sineBaseY
  );
}

function getTreeY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}

function createElementStyle(element, cssStyles = null, inner = null) {
  const g = document.createElement(element);
  if (cssStyles) g.style.cssText = cssStyles;
  if (inner) g.innerHTML = inner;
  document.body.appendChild(g);
  return g;
}

function addShadow(colour, depth) {
  let shadow = "";
  for (let i = 0; i <= depth; i++) {
    shadow += `${i}px ${i}px 0 ${colour}`;
    shadow += i < depth ? ", " : "";
  }
  return shadow;
}

const funs = new Funs('light');
funs.signature();