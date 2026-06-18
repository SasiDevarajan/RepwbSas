/* Shared JavaScript for navigation, Sudoku generation, validation, and page interaction */

const page = document.body.dataset.page;

function navigate(url) {
  window.location.href = url;
}

function animateConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 90}vw`;
    piece.style.top = `${-20 - Math.random() * 30}px`;
    piece.style.background = ['#f0d86b', '#8fb869', '#d68f5c', '#a3c5a1'][Math.floor(Math.random() * 4)];
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${1.4 + Math.random() * 0.7}s`;
    container.appendChild(piece);
  }
}

if (page === 'index') {
  document.getElementById('start-button').addEventListener('click', () => {
    navigate('sudoku.html');
  });
}

if (page === 'unlocked') {
  document.getElementById('view-button').addEventListener('click', () => {
    navigate('profile.html');
  });
}

if (page === 'sudoku') {
  const GRID_ROWS = 4;
  const GRID_COLS = 4;
  const BLOCK_ROWS = 2;
  const BLOCK_COLS = 2;

  const sudokuGrid = document.getElementById('sudoku-grid');
  const alertBox = document.getElementById('sudoku-alert');
  const checkButton = document.getElementById('check-button');
  const resetButton = document.getElementById('reset-button');

  let puzzle = [];
  let solution = [];

  function buildGrid() {
    sudokuGrid.innerHTML = '';
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.inputMode = 'numeric';
        input.pattern = '[1-4]';
        input.autocomplete = 'off';
        input.dataset.row = r;
        input.dataset.col = c;
        const value = puzzle[r][c];
        if (value !== 0) {
          input.value = value;
          input.disabled = true;
          cell.classList.add('fixed');
        } else {
          input.addEventListener('input', onCellInput);
          input.addEventListener('keydown', allowOnlyNumbers);
        }
        cell.appendChild(input);
        SudokuStyleBorder(cell, r, c);
        sudokuGrid.appendChild(cell);
      }
    }
  }

  function allowOnlyNumbers(event) {
    if (event.key.length === 1 && !/[1-4]/.test(event.key)) {
      event.preventDefault();
    }
  }

  function SudokuStyleBorder(cell, row, col) {
    const borderStyles = [];
    if (col === 0) borderStyles.push('border-left: 5px solid #4d5b2f');
    if (col === GRID_COLS - 1) borderStyles.push('border-right: 5px solid #4d5b2f');
    if (row === 0) borderStyles.push('border-top: 5px solid #4d5b2f');
    if (row === GRID_ROWS - 1) borderStyles.push('border-bottom: 5px solid #4d5b2f');
    if (col % BLOCK_COLS === 0 && col !== 0) borderStyles.push('border-left: 5px solid #4d5b2f');
    if (row % BLOCK_ROWS === 0 && row !== 0) borderStyles.push('border-top: 5px solid #4d5b2f');
    cell.style.cssText += borderStyles.join('; ');
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function generateBaseSolution() {
    return [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ];
  }

  function permuteRows(solution) {
    const rowBands = [solution.slice(0, 2), solution.slice(2, 4)];
    const permutedBands = shuffle(rowBands);
    return permutedBands.flatMap(band => shuffle(band));
  }

  function permuteCols(solution) {
    const columns = solution[0].map((_, colIndex) => solution.map(row => row[colIndex]));
    const colBands = [columns.slice(0, 2), columns.slice(2, 4)];
    const permutedBands = shuffle(colBands);
    const newCols = permutedBands.flatMap(band => shuffle(band));
    return solution.map((_, rowIndex) => newCols.map(col => col[rowIndex]));
  }

  function generatePuzzleFromSolution(fullSolution) {
    const grid = fullSolution.map(row => row.slice());
    const clearCount = 6 + Math.floor(Math.random() * 3);
    const positions = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        positions.push([r, c]);
      }
    }
    positions.sort(() => Math.random() - 0.5);
    for (let i = 0; i < clearCount; i++) {
      const [r, c] = positions[i];
      grid[r][c] = 0;
    }
    return grid;
  }

  function buildPuzzle() {
    const base = generateBaseSolution();
    const rowShuffled = permuteRows(base);
    solution = permuteCols(rowShuffled);
    puzzle = generatePuzzleFromSolution(solution);
    buildGrid();
    alertBox.textContent = 'Solve the puzzle to unlock more about Sasi!';
  }

  function readAnswer() {
    const values = Array.from(document.querySelectorAll('#sudoku-grid input')).map(input => {
      const value = input.value.trim();
      return parseInt(value, 10) || 0;
    });
    const matrix = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      matrix.push(values.slice(r * GRID_COLS, (r + 1) * GRID_COLS));
    }
    return matrix;
  }

  function validateGrid(candidate) {
    const conflicts = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));

    const markConflict = (r, c) => { conflicts[r][c] = true; };

    for (let r = 0; r < GRID_ROWS; r++) {
      const counts = {};
      for (let c = 0; c < GRID_COLS; c++) {
        const value = candidate[r][c];
        if (!value) continue;
        if (!counts[value]) counts[value] = [];
        counts[value].push([r, c]);
      }
      Object.values(counts).forEach(cells => { if (cells.length > 1) cells.forEach(([rr, cc]) => markConflict(rr, cc)); });
    }

    for (let c = 0; c < GRID_COLS; c++) {
      const counts = {};
      for (let r = 0; r < GRID_ROWS; r++) {
        const value = candidate[r][c];
        if (!value) continue;
        if (!counts[value]) counts[value] = [];
        counts[value].push([r, c]);
      }
      Object.values(counts).forEach(cells => { if (cells.length > 1) cells.forEach(([rr, cc]) => markConflict(rr, cc)); });
    }

    for (let br = 0; br < GRID_ROWS; br += BLOCK_ROWS) {
      for (let bc = 0; bc < GRID_COLS; bc += BLOCK_COLS) {
        const counts = {};
        for (let r = br; r < br + BLOCK_ROWS; r++) {
          for (let c = bc; c < bc + BLOCK_COLS; c++) {
            const value = candidate[r][c];
            if (!value) continue;
            if (!counts[value]) counts[value] = [];
            counts[value].push([r, c]);
          }
        }
        Object.values(counts).forEach(cells => { if (cells.length > 1) cells.forEach(([rr, cc]) => markConflict(rr, cc)); });
      }
    }

    return conflicts;
  }

  function refreshCellStyles(conflicts) {
    const inputs = Array.from(document.querySelectorAll('#sudoku-grid input'));
    inputs.forEach(input => {
      const r = Number(input.dataset.row);
      const c = Number(input.dataset.col);
      const parent = input.parentElement;
      if (!parent) return;
      parent.classList.toggle('conflict', conflicts[r][c]);
    });
  }

  function checkSolution() {
    const candidate = readAnswer();
    const conflicts = validateGrid(candidate);
    refreshCellStyles(conflicts);

    const isComplete = candidate.every(row => row.every(cell => cell >= 1 && cell <= 4));
    const noConflict = conflicts.flat().every(flag => !flag);
    if (!isComplete) {
      alertBox.textContent = 'Keep going — some cells are still empty.';
      return false;
    }
    if (!noConflict) {
      alertBox.textContent = 'There is a conflict in the grid. Check the red cells.';
      return false;
    }
    const isCorrect = candidate.every((row, r) => row.every((value, c) => value === solution[r][c]));
    if (!isCorrect) {
      alertBox.textContent = 'One or more values do not match the solution.';
      return false;
    }

    alertBox.textContent = 'Correct! Unlocking character...';
    animateConfetti();
    setTimeout(() => navigate('unlocked.html'), 1600);
    return true;
  }

  function onCellInput(event) {
    const input = event.target;
    if (!/^[1-4]$/.test(input.value)) {
      input.value = input.value.replace(/[^1-4]/g, '').slice(0, 1);
    }
    const candidate = readAnswer();
    const conflicts = validateGrid(candidate);
    refreshCellStyles(conflicts);
    if (candidate.every(row => row.every(cell => cell !== 0)) && conflicts.flat().every(flag => !flag)) {
      checkSolution();
    }
  }

  buildPuzzle();
  checkButton.addEventListener('click', checkSolution);
  resetButton.addEventListener('click', buildPuzzle);
  const skipLink = document.getElementById('skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', event => {
      event.preventDefault();
      navigate('unlocked.html');
    });
  }
}
