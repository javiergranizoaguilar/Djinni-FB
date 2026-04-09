import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Circle, Text, Rect } from 'react-konva';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import SceneSelector from './ingame/SceneSelector.jsx';
import TokenSpawner from './ingame/TokenSpawner.jsx';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function authHeaders() {
    const token = localStorage.getItem('vtt_token');
    return { Authorization: `Bearer ${token}` };
}

export default function VttBoard() {
    const { gameId } = useParams();
    const [scene, setScene] = useState(null);
    const [error, setError] = useState(null);
    const [isDm, setIsDm] = useState(false);
    const [sceneItems, setSceneItems] = useState([]);
    const [activeLayer, setActiveLayer] = useState('user');

    const stageRef = useRef(null);

    const gridWidth = scene?.grid_width || 10;
    const gridHeight = scene?.grid_height || 10;
    const squareSize = 50;
    const boardPixelWidth = gridWidth * squareSize;
    const boardPixelHeight = gridHeight * squareSize;
    const boardX = Math.floor((window.innerWidth - boardPixelWidth) / 2);
    const boardY = Math.floor((window.innerHeight - boardPixelHeight) / 2);

    const fetchTokens = async (sceneId) => {
        try {
            const res = await axios.get(`${API}/api/scene-token/scene/${sceneId}`, {
                headers: authHeaders()
            });
            setSceneItems(res.data);
        } catch (err) {
            console.error('Failed to fetch tokens:', err);
        }
    };

    useEffect(() => {
        if (!gameId) return;
        const fetchScene = async () => {
            try {
                const res = await axios.get(`${API}/scene/api/game/${gameId}/active-scene`, {
                    headers: authHeaders()
                });
                setScene(res.data);
                setIsDm(res.data.is_dm || false);
                await fetchTokens(res.data.id);
            } catch (err) {
                console.error('Failed to fetch scene:', err);
                setError('Failed to load scene. Does this game have a scene?');
            }
        };
        fetchScene();
    }, [gameId]);

    const handleSceneSelect = async (newScene) => {
        setScene(newScene);
        setSceneItems([]);
        await fetchTokens(newScene.id);
    };

    const handleSceneUpdated = (updatedScene) => {
        if (scene && scene.id === updatedScene.id) {
            setScene(prev => ({ ...prev, ...updatedScene }));
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        if (!scene) return;

        const tokenType = e.dataTransfer.getData('tokenType');
        if (!tokenType) return;

        let col = Math.round((e.clientX - boardX - squareSize / 2) / squareSize);
        let row = Math.round((e.clientY - boardY - squareSize / 2) / squareSize);
        col = Math.max(0, Math.min(col, gridWidth - 1));
        row = Math.max(0, Math.min(row, gridHeight - 1));

        try {
            const res = await axios.post(`${API}/api/scene-token/scene/${scene.id}`, {
                col,
                row,
                layer: activeLayer,
                color: tokenType
            }, { headers: authHeaders() });

            setSceneItems(prev => [...prev, res.data]);
        } catch (err) {
            console.error('Failed to create token:', err);
        }
    };

    const handleDragEndItem = async (e, item) => {
        const newX = e.target.x();
        const newY = e.target.y();

        let col = Math.round((newX - boardX - squareSize / 2) / squareSize);
        let row = Math.round((newY - boardY - squareSize / 2) / squareSize);
        col = Math.max(0, Math.min(col, gridWidth - 1));
        row = Math.max(0, Math.min(row, gridHeight - 1));

        const constrainedX = boardX + col * squareSize + squareSize / 2;
        const constrainedY = boardY + row * squareSize + squareSize / 2;
        e.target.position({ x: constrainedX, y: constrainedY });
        e.target.getLayer().batchDraw();

        setSceneItems(prev =>
            prev.map(i => i.id === item.id ? { ...i, col, row } : i)
        );

        try {
            await axios.put(`${API}/api/scene-token/${item.id}`, { col, row }, {
                headers: authHeaders()
            });
        } catch (err) {
            console.error('Failed to update token position:', err);
        }
    };

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

    const colorMap = {
        red: '#FF0000',
        blue: '#0000FF',
        green: '#00FF00',
        yellow: '#FFFF00'
    };

    const getX = (item) => boardX + (item.col || 0) * squareSize + squareSize / 2;
    const getY = (item) => boardY + (item.row || 0) * squareSize + squareSize / 2;

    const canDrag = (item) => isDm || item.layer === activeLayer;

    const backgroundItems = sceneItems.filter(i => i.layer === 'background');
    const userItems = sceneItems.filter(i => i.layer === 'user');
    const gmItems = sceneItems.filter(i => i.layer === 'gm');

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
        >
            <SceneSelector onSceneSelect={handleSceneSelect} onSceneUpdated={handleSceneUpdated} />
            <TokenSpawner />

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

            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                style={{ background: '#2c3e50' }}
                ref={stageRef}
            >
                {/* CAPA 1: BACKGROUND */}
                <Layer name="backgroundLayer">
                    {renderGrid()}
                    {backgroundItems.map(item => (
                        <Circle
                            key={item.id}
                            x={getX(item)}
                            y={getY(item)}
                            radius={squareSize / 2 - 5}
                            fill={colorMap[item.color] || 'gray'}
                            draggable={canDrag(item)}
                            onDragEnd={(e) => handleDragEndItem(e, item)}
                        />
                    ))}
                </Layer>

                {/* CAPA 2: USUARIOS */}
                <Layer name="userLayer">
                    <Text
                        text={scene ? `Scene: ${scene.name} | Layer: ${activeLayer.toUpperCase()}` : 'Loading scene...'}
                        x={20}
                        y={20}
                        fill="white"
                        fontSize={24}
                    />
                    {error && <Text text={error} x={20} y={50} fill="red" fontSize={18} />}
                    {userItems.map(item => (
                        <Circle
                            key={item.id}
                            x={getX(item)}
                            y={getY(item)}
                            radius={squareSize / 2 - 5}
                            fill={colorMap[item.color] || 'gray'}
                            shadowBlur={5}
                            draggable={canDrag(item)}
                            onDragEnd={(e) => handleDragEndItem(e, item)}
                        />
                    ))}
                </Layer>

                {/* CAPA 3: GM (solo visible para el DM) */}
                {isDm && (
                    <Layer name="gmLayer">
                        {activeLayer === 'gm' && (
                            <Text text="Editing GM Layer" x={20} y={window.innerHeight - 40} fill="red" fontSize={20} opacity={0.7} />
                        )}
                        {gmItems.map(item => (
                            <Circle
                                key={item.id}
                                x={getX(item)}
                                y={getY(item)}
                                radius={squareSize / 2 - 5}
                                fill={colorMap[item.color] || 'gray'}
                                opacity={0.5}
                                draggable={activeLayer === 'gm'}
                                onDragEnd={(e) => handleDragEndItem(e, item)}
                            />
                        ))}
                    </Layer>
                )}
            </Stage>
        </div>
    );
}
