// Initialize Stockfish Worker using the JavaScript file
const stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");

if (!stockfish) {
    console.error("Stockfish worker could not be initialized. Check the file path.");
} else {
    console.log("Stockfish worker initialized successfully.");
}

// Handle Stockfish response
stockfish.onmessage = function (event) {
    console.log("Stockfish says: ", event.data);

    const bestMoveMatch = event.data.match(/bestmove\s([a-h][1-8][a-h][1-8])/);
    if (bestMoveMatch) {
        const bestMove = bestMoveMatch[1];
        console.log(`Stockfish's best move: ${bestMove}`);
        makeAIMove(bestMove); // Apply Stockfish's move to the board
    }
};

// Utility to send commands to Stockfish
function sendToStockfish(command) {
    stockfish.postMessage(command);
}

// Chess Board Setup
const initialBoardSetup = {
    a8: "rook-black", b8: "knight-black", c8: "bishop-black", d8: "queen-black",
    e8: "king-black", f8: "bishop-black", g8: "knight-black", h8: "rook-black",
    a7: "pawn-black", b7: "pawn-black", c7: "pawn-black", d7: "pawn-black",
    e7: "pawn-black", f7: "pawn-black", g7: "pawn-black", h7: "pawn-black",
    a1: "rook-white", b1: "knight-white", c1: "bishop-white", d1: "queen-white",
    e1: "king-white", f1: "bishop-white", g1: "knight-white", h1: "rook-white",
    a2: "pawn-white", b2: "pawn-white", c2: "pawn-white", d2: "pawn-white",
    e2: "pawn-white", f2: "pawn-white", g2: "pawn-white", h2: "pawn-white"
};

let selectedPiece = null;
let currentPlayer = "white"; // Human player plays white, AI plays black

// Initialize the chess board with pieces
function initializeBoard() {
    console.log("Initializing board...");
    Object.entries(initialBoardSetup).forEach(([squareId, piece]) => {
        const square = document.getElementById(squareId);
        const img = document.createElement("img");
        img.src = `assets/images/chess-pieces/${piece}.png`;
        img.classList.add("piece");
        img.setAttribute("data-piece", piece);
        img.setAttribute("data-color", piece.split("-")[1]);
        square.appendChild(img);
    });
}

// Convert the board state to FEN format for Stockfish
function boardToFEN() {
    let fen = "";
    const rows = [];
    for (let rank = 8; rank >= 1; rank--) {
        let row = "";
        let emptyCount = 0;
        for (let file of "abcdefgh") {
            const squareId = `${file}${rank}`;
            const square = document.getElementById(squareId);
            const piece = square.querySelector(".piece");
            if (!piece) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    row += emptyCount;
                    emptyCount = 0;
                }
                const pieceType = piece.getAttribute("data-piece").split("-")[0];
                const color = piece.getAttribute("data-color");
                const notation = {
                    pawn: "p", rook: "r", knight: "n", bishop: "b",
                    queen: "q", king: "k"
                }[pieceType];
                row += color === "white" ? notation.toUpperCase() : notation;
            }
        }
        if (emptyCount > 0) row += emptyCount;
        rows.push(row);
    }
    return rows.join("/") + ` ${currentPlayer === "white" ? "w" : "b"} - - 0 1`;
}

// Handle piece selection
function handlePieceClick(event) {
    if (currentPlayer !== "white") return;
    const piece = event.target;
    const pieceColor = piece.getAttribute("data-color");
    if (pieceColor !== currentPlayer) return;

    selectedPiece = {
        pieceElement: piece,
        currentSquare: piece.parentElement.id,
        color: pieceColor
    };
    console.log(`Selected ${selectedPiece.pieceType} on ${selectedPiece.currentSquare}`);
}

// Handle moving a piece
function handleSquareClick(event) {
    if (!selectedPiece) return;
    const targetSquare = event.target;
    if (targetSquare.classList.contains("square") && targetSquare.childElementCount === 0) {
        targetSquare.appendChild(selectedPiece.pieceElement);
        selectedPiece = null;
        switchPlayer();
    }
}

// Switch between human and AI turns
function switchPlayer() {
    currentPlayer = currentPlayer === "white" ? "black" : "white";
    if (currentPlayer === "black") {
        getBestMoveFromStockfish();
    }
}

// AI turn: Ask Stockfish for the best move
function getBestMoveFromStockfish() {
    const fen = boardToFEN();
    console.log(`Sending FEN to Stockfish: ${fen}`);
    sendToStockfish(`position fen ${fen}`);
    sendToStockfish("go depth 10");
}

// Apply AI move
function makeAIMove(move) {
    const fromSquare = move.slice(0, 2);
    const toSquare = move.slice(2, 4);
    const pieceToMove = document.getElementById(fromSquare).querySelector(".piece");
    const targetSquare = document.getElementById(toSquare);
    if (!pieceToMove) {
        console.error(`No piece found on ${fromSquare}`);
        return;
    }
    if (targetSquare.childElementCount > 0) {
        targetSquare.removeChild(targetSquare.firstChild);
    }
    targetSquare.appendChild(pieceToMove);
    currentPlayer = "white";
}

// Event Listeners
function addListeners() {
    document.querySelectorAll(".piece").forEach(piece => {
        piece.addEventListener("click", handlePieceClick);
    });
    document.querySelectorAll(".square").forEach(square => {
        square.addEventListener("click", handleSquareClick);
    });
}

// Initialize board and listeners on page load
window.onload = () => {
    initializeBoard();
    addListeners();
};
