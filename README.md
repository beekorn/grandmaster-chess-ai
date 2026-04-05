# Grandmaster Chess AI

## Project Overview
A modern, mobile-first Chess application built with React 18 and TypeScript. It features a custom-built responsive board, a Minimax-based AI opponent with adjustable difficulty, and a sleek UI with multiple themes. The application runs entirely in the browser without a backend.

## User Manual

### Starting the Game
1.  The game loads automatically with the board set up for a new match.
2.  You play as **White** (bottom), and the AI plays as **Black** (top).

### Making Moves
1.  **Select**: Tap on any of your pieces (White) to select it. The square will highlight in yellow.
2.  **Move**: Valid moves will appear as small dots (for empty squares) or rings (for captures) on the board. Tap one of these indicators to move your piece.
3.  **Deselect**: Tap the selected piece again or tap an invalid square to cancel the selection.

### Game Controls (Menu)
Tap the **Menu Icon** (Hamburger) in the top-left corner to open the sidebar:
-   **Board Theme**: Choose between Green, Blue, Brown, or Gray board colors.
-   **AI Difficulty**: Select Easy, Medium, or Hard. This changes how deep the AI thinks (Depth 1-3).
-   **How to Play**: Opens a help modal with rules.
-   **New Game**: Resets the board immediately.

### Visual Indicators
-   **Turn Indicator**: The active player's nameplate (You or AI) will glow green and have a green border.
-   **Last Move**: The starting and ending squares of the most recent move are highlighted with a yellow overlay.

### Game Over
-   When Checkmate or Draw occurs, a modal will appear announcing the result.
-   Click "Play Again" to restart.

## Feature Specification

### Board Logic
-   **Grid**: The board is an 8x8 CSS Grid using `vmin` units to ensure it fits perfectly on mobile screens while maximizing size.
-   **Aspect Ratio**: The board container and every square maintain a strict 1:1 aspect ratio.
-   **Validation**: All moves are validated using the `chess.js` library. Illegal moves are prevented.
-   **Status**: The UI displays "Check" warnings and turn indicators.

### Piece Rendering
-   **Glyphs**: Uses Solid/Filled Unicode characters for BOTH players.
-   **Styling**: White pieces have white text with a black drop shadow. Black pieces have black text.
-   **Contrast**: Light squares are slightly off-white to ensure visibility.

### AI Opponent
-   **Algorithm**: Uses the Minimax algorithm with Alpha-Beta pruning.
-   **Evaluation**: Evaluates board states based on material value and positional advantages (Piece-Square Tables).
-   **Performance**: AI calculations run asynchronously with an artificial delay of 800ms for better UX.

### Customization
-   **Themes**: Changing the theme updates the CSS classes for the light and dark squares instantly.
-   **Responsiveness**: The layout adapts to portrait and landscape modes.

## Technical Architecture
-   **State Management**: `App.tsx` holds the central state (`game` instance, `fen` string, UI toggles). It passes derived state to the rendering logic.
-   **Rendering**: The board is rendered by mapping an array of 64 indices. Each square calculates its own color and content based on the current FEN string.
-   **Engine**: The AI logic is isolated in `ai.ts`. It accepts a `Chess` instance, clones it virtually to explore moves, and returns the best move object.