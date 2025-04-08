import { boardState } from './board-state.js';

/**
 * Applies the chess board coloring pattern
 * Uses a dynamic color scheme for visual depth
 */
export function applyBoardColors() {
    const squares = document.querySelectorAll(".square");
    squares.forEach((square, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        
        // Determine square color using alternating pattern
        const isLightSquare = row % 2 === col % 2;
        
        // Calculate dynamic HSL color values for visual depth
        const hue = 30; // Brown base color
        const saturation = isLightSquare ? 30 : 40;
        const lightness = isLightSquare ? 80 - (row + col) : 40 - (row + col) / 2;
        
        square.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
}

/**
 * Highlights squares for valid moves
 * @param {Array} validMoves - Array of valid move positions
 * @param {Object} specialMoves - Object containing special move positions by type
 */
export function highlightValidMoves(validMoves, specialMoves = {}) {
    // Clear any existing highlights
    clearHighlights();
    
    // Highlight class to each valid move square
    validMoves.forEach(position => {
        const square = document.getElementById(position);
        if (square) {
            // If square contains opponent's piece, highlight as capture
            if (square.querySelector('.piece')) {
                square.classList.add('highlight-capture');
            } else if (specialMoves.castling?.includes(position)) {
                square.classList.add('highlight-special');
            } else if (specialMoves.enPassant?.includes(position)) {
                square.classList.add('highlight-special');
            } else if (specialMoves.promotion?.includes(position)) {
                square.classList.add('highlight-special');
            } else {
                square.classList.add('highlight-move');
            }
        }
    });
}

/**
 * Clears all highlights from the board
 */
export function clearHighlights() {
    document.querySelectorAll('.highlight-move, .highlight-capture, .highlight-special').forEach(element => {
        element.classList.remove('highlight-move', 'highlight-capture', 'highlight-special');
    });
}

/**
 * Updates the visual state of the board after a move
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 */
export function updateBoardAfterMove(from, to) {
    const fromSquare = document.getElementById(from);
    const toSquare = document.getElementById(to);
    const piece = fromSquare.querySelector('.piece');
    
    if (piece && toSquare) {
        // Remove any existing piece at destination (capture)
        if (toSquare.querySelector('.piece')) {
            toSquare.innerHTML = '';
        }
        
        // Move piece to new square
        toSquare.appendChild(piece);
    }
}

import { reattachDragListeners } from '../ui/event-handlers.js';

/**
 * Renders the current board state to the UI
 */
export function renderBoard() {
    // Clear the board first
    document.querySelectorAll(".square").forEach(square => {
        square.innerHTML = "";
    });
    
    // Place pieces according to boardState
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        const square = document.getElementById(position);
        if (!square) {
            console.error(`Square with ID ${position} not found!`);
            continue;
        }
        
        // Create image element for the piece
        const img = document.createElement("img");
        img.src = `assets/images/chess-pieces/${piece}.png`;
        img.alt = piece;
        img.classList.add("piece");
        img.setAttribute("data-piece", piece);
        img.setAttribute("data-color", piece.split("-")[1]);
        
        // Add the piece to the square
        square.appendChild(img);
    }
    
    // Reattach drag listeners to the new pieces
    reattachDragListeners();
}
