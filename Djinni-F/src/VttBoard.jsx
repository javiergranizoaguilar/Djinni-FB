import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { computeLoS } from './los.js';
import { Stage, Layer, Circle, Rect, Text, Group, Image as KonvaImage, Transformer, Line, Arrow } from 'react-konva';
import Konva from 'konva';

// Konva 10 registers `mouseup` on window (useCapture=true) at module load to end
// drags. It does NOT filter by mouse button, so a right-button release while
// left-dragging ends the drag and resets the movement ruler. Wrap Konva's
// drag-end handlers to skip when evt.button === 2.
(() => {
    if (typeof window === 'undefined' || !Konva || !Konva.DD || Konva.DD.__rightBtnPatched) return;
    const origBefore = Konva.DD._endDragBefore;
    const origAfter  = Konva.DD._endDragAfter;
    const wrapBefore = function (evt) { if (evt && evt.button === 2) return; return origBefore.call(this, evt); };
    const wrapAfter  = function (evt) { if (evt && evt.button === 2) return; return origAfter.call(this, evt); };
    window.removeEventListener('mouseup', origBefore, true);
    window.removeEventListener('mouseup', origAfter,  false);
    window.addEventListener('mouseup', wrapBefore, true);
    window.addEventListener('mouseup', wrapAfter,  false);
    Konva.DD.__rightBtnPatched = true;
})();
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import SceneSelector from './ingame/SceneSelector.jsx';
import TokenSpawner from './ingame/TokenSpawner.jsx';
import ChatTab from './ingame/ChatTab.jsx';
import EditCharacterModal from './pages/EditCharacterModal.jsx';
import EditMonsterModal from './pages/EditMonsterModal.jsx';

const API    = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_URL = import.meta.env.VITE_WS_URL  || 'ws://localhost:8081';
const HEADER_H  = 0;
const TOOLBAR_H = 44;
const SIDEBAR_W_DEFAULT = 200;
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
    { id: 'gm',         label: 'GM',    dmOnly: true },
    { id: 'walls',      label: 'Walls', dmOnly: true },
    { id: 'fog',        label: 'Fog',   dmOnly: true },
];

function getShapeBB(shape) {
    if (shape.type === 'rect') {
        const [x, y, w, h] = shape.points;
        return { minX: x, minY: y, maxX: x + w, maxY: y + h };
    }
    const pts = shape.points;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
        minX = Math.min(minX, pts[i]);   maxX = Math.max(maxX, pts[i]);
        minY = Math.min(minY, pts[i+1]); maxY = Math.max(maxY, pts[i+1]);
    }
    return { minX, minY, maxX, maxY };
}
function bbsOverlap(a, b) {
    return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

const colorMap = {
    red:    '#FF0000',
    blue:   '#0000FF',
    green:  '#00FF00',
    yellow: '#FFFF00',
};

const DEFAULT_COUNTERS = [
    { label: '', current: 0, max: 0, color: '#22c55e', linked_field: null },
    { label: '', current: 0, max: 0, color: '#3b82f6', linked_field: null },
    { label: '', current: 0, max: 0, color: '#f59e0b', linked_field: null },
];

// Campos de personaje: { label, key, getVals(entity) → {current, max} }
const CHARACTER_COUNTER_FIELDS = [
    { label: 'HP', key: 'hp', maxKey: 'max_hp', getVals: c => ({ current: c.hp ?? 0, max: c.max_hp ?? c.hp ?? 0 }) },
];

// Campos de monstruo: { label, key, maxKey?, getVals(entity) → {current, max} }
const MONSTER_COUNTER_FIELDS = [
    { label: 'HP', key: 'hp', maxKey: 'max_hp', getVals: m => ({ current: m.hp ?? 0, max: m.max_hp ?? m.hp ?? 0 }) },
    { label: 'CA', key: 'ac', getVals: m => ({ current: m.ac ?? 0, max: m.ac ?? 0 }) },
];
const BAR_H = 5;
const BAR_GAP = 2;
const BAR_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#ec4899','#ffffff'];

// Componente para tokens con imagen — Group único para que auras/barras sigan el drag
// ref apunta al KonvaImage (no al Group) → Transformer solo rodea la imagen, no las auras
const TokenImageNode = forwardRef(function TokenImageNode(
    { item, squareSize, boardX, boardY, opacity, draggable, onClick, onDblClick, onDragStart, onDragMove, onDragEnd, onTransformEnd, onContextMenu,
      auras, activeCounters, isSelected, editingIdx, onBadgeClick, onNameDblClick },
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
            onClick={onClick} onTap={onClick} onDblClick={onDblClick} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} onContextMenu={onContextMenu}
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
                if (c.origIdx === editingIdx) return null;
                const badgeCx = badgeStartX + arrIdx * (badgeR * 2 + badgeGap);
                const val = String(c.current);
                return (
                    <Group key={arrIdx}
                        onMouseDown={e => { e.cancelBubble = true; e.evt.stopPropagation(); }}
                        onTouchStart={e => { e.cancelBubble = true; e.evt.stopPropagation(); }}
                        onClick={e => { e.cancelBubble = true; e.evt.stopPropagation(); onBadgeClick(e, c.origIdx, c.current); }}
                        onTap={e => { e.cancelBubble = true; e.evt.stopPropagation(); onBadgeClick(e, c.origIdx, c.current); }}
                    >
                        <Circle x={badgeCx} y={badgeCy} radius={badgeR} fill={c.color} strokeWidth={2} stroke="#0f172a" />
                        <Text x={badgeCx - badgeR} y={badgeCy - badgeR} width={badgeR*2} height={badgeR*2}
                            text={val} fontSize={Math.max(6, Math.min(12, Math.floor(badgeR * 1.4 / val.length)))} fontStyle="bold"
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

function WallEditor({ wall, onApply }) {
    const [x1, setX1] = useState(Math.round(wall.x1));
    const [y1, setY1] = useState(Math.round(wall.y1));
    const [x2, setX2] = useState(Math.round(wall.x2));
    const [y2, setY2] = useState(Math.round(wall.y2));

    const inputStyle = {
        background: '#0f172a', border: '1px solid #334155', borderRadius: 4,
        color: '#f1f5f9', fontSize: 11, padding: '3px 5px', outline: 'none',
        width: '100%', textAlign: 'center', boxSizing: 'border-box',
    };
    const labelStyle = { color: '#94a3b8', fontSize: 10, display: 'flex', flexDirection: 'column', gap: 2 };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: '1px solid #334155' }}>
            <span style={{ color: '#facc15', fontSize: 11, fontWeight: 700 }}>Editar muro seleccionado</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <label style={labelStyle}>x1<input type="number" value={x1} onChange={e => setX1(Math.round(Number(e.target.value)))} style={inputStyle} /></label>
                <label style={labelStyle}>y1<input type="number" value={y1} onChange={e => setY1(Math.round(Number(e.target.value)))} style={inputStyle} /></label>
                <label style={labelStyle}>x2<input type="number" value={x2} onChange={e => setX2(Math.round(Number(e.target.value)))} style={inputStyle} /></label>
                <label style={labelStyle}>y2<input type="number" value={y2} onChange={e => setY2(Math.round(Number(e.target.value)))} style={inputStyle} /></label>
            </div>
            <button onClick={() => onApply({ x1, y1, x2, y2 })} style={{
                padding: '6px 0', fontSize: 12, border: 'none', borderRadius: 4,
                background: '#facc15', color: '#1e293b', fontWeight: 700, cursor: 'pointer',
            }}>Aplicar</button>
        </div>
    );
}

export default function VttBoard() {
    const { id: gameId } = useParams();
    const navigate = useNavigate();
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
    const [dropIndicator,  setDropIndicator]  = useState(null); // {x,y,w,h} en coords de pantalla
    const [barEditor,      setBarEditor]      = useState(null); // {tokenId, screenX, screenY}
    const [auraEditor,     setAuraEditor]     = useState(null); // {tokenId, screenX, screenY}
    const [badgeEdit,      setBadgeEdit]      = useState(null); // {tokenId, counterIdx, screenX, screenY, value}
    const [namePopups,     setNamePopups]     = useState([]); // [{id, name, x, y}]
    const [dragRuler,      setDragRuler]      = useState({ active: false, origin: null, waypoints: [], current: null });
    const [freeRulerMode,  setFreeRulerMode]  = useState(false);
    const [rulerShape,     setRulerShape]     = useState('line'); // 'line' | 'cone'
    const [freeRuler,      setFreeRuler]      = useState({ active: false, origin: null, waypoints: [], current: null });
    const [sharedPaths,    setSharedPaths]    = useState([]);
    const [sheetModal,     setSheetModal]     = useState(null); // {kind, entity}
    const [childModalOpen, setChildModalOpen] = useState(false); // modal abierto desde sidebar
    const [sidebarTab,     setSidebarTab]     = useState('tokens');
    const [sidebarW,       setSidebarW]       = useState(SIDEBAR_W_DEFAULT);
    const [fogData,        setFogData]        = useState({ mode: 'fog', revealed: [] });
    const [wallsData,      setWallsData]      = useState({ walls: [] });
    const [fogOpacity,     setFogOpacity]     = useState(0.7);
    const [fogDrawTool,    setFogDrawTool]    = useState('rect');
    const [fogDrawing,     setFogDrawing]     = useState(null);
    const [fogAction,      setFogAction]      = useState('reveal');
    const [wallDrawing,    setWallDrawing]    = useState(null);
    const [wallDrawMode,   setWallDrawMode]   = useState('line');
    const [selectedWallId, setSelectedWallId] = useState(null);
    const [ephemeralReveal, setEphemeralReveal] = useState([]);
    const [windowSize,     setWindowSize]     = useState({ w: window.innerWidth, h: window.innerHeight });
    const [boardOrigin,    setBoardOrigin]    = useState(() => {
        const bw = 10 * 50, bh = 10 * 50;
        const availW = window.innerWidth  - SIDEBAR_W_DEFAULT;
        const availH = window.innerHeight - HEADER_H - TOOLBAR_H;
        return {
            x: SIDEBAR_W_DEFAULT + Math.floor((availW - bw) / 2),
            y: HEADER_H + TOOLBAR_H + Math.floor((availH - bh) / 2),
        };
    });

    const stageRef            = useRef(null);
    const transformerRef      = useRef(null);
    const imageNodesRef       = useRef({});
    const tokenNodesRef       = useRef({});
    const isPanning           = useRef(false);
    const entityCacheRef      = useRef({ characters: null, monsters: null });
    const spawnerRef          = useRef(null);
    const lastPanPos          = useRef({ x: 0, y: 0 });
    const dragRulerRef        = useRef({ active: false, origin: null, waypoints: [], current: null });
    const freeRulerRef        = useRef({ active: false, origin: null, waypoints: [], current: null });
    const freeRulerModeRef    = useRef(false);
    const rulerShapeRef       = useRef('line');
    const pendingAnimations   = useRef({});
    const pendingPositions    = useRef({});
    const shiftHeld           = useRef(false);
    const ctxMenuRef          = useRef(null);
    const vttWsRef            = useRef(null);
    const sceneIdRef          = useRef(null);
    const draggingTokenIdRef  = useRef(null);
    const currentUserIdRef    = useRef(null);
    const isDmRef             = useRef(false);
    const sceneItemsRef       = useRef([]);
    const fogDataRef          = useRef({ mode: 'fog', revealed: [] });
    const fogDrawingRef       = useRef(null);
    const wallsDataRef        = useRef({ walls: [] });
    const activeLayerRef      = useRef('user');

    const gridWidth        = scene?.grid_width  || 10;
    const gridHeight       = scene?.grid_height || 10;
    const squareSize       = 50;
    const boardPixelWidth  = gridWidth  * squareSize;
    const boardPixelHeight = gridHeight * squareSize;
    const availableW = windowSize.w - sidebarW;
    const availableH = windowSize.h - HEADER_H - TOOLBAR_H;
    const boardX = boardOrigin.x;
    const boardY = boardOrigin.y;

    // ── Rastrear Shift globalmente ────────────────────────────────────────────
    useEffect(() => {
        const down = (e) => { if (e.key === 'Shift') shiftHeld.current = true;  };
        const up   = (e) => { if (e.key === 'Shift') shiftHeld.current = false; };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup',   up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    // ── Actualizar dimensiones al redimensionar la ventana ───────────────────
    useEffect(() => {
        const onResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Delete key removes selected wall segment ──────────────────────────────
    useEffect(() => {
        if (!isDm) return;
        const onKeyDown = async (e) => {
            if (e.key !== 'Delete') return;
            if (activeLayer !== 'walls' || !selectedWallId) return;
            const newData = { walls: wallsData.walls.filter(w => w.id !== selectedWallId) };
            setSelectedWallId(null);
            setWallsData(newData);
            if (scene) {
                try {
                    await axios.put(`${API}/scene/api/scenes/${scene.id}/walls`, { walls_data: newData }, { headers: authHeaders() });
                    sendTokenEvent('scene_walls_updated', { sceneId: scene.id, wallsData: newData });
                } catch (err) { console.error(err); }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isDm, activeLayer, selectedWallId, wallsData, scene]);

    // ── Recentrar el tablero al cambiar la escena o el sidebar (no en resize) ─
    useEffect(() => {
        const bw = (scene?.grid_width  || 10) * 50;
        const bh = (scene?.grid_height || 10) * 50;
        const availW = windowSize.w - sidebarW;
        const availH = windowSize.h - HEADER_H - TOOLBAR_H;
        setBoardOrigin({
            x: sidebarW + Math.floor((availW - bw) / 2),
            y: HEADER_H + TOOLBAR_H + Math.floor((availH - bh) / 2),
        });
    }, [scene?.id, scene?.grid_width, scene?.grid_height, sidebarW, windowSize.w, windowSize.h]);

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
        const cx = sidebarW + availableW / 2;
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
                setFogData(res.data.fog_data || { mode: 'fog', revealed: [] });
                setWallsData(res.data.walls_data || { walls: [] });
                await Promise.all([fetchTokens(res.data.id), fetchImages(res.data.id)]);
            } catch {
                setError('No se pudo cargar la escena.');
            }
        };
        load();
    }, [gameId]);

    useEffect(() => { sceneIdRef.current = scene?.id ?? null; }, [scene]);
    useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);
    useEffect(() => { isDmRef.current = isDm; }, [isDm]);
    useEffect(() => { sceneItemsRef.current = sceneItems; }, [sceneItems]);
    useEffect(() => { fogDataRef.current = fogData; }, [fogData]);
    useEffect(() => { fogDrawingRef.current = fogDrawing; }, [fogDrawing]);
    useEffect(() => { wallsDataRef.current = wallsData; }, [wallsData]);
    useEffect(() => { activeLayerRef.current = activeLayer; }, [activeLayer]);
    useEffect(() => { freeRulerModeRef.current = freeRulerMode; }, [freeRulerMode]);
    useEffect(() => { rulerShapeRef.current = rulerShape; }, [rulerShape]);

    // ── Escape cancels free ruler ─────────────────────────────────────────────
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && freeRulerModeRef.current) {
                setFreeRulerMode(false);
                const empty = { active: false, origin: null, waypoints: [], current: null };
                freeRulerRef.current = empty;
                setFreeRuler(empty);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // ── Drag ruler right-click waypoint placement ────────────────────────────
    // Use mousedown (not pointerdown): pointerdown only fires on transition
    // from no-buttons-pressed. With left already held for the drag, pressing
    // right does NOT emit a new pointerdown. mousedown fires per-button.
    useEffect(() => {
        const onMouseDown = (e) => {
            const stage = stageRef.current;
            if (!stage) return;
            const rect = stage.container().getBoundingClientRect();
            // Ignore clicks outside the canvas area
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const scale = stage.scaleX();
            const cx = (px - stage.x()) / scale;
            const cy = (py - stage.y()) / scale;

            if (e.button === 0 && freeRulerModeRef.current && !freeRulerRef.current.active) {
                // Start free ruler on left-click anywhere on canvas (even on top of tokens)
                const next = { active: true, origin: { x: cx, y: cy }, waypoints: [], current: { x: cx, y: cy } };
                freeRulerRef.current = next;
                setFreeRuler(next);
                return;
            }

            if (e.button !== 2) return;
            if (dragRulerRef.current.active) {
                e.preventDefault();
                const next = {
                    ...dragRulerRef.current,
                    waypoints: [...dragRulerRef.current.waypoints, { x: cx, y: cy }],
                };
                dragRulerRef.current = next;
                setDragRuler(next);
            } else if (freeRulerRef.current.active && rulerShapeRef.current === 'line') {
                e.preventDefault();
                const next = {
                    ...freeRulerRef.current,
                    waypoints: [...freeRulerRef.current.waypoints, { x: cx, y: cy }],
                };
                freeRulerRef.current = next;
                setFreeRuler(next);
            }
        };
        const onContextMenu = (e) => {
            if (!dragRulerRef.current.active && !freeRulerRef.current.active) return;
            e.preventDefault();
        };
        const onMouseMove = (e) => {
            if (!freeRulerRef.current.active) return;
            const stage = stageRef.current;
            if (!stage) return;
            const rect = stage.container().getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const scale = stage.scaleX();
            const cx = (px - stage.x()) / scale;
            const cy = (py - stage.y()) / scale;
            const next = { ...freeRulerRef.current, current: { x: cx, y: cy } };
            freeRulerRef.current = next;
            setFreeRuler(next);
        };

        const onMouseUp = (e) => {
            if (e.button !== 0 || !freeRulerRef.current.active) return;
            const stage = stageRef.current;
            if (!stage) return;
            const rect = stage.container().getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
            const empty = { active: false, origin: null, waypoints: [], current: null };
            freeRulerRef.current = empty;
            setFreeRuler(empty);
        };

        window.addEventListener('mousedown',   onMouseDown,   true);
        window.addEventListener('mousemove',   onMouseMove,   true);
        window.addEventListener('mouseup',     onMouseUp,     true);
        window.addEventListener('contextmenu', onContextMenu, true);
        return () => {
            window.removeEventListener('mousedown',   onMouseDown,   true);
            window.removeEventListener('mousemove',   onMouseMove,   true);
            window.removeEventListener('mouseup',     onMouseUp,     true);
            window.removeEventListener('contextmenu', onContextMenu, true);
        };
    }, []);

    // ── Ephemeral LoS — recompute whenever tokens or walls change ─────────────
    useEffect(() => {
        const wlist = (wallsData?.walls || []).flatMap(w => {
            if (w.type === 'rect') {
                const x1 = Math.min(w.x1, w.x2), y1 = Math.min(w.y1, w.y2);
                const x2 = Math.max(w.x1, w.x2), y2 = Math.max(w.y1, w.y2);
                return [
                    { x1, y1, x2, y2: y1 },
                    { x1: x2, y1, x2, y2 },
                    { x1: x2, y1: y2, x2: x1, y2 },
                    { x1, y1: y2, x2: x1, y2: y1 },
                ];
            }
            return [w];
        });
        const ephemeral = [];
        for (const tok of sceneItems) {
            if (!tok.vision_radius || tok.vision_radius <= 0) continue;
            // GM: every token with vision contributes.
            // Player: every character-kind token contributes (party-shared vision).
            if (!isDm && tok.kind !== 'character') continue;
            let cx, cy;
            if (tok.image_url) {
                const tx = tok.x != null ? tok.x : boardX + (tok.col || 0) * squareSize;
                const ty = tok.y != null ? tok.y : boardY + (tok.row || 0) * squareSize;
                cx = tx + (tok.width  || squareSize) / 2;
                cy = ty + (tok.height || squareSize) / 2;
            } else {
                cx = tok.x != null ? tok.x : boardX + (tok.col || 0) * squareSize + squareSize / 2;
                cy = tok.y != null ? tok.y : boardY + (tok.row || 0) * squareSize + squareSize / 2;
            }
            const radiusPx = tok.vision_radius * squareSize / 5;
            const points = computeLoS({ x: cx, y: cy }, radiusPx, wlist);
            if (points.length >= 6) {
                ephemeral.push({ type: 'polygon', points, ephemeral: true });
            }
        }
        setEphemeralReveal(ephemeral);
    }, [sceneItems, wallsData, boardX, boardY, squareSize, currentUserId, isDm]);

    const sendTokenEvent = (type, payload) => {
        if (vttWsRef.current?.readyState === WebSocket.OPEN) {
            vttWsRef.current.send(JSON.stringify({ type, ...payload }));
        }
    };

    useEffect(() => {
        if (!gameId) return;
        let attempts = 0;
        let ws = null;
        let destroyed = false;
        let connectTimer = null;

        const connect = () => {
            ws = new WebSocket(WS_URL);
            vttWsRef.current = ws;

            ws.onopen = () => {
                attempts = 0;
                ws.send(JSON.stringify({ type: 'auth', token: localStorage.getItem('vtt_token'), gameId: Number(gameId) }));
            };

            ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.actorId !== undefined && msg.actorId === currentUserIdRef.current) return;
                    if (msg.sceneId !== undefined && msg.sceneId !== sceneIdRef.current) return;

                    if (msg.type === 'scene_token_created') {
                        const tok = msg.token;
                        if (!isDmRef.current && tok.layer === 'gm') return;
                        setSceneItems(prev => prev.some(i => i.id === tok.id) ? prev : [...prev, tok]);
                    } else if (msg.type === 'scene_token_updated') {
                        const tok = msg.token;
                        if (!isDmRef.current && tok.layer === 'gm') {
                            setSceneItems(prev => prev.filter(i => i.id !== tok.id));
                            return;
                        }
                        if (pendingAnimations.current[tok.id]) {
                            pendingPositions.current[tok.id] = tok;
                            return;
                        }
                        setSceneItems(prev => {
                            const exists = prev.some(i => i.id === tok.id);
                            if (!exists) return [...prev, tok];
                            return prev.map(i => {
                                if (i.id !== tok.id) return i;
                                if (draggingTokenIdRef.current === tok.id) {
                                    const { x, y, col, row, ...rest } = tok;
                                    return { ...i, ...rest };
                                }
                                return { ...i, ...tok };
                            });
                        });
                    } else if (msg.type === 'scene_token_deleted') {
                        setSceneItems(prev => prev.filter(i => i.id !== msg.tokenId));
                    } else if (msg.type === 'scene_image_moved') {
                        setSceneImages(prev => prev.map(i => i.id === msg.imageId ? { ...i, x: msg.x, y: msg.y } : i));
                    } else if (msg.type === 'scene_image_resized') {
                        setSceneImages(prev => prev.map(i => i.id === msg.imageId ? { ...i, x: msg.x, y: msg.y, width: msg.width, height: msg.height } : i));
                    } else if (msg.type === 'scene_image_created') {
                        setSceneImages(prev => prev.some(i => i.id === msg.image.id) ? prev : [...prev, msg.image]);
                    } else if (msg.type === 'scene_image_deleted') {
                        setSceneImages(prev => prev.filter(i => i.id !== msg.imageId));
                    } else if (msg.type === 'scene_fog_updated') {
                        setFogData(msg.fogData || { mode: 'fog', revealed: [] });
                    } else if (msg.type === 'scene_walls_updated') {
                        setWallsData(msg.wallsData || { walls: [] });
                    } else if (msg.type === 'token_path_shown') {
                        const { tokenId, origin, waypoints, dest, feet, durationMs } = msg;
                        const tok = sceneItemsRef.current.find(t => t.id === tokenId);
                        if (!isDmRef.current && (!tok || tok.layer === 'gm')) return;
                        const pathId = Date.now();
                        pendingAnimations.current[tokenId] = { origin, waypoints, dest, durationMs, raf: null };
                        setSharedPaths(prev => [...prev, { id: pathId, tokenId, origin, waypoints, dest, feet }]);
                        setTimeout(() => setSharedPaths(prev => prev.filter(p => p.id !== pathId)), durationMs + 500);
                        const fullPath = [origin, ...waypoints, dest];
                        const segDists = [];
                        let totalDist = 0;
                        for (let i = 1; i < fullPath.length; i++) {
                            const dx = fullPath[i].x - fullPath[i-1].x;
                            const dy = fullPath[i].y - fullPath[i-1].y;
                            const d = Math.sqrt(dx*dx + dy*dy);
                            segDists.push(d);
                            totalDist += d;
                        }
                        if (totalDist < 1) {
                            delete pendingAnimations.current[tokenId];
                            if (pendingPositions.current[tokenId]) {
                                const ft = pendingPositions.current[tokenId];
                                delete pendingPositions.current[tokenId];
                                setSceneItems(prev => prev.map(i => i.id === tokenId ? { ...i, ...ft } : i));
                            }
                        } else {
                            const startTime = performance.now();
                            const animate = (now) => {
                                const elapsed = now - startTime;
                                const t = Math.min(1, elapsed / durationMs);
                                const targetDist = t * totalDist;
                                let accDist = 0;
                                let pos = fullPath[0];
                                for (let si = 0; si < segDists.length; si++) {
                                    if (accDist + segDists[si] >= targetDist) {
                                        const segT = segDists[si] > 0 ? (targetDist - accDist) / segDists[si] : 0;
                                        pos = {
                                            x: fullPath[si].x + (fullPath[si+1].x - fullPath[si].x) * segT,
                                            y: fullPath[si].y + (fullPath[si+1].y - fullPath[si].y) * segT,
                                        };
                                        break;
                                    }
                                    accDist += segDists[si];
                                    pos = fullPath[si+1];
                                }
                                const item = sceneItemsRef.current.find(i => i.id === tokenId);
                                if (item) {
                                    const animX = item.image_url ? pos.x - (item.width || 50) / 2 : pos.x;
                                    const animY = item.image_url ? pos.y - (item.height || 50) / 2 : pos.y;
                                    setSceneItems(prev => prev.map(i => i.id === tokenId ? { ...i, x: animX, y: animY } : i));
                                }
                                if (t < 1 && pendingAnimations.current[tokenId]) {
                                    pendingAnimations.current[tokenId].raf = requestAnimationFrame(animate);
                                } else {
                                    delete pendingAnimations.current[tokenId];
                                    if (pendingPositions.current[tokenId]) {
                                        const ft = pendingPositions.current[tokenId];
                                        delete pendingPositions.current[tokenId];
                                        setSceneItems(prev => prev.map(i => i.id === tokenId ? { ...i, ...ft } : i));
                                    }
                                }
                            };
                            pendingAnimations.current[tokenId].raf = requestAnimationFrame(animate);
                        }
                    }
                } catch {}
            };

            ws.onerror = () => {};
            ws.onclose = () => {
                vttWsRef.current = null;
                if (destroyed) return;
                if (attempts < 5) {
                    const delay = Math.pow(2, attempts) * 1000;
                    attempts++;
                    connectTimer = setTimeout(connect, delay);
                }
            };
        };

        connectTimer = setTimeout(connect, 0);

        return () => {
            destroyed = true;
            clearTimeout(connectTimer);
            ws?.close();
        };
    }, [gameId]);

    const handleSceneSelect = async (newScene) => {
        setScene(newScene);
        setSceneItems([]);
        setSceneImages([]);
        setSelectedImgId(null);
        setFogData(newScene.fog_data || { mode: 'fog', revealed: [] });
        setWallsData(newScene.walls_data || { walls: [] });
        setFogDrawing(null);
        setWallDrawing(null);
        setSelectedWallId(null);
        setEphemeralReveal([]);
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
        x: Math.round(x / squareSize) * squareSize,
        y: Math.round(y / squareSize) * squareSize,
    });

    const snapX = (val) => boardX + Math.round((val - boardX) / squareSize) * squareSize;
    const snapY = (val) => boardY + Math.round((val - boardY) / squareSize) * squareSize;

    // ── Indicador de drop de imagen ───────────────────────────────────────────
    const isFileDrag = (e) => e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');

    const updateDropIndicator = (e) => {
        if (!isFileDrag(e) || !stageRef.current) return;
        const defaultW = 200, defaultH = 200;
        const { x: stageX, y: stageY } = screenToStage(e.clientX, e.clientY);
        const snapped = snapImageToGrid(stageX - boardX - defaultW / 2, stageY - boardY - defaultH / 2);
        const screenTL = stageToScreen(boardX + snapped.x, boardY + snapped.y);
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

        const initialCounters = tokenData.default_counters
            ? tokenData.default_counters.map(c => {
                if (c.linked_field === 'hp' && tokenData.max_hp > 0) {
                    return { ...c, current: tokenData.hp ?? tokenData.max_hp, max: tokenData.max_hp };
                }
                return c;
            })
            : (() => {
                const base = DEFAULT_COUNTERS.map(c => ({ ...c }));
                if (tokenData.max_hp > 0) {
                    base[0] = { ...base[0], label: 'HP', current: tokenData.hp ?? tokenData.max_hp, max: tokenData.max_hp, color: '#22c55e' };
                }
                return base;
            })();

        try {
            const res = await axios.post(`${API}/api/scene-token/scene/${scene.id}`, {
                col, row, layer: (['walls','fog'].includes(activeLayer) ? 'user' : activeLayer),
                color:     tokenData.color     || 'gray',
                name:      tokenData.name      || null,
                image_url: tokenData.image_url || null,
                width:     tokenData.default_width  || squareSize,
                height:    tokenData.default_height || squareSize,
                kind:      tokenData.kind      || null,
                entity_id: tokenData.id        || null,
                counters:  initialCounters,
                auras:     tokenData.default_auras || [],
            }, { headers: authHeaders() });
            setSceneItems(prev => [...prev, res.data]);
            sendTokenEvent('scene_token_created', { token: res.data, sceneId: scene.id });
        } catch (err) {
            console.error('Failed to create token:', err);
        }
    };

    const handleImageFileDrop = async (file, clientX, clientY) => {
        const { x: stageX, y: stageY } = screenToStage(clientX, clientY);
        const defaultW = 200;
        const defaultH = 200;

        const snapped = snapImageToGrid(stageX - boardX - defaultW / 2, stageY - boardY - defaultH / 2);

        const formData = new FormData();
        formData.append('image',  file);
        formData.append('x',      snapped.x);
        formData.append('y',      snapped.y);
        formData.append('width',  defaultW);
        formData.append('height', defaultH);
        formData.append('layer', ['walls','fog'].includes(activeLayer) ? 'user' : activeLayer);

        try {
            const res = await axios.post(
                `${API}/api/scene-image/scene/${scene.id}/upload`,
                formData,
                { headers: { ...authHeaders() } }
            );
            setSceneImages(prev => [...prev, res.data]);
            sendTokenEvent('scene_image_created', { image: res.data, sceneId: scene.id });
        } catch (err) {
            console.error('Failed to upload image:', err);
        }
    };

    // ── Tokens: mover ─────────────────────────────────────────────────────────
    const getTokenDragCenter = (e, item) => {
        const x = e.target.x();
        const y = e.target.y();
        if (item.image_url) {
            return { x: x + (item.width || squareSize) / 2, y: y + (item.height || squareSize) / 2 };
        }
        return { x, y };
    };

    const handleDragStartToken = (e, item) => {
        draggingTokenIdRef.current = item.id;
        const c = getTokenDragCenter(e, item);
        const next = { active: true, origin: c, waypoints: [], current: c };
        dragRulerRef.current = next;
        setDragRuler(next);
    };

    const handleDragMoveToken = (e, item) => {
        if (!dragRulerRef.current.active) return;
        const c = getTokenDragCenter(e, item);
        const next = { ...dragRulerRef.current, current: c };
        dragRulerRef.current = next;
        setDragRuler(next);
    };

    const clearDragRuler = () => {
        const empty = { active: false, origin: null, waypoints: [], current: null };
        dragRulerRef.current = empty;
        setDragRuler(empty);
    };

    const broadcastPathAndUpdate = (item, pathSnapshot, finalTok) => {
        if (pathSnapshot.active && pathSnapshot.origin && pathSnapshot.current) {
            const pts = [pathSnapshot.origin, ...pathSnapshot.waypoints, pathSnapshot.current];
            let totalSquares = 0;
            for (let i = 1; i < pts.length; i++) {
                const dx = Math.abs(pts[i].x - pts[i-1].x) / squareSize;
                const dy = Math.abs(pts[i].y - pts[i-1].y) / squareSize;
                totalSquares += Math.max(dx, dy);
            }
            const feet = Math.round(totalSquares) * 5;
            const durationMs = Math.max(2000, 2000 * feet / 100);
            sendTokenEvent('token_path_shown', {
                tokenId: item.id,
                sceneId: sceneIdRef.current,
                origin: pathSnapshot.origin,
                waypoints: pathSnapshot.waypoints,
                dest: pathSnapshot.current,
                feet,
                durationMs,
            });
        }
        sendTokenEvent('scene_token_updated', { token: finalTok, sceneId: sceneIdRef.current });
    };

    const handleDragEndToken = async (e, item) => {
        draggingTokenIdRef.current = null;
        const pathSnapshot = { ...dragRulerRef.current };
        clearDragRuler();
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
                broadcastPathAndUpdate(item, pathSnapshot, { ...item, x: px, y: py, col, row });
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
                broadcastPathAndUpdate(item, pathSnapshot, { ...item, x: null, y: null, col, row });
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
            sendTokenEvent('scene_image_moved', { imageId: item.id, sceneId: sceneIdRef.current, ...pos });
        } catch (err) { console.error(err); }
    };

    // ── Tokens con imagen: redimensionar ─────────────────────────────────────
    const handleTokenTransformEnd = async (e, item) => {
        draggingTokenIdRef.current = null;
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
            sendTokenEvent('scene_token_updated', { token: { ...item, x: xSave, y: ySave, col, row, width: newWidth, height: newHeight }, sceneId: sceneIdRef.current });
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
            const sr     = (v) => Math.round(v / squareSize) * squareSize;
            const left   = sr(newX);
            const top    = sr(newY);
            const right  = sr(newX + newWidth);
            const bottom = sr(newY + newHeight);
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
            sendTokenEvent('scene_image_resized', { imageId: item.id, sceneId: sceneIdRef.current, x: newX, y: newY, width: newWidth, height: newHeight });
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
                sendTokenEvent('scene_token_deleted', { tokenId: ctxMenu.id, sceneId: sceneIdRef.current });
            } else {
                await axios.delete(`${API}/api/scene-image/${ctxMenu.id}`, { headers: authHeaders() });
                setSceneImages(prev => prev.filter(i => i.id !== ctxMenu.id));
                sendTokenEvent('scene_image_deleted', { imageId: ctxMenu.id, sceneId: sceneIdRef.current });
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
                const tok = sceneItemsRef.current.find(i => i.id === ctxMenu.id);
                if (tok) sendTokenEvent('scene_token_updated', { token: { ...tok, layer: newLayer }, sceneId: sceneIdRef.current });
            } else {
                await axios.put(`${API}/api/scene-image/${ctxMenu.id}`, { layer: newLayer }, { headers: authHeaders() });
                setSceneImages(prev => prev.map(i => i.id === ctxMenu.id ? { ...i, layer: newLayer } : i));
            }
        } catch (err) { console.error(err); }
        setCtxMenu(null);
    };

    // ── Fog / Walls drawing (Stage-level mouse handlers) ─────────────────────
    const handleStageMouseDown = (e) => {
        if (e.evt.button !== 0) return;
        const ptr = stageRef.current.getPointerPosition();
        const { x, y } = screenToStage(ptr.x, ptr.y);
        if (freeRulerMode) {
            const next = { active: true, origin: { x, y }, waypoints: [], current: { x, y } };
            freeRulerRef.current = next;
            setFreeRuler(next);
            return;
        }
        if (activeLayer === 'fog' && isDm) {
            const type = fogDrawTool === 'freehand' ? 'polygon' : 'rect';
            setFogDrawing({ type, startX: x, startY: y, points: type === 'rect' ? [x, y, 0, 0] : [x, y] });
            return;
        }
        if (activeLayer === 'walls' && isDm) {
            setWallDrawing({ x1: x, y1: y, x2: x, y2: y });
        }
    };

    const handleStageMouseMove = (e) => {
        if (freeRulerRef.current.active) {
            const ptr = stageRef.current.getPointerPosition();
            const { x, y } = screenToStage(ptr.x, ptr.y);
            const next = { ...freeRulerRef.current, current: { x, y } };
            freeRulerRef.current = next;
            setFreeRuler(next);
            return;
        }
        if (!fogDrawing && !wallDrawing) return;
        const ptr = stageRef.current.getPointerPosition();
        const { x, y } = screenToStage(ptr.x, ptr.y);
        if (fogDrawing && isDm) {
            if (fogDrawTool === 'rect') {
                setFogDrawing(prev => {
                    if (!prev) return null;
                    const rx = Math.min(prev.startX, x), ry = Math.min(prev.startY, y);
                    return { ...prev, points: [rx, ry, Math.abs(x - prev.startX), Math.abs(y - prev.startY)] };
                });
            } else {
                setFogDrawing(prev => prev ? { ...prev, points: [...prev.points, x, y] } : null);
            }
            return;
        }
        if (wallDrawing && isDm) {
            setWallDrawing(prev => prev ? { ...prev, x2: x, y2: y } : null);
        }
    };

    const handleStageMouseUp = async (e) => {
        if (e.evt.button !== 0) return;
        if (freeRulerRef.current.active) {
            const empty = { active: false, origin: null, waypoints: [], current: null };
            freeRulerRef.current = empty;
            setFreeRuler(empty);
            return;
        }
        if (activeLayer === 'fog' && isDm && fogDrawing) {
            if (fogAction === 'reveal') await commitReveal();
            else await commitHide();
            return;
        }
        if (activeLayer === 'walls' && isDm && wallDrawing) {
            const { x1, y1, x2, y2 } = wallDrawing;
            if (Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) > 5) {
                const newWall = { id: Date.now(), type: wallDrawMode, x1, y1, x2, y2 };
                const newData = { walls: [...(wallsData.walls || []), newWall] };
                setWallsData(newData);
                try {
                    await axios.put(`${API}/scene/api/scenes/${scene.id}/walls`, { walls_data: newData }, { headers: authHeaders() });
                    sendTokenEvent('scene_walls_updated', { sceneId: scene.id, wallsData: newData });
                } catch (err) { console.error(err); }
            }
            setWallDrawing(null);
        }
    };

    // ── Fog actions ───────────────────────────────────────────────────────────
    const commitReveal = async () => {
        const fd = fogDrawingRef.current;
        if (!fd || !scene) return;
        const newShape = { id: Date.now(), type: fd.type, points: fd.points };
        const newFogData = { mode: fogData.mode || 'fog', revealed: [...(fogData.revealed || []), newShape] };
        setFogData(newFogData);
        setFogDrawing(null);
        try {
            await axios.put(`${API}/scene/api/scenes/${scene.id}/fog`, { fog_data: newFogData }, { headers: authHeaders() });
            sendTokenEvent('scene_fog_updated', { sceneId: scene.id, fogData: newFogData });
        } catch (err) { console.error(err); }
    };

    const commitHide = async () => {
        const fd = fogDrawingRef.current;
        if (!fd || !scene) return;
        const drawBB = getShapeBB(fd);
        const newRevealed = (fogData.revealed || []).filter(s => !bbsOverlap(drawBB, getShapeBB(s)));
        const newFogData = { ...fogData, revealed: newRevealed };
        setFogData(newFogData);
        setFogDrawing(null);
        try {
            await axios.put(`${API}/scene/api/scenes/${scene.id}/fog`, { fog_data: newFogData }, { headers: authHeaders() });
            sendTokenEvent('scene_fog_updated', { sceneId: scene.id, fogData: newFogData });
        } catch (err) { console.error(err); }
    };

    const revealAll = async () => {
        if (!scene) return;
        const newFogData = { mode: 'clear', revealed: [] };
        setFogData(newFogData);
        try {
            await axios.put(`${API}/scene/api/scenes/${scene.id}/fog`, { fog_data: newFogData }, { headers: authHeaders() });
            sendTokenEvent('scene_fog_updated', { sceneId: scene.id, fogData: newFogData });
        } catch (err) { console.error(err); }
    };

    const hideAll = async () => {
        if (!scene) return;
        const newFogData = { mode: 'fog', revealed: [] };
        setFogData(newFogData);
        try {
            await axios.put(`${API}/scene/api/scenes/${scene.id}/fog`, { fog_data: newFogData }, { headers: authHeaders() });
            sendTokenEvent('scene_fog_updated', { sceneId: scene.id, fogData: newFogData });
        } catch (err) { console.error(err); }
    };

    // ── Walls panel handlers ─────────────────────────────────────────────────
    const persistWalls = async (newData) => {
        setWallsData(newData);
        if (!scene) return;
        try {
            await axios.put(`${API}/scene/api/scenes/${scene.id}/walls`, { walls_data: newData }, { headers: authHeaders() });
            sendTokenEvent('scene_walls_updated', { sceneId: scene.id, wallsData: newData });
        } catch (err) { console.error(err); }
    };
    const deleteWallById = (id) => {
        if (selectedWallId === id) setSelectedWallId(null);
        persistWalls({ walls: (wallsData.walls || []).filter(w => w.id !== id) });
    };
    const applyWallEdit = (id, patch) => {
        persistWalls({ walls: (wallsData.walls || []).map(w => w.id === id ? { ...w, ...patch } : w) });
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

    const syncLinkedCounters = (kind, updatedEntity) => {
        const fieldDefs = kind === 'character' ? CHARACTER_COUNTER_FIELDS : MONSTER_COUNTER_FIELDS;
        setSceneItems(prev => prev.map(tok => {
            if (tok.kind !== kind || tok.entity_id !== updatedEntity.id) return tok;
            const counters = tok.counters || DEFAULT_COUNTERS;
            let changed = false;
            const newCounters = counters.map(c => {
                if (!c.linked_field) return c;
                const def = fieldDefs.find(f => f.key === c.linked_field);
                if (!def) return c;
                const vals = def.getVals(updatedEntity);
                if (vals.current !== c.current || vals.max !== c.max) {
                    changed = true;
                    return { ...c, ...vals };
                }
                return c;
            });
            if (!changed) return tok;
            const updatedTok = { ...tok, counters: newCounters };
            axios.put(`${API}/api/scene-token/${tok.id}`, { counters: newCounters }, { headers: authHeaders() })
                .then(() => sendTokenEvent('scene_token_updated', { token: updatedTok, sceneId: sceneIdRef.current }))
                .catch(() => {});
            return { ...tok, counters: newCounters };
        }));
    };

    const syncLinkedVision = (kind, updatedEntity) => {
        if (!updatedEntity || updatedEntity.vision === undefined) return;
        const newVision = updatedEntity.vision ?? 0;
        setSceneItems(prev => prev.map(tok => {
            if (tok.kind !== kind || tok.entity_id !== updatedEntity.id) return tok;
            if (tok.vision_radius === newVision) return tok;
            const updatedTok = { ...tok, vision_radius: newVision };
            sendTokenEvent('scene_token_updated', { token: updatedTok, sceneId: sceneIdRef.current });
            return updatedTok;
        }));
    };

const saveCounters = async (tokenId, counters) => {
        setSceneItems(prev => prev.map(i => i.id === tokenId ? { ...i, counters } : i));
        try {
            await axios.put(`${API}/api/scene-token/${tokenId}`, { counters }, { headers: authHeaders() });
            const tok = sceneItemsRef.current.find(i => i.id === tokenId);
            if (tok) sendTokenEvent('scene_token_updated', { token: { ...tok, counters }, sceneId: sceneIdRef.current });
        } catch (err) { console.error(err); }
    };

    const saveAuras = async (tokenId, auras) => {
        setSceneItems(prev => prev.map(i => i.id === tokenId ? { ...i, auras } : i));
        try {
            await axios.put(`${API}/api/scene-token/${tokenId}`, { auras }, { headers: authHeaders() });
            const tok = sceneItemsRef.current.find(i => i.id === tokenId);
            if (tok) sendTokenEvent('scene_token_updated', { token: { ...tok, auras }, sceneId: sceneIdRef.current });
        } catch (err) { console.error(err); }
    };


    const getX = (item) => item.x != null ? item.x : boardX + (item.col || 0) * squareSize + squareSize / 2;
    const getY = (item) => item.y != null ? item.y : boardY + (item.row || 0) * squareSize + squareSize / 2;

    const canDragTok = (item) => !freeRulerMode && item.layer === activeLayer && (isDm || item.owner_id === currentUserId || item.controlled_by_id === currentUserId);
    const canDragImg = (item) => isDm && item.layer === activeLayer;
    const getOpacity = (item) => {
        if (!isDm) return 1;
        if (activeLayer === 'gm') return item.layer === 'gm' ? 1 : 0.35;
        return item.layer === 'gm' ? 0.35 : 1;
    };

    const renderToken = (item) => {
        const onCtxMenu = (e) => {
            if (dragRulerRef.current.active) { e.evt.preventDefault(); return; }
            if (item.layer === activeLayer) openCtxMenu(e, 'token', item.id, item.layer);
        };
        const counters = getCounters(item);
        const activeCounters = counters.map((c, i) => ({ ...c, origIdx: i })).filter(c => c.max > 0);
        const auras = getAuras(item);
        const isSelected = selectedTokenId === item.id;
        const editingIdx = (badgeEdit && badgeEdit.tokenId === item.id) ? badgeEdit.counterIdx : null;

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
                    editingIdx={editingIdx}
                    onBadgeClick={(e, counterIdx) => {
                        const stage = stageRef.current;
                        const scale = stage.scaleX();
                        const rect  = stage.container().getBoundingClientRect();
                        const abs   = e.target.getAbsolutePosition();
                        setBadgeEdit({ tokenId: item.id, counterIdx, screenX: rect.left + abs.x, screenY: rect.top + abs.y, value: '', scale });
                    }}
                    onClick={() => { if (!freeRulerMode && item.layer === activeLayer) { setSelectedTokenId(prev => prev === item.id ? null : item.id); setSelectedImgId(null); } }}
                    onDblClick={() => handleTokenDblClick(item)}
                    onNameDblClick={(e) => { if (item.name) setNamePopups(prev => [...prev, { id: Date.now(), name: item.name, x: e.evt.clientX, y: e.evt.clientY }]); }}
                    onDragStart={(e) => handleDragStartToken(e, item)}
                    onDragMove={(e) => handleDragMoveToken(e, item)}
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
                onClick={() => { if (!freeRulerMode && item.layer === activeLayer) { const next = selectedTokenId === item.id ? null : item.id; setSelectedTokenId(next); setSelectedImgId(null); if (!next) setBarEditor(null); } }}
                onDblClick={() => handleTokenDblClick(item)}
                onDragStart={(e) => handleDragStartToken(e, item)}
                onDragMove={(e) => handleDragMoveToken(e, item)}
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
                    if (c.origIdx === editingIdx) return null;
                    const badgeCx = badgeStartX + arrIdx * (badgeR * 2 + badgeGap);
                    const val = String(c.current);
                    return (
                        <Group key={arrIdx}
                            onMouseDown={e => { e.cancelBubble = true; e.evt.stopPropagation(); }}
                            onTouchStart={e => { e.cancelBubble = true; e.evt.stopPropagation(); }}
                            onClick={e => { e.cancelBubble = true; e.evt.stopPropagation(); const stage = stageRef.current; const scale = stage.scaleX(); const rect = stage.container().getBoundingClientRect(); const abs = e.target.getAbsolutePosition(); setBadgeEdit({ tokenId: item.id, counterIdx: c.origIdx, screenX: rect.left + abs.x, screenY: rect.top + abs.y, value: '', scale }); }}
                            onTap={e => { e.cancelBubble = true; e.evt.stopPropagation(); const stage = stageRef.current; const scale = stage.scaleX(); const rect = stage.container().getBoundingClientRect(); const abs = e.target.getAbsolutePosition(); setBadgeEdit({ tokenId: item.id, counterIdx: c.origIdx, screenX: rect.left + abs.x, screenY: rect.top + abs.y, value: '', scale }); }}
                        >
                            <Circle x={badgeCx} y={badgeCy} radius={badgeR} fill={c.color} strokeWidth={2} stroke="#0f172a" />
                            <Text x={badgeCx - badgeR} y={badgeCy - badgeR} width={badgeR*2} height={badgeR*2}
                                text={val} fontSize={Math.max(6, Math.min(12, Math.floor(badgeR * 1.4 / val.length)))} fontStyle="bold"
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
    const allRevealed     = [...(fogData?.revealed || []), ...ephemeralReveal];

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
            onClick={(e) => {
                setCtxMenu(null);
                if (e.target.tagName === 'CANVAS') return;
                setBarEditor(null); setBadgeEdit(null);
            }}
            onContextMenu={(e) => e.preventDefault()}
            style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', cursor: (freeRulerMode || (isDm && (activeLayer === 'fog' || activeLayer === 'walls'))) ? 'crosshair' : undefined }}
        >
            {/* ── CANVAS ── */}
            <Stage
                width={windowSize.w}
                height={windowSize.h}
                style={{ background: '#2c3e50', position: 'absolute', top: 0, left: 0 }}
                ref={stageRef}
                onWheel={handleWheel}
                onClick={(e) => {
                    if (activeLayer === 'fog' || activeLayer === 'walls') return;
                    if (e.target === stageRef.current) { setSelectedImgId(null); setSelectedTokenId(null); setBadgeEdit(null); setSelectedWallId(null); }
                }}
                onMouseDown={handleStageMouseDown}
                onMousemove={handleStageMouseMove}
                onMouseup={handleStageMouseUp}
                onContextMenu={(e) => e.evt.preventDefault()}
            >
                {/* Fondo + imágenes de escena (debajo del grid) */}
                <Layer name="images" clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>
                    <Rect x={boardX} y={boardY} width={boardPixelWidth} height={boardPixelHeight} fill="#ecf0f1" listening={false} />
                    <Group x={boardX} y={boardY}>
                        {sceneImages.map(img => (
                            (!isDm && img.layer === 'gm') ? null : (
                                <SceneImageNode
                                    key={img.id}
                                    ref={(node) => { if (node) imageNodesRef.current[img.id] = node; }}
                                    item={img}
                                    opacity={getOpacity(img)}
                                    draggable={canDragImg(img)}
                                    onClick={() => { if (isDm && img.layer === activeLayer) setSelectedImgId(img.id); }}
                                    onDragEnd={(e) => handleImageDragEnd(e, img)}
                                    onTransformEnd={(e) => handleImageTransformEnd(e, img)}
                                    onContextMenu={(e) => { if (isDm && img.layer === activeLayer) openCtxMenu(e, 'image', img.id, img.layer); }}
                                />
                            )
                        ))}
                    </Group>
                </Layer>

                {/* Tokens de capa background */}
                <Layer name="background" clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>
                    {backgroundItems.map(renderToken)}
                </Layer>

                {/* Grid: entre background y tokens, sin interacción */}
                <Layer name="grid" listening={false}>{renderGrid()}</Layer>

                {/* Tokens de capas user y gm */}
                <Layer name="tokens" clipX={boardX} clipY={boardY} clipWidth={boardPixelWidth} clipHeight={boardPixelHeight}>
                    {userItems.map(renderToken)}
                    {isDm && gmItems.map(renderToken)}
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

                {/* Drag ruler — arrow + waypoints + ft label while dragging a token */}
                {dragRuler.active && dragRuler.origin && dragRuler.current && (() => {
                    const points = [dragRuler.origin, ...dragRuler.waypoints, dragRuler.current];
                    let totalSquares = 0;
                    for (let i = 1; i < points.length; i++) {
                        const dx = Math.abs(points[i].x - points[i - 1].x) / squareSize;
                        const dy = Math.abs(points[i].y - points[i - 1].y) / squareSize;
                        totalSquares += Math.max(dx, dy);
                    }
                    const feet = Math.round(totalSquares) * 5;
                    const flat = points.flatMap(p => [p.x, p.y]);
                    const labelX = dragRuler.current.x;
                    const labelY = dragRuler.current.y - 36;
                    const labelW = 72;
                    const labelH = 22;
                    return (
                        <Layer name="drag-ruler" listening={false}>
                            {/* Shadow pass for depth */}
                            <Arrow
                                points={flat}
                                stroke="rgba(0,0,0,0.55)"
                                fill="rgba(0,0,0,0.55)"
                                strokeWidth={6}
                                pointerLength={14}
                                pointerWidth={14}
                                dash={[12, 7]}
                                listening={false}
                            />
                            {/* Main arrow */}
                            <Arrow
                                points={flat}
                                stroke="#f59e0b"
                                fill="#f59e0b"
                                strokeWidth={3}
                                pointerLength={12}
                                pointerWidth={12}
                                dash={[12, 7]}
                                listening={false}
                            />
                            {/* Waypoint diamonds */}
                            {dragRuler.waypoints.map((w, i) => (
                                <Group key={i} x={w.x} y={w.y} listening={false}>
                                    <Circle radius={7} fill="#1e1b4b" stroke="#f59e0b" strokeWidth={2} />
                                    <Circle radius={3} fill="#f59e0b" />
                                </Group>
                            ))}
                            {/* Label pill background */}
                            <Rect
                                x={labelX - labelW / 2}
                                y={labelY - labelH / 2}
                                width={labelW}
                                height={labelH}
                                fill="#1e1b4b"
                                stroke="#f59e0b"
                                strokeWidth={1.5}
                                cornerRadius={11}
                                listening={false}
                            />
                            <Text
                                x={labelX - labelW / 2}
                                y={labelY - labelH / 2 + 4}
                                width={labelW}
                                text={`${feet} ft`}
                                fontSize={13}
                                fill="#fbbf24"
                                align="center"
                                fontStyle="bold"
                                listening={false}
                            />
                        </Layer>
                    );
                })()}

                {/* Free ruler — standalone measurement without a token */}
                {freeRuler.active && freeRuler.origin && freeRuler.current && (() => {
                    const labelW = 72;
                    const labelH = 22;

                    if (rulerShape === 'cone') {
                        const ox = freeRuler.origin.x, oy = freeRuler.origin.y;
                        const cx = freeRuler.current.x, cy = freeRuler.current.y;
                        const dx = cx - ox, dy = cy - oy;
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d < 1) return null;
                        const dirX = dx / d, dirY = dy / d;
                        const perpX = -dirY, perpY = dirX;
                        const halfW = d / 2;
                        const conePts = [
                            ox, oy,
                            cx + halfW * perpX, cy + halfW * perpY,
                            cx - halfW * perpX, cy - halfW * perpY,
                        ];
                        const feet = Math.round(d / squareSize) * 5;
                        const labelX = cx + dirX * 20;
                        const labelY = cy + dirY * 20;
                        return (
                            <Layer name="free-ruler" listening={false}>
                                <Line points={conePts} closed fill="rgba(245,158,11,0.20)" stroke="#f59e0b" strokeWidth={2} listening={false} />
                                <Rect x={labelX - labelW / 2} y={labelY - labelH / 2} width={labelW} height={labelH} fill="#1e1b4b" stroke="#f59e0b" strokeWidth={1.5} cornerRadius={11} listening={false} />
                                <Text x={labelX - labelW / 2} y={labelY - labelH / 2 + 4} width={labelW} text={`${feet} ft`} fontSize={13} fill="#fbbf24" align="center" fontStyle="bold" listening={false} />
                            </Layer>
                        );
                    }

                    const points = [freeRuler.origin, ...freeRuler.waypoints, freeRuler.current];
                    let totalSquares = 0;
                    for (let i = 1; i < points.length; i++) {
                        const dx = Math.abs(points[i].x - points[i - 1].x) / squareSize;
                        const dy = Math.abs(points[i].y - points[i - 1].y) / squareSize;
                        totalSquares += Math.max(dx, dy);
                    }
                    const feet = Math.round(totalSquares) * 5;
                    const flat = points.flatMap(p => [p.x, p.y]);
                    const labelX = freeRuler.current.x;
                    const labelY = freeRuler.current.y - 36;
                    return (
                        <Layer name="free-ruler" listening={false}>
                            <Arrow points={flat} stroke="rgba(0,0,0,0.55)" fill="rgba(0,0,0,0.55)" strokeWidth={6} pointerLength={14} pointerWidth={14} dash={[12, 7]} listening={false} />
                            <Arrow points={flat} stroke="#f59e0b" fill="#f59e0b" strokeWidth={3} pointerLength={12} pointerWidth={12} dash={[12, 7]} listening={false} />
                            {freeRuler.waypoints.map((w, i) => (
                                <Group key={i} x={w.x} y={w.y} listening={false}>
                                    <Circle radius={7} fill="#1e1b4b" stroke="#f59e0b" strokeWidth={2} />
                                    <Circle radius={3} fill="#f59e0b" />
                                </Group>
                            ))}
                            <Rect x={labelX - labelW / 2} y={labelY - labelH / 2} width={labelW} height={labelH} fill="#1e1b4b" stroke="#f59e0b" strokeWidth={1.5} cornerRadius={11} listening={false} />
                            <Text x={labelX - labelW / 2} y={labelY - labelH / 2 + 4} width={labelW} text={`${feet} ft`} fontSize={13} fill="#fbbf24" align="center" fontStyle="bold" listening={false} />
                        </Layer>
                    );
                })()}

                {/* Shared movement paths from peers */}
                {sharedPaths.length > 0 && (
                    <Layer name="shared-paths" listening={false}>
                        {sharedPaths.map(path => {
                            const pts = [path.origin, ...path.waypoints, path.dest];
                            const flat = pts.flatMap(p => [p.x, p.y]);
                            const labelX = path.dest.x;
                            const labelY = path.dest.y - 36;
                            const labelW = 72;
                            const labelH = 22;
                            return (
                                <Group key={path.id}>
                                    <Arrow points={flat} stroke="rgba(0,0,0,0.55)" fill="rgba(0,0,0,0.55)" strokeWidth={6} pointerLength={14} pointerWidth={14} dash={[12, 7]} listening={false} />
                                    <Arrow points={flat} stroke="#f59e0b" fill="#f59e0b" strokeWidth={3} pointerLength={12} pointerWidth={12} dash={[12, 7]} listening={false} />
                                    {path.waypoints.map((w, i) => (
                                        <Group key={i} x={w.x} y={w.y} listening={false}>
                                            <Circle radius={7} fill="#1e1b4b" stroke="#f59e0b" strokeWidth={2} />
                                            <Circle radius={3} fill="#f59e0b" />
                                        </Group>
                                    ))}
                                    <Rect x={labelX - labelW / 2} y={labelY - labelH / 2} width={labelW} height={labelH} fill="#1e1b4b" stroke="#f59e0b" strokeWidth={1.5} cornerRadius={11} listening={false} />
                                    <Text x={labelX - labelW / 2} y={labelY - labelH / 2 + 4} width={labelW} text={`${path.feet} ft`} fontSize={13} fill="#fbbf24" align="center" fontStyle="bold" listening={false} />
                                </Group>
                            );
                        })}
                    </Layer>
                )}

                {/* Walls layer — GM only, semi-transparent blue segments */}
                {isDm && (
                    <Layer name="walls" listening={activeLayer === 'walls'}>
                        {(wallsData.walls || []).map(wall => {
                            const sel = selectedWallId === wall.id;
                            const stroke = sel ? '#facc15' : '#ef4444';
                            const strokeWidth = sel ? 3 : 2;
                            if (wall.type === 'rect') {
                                const rx = Math.min(wall.x1, wall.x2), ry = Math.min(wall.y1, wall.y2);
                                const rw = Math.abs(wall.x2 - wall.x1), rh = Math.abs(wall.y2 - wall.y1);
                                return (
                                    <Rect key={wall.id}
                                        x={rx} y={ry} width={rw} height={rh}
                                        stroke={stroke} strokeWidth={strokeWidth} fill="transparent"
                                        opacity={0.8} hitStrokeWidth={12}
                                        onClick={() => setSelectedWallId(wall.id)}
                                    />
                                );
                            }
                            return (
                                <Line key={wall.id}
                                    points={[wall.x1, wall.y1, wall.x2, wall.y2]}
                                    stroke={stroke} strokeWidth={strokeWidth}
                                    opacity={0.8} hitStrokeWidth={12}
                                    onClick={() => setSelectedWallId(wall.id)}
                                />
                            );
                        })}
                        {wallDrawing && (
                            wallDrawMode === 'rect' ? (
                                <Rect
                                    x={Math.min(wallDrawing.x1, wallDrawing.x2)}
                                    y={Math.min(wallDrawing.y1, wallDrawing.y2)}
                                    width={Math.abs(wallDrawing.x2 - wallDrawing.x1)}
                                    height={Math.abs(wallDrawing.y2 - wallDrawing.y1)}
                                    stroke="#93c5fd" strokeWidth={3} fill="rgba(147,197,253,0.08)"
                                    opacity={0.8} listening={false}
                                />
                            ) : (
                                <Line
                                    points={[wallDrawing.x1, wallDrawing.y1, wallDrawing.x2, wallDrawing.y2]}
                                    stroke="#93c5fd" strokeWidth={3} opacity={0.8} listening={false}
                                />
                            )
                        )}
                    </Layer>
                )}

                {/* Fog of War layer — topmost content layer */}
                <Layer name="fog" listening={false}>
                    {fogData?.mode !== 'clear' && (
                        <Rect
                            x={boardX} y={boardY}
                            width={boardPixelWidth} height={boardPixelHeight}
                            fill="black"
                            opacity={isDm ? fogOpacity : 1}
                            listening={false}
                        />
                    )}
                    {allRevealed.map((shape, idx) => {
                        if (shape.type === 'rect') {
                            const [rx, ry, rw, rh] = shape.points;
                            return (
                                <Rect key={shape.id ?? `eph-${idx}`}
                                    x={rx} y={ry} width={rw} height={rh}
                                    fill="black"
                                    globalCompositeOperation="destination-out"
                                    listening={false}
                                />
                            );
                        }
                        return (
                            <Line key={shape.id ?? `eph-${idx}`}
                                points={shape.points}
                                closed
                                fill="black"
                                globalCompositeOperation="destination-out"
                                listening={false}
                            />
                        );
                    })}
                    {isDm && fogDrawing && (() => {
                        if (fogDrawing.type === 'rect') {
                            const [rx, ry, rw, rh] = fogDrawing.points;
                            return (
                                <Rect x={rx} y={ry} width={rw} height={rh}
                                    stroke="#60a5fa" strokeWidth={2} dash={[6, 3]}
                                    fill="rgba(96,165,250,0.12)" listening={false} />
                            );
                        }
                        return (
                            <Line points={fogDrawing.points} closed
                                stroke="#60a5fa" strokeWidth={2} dash={[6, 3]}
                                fill="rgba(96,165,250,0.12)" listening={false} />
                        );
                    })()}
                </Layer>
            </Stage>

            {/* ── NAME POPUPS ── */}
            {namePopups.map(popup => (
                <div
                    key={popup.id}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        const ox = e.clientX - popup.x;
                        const oy = e.clientY - popup.y;
                        const id = popup.id;
                        const onMove = (ev) => {
                            setNamePopups(prev => prev.map(p => p.id === id ? { ...p, x: ev.clientX - ox, y: ev.clientY - oy } : p));
                        };
                        const onUp = () => {
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                        };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: popup.y,
                        left: popup.x,
                        background: 'rgba(0,0,0,0.45)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        zIndex: 250,
                        cursor: 'grab',
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'sans-serif' }}>{popup.name}</span>
                    <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); setNamePopups(prev => prev.filter(p => p.id !== popup.id)); }}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                    >×</button>
                </div>
            ))}

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

                {/* Herramienta regla libre */}
                {[
                    { shape: 'line', icon: '📏', title: 'Regla (clic y arrastra)' },
                    { shape: 'cone', icon: '🔺', title: 'Cono / aliento (clic y arrastra)' },
                ].map(({ shape, icon, title }) => {
                    const active = freeRulerMode && rulerShape === shape;
                    return (
                        <button
                            key={shape}
                            onClick={() => {
                                if (active) {
                                    setFreeRulerMode(false);
                                    const empty = { active: false, origin: null, waypoints: [], current: null };
                                    freeRulerRef.current = empty;
                                    setFreeRuler(empty);
                                } else {
                                    const empty = { active: false, origin: null, waypoints: [], current: null };
                                    freeRulerRef.current = empty;
                                    setFreeRuler(empty);
                                    setRulerShape(shape);
                                    setFreeRulerMode(true);
                                }
                            }}
                            title={title}
                            style={{
                                padding: '4px 10px', borderRadius: 4, fontSize: 12,
                                fontWeight: active ? 700 : 400,
                                background: active ? '#f59e0b' : '#334155',
                                color: 'white', border: 'none', cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                        >
                            {icon}
                        </button>
                    );
                })}
            </div>

            {/* ── PANEL IZQUIERDO ── */}
            <div style={{
                position: 'absolute', top: HEADER_H + TOOLBAR_H, left: 0,
                width: sidebarW, bottom: 0, zIndex: 10,
                background: 'rgba(15, 23, 42, 0.85)',
                borderRight: '1px solid #2d3e50',
                display: 'flex', flexDirection: 'column',
                overflowX: 'hidden',
            }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid #2d3e50', flexShrink: 0 }}>
                    {['tokens', 'chat', 'ajustes'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSidebarTab(tab)}
                            style={{
                                flex: 1, padding: '6px 0', fontSize: 12, fontWeight: sidebarTab === tab ? 700 : 400,
                                background: sidebarTab === tab ? '#3b82f6' : '#334155',
                                color: 'white', border: 'none', cursor: 'pointer',
                                textTransform: 'capitalize', transition: 'background 0.15s',
                            }}
                        >
                            {tab === 'tokens' ? 'Tokens' : tab === 'chat' ? 'Chat' : 'Ajustes'}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, minHeight: 0, overflowX: 'hidden', overflowY: sidebarTab === 'tokens' ? 'auto' : 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* ChatTab always mounted so its WS stays alive — only hidden via CSS */}
                    <div style={{ display: sidebarTab === 'chat' ? 'flex' : 'none', flex: 1, minHeight: 0, flexDirection: 'column' }}>
                        <ChatTab gameId={gameId} isActive={sidebarTab === 'chat'} />
                    </div>
                    {sidebarTab === 'tokens' ? (
                        <TokenSpawner ref={spawnerRef} sceneItems={sceneItems} gameId={gameId}
                            onEntityUpdated={(kind, updatedEntity) => {
                                entityCacheRef.current[kind === 'character' ? 'characters' : 'monsters'] = null;
                                if (updatedEntity) {
                                    syncLinkedCounters(kind, updatedEntity);
                                    syncLinkedVision(kind, updatedEntity);
                                }
                            }}
                            onSendMessage={(content) => {
                                if (vttWsRef.current?.readyState === WebSocket.OPEN) {
                                    vttWsRef.current.send(JSON.stringify({ type: 'message', content }));
                                }
                            }}
                            onChildModalChange={setChildModalOpen}
                        />
                    ) : sidebarTab === 'ajustes' ? (
                        <div style={{ padding: '16px 12px' }}>
                            <button
                                onClick={() => navigate('/Games')}
                                style={{
                                    width: '100%', padding: '8px 0', fontSize: 13, fontWeight: 600,
                                    background: '#ef4444', color: 'white', border: 'none',
                                    borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                            >
                                Salir de la partida
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* Handle de resize — oculto cuando hay un modal de hoja abierto */}
                {!sheetModal && !childModalOpen && (
                    <div
                        onMouseDown={(e) => {
                            e.preventDefault();
                            const onMove = (ev) => setSidebarW(Math.min(420, Math.max(160, ev.clientX)));
                            const onUp = () => {
                                window.removeEventListener('mousemove', onMove);
                                window.removeEventListener('mouseup', onUp);
                            };
                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onUp);
                        }}
                        style={{
                            position: 'absolute', top: 0, right: 0, width: 6, bottom: 0,
                            cursor: 'col-resize', background: 'transparent', zIndex: 11,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#334155'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    />
                )}
            </div>

            {/* ── FOG CONTROLS (GM only, fog layer active) ── */}
            {isDm && activeLayer === 'fog' && (
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: HEADER_H + TOOLBAR_H + 10,
                        left: sidebarW + 10,
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        padding: '12px',
                        zIndex: 50,
                        minWidth: 220,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                    }}
                >
                    <label style={{ color: '#94a3b8', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        Opacidad GM: {Math.round(fogOpacity * 100)}%
                        <input type="range" min={0} max={100} value={Math.round(fogOpacity * 100)}
                            onChange={e => setFogOpacity(Number(e.target.value) / 100)}
                            style={{ width: '100%' }} />
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['rect', 'freehand'].map(tool => (
                            <button key={tool} onClick={() => setFogDrawTool(tool)} style={{
                                flex: 1, padding: '5px 0', fontSize: 12, border: 'none', borderRadius: 4, cursor: 'pointer',
                                background: fogDrawTool === tool ? '#3b82f6' : '#334155', color: 'white',
                            }}>
                                {tool === 'rect' ? 'Rect' : 'Trazo libre'}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setFogAction('reveal')} style={{
                            flex: 1, padding: '6px 0', fontSize: 12, border: 'none', borderRadius: 4,
                            background: fogAction === 'reveal' ? '#3b82f6' : '#334155',
                            color: 'white', fontWeight: fogAction === 'reveal' ? 700 : 400,
                            cursor: 'pointer',
                        }}>Revelar</button>
                        <button onClick={() => setFogAction('hide')} style={{
                            flex: 1, padding: '6px 0', fontSize: 12, border: 'none', borderRadius: 4,
                            background: fogAction === 'hide' ? '#7c3aed' : '#334155',
                            color: 'white', fontWeight: fogAction === 'hide' ? 700 : 400,
                            cursor: 'pointer',
                        }}>Ocultar</button>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={revealAll} style={{
                            flex: 1, padding: '6px 0', fontSize: 12, border: 'none', borderRadius: 4,
                            background: '#0f766e', color: 'white', cursor: 'pointer',
                        }}>Revelar todo</button>
                        <button onClick={hideAll} style={{
                            flex: 1, padding: '6px 0', fontSize: 12, border: 'none', borderRadius: 4,
                            background: '#991b1b', color: 'white', cursor: 'pointer',
                        }}>Ocultar todo</button>
                    </div>
                </div>
            )}

            {/* ── WALLS CONTROLS (GM only, walls layer active) ── */}
            {isDm && activeLayer === 'walls' && (() => {
                const walls = wallsData.walls || [];
                const selectedWall = walls.find(w => w.id === selectedWallId);

                return (
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            top: HEADER_H + TOOLBAR_H + 10,
                            left: sidebarW + 10,
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            padding: '12px',
                            zIndex: 50,
                            minWidth: 240,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Muros ({walls.length})
                        </span>

                        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {walls.length === 0 ? (
                                <span style={{ color: '#475569', fontSize: 11, fontStyle: 'italic' }}>No hay muros</span>
                            ) : walls.map((w, idx) => (
                                <div key={w.id}
                                    onClick={() => setSelectedWallId(w.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '4px 8px', borderRadius: 4,
                                        background: selectedWallId === w.id ? 'rgba(250,204,21,0.18)' : '#0f172a',
                                        border: selectedWallId === w.id ? '1px solid #facc15' : '1px solid #1e293b',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span style={{ color: selectedWallId === w.id ? '#facc15' : '#cbd5e1', fontSize: 12 }}>
                                        Wall #{idx + 1}
                                    </span>
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteWallById(w.id); }}
                                        style={{
                                            background: 'none', border: 'none', color: '#f87171',
                                            cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1,
                                        }}
                                    >🗑</button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                            {['line', 'rect'].map(mode => (
                                <button key={mode} onClick={() => setWallDrawMode(mode)} style={{
                                    flex: 1, padding: '5px 0', fontSize: 12, border: 'none', borderRadius: 4, cursor: 'pointer',
                                    background: wallDrawMode === mode ? '#3b82f6' : '#334155', color: 'white',
                                }}>
                                    {mode === 'line' ? 'Línea' : 'Rectángulo'}
                                </button>
                            ))}
                        </div>
                        <span style={{ color: '#64748b', fontSize: 11 }}>
                            Clic y arrastra en el tablero para dibujar un muro
                        </span>

                        {selectedWall && (
                            <WallEditor key={selectedWall.id} wall={selectedWall} onApply={(patch) => applyWallEdit(selectedWall.id, patch)} />
                        )}
                    </div>
                );
            })()}

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
                            {LAYERS.filter(l => !['walls','fog'].includes(l.id)).map(l => (
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
                                if (!tok || !tok.entity_id) return null;
                                const isChar = tok.kind === 'character';
                                const isMon  = tok.kind === 'monster';
                                if (!isChar && !isMon) return null;

                                return (
                                    <button
                                        onClick={async () => {
                                            const payload = {
                                                image_url: tok.image_url || null,
                                                auras:     tok.auras    || [],
                                                counters:  tok.counters || [],
                                                color:     tok.color    || (isMon ? 'red' : 'blue'),
                                                width:     tok.width    || squareSize,
                                                height:    tok.height   || squareSize,
                                            };
                                            const endpoint = isMon
                                                ? `${API}/api/monster/${tok.entity_id}/set-default-token-data`
                                                : `${API}/api/character/${tok.entity_id}/set-default-token-data`;
                                            try {
                                                await axios.post(endpoint, payload, { headers: authHeaders() });
                                                spawnerRef.current?.updateEntityDefault(
                                                    isMon ? 'monster' : 'character',
                                                    tok.entity_id,
                                                    payload
                                                );
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
                    if (str === '') { setBadgeEdit(null); return; }
                    let next;
                    if (str.startsWith('+')) {
                        const delta = parseInt(str.slice(1), 10);
                        if (!isNaN(delta)) next = Math.min(c.max, c.current + delta);
                    } else if (str.startsWith('-')) {
                        const delta = parseInt(str.slice(1), 10);
                        if (!isNaN(delta)) next = Math.min(c.max, c.current - delta);
                    } else {
                        const n = parseInt(str, 10);
                        if (!isNaN(n)) next = Math.min(c.max, n);
                    }
                    if (next !== undefined) {
                        const updated = counters.map((x, j) => j === badgeEdit.counterIdx ? { ...x, current: next } : x);
                        saveCounters(token.id, updated);
                        if (c.linked_field === 'hp' && token.entity_id) {
                            if (token.kind === 'character') {
                                const fd = new FormData();
                                fd.append('hp', String(next));
                                axios.post(`${API}/api/character/edit/${token.entity_id}`, fd, { headers: authHeaders() }).catch(console.error);
                            } else if (token.kind === 'monster') {
                                axios.post(`${API}/api/monster/edit/${token.entity_id}`, { hp: next }, { headers: authHeaders() }).catch(console.error);
                            }
                        }
                    }
                    setBadgeEdit(null);
                };
                const R = 13 * (badgeEdit.scale ?? 1);
                return (
                    <input
                        autoFocus
                        type="text"
                        value={badgeEdit.value}
                        placeholder={String(c.current)}
                        onChange={e => setBadgeEdit(prev => ({ ...prev, value: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') commit(badgeEdit.value); if (e.key === 'Escape') setBadgeEdit(null); }}
                        onBlur={() => commit(badgeEdit.value)}
                        style={{
                            position: 'fixed',
                            top: badgeEdit.screenY - R,
                            left: badgeEdit.screenX - R,
                            width: R * 2,
                            height: R * 2,
                            borderRadius: '50%',
                            background: c.color,
                            border: `${Math.max(1, Math.round(2 * (badgeEdit.scale ?? 1)))}px solid #0f172a`,
                            color: '#fff',
                            fontSize: Math.max(7, Math.min(Math.floor(R * 0.9), Math.floor(R * 2.0 / Math.max(1, String(c.current).length)))),
                            fontWeight: 700,
                            textAlign: 'center',
                            outline: 'none',
                            padding: 0,
                            zIndex: 9999,
                            boxSizing: 'border-box',
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
                    const updated = counters.map((x, j) => j === barIdx ? { ...x, label: fieldDef.label, linked_field: fieldDef.key, ...vals } : x);
                    saveCounters(token.id, updated);
                };

                return (
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'fixed', top: barEditor.screenY - 8, left: barEditor.screenX,
                            background: '#1e293b', border: '1px solid #334155',
                            borderRadius: 8, padding: '10px 12px',
                            zIndex: 200, minWidth: 270,
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
                                {/* Select de campo enlazado — solo para PJ/monstruo */}
                                {fieldDefs && (
                                    <select
                                        value={c.linked_field ?? ''}
                                        onChange={e => {
                                            if (e.target.value === '') {
                                                const updated = counters.map((x, j) => j === i ? { ...x, linked_field: null, label: '' } : x);
                                                saveCounters(token.id, updated);
                                            } else {
                                                const def = fieldDefs.find(f => f.key === e.target.value);
                                                if (def) applyField(def, i);
                                            }
                                        }}
                                        style={{ width: 60, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#f1f5f9', fontSize: 11, padding: '3px 5px', outline: 'none' }}
                                    >
                                        <option value="">—</option>
                                        {fieldDefs.map(f => (
                                            <option key={f.key} value={f.key}>{f.label}</option>
                                        ))}
                                    </select>
                                )}
                                {/* Nombre personalizado */}
                                <input
                                    type="text" value={c.label}
                                    onChange={e => {
                                        const updated = counters.map((x, j) => j === i ? { ...x, label: e.target.value } : x);
                                        saveCounters(token.id, updated);
                                    }}
                                    placeholder="Nombre…"
                                    style={{ width: 56, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#f1f5f9', fontSize: 11, padding: '3px 5px', outline: 'none' }}
                                />
                                {/* Current */}
                                <input
                                    type="number" value={c.current}
                                    onChange={e => {
                                        const newValue = Number(e.target.value);
                                        const updated = counters.map((x, j) => j === i ? { ...x, current: newValue } : x);
                                        saveCounters(token.id, updated);
                                        if (c.linked_field && token.entity_id) {
                                            if (token.kind === 'character') {
                                                const fd = new FormData();
                                                fd.append(c.linked_field, newValue);
                                                axios.post(`${API}/api/character/edit/${token.entity_id}`, fd, { headers: authHeaders() }).catch(() => {});
                                            } else if (token.kind === 'monster') {
                                                axios.post(`${API}/api/monster/edit/${token.entity_id}`, { [c.linked_field]: newValue }, { headers: authHeaders() }).catch(() => {});
                                            }
                                            entityCacheRef.current[token.kind === 'character' ? 'characters' : 'monsters'] = null;
                                            spawnerRef.current?.updateEntityField(token.kind, token.entity_id, { [c.linked_field]: newValue });
                                        }
                                    }}
                                    style={{ width: 44, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, color: '#f1f5f9', fontSize: 11, padding: '3px 5px', outline: 'none', textAlign: 'center' }}
                                />
                                <span style={{ color: '#475569', fontSize: 11 }}>/</span>
                                {/* Max */}
                                <input
                                    type="number" value={c.max}
                                    onChange={e => {
                                        const newMax = Number(e.target.value);
                                        const updated = counters.map((x, j) => j === i ? { ...x, max: newMax } : x);
                                        saveCounters(token.id, updated);
                                        if (c.linked_field && token.entity_id) {
                                            const def = fieldDefs?.find(f => f.key === c.linked_field);
                                            if (def?.maxKey) {
                                                if (token.kind === 'character') {
                                                    const fd = new FormData();
                                                    fd.append(def.maxKey, newMax);
                                                    axios.post(`${API}/api/character/edit/${token.entity_id}`, fd, { headers: authHeaders() }).catch(() => {});
                                                } else if (token.kind === 'monster') {
                                                    axios.post(`${API}/api/monster/edit/${token.entity_id}`, { [def.maxKey]: newMax }, { headers: authHeaders() }).catch(() => {});
                                                }
                                                entityCacheRef.current[token.kind === 'character' ? 'characters' : 'monsters'] = null;
                                                spawnerRef.current?.updateEntityField(token.kind, token.entity_id, { [def.maxKey]: newMax });
                                            }
                                        }
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
                left: sidebarW + 16, zIndex: 10,
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
                    onCharacterUpdated={(updated) => { entityCacheRef.current.characters = null; if (updated) { syncLinkedCounters('character', updated); syncLinkedVision('character', updated); } }}
                    onSendMessage={(content) => {
                        if (vttWsRef.current?.readyState === WebSocket.OPEN) {
                            vttWsRef.current.send(JSON.stringify({ type: 'message', content }));
                        }
                    }}
                />
            )}
            {sheetModal?.kind === 'monster' && (
                <EditMonsterModal
                    isOpen={true}
                    onClose={() => setSheetModal(null)}
                    monster={sheetModal.entity}
                    onMonsterUpdated={(updated) => { entityCacheRef.current.monsters = null; if (updated) { syncLinkedCounters('monster', updated); syncLinkedVision('monster', updated); } }}
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
