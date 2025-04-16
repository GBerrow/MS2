// game-state.js - Manages game state transitions and unified move processing
import { boardState } from '../board/board-state.js'

/**
 * Unified pipeline for processing state changes after a move is completed
 * Ensures consistent behavior between AI and human moves
 * 
 * @param {boolean} wasInCheck - Whether the player was in check before the move
 * @returns {Promise} - Promise that resolves with check state
 */
export function processMoveCompletion(wasInCheck) {
    // Store current player before any transitions
    const currentPlayer = boardState.currentPlayer;
    
    // Import check detection module
    return import('./check-detection.js').then(checkModule => {
        // Check for check/checkmate/stalemate
        const checkState = checkModule.checkForCheck();
        
        // If we escaped from check
        if (wasInCheck && !boardState.inCheck.white) {
            console.log("White king escaped from check - handling special sequence");
            
            // Set escaped check flag to true for later reference
            boardState.escapedCheck = true;
            
            // IMPORTANT: Don't show post-check message now, instead switch to AI's turn immediately
            
            // Switch turns immediately
            if (boardState.currentPlayer === 'white') {
                return import('./turn-manager.js').then(turnModule => {
                    turnModule.switchTurn(); // This will show "AI is thinking..."
                    return checkState;
                });
            }
        }
        
        return checkState;
    });
}

/**
 * Resets game state to initial values
 */
export function resetGameState() {
    // Reset important state values
    boardState.currentPlayer = 'white'
    boardState.capturedPieces = { white: [], black: [] }
    boardState.inCheck = { white: false, black: false }
    boardState.lastMove = null
    boardState.undoCount = 0
    boardState.messageState = 'default'
    boardState.postCheckMode = false  // <-- Reset post-check mode
    
    // Clear pieces
    for (const key in boardState.pieces) {
        delete boardState.pieces[key]
    }
    
    console.log("Game state reset")
}

/**
 * Updates internal state tracking for check status
 * @param {boolean} whiteInCheck - Whether white is in check
 * @param {boolean} blackInCheck - Whether black is in check
 */
export function updateCheckState(whiteInCheck, blackInCheck) {
    // Store previous check state
    const wasWhiteInCheck = boardState.inCheck.white
    const wasBlackInCheck = boardState.inCheck.black
    
    // Update current check state
    boardState.inCheck.white = whiteInCheck
    boardState.inCheck.black = blackInCheck
    
    // Track check transitions
    boardState.wasInCheck = {
        white: wasWhiteInCheck,
        black: wasBlackInCheck
    }
    
    // Update message state based on check status
    if (whiteInCheck) {
        boardState.messageState = 'check'
    } else if (wasWhiteInCheck && !whiteInCheck) {
        boardState.messageState = 'default'; // Will be set to post-check message
    }
}