import { useEffect, useRef, useCallback } from 'react';

/**
 * Helper for "start a drag on mousedown, listen on the document for move/up" patterns.
 *
 *   const { startDrag } = useDragListeners();
 *   <div onMouseDown={(e) => startDrag(e, {
 *     onMove: (ev) => setPos({ x: ev.clientX, y: ev.clientY }),
 *     onEnd:  () => commitPosition(),
 *   })}/>
 *
 * The hook adds a window `blur` listener as a safety net — if the user switches tabs
 * mid-drag we end the drag instead of leaking listeners.
 *
 * The drag is also force-cancelled if the component unmounts mid-drag.
 */
export function useDragListeners() {
    const cleanupRef = useRef(null);

    const endCurrent = useCallback(() => {
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
    }, []);

    const startDrag = useCallback((event, { onMove, onEnd, preventDefault = true } = {}) => {
        if (preventDefault) event.preventDefault?.();
        endCurrent();
        const handleMove = (ev) => { try { onMove?.(ev); } catch (err) { console.error('drag onMove error:', err); } };
        const handleEnd = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('blur', handleEnd);
            cleanupRef.current = null;
            try { onEnd?.(); } catch (err) { console.error('drag onEnd error:', err); }
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        window.addEventListener('blur', handleEnd);
        cleanupRef.current = handleEnd;
    }, [endCurrent]);

    useEffect(() => () => endCurrent(), [endCurrent]);

    return { startDrag };
}

export default useDragListeners;
