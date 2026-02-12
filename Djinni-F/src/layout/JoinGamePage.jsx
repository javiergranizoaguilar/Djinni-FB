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
                console.error("Error joining game:", error);
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#112217]">
            <div className="max-w-md w-full p-8 bg-white dark:bg-[#1a2c20] rounded-xl shadow-lg border border-gray-200 dark:border-[#23482f] text-center">
                
                {status === 'checking' || status === 'joining' ? (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{message}</h2>
                    </div>
                ) : status === 'success' ? (
                    <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-6xl text-green-500 mb-4">check_circle</span>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Success!</h2>
                        <p className="text-gray-600 dark:text-gray-300">{message}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Error</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                        <button 
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-primary text-[#112217] font-bold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Go Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
