import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8081';

export default function ChatTab({ gameId }) {
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

    // Auto-scroll on new message
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const rollDice = (expr) => {
        const m = expr.match(/^(\d+)[dD](\d+)$/);
        if (!m) return null;
        const n = parseInt(m[1], 10);
        const faces = parseInt(m[2], 10);
        if (n < 1 || faces < 1) return null;
        const rolls = Array.from({ length: n }, () => Math.floor(Math.random() * faces) + 1);
        const sum = rolls.reduce((a, b) => a + b, 0);
        return n > 1
            ? `🎲 ${expr}: ${rolls.join(', ')} (Total: ${sum})`
            : `🎲 ${expr}: ${rolls[0]}`;
    };

    const send = () => {
        let content = input.trim();
        if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (content.startsWith('/r ')) {
            const result = rollDice(content.slice(3).trim());
            if (result) content = result;
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
                {messages.map((m, i) => (
                    <div key={m.id ?? i} style={{ lineHeight: 1.4, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                            {m.senderName}
                        </span>
                        {m.createdAt && (
                            <span style={{ color: '#475569', fontSize: 10, marginLeft: 6 }}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 2, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {m.content}
                        </div>
                    </div>
                ))}
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
