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

const DEFAULT_COUNTERS = [
    { label: 'HP',  current: 10, max: 10, color: '#22c55e' },
    { label: '',    current: 0,  max: 0,  color: '#3b82f6' },
    { label: '',    current: 0,  max: 0,  color: '#f59e0b' },
];
const BAR_H = 5;
const BAR_GAP = 2;
const BAR_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#ec4899','#ffffff'];

// Componente para tokens con imagen
const TokenImageNode = forwardRef(function TokenImageNode(
    { item, squareSize, boardX, boardY, opacity, draggable, onClick, onDragEnd, onTransformEnd, onContextMenu },
    ref
) {
    const [img, setImg] = useState(null);
    useEffect(() => {
        if (!item.image_url) return;
        const image = new window.Image();
        image.src = API + item.image_url;
        image.onload  = () => setImg(image);
        image.onerror = () => console.error('Error cargando token img:', item.image_url);
    }, [item.image_url]);

    const w = item.width  || squareSize;
    const h = item.height || squareSize;
    const x = boardX + (item.col || 0) * squareSize + squareSize / 2 - w / 2;
    const y = boardY + (item.row || 0) * squareSize + squareSize / 2 - h / 2;

    return (
        <KonvaImage
            ref={ref}
            image={img}
            x={x} y={y} width={w} height={h}
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
    const [selectedImgId,   setSelectedImgId]  = useState(null);
    const [selectedTokenId, setSelectedTokenId] = useState(null);
    const [zoom,           setZoom]           = useState(1);
    const [ctxMenu,        setCtxMenu]        = useState(null); // {x,y,type,id,layer}
    const [dropIndicator,  setDropIndicator]  = useState(null); // {x,y,w,h} en coords de pantalla
    const [barEditor,      setBarEditor]      = useState(null); // {tokenId, screenX, screenY}
    const [badgeEdit,      setBadgeEdit]      = useState(null); // {tokenId, counterIdx, screenX, screenY, value}

    const stageRef       = useRef(null);
    const transformerRef = useRef(null);
    const imageNodesRef  = useRef({});
    const tokenNodesRef  = useRef({});
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

    // Sincronizar Transformer con imagen o token seleccionado
    useEffect(() => {
        if (!transformerRef.current) return;
        let node = null;
        if (selectedImgId)   node = imageNodesRef.current[selectedImgId];
        if (selectedTokenId) node = tokenNodesRef.current[selectedTokenId];
        transformerRef.current.nodes(node ? [node] : []);
        transformerRef.current.getLayer()?.batchDraw();
    }, [selectedImgId, selectedTokenId]);

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
                color:     tokenData.color     || 'gray',
                name:      tokenData.name      || null,
                image_url: tokenData.image_url || null,
                width:     squareSize,
                height:    squareSize,
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
        const w = item.width  || squareSize;
        const h = item.height || squareSize;
        // tokens con imagen → posición top-left; círculos → posición center
        const centerX = item.image_url ? e.target.x() + w / 2 : e.target.x();
        const centerY = item.image_url ? e.target.y() + h / 2 : e.target.y();
        let col = Math.round((centerX - boardX - squareSize / 2) / squareSize);
        let row = Math.round((centerY - boardY - squareSize / 2) / squareSize);
        col = Math.max(0, Math.min(col, gridWidth  - 1));
        row = Math.max(0, Math.min(row, gridHeight - 1));
        if (item.image_url) {
            e.target.position({ x: boardX + col * squareSize + squareSize / 2 - w / 2, y: boardY + row * squareSize + squareSize / 2 - h / 2 });
        } else {
            e.target.position({ x: boardX + col * squareSize + squareSize / 2, y: boardY + row * squareSize + squareSize / 2 });
        }
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

    // ── Tokens con imagen: redimensionar ─────────────────────────────────────
    const handleTokenTransformEnd = async (e, item) => {
        const node   = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        const w = item.width  || squareSize;
        const h = item.height || squareSize;
        let newX      = node.x();
        let newY      = node.y();
        let newWidth  = Math.max(squareSize / 2, w * scaleX);
        let newHeight = Math.max(squareSize / 2, h * scaleY);

        if (!shiftHeld.current) {
            const left   = snapX(newX);
            const top    = snapY(newY);
            const right  = snapX(newX + newWidth);
            const bottom = snapY(newY + newHeight);
            newX      = left;
            newY      = top;
            newWidth  = Math.max(squareSize, right - left);
            newHeight = Math.max(squareSize, bottom - top);
            node.x(newX); node.y(newY);
            node.width(newWidth); node.height(newHeight);
            node.getLayer().batchDraw();
        }

        // Calcular col/row desde el centro
        const col = Math.max(0, Math.min(Math.round((newX + newWidth  / 2 - boardX - squareSize / 2) / squareSize), gridWidth  - 1));
        const row = Math.max(0, Math.min(Math.round((newY + newHeight / 2 - boardY - squareSize / 2) / squareSize), gridHeight - 1));

        setSceneItems(prev => prev.map(i => i.id === item.id ? { ...i, col, row, width: newWidth, height: newHeight } : i));
        try {
            await axios.put(`${API}/api/scene-token/${item.id}`, { col, row, width: newWidth, height: newHeight }, { headers: authHeaders() });
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
                if (selectedImgId   === ctxMenu.id) setSelectedImgId(null);
                if (selectedTokenId === ctxMenu.id) setSelectedTokenId(null);
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

    // ── Contadores ────────────────────────────────────────────────────────────
    const getCounters = (item) => item.counters || DEFAULT_COUNTERS;

const saveCounters = async (tokenId, counters) => {
        setSceneItems(prev => prev.map(i => i.id === tokenId ? { ...i, counters } : i));
        try {
            await axios.put(`${API}/api/scene-token/${tokenId}`, { counters }, { headers: authHeaders() });
        } catch (err) { console.error(err); }
    };

    const getTokenBounds = (item) => {
        const w = item.image_url ? (item.width || squareSize) : squareSize;
        const h = item.image_url ? (item.height || squareSize) : squareSize;
        const x = item.image_url
            ? boardX + (item.col || 0) * squareSize + squareSize / 2 - w / 2
            : boardX + (item.col || 0) * squareSize;
        const y = item.image_url
            ? boardY + (item.row || 0) * squareSize + squareSize / 2 - h / 2
            : boardY + (item.row || 0) * squareSize;
        return { x, y, w, h };
    };

    const renderTokenBars = (item) => {
        if (!isDm && item.layer === 'gm') return null;
        const counters = getCounters(item);
        const hasAny = counters.some(c => c.max > 0);
        if (!hasAny) return null;

        const { x, y, w, h } = getTokenBounds(item);
        const activeCount = counters.filter(c => c.max > 0).length;
        const totalBarsH = activeCount * BAR_H + (activeCount - 1) * BAR_GAP;
        const barsY = y - totalBarsH - 3;
        const opacity = getOpacity(item);

        const bars = counters.map((c, i) => {
            if (c.max <= 0) return null;
            const pct = Math.max(0, Math.min(1, c.current / c.max));
            const barY = barsY + i * (BAR_H + BAR_GAP);
            return (
                <Group key={`bar-${item.id}-${i}`} opacity={opacity} listening={false}>
                    <Rect x={x} y={barY} width={w} height={BAR_H} fill="#0f172a" cornerRadius={2} />
                    <Rect x={x} y={barY} width={Math.max(0, w * pct)} height={BAR_H} fill={c.color} cornerRadius={2} />
                </Group>
            );
        });

        return bars;
    };

    const renderTokenBadge = (item) => {
        if (!isDm && item.layer === 'gm') return null;
        const counters = getCounters(item);
        const active = counters.map((c, i) => ({ c, i })).filter(({ c }) => c.max > 0);
        if (active.length === 0 || selectedTokenId !== item.id) return null;

        const { x, y, w, h } = getTokenBounds(item);
        const opacity = getOpacity(item);
        const badgeR = 13;
        const gap = 4;
        const totalW = active.length * badgeR * 2 + (active.length - 1) * gap;
        const startX = x + w / 2 - totalW / 2 + badgeR;
        const badgeCy = y + h + badgeR + 3;

        return active.map(({ c, i }, arrIdx) => {
            const badgeCx = startX + arrIdx * (badgeR * 2 + gap);
            const badgeVal = String(c.current);
            const badgeFontSize = badgeVal.length > 2 ? 9 : 12;
            return (
                <Group
                    key={`badge-${item.id}-${i}`}
                    opacity={opacity}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        const sp = stageToScreen(badgeCx, badgeCy);
                        setBadgeEdit({ tokenId: item.id, counterIdx: i, screenX: sp.x, screenY: sp.y, value: String(c.current) });
                    }}
                    onTap={(e) => {
                        e.cancelBubble = true;
                        const sp = stageToScreen(badgeCx, badgeCy);
                        setBadgeEdit({ tokenId: item.id, counterIdx: i, screenX: sp.x, screenY: sp.y, value: String(c.current) });
                    }}
                >
                    <Circle x={badgeCx} y={badgeCy} radius={badgeR} fill={c.color} strokeWidth={2} stroke="#0f172a" />
                    <Text
                        x={badgeCx - badgeR} y={badgeCy - badgeR}
                        width={badgeR * 2} height={badgeR * 2}
                        text={badgeVal} fontSize={badgeFontSize}
                        fontStyle="bold" fill="white" align="center" verticalAlign="middle"
                        listening={false}
                    />
                </Group>
            );
        });
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
        const onCtxMenu = (e) => { if (isDm || item.layer === activeLayer) openCtxMenu(e, 'token', item.id, item.layer); };

        if (item.image_url) {
            return (
                <TokenImageNode
                    key={item.id}
                    ref={(node) => { if (node) tokenNodesRef.current[item.id] = node; }}
                    item={item}
                    squareSize={squareSize}
                    boardX={boardX}
                    boardY={boardY}
                    opacity={getOpacity(item)}
                    draggable={canDragTok(item)}
                    onClick={(e) => { if (item.layer === activeLayer) { setSelectedTokenId(prev => prev === item.id ? null : item.id); setSelectedImgId(null); } }}
                    onDragEnd={(e) => handleDragEndToken(e, item)}
                    onTransformEnd={(e) => handleTokenTransformEnd(e, item)}
                    onContextMenu={onCtxMenu}
                />
            );
        }

        const radius = squareSize / 2 - 5;
        const fill   = colorMap[item.color] || '#6b7280';
        return (
            <Group key={item.id} x={getX(item)} y={getY(item)}
                opacity={getOpacity(item)}
                draggable={canDragTok(item)}
                onClick={(e) => { if (item.layer === activeLayer) { const next = selectedTokenId === item.id ? null : item.id; setSelectedTokenId(next); setSelectedImgId(null); if (next) openBarEditorForToken(item); else setBarEditor(null); } }}
                onDragEnd={(e) => handleDragEndToken(e, item)}
                onContextMenu={onCtxMenu}
            >
                <Circle radius={radius} fill={fill} shadowBlur={item.layer === 'user' ? 6 : 0} shadowColor={fill} />
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
            onClick={() => { setCtxMenu(null); setBarEditor(null); setBadgeEdit(null); }}
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
                onClick={(e) => { if (e.target === stageRef.current) { setSelectedImgId(null); setSelectedTokenId(null); } }}
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

                {/* Barras de contadores (sin clip, encima de tokens) */}
                <Layer name="bars" listening={true}>
                    {sceneItems.map(renderTokenBars)}
                </Layer>

                {/* Badges encima de todo */}
                <Layer name="badges" listening={true}>
                    {sceneItems.map(renderTokenBadge)}
                </Layer>

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
                        <button key={l.id} onClick={() => { setActiveLayer(l.id); setSelectedImgId(null); setSelectedTokenId(null); }}
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
                    {ctxMenu.type === 'token' && (
                        <>
                            <button
                                onClick={() => {
                                    setBarEditor({ tokenId: ctxMenu.id, screenX: ctxMenu.x, screenY: ctxMenu.y });
                                    setCtxMenu(null);
                                }}
                                style={{
                                    width: '100%', padding: '9px 14px',
                                    background: 'transparent',
                                    color: '#cbd5e1', border: 'none',
                                    cursor: 'pointer', textAlign: 'left',
                                    fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                ✏️ Editar contadores
                            </button>
                            <div style={{ height: 1, background: '#334155', margin: '2px 0' }} />
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

            {/* ── EDICIÓN INLINE BADGE ── */}
            {badgeEdit && (() => {
                const token = sceneItems.find(i => i.id === badgeEdit.tokenId);
                if (!token) return null;
                const counters = getCounters(token);
                const c = counters[badgeEdit.counterIdx];
                if (!c) return null;
                const commit = (raw) => {
                    const str = String(raw).trim();
                    let next;
                    if (str.startsWith('+')) {
                        const delta = parseInt(str.slice(1), 10);
                        if (!isNaN(delta)) next = Math.max(0, Math.min(c.max, c.current + delta));
                    } else if (str.startsWith('-')) {
                        const delta = parseInt(str.slice(1), 10);
                        if (!isNaN(delta)) next = Math.max(0, Math.min(c.max, c.current - delta));
                    } else {
                        const n = parseInt(str, 10);
                        if (!isNaN(n)) next = Math.max(0, Math.min(c.max, n));
                    }
                    if (next !== undefined) {
                        const updated = counters.map((x, j) => j === badgeEdit.counterIdx ? { ...x, current: next } : x);
                        saveCounters(token.id, updated);
                    }
                    setBadgeEdit(null);
                };
                return (
                    <input
                        autoFocus
                        type="text"
                        value={badgeEdit.value}
                        onChange={e => setBadgeEdit(prev => ({ ...prev, value: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') commit(badgeEdit.value); if (e.key === 'Escape') setBadgeEdit(null); }}
                        onBlur={() => commit(badgeEdit.value)}
                        style={{
                            position: 'fixed',
                            top: badgeEdit.screenY - 14,
                            left: badgeEdit.screenX - 14,
                            width: 36, height: 28,
                            background: '#1e293b',
                            border: `2px solid ${c.color}`,
                            borderRadius: 6,
                            color: '#f1f5f9',
                            fontSize: 13, fontWeight: 700,
                            textAlign: 'center',
                            outline: 'none',
                            zIndex: 300,
                            padding: 0,
                            MozAppearance: 'textfield',
                        }}
                    />
                );
            })()}

            {/* ── EDITOR DE CONTADORES ── */}
            {barEditor && (() => {
                const token    = sceneItems.find(i => i.id === barEditor.tokenId);
                if (!token) return null;
                const counters = getCounters(token);
                return (
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'fixed', top: barEditor.screenY - 8, left: barEditor.screenX,
                            background: '#1e293b', border: '1px solid #334155',
                            borderRadius: 8, padding: '10px 12px',
                            zIndex: 200, minWidth: 220,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contadores</span>
                            <button onClick={() => setBarEditor(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                        </div>
                        {counters.map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                {/* Color */}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: c.color, cursor: 'pointer', border: '2px solid #475569' }}
                                        onClick={() => {
                                            const idx = BAR_COLORS.indexOf(c.color);
                                            const next = BAR_COLORS[(idx + 1) % BAR_COLORS.length];
                                            const updated = counters.map((x, j) => j === i ? { ...x, color: next } : x);
                                            saveCounters(token.id, updated);
                                        }}
                                    />
                                </div>
                                {/* Label */}
                                <input
                                    value={c.label}
                                    onChange={e => {
                                        const updated = counters.map((x, j) => j === i ? { ...x, label: e.target.value } : x);
                                        saveCounters(token.id, updated);
                                    }}
                                    placeholder={`Barra ${i + 1}`}
                                    style={{ width: 60, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#f1f5f9', fontSize: 11, padding: '3px 5px', outline: 'none' }}
                                />
                                {/* Current */}
                                <input
                                    type="number" value={c.current}
                                    onChange={e => {
                                        const updated = counters.map((x, j) => j === i ? { ...x, current: Number(e.target.value) } : x);
                                        saveCounters(token.id, updated);
                                    }}
                                    style={{ width: 44, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#f1f5f9', fontSize: 11, padding: '3px 5px', outline: 'none', textAlign: 'center' }}
                                />
                                <span style={{ color: '#475569', fontSize: 11 }}>/</span>
                                {/* Max */}
                                <input
                                    type="number" value={c.max}
                                    onChange={e => {
                                        const updated = counters.map((x, j) => j === i ? { ...x, max: Number(e.target.value) } : x);
                                        saveCounters(token.id, updated);
                                    }}
                                    style={{ width: 44, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#f1f5f9', fontSize: 11, padding: '3px 5px', outline: 'none', textAlign: 'center' }}
                                />
                            </div>
                        ))}
                    </div>
                );
            })()}

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
