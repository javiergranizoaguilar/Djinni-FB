export default function Footer() {
    return (
        <footer
            className="relative w-full bg-background-light dark:bg-background-dark border-t border-primary/20 mt-auto">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

            <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
                <div className="flex flex-col justify-between xl:grid xl:grid-cols-4 xl:gap-8">
                    <div className="space-y-8 xl:col-span-1">
                        <div className="flex items-center justify-center gap-4">
                            {/* Icono */}
                            <div className="relative size-10 flex items-center justify-center text-primary transition-transform group-hover:scale-110 duration-300">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity"></div>
                                <svg className="relative z-10 w-8 h-8" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 8C20.6569 8 22 9.34315 22 11C22 12.6569 20.6569 14 19 14H18V18C18 19.1046 17.1046 20 16 20H4C2.89543 20 2 19.1046 2 18V11C2 9.89543 2.89543 9 4 9H6.17071C6.58254 9 6.96327 8.78368 7.1691 8.4237L7.76442 7.3821C8.35974 6.3405 9.46091 5.71509 10.6517 5.71509H12.5C13.8807 5.71509 15 6.83438 15 8.21509V8H19ZM4 11V18H16V14H6V11H4ZM14 12V10H10V12H14Z" fill="currentColor"></path>
                                    <path d="M13 2C13 2.55228 12.5523 3 12 3C11.4477 3 11 2.55228 11 2C11 1.44772 11.4477 1 12 1C12.5523 1 13 1.44772 13 2Z" fill="currentColor"></path>
                                    <path d="M16 4C16 4.55228 15.5523 5 15 5C14.4477 5 14 4.55228 14 4C14 3.44772 14.4477 3 15 3C15.5523 3 16 3.44772 16 4Z" fill="currentColor" opacity="0.5"></path>
                                </svg>
                            </div>

                            {/* Texto */}
                            <h1 className="font-mystical text-2xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-gray-200 dark:to-gray-400 drop-shadow-sm select-none">
                                Djinni
                            </h1>
                        </div>
                        <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                            Forging worlds, one pixel at a time. El destino final para desarrolladores indie.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">public</span>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">photo_camera</span>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">alternate_email</span>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">code</span>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">smart_display</span>
                            </a>
                        </div>
                    </div>

                    <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:col-span-3 xl:mt-0">
                        <div>
                            <h3 className="text-sm font-bold leading-6 text-primary uppercase tracking-wider">Platform</h3>
                            <ul className="mt-6 space-y-4">
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Download
                                    App</a></li>
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Web
                                    Browser</a></li>
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">System
                                    Requirements</a></li>
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Release
                                    Notes</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold leading-6 text-primary uppercase tracking-wider">Support</h3>
                            <ul className="mt-6 space-y-4">
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Help
                                    Center</a></li>
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Tutorial
                                    Videos</a></li>
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">API
                                    Documentation</a></li>
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Community
                                    Forum</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold leading-6 text-primary uppercase tracking-wider">Company</h3>
                            <ul className="mt-6 space-y-4">
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">About
                                    Us</a></li>
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Press
                                    Kit</a></li>
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Careers</a>
                                </li>
                                <li><a href="#"
                                       className="text-sm leading-6 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">Contact</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div
                    className="mt-16 border-t border-primary/20 pt-8 text-center text-xs text-gray-600 dark:text-gray-400">
                    <p>© 2024 Indie World Inc. Todos los derechos reservados. Creado con Tailwind CSS.</p>
                </div>
            </div>
        </footer>
    );
}