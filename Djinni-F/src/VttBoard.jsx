import React, { useState, useEffect } from 'react';
import { Stage, Layer, Circle, Text, Rect } from 'react-konva';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export default function VttBoard() {
    const { gameId } = useParams();
    const [scene, setScene] = useState(null);
    const [error, setError] = useState(null);

    // --- FIX: Use default values while scene is loading ---
    const gridWidth = scene?.grid_width || 10;
    const gridHeight = scene?.grid_height || 10;
    const squareSize = 50;
    const boardPixelWidth = gridWidth * squareSize;
    const boardPixelHeight = gridHeight * squareSize;

    const boardX = Math.floor((window.innerWidth - boardPixelWidth) / 2);
    const boardY = Math.floor((window.innerHeight - boardPixelHeight) / 2);
    // --- END FIX ---

    const [tokenPos, setTokenPos] = useState({
        x: boardX + squareSize / 2,
        y: boardY + squareSize / 2
    });

    useEffect(() => {
        const fetchScene = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/scene/api/game/${gameId}/active-scene`, { withCredentials: true });
                setScene(response.data);
                console.log("Scene data loaded:", response.data);
            } catch (err) {
                console.error("Failed to fetch scene data:", err);
                setError('Failed to load scene. Does this game have a scene?');
            }
        };

        if (gameId) {
            fetchScene();
        }
    }, [gameId]);

    // --- FIX: Always render the grid, even during load ---
    const squares = [];
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
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
    // --- END FIX ---

    return (
        <Stage width={window.innerWidth} height={window.innerHeight} style={{ background: '#2c3e50' }}>
            <Layer>
                <Text
                    text={scene ? `Scene: ${scene.name}` : 'Loading scene...'}
                    x={20}
                    y={20}
                    fill="white"
                    fontSize={24}
                />
                {error && <Text text={error} x={20} y={50} fill="red" fontSize={18} />}

                {squares}

                <Circle
                    x={tokenPos.x}
                    y={tokenPos.y}
                    radius={squareSize / 2 - 5}
                    fill="red"
                    shadowBlur={5}
                    draggable
                    onDragEnd={(e) => {
                        const newX = e.target.x();
                        const newY = e.target.y();

                        const col = Math.round((newX - boardX - squareSize / 2) / squareSize);
                        const row = Math.round((newY - boardY - squareSize / 2) / squareSize);

                        const snappedX = boardX + col * squareSize + squareSize / 2;
                        const snappedY = boardY + row * squareSize + squareSize / 2;

                        const constrainedX = Math.max(boardX + squareSize / 2, Math.min(snappedX, boardX + boardPixelWidth - squareSize / 2));
                        const constrainedY = Math.max(boardY + squareSize / 2, Math.min(snappedY, boardY + boardPixelHeight - squareSize / 2));

                        setTokenPos({ x: constrainedX, y: constrainedY });

                        e.target.position({ x: constrainedX, y: constrainedY });
                        e.target.getLayer().batchDraw();

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
