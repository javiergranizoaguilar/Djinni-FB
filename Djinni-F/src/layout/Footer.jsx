export default function Footer() {
    return (
        <footer className="relative w-full mt-auto" style={{ background: '#060d08', borderTop: '1px solid rgba(34,197,94,0.08)' }}>
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.04) 0%, transparent 70%)' }}>
            </div>

            <div className="relative mx-auto max-w-5xl px-6 py-12 lg:px-8">
                {/* Brand + divider */}
                <div className="flex flex-col items-center gap-4 mb-10">
                    <div className="flex items-center gap-3">
                        <div className="relative size-8 flex items-center justify-center text-primary">
                            <div className="absolute inset-0 bg-primary/15 rounded-full blur-md"></div>
                            <svg className="relative z-10 w-6 h-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 8C20.6569 8 22 9.34315 22 11C22 12.6569 20.6569 14 19 14H18V18C18 19.1046 17.1046 20 16 20H4C2.89543 20 2 19.1046 2 18V11C2 9.89543 2.89543 9 4 9H6.17071C6.58254 9 6.96327 8.78368 7.1691 8.4237L7.76442 7.3821C8.35974 6.3405 9.46091 5.71509 10.6517 5.71509H12.5C13.8807 5.71509 15 6.83438 15 8.21509V8H19ZM4 11V18H16V14H6V11H4ZM14 12V10H10V12H14Z" fill="currentColor"/>
                                <path d="M13 2C13 2.55228 12.5523 3 12 3C11.4477 3 11 2.55228 11 2C11 1.44772 11.4477 1 12 1C12.5523 1 13 1.44772 13 2Z" fill="currentColor"/>
                                <path d="M16 4C16 4.55228 15.5523 5 15 5C14.4477 5 14 4.55228 14 4C14 3.44772 14.4477 3 15 3C15.5523 3 16 3.44772 16 4Z" fill="currentColor" opacity="0.4"/>
                            </svg>
                        </div>
                        <span className="font-mystical text-lg tracking-widest text-text-hi select-none">Djinni</span>
                    </div>

                    <p className="text-xs text-text-lo text-center max-w-xs leading-relaxed">
                        Plataforma de rol online. Forja mundos, crea héroes, vive aventuras.
                    </p>

                    <div className="flex gap-5">
                        {['public','photo_camera','alternate_email','code'].map(icon => (
                            <a key={icon} href="#" className="text-text-lo hover:text-primary transition-colors duration-200">
                                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Rune divider */}
                <div className="rune-divider mb-6">◆</div>

                {/* Footer links */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-10 text-sm">
                    <div>
                        <h3 className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Plataforma</h3>
                        <ul className="space-y-2">
                            {['Web App','Requisitos','Changelog'].map(l => (
                                <li key={l}><a href="#" className="text-text-lo hover:text-text-med transition-colors">{l}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Soporte</h3>
                        <ul className="space-y-2">
                            {['Ayuda','Tutoriales','Comunidad'].map(l => (
                                <li key={l}><a href="#" className="text-text-lo hover:text-text-med transition-colors">{l}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <h3 className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Proyecto</h3>
                        <ul className="space-y-2">
                            {['Acerca de','Contacto'].map(l => (
                                <li key={l}><a href="#" className="text-text-lo hover:text-text-med transition-colors">{l}</a></li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="text-center text-[11px] text-text-lo" style={{ borderTop: '1px solid rgba(34,197,94,0.07)', paddingTop: '1.5rem' }}>
                    © {new Date().getFullYear()} Djinni. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
}
