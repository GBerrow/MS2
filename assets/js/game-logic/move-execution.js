import { boardState } from '../board/board-state.js';
import { updateBoardAfterMove, renderBoard } from '../board/board-ui.js';
import { recordMove } from './move-history.js';
import { updateCapturedPieces } from '../ui/captured-pieces.js';

export function executeMove(from, to) {
    // Get the piece that's moving
    const piece = boardState.pieces[from];
    if (!piece) return false;
    
    // Check if it's a capture move
    const capturedPiece = boardState.pieces[to];
    
    // Record move before executing it
    recordMove({
        from,
        to,
        piece,
        capturedPiece
    });
    
    // Handle capture
    if (capturedPiece) {
        const capturedColor = capturedPiece.split('-')[1];
        // Add to captured pieces list
        boardState.capturedPieces[capturedColor === 'white' ? 'black' : 'white'].push(capturedPiece);
        
        // Update the UI to show captured pieces
        updateCapturedPieces();
    }
    
    // Update board state
    delete boardState.pieces[from];
    boardState.pieces[to] = piece;
    
    // Update the last move
    boardState.lastMove = { from, to, piece };
    
    // Update the UI
    updateBoardAfterMove(from, to);
    
    return true;
}
