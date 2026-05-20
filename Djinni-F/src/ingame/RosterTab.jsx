import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import EditCharacterModal from '../pages/EditCharacterModal.jsx';
import EditMonsterModal from '../pages/EditMonsterModal.jsx';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function authHeaders() {
    const token = localStorage.getItem('vtt_token');
    return { Authorization: `Bearer ${token}` };
}

const COLOR_MAP = {
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
    yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
    pink: '#ec4899', gray: '#6b7280',
};

function usePopoverClose(ref, onClose) {
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);
}

const popoverStyle = {
    position: 'absolute', zIndex: 9999, right: 0, top: '100%',
    background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
    padding: '10px', minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
};
const labelStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', borderRadius: 4 };
const saveBtn = {
    marginTop: 10, width: '100%', background: '#6366f1', border: 'none',
    borderRadius: 5, color: 'white', fontSize: 12, padding: '5px 0', cursor: 'pointer',
};
const headerStyle = { color: '#94a3b8', fontSize: 10, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' };

function VisibilityPopover({ item, members, onSave, onClose }) {
    const [selected, setSelected] = useState(new Set(item.visible_to || []));
    const ref = useRef(null);
    usePopoverClose(ref, onClose);

    const toggle = (uid) => setSelected(prev => {
        const next = new Set(prev);
        next.has(uid) ? next.delete(uid) : next.add(uid);
        return next;
    });

    return (
        <div ref={ref} style={popoverStyle}>
            <p style={headerStyle}>Visible para</p>
            {members.length === 0 && <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>Sin jugadores</p>}
            {members.map(m => {
                const isCreator = item.created_by_id === m.id;
                const checked   = isCreator || selected.has(m.id);
                return (
                    <label key={m.id} style={{ ...labelStyle, cursor: isCreator ? 'default' : 'pointer' }}>
                        <input type="checkbox" checked={checked} disabled={isCreator}
                            onChange={() => !isCreator && toggle(m.id)}
                            style={{ accentColor: '#6366f1', width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, color: isCreator ? '#64748b' : '#e2e8f0' }}>
                            {m.username}{isCreator ? ' (creador)' : ''}
                        </span>
                    </label>
                );
            })}
            <button onClick={() => onSave([...selected])} style={saveBtn}>Guardar</button>
        </div>
    );
}

function ControlPopover({ item, members, onSave, onClose }) {
    const [selected, setSelected] = useState(item.controlled_by_id ?? null);
    const ref = useRef(null);
    usePopoverClose(ref, onClose);

    return (
        <div ref={ref} style={popoverStyle}>
            <p style={headerStyle}>Control del token</p>
            {members.length === 0 && <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>Sin jugadores</p>}
            <label style={{ ...labelStyle, cursor: 'pointer' }}>
                <input type="radio" name="ctrl" checked={selected === null}
                    onChange={() => setSelected(null)}
                    style={{ accentColor: '#6366f1', width: 14, height: 14 }} />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Nadie</span>
            </label>
            {members.map(m => (
                <label key={m.id} style={{ ...labelStyle, cursor: 'pointer' }}>
                    <input type="radio" name="ctrl" checked={selected === m.id}
                        onChange={() => setSelected(m.id)}
                        style={{ accentColor: '#6366f1', width: 14, height: 14 }} />
                    <span style={{ fontSize: 12, color: '#e2e8f0' }}>{m.username}</span>
                </label>
            ))}
            <button onClick={() => onSave(selected)} style={saveBtn}>Guardar</button>
        </div>
    );
}

function ItemRow({ item, isDm, members, onDelete, onVisibilityChange, onControlChange, onOpenSheet }) {
    const [showVis,  setShowVis]  = useState(false);
    const [showCtrl, setShowCtrl] = useState(false);

    const dtd = item.default_token_data;
    const dragData = item.kind === 'character'
        ? {
            kind: 'character', id: item.entity_id, name: item.name,
            color:            dtd?.color     || 'blue',
            image_url:        dtd?.image_url ?? item.image_url ?? null,
            hp: item.hp ?? 0, max_hp: item.max_hp ?? item.hp ?? 0,
            default_auras:    dtd?.auras    || item.default_auras || [],
            default_counters: dtd?.counters || null,
            default_width:    dtd?.width    || null,
            default_height:   dtd?.height   || null,
          }
        : item.kind === 'monster'
        ? {
            kind: 'monster', id: item.entity_id, name: item.name,
            color:            dtd?.color     || 'red',
            image_url:        dtd?.image_url ?? item.image_url ?? null,
            hp: item.hp ?? 0, max_hp: item.max_hp ?? item.hp ?? 0,
            default_auras:    dtd?.auras    || item.default_auras || [],
            default_counters: dtd?.counters || null,
            default_width:    dtd?.width    || null,
            default_height:   dtd?.height   || null,
          }
        : { kind: 'custom', name: item.name, color: item.color || 'gray' };

    const color = item.kind === 'character' ? '#3b82f6'
        : item.kind === 'monster' ? '#ef4444'
        : (COLOR_MAP[item.color] || '#6b7280');

    const visibleCount = (item.visible_to || []).length;
    const visColor  = visibleCount === 0 ? '#475569' : visibleCount === members.length ? '#22c55e' : '#eab308';
    const ctrlColor = item.controlled_by_id ? '#a855f7' : '#475569';

    return (
        <div style={{ position: 'relative' }}>
            <div
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('tokenData', JSON.stringify(dragData));
                    e.dataTransfer.setData('roster-item', String(item.id));
                    e.stopPropagation();
                }}
                style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '4px 7px', borderRadius: 5,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #1e293b',
                    cursor: 'grab', userSelect: 'none',
                    transition: 'background 0.12s',
                }}
                onDoubleClick={() => onOpenSheet && onOpenSheet(item)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
                {item.image_url ? (
                    <img src={`${API}${item.image_url}`} alt={item.name}
                        style={{ width: 28, height: 36, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                    <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: color, boxShadow: `0 0 5px ${color}88`,
                    }} />
                )}
                <span style={{ fontSize: 12, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name || '(sin nombre)'}
                </span>
                {item.kind === 'character' && <span style={{ fontSize: 9, color: '#3b82f6', fontWeight: 700 }}>PJ</span>}
                {item.kind === 'monster'   && <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>M</span>}
                {isDm && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowVis(v => !v); setShowCtrl(false); }}
                            title="Gestionar visibilidad"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
                                padding: '0 2px', flexShrink: 0, color: visColor }}
                        >
                            {visibleCount === 0 ? '🔒' : '👁'}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowCtrl(v => !v); setShowVis(false); }}
                            title="Asignar control"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
                                padding: '0 2px', flexShrink: 0, color: ctrlColor }}
                        >
                            🎮
                        </button>
                        <button onClick={() => onDelete(item.id)}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
                                fontSize: 13, padding: '0 2px', flexShrink: 0 }}
                            title="Quitar del recuento">×</button>
                    </>
                )}
            </div>

            {showVis && isDm && (
                <VisibilityPopover
                    item={item} members={members}
                    onClose={() => setShowVis(false)}
                    onSave={(userIds) => { onVisibilityChange(item.id, userIds); setShowVis(false); }}
                />
            )}
            {showCtrl && isDm && (
                <ControlPopover
                    item={item} members={members}
                    onClose={() => setShowCtrl(false)}
                    onSave={(userId) => { onControlChange(item.id, userId); setShowCtrl(false); }}
                />
            )}
        </div>
    );
}

function FolderNode({ folder, isDm, gameId, members, onMoved, onFolderRenamed, onFolderDeleted, onItemDeleted, onVisibilityChange, onControlChange, onOpenSheet, depth = 0 }) {
    const [open, setOpen] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(folder.name);
    const [dragOver, setDragOver] = useState(false);
    const dragCounter = useRef(0);
    const inputRef = useRef(null);

    useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current += 1;
        if (dragCounter.current === 1) setDragOver(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e) => {
        e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) setDragOver(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setDragOver(false);

        const itemId = e.dataTransfer.getData('roster-item');
        const folderId = e.dataTransfer.getData('roster-folder');

        if (itemId) {
            await axios.patch(`${API}/api/game/${gameId}/roster/item/${itemId}`,
                { folder_id: folder.id }, { headers: authHeaders() });
            onMoved();
        } else if (folderId && String(folderId) !== String(folder.id)) {
            await axios.patch(`${API}/api/game/${gameId}/roster/folder/${folderId}`,
                { parent_id: folder.id }, { headers: authHeaders() });
            onMoved();
        }
    };

    const renameFolder = async () => {
        if (editName.trim() && editName !== folder.name) {
            await axios.patch(`${API}/api/game/${gameId}/roster/folder/${folder.id}`,
                { name: editName.trim() }, { headers: authHeaders() });
            onFolderRenamed();
        }
        setEditing(false);
    };

    return (
        <div
            style={{ paddingLeft: depth > 0 ? 10 : 0 }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Folder header */}
            <div
                draggable={isDm}
                onDragStart={(e) => {
                    e.dataTransfer.setData('roster-folder', String(folder.id));
                    e.stopPropagation();
                }}
                style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 6px', borderRadius: 5, cursor: 'pointer',
                    background: dragOver ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                    border: dragOver ? '1px solid #6366f1' : '1px solid transparent',
                    transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!dragOver) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { if (!dragOver) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
                <span onClick={() => setOpen(o => !o)} style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, width: 14 }}>
                    {open ? '▾' : '▸'}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>📁</span>
                {editing ? (
                    <input
                        ref={inputRef}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={renameFolder}
                        onKeyDown={e => { if (e.key === 'Enter') renameFolder(); if (e.key === 'Escape') setEditing(false); }}
                        style={{
                            flex: 1, background: '#0f172a', border: '1px solid #6366f1',
                            borderRadius: 3, color: '#f1f5f9', fontSize: 12, padding: '1px 4px', outline: 'none',
                        }}
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <span
                        onClick={() => setOpen(o => !o)}
                        onDoubleClick={() => isDm && setEditing(true)}
                        style={{ fontSize: 12, color: '#e2e8f0', flex: 1, fontWeight: 600 }}
                    >
                        {folder.name}
                    </span>
                )}
                {isDm && (
                    <button onClick={() => onFolderDeleted(folder.id)}
                        style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, padding: '0 2px', flexShrink: 0 }}
                        title="Eliminar carpeta">×</button>
                )}
            </div>

            {/* Folder contents */}
            {open && (
                <div style={{ marginLeft: 14, display: 'flex', flexDirection: 'column', gap: 3, marginTop: 3 }}>
                    {folder.children?.map(child => (
                        <FolderNode key={child.id} folder={child} isDm={isDm} gameId={gameId} members={members}
                            onMoved={onMoved} onFolderRenamed={onFolderRenamed}
                            onFolderDeleted={onFolderDeleted} onItemDeleted={onItemDeleted}
                            onVisibilityChange={onVisibilityChange} onControlChange={onControlChange}
                            onOpenSheet={onOpenSheet} depth={depth + 1} />
                    ))}
                    {folder.items?.map(item => (
                        <ItemRow key={item.id} item={item} isDm={isDm} members={members}
                            onDelete={onItemDeleted} onVisibilityChange={onVisibilityChange}
                            onControlChange={onControlChange} onOpenSheet={onOpenSheet} />
                    ))}
                    {folder.children?.length === 0 && folder.items?.length === 0 && (
                        <p style={{ color: '#334155', fontSize: 10, margin: '2px 0', paddingLeft: 4 }}>Vacía</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function RosterTab({ gameId, characters, onEntityUpdated, onSendMessage, onChildModalChange }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newFolderName, setNewFolderName] = useState('');
    const [showAddPJ, setShowAddPJ] = useState(false);
    const [rootDragOver, setRootDragOver] = useState(false);
    const [sheetModal, setSheetModal] = useState(null); // {kind, entity}

    useEffect(() => {
        onChildModalChange?.(!!sheetModal);
    }, [sheetModal, onChildModalChange]);

    const openSheet = async (item) => {
        if (!item.entity_id || !['character', 'monster'].includes(item.kind)) return;
        try {
            const endpoint = item.kind === 'character'
                ? `${API}/api/character/${item.entity_id}`
                : `${API}/api/monster/${item.entity_id}`;
            const r = await axios.get(endpoint, { headers: authHeaders() });
            setSheetModal({ kind: item.kind, entity: r.data });
        } catch { /* sin acceso, ignorar */ }
    };

    const load = async () => {
        try {
            const r = await axios.get(`${API}/api/game/${gameId}/roster`, { headers: authHeaders() });
            setData(r.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (gameId) load(); }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

    const isDm = data?.is_dm ?? false;

    const createFolder = async () => {
        const name = newFolderName.trim();
        if (!name) return;
        await axios.post(`${API}/api/game/${gameId}/roster/folder`, { name }, { headers: authHeaders() });
        setNewFolderName('');
        load();
    };

    const setVisibility = async (itemId, userIds) => {
        await axios.put(`${API}/api/game/${gameId}/roster/item/${itemId}/visibility`,
            { user_ids: userIds }, { headers: authHeaders() });
        load();
    };

    const setControl = async (itemId, userId) => {
        await axios.put(`${API}/api/game/${gameId}/roster/item/${itemId}/control`,
            { user_id: userId }, { headers: authHeaders() });
        load();
    };

    const deleteFolder = async (folderId) => {
        await axios.delete(`${API}/api/game/${gameId}/roster/folder/${folderId}`, { headers: authHeaders() });
        load();
    };

    const deleteItem = async (itemId) => {
        await axios.delete(`${API}/api/game/${gameId}/roster/item/${itemId}`, { headers: authHeaders() });
        load();
    };

    const addMyCharacter = async (char) => {
        await axios.post(`${API}/api/game/${gameId}/roster/item`,
            { kind: 'character', entity_id: char.id }, { headers: authHeaders() });
        setShowAddPJ(false);
        load();
    };

    const handleFolderRenamed = () => { load(); };

    // Root drop zone: move item/folder to root (no folder)
    const handleRootDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setRootDragOver(false);
        const itemId = e.dataTransfer.getData('roster-item');
        const folderId = e.dataTransfer.getData('roster-folder');
        if (itemId) {
            await axios.patch(`${API}/api/game/${gameId}/roster/item/${itemId}`,
                { folder_id: null }, { headers: authHeaders() });
            load();
        } else if (folderId) {
            await axios.patch(`${API}/api/game/${gameId}/roster/folder/${folderId}`,
                { parent_id: null }, { headers: authHeaders() });
            load();
        }
    };

    if (loading) return <p style={{ color: '#475569', fontSize: 12 }}>Cargando…</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'hidden' }}>

            {/* DM: crear carpeta */}
            {isDm && (
                <div style={{ display: 'flex', gap: 5 }}>
                    <input
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && createFolder()}
                        placeholder="Nueva carpeta…"
                        style={{
                            flex: 1, minWidth: 0, background: '#0f172a', border: '1px solid #334155',
                            borderRadius: 5, padding: '4px 7px',
                            color: '#f1f5f9', fontSize: 11, outline: 'none',
                        }}
                    />
                    <button onClick={createFolder}
                        style={{
                            background: '#334155', border: 'none', borderRadius: 5,
                            color: '#94a3b8', fontSize: 13, padding: '0 8px', cursor: 'pointer',
                            flexShrink: 0,
                        }}
                        title="Crear carpeta">📁+</button>
                </div>
            )}

            {/* Jugador: añadir su PJ */}
            {!isDm && (
                <div>
                    <button
                        onClick={() => setShowAddPJ(s => !s)}
                        style={{
                            width: '100%', background: '#1e293b', border: '1px solid #334155',
                            borderRadius: 5, color: '#94a3b8', fontSize: 11, padding: '5px 0',
                            cursor: 'pointer',
                        }}
                    >
                        {showAddPJ ? '▴ Cancelar' : '+ Añadir mi PJ'}
                    </button>
                    {showAddPJ && (
                        <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {(characters || []).length === 0
                                ? <p style={{ color: '#475569', fontSize: 11 }}>Sin personajes creados</p>
                                : (characters || []).map(c => (
                                    <button key={c.id} onClick={() => addMyCharacter(c)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            background: 'rgba(255,255,255,0.04)', border: '1px solid #334155',
                                            borderRadius: 5, padding: '4px 8px', cursor: 'pointer', color: '#e2e8f0',
                                            fontSize: 11, textAlign: 'left',
                                        }}>
                                        {c.token_image || c.portrait_image
                                            ? <img src={`${API}${c.token_image || c.portrait_image}`} alt={c.name}
                                                style={{ width: 24, height: 24, borderRadius: 3, objectFit: 'cover' }} />
                                            : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6' }} />
                                        }
                                        {c.name}
                                    </button>
                                ))
                            }
                        </div>
                    )}
                </div>
            )}

            {/* Árbol */}
            <div
                style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setRootDragOver(true); }}
                onDragLeave={() => setRootDragOver(false)}
                onDrop={handleRootDrop}
            >
                {/* Carpetas raíz */}
                {data?.folders?.map(folder => (
                    <FolderNode key={folder.id} folder={folder} isDm={isDm} gameId={gameId}
                        members={data?.session_members || []}
                        onMoved={load}
                        onFolderRenamed={handleFolderRenamed}
                        onFolderDeleted={deleteFolder}
                        onItemDeleted={deleteItem}
                        onVisibilityChange={setVisibility}
                        onControlChange={setControl}
                        onOpenSheet={openSheet}
                    />
                ))}

                {/* Items sin carpeta */}
                {data?.items?.map(item => (
                    <ItemRow key={item.id} item={item} isDm={isDm}
                        members={data?.session_members || []}
                        onDelete={deleteItem} onVisibilityChange={setVisibility}
                        onControlChange={setControl} onOpenSheet={openSheet} />
                ))}

                {data?.folders?.length === 0 && data?.items?.length === 0 && (
                    <p style={{ color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 20 }}>
                        Sin entradas aún.<br />
                        Los tokens usados aparecerán aquí.
                    </p>
                )}

                {/* Drop hint visual */}
                {rootDragOver && isDm && (
                    <div style={{
                        border: '2px dashed #6366f1', borderRadius: 6, padding: '8px',
                        color: '#6366f1', fontSize: 11, textAlign: 'center', marginTop: 4,
                    }}>
                        Soltar aquí para mover a raíz
                    </div>
                )}
            </div>

            {sheetModal?.kind === 'character' && (
                <EditCharacterModal
                    isOpen={true}
                    onClose={() => setSheetModal(null)}
                    character={sheetModal.entity}
                    onCharacterUpdated={(updated) => { if (updated) onEntityUpdated?.('character', updated); setSheetModal(null); }}
                    onSendMessage={onSendMessage}
                />
            )}
            {sheetModal?.kind === 'monster' && (
                <EditMonsterModal
                    isOpen={true}
                    onClose={() => setSheetModal(null)}
                    monster={sheetModal.entity}
                    onMonsterUpdated={(updated) => { if (updated) onEntityUpdated?.('monster', updated); setSheetModal(null); }}
                />
            )}
        </div>
    );
}
