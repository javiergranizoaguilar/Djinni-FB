import { useCallback, useEffect, useRef } from 'react';

/**
 * Debounced save with abort + flush-on-unmount.
 *
 *   const { schedule, flush } = useDebouncedSave(async (data, { signal }) => {
 *     await axios.post('/api/...', data, { signal });
 *   }, 1500);
 *   schedule(formData);   // resets the debounce; new typing pushes the save further out
 *   await flush();        // cancels the pending timer and runs the save immediately
 *
 * Notes:
 *  - Each new schedule() cancels the previous AbortController so in-flight requests are dropped.
 *  - flush() awaits the in-flight save. On unmount the pending timer is cleared (no flush) —
 *    callers that want to persist on close should await flush() themselves first.
 */
export function useDebouncedSave(saveFn, delay = 1500) {
    const timerRef = useRef(null);
    const pendingRef = useRef(null);
    const controllerRef = useRef(null);
    const fnRef = useRef(saveFn);
    useEffect(() => { fnRef.current = saveFn; }, [saveFn]);

    const runNow = useCallback(async (data) => {
        if (controllerRef.current) controllerRef.current.abort();
        const ctrl = new AbortController();
        controllerRef.current = ctrl;
        try {
            await fnRef.current(data, { signal: ctrl.signal });
        } finally {
            if (controllerRef.current === ctrl) controllerRef.current = null;
        }
    }, []);

    const schedule = useCallback((data) => {
        pendingRef.current = data;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            timerRef.current = null;
            const snapshot = pendingRef.current;
            pendingRef.current = null;
            await runNow(snapshot);
        }, delay);
    }, [delay, runNow]);

    const flush = useCallback(async () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        const snapshot = pendingRef.current;
        pendingRef.current = null;
        if (snapshot !== null && snapshot !== undefined) {
            await runNow(snapshot);
        }
    }, [runNow]);

    useEffect(() => () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        if (controllerRef.current) { controllerRef.current.abort(); controllerRef.current = null; }
    }, []);

    return { schedule, flush };
}

export default useDebouncedSave;
