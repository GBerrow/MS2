// stockfish-worker.js

// Initialize Stockfish as a Web Worker
let stockfish = null;
let isReady = false;
let onReadyCallback = null;

// Global variables to track multipv analysis
let analyzing = false;
let candidateMoves = [];
let currentDifficulty = 'normal';

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
            
            // If we're in easy mode and analyzing multiple moves
            if (analyzing && currentDifficulty === 'easy') {
                // Extract info from multipv analysis lines
                if (message.includes('info') && message.includes('multipv') && message.includes('score')) {
                    // Correctly extract the entire move from the PV
                    const pvMatch = message.match(/pv\s+([a-h][1-8][a-h][1-8])/);
                    const scoreMatch = message.match(/score\s+cp\s+(-?\d+)/);
                    
                    if (pvMatch && scoreMatch) {
                        const move = pvMatch[1]; // This should now be a full UCI move like "e2e4"
                        const score = parseInt(scoreMatch[1]);
                        candidateMoves.push({ move, score });
                    }
                }
            }
            
            // Handle best move responses
            if (message.includes('bestmove')) {
                const defaultBestMove = message.split('bestmove ')[1].split(' ')[0];
                
                if (analyzing && currentDifficulty === 'easy' && candidateMoves.length > 0) {
                    // Sort moves by score (ascending)
                    candidateMoves.sort((a, b) => a.score - b.score);
                    
                    // Select a bad move (either the worst or one of the worst)
                    const worstMoveIndex = Math.floor(Math.random() * Math.min(3, candidateMoves.length));
                    const selectedMove = candidateMoves[worstMoveIndex].move;
                    
                    // Validate the move format before returning it
                    if (selectedMove && selectedMove.match(/^[a-h][1-8][a-h][1-8]$/)) {
                        console.log(`Easy mode: Selected one of the worst moves: ${selectedMove} (score: ${candidateMoves[worstMoveIndex].score})`);
                        
                        // Reset analysis state
                        analyzing = false;
                        candidateMoves = [];
                        
                        // Return the bad move
                        if (window.onBestMove) {
                            window.onBestMove(selectedMove);
                        }
                    } else {
                        // Fallback to default move if format is invalid
                        console.warn("Selected move had invalid format, using default move instead");
                        if (window.onBestMove) {
                            window.onBestMove(defaultBestMove);
                        }
                    }
                } else {
                    // Normal operation - return Stockfish's choice
                    if (window.onBestMove) {
                        window.onBestMove(defaultBestMove);
                    }
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
    
    // Store the current difficulty
    currentDifficulty = difficulty;
    
    // Set position
    stockfish.postMessage('position fen ' + fen);
    
    if (difficulty === 'easy') {
        // For easy mode, analyze multiple candidate moves
        analyzing = true;
        candidateMoves = [];
        
        // Request multiple candidate moves with multipv
        stockfish.postMessage('setoption name MultiPV value 5');
        stockfish.postMessage('go depth 8 multipv 5');
    } else if (difficulty === 'normal') {
        // Reset multipv for other difficulties
        stockfish.postMessage('setoption name MultiPV value 1');
        stockfish.postMessage('go depth 12');
    } else { // hard
        stockfish.postMessage('setoption name MultiPV value 1');
        stockfish.postMessage('go depth 18');
    }
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
    
    // Validation before returning
    try {
        // Basic validation - ensure all required FEN parts exist
        const fenParts = fen.split(' ');
        if (fenParts.length !== 6) {
            console.error("Invalid FEN format generated");
            // Return a default valid FEN instead
            return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        }
    } catch (e) {
        console.error("Error in FEN generation:", e);
        return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }
    
    return fen;
}
