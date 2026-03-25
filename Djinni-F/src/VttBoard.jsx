import React, { useState } from 'react';
import { Stage, Layer, Circle, Text, Rect } from 'react-konva';
import axios from 'axios';

export default function VttBoard() {
    const gridSize = 10;
    const squareSize = 50;
    const boardSize = gridSize * squareSize;

    // Center the board on the screen
    const boardX = (window.innerWidth - boardSize) / 2;
    const boardY = (window.innerHeight - boardSize) / 2;

    // Initial token position at the center of the first square
    const [tokenPos, setTokenPos] = useState({
        x: boardX + squareSize / 2,
        y: boardY + squareSize / 2
    });

    const squares = [];
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            squares.push(
                <Rect
                    key={`${x}-${y}`}
                    x={boardX + x * squareSize}
                    y={boardY + y * squareSize}
                    width={squareSize}
                    height={squareSize}
                    fill="#ecf0f1"
                    stroke="black"
                    strokeWidth={1}
                />
            );
        }
    }

    return (
        <Stage width={window.innerWidth} height={window.innerHeight} style={{ background: '#2c3e50' }}>
            <Layer>
                <Text text="Arrastra la ficha roja" x={20} y={20} fill="white" fontSize={24} />

                {/* Render the board */}
                {squares}

                {/* Your Token */}
                <Circle
                    x={tokenPos.x}
                    y={tokenPos.y}
                    radius={squareSize / 2 - 5} // Make token slightly smaller than square
                    fill="red"
                    shadowBlur={5}
                    draggable
                    onDragEnd={(e) => {
                        const newX = e.target.x();
                        const newY = e.target.y();

                        // Snap to grid logic
                        const snappedX = Math.round((newX - boardX - squareSize / 2) / squareSize) * squareSize + boardX + squareSize / 2;
                        const snappedY = Math.round((newY - boardY - squareSize / 2) / squareSize) * squareSize + boardY + squareSize / 2;

                        // Constrain to board boundaries
                        const constrainedX = Math.max(boardX + squareSize / 2, Math.min(snappedX, boardX + boardSize - squareSize / 2));
                        const constrainedY = Math.max(boardY + squareSize / 2, Math.min(snappedY, boardY + boardSize - squareSize / 2));

                        setTokenPos({ x: constrainedX, y: constrainedY });

                        console.log("Nueva posición:", constrainedX, constrainedY);

                        axios.post('http://127.0.0.1:8000/api/mover-token', {
                            x: constrainedX,
                            y: constrainedY
                        }).then(response => console.log("Symfony guardó el movimiento!"));
                    }}
                />
            </Layer>
        </Stage>
    );
}
