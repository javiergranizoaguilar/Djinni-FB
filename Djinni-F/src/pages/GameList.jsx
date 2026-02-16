import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EditGameModal from './EditGameModal.jsx';
import CreateGameModal from './CreateGameModal.jsx';

export default function GameList() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchGames = async () => {
        const token = localStorage.getItem('vtt_token');
        if (!token) {
            setError('No estás autenticado.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('http://localhost:8000/api/game/sesion/my-games', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setGames(response.data);
        } catch (err) {
            console.error("Error fetching games:", err);
            setError('Error al cargar las partidas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();

        // Escuchar evento de juego creado
        const handleGameCreated = () => {
            fetchGames();
        };

        window.addEventListener('game-created', handleGameCreated);

        return () => {
            window.removeEventListener('game-created', handleGameCreated);
        };
    }, []);

    const handleEnterGame = (gameId) => {
        navigate(`/play/${gameId}`); 
    };

    const handleEditGame = (game) => {
        setSelectedGame(game);
        setShowEditModal(true);
    };

    const handleCopyInvite = (token, gameId) => {
        const inviteLink = `${window.location.origin}/join/${token}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            setCopiedId(gameId);
            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        });
    };

    const handleDeleteGame = async (gameId) => {
        if (!window.confirm('¿Estás seguro de que quieres borrar esta partida? Esta acción no se puede deshacer.')) {
            return;
        }

        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`http://localhost:8000/api/game/sesion/delete/${gameId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Recargar la lista de juegos
            fetchGames();
        } catch (err) {
            console.error("Error deleting game:", err);
            alert('Error al borrar la partida.');
        }
    };

    const filteredGames = games.filter(game => 
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center p-4 text-gray-600 dark:text-gray-300 pt-24 min-h-screen">Cargando partidas...</div>;
    if (error) return <div className="text-center p-4 text-red-500 pt-24">{error}</div>;

    return (
        <div className="container mx-auto p-6 pt-24 min-h-screen relative">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Mis Partidas</h2>
                
                <div className="flex w-full md:w-auto gap-4">
                    <div className="relative flex-grow md:flex-grow-0 md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar partida..."
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
                        Crear Partida
                    </button>
                </div>
            </div>

            {filteredGames.length === 0 ? (
                <div className="text-center p-8 bg-gray-100 dark:bg-[#1a2c20] rounded-lg border border-dashed border-gray-300 dark:border-[#23482f]">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {searchTerm ? 'No se encontraron partidas que coincidan con tu búsqueda.' : 'No tienes partidas creadas aún.'}
                    </p>
                    {!searchTerm && (
                        <p className="text-sm text-gray-500">¡Crea una nueva partida desde el botón superior!</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGames.map((game) => (
                        <div key={game.id} className="bg-white dark:bg-[#1a2c20] rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-[#23482f] hover:shadow-lg transition-shadow duration-300 flex flex-col">
                            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                                {game.img_path ? (
                                    <img 
                                        src={game.img_path.startsWith('/uploads') ? `http://localhost:8000${game.img_path}` : game.img_path} 
                                        alt={game.title} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-6xl text-primary/40">casino</span>
                                )}

                                {game.is_dm && (
                                    <div className="absolute top-2 right-2 flex items-center z-10">
                                        {copiedId === game.id && (
                                            <span className="mr-2 px-2 py-1 bg-black/80 text-white text-xs font-bold rounded shadow-lg animate-fade-in">
                                                ¡Copiado!
                                            </span>
                                        )}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation(); // Evitar que el clic se propague si hubiera un onClick en el padre
                                                handleCopyInvite(game.invitation_token, game.id);
                                            }}
                                            className="p-2.5 bg-white text-gray-800 rounded-full shadow-md hover:bg-gray-100 hover:scale-110 hover:shadow-lg transition-all duration-200 border border-gray-200 group"
                                            title="Copiar enlace de invitación"
                                        >
                                            <span className="material-symbols-outlined text-xl group-hover:text-primary transition-colors">
                                                {copiedId === game.id ? 'check' : 'share'}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{game.title}</h3>
                                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-base">calendar_today</span>
                                    <span>{new Date(game.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-auto flex items-center justify-between gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${game.is_dm ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                        {game.is_dm ? 'Dungeon Master' : 'Jugador'}
                                    </span>
                                    <div className="flex gap-2">
                                        {game.is_dm && (
                                            <>
                                                <button 
                                                    onClick={() => handleDeleteGame(game.id)}
                                                    className="px-3 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                                                    title="Borrar partida"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleEditGame(game)}
                                                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                                    title="Ajustes de partida"
                                                >
                                                    <span className="material-symbols-outlined text-lg align-middle">settings</span>
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => handleEnterGame(game.id)}
                                            className="px-4 py-2 bg-primary text-[#112217] text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            Entrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <EditGameModal 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)} 
                game={selectedGame}
                onGameUpdated={fetchGames}
            />

            <CreateGameModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    );
}
