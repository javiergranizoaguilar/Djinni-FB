import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function GameList() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
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

        fetchGames();
    }, []);

    const handleEnterGame = (gameId) => {
        navigate(`/play/${gameId}`); 
    };

    if (loading) return <div className="text-center p-4 text-gray-600 dark:text-gray-300 pt-24">Cargando partidas...</div>;
    if (error) return <div className="text-center p-4 text-red-500 pt-24">{error}</div>;

    return (
        <div className="container mx-auto p-6 pt-24 min-h-screen">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Mis Partidas</h2>
            
            {games.length === 0 ? (
                <div className="text-center p-8 bg-gray-100 dark:bg-[#1a2c20] rounded-lg border border-dashed border-gray-300 dark:border-[#23482f]">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No tienes partidas creadas aún.</p>
                    <p className="text-sm text-gray-500">¡Crea una nueva partida desde el botón en la cabecera!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                        <div key={game.id} className="bg-white dark:bg-[#1a2c20] rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-[#23482f] hover:shadow-lg transition-shadow duration-300">
                            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-6xl text-primary/40">casino</span>
                            </div>
                            <div className="p-5">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{game.title}</h3>
                                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-base">calendar_today</span>
                                    <span>{new Date(game.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between mt-4">
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
