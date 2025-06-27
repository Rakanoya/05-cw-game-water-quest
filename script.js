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

// Keyboard navigation state
let currentGridPosition = 0; // Current focused grid cell (0-8)
let keyboardNavigationActive = false;

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
    cell.className = 'grid-cell';
    cell.tabIndex = 0; // Make cell focusable for keyboard navigation
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Grid cell ${i + 1} of 9`);
    cell.setAttribute('aria-describedby', 'grid-instructions');
    cell.setAttribute('data-cell-index', i);
    grid.appendChild(cell);
  }
  
  // Add hidden instructions for screen readers
  if (!document.getElementById('grid-instructions')) {
    const instructions = document.createElement('div');
    instructions.id = 'grid-instructions';
    instructions.className = 'sr-only';
    instructions.textContent = 'Use arrow keys to navigate grid, space or enter to collect water cans or hit rocks';
    document.body.appendChild(instructions);
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
  cells.forEach(cell => {
    cell.innerHTML = '';
    const index = cell.getAttribute('data-cell-index');
    cell.setAttribute('aria-label', `Grid cell ${parseInt(index) + 1} of 9, empty`);
  });

  const spawnRock = Math.random() < 0.2;
  let randomCell = cells[Math.floor(Math.random() * cells.length)];
  const cellIndex = randomCell.getAttribute('data-cell-index');
  const cellPosition = parseInt(cellIndex) + 1;

  if (spawnRock) {
    randomCell.innerHTML = `
      <div class="rock-obstacle-wrapper">
        <div class="rock-obstacle" tabindex="0" role="button" aria-label="Rock obstacle in cell ${cellPosition}, click to lose a can"></div>
      </div>
    `;
    randomCell.setAttribute('aria-label', `Grid cell ${cellPosition} of 9, contains rock obstacle`);
    const rock = randomCell.querySelector('.rock-obstacle');
    if (rock) {
      rock.addEventListener('click', handleRockClick, { once: true });
      rock.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRockClick({ target: rock });
        }
      }, { once: true });
      // Only focus if keyboard navigation is active
      if (keyboardNavigationActive && parseInt(cellIndex) === currentGridPosition) {
        rock.focus();
      }
    }
  } else {
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <div class="water-can" tabindex="0" role="button" aria-label="Water can in cell ${cellPosition}, click to collect"></div>
      </div>
    `;
    randomCell.setAttribute('aria-label', `Grid cell ${cellPosition} of 9, contains water can`);
    const can = randomCell.querySelector('.water-can');
    if (can) {
      can.addEventListener('click', handleCanClick, { once: true });
      can.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCanClick({ target: can });
        }
      }, { once: true });
      // Only focus if keyboard navigation is active
      if (keyboardNavigationActive && parseInt(cellIndex) === currentGridPosition) {
        can.focus();
      }
    }
  }
}

// Handle clicking a water can
function handleCanClick(e) {
  if (!gameActive) return;
  currentCans++;
  updateScore();
  checkMilestones();
  // Announce to screen reader
  announceToScreenReader(`Water can collected! ${currentCans} of ${currentGoal} cans collected.`);
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
  // Announce to screen reader
  announceToScreenReader(`Rock hit! Lost a can. ${currentCans} of ${currentGoal} cans remaining.`);
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
  initializeKeyboardNavigation();
  announceToScreenReader(`Game started! Collect ${currentGoal} water cans in ${currentTimeLimit} seconds. Use arrow keys to navigate and space to collect.`);
  spawnInterval = setInterval(spawnWaterCan, currentSpawnRate);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    
    // Announce time warnings for accessibility
    if (timeLeft === 10) {
      announceToScreenReader('10 seconds remaining!');
    } else if (timeLeft === 5) {
      announceToScreenReader('5 seconds left!');
    }
    
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearKeyboardNavigation();
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
  clearKeyboardNavigation();
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

// Screen reader announcement helper
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  // Remove the announcement after a brief delay
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);
}

// Keyboard navigation helper functions
function moveGridFocus(direction) {
  if (!gameActive) return;
  
  const cells = document.querySelectorAll('.grid-cell');
  if (cells.length === 0) return;
  
  // Remove previous focus highlight
  cells[currentGridPosition].classList.remove('keyboard-focus');
  
  switch (direction) {
    case 'up':
      if (currentGridPosition >= 3) currentGridPosition -= 3;
      break;
    case 'down':
      if (currentGridPosition < 6) currentGridPosition += 3;
      break;
    case 'left':
      if (currentGridPosition % 3 !== 0) currentGridPosition -= 1;
      break;
    case 'right':
      if (currentGridPosition % 3 !== 2) currentGridPosition += 1;
      break;
  }
  
  // Add focus highlight and focus the cell
  cells[currentGridPosition].classList.add('keyboard-focus');
  cells[currentGridPosition].focus();
  keyboardNavigationActive = true;
}

function activateCurrentGridCell() {
  if (!gameActive || !keyboardNavigationActive) return;
  
  const cells = document.querySelectorAll('.grid-cell');
  const currentCell = cells[currentGridPosition];
  const waterCan = currentCell.querySelector('.water-can');
  const rock = currentCell.querySelector('.rock-obstacle');
  
  if (waterCan) {
    handleCanClick({ target: waterCan });
  } else if (rock) {
    handleRockClick({ target: rock });
  }
}

function initializeKeyboardNavigation() {
  const cells = document.querySelectorAll('.grid-cell');
  if (cells.length > 0) {
    currentGridPosition = 0;
    cells[currentGridPosition].classList.add('keyboard-focus');
    keyboardNavigationActive = true;
  }
}

function clearKeyboardNavigation() {
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => cell.classList.remove('keyboard-focus'));
  keyboardNavigationActive = false;
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('reset-game').addEventListener('click', resetGame);
document.getElementById('difficulty').addEventListener('change', resetGame);

// Accessibility: allow keyboard shortcuts for game controls
document.addEventListener('keydown', function(e) {
  // Prevent default for game controls to avoid page scrolling
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
    if (gameActive || (!gameActive && (e.key === ' ' || e.key === 'Enter'))) {
      e.preventDefault();
    }
  }
  
  // Arrow key navigation during gameplay
  if (gameActive) {
    switch (e.key) {
      case 'ArrowUp':
        moveGridFocus('up');
        break;
      case 'ArrowDown':
        moveGridFocus('down');
        break;
      case 'ArrowLeft':
        moveGridFocus('left');
        break;
      case 'ArrowRight':
        moveGridFocus('right');
        break;
      case ' ':
      case 'Enter':
        activateCurrentGridCell();
        break;
      case 'r':
      case 'R':
        resetGame();
        break;
      case 'Escape':
        // Focus the reset button for easy access
        document.getElementById('reset-game').focus();
        break;
    }
    return;
  }
  
  // Controls when game is not active
  if (!gameActive) {
    // Space or Enter starts game
    if (e.key === ' ' || e.key === 'Enter') {
      const activeElement = document.activeElement;
      const startBtn = document.getElementById('start-game');
      const resetBtn = document.getElementById('reset-game');
      
      if (activeElement === startBtn || activeElement === document.body) {
        startGame();
      } else if (activeElement === resetBtn) {
        resetGame();
      }
    }
    
    // S key to focus start button
    if (e.key === 's' || e.key === 'S') {
      document.getElementById('start-game').focus();
    }
    
    // D key to focus difficulty selector
    if (e.key === 'd' || e.key === 'D') {
      document.getElementById('difficulty').focus();
    }
  }
});
