document.addEventListener('DOMContentLoaded', () => {
    //CONNECTION TO SERVER LOGIC
    const registerButton = document.getElementById('registerButton');
    const findGameButton = document.getElementById("pairme");
    const quitGameButton = document.getElementById("quit");
    registerButton.addEventListener('click', registerWithServer);
    findGameButton.addEventListener('click', findGame);
    quitGameButton.addEventListener('click', quit);
    let username = "";
    let gameRecord = {};
    let theirLastMove;
    let theirCurrentMove;
    let playingAsWhite;
    let playing = false;
    let myTurn = true;
    let turnCount = 1;


    async function registerWithServer() {
        try {
            const origin = window.location.origin;
            console.log(origin);
            const response = await fetch('http://127.0.0.1:8080/register');
            if (!response.ok) {
                throw new Error('Request to /register endpoint failed');
            }
            const data = await response.json();
            username = data.username;
            // Handle the server's response
            console.log('Received username:', username);
        } catch (error) {
            // Handle any errors or server-side issues
            console.log('Error:', error);
        }
    }

    async function findGame() {
        gameRecord = await fetchGameRecord(username);
        if (gameRecord.Player1 === username) {
            console.log("I start the game");
            myTurn = true;
            playingAsWhite = true;
            theirCurrentMove = gameRecord.Player2LastMove;
            theirLastMove = gameRecord.Player2LastMove;
        } else {
            console.log("its not my turn to start");
            playingAsWhite = false;
            myTurn = false;
            theirCurrentMove = gameRecord.Player1LastMove;
            theirLastMove = gameRecord.Player1LastMove;
        }

        while (gameRecord.GameState === "wait") {
            await delay(1000); // Delay between each request (e.g., 1 second)
            gameRecord = await fetchGameRecord(username);
            // if (gameRecord.Player1 === username) {
            //     console.log("I start the game");
            //     playingAsWhite = true;
            //     myTurn = true;
            //     theirCurrentMove = gameRecord.Player2LastMove;
            //     theirLastMove = gameRecord.Player2LastMove;
            // } else {
            //     console.log("setting my turn as false");
            //     playingAsWhite = false;
            //     myTurn = false;
            //     theirCurrentMove = gameRecord.Player1LastMove;
            //     theirLastMove = gameRecord.Player1LastMove;
            // }
        }

        console.log(gameRecord);
        startGame();
    }

    

    async function fetchGameRecord() {
        const response = await fetch(`http://127.0.0.1:8080/pairme?player=${username}`);
        if (!response.ok) {
            throw new Error('Request to /pairme endpoint failed');
        }

        const data = await response.json();

        return data;
    }

    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function sendMove(fromRow, fromCol, toRow, toCol, piece) {
        const move = {
            'piece': piece,
            'fromRow': fromRow,
            'fromCol': fromCol,
            'toRow': toRow,
            'toCol': toCol
        }

        const moveString = JSON.stringify(move);

        const response = await fetch(`http://127.0.0.1:8080/mymove?player=${username}&id=${gameRecord.GameID}&move=${moveString}`);
        if (!response.ok) {
            throw new Error('Request to /pairme endpoint failed');
        }

        console.log("move sent successfully");
        myTurn = false;
        return true;
    }

    async function fetchTheirMove() {
        const response = await fetch(`http://127.0.0.1:8080/theirmove?player=${username}&id=${gameRecord.GameID}`);
        if (!response.ok) {
            throw new Error('Request to /pairme endpoint failed');
        }

        const data = await response.json();
        const theirMove = data.move;

        myTurn = true;
        return theirMove;
    }

    async function quit() {
        const response = await fetch(`http://127.0.0.1:8080/quit?player=${username}&id=${gameRecord.GameID}`);
        if (!response.ok) {
            throw new Error('Request to /pairme endpoint failed');
        }

        const data = await response.json();
        const message = data.message;
        return message;
    }

    async function startGame() {
        console.log("game started!");
        console.log(myTurn);
        if(!myTurn) {
            while (theirLastMove === theirCurrentMove) {
                await delay(5000);
                theirCurrentMove = await fetchTheirMove();
            }
            theirLastMove = theirCurrentMove;
            implementTheirMove();
        }
    }


    //CHESS LOGIC
    const chessPieces = {
        'pawn': ['https://upload.wikimedia.org/wikipedia/commons/0/04/Chess_plt60.png', 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Chess_pdt60.png'],
        'knight': ['https://upload.wikimedia.org/wikipedia/commons/2/28/Chess_nlt60.png', 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Chess_ndt60.png'],
        'bishop': ['https://upload.wikimedia.org/wikipedia/commons/9/9b/Chess_blt60.png', 'https://upload.wikimedia.org/wikipedia/commons/8/81/Chess_bdt60.png'],
        'king': ['https://upload.wikimedia.org/wikipedia/commons/3/3b/Chess_klt60.png', 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Chess_kdt60.png'],
        'queen': ['https://upload.wikimedia.org/wikipedia/commons/4/49/Chess_qlt60.png', 'https://upload.wikimedia.org/wikipedia/commons/a/af/Chess_qdt60.png'],
        'rook': ['https://upload.wikimedia.org/wikipedia/commons/5/5c/Chess_rlt60.png', 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Chess_rdt60.png']
    }
    // Chess game logic implementation goes here
    // You can define the chessboard, handle moves, and update the game state directly in this file
    const board = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ];

    // Render the chessboard
    const chessboardElement = document.getElementById('chessboard-container');
    const chessboardGrid = document.getElementById('chessboard-grid');

    let selectedSquare = null;
    let previouslySelectedSquare = null;
    let validMoves = [];

    createChessBoard();

    function createChessBoard() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');

                // Set the row and col coordinates as data attributes
                square.dataset.row = row;
                square.dataset.col = col;

                // Add the square element to the chessboard grid


                if ((row + col) % 2 === 0) {
                    square.classList.add('light-square');
                } else {
                    square.classList.add('dark-square');
                }

                const piece = board[row][col];

                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.classList.add('piece');

                    // Set the background image for the piece based on the piece type and color
                    let pieceType;
                    if (piece.toLowerCase() === 'p') {
                        pieceType = chessPieces.pawn;
                    } else if (piece.toLowerCase() === 'n') {
                        pieceType = chessPieces.knight;
                    } else if (piece.toLowerCase() === 'b') {
                        pieceType = chessPieces.bishop;
                    } else if (piece.toLowerCase() === 'r') {
                        pieceType = chessPieces.rook;
                    } else if (piece.toLowerCase() === 'q') {
                        pieceType = chessPieces.queen;
                    } else if (piece.toLowerCase() === 'k') {
                        pieceType = chessPieces.king;
                    }

                    const pieceImageURL =
                        piece === piece.toLowerCase()
                            ? pieceType[1] // Black piece
                            : pieceType[0]; // White piece
                    pieceElement.style.backgroundImage = `url(${pieceImageURL})`;

                    square.appendChild(pieceElement);
                }

                square.addEventListener('click', () => {
                    handlePieceClick(square);
                });

                chessboardGrid.appendChild(square);
            }
        }
    }


    chessboardElement.appendChild(chessboardGrid);

    async function handlePieceClick(squareElement) {
        console.log("square clicked");
        console.log(squareElement);
        clearHighlights();
        console.log("board when piece clicked: ", board);

        const row = parseInt(squareElement.dataset.row, 10);
        const col = parseInt(squareElement.dataset.col, 10);
        const piece = board[row][col];
        console.log(piece);

        if (piece && myTurn) {
            console.log('Square with piece clicked');
            console.log('Piece:', piece);

            if (selectedSquare === null) {
                selectedSquare = squareElement;
                validMoves = calculateValidMoves(row, col);
                highlightValidMoves(validMoves);
                previouslySelectedSquare = selectedSquare;
                previouslySelectedRow = row;
                previouslySelectedCol = col;
            } else {
                const selectedRow = parseInt(selectedSquare.dataset.row, 10);
                const selectedCol = parseInt(selectedSquare.dataset.col, 10);

                if (row === selectedRow && col === selectedCol) {
                    // Clicked on the same square again, deselect it
                    selectedSquare = null;
                    validMoves = [];
                    clearHighlights();
                } else if (isValidMove(row, col)) {
                    // Move the piece to the clicked square
                    console.log("moving piece 1");
                    movePiece(selectedRow, selectedCol, row, col);
                    selectedSquare = null;
                    validMoves = [];
                    clearHighlights();
                    const sendMoveSuccess = await sendMove(selectedRow, selectedCol, row, col, piece);

                    if (sendMoveSuccess) {
                        while (theirLastMove === theirCurrentMove) {
                            await delay(5000);
                            theirCurrentMove = await fetchTheirMove();
                        }
                        theirLastMove = theirCurrentMove;
                        implementTheirMove();
                    }
                } else {
                    // Clicked on a different square, update the selection
                    selectedSquare = squareElement;
                    validMoves = calculateValidMoves(row, col);
                    highlightValidMoves(validMoves);
                }
            }
        } else {
            // A square without a piece was clicked
            console.log('Square without piece clicked');

            if (selectedSquare !== null) {
                // A previously selected square exists, update the selection

                const selectedRow = parseInt(previouslySelectedSquare.dataset.row, 10);
                const selectedCol = parseInt(previouslySelectedSquare.dataset.col, 10);
                console.log("old row = ", selectedRow);
                console.log("old col = ", selectedCol);
                console.log("new row = ", row);
                console.log("new col = ", col);
                if (isValidMove(row, col)) {
                    console.log("move piece 2");
                    movePiece(selectedRow, selectedCol, row, col);
                    myTurn = false;
                    selectedSquare = null;
                    validMoves = [];
                    clearHighlights();
                    const sendMoveSuccess = await sendMove(selectedRow, selectedCol, row, col, piece);

                    if (sendMoveSuccess) {
                        while (theirLastMove === theirCurrentMove) {
                            await delay(5000);
                            theirCurrentMove = await fetchTheirMove();
                        }
                        theirLastMove = theirCurrentMove;
                        implementTheirMove();
                    }
                } else {
                    //selected square is not a valid move. Reset the selectedSquare. 
                    console.log("that is not a valid move");
                    selectedSquare = null;
                    validMoves = [];
                    clearHighlights();
                }

            } else {
                // Either no piece on the square, or no active game, or its not your turn
                if (!piece) {
                    console.log("empty square clicked");
                }
                if (!playing) {
                    console.log("you are not in a game");
                }
                if (!myTurn) {
                    console.log("its not your turn");
                }
                selectedSquare = null;
                validMoves = [];
                clearHighlights();
            }
        }
    }



    function calculateValidMoves(row, col) {
        console.log("calculating valid moves");
        validMoves = [];
        const piece = board[row][col];
        const possibleCaptureTargets = {
            'white': ['p', 'n', 'b', 'r', 'q', 'k'],
            'black': ['P', 'N', 'B', 'R', 'Q', 'K']
        };
        switch (piece.toLowerCase()) {
            case 'p':
                // Logic for pawn movement
                validMoves = calculateValidMovesForPawn(row, col, piece, possibleCaptureTargets);
                break;
            case 'n':
                // Logic for knight movement
                if (piece === 'N') {
                    const validCaptureTargets = possibleCaptureTargets.white;
                    validMoves = calculateValidMovesForKnight(row, col, validCaptureTargets)
                } else {
                    const validCaptureTargets = possibleCaptureTargets.black;
                    validMoves = calculateValidMovesForKnight(row, col, validCaptureTargets);
                }
                break;
            case 'b':
                // Logic for bishop movement
                if (piece === 'B') {
                    const validCaptureTargets = possibleCaptureTargets.white;
                    validMoves = calculateValidMovesForBishop(row, col, validCaptureTargets);
                } else {
                    const validCaptureTargets = possibleCaptureTargets.black;
                    validMoves = calculateValidMovesForBishop(row, col, validCaptureTargets);
                }
                break;
            case 'r':
                // Logic for rook movement
                if (piece === 'R') {
                    const validCaptureTargets = possibleCaptureTargets.white;
                    validMoves = calculateValidMovesForRook(row, col, validCaptureTargets);
                } else {
                    const validCaptureTargets = possibleCaptureTargets.black;
                    validMoves = calculateValidMovesForRook(row, col, validCaptureTargets);
                }
                break;
            case 'q':
                // Logic for queen movement
                if (piece === 'Q') {
                    const validCaptureTargets = possibleCaptureTargets.white;
                    validMoves = calculateValidMovesForRook(row, col, validCaptureTargets).concat(calculateValidMovesForBishop(row, col, validCaptureTargets));
                } else {
                    const validCaptureTargets = possibleCaptureTargets.black;
                    validMoves = calculateValidMovesForRook(row, col, validCaptureTargets).concat(calculateValidMovesForBishop(row, col, validCaptureTargets));
                }
                break;
            case 'k':
                // Logic for king movement
                if (piece === 'K') {
                    const validCaptureTargets = possibleCaptureTargets.white;
                    validMoves = calculateValidMovesForKing(row, col, validCaptureTargets);
                } else {
                    const validCaptureTargets = possibleCaptureTargets.black;
                    validMoves = calculateValidMovesForKing(row, col, validCaptureTargets);
                }
                break;
                break;
            default:
                break;
        }

        return validMoves;
    }

    function calculateValidMovesForPawn(row, col, piece, possibleCaptureTargets) {
        let validMovesForPawn = [];
        let targetPiece = null;

        if (piece === 'P') {
            let validCaptureTargets = possibleCaptureTargets.white;
            // Check if the square in front is empty
            if (row > 0 && !board[row - 1][col]) {
                validMovesForPawn.push({ row: row - 1, col });

                // Check if it's the pawn's initial move and the two squares in front are empty
                if (row === 6 && !board[row - 2][col]) {
                    validMovesForPawn.push({ row: row - 2, col });
                }
            }

            // Check if there's a diagonal capture to the right
            if (row > 0 && col < 7) {
                targetPiece = board[row - 1][col + 1];
                if (targetPiece && validCaptureTargets.includes(targetPiece)) {
                    validMovesForPawn.push({ row: row - 1, col: col + 1 });
                    console.log("capture found!");
                }
            }

            // Check if there's a diagonal capture to the left
            if (row > 0 && col > 0) {
                targetPiece = board[row - 1][col - 1];
                if (targetPiece && validCaptureTargets.includes(targetPiece)) {
                    validMovesForPawn.push({ row: row - 1, col: col - 1 });
                    console.log("capture found!");
                }
            }
        }
        // Pawn movement for black (moving downwards)
        else if (piece === 'p') {
            let validCaptureTargets = possibleCaptureTargets.black;
            // Check if the square in front is empty
            if (row < 7 && !board[row + 1][col]) {
                validMovesForPawn.push({ row: row + 1, col });

                // Check if it's the pawn's initial move and the two squares in front are empty
                if (row === 1 && !board[row + 2][col]) {
                    validMovesForPawn.push({ row: row + 2, col });
                }
            }

            // Check if there's a diagonal capture to the right
            if (row < 7 && col < 7) {
                targetPiece = board[row + 1][col + 1];
                if (targetPiece && validCaptureTargets.includes(targetPiece)) {
                    validMovesForPawn.push({ row: row + 1, col: col + 1 });
                    console.log("capture found!");
                }
            }

            // Check if there's a diagonal capture to the left
            if (row < 7 && col > 0) {
                targetPiece = board[row + 1][col - 1];
                if (targetPiece && validCaptureTargets.includes(targetPiece)) {
                    validMovesForPawn.push({ row: row + 1, col: col - 1 });
                    console.log("capture found!");
                }
            }
        }

        console.log(validMovesForPawn);
        return validMovesForPawn;
    }

    function calculateValidMovesForKnight(row, col, validCaptureTargets) {
        const validMovesForKnight = [];

        const knightMoves = [
            { row: -2, col: -1 },
            { row: -2, col: 1 },
            { row: -1, col: -2 },
            { row: -1, col: 2 },
            { row: 1, col: -2 },
            { row: 1, col: 2 },
            { row: 2, col: -1 },
            { row: 2, col: 1 }
        ];

        for (const move of knightMoves) {
            const newRow = row + move.row;
            const newCol = col + move.col;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForKnight.push({ row: newRow, col: newCol });
            }
        }

        console.log(validMovesForKnight);
        return validMovesForKnight;
    }

    function calculateValidMovesForBishop(row, col, validCaptureTargets) {
        const validMovesForBishop = [];

        // Check diagonally to the top-right
        let i = 1;
        while (row - i >= 0 && col + i < 8) {
            const newRow = row - i;
            const newCol = col + i;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForBishop.push({ row: newRow, col: newCol });
                if (board[newRow][newCol]) {
                    break; // Stop if capturing a piece
                }
            } else {
                break; // Stop if blocked by a piece of the same color
            }

            i++;
        }

        // Check diagonally to the top-left
        i = 1;
        while (row - i >= 0 && col - i >= 0) {
            const newRow = row - i;
            const newCol = col - i;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForBishop.push({ row: newRow, col: newCol });
                if (board[newRow][newCol]) {
                    break; // Stop if capturing a piece
                }
            } else {
                break; // Stop if blocked by a piece of the same color
            }

            i++;
        }

        // Check diagonally to the bottom-right
        i = 1;
        while (row + i < 8 && col + i < 8) {
            const newRow = row + i;
            const newCol = col + i;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForBishop.push({ row: newRow, col: newCol });
                if (board[newRow][newCol]) {
                    break; // Stop if capturing a piece
                }
            } else {
                break; // Stop if blocked by a piece of the same color
            }

            i++;
        }

        // Check diagonally to the bottom-left
        i = 1;
        while (row + i < 8 && col - i >= 0) {
            const newRow = row + i;
            const newCol = col - i;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForBishop.push({ row: newRow, col: newCol });
                if (board[newRow][newCol]) {
                    break; // Stop if capturing a piece
                }
            } else {
                break; // Stop if blocked by a piece of the same color
            }

            i++;
        }

        return validMovesForBishop;
    }

    function calculateValidMovesForRook(row, col, validCaptureTargets) {
        const validMovesForRook = [];

        // Check vertically upwards
        let i = 1;
        while (row - i >= 0) {
            const newRow = row - i;
            const newCol = col;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForRook.push({ row: newRow, col: newCol });
                if (board[newRow][newCol]) {
                    break; // Stop if capturing a piece
                }
            } else {
                break; // Stop if blocked by a piece of the same color
            }

            i++;
        }

        // Check vertically downwards
        i = 1;
        while (row + i < 8) {
            const newRow = row + i;
            const newCol = col;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForRook.push({ row: newRow, col: newCol });
                if (board[newRow][newCol]) {
                    break; // Stop if capturing a piece
                }
            } else {
                break; // Stop if blocked by a piece of the same color
            }

            i++;
        }

        // Check horizontally to the right
        i = 1;
        while (col + i < 8) {
            const newRow = row;
            const newCol = col + i;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForRook.push({ row: newRow, col: newCol });
                if (board[newRow][newCol]) {
                    break; // Stop if capturing a piece
                }
            } else {
                break; // Stop if blocked by a piece of the same color
            }

            i++;
        }

        // Check horizontally to the left
        i = 1;
        while (col - i >= 0) {
            const newRow = row;
            const newCol = col - i;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForRook.push({ row: newRow, col: newCol });
                if (board[newRow][newCol]) {
                    break; // Stop if capturing a piece
                }
            } else {
                break; // Stop if blocked by a piece of the same color
            }

            i++;
        }

        return validMovesForRook;
    }

    function calculateValidMovesForKing(row, col, validCaptureTargets) {
        const validMovesForKing = [];

        const directions = [
            { row: -1, col: -1 }, // Top left
            { row: -1, col: 0 }, // Top
            { row: -1, col: 1 }, // Top right
            { row: 0, col: -1 }, // Left
            { row: 0, col: 1 }, // Right
            { row: 1, col: -1 }, // Bottom left
            { row: 1, col: 0 }, // Bottom
            { row: 1, col: 1 }, // Bottom right
        ];

        for (const direction of directions) {
            const newRow = row + direction.row;
            const newCol = col + direction.col;

            if (isMoveSquareAvailable(newRow, newCol, validCaptureTargets)) {
                validMovesForKing.push({ row: newRow, col: newCol });
            }
        }

        return validMovesForKing;
    }


    function isMoveSquareAvailable(row, col, validCaptureTargets) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) {
            return false; // Out of bounds
        }

        const targetPiece = board[row][col];

        if (!targetPiece) {
            return true; // Empty square
        }

        return validCaptureTargets.includes(targetPiece);
    }

    function isValidMove(row, col) {
        console.log("checking if move is valid");
        return validMoves.some(move => move.row === row && move.col === col);
    }

    function movePiece(fromRow, fromCol, toRow, toCol) {
        console.log("moving piece");

        console.log("board before move: ", board);
        const piece = board[fromRow][fromCol];
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = '';
        console.log("board after move: ", board);

        const fromSquare = chessboardGrid.children[fromRow * 8 + fromCol];
        const toSquare = chessboardGrid.children[toRow * 8 + toCol];
        console.log("From Square:", fromSquare);
        console.log("To Square:", toSquare);

        console.log("Before Move - From Square:", fromSquare.innerHTML);
        console.log("Before Move - To Square:", toSquare.innerHTML);

        toSquare.innerHTML = fromSquare.innerHTML;
        fromSquare.innerHTML = '';

        console.log("After Move - From Square:", fromSquare.innerHTML);
        console.log("After Move - To Square:", toSquare.innerHTML);

    }

    function highlightValidMoves(moves) {
        console.log("highlighting valid moves");
        moves.forEach(move => {
            const { row, col } = move;
            const square = chessboardGrid.children[row * 8 + col];
            square.classList.add('valid-move');
        });
    }

    function clearHighlights() {
        const squares = chessboardGrid.children;
        Array.from(squares).forEach(square => {
            square.classList.remove('valid-move');
        });
    }

    async function implementTheirMove() {
        const theirMoveObject = await JSON.parse(theirCurrentMove);
        const fromRow = theirMoveObject.fromRow;
        const fromCol = theirMoveObject.fromCol;
        const toRow = theirMoveObject.toRow;
        const toCol = theirMoveObject.toCol;

        movePiece(fromRow, fromCol, toRow, toCol);
    }

});