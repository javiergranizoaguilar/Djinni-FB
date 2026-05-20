import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    background: prof === 'expertise' ? '#f59e0b' : prof === 'proficiency' ? '#22c55e' : '#1e293b',
    border: `1px solid ${prof === 'expertise' ? '#f59e0b' : prof === 'proficiency' ? '#22c55e' : '#475569'}`,
    cursor: 'pointer',
    boxShadow: prof === 'expertise' ? '0 0 0 2px #1e293b, 0 0 0 3px #f59e0b' : 'none',
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

const normSkill = (v) => {
  if (v === 'proficiency' || v === 'expertise') return v;
  if (v === 'proficent') return 'proficiency';
  if (v === 'expert') return 'expertise';
  return '';
};

const SCHOOL_OPTIONS = ['Abjuración','Conjuración','Adivinación','Encantamiento','Evocación','Ilusión','Nigromancia','Transmutación'];

const ABILITY_OPTIONS = [
  { value: '',             label: '—' },
  { value: 'nada',         label: 'Nada' },
  { value: 'fuerza',       label: 'Fuerza' },
  { value: 'destreza',     label: 'Destreza' },
  { value: 'constitucion', label: 'Constitución' },
  { value: 'inteligencia', label: 'Inteligencia' },
  { value: 'sabiduria',    label: 'Sabiduría' },
  { value: 'carisma',      label: 'Carisma' },
];

const ABILITY_TO_STAT = {
  fuerza: 'strength',
  destreza: 'dexterity',
  constitucion: 'constitution',
  inteligencia: 'intelligence',
  sabiduria: 'wisdom',
  carisma: 'charisma',
};

const ABILITY_LABEL = {
  nada: 'nada',
  fuerza: 'fuerza',
  destreza: 'destreza',
  constitucion: 'constitución',
  inteligencia: 'inteligencia',
  sabiduria: 'sabiduría',
  carisma: 'carisma',
};

const abilityModFromStats = (ability, stats) => {
  const statKey = ABILITY_TO_STAT[ability];
  if (!statKey) return 0;
  const score = Number(stats?.[statKey] ?? 10);
  return Math.floor((score - 10) / 2);
};

const profBonus = (level) => Math.floor(((level || 1) - 1) / 4) + 2;

const fmtSigned = (n) => (n >= 0 ? `+${n}` : `${n}`);

const rollDice = (notation) => {
  const m = String(notation || '').match(/^(\d+)d(\d+)$/i);
  if (!m) return { total: 0, crit: null };
  const count = Number(m[1]), sides = Number(m[2]);
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  const crit = total === count ? 'min' : total === count * sides ? 'max' : null;
  return { total, crit };
};

const fmtDiceWithMod = (dice, modSum) => {
  if (!dice) return '';
  if (!modSum) return dice;
  return modSum > 0 ? `${dice}+${modSum}` : `${dice}${modSum}`;
};

export default function EditCharacterModal({ isOpen, onClose, character, onCharacterUpdated, onSendMessage }) {
  const [formData, setFormData] = useState({
    name: '', spellcasting_abillity: '', caster_level: 0,
    stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    apareance: '', backstory: '', personality_traits: '', ideals: '', bonds: '', flaws: '',
    race: '', subrace: '', alignment: '',
    exaustion: 0, currency: { gp: 0, sp: 0, cp: 0 },
    level: [{ class: '', level: 1, subclass: '' }],
    hp: 0, max_hp: 0, vision: 0,
    sav_str: false, sav_str_mod: 0, sav_dex: false, sav_dex_mod: 0,
    sav_int: false, sav_int_mod: 0, sav_wis: false, sav_wis_mod: 0, sav_cha: false, sav_cha_mod: 0,
    acrobatics: '', acrobatics_mod: 0, animal_handling: '', animal_handling_mod: 0,
    arcana: '', arcana_mod: 0, athletics: '', athletics_mod: 0,
    deception: '', deception_mod: 0, history: '', history_mod: 0,
    insight: '', insight_mod: 0, intimidation: '', intimidation_mod: 0,
    investigation: '', investigation_mod: 0, medicine: '', medicine_mod: 0,
    nature: '', nature_mod: 0, perception: '', perception_mod: 0,
    performance: '', performance_mod: 0, persuasion: '', persuasion_mod: 0,
    religion: '', religion_mod: 0, sleight_of_hand: '', sleight_of_hand_mod: 0,
    stealth: '', stealth_mod: 0, survival: '', survival_mod: 0,
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
  const [newAbility, setNewAbility] = useState({ name: '', description: '', source_tipe: 'Raza' });
  const [newItem, setNewItem]       = useState({ item_name: '', quantity: 1, is_equipped: false });
  const [editingAttackId, setEditingAttackId] = useState(null);
  const [editAttack, setEditAttack]           = useState({});
  const [editingSpellId, setEditingSpellId]   = useState(null);
  const [editSpell, setEditSpell]             = useState({});

  const [pos, setPos]   = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 1020, h: 700 });
  const [minimized, setMinimized] = useState(false);
  const modalRef = useRef(null);

  const [autosaveStatus, setAutosaveStatus] = useState('idle');
  const autosaveTimerRef  = useRef(null);
  const autosaveClearRef  = useRef(null);
  const skipNextAutoSaveRef = useRef(true);
  const dirtyAfterAutoSaveRef = useRef(false);
  const latestFormDataRef = useRef(null);

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
      race: character.race || '', subrace: character.subrace || '', alignment: character.alignment || '',
      exaustion: character.exaustion || 0,
      currency: character.currency || { gp: 0, sp: 0, cp: 0 },
      level: normalizedLevel,
      hp: character.hp ?? 0, max_hp: character.max_hp ?? 0, vision: character.vision ?? 0,
      sav_str: character.sav_str||false, sav_str_mod: character.sav_str_mod||0,
      sav_dex: character.sav_dex||false, sav_dex_mod: character.sav_dex_mod||0,
      sav_int: character.sav_int||false, sav_int_mod: character.sav_int_mod||0,
      sav_wis: character.sav_wis||false, sav_wis_mod: character.sav_wis_mod||0,
      sav_cha: character.sav_cha||false, sav_cha_mod: character.sav_cha_mod||0,
      acrobatics: normSkill(character.acrobatics), acrobatics_mod: character.acrobatics_mod||0,
      animal_handling: normSkill(character.animal_handling), animal_handling_mod: character.animal_handling_mod||0,
      arcana: normSkill(character.arcana), arcana_mod: character.arcana_mod||0,
      athletics: normSkill(character.athletics), athletics_mod: character.athletics_mod||0,
      deception: normSkill(character.deception), deception_mod: character.deception_mod||0,
      history: normSkill(character.history), history_mod: character.history_mod||0,
      insight: normSkill(character.insight), insight_mod: character.insight_mod||0,
      intimidation: normSkill(character.intimidation), intimidation_mod: character.intimidation_mod||0,
      investigation: normSkill(character.investigation), investigation_mod: character.investigation_mod||0,
      medicine: normSkill(character.medicine), medicine_mod: character.medicine_mod||0,
      nature: normSkill(character.nature), nature_mod: character.nature_mod||0,
      perception: normSkill(character.perception), perception_mod: character.perception_mod||0,
      performance: normSkill(character.performance), performance_mod: character.performance_mod||0,
      persuasion: normSkill(character.persuasion), persuasion_mod: character.persuasion_mod||0,
      religion: normSkill(character.religion), religion_mod: character.religion_mod||0,
      sleight_of_hand: normSkill(character.sleight_of_hand), sleight_of_hand_mod: character.sleight_of_hand_mod||0,
      stealth: normSkill(character.stealth), stealth_mod: character.stealth_mod||0,
      survival: normSkill(character.survival), survival_mod: character.survival_mod||0,
    });
    setAttacks(character.attacks || []);
    setAbilities(character.abilities || []);
    setInventory(character.inventory || []);
    setSpells(character.spells || []);
    const mkUrl = p => p?.startsWith('/uploads') ? `${API}${p}` : p;
    setPreviewToken(character.token_image ? mkUrl(character.token_image) : null);
    setPreviewPortrait(character.portrait_image ? mkUrl(character.portrait_image) : null);
    setTokenImage(null); setPortraitImage(null); setError(null);
    skipNextAutoSaveRef.current = true;
    setAutosaveStatus('idle');
  }, [character, isOpen]);

  useEffect(() => {
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    if (!character || saving) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      const token = localStorage.getItem('vtt_token');
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object') data.append(key, JSON.stringify(formData[key]));
        else if (typeof formData[key] === 'boolean') data.append(key, formData[key] ? '1' : '0');
        else data.append(key, formData[key]);
      });
      setAutosaveStatus('saving');
      try {
        const response = await axios.post(`${API}/api/character/edit/${character.id}`, data, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        if (response.status === 200) {
          dirtyAfterAutoSaveRef.current = true;
          latestFormDataRef.current = formData;
          setAutosaveStatus('saved');
          if (autosaveClearRef.current) clearTimeout(autosaveClearRef.current);
          autosaveClearRef.current = setTimeout(() => setAutosaveStatus('idle'), 2000);
        } else {
          setAutosaveStatus('idle');
        }
      } catch (err) {
        console.error(err);
        setAutosaveStatus('idle');
      }
    }, 1500);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  useEffect(() => () => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    if (autosaveClearRef.current) clearTimeout(autosaveClearRef.current);
  }, []);

  const handleClose = () => {
    if (dirtyAfterAutoSaveRef.current && character && latestFormDataRef.current) {
      onCharacterUpdated({ ...character, ...latestFormDataRef.current });
      dirtyAfterAutoSaveRef.current = false;
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
      if (response.status === 200) { dirtyAfterAutoSaveRef.current = false; onCharacterUpdated({ ...character, ...formData }); onClose(); }
    } catch (err) {
      console.error(err); setError('Error al actualizar el personaje.');
    } finally { setSaving(false); }
  };

  const handleAttackRoll = (att) => {
    if (typeof onSendMessage !== 'function') return;
    const stats = formData.stats || {};
    const totalLevel = Array.isArray(formData.level)
      ? formData.level.reduce((s, l) => s + (parseInt(l?.level, 10) || 0), 0) || 1
      : 1;
    const prof = att.is_proficient ? profBonus(totalLevel) : 0;
    const atkBonus = parseInt(att.attack_bonus, 10) || 0;

    const atkAbility = att.attack_modifier && att.attack_modifier !== 'nada' ? att.attack_modifier : null;
    const atkAbilityMod = atkAbility ? abilityModFromStats(atkAbility, stats) : 0;
    const N = atkAbilityMod + atkBonus + prof;
    const atkRoll = rollDice('1d20');
    const isCriticalHit = atkRoll.crit === 'max';
    const attackTotal = atkRoll.total + N;

    const doubleDice = (notation) => {
      const m2 = String(notation || '').match(/^(\d+)d(\d+)$/i);
      return m2 ? `${Number(m2[1]) * 2}d${m2[2]}` : notation;
    };

    const dmgAbility = att.damage_modifier && att.damage_modifier !== 'nada' ? att.damage_modifier : null;
    const dmgAbilityMod = dmgAbility ? abilityModFromStats(dmgAbility, stats) : 0;
    const M = dmgAbilityMod + prof;
    const dmgDiceBase = Array.isArray(att.damage_dice) ? att.damage_dice[0] : att.damage_dice;
    const dmgDice = isCriticalHit ? doubleDice(dmgDiceBase) : dmgDiceBase;
    const dmgType = Array.isArray(att.damage_type) ? att.damage_type[0] : att.damage_type;
    const dmgRoll = dmgDice ? rollDice(dmgDice) : null;
    const dmgTotal = dmgRoll ? dmgRoll.total + M : null;
    const dmgRaw = dmgRoll?.total ?? null;

    let dmg2Total = null, dmg2Type = null, dmg2Crit = null, dmg2Raw = null, dmg2Mod = null;
    if (att.damage_dice_2) {
      const dmg2Ability = att.damage_modifier2 && att.damage_modifier2 !== 'nada' ? att.damage_modifier2 : null;
      const dmg2AbilityMod = dmg2Ability ? abilityModFromStats(dmg2Ability, stats) : 0;
      dmg2Mod = dmg2AbilityMod + prof;
      const dmg2DiceBase = isCriticalHit ? doubleDice(att.damage_dice_2) : att.damage_dice_2;
      const dmg2Roll = rollDice(dmg2DiceBase);
      dmg2Raw = dmg2Roll.total;
      dmg2Total = dmg2Raw + dmg2Mod;
      dmg2Crit = dmg2Roll.crit;
      dmg2Type = att.damage_type_2 || null;
    }

    onSendMessage(JSON.stringify({
      type: 'attack_roll',
      name: att.name,
      attack: attackTotal, attackRaw: atkRoll.total, attackMod: N,
      attackCrit: atkRoll.crit,
      damage: dmgTotal, dmgRaw, dmgMod: M,
      dmgCrit: dmgRoll?.crit ?? null,
      dmgType: dmgType || null,
      damage2: dmg2Total, dmg2Raw, dmg2Mod,
      dmg2Crit,
      dmgType2: dmg2Type,
    }));
  };

  const rollAbilityCheck = (statKey, label) => {
    if (typeof onSendMessage !== 'function') return;
    const score = Number(formData.stats?.[statKey] ?? 10);
    const m = Math.floor((score - 10) / 2);
    const d = rollDice('1d20').total;
    onSendMessage(JSON.stringify({
      type: 'dice_roll', expr: `${label}`,
      rolls: [d], mod: m, total: d + m,
    }));
  };

  const rollSkillCheck = (skill) => {
    if (typeof onSendMessage !== 'function') return;
    const statKey = SKILL_STAT[skill];
    const score = Number(formData.stats?.[statKey] ?? 10);
    const abilityMod = Math.floor((score - 10) / 2);
    const totalLvl = Array.isArray(formData.level)
      ? formData.level.reduce((s, l) => s + (parseInt(l?.level, 10) || 0), 0) || 1
      : 1;
    const pb = Math.ceil(totalLvl / 4) + 1;
    const prof = formData[skill];
    const profB = prof === 'proficiency' ? pb : prof === 'expertise' ? pb * 2 : 0;
    const extra = parseInt(formData[`${skill}_mod`], 10) || 0;
    const mTotal = abilityMod + profB + extra;
    const d = rollDice('1d20').total;
    onSendMessage(JSON.stringify({
      type: 'dice_roll', expr: `${SKILL_ES[skill]}`,
      rolls: [d], mod: mTotal, total: d + mTotal,
    }));
  };

  const rollSavingThrow = (sv) => {
    if (typeof onSendMessage !== 'function') return;
    const score = Number(formData.stats?.[sv.stat] ?? 10);
    const abilityMod = Math.floor((score - 10) / 2);
    const totalLvl = Array.isArray(formData.level)
      ? formData.level.reduce((s, l) => s + (parseInt(l?.level, 10) || 0), 0) || 1
      : 1;
    const profB = formData[sv.key] ? profBonus(totalLvl) : 0;
    const extra = parseInt(formData[`${sv.key}_mod`], 10) || 0;
    const mTotal = abilityMod + profB + extra;
    const d = rollDice('1d20').total;
    onSendMessage(JSON.stringify({
      type: 'dice_roll', expr: `Salvación de\n${sv.label}`,
      rolls: [d], mod: mTotal, total: d + mTotal,
    }));
  };

  const handleAddAttack = async () => {
    const token = localStorage.getItem('vtt_token');
    const blank = {
      name: 'New Attack',
      damage_dice: [], damage_type: [],
      damage_dice_2: null, damage_type_2: null,
      range: '', description: '',
      attack_modifier: null, attack_bonus: 0,
      damage_modifier: null, damage_modifier2: null,
      is_proficient: false, is_saving_throw: false,
      saving_throw_tipe: null, saving_throw_type_dc: null,
    };
    try {
      const res = await axios.post(`${API}/api/character/${character.id}/attack/create`, blank,
        { headers: { Authorization: `Bearer ${token}` } });
      setAttacks(p => [...p, { ...blank, id: res.data.id }]);
    } catch(err) { console.error(err); }
  };
  const handleDeleteAttack = async (id) => {
    const token = localStorage.getItem('vtt_token');
    try {
      await axios.delete(`${API}/api/character/${character.id}/attack/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAttacks(p => p.filter(a => a.id !== id));
    } catch(err) { console.error(err); }
  };
  const handleSaveAttack = async (id) => {
    const token = localStorage.getItem('vtt_token');
    const payload = {
      name: editAttack.name,
      damage_dice: editAttack.damage_dice ? [editAttack.damage_dice] : [],
      damage_type: editAttack.damage_type ? [editAttack.damage_type] : [],
      damage_dice_2: editAttack.damage_dice_2 || null,
      damage_type_2: editAttack.damage_type_2 || null,
      range: editAttack.range,
      description: editAttack.description,
      attack_modifier: editAttack.attack_modifier || null,
      attack_bonus: editAttack.attack_bonus === '' || editAttack.attack_bonus == null ? 0 : parseInt(editAttack.attack_bonus) || 0,
      is_proficient: !!editAttack.is_proficient,
      is_saving_throw: !!editAttack.is_saving_throw,
      saving_throw_tipe: editAttack.saving_throw_tipe || null,
      saving_throw_type_dc: editAttack.saving_throw_type_dc || null,
      damage_modifier: editAttack.damage_modifier || null,
      damage_modifier2: editAttack.damage_modifier2 || null,
    };
    try {
      await axios.patch(`${API}/api/character/${character.id}/attack/update/${id}`, payload,
        { headers: { Authorization: `Bearer ${token}` } });
      setAttacks(p => p.map(a => a.id === id
        ? { ...a, ...payload }
        : a));
      setEditingAttackId(null);
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
    const blank = { name: 'New Spell', level: 0, school: 'Evocación', casting_time: '', range: '', duration: '', description: '' };
    try {
      const res = await axios.post(`${API}/api/character/${character.id}/spell/create`, blank,
        { headers: { Authorization: `Bearer ${token}` } });
      setSpells(p => [...p, { ...blank, id: res.data.id }]);
    } catch(err) { console.error(err); }
  };
  const handleDeleteSpell = async (id) => {
    const token = localStorage.getItem('vtt_token');
    try {
      await axios.delete(`${API}/api/character/${character.id}/spell/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSpells(p => p.filter(s => s.id !== id));
    } catch(err) { console.error(err); }
  };
  const handleSaveSpell = async (id) => {
    const token = localStorage.getItem('vtt_token');
    try {
      await axios.patch(`${API}/api/character/${character.id}/spell/update/${id}`,
        editSpell,
        { headers: { Authorization: `Bearer ${token}` } });
      setSpells(p => p.map(s => s.id === id ? { ...s, ...editSpell } : s));
      setEditingSpellId(null);
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

  if (minimized) {
    return createPortal((
      <div
        style={{
          position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999,
          background: '#334155', border: '1px solid #475569', borderRadius: 8,
          color: '#e2e8f0', padding: '8px 14px',
          fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600,
          boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
          cursor: 'move', userSelect: 'none',
          display: 'flex', alignItems: 'center', gap: 10,
          minWidth: 160, maxWidth: 320,
        }}
        onMouseDown={handleDragStart}
        onDoubleClick={() => setMinimized(false)}
        title="Doble clic: restaurar"
      >
        <span style={{ color: '#94a3b8', fontSize: 14 }}>⚔</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formData.name || 'Sin nombre'}
        </span>
        <button
          type="button"
          onClick={handleClose}
          onMouseDown={e => e.stopPropagation()}
          onDoubleClick={e => e.stopPropagation()}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 4px' }}
        >✕</button>
      </div>
    ), document.body);
  }

  return createPortal((
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
            <h2 style={{ ...S.charName, cursor: 'pointer' }} onDoubleClick={e => { e.stopPropagation(); setMinimized(true); }} title="Doble clic: minimizar">{formData.name || 'Nuevo Personaje'}</h2>
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
          <button style={S.closeBtn} onClick={handleClose}
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
                    <p style={S.panelTitle}>Origen</p>
                    <div style={S.grid2}>
                      <div>
                        <label style={S.label}>Raza</label>
                        <input style={inp()} name="race" value={formData.race} onChange={handleInputChange} placeholder="Elfo, Humano…" />
                      </div>
                      <div>
                        <label style={S.label}>Subraza</label>
                        <input style={inp()} name="subrace" value={formData.subrace} onChange={handleInputChange} placeholder="Alto, Oscuro…" />
                      </div>
                    </div>
                    <div style={{ marginTop:12 }}>
                      <label style={S.label}>Alineamiento</label>
                      <input style={inp()} name="alignment" value={formData.alignment} onChange={handleInputChange} placeholder="Legal Bueno, Caótico Neutral…" />
                    </div>
                  </div>

                  <div style={S.panel}>
                    <p style={S.panelTitle}>Visión</p>
                    <div>
                      <label style={S.label}>Radio de visión (pies)</label>
                      <input style={inp({textAlign:'center'})} type="number" min="0" step="5" name="vision" value={formData.vision} onChange={handleInputChange} placeholder="0 = sin visión" />
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
                        <span
                          style={{ ...S.statName, cursor: typeof onSendMessage === 'function' ? 'pointer' : 'default', textDecoration: typeof onSendMessage === 'function' ? 'underline dotted' : 'none' }}
                          onClick={() => rollAbilityCheck(stat, STAT_LABELS[stat])}
                          title={typeof onSendMessage === 'function' ? 'Click para tirar al chat' : ''}
                        >{STAT_LABELS[stat]}</span>
                        <input type="number" value={formData.stats[stat]}
                          onChange={e=>handleStatChange(stat, e.target.value)}
                          style={S.statInput} />
                        <span style={S.modBadge}>{fmtMod(formData.stats[stat])}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
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

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {/* Saving Throws */}
                  <div style={S.panel}>
                    <p style={S.panelTitle}>Tiradas de Salvación</p>
                    {SAVE_KEYS.map(sv => (
                      <div key={sv.key} style={S.savRow}>
                        <input type="checkbox" name={sv.key} checked={formData[sv.key]} onChange={handleInputChange}
                          style={{ accentColor:'#6366f1', width:14, height:14, cursor:'pointer' }} />
                        <span
                          style={{ color:'#cbd5e1', fontSize:12, fontFamily:'sans-serif', flex:1, cursor: typeof onSendMessage === 'function' ? 'pointer' : 'default', textDecoration: typeof onSendMessage === 'function' ? 'underline dotted' : 'none' }}
                          onClick={() => rollSavingThrow(sv)}
                          title={typeof onSendMessage === 'function' ? 'Click para tirar al chat' : ''}
                        >{sv.label}</span>
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
                          const opts = ['','proficiency','expertise'];
                          set(skill, opts[(opts.indexOf(prof)+1)%3]);
                        };
                        const clickable = typeof onSendMessage === 'function';
                        return (
                          <div key={skill} style={S.skillRow}>
                            <div style={S.profDot(prof)} onClick={cycleProf} title={prof || 'ninguno'} />
                            <span
                              onClick={() => clickable && rollSkillCheck(skill)}
                              style={{
                                color:'#cbd5e1', fontSize:11, fontFamily:'sans-serif', flex:1,
                                cursor: clickable ? 'pointer' : 'default',
                                textDecoration: clickable ? 'underline dotted' : 'none',
                              }}
                              title={clickable ? 'Click para tirar al chat' : ''}
                            >
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
                      Clic en el punto para ciclar: ○ ninguno → ● competente → ◎ experto · clic en el nombre para tirar
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── COMBATE ── */}
            {activeTab==='combat' && (
              <div style={S.sectionGap}>
                {/* Attacks */}
                <div style={S.panel}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <p style={{ ...S.panelTitle, margin:0, borderBottom:'none', paddingBottom:0 }}>Ataques</p>
                    <button type="button" onClick={handleAddAttack} style={{ ...S.addBtn, padding:'3px 12px', fontSize:14 }}>+</button>
                  </div>
                  {attacks.length === 0
                    ? <p style={{ color:'#334155', fontSize:12, fontFamily:'sans-serif', textAlign:'center', padding:12 }}>Sin ataques registrados</p>
                    : attacks.map(att => (
                      <div key={att.id} style={S.listItem}>
                        {editingAttackId === att.id ? (
                          <div style={{ flex:1 }}>
                            <input style={{ ...smallInp, width:'100%', marginBottom:6 }} value={editAttack.name} onChange={e=>setEditAttack({...editAttack,name:e.target.value})} placeholder="Nombre" />

                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:6 }}>
                              <select style={smallInp} value={editAttack.attack_modifier ?? ''} onChange={e=>setEditAttack({...editAttack,attack_modifier:e.target.value})} title="Modificador de ataque">
                                {ABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <input style={smallInp} type="number" value={editAttack.attack_bonus ?? 0} onChange={e=>setEditAttack({...editAttack,attack_bonus:e.target.value})} placeholder="Bono" />
                              <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, color:'#94a3b8', fontSize:11, fontFamily:'sans-serif', cursor:'pointer', background:'#0f172a', border:'1px solid #334155', borderRadius:8, padding:'6px 8px' }}>
                                <input type="checkbox" checked={!!editAttack.is_proficient} onChange={e=>setEditAttack({...editAttack,is_proficient:e.target.checked})} style={{ accentColor:'#6366f1' }} />
                                Competente
                              </label>
                            </div>

                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, marginBottom:6 }}>
                              <input style={smallInp} value={editAttack.damage_dice ?? ''} onChange={e=>setEditAttack({...editAttack,damage_dice:e.target.value})} placeholder="Daño (1d8)" />
                              <input style={smallInp} value={editAttack.damage_type ?? ''} onChange={e=>setEditAttack({...editAttack,damage_type:e.target.value})} placeholder="Tipo" />
                              <select style={smallInp} value={editAttack.damage_modifier ?? ''} onChange={e=>setEditAttack({...editAttack,damage_modifier:e.target.value})} title="Modificador de daño">
                                {ABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <input style={smallInp} value={editAttack.range ?? ''} onChange={e=>setEditAttack({...editAttack,range:e.target.value})} placeholder="Alcance" />
                            </div>

                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:6 }}>
                              <input style={smallInp} value={editAttack.damage_dice_2 ?? ''} onChange={e=>setEditAttack({...editAttack,damage_dice_2:e.target.value})} placeholder="Daño 2 (1d6)" />
                              <input style={smallInp} value={editAttack.damage_type_2 ?? ''} onChange={e=>setEditAttack({...editAttack,damage_type_2:e.target.value})} placeholder="Tipo 2" />
                              <select style={smallInp} value={editAttack.damage_modifier2 ?? ''} onChange={e=>setEditAttack({...editAttack,damage_modifier2:e.target.value})} title="Modificador de daño 2">
                                {ABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </div>

                            <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr', gap:6, marginBottom:6, alignItems:'center' }}>
                              <label style={{ display:'flex', alignItems:'center', gap:6, color:'#94a3b8', fontSize:11, fontFamily:'sans-serif', cursor:'pointer', background:'#0f172a', border:'1px solid #334155', borderRadius:8, padding:'6px 10px' }}>
                                <input type="checkbox" checked={!!editAttack.is_saving_throw} onChange={e=>setEditAttack({...editAttack,is_saving_throw:e.target.checked})} style={{ accentColor:'#6366f1' }} />
                                Salvación
                              </label>
                              <select style={smallInp} value={editAttack.saving_throw_tipe ?? ''} onChange={e=>setEditAttack({...editAttack,saving_throw_tipe:e.target.value})} title="Tipo salvación">
                                {ABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              <select style={smallInp} value={editAttack.saving_throw_type_dc ?? ''} onChange={e=>setEditAttack({...editAttack,saving_throw_type_dc:e.target.value})} title="Atributo DC">
                                {ABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </div>

                            <textarea style={{ ...smallInp, width:'100%', marginTop:4, resize:'vertical', minHeight:50 }}
                              value={editAttack.description ?? ''} onChange={e=>setEditAttack({...editAttack,description:e.target.value})} placeholder="Descripción" />
                            <div style={{ display:'flex', gap:6, marginTop:6 }}>
                              <button type="button" onClick={()=>handleSaveAttack(att.id)} style={S.addBtn}>Guardar</button>
                              <button type="button" onClick={()=>setEditingAttackId(null)} style={S.delBtn}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ flex:1 }}>
                            <span
                              onClick={()=>handleAttackRoll(att)}
                              style={{ color:'#f1f5f9', fontWeight:700, fontSize:13, fontFamily:'sans-serif', cursor: typeof onSendMessage === 'function' ? 'pointer' : 'default', textDecoration: typeof onSendMessage === 'function' ? 'underline dotted' : 'none' }}
                              title={typeof onSendMessage === 'function' ? 'Click para tirar al chat' : ''}
                            >{att.name}</span>
                            <span style={{ color:'#64748b', fontSize:11, fontFamily:'sans-serif', marginLeft:10 }}>
                              {att.damage_dice?.[0]} {att.damage_type?.[0]} · {att.range}
                            </span>
                            {att.description && <p style={{ color:'#94a3b8', fontSize:11, fontFamily:'sans-serif', margin:'4px 0 0', lineHeight:1.5 }}>{att.description}</p>}
                          </div>
                        )}
                        {editingAttackId !== att.id && (
                          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                            <button type="button"
                              onClick={()=>{ setEditingAttackId(att.id); setEditAttack({ name:att.name, damage_dice:att.damage_dice?.[0]??'', damage_type:att.damage_type?.[0]??'', damage_dice_2:att.damage_dice_2??'', damage_type_2:att.damage_type_2??'', range:att.range??'', description:att.description??'', attack_modifier:att.attack_modifier??'', attack_bonus:att.attack_bonus??0, is_proficient:!!att.is_proficient, is_saving_throw:!!att.is_saving_throw, saving_throw_tipe:att.saving_throw_tipe??'', saving_throw_type_dc:att.saving_throw_type_dc??'', damage_modifier:att.damage_modifier??'', damage_modifier2:att.damage_modifier2??'' }); }}
                              style={S.delBtn} title="Editar"
                              onMouseEnter={e=>e.currentTarget.style.color='#a5b4fc'}
                              onMouseLeave={e=>e.currentTarget.style.color='#475569'}>⚙</button>
                            <button type="button" onClick={()=>handleDeleteAttack(att.id)} style={S.delBtn}
                              onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                              onMouseLeave={e=>e.currentTarget.style.color='#475569'}>✕</button>
                          </div>
                        )}
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
                  <p style={S.panelTitle}>Magia</p>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Habilidad Lanzadora</label>
                      <select style={inp()} name="spellcasting_abillity" value={formData.spellcasting_abillity || ''} onChange={handleInputChange}>
                        {ABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Nivel Lanzador</label>
                      <input style={inp({textAlign:'center'})} type="number" name="caster_level" value={formData.caster_level} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                <div style={S.panel}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <p style={{ ...S.panelTitle, margin:0, borderBottom:'none', paddingBottom:0 }}>Hechizos</p>
                    <button type="button" onClick={handleAddSpell} style={{ ...S.addBtn, padding:'3px 12px', fontSize:14 }}>+</button>
                  </div>
                </div>

                {Object.keys(spellsByLevel).sort((a,b)=>a-b).map(lvl => (
                  <div key={lvl} style={S.panel}>
                    <div style={S.spellLvlHeader}>
                      {parseInt(lvl)===0 ? 'Trucos (Nivel 0)' : `Nivel ${lvl}`}
                    </div>
                    {spellsByLevel[lvl].map(spell => (
                      <div key={spell.id} style={S.listItem}>
                        {editingSpellId === spell.id ? (
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                              <input style={{ ...smallInp, flex:2 }} value={editSpell.name} onChange={e=>setEditSpell({...editSpell,name:e.target.value})} placeholder="Nombre" />
                              <input style={{ ...smallInp, width:60, textAlign:'center' }} type="number" value={editSpell.level} onChange={e=>setEditSpell({...editSpell,level:parseInt(e.target.value)||0})} placeholder="Niv" />
                              <select style={{ ...S.select, fontSize:12, padding:'6px 8px' }} value={editSpell.school} onChange={e=>setEditSpell({...editSpell,school:e.target.value})}>
                                <option>Evocación</option><option>Abjuración</option><option>Conjuración</option><option>Adivinación</option><option>Encantamiento</option><option>Ilusión</option><option>Nigromancia</option><option>Transmutación</option>
                              </select>
                              <input style={{ ...smallInp, width:90 }} value={editSpell.casting_time} onChange={e=>setEditSpell({...editSpell,casting_time:e.target.value})} placeholder="Tiempo" />
                              <input style={{ ...smallInp, width:70 }} value={editSpell.range} onChange={e=>setEditSpell({...editSpell,range:e.target.value})} placeholder="Rango" />
                              <input style={{ ...smallInp, width:90 }} value={editSpell.duration} onChange={e=>setEditSpell({...editSpell,duration:e.target.value})} placeholder="Duración" />
                            </div>
                            <textarea style={{ ...smallInp, width:'100%', marginTop:4, resize:'vertical', minHeight:40 }}
                              value={editSpell.description} onChange={e=>setEditSpell({...editSpell,description:e.target.value})} placeholder="Descripción" />
                            <div style={{ display:'flex', gap:6, marginTop:4 }}>
                              <button type="button" onClick={()=>handleSaveSpell(spell.id)} style={S.addBtn}>Guardar</button>
                              <button type="button" onClick={()=>setEditingSpellId(null)} style={S.delBtn}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ flex:1 }}>
                            <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:13, fontFamily:'sans-serif' }}>{spell.name}</span>
                            <span style={{ color:'#8b5cf6', fontSize:11, fontFamily:'sans-serif', marginLeft:8 }}>{spell.school}</span>
                            <span style={{ color:'#475569', fontSize:11, fontFamily:'sans-serif', marginLeft:8 }}>
                              {spell.casting_time} · {spell.range} · {spell.duration}
                            </span>
                            {spell.description && <p style={{ color:'#94a3b8', fontSize:11, fontFamily:'sans-serif', margin:'4px 0 0', lineHeight:1.5 }}>{spell.description}</p>}
                          </div>
                        )}
                        {editingSpellId !== spell.id && (
                          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                            <button type="button"
                              onClick={()=>{ setEditingSpellId(spell.id); setEditSpell({ name:spell.name, level:spell.level, school:spell.school, casting_time:spell.casting_time, range:spell.range, duration:spell.duration, description:spell.description??'' }); }}
                              style={S.delBtn} title="Editar"
                              onMouseEnter={e=>e.currentTarget.style.color='#a5b4fc'}
                              onMouseLeave={e=>e.currentTarget.style.color='#475569'}>⚙</button>
                            <button type="button" onClick={()=>handleDeleteSpell(spell.id)} style={S.delBtn}
                              onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                              onMouseLeave={e=>e.currentTarget.style.color='#475569'}>✕</button>
                          </div>
                        )}
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
              <span style={{
                marginRight: 'auto', alignSelf: 'center',
                fontFamily: 'sans-serif', fontSize: 11, letterSpacing: '0.06em',
                color: autosaveStatus === 'saved' ? '#22c55e' : '#475569',
                transition: 'color 0.2s',
                minHeight: 14,
              }}>
                {autosaveStatus === 'saving' && 'guardando…'}
                {autosaveStatus === 'saved' && '✓ guardado'}
              </span>
              <button type="button" onClick={handleClose} style={S.cancelBtn} disabled={saving}>Cancelar</button>
              <button type="submit" style={S.saveBtn} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
  ), document.body);
}
