// Stockfish worker
const stockfish = new Worker('assets/js/stockfish-16.1.js');
 
// Initial chess board setup
const initialBoardSetup = {
    a8: 'rook-black', b8: 'knight-black', c8: 'bishop-black', d8: 'queen-black', e8: 'king-black', f8: 'bishop-black', g8: 'knight-black', h8: 'rook-black',
    a7: 'pawn-black', b7: 'pawn-black', c7: 'pawn-black', d7: 'pawn-black', e7: 'pawn-black', f7: 'pawn-black', g7: 'pawn-black', h7: 'pawn-black',
    a1: 'rook-white', b1: 'knight-white', c1: 'bishop-white', d1: 'queen-white', e1: 'king-white', f1: 'bishop-white', g1: 'knight-white', h1: 'rook-white',
    a2: 'pawn-white', b2: 'pawn-white', c2: 'pawn-white', d2: 'pawn-white', e2: 'pawn-white', f2: 'pawn-white', g2: 'pawn-white', h2: 'pawn-white'
};

let selectedPiece = null;
let currentPlayer = 'white'; // Let the human play white, and Stockfish play black

// Initialize the board with pieces
function initializeBoard() {
    for (const [squareId, piece] of Object.entries(initialBoardSetup)) {
        const square = document.getElementById(squareId);
        const img = document.createElement('img');
        img.src = `assets/images/chess-pieces/${piece}.png`; 
        img.classList.add('piece');
        img.setAttribute('data-piece', piece);
        img.setAttribute('data-color', piece.split('-')[1]); 
        square.appendChild(img);
    }
}
 
// Stockfish communication
function sendToStockfish (command) {
    stockfish.postMessage(command);
}

// Convert the board to FEN format 
function boardToFEN(){
    let fen = '';
    const rows = [];

    // Loop through each row on the board
    for (let rank = 8; rank >= 1; rank--) {
        let row = '';
        let emptyCount = 0;

        // Loop through each file (a-h)
        for (let file of 'abcdefgh') {
            const squareId = file + rank;
            const square = document.getElementById(squareId);
            const piece = square.querySelector('.piece');

            if (!piece) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    row += emptyCount;
                    emptyCount = 0;
                }

                const pieceType = piece.getAttribute('data-piece');
                const color = pieceType.split('-')[1];
                const type = pieceType.split('-')[0];

                const notation = {
                    'pawn': 'p',
                    'rook': 'r',
                    'knight': 'n',
                    'bishop': 'b',
                    'queen': 'q',
                    'king': 'k'
                }[type];

                row += color === 'white' ? notation.toUpperCase() : notation;
            }
        }

        if (emptyCount > 0) {
            row += emptyCount;
        }

        rows.push(row);
    }

    fen = rows.join('/') + ` ${currentPlayer === 'white' ? 'w' : 'b'} - - 0 1`; // Basic FEN output
    return fen;
}



// Handle piece selection
function handlePieceClick(event) {
    const piece = event.target;
    const pieceColor = piece.getAttribute('data-color');

    // Only allow the current player to move their pieces
    if (pieceColor !== currentPlayer) {
        return; // Do nothing if it's not their turn
    }

    const square = piece.parentElement;
    selectedPiece = {
        pieceElement: piece,
        currentSquare: square.id,
        color: pieceColor,
        pieceType: piece.getAttribute('data-piece')
    };

    console.log(`Selected ${selectedPiece.pieceType} on ${selectedPiece.currentSquare}`);
}

// Handle moving a piece
function handleSquareClick(event) {
    if (selectedPiece) {
        const targetSquare = event.target;

        // Check if target square is empty and valid
        if (targetSquare.classList.contains('square') && targetSquare.childElementCount === 0) {
            targetSquare.appendChild(selectedPiece.pieceElement);
            selectedPiece = null; // Deselect after moving

            // Switch player turns
            currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
            console.log(`It's now ${currentPlayer}'s turn`);
        }
    }
}

// AI turn: Get Stockfish to make a move
function getBestMoveFromStockfish() {
    const fen = boardToFEN();
    sendToStockfish(`position fen ${fen}`);
    sendToStockfish('go depth 10'); 
}

// Attach click listeners to pieces
function addPieceClickListeners() {
    const pieces = document.querySelectorAll('.piece');
    pieces.forEach(piece => {
        piece.addEventListener('click', handlePieceClick);
    });
}

// Attach click listeners to squares
function addSquareClickListeners() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.addEventListener('click', handleSquareClick);
    });
}

// Initialize board and listeners on page load
window.onload = () => {
    initializeBoard();
    addPieceClickListeners();
    addSquareClickListeners();
};
