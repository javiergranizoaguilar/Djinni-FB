import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EditCharacterModal from './EditCharacterModal.jsx';

export default function CharacterList() {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [newCharacterName, setNewCharacterName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchCharacters = async () => {
        const token = localStorage.getItem('vtt_token');
        if (!token) {
            setError('No estás autenticado.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('http://localhost:8000/api/character/my-characters', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCharacters(response.data);
        } catch (err) {
            console.error("Error fetching characters:", err);
            setError('Error al cargar los personajes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCharacters();
    }, []);

    const handleCreateCharacter = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.post('http://localhost:8000/api/character/create', {
                name: newCharacterName
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setShowCreateModal(false);
            setNewCharacterName('');
            fetchCharacters(); // Recargar lista
        } catch (err) {
            console.error("Error creating character:", err);
            alert("Error al crear el personaje");
        }
    };

    const handleEditCharacter = (character) => {
        setSelectedCharacter(character);
        setShowEditModal(true);
    };

    const handleDeleteCharacter = async (characterId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este personaje? Esta acción no se puede deshacer.')) {
            return;
        }

        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`http://localhost:8000/api/character/delete/${characterId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchCharacters(); // Recargar lista
        } catch (err) {
            console.error("Error deleting character:", err);
            alert("Error al eliminar el personaje");
        }
    };

    const filteredCharacters = characters.filter(char => 
        char.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center p-4 text-gray-600 dark:text-gray-300 pt-24">Cargando personajes...</div>;
    if (error) return <div className="text-center p-4 text-red-500 pt-24">{error}</div>;

    return (
        <div className="container mx-auto p-6 pt-24 min-h-screen relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Mis Personajes</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary text-[#112217] px-4 py-2 rounded-lg font-bold shadow-glow hover:shadow-glow-hover transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    Crear Personaje
                </button>
            </div>
            
            <div className="mb-6 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                <input
                    type="text"
                    placeholder="Buscar personaje..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#23482f] rounded-lg bg-white dark:bg-[#1a2c20] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
            </div>

            {filteredCharacters.length === 0 ? (
                <div className="text-center p-8 bg-gray-100 dark:bg-[#1a2c20] rounded-lg border border-dashed border-gray-300 dark:border-[#23482f]">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {searchTerm ? 'No se encontraron personajes que coincidan con tu búsqueda.' : 'No tienes personajes creados aún.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCharacters.map((char) => (
                        <div key={char.id} className="bg-white dark:bg-[#1a2c20] rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-[#23482f] hover:shadow-lg transition-shadow duration-300 flex flex-col">
                            <div className="h-48 bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden">
                                {char.token_image ? (
                                    <img 
                                        src={char.token_image.startsWith('/uploads') ? `http://localhost:8000${char.token_image}` : char.token_image} 
                                        alt={char.name} 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-6xl text-gray-400">person</span>
                                )}
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{char.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Nivel {char.display_level}</p>
                                <div className="mt-auto flex justify-end gap-2">
                                    {char.is_editable && (
                                        <>
                                            <button 
                                                onClick={() => handleDeleteCharacter(char.id)}
                                                className="px-3 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                                                title="Eliminar personaje"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                            <button 
                                                onClick={() => handleEditCharacter(char)}
                                                className="px-4 py-2 bg-primary text-[#112217] text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
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
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1a2c20] p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-[#23482f]">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Nuevo Personaje</h2>
                        <form onSubmit={handleCreateCharacter}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                <input 
                                    type="text" 
                                    value={newCharacterName}
                                    onChange={(e) => setNewCharacterName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#23482f] rounded-md bg-white dark:bg-[#112217] text-gray-900 dark:text-gray-100"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#23482f] rounded-md"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-primary text-[#112217] rounded-md font-bold"
                                >
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <EditCharacterModal 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)} 
                character={selectedCharacter}
                onCharacterUpdated={fetchCharacters}
            />
        </div>
    );
}