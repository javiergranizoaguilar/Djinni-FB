import {useState} from 'react'
import './App.css'
import {BrowserRouter, Route, Router, Routes, Navigate} from "react-router-dom";
import VttBoard from "./VttBoard.jsx";
import MainLayout from "./layout/MainLayout.jsx";
import Header from "./layout/Header.jsx";
import Footer from "./layout/Footer.jsx";
import LoginPage from './control_user/LoginPage.jsx';
import RegisterPage from './control_user/RegisterPage.jsx';
import GameList from './layout/GameList.jsx';
import JoinGamePage from './layout/JoinGamePage.jsx';
import CharacterList from './layout/CharacterList.jsx';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('vtt_token');
    // Si no hay token, te manda al login
    return token ? children : <Navigate to="/login" />;
};
function App() {
    const [count, setCount] = useState(0)
    return (
        <BrowserRouter>
            <Header/>
            <Routes>
                <Route path="/" element={<MainLayout/>}/>
                <Route path="/login" element={<LoginPage/>} />
                <Route path="/register" element={<RegisterPage/>} />
                <Route path="/Games" element={
                    <PrivateRoute>
                        <GameList />
                    </PrivateRoute>
                } />
                <Route path="/play/:id" element={
                    <PrivateRoute>
                        <VttBoard />
                    </PrivateRoute>
                } />
                <Route path="/join/:token" element={<JoinGamePage />} />
                <Route path="/Character" element={
                    <PrivateRoute>
                        <CharacterList />
                    </PrivateRoute>
                } />
            </Routes>
            <Footer/>
        </BrowserRouter>
    );
}

export default App
