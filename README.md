# Chess vs AI

A browser-based chess game where you play White against a JavaScript AI opponent. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies.

## Features

- Full legal move validation (all piece types, check-safety enforced)
- Check, checkmate, and stalemate detection
- AI opponent using Minimax with Alpha-Beta pruning (depth 3)
- Material-based position evaluation
- Auto-promotion to Queen
- Click-to-select, click-to-move interface with legal move highlighting

## Tech Stack

- HTML5
- CSS3 (Grid layout)
- Vanilla JavaScript (ES6)

## How to Run

1. Clone or download this repository
2. Open `index.html` in any modern browser
3. No build step, no server required

## How to Play

- You control White. Click a piece to see its legal moves highlighted.
- Click a highlighted square to move.
- After your move, the AI (Black) responds automatically.
- Click "New Game" to reset the board.

## Known Limitations

This is a simplified implementation. The following standard chess rules are **not** implemented:

- Castling (kingside/queenside)
- En passant capture
- Promotion choice (pawns auto-promote to Queen only)

## AI Details

The AI uses a Minimax algorithm with Alpha-Beta pruning, searching 3 plies deep. Position evaluation is based on standard material values (Pawn=100, Knight=320, Bishop=330, Rook=500, Queen=900). No positional heuristics (piece-square tables) are used, so the AI plays tactically sound but not strategically strong.

## File Structure
├── index.html # Page structure

├── style.css # Board and UI styling

└── script.js # Game logic, move validation, AI
