// move-history.js - Handles move history tracking, display, and undo functionality
import { boardState } from '../board/board-state.js';
import { renderBoard } from '../board/board-ui.js';
import { updateCapturedPieces } from '../ui/captured-pieces.js';
import { playSound } from '../ui/sound-manager.js';

// Array to store move history
const moveHistory = [];
let moveCounter = 1;

/**
 * Initializes the move history and sets up event listeners
 */
export function initMoveHistory() {
    // Set up the undo button listener
    const undoButton = document.getElementById('undoButton');
    if (undoButton) {
        undoButton.addEventListener('click', () => {
            undoLastMove(boardState, renderBoard, updateCapturedPieces);
        });
    }
    
    // Clear the move history table
    clearMoveHistoryDisplay();
}

/**
 * Clears the move history display
 */
function clearMoveHistoryDisplay() {
    const moveHistoryBody = document.getElementById('moveHistoryBody');
    if (moveHistoryBody) {
        moveHistoryBody.innerHTML = '';
    }
    moveCounter = 1;
}

/**
 * Converts a move to algebraic notation
 * @param {Object} move - Move details (from, to, piece, capturedPiece)
 * @returns {string} - Move in algebraic notation
 */
function convertToAlgebraicNotation(move) {
    const { from, to, piece, capturedPiece } = move;
    const [pieceType, color] = piece.split('-');
    
    // Special case for castling
    if (pieceType === 'king') {
        const fromFile = from.charCodeAt(0);
        const toFile = to.charCodeAt(0);
        const fileDistance = Math.abs(fromFile - toFile);
        
        if (fileDistance === 2) {
            // Kingside castling
            if (toFile > fromFile) {
                return 'O-O';
            } 
            // Queenside castling
            else {
                return 'O-O-O';
            }
        }
    }
    
    // Start with piece letter (except for pawns)
    let notation = '';
    if (pieceType !== 'pawn') {
        // Correct piece notation abbreviations
        switch(pieceType) {
            case 'king': notation += 'K'; break;
            case 'queen': notation += 'Q'; break;
            case 'rook': notation += 'R'; break;
            case 'bishop': notation += 'B'; break;
            case 'knight': notation += 'N'; break; // Fixed! Knights use N, not K
            default: break;
        }
    }
    
    // Add capture symbol if applicable
    if (capturedPiece) {
        // For pawns, add the file when capturing
        if (pieceType === 'pawn') {
            notation += from[0];
        }
        notation += 'x';
    }
    
    // Add the destination square
    notation += to;
    
    // Check if the move results in check or checkmate
    if (boardState.inCheck && boardState.inCheck[color === 'white' ? 'black' : 'white']) {
        // We'd need to check if it's checkmate, but for now just add + for check
        notation += '+';
    }
    
    return notation;
}

/**
 * Records a move in the move history and updates the UI
 * @param {Object} move - Move details (from, to, piece, capturedPiece)
 */
export function recordMove(move) {
    moveHistory.push({
        from: move.from,
        to: move.to,
        piece: move.piece,
        capturedPiece: move.capturedPiece,
        specialMove: move.specialMove,
        capturePosition: move.capturePosition,
        timestamp: Date.now(),
        moveNumber: moveCounter
    });
    
    const [pieceType, color] = move.piece.split('-');
    
    // Generate appropriate algebraic notation
    let algebraicNotation;
    if (move.specialMove === 'castling-kingside') {
        algebraicNotation = 'O-O';
    } else if (move.specialMove === 'castling-queenside') {
        algebraicNotation = 'O-O-O';
    } else if (move.specialMove === 'en-passant') {
        // For en passant, use format like "exd6 e.p."
        algebraicNotation = `${move.from[0]}x${move.to} e.p.`;
    } else {
        algebraicNotation = convertToAlgebraicNotation(move);
    }
    
    // Update the move history display
    updateMoveHistoryDisplay(algebraicNotation, color, moveCounter, move);
    
    // Increment the move counter after a full move (both white and black)
    if (color === 'black') {
        moveCounter++;
    }
}

/**
 * Updates the move history display in the UI with enhanced clarity
 * @param {string} notation - Move in algebraic notation
 * @param {string} color - Player color ('white' or 'black')
 * @param {number} moveNumber - The current move number
 * @param {Object} move - The complete move object
 */
function updateMoveHistoryDisplay(notation, color, moveNumber, move) {
    const moveHistoryBody = document.getElementById('moveHistoryBody');
    if (!moveHistoryBody) return;
    
    // Get or create a row for this move number
    let row = document.getElementById(`move-${moveNumber}`);
    if (!row) {
        row = document.createElement('tr');
        row.id = `move-${moveNumber}`;
        
        const moveNumberCell = document.createElement('td');
        moveNumberCell.textContent = moveNumber;
        row.appendChild(moveNumberCell);
        
        // Add cells for white and black moves
        const whiteCell = document.createElement('td');
        whiteCell.className = 'white-move';
        row.appendChild(whiteCell);
        
        const blackCell = document.createElement('td');
        blackCell.className = 'black-move';
        row.appendChild(blackCell);
        
        moveHistoryBody.appendChild(row);
    }
    
    // Add the move notation to the appropriate cell
    const cell = row.querySelector(color === 'white' ? '.white-move' : '.black-move');
    if (cell) {
        const notationSpan = document.createElement('span');
        notationSpan.className = 'move-notation';
        
        // Format notation for better clarity
        let formattedNotation = notation;
        
        // Add descriptive title/tooltip with explanation
        let explanation = getMoveExplanation(notation, move);
        notationSpan.title = explanation;
        
        // Style captures differently (bold red 'x')
        if (notation.includes('x')) {
            const parts = notation.split('x');
            formattedNotation = `${parts[0]}<span class="capture-x">×</span>${parts[1]}`;
            notationSpan.innerHTML = formattedNotation;
        } else {
            notationSpan.textContent = notation;
        }
        
        // Clear existing content and add the new notation
        cell.innerHTML = '';
        cell.appendChild(notationSpan);
        
        // Highlight all cells in the current row
        row.querySelectorAll('td').forEach(td => {
            td.classList.add('highlight-recent');
        });
        
        // Remove highlights from previous moves
        setTimeout(() => {
            document.querySelectorAll('#moveHistoryTable .highlight-recent').forEach(el => {
                el.classList.remove('highlight-recent');
            });
        }, 1500);
    }
}

/**
 * Generates a human-readable explanation of a chess move in algebraic notation
 * @param {string} notation - Move in algebraic notation
 * @param {Object} move - The complete move object with from/to information
 * @returns {string} - Human-readable explanation of the move
 */
function getMoveExplanation(notation, move) {
    // If we don't have the complete move object, use basic explanation
    if (!move) {
        // Handle castling
        if (notation === 'O-O') {
            return 'King castled kingside';
        }
        if (notation === 'O-O-O') {
            return 'King castled queenside';
        }
        
        // Default format for other notations without move data
        return notation;
    }
    
    const { from, to, piece, specialMove } = move;
    const [pieceType, color] = piece.split('-');
    
    // Handle special moves
    if (specialMove === 'castling-kingside') {
        return `${color.charAt(0).toUpperCase() + color.slice(1)} castled kingside`;
    }
    if (specialMove === 'castling-queenside') {
        return `${color.charAt(0).toUpperCase() + color.slice(1)} castled queenside`;
    }
    if (specialMove === 'en-passant') {
        return `${color.charAt(0).toUpperCase() + color.slice(1)} captured pawn en passant from ${from} to ${to}`;
    }
    
    // Determine if it's a capture
    const isCapture = move.capturedPiece ? true : false;
    
    // Create piece name with first letter capitalized
    const pieceName = pieceType.charAt(0).toUpperCase() + pieceType.slice(1);
    
    // Basic move explanation
    if (isCapture) {
        return `${pieceName} moved from ${from} to ${to} capturing ${move.capturedPiece.split('-')[0]}`;
    } else {
        return `${pieceName} moved from ${from} to ${to}`;
    }
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
 * @param {Function} updateCapturedPieces - Function to update captured pieces display
 * @returns {Boolean} True if a move was undone, false if no moves to undo
 */
export function undoLastMove(boardState, renderBoard, updateCapturedPieces) {
    if (moveHistory.length === 0) {
        return false;
    }
    
    // Get the last move
    const lastMove = moveHistory.pop();
    
    // Restore the piece to its original position
    boardState.pieces[lastMove.from] = lastMove.piece;
    
    // Handle special moves
    if (lastMove.specialMove) {
        // Handle castling
        if (lastMove.specialMove.includes('castling')) {
            // Delete king from destination
            delete boardState.pieces[lastMove.to];
            
            // Properly restore rook
            if (lastMove.rookFrom && lastMove.rookTo && lastMove.rookPiece) {
                // Return rook to original position
                boardState.pieces[lastMove.rookFrom] = lastMove.rookPiece;
                // Remove rook from castled position
                delete boardState.pieces[lastMove.rookTo];
            } else {
                // Fallback for legacy moves without rook data
                const [_, color] = lastMove.piece.split('-');
                const rank = color === 'white' ? '1' : '8';
                const isKingside = lastMove.specialMove === 'castling-kingside';
                
                // Original and new rook positions
                const oldRookFile = isKingside ? 'h' : 'a';
                const newRookFile = isKingside ? 'f' : 'd';
                
                // Restore rook
                boardState.pieces[oldRookFile + rank] = `rook-${color}`;
                delete boardState.pieces[newRookFile + rank];
            }
        }
        // Handle en passant separately
        else if (lastMove.specialMove === 'en-passant' && lastMove.capturePosition) {
            // In en passant, the captured piece is not at the destination square
            // Restore captured pawn
            if (lastMove.capturedPiece) {
                boardState.pieces[lastMove.capturePosition] = lastMove.capturedPiece;
                
                // Remove from captured pieces list
                const capturedColor = lastMove.capturedPiece.split('-')[1];
                const capturedByColor = capturedColor === 'white' ? 'black' : 'white';
                
                const index = boardState.capturedPieces[capturedByColor].indexOf(lastMove.capturedPiece);
                if (index !== -1) {
                    boardState.capturedPieces[capturedByColor].splice(index, 1);
                }
            }
            
            // Delete the pawn from destination
            delete boardState.pieces[lastMove.to];
        }
    }
    // Handle regular captures
    else if (lastMove.capturedPiece) {
        boardState.pieces[lastMove.to] = lastMove.capturedPiece;
        
        // Remove from captured pieces list
        const capturedColor = lastMove.capturedPiece.split('-')[1];
        const capturedByColor = capturedColor === 'white' ? 'black' : 'white';
        
        const index = boardState.capturedPieces[capturedByColor].indexOf(lastMove.capturedPiece);
        if (index !== -1) {
            boardState.capturedPieces[capturedByColor].splice(index, 1);
        }
    } 
    // If no capture, just remove the piece from destination
    else {
        delete boardState.pieces[lastMove.to];
    }
    
    // Switch back the current player
    boardState.currentPlayer = boardState.currentPlayer === 'white' ? 'black' : 'white';
    
    // Update the UI
    if (renderBoard) {
        renderBoard();
    }
    
    // Update captured pieces display
    if (updateCapturedPieces) {
        updateCapturedPieces();
    }
    
    // Update move history display
    const [_, color] = lastMove.piece.split('-');
    
    // If we're undoing a black move, keep the same move number
    // If we're undoing a white move, decrement the move counter
    if (color === 'white' && lastMove.moveNumber > 1) {
        moveCounter = lastMove.moveNumber - 1;
    } else {
        moveCounter = lastMove.moveNumber;
    }
    
    // Remove the last move from the display
    updateMoveHistoryDisplayAfterUndo(color, lastMove.moveNumber);
    
    // If we've undone all moves, clear the entire display
    if (moveHistory.length === 0) {
        clearMoveHistoryDisplay();
    }
    
    // Play the undo sound
    playSound('move');
    
    return true;
}

/**
 * Updates the move history display after an undo operation
 * @param {string} color - Player color of the move that was undone
 * @param {number} moveNumber - The move number that was undone
 */
function updateMoveHistoryDisplayAfterUndo(color, moveNumber) {
    const moveHistoryBody = document.getElementById('moveHistoryBody');
    if (!moveHistoryBody) return;
    
    // Find the row for this move number
    const row = document.getElementById(`move-${moveNumber}`);
    if (!row) return;
    
    // Clear the cell corresponding to the color
    const cell = row.querySelector(color === 'white' ? '.white-move' : '.black-move');
    if (cell) {
        cell.innerHTML = '';
    }
    
    // If we're removing a white move and this is the last row, remove the whole row
    if (color === 'white' && moveNumber === moveCounter) {
        moveHistoryBody.removeChild(row);
    }
    
    // Highlight the row to indicate the undo action
    row.querySelectorAll('td').forEach(td => {
        td.classList.add('highlight-recent');
    });
    
    // Remove highlights after a short delay
    setTimeout(() => {
        document.querySelectorAll('#moveHistoryTable .highlight-recent').forEach(el => {
            el.classList.remove('highlight-recent');
        });
    }, 1500);
}

/**
 * Resets the move history
 */
export function resetMoveHistory() {
    // Clear the move history array
    moveHistory.length = 0;
    moveCounter = 1;
    
    // Clear the display
    clearMoveHistoryDisplay();
    
    console.log("Move history reset");
}

// Variable to track if we're showing a post-check message
let showingPostCheckMessage = false;

// UpdateDifficultyMessage function for initial messages
export function updateDifficultyMessage(difficulty) {
    const moveHistoryContainer = document.querySelector('.move-history-container');
    if (!moveHistoryContainer) return;
    
    // If we're showing a post-check message, don't overwrite it unless explicitly reset
    if (showingPostCheckMessage) return;
    
    // Look for any existing message
    let existingMessage = document.getElementById('game-status-message');
    if (!existingMessage) {
        // Create new message element if none exists
        existingMessage = document.createElement('div');
        existingMessage.id = 'game-status-message';
        existingMessage.className = 'game-status-message';
        
        // Insert before the table
        const table = moveHistoryContainer.querySelector('#moveHistoryTable');
        if (table) {
            moveHistoryContainer.insertBefore(existingMessage, table);
        } else {
            moveHistoryContainer.appendChild(existingMessage);
        }
    }
    
    // Clear any existing classes except the base class
    existingMessage.className = 'game-status-message';
    
    // Set INITIAL message based on difficulty
    switch(difficulty) {
        case 'easy':
            existingMessage.textContent = "Nice and easy way to start off your day!";
            existingMessage.className += ' easy-message';
            break;
        case 'normal':
            existingMessage.textContent = "A balanced challenge awaits you!";
            existingMessage.className += ' normal-message';
            break;
        case 'hard':
            existingMessage.textContent = "Watch out, you're on hard difficulty now!";
            existingMessage.className += ' hard-message';
            break;
        default:
            existingMessage.textContent = "Select a difficulty level to begin!";
    }
}

// Update check message function
export function updateCheckMessage(isInCheck, attackingPiece = null) {
    const moveHistoryContainer = document.querySelector('.move-history-container');
    if (!moveHistoryContainer) return;
    
    // Look for the game status message element
    let messageElement = document.getElementById('game-status-message');
    if (!messageElement) {
        // Create if it doesn't exist
        messageElement = document.createElement('div');
        messageElement.id = 'game-status-message';
        
        // Insert before the table
        const table = moveHistoryContainer.querySelector('#moveHistoryTable');
        if (table) {
            moveHistoryContainer.insertBefore(messageElement, table);
        } else {
            moveHistoryContainer.appendChild(messageElement);
        }
    }
    
    if (isInCheck) {
        // When in check, show check message and mark that we aren't showing post-check
        showingPostCheckMessage = false;
        
        // Clear any existing classes and add check message class
        messageElement.className = 'game-status-message check-message';
        
        // Set the check message with attacking piece info
        const pieceType = attackingPiece ? attackingPiece.split('-')[0] : 'piece';
        messageElement.textContent = `Your king is in check by ${pieceType}!`;
    } else {
        // If check was just resolved, show post-check message
        showPostCheckMessage();
    }
}

// New function to show post-check encouragement messages
export function showPostCheckMessage() {
    const moveHistoryContainer = document.querySelector('.move-history-container');
    if (!moveHistoryContainer) return;
    
    let messageElement = document.getElementById('game-status-message');
    if (!messageElement) return;
    
    // Set flag to indicate we're showing a post-check message
    showingPostCheckMessage = true;
    
    // Clear any existing classes
    messageElement.className = 'game-status-message';
    
    // Show different POST-CHECK messages based on difficulty
    switch(boardState.difficulty) {
        case 'easy':
            messageElement.textContent = "This should be a breeze...right? 😅";
            messageElement.className += ' easy-message';
            break;
        case 'normal':
            messageElement.textContent = "This could get interesting 👀";
            messageElement.className += ' normal-message';
            break;
        case 'hard':
            messageElement.textContent = "Had enough yet? 😈";
            messageElement.className += ' hard-message';
            break;
        default:
            // Fallback to initial message if difficulty not recognized
            updateDifficultyMessage(boardState.difficulty);
            showingPostCheckMessage = false;
    }
}

// Reset the post-check state on game restart
export function resetMessageState() {
    showingPostCheckMessage = false;
}
