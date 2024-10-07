If you want to return to my normal readme, please click the link below:

[readme](../../README.md)

---

- [Testing](#testing)
  - [Full Device and Browser Testing](#full-device-and-browser-testing)
  - [Mobile Responsiveness Testing](#mobile-responsiveness-testing)
  - [Cross Browser Console Output Testing](#cross-browser-console-output-testing)
  - [Edge Case Testing](#edge-case-testing)
  - [Broken Links Testing](#broken-links-testing)
  - [Performance Testing](#performance-testing)
  - [Accessibility Testing](#accessibility-testing)
  - [Security Testing](#security-testing)
  - [User Experience (UX) Testing](#user-experience-ux-testing)
  - [Visual Regression Testing](#visual-regression-testing)
  - [Automated Testing](#automated-testing)
  - [Manual Testing](#manual-testing)
  - [Bugs](#bugs)
  - [Conclusion](#conclusion)

---

## Bugs

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

04/10/2024

- Problem: No check, checkmate or draw conditions.
  ![test](test-images/test-image-1.png)
- Fix:

1. isKingInCheck is the primary function to check if a king is under threat by opponent pieces.