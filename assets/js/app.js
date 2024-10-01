const initialBoardSetup = {
    a8: 'rook-black', b8: 'knight-black', c8: 'bishop-black', d8: 'queen-black', e8: 'king-black', f8: 'bishop-black', g8: 'knight-black', h8: 'rook-black',
    a7: 'pawn-black', b7: 'pawn-black', c7: 'pawn-black', d7: 'pawn-black', e7: 'pawn-black', f7: 'pawn-black', g7: 'pawn-black', h7: 'pawn-black',
    a1: 'rook-white', b1: 'knight-white', c1: 'bishop-white', d1: 'queen-white', e1: 'king-white', f1: 'bishop-white', g1: 'knight-white', h1: 'rook-white',
    a2: 'pawn-white', b2: 'pawn-white', c2: 'pawn-white', d2: 'pawn-white', e2: 'pawn-white', f2: 'pawn-white', g2: 'pawn-white', h2: 'pawn-white'
};

let selectedPiece = null;
let currentPlayer = 'white';

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
 

