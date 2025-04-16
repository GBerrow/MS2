// board-state.js
export const boardState = {
    pieces: {}, // Will store piece positions: {"a1": "rook-white", "e8": "king-black", etc.}
    currentPlayer: 'white',
    capturedPieces: {
        white: [],
        black: []
    },
    inCheck: {
        white: false,
        black: false
    },
    lastMove: null,
    aiEnabled: true, // flag to enable/disable AI
    difficulty: 'normal', // Default difficulty level: 'easy', 'normal', or 'hard'
    undoCount: 0,  // Track how many times player has used undo
    aiThinking: false, // Flag to track when AI is processing its move
    messageState: 'default', // Property to track what message should be displayed
                           // Possible values: 'default', 'check', 'ai-thinking'
    messageTimer: null,      // Track any active message timers
    escapedCheck: false,      // Track if player just escaped check
    wasInPostCheck: false,    // Track if we were in post-check before AI thinking
    activeMessage: null,       // Track current active message and its info
    postCheckMode: false     // Track if game is in post-check mode (persists until game restart)
};

// Methods to manipulate state
export function movePiece(from, to) {
    // Logic to update piece positions
}

export function capturePiece(position) {
    // Logic to handle captured pieces
}

// Methods to access state
export function getPieceAt(position) {
    return boardState.pieces[position] || null;
}