import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Enviamos los datos a Symfony
            await axios.post('http://127.0.0.1:8000/api/register', {
                email: email,
                password: password
            });

            alert("¡Usuario creado! Ahora puedes hacer login.");
            navigate('/login'); // Te manda a la pantalla de login que hicimos antes

        } catch (error) {
            alert("Error: Puede que el email ya exista.");
        }
    };

    return (
        <div style={{ padding: 50, color: 'white' }}>
            <h2>Crear Nuevo Usuario</h2>
            <form onSubmit={handleRegister}>
                <input
                    type="email" placeholder="Email"
                    onChange={e => setEmail(e.target.value)}
                />
                <br/><br/>
                <input
                    type="password" placeholder="Contraseña"
                    onChange={e => setPassword(e.target.value)}
                />
                <br/><br/>
                <button type="submit">Registrarse</button>
            </form>
        </div>
    );
}