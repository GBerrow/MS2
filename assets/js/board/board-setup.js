// board-setup.js
import { boardState } from './board-state.js';

export function initializeBoard() {
    // Set up initial piece positions
    boardState.pieces = {
        // Black pieces back rank
        "a8": "rook-black",
        "b8": "knight-black",
        // ... etc.
    };
    
    // Render pieces on the DOM
    renderBoard();
}

export function renderBoard() {
    // Clear the board
    document.querySelectorAll('.square').forEach(square => {
        while (square.firstChild) {
            square.removeChild(square.firstChild);
        }
    });
    
    // Place pieces according to boardState
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        const square = document.getElementById(position);
        const img = document.createElement('img');
        img.src = `assets/images/chess-pieces/${piece}.png`;
        img.classList.add('piece');
        img.setAttribute('data-piece', piece);
        square.appendChild(img);
    }
}

export function boardToFEN() {
    // Convert current board state to FEN notation for Stockfish
}
