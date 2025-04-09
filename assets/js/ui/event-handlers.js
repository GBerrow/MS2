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
import {isCastlingValid, executeCastling, isEnPassantValid, executeEnPassant, isPawnPromotionValid, executePromotion} from "../game-logic/special-moves.js";

let selectedSquare = null;
let draggedPiece = null;
let floatingPiece = null;
let dragSource = null;
let offsetX, offsetY;
let pendingDifficultyChange = null;

export function setupEventListeners() {
    // Add click event listeners to all squares
    document.querySelectorAll('.square').forEach(square => {
        square.addEventListener('click', handleSquareClick);
    });
    
    // Setup custom mouse-based dragging
    setupCustomDragListeners();
    
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

    // Set up difficulty buttons
    const easyButton = document.getElementById('easy-mode');
    const normalButton = document.getElementById('normal-mode');
    const hardButton = document.getElementById('hard-mode');
    
    if (easyButton) {
        easyButton.addEventListener('click', () => setDifficulty('easy'));
    }
    
    if (normalButton) {
        normalButton.addEventListener('click', () => setDifficulty('normal'));
    }
    
    if (hardButton) {
        hardButton.addEventListener('click', () => setDifficulty('hard'));
    }
    
    // Event listeners for difficulty change modal
    const confirmDifficultyBtn = document.getElementById('confirmDifficultyChange');
    const cancelDifficultyBtn = document.getElementById('cancelDifficultyChange');
    
    if (confirmDifficultyBtn) {
        confirmDifficultyBtn.addEventListener('click', () => {
            const modal = document.getElementById('difficultyChangeModal');
            if (modal) modal.style.display = 'none';
            
            if (pendingDifficultyChange) {
                applyDifficultyChange(pendingDifficultyChange);
                pendingDifficultyChange = null;
            }
        });
    }
    
    if (cancelDifficultyBtn) {
        cancelDifficultyBtn.addEventListener('click', () => {
            const modal = document.getElementById('difficultyChangeModal');
            if (modal) modal.style.display = 'none';
            
            // Revert button selection
            updateDifficultyButtons(boardState.difficulty);
            pendingDifficultyChange = null;
        });
    }
}

function applyDifficultyChange(level) {
    // Set new difficulty
    boardState.difficulty = level;
    
    // Update UI
    updateDifficultyButtons(level);
    
    // Restart the game
    handleRestartGame();
}

function updateDifficultyButtons(activeLevel) {
    const buttons = ['easy-mode', 'normal-mode', 'hard-mode'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            if (btnId === `${activeLevel}-mode`) {
                btn.classList.add('active-difficulty');
            } else {
                btn.classList.remove('active-difficulty');
            }
        }
    });
}
function setupCustomDragListeners() {
    // Remove any existing listeners to prevent duplicates
    document.querySelectorAll('.piece').forEach(piece => {
        piece.removeEventListener('mousedown', handlePieceMouseDown);
        piece.setAttribute('draggable', 'false'); // Disable HTML5 dragging
    });
    
    // New listeners
    document.querySelectorAll('.piece').forEach(piece => {
        piece.addEventListener('mousedown', handlePieceMouseDown);
        
        // Touch support for mobile
        piece.addEventListener('touchstart', handlePieceTouchStart, { passive: false });
    });
}

function handlePieceMouseDown(e) {
    const piece = e.target;
    const square = piece.closest('.square');
    
    if (!square) return;
    
    const position = square.id;
    const pieceType = piece.getAttribute('data-piece');
    const pieceColor = pieceType ? pieceType.split('-')[1] : null;
    
    // Check if it's the current player's piece AND not AI's turn
    if (pieceColor === boardState.currentPlayer && 
        !(boardState.currentPlayer === 'black' && boardState.aiEnabled)) {
        e.preventDefault(); // Prevent default browser behavior
        
        // Store dragged piece info
        draggedPiece = pieceType;
        dragSource = position;
        
        // Get the original piece dimensions
        const rect = piece.getBoundingClientRect();
        const originalWidth = rect.width;
        const originalHeight = rect.height;
        
        // Create floating piece element that matches the original exactly
        floatingPiece = document.createElement('img');
        floatingPiece.src = piece.src;
        floatingPiece.style.position = 'fixed';
        floatingPiece.style.pointerEvents = 'none';
        floatingPiece.style.width = `${originalWidth}px`;
        floatingPiece.style.height = `${originalHeight}px`;
        floatingPiece.style.zIndex = '1000';
        document.body.appendChild(floatingPiece);
        
        // Position the cursor at the center of the piece
        // We want the center of the piece to be at the cursor position
        offsetX = originalWidth / 2;
        offsetY = originalHeight / 2;
        
        // Position floating piece with cursor at the center
        floatingPiece.style.left = `${e.clientX - offsetX}px`;
        floatingPiece.style.top = `${e.clientY - offsetY}px`;
        
        // Set up mouse move and mouse up handlers
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Hide original piece during drag
        piece.style.opacity = '0.3';
        
        // Show valid moves
        showValidMoves(position);
    }
}

// New touch-based event handler
function handlePieceTouchStart(e) {
    const piece = e.target;
    const square = piece.closest('.square');
    
    if (!square) return;
    
    // Prevent scrolling while dragging
    e.preventDefault();
    
    const position = square.id;
    const pieceType = piece.getAttribute('data-piece');
    const pieceColor = pieceType ? pieceType.split('-')[1] : null;
    
    // Check if it's the current player's piece AND not AI's turn
    if (pieceColor === boardState.currentPlayer && 
        !(boardState.currentPlayer === 'black' && boardState.aiEnabled)) {
        // Store dragged piece info
        draggedPiece = pieceType;
        dragSource = position;
        
        // Get the original piece dimensions
        const rect = piece.getBoundingClientRect();
        const originalWidth = rect.width;
        const originalHeight = rect.height;
        
        // Create floating piece element that matches the original exactly
        floatingPiece = document.createElement('img');
        floatingPiece.src = piece.src;
        floatingPiece.style.position = 'fixed';
        floatingPiece.style.pointerEvents = 'none';
        floatingPiece.style.width = `${originalWidth}px`;
        floatingPiece.style.height = `${originalHeight}px`;
        floatingPiece.style.zIndex = '1000';
        document.body.appendChild(floatingPiece);
        
        // Get touch position
        const touch = e.touches[0];
        
        // Position the touch at the center of the piece
        offsetX = originalWidth / 2;
        offsetY = originalHeight / 2;
        
        // Position floating piece with touch at the center
        floatingPiece.style.left = `${touch.clientX - offsetX}px`;
        floatingPiece.style.top = `${touch.clientY - offsetY}px`;
        
        // Set up touch move and touch end handlers
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        
        // Hide original piece during drag
        piece.style.opacity = '0.3';
        
        // Show valid moves
        showValidMoves(position);
    }
}

function handleMouseMove(e) {
    if (floatingPiece) {
        // Move the floating piece with the cursor at the center
        floatingPiece.style.left = `${e.clientX - offsetX}px`;
        floatingPiece.style.top = `${e.clientY - offsetY}px`;
    }
}

function handleTouchMove(e) {
    if (floatingPiece) {
        // Prevent scrolling
        e.preventDefault();
        
        const touch = e.touches[0];
        
        // Move the floating piece with the touch at the center
        floatingPiece.style.left = `${touch.clientX - offsetX}px`;
        floatingPiece.style.top = `${touch.clientY - offsetY}px`;
    }
}

function handleMouseUp(e) {
    if (!floatingPiece || !draggedPiece || !dragSource) {
        cleanupDrag();
        return;
    }
    
    // Find the square under the mouse
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    const square = elemBelow ? elemBelow.closest('.square') : null;
    
    if (square) {
        const destination = square.id;
        
        // Try to make the move if destination is different from source
        if (dragSource !== destination) {
            tryMove(dragSource, destination);
        }
    }
    
    // Clean up
    cleanupDrag();
}

function handleTouchEnd(e) {
    if (!floatingPiece || !draggedPiece || !dragSource) {
        cleanupDrag();
        return;
    }
    
    // Get the last touch position
    const touch = e.changedTouches[0];
    
    // Find the square under the touch point
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const square = elemBelow ? elemBelow.closest('.square') : null;
    
    if (square) {
        const destination = square.id;
        
        // Try to make the move if destination is different from source
        if (dragSource !== destination) {
            tryMove(dragSource, destination);
        }
    }
    
    // Clean up
    cleanupDrag();
}

function cleanupDrag() {
    // Remove floating piece
    if (floatingPiece && floatingPiece.parentNode) {
        floatingPiece.parentNode.removeChild(floatingPiece);
    }
    
    // Clear highlights
    clearHighlights();
    
    // Restore opacity of all pieces
    document.querySelectorAll('.piece').forEach(piece => {
        piece.style.opacity = '1';
    });
    
    // Reset variables
    draggedPiece = null;
    dragSource = null;
    floatingPiece = null;
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
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
    const specialMoves = {
        castling: [],
        enPassant: [],
        promotion: []
    };
    
    // Loop through all squares on the board
    for (let file = 'a'.charCodeAt(0); file <= 'h'.charCodeAt(0); file++) {
        for (let rank = 1; rank <= 8; rank++) {
            const targetPosition = String.fromCharCode(file) + rank;
            let isValid = false;
            
            // Check special moves first
            if (type === 'king' && isCastlingValid(position, targetPosition)) {
                isValid = true;
                specialMoves.castling.push(targetPosition);
            } else if (type === 'pawn') {
                const enPassantResult = isEnPassantValid(position, targetPosition);
                if (enPassantResult.valid) {
                    isValid = true;
                    specialMoves.enPassant.push(targetPosition);
                } else if (isPawnPromotionValid(position, targetPosition)) {
                    // Check if it's also a valid pawn move
                    if (isValidPawnMove(boardState, position, targetPosition, color)) {
                        isValid = true;
                        specialMoves.promotion.push(targetPosition);
                    }
                } else {
                    isValid = isValidPawnMove(boardState, position, targetPosition, color);
                }
            } else {
                // Check standard moves
                switch (type) {
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
            }
            
            // If valid move and wouldn't put king in check
            if (isValid && !simulateMoveAndCheck(boardState, position, targetPosition, color)) {
                validMoves.push(targetPosition);
            }
        }
    }
    
    // Highlight valid moves on the board
    highlightValidMoves(validMoves, specialMoves);
}

// Function to try to make a move
async function tryMove(from, to) {
    const piece = boardState.pieces[from];
    if (!piece) return false;
    
    const [type, color] = piece.split('-');
    
    // Check if we're trying to capture a king 
    const targetPiece = boardState.pieces[to];
    if (targetPiece && targetPiece.split('-')[0] === 'king') {
        console.log("Attempting to capture king directly - illegal in chess");
        playSound('incorrectMove');
        return false;
    }
    
    // Check special moves BEFORE standard validation
    
    // Check for castling
    if (type === 'king' && isCastlingValid(from, to)) {
        if (executeCastling(from, to)) {
            checkForCheck();
            switchTurn();
            return true;
        }
    }
    
    // Check for en passant
    if (type === 'pawn') {
        const enPassantResult = isEnPassantValid(from, to);
        if (enPassantResult.valid) {
            if (executeEnPassant(from, to, enPassantResult.capturePosition)) {
                checkForCheck();
                switchTurn();
                return true;
            }
        }
    }
    
    // Now check standard movement rules
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
    
    if (!isValid) {
        // Play incorrect move sound for invalid moves
        playSound('incorrectMove');
        return false;
    }
    
    // Check if this move would leave or put the king in check
    if (simulateMoveAndCheck(boardState, from, to, color)) {
        console.log(`Illegal move: ${from} to ${to} - would leave king in check`);
        playSound('incorrectMove');
        return false;
    }
    
    // Check for pawn promotion AFTER verifying the move is valid
    if (type === 'pawn' && isPawnPromotionValid(from, to)) {
        console.log("Pawn promotion is valid, executing...");
        executePromotion(from, to).then(() => {
            console.log("Promotion completed");
            checkForCheck();
            switchTurn();
        });
        return true;
    }
    
    // Execute the regular move
    executeMove(from, to);
    
    // Check for check, checkmate, or stalemate
    const checkModule = await import('../game-logic/check-detection.js');
    checkModule.checkForCheck();

    // Check for stalemate for the opponent
    const opponentColor = color === 'white' ? 'black' : 'white';
    if (!boardState.inCheck[opponentColor] && checkModule.isStalemate(opponentColor)) {
        declareGameOver(`Stalemate! The game is a draw.`);
        return true;
    }
    
    // Check for checkmate
    if (boardState.inCheck[opponentColor] && isCheckmate(opponentColor)) {
        // Handle checkmate
        declareGameOver(`Checkmate! ${color} wins!`);
    }
    
    // Switch turns
    switchTurn();
    
    return true;
}

function handleRestartGame() {
    // Import move-history to reset message state
    import('../game-logic/move-history.js').then(module => {
        // Reset the message state
        module.resetMessageState();
        
        // Reset the move history
        module.resetMoveHistory();
    });
    
    // Reset the game state and board
    window.location.reload(); // Simple refresh 
}

export function reattachDragListeners() {
    setupCustomDragListeners();
}

// Define toggleAI function if it's missing
function toggleAI() {
    boardState.aiEnabled = !boardState.aiEnabled;
    const toggleButton = document.getElementById('toggleAI');
    if (toggleButton) {
        toggleButton.textContent = `Toggle AI: ${boardState.aiEnabled ? 'ON' : 'OFF'}`;
    }
    console.log(`AI is now ${boardState.aiEnabled ? 'enabled' : 'disabled'}`);
}

// Function to handle difficulty setting
function setDifficulty(level) {
    // Check if a game is already in progress
    import('../game-logic/move-history.js').then(module => {
        const moveHistory = module.getMoveHistory();
        
        // If there are moves in the history, the game is in progress
        if (moveHistory && moveHistory.length > 0) {
            // Save the requested difficulty level for later
            pendingDifficultyChange = level;
            
            // Show the custom modal
            const modal = document.getElementById('difficultyChangeModal');
            if (modal) {
                modal.style.display = 'flex';
            } else {
                // Fallback to browser confirm if modal not found
                const confirmChange = confirm("Changing difficulty will restart the game. Are you sure?");
                if (confirmChange) {
                    applyDifficultyChange(level);
                } else {
                    // Revert button selection
                    updateDifficultyButtons(boardState.difficulty);
                }
            }
        } else {
            // No game in progress, just update the difficulty
            boardState.difficulty = level;
            updateDifficultyButtons(level);
            module.updateDifficultyMessage(level);
        }
    });
}
