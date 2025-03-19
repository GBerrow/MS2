import { boardState } from '../board/board-state.js';

export function switchTurn() {
    // Switch the current player
    boardState.currentPlayer = boardState.currentPlayer === 'white' ? 'black' : 'white';
    
    // If it's AI's turn, trigger AI move
    if (boardState.currentPlayer === 'black' && boardState.aiEnabled) {
        // This would be implemented with your Stockfish integration
        triggerAiMove();
    }
    
    // Update UI to show whose turn it is
    updateTurnIndicator();
}

function updateTurnIndicator() {
    // You could add a visual indicator in your UI showing whose turn it is
    console.log(`Current turn: ${boardState.currentPlayer}`);
}

function triggerAiMove() {
    // This function would be implemented with your Stockfish integration
    console.log("AI is thinking...");
    // Implementation for AI would go here
}
