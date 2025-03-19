// move-history.js - Handles move history tracking and undo functionality

// Array to store move history
const moveHistory = [];

/**
 * Records a move in the move history
 * @param {Object} move - Move details (from, to, piece, capturedPiece)
 */
export function recordMove(move) {
    moveHistory.push({
        from: move.from,
        to: move.to,
        piece: move.piece,
        capturedPiece: move.capturedPiece,
        timestamp: Date.now()
    });
    
    console.log(`Move recorded: ${move.piece} from ${move.from} to ${move.to}`);
}

/**
 * Gets the full move history
 * @returns {Array} Array of move objects
 */
export function getMoveHistory() {
    return [...moveHistory]; // Return a copy to prevent direct modification
}

/**
 * Undoes the last move
 * @param {Object} boardState - Current board state
 * @param {Function} renderBoard - Function to update the UI
 * @returns {Boolean} True if a move was undone, false if no moves to undo
 */
export function undoLastMove(boardState, renderBoard) {
    if (moveHistory.length === 0) {
        console.log("No moves to undo");
        return false;
    }
    
    // Get the last move
    const lastMove = moveHistory.pop();
    
    // Restore the piece to its original position
    boardState.pieces[lastMove.from] = lastMove.piece;
    
    // If there was a capture, restore the captured piece
    if (lastMove.capturedPiece) {
        boardState.pieces[lastMove.to] = lastMove.capturedPiece;
        
        // Remove from captured pieces list
        const capturedColor = lastMove.capturedPiece.split('-')[1];
        const capturedByColor = capturedColor === 'white' ? 'black' : 'white';
        
        const index = boardState.capturedPieces[capturedByColor].indexOf(lastMove.capturedPiece);
        if (index !== -1) {
            boardState.capturedPieces[capturedByColor].splice(index, 1);
        }
    } else {
        // If no capture, just remove the piece from destination
        delete boardState.pieces[lastMove.to];
    }
    
    // Switch back the current player
    boardState.currentPlayer = boardState.currentPlayer === 'white' ? 'black' : 'white';
    
    // Update the UI
    if (renderBoard) {
        renderBoard();
    }
    
    console.log(`Move undone: ${lastMove.piece} from ${lastMove.from} to ${lastMove.to}`);
    return true;
}
