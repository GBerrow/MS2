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
        timestamp: Date.now(),
        moveNumber: moveCounter
    });
    
    const [pieceType, color] = move.piece.split('-');
    const algebraicNotation = convertToAlgebraicNotation(move);
    
    // console.log(`Move recorded: ${algebraicNotation}`);
    
    // Update the move history display
    updateMoveHistoryDisplay(algebraicNotation, color, moveCounter);
    
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
 */
function updateMoveHistoryDisplay(notation, color, moveNumber) {
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
        let explanation = getMoveExplanation(notation);
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
        
        // Scroll to the latest move
        const container = moveHistoryBody.closest('.move-history-container');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 50);
        }
    }
}

/**
 * Generates a human-readable explanation of a chess move in algebraic notation
 * @param {string} notation - Move in algebraic notation
 * @returns {string} - Human-readable explanation of the move
 */
function getMoveExplanation(notation) {
    // Handle castling
    if (notation === 'O-O') {
        return 'Kingside castling - The king moves two squares toward the h-file rook, and the rook moves to the square the king crossed';
    }
    if (notation === 'O-O-O') {
        return 'Queenside castling - The king moves two squares toward the a-file rook, and the rook moves to the square the king crossed';
    }

    // Handle check and checkmate
    let suffix = '';
    if (notation.endsWith('+')) {
        suffix = ' - puts opponent in check';
        notation = notation.slice(0, -1);
    } else if (notation.endsWith('#')) {
        suffix = ' - checkmate!';
        notation = notation.slice(0, -1);
    }

    // Determine if it's a capture
    const isCapture = notation.includes('x');
    
    // Regular moves
    if (notation.length >= 2) {
        const dest = notation.slice(-2); // Last two characters are always the destination
        
        // Pawn moves
        if (notation[0] >= 'a' && notation[0] <= 'h') {
            if (isCapture) {
                // Format: exd5 (pawn on e-file captures on d5)
                const sourceFile = notation[0];
                return `Pawn from ${sourceFile}-file captures on ${dest}${suffix}`;
            } else {
                // Simple pawn move (e.g., e4)
                return `Pawn moves to ${dest}${suffix}`;
            }
        }
        
        // Piece moves with piece letter
        const pieceMap = {
            'K': 'King',
            'Q': 'Queen',
            'R': 'Rook',
            'B': 'Bishop',
            'N': 'Knight'
        };
        
        const piece = pieceMap[notation[0]] || 'Piece';
        
        if (isCapture) {
            return `${piece} captures on ${dest}${suffix}`;
        } else {
            return `${piece} moves to ${dest}${suffix}`;
        }
    }
    
    return notation; // Fallback
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
