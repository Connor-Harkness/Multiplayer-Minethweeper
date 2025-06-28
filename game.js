class MinesweeperGame {
    constructor() {
        this.board = [];
        this.rows = 8;
        this.cols = 8;
        this.mines = 10;
        this.difficulty = 'easy';
        this.gameStarted = false;
        this.gameOver = false;
        this.currentPlayer = 1;
        this.scores = { player1: 0, player2: 0 };
        this.revealedCells = 0;
        this.totalSafeCells = 0;
        
        this.difficulties = {
            easy: { rows: 8, cols: 8, mines: 10 },
            medium: { rows: 12, cols: 12, mines: 25 },
            hard: { rows: 16, cols: 16, mines: 50 }
        };
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.createBoard();
        this.renderBoard();
        this.updateUI();
    }
    
    createBoard() {
        this.board = [];
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0,
                    revealedBy: null
                };
            }
        }
        this.totalSafeCells = this.rows * this.cols - this.mines;
        this.revealedCells = 0;
    }
    
    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first click or if already has mine
            if ((row === firstClickRow && col === firstClickCol) || this.board[row][col].isMine) {
                continue;
            }
            
            this.board[row][col].isMine = true;
            minesPlaced++;
        }
        
        this.calculateNeighborMines();
    }
    
    calculateNeighborMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.board[i][j].isMine) {
                    this.board[i][j].neighborMines = this.countNeighborMines(i, j);
                }
            }
        }
    }
    
    countNeighborMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (this.isValidCell(newRow, newCol) && this.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    revealCell(row, col) {
        if (this.gameOver || this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return false;
        }
        
        // First click - place mines
        if (!this.gameStarted) {
            this.placeMines(row, col);
            this.gameStarted = true;
        }
        
        const cell = this.board[row][col];
        cell.isRevealed = true;
        cell.revealedBy = this.currentPlayer;
        this.revealedCells++;
        
        // Update score for current player
        this.scores[`player${this.currentPlayer}`]++;
        
        if (cell.isMine) {
            this.gameOver = true;
            this.revealAllMines();
            this.updateStatus(`Game Over! Player ${this.currentPlayer} hit a mine!`);
            return false;
        }
        
        // Auto-reveal empty cells
        if (cell.neighborMines === 0) {
            this.revealNeighbors(row, col);
        }
        
        // Check win condition
        if (this.revealedCells === this.totalSafeCells) {
            this.gameOver = true;
            const winner = this.scores.player1 > this.scores.player2 ? 'Player 1' : 
                          this.scores.player2 > this.scores.player1 ? 'Player 2' : 'Tie';
            this.updateStatus(`Game Won! Winner: ${winner}`);
            return false;
        }
        
        // Switch turns
        this.switchPlayer();
        return true;
    }
    
    revealNeighbors(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (this.isValidCell(newRow, newCol) && !this.board[newRow][newCol].isRevealed) {
                    this.revealCell(newRow, newCol);
                }
            }
        }
    }
    
    toggleFlag(row, col) {
        if (this.gameOver || this.board[row][col].isRevealed) {
            return;
        }
        
        this.board[row][col].isFlagged = !this.board[row][col].isFlagged;
        this.renderBoard();
        this.updateUI();
    }
    
    revealAllMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j].isMine) {
                    this.board[i][j].isRevealed = true;
                }
            }
        }
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateUI();
    }
    
    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < this.rows; i++) {
            const row = document.createElement('div');
            row.className = 'game-row';
            
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const boardCell = this.board[i][j];
                
                if (boardCell.isFlagged) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                } else if (boardCell.isRevealed) {
                    cell.classList.add('revealed');
                    if (boardCell.isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (boardCell.neighborMines > 0) {
                        cell.textContent = boardCell.neighborMines;
                        cell.classList.add(`number-${boardCell.neighborMines}`);
                    }
                }
                
                row.appendChild(cell);
            }
            
            gameBoard.appendChild(row);
        }
    }
    
    updateUI() {
        document.getElementById('current-player').textContent = `Player ${this.currentPlayer}`;
        document.getElementById('player1-score').textContent = this.scores.player1;
        document.getElementById('player2-score').textContent = this.scores.player2;
        document.getElementById('mines-count').textContent = this.mines;
    }
    
    updateStatus(message) {
        const statusElement = document.getElementById('game-status');
        statusElement.textContent = message;
        
        if (message.includes('Game Over')) {
            statusElement.className = 'game-status game-over';
        } else if (message.includes('Game Won')) {
            statusElement.className = 'game-status game-won';
        } else {
            statusElement.className = 'game-status';
        }
    }
    
    resetGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.currentPlayer = 1;
        this.scores = { player1: 0, player2: 0 };
        this.revealedCells = 0;
        
        this.initializeGame();
        this.updateStatus('Click a cell to start the game!');
    }
    
    changeDifficulty() {
        const difficulties = ['easy', 'medium', 'hard'];
        const currentIndex = difficulties.indexOf(this.difficulty);
        const nextIndex = (currentIndex + 1) % difficulties.length;
        this.difficulty = difficulties[nextIndex];
        
        const config = this.difficulties[this.difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mines = config.mines;
        
        document.getElementById('difficulty-btn').textContent = 
            `Change Difficulty (${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)})`;
        
        this.resetGame();
    }
    
    setupEventListeners() {
        const gameBoard = document.getElementById('game-board');
        
        gameBoard.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.revealCell(row, col);
                this.renderBoard();
            }
        });
        
        gameBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.toggleFlag(row, col);
            }
        });
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('difficulty-btn').addEventListener('click', () => {
            this.changeDifficulty();
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MinesweeperGame();
});