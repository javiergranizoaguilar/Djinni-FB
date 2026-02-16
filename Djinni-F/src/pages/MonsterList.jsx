import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EditMonsterModal from './EditMonsterModal.jsx';

export default function MonsterList() {
    const [monsters, setMonsters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMonster, setSelectedMonster] = useState(null);
    const [newMonsterName, setNewMonsterName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchMonsters = async () => {
        const token = localStorage.getItem('vtt_token');
        if (!token) {
            setError('No estás autenticado.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('http://localhost:8000/api/monster/my-monsters', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMonsters(response.data);
        } catch (err) {
            console.error("Error fetching monsters:", err);
            setError('Error al cargar los monstruos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonsters();
    }, []);

    const handleCreateMonster = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.post('http://localhost:8000/api/monster/create', {
                name: newMonsterName
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setShowCreateModal(false);
            setNewMonsterName('');
            fetchMonsters(); // Recargar lista
        } catch (err) {
            console.error("Error creating monster:", err);
            alert("Error al crear el monstruo");
        }
    };

    const handleEditMonster = (monster) => {
        setSelectedMonster(monster);
        setShowEditModal(true);
    };

    const handleDeleteMonster = async (monsterId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este monstruo? Esta acción no se puede deshacer.')) {
            return;
        }

        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`http://localhost:8000/api/monster/delete/${monsterId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchMonsters(); // Recargar lista
        } catch (err) {
            console.error("Error deleting monster:", err);
            alert("Error al eliminar el monstruo");
        }
    };

    const filteredMonsters = monsters.filter(monster => 
        monster.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center p-4 text-gray-600 dark:text-gray-300 pt-24">Cargando monstruos...</div>;
    if (error) return <div className="text-center p-4 text-red-500 pt-24">{error}</div>;

    return (
        <div className="container mx-auto p-6 pt-24 min-h-screen relative">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Mis Monstruos</h2>
                
                <div className="flex w-full md:w-auto gap-4">
                    <div className="relative flex-grow md:flex-grow-0 md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar monstruo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#23482f] rounded-lg bg-white dark:bg-[#1a2c20] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary text-[#112217] px-4 py-2 rounded-lg font-bold shadow-glow hover:shadow-glow-hover transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        Crear Monstruo
                    </button>
                </div>
            </div>

            {filteredMonsters.length === 0 ? (
                <div className="text-center p-8 bg-gray-100 dark:bg-[#1a2c20] rounded-lg border border-dashed border-gray-300 dark:border-[#23482f]">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {searchTerm ? 'No se encontraron monstruos que coincidan con tu búsqueda.' : 'No tienes monstruos creados aún.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMonsters.map((monster) => (
                        <div key={monster.id} className="bg-white dark:bg-[#1a2c20] rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-[#23482f] hover:shadow-lg transition-shadow duration-300 flex flex-col">
                            <div className="h-48 bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden">
                                <span className="material-symbols-outlined text-6xl text-gray-400">pest_control</span>
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{monster.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tipo: {monster.type} ({monster.size})</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">AC: {monster.ac} | HP: {monster.hp}</p>
                                <div className="mt-auto flex justify-end gap-2">
                                    {monster.is_editable && (
                                        <>
                                            <button 
                                                onClick={() => handleDeleteMonster(monster.id)}
                                                className="px-3 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                                                title="Eliminar monstruo"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                            <button 
                                                onClick={() => handleEditMonster(monster)}
                                                className="px-4 py-2 bg-primary text-[#112217] text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1a2c20] p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-[#23482f]">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Nuevo Monstruo</h2>
                        <form onSubmit={handleCreateMonster}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                <input 
                                    type="text" 
                                    value={newMonsterName}
                                    onChange={(e) => setNewMonsterName(e.target.value)}
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

            <EditMonsterModal 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)} 
                monster={selectedMonster}
                onMonsterUpdated={fetchMonsters}
            />
        </div>
    );
}
