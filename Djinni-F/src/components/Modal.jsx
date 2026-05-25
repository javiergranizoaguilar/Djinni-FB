import React, { useEffect, useRef } from 'react';

/**
 * Accessible modal wrapper: role="dialog", aria-modal, Escape closes,
 * focus is moved into the dialog on open and trapped while open.
 *
 * Drop-in replacement for the manual overlay+box pattern used across pages.
 *
 *  <Modal isOpen={open} onClose={...} ariaLabel="Crear partida">
 *    ...content...
 *  </Modal>
 */
export default function Modal({ isOpen, onClose, ariaLabel, ariaLabelledBy, children, className = '', containerClassName = '' }) {
    const dialogRef = useRef(null);
    const previouslyFocusedRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;
        previouslyFocusedRef.current = document.activeElement;
        document.body.style.overflow = 'hidden';

        const dialog = dialogRef.current;
        if (dialog) {
            // Focus the first focusable element (or the dialog itself as fallback).
            const focusable = dialog.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            (focusable || dialog).focus();
        }

        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose?.();
                return;
            }
            if (e.key !== 'Tab') return;
            // Focus trap
            const root = dialogRef.current;
            if (!root) return;
            const focusables = Array.from(root.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            ));
            if (focusables.length === 0) { e.preventDefault(); return; }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
            else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
            const prev = previouslyFocusedRef.current;
            if (prev && typeof prev.focus === 'function') prev.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 ${containerClassName}`}
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                tabIndex={-1}
                className={`outline-none ${className}`}
            >
                {children}
            </div>
        </div>
    );
}
