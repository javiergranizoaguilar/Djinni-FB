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

    // Detectar si venimos redirigidos por una invitación
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('redirect') === 'join') {
            // Opcional: Mostrar un mensaje de "Inicia sesión para unirte a la partida"
        }
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

        } catch (err) {
            console.error(err);
            setError('Credenciales incorrectas o error de servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
            <div className="max-w-md w-full bg-white dark:bg-[#1a2c20] rounded-xl shadow-xl border border-gray-200 dark:border-[#23482f] overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Bienvenido de nuevo</h2>
                        <p className="text-gray-600 dark:text-gray-400">Inicia sesión para continuar tu aventura</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-[#23482f] rounded-lg bg-gray-50 dark:bg-[#112217] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-[#23482f] rounded-lg bg-gray-50 dark:bg-[#112217] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary text-[#112217] font-bold rounded-lg shadow-glow hover:shadow-glow-hover hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-[#112217] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Iniciar Sesión</span>
                                    <span className="material-symbols-outlined">login</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-primary font-bold hover:underline">
                            Regístrate aquí
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
