// Simple test to create game history
const io = require('socket.io-client');

const socket1 = io('http://localhost:45453');
const socket2 = io('http://localhost:45453');

let gameId = '';

socket1.on('connect', () => {
    console.log('Player 1 connected');
    
    // Create a game
    socket1.emit('create-game', {
        playerName: 'TestPlayer1',
        difficulty: 'easy',
        maxPlayers: 2
    });
});

socket1.on('game-created', (data) => {
    gameId = data.gameId;
    console.log('Game created:', gameId);
    
    // Player 2 joins
    socket2.emit('join-game', {
        gameId: gameId,
        playerName: 'TestPlayer2'
    });
});

socket2.on('game-joined', (data) => {
    console.log('Player 2 joined');
    
    // Start the game
    socket1.emit('start-game', gameId);
});

socket1.on('game-update', (gameState) => {
    if (gameState.gameState === 'playing') {
        console.log('Game started, making first move');
        // Reveal a safe cell (corner is usually safe)
        socket1.emit('reveal-cell', {
            gameId: gameId,
            row: 0,
            col: 0
        });
    }
    
    if (gameState.gameState === 'finished') {
        console.log('Game finished!');
        
        // Test history request
        setTimeout(() => {
            socket1.emit('get-game-history');
        }, 1000);
    }
});

socket1.on('game-history', (history) => {
    console.log('Game history received:', history.length, 'games');
    if (history.length > 0) {
        console.log('Latest game:', history[0]);
    }
    
    // Test leaderboard
    socket1.emit('get-leaderboard', 'all');
});

socket1.on('leaderboard', (leaderboard) => {
    console.log('Leaderboard received:', leaderboard.length, 'entries');
    if (leaderboard.length > 0) {
        console.log('Top player:', leaderboard[0]);
    }
    
    // Disconnect
    setTimeout(() => {
        socket1.disconnect();
        socket2.disconnect();
        process.exit(0);
    }, 1000);
});

socket2.on('connect', () => {
    console.log('Player 2 connected');
});

// Handle errors
socket1.on('join-error', (error) => console.log('Join error:', error));
socket1.on('start-error', (error) => console.log('Start error:', error));
socket1.on('action-error', (error) => console.log('Action error:', error));