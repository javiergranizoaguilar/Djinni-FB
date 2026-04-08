import React, { useState, useEffect } from 'react';
import { Stage, Layer, Circle, Text, Rect, Group } from 'react-konva';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import SceneSelector from './ingame/SceneSelector.jsx'; // Importar el nuevo componente

export default function VttBoard() {
    const { id } = useParams(); // changed from gameId to id to match App.jsx route usually if gameId is not found
    const gameId = useParams().gameId || useParams().id; // support both
    const [scene, setScene] = useState(null);
    const [error, setError] = useState(null);
    const [isDm, setIsDm] = useState(false);

    // Estado para saber en qué capa estamos trabajando
    const [activeLayer, setActiveLayer] = useState('user');

    // Estado para los elementos de la escena
    const [sceneItems, setSceneItems] = useState([]);

    // --- FIX: Use default values while scene is loading ---
    const gridWidth = scene?.grid_width || 10;
    const gridHeight = scene?.grid_height || 10;
    const squareSize = 50;
    const boardPixelWidth = gridWidth * squareSize;
    const boardPixelHeight = gridHeight * squareSize;

    const boardX = Math.floor((window.innerWidth - boardPixelWidth) / 2);
    const boardY = Math.floor((window.innerHeight - boardPixelHeight) / 2);
    // --- END FIX ---

    // Posición del token de prueba
    const [tokenPos, setTokenPos] = useState({
        x: boardX + squareSize / 2,
        y: boardY + squareSize / 2
    });

    useEffect(() => {
        const fetchScene = async () => {
            try {
                const token = localStorage.getItem('vtt_token');
                const response = await axios.get(`http://127.0.0.1:8000/scene/api/game/${gameId}/active-scene`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setScene(response.data);
                setIsDm(response.data.is_dm || false);
                
                // Si la escena tiene elementos guardados, los cargamos
                if (response.data.data_json) {
                     setSceneItems(response.data.data_json);
                } else {
                     // Si no hay nada guardado, iniciamos con un arreglo vacío
                     setSceneItems([]);
                }
                
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

    // Función para cambiar la escena
    const handleSceneSelect = (newScene) => {
        // Al seleccionar una escena desde el selector, volvemos a llamar a la API
        // para asegurarnos de traer los items (data_json) y saber si somos GM.
        const fetchNewSceneData = async () => {
             try {
                const token = localStorage.getItem('vtt_token');
                const response = await axios.get(`http://127.0.0.1:8000/scene/api/game/${gameId}/active-scene`, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                 setScene(newScene);
             } catch(err) {
                 console.log(err);
             }
        };
        fetchNewSceneData();
    };

    // Función para actualizar la escena actual si se editó
    const handleSceneUpdated = (updatedScene) => {
        if (scene && scene.id === updatedScene.id) {
            setScene({...scene, ...updatedScene});
        }
    };

    // Renderizado del grid en el fondo
    const renderGrid = () => {
        const squares = [];
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                squares.push(
                    <Rect
                        key={`grid-${x}-${y}`}
                        x={boardX + x * squareSize}
                        y={boardY + y * squareSize}
                        width={squareSize}
                        height={squareSize}
                        fill="#ecf0f1"
                        stroke="#bdc3c7"
                        strokeWidth={1}
                    />
                );
            }
        }
        return squares;
    };

    // Separar los items de la escena por capa
    const backgroundItems = sceneItems.filter(item => item.layer === 'background');
    const userItems = sceneItems.filter(item => item.layer === 'user');
    const gmItems = sceneItems.filter(item => item.layer === 'gm');

    return (
        <>
            <SceneSelector onSceneSelect={handleSceneSelect} onSceneUpdated={handleSceneUpdated} />
            
            {/* Controles para cambiar de capa activa */}
            <div style={{ position: 'absolute', top: 80, right: 20, background: '#34495e', padding: 10, zIndex: 10, borderRadius: 5, color: 'white' }}>
                <p className="font-bold mb-2 text-center text-sm">Active Layer</p>
                <div className="flex flex-col space-y-2">
                    <button 
                        onClick={() => setActiveLayer('background')}
                        className={`px-3 py-1 rounded text-sm ${activeLayer === 'background' ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                    >
                        Background
                    </button>
                    <button 
                        onClick={() => setActiveLayer('user')}
                        className={`px-3 py-1 rounded text-sm ${activeLayer === 'user' ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                    >
                        User
                    </button>
                    {isDm && (
                        <button 
                            onClick={() => setActiveLayer('gm')}
                            className={`px-3 py-1 rounded text-sm ${activeLayer === 'gm' ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                        >
                            GM (Hidden)
                        </button>
                    )}
                </div>
            </div>

            <Stage width={window.innerWidth} height={window.innerHeight} style={{ background: '#2c3e50' }}>
                {/* CAPA 1: BACKGROUND (Fondo) */}
                <Layer name="backgroundLayer">
                    {/* El Grid siempre va en el fondo */}
                    {renderGrid()}
                    
                    {/* Renderizar items que el GM haya marcado como 'background' (ej. imágenes de mapas) */}
                    {backgroundItems.map((item, i) => (
                        <Rect key={`bg-${i}`} x={item.x} y={item.y} width={50} height={50} fill="green" />
                    ))}
                </Layer>

                {/* CAPA 2: USUARIOS (Tokens públicos) */}
                <Layer name="userLayer">
                    <Text
                        text={scene ? `Scene: ${scene.name} | Layer: ${activeLayer.toUpperCase()}` : 'Loading scene...'}
                        x={20}
                        y={20}
                        fill="white"
                        fontSize={24}
                    />
                    {error && <Text text={error} x={20} y={50} fill="red" fontSize={18} />}

                    {/* Elementos guardados en la capa de usuario */}
                    {userItems.map((item, i) => (
                        <Circle key={`usr-${i}`} x={item.x} y={item.y} radius={20} fill="blue" />
                    ))}

                    {/* Token interactivo de prueba */}
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

                {/* CAPA 3: GM (Solo visible si eres el director del juego) */}
                {isDm && (
                    <Layer name="gmLayer">
                        {/* Nota visual para saber qué es la capa GM */}
                        {activeLayer === 'gm' && (
                            <Text text="Editing GM Layer" x={20} y={window.innerHeight - 40} fill="red" fontSize={20} opacity={0.7} />
                        )}
                        
                        {/* Renderizar items ocultos (monstruos, trampas) */}
                        {gmItems.map((item, i) => (
                            <Group key={`gm-${i}`} x={item.x} y={item.y} opacity={0.5} draggable>
                                <Rect width={squareSize} height={squareSize} fill="black" stroke="red" strokeWidth={2} />
                                <Text text="Trap" fill="white" x={5} y={15} />
                            </Group>
                        ))}
                    </Layer>
                )}
            </Stage>
        </>
    );
}
