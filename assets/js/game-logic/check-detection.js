// check-detection.js
import { boardState } from '../board/board-state.js';
import { isValidPawnMove } from '../pieces/movement/pawn.js';
import { isValidRookMove } from '../pieces/movement/rook.js';
import { isValidKnightMove } from '../pieces/movement/knight.js';
import { isValidBishopMove } from '../pieces/movement/bishop.js';
import { isValidQueenMove } from '../pieces/movement/queen.js';
import { isValidKingMove } from '../pieces/movement/king.js';
import { isPathClear } from '../pieces/validation.js';

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
    const whiteInCheck = isKingInCheck(whiteKingPosition, 'white');
    const blackInCheck = isKingInCheck(blackKingPosition, 'black');
    
    // Update board state
    boardState.inCheck = {
        white: whiteInCheck,
        black: blackInCheck
    };
    
    // Log check status
    if (whiteInCheck) console.log("White king is in check!");
    if (blackInCheck) console.log("Black king is in check!");
    
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
