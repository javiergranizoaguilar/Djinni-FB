import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function GameList() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
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

    if (loading) return <div className="text-center p-4 text-gray-600 dark:text-gray-300 pt-24">Cargando partidas...</div>;
    if (error) return <div className="text-center p-4 text-red-500 pt-24">{error}</div>;

    return (
        <div className="container mx-auto p-6 pt-24 min-h-screen relative">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Mis Partidas</h2>
            
            {games.length === 0 ? (
                <div className="text-center p-8 bg-gray-100 dark:bg-[#1a2c20] rounded-lg border border-dashed border-gray-300 dark:border-[#23482f]">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No tienes partidas creadas aún.</p>
                    <p className="text-sm text-gray-500">¡Crea una nueva partida desde el botón en la cabecera!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <div key={game.id} className="bg-white dark:bg-[#1a2c20] rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-[#23482f] hover:shadow-lg transition-shadow duration-300 flex flex-col">
                            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center relative">
                                <span className="material-symbols-outlined text-6xl text-primary/40">casino</span>
                                {game.is_dm && (
                                    <>
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
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteGame(game.id);
                                            }}
                                            className="absolute top-2 left-2 p-2.5 bg-white text-red-600 rounded-full shadow-md hover:bg-red-50 hover:scale-110 hover:shadow-lg transition-all duration-200 border border-gray-200 group"
                                            title="Borrar partida"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{game.title}</h3>
                                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-base">calendar_today</span>
                                    <span>{new Date(game.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${game.is_dm ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                        {game.is_dm ? 'Dungeon Master' : 'Jugador'}
                                    </span>
                                    <button 
                                        onClick={() => handleEnterGame(game.id)}
                                        className="px-4 py-2 bg-primary text-[#112217] text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Entrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
