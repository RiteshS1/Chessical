// Create a representation of the board state
let boardState = new Array(8).fill(null).map(() => new Array(8).fill(null));

// Function to update board state after each move
function updateBoardState() {
    boardState = new Array(8).fill(null).map(() => new Array(8).fill(null));
    const squares = document.querySelectorAll('.square');
    
    squares.forEach(square => {
        const piece = square.querySelector('.piece');
        if (piece) {
            const index = parseInt(square.getAttribute('data-index'));
            const row = Math.floor(index / 8);
            const col = index % 8;
            const pieceData = piece.getAttribute('data-piece').split('_');
            boardState[row][col] = {
                color: pieceData[0],
                type: pieceData[1]
            };
        }
    });
}

// Function to evaluate board position
function evaluateBoard() {
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece) {
                const value = getPieceValue(piece);
                score += (piece.color === 'white' ? value : -value);
            }
        }
    }
    return score;
}

// Piece value based on common chess evaluation
function getPieceValue(piece) {
    const values = {
        'pawn': 100,
        'knight': 320,
        'bishop': 330,
        'rook': 500,
        'queen': 900,
        'king': 20000
    };
    return values[piece.type] || 0;
}

// Function to update the evaluation bar
function updateEvaluationBar() {
    updateBoardState();
    const score = evaluateBoard();
    const evaluationDiv = document.getElementById('evaluation-score');
    // Convert score to percentage (max score could be around 4000)
    const maxScore = 4000;
    const evalPercent = 50 + (score / maxScore) * 50;
    evaluationDiv.style.height = evalPercent + '%';
}
