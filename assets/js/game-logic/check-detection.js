// check-detection.js
import { boardState } from '../board/board-state.js';
import { isValidPawnMove } from '../pieces/movement/pawn.js';
import { isValidRookMove } from '../pieces/movement/rook.js';
import { isValidKnightMove } from '../pieces/movement/knight.js';
import { isValidBishopMove } from '../pieces/movement/bishop.js';
import { isValidQueenMove } from '../pieces/movement/queen.js';
import { isValidKingMove } from '../pieces/movement/king.js';
import { isPathClear } from '../pieces/validation.js';
import { playSound } from '../ui/sound-manager.js';

export function checkForCheck() {
    // Find both kings
    let whiteKingPosition = null;
    let blackKingPosition = null;
    
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        if (piece === 'king-white') {
            whiteKingPosition = position;
        } else if (piece === 'king-black') {
            blackKingPosition = position;
        }
    }
    
    // Check if either king is in check
    const whiteInCheck = isKingInCheck(whiteKingPosition, 'white', boardState);
    const blackInCheck = isKingInCheck(blackKingPosition, 'black', boardState);
    
    // Update board state
    boardState.inCheck = {
        white: whiteInCheck,
        black: blackInCheck
    };
    
    // Log check status and check for checkmate or stalemate
    if (whiteInCheck) {
        console.log("White king is in check!");
        if (isCheckmate('white')) {
            console.log("White is in checkmate!");
            // Play checkmate sound
            playSound('checkmate');
            
            // Import and call declareGameOver after a short delay to ensure UI is updated
            setTimeout(() => {
                import('./game-over.js').then(module => {
                    module.declareGameOver("Checkmate! Black wins!");
                });
            }, 500);
        } else {
            // Just in check, not checkmate
            playSound('check');
        }
    } else if (isStalemate('white')) {
        console.log("White is in stalemate!");
        playSound('checkmate'); // Or create a specific stalemate sound
        
        setTimeout(() => {
            import('./game-over.js').then(module => {
                module.declareGameOver("Stalemate! The game is a draw.");
            });
        }, 500);
    }
    
    if (blackInCheck) {
        console.log("Black king is in check!");
        if (isCheckmate('black')) {
            console.log("Black is in checkmate!");
            // Play checkmate sound
            playSound('checkmate');
            
            // Import and call declareGameOver after a short delay to ensure UI is updated
            setTimeout(() => {
                import('./game-over.js').then(module => {
                    module.declareGameOver("Checkmate! White wins!");
                });
            }, 500);
        } else {
            // Just in check, not checkmate
            playSound('check');
        }
    } else if (isStalemate('black')) {
        console.log("Black is in stalemate!");
        playSound('checkmate'); // Or create a specific stalemate sound
        
        setTimeout(() => {
            import('./game-over.js').then(module => {
                module.declareGameOver("Stalemate! The game is a draw.");
            });
        }, 500);
    }
    
    return boardState.inCheck;
}

function isKingInCheck(kingPosition, kingColor) {
    if (!kingPosition) return false;
    
    // Check if any opponent piece can capture the king
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        const [pieceType, pieceColor] = piece.split('-');
        
        // Skip pieces of same color as king
        if (pieceColor === kingColor) continue;
        
        let canAttackKing = false;
        
        // Check if this piece can attack the king
        switch (pieceType) {
            case 'pawn':
                canAttackKing = isValidPawnMove(boardState, position, kingPosition, pieceColor);
                break;
            case 'rook':
                canAttackKing = isValidRookMove(boardState, position, kingPosition, pieceColor) && 
                               isPathClear(boardState, position, kingPosition);
                break;
            case 'knight':
                canAttackKing = isValidKnightMove(boardState, position, kingPosition, pieceColor);
                break;
            case 'bishop':
                canAttackKing = isValidBishopMove(boardState, position, kingPosition, pieceColor) && 
                               isPathClear(boardState, position, kingPosition);
                break;
            case 'queen':
                canAttackKing = isValidQueenMove(boardState, position, kingPosition, pieceColor) && 
                               isPathClear(boardState, position, kingPosition);
                break;
            case 'king':
                canAttackKing = isValidKingMove(boardState, position, kingPosition, pieceColor);
                break;
        }
        
        if (canAttackKing) {
            return true; // King is in check
        }
    }
    
    return false; // King is not in check
}

// Simulate a move and see if it would leave the king in check
export function simulateMoveAndCheck(boardState, from, to, playerColor) {
    // Create a deep copy of the board state
    const tempBoardState = {
        pieces: { ...boardState.pieces },
        currentPlayer: boardState.currentPlayer,
        inCheck: { ...boardState.inCheck }
    };
    
    // Check if the target square has an opponent's king
    const targetPiece = tempBoardState.pieces[to];
    if (targetPiece) {
        const [targetType, targetColor] = targetPiece.split('-');
        if (targetType === 'king') {
            // Can't capture a king
            return true; // Illegal move
        }
    }
    
    // Execute the move on the temporary board
    const piece = tempBoardState.pieces[from];
    delete tempBoardState.pieces[from];
    tempBoardState.pieces[to] = piece;
    
    // Find the king position - either the piece that just moved (if it's a king)
    // or the king's current position
    let kingPosition = null;
    
    if (piece.split('-')[0] === 'king') {
        // If we're moving the king, use the destination square
        kingPosition = to;
    } else {
        // Otherwise find the king's position
        for (const [position, pieceInfo] of Object.entries(tempBoardState.pieces)) {
            if (pieceInfo === `king-${playerColor}`) {
                kingPosition = position;
                break;
            }
        }
    }
    
    if (!kingPosition) {
        console.error("King not found in simulateMove");
        return true; // Assume check as a safety measure
    }
    
    // Check if any opponent piece could attack the king after this move
    return isKingInCheckAfterMove(kingPosition, playerColor, tempBoardState);
}

// Helper function to determine if king would be in check after a move
function isKingInCheckAfterMove(kingPosition, kingColor, tempBoardState) {
    const opponentColor = kingColor === 'white' ? 'black' : 'white';
    
    // Check all opponent pieces
    for (const [position, piece] of Object.entries(tempBoardState.pieces)) {
        const [pieceType, pieceColor] = piece.split('-');
        
        if (pieceColor !== opponentColor) continue;
        
        let canAttackKing = false;
        
        switch (pieceType) {
            case 'pawn': 
                // Special case for pawn - they attack diagonally
                const pawnFile = position.charCodeAt(0);
                const pawnRank = parseInt(position[1]);
                const kingFile = kingPosition.charCodeAt(0);
                const kingRank = parseInt(kingPosition[1]);
                
                // Pawn attack logic depends on color
                if (pieceColor === 'white') {
                    // White pawns attack diagonally up
                    canAttackKing = Math.abs(pawnFile - kingFile) === 1 && 
                                    (kingRank - pawnRank) === 1;
                } else {
                    // Black pawns attack diagonally down
                    canAttackKing = Math.abs(pawnFile - kingFile) === 1 && 
                                    (pawnRank - kingRank) === 1;
                }
                break;
                
            case 'knight':
                canAttackKing = isValidKnightMove(tempBoardState, position, kingPosition, pieceColor);
                break;
                
            case 'bishop':
                canAttackKing = isValidBishopMove(tempBoardState, position, kingPosition, pieceColor) && 
                               isPathClear(tempBoardState, position, kingPosition);
                break;
                
            case 'rook':
                canAttackKing = isValidRookMove(tempBoardState, position, kingPosition, pieceColor) && 
                               isPathClear(tempBoardState, position, kingPosition);
                break;
                
            case 'queen':
                canAttackKing = isValidQueenMove(tempBoardState, position, kingPosition, pieceColor) && 
                               isPathClear(tempBoardState, position, kingPosition);
                break;
                
            case 'king':
                // Kings can attack adjacent squares
                const fileDistance = Math.abs(position.charCodeAt(0) - kingPosition.charCodeAt(0));
                const rankDistance = Math.abs(parseInt(position[1]) - parseInt(kingPosition[1]));
                canAttackKing = fileDistance <= 1 && rankDistance <= 1 && (fileDistance + rankDistance > 0);
                break;
        }
        
        if (canAttackKing) {
            return true; // King would be in check
        }
    }
    
    return false; // King would not be in check
}

// Check if a player is in checkmate
export function isCheckmate(playerColor) {
    // If not in check, can't be checkmate
    if (!boardState.inCheck[playerColor]) return false;
    
    // Find the king
    let kingPosition = null;
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        if (piece === `king-${playerColor}`) {
            kingPosition = position;
            break;
        }
    }
    
    if (!kingPosition) return false; // Should never happen in a valid game
    
    // 1. Check if king can move to a safe square
    const kingMoves = getKingPossibleMoves(kingPosition, playerColor);
    if (kingMoves.length > 0) return false;
    
    // 2. Check if any piece can block the check or capture the attacking piece
    const canBlock = canAnyPieceBlockOrCaptureAttacker(playerColor);
    if (canBlock) return false;
    
    // If we've reached this point, it's checkmate
    return true;
}

// Get all possible moves for the king
function getKingPossibleMoves(kingPosition, playerColor) {
    const possibleMoves = [];
    const [file, rank] = [kingPosition.charCodeAt(0), parseInt(kingPosition[1])];
    
    // Check all 8 directions around the king
    for (let fileOffset = -1; fileOffset <= 1; fileOffset++) {
        for (let rankOffset = -1; rankOffset <= 1; rankOffset++) {
            // Skip the current position
            if (fileOffset === 0 && rankOffset === 0) continue;
            
            const newFile = file + fileOffset;
            const newRank = rank + rankOffset;
            
            // Check if the new position is on the board
            if (newFile < 97 || newFile > 104 || newRank < 1 || newRank > 8) continue;
            
            const newPosition = String.fromCharCode(newFile) + newRank;
            
            // Check if the new position has our own piece
            const pieceAtNew = boardState.pieces[newPosition];
            if (pieceAtNew && pieceAtNew.split('-')[1] === playerColor) continue;
            
            // Check if moving to this square would still leave the king in check
            if (!simulateMoveAndCheck(boardState, kingPosition, newPosition, playerColor)) {
                possibleMoves.push(newPosition);
            }
        }
    }
    
    return possibleMoves;
}

// Check if any piece can block or capture the attacking piece
function canAnyPieceBlockOrCaptureAttacker(playerColor) {
    // Find the attacking pieces
    const attackers = findAttackingPieces(playerColor);
    if (attackers.length === 0) return false;
    
    // If there's more than one attacker, can't block both (must move king)
    if (attackers.length > 1) return false;
    
    const attacker = attackers[0];
    
    // Get the king position
    let kingPosition = null;
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        if (piece === `king-${playerColor}`) {
            kingPosition = position;
            break;
        }
    }
    
    // Check if any of our pieces can capture the attacker
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        if (piece.split('-')[1] !== playerColor) continue;
        
        const [type, color] = piece.split('-');
        
        let canMove = false;
        switch (type) {
            case 'pawn':
                canMove = isValidPawnMove(boardState, position, attacker.position, color);
                break;
            case 'knight':
                canMove = isValidKnightMove(boardState, position, attacker.position, color);
                break;
            case 'bishop':
                canMove = isValidBishopMove(boardState, position, attacker.position, color) &&
                          isPathClear(boardState, position, attacker.position);
                break;
            case 'rook':
                canMove = isValidRookMove(boardState, position, attacker.position, color) &&
                          isPathClear(boardState, position, attacker.position);
                break;
            case 'queen':
                canMove = isValidQueenMove(boardState, position, attacker.position, color) &&
                          isPathClear(boardState, position, attacker.position);
                break;
        }
        
        if (canMove && !simulateMoveAndCheck(boardState, position, attacker.position, playerColor)) {
            return true;
        }
    }
    
    // If the attacker is a knight or pawn, we can't block (must capture or move king)
    const [attackerType, _] = boardState.pieces[attacker.position].split('-');
    if (attackerType === 'knight' || attackerType === 'pawn') return false;
    
    // Check if the attack path can be blocked
    const blockSquares = getBlockingSquares(kingPosition, attacker.position);
    
    // Check if any of our pieces can move to a blocking square
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        if (piece.split('-')[1] !== playerColor) continue;
        
        const [type, color] = piece.split('-');
        
        for (const blockSquare of blockSquares) {
            let canMove = false;
            switch (type) {
                case 'pawn':
                    canMove = isValidPawnMove(boardState, position, blockSquare, color);
                    break;
                case 'knight':
                    canMove = isValidKnightMove(boardState, position, blockSquare, color);
                    break;
                case 'bishop':
                    canMove = isValidBishopMove(boardState, position, blockSquare, color) &&
                              isPathClear(boardState, position, blockSquare);
                    break;
                case 'rook':
                    canMove = isValidRookMove(boardState, position, blockSquare, color) &&
                              isPathClear(boardState, position, blockSquare);
                    break;
                case 'queen':
                    canMove = isValidQueenMove(boardState, position, blockSquare, color) &&
                              isPathClear(boardState, position, blockSquare);
                    break;
            }
            
            if (canMove && !simulateMoveAndCheck(boardState, position, blockSquare, playerColor)) {
                return true;
            }
        }
    }
    
    return false;
}

// Find all pieces that are attacking the king
function findAttackingPieces(playerColor) {
    const attackers = [];
    
    // Find the king position
    let kingPosition = null;
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        if (piece === `king-${playerColor}`) {
            kingPosition = position;
            break;
        }
    }
    
    if (!kingPosition) return []; // Should never happen in a valid game
    
    // Check all opponent pieces
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        const [type, color] = piece.split('-');
        
        // Only check opponent pieces
        if (color === playerColor) continue;
        
        let isAttacking = false;
        
        switch (type) {
            case 'pawn':
                isAttacking = isValidPawnMove(boardState, position, kingPosition, color);
                break;
            case 'knight':
                isAttacking = isValidKnightMove(boardState, position, kingPosition, color);
                break;
            case 'bishop':
                isAttacking = isValidBishopMove(boardState, position, kingPosition, color) &&
                              isPathClear(boardState, position, kingPosition);
                break;
            case 'rook':
                isAttacking = isValidRookMove(boardState, position, kingPosition, color) &&
                              isPathClear(boardState, position, kingPosition);
                break;
            case 'queen':
                isAttacking = isValidQueenMove(boardState, position, kingPosition, color) &&
                              isPathClear(boardState, position, kingPosition);
                break;
            case 'king':
                isAttacking = isValidKingMove(boardState, position, kingPosition, color);
                break;
        }
        
        if (isAttacking) {
            attackers.push({
                position,
                piece
            });
        }
    }
    
    return attackers;
}

// Get squares that can block an attack
function getBlockingSquares(kingPosition, attackerPosition) {
    const blockingSquares = [];
    
    const [kingFile, kingRank] = [kingPosition.charCodeAt(0), parseInt(kingPosition[1])];
    const [attackerFile, attackerRank] = [attackerPosition.charCodeAt(0), parseInt(attackerPosition[1])];
    
    // Calculate direction
    const fileStep = Math.sign(attackerFile - kingFile);
    const rankStep = Math.sign(attackerRank - kingRank);
    
    // Check if the attack is on a line (straight or diagonal)
    const isDiagonal = Math.abs(attackerFile - kingFile) === Math.abs(attackerRank - kingRank);
    const isStraight = attackerFile === kingFile || attackerRank === kingRank;
    
    if (!isDiagonal && !isStraight) return []; // Knight attacks can't be blocked
    
    // Find all squares between king and attacker
    let currentFile = kingFile + fileStep;
    let currentRank = kingRank + rankStep;
    
    while (currentFile !== attackerFile || currentRank !== attackerRank) {
        blockingSquares.push(String.fromCharCode(currentFile) + currentRank);
        currentFile += fileStep;
        currentRank += rankStep;
    }
    
    return blockingSquares;
}

// Check if the game is in a stalemate state
export function isStalemate(playerColor) {
    // If the player is in check, it's not stalemate
    if (boardState.inCheck[playerColor]) return false;
    
    // Check if player has ANY legal moves at all
    return !hasLegalMoves(playerColor);
}

// Helper function to check if a player has any legal moves
function hasLegalMoves(playerColor) {
    // Check each piece of the player's color
    for (const [position, piece] of Object.entries(boardState.pieces)) {
        const [pieceType, color] = piece.split('-');
        
        // Skip opponent's pieces
        if (color !== playerColor) continue;
        
        // For each piece, check if it has any valid moves
        const validMoves = getPossibleMoves(position, pieceType, color);
        
        // Check if any of these moves would not leave king in check
        for (const move of validMoves) {
            if (!simulateMoveAndCheck(boardState, position, move, color)) {
                return true; // Found at least one legal move
            }
        }
    }
    
    return false; // No legal moves found
}

// Helper function to get possible moves based on piece type
function getPossibleMoves(position, pieceType, color) {
    const allSquares = [];
    for (let file = 'a'.charCodeAt(0); file <= 'h'.charCodeAt(0); file++) {
        for (let rank = 1; rank <= 8; rank++) {
            allSquares.push(String.fromCharCode(file) + rank);
        }
    }
    
    // Filter squares based on piece movement rules
    return allSquares.filter(targetPos => {
        let isValid = false;
        
        switch (pieceType) {
            case 'pawn':
                isValid = isValidPawnMove(boardState, position, targetPos, color);
                break;
            case 'rook':
                isValid = isValidRookMove(boardState, position, targetPos, color) && 
                         isPathClear(boardState, position, targetPos);
                break;
            case 'knight':
                isValid = isValidKnightMove(boardState, position, targetPos, color);
                break;
            case 'bishop':
                isValid = isValidBishopMove(boardState, position, targetPos, color) && 
                         isPathClear(boardState, position, targetPos);
                break;
            case 'queen':
                isValid = isValidQueenMove(boardState, position, targetPos, color) && 
                         isPathClear(boardState, position, targetPos);
                break;
            case 'king':
                isValid = isValidKingMove(boardState, position, targetPos, color);
                break;
        }
        
        return isValid;
    });
}
