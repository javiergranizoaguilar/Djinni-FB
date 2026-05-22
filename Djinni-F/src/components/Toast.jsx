import React, { useState, useCallback, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const [toast, setToast] = useState(null);
    const show = useCallback((message, kind = 'ok', ms = 1800) => {
        setToast({ message, kind, id: Date.now() });
        if (ms > 0) {
            const t = setTimeout(() => setToast(null), ms);
            return () => clearTimeout(t);
        }
    }, []);
    const hide = useCallback(() => setToast(null), []);
    return { toast, show, hide };
}

export function Toast({ toast, onClose }) {
    useEffect(() => {
        if (!toast) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [toast, onClose]);

    if (!toast) return null;
    const cls = toast.kind === 'err' ? 'toast-base toast-err' : 'toast-base toast-ok';
    const icon = toast.kind === 'err' ? 'error' : 'check_circle';
    return (
        <div key={toast.id} className={`${cls} animate-toast-in`} role="status" aria-live="polite">
            <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
                onClick={onClose}
                aria-label="Cerrar notificación"
                style={{
                    background: 'transparent', border: 'none', color: 'inherit',
                    fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: '0 2px',
                }}
            >×</button>
        </div>
    );
}

export default Toast;
