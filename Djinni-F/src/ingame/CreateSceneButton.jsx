import React, { useState } from 'react';
import axios from 'axios';
// import { useParams } from 'react-router-dom'; // Ya no necesitamos useParams aquí

export default function CreateSceneButton({ gameId, onSceneCreated }) { // Recibe gameId como prop
    // const { gameId } = useParams(); // Eliminado
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Asegurarse de que gameId no sea undefined antes de hacer la llamada
            if (!gameId) {
                setError('Game ID is missing. Cannot create scene.');
                return;
            }
            const response = await axios.post(`http://127.0.0.1:8000/scene/api/game/${gameId}/scenes`, { name }, { withCredentials: true });
            onSceneCreated(response.data);
            setIsOpen(false);
            setName('');
        } catch {
            setError('Could not create scene.');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
                Create New Scene
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-20">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                        <h2 className="text-2xl font-bold mb-4">Create New Scene</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium mb-2">Scene Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2"
                                    required
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white mr-4"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
