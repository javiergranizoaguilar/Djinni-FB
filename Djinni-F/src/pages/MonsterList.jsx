import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditMonsterModal from './EditMonsterModal.jsx';
import { Toast, useToast } from '../components/Toast.jsx';

export default function MonsterList() {
    const [monsters, setMonsters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMonster, setSelectedMonster] = useState(null);
    const [newMonsterName, setNewMonsterName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { toast, show: showToast, hide: hideToast } = useToast();

    const fetchMonsters = async () => {
        const token = localStorage.getItem('vtt_token');
        if (!token) { setError('No estás autenticado.'); setLoading(false); return; }
        try {
            const response = await axios.get('http://localhost:8000/api/monster/my-monsters', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMonsters(response.data);
        } catch {
            setError('Error al cargar los monstruos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMonsters(); }, []);

    const handleCreateMonster = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.post('http://localhost:8000/api/monster/create', { name: newMonsterName }, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            setShowCreateModal(false);
            setNewMonsterName('');
            showToast('Monstruo creado', 'ok');
            fetchMonsters();
        } catch {
            showToast('Error al crear el monstruo', 'err');
        }
    };

    const handleEditMonster = (monster) => {
        setSelectedMonster(monster);
        setShowEditModal(true);
    };

    const handleDeleteMonster = async (monsterId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este monstruo? Esta acción no se puede deshacer.')) return;
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`http://localhost:8000/api/monster/delete/${monsterId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('Monstruo eliminado', 'ok');
            fetchMonsters();
        } catch {
            showToast('Error al eliminar el monstruo', 'err');
        }
    };

    const filteredMonsters = monsters.filter(monster =>
        monster.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (error) return (
        <div className="container mx-auto p-6 pt-24 min-h-screen">
            <div className="max-w-md mx-auto text-center p-8 bg-red-900/20 border border-red-500/40 rounded-xl">
                <span className="material-symbols-outlined text-5xl text-red-400 mb-2">error</span>
                <p className="text-red-300 font-semibold">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6 pt-24 min-h-screen relative page-section">
            <Toast toast={toast} onClose={hideToast} />

            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-8 gap-3 md:gap-4">
                <div>
                    <h2 className="font-heading text-3xl sm:text-4xl text-text-hi tracking-widest">Mis Monstruos</h2>
                    <p className="text-sm text-text-lo mt-1">Bestiario personal listo para invocar</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-grow md:flex-grow-0 md:w-72">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-lo text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Buscar monstruo…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="arcane-input pl-10"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="arcane-btn"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span className="hidden sm:inline">Crear Monstruo</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="arcane-card overflow-hidden">
                            <div className="skeleton h-48 w-full rounded-none"></div>
                            <div className="p-5 flex flex-col gap-3">
                                <div className="skeleton h-5 w-2/3"></div>
                                <div className="skeleton h-4 w-1/2"></div>
                                <div className="flex gap-2 mt-3 justify-end">
                                    <div className="skeleton h-9 w-12"></div>
                                    <div className="skeleton h-9 w-24"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredMonsters.length === 0 ? (
                <div className="max-w-lg mx-auto mt-16 text-center p-10 rounded-2xl border border-dashed border-primary/15 bg-surface/30 backdrop-blur animate-fade-in">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/8 border border-primary/15 mb-4">
                        <span className="material-symbols-outlined text-3xl text-primary">pest_control</span>
                    </div>
                    <h3 className="font-heading text-lg text-text-hi tracking-wide mb-2">
                        {searchTerm ? 'Sin resultados' : 'Aún no tienes monstruos'}
                    </h3>
                    <p className="text-sm text-text-lo mb-6">
                        {searchTerm ? 'Prueba con otra búsqueda o crea un nuevo monstruo.' : 'Crea tu primer monstruo para empezar tu bestiario.'}
                    </p>
                    {!searchTerm && (
                        <button onClick={() => setShowCreateModal(true)} className="arcane-btn">
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Crear primer monstruo
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMonsters.map((monster) => (
                        <div key={monster.id} className="arcane-card flex flex-col animate-fade-in">
                            <div className="h-48 bg-gradient-to-br from-primary/8 via-surface to-surface-base flex items-center justify-center relative overflow-hidden">
                                {(monster.portrait_url || monster.image_url) ? (
                                    <img
                                        src={`http://localhost:8000${monster.portrait_url || monster.image_url}`}
                                        alt={monster.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-6xl text-primary/40">pest_control</span>
                                )}
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="text-xl font-bold text-text-hi mb-2 line-clamp-1">{monster.name}</h3>
                                {(monster.type || monster.size) && (
                                    <p className="text-sm text-text-lo mb-1">
                                        {monster.type}{monster.size ? ` (${monster.size})` : ''}
                                    </p>
                                )}
                                <div className="flex gap-3 text-sm mb-4">
                                    <span className="inline-flex items-center gap-1 text-text-med">
                                        <span className="material-symbols-outlined text-[16px] text-blue-400">shield</span>
                                        <span className="font-mono">{monster.ac ?? '—'}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-text-med">
                                        <span className="material-symbols-outlined text-[16px] text-red-400">favorite</span>
                                        <span className="font-mono">{monster.hp ?? '—'}</span>
                                    </span>
                                </div>
                                <div className="mt-auto flex justify-end gap-2">
                                    {monster.is_editable && (
                                        <>
                                            <button
                                                onClick={() => handleDeleteMonster(monster.id)}
                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 hover:border-red-500 text-sm font-bold rounded-lg transition-all flex items-center"
                                                title="Eliminar monstruo"
                                                aria-label="Eliminar monstruo"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                            <button
                                                onClick={() => handleEditMonster(monster)}
                                                className="px-4 py-2 bg-primary text-[#042713] text-sm font-bold rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 shadow-glow hover:shadow-glow-hover transition-all flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                                Editar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Creación */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
                    <div className="arcane-modal p-6 w-full max-w-md max-h-[92vh] overflow-y-auto">
                        <h2 className="font-heading text-xl text-text-hi tracking-widest mb-5">Nuevo Monstruo</h2>
                        <form onSubmit={handleCreateMonster}>
                            <div className="mb-5">
                                <label className="block text-[11px] font-semibold tracking-widest uppercase text-text-lo mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={newMonsterName}
                                    onChange={(e) => setNewMonsterName(e.target.value)}
                                    className="arcane-input"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="arcane-btn-ghost">
                                    Cancelar
                                </button>
                                <button type="submit" className="arcane-btn">
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <EditMonsterModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                monster={selectedMonster}
                onMonsterUpdated={fetchMonsters}
            />
        </div>
    );
}
