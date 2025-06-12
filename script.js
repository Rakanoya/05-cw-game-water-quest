// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
let currentCans = 0;         // Current number of items collected
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let timerInterval;           // Holds the interval for the timer
let timeLeft = 30;           // 30-second timer

// Winning and losing messages
const WIN_MESSAGES = [
  "Amazing! You brought water to the village!",
  "Victory! Clean water for everyone!",
  "You did it! Every drop counts!",
  "Champion! You made a difference!",
  "Incredible! You changed lives today!"
];
const LOSE_MESSAGES = [
  "Try again! The village still needs water.",
  "Almost! Give it another shot.",
  "Don't give up! The cans are waiting.",
  "Keep going! You can do it next time.",
  "So close! Try once more."
];

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy:   { goal: 12, time: 40, spawnRate: 1200 },
  normal: { goal: 20, time: 30, spawnRate: 1000 },
  hard:   { goal: 28, time: 20, spawnRate: 700 }
};

let currentGoal = DIFFICULTY_SETTINGS.normal.goal;
let currentSpawnRate = DIFFICULTY_SETTINGS.normal.spawnRate;
let currentTimeLimit = DIFFICULTY_SETTINGS.normal.time;

// Milestone messages: {score: number, messages: [array of strings]}
const MILESTONES = [
  { score: 5,  messages: ["Great start!", "Keep going!", "You're on your way!"] },
  { score: 10, messages: ["Halfway there!", "10 cans! Awesome!", "Keep up the pace!"] },
  { score: 15, messages: ["Just a few more!", "15 cans! Nearly done!", "You're so close!"] }
];

let shownMilestones = new Set();
let milestoneTimeout = null;

// Sound effects
const winSound = new Audio('img/win.mp3');
const itemSound = new Audio('img/collect.mp3'); // Use collect.mp3 for collecting cans
const wrongSound = new Audio('img/wrong.mp3');
const buttonSound = new Audio('img/button.mp3');

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Update instructions and internal settings based on difficulty
function setDifficultySettings() {
  const diff = document.getElementById('difficulty').value;
  currentGoal = DIFFICULTY_SETTINGS[diff].goal;
  currentSpawnRate = DIFFICULTY_SETTINGS[diff].spawnRate;
  currentTimeLimit = DIFFICULTY_SETTINGS[diff].time;
  document.querySelector('.game-instructions').textContent =
    `Collect ${currentGoal} cans in ${currentTimeLimit} seconds to complete the game!`;
}

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return;
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => (cell.innerHTML = ''));

  const spawnRock = Math.random() < 0.2;
  let randomCell = cells[Math.floor(Math.random() * cells.length)];

  if (spawnRock) {
    randomCell.innerHTML = `
      <div class="rock-obstacle-wrapper">
        <div class="rock-obstacle"></div>
      </div>
    `;
    const rock = randomCell.querySelector('.rock-obstacle');
    if (rock) {
      rock.addEventListener('click', handleRockClick, { once: true });
    }
  } else {
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <div class="water-can"></div>
      </div>
    `;
    const can = randomCell.querySelector('.water-can');
    if (can) {
      can.addEventListener('click', handleCanClick, { once: true });
    }
  }
}

// Handle clicking a water can
function handleCanClick(e) {
  if (!gameActive) return;
  currentCans++;
  updateScore();
  checkMilestones();
  // Play item sound
  try { itemSound.currentTime = 0; itemSound.play(); } catch {}
  // Remove the can immediately after click
  if (e.target && e.target.parentElement) {
    e.target.parentElement.remove(); // Remove the wrapper from the DOM
  }
}

// Handle clicking a rock obstacle
function handleRockClick(e) {
  if (!gameActive) return;
  if (currentCans > 0) currentCans--;
  updateScore();
  // Play wrong sound
  try { wrongSound.currentTime = 0; wrongSound.play(); } catch {}
  // Remove the rock immediately after click
  if (e.target && e.target.parentElement) {
    e.target.parentElement.remove(); // Remove the wrapper from the DOM
  }
}

// Update the score display
function updateScore() {
  document.getElementById('current-cans').textContent = currentCans;
}

// Update the timer display
function updateTimer() {
  document.getElementById('timer').textContent = timeLeft;
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return;
  try { buttonSound.currentTime = 0; buttonSound.play(); } catch {}
  setDifficultySettings();
  gameActive = true;
  currentCans = 0;
  timeLeft = currentTimeLimit;
  shownMilestones = new Set(); // Reset milestone tracking
  clearTimeout(milestoneTimeout); // Clear any lingering milestone timeout
  updateScore();
  updateTimer();
  clearInterval(timerInterval);
  clearInterval(spawnInterval);
  document.getElementById('achievements').textContent = '';
  createGrid();
  spawnInterval = setInterval(spawnWaterCan, currentSpawnRate);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  document.querySelectorAll('.grid-cell').forEach(cell => cell.innerHTML = '');
  const achievements = document.getElementById('achievements');
  let msgArr, msg;
  if (currentCans >= currentGoal) {
    msgArr = WIN_MESSAGES;
  } else {
    msgArr = LOSE_MESSAGES;
  }
  msg = msgArr[Math.floor(Math.random() * msgArr.length)];
  achievements.textContent = msg;
  achievements.className = 'achievement ' + (currentCans >= currentGoal ? 'win' : 'lose');
  if (currentCans >= currentGoal) {
    try { winSound.currentTime = 0; winSound.play(); } catch {}
    launchConfetti();
  }
}

function resetGame() {
  try { buttonSound.currentTime = 0; buttonSound.play(); } catch {}
  setDifficultySettings();
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  currentCans = 0;
  timeLeft = currentTimeLimit;
  shownMilestones = new Set(); // Reset milestone tracking
  clearTimeout(milestoneTimeout); // Clear any lingering milestone timeout
  updateScore();
  updateTimer();
  document.getElementById('achievements').textContent = '';
  document.getElementById('achievements').className = 'achievement';
  createGrid();
}

// Simple confetti effect (canvas-based, no dependencies)
function launchConfetti() {
  // Prevent multiple canvases
  if (document.getElementById('confetti-canvas')) return;

  const colors = ['#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53', '#FF902A', '#F5402C', '#159A48', '#F16061'];
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.pointerEvents = 'none';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const confettiCount = 120;
  const confetti = [];

  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: 6 + Math.random() * 8,
      d: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleIncremental: (Math.random() * 0.07) + 0.05
    });
  }

  let frame = 0;
  function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetti.forEach(c => {
      ctx.beginPath();
      ctx.lineWidth = c.r;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r / 3, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r);
      ctx.stroke();
    });
    updateConfetti();
    frame++;
    if (frame < 120) {
      requestAnimationFrame(drawConfetti);
    } else {
      document.body.removeChild(canvas);
    }
  }

  function updateConfetti() {
    confetti.forEach(c => {
      c.y += c.d;
      c.x += Math.sin(frame / 10) * 2;
      c.tiltAngle += c.tiltAngleIncremental;
      c.tilt = Math.sin(c.tiltAngle) * 15;
      if (c.y > canvas.height) {
        c.y = -10;
        c.x = Math.random() * canvas.width;
      }
    });
  }

  drawConfetti();
}

// Check and display milestone messages
function checkMilestones() {
  for (const milestone of MILESTONES) {
    if (
      currentCans === milestone.score &&
      !shownMilestones.has(milestone.score)
    ) {
      const msgArr = milestone.messages;
      const msg = msgArr[Math.floor(Math.random() * msgArr.length)];
      const achievements = document.getElementById('achievements');
      achievements.textContent = msg;
      achievements.className = 'achievement';
      shownMilestones.add(milestone.score);

      // Clear any previous timeout and set a new one to hide the message
      clearTimeout(milestoneTimeout);
      milestoneTimeout = setTimeout(() => {
        // Only clear if the message is still a milestone (not win/lose)
        if (
          achievements.textContent === msg &&
          !achievements.className.includes('win') &&
          !achievements.className.includes('lose')
        ) {
          achievements.textContent = '';
        }
      }, 1800); // 1.8 seconds
      break;
    }
  }
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('reset-game').addEventListener('click', resetGame);
document.getElementById('difficulty').addEventListener('change', resetGame);
