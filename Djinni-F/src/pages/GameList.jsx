import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EditGameModal from './EditGameModal.jsx';
import CreateGameModal from './CreateGameModal.jsx';
import { Toast, useToast } from '../components/Toast.jsx';
import { API_URL } from '../config/api';

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
    const { toast, show: showToast, hide: hideToast } = useToast();

    const fetchGames = async () => {
        const token = localStorage.getItem('vtt_token');
        if (!token) {
            setError('No estás autenticado.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/api/game/sesion/my-games`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setGames(response.data);
        } catch {
            setError('Error al cargar las partidas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
        const handleGameCreated = () => fetchGames();
        window.addEventListener('game-created', handleGameCreated);
        return () => window.removeEventListener('game-created', handleGameCreated);
    }, []);

    const handleEnterGame = (gameId) => navigate(`/play/${gameId}`);

    const handleEditGame = (game) => {
        setSelectedGame(game);
        setShowEditModal(true);
    };

    const handleCopyInvite = (token, gameId) => {
        const inviteLink = `${window.location.origin}/join/${token}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            setCopiedId(gameId);
            showToast('Enlace de invitación copiado al portapapeles', 'ok');
            setTimeout(() => setCopiedId(null), 2000);
        }).catch(() => showToast('No se pudo copiar el enlace', 'err'));
    };

    const handleDeleteGame = async (gameId) => {
        if (!window.confirm('¿Estás seguro de que quieres borrar esta partida? Esta acción no se puede deshacer.')) return;
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`${API_URL}/api/game/sesion/delete/${gameId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('Partida eliminada', 'ok');
            fetchGames();
        } catch {
            showToast('Error al borrar la partida', 'err');
        }
    };

    const filteredGames = games.filter(game =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h2 className="font-heading text-3xl sm:text-4xl text-text-hi tracking-widest">Mis Partidas</h2>
                    <p className="text-sm text-text-lo mt-1">Crea, gestiona y entra en tus aventuras</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-grow md:flex-grow-0 md:w-72">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-lo text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Buscar partida…"
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
                        <span className="hidden sm:inline">Crear Partida</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="arcane-card overflow-hidden">
                            <div className="skeleton h-32 w-full rounded-none"></div>
                            <div className="p-5 flex flex-col gap-3">
                                <div className="skeleton h-5 w-2/3"></div>
                                <div className="skeleton h-4 w-1/3"></div>
                                <div className="flex gap-2 mt-3">
                                    <div className="skeleton h-9 w-20"></div>
                                    <div className="skeleton h-9 w-20 ml-auto"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredGames.length === 0 ? (
                <div className="max-w-lg mx-auto mt-16 text-center p-10 rounded-2xl border border-dashed border-primary/15 bg-surface/30 backdrop-blur animate-fade-in">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/8 border border-primary/15 mb-4">
                        <span className="material-symbols-outlined text-3xl text-primary">casino</span>
                    </div>
                    <h3 className="font-heading text-lg text-text-hi tracking-wide mb-2">
                        {searchTerm ? 'Sin resultados' : 'Aún no tienes partidas'}
                    </h3>
                    <p className="text-sm text-text-lo mb-6">
                        {searchTerm ? 'Prueba con otra búsqueda o crea una nueva partida.' : 'Crea tu primera partida y empieza tu primera aventura.'}
                    </p>
                    {!searchTerm && (
                        <button onClick={() => setShowCreateModal(true)} className="arcane-btn">
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Crear primera partida
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGames.map((game) => (
                        <div key={game.id} className="arcane-card flex flex-col animate-fade-in">
                            <div className="h-32 bg-gradient-to-br from-primary/10 via-surface to-surface-base flex items-center justify-center relative overflow-hidden">
                                {game.img_path ? (
                                    <img
                                        src={game.img_path.startsWith('/uploads') ? `${API_URL}${game.img_path}` : game.img_path}
                                        alt={game.title}
                                        loading="lazy"
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
                                            onClick={(e) => { e.stopPropagation(); handleCopyInvite(game.invitation_token, game.id); }}
                                            className="p-2.5 bg-white/95 dark:bg-surface-hi text-gray-800 dark:text-text-hi rounded-full shadow-md hover:scale-110 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-border-md group"
                                            title="Copiar enlace de invitación"
                                            aria-label="Copiar enlace de invitación"
                                        >
                                            <span className="material-symbols-outlined text-xl group-hover:text-primary transition-colors">
                                                {copiedId === game.id ? 'check' : 'share'}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="text-lg font-bold text-text-hi mb-1.5 line-clamp-1 tracking-wide">{game.title}</h3>
                                <div className="flex items-center gap-1.5 mb-4 text-xs text-text-lo">
                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                    <span>{new Date(game.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${game.is_dm ? 'bg-djinni-gold/15 text-djinni-gold border border-djinni-gold/35' : 'bg-primary/10 text-primary border border-primary/30'}`}>
                                        {game.is_dm ? '⚜ Dungeon Master' : 'Jugador'}
                                    </span>
                                    <div className="flex gap-2">
                                        {game.is_dm && (
                                            <>
                                                <button
                                                    onClick={() => handleDeleteGame(game.id)}
                                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 hover:border-red-500 text-sm font-bold rounded-lg transition-all flex items-center"
                                                    title="Borrar partida"
                                                    aria-label="Borrar partida"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                                <button
                                                    onClick={() => handleEditGame(game)}
                                                    className="p-2 bg-surface-hi text-text-med hover:bg-border-md hover:text-primary text-sm font-bold rounded-lg transition-all flex items-center border border-border-lo"
                                                    title="Ajustes de partida"
                                                    aria-label="Ajustes de partida"
                                                >
                                                    <span className="material-symbols-outlined text-lg">settings</span>
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleEnterGame(game.id)}
                                            className="px-4 py-2 bg-primary text-[#042713] text-sm font-bold rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 shadow-glow hover:shadow-glow-hover transition-all flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-base">login</span>
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
                onGameUpdated={() => { fetchGames(); showToast('Partida actualizada', 'ok'); }}
            />

            <CreateGameModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    );
}
