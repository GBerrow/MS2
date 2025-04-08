// special-moves.js - Handles chess special moves: castling, en passant, and pawn promotion
import { boardState } from '../board/board-state.js';
import { isPathClear } from '../pieces/validation.js';
import { executeMove } from './move-execution.js';
import { renderBoard } from '../board/board-ui.js';
import { simulateMoveAndCheck } from './check-detection.js';

/**
 * Checks if castling is valid for the given move
 * @param {Object} boardState - Current board state
 * @param {string} from - Starting position (king's position)
 * @param {string} to - Ending position (king's destination)
 * @returns {boolean} - True if castling is valid
 */
export function isCastlingValid(from, to) {
    const [pieceType, color] = boardState.pieces[from].split('-');
    
    // Must be the king
    if (pieceType !== 'king') return false;
    
    // Check if the move is a castling move (king moves 2 squares horizontally)
    const fromFile = from.charCodeAt(0);
    const toFile = to.charCodeAt(0);
    const fileDistance = Math.abs(fromFile - toFile);
    
    // King must move 2 squares horizontally
    if (fileDistance !== 2) return false;
    
    // King must be on its original square
    if ((color === 'white' && from !== 'e1') || (color === 'black' && from !== 'e8')) return false;
    
    // Determine if it's kingside or queenside castling
    const isKingsideCastling = toFile > fromFile;
    const rookFile = isKingsideCastling ? 'h' : 'a';
    const rookRank = color === 'white' ? '1' : '8';
    const rookPosition = rookFile + rookRank;
    
    // Check if there's a rook in position
    const rook = boardState.pieces[rookPosition];
    if (!rook || rook !== `rook-${color}`) return false;
    
    // Check if there are pieces between the king and rook
    if (!isPathClear(boardState, from, rookPosition)) return false;
    
    // Check if the king is in check
    if (boardState.inCheck[color]) return false;
    
    // Check if the king would move through check
    const kingPath = isKingsideCastling ? 
        [`${String.fromCharCode(fromFile + 1)}${from[1]}`, to] :
        [`${String.fromCharCode(fromFile - 1)}${from[1]}`, to];
    
    for (const square of kingPath) {
        if (simulateMoveAndCheck(boardState, from, square, color)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Executes the castling move
 * @param {string} from - King's starting position
 * @param {string} to - King's destination
 * @returns {boolean} - True if castling was executed
 */
export function executeCastling(from, to) {
    const king = boardState.pieces[from];
    const [_, color] = king.split('-');
    
    // Determine if it's kingside or queenside castling
    const fromFile = from.charCodeAt(0);
    const toFile = to.charCodeAt(0);
    const isKingsideCastling = toFile > fromFile;
    
    const rookFile = isKingsideCastling ? 'h' : 'a';
    const rookRank = color === 'white' ? '1' : '8';
    const rookPosition = rookFile + rookRank;
    
    // Calculate new rook position
    const newRookFile = isKingsideCastling ? 'f' : 'd';
    const newRookPosition = newRookFile + rookRank;
    
    // Save rook information
    const rook = boardState.pieces[rookPosition];
    
    // Move the king
    delete boardState.pieces[from];
    boardState.pieces[to] = king;
    
    // Move the rook
    delete boardState.pieces[rookPosition];
    boardState.pieces[newRookPosition] = rook;
    
    // Record the castling move with COMPLETE rook information
    import('./move-history.js').then(module => {
        module.recordMove({
            from,
            to,
            piece: king,
            capturedPiece: null,
            specialMove: isKingsideCastling ? 'castling-kingside' : 'castling-queenside',
            rookFrom: rookPosition,
            rookTo: newRookPosition,
            rookPiece: rook
        });
    });
    
    // Update the UI
    renderBoard();
    
    return true;
}

/**
 * Checks if en passant is valid for the given move
 * @param {string} from - Pawn's starting position
 * @param {string} to - Pawn's destination
 * @returns {boolean} - True if en passant is valid, with capture position
 */
export function isEnPassantValid(from, to) {
    const [pieceType, color] = boardState.pieces[from].split('-');
    
    // Must be a pawn
    if (pieceType !== 'pawn') return { valid: false };
    
    const fromFile = from.charCodeAt(0);
    const fromRank = parseInt(from[1]);
    const toFile = to.charCodeAt(0);
    const toRank = parseInt(to[1]);
    
    // Must be a diagonal move
    const fileDiff = Math.abs(fromFile - toFile);
    if (fileDiff !== 1) return { valid: false };
    
    // Must move in the correct direction based on color
    const rankDiff = color === 'white' ? (toRank - fromRank) : (fromRank - toRank);
    if (rankDiff !== 1) return { valid: false };
    
    // Target square must be empty
    if (boardState.pieces[to]) return { valid: false };
    
    // Check if there's an opponent pawn that just moved 2 squares
    const lastMove = boardState.lastMove;
    if (!lastMove) return { valid: false };
    
    const [lastPieceType, lastColor] = lastMove.piece.split('-');
    
    // Last move must be by an opponent's pawn
    if (lastPieceType !== 'pawn' || lastColor === color) return { valid: false };
    
    // Last move must be a 2-square pawn move
    const lastFromFile = lastMove.from.charCodeAt(0);
    const lastFromRank = parseInt(lastMove.from[1]);
    const lastToFile = lastMove.to.charCodeAt(0);
    const lastToRank = parseInt(lastMove.to[1]);
    
    const lastRankDiff = Math.abs(lastToRank - lastFromRank);
    if (lastRankDiff !== 2) return { valid: false };
    
    // Last move must be to the square adjacent to our destination
    const opponentPawnPosition = String.fromCharCode(toFile) + fromRank;
    if (lastMove.to !== opponentPawnPosition) return { valid: false };
    
    return { 
        valid: true, 
        capturePosition: opponentPawnPosition 
    };
}

/**
 * Executes the en passant capture
 * @param {string} from - Pawn's starting position
 * @param {string} to - Pawn's destination
 * @param {string} capturePosition - Position of the pawn to be captured
 * @returns {boolean} - True if en passant was executed
 */
export function executeEnPassant(from, to, capturePosition) {
    const pawn = boardState.pieces[from];
    const [_, color] = pawn.split('-');
    const capturedPawn = boardState.pieces[capturePosition];
    
    if (!capturedPawn) {
        console.error(`No pawn found at ${capturePosition} for en passant capture`);
        return false;
    }
    
    console.log(`Executing en passant: ${color} pawn captures ${capturedPawn} at ${capturePosition}`);
    
    // Add directly to captured pieces array
    boardState.capturedPieces[color].push(capturedPawn);
    
    // Remove the captured pawn
    delete boardState.pieces[capturePosition];
    
    // Move the capturing pawn
    delete boardState.pieces[from];
    boardState.pieces[to] = pawn;
    
    // Record the move in move history
    import('./move-history.js').then(module => {
        module.recordMove({
            from,
            to,
            piece: pawn,
            capturedPiece: capturedPawn,
            specialMove: 'en-passant',
            capturePosition
        });
    });
    
    // Force update the captured pieces display USING DYNAMIC IMPORT
    import('../ui/captured-pieces.js').then(module => {
        console.log("Updating captured pieces after en passant");
        module.updateCapturedPieces();
    });
    
    // Update board display USING DYNAMIC IMPORT
    import('../board/board-ui.js').then(module => {
        module.renderBoard();
    });
    
    // Play capture sound
    import('../ui/sound-manager.js').then(module => {
        module.playSound('capture');
    });
    
    return true;
}

/**
 * Checks if pawn promotion is valid for the given move
 * @param {string} from - Pawn's starting position
 * @param {string} to - Pawn's destination
 * @returns {boolean} - True if promotion is valid
 */
export function isPawnPromotionValid(from, to) {
    const piece = boardState.pieces[from];
    if (!piece) return false;
    
    const [pieceType, playerColor] = piece.split('-');
    
    // Must be a pawn
    if (pieceType !== 'pawn') return false;
    
    const toRank = parseInt(to[1]);
    
    // Must reach the opposite end of the board
    return (toRank === 8 && playerColor === 'white') || (toRank === 1 && playerColor === 'black');
}

/**
 * Handles pawn promotion selection
 * @param {string} selectedPiece - Type of piece selected for promotion ('queen', 'rook', etc.)
 * @param {Function} resolve - Promise resolve function
 * @param {string} toSquare - Destination square
 * @param {string} playerColor - Color of the player
 */
export function handlePieceSelection(selectedPiece, resolve, toSquare, playerColor) {
    const modal = document.getElementById('promotionModal');
    modal.style.display = 'none'; // Hide modal
    
    // Update board state with promoted piece
    boardState.pieces[toSquare] = `${selectedPiece}-${playerColor}`;
    
    // Render updated board
    renderBoard();
    
    // Resolve promise
    resolve(true);
}

/**
 * Executes pawn promotion
 * @param {string} from - Pawn's starting position
 * @param {string} to - Pawn's destination
 * @returns {Promise} - Resolves when promotion is complete
 */
export function executePromotion(from, to) {
    const piece = boardState.pieces[from];
    const [_, playerColor] = piece.split('-');
    
    // Move the pawn first (and handle any captures)
    executeMove(from, to);
    
    // Now show promotion dialog
    return new Promise((resolve, _reject) => {
        const modal = document.getElementById('promotionModal');
        if (!modal) {
            console.error("Promotion modal not found!");
            // Default to queen if modal is missing
            boardState.pieces[to] = `queen-${playerColor}`;
            renderBoard();
            resolve(true);
            return;
        }
        
        // Make the modal visible
        modal.style.display = 'flex';
        
        // Update promotion piece images to show the correct color
        const pieceOptions = modal.querySelectorAll('.piece-option');
        
        pieceOptions.forEach(option => {
            const pieceType = option.id;
            const img = option.querySelector('.promotion-piece');
            if (img) {
                img.src = `assets/images/chess-pieces/${pieceType}-${playerColor}.png`;
            }
            
            // Set up click handler
            option.onclick = () => {
                modal.style.display = 'none';
                boardState.pieces[to] = `${pieceType}-${playerColor}`;
                renderBoard();
                resolve(true);
            };
        });
    });
}
