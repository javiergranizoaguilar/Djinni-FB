import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './axiosConfig'; // Importa la configuración de Axios para que se aplique globalmente

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode> // CORREGIDO: Eliminada la coma
)
