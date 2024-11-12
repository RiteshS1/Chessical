let isWhiteTurn = true; // Track current turn

function suggestBestMove() {
    console.log("Suggesting best move...");
    updateBoardState(); // Update the current board state
    const depth = 3; // Adjust the search depth as needed
    const bestMove = findBestMove(depth);

    if (bestMove) {
        console.log("Best move found:", bestMove.moveNotation);
        highlightBestMove(bestMove.from, bestMove.to);
    } else {
        console.log("No valid moves found");
    }
}

function findBestMove(depth) {
    const possibleMoves = generateAllPossibleMoves(isWhiteTurn);
    if (possibleMoves.length === 0) {
        const kingPos = findKingPosition(isWhiteTurn);
        if (kingPos && isKingInCheck(kingPos.row, kingPos.col, isWhiteTurn)) {
            console.log("Checkmate!");
        } else {
            console.log("Stalemate!");
        }
        return null;
    }

    let bestMove = null;
    let bestValue = isWhiteTurn ? -Infinity : Infinity;

    for (const move of possibleMoves) {
        const value = evaluateMove(move, depth);
        
        if (isWhiteTurn && value > bestValue) {
            bestValue = value;
            bestMove = move;
        } else if (!isWhiteTurn && value < bestValue) {
            bestValue = value;
            bestMove = move;
        }
    }

    return bestMove;
}

function evaluateMove(move, depth) {
    // Make the move temporarily
    const sourceSquare = document.querySelector(`[data-index="${move.from}"]`);
    const targetSquare = document.querySelector(`[data-index="${move.to}"]`);
    const targetPiece = targetSquare.querySelector('.piece');
    
    sourceSquare.removeChild(move.piece);
    if (targetPiece) {
        targetSquare.removeChild(targetPiece);
    }
    targetSquare.appendChild(move.piece);

    // Evaluate position
    const value = minimax(depth - 1, -Infinity, Infinity, !isWhiteTurn);

    // Undo the move
    targetSquare.removeChild(move.piece);
    if (targetPiece) {
        targetSquare.appendChild(targetPiece);
    }
    sourceSquare.appendChild(move.piece);

    return value;
}

function generateAllPossibleMoves(isWhite) {
    const moves = [];
    const kingPos = findKingPosition(isWhite);
    const inCheck = kingPos && isKingInCheck(kingPos.row, kingPos.col, isWhite);
    
    const squares = document.querySelectorAll('.square');
    
    squares.forEach(sourceSquare => {
        const piece = sourceSquare.querySelector('.piece');
        if (!piece) return;
        
        const pieceType = piece.getAttribute('data-piece');
        if ((isWhite && !pieceType.startsWith('white')) || 
            (!isWhite && !pieceType.startsWith('black'))) {
            return;
        }
        
        const sourceIndex = parseInt(sourceSquare.getAttribute('data-index'));
        
        squares.forEach(targetSquare => {
            const targetIndex = parseInt(targetSquare.getAttribute('data-index'));
            if (sourceIndex === targetIndex) return;
            
            try {
                if (isValidMove(piece, sourceIndex, targetIndex)) {
                    // If in check, only add moves that resolve check
                    if (!inCheck || doesMoveResolveCheck(piece, sourceIndex, targetIndex)) {
                        moves.push({
                            from: sourceIndex,
                            to: targetIndex,
                            piece: piece,
                            pieceType: pieceType,
                            moveNotation: getAlgebraicNotation(sourceIndex, targetIndex, pieceType)
                        });
                    }
                }
            } catch (error) {
                console.error('Error validating move:', error);
            }
        });
    });
    
    console.log(`Generated ${moves.length} valid moves for ${isWhite ? 'white' : 'black'}`);
    return moves;
}

function getAlgebraicNotation(sourceIndex, targetIndex, pieceType) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

    const sourceFile = files[sourceIndex % 8];
    const sourceRank = ranks[Math.floor(sourceIndex / 8)];
    const targetFile = files[targetIndex % 8];
    const targetRank = ranks[Math.floor(targetIndex / 8)];

    const pieceChar = pieceType.split('_')[1].toUpperCase().charAt(0);

    return `${pieceChar}${sourceFile}${sourceRank}${targetFile}${targetRank}`;
}

function makeTemporaryMove(move) {
    const sourceSquare = document.querySelector(`[data-index="${move.from}"]`);
    const targetSquare = document.querySelector(`[data-index="${move.to}"]`);
    const capturedPiece = targetSquare.querySelector('.piece');

    if (capturedPiece) {
        targetSquare.removeChild(capturedPiece);
    }

    sourceSquare.removeChild(move.piece);
    targetSquare.appendChild(move.piece);

    updateBoardState(); // Update the internal board state
    return capturedPiece;
}

function undoTemporaryMove(move, capturedPiece) {
    const sourceSquare = document.querySelector(`[data-index="${move.from}"]`);
    const targetSquare = document.querySelector(`[data-index="${move.to}"]`);

    targetSquare.removeChild(move.piece);
    sourceSquare.appendChild(move.piece);

    if (capturedPiece) {
        targetSquare.appendChild(capturedPiece);
    }

    updateBoardState(); // Update the internal board state
}

function minimax(depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0) {
        return evaluatePosition();
    }

    const possibleMoves = generateAllPossibleMoves(isMaximizingPlayer);

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of possibleMoves) {
            const capturedPiece = makeTemporaryMove(move);
            const eval = minimax(depth - 1, alpha, beta, false);
            undoTemporaryMove(move, capturedPiece);

            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of possibleMoves) {
            const capturedPiece = makeTemporaryMove(move);
            const eval = minimax(depth - 1, alpha, beta, true);
            undoTemporaryMove(move, capturedPiece);

            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluatePosition() {
    return evaluateBoard(); // This function is from evaluation.js
}

function highlightBestMove(sourceIndex, targetIndex) {
    // Clear any existing highlights first
    clearHighlights();
    
    const sourceSquare = document.querySelector(`[data-index="${sourceIndex}"]`);
    const targetSquare = document.querySelector(`[data-index="${targetIndex}"]`);

    if (sourceSquare && targetSquare) {
        // Add highlights
        sourceSquare.classList.add('highlighted-square');
        targetSquare.classList.add('highlighted-square');

        // Add move notation
        const notationElement = document.createElement('div');
        notationElement.classList.add('move-notation');
        notationElement.textContent = getAlgebraicNotation(sourceIndex, targetIndex, sourceSquare.querySelector('.piece').getAttribute('data-piece'));
        targetSquare.appendChild(notationElement);

        // Remove highlights after 4 seconds
        setTimeout(() => {
            clearHighlights();
        }, 4000);
    }
}

function clearHighlights() {
    // Remove all highlights
    document.querySelectorAll('.highlighted-square').forEach(square => {
        square.classList.remove('highlighted-square');
    });
    
    // Remove all move notations
    document.querySelectorAll('.move-notation').forEach(notation => {
        notation.remove();
    });
}

// Add event listener for the suggest move button
document.getElementById('suggest-best-move').addEventListener('click', () => {
    console.log("Suggest move button clicked");
    suggestBestMove();
});

function updateTurn() {
    isWhiteTurn = !isWhiteTurn;
}