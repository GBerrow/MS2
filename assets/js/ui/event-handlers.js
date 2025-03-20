import { boardState } from '../board/board-state.js';
import { highlightValidMoves, clearHighlights, updateBoardAfterMove } from '../board/board-ui.js';
import { executeMove } from '../game-logic/move-execution.js';
import { isValidPawnMove } from '../pieces/movement/pawn.js';
import { isValidRookMove } from '../pieces/movement/rook.js';
import { isValidKnightMove } from '../pieces/movement/knight.js';
import { isValidBishopMove } from '../pieces/movement/bishop.js';
import { isValidQueenMove } from '../pieces/movement/queen.js';
import { isValidKingMove } from '../pieces/movement/king.js';
import { isPathClear } from '../pieces/validation.js';
import { switchTurn } from '../game-logic/turn-manager.js';
import { checkForCheck } from '../game-logic/check-detection.js';

let selectedSquare = null;

export function setupEventListeners() {
    // Add click event listeners to all squares
    document.querySelectorAll('.square').forEach(square => {
        square.addEventListener('click', handleSquareClick);
    });
    
    // Setup other event listeners (restart button, etc.)
    const restartButton = document.getElementById('restart');
    if (restartButton) {
        restartButton.addEventListener('click', handleRestartGame);
    }

    // set up event listeners for AI button
    const toggleAIButton = document.getElementById('toggleAI');
    if (toggleAIButton) {
        toggleAIButton.addEventListener('click', toggleAI);
    }
}
// functon for the AI button
function toggleAI() {
    boardState.aiEnabled = !boardState.aiEnabled;
    
    const toggleAIButton = document.getElementById('toggleAI');
    if (toggleAIButton) {
        toggleAIButton.textContent = `Toggle AI: ${boardState.aiEnabled ? 'ON' : 'OFF'}`;
    }
    
    console.log(`AI ${boardState.aiEnabled ? 'enabled' : 'disabled'}`);
    
    // If AI was just enabled and it's black's turn, trigger a move
    if (boardState.aiEnabled && boardState.currentPlayer === 'black') {
        import('./game-logic/turn-manager.js').then(module => {
            module.switchTurn();
        });
    }
}

function handleSquareClick(event) {
    const square = event.currentTarget;
    const position = square.id; // e.g., "e4"
    
    // If no square is selected yet
    if (!selectedSquare) {
        // Check if the square contains a piece of the current player
        const piece = boardState.pieces[position];
        if (piece && piece.split('-')[1] === boardState.currentPlayer) {
            selectedSquare = position;
            showValidMoves(position);
        }
    } else {
        // A square was already selected
        if (position === selectedSquare) {
            // Clicking the same square deselects it
            selectedSquare = null;
            clearHighlights();
        } else {
            // Try to move from selectedSquare to the new position
            tryMove(selectedSquare, position);
            selectedSquare = null;
            clearHighlights();
        }
    }
}

function showValidMoves(position) {
    // Get the valid moves for the selected piece
    const piece = boardState.pieces[position];
    if (!piece) return;
    
    const [type, color] = piece.split('-');
    const validMoves = [];
    
    // Loop through all squares on the board
    for (let file = 'a'.charCodeAt(0); file <= 'h'.charCodeAt(0); file++) {
        for (let rank = 1; rank <= 8; rank++) {
            const targetPosition = String.fromCharCode(file) + rank;
            let isValid = false;
            
            // Check if move is valid based on piece type
            switch (type) {
                case 'pawn':
                    isValid = isValidPawnMove(boardState, position, targetPosition, color);
                    break;
                case 'rook':
                    isValid = isValidRookMove(boardState, position, targetPosition, color) && 
                             isPathClear(boardState, position, targetPosition);
                    break;
                case 'knight':
                    isValid = isValidKnightMove(boardState, position, targetPosition, color);
                    break;
                case 'bishop':
                    isValid = isValidBishopMove(boardState, position, targetPosition, color) && 
                             isPathClear(boardState, position, targetPosition);
                    break;
                case 'queen':
                    isValid = isValidQueenMove(boardState, position, targetPosition, color) && 
                             isPathClear(boardState, position, targetPosition);
                    break;
                case 'king':
                    isValid = isValidKingMove(boardState, position, targetPosition, color);
                    break;
            }
            
            if (isValid) {
                validMoves.push(targetPosition);
            }
        }
    }
    
    // Highlight valid moves on the board
    highlightValidMoves(validMoves);
}

function tryMove(from, to) {
    const piece = boardState.pieces[from];
    if (!piece) return false;
    
    const [type, color] = piece.split('-');
    let isValid = false;
    
    // Validate move based on piece type
    switch (type) {
        case 'pawn':
            isValid = isValidPawnMove(boardState, from, to, color);
            break;
        case 'rook':
            isValid = isValidRookMove(boardState, from, to, color) && 
                      isPathClear(boardState, from, to);
            break;
        case 'knight':
            isValid = isValidKnightMove(boardState, from, to, color);
            break;
        case 'bishop':
            isValid = isValidBishopMove(boardState, from, to, color) && 
                      isPathClear(boardState, from, to);
            break;
        case 'queen':
            isValid = isValidQueenMove(boardState, from, to, color) && 
                      isPathClear(boardState, from, to);
            break;
        case 'king':
            isValid = isValidKingMove(boardState, from, to, color);
            break;
    }
    
    if (isValid) {
        // Execute the move
        executeMove(from, to);
        
        // Check for check after the move
        checkForCheck();
        
        // Switch turns
        switchTurn();
        
        return true;
    }
    
    return false;
}

function handleRestartGame() {
    // Reset the game state and board
    window.location.reload(); // Simple refresh 
}
