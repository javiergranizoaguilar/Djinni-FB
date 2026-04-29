import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditCharacterModal from '../pages/EditCharacterModal.jsx';
import EditMonsterModal from '../pages/EditMonsterModal.jsx';
import RosterTab from './RosterTab.jsx';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const COLORS = [
    { id: 'red',    hex: '#ef4444' },
    { id: 'blue',   hex: '#3b82f6' },
    { id: 'green',  hex: '#22c55e' },
    { id: 'yellow', hex: '#eab308' },
    { id: 'purple', hex: '#a855f7' },
    { id: 'orange', hex: '#f97316' },
    { id: 'pink',   hex: '#ec4899' },
    { id: 'gray',   hex: '#6b7280' },
];

function authHeaders() {
    const token = localStorage.getItem('vtt_token');
    return { Authorization: `Bearer ${token}` };
}

function EntityRow({ name, image, color, dragData, onDoubleClick }) {
    return (
        <div
            draggable
            onDragStart={(e) => e.dataTransfer.setData('tokenData', JSON.stringify(dragData))}
            onDoubleClick={onDoubleClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid #1e293b',
                cursor: 'grab', userSelect: 'none',
                transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        >
            {image ? (
                <img
                    src={`${API}${image}`}
                    alt={name}
                    style={{ width: 36, height: 48, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                />
            ) : (
                <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: color, boxShadow: `0 0 6px ${color}88`,
                }} />
            )}
            <span style={{ color: '#cbd5e1', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
            </span>
        </div>
    );
}

const STORAGE_KEY = 'vtt_personal_tokens';

function loadPersonal() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}

export default function TokenSpawner({ sceneItems = [], gameId, onEntityUpdated }) {
    const [characters,       setCharacters]       = useState([]);
    const [monsters,         setMonsters]         = useState([]);
    const [loading,          setLoading]          = useState(true);
    const [tab,              setTab]              = useState('characters');
    const [editCharacter,    setEditCharacter]    = useState(null);
    const [editMonster,      setEditMonster]      = useState(null);

    // Quick-create
    const [createMenu,   setCreateMenu]   = useState(null); // null | 'choice' | 'character' | 'monster'
    const [createName,   setCreateName]   = useState('');
    const [creating,     setCreating]     = useState(false);

    // Personal
    const [personal,  setPersonal] = useState(loadPersonal);
    const [newName,   setNewName]  = useState('');
    const [newColor,  setNewColor] = useState('red');

    useEffect(() => {
        const load = async () => {
            try {
                const [charRes, monRes] = await Promise.all([
                    axios.get(`${API}/api/character/my-characters`, { headers: authHeaders() }),
                    axios.get(`${API}/api/monster/my-monsters`,     { headers: authHeaders() }),
                ]);
                setCharacters(charRes.data);
                setMonsters(monRes.data);
            } catch (err) {
                console.error('Error loading tokens:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);


    const doCreate = async () => {
        const name = createName.trim();
        if (!name || creating || !createMenu || createMenu === 'choice') return;
        setCreating(true);
        try {
            if (createMenu === 'character') {
                const res = await axios.post(`${API}/api/character/create`, { name }, { headers: authHeaders() });
                const newChar = { id: res.data.id, name, hp: 0, max_hp: 0, default_auras: [], token_image: null, portrait_image: null };
                setCharacters(prev => [...prev, newChar]);
                setEditCharacter(newChar);
            } else {
                const res = await axios.post(`${API}/api/monster/create`, { name }, { headers: authHeaders() });
                const newMon = { id: res.data.id, name, hp: 10, max_hp: 10, default_auras: [], image_url: null, portrait_url: null };
                setMonsters(prev => [...prev, newMon]);
                setEditMonster(newMon);
            }
            setCreateName('');
            setCreateMenu(null);
        } catch (err) {
            console.error('Error creating entity:', err);
        } finally {
            setCreating(false);
        }
    };

    const savePersonal = (list) => {
        setPersonal(list);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    };

    const addPersonal = () => {
        const name = newName.trim();
        if (!name) return;
        const entry = { id: Date.now(), name, color: newColor };
        savePersonal([...personal, entry]);
        setNewName('');
    };

    const removePersonal = (id) => savePersonal(personal.filter(p => p.id !== id));

    const tabStyle = (active) => ({
        flex: 1, padding: '5px 0', fontSize: 10, fontWeight: 600,
        background: active ? '#3b82f6' : 'transparent',
        color: active ? 'white' : '#64748b',
        border: 'none', borderRadius: 4, cursor: 'pointer',
        transition: 'all 0.15s',
    });

    const colorHex = (id) => COLORS.find(c => c.id === id)?.hex || '#6b7280';

    return (
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                    Tokens
                </p>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setCreateMenu(m => m ? null : 'choice')}
                        style={{
                            background: '#22c55e', border: 'none', borderRadius: 5,
                            color: 'white', fontSize: 11, fontWeight: 700,
                            padding: '4px 10px', cursor: 'pointer',
                        }}
                    >
                        + Crear
                    </button>
                    {createMenu === 'choice' && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 4,
                            background: '#1e293b', border: '1px solid #334155',
                            borderRadius: 6, overflow: 'hidden', zIndex: 50, minWidth: 130,
                            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                        }}>
                            <button onClick={() => { setCreateMenu('character'); setCreateName(''); }}
                                style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: 12, textAlign: 'left', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >🧙 Personaje</button>
                            <button onClick={() => { setCreateMenu('monster'); setCreateName(''); }}
                                style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: 12, textAlign: 'left', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >🐉 Monstruo</button>
                        </div>
                    )}
                    {(createMenu === 'character' || createMenu === 'monster') && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 4,
                            background: '#1e293b', border: '1px solid #334155',
                            borderRadius: 6, padding: 8, zIndex: 50, minWidth: 160,
                            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', gap: 6,
                        }}>
                            <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {createMenu === 'character' ? '🧙 Nuevo personaje' : '🐉 Nuevo monstruo'}
                            </span>
                            <input
                                autoFocus
                                value={createName}
                                onChange={e => setCreateName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') doCreate(); if (e.key === 'Escape') setCreateMenu(null); }}
                                placeholder="Nombre…"
                                style={{
                                    background: '#0f172a', border: '1px solid #334155',
                                    borderRadius: 4, padding: '5px 8px',
                                    color: '#f1f5f9', fontSize: 12, outline: 'none',
                                }}
                            />
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => setCreateMenu(null)}
                                    style={{ flex: 1, background: '#334155', border: 'none', borderRadius: 4, color: '#94a3b8', fontSize: 11, padding: '5px 0', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button onClick={doCreate} disabled={creating}
                                    style={{ flex: 1, background: createMenu === 'character' ? '#3b82f6' : '#ef4444', border: 'none', borderRadius: 4, color: 'white', fontSize: 11, padding: '5px 0', cursor: 'pointer' }}>
                                    {creating ? '…' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs fila 1 */}
            <div style={{ display: 'flex', gap: 4, background: '#0f172a', borderRadius: 6, padding: 3 }}>
                <button style={tabStyle(tab === 'characters')} onClick={() => setTab('characters')}>PJs</button>
                <button style={tabStyle(tab === 'monsters')}   onClick={() => setTab('monsters')}>Monstruos</button>
            </div>
            {/* Tabs fila 2 */}
            <div style={{ display: 'flex', gap: 4, background: '#0f172a', borderRadius: 6, padding: 3 }}>
                <button style={tabStyle(tab === 'personal')} onClick={() => setTab('personal')}>Personal</button>
                <button style={tabStyle(tab === 'roster')}   onClick={() => setTab('roster')}>Recuento</button>
            </div>

            <p style={{ color: '#475569', fontSize: 10, margin: 0 }}>
                {tab === 'roster' ? 'Elenco de la sesión' : 'Arrastra al tablero'}
            </p>

            {/* ── PERSONAJES ── */}
            {tab === 'characters' && (
                loading
                    ? <p style={{ color: '#475569', fontSize: 12 }}>Cargando…</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', flex: 1 }}>
                        {characters.length === 0
                            ? <p style={{ color: '#475569', fontSize: 12 }}>Sin personajes</p>
                            : characters.map(c => (
                                <EntityRow key={c.id} name={c.name} image={c.portrait_image || c.token_image} color="#3b82f6"
                                    dragData={{ kind: 'character', id: c.id, name: c.name, color: 'blue', image_url: c.token_image || null, hp: c.hp ?? 0, max_hp: c.max_hp ?? c.hp ?? 0, default_auras: c.default_auras || [] }}
                                    onDoubleClick={() => setEditCharacter(c)} />
                            ))}
                    </div>
            )}

            {/* ── MONSTRUOS ── */}
            {tab === 'monsters' && (
                loading
                    ? <p style={{ color: '#475569', fontSize: 12 }}>Cargando…</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', flex: 1 }}>
                        {monsters.length === 0
                            ? <p style={{ color: '#475569', fontSize: 12 }}>Sin monstruos</p>
                            : monsters.map(m => (
                                <EntityRow key={m.id} name={m.name} image={m.portrait_url || m.image_url} color="#ef4444"
                                    dragData={{ kind: 'monster', id: m.id, name: m.name, color: 'red', image_url: m.image_url || null, hp: m.hp ?? 0, max_hp: m.max_hp ?? m.hp ?? 0, default_auras: m.default_auras || [] }}
                                    onDoubleClick={() => setEditMonster(m)} />
                            ))}
                    </div>
            )}

            {/* ── PERSONAL ── */}
            {tab === 'personal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflow: 'hidden' }}>
                    {/* Formulario */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, background: '#0f172a', borderRadius: 8 }}>
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addPersonal()}
                            placeholder="Nombre del token…"
                            style={{
                                background: '#1e293b', border: '1px solid #334155',
                                borderRadius: 5, padding: '5px 8px',
                                color: '#f1f5f9', fontSize: 12, outline: 'none',
                            }}
                        />
                        {/* Selector de color */}
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {COLORS.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setNewColor(c.id)}
                                    style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: c.hex, cursor: 'pointer',
                                        outline: newColor === c.id ? `2px solid white` : 'none',
                                        outlineOffset: 2,
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={addPersonal}
                            style={{
                                background: '#3b82f6', border: 'none', borderRadius: 5,
                                color: 'white', fontSize: 12, padding: '5px 0', cursor: 'pointer',
                            }}
                        >
                            + Añadir
                        </button>
                    </div>

                    {/* Lista personal */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', flex: 1 }}>
                        {personal.length === 0
                            ? <p style={{ color: '#475569', fontSize: 12 }}>Sin tokens personales</p>
                            : personal.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ flex: 1 }}>
                                        <EntityRow name={p.name} image={null} color={colorHex(p.color)}
                                            dragData={{ kind: 'custom', name: p.name, color: p.color }} />
                                    </div>
                                    <button
                                        onClick={() => removePersonal(p.id)}
                                        style={{
                                            background: 'transparent', border: 'none',
                                            color: '#475569', cursor: 'pointer', fontSize: 14, padding: '0 4px',
                                            flexShrink: 0,
                                        }}
                                        title="Eliminar"
                                    >×</button>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* ── RECUENTO ── */}
            {tab === 'roster' && (
                <RosterTab gameId={gameId} characters={characters} />
            )}

            {/* ── MODALES DE EDICIÓN ── */}
            <EditCharacterModal
                isOpen={!!editCharacter}
                onClose={() => setEditCharacter(null)}
                character={editCharacter}
                onCharacterUpdated={(updated) => {
                    setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
                    setEditCharacter(null);
                    onEntityUpdated?.('character');
                }}
            />
            <EditMonsterModal
                isOpen={!!editMonster}
                onClose={() => setEditMonster(null)}
                monster={editMonster}
                onMonsterUpdated={(updated) => {
                    setMonsters(prev => prev.map(m => m.id === updated.id ? updated : m));
                    setEditMonster(null);
                    onEntityUpdated?.('monster');
                }}
            />
        </div>
    );
}
