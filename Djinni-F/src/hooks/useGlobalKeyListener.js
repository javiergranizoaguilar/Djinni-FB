import { useEffect, useRef } from 'react';

/**
 * Subscribe a callback to `window.keydown`, with safe cleanup. `enabled` defaults to true.
 * The callback ref is kept fresh without re-registering the listener, so handlers can
 * reference latest props/state without stale closures.
 *
 *   useGlobalKeyListener((e) => {
 *     if (e.key === 'Escape') onClose();
 *   }, [onClose], modalIsOpen);
 */
export function useGlobalKeyListener(handler, deps = [], enabled = true) {
    const handlerRef = useRef(handler);
    useEffect(() => { handlerRef.current = handler; }, [handler]);

    useEffect(() => {
        if (!enabled) return undefined;
        const onKey = (e) => handlerRef.current?.(e);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, ...deps]);
}

export default useGlobalKeyListener;
