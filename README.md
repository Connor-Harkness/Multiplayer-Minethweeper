# Multiplayer Minesweeper

A turn-based multiplayer minesweeper game built with HTML, CSS, and JavaScript.

## Features

- **Turn-based gameplay**: Two players take turns revealing cells
- **Score tracking**: Players earn points for each safe cell they reveal
- **Multiple difficulty levels**: Easy (8x8, 10 mines), Medium (12x12, 25 mines), Hard (16x16, 50 mines)
- **Flag functionality**: Right-click to flag suspected mines
- **Auto-reveal**: Empty cells automatically reveal neighboring cells
- **Responsive design**: Works on desktop and mobile devices

## How to Play

1. Open `index.html` in your web browser
2. Player 1 starts by clicking any cell to begin
3. Players alternate turns revealing cells
4. **Left-click** to reveal a cell
5. **Right-click** to flag/unflag a cell
6. Players earn 1 point for each safe cell they reveal
7. Game ends when:
   - A player hits a mine (game over)
   - All safe cells are revealed (victory)
8. The player with the most points wins

## Game Rules

- Players cannot reveal flagged cells
- Players cannot reveal already revealed cells
- When a player reveals an empty cell (0 neighboring mines), all connected empty cells are automatically revealed
- The player who reveals those auto-revealed cells gets the points
- If a player hits a mine, the game ends immediately

## Controls

- **New Game**: Start a fresh game
- **Change Difficulty**: Cycle through Easy, Medium, and Hard modes
- **Left-click**: Reveal cell
- **Right-click**: Flag/unflag cell

## Technical Details

- Pure vanilla JavaScript (no external dependencies)
- CSS Grid/Flexbox for responsive layout
- Local multiplayer (players share the same device)
- Automatic mine placement ensures first click is always safe

## Running the Game

Simply open `index.html` in any modern web browser. No server or installation required.

## Project Structure

```
├── index.html          # Main game interface
├── game.js            # Game logic and mechanics
├── style.css          # Styling and responsive design
├── package.json       # Project configuration
└── README.md          # This file
```