import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const API = 'http://localhost:8000';

const SIZES = ['Tiny','Small','Medium','Large','Huge','Gargantuan'];
const TYPES = ['Aberration','Beast','Celestial','Construct','Dragon','Elemental','Fey','Fiend','Giant','Humanoid','Monstrosity','Ooze','Plant','Undead'];
const SPEED_KINDS = ['walk','fly','swim','climb','burrow'];
const SPEED_ES = { walk:'Caminar', fly:'Volar', swim:'Nadar', climb:'Trepar', burrow:'Excavar' };

const STAT_KEYS = ['str','dex','con','int','wis','cha'];
const STAT_LABELS = { str:'FUE', dex:'DES', con:'CON', int:'INT', wis:'SAB', cha:'CAR' };
const STAT_LONG = { str:'Fuerza', dex:'Destreza', con:'Constitución', int:'Inteligencia', wis:'Sabiduría', cha:'Carisma' };

const SKILL_LIST = [
  'acrobatics','animal_handling','arcana','athletics','deception','history',
  'insight','intimidation','investigation','medicine','nature','perception',
  'performance','persuasion','religion','sleight_of_hand','stealth','survival',
];
const SKILL_ES = {
  acrobatics:'Acrobacias', animal_handling:'Trato Animales', arcana:'Arcano',
  athletics:'Atletismo', deception:'Engaño', history:'Historia',
  insight:'Perspicacia', intimidation:'Intimidación', investigation:'Investigación',
  medicine:'Medicina', nature:'Naturaleza', perception:'Percepción',
  performance:'Actuación', persuasion:'Persuasión', religion:'Religión',
  sleight_of_hand:'Juego de Manos', stealth:'Sigilo', survival:'Supervivencia',
};
const SKILL_STAT = {
  acrobatics:'dex', animal_handling:'wis', arcana:'int', athletics:'str',
  deception:'cha', history:'int', insight:'wis', intimidation:'cha',
  investigation:'int', medicine:'wis', nature:'int', perception:'wis',
  performance:'cha', persuasion:'cha', religion:'int',
  sleight_of_hand:'dex', stealth:'dex', survival:'wis',
};

const ACCENT = '#22c55e';
const ACCENT_SOFT = 'rgba(34,197,94,0.18)';
const ACCENT_BORDER = 'rgba(34,197,94,0.45)';
const ACCENT_LIGHT = '#86efac';

const S = {
  modal: {
    background: 'linear-gradient(160deg,#0d1f10 0%,#111a10 100%)',
    border: '1px solid #1a3a1f',
    borderRadius: 16,
    width: '100%', maxWidth: 1020,
    boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px #1a3a1f inset',
    fontFamily: "'Cinzel','Georgia',serif",
    position: 'relative',
    overflow: 'hidden',
  },
  topAccent: {
    height: 3,
    background: 'linear-gradient(90deg,#16a34a,#22c55e,#16a34a)',
    width: '100%',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 20,
    padding: '24px 28px 20px',
    borderBottom: '1px solid #1a3a1f',
    background: 'rgba(255,255,255,0.02)',
  },
  portraitRing: {
    width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
    background: '#0f1f12',
    border: `2px solid ${ACCENT}`,
    overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 18px rgba(34,197,94,0.35)',
    cursor: 'pointer',
    position: 'relative',
  },
  portraitImg: { width: '100%', height: '100%', objectFit: 'cover' },
  portraitPlaceholder: { color: '#1e3a22', fontSize: 28, fontFamily: 'sans-serif', userSelect: 'none' },
  headerInfo: { flex: 1 },
  charName: {
    color: '#ecfdf5', fontSize: 22, fontWeight: 700,
    letterSpacing: '0.04em', lineHeight: 1.2, margin: 0,
    fontFamily: "'Cinzel','Georgia',serif",
  },
  classBadges: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: {
    background: ACCENT_SOFT, border: `1px solid ${ACCENT_BORDER}`,
    color: ACCENT_LIGHT, borderRadius: 20, padding: '2px 10px',
    fontSize: 11, fontFamily: 'sans-serif', fontWeight: 600, letterSpacing: '0.06em',
  },
  levelBadge: {
    background: 'rgba(132,204,22,0.2)', border: '1px solid rgba(132,204,22,0.5)',
    color: '#bef264', borderRadius: 20, padding: '2px 10px',
    fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, letterSpacing: '0.06em',
  },
  hpRow: { display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' },
  togGroup: {
    display: 'flex', gap: 0, background: '#0d1f10', border: '1px solid #1e3a22',
    borderRadius: 20, padding: 2, overflow: 'hidden',
  },
  togBtn: (active, accent) => ({
    background: active ? accent : 'transparent',
    color: active ? '#0d1f10' : '#86827a',
    border: 'none', borderRadius: 18,
    padding: '3px 10px', fontSize: 10, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'sans-serif',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    transition: 'all 0.15s',
  }),
  hpPill: {
    background: '#0d1f10', border: '1px solid #22c55e', borderRadius: 20,
    padding: '2px 12px', display: 'flex', alignItems: 'center', gap: 6,
  },
  hpLabel: { color: '#22c55e', fontSize: 10, fontFamily: 'sans-serif', fontWeight: 700 },
  hpVal: { color: '#86efac', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 },
  closeBtn: {
    background: 'transparent', border: '1px solid #1e3a22', borderRadius: 8,
    color: '#6b7d6b', cursor: 'pointer', padding: '6px 10px', fontSize: 18,
    lineHeight: 1, transition: 'all 0.15s', marginLeft: 'auto', alignSelf: 'flex-start',
    fontFamily: 'sans-serif',
  },
  tabs: {
    display: 'flex', gap: 4, padding: '14px 28px 0',
    background: 'rgba(0,0,0,0.15)',
    borderBottom: '1px solid #1a3a1f',
    overflowX: 'auto',
  },
  tab: (active) => ({
    background: active ? ACCENT_SOFT : 'transparent',
    border: active ? `1px solid ${ACCENT_BORDER}` : '1px solid transparent',
    color: active ? ACCENT_LIGHT : '#4a5d4a',
    borderRadius: '8px 8px 0 0',
    padding: '8px 18px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'sans-serif', letterSpacing: '0.07em', textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }),
  body: { padding: '24px 28px 28px', minHeight: 420 },
  label: {
    display: 'block', color: '#86827a', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
    fontFamily: 'sans-serif',
  },
  input: {
    width: '100%', background: '#0d1f10', border: '1px solid #1e3a22',
    borderRadius: 8, color: '#ecfdf5', padding: '8px 12px',
    fontSize: 13, outline: 'none', fontFamily: 'sans-serif',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%', background: '#0d1f10', border: '1px solid #1e3a22',
    borderRadius: 8, color: '#ecfdf5', padding: '10px 12px',
    fontSize: 13, outline: 'none', fontFamily: 'sans-serif',
    boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6,
  },
  select: {
    background: '#0d1f10', border: '1px solid #1e3a22',
    borderRadius: 8, color: '#ecfdf5', padding: '8px 10px',
    fontSize: 12, outline: 'none', fontFamily: 'sans-serif',
    cursor: 'pointer',
  },
  panel: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid #1a3a1f',
    borderRadius: 10, padding: 16,
  },
  panelTitle: {
    color: ACCENT, fontSize: 10, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    margin: '0 0 12px', fontFamily: 'sans-serif',
    borderBottom: '1px solid #1a3a1f', paddingBottom: 8,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 },
  statBox: {
    background: 'linear-gradient(160deg,#162b1a,#0d1f10)',
    border: '1px solid #1e3a22', borderRadius: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '14px 10px 10px', gap: 2, position: 'relative',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  statName: {
    color: ACCENT, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
    textTransform: 'uppercase', fontFamily: 'sans-serif',
  },
  statInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#ecfdf5', fontSize: 28, fontWeight: 700,
    textAlign: 'center', width: '100%', fontFamily: "'Cinzel','Georgia',serif",
    MozAppearance: 'textfield',
  },
  modBadge: {
    background: '#0d1f10', border: '1px solid #1e3a22',
    borderRadius: 20, padding: '1px 10px',
    color: ACCENT_LIGHT, fontSize: 12, fontWeight: 700,
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
  listItem: {
    background: '#0d1f10', border: '1px solid #1a3a1f', borderRadius: 8,
    padding: '10px 12px', marginBottom: 8,
  },
  delBtn: {
    background: 'transparent', border: 'none', color: '#4a5d4a',
    cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1,
    fontFamily: 'sans-serif', transition: 'color 0.15s',
  },
  addBtn: {
    background: ACCENT_SOFT, border: `1px solid ${ACCENT_BORDER}`,
    color: ACCENT_LIGHT, borderRadius: 8, padding: '7px 16px',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'sans-serif', letterSpacing: '0.04em', transition: 'all 0.15s',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    marginTop: 28, paddingTop: 20, borderTop: '1px solid #1a3a1f',
  },
  cancelBtn: {
    background: 'transparent', border: '1px solid #1e3a22',
    color: '#86827a', borderRadius: 8, padding: '9px 22px',
    fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif',
  },
  saveBtn: {
    background: 'linear-gradient(135deg,#16a34a,#22c55e)',
    border: 'none', color: '#0d1f10', borderRadius: 8,
    padding: '9px 28px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'sans-serif',
    boxShadow: '0 0 20px rgba(34,197,94,0.4)',
    letterSpacing: '0.04em',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)',
    color: '#fca5a5', borderRadius: 8, padding: '10px 14px',
    fontSize: 12, fontFamily: 'sans-serif', marginBottom: 16,
  },
  sectionGap: { display: 'flex', flexDirection: 'column', gap: 16 },
  imgBox: {
    background: '#0d1f10', border: '1px dashed #1e3a22',
    borderRadius: 10, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

const mod = (score) => Math.floor((score - 10) / 2);
const fmtMod = (score) => { const m = mod(score); return (m >= 0 ? '+' : '') + m; };
const fmtSigned = (n) => (n >= 0 ? `+${n}` : `${n}`);

const rollD20 = () => Math.floor(Math.random() * 20) + 1;

const rollDice = (notation) => {
  const m = String(notation || '').match(/^(\d+)d(\d+)$/i);
  if (!m) return { total: 0, crit: null };
  const count = Number(m[1]), sides = Number(m[2]);
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  const crit = total === count ? 'min' : total === count * sides ? 'max' : null;
  return { total, crit };
};

const modeLabelEs = (m) => m === 'advantage' ? 'Ventaja' : m === 'disadvantage' ? 'Desventaja' : null;

const rollD20Mode = (mode) => {
  const a = rollD20();
  if (mode === 'normal') return { kept: a, discarded: null, keptCrit: a === 1 ? 'min' : a === 20 ? 'max' : null };
  const b = rollD20();
  const useFirst = mode === 'advantage' ? a >= b : a <= b;
  const kept = useFirst ? a : b;
  const discarded = useFirst ? b : a;
  return { kept, discarded, keptCrit: kept === 1 ? 'min' : kept === 20 ? 'max' : null };
};

 
const rollDmgMode = (dice, mode) => {
  if (!dice) return null;
  const a = rollDice(dice);
  if (mode === 'normal') return { kept: a.total, discarded: null, keptCrit: a.crit };
  const b = rollDice(dice);
  const useFirst = mode === 'advantage' ? a.total >= b.total : a.total <= b.total;
  const kept = useFirst ? a : b;
  const disc = useFirst ? b : a;
  return { kept: kept.total, discarded: disc.total, keptCrit: kept.crit };
};

const monsterProfBonus = (cr) => Math.max(2, Math.floor(((Number(cr) || 0) - 1) / 4) + 2);

const blankFormData = () => ({
  name: '',
  type: '',
  size: '',
  alignment: '',
  armor_class: 10,
  ac_description: '',
  hp_formula: '',
  hp: 0,
  max_hp: 0,
  vision: 0,
  speed: { walk: 30, fly: 0, swim: 0, climb: 0, burrow: 0 },
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
  treasure: [],
});

export default function EditMonsterModal({ isOpen, onClose, monster, onMonsterUpdated, onSendMessage, onSendMessageGm }) {
  const [formData, setFormData] = useState(blankFormData());

  const [previewToken, setPreviewToken]     = useState(null);
  const [previewPortrait, setPreviewPortrait] = useState(null);
  const [uploadingToken, setUploadingToken] = useState(false);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [error, setError]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const [pos, setPos]   = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 1020, h: 700 });
  const [minimized, setMinimized] = useState(false);
  const modalRef = useRef(null);

  const [rollMode, setRollMode] = useState('normal');
  const [sendMode, setSendMode] = useState('all');
  const [zoom, setZoom] = useState(1.0);

  const [spells, setSpells] = useState([]);
  const [editingSpellId, setEditingSpellId] = useState(null);
  const [editSpell, setEditSpell] = useState({});
  const [editingActionKey, setEditingActionKey] = useState(null);

  const ZOOM_MIN = 0.7, ZOOM_MAX = 1.5, ZOOM_STEP = 0.1;
  const adjustZoom = (delta) => setZoom(z => {
    const next = Math.round((z + delta) * 10) / 10;
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
  });

  const dispatchMessage = (content) => {
    if (sendMode === 'gm' && typeof onSendMessageGm === 'function') {
      onSendMessageGm(content);
      return;
    }
    if (typeof onSendMessage === 'function') onSendMessage(content);
  };
  const canSend = () => (sendMode === 'gm' ? typeof onSendMessageGm === 'function' : typeof onSendMessage === 'function');

  useEffect(() => {
    if (!isOpen) return;
    const setLayout = () => {
      const mobile = window.innerWidth < 768;
      if (mobile) {
        setSize({ w: window.innerWidth, h: window.innerHeight });
        setPos({ x: 0, y: 0 });
        return;
      }
      const initW = Math.min(1020, Math.round(window.innerWidth * 0.9));
      const initH = Math.min(700, Math.round(window.innerHeight * 0.85));
      setSize({ w: initW, h: initH });
      setPos({
        x: Math.round((window.innerWidth - initW) / 2),
        y: Math.round((window.innerHeight - initH) / 2),
      });
    };
    setLayout();
    window.addEventListener('resize', setLayout);
    return () => window.removeEventListener('resize', setLayout);
  }, [isOpen]);

  useEffect(() => {
    if (!monster) return;
    const mkUrl = p => p?.startsWith('/uploads') ? `${API}${p}` : p;
    const speed = { walk: 0, fly: 0, swim: 0, climb: 0, burrow: 0, ...(monster.speed || {}) };
    setFormData({
      name: monster.name || '',
      type: monster.type || '',
      size: monster.size || '',
      alignment: monster.alignment || '',
      armor_class: monster.armor_class ?? monster.ac ?? 10,
      ac_description: monster.ac_description || '',
      hp_formula: monster.hp_formula || '',
      hp: monster.hp ?? 0,
      max_hp: monster.max_hp ?? 0,
      vision: monster.vision ?? 0,
      speed,
      str: monster.str ?? 10,
      dex: monster.dex ?? 10,
      con: monster.con ?? 10,
      int: monster.int ?? monster.int_stat ?? 10,
      wis: monster.wis ?? 10,
      cha: monster.cha ?? 10,
      saving_throws: monster.saving_throws || {},
      skills: monster.skills || {},
      passive_perception: monster.passive_perception ?? 10,
      challenge_rating: monster.challenge_rating ?? monster.cr ?? 0,
      senses: monster.senses || '',
      languages: monster.languages || '',
      traits: Array.isArray(monster.traits) ? monster.traits : [],
      actions: Array.isArray(monster.actions) ? monster.actions : [],
      bonus_actions: Array.isArray(monster.bonus_actions) ? monster.bonus_actions : [],
      reactions: Array.isArray(monster.reactions) ? monster.reactions : [],
      legendary_resistances_count: monster.legendary_resistances_count ?? 0,
      legendary_actions_count: monster.legendary_actions_count ?? 0,
      legendary_actions: Array.isArray(monster.legendary_actions) ? monster.legendary_actions : [],
      mythic_actions: Array.isArray(monster.mythic_actions) ? monster.mythic_actions : [],
      lair_actions: Array.isArray(monster.lair_actions) ? monster.lair_actions : [],
      regional_effects: Array.isArray(monster.regional_effects) ? monster.regional_effects : [],
      treasure: Array.isArray(monster.treasure) ? monster.treasure : [],
    });
    setSpells(Array.isArray(monster.spells) ? monster.spells : []);
    setEditingSpellId(null);
    setEditSpell({});
    setPreviewToken(monster.image_url ? mkUrl(monster.image_url) : null);
    setPreviewPortrait(monster.portrait_url ? mkUrl(monster.portrait_url) : null);
    setError(null);
  }, [monster, isOpen]);

  useEffect(() => {
    if (!isOpen) { setRollMode('normal'); setSendMode('all'); setZoom(1.0); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !monster) return null;

  const set = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') return set(name, checked);
    if (type === 'number') return set(name, value === '' ? 0 : parseInt(value, 10) || 0);
    set(name, value);
  };

  const handleSpeedChange = (kind, value) => {
    setFormData(p => ({
      ...p,
      speed: { ...(p.speed || {}), [kind]: parseInt(value, 10) || 0 },
    }));
  };

  const handleStatChange = (key, value) => {
    set(key, parseInt(value, 10) || 0);
  };

  const toggleSavingThrow = (statKey) => {
    setFormData(p => {
      const sv = { ...(p.saving_throws || {}) };
      if (Object.prototype.hasOwnProperty.call(sv, statKey)) delete sv[statKey];
      else sv[statKey] = 0;
      return { ...p, saving_throws: sv };
    });
  };
  const setSavingThrowBonus = (statKey, val) => {
    setFormData(p => ({
      ...p,
      saving_throws: { ...(p.saving_throws || {}), [statKey]: parseInt(val, 10) || 0 },
    }));
  };

  const toggleSkill = (skill) => {
    setFormData(p => {
      const sk = { ...(p.skills || {}) };
      if (Object.prototype.hasOwnProperty.call(sk, skill)) delete sk[skill];
      else sk[skill] = 0;
      return { ...p, skills: sk };
    });
  };
  const setSkillBonus = (skill, val) => {
    setFormData(p => ({
      ...p,
      skills: { ...(p.skills || {}), [skill]: parseInt(val, 10) || 0 },
    }));
  };

  const updateNamedItem = (field, idx, prop, val) => {
    setFormData(p => {
      const arr = [...(p[field] || [])];
      arr[idx] = { ...arr[idx], [prop]: val };
      return { ...p, [field]: arr };
    });
  };
  const addNamedItem = (field) => {
    setFormData(p => ({ ...p, [field]: [...(p[field] || []), { name: '', description: '' }] }));
  };
  const removeNamedItem = (field, idx) => {
    setFormData(p => ({ ...p, [field]: (p[field] || []).filter((_, i) => i !== idx) }));
  };

  const updateStringItem = (field, idx, val) => {
    setFormData(p => {
      const arr = [...(p[field] || [])];
      arr[idx] = val;
      return { ...p, [field]: arr };
    });
  };
  const addStringItem = (field) => {
    setFormData(p => ({ ...p, [field]: [...(p[field] || []), ''] }));
  };
  const removeStringItem = (field, idx) => {
    setFormData(p => ({ ...p, [field]: (p[field] || []).filter((_, i) => i !== idx) }));
  };

  const handleImageUpload = async (type, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === 'token') { setPreviewToken(previewUrl); setUploadingToken(true); }
    else { setPreviewPortrait(previewUrl); setUploadingPortrait(true); }
    const token = localStorage.getItem('vtt_token');
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await axios.post(`${API}/api/monster/${monster.id}/upload-${type}`, fd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mkUrl = p => p?.startsWith('/uploads') ? `${API}${p}` : p;
      if (res.data.image_url) setPreviewToken(mkUrl(res.data.image_url));
      if (res.data.portrait_url) setPreviewPortrait(mkUrl(res.data.portrait_url));
      onMonsterUpdated?.({
        ...monster,
        image_url: res.data.image_url ?? monster.image_url,
        portrait_url: res.data.portrait_url ?? monster.portrait_url,
      });
    } catch {
      setError('Error al subir la imagen.');
    } finally {
      if (type === 'token') setUploadingToken(false); else setUploadingPortrait(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { ...formData };
    const token = localStorage.getItem('vtt_token');
    try {
      const response = await axios.post(`${API}/api/monster/edit/${monster.id}`, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.status === 200) {
        onMonsterUpdated?.({
          ...monster,
          ...payload,
          ac: payload.armor_class,
          cr: payload.challenge_rating,
        });
        onClose();
      }
    } catch {
      setError('Error al actualizar el monstruo.');
    } finally {
      setSaving(false);
    }
  };

  const rollAbilityCheck = (statKey) => {
    if (!canSend()) return;
    const score = Number(formData[statKey] ?? 10);
    const m = mod(score);
    const d = rollD20Mode(rollMode);
    const lbl = modeLabelEs(rollMode);
    const expr = `${STAT_LONG[statKey]} chequeo` + (lbl ? ` [${lbl}]` : '');
    dispatchMessage(JSON.stringify({
      type: 'dice_roll', expr,
      rolls: [d.kept], mod: m, total: d.kept + m,
      discarded: d.discarded != null ? d.discarded + m : null,
      keptCrit: d.keptCrit ?? null,
    }));
  };

  const rollSavingThrow = (statKey) => {
    if (!canSend()) return;
    const score = Number(formData[statKey] ?? 10);
    const abilityMod = mod(score);
    const sv = formData.saving_throws || {};
    const hasSave = Object.prototype.hasOwnProperty.call(sv, statKey);
    const profB = hasSave ? monsterProfBonus(formData.challenge_rating) : 0;
    const extra = hasSave ? (parseInt(sv[statKey], 10) || 0) : 0;
    const m = abilityMod + profB + extra;
    const d = rollD20Mode(rollMode);
    const lbl = modeLabelEs(rollMode);
    const expr = `Salvación de ${STAT_LONG[statKey]}` + (lbl ? ` [${lbl}]` : '');
    dispatchMessage(JSON.stringify({
      type: 'dice_roll', expr,
      rolls: [d.kept], mod: m, total: d.kept + m,
      discarded: d.discarded != null ? d.discarded + m : null,
      keptCrit: d.keptCrit ?? null,
    }));
  };

  const rollSkillCheck = (skill) => {
    if (!canSend()) return;
    const statKey = SKILL_STAT[skill];
    const score = Number(formData[statKey] ?? 10);
    const abilityMod = mod(score);
    const sk = formData.skills || {};
    const hasSkill = Object.prototype.hasOwnProperty.call(sk, skill);
    const override = hasSkill ? parseInt(sk[skill], 10) : NaN;
    let mTotal;
    if (!Number.isNaN(override) && override !== 0) {
      mTotal = override;
    } else {
      const profB = hasSkill ? monsterProfBonus(formData.challenge_rating) : 0;
      mTotal = abilityMod + profB;
    }
    const d = rollD20Mode(rollMode);
    const lbl = modeLabelEs(rollMode);
    const expr = SKILL_ES[skill] + (lbl ? ` [${lbl}]` : '');
    dispatchMessage(JSON.stringify({
      type: 'dice_roll', expr,
      rolls: [d.kept], mod: mTotal, total: d.kept + mTotal,
      discarded: d.discarded != null ? d.discarded + mTotal : null,
      keptCrit: d.keptCrit ?? null,
    }));
  };

  const handleMonsterAttackRoll = (it) => {
    if (!canSend()) return;
    const atk = { ...DEFAULT_ATTACK, ...(it?.attack || {}) };
    const doAttackRoll = atk.is_attack_roll !== false;
    const atkBonus = parseInt(atk.attack_bonus, 10) || 0;
    const atkAbil = atk.attack_ability && atk.attack_ability !== 'nada' ? atk.attack_ability : null;
    const atkAbilMod = atkAbil ? mod(Number(formData[atkAbil] ?? 10)) : 0;
    const N = atkAbilMod + atkBonus;
    const atkD = doAttackRoll ? rollD20Mode(rollMode) : null;
    const isCrit = atkD?.keptCrit === 'max';
    const attackTotal = atkD ? atkD.kept + N : null;

    const doubleDice = (notation) => {
      const m2 = String(notation || '').match(/^(\d+)d(\d+)$/i);
      return m2 ? `${Number(m2[1]) * 2}d${m2[2]}` : notation;
    };

    const dmgAbil = atk.damage_ability && atk.damage_ability !== 'nada' ? atk.damage_ability : null;
    const dmgAbilMod = dmgAbil ? mod(Number(formData[dmgAbil] ?? 10)) : 0;
    const M = dmgAbilMod;
    const dmgBase = atk.damage_dice;
    const dmgDice = dmgBase ? (isCrit ? doubleDice(dmgBase) : dmgBase) : null;
    const dmgD = dmgDice ? rollDmgMode(dmgDice, 'normal') : null;
    const dmgTotal = dmgD ? dmgD.kept + M : null;

    let dmg2Total = null, dmg2Type = null, dmg2Mod = null, dmg2D = null;
    if (atk.damage_dice_2) {
      const d2Abil = atk.damage_ability_2 && atk.damage_ability_2 !== 'nada' ? atk.damage_ability_2 : null;
      const d2AbilMod = d2Abil ? mod(Number(formData[d2Abil] ?? 10)) : 0;
      dmg2Mod = d2AbilMod;
      const d2Base = isCrit ? doubleDice(atk.damage_dice_2) : atk.damage_dice_2;
      dmg2D = rollDmgMode(d2Base, 'normal');
      dmg2Total = dmg2D.kept + dmg2Mod;
      dmg2Type = atk.damage_type_2 || null;
    }

    const isSave = !!atk.is_saving_throw;
    const saveDc = isSave
      ? (atk.dc_mode === 'stat'
          ? 10 + mod(Number(formData[atk.dc_ability] ?? 10))
          : (parseInt(atk.dc_custom, 10) || 0))
      : null;
    const saveAbility = isSave ? (STAT_LONG[atk.save_target_ability] || null) : null;

    const modeLabel = rollMode !== 'normal' ? modeLabelEs(rollMode) : null;
    const finalName = modeLabel ? `${it?.name || 'Ataque'} [${modeLabel}]` : (it?.name || 'Ataque');

    dispatchMessage(JSON.stringify({
      type: 'attack_roll',
      name: finalName,
      attack: attackTotal,
      attackRaw: atkD?.kept ?? null,
      attackMod: doAttackRoll ? N : null,
      attackCrit: atkD?.keptCrit ?? null,
      attackDiscarded: atkD && atkD.discarded != null ? atkD.discarded + N : null,
      damage: dmgTotal, dmgRaw: dmgD?.kept ?? null, dmgMod: M,
      dmgCrit: dmgD?.keptCrit ?? null,
      dmgDiscarded: null,
      dmgType: atk.damage_type || null,
      damage2: dmg2Total, dmg2Raw: dmg2D?.kept ?? null, dmg2Mod,
      dmg2Crit: dmg2D?.keptCrit ?? null,
      dmg2Discarded: null,
      dmgType2: dmg2Type || null,
      saveDc, saveAbility,
    }));
  };

  const handleAddSpell = async (level = 0) => {
    const token = localStorage.getItem('vtt_token');
    const blank = { name: 'Nuevo Hechizo', level, school: 'Evocación', casting_time: '', range: '', duration: '', description: '' };
    try {
      const res = await axios.post(`${API}/api/monster/${monster.id}/spell/create`, blank,
        { headers: { Authorization: `Bearer ${token}` } });
      setSpells(p => [...p, { ...blank, id: res.data.id }]);
    } catch { /* ignore */ }
  };

  const handleDeleteSpell = async (id) => {
    const token = localStorage.getItem('vtt_token');
    try {
      await axios.delete(`${API}/api/monster/${monster.id}/spell/delete/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setSpells(p => p.filter(s => s.id !== id));
    } catch { /* ignore */ }
  };

  const handleSaveSpell = async (id) => {
    const token = localStorage.getItem('vtt_token');
    try {
      await axios.patch(`${API}/api/monster/${monster.id}/spell/update/${id}`,
        editSpell,
        { headers: { Authorization: `Bearer ${token}` } });
      setSpells(p => p.map(s => s.id === id ? { ...s, ...editSpell } : s));
      setEditingSpellId(null);
    } catch { /* ignore */ }
  };

  const TABS = [
    { id: 'info',     label: 'General' },
    { id: 'stats',    label: 'Estadísticas' },
    { id: 'combate',  label: 'Combate' },
    { id: 'hechizos', label: 'Hechizos' },
  ];

  const sectionHeader = {
    color: '#86efac', fontSize: 13, fontWeight: 700,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    borderBottom: '1px solid rgba(34,197,94,0.45)',
    paddingBottom: 6, margin: '18px 0 4px 0',
    fontFamily: 'sans-serif',
  };

  const inp = (overrides = {}) => ({ ...S.input, ...overrides });
  const smallInp = { ...S.input, padding: '6px 8px', fontSize: 12 };

  const handleDragStart = (e) => {
    if (window.innerWidth < 768) return;
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
    if (window.innerWidth < 768) return;
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
    if (dir === 'e')  return { ...b, cursor: 'e-resize',  right: 0,  top: C,   bottom: C, width: E };
    if (dir === 'w')  return { ...b, cursor: 'w-resize',  left: 0,   top: C,   bottom: C, width: E };
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
          background: '#162b1a', border: '1px solid #1e3a22', borderRadius: 8,
          color: '#d1fae5', padding: '8px 14px',
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
        <span style={{ color: '#86efac', fontSize: 14 }}>🐉</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formData.name || 'Sin nombre'}
        </span>
        <button
          type="button"
          onClick={onClose}
          onMouseDown={e => e.stopPropagation()}
          onDoubleClick={e => e.stopPropagation()}
          style={{ background: 'transparent', border: 'none', color: '#86827a', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 4px' }}
        >✕</button>
      </div>
    ), document.body);
  }

  const renderNamedArrayEditor = (field, titleEs) => {
    const arr = formData[field] || [];
    return (
      <div style={S.panel}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
          <p style={{ ...S.panelTitle, margin: 0, borderBottom: 'none', paddingBottom: 0 }}>{titleEs}</p>
          <button type="button" onClick={() => addNamedItem(field)} style={{ ...S.addBtn, padding: '4px 12px', fontSize: 12 }}>+ Añadir</button>
        </div>
        {arr.length === 0 ? (
          <p style={{ color: '#3a4a3a', fontSize: 12, fontFamily: 'sans-serif', textAlign: 'center', padding: 12, margin: 0 }}>Sin entradas</p>
        ) : arr.map((it, i) => (
          <div key={i} style={S.listItem}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input
                style={{ ...smallInp, flex: 1, fontWeight: 700 }}
                value={it.name || ''}
                onChange={e => updateNamedItem(field, i, 'name', e.target.value)}
                placeholder="Nombre"
              />
              <button type="button" onClick={() => removeNamedItem(field, i)} style={S.delBtn}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#4a5d4a'}>✕</button>
            </div>
            <textarea
              style={{ ...S.textarea, fontSize: 12, minHeight: 60 }}
              value={it.description || ''}
              onChange={e => updateNamedItem(field, i, 'description', e.target.value)}
              placeholder="Descripción"
              rows={3}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderStringArrayEditor = (field, titleEs, placeholder = '') => {
    const arr = formData[field] || [];
    return (
      <div style={S.panel}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
          <p style={{ ...S.panelTitle, margin: 0, borderBottom: 'none', paddingBottom: 0 }}>{titleEs}</p>
          <button type="button" onClick={() => addStringItem(field)} style={{ ...S.addBtn, padding: '4px 12px', fontSize: 12 }}>+ Añadir</button>
        </div>
        {arr.length === 0 ? (
          <p style={{ color: '#3a4a3a', fontSize: 12, fontFamily: 'sans-serif', textAlign: 'center', padding: 12, margin: 0 }}>Sin entradas</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {arr.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={{ ...smallInp, flex: 1 }}
                  value={typeof v === 'string' ? v : JSON.stringify(v)}
                  onChange={e => updateStringItem(field, i, e.target.value)}
                  placeholder={placeholder}
                />
                <button type="button" onClick={() => removeStringItem(field, i)} style={S.delBtn}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a5d4a'}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const DEFAULT_ATTACK = {
    attack_ability: '', attack_bonus: 0,
    damage_dice: '', damage_type: '', damage_ability: '',
    damage_dice_2: '', damage_type_2: '', damage_ability_2: '',
    is_attack_roll: true,
    is_saving_throw: false,
    save_target_ability: 'dex',
    dc_mode: 'stat', dc_ability: 'wis', dc_custom: 13,
    save_effect: '',
  };

  const updateAttackField = (field, idx, key, val) => {
    setFormData(p => {
      const arr = [...(p[field] || [])];
      const cur = arr[idx] || {};
      const atk = { ...DEFAULT_ATTACK, ...(cur.attack || {}), [key]: val };
      arr[idx] = { ...cur, attack: atk };
      return { ...p, [field]: arr };
    });
  };

  const toggleIsAttack = (field, idx) => {
    setFormData(p => {
      const arr = [...(p[field] || [])];
      const cur = arr[idx] || {};
      const next = !cur.is_attack;
      arr[idx] = {
        ...cur,
        is_attack: next,
        attack: next ? { ...DEFAULT_ATTACK, ...(cur.attack || {}) } : (cur.attack || DEFAULT_ATTACK),
      };
      return { ...p, [field]: arr };
    });
  };

  const renderAttackableArrayEditor = (field, titleEs) => {
    const arr = formData[field] || [];
    return (
      <div style={S.panel}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ ...S.panelTitle, margin: 0, borderBottom: 'none', paddingBottom: 0 }}>{titleEs}</p>
          <button type="button" onClick={() => addNamedItem(field)} style={{ ...S.addBtn, padding: '4px 12px', fontSize: 12 }}>+ Añadir</button>
        </div>
        {arr.length === 0 ? (
          <p style={{ color: '#3a4a3a', fontSize: 12, fontFamily: 'sans-serif', textAlign: 'center', padding: 12, margin: 0 }}>Sin entradas</p>
        ) : arr.map((it, i) => {
          const isAttack = !!it.is_attack;
          const atk = { ...DEFAULT_ATTACK, ...(it.attack || {}) };
          const isSave = !!atk.is_saving_throw;
          const doAttackRoll = atk.is_attack_roll !== false;
          const computedDc = atk.dc_mode === 'stat'
            ? 10 + Math.floor(((Number(formData[atk.dc_ability] ?? 10)) - 10) / 2)
            : (parseInt(atk.dc_custom, 10) || 0);
          const saveTargetLabel = STAT_LONG[atk.save_target_ability] || '—';
          const rowKey = `${field}:${i}`;
          const isEditing = editingActionKey === rowKey;
          const hasChatProp = typeof onSendMessage === 'function' || typeof onSendMessageGm === 'function';
          const nameClickable = isAttack && hasChatProp;
          return (
            <div key={i} style={S.listItem}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: isEditing ? 6 : 0 }}>
                {isEditing ? (
                  <input
                    style={{ ...smallInp, flex: 1, fontWeight: 700 }}
                    value={it.name || ''}
                    onChange={e => updateNamedItem(field, i, 'name', e.target.value)}
                    placeholder="Nombre"
                  />
                ) : (
                  <span
                    onClick={nameClickable ? (e) => {
                      e.stopPropagation();
                      handleMonsterAttackRoll(it);
                    } : undefined}
                    title={isAttack
                      ? `Vinculado a ataque: ${it.name || '(sin nombre)'}${nameClickable ? ' · Click para tirar al chat' : ''}`
                      : ''}
                    onMouseEnter={nameClickable ? (e) => {
                      e.currentTarget.style.color = ACCENT_LIGHT;
                      e.currentTarget.style.textDecoration = 'underline';
                      e.currentTarget.style.textShadow = `0 0 8px ${ACCENT_SOFT}`;
                    } : undefined}
                    onMouseLeave={nameClickable ? (e) => {
                      e.currentTarget.style.color = '#ecfdf5';
                      e.currentTarget.style.textDecoration = 'underline dotted';
                      e.currentTarget.style.textShadow = 'none';
                    } : undefined}
                    style={{
                      flex: 1, fontWeight: 700, fontSize: 13,
                      color: '#ecfdf5', fontFamily: 'sans-serif',
                      cursor: nameClickable ? 'pointer' : 'default',
                      textDecoration: nameClickable ? 'underline dotted' : 'none',
                      padding: '4px 0',
                      transition: 'color 0.15s, text-shadow 0.15s',
                    }}
                  >
                    {isAttack && (
                      <span
                        aria-hidden="true"
                        style={{ marginRight: 6, color: ACCENT_LIGHT, fontSize: 11, verticalAlign: 'middle' }}
                      >🔗</span>
                    )}
                    {it.name || '(sin nombre)'}
                  </span>
                )}
                <button type="button"
                  onClick={() => setEditingActionKey(isEditing ? null : rowKey)}
                  style={S.delBtn}
                  title={isEditing ? 'Cerrar edición' : 'Editar'}
                  onMouseEnter={e => e.currentTarget.style.color = ACCENT_LIGHT}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a5d4a'}>{isEditing ? '✓' : '✎'}</button>
                <button type="button" onClick={() => { if (isEditing) setEditingActionKey(null); removeNamedItem(field, i); }} style={S.delBtn}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a5d4a'}>✕</button>
              </div>

              {!isEditing && it.description && (
                <p style={{ color: '#86827a', fontSize: 11, fontFamily: 'sans-serif', margin: '4px 0 0', lineHeight: 1.5 }}>{it.description}</p>
              )}

              {isEditing && (<>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                <button type="button"
                  onClick={() => toggleIsAttack(field, i)}
                  style={{
                    background: isAttack ? ACCENT_SOFT : 'transparent',
                    border: `1px solid ${isAttack ? ACCENT_BORDER : '#1e3a22'}`,
                    color: isAttack ? ACCENT_LIGHT : '#86827a',
                    borderRadius: 20, padding: '4px 12px',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                  {isAttack ? '⚔ Es ataque' : '⚔ Marcar como ataque'}
                </button>
                {isAttack && (
                  <button type="button"
                    onClick={() => handleMonsterAttackRoll(it)}
                    disabled={!canSend()}
                    title={canSend() ? 'Tirar ataque y daño' : 'No hay chat conectado'}
                    style={{
                      background: canSend() ? 'linear-gradient(135deg,#16a34a,#22c55e)' : '#1a2a1a',
                      border: 'none',
                      color: canSend() ? '#0d1f10' : '#4a5d4a',
                      borderRadius: 20, padding: '4px 14px',
                      fontSize: 11, fontWeight: 700,
                      cursor: canSend() ? 'pointer' : 'not-allowed',
                      fontFamily: 'sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase',
                      boxShadow: canSend() ? '0 0 12px rgba(34,197,94,0.4)' : 'none',
                    }}>
                    🎲 Tirar
                  </button>
                )}
              </div>

              {isAttack && (
                <div style={{ ...S.panel, marginBottom: 8 }}>
                  <p style={S.panelTitle}>Ataque</p>

                  <button type="button"
                    onClick={() => updateAttackField(field, i, 'is_attack_roll', !doAttackRoll)}
                    style={{
                      background: doAttackRoll ? ACCENT_SOFT : 'transparent',
                      border: `1px solid ${doAttackRoll ? ACCENT_BORDER : '#1e3a22'}`,
                      color: doAttackRoll ? ACCENT_LIGHT : '#86827a',
                      borderRadius: 20, padding: '4px 12px',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase',
                      marginBottom: 10,
                    }}>
                    ⚔ Tirada de ataque (d20)
                  </button>

                  {doAttackRoll && (<>
                  <label style={S.label}>Tirada de ataque</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <select style={{ ...S.select, fontSize: 12, padding: '6px 8px' }}
                      value={atk.attack_ability || ''}
                      onChange={e => updateAttackField(field, i, 'attack_ability', e.target.value)}>
                      <option value="">— Atributo —</option>
                      {STAT_KEYS.map(k => <option key={k} value={k}>{STAT_LONG[k]}</option>)}
                    </select>
                    <input type="number" style={{ ...smallInp, textAlign: 'center' }}
                      value={atk.attack_bonus ?? 0}
                      onChange={e => updateAttackField(field, i, 'attack_bonus', parseInt(e.target.value, 10) || 0)}
                      placeholder="Bonus" />
                  </div>
                  </>)}

                  <label style={S.label}>Daño principal</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <input style={smallInp}
                      value={atk.damage_dice || ''}
                      onChange={e => updateAttackField(field, i, 'damage_dice', e.target.value)}
                      placeholder="1d8" />
                    <input style={smallInp}
                      value={atk.damage_type || ''}
                      onChange={e => updateAttackField(field, i, 'damage_type', e.target.value)}
                      placeholder="cortante" />
                    <select style={{ ...S.select, fontSize: 12, padding: '6px 8px' }}
                      value={atk.damage_ability || ''}
                      onChange={e => updateAttackField(field, i, 'damage_ability', e.target.value)}>
                      <option value="">— Atributo —</option>
                      {STAT_KEYS.map(k => <option key={k} value={k}>{STAT_LONG[k]}</option>)}
                    </select>
                  </div>

                  <label style={S.label}>Daño secundario (opcional)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <input style={smallInp}
                      value={atk.damage_dice_2 || ''}
                      onChange={e => updateAttackField(field, i, 'damage_dice_2', e.target.value)}
                      placeholder="1d6" />
                    <input style={smallInp}
                      value={atk.damage_type_2 || ''}
                      onChange={e => updateAttackField(field, i, 'damage_type_2', e.target.value)}
                      placeholder="fuego" />
                    <select style={{ ...S.select, fontSize: 12, padding: '6px 8px' }}
                      value={atk.damage_ability_2 || ''}
                      onChange={e => updateAttackField(field, i, 'damage_ability_2', e.target.value)}>
                      <option value="">— Atributo —</option>
                      {STAT_KEYS.map(k => <option key={k} value={k}>{STAT_LONG[k]}</option>)}
                    </select>
                  </div>

                  <button type="button"
                    onClick={() => updateAttackField(field, i, 'is_saving_throw', !isSave)}
                    style={{
                      background: isSave ? ACCENT_SOFT : 'transparent',
                      border: `1px solid ${isSave ? ACCENT_BORDER : '#1e3a22'}`,
                      color: isSave ? ACCENT_LIGHT : '#86827a',
                      borderRadius: 20, padding: '4px 12px',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase',
                      marginBottom: isSave ? 10 : 0,
                    }}>
                    🛡 Salvación
                  </button>

                  {isSave && (
                    <div style={{ background: '#0d1f10', border: '1px solid #1a3a1f', borderRadius: 8, padding: 12 }}>
                      <label style={S.label}>DC</label>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        <button type="button"
                          onClick={() => updateAttackField(field, i, 'dc_mode', 'stat')}
                          style={{
                            flex: 1,
                            background: atk.dc_mode === 'stat' ? ACCENT_SOFT : 'transparent',
                            border: `1px solid ${atk.dc_mode === 'stat' ? ACCENT_BORDER : '#1e3a22'}`,
                            color: atk.dc_mode === 'stat' ? ACCENT_LIGHT : '#86827a',
                            borderRadius: 6, padding: '6px 10px',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'sans-serif',
                          }}>10 + atributo</button>
                        <button type="button"
                          onClick={() => updateAttackField(field, i, 'dc_mode', 'custom')}
                          style={{
                            flex: 1,
                            background: atk.dc_mode === 'custom' ? ACCENT_SOFT : 'transparent',
                            border: `1px solid ${atk.dc_mode === 'custom' ? ACCENT_BORDER : '#1e3a22'}`,
                            color: atk.dc_mode === 'custom' ? ACCENT_LIGHT : '#86827a',
                            borderRadius: 6, padding: '6px 10px',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'sans-serif',
                          }}>Personalizado</button>
                      </div>

                      {atk.dc_mode === 'stat' ? (
                        <select style={{ ...S.select, fontSize: 12, padding: '6px 8px', width: '100%', marginBottom: 10 }}
                          value={atk.dc_ability || 'wis'}
                          onChange={e => updateAttackField(field, i, 'dc_ability', e.target.value)}>
                          {STAT_KEYS.map(k => <option key={k} value={k}>{STAT_LONG[k]}</option>)}
                        </select>
                      ) : (
                        <input type="number" style={{ ...smallInp, textAlign: 'center', marginBottom: 10 }}
                          value={atk.dc_custom ?? 0}
                          onChange={e => updateAttackField(field, i, 'dc_custom', parseInt(e.target.value, 10) || 0)} />
                      )}

                      <label style={S.label}>Salvación del objetivo</label>
                      <select style={{ ...S.select, fontSize: 12, padding: '6px 8px', width: '100%', marginBottom: 10 }}
                        value={atk.save_target_ability || 'dex'}
                        onChange={e => updateAttackField(field, i, 'save_target_ability', e.target.value)}>
                        {STAT_KEYS.map(k => <option key={k} value={k}>{STAT_LONG[k]}</option>)}
                      </select>

                      <label style={S.label}>Efecto en éxito</label>
                      <input style={{ ...smallInp, marginBottom: 12 }}
                        value={atk.save_effect || ''}
                        onChange={e => updateAttackField(field, i, 'save_effect', e.target.value)}
                        placeholder="p.ej. mitad de daño" />

                      <div style={{ textAlign: 'center', padding: '10px 0', borderTop: '1px solid #1a3a1f' }}>
                        <div style={{ color: ACCENT, fontSize: 22, fontWeight: 700, fontFamily: "'Cinzel','Georgia',serif", letterSpacing: '0.08em' }}>
                          DC {computedDc}
                        </div>
                        <div style={{ color: '#86827a', fontSize: 11, fontFamily: 'sans-serif', marginTop: 2 }}>
                          Salvación de {saveTargetLabel}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <textarea
                style={{ ...S.textarea, fontSize: 12, minHeight: 60 }}
                value={it.description || ''}
                onChange={e => updateNamedItem(field, i, 'description', e.target.value)}
                placeholder="Descripción"
                rows={3}
              />
              </>)}
            </div>
          );
        })}
      </div>
    );
  };

  return createPortal((
    <div ref={modalRef} style={{ ...S.modal, position: 'fixed', left: pos.x, top: pos.y, width: size.w, height: size.h, maxWidth: 'none', display: 'flex', flexDirection: 'column' }}>
      {['n','s','e','w','ne','nw','se','sw'].map(dir => (
        <div key={dir} style={rh(dir)} onMouseDown={e => handleResizeStart(e, dir)} />
      ))}
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={S.topAccent} />

      {/* HEADER */}
      <div style={{ ...S.header, cursor: 'move', userSelect: 'none', flexShrink: 0 }} onMouseDown={handleDragStart}>
        <label style={{ ...S.portraitRing, cursor: 'pointer' }} title="Cambiar retrato">
          {previewPortrait
            ? <img src={previewPortrait} style={S.portraitImg} alt="portrait" />
            : <span style={S.portraitPlaceholder}>🐉</span>}
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleImageUpload('portrait', e.target.files[0])}
            disabled={uploadingPortrait} />
        </label>
        <div style={S.headerInfo}>
          <h2 style={{ ...S.charName, cursor: 'pointer' }} onDoubleClick={e => { e.stopPropagation(); setMinimized(true); }} title="Doble clic: minimizar">
            {formData.name || 'Monstruo sin nombre'}
          </h2>
          <div style={S.classBadges}>
            {formData.type && <span style={S.badge}>{formData.type}</span>}
            {formData.size && <span style={S.badge}>{formData.size}</span>}
            {formData.alignment && <span style={S.badge}>{formData.alignment}</span>}
            {(formData.challenge_rating || formData.challenge_rating === 0) && (
              <span style={S.levelBadge}>CR {formData.challenge_rating}</span>
            )}
          </div>
          <div style={S.hpRow}>
            <div style={S.hpPill}>
              <span style={S.hpLabel}>HP</span>
              <span style={S.hpVal}>{formData.hp} / {formData.max_hp}</span>
            </div>
            <div style={{ ...S.hpPill, borderColor: '#3b82f6' }}>
              <span style={{ ...S.hpLabel, color: '#3b82f6' }}>CA</span>
              <span style={{ ...S.hpVal, color: '#93c5fd', fontSize: 16 }}>{formData.armor_class ?? '—'}</span>
            </div>
            <div style={{ ...S.hpPill, borderColor: '#a78bfa' }}>
              <span style={{ ...S.hpLabel, color: '#a78bfa' }}>PB</span>
              <span style={{ ...S.hpVal, color: '#ddd6fe', fontSize: 12 }}>+{monsterProfBonus(formData.challenge_rating)}</span>
            </div>
            <div style={S.togGroup} onMouseDown={e => e.stopPropagation()}>
              <button type="button" style={S.togBtn(rollMode==='disadvantage', '#f87171')} onClick={() => setRollMode('disadvantage')} title="Tirar con desventaja">Desventaja</button>
              <button type="button" style={S.togBtn(rollMode==='normal', ACCENT_LIGHT)} onClick={() => setRollMode('normal')} title="Tirada normal">Normal</button>
              <button type="button" style={S.togBtn(rollMode==='advantage', '#4ade80')} onClick={() => setRollMode('advantage')} title="Tirar con ventaja">Ventaja</button>
            </div>
            <div style={S.togGroup} onMouseDown={e => e.stopPropagation()}>
              <button type="button" style={S.togBtn(sendMode==='all', ACCENT_LIGHT)} onClick={() => setSendMode('all')} title="Enviar a todos">Todos</button>
              <button type="button" style={S.togBtn(sendMode==='gm', '#fbbf24')} onClick={() => setSendMode('gm')} title="Enviar solo al DM">Solo DM</button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 6 }} onMouseDown={e => e.stopPropagation()}>
          <button type="button" onClick={() => adjustZoom(-ZOOM_STEP)}
            disabled={zoom <= ZOOM_MIN}
            title="Reducir tamaño"
            style={{
              background: '#162b1a', border: '1px solid #1e3a22',
              color: zoom <= ZOOM_MIN ? '#1e3a22' : '#86827a',
              borderRadius: 4, width: 26, height: 24,
              cursor: zoom <= ZOOM_MIN ? 'default' : 'pointer',
              fontFamily: 'sans-serif', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}>A−</button>
          <span style={{ color: '#4a5d4a', fontSize: 10, fontFamily: 'sans-serif', minWidth: 30, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => adjustZoom(ZOOM_STEP)}
            disabled={zoom >= ZOOM_MAX}
            title="Aumentar tamaño"
            style={{
              background: '#162b1a', border: '1px solid #1e3a22',
              color: zoom >= ZOOM_MAX ? '#1e3a22' : '#86827a',
              borderRadius: 4, width: 26, height: 24,
              cursor: zoom >= ZOOM_MAX ? 'default' : 'pointer',
              fontFamily: 'sans-serif', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}>A+</button>
        </div>
        <button style={S.closeBtn} onClick={onClose}
          onMouseDown={e => e.stopPropagation()}
          onMouseEnter={e => e.currentTarget.style.color = '#ecfdf5'}
          onMouseLeave={e => e.currentTarget.style.color = '#6b7d6b'}>✕</button>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}
            onMouseEnter={e => { if (activeTab !== t.id) e.currentTarget.style.color = '#86827a'; }}
            onMouseLeave={e => { if (activeTab !== t.id) e.currentTarget.style.color = '#4a5d4a'; }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ ...S.body, flex: 1, overflowY: 'auto', minHeight: 0, zoom: zoom }}>
          {error && <div style={S.errorBox}>{error}</div>}

          {/* ── INFO ── */}
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={S.sectionGap}>
                <div style={S.panel}>
                  <p style={S.panelTitle}>Identidad</p>
                  <label style={S.label}>Nombre</label>
                  <input style={inp({ marginBottom: 12 })} name="name" value={formData.name} onChange={handleInputChange} required />

                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Tipo</label>
                      <select style={inp()} name="type" value={formData.type} onChange={handleInputChange}>
                        <option value="">—</option>
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Tamaño</label>
                      <select style={inp()} name="size" value={formData.size} onChange={handleInputChange}>
                        <option value="">—</option>
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label style={S.label}>Alineamiento</label>
                    <input style={inp()} name="alignment" value={formData.alignment} onChange={handleInputChange} placeholder="Caótico Malvado…" />
                  </div>

                </div>

                <div style={S.panel}>
                  <p style={S.panelTitle}>Imágenes</p>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Token (circular)</label>
                      <div style={{ ...S.imgBox, width: 90, height: 90, borderRadius: '50%', margin: '0 auto 8px' }}>
                        {previewToken
                          ? <img src={previewToken} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="token" />
                          : <span style={{ color: '#1e3a22', fontSize: 24 }}>⬡</span>}
                      </div>
                      <label style={{ display: 'block', textAlign: 'center', cursor: 'pointer', color: ACCENT_LIGHT, fontSize: 11, fontFamily: 'sans-serif' }}>
                        {uploadingToken ? 'Subiendo…' : 'Cambiar token'}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => handleImageUpload('token', e.target.files[0])}
                          disabled={uploadingToken} />
                      </label>
                    </div>
                    <div>
                      <label style={S.label}>Retrato</label>
                      <div style={{ ...S.imgBox, width: 80, height: 110, borderRadius: 8, margin: '0 auto 8px' }}>
                        {previewPortrait
                          ? <img src={previewPortrait} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} alt="portrait" />
                          : <span style={{ color: '#1e3a22', fontSize: 24 }}>🐉</span>}
                      </div>
                      <label style={{ display: 'block', textAlign: 'center', cursor: 'pointer', color: ACCENT_LIGHT, fontSize: 11, fontFamily: 'sans-serif' }}>
                        {uploadingPortrait ? 'Subiendo…' : 'Cambiar retrato'}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => handleImageUpload('portrait', e.target.files[0])}
                          disabled={uploadingPortrait} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div style={S.sectionGap}>
                <div style={S.panel}>
                  <p style={S.panelTitle}>Desafío & Percepción</p>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Challenge Rating</label>
                      <input style={inp({ textAlign: 'center' })} type="number" min="0" step="0.125"
                        name="challenge_rating" value={formData.challenge_rating} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label style={S.label}>Percepción Pasiva</label>
                      <input style={inp({ textAlign: 'center' })} type="number" min="0"
                        name="passive_perception" value={formData.passive_perception} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={S.label}>Visión (pies)</label>
                    <input style={inp({ textAlign: 'center' })} type="number" min="0" step="5"
                      name="vision" value={formData.vision} onChange={handleInputChange}
                      placeholder="0 = sin visión" />
                  </div>
                </div>

                <div style={S.panel}>
                  <p style={S.panelTitle}>Sentidos & Idiomas</p>
                  <label style={S.label}>Sentidos</label>
                  <textarea style={{ ...S.textarea, marginBottom: 10 }} rows={2}
                    name="senses" value={formData.senses} onChange={handleInputChange}
                    placeholder="Visión en la oscuridad 60 ft., …" />
                  <label style={S.label}>Idiomas</label>
                  <input style={inp()} name="languages" value={formData.languages} onChange={handleInputChange}
                    placeholder="Común, Infernal, …" />
                </div>

                {renderStringArrayEditor('treasure', 'Tesoro', 'p.ej. 50 po, anillo de protección')}
              </div>
            </div>
          )}

          {/* ── COMBATE ── */}
          {activeTab === 'combate' && (
            <div style={S.sectionGap}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={S.panel}>
                  <p style={S.panelTitle}>Clase de Armadura</p>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Valor</label>
                      <input style={inp({ textAlign: 'center' })} type="number" min="0"
                        name="armor_class" value={formData.armor_class} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label style={S.label}>Descripción</label>
                      <input style={inp()} name="ac_description" value={formData.ac_description} onChange={handleInputChange}
                        placeholder="armadura natural" />
                    </div>
                  </div>
                </div>

                <div style={S.panel}>
                  <p style={S.panelTitle}>Puntos de Vida</p>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Actual</label>
                      <input style={inp({ textAlign: 'center' })} type="number"
                        name="hp" value={formData.hp} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label style={S.label}>Máximo</label>
                      <input style={inp({ textAlign: 'center' })} type="number"
                        name="max_hp" value={formData.max_hp} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={S.label}>Fórmula HP</label>
                    <input style={inp()} name="hp_formula" value={formData.hp_formula} onChange={handleInputChange}
                      placeholder="p.ej. 18d10 + 90" />
                  </div>
                </div>
              </div>

              <div style={S.panel}>
                <p style={S.panelTitle}>Velocidad (pies)</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                  {SPEED_KINDS.map(k => {
                    const v = formData.speed?.[k] ?? 0;
                    return (
                      <div key={k}>
                        <label style={S.label}>{SPEED_ES[k]}</label>
                        <input style={inp({ textAlign: 'center' })} type="number" min="0" step="5"
                          value={v}
                          onChange={e => handleSpeedChange(k, e.target.value)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={S.panel}>
                <p style={S.panelTitle}>Acciones Legendarias / Mítica</p>
                <div style={S.grid2}>
                  <div>
                    <label style={S.label}>Resistencias Legendarias (nº)</label>
                    <input style={inp({ textAlign: 'center' })} type="number" min="0"
                      name="legendary_resistances_count" value={formData.legendary_resistances_count} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label style={S.label}>Acciones Legendarias (nº)</label>
                    <input style={inp({ textAlign: 'center' })} type="number" min="0"
                      name="legendary_actions_count" value={formData.legendary_actions_count} onChange={handleInputChange} />
                  </div>
                </div>
                <p style={{ color: '#4a5d4a', fontSize: 11, fontFamily: 'sans-serif', margin: '10px 0 0', textAlign: 'center' }}>
                  Contadores. Las acciones se editan más abajo, en la sección <b style={{ color: ACCENT_LIGHT }}>Legendarias</b>.
                </p>
              </div>

              {renderNamedArrayEditor('traits', 'Rasgos')}

              <h3 style={sectionHeader}>Acciones</h3>
              {renderAttackableArrayEditor('actions', 'Acciones')}
              {renderAttackableArrayEditor('bonus_actions', 'Acciones Bonus')}
              {renderAttackableArrayEditor('reactions', 'Reacciones')}

              <h3 style={sectionHeader}>Legendarias</h3>
              {renderAttackableArrayEditor('legendary_actions', 'Acciones Legendarias')}
              {renderAttackableArrayEditor('mythic_actions', 'Acciones Míticas')}
              {renderAttackableArrayEditor('lair_actions', 'Acciones de Guarida')}
              {renderNamedArrayEditor('regional_effects', 'Efectos Regionales')}
            </div>
          )}

          {/* ── HECHIZOS ── */}
          {activeTab === 'hechizos' && (
            <div style={S.sectionGap}>
              {[0,1,2,3,4,5,6,7,8,9].map(lvl => {
                const lvlSpells = spells.filter(s => (s.level ?? 0) === lvl);
                return (
                  <div key={lvl} style={S.panel}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lvlSpells.length > 0 ? 10 : 0 }}>
                      <span style={{ color: ACCENT, fontWeight: 700, fontSize: 13, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {lvl === 0 ? 'Trucos (Nivel 0)' : `Nivel ${lvl}`}
                      </span>
                      <button type="button" onClick={() => handleAddSpell(lvl)}
                        style={{ ...S.addBtn, padding: '2px 10px', fontSize: 12 }}>+ Conjuro</button>
                    </div>

                    {lvlSpells.map(spell => (
                      <div key={spell.id} style={{ ...S.listItem, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        {editingSpellId === spell.id ? (
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <input style={{ ...smallInp, flex: 2 }} value={editSpell.name || ''} onChange={e => setEditSpell({ ...editSpell, name: e.target.value })} placeholder="Nombre" />
                              <input style={{ ...smallInp, width: 60, textAlign: 'center' }} type="number" value={editSpell.level ?? 0} onChange={e => setEditSpell({ ...editSpell, level: parseInt(e.target.value) || 0 })} placeholder="Niv" />
                              <select style={{ ...S.select, fontSize: 12, padding: '6px 8px' }} value={editSpell.school || 'Evocación'} onChange={e => setEditSpell({ ...editSpell, school: e.target.value })}>
                                <option>Evocación</option><option>Abjuración</option><option>Conjuración</option><option>Adivinación</option><option>Encantamiento</option><option>Ilusión</option><option>Nigromancia</option><option>Transmutación</option>
                              </select>
                              <input style={{ ...smallInp, width: 90 }} value={editSpell.casting_time || ''} onChange={e => setEditSpell({ ...editSpell, casting_time: e.target.value })} placeholder="Tiempo" />
                              <input style={{ ...smallInp, width: 70 }} value={editSpell.range || ''} onChange={e => setEditSpell({ ...editSpell, range: e.target.value })} placeholder="Rango" />
                              <input style={{ ...smallInp, width: 90 }} value={editSpell.duration || ''} onChange={e => setEditSpell({ ...editSpell, duration: e.target.value })} placeholder="Duración" />
                            </div>
                            <textarea style={{ ...smallInp, width: '100%', marginTop: 4, resize: 'vertical', minHeight: 40 }}
                              value={editSpell.description || ''} onChange={e => setEditSpell({ ...editSpell, description: e.target.value })} placeholder="Descripción" />
                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                              <button type="button" onClick={() => handleSaveSpell(spell.id)} style={S.addBtn}>Guardar</button>
                              <button type="button" onClick={() => setEditingSpellId(null)} style={S.delBtn}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ flex: 1 }}>
                            <span style={{ color: '#ecfdf5', fontWeight: 700, fontSize: 13, fontFamily: 'sans-serif' }}>{spell.name}</span>
                            <span style={{ color: ACCENT, fontSize: 11, fontFamily: 'sans-serif', marginLeft: 8 }}>{spell.school}</span>
                            <span style={{ color: '#4a5d4a', fontSize: 11, fontFamily: 'sans-serif', marginLeft: 8 }}>
                              {spell.casting_time} · {spell.range} · {spell.duration}
                            </span>
                            {spell.description && <p style={{ color: '#86827a', fontSize: 11, fontFamily: 'sans-serif', margin: '4px 0 0', lineHeight: 1.5 }}>{spell.description}</p>}
                          </div>
                        )}
                        {editingSpellId !== spell.id && (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button type="button"
                              onClick={() => { setEditingSpellId(spell.id); setEditSpell({ name: spell.name, level: spell.level, school: spell.school, casting_time: spell.casting_time, range: spell.range, duration: spell.duration, description: spell.description ?? '' }); }}
                              style={S.delBtn} title="Editar"
                              onMouseEnter={e => e.currentTarget.style.color = ACCENT_LIGHT}
                              onMouseLeave={e => e.currentTarget.style.color = '#4a5d4a'}>⚙</button>
                            <button type="button" onClick={() => handleDeleteSpell(spell.id)} style={S.delBtn}
                              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                              onMouseLeave={e => e.currentTarget.style.color = '#4a5d4a'}>✕</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STATS ── */}
          {activeTab === 'stats' && (
            <div style={S.sectionGap}>
              <div style={S.panel}>
                <p style={S.panelTitle}>Puntuaciones de Característica</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
                  {STAT_KEYS.map(stat => (
                    <div key={stat} style={S.statBox}>
                      <span
                        style={{ ...S.statName, cursor: canSend() ? 'pointer' : 'default', textDecoration: canSend() ? 'underline dotted' : 'none' }}
                        onClick={() => rollAbilityCheck(stat)}
                        title={canSend() ? 'Click: chequeo de característica' : ''}
                      >{STAT_LABELS[stat]}</span>
                      <input
                        type="number"
                        value={formData[stat]}
                        onChange={e => handleStatChange(stat, e.target.value)}
                        style={S.statInput}
                      />
                      <span style={S.modBadge}>{fmtMod(formData[stat])}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={S.panel}>
                  <p style={S.panelTitle}>Tiradas de Salvación</p>
                  {STAT_KEYS.map(stat => {
                    const sv = formData.saving_throws || {};
                    const hasSave = Object.prototype.hasOwnProperty.call(sv, stat);
                    const score = Number(formData[stat] ?? 10);
                    const abilityMod = mod(score);
                    const profB = hasSave ? monsterProfBonus(formData.challenge_rating) : 0;
                    const extra = hasSave ? (parseInt(sv[stat], 10) || 0) : 0;
                    const total = abilityMod + profB + extra;
                    return (
                      <div key={stat} style={S.savRow}>
                        <input type="checkbox" checked={hasSave} onChange={() => toggleSavingThrow(stat)}
                          style={{ accentColor: ACCENT, width: 14, height: 14, cursor: 'pointer' }} />
                        <span
                          style={{ color: '#cbd5d1', fontSize: 12, fontFamily: 'sans-serif', flex: 1, cursor: canSend() ? 'pointer' : 'default', textDecoration: canSend() ? 'underline dotted' : 'none' }}
                          onClick={() => rollSavingThrow(stat)}
                          title={canSend() ? 'Click: tirada de salvación' : ''}
                        >{STAT_LONG[stat]}</span>
                        {hasSave && (
                          <input type="number" value={sv[stat] ?? 0}
                            onChange={e => setSavingThrowBonus(stat, e.target.value)}
                            title="Bonificador extra"
                            style={{ ...smallInp, width: 50, textAlign: 'center', padding: '3px 4px' }} />
                        )}
                        <span style={{ ...S.modBadge, fontSize: 11, padding: '1px 8px', minWidth: 32, textAlign: 'center' }}>{fmtSigned(total)}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={S.panel}>
                  <p style={S.panelTitle}>Habilidades</p>
                  <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                    {SKILL_LIST.map(skill => {
                      const sk = formData.skills || {};
                      const hasSkill = Object.prototype.hasOwnProperty.call(sk, skill);
                      const statKey = SKILL_STAT[skill];
                      const score = Number(formData[statKey] ?? 10);
                      const abilityMod = mod(score);
                      const override = hasSkill ? parseInt(sk[skill], 10) : 0;
                      let total;
                      if (hasSkill && override !== 0) total = override;
                      else total = abilityMod + (hasSkill ? monsterProfBonus(formData.challenge_rating) : 0);
                      return (
                        <div key={skill} style={S.skillRow}>
                          <input type="checkbox" checked={hasSkill} onChange={() => toggleSkill(skill)}
                            style={{ accentColor: ACCENT, width: 13, height: 13, cursor: 'pointer' }} />
                          <span
                            onClick={() => canSend() && rollSkillCheck(skill)}
                            style={{
                              color: '#cbd5d1', fontSize: 11, fontFamily: 'sans-serif', flex: 1,
                              cursor: canSend() ? 'pointer' : 'default',
                              textDecoration: canSend() ? 'underline dotted' : 'none',
                            }}
                            title={canSend() ? 'Click: tirar habilidad' : ''}
                          >{SKILL_ES[skill]}</span>
                          <span style={{ color: '#4a5d4a', fontSize: 9, fontFamily: 'sans-serif' }}>{STAT_LABELS[statKey]}</span>
                          {hasSkill && (
                            <input type="number" value={sk[skill] ?? 0}
                              onChange={e => setSkillBonus(skill, e.target.value)}
                              title="Override (0 = auto)"
                              style={{ ...smallInp, width: 46, textAlign: 'center', padding: '2px 4px', fontSize: 11 }} />
                          )}
                          <span style={{ ...S.modBadge, fontSize: 10, padding: '1px 6px', minWidth: 28, textAlign: 'center' }}>{fmtSigned(total)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ color: '#4a5d4a', fontSize: 10, fontFamily: 'sans-serif', margin: '8px 0 0', textAlign: 'center' }}>
                    Marca = competente. Bonus = override manual (0 = automático con PB).
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={S.footer}>
            <button type="button" onClick={onClose} style={S.cancelBtn} disabled={saving}>Cancelar</button>
            <button type="submit" style={S.saveBtn} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  ), document.body);
}
