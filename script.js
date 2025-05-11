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
  
  // Clear all cells before spawning a new water can
  cells.forEach(cell => (cell.innerHTML = ''));

  // Select a random cell from the grid to place the water can
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // Use a template literal to create the wrapper and water-can element
  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      <div class="water-can"></div>
    </div>
  `;

  // Add click handler for the water can
  const can = randomCell.querySelector('.water-can');
  if (can) {
    can.addEventListener('click', handleCanClick, { once: true });
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
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
