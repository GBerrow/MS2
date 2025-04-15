import { boardState } from '../board/board-state.js';
import { initStockfish, getBestMove, boardToFEN } from '../stockfish-worker.js';
import { executeMove } from './move-execution.js';
import { updateUndoButtonState } from '../game-logic/move-history.js';

let stockfishInitialized = false;

export function initializeTurnManager() {
    // Initialize Stockfish
    initStockfish(() => {
        stockfishInitialized = true;
        console.log('Stockfish initialized and ready');
        
        // If it's AI's turn, make a move
        if (boardState.currentPlayer === 'black' && boardState.aiEnabled) {
            triggerAiMove();
        }
    });
    
    // Set up callback for when Stockfish returns a move
    window.onBestMove = handleAIMove;
}

export function switchTurn() {
    // Switch the current player
    boardState.currentPlayer = boardState.currentPlayer === 'white' ? 'black' : 'white';
    
    // If it's AI's turn, trigger AI move
    if (boardState.currentPlayer === 'black' && boardState.aiEnabled) {
        triggerAiMove();
    }
    
    // Update UI to show whose turn it is
    updateTurnIndicator();
}

function updateTurnIndicator() {
    // Display thinking message when AI's turn begins
    if (boardState.currentPlayer === 'black' && boardState.aiEnabled) {
        showAiThinkingMessage(true);
    } else {
        showAiThinkingMessage(false);
    }
}

function triggerAiMove() {
    if (!stockfishInitialized) {
        return;
    }
    
    // Set AI thinking flag to true
    boardState.aiThinking = true;
    boardState.messageState = 'ai-thinking'; // Set message state
    
    // Update UI to disable buttons and show thinking message
    showAiThinkingMessage(true);
    updateUndoButtonState(); // This will disable the undo button
    
    // Convert current board state to FEN notation
    const fen = boardToFEN(boardState);
    
    // Get best move from Stockfish with current difficulty level
    getBestMove(fen, boardState.difficulty);
}

function handleAIMove(move) {
    try {
        // Validate the move format first
        if (!move || typeof move !== 'string' || move.length < 4) {
            console.error("Invalid move received from Stockfish:", move);
            // Handle gracefully - maybe generate a safe move
            const safeMove = generateSafeMove(); // Implement this function
            finishAiMove();
            return;
        }
        
        // Convert UCI move format (e.g., "e2e4") to our format
        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        
        // Add delay based on difficulty level
        const delayTimes = {
            'easy': 2000,     // 2 seconds
            'normal': 1000,   // 1 second
            'hard': 300       // 0.3 seconds
        };
        
        const delay = delayTimes[boardState.difficulty] || 1000;
        
        setTimeout(() => {
            // Check if this is a castling move
            const piece = boardState.pieces[from];
            if (piece && piece === 'king-black') {
                const fromFile = from.charCodeAt(0);
                const toFile = to.charCodeAt(0);
                
                // If king moves two squares horizontally, it's castling
                if (Math.abs(fromFile - toFile) === 2) {
                    import('./special-moves.js').then(module => {
                        if (module.isCastlingValid(from, to)) {
                            module.executeCastling(from, to);
                        } else {
                            // Fallback to regular move if castling validation fails
                            executeMove(from, to);
                        }
                        
                        // Check for check
                        import('./check-detection.js').then(checkModule => {
                            checkModule.checkForCheck();
                        });
                        
                        // AI thinking is complete
                        finishAiMove();
                    });
                    return;
                }
            }
            
            // Execute regular move if not castling
            executeMove(from, to);
            
            // Store check state before processing
            const wasInCheck = boardState.inCheck.white;

            // Use unified move processor
            import('./game-state.js').then(module => {
                module.processMoveCompletion(wasInCheck).then(() => {
                    // AI thinking is complete after move processing
                    finishAiMove();
                });
            });
        }, delay);
    } catch (error) {
        console.error("Error processing AI move:", error);
        finishAiMove();
    }
}

// Helper function to complete AI's turn
function finishAiMove() {
    // Set AI thinking flag to false
    boardState.aiThinking = false;
    
    // Switch turn back to player
    boardState.currentPlayer = 'white';
    
    // Update UI to enable buttons and remove thinking message
    boardState.messageState = 'default'; // Reset message state
    showAiThinkingMessage(false);
    updateUndoButtonState(); // This will re-enable the undo button if allowed
    
    // State transitions and messaging already handled by processMoveCompletion
    boardState.messageState = 'default';
    
    updateTurnIndicator();
}

// Function to show/hide AI thinking message
function showAiThinkingMessage(isThinking) {
    import('./move-history.js').then(module => {
        if (isThinking) {
            // Don't show AI thinking message if we're in post-check state
            if (boardState.messageState === 'post-check') {
                console.log("Not showing AI thinking message due to post-check state");
                return;
            }
            
            // Show thinking message
            boardState.messageState = 'ai-thinking';
            module.displayGameMessage("AI is thinking...", "ai-thinking-message");
        } else {
            // Only clear if specifically in AI thinking state
            if (boardState.messageState === 'ai-thinking') {
                boardState.messageState = 'default';
                module.updateDifficultyMessage(boardState.difficulty);
            }
        }
    });
}