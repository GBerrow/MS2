import { boardState } from '../board/board-state.js';
import { updateBoardAfterMove, renderBoard } from '../board/board-ui.js';
import { recordMove } from './move-history.js';
import { updateCapturedPieces } from '../ui/captured-pieces.js';
import { playSound } from '../ui/sound-manager.js';

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
        const [capturedType, capturedColor] = capturedPiece.split('-');
        
        // Safety check to prevent king captures
        if (capturedType === 'king') {
            console.error("Attempted to capture a king - this is illegal in chess");
            return false;
        }
        
        // Add to captured pieces list
        boardState.capturedPieces[capturedColor === 'white' ? 'black' : 'white'].push(capturedPiece);
        
        // Update the UI to show captured pieces
        updateCapturedPieces();
        
        // Play capture sound
        playSound('capture');
    } else {
        // Play regular move sound
        playSound('move');
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
