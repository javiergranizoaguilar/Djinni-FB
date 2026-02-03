import React, { useState } from 'react';
import { Stage, Layer, Circle, Text } from 'react-konva';
import axios from 'axios';
export default function VttBoard() {
    // Estado para la posición de la ficha
    const [tokenPos, setTokenPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

    return (
        // Stage es la "Mesa de juego"
        <Stage width={window.innerWidth} height={window.innerHeight} style={{ background: '#2c3e50' }}>
            <Layer>
                <Text text="Arrastra la ficha roja" x={20} y={20} fill="white" fontSize={24} />

                {/* Tu Ficha (Token) */}
                <Circle
                    x={tokenPos.x}
                    y={tokenPos.y}
                    radius={30}
                    fill="red"
                    shadowBlur={5}
                    draggable // ¡Esto activa el Drag & Drop mágico de Konva!
                    onDragEnd={(e) => {
                        // Cuando sueltas la ficha, actualizamos su posición
                        setTokenPos({ x: e.target.x(), y: e.target.y() });
                        console.log("Nueva posición:", e.target.x(), e.target.y());
                        // Aquí en el futuro avisaremos a Symfony del movimiento
                        const newX = e.target.x();
                        const newY = e.target.y();
                        setTokenPos({ x: newX, y: newY });

                        // Enviar a Symfony
                        axios.post('http://127.0.0.1:8000/api/mover-token', {
                            x: newX,
                            y: newY
                        }).then(response => console.log("Symfony guardó el movimiento!"));
                    }}
                />
            </Layer>

        </Stage>

    );
}