import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import CreateSceneButton from './CreateSceneButton.jsx';
import EditSceneComponent from './EditSceneComponent.jsx';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function SceneSelector({ onSceneSelect, onSceneUpdated }) {
    const { id } = useParams();
    const [scenes, setScenes] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);
    const containerRef = useRef(null);

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

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    return (
        <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
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

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: 480,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    padding: 16,
                    zIndex: 50,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>
                            Escenas disponibles
                        </span>
                        <CreateSceneButton gameId={id} onSceneCreated={handleSceneCreated} />
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
                            maxHeight: 320,
                            overflowY: 'auto',
                        }}>
                            {scenes.map(scene => (
                                <div
                                    key={scene.id}
                                    onClick={() => handleSceneClick(scene)}
                                    style={{
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
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <span style={{ color: '#475569', fontSize: 12 }}>Sin preview</span>
                                    </div>
                                    <span style={{ color: '#e2e8f0', fontSize: 13, textAlign: 'center', wordBreak: 'break-word' }}>
                                        {scene.name}
                                    </span>
                                    <div onClick={e => e.stopPropagation()}>
                                        <EditSceneComponent scene={scene} onSceneUpdated={handleSceneUpdated} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
