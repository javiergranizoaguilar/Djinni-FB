import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { Stage, Layer, Circle, Rect, Text, Group, Image as KonvaImage, Transformer } from 'react-konva';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import SceneSelector from './ingame/SceneSelector.jsx';
import TokenSpawner from './ingame/TokenSpawner.jsx';
import EditCharacterModal from './pages/EditCharacterModal.jsx';
import EditMonsterModal from './pages/EditMonsterModal.jsx';

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
    { label: '', current: 0, max: 0, color: '#22c55e' },
    { label: '', current: 0, max: 0, color: '#3b82f6' },
    { label: '', current: 0, max: 0, color: '#f59e0b' },
];

// Campos de personaje: { label, getVals(entity) → {current, max} }
const CHARACTER_COUNTER_FIELDS = [
    { label: 'HP', getVals: c => ({ current: c.hp ?? 0, max: c.max_hp ?? c.hp ?? 0 }) },
];

// Campos de monstruo: { label, getVals(entity) → {current, max} }
const MONSTER_COUNTER_FIELDS = [
    { label: 'HP', getVals: m => ({ current: m.hp ?? 0, max: m.max_hp ?? m.hp ?? 0 }) },
];
const BAR_H = 5;
const BAR_GAP = 2;
const BAR_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#ec4899','#ffffff'];

// Componente para tokens con imagen — Group único para que auras/barras sigan el drag
// ref apunta al KonvaImage (no al Group) → Transformer solo rodea la imagen, no las auras
const TokenImageNode = forwardRef(function TokenImageNode(
    { item, squareSize, boardX, boardY, opacity, draggable, onClick, onDblClick, onDragEnd, onTransformEnd, onContextMenu,
      auras, activeCounters, isSelected, onBadgeClick },
    ref
) {
    const [img, setImg] = useState(null);
    const groupRef = useRef(null);
    const imgRef   = useRef(null);
    useImperativeHandle(ref, () => imgRef.current);

    useEffect(() => {
        if (!item.image_url) return;
        const image = new window.Image();
        image.src = API + item.image_url;
        image.onload  = () => setImg(image);
        image.onerror = () => console.error('Error cargando token img:', item.image_url);
    }, [item.image_url]);

    const w = item.width  || squareSize;
    const h = item.height || squareSize;
    const x = item.x != null ? item.x : boardX + (item.col || 0) * squareSize;
    const y = item.y != null ? item.y : boardY + (item.row || 0) * squareSize;
    const halfW = w / 2;
    const halfH = h / 2;
    const halfMax = Math.max(halfW, halfH);

    const barsH = activeCounters.length > 0
        ? activeCounters.length * BAR_H + (activeCounters.length - 1) * BAR_GAP : 0;
    const barsStartY = -barsH - 3;
    const badgeR = 13;
    const badgeGap = 4;
    const totalBadgeW = activeCounters.length * badgeR * 2 + (activeCounters.length - 1) * badgeGap;
    const badgeStartX = w / 2 - totalBadgeW / 2 + badgeR;
    const badgeCy = h + badgeR + 3;

    return (
        <Group ref={groupRef} x={x} y={y} opacity={opacity} draggable={draggable}
            onClick={onClick} onTap={onClick} onDblClick={onDblClick} onDragEnd={onDragEnd} onContextMenu={onContextMenu}
        >
            {auras.map((aura, idx) => {
                const extent = (aura.feet / 5) * squareSize;
                const fo = aura.opacity ?? 0.2;
                const color = aura.color || '#a855f7';
                return aura.shape === 'square'
                    ? <Rect key={idx} x={-extent} y={-extent} width={w + extent*2} height={h + extent*2}
                        fill={color} opacity={fo} stroke={color} strokeWidth={1.5} listening={false} />
                    : <Circle key={idx} x={halfW} y={halfH} radius={halfMax + extent}
                        fill={color} opacity={fo} stroke={color} strokeWidth={1.5} listening={false} />;
            })}
            {/* onTransformEnd en la imagen: Transformer adjuntado aquí, no al Group */}
            <KonvaImage ref={imgRef} image={img} x={0} y={0} width={w} height={h}
                onTransformEnd={onTransformEnd} />
            {activeCounters.map((c, i) => {
                const pct = Math.max(0, Math.min(1, c.current / c.max));
                const barY = barsStartY + i * (BAR_H + BAR_GAP);
                return (
                    <Group key={i} listening={false}>
                        <Rect x={0} y={barY} width={w} height={BAR_H} fill="#0f172a" cornerRadius={2} />
                        <Rect x={0} y={barY} width={Math.max(0, w * pct)} height={BAR_H} fill={c.color} cornerRadius={2} />
                    </Group>
                );
            })}
            {isSelected && activeCounters.map((c, arrIdx) => {
                const badgeCx = badgeStartX + arrIdx * (badgeR * 2 + badgeGap);
                const val = String(c.current);
                return (
                    <Group key={arrIdx}
                        onClick={e => { e.cancelBubble = true; onBadgeClick(e, c.origIdx, c.current); }}
                        onTap={e => { e.cancelBubble = true; onBadgeClick(e, c.origIdx, c.current); }}
                    >
                        <Circle x={badgeCx} y={badgeCy} radius={badgeR} fill={c.color} strokeWidth={2} stroke="#0f172a" />
                        <Text x={badgeCx - badgeR} y={badgeCy - badgeR} width={badgeR*2} height={badgeR*2}
                            text={val} fontSize={val.length > 2 ? 9 : 12} fontStyle="bold"
                            fill="white" align="center" verticalAlign="middle" listening={false} />
                    </Group>
                );
            })}
        </Group>
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
    const [currentUserId,  setCurrentUserId]  = useState(null);
    const [sceneItems,     setSceneItems]      = useState([]);
    const [sceneImages,    setSceneImages]     = useState([]);
    const [activeLayer,    setActiveLayer]     = useState('user');
    const [selectedImgId,   setSelectedImgId]  = useState(null);
    const [selectedTokenId, setSelectedTokenId] = useState(null);
    const [zoom,           setZoom]           = useState(1);
    const [ctxMenu,        setCtxMenu]        = useState(null); // {x,y,type,id,layer}
    const [gamePlayers,    setGamePlayers]    = useState([]);
    const [ctrlSubmenu,    setCtrlSubmenu]    = useState(false);
    const [dropIndicator,  setDropIndicator]  = useState(null); // {x,y,w,h} en coords de pantalla
    const [barEditor,      setBarEditor]      = useState(null); // {tokenId, screenX, screenY}
    const [auraEditor,     setAuraEditor]     = useState(null); // {tokenId, screenX, screenY}
    const [badgeEdit,      setBadgeEdit]      = useState(null); // {tokenId, counterIdx, screenX, screenY, value}
    const [sheetModal,     setSheetModal]     = useState(null); // {kind, entity}

    const stageRef        = useRef(null);
    const transformerRef  = useRef(null);
    const imageNodesRef   = useRef({});
    const tokenNodesRef   = useRef({});
    const isPanning       = useRef(false);
    const entityCacheRef  = useRef({ characters: null, monsters: null });
    const lastPanPos      = useRef({ x: 0, y: 0 });
    const shiftHeld       = useRef(false);
    const ctxMenuRef      = useRef(null);

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

    // Reposicionar menú contextual para que nunca salga de la pantalla
    useLayoutEffect(() => {
        if (!ctxMenu || !ctxMenuRef.current) return;
        const el = ctxMenuRef.current;
        const { width, height } = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const x = ctxMenu.x + width  > vw ? vw - width  - 6 : ctxMenu.x;
        const y = ctxMenu.y + height > vh ? vh - height - 6 : ctxMenu.y;
        el.style.left = x + 'px';
        el.style.top  = y + 'px';
    }, [ctxMenu]);

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
                setCurrentUserId(res.data.current_user_id ?? null);
                const playersRes = await axios.get(`${API}/scene/api/game/${gameId}/players`, { headers: authHeaders() });
                setGamePlayers(playersRes.data ?? []);
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
        let col = Math.round((stageX - boardX) / squareSize);
        let row = Math.round((stageY - boardY) / squareSize);
        col = Math.max(0, Math.min(col, gridWidth  - 1));
        row = Math.max(0, Math.min(row, gridHeight - 1));

        // Contador HP inicial desde la entidad
        const initialCounters = (() => {
            const base = DEFAULT_COUNTERS.map(c => ({ ...c }));
            if (tokenData.max_hp > 0) {
                base[0] = { ...base[0], label: 'HP', current: tokenData.hp ?? tokenData.max_hp, max: tokenData.max_hp, color: '#22c55e' };
            }
            return base;
        })();

        try {
            const res = await axios.post(`${API}/api/scene-token/scene/${scene.id}`, {
                col, row, layer: activeLayer,
                color:     tokenData.color     || 'gray',
                name:      tokenData.name      || null,
                image_url: tokenData.image_url || null,
                width:     squareSize,
                height:    squareSize,
                kind:      tokenData.kind      || null,
                entity_id: tokenData.id        || null,
                counters:  initialCounters,
                auras:     tokenData.default_auras || [],
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
        const freeMode = shiftHeld.current;

        if (freeMode) {
            const px = e.target.x();
            const py = e.target.y();
            // col/row = esquina superior izquierda del token
            let col = item.image_url
                ? Math.round((px - boardX) / squareSize)
                : Math.round((px - squareSize / 2 - boardX) / squareSize);
            let row = item.image_url
                ? Math.round((py - boardY) / squareSize)
                : Math.round((py - squareSize / 2 - boardY) / squareSize);
            col = Math.max(0, Math.min(col, gridWidth  - 1));
            row = Math.max(0, Math.min(row, gridHeight - 1));
            setSceneItems(prev => prev.map(i => i.id === item.id ? { ...i, x: px, y: py, col, row } : i));
            try {
                await axios.put(`${API}/api/scene-token/${item.id}`, { x: px, y: py, col, row }, { headers: authHeaders() });
            } catch (err) { console.error(err); }
        } else {
            const px = e.target.x();
            const py = e.target.y();
            let col, row;
            if (item.image_url) {
                // esquina superior izquierda del token → esquina del cuadrado
                col = Math.round((px - boardX) / squareSize);
                row = Math.round((py - boardY) / squareSize);
                col = Math.max(0, Math.min(col, gridWidth  - 1));
                row = Math.max(0, Math.min(row, gridHeight - 1));
                e.target.position({ x: boardX + col * squareSize, y: boardY + row * squareSize });
            } else {
                // círculo: centro → centro del cuadrado (no cambia)
                col = Math.round((px - boardX - squareSize / 2) / squareSize);
                row = Math.round((py - boardY - squareSize / 2) / squareSize);
                col = Math.max(0, Math.min(col, gridWidth  - 1));
                row = Math.max(0, Math.min(row, gridHeight - 1));
                e.target.position({ x: boardX + col * squareSize + squareSize / 2, y: boardY + row * squareSize + squareSize / 2 });
            }
            e.target.getLayer().batchDraw();
            setSceneItems(prev => prev.map(i => i.id === item.id ? { ...i, x: null, y: null, col, row } : i));
            try {
                await axios.put(`${API}/api/scene-token/${item.id}`, { x: null, y: null, col, row }, { headers: authHeaders() });
            } catch (err) { console.error(err); }
        }
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
        // e.target = KonvaImage (x=0,y=0 dentro del Group)
        // El Group padre tiene la posición absoluta
        const node   = e.target;
        const group  = node.getParent();
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        const w = item.width  || squareSize;
        const h = item.height || squareSize;
        let newX      = group.x() + node.x();
        let newY      = group.y() + node.y();
        // Tamaño siempre múltiplo de squareSize (mínimo 1 cuadrado)
        let newWidth  = Math.max(squareSize, Math.round((w * scaleX) / squareSize) * squareSize);
        let newHeight = Math.max(squareSize, Math.round((h * scaleY) / squareSize) * squareSize);

        if (!shiftHeld.current) {
            newX = snapX(newX);
            newY = snapY(newY);
        }

        group.x(newX); group.y(newY);
        node.x(0); node.y(0);
        node.width(newWidth); node.height(newHeight);
        node.getLayer().batchDraw();

        // col/row desde esquina superior izquierda
        const col = Math.max(0, Math.min(Math.round((newX - boardX) / squareSize), gridWidth  - 1));
        const row = Math.max(0, Math.min(Math.round((newY - boardY) / squareSize), gridHeight - 1));

        const freeTransform = shiftHeld.current;
        const xSave = freeTransform ? newX : null;
        const ySave = freeTransform ? newY : null;

        setSceneItems(prev => prev.map(i => i.id === item.id ? { ...i, x: xSave, y: ySave, col, row, width: newWidth, height: newHeight } : i));
        try {
            await axios.put(`${API}/api/scene-token/${item.id}`, { x: xSave, y: ySave, col, row, width: newWidth, height: newHeight }, { headers: authHeaders() });
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

    // ── Doble clic en token → abrir ficha ────────────────────────────────────
    const handleTokenDblClick = async (item) => {
        if (!item.entity_id || !['character', 'monster'].includes(item.kind)) return;
        const cache = entityCacheRef.current;
        const cacheKey = item.kind === 'character' ? 'characters' : 'monsters';
        let entity = (cache[cacheKey] || []).find(e => e.id === item.entity_id);
        if (!entity) {
            try {
                const endpoint = item.kind === 'character'
                    ? `${API}/api/character/${item.entity_id}`
                    : `${API}/api/monster/${item.entity_id}`;
                const r = await axios.get(endpoint, { headers: authHeaders() });
                entity = r.data;
            } catch { return; }
        }
        setSheetModal({ kind: item.kind, entity });
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
    const getAuras    = (item) => item.auras    || [];

const saveCounters = async (tokenId, counters) => {
        setSceneItems(prev => prev.map(i => i.id === tokenId ? { ...i, counters } : i));
        try {
            await axios.put(`${API}/api/scene-token/${tokenId}`, { counters }, { headers: authHeaders() });
        } catch (err) { console.error(err); }
    };

    const saveAuras = async (tokenId, auras) => {
        setSceneItems(prev => prev.map(i => i.id === tokenId ? { ...i, auras } : i));
        try {
            await axios.put(`${API}/api/scene-token/${tokenId}`, { auras }, { headers: authHeaders() });
        } catch (err) { console.error(err); }
    };

    const getX = (item) => item.x != null ? item.x : boardX + (item.col || 0) * squareSize + squareSize / 2;
    const getY = (item) => item.y != null ? item.y : boardY + (item.row || 0) * squareSize + squareSize / 2;

    const canDragTok = (item) => item.layer === activeLayer && (isDm || item.owner_id === currentUserId || item.controlled_by_id === currentUserId);
    const canDragImg = (item) => item.layer === activeLayer;
    const getOpacity = (item) => {
        if (!isDm) return 1;
        if (activeLayer === 'gm') return item.layer === 'gm' ? 1 : 0.35;
        return item.layer === 'gm' ? 0.35 : 1;
    };

    const renderToken = (item) => {
        const onCtxMenu = (e) => { if (item.layer === activeLayer) openCtxMenu(e, 'token', item.id, item.layer); };
        const counters = getCounters(item);
        const activeCounters = counters.map((c, i) => ({ ...c, origIdx: i })).filter(c => c.max > 0);
        const auras = getAuras(item);
        const isSelected = selectedTokenId === item.id;

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
                    auras={auras}
                    activeCounters={activeCounters}
                    isSelected={isSelected}
                    onBadgeClick={(e, counterIdx, currentVal) => {
                        setBadgeEdit({ tokenId: item.id, counterIdx, screenX: e.evt.clientX, screenY: e.evt.clientY, value: String(currentVal) });
                    }}
                    onClick={() => { if (item.layer === activeLayer) { setSelectedTokenId(prev => prev === item.id ? null : item.id); setSelectedImgId(null); } }}
                    onDblClick={() => handleTokenDblClick(item)}
                    onDragEnd={(e) => handleDragEndToken(e, item)}
                    onTransformEnd={(e) => handleTokenTransformEnd(e, item)}
                    onContextMenu={onCtxMenu}
                />
            );
        }

        const radius = squareSize / 2 - 5;
        const fill   = colorMap[item.color] || '#6b7280';
        const halfMax = squareSize / 2;
        const barsH = activeCounters.length > 0
            ? activeCounters.length * BAR_H + (activeCounters.length - 1) * BAR_GAP : 0;
        const barsStartY = -halfMax - barsH - 3;
        const badgeR = 13;
        const badgeGap = 4;
        const totalBadgeW = activeCounters.length * badgeR * 2 + (activeCounters.length - 1) * badgeGap;
        const badgeStartX = -totalBadgeW / 2 + badgeR;
        const badgeCy = halfMax + badgeR + 3;

        return (
            <Group key={item.id} x={getX(item)} y={getY(item)}
                opacity={getOpacity(item)}
                draggable={canDragTok(item)}
                onClick={() => { if (item.layer === activeLayer) { const next = selectedTokenId === item.id ? null : item.id; setSelectedTokenId(next); setSelectedImgId(null); if (!next) setBarEditor(null); } }}
                onDblClick={() => handleTokenDblClick(item)}
                onDragEnd={(e) => handleDragEndToken(e, item)}
                onContextMenu={onCtxMenu}
            >
                {auras.map((aura, idx) => {
                    const extent = (aura.feet / 5) * squareSize;
                    const fo = aura.opacity ?? 0.2;
                    const color = aura.color || '#a855f7';
                    return aura.shape === 'square'
                        ? <Rect key={idx} x={-halfMax - extent} y={-halfMax - extent}
                            width={(halfMax + extent)*2} height={(halfMax + extent)*2}
                            fill={color} opacity={fo} stroke={color} strokeWidth={1.5} listening={false} />
                        : <Circle key={idx} x={0} y={0} radius={halfMax + extent}
                            fill={color} opacity={fo} stroke={color} strokeWidth={1.5} listening={false} />;
                })}
                <Circle radius={radius} fill={fill} shadowBlur={item.layer === 'user' ? 6 : 0} shadowColor={fill} />
                {activeCounters.map((c, i) => {
                    const pct = Math.max(0, Math.min(1, c.current / c.max));
                    const barY = barsStartY + i * (BAR_H + BAR_GAP);
                    return (
                        <Group key={i} listening={false}>
                            <Rect x={-squareSize/2} y={barY} width={squareSize} height={BAR_H} fill="#0f172a" cornerRadius={2} />
                            <Rect x={-squareSize/2} y={barY} width={Math.max(0, squareSize * pct)} height={BAR_H} fill={c.color} cornerRadius={2} />
                        </Group>
                    );
                })}
                {isSelected && activeCounters.map((c, arrIdx) => {
                    const badgeCx = badgeStartX + arrIdx * (badgeR * 2 + badgeGap);
                    const val = String(c.current);
                    return (
                        <Group key={arrIdx}
                            onClick={e => { e.cancelBubble = true; setBadgeEdit({ tokenId: item.id, counterIdx: c.origIdx, screenX: e.evt.clientX, screenY: e.evt.clientY, value: val }); }}
                            onTap={e => { e.cancelBubble = true; setBadgeEdit({ tokenId: item.id, counterIdx: c.origIdx, screenX: e.evt.clientX, screenY: e.evt.clientY, value: val }); }}
                        >
                            <Circle x={badgeCx} y={badgeCy} radius={badgeR} fill={c.color} strokeWidth={2} stroke="#0f172a" />
                            <Text x={badgeCx - badgeR} y={badgeCy - badgeR} width={badgeR*2} height={badgeR*2}
                                text={val} fontSize={val.length > 2 ? 9 : 12} fontStyle="bold"
                                fill="white" align="center" verticalAlign="middle" listening={false} />
                        </Group>
                    );
                })}
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
            onClick={() => { setCtxMenu(null); setCtrlSubmenu(false); setBarEditor(null); setBadgeEdit(null); }}
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
                                onContextMenu={(e) => { if (img.layer === activeLayer) openCtxMenu(e, 'image', img.id, img.layer); }}
                            />
                        )
                    ))}
                </Layer>

                {/* Tokens por capa — auras/barras/badges dentro del mismo Group para drag en tiempo real */}
                <Layer name="background" clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>
                    {backgroundItems.map(renderToken)}
                </Layer>

                {/* Grid: entre background y user, sin interacción */}
                <Layer name="grid" listening={false}>{renderGrid()}</Layer>

                <Layer name="user" clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>
                    {userItems.map(renderToken)}
                </Layer>
                {isDm && <Layer name="gm" clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>
                    {gmItems.map(renderToken)}
                </Layer>}

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
                <TokenSpawner sceneItems={sceneItems} gameId={gameId}
                    onEntityUpdated={(kind) => { entityCacheRef.current[kind === 'character' ? 'characters' : 'monsters'] = null; }}
                />
            </div>

            {/* ── MENÚ CONTEXTUAL ── */}
            {ctxMenu && (
                <div
                    ref={ctxMenuRef}
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
                            {ctxMenu.type === 'token' && (
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setCtrlSubmenu(v => !v)}
                                        style={{
                                            width: '100%', padding: '7px 14px',
                                            background: ctrlSubmenu ? 'rgba(99,102,241,0.1)' : 'transparent',
                                            color: '#cbd5e1', border: 'none', cursor: 'pointer',
                                            textAlign: 'left', fontSize: 13,
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = ctrlSubmenu ? 'rgba(99,102,241,0.1)' : 'transparent'}
                                    >
                                        <span>🎮 Asignar control</span>
                                        <span style={{ fontSize: 10 }}>▶</span>
                                    </button>
                                    {ctrlSubmenu && (
                                        <div style={{
                                            position: 'absolute', left: '100%', top: 0,
                                            background: '#1e293b', border: '1px solid #334155',
                                            borderRadius: 6, minWidth: 160, zIndex: 101,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                        }}>
                                            {(() => {
                                                const tok = sceneItems.find(i => i.id === ctxMenu.id);
                                                const assignControl = async (userId) => {
                                                    try {
                                                        const res = await axios.put(`${API}/api/scene-token/${ctxMenu.id}/control`, { user_id: userId }, { headers: authHeaders() });
                                                        setSceneItems(prev => prev.map(i => i.id === ctxMenu.id ? { ...i, controlled_by_id: res.data.controlled_by_id } : i));
                                                    } catch (err) { console.error(err); }
                                                    setCtrlSubmenu(false);
                                                    setCtxMenu(null);
                                                };
                                                return <>
                                                    <button
                                                        onClick={() => assignControl(null)}
                                                        style={{
                                                            width: '100%', padding: '7px 14px', background: tok?.controlled_by_id == null ? 'rgba(99,102,241,0.15)' : 'transparent',
                                                            color: tok?.controlled_by_id == null ? '#818cf8' : '#cbd5e1', border: 'none', cursor: 'pointer',
                                                            textAlign: 'left', fontSize: 13,
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = tok?.controlled_by_id == null ? 'rgba(99,102,241,0.15)' : 'transparent'}
                                                    >
                                                        {tok?.controlled_by_id == null ? '✓ ' : ''}Sin control
                                                    </button>
                                                    {gamePlayers.map(p => (
                                                        <button key={p.id}
                                                            onClick={() => assignControl(p.id)}
                                                            style={{
                                                                width: '100%', padding: '7px 14px',
                                                                background: tok?.controlled_by_id === p.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                                                                color: tok?.controlled_by_id === p.id ? '#818cf8' : '#cbd5e1',
                                                                border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13,
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = tok?.controlled_by_id === p.id ? 'rgba(99,102,241,0.15)' : 'transparent'}
                                                        >
                                                            {tok?.controlled_by_id === p.id ? '✓ ' : ''}{p.name}{p.is_dm ? ' (DM)' : ''}
                                                        </button>
                                                    ))}
                                                </>;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}
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
                            <button
                                onClick={() => {
                                    setAuraEditor({ tokenId: ctxMenu.id, screenX: ctxMenu.x, screenY: ctxMenu.y });
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
                                    🔮 Editar auras
                            </button>
                            {(() => {
                                const tok = sceneItems.find(i => i.id === ctxMenu.id);
                                if (!tok || !tok.image_url || !tok.entity_id || !['character','monster'].includes(tok.kind)) return null;
                                return (
                                    <button
                                        onClick={async () => {
                                            const endpoint = tok.kind === 'character'
                                                ? `${API}/api/character/${tok.entity_id}/set-default-token`
                                                : `${API}/api/monster/${tok.entity_id}/set-default-token`;
                                            try {
                                                await axios.post(endpoint, { image_url: tok.image_url }, { headers: authHeaders() });
                                            } catch (err) { console.error(err); }
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
                                        ⭐ Token por defecto
                                    </button>
                                );
                            })()}
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
                const fieldDefs = token.kind === 'character' ? CHARACTER_COUNTER_FIELDS
                                : token.kind === 'monster'   ? MONSTER_COUNTER_FIELDS
                                : null;

                const applyField = async (fieldDef, barIdx) => {
                    let entity = null;
                    const cache = entityCacheRef.current;
                    if (token.kind === 'character') {
                        if (!cache.characters) {
                            const r = await axios.get(`${API}/api/character/my-characters`, { headers: authHeaders() });
                            cache.characters = r.data;
                        }
                        entity = cache.characters.find(c => c.id === token.entity_id);
                    } else if (token.kind === 'monster') {
                        if (!cache.monsters) {
                            const r = await axios.get(`${API}/api/monster/my-monsters`, { headers: authHeaders() });
                            cache.monsters = r.data;
                        }
                        entity = cache.monsters.find(m => m.id === token.entity_id);
                    }
                    const vals = entity ? fieldDef.getVals(entity) : { current: 0, max: 0 };
                    const updated = counters.map((x, j) => j === barIdx ? { ...x, label: fieldDef.label, ...vals } : x);
                    saveCounters(token.id, updated);
                };

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
                                {fieldDefs ? (
                                    <select
                                        value={c.label}
                                        onChange={e => {
                                            const def = fieldDefs.find(f => f.label === e.target.value);
                                            if (def) applyField(def, i);
                                            else {
                                                const updated = counters.map((x, j) => j === i ? { ...x, label: '' } : x);
                                                saveCounters(token.id, updated);
                                            }
                                        }}
                                        style={{ width: 100, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: c.label ? '#f1f5f9' : '#475569', fontSize: 11, padding: '3px 5px', outline: 'none' }}
                                    >
                                        <option value="">Sin nombre</option>
                                        {fieldDefs.map(f => (
                                            <option key={f.label} value={f.label}>{f.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        value={c.label}
                                        onChange={e => {
                                            const updated = counters.map((x, j) => j === i ? { ...x, label: e.target.value } : x);
                                            saveCounters(token.id, updated);
                                        }}
                                        placeholder={`Barra ${i + 1}`}
                                        style={{ width: 70, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#f1f5f9', fontSize: 11, padding: '3px 5px', outline: 'none' }}
                                    />
                                )}
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

            {/* ── EDITOR DE AURAS ── */}
            {auraEditor && (() => {
                const token = sceneItems.find(i => i.id === auraEditor.tokenId);
                if (!token) return null;
                const auras = getAuras(token);
                const AURA_COLORS = ['#a855f7','#3b82f6','#22c55e','#ef4444','#f97316','#eab308','#ec4899','#f1f5f9'];
                const addAura = () => saveAuras(token.id, [...auras, { shape: 'circle', feet: 10, color: '#a855f7', opacity: 0.2 }]);
                const removeAura = (idx) => saveAuras(token.id, auras.filter((_, i) => i !== idx));
                const updateAura = (idx, patch) => saveAuras(token.id, auras.map((a, i) => i === idx ? { ...a, ...patch } : a));
                const inputStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#f1f5f9', fontSize: 11, padding: '3px 5px', outline: 'none' };

                return (
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'fixed', top: auraEditor.screenY - 8, left: auraEditor.screenX,
                            background: '#1e293b', border: '1px solid #334155',
                            borderRadius: 8, padding: '10px 12px',
                            zIndex: 200, minWidth: 240,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Auras</span>
                            <button onClick={() => setAuraEditor(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                        </div>

                        {auras.length === 0 && (
                            <p style={{ color: '#475569', fontSize: 11, margin: '0 0 8px' }}>Sin auras. Añade una.</p>
                        )}

                        {auras.map((aura, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10, padding: '7px 8px', background: '#0f172a', borderRadius: 6, border: '1px solid #1e293b' }}>
                                {/* Fila 1: forma + pies + color + borrar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <select value={aura.shape}
                                        onChange={e => updateAura(idx, { shape: e.target.value })}
                                        style={{ ...inputStyle, width: 72 }}>
                                        <option value="circle">Círculo</option>
                                        <option value="square">Cuadrado</option>
                                    </select>
                                    <input type="number" min="5" step="5" value={aura.feet}
                                        onChange={e => updateAura(idx, { feet: Math.max(5, Number(e.target.value)) })}
                                        style={{ ...inputStyle, width: 50, textAlign: 'center' }} />
                                    <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>pies</span>
                                    <div style={{ flex: 1 }} />
                                    <button onClick={() => removeAura(idx)}
                                        style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 15, padding: 0 }}>×</button>
                                </div>
                                {/* Fila 2: paleta de color */}
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                    {AURA_COLORS.map(c => (
                                        <div key={c} onClick={() => updateAura(idx, { color: c })}
                                            style={{
                                                width: 16, height: 16, borderRadius: '50%', background: c,
                                                cursor: 'pointer', flexShrink: 0,
                                                outline: aura.color === c ? '2px solid white' : 'none', outlineOffset: 2,
                                            }} />
                                    ))}
                                    <span style={{ color: '#475569', fontSize: 10, marginLeft: 4 }}>
                                        Op: <input type="number" min="5" max="100" step="5"
                                            value={Math.round((aura.opacity ?? 0.2) * 100)}
                                            onChange={e => updateAura(idx, { opacity: Math.max(0.05, Math.min(1, Number(e.target.value) / 100)) })}
                                            style={{ ...inputStyle, width: 38, textAlign: 'center' }} />%
                                    </span>
                                </div>
                            </div>
                        ))}

                        <button onClick={addAura}
                            style={{
                                width: '100%', background: '#334155', border: 'none', borderRadius: 5,
                                color: '#94a3b8', fontSize: 12, padding: '6px 0', cursor: 'pointer',
                            }}>+ Añadir aura</button>

                        {token.entity_id && ['character','monster'].includes(token.kind) && (
                            <button onClick={async () => {
                                const endpoint = token.kind === 'character'
                                    ? `${API}/api/character/${token.entity_id}/set-default-auras`
                                    : `${API}/api/monster/${token.entity_id}/set-default-auras`;
                                try {
                                    await axios.post(endpoint, { auras }, { headers: authHeaders() });
                                } catch (err) { console.error(err); }
                            }}
                            style={{
                                width: '100%', marginTop: 4, background: 'rgba(168,85,247,0.2)',
                                border: '1px solid #a855f7', borderRadius: 5,
                                color: '#a855f7', fontSize: 12, padding: '6px 0', cursor: 'pointer',
                            }}>⭐ Guardar auras como defecto</button>
                        )}
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
                Arrastra al tablero · Mantén Shift para posición libre
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

            {sheetModal?.kind === 'character' && (
                <EditCharacterModal
                    isOpen={true}
                    onClose={() => setSheetModal(null)}
                    character={sheetModal.entity}
                    onCharacterUpdated={() => { entityCacheRef.current.characters = null; }}
                />
            )}
            {sheetModal?.kind === 'monster' && (
                <EditMonsterModal
                    isOpen={true}
                    onClose={() => setSheetModal(null)}
                    monster={sheetModal.entity}
                    onMonsterUpdated={() => { entityCacheRef.current.monsters = null; }}
                />
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
