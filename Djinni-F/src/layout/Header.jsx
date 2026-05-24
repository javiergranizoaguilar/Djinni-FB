import {Link, useLocation, useNavigate} from 'react-router-dom';
import {useEffect, useRef, useState} from 'react';
import axios from 'axios';
import CreateGameModal from '../pages/CreateGameModal.jsx';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userAvatar, setUserAvatar] = useState(null);
    const [showCreateGameModal, setShowCreateGameModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const checkLoginStatus = async () => {
        const token = localStorage.getItem('vtt_token');
        if (token) {
            setIsLoggedIn(true);
            try {
                const response = await axios.get('http://localhost:8000/api/user/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data && response.data.avatar_url) {
                    const avatarUrl = response.data.avatar_url.startsWith('/uploads')
                        ? `http://localhost:8000${response.data.avatar_url}`
                        : response.data.avatar_url;
                    setUserAvatar(avatarUrl);
                } else {
                    setUserAvatar(null);
                }
            } catch { /* ignore */ }
        } else {
            setIsLoggedIn(false);
            setUserAvatar(null);
        }
    };

    useEffect(() => {
        checkLoginStatus();
        setIsMobileMenuOpen(false);
    }, [location]);

    useEffect(() => {
        const handleStorageChange = () => { checkLoginStatus(); };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('auth-change', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-change', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        if (!isUserMenuOpen) return;
        const onClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        const onKey = (e) => { if (e.key === 'Escape') setIsUserMenuOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [isUserMenuOpen]);

    useEffect(() => { setIsUserMenuOpen(false); }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('vtt_token');
        window.dispatchEvent(new Event('auth-change'));
        setIsLoggedIn(false);
        setUserAvatar(null);
        navigate('/login');
    };

    const handleCreateGameClick = () => {
        setShowCreateGameModal(true);
        setIsMobileMenuOpen(false);
    };

    const handleCloseModal = () => { setShowCreateGameModal(false); };
    const toggleMobileMenu = () => { setIsMobileMenuOpen(!isMobileMenuOpen); };

    const navLinkClass = "relative px-4 py-2 text-sm font-medium text-text-lo hover:text-primary-light transition-colors duration-200 group tracking-wide";
    const navUnderline = "absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-primary rounded-full transition-all duration-300 group-hover:w-2/3 opacity-0 group-hover:opacity-100";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-surface-base/90 backdrop-blur-md"
            style={{ borderBottom: '1px solid rgba(34,197,94,0.1)', boxShadow: '0 1px 0 rgba(34,197,94,0.06), 0 4px 24px rgba(0,0,0,0.6)' }}>
            <div className="max-w-[1440px] mx-auto px-5 sm:px-6 h-[72px] flex items-center justify-between gap-4">

                {/* Logo */}
                <Link to="/Games" className="flex items-center gap-3 group cursor-pointer flex-shrink-0">
                    <div className="relative size-9 flex items-center justify-center text-primary transition-transform group-hover:scale-110 duration-300 animate-glow-pulse">
                        <div className="absolute inset-0 bg-primary/15 rounded-full blur-md"></div>
                        <svg className="relative z-10 w-7 h-7" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 8C20.6569 8 22 9.34315 22 11C22 12.6569 20.6569 14 19 14H18V18C18 19.1046 17.1046 20 16 20H4C2.89543 20 2 19.1046 2 18V11C2 9.89543 2.89543 9 4 9H6.17071C6.58254 9 6.96327 8.78368 7.1691 8.4237L7.76442 7.3821C8.35974 6.3405 9.46091 5.71509 10.6517 5.71509H12.5C13.8807 5.71509 15 6.83438 15 8.21509V8H19ZM4 11V18H16V14H6V11H4ZM14 12V10H10V12H14Z" fill="currentColor"/>
                            <path d="M13 2C13 2.55228 12.5523 3 12 3C11.4477 3 11 2.55228 11 2C11 1.44772 11.4477 1 12 1C12.5523 1 13 1.44772 13 2Z" fill="currentColor"/>
                            <path d="M16 4C16 4.55228 15.5523 5 15 5C14.4477 5 14 4.55228 14 4C14 3.44772 14.4477 3 15 3C15.5523 3 16 3.44772 16 4Z" fill="currentColor" opacity="0.5"/>
                        </svg>
                    </div>
                    <span className="font-mystical text-xl tracking-widest text-text-hi select-none group-hover:text-primary-light transition-colors duration-300">
                        Djinni
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
                    {!isLoggedIn && (
                        <>
                            <Link to="/login" className={navLinkClass}>
                                Login <span className={navUnderline}></span>
                            </Link>
                            <Link to="/register" className={navLinkClass}>
                                Register <span className={navUnderline}></span>
                            </Link>
                        </>
                    )}
                    {isLoggedIn && (
                        <>
                            <Link to="/Games" className={navLinkClass}>
                                Games <span className={navUnderline}></span>
                            </Link>
                            <Link to="/Character" className={navLinkClass}>
                                Personajes <span className={navUnderline}></span>
                            </Link>
                            <Link to="/Monster" className={navLinkClass}>
                                Monstruos <span className={navUnderline}></span>
                            </Link>
                            <button onClick={handleLogout} className={`${navLinkClass} hover:text-red-400`}>
                                Salir <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-red-500 rounded-full transition-all duration-300 group-hover:w-2/3 opacity-0 group-hover:opacity-100"></span>
                            </button>
                        </>
                    )}
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {isLoggedIn && (
                        <>
                            <button onClick={handleCreateGameClick}
                                className="hidden md:inline-flex arcane-btn text-sm px-4 py-2">
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                <span>Nueva Partida</span>
                            </button>

                            <div className="hidden md:block relative" ref={userMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsUserMenuOpen(v => !v)}
                                    aria-haspopup="menu"
                                    aria-expanded={isUserMenuOpen}
                                    className="size-9 rounded-full overflow-hidden border border-border-md hover:border-primary/50 transition-colors cursor-pointer block"
                                    style={{ boxShadow: '0 0 0 2px rgba(34,197,94,0.08)' }}
                                >
                                    <img
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                        src={userAvatar || "https://ui-avatars.com/api/?name=U&background=0d1f10&color=22c55e"}
                                    />
                                </button>
                                <span className="absolute bottom-0 right-0 size-2.5 bg-primary border-2 border-surface-base rounded-full pointer-events-none"></span>
                                {isUserMenuOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 mt-2 w-52 bg-surface-base/95 backdrop-blur-md rounded-lg overflow-hidden animate-fade-in"
                                        style={{ border: '1px solid rgba(34,197,94,0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
                                    >
                                        <button
                                            role="menuitem"
                                            onClick={() => { setIsUserMenuOpen(false); navigate('/account/settings'); }}
                                            className="w-full text-left px-4 py-3 text-sm text-text-med hover:bg-surface-hi hover:text-text-hi font-medium transition-colors flex items-center gap-3"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                                            Ajustes de cuenta
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-2 text-text-lo hover:text-primary transition-colors"
                        aria-label="Toggle menu"
                    >
                        <span className="material-symbols-outlined text-[28px]">
                            {isMobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-[71px] left-0 right-0 bg-surface-base/95 backdrop-blur-md animate-fade-in"
                    style={{ borderBottom: '1px solid rgba(34,197,94,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                    <div className="flex flex-col p-4 gap-1">
                        {isLoggedIn && (
                            <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
                                <div className="size-9 rounded-full overflow-hidden border border-border-md">
                                    <img alt="Avatar" className="w-full h-full object-cover"
                                        src={userAvatar || "https://ui-avatars.com/api/?name=U&background=0d1f10&color=22c55e"} />
                                </div>
                                <span className="font-medium text-text-hi text-sm">Mi Perfil</span>
                            </div>
                        )}

                        {!isLoggedIn && (
                            <>
                                <Link to="/login" className="px-4 py-3 rounded-lg hover:bg-surface-hi text-text-med hover:text-text-hi font-medium text-sm transition-colors flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px]">login</span> Login
                                </Link>
                                <Link to="/register" className="px-4 py-3 rounded-lg hover:bg-surface-hi text-text-med hover:text-text-hi font-medium text-sm transition-colors flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px]">person_add</span> Register
                                </Link>
                            </>
                        )}

                        {isLoggedIn && (
                            <>
                                <Link to="/Games" className="px-4 py-3 rounded-lg hover:bg-surface-hi text-text-med hover:text-text-hi font-medium text-sm transition-colors flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px]">casino</span> Partidas
                                </Link>
                                <Link to="/Character" className="px-4 py-3 rounded-lg hover:bg-surface-hi text-text-med hover:text-text-hi font-medium text-sm transition-colors flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px]">person</span> Personajes
                                </Link>
                                <Link to="/Monster" className="px-4 py-3 rounded-lg hover:bg-surface-hi text-text-med hover:text-text-hi font-medium text-sm transition-colors flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px]">pest_control</span> Monstruos
                                </Link>

                                <button onClick={handleCreateGameClick}
                                    className="mx-1 mt-2 arcane-btn justify-center py-3">
                                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                    Nueva Partida
                                </button>

                                <button onClick={handleLogout}
                                    className="px-4 py-3 rounded-lg hover:bg-red-900/20 text-red-500 hover:text-red-400 font-medium text-sm transition-colors flex items-center gap-3 mt-1">
                                    <span className="material-symbols-outlined text-[20px]">logout</span> Salir
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <CreateGameModal isOpen={showCreateGameModal} onClose={handleCloseModal} />
        </header>
    );
}
