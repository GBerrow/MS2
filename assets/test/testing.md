If you want to return to my normal readme, please click the link below:

[Main Page](../../README.md)

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
  - [Bugs and fixes](#bugs-and-fixes)
  - [Conclusion](#conclusion)

---

## Bugs and Fixes

### AI / Stockfish Interaction

---

### **02/10/2024**

- **Problem**: AI not responding after the initial move with the white piece.
- **Fix**: The issue was caused by incorrect handling of WebAssembly (WASM) files and miscommunication with Stockfish. The following steps were taken:
  1. Verified that the `stockfish-16.1-lite-single.js` and `.wasm` files were in the correct folder.
  2. Updated the initialization of the Web Worker:
     ```javascript
     const stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");
     ```
  3. Ensured `.wasm` loaded with the MIME type `application/wasm`.
  4. After these corrections, the AI responded correctly.

---

### 03/10/2024

- **Problem**: Unable to capture black pieces.
- **Fix**: The game logic was not handling piece capture correctly. Fixes included:

  1. Implemented logic to check if the target square is occupied by an opponent’s piece before a move is completed.
  2. Updated `handleSquareClick` to handle capturing correctly:
     ```javascript
     if (targetSquare.childElementCount > 0) {
       const targetPiece = targetSquare.querySelector(".piece");
       const targetColor = targetPiece.getAttribute("data-color");

       if (targetColor !== selectedPiece.color) {
         targetSquare.removeChild(targetPiece); // Capture opponent's piece
       } else {
         console.log("Cannot move to a square occupied by your own piece.");
         return;
       }
     }
     ```
  3. After this update, white pieces can now capture black pieces, and the game logic proceeds correctly.

---

### Movement Validation

### **04/10/2024**

- **Problem**: White pieces were not restricted to specific movement patterns.ed.

  ![Initial Issue](test-images/test-image-1.png)

 - **Fixes**:
  1. Implemented `isValidPieceMove` for validating movements based on official chess rules.
     - Pawns move forward, attack diagonally.
     - Rooks move horizontally/vertically.
     - Bishops move diagonally.
     - Knights move in an "L" shape.
     - Queens move like both rooks and bishops.
     - Kings move one square in any direction.
     - Path clearance checks for rooks, bishops, and queens using `isPathClear`.
  2. Updated `handleSquareClick` to validate moves before completion, flag illegal moves, and handle piece capturing.
  3. **King Safety**: Added `isKingMoveSafe` to prevent the king from moving into check.

- **Result**: The game now enforces valid movements for all pieces, easing debugging by allowing only legal moves.

  ![Check Detection Example](test-images/test-image-2.png)

---

### King Safety and Checkmate Detection

### **07/10/2024**

- **Problem**: No detection for check, checkmate, or draw conditions.
  
- **Fixes**:
  1. **isKingInCheck**: Checks if a player's king is under threat.
  2. **findKing**: Locates the player's king.
  3. **canPieceAttack**: Validates if a specific opponent piece can attack the king.
  4. **Pawn Attack Fix**: Ensured pawns attack diagonally and appropriately detect threats.
  5. **checkGameState**: Evaluates the game state after each move to check for check, checkmate, or safe kings.

- **Result**: The game detects check conditions and updates the state accordingly.

---

### 08/10/2024

- **Problem**:  
   - King cannot move to safety when checked. The game was not validating the king's movement correctly in check situations.

![alt text](test-images/test-image-4.png)

- **Fix**:  
   1. **`isKingMoveSafe` Implementation**:  
      - A new function `isKingMoveSafe` was introduced to check if the king's movement would result in it remaining in check.
      - The function temporarily moves the king to the destination square, checks for any opponent attacks, and then undoes the temporary move.
      - If moving the king would put it in check, the move is declared invalid.
   
   2. **Validation Update**:  
      - The `isValidPieceMove` function was updated to include a call to `isKingMoveSafe` when validating king moves. This ensures that the king's move does not leave it vulnerable to check.

   3. **`checkGameState` Improvements**:  
      - The `checkGameState` function was improved to handle check conditions for both white and black kings.
      - After each move, the game checks if the player's king is in check and logs the results for debugging purposes.
      - Future implementation will handle checkmate conditions.

- **Result**: Illegal king moves are prevented, and checkmate conditions are now detected.

---
### **09/10/2024**

- **Problems Detected**:
  1. **Queen's Movement Logic**: The queen behaved like a bishop, moving only diagonally but not in straight lines.
  2. **King in Check Ignored**: The game did not detect when the king was in check, allowing illegal moves that should not be possible while in check.
  3. **Checkmate Detection**: The game failed to detect checkmate scenarios and continued without declaring the game over when the king had no legal moves.
  4. **Unrestricted Moves While in Check**: Players could continue moving any piece while the king was in check, violating chess rules that restrict moves to resolving the check.
  5. **Pawn Attack on the King Ignored**: Pawn's diagonal attack on the king was not correctly detected, allowing the king to move into positions that should be considered unsafe.
  6. **Game Over Not Triggered Properly**: The game didn’t correctly trigger game over conditions upon king capture or checkmate.
  7. **King Movement into Check**: The king was allowed to move into squares where it would be in check, contrary to chess rules.

- **Fixes Implemented**:
  1. **Queen Movement Logic**: 
     - The `isValidPieceMove` function was updated to allow the queen to move both diagonally like a bishop and in straight lines like a rook. The logic now checks for both `isStraightLineMove` and `isDiagonalMove` with clear path validation.
     
  2. **King Safety Validation**:
     - The `isKingMoveSafe` function was introduced. This function temporarily moves the king to the destination square and verifies if the king would still be in check after the move. It prevents the king from making illegal moves into check.
     
  3. **Check Detection**:
     - The `isKingInCheck` function was enhanced to correctly detect when a king is in check. This is now triggered after every player move, preventing the king from remaining in check or moving into unsafe positions.
     - Players are now restricted from moving any piece other than one that resolves the check.
     
  4. **Checkmate Detection**:
     - The `checkGameState` function was improved to handle checkmate situations. After each move, the game checks if the current player's king is in check and whether there are any valid moves to resolve it. If no valid moves exist, checkmate is declared and the game ends.
  
  5. **Pawn Attack Logic**:
     - The `canPawnAttack` function was corrected to ensure that pawns attack diagonally and correctly detect when a king is under threat from a pawn.
     
  6. **Game Over Handling**:
     - A `gameOver` function was added to stop the game when checkmate or king capture occurs. Once a game-over condition is met, the player is prevented from making further moves, and a "Restart" button appears for replaying the game.

  7. **Path Validation for Checkmate**:
     - All movement logic was updated to ensure that the game correctly handles scenarios where the king is under check, restricting movement to only those that resolve the check and forbidding movement that doesn’t alleviate the threat.

---

### UI / UX Improvements

- **Visual Feedback**: Added clearer visual feedback for check and checkmate.
- **Game Reset**: Introduced a "Restart" button, allowing players to reset the game after checkmate without refreshing the page.

---

#### **Next Steps**:
- Continue refining logic for special moves such as castling, en passant, and pawn promotion.
- Test edge cases where multiple pieces threaten the king simultaneously to ensure all checks are correctly detected.
- Ensure visual feedback for check and checkmate is clear and consistent for the user.
- Refine user experience by adding notifications for check, checkmate, and invalid moves.

---

