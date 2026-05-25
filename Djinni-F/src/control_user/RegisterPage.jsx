import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { API_URL } from '../config/api';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(null);
    const previewAvatar = useObjectUrl(avatar);
    const [avatarStatus, setAvatarStatus] = useState(null); // null | 'selected'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setAvatarStatus('selected');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('username', name);
        formData.append('email', email);
        formData.append('password', password);
        if (avatar) { formData.append('avatar', avatar); }
        try {
            await axios.post(`${API_URL}/api/register`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/login');
        } catch (err) {
            const msg = err?.response?.data?.error;
            setError(msg || "Error al registrarse. El email podría estar en uso.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12 relative overflow-hidden page-section"
            style={{ background: '#060d08' }}>

            {/* Ambient orbs */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute top-0 right-1/3 w-[450px] h-[450px] rounded-full opacity-[0.07]"
                    style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', transform: 'translateY(-40%)' }}></div>
                <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full opacity-[0.05]"
                    style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)', transform: 'translateY(30%)' }}></div>
            </div>

            {/* Card */}
            <div className="arcane-modal relative w-full max-w-md animate-slide-up overflow-hidden">
                <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #22c55e, transparent)' }}></div>

                <div className="p-8 sm:p-10">
                    <div className="text-center mb-6">
                        <h2 className="font-heading text-2xl text-text-hi tracking-widest mb-1">Crear Cuenta</h2>
                        <p className="text-text-lo text-sm">Únete y comienza tu aventura</p>
                    </div>

                    <div className="rune-divider mb-6">◆</div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2 text-red-300"
                            style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(248,113,113,0.25)' }}>
                            <span className="material-symbols-outlined text-[18px] text-red-400">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Avatar upload */}
                        <div className="flex justify-center mb-2">
                            <div className="relative group cursor-pointer">
                                <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                                    style={{
                                        background: previewAvatar ? 'transparent' : 'rgba(13,31,16,0.8)',
                                        border: '2px dashed rgba(30,58,34,0.8)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,58,34,0.8)'}
                                >
                                    {previewAvatar ? (
                                        <img src={previewAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-3xl text-text-lo group-hover:text-primary transition-colors">add_a_photo</span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    title="Subir avatar"
                                    aria-describedby="avatar-status"
                                />
                            </div>
                        </div>
                        <p id="avatar-status" className="text-center text-xs text-text-lo -mt-1">
                            {avatarStatus === 'selected' ? `Avatar listo: ${avatar?.name ?? 'archivo seleccionado'}` : 'Avatar opcional (haz click en el círculo)'}
                        </p>

                        <div>
                            <label className="block text-[11px] font-semibold tracking-widest uppercase text-text-lo mb-2">Nombre de Héroe</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-lo text-[18px] select-none">person</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="arcane-input pl-10"
                                    placeholder="Tu nombre de héroe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold tracking-widest uppercase text-text-lo mb-2">Email</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-lo text-[18px] select-none">mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="arcane-input pl-10"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold tracking-widest uppercase text-text-lo mb-2">Contraseña</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-lo text-[18px] select-none">lock</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="arcane-input pl-10"
                                    placeholder="••••••••"
                                    minLength={12}
                                    required
                                />
                            </div>
                            <p className="mt-2 text-[11px] text-text-lo">Mínimo 12 caracteres.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="arcane-btn w-full justify-center py-3 mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-[#042713]/40 border-t-[#042713] rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Registrarse</span>
                                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-text-lo">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-primary hover:text-primary-light font-semibold transition-colors">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
