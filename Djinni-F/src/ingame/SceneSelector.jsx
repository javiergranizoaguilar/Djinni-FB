import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import CreateSceneButton from './CreateSceneButton.jsx';
import EditSceneComponent from './EditSceneComponent.jsx';
import { API_URL } from '../config/api';

const API = API_URL;

export default function SceneSelector({ onSceneSelect, onSceneUpdated }) {
    const { id } = useParams();
    const [scenes, setScenes] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);

    const fetchScenes = async () => {
        try {
            const token = localStorage.getItem('vtt_token');
            const res = await axios.get(`${API}/scene/api/game/${id}/scenes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setScenes(res.data);
        } catch {
            setError('No se pudieron cargar las escenas.');
        }
    };

    useEffect(() => {
        if (id) fetchScenes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleOpen = () => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPanelPos({ top: rect.bottom + 6, left: rect.left });
        }
        setIsOpen(prev => !prev);
    };

    const handleSceneClick = (scene) => {
        onSceneSelect(scene);
        setIsOpen(false);
    };

    const handleSceneCreated = (newScene) => {
        setScenes(prev => [...prev, newScene]);
    };

    const handleSceneUpdated = (updatedScene) => {
        setScenes(prev => prev.map(s => s.id === updatedScene.id ? updatedScene : s));
        onSceneUpdated?.(updatedScene);
    };

    const handleSceneDelete = async (e, sceneId) => {
        e.stopPropagation();
        if (!window.confirm('¿Borrar esta escena? Esta acción no se puede deshacer.')) return;
        try {
            const token = localStorage.getItem('vtt_token');
            await axios.delete(`${API}/scene/api/scenes/${sceneId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setScenes(prev => prev.filter(s => s.id !== sceneId));
        } catch {
            alert('No se pudo borrar la escena.');
        }
    };

    return (
        <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
                ref={btnRef}
                onClick={handleOpen}
                style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                }}
            >
                <span>Escenas</span>
                <span style={{ fontSize: 10 }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9998,
                            background: 'rgba(0,0,0,0.55)',
                        }}
                    />

                    {/* Panel — positioned below the button */}
                    <div style={{
                        position: 'fixed',
                        top: panelPos.top,
                        left: panelPos.left,
                        zIndex: 9999,
                        width: 480,
                        maxWidth: 'calc(100vw - 16px)',
                        maxHeight: '70vh',
                        overflowY: 'auto',
                        background: '#0d1f10',
                        border: '1px solid rgba(34,197,94,0.35)',
                        borderRadius: 10,
                        padding: 16,
                        boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ color: '#ecfdf5', fontWeight: 700, fontSize: 15 }}>
                                Escenas disponibles
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <CreateSceneButton gameId={id} onSceneCreated={handleSceneCreated} />
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#6b7d6b',
                                        fontSize: 20,
                                        cursor: 'pointer',
                                        lineHeight: 1,
                                        padding: '0 4px',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ecfdf5'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#6b7d6b'}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{error}</p>
                        )}

                        {scenes.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: 13 }}>No hay escenas. Crea una.</p>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                gap: 10,
                            }}>
                                {scenes.map(scene => (
                                    <div
                                        key={scene.id}
                                        onClick={() => handleSceneClick(scene)}
                                        style={{
                                            position: 'relative',
                                            cursor: 'pointer',
                                            background: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: 6,
                                            padding: 8,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 6,
                                            transition: 'border-color 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = '#22c55e'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                                    >
                                        <div style={{
                                            width: '100%', height: 80,
                                            background: '#1e293b',
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {scene.background_image_url ? (
                                                <img
                                                    src={`${API}${scene.background_image_url}`}
                                                    alt={scene.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <span style={{ color: '#475569', fontSize: 12 }}>Sin preview</span>
                                            )}
                                        </div>
                                        <span style={{ color: '#e2e8f0', fontSize: 13, textAlign: 'center', wordBreak: 'break-word' }}>
                                            {scene.name}
                                        </span>
                                        <button
                                            onClick={(e) => handleSceneDelete(e, scene.id)}
                                            title="Borrar escena"
                                            style={{
                                                position: 'absolute',
                                                top: 4,
                                                left: 4,
                                                background: 'rgba(0,0,0,0.55)',
                                                border: 'none',
                                                color: '#6b7d6b',
                                                fontSize: 14,
                                                lineHeight: 1,
                                                cursor: 'pointer',
                                                padding: '2px 5px',
                                                borderRadius: 4,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#6b7d6b'}
                                        >
                                            ×
                                        </button>
                                        <div onClick={e => e.stopPropagation()}>
                                            <EditSceneComponent scene={scene} onSceneUpdated={handleSceneUpdated} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
