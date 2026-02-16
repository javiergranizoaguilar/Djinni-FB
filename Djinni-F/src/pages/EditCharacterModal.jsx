import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function EditCharacterModal({ isOpen, onClose, character, onCharacterUpdated }) {
    const [formData, setFormData] = useState({
        name: '',
        spellcasting_abillity: '',
        caster_level: 0,
        stats: {
            strength: 10, dexterity: 10, constitution: 10, 
            intelligence: 10, wisdom: 10, charisma: 10
        },
        apareance: '',
        backstory: '',
        personality_traits: '',
        ideals: '',
        bonds: '',
        flaws: '',
        exaustion: 0,
        currency: { gp: 0, sp: 0, cp: 0 },
        level: [{ class: '', level: 1, subclass: '' }], // Array de clases
        // Saving Throws
        sav_str: false, sav_str_mod: 0,
        sav_dex: false, sav_dex_mod: 0,
        sav_int: false, sav_int_mod: 0,
        sav_wis: false, sav_wis_mod: 0,
        sav_cha: false, sav_cha_mod: 0,
        // Skills
        acrobatics: 'none', acrobatics_mod: 0,
        animal_handling: 'none', animal_handling_mod: 0,
        arcana: 'none', arcana_mod: 0,
        athletics: 'none', athletics_mod: 0,
        deception: 'none', deception_mod: 0,
        history: 'none', history_mod: 0,
        insight: 'none', insight_mod: 0,
        intimidation: 'none', intimidation_mod: 0,
        investigation: 'none', investigation_mod: 0,
        medicine: 'none', medicine_mod: 0,
        nature: 'none', nature_mod: 0,
        perception: 'none', perception_mod: 0,
        performance: 'none', performance_mod: 0,
        persuasion: 'none', persuasion_mod: 0,
        religion: 'none', religion_mod: 0,
        sleight_of_hand: 'none', sleight_of_hand_mod: 0,
        stealth: 'none', stealth_mod: 0,
        survival: 'none', survival_mod: 0
    });
    
    // Sub-entities state
    const [attacks, setAttacks] = useState([]);
    const [abilities, setAbilities] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [spells, setSpells] = useState([]);

    const [tokenImage, setTokenImage] = useState(null);
    const [portraitImage, setPortraitImage] = useState(null);
    const [previewToken, setPreviewToken] = useState(null);
    const [previewPortrait, setPreviewPortrait] = useState(null);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    // New Item States
    const [newAttack, setNewAttack] = useState({ name: '', damage_dice: '', damage_type: '', range: '5ft' });
    const [newAbility, setNewAbility] = useState({ name: '', description: '', source_tipe: 'Race' });
    const [newItem, setNewItem] = useState({ item_name: '', quantity: 1, is_equipped: false });
    const [newSpell, setNewSpell] = useState({ name: '', level: 0, school: 'Evocation', casting_time: '1 action', range: '60 feet', duration: 'Instantaneous' });

    useEffect(() => {
        if (character) {
            // Normalizar level para que siempre sea un array
            let normalizedLevel = character.level;
            if (!Array.isArray(normalizedLevel)) {
                // Si es el formato antiguo (objeto) o null, convertirlo
                if (normalizedLevel && typeof normalizedLevel === 'object') {
                    normalizedLevel = [normalizedLevel];
                } else {
                    normalizedLevel = [{ class: '', level: 1, subclass: '' }];
                }
            }

            setFormData({
                name: character.name || '',
                spellcasting_abillity: character.spellcasting_abillity || '',
                caster_level: character.caster_level || 0,
                stats: character.stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
                apareance: character.apareance || '',
                backstory: character.backstory || '',
                personality_traits: character.personality_traits || '',
                ideals: character.ideals || '',
                bonds: character.bonds || '',
                flaws: character.flaws || '',
                exaustion: character.exaustion || 0,
                currency: character.currency || { gp: 0, sp: 0, cp: 0 },
                level: normalizedLevel,
                
                sav_str: character.sav_str || false, sav_str_mod: character.sav_str_mod || 0,
                sav_dex: character.sav_dex || false, sav_dex_mod: character.sav_dex_mod || 0,
                sav_int: character.sav_int || false, sav_int_mod: character.sav_int_mod || 0,
                sav_wis: character.sav_wis || false, sav_wis_mod: character.sav_wis_mod || 0,
                sav_cha: character.sav_cha || false, sav_cha_mod: character.sav_cha_mod || 0,

                acrobatics: character.acrobatics || 'none', acrobatics_mod: character.acrobatics_mod || 0,
                animal_handling: character.animal_handling || 'none', animal_handling_mod: character.animal_handling_mod || 0,
                arcana: character.arcana || 'none', arcana_mod: character.arcana_mod || 0,
                athletics: character.athletics || 'none', athletics_mod: character.athletics_mod || 0,
                deception: character.deception || 'none', deception_mod: character.deception_mod || 0,
                history: character.history || 'none', history_mod: character.history_mod || 0,
                insight: character.insight || 'none', insight_mod: character.insight_mod || 0,
                intimidation: character.intimidation || 'none', intimidation_mod: character.intimidation_mod || 0,
                investigation: character.investigation || 'none', investigation_mod: character.investigation_mod || 0,
                medicine: character.medicine || 'none', medicine_mod: character.medicine_mod || 0,
                nature: character.nature || 'none', nature_mod: character.nature_mod || 0,
                perception: character.perception || 'none', perception_mod: character.perception_mod || 0,
                performance: character.performance || 'none', performance_mod: character.performance_mod || 0,
                persuasion: character.persuasion || 'none', persuasion_mod: character.persuasion_mod || 0,
                religion: character.religion || 'none', religion_mod: character.religion_mod || 0,
                sleight_of_hand: character.sleight_of_hand || 'none', sleight_of_hand_mod: character.sleight_of_hand_mod || 0,
                stealth: character.stealth || 'none', stealth_mod: character.stealth_mod || 0,
                survival: character.survival || 'none', survival_mod: character.survival_mod || 0
            });

            setAttacks(character.attacks || []);
            setAbilities(character.abilities || []);
            setInventory(character.inventory || []);
            setSpells(character.spells || []);

            if (character.token_image) {
                const imgUrl = character.token_image.startsWith('/uploads') ? `http://localhost:8000${character.token_image}` : character.token_image;
                setPreviewToken(imgUrl);
            } else setPreviewToken(null);

            if (character.portrait_image) {
                const imgUrl = character.portrait_image.startsWith('/uploads') ? `http://localhost:8000${character.portrait_image}` : character.portrait_image;
                setPreviewPortrait(imgUrl);
            } else setPreviewPortrait(null);
            
            setTokenImage(null);
            setPortraitImage(null);
            setError(null);
        }
    }, [character, isOpen]);

    if (!isOpen || !character) return null;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handleStatChange = (stat, value) => {
        setFormData(prev => ({ ...prev, stats: { ...prev.stats, [stat]: parseInt(value) || 0 } }));
    };
    const handleCurrencyChange = (curr, value) => {
        setFormData(prev => ({ ...prev, currency: { ...prev.currency, [curr]: parseInt(value) || 0 } }));
    };
    
    // Manejo de Multiclase
    const handleClassChange = (index, field, value) => {
        const newLevels = [...formData.level];
        newLevels[index] = { 
            ...newLevels[index], 
            [field]: field === 'level' ? (parseInt(value) || 1) : value 
        };
        setFormData(prev => ({ ...prev, level: newLevels }));
    };

    const addClass = () => {
        setFormData(prev => ({
            ...prev,
            level: [...prev.level, { class: '', level: 1, subclass: '' }]
        }));
    };

    const removeClass = (index) => {
        if (formData.level.length > 1) {
            const newLevels = formData.level.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, level: newLevels }));
        }
    };

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'token') { setTokenImage(file); setPreviewToken(URL.createObjectURL(file)); }
            else { setPortraitImage(file); setPreviewPortrait(URL.createObjectURL(file)); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const token = localStorage.getItem('vtt_token');
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (typeof formData[key] === 'object') data.append(key, JSON.stringify(formData[key]));
            else if (typeof formData[key] === 'boolean') data.append(key, formData[key] ? '1' : '0');
            else data.append(key, formData[key]);
        });
        if (tokenImage) data.append('token_image', tokenImage);
        if (portraitImage) data.append('portrait_image', portraitImage);

        try {
            const response = await axios.post(`http://localhost:8000/api/character/edit/${character.id}`, data, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            if (response.status === 200) { onCharacterUpdated(); onClose(); }
        } catch (err) {
            console.error("Error updating character:", err);
            setError('Error al actualizar el personaje.');
        } finally { setSaving(false); }
    };

    // ... (Sub-Entity Handlers remain same) ...
    const handleAddAttack = async () => {
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.post(`http://localhost:8000/api/character/${character.id}/attack/create`, {
                ...newAttack,
                damage_dice: [newAttack.damage_dice], // Simple conversion for now
                damage_type: [newAttack.damage_type]
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            onCharacterUpdated(); // Refresh parent to get new list
            setNewAttack({ name: '', damage_dice: '', damage_type: '', range: '5ft' });
        } catch (err) { console.error(err); alert('Error creating attack'); }
    };

    const handleDeleteAttack = async (id) => {
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`http://localhost:8000/api/character/${character.id}/attack/delete/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onCharacterUpdated();
        } catch (err) { console.error(err); alert('Error deleting attack'); }
    };

    const handleAddAbility = async () => {
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.post(`http://localhost:8000/api/character/${character.id}/ability/create`, newAbility, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onCharacterUpdated();
            setNewAbility({ name: '', description: '', source_tipe: 'Race' });
        } catch (err) { console.error(err); alert('Error creating ability'); }
    };

    const handleDeleteAbility = async (id) => {
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`http://localhost:8000/api/character/${character.id}/ability/delete/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onCharacterUpdated();
        } catch (err) { console.error(err); alert('Error deleting ability'); }
    };

    const handleAddItem = async () => {
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.post(`http://localhost:8000/api/character/${character.id}/inventory/create`, newItem, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onCharacterUpdated();
            setNewItem({ item_name: '', quantity: 1, is_equipped: false });
        } catch (err) { console.error(err); alert('Error adding item'); }
    };

    const handleDeleteItem = async (id) => {
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`http://localhost:8000/api/character/${character.id}/inventory/delete/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onCharacterUpdated();
        } catch (err) { console.error(err); alert('Error deleting item'); }
    };

    const handleAddSpell = async () => {
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.post(`http://localhost:8000/api/character/${character.id}/spell/create`, newSpell, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onCharacterUpdated();
            setNewSpell({ name: '', level: 0, school: 'Evocation', casting_time: '1 action', range: '60 feet', duration: 'Instantaneous' });
        } catch (err) { console.error(err); alert('Error adding spell'); }
    };

    const handleDeleteSpell = async (id) => {
        const token = localStorage.getItem('vtt_token');
        try {
            await axios.delete(`http://localhost:8000/api/character/${character.id}/spell/delete/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onCharacterUpdated();
        } catch (err) { console.error(err); alert('Error deleting spell'); }
    };

    const skillOptions = [{ value: 'none', label: 'None' }, { value: 'proficent', label: 'Proficient' }, { value: 'expert', label: 'Expert' }];
    const skillsList = ['acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight_of_hand', 'stealth', 'survival'];
    const savingThrows = [{ key: 'sav_str', label: 'Strength' }, { key: 'sav_dex', label: 'Dexterity' }, { key: 'sav_int', label: 'Intelligence' }, { key: 'sav_wis', label: 'Wisdom' }, { key: 'sav_cha', label: 'Charisma' }];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-10">
            <div className="bg-white dark:bg-[#1a2c20] p-6 rounded-lg shadow-xl w-full max-w-6xl border border-gray-200 dark:border-[#23482f] max-h-full overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-[#23482f] pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Editar Personaje: {formData.name}</h2>
                    <div className="flex gap-2 flex-wrap">
                        {['general', 'bio', 'combat', 'spells', 'inventory'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-primary text-[#112217]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#23482f]'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                
                {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Columna 1: Datos Básicos e Imágenes */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" required />
                                </div>
                                
                                {/* Multiclase Section */}
                                <div className="bg-gray-50 dark:bg-[#112217] p-3 rounded-lg border dark:border-[#23482f]">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Clases & Niveles</label>
                                        <button type="button" onClick={addClass} className="text-xs bg-primary text-[#112217] px-2 py-1 rounded font-bold hover:bg-primary/90">
                                            + Añadir Clase
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.level.map((lvl, index) => (
                                            <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                                <div className="col-span-5">
                                                    <label className="block text-xs text-gray-500 mb-1">Clase</label>
                                                    <input type="text" value={lvl.class} onChange={(e) => handleClassChange(index, 'class', e.target.value)} className="w-full px-2 py-1 text-sm border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" placeholder="Clase" />
                                                </div>
                                                <div className="col-span-4">
                                                    <label className="block text-xs text-gray-500 mb-1">Subclase</label>
                                                    <input type="text" value={lvl.subclass} onChange={(e) => handleClassChange(index, 'subclass', e.target.value)} className="w-full px-2 py-1 text-sm border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" placeholder="Subclase" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">Nivel</label>
                                                    <input type="number" value={lvl.level} onChange={(e) => handleClassChange(index, 'level', e.target.value)} className="w-full px-2 py-1 text-sm border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white text-center" min="1" />
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    {formData.level.length > 1 && (
                                                        <button type="button" onClick={() => removeClass(index)} className="text-red-500 hover:text-red-700 pb-1">
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clase Lanzadora</label><input type="text" name="spellcasting_abillity" value={formData.spellcasting_abillity} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nivel de Lanzador</label><input type="number" name="caster_level" value={formData.caster_level} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Token</label>
                                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border mx-auto mb-2">
                                            {previewToken ? <img src={previewToken} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No img</div>}
                                        </div>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'token')} className="text-xs w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Retrato</label>
                                        <div className="w-24 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border mx-auto mb-2">
                                            {previewPortrait ? <img src={previewPortrait} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No img</div>}
                                        </div>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'portrait')} className="text-xs w-full" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Estadísticas</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.keys(formData.stats).map(stat => (
                                            <div key={stat}>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">{stat.substring(0, 3)}</label>
                                                <input type="number" value={formData.stats[stat]} onChange={(e) => handleStatChange(stat, e.target.value)} className="w-full px-2 py-1 text-center border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Columna 2: Saving Throws y Skills */}
                            <div className="space-y-4 lg:col-span-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Saving Throws</h3>
                                        <div className="space-y-2">
                                            {savingThrows.map(st => (
                                                <div key={st.key} className="flex items-center justify-between bg-gray-50 dark:bg-[#112217] p-2 rounded">
                                                    <div className="flex items-center gap-2">
                                                        <input type="checkbox" name={st.key} checked={formData[st.key]} onChange={handleInputChange} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{st.label}</label>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">Mod:</span>
                                                        <input type="number" name={`${st.key}_mod`} value={formData[`${st.key}_mod`]} onChange={handleInputChange} className="w-16 px-2 py-1 text-center border rounded-md dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white text-sm" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Skills</h3>
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                            {skillsList.map(skill => (
                                                <div key={skill} className="flex flex-col bg-gray-50 dark:bg-[#112217] p-2 rounded">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{skill.replace(/_/g, ' ')}</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500">Mod:</span>
                                                            <input type="number" name={`${skill}_mod`} value={formData[`${skill}_mod`]} onChange={handleInputChange} className="w-14 px-2 py-1 text-center border rounded-md dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white text-xs" />
                                                        </div>
                                                    </div>
                                                    <select name={skill} value={formData[skill]} onChange={handleInputChange} className="w-full px-2 py-1 text-sm border rounded-md dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white">
                                                        {skillOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bio' && (
                        <div className="space-y-4">
                            {/* ... (Bio Tab Content - Same as before) ... */}
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apariencia</label><textarea name="apareance" value={formData.apareance} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"></textarea></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Historia</label><textarea name="backstory" value={formData.backstory} onChange={handleInputChange} rows="5" className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"></textarea></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rasgos de Personalidad</label><textarea name="personality_traits" value={formData.personality_traits} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"></textarea></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ideales</label><textarea name="ideals" value={formData.ideals} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"></textarea></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vínculos</label><textarea name="bonds" value={formData.bonds} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"></textarea></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Defectos</label><textarea name="flaws" value={formData.flaws} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white"></textarea></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'combat' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exhaustion</label><input type="number" name="exaustion" value={formData.exaustion} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white" /></div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monedas (GP/SP/CP)</label>
                                    <div className="flex gap-1">
                                        <input type="number" placeholder="GP" value={formData.currency.gp} onChange={(e) => handleCurrencyChange('gp', e.target.value)} className="w-1/3 px-1 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white text-center" />
                                        <input type="number" placeholder="SP" value={formData.currency.sp} onChange={(e) => handleCurrencyChange('sp', e.target.value)} className="w-1/3 px-1 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white text-center" />
                                        <input type="number" placeholder="CP" value={formData.currency.cp} onChange={(e) => handleCurrencyChange('cp', e.target.value)} className="w-1/3 px-1 py-2 border rounded-md dark:bg-[#112217] dark:border-[#23482f] dark:text-white text-center" />
                                    </div>
                                </div>
                            </div>

                            {/* Attacks Section */}
                            <div className="bg-gray-50 dark:bg-[#112217] p-4 rounded-lg">
                                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Ataques</h3>
                                <div className="flex gap-2 mb-4">
                                    <input type="text" placeholder="Nombre" value={newAttack.name} onChange={e => setNewAttack({...newAttack, name: e.target.value})} className="flex-1 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <input type="text" placeholder="Daño (1d8)" value={newAttack.damage_dice} onChange={e => setNewAttack({...newAttack, damage_dice: e.target.value})} className="w-24 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <input type="text" placeholder="Tipo" value={newAttack.damage_type} onChange={e => setNewAttack({...newAttack, damage_type: e.target.value})} className="w-24 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <button type="button" onClick={handleAddAttack} className="bg-primary text-[#112217] px-3 py-1 rounded font-bold">+</button>
                                </div>
                                <div className="space-y-2">
                                    {attacks.map(att => (
                                        <div key={att.id} className="flex justify-between items-center bg-white dark:bg-[#1a2c20] p-2 rounded border dark:border-[#23482f]">
                                            <div>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{att.name}</span>
                                                <span className="text-sm text-gray-500 ml-2">{att.damage_dice?.[0]} {att.damage_type?.[0]}</span>
                                            </div>
                                            <button type="button" onClick={() => handleDeleteAttack(att.id)} className="text-red-500 hover:text-red-700"><span className="material-symbols-outlined">delete</span></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Abilities Section */}
                            <div className="bg-gray-50 dark:bg-[#112217] p-4 rounded-lg">
                                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Habilidades / Rasgos</h3>
                                <div className="flex gap-2 mb-4">
                                    <input type="text" placeholder="Nombre" value={newAbility.name} onChange={e => setNewAbility({...newAbility, name: e.target.value})} className="flex-1 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <input type="text" placeholder="Fuente (Raza/Clase)" value={newAbility.source_tipe} onChange={e => setNewAbility({...newAbility, source_tipe: e.target.value})} className="w-32 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <button type="button" onClick={handleAddAbility} className="bg-primary text-[#112217] px-3 py-1 rounded font-bold">+</button>
                                </div>
                                <div className="space-y-2">
                                    {abilities.map(ab => (
                                        <div key={ab.id} className="flex justify-between items-center bg-white dark:bg-[#1a2c20] p-2 rounded border dark:border-[#23482f]">
                                            <div>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{ab.name}</span>
                                                <span className="text-sm text-gray-500 ml-2">({ab.source_tipe})</span>
                                            </div>
                                            <button type="button" onClick={() => handleDeleteAbility(ab.id)} className="text-red-500 hover:text-red-700"><span className="material-symbols-outlined">delete</span></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'spells' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-[#112217] p-4 rounded-lg">
                                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Hechizos</h3>
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    <input type="text" placeholder="Nombre" value={newSpell.name} onChange={e => setNewSpell({...newSpell, name: e.target.value})} className="flex-1 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <input type="number" placeholder="Nivel" value={newSpell.level} onChange={e => setNewSpell({...newSpell, level: parseInt(e.target.value)})} className="w-20 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <input type="text" placeholder="Escuela" value={newSpell.school} onChange={e => setNewSpell({...newSpell, school: e.target.value})} className="w-32 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <button type="button" onClick={handleAddSpell} className="bg-primary text-[#112217] px-3 py-1 rounded font-bold">+</button>
                                </div>
                                <div className="space-y-2">
                                    {spells.map(spell => (
                                        <div key={spell.id} className="flex justify-between items-center bg-white dark:bg-[#1a2c20] p-2 rounded border dark:border-[#23482f]">
                                            <div>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{spell.name}</span>
                                                <span className="text-sm text-gray-500 ml-2">Nivel {spell.level} - {spell.school}</span>
                                            </div>
                                            <button type="button" onClick={() => handleDeleteSpell(spell.id)} className="text-red-500 hover:text-red-700"><span className="material-symbols-outlined">delete</span></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-[#112217] p-4 rounded-lg">
                                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Inventario</h3>
                                <div className="flex gap-2 mb-4">
                                    <input type="text" placeholder="Item Name" value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})} className="flex-1 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <input type="number" placeholder="Qty" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})} className="w-20 px-2 py-1 border rounded dark:bg-[#1a2c20] dark:border-[#23482f] dark:text-white" />
                                    <button type="button" onClick={handleAddItem} className="bg-primary text-[#112217] px-3 py-1 rounded font-bold">+</button>
                                </div>
                                <div className="space-y-2">
                                    {inventory.map(inv => (
                                        <div key={inv.id} className="flex justify-between items-center bg-white dark:bg-[#1a2c20] p-2 rounded border dark:border-[#23482f]">
                                            <div>
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{inv.item_name}</span>
                                                <span className="text-sm text-gray-500 ml-2">x{inv.quantity}</span>
                                            </div>
                                            <button type="button" onClick={() => handleDeleteItem(inv.id)} className="text-red-500 hover:text-red-700"><span className="material-symbols-outlined">delete</span></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-[#23482f]">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#23482f] rounded-md hover:bg-gray-200 dark:hover:bg-[#2f5c3b]" disabled={saving}>Cancelar</button>
                        <button type="submit" className="px-6 py-2 text-sm font-medium text-[#112217] bg-primary rounded-md hover:bg-primary/90 shadow-glow hover:shadow-glow-hover" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
