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
                const value = getPieceValue({
                    ...piece,
                    row: row,
                    col: col
                });
                score += (piece.color === 'white' ? value : -value);
            }
        }
    }

    // Add bonus for controlling center
    const centerControl = evaluateCenterControl();
    score += centerControl;

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

    // Add position-based bonuses
    const positionBonus = {
        'pawn': [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ],
        'knight': [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        'bishop': [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  5, 10, 10, 10, 10,  5,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-30,-30,-30,-30,-30,-30,-30,-30]
        ],
        'rook': [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [5, 10, 10, 10, 10, 10, 10, 5],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [5, 10, 10, 10, 10, 10, 10, 5],
            [10, 10, 10, 10, 10, 10, 10, 10],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
        'queen': [
            [-20,-10,-10,-5,-5,-10,-10,-20],
            [-10, 0, 0, 0, 0, 0, 0,-10],
            [-10, 5, 10, 10, 10, 10,  5,-10],
            [-5,  0, 10, 10, 10, 10,  0,-5],
            [0,  0, 10, 10, 10, 10,  0, 0],
            [-10, 0, 10, 10, 10, 10,  5,-10],
            [-10, 0, 0, 0, 0, 0, 0,-10],
            [-20,-10,-10,-5,-5,-10,-10,-20]
        ],
        'king': [
            [20, 30, 10, 0, 0, 10, 30, 20],
            [20, 30, 10, 0, 0, 10, 30, 20],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [-20,-30,-30,-30,-30,-30,-30,-20],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-40,-50,-50,-60,-60,-50,-50,-40]
        ]
    };

    let value = values[piece.type] || 0;

    // Add position-based bonus if available
    if (positionBonus[piece.type]) {
        const row = piece.color === 'white' ? 7 - piece.row : piece.row; // Adjust row for white's perspective
        value += positionBonus[piece.type][row][piece.col];
    }

    return value;
}

function evaluateCenterControl() {
    const centerSquares = [
        {row: 3, col: 3}, {row: 3, col: 4},
        {row: 4, col: 3}, {row: 4, col: 4}
    ];
    
    let centerScore = 0;
    centerSquares.forEach(square => {
        const piece = boardState[square.row][square.col];
        if (piece) {
            centerScore += (piece.color === 'white' ? 30 : -30);
        }
    });
    
    return centerScore;
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