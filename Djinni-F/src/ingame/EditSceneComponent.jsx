import React, { useState } from 'react';
import axios from 'axios';

export default function EditSceneComponent({ scene, onSceneUpdated }) {
    const [name, setName] = useState(scene.name);
    const [width, setWidth] = useState(scene.grid_width);
    const [height, setHeight] = useState(scene.grid_height);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);

    const handleSave = async (e) => {
        e.stopPropagation(); // Prevenir que el click se propague al div de selección de escena
        try {
            const token = localStorage.getItem('vtt_token');
            const response = await axios.put(
                `http://127.0.0.1:8000/scene/api/scenes/${scene.id}`,
                {
                    name: name,
                    grid_width: parseInt(width, 10),
                    grid_height: parseInt(height, 10)
                },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setIsEditing(false);
            if (onSceneUpdated) {
                onSceneUpdated(response.data);
            }
        } catch {
            setError('Error updating scene');
        }
    };

    if (!isEditing) {
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                className="mt-2 text-sm bg-blue-600 hover:bg-blue-500 text-white py-1 px-3 rounded"
            >
                Edit
            </button>
        );
    }

    return (
        <div
            className="mt-2 flex flex-col items-center bg-gray-700 p-2 rounded w-full"
            onClick={(e) => e.stopPropagation()} // Para que los clicks dentro del formulario no seleccionen la escena
        >
            {error && <p className="text-red-500 text-xs mb-1">{error}</p>}
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-1 w-full text-black px-1 py-1 text-sm rounded"
                placeholder="Scene Name"
            />
            <div className="flex w-full justify-between space-x-1 mb-1">
                <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-1/2 text-black px-1 py-1 text-sm rounded"
                    placeholder="Width"
                />
                <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-1/2 text-black px-1 py-1 text-sm rounded"
                    placeholder="Height"
                />
            </div>
            <div className="flex w-full justify-between mt-1 space-x-1">
                <button
                    onClick={handleSave}
                    className="w-1/2 bg-green-600 hover:bg-green-500 text-white py-1 rounded text-sm"
                >
                    Save
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(false);
                    }}
                    className="w-1/2 bg-red-600 hover:bg-red-500 text-white py-1 rounded text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
