let isWhiteTurn = true; // Track current turn

function suggestBestMove() {
    console.log("Suggesting best move...");
    updateBoardState(); // Update the current board state
    const depth = 3;
    const bestMove = findBestMove(depth);
    
    if (bestMove) {
        console.log("Best move found:", bestMove);
        highlightBestMove(bestMove);
    } else {
        console.log("No valid moves found");
    }
}

function findBestMove(depth) {
    const possibleMoves = generateAllPossibleMoves(isWhiteTurn);
    console.log("Generated possible moves:", possibleMoves.length);
    
    let bestMove = null;
    let bestValue = isWhiteTurn ? -Infinity : Infinity;
    
    for (const move of possibleMoves) {
        // Make the move temporarily
        const capturedPiece = makeTemporaryMove(move);
        
        // Evaluate the position
        const value = minimax(depth - 1, -Infinity, Infinity, !isWhiteTurn);
        console.log(`Move ${move.from}->${move.to} evaluated to ${value}`);
        
        // Undo the move
        undoTemporaryMove(move, capturedPiece);
        
        // Update best move if necessary
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

function generateAllPossibleMoves(isWhite) {
    const moves = [];
    const squares = document.querySelectorAll('.square');
    
    squares.forEach(sourceSquare => {
        const piece = sourceSquare.querySelector('.piece');
        if (!piece) return;
        
        const pieceColor = piece.getAttribute('data-piece').split('_')[0];
        if ((isWhite && pieceColor !== 'white') || (!isWhite && pieceColor !== 'black')) return;
        
        const sourceIndex = parseInt(sourceSquare.getAttribute('data-index'));
        
        squares.forEach(targetSquare => {
            const targetIndex = parseInt(targetSquare.getAttribute('data-index'));
            if (sourceIndex === targetIndex) return;
            
            if (isValidMove(piece, sourceIndex, targetIndex)) {
                moves.push({
                    from: sourceIndex,
                    to: targetIndex,
                    piece: piece,
                    pieceType: piece.getAttribute('data-piece')
                });
            }
        });
    });
    
    return moves;
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
    // Get the current evaluation from the evaluation.js file
    return evaluateBoard();
}

function highlightBestMove(move) {
    // Remove existing highlights
    document.querySelectorAll('.square').forEach(square => {
        if (square.classList.contains('white')) {
            square.style.backgroundColor = '#f0d9b5';
        } else {
            square.style.backgroundColor = '#b58863';
        }
    });
    
    // Highlight the suggested move
    const sourceSquare = document.querySelector(`[data-index="${move.from}"]`);
    const targetSquare = document.querySelector(`[data-index="${move.to}"]`);
    
    if (sourceSquare && targetSquare) {
        sourceSquare.style.backgroundColor = '#aaffaa';
        targetSquare.style.backgroundColor = '#aaffaa';
    }
}

// Add event listener for the suggest move button
document.getElementById('suggest-best-move').addEventListener('click', () => {
    console.log("Suggest move button clicked");
    suggestBestMove();
});

// Function to update turn (should be called after each move in board.js)
function updateTurn() {
    isWhiteTurn = !isWhiteTurn;
}