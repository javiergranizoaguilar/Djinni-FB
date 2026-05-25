import './App.css'
import {BrowserRouter, Route, Routes, Navigate, useLocation} from "react-router-dom";
import VttBoard from "./VttBoard.jsx";
import MainLayout from "./layout/MainLayout.jsx";
import Header from "./layout/Header.jsx";
import Footer from "./layout/Footer.jsx";
import LoginPage from './control_user/LoginPage.jsx';
import RegisterPage from './control_user/RegisterPage.jsx';
import GameList from './pages/GameList.jsx';
import JoinGamePage from './pages/JoinGamePage.jsx';
import CharacterList from './pages/CharacterList.jsx';
import MonsterList from './pages/MonsterList.jsx';
import AccountSettings from './pages/AccountSettings.jsx';
import AdminPage from './pages/AdminPage.jsx';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('vtt_token');
    // Si no hay token, te manda al login
    return token ? children : <Navigate to="/login" />;
};
function AppContent() {
    const location = useLocation();
    const isVtt = location.pathname.startsWith('/play/');

    return (
        <>
            {!isVtt && <Header/>}
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
                <Route path="/Monster" element={
                    <PrivateRoute>
                        <MonsterList />
                    </PrivateRoute>
                } />
                <Route path="/account/settings" element={
                    <PrivateRoute>
                        <AccountSettings />
                    </PrivateRoute>
                } />
                <Route path="/admin" element={
                    <PrivateRoute>
                        <AdminPage />
                    </PrivateRoute>
                } />
            </Routes>
            {!isVtt && <Footer/>}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App
