## Chess game

---

## Intorduction 

The Chess Game project is designed to provide an engaging, interactive, and user-friendly experience for chess enthusiasts. The game follows the traditional rules of chess, allowing players to move pieces according to the game's established rules. The application is developed using modern web technologies like HTML, CSS, and JavaScript to ensure it runs smoothly on various browsers and devices.

This project also serves as a learning experience in building front-end web applications, particularly focusing on interactivity, game logic, and responsive design.

---

## Project Overview
This project is a fully interactive web-based chess game built using HTML, CSS, and JavaScript. The game allows two players to play a standard game of chess with turn-based interaction. It features accurate chess movement rules, the ability to restart games, and plans for additional enhancements like checkmate detection and AI opponent integration.

---

## Contents

- [User Experience (UX)](#user-experience-ux)
- [Design](#design)
  - [Wireframes](#wireframes)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Testing](#testing)
  - [bugs]

---

## User Experience 

---

## Design

### Wireframes

Basic concept of the website layout:
![Wireframe](assets/images/Wireframes/Chess-wireframe.png)

---

## Features 

Over the next few days, the following features will be developed to ensure a fully functional and engaging chess experience:

- Interactive Chessboard: A fully interactive chessboard where players can click and move pieces according to standard chess rules.
- Turn-based Play: The game automatically alternates between white and black players after each move.
- Move Validation: The game validates pawn movement to ensure it follows the correct chess rules. Other pieces' validation is under development.
- Game Restart: Players can reset the game and start over at any time by pressing the restart button.
- Undo Move: An undo feature allows players to revert their last move, giving them flexibility in gameplay.
- Visual Feedback: Selected pieces and valid moves are highlighted to enhance the user experience.

---

## Technologies Used

---

## Testing

### Bugs

02/10/2024
- Problem: AI not responding after initial move with the white piece.
- Fix: The issue was caused by the incorrect handling of WebAssembly (WASM) files and miscommunication with Stockfish. The following steps were taken to fix it:
  1. Ensured both the JavaScript wrapper file (`stockfish-16.1-lite-single.js`) and the corresponding WebAssembly file (`stockfish-16.1-lite-single.wasm`) were correctly placed in the `assets/js/` folder.
  2. Updated the initialization of the Web Worker to point to the JavaScript file:
     ```javascript
     const stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");
     ```
  3. Confirmed that the `.wasm` file was being loaded correctly via the Network tab, and ensured the MIME type for `.wasm` files was `application/wasm`.
  4. After placing both files together and correcting the Worker initialization, the AI responded correctly and made moves as expected after the player's turn.

  03/10/2024
  - Problem: Unable to capture black pieces. 
  - Fix: The issue occurred because the game logic did not handle piece capture correctly. The following steps were taken to fix it:
  1. Implemented logic to check if the target square is occupied by a piece of the opposite color before moving a piece.
  2. Updated the `handleSquareClick` function to handle piece removal (capture) correctly. When a piece of the opposite color is present, the existing piece is removed before the new piece is placed:
     ```javascript
     if (targetSquare.childElementCount > 0) {
         const targetPiece = targetSquare.querySelector(".piece");
         const targetColor = targetPiece.getAttribute("data-color");

         // Check if the piece belongs to the opponent
         if (targetColor !== selectedPiece.color) {
             targetSquare.removeChild(targetPiece); // Capture the piece
         } else {
             console.log("Cannot move to a square occupied by your own piece.");
             return;
         }
     }
     ```
  3. After this fix, white pieces are now able to capture black pieces, and the game logic proceeds correctly to the next turn.