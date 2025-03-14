// board-state.js
export const boardState = {
    pieces: {}, // Will store piece positions: {"a1": "rook-white", "e8": "king-black", etc.}
    currentPlayer: 'white',
    capturedPieces: {
        white: [],
        black: []
    },
    inCheck: false,
    lastMove: null
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
