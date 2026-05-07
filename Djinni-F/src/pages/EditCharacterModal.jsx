import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    overflowY: 'auto', padding: '32px 16px',
  },
  modal: {
    background: 'linear-gradient(160deg,#0f172a 0%,#111827 100%)',
    border: '1px solid #1e293b',
    borderRadius: 16,
    width: '100%', maxWidth: 1020,
    boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px #334155 inset',
    fontFamily: "'Cinzel', 'Georgia', serif",
    position: 'relative',
    overflow: 'hidden',
  },
  topAccent: {
    height: 3,
    background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#6366f1)',
    width: '100%',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 20,
    padding: '24px 28px 20px',
    borderBottom: '1px solid #1e293b',
    background: 'rgba(255,255,255,0.02)',
  },
  portraitRing: {
    width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
    background: '#1e293b',
    border: '2px solid #6366f1',
    overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 18px rgba(99,102,241,0.35)',
    cursor: 'pointer',
    position: 'relative',
  },
  portraitImg: { width: '100%', height: '100%', objectFit: 'cover' },
  portraitPlaceholder: {
    color: '#475569', fontSize: 28, fontFamily: 'sans-serif', userSelect: 'none',
  },
  headerInfo: { flex: 1 },
  charName: {
    color: '#f1f5f9', fontSize: 22, fontWeight: 700,
    letterSpacing: '0.04em', lineHeight: 1.2, margin: 0,
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  classBadges: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: {
    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
    color: '#a5b4fc', borderRadius: 20, padding: '2px 10px',
    fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, letterSpacing: '0.06em',
  },
  levelBadge: {
    background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.5)',
    color: '#c4b5fd', borderRadius: 20, padding: '2px 10px',
    fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, letterSpacing: '0.06em',
  },
  hpRow: { display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' },
  hpPill: {
    background: '#0f172a', border: '1px solid #22c55e', borderRadius: 20,
    padding: '2px 12px', display: 'flex', alignItems: 'center', gap: 6,
  },
  hpLabel: { color: '#22c55e', fontSize: 10, fontFamily: 'sans-serif', fontWeight: 700 },
  hpVal: { color: '#86efac', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 },
  closeBtn: {
    background: 'transparent', border: '1px solid #334155', borderRadius: 8,
    color: '#64748b', cursor: 'pointer', padding: '6px 10px', fontSize: 18,
    lineHeight: 1, transition: 'all 0.15s', marginLeft: 'auto', alignSelf: 'flex-start',
    fontFamily: 'sans-serif',
  },
  tabs: {
    display: 'flex', gap: 4, padding: '14px 28px 0',
    background: 'rgba(0,0,0,0.15)',
    borderBottom: '1px solid #1e293b',
    overflowX: 'auto',
  },
  tab: (active) => ({
    background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
    border: active ? '1px solid rgba(99,102,241,0.45)' : '1px solid transparent',
    borderBottom: active ? '1px solid transparent' : '1px solid transparent',
    color: active ? '#a5b4fc' : '#475569',
    borderRadius: '8px 8px 0 0',
    padding: '8px 18px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'sans-serif', letterSpacing: '0.07em', textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }),
  body: { padding: '24px 28px 28px', minHeight: 420 },
  label: {
    display: 'block', color: '#94a3b8', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
    fontFamily: 'sans-serif',
  },
  input: {
    width: '100%', background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, color: '#f1f5f9', padding: '8px 12px',
    fontSize: 13, outline: 'none', fontFamily: 'sans-serif',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%', background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, color: '#f1f5f9', padding: '10px 12px',
    fontSize: 13, outline: 'none', fontFamily: 'sans-serif',
    boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6,
  },
  select: {
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, color: '#f1f5f9', padding: '8px 10px',
    fontSize: 12, outline: 'none', fontFamily: 'sans-serif',
    cursor: 'pointer',
  },
  panel: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid #1e293b',
    borderRadius: 10, padding: 16,
  },
  panelTitle: {
    color: '#6366f1', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    margin: '0 0 12px', fontFamily: 'sans-serif',
    borderBottom: '1px solid #1e293b', paddingBottom: 8,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 },
  statBox: {
    background: 'linear-gradient(160deg,#1e293b,#0f172a)',
    border: '1px solid #334155', borderRadius: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '14px 10px 10px', gap: 2, position: 'relative',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  statName: {
    color: '#6366f1', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
    textTransform: 'uppercase', fontFamily: 'sans-serif',
  },
  statInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#f1f5f9', fontSize: 28, fontWeight: 700,
    textAlign: 'center', width: '100%', fontFamily: "'Cinzel','Georgia',serif",
    MozAppearance: 'textfield',
  },
  modBadge: {
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: 20, padding: '1px 10px',
    color: '#a5b4fc', fontSize: 12, fontWeight: 700,
    fontFamily: 'monospace',
  },
  savRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '5px 8px', borderRadius: 6,
    background: 'rgba(255,255,255,0.02)', marginBottom: 4,
  },
  skillRow: {
    display: 'flex', alignItems: 'center',
    padding: '4px 8px', borderRadius: 6,
    background: 'rgba(255,255,255,0.02)', marginBottom: 3, gap: 6,
  },
  profDot: (prof) => ({
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    background: prof === 'expert' ? '#f59e0b' : prof === 'proficent' ? '#22c55e' : '#1e293b',
    border: `1px solid ${prof === 'expert' ? '#f59e0b' : prof === 'proficent' ? '#22c55e' : '#475569'}`,
    cursor: 'pointer',
  }),
  listItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8,
    padding: '8px 12px', marginBottom: 6,
  },
  delBtn: {
    background: 'transparent', border: 'none', color: '#475569',
    cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1,
    fontFamily: 'sans-serif', transition: 'color 0.15s',
  },
  addRow: {
    display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap',
  },
  addBtn: {
    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)',
    color: '#a5b4fc', borderRadius: 8, padding: '7px 16px',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'sans-serif', letterSpacing: '0.04em', transition: 'all 0.15s',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    marginTop: 28, paddingTop: 20, borderTop: '1px solid #1e293b',
  },
  cancelBtn: {
    background: 'transparent', border: '1px solid #334155',
    color: '#94a3b8', borderRadius: 8, padding: '9px 22px',
    fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif',
  },
  saveBtn: {
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    border: 'none', color: 'white', borderRadius: 8,
    padding: '9px 28px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'sans-serif',
    boxShadow: '0 0 20px rgba(99,102,241,0.4)',
    letterSpacing: '0.04em',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
    color: '#fca5a5', borderRadius: 8, padding: '10px 14px',
    fontSize: 12, fontFamily: 'sans-serif', marginBottom: 16,
  },
  sectionGap: { display: 'flex', flexDirection: 'column', gap: 16 },
  imgBox: {
    background: '#0f172a', border: '1px dashed #334155',
    borderRadius: 10, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  currencyBox: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, padding: '4px 10px',
  },
  currLabel: { color: '#f59e0b', fontSize: 10, fontWeight: 700, fontFamily: 'sans-serif', letterSpacing: '0.08em' },
  currInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#fde68a', fontSize: 14, fontWeight: 700,
    width: 60, textAlign: 'center', fontFamily: 'monospace',
    MozAppearance: 'textfield',
  },
  spellLvlHeader: {
    color: '#8b5cf6', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', fontFamily: 'sans-serif',
    padding: '6px 0 4px', borderBottom: '1px solid #1e293b', marginBottom: 6,
  },
};

const STAT_LABELS = {
  strength: 'FUE', dexterity: 'DES', constitution: 'CON',
  intelligence: 'INT', wisdom: 'SAB', charisma: 'CAR',
};
const mod = (score) => Math.floor((score - 10) / 2);
const fmtMod = (score) => { const m = mod(score); return (m >= 0 ? '+' : '') + m; };

const SKILL_STAT = {
  acrobatics: 'dexterity', animal_handling: 'wisdom', arcana: 'intelligence',
  athletics: 'strength', deception: 'charisma', history: 'intelligence',
  insight: 'wisdom', intimidation: 'charisma', investigation: 'intelligence',
  medicine: 'wisdom', nature: 'intelligence', perception: 'wisdom',
  performance: 'charisma', persuasion: 'charisma', religion: 'intelligence',
  sleight_of_hand: 'dexterity', stealth: 'dexterity', survival: 'wisdom',
};
const SKILL_ES = {
  acrobatics: 'Acrobacias', animal_handling: 'Trato Animales', arcana: 'Arcano',
  athletics: 'Atletismo', deception: 'Engaño', history: 'Historia',
  insight: 'Perspicacia', intimidation: 'Intimidación', investigation: 'Investigación',
  medicine: 'Medicina', nature: 'Naturaleza', perception: 'Percepción',
  performance: 'Actuación', persuasion: 'Persuasión', religion: 'Religión',
  sleight_of_hand: 'Juego de Manos', stealth: 'Sigilo', survival: 'Supervivencia',
};

const SAVE_KEYS = [
  { key: 'sav_str', label: 'Fuerza',        stat: 'strength' },
  { key: 'sav_dex', label: 'Destreza',      stat: 'dexterity' },
  { key: 'sav_int', label: 'Inteligencia',  stat: 'intelligence' },
  { key: 'sav_wis', label: 'Sabiduría',     stat: 'wisdom' },
  { key: 'sav_cha', label: 'Carisma',       stat: 'charisma' },
];
const SKILLS_LIST = Object.keys(SKILL_STAT);

const SCHOOL_OPTIONS = ['Abjuración','Conjuración','Adivinación','Encantamiento','Evocación','Ilusión','Nigromancia','Transmutación'];

export default function EditCharacterModal({ isOpen, onClose, character, onCharacterUpdated }) {
  const [formData, setFormData] = useState({
    name: '', spellcasting_abillity: '', caster_level: 0,
    stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    apareance: '', backstory: '', personality_traits: '', ideals: '', bonds: '', flaws: '',
    exaustion: 0, currency: { gp: 0, sp: 0, cp: 0 },
    level: [{ class: '', level: 1, subclass: '' }],
    hp: 0, max_hp: 0,
    sav_str: false, sav_str_mod: 0, sav_dex: false, sav_dex_mod: 0,
    sav_int: false, sav_int_mod: 0, sav_wis: false, sav_wis_mod: 0, sav_cha: false, sav_cha_mod: 0,
    acrobatics: 'none', acrobatics_mod: 0, animal_handling: 'none', animal_handling_mod: 0,
    arcana: 'none', arcana_mod: 0, athletics: 'none', athletics_mod: 0,
    deception: 'none', deception_mod: 0, history: 'none', history_mod: 0,
    insight: 'none', insight_mod: 0, intimidation: 'none', intimidation_mod: 0,
    investigation: 'none', investigation_mod: 0, medicine: 'none', medicine_mod: 0,
    nature: 'none', nature_mod: 0, perception: 'none', perception_mod: 0,
    performance: 'none', performance_mod: 0, persuasion: 'none', persuasion_mod: 0,
    religion: 'none', religion_mod: 0, sleight_of_hand: 'none', sleight_of_hand_mod: 0,
    stealth: 'none', stealth_mod: 0, survival: 'none', survival_mod: 0,
  });

  const [attacks, setAttacks]       = useState([]);
  const [abilities, setAbilities]   = useState([]);
  const [inventory, setInventory]   = useState([]);
  const [spells, setSpells]         = useState([]);
  const [tokenImage, setTokenImage] = useState(null);
  const [portraitImage, setPortraitImage] = useState(null);
  const [previewToken, setPreviewToken]   = useState(null);
  const [previewPortrait, setPreviewPortrait] = useState(null);
  const [error, setError]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [newAttack, setNewAttack]   = useState({ name: '', damage_dice: '', damage_type: '', range: '5ft' });
  const [newAbility, setNewAbility] = useState({ name: '', description: '', source_tipe: 'Raza' });
  const [newItem, setNewItem]       = useState({ item_name: '', quantity: 1, is_equipped: false });
  const [newSpell, setNewSpell]     = useState({ name: '', level: 0, school: 'Evocación', casting_time: '1 acción', range: '18m', duration: 'Instantáneo' });

  const [pos, setPos]   = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 1020, h: 700 });
  const [minimized, setMinimized] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const initW = Math.min(1020, Math.round(window.innerWidth * 0.9));
    const initH = Math.min(700, Math.round(window.innerHeight * 0.85));
    setSize({ w: initW, h: initH });
    setPos({
      x: Math.round((window.innerWidth - initW) / 2),
      y: Math.round((window.innerHeight - initH) / 2),
    });
  }, [isOpen]);

  useEffect(() => {
    if (!character) return;
    let normalizedLevel = character.level;
    if (!Array.isArray(normalizedLevel)) {
      normalizedLevel = (normalizedLevel && typeof normalizedLevel === 'object')
        ? [normalizedLevel] : [{ class: '', level: 1, subclass: '' }];
    }
    setFormData({
      name: character.name || '', spellcasting_abillity: character.spellcasting_abillity || '',
      caster_level: character.caster_level || 0,
      stats: character.stats || { strength:10, dexterity:10, constitution:10, intelligence:10, wisdom:10, charisma:10 },
      apareance: character.apareance || '', backstory: character.backstory || '',
      personality_traits: character.personality_traits || '', ideals: character.ideals || '',
      bonds: character.bonds || '', flaws: character.flaws || '',
      exaustion: character.exaustion || 0,
      currency: character.currency || { gp: 0, sp: 0, cp: 0 },
      level: normalizedLevel,
      hp: character.hp ?? 0, max_hp: character.max_hp ?? 0,
      sav_str: character.sav_str||false, sav_str_mod: character.sav_str_mod||0,
      sav_dex: character.sav_dex||false, sav_dex_mod: character.sav_dex_mod||0,
      sav_int: character.sav_int||false, sav_int_mod: character.sav_int_mod||0,
      sav_wis: character.sav_wis||false, sav_wis_mod: character.sav_wis_mod||0,
      sav_cha: character.sav_cha||false, sav_cha_mod: character.sav_cha_mod||0,
      acrobatics: character.acrobatics||'none', acrobatics_mod: character.acrobatics_mod||0,
      animal_handling: character.animal_handling||'none', animal_handling_mod: character.animal_handling_mod||0,
      arcana: character.arcana||'none', arcana_mod: character.arcana_mod||0,
      athletics: character.athletics||'none', athletics_mod: character.athletics_mod||0,
      deception: character.deception||'none', deception_mod: character.deception_mod||0,
      history: character.history||'none', history_mod: character.history_mod||0,
      insight: character.insight||'none', insight_mod: character.insight_mod||0,
      intimidation: character.intimidation||'none', intimidation_mod: character.intimidation_mod||0,
      investigation: character.investigation||'none', investigation_mod: character.investigation_mod||0,
      medicine: character.medicine||'none', medicine_mod: character.medicine_mod||0,
      nature: character.nature||'none', nature_mod: character.nature_mod||0,
      perception: character.perception||'none', perception_mod: character.perception_mod||0,
      performance: character.performance||'none', performance_mod: character.performance_mod||0,
      persuasion: character.persuasion||'none', persuasion_mod: character.persuasion_mod||0,
      religion: character.religion||'none', religion_mod: character.religion_mod||0,
      sleight_of_hand: character.sleight_of_hand||'none', sleight_of_hand_mod: character.sleight_of_hand_mod||0,
      stealth: character.stealth||'none', stealth_mod: character.stealth_mod||0,
      survival: character.survival||'none', survival_mod: character.survival_mod||0,
    });
    setAttacks(character.attacks || []);
    setAbilities(character.abilities || []);
    setInventory(character.inventory || []);
    setSpells(character.spells || []);
    const mkUrl = p => p?.startsWith('/uploads') ? `${API}${p}` : p;
    setPreviewToken(character.token_image ? mkUrl(character.token_image) : null);
    setPreviewPortrait(character.portrait_image ? mkUrl(character.portrait_image) : null);
    setTokenImage(null); setPortraitImage(null); setError(null);
  }, [character, isOpen]);

  if (!isOpen || !character) return null;

  const set = (key, val) => setFormData(p => ({ ...p, [key]: val }));
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  };
  const handleStatChange = (stat, value) =>
    setFormData(p => ({ ...p, stats: { ...p.stats, [stat]: parseInt(value) || 0 } }));
  const handleCurrencyChange = (curr, value) =>
    setFormData(p => ({ ...p, currency: { ...p.currency, [curr]: parseInt(value) || 0 } }));
  const handleClassChange = (index, field, value) => {
    const levels = [...formData.level];
    levels[index] = { ...levels[index], [field]: field === 'level' ? (parseInt(value)||1) : value };
    set('level', levels);
  };
  const addClass = () => set('level', [...formData.level, { class:'', level:1, subclass:'' }]);
  const removeClass = (i) => { if (formData.level.length > 1) set('level', formData.level.filter((_,j)=>j!==i)); };
  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type==='token') { setTokenImage(file); setPreviewToken(URL.createObjectURL(file)); }
    else { setPortraitImage(file); setPreviewPortrait(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError(null);
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
      const response = await axios.post(`${API}/api/character/edit/${character.id}`, data, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (response.status === 200) { onCharacterUpdated({ ...character, ...formData }); onClose(); }
    } catch (err) {
      console.error(err); setError('Error al actualizar el personaje.');
    } finally { setSaving(false); }
  };

  const handleAddAttack = async () => {
    const token = localStorage.getItem('vtt_token');
    try {
      const res = await axios.post(`${API}/api/character/${character.id}/attack/create`,
        { ...newAttack, damage_dice: [newAttack.damage_dice], damage_type: [newAttack.damage_type] },
        { headers: { Authorization: `Bearer ${token}` } });
      setAttacks(p => [...p, res.data || { ...newAttack, id: Date.now() }]);
      setNewAttack({ name:'', damage_dice:'', damage_type:'', range:'5ft' });
    } catch(err) { console.error(err); }
  };
  const handleDeleteAttack = async (id) => {
    const token = localStorage.getItem('vtt_token');
    try {
      await axios.delete(`${API}/api/character/${character.id}/attack/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAttacks(p => p.filter(a => a.id !== id));
    } catch(err) { console.error(err); }
  };
  const handleAddAbility = async () => {
    const token = localStorage.getItem('vtt_token');
    try {
      const res = await axios.post(`${API}/api/character/${character.id}/ability/create`, newAbility,
        { headers: { Authorization: `Bearer ${token}` } });
      setAbilities(p => [...p, res.data || { ...newAbility, id: Date.now() }]);
      setNewAbility({ name:'', description:'', source_tipe:'Raza' });
    } catch(err) { console.error(err); }
  };
  const handleDeleteAbility = async (id) => {
    const token = localStorage.getItem('vtt_token');
    try {
      await axios.delete(`${API}/api/character/${character.id}/ability/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAbilities(p => p.filter(a => a.id !== id));
    } catch(err) { console.error(err); }
  };
  const handleAddItem = async () => {
    const token = localStorage.getItem('vtt_token');
    try {
      const res = await axios.post(`${API}/api/character/${character.id}/inventory/create`, newItem,
        { headers: { Authorization: `Bearer ${token}` } });
      setInventory(p => [...p, res.data || { ...newItem, id: Date.now() }]);
      setNewItem({ item_name:'', quantity:1, is_equipped:false });
    } catch(err) { console.error(err); }
  };
  const handleDeleteItem = async (id) => {
    const token = localStorage.getItem('vtt_token');
    try {
      await axios.delete(`${API}/api/character/${character.id}/inventory/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setInventory(p => p.filter(i => i.id !== id));
    } catch(err) { console.error(err); }
  };
  const handleAddSpell = async () => {
    const token = localStorage.getItem('vtt_token');
    try {
      const res = await axios.post(`${API}/api/character/${character.id}/spell/create`, newSpell,
        { headers: { Authorization: `Bearer ${token}` } });
      setSpells(p => [...p, res.data || { ...newSpell, id: Date.now() }]);
      setNewSpell({ name:'', level:0, school:'Evocación', casting_time:'1 acción', range:'18m', duration:'Instantáneo' });
    } catch(err) { console.error(err); }
  };
  const handleDeleteSpell = async (id) => {
    const token = localStorage.getItem('vtt_token');
    try {
      await axios.delete(`${API}/api/character/${character.id}/spell/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSpells(p => p.filter(s => s.id !== id));
    } catch(err) { console.error(err); }
  };

  const totalLevel = formData.level.reduce((s, l) => s + (parseInt(l.level)||0), 0);

  const spellsByLevel = spells.reduce((acc, s) => {
    const lvl = s.level ?? 0;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(s);
    return acc;
  }, {});

  const TABS = [
    { id:'general', label:'General' }, { id:'stats', label:'Stats' },
    { id:'combat', label:'Combate' }, { id:'spells', label:'Hechizos' },
    { id:'inventory', label:'Inventario' }, { id:'bio', label:'Bio' },
  ];

  const inp = (overrides={}) => ({ ...S.input, ...overrides });
  const smallInp = { ...S.input, padding:'6px 8px', fontSize:12 };

  const handleDragStart = (e) => {
    if (e.target.closest('button,input,select,textarea,label,a')) return;
    e.preventDefault();
    const startX = e.clientX - pos.x, startY = e.clientY - pos.y;
    const onMove = (ev) => {
      let nx = ev.clientX - startX, ny = ev.clientY - startY;
      nx = Math.max(80 - size.w, Math.min(window.innerWidth - 80, nx));
      ny = Math.max(0, Math.min(window.innerHeight - 40, ny));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleResizeStart = (e, dir) => {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, sl = pos.x, st = pos.y, sw = size.w, sh = size.h;
    const MIN_W = 320, MIN_H = 240, MAX_W = Math.round(window.innerWidth * 0.95), MAX_H = Math.round(window.innerHeight * 0.95);
    const onMove = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let nx = sl, ny = st, nw = sw, nh = sh;
      if (dir.includes('e')) nw = Math.min(MAX_W, Math.max(MIN_W, sw + dx));
      if (dir.includes('s')) nh = Math.min(MAX_H, Math.max(MIN_H, sh + dy));
      if (dir.includes('w')) { nw = Math.min(MAX_W, Math.max(MIN_W, sw - dx)); nx = sl + sw - nw; }
      if (dir.includes('n')) { nh = Math.min(MAX_H, Math.max(MIN_H, sh - dy)); ny = st + sh - nh; }
      setPos({ x: nx, y: ny }); setSize({ w: nw, h: nh });
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const rh = (dir) => {
    const b = { position: 'absolute', zIndex: 10 }, E = 6, C = 14;
    if (dir === 'n')  return { ...b, cursor: 'n-resize',  top: 0,    left: C,  right: C,  height: E };
    if (dir === 's')  return { ...b, cursor: 's-resize',  bottom: 0, left: C,  right: C,  height: E };
    if (dir === 'e')  return { ...b, cursor: 'e-resize',  right: 0,  top: C,   bottom: C, width:  E };
    if (dir === 'w')  return { ...b, cursor: 'w-resize',  left: 0,   top: C,   bottom: C, width:  E };
    if (dir === 'ne') return { ...b, cursor: 'ne-resize', top: 0,    right: 0, width: C,  height: C };
    if (dir === 'nw') return { ...b, cursor: 'nw-resize', top: 0,    left: 0,  width: C,  height: C };
    if (dir === 'se') return { ...b, cursor: 'se-resize', bottom: 0, right: 0, width: C,  height: C };
    if (dir === 'sw') return { ...b, cursor: 'sw-resize', bottom: 0, left: 0,  width: C,  height: C };
  };

  if (!isOpen || !character) return null;

  if (minimized) {
    return (
      <div style={{
        position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'linear-gradient(160deg,#0f172a 0%,#111827 100%)',
        border: '1px solid #6366f1', borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px #334155 inset',
        overflow: 'hidden', minWidth: 260, maxWidth: 340,
        cursor: 'pointer', userSelect: 'none',
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#6366f1)', width: '100%' }} />
        <div
          style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}
          onDoubleClick={() => setMinimized(false)}
        >
          <span style={{ color: '#6366f1', fontSize: 18 }}>⚔</span>
          <span style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700, fontFamily: "'Cinzel','Georgia',serif", letterSpacing: '0.04em' }}>
            {formData.name || 'Sin nombre'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={modalRef} style={{ ...S.modal, position: 'fixed', left: pos.x, top: pos.y, width: size.w, height: size.h, maxWidth: 'none', display: 'flex', flexDirection: 'column' }}>
      {['n','s','e','w','ne','nw','se','sw'].map(dir => (
        <div key={dir} style={rh(dir)} onMouseDown={e => handleResizeStart(e, dir)} />
      ))}
      {/* Google Font hint */}
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap" rel="stylesheet" />
        <div style={S.topAccent} />

        {/* HEADER */}
        <div style={{ ...S.header, cursor: 'move', userSelect: 'none', flexShrink: 0 }} onMouseDown={handleDragStart}>
          <div style={S.portraitRing}>
            {previewPortrait
              ? <img src={previewPortrait} style={S.portraitImg} alt="portrait" />
              : <span style={S.portraitPlaceholder}>⚔</span>}
          </div>
          <div style={S.headerInfo}>
            <h2 style={S.charName} onDoubleClick={e => { e.stopPropagation(); setMinimized(true); }}>{formData.name || 'Nuevo Personaje'}</h2>
            <div style={S.classBadges}>
              {formData.level.filter(l => l.class).map((l, i) => (
                <span key={i} style={S.badge}>{l.class} {l.subclass ? `· ${l.subclass}` : ''}</span>
              ))}
              {totalLevel > 0 && <span style={S.levelBadge}>Nivel {totalLevel}</span>}
            </div>
            <div style={S.hpRow}>
              <div style={S.hpPill}>
                <span style={S.hpLabel}>HP</span>
                <span style={S.hpVal}>{formData.hp} / {formData.max_hp}</span>
              </div>
              {formData.exaustion > 0 && (
                <div style={{ ...S.hpPill, borderColor:'#f59e0b' }}>
                  <span style={{ ...S.hpLabel, color:'#f59e0b' }}>EXHAUSTION</span>
                  <span style={{ ...S.hpVal, color:'#fde68a' }}>{formData.exaustion}/6</span>
                </div>
              )}
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}
            onMouseDown={e=>e.stopPropagation()}
            onMouseEnter={e=>e.currentTarget.style.color='#f1f5f9'}
            onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>✕</button>
        </div>

        {/* TABS */}
        <div style={S.tabs}>
          {TABS.map(t => (
            <button key={t.id} style={S.tab(activeTab===t.id)} onClick={()=>setActiveTab(t.id)}
              onMouseEnter={e=>{ if(activeTab!==t.id) e.currentTarget.style.color='#94a3b8'; }}
              onMouseLeave={e=>{ if(activeTab!==t.id) e.currentTarget.style.color='#475569'; }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ ...S.body, flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {error && <div style={S.errorBox}>{error}</div>}

            {/* ── GENERAL ── */}
            {activeTab==='general' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                {/* Left */}
                <div style={S.sectionGap}>
                  <div style={S.panel}>
                    <p style={S.panelTitle}>Identidad</p>
                    <label style={S.label}>Nombre del Personaje</label>
                    <input style={inp({marginBottom:12})} name="name" value={formData.name} onChange={handleInputChange} required />

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={S.label}>Clases & Niveles</span>
                      <button type="button" onClick={addClass} style={{ ...S.addBtn, padding:'3px 10px', fontSize:11 }}>+ Clase</button>
                    </div>
                    {formData.level.map((lvl, i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr auto', gap:6, marginBottom:6 }}>
                        <input style={smallInp} value={lvl.class} onChange={e=>handleClassChange(i,'class',e.target.value)} placeholder="Clase" />
                        <input style={smallInp} value={lvl.subclass} onChange={e=>handleClassChange(i,'subclass',e.target.value)} placeholder="Subclase" />
                        <input style={{ ...smallInp, textAlign:'center' }} type="number" value={lvl.level} min={1} onChange={e=>handleClassChange(i,'level',e.target.value)} />
                        {formData.level.length > 1 &&
                          <button type="button" onClick={()=>removeClass(i)} style={S.delBtn}
                            onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                            onMouseLeave={e=>e.currentTarget.style.color='#475569'}>✕</button>}
                      </div>
                    ))}
                  </div>

                  <div style={S.panel}>
                    <p style={S.panelTitle}>Puntos de Vida</p>
                    <div style={S.grid2}>
                      <div>
                        <label style={S.label}>HP Actual</label>
                        <input style={inp({textAlign:'center'})} type="number" name="hp" value={formData.hp} onChange={handleInputChange} />
                      </div>
                      <div>
                        <label style={S.label}>HP Máximo</label>
                        <input style={inp({textAlign:'center'})} type="number" name="max_hp" value={formData.max_hp} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div style={S.panel}>
                    <p style={S.panelTitle}>Magia</p>
                    <div style={S.grid2}>
                      <div>
                        <label style={S.label}>Habilidad Lanzadora</label>
                        <input style={inp()} name="spellcasting_abillity" value={formData.spellcasting_abillity} onChange={handleInputChange} placeholder="INT, SAB, CAR…" />
                      </div>
                      <div>
                        <label style={S.label}>Nivel Lanzador</label>
                        <input style={inp({textAlign:'center'})} type="number" name="caster_level" value={formData.caster_level} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div style={S.panel}>
                    <p style={S.panelTitle}>Exhaustion</p>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <input style={{ flex:1, accentColor:'#6366f1' }} type="range" name="exaustion" min={0} max={6} value={formData.exaustion} onChange={handleInputChange} />
                      <span style={{ color:'#a5b4fc', fontWeight:700, fontSize:18, minWidth:20, textAlign:'center', fontFamily:'monospace' }}>{formData.exaustion}</span>
                      <span style={{ color:'#475569', fontSize:11, fontFamily:'sans-serif' }}>/6</span>
                    </div>
                    <div style={{ display:'flex', gap:4, marginTop:6 }}>
                      {[0,1,2,3,4,5,6].map(n=>(
                        <div key={n} onClick={()=>set('exaustion',n)} style={{
                          width:22, height:22, borderRadius:4, cursor:'pointer',
                          background: n <= formData.exaustion ? '#6366f1' : '#1e293b',
                          border: '1px solid #334155', transition:'background 0.15s',
                        }}/>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right — Images */}
                <div style={S.sectionGap}>
                  <div style={S.panel}>
                    <p style={S.panelTitle}>Imágenes</p>
                    <div style={S.grid2}>
                      <div>
                        <label style={S.label}>Token (circular)</label>
                        <div style={{ ...S.imgBox, width:90, height:90, borderRadius:'50%', margin:'0 auto 8px' }}>
                          {previewToken
                            ? <img src={previewToken} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} alt="token" />
                            : <span style={{ color:'#334155', fontSize:24 }}>⬡</span>}
                        </div>
                        <input type="file" accept="image/*" onChange={e=>handleImageChange(e,'token')}
                          style={{ fontSize:11, color:'#64748b', fontFamily:'sans-serif', width:'100%' }} />
                      </div>
                      <div>
                        <label style={S.label}>Retrato</label>
                        <div style={{ ...S.imgBox, width:80, height:110, borderRadius:8, margin:'0 auto 8px' }}>
                          {previewPortrait
                            ? <img src={previewPortrait} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8 }} alt="portrait" />
                            : <span style={{ color:'#334155', fontSize:24 }}>🎭</span>}
                        </div>
                        <input type="file" accept="image/*" onChange={e=>handleImageChange(e,'portrait')}
                          style={{ fontSize:11, color:'#64748b', fontFamily:'sans-serif', width:'100%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STATS ── */}
            {activeTab==='stats' && (
              <div style={S.sectionGap}>
                {/* Ability Scores */}
                <div style={S.panel}>
                  <p style={S.panelTitle}>Puntuaciones de Característica</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
                    {Object.keys(STAT_LABELS).map(stat => (
                      <div key={stat} style={S.statBox}>
                        <span style={S.statName}>{STAT_LABELS[stat]}</span>
                        <input type="number" value={formData.stats[stat]}
                          onChange={e=>handleStatChange(stat, e.target.value)}
                          style={S.statInput} />
                        <span style={S.modBadge}>{fmtMod(formData.stats[stat])}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {/* Saving Throws */}
                  <div style={S.panel}>
                    <p style={S.panelTitle}>Tiradas de Salvación</p>
                    {SAVE_KEYS.map(sv => (
                      <div key={sv.key} style={S.savRow}>
                        <input type="checkbox" name={sv.key} checked={formData[sv.key]} onChange={handleInputChange}
                          style={{ accentColor:'#6366f1', width:14, height:14, cursor:'pointer' }} />
                        <span style={{ color:'#cbd5e1', fontSize:12, fontFamily:'sans-serif', flex:1 }}>{sv.label}</span>
                        <span style={{ color:'#64748b', fontSize:10, fontFamily:'sans-serif' }}>MOD</span>
                        <input type="number" name={`${sv.key}_mod`} value={formData[`${sv.key}_mod`]} onChange={handleInputChange}
                          style={{ ...smallInp, width:46, textAlign:'center', padding:'4px 4px' }} />
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  <div style={S.panel}>
                    <p style={S.panelTitle}>Habilidades</p>
                    <div style={{ maxHeight:280, overflowY:'auto', paddingRight:4 }}>
                      {SKILLS_LIST.map(skill => {
                        const prof = formData[skill];
                        const cycleProf = () => {
                          const opts = ['none','proficent','expert'];
                          set(skill, opts[(opts.indexOf(prof)+1)%3]);
                        };
                        return (
                          <div key={skill} style={S.skillRow}>
                            <div style={S.profDot(prof)} onClick={cycleProf} title={prof} />
                            <span style={{ color:'#cbd5e1', fontSize:11, fontFamily:'sans-serif', flex:1 }}>
                              {SKILL_ES[skill]}
                            </span>
                            <span style={{ color:'#475569', fontSize:9, fontFamily:'sans-serif' }}>{STAT_LABELS[SKILL_STAT[skill]]}</span>
                            <input type="number" name={`${skill}_mod`} value={formData[`${skill}_mod`]} onChange={handleInputChange}
                              style={{ ...smallInp, width:40, textAlign:'center', padding:'3px 4px' }} />
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ color:'#475569', fontSize:10, fontFamily:'sans-serif', margin:'8px 0 0', textAlign:'center' }}>
                      Clic en el punto para ciclar: ○ ninguno → ● competente → ◆ experto
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── COMBATE ── */}
            {activeTab==='combat' && (
              <div style={S.sectionGap}>
                {/* Currency */}
                <div style={S.panel}>
                  <p style={S.panelTitle}>Monedas</p>
                  <div style={{ display:'flex', gap:12 }}>
                    {[['gp','ORO'],['sp','PLATA'],['cp','COBRE']].map(([k,l]) => (
                      <div key={k} style={S.currencyBox}>
                        <span style={S.currLabel}>{l}</span>
                        <input type="number" value={formData.currency[k]} onChange={e=>handleCurrencyChange(k,e.target.value)}
                          style={S.currInput} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attacks */}
                <div style={S.panel}>
                  <p style={S.panelTitle}>Ataques</p>
                  <div style={S.addRow}>
                    <input style={{ ...smallInp, flex:1 }} placeholder="Nombre del ataque" value={newAttack.name} onChange={e=>setNewAttack({...newAttack,name:e.target.value})} />
                    <input style={{ ...smallInp, width:80 }} placeholder="Daño (1d8)" value={newAttack.damage_dice} onChange={e=>setNewAttack({...newAttack,damage_dice:e.target.value})} />
                    <input style={{ ...smallInp, width:80 }} placeholder="Tipo" value={newAttack.damage_type} onChange={e=>setNewAttack({...newAttack,damage_type:e.target.value})} />
                    <input style={{ ...smallInp, width:60 }} placeholder="Alcance" value={newAttack.range} onChange={e=>setNewAttack({...newAttack,range:e.target.value})} />
                    <button type="button" onClick={handleAddAttack} style={S.addBtn}>+ Añadir</button>
                  </div>
                  {attacks.length === 0
                    ? <p style={{ color:'#334155', fontSize:12, fontFamily:'sans-serif', textAlign:'center', padding:12 }}>Sin ataques registrados</p>
                    : attacks.map(att => (
                      <div key={att.id} style={S.listItem}>
                        <div>
                          <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:13, fontFamily:'sans-serif' }}>{att.name}</span>
                          <span style={{ color:'#64748b', fontSize:11, fontFamily:'sans-serif', marginLeft:10 }}>
                            {att.damage_dice?.[0]} {att.damage_type?.[0]} · {att.range}
                          </span>
                        </div>
                        <button type="button" onClick={()=>handleDeleteAttack(att.id)} style={S.delBtn}
                          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                          onMouseLeave={e=>e.currentTarget.style.color='#475569'}>✕</button>
                      </div>
                    ))}
                </div>

                {/* Abilities */}
                <div style={S.panel}>
                  <p style={S.panelTitle}>Habilidades / Rasgos</p>
                  <div style={S.addRow}>
                    <input style={{ ...smallInp, flex:1 }} placeholder="Nombre" value={newAbility.name} onChange={e=>setNewAbility({...newAbility,name:e.target.value})} />
                    <input style={{ ...smallInp, flex:1 }} placeholder="Descripción" value={newAbility.description} onChange={e=>setNewAbility({...newAbility,description:e.target.value})} />
                    <input style={{ ...smallInp, width:90 }} placeholder="Fuente" value={newAbility.source_tipe} onChange={e=>setNewAbility({...newAbility,source_tipe:e.target.value})} />
                    <button type="button" onClick={handleAddAbility} style={S.addBtn}>+ Añadir</button>
                  </div>
                  {abilities.length === 0
                    ? <p style={{ color:'#334155', fontSize:12, fontFamily:'sans-serif', textAlign:'center', padding:12 }}>Sin rasgos registrados</p>
                    : abilities.map(ab => (
                      <div key={ab.id} style={S.listItem}>
                        <div>
                          <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:13, fontFamily:'sans-serif' }}>{ab.name}</span>
                          <span style={{ color:'#6366f1', fontSize:10, fontFamily:'sans-serif', marginLeft:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>{ab.source_tipe}</span>
                          {ab.description && <p style={{ color:'#64748b', fontSize:11, fontFamily:'sans-serif', margin:'2px 0 0' }}>{ab.description}</p>}
                        </div>
                        <button type="button" onClick={()=>handleDeleteAbility(ab.id)} style={S.delBtn}
                          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                          onMouseLeave={e=>e.currentTarget.style.color='#475569'}>✕</button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ── HECHIZOS ── */}
            {activeTab==='spells' && (
              <div style={S.sectionGap}>
                <div style={S.panel}>
                  <p style={S.panelTitle}>Añadir Hechizo</p>
                  <div style={S.addRow}>
                    <input style={{ ...smallInp, flex:2 }} placeholder="Nombre" value={newSpell.name} onChange={e=>setNewSpell({...newSpell,name:e.target.value})} />
                    <input style={{ ...smallInp, width:60, textAlign:'center' }} type="number" placeholder="Niv" value={newSpell.level} min={0} onChange={e=>setNewSpell({...newSpell,level:parseInt(e.target.value)||0})} />
                    <select style={{ ...S.select, fontSize:12, padding:'6px 8px' }} value={newSpell.school} onChange={e=>setNewSpell({...newSpell,school:e.target.value})}>
                      {SCHOOL_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <input style={{ ...smallInp, width:90 }} placeholder="Tiempo" value={newSpell.casting_time} onChange={e=>setNewSpell({...newSpell,casting_time:e.target.value})} />
                    <input style={{ ...smallInp, width:70 }} placeholder="Rango" value={newSpell.range} onChange={e=>setNewSpell({...newSpell,range:e.target.value})} />
                    <input style={{ ...smallInp, width:90 }} placeholder="Duración" value={newSpell.duration} onChange={e=>setNewSpell({...newSpell,duration:e.target.value})} />
                    <button type="button" onClick={handleAddSpell} style={S.addBtn}>+ Añadir</button>
                  </div>
                </div>

                {Object.keys(spellsByLevel).sort((a,b)=>a-b).map(lvl => (
                  <div key={lvl} style={S.panel}>
                    <div style={S.spellLvlHeader}>
                      {parseInt(lvl)===0 ? 'Trucos (Nivel 0)' : `Nivel ${lvl}`}
                    </div>
                    {spellsByLevel[lvl].map(spell => (
                      <div key={spell.id} style={S.listItem}>
                        <div>
                          <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:13, fontFamily:'sans-serif' }}>{spell.name}</span>
                          <span style={{ color:'#8b5cf6', fontSize:11, fontFamily:'sans-serif', marginLeft:8 }}>{spell.school}</span>
                          <span style={{ color:'#475569', fontSize:11, fontFamily:'sans-serif', marginLeft:8 }}>
                            {spell.casting_time} · {spell.range} · {spell.duration}
                          </span>
                        </div>
                        <button type="button" onClick={()=>handleDeleteSpell(spell.id)} style={S.delBtn}
                          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                          onMouseLeave={e=>e.currentTarget.style.color='#475569'}>✕</button>
                      </div>
                    ))}
                  </div>
                ))}
                {spells.length === 0 && (
                  <div style={{ ...S.panel, textAlign:'center', padding:32 }}>
                    <p style={{ color:'#334155', fontFamily:'sans-serif', fontSize:13 }}>Sin hechizos aprendidos</p>
                  </div>
                )}
              </div>
            )}

            {/* ── INVENTARIO ── */}
            {activeTab==='inventory' && (
              <div style={S.sectionGap}>
                <div style={S.panel}>
                  <p style={S.panelTitle}>Añadir Objeto</p>
                  <div style={S.addRow}>
                    <input style={{ ...smallInp, flex:1 }} placeholder="Nombre del objeto" value={newItem.item_name} onChange={e=>setNewItem({...newItem,item_name:e.target.value})} />
                    <input style={{ ...smallInp, width:70, textAlign:'center' }} type="number" placeholder="Cantidad" value={newItem.quantity} min={1} onChange={e=>setNewItem({...newItem,quantity:parseInt(e.target.value)||1})} />
                    <label style={{ display:'flex', alignItems:'center', gap:6, color:'#94a3b8', fontSize:12, fontFamily:'sans-serif', cursor:'pointer' }}>
                      <input type="checkbox" checked={newItem.is_equipped} onChange={e=>setNewItem({...newItem,is_equipped:e.target.checked})} style={{ accentColor:'#6366f1' }} />
                      Equipado
                    </label>
                    <button type="button" onClick={handleAddItem} style={S.addBtn}>+ Añadir</button>
                  </div>
                </div>

                <div style={S.panel}>
                  <p style={S.panelTitle}>Objetos ({inventory.length})</p>
                  {inventory.length === 0
                    ? <p style={{ color:'#334155', fontSize:13, fontFamily:'sans-serif', textAlign:'center', padding:20 }}>Inventario vacío</p>
                    : inventory.map(inv => (
                      <div key={inv.id} style={S.listItem}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          {inv.is_equipped && (
                            <span style={{ color:'#22c55e', fontSize:10, fontFamily:'sans-serif', fontWeight:700, letterSpacing:'0.08em' }}>EQ</span>
                          )}
                          <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:13, fontFamily:'sans-serif' }}>{inv.item_name}</span>
                          <span style={{ color:'#475569', fontSize:12, fontFamily:'monospace' }}>×{inv.quantity}</span>
                        </div>
                        <button type="button" onClick={()=>handleDeleteItem(inv.id)} style={S.delBtn}
                          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                          onMouseLeave={e=>e.currentTarget.style.color='#475569'}>✕</button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ── BIO ── */}
            {activeTab==='bio' && (
              <div style={S.sectionGap}>
                <div style={S.panel}>
                  <p style={S.panelTitle}>Trasfondo</p>
                  <textarea style={{ ...S.textarea, minHeight:120 }} name="backstory" value={formData.backstory} onChange={handleInputChange} placeholder="La historia de tu personaje…" />
                </div>
                <div style={S.panel}>
                  <p style={S.panelTitle}>Apariencia</p>
                  <textarea style={{ ...S.textarea, minHeight:80 }} name="apareance" value={formData.apareance} onChange={handleInputChange} placeholder="Descripción física del personaje…" />
                </div>
                <div style={S.grid2}>
                  <div style={S.panel}>
                    <p style={S.panelTitle}>Rasgos de Personalidad</p>
                    <textarea style={{ ...S.textarea, minHeight:80 }} name="personality_traits" value={formData.personality_traits} onChange={handleInputChange} />
                  </div>
                  <div style={S.panel}>
                    <p style={S.panelTitle}>Ideales</p>
                    <textarea style={{ ...S.textarea, minHeight:80 }} name="ideals" value={formData.ideals} onChange={handleInputChange} />
                  </div>
                  <div style={S.panel}>
                    <p style={S.panelTitle}>Vínculos</p>
                    <textarea style={{ ...S.textarea, minHeight:80 }} name="bonds" value={formData.bonds} onChange={handleInputChange} />
                  </div>
                  <div style={S.panel}>
                    <p style={S.panelTitle}>Defectos</p>
                    <textarea style={{ ...S.textarea, minHeight:80 }} name="flaws" value={formData.flaws} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div style={S.footer}>
              <button type="button" onClick={onClose} style={S.cancelBtn} disabled={saving}>Cancelar</button>
              <button type="submit" style={S.saveBtn} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
  );
}
