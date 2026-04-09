import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Circle, Rect } from 'react-konva';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import SceneSelector from './ingame/SceneSelector.jsx';
import TokenSpawner from './ingame/TokenSpawner.jsx';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const HEADER_H  = 80;
const TOOLBAR_H = 44;
const SIDEBAR_W = 200;
const ZOOM_MIN  = 0.2;
const ZOOM_MAX  = 4;
const ZOOM_STEP = 1.12;

function authHeaders() {
    const token = localStorage.getItem('vtt_token');
    return { Authorization: `Bearer ${token}` };
}

const LAYERS = [
    { id: 'background', label: 'Background' },
    { id: 'user',       label: 'User' },
    { id: 'gm',         label: 'GM', dmOnly: true },
];

const colorMap = {
    red:    '#FF0000',
    blue:   '#0000FF',
    green:  '#00FF00',
    yellow: '#FFFF00',
};

export default function VttBoard() {
    const { id: gameId } = useParams();
    const [scene,       setScene]       = useState(null);
    const [error,       setError]       = useState(null);
    const [isDm,        setIsDm]        = useState(false);
    const [sceneItems,  setSceneItems]  = useState([]);
    const [activeLayer, setActiveLayer] = useState('user');
    const [zoom,        setZoom]        = useState(1);   // solo para mostrar en UI

    const stageRef   = useRef(null);
    const isPanning  = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });

    const gridWidth        = scene?.grid_width  || 10;
    const gridHeight       = scene?.grid_height || 10;
    const squareSize       = 50;
    const boardPixelWidth  = gridWidth  * squareSize;
    const boardPixelHeight = gridHeight * squareSize;

    const availableW = window.innerWidth  - SIDEBAR_W;
    const availableH = window.innerHeight - HEADER_H - TOOLBAR_H;
    const boardX = SIDEBAR_W + Math.floor((availableW - boardPixelWidth)  / 2);
    const boardY = HEADER_H + TOOLBAR_H + Math.floor((availableH - boardPixelHeight) / 2);

    // ── PAN con botón central del ratón ──────────────────────────────────────
    const handleMouseDown = (e) => {
        if (e.button !== 1) return;
        e.preventDefault();
        isPanning.current  = true;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        if (!isPanning.current) return;
        const stage = stageRef.current;
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        stage.position({ x: stage.x() + dx, y: stage.y() + dy });
        stage.batchDraw();
    };

    const handleMouseUp = (e) => {
        if (e.button === 1) isPanning.current = false;
    };

    // ── ZOOM con rueda del ratón ──────────────────────────────────────────────
    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage    = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer  = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const direction = e.evt.deltaY < 0 ? 1 : -1;
        const newScale  = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldScale * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP)));

        stage.scale({ x: newScale, y: newScale });
        stage.position({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
        stage.batchDraw();
        setZoom(newScale);
    };

    const applyZoom = (factor) => {
        const stage    = stageRef.current;
        const oldScale = stage.scaleX();
        const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldScale * factor));

        // Zoom centrado en el centro del área visible
        const cx = SIDEBAR_W + availableW / 2;
        const cy = HEADER_H + TOOLBAR_H + availableH / 2;
        const mousePointTo = {
            x: (cx - stage.x()) / oldScale,
            y: (cy - stage.y()) / oldScale,
        };

        stage.scale({ x: newScale, y: newScale });
        stage.position({
            x: cx - mousePointTo.x * newScale,
            y: cy - mousePointTo.y * newScale,
        });
        stage.batchDraw();
        setZoom(newScale);
    };

    const resetZoom = () => {
        const stage = stageRef.current;
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
        setZoom(1);
    };

    // ── Datos ─────────────────────────────────────────────────────────────────
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
                setError('No se pudo cargar la escena. ¿Esta partida tiene una escena?');
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

    // ── Drop desde el panel lateral ───────────────────────────────────────────
    const handleDrop = async (e) => {
        e.preventDefault();
        if (!scene) return;
        const tokenType = e.dataTransfer.getData('tokenType');
        if (!tokenType) return;

        // Convertir coordenadas de pantalla a coordenadas del stage (con zoom/pan)
        const stage    = stageRef.current;
        const scale    = stage.scaleX();
        const stagePos = stage.position();
        const stageX   = (e.clientX - stagePos.x) / scale;
        const stageY   = (e.clientY - stagePos.y) / scale;

        let col = Math.round((stageX - boardX - squareSize / 2) / squareSize);
        let row = Math.round((stageY - boardY - squareSize / 2) / squareSize);
        col = Math.max(0, Math.min(col, gridWidth  - 1));
        row = Math.max(0, Math.min(row, gridHeight - 1));

        try {
            const res = await axios.post(`${API}/api/scene-token/scene/${scene.id}`, {
                col, row, layer: activeLayer, color: tokenType
            }, { headers: authHeaders() });
            setSceneItems(prev => [...prev, res.data]);
        } catch (err) {
            console.error('Failed to create token:', err);
        }
    };

    // ── Mover token dentro del tablero ────────────────────────────────────────
    const handleDragEndItem = async (e, item) => {
        let col = Math.round((e.target.x() - boardX - squareSize / 2) / squareSize);
        let row = Math.round((e.target.y() - boardY - squareSize / 2) / squareSize);
        col = Math.max(0, Math.min(col, gridWidth  - 1));
        row = Math.max(0, Math.min(row, gridHeight - 1));

        e.target.position({
            x: boardX + col * squareSize + squareSize / 2,
            y: boardY + row * squareSize + squareSize / 2,
        });
        e.target.getLayer().batchDraw();

        setSceneItems(prev => prev.map(i => i.id === item.id ? { ...i, col, row } : i));

        try {
            await axios.put(`${API}/api/scene-token/${item.id}`, { col, row }, {
                headers: authHeaders()
            });
        } catch (err) {
            console.error('Failed to update token position:', err);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const renderGrid = () => {
        const squares = [];
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                squares.push(
                    <Rect
                        key={`g-${x}-${y}`}
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

    const getX       = (item) => boardX + (item.col || 0) * squareSize + squareSize / 2;
    const getY       = (item) => boardY + (item.row || 0) * squareSize + squareSize / 2;
    const canDrag    = (item) => item.layer === activeLayer;
    const getOpacity = (item) => item.layer === activeLayer ? 1 : 0.35;

    const backgroundItems = sceneItems.filter(i => i.layer === 'background');
    const userItems       = sceneItems.filter(i => i.layer === 'user');
    const gmItems         = sceneItems.filter(i => i.layer === 'gm');

    const renderToken = (item) => (
        <Circle
            key={item.id}
            x={getX(item)}
            y={getY(item)}
            radius={squareSize / 2 - 5}
            fill={colorMap[item.color] || 'gray'}
            opacity={getOpacity(item)}
            shadowBlur={item.layer === 'user' ? 5 : 0}
            draggable={canDrag(item)}
            onDragEnd={(e) => handleDragEndItem(e, item)}
        />
    );

    const zoomPct = Math.round(zoom * 100);

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { isPanning.current = false; }}
            style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
        >
            {/* ── CANVAS ── */}
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                style={{ background: '#2c3e50', position: 'absolute', top: 0, left: 0 }}
                ref={stageRef}
                onWheel={handleWheel}
            >
                <Layer name="grid">{renderGrid()}</Layer>
                <Layer name="background">{backgroundItems.map(renderToken)}</Layer>
                <Layer name="user">{userItems.map(renderToken)}</Layer>
                {isDm && <Layer name="gm">{gmItems.map(renderToken)}</Layer>}
            </Stage>

            {/* ── TOOLBAR ── */}
            <div style={{
                position: 'absolute', top: HEADER_H, left: 0, right: 0,
                height: TOOLBAR_H, zIndex: 20,
                background: 'rgba(15, 23, 42, 0.95)',
                borderBottom: '1px solid #2d3e50',
                display: 'flex', alignItems: 'center',
                padding: '0 12px', gap: 8,
            }}>
                <SceneSelector onSceneSelect={handleSceneSelect} onSceneUpdated={handleSceneUpdated} />

                <span style={{
                    flex: 1, textAlign: 'center', color: '#e2e8f0',
                    fontWeight: 600, fontSize: 14,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {scene ? scene.name : 'Cargando escena…'}
                </span>

                {/* Controles de zoom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => applyZoom(1 / ZOOM_STEP)} style={zoomBtnStyle}>−</button>
                    <span
                        onClick={resetZoom}
                        title="Restablecer zoom"
                        style={{ color: '#94a3b8', fontSize: 12, minWidth: 38, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                    >
                        {zoomPct}%
                    </span>
                    <button onClick={() => applyZoom(ZOOM_STEP)} style={zoomBtnStyle}>+</button>
                </div>

                {/* Capas */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: 12, marginRight: 4 }}>Capa:</span>
                    {LAYERS.filter(l => !l.dmOnly || isDm).map(l => (
                        <button
                            key={l.id}
                            onClick={() => setActiveLayer(l.id)}
                            style={{
                                padding: '4px 10px', borderRadius: 4, fontSize: 12,
                                fontWeight: activeLayer === l.id ? 700 : 400,
                                background: activeLayer === l.id ? '#3b82f6' : '#334155',
                                color: 'white', border: 'none', cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── PANEL IZQUIERDO ── */}
            <div style={{
                position: 'absolute',
                top: HEADER_H + TOOLBAR_H, left: 0,
                width: SIDEBAR_W, bottom: 0,
                zIndex: 10,
                background: 'rgba(15, 23, 42, 0.85)',
                borderRight: '1px solid #2d3e50',
                overflowY: 'auto',
            }}>
                <TokenSpawner />
            </div>

            {/* ── ERROR ── */}
            {error && (
                <div style={{
                    position: 'absolute',
                    top: HEADER_H + TOOLBAR_H + 12,
                    left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(185, 28, 28, 0.92)',
                    color: 'white', padding: '8px 20px',
                    borderRadius: 8, zIndex: 30, fontSize: 14,
                }}>
                    {error}
                </div>
            )}
        </div>
    );
}

const zoomBtnStyle = {
    width: 26, height: 26,
    borderRadius: 4,
    background: '#334155',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
};
