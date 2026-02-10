import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Limpiar errores previos

        try {
            // Hacemos la petición POST a Symfony
            const response = await axios.post('http://127.0.0.1:8000/api/login_check', {
                email: email,    // Asegúrate de que coincida con lo que espera Symfony
                password: password
            });

            // Si es correcto, Symfony devuelve un token. Lo guardamos.
            const token = response.data.token;
            localStorage.setItem('vtt_token', token);
            
            // Despachamos un evento personalizado para avisar al Header que el estado de autenticación cambió
            window.dispatchEvent(new Event('auth-change'));

            console.log("Login exitoso, token guardado");

            // Redirigimos al juego
            navigate('/Games');

        } catch (err) {
            console.error(err);
            setError('Credenciales incorrectas o error de servidor');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <form onSubmit={handleLogin} style={{ padding: '20px', border: '1px solid #ccc' }}>
                <h2>Entrar al VTT</h2>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div style={{ marginBottom: '10px' }}>
                    <label>Email:</label><br/>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Contraseña:</label><br/>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">Iniciar Sesión</button>
            </form>
        </div>
    );
}