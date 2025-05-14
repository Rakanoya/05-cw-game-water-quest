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

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  
  // Clear all cells before spawning a new water can or obstacle
  cells.forEach(cell => (cell.innerHTML = ''));

  // Decide randomly if we spawn a rock obstacle (20% chance)
  const spawnRock = Math.random() < 0.2;
  let randomCell = cells[Math.floor(Math.random() * cells.length)];

  if (spawnRock) {
    // Spawn rock obstacle
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
    // Spawn water can
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
  // Remove the can immediately after click
  e.target.parentElement.innerHTML = '';
}

// Handle clicking a rock obstacle
function handleRockClick(e) {
  if (!gameActive) return;
  if (currentCans > 0) currentCans--;
  updateScore();
  // Remove the rock immediately after click
  e.target.parentElement.innerHTML = '';
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
  if (gameActive) return; // Prevent starting a new game if one is already active
  gameActive = true;
  currentCans = 0;
  timeLeft = 30;
  updateScore();
  updateTimer();
  clearInterval(timerInterval);
  clearInterval(spawnInterval);
  document.getElementById('achievements').textContent = '';
  createGrid(); // Set up the game grid
  spawnInterval = setInterval(spawnWaterCan, 1000); // Spawn water cans every second
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(timerInterval); // Stop timer
  // Remove any remaining cans
  document.querySelectorAll('.grid-cell').forEach(cell => cell.innerHTML = '');
  // Show win/lose message
  const achievements = document.getElementById('achievements');
  let msgArr, msg;
  if (currentCans >= 20) {
    msgArr = WIN_MESSAGES;
  } else {
    msgArr = LOSE_MESSAGES;
  }
  msg = msgArr[Math.floor(Math.random() * msgArr.length)];
  achievements.textContent = msg;
  achievements.className = 'achievement ' + (currentCans >= 20 ? 'win' : 'lose');

  // Confetti effect if player wins
  if (currentCans >= 20) {
    launchConfetti();
  }
}

function resetGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  currentCans = 0;      // Reset cans collected to zero
  timeLeft = 30;        // Reset timer to 30 seconds
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

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('reset-game').addEventListener('click', resetGame);
