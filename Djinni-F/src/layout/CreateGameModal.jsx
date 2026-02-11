import { useState } from 'react';
import axios from 'axios';

export default function CreateGameModal({ isOpen, onClose }) {
    const [newGameTitle, setNewGameTitle] = useState('');
    const [createGameError, setCreateGameError] = useState(null);

    if (!isOpen) return null;

    const handleCreateGameSubmit = async (e) => {
        e.preventDefault();
        setCreateGameError(null);

        const token = localStorage.getItem('vtt_token');
        if (!token) {
            setCreateGameError('You must be logged in to create a game.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/game/sesion/create', {
                title: newGameTitle
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 201) {
                console.log('Game created:', response.data);
                setNewGameTitle('');
                onClose();
            }
        } catch (error) {
            console.error('Error creating game:', error);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
                if (error.response.data && error.response.data.error) {
                    setCreateGameError(error.response.data.error);
                } else {
                    setCreateGameError(`Failed to create game. Status: ${error.response.status}`);
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Request:', error.request);
                setCreateGameError('No response from server. Please check your connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
                setCreateGameError('An error occurred while setting up the request.');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a2c20] p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-[#23482f]">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Create New Game</h2>
                
                {createGameError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {createGameError}
                    </div>
                )}

                <form onSubmit={handleCreateGameSubmit}>
                    <div className="mb-4">
                        <label htmlFor="gameTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Game Title
                        </label>
                        <input
                            type="text"
                            id="gameTitle"
                            value={newGameTitle}
                            onChange={(e) => setNewGameTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#23482f] rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-[#112217] text-gray-900 dark:text-gray-100"
                            placeholder="Enter game title"
                            required
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#23482f] rounded-md hover:bg-gray-200 dark:hover:bg-[#2f5c3b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-[#112217] bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-glow hover:shadow-glow-hover"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
