// pieces/validation.js

/**
 * Checks if a position is within the chess board boundaries
 * @param {string} position - Chess notation position (e.g., "e4")
 * @returns {boolean} - True if position is valid
 */
export function isWithinBoard(position) {
    if (!position || position.length !== 2) return false;
    const file = position[0];
    const rank = parseInt(position[1]);
    return file >= 'a' && file <= 'h' && rank >= 1 && rank <= 8;
}

/**
 * Checks if a path between two squares is clear of any pieces
 * @param {Object} boardState - Current board state
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @returns {boolean} - True if path is clear
 */
export function isPathClear(boardState, from, to) {
    const [fromFile, fromRank] = [from.charCodeAt(0), parseInt(from[1])];
    const [toFile, toRank] = [to.charCodeAt(0), parseInt(to[1])];
    
    // Calculate direction of movement
    const fileStep = Math.sign(toFile - fromFile);
    const rankStep = Math.sign(toRank - fromRank);
    
    // Check each square along the path
    let currentFile = fromFile + fileStep;
    let currentRank = fromRank + rankStep;
    
    while (currentFile !== toFile || currentRank !== toRank) {
        const position = String.fromCharCode(currentFile) + currentRank;
        if (boardState.pieces[position]) {
            return false; // Path is blocked
        }
        currentFile += fileStep;
        currentRank += rankStep;
    }
    
    return true;
}

/**
 * Determines if a square contains a piece of the opponent's color
 * @param {Object} boardState - Current board state
 * @param {string} position - Position to check
 * @param {string} playerColor - Current player's color ('white' or 'black')
 * @returns {boolean} - True if square contains opponent's piece
 */
export function isOpponentPiece(boardState, position, playerColor) {
    const piece = boardState.pieces[position];
    if (!piece) return false;
    
    const pieceColor = piece.split('-')[1];
    return pieceColor !== playerColor;
}

/**
 * Checks if a move is a straight line (horizontal or vertical)
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @returns {boolean} - True if move is in a straight line
 */
export function isStraightMove(from, to) {
    return from[0] === to[0] || from[1] === to[1];
}

/**
 * Checks if a move is diagonal
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @returns {boolean} - True if move is diagonal
 */
export function isDiagonalMove(from, to) {
    const fileDiff = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
    const rankDiff = Math.abs(parseInt(from[1]) - parseInt(to[1]));
    return fileDiff === rankDiff;
}

/**
 * Gets the color of a square (light or dark)
 * @param {string} position - Chess notation position
 * @returns {string} - 'light' or 'dark'
 */
export function getSquareColor(position) {
    const file = position.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(position[1]) - 1;
    return (file + rank) % 2 === 0 ? 'dark' : 'light';
}

/**
 * Calculates the distance between two squares
 * @param {string} from - Starting position
 * @param {string} to - Ending position
 * @returns {Object} - {fileDiff, rankDiff} differences
 */
export function getMoveDistance(from, to) {
    const fileDiff = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
    const rankDiff = Math.abs(parseInt(from[1]) - parseInt(to[1]));
    return { fileDiff, rankDiff };
}
