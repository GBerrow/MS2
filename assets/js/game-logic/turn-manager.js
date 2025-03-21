import { boardState } from '../board/board-state.js';
import { initStockfish, getBestMove, boardToFEN } from '../stockfish-worker.js';
import { executeMove } from './move-execution.js';

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
    console.log(`Current turn: ${boardState.currentPlayer}`);
    // Add visual indicator in UI if desired
}

function triggerAiMove() {
    if (!stockfishInitialized) {
        console.log("Stockfish not yet initialized. Waiting...");
        return;
    }
    
    console.log("AI is thinking...");
    
    // Convert current board state to FEN notation
    const fen = boardToFEN(boardState);
    console.log("Current position FEN:", fen);
    
    // Get best move from Stockfish
    getBestMove(fen);
}

function handleAIMove(move) {
    console.log("AI chosen move:", move);
    
    // Convert UCI move format (e.g., "e2e4") to our format
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    
    // Execute the move
    executeMove(from, to);
    
    // Check for check
    import('./check-detection.js').then(module => {
        module.checkForCheck();
    });
    
    // Switch turn back to player
    boardState.currentPlayer = 'white';
    updateTurnIndicator();
}