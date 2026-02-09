import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

function MainLayout() {
    return (
        // Estas clases venían del <body> en tu HTML original
        <main className="bg-background-light dark:bg-background-dark font-display min-h-screen text-slate-900 dark:text-white flex flex-col pt-20">
                {/* Aquí se renderizarán tus páginas (Home, Editor, etc.) */}
                <Outlet />
            </main>
    );
}

export default MainLayout;