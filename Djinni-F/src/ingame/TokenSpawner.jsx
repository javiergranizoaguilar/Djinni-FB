import React from 'react';

const TOKENS = [
    { color: 'red',    label: 'Rojo',     hex: '#EF4444' },
    { color: 'blue',   label: 'Azul',     hex: '#3B82F6' },
    { color: 'green',  label: 'Verde',    hex: '#22C55E' },
    { color: 'yellow', label: 'Amarillo', hex: '#EAB308' },
];

export default function TokenSpawner() {
    return (
        <div style={{ padding: 12 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Tokens
            </p>
            <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>
                Arrastra al tablero
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TOKENS.map(({ color, label, hex }) => (
                    <div
                        key={color}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('tokenType', color)}
                        title={label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 8px',
                            borderRadius: 6,
                            cursor: 'grab',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid #1e293b',
                            transition: 'background 0.15s',
                            userSelect: 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: hex,
                            flexShrink: 0,
                            boxShadow: `0 0 8px ${hex}66`,
                        }} />
                        <span style={{ color: '#cbd5e1', fontSize: 13 }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
