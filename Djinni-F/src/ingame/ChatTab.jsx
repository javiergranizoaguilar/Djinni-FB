import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8081';

function RollTooltip({ raw, mod, children, color, textShadow, fontSize, fontWeight }) {
    const [show, setShow] = useState(false);
    if (raw == null) return <span style={{ color, textShadow, fontSize, fontWeight, lineHeight: 1 }}>{children}</span>;
    const rawLabel = Array.isArray(raw) ? raw.join(', ') : raw;
    const label = mod ? `(${rawLabel})${mod >= 0 ? '+' : ''}${mod}` : `(${rawLabel})`;
    return (
        <span style={{ position: 'relative', cursor: 'help' }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span style={{ color, textShadow, fontSize, fontWeight, lineHeight: 1 }}>{children}</span>
            {show && (
                <span style={{
                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                    background: '#1e293b', border: '1px solid #475569', borderRadius: 4,
                    padding: '2px 7px', fontSize: 11, color: '#cbd5e1', whiteSpace: 'nowrap',
                    pointerEvents: 'none', zIndex: 9999, marginBottom: 4,
                }}>
                    {label}
                </span>
            )}
        </span>
    );
}

export default function ChatTab({ gameId, isActive }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [connected, setConnected] = useState(false);
    const listRef = useRef(null);
    const wsRef   = useRef(null);

    useEffect(() => {
        axios.get(`${API}/api/game/${gameId}/messages`)
            .then(r => setMessages(r.data))
            .catch(() => {});

        let ws = null;
        let destroyed = false;
        let attempts = 0;
        let connectTimer = null;

        const connect = () => {
            ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                attempts = 0;
                ws.send(JSON.stringify({ type: 'auth', token: localStorage.getItem('vtt_token'), gameId }));
                setConnected(true);
            };

            ws.onmessage = (e) => {
                const msg = JSON.parse(e.data);
                if (msg.type === 'message') setMessages(prev => [...prev, msg]);
            };

            ws.onerror = () => {};
            ws.onclose = () => {
                setConnected(false);
                if (destroyed) return;
                if (attempts < 5) {
                    const delay = Math.pow(2, attempts) * 1000;
                    attempts++;
                    connectTimer = setTimeout(connect, delay);
                }
            };
        };

        connectTimer = setTimeout(connect, 0);

        return () => {
            destroyed = true;
            clearTimeout(connectTimer);
            ws?.close();
        };
    }, [gameId]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    // Scroll to bottom when tab becomes visible (display:none had wrong scrollHeight)
    useLayoutEffect(() => {
        if (isActive && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [isActive]);

    const rollDice = (expr) => {
        const m = expr.match(/^(\d+)[dD](\d+)$/);
        if (!m) return null;
        const n = parseInt(m[1], 10);
        const faces = parseInt(m[2], 10);
        if (n < 1 || faces < 1) return null;
        const rolls = Array.from({ length: n }, () => Math.floor(Math.random() * faces) + 1);
        const total = rolls.reduce((a, b) => a + b, 0);
        return { type: 'dice_roll', expr, rolls, total, mod: 0 };
    };

    const send = () => {
        let content = input.trim();
        if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (content.startsWith('/r ')) {
            const result = rollDice(content.slice(3).trim());
            if (result) content = JSON.stringify(result);
        }
        wsRef.current.send(JSON.stringify({ type: 'message', content }));
        setInput('');
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
            background: '#0f172a', color: '#e2e8f0', overflowX: 'hidden', minWidth: 0,
        }}>
            {/* Status */}
            <div style={{
                padding: '4px 8px', fontSize: 11,
                color: connected ? '#22c55e' : '#ef4444',
                borderBottom: '1px solid #2d3e50',
            }}>
                {connected ? '● Conectado' : '○ Desconectado'}
            </div>

            {/* Message list */}
            <div ref={listRef} style={{
                flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px',
                display: 'flex', flexDirection: 'column', gap: 6,
            }}>
                {messages.map((m, i) => {
                    let parsed = null;
                    try { parsed = JSON.parse(m.content); } catch {}
                    const isRoll = parsed?.type === 'attack_roll';
                    const isDiceRoll = parsed?.type === 'dice_roll';
                    return (
                        <div key={m.id ?? i} style={{ lineHeight: 1.4, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{m.senderName}</span>
                            {m.createdAt && (
                                <span style={{ color: '#475569', fontSize: 10, marginLeft: 6 }}>
                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            {isRoll ? (
                                <div style={{
                                    marginTop: 4,
                                    background: 'linear-gradient(135deg, #1e1b2e 0%, #12172a 100%)',
                                    border: '1px solid #7c3aed55',
                                    borderLeft: '3px solid #f59e0b',
                                    borderRadius: 6,
                                    padding: '8px 10px',
                                    display: 'flex', flexDirection: 'column', gap: 4,
                                }}>
                                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13, letterSpacing: '0.03em' }}>
                                        ⚔️ {parsed.name}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                        <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ataque</span>
                                        <RollTooltip
                                            raw={parsed.attackRaw} mod={parsed.attackMod}
                                            color={parsed.attackCrit === 'max' ? '#4ade80' : parsed.attackCrit === 'min' ? '#f87171' : '#fbbf24'}
                                            textShadow={parsed.attackCrit ? `0 0 8px ${parsed.attackCrit === 'max' ? '#4ade80' : '#f87171'}` : 'none'}
                                            fontSize={22} fontWeight={800}
                                        >{parsed.attack}</RollTooltip>
                                    </div>
                                    {parsed.damage !== null && (
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daño</span>
                                            <RollTooltip
                                                raw={parsed.dmgRaw} mod={parsed.dmgMod}
                                                color={parsed.dmgCrit === 'max' ? '#4ade80' : '#f87171'}
                                                textShadow={parsed.dmgCrit ? `0 0 8px ${parsed.dmgCrit === 'max' ? '#4ade80' : '#ef4444'}` : 'none'}
                                                fontSize={18} fontWeight={700}
                                            >{parsed.damage}</RollTooltip>
                                            {parsed.dmgType && <span style={{ color: '#6b7280', fontSize: 11 }}>{parsed.dmgType}</span>}
                                        </div>
                                    )}
                                    {parsed.damage2 !== null && parsed.damage2 !== undefined && (
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daño 2</span>
                                            <RollTooltip
                                                raw={parsed.dmg2Raw} mod={parsed.dmg2Mod}
                                                color={parsed.dmg2Crit === 'max' ? '#4ade80' : parsed.dmg2Crit === 'min' ? '#f87171' : '#fb923c'}
                                                textShadow={parsed.dmg2Crit ? `0 0 8px ${parsed.dmg2Crit === 'max' ? '#4ade80' : '#ef4444'}` : 'none'}
                                                fontSize={18} fontWeight={700}
                                            >{parsed.damage2}</RollTooltip>
                                            {parsed.dmgType2 && <span style={{ color: '#6b7280', fontSize: 11 }}>{parsed.dmgType2}</span>}
                                        </div>
                                    )}
                                </div>
                            ) : isDiceRoll ? (
                                <div style={{
                                    marginTop: 4,
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderLeft: '3px solid #818cf8',
                                    borderRadius: 6,
                                    padding: '6px 10px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                }}>
                                    <span style={{ color: '#818cf8', fontSize: 13, whiteSpace: 'pre-line', textAlign: 'center' }}>🎲 {parsed.expr}</span>
                                    <RollTooltip
                                        raw={parsed.rolls} mod={parsed.mod || null}
                                        color="#e2e8f0" fontSize={18} fontWeight={700}
                                    >{parsed.total}</RollTooltip>
                                </div>
                            ) : (
                                <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 2, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                    {m.content}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Input row */}
            <div style={{
                display: 'flex', gap: 4, padding: '6px 8px',
                borderTop: '1px solid #2d3e50', flexShrink: 0,
            }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Mensaje…"
                    style={{
                        flex: 1, minWidth: 0, background: '#1e293b', color: '#e2e8f0',
                        border: '1px solid #334155', borderRadius: 4,
                        padding: '4px 8px', fontSize: 13, outline: 'none',
                    }}
                />
                <button
                    onClick={send}
                    style={{
                        flexShrink: 0, padding: '4px 10px', borderRadius: 4, fontSize: 12,
                        background: '#3b82f6', color: 'white',
                        border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}
