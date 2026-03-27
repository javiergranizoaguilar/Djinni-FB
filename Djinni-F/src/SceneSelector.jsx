import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import CreateSceneButton from './CreateSceneButton';

export default function SceneSelector({ onSceneSelect }) {
    const { id } = useParams();
    const [scenes, setScenes] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);

    const fetchScenes = async () => {
        try {
            const token = localStorage.getItem('vtt_token'); // Obtener el token
            const response = await axios.get(
                `http://127.0.0.1:8000/scene/api/game/${id}/scenes`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}` // Añadir la cabecera de autorización
                    }
                }
            );
            setScenes(response.data);
        } catch (err) {
            setError('Could not load scenes.');
        }
    };

    useEffect(() => {
        if (id) {
            fetchScenes();
        }
    }, [id]);

    const handleSceneClick = (scene) => {
        onSceneSelect(scene);
        setIsOpen(false);
    };

    const handleSceneCreated = (newScene) => {
        setScenes([...scenes, newScene]);
        fetchScenes(); // Re-fetch to ensure the list is up-to-date
    };

    return (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 w-full max-w-4xl px-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-800 text-white px-4 py-2 rounded-t-md focus:outline-none w-full text-center"
            >
                {isOpen ? 'Close Scenes' : 'Select Scene'}
            </button>
            {isOpen && (
                <div className="bg-gray-700 p-4 rounded-b-md shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Available Scenes</h3>
                        <CreateSceneButton gameId={id} onSceneCreated={handleSceneCreated} />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {scenes.length > 0 ? (
                            scenes.map((scene) => (
                                <div
                                    key={scene.id}
                                    onClick={() => handleSceneClick(scene)}
                                    className="cursor-pointer bg-gray-600 hover:bg-gray-500 p-2 rounded-md flex flex-col items-center"
                                >
                                    <div className="w-full h-32 bg-gray-800 rounded-md mb-2 flex items-center justify-center">
                                        {scene.thumbnail ? (
                                            <img src={scene.thumbnail} alt={scene.name} className="w-full h-full object-cover rounded-md" />
                                        ) : (
                                            <span className="text-gray-400">No Preview</span>
                                        )}
                                    </div>
                                    <p className="text-center">{scene.name}</p>
                                </div>
                            ))
                        ) : (
                            <p>No scenes available.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
