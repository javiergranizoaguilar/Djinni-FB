import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditCharacterModal from './EditCharacterModal.jsx';
import { Toast, useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import { API_URL } from '../config/api';

export default function CharacterList() {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [newCharacterName, setNewCharacterName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { toast, show: showToast, hide: hideToast } = useToast();

    const fetchCharacters = async () => {
        const token = localStorage.getItem('vtt_token');
        if (!token) { setError('No estás autenticado.'); setLoading(false); return; }
        try {
            const response = await axios.get(`${API_URL}/api/character/my-characters`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCharacters(response.data);
        } catch {
            setError('Error al cargar los personajes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCharacters(); }, []);

    const handleCreateCharacter = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.post(`${API_URL}/api/character/create`, { name: newCharacterName }, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            setShowCreateModal(false);
            setNewCharacterName('');
            showToast('Personaje creado', 'ok');
            fetchCharacters();
        } catch {
            showToast('Error al crear el personaje', 'err');
        }
    };

    const handleEditCharacter = (character) => {
        setSelectedCharacter(character);
        setShowEditModal(true);
    };

    const handleDeleteCharacter = async (characterId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este personaje? Esta acción no se puede deshacer.')) return;
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`${API_URL}/api/character/delete/${characterId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('Personaje eliminado', 'ok');
            fetchCharacters();
        } catch {
            showToast('Error al eliminar el personaje', 'err');
        }
    };

    const filteredCharacters = characters.filter(char =>
        char.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (error) return (
        <div className="container mx-auto px-6 pb-6 pt-24 min-h-screen">
            <div className="max-w-md mx-auto text-center p-8 bg-red-900/20 border border-red-500/40 rounded-xl">
                <span className="material-symbols-outlined text-5xl text-red-400 mb-2">error</span>
                <p className="text-red-300 font-semibold">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 pb-6 pt-24 min-h-screen relative page-section">
            <Toast toast={toast} onClose={hideToast} />

            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-8 gap-3 md:gap-4">
                <div>
                    <h2 className="font-heading text-3xl sm:text-4xl text-text-hi tracking-widest">Mis Personajes</h2>
                    <p className="text-sm text-text-lo mt-1">Tus héroes y sus hojas de personaje</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-grow md:flex-grow-0 md:w-72">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-lo text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Buscar personaje…"
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
                        <span className="hidden sm:inline">Crear Personaje</span>
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
                                <div className="flex gap-2"><div className="skeleton h-4 w-16"></div><div className="skeleton h-4 w-12"></div></div>
                                <div className="flex gap-2 mt-3 justify-end">
                                    <div className="skeleton h-9 w-12"></div>
                                    <div className="skeleton h-9 w-28"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCharacters.length === 0 ? (
                <div className="max-w-lg mx-auto mt-16 text-center p-10 rounded-2xl border border-dashed border-primary/15 bg-surface/30 backdrop-blur animate-fade-in">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/8 border border-primary/15 mb-4">
                        <span className="material-symbols-outlined text-3xl text-primary">person</span>
                    </div>
                    <h3 className="font-heading text-lg text-text-hi tracking-wide mb-2">
                        {searchTerm ? 'Sin resultados' : 'Aún no tienes personajes'}
                    </h3>
                    <p className="text-sm text-text-lo mb-6">
                        {searchTerm ? 'Prueba con otra búsqueda o crea un personaje nuevo.' : 'Crea tu primer personaje y empieza a forjar su leyenda.'}
                    </p>
                    {!searchTerm && (
                        <button onClick={() => setShowCreateModal(true)} className="arcane-btn">
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Crear primer personaje
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCharacters.map((char) => (
                        <div key={char.id} className="arcane-card flex flex-col animate-fade-in">
                            <div className="h-48 bg-gradient-to-br from-primary/8 via-surface to-surface-base flex items-center justify-center relative overflow-hidden">
                                {char.token_image ? (
                                    <img
                                        src={char.token_image.startsWith('/uploads') ? `${API_URL}${char.token_image}` : char.token_image}
                                        alt={char.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-6xl text-primary/40">person</span>
                                )}
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-text-hi line-clamp-1">{char.name}</h3>
                                    <span className="bg-djinni-gold/15 text-djinni-gold border border-djinni-gold/35 text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
                                        Lvl {char.display_level}
                                    </span>
                                </div>

                                <div className="text-sm font-medium mb-3 flex flex-wrap gap-1">
                                    {Array.isArray(char.level) && char.level.length > 0 ? (
                                        char.level.map((cls, idx) => (
                                            <span key={idx} className="bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded text-xs">
                                                {cls.class || 'Sin Clase'} {cls.level}
                                                {cls.subclass ? ` (${cls.subclass})` : ''}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-300 dark:text-text-lo italic">Sin Clase</span>
                                    )}
                                </div>

                                <div className="flex gap-4 mb-4 text-xs text-gray-500 dark:text-text-med">
                                    <div className="flex items-center gap-1" title="Hechizos">
                                        <span className="material-symbols-outlined text-[16px]">auto_fix</span>
                                        <span>{char.spells?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Inventario">
                                        <span className="material-symbols-outlined text-[16px]">backpack</span>
                                        <span>{char.inventory?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Ataques">
                                        <span className="material-symbols-outlined text-[16px]">swords</span>
                                        <span>{char.attacks?.length || 0}</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-end gap-2">
                                    {char.is_editable && (
                                        <>
                                            <button
                                                onClick={() => handleDeleteCharacter(char.id)}
                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 hover:border-red-500 text-sm font-bold rounded-lg transition-all flex items-center"
                                                title="Eliminar personaje"
                                                aria-label="Eliminar personaje"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                            <button
                                                onClick={() => handleEditCharacter(char)}
                                                className="px-4 py-2 bg-primary text-[#042713] text-sm font-bold rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 shadow-glow hover:shadow-glow-hover transition-all flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                                Ver Hoja
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
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                ariaLabelledBy="create-char-title"
                containerClassName="z-[60] animate-fade-in"
            >
                <div className="arcane-modal p-6 w-full max-w-md max-h-[92vh] overflow-y-auto">
                    <h2 id="create-char-title" className="font-heading text-xl text-text-hi tracking-widest mb-5">Nuevo Personaje</h2>
                    <form onSubmit={handleCreateCharacter}>
                        <div className="mb-5">
                            <label htmlFor="new-char-name" className="block text-[11px] font-semibold tracking-widest uppercase text-text-lo mb-2">Nombre</label>
                            <input
                                id="new-char-name"
                                type="text"
                                value={newCharacterName}
                                onChange={(e) => setNewCharacterName(e.target.value)}
                                className="arcane-input focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
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
            </Modal>


            <EditCharacterModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                character={selectedCharacter}
                onCharacterUpdated={fetchCharacters}
            />
        </div>
    );
}
