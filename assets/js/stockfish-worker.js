// stockfish-worker.js

// Initialize Stockfish as a Web Worker
let stockfish = null;
let isReady = false;
let onReadyCallback = null;

// Function to initialize Stockfish
export function initStockfish(callback) {
    try {
        // Create a Web Worker for Stockfish
        stockfish = new Worker('assets/js/stockfish-16.1-lite-single.js');
        
        // Set up message handling
        stockfish.onmessage = function(event) {
            const message = event.data;
            
            // Check if Stockfish is ready
            if (message.includes('uciok')) {
                isReady = true;
                stockfish.postMessage('isready');
            }
            
            // Check if Stockfish is ready to accept commands
            if (message.includes('readyok') && onReadyCallback) {
                onReadyCallback();
            }
            
            // Handle best move responses
            if (message.includes('bestmove')) {
                const bestMove = message.split('bestmove ')[1].split(' ')[0];
                if (window.onBestMove) {
                    window.onBestMove(bestMove);
                }
            }
        };
        
        // Initialize UCI mode
        stockfish.postMessage('uci');
        
        // Store callback
        onReadyCallback = callback;
        
    } catch (error) {
        console.error('Error initializing Stockfish:', error);
    }
}

// Function to get best move from current position
export function getBestMove(fen, difficulty = 'normal') {
    if (!stockfish || !isReady) {
        console.error('Stockfish not ready');
        return;
    }
    
    // Set depth based on difficulty
    let depth = 12; // Default (normal)
    
    if (difficulty === 'easy') {
        depth = 5; // Less depth = weaker play
    } else if (difficulty === 'hard') {
        depth = 18; // More depth = stronger play
    }
    
    // Set position
    stockfish.postMessage('position fen ' + fen);
    
    // Find best move
    stockfish.postMessage('go depth ' + depth);
}

// Convert chess board to FEN notation
export function boardToFEN(boardState) {
    let fen = '';
    
    // Add piece positions (8 ranks)
    for (let rank = 8; rank >= 1; rank--) {
        let emptyCount = 0;
        
        for (let file = 0; file < 8; file++) {
            const fileChar = String.fromCharCode(97 + file); // 'a' to 'h'
            const position = fileChar + rank;
            
            if (boardState.pieces[position]) {
                // If we had empty squares before this piece, add that count
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                
                // Add piece to FEN - convert piece name to FEN character
                const [type, color] = boardState.pieces[position].split('-');
                let fenChar = '';
                
                switch (type) {
                    case 'pawn': fenChar = 'p'; break;
                    case 'knight': fenChar = 'n'; break;
                    case 'bishop': fenChar = 'b'; break;
                    case 'rook': fenChar = 'r'; break;
                    case 'queen': fenChar = 'q'; break;
                    case 'king': fenChar = 'k'; break;
                }
                
                // Uppercase for white pieces
                if (color === 'white') {
                    fenChar = fenChar.toUpperCase();
                }
                
                fen += fenChar;
            } else {
                // Empty square
                emptyCount++;
            }
        }
        
        // If we had empty squares at the end of the rank, add that count
        if (emptyCount > 0) {
            fen += emptyCount;
        }
        
        // Add rank separator (except after the last rank)
        if (rank > 1) {
            fen += '/';
        }
    }
    
    // Add active color
    fen += ' ' + (boardState.currentPlayer === 'white' ? 'w' : 'b');
    
    // Add castling availability (placeholder, replace with actual logic)
    fen += ' KQkq';
    
    // Add en passant target square (placeholder)
    fen += ' -';
    
    // Add halfmove clock and fullmove number (placeholders)
    fen += ' 0 1';
    
    return fen;
}
