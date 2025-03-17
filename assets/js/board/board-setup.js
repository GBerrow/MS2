// board-setup.js
import { boardState } from "./board-state.js";
import { applyBoardColors } from './board-ui.js';

    export function initializeBoard() {
      console.log("Initializing board...");

      // Set up initial piece positions
      boardState.pieces = {
        // Black pieces back rank
        a8: "rook-black",
        b8: "knight-black",
        c8: "bishop-black",
        d8: "queen-black",
        e8: "king-black",
        f8: "bishop-black",
        g8: "knight-black",
        h8: "rook-black",

        // Black pawns
        a7: "pawn-black",
        b7: "pawn-black",
        c7: "pawn-black",
        d7: "pawn-black",
        e7: "pawn-black",
        f7: "pawn-black",
        g7: "pawn-black",
        h7: "pawn-black",

        // White pawns
        a2: "pawn-white",
        b2: "pawn-white",
        c2: "pawn-white",
        d2: "pawn-white",
        e2: "pawn-white",
        f2: "pawn-white",
        g2: "pawn-white",
        h2: "pawn-white",

        // White pieces back rank
        a1: "rook-white",
        b1: "knight-white",
        c1: "bishop-white",
        d1: "queen-white",
        e1: "king-white",
        f1: "bishop-white",
        g1: "knight-white",
        h1: "rook-white",
      };

      // Render pieces on the DOM
      renderBoard();

      // Apply board coloring
      applyBoardColors();
    }

export function renderBoard() {
  // Clear the board first
  document.querySelectorAll(".square").forEach((square) => {
    square.innerHTML = "";
  });

  // Place pieces according to boardState
  for (const [position, piece] of Object.entries(boardState.pieces)) {
    const square = document.getElementById(position);

    if (!square) {
      console.error(`Square with ID ${position} not found!`);
      continue;
    }

    // Create image element for the piece
    const img = document.createElement("img");
    img.src = `assets/images/chess-pieces/${piece}.png`;
    img.alt = piece;
    img.classList.add("piece");
    img.setAttribute("data-piece", piece);
    img.setAttribute("data-color", piece.split("-")[1]);

    // Add the piece to the square
    square.appendChild(img);
  }
}