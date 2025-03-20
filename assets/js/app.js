// app.js
import { initializeBoard } from './board/board-setup.js';
import { setupEventListeners } from './ui/event-handlers.js';
import { initializeTurnManager } from './game-logic/turn-manager.js';
import { boardState } from './board/board-state.js';

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set AI enabled by default
    boardState.aiEnabled = true;
    
    // Initialize the board
    initializeBoard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize turn manager (which sets up Stockfish)
    initializeTurnManager();
    
    console.log("Chess game initialized");
});

