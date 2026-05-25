import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import Modal from '../components/Modal.jsx';

export default function CreateGameModal({ isOpen, onClose }) {
    const [newGameTitle, setNewGameTitle] = useState('');
    const [createGameError, setCreateGameError] = useState(null);

    const handleCreateGameSubmit = async (e) => {
        e.preventDefault();
        setCreateGameError(null);

        let token = null;
        try { token = localStorage.getItem('vtt_token'); } catch (err) { console.error('localStorage read failed:', err); }
        if (!token) {
            setCreateGameError('You must be logged in to create a game.');
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/game/sesion/create`, {
                title: newGameTitle
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 201) {
                setNewGameTitle('');
                window.dispatchEvent(new Event('game-created'));
                onClose();
            }
        } catch (error) {
            if (error.response) {
                if (error.response.data && error.response.data.error) {
                    setCreateGameError(error.response.data.error);
                } else {
                    setCreateGameError(`Failed to create game. Status: ${error.response.status}`);
                }
            } else if (error.request) {
                setCreateGameError('No response from server. Please check your connection.');
            } else {
                setCreateGameError('An error occurred while setting up the request.');
            }
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy="create-game-title"
            containerClassName="z-[60] animate-fade-in"
        >
            <div className="bg-white dark:bg-surface rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-border-md overflow-hidden max-h-[92vh] flex flex-col">
                <div className="h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-dark flex-shrink-0"></div>
                <div className="p-6 sm:p-7 overflow-y-auto">
                    <h2 id="create-game-title" className="font-mystical text-2xl sm:text-3xl font-bold mb-1 text-gray-800 dark:text-text-hi tracking-wide">Nueva Partida</h2>
                    <p className="text-sm text-gray-500 dark:text-text-med mb-5">Da nombre a tu nueva aventura</p>

                    {createGameError && (
                        <div id="create-game-error" className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg text-sm flex items-center gap-2" role="alert">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {createGameError}
                        </div>
                    )}

                    <form onSubmit={handleCreateGameSubmit}>
                        <div className="mb-5">
                            <label htmlFor="gameTitle" className="block text-xs font-semibold tracking-wider uppercase text-gray-700 dark:text-text-med mb-2">
                                Título de la partida
                            </label>
                            <input
                                type="text"
                                id="gameTitle"
                                value={newGameTitle}
                                onChange={(e) => setNewGameTitle(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 dark:border-border-md rounded-lg bg-white dark:bg-surface-deep text-gray-900 dark:text-text-hi placeholder:text-gray-400 dark:placeholder:text-text-lo focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="Mi nueva campaña…"
                                required
                                autoFocus
                                aria-describedby={createGameError ? 'create-game-error' : undefined}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-text-med bg-gray-100 dark:bg-surface-hi border border-gray-200 dark:border-border-md rounded-lg hover:bg-gray-200 dark:hover:bg-border-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-sm font-bold text-[#042713] bg-primary rounded-lg shadow-glow hover:shadow-glow-hover hover:-translate-y-0.5 transition-all inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
                            >
                                <span className="material-symbols-outlined text-base">add_circle</span>
                                Crear
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
}
