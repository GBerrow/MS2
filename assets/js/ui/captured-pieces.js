// captured-pieces.js - Displays captured pieces
import { boardState } from '../board/board-state.js';

/**
 * Updates the captured pieces display
 */
export function updateCapturedPieces() {
    // Get references to the captured pieces containers
    const whiteCapturedContainer = document.getElementById('whiteCaptured');
    const blackCapturedContainer = document.getElementById('blackCaptured');
    
    if (!whiteCapturedContainer || !blackCapturedContainer) {
        console.error("Captured pieces containers not found in DOM");
        return;
    }
    
    // Clear current display
    whiteCapturedContainer.innerHTML = '';
    blackCapturedContainer.innerHTML = '';
    
    // White's captured pieces (black pieces that white captured)
    boardState.capturedPieces.white
        .filter(piece => !piece.startsWith('king-'))
        .forEach(piece => {
            const img = document.createElement('img');
            img.src = `assets/images/chess-pieces/${piece}.png`;
            img.alt = piece;
            img.title = piece.replace('-', ' '); // e.g., "pawn black"
            whiteCapturedContainer.appendChild(img);
        });
    
    // Black's captured pieces (white pieces that black captured)
    boardState.capturedPieces.black
        .filter(piece => !piece.startsWith('king-'))
        .forEach(piece => {
            const img = document.createElement('img');
            img.src = `assets/images/chess-pieces/${piece}.png`;
            img.alt = piece;
            img.title = piece.replace('-', ' '); // e.g., "pawn white"
            blackCapturedContainer.appendChild(img);
        });
}

// Initialize empty captured pieces display
export function initCapturedPiecesDisplay() {
    updateCapturedPieces();
}
