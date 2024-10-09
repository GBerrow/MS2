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

---

### 02/10/2024

- **Problem**: AI not responding after the initial move with the white piece.
- **Fix**: The issue was caused by incorrect handling of WebAssembly (WASM) files and miscommunication with Stockfish. The following steps were taken:

  1. Verified both the JavaScript wrapper (`stockfish-16.1-lite-single.js`) and WebAssembly file (`stockfish-16.1-lite-single.wasm`) were correctly placed in the `assets/js/` folder.
  2. Updated the initialization of the Web Worker to point to the JavaScript file:
     ```javascript
     const stockfish = new Worker("assets/js/stockfish-16.1-lite-single.js");
     ```
  3. Confirmed `.wasm` file loading via the Network tab and ensured the MIME type for `.wasm` was `application/wasm`.
  4. After correcting the Worker initialization, the AI responded as expected.

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

### 04/10/2024

- **Problem**: No check, checkmate, or draw conditions detected.

  ![Initial Issue](test-images/test-image-1.png)

- **Fix**:
  
  1. **`isKingInCheck`**: Added this function to determine if a player's king is under threat by any opponent's piece.
  2. **`findKing`**: This function locates the player's king for use in threat detection.
  3. **`canPieceAttack`**: Used to validate if a specific opponent piece can attack a target square, using helper functions for different movement types.
  4. **Pawn Attack Fix**: Ensured pawns only attack diagonally upwards (for white) and downwards (for black), preventing false positives.
  5. **`checkGameState`**: This function evaluates the game state after each move to check for check, checkmate, or safe kings.

- **Result**:
  The game now detects when a king is in check. Console logs show whether kings are in check or safe.

  ![Check Detection Example](test-images/test-image-2.png)

---

### 07/10/2024

- **Problem**: White pieces were not restricted to their specific movements, complicating debugging.
  
- **Fix**:
  1. **Movement Validation for All Pieces**: 
     - Implemented the `isValidPieceMove` function to validate movement for all pieces.
     - Movement restrictions based on official chess rules:
       - Pawns move forward, attack diagonally.
       - Rooks move horizontally/vertically.
       - Bishops move diagonally.
       - Knights move in an "L" shape.
       - Queens move like both rooks and bishops.
       - Kings move one square in any direction.
     - **Path Clearance Check**: Rooks, bishops, and queens must have a clear path to move. `isPathClear` was added to check this.
  
  2. **`handleSquareClick` Updates**: 
     - `isValidPieceMove` validates moves before they are completed.
     - The game now prevents illegal moves, flags invalid moves, and handles capturing of opponent pieces.
  
  3. **King Safety**:
     - `isKingMoveSafe` prevents the king from moving into positions where it would be in check.

- **Outcome**:
  The game now enforces movement restrictions for all pieces, aligning with chess rules. Debugging is easier as only valid moves are allowed.

  ![Updated Board State](test-images/test-image-3.png)

---

### Next Steps:
- Continue refining movement logic to handle checkmate.

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

- **Next Steps**:  
   1. Implement a full checkmate condition by evaluating if there are no valid moves left for the player whose king is in check.

---
### **08/10/2024**

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

  8. **Major Updates and Bug Fixes**:
     - Refined pawn movement logic to ensure correct diagonal captures and movement rules.
     - Fixed the queen’s movement to allow both diagonal and straight-line moves.
     - Added checkmate detection and validation to prevent illegal king moves.
     - Integrated king safety checks after every move to ensure the king doesn’t move into check or remain in check.
     - Updated event listeners for pieces and squares after every move to ensure accurate interactions.
     - Reorganized code structure for improved readability and maintainability.

- **Challenges**:
  1. **Blocking Checks**: Test cases revealed that pieces couldn’t always block checks properly. We implemented logic to ensure that pieces can move to block check threats (e.g., moving a queen or bishop between an attacking piece and the king).
  2. **Pawn Attacks**: Pawns were incorrectly considered for check, and the rules governing their diagonal attacks needed adjustments.

- **Further Testing**:
  - Extensive testing was performed by purposely placing the king into check and attempting illegal moves to ensure that the new rules are followed. The game now consistently prevents illegal moves and detects checkmate situations correctly.

---

#### **Next Steps**:
- Continue refining logic for special moves such as castling, en passant, and pawn promotion.
- Test edge cases where multiple pieces threaten the king simultaneously to ensure all checks are correctly detected.
- Ensure visual feedback for check and checkmate is clear and consistent for the user.
- Refine user experience by adding notifications for check, checkmate, and invalid moves.

---

### **09/10/2024**

- **Problems Detected**:

1. **King Moving into Dangerous Position (Test 1)**: 
     - The king is allowed to move into positions where it would be in check, violating chess rules that prevent the king from placing itself into danger.

  2. **No Checkmate Detection for Losing (Test 2)**: 
     - When the player's king is in checkmate, the game doesn't display a "Game Over, Black Wins!" message when the black king wins, only showing messages when the player wins.

  3. **Post-Game Piece Selection (Test 3)**: 
     - After checkmate and a victory message ("Game over! White wins!"), the player can no longer select any pieces, indicating that the game correctly prevents further moves after a win. However, this functionality should also apply to when the player loses.

  4. **Delayed Check Detection (Test 4)**: 
     - The game does not immediately detect check when it happens. It only flags the king as being in check when the player selects the king or attempts to move another piece. This delay in check detection affects gameplay, as the player should immediately be informed when their king is in check.

- **Fixes Implemented**:
   
   1. **Modified isKingMoveSafe**
     - Implemented additional validation to ensure pawns are not threatening the king diagonally during moves.
     - Refined the logic in `isKingMoveSafe` to handle specific scenarios where pawns could attack the king.
     - Improved overall king safety by including both black and white pawns in the check system.