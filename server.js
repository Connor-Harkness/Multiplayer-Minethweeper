const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state management
const games = new Map();
const lobbyUsers = new Set();

class MinesweeperGame {
    constructor(gameId, difficulty = 'medium') {
        this.gameId = gameId;
        this.players = [];
        this.spectators = [];
        this.gameState = 'waiting'; // waiting, playing, finished
        this.currentPlayer = 0;
        this.scores = {};
        
        // Difficulty settings
        const difficulties = {
            easy: { width: 8, height: 8, mines: 10 },
            medium: { width: 12, height: 12, mines: 25 },
            hard: { width: 16, height: 16, mines: 50 }
        };
        
        const config = difficulties[difficulty] || difficulties.medium;
        this.width = config.width;
        this.height = config.height;
        this.mineCount = config.mines;
        
        this.initializeBoard();
    }
    
    initializeBoard() {
        // Create empty board
        this.board = Array(this.height).fill().map(() => 
            Array(this.width).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
                revealedBy: null
            }))
        );
        
        this.minesPlaced = false;
        this.gameStarted = false;
    }
    
    placeMines(firstClickRow, firstClickCol) {
        if (this.minesPlaced) return;
        
        const mines = [];
        while (mines.length < this.mineCount) {
            const row = Math.floor(Math.random() * this.height);
            const col = Math.floor(Math.random() * this.width);
            
            // Don't place mine on first click or adjacent cells
            const isFirstClick = row === firstClickRow && col === firstClickCol;
            const isAdjacent = Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1;
            
            if (!isFirstClick && !isAdjacent && !mines.some(([r, c]) => r === row && c === col)) {
                mines.push([row, col]);
                this.board[row][col].isMine = true;
            }
        }
        
        // Calculate neighbor mine counts
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].neighborMines = this.countNeighborMines(row, col);
                }
            }
        }
        
        this.minesPlaced = true;
    }
    
    countNeighborMines(row, col) {
        let count = 0;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < this.height && c >= 0 && c < this.width) {
                    if (this.board[r][c].isMine) count++;
                }
            }
        }
        return count;
    }
    
    addPlayer(socketId, playerName) {
        if (this.players.length < 4) { // Max 4 players
            this.players.push({ socketId, playerName, score: 0 });
            this.scores[socketId] = 0;
            return true;
        }
        return false;
    }
    
    removePlayer(socketId) {
        this.players = this.players.filter(p => p.socketId !== socketId);
        delete this.scores[socketId];
        
        if (this.players.length === 0) {
            return true; // Game should be deleted
        }
        
        // Adjust current player if needed
        if (this.currentPlayer >= this.players.length) {
            this.currentPlayer = 0;
        }
        
        return false;
    }
    
    revealCell(row, col, playerId) {
        if (this.gameState !== 'playing') return { success: false, reason: 'Game not active' };
        
        const playerIndex = this.players.findIndex(p => p.socketId === playerId);
        if (playerIndex === -1) return { success: false, reason: 'Player not in game' };
        if (playerIndex !== this.currentPlayer) return { success: false, reason: 'Not your turn' };
        
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return { success: false, reason: 'Cell not clickable' };
        
        // Place mines on first click
        if (!this.minesPlaced) {
            this.placeMines(row, col);
        }
        
        const revealedCells = [];
        
        if (cell.isMine) {
            // Game over - reveal all mines
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    if (this.board[r][c].isMine) {
                        this.board[r][c].isRevealed = true;
                        revealedCells.push([r, c]);
                    }
                }
            }
            this.gameState = 'finished';
            return { success: true, gameOver: true, winner: this.getWinner(), revealedCells };
        } else {
            // Reveal cell and potentially neighbors
            this.revealCellRecursive(row, col, playerId, revealedCells);
            
            // Award points to current player
            const pointsEarned = revealedCells.length;
            this.scores[playerId] += pointsEarned;
            this.players[playerIndex].score += pointsEarned;
            
            // Check win condition
            if (this.checkWinCondition()) {
                this.gameState = 'finished';
                return { success: true, gameWon: true, winner: this.getWinner(), revealedCells, pointsEarned };
            }
            
            // Next player's turn
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            
            return { success: true, revealedCells, pointsEarned, nextPlayer: this.currentPlayer };
        }
    }
    
    revealCellRecursive(row, col, playerId, revealedCells) {
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return;
        
        const cell = this.board[row][col];
        if (cell.isRevealed || cell.isFlagged || cell.isMine) return;
        
        cell.isRevealed = true;
        cell.revealedBy = playerId;
        revealedCells.push([row, col]);
        
        // If cell has no neighboring mines, reveal all neighbors
        if (cell.neighborMines === 0) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    this.revealCellRecursive(r, c, playerId, revealedCells);
                }
            }
        }
    }
    
    toggleFlag(row, col, playerId) {
        if (this.gameState !== 'playing') return { success: false, reason: 'Game not active' };
        
        const playerIndex = this.players.findIndex(p => p.socketId === playerId);
        if (playerIndex === -1) return { success: false, reason: 'Player not in game' };
        if (playerIndex !== this.currentPlayer) return { success: false, reason: 'Not your turn' };
        
        const cell = this.board[row][col];
        if (cell.isRevealed) return { success: false, reason: 'Cell already revealed' };
        
        cell.isFlagged = !cell.isFlagged;
        
        // Next player's turn
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        
        return { success: true, flagged: cell.isFlagged, nextPlayer: this.currentPlayer };
    }
    
    checkWinCondition() {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const cell = this.board[row][col];
                if (!cell.isMine && !cell.isRevealed) {
                    return false;
                }
            }
        }
        return true;
    }
    
    getWinner() {
        if (this.players.length === 0) return null;
        
        return this.players.reduce((winner, player) => 
            player.score > winner.score ? player : winner
        );
    }
    
    startGame() {
        if (this.players.length >= 2) {
            this.gameState = 'playing';
            this.gameStarted = true;
            return true;
        }
        return false;
    }
    
    getGameState() {
        return {
            gameId: this.gameId,
            players: this.players,
            gameState: this.gameState,
            currentPlayer: this.currentPlayer,
            board: this.board,
            width: this.width,
            height: this.height,
            scores: this.scores
        };
    }
    
    getPublicGameState() {
        // Return game state without revealing mines
        const publicBoard = this.board.map(row => 
            row.map(cell => ({
                isRevealed: cell.isRevealed,
                isFlagged: cell.isFlagged,
                neighborMines: cell.isRevealed ? cell.neighborMines : 0,
                isMine: cell.isRevealed && cell.isMine,
                revealedBy: cell.revealedBy
            }))
        );
        
        return {
            gameId: this.gameId,
            players: this.players,
            gameState: this.gameState,
            currentPlayer: this.currentPlayer,
            board: publicBoard,
            width: this.width,
            height: this.height,
            scores: this.scores
        };
    }
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Add user to lobby
    lobbyUsers.add(socket.id);
    socket.emit('lobby-joined');
    updateLobby();
    
    // Handle creating a new game
    socket.on('create-game', (data) => {
        const { playerName, difficulty } = data;
        const gameId = generateGameId();
        const game = new MinesweeperGame(gameId, difficulty);
        
        if (game.addPlayer(socket.id, playerName)) {
            games.set(gameId, game);
            socket.join(gameId);
            lobbyUsers.delete(socket.id);
            
            socket.emit('game-created', { gameId, game: game.getPublicGameState() });
            updateLobby();
            updateGameRoom(gameId);
        }
    });
    
    // Handle joining an existing game
    socket.on('join-game', (data) => {
        const { gameId, playerName } = data;
        const game = games.get(gameId);
        
        if (game && game.gameState === 'waiting') {
            if (game.addPlayer(socket.id, playerName)) {
                socket.join(gameId);
                lobbyUsers.delete(socket.id);
                
                socket.emit('game-joined', { gameId, game: game.getPublicGameState() });
                updateGameRoom(gameId);
                updateLobby();
            } else {
                socket.emit('join-error', 'Game is full');
            }
        } else {
            socket.emit('join-error', 'Game not found or already started');
        }
    });
    
    // Handle starting a game
    socket.on('start-game', (gameId) => {
        const game = games.get(gameId);
        if (game && game.players[0].socketId === socket.id) {
            if (game.startGame()) {
                updateGameRoom(gameId);
            } else {
                socket.emit('start-error', 'Need at least 2 players to start');
            }
        }
    });
    
    // Handle cell reveal
    socket.on('reveal-cell', (data) => {
        const { gameId, row, col } = data;
        const game = games.get(gameId);
        
        if (game) {
            const result = game.revealCell(row, col, socket.id);
            if (result.success) {
                updateGameRoom(gameId);
            } else {
                socket.emit('action-error', result.reason);
            }
        }
    });
    
    // Handle flag toggle
    socket.on('toggle-flag', (data) => {
        const { gameId, row, col } = data;
        const game = games.get(gameId);
        
        if (game) {
            const result = game.toggleFlag(row, col, socket.id);
            if (result.success) {
                updateGameRoom(gameId);
            } else {
                socket.emit('action-error', result.reason);
            }
        }
    });
    
    // Handle leaving game
    socket.on('leave-game', (gameId) => {
        const game = games.get(gameId);
        if (game) {
            const shouldDelete = game.removePlayer(socket.id);
            socket.leave(gameId);
            lobbyUsers.add(socket.id);
            
            if (shouldDelete) {
                games.delete(gameId);
            } else {
                updateGameRoom(gameId);
            }
            
            socket.emit('lobby-joined');
            updateLobby();
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        lobbyUsers.delete(socket.id);
        
        // Remove from any games
        for (const [gameId, game] of games.entries()) {
            const shouldDelete = game.removePlayer(socket.id);
            if (shouldDelete) {
                games.delete(gameId);
            } else {
                updateGameRoom(gameId);
            }
        }
        
        updateLobby();
    });
});

function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function updateLobby() {
    const lobbyData = {
        activeUsers: lobbyUsers.size,
        availableGames: Array.from(games.values())
            .filter(game => game.gameState === 'waiting')
            .map(game => ({
                gameId: game.gameId,
                players: game.players.length,
                maxPlayers: 4
            }))
    };
    
    io.emit('lobby-update', lobbyData);
}

function updateGameRoom(gameId) {
    const game = games.get(gameId);
    if (game) {
        io.to(gameId).emit('game-update', game.getPublicGameState());
    }
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});