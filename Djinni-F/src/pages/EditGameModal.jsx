import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { API_URL } from '../config/api';

export default function EditGameModal({ isOpen, onClose, game, onGameUpdated }) {
    const [title, setTitle] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [image, setImage] = useState(null);
    const [serverImage, setServerImage] = useState(null);
    const blobUrl = useObjectUrl(image);
    const previewImage = blobUrl || serverImage;
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (game) {
            setTitle(game.title);
            setIsActive(game.is_active);
            
            if (game.img_path) {
                const imgUrl = game.img_path.startsWith('/uploads')
                    ? `${API_URL}${game.img_path}`
                    : game.img_path;
                setServerImage(imgUrl);
            } else {
                setServerImage(null);
            }
            setImage(null); // Resetear imagen seleccionada
            setError(null);
        }
    }, [game, isOpen]);

    if (!isOpen || !game) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const token = localStorage.getItem('vtt_token');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('is_active', isActive);
        if (image) {
            formData.append('image', image);
        }

        try {
            const response = await axios.post(`${API_URL}/api/game/sesion/edit/${game.id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                onGameUpdated(); // Notificar al padre para recargar la lista
                onClose();
            }
        } catch {
            setError('Error al actualizar la partida.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
            <div className="bg-white dark:bg-[#0d1f10] p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto border border-gray-200 dark:border-emerald-900/50">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Editar Partida</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="editGameTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Título
                        </label>
                        <input
                            type="text"
                            id="editGameTitle"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#23482f] rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-[#112217] text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Partida Activa</span>
                        </label>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Imagen de Portada
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0">
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <span className="material-symbols-outlined">image</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="block w-full text-sm text-gray-500 dark:text-gray-300
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary/10 file:text-primary
                                    hover:file:bg-primary/20
                                "
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#23482f] rounded-md hover:bg-gray-200 dark:hover:bg-[#2f5c3b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-[#112217] bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-glow hover:shadow-glow-hover disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
