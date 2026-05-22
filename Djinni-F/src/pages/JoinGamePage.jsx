import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function JoinGamePage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('checking'); // checking, joining, error, success
    const [message, setMessage] = useState('Verifying invitation...');
    const hasJoined = useRef(false); // Ref para evitar doble ejecución

    useEffect(() => {
        const joinGame = async () => {
            if (hasJoined.current) return; // Si ya se ejecutó, salir
            hasJoined.current = true;

            const authToken = localStorage.getItem('vtt_token');

            // 1. Si no hay usuario logueado, guardar token y redirigir a login
            if (!authToken) {
                localStorage.setItem('pending_invitation_token', token);
                navigate('/login?redirect=join');
                return;
            }

            // 2. Si hay usuario, intentar unirse
            try {
                setStatus('joining');
                setMessage('Joining game...');
                
                const response = await axios.post(`http://localhost:8000/api/game/sesion/join/${token}`, {}, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (response.status === 200) {
                    setStatus('success');
                    setMessage(`Successfully joined "${response.data.title}"! Redirecting...`);
                    
                    // Limpiar token pendiente si existía
                    localStorage.removeItem('pending_invitation_token');
                    
                    // Redirigir al juego tras 1.5s
                    setTimeout(() => {
                        navigate(`/play/${response.data.game_id}`);
                    }, 1500);
                }

            } catch (error) {
                setStatus('error');
                if (error.response && error.response.data && error.response.data.error) {
                    setMessage(error.response.data.error);
                } else {
                    setMessage('Failed to join game. The link might be invalid or expired.');
                }
            }
        };

        if (token) {
            joinGame();
        } else {
            setStatus('error');
            setMessage('Invalid invitation link.');
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background-dark px-4 py-12">
            <div className="max-w-md w-full p-8 bg-white dark:bg-surface rounded-2xl shadow-2xl border border-gray-200 dark:border-border-md text-center animate-fade-in">
                {status === 'checking' || status === 'joining' ? (
                    <div className="flex flex-col items-center">
                        <div className="relative mb-5">
                            <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary/20 border-t-primary"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">link</span>
                            </div>
                        </div>
                        <h2 className="font-mystical text-xl font-semibold text-gray-800 dark:text-text-hi">{message}</h2>
                    </div>
                ) : status === 'success' ? (
                    <div className="flex flex-col items-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 mb-4 ring-4 ring-primary/20">
                            <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
                        </div>
                        <h2 className="font-mystical text-2xl font-bold text-gray-800 dark:text-text-hi mb-2">¡Listo!</h2>
                        <p className="text-gray-600 dark:text-text-med">{message}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 mb-4 ring-4 ring-red-500/20">
                            <span className="material-symbols-outlined text-4xl text-red-400">error</span>
                        </div>
                        <h2 className="font-mystical text-2xl font-bold text-gray-800 dark:text-text-hi mb-2">Error</h2>
                        <p className="text-gray-600 dark:text-text-med mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-5 py-2.5 bg-primary text-[#042713] font-bold rounded-lg shadow-glow hover:shadow-glow-hover hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">home</span>
                            Volver al inicio
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
