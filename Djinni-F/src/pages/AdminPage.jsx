import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

const TABS = [
    { key: 'users', label: 'Usuarios', icon: 'group' },
    { key: 'games', label: 'Partidas', icon: 'casino' },
    { key: 'monsters', label: 'Monstruos', icon: 'pest_control' },
    { key: 'characters', label: 'Personajes', icon: 'person' },
];

function useAdminGuard() {
    const navigate = useNavigate();
    const [checked, setChecked] = useState(false);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/user/me`);
                if (cancelled) return;
                if (!data?.is_admin) {
                    navigate('/Games', { replace: true });
                    return;
                }
                setAllowed(true);
            } catch {
                navigate('/login', { replace: true });
            } finally {
                if (!cancelled) setChecked(true);
            }
        })();
        return () => { cancelled = true; };
    }, [navigate]);

    return { checked, allowed };
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-base border border-border-md rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
                <h3 className="text-lg font-medium text-text-hi mb-2">{title}</h3>
                <p className="text-sm text-text-med mb-5">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel}
                            className="px-4 py-2 rounded-md text-sm font-medium text-text-med hover:bg-surface-hi transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm}
                            className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
                        Borrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const { checked, allowed } = useAdminGuard();
    const [tab, setTab] = useState('users');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null);

    const endpointFor = (t) => `${API_URL}/api/admin/${t}`;

    const load = useCallback(async () => {
        if (!allowed) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(endpointFor(tab));
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e?.response?.data?.error || 'No se pudo cargar la lista');
        } finally {
            setLoading(false);
        }
    }, [tab, allowed]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setSearch(''); }, [tab]);

    const doDelete = async (id) => {
        try {
            await axios.delete(`${endpointFor(tab)}/${id}`);
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (e) {
            alert(e?.response?.data?.error || 'No se pudo borrar');
        } finally {
            setConfirm(null);
        }
    };

    const toggleAdmin = async (user) => {
        try {
            const { data } = await axios.patch(`${API_URL}/api/admin/users/${user.id}/role`, {
                is_admin: !user.is_admin,
            });
            setItems(prev => prev.map(u => u.id === user.id
                ? { ...u, is_admin: data.is_admin, roles: data.is_admin ? [...(u.roles || []), 'ROLE_ADMIN'] : (u.roles || []).filter(r => r !== 'ROLE_ADMIN') }
                : u));
        } catch (e) {
            alert(e?.response?.data?.error || 'No se pudo cambiar el rol');
        }
    };

    if (!checked) {
        return <div className="pt-24 text-center text-text-med">Comprobando permisos…</div>;
    }
    if (!allowed) return null;

    const filtered = items.filter(item => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const haystack = JSON.stringify(item).toLowerCase();
        return haystack.includes(q);
    });

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 max-w-[1280px] mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-mystical text-amber-300 tracking-wide flex items-center gap-3">
                    <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
                    Panel de administración
                </h1>
                <p className="text-text-med text-sm mt-1">Gestiona usuarios, partidas, monstruos y personajes del sistema.</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors border ${
                            tab === t.key
                                ? 'bg-amber-500/15 text-amber-200 border-amber-400/40'
                                : 'bg-surface-base text-text-med border-border-md hover:bg-surface-hi hover:text-text-hi'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar…"
                    className="flex-1 px-3 py-2 rounded-md bg-surface-base border border-border-md text-text-hi text-sm focus:outline-none focus:border-primary"
                />
                <button onClick={load}
                        className="px-4 py-2 rounded-md text-sm font-medium border border-border-md text-text-med hover:bg-surface-hi hover:text-text-hi transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Recargar
                </button>
            </div>

            {loading && <div className="text-center text-text-med py-8">Cargando…</div>}
            {error && <div className="text-center text-red-400 py-4">{error}</div>}

            {!loading && !error && (
                <div className="border border-border-md rounded-lg overflow-hidden">
                    <div className="bg-surface-hi/40 px-4 py-2 text-xs uppercase tracking-wider text-text-lo">
                        {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
                    </div>
                    <ul className="divide-y divide-border-md">
                        {filtered.length === 0 && (
                            <li className="px-4 py-6 text-center text-text-med text-sm">Sin resultados.</li>
                        )}
                        {filtered.map(item => (
                            <li key={item.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-surface-hi/30 transition-colors">
                                <div className="flex-1 min-w-0">
                                    {tab === 'users' && <UserRow user={item} />}
                                    {tab === 'games' && <GameRow game={item} />}
                                    {tab === 'monsters' && <MonsterRow monster={item} />}
                                    {tab === 'characters' && <CharacterRow character={item} />}
                                </div>
                                <div className="flex items-center gap-2">
                                    {tab === 'users' && (
                                        <button
                                            onClick={() => toggleAdmin(item)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                                                item.is_admin
                                                    ? 'bg-amber-500/15 text-amber-200 border-amber-400/40 hover:bg-amber-500/25'
                                                    : 'border-border-md text-text-med hover:bg-surface-hi'
                                            }`}
                                        >
                                            {item.is_admin ? 'Es admin' : 'Hacer admin'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setConfirm({ id: item.id, label: itemLabel(tab, item) })}
                                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600/20 text-red-300 border border-red-600/40 hover:bg-red-600/30 transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        Borrar
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <ConfirmDialog
                open={!!confirm}
                title="Confirmar borrado"
                message={`Vas a borrar "${confirm?.label}". Esta acción no se puede deshacer.`}
                onConfirm={() => doDelete(confirm.id)}
                onCancel={() => setConfirm(null)}
            />
        </div>
    );
}

function itemLabel(tab, item) {
    if (tab === 'users') return item.username || item.email;
    if (tab === 'games') return item.title;
    if (tab === 'monsters') return item.name;
    if (tab === 'characters') return item.name;
    return `#${item.id}`;
}

function UserRow({ user }) {
    const avatar = user.avatar_url
        ? (user.avatar_url.startsWith('/uploads') ? `${API_URL}${user.avatar_url}` : user.avatar_url)
        : null;
    return (
        <div className="flex items-center gap-3">
            <div className="size-9 rounded-full overflow-hidden border border-border-md flex-shrink-0">
                <img alt="" className="w-full h-full object-cover"
                     src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'U')}&background=0d1f10&color=22c55e`} />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-text-hi font-medium truncate">{user.username}</span>
                    {user.is_admin && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-400/30">
                            admin
                        </span>
                    )}
                </div>
                <div className="text-xs text-text-lo truncate">{user.email} · {user.games_count ?? 0} partidas</div>
            </div>
        </div>
    );
}

function GameRow({ game }) {
    const img = game.img_path
        ? (game.img_path.startsWith('/uploads') ? `${API_URL}${game.img_path}` : game.img_path)
        : null;
    return (
        <div className="flex items-center gap-3">
            {img && (
                <div className="size-9 rounded overflow-hidden border border-border-md flex-shrink-0">
                    <img alt="" className="w-full h-full object-cover" src={img} />
                </div>
            )}
            <div className="min-w-0">
                <div className="text-text-hi font-medium truncate">{game.title}</div>
                <div className="text-xs text-text-lo truncate">
                    DM: {game.dm?.username || '—'} · {game.players_count ?? 0} jugadores
                </div>
            </div>
        </div>
    );
}

function MonsterRow({ monster }) {
    return (
        <div className="min-w-0">
            <div className="text-text-hi font-medium truncate">{monster.name}</div>
            <div className="text-xs text-text-lo truncate">
                {[monster.type, monster.cr ? `CR ${monster.cr}` : null, monster.creador?.username ? `por ${monster.creador.username}` : null].filter(Boolean).join(' · ')}
            </div>
        </div>
    );
}

function CharacterRow({ character }) {
    return (
        <div className="min-w-0">
            <div className="text-text-hi font-medium truncate">{character.name}</div>
            <div className="text-xs text-text-lo truncate">
                {[character.class, character.level ? `Nv ${character.level}` : null, character.game?.title ? `en ${character.game.title}` : null].filter(Boolean).join(' · ')}
            </div>
        </div>
    );
}
