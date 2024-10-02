// Stockfish worker using the JavaScript file
const stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");
                              
if (!stockfish) {
    console.error("Stockfish worker could not be initialized. Check the file path.");
} else {
    console.log("Stockfish worker initialized successfully.");
}

stockfish.onmessage = function (event) {
    console.log("Stockfish says: ", event.data); // Log everything Stockfish says

    const bestMoveMatch = event.data.match(/bestmove\s([a-h][1-8][a-h][1-8])/);
    if (bestMoveMatch) {
        const bestMove = bestMoveMatch[1];
        console.log(`Stockfish's best move: ${bestMove}`);
        makeAIMove(bestMove); // Apply Stockfish's move to the board
    }
};

function sendToStockfish(command) {
    stockfish.postMessage(command);
}

// Initial chess board setup
const initialBoardSetup = {
    a8: "rook-black",
    b8: "knight-black",
    c8: "bishop-black",
    d8: "queen-black",
    e8: "king-black",
    f8: "bishop-black",
    g8: "knight-black",
    h8: "rook-black",
    a7: "pawn-black",
    b7: "pawn-black",
    c7: "pawn-black",
    d7: "pawn-black",
    e7: "pawn-black",
    f7: "pawn-black",
    g7: "pawn-black",
    h7: "pawn-black",
    a1: "rook-white",
    b1: "knight-white",
    c1: "bishop-white",
    d1: "queen-white",
    e1: "king-white",
    f1: "bishop-white",
    g1: "knight-white",
    h1: "rook-white",
    a2: "pawn-white",
    b2: "pawn-white",
    c2: "pawn-white",
    d2: "pawn-white",
    e2: "pawn-white",
    f2: "pawn-white",
    g2: "pawn-white",
    h2: "pawn-white",
};

let selectedPiece = null;
let currentPlayer = "white"; // Let the human play white, and Stockfish play black

// Initialize the board with pieces
function initializeBoard() {
    console.log("Initializing board..."); // Check if this line appears in the console
    for (const [squareId, piece] of Object.entries(initialBoardSetup)) {
        const square = document.getElementById(squareId);
        const img = document.createElement("img");
        img.src = `assets/images/chess-pieces/${piece}.png`;
        img.classList.add("piece");
        img.setAttribute("data-piece", piece);
        img.setAttribute("data-color", piece.split("-")[1]);
        square.appendChild(img);
    }
}

// Convert the board to FEN format
function boardToFEN() {
    let fen = "";
    const rows = [];

    // Loop through each row on the board
    for (let rank = 8; rank >= 1; rank--) {
        let row = "";
        let emptyCount = 0;

        // Loop through each file (a-h)
        for (let file of "abcdefgh") {
            const squareId = file + rank;
            const square = document.getElementById(squareId);
            const piece = square.querySelector(".piece");

            if (!piece) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    row += emptyCount;
                    emptyCount = 0;
                }

                const pieceType = piece.getAttribute("data-piece");
                const color = pieceType.split("-")[1];
                const type = pieceType.split("-")[0];

                const notation = {
                    pawn: "p",
                    rook: "r",
                    knight: "n",
                    bishop: "b",
                    queen: "q",
                    king: "k",
                }[type];

                row += color === "white" ? notation.toUpperCase() : notation;
            }
        }

        if (emptyCount > 0) {
            row += emptyCount;
        }

        rows.push(row);
    }

    fen = rows.join("/") + ` ${currentPlayer === "white" ? "w" : "b"} - - 0 1`; // Basic FEN output
    return fen;
}

// Handle piece selection
function handlePieceClick(event) {
    // Ignore clicks if it's not the player's turn
    if (currentPlayer !== "white") {
        return; // It's Stockfish's turn, do nothing
    }

    const piece = event.target;
    const pieceColor = piece.getAttribute("data-color");

    // Only allow the current player to move their pieces (white pieces)
    if (pieceColor !== currentPlayer) {
        return; // Do nothing if it's not the current player's turn
    }

    const square = piece.parentElement;
    selectedPiece = {
        pieceElement: piece,
        currentSquare: square.id,
        color: pieceColor,
        pieceType: piece.getAttribute("data-piece"),
    };

    console.log(`Selected ${selectedPiece.pieceType} on ${selectedPiece.currentSquare}`);
}

// Handle moving a piece
function handleSquareClick(event) {
    if (selectedPiece) {
        const targetSquare = event.target;

        // Check if target square is empty and valid
        if (
            targetSquare.classList.contains("square") &&
            targetSquare.childElementCount === 0
        ) {
            targetSquare.appendChild(selectedPiece.pieceElement);
            selectedPiece = null; // Deselect after moving

            // Switch player turns and trigger Stockfish move
            switchPlayer(); // <---- This will trigger Stockfish's turn
        }
    }
}

// AI turn: Get Stockfish to make a move
function getBestMoveFromStockfish() {
    const fen = boardToFEN();
    console.log(`Sending FEN to Stockfish: ${fen}`);  // Debug FEN output
    sendToStockfish(`position fen ${fen}`);
    sendToStockfish("go depth 10"); // Ask Stockfish to compute the best move
    console.log("Sent Stockfish 'go depth 10' command.");
}

// Move AI piece based on Stockfish's best move
function makeAIMove(move) {
    const fromSquare = move.slice(0, 2);  // E.g., 'e7'
    const toSquare = move.slice(2, 4);    // E.g., 'e5'

    const pieceToMove = document
        .getElementById(fromSquare)
        .querySelector(".piece");
    const targetSquare = document.getElementById(toSquare);

    if (!pieceToMove) {
        console.error(`No piece found on ${fromSquare}`);
        return;
    }

    // Check if the target square has a piece (capture)
    if (targetSquare.childElementCount > 0) {
        targetSquare.removeChild(targetSquare.firstChild); // Remove captured piece
    }

    // Move the piece
    targetSquare.appendChild(pieceToMove);

    // Switch back to the player's turn
    currentPlayer = "white";
}

// Switch between human and AI turns
function switchPlayer() {
    currentPlayer = currentPlayer === "white" ? "black" : "white";

    // If it's Stockfish's turn, trigger AI move
    if (currentPlayer === "black") {
        console.log("Stockfish's turn.");
        getBestMoveFromStockfish(); // Trigger AI move
    }
}

// Attach click listeners to pieces
function addPieceClickListeners() {
    const pieces = document.querySelectorAll(".piece");
    pieces.forEach((piece) => {
        piece.addEventListener("click", handlePieceClick);
    });
}

// Attach click listeners to squares
function addSquareClickListeners() {
    const squares = document.querySelectorAll(".square");
    squares.forEach((square) => {
        square.addEventListener("click", handleSquareClick);
    });
}

// Initialize board and listeners on page load
window.onload = () => {
    initializeBoard();
    addPieceClickListeners();
    addSquareClickListeners();
};
