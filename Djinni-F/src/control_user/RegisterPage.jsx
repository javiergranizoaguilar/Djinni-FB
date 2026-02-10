import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('username', name);
        formData.append('email', email);
        formData.append('password', password);
        if (avatar) {
            formData.append('avatar', avatar);
        }

        try {
            // Enviamos los datos a Symfony como FormData
            await axios.post('http://127.0.0.1:8000/api/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert("¡Usuario creado! Ahora puedes hacer login.");
            navigate('/login'); 

        } catch (error) {
            console.error(error);
            alert("Error: Puede que el email ya exista o hubo un problema con la imagen.");
        }
    };

    return (
        <div style={{ padding: 50}}>
            <h2>Crear Nuevo Usuario</h2>
            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: 10 }}>
                    <label>Nombre de Usuario:</label><br/>
                    <input type="text" placeholder="Nombre"
                        value={name}
                        onChange={e=>setName(e.target.value)}
                        required
                    />
                </div>
                
                <div style={{ marginBottom: 10 }}>
                    <label>Email:</label><br/>
                    <input
                        type="email" placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>Contraseña:</label><br/>
                    <input
                        type="password" placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>Avatar (Imagen):</label><br/>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => setAvatar(e.target.files[0])}
                    />
                </div>

                <button type="submit">Registrarse</button>
            </form>
        </div>
    );
}