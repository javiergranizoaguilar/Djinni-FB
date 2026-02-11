import {Link, useLocation, useNavigate} from 'react-router-dom';
import {useEffect, useState} from 'react';
import axios from 'axios';
import CreateGameModal from './CreateGameModal';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation(); // Hook para detectar cambios de ruta
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userAvatar, setUserAvatar] = useState(null);
    const [showCreateGameModal, setShowCreateGameModal] = useState(false);

    // Esta función verifica el token y carga el usuario
    const checkLoginStatus = async () => {
        const token = localStorage.getItem('vtt_token');
        if (token) {
            setIsLoggedIn(true);
            try {
                const response = await axios.get('http://localhost:8000/api/user/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data && response.data.avatar_url) {
                    // Si la URL es relativa (empieza con /uploads), le añadimos el dominio del backend
                    const avatarUrl = response.data.avatar_url.startsWith('/uploads')
                        ? `http://localhost:8000${response.data.avatar_url}`
                        : response.data.avatar_url;

                    setUserAvatar(avatarUrl);
                } else {
                    // Si no tiene avatar, null para que use el default
                    setUserAvatar(null);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                // Si el token es inválido, podríamos hacer logout
                // handleLogout(); 
            }
        } else {
            setIsLoggedIn(false);
            setUserAvatar(null);
        }
    };

    // Ejecutar la verificación cuando el componente se monta Y cuando cambia la ruta (location)
    useEffect(() => {
        checkLoginStatus();
    }, [location]); // <--- La dependencia 'location' hace que se ejecute al navegar

    // También podemos escuchar un evento personalizado si queremos ser más reactivos sin cambiar de ruta
    useEffect(() => {
        const handleStorageChange = () => {
            checkLoginStatus();
        };

        // Escuchar cambios en localStorage (solo funciona entre pestañas, pero útil saberlo)
        window.addEventListener('storage', handleStorageChange);

        // Escuchar un evento custom que despacharemos al hacer login
        window.addEventListener('auth-change', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-change', handleStorageChange);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('vtt_token');
        // Despachar evento para notificar a otros componentes si fuera necesario
        window.dispatchEvent(new Event('auth-change'));
        setIsLoggedIn(false);
        setUserAvatar(null);
        navigate('/login');
    };

    const handleCreateGameClick = () => {
        setShowCreateGameModal(true);
    };

    const handleCloseModal = () => {
        setShowCreateGameModal(false);
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-[#23482f] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md transition-all duration-300">
            <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                    <div
                        className="relative size-10 flex items-center justify-center text-primary transition-transform group-hover:scale-110 duration-300">
                        <div
                            className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity"></div>
                        <svg className="relative z-10 w-8 h-8" fill="none" viewBox="0 0 24 24"
                             xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M19 8C20.6569 8 22 9.34315 22 11C22 12.6569 20.6569 14 19 14H18V18C18 19.1046 17.1046 20 16 20H4C2.89543 20 2 19.1046 2 18V11C2 9.89543 2.89543 9 4 9H6.17071C6.58254 9 6.96327 8.78368 7.1691 8.4237L7.76442 7.3821C8.35974 6.3405 9.46091 5.71509 10.6517 5.71509H12.5C13.8807 5.71509 15 6.83438 15 8.21509V8H19ZM4 11V18H16V14H6V11H4ZM14 12V10H10V12H14Z"
                                fill="currentColor"></path>
                            <path
                                d="M13 2C13 2.55228 12.5523 3 12 3C11.4477 3 11 2.55228 11 2C11 1.44772 11.4477 1 12 1C12.5523 1 13 1.44772 13 2Z"
                                fill="currentColor"></path>
                            <path
                                d="M16 4C16 4.55228 15.5523 5 15 5C14.4477 5 14 4.55228 14 4C14 3.44772 14.4477 3 15 3C15.5523 3 16 3.44772 16 4Z"
                                fill="currentColor" opacity="0.5"></path>
                        </svg>
                    </div>
                    <h1 className="font-mystical text-2xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-gray-200 dark:to-gray-400 drop-shadow-sm select-none">
                        Djinni
                    </h1>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-1">


                    {!isLoggedIn && (
                        <>
                            <Link to="/login"
                                  className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors group">
                                Login
                                <span
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-1/2 opacity-0 group-hover:opacity-100"></span>
                            </Link>
                            <Link to="/register"
                                  className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors group">
                                Register
                                <span
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-1/2 opacity-0 group-hover:opacity-100"></span>
                            </Link>
                        </>
                    )}

                    {isLoggedIn && (
                        ['Games', 'Character', 'Monster'].map((item) => (
                            <Link key={item} to={`/${item.toLowerCase()}`}
                                  className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors group">
                                {item}
                                <span
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-1/2 opacity-0 group-hover:opacity-100"></span>
                            </Link>
                        ))
                    )}

                    {isLoggedIn && (
                        < button onClick={handleLogout} className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors group">
                        Logout
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-red-500 rounded-full transition-all duration-300 group-hover:w-1/2 opacity-0 group-hover:opacity-100"></span>
                        </button>
                        )}
                </nav>

                {/* User Actions */}
                <div className="flex items-center gap-5">
                    {isLoggedIn && (
                        <>
                            <button onClick={handleCreateGameClick}
                                    className="hidden sm:flex items-center gap-2 bg-primary text-[#112217] px-5 py-2.5 rounded-lg text-sm font-bold shadow-glow hover:shadow-glow-hover hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0">
                                <span className="material-symbols-outlined text-[20px] font-bold">add_circle</span>
                                <span>Create Game</span>
                            </button>

                            <button aria-label="Notifications"
                                    className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#23482f] hover:text-primary dark:hover:text-white transition-colors group">
                                <span className="material-symbols-outlined text-[24px]">notifications</span>
                                <span
                                    className="absolute top-2 right-2.5 size-2 bg-primary rounded-full ring-2 ring-white dark:ring-[#102216]"></span>
                            </button>

                            <div className="relative group">
                                <button className="flex items-center gap-2 focus:outline-none">
                                    <div className="relative">
                                        <div
                                            className="size-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors bg-gray-200">
                                            <img
                                                alt="User avatar"
                                                className="w-full h-full object-cover"
                                                src={userAvatar || "https://ui-avatars.com/api/?name=User&background=random"}
                                            />
                                        </div>
                                        <div
                                            className="absolute bottom-0 right-0 size-3 bg-primary border-2 border-white dark:border-[#102216] rounded-full"></div>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <CreateGameModal
                isOpen={showCreateGameModal}
                onClose={handleCloseModal}
            />
        </header>
    );
}
