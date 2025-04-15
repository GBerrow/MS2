// app.js
import { initializeBoard } from './board/board-setup.js';
import { setupEventListeners } from './ui/event-handlers.js';
import { initializeTurnManager } from './game-logic/turn-manager.js';
import { boardState } from './board/board-state.js';
import { initSoundManager } from './ui/sound-manager.js';
import { initMoveHistory, updateDifficultyMessage } from './game-logic/move-history.js';

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set AI enabled by default
    boardState.aiEnabled = true;
    boardState.difficulty = 'normal'; // Default difficulty
    boardState.undoCount = 0; // Initialize undo count
    
    // Initialize the board
    initializeBoard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize turn manager (which sets up Stockfish)
    initializeTurnManager();
    
    // Initialize sound manager
    initSoundManager();

    // Initialize move history
    initMoveHistory();
    
    // Initialize difficulty message
    updateDifficultyMessage('normal');
    
    // Set normal button as active by default
    const normalButton = document.getElementById('normal-mode');
    if (normalButton) {
        normalButton.classList.add('active-difficulty');
    }
    
    // Initialize the check detection system
    import('./game-logic/check-detection.js').then(module => {
        console.log("Check detection system initialized");
    });
    
    // Initialize game state handling
    import('./game-logic/game-state.js').then(module => {
        console.log("Game state handler initialized");
    });
    
    console.log("Chess game initialized");
});
