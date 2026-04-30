import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditMonsterModal({ isOpen, onClose, monster, onMonsterUpdated }) {
    const [formData, setFormData] = useState({
        name: '',
        source_book: '',
        page_number: 0,
        type: '',
        size: '',
        alignment: '',
        armor_class: 10,
        ac_description: '',
        hit_points_average: 10,
        hp_formula: '',
        speed: { walk: 30 },
        str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
        saving_throws: {},
        skills: {},
        passive_perception: 10,
        challenge_rating: 0,
        senses: '',
        languages: '',
        traits: [],
        actions: [],
        bonus_actions: [],
        reactions: [],
        legendary_resistances_count: 0,
        legendary_actions_count: 0,
        legendary_actions: [],
        mythic_actions: [],
        lair_actions: [],
        regional_effects: [],
        enviroment: [],
        treasure: [],
        tags: [],
        vtt_metadata: {}
    });
    
    const [error,           setError]          = useState(null);
    const [saving,          setSaving]         = useState(false);
    const [tokenUrl,        setTokenUrl]       = useState(null);
    const [portraitUrl,     setPortraitUrl]    = useState(null);
    const [uploadingToken,  setUploadingToken] = useState(false);
    const [uploadingPortrait, setUploadingPortrait] = useState(false);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (monster) {
            setTokenUrl(monster.image_url || null);
            setPortraitUrl(monster.portrait_url || null);
            setFormData({
                name: monster.name || '',
                source_book: monster.source_book || '',
                page_number: monster.page_number || 0,
                type: monster.type || '',
                size: monster.size || '',
                alignment: monster.alignment || '',
                armor_class: monster.ac || 10,
                ac_description: monster.ac_description || '',
                hit_points_average: monster.hp || 10,
                hp_formula: monster.hp_formula || '',
                speed: monster.speed || { walk: 30 },
                str: monster.str || 10,
                dex: monster.dex || 10,
                con: monster.con || 10,
                int: monster.int || 10,
                wis: monster.wis || 10,
                cha: monster.cha || 10,
                saving_throws: monster.saving_throws || {},
                skills: monster.skills || {},
                passive_perception: monster.passive_perception || 10,
                challenge_rating: monster.cr || 0,
                senses: monster.senses || '',
                languages: monster.languages || '',
                traits: monster.traits || [],
                actions: monster.actions || [],
                bonus_actions: monster.bonus_actions || [],
                reactions: monster.reactions || [],
                legendary_resistances_count: monster.legendary_resistances_count || 0,
                legendary_actions_count: monster.legendary_actions_count || 0,
                legendary_actions: monster.legendary_actions || [],
                mythic_actions: monster.mythic_actions || [],
                lair_actions: monster.lair_actions || [],
                regional_effects: monster.regional_effects || [],
                enviroment: monster.enviroment || [],
                treasure: monster.treasure || [],
                tags: monster.tags || [],
                vtt_metadata: monster.vtt_metadata || {}
            });
            setError(null);
        }
    }, [monster, isOpen]);

    if (!isOpen || !monster) return null;

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseInt(value) || 0 : value 
        }));
    };

    const handleSpeedChange = (type, value) => {
        setFormData(prev => ({
            ...prev,
            speed: { ...prev.speed, [type]: parseInt(value) || 0 }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const token = localStorage.getItem('vtt_token');
        
        try {
            const response = await axios.post(`http://localhost:8000/api/monster/edit/${monster.id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                onMonsterUpdated?.({ ...monster, name: formData.name, hp: formData.hit_points_average, max_hp: formData.max_hp ?? monster.max_hp, ac: formData.armor_class, image_url: tokenUrl, portrait_url: portraitUrl });
                onClose();
            }
        } catch (err) {
            console.error("Error updating monster:", err);
            setError('Error al actualizar el monstruo.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (type, file) => {
        if (!file) return;
        const setter = type === 'portrait' ? setUploadingPortrait : setUploadingToken;
        setter(true);
        const token = localStorage.getItem('vtt_token');
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await axios.post(`http://localhost:8000/api/monster/${monster.id}/upload-${type}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTokenUrl(res.data.image_url);
            setPortraitUrl(res.data.portrait_url);
            onMonsterUpdated?.({ ...monster, image_url: res.data.image_url, portrait_url: res.data.portrait_url });
        } catch (err) {
            setError('Error al subir la imagen.');
        } finally {
            setter(false);
        }
    };

    const sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
    const types = ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-10">
            <div className="bg-white dark:bg-[#1a2c20] p-6 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200 dark:border-[#23482f] max-h-full overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Editar Monstruo: {formData.name}</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Imágenes del monstruo */}
                <div className="flex items-start gap-6 mb-4">
                    {/* Retrato */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#112217] flex items-center justify-center border border-gray-300 dark:border-[#23482f]">
                            {portraitUrl
                                ? <img src={`http://localhost:8000${portraitUrl}`} alt="retrato" className="w-full h-full object-cover" />
                                : <span className="text-4xl">🐉</span>
                            }
                        </div>
                        <label className="cursor-pointer inline-block px-3 py-1 bg-[#23482f] hover:bg-[#2d5a3a] text-white text-xs rounded-md transition-colors text-center">
                            {uploadingPortrait ? 'Subiendo…' : 'Retrato'}
                            <input type="file" accept="image/*" className="hidden"
                                onChange={e => handleImageUpload('portrait', e.target.files[0])}
                                disabled={uploadingPortrait} />
                        </label>
                    </div>
                    {/* Token */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-[#112217] flex items-center justify-center border border-gray-300 dark:border-[#23482f]">
                            {tokenUrl
                                ? <img src={`http://localhost:8000${tokenUrl}`} alt="token" className="w-full h-full object-cover" />
                                : <span className="text-2xl">⚔️</span>
                            }
                        </div>
                        <label className="cursor-pointer inline-block px-3 py-1 bg-[#23482f] hover:bg-[#2d5a3a] text-white text-xs rounded-md transition-colors text-center">
                            {uploadingToken ? 'Subiendo…' : 'Token'}
                            <input type="file" accept="image/*" className="hidden"
                                onChange={e => handleImageUpload('token', e.target.files[0])}
                                disabled={uploadingToken} />
                        </label>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna 1: Datos Básicos */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" required />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                                <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white">
                                    <option value="">Seleccionar...</option>
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tamaño</label>
                                <select name="size" value={formData.size} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white">
                                    <option value="">Seleccionar...</option>
                                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alineamiento</label>
                                <input type="text" name="alignment" value={formData.alignment} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Challenge Rating</label>
                                <input type="number" name="challenge_rating" value={formData.challenge_rating} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Armor Class</label>
                                <input type="number" name="armor_class" value={formData.armor_class} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hit Points</label>
                                <input type="number" name="hit_points_average" value={formData.hit_points_average} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HP Formula</label>
                            <input type="text" name="hp_formula" value={formData.hp_formula} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" placeholder="e.g. 2d8 + 2" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AC Description</label>
                            <input type="text" name="ac_description" value={formData.ac_description} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" placeholder="e.g. natural armor" />
                        </div>
                    </div>

                    {/* Columna 2: Stats y Velocidad */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Estadísticas</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                                    <div key={stat}>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">{stat.toUpperCase()}</label>
                                        <input 
                                            type="number" 
                                            name={stat}
                                            value={formData[stat]} 
                                            onChange={handleInputChange}
                                            className="w-full px-2 py-1 text-center border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Velocidad (ft.)</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Walk</label>
                                    <input 
                                        type="number" 
                                        value={formData.speed.walk || 0} 
                                        onChange={(e) => handleSpeedChange('walk', e.target.value)}
                                        className="w-full px-2 py-1 text-center border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Fly</label>
                                    <input 
                                        type="number" 
                                        value={formData.speed.fly || 0} 
                                        onChange={(e) => handleSpeedChange('fly', e.target.value)}
                                        className="w-full px-2 py-1 text-center border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Swim</label>
                                    <input 
                                        type="number" 
                                        value={formData.speed.swim || 0} 
                                        onChange={(e) => handleSpeedChange('swim', e.target.value)}
                                        className="w-full px-2 py-1 text-center border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Climb</label>
                                    <input 
                                        type="number" 
                                        value={formData.speed.climb || 0} 
                                        onChange={(e) => handleSpeedChange('climb', e.target.value)}
                                        className="w-full px-2 py-1 text-center border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Detalles Adicionales</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sentidos</label>
                                <textarea name="senses" value={formData.senses} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"></textarea>
                            </div>
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Idiomas</label>
                                <input type="text" name="languages" value={formData.languages} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 border-t pt-4 dark:border-[#23482f]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#23482f] rounded-md hover:bg-gray-200 dark:hover:bg-[#2f5c3b]"
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 text-sm font-medium text-[#112217] bg-primary rounded-md hover:bg-primary/90 shadow-glow hover:shadow-glow-hover"
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
