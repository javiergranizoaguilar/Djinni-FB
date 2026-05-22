import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('redirect') === 'join') { /* handled by pending_invitation_token */ }
    }, [location]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/login_check', {
                email: email,
                password: password
            });
            const token = response.data.token;
            localStorage.setItem('vtt_token', token);
            window.dispatchEvent(new Event('auth-change'));
            const pendingInvitation = localStorage.getItem('pending_invitation_token');
            if (pendingInvitation) {
                navigate(`/join/${pendingInvitation}`);
            } else {
                navigate('/Games');
            }
        } catch {
            setError('Credenciales incorrectas o error de servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden page-section"
            style={{ background: '#060d08' }}>

            {/* Ambient orbs */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.07]"
                    style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', transform: 'translateY(-40%)' }}></div>
                <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full opacity-[0.05]"
                    style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)', transform: 'translateY(30%)' }}></div>
            </div>

            {/* Card */}
            <div className="arcane-modal relative w-full max-w-md animate-slide-up overflow-hidden">
                {/* Top accent line */}
                <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #22c55e, transparent)' }}></div>

                <div className="p-8 sm:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center size-14 rounded-full mb-4 animate-glow-pulse"
                            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 8C20.6569 8 22 9.34315 22 11C22 12.6569 20.6569 14 19 14H18V18C18 19.1046 17.1046 20 16 20H4C2.89543 20 2 19.1046 2 18V11C2 9.89543 2.89543 9 4 9H6.17071C6.58254 9 6.96327 8.78368 7.1691 8.4237L7.76442 7.3821C8.35974 6.3405 9.46091 5.71509 10.6517 5.71509H12.5C13.8807 5.71509 15 6.83438 15 8.21509V8H19ZM4 11V18H16V14H6V11H4ZM14 12V10H10V12H14Z" fill="currentColor"/>
                                <path d="M13 2C13 2.55228 12.5523 3 12 3C11.4477 3 11 2.55228 11 2C11 1.44772 11.4477 1 12 1C12.5523 1 13 1.44772 13 2Z" fill="currentColor"/>
                                <path d="M16 4C16 4.55228 15.5523 5 15 5C14.4477 5 14 4.55228 14 4C14 3.44772 14.4477 3 15 3C15.5523 3 16 3.44772 16 4Z" fill="currentColor" opacity="0.5"/>
                            </svg>
                        </div>
                        <h2 className="font-heading text-2xl text-text-hi tracking-widest mb-1">Bienvenido</h2>
                        <p className="text-text-lo text-sm">Continúa tu aventura</p>
                    </div>

                    {/* Rune divider */}
                    <div className="rune-divider mb-7">◆</div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 p-3 rounded-lg text-sm flex items-center gap-2 text-red-300"
                            style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(248,113,113,0.25)' }}>
                            <span className="material-symbols-outlined text-[18px] text-red-400">error</span>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
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
                                    required
                                />
                            </div>
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
                                    <span>Iniciar Sesión</span>
                                    <span className="material-symbols-outlined text-[18px]">login</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-text-lo">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-primary hover:text-primary-light font-semibold transition-colors">
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
