import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Toast, useToast } from '../components/Toast.jsx';

const API = 'http://localhost:8000';

export default function AccountSettings() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const { toast, show: showToast, hide: hideToast } = useToast();

    useEffect(() => {
        let cancelled = false;
        const fetchMe = async () => {
            const token = localStorage.getItem('vtt_token');
            if (!token) { setLoadError('No estás autenticado.'); setLoading(false); return; }
            try {
                const res = await axios.get(`${API}/api/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (cancelled) return;
                setUsername(res.data.username || '');
                setEmail(res.data.email || '');
                const url = res.data.avatar_url;
                if (url) {
                    setAvatarUrl(url.startsWith('/uploads') ? `${API}${url}` : url);
                }
            } catch {
                if (!cancelled) setLoadError('Error al cargar los datos del usuario.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchMe();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!avatarFile) { setAvatarPreview(null); return; }
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    const handleAvatarChange = (e) => {
        const f = e.target.files?.[0];
        if (f) setAvatarFile(f);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;

        if (!username.trim() || !email.trim()) {
            showToast('Usuario y email son obligatorios', 'err');
            return;
        }
        if (newPassword || confirmNewPassword) {
            if (newPassword !== confirmNewPassword) {
                showToast('Las contraseñas no coinciden', 'err');
                return;
            }
            if (newPassword.length < 6) {
                showToast('La contraseña debe tener al menos 6 caracteres', 'err');
                return;
            }
        }

        const token = localStorage.getItem('vtt_token');
        if (!token) { showToast('No estás autenticado', 'err'); return; }

        const form = new FormData();
        form.append('username', username.trim());
        form.append('email', email.trim());
        if (newPassword) form.append('newPassword', newPassword);
        if (avatarFile) form.append('avatar', avatarFile);

        setSaving(true);
        try {
            const res = await axios.post(`${API}/api/user/me`, form, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setUsername(res.data.username || '');
            setEmail(res.data.email || '');
            const url = res.data.avatar_url;
            if (url) setAvatarUrl(url.startsWith('/uploads') ? `${API}${url}` : url);
            setAvatarFile(null);
            setNewPassword('');
            setConfirmNewPassword('');
            window.dispatchEvent(new Event('auth-change'));
            showToast('Cambios guardados', 'ok');
        } catch (err) {
            const msg = err?.response?.data?.error || 'Error al guardar los cambios';
            showToast(msg, 'err');
        } finally {
            setSaving(false);
        }
    };

    if (loadError) return (
        <div className="container mx-auto px-6 pb-6 pt-24 min-h-screen">
            <div className="max-w-md mx-auto text-center p-8 bg-red-900/20 border border-red-500/40 rounded-xl">
                <span className="material-symbols-outlined text-5xl text-red-400 mb-2">error</span>
                <p className="text-red-300 font-semibold">{loadError}</p>
            </div>
        </div>
    );

    const displayAvatar = avatarPreview || avatarUrl || 'https://ui-avatars.com/api/?name=U&background=0d1f10&color=22c55e';

    return (
        <div className="container mx-auto px-4 sm:px-6 pb-6 pt-24 min-h-screen relative page-section">
            <Toast toast={toast} onClose={hideToast} />

            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h2 className="font-heading text-3xl sm:text-4xl text-text-hi tracking-widest">Ajustes de cuenta</h2>
                    <p className="text-sm text-text-lo mt-1">Actualiza tu perfil y credenciales</p>
                </div>

                {loading ? (
                    <div className="arcane-card p-6 space-y-4" aria-busy="true">
                        <div className="skeleton h-6 w-1/3"></div>
                        <div className="skeleton h-10 w-full"></div>
                        <div className="skeleton h-10 w-full"></div>
                        <div className="skeleton h-10 w-full"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="arcane-card p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="size-20 rounded-full overflow-hidden border border-border-md"
                                style={{ boxShadow: '0 0 0 2px rgba(34,197,94,0.08)' }}>
                                <img alt="Avatar" className="w-full h-full object-cover" src={displayAvatar} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-text-med mb-2">Avatar</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="block w-full text-sm text-text-lo file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-surface-hi file:text-text-hi hover:file:bg-surface-hi/80 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-med mb-2">Nombre de usuario</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="arcane-input w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-med mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="arcane-input w-full"
                                required
                            />
                        </div>

                        <div className="pt-2" style={{ borderTop: '1px solid rgba(34,197,94,0.1)' }}>
                            <p className="text-xs text-text-lo mb-3 mt-3">Cambiar contraseña (opcional)</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-text-med mb-2">Nueva contraseña</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className="arcane-input w-full"
                                        placeholder="Dejar vacío para no cambiar"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-med mb-2">Confirmar nueva contraseña</label>
                                    <input
                                        type="password"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className="arcane-input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="arcane-btn disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                <span>{saving ? 'Guardando…' : 'Guardar cambios'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
