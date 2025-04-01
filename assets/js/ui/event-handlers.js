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
import { simulateMoveAndCheck, checkForCheck, isCheckmate } from '../game-logic/check-detection.js';
import { declareGameOver } from '../game-logic/game-over.js';
import { playSound } from '../ui/sound-manager.js';

let selectedSquare = null;
let draggedPiece = null;
let dragSourceElement = null;

export function setupEventListeners() {
    // Add click event listeners to all squares
    document.querySelectorAll('.square').forEach(square => {
        square.addEventListener('click', handleSquareClick);
        
        // Add drag and drop event listeners
        square.addEventListener('dragover', handleDragOver);
        square.addEventListener('drop', handleDrop);
    });
    
    // Add drag event listeners to pieces
    setupDragListeners();
    
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

// Setup drag listeners for all pieces
function setupDragListeners() {
    // Add dragstart event to pieces
    document.querySelectorAll('.piece').forEach(piece => {
        piece.setAttribute('draggable', 'true');
        piece.addEventListener('dragstart', handleDragStart);
        piece.addEventListener('dragend', handleDragEnd);
    });
}

// Handle the start of dragging a piece
function handleDragStart(e) {
    const piece = e.target;
    const square = piece.closest('.square');
    
    if (!square) return;
    
    const position = square.id;
    const pieceType = piece.getAttribute('data-piece');
    
    // Check if it's the current player's piece
    if (pieceType && pieceType.split('-')[1] === boardState.currentPlayer) {
        // Set data for drag operation
        draggedPiece = pieceType;
        dragSourceElement = square;
        
        // Set data transfer for drop
        e.dataTransfer.setData('text/plain', position);
        e.dataTransfer.effectAllowed = 'move';
        
        // Create a custom drag image that looks like the original piece
        const dragImage = piece.cloneNode(true);
        dragImage.style.width = `${piece.offsetWidth}px`;
        dragImage.style.height = `${piece.offsetHeight}px`;
        
        // Add the drag image to the document (off-screen)
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.opacity = '1';
        document.body.appendChild(dragImage);
        
        // Set the custom drag image with the center at cursor position
        e.dataTransfer.setDragImage(
            dragImage, 
            dragImage.width / 2, 
            dragImage.height / 2
        );
        
        // Remove the temporary element after a short delay
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
        
        // Highlight valid moves
        showValidMoves(position);
        
        // Don't change opacity of original piece during drag
        // This prevents the "ghost" effect
    } else {
        // Prevent dragging if it's not the player's turn
        e.preventDefault();
    }
}

// Handle dragging over a square
function handleDragOver(e) {
    // Allow dropping on this element
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// Handle dropping a piece on a square
function handleDrop(e) {
    // Prevent default action
    e.preventDefault();
    
    // Clear highlights
    clearHighlights();
    
    // Get data
    const fromPosition = e.dataTransfer.getData('text/plain');
    const toPosition = e.currentTarget.id;
    
    // If dropped on the same square, do nothing
    if (fromPosition === toPosition) {
        return;
    }
    
    // Try to make the move
    tryMove(fromPosition, toPosition);
    
    // Reset drag state
    draggedPiece = null;
    dragSourceElement = null;
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

// Function to try to make a move
function tryMove(from, to) {
    const piece = boardState.pieces[from];
    if (!piece) return false;
    
    const [type, color] = piece.split('-');
    
    // First check if the move is mechanically valid
    let isValid = false;
    
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
        // Check if this move would leave or put the king in check
        if (simulateMoveAndCheck(boardState, from, to, color)) {
            console.log(`Illegal move: ${from} to ${to} - would leave king in check`);
            playSound('incorrectMove');
            return false;
        }
        
        // Execute the move
        executeMove(from, to);
        
        // Check for check or checkmate after the move
        checkForCheck();
        
        // Check for checkmate
        const opponentColor = color === 'white' ? 'black' : 'white';
        if (boardState.inCheck[opponentColor] && isCheckmate(opponentColor)) {
            // Handle checkmate
            declareGameOver(`Checkmate! ${color} wins!`);
        }
        
        // Switch turns
        switchTurn();
        
        return true;
    }
    
    // Play incorrect move sound for invalid moves
    playSound('incorrectMove');
    return false;
}

function handleRestartGame() {
    // Reset the game state and board
    window.location.reload(); // Simple refresh 
}

export function reattachDragListeners() {
    setupDragListeners();
}

// Handle the end of dragging
function handleDragEnd(e) {
    // No need to reset opacity since we're not changing it
    
    // Clear highlights if no move was made
    clearHighlights();
}
