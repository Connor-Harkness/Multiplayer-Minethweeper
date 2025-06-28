# 🎯 Multiplayer Minesweeper

A real-time multiplayer minesweeper game built with Socket.io that allows players to compete across devices with a simple lobby system.

## 🚀 Features

### Real-time Multiplayer
- **Cross-device gameplay**: Play with friends on different devices instantly
- **Socket.io integration**: Real-time communication for seamless multiplayer experience
- **Turn-based mechanics**: Players take turns revealing cells and flagging mines
- **Live scoring**: Points awarded for each safe cell revealed by a player

### Lobby System
- **Game creation**: Create new games with custom difficulty settings
- **Game discovery**: Browse and join available games
- **Live player count**: See how many players are online
- **Instant joining**: Join games in progress (up to 4 players per game)

### Game Features
- **Multiple difficulty levels**: Easy (8x8), Medium (12x12), Hard (16x16)
- **Smart mine placement**: First click is always safe
- **Flag system**: Right-click or long-press to flag suspected mines
- **Auto-reveal**: Empty cells automatically reveal neighboring cells
- **Player identification**: Color-coded cells show which player revealed them
- **Win conditions**: Game ends when all safe cells are revealed or a mine is hit

### Mobile-Friendly
- **Responsive design**: Works perfectly on desktop, tablet, and mobile
- **Touch controls**: Tap to reveal, long-press to flag on mobile devices
- **Optimized UI**: Adapts to different screen sizes

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Real-time Communication**: Socket.io
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Responsive Design**: CSS Grid and Flexbox

## 📋 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Connor-Harkness/Multiplayer-Minethweeper.git
   cd Multiplayer-Minethweeper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎮 How to Play

### Getting Started
1. Enter your player name in the lobby
2. Choose to create a new game or join an existing one
3. Wait for at least 2 players to join
4. The game creator can start the game

### Gameplay
- **Turn-based**: Players alternate turns clicking cells
- **Left-click/Tap**: Reveal a cell
- **Right-click/Long-press**: Flag/unflag a suspected mine
- **Scoring**: Earn 1 point for each safe cell you reveal
- **Auto-reveal**: Clicking an empty cell reveals all adjacent empty cells
- **Win condition**: Player with the most points when all safe cells are revealed wins
- **Lose condition**: Game ends immediately if anyone hits a mine

### Controls
- **Desktop**: Left-click to reveal, right-click to flag
- **Mobile**: Tap to reveal, long-press (500ms+) to flag

## 🏗️ Architecture

### Server-side (`server.js`)
- **Express.js** serves static files and handles HTTP requests
- **Socket.io** manages real-time communication between clients
- **Game class** handles minesweeper logic, player management, and game state
- **Lobby system** manages active games and player connections

### Client-side (`public/`)
- **`index.html`**: Main game interface with lobby and game screens
- **`style.css`**: Responsive CSS styling with mobile optimization
- **`game.js`**: Client-side game logic and Socket.io event handling

### Key Components
1. **Lobby Management**: Create/join games, player tracking
2. **Real-time Synchronization**: Game state updates via Socket.io
3. **Game Logic**: Minesweeper rules, turn management, scoring
4. **Responsive UI**: Adapts to different screen sizes and input methods

## 🔧 Game Configuration

### Difficulty Levels
- **Easy**: 8×8 grid, 10 mines
- **Medium**: 12×12 grid, 25 mines  
- **Hard**: 16×16 grid, 50 mines

### Player Limits
- **Maximum players per game**: 4
- **Minimum players to start**: 2

## 🌟 Future Enhancements

- [ ] Private game rooms with custom codes
- [ ] Spectator mode for finished games
- [ ] Game replay system
- [ ] Tournament bracket system
- [ ] Custom difficulty settings
- [ ] Player statistics and leaderboards
- [ ] Chat system during gameplay

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

If you find any bugs or have suggestions for improvements, please open an issue on GitHub with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser/device information

---

**Enjoy playing Multiplayer Minesweeper! 🎮**