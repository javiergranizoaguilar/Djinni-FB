import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Stage, Layer, Circle, Rect, Text, Group, Image as KonvaImage, Transformer } from 'react-konva';
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

// Componente que carga y renderiza una imagen Konva
const SceneImageNode = forwardRef(function SceneImageNode(
    { item, opacity, draggable, onClick, onDragEnd, onTransformEnd, onContextMenu },
    ref
) {
    const [img, setImg] = useState(null);

    useEffect(() => {
        const image = new window.Image();
        image.src = API + item.image_url;
        image.onload  = () => setImg(image);
        image.onerror = () => console.error('Error cargando imagen:', API + item.image_url);
    }, [item.image_url]);

    return (
        <KonvaImage
            ref={ref}
            image={img}
            x={item.x}
            y={item.y}
            width={item.width}
            height={item.height}
            opacity={opacity}
            draggable={draggable}
            onClick={onClick}
            onTap={onClick}
            onDragEnd={onDragEnd}
            onTransformEnd={onTransformEnd}
            onContextMenu={onContextMenu}
        />
    );
});

export default function VttBoard() {
    const { id: gameId } = useParams();
    const [scene,          setScene]          = useState(null);
    const [error,          setError]          = useState(null);
    const [isDm,           setIsDm]           = useState(false);
    const [sceneItems,     setSceneItems]      = useState([]);
    const [sceneImages,    setSceneImages]     = useState([]);
    const [activeLayer,    setActiveLayer]     = useState('user');
    const [selectedImgId,  setSelectedImgId]  = useState(null);
    const [zoom,           setZoom]           = useState(1);
    const [ctxMenu,        setCtxMenu]        = useState(null); // {x,y,type,id,layer}
    const [dropIndicator,  setDropIndicator]  = useState(null); // {x,y,w,h} en coords de pantalla

    const stageRef       = useRef(null);
    const transformerRef = useRef(null);
    const imageNodesRef  = useRef({});
    const isPanning      = useRef(false);
    const lastPanPos     = useRef({ x: 0, y: 0 });
    const shiftHeld      = useRef(false);

    const gridWidth        = scene?.grid_width  || 10;
    const gridHeight       = scene?.grid_height || 10;
    const squareSize       = 50;
    const boardPixelWidth  = gridWidth  * squareSize;
    const boardPixelHeight = gridHeight * squareSize;
    const availableW = window.innerWidth  - SIDEBAR_W;
    const availableH = window.innerHeight - HEADER_H - TOOLBAR_H;
    const boardX = SIDEBAR_W + Math.floor((availableW - boardPixelWidth)  / 2);
    const boardY = HEADER_H + TOOLBAR_H + Math.floor((availableH - boardPixelHeight) / 2);

    // ── Rastrear Shift globalmente ────────────────────────────────────────────
    useEffect(() => {
        const down = (e) => { if (e.key === 'Shift') shiftHeld.current = true;  };
        const up   = (e) => { if (e.key === 'Shift') shiftHeld.current = false; };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup',   up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    // Sincronizar Transformer con la imagen seleccionada
    useEffect(() => {
        if (!transformerRef.current) return;
        const node = selectedImgId ? imageNodesRef.current[selectedImgId] : null;
        transformerRef.current.nodes(node ? [node] : []);
        transformerRef.current.getLayer()?.batchDraw();
    }, [selectedImgId]);

    // ── PAN con botón central ─────────────────────────────────────────────────
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
    const handleMouseUp   = (e) => { if (e.button === 1) isPanning.current = false; };

    // ── ZOOM ──────────────────────────────────────────────────────────────────
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
        stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
        stage.batchDraw();
        setZoom(newScale);
    };

    const applyZoom = (factor) => {
        const stage    = stageRef.current;
        const oldScale = stage.scaleX();
        const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldScale * factor));
        const cx = SIDEBAR_W + availableW / 2;
        const cy = HEADER_H + TOOLBAR_H + availableH / 2;
        const mousePointTo = { x: (cx - stage.x()) / oldScale, y: (cy - stage.y()) / oldScale };
        stage.scale({ x: newScale, y: newScale });
        stage.position({ x: cx - mousePointTo.x * newScale, y: cy - mousePointTo.y * newScale });
        stage.batchDraw();
        setZoom(newScale);
    };

    const resetZoom = () => {
        stageRef.current.scale({ x: 1, y: 1 });
        stageRef.current.position({ x: 0, y: 0 });
        stageRef.current.batchDraw();
        setZoom(1);
    };

    // ── Datos ─────────────────────────────────────────────────────────────────
    const fetchTokens = async (sceneId) => {
        const res = await axios.get(`${API}/api/scene-token/scene/${sceneId}`, { headers: authHeaders() });
        setSceneItems(res.data);
    };

    const fetchImages = async (sceneId) => {
        const res = await axios.get(`${API}/api/scene-image/scene/${sceneId}`, { headers: authHeaders() });
        setSceneImages(res.data);
    };

    useEffect(() => {
        if (!gameId) return;
        const load = async () => {
            try {
                const res = await axios.get(`${API}/scene/api/game/${gameId}/active-scene`, { headers: authHeaders() });
                setScene(res.data);
                setIsDm(res.data.is_dm || false);
                await Promise.all([fetchTokens(res.data.id), fetchImages(res.data.id)]);
            } catch {
                setError('No se pudo cargar la escena.');
            }
        };
        load();
    }, [gameId]);

    const handleSceneSelect = async (newScene) => {
        setScene(newScene);
        setSceneItems([]);
        setSceneImages([]);
        setSelectedImgId(null);
        await Promise.all([fetchTokens(newScene.id), fetchImages(newScene.id)]);
    };

    const handleSceneUpdated = (updatedScene) => {
        if (scene?.id === updatedScene.id) setScene(prev => ({ ...prev, ...updatedScene }));
    };

    // ── Convertir coordenadas de pantalla → stage ─────────────────────────────
    const screenToStage = (clientX, clientY) => {
        const stage = stageRef.current;
        const scale = stage.scaleX();
        const pos   = stage.position();
        return { x: (clientX - pos.x) / scale, y: (clientY - pos.y) / scale };
    };

    const stageToScreen = (stageX, stageY) => {
        const stage = stageRef.current;
        const scale = stage.scaleX();
        const pos   = stage.position();
        return { x: stageX * scale + pos.x, y: stageY * scale + pos.y };
    };

    // ── Snap al grid ──────────────────────────────────────────────────────────
    const snapImageToGrid = (x, y) => ({
        x: boardX + Math.round((x - boardX) / squareSize) * squareSize,
        y: boardY + Math.round((y - boardY) / squareSize) * squareSize,
    });

    const snapX = (val) => boardX + Math.round((val - boardX) / squareSize) * squareSize;
    const snapY = (val) => boardY + Math.round((val - boardY) / squareSize) * squareSize;

    // ── Indicador de drop de imagen ───────────────────────────────────────────
    const isFileDrag = (e) => e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');

    const updateDropIndicator = (e) => {
        if (!isFileDrag(e) || !stageRef.current) return;
        const defaultW = 200, defaultH = 200;
        const { x: stageX, y: stageY } = screenToStage(e.clientX, e.clientY);
        const snapped = snapImageToGrid(stageX - defaultW / 2, stageY - defaultH / 2);
        const screenTL = stageToScreen(snapped.x, snapped.y);
        const scale = stageRef.current.scaleX();
        setDropIndicator({ x: screenTL.x, y: screenTL.y, w: defaultW * scale, h: defaultH * scale });
    };

    const handleDragEnter = (e) => { e.preventDefault(); if (isFileDrag(e)) updateDropIndicator(e); };
    const handleDragOverWithIndicator = (e) => { e.preventDefault(); if (isFileDrag(e)) updateDropIndicator(e); };
    const handleDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setDropIndicator(null);
    };

    // ── Drop ──────────────────────────────────────────────────────────────────
    const handleDrop = async (e) => {
        e.preventDefault();
        setDropIndicator(null);
        if (!scene) return;

        // — archivo de imagen —
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            await handleImageFileDrop(files[0], e.clientX, e.clientY);
            return;
        }

        // — token de personaje/monstruo —
        const raw = e.dataTransfer.getData('tokenData');
        if (!raw) return;
        const tokenData = JSON.parse(raw);

        const { x: stageX, y: stageY } = screenToStage(e.clientX, e.clientY);
        let col = Math.round((stageX - boardX - squareSize / 2) / squareSize);
        let row = Math.round((stageY - boardY - squareSize / 2) / squareSize);
        col = Math.max(0, Math.min(col, gridWidth  - 1));
        row = Math.max(0, Math.min(row, gridHeight - 1));

        try {
            const res = await axios.post(`${API}/api/scene-token/scene/${scene.id}`, {
                col, row, layer: activeLayer,
                color: tokenData.color || 'gray',
                name:  tokenData.name  || null,
            }, { headers: authHeaders() });
            setSceneItems(prev => [...prev, res.data]);
        } catch (err) {
            console.error('Failed to create token:', err);
        }
    };

    const handleImageFileDrop = async (file, clientX, clientY) => {
        const { x: stageX, y: stageY } = screenToStage(clientX, clientY);
        const defaultW = 200;
        const defaultH = 200;

        const snapped = snapImageToGrid(stageX - defaultW / 2, stageY - defaultH / 2);

        const formData = new FormData();
        formData.append('image',  file);
        formData.append('x',      snapped.x);
        formData.append('y',      snapped.y);
        formData.append('width',  defaultW);
        formData.append('height', defaultH);
        formData.append('layer',  activeLayer);

        try {
            const res = await axios.post(
                `${API}/api/scene-image/scene/${scene.id}/upload`,
                formData,
                { headers: { ...authHeaders() } }
            );
            setSceneImages(prev => [...prev, res.data]);
        } catch (err) {
            console.error('Failed to upload image:', err);
        }
    };

    // ── Tokens: mover ─────────────────────────────────────────────────────────
    const handleDragEndToken = async (e, item) => {
        let col = Math.round((e.target.x() - boardX - squareSize / 2) / squareSize);
        let row = Math.round((e.target.y() - boardY - squareSize / 2) / squareSize);
        col = Math.max(0, Math.min(col, gridWidth  - 1));
        row = Math.max(0, Math.min(row, gridHeight - 1));
        e.target.position({ x: boardX + col * squareSize + squareSize / 2, y: boardY + row * squareSize + squareSize / 2 });
        e.target.getLayer().batchDraw();
        setSceneItems(prev => prev.map(i => i.id === item.id ? { ...i, col, row } : i));
        try {
            await axios.put(`${API}/api/scene-token/${item.id}`, { col, row }, { headers: authHeaders() });
        } catch (err) { console.error(err); }
    };

    // ── Imágenes: mover (snap al grid salvo Shift) ───────────────────────────
    const handleImageDragEnd = async (e, item) => {
        const freeMode = shiftHeld.current;
        const pos = freeMode
            ? { x: e.target.x(), y: e.target.y() }
            : snapImageToGrid(e.target.x(), e.target.y());

        if (!freeMode) {
            e.target.position(pos);
            e.target.getLayer().batchDraw();
        }

        setSceneImages(prev => prev.map(i => i.id === item.id ? { ...i, ...pos } : i));
        try {
            await axios.put(`${API}/api/scene-image/${item.id}`, pos, { headers: authHeaders() });
        } catch (err) { console.error(err); }
    };

    // ── Imágenes: redimensionar ───────────────────────────────────────────────
    const handleImageTransformEnd = async (e, item) => {
        const node   = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        let newX      = node.x();
        let newY      = node.y();
        let newWidth  = Math.max(squareSize, node.width()  * scaleX);
        let newHeight = Math.max(squareSize, node.height() * scaleY);

        if (!shiftHeld.current) {
            const left   = snapX(newX);
            const top    = snapY(newY);
            const right  = snapX(newX + newWidth);
            const bottom = snapY(newY + newHeight);
            newX      = left;
            newY      = top;
            newWidth  = Math.max(squareSize, right - left);
            newHeight = Math.max(squareSize, bottom - top);
            node.x(newX);
            node.y(newY);
            node.width(newWidth);
            node.height(newHeight);
            node.getLayer().batchDraw();
        }

        setSceneImages(prev => prev.map(i =>
            i.id === item.id ? { ...i, x: newX, y: newY, width: newWidth, height: newHeight } : i
        ));
        try {
            await axios.put(`${API}/api/scene-image/${item.id}`,
                { x: newX, y: newY, width: newWidth, height: newHeight },
                { headers: authHeaders() }
            );
        } catch (err) { console.error(err); }
    };

    // ── Menú contextual (clic derecho) ────────────────────────────────────────
    const openCtxMenu = (e, type, id, layer) => {
        e.evt.preventDefault();
        setCtxMenu({ x: e.evt.clientX, y: e.evt.clientY, type, id, layer });
    };

    const handleDelete = async () => {
        if (!ctxMenu) return;
        try {
            if (ctxMenu.type === 'token') {
                await axios.delete(`${API}/api/scene-token/${ctxMenu.id}`, { headers: authHeaders() });
                setSceneItems(prev => prev.filter(i => i.id !== ctxMenu.id));
            } else {
                await axios.delete(`${API}/api/scene-image/${ctxMenu.id}`, { headers: authHeaders() });
                setSceneImages(prev => prev.filter(i => i.id !== ctxMenu.id));
                if (selectedImgId === ctxMenu.id) setSelectedImgId(null);
            }
        } catch (err) { console.error(err); }
        setCtxMenu(null);
    };

    const handleChangeLayer = async (newLayer) => {
        if (!ctxMenu) return;
        try {
            if (ctxMenu.type === 'token') {
                await axios.put(`${API}/api/scene-token/${ctxMenu.id}`, { layer: newLayer }, { headers: authHeaders() });
                setSceneItems(prev => prev.map(i => i.id === ctxMenu.id ? { ...i, layer: newLayer } : i));
            } else {
                await axios.put(`${API}/api/scene-image/${ctxMenu.id}`, { layer: newLayer }, { headers: authHeaders() });
                setSceneImages(prev => prev.map(i => i.id === ctxMenu.id ? { ...i, layer: newLayer } : i));
            }
        } catch (err) { console.error(err); }
        setCtxMenu(null);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const renderGrid = () => {
        const lines = [];
        for (let y = 0; y < gridHeight; y++)
            for (let x = 0; x < gridWidth; x++)
                lines.push(
                    <Rect key={`g-${x}-${y}`}
                        x={boardX + x * squareSize} y={boardY + y * squareSize}
                        width={squareSize} height={squareSize}
                        fill="transparent"
                        stroke="rgba(100,120,140,0.35)"
                        strokeWidth={1}
                        listening={false}
                    />
                );
        return lines;
    };

    const getX       = (item) => boardX + (item.col || 0) * squareSize + squareSize / 2;
    const getY       = (item) => boardY + (item.row || 0) * squareSize + squareSize / 2;
    const canDragTok = (item) => item.layer === activeLayer;
    const canDragImg = (item) => item.layer === activeLayer;
    const getOpacity = (item) => {
        if (!isDm) return 1; // jugadores siempre ven todo a plena opacidad
        if (activeLayer === 'gm') return item.layer === 'gm' ? 1 : 0.35;
        return item.layer === 'gm' ? 0.35 : 1;
    };

    const renderToken = (item) => {
        const radius = squareSize / 2 - 5;
        const fill   = colorMap[item.color] || '#6b7280';
        return (
            <Group key={item.id} x={getX(item)} y={getY(item)}
                opacity={getOpacity(item)}
                draggable={canDragTok(item)}
                onDragEnd={(e) => handleDragEndToken(e, item)}
                onContextMenu={(e) => { if (isDm || item.layer === activeLayer) openCtxMenu(e, 'token', item.id, item.layer); }}
            >
                <Circle radius={radius} fill={fill} shadowBlur={item.layer === 'user' ? 6 : 0} shadowColor={fill} />
                {false && (
                    <Text text={item.name} fontSize={9} fill="white" fontStyle="bold"
                        width={squareSize * 1.4} align="center"
                        x={-squareSize * 0.7} y={radius + 2} listening={false}
                    />
                )}
            </Group>
        );
    };

    const backgroundItems = sceneItems.filter(i => i.layer === 'background');
    const userItems       = sceneItems.filter(i => i.layer === 'user');
    const gmItems         = sceneItems.filter(i => i.layer === 'gm');

    const zoomPct = Math.round(zoom * 100);

    return (
        <div
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOverWithIndicator}
            onDragLeave={handleDragLeave}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { isPanning.current = false; }}
            onClick={() => setCtxMenu(null)}
            onContextMenu={(e) => e.preventDefault()}
            style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
        >
            {/* ── CANVAS ── */}
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                style={{ background: '#2c3e50', position: 'absolute', top: 0, left: 0 }}
                ref={stageRef}
                onWheel={handleWheel}
                onClick={(e) => { if (e.target === stageRef.current) setSelectedImgId(null); }}
                onContextMenu={(e) => e.evt.preventDefault()}
            >
                {/* Fondo del tablero */}
                <Layer name="board-bg">
                    <Rect
                        x={boardX} y={boardY}
                        width={boardPixelWidth} height={boardPixelHeight}
                        fill="#ecf0f1"
                        listening={false}
                    />
                </Layer>

                {/* Imágenes (debajo del grid para que las líneas queden encima) */}
                <Layer name="images" clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>
                    {sceneImages.map(img => (
                        (!isDm && img.layer === 'gm') ? null : (
                            <SceneImageNode
                                key={img.id}
                                ref={(node) => { if (node) imageNodesRef.current[img.id] = node; }}
                                item={img}
                                opacity={getOpacity(img)}
                                draggable={canDragImg(img)}
                                onClick={() => { if (img.layer === activeLayer) setSelectedImgId(img.id); }}
                                onDragEnd={(e) => handleImageDragEnd(e, img)}
                                onTransformEnd={(e) => handleImageTransformEnd(e, img)}
                                onContextMenu={(e) => { if (isDm || img.layer === activeLayer) openCtxMenu(e, 'image', img.id, img.layer); }}
                            />
                        )
                    ))}
                </Layer>

                {/* Grid encima de las imágenes */}
                <Layer name="grid" listening={false}>{renderGrid()}</Layer>

                {/* Tokens por capa */}
                <Layer name="background" clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>{backgroundItems.map(renderToken)}</Layer>
                <Layer name="user"       clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>{userItems.map(renderToken)}</Layer>
                {isDm && <Layer name="gm" clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>{gmItems.map(renderToken)}</Layer>}

                {/* Transformer sin clip para que los handles sean siempre visibles */}
                <Layer name="transformer">
                    <Transformer
                        ref={transformerRef}
                        keepRatio={false}
                        boundBoxFunc={(oldBox, newBox) =>
                            newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
                        }
                    />
                </Layer>
            </Stage>

            {/* ── TOOLBAR ── */}
            <div style={{
                position: 'absolute', top: HEADER_H, left: 0, right: 0,
                height: TOOLBAR_H, zIndex: 20,
                background: 'rgba(15, 23, 42, 0.95)',
                borderBottom: '1px solid #2d3e50',
                display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
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
                    <span onClick={resetZoom} title="Restablecer zoom"
                        style={{ color: '#94a3b8', fontSize: 12, minWidth: 38, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                        {zoomPct}%
                    </span>
                    <button onClick={() => applyZoom(ZOOM_STEP)} style={zoomBtnStyle}>+</button>
                </div>

                {/* Capas */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: 12, marginRight: 4 }}>Capa:</span>
                    {(isDm ? LAYERS : LAYERS.filter(l => l.id === 'user')).map(l => (
                        <button key={l.id} onClick={() => { setActiveLayer(l.id); setSelectedImgId(null); }}
                            style={{
                                padding: '4px 10px', borderRadius: 4, fontSize: 12,
                                fontWeight: activeLayer === l.id ? 700 : 400,
                                background: activeLayer === l.id ? '#3b82f6' : '#334155',
                                color: 'white', border: 'none', cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}>
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── PANEL IZQUIERDO ── */}
            <div style={{
                position: 'absolute', top: HEADER_H + TOOLBAR_H, left: 0,
                width: SIDEBAR_W, bottom: 0, zIndex: 10,
                background: 'rgba(15, 23, 42, 0.85)',
                borderRight: '1px solid #2d3e50', overflowY: 'auto',
            }}>
                <TokenSpawner sceneItems={sceneItems} gameId={gameId} />
            </div>

            {/* ── MENÚ CONTEXTUAL ── */}
            {ctxMenu && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: ctxMenu.y, left: ctxMenu.x,
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 6,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        zIndex: 100,
                        minWidth: 160,
                        overflow: 'hidden',
                    }}
                >
                    {isDm && (
                        <>
                            <div style={{ padding: '6px 14px 4px', fontSize: 11, color: '#64748b', userSelect: 'none' }}>
                                Mover a capa
                            </div>
                            {LAYERS.map(l => (
                                <button
                                    key={l.id}
                                    disabled={l.id === ctxMenu.layer}
                                    onClick={() => handleChangeLayer(l.id)}
                                    style={{
                                        width: '100%', padding: '7px 14px',
                                        background: l.id === ctxMenu.layer ? 'rgba(99,102,241,0.15)' : 'transparent',
                                        color: l.id === ctxMenu.layer ? '#818cf8' : '#cbd5e1',
                                        border: 'none', cursor: l.id === ctxMenu.layer ? 'default' : 'pointer',
                                        textAlign: 'left', fontSize: 13,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}
                                    onMouseEnter={e => { if (l.id !== ctxMenu.layer) e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                                    onMouseLeave={e => { if (l.id !== ctxMenu.layer) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {l.id === ctxMenu.layer ? '✓ ' : ''}
                                    {l.label}
                                </button>
                            ))}
                            <div style={{ height: 1, background: '#334155', margin: '4px 0' }} />
                        </>
                    )}
                    <button
                        onClick={handleDelete}
                        style={{
                            width: '100%', padding: '9px 14px',
                            background: 'transparent',
                            color: '#f87171', border: 'none',
                            cursor: 'pointer', textAlign: 'left',
                            fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        🗑 Borrar
                    </button>
                </div>
            )}

            {/* ── INDICADOR DE DROP ── */}
            {dropIndicator && (
                <div style={{
                    position: 'fixed',
                    left: dropIndicator.x, top: dropIndicator.y,
                    width: dropIndicator.w, height: dropIndicator.h,
                    border: '2px dashed #3b82f6',
                    borderRadius: 4,
                    background: 'rgba(59,130,246,0.15)',
                    pointerEvents: 'none',
                    zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ color: '#3b82f6', fontSize: 13, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                        Soltar aquí
                    </span>
                </div>
            )}

            {/* ── AVISO DROP IMAGEN ── */}
            <div style={{
                position: 'absolute', bottom: 16,
                left: SIDEBAR_W + 16, zIndex: 10,
                color: '#475569', fontSize: 11,
                pointerEvents: 'none',
            }}>
                Arrastra una imagen al tablero · Mantén Shift para posición libre
            </div>

            {/* ── ERROR ── */}
            {error && (
                <div style={{
                    position: 'absolute', top: HEADER_H + TOOLBAR_H + 12,
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
    width: 26, height: 26, borderRadius: 4,
    background: '#334155', color: 'white',
    border: 'none', cursor: 'pointer',
    fontSize: 16, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
};
